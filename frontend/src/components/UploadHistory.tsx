import { useUploadStore } from '../store/uploadStore';
import type { UploadFile } from '../types/upload';
import { formatFileSize } from '../utils/fileUtils';

interface UploadHistoryProps {
  onFileSelect: (file: UploadFile) => void;
  selectedFileId?: string;
}

export const UploadHistory = ({ onFileSelect, selectedFileId }: UploadHistoryProps) => {
  const uploads = useUploadStore((state) => state.uploads);
  const clearHistory = useUploadStore((state) => state.clearHistory);
  const removeFile = useUploadStore((state) => state.removeFile);

  // Only show active uploads
  const allFiles = Array.from(uploads.values());

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  return (
    <div className="border-2 border-black rounded-lg p-4 min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">History</h2>
        {allFiles.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {allFiles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No files uploaded yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {allFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onFileSelect(file)}
                className={`
                  border rounded p-3 cursor-pointer transition-all
                  ${selectedFileId === file.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <span>{formatFileSize(file.filesize)}</span>
                      <span>•</span>
                      <span className="capitalize">{file.status}</span>
                      {file.createdAt && (
                        <>
                          <span>•</span>
                          <span>{formatDate(file.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-4 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    Delete File
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
