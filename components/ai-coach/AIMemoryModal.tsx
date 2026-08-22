"use client";

import React, { useState, useEffect } from "react";
import { Brain, Trash2, Edit2, Plus, Check, X, Loader2, AlertCircle } from "lucide-react";

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

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/ai/memories");
      if (res.ok) {
        const json = await res.json();
        setMemories(json.data || json.memories || []);
      } else {
        setError("Failed to load memories");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load memories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

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
        await loadMemories();
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
        await loadMemories();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0e121a] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Coach Memory Hub</h3>
              <p className="text-[11px] text-neutral-400">View, edit, or remove persistent preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
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
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
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
              <p className="text-xs text-neutral-400 font-medium">No saved memories yet</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                The AI Coach automatically saves dietary constraints and goals as you chat, or you can add them manually above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>Active Memories ({memories.length})</span>
                <button
                  onClick={handleClearAll}
                  className="text-rose-400 hover:text-rose-300 text-[11px] hover:underline"
                >
                  Clear All
                </button>
              </div>

              {memories.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-start justify-between gap-2 group hover:border-neutral-700 transition-colors"
                >
                  {editingId === m.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(m.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-neutral-800"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                            {m.category}
                          </span>
                          {m.source && (
                            <span className="text-[9px] text-neutral-500">
                              via {m.source.toLowerCase().replace("_", " ")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-200">{m.content}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setEditContent(m.content);
                          }}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Memories are strictly isolated to your user account.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
