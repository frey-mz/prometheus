import type { DailyStockData } from "@/types/stock-data";

// JSON numbers do not retain trailing zeroes, so format price tokens explicitly.
export function formatStockJson(data: DailyStockData[]): string {
  if (!data.length) return "[]";
  return `[\n${data.map((row) =>
    `  {\n    "day": ${JSON.stringify(row.day)},\n    "lowAverage": ${row.lowAverage.toFixed(4)},\n    "highAverage": ${row.highAverage.toFixed(4)},\n    "volume": ${row.volume}\n  }`
  ).join(",\n")}\n]`;
}
