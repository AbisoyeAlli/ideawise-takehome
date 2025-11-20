import axios, { type AxiosInstance } from 'axios';
import { UPLOAD_CONFIG } from '../config/constants';
import type {
  InitiateUploadRequest,
  InitiateUploadResponse,
  ChunkUploadResponse,
  FinalizeUploadRequest,
  FinalizeUploadResponse,
  UploadStatusResponse,
} from '../types/upload';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: UPLOAD_CONFIG.API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
        } else {
          // Something else happened
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async initiateUpload(
    request: InitiateUploadRequest
  ): Promise<InitiateUploadResponse> {
    const response = await this.client.post<InitiateUploadResponse>(
      '/api/upload/initiate',
      request
    );
    return response.data;
  }

  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Blob,
    abortSignal?: AbortSignal
  ): Promise<ChunkUploadResponse> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('chunk', chunkData);

    const response = await this.client.post<ChunkUploadResponse>(
      '/api/upload/chunk',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortSignal,
      }
    );
    return response.data;
  }

  async finalizeUpload(
    request: FinalizeUploadRequest
  ): Promise<FinalizeUploadResponse> {
    const response = await this.client.post<FinalizeUploadResponse>(
      '/api/upload/finalize',
      request
    );
    return response.data;
  }

  async getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
    const response = await this.client.get<UploadStatusResponse>(
      `/api/upload/status/${uploadId}`
    );
    return response.data;
  }
}

export const apiService = new ApiService();
