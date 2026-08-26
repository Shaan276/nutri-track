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
  const [activeTab, setActiveTab] = useState<"chat" | "sync" | "setup">("chat");

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

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConvId) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const checkAssessmentStatus = async () => {
    try {
      const res = await fetch("/api/ai/assessment/status");
      const data = await res.json();
      if (data.success && data.status) {
        setAssessmentStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to check assessment status:", err);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        setMessages(data.conversation.messages || []);
      }
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    }
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
      console.error("Failed to copy content:", err);
    }
  };

  const handleParseAction = async () => {
    if (!actionInput.trim()) return;
    setIsParsingAction(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/actions/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawAction: actionInput }),
      });
      const data = await res.json();

      if (data.success && data.validation) {
        setValidationState(data.validation);
      } else {
        setActionErrorMessage(data.error || "Failed to parse action block.");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to parse action.");
    } finally {
      setIsParsingAction(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!validationState || !validationState.parsedAction) return;
    setIsExecutingAction(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: validationState.parsedAction,
          confirmed: true,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setActionSuccessMessage(data.message || "Action successfully applied to your database!");
        setValidationState(null);
        setActionInput("");
        loadActionHistory();
        checkAssessmentStatus();
      } else {
        setActionErrorMessage(data.error || "Execution failed.");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Execution error.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleRevertAction = async (actionLogId: string) => {
    setRevertingLogId(actionLogId);
    try {
      const res = await fetch(`/api/ai/actions/${actionLogId}/revert`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage("Action successfully reverted.");
        loadActionHistory();
      } else {
        setActionErrorMessage(data.error || "Reversion failed.");
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || "Reversion error.");
    } finally {
      setRevertingLogId(null);
    }
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: MessageItem = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!presetText) setInputText("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Admin Notice Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-400">Admin Preview Mode:</strong> You have full administrative access to the Two-Layer AI Health Coach &amp; Integrator Hub.
          </span>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-black tracking-wider uppercase border border-amber-500/30">
          ADMIN ACCESS
        </span>
      </div>

      {/* Top Health Intelligence & Coaching Header */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card text-left space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Two-Layer AI Health Coach</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  assessmentStatus === "COMPLETED"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                {assessmentStatus === "COMPLETED" ? "✓ Assessment Complete" : "📝 Assessment: Ready to Start"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground-primary tracking-tight">
              AI Health Coach &amp; Integrator
            </h1>
            <p className="text-xs sm:text-sm text-foreground-secondary max-w-3xl leading-relaxed">
              Your personal <strong>ChatGPT Health Coach</strong> handles long-term health planning, motivation, and lifestyle decisions. Use Nutri-Track&apos;s <strong>AI Integrator</strong> to chat, log foods, and apply coach recommendations safely.
            </p>
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 bg-background-elevated rounded-2xl border border-border-subtle shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "chat"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              AI Integrator Chat
            </button>
            <button
              onClick={() => setActiveTab("sync")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "sync"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sync Coach Actions
            </button>
            <button
              onClick={() => setActiveTab("setup")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "setup"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              ChatGPT Coach Setup
            </button>
          </div>
        </div>

        {/* Quick Tool Drawer Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border-subtle">
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
            Health Memories &amp; Constraints
          </button>
          <button
            onClick={() => setIsWeeklyPlanModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-purple-500/10 border border-border-subtle text-xs font-bold text-foreground-secondary hover:text-purple-400 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5 text-purple-400" />
            Weekly Workout Plan
          </button>
        </div>
      </div>

      {/* TAB 1: AI Integrator Chat (Primary Workspace) */}
      {activeTab === "chat" && (
        <div className="bg-background-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-surface-card space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground-primary">
                AI Integrator Quick Execution
              </h2>
              <p className="text-xs text-foreground-secondary">
                Log meals, water, runs, and workouts in natural language or execute structured commands.
              </p>
            </div>
            <button
              onClick={() => handleCopy("context")}
              className="px-3 py-1.5 rounded-xl bg-background-elevated hover:bg-brand-500/10 border border-border-subtle text-xs font-bold text-foreground-secondary hover:text-brand-400 transition-colors flex items-center gap-1.5"
            >
              {copiedType === "context" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              Export Health Snapshot
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

          {/* Chat Messages Container */}
          <div className="min-h-[360px] max-h-[500px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-background-elevated/40 border border-border-subtle">
            {messages.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-foreground-muted space-y-2">
                <Bot className="h-10 w-10 text-foreground-muted opacity-40" />
                <p className="text-xs font-medium">Type a meal, water entry, run, or question to execute via the AI Integrator.</p>
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
                        ? "bg-brand-500 text-neutral-950 font-semibold rounded-br-sm shadow-sm"
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
              placeholder="Type a command (e.g. 'Log 500ml water' or 'I had grilled chicken with quinoa')..."
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

      {/* TAB 2: Sync Coach Recommendations & Action Bridge */}
      {activeTab === "sync" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Action Input & Validation (7 cols) */}
          <div className="lg:col-span-7 bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-foreground-primary">
                  Apply Coach Recommendations
                </h3>
              </div>
              <span className="text-[11px] font-mono text-foreground-muted">Bounded &amp; Transactional</span>
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              When your ChatGPT Health Coach proposes new macro targets or logs, paste the action block below to validate physiological bounds and preview changes:
            </p>

            <textarea
              rows={6}
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder='Paste NUTRI-TRACK ACTION JSON or text block here...&#10;e.g. {"version": 1, "action": "UPDATE_GOALS", "data": {"caloriesKcal": 2200, "proteinG": 140}}'
              className="w-full bg-background-elevated border border-border-subtle focus:border-brand-500/50 rounded-2xl p-4 font-mono text-xs text-foreground-primary focus:outline-none transition-colors"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setActionInput("");
                  setValidationState(null);
                  setActionErrorMessage(null);
                  setActionSuccessMessage(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-foreground-muted hover:text-foreground-primary transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleParseAction}
                disabled={isParsingAction || !actionInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-extrabold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-brand-glow"
              >
                {isParsingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sliders className="h-4 w-4" />}
                Parse &amp; Preview Changes
              </button>
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

            {/* Validation & Diff Card */}
            {validationState && (
              <div className="p-5 rounded-2xl bg-background-elevated border border-border-default space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-mono text-xs font-black">
                      {validationState.actionType}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">✓ Physiological Bounds Verified</span>
                  </div>
                  {validationState.requiresConfirmation && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Confirmation Required
                    </span>
                  )}
                </div>

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

                {/* Execution Buttons */}
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

          {/* Action History & Revert Audit (5 cols) */}
          <div className="lg:col-span-5 bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-extrabold text-foreground-primary">
                  Action History &amp; Audit
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
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
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
                        {new Date(item.createdAt).toLocaleString()} &bull; {item.source}
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
      )}

      {/* TAB 3: ChatGPT Coach Setup & Assessment */}
      {activeTab === "setup" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1: Custom Instructions */}
          <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-foreground-primary">
                1. ChatGPT Project Instructions
              </h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Paste these into your ChatGPT Project instructions. Configures your coach&apos;s warm persona, living situation awareness, and structured action block rules.
              </p>
            </div>

            <button
              onClick={() => handleCopy("instructions")}
              className="w-full px-4 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-extrabold text-xs transition-all shadow-brand-glow flex items-center justify-center gap-2"
            >
              {copiedType === "instructions" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedType === "instructions" ? "Copied to Clipboard!" : "Copy Project Instructions"}
            </button>
          </div>

          {/* Card 2: Initial Assessment Prompt */}
          <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-foreground-primary">
                2. 7-Part Health Assessment
              </h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Guides your coach through an intelligent intake covering living situation, food control, training, and goals while acknowledging your confirmed data.
              </p>
            </div>

            <button
              onClick={() => handleCopy("assessment")}
              className="w-full px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {copiedType === "assessment" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedType === "assessment" ? "Copied to Clipboard!" : "Copy Assessment Prompt"}
            </button>
          </div>

          {/* Card 3: Live Health Snapshot */}
          <div className="bg-background-surface border border-border-default rounded-3xl p-6 shadow-surface-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-foreground-primary">
                3. Live Health Snapshot
              </h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Generates a live snapshot of your verified database metrics with provenance tags to update your coach on recent nutrition, hydration, and workouts.
              </p>
            </div>

            <button
              onClick={() => handleCopy("context")}
              className="w-full px-4 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {copiedType === "context" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedType === "context" ? "Copied to Clipboard!" : "Copy Health Snapshot"}
            </button>
          </div>
        </div>
      )}

      {/* Global Modals & Drawers */}
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

