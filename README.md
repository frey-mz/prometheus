This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
After installing dependencies with `npm i` or alternatives, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Tests use Node's built-in test runner and native TypeScript support (Node 22.18+ or 24+).

- `npm test`: offline unit tests. Mock the chart fetch with a captured response and compare the actual server action output against an independently parsed Yahoo history table for TSLA, `1794780729`–`1795211597`. Includes interval validation and checks that the comparison detects incorrect prices, dates, volumes, and missing/extra days.
- `npm run test:live`: fetch the Yahoo history page and invoke the server action against the real chart API for that same interval. Requires `curl` and network access; Yahoo rate limits, consent pages, markup changes, or historical revisions may cause failures. Such failures are reported, not skipped.

Comparisons sort by trading date because the page lists newest first and the chart lists oldest first. Dates and volumes must match exactly. Prices are compared at the page's displayed two decimal places; the action still returns four decimal places.

See `tests/fixtures/README.md` for fixture sources. Refresh the HTML table and chart response together when changing the interval.

## Source layout

- `src/app`: Next.js routes, root layout, global styles, and stock server actions.
- `src/types`: shared stock data types.
- `src/components`: stock chart and its table view.
- `src/actions`: server actions.

The `@/` import alias points to `src/`. Static assets remain in `public/`, and project configuration and tests remain at the repository root.

## Browser tests

Run `npx playwright install chromium` once, then `npm run test:e2e`. This builds the production Next.js app and starts an isolated server on port 3100. The server uses a test-only fetch preload to return the captured TSLA chart response; no live Yahoo request is needed.

The Chromium tests submit the real ticker form on desktop and mobile, verify every displayed table row against the independently captured Yahoo history HTML, check exact four-decimal prices and formatted volumes against the chart JSON, and confirm the table appears below the chart. The Yahoo HTML comparison uses cents because that fixture displays two decimal places.
