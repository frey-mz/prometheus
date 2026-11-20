import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getStockHistory } from "../src/app/actions/stockActions.ts";
import { assertHistoryMatchesPage, parseHistoryPage } from "./yahoo-history.mjs";

const html = readFileSync(new URL("./fixtures/tsla-history.html", import.meta.url), "utf8");
const chart = readFileSync(new URL("./fixtures/tsla-chart.json", import.meta.url), "utf8");
const start = 1794780729;
const end = 1795211597;

test("server action matches independently parsed Yahoo history for a fixed interval", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(chart));
  const result = await getStockHistory(" tsla ", start, end);
  assertHistoryMatchesPage(result, html);
  assert.equal(fetchMock.mock.callCount(), 1);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url.pathname, "/v8/finance/chart/TSLA");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    interval: "1d", period1: String(start), period2: String(end),
  });
  assert.equal(options.cache, "no-store");
});

test("invalid intervals are rejected without fetching", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected fetch"); });
  for (const [from, to] of [[start, start], [end, start], [-1, end], [NaN, end], [start, Infinity], [start + 0.5, end], [undefined, undefined], [String(start), end]]) {
    assert.ok("error" in await getStockHistory("TSLA", from, to));
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("comparison detects incorrect prices, dates, volumes, and missing/extra days", () => {
  const expected = parseHistoryPage(html);
  for (const change of [{ lowAverage: 0 }, { highAverage: 0 }, { volume: 0 }, { day: "2000-01-01" }]) {
    const altered = expected.map((row, i) => i === 0 ? { ...row, ...change } : row);
    assert.throws(() => assertHistoryMatchesPage(altered, html), assert.AssertionError);
  }
  assert.throws(() => assertHistoryMatchesPage(expected.slice(1), html), assert.AssertionError);
  assert.throws(() => assertHistoryMatchesPage([...expected, expected[0]], html), assert.AssertionError);
  assert.throws(() => assertHistoryMatchesPage({ error: "Unavailable" }, html), assert.AssertionError);
});

test("parser ignores corporate action rows and unrelated tables", () => {
  const extraRow = '<tr><td>Nov 19, 2026</td><td colspan="6">Stock Split</td></tr>';
  const altered = '<table><tr><td>Other content</td></tr></table>' + html.replace("<tbody>", `<tbody>${extraRow}`);
  assert.deepEqual(parseHistoryPage(altered), parseHistoryPage(html));
});

test("parser fails on blocked, empty, or malformed pages", () => {
  assert.throws(() => parseHistoryPage("<html>Consent required</html>"), /table not found/);
  assert.throws(() => parseHistoryPage(html.replace(/<tbody>[\s\S]*?<\/tbody>/, "<tbody></tbody>")), /no price rows/);
  assert.throws(() => parseHistoryPage(html.replace("Nov 20, 2026", "Invalid date")), /Unrecognized history date/);
});
