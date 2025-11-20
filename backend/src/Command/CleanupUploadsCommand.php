<?php

namespace App\Command;

use App\Service\ChunkManagerService;
use App\Service\StorageService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:cleanup:uploads',
    description: 'Clean up old uploaded files and incomplete chunk uploads',
)]
class CleanupUploadsCommand extends Command
{
    public function __construct(
        private readonly StorageService $storageService,
        private readonly ChunkManagerService $chunkManager,
        private readonly LoggerInterface $logger,
        private readonly int $fileRetention,
        private readonly int $chunkRetention
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'file-age',
                null,
                InputOption::VALUE_OPTIONAL,
                'Age in days for file cleanup (default: from config)',
                null
            )
            ->addOption(
                'chunk-age',
                null,
                InputOption::VALUE_OPTIONAL,
                'Age in minutes for incomplete chunk cleanup (default: from config)',
                null
            )
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Run in dry-run mode without actually deleting files'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = $input->getOption('dry-run');

        if ($dryRun) {
            $io->warning('Running in DRY-RUN mode - no files will be deleted');
        }

        // Cleanup old uploaded files
        $fileAgeDays = $input->getOption('file-age') ?? ($this->fileRetention / 86400);
        $fileDate = new \DateTime();
        $fileDate->modify("-{$fileAgeDays} days");

        $io->section('Cleaning up old uploaded files');
        $io->text(sprintf('Deleting files older than: %s', $fileDate->format('Y-m-d H:i:s')));

        if (!$dryRun) {
            $deletedFiles = $this->storageService->cleanupOldFiles($fileDate);
            $io->success(sprintf('Deleted %d old file(s)', $deletedFiles));
        } else {
            $io->info('Would cleanup old files (dry-run)');
        }

        // Cleanup incomplete chunk uploads
        $chunkAgeMinutes = $input->getOption('chunk-age') ?? ($this->chunkRetention / 60);
        $chunkDate = new \DateTime();
        $chunkDate->modify("-{$chunkAgeMinutes} minutes");

        $io->section('Cleaning up incomplete chunk uploads');
        $io->text(sprintf('Deleting incomplete uploads older than: %s', $chunkDate->format('Y-m-d H:i:s')));

        if (!$dryRun) {
            $deletedChunks = $this->chunkManager->cleanupIncompleteUploads($chunkDate);
            $io->success(sprintf('Deleted %d incomplete upload(s)', $deletedChunks));
        } else {
            $io->info('Would cleanup incomplete chunks (dry-run)');
        }

        $io->success('Cleanup completed successfully');

        return Command::SUCCESS;
    }
}
