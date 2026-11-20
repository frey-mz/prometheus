import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { getStockHistory } from "../src/app/actions/stockActions.ts";
import { assertHistoryMatchesPage } from "./yahoo-history.mjs";

const run = promisify(execFile);

test("live server action matches Yahoo's rendered TSLA history", { timeout: 60_000 }, async () => {
  const start = 1794780729;
  const end = 1795211597;
  const url = new URL("https://finance.yahoo.com/quote/TSLA/history/");
  url.searchParams.set("period1", String(start));
  url.searchParams.set("period2", String(end));
  // curl handles Yahoo's large response headers without Node fetch's header limit.
  const { stdout: html } = await run("curl", [
    "--fail-with-body", "--location", "--silent", "--show-error", "--max-time", "30",
    url.toString(), "-H",
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  ], { maxBuffer: 10 * 1024 * 1024, timeout: 35_000 });
  const result = await getStockHistory("TSLA", start, end);
  assertHistoryMatchesPage(result, html);
});
