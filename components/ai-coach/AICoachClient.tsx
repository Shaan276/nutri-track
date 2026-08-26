"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
  Loader2,
  RefreshCw,
  Zap,
  Activity,
  AlertCircle,
  Menu,
  X,
  Brain,
  Calendar,
  Shuffle,
  Mic,
  MicOff,
  Camera,
  ImagePlus,
  ChevronLeft,
  Square,
  Volume2,
  VolumeX,
  ClipboardCheck,
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
  Info,
} from "lucide-react";
import { GoalConfirmationCard } from "./GoalConfirmationCard";
import { LiveHealthSnapshotDrawer } from "./LiveHealthSnapshotDrawer";
import { AIMemoryModal } from "./AIMemoryModal";
import { WeeklyPlanModal } from "./WeeklyPlanModal";
import { FoodScannerModal } from "./FoodScannerModal";
import { AssessmentQuestionnaireWidget } from "./AssessmentQuestionnaireWidget";

interface MessageItem {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

interface ActionDiffItem {
  key: string;
  label: string;
  previousValue: string;
  proposedValue: string;
  unit?: string;
  isNewConfig?: boolean;
}

interface ParsedValidationState {
  isValid: boolean;
  actionType: string;
  parsedAction?: any;
  diffs: ActionDiffItem[];
  reason: string;
  requiresConfirmation: boolean;
  warnings: string[];
  errors: string[];
}

interface ActionLogItem {
  id: string;
  actionType: string;
  source: string;
  payload: string;
  previousState?: string | null;
  newState?: string | null;
  status: string;
  errorMessage?: string | null;
  requiresConfirmation: boolean;
  confirmedAt?: string | null;
  revertedAt?: string | null;
  createdAt: string;
}

const DYNAMIC_PROMPT_POOL = [
  "Log 500ml of water",
  "Set my daily water goal to 3000ml",
  "I had 2 boiled eggs and 1 slice of whole wheat toast for breakfast",
  "Set my protein target to 140g and calories to 2200",
  "Log a 5 km morning tempo run in 26 minutes",
  "Record workout: 4 sets bench press, 3 sets pullups",
  "What is my calorie and protein intake today?",
  "How much hydration do I have left to drink?",
];

export interface AICoachClientProps {
  isAdmin?: boolean;
}

export function AICoachComingSoon() {
  const [hasRequested, setHasRequested] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in text-center">
      {/* Hero Badge & Header */}
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

      {/* Feature Teasers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-background-surface border border-border-default hover:border-brand-500/30 transition-all rounded-3xl p-6 shadow-surface-card space-y-3 group">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-foreground-primary">
            1. Free ChatGPT Coach
          </h3>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Personalized daily nutrition, running advice, workout planning, and empathetic motivation in your private ChatGPT with zero subscription cost.
          </p>
        </div>

        <div className="bg-background-surface border border-border-default hover:border-emerald-500/30 transition-all rounded-3xl p-6 shadow-surface-card space-y-3 group">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-foreground-primary">
            2. Deterministic Action Bridge
          </h3>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Apply meal logs, target adjustments, and workouts proposed by your coach with single-click safety bounds, visual diffs, and rollback.
          </p>
        </div>

        <div className="bg-background-surface border border-border-default hover:border-blue-500/30 transition-all rounded-3xl p-6 shadow-surface-card space-y-3 group">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-foreground-primary">
            3. Deep Biometric Intelligence
          </h3>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Real-time micronutrient tracking, food vision scanning, running pace metrics, and automated weekly volume analytics.
          </p>
        </div>
      </div>

      {/* Early Access Notification Card */}
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

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<"hub" | "chat">("hub");

  // Chat State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);

  // Action Bridge State
  const [actionInput, setActionInput] = useState("");
  const [isParsingAction, setIsParsingAction] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [validationState, setValidationState] = useState<ParsedValidationState | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<ActionLogItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [revertingLogId, setRevertingLogId] = useState<string | null>(null);

  // Copy Feedback State
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Modals & Drawers
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);
  const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState<string>("NOT_STARTED");

  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Prompt pool
  useEffect(() => {
    setQuickPrompts([...DYNAMIC_PROMPT_POOL].sort(() => 0.5 - Math.random()).slice(0, 5));
  }, []);

  // Fetch initial state & history
  useEffect(() => {
    if (isAdmin) {
      loadActionHistory();
      loadConversations();
      checkAssessmentStatus();
    }
  }, [isAdmin]);

