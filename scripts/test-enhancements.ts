/**
 * Test suite for:
 * 1. AI Multi-log Hydration & Timestamp Disaggregation
 * 2. Food Database Ingredient & Recipe Auto-calculation
 */

import assert from "assert";

function runTests() {
  console.log("================================================================================");
  console.log("🧪 TESTING MULTI-LOG DISAGGREGATION & RECIPE AUTO-CALCULATION");
  console.log("================================================================================\n");

  // 1. Test multi-entry water parsing regex & extraction
  const inputPrompt = "TODAYS' WATER LOGS ARE : 500 ml morning water(0540hrs), 1L water more(1100 hrs) and then 200ml more(1300hrs)";
  const waterRegex = /(\d+(?:\.\d+)?)\s*(ml|litres?|l)\s*([^,;()]+)?(?:\((?:at\s*)?([^\)]+)\))?/gi;
  const matches = [...inputPrompt.matchAll(waterRegex)];

  console.log("Parsing prompt:", inputPrompt);
  console.log("Found matches:", matches.length);

  assert(matches.length === 3, "Expected 3 distinct water entries");

  const entries: Array<{ amountMl: number; notes: string; time?: string }> = [];
  let totalMl = 0;

  for (const m of matches) {
    let num = parseFloat(m[1]);
    const unit = (m[2] || "").toLowerCase();
    if (unit.startsWith("l")) num = num * 1000;

    const rawNote = (m[3] || "").trim();
    const rawTimeOrTag = (m[4] || "").trim();

    let note = rawNote || "Water";
    if (rawTimeOrTag) {
      note = `${note} (${rawTimeOrTag})`.trim();
    }

    let time = "";
    if (rawTimeOrTag) {
      const tMatch = rawTimeOrTag.match(/(\d{1,4})\s*(?:hrs?|am|pm)?/i);
      if (tMatch) {
        const rawNum = tMatch[1];
        if (rawNum.length === 4) {
          time = `${rawNum.substring(0, 2)}:${rawNum.substring(2, 4)}`;
        } else if (rawNum.length === 3) {
          time = `0${rawNum.substring(0, 1)}:${rawNum.substring(1, 3)}`;
        } else if (rawNum.length <= 2) {
          time = `${rawNum.padStart(2, "0")}:00`;
        }
      }
    }

    entries.push({
      amountMl: Math.round(num),
      notes: note,
      time: time || undefined,
    });
    totalMl += Math.round(num);
  }

  assert(entries[0].amountMl === 500 && entries[0].time === "05:40", "Entry 1: 500ml at 05:40");
  assert(entries[1].amountMl === 1000 && entries[1].time === "11:00", "Entry 2: 1000ml at 11:00");
  assert(entries[2].amountMl === 200 && entries[2].time === "13:00", "Entry 3: 200ml at 13:00");
  assert(totalMl === 1700, "Total water sum is 1700 ml");

  console.log("✅ [PASS] 1. Multi-entry hydration parsing with timestamps succeeded (3 distinct entries, 1700 ml total)");

  // 2. Test Recipe calculation formula
  // E.g. Paneer Bhurji with 4 Rotis:
  // - 150g Raw Paneer (265 kcal, 18.3g P, 3.4g C, 20.8g F per 100g)
  // - 120g Atta Flour (340 kcal, 12g P, 70g C, 2g F per 100g)
  // - 10g Olive Oil (884 kcal, 0g P, 0g C, 100g F per 100g)
  const ingredients = [
    { name: "Raw Paneer", qty: 150, baseSize: 100, cals: 265, p: 18.3, c: 3.4, f: 20.8 },
    { name: "Whole Wheat Atta", qty: 120, baseSize: 100, cals: 340, p: 12.0, c: 70.0, f: 2.0 },
    { name: "Olive Oil", qty: 10, baseSize: 100, cals: 884, p: 0.0, c: 0.0, f: 100.0 },
  ];

  let calcCals = 0;
  let calcP = 0;
  let calcC = 0;
  let calcF = 0;

  for (const item of ingredients) {
    const ratio = item.qty / item.baseSize;
    calcCals += item.cals * ratio;
    calcP += item.p * ratio;
    calcC += item.c * ratio;
    calcF += item.f * ratio;
  }

  calcCals = Math.round(calcCals * 10) / 10;
  calcP = Math.round(calcP * 10) / 10;
  calcC = Math.round(calcC * 10) / 10;
  calcF = Math.round(calcF * 10) / 10;

  // Expected:
  // Paneer: 397.5 kcal, 27.45g P, 5.1g C, 31.2g F
  // Atta: 408 kcal, 14.4g P, 84g C, 2.4g F
  // Oil: 88.4 kcal, 0g P, 0g C, 10g F
  // Total: 893.9 kcal, 41.85g P, 89.1g C, 43.6g F
  assert(calcCals === 893.9, `Calculated calories expected 893.9, got ${calcCals}`);
  assert(Math.abs(calcP - 41.9) < 0.1, `Calculated protein expected ~41.9g, got ${calcP}`);
  assert(Math.abs(calcC - 89.1) < 0.1, `Calculated carbs expected ~89.1g, got ${calcC}`);
  assert(Math.abs(calcF - 43.6) < 0.1, `Calculated fat expected ~43.6g, got ${calcF}`);

  console.log(`✅ [PASS] 2. Recipe auto-calculator verified: ${calcCals} kcal, ${calcP}g P, ${calcC}g C, ${calcF}g F`);

  console.log("\n================================================================================");
  console.log("📊 ALL ENHANCEMENT TESTS PASSED (100%)");
  console.log("================================================================================");
}

runTests();
