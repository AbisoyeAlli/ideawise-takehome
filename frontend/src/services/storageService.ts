import { STORAGE_KEYS } from '../config/constants';
import type { UploadHistoryItem, UploadFile } from '../types/upload';

class StorageService {
  // Upload History
  getUploadHistory(): UploadHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading upload history:', error);
      return [];
    }
  }

  saveUploadHistory(history: UploadHistoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving upload history:', error);
    }
  }

  addToHistory(item: UploadHistoryItem): void {
    const history = this.getUploadHistory();
    // Add to beginning of array (most recent first)
    history.unshift(item);
    // Keep only last 100 items
    const trimmedHistory = history.slice(0, 100);
    this.saveUploadHistory(trimmedHistory);
  }

  updateHistoryItem(id: string, updates: Partial<UploadHistoryItem>): void {
    const history = this.getUploadHistory();
    const index = history.findIndex((item) => item.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      this.saveUploadHistory(history);
    }
  }

  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY);
  }

  // Pending Uploads (for resumable uploads)
  getPendingUploads(): Record<string, Partial<UploadFile>> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading pending uploads:', error);
      return {};
    }
  }

  savePendingUpload(fileId: string, uploadData: Partial<UploadFile>): void {
    try {
      const pending = this.getPendingUploads();
      pending[fileId] = {
        uploadId: uploadData.uploadId,
        filename: uploadData.filename,
        filesize: uploadData.filesize,
        mimeType: uploadData.mimeType,
        uploadedChunks: uploadData.uploadedChunks,
        totalChunks: uploadData.totalChunks,
        status: uploadData.status,
      };
      localStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(pending));
    } catch (error) {
      console.error('Error saving pending upload:', error);
    }
  }

  removePendingUpload(fileId: string): void {
    try {
      const pending = this.getPendingUploads();
      delete pending[fileId];
      localStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(pending));
    } catch (error) {
      console.error('Error removing pending upload:', error);
    }
  }

  clearPendingUploads(): void {
    localStorage.removeItem(STORAGE_KEYS.PENDING_UPLOADS);
  }
}

export const storageService = new StorageService();
