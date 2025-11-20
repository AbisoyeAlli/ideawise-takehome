import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadManager } from '@/services/uploadManager';
import { STORAGE_KEYS } from '@/config/constants';
import type { UploadFile, UploadStats } from '@/types/upload';

interface UploadStore {
  uploads: Map<string, UploadFile>;
  addFile: (file: UploadFile) => void;
  removeFile: (fileId: string) => void;
  updateFileStatus: (fileId: string, status: UploadFile['status']) => void;
  updateFileProgress: (fileId: string, progress: number, uploadedChunks: number) => void;
  updateFileError: (fileId: string, error: string) => void;
  markFileComplete: (fileId: string, uploadId: string, filePath: string) => void;
  startUpload: (fileId: string) => void;
  pauseUpload: (fileId: string) => void;
  pauseAllUploads: () => void;
  clearCompleted: () => void;
  getUploadStats: () => UploadStats;
  loadHistory: () => Promise<void>;
  saveHistory: () => Promise<void>;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploads: new Map(),

  addFile: (file) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.set(file.fileId, file);
      return { uploads: newUploads };
    });
    get().saveHistory();
  },

  removeFile: (fileId) => {
    uploadManager.pauseUpload(fileId);
    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.delete(fileId);
      return { uploads: newUploads };
    });
    get().saveHistory();
  },

  updateFileStatus: (fileId, status) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const file = newUploads.get(fileId);
      if (file) {
        newUploads.set(fileId, { ...file, status });
      }
      return { uploads: newUploads };
    });
    get().saveHistory();
  },

  updateFileProgress: (fileId, progress, uploadedChunks) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const file = newUploads.get(fileId);
      if (file) {
        newUploads.set(fileId, { ...file, progress, uploadedChunks });
      }
      return { uploads: newUploads };
    });
  },

  updateFileError: (fileId, error) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const file = newUploads.get(fileId);
      if (file) {
        newUploads.set(fileId, { ...file, error, status: 'failed' });
      }
      return { uploads: newUploads };
    });
    get().saveHistory();
  },

  markFileComplete: (fileId, uploadId, filePath) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const file = newUploads.get(fileId);
      if (file) {
        newUploads.set(fileId, {
          ...file,
          uploadId,
          filePath,
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        });
      }
      return { uploads: newUploads };
    });
    get().saveHistory();
  },

  startUpload: (fileId) => {
    const file = get().uploads.get(fileId);
    if (!file) return;

    uploadManager.startUpload(
      file,
      (id, progress, uploadedChunks) => {
        get().updateFileProgress(id, progress, uploadedChunks);
      },
      (id, status) => {
        get().updateFileStatus(id, status);
      },
      (id, uploadId, filePath) => {
        get().markFileComplete(id, uploadId, filePath);
      },
      (id, error) => {
        get().updateFileError(id, error);
      }
    );
  },

  pauseUpload: (fileId) => {
    uploadManager.pauseUpload(fileId);
    get().updateFileStatus(fileId, 'paused');
  },

  pauseAllUploads: () => {
    uploadManager.pauseAllUploads();
    get().uploads.forEach((file) => {
      if (
        file.status === 'uploading' ||
        file.status === 'hashing' ||
        file.status === 'initiating' ||
        file.status === 'finalizing'
      ) {
        get().updateFileStatus(file.fileId, 'paused');
      }
    });
  },

  clearCompleted: () => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      Array.from(newUploads.entries()).forEach(([fileId, file]) => {
        if (file.status === 'completed' || file.status === 'duplicate') {
          newUploads.delete(fileId);
        }
      });
      return { uploads: newUploads };
    });
    get().saveHistory();
  },

  getUploadStats: (): UploadStats => {
    const { uploads } = get();
    const filesArray = Array.from(uploads.values());
    const totalFiles = filesArray.length;
    const completedFiles = filesArray.filter((f) => f.status === 'completed').length;
    const failedFiles = filesArray.filter((f) => f.status === 'failed').length;
    const uploadingFiles = filesArray.filter(
      (f) =>
        f.status === 'uploading' ||
        f.status === 'hashing' ||
        f.status === 'initiating' ||
        f.status === 'finalizing'
    ).length;
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

  loadHistory: async () => {
    try {
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
      if (historyJson) {
        const historyArray = JSON.parse(historyJson);
        // Restore Date objects from ISO strings
        const uploadsMap = new Map<string, UploadFile>(
          historyArray.map((file: any) => [
            file.fileId,
            {
              ...file,
              createdAt: file.createdAt ? new Date(file.createdAt) : new Date(),
              completedAt: file.completedAt ? new Date(file.completedAt) : undefined,
            } as UploadFile,
          ])
        );
        set({ uploads: uploadsMap });
      }
    } catch (error) {
      // Silently handle errors - history is not critical
      if (__DEV__) {
        console.warn('Failed to load upload history:', error);
      }
    }
  },

  saveHistory: async () => {
    try {
      const { uploads } = get();
      let historyArray = Array.from(uploads.values());

      // Limit history to most recent 50 items to avoid AsyncStorage size limits
      if (historyArray.length > 50) {
        // Sort by creation date (newest first) and keep only the last 50
        historyArray = historyArray
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 50);

        // Update the uploads map with the trimmed history
        const trimmedMap = new Map(historyArray.map(file => [file.fileId, file]));
        set({ uploads: trimmedMap });
      }

      // Only save essential data to reduce storage size
      const compactHistory = historyArray.map(file => ({
        fileId: file.fileId,
        filename: file.filename,
        filesize: file.filesize,
        mimeType: file.mimeType,
        status: file.status,
        progress: file.progress,
        uploadedChunks: file.uploadedChunks,
        totalChunks: file.totalChunks,
        createdAt: file.createdAt.toISOString(),
        completedAt: file.completedAt?.toISOString(),
        uploadId: file.uploadId,
        error: file.error,
        // Omit uri and filePath to save space
      }));

      // Date objects will be automatically converted to ISO strings by JSON.stringify
      await AsyncStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(compactHistory));
    } catch (error) {
      // Silently handle errors - history is not critical
      if (__DEV__) {
        console.warn('Failed to save upload history:', error);
      }
    }
  },
}));
