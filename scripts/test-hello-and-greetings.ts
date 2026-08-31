import { AIClient } from "../lib/ai/ai-client";
import { AIQueryClassifier } from "../lib/ai/query-classifier";

async function testGreetingsAndQuickLog() {
  console.log("================================================================================");
  console.log("🧪 TESTING GREETINGS, QUESTIONS & QUICK LOG DECOUPLING");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, desc: string, detail?: string) {
    total++;
    if (cond) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // 1. Classification of "Hello"
  const qHello = AIQueryClassifier.classifyQuery("Hello");
  assert(qHello.category === "CASUAL_CHAT", "1. 'Hello' classified as CASUAL_CHAT", JSON.stringify(qHello));

  // 2. Response to "Hello"
  const resHello = await AIClient.generateCoachResponse(
    "User context",
    [],
    "Hello",
    { userId: "usr_test" }
  );
  assert(
    !resHello.reply.includes("Sorry, I couldn't generate") &&
    resHello.reply.length > 5 &&
    (resHello.reply.toLowerCase().includes("hello") || resHello.reply.toLowerCase().includes("hey") || resHello.reply.toLowerCase().includes("help")),
    "2. 'Hello' generates warm response without error: " + resHello.reply.substring(0, 60) + "..."
  );

  // 3. Response to "Hi Coach!"
  const resHi = await AIClient.generateCoachResponse(
    "User context",
    [],
    "Hi Coach!",
    { userId: "usr_test" }
  );
  assert(
    !resHi.reply.includes("Sorry, I couldn't generate") && resHi.reply.length > 5,
    "3. 'Hi Coach!' generates valid response: " + resHi.reply.substring(0, 60) + "..."
  );

  // 4. Response to "Does drinking black coffee help with weight loss?"
  const resCoffee = await AIClient.generateCoachResponse(
    "User context",
    [],
    "Does drinking black coffee help with weight loss?",
    { userId: "usr_test" }
  );
  assert(
    !resCoffee.reply.includes("Sorry, I couldn't generate") &&
    (resCoffee.reply.toLowerCase().includes("coffee") || resCoffee.reply.toLowerCase().includes("calorie")),
    "4. Coffee question answers properly: " + resCoffee.reply.substring(0, 60) + "..."
  );

  console.log("\n================================================================================");
  console.log(`📊 FINAL RESULT: ${passed}/${total} TESTS PASSED`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL GREETING & CONVERSATIONAL TESTS PASSED!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testGreetingsAndQuickLog().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
