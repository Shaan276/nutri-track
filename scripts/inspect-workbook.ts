import * as fs from "fs";

async function inspectAllSheets() {
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

  const results: Record<string, any> = {};

  for (const sheetName of knownSheets) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;
      const res = await fetch(url);
      const text = await res.text();

      // Extract JSON from google.visualization.Query.setResponse(...)
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        const cols = parsed.table?.cols || [];
        const rows = parsed.table?.rows || [];

        // Extract first 10 rows of values to understand the headers & structure
        const sampleRows = rows.slice(0, 15).map((r: any) =>
          (r.c || []).map((cell: any) => (cell ? (cell.f ? `FORMULA[${cell.f}]:${cell.v}` : cell.v) : null))
        );

        results[sheetName] = {
          status: "FOUND",
          totalRows: rows.length,
          colsCount: cols.length,
          sampleRows,
        };
        console.log(`\n======================================================`);
        console.log(`📊 SHEET: "${sheetName}" | Cols: ${cols.length} | Rows: ${rows.length}`);
        console.log(`======================================================`);
        sampleRows.slice(0, 6).forEach((row: any[], i: number) => {
          console.log(`Row ${i + 1}:`, JSON.stringify(row.filter((x: any) => x !== null).slice(0, 12)));
        });
      } else {
        results[sheetName] = { status: "PARSE_ERROR", preview: text.substring(0, 200) };
        console.log(`\n❌ SHEET: "${sheetName}" - parse error / not found`);
      }
    } catch (err: any) {
      results[sheetName] = { status: "FETCH_ERROR", error: err.message };
      console.log(`\n❌ SHEET: "${sheetName}" - error:`, err.message);
    }
  }

  fs.writeFileSync(
    "scripts/workbook-inspection-result.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\nInspection complete! Full details saved to scripts/workbook-inspection-result.json");
}

inspectAllSheets().catch(console.error);
