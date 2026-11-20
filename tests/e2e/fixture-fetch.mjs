// Loaded only in Playwright's server process, before Next.js patches fetch.
import { readFileSync } from "node:fs";

const chart = readFileSync(new URL("../fixtures/tsla-chart.json", import.meta.url), "utf8");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.hostname === "query1.finance.yahoo.com") {
    if (url.pathname !== "/v8/finance/chart/TSLA" || url.searchParams.get("interval") !== "1d") {
      throw new Error("Unexpected stock request in fixture-backed browser test");
    }
    return new Response(chart, { headers: { "Content-Type": "application/json" } });
  }
  return originalFetch(input, options);
};
