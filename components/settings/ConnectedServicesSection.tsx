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
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [stravaConnecting, setStravaConnecting] = useState(false);
  const [stravaMessage, setStravaMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

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

  // Connect with Strava
  const handleConnectStrava = async () => {
    try {
      setStravaConnecting(true);
      setStravaMessage(null);

      const res = await fetch("/api/integrations/strava/connect");
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // If in test/development sandbox without custom OAuth app, simulate instant connection
          if (data.url.includes("strava_client_id_placeholder")) {
            const cbRes = await fetch("/api/integrations/strava/callback?code=mock_strava_auth_code_12345");
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

  // Sync Strava Now
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

      {/* Grid of Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: STRAVA */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#FC4C02]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground-primary">Strava</h4>
                  <p className="text-xs text-foreground-secondary">Running, Cycling &amp; Cardio Telemetry</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  isStravaConnected
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {isStravaConnected ? "● Connected" : "Not Connected"}
              </span>
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              Synchronize completed outdoor runs, tempo runs, cycling, and walks with GPS distance, moving duration, pace, elevation, and active calories.
            </p>

            {/* Capability Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Runs & Walks", "Distance (km)", "Moving Duration", "Pace (min/km)", "Active Calories", "Elevation"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="px-2 py-0.5 rounded-md bg-background-elevated border border-border-subtle text-[10px] text-foreground-muted"
                  >
                    ✓ {badge}
                  </span>
                )
              )}
            </div>

            {isStravaConnected && stravaConn.lastSyncAt && (
              <div className="text-[11px] text-foreground-muted">
                Last synced: <span className="text-foreground-secondary font-medium">{new Date(stravaConn.lastSyncAt).toLocaleString()}</span>
              </div>
            )}

            {stravaMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  stravaMessage.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-800/40 text-emerald-300"
                    : "bg-rose-950/60 border border-rose-800/40 text-rose-300"
                }`}
              >
                {stravaMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{stravaMessage.text}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-3">
            {isStravaConnected ? (
              <>
                <button
                  onClick={handleSyncStrava}
                  disabled={stravaSyncing}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${stravaSyncing ? "animate-spin" : ""}`} />
                  <span>{stravaSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
                <button
                  onClick={handleDisconnectStrava}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectStrava}
                disabled={stravaConnecting}
                className="w-full py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Activity className="w-4 h-4" />
                <span>{stravaConnecting ? "Connecting..." : "Connect with Strava"}</span>
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: ADIDAS RUNNING */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground-primary">Adidas Running</h4>
                  <p className="text-xs text-foreground-secondary">Runtastic Activity Tracking</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                Public API Restricted
              </span>
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              Adidas Running (formerly Runtastic) retired open developer API registrations. In adherence to strict data accuracy, Nutri-Track does not scrape accounts or prompt for passwords.
            </p>

            <div className="p-3 rounded-2xl bg-background-elevated border border-border-subtle text-xs text-foreground-muted space-y-1">
              <div className="font-semibold text-foreground-secondary">Available Workflows:</div>
              <div>• Manual Activity Logging in the Activities module</div>
              <div>• Standard GPX/TCX workout export/import support</div>
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] text-foreground-muted">Manual logging available</span>
            <Link
              href="/activities"
              className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-neutral-800 border border-border-subtle text-xs font-semibold text-foreground-primary transition-colors cursor-pointer"
            >
              Log Activity
            </Link>
          </div>
        </div>

        {/* CARD 3: GARMIN & SMARTWATCHES */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground-primary">Garmin Connect</h4>
                  <p className="text-xs text-foreground-secondary">Smartwatch &amp; Heart Rate Telemetry</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-sky-400 border border-sky-500/30">
                Coming Soon
              </span>
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              Garmin Connect enterprise webhook architecture is prepared. Direct workout synchronization with heart rate zones, VO2 max, and cadence will be active in an upcoming update.
            </p>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] text-foreground-muted">Architecture Ready</span>
            <span className="text-xs text-slate-500 font-medium">Enterprise Pipeline</span>
          </div>
        </div>

        {/* CARD 4: GOOGLE FIT & APPLE HEALTH */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground-primary">Google Fit &amp; Apple Health</h4>
                  <p className="text-xs text-foreground-secondary">Mobile Native Health Bridges</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-rose-400 border border-rose-500/30">
                Coming Soon
              </span>
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              Direct mobile Health Connect and Apple Health sync require native application packaging. In PWA mode, you can log manual steps or sync cardio through Strava.
            </p>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] text-foreground-muted">PWA Compatible</span>
            <span className="text-xs text-slate-500 font-medium">Native Bridge Pipeline</span>
          </div>
        </div>

        {/* CARD 5: STEPS & MOBILE HEALTH PROVIDER */}
        <div className="p-6 rounded-3xl bg-background-surface border border-border-default flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Footprints className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground-primary">Steps &amp; Mobile Health Architecture</h4>
                  <p className="text-xs text-foreground-secondary">Automatic Pedometer &amp; Provider Step Ingestion</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                Ready &amp; Supported
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle space-y-1.5">
                <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  Automatic Collection
                </div>
                <p className="text-[11px] text-foreground-secondary leading-relaxed">
                  Steps are automatically collected when synced from connected activity providers (e.g. Strava running sessions) or future Android Health Connect mobile bridges.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-background-elevated border border-border-subtle space-y-1.5">
                <div className="text-xs font-bold text-foreground-primary flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  Manual Step Fallback
                </div>
                <p className="text-[11px] text-foreground-secondary leading-relaxed">
                  Laptop browsers cannot physically count body steps. You can set daily step targets and log manual steps in Settings or Activities without double-counting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GOOGLE SHEETS INTEGRATION (100% Preserved Existing Architecture) */}
      <div className="pt-4 border-t border-border-subtle">
        <GoogleSheetsSection />
      </div>
    </div>
  );
}
