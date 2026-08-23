"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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

const ANCHOR_PROMPTS = [
  "Plan my week",
  "Review my week",
];

const DYNAMIC_PROMPT_POOL = [
  "How much protein do I have left today?",
  "Which micronutrients am I low in?",
  "Recommend a high-protein vegetarian meal",
  "Estimate calories burned for a 45 min run",
  "Best pre-run carbs for a morning 10k run",
  "How can I boost my Vitamin D & B12 naturally?",
  "Suggest a quick 500 kcal muscle recovery snack",
  "Calculate nutrition for 2 paneer rotis and mixed daal",
  "What should I eat to hit my carbs without spiking fat?",
  "How does my running pace affect calorie burn?",
  "Foods high in magnesium for better sleep & muscle relaxation",
  "How to maximize plant-based iron absorption with Vitamin C?",
  "Suggest a rest day nutrition plan",
  "High-protein breakfast under 400 kcal",
  "Hydration strategy for long distance running",
  "How much iron and calcium have I had today?",
  "Post-workout meal to stop muscle breakdown",
  "Healthiest Indian dinner options for runners",
  "Set my daily water goal to 3000ml",
  "Set my protein target to 150g",
  "Give me 3 actionable tips for faster recovery",
  "Analyze my hydration trend for this week",
  "High-protein vegan meal with 30g protein",
  "Quick 10-minute high-protein dinner recipe",
  "Is my sodium-potassium electrolyte balance on track?",
];

function getRandomPromptSuggestions(count: number = 7): string[] {
  const shuffled = [...DYNAMIC_PROMPT_POOL].sort(() => 0.5 - Math.random());
  const anchors = [...ANCHOR_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 1);
  const combined = Array.from(new Set([...anchors, ...shuffled])).slice(0, count);
  return combined;
}

