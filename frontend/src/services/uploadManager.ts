import { apiService } from './apiService';
import { calculateMD5, sliceFileToChunk } from '../utils/fileUtils';
import { UPLOAD_CONFIG } from '../config/constants';
import type { UploadFile, ChunkUploadTask } from '../types/upload';

type ProgressCallback = (fileId: string, progress: number, uploadedChunks: number) => void;
type StatusCallback = (fileId: string, status: UploadFile['status']) => void;
type ErrorCallback = (fileId: string, error: string) => void;
type CompleteCallback = (fileId: string, uploadId: string, filePath: string) => void;

export class UploadManager {
  private uploadQueue: Map<string, ChunkUploadTask[]> = new Map();
  private activeUploads: Map<string, Set<number>> = new Map();
  private pausedUploads: Set<string> = new Set();
  private cancelledUploads: Set<string> = new Set();

  private progressCallback?: ProgressCallback;
  private statusCallback?: StatusCallback;
  private errorCallback?: ErrorCallback;
  private completeCallback?: CompleteCallback;

  onProgress(callback: ProgressCallback) {
    this.progressCallback = callback;
  }

  onStatusChange(callback: StatusCallback) {
    this.statusCallback = callback;
  }

  onError(callback: ErrorCallback) {
    this.errorCallback = callback;
  }

  onComplete(callback: CompleteCallback) {
    this.completeCallback = callback;
  }

  async uploadFile(uploadFile: UploadFile): Promise<void> {
    const { id: fileId, file } = uploadFile;

    try {
      // Update status to hashing
      this.statusCallback?.(fileId, 'hashing');

      // Calculate MD5 hash
      const md5Hash = await calculateMD5(file);

      // Update status to initiating
      this.statusCallback?.(fileId, 'initiating');

      // Initiate upload
      const initResponse = await apiService.initiateUpload({
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
        md5Hash,
      });

      // Check if file already exists (duplicate)
      if (initResponse.duplicate) {
        this.statusCallback?.(fileId, 'completed');
        this.completeCallback?.(fileId, initResponse.uploadId, initResponse.filePath || '');
        return;
      }

      const { uploadId, chunkSize, totalChunks } = initResponse;

      // Create chunk upload tasks
      const chunkTasks: ChunkUploadTask[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkData = sliceFileToChunk(file, i, chunkSize);
        chunkTasks.push({
          uploadId,
          fileId,
          chunkIndex: i,
          chunkData,
          retryCount: 0,
          abortController: new AbortController(),
        });
      }

      this.uploadQueue.set(fileId, chunkTasks);
      this.activeUploads.set(fileId, new Set());

      // Update status to uploading
      this.statusCallback?.(fileId, 'uploading');

      // Start uploading chunks
      await this.processChunkQueue(fileId, totalChunks);

      // Check if upload was cancelled or paused
      if (this.cancelledUploads.has(fileId)) {
        this.cancelledUploads.delete(fileId);
        return;
      }

      if (this.pausedUploads.has(fileId)) {
        this.statusCallback?.(fileId, 'paused');
        return;
      }

      // Finalize upload
      this.statusCallback?.(fileId, 'finalizing');
      const finalizeResponse = await apiService.finalizeUpload({ uploadId });

      // Update status to completed
      this.statusCallback?.(fileId, 'completed');
      this.completeCallback?.(fileId, uploadId, finalizeResponse.filePath);

      // Cleanup
      this.uploadQueue.delete(fileId);
      this.activeUploads.delete(fileId);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.statusCallback?.(fileId, 'failed');
      this.errorCallback?.(fileId, errorMessage);

      // Cleanup
      this.uploadQueue.delete(fileId);
      this.activeUploads.delete(fileId);
    }
  }

  private async processChunkQueue(
    fileId: string,
    totalChunks: number
  ): Promise<void> {
    const tasks = this.uploadQueue.get(fileId);
    if (!tasks) return;

    const activeSet = this.activeUploads.get(fileId);
    if (!activeSet) return;

    let uploadedCount = 0;

    while (uploadedCount < totalChunks) {
      // Check if upload is paused or cancelled
      if (this.pausedUploads.has(fileId) || this.cancelledUploads.has(fileId)) {
        break;
      }

      // Get pending tasks
      const pendingTasks = tasks.filter(
        (task) => !activeSet.has(task.chunkIndex) && task.retryCount < UPLOAD_CONFIG.MAX_RETRIES
      );

      if (pendingTasks.length === 0) {
        // Wait for active uploads to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Calculate how many more concurrent uploads we can start
      const slotsAvailable = UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS - activeSet.size;
      const tasksToStart = pendingTasks.slice(0, slotsAvailable);

      // Start uploading chunks
      const uploadPromises = tasksToStart.map((task) =>
        this.uploadChunk(task, fileId).then((success) => {
          if (success) {
            uploadedCount++;
            this.progressCallback?.(
              fileId,
              (uploadedCount / totalChunks) * 100,
              uploadedCount
            );
          }
        })
      );

      await Promise.all(uploadPromises);
    }
  }

  private async uploadChunk(
    task: ChunkUploadTask,
    fileId: string
  ): Promise<boolean> {
    const activeSet = this.activeUploads.get(fileId);
    if (!activeSet) return false;

    activeSet.add(task.chunkIndex);

    try {
      await apiService.uploadChunk(
        task.uploadId,
        task.chunkIndex,
        task.chunkData,
        task.abortController.signal
      );

      activeSet.delete(task.chunkIndex);
      return true;
    } catch (error) {
      activeSet.delete(task.chunkIndex);

      // Check if it was aborted (paused/cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }

      // Retry with exponential backoff
      task.retryCount++;
      if (task.retryCount < UPLOAD_CONFIG.MAX_RETRIES) {
        const delay = UPLOAD_CONFIG.RETRY_DELAY_BASE * Math.pow(2, task.retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return false; // Will be retried in the next iteration
      }

      throw error;
    }
  }

  pauseUpload(fileId: string): void {
    this.pausedUploads.add(fileId);

    // Abort all active chunk uploads
    const activeSet = this.activeUploads.get(fileId);
    const tasks = this.uploadQueue.get(fileId);

    if (activeSet && tasks) {
      activeSet.forEach((chunkIndex) => {
        const task = tasks.find((t) => t.chunkIndex === chunkIndex);
        if (task) {
          task.abortController.abort();
        }
      });
      activeSet.clear();
    }
  }

  resumeUpload(fileId: string, uploadFile: UploadFile): void {
    this.pausedUploads.delete(fileId);
    this.uploadFile(uploadFile);
  }

  cancelUpload(fileId: string): void {
    this.cancelledUploads.add(fileId);

    // Abort all active chunk uploads
    const activeSet = this.activeUploads.get(fileId);
    const tasks = this.uploadQueue.get(fileId);

    if (activeSet && tasks) {
      activeSet.forEach((chunkIndex) => {
        const task = tasks.find((t) => t.chunkIndex === chunkIndex);
        if (task) {
          task.abortController.abort();
        }
      });
      activeSet.clear();
    }

    // Cleanup
    this.uploadQueue.delete(fileId);
    this.activeUploads.delete(fileId);
  }

  isPaused(fileId: string): boolean {
    return this.pausedUploads.has(fileId);
  }

  isCancelled(fileId: string): boolean {
    return this.cancelledUploads.has(fileId);
  }
}

export const uploadManager = new UploadManager();
