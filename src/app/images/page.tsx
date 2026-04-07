"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Upload, X, FolderOpen, ImageIcon, Plus, Edit2, Trash2, Check, Search,
} from "lucide-react";

interface ImageCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
  createdAt: string;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImagesPage() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [categories, setCategories] = useState<ImageCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Selected image detail
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  // Category management
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState("");
  const [editingCat, setEditingCat] = useState<ImageCategory | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [imgRes, catRes] = await Promise.all([
      fetch(`/api/images?search=${encodeURIComponent(search)}&categoryId=${selectedCategoryId === "all" ? "" : selectedCategoryId}`),
      fetch("/api/images/categories"),
    ]);
    if (imgRes.ok) setImages(await imgRes.json());
    if (catRes.ok) setCategories(await catRes.json());
    setLoading(false);
  }, [search, selectedCategoryId]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(fetchAll, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [fetchAll]);

  // Upload files
  async function handleFiles(files: FileList) {
    setUploadError("");
    setUploading(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      if (selectedCategoryId !== "all" && selectedCategoryId !== "uncategorized") {
        form.append("categoryId", selectedCategoryId);
      }
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error || "Upload failed");
      }
    }
    setUploading(false);
    fetchAll();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  // Select image for detail panel
  function openImage(img: ImageRecord) {
    setSelectedImage(img);
    setEditAlt(img.alt || "");
    setEditCategoryId(img.categoryId || "");
  }

  async function saveImageMeta() {
    if (!selectedImage) return;
    setSaving(true);
    const res = await fetch(`/api/images/${selectedImage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt: editAlt, categoryId: editCategoryId || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedImage(updated);
      setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
      fetchAll(); // refresh counts
    }
    setSaving(false);
  }

  async function deleteImage(img: ImageRecord) {
    if (!confirm(`Delete "${img.filename}"?`)) return;
    await fetch(`/api/images/${img.id}`, { method: "DELETE" });
    if (selectedImage?.id === img.id) setSelectedImage(null);
    fetchAll();
  }

  // Category CRUD
  async function saveCategory() {
    setCatSaving(true);
    setCatError("");
    const url = editingCat ? `/api/images/categories/${editingCat.id}` : "/api/images/categories";
    const method = editingCat ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, description: catDesc }),
    });
    if (res.ok) {
      setCatName(""); setCatDesc(""); setShowCatForm(false); setEditingCat(null);
      fetchAll();
    } else {
      const data = await res.json();
      setCatError(data.error || "Failed to save");
    }
    setCatSaving(false);
  }

  async function deleteCategory(cat: ImageCategory) {
    if (!confirm(`Delete category "${cat.name}"? Images will become uncategorized.`)) return;
    await fetch(`/api/images/categories/${cat.id}`, { method: "DELETE" });
    if (selectedCategoryId === cat.id) setSelectedCategoryId("all");
    fetchAll();
  }

  function startEditCat(cat: ImageCategory) {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || "");
    setCatError("");
    setShowCatForm(true);
  }

  const totalCount = categories.reduce((n, c) => n + c._count.images, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f3f2f1" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title="Images" subtitle="Manage and organize your image library" />
        <main className="flex-1 overflow-auto p-4">
          <div className="flex gap-4 h-full max-w-screen-xl mx-auto">

            {/* ─── Left sidebar: categories ─── */}
            <div className="w-48 shrink-0 flex flex-col gap-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Categories</CardTitle>
                    <button
                      onClick={() => { setEditingCat(null); setCatName(""); setCatDesc(""); setCatError(""); setShowCatForm(!showCatForm); }}
                      className="w-5 h-5 flex items-center justify-center transition-colors"
                      style={{ color: "#0078d4" }}
                      title="Add category"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </CardHeader>
                {showCatForm && (
                  <div className="px-4 py-2 border-b" style={{ borderColor: "#edebe9" }}>
                    <div className="space-y-1.5">
                      <input
                        className="w-full px-2 py-1 text-xs border focus:outline-none"
                        style={{ borderColor: "#8a8886" }}
                        placeholder="Category name"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveCategory()}
                      />
                      <input
                        className="w-full px-2 py-1 text-xs border focus:outline-none"
                        style={{ borderColor: "#8a8886" }}
                        placeholder="Description (optional)"
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                      />
                      {catError && <p className="text-xs" style={{ color: "#a4262c" }}>{catError}</p>}
                      <div className="flex gap-1">
                        <button
                          onClick={saveCategory}
                          disabled={catSaving || !catName.trim()}
                          className="flex-1 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#0078d4", color: "#fff" }}
                        >
                          {catSaving ? "Saving..." : editingCat ? "Update" : "Add"}
                        </button>
                        <button
                          onClick={() => { setShowCatForm(false); setEditingCat(null); setCatName(""); setCatDesc(""); }}
                          className="px-2 py-1 text-xs"
                          style={{ color: "#605e5c" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <CardContent className="py-1">
                  {/* All */}
                  <button
                    onClick={() => setSelectedCategoryId("all")}
                    className="w-full flex items-center justify-between px-1 py-1.5 text-xs transition-colors"
                    style={{ color: selectedCategoryId === "all" ? "#0078d4" : "#323130", fontWeight: selectedCategoryId === "all" ? 600 : 400 }}
                  >
                    <span className="flex items-center gap-1.5"><FolderOpen size={12} />All Images</span>
                    <span style={{ color: "#a19f9d" }}>{totalCount}</span>
                  </button>
                  {/* Uncategorized */}
                  <button
                    onClick={() => setSelectedCategoryId("uncategorized")}
                    className="w-full flex items-center justify-between px-1 py-1.5 text-xs transition-colors"
                    style={{ color: selectedCategoryId === "uncategorized" ? "#0078d4" : "#605e5c", fontWeight: selectedCategoryId === "uncategorized" ? 600 : 400 }}
                  >
                    <span className="flex items-center gap-1.5"><FolderOpen size={12} />Uncategorized</span>
                  </button>
                  {/* Categories */}
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group flex items-center justify-between px-1 py-1.5"
                    >
                      <button
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="flex-1 text-left text-xs flex items-center gap-1.5 truncate"
                        style={{ color: selectedCategoryId === cat.id ? "#0078d4" : "#323130", fontWeight: selectedCategoryId === cat.id ? 600 : 400 }}
                      >
                        <FolderOpen size={12} className="shrink-0" />
                        <span className="truncate">{cat.name}</span>
                        <span style={{ color: "#a19f9d", marginLeft: "auto", paddingLeft: 4 }}>{cat._count.images}</span>
                      </button>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                        <button onClick={() => startEditCat(cat)} className="p-0.5" style={{ color: "#605e5c" }} title="Edit"><Edit2 size={11} /></button>
                        <button onClick={() => deleteCategory(cat)} className="p-0.5" style={{ color: "#a4262c" }} title="Delete"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* ─── Main area ─── */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#a19f9d" }} />
                  <input
                    className="w-full pl-8 pr-3 py-1.5 text-xs border focus:outline-none focus:border-blue-500"
                    style={{ borderColor: "#8a8886", backgroundColor: "#fff" }}
                    placeholder="Search images..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  loading={uploading}
                >
                  <Upload size={13} className="mr-1" />
                  Upload
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              {uploadError && (
                <p className="text-xs px-3 py-2" style={{ backgroundColor: "#fde7e9", color: "#a4262c", border: "1px solid #f1707b" }}>{uploadError}</p>
              )}

              {/* Drop zone notice */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex gap-3 flex-1 min-h-0"
              >
                {/* Image grid */}
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <svg className="animate-spin w-5 h-5" style={{ color: "#0078d4" }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    </div>
                  ) : images.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center gap-3 py-16 cursor-pointer"
                      style={{ border: "2px dashed #edebe9", backgroundColor: "#faf9f8" }}
                      onClick={() => inputRef.current?.click()}
                    >
                      <ImageIcon size={32} style={{ color: "#c8c6c4" }} />
                      <p className="text-sm" style={{ color: "#605e5c" }}>
                        No images yet —{" "}
                        <span style={{ color: "#0078d4", fontWeight: 500 }}>click to upload</span> or drag files here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => openImage(img)}
                          className="relative group aspect-square overflow-hidden cursor-pointer"
                          style={{
                            border: selectedImage?.id === img.id ? "2px solid #0078d4" : "1px solid #edebe9",
                            backgroundColor: "#f3f2f1",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.alt || img.filename} className="w-full h-full object-cover" />
                          {selectedImage?.id === img.id && (
                            <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center" style={{ backgroundColor: "#0078d4" }}>
                              <Check size={10} color="#fff" />
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteImage(img); }}
                            className="absolute top-0.5 left-0.5 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: "#a4262c", color: "#fff" }}
                            title="Delete"
                          >
                            <X size={11} />
                          </button>
                          <div
                            className="absolute bottom-0 left-0 right-0 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate text-white"
                            style={{ fontSize: "9px", backgroundColor: "rgba(0,0,0,0.6)" }}
                          >
                            {img.filename}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detail panel */}
                {selectedImage && (
                  <div className="w-56 shrink-0">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Details</CardTitle>
                          <button onClick={() => setSelectedImage(null)} style={{ color: "#605e5c" }}>
                            <X size={13} />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 space-y-3">
                        {/* Preview */}
                        <div className="aspect-square overflow-hidden bg-[#f3f2f1]" style={{ border: "1px solid #edebe9" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedImage.url} alt={selectedImage.alt || selectedImage.filename} className="w-full h-full object-contain" />
                        </div>

                        {/* Meta */}
                        <div className="space-y-1 text-xs" style={{ color: "#605e5c" }}>
                          <p className="truncate font-medium" style={{ color: "#323130" }}>{selectedImage.filename}</p>
                          <p>{formatBytes(selectedImage.size)}</p>
                          <p>{selectedImage.mimeType || "—"}</p>
                        </div>

                        {/* Alt text */}
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "#323130" }}>Alt text</label>
                          <input
                            className="w-full px-2 py-1 text-xs border focus:outline-none"
                            style={{ borderColor: "#8a8886" }}
                            placeholder="Describe this image..."
                            value={editAlt}
                            onChange={(e) => setEditAlt(e.target.value)}
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "#323130" }}>Category</label>
                          <select
                            className="w-full px-2 py-1 text-xs border focus:outline-none"
                            style={{ borderColor: "#8a8886", backgroundColor: "#fff" }}
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        <Button variant="primary" size="sm" onClick={saveImageMeta} loading={saving} className="w-full">
                          Save
                        </Button>

                        {/* Copy URL */}
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedImage.url)}
                          className="w-full py-1 text-xs text-center transition-colors"
                          style={{ color: "#0078d4", border: "1px solid #0078d4" }}
                        >
                          Copy URL
                        </button>

                        <button
                          onClick={() => deleteImage(selectedImage)}
                          className="w-full py-1 text-xs text-center transition-colors"
                          style={{ color: "#a4262c", border: "1px solid #a4262c" }}
                        >
                          Delete Image
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
