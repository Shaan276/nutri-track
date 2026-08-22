"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Bell,
  Sparkles,
  Dumbbell,
  Activity,
  Flame,
  Droplets,
  Scale,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Lock,
} from "lucide-react";
import {
  FriendSummaryDto,
  UserSearchResult,
  ActivityFeedItem,
} from "@/lib/services/community.service";
import { RecommendationDto } from "@/lib/services/recommendation.service";
import { NotificationDto } from "@/lib/services/notification.service";
import { SendRecommendationModal } from "./SendRecommendationModal";
import { FriendComparisonDrawer } from "./FriendComparisonDrawer";

type CommunityTab = "FRIENDS" | "REQUESTS" | "DISCOVER" | "FEED" | "RECOMMENDATIONS";

interface CommunityHubClientProps {
  initialFriends: FriendSummaryDto[];
  initialIncoming: any[];
  initialOutgoing: any[];
  initialNotifications?: NotificationDto[];
  initialUnreadCount?: number;
}

export function CommunityHubClient({
  initialFriends,
  initialIncoming,
  initialOutgoing,
  initialNotifications = [],
  initialUnreadCount = 0,
}: CommunityHubClientProps) {
  const [activeTab, setActiveTab] = useState<CommunityTab>("FRIENDS");
  const [friends, setFriends] = useState<FriendSummaryDto[]>(initialFriends);
  const [incoming, setIncoming] = useState<any[]>(initialIncoming);
  const [outgoing, setOutgoing] = useState<any[]>(initialOutgoing);
  const [recommendations, setRecommendations] = useState<RecommendationDto[]>([]);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals state
  const [selectedFriendForRecommend, setSelectedFriendForRecommend] = useState<FriendSummaryDto | null>(null);
  const [selectedFriendForCompare, setSelectedFriendForCompare] = useState<string | null>(null);

  // Refresh friends data
  const refreshFriendsData = async () => {
    try {
      const res = await fetch("/api/community/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncoming(data.incomingRequests || []);
        setOutgoing(data.outgoingRequests || []);
      }
    } catch {}
  };

  // Refresh recommendations
  const refreshRecommendations = async () => {
    try {
      const res = await fetch("/api/community/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch {}
  };

  // Refresh activity feed
  const refreshFeed = async () => {
    try {
      const res = await fetch("/api/community/feed");
      if (res.ok) {
        const data = await res.json();
        setFeed(data.feed || []);
      }
    } catch {}
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === "RECOMMENDATIONS") {
      refreshRecommendations();
    } else if (activeTab === "FEED") {
      refreshFeed();
    } else if (activeTab === "REQUESTS" || activeTab === "FRIENDS") {
      refreshFriendsData();
    }
  }, [activeTab]);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/community/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {}
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Send friend request
  const handleSendRequest = async (target: string) => {
    setActionLoadingId(target);
    setError(null);
    try {
      const res = await fetch("/api/community/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send friend request.");

      setSuccess(data.autoAccepted ? "Friend request accepted! You are now connected." : "Friend request sent!");
      setTimeout(() => setSuccess(null), 3500);
      refreshFriendsData();
      // Update search result status
      setSearchResults((prev) =>
        prev.map((u) => (u.id === target || u.username === target ? { ...u, relationshipStatus: "PENDING_SENT" } : u))
      );
    } catch (err: any) {
      setError(err.message || "Failed to send friend request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Respond to friend request
  const handleRespondRequest = async (friendshipId: string, action: "ACCEPT" | "DECLINE" | "BLOCK") => {
    setActionLoadingId(friendshipId);
    setError(null);
    try {
      const res = await fetch(`/api/community/friends/${friendshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to respond to request.");
      }

      setSuccess(action === "ACCEPT" ? "Friend request accepted!" : "Request removed.");
      setTimeout(() => setSuccess(null), 3000);
      refreshFriendsData();
    } catch (err: any) {
      setError(err.message || "Failed to update friend request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendUserId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    setActionLoadingId(friendUserId);
    setError(null);
    try {
      const res = await fetch(`/api/community/friends/${friendUserId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove friend.");
      }

      setSuccess("Friend removed.");
      setTimeout(() => setSuccess(null), 3000);
      refreshFriendsData();
    } catch (err: any) {
      setError(err.message || "Failed to remove friend.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Respond to recommendation
  const handleRespondRecommendation = async (recId: string, action: "SAVE" | "DISMISS") => {
    setActionLoadingId(recId);
    try {
      const res = await fetch(`/api/community/recommendations/${recId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error("Failed to update recommendation.");
      setSuccess(action === "SAVE" ? "Recommendation saved!" : "Recommendation dismissed.");
      setTimeout(() => setSuccess(null), 3000);
      refreshRecommendations();
    } catch (err: any) {
      setError(err.message || "Error updating recommendation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs: { key: CommunityTab; label: string; icon: any; count?: number }[] = [
    { key: "FRIENDS", label: "My Friends", icon: Users, count: friends.length },
    { key: "REQUESTS", label: "Requests", icon: UserPlus, count: incoming.length },
    { key: "DISCOVER", label: "Discover People", icon: Search },
    { key: "FEED", label: "Activity Feed", icon: Activity },
    { key: "RECOMMENDATIONS", label: "Recommendations", icon: Sparkles, count: recommendations.filter(r => r.status === "PENDING").length },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background-surface border border-border-default rounded-3xl p-6 sm:p-7 shadow-surface-card">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="h-3.5 w-3.5" />
            Social &bull; Friends &bull; Privacy First
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground-primary tracking-tight">
            Community &amp; Friends
          </h1>
          <p className="text-sm text-foreground-secondary mt-1 font-medium">
            Connect with training partners, share milestone summaries, and inspire mutual consistency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-xs font-bold text-neutral-300 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy Settings</span>
          </Link>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border-subtle">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm"
                  : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-500/30 text-brand-300 font-mono font-black">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MY FRIENDS */}
      {activeTab === "FRIENDS" && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="p-12 rounded-3xl bg-background-surface border border-border-default text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground-primary">No Friends Connected Yet</h3>
              <p className="text-xs text-foreground-secondary max-w-md mx-auto">
                Use the &quot;Discover People&quot; tab above to search for friends by username and build your supportive training circle!
              </p>
              <button
                onClick={() => setActiveTab("DISCOVER")}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-black font-extrabold text-xs cursor-pointer shadow-sm transition-all inline-flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find Training Partners</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="p-5 rounded-3xl bg-background-surface border border-border-default shadow-surface-card flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/community/${f.username}`}
                          className="text-sm font-extrabold text-foreground-primary hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{f.name}</span>
                        </Link>
                        <span className="text-[11px] font-mono text-foreground-muted">
                          @{f.username}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFriend(f.id)}
                      disabled={actionLoadingId === f.id}
                      title="Remove Friend"
                      className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Shared Metrics Badges */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-border-subtle text-center">
                    <div>
                      <span className="text-[10px] text-foreground-muted block font-semibold">Health Score</span>
                      <span className="text-xs font-black font-mono text-foreground-primary">
                        {f.sharedHealthScore !== null ? `${f.sharedHealthScore}/100` : "Private"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-muted block font-semibold">Running</span>
                      <span className="text-xs font-black font-mono text-emerald-400">
                        {f.sharedWeeklyRunningKm !== null ? `${f.sharedWeeklyRunningKm} km` : "Private"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-muted block font-semibold">Workouts</span>
                      <span className="text-xs font-black font-mono text-purple-400">
                        {f.sharedWeeklyWorkouts !== null ? `${f.sharedWeeklyWorkouts} wk` : "Private"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/community/${f.username}`}
                      className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold text-center transition-all cursor-pointer"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => setSelectedFriendForCompare(f.username)}
                      className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 transition-all cursor-pointer"
                      title="Compare Progress"
                    >
                      <Scale className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedFriendForRecommend(f)}
                      className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
                      title="Recommend Item"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FRIEND REQUESTS */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
            <h3 className="text-sm font-bold text-foreground-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Incoming Friend Requests ({incoming.length})</span>
            </h3>

            {incoming.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No pending friend requests.</p>
            ) : (
              <div className="space-y-3">
                {incoming.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                        {req.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{req.name}</div>
                        <span className="text-[11px] font-mono text-neutral-500">@{req.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondRequest(req.id, "ACCEPT")}
                        disabled={actionLoadingId === req.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req.id, "DECLINE")}
                        disabled={actionLoadingId === req.id}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
            <h3 className="text-sm font-bold text-foreground-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>Sent Requests Pending ({outgoing.length})</span>
            </h3>

            {outgoing.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No sent requests pending response.</p>
            ) : (
              <div className="space-y-3">
                {outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-bold">
                        {req.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-300">{req.name}</div>
                        <span className="text-[11px] font-mono text-neutral-500">@{req.username}</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-neutral-400 px-2.5 py-1 rounded-xl bg-neutral-800 border border-neutral-700">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DISCOVER PEOPLE */}
      {activeTab === "DISCOVER" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground-primary">Find Training Partners</h3>
              <p className="text-xs text-foreground-secondary">
                Search by username or display name. (Email addresses are always private and protected).
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or name (e.g. shaan, alex)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Results */}
            {searchQuery.trim() && (
              <div className="pt-2 space-y-3">
                {searchResults.length === 0 && !isSearching ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">
                    No users found matching &quot;{searchQuery}&quot;.
                  </p>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{user.name}</div>
                          <span className="text-[11px] font-mono text-neutral-500">@{user.username}</span>
                        </div>
                      </div>

                      {user.relationshipStatus === "ACCEPTED" ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                          Friends
                        </span>
                      ) : user.relationshipStatus === "PENDING_SENT" ? (
                        <span className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs font-semibold">
                          Request Sent
                        </span>
                      ) : user.relationshipStatus === "PENDING_RECEIVED" ? (
                        <button
                          onClick={() => user.friendshipId && handleRespondRequest(user.friendshipId, "ACCEPT")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs cursor-pointer"
                        >
                          Accept Request
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.username)}
                          disabled={actionLoadingId === user.username}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === user.username ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY FEED */}
      {activeTab === "FEED" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground-primary">Friend Activity Milestones</h3>
              <span className="text-xs text-neutral-500 font-medium">Shared milestones among your friends</span>
            </div>

            {feed.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
                <Activity className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="font-semibold text-neutral-400">No Shared Activity Yet</p>
                <p className="text-[11px] text-neutral-600">
                  When your friends log runs or workouts with sharing enabled, their positive milestones will appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      {item.type === "RUN" ? (
                        <Activity className="w-4 h-4" />
                      ) : item.type === "WORKOUT" ? (
                        <Dumbbell className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Droplets className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/community/${item.friendUsername}`}
                          className="text-xs font-bold text-white hover:text-emerald-400 transition-colors"
                        >
                          {item.title}
                        </Link>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5 font-medium">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: RECOMMENDATIONS */}
      {activeTab === "RECOMMENDATIONS" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-4">
            <h3 className="text-base font-bold text-foreground-primary">Received Recommendations</h3>
            <p className="text-xs text-foreground-secondary">
              Suggestions sent by your friends. (Review and save what you find helpful—your database is never modified automatically).
            </p>

            {recommendations.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
                <Sparkles className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="font-semibold text-neutral-400">No Recommendations Yet</p>
                <p className="text-[11px] text-neutral-600">
                  Friends can recommend workout routines, running ideas, recipes, or target goals to you.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {rec.itemType.replace("_", " ")}
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">{rec.title}</h4>
                        <span className="text-[11px] text-neutral-400">
                          From <strong className="text-neutral-200">{rec.senderName}</strong> (@{rec.senderUsername})
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          rec.status === "ACCEPTED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : rec.status === "DISMISSED"
                            ? "bg-neutral-800 text-neutral-500 border border-neutral-700"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    {rec.message && (
                      <p className="text-xs text-neutral-300 italic bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                        &quot;{rec.message}&quot;
                      </p>
                    )}

                    {rec.status === "PENDING" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleRespondRecommendation(rec.id, "SAVE")}
                          disabled={actionLoadingId === rec.id}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs transition-all cursor-pointer"
                        >
                          Save Idea
                        </button>
                        <button
                          onClick={() => handleRespondRecommendation(rec.id, "DISMISS")}
                          disabled={actionLoadingId === rec.id}
                          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      {selectedFriendForRecommend && (
        <SendRecommendationModal
          friendId={selectedFriendForRecommend.id}
          friendName={selectedFriendForRecommend.name}
          friendUsername={selectedFriendForRecommend.username}
          isOpen={!!selectedFriendForRecommend}
          onClose={() => setSelectedFriendForRecommend(null)}
          onSuccess={() => {
            setSuccess(`Recommendation sent to ${selectedFriendForRecommend.name}!`);
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}

      {selectedFriendForCompare && (
        <FriendComparisonDrawer
          friendUsername={selectedFriendForCompare}
          isOpen={!!selectedFriendForCompare}
          onClose={() => setSelectedFriendForCompare(null)}
        />
      )}
    </div>
  );
}
