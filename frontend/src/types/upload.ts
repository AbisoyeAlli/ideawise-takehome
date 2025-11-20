export interface UploadFile {
  id: string;
  file: File;
  filename: string;
  filesize: number;
  mimeType: string;
  md5Hash?: string;
  preview?: string;
  status: UploadStatus;
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  uploadId?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  isPaused: boolean;
  isCancelled: boolean;
}

export type UploadStatus =
  | 'pending'
  | 'hashing'
  | 'initiating'
  | 'uploading'
  | 'paused'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ChunkUploadTask {
  uploadId: string;
  fileId: string;
  chunkIndex: number;
  chunkData: Blob;
  retryCount: number;
  abortController: AbortController;
}

export interface UploadConfig {
  chunkSize: number;
  maxConcurrentUploads: number;
  maxRetries: number;
  retryDelay: number;
  apiBaseUrl: string;
}

export interface InitiateUploadRequest {
  filename: string;
  filesize: number;
  mimeType: string;
  md5Hash: string;
}

export interface InitiateUploadResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
  duplicate?: boolean;
  filePath?: string;
}

export interface ChunkUploadResponse {
  success: boolean;
  chunkIndex: number;
  uploadedChunks: number;
  totalChunks: number;
  alreadyUploaded?: boolean;
}

export interface FinalizeUploadRequest {
  uploadId: string;
}

export interface FinalizeUploadResponse {
  success: boolean;
  uploadId: string;
  filePath: string;
  filename: string;
}

export interface UploadStatusResponse {
  uploadId: string;
  filename: string;
  status: string;
  uploadedChunks: number;
  totalChunks: number;
  filesize: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface UploadHistoryItem {
  id: string;
  filename: string;
  filesize: number;
  status: UploadStatus;
  uploadId?: string;
  filePath?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}
