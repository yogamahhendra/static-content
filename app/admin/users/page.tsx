"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  Shield,
  PenTool,
  Eye,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Mail,
  Crown,
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  role: "superadmin" | "admin" | "editor" | "viewer";
  createdAt: string;
  contentsCreated: number;
}

export default function UsersManagementPage() {
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserItem | null>(null);

  // Create Form State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"superadmin" | "admin" | "editor" | "viewer">("admin");

  // Edit Form State
  const [editRole, setEditRole] = useState<"superadmin" | "admin" | "editor" | "viewer">("admin");
  const [resetPassword, setResetPassword] = useState("");

  // Feedback State
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data?.user?.id || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      } else if (res.status === 403) {
        setFormError("Access denied: Superadmin role required to manage users.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, [search, roleFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setNewEmail("");
    setNewPassword("");
    setNewRole("admin");
    setFormError(null);
    setCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setCreateModalOpen(false);
      showToast(`User "${newEmail}" created with role "${newRole}"!`);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user: UserItem) => {
    setActiveUser(user);
    setEditRole(user.role);
    setResetPassword("");
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: any = { role: editRole };
      if (resetPassword) {
        payload.password = resetPassword;
      }

      const res = await fetch(`/api/admin/users/${activeUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setEditModalOpen(false);
      showToast(`User "${activeUser.email}" updated successfully!`);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (user.id === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.email}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      showToast(`User "${user.email}" deleted successfully!`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Crown className="w-3.5 h-3.5" />
            Superadmin
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Shield className="w-3.5 h-3.5" />
            Admin
          </span>
        );
      case "editor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <PenTool className="w-3.5 h-3.5" />
            Editor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/30 text-slate-400 border border-slate-700/50">
            <Eye className="w-3.5 h-3.5" />
            Viewer
          </span>
        );
    }
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
              User Management & RBAC
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Control access levels and assign roles (Superadmin, Admin, Editor, Viewer)
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        </div>

        {/* RBAC Role Legend Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="glass-card rounded-xl p-3 border border-purple-500/20">
            <div className="font-bold text-purple-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Superadmin
            </div>
            <p className="text-slate-400 mt-1">Full control including user management and audit logs</p>
          </div>
          <div className="glass-card rounded-xl p-3 border border-cyan-500/20">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Admin
            </div>
            <p className="text-slate-400 mt-1">Full CRUD for assets and categories (no user management)</p>
          </div>
          <div className="glass-card rounded-xl p-3 border border-emerald-500/20">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5" /> Editor
            </div>
            <p className="text-slate-400 mt-1">Can create, update, and replace files (cannot delete)</p>
          </div>
          <div className="glass-card rounded-xl p-3 border border-slate-700/40">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Viewer
            </div>
            <p className="text-slate-400 mt-1">Read-only browsing and public URL copying</p>
          </div>
        </div>

        {/* Search & Role Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="superadmin">Superadmin Only</option>
            <option value="admin">Admin Only</option>
            <option value="editor">Editor Only</option>
            <option value="viewer">Viewer Only</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="glass-panel rounded-2xl p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading user accounts...</div>
          ) : usersList.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No users found</p>
              <p className="text-xs text-slate-500 mt-1">
                {search || roleFilter ? "No matches for selected filters." : "Create a user account to grant console access."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-1">Email / Account</th>
                    <th className="pb-3">Access Role</th>
                    <th className="pb-3">Assets Created</th>
                    <th className="pb-3">Joined Date</th>
                    <th className="pb-3 text-right pr-1">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pl-1">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{user.email}</span>
                          {user.id === currentUserId && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-md font-mono">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5">{getRoleBadge(user.role)}</td>
                      <td className="py-3.5 text-slate-300 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                          {user.contentsCreated} {user.contentsCreated === 1 ? "asset" : "assets"}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right pr-1 space-x-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all"
                          title="Edit Role / Reset Password"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.id === currentUserId}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title={user.id === currentUserId ? "Cannot delete own account" : "Delete User"}
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

        {/* Modal: Create User */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-bold text-lg text-white">Create New User</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
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

              <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Password * (Minimum 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    RBAC Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="superadmin">Superadmin (Full System Access)</option>
                    <option value="admin">Admin (Content & Category Manager)</option>
                    <option value="editor">Editor (Create, Edit & Replace Content)</option>
                    <option value="viewer">Viewer (Read-Only Access)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Role / Reset Password */}
        {editModalOpen && activeUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-lg text-white">Edit User Account</h3>
                  <p className="text-xs text-indigo-400 mt-0.5">{activeUser.email}</p>
                </div>
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

              <form onSubmit={handleEditUser} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    disabled={activeUser.id === currentUserId && activeUser.role === "superadmin"}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  {activeUser.id === currentUserId && activeUser.role === "superadmin" && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      You cannot demote your own superadmin account.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reset Password (Optional)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Leave blank to keep existing password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
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
                    {isSubmitting ? "Saving..." : "Save Changes"}
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
