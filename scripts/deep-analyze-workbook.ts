import * as fs from "fs";

async function deepAnalyze() {
  const spreadsheetId = "19EFB0ufPY8YHNbLp0PTwrJuFJJVz_6lz-ofau3TSxsY";
  const knownSheets = [
    "Dashboard",
    "System Guide",
    "Food Log",
    "Micronutrients",
    "Amino Acids",
    "Other Nutrients",
    "Daily Summary",
    "Deficiency Tracker",
    "Nutrition Targets",
    "Food Database",
    "AI Suggestions",
    "Nutrient Dictionary",
    "Lists",
    "Data Quality"
  ];

  const analysis: Record<string, any> = {};

  for (const sheet of knownSheets) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheet)}&tqx=out:json`;
      const res = await fetch(url);
      const text = await res.text();
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        const cols = parsed.table?.cols || [];
        const rows = parsed.table?.rows || [];

        const allRows = rows.map((r: any) =>
          (r.c || []).map((cell: any) => {
            if (!cell) return null;
            if (cell.f) return { formula: cell.f, value: cell.v };
            return cell.v;
          })
        );

        analysis[sheet] = {
          colsCount: cols.length,
          rowsCount: rows.length,
          headers: allRows[0] || [],
          rows: allRows,
        };
      }
    } catch (err: any) {
      analysis[sheet] = { error: err.message };
    }
  }

  fs.writeFileSync("scripts/full-workbook-analysis.json", JSON.stringify(analysis, null, 2));

  console.log("\n=======================================================");
  console.log("📑 SUMMARY OF ALL SHEETS IN NUTRITION COACH WORKBOOK");
  console.log("=======================================================");
  for (const [name, data] of Object.entries(analysis)) {
    if (data.error) {
      console.log(`❌ ${name}: ERROR ${data.error}`);
    } else {
      console.log(`\n📌 SHEET: "${name}" (${data.colsCount} cols, ${data.rowsCount} rows)`);
      console.log(`Headers:`, JSON.stringify(data.headers));
      if (name === "Nutrient Dictionary") {
        console.log(`\n--- ALL NUTRIENTS IN NUTRIENT DICTIONARY ---`);
        data.rows.slice(0, 100).forEach((r: any, idx: number) => {
          if (idx === 0) return; // skip header
          const key = r[0];
          const label = r[1];
          const category = r[2];
          const unit = r[3];
          console.log(`  [${category}] ${key} (${label}) -> Unit: ${unit}`);
        });
      }
    }
  }
}

deepAnalyze().catch(console.error);
