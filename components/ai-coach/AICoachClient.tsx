"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { GoalConfirmationCard } from "./GoalConfirmationCard";
import { LiveHealthSnapshotDrawer } from "./LiveHealthSnapshotDrawer";
import { AIMemoryModal } from "./AIMemoryModal";
import { WeeklyPlanModal } from "./WeeklyPlanModal";

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

const QUICK_PROMPTS = [
  "Plan my week",
  "Review my week",
  "How much protein do I have left today?",
  "Estimate calories burned for a 45 min run",
  "Which micronutrients am I low in?",
  "Recommend a high-protein vegetarian meal",
  "Set my protein target to 150g",
];

export function AICoachClient() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState(false);

  // Live health metrics snapshot
  const [healthSnapshot, setHealthSnapshot] = useState<any>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [isSnapshotOpenMobile, setIsSnapshotOpenMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // 1. Initial Load: Conversations, Health Context Snapshot
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsInitialLoading(true);
        setErrorMessage(null);

        // Fetch conversations & health snapshot in parallel
        const [convRes] = await Promise.all([
          fetch("/api/ai/conversations").catch(() => null),
          loadHealthSnapshot(),
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

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 2. Load messages for selected conversation
  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Load messages error:", err);
    }
  };

  const handleSelectConversation = async (convId: string) => {
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

  // 6. Send User Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText("");
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
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convIdToUse,
          message: text,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get AI response");
      }

      const data = await res.json();

      // Replace messages with updated assistant response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, data.userMessage, data.assistantMessage];
      });

      // Update conversation title if provided
      if (data.conversationTitle && convIdToUse) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convIdToUse ? { ...c, title: data.conversationTitle } : c))
        );
      }

      // Refresh health context snapshot in background to reflect any new memories or logged state
      loadHealthSnapshot();
    } catch (err: any) {
      console.error("Send message error:", err);
      // Append friendly assistant message so the user is never left hanging
      const fallbackAssistantMsg: MessageItem = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content:
          "🤖 **AI Coach is currently unavailable at the moment.**\n\nPlease configure an active OpenAI API key in the [Admin Settings](/admin/settings) or contact the administrator.\n\nIn the meantime, you can track your nutrition, hydration, workouts, and runs directly from your Dashboard!",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackAssistantMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    <div className="flex h-[calc(100vh-4rem)] bg-black text-neutral-100 overflow-hidden">
      {/* 1. Left Conversation Sidebar Drawer */}
      <div
        className={`fixed inset-y-16 left-0 z-30 w-72 bg-neutral-950 border-r border-neutral-800 transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
              className="md:hidden p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={handleNewConversation}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-emerald-500/50"
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
            <span>Powered by <strong>gpt-4o-mini</strong> with 3-key fallback</span>
          </div>
        </div>
      </div>

      {/* 2. Center Main Chat Panel */}
      <div className="flex-1 flex flex-col h-full bg-black min-w-0">
        {/* Chat Header */}
        <div className="h-14 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">
                  {conversations.find((c) => c.id === activeConvId)?.title || "AI Health & Fitness Coach"}
                </span>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
                  Live Grounded
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Personalized nutrition, running analysis & workout intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWeeklyPlanModalOpen(true)}
              className="py-1.5 px-2.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1.5 transition-colors"
              title="View Weekly Health & Fitness Blueprint"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline font-medium">Weekly Blueprint</span>
            </button>

            <button
              onClick={() => setIsMemoryModalOpen(true)}
              className="py-1.5 px-2.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 flex items-center gap-1.5 transition-colors"
              title="Manage AI Memories & Saved Constraints"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline font-medium">Memories</span>
            </button>

            <button
              onClick={() => setIsSnapshotOpenMobile(true)}
              className="py-1.5 px-2.5 rounded-lg text-xs bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-800/50 flex items-center gap-1.5 transition-colors lg:hidden"
              title="View Live Health Context Snapshot"
            >
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-medium">Snapshot</span>
            </button>

            <button
              onClick={handleNewConversation}
              className="py-1.5 px-3 rounded-lg text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
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
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-neutral-900/90 border border-neutral-800 text-neutral-100 rounded-bl-none"
                      }`}
                    >
                      {isUser ? msg.content : renderFormattedMessage(msg.content)}
                    </div>

                    {/* Tool badges */}
                    {!isUser && metadata.toolsExecuted && metadata.toolsExecuted.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-1">
                        {metadata.toolsExecuted.map((tool: string, tIdx: number) => (
                          <span
                            key={tIdx}
                            className="text-[10px] text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800"
                          >
                            ⚡ {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* In-chat Goal Confirmation Card */}
                    {!isUser && proposal && (
                      <GoalConfirmationCard
                        proposal={proposal}
                        onConfirmed={async () => {
                          await loadHealthSnapshot();
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
            <span className="text-[10px] uppercase font-semibold text-neutral-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Suggestions:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="py-1 px-2.5 rounded-full text-[11px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your nutrition, workouts, running, or goals..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none disabled:opacity-50"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-30 disabled:hover:bg-emerald-500 transition-colors"
              title="Send message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Right Live Health Snapshot Drawer */}
      <LiveHealthSnapshotDrawer
        snapshot={healthSnapshot}
        isLoading={isSnapshotLoading}
        onRefresh={loadHealthSnapshot}
        onDeleteMemory={handleDeleteMemory}
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
    </div>
  );
}