  const loadActionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/ai/actions/history");
      const data = await res.json();
      if (data.success && data.history) {
        setActionHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to load action history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const checkAssessmentStatus = async () => {
    try {
      const res = await fetch("/api/ai/assessment/status");
      const data = await res.json();
      if (data.status) {
        setAssessmentStatus(data.status);
      }
    } catch {}
  };

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConvId) {
          setActiveConvId(data.conversations[0].id);
          loadMessages(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleCopy = async (type: "instructions" | "context" | "assessment") => {
    try {
      let endpoint = "";
      if (type === "instructions") endpoint = "/api/ai/chatgpt/instructions";
      else if (type === "context") endpoint = "/api/ai/chatgpt/context";
      else if (type === "assessment") endpoint = "/api/ai/chatgpt/assessment-prompt";

      const res = await fetch(endpoint);
      const data = await res.json();
      const content = data.instructions || data.context || data.prompt || data.markdown || "";

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 3000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleParseAction = async () => {
    if (!actionInput.trim()) return;
    setIsParsingAction(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);
    setValidationState(null);

    try {
      const res = await fetch("/api/ai/actions/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionString: actionInput }),
      });
      const data = await res.json();

      if (data.validation) {
        setValidationState(data.validation);
        if (!data.validation.isValid) {
          setActionErrorMessage(data.validation.errors.join("; "));
        }
      } else if (data.error) {
        setActionErrorMessage(data.error);
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to parse action.");
    } finally {
      setIsParsingAction(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!validationState || !validationState.isValid) return;
    setIsExecutingAction(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: validationState.parsedAction || actionInput,
          source: "CHATGPT_ACTION",
          confirmed: true,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setActionSuccessMessage(data.result?.message || "Action applied successfully to Nutri-Track!");
        setActionInput("");
        setValidationState(null);
        loadActionHistory();
      } else {
        setActionErrorMessage(data.error || "Failed to execute action.");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Execution exception occurred.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleRevertAction = async (actionLogId: string) => {
    setRevertingLogId(actionLogId);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch(`/api/ai/actions/${actionLogId}/revert`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(data.message || "Successfully reverted targets.");
        loadActionHistory();
      } else {
        setActionErrorMessage(data.error || "Failed to revert action.");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Revert error occurred.");
    } finally {
      setRevertingLogId(null);
    }
  };

  const handleSendChatMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setInputText("");
    setIsLoading(true);
    setErrorMessage(null);

    const userMessage: MessageItem = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: activeConvId,
        }),
      });
      const data = await res.json();

      if (data.success && data.message) {
        const assistantMessage: MessageItem = {
          id: data.message.id || `msg_${Date.now() + 1}`,
          role: "assistant",
          content: data.message.content,
          metadata: data.message.metadata,
          createdAt: data.message.createdAt || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (data.conversationId && data.conversationId !== activeConvId) {
          setActiveConvId(data.conversationId);
          loadConversations();
        }
      } else {
        setErrorMessage(data.error || "Failed to receive response from AI Integrator.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" && propIsAdmin === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-neutral-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs">Loading AI Coach & Biometric Data...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return <AICoachComingSoon />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      {/* Admin Notice Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-400">Admin Early Access Mode Active:</strong> You have full administrative access to the Two-Layer AI Health Coach &amp; Integrator Hub. Standard users see a Coming Soon preview.
          </span>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-black tracking-wider uppercase border border-amber-500/30">
          ADMIN ONLY
        </span>
      </div>

      {/* Top Architecture Banner */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card text-left space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Two-Layer AI Health Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground-primary tracking-tight">
              AI Health Coach &amp; Integrator Hub
            </h1>
            <p className="text-sm text-foreground-secondary max-w-3xl leading-relaxed">
              Use your personal <strong>ChatGPT Project</strong> as your daily conversational health, nutrition, and workout coach. When your coach proposes new targets or meals, paste the structured action into Nutri-Track&apos;s <strong>AI Integrator</strong> to validate and apply them safely.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-background-elevated rounded-2xl border border-border-subtle shrink-0">
            <button
              onClick={() => setActiveTab("hub")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "hub"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              ChatGPT Coach &amp; Action Bridge
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "chat"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              AI Integrator Chat
            </button>
          </div>
        </div>
      </div>

      {activeTab === "hub" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left Column: ChatGPT Project Tools (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: ChatGPT Project Setup Card */}
            <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-5">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-brand-400" />
                  <h3 className="text-base font-extrabold text-foreground-primary">
                    1. ChatGPT Project Setup
                  </h3>
                </div>
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Open ChatGPT <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <p className="text-xs text-foreground-secondary leading-relaxed">
                Create a dedicated <strong>ChatGPT Project</strong> (or chat thread) named <em>&quot;Nutri-Track Coach&quot;</em>. Copy and paste your personalized Custom Instructions and Health Profile into it:
              </p>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => handleCopy("instructions")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-background-elevated border border-border-subtle hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left group"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-foreground-primary group-hover:text-brand-400 transition-colors">
                      Copy Project Instructions
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      Custom instructions, coach persona &amp; action block rules
                    </p>
                  </div>
                  <div className="shrink-0 p-2 rounded-xl bg-background-surface text-brand-400">
                    {copiedType === "instructions" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </div>
                </button>

                <button
                  onClick={() => handleCopy("assessment")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-background-elevated border border-border-subtle hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left group"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-foreground-primary group-hover:text-brand-400 transition-colors">
                      Copy Initial Assessment Prompt
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      Grouped 7-part health, lifestyle &amp; living situation intake
                    </p>
                  </div>
                  <div className="shrink-0 p-2 rounded-xl bg-background-surface text-brand-400">
                    {copiedType === "assessment" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </div>
                </button>

                <button
                  onClick={() => handleCopy("context")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-background-elevated border border-border-subtle hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left group"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-foreground-primary group-hover:text-brand-400 transition-colors">
                      Copy Health Context Snapshot
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      Fresh Nutri-Track logged macros, hydration &amp; workouts
                    </p>
                  </div>
                  <div className="shrink-0 p-2 rounded-xl bg-background-surface text-brand-400">
                    {copiedType === "context" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </div>
                </button>
              </div>

              {copiedType && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Copied to clipboard! Paste directly into your ChatGPT Project.</span>
                </div>
              )}
            </div>

            {/* Step 2: Health Preferences & Memories */}
            <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <h3 className="text-base font-extrabold text-foreground-primary">
                    Health Notes &amp; Preferences
                  </h3>
                </div>
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="px-3 py-1 rounded-xl bg-background-elevated hover:bg-background-surface border border-border-subtle text-xs font-bold text-foreground-primary transition-colors"
                >
                  Manage Notes
                </button>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Nutri-Track stores persistent, long-term health constraints (e.g. food intolerances, living in a hostel, morning running routine) to maintain factual consistency across sessions.
              </p>
            </div>
          </div>

          {/* Right Column: Nutri-Track Action Bridge (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Action Paste & Diff Box */}
            <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-5">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-400" />
                  <h3 className="text-base font-extrabold text-foreground-primary">
                    2. Nutri-Track Action Bridge
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
                  Validated &amp; Scoped Execution
                </span>
              </div>

              <p className="text-xs text-foreground-secondary leading-relaxed">
                When your ChatGPT Health Coach outputs a <code className="text-brand-400 font-mono font-bold">NUTRI-TRACK ACTION</code> block (e.g. proposed calorie/protein targets or logged meals), paste it below:
              </p>

              <div className="space-y-3">
                <textarea
                  value={actionInput}
                  onChange={(e) => {
                    setActionInput(e.target.value);
                    if (validationState) setValidationState(null);
                  }}
                  rows={6}
                  placeholder={`Paste your NUTRI-TRACK ACTION JSON or formatted block here, e.g.:\n{\n  "version": 1,\n  "action": "UPDATE_GOALS",\n  "data": { "proteinG": 140, "caloriesKcal": 2200, "hydrationMl": 3000 },\n  "reason": "Adjusted for 10k training"\n}`}
                  className="w-full bg-background-elevated border border-border-subtle focus:border-brand-500/50 rounded-2xl p-4 text-xs font-mono text-foreground-primary focus:outline-none resize-none transition-colors"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setActionInput("");
                      setValidationState(null);
                      setActionErrorMessage(null);
                      setActionSuccessMessage(null);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-foreground-muted hover:text-foreground-primary transition-colors"
                  >
                    Clear Box
                  </button>

                  <button
                    onClick={handleParseAction}
                    disabled={isParsingAction || !actionInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-brand-glow"
                  >
                    {isParsingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Parse &amp; Preview Changes
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {actionErrorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Validation Error:</strong> {actionErrorMessage}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {actionSuccessMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Validation & Proposed Diff Card */}
              {validationState && validationState.isValid && (
                <div className="p-5 rounded-2xl bg-background-elevated/70 border border-brand-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-brand-400 uppercase tracking-wider">
                      <Sliders className="h-4 w-4" />
                      <span>Proposed Changes Preview ({validationState.actionType})</span>
                    </div>
                    {validationState.requiresConfirmation && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase">
                        Requires Confirmation
                      </span>
                    )}
                  </div>

                  {validationState.reason && (
                    <p className="text-xs text-foreground-secondary italic">
                      &quot;{validationState.reason}&quot;
                    </p>
                  )}

                  {/* Diff List */}
                  <div className="space-y-2">
                    {validationState.diffs.map((diff, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-background-surface border border-border-subtle text-xs"
                      >
                        <span className="font-bold text-foreground-secondary">{diff.label}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-foreground-muted line-through">{diff.previousValue}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-brand-400" />
                          <span className="font-extrabold text-brand-400">{diff.proposedValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Execution Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setValidationState(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-foreground-muted hover:text-foreground-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteAction}
                      disabled={isExecutingAction}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md"
                    >
                      {isExecutingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Apply Changes to Nutri-Track
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action History / Audit Log */}
            <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-400" />
                  <h3 className="text-base font-extrabold text-foreground-primary">
                    Action History &amp; Audit Log
                  </h3>
                </div>
                <button
                  onClick={loadActionHistory}
                  className="p-1.5 rounded-xl hover:bg-background-elevated text-foreground-muted hover:text-foreground-primary transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading action history...</span>
                </div>
              ) : actionHistory.length === 0 ? (
                <div className="py-6 text-center text-xs text-foreground-muted">
                  No applied actions recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {actionHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-background-elevated/70 border border-border-subtle flex items-center justify-between text-xs gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground-primary font-mono">
                            {item.actionType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.status === "SUCCESS"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : item.status === "REVERTED"
                                ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground-muted">
                          {new Date(item.createdAt).toLocaleString()} &bull; Source: {item.source}
                        </p>
                      </div>

                      {(item.actionType === "UPDATE_GOALS" || item.actionType === "UPDATE_TARGETS" || item.actionType === "UPDATE_PROFILE") &&
                        item.status === "SUCCESS" &&
                        !item.revertedAt && (
                          <button
                            onClick={() => handleRevertAction(item.id)}
                            disabled={revertingLogId === item.id}
                            className="px-2.5 py-1 rounded-xl bg-background-surface hover:bg-background-elevated border border-border-subtle text-[11px] font-bold text-foreground-secondary hover:text-foreground-primary flex items-center gap-1.5 transition-colors"
                          >
                            {revertingLogId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                            Revert
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* AI Integrator Chat View */
        <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground-primary">
                AI Integrator Quick Execution
              </h2>
              <p className="text-xs text-foreground-secondary">
                Directly execute structured queries and quick logging via Nutri-Track&apos;s internal AI Integrator.
              </p>
            </div>
            <button
              onClick={() => setIsFoodScannerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold text-xs hover:bg-brand-500/20 transition-colors flex items-center gap-1.5"
            >
              <Camera className="h-4 w-4" />
              Scan Food Photo
            </button>
          </div>

          {/* Quick Command Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground-muted">Quick Commands:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChatMessage(prompt)}
                className="px-3 py-1 rounded-full bg-background-elevated hover:bg-brand-500/15 border border-border-subtle hover:border-brand-500/30 text-xs text-foreground-secondary hover:text-brand-300 font-semibold transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="h-96 overflow-y-auto space-y-4 p-4 rounded-2xl bg-background-elevated/40 border border-border-subtle">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-foreground-muted space-y-2">
                <Bot className="h-8 w-8 text-foreground-muted opacity-50" />
                <p className="text-xs">Type a command or question to execute via the AI Integrator.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      msg.role === "user"
                        ? "bg-brand-500 text-neutral-950 font-semibold rounded-br-sm"
                        : "bg-background-elevated border border-border-subtle text-foreground-primary rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              placeholder="Type a quick command (e.g. 'Log 500ml water' or 'Set protein target to 140g')..."
              className="flex-1 bg-background-elevated border border-border-subtle focus:border-brand-500/50 rounded-2xl px-4 py-3 text-xs text-foreground-primary focus:outline-none transition-colors"
            />
            <button
              onClick={() => handleSendChatMessage()}
              disabled={isLoading || !inputText.trim()}
              className="px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-brand-glow shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Execute
            </button>
          </div>
        </div>
      )}

      {/* Persistent Memory & Food Scanner Modals */}
      <AIMemoryModal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} />
      <WeeklyPlanModal isOpen={isWeeklyPlanModalOpen} onClose={() => setIsWeeklyPlanModalOpen(false)} />
      <FoodScannerModal
        isOpen={isFoodScannerOpen}
        onClose={() => setIsFoodScannerOpen(false)}
        onMealLogged={() => {
          loadActionHistory();
        }}
      />
    </div>
  );
}

export default AICoachClient;
