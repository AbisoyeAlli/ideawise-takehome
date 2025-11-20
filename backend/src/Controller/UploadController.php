<?php

namespace App\Controller;

use App\Entity\Upload;
use App\Repository\UploadRepository;
use App\Service\ChunkManagerService;
use App\Service\FileValidationService;
use App\Service\StorageService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/upload', name: 'api_upload_')]
class UploadController extends AbstractController
{
    public function __construct(
        private readonly FileValidationService $validationService,
        private readonly ChunkManagerService $chunkManager,
        private readonly StorageService $storageService,
        private readonly EntityManagerInterface $entityManager,
        private readonly UploadRepository $uploadRepository,
        private readonly LoggerInterface $logger,
        private readonly RateLimiterFactory $uploadApiLimiter,
        private readonly int $chunkSize
    ) {
    }

    #[Route('/initiate', name: 'initiate', methods: ['POST'])]
    public function initiate(Request $request): JsonResponse
    {
        $limiter = $this->uploadApiLimiter->create($request->getClientIp() ?? 'unknown');
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json([
                'error' => 'Too many requests. Please try again later.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        try {
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return $this->json([
                    'error' => 'Invalid JSON payload',
                ], Response::HTTP_BAD_REQUEST);
            }

            $requiredFields = ['filename', 'filesize', 'mimeType', 'md5Hash'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    return $this->json([
                        'error' => "Missing required field: {$field}",
                    ], Response::HTTP_BAD_REQUEST);
                }
            }

            $filename = $data['filename'];
            $filesize = (int) $data['filesize'];
            $mimeType = $data['mimeType'];
            $md5Hash = $data['md5Hash'];

            // Validate filename
            if (!$this->validationService->validateFilename($filename)) {
                return $this->json([
                    'error' => 'Invalid filename',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Validate file size
            if (!$this->validationService->validateFileSize($filesize)) {
                return $this->json([
                    'error' => 'File size exceeds maximum allowed size',
                    'maxSize' => $this->validationService->getMaxFileSize(),
                ], Response::HTTP_BAD_REQUEST);
            }

            // Validate MIME type
            if (!$this->validationService->validateMimeType($mimeType)) {
                return $this->json([
                    'error' => 'File type not allowed',
                    'allowedTypes' => $this->validationService->getAllowedMimeTypes(),
                ], Response::HTTP_BAD_REQUEST);
            }

            // Check for duplicate file
            $existingUpload = $this->uploadRepository->findByMd5Hash($md5Hash);
            if ($existingUpload) {
                $this->logger->info('Duplicate file detected', [
                    'md5Hash' => $md5Hash,
                    'existingUploadId' => $existingUpload->getUploadId(),
                ]);

                return $this->json([
                    'duplicate' => true,
                    'uploadId' => $existingUpload->getUploadId(),
                    'filePath' => $existingUpload->getFilePath(),
                ], Response::HTTP_OK);
            }

            // Calculate total chunks
            $totalChunks = (int) ceil($filesize / $this->chunkSize);

            // Create upload record
            $uploadId = Uuid::v4()->toRfc4122();
            $upload = new Upload();
            $upload->setUploadId($uploadId);
            $upload->setFilename($filename);
            $upload->setFilesize((string) $filesize);
            $upload->setMimeType($mimeType);
            $upload->setMd5Hash($md5Hash);
            $upload->setTotalChunks($totalChunks);
            $upload->setUploadedChunks(0);
            $upload->setStatus('pending');
            $upload->setIpAddress($request->getClientIp());
            $upload->setUserAgent($request->headers->get('User-Agent'));

            $this->entityManager->persist($upload);
            $this->entityManager->flush();

            // Create upload session in Redis
            $this->chunkManager->createUploadSession($uploadId, [
                'filename' => $filename,
                'filesize' => $filesize,
                'mimeType' => $mimeType,
                'totalChunks' => $totalChunks,
            ]);

            $this->logger->info('Upload initiated', [
                'uploadId' => $uploadId,
                'filename' => $filename,
                'filesize' => $filesize,
                'totalChunks' => $totalChunks,
            ]);

            return $this->json([
                'uploadId' => $uploadId,
                'chunkSize' => $this->chunkSize,
                'totalChunks' => $totalChunks,
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            $this->logger->error('Error initiating upload', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json([
                'error' => 'Internal server error',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/chunk', name: 'chunk', methods: ['POST'])]
    public function uploadChunk(Request $request): JsonResponse
    {
        // Apply rate limiting
        $limiter = $this->uploadApiLimiter->create($request->getClientIp() ?? 'unknown');
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json([
                'error' => 'Too many requests. Please try again later.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        try {
            $uploadId = $request->request->get('uploadId');
            $chunkIndex = (int) $request->request->get('chunkIndex');

            if (!$uploadId || $chunkIndex < 0) {
                return $this->json([
                    'error' => 'Invalid request parameters',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Find upload record
            $upload = $this->uploadRepository->findByUploadId($uploadId);
            if (!$upload) {
                return $this->json([
                    'error' => 'Upload not found',
                ], Response::HTTP_NOT_FOUND);
            }

            // Check if upload is still valid
            if ($upload->getStatus() === 'completed' || $upload->getStatus() === 'failed') {
                return $this->json([
                    'error' => 'Upload already finalized',
                    'status' => $upload->getStatus(),
                ], Response::HTTP_BAD_REQUEST);
            }

            // Get chunk file
            /** @var UploadedFile|null $chunkFile */
            $chunkFile = $request->files->get('chunk');
            if (!$chunkFile) {
                return $this->json([
                    'error' => 'No chunk file provided',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Validate chunk index
            if ($chunkIndex >= $upload->getTotalChunks()) {
                return $this->json([
                    'error' => 'Invalid chunk index',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Check if chunk already uploaded
            if ($this->chunkManager->hasChunk($uploadId, $chunkIndex)) {
                $this->logger->info('Chunk already uploaded', [
                    'uploadId' => $uploadId,
                    'chunkIndex' => $chunkIndex,
                ]);

                return $this->json([
                    'success' => true,
                    'chunkIndex' => $chunkIndex,
                    'alreadyUploaded' => true,
                ], Response::HTTP_OK);
            }

            // Read and save chunk
            $chunkData = file_get_contents($chunkFile->getPathname());
            if ($chunkData === false) {
                return $this->json([
                    'error' => 'Failed to read chunk data',
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            if (!$this->chunkManager->saveChunk($uploadId, $chunkIndex, $chunkData)) {
                return $this->json([
                    'error' => 'Failed to save chunk',
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            // Update upload record
            $uploadedChunks = count($this->chunkManager->getUploadedChunks($uploadId));
            $upload->setUploadedChunks($uploadedChunks);
            $upload->setStatus('uploading');
            $this->entityManager->flush();

            $this->logger->info('Chunk uploaded', [
                'uploadId' => $uploadId,
                'chunkIndex' => $chunkIndex,
                'progress' => $uploadedChunks . '/' . $upload->getTotalChunks(),
            ]);

            return $this->json([
                'success' => true,
                'chunkIndex' => $chunkIndex,
                'uploadedChunks' => $uploadedChunks,
                'totalChunks' => $upload->getTotalChunks(),
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            $this->logger->error('Error uploading chunk', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json([
                'error' => 'Internal server error',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/finalize', name: 'finalize', methods: ['POST'])]
    public function finalize(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!$data || !isset($data['uploadId'])) {
                return $this->json([
                    'error' => 'Invalid request',
                ], Response::HTTP_BAD_REQUEST);
            }

            $uploadId = $data['uploadId'];

            // Find upload record
            $upload = $this->uploadRepository->findByUploadId($uploadId);
            if (!$upload) {
                return $this->json([
                    'error' => 'Upload not found',
                ], Response::HTTP_NOT_FOUND);
            }

            // Verify all chunks are uploaded
            $uploadedChunks = $this->chunkManager->getUploadedChunks($uploadId);
            if (count($uploadedChunks) !== $upload->getTotalChunks()) {
                return $this->json([
                    'error' => 'Not all chunks uploaded',
                    'uploaded' => count($uploadedChunks),
                    'total' => $upload->getTotalChunks(),
                ], Response::HTTP_BAD_REQUEST);
            }

            // Generate file path
            $filePath = $this->storageService->generateFilePath(
                $upload->getFilename(),
                $uploadId
            );

            // Ensure directory exists
            if (!$this->storageService->ensureDirectoryExists($filePath)) {
                return $this->json([
                    'error' => 'Failed to create storage directory',
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            // Reassemble file
            if (!$this->chunkManager->reassembleFile($uploadId, $upload->getTotalChunks(), $filePath)) {
                $upload->setStatus('failed');
                $upload->setErrorMessage('Failed to reassemble file');
                $this->entityManager->flush();

                return $this->json([
                    'error' => 'Failed to reassemble file',
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            // Validate reassembled file with magic number
            $detectedMimeType = $this->storageService->getMimeType($filePath);
            if (!$this->validationService->validateMagicNumber($filePath, $upload->getMimeType())) {
                $this->logger->warning('Magic number validation failed for reassembled file', [
                    'uploadId' => $uploadId,
                    'expectedMimeType' => $upload->getMimeType(),
                    'detectedMimeType' => $detectedMimeType,
                ]);

                // Optionally delete the file and mark upload as failed
                $this->storageService->deleteFile($filePath);
                $upload->setStatus('failed');
                $upload->setErrorMessage('File validation failed');
                $this->entityManager->flush();

                return $this->json([
                    'error' => 'File validation failed',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Verify MD5 hash
            $actualMd5 = $this->storageService->calculateMd5($filePath);
            if ($actualMd5 !== $upload->getMd5Hash()) {
                $this->logger->error('MD5 hash mismatch', [
                    'uploadId' => $uploadId,
                    'expected' => $upload->getMd5Hash(),
                    'actual' => $actualMd5,
                ]);

                $this->storageService->deleteFile($filePath);
                $upload->setStatus('failed');
                $upload->setErrorMessage('File integrity check failed');
                $this->entityManager->flush();

                return $this->json([
                    'error' => 'File integrity check failed',
                ], Response::HTTP_BAD_REQUEST);
            }

            // Update upload record
            $upload->setStatus('completed');
            $upload->setFilePath($filePath);
            $upload->setCompletedAt(new \DateTime());
            $this->entityManager->flush();

            // Cleanup chunks
            $this->chunkManager->cleanupChunks($uploadId);

            $this->logger->info('Upload finalized', [
                'uploadId' => $uploadId,
                'filePath' => $filePath,
            ]);

            return $this->json([
                'success' => true,
                'uploadId' => $uploadId,
                'filePath' => $filePath,
                'filename' => $upload->getFilename(),
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            $this->logger->error('Error finalizing upload', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json([
                'error' => 'Internal server error',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/status/{uploadId}', name: 'status', methods: ['GET'])]
    public function status(string $uploadId): JsonResponse
    {
        try {
            $upload = $this->uploadRepository->findByUploadId($uploadId);

            if (!$upload) {
                return $this->json([
                    'error' => 'Upload not found',
                ], Response::HTTP_NOT_FOUND);
            }

            return $this->json([
                'uploadId' => $upload->getUploadId(),
                'filename' => $upload->getFilename(),
                'status' => $upload->getStatus(),
                'uploadedChunks' => $upload->getUploadedChunks(),
                'totalChunks' => $upload->getTotalChunks(),
                'filesize' => $upload->getFilesize(),
                'createdAt' => $upload->getCreatedAt()?->format('Y-m-d H:i:s'),
                'completedAt' => $upload->getCompletedAt()?->format('Y-m-d H:i:s'),
                'errorMessage' => $upload->getErrorMessage(),
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            $this->logger->error('Error getting upload status', [
                'uploadId' => $uploadId,
                'error' => $e->getMessage(),
            ]);

            return $this->json([
                'error' => 'Internal server error',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
