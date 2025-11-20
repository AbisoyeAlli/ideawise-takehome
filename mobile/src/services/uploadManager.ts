import { apiService } from './apiService';
import { calculateMd5Hash, readFileChunk, base64ToBlob } from '@/utils/fileHash';
import { networkMonitor } from './networkMonitor';
import { backgroundUploadService } from './backgroundUploadService';
import { UPLOAD_CONFIG } from '@/config/constants';
import type { UploadFile } from '@/types/upload';

export class UploadManager {
  private activeUploads = new Map<string, AbortController>();
  private uploadQueue: Array<() => void> = [];
  private networkUnsubscribe: (() => void) | null = null;
  private backgroundTaskActive: boolean = false;

  async startUpload(
    file: UploadFile,
    onProgress: (fileId: string, progress: number, uploadedChunks: number) => void,
    onStatusChange: (fileId: string, status: UploadFile['status']) => void,
    onComplete: (fileId: string, uploadId: string, filePath: string) => void,
    onError: (fileId: string, error: string) => void
  ): Promise<void> {
    // Check network connectivity before starting
    if (!networkMonitor.getIsConnected()) {
      onError(file.fileId, 'No network connection');
      onStatusChange(file.fileId, 'failed');
      return;
    }

    // Wait for available slot using queue pattern instead of busy-wait
    if (this.activeUploads.size >= UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS) {
      await new Promise<void>(resolve => {
        this.uploadQueue.push(resolve);
      });
    }

    const abortController = new AbortController();
    this.activeUploads.set(file.fileId, abortController);

    // Start background task to keep upload running when app is backgrounded
    if (!this.backgroundTaskActive) {
      backgroundUploadService.startBackgroundTask('upload-' + file.fileId);
      this.backgroundTaskActive = true;
    }

    // Save to pending uploads for background processing
    await backgroundUploadService.savePendingUpload(file);

    try {
      onStatusChange(file.fileId, 'hashing');
      const md5Hash = await calculateMd5Hash(file.uri);

      onStatusChange(file.fileId, 'initiating');
      const initResponse = await apiService.initiateUpload(
        file.filename,
        file.filesize,
        file.mimeType,
        md5Hash
      );

      if (initResponse.duplicate) {
        onStatusChange(file.fileId, 'duplicate');
        onComplete(file.fileId, initResponse.uploadId, initResponse.filePath!);
        return;
      }

      const { uploadId, chunkSize, totalChunks } = initResponse;
      onStatusChange(file.fileId, 'uploading');

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (abortController.signal.aborted) {
          onStatusChange(file.fileId, 'paused');
          return;
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.filesize);

        const chunkBase64 = await readFileChunk(file.uri, start, end);
        const chunkBlob = base64ToBlob(chunkBase64, file.mimeType);

        let attempt = 0;
        let uploaded = false;

        while (attempt < UPLOAD_CONFIG.RETRY_ATTEMPTS && !uploaded) {
          try {
            const result = await apiService.uploadChunk(uploadId, chunkIndex, chunkBlob);

            if (result.success) {
              uploaded = true;
              const progress = Math.round((result.uploadedChunks / totalChunks) * 100);
              onProgress(file.fileId, progress, result.uploadedChunks);
            }
          } catch (error) {
            attempt++;
            if (attempt < UPLOAD_CONFIG.RETRY_ATTEMPTS) {
              // Check network connection before retrying
              if (!networkMonitor.getIsConnected()) {
                // Wait for network to reconnect (max 30 seconds)
                const reconnected = await networkMonitor.waitForConnection(30000);
                if (!reconnected) {
                  throw new Error('Network connection lost during upload');
                }
              }

              // Exponential backoff with maximum cap
              const delay = Math.min(
                UPLOAD_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1),
                UPLOAD_CONFIG.MAX_RETRY_DELAY
              );
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }

        if (!uploaded) {
          throw new Error(`Failed to upload chunk ${chunkIndex} after ${UPLOAD_CONFIG.RETRY_ATTEMPTS} attempts`);
        }
      }

      onStatusChange(file.fileId, 'finalizing');
      const finalizeResponse = await apiService.finalizeUpload(uploadId);

      if (finalizeResponse.success) {
        onStatusChange(file.fileId, 'completed');
        onComplete(file.fileId, uploadId, finalizeResponse.filePath);

        // Remove from pending uploads on success
        await backgroundUploadService.removePendingUpload(file.fileId);
      } else {
        throw new Error('Failed to finalize upload');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError(file.fileId, errorMessage);
      onStatusChange(file.fileId, 'failed');

      // Keep in pending uploads for background retry
      await backgroundUploadService.savePendingUpload(file);
    } finally {
      this.activeUploads.delete(file.fileId);

      // Stop background task if no more active uploads
      if (this.activeUploads.size === 0 && this.backgroundTaskActive) {
        backgroundUploadService.stopBackgroundTask();
        this.backgroundTaskActive = false;
      }

      // Process next item in queue if any
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.uploadQueue.length > 0 && this.activeUploads.size < UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS) {
      const next = this.uploadQueue.shift();
      if (next) {
        next();
      }
    }
  }

  pauseUpload(fileId: string): void {
    const controller = this.activeUploads.get(fileId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(fileId);
      // Process next item in queue
      this.processQueue();
    }
  }

  pauseAllUploads(): void {
    this.activeUploads.forEach((controller) => {
      controller.abort();
    });
    this.activeUploads.clear();
    // Clear the queue as well
    this.uploadQueue = [];
  }

  isUploading(fileId: string): boolean {
    return this.activeUploads.has(fileId);
  }

  getActiveUploadCount(): number {
    return this.activeUploads.size;
  }
}

export const uploadManager = new UploadManager();
