import { useEffect, useState } from 'react';
import { FileDetails } from './components/FileDetails';
import { FilePicker } from './components/FilePicker';
import { UploadHistory } from './components/UploadHistory';
import { OverallProgress } from './components/OverallProgress';
import { ToastContainer } from './components/ToastContainer';
import { useUploadStore } from './store/uploadStore';
import { useToastStore } from './store/toastStore';
import type { UploadFile } from './types/upload';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null);
  const addFiles = useUploadStore((state) => state.addFiles);
  const startUpload = useUploadStore((state) => state.startUpload);
  const uploads = useUploadStore((state) => state.uploads);
  const isUploadInProgress = useUploadStore((state) => state.isUploadInProgress);
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const handleFilesSelected = async (files: File[]) => {
    try {
      setError(null);
      await addFiles(files);

      const uploadArray = Array.from(uploads.values());
      const pendingUploads = uploadArray.filter((u) => u.status === 'pending');

      setTimeout(() => {
        pendingUploads.forEach((upload) => {
          startUpload(upload.id);
        });
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add files';
      setError(errorMessage);
      console.error('Error adding files:', err);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <header className="bg-white border-b-2 border-black py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-center text-black">
            File Uploader
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-700 hover:text-red-900 font-bold text-lg"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <OverallProgress />
        <FilePicker onFilesSelected={handleFilesSelected} disabled={isUploadInProgress} />

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <UploadHistory onFileSelect={setSelectedFile} selectedFileId={selectedFile?.id} />
          <FileDetails file={selectedFile} />
        </div>
      </main>
    </div>
  );
}

export default App;
