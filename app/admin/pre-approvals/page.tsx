"use client";

import React, { useEffect, useState } from "react";
import {
  UserCheck,
  Plus,
  Trash2,
  RefreshCw,
  Mail,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function AdminPreApprovalsPage() {
  const [preApprovals, setPreApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [newNotes, setNewNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPreApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/pre-approvals");
      if (!res.ok) throw new Error("Failed to fetch pre-approvals");
      const data = await res.json();
      setPreApprovals(data.preApprovals || []);
    } catch (err: any) {
      setError(err.message || "Failed to load allowlist");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreApprovals();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("Preset password must be at least 6 characters long.");
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/pre-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword.trim() || undefined,
          notes: newNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to pre-approve user");

      if (newPassword.trim()) {
        setSuccess(`Successfully pre-approved & created active credentials for: ${newEmail.trim().toLowerCase()}`);
      } else {
        setSuccess(`Successfully pre-approved email: ${newEmail.trim().toLowerCase()}`);
      }
      setNewEmail("");
      setNewPassword("");
      setNewNotes("");
      setIsAdding(false);
      await fetchPreApprovals();
    } catch (err: any) {
      setError(err.message || "Failed to create pre-approval");
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete pre-approval for ${email}?`)) return;

    try {
      const res = await fetch(`/api/admin/pre-approvals/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      setPreApprovals((prev) => prev.filter((p) => p.id !== id));
      setSuccess(`Removed allowlist entry for ${email}`);
    } catch (err: any) {
      setError(err.message || "Failed to remove pre-approval");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground-primary tracking-tight flex items-center gap-2.5">
            <UserCheck className="h-6 w-6 text-blue-400" />
            Pre-Approved User Allowlist
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1 font-medium">
            Emails added to this allowlist will be automatically approved upon registration without requiring manual review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPreApprovals}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Allowlist"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isAdding ? "Cancel" : "Add Pre-Approved Email"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add Email Form Card */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-6 rounded-3xl bg-background-surface border border-brand-500/40 shadow-surface-card space-y-4 animate-fade-in"
        >
          <h3 className="text-sm font-bold text-foreground-primary">Pre-Approve New Email Address</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground-secondary">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
                <input
                  type="email"
                  required
                  placeholder="athlete@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary placeholder:text-foreground-muted focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground-secondary">Preset Password</label>
                <span className="text-[10px] text-brand-400 font-mono">Optional</span>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Preset password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary placeholder:text-foreground-muted focus:border-brand-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-brand-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground-secondary">Administrative Notes</label>
              <input
                type="text"
                placeholder="e.g. VIP client, Coach referral"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary placeholder:text-foreground-muted focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-[11px] text-foreground-secondary flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>
              <strong>Pro-tip:</strong> If you set a password, an approved user account is created immediately with these credentials so the member can sign in right away. If left blank, the user will be auto-approved when they register themselves.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-background-elevated text-foreground-secondary text-xs font-bold hover:text-foreground-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs shadow-sm cursor-pointer"
            >
              Confirm Pre-Approval
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-background-surface border border-border-default rounded-3xl overflow-hidden shadow-surface-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-elevated/70 border-b border-border-subtle text-[11px] font-black text-foreground-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Email Identifier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4">Date Added</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-foreground-muted">
                    Loading allowlist...
                  </td>
                </tr>
              ) : preApprovals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-foreground-muted">
                    No pre-approved emails yet. Click &quot;Add Pre-Approved Email&quot; to create one.
                  </td>
                </tr>
              ) : (
                preApprovals.map((entry) => {
                  const isConsumed = Boolean(entry.consumedAt);
                  return (
                    <tr key={entry.id} className="hover:bg-background-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-foreground-primary">
                        {entry.identifier}
                      </td>

                      <td className="py-3.5 px-4">
                        {isConsumed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Consumed ({new Date(entry.consumedAt).toLocaleDateString()})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <Clock className="h-3 w-3" />
                            <span>Available</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-foreground-secondary text-xs">
                        {entry.notes || <span className="text-foreground-muted italic">None</span>}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-foreground-muted">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(entry.id, entry.identifier)}
                          className="p-1.5 rounded-lg bg-background-elevated hover:bg-rose-500/20 text-foreground-muted hover:text-rose-400 border border-border-subtle transition-all cursor-pointer"
                          title="Delete pre-approval"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}