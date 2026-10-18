"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ScrollText, RefreshCw, Shield, User, Clock, CheckCircle2 } from "lucide-react";

interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs?limit=50");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (action.includes("REPLACE")) {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
    if (action.includes("DELETE")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    if (action.includes("UPDATE") || action.includes("TOGGLE")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Audit Logs
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Immutable historical trace of administrative actions and file mutations
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <ScrollText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No audit events recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Administrative actions (logins, creates, file replacements) will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-1">Timestamp</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Entity</th>
                    <th className="pb-3">Actor</th>
                    <th className="pb-3">Details / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pl-1 text-xs text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs">
                        <span className="font-mono text-slate-300 uppercase">{log.entity}</span>
                        {log.entityId && (
                          <div className="text-[11px] text-slate-500 font-mono truncate max-w-35">
                            {log.entityId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{log.actorEmail || "System"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-xs text-slate-400 max-w-sm">
                        {log.metadata ? (
                          <pre className="font-mono text-[11px] bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80 overflow-x-auto max-h-24">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          "—"
                        )}
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
