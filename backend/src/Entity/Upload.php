<?php

namespace App\Entity;

use App\Repository\UploadRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UploadRepository::class)]
#[ORM\Table(name: 'uploads')]
#[ORM\Index(name: 'idx_upload_id', columns: ['upload_id'])]
#[ORM\Index(name: 'idx_status', columns: ['status'])]
class Upload
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $uploadId = null;

    #[ORM\Column(length: 255)]
    private ?string $filename = null;

    #[ORM\Column(length: 64)]
    private ?string $md5Hash = null;

    #[ORM\Column(type: Types::BIGINT)]
    private ?string $filesize = null;

    #[ORM\Column(length: 100)]
    private ?string $mimeType = null;

    #[ORM\Column(type: Types::INTEGER)]
    private ?int $totalChunks = null;

    #[ORM\Column(type: Types::INTEGER)]
    private ?int $uploadedChunks = 0;

    #[ORM\Column(length: 50)]
    private ?string $status = 'pending'; // pending, uploading, completed, failed

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $filePath = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $errorMessage = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $completedAt = null;

    #[ORM\Column(length: 45, nullable: true)]
    private ?string $ipAddress = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $userAgent = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUploadId(): ?string
    {
        return $this->uploadId;
    }

    public function setUploadId(string $uploadId): static
    {
        $this->uploadId = $uploadId;
        return $this;
    }

    public function getFilename(): ?string
    {
        return $this->filename;
    }

    public function setFilename(string $filename): static
    {
        $this->filename = $filename;
        return $this;
    }

    public function getMd5Hash(): ?string
    {
        return $this->md5Hash;
    }

    public function setMd5Hash(string $md5Hash): static
    {
        $this->md5Hash = $md5Hash;
        return $this;
    }

    public function getFilesize(): ?string
    {
        return $this->filesize;
    }

    public function setFilesize(string $filesize): static
    {
        $this->filesize = $filesize;
        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(string $mimeType): static
    {
        $this->mimeType = $mimeType;
        return $this;
    }

    public function getTotalChunks(): ?int
    {
        return $this->totalChunks;
    }

    public function setTotalChunks(int $totalChunks): static
    {
        $this->totalChunks = $totalChunks;
        return $this;
    }

    public function getUploadedChunks(): ?int
    {
        return $this->uploadedChunks;
    }

    public function setUploadedChunks(int $uploadedChunks): static
    {
        $this->uploadedChunks = $uploadedChunks;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getFilePath(): ?string
    {
        return $this->filePath;
    }

    public function setFilePath(?string $filePath): static
    {
        $this->filePath = $filePath;
        return $this;
    }

    public function getErrorMessage(): ?string
    {
        return $this->errorMessage;
    }

    public function setErrorMessage(?string $errorMessage): static
    {
        $this->errorMessage = $errorMessage;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getCompletedAt(): ?\DateTimeInterface
    {
        return $this->completedAt;
    }

    public function setCompletedAt(?\DateTimeInterface $completedAt): static
    {
        $this->completedAt = $completedAt;
        return $this;
    }

    public function getIpAddress(): ?string
    {
        return $this->ipAddress;
    }

    public function setIpAddress(?string $ipAddress): static
    {
        $this->ipAddress = $ipAddress;
        return $this;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function setUserAgent(?string $userAgent): static
    {
        $this->userAgent = $userAgent;
        return $this;
    }
}
