"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Upload, ImageIcon, Search, Check, FolderOpen, Plus } from "lucide-react";

interface ImageCategory {
  id: string;
  name: string;
  _count: { images: number };
}

interface ImageRecord {
  id: string;
  filename: string;
  url: string;
  alt: string | null;
  size: number | null;
  mimeType: string | null;
  categoryId: string | null;
  category: ImageCategory | null;
}

interface ImagePickerProps {
  /** Currently selected image URLs (for the product) */
  images: string[];
  onChange: (images: string[]) => void;
  /** Optional: pre-assign category when uploading via product page */
  defaultCategoryId?: string;
}

export function ImagePicker({ images, onChange, defaultCategoryId }: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");

  // Library state
  const [library, setLibrary] = useState<ImageRecord[]>([]);
  const [categories, setCategories] = useState<ImageCategory[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [libLoading, setLibLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(images));

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategoryId, setUploadCategoryId] = useState(defaultCategoryId || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLibrary = useCallback(async () => {
    setLibLoading(true);
    const [imgRes, catRes] = await Promise.all([
      fetch(`/api/images?search=${encodeURIComponent(search)}&categoryId=${filterCat === "all" ? "" : filterCat}`),
      fetch("/api/images/categories"),
    ]);
    if (imgRes.ok) setLibrary(await imgRes.json());
    if (catRes.ok) setCategories(await catRes.json());
    setLibLoading(false);
  }, [search, filterCat]);

  useEffect(() => {
    if (!open) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(fetchLibrary, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [open, fetchLibrary]);

  // Sync selected set when images prop changes
  useEffect(() => { setSelected(new Set(images)); }, [images]);

  function toggleImage(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function applySelection() {
    // Preserve order: existing images first, then newly selected
    const existing = images.filter((u) => selected.has(u));
    const newOnes = [...selected].filter((u) => !images.includes(u));
    onChange([...existing, ...newOnes]);
    setOpen(false);
  }

  function removeImage(url: string) {
    onChange(images.filter((u) => u !== url));
  }

  // Upload tab
  function handlePickFiles(files: FileList) {
    setUploadFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function removeUploadFile(index: number) {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadAll() {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError("");
    const uploaded: string[] = [];

    for (const file of uploadFiles) {
      const form = new FormData();
      form.append("file", file);
      if (uploadCategoryId) form.append("categoryId", uploadCategoryId);
      if (uploadAlt) form.append("alt", uploadAlt);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        uploaded.push(data.url);
      } else {
        const data = await res.json();
        setUploadError(data.error || "Upload failed");
      }
    }

    setUploading(false);
    setUploadFiles([]);
    setUploadAlt("");

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
      // Refresh library and switch to it
      await fetchLibrary();
      setTab("library");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold" style={{ color: "#323130" }}>Images</label>

      {/* Current images preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square overflow-hidden bg-[#f3f2f1]" style={{ border: "1px solid #edebe9" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "#a4262c", color: "#fff" }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-xs transition-colors"
        style={{ border: "1px dashed #8a8886", backgroundColor: "#faf9f8", color: "#605e5c", width: "100%" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0078d4"; (e.currentTarget as HTMLElement).style.color = "#0078d4"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#8a8886"; (e.currentTarget as HTMLElement).style.color = "#605e5c"; }}
      >
        <ImageIcon size={13} />
        <span>{images.length > 0 ? "Manage images" : "Add images from library or upload"}</span>
        <Plus size={13} className="ml-auto" />
      </button>

      {/* ─── Modal ─── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Dialog */}
          <div
            className="relative flex flex-col"
            style={{ width: "min(860px, 95vw)", height: "min(600px, 90vh)", backgroundColor: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid #edebe9" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#edebe9", backgroundColor: "#faf9f8" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#323130" }}>Image Library</h2>
              <button onClick={() => setOpen(false)} style={{ color: "#605e5c" }}><X size={16} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "#edebe9" }}>
              {(["library", "upload"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 text-xs font-medium capitalize transition-colors"
                  style={{
                    color: tab === t ? "#0078d4" : "#605e5c",
                    borderBottom: tab === t ? "2px solid #0078d4" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {t === "library" ? "Library" : "Upload New"}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {tab === "library" ? (
                <>
                  {/* Category sidebar */}
                  <div className="w-40 shrink-0 border-r overflow-y-auto py-2" style={{ borderColor: "#edebe9", backgroundColor: "#faf9f8" }}>
                    {[
                      { id: "all", name: "All Images", count: library.length },
                      { id: "uncategorized", name: "Uncategorized", count: null },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setFilterCat(item.id)}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-left transition-colors"
                        style={{ color: filterCat === item.id ? "#0078d4" : "#323130", fontWeight: filterCat === item.id ? 600 : 400, backgroundColor: filterCat === item.id ? "rgba(0,120,212,0.08)" : "transparent" }}
                      >
                        <FolderOpen size={12} className="shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {item.count !== null && <span className="ml-auto" style={{ color: "#a19f9d" }}>{item.count}</span>}
                      </button>
                    ))}
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFilterCat(cat.id)}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-left transition-colors"
                        style={{ color: filterCat === cat.id ? "#0078d4" : "#323130", fontWeight: filterCat === cat.id ? 600 : 400, backgroundColor: filterCat === cat.id ? "rgba(0,120,212,0.08)" : "transparent" }}
                      >
                        <FolderOpen size={12} className="shrink-0" />
                        <span className="truncate">{cat.name}</span>
                        <span className="ml-auto" style={{ color: "#a19f9d" }}>{cat._count.images}</span>
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Search */}
                    <div className="px-3 py-2 border-b" style={{ borderColor: "#edebe9" }}>
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#a19f9d" }} />
                        <input
                          className="w-full pl-8 pr-3 py-1 text-xs border focus:outline-none"
                          style={{ borderColor: "#8a8886" }}
                          placeholder="Search..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                      {libLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <svg className="animate-spin w-5 h-5" style={{ color: "#0078d4" }} fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        </div>
                      ) : library.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-2">
                          <ImageIcon size={28} style={{ color: "#c8c6c4" }} />
                          <p className="text-xs" style={{ color: "#605e5c" }}>
                            No images found.{" "}
                            <button onClick={() => setTab("upload")} style={{ color: "#0078d4" }}>Upload some?</button>
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {library.map((img) => {
                            const isSelected = selected.has(img.url);
                            return (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => toggleImage(img.url)}
                                className="relative aspect-square overflow-hidden focus:outline-none"
                                style={{ border: isSelected ? "2px solid #0078d4" : "1px solid #edebe9", backgroundColor: "#f3f2f1" }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt={img.alt || img.filename} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center" style={{ backgroundColor: "#0078d4" }}>
                                    <Check size={12} color="#fff" />
                                  </div>
                                )}
                                <div
                                  className="absolute bottom-0 left-0 right-0 px-1 py-0.5 truncate text-white opacity-0 hover:opacity-100 transition-opacity"
                                  style={{ fontSize: "9px", backgroundColor: "rgba(0,0,0,0.6)" }}
                                >
                                  {img.alt || img.filename}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Upload tab */
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Drop zone */}
                  <div
                    className="flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors"
                    style={{ border: "2px dashed #8a8886", backgroundColor: "#faf9f8" }}
                    onClick={() => fileRef.current?.click()}
                    onDrop={(e) => { e.preventDefault(); e.dataTransfer.files.length > 0 && handlePickFiles(e.dataTransfer.files); }}
                    onDragOver={(e) => e.preventDefault()}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0078d4"; (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f6ff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#8a8886"; (e.currentTarget as HTMLElement).style.backgroundColor = "#faf9f8"; }}
                  >
                    <Upload size={24} style={{ color: "#a19f9d" }} />
                    <p className="text-sm" style={{ color: "#605e5c" }}>
                      <span style={{ color: "#0078d4", fontWeight: 500 }}>Click to select</span> or drag files here
                    </p>
                    <p className="text-xs" style={{ color: "#a19f9d" }}>JPEG, PNG, WebP, GIF — max 5MB each</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handlePickFiles(e.target.files)}
                    />
                  </div>

                  {/* File preview */}
                  {uploadFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {uploadFiles.map((file, i) => (
                        <div key={i} className="relative group aspect-square overflow-hidden bg-[#f3f2f1]" style={{ border: "1px solid #edebe9" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeUploadFile(i)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center"
                            style={{ backgroundColor: "#a4262c", color: "#fff" }}
                          >
                            <X size={10} />
                          </button>
                          <div
                            className="absolute bottom-0 left-0 right-0 px-1 py-0.5 truncate text-white"
                            style={{ fontSize: "9px", backgroundColor: "rgba(0,0,0,0.6)" }}
                          >
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#323130" }}>Category</label>
                      <select
                        className="w-full px-2 py-1.5 text-xs border focus:outline-none"
                        style={{ borderColor: "#8a8886", backgroundColor: "#fff" }}
                        value={uploadCategoryId}
                        onChange={(e) => setUploadCategoryId(e.target.value)}
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#323130" }}>Alt text (all files)</label>
                      <input
                        className="w-full px-2 py-1.5 text-xs border focus:outline-none"
                        style={{ borderColor: "#8a8886" }}
                        placeholder="Describe the image..."
                        value={uploadAlt}
                        onChange={(e) => setUploadAlt(e.target.value)}
                      />
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-xs px-3 py-2" style={{ backgroundColor: "#fde7e9", color: "#a4262c", border: "1px solid #f1707b" }}>{uploadError}</p>
                  )}

                  <button
                    type="button"
                    onClick={uploadAll}
                    disabled={uploading || uploadFiles.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#0078d4", color: "#fff" }}
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={13} />
                        Upload {uploadFiles.length > 0 ? `${uploadFiles.length} file${uploadFiles.length > 1 ? "s" : ""}` : ""}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {tab === "library" && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#edebe9", backgroundColor: "#faf9f8" }}>
                <p className="text-xs" style={{ color: "#605e5c" }}>
                  {selected.size} selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 text-xs transition-colors"
                    style={{ color: "#323130", border: "1px solid #8a8886" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applySelection}
                    className="px-4 py-1.5 text-xs font-medium transition-colors"
                    style={{ backgroundColor: "#0078d4", color: "#fff" }}
                  >
                    Apply Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
