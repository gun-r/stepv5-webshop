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
    <div className="space-y-2">
      <label className="block text-xs font-semibold" style={{ color: "#323130" }}>Images</label>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 px-6 py-8 cursor-pointer transition-colors"
        style={{ border: "1px dashed #8a8886", backgroundColor: "#faf9f8" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#0078d4";
          (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f6ff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#8a8886";
          (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8";
        }}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#605e5c" }}>
            <svg className="animate-spin w-4 h-4" style={{ color: "#0078d4" }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Uploading...
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5" style={{ color: "#a19f9d" }} />
            <p className="text-sm" style={{ color: "#605e5c" }}>
              <span className="font-medium" style={{ color: "#0078d4" }}>Click to upload</span> or drag and drop
            </p>
            <p className="text-xs" style={{ color: "#a19f9d" }}>JPEG, PNG, WebP, GIF — max 5MB each</p>
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

      {error && <p className="text-xs" style={{ color: "#a4262c" }}>{error}</p>}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square overflow-hidden bg-[#f3f2f1]" style={{ border: "1px solid #edebe9" }}>
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <ImageIcon className="w-5 h-5" style={{ color: "#a19f9d" }} />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "#a4262c", color: "#ffffff" }}
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
