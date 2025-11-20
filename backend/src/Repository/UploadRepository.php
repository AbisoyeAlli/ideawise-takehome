<?php

namespace App\Repository;

use App\Entity\Upload;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Upload>
 */
class UploadRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Upload::class);
    }

    public function findByUploadId(string $uploadId): ?Upload
    {
        return $this->findOneBy(['uploadId' => $uploadId]);
    }

    public function findByMd5Hash(string $md5Hash): ?Upload
    {
        return $this->createQueryBuilder('u')
            ->where('u.md5Hash = :hash')
            ->andWhere('u.status = :status')
            ->setParameter('hash', $md5Hash)
            ->setParameter('status', 'completed')
            ->orderBy('u.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findIncompleteUploads(\DateTime $before): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.status IN (:statuses)')
            ->andWhere('u.createdAt < :before')
            ->setParameter('statuses', ['pending', 'uploading'])
            ->setParameter('before', $before)
            ->getQuery()
            ->getResult();
    }

    public function findOldCompletedUploads(\DateTime $before): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.status = :status')
            ->andWhere('u.completedAt < :before')
            ->setParameter('status', 'completed')
            ->setParameter('before', $before)
            ->getQuery()
            ->getResult();
    }
}
