import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Legend, Cell
} from "recharts";

// ─── COLORS (Ethena BD Assessment palette) ──────────────────────────────────
const C = {
  bg: "#F7F8FA", surface: "#FFFFFF", card: "#FFFFFF",
  accent: "#2BA6DE", accentDark: "#1E8BBF",
  green: "#10B981", amber: "#F59E0B", red: "#EF4444", purple: "#7C3AED",
  text: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  border: "#E5E7EB", borderSubtle: "#F0F1F3",
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmt = {
  pct: (v, d = 1) => v == null ? "—" : `${(v).toFixed(d)}%`,
  num: (v, d = 2) => v == null ? "—" : Number(v).toFixed(d),
  sci: (v) => v == null ? "—" : Number(v).toExponential(2),
  usd: (v) => v == null ? "—" : `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
  usdB: (v) => v == null ? "—" : `$${(v / 1e9).toFixed(2)}B`,
  big: (v) => {
    if (v == null) return "—";
    const a = Math.abs(v);
    if (a >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (a >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (a >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toFixed(2);
  },
  date: (s) => {
    if (!s) return "";
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
};

const regimeColor = (regime) => {
  switch (regime) {
    case "MAX ACCUMULATE": return C.green;
    case "ACCUMULATE":     return C.green;
    case "NEUTRAL":        return C.text2;
    case "REDUCE":         return C.amber;
    case "DISTRIBUTE":     return C.red;
    default:               return C.text3;
  }
};

const directionColor = (d) => {
  if (d === "bullish") return C.green;
  if (d === "bearish") return C.red;
  return C.text3;
};

// ─── UI PRIMITIVES ──────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    ...style,
  }}>{children}</div>
);

const SectionTitle = ({ children, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
    <h2 style={{ fontSize: 14, fontWeight: 700, color: C.text3, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
      {children}
    </h2>
    {right && <div style={{ fontSize: 12, color: C.text3 }}>{right}</div>}
  </div>
);

const Pill = ({ children, color, bg }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 999,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
    color: color || C.text2, background: bg || C.borderSubtle,
    fontFamily: "JetBrains Mono, monospace",
  }}>{children}</span>
);

// ─── COMPOSITE GAUGE ────────────────────────────────────────────────────────
function CompositeGauge({ score, regime }) {
  const s = Number(score) || 0;
  const ringColor = regimeColor(regime);
  const circumference = 2 * Math.PI * 70;
  const dash = (s / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="70" fill="none" stroke={C.borderSubtle} strokeWidth="12" />
        <circle
          cx="100" cy="100" r="70" fill="none" stroke={ringColor} strokeWidth="12"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
      }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 42, fontWeight: 700, color: C.text }}>
          {s.toFixed(0)}
        </div>
        <div style={{ fontSize: 11, color: C.text3, marginTop: 2, letterSpacing: 1 }}>COMPOSITE</div>
        <div style={{
          marginTop: 10, padding: "4px 12px", borderRadius: 999,
          background: `${ringColor}15`, color: ringColor,
          fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
        }}>{regime}</div>
      </div>
    </div>
  );
}

// ─── SIGNAL TILE ────────────────────────────────────────────────────────────
function SignalTile({ signal, lastFired }) {
  const c = directionColor(signal.direction);
  const fired = signal.fired;
  const lf = lastFired?.[signal.id];
  const lastFiredLabel = (() => {
    if (!lf || lf.days_ago == null) return null;
    if (lf.days_ago === 0) return "today";
    if (lf.days_ago === 1) return "1d ago";
    if (lf.days_ago < 30) return `${lf.days_ago}d ago`;
    if (lf.days_ago < 365) return `${Math.round(lf.days_ago / 30)}mo ago`;
    const yrs = (lf.days_ago / 365).toFixed(1);
    return `${yrs}y ago`;
  })();
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{signal.name}</div>
        <Pill color={fired ? "#fff" : C.text3} bg={fired ? c : C.borderSubtle}>
          {fired ? "FIRED" : "IDLE"}
        </Pill>
      </div>
      {lastFiredLabel && !fired && (
        <div style={{
          fontSize: 10, color: C.text3, fontFamily: "JetBrains Mono, monospace",
          marginBottom: 8, letterSpacing: 0.3,
        }}>
          Last fired: <span style={{ color: C.text2 }}>{lastFiredLabel}</span>
          {lf.last_date && <span style={{ color: C.text3, marginLeft: 6 }}>({lf.last_date})</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 6, background: C.borderSubtle, borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, signal.score))}%`, height: "100%",
            background: c, transition: "width 0.4s",
          }} />
        </div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 600, color: c, minWidth: 42, textAlign: "right" }}>
          {Number(signal.score).toFixed(0)}
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.text2, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5 }}>
        {signal.rationale}
      </div>
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Object.entries(signal.components || {}).map(([k, v]) => {
          if (v === null || v === undefined) return null;
          let display;
          if (typeof v !== "number") display = String(v);
          else if (Math.abs(v) >= 1e7) display = fmt.big(v);
          else if (Math.abs(v) < 0.001 && v !== 0) display = v.toExponential(2);
          else display = v.toFixed(3);
          return (
            <div key={k} style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: C.text2,
              background: C.borderSubtle, padding: "3px 8px", borderRadius: 6,
            }}>
              <span style={{ color: C.text3 }}>{k}:</span> {display}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── CONFLUENCE BAR ─────────────────────────────────────────────────────────
function ConfluenceBar({ title, rules, count, accent, hintHigh }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 26, fontWeight: 700, color: accent,
        }}>
          {count}<span style={{ fontSize: 14, color: C.text3, fontWeight: 400 }}>/10</span>
        </div>
      </div>
      {/* Dot row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4, marginBottom: 16 }}>
        {rules.map((r, i) => (
          <div key={i} title={r.description} style={{
            height: 10, borderRadius: 3,
            background: r.fired ? accent : C.borderSubtle,
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      {/* Rule list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
        {rules.map((r, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 10px", borderRadius: 6,
            background: r.fired ? `${accent}0E` : "transparent",
            borderLeft: r.fired ? `3px solid ${accent}` : "3px solid transparent",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 10, color: r.fired ? accent : C.text3, fontWeight: 700,
              }}>{r.fired ? "●" : "○"}</span>
              <span style={{ fontSize: 12, color: r.fired ? C.text : C.text2 }}>{r.description}</span>
            </div>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.text3 }}>
              {typeof r.value === "number"
                ? (Math.abs(r.value) < 0.001 && r.value !== 0
                    ? r.value.toExponential(2)
                    : r.value.toFixed(r.value >= 1000 ? 0 : 3))
                : "—"}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
        {hintHigh}
      </div>
    </Card>
  );
}

// ─── HISTORICAL CHART ───────────────────────────────────────────────────────
function HistoryChart({ history }) {
  const data = useMemo(() => history?.map(h => ({
    date: fmt.date(h.date),
    rawDate: h.date,
    composite: h.composite,
    price: h.price,
    regime: h.regime,
  })) || [], [history]);

  if (!data.length) return <Card><div style={{ color: C.text3, textAlign: "center", padding: 40 }}>No history data</div></Card>;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Composite vs BTC Price — 365d Walk-Back</div>
        <div style={{ fontSize: 11, color: C.text3 }}>5-day sampled</div>
      </div>
      <div style={{ fontSize: 11, color: C.text3, marginBottom: 10, lineHeight: 1.5 }}>
        Replays today's signal pipeline against each historical cutoff. Colored zones = regime bands validated in backtest.
      </div>
      {/* Regime legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 10, flexWrap: "wrap", fontSize: 10 }}>
        {[
          { label: "MAX_ACCUMULATE", color: C.green, range: "0-25", edge: "+29% 90d" },
          { label: "ACCUMULATE",     color: C.green, range: "25-45", edge: "+25% 90d" },
          { label: "NEUTRAL",        color: C.text2, range: "45-65", edge: "+64% (skew)" },
          { label: "REDUCE",         color: C.red,   range: "65-80", edge: "-15% 90d" },
          { label: "DISTRIBUTE",     color: C.red,   range: "80+", edge: "n too small" },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, background: r.color, opacity: 0.4, borderRadius: 2 }} />
            <span style={{ color: C.text2, fontFamily: "JetBrains Mono, monospace" }}>{r.label}</span>
            <span style={{ color: C.text3 }}>({r.range}) · {r.edge}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="regimeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.red} stopOpacity={0.10} />
              <stop offset="20%" stopColor={C.red} stopOpacity={0.10} />
              <stop offset="20%" stopColor={C.amber} stopOpacity={0.06} />
              <stop offset="35%" stopColor={C.amber} stopOpacity={0.06} />
              <stop offset="35%" stopColor={C.text3} stopOpacity={0.03} />
              <stop offset="55%" stopColor={C.text3} stopOpacity={0.03} />
              <stop offset="55%" stopColor={C.green} stopOpacity={0.06} />
              <stop offset="75%" stopColor={C.green} stopOpacity={0.06} />
              <stop offset="75%" stopColor={C.green} stopOpacity={0.12} />
              <stop offset="100%" stopColor={C.green} stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.borderSubtle} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.text3 }} interval="preserveStartEnd" />
          <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: C.text3 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: C.text3 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
            formatter={(value, name) => {
              if (name === "BTC Price") return [fmt.usd(value), name];
              return [Number(value).toFixed(1), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* Reference zones as horizontal bands */}
          <ReferenceArea yAxisId="left" y1={0}  y2={25}  fill={C.green} fillOpacity={0.12} />
          <ReferenceArea yAxisId="left" y1={25} y2={45}  fill={C.green} fillOpacity={0.06} />
          <ReferenceArea yAxisId="left" y1={65} y2={80}  fill={C.amber} fillOpacity={0.10} />
          <ReferenceArea yAxisId="left" y1={80} y2={100} fill={C.red}   fillOpacity={0.12} />
          <ReferenceLine yAxisId="left" y={65} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine yAxisId="left" y={45} stroke={C.green} strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line yAxisId="right" type="monotone" dataKey="price" stroke={C.text3} strokeWidth={1.5} dot={false} name="BTC Price" />
          <Line yAxisId="left" type="monotone" dataKey="composite" stroke={C.accent} strokeWidth={2.5} dot={false} name="Composite Score" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── METRIC PANEL ───────────────────────────────────────────────────────────