export function AICoachClient() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);

  useEffect(() => {
    setQuickPrompts(getRandomPromptSuggestions(7));
  }, []);

  const handleShufflePrompts = () => {
    setQuickPrompts(getRandomPromptSuggestions(7));
  };

  // Modals state
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);
  const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [isTTSVoiceEnabled, setIsTTSVoiceEnabled] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState<string>("NOT_STARTED");

  const searchParams = useSearchParams();

  // Load TTS preference from local storage
  useEffect(() => {
    try {
      const savedTTS = localStorage.getItem("nt_ai_tts_enabled");
      if (savedTTS === "true") setIsTTSVoiceEnabled(true);
    } catch {}
  }, []);

  const toggleTTSVoice = () => {
    setIsTTSVoiceEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nt_ai_tts_enabled", String(next));
      } catch {}
      if (!next && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const speakText = (text: string) => {
    if (!isTTSVoiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Clean excessive markdown and URLs for natural speaking
      const cleanText = text
        .replace(/[*#_`~[\]()]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[•⚡🌱🔬💪💧🥗🔥🎯🍳🥣🍗🍚🧘🚀🧡🥄🫖🥜🌾]/g, "")
        .trim();
      if (!cleanText) return;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS speak notice:", err);
    }
  };

  // Live health metrics snapshot
  const [healthSnapshot, setHealthSnapshot] = useState<any>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [isSnapshotOpenDesktop, setIsSnapshotOpenDesktop] = useState(true);
  const [isSnapshotOpenMobile, setIsSnapshotOpenMobile] = useState(false);

  const handleToggleSnapshot = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      setIsSnapshotOpenDesktop((prev) => !prev);
    } else {
      setIsSnapshotOpenMobile((prev) => !prev);
    }
  };

  // Voice & Image Input States
  const [isListening, setIsListening] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(false);
  const baseTextRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false);

  const toggleListening = async () => {
    if (isListening || shouldKeepListeningRef.current) {
      shouldKeepListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
          recognitionRef.current.stop?.();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    try {
      // Ensure microphone permission is granted and audio track is active
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permErr) {
          console.warn("Microphone permission check:", permErr);
        }
      }

      baseTextRef.current = inputText.trim();
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";
      recognition.maxAlternatives = 1;

      shouldKeepListeningRef.current = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let accumulated = "";
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript + " ";
        }
        const fullText = baseTextRef.current
          ? `${baseTextRef.current} ${accumulated.trim()}`
          : accumulated.trim();
        setInputText(fullText);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldKeepListeningRef.current = false;
          setIsListening(false);
          alert("Microphone permission was denied. Please allow microphone access in your browser settings to use voice input.");
        }
        // Don't terminate for momentary pauses or silence
      };

      recognition.onend = () => {
        // Safe delayed restart to let browser audio pipeline reset cleanly
        if (shouldKeepListeningRef.current) {
          setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              try {
                recognition.start();
              } catch (startErr) {
                console.warn("Speech restart retry:", startErr);
              }
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition init error:", err);
      shouldKeepListeningRef.current = false;
      setIsListening(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be under 10MB.");
      return;
    }

    setSelectedImageName(file.name);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setSelectedImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedImageBase64(null);
    setSelectedImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadHealthSnapshot = async () => {
    try {
      setIsSnapshotLoading(true);
      const localDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in user's local timezone
      const res = await fetch(`/api/health-context/snapshot?date=${localDate}`);
      if (res.ok) {
        const data = await res.json();
        setHealthSnapshot(data.data || null);
      }
    } catch (err) {
      console.error("Failed to load health snapshot:", err);
    } finally {
      setIsSnapshotLoading(false);
    }
  };

  const loadAssessmentStatus = async () => {
    try {
      const res = await fetch("/api/ai/assessment/status");
      if (res.ok) {
        const data = await res.json();
        setAssessmentStatus(data.status || "NOT_STARTED");
      }
    } catch {}
  };

  const handleTriggerAssessment = async () => {
    try {
      setIsLoading(true);
      setIsQuestionnaireOpen(true);
      const res = await fetch("/api/ai/assessment/start", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) {
          setActiveConvId(data.conversationId);
          setMessages(data.messages || []);
          setAssessmentStatus("IN_PROGRESS");
          // Add to conversations list if not present
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === data.conversationId);
            if (exists) return prev;
            return [
              {
                id: data.conversationId,
                title: "Health & Goal Assessment",
                lastMessageAt: new Date().toISOString(),
                messageCount: (data.messages || []).length,
              },
              ...prev,
            ];
          });
        }
      }
    } catch (err) {
      console.error("Trigger assessment error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealLoggedFromScanner = (mealData: any) => {
    loadHealthSnapshot();
    // Add assistant acknowledgment into chat
    const logNotice: MessageItem = {
      id: `scan_notice_${Date.now()}`,
      role: "assistant",
      content: `📸 **Scanned Meal Logged Successfully!** 🥗✨\n\n• **Dish**: ${mealData.foodName} (${mealData.mealType})\n• **Nutrition**: ${mealData.calories} kcal | ${mealData.protein}g Protein | ${mealData.carbohydrates}g Carbs | ${mealData.fat}g Fat | ${mealData.fiber}g Fiber\n\nYour daily totals, macros, and Dynamic Nutrition targets have been updated in real-time! 🚀💪`,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, logNotice]);
    speakText(`Logged ${mealData.foodName} into your ${mealData.mealType} log!`);
  };

  // Check ?mode=assessment on mount
  useEffect(() => {
    if (searchParams && searchParams.get("mode") === "assessment") {
      handleTriggerAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 1. Initial Load: Conversations, Health Context Snapshot, Assessment Status
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsInitialLoading(true);
        setErrorMessage(null);

        // Fetch conversations & health snapshot & assessment status in parallel
        const [convRes] = await Promise.all([
          fetch("/api/ai/conversations").catch(() => null),
          loadHealthSnapshot(),
          loadAssessmentStatus(),
        ]);

        if (convRes?.ok) {
          const convData = await convRes.json();
          setConversations(convData.conversations || []);
          const defaultId = convData.defaultConversationId || convData.conversations?.[0]?.id;
          if (defaultId) {
            setActiveConvId(defaultId);
            await loadMessages(defaultId);
          }
        }
      } catch (err: any) {
        console.error("Initial load error:", err);
        setErrorMessage("Failed to load coach conversations.");
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // 2. Resilient message loader
  const loadMessages = async (convId: string, isPoll = false) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        const fetchedMsgs: MessageItem[] = data.messages || [];
        setMessages(fetchedMsgs);

        // Check if the latest message is a user prompt without an assistant reply yet
        const lastMsg = fetchedMsgs[fetchedMsgs.length - 1];
        const msgAgeMs = lastMsg ? Date.now() - new Date(lastMsg.createdAt).getTime() : Infinity;

        if (lastMsg && lastMsg.role === "user" && msgAgeMs < 25000 && isSendingRef.current) {
          setIsLoading(true);
          if (pollingRef.current) clearTimeout(pollingRef.current);
          pollingRef.current = setTimeout(() => {
            loadMessages(convId, true);
          }, 1500);
        } else {
          if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
          }
          if (!isSendingRef.current) {
            setIsLoading(false);
          }
        }
      }
    } catch (err) {
      console.error("Load messages error:", err);
      if (!isPoll && !isSendingRef.current) setIsLoading(false);
    }
  };

  // Re-sync messages on window focus or tab visibility change without re-executing
  useEffect(() => {
    const handleFocusSync = () => {
      if (document.visibilityState === "visible" && activeConvId && !isSendingRef.current) {
        loadMessages(activeConvId, false);
        loadHealthSnapshot();
      }
    };

    window.addEventListener("focus", handleFocusSync);
    document.addEventListener("visibilitychange", handleFocusSync);
    return () => {
      window.removeEventListener("focus", handleFocusSync);
      document.removeEventListener("visibilitychange", handleFocusSync);
    };
  }, [activeConvId]);

  const handleSelectConversation = async (convId: string) => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setActiveConvId(convId);
    setSidebarOpen(false);
    await loadMessages(convId);
  };

  // 3. Create New Conversation
  const handleNewConversation = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setMessages([
          {
            id: `init_${Date.now()}`,
            role: "assistant",
            content: "Hello! I am your Nutri-Track AI Coach. How can I help you optimize your health, nutrition, or training today?",
            createdAt: new Date().toISOString(),
          },
        ]);
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error("Create conversation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Delete Conversation
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const res = await fetch(`/api/ai/conversations/${convId}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConvId === convId) {
          const remaining = conversations.filter((c) => c.id !== convId);
          if (remaining.length > 0) {
            setActiveConvId(remaining[0].id);
            await loadMessages(remaining[0].id);
          } else {
            await handleNewConversation();
          }
        }
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  // 5. Delete AI Memory
  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const res = await fetch(`/api/ai/memories?id=${memoryId}`, { method: "DELETE" });
      if (res.ok) {
        await loadHealthSnapshot();
      }
    } catch (err) {
      console.error("Delete memory error:", err);
    }
  };

  // 6. Stop AI Generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
      abortControllerRef.current = null;
    }
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    isSendingRef.current = false;
    setIsLoading(false);
  };

  // 7. Send User Message
  const handleSendMessage = async (textToSend?: string) => {
    const imageToSend = selectedImageBase64;
    const text = (textToSend || inputText).trim();
    if ((!text && !imageToSend) || isSendingRef.current) return;

    isSendingRef.current = true;
    setInputText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setSelectedImageBase64(null);
    setSelectedImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    shouldKeepListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort?.();
        recognitionRef.current.stop?.();
      } catch {}
      setIsListening(false);
    }
    setErrorMessage(null);

    // Auto-resolve or create active conversation if not ready yet
    let convIdToUse = activeConvId;
    if (!convIdToUse) {
      try {
        const convRes = await fetch("/api/ai/conversations", { method: "POST" });
        if (convRes.ok) {
          const newConv = await convRes.json();
          convIdToUse = newConv.id;
          setActiveConvId(newConv.id);
          setConversations((prev) => [newConv, ...prev]);
        }
      } catch {
        // Fallback
      }
    }

    // Optimistically add user message
    const tempUserMsg: MessageItem = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: text || "📸 [Attached Food Image for Nutrition Analysis]",
      metadata: imageToSend ? { hasImage: true, imagePreview: imageToSend } : undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convIdToUse,
          message: text,
          imageBase64: imageToSend,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get AI response");
      }

      const data = await res.json();

      // Replace messages with updated assistant response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        const assistantMsg = data.assistantMessage || {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: "I've processed your request! 🥗✨",
          createdAt: new Date().toISOString(),
        };
        return [...filtered, data.userMessage || tempUserMsg, assistantMsg];
      });

      // Update conversation title if provided
      if (data.conversationTitle && convIdToUse) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convIdToUse ? { ...c, title: data.conversationTitle } : c))
        );
      }

      // Refresh health context snapshot in background to reflect any new memories or logged state
      loadHealthSnapshot();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("nutritrack:data-updated"));
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("AI response stopped by user.");
        setMessages((prev) => [
          ...prev,
          {
            id: `stop_${Date.now()}`,
            role: "assistant",
            content: "⏹️ *Response generation was stopped.*",
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        console.error("Send message error:", err);
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            tempUserMsg,
            {
              id: `err_${Date.now()}`,
              role: "assistant",
              content: err.message || "I ran into a temporary hiccup processing your request. Please try again! 🥗✨",
              createdAt: new Date().toISOString(),
            },
          ];
        });
      }
    } finally {
      abortControllerRef.current = null;
      isSendingRef.current = false;
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
    }
  };

  // Helper to format assistant response markdown (bold, lists, code)
  const renderFormattedMessage = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Bold rendering
      let formattedLine: React.ReactNode = line;
      if (line.includes("**")) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        formattedLine = parts.map((p, pIdx) => {
          if (p.startsWith("**") && p.endsWith("**")) {
            return <strong key={pIdx} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
          }
          return p;
        });
      }

      // Bullet points
      if (line.trim().startsWith("• ") || line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-neutral-200 my-0.5">
            {typeof formattedLine === "string" ? formattedLine.replace(/^[\s•*-]+/, "") : formattedLine}
          </li>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 leading-relaxed text-neutral-200">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="flex h-full w-full bg-background-midnight text-neutral-100 overflow-hidden relative">
      {/* 1. Left Conversation Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-neutral-950 border-r border-neutral-800 transition-all duration-300 md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:-ml-64"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm tracking-wide text-white">AI Coach</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={handleNewConversation}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-emerald-500/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Conversations
            </div>
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isActive
                      ? "bg-neutral-900 text-white font-medium border border-neutral-800 shadow-sm"
                      : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-neutral-600"}`} />
                    <span className="truncate">{conv.title || "New Conversation"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Powered by <strong>Google Gemini Engine</strong></span>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile conversation sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      {/* 2. Center Main Chat Panel */}
      <div className="flex-1 flex flex-col h-full bg-black min-w-0 overflow-hidden">
        {/* Chat Header */}
        <div className="h-14 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 shrink-0 cursor-pointer"
              title="Toggle conversations sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-xs sm:text-sm text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                  {conversations.find((c) => c.id === activeConvId)?.title || "AI Health & Fitness Coach"}
                </h2>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Grounded
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden xl:block truncate">
                Personalized nutrition, running analysis & workout intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={toggleTTSVoice}
              className={`py-1.5 px-2 sm:px-2.5 rounded-lg text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isTTSVoiceEnabled
                  ? "bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border-amber-500/80 shadow-xs"
                  : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800"
              }`}
              title={isTTSVoiceEnabled ? "Voice Speech Output is ON (Click to mute)" : "Enable AI Voice Speech Output 🔊"}
            >
              {isTTSVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden sm:inline font-medium">Voice</span>
            </button>

            <button
              onClick={() => {
                if (!isQuestionnaireOpen) {
                  handleTriggerAssessment();
                } else {
                  setIsQuestionnaireOpen(false);
                }
              }}
              className={`py-1.5 px-2 sm:px-2.5 rounded-lg text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isQuestionnaireOpen || assessmentStatus === "IN_PROGRESS"
                  ? "bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-200 border-emerald-500/80 shadow-xs"
                  : assessmentStatus === "COMPLETED"
                  ? "bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border-neutral-800"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 animate-pulse"
              }`}
              title="AI Health Assessment & Goal Discovery"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline font-medium">
                {assessmentStatus === "COMPLETED" ? "Assessment ✓" : "Assessment"}
              </span>
            </button>

            <button
              onClick={() => setIsWeeklyPlanModalOpen(true)}
              className="py-1.5 px-2 sm:px-2.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Weekly Health & Fitness Blueprint"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline font-medium">Blueprint</span>
            </button>

            <button
              onClick={() => setIsMemoryModalOpen(true)}
              className="py-1.5 px-2 sm:px-2.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Manage AI Memories & Constraints"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="hidden sm:inline font-medium">Memories</span>
            </button>

            <button
              onClick={handleToggleSnapshot}
              className={`py-1.5 px-2 sm:px-2.5 rounded-lg text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
                (isSnapshotOpenDesktop || isSnapshotOpenMobile)
                  ? "bg-sky-950/80 hover:bg-sky-900/90 text-sky-200 border-sky-600/80 shadow-xs"
                  : "bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border-sky-800/50"
              }`}
              title="Toggle Live Health Snapshot Sidebar"
            >
              <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="hidden sm:inline font-medium">Snapshot</span>
            </button>

            <button
              onClick={handleNewConversation}
              className="py-1.5 px-2.5 sm:px-3 rounded-lg text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Start New Conversation"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {isQuestionnaireOpen && (
            <AssessmentQuestionnaireWidget
              onSubmitAnswers={(textPayload) => {
                setIsQuestionnaireOpen(false);
                handleSendMessage(textPayload);
              }}
            />
          )}

          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs">Initializing AI Coach & connecting live database...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 text-center text-neutral-400 max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-base text-white">Your Nutri-Track AI Coach</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Ask about today&apos;s remaining macros, estimate exercise calories, check micronutrient gaps, or analyze running pace trends.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const metadata = msg.metadata || {};
              const proposal = metadata.proposedGoal;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : "mr-auto justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[88%] sm:max-w-2xl ${isUser ? "items-end" : "items-start"}`}>
                    {isUser && metadata?.imagePreview && (
                      <div className="mb-2 max-w-xs overflow-hidden rounded-xl border border-emerald-500/40 shadow-sm ml-auto">
                        <img src={metadata.imagePreview} alt="Logged meal photo" className="w-full h-auto object-cover max-h-48" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-neutral-900/90 border border-neutral-800 text-neutral-100 rounded-bl-none"
                      }`}
                    >
                      {isUser ? msg.content : renderFormattedMessage(msg.content)}
                    </div>

                    {/* Tool badges & action confirmations */}
                    {!isUser && ((metadata.executedActions && metadata.executedActions.length > 0) || (metadata.toolsExecuted && metadata.toolsExecuted.length > 0)) && (
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {(metadata.executedActions || metadata.toolsExecuted.map((t: string) => ({ toolName: t, success: true }))).map((act: any, tIdx: number) => {
                          const name = typeof act === "string" ? act : act.toolName;
                          const isOk = typeof act === "object" ? act.success !== false : true;
                          const cleanLabel = name
                            .replace(/_/g, " ")
                            .replace(/^log /, "logged ")
                            .replace(/^update /, "updated ")
                            .replace(/^create /, "created ")
                            .replace(/^delete /, "deleted ");
                          return (
                            <span
                              key={tIdx}
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border shadow-2xs ${
                                isOk
                                  ? "text-emerald-300 bg-emerald-950/40 border-emerald-800/60"
                                  : "text-rose-300 bg-rose-950/40 border-rose-800/60"
                              }`}
                            >
                              <Zap className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                              <span className="capitalize">{cleanLabel}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* In-chat Goal Confirmation Card */}
                    {!isUser && proposal && (
                      <GoalConfirmationCard
                        proposal={proposal}
                        onConfirmed={async () => {
                          await loadHealthSnapshot();
                        }}
                        onModify={(text) => {
                          setInputText(text);
                          inputRef.current?.focus();
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-md mr-auto">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-bl-none bg-neutral-900/90 border border-neutral-800 flex items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Analyzing data and preparing response...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel */}
        <div className="px-4 py-2 bg-neutral-950/60 border-t border-neutral-900/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={handleShufflePrompts}
              title="Shuffle prompt suggestions"
              className="text-[10px] uppercase font-semibold text-neutral-400 hover:text-emerald-400 flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3 h-3 text-emerald-400" />
              <span>New Ideas</span>
            </button>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="py-1 px-2.5 rounded-full text-[11px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Selected Image Preview Pill */}
            {selectedImageBase64 && (
              <div className="mb-2 flex items-center gap-2.5 p-2 bg-neutral-900 border border-emerald-500/40 rounded-xl max-w-sm shadow-md animate-fadeIn">
                <img
                  src={selectedImageBase64}
                  alt="Meal preview"
                  className="w-12 h-12 object-cover rounded-lg border border-neutral-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{selectedImageName || "Meal Photo"}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <Sparkles className="w-2.5 h-2.5" /> Food image attached for AI recognition
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Hidden File Input for Camera/Gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
              {/* Live Camera Food Scanner Button */}
              <button
                type="button"
                onClick={() => setIsFoodScannerOpen(true)}
                disabled={isLoading}
                className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                title="Scan food with AI Camera Vision & Viewfinder 📸"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Gallery Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                title="Upload meal photo from gallery / files 🖼️"
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              {/* Speech-to-Text Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={isLoading}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40 ring-2 ring-rose-400"
                    : "text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800"
                }`}
                title={isListening ? "Listening to your voice... (Click to stop)" : "Voice speech-to-text input 🎙️"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? "Listening... Speak your meal or question now"
                    : selectedImageBase64
                    ? "Add a note (e.g. 'Lunch at cafe') or hit send to scan photo..."
                    : "Ask coach, log meal, or upload food photo... (Shift+Enter for new line)"
                }
                disabled={isLoading}
                className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none disabled:opacity-50 min-w-0 resize-none max-h-36 overflow-y-auto leading-relaxed"
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all cursor-pointer shrink-0 flex items-center justify-center shadow-md shadow-rose-900/30 hover:scale-105 active:scale-95"
                  title="Stop generating response ⏹️"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() && !selectedImageBase64}
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-30 disabled:hover:bg-emerald-500 transition-colors cursor-pointer shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Floating Expand Tab for Live Health Snapshot on Desktop */}
        {!isSnapshotOpenDesktop && (
          <button
            onClick={() => setIsSnapshotOpenDesktop(true)}
            className="hidden xl:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 py-3 px-1.5 bg-neutral-900/95 hover:bg-neutral-800 border-l border-y border-neutral-700 rounded-l-xl text-neutral-400 hover:text-emerald-400 shadow-2xl items-center gap-1 transition-all cursor-pointer group"
            title="Expand Live Health Snapshot"
          >
            <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Right Live Health Snapshot Drawer */}
      <LiveHealthSnapshotDrawer
        snapshot={healthSnapshot}
        isLoading={isSnapshotLoading}
        onRefresh={loadHealthSnapshot}
        onDeleteMemory={handleDeleteMemory}
        isOpen={isSnapshotOpenDesktop}
        onToggleOpen={() => setIsSnapshotOpenDesktop((prev) => !prev)}
        isMobileOpen={isSnapshotOpenMobile}
        onCloseMobile={() => setIsSnapshotOpenMobile(false)}
      />

      {/* 4. AI Memories Hub Modal */}
      <AIMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        onMemoryChanged={loadHealthSnapshot}
      />

      {/* 5. Weekly Blueprint & Retrospective Modal */}
      <WeeklyPlanModal
        isOpen={isWeeklyPlanModalOpen}
        onClose={() => setIsWeeklyPlanModalOpen(false)}
      />

      {/* 6. Live Food Camera & Vision Scanner Modal */}
      <FoodScannerModal
        isOpen={isFoodScannerOpen}
        onClose={() => setIsFoodScannerOpen(false)}
        onMealLogged={handleMealLoggedFromScanner}
      />
    </div>
  );
}
