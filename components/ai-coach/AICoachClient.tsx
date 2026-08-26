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
  User,
  Link2,
} from "lucide-react";
import { AIMemoryModal } from "./AIMemoryModal";
import { WeeklyPlanModal } from "./WeeklyPlanModal";
import { FoodScannerModal } from "./FoodScannerModal";
import { LiveHealthSnapshotDrawer } from "./LiveHealthSnapshotDrawer";

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
            Instantly deconstruct meals, hydration, and workouts into exact macros and micronutrients with in-chat confirmation.
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
          The AI Health Coach is currently active for administrators and internal beta testers during final evaluation.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {hasRequested ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
              <CheckCircle2 className="h-4 w-4" />
              <span>You&apos;re on the Early Access VIP list!</span>
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

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
  createdAt: string;
  parsedLog?: any;
  confirmed?: boolean;
}

export function AICoachClient({ isAdmin: propIsAdmin }: AICoachClientProps = {}) {
  const { data: session, status } = useSession();
  const isAdmin = propIsAdmin ?? ((session?.user as any)?.role === "ADMIN");
  const searchParams = useSearchParams();

  // TWO AI MODES: "ask" (ChatGPT Coach) vs "log" (Nutri-Track AI Chat)
  const [activeMode, setActiveMode] = useState<"log" | "ask">("log");

  // Mode A (Ask / Discuss) State
  const [chatgptUrl, setChatgptUrl] = useState<string>("https://chatgpt.com");
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<string>("NOT_STARTED");

  // Automatic Action Handoff State
  const [detectedAction, setDetectedAction] = useState<any | null>(null);
  const [actionInputText, setActionInputText] = useState("");
  const [isParsingAction, setIsParsingAction] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<any[]>([]);

  // Mode B (Log Something - Conversational AI Chat) State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Modals & Drawers
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);
  const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);
  const [isSnapshotDrawerOpen, setIsSnapshotDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_LOG_PROMPTS = [
    "I ate 4 rotis, 100g paneer bhurji, and drank 500ml water",
    "Log 500ml of water",
    "My weight is 56 kg",
    "I ran 5 km in 28 minutes",
    "Completed workout: 3 sets bench press, 3 sets pullups",
  ];

  const QUICK_ASK_PROMPTS = [
    "What should I eat after running?",
    "Why am I feeling tired today?",
    "Can I eat soya chunks every day?",
    "Help me plan tomorrow's high-protein meals",
    "How can I improve my 5K running pace?",
  ];

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading]);

  // Initialize Speech Recognition
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
            setInputMessage(transcript.trim());
          }
          setIsRecording(false);
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Load chat conversations & actions
  useEffect(() => {
    if (isAdmin) {
      loadConversations();
      loadActionHistory();
      checkAssessmentStatus();

      // Check URL params for action handoff
      const actionParam = searchParams.get("action");
      if (actionParam) {
        try {
          const decoded = decodeURIComponent(actionParam);
          handleParseAction(decoded);
        } catch {}
      }

      // Check saved user ChatGPT URL from localStorage
      const savedUrl = localStorage.getItem("nutritrack_chatgpt_url");
      if (savedUrl) setChatgptUrl(savedUrl);
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

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      const data = await res.json();
      if (data.conversations && data.conversations.length > 0) {
        setConversations(data.conversations);
        const targetId = data.conversations[0].id;
        setActiveConvId(targetId);
        loadMessages(targetId);
      } else {
        // Start a welcoming conversation
        handleNewChat();
      }
    } catch {
      handleNewChat();
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleNewChat = () => {
    const welcomeMsg: ChatMessage = {
      id: `welcome_${Date.now()}`,
      role: "assistant",
      content:
        "Hello! I am your Nutri-Track AI Integrator — your conversational partner for lightning-fast logging, macro calculations, and tracking! 🌟💪\n\nTell me what you ate, drank, or exercised today (e.g. *'I had 4 rotis and 100g paneer bhurji, and drank 500ml water'*), or speak into the mic!",
      createdAt: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
    setActiveConvId(null);
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

  const handleSaveChatGPTUrl = (url: string) => {
    setChatgptUrl(url);
    localStorage.setItem("nutritrack_chatgpt_url", url);
    setIsEditingUrl(false);
  };

  // Automatic Action Bridge Parsing
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

  // Send Message in Conversational AI Chat
  const handleSendChatMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputMessage).trim();
    if (!textToSend || isChatLoading) return;

    setInputMessage("");
    setChatErrorMessage(null);

    const userMessageId = `usr_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsChatLoading(true);

    try {
      // 1. First run quick parser for structured nutrition deconstruction if logging
      let parsedLogData: any = null;
      try {
        const parseRes = await fetch("/api/ai/quick-log/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: textToSend }),
        });
        const parseJson = await parseRes.json();
        if (parseJson.success && parseJson.data) {
          parsedLogData = parseJson.data;
        }
      } catch {}

      // 2. Send to AI Chat endpoint
      const chatRes = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: textToSend,
        }),
      });

      const chatData = await chatRes.json();

      if (!chatRes.ok) {
        throw new Error(chatData.error || "Failed to process AI response");
      }

      if (chatData.conversationId && !activeConvId) {
        setActiveConvId(chatData.conversationId);
      }

      const assistantReply =
        chatData.assistantMessage?.content ||
        chatData.reply ||
        "I have parsed your health details!";

      const assistantMessageId = `asst_${Date.now()}`;
      const asstMsg: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: assistantReply,
        parsedLog: parsedLogData,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatErrorMessage(err.message || "Failed to get AI response");

      // Append error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `⚠️ Note: ${err.message || "I encountered an error processing that request. Please try again."}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Confirm in-chat log item
  const handleConfirmInChatLog = async (msgId: string, logData: any) => {
    try {
      let actionPayload: any = null;

      if (logData.meal?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_MEAL",
          data: {
            name: logData.meal.name,
            mealType: logData.meal.mealType || "SNACK",
            calories: logData.meal.totals?.calories || 0,
            protein: logData.meal.totals?.protein || 0,
            carbohydrates: logData.meal.totals?.carbohydrates || 0,
            fat: logData.meal.totals?.fat || 0,
            fiber: logData.meal.totals?.fiber || 0,
          },
        };
      } else if (logData.hydration?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_HYDRATION",
          data: {
            amountMl: logData.hydration.amountMl,
            beverageType: logData.hydration.beverageType || "WATER",
          },
        };
      } else if (logData.weight?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_WEIGHT",
          data: {
            weightKg: logData.weight.weightKg,
          },
        };
      } else if (logData.activity?.detected) {
        actionPayload = {
          version: 1,
          action: "LOG_ACTIVITY",
          data: {
            type: logData.activity.type || "RUNNING",
            durationMinutes: logData.activity.durationMinutes || 30,
            distanceKm: logData.activity.distanceKm || 0,
            caloriesBurned: logData.activity.caloriesBurned || 0,
          },
        };
      }

      if (actionPayload) {
        const res = await fetch("/api/ai/actions/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: actionPayload, confirmed: true }),
        });

        if (res.ok) {
          // If both meal and hydration were detected
          if (logData.meal?.detected && logData.hydration?.detected && logData.hydration.amountMl > 0) {
            await fetch("/api/ai/actions/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: {
                  version: 1,
                  action: "LOG_HYDRATION",
                  data: {
                    amountMl: logData.hydration.amountMl,
                    beverageType: logData.hydration.beverageType || "WATER",
                  },
                },
                confirmed: true,
              }),
            });
          }

          // Mark message as confirmed
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, confirmed: true } : m))
          );
          loadActionHistory();
        }
      }
    } catch (err) {
      console.error("Confirm log failed:", err);
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
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 animate-fade-in text-left">
      {/* Admin Mode Badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-400">Admin Mode Active:</strong> You have full access to the Conversational AI Chat and ChatGPT Coach.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/features"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold uppercase transition-colors"
          >
            <Sliders className="h-3 w-3" />
            <span>Page Control</span>
          </Link>
        </div>
      </div>

      {/* Two-Mode Switcher Header */}
      <div className="bg-background-surface border border-border-default rounded-3xl p-4 sm:p-5 shadow-surface-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-foreground-primary tracking-tight">
              AI Coach &amp; Integrator
            </h1>
            <p className="text-xs text-foreground-secondary">
              Seamlessly switch between ChatGPT long-form coaching and Nutri-Track AI conversational logging.
            </p>
          </div>

          {/* Primary Two-Mode Switcher */}
          <div className="inline-flex p-1.5 bg-background-elevated rounded-2xl border border-border-subtle shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveMode("log")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeMode === "log"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary opacity-70 hover:opacity-100"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>📝 Nutri-Track Chat</span>
            </button>

            <button
              onClick={() => setActiveMode("ask")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeMode === "ask"
                  ? "bg-brand-500 text-neutral-950 shadow-brand-glow"
                  : "text-foreground-secondary hover:text-foreground-primary opacity-70 hover:opacity-100"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>💬 ChatGPT Coach</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: 💬 ASK / DISCUSS (Connected ChatGPT Coach)                       */}
      {/* ========================================================================= */}
      {activeMode === "ask" && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-background-surface border border-brand-500/30 rounded-3xl p-5 sm:p-6 shadow-surface-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-foreground-primary">
                      ChatGPT Health Coach
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Nutrition strategy, workout planning, running pacing &amp; empathetic motivation
                  </p>
                </div>
              </div>

              {/* 1-Click Launch & Context Tools */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={chatgptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-neutral-950 text-xs font-extrabold transition-all shadow-brand-glow flex items-center gap-1.5"
                >
                  Open in ChatGPT <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="p-2 rounded-xl bg-background-elevated hover:bg-background-surface border border-border-subtle text-foreground-secondary hover:text-foreground-primary transition-colors"
                  title="Configure personal ChatGPT Project URL"
                >
                  <Link2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleCopy("context")}
                  className="px-3 py-2 rounded-xl bg-background-elevated hover:bg-background-surface border border-border-subtle text-xs font-bold text-foreground-secondary hover:text-foreground-primary transition-colors flex items-center gap-1.5"
                >
                  {copiedType === "context" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Health Context
                </button>
              </div>
            </div>

            {/* Custom Link Editor */}
            {isEditingUrl && (
              <div className="p-4 rounded-2xl bg-background-elevated border border-border-default space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-foreground-secondary block">
                  Your Personal ChatGPT Project or GPT Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={chatgptUrl}
                    onChange={(e) => setChatgptUrl(e.target.value)}
                    placeholder="https://chatgpt.com/g/g-..."
                    className="flex-1 bg-background-surface border border-border-subtle focus:border-brand-500/50 rounded-xl px-3.5 py-2 text-xs font-mono text-foreground-primary focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveChatGPTUrl(chatgptUrl)}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-neutral-950 text-xs font-extrabold transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Assessment Helper Banner if Not Completed */}
            {assessmentStatus !== "COMPLETED" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-400">7-Part Health Assessment Ready</span>
                  <p className="text-amber-300/80">
                    Conduct your personalized intake with your coach to establish tailored calorie and macro targets without repeating known biometrics.
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
            <div className="p-4 sm:p-5 rounded-2xl bg-background-elevated/70 border border-border-default space-y-3">
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
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-xs font-black">
                      🟢 Action Ready: {detectedAction.actionType}
                    </span>
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
                    When your coach outputs a structured target update (e.g. 140g protein) or workout, paste it below or click &quot;Sync from Clipboard&quot; to apply it safely:
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
      {/* MODE B: 📝 LOG SOMETHING — CONVERSATIONAL AI CHAT INTERFACE                */}
      {/* ========================================================================= */}
      {activeMode === "log" && (
        <div className="bg-background-surface border border-border-default rounded-3xl shadow-surface-card flex flex-col h-[74vh] overflow-hidden animate-fade-in">
          {/* Chat Header */}
          <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-background-surface/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-extrabold text-foreground-primary">
                    Nutri-Track AI Integrator
                  </h2>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold">
                    Live Chat
                  </span>
                </div>
                <p className="text-[10px] text-foreground-muted">
                  Conversational food deconstruction, hydration, workouts &amp; macros
                </p>
              </div>
            </div>

            {/* Quick Modals */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFoodScannerOpen(true)}
                className="p-2 rounded-xl bg-background-elevated hover:bg-brand-500/15 text-foreground-secondary hover:text-brand-400 border border-border-subtle text-xs transition-colors"
                title="Scan Food Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsMemoryModalOpen(true)}
                className="p-2 rounded-xl bg-background-elevated hover:bg-blue-500/15 text-foreground-secondary hover:text-blue-400 border border-border-subtle text-xs transition-colors"
                title="Health Memories"
              >
                <Brain className="h-4 w-4" />
              </button>
              <button
                onClick={handleNewChat}
                className="p-2 rounded-xl bg-background-elevated hover:bg-background-surface text-foreground-secondary hover:text-foreground-primary border border-border-subtle text-xs transition-colors"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const logData = msg.parsedLog;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs space-y-3 shadow-sm ${
                      isUser
                        ? "bg-brand-500 text-neutral-950 font-medium rounded-tr-sm"
                        : "bg-background-elevated border border-border-subtle text-foreground-primary rounded-tl-sm"
                    }`}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Interactive In-Chat Nutrition / Logging Card */}
                    {logData && !isUser && (
                      <div className="p-3.5 rounded-2xl bg-background-surface border border-emerald-500/30 text-foreground-primary space-y-3 mt-2">
                        {logData.meal?.detected && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-foreground-primary text-xs">
                                {logData.meal.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 text-[10px] font-extrabold uppercase">
                                {logData.meal.mealType || "MEAL"}
                              </span>
                            </div>

                            {/* Macro Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center">
                              <div className="p-1.5 rounded-lg bg-background-elevated border border-border-subtle">
                                <span className="text-[9px] text-foreground-muted uppercase font-bold block">Calories</span>
                                <span className="text-xs font-black text-amber-400">{logData.meal.totals?.calories || 0} kcal</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-background-elevated border border-border-subtle">
                                <span className="text-[9px] text-foreground-muted uppercase font-bold block">Protein</span>
                                <span className="text-xs font-black text-emerald-400">{logData.meal.totals?.protein || 0} g</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-background-elevated border border-border-subtle">
                                <span className="text-[9px] text-foreground-muted uppercase font-bold block">Carbs</span>
                                <span className="text-xs font-black text-blue-400">{logData.meal.totals?.carbohydrates || 0} g</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-background-elevated border border-border-subtle">
                                <span className="text-[9px] text-foreground-muted uppercase font-bold block">Fat</span>
                                <span className="text-xs font-black text-purple-400">{logData.meal.totals?.fat || 0} g</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-background-elevated border border-border-subtle">
                                <span className="text-[9px] text-foreground-muted uppercase font-bold block">Fiber</span>
                                <span className="text-xs font-black text-lime-400">{logData.meal.totals?.fiber || 0} g</span>
                              </div>
                            </div>

                            {/* Micronutrients if present */}
                            {logData.meal.micronutrients && Object.keys(logData.meal.micronutrients).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 text-[10px] text-foreground-secondary pt-1">
                                {logData.meal.micronutrients.calcium > 0 && <span className="px-1.5 py-0.5 rounded bg-background-elevated">Calcium: {logData.meal.micronutrients.calcium}mg</span>}
                                {logData.meal.micronutrients.iron > 0 && <span className="px-1.5 py-0.5 rounded bg-background-elevated">Iron: {logData.meal.micronutrients.iron}mg</span>}
                                {logData.meal.micronutrients.potassium > 0 && <span className="px-1.5 py-0.5 rounded bg-background-elevated">Potassium: {logData.meal.micronutrients.potassium}mg</span>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hydration */}
                        {logData.hydration?.detected && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs">
                            <span className="text-blue-400 font-bold flex items-center gap-1.5">
                              <Droplet className="h-3.5 w-3.5" /> Hydration:
                            </span>
                            <span className="font-extrabold text-blue-400 font-mono">
                              +{logData.hydration.amountMl} ml ({logData.hydration.beverageType || "WATER"})
                            </span>
                          </div>
                        )}

                        {/* In-Chat Confirm Button */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {msg.confirmed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
                              <Check className="h-3.5 w-3.5" /> Confirmed &amp; Logged
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConfirmInChatLog(msg.id, logData)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <Check className="h-3.5 w-3.5" /> Confirm &amp; Log
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`text-[9px] ${
                        isUser ? "text-neutral-800 text-right" : "text-foreground-muted"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="h-8 w-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex items-center gap-2.5 text-xs text-foreground-muted animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <span>Nutri-Track AI is analyzing and estimating...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-4 py-2 bg-background-surface/90 border-t border-border-subtle shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {QUICK_LOG_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChatMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-background-elevated hover:bg-emerald-500/15 border border-border-subtle hover:border-emerald-500/30 text-[11px] text-foreground-secondary hover:text-emerald-300 font-medium whitespace-nowrap transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Composer Bar */}
          <div className="p-3 sm:p-4 bg-background-surface border-t border-border-subtle shrink-0">
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setIsFoodScannerOpen(true)}
                className="p-2.5 rounded-2xl bg-background-elevated hover:bg-brand-500/15 text-foreground-secondary hover:text-brand-400 border border-border-subtle transition-colors shrink-0"
                title="Scan food photo"
              >
                <Camera className="h-4 w-4" />
              </button>

              <button
                onClick={toggleVoiceRecording}
                className={`p-2.5 rounded-2xl border transition-all shrink-0 ${
                  isRecording
                    ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                    : "bg-background-elevated hover:bg-background-surface text-foreground-secondary hover:text-foreground-primary border-border-subtle"
                }`}
                title={isRecording ? "Stop recording" : "Speak into mic"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                placeholder="Type or speak what you ate, drank, or exercised..."
                className="flex-1 bg-background-elevated border border-border-subtle focus:border-brand-500/50 rounded-2xl px-4 py-3 text-xs text-foreground-primary focus:outline-none transition-colors"
              />

              <button
                onClick={() => handleSendChatMessage()}
                disabled={isChatLoading || !inputMessage.trim()}
                className="px-4 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-neutral-950 font-extrabold text-xs transition-all disabled:opacity-50 shadow-brand-glow shrink-0 flex items-center gap-1.5"
              >
                {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
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

      {isSnapshotDrawerOpen && (
        <LiveHealthSnapshotDrawer
          isOpen={isSnapshotDrawerOpen}
          onToggleOpen={() => setIsSnapshotDrawerOpen(false)}
          onCloseMobile={() => setIsSnapshotDrawerOpen(false)}
        />
      )}
    </div>
  );
}

export default AICoachClient;