function MetricPanel({ vals }) {
  const metrics = [
    { k: "price_usd",        label: "BTC Price",    fn: fmt.usd },
    { k: "mvrv",             label: "MVRV (adj)",   fn: (v) => fmt.num(v, 2) },
    { k: "nupl",             label: "NUPL",         fn: (v) => fmt.num(v, 3) },
    { k: "reserve_risk",     label: "Reserve Risk", fn: (v) => v == null ? "—" : v.toFixed(5) },
    { k: "mctc",             label: "MCTC",         fn: (v) => fmt.num(v, 2) },
    { k: "rhodl",            label: "RHODL",        fn: (v) => fmt.num(v, 0) },
    { k: "supply_profit_pct", label: "Supply Profit", fn: (v) => v == null ? "—" : `${(v*100).toFixed(1)}%` },
    { k: "sopr_adj",         label: "aSOPR",        fn: (v) => fmt.num(v, 4) },
    { k: "sopr_lth",         label: "LTH-SOPR",     fn: (v) => fmt.num(v, 3) },
    { k: "sopr_sth",         label: "STH-SOPR",     fn: (v) => fmt.num(v, 3) },
    { k: "mvrv_lth",         label: "LTH-MVRV",     fn: (v) => fmt.num(v, 3) },
    { k: "mvrv_sth",         label: "STH-MVRV",     fn: (v) => fmt.num(v, 3) },
  ];
  return (
    <Card>
      <SectionTitle>Latest Metric Readings</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        {metrics.map(m => (
          <div key={m.k} style={{
            background: C.borderSubtle, padding: "10px 12px", borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 600, color: C.text }}>
              {m.fn(vals?.[m.k])}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── SYNOPSIS PANEL ─────────────────────────────────────────────────────────
function SynopsisPanel({ syn }) {
  if (!syn) return null;
  return (
    <Card>
      <SectionTitle right={syn.model}>Claude Synopsis</SectionTitle>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, fontWeight: 500 }}>
          {syn.regime_summary}
        </div>
      </div>
      {syn.key_signals?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.text3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Key Signals</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
            {syn.key_signals.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}
      {syn.thesis && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.text3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Thesis</div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{syn.thesis}</div>
        </div>
      )}
      {syn.risk_factors?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.text3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Risk Factors</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
            {syn.risk_factors.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}
      {syn.action_bias && (
        <div style={{
          padding: "10px 14px", background: `${C.accent}10`, borderLeft: `3px solid ${C.accent}`, borderRadius: 6,
        }}>
          <div style={{ fontSize: 11, color: C.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>
            Action Bias
          </div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{syn.action_bias}</div>
        </div>
      )}
    </Card>
  );
}

// ─── VALIDATION — HELPERS ───────────────────────────────────────────────────
const REGIME_COLOR = {
  MAX_ACCUMULATE: C.green, ACCUMULATE: C.green,
  NEUTRAL: C.text2, REDUCE: C.amber, DISTRIBUTE: C.red,
};

function BucketStatsTable({ buckets, windows }) {
  const rows = Object.entries(buckets).map(([name, b]) => ({ name, ...b }));
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.border}` }}>
            <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: C.text3, letterSpacing: 0.5 }}>REGIME BUCKET</th>
            <th style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>N</th>
            {windows.map(w => [
              <th key={`m-${w}`} style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>{w}d μ</th>,
              <th key={`w-${w}`} style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>{w}d win%</th>,
            ]).flat()}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const color = REGIME_COLOR[r.name] || C.text2;
            return (
              <tr key={r.name} style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ fontWeight: 600, color }}>{r.name}</span>
                  <span style={{ color: C.text3, marginLeft: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                    [{r.range[0]}–{r.range[1]})
                  </span>
                </td>
                <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace", color: C.text2 }}>
                  {r.rows}
                </td>
                {windows.map(w => {
                  const s = r[`fwd_${w}d`];
                  const hasData = s && s.n > 0;
                  const mean = hasData ? s.mean : null;
                  const win = hasData ? s.win_rate : null;
                  const meanColor = mean == null ? C.text3 : (mean > 0 ? C.green : C.red);
                  return [
                    <td key={`m-${r.name}-${w}`} style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace", color: meanColor, fontWeight: 600 }}>
                      {mean == null ? "—" : `${mean > 0 ? "+" : ""}${mean.toFixed(1)}%`}
                    </td>,
                    <td key={`w-${r.name}-${w}`} style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace", color: C.text2 }}>
                      {win == null ? "—" : `${win.toFixed(0)}%`}
                    </td>,
                  ];
                }).flat()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SignalAttributionTable({ attribution }) {
  const rows = Object.entries(attribution);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.border}` }}>
            <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>SIGNAL</th>
            <th style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>FIRE %</th>
            <th style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>FIRED N</th>
            <th style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>FIRED 90d μ</th>
            <th style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>IDLE 90d μ</th>
            <th style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600, color: C.text3 }}>EDGE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([id, s]) => {
            const firedMean = s.fired.n > 0 ? s.fired.fwd_90d.mean : null;
            const idleMean = s.not_fired.n > 0 ? s.not_fired.fwd_90d.mean : null;
            const edge = s.edge_90d;
            const edgeColor = edge == null ? C.text3 : (edge > 0 ? C.green : C.red);
            const labels = {
              blow_off: "Blow-Off Signal",
              take_profit_3b: "$3B Take Profit",
              sth_confidence: "STH Confidence",
              lth_capitulation: "LTH Capitulation",
              transfer_volume_momo: "Transfer Vol Momentum",
            };
            return (
              <tr key={id} style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
                <td style={{ padding: "10px 8px", fontWeight: 500, color: C.text }}>{labels[id] || id}</td>
                <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace", color: C.text2 }}>
                  {s.fire_rate_pct}%
                </td>
                <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace", color: C.text2 }}>
                  {s.fired.n}
                </td>
                <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace",
                  color: firedMean == null ? C.text3 : (firedMean > 0 ? C.green : C.red) }}>
                  {firedMean == null ? "—" : `${firedMean > 0 ? "+" : ""}${firedMean.toFixed(1)}%`}
                </td>
                <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace", color: C.text3 }}>
                  {idleMean == null ? "—" : `${idleMean > 0 ? "+" : ""}${idleMean.toFixed(1)}%`}
                </td>
                <td style={{ textAlign: "right", padding: "10px 8px", fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700, color: edgeColor }}>
                  {edge == null ? "—" : `${edge > 0 ? "+" : ""}${edge.toFixed(1)}pp`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfluenceEdgeChart({ data, title, accent }) {
  const rows = Object.entries(data)
    .map(([count, d]) => ({
      count: Number(count),
      n: d.n,
      mean: d.fwd_90d?.mean,
      win: d.fwd_90d?.win_rate,
    }))
    .filter(r => r.n >= 3);

  if (!rows.length) return null;

  return (
    <Card>
      <SectionTitle right={`${rows.reduce((s, r) => s + r.n, 0)} samples`}>{title}</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.borderSubtle} />
          <XAxis dataKey="count" tick={{ fontSize: 11, fill: C.text3 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: C.text3 }} tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: C.text3 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
            formatter={(v, name) => {
              if (name === "Mean 90d return") return [`${v > 0 ? "+" : ""}${v}%`, name];
              if (name === "Win rate") return [`${v}%`, name];
              return [v, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine yAxisId="left" y={0} stroke={C.text3} strokeDasharray="2 2" />
          <Bar yAxisId="left" dataKey="mean" fill={accent} name="Mean 90d return" radius={[4, 4, 0, 0]}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.mean > 0 ? C.green : C.red} />
            ))}
          </Bar>
          <Line yAxisId="right" type="monotone" dataKey="win" stroke={C.accent} strokeWidth={2} dot={{ r: 4 }} name="Win rate" />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
        Each bar = mean 90d BTC forward return when exactly N rules fired. Blue line = win rate (pct of positive 90d returns). Buckets with n&lt;3 hidden.
      </div>
    </Card>
  );
}

function RegimeTransitionLog({ events }) {
  if (!events || !events.length) return null;
  const recent = events.slice(-15).reverse();
  return (
    <Card>
      <SectionTitle right={`${events.length} total flips`}>Regime Transitions (last 15)</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
        {recent.map((e, i) => {
          const fromColor = REGIME_COLOR[e.from] || C.text3;
          const toColor = REGIME_COLOR[e.to] || C.text3;
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "100px 1fr 100px",
              alignItems: "center", gap: 12, padding: "8px 12px",
              background: i === 0 ? C.borderSubtle : "transparent",
              borderRadius: 6, fontSize: 12,
            }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", color: C.text2 }}>{e.date}</span>
              <span>
                <span style={{ color: fromColor, fontWeight: 600 }}>{e.from}</span>
                <span style={{ color: C.text3, margin: "0 8px" }}>→</span>
                <span style={{ color: toColor, fontWeight: 600 }}>{e.to}</span>
              </span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", color: C.text3, textAlign: "right" }}>
                ${(e.price / 1000).toFixed(1)}k · {e.composite.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CompositePriceScatter({ timeline }) {
  if (!timeline || timeline.length < 10) return null;
  let raw = timeline.map(r => ({
    composite: r.composite,
    fwd90: r.fwd_90d,
    price: r.price,
    date: r.date,
  })).filter(r => r.fwd90 !== null && r.fwd90 !== undefined);

  // Subsample to max 150 points for render performance
  const MAX = 150;
  const data = raw.length > MAX
    ? raw.filter((_, i) => i % Math.ceil(raw.length / MAX) === 0)
    : raw;

  if (!data.length) return null;

  // Group by composite bucket for a clearer picture
  return (
    <Card>
      <SectionTitle right={`${data.length} samples`}>Composite Score → 90d Forward Return (scatter)</SectionTitle>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data.sort((a, b) => a.composite - b.composite)}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.borderSubtle} />
          <XAxis
            dataKey="composite"
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: C.text3 }}
            label={{ value: "Composite score at t=0", position: "insideBottom", offset: -5, fontSize: 11, fill: C.text3 }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: C.text3 }}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <Tooltip
            contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }}
            formatter={(v, n) => [`${v > 0 ? "+" : ""}${Number(v).toFixed(1)}%`, n]}
            labelFormatter={(v) => `Composite: ${Number(v).toFixed(1)}`}
          />
          <ReferenceLine y={0} stroke={C.text3} strokeDasharray="2 2" />
          <ReferenceLine x={45} stroke={C.green} strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine x={65} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line type="monotone" dataKey="fwd90" stroke="none" dot={{ r: 2.5, fill: C.accent, fillOpacity: 0.4 }} name="90d forward return" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function downloadCsv(filename, rows, headers) {
  const header = headers.join(",");
  const body = rows.map(r =>
    headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v).replace(/,/g, ";");
      return String(v);
    }).join(",")
  ).join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ValidationView({ bt }) {
  if (!bt) {
    return (
      <Card>
        <SectionTitle>Validation — no backtest data</SectionTitle>
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>
          Run <code style={{ background: C.borderSubtle, padding: "2px 6px", borderRadius: 4 }}>python btc_onchain_backtest.py --step 3</code> to generate <code>btc_onchain_backtest.json</code>.
        </div>
      </Card>
    );
  }
  const generated = new Date(bt.generated_at);
  const dateRange = bt.summary?.date_range;

  const exportTimelineCsv = () => {
    const headers = ["date", "price", "composite", "regime", "cycle_count", "acc_count",
                     "fwd_30d", "fwd_90d", "fwd_180d", "mdd_30d", "mdd_90d", "mdd_180d",
                     "mru_30d", "mru_90d", "mru_180d", "signals_fired"];
    downloadCsv(`btc_onchain_backtest_timeline_${bt.generated_at?.slice(0, 10)}.csv`, bt.timeline, headers);
  };

  const exportBucketsCsv = () => {
    const rows = Object.entries(bt.composite_buckets_stats).flatMap(([regime, b]) =>
      bt.fwd_windows.map(w => ({
        regime,
        range_lo: b.range?.[0],
        range_hi: b.range?.[1],
        n: b[`fwd_${w}d`]?.n,
        window_days: w,
        mean: b[`fwd_${w}d`]?.mean,
        median: b[`fwd_${w}d`]?.median,
        p25: b[`fwd_${w}d`]?.p25,
        p75: b[`fwd_${w}d`]?.p75,
        win_rate: b[`fwd_${w}d`]?.win_rate,
        mdd_mean: b[`mdd_${w}d_mean`],
        mru_mean: b[`mru_${w}d_mean`],
      }))
    );
    downloadCsv(`btc_onchain_bucket_stats_${bt.generated_at?.slice(0, 10)}.csv`,
      rows, Object.keys(rows[0] || { empty: 0 }));
  };

  return (
    <>
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle right={generated.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}>
          Validation Summary
        </SectionTitle>
        <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
          <span style={{ color: C.text3 }}>Test window:</span> <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{dateRange?.start} → {dateRange?.end}</span>
          {" · "}
          <span style={{ color: C.text3 }}>Samples:</span> <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{bt.summary.n_rows}</span>
          {" · "}
          <span style={{ color: C.text3 }}>Overall 90d mean return (base rate):</span>{" "}
          <span style={{ fontFamily: "JetBrains Mono, monospace", color: C.text, fontWeight: 600 }}>
            {bt.summary.overall_fwd_returns?.fwd_90d?.mean != null
              ? `${bt.summary.overall_fwd_returns.fwd_90d.mean > 0 ? "+" : ""}${bt.summary.overall_fwd_returns.fwd_90d.mean}%`
              : "—"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={exportTimelineCsv} style={{
            padding: "6px 12px", background: C.accent, color: "#fff", border: "none",
            borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
            fontFamily: "Inter, sans-serif", letterSpacing: 0.3,
          }}>↓ Export Timeline CSV</button>
          <button onClick={exportBucketsCsv} style={{
            padding: "6px 12px", background: "transparent", color: C.accent,
            border: `1px solid ${C.accent}`, borderRadius: 6, fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "Inter, sans-serif", letterSpacing: 0.3,
          }}>↓ Export Bucket Stats CSV</button>
        </div>
      </Card>

      <div style={{ marginBottom: 20 }}>
        <Card>
          <SectionTitle>Composite Score → Forward Return (regime buckets)</SectionTitle>
          <BucketStatsTable buckets={bt.composite_buckets_stats} windows={bt.fwd_windows} />
          <div style={{ marginTop: 12, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
            How well does the composite predict forward returns? Higher mean / win % in ACCUMULATE vs REDUCE/DISTRIBUTE = signal has edge.
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Card>
          <SectionTitle>Per-Signal Attribution (Tier-S)</SectionTitle>
          <SignalAttributionTable attribution={bt.signal_attribution} />
          <div style={{ marginTop: 12, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
            <b>EDGE</b> = (mean 90d return when signal fired) − (mean when idle). Negative edge = bearish signal (correct if take-profit style). Positive edge = bullish signal. Signals that never fired show "—".
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <ConfluenceEdgeChart
          data={bt.confluence_stats.cycle_top}
          title="Cycle-Top Confluence → 90d Edge"
          accent={C.red}
        />
        <ConfluenceEdgeChart
          data={bt.confluence_stats.accumulation}
          title="Accumulation Confluence → 90d Edge"
          accent={C.green}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <CompositePriceScatter timeline={bt.timeline} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <RegimeTransitionLog events={bt.regime_transitions} />
      </div>
    </>
  );
}

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function BtcOnChainDashboard() {
  const [state, setState] = useState(null);
  const [backtest, setBacktest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("live");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resp = await fetch(`btc_onchain_signal_latest.json?t=${Date.now()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        setState(data);
        // Backtest is optional — silently skip if missing
        try {
          const btResp = await fetch(`btc_onchain_backtest.json?t=${Date.now()}`);
          if (btResp.ok) setBacktest(await btResp.json());
        } catch (_) { /* ignore */ }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
      color: C.text3, fontSize: 14,
    }}>Loading signal state…</div>;
  }

  if (error || !state) {
    return (
      <div style={{ padding: 40, color: C.text2 }}>
        <h1 style={{ color: C.red }}>Failed to load signal state</h1>
        <p style={{ fontFamily: "monospace", color: C.text3 }}>{error || "No data"}</p>
        <p>Expected file: <code>btc_onchain_signal_latest.json</code> in dashboard root.</p>
        <p>Run: <code style={{ background: C.borderSubtle, padding: "2px 6px", borderRadius: 4 }}>python btc_onchain_signal.py</code></p>
      </div>
    );
  }

  const generated = new Date(state.generated_at);
  const ageHr = Math.max(0, (Date.now() - generated.getTime()) / 3600000);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, letterSpacing: 2, textTransform: "uppercase" }}>
              S2F Capital · BTC Intelligence
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "4px 0 6px" }}>
              BTC On-Chain Signal Engine
            </h1>
            <div style={{ fontSize: 13, color: C.text2 }}>
              Standalone Glassnode-powered macro signal — 5 Tier-S signals, dual 10-rule confluence, composite 0–100
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.text3 }}>
              {generated.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </div>
            <div style={{ fontSize: 11, color: ageHr > 26 ? C.red : C.text3, marginTop: 2 }}>
              {ageHr < 1 ? "just now" : `${ageHr.toFixed(1)}h ago`}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: "live", label: "Live Signal" },
            { id: "validation", label: `Validation${backtest ? ` · ${backtest.summary?.n_rows || ""} samples` : ""}` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 20px", background: "none", border: "none",
                borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom: -1, cursor: "pointer",
                fontFamily: "Inter, sans-serif", fontSize: 13,
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? C.text : C.text3,
                letterSpacing: 0.3,
                transition: "all 0.15s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {tab === "validation" ? (
          <ValidationView bt={backtest} />
        ) : (<>

        {/* Top row: gauge + confluences */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) 2fr 2fr", gap: 20, marginBottom: 20 }}>
          <Card>
            <SectionTitle>Composite</SectionTitle>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <CompositeGauge score={state.composite_score} regime={state.regime} />
            </div>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: `${C.red}10`, padding: 10, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.red, letterSpacing: 1, textTransform: "uppercase" }}>Cycle Top</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700, color: C.red }}>
                  {state.cycle_top_count}/10
                </div>
              </div>
              <div style={{ background: `${C.green}10`, padding: 10, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.green, letterSpacing: 1, textTransform: "uppercase" }}>Accumulate</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700, color: C.green }}>
                  {state.accumulation_count}/10
                </div>
              </div>
            </div>
          </Card>
          <ConfluenceBar
            title="Cycle-Top Confluence"
            rules={state.cycle_top_rules}
            count={state.cycle_top_count}
            accent={C.red}
            hintHigh="Fired rules signal overheating / distribution zone. ≥5 historically marks cycle tops."
          />
          <ConfluenceBar
            title="Accumulation Confluence"
            rules={state.accumulation_rules}
            count={state.accumulation_count}
            accent={C.green}
            hintHigh="Fired rules signal value / capitulation zone. ≥5 historically marks cycle bottoms."
          />
        </div>

        {/* Tier-S signals */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle right={`${state.signals.filter(s => s.fired).length}/${state.signals.length} firing`}>
            Tier-S Signals
          </SectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {state.signals.map(sig => <SignalTile key={sig.id} signal={sig} lastFired={state.signal_last_fired} />)}
          </div>
        </div>

        {/* History chart */}
        <div style={{ marginBottom: 20 }}>
          <HistoryChart history={state.history} />
        </div>

        {/* Metric panel + synopsis */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <MetricPanel vals={state.latest_values} />
          <SynopsisPanel syn={state.synopsis} />
        </div>

        </>)}

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: C.text3 }}>
          Data: Glassnode API · Signals derived from S2F Capital's custom on-chain chart library · Independent of VVV composite
        </div>

      </div>
    </div>
  );
}
