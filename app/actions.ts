"use server";

import { groupStockData, type ChartResponse, type DailyStockData } from "./stock-data";

export async function getStockHistory(
  symbol: string,
): Promise<DailyStockData[] | { error: string }> {
  if (typeof symbol !== "string" ||
      !/^[A-Z0-9^][A-Z0-9.^=\-]{0,29}$/i.test(symbol.trim())) {
    return { error: "Enter a valid stock ticker, such as AAPL, BRK-B, or ^GSPC." };
  }

  const ticker = symbol.trim().toUpperCase();
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "1mo");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      if (response.status === 404) return { error: `No price data found for ${ticker}.` };
      if (response.status === 429) return { error: "Yahoo Finance is rate limiting requests. Try again shortly." };
      return { error: `Yahoo Finance request failed (HTTP ${response.status}). Try again later.` };
    }
    const payload: ChartResponse = await response.json();
    if (payload.chart?.error) {
      return { error: payload.chart.error.description || "Yahoo Finance could not find price data for this ticker." };
    }
    const result = payload.chart?.result?.[0];
    if (!result) return { error: `No price data found for ${ticker}.` };
    return groupStockData(result);
  } catch {
    return { error: "Unable to load price data from Yahoo Finance. Please try again." };
  }
}
