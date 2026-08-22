"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  X,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  ListFilter,
} from "lucide-react";

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureRequestModal({ isOpen, onClose }: FeatureRequestModalProps) {
  const [activeTab, setActiveTab] = useState<"NEW" | "MY_REQUESTS">("NEW");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const fetchMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch("/api/feature-requests");
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      setMyRequests(data.requests || []);
    } catch {
      // safe ignore
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "MY_REQUESTS") {
      fetchMyRequests();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for your feature request.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe the feature you'd like to see.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feature request");

      setSuccess("Thank you! Your feature request has been sent to our development team.");
      setTitle("");
      setDescription("");
      setTimeout(() => {
        setActiveTab("MY_REQUESTS");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card space-y-5 animate-fade-in text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground-primary">Feature Requests</h2>
              <p className="text-xs text-foreground-secondary">Propose new features &amp; follow progress</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground-primary hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 border-b border-border-subtle pb-2">
          <button
            onClick={() => setActiveTab("NEW")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "NEW"
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/40"
                : "text-foreground-secondary hover:text-foreground-primary"
            }`}
          >
            Submit Request
          </button>
          <button
            onClick={() => setActiveTab("MY_REQUESTS")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MY_REQUESTS"
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/40"
                : "text-foreground-secondary hover:text-foreground-primary"
            }`}
          >
            My Requests {myRequests.length > 0 && `(${myRequests.length})`}
          </button>
        </div>

        {activeTab === "NEW" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground-secondary">Feature Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Barcode scanner for nutrition logs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary placeholder:text-foreground-muted focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary focus:border-brand-500 outline-none"
                >
                  <option value="GENERAL">General</option>
                  <option value="NUTRITION">Nutrition</option>
                  <option value="WORKOUTS">Workouts &amp; Gym</option>
                  <option value="ACTIVITIES">Running &amp; Cardio</option>
                  <option value="AI_COACH">AI Coach</option>
                  <option value="INTEGRATIONS">Integrations &amp; Sync</option>
                  <option value="COMMUNITY">Community</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground-secondary">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary focus:border-brand-500 outline-none"
                >
                  <option value="LOW">Low &bull; Nice to have</option>
                  <option value="MEDIUM">Medium &bull; Important</option>
                  <option value="HIGH">High &bull; Urgent / Essential</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground-secondary">Detailed Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Explain what feature you need, why it's valuable, and how it should work..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary placeholder:text-foreground-muted focus:border-brand-500 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-background-elevated text-foreground-secondary text-xs font-bold hover:text-foreground-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-extrabold text-xs shadow-brand-glow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === "MY_REQUESTS" && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {isLoadingRequests ? (
              <div className="py-8 text-center text-xs text-foreground-muted">Loading your requests...</div>
            ) : myRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-foreground-muted">
                You haven&apos;t submitted any feature requests yet.
              </div>
            ) : (
              myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-subtle space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground-primary">{req.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : req.status === "IN_PROGRESS"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : req.status === "PLANNED"
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                          : req.status === "OPEN"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-background-surface text-foreground-secondary border border-border-subtle"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-foreground-secondary leading-relaxed">{req.description}</p>
                  {req.adminResponse && (
                    <div className="p-3 rounded-xl bg-background-surface border border-border-default text-[11px] text-foreground-primary space-y-0.5">
                      <span className="font-bold text-brand-400 block">Developer Response:</span>
                      <p>{req.adminResponse}</p>
                    </div>
                  )}
                  <div className="text-[10px] text-foreground-muted pt-1">
                    Submitted on {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}