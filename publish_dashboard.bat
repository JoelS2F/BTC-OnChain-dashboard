@echo off
:: Auto-publish BTC On-Chain dashboard to GitHub Pages.
:: Called from btc_onchain_signal.py after state is written. Idempotent —
:: skips push if no JSON content changed (git commit returns 1 on empty diff).
::
:: Tracked artifacts: bundle.js, btc-onchain-dashboard.jsx, index.html,
:: btc_onchain_signal_latest.json, btc_onchain_backtest.json, urpd_backtest.json.
:: Untracked: data/_urpd_*.json (large caches), data/btc_onchain_*.json (snapshots).

setlocal

cd /d "C:\Users\Merlin\Downloads\BTC-OnChain-dashboard"

git add btc_onchain_signal_latest.json btc_onchain_backtest.json urpd_backtest.json bundle.js index.html btc-onchain-dashboard.jsx 1>nul 2>&1

:: Detect changes in the staged files; skip commit if nothing to push
git diff --cached --quiet 1>nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [publish_dashboard] no JSON/bundle changes, skipping push
    exit /b 0
)

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"`) do set "STAMP=%%i"

git commit -m "chore: daily state snapshot %STAMP%" 1>nul 2>&1
git push origin main 1>nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [publish_dashboard] git push failed — check network/auth
    exit /b 1
)
echo [publish_dashboard] pushed daily state at %STAMP%
exit /b 0
