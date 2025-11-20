import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '@/config/constants';
import type {
  InitiateUploadResponse,
  ChunkUploadResult,
  FinalizeUploadResponse,
} from '@/types/upload';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async initiateUpload(
    filename: string,
    filesize: number,
    mimeType: string,
    md5Hash: string
  ): Promise<InitiateUploadResponse> {
    const response = await this.client.post('/initiate', {
      filename,
      filesize,
      mimeType,
      md5Hash,
    });
    return response.data;
  }

  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Blob
  ): Promise<ChunkUploadResult> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('chunk', chunkData);

    const response = await this.client.post('/chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async finalizeUpload(uploadId: string): Promise<FinalizeUploadResponse> {
    const response = await this.client.post('/finalize', { uploadId });
    return response.data;
  }

  async getUploadStatus(uploadId: string) {
    const response = await this.client.get(`/status/${uploadId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
