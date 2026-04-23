# BTC On-Chain Signal Engine — Dashboard

Standalone React + Recharts dashboard for the S2F Capital BTC On-Chain Signal Engine.

## Architecture
- Glassnode-powered macro signal engine (backend in [bd-intelligence-report-generator](https://github.com/JoelS2F/bd-intelligence-report-generator))
- 5 Tier-S signals: Blow-Off, $3B Take Profit, STH Confidence, LTH Capitulation, Transfer Volume Momentum
- Dual 10-rule confluence: Cycle-Top / Accumulation
- Composite score 0–100 → 5 regime bands (MAX_ACCUMULATE → DISTRIBUTE)
- Claude synopsis via Anthropic API
- Walk-forward backtest validation tab (1,644 samples across 2012–2025, three full BTC cycles)
- Independent of VVV/DIEM composite

## State files (gitignored)
- `btc_onchain_signal_latest.json` — live daily signal snapshot
- `btc_onchain_backtest.json` — backtest bundle
- `data/btc_onchain_YYYY-MM-DD.json` — daily snapshots
- `data/_api_cache.json` — 6h Glassnode API cache

## Build
```bash
npm install
npx esbuild entry.jsx --bundle --outfile=bundle.js --jsx=automatic --format=iife --target=es2020 --minify
```

## Serve (port 8779)
```bash
python -m http.server 8779
```

## Runtime
The backend runs daily at 00:10 UTC via the Signal Command Center orchestrator (`btc_onchain_signal` task).
