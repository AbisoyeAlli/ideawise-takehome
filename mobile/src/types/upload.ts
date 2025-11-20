export type UploadStatus =
  | 'idle'
  | 'hashing'
  | 'initiating'
  | 'uploading'
  | 'paused'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'duplicate';

export interface UploadFile {
  fileId: string;
  filename: string;
  filesize: number;
  mimeType: string;
  md5Hash?: string;
  uploadId?: string;
  status: UploadStatus;
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  error?: string;
  filePath?: string;
  createdAt: Date;
  completedAt?: Date;
  uri: string;
}

export interface ChunkUploadResult {
  success: boolean;
  chunkIndex: number;
  uploadedChunks: number;
  totalChunks: number;
  alreadyUploaded?: boolean;
  error?: string;
}

export interface InitiateUploadResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
  duplicate?: boolean;
  filePath?: string;
}

export interface FinalizeUploadResponse {
  success: boolean;
  uploadId: string;
  filePath: string;
  filename: string;
}

export interface UploadStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  uploadingFiles: number;
  overallProgress: number;
}

export interface PermissionStatus {
  camera: boolean;
  gallery: boolean;
  storage: boolean;
}
