"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Droplets,
  UtensilsCrossed,
  Dumbbell,
  Activity,
  Users,
  Sparkles,
  MessageSquarePlus,
  ShieldAlert,
  Info,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

type FilterTab = "ALL" | "REMINDERS" | "COMMUNITY" | "SYSTEM";

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=30");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // safe ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh notifications every 45s (non-aggressive)
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, actionUrl?: string | null) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch(`/api/notifications/${id}`, { method: "PATCH" });

      if (actionUrl && actionUrl.startsWith("/")) {
        setIsOpen(false);
        router.push(actionUrl);
      }
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
    } catch {
      fetchNotifications();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch {
      fetchNotifications();
    }
  };

  const handleTriggerEvaluate = async () => {
    setIsEvaluating(true);
    try {
      await fetch("/api/notifications/evaluate", { method: "POST" });
      await fetchNotifications();
    } catch {
      // safe ignore
    } finally {
      setIsEvaluating(false);
    }
  };

  const getCategoryIcon = (category: string, type: string) => {
    switch (category) {
      case "HYDRATION":
        return <Droplets className="h-4 w-4 text-blue-400" />;
      case "NUTRITION":
        return <UtensilsCrossed className="h-4 w-4 text-brand-400" />;
      case "WORKOUTS":
        return <Dumbbell className="h-4 w-4 text-purple-400" />;
      case "ACTIVITIES":
        return <Activity className="h-4 w-4 text-amber-400" />;
      case "FRIENDS":
        return <Users className="h-4 w-4 text-emerald-400" />;
      case "INSIGHTS":
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
      case "FEATURE_REQUEST":
        return <MessageSquarePlus className="h-4 w-4 text-violet-400" />;
      case "ADMIN":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      default:
        return <Info className="h-4 w-4 text-foreground-secondary" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "REMINDERS") {
      return ["HYDRATION", "NUTRITION", "WORKOUTS", "ACTIVITIES"].includes(n.category);
    }
    if (activeTab === "COMMUNITY") {
      return n.category === "FRIENDS";
    }
    if (activeTab === "SYSTEM") {
      return ["SYSTEM", "ADMIN", "FEATURE_REQUEST", "INSIGHTS"].includes(n.category);
    }
    return true;
  });

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
          isOpen
            ? "bg-brand-500/20 text-brand-400 border border-brand-500/40"
            : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated border border-transparent hover:border-border-subtle"
        }`}
        title="Notification Center"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-black text-[10px] font-black flex items-center justify-center shadow-brand-glow animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[340px] sm:w-[420px] max-h-[540px] bg-background-surface border border-border-default rounded-3xl shadow-surface-card z-50 flex flex-col overflow-hidden animate-fade-in text-left">
          {/* Top Bar */}
          <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-foreground-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-foreground-secondary hover:text-brand-400 hover:bg-background-elevated transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}

              <button
                onClick={handleTriggerEvaluate}
                disabled={isEvaluating}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-brand-400 hover:bg-background-elevated transition-colors cursor-pointer disabled:opacity-50"
                title="Check Smart Reminders"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground-primary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2.5 pb-2 flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border-subtle bg-background-elevated/40">
            {(["ALL", "REMINDERS", "COMMUNITY", "SYSTEM"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                    : "text-foreground-muted hover:text-foreground-secondary"
                }`}
              >
                {tab === "ALL" ? "All" : tab === "REMINDERS" ? "Reminders" : tab === "COMMUNITY" ? "Community" : "System"}
              </button>
            ))}
          </div>

          {/* Notifications Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle max-h-[380px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bell className="h-7 w-7 text-foreground-muted/40 mx-auto" />
                <p className="text-xs text-foreground-muted">No notifications in this view.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const icon = getCategoryIcon(notif.category, notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.actionUrl)}
                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-background-elevated/50 group relative ${
                      !notif.isRead ? "bg-brand-500/[0.04]" : ""
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-brand-400 ring-4 ring-brand-500/20" />
                    )}

                    {/* Icon */}
                    <div className="p-2 rounded-xl bg-background-elevated border border-border-subtle shrink-0 mt-0.5">
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-extrabold truncate ${!notif.isRead ? "text-foreground-primary" : "text-foreground-secondary"}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] font-mono text-foreground-muted shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-foreground-secondary leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>

                      {notif.actionUrl && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-brand-400">
                          <span>View Details</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="p-1 rounded-lg text-foreground-muted/40 hover:text-rose-400 hover:bg-rose-500/15 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                      title="Dismiss notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}