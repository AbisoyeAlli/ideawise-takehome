<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Predis\Client as RedisClient;

class ChunkManagerService
{
    private const CHUNK_KEY_PREFIX = 'upload:chunk:';
    private const UPLOAD_SESSION_PREFIX = 'upload:session:';

    public function __construct(
        private readonly RedisClient $redis,
        private readonly LoggerInterface $logger,
        private readonly string $chunksDirectory,
        private readonly int $chunkRetention
    ) {
    }

    public function saveChunk(string $uploadId, int $chunkIndex, string $chunkData): bool
    {
        try {
            $chunkPath = $this->getChunkPath($uploadId, $chunkIndex);
            $directory = dirname($chunkPath);

            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            if (file_put_contents($chunkPath, $chunkData) === false) {
                $this->logger->error('Failed to save chunk', [
                    'uploadId' => $uploadId,
                    'chunkIndex' => $chunkIndex,
                ]);
                return false;
            }

            // Track chunk in Redis
            $this->trackChunk($uploadId, $chunkIndex);

            return true;
        } catch (\Exception $e) {
            $this->logger->error('Exception while saving chunk', [
                'uploadId' => $uploadId,
                'chunkIndex' => $chunkIndex,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function getChunkPath(string $uploadId, int $chunkIndex): string
    {
        return sprintf('%s/%s/chunk_%d.tmp', $this->chunksDirectory, $uploadId, $chunkIndex);
    }

    public function trackChunk(string $uploadId, int $chunkIndex): void
    {
        $key = self::CHUNK_KEY_PREFIX . $uploadId;
        $this->redis->sadd($key, [$chunkIndex]);
        $this->redis->expire($key, $this->chunkRetention);
    }

    public function getUploadedChunks(string $uploadId): array
    {
        $key = self::CHUNK_KEY_PREFIX . $uploadId;
        $chunks = $this->redis->smembers($key);

        return array_map('intval', $chunks);
    }

    public function hasChunk(string $uploadId, int $chunkIndex): bool
    {
        $key = self::CHUNK_KEY_PREFIX . $uploadId;
        return (bool) $this->redis->sismember($key, $chunkIndex);
    }

    public function reassembleFile(string $uploadId, int $totalChunks, string $destinationPath): bool
    {
        try {
            $uploadedChunks = $this->getUploadedChunks($uploadId);

            // Verify all chunks are present
            if (count($uploadedChunks) !== $totalChunks) {
                $this->logger->error('Missing chunks for reassembly', [
                    'uploadId' => $uploadId,
                    'expected' => $totalChunks,
                    'received' => count($uploadedChunks),
                ]);
                return false;
            }

            // Sort chunks
            sort($uploadedChunks);

            // Create destination directory
            $directory = dirname($destinationPath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            // Reassemble file
            $outputHandle = fopen($destinationPath, 'wb');
            if ($outputHandle === false) {
                $this->logger->error('Failed to open destination file', [
                    'uploadId' => $uploadId,
                    'path' => $destinationPath,
                ]);
                return false;
            }

            foreach ($uploadedChunks as $chunkIndex) {
                $chunkPath = $this->getChunkPath($uploadId, $chunkIndex);

                if (!file_exists($chunkPath)) {
                    fclose($outputHandle);
                    @unlink($destinationPath);
                    $this->logger->error('Chunk file missing during reassembly', [
                        'uploadId' => $uploadId,
                        'chunkIndex' => $chunkIndex,
                    ]);
                    return false;
                }

                $chunkData = file_get_contents($chunkPath);
                if ($chunkData === false) {
                    fclose($outputHandle);
                    @unlink($destinationPath);
                    return false;
                }

                fwrite($outputHandle, $chunkData);
            }

            fclose($outputHandle);

            $this->logger->info('File reassembled successfully', [
                'uploadId' => $uploadId,
                'chunks' => $totalChunks,
                'path' => $destinationPath,
            ]);

            return true;
        } catch (\Exception $e) {
            $this->logger->error('Exception during file reassembly', [
                'uploadId' => $uploadId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function cleanupChunks(string $uploadId): void
    {
        try {
            $chunkDirectory = sprintf('%s/%s', $this->chunksDirectory, $uploadId);

            if (is_dir($chunkDirectory)) {
                $this->deleteDirectory($chunkDirectory);
            }

            // Remove from Redis
            $key = self::CHUNK_KEY_PREFIX . $uploadId;
            $this->redis->del([$key]);

            $this->logger->info('Cleaned up chunks', ['uploadId' => $uploadId]);
        } catch (\Exception $e) {
            $this->logger->error('Error cleaning up chunks', [
                'uploadId' => $uploadId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function cleanupIncompleteUploads(\DateTime $before): int
    {
        $count = 0;
        $basePath = $this->chunksDirectory;

        if (!is_dir($basePath)) {
            return 0;
        }

        $directories = scandir($basePath);
        if ($directories === false) {
            return 0;
        }

        foreach ($directories as $dir) {
            if ($dir === '.' || $dir === '..') {
                continue;
            }

            $dirPath = $basePath . '/' . $dir;
            if (!is_dir($dirPath)) {
                continue;
            }

            $mtime = filemtime($dirPath);
            if ($mtime === false) {
                continue;
            }

            if ($mtime < $before->getTimestamp()) {
                $this->deleteDirectory($dirPath);
                $this->redis->del([self::CHUNK_KEY_PREFIX . $dir]);
                $count++;
            }
        }

        $this->logger->info('Cleaned up incomplete uploads', ['count' => $count]);

        return $count;
    }

    private function deleteDirectory(string $dir): bool
    {
        if (!is_dir($dir)) {
            return false;
        }

        $files = array_diff(scandir($dir) ?: [], ['.', '..']);

        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }

        return rmdir($dir);
    }

    public function createUploadSession(string $uploadId, array $metadata): void
    {
        $key = self::UPLOAD_SESSION_PREFIX . $uploadId;
        $this->redis->hmset($key, $metadata);
        $this->redis->expire($key, $this->chunkRetention);
    }

    public function getUploadSession(string $uploadId): ?array
    {
        $key = self::UPLOAD_SESSION_PREFIX . $uploadId;
        $data = $this->redis->hgetall($key);

        return $data && count($data) > 0 ? $data : null;
    }
}
