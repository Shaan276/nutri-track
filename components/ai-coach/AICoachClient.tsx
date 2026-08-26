"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  RefreshCw,
  Zap,
  Activity,
  AlertCircle,
  Brain,
  Calendar,
  Mic,
  MicOff,
  Camera,
  ChevronLeft,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  FileText,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Sliders,
  History,
  Edit3,
  Plus,
  Trash2,
  Droplet,
  Flame,
  Dna,
  Wheat,
} from "lucide-react";
import { AIMemoryModal } from "./AIMemoryModal";
import { WeeklyPlanModal } from "./WeeklyPlanModal";
import { FoodScannerModal } from "./FoodScannerModal";

export interface AICoachClientProps {
  isAdmin?: boolean;
}

export function AICoachComingSoon() {
  const [hasRequested, setHasRequested] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-black uppercase tracking-wider shadow-sm">
          <Sparkles className="h-4 w-4 text-brand-400 animate-pulse" />
          <span>Private Preview &bull; Coming Soon</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-foreground-primary tracking-tight leading-tight">
          AI Health Coach &amp; Integrator
        </h1>

        <p className="text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
          We&apos;re crafting a groundbreaking, zero-subscription AI health coaching experience. Connect your personal ChatGPT with Nutri-Track&apos;s biometric intelligence engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-background-surface border border-border-default hover:border-brand-500/30 transition-all rounded-3xl p-6 shadow-surface-card space-y-3 group">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-foreground-primary">1. ChatGPT Coach (Ask Mode)</h3>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Personalized daily nutrition, running advice, workout planning, and empathetic motivation in your private ChatGPT with zero subscription cost.
          </p>
        </div>

        <div className="bg-background-surface border border-border-default hover:border-emerald-500/30 transition-all rounded-3xl p-6 shadow-surface-card space-y-3 group">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-foreground-primary">2. Fast Logging (Log Mode)</h3>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Instantly deconstruct meals, hydration, and workouts into exact macros and micronutrients with 1-click confirmation.
          </p>
        </div>

        <div className="bg-background-surface border border-border-default hover:border-blue-500/30 transition-all rounded-3xl p-6 shadow-surface-card space-y-3 group">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-foreground-primary">3. Automatic Action Sync</h3>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Structured goals and nutrition adjustments proposed by your coach are automatically detected and safely applied.
          </p>
        </div>
      </div>

      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          <span>Admin &amp; Beta Preview Only</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
          The AI Health Coach is currently active for administrators and internal beta testers during final evaluation. Want early access when it unlocks for all members?
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {hasRequested ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
              <CheckCircle2 className="h-4 w-4" />
              <span>You&apos;re on the Early Access VIP list! We&apos;ll notify you.</span>
            </div>
          ) : (
            <button
              onClick={() => setHasRequested(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-extrabold text-xs transition-all shadow-brand-glow flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Notify Me for Early Access
            </button>
          )}

          <Link
            href="/app"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-background-elevated hover:bg-background-surface border border-border-subtle text-foreground-secondary hover:text-foreground-primary font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AICoachClient({ isAdmin: propIsAdmin }: AICoachClientProps = {}) {
  const { data: session, status } = useSession();
  const isAdmin = propIsAdmin ?? ((session?.user as any)?.role === "ADMIN");
  const searchParams = useSearchParams();

  // TWO AI MODES: "ask" (ChatGPT Coach) vs "log" (Nutri-Track AI Integrator)
  const [activeMode, setActiveMode] = useState<"ask" | "log">("ask");

  // Mode A (Ask / Discuss) State
  const [askInput, setAskInput] = useState("");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<string>("NOT_STARTED");

  // Automatic Action Handoff State
  const [detectedAction, setDetectedAction] = useState<any | null>(null);
  const [actionInputText, setActionInputText] = useState("");
  const [isParsingAction, setIsParsingAction] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<any[]>([]);

  // Mode B (Log Something) State
  const [logInput, setLogInput] = useState("");
  const [isParsingLog, setIsParsingLog] = useState(false);
  const [isExecutingLog, setIsExecutingLog] = useState(false);
  const [logPreview, setLogPreview] = useState<any | null>(null);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);
  const [logErrorMessage, setLogErrorMessage] = useState<string | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Modals & Drawers
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);
  const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);

  // Quick Prompt Pool for Log Mode
  const QUICK_LOG_PROMPTS = [
    "I ate 4 rotis, 100g paneer bhurji, and drank 500ml water",
    "Log 500ml of water",
    "My weight is 56 kg",
    "I ran 5 km in 28 minutes",
    "I completed my workout: 3 sets bench press, 3 sets pullups",
  ];

  // Quick Prompt Pool for Ask Mode
  const QUICK_ASK_PROMPTS = [
    "What should I eat after running?",
    "Why am I feeling tired today?",
    "Can I eat soya chunks every day?",
    "Help me plan tomorrow's high-protein meals",
    "How can I improve my 5K running pace?",
  ];

  // Initialize Voice Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript && transcript.trim()) {
            if (activeMode === "ask") {
              setAskInput(transcript.trim());
            } else {
              setLogInput(transcript.trim());
              handleParseLog(transcript.trim());
            }
          }
          setIsRecording(false);
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, [activeMode]);

  // Check URL params for action handoff or initial assessment
  useEffect(() => {
    if (isAdmin) {
      loadActionHistory();
      checkAssessmentStatus();

      const actionParam = searchParams.get("action");
      if (actionParam) {
        try {
          const decoded = decodeURIComponent(actionParam);
          handleParseAction(decoded);
        } catch {}
      }
    }
  }, [isAdmin, searchParams]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Speech recognition start failed:", err);
      }
    }
  };

  const loadActionHistory = async () => {
    try {
      const res = await fetch("/api/ai/actions/history");
      const data = await res.json();
      if (data.success && data.history) {
        setActionHistory(data.history);
      }
    } catch {}
  };

  const checkAssessmentStatus = async () => {
    try {
      const res = await fetch("/api/ai/assessment/status");
      const data = await res.json();
      if (data.success && data.status) {
        setAssessmentStatus(data.status);
      }
    } catch {}
  };

  const handleCopy = async (type: "instructions" | "assessment" | "context") => {
    try {
      let endpoint = "/api/ai/chatgpt/instructions";
      if (type === "assessment") endpoint = "/api/ai/chatgpt/assessment-prompt";
      if (type === "context") endpoint = "/api/ai/chatgpt/context";

      const res = await fetch(endpoint);
      const data = await res.json();
      const content = data.instructions || data.prompt || data.context || "";

      if (content) {
        await navigator.clipboard.writeText(content);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 3000);
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Automatic / Fast Action Bridge Parsing
  const handleParseAction = async (rawString?: string) => {
    const textToParse = rawString || actionInputText;
    if (!textToParse.trim()) return;

    setIsParsingAction(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/actions/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawAction: textToParse }),
      });
      const data = await res.json();

      if (data.success && data.validation) {
        setDetectedAction(data.validation);
      } else {
        setActionErrorMessage(data.error || "No valid structured action detected.");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to parse action.");
    } finally {
      setIsParsingAction(false);
    }
  };

  // Safe Execution of Bounded Action with Partial Updates
  const handleExecuteAction = async () => {
    if (!detectedAction || !detectedAction.parsedAction) return;

    setIsExecutingAction(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: detectedAction.parsedAction,
          confirmed: true,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setActionSuccessMessage(data.message || "Action successfully applied to your database!");
        setDetectedAction(null);
        setActionInputText("");
        setIsEditingAction(false);
        loadActionHistory();
        checkAssessmentStatus();
      } else {
        setActionErrorMessage(data.error || "Action execution failed.");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Execution exception occurred.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleSyncClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setActionInputText(text.trim());
        handleParseAction(text.trim());
      } else {
        setActionErrorMessage("Clipboard is empty. Copy the action block from ChatGPT first.");
      }
    } catch {
      setActionErrorMessage("Clipboard access was blocked. Please paste into the box.");
    }
  };

  // Log Mode: Fast Deconstruction & Macro/Micronutrient Calculation
  const handleParseLog = async (presetText?: string) => {
    const text = presetText || logInput;
    if (!text.trim()) return;

    setIsParsingLog(true);
    setLogErrorMessage(null);
    setLogSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/quick-log/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setLogPreview(data.data);
      } else {
        setLogErrorMessage(data.error || "Could not parse entry.");
      }
    } catch (err: any) {
      setLogErrorMessage(err.message || "Failed to process log entry.");
    } finally {
      setIsParsingLog(false);
    }
  };

  // Confirm Log and Apply to DB
  const handleConfirmLog = async () => {
    if (!logPreview) return;

    setIsExecutingLog(true);
    setLogErrorMessage(null);
    setLogSuccessMessage(null);

    try {
      let actionPayload: any = null;

      if (logPreview.meal?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_MEAL",
          data: {
            name: logPreview.meal.name,
            mealType: logPreview.meal.mealType || "SNACK",
            calories: logPreview.meal.totals?.calories || 0,
            protein: logPreview.meal.totals?.protein || 0,
            carbohydrates: logPreview.meal.totals?.carbohydrates || 0,
            fat: logPreview.meal.totals?.fat || 0,
            fiber: logPreview.meal.totals?.fiber || 0,
          },
        };
      } else if (logPreview.hydration?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_HYDRATION",
          data: {
            amountMl: logPreview.hydration.amountMl,
            beverageType: logPreview.hydration.beverageType || "WATER",
          },
        };
      } else if (logPreview.weight?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_WEIGHT",
          data: {
            weightKg: logPreview.weight.weightKg,
          },
        };
      } else if (logPreview.activity?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_ACTIVITY",
          data: {
            type: logPreview.activity.type || "RUNNING",
            durationMinutes: logPreview.activity.durationMinutes || 30,
            distanceKm: logPreview.activity.distanceKm || 0,
            caloriesBurned: logPreview.activity.caloriesBurned || 0,
          },
        };
      } else if (logPreview.targets?.detected) {
        actionPayload = {
          version: 1,
          action: "UPDATE_GOALS",
          data: {
            ...(logPreview.targets.caloriesKcal && { caloriesKcal: logPreview.targets.caloriesKcal }),
            ...(logPreview.targets.proteinG && { proteinG: logPreview.targets.proteinG }),
            ...(logPreview.targets.carbsG && { carbsG: logPreview.targets.carbsG }),
            ...(logPreview.targets.fatG && { fatG: logPreview.targets.fatG }),
          },
        };
      }

      if (!actionPayload) {
        throw new Error("No actionable log detected.");
      }

      // Execute via safe action bridge
      const res = await fetch("/api/ai/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionPayload, confirmed: true }),
      });
      const data = await res.json();

      if (data.success) {
        // Also log hydration if meal and water were combined in one input!
        if (logPreview.meal?.detected && logPreview.hydration?.detected && logPreview.hydration.amountMl > 0) {
          await fetch("/api/ai/actions/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: {
                version: 1,
                action: "LOG_HYDRATION",
                data: {
                  amountMl: logPreview.hydration.amountMl,
                  beverageType: logPreview.hydration.beverageType || "WATER",
                },
              },
              confirmed: true,
            }),
          });
        }

        setLogSuccessMessage(data.message || "Entry successfully logged to your tracker!");
        setLogPreview(null);
        setLogInput("");
        loadActionHistory();
      } else {
        setLogErrorMessage(data.error || "Failed to log entry.");
      }
    } catch (err: any) {
      setLogErrorMessage(err.message || "Error logging entry.");
    } finally {
      setIsExecutingLog(false);
    }
  };

  if (status === "loading" && propIsAdmin === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-neutral-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs">Loading AI Coach & Biometrics...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return <AICoachComingSoon />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-left">
      {/* Admin Early Preview Badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-400">Admin Mode Active:</strong> You are testing the Simplified Two-Mode AI Coach. Standard users see the Coming Soon preview.
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-black uppercase">
          Admin
        </span>
      </div>

      {/* Clean Mode Switcher */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-foreground-primary tracking-tight">
              AI Coach
            </h1>
            <p className="text-xs text-foreground-secondary">
              What would you like to do? Switch anytime between long-form coaching and fast logging.
            </p>
          </div>

          {/* Primary Two-Mode Switcher Controls */}
          <div className="inline-flex p-1.5 bg-background-elevated rounded-2xl border border-border-subtle shrink-0">
            <button
              onClick={() => {
                setActiveMode("ask");
                setActionSuccessMessage(null);
                setLogSuccessMessage(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeMode === "ask"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary opacity-70 hover:opacity-100"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>💬 Ask / Discuss</span>
            </button>

            <button
              onClick={() => {
                setActiveMode("log");
                setActionSuccessMessage(null);
                setLogSuccessMessage(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeMode === "log"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary opacity-70 hover:opacity-100"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>📝 Log Something</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: 💬 ASK / DISCUSS (ChatGPT Coach Active, Integrator Inactive)     */}
      {/* ========================================================================= */}
      {activeMode === "ask" && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Mode Status Card */}
          <div className="bg-background-surface border border-brand-500/30 rounded-3xl p-6 shadow-surface-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground-primary">
                    ChatGPT Health Coach
                  </h2>
                  <p className="text-xs text-foreground-muted">
                    Active &bull; Nutrition planning, running advice, workout strategy &amp; lifestyle
                  </p>
                </div>
              </div>

              {/* 1-Click Launch & Context Tools */}
              <div className="flex items-center gap-2">
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-neutral-950 text-xs font-extrabold transition-all shadow-brand-glow flex items-center gap-1.5"
                >
                  Open in ChatGPT <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleCopy("context")}
                  className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-background-surface border border-border-subtle text-xs font-bold text-foreground-secondary hover:text-foreground-primary transition-colors flex items-center gap-1.5"
                >
                  {copiedType === "context" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Health Context
                </button>
              </div>
            </div>

            {/* Assessment Helper Banner if Not Completed */}
            {assessmentStatus !== "COMPLETED" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-400">Initial Assessment Ready</span>
                  <p className="text-amber-300/80">
                    Conduct your 7-part intake with your coach to establish personalized calorie and macro targets.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy("assessment")}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  {copiedType === "assessment" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Assessment Prompt
                </button>
              </div>
            )}

            {/* 🟢 AUTOMATIC ACTION HANDOFF BAR / DETECTOR */}
            <div className="p-5 rounded-2xl bg-background-elevated/70 border border-border-default space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold text-foreground-primary uppercase tracking-wider">
                    Automatic Action Handoff
                  </span>
                </div>
                <button
                  onClick={handleSyncClipboard}
                  className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Sync from Clipboard
                </button>
              </div>

              {/* Action Ready Card */}
              {detectedAction && detectedAction.isValid ? (
                <div className="p-4 rounded-2xl bg-background-surface border border-emerald-500/40 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-xs font-black">
                        🟢 Action Ready: {detectedAction.actionType}
                      </span>
                    </div>
                    {detectedAction.reason && (
                      <span className="text-xs text-foreground-muted italic">
                        &quot;{detectedAction.reason}&quot;
                      </span>
                    )}
                  </div>

                  {/* Visual Diffs */}
                  <div className="space-y-1.5">
                    {detectedAction.diffs?.map((diff: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-background-elevated text-xs font-mono"
                      >
                        <span className="text-foreground-secondary font-sans font-bold">{diff.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground-muted line-through">{diff.previousValue}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-brand-400" />
                          <span className="font-extrabold text-brand-400">{diff.proposedValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions: Apply / Edit / Cancel */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      onClick={() => setDetectedAction(null)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-foreground-muted hover:text-foreground-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteAction}
                      disabled={isExecutingAction}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md"
                    >
                      {isExecutingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Apply Target Update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-foreground-secondary">
                    When your ChatGPT Coach proposes new targets (e.g. 140g protein) or logs, paste the structured block below or click &quot;Sync from Clipboard&quot; to apply it safely:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={actionInputText}
                      onChange={(e) => setActionInputText(e.target.value)}
                      placeholder='e.g. {"version": 1, "action": "UPDATE_GOALS", "data": {"proteinG": 140}}'
                      className="flex-1 bg-background-surface border border-border-subtle focus:border-brand-500/50 rounded-xl px-3.5 py-2 text-xs font-mono text-foreground-primary focus:outline-none"
                    />
                    <button
                      onClick={() => handleParseAction()}
                      disabled={isParsingAction || !actionInputText.trim()}
                      className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-neutral-950 text-xs font-extrabold transition-all disabled:opacity-50"
                    >
                      {isParsingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Inspect"}
                    </button>
                  </div>
                </div>
              )}

              {actionSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {actionErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{actionErrorMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Discussion Ideas */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground-muted">Suggested Coaching Questions:</span>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_ASK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAskInput(prompt);
                      navigator.clipboard.writeText(prompt);
                      setCopiedType(`prompt_${idx}`);
                      setTimeout(() => setCopiedType(null), 2000);
                    }}
                    className="px-3 py-1.5 rounded-full bg-background-elevated hover:bg-brand-500/15 border border-border-subtle hover:border-brand-500/30 text-xs text-foreground-secondary hover:text-brand-300 font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>{prompt}</span>
                    {copiedType === `prompt_${idx}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 opacity-50" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: 📝 LOG SOMETHING (Integrator Active, ChatGPT Coach Inactive)      */}
      {/* ========================================================================= */}
      {activeMode === "log" && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Mode Status Card */}
          <div className="bg-background-surface border border-emerald-500/30 rounded-3xl p-6 shadow-surface-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground-primary">
                    Nutri-Track AI Integrator
                  </h2>
                  <p className="text-xs text-foreground-muted">
                    Active &bull; Fast logging with macro &amp; micronutrient breakdown
                  </p>
                </div>
              </div>

              {/* Tool Drawers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFoodScannerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-brand-500/10 border border-border-subtle text-xs font-bold text-foreground-secondary hover:text-brand-400 transition-colors flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5 text-brand-400" />
                  Scan Food Photo
                </button>
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-blue-500/10 border border-border-subtle text-xs font-bold text-foreground-secondary hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Brain className="h-3.5 w-3.5 text-blue-400" />
                  Health Memories
                </button>
              </div>
            </div>

            {/* Quick Logging Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground-muted">Quick Log Examples:</span>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_LOG_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLogInput(prompt);
                      handleParseLog(prompt);
                    }}
                    className="px-3 py-1.5 rounded-full bg-background-elevated hover:bg-emerald-500/15 border border-border-subtle hover:border-emerald-500/30 text-xs text-foreground-secondary hover:text-emerald-300 font-medium transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Fast Input Box */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleParseLog();
                    }
                  }}
                  placeholder="e.g. 'I ate 4 rotis, 100g paneer bhurji, and drank 500ml water' or 'Ran 5km in 28 mins'..."
                  className="w-full bg-background-elevated border border-border-subtle focus:border-emerald-500/50 rounded-2xl pl-4 pr-24 py-3.5 text-xs text-foreground-primary focus:outline-none transition-colors"
                />

                <div className="absolute right-2 top-2 flex items-center gap-1.5">
                  <button
                    onClick={toggleVoiceRecording}
                    className={`p-2 rounded-xl transition-all ${
                      isRecording
                        ? "bg-rose-500 text-white animate-pulse"
                        : "hover:bg-background-surface text-foreground-muted hover:text-foreground-primary"
                    }`}
                    title={isRecording ? "Stop voice recording" : "Speak to log"}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleParseLog()}
                    disabled={isParsingLog || !logInput.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs transition-all disabled:opacity-50 shadow-md flex items-center gap-1.5"
                  >
                    {isParsingLog ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    Log
                  </button>
                </div>
              </div>
            </div>

            {/* Log Success Alert */}
            {logSuccessMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{logSuccessMessage}</span>
              </div>
            )}

            {/* Log Error Alert */}
            {logErrorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{logErrorMessage}</span>
              </div>
            )}

            {/* 📝 INTERACTIVE LOGGING PREVIEW CARD */}
            {logPreview && (
              <div className="p-5 rounded-2xl bg-background-elevated border border-emerald-500/30 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-extrabold text-foreground-primary uppercase tracking-wider">
                      Nutritional Extraction Preview
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-foreground-muted">
                    {logPreview.summary || "Parsed Entry"}
                  </span>
                </div>

                {/* Meal Items & Macros */}
                {logPreview.meal?.detected && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground-primary">
                        {logPreview.meal.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 text-[10px] font-extrabold uppercase">
                        {logPreview.meal.mealType || "MEAL"}
                      </span>
                    </div>

                    {/* Macro Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-background-surface border border-border-subtle">
                        <span className="text-[10px] text-foreground-muted uppercase font-bold block">Calories</span>
                        <span className="text-sm font-black text-amber-400">{logPreview.meal.totals?.calories || 0} kcal</span>
                      </div>
                      <div className="p-2 rounded-xl bg-background-surface border border-border-subtle">
                        <span className="text-[10px] text-foreground-muted uppercase font-bold block">Protein</span>
                        <span className="text-sm font-black text-emerald-400">{logPreview.meal.totals?.protein || 0} g</span>
                      </div>
                      <div className="p-2 rounded-xl bg-background-surface border border-border-subtle">
                        <span className="text-[10px] text-foreground-muted uppercase font-bold block">Carbs</span>
                        <span className="text-sm font-black text-blue-400">{logPreview.meal.totals?.carbohydrates || 0} g</span>
                      </div>
                      <div className="p-2 rounded-xl bg-background-surface border border-border-subtle">
                        <span className="text-[10px] text-foreground-muted uppercase font-bold block">Fat</span>
                        <span className="text-sm font-black text-purple-400">{logPreview.meal.totals?.fat || 0} g</span>
                      </div>
                      <div className="p-2 rounded-xl bg-background-surface border border-border-subtle">
                        <span className="text-[10px] text-foreground-muted uppercase font-bold block">Fiber</span>
                        <span className="text-sm font-black text-lime-400">{logPreview.meal.totals?.fiber || 0} g</span>
                      </div>
                    </div>

                    {/* Available Micronutrients */}
                    {logPreview.meal.micronutrients && Object.keys(logPreview.meal.micronutrients).length > 0 && (
                      <div className="p-3 rounded-xl bg-background-surface border border-border-subtle space-y-1.5">
                        <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block">
                          Micronutrient Density:
                        </span>
                        <div className="flex flex-wrap gap-2 text-[11px] text-foreground-secondary">
                          {logPreview.meal.micronutrients.iron > 0 && <span className="px-2 py-0.5 rounded-lg bg-background-elevated">Iron: {logPreview.meal.micronutrients.iron}mg</span>}
                          {logPreview.meal.micronutrients.calcium > 0 && <span className="px-2 py-0.5 rounded-lg bg-background-elevated">Calcium: {logPreview.meal.micronutrients.calcium}mg</span>}
                          {logPreview.meal.micronutrients.potassium > 0 && <span className="px-2 py-0.5 rounded-lg bg-background-elevated">Potassium: {logPreview.meal.micronutrients.potassium}mg</span>}
                          {logPreview.meal.micronutrients.magnesium > 0 && <span className="px-2 py-0.5 rounded-lg bg-background-elevated">Magnesium: {logPreview.meal.micronutrients.magnesium}mg</span>}
                          {logPreview.meal.micronutrients.vitaminC > 0 && <span className="px-2 py-0.5 rounded-lg bg-background-elevated">Vit C: {logPreview.meal.micronutrients.vitaminC}mg</span>}
                          {logPreview.meal.micronutrients.zinc > 0 && <span className="px-2 py-0.5 rounded-lg bg-background-elevated">Zinc: {logPreview.meal.micronutrients.zinc}mg</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Hydration Extraction */}
                {logPreview.hydration?.detected && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background-surface border border-blue-500/30 text-xs">
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                      <Droplet className="h-4 w-4" />
                      <span>Hydration Intake:</span>
                    </div>
                    <span className="font-extrabold text-blue-400 font-mono">
                      +{logPreview.hydration.amountMl} ml ({logPreview.hydration.beverageType || "WATER"})
                    </span>
                  </div>
                )}

                {/* Weight Extraction */}
                {logPreview.weight?.detected && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background-surface border border-purple-500/30 text-xs">
                    <span className="text-purple-400 font-bold">Body Weight Record:</span>
                    <span className="font-extrabold text-purple-400 font-mono">
                      {logPreview.weight.weightKg} kg
                    </span>
                  </div>
                )}

                {/* Activity / Running Extraction */}
                {logPreview.activity?.detected && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background-surface border border-emerald-500/30 text-xs">
                    <span className="text-emerald-400 font-bold">Activity: {logPreview.activity.type}</span>
                    <span className="font-extrabold text-emerald-400 font-mono">
                      {logPreview.activity.durationMinutes} mins &bull; {logPreview.activity.distanceKm} km
                    </span>
                  </div>
                )}

                {/* Confirmation Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setLogPreview(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-foreground-muted hover:text-foreground-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLog}
                    disabled={isExecutingLog}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    {isExecutingLog ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Confirm &amp; Log to Database
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Action History Audit */}
          {actionHistory.length > 0 && (
            <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-foreground-primary">
                    Recent AI Logs &amp; Adjustments
                  </h3>
                </div>
                <button
                  onClick={loadActionHistory}
                  className="p-1 rounded-lg hover:bg-background-elevated text-foreground-muted hover:text-foreground-primary transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {actionHistory.slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-background-elevated/70 border border-border-subtle flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span>{item.actionType}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-sans">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground-muted">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &bull; {item.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Modals */}
      {isMemoryModalOpen && (
        <AIMemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
        />
      )}

      {isWeeklyPlanModalOpen && (
        <WeeklyPlanModal
          isOpen={isWeeklyPlanModalOpen}
          onClose={() => setIsWeeklyPlanModalOpen(false)}
        />
      )}

      {isFoodScannerOpen && (
        <FoodScannerModal
          isOpen={isFoodScannerOpen}
          onClose={() => setIsFoodScannerOpen(false)}
          onMealLogged={() => {
            loadActionHistory();
          }}
        />
      )}
    </div>
  );
}

export default AICoachClient;
