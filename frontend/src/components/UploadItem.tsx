import {
  PlayIcon,
  PauseIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { formatFileSize, getFileTypeCategory } from '../utils/fileUtils';
import type { UploadFile } from '../types/upload';

interface UploadItemProps {
  upload: UploadFile;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRemove: () => void;
}

export const UploadItem = ({
  upload,
  onStart,
  onPause,
  onResume,
  onCancel,
  onRemove,
}: UploadItemProps) => {
  const { filename, filesize, mimeType, status, progress, uploadedChunks, totalChunks, error, preview } = upload;

  const fileCategory = getFileTypeCategory(mimeType);

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

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'hashing':
        return 'Hashing...';
      case 'initiating':
        return 'Starting...';
      case 'uploading':
        return `${uploadedChunks}/${totalChunks} chunks`;
      case 'paused':
        return 'Paused';
      case 'finalizing':
        return 'Finalizing...';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const canStart = status === 'pending' || status === 'failed';
  const canPause = status === 'uploading';
  const canResume = status === 'paused';
  const canCancel = status === 'uploading' || status === 'paused' || status === 'pending';
  const canRemove = status === 'completed' || status === 'failed' || status === 'cancelled';

  const isActive = status === 'uploading' || status === 'hashing' || status === 'initiating' || status === 'finalizing';

  return (
    <div className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 transition-all hover:shadow border border-gray-200">
      <div className="flex items-start gap-2 sm:gap-2.5">
        {/* Preview/Icon */}
        <div className="flex-shrink-0">
          {preview ? (
            <img src={preview} alt={filename} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded" />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded flex items-center justify-center">
              {fileCategory === 'image' ? (
                <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              ) : (
                <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              )}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={filename}>
                {filename}
              </h3>
              <p className="text-xs text-gray-500">{formatFileSize(filesize)}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5">
              {canStart && (
                <button
                  onClick={onStart}
                  className="p-0.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Start upload"
                  aria-label="Start upload"
                >
                  <PlayIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {canPause && (
                <button
                  onClick={onPause}
                  className="p-0.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                  title="Pause upload"
                  aria-label="Pause upload"
                >
                  <PauseIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {canResume && (
                <button
                  onClick={onResume}
                  className="p-0.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Resume upload"
                  aria-label="Resume upload"
                >
                  <PlayIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {canCancel && (
                <button
                  onClick={onCancel}
                  className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Cancel upload"
                  aria-label="Cancel upload"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {canRemove && (
                <button
                  onClick={onRemove}
                  className="p-0.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title="Remove from list"
                  aria-label="Remove from list"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(status === 'uploading' || status === 'hashing' || status === 'initiating' || status === 'finalizing' || status === 'paused') && (
            <div className="mb-1">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    status === 'paused' ? 'bg-yellow-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                {uploadedChunks > 0 && (
                  <span className="text-xs text-gray-500">
                    {uploadedChunks}/{totalChunks}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-1">
            {status === 'completed' && <CheckCircleIcon className="w-3 h-3 text-green-600" />}
            {(status === 'failed' || status === 'cancelled') && (
              <ExclamationCircleIcon className="w-3 h-3 text-red-600" />
            )}
            {isActive && <ArrowPathIcon className="w-3 h-3 text-blue-600 animate-spin" />}

            <span className={`text-xs font-medium ${getStatusColor()}`}>{getStatusText()}</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-1.5 p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
