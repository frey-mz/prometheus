"use server";

import type { DailyStockData } from "../stock-data";

type ChartResult = {
  meta?: { exchangeTimezoneName?: string };
  timestamp?: number[];
  indicators?: {
    quote?: {
      low?: (number | null)[];
      high?: (number | null)[];
      volume?: (number | null)[];
    }[];
  };
};

type ChartResponse = {
  chart?: {
    result?: ChartResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function groupStockData(result: ChartResult): DailyStockData[] {
  const quote = result.indicators?.quote?.[0];
  if (!Array.isArray(result.timestamp) || !quote) {
    throw new Error("Yahoo Finance returned incomplete price data.");
  }

  // A trading day follows the exchange timezone, not the server's timezone.
  const dateFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone: result.meta?.exchangeTimezoneName || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const days = new Set<string>();
  const data: DailyStockData[] = [];

  for (let index = 0; index < result.timestamp.length; index += 1) {
    const timestamp = result.timestamp[index];
    if (!isFiniteNumber(timestamp)) continue;
    const date = new Date(timestamp * 1000);
    if (!Number.isFinite(date.getTime())) continue;
    const day = dateFormat.format(date);
    if (days.has(day)) {
      throw new Error(`Yahoo Finance returned duplicate price data for ${day}.`);
    }
    days.add(day);

    const low = quote.low?.[index];
    const high = quote.high?.[index];
    const volume = quote.volume?.[index];
    // Skip incomplete bars without shifting the parallel arrays.
    if (!isFiniteNumber(low) || !isFiniteNumber(high) ||
        !isFiniteNumber(volume) || volume < 0 || !Number.isSafeInteger(volume)) {
      continue;
    }
    data.push({
      day,
      lowAverage: Number(low.toFixed(4)),
      highAverage: Number(high.toFixed(4)),
      volume,
    });
  }

  return data;
}

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
