import { useRef, useState } from 'react';
import { FILE_TYPE_ACCEPT, UPLOAD_CONFIG } from '../config/constants';
import { formatFileSize } from '../utils/fileUtils';

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FilePicker = ({ onFilesSelected, disabled = false }: FilePickerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={`
        relative border-2 border-dashed border-black rounded-lg py-16 sm:py-24 px-6 text-center transition-all duration-200
        ${isDragging ? 'bg-gray-100' : 'bg-white'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
      `}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="max-w-md mx-auto">
        <p className="text-base sm:text-lg font-medium text-black mb-2">
          {isDragging ? 'Drop file here to upload' : 'Click to Upload or drag file here to upload'}
        </p>
        <p className="text-sm text-gray-700 mb-1">
          Images & Videos supported.
        </p>
        <p className="text-sm text-gray-700">
          ({formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)} max. Up to {UPLOAD_CONFIG.MAX_FILES} files)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_TYPE_ACCEPT}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};
