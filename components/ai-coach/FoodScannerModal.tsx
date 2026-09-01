"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Upload,
  RefreshCw,
  X,
  CheckCircle2,
  Sparkles,
  Flame,
  Dna,
  Wheat,
  Droplet,
  FlipHorizontal,
  Sliders,
  Utensils,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export interface FoodScanResult {
  foodName: string;
  mealType: string;
  items: Array<{
    name: string;
    servingSize: number;
    servingUnit: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  }>;
  totals: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  micronutrients?: {
    iron?: number;
    calcium?: number;
    potassium?: number;
    magnesium?: number;
    zinc?: number;
    vitaminC?: number;
    vitaminA?: number;
    vitaminB12?: number;
  };
  confidence?: string;
  uncertaintyNotes?: string;
  ayurvedicNotes?: string;
}

interface FoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealLogged: (mealData: {
    foodName: string;
    mealType: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    micronutrients?: any;
  }) => void;
}

export function FoodScannerModal({ isOpen, onClose, onMealLogged }: FoodScannerModalProps) {
  const [mode, setMode] = useState<"CAMERA" | "PREVIEW" | "REVIEW">("CAMERA");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Editable fields in review mode
  const [editableName, setEditableName] = useState<string>("");
  const [editableMealType, setEditableMealType] = useState<string>("LUNCH");
  const [editableCalories, setEditableCalories] = useState<number>(0);
  const [editableProtein, setEditableProtein] = useState<number>(0);
  const [editableCarbs, setEditableCarbs] = useState<number>(0);
  const [editableFat, setEditableFat] = useState<number>(0);
  const [editableFiber, setEditableFiber] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setError("Camera permission denied or camera unavailable. Please upload a photo from your gallery instead.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && mode === "CAMERA") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, facingMode]);

  // Capture Snapshot from Camera Viewfinder
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const maxDim = 1200;
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setCapturedImage(dataUrl);
    stopCamera();
    analyzeImage(dataUrl);
  };

  // Handle Gallery Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(compressedDataUrl);
        stopCamera();
        analyzeImage(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Analyze Image via AI Vision Endpoint
  const analyzeImage = async (base64Img: string) => {
    setIsAnalyzing(true);
    setMode("PREVIEW");
    setError(null);

    try {
      const res = await fetch("/api/ai/vision/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Img,
          mealType: editableMealType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vision analysis failed");

      const result: FoodScanResult = data.data;
      setScanResult(result);
      setEditableName(result.foodName || "Scanned Meal");
      setEditableMealType(result.mealType || "LUNCH");
      setEditableCalories(result.totals.calories || 0);
      setEditableProtein(result.totals.protein || 0);
      setEditableCarbs(result.totals.carbohydrates || 0);
      setEditableFat(result.totals.fat || 0);
      setEditableFiber(result.totals.fiber || 0);

      setMode("REVIEW");
    } catch (err: any) {
      console.error("AI Scan error:", err);
      setError(err.message || "Could not recognize food from image. Please try another angle or good lighting.");
      setMode("PREVIEW");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and Log into Daily Nutrition Tracker
  const handleConfirmLog = async () => {
    if (!editableName.trim()) {
      setError("Please specify a meal name.");
      return;
    }

    setIsLogging(true);
    setError(null);

    try {
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Log directly to meals API
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: editableMealType,
          date: todayStr,
          entries: [
            {
              foodName: editableName.trim(),
              quantity: 1,
              quantityUnit: "serving",
              calories: Number(editableCalories),
              protein: Number(editableProtein),
              carbohydrates: Number(editableCarbs),
              fat: Number(editableFat),
              fiber: Number(editableFiber),
              iron: scanResult?.micronutrients?.iron,
              calcium: scanResult?.micronutrients?.calcium,
              potassium: scanResult?.micronutrients?.potassium,
              magnesium: scanResult?.micronutrients?.magnesium,
              zinc: scanResult?.micronutrients?.zinc,
              vitaminC: scanResult?.micronutrients?.vitaminC,
              vitaminA: scanResult?.micronutrients?.vitaminA,
              vitaminB12: scanResult?.micronutrients?.vitaminB12,
            },
          ],
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to record meal in nutrition system");
      }

      setIsSuccess(true);
      onMealLogged({
        foodName: editableName.trim(),
        mealType: editableMealType,
        calories: Number(editableCalories),
        protein: Number(editableProtein),
        carbohydrates: Number(editableCarbs),
        fat: Number(editableFat),
        fiber: Number(editableFiber),
        micronutrients: scanResult?.micronutrients,
      });

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error("Log error:", err);
      setError(err.message || "Failed to log meal to daily nutrition.");
    } finally {
      setIsLogging(false);
    }
  };

  const handleReset = () => {
    stopCamera();
    setCapturedImage(null);
    setScanResult(null);
    setError(null);
    setIsSuccess(false);
    setMode("CAMERA");
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-left">
      <div className="fixed inset-0 bg-black/60 -z-10" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-neutral-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <span>AI Food Scanner & Vision</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Beta
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">Instant photo nutrition estimation & 1-click logging</p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Meal logged successfully into your Daily Nutrition journal! 🥗✨</span>
            </div>
          )}

          {/* MODE 1: Camera Viewfinder */}
          {mode === "CAMERA" && (
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target Focus Overlay */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white/70 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                    Frame your plate or dish
                  </span>
                </div>

                {/* Flip camera button */}
                <button
                  onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  title="Switch Camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-bold rounded-xl border border-neutral-700 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload Image</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleCapture}
                  className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture & Analyze</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: Analyzing Preview */}
          {mode === "PREVIEW" && isAnalyzing && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">AI Vision Multimodal Processing</p>
                <p className="text-xs text-neutral-400 mt-1">Identifying visible ingredients, estimating calories, macros & vitamins...</p>
              </div>
            </div>
          )}

          {/* MODE 3: Review & Edit Nutrition Breakdown */}
          {mode === "REVIEW" && scanResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Photo Thumbnail + Meal Type */}
              <div className="flex items-center gap-4 bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                {capturedImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedImage}
                    alt="Scanned meal preview"
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-700 shrink-0"
                  />
                )}
                <div className="flex-1 space-y-1.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Meal Title</label>
                    <input
                      type="text"
                      value={editableName}
                      onChange={(e) => setEditableName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((mt) => (
                      <button
                        key={mt}
                        type="button"
                        onClick={() => setEditableMealType(mt)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer ${
                          editableMealType === mt
                            ? "bg-emerald-500 text-black"
                            : "bg-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {mt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editable Macros Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Estimated Macronutrients (Adjust if needed)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Editable</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Calories
                    </span>
                    <input
                      type="number"
                      value={editableCalories}
                      onChange={(e) => setEditableCalories(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white outline-none focus:border-amber-500"
                    />
                    <span className="text-[9px] text-neutral-500">kcal</span>
                  </div>

                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <Dna className="w-3 h-3" /> Protein
                    </span>
                    <input
                      type="number"
                      value={editableProtein}
                      onChange={(e) => setEditableProtein(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white outline-none focus:border-emerald-500"
                    />
                    <span className="text-[9px] text-neutral-500">grams</span>
                  </div>

                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Wheat className="w-3 h-3" /> Carbs
                    </span>
                    <input
                      type="number"
                      value={editableCarbs}
                      onChange={(e) => setEditableCarbs(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white outline-none focus:border-amber-400"
                    />
                    <span className="text-[9px] text-neutral-500">grams</span>
                  </div>

                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                      <Droplet className="w-3 h-3" /> Fat
                    </span>
                    <input
                      type="number"
                      value={editableFat}
                      onChange={(e) => setEditableFat(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white outline-none focus:border-rose-400"
                    />
                    <span className="text-[9px] text-neutral-500">grams</span>
                  </div>

                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 flex items-center gap-1">
                      <Utensils className="w-3 h-3" /> Fiber
                    </span>
                    <input
                      type="number"
                      value={editableFiber}
                      onChange={(e) => setEditableFiber(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-white outline-none focus:border-teal-400"
                    />
                    <span className="text-[9px] text-neutral-500">grams</span>
                  </div>
                </div>
              </div>

              {/* Identified Items Checklist */}
              {scanResult.items && scanResult.items.length > 0 && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <p className="text-[11px] font-bold text-neutral-300">Identified Food Components:</p>
                  <div className="space-y-1.5">
                    {scanResult.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-neutral-300 border-b border-neutral-900 pb-1 last:border-b-0">
                        <span>• {item.name} ({item.servingSize} {item.servingUnit})</span>
                        <span className="font-mono text-neutral-400">{item.calories} kcal &bull; {item.protein}g P</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uncertainty / Honest Estimation Note */}
              {scanResult.uncertaintyNotes && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Estimation Note:</strong> {scanResult.uncertaintyNotes}
                  </span>
                </div>
              )}

              {/* Micronutrients Badges */}
              {scanResult.micronutrients && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(scanResult.micronutrients).map(([k, v]) => {
                    if (!v || v === 0) return null;
                    return (
                      <span key={k} className="px-2 py-0.5 bg-neutral-800 rounded-md text-[10px] font-mono text-neutral-300 border border-neutral-700">
                        {k.replace("vitamin", "Vit ")}: {v}{k.includes("vitamin") ? "µg" : "mg"}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLogging}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  Retake Photo
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLog}
                  disabled={isLogging || isSuccess}
                  className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLogging ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Logging to Daily Nutrition...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Log into Daily Nutrition 🥗✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
