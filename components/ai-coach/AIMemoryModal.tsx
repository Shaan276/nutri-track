"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Trash2,
  Edit2,
  Plus,
  Check,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Flame,
  Clock,
  Save,
  Sliders,
  Calendar,
} from "lucide-react";

export interface AIMemoryItem {
  id: string;
  category: "PREFERENCE" | "NUTRITION" | "TRAINING" | "GOAL" | "CONSTRAINT" | "GENERAL";
  content: string;
  importance: number;
  source?: string;
  createdAt?: string;
}

interface AIMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryChanged?: () => void;
}

export function AIMemoryModal({ isOpen, onClose, onMemoryChanged }: AIMemoryModalProps) {
  const [activeTab, setActiveTab] = useState<"RULES" | "GOAL_RULES" | "MEMORIES">("RULES");

  // Rules State
  const [generalRules, setGeneralRules] = useState("");
  const [userCustomRules, setUserCustomRules] = useState("");
  const [goalRules, setGoalRules] = useState<any>(null);
  const [dynamicAge, setDynamicAge] = useState<{ years: number; days: number; formatted: string } | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [rulesSuccess, setRulesSuccess] = useState<string | null>(null);

  // Memories State
  const [memories, setMemories] = useState<AIMemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Memory State
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<AIMemoryItem["category"]>("PREFERENCE");
  const [isAdding, setIsAdding] = useState(false);

  // Editing Memory State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [memRes, rulesRes] = await Promise.all([
        fetch("/api/ai/memories"),
        fetch("/api/ai/rules"),
      ]);

      if (memRes.ok) {
        const json = await memRes.json();
        setMemories(json.data || json.memories || []);
      }

      if (rulesRes.ok) {
        const rulesJson = await rulesRes.json();
        if (rulesJson.data) {
          setGeneralRules(rulesJson.data.generalRules || "");
          setUserCustomRules(rulesJson.data.userCustomRules || "");
          setGoalRules(rulesJson.data.goalRules || null);
          setDynamicAge(rulesJson.data.dynamicAge || null);
          setPrimaryGoal(rulesJson.data.primaryGoal || "");
          setUserEmail(rulesJson.data.userEmail || "");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load rules and memories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleSaveCustomRules = async () => {
    setIsSavingRules(true);
    setRulesSuccess(null);
    try {
      const res = await fetch("/api/ai/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCustomRules }),
      });

      if (res.ok) {
        setRulesSuccess("Your personal AI rules were saved successfully for your email!");
        setTimeout(() => setRulesSuccess(null), 4000);
        onMemoryChanged?.();
      } else {
        throw new Error("Failed to save personal rules");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save personal rules");
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setIsAdding(true);
      const res = await fetch("/api/ai/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          importance: 2,
        }),
      });

      if (res.ok) {
        setNewContent("");
        await loadData();
        onMemoryChanged?.();
      }
    } catch (err) {
      console.error("Failed to add memory:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch(`/api/ai/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (res.ok) {
        setEditingId(null);
        await loadData();
        onMemoryChanged?.();
      }
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        onMemoryChanged?.();
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all saved AI memories? This action cannot be undone.")) return;

    try {
      const res = await fetch("/api/ai/memories?clearAll=true", { method: "DELETE" });
      if (res.ok) {
        setMemories([]);
        onMemoryChanged?.();
      }
    } catch (err) {
      console.error("Failed to clear memories:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0e121a] border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">AI Governance & Coaching Rules</h3>
                {dynamicAge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono">
                    🎂 {dynamicAge.formatted}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Ayurveda priority, modern science synergy, personalized goal rules & memories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab("RULES")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "RULES"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            General Rules & Overrides
          </button>

          <button
            onClick={() => setActiveTab("GOAL_RULES")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "GOAL_RULES"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Personalized Goal Rules
          </button>

          <button
            onClick={() => setActiveTab("MEMORIES")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "MEMORIES"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Saved Facts & Preferences ({memories.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: GENERAL RULES & USER OVERRIDES */}
          {activeTab === "RULES" && (
            <div className="space-y-4">
              {/* General Rules (Admin Configured) */}
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>System General AI Rules (Admin Configured)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-medium">
                    🌿 Ayurveda + Modern Science Priority
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 text-neutral-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {generalRules || "1. Ayurveda-First Priority\n2. Modern Science Synergy\n3. Warm Empathy & Live Emojis\n4. Exact Calories & Micronutrients"}
                </div>
                <p className="text-[11px] text-neutral-500">
                  These system principles apply universally to ensure Ayurvedic wisdom, high empathy, and exact nutritional accuracy.
                </p>
              </div>

              {/* Personal Rule Overrides (For this User Email Only) */}
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Your Personal Rule Overrides ({userEmail || "Your Account"})</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                    Private to your email
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={userCustomRules}
                  onChange={(e) => setUserCustomRules(e.target.value)}
                  placeholder="e.g. Always prioritize vegetarian North Indian dishes, avoid refined oils, suggest post-dinner warm turmeric milk, 16:8 intermittent fasting..."
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                />

                {rulesSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{rulesSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-neutral-500">
                    These rules take precedence specifically when coaching your account.
                  </p>
                  <button
                    onClick={handleSaveCustomRules}
                    disabled={isSavingRules}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSavingRules ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save My Rules
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONALIZED GOAL RULES */}
          {activeTab === "GOAL_RULES" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Goal Focus: {goalRules?.goalCategory || primaryGoal || "BALANCED WEIGHT"}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                    Predefined & Adaptive
                  </span>
                </div>

                {/* Primary Directives */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-300">Target Coaching Directives:</span>
                  <div className="space-y-1.5">
                    {(goalRules?.primaryRules || []).map((rule: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/70 text-xs text-neutral-200 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ayurveda Focus */}
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30 space-y-1">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>🌿 Ayurvedic Synergy</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-mono">
                    {goalRules?.ayurvedaFocus || "Tridoshic balance and seasonal Ahara Rasas."}
                  </p>
                </div>

                {/* Modern Science Focus */}
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/30 space-y-1">
                  <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <span>🔬 Modern Nutritional Science Focus</span>
                  </div>
                  <p className="text-xs text-blue-200/90 leading-relaxed font-mono">
                    {goalRules?.modernScienceFocus || "Evidence-based energy expenditure and macronutrient distribution."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED MEMORIES & PREFERENCES */}
          {activeTab === "MEMORIES" && (
            <div className="space-y-4">
              {/* Add New Memory Form */}
              <form onSubmit={handleAddMemory} className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2.5">
                <div className="text-xs font-semibold text-neutral-300">Add Preference / Constraint</div>
                <div className="flex gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    <option value="PREFERENCE">Preference</option>
                    <option value="CONSTRAINT">Constraint</option>
                    <option value="NUTRITION">Nutrition</option>
                    <option value="TRAINING">Training</option>
                    <option value="GOAL">Goal</option>
                    <option value="GENERAL">General</option>
                  </select>
                  <input
                    type="text"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="e.g. Vegetarian, training for 10k, no dairy..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 placeholder-neutral-500"
                  />
                  <button
                    type="submit"
                    disabled={isAdding || !newContent.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add
                  </button>
                </div>
              </form>

              {/* Memories List */}
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-500 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  Loading AI memories...
                </div>
              ) : memories.length === 0 ? (
                <div className="py-8 text-center bg-neutral-900/20 border border-neutral-800/60 rounded-xl p-4">
                  <Brain className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-neutral-300">No memories saved yet</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    As you chat with the coach, key dietary constraints and goals will be automatically captured here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memories.map((mem) => {
                    const isEditing = editingId === mem.id;
                    return (
                      <div
                        key={mem.id}
                        className="p-3 bg-neutral-900/40 hover:bg-neutral-900/70 border border-neutral-800/70 rounded-xl flex items-center justify-between gap-3 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium shrink-0 ${
                              mem.category === "NUTRITION"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                : mem.category === "TRAINING"
                                ? "bg-blue-950 text-blue-400 border border-blue-800/40"
                                : mem.category === "CONSTRAINT"
                                ? "bg-rose-950 text-rose-400 border border-rose-800/40"
                                : mem.category === "GOAL"
                                ? "bg-amber-950 text-amber-400 border border-amber-800/40"
                                : "bg-purple-950 text-purple-400 border border-purple-800/40"
                            }`}
                          >
                            {mem.category}
                          </span>

                          {isEditing ? (
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="flex-1 bg-neutral-950 border border-neutral-700 text-neutral-200 px-2 py-1 rounded text-xs focus:outline-none focus:border-purple-500"
                              autoFocus
                            />
                          ) : (
                            <span className="text-neutral-200 truncate">{mem.content}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(mem.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 rounded transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(mem.id);
                                  setEditContent(mem.content);
                                }}
                                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                                title="Edit memory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMemory(mem.id)}
                                className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                                title="Delete memory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between text-xs">
          {activeTab === "MEMORIES" && memories.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="text-neutral-500 hover:text-rose-400 text-xs transition-colors cursor-pointer"
            >
              Clear all memories
            </button>
          ) : (
            <span className="text-neutral-500 text-[11px]">
              {dynamicAge ? `🎂 Age increments dynamically every day` : `Active AI Governance`}
            </span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
