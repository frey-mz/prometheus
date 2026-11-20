"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import type { DailyStockData } from "./stock-data";

const volumeFormat = new Intl.NumberFormat("en-US");
const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
const tickPriceFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

type RangeBar = DailyStockData & { priceRange: [number, number]; axisLabel: string };

function TimeTick({ x = 0, y = 0, payload }: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const [day, volume] = (payload?.value ?? "").split("\n");
  return (
    <text x={x} y={y} textAnchor="middle" fill="#71717a" fontSize={11}>
      <tspan x={x} dy={18}>{day}</tspan>
      <tspan x={x} dy={18}>{volume}</tspan>
    </text>
  );
}

function PriceTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  const row = payload?.[0]?.payload as RangeBar | undefined;
  if (!active || !row) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-lg">
      <p className="mb-2 font-semibold">{row.day}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 tabular-nums">
        <dt className="text-zinc-500">Low</dt><dd className="text-right">{priceFormat.format(row.lowAverage)}</dd>
        <dt className="text-zinc-500">High</dt><dd className="text-right">{priceFormat.format(row.highAverage)}</dd>
        <dt className="text-zinc-500">Volume</dt><dd className="text-right">{volumeFormat.format(row.volume)}</dd>
      </dl>
    </div>
  );
}

export default function StockHistoryChart({ data, symbol }: {
  data: DailyStockData[];
  symbol: string;
}) {
  const chartData: RangeBar[] = [...data]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((row) => ({
      ...row,
      priceRange: [row.lowAverage, row.highAverage],
      axisLabel: `${row.day}\nVol ${volumeFormat.format(row.volume)}`,
    }));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="mb-4 text-sm text-zinc-500">
        Each bar spans the daily low to high. Hover or use the arrow keys to inspect exact prices and volume.
      </p>
      <div
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-emerald-600"
        role="region"
        aria-label={`${symbol} daily price range chart, with trading dates and volumes on the horizontal axis and price on the vertical axis`}
        tabIndex={0}
      >
        <BarChart
          width={Math.max(640, chartData.length * 124 + 100)}
          height={420}
          data={chartData}
          margin={{ top: 16, right: 24, bottom: 24, left: 20 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis
            dataKey="axisLabel"
            interval={0}
            height={64}
            tick={<TimeTick />}
            tickLine={false}
            axisLine={{ stroke: "#d4d4d8" }}
            label={{ value: "Trading date · Volume (shares)", position: "insideBottom", offset: -12, fill: "#71717a", fontSize: 12 }}
          />
          <YAxis
            domain={["dataMin", "dataMax"]}
            width={90}
            tickCount={6}
            tickFormatter={(value: number) => tickPriceFormat.format(value)}
            tick={{ fill: "#71717a", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{ value: "Price", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 12 }}
          />
          <Tooltip content={PriceTooltip} cursor={{ fill: "#ecfdf5" }} />
          <Bar
            dataKey="priceRange"
            name="Daily low–high"
            fill="#047857"
            radius={3}
            maxBarSize={36}
            minPointSize={2}
            isAnimationActive={false}
          />
        </BarChart>
      </div>
    </div>
  );
}
