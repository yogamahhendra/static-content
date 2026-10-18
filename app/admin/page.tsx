"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import {
  FolderTree,
  FileBox,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  HardDrive,
  Copy,
  Check,
} from "lucide-react";

interface OverviewData {
  metrics: {
    totalCategories: number;
    totalContents: number;
    activeContents: number;
    inactiveContents: number;
  };
  recentContents: Array<{
    id: string;
    key: string;
    title: string;
    fileExtension: string;
    contentType: string;
    fileSize: number;
    isActive: boolean;
    updatedAt: string;
    categoryName: string;
  }>;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const copyPublicUrl = (key: string) => {
    const url = `${window.location.origin}/api/content/${key}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time asset telemetry and storage state
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admin/contents"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-500/25 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Upload Asset
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Contents */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Assets
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <FileBox className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">
                {loading ? "..." : data?.metrics.totalContents ?? 0}
              </span>
              <span className="text-xs text-slate-400 ml-2">managed records</span>
            </div>
          </div>

          {/* Card 2: Total Categories */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Categories
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FolderTree className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">
                {loading ? "..." : data?.metrics.totalCategories ?? 0}
              </span>
              <span className="text-xs text-slate-400 ml-2">organized groups</span>
            </div>
          </div>

          {/* Card 3: Active Contents */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Public
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-emerald-400">
                {loading ? "..." : data?.metrics.activeContents ?? 0}
              </span>
              <span className="text-xs text-slate-400 ml-2">accessible endpoints</span>
            </div>
          </div>

          {/* Card 4: Inactive Contents */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Inactive / Draft
              </span>
              <div className="p-2 rounded-xl bg-slate-500/10 text-slate-400">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-400">
                {loading ? "..." : data?.metrics.inactiveContents ?? 0}
              </span>
              <span className="text-xs text-slate-400 ml-2">hidden from public</span>
            </div>
          </div>
        </div>

        {/* Recent Content Updates Table */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Recently Updated Static Assets
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest modified files and their stable endpoint addresses
              </p>
            </div>
            <Link
              href="/admin/contents"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading recent updates...
            </div>
          ) : !data?.recentContents || data.recentContents.length === 0 ? (
            <div className="py-12 text-center">
              <HardDrive className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No static assets found</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload your first asset to generate a permanent public URL
              </p>
              <Link
                href="/admin/contents"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Upload New Asset
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-1">Title & Key</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">MIME / Ext</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.recentContents.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pl-1">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-xs font-mono text-indigo-400 mt-0.5">
                          {item.key}
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300 text-xs">
                        <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                          {item.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 text-xs font-mono">
                        {item.fileExtension.toUpperCase()}
                      </td>
                      <td className="py-3.5 text-slate-300 text-xs">
                        {formatFileSize(item.fileSize)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-700/30 text-slate-400 border border-slate-700/50"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-1">
                        <button
                          onClick={() => copyPublicUrl(item.key)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                          title="Copy Public URL"
                        >
                          {copiedKey === item.key ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
