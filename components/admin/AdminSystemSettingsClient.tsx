"use client";

import React, { useState } from "react";
import { SystemSettingItem } from "@/lib/services/admin/system-settings.service";
import {
  Bot,
  Key,
  Share2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Zap,
  Sliders,
  Database,
  Radio,
  Trash2,
} from "lucide-react";

interface AdminSystemSettingsClientProps {
  initialSettings: SystemSettingItem[];
}

export function AdminSystemSettingsClient({ initialSettings }: AdminSystemSettingsClientProps) {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of initialSettings) {
      map[s.key] = s.value;
    }
    return map;
  });

  const [activeTab, setActiveTab] = useState<"AI" | "INTEGRATIONS" | "SECURITY">("AI");
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // AI Testing State
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message: string;
    model?: string;
  } | null>(null);

  // Food Database Wipe State
  const [isWipingFoodDb, setIsWipingFoodDb] = useState(false);
  const [wipeFoodSuccess, setWipeFoodSuccess] = useState<string | null>(null);

  const handleWipeFoodDatabase = async () => {
    if (!window.confirm("⚠️ ARE YOU SURE? This will permanently delete ALL food database items, custom recipes, meal entries, and meal logs across ALL users and admin accounts.")) {
      return;
    }
    try {
      setIsWipingFoodDb(true);
      setWipeFoodSuccess(null);
      const res = await fetch("/api/admin/clear-food-database", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to wipe food database");
      setWipeFoodSuccess(data.message || "Food database wiped successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to wipe database");
    } finally {
      setIsWipingFoodDb(false);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSaveSuccess("System settings and API keys updated successfully! Cache flushed.");
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async () => {
    setIsTestingAI(true);
    setAiTestResult(null);

    try {
      const res = await fetch("/api/admin/settings/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.OPENAI_API_KEY,
          model: settings.AI_MODEL,
          baseUrl: settings.AI_BASE_URL,
          fallbackKey1: settings.OPENAI_API_KEY_FALLBACK_1,
          fallbackKey2: settings.OPENAI_API_KEY_FALLBACK_2,
        }),
      });

      const result = await res.json();
      setAiTestResult(result);
    } catch (err: any) {
      setAiTestResult({
        success: false,
        message: err.message || "Network test request failed",
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-950/40 via-background-surface to-background-surface border border-brand-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Dynamic Admin Controls
            </span>
          </div>
          <h1 className="text-2xl font-black text-foreground-primary tracking-tight">
            System Settings & API Keys
          </h1>
          <p className="text-xs text-foreground-secondary mt-1">
            Manage OpenAI keys, failover keys, model parameters, and external integration credentials dynamically without restarting servers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 active:scale-95 text-background-base font-bold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{saveError}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-background-surface border border-border-subtle overflow-x-auto">
        <button
          onClick={() => setActiveTab("AI")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "AI"
              ? "bg-brand-500 text-background-base shadow-md shadow-brand-500/20"
              : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Coach & Model Config</span>
        </button>

        <button
          onClick={() => setActiveTab("INTEGRATIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "INTEGRATIONS"
              ? "bg-brand-500 text-background-base shadow-md shadow-brand-500/20"
              : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>External Integrations & OAuth</span>
        </button>

        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SECURITY"
              ? "bg-brand-500 text-background-base shadow-md shadow-brand-500/20"
              : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-elevated"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Platform & Security</span>
        </button>
      </div>

      {/* TAB CONTENT: AI COACH & MODEL CONFIG */}
      {activeTab === "AI" && (
        <div className="space-y-6">
          {/* OpenAI Live Testing Card */}
          <div className="p-5 rounded-2xl bg-background-surface border border-border-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground-primary flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Live API Connection Test
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Sends a real latency verification ping to the OpenAI API endpoint using the active credentials.
                </p>
              </div>

              <button
                onClick={handleTestAI}
                disabled={isTestingAI}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background-elevated hover:bg-brand-500/20 hover:border-brand-500/40 text-foreground-primary text-xs font-bold border border-border-subtle transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingAI ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                ) : (
                  <Radio className="w-3.5 h-3.5 text-brand-400" />
                )}
                <span>{isTestingAI ? "Pinging OpenAI..." : "Test Connection & Ping API"}</span>
              </button>
            </div>

            {aiTestResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
                  aiTestResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {aiTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="font-medium">{aiTestResult.message}</span>
                </div>
                {aiTestResult.latencyMs !== undefined && (
                  <span className="px-2 py-0.5 rounded-md bg-background-surface font-mono font-bold text-[11px] border border-border-subtle">
                    {aiTestResult.latencyMs} ms
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Top 3 OpenAI ChatGPT Models Recommendation */}
          <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2">
                  <Bot className="w-4 h-4 text-brand-400" />
                  Top 3 OpenAI ChatGPT Models for Nutri-Track
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Choose from OpenAI&apos;s fastest, flagship, or next-generation GPT-5.x reasoning engines.
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">
                1-Click Model Switch
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Option 1: GPT-4o-mini */}
              <div
                onClick={() => handleInputChange("AI_MODEL", "gpt-4o-mini")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  (settings.AI_MODEL || "gpt-4o-mini") === "gpt-4o-mini"
                    ? "bg-brand-500/10 border-brand-500 shadow-md shadow-brand-500/10"
                    : "bg-background-elevated border-border-subtle hover:border-border-default"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground-primary">1. GPT-4o-mini</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      ⚡ Ultra Fast
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Best for real-time daily chat, instant Indian dish ingredient extraction, and fast macro calculations.
                  </p>
                </div>
                <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-foreground-muted">
                  <span>Latency: ~350ms</span>
                  <span className="font-bold text-brand-400">Default & Economical</span>
                </div>
              </div>

              {/* Option 2: GPT-4o */}
              <div
                onClick={() => handleInputChange("AI_MODEL", "gpt-4o")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  settings.AI_MODEL === "gpt-4o"
                    ? "bg-brand-500/10 border-brand-500 shadow-md shadow-brand-500/10"
                    : "bg-background-elevated border-border-subtle hover:border-border-default"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground-primary">2. GPT-4o Flagship</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      🌟 Omni Intelligence
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Balanced flagship model for interactive health coaching, adaptive goal suggestions, and recipe generation.
                  </p>
                </div>
                <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-foreground-muted">
                  <span>Latency: ~800ms</span>
                  <span className="font-bold text-purple-400">High Versatility</span>
                </div>
              </div>

              {/* Option 3: GPT-5.x / Next-Gen Reasoning */}
              <div
                onClick={() => handleInputChange("AI_MODEL", "gpt-5-preview")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  settings.AI_MODEL === "gpt-5-preview" || settings.AI_MODEL === "gpt-5" || settings.AI_MODEL === "o3-mini" || settings.AI_MODEL === "o1"
                    ? "bg-brand-500/10 border-brand-500 shadow-md shadow-brand-500/10"
                    : "bg-background-elevated border-border-subtle hover:border-border-default"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground-primary">3. GPT-5.x / o3 Reasoning</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      🧠 Peak Reasoning
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-secondary">
                    Next-generation STEM reasoning for multi-week athletic periodization, metabolic diagnostics, and complex health plans.
                  </p>
                </div>
                <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-foreground-muted">
                  <span>Next-Gen Model</span>
                  <span className="font-bold text-amber-400">Maximum Intelligence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Parameters & Endpoints */}
          <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand-400" />
              Model Parameters & Endpoints
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground-secondary">
                  Primary AI Model
                </label>
                <select
                  value={settings.AI_MODEL || "gpt-4o-mini"}
                  onChange={(e) => handleInputChange("AI_MODEL", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Recommended - Ultra Fast & Cost Efficient)</option>
                  <option value="gpt-4o">gpt-4o (Omni Flagship Intelligence)</option>
                  <option value="gpt-5-preview">gpt-5-preview / gpt-5 (Next-Gen GPT-5 Intelligence)</option>
                  <option value="o3-mini">o3-mini (Next-Gen High-Speed Reasoning)</option>
                  <option value="o1">o1 (Deep Scientific Reasoning)</option>
                  <option value="gpt-4-turbo">gpt-4-turbo (Legacy)</option>
                </select>
                <p className="text-[11px] text-foreground-muted">
                  Used for daily meal advice, macro breakdowns, and contextual chat responses.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground-secondary">
                  AI Reasoning Model
                </label>
                <select
                  value={settings.AI_REASONING_MODEL || "gpt-4o"}
                  onChange={(e) => handleInputChange("AI_REASONING_MODEL", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="gpt-5-preview">gpt-5-preview (Next-Gen GPT-5 Reasoning)</option>
                  <option value="o3-mini">o3-mini (Next-Gen Fast Reasoning)</option>
                  <option value="gpt-4o">gpt-4o (Recommended for Weekly Blueprints)</option>
                  <option value="o1">o1 (Full Reasoning)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </select>
                <p className="text-[11px] text-foreground-muted">
                  Used for synthesizing 7-day training schedules and complex nutritional retrospectives.
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-foreground-secondary">
                  Custom AI Base URL
                </label>
                <input
                  type="text"
                  value={settings.AI_BASE_URL || ""}
                  onChange={(e) => handleInputChange("AI_BASE_URL", e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
                <p className="text-[11px] text-foreground-muted">
                  Standard OpenAI API endpoint or custom enterprise proxy/gateway.
                </p>
              </div>
            </div>
          </div>

          {/* OpenAI API Key Inputs with 90% Limit Threshold Indicator */}
          <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-400" />
                  OpenAI API Keys & Automated 3-Key Failover
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Automatic failover rotates to Standby keys when Tier 1 encounters 429 limits or exceeds 90% capacity.
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold self-start">
                🛡️ &gt;90% Preemptive Failover Active
              </span>
            </div>

            <div className="space-y-4">
              {/* Primary Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground-secondary">
                    Primary OpenAI API Key (Tier 1)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Primary Active
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={visibleSecrets.OPENAI_API_KEY ? "text" : "password"}
                    value={settings.OPENAI_API_KEY || ""}
                    onChange={(e) => handleInputChange("OPENAI_API_KEY", e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("OPENAI_API_KEY")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary"
                  >
                    {visibleSecrets.OPENAI_API_KEY ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  The primary key used for all general AI requests.
                </p>
              </div>

              {/* Fallback Key 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground-secondary">
                    Failover OpenAI API Key #1 (Tier 2 Standby)
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Auto-Failover
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={visibleSecrets.OPENAI_API_KEY_FALLBACK_1 ? "text" : "password"}
                    value={settings.OPENAI_API_KEY_FALLBACK_1 || ""}
                    onChange={(e) => handleInputChange("OPENAI_API_KEY_FALLBACK_1", e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("OPENAI_API_KEY_FALLBACK_1")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary"
                  >
                    {visibleSecrets.OPENAI_API_KEY_FALLBACK_1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Automatically activated if Primary Key encounters rate limits (HTTP 429) or quota limits.
                </p>
              </div>

              {/* Fallback Key 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground-secondary">
                    Failover OpenAI API Key #2 (Tier 3 Standby)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-bold px-2 py-0.5 rounded bg-zinc-500/10 border border-zinc-500/20">
                    Backup
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={visibleSecrets.OPENAI_API_KEY_FALLBACK_2 ? "text" : "password"}
                    value={settings.OPENAI_API_KEY_FALLBACK_2 || ""}
                    onChange={(e) => handleInputChange("OPENAI_API_KEY_FALLBACK_2", e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("OPENAI_API_KEY_FALLBACK_2")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary"
                  >
                    {visibleSecrets.OPENAI_API_KEY_FALLBACK_2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* General AI Rules & Coaching Principles (Admin Configurable) */}
          <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  General AI Rules & Coaching Principles (System-Wide)
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Define baseline principles (e.g. Ayurveda-first priority, scientific modern nutrition synergy, empathy, exact macros, and hydration). Injected automatically into the AI system prompt.
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold self-start">
                🌿 Ayurveda + Modern Science Active
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground-secondary">
                System General AI Rules Prompt Directive
              </label>
              <textarea
                rows={6}
                value={settings.GENERAL_AI_RULES !== undefined ? settings.GENERAL_AI_RULES : `1. Ayurveda-First Priority: Always prioritize authentic Ayurvedic principles first (Ahara Rasas/6 tastes, Agni/digestive fire, Dosha balance: Vata/Pitta/Kapha, Viruddha Ahara/incompatible foods, and seasonal eating/Ritucharya), followed immediately by modern evidence-based sports & nutritional science.
2. Empathy & Motivation: Communicate with genuine human warmth, uplifting encouragement, and lively emojis (🥗, 🍗, 🏃‍♂️, ✨, 💪).
3. Exact Nutritional Data: Always calculate and output specific calories, protein (g), carbs (g), fats (g), key minerals (Iron, Calcium, Potassium, Magnesium, Zinc), and vitamins with every meal recommendation or recipe log.
4. Holistic Recovery & Hydration: Integrate hydration balance, electrolyte replenishment, and active recovery routines.`}
                onChange={(e) => handleInputChange("GENERAL_AI_RULES", e.target.value)}
                placeholder="Enter general AI rules directives..."
                className="w-full p-3.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono leading-relaxed"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  🌿 1. Ayurveda Priority
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                  🔬 2. Modern Science Synergy
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  💖 3. Warm Empathy
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  📊 4. Full Micronutrients
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INTEGRATIONS & OAUTH */}
      {activeTab === "INTEGRATIONS" && (
        <div className="space-y-6">
          {/* Strava Integration */}
          <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                S
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground-primary">
                  Strava API Application Credentials
                </h2>
                <p className="text-xs text-foreground-muted">
                  Used for authenticating runner activities, GPS routes, and split pace metrics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground-secondary">
                  Strava Client ID
                </label>
                <input
                  type="text"
                  value={settings.STRAVA_CLIENT_ID || ""}
                  onChange={(e) => handleInputChange("STRAVA_CLIENT_ID", e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground-secondary">
                  Strava Client Secret
                </label>
                <div className="relative">
                  <input
                    type={visibleSecrets.STRAVA_CLIENT_SECRET ? "text" : "password"}
                    value={settings.STRAVA_CLIENT_SECRET || ""}
                    onChange={(e) => handleInputChange("STRAVA_CLIENT_SECRET", e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("STRAVA_CLIENT_SECRET")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary"
                  >
                    {visibleSecrets.STRAVA_CLIENT_SECRET ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Google Cloud & Sheets */}
          <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                G
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground-primary">
                  Google Cloud Console & Sheets Integration
                </h2>
                <p className="text-xs text-foreground-muted">
                  Used for Google Sign-In and automated dual-sync nutrition spreadsheets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground-secondary">
                  Google Client ID
                </label>
                <input
                  type="text"
                  value={settings.GOOGLE_CLIENT_ID || ""}
                  onChange={(e) => handleInputChange("GOOGLE_CLIENT_ID", e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground-secondary">
                  Google Client Secret
                </label>
                <div className="relative">
                  <input
                    type={visibleSecrets.GOOGLE_CLIENT_SECRET ? "text" : "password"}
                    value={settings.GOOGLE_CLIENT_SECRET || ""}
                    onChange={(e) => handleInputChange("GOOGLE_CLIENT_SECRET", e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("GOOGLE_CLIENT_SECRET")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-primary"
                  >
                    {visibleSecrets.GOOGLE_CLIENT_SECRET ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-foreground-secondary">
                  Master Google Sheets Template Link
                </label>
                <input
                  type="text"
                  value={settings.NEXT_PUBLIC_GOOGLE_SHEETS_TEMPLATE_URL || ""}
                  onChange={(e) =>
                    handleInputChange("NEXT_PUBLIC_GOOGLE_SHEETS_TEMPLATE_URL", e.target.value)
                  }
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PLATFORM & SECURITY */}
      {activeTab === "SECURITY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              Registration & Security Policies
            </h2>

            <div className="space-y-5">
              {/* Auto Approve Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated border border-border-subtle">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground-primary">
                    Automatic Registration Approval
                  </div>
                  <div className="text-[11px] text-foreground-muted max-w-xl">
                    When enabled, new users are immediately given APPROVED status upon signing up. When disabled, users remain in PENDING_APPROVAL until an Admin approves them.
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.REGISTRATION_AUTO_APPROVE === "true"}
                    onChange={(e) =>
                      handleInputChange("REGISTRATION_AUTO_APPROVE", e.target.checked ? "true" : "false")
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>

              {/* System Announcement Banner */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground-secondary">
                  System-Wide Announcement Banner
                </label>
                <input
                  type="text"
                  value={settings.SYSTEM_ANNOUNCEMENT || ""}
                  onChange={(e) => handleInputChange("SYSTEM_ANNOUNCEMENT", e.target.value)}
                  placeholder="e.g. Welcome to Nutri-Track 2.0! New features are live."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-elevated border border-border-subtle text-foreground-primary text-xs focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-foreground-muted">
                  Broadcasts a persistent notification banner at the top of every user dashboard. Leave blank to disable.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone: Food Database & Meal Log Reset */}
          <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-400" />
              Food Database & Meal Log Reset (All IDs & Admin)
            </h2>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Wipes all items from the Food Database, custom recipes, meal logs, and meal entries across all users and admin accounts to start with a 100% clean slate. User accounts and login credentials will remain intact.
            </p>

            {wipeFoodSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {wipeFoodSuccess}
              </div>
            )}

            <button
              type="button"
              onClick={handleWipeFoodDatabase}
              disabled={isWipingFoodDb}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isWipingFoodDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isWipingFoodDb ? "Wiping Database in Production..." : "Wipe Entire Food Database & Meals (All Users & Admin)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
