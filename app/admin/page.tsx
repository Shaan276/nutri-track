"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertOctagon,
  MessageSquarePlus,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed to fetch admin metrics");
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Nutri-Track Admin Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            System Administration &amp; Approvals
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1 font-medium">
            Monitor platform activity, triage registration approvals, configure allowlists, and manage feature requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/admin/pre-approvals"
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs rounded-xl shadow-brand-glow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Pre-Approve Email</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Pending Approvals */}
        <Link
          href="/admin/users?status=PENDING_APPROVAL"
          className="p-5 rounded-3xl bg-background-surface border border-amber-500/30 hover:border-amber-500/60 shadow-surface-card transition-all cursor-pointer group space-y-2 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pending</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground-primary">
            {isLoading ? "..." : metrics?.pendingApprovals ?? 0}
          </div>
          <p className="text-[10px] text-foreground-secondary group-hover:text-amber-400 font-medium flex items-center gap-1">
            <span>Review users</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        {/* Total Users */}
        <Link
          href="/admin/users"
          className="p-5 rounded-3xl bg-background-surface border border-border-default hover:border-brand-500/40 shadow-surface-card transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">Total Users</span>
            <Users className="h-4 w-4 text-foreground-secondary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground-primary">
            {isLoading ? "..." : metrics?.totalUsers ?? 0}
          </div>
          <p className="text-[10px] text-foreground-secondary group-hover:text-brand-400 font-medium flex items-center gap-1">
            <span>Manage users</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        {/* Approved Users */}
        <Link
          href="/admin/users?status=APPROVED"
          className="p-5 rounded-3xl bg-background-surface border border-border-default hover:border-emerald-500/40 shadow-surface-card transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground-primary">
            {isLoading ? "..." : metrics?.approvedUsers ?? 0}
          </div>
          <p className="text-[10px] text-foreground-secondary group-hover:text-emerald-400 font-medium flex items-center gap-1">
            <span>View active</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        {/* Suspended Users */}
        <Link
          href="/admin/users?status=SUSPENDED"
          className="p-5 rounded-3xl bg-background-surface border border-border-default hover:border-rose-500/40 shadow-surface-card transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Suspended</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground-primary">
            {isLoading ? "..." : metrics?.suspendedUsers ?? 0}
          </div>
          <p className="text-[10px] text-foreground-secondary group-hover:text-rose-400 font-medium flex items-center gap-1">
            <span>View suspended</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        {/* Pre-Approved Allowlist */}
        <Link
          href="/admin/pre-approvals"
          className="p-5 rounded-3xl bg-background-surface border border-border-default hover:border-blue-500/40 shadow-surface-card transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Pre-Approved</span>
            <UserCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground-primary">
            {isLoading ? "..." : metrics?.preApprovedCount ?? 0}
          </div>
          <p className="text-[10px] text-foreground-secondary group-hover:text-blue-400 font-medium flex items-center gap-1">
            <span>Allowlist</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        {/* Open Feature Requests */}
        <Link
          href="/admin/feature-requests"
          className="p-5 rounded-3xl bg-background-surface border border-border-default hover:border-purple-500/40 shadow-surface-card transition-all cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Requests</span>
            <MessageSquarePlus className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground-primary">
            {isLoading ? "..." : metrics?.openFeatureRequests ?? 0}
          </div>
          <p className="text-[10px] text-foreground-secondary group-hover:text-purple-400 font-medium flex items-center gap-1">
            <span>Triage requests</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>
      </div>

      {/* Two-Column Grid: Recent Registrations & Recent Feature Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations Card */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-400" />
              Recent Registrations
            </h3>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-foreground-muted">Loading registrations...</div>
            ) : metrics?.recentRegistrations?.length === 0 ? (
              <div className="p-6 text-center text-xs text-foreground-muted">No registrations found.</div>
            ) : (
              metrics?.recentRegistrations?.map((user: any) => (
                <div
                  key={user.id}
                  className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground-primary truncate">{user.name}</span>
                      <span className="text-[10px] font-mono text-foreground-muted">@{user.username}</span>
                      {user.role === "ADMIN" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-400 uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-foreground-secondary truncate">{user.email}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.accountStatus === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : user.accountStatus === "PENDING_APPROVAL"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {user.accountStatus.replace("_", " ")}
                    </span>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="px-2.5 py-1 rounded-lg bg-background-surface hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle text-[11px] font-bold transition-all"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Feature Requests Card */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground-primary flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-purple-400" />
              Recent Feature Requests
            </h3>
            <Link
              href="/admin/feature-requests"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-foreground-muted">Loading feature requests...</div>
            ) : metrics?.recentFeatureRequests?.length === 0 ? (
              <div className="p-6 text-center text-xs text-foreground-muted">No feature requests submitted yet.</div>
            ) : (
              metrics?.recentFeatureRequests?.map((fr: any) => (
                <div
                  key={fr.id}
                  className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-foreground-primary truncate">{fr.title}</div>
                    <div className="text-[11px] text-foreground-muted flex items-center gap-2">
                      <span>by {fr.userName}</span>
                      <span>&bull;</span>
                      <span className="uppercase text-[9px] font-bold text-brand-400">{fr.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        fr.status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : fr.status === "IN_PROGRESS"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : fr.status === "OPEN"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-background-surface text-foreground-secondary border border-border-subtle"
                      }`}
                    >
                      {fr.status.replace("_", " ")}
                    </span>
                    <Link
                      href="/admin/feature-requests"
                      className="px-2.5 py-1 rounded-lg bg-background-surface hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle text-[11px] font-bold transition-all"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}