export const UPLOAD_CONFIG = {
  CHUNK_SIZE: 1024 * 1024,
  MAX_CONCURRENT_UPLOADS: 3,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  MAX_FILE_SIZE: 500 * 1024 * 1024,
  MAX_FILES: 10,
};

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/x-flv',
  'video/3gpp',
  'video/3gpp2',
];

export const FILE_TYPE_ACCEPT = 'image/*,video/*';

export const STORAGE_KEYS = {
  UPLOAD_HISTORY: 'upload_history',
  PENDING_UPLOADS: 'pending_uploads',
};

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'File type not allowed',
  TOO_MANY_FILES: 'Too many files selected',
  NETWORK_ERROR: 'Network error occurred',
  UPLOAD_FAILED: 'Upload failed',
  FILE_VALIDATION_FAILED: 'File validation failed',
};
