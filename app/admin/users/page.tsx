"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Key,
  Eye,
  EyeOff,
  X,
  Lock,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, total: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Password reset modal state
  const [passwordModalUser, setPasswordModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState<boolean>(false);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      // Update local state optimistically
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                accountStatus: newStatus,
                approvedAt: newStatus === "APPROVED" ? new Date() : u.approvedAt,
              }
            : u
        )
      );
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update user status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) return;

    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
      );
    } catch (err) {
      console.error("Role update error:", err);
      alert("Failed to update user role.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"? This cannot be undone.`)) return;

    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setPagination((prev: any) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err: any) {
      console.error("Delete user error:", err);
      alert(err.message || "Failed to delete user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClearUserData = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to clear all tracking data (meals, hydration, workouts, AI chat history) for "${userName}"? The user account and credentials will remain active.`
      )
    )
      return;

    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/clear-data`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear user data");

      alert(data.message || `Successfully cleared all tracking data for "${userName}".`);
      fetchUsers(pagination.page || 1);
    } catch (err: any) {
      console.error("Clear user data error:", err);
      alert(err.message || "Failed to clear user data.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenPasswordModal = (user: any) => {
    setPasswordModalUser(user);
    setNewPassword("");
    setShowPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    if (!newPassword || newPassword.trim().length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${passwordModalUser.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setPasswordSuccess(`Password updated successfully for "${passwordModalUser.name}"!`);
      setNewPassword("");
      setTimeout(() => {
        setPasswordModalUser(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const statusTabs = [
    { key: "ALL", label: "All Users" },
    { key: "PENDING_APPROVAL", label: "Pending Approval" },
    { key: "APPROVED", label: "Approved" },
    { key: "SUSPENDED", label: "Suspended" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground-primary tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-400" />
            User Management &amp; Approvals
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1 font-medium">
            Manage user lifecycle, approve new registrations, enforce suspensions, and inspect user dossier data.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(pagination.page)}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh Table"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === tab.key
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm"
                  : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search by name, email, @user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background-surface border border-border-default rounded-xl text-xs text-foreground-primary placeholder:text-foreground-muted focus:border-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-background-elevated hover:bg-brand-500/20 text-foreground-primary hover:text-brand-400 border border-border-subtle rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table Card */}
      <div className="bg-background-surface border border-border-default rounded-3xl overflow-hidden shadow-surface-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-elevated/70 border-b border-border-subtle text-[11px] font-black text-foreground-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-foreground-muted">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-foreground-muted">
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isBusy = actionLoadingId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-background-elevated/40 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground-primary">{user.name}</span>
                            <span className="text-[10px] font-mono text-foreground-muted">@{user.username}</span>
                          </div>
                          <span className="text-[11px] text-foreground-secondary">{user.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          disabled={isBusy}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer transition-all ${
                            user.role === "ADMIN"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                              : "bg-background-elevated text-foreground-secondary border border-border-subtle hover:text-foreground-primary"
                          }`}
                          title="Click to toggle Role (ADMIN / USER)"
                        >
                          <Shield className="h-3 w-3" />
                          <span>{user.role}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            user.accountStatus === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : user.accountStatus === "PENDING_APPROVAL"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : user.accountStatus === "SUSPENDED"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                          }`}
                        >
                          {user.accountStatus.replace("_", " ")}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-foreground-secondary text-[11px] font-mono">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.accountStatus === "PENDING_APPROVAL" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(user.id, "APPROVED")}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(user.id, "REJECTED")}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {user.accountStatus === "APPROVED" && (
                            <button
                              onClick={() => handleUpdateStatus(user.id, "SUSPENDED")}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          )}

                          {user.accountStatus === "SUSPENDED" && (
                            <button
                              onClick={() => handleUpdateStatus(user.id, "APPROVED")}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Restore
                            </button>
                          )}

                          {user.accountStatus === "REJECTED" && (
                            <button
                              onClick={() => handleUpdateStatus(user.id, "APPROVED")}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Change User Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleClearUserData(user.id, user.name)}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Clear User Tracking Data (Reset Logs & Meals)"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>

                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 rounded-lg bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle transition-all cursor-pointer"
                            title="Inspect User Dossier"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          {user.email !== "piyushpilkhwal74@gmail.com" && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                              title="Permanently Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border-subtle flex items-center justify-between text-xs text-foreground-secondary">
            <span>
              Showing {users.length} of {pagination.total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded-lg bg-background-elevated text-foreground-primary border border-border-subtle disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono font-bold text-foreground-primary">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 rounded-lg bg-background-elevated text-foreground-primary border border-border-subtle disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Change Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-neutral-900 border border-blue-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left">
            <button
              onClick={() => setPasswordModalUser(null)}
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Administrative Password Reset
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Change Password for {passwordModalUser.name}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 font-mono">
                {passwordModalUser.email}
              </p>
            </div>

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">New Password (min 6 chars) *</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Enter new password for user"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-600 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-blue-400" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  disabled={isSubmittingPassword}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}