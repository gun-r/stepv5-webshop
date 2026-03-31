"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (res.ok) {
        uploaded.push(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Images</label>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Uploading...
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-400" />
            <p className="text-sm text-gray-500">
              <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">JPEG, PNG, WebP, GIF — max 5MB each</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
