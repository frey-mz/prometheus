export type DailyStockData = {
  day: string;
  lowAverage: number;
  highAverage: number;
  volume: number;
};

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

export type ChartResponse = {
  chart?: {
    result?: ChartResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function groupStockData(result: ChartResult): DailyStockData[] {
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
  const groups = new Map<string, {
    low: number; high: number; volume: number; count: number;
  }>();

  result.timestamp.forEach((timestamp, index) => {
    const low = quote.low?.[index];
    const high = quote.high?.[index];
    const volume = quote.volume?.[index];
    // Skip incomplete bars without shifting the parallel arrays.
    if (!isFiniteNumber(timestamp) ||
        !isFiniteNumber(low) || !isFiniteNumber(high) ||
        !isFiniteNumber(volume) || volume < 0 || !Number.isSafeInteger(volume)) {
      return;
    }
    const date = new Date(timestamp * 1000);
    if (!Number.isFinite(date.getTime())) return;
    const parts = dateFormat.formatToParts(date);
    const part = (name: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === name)?.value;
    const day = `${part("year")}-${part("month")}-${part("day")}`;
    const group = groups.get(day) ?? { low: 0, high: 0, volume: 0, count: 0 };
    group.low += low;
    group.high += high;
    group.volume += volume;
    group.count += 1;
    groups.set(day, group);
  });

  return Array.from(groups, ([day, group]) => ({
    day,
    lowAverage: Number((group.low / group.count).toFixed(4)),
    highAverage: Number((group.high / group.count).toFixed(4)),
    volume: group.volume,
  })).sort((a, b) => a.day.localeCompare(b.day));
}

// JSON numbers do not retain trailing zeroes, so format price tokens explicitly.
export function formatStockJson(data: DailyStockData[]): string {
  if (!data.length) return "[]";
  return `[\n${data.map((row) =>
    `  {\n    "day": ${JSON.stringify(row.day)},\n    "lowAverage": ${row.lowAverage.toFixed(4)},\n    "highAverage": ${row.highAverage.toFixed(4)},\n    "volume": ${row.volume}\n  }`
  ).join(",\n")}\n]`;
}
