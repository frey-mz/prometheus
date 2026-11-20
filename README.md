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
