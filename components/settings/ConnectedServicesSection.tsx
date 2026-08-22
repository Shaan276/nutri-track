"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Footprints,
  FileSpreadsheet,
  Zap,
  Lock,
  Check,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { GoogleSheetsSection } from "@/components/profile/GoogleSheetsSection";
import Link from "next/link";

interface ConnectedProvider {
  provider: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  externalUserId: string | null;
  externalUsername: string | null;
  scope: string | null;
  lastSyncAt: string | null;
  createdAt: string;
}

export function ConnectedServicesSection() {
  const [integrations, setIntegrations] = useState<ConnectedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Strava State
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [stravaConnecting, setStravaConnecting] = useState(false);
  const [stravaMessage, setStravaMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Google Health State
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{
    todaySteps: number;
    todayCalories: number;
    todayDistanceKm: number;
    status: string;
    lastSyncedAt: string | null;
  } | null>(null);
  const [googleMessage, setGoogleMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchIntegrations();
    fetchGoogleStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch("/api/integrations/google-fit/status");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setGoogleStatus(json.data);
          // Trigger auto-sync once if connected and never synced today
          if (json.data.isConnected && (!json.data.lastSyncAt || Date.now() - new Date(json.data.lastSyncAt).getTime() > 600000)) {
            handleSyncGoogleSilent();
          }
        }
      }
    } catch {
      // Ignore background status check errors
    }
  };

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const stravaConn = integrations.find((i) => i.provider === "STRAVA");
  const isStravaConnected = stravaConn && stravaConn.status === "CONNECTED";

  const googleConn = integrations.find((i) => i.provider === "GOOGLE_FIT");
  const isGoogleConnected = googleConn && googleConn.status === "CONNECTED";

  // Connect Strava
  const handleConnectStrava = async () => {
    try {
      setStravaConnecting(true);
      setStravaMessage(null);

      const res = await fetch("/api/integrations/strava/connect");
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (data.url.includes("strava_client_id_placeholder")) {
            await fetch("/api/integrations/strava/callback?code=mock_strava_auth_code_12345");
            await fetchIntegrations();
            setStravaMessage({
              type: "success",
              text: "Strava test sandbox connected successfully! Synced demo runs.",
            });
          } else {
            window.location.href = data.url;
          }
        }
      }
    } catch (err: any) {
      setStravaMessage({ type: "error", text: err.message || "Failed to initiate Strava connection" });
    } finally {
      setStravaConnecting(false);
    }
  };

  // Sync Strava
  const handleSyncStrava = async () => {
    try {
      setStravaSyncing(true);
      setStravaMessage(null);

      const res = await fetch("/api/integrations/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Sync failed");
      }

      await fetchIntegrations();
      setStravaMessage({
        type: "success",
        text: `Sync complete! ${data.data?.importedCount || 0} new activities imported, ${data.data?.updatedCount || 0} reconciled.`,
      });
    } catch (err: any) {
      setStravaMessage({ type: "error", text: err.message || "Failed to sync Strava activities" });
    } finally {
      setStravaSyncing(false);
    }
  };

  // Disconnect Strava
  const handleDisconnectStrava = async () => {
    if (!confirm("Are you sure you want to disconnect Strava? Local activities will remain preserved.")) {
      return;
    }

    try {
      setLoading(true);
      setStravaMessage(null);
      const res = await fetch("/api/integrations/strava/disconnect", { method: "POST" });
      if (res.ok) {
        await fetchIntegrations();
        setStravaMessage({ type: "success", text: "Strava disconnected successfully." });
      }
    } catch (err: any) {
      setStravaMessage({ type: "error", text: err.message || "Failed to disconnect Strava" });
    } finally {
      setLoading(false);
    }
  };

  // Connect Google Health
  const handleConnectGoogle = async () => {
    try {
      setGoogleConnecting(true);
      setGoogleMessage(null);

      const res = await fetch("/api/integrations/google-fit/connect");
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (data.url.includes("google_client_id_placeholder")) {
            await fetch("/api/integrations/google-fit/callback?code=mock_google_auth_code_12345");
            await fetchIntegrations();
            await fetchGoogleStatus();
            setGoogleMessage({
              type: "success",
              text: "Google Account connected in sandbox mode! Synced demo steps and calories.",
            });
          } else {
            window.location.href = data.url;
          }
        }
      }
    } catch (err: any) {
      setGoogleMessage({ type: "error", text: err.message || "Failed to initiate Google connection" });
    } finally {
      setGoogleConnecting(false);
    }
  };

  // Silent sync helper for auto-refresh
  const handleSyncGoogleSilent = async () => {
    try {
      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch("/api/integrations/google-fit/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 1, timezoneOffsetMinutes: tzOffset }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setGoogleStatus({
            todaySteps: json.data.importedSteps || 0,
            todayCalories: json.data.importedCalories || 0,
            todayDistanceKm: json.data.importedDistanceKm || 0,
            status: json.data.status,
            lastSyncedAt: json.data.lastSyncedAt || new Date().toISOString(),
          });
        }
      }
    } catch {
      // silent
    }
  };

  // Manual Sync Google Health
  const handleSyncGoogle = async () => {
    try {
      setGoogleSyncing(true);
      setGoogleMessage(null);

      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch("/api/integrations/google-fit/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 1, timezoneOffsetMinutes: tzOffset }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Sync failed");
      }

      await fetchIntegrations();
      const syncData = json.data;

      setGoogleStatus({
        todaySteps: syncData?.importedSteps || 0,
        todayCalories: syncData?.importedCalories || 0,
        todayDistanceKm: syncData?.importedDistanceKm || 0,
        status: syncData?.status || "SUCCESS",
        lastSyncedAt: syncData?.lastSyncedAt || new Date().toISOString(),
      });

      if (syncData?.status === "SUCCESS") {
        setGoogleMessage({
          type: "success",
          text: `Sync complete! Synced ${syncData.importedSteps.toLocaleString()} steps and ${syncData.importedCalories} active calories from your Google account.`,
        });
      } else if (syncData?.status === "GENUINE_ZERO") {
        setGoogleMessage({
          type: "info",
          text: "0 steps recorded for today in your Google account.",
        });
      } else if (syncData?.status === "NO_DATA_AVAILABLE") {
        setGoogleMessage({
          type: "info",
          text: "No step data is currently available from your connected Google account for today.",
        });
      } else if (syncData?.status === "AUTH_EXPIRED") {
        setGoogleMessage({
          type: "error",
          text: syncData?.message || "Google permissions have expired. Please click Reconnect Google.",
        });
      } else {
        setGoogleMessage({
          type: "error",
          text: syncData?.message || "Unable to sync steps right now. Please try again.",
        });
      }
    } catch (err: any) {
      setGoogleMessage({ type: "error", text: err.message || "Failed to sync Google Health telemetry" });
    } finally {
      setGoogleSyncing(false);
    }
  };

  // Disconnect Google Health
  const handleDisconnectGoogle = async () => {
    if (!confirm("Are you sure you want to disconnect Google Account? Local activity history will remain preserved.")) {
      return;
    }

    try {
      setLoading(true);
      setGoogleMessage(null);
      const res = await fetch("/api/integrations/google-fit/disconnect", { method: "POST" });
      if (res.ok) {
        await fetchIntegrations();
        setGoogleStatus(null);
        setGoogleMessage({ type: "success", text: "Google account disconnected successfully." });
      }
    } catch (err: any) {
      setGoogleMessage({ type: "error", text: err.message || "Failed to disconnect Google account" });
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="p-6 rounded-3xl bg-background-surface border border-border-default space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground-primary">Connected Services &amp; Health Data Sync</h3>
            <p className="text-xs text-foreground-secondary">
              Connect external activity trackers and Google Sheets to automatically synchronize telemetry, workouts, and nutrition.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: STRAVA */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground-primary">Strava</h4>
                  <p className="text-xs text-foreground-secondary">Running &amp; Cardio GPS Synchronization</p>
                </div>
              </div>

              {isStravaConnected ? (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                  100% Free
                </span>
              )}
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              Synchronize running pace, distance, elevation gain, heart rate telemetry, and workout calories directly into your Nutri-Track journal.
            </p>

            {isStravaConnected && (
              <div className="p-3 rounded-2xl bg-background-elevated border border-border-subtle text-xs space-y-1 text-foreground-secondary">
                <div>Athlete: <span className="font-semibold text-foreground-primary">{stravaConn?.externalUsername || "Connected Athlete"}</span></div>
                <div>Last Synced: <span className="font-mono text-foreground-muted">{stravaConn?.lastSyncAt ? new Date(stravaConn.lastSyncAt).toLocaleString() : "Never"}</span></div>
              </div>
            )}

            {stravaMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  stravaMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                }`}
              >
                {stravaMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{stravaMessage.text}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            {isStravaConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleDisconnectStrava}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncStrava}
                  disabled={stravaSyncing}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${stravaSyncing ? "animate-spin" : ""}`} />
                  <span>{stravaSyncing ? "Syncing..." : "Sync Runs Now"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectStrava}
                disabled={stravaConnecting}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-4 h-4" />
                <span>{stravaConnecting ? "Connecting..." : "Connect with Strava"}</span>
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: ANDROID HEALTH CONNECT & DEVICE SENSORS */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default flex flex-col justify-between space-y-4 md:col-span-1">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground-primary">Google Health &amp; Health Connect</h4>
                  <p className="text-xs text-foreground-secondary">Steps, Active Calories, Sleep &amp; Motion Sensors</p>
                </div>
              </div>

              {isGoogleConnected ? (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Android Native
                </span>
              )}
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              Synchronize full-day steps, active calorie expenditure, and walk/run distance directly from <strong>Android Health Connect</strong>, Samsung Health, Google Account, or device motion sensors.
            </p>

            {isGoogleConnected ? (
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground-muted">Today&apos;s Steps</div>
                    <div className="text-2xl font-black text-foreground-primary tracking-tight">
                      {(googleStatus?.todaySteps || 0).toLocaleString()}{" "}
                      <span className="text-xs font-medium text-foreground-muted">steps</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground-muted">Last Synced</div>
                    <div className="text-xs font-mono font-semibold text-emerald-400">
                      {formatRelativeTime(googleStatus?.lastSyncedAt || googleConn?.lastSyncAt)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-xs text-foreground-secondary">
                  <span>Account: <strong className="text-foreground-primary">{googleConn?.externalUsername || "Google User"}</strong></span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Auto-Sync Active
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-xs text-foreground-secondary space-y-1">
                <div className="font-semibold text-foreground-primary">Automatic Google Step Sync</div>
                <p>Connect your Google Account once from your laptop. Today&apos;s steps and active calories will sync automatically.</p>
              </div>
            )}

            {googleMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  googleMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : googleMessage.type === "info"
                    ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                }`}
              >
                {googleMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{googleMessage.text}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {isGoogleConnected ? (
                <>
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncGoogle}
                    disabled={googleSyncing}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${googleSyncing ? "animate-spin" : ""}`} />
                    <span>{googleSyncing ? "Syncing..." : "Sync Steps Now"}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={googleConnecting}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Footprints className="w-4 h-4" />
                  <span>{googleConnecting ? "Connecting..." : "Connect Health Connect"}</span>
                </button>
              )}
            </div>

            {/* Quick Step Sync from Phone Screen */}
            <div className="pt-2 border-t border-border-subtle/50 flex items-center gap-2">
              <input
                type="number"
                id="quick-phone-steps-input"
                placeholder="Enter steps from phone (e.g. 5200)"
                className="flex-1 px-3 py-1.5 bg-background-elevated border border-border-subtle rounded-xl text-xs text-foreground-primary focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={async () => {
                  const input = document.getElementById("quick-phone-steps-input") as HTMLInputElement;
                  const stepsVal = Number(input?.value);
                  if (!stepsVal || stepsVal <= 0) {
                    alert("Please enter a valid step count from your phone.");
                    return;
                  }
                  try {
                    setGoogleSyncing(true);
                    const res = await fetch("/api/integrations/health-connect/sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ steps: stepsVal, sourceApp: "Android Phone Screen" }),
                    });
                    const d = await res.json();
                    if (res.ok) {
                      setGoogleMessage({ type: "success", text: `Successfully saved ${stepsVal} steps to your Activities log!` });
                      input.value = "";
                      await fetchIntegrations();
                    } else {
                      throw new Error(d.error || "Failed to save steps");
                    }
                  } catch (e: any) {
                    setGoogleMessage({ type: "error", text: e.message });
                  } finally {
                    setGoogleSyncing(false);
                  }
                }}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-bold rounded-xl border border-neutral-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Log Steps
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GOOGLE SHEETS INTEGRATION */}
      <div className="pt-4 border-t border-border-subtle">
        <GoogleSheetsSection />
      </div>
    </div>
  );
}
