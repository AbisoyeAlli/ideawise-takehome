import { create } from 'zustand';
import { uploadManager } from '../services/uploadManager';
import { storageService } from '../services/storageService';
import { validateFile, validateFiles, createFilePreview, generateUniqueId, calculateTotalChunks } from '../utils/fileUtils';
import { UPLOAD_CONFIG } from '../config/constants';
import type { UploadFile, UploadHistoryItem } from '../types/upload';
import { useToastStore } from './toastStore';

export interface OverallProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  uploadingFiles: number;
  overallProgress: number;
}

interface UploadStore {
  // State
  uploads: Map<string, UploadFile>;
  uploadHistory: UploadHistoryItem[];
  isUploadInProgress: boolean;

  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  startUpload: (fileId: string) => Promise<void>;
  pauseUpload: (fileId: string) => void;
  resumeUpload: (fileId: string) => void;
  cancelUpload: (fileId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;

  // History
  loadHistory: () => void;
  clearHistory: () => void;

  // Overall Progress
  getOverallProgress: () => OverallProgress;

  // Internal state updates
  updateFileProgress: (fileId: string, progress: number, uploadedChunks: number) => void;
  updateFileStatus: (fileId: string, status: UploadFile['status']) => void;
  updateFileError: (fileId: string, error: string) => void;
  markFileComplete: (fileId: string, uploadId: string, filePath: string) => void;
}

export const useUploadStore = create<UploadStore>((set, get) => {
  // Setup upload manager callbacks
  uploadManager.onProgress((fileId, progress, uploadedChunks) => {
    get().updateFileProgress(fileId, progress, uploadedChunks);
  });

  uploadManager.onStatusChange((fileId, status) => {
    get().updateFileStatus(fileId, status);
  });

  uploadManager.onError((fileId, error) => {
    get().updateFileError(fileId, error);
  });

  uploadManager.onComplete((fileId, uploadId, filePath) => {
    get().markFileComplete(fileId, uploadId, filePath);
  });

  return {
    // Initial state
    uploads: new Map(),
    uploadHistory: [],
    isUploadInProgress: false,

    // Add files to upload queue
    addFiles: async (files: File[]) => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const { uploads } = get();
      const newUploads = new Map(uploads);

      for (const file of files) {
        const fileValidation = validateFile(file);
        if (!fileValidation.valid) {
          console.warn(`Skipping file ${file.name}: ${fileValidation.error}`);
          continue;
        }

        const fileId = generateUniqueId();
        const totalChunks = calculateTotalChunks(file.size, UPLOAD_CONFIG.CHUNK_SIZE);
        const preview = await createFilePreview(file);

        const uploadFile: UploadFile = {
          id: fileId,
          file,
          filename: file.name,
          filesize: file.size,
          mimeType: file.type,
          preview: preview || undefined,
          status: 'pending',
          progress: 0,
          uploadedChunks: 0,
          totalChunks,
          createdAt: new Date(),
          isPaused: false,
          isCancelled: false,
        };

        newUploads.set(fileId, uploadFile);

        // Add to history immediately
        const historyItem: UploadHistoryItem = {
          id: fileId,
          filename: file.name,
          filesize: file.size,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        storageService.addToHistory(historyItem);
      }

      set({ uploads: newUploads });
      get().loadHistory();
    },

    // Remove file from queue
    removeFile: (fileId: string) => {
      const { uploads } = get();
      const file = uploads.get(fileId);

      if (file && (file.status === 'uploading' || file.status === 'paused')) {
        uploadManager.cancelUpload(fileId);
      }

      const newUploads = new Map(uploads);
      newUploads.delete(fileId);
      set({ uploads: newUploads });

      storageService.removePendingUpload(fileId);
    },

    // Start uploading a file
    startUpload: async (fileId: string) => {
      const { uploads } = get();
      const uploadFile = uploads.get(fileId);

      if (!uploadFile) return;

      // Update status to pending if not already started
      if (uploadFile.status === 'pending' || uploadFile.status === 'failed') {
        get().updateFileStatus(fileId, 'pending');
      }

      set({ isUploadInProgress: true });

      try {
        await uploadManager.uploadFile(uploadFile);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        // Check if there are more uploads in progress
        const hasActiveUploads = Array.from(get().uploads.values()).some(
          (f) => f.status === 'uploading' || f.status === 'hashing' || f.status === 'initiating'
        );
        set({ isUploadInProgress: hasActiveUploads });
      }
    },

    // Pause upload
    pauseUpload: (fileId: string) => {
      uploadManager.pauseUpload(fileId);
      get().updateFileStatus(fileId, 'paused');

      const { uploads } = get();
      const file = uploads.get(fileId);
      if (file) {
        storageService.savePendingUpload(fileId, file);
      }
    },

    // Resume upload
    resumeUpload: (fileId: string) => {
      const { uploads } = get();
      const uploadFile = uploads.get(fileId);

      if (!uploadFile) return;

      get().updateFileStatus(fileId, 'uploading');
      uploadManager.resumeUpload(fileId, uploadFile);
    },

    // Cancel upload
    cancelUpload: (fileId: string) => {
      uploadManager.cancelUpload(fileId);
      get().updateFileStatus(fileId, 'cancelled');
      storageService.removePendingUpload(fileId);

      // Update history
      storageService.updateHistoryItem(fileId, {
        status: 'cancelled',
        completedAt: new Date().toISOString(),
      });
      get().loadHistory();
    },

    // Clear completed uploads
    clearCompleted: () => {
      const { uploads } = get();
      const newUploads = new Map(uploads);

      uploads.forEach((file, fileId) => {
        if (file.status === 'completed' || file.status === 'failed' || file.status === 'cancelled') {
          newUploads.delete(fileId);
        }
      });

      set({ uploads: newUploads });
    },

    // Clear all uploads
    clearAll: () => {
      const { uploads } = get();

      // Cancel any active uploads
      uploads.forEach((file, fileId) => {
        if (file.status === 'uploading' || file.status === 'paused') {
          uploadManager.cancelUpload(fileId);
        }
      });

      set({ uploads: new Map(), isUploadInProgress: false });
      storageService.clearPendingUploads();
    },

    // Load upload history
    loadHistory: () => {
      const history = storageService.getUploadHistory();
      set({ uploadHistory: history });
    },

    // Clear upload history
    clearHistory: () => {
      storageService.clearHistory();
      set({ uploadHistory: [] });
    },

    // Get overall progress
    getOverallProgress: (): OverallProgress => {
      const { uploads } = get();
      const filesArray = Array.from(uploads.values());

      const totalFiles = filesArray.length;
      const completedFiles = filesArray.filter(f => f.status === 'completed').length;
      const failedFiles = filesArray.filter(f => f.status === 'failed').length;
      const uploadingFiles = filesArray.filter(f =>
        f.status === 'uploading' || f.status === 'hashing' ||
        f.status === 'initiating' || f.status === 'finalizing'
      ).length;

      // Calculate overall progress
      const totalProgress = filesArray.reduce((sum, file) => sum + file.progress, 0);
      const overallProgress = totalFiles > 0 ? Math.round(totalProgress / totalFiles) : 0;

      return {
        totalFiles,
        completedFiles,
        failedFiles,
        uploadingFiles,
        overallProgress,
      };
    },

    // Update file progress
    updateFileProgress: (fileId: string, progress: number, uploadedChunks: number) => {
      const { uploads } = get();
      const file = uploads.get(fileId);

      if (file) {
        const updatedFile = { ...file, progress, uploadedChunks };
        const newUploads = new Map(uploads);
        newUploads.set(fileId, updatedFile);
        set({ uploads: newUploads });

        // Update pending upload in storage
        storageService.savePendingUpload(fileId, updatedFile);
      }
    },

    // Update file status
    updateFileStatus: (fileId: string, status: UploadFile['status']) => {
      const { uploads } = get();
      const file = uploads.get(fileId);

      if (file) {
        const updatedFile = {
          ...file,
          status,
          isPaused: status === 'paused',
          isCancelled: status === 'cancelled',
        };
        const newUploads = new Map(uploads);
        newUploads.set(fileId, updatedFile);
        set({ uploads: newUploads });

        // Show toast notification for status changes
        if (status === 'uploading') {
          useToastStore.getState().addToast({
            type: 'info',
            message: `Started uploading ${file.filename}`,
            duration: 3000,
          });
        } else if (status === 'paused') {
          useToastStore.getState().addToast({
            type: 'info',
            message: `Upload paused: ${file.filename}`,
            duration: 3000,
          });
        }

        // Update history
        storageService.updateHistoryItem(fileId, { status });
        get().loadHistory();
      }
    },

    // Update file error
    updateFileError: (fileId: string, error: string) => {
      const { uploads } = get();
      const file = uploads.get(fileId);

      if (file) {
        const updatedFile = { ...file, error, status: 'failed' as const };
        const newUploads = new Map(uploads);
        newUploads.set(fileId, updatedFile);
        set({ uploads: newUploads });

        // Show error toast notification
        useToastStore.getState().addToast({
          type: 'error',
          message: `Upload failed: ${file.filename} - ${error}`,
          duration: 5000,
        });

        // Update history
        storageService.updateHistoryItem(fileId, {
          status: 'failed',
          error,
          completedAt: new Date().toISOString(),
        });
        get().loadHistory();
        storageService.removePendingUpload(fileId);
      }
    },

    // Mark file as complete
    markFileComplete: (fileId: string, uploadId: string, filePath: string) => {
      const { uploads } = get();
      const file = uploads.get(fileId);

      if (file) {
        const updatedFile = {
          ...file,
          status: 'completed' as const,
          uploadId,
          completedAt: new Date(),
          progress: 100,
        };
        const newUploads = new Map(uploads);
        newUploads.set(fileId, updatedFile);
        set({ uploads: newUploads });

        // Show success toast notification
        useToastStore.getState().addToast({
          type: 'success',
          message: `Upload completed: ${file.filename}`,
          duration: 4000,
        });

        // Update history
        storageService.updateHistoryItem(fileId, {
          status: 'completed',
          uploadId,
          filePath,
          completedAt: new Date().toISOString(),
        });
        get().loadHistory();
        storageService.removePendingUpload(fileId);
      }
    },
  };
});
