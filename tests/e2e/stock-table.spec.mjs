import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { parseHistoryPage } from "../yahoo-history.mjs";

const historyHtml = readFileSync(new URL("../fixtures/tsla-history.html", import.meta.url), "utf8");
const history = parseHistoryPage(historyHtml).sort((a, b) => a.day.localeCompare(b.day));
const chart = JSON.parse(readFileSync(new URL("../fixtures/tsla-chart.json", import.meta.url), "utf8"));
const result = chart.chart.result[0];
const quote = result.indicators.quote[0];
const exactRows = result.timestamp.map((timestamp, index) => [
  new Date(timestamp * 1000).toISOString().slice(0, 10),
  quote.low[index].toFixed(4),
  quote.high[index].toFixed(4),
  String(quote.volume[index]).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
]).sort((a, b) => a[0].localeCompare(b[0]));

async function tableCells(table) {
  return table.locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) => Array.from(row.cells, (cell) => cell.textContent.trim())),
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByLabel("Stock ticker").fill("TSLA");
  await page.getByRole("button", { name: "Show chart" }).click();
  await expect(page.getByRole("table", { name: "TSLA daily price data", exact: true })).toBeVisible();
});

test("displayed table matches every Yahoo history fixture row in trading-date order", async ({ page }) => {
  const table = page.getByRole("table", { name: "TSLA daily price data", exact: true });
  await expect(table.getByRole("columnheader")).toHaveText([
    "Trading date", "Low", "High", "Volume (shares)",
  ]);
  await expect(table.locator("tbody tr")).toHaveCount(history.length);
  await expect(table.getByRole("rowheader")).toHaveText(history.map((row) => row.day));

  const cells = await tableCells(table);
  // Yahoo's independent HTML fixture displays cents; compare at that precision.
  expect(cells.map(([day, low, high, volume]) => ({
    day,
    lowAverage: Number(Number(low.replaceAll(",", "")).toFixed(2)),
    highAverage: Number(Number(high.replaceAll(",", "")).toFixed(2)),
    volume: Number(volume.replaceAll(",", "")),
  }))).toEqual(history);
  await expect(page.getByLabel("Stock ticker")).toHaveValue("TSLA");
  await expect(page.getByRole("status")).toHaveText(`TSLA · ${history.length} trading days`);
});

test("table shows four-decimal chart prices and comma-separated share volumes below the chart", async ({ page }) => {
  const table = page.getByRole("table", { name: "TSLA daily price data", exact: true });
  expect(await tableCells(table)).toEqual(exactRows);

  const chartRegion = page.getByRole("region", { name: /TSLA daily price range chart/ });
  await expect(chartRegion).toBeVisible();
  const chartBounds = await chartRegion.boundingBox();
  const tableBounds = await table.boundingBox();
  expect(chartBounds).not.toBeNull();
  expect(tableBounds).not.toBeNull();
  expect(tableBounds.y).toBeGreaterThanOrEqual(chartBounds.y + chartBounds.height);
});
