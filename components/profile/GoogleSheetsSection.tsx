"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  X,
  Edit3,
  Code2,
  Zap,
} from "lucide-react";
import {
  DEFAULT_NUTRITION_TEMPLATE_URL,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from "@/lib/validations/google-sheets";

interface GoogleSheetConnectionState {
  id: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  syncStatus: "IDLE" | "SYNCING" | "SUCCESS" | "FAILED";
  lastSyncedAt: string | null;
}

interface GoogleSheetsSectionProps {
  title?: string;
  subtitle?: string;
}

export function GoogleSheetsSection({
  title = "Google Sheets & Apps Script Integration",
  subtitle = "Synchronize all 14 nutrition workbook sheets with zero Google Cloud setup.",
}: GoogleSheetsSectionProps) {
  const [connection, setConnection] = useState<GoogleSheetConnectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [copiedTemplateUrl, setCopiedTemplateUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    fetchConnection();
  }, []);

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/google-sheets/connection");
      const data = await res.json();
      if (data.success && data.data) {
        setConnection(data.data);
        setUrlInput(data.data.spreadsheetUrl);
      } else {
        setConnection(null);
      }
    } catch (err) {
      console.error("Failed to load Google Sheets connection:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!urlInput.trim()) {
      setErrorMsg("Please provide a valid Apps Script Webhook URL or Google Spreadsheet URL.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/google-sheets/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetUrl: urlInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to connect. Please check the URL.");
      }

      setConnection(data.data);
      setIsEditing(false);
      const isWebhook = data.data.spreadsheetUrl.includes("script.google.com");
      setSuccessMsg(
        isWebhook
          ? "Google Apps Script Webhook connected successfully! (Zero Cloud Setup Active)"
          : "Google Spreadsheet connected successfully!"
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect spreadsheet.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setSyncing(true);
      const res = await fetch("/api/google-sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "PUSH_LOGS", dateRangeDays: 30 }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to synchronize with Google Sheets");
      }

      setSuccessMsg(data.message || "Successfully synchronized all workbook sheets!");
      await fetchConnection();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to synchronize with Google Sheets");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectConfirm = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setSaving(true);
      const res = await fetch("/api/google-sheets/connection", {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disconnect spreadsheet");
      }

      setConnection(null);
      setUrlInput("");
      setIsEditing(false);
      setShowDisconnectModal(false);
      setSuccessMsg("Spreadsheet disconnected cleanly. Your Nutri-Track data remains safe.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to disconnect spreadsheet");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyTemplateClick = () => {
    window.open(DEFAULT_NUTRITION_TEMPLATE_URL, "_blank", "noopener,noreferrer");
    setShowInstructionsModal(true);
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyLinkToClipboard = () => {
    navigator.clipboard.writeText(DEFAULT_NUTRITION_TEMPLATE_URL);
    setCopiedTemplateUrl(true);
    setTimeout(() => setCopiedTemplateUrl(false), 2000);
  };

  const isConnectedWebhook = Boolean(
    connection && connection.spreadsheetUrl && connection.spreadsheetUrl.includes("script.google.com")
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {connection && connection.status === "CONNECTED" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🟢 Connected {isConnectedWebhook ? "(Apps Script Webhook)" : "(Direct Drive)"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              <AlertCircle className="w-3.5 h-3.5" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      {connection && !isEditing ? (
        /* Connected State Management Card */
        <div className="space-y-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{connection.sheetTitle || "Nutrition Coach Personal Workbook"}</span>
                  {connection.spreadsheetUrl && !isConnectedWebhook && (
                    <a
                      href={connection.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-xs"
                      title="Open in Google Sheets"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-400 font-medium">
                    {isConnectedWebhook ? "Webhook URL:" : "Spreadsheet ID:"}
                  </span>
                  <code className="text-emerald-400 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-xs">
                    {connection.spreadsheetId}
                  </code>
                  {isConnectedWebhook && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 font-semibold">
                      Option 1 Active (100% Free)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-xs text-slate-400 block">
                  Last Sync:{" "}
                  <strong className="text-slate-200">
                    {connection.lastSyncedAt
                      ? new Date(connection.lastSyncedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })
                      : "Never"}
                  </strong>
                </span>
                <span className="text-xs text-slate-400 block">
                  Status:{" "}
                  {connection.syncStatus === "FAILED" ? (
                    <strong className="text-rose-400 font-semibold">🔴 Sync Failed</strong>
                  ) : connection.syncStatus === "SYNCING" ? (
                    <strong className="text-amber-400 font-semibold">Syncing...</strong>
                  ) : (
                    <strong className="text-emerald-400 font-semibold">Successfully synchronized</strong>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: [ Sync Now ] [ Change Connection ] [ Disconnect ] */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Change Connection
            </button>

            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-xs font-semibold rounded-xl border border-slate-700 hover:border-rose-800/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        /* Setup / Connect Form */
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Google Sheets Master Workbook</h4>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold">
                  14 Sheets Connected
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Connect your personal copy using Option 1 (Google Apps Script Webhook — 100% Free with zero Google Cloud setup).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTemplateClick}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                Copy Template
              </button>
              <button
                type="button"
                onClick={() => setShowScriptModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Code2 className="w-3.5 h-3.5" />
                View Apps Script
              </button>
            </div>
          </div>

          {/* HOW TO CONNECT: Option 1 (Zero-Cloud Setup Guide) */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                OPTION 1: ZERO-CLOUD APPS SCRIPT SETUP (2 MINUTES)
              </h4>
            </div>
            <ol className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-400 w-4 flex-shrink-0">1.</span>
                <span>
                  Click <strong>&quot;Copy Template&quot;</strong> and save your copy: <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">File → Make a copy</code>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-400 w-4 flex-shrink-0">2.</span>
                <span>
                  In your Google Sheet, click <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">Extensions → Apps Script</code>, paste the script with{" "}
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="text-emerald-400 underline font-semibold cursor-pointer hover:text-emerald-300"
                  >
                    {copiedScript ? "Copied!" : "[Copy Code]"}
                  </button>
                  , and save.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-400 w-4 flex-shrink-0">3.</span>
                <span>
                  Click <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">Deploy → New deployment → Web app</code> (Execute as: <em>Me</em>, Who has access: <em>Anyone</em>).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-400 w-4 flex-shrink-0">4.</span>
                <span>Copy your Webhook URL and paste it below.</span>
              </li>
            </ol>
          </div>

          {/* Paste URL Input & Connect Button */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Your Apps Script Webhook URL (or Google Spreadsheet URL)
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec (or https://docs.google.com/spreadsheets/d/...)"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                disabled={saving}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Connect &amp; Activate Sync
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Apps Script Code Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Google Apps Script Webhook Code</h3>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste this into <strong>Extensions → Apps Script</strong> in your copied Google Sheet. It enables 100% free multi-sheet automatic synchronization without any Google Cloud Console setup.
            </p>

            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto max-h-64 select-all">
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
              <button
                type="button"
                onClick={handleCopyScriptCode}
                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Disconnect Spreadsheet?</h3>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>Your Nutri-Track data will remain safely stored in Nutri-Track.</p>
              <p className="font-semibold text-slate-200">Your Google Spreadsheet will NOT be deleted.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnectConfirm}
                disabled={saving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Template Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">How to Connect Your Spreadsheet</h3>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Make a Copy in Google Sheets</strong>
                  <span>
                    In Google Sheets, click <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">File → Make a copy</code>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Open Apps Script</strong>
                  <span>Click <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">Extensions → Apps Script</code> and paste the webhook code.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Deploy as Web App</strong>
                  <span>Click <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">Deploy → New deployment → Web app</code> (Access: <em>Anyone</em>).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  4
                </div>
                <div>
                  <strong className="text-white block mb-0.5">Paste Webhook URL &amp; Connect</strong>
                  <span>Paste the resulting Webhook URL into Nutri-Track.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopyLinkToClipboard}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedTemplateUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTemplateUrl ? "Link Copied!" : "Copy Template URL"}
              </button>

              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
