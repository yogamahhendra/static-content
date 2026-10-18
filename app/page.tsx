import Link from "next/link";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Layers,
  FileCheck2,
  Trash2,
  ExternalLink,
  Lock,
  GitBranch,
  Terminal,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-linear-to-b from-indigo-500/15 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Static CMS
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Open Source
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/yogamahhendra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>yogamahhendra</span>
            </a>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              <span>Admin Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center relative z-10">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Open-Source Initiative • Built for Resilient Asset Delivery</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight sm:leading-none">
          High-Performance{" "}
          <span className="bg-linear-to-r from-indigo-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            Static Asset Management
          </span>{" "}
          with Stable Endpoints.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          A centralized, open-source content management service built to store, optimize, and serve
          digital assets through permanent public URLs. Replace files atomically with zero downtime
          and zero broken integrations.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>Open Dashboard Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/yogamahhendra"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub Repository</span>
          </a>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Feature 1 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Immutable Public Endpoints</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Public delivery URLs (<code className="text-indigo-300">/api/content/[key]</code>) remain 100% stable. When assets are updated, external websites, mobile apps, and email templates never require code deployments.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Automated Pipeline Optimization</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Built-in Sharp processing pipeline converts raster images to modern WebP, strips sensitive EXIF metadata, minifies JSON, and sanitizes SVG vectors against malicious XSS payloads.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Atomic File Replacement</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Safe, zero-downtime updates. Incoming files are verified and committed before superseded storage objects are purged, eliminating orphaned assets and broken intermediate states.
            </p>
          </div>
        </div>

        {/* Project Definition & Architecture Section */}
        <div id="capabilities" className="mt-20 w-full glass-panel rounded-2xl p-8 sm:p-10 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                <Layers className="w-4 h-4" />
                <span>Open-Source Architecture & Vision</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                About the Project & Core Capabilities
              </h2>
            </div>
            <a
              href="https://github.com/yogamahhendra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all self-start sm:self-auto"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Developer: yogamahhendra</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
            <strong className="text-white font-semibold">Static CMS</strong> is an open-source, developer-first Content
            Management System designed specifically for centralizing static media assets (marketing banners, logos, PDF documents, SVG graphics, and JSON configurations). In modern distributed systems, updating assets often causes broken URLs, orphaned files in cloud buckets, and stale client caches. Static CMS eliminates these issues by providing immutable URL contracts backed by atomic file replacements and automated optimization.
          </p>

          {/* Key Advantages Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Unified Permanent Contracts</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Every asset is indexed by a permanent alphanumeric key. Replaced files retain their exact public URL, ensuring seamless continuity across all consumer applications.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <Trash2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Automated Cloud Storage Hygiene</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Replaces files with atomic safety. Upon database commit, legacy objects are automatically deleted from cloud storage, preventing storage bloat and unnecessary storage costs.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Automated Server-Side Compression</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Images are automatically converted to next-generation WebP with quality tuning, SVG scripts are sanitized against Cross-Site Scripting, and JSON payloads are minified.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Granular RBAC & Full Audit Trail</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Enterprise-grade Role-Based Access Control (Superadmin, Admin, Editor, Viewer) secured by HttpOnly JWT sessions and accompanied by immutable administrative audit logs.
              </p>
            </div>
          </div>

          {/* Open Source Callout Banner */}
          <div className="mt-8 p-6 rounded-xl bg-linear-to-r from-indigo-950/40 via-slate-900/60 to-cyan-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Open-Source Initiative & Community Collaboration</span>
              </div>
              <p className="text-xs text-slate-400">
                This project will be released as an open-source tool for developers and engineering teams. Follow the repository on GitHub for upcoming releases, self-hosting documentation, and contribution guidelines.
              </p>
            </div>
            <a
              href="https://github.com/yogamahhendra"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Follow on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>Static Content Management System • Open Source</span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <a
          href="https://github.com/yogamahhendra"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Developed by yogamahhendra on GitHub</span>
        </a>
      </footer>
    </div>
  );
}
