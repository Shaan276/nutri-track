import * as fs from "fs";

async function printDictionary() {
  const analysis = JSON.parse(fs.readFileSync("scripts/full-workbook-analysis.json", "utf-8"));
  const dict = analysis["Nutrient Dictionary"]?.rows || [];
  const targets = analysis["Nutrition Targets"]?.rows || [];
  const foodDbCols = analysis["Food Database"]?.headers || [];
  const foodLogCols = analysis["Food Log"]?.headers || [];
  const microCols = analysis["Micronutrients"]?.headers || [];
  const aminoCols = analysis["Amino Acids"]?.headers || [];
  const otherCols = analysis["Other Nutrients"]?.headers || [];
  const dailyCols = analysis["Daily Summary"]?.headers || [];

  console.log("==================================================================");
  console.log("📖 COMPLETE NUTRIENT DICTIONARY (ALL 63 NUTRIENTS)");
  console.log("==================================================================");
  dict.forEach((r: any, idx: number) => {
    const key = r[0];
    const name = r[1];
    const category = r[2];
    const unit = r[3];
    const targetType = r[4];
    console.log(`${idx + 1}. [${category}] key: "${key}" | "${name}" | Unit: ${unit} | Type: ${targetType}`);
  });

  console.log("\n==================================================================");
  console.log("🎯 NUTRITION TARGETS SAMPLE");
  console.log("==================================================================");
  targets.slice(0, 15).forEach((r: any) => {
    console.log(JSON.stringify(r));
  });

  console.log("\n==================================================================");
  console.log(`🥗 FOOD DATABASE COLUMNS (${foodDbCols.length} columns)`);
  console.log("==================================================================");
  console.log(foodDbCols.slice(0, 30));
  console.log(foodDbCols.slice(30));

  console.log("\n==================================================================");
  console.log(`📝 FOOD LOG COLUMNS (${foodLogCols.length} columns)`);
  console.log("==================================================================");
  console.log(foodLogCols);

  console.log("\n==================================================================");
  console.log(`💊 MICRONUTRIENTS SHEET COLUMNS (${microCols.length} columns)`);
  console.log("==================================================================");
  console.log(microCols);

  console.log("\n==================================================================");
  console.log(`🧬 AMINO ACIDS SHEET COLUMNS (${aminoCols.length} columns)`);
  console.log("==================================================================");
  console.log(aminoCols);

  console.log("\n==================================================================");
  console.log(`🧪 OTHER NUTRIENTS SHEET COLUMNS (${otherCols.length} columns)`);
  console.log("==================================================================");
  console.log(otherCols);

  console.log("\n==================================================================");
  console.log(`📅 DAILY SUMMARY SHEET COLUMNS (${dailyCols.length} columns)`);
  console.log("==================================================================");
  console.log(dailyCols);
}

printDictionary().catch(console.error);
