"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  Lock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
  History,
  LayoutDashboard,
  UtensilsCrossed,
  Droplets,
  Activity,
  Apple,
  Dumbbell,
  LineChart,
  Bot,
  Users,
  Settings,
  Target,
  FlaskConical,
} from "lucide-react";
import { FeatureItem, FeatureAuditLogItem, FeatureAccessStatus } from "@/lib/services/admin/feature-access.service";

const ICON_MAP: Record<string, any> = {
  dashboard: LayoutDashboard,
  yesterday: History,
  goals: Target,
  nutrition: UtensilsCrossed,
  deep_nutrition: Sparkles,
  hydration: Droplets,
  activities: Activity,
  foods: Apple,
  workouts: Dumbbell,
  insights: Sparkles,
  reports: LineChart,
  ai_coach: Bot,
  community: Users,
  settings: Settings,
};

export function AdminFeatureControlClient() {
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<FeatureAuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status Modal State
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);
  const [newStatus, setNewStatus] = useState<FeatureAccessStatus>("LIVE");
  const [changeReason, setChangeReason] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/features");
      const data = await res.json();
      if (data.success) {
        setFeatures(data.features || []);
        setAuditLogs(data.auditLogs || []);
      } else {
        setErrorMessage(data.error || "Failed to load feature control data");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (key: string, status: FeatureAccessStatus, reason?: string) => {
    setIsUpdating(key);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, status, reason: reason || `Updated to ${status}` }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setSelectedFeature(null);
        setChangeReason("");
        await loadData();
      } else {
        setErrorMessage(data.error || "Failed to update feature status");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Update request failed");
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: FeatureAccessStatus) => {
    switch (status) {
      case "LIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        );
      case "COMING_SOON":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-extrabold">
            <Clock className="h-3 w-3 text-amber-400" />
            COMING SOON
          </span>
        );
      case "DISABLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-extrabold">
            <Ban className="h-3 w-3 text-rose-400" />
            DISABLED
          </span>
        );
      case "ADMIN_ONLY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[11px] font-extrabold">
            <Lock className="h-3 w-3 text-purple-400" />
            ADMIN ONLY
          </span>
        );
      case "BETA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-extrabold">
            <FlaskConical className="h-3 w-3 text-blue-400" />
            BETA
          </span>
        );
      default:
        return null;
    }
  };

  const liveCount = features.filter((f) => f.status === "LIVE").length;
  const soonCount = features.filter((f) => f.status === "COMING_SOON").length;
  const adminOnlyCount = features.filter((f) => f.status === "ADMIN_ONLY" || f.status === "DISABLED").length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
              Page &amp; Feature Access Control Center
            </h1>
          </div>
          <p className="text-xs text-foreground-secondary">
            Manage live accessibility, coming soon placeholders, and admin restrictions dynamically without code changes.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-background-surface hover:bg-background-elevated border border-border-default text-xs font-bold text-foreground-secondary hover:text-foreground-primary transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-background-surface border border-border-default rounded-2xl p-4 shadow-surface-card space-y-1">
          <span className="text-[11px] text-foreground-muted uppercase font-bold tracking-wider">Total Pages</span>
          <p className="text-2xl font-black text-foreground-primary">{features.length}</p>
        </div>
        <div className="bg-background-surface border border-emerald-500/30 rounded-2xl p-4 shadow-surface-card space-y-1">
          <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">🟢 Live Pages</span>
          <p className="text-2xl font-black text-emerald-400">{liveCount}</p>
        </div>
        <div className="bg-background-surface border border-amber-500/30 rounded-2xl p-4 shadow-surface-card space-y-1">
          <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider">🟡 Coming Soon</span>
          <p className="text-2xl font-black text-amber-400">{soonCount}</p>
        </div>
        <div className="bg-background-surface border border-purple-500/30 rounded-2xl p-4 shadow-surface-card space-y-1">
          <span className="text-[11px] text-purple-400 uppercase font-bold tracking-wider">👑 Restricted / Admin</span>
          <p className="text-2xl font-black text-purple-400">{adminOnlyCount}</p>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Feature Management Table */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2 className="text-sm font-extrabold text-foreground-primary uppercase tracking-wider">
            Registered Application Pages &amp; Features
          </h2>
          <span className="text-xs text-foreground-muted">Changes apply immediately</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-foreground-muted font-bold">
                <th className="pb-3 pr-4">Page / Feature</th>
                <th className="pb-3 px-3">Route Path</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Current Status</th>
                <th className="pb-3 px-3 text-center">Normal Users</th>
                <th className="pb-3 px-3 text-center">Admin Access</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {features.map((feat) => {
                const IconComponent = ICON_MAP[feat.key] || SlidersHorizontal;
                const isNormalAllowed = feat.status === "LIVE";
                return (
                  <tr key={feat.key} className="hover:bg-background-elevated/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-xl bg-background-elevated border border-border-subtle flex items-center justify-center text-foreground-secondary shrink-0">
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-foreground-primary block">{feat.name}</span>
                          <span className="text-[10px] text-foreground-muted">{feat.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-brand-400">
                      {feat.route}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-background-elevated text-foreground-muted text-[10px] font-mono uppercase">
                        {feat.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {getStatusBadge(feat.status)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold">
                      {isNormalAllowed ? (
                        <span className="text-emerald-400">✓ Accessible</span>
                      ) : feat.status === "COMING_SOON" ? (
                        <span className="text-amber-400">🟡 Coming Soon</span>
                      ) : (
                        <span className="text-rose-400">✕ Blocked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-400">
                      ✓ Full Access
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={feat.route}
                          target="_blank"
                          className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-muted hover:text-foreground-primary transition-colors"
                          title="Test / Visit route"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedFeature(feat);
                            setNewStatus(feat.status);
                            setChangeReason("");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-brand-500/20 border border-border-subtle hover:border-brand-500/40 text-foreground-secondary hover:text-brand-400 font-bold transition-all"
                        >
                          Configure
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit History Log */}
      {auditLogs.length > 0 && (
        <div className="bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <History className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-extrabold text-foreground-primary uppercase tracking-wider">
              Access Control Audit Trail
            </h3>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auditLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-foreground-primary">{log.featureName}</span>
                    <span className="text-foreground-muted">&bull;</span>
                    <span className="text-foreground-muted font-mono">{log.previousStatus}</span>
                    <span className="text-brand-400">&rarr;</span>
                    <span className="font-extrabold text-brand-400 font-mono">{log.newStatus}</span>
                  </div>
                  {log.reason && (
                    <p className="text-[11px] text-foreground-secondary italic">
                      &quot;{log.reason}&quot;
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-foreground-muted font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()} &bull; {log.adminEmail || log.adminId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Configuration Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 text-left">
            <div className="space-y-1 border-b border-border-subtle pb-3">
              <h3 className="text-base font-extrabold text-foreground-primary">
                Configure Page Access: {selectedFeature.name}
              </h3>
              <p className="text-xs text-foreground-muted font-mono">
                Route: {selectedFeature.route}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground-secondary block">
                Select Availability Status:
              </label>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "LIVE", label: "🟢 LIVE", desc: "Accessible to all authorized users" },
                  { id: "COMING_SOON", label: "🟡 COMING SOON", desc: "Shows Coming Soon screen to users; Admin has full access" },
                  { id: "ADMIN_ONLY", label: "👑 ADMIN ONLY", desc: "Strictly restricted to administrators" },
                  { id: "DISABLED", label: "🔴 DISABLED", desc: "Inaccessible to normal users" },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    onClick={() => setNewStatus(opt.id as FeatureAccessStatus)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                      newStatus === opt.id
                        ? "bg-brand-500/10 border-brand-500/50 text-foreground-primary"
                        : "bg-background-elevated border-border-subtle text-foreground-secondary hover:border-border-default"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold block">{opt.label}</span>
                      <span className="text-[11px] text-foreground-muted">{opt.desc}</span>
                    </div>
                    <input
                      type="radio"
                      name="featureStatus"
                      checked={newStatus === opt.id}
                      onChange={() => setNewStatus(opt.id as FeatureAccessStatus)}
                      className="mt-1 accent-emerald-400"
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-foreground-secondary block">
                  Change Note / Reason (Optional):
                </label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Under active UI development"
                  className="w-full bg-background-elevated border border-border-subtle focus:border-brand-500/50 rounded-xl px-3.5 py-2 text-xs text-foreground-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-foreground-muted hover:text-foreground-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedFeature.key, newStatus, changeReason)}
                disabled={isUpdating === selectedFeature.key}
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-brand-glow"
              >
                {isUpdating === selectedFeature.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeatureControlClient;
