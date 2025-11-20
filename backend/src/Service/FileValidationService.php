<?php

namespace App\Service;

use Psr\Log\LoggerInterface;

class FileValidationService
{
    private const ALLOWED_MIME_TYPES = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        // Videos
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/webm',
        'video/x-flv',
        'video/3gpp',
        'video/3gpp2',
    ];

    private const MAGIC_NUMBERS = [
        // Images
        'image/jpeg' => [
            ['offset' => 0, 'bytes' => 'FFD8FF'],
        ],
        'image/png' => [
            ['offset' => 0, 'bytes' => '89504E470D0A1A0A'],
        ],
        'image/gif' => [
            ['offset' => 0, 'bytes' => '474946383761'], // GIF87a
            ['offset' => 0, 'bytes' => '474946383961'], // GIF89a
        ],
        'image/webp' => [
            ['offset' => 8, 'bytes' => '57454250'], // WEBP
        ],
        'image/bmp' => [
            ['offset' => 0, 'bytes' => '424D'],
        ],
        // Videos
        'video/mp4' => [
            ['offset' => 4, 'bytes' => '66747970'], // ftyp
        ],
        'video/quicktime' => [
            ['offset' => 4, 'bytes' => '6D6F6F76'], // moov
            ['offset' => 4, 'bytes' => '6D646174'], // mdat
        ],
        'video/x-msvideo' => [
            ['offset' => 0, 'bytes' => '52494646'], // RIFF
            ['offset' => 8, 'bytes' => '41564920'], // AVI
        ],
        'video/webm' => [
            ['offset' => 0, 'bytes' => '1A45DFA3'],
        ],
        'video/x-matroska' => [
            ['offset' => 0, 'bytes' => '1A45DFA3'],
        ],
    ];

    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly int $maxFileSize,
        private readonly int $maxFiles
    ) {
    }

    public function validateMimeType(string $mimeType): bool
    {
        return in_array($mimeType, self::ALLOWED_MIME_TYPES, true);
    }

    public function validateFileSize(int $filesize): bool
    {
        return $filesize > 0 && $filesize <= $this->maxFileSize;
    }

    public function validateFileCount(int $count): bool
    {
        return $count > 0 && $count <= $this->maxFiles;
    }

    public function validateFilename(string $filename): bool
    {
        // Check for null bytes
        if (str_contains($filename, "\0")) {
            return false;
        }

        // Check for path traversal
        if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            return false;
        }

        // Check filename length
        if (strlen($filename) > 255 || strlen($filename) === 0) {
            return false;
        }

        return true;
    }

    public function validateMagicNumber(string $filePath, string $expectedMimeType): bool
    {
        if (!isset(self::MAGIC_NUMBERS[$expectedMimeType])) {
            $this->logger->warning('No magic number defined for MIME type', [
                'mimeType' => $expectedMimeType,
            ]);
            return true; // Allow if no magic number is defined
        }

        if (!file_exists($filePath)) {
            return false;
        }

        $handle = fopen($filePath, 'rb');
        if ($handle === false) {
            return false;
        }

        $magicPatterns = self::MAGIC_NUMBERS[$expectedMimeType];
        $isValid = false;

        foreach ($magicPatterns as $pattern) {
            fseek($handle, $pattern['offset']);
            $bytes = fread($handle, strlen($pattern['bytes']) / 2);

            if ($bytes !== false) {
                $hexBytes = strtoupper(bin2hex($bytes));
                if ($hexBytes === strtoupper($pattern['bytes'])) {
                    $isValid = true;
                    break;
                }
            }
        }

        fclose($handle);

        if (!$isValid) {
            $this->logger->warning('Magic number validation failed', [
                'filePath' => $filePath,
                'expectedMimeType' => $expectedMimeType,
            ]);
        }

        return $isValid;
    }

    public function getAllowedMimeTypes(): array
    {
        return self::ALLOWED_MIME_TYPES;
    }

    public function getMaxFileSize(): int
    {
        return $this->maxFileSize;
    }

    public function getMaxFiles(): int
    {
        return $this->maxFiles;
    }
}
