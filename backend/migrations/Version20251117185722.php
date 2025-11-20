<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251117185722 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE uploads (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, upload_id VARCHAR(255) NOT NULL, filename VARCHAR(255) NOT NULL, md5_hash VARCHAR(64) NOT NULL, filesize BIGINT NOT NULL, mime_type VARCHAR(100) NOT NULL, total_chunks INTEGER NOT NULL, uploaded_chunks INTEGER NOT NULL, status VARCHAR(50) NOT NULL, file_path VARCHAR(255) DEFAULT NULL, error_message CLOB DEFAULT NULL, created_at DATETIME NOT NULL, completed_at DATETIME DEFAULT NULL, ip_address VARCHAR(45) DEFAULT NULL, user_agent VARCHAR(255) DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_96117F18CCCFBA31 ON uploads (upload_id)');
        $this->addSql('CREATE INDEX idx_upload_id ON uploads (upload_id)');
        $this->addSql('CREATE INDEX idx_status ON uploads (status)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE uploads');
    }
}
