"use client";

import { useState, useRef, DragEvent } from "react";
import { Upload, File as FileIcon, X, Cloud } from "lucide-react";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  accept?: string;
}

export function FileDropZone({
  onFileSelect,
  selectedFile,
  onClear,
  accept,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div>
      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer
            transition-all duration-500 ease-out
            ${
              isDragging
                ? "border-emerald-600 bg-emerald-50 scale-[1.02] shadow-lg shadow-emerald-600/10"
                : "border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 hover:shadow-md"
            }
          `}
          style={{ backdropFilter: "blur(10px)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />

          <div
            className={`transition-all duration-500 ease-out ${isDragging ? "scale-110" : "scale-100"}`}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-lg">
              <Cloud className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>

            <p className="text-xl font-medium text-gray-900 mb-3 tracking-tight">
              {isDragging
                ? "Suelta tu archivo aquí"
                : "Arrastra tu archivo aquí"}
            </p>
            <p className="text-sm text-gray-500 font-light">
              o haz clic para seleccionar desde tu dispositivo
            </p>
          </div>
        </div>
      ) : (
        <div className="border-2 border-emerald-200 bg-emerald-50 rounded-3xl p-8 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                <FileIcon className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-900 truncate tracking-tight">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600 mt-1 font-light">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={onClear}
              className="ml-4 p-3 text-gray-400 hover:text-gray-700 hover:bg-white/60 rounded-2xl transition-all duration-300 ease-out hover:scale-105"
              title="Eliminar archivo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
