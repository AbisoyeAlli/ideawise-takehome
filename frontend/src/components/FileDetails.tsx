import { XMarkIcon, PlayIcon, PauseIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { formatFileSize } from '../utils/fileUtils';
import { useUploadStore } from '../store/uploadStore';
import type { UploadFile } from '../types/upload';

interface FileDetailsProps {
  file: UploadFile | null;
}

export const FileDetails = ({ file }: FileDetailsProps) => {
  const startUpload = useUploadStore((state) => state.startUpload);
  const pauseUpload = useUploadStore((state) => state.pauseUpload);
  const resumeUpload = useUploadStore((state) => state.resumeUpload);
  const cancelUpload = useUploadStore((state) => state.cancelUpload);

  if (!file) {
    return (
      <div className="border-2 border-black rounded-lg p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 text-center">
          Display area when a file on the left is clicked
        </p>
      </div>
    );
  }

  const { filename, filesize, mimeType, status, progress, uploadedChunks, totalChunks, error, preview } = file;

  const canStart = status === 'pending' || status === 'failed';
  const canPause = status === 'uploading';
  const canResume = status === 'paused';
  const canCancel = status === 'uploading' || status === 'paused' || status === 'pending';

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
      case 'cancelled':
        return 'text-red-600';
      case 'uploading':
      case 'hashing':
      case 'initiating':
      case 'finalizing':
        return 'text-blue-600';
      case 'paused':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="border-2 border-black rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold">File Details</h2>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <img src={preview} alt={filename} className="w-full max-h-64 object-contain rounded border border-gray-300" />
        </div>
      )}

      {/* File Info */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">File Name:</p>
          <p className="text-sm text-black break-all">{filename}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700">Size:</p>
          <p className="text-sm text-black">{formatFileSize(filesize)}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700">Type:</p>
          <p className="text-sm text-black">{mimeType}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700">Status:</p>
          <div className="flex items-center gap-2">
            {status === 'completed' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
            {(status === 'failed' || status === 'cancelled') && (
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-semibold capitalize ${getStatusColor()}`}>
              {status}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {(status === 'uploading' || status === 'hashing' || status === 'initiating' || status === 'finalizing' || status === 'paused') && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Progress:</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  status === 'paused' ? 'bg-yellow-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{Math.round(progress)}%</span>
              {uploadedChunks > 0 && (
                <span>
                  {uploadedChunks}/{totalChunks} chunks
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div>
            <p className="text-sm font-semibold text-gray-700">Error:</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-2">
        {canStart && (
          <button
            onClick={() => startUpload(file.id)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <PlayIcon className="w-4 h-4" />
            Start
          </button>
        )}

        {canPause && (
          <button
            onClick={() => pauseUpload(file.id)}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
          >
            <PauseIcon className="w-4 h-4" />
            Pause
          </button>
        )}

        {canResume && (
          <button
            onClick={() => resumeUpload(file.id)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <PlayIcon className="w-4 h-4" />
            Resume
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => cancelUpload(file.id)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
