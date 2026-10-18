"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  FileBox,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ExternalLink,
  Zap,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ContentItem {
  id: string;
  key: string;
  title: string;
  description: string | null;
  storageKey: string;
  contentType: string;
  fileExtension: string;
  fileSize: number;
  originalFileSize: number | null;
  checksum: string | null;
  optimizationStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ContentsManagementPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadKey, setUploadKey] = useState("");
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [convertToWebp, setConvertToWebp] = useState(true);
  const [skipOptimization, setSkipOptimization] = useState(false);

  // Replace Form State
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceConvertToWebp, setReplaceConvertToWebp] = useState(true);
  const [replaceSkipOpt, setReplaceSkipOpt] = useState(false);

  // Edit Metadata Form State
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // UI Feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [optimizationSummary, setOptimizationSummary] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/contents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchContents();
  }, [search, selectedCategory, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyPublicUrl = (key: string) => {
    const url = `${window.location.origin}/api/content/${key}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    showToast("Public URL copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setUploadTitle("");
    setUploadKey("");
    setUploadCategoryId(categories[0]?.id || "");
    setUploadDescription("");
    setUploadFile(null);
    setFormError(null);
    setOptimizationSummary(null);
    setUploadModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setUploadTitle(val);
    const generatedKey = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setUploadKey(generatedKey);
  };

  // Submit Create Content
  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setFormError("Please select a file to upload.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("key", uploadKey);
      formData.append("categoryId", uploadCategoryId);
      if (uploadDescription) formData.append("description", uploadDescription);
      formData.append("file", uploadFile);
      formData.append("skipOptimization", String(skipOptimization));
      formData.append("convertToWebp", String(convertToWebp));

      const res = await fetch("/api/admin/contents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload content");
      }

      setOptimizationSummary(data.optimization);
      showToast("Content asset created and optimized successfully!");
      fetchContents();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Replace Modal
  const handleOpenReplace = (item: ContentItem) => {
    setActiveItem(item);
    setReplaceFile(null);
    setFormError(null);
    setOptimizationSummary(null);
    setReplaceModalOpen(true);
  };

  // Submit Replace Content
  const handleReplaceContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !replaceFile) {
      setFormError("Please select a replacement file.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", replaceFile);
      formData.append("skipOptimization", String(replaceSkipOpt));
      formData.append("convertToWebp", String(replaceConvertToWebp));

      const res = await fetch(`/api/admin/contents/${activeItem.id}/replace`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to replace file");
      }

      setOptimizationSummary(data.optimization);
      showToast(`File replaced! Public URL "/api/content/${activeItem.key}" remains unchanged.`);
      fetchContents();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Metadata Modal
  const handleOpenEdit = (item: ContentItem) => {
    setActiveItem(item);
    setEditTitle(item.title);
    setEditCategoryId(item.category.id);
    setEditDescription(item.description || "");
    setFormError(null);
    setEditModalOpen(true);
  };

  // Submit Edit Metadata
  const handleEditMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/contents/${activeItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          categoryId: editCategoryId,
          description: editDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update metadata");
      }

      setEditModalOpen(false);
      showToast("Metadata updated successfully");
      fetchContents();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Content Active Status
  const handleToggleStatus = async (item: ContentItem) => {
    try {
      const res = await fetch(`/api/admin/contents/${item.id}/toggle-status`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle status");
      }
      showToast(data.message);
      fetchContents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Content
  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to delete content "${item.title}" (${item.key})? This will permanently delete its file from object storage.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/contents/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete content");
      }
      showToast("Content deleted successfully");
      fetchContents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getFileIcon = (contentType: string, ext: string) => {
    if (contentType.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-cyan-400" />;
    }
    if (contentType === "application/pdf" || ext === "pdf") {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (contentType === "application/json" || ext === "json") {
      return <FileCode className="w-5 h-5 text-amber-400" />;
    }
    return <FileBox className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium text-sm shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Content Assets Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Upload, optimize, replace files with immutable public URLs
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Upload New Asset
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Contents Table */}
        <div className="glass-panel rounded-2xl p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading static assets...</div>
          ) : contents.length === 0 ? (
            <div className="py-12 text-center">
              <FileBox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No static content assets found</p>
              <p className="text-xs text-slate-500 mt-1">
                {search || selectedCategory || statusFilter
                  ? "No matching assets for the selected filters."
                  : "Upload your first asset to generate a permanent public URL."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-1">Type</th>
                    <th className="pb-3">Title & Content Key</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Size / Optimization</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-1">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {contents.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pl-1">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 w-fit">
                          {getFileIcon(item.contentType, item.fileExtension)}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-xs font-mono text-indigo-400 flex items-center gap-1.5 mt-0.5">
                          <span>{item.key}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 uppercase">{item.fileExtension}</span>
                        </div>
                      </td>
                      <td className="py-4 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                          {item.category.name}
                        </span>
                      </td>
                      <td className="py-4 text-xs">
                        <div className="font-medium text-white">{formatFileSize(item.fileSize)}</div>
                        {item.optimizationStatus === "optimized" && item.originalFileSize && (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Zap className="w-3 h-3" />
                            <span>
                              {Math.round(
                                ((item.originalFileSize - item.fileSize) / item.originalFileSize) * 100
                              )}
                              % reduced
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            item.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-slate-700/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"
                          }`}
                          title="Click to toggle status"
                        >
                          {item.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 text-right pr-1 space-x-1.5">
                        <button
                          onClick={() => copyPublicUrl(item.key)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          title="Copy Stable Public URL"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`/api/content/${item.key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          title="Open Public Endpoint"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleOpenReplace(item)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                          title="Replace File (Preserves URL)"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Content"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Upload New Content */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-bold text-lg text-white">Upload New Static Asset</h3>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Optimization result telemetry */}
              {optimizationSummary && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Asset Uploaded & Optimized!
                  </div>
                  <div>Original Size: {formatFileSize(optimizationSummary.originalSize)}</div>
                  <div>Final Stored Size: {formatFileSize(optimizationSummary.finalSize)}</div>
                  <div>
                    Space Saved: {formatFileSize(optimizationSummary.spaceSaved)} (
                    {optimizationSummary.percentReduction}%)
                  </div>
                  <div>Status: {optimizationSummary.status}</div>
                </div>
              )}

              <form onSubmit={handleCreateContent} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Homepage Hero Banner"
                    value={uploadTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Content Key * (Immutable unique public identifier)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. homepage-hero-banner"
                    value={uploadKey}
                    onChange={(e) => setUploadKey(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-indigo-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Public endpoint: <code className="text-slate-300">/api/content/{uploadKey || "{key}"}</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={uploadCategoryId}
                    onChange={(e) => setUploadCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of this static file..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Dropzone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    File * (JPEG, PNG, WebP, SVG, PDF, JSON up to 10MB)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-5 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadFile(file);
                      }}
                    />
                    <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    {uploadFile ? (
                      <div className="text-xs text-white">
                        <span className="font-semibold">{uploadFile.name}</span>
                        <div className="text-slate-400 mt-0.5">
                          {formatFileSize(uploadFile.size)} • {uploadFile.type || "unknown type"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        <span className="text-indigo-400 font-semibold">Click to select file</span> or drag and drop
                      </div>
                    )}
                  </div>
                </div>

                {/* Optimization Options */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-300 mb-1">Optimization Settings:</div>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={convertToWebp}
                      onChange={(e) => setConvertToWebp(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Convert raster images (JPEG/PNG) to modern WebP</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipOptimization}
                      onChange={(e) => setSkipOptimization(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Skip optimization (preserve byte-for-byte exact file)</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing & Uploading..." : "Upload Asset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Replace File (Preserves Public URL) */}
        {replaceModalOpen && activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-lg text-white">Replace File</h3>
                  <p className="text-xs text-indigo-400 font-mono mt-0.5">Key: {activeItem.key}</p>
                </div>
                <button
                  onClick={() => setReplaceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Optimization telemetry */}
              {optimizationSummary && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    File Replaced Successfully!
                  </div>
                  <div>Original New File: {formatFileSize(optimizationSummary.originalSize)}</div>
                  <div>Final Stored Size: {formatFileSize(optimizationSummary.finalSize)}</div>
                  <div>
                    Space Saved: {formatFileSize(optimizationSummary.spaceSaved)} (
                    {optimizationSummary.percentReduction}%)
                  </div>
                  <div className="text-cyan-300 font-semibold mt-1">
                    Public URL remains unchanged: /api/content/{activeItem.key}
                  </div>
                </div>
              )}

              <form onSubmit={handleReplaceContent} className="mt-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200">Current File Telemetry:</div>
                  <div className="mt-1">Size: {formatFileSize(activeItem.fileSize)}</div>
                  <div>Format: {activeItem.fileExtension.toUpperCase()} ({activeItem.contentType})</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Replacement File *
                  </label>
                  <div
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-5 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all"
                  >
                    <input
                      type="file"
                      ref={replaceFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReplaceFile(file);
                      }}
                    />
                    <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    {replaceFile ? (
                      <div className="text-xs text-white">
                        <span className="font-semibold">{replaceFile.name}</span>
                        <div className="text-slate-400 mt-0.5">
                          {formatFileSize(replaceFile.size)} • {replaceFile.type || "unknown"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        <span className="text-cyan-400 font-semibold">Click to choose new file</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceConvertToWebp}
                      onChange={(e) => setReplaceConvertToWebp(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                    />
                    <span>Convert to WebP format</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceSkipOpt}
                      onChange={(e) => setReplaceSkipOpt(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                    />
                    <span>Skip optimization</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReplaceModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing Replacement..." : "Confirm Replacement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Metadata */}
        {editModalOpen && activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-bold text-lg text-white">Edit Content Metadata</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleEditMetadata} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Content Key (Immutable)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeItem.key}
                    className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Update Metadata"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
