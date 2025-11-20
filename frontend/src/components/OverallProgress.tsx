import { useUploadStore } from '../store/uploadStore';

export const OverallProgress = () => {
  const getOverallProgress = useUploadStore((state) => state.getOverallProgress);
  const progress = getOverallProgress();

  // Don't show if no files
  if (progress.totalFiles === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold">Overall Progress</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-700">
              <span className="font-semibold">{progress.completedFiles}</span> /{' '}
              {progress.totalFiles} completed
            </span>
            {progress.uploadingFiles > 0 && (
              <span className="text-blue-600 font-medium">
                {progress.uploadingFiles} uploading
              </span>
            )}
            {progress.failedFiles > 0 && (
              <span className="text-red-600 font-medium">
                {progress.failedFiles} failed
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-black">{progress.overallProgress}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress.overallProgress}%` }}
        />
      </div>
    </div>
  );
};
