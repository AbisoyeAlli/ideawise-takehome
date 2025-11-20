import { TrashIcon } from '@heroicons/react/24/outline';
import { useUploadStore } from '../store/uploadStore';
import { UploadItem } from './UploadItem';

export const UploadList = () => {
  const uploads = useUploadStore((state) => state.uploads);
  const startUpload = useUploadStore((state) => state.startUpload);
  const pauseUpload = useUploadStore((state) => state.pauseUpload);
  const resumeUpload = useUploadStore((state) => state.resumeUpload);
  const cancelUpload = useUploadStore((state) => state.cancelUpload);
  const removeFile = useUploadStore((state) => state.removeFile);
  const clearCompleted = useUploadStore((state) => state.clearCompleted);
  const clearAll = useUploadStore((state) => state.clearAll);

  const uploadArray = Array.from(uploads.values());

  const stats = {
    total: uploadArray.length,
    pending: uploadArray.filter((u) => u.status === 'pending').length,
    uploading: uploadArray.filter((u) =>
      ['uploading', 'hashing', 'initiating', 'finalizing'].includes(u.status)
    ).length,
    paused: uploadArray.filter((u) => u.status === 'paused').length,
    completed: uploadArray.filter((u) => u.status === 'completed').length,
    failed: uploadArray.filter((u) => u.status === 'failed').length,
  };

  const hasCompletedOrFailed = stats.completed > 0 || stats.failed > 0;

  if (uploadArray.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 sm:mt-6">
      {/* Header with Stats and Actions */}
      <div className="bg-red rounded-lg shadow-sm p-2.5 sm:p-3 mb-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-between min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Active Uploads</h2>
            <div className="flex flex-wrap items-center text-xs px-4">
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                {stats.total}
              </span>
              {stats.uploading > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {stats.uploading} uploading
                </span>
              )}
              {stats.paused > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                  {stats.paused} paused
                </span>
              )}
              {stats.completed > 0 && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  {stats.completed} done
                </span>
              )}
              {stats.failed > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                  {stats.failed} failed
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasCompletedOrFailed && (
              <button
                onClick={clearCompleted}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <TrashIcon className="w-3 h-3" />
              <span>All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Items */}
      <div className="space-y-2">
        {uploadArray.map((upload) => (
          <UploadItem
            key={upload.id}
            upload={upload}
            onStart={() => startUpload(upload.id)}
            onPause={() => pauseUpload(upload.id)}
            onResume={() => resumeUpload(upload.id)}
            onCancel={() => cancelUpload(upload.id)}
            onRemove={() => removeFile(upload.id)}
          />
        ))}
      </div>
    </div>
  );
};
