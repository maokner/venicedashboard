# Venice Observatory

A responsive Venice AI research dashboard built with React, TypeScript, Vite, and Recharts.
The layout draws on the tabbed research structure of [Allium's AMM deep dive](https://app.allium.so/terminal/deep-dives/amm-market-structure).
The data comes from the supplied [Venice AI dashboard](https://app.allium.so/s/dashboard/9XoYYU3Bw87GoLWEzQkaHw).

## Run locally

```sh
npm ci
npm run dev
```

## Validate

```sh
npm test
npm run build
```

## Deploy to Vercel

Import this repository into Vercel and select the Vite preset.
The checked-in `vercel.json` sets `npm run build` and the `dist` output directory.
No environment variables or server are required.
To deploy from an authenticated Vercel CLI, run `vercel --prod` from this directory.

## Data

`public/data/` contains the source chart configurations and full extracted observations, captured November 10, 2026.
The dashboard uses these files at build time and does not claim to update live.
Daily histories include 657 days of holders, transfers, and supply, plus 653 days of price, volume, and traders.
Emissions retain the 95 weekly observations provided by the source.
The wallet snapshot includes the 25 rows exposed on the source table's first page.
The original table advertises 50 rows; this app explicitly labels its actual coverage.

The methodology section documents aggregation, coverage, unadjusted DEX volume, and source discrepancies.
Holder percentages use the source fractions multiplied by 100.
The 32.99M staked KPI and 34.53M staking-contract wallet balance remain separate measurements.
Outstanding supply means minted minus burned, including staked and treasury balances.
Aggregated trader counts are sums of daily uniques and are labeled as trader-days.
Latest headline metrics remain fixed to the snapshot while date filters affect charts.

To refresh the snapshot, replace the relevant JSON data arrays with a new authorized Allium export, preserve their field names, and update the capture date labels and methodology.
For automatic refresh, connect a supported Allium API or scheduled export in a server-side job; do not expose private API keys in client code.
