import { Platform } from 'react-native';

// Environment-based API URL configuration
// For development:
// - iOS Simulator: use localhost
// - Android Emulator: use 10.0.2.2 (emulator's special alias)
// - Physical Device: use your computer's local IP address (e.g., 192.168.1.100)
const getApiBaseUrl = (): string => {
  // Check if running in production (you can customize this logic)
  // @ts-ignore - Config is injected during build
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:8000/api/upload';
    } else {
      // iOS simulator can use localhost
      return 'http://localhost:8000/api/upload';
    }
  }

  // Production mode - set your production API URL here
  return 'https://your-production-api.com/api/upload';
};

export const API_BASE_URL = getApiBaseUrl();

export const UPLOAD_CONFIG = {
  CHUNK_SIZE: 512 * 1024, // 512KB chunks (smaller for mobile)
  MAX_CONCURRENT_UPLOADS: 2, // Reduced for mobile bandwidth
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // Initial retry delay in ms
  MAX_RETRY_DELAY: 30000, // Maximum retry delay (30 seconds)
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB max file size (mobile-friendly)
} as const;

export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  // Videos
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/3gpp',
  'video/3gpp2',
] as const;

export const STORAGE_KEYS = {
  UPLOAD_HISTORY: '@upload_history',
  PENDING_UPLOADS: '@pending_uploads',
} as const;
