import BackgroundFetch from 'react-native-background-fetch';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/config/constants';
import type { UploadFile } from '@/types/upload';

interface PendingUpload {
  fileId: string;
  filename: string;
  filesize: number;
  mimeType: string;
  uri: string;
  uploadedChunks: number;
  totalChunks: number;
  uploadId?: string;
  createdAt: string;
}

class BackgroundUploadService {
  private isInitialized: boolean = false;
  private uploadInProgress: boolean = false;

  /**
   * Initialize background fetch for upload resume
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // Minutes
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          requiresCharging: false,
          requiresDeviceIdle: false,
          requiresBatteryNotLow: false,
          requiresStorageNotLow: false,
        },
        async (taskId) => {
          console.log('[BackgroundFetch] Task started:', taskId);
          await this.processPendingUploads();
          BackgroundFetch.finish(taskId);
        },
        async (taskId) => {
          console.log('[BackgroundFetch] Task timeout:', taskId);
          BackgroundFetch.finish(taskId);
        }
      );

      console.log('[BackgroundFetch] Status:', status);
      this.isInitialized = true;
    } catch (error) {
      console.error('[BackgroundFetch] Failed to initialize:', error);
    }
  }

  /**
   * Save upload to pending queue for background processing
   */
  async savePendingUpload(file: UploadFile): Promise<void> {
    try {
      const pendingUploads = await this.getPendingUploads();

      const pendingUpload: PendingUpload = {
        fileId: file.fileId,
        filename: file.filename,
        filesize: file.filesize,
        mimeType: file.mimeType,
        uri: file.uri || '',
        uploadedChunks: file.uploadedChunks,
        totalChunks: file.totalChunks,
        uploadId: file.uploadId,
        createdAt: file.createdAt.toISOString(),
      };

      // Add or update the upload
      const existingIndex = pendingUploads.findIndex(u => u.fileId === file.fileId);
      if (existingIndex >= 0) {
        pendingUploads[existingIndex] = pendingUpload;
      } else {
        pendingUploads.push(pendingUpload);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_UPLOADS,
        JSON.stringify(pendingUploads)
      );

      if (__DEV__) {
        console.log('[BackgroundUpload] Saved pending upload:', file.fileId);
      }
    } catch (error) {
      console.error('[BackgroundUpload] Failed to save pending upload:', error);
    }
  }

  /**
   * Remove upload from pending queue
   */
  async removePendingUpload(fileId: string): Promise<void> {
    try {
      const pendingUploads = await this.getPendingUploads();
      const filtered = pendingUploads.filter(u => u.fileId !== fileId);

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_UPLOADS,
        JSON.stringify(filtered)
      );

      if (__DEV__) {
        console.log('[BackgroundUpload] Removed pending upload:', fileId);
      }
    } catch (error) {
      console.error('[BackgroundUpload] Failed to remove pending upload:', error);
    }
  }

  /**
   * Get all pending uploads
   */
  async getPendingUploads(): Promise<PendingUpload[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[BackgroundUpload] Failed to get pending uploads:', error);
      return [];
    }
  }

  /**
   * Process pending uploads in background
   * Note: This is a placeholder - actual upload logic should be implemented
   * based on your app's architecture
   */
  private async processPendingUploads(): Promise<void> {
    if (this.uploadInProgress) {
      console.log('[BackgroundUpload] Upload already in progress, skipping');
      return;
    }

    try {
      this.uploadInProgress = true;
      const pendingUploads = await this.getPendingUploads();

      if (pendingUploads.length === 0) {
        if (__DEV__) {
          console.log('[BackgroundUpload] No pending uploads');
        }
        return;
      }

      if (__DEV__) {
        console.log('[BackgroundUpload] Processing', pendingUploads.length, 'pending uploads');
      }

      // Note: Actual upload processing would be handled by the upload manager
      // This is just for logging and cleanup of old uploads
      const now = new Date().getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Clean up uploads older than 24 hours
      const filtered = pendingUploads.filter(upload => {
        const uploadTime = new Date(upload.createdAt).getTime();
        return (now - uploadTime) < oneDayMs;
      });

      if (filtered.length !== pendingUploads.length) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PENDING_UPLOADS,
          JSON.stringify(filtered)
        );
        if (__DEV__) {
          console.log('[BackgroundUpload] Cleaned up old pending uploads');
        }
      }
    } catch (error) {
      console.error('[BackgroundUpload] Failed to process pending uploads:', error);
    } finally {
      this.uploadInProgress = false;
    }
  }

  /**
   * Start background task for long-running upload
   */
  startBackgroundTask(taskName: string = 'upload'): void {
    BackgroundTimer.start();
    if (__DEV__) {
      console.log('[BackgroundTimer] Started:', taskName);
    }
  }

  /**
   * Stop background task
   */
  stopBackgroundTask(): void {
    BackgroundTimer.stop();
    if (__DEV__) {
      console.log('[BackgroundTimer] Stopped');
    }
  }

  /**
   * Check if background uploads are supported
   */
  isSupported(): boolean {
    return true; // Both iOS and Android support background fetch
  }

  /**
   * Get background upload status
   */
  async getStatus(): Promise<{
    isInitialized: boolean;
    pendingCount: number;
    isProcessing: boolean;
  }> {
    const pendingUploads = await this.getPendingUploads();
    return {
      isInitialized: this.isInitialized,
      pendingCount: pendingUploads.length,
      isProcessing: this.uploadInProgress,
    };
  }

  /**
   * Manually trigger background fetch
   */
  async scheduleTask(): Promise<void> {
    try {
      await BackgroundFetch.scheduleTask({
        taskId: 'com.mobile.upload',
        delay: 0, // Execute immediately
        periodic: false,
        forceAlarmManager: false,
        stopOnTerminate: false,
        startOnBoot: false,
      });

      if (__DEV__) {
        console.log('[BackgroundFetch] Task scheduled');
      }
    } catch (error) {
      console.error('[BackgroundFetch] Failed to schedule task:', error);
    }
  }
}

export const backgroundUploadService = new BackgroundUploadService();
