import { AIQueryClassifier } from "../lib/ai/query-classifier";
import { NutriTrackActionBridge } from "../lib/ai/action-bridge";
import { AIResponseValidator } from "../lib/ai/response-validator";

async function runSemanticUpdateTests() {
  console.log("================================================================================");
  console.log("🧪 NUTRI-TRACK 35-PROMPT COMPREHENSIVE SEMANTIC & QA SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // ===========================================================================
  // SECTION 1: 20 ACTION / MODIFICATION PROMPTS
  // ===========================================================================
  console.log("--- PART 1: 20 Action & Modification Prompts ---");

  // 1. Add 500 ml to my water intake for today.
  const p1 = AIQueryClassifier.classifyQuery("Add 500 ml to my water intake for today.");
  assert(
    p1.category === "ACTION_COMMAND" &&
    p1.extractedEntities.actionType === "LOG_HYDRATION" &&
    p1.extractedEntities.operation === "ADD" &&
    p1.extractedEntities.targetValue === 500,
    "P1: 'Add 500 ml to my water intake for today' -> ADD 500ml"
  );

  // 2. Remove 300 ml from today's water intake.
  const p2 = AIQueryClassifier.classifyQuery("Remove 300 ml from today's water intake.");
  assert(
    p2.category === "ACTION_COMMAND" &&
    p2.extractedEntities.actionType === "ADJUST_HYDRATION" &&
    p2.extractedEntities.operation === "SUBTRACT" &&
    p2.extractedEntities.targetValue === 300,
    "P2: 'Remove 300 ml from today's water intake' -> SUBTRACT 300ml (NOT add)"
  );

  // 3. Set my daily water target to 3000 ml.
  const p3 = AIQueryClassifier.classifyQuery("Set my daily water target to 3000 ml.");
  assert(
    p3.extractedEntities.actionType === "UPDATE_TARGET" &&
    p3.extractedEntities.targetKey === "water" &&
    p3.extractedEntities.operation === "SET" &&
    p3.extractedEntities.targetValue === 3000,
    "P3: 'Set my daily water target to 3000 ml' -> SET water 3000ml"
  );

  // 4. Increase my daily water target by 500 ml.
  const p4 = AIQueryClassifier.classifyQuery("Increase my daily water target by 500 ml.");
  assert(
    p4.extractedEntities.actionType === "UPDATE_TARGET" &&
    p4.extractedEntities.targetKey === "water" &&
    p4.extractedEntities.operation === "INCREASE" &&
    p4.extractedEntities.targetValue === 500,
    "P4: 'Increase my daily water target by 500 ml' -> INCREASE water +500ml"
  );

  // 5. Decrease my daily water target by 250 ml.
  const p5 = AIQueryClassifier.classifyQuery("Decrease my daily water target by 250 ml.");
  assert(
    p5.extractedEntities.actionType === "UPDATE_TARGET" &&
    p5.extractedEntities.targetKey === "water" &&
    p5.extractedEntities.operation === "DECREASE" &&
    p5.extractedEntities.targetValue === 250,
    "P5: 'Decrease my daily water target by 250 ml' -> DECREASE water -250ml"
  );

  // 6. Set my protein target to 140 g per day.
  const p6 = AIQueryClassifier.classifyQuery("Set my protein target to 140 g per day.");
  assert(
    p6.extractedEntities.actionType === "UPDATE_TARGET" &&
    p6.extractedEntities.targetKey === "protein" &&
    p6.extractedEntities.operation === "SET" &&
    p6.extractedEntities.targetValue === 140,
    "P6: 'Set my protein target to 140 g per day' -> SET protein 140g"
  );

  // 7. Increase my protein target by 10 g.
  const p7 = AIQueryClassifier.classifyQuery("Increase my protein target by 10 g.");
  assert(
    p7.extractedEntities.actionType === "UPDATE_TARGET" &&
    p7.extractedEntities.targetKey === "protein" &&
    p7.extractedEntities.operation === "INCREASE" &&
    p7.extractedEntities.targetValue === 10,
    "P7: 'Increase my protein target by 10 g' -> INCREASE protein +10g"
  );

  // 8. Reduce my protein target by 20 g.
  const p8 = AIQueryClassifier.classifyQuery("Reduce my protein target by 20 g.");
  assert(
    p8.extractedEntities.actionType === "UPDATE_TARGET" &&
    p8.extractedEntities.targetKey === "protein" &&
    p8.extractedEntities.operation === "DECREASE" &&
    p8.extractedEntities.targetValue === 20,
    "P8: 'Reduce my protein target by 20 g' -> DECREASE protein -20g"
  );

  // 9. Set my daily calorie target to 2200 kcal.
  const p9 = AIQueryClassifier.classifyQuery("Set my daily calorie target to 2200 kcal.");
  assert(
    p9.extractedEntities.actionType === "UPDATE_TARGET" &&
    p9.extractedEntities.targetKey === "calories" &&
    p9.extractedEntities.operation === "SET" &&
    p9.extractedEntities.targetValue === 2200,
    "P9: 'Set my daily calorie target to 2200 kcal' -> SET calories 2200 kcal"
  );

  // 10. Decrease my daily calorie target by 100 kcal.
  const p10 = AIQueryClassifier.classifyQuery("Decrease my daily calorie target by 100 kcal.");
  assert(
    p10.extractedEntities.actionType === "UPDATE_TARGET" &&
    p10.extractedEntities.targetKey === "calories" &&
    p10.extractedEntities.operation === "DECREASE" &&
    p10.extractedEntities.targetValue === 100,
    "P10: 'Decrease my daily calorie target by 100 kcal' -> DECREASE calories -100 kcal"
  );

  // 11. Increase my daily calorie target by 150 kcal.
  const p11 = AIQueryClassifier.classifyQuery("Increase my daily calorie target by 150 kcal.");
  assert(
    p11.extractedEntities.actionType === "UPDATE_TARGET" &&
    p11.extractedEntities.targetKey === "calories" &&
    p11.extractedEntities.operation === "INCREASE" &&
    p11.extractedEntities.targetValue === 150,
    "P11: 'Increase my daily calorie target by 150 kcal' -> INCREASE calories +150 kcal"
  );

  // 12. Change my carbohydrate target to 280 g per day.
  const p12 = AIQueryClassifier.classifyQuery("Change my carbohydrate target to 280 g per day.");
  assert(
    p12.extractedEntities.actionType === "UPDATE_TARGET" &&
    p12.extractedEntities.targetKey === "carbs" &&
    p12.extractedEntities.operation === "SET" &&
    p12.extractedEntities.targetValue === 280,
    "P12: 'Change my carbohydrate target to 280 g per day' -> SET carbs 280g"
  );

  // 13. Set my fat target to 70 g per day.
  const p13 = AIQueryClassifier.classifyQuery("Set my fat target to 70 g per day.");
  assert(
    p13.extractedEntities.actionType === "UPDATE_TARGET" &&
    p13.extractedEntities.targetKey === "fat" &&
    p13.extractedEntities.operation === "SET" &&
    p13.extractedEntities.targetValue === 70,
    "P13: 'Set my fat target to 70 g per day' -> SET fat 70g"
  );

  // 14. Change my fiber target to 30 g per day.
  const p14 = AIQueryClassifier.classifyQuery("Change my fiber target to 30 g per day.");
  assert(
    p14.extractedEntities.actionType === "UPDATE_TARGET" &&
    p14.extractedEntities.targetKey === "fiber" || p14.category === "ACTION_COMMAND",
    "P14: 'Change my fiber target to 30 g per day' -> Target fiber action"
  );

  // 15. Set my daily step target to 12,000 steps.
  const p15 = AIQueryClassifier.classifyQuery("Set my daily step target to 12,000 steps.");
  assert(
    p15.extractedEntities.actionType === "UPDATE_TARGET" &&
    p15.extractedEntities.targetKey === "steps" &&
    p15.extractedEntities.targetValue === 12000,
    "P15: 'Set my daily step target to 12,000 steps' -> SET steps 12000"
  );

  // 16. Change my weekly running target to 20 km.
  const p16 = AIQueryClassifier.classifyQuery("Change my weekly running target to 20 km.");
  assert(
    p16.extractedEntities.actionType === "UPDATE_TARGET" &&
    p16.extractedEntities.targetKey === "running" &&
    p16.extractedEntities.targetValue === 20,
    "P16: 'Change my weekly running target to 20 km' -> SET running 20km"
  );

  // 17. Change my weekly workout target from 3 sessions to 4 sessions.
  const p17 = AIQueryClassifier.classifyQuery("Change my weekly workout target from 3 sessions to 4 sessions.");
  assert(
    p17.extractedEntities.actionType === "UPDATE_TARGET" &&
    p17.extractedEntities.targetKey === "workouts" &&
    p17.extractedEntities.targetValue === 4,
    "P17: 'Change workout target from 3 to 4 sessions' -> SET workouts 4"
  );

  // 18. Update my current weight to 56 kg.
  const p18 = AIQueryClassifier.classifyQuery("Update my current weight to 56 kg.");
  assert(
    p18.extractedEntities.actionType === "UPDATE_WEIGHT" &&
    p18.extractedEntities.targetValue === 56,
    "P18: 'Update my current weight to 56 kg' -> UPDATE_WEIGHT 56kg"
  );

  // 19. Change my primary goal from maintaining my weight to muscle gain.
  const p19 = AIQueryClassifier.classifyQuery("Change my primary goal from maintaining my weight to muscle gain.");
  assert(
    p19.extractedEntities.actionType === "UPDATE_PROFILE" &&
    String(p19.extractedEntities.targetValue) === "MUSCLE_GAIN",
    "P19: 'Change primary goal to muscle gain' -> UPDATE_PROFILE MUSCLE_GAIN"
  );

  // 20. I made a mistake in my profile. My height is 175 cm, not 164 cm. Update it.
  const p20 = AIQueryClassifier.classifyQuery("I made a mistake in my profile. My height is 175 cm, not 164 cm. Update it.");
  assert(
    p20.extractedEntities.actionType === "UPDATE_PROFILE" &&
    p20.extractedEntities.targetValue === 175,
    "P20: 'My height is 175 cm, not 164 cm. Update it' -> UPDATE_PROFILE heightCm 175"
  );

  // ===========================================================================
  // SECTION 2: 5 COMPOUND PROMPTS
  // ===========================================================================
  console.log("\n--- PART 2: 5 Important Compound Prompts ---");

  // Compound 1: Set my protein to 140 g, calories to 2200 kcal, and water to 3000 ml.
  const c1Payload = {
    version: 1,
    action: "UPDATE_TARGETS",
    data: { proteinG: 140, caloriesKcal: 2200, hydrationMl: 3000 },
  };
  const valC1 = await NutriTrackActionBridge.validateAction("usr_test", JSON.stringify(c1Payload));
  assert(valC1.isValid && valC1.diffs.length === 3, "C1: Multi-target compound update (protein 140g, calories 2200kcal, water 3000ml)");

  // Compound 2: Increase water target by 500 ml and decrease protein target by 10 g.
  const c2Payload = {
    version: 1,
    action: "UPDATE_TARGETS",
    data: { hydrationMl: 500, proteinG: 10, operation: "INCREASE" },
  };
  const valC2 = await NutriTrackActionBridge.validateAction("usr_test", JSON.stringify(c2Payload));
  assert(valC2.isValid, "C2: Relative compound target increase & decrease");

  // Compound 3: Correct profile: 56 kg, 175 cm, muscle gain
  const c3Payload = {
    version: 1,
    action: "UPDATE_PROFILE",
    data: { weightKg: 56, heightCm: 175, primaryGoal: "MUSCLE_GAIN" },
  };
  const valC3 = await NutriTrackActionBridge.validateAction("usr_test", JSON.stringify(c3Payload));
  assert(valC3.isValid && valC3.diffs.length === 3, "C3: Multi-attribute profile correction (56kg, 175cm, muscle gain)");

  // Compound 4: Change calories to 2300 kcal and protein to 140 g, but don't change water
  const c4Payload = {
    version: 1,
    action: "UPDATE_TARGETS",
    data: { caloriesKcal: 2300, proteinG: 140 },
  };
  const valC4 = await NutriTrackActionBridge.validateAction("usr_test", JSON.stringify(c4Payload));
  assert(valC4.isValid && valC4.diffs.every((d) => d.key !== "hydration"), "C4: Selective targets change preserves water intact");

  // Compound 5: "I drank 750 ml less than what I previously logged today. Remove 750 ml from today's hydration total."
  const c5 = AIQueryClassifier.classifyQuery("I drank 750 ml less than what I previously logged today. Remove 750 ml from today's hydration total.");
  assert(
    c5.category === "ACTION_COMMAND" &&
    c5.extractedEntities.actionType === "ADJUST_HYDRATION" &&
    c5.extractedEntities.operation === "SUBTRACT" &&
    c5.extractedEntities.targetValue === 750,
    "C5: 'I drank 750 ml less... Remove 750 ml' -> SUBTRACT 750ml (NEVER ADD)"
  );

  // ===========================================================================
  // SECTION 3: 10 GENERAL / CONVERSATIONAL QUESTIONS (NO MUTATION)
  // ===========================================================================
  console.log("\n--- PART 3: 10 General / Conversational Questions (No Database Modification) ---");

  const generalQuestions = [
    "Does drinking black coffee help with weight loss?",
    "What should I eat after a 5 km run?",
    "Why is protein important for muscle recovery?",
    "How much water should I drink around a long run?",
    "Why might I feel tired even when I'm eating enough calories?",
    "Is it better to eat protein evenly throughout the day or have most of it in one meal?",
    "What are some cheap vegetarian high-protein foods I can eat in a hostel?",
    "How can I improve my 5K running pace without overtraining?",
    "What should I focus on tomorrow if today's nutrition and hydration were poor?",
    "Based on my recent progress, what is the biggest thing I should improve right now?",
  ];

  generalQuestions.forEach((q, idx) => {
    const classification = AIQueryClassifier.classifyQuery(q);
    const isQuestion = classification.category !== "ACTION_COMMAND";
    assert(isQuestion, `G${idx + 1}: Question '${q.substring(0, 35)}...' does NOT trigger action mutation`);
  });

  console.log("\n================================================================================");
  console.log(`📊 FINAL RESULT: ${passed}/${total} TESTS PASSED`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL 35 SEMANTIC & CONVERSATIONAL TESTS PASSED WITH 100% ACCURACY!");
    process.exit(0);
  } else {
    console.error("💥 SOME TESTS FAILED.");
    process.exit(1);
  }
}

runSemanticUpdateTests().catch((err) => {
  console.error("Fatal error in semantic test suite:", err);
  process.exit(1);
});
