"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Target,
  Home,
  Clock,
  Utensils,
  Moon,
  Dumbbell,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AssessmentQuestionnaireWidgetProps {
  onSubmitAnswers: (formattedAnswers: string) => void;
}

export function AssessmentQuestionnaireWidget({ onSubmitAnswers }: AssessmentQuestionnaireWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Biometrics (Optional for initial entry / update)
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [biologicalSex, setBiologicalSex] = useState<string>("MALE");

  const [primaryGoal, setPrimaryGoal] = useState<string>("FAT_LOSS");
  const [specificTarget, setSpecificTarget] = useState<string>("");
  const [livingSituation, setLivingSituation] = useState<string>("WITH_FAMILY");
  const [dailyRoutine, setDailyRoutine] = useState<string>("Desk job / Moderate sitting (6-8 hrs)");
  const [dietaryStyle, setDietaryStyle] = useState<string>("Vegetarian");
  const [whoCooks, setWhoCooks] = useState<string>("Family / Cook");
  const [sleepHours, setSleepHours] = useState<string>("7-8 hours");
  const [trainingTypes, setTrainingTypes] = useState<string[]>(["Running", "Gym Workouts"]);
  const [constraints, setConstraints] = useState<string>("");

  const toggleTraining = (type: string) => {
    setTrainingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const livingFormatted: Record<string, string> = {
      WITH_FAMILY: "With Family (Shared traditional home meals, partial recipe control)",
      LIVING_ALONE: "Living Alone (Cook & shop for myself, active household routine)",
      HOSTEL_DORMITORY: "Hostel / Dormitory (Mess food, limited kitchen, need practical protein additions)",
      SHARED_FLAT: "Shared Accommodation / Flatmates",
    };

    const goalFormatted: Record<string, string> = {
      FAT_LOSS: "Fat Loss & Leaning Down",
      MUSCLE_GAIN: "Muscle Gain & Hypertrophy",
      WEIGHT_MAINTENANCE: "Weight Maintenance & General Health",
      RUNNING_PERFORMANCE: "Running Endurance & 5k/10k Performance",
      STRENGTH: "Strength & Powerlifting",
    };

    let textPayload = `Here are my comprehensive health assessment answers: 📋✨\n\n`;
    if (heightCm || weightKg) {
      textPayload += `0. 📏 **Biometrics**: ${heightCm ? `${heightCm} cm` : "Height not specified"}${weightKg ? ` | ${weightKg} kg` : ""}${age ? ` | ${age} yrs` : ""}${biologicalSex ? ` | ${biologicalSex}` : ""}\n`;
    }
    textPayload += `1. 🎯 **Primary Goal**: ${goalFormatted[primaryGoal] || primaryGoal}\n`;
    if (specificTarget) textPayload += `2. 📏 **Specific Target & Timeline**: ${specificTarget}\n`;
    textPayload += `3. 🏠 **Living Situation**: ${livingFormatted[livingSituation] || livingSituation}\n`;
    textPayload += `4. 🕒 **Daily Routine**: ${dailyRoutine}\n`;
    textPayload += `5. 🥗 **Dietary Style & Cooking**: ${dietaryStyle}, prepared by ${whoCooks}\n`;
    textPayload += `6. 💤 **Sleep & Recovery**: ${sleepHours}\n`;
    textPayload += `7. 🏃‍♂️ **Training Priorities**: ${trainingTypes.join(", ") || "General Fitness"}\n`;
    if (constraints) textPayload += `8. ⚠️ **Important Constraints**: ${constraints}\n`;
    textPayload += `\nPlease analyze these answers alongside my biometric profile, calculate my optimal daily calories, protein, carbs, fats, fiber, and water targets, and propose my personalized blueprint! 🎯🚀`;

    onSubmitAnswers(textPayload);
  };

  return (
    <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-surface-card space-y-4 text-left my-3 animate-fade-in">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>Interactive Health Assessment Questionnaire</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                All-in-One
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">Answer together to generate your personalized targets</p>
          </div>
        </div>

        <button className="p-1 text-neutral-400 hover:text-white rounded-lg">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-neutral-800 text-xs">
          {/* Optional Biometrics Entry Section */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3 space-y-2">
            <label className="font-bold text-neutral-300 flex items-center gap-1.5">
              <span>📏 Physical Biometrics (Enter or Update)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Height (cm)</span>
                <input
                  type="number"
                  placeholder="e.g. 175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Weight (kg)</span>
                <input
                  type="number"
                  placeholder="e.g. 70"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Age</span>
                <input
                  type="number"
                  placeholder="e.g. 26"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Biological Sex</span>
                <select
                  value={biologicalSex}
                  onChange={(e) => setBiologicalSex(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1.5 text-white outline-none focus:border-emerald-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
          {/* 1. Primary Goal */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Primary Goal Priority</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "FAT_LOSS", label: "🔥 Fat Loss" },
                { key: "MUSCLE_GAIN", label: "💪 Muscle Gain" },
                { key: "RUNNING_PERFORMANCE", label: "🏃‍♂️ Running Endurance" },
                { key: "WEIGHT_MAINTENANCE", label: "⚖️ Maintenance" },
                { key: "STRENGTH", label: "🏋️ Strength" },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setPrimaryGoal(g.key)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    primaryGoal === g.key
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Specific Target & Timeline */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-300">2. Specific Target & Timeline (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Lose 4kg in 8 weeks, Run 10k in under 55 mins"
              value={specificTarget}
              onChange={(e) => setSpecificTarget(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500"
            />
          </div>

          {/* 3. Living Situation */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-300 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>3. Living Situation (Adapts meal strategies)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: "WITH_FAMILY", label: "👨‍👩‍👦 With Family", desc: "Shared traditional home cooking" },
                { key: "LIVING_ALONE", label: "🍳 Living Alone", desc: "Cook & shop for myself" },
                { key: "HOSTEL_DORMITORY", label: "🏢 Hostel / Dormitory", desc: "Mess food, limited kitchen" },
                { key: "SHARED_FLAT", label: "🤝 Shared Flat", desc: "Roommates / split cooking" },
              ].map((ls) => (
                <button
                  key={ls.key}
                  type="button"
                  onClick={() => setLivingSituation(ls.key)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    livingSituation === ls.key
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <p className="font-bold text-xs text-white">{ls.label}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{ls.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Dietary Style & Cooking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-neutral-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Dietary Preference</span>
              </label>
              <select
                value={dietaryStyle}
                onChange={(e) => setDietaryStyle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
              >
                <option value="Vegetarian">🌱 Vegetarian</option>
                <option value="Eggetarian">🥚 Eggetarian (Eggs + Dairy)</option>
                <option value="Non-Vegetarian (Chicken/Fish/Eggs)">🍗 Non-Vegetarian</option>
                <option value="Vegan">🥑 Vegan (Strict Plant-based)</option>
                <option value="Jain Vegetarian">🌿 Jain Vegetarian (No root veg)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>5. Daily Routine</span>
              </label>
              <select
                value={dailyRoutine}
                onChange={(e) => setDailyRoutine(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
              >
                <option value="Desk job / Sedentary (6-8 hrs sitting)">Desk job / 6-8 hrs sitting</option>
                <option value="Student / Mixed sitting and walking">Student / Mixed walking</option>
                <option value="Active standing / Commuting on foot">Active on feet / Commuting</option>
                <option value="Physical labor / High daily steps">High physical activity</option>
              </select>
            </div>
          </div>

          {/* 5. Training Priorities (Multi-select) */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-300 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-rose-400" />
              <span>6. Training Priorities</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["Running", "Gym Workouts", "Home Workouts", "Walking", "HIIT & Cardio", "Yoga & Mobility"].map((t) => {
                const isSelected = trainingTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTraining(t)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Constraints / Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-300">7. Constraints or Injuries (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Mild knee soreness, lactose sensitive, busy Mondays"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder:text-neutral-600 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-600 active:to-teal-600 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Submit Assessment Answers & Propose Blueprint 🚀✨</span>
          </button>
        </form>
      )}
    </div>
  );
}
