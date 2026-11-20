"use client";

import { useActionState } from "react";
import { getStockHistory } from "./actions/stockActions";
import { formatStockJson, type DailyStockData } from "./stock-data";

type QueryState = {
  symbol: string;
  data: DailyStockData[] | null;
  error: string | null;
};

const initialState: QueryState = { symbol: "", data: null, error: null };

export default function Home() {
  const [state, formAction, pending] = useActionState(
    async (_previous: QueryState, form: FormData): Promise<QueryState> => {
      const symbol = String(form.get("symbol") ?? "").trim().toUpperCase();
      try {
        const result = await getStockHistory(symbol);
        if ("error" in result) return { symbol, data: null, error: result.error };
        return { symbol, data: result, error: null };
      } catch {
        return { symbol, data: null, error: "The request failed. Please try again." };
      }
    },
    initialState,
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-700">Prometheus / Market data</p>
      <h1 className="text-4xl font-semibold tracking-tight">Stock history, as JSON.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
        Look up the last month of daily price data from Yahoo Finance.
        Results include each trading day’s average low, average high, and total volume.
      </p>

      <form action={formAction} className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <label htmlFor="symbol" className="block text-sm font-medium">Stock ticker</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="symbol"
            name="symbol"
            type="text"
            defaultValue="AAPL"
            placeholder="e.g. AAPL"
            required
            maxLength={30}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={pending}
            aria-describedby="query-details"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-3 font-mono uppercase focus:outline-2 focus:outline-offset-2 focus:outline-emerald-600 disabled:opacity-60"
          />
          <button type="submit" disabled={pending} className="rounded-lg bg-emerald-700 px-6 py-3 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60">
            {pending ? "Fetching…" : "Fetch JSON"}
          </button>
        </div>
        <p id="query-details" className="mt-3 text-sm text-zinc-500">
          <code>interval=1d</code> · <code>range=1mo</code> · Prices to 4 decimal places
        </p>
        <p className="mt-2 text-sm text-zinc-500">With daily bars, each day’s averages equal its reported low and high.</p>
      </form>

      <section aria-labelledby="results-heading" aria-busy={pending} className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="results-heading" className="font-semibold">JSON response</h2>
          <p role="status" className="text-sm text-zinc-500">
            {pending ? "Loading price data…" : state.data ? `${state.symbol} · ${state.data.length} trading days` : "Ready to query"}
          </p>
        </div>
        {!pending && state.error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{state.error}</p>}
        {!pending && state.data?.length === 0 && <p className="mb-3 text-sm text-zinc-600">No complete trading bars were available for this period.</p>}
        <pre tabIndex={0} aria-label="Raw stock history JSON" className="max-h-[36rem] overflow-auto rounded-2xl bg-zinc-950 p-6 font-mono text-sm leading-6 text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <code>{pending ? "Fetching data…" : state.data ? formatStockJson(state.data) : "[]"}</code>
        </pre>
      </section>
    </main>
  );
}
