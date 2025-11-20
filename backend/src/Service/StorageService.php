<?php

namespace App\Service;

use Psr\Log\LoggerInterface;

class StorageService
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly string $uploadDirectory
    ) {
    }

    public function generateFilePath(string $filename, string $uploadId): string
    {
        $date = new \DateTime();
        $yearMonth = $date->format('Y/m');
        $dayHour = $date->format('d');

        // Sanitize filename
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $basename = pathinfo($filename, PATHINFO_FILENAME);
        $basename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $basename);

        // Create unique filename to prevent overwriting
        $uniqueFilename = sprintf(
            '%s_%s.%s',
            $basename,
            substr($uploadId, 0, 8),
            $extension
        );

        return sprintf(
            '%s/%s/%s/%s',
            $this->uploadDirectory,
            $yearMonth,
            $dayHour,
            $uniqueFilename
        );
    }

    public function ensureDirectoryExists(string $filePath): bool
    {
        $directory = dirname($filePath);

        if (!is_dir($directory)) {
            return mkdir($directory, 0755, true);
        }

        return true;
    }

    public function deleteFile(string $filePath): bool
    {
        if (!file_exists($filePath)) {
            return true;
        }

        try {
            $result = unlink($filePath);

            if ($result) {
                $this->logger->info('File deleted', ['path' => $filePath]);
            }

            return $result;
        } catch (\Exception $e) {
            $this->logger->error('Failed to delete file', [
                'path' => $filePath,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function calculateMd5(string $filePath): ?string
    {
        if (!file_exists($filePath)) {
            return null;
        }

        try {
            return md5_file($filePath);
        } catch (\Exception $e) {
            $this->logger->error('Failed to calculate MD5', [
                'path' => $filePath,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function getFileSize(string $filePath): ?int
    {
        if (!file_exists($filePath)) {
            return null;
        }

        $size = filesize($filePath);
        return $size !== false ? $size : null;
    }

    public function getMimeType(string $filePath): ?string
    {
        if (!file_exists($filePath)) {
            return null;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo === false) {
            return null;
        }

        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        return $mimeType !== false ? $mimeType : null;
    }

    public function cleanupOldFiles(\DateTime $before): int
    {
        $count = 0;
        $basePath = $this->uploadDirectory;

        if (!is_dir($basePath)) {
            return 0;
        }

        $count = $this->scanAndDeleteOldFiles($basePath, $before);

        $this->logger->info('Cleaned up old files', ['count' => $count]);

        return $count;
    }

    private function scanAndDeleteOldFiles(string $directory, \DateTime $before): int
    {
        $count = 0;

        if (!is_dir($directory)) {
            return 0;
        }

        $items = scandir($directory);
        if ($items === false) {
            return 0;
        }

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $path = $directory . '/' . $item;

            if (is_file($path)) {
                $mtime = filemtime($path);
                if ($mtime !== false && $mtime < $before->getTimestamp()) {
                    if (unlink($path)) {
                        $count++;
                    }
                }
            } elseif (is_dir($path)) {
                $count += $this->scanAndDeleteOldFiles($path, $before);

                // Remove empty directories
                $remaining = array_diff(scandir($path) ?: [], ['.', '..']);
                if (empty($remaining)) {
                    rmdir($path);
                }
            }
        }

        return $count;
    }

    public function getUploadDirectory(): string
    {
        return $this->uploadDirectory;
    }
}
