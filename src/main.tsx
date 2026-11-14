import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  CircleHelp,
  Search,
  Check,
  Copy,
  ArrowRight,
  BookOpen,
  Flame,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  history,
  latest,
  compact,
  pctChange,
  selectRows,
  download,
  walletRows,
  source,
  snapshot,
  staked,
  type Dataset,
  type Row,
} from "./data";
import "./styles.css";
const tabs = [
  "Overview",
  "Market activity",
  "Staking & supply",
  "Holders",
  "Methodology",
];
const purple = "#9b58c7",
  teal = "#3e8990";
const dateLabel = (s: string) =>
  new Date(s + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
function Logo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="m6 9 8 23 6-18 6 18 8-23M10 9l10 26L30 9"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
function Change({
  value,
  label = "vs. 30d ago",
}: {
  value: number;
  label?: string;
}) {
  return (
    <span className={"change " + (value >= 0 ? "positive" : "negative")}>
      {value >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{" "}
      {Math.abs(value).toFixed(1)}% <span>{label}</span>
    </span>
  );
}
function Chart({
  dataset,
  fields,
  title,
  subtitle,
  range,
  bucket,
  kind = "area",
  currency = false,
}: {
  dataset: Dataset;
  fields: { key: string; label: string; color: string }[];
  title: string;
  subtitle: string;
  range: string;
  bucket: string;
  kind?: string;
  currency?: boolean;
}) {
  const rows = selectRows(dataset, range, bucket);
  const common = {
    data: rows,
    margin: { top: 15, right: 8, left: 0, bottom: 0 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="#ececf0" />
      <XAxis
        dataKey="day"
        tickFormatter={dateLabel}
        minTickGap={50}
        tickLine={false}
        axisLine={false}
        tick={{ fill: "#81818e", fontSize: 10 }}
        dy={12}
      />
      <YAxis
        width={48}
        tickFormatter={(v) => (currency ? "$" : "") + compact(v, 1)}
        tickLine={false}
        axisLine={false}
        tick={{ fill: "#81818e", fontSize: 10 }}
        domain={kind === "line" ? ["auto", "auto"] : [0, "auto"]}
      />
      <Tooltip
        labelFormatter={(v) => dateLabel(String(v))}
        formatter={(v, name) => [
          (currency ? "$" : "") +
            Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 }),
          name,
        ]}
        contentStyle={{
          background: "#ffffff",
          border: "1px solid #dedee5",
          borderRadius: 6,
          fontSize: 12,
        }}
        labelStyle={{ color: "#626270", marginBottom: 8 }}
        cursor={
          kind === "bar"
            ? { fill: "#9b58c708" }
            : { stroke: "#a8a8b4", strokeDasharray: "3 3" }
        }
      />
    </>
  );
  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <button
          className="icon-button"
          aria-label={"Download " + title}
          title="Export chart data"
          onClick={() => download(dataset + "-" + range, rows)}
        >
          <Download size={15} />
        </button>
      </div>
      <div
        className="chart"
        role="img"
        aria-label={`${title}. ${rows.length} observations in the selected period. Hover for values.`}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 400, height: 230 }}
        >
          {kind === "bar" ? (
            <BarChart {...common}>
              {axes}
              <ReferenceLine y={0} stroke="#d8d8e0" />
              {fields.map((f) => (
                <Bar
                  key={f.key}
                  dataKey={f.key}
                  name={f.label}
                  fill={f.color}
                  maxBarSize={8}
                  radius={[1, 1, 0, 0]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          ) : kind === "line" ? (
            <LineChart {...common}>
              {axes}
              {fields.map((f) => (
                <Line
                  key={f.key}
                  dataKey={f.key}
                  name={f.label}
                  stroke={f.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart {...common}>
              <defs>
                <linearGradient
                  id={"fill-" + dataset}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={fields[0].color}
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="95%"
                    stopColor={fields[0].color}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              {axes}
              {fields.map((f) => (
                <Area
                  key={f.key}
                  type="monotone"
                  dataKey={f.key}
                  name={f.label}
                  stroke={f.color}
                  strokeWidth={2}
                  fill={"url(#fill-" + dataset + ")"}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="chart-foot">
        <div className="legend">
          {fields.map((f) => (
            <span key={f.key}>
              <i style={{ background: f.color }} />
              {f.label}
            </span>
          ))}
        </div>
        <span>{dataset === "emissions" ? "Weekly" : bucket} · UTC</span>
      </div>
    </section>
  );
}
function App() {
  const [tab, setTab] = useState("Overview"),
    [range, setRange] = useState("180D"),
    [bucket, setBucket] = useState("Daily"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("vvv_balance"),
    [asc, setAsc] = useState(false),
    [page, setPage] = useState(0),
    [copied, setCopied] = useState(false);
  const supply = latest("supply", "circulating_supply"),
    stakeShare = (staked / supply) * 100,
    burns = latest("supply", "cumulative_burned");
  const go = (name: string) => {
    setTab(name);
    setPage(0);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const filtered = walletRows
    .filter(
      (w) =>
        w.address.includes(query.toLowerCase()) ||
        ("svvv staking contract".includes(query.toLowerCase()) &&
          w === walletRows[0]),
    )
    .sort(
      (a, b) =>
        (Number(a[sort as keyof typeof a]) -
          Number(b[sort as keyof typeof b])) *
        (asc ? 1 : -1),
    );
  const chart = (
    dataset: Dataset,
    title: string,
    subtitle: string,
    fields: { key: string; label: string; color: string }[],
    kind = "area",
    currency = false,
  ) => (
    <Chart
      {...{ dataset, title, subtitle, fields, range, bucket, kind, currency }}
    />
  );
  const priceChart = chart(
    "price",
    "VVV price",
    "Daily median DEX-implied USD price; period-end when grouped",
    [{ key: "vvv_price_usd", label: "VVV / USD", color: purple }],
    "area",
    true,
  );
  const holdersChart = chart(
    "holders",
    "Holder growth",
    "Addresses with a non-zero VVV balance",
    [{ key: "holders", label: "Holders", color: teal }],
  );
  const volumeChart = chart(
    "volume",
    "DEX volume",
    "Unadjusted buy and sell volume in USD",
    [
      { key: "buy_volume_usd", label: "Buy volume", color: teal },
      { key: "sell_volume_usd", label: "Sell volume", color: purple },
    ],
    "bar",
    true,
  );
  const emissionsChart = chart(
    "emissions",
    "Emissions & burns",
    "Weekly minted and burned VVV, including launch",
    [
      { key: "minted", label: "Minted", color: teal },
      { key: "burned", label: "Burned", color: purple },
    ],
    "bar",
  );
  return (
    <div className="app">
      <aside className="research-rail" aria-label="Workspace">
        <a className="workspace-brand" href="/" aria-label="AI research home">
          <ChartNoAxesCombined size={21} />
          <span>
            AI research<span>MARKET INTELLIGENCE</span>
          </span>
        </a>
        <div className="rail-label">RESEARCH UNIVERSE</div>
        <div className="universe-label">
          <BookOpen size={15} /> AI &amp; digital assets
        </div>
        <div className="project-active" aria-current="page">
          <span className="project-logo">
            <Logo />
          </span>
          <span>
            Venice AI<small>VVV · Base</small>
          </span>
          <span className="active-mark" />
        </div>
        <a className="project-link" href="/deep-dive/">
          <span className="project-logo">
            <Logo />
          </span>
          <span>
            Deep dive<small>VVV and DIEM</small>
          </span>
        </a>
        <div className="rail-context">
          <span className="rail-label">ABOUT THIS RESEARCH</span>
          <p>
            Market activity, staking and ownership of Venice's token on Base.
          </p>
        </div>
        <div className="rail-bottom">
          <span className="rail-label">DATA PROVIDER</span>
          <a href={source} target="_blank" rel="noreferrer">
            <span className="allium-mark">◎</span> Allium{" "}
            <ArrowUpRight size={14} />
          </a>
          <p>
            Snapshot · Nov 10, 2026
            <br />
            Historical data, not a live feed.
          </p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">AI research</span>
            <ChevronRight size={12} />
            <span>Venice AI</span>
          </div>
          <div>
            <span className="network">
              <i /> Base
            </span>
            <span className="top-separator" />
            <a href={source} target="_blank" rel="noreferrer">
              Source <ArrowUpRight size={13} />
            </a>
          </div>
        </header>
        <main>
          <div className="intro">
            <div>
              <div className="eyebrow">
                AI &amp; DIGITAL ASSETS <span>/</span> RESEARCH NOTE 001
              </div>
              <div className="title-line">
                <span className="title-logo">
                  <Logo />
                </span>
                <h1>Venice AI</h1>
                <span className="token-badge">VVV</span>
              </div>
              <p>Understanding VVV: its market, staking and token economics.</p>
              <div className="intro-meta">
                <span className="base-icon" /> Base network <i /> Since Jan 23,
                2025 <i />
                <span>Snapshot · Nov 10, 2026</span>
              </div>
            </div>
            <button
              aria-label="Export snapshot data"
              className="export-button"
              onClick={() =>
                download(
                  "venice-" + snapshot,
                  history.price.map((r: Row) => ({
                    ...r,
                    ...history.holders.find((h) => h.day === r.day),
                    ...history.supply.find((h) => h.day === r.day),
                    ...history.volume.find((h) => h.day === r.day),
                  })),
                )
              }
            >
              <Download size={14} /> Export data
            </button>
          </div>
          <nav className="tabbar" aria-label="Research sections">
            {tabs.map((name) => (
              <button
                aria-current={tab === name ? "page" : undefined}
                key={name}
                onClick={() => go(name)}
              >
                {name}
              </button>
            ))}
          </nav>
          <section className="section-context" key={tab}>
            <div className="section-kicker">
              {tab === "Overview"
                ? "THE RESEARCH BRIEF"
                : "VENICE AI / " + tab.toUpperCase()}
            </div>
            <h2>
              {
                (
                  {
                    Overview: "What is Venice, and what does VVV tell us?",
                    "Market activity": "How is VVV trading?",
                    "Staking & supply":
                      "How much VVV is staked, and is supply shrinking?",
                    Holders: "Who holds VVV?",
                    Methodology:
                      "Understand the data before drawing conclusions.",
                  } as Record<string, string>
                )[tab]
              }
            </h2>
            <p>
              {
                (
                  {
                    Overview:
                      "Venice AI is the project behind VVV, a token on Base. This research follows the token from launch through its trading activity, staking and ownership. The Allium source covers on-chain activity; it does not measure AI product usage or business revenue.",
                    "Market activity":
                      "Read price alongside volume and trader participation. DEX activity measures token trading, so it cannot tell us how many people use Venice’s AI product.",
                    "Staking & supply":
                      "Staking and token supply answer different questions. The staking KPI measures VVV committed as sVVV, while mints and burns determine how much VVV exists.",
                    Holders:
                      "A wallet is an address, not necessarily a person. The largest wallet is the sVVV staking contract, which can hold tokens on behalf of many stakers.",
                    Methodology:
                      "Every chart uses the supplied Allium extract. Definitions, aggregation rules and source discrepancies are documented below.",
                  } as Record<string, string>
                )[tab]
              }
            </p>
          </section>
          {tab === "Overview" && (
            <div className="brief-grid">
              <div>
                <span className="section-kicker">QUESTIONS TO EXPLORE</span>
                <ol>
                  <li>How much supply is committed to staking?</li>
                  <li>Are burns offsetting new token emissions?</li>
                  <li>Is ownership broadening beyond the largest wallets?</li>
                </ol>
              </div>
              <div>
                <span className="section-kicker">AT THE SNAPSHOT</span>
                <p>
                  <strong>
                    {stakeShare.toFixed(1)}% of outstanding VVV is staked.
                  </strong>{" "}
                  The staking contract holds{" "}
                  {compact(walletRows[0].vvv_balance)} VVV, a separate
                  measurement from the {compact(staked)} staking KPI.
                </p>
                <p>
                  Supply is{" "}
                  {Math.abs(
                    (supply / Number(history.supply[0].circulating_supply) -
                      1) *
                      100,
                  ).toFixed(1)}
                  % below its first recorded level. Read emissions and burns
                  together to understand the change.
                </p>
                <p>
                  Two things move these figures. Outstanding supply includes
                  about 31M VVV held in Venice's own wallets, so of circulating
                  VVV about two-thirds is staked. And almost all of the supply
                  decline is one event: 32.5M unclaimed airdrop tokens burned on
                  12 March 2025. Without it, supply has grown since launch.{" "}
                  <a href="/deep-dive/?tab=supply">See the deep dive</a>.
                </p>
              </div>
            </div>
          )}
          {tab !== "Methodology" && (
            <>
              <div className="section-tools">
                <div>
                  <span className="status-dot" /> Historical snapshot{" "}
                  <span className="quiet">/ UTC</span>
                </div>
                <div className="filters">
                  <div className="range-filter" aria-label="Date range">
                    {["30D", "90D", "180D", "ALL"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        aria-pressed={range === r}
                        className={range === r ? "selected" : ""}
                      >
                        {r === "ALL" ? "All time" : r}
                      </button>
                    ))}
                  </div>
                  <label className="bucket">
                    <select
                      aria-label="Chart aggregation"
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value)}
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                    <ChevronDown size={12} />
                  </label>
                </div>
              </div>
              <div className="metric-strip">
                {[
                  {
                    label: "VVV price",
                    value: "$" + latest("price", "vvv_price_usd").toFixed(2),
                    detail: (
                      <Change value={pctChange("price", "vvv_price_usd", 30)} />
                    ),
                  },
                  {
                    label: "Token holders",
                    value: compact(latest("holders", "holders")),
                    detail: (
                      <Change value={pctChange("holders", "holders", 30)} />
                    ),
                  },
                  {
                    label: "Total staked",
                    value: compact(staked) + " VVV",
                    detail: (
                      <span className="metric-note">
                        <span className="peach">{stakeShare.toFixed(1)}%</span>{" "}
                        of outstanding supply
                      </span>
                    ),
                  },
                  {
                    label: "Outstanding supply",
                    value: compact(supply) + " VVV",
                    detail: (
                      <span className="metric-note">
                        Minted supply minus burns
                      </span>
                    ),
                  },
                ].map((m) => (
                  <div className="metric" key={m.label}>
                    <div className="metric-label">
                      {m.label}
                      <CircleHelp size={12}>
                        <title>
                          {m.label} at the latest source snapshot, independent
                          of chart range.
                        </title>
                      </CircleHelp>
                    </div>
                    <div className="metric-value">{m.value}</div>
                    {m.detail}
                  </div>
                ))}
              </div>
              <div className="snapshot-note">
                Headline metrics show the latest snapshot. Date and aggregation
                filters apply to charts.
              </div>
            </>
          )}
          {tab === "Overview" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="section-number">01</span>
                  <h2>Market overview</h2>
                </div>
                <span>Price & participation</span>
              </div>
              <div className="chart-grid">
                {priceChart}
                {holdersChart}
              </div>
              <div className="chart-reading">
                <BookOpen size={17} />
                <p>
                  <strong>Reading price and participation.</strong> Price is the
                  daily median implied by DEX trades. Holders are addresses with
                  a non-zero balance. An increase in either metric alone does
                  not establish growth in Venice product usage.
                </p>
              </div>
              <div className="section-heading">
                <div>
                  <span className="section-number">02</span>
                  <h2>Token economics</h2>
                </div>
                <button onClick={() => go("Staking & supply")}>
                  Explore supply <ArrowRight size={13} />
                </button>
              </div>
              <div className="economics">
                <div className="staking-summary">
                  <div className="eyebrow">STAKED SHARE</div>
                  <div className="large-number">
                    {stakeShare.toFixed(1)}
                    <span>%</span>
                  </div>
                  <div className="allocation-bar">
                    <span style={{ width: stakeShare + "%" }} />
                  </div>
                  <div className="allocation-labels">
                    <span>
                      <i />
                      {compact(staked)} staked
                    </span>
                    <span>{compact(supply - staked)} unstaked</span>
                  </div>
                  <p>
                    sVVV staking total from the source KPI. The holder table
                    reports a different contract balance.
                  </p>
                </div>
                <div className="supply-summary">
                  <div>
                    <span>Cumulative VVV burned</span>
                    <strong>
                      {compact(burns)} <small>VVV</small>
                    </strong>
                    <Flame size={19} />
                  </div>
                  <div>
                    <span>Net supply since launch</span>
                    <strong>
                      {(
                        (supply / Number(history.supply[0].circulating_supply) -
                          1) *
                        100
                      ).toFixed(2)}
                      <small>%</small>
                    </strong>
                    <ArrowDownRight size={19} />
                  </div>
                  <button onClick={() => go("Methodology")}>
                    How these metrics are calculated <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
              <div className="section-heading">
                <div>
                  <span className="section-number">03</span>
                  <h2>Trading activity</h2>
                </div>
                <span>Decentralized exchanges</span>
              </div>
              <div className="chart-grid">
                {volumeChart}
                {chart(
                  "traders",
                  "DEX traders",
                  "Unique trading addresses per day",
                  [
                    {
                      key: "traders",
                      label:
                        bucket === "Daily"
                          ? "Daily traders"
                          : "Sum of daily traders",
                      color: teal,
                    },
                  ],
                  "bar",
                )}
              </div>
            </>
          )}
          {tab === "Market activity" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="section-number">01</span>
                  <h2>Price & trading</h2>
                </div>
                <span>Unadjusted DEX activity</span>
              </div>
              <div className="chart-grid">
                {priceChart}
                {volumeChart}
                {chart(
                  "traders",
                  "DEX traders",
                  "Daily unique addresses. Aggregated periods sum daily counts.",
                  [
                    {
                      key: "traders",
                      label:
                        bucket === "Daily" ? "Daily traders" : "Trader-days",
                      color: teal,
                    },
                  ],
                  "bar",
                )}
                {chart(
                  "transfers",
                  "VVV transfers",
                  "Token transfer events, including contract activity",
                  [{ key: "transfers", label: "Transfers", color: purple }],
                  "bar",
                )}
              </div>
              <div className="inline-note">
                <CircleHelp size={16} />
                <p>
                  DEX volume includes wash trading and MEV. Transfer counts
                  include contract activity and do not measure unique users.
                </p>
              </div>
            </>
          )}
          {tab === "Staking & supply" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="section-number">01</span>
                  <h2>Supply dynamics</h2>
                </div>
                <span>VVV token units</span>
              </div>
              <div className="chart-grid">
                {chart(
                  "supply",
                  "Outstanding supply",
                  "Cumulative minted VVV minus cumulative burned VVV",
                  [
                    {
                      key: "circulating_supply",
                      label: "Outstanding VVV",
                      color: teal,
                    },
                  ],
                  "line",
                )}
                {chart(
                  "supply",
                  "Cumulative burns",
                  "Total VVV destroyed since launch",
                  [
                    {
                      key: "cumulative_burned",
                      label: "Burned VVV",
                      color: purple,
                    },
                  ],
                )}
                {emissionsChart}
                <div className="staking-detail">
                  <span className="eyebrow">STAKING SNAPSHOT</span>
                  <h2>
                    {compact(staked)} <span>VVV staked</span>
                  </h2>
                  <div className="allocation-bar">
                    <span style={{ width: stakeShare + "%" }} />
                  </div>
                  <p>
                    {stakeShare.toFixed(1)}% of outstanding supply, using the
                    source's 32.99M sVVV staking KPI.
                  </p>
                  <div className="definition-row">
                    <span>Staking contract wallet</span>
                    <strong>{compact(walletRows[0].vvv_balance)} VVV</strong>
                  </div>
                  <p className="quiet">
                    Contract balance and staking KPI differ. They are presented
                    separately rather than treated as equivalent.
                  </p>
                  <a
                    href={
                      "https://basescan.org/address/" + walletRows[0].address
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inspect staking contract <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </>
          )}
          {tab === "Holders" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="section-number">01</span>
                  <h2>Holder distribution</h2>
                </div>
                <span>Wallets, not unique people</span>
              </div>
              <div className="chart-grid">
                {holdersChart}
                <div className="staking-detail">
                  <span className="eyebrow">LARGEST WALLET</span>
                  <h2>
                    {(walletRows[0].pct_of_held_supply * 100).toFixed(2)}
                    <span>% of held supply</span>
                  </h2>
                  <p>
                    The sVVV staking contract is the largest VVV wallet. A
                    contract can represent many individual stakers.
                  </p>
                  <div className="definition-row">
                    <span>Contract balance</span>
                    <strong>{compact(walletRows[0].vvv_balance)} VVV</strong>
                  </div>
                  <div className="definition-row">
                    <span>30-day net inflow</span>
                    <strong className="positive">
                      +{compact(walletRows[0].net_flow_30d)} VVV
                    </strong>
                  </div>
                </div>
              </div>
              <div className="table-head">
                <div>
                  <h2>Largest VVV wallets</h2>
                  <p>
                    25 wallets captured from the source's top-50 table. Flow
                    covers 30 days.
                  </p>
                </div>
                <label className="search">
                  <Search size={14} />
                  <input
                    placeholder="Search address..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(0);
                    }}
                    aria-label="Search wallet address"
                  />
                </label>
                <button
                  className="icon-button"
                  aria-label="Export wallets"
                  onClick={() => download("venice-wallets", filtered)}
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Wallet</th>
                      {[
                        ["vvv_balance", "VVV balance"],
                        ["pct_of_held_supply", "Held supply"],
                        ["net_flow_30d", "Net flow · 30d"],
                      ].map(([key, label]) => (
                        <th
                          key={key}
                          aria-sort={
                            sort === key
                              ? asc
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                        >
                          <button
                            onClick={() => {
                              setSort(key);
                              setAsc(sort === key ? !asc : false);
                              setPage(0);
                            }}
                          >
                            {label} {sort === key ? (asc ? "↑" : "↓") : "↕"}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(page * 10, page * 10 + 10).map((w, i) => (
                      <tr key={w.address}>
                        <td>{page * 10 + i + 1}</td>
                        <td>
                          <a
                            href={"https://basescan.org/address/" + w.address}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {w.address.slice(0, 8)}...{w.address.slice(-6)}{" "}
                            <ArrowUpRight size={11} />
                          </a>
                          {w.address === walletRows[0].address && (
                            <span className="contract-label">sVVV staking</span>
                          )}
                        </td>
                        <td>{compact(w.vvv_balance)}</td>
                        <td>
                          <div className="pct-cell">
                            <span
                              style={{
                                width:
                                  Math.max(1, w.pct_of_held_supply * 100) + "%",
                              }}
                            />
                            {(w.pct_of_held_supply * 100).toFixed(2)}%
                          </div>
                        </td>
                        <td
                          className={
                            w.net_flow_30d >= 0 ? "positive" : "negative"
                          }
                        >
                          {w.net_flow_30d > 0 ? "+" : ""}
                          {compact(w.net_flow_30d)}
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          No wallets match this address.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>{filtered.length} wallets · Snapshot Nov 10, 2026</span>
                <div>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    {page + 1} / {Math.max(1, Math.ceil(filtered.length / 10))}
                  </span>
                  <button
                    disabled={(page + 1) * 10 >= filtered.length}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
          {tab === "Methodology" && (
            <div className="methodology">
              <div className="section-heading">
                <div>
                  <span className="section-number">01</span>
                  <h2>Sources & definitions</h2>
                </div>
                <BookOpen size={17} />
              </div>
              <p className="method-intro">
                A reproducible snapshot of Venice's on-chain activity on Base,
                captured from the supplied Allium dashboard on November 10,
                2026.
              </p>
              <dl>
                {[
                  [
                    "Data coverage",
                    "Daily holder, transfer, and supply history begins January 23, 2025. Price, DEX volume, and trader history begins January 27, 2025. All dates use UTC. The latest day and latest week may be incomplete.",
                  ],
                  [
                    "Price & volume",
                    "Price is the daily median DEX-implied USD price. DEX volume is unadjusted: wash trading and MEV are included. This dashboard does not use an exchange spot-price feed.",
                  ],
                  [
                    "Supply definition",
                    "Outstanding supply follows the source calculation: cumulative mints minus cumulative burns. This is on-chain total supply, not a free-float calculation. Staked and treasury balances are not excluded.",
                  ],
                  [
                    "Staking discrepancy",
                    "The source KPI reports 32.99M VVV staked, while the largest-wallet table reports 34.53M VVV in the sVVV contract. The staking ratio uses the KPI. Contract balance is shown separately because the source does not reconcile these measurements.",
                  ],
                  [
                    "Holder percentages",
                    "The source table stores percentages as fractions, but displays them incorrectly. This dashboard multiplies those fractions by 100: 0.425043 becomes 42.50%. The denominator is held supply as defined by the source.",
                  ],
                  [
                    "Aggregation",
                    "Daily is the source frequency for most charts. Weekly buckets begin Monday. Price, supply, burns, and holder counts use the last observation in each bucket. Transfers and volume are summed. Summed daily unique traders are trader-days, not unique people over the whole period. Emissions retain the source weekly buckets.",
                  ],
                  [
                    "Snapshot & refresh",
                    "The app ships with real extracted data and makes no live-data claims. There is no scheduled refresh or private Allium API connection. CSV exports contain the displayed chart observations; the overview export joins daily price, holders, supply, and volume.",
                  ],
                  [
                    "Wallet coverage",
                    "The source table is titled Top 50 VVV Holders. The snapshot includes the 25 rows exposed on its first page. Wallet labels are limited to the staking contract identified in the source.",
                  ],
                ].map(([title, desc]) => (
                  <div key={title}>
                    <dt>{title}</dt>
                    <dd>{desc}</dd>
                  </div>
                ))}
              </dl>
              <div className="contract-box">
                <span className="eyebrow">VVV TOKEN CONTRACT · BASE</span>
                <div>
                  <a
                    href="https://basescan.org/token/0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf
                  </a>
                  <button
                    className="icon-button"
                    aria-label="Copy token address"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          "0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf",
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <a
                className="source-link"
                href={source}
                target="_blank"
                rel="noreferrer"
              >
                Open source dashboard <ExternalLink size={14} />
              </a>
            </div>
          )}
          <footer>
            <div>
              <Logo />
              <span>AI research / Venice AI</span>
              <span className="quiet">On-chain research · Allium data</span>
            </div>
            <button onClick={() => go("Methodology")}>
              Data & methodology <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
