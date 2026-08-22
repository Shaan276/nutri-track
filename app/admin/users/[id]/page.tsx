"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertOctagon,
  UtensilsCrossed,
  Droplets,
  Activity,
  Dumbbell,
  Sparkles,
  MessageSquarePlus,
  RefreshCw,
  Calendar,
  Flame,
  Footprints,
} from "lucide-react";

type DetailTab = "OVERVIEW" | "NUTRITION" | "HYDRATION" | "ACTIVITIES" | "WORKOUTS" | "REQUESTS";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("OVERVIEW");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchUserDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user dossier");
      const data = await res.json();
      setDossier(data);
    } catch (err) {
      console.error("User detail error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchUserDetail();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async () => {
    const currentRole = dossier?.user?.role || "USER";
    const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Change user role to ${nextRole}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      await fetchUserDetail();
    } catch (err) {
      console.error("Role update error:", err);
      alert("Failed to update role.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-brand-400 animate-spin mx-auto" />
        <p className="text-xs text-foreground-muted">Loading user dossier...</p>
      </div>
    );
  }

  if (!dossier || !dossier.user) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-bold text-rose-400">User not found</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-background-elevated text-xs font-bold text-foreground-primary rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </Link>
      </div>
    );
  }

  const { user, profile, nutrientTarget, healthSnapshot, recentActivity, featureRequests } = dossier;

  const tabs: { key: DetailTab; label: string; icon: any }[] = [
    { key: "OVERVIEW", label: "Overview & AI Snapshot", icon: Sparkles },
    { key: "NUTRITION", label: "Nutrition Logs", icon: UtensilsCrossed },
    { key: "HYDRATION", label: "Hydration", icon: Droplets },
    { key: "ACTIVITIES", label: "Movement & Cardio", icon: Activity },
    { key: "WORKOUTS", label: "Workouts & Lifting", icon: Dumbbell },
    { key: "REQUESTS", label: `Feature Requests (${featureRequests?.length || 0})`, icon: MessageSquarePlus },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Back Link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground-secondary hover:text-brand-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to User List</span>
      </Link>

      {/* User Header Profile Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-background-surface border border-border-default shadow-surface-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-extrabold text-2xl shrink-0">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground-primary tracking-tight">
                {user.name}
              </h1>
              <span className="text-xs font-mono text-foreground-muted">@{user.username}</span>

              {/* Role Badge */}
              <button
                onClick={handleToggleRole}
                disabled={actionLoading}
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer transition-all ${
                  user.role === "ADMIN"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-background-elevated text-foreground-secondary border border-border-subtle hover:text-foreground-primary"
                }`}
                title="Click to toggle Admin / User role"
              >
                {user.role}
              </button>

              {/* Account Status Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  user.accountStatus === "APPROVED"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : user.accountStatus === "PENDING_APPROVAL"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {user.accountStatus.replace("_", " ")}
              </span>
            </div>

            <div className="text-xs text-foreground-secondary flex items-center gap-3 flex-wrap">
              <span>{user.email}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
                Registered: {new Date(user.createdAt).toLocaleDateString()}
              </span>
              {user.approvedAt && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-400 font-mono">
                    Approved: {new Date(user.approvedAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {user.accountStatus === "PENDING_APPROVAL" && (
            <>
              <button
                onClick={() => handleUpdateStatus("APPROVED")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                Approve User
              </button>
              <button
                onClick={() => handleUpdateStatus("REJECTED")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}

          {user.accountStatus === "APPROVED" && (
            <button
              onClick={() => handleUpdateStatus("SUSPENDED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Suspend User
            </button>
          )}

          {user.accountStatus === "SUSPENDED" && (
            <button
              onClick={() => handleUpdateStatus("APPROVED")}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Restore User Access
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
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
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & AI HEALTH SNAPSHOT */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Health Score & Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Health Score Gauge */}
            <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Health Score</span>
                <Sparkles className="h-4 w-4 text-brand-400" />
              </div>
              <div className="text-4xl font-black font-mono text-brand-400">
                {healthSnapshot?.healthScore?.score ?? "--"}/100
              </div>
              <p className="text-xs text-foreground-secondary">
                {healthSnapshot?.healthScore?.feedback || "Deterministic multi-vector health rating"}
              </p>
            </div>

            {/* Daily Calorie Balance */}
            <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Calorie Intake</span>
                <Flame className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-4xl font-black font-mono text-foreground-primary">
                {healthSnapshot?.nutrition?.totalCalories ?? 0}{" "}
                <span className="text-sm font-normal text-foreground-muted">
                  / {nutrientTarget?.calories ?? 2000} kcal
                </span>
              </div>
              <div className="text-xs text-foreground-secondary font-mono flex items-center gap-3">
                <span>P: {healthSnapshot?.nutrition?.totalProtein ?? 0}g</span>
                <span>C: {healthSnapshot?.nutrition?.totalCarbohydrates ?? 0}g</span>
                <span>F: {healthSnapshot?.nutrition?.totalFat ?? 0}g</span>
              </div>
            </div>

            {/* Hydration & Steps */}
            <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Hydration &amp; Movement</span>
                <Droplets className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-4xl font-black font-mono text-blue-400">
                {healthSnapshot?.hydration?.consumedMl ?? 0}{" "}
                <span className="text-sm font-normal text-foreground-muted">
                  / {profile?.dailyHydrationTargetMl ?? 2500} ml
                </span>
              </div>
              <p className="text-xs text-foreground-secondary font-mono flex items-center gap-2">
                <Footprints className="h-3.5 w-3.5 text-emerald-400" />
                <span>{healthSnapshot?.movement?.totalSteps ?? 0} steps today</span>
              </p>
            </div>
          </div>

          {/* Profile & Metabolic Targets */}
          <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
            <h3 className="text-base font-bold text-foreground-primary">User Profile &amp; Biometrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle space-y-1">
                <span className="text-foreground-muted text-[11px]">Biological Sex</span>
                <p className="font-bold text-foreground-primary">{profile?.biologicalSex || "Not set"}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle space-y-1">
                <span className="text-foreground-muted text-[11px]">Height &amp; Weight</span>
                <p className="font-bold text-foreground-primary">
                  {profile ? `${profile.heightCm} cm &bull; ${profile.weightKg} kg` : "Not set"}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle space-y-1">
                <span className="text-foreground-muted text-[11px]">Activity Level</span>
                <p className="font-bold text-foreground-primary">{profile?.activityLevel || "Not set"}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-background-elevated border border-border-subtle space-y-1">
                <span className="text-foreground-muted text-[11px]">Primary Goal</span>
                <p className="font-bold text-foreground-primary">{profile?.primaryGoal || "MAINTAIN"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NUTRITION LOGS */}
      {activeTab === "NUTRITION" && (
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
          <h3 className="text-base font-bold text-foreground-primary">Recent Meal Logs</h3>
          {recentActivity?.meals?.length === 0 ? (
            <p className="text-xs text-foreground-muted py-6 text-center">No meal logs recorded for this user.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.meals.map((meal: any) => (
                <div
                  key={meal.id}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-bold text-xs text-foreground-primary uppercase tracking-wider text-brand-400">
                      {meal.mealType}
                    </span>
                    <p className="text-[11px] text-foreground-muted font-mono">
                      {new Date(meal.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-foreground-primary">
                    {meal.totalCalories || 0} kcal
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HYDRATION */}
      {activeTab === "HYDRATION" && (
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
          <h3 className="text-base font-bold text-foreground-primary">Recent Hydration Entries</h3>
          {recentActivity?.hydration?.length === 0 ? (
            <p className="text-xs text-foreground-muted py-6 text-center">No hydration logs recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.hydration.map((h: any) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between"
                >
                  <span className="text-xs font-mono text-foreground-secondary">
                    {new Date(h.date).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400">{h.amountMl} ml</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITIES */}
      {activeTab === "ACTIVITIES" && (
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
          <h3 className="text-base font-bold text-foreground-primary">Recent Movement &amp; Cardio</h3>
          {recentActivity?.activities?.length === 0 ? (
            <p className="text-xs text-foreground-muted py-6 text-center">No activity logs recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.activities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-foreground-primary">{act.activityType}</span>
                    <p className="text-[11px] text-foreground-muted font-mono">
                      {new Date(act.date).toLocaleDateString()} &bull; {act.durationMinutes} min
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">{act.caloriesBurned || 0} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WORKOUTS */}
      {activeTab === "WORKOUTS" && (
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
          <h3 className="text-base font-bold text-foreground-primary">Recent Workout Sessions</h3>
          {recentActivity?.workouts?.length === 0 ? (
            <p className="text-xs text-foreground-muted py-6 text-center">No workout sessions recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.workouts.map((w: any) => (
                <div
                  key={w.id}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-subtle flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-foreground-primary">{w.name || "Workout Session"}</span>
                    <p className="text-[11px] text-foreground-muted font-mono">
                      {new Date(w.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400">{w.workoutType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: FEATURE REQUESTS */}
      {activeTab === "REQUESTS" && (
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default shadow-surface-card space-y-4">
          <h3 className="text-base font-bold text-foreground-primary">Submitted Feature Requests</h3>
          {featureRequests?.length === 0 ? (
            <p className="text-xs text-foreground-muted py-6 text-center">This user has not submitted any feature requests.</p>
          ) : (
            <div className="space-y-3">
              {featureRequests.map((fr: any) => (
                <div
                  key={fr.id}
                  className="p-4 rounded-2xl bg-background-elevated border border-border-subtle space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground-primary">{fr.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-400 border border-brand-500/30">
                      {fr.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-secondary">{fr.description}</p>
                  {fr.adminResponse && (
                    <div className="p-3 rounded-xl bg-background-surface border border-border-default text-xs text-foreground-primary">
                      <span className="font-bold text-brand-400 block mb-1">Admin Response:</span>
                      {fr.adminResponse}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}