"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquarePlus,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Send,
  X,
} from "lucide-react";

export default function AdminFeatureRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<string>("OPEN");
  const [editResponse, setEditResponse] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/feature-requests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch feature requests");
      const data = await res.json();
      setRequests(data.featureRequests || []);
    } catch (err) {
      console.error("Feature requests error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const openTriage = (req: any) => {
    setActiveRequest(req);
    setEditStatus(req.status);
    setEditResponse(req.adminResponse || "");
  };

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/feature-requests/${activeRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          adminResponse: editResponse.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update feature request");
      const data = await res.json();

      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeRequest.id ? { ...r, ...data.featureRequest } : r
        )
      );
      setActiveRequest(null);
    } catch (err) {
      console.error("Save triage error:", err);
      alert("Failed to update request.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { key: "ALL", label: "All Requests" },
    { key: "OPEN", label: "Open" },
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "PLANNED", label: "Planned" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
    { key: "DECLINED", label: "Declined" },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground-primary tracking-tight flex items-center gap-2.5">
            <MessageSquarePlus className="h-6 w-6 text-purple-400" />
            Feature Requests &amp; Feedback Triage
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1 font-medium">
            Review user-submitted enhancement proposals, update development status, and post responses.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-background-elevated hover:bg-brand-500/20 text-foreground-secondary hover:text-brand-400 border border-border-subtle transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh List"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusOptions.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedStatus === tab.key
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm"
                : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-foreground-muted">
            Loading feature requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-foreground-muted">
            No feature requests found in this category.
          </div>
        ) : (
          requests.map((fr) => (
            <div
              key={fr.id}
              className="p-5 rounded-3xl bg-background-surface border border-border-default hover:border-brand-500/40 shadow-surface-card transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-400 border border-brand-500/30">
                    {fr.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      fr.status === "COMPLETED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : fr.status === "IN_PROGRESS"
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : fr.status === "PLANNED"
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : fr.status === "OPEN"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-background-elevated text-foreground-secondary border border-border-subtle"
                    }`}
                  >
                    {fr.status.replace("_", " ")}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-foreground-primary">{fr.title}</h3>
                <p className="text-xs text-foreground-secondary line-clamp-3 leading-relaxed">
                  {fr.description}
                </p>
              </div>

              {fr.adminResponse && (
                <div className="p-3 rounded-2xl bg-background-elevated border border-border-subtle text-xs">
                  <span className="font-bold text-brand-400 block mb-1">Official Response:</span>
                  <p className="text-foreground-secondary">{fr.adminResponse}</p>
                </div>
              )}

              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                <div className="text-[11px] text-foreground-muted">
                  <span>{fr.userName}</span> &bull; <span>{new Date(fr.createdAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => openTriage(fr)}
                  className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-brand-500/20 text-foreground-primary hover:text-brand-400 border border-border-subtle font-bold text-xs transition-all cursor-pointer"
                >
                  Triage &amp; Respond
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Triage & Response Modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground-primary">Triage Feature Request</h3>
              <button
                onClick={() => setActiveRequest(null)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground-primary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle space-y-1.5 text-xs">
              <span className="font-bold text-foreground-primary text-sm">{activeRequest.title}</span>
              <p className="text-foreground-secondary leading-relaxed">{activeRequest.description}</p>
              <div className="text-[11px] text-foreground-muted pt-1">
                Submitted by {activeRequest.userName} ({activeRequest.userEmail})
              </div>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Update Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary font-bold focus:border-brand-500 outline-none"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="PLANNED">PLANNED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DECLINED">DECLINED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">
                  Admin Response &amp; Developer Notes (Visible to requesting user)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Added to v2.1 roadmap, planned for release next week!"
                  value={editResponse}
                  onChange={(e) => setEditResponse(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary placeholder:text-foreground-muted focus:border-brand-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  className="px-4 py-2 rounded-xl bg-background-elevated text-foreground-secondary text-xs font-bold hover:text-foreground-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Triage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}