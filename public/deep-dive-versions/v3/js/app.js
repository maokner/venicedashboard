/* Venice deep dive: seven pages (?tab=), each chart with its own range, interval and menu. Numbers come from
   window.VENICE; words from window.VENICE_COPY, whose {placeholders} are filled here. Sentences whose direction or
   judgment depends on the data are chosen by the small functions under "words that depend on the data". */
(function () {
  const V = window.VENICE || {}, K = V.kpi || {}, META = V.meta || {}, COPY = window.VENICE_COPY || {};
  const F = VC.F, C = VC.compact, MINUS = VC.MINUS;
  const $ = (s, el = document) => el.querySelector(s);
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ok = (v) => v != null && isFinite(v);
  const pct = (v, d = 0) => (!ok(v) ? "–" : (v < 0 ? MINUS : "") + Math.abs(v * 100).toFixed(d) + "%");
  const m$ = (v, d = 1) => (!ok(v) ? "–" : "$" + (v / 1e6).toFixed(d) + "M");
  const vM = (v, d = 1) => (!ok(v) ? "–" : (v < 0 ? MINUS : "") + (Math.abs(v) / 1e6).toFixed(d) + "M");
  const xx = (v, d = 1) => (!ok(v) ? "–" : v.toFixed(d) + "×");
  const parse = VC.parse;
  const day = (s) => (s ? VC.fmtDay(parse(String(s).slice(0, 10))) : "–");
  const D = V.daily || [], MON = V.monthly || [];
  const AS_OF = META.as_of || (D.length ? D[D.length - 1].d : "");
  const YEAR = AS_OF.slice(0, 4);
  const monRow = (k) => MON.find((m) => m.m === k);
  // "October" in the current year, "October 2025" otherwise
  const monName = (k) => (!k ? "–" : d3.utcFormat(k.slice(0, 4) === YEAR ? "%B" : "%B %Y")(parse(k + "-01")));
  const timeUTC = (s) => { if (!s) return ""; const t = new Date(s.replace(/Z?$/, "Z").replace("+00:00Z", "Z")); return isNaN(t) ? "" : d3.utcFormat("%b %-d, %Y, %H:%M")(t); };
  const twice = (r) => (r < 1.5 ? "about the same as" : r < 2.5 ? "about twice" : r < 3.5 ? "about three times" : `about ${Math.round(r)} times`);
  const arrow = (d, f = (v) => pct(v, 1)) => (!ok(d) ? "" : `<span class="${d > 0 ? "up" : d < 0 ? "down" : "flat"}">${d > 0 ? "↑" : d < 0 ? "↓" : ""} ${f(Math.abs(d))}</span>`);
  const retFmt = (v) => (Math.abs(v) >= 1 ? d3.format(",.0f")(v * 100) : (v * 100).toFixed(1)) + "%";
  const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);
  const ICON = {
    dl: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 2.5v7.5m0 0 3-3m-3 3-3-3M3 12.5h10"/></svg>',
    img: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2.5" y="3" width="11" height="10" rx="1"/><path d="m3 11 3.5-3.5 2.5 2.5 1.5-1.5L13 11"/></svg>',
    link: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.7.7M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.7-.7"/></svg>',
    full: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
    close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    more: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12.5" cy="8" r="1.3"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/></svg>',
    ext: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5"/></svg>',
  };

  /* ---------- words that depend on the data ----------
     Two figures compare burns with emissions and are never mixed: the share of new VVV burned (measured, last 30 days,
     in tokens) and burns needed at today's price (forward-looking, in dollars). */
  const W = {};
  const share = K.share_burned_30d, need = K.burns_needed_x;
  const mLast = K.month_last_full, m6 = K.month_6m_before;
  const wf = (key) => (V.waterfall || []).find((w) => w.key === key || w.label.replace(/\n/g, " ").toLowerCase().startsWith(key));
  const airdrop = wf("airdrop"), team = wf("team");
  const ARR = ok(K.disclosed_arr) ? `$${Math.round(K.disclosed_arr / 1e6)}M+ ARR` : "stated ARR";
  const ARR_WHEN = K.disclosed_arr_date ? d3.utcFormat("%B %Y")(parse(K.disclosed_arr_date)) : "";
  W.thesisTail = () => (ok(share) ? `, and over the last 30 days they burned ${pct(share)} of the new VVV paid to stakers` : "");
  W.gapHead = () => {
    const g = need;
    if (!ok(g)) return "What burns still have to do";
    if (g <= 1) return "Burns already cover emissions at today's price";
    if (g < 1.3) return "Burns are close to covering emissions";
    if (g < 1.75) return "Burns have to grow by about half";
    return "Burns have to roughly " + ({ 2: "double", 3: "triple", 4: "quadruple" }[Math.round(g)] || `grow ${Math.round(g)}×`);
  };
  W.read3 = () => {
    const out = ["For the token, the question is when burns catch up with staking rewards."];
    if (ok(need)) out.push(`At today's price of ${F.usd2(K.price)}, covering them takes about ${m$(K.burn_needed_usd_yr, 0)} a year of burns, ${xx(need)} the current pace.`);
    if (ok(K.burn_avg_price_30d) && ok(share) && ok(need)) out.push(`Measured in tokens, the last 30 days' burns took ${pct(share)} of new VVV${Math.abs(share - 1 / need) >= 0.01 ? `, not the ${pct(1 / need)} the same dollars buy today, because they paid an average ${F.usd2(K.burn_avg_price_30d)} a VVV` : ""}.`);
    return out.join(" ");
  };
  W.read2 = () => {
    const hp = K.net_change_headline_pct, ex = K.net_change_ex_oneoff_pct;
    const parts = [];
    if (ok(hp) && airdrop && team) parts.push(`Supply is ${pct(Math.abs(hp))} ${hp < 0 ? "below" : "above"} launch${hp < 0 && ex > 0 ? " only" : ""} because of the March 2025 burns: ${vM(-airdrop.value)} unclaimed airdrop tokens and ${vM(-team.value)} from the team.`);
    parts.push(`Since launch, emissions have added ${vM(K.minted_since_launch)} VVV and revenue burns have removed ${C(K.burned_revenue)}.`);
    if (ok(ex)) parts.push(`Leave both March burns out and supply is ${ex >= 0 ? "up" : "down"} ${pct(Math.abs(ex), 1)}.`);
    return parts.join(" ");
  };
  W.covSentence = () => {
    if (!ok(K.cov_last_full) || !ok(K.cov_6m_before) || !mLast || !m6) return ok(share) ? `Over the last 30 days, burns took back ${pct(share)} of new VVV.` : "";
    const d = K.cov_last_full - K.cov_6m_before, r = K.cov_6m_before ? K.cov_last_full / K.cov_6m_before : 99;
    return `In ${monName(mLast)} burns took back ${pct(K.cov_last_full)} of new VVV, ${Math.abs(d) < 0.02 && r > 0.8 && r < 1.25 ? "about the same as" : d > 0 ? "up from" : "down from"} ${pct(K.cov_6m_before)} in ${monName(m6)}.`;
  };
  W.burnDir = () => (!ok(K.burn_rev_last_full_usd) || !ok(K.burn_rev_6m_before_usd) ? "against" : K.burn_rev_last_full_usd >= K.burn_rev_6m_before_usd ? "up from" : "down from");
  W.stakeSub = () => {
    const now = K.staking_ratio_circ, s1 = K.staking_ratio_sep1, y1 = K.staking_ratio_1y;
    const out = [];
    if (ok(s1)) out.push(`${Math.abs(now - s1) < 0.005 ? "About level with" : now < s1 ? "Down from" : "Up from"} ${pct(s1, 1)} on Sep 1, 2026`);
    if (ok(y1)) out.push(`${now >= y1 ? "above" : "below"} the ${pct(y1, 1)} of a year ago`);
    return (out.length ? out.join("; ") + ". " : "") + "Staked VVV ÷ circulating supply.";
  };
  W.holdersSub = () => {
    const hj = K.holders_jump, out = [];
    if (ok(K.holders_1y) && ok(K.holders)) out.push(`${K.holders >= K.holders_1y ? "Up" : "Down"} ${pct(Math.abs(K.holders / K.holders_1y - 1))} in a year`);
    if (hj && hj.from) out.push(`the biggest 30-day gain came ${VC.fmtDayShort(parse(hj.from))}–${day(hj.to)}`);
    return (out.length ? out.join("; ") + ". " : "") + "An address isn't a person.";
  };
  W.apiNote = () => {
    const lo = K.implied_credit_purchases_lo, hi = K.implied_credit_purchases_hi, arr = K.disclosed_arr;
    const base = `The 5% rule turns burns into purchase dollars. At 4% the estimate would be ${m$(hi, 0)}; at 6%, ${m$(lo, 0)}.`;
    if (!ok(arr)) return base;
    const tail = `If the 5% rule holds, either revenue has grown since or some credit comes from plan allowances.`;
    if (Math.min(lo, hi) >= arr) return `${base} Both are above the ${ARR} Venice reported in ${ARR_WHEN} for the whole business. ${tail}`;
    if (Math.max(lo, hi) >= arr) return `${base} At 5% or less, API purchases alone exceed the ${ARR} Venice reported in ${ARR_WHEN} for the whole business; at 6% they are just under it. ${tail}`;
    return `${base} Both are below the ${ARR} Venice reported in ${ARR_WHEN}, which also counts subscriptions.`;
  };
  W.lean = { bull: ["Good for VVV", "up"], bear: ["Bad for VVV", "down"], mixed: ["Mixed", ""], neutral: ["Neither way", ""] };
  W.venFlow = () => {
    const f = K.venice_flow_30d;
    if (!ok(f)) return "Unstaked, in labeled Venice wallets";
    if (Math.abs(f) < 1000) return "Unchanged over 30 days";
    return `${F.signed(f, (v) => C(v))} VVV in 30 days`;
  };
  W.takeaway = {
    traders: () => ok(K.traders_median_90d) && ok(K.traders_median_90d_prev) ? `A typical day now has about ${C(Math.round(K.traders_median_90d / 100) * 100)} addresses trading VVV, ${K.traders_median_90d >= K.traders_median_90d_prev ? "up" : "down"} from ${C(Math.round(K.traders_median_90d_prev / 100) * 100)} in the 90 days before.` : "Addresses trading VVV on Base DEXs.",
    dex: () => ok(K.dex_vol_30d) && ok(K.dex_vol_30d_prev) ? `${F.usd(K.dex_vol_30d)} traded in the last 30 days, ${K.dex_vol_30d >= K.dex_vol_30d_prev ? "up" : "down"} from ${F.usd(K.dex_vol_30d_prev)} the 30 days before${K.dex_peak_week_after_launch ? `; the busiest week since launch began ${day(K.dex_peak_week_after_launch.start)} (${F.usd(K.dex_peak_week_after_launch.usd)})` : ""}.` : "Buys and sells on Base DEXs in USD.",
    net: () => ok(K.net_change_since_mar25_pct) ? `Up ${pct(K.net_change_since_mar25_pct, 1)} since the March 2025 burns, more slowly after each emission cut (numbered).` : "Ever minted minus burned.",
    diem: () => K.diem_100plus ? `${K.diem_100plus.wallets} wallets with 100 DIEM or more hold ${pct(K.diem_100plus.pct_diem)} of staked DIEM.` : "Staked DIEM by wallet size.",
    top: () => ok(K.top_venice_pct_net) ? `Venice's own wallets hold ${pct(K.top_venice_pct_net)} of net supply and the staking contract ${pct(K.top_staking_pct_net)}${ok(K.top_exchange_pct_net) ? `; labeled exchange wallets in the top 25 hold ${pct(K.top_exchange_pct_net, 1)}` : ""}. Unlabeled: no public tag on Basescan or Blockscout.` : "Unlabeled: no public tag on Basescan or Blockscout.",
  };
  // the price series changes source at the end; say what each stretch is, and call it a close only where it is one
  const PS = META.price_sources || [];
  // short names for the subtitle; Method keeps each stretch's full definition
  const PS_SHORT = { allium: "Daily median price on Base DEXs", coingecko: "CoinGecko daily close" };
  W.priceLabel = () => PS.length <= 1 ? (PS[0] ? (PS_SHORT[PS[0].source] || PS[0].definition) + "." : "Daily VVV price.") : PS.map((x, i) => (i === 0 ? PS_SHORT[x.source] || x.definition : `${PS_SHORT[x.source] || x.definition} from ${VC.fmtDayShort(parse(x.from))}`)).join("; ") + ".";
  const lastSrc = (D[D.length - 1] || {}).price_src;
  const isClose = lastSrc === "coingecko";

  /* ---------- the numbers the copy may use ---------- */
  const P = {
    burn_yr: m$(K.burn_usd_yr), thesis_tail: W.thesisTail(),
    burn_6m_mo: F.usd(K.burn_rev_6m_before_usd), burn_last_mo: F.usd(K.burn_rev_last_full_usd), burn_dir: W.burnDir(),
    m6_name: monName(m6), mlast_name: monName(mLast),
    gap_head: W.gapHead(), burn_needed: m$(K.burn_needed_usd_yr, 0), need_x: xx(need), break_even: F.usd2(K.break_even_price),
    subs_last: ok(K.subs_last_full) ? d3.format(",")(K.subs_last_full) : "–", api_yr: m$(K.implied_credit_purchases_yr, 0),
    cov: pct(share), cov_last: pct(K.cov_last_full), cov_sentence: W.covSentence(),
    cuts: ({ 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven" }[K.emission_cuts] || K.emission_cuts || "several"),
    emit_launch: vM(K.emission_yr_launch ?? ((V.emission_steps || [])[0] || {}).rate_yr, 0), emit_now: vM(K.emission_yr),
    stakers_share: pct(K.emission_to_stakers_share), treasury_share: pct(K.emission_to_treasury_share),
    headline_pct: pct(Math.abs(K.net_change_headline_pct)), below_above: K.net_change_headline_pct < 0 ? "below" : "above",
    only: K.net_change_headline_pct < 0 && K.net_change_ex_oneoff_pct > 0 ? " only" : "",
    ever_minted: vM(K.ever_minted), free_float: vM(K.free_float),
    diem_price: F.usd0(K.diem_price), diem_yield: pct(K.diem_credit_yield), diem_payback: ok(K.diem_payback_years) ? K.diem_payback_years.toFixed(1) : "–",
    diem_payback_util: ok(K.diem_payback_at_util) ? K.diem_payback_at_util.toFixed(1) + " years" : "–", diem_util: pct(K.diem_util_30d),
    diem_venice_share: pct(K.diem_venice_share), mint_rate: ok(K.mint_rate) ? Math.round(K.mint_rate) : "–",
    diem_staked_share: pct(K.diem_staked_share), diem_staked: C(K.diem_staked), diem_supply: C(K.diem_supply),
    mcap: F.usd(K.mcap_circ), mcap_arr: xx(K.mcap_to_arr), mcap_burn: xx(K.mcap_to_burn, 0), arr: ARR, arr_when: ARR_WHEN,
    as_of: day(AS_OF), price_word: isClose ? "close" : "price",
    mint_x: ok(K.mint_multiple) ? K.mint_multiple.toFixed(0) : "–", diem_yield_last: pct(K.diem_credit_yield),
  };
  const T = (key) => (COPY[key] || "").replace(/\{(\w+)\}/g, (_, n) => (n in P ? P[n] : ""));

  /* ---------- URL and per-chart state ----------
     Range, interval, scale and hidden series are kept per chart for the session, so they survive tab changes and the
     theme switch. A chart link carries them in the query for the linked chart only. */
  const TABS = [["overview", "Overview"], ["revenue", "Revenue"], ["supply", "Supply"], ["holders", "Holders"], ["diem", "DIEM"], ["valuation", "Valuation"], ["method", "Method"]];
  const q = new URLSearchParams(location.search);
  let tabQ = (q.get("tab") || "").toLowerCase();
  if (tabQ === "market") tabQ = "valuation";
  let tab = TABS.some((t) => t[0] === tabQ) ? tabQ : "overview";
  let ST = {};
  try { ST = JSON.parse(sessionStorage.getItem("venice-charts") || "{}"); } catch (e) {}
  const saveST = () => { try { sessionStorage.setItem("venice-charts", JSON.stringify(ST)); } catch (e) {} };
  // a deep link's chart state applies once, to the linked chart
  const hashSlug = (() => { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ""; } })();
  if (hashSlug && (q.get("range") || q.get("int"))) { ST[hashSlug] = { ...(ST[hashSlug] || {}), ...(q.get("range") ? { p: q.get("range") } : {}), ...(q.get("int") ? { g: q.get("int") } : {}) }; }
  const urlFor = (t, extra) => { const u = new URLSearchParams(location.search); u.delete("range"); u.delete("int"); if (t === "overview") u.delete("tab"); else u.set("tab", t); Object.entries(extra || {}).forEach(([k, v]) => u.set(k, v)); const s = u.toString(); return location.pathname + (s ? "?" + s : ""); };
  const writeURL = () => history.replaceState(history.state, "", urlFor(tab) + location.hash);

  /* ---------- copy to clipboard, with a fallback when the page may not use the clipboard ---------- */
  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 1600); };
  function copyText(text, msg = "Link copied") {
    const legacy = () => {
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta); ta.select(); let done = false; try { done = document.execCommand("copy"); } catch (e) {} ta.remove();
      if (done) toast(msg); else window.prompt("Copy this link:", text);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast(msg), legacy); else legacy();
  }

  /* ---------- time windows and intervals ---------- */
  const LAST = AS_OF;
  const fromOf = (p, last = LAST) => {
    if (p === "All") return "0000-00-00";
    if (p === "YTD") return last.slice(0, 4) + "-01-01";
    return iso(d3.utcDay.offset(monthsAgo(parse(last), { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[p]), 1));
  };
  // calendar-safe: Mar 31 minus one month is Feb 28 (29), not Mar 3
  function monthsAgo(t, n) {
    const m = d3.utcMonth.offset(d3.utcMonth.floor(t), -n), dim = d3.utcDay.count(m, d3.utcMonth.offset(m, 1));
    return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), Math.min(t.getUTCDate(), dim)));
  }
  const DAILY_P = ["1M", "3M", "6M", "YTD", "1Y", "All"], MONTH_P = ["6M", "YTD", "1Y", "All"];
  // Intervals a window can carry: 1M daily only; 3M daily or weekly; longer any.
  const intervalsFor = (p) => (p === "1M" ? ["D"] : p === "3M" ? ["D", "W"] : ["D", "W", "M"]);
  const INT_LABEL = { A: "Auto", D: "Daily", W: "Weekly", M: "Monthly" };
  const autoInt = (p, bars) => (!bars ? "D" : ["1M", "3M", "6M"].includes(p) ? "D" : "W");
  const iso = (d) => d.toISOString().slice(0, 10);
  const partText = (s, e, n, of) => +s === +e ? `${VC.fmtDay(s)}, ${n} of ${of} days` : partTextR(s, e, n, of);
  const partTextR = (s, e, n, of) => `${VC.fmtDayShort(s)}–${d3.utcFormat(+s === +e ? "%Y" : "%-d, %Y")(e).replace(/^(\d+), /, (m) => (s.getUTCMonth() === e.getUTCMonth() ? m : d3.utcFormat("%b ")(e) + m))}, ${n} of ${of} days`;
  // Group daily rows into calendar months or ISO weeks: flows are summed, levels take the last value, rates the mean.
  // A bucket with fewer days of data than the period has is marked as partial.
  function regroup(rows, g, agg) {
    const fields = Object.keys(agg);
    const start = (d) => (g === "M" ? d3.utcMonth.floor(parse(d)) : d3.utcMonday.floor(parse(d)));
    return d3.groups(rows, (r) => +start(r.d)).map(([k, rs]) => {
      const s = new Date(k), e = g === "M" ? d3.utcMonth.offset(s, 1) : d3.utcDay.offset(s, 7);
      const of = Math.round((e - s) / 864e5);
      const present = rs.filter((r) => fields.some((f) => r[f] != null));
      const o = { d: iso(s), period_start: iso(s), period_end: iso(d3.utcDay.offset(e, -1)), days: present.length, _last: present.length ? present[present.length - 1].d : null };
      fields.forEach((f) => {
        const vals = rs.map((r) => r[f]).filter((v) => v != null);
        o[f] = !vals.length ? null : agg[f] === "sum" ? d3.sum(vals) : agg[f] === "mean" ? d3.mean(vals) : vals[vals.length - 1];
      });
      if (present.length && present.length < of) o._part = partText(parse(present[0].d), parse(present[present.length - 1].d), present.length, of);
      return o;
    });
  }
  // Monthly table rows: mark months a source covers only in part (start or end of its history).
  const monthRows = (src) => MON.map((m) => {
    const dim = m.days_in_month || new Date(Date.UTC(+m.m.slice(0, 4), +m.m.slice(5, 7), 0)).getUTCDate();
    const n = m.days_covered ? (Array.isArray(src) ? Math.min(...src.map((k) => m.days_covered[k] ?? dim)) : m.days_covered[src]) : m.days;
    const cv = m.covered && (Array.isArray(src) ? m.covered[src[0]] : m.covered[src]);
    const r = { ...m, d: m.m + "-01" };
    if (n != null && n > 0 && n < dim) r._part = cv ? partText(parse(cv[0]), parse(cv[1]), n, dim) : `${n} of ${dim} days`;
    return r;
  });
  // CSV: real period dates, rounded values, formula-safe text, named for the chart, window and interval.
  const round = (v) => (typeof v === "number" ? (Math.abs(v) >= 100 ? Math.round(v * 100) / 100 : +v.toPrecision(6)) : typeof v === "string" && /^[=+\-@]/.test(v) && isNaN(+v) ? "'" + v : v);
  const csvRows = (rows) => rows.map((r) => { const o = {}; Object.keys(r).forEach((k) => { if (!k.startsWith("_")) o[k] = round(r[k]); }); return o; });

  /* ---------- figure: card with header controls, plot, source line under it ---------- */
  const BASIS = { onchain: "On-chain", thirdparty: "Third-party classification", modeled: "Modeled", reported: "Reported by Venice", mixed: "Mixed sources" };
  const srcText = (o) => [o.src, o.basis ? BASIS[o.basis] + (o.conf ? ", " + o.conf + " confidence" : "") : ""].filter(Boolean).join(". ");
  let ANIM = false;
  const SEEN = new Set();
  function fig({ slug, span = 6, title, sub, basis, conf, src, body, menu = [], ctl = "" }) {
    const srcLine = src || basis ? `<div class="src">${src ? "Source: " + src.replace(/\.\s*$/, "") + "." : ""}${basis ? ` <span class="basis">${BASIS[basis]}${conf ? ", " + conf + " confidence" : ""}.</span>` : ""}</div>` : "<div></div>";
    const el = h(`<section class="fig s${span}" id="${slug}"><div class="card">
      <div class="card-h"><div class="hi"><div class="t"><h3>${title}</h3>${sub ? `<div class="sub">${sub}</div>` : ""}</div><div class="cc">${ctl}
        <div class="dd more"><button class="ibtn" type="button" aria-label="Chart options" aria-haspopup="menu" aria-expanded="false" title="Download, link, full screen">${ICON.more}</button>
        <div class="menu" role="menu" hidden></div></div></div></div></div>
      <div class="card-b"></div></div>${srcLine}</section>`);
    const bodyEl = el.querySelector(".card-b");
    if (typeof body === "string") bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    const items = [...menu, { icon: "link", label: "Copy link to chart", run: () => copyText(location.origin + (el.__link ? el.__link() : urlFor(tab)) + "#" + slug) }, { icon: "full", k: "full", label: "Full screen", run: () => (el.__exitFull ? el.__exitFull() : fullScreen(el)) }];
    const m = el.querySelector(".menu");
    items.forEach((it) => { const b = h(`<button type="button" role="menuitem"${it.k ? ` data-k="${it.k}"` : ""}>${ICON[it.icon]}<span>${it.label}</span></button>`); b.addEventListener("click", () => { closeMenus(); it.run(); }); m.appendChild(b); });
    wireMenu(el.querySelector(".more"));
    return el;
  }
  // menus: one open at a time; Escape and outside clicks close them
  function closeMenus(except) { document.querySelectorAll(".dd .menu:not([hidden])").forEach((m) => { if (m.parentNode !== except) { m.hidden = true; const b = m.parentNode.querySelector("[aria-expanded]"); if (b) b.setAttribute("aria-expanded", "false"); } }); }
  function wireMenu(dd) {
    const b = dd.querySelector("button"), m = dd.querySelector(".menu");
    b.addEventListener("click", (e) => { e.stopPropagation(); const open = m.hidden; closeMenus(dd); m.hidden = !open; b.setAttribute("aria-expanded", String(open)); if (open) { const f = m.querySelector("a,button"); if (f) f.focus(); } });
    m.addEventListener("keydown", (e) => {
      const its = [...m.querySelectorAll("a,button")], i = its.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); its[(i + 1) % its.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); its[(i - 1 + its.length) % its.length].focus(); }
      if (e.key === "Escape") { closeMenus(); b.focus(); }
    });
  }
  document.addEventListener("click", (e) => { if (!e.target.closest(".dd")) closeMenus(); });

  // Full screen: the card fills the window; Escape or the scrim closes it.
  // Full screen: the card fills the window with a visible close button; Escape, the scrim, the button, the menu item
  // and the browser's Back all close it. Entering pushes a history entry so Back closes the card instead of leaving.
  let ignorePop = false;
  function fullScreen(el) {
    if (document.querySelector(".fig.full")) return;
    const scrim = h('<div class="scrim"></div>');
    const charts = [...el.querySelectorAll(".card-b .chart")];
    const more = el.querySelector(".more > button");
    const close = h(`<button type="button" class="ibtn fs-close" aria-label="Exit full screen" title="Exit full screen">${ICON.close}</button>`);
    const item = [...el.querySelectorAll(".menu [role=menuitem]")].find((m) => m.dataset.k === "full");
    const exit = (fromPop) => {
      if (!el.classList.contains("full")) return;
      el.classList.remove("full"); el.removeAttribute("role"); el.removeAttribute("aria-modal"); scrim.remove(); close.remove();
      if (item) item.querySelector("span").textContent = "Full screen";
      charts.forEach((c) => { delete c.dataset.h; if (c.__vc) c.__vc.draw(false); });
      document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; el.__exitFull = null;
      if (!fromPop && history.state && history.state.fs) { ignorePop = true; history.back(); }
      if (more) more.focus({ preventScroll: true });
    };
    const onKey = (e) => {
      if (e.key === "Escape") exit();
      if (e.key === "Tab") { const f = [...el.querySelectorAll("button, a, select, [tabindex='0']")].filter((x) => x.offsetParent); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    };
    document.body.appendChild(scrim); el.classList.add("full"); el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); document.body.style.overflow = "hidden";
    el.querySelector(".card-h").appendChild(close);
    if (item) item.querySelector("span").textContent = "Exit full screen";
    history.pushState({ ...(history.state || {}), fs: el.id }, "");
    const room = Math.max(240, el.querySelector(".card").clientHeight - el.querySelector(".card-h").offsetHeight - 110);
    charts.forEach((c) => { if (c.__vc && c.__vc.cfg) { c.dataset.h = Math.round(room / charts.length); c.__vc.draw(false); } });
    scrim.addEventListener("click", () => exit()); close.addEventListener("click", () => exit()); document.addEventListener("keydown", onKey);
    el.__exitFull = exit;
    close.focus({ preventScroll: true });
  }

  /* opts.time = { rows, key: "d" | "m", def, agg: {field: "sum"|"mean"|"last"}, bars: bool, csvCols }
     build(rows, g, ctx) returns the chart config for the rows in the chosen window and interval. */
  function chartFig(opts, build) {
    const tm = opts.time, slug = opts.slug;
    const st = (ST[slug] = ST[slug] || {});
    const firstD = tm.rows.length ? (tm.key === "m" ? tm.rows[0].m + "-01" : tm.rows[0].d) : LAST;
    const lastD = tm.rows.length ? (tm.key === "m" ? tm.rows[tm.rows.length - 1].m + "-01" : tm.rows[tm.rows.length - 1].d) : LAST;
    const ref = tm.key === "m" ? lastD : LAST;
    // TradingView rule: a preset that would show the whole series anyway is not offered.
    let presets = (tm.key === "m" ? MONTH_P : DAILY_P).filter((x) => x === "All" || (tm.key === "m" ? monthsBack(x, ref) > firstD : fromOf(x) > firstD));
    if (presets.length < 2) presets = [];
    const def = presets.includes(tm.def) ? tm.def : presets.includes("1Y") && tm.key !== "m" ? "1Y" : "All";
    let p = presets.includes(st.p) ? st.p : def;
    const hasInt = !!tm.agg;
    let g = hasInt ? (["A", "D", "W", "M"].includes(st.g) ? st.g : "A") : null;
    let log = st.log != null ? st.log : null, cmp = !!st.cmp;
    const box = document.createElement("div");
    let body = box, list = null;
    if (opts.events) {
      body = h(`<div class="with-events${opts.eventsBelow ? " below" : ""}"><div class="plot"></div><div class="evs"></div></div>`);
      body.querySelector(".plot").appendChild(box); list = body.querySelector(".evs");
    }
    let readout = null;
    if (opts.readout) { readout = h('<div class="readout" aria-live="off"><span class="rv"></span><span class="rd"></span><span class="rt"></span></div>'); const wrap = document.createElement("div"); wrap.appendChild(readout); wrap.appendChild(body); body = wrap; }
    const ret = opts.returns ? (x) => { const rows = tm.rows.filter((r) => r.d >= fromOf(x) && r[opts.returns] != null); return rows.length > 1 ? rows[rows.length - 1][opts.returns] / rows[0][opts.returns] - 1 : null; } : null;
    const ctl = `${presets.length ? `<div class="rng${ret ? " ret" : ""}" role="group" aria-label="Time range">${presets.map((x) => { const r = ret && ret(x); return `<button type="button" data-p="${x}" aria-pressed="${x === p}">${x}${ret ? `<small class="${r > 0 ? "up" : r < 0 ? "down" : ""}">${ok(r) ? (r > 0 ? "+" : MINUS) + retFmt(Math.abs(r)) : ""}</small>` : ""}</button>`; }).join("")}</div>
      <select class="sel rng-sel" aria-label="Time range">${presets.map((x) => `<option value="${x}"${x === p ? " selected" : ""}>${x}</option>`).join("")}</select>` : ""}
      ${hasInt ? `<select class="sel int" aria-label="Interval"></select>` : ""}${opts.compare ? `<button type="button" class="chip cmp" aria-pressed="false" title="Index VVV and ETH to 100 at the start of the range">vs ETH</button>` : ""}${opts.logToggle ? `<button type="button" class="chip log" aria-pressed="false" title="Logarithmic price scale">Log</button>` : ""}`;
    let cur = [], curG = "D";
    const menu = [
      { icon: "dl", label: "Download CSV", run: () => VC.download(`venice_${slug}_${p || "all"}_${INT_LABEL[curG].toLowerCase()}_${AS_OF}.csv`, VC.toCSV(csvRows(cur.map((r) => { const o = curG === "D" && tm.key === "d" ? { date: r.d } : tm.key === "m" ? { month: r.m } : { period_start: r.period_start, period_end: r.period_end, days: r.days }; (opts.csvCols || []).forEach((c) => (o[c] = r[c])); return o; })))) },
      { icon: "img", label: "Download PNG", run: () => VC.exportPNG(el.querySelector(".card"), { title: el.querySelector("h3").textContent, sub: (el.querySelector(".sub") || {}).textContent || "", meta: `${p || "All"}, ${INT_LABEL[curG].toLowerCase()}. Data through ${day(AS_OF)}.`, src: srcText(opts), name: `venice_${slug}_${p || "all"}_${INT_LABEL[curG].toLowerCase()}_${AS_OF}.png` }) },
    ];
    const el = fig({ ...opts, body, menu, ctl });
    if (opts.note) el.querySelector(".card-b").appendChild(h(`<p class="card-note">${opts.note}</p>`));
    el.__link = () => urlFor(tab, { ...(p ? { range: p } : {}), ...(hasInt ? { int: g } : {}) });
    const intSel = el.querySelector(".int"), logBtn = el.querySelector(".log"), cmpBtn = el.querySelector(".cmp");
    // Bars are never thinner than 3px: an interval whose bars would be is disabled, and Auto moves to the next coarser one.
    const barPx = (k) => {
      if (!tm.bars) return Infinity;
      const from = fromOf(p), d0 = parse(from === "0000-00-00" ? firstD : from < firstD ? firstD : from), days = Math.max(1, (parse(LAST) - d0) / 864e5);
      const plotW = Math.max(200, (box.clientWidth || el.clientWidth - 32 || 600) - 66);
      return (plotW / (days / ({ D: 1, W: 7, M: 30.44 }[k]))) * 0.75;
    };
    const autoFor = () => { const a = autoInt(p, tm.bars), order = ["D", "W", "M"]; return order.slice(order.indexOf(a)).find((k) => barPx(k) >= 3) || "M"; };
    const fillInt = () => {
      if (!intSel) return;
      const allowed = intervalsFor(p);
      const thin = (k) => barPx(k) < 3;
      if (g !== "A" && (!allowed.includes(g) || thin(g))) g = "A";
      const auto = autoFor();
      intSel.innerHTML = ["A", ...allowed].map((k) => `<option value="${k}"${k === g ? " selected" : ""}${k !== "A" && thin(k) ? ` disabled title="Bars would be under 3px wide at this range"` : ""}>${k === "A" ? `Auto (${INT_LABEL[auto].toLowerCase()})` : INT_LABEL[k] + (k !== "A" && thin(k) ? " (too dense)" : "")}</option>`).join("");
      intSel.style.display = allowed.length > 1 ? "" : "none";
    };
    // The readout always works on daily values for the chosen window, whatever the interval, so it agrees with the
    // return printed on the preset button; a hovered week or month is labelled by its period and its last day.
    let dailyWin = [];
    const setRO = (r) => {
      if (!readout) return;
      const k = opts.readout, v = dailyWin.filter((x) => x[k] != null);
      if (!v.length) return;
      const lastOf = (x) => (x && x._last ? v.find((d) => d.d === x._last) || x : x);
      const row = r ? lastOf(r) : v[v.length - 1];
      const per = r && r.period_start ? `${curG === "W" ? "Week of " + VC.fmtDayShort(parse(r.period_start)) : d3.utcFormat("%b %Y")(parse(r.period_start))}, last day ${day(row.d)}` : day(row.d);
      if (cmp) {
        const e = dailyWin.filter((x) => x.eth_price != null), er = e.length ? (r ? lastOf(r) : e[e.length - 1]) : null;
        readout.querySelector(".rv").textContent = "VVV " + (row[k] / v[0][k] - 1 >= 0 ? "+" : MINUS) + retFmt(Math.abs(row[k] / v[0][k] - 1));
        readout.querySelector(".rd").innerHTML = er && er.eth_price ? `<span class="muted">ETH ${(er.eth_price / e[0].eth_price - 1 >= 0 ? "+" : MINUS) + retFmt(Math.abs(er.eth_price / e[0].eth_price - 1))}</span>` : "";
        readout.querySelector(".rt").textContent = `${per}, since ${day(v[0].d)}`;
        return;
      }
      const ch = row[k] / v[0][k] - 1;
      readout.querySelector(".rv").textContent = F.usd2(row[k]);
      readout.querySelector(".rd").innerHTML = arrow(ch, retFmt);
      readout.querySelector(".rt").textContent = r ? `${per}, since ${day(v[0].d)}` : `${day(row.d)}, ${p === "All" ? "since launch" : p === "YTD" ? "year to date" : "over " + p}`;
    };
    const draw = (animate) => {
      const from = tm.key === "m" ? monthsBack(p, ref) : fromOf(p);
      fillInt();
      const gEff = hasInt ? (g === "A" ? autoFor() : g) : tm.key === "m" ? "M" : "D";
      let rows;
      if (tm.key === "d") dailyWin = tm.rows.filter((r) => r.d >= from);
      if (tm.key === "m") rows = tm.rows.filter((r) => r.m + "-01" >= from);
      else {
        // a weekly or monthly view starts on a period boundary so the first bar is a whole period
        const snap = gEff === "W" ? iso(d3.utcMonday.floor(parse(from === "0000-00-00" ? firstD : from))) : gEff === "M" ? iso(d3.utcMonth.floor(parse(from === "0000-00-00" ? firstD : from))) : from;
        rows = tm.rows.filter((r) => r.d >= snap);
        if (gEff !== "D") rows = regroup(rows, gEff, tm.agg);
      }
      cur = rows; curG = gEff;
      const useLog = opts.logToggle && !cmp ? (log != null ? log : p === "All") : false;
      if (logBtn) { logBtn.setAttribute("aria-pressed", String(useLog)); logBtn.disabled = cmp; }
      if (cmpBtn) cmpBtn.setAttribute("aria-pressed", String(cmp));
      const c = build(rows, gEff, { p, cmp });
      c.period = tm.key === "m" ? "M" : gEff;
      if (opts.logToggle) c.logY = useLog;
      if (!c.tipDate) c.tipDate = gEff === "W" ? (d) => "Week of " + VC.fmtDay(d) : gEff === "M" ? (d) => VC.fmtMon(d) : undefined;
      c.aria = c.aria || el.querySelector("h3").textContent + ". " + ((el.querySelector(".sub") || {}).textContent || "");
      c.hidden = new Set(st.hidden || []);
      c.onHidden = (hs) => { st.hidden = [...hs]; saveST(); };
      if (readout) c.onHover = (r) => setRO(r);
      if (list) c.eventList = list;
      const anim = animate && !SEEN.has(slug);
      SEEN.add(slug);
      c.animate = anim;
      VC.timeChart(box, c);
      setRO(null);
    };
    const choose = (x) => {
      if (x === p) return;
      p = x; st.p = p; saveST();
      el.querySelectorAll(".rng [data-p]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === p)));
      const rs = el.querySelector(".rng-sel"); if (rs) rs.value = p;
      fillInt(); draw(false);
    };
    el.querySelectorAll(".rng [data-p]").forEach((b) => b.addEventListener("click", () => choose(b.dataset.p)));
    const rs = el.querySelector(".rng-sel"); if (rs) rs.addEventListener("change", () => choose(rs.value));
    if (intSel) intSel.addEventListener("change", () => { g = intSel.value; st.g = g; saveST(); draw(false); });
    if (cmpBtn) cmpBtn.addEventListener("click", () => { cmp = !cmp; st.cmp = cmp; saveST(); draw(false); });
    if (logBtn) logBtn.addEventListener("click", () => { log = logBtn.getAttribute("aria-pressed") !== "true"; st.log = log; saveST(); draw(false); });
    fillInt();
    requestAnimationFrame(() => draw(ANIM));
    return el;
  }
  // month-series windows: "6M" = the last six months including the current one
  function monthsBack(p, ref) {
    if (p === "All") return "0000-00-00";
    if (p === "YTD") return ref.slice(0, 4) + "-01-01";
    return iso(d3.utcMonth.offset(parse(ref.slice(0, 7) + "-01"), -({ "6M": 6, "1Y": 12 }[p] - 1)));
  }
  const grid = (...figs) => { const g = h('<div class="grid"></div>'); figs.forEach((f) => f && g.appendChild(f)); return g; };
  const intro = (lede, facts, cls = "") => h(`<section class="intro${facts ? "" : " solo"} ${cls}"><div class="lede">${lede}</div>${facts ? `<dl class="facts">${facts.map(([l, v, sub]) => `<div><dt>${l}</dt><dd class="fv">${v}</dd><dd class="fs">${sub || ""}</dd></div>`).join("")}</dl>` : ""}</section>`);
  // a page is a run of sections: a small header (title + one line) over its cards; space between sections, not lines
  const band = (key, ...nodes) => {
    const t = typeof key === "string" ? [T("sec_" + key + "_t"), T("sec_" + key + "_s")] : key;
    const id = "s-" + (typeof key === "string" ? key.replace(/_/g, "-") : t[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    const s = h(`<section class="band" id="${id}" aria-labelledby="${id}-h"><header class="band-h"><h2 id="${id}-h">${t[0]}</h2>${t[1] ? `<p>${t[1]}</p>` : ""}</header></section>`);
    nodes.flat().forEach((n) => n && s.appendChild(n));
    return s;
  };
  // group a page's blocks (after its intro) into sections: [[key, number of blocks], …]. A section groups two or more
  // cards; a key of null leaves a single card standing alone, under its own title, with no section heading over it
  const sections = (view, plan) => { const kids = [...view.children].slice(1); let i = 0; plan.forEach(([key, n]) => { const part = kids.slice(i, i + n); if (key) view.appendChild(band(key, part)); else part.forEach((k) => view.appendChild(k)); i += n; }); };
  const copyBtn = (text, label) => `<button type="button" class="copy" data-copy="${esc(text)}" aria-label="Copy ${esc(label)}" title="Copy">${ICON.copy}</button>`;
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-copy]"); if (b) copyText(b.dataset.copy, "Address copied"); });
  const contractLine = (keys) => `<div class="cline">${keys.filter((k) => META.contracts && META.contracts[k]).map((k) => `<span>${k} <a class="addr" href="https://basescan.org/token/${META.contracts[k]}" target="_blank" rel="noopener">${short(META.contracts[k])}</a>${copyBtn(META.contracts[k], k + " contract address")}</span>`).join("")}</div>`;

  /* ---------- colours by meaning (charts read these names) ---------- */
  const ROLE = { burned: "--c-oneoff", venice_treasury: "--c-venice", venice_staked: "--c-venice", diem_locked: "--c-diem", staked_free: "--c-staked", vesting_cooldown: "--c-other", free_float: "--c-float" };
  const whereKey = (w) => w.key || ({ "Burned": "burned", "Venice treasury & funds": "venice_treasury", "Staked by Venice": "venice_staked", "Staked, locked for DIEM": "diem_locked", "Staked, unlocked": "staked_free", "Vesting & cooldown": "vesting_cooldown", "Free float": "free_float" }[w.label]);
  const WHERE_LABEL = { venice_treasury: "Venice treasury", diem_locked: "Locked for DIEM", staked_free: "Staked, unlocked", vesting_cooldown: "Vesting and cooldown" };

  /* =====================================================================
     SHELL: built once
     ===================================================================== */
  const ch30 = K.price_change_30d;
  // header: one uniform ticker (after Hyperliquid). Every figure is a 12px label over a 16px value, whitespace between,
  // the as-of lines at the right; the price is never larger than the title
  const HL = Object.fromEntries((V.headline || []).map((x) => [x.key, x.value]));
  const hv = (k) => (k in HL ? HL[k] : K[k]);
  const asOf = [`${isClose ? "Daily close" : "Daily price"}, ${day(AS_OF)}`, `Allium data through ${day(META.allium_snapshot)}`];
  const chg = ok(ch30) ? `<span class="h-chg ${ch30 > 0 ? "up" : ch30 < 0 ? "down" : ""}">${ch30 > 0 ? "↑" : ch30 < 0 ? "↓" : ""} ${pct(Math.abs(ch30), 1)}</span>` : "";
  const HSTATS = [["Market cap", F.usd(hv("mcap_circ"))], ["FDV", F.usd(hv("fdv"))], ["Staked", pct(hv("staking_ratio_circ"), 1), "xl"], ["Burns a year", m$(hv("burn_usd_yr")), "xl"]];
  const cell = (l, v, cls = "") => `<div class="h-cell ${cls}"><span class="h-l">${l}</span><span class="h-v">${v}</span></div>`;
  $("#quote").innerHTML = `<div class="h-cells">${cell("VVV price", F.usd2(hv("price")))}${chg ? cell("30-day change", chg) : ""}${HSTATS.map(([l, v, c]) => cell(l, v, c)).join("")}</div><div class="h-meta"><span>${asOf[0]}</span><span>${asOf[1]}</span></div>`;
  if (/\/deep-dive\/?$/.test(location.pathname.replace(/index\.html$/, ""))) $(".top-in").insertBefore(h('<a class="host-back" href="../">‹ Venice AI</a>'), $(".brand"));
  const tabsEl = $("#tabs-in");
  TABS.forEach(([id, label]) => tabsEl.appendChild(h(`<a href="${urlFor(id)}" data-tab="${id}">${label}</a>`)));
  const ink = document.createElement("span"); ink.className = "ink"; tabsEl.appendChild(ink);
  tabsEl.addEventListener("scroll", () => tabsEl.classList.toggle("end", tabsEl.scrollLeft + tabsEl.clientWidth >= tabsEl.scrollWidth - 2), { passive: true });
  const srcNames = ["Allium", "Base", "venicestats", "CoinGecko"].concat(V.peers ? ["DefiLlama"] : []);
  $("#foot").innerHTML = `<div class="foot-in"><span>Built by <a href="https://blockchain.berkeley.edu" target="_blank" rel="noopener">Blockchain at Berkeley</a>. Data from ${srcNames.slice(0, -1).join(", ")} and ${srcNames[srcNames.length - 1]}. Allium data through ${day(META.allium_snapshot)}; Base data through ${day(META.chain_through || AS_OF)}.</span><span>Not investment advice. The authors may hold VVV or DIEM.</span></div>`;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-tab]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); go(a.dataset.tab, true);
  });
  $("#share").addEventListener("click", () => copyText(location.href));
  wireMenu($("#dl-menu"));
  const themeBtn = $("#theme-btn");
  const syncTheme = () => themeBtn.setAttribute("aria-pressed", String(document.documentElement.getAttribute("data-theme") === "dark"));
  syncTheme();
  const applyTheme = (dark, save) => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    if (save) try { localStorage.setItem("venice-theme", dark ? "dark" : "light"); } catch (e) {}
    syncTheme(); VC.redrawAll();
  };
  themeBtn.addEventListener("click", () => applyTheme(document.documentElement.getAttribute("data-theme") !== "dark", true));
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => { let saved = null; try { saved = localStorage.getItem("venice-theme"); } catch (x) {} if (!saved) applyTheme(e.matches, false); });
  // print: always light, drawn at the paper width
  let printDark = false;
  window.addEventListener("beforeprint", () => { printDark = document.documentElement.getAttribute("data-theme") === "dark"; if (printDark) document.documentElement.setAttribute("data-theme", "light"); VC.redrawAll(); });
  window.addEventListener("afterprint", () => { if (printDark) document.documentElement.setAttribute("data-theme", "dark"); VC.redrawAll(); });

  function moveInk(animate = true) {
    const a = tabsEl.querySelector("a[aria-current]");
    if (!a) return;
    ink.classList.toggle("still", !animate || REDUCE());
    ink.style.width = a.offsetWidth + "px";
    ink.style.transform = `translateX(${a.offsetLeft}px)`;
    const l = a.offsetLeft - 24, r = a.offsetLeft + a.offsetWidth + 24;
    if (l < tabsEl.scrollLeft || r > tabsEl.scrollLeft + tabsEl.clientWidth) tabsEl.scrollTo({ left: l, behavior: animate && !REDUCE() ? "smooth" : "auto" });
  }
  new ResizeObserver(() => moveInk(false)).observe(tabsEl);
  const REDUCE = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function syncChrome() {
    document.querySelectorAll("#tabs a[data-tab]").forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    document.title = (tab === "overview" ? "" : TABS.find((t) => t[0] === tab)[1] + " · ") + "Venice (VVV, DIEM) · Deep dive";
  }
  function build(anim) {
    const view = $("#view");
    VC.dispose(view);
    const full = document.querySelector(".fig.full"); if (full && full.__exitFull) full.__exitFull(true);
    ANIM = !!anim && !REDUCE();
    view.innerHTML = "";
    try { PAGES[tab](view); requestAnimationFrame(() => requestAnimationFrame(markScroll)); } catch (e) { console.error(e); view.innerHTML = `<p class="nojs">This page could not load its data. <button class="tbtn" type="button" onclick="location.reload()">Reload</button></p>`; }
    ANIM = false;
  }
  // where the tab bar rests before it sticks: the bottom of the (non-sticky) top bar. Reading the sticky bar itself
  // returns its stuck position, which equals the current scroll.
  const tabsTop = () => Math.round($("#top").getBoundingClientRect().bottom + window.scrollY);
  // a table wider than its card scrolls sideways with an edge fade and a pinned first column
  const markScroll = () => document.querySelectorAll("#view .tw").forEach((w) => w.classList.toggle("scroll", w.scrollWidth > w.clientWidth + 1));
  new ResizeObserver(() => markScroll()).observe(document.body);
  function scrollToHash() {
    if (!hashSlug) return;
    const el = document.getElementById(hashSlug);
    if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 60);
  }

  // Changing page: the shell stays; the old page slides out a little toward the side it came from and the new one
  // slides in from the side of the tab picked. Charts draw in only the first time they are seen.
  let swapId = 0;
  const scrollMem = {};
  window.addEventListener("popstate", () => {
    if (ignorePop) { ignorePop = false; return; }
    const full = document.querySelector(".fig.full");
    if (full && full.__exitFull) { full.__exitFull(true); return; }
    const t = (new URLSearchParams(location.search).get("tab") || "overview").toLowerCase();
    if (TABS.some((x) => x[0] === t)) go(t, false, true);
  });
  function go(t, push, fromHistory) {
    if (t === tab) { if (window.scrollY > tabsTop()) window.scrollTo({ top: tabsTop(), behavior: REDUCE() ? "auto" : "smooth" }); return; }
    scrollMem[tab] = window.scrollY;
    const order = TABS.map((x) => x[0]);
    const dir = order.indexOf(t) > order.indexOf(tab) ? 1 : -1;
    tab = t;
    if (push) history.pushState(null, "", urlFor(t));
    syncChrome(); moveInk(true);
    const view = $("#view");
    const top = tabsTop();
    const target = fromHistory && scrollMem[t] != null ? scrollMem[t] : window.scrollY > top + 1 ? top : null;
    if (REDUCE()) { build(true); if (target != null) window.scrollTo({ top: target }); return; }
    const id = ++swapId;
    view.style.minHeight = view.offsetHeight + "px";
    view.style.setProperty("--dir", dir);
    view.classList.remove("in"); view.classList.add("out");
    setTimeout(() => {
      if (id !== swapId) return;
      build(true);
      if (target != null) window.scrollTo({ top: target, behavior: "instant" });
      view.classList.remove("out"); view.classList.add("in");
      void view.offsetWidth;
      view.classList.remove("in");
      setTimeout(() => { if (id === swapId) view.style.minHeight = ""; }, 260);
    }, 120);
  }

  /* =====================================================================
     PAGES
     ===================================================================== */
  const PAGES = {};
  const EV = (V.events || []);
  const evs = (pred) => EV.filter(pred).map((e) => ({ d: e.d, label: e.label, text: e.text }));

  PAGES.overview = (view) => {
    view.appendChild(intro(`<p class="thesis">${T("thesis")}</p>`, [
      ["Share of new VVV burned", pct(share), "Last 30 days, in tokens"],
      ["Burns needed", xx(need), "At today's price, times the current burn rate"],
      ["Break-even price", F.usd2(K.break_even_price), "Today's burns buy all new VVV at or below it"],
      ["Holders on Base", C(K.holders), `Addresses, ${d3.utcFormat("%b %-d")(parse(K.holders_date || META.allium_snapshot))}`],
    ], "ov"));
    const ovEvents = ["2025-12-08", "2026-04-15", "2026-07-01", "2026-07-17", "2026-09-21"];
    view.appendChild(band("ov_price", grid(priceChart(evs((e) => ovEvents.includes(e.d)))), grid(shareChart())));
    view.appendChild(band("ov_know", h(`<div class="reads">
      <div><h3>${T("ov_read_1_h")}</h3><p>${T("ov_read_1")}</p></div>
      <div><h3>${T("ov_read_2_h")}</h3><p>${W.read2()}</p></div>
      <div><h3>${T("ov_read_3_h")}</h3><p>${W.read3()}</p></div></div>`)));
    const box = h('<div class="diagram"></div>');
    const flowEl = fig({ slug: "flow", span: 12, title: T("ov_flow_t"), sub: T("ov_flow_s"), body: box, src: "Venice docs, Base, venicestats; ARR and users are Venice's own figures",
      menu: [{ icon: "img", label: "Download PNG", run: () => VC.exportPNG(flowEl.querySelector(".card"), { title: T("ov_flow_t"), sub: T("ov_flow_s"), meta: `Data through ${day(AS_OF)}.`, src: "Venice docs, Base, venicestats", name: `venice_flow_${AS_OF}.png` }) }] });
    view.appendChild(grid(flowEl));
    requestAnimationFrame(() => { drawFlow(box); VC.observe(box, () => drawFlow(box)); });
    view.appendChild(grid(signals()));
  };

  const PRICE_ROWS = D.filter((r) => r.price != null);
  function priceChart(events) {
    return chartFig({ slug: "price", span: 12, events: true, readout: "price", returns: "price", logToggle: true, compare: D.some((r) => r.eth_price != null), title: T("ov_price_t"), sub: W.priceLabel(), src: "Allium base.dex.trades, then CoinGecko; ETH from venicestats; events from Venice's announcements", basis: "onchain",
      csvCols: ["price", "price_src", "fdv", "mcap_circ", "eth_price"],
      time: { rows: PRICE_ROWS, key: "d", def: "1Y", agg: { price: "last", fdv: "last", mcap_circ: "last", eth_price: "last" } } },
      (rows, g, ctx) => {
        if (ctx.cmp) {
          const p0 = (rows.find((r) => r.price != null) || {}).price, e0 = (rows.find((r) => r.eth_price != null) || {}).eth_price;
          const ix = rows.map((r) => ({ ...r, vvv_ix: r.price != null ? (r.price / p0) * 100 : null, eth_ix: r.eth_price != null && e0 ? (r.eth_price / e0) * 100 : null }));
          const f = (v) => (v == null ? "–" : (v >= 100 ? "+" : MINUS) + Math.abs(v - 100).toFixed(1) + "%");
          return { data: ix, height: 340, yMin: "auto", series: [{ key: "vvv_ix", label: "VVV", color: "--c-lead", type: "line", fmt: f, width: 1.75 }, { key: "eth_ix", label: "ETH", color: "--c-cmp", type: "line", fmt: f }], yFormat: (v) => v.toFixed(0), events, refLines: [{ value: 100, label: "Start of range = 100", color: "--muted", inDomain: true }] };
        }
        return { data: rows, height: 340, endLabel: true, yMin: "auto", series: [
          { key: "price", label: "VVV", color: "--c-lead", type: "line", fmt: F.usd2, width: 1.75 },
          { key: "mcap_circ", label: "Market cap", color: "--c-lead", type: "line", noLine: true, noLegend: true, fmt: F.usd },
        ], yFormat: (v) => (v >= 1 ? "$" + d3.format("~s")(v) : "$" + v), events };
      });
  }
  // the thesis metric over time: share of new VVV burned each month, with the 100% line
  function shareChart() {
    const from = K.first_share_month || "2025-11";
    const rows = monthRows(["burns", "emissions"]).filter((m) => m.m >= from && m.share_burned != null);
    return chartFig({ slug: "share-burned", span: 12, title: T("ov_share_t"), sub: T("ov_share_s"), basis: "onchain", conf: "high", src: "Allium and Base mints and burns", csvCols: ["share_burned", "emitted_vvv", "burn_revenue_vvv"],
      time: { rows, key: "m", def: "All", bars: true } },
      (r) => ({ data: r, height: 240, yMin: 0, series: [{ key: "share_burned", label: "Share of new VVV burned", color: "--c-burn", type: "bar", fmt: (v) => pct(v, 1) }],
        yFormat: F.pct0, refLines: [{ value: 1, label: "100%: burns equal emissions", color: "--muted", inDomain: true }], partLabel: "In progress",
        tipNote: (x) => (x.emitted_vvv ? `${C(x.burn_revenue_vvv)} burned against ${C(x.emitted_vvv)} new VVV` : "") }));
  }
  const MR_BURNS = monthRows("burns");
  function burnsMonthly() {
    const from = K.first_burn_month || "2025-12";
    return chartFig({ slug: "burns-monthly", span: 6, title: T("rev_burns_t"), sub: T("rev_burns_s"), basis: "onchain", conf: "high", src: "Allium daily burns and the Base burn pull, split using the known buyback and one-off burn transactions",
      csvCols: ["burn_programmatic_usd", "burn_discretionary_usd", "burn_revenue_usd", "days_in_month"],
      time: { rows: MR_BURNS.filter((m) => m.m >= from), key: "m", def: "All", bars: true } },
      (mr) => ({ data: mr, height: 240, total: "Revenue burns", series: [
        { key: "burn_programmatic_usd", label: "Subscriptions and API credits", color: "--c-burn", type: "bar", stack: "a" },
        { key: "burn_discretionary_usd", label: "Monthly buyback", color: "--c-buyback", type: "bar", stack: "a" },
      ], yFormat: F.usd, partLabel: "In progress" }));
  }
  function emittedBurned() {
    const rows = monthRows(["burns", "emissions"]).filter((m) => m.m >= "2025-02").map((m) => ({ ...m, neg_burn: m.burn_revenue_vvv != null ? -m.burn_revenue_vvv : null }));
    return chartFig({ slug: "new-vs-burned", span: 6, title: T("sup_ev_t"), sub: T("sup_ev_s"), basis: "onchain", conf: "high", src: "Allium mints and burns; Base after Allium's last day",
      csvCols: ["emitted_vvv", "burn_revenue_vvv", "share_burned", "days_in_month"],
      time: { rows, key: "m", def: "All", bars: true } },
      (r) => ({ data: r, height: 240, series: [
        { key: "emitted_vvv", label: "New VVV", color: "--c-lead", type: "bar", fmt: (v) => C(v) + " VVV" },
        { key: "neg_burn", label: "Revenue burns", color: "--c-burn", type: "bar", fmt: (v) => (v == null ? "–" : C(Math.abs(v)) + " VVV") },
      ], yFormat: (v) => C(v), partLabel: "In progress", tipNote: (x) => (x.share_burned != null ? `${pct(x.share_burned)} of new VVV burned` : "") }));
  }

  function signals() {
    const tabOf = { demand: "revenue", revenue: "revenue", supply: "supply", holders: "holders", diem: "diem", valuation: "valuation", market: "valuation" };
    const tb = h(`<div class="tw"><table class="t sig"><thead><tr><th>Signal</th><th class="r">Now</th><th class="hide-sm">Trend</th><th>Reads as</th></tr></thead><tbody></tbody></table></div>`);
    (V.signals || []).forEach((g) => {
      const t = tabOf[g.ch] || "overview";
      const lean = W.lean[g.lean] || W.lean.neutral;
      const win = g.window || g.spark_window || "";
      const tr = h(`<table><tr><td><a class="sig-a" href="${urlFor(t)}" data-tab="${t}">${esc(g.name)}</a><div style="color:var(--muted);font-size:13px;margin-top:2px">${esc(g.why)}</div></td><td class="r" style="white-space:nowrap">${esc(g.now)}</td><td class="hide-sm">${g.spark ? `<div style="display:flex;align-items:center;gap:8px"><div style="width:96px;height:26px" class="sp"></div><span style="font-size:12px;color:var(--muted);white-space:nowrap">${esc(win)}</span></div>` : ""}</td><td class="${lean[1]}" style="white-space:nowrap">${lean[0]}</td></tr></table>`).querySelector("tr");
      tb.querySelector("tbody").appendChild(tr);
      if (g.spark) requestAnimationFrame(() => VC.spark(tr.querySelector(".sp"), g.spark, { color: "--c-lead" }));
    });
    return fig({ slug: "signals", span: 12, title: T("sig_h"), sub: T("sig_s"), src: "Allium, Base, venicestats. Our reading of each trend, not a forecast", body: tb });
  }

  PAGES.revenue = (view) => {
    view.appendChild(intro(`<p>${T("rev_lede")}</p>`, [
      [`Burns in ${monName(mLast)}`, F.usd(K.burn_rev_last_full_usd), `${W.burnDir() === "up from" ? "Up" : "Down"} from ${P.burn_6m_mo} in ${P.m6_name}`],
      [`Subscriptions, ${d3.utcFormat("%b")(parse((mLast || AS_OF.slice(0, 7)) + "-01"))}`, P.subs_last, "New plans; one burn each"],
      ["API purchases per year", P.api_yr, "Implied by credit burns"],
    ]));
    const MS = monthRows("subs"), MA = monthRows("api");
    view.appendChild(band("rev_month", grid(burnsMonthly(),
      chartFig({ slug: "subscriptions", span: 6, title: T("rev_subs_t"), sub: T("rev_subs_s"), basis: "thirdparty", conf: "medium", src: "Base subscription burns; tier split by venicestats", csvCols: ["new_subs_pro", "new_subs_plus", "new_subs_max", "new_sub_first_month_usd", "days_in_month"],
        time: { rows: MS.filter((m) => m.m >= "2026-04"), key: "m", def: "All", bars: true } },
        (subs) => ({ data: subs, height: 240, total: "All new plans", series: [
          { key: "new_subs_pro", label: `Pro, $${META.prices ? META.prices.pro : 18} a month`, color: "--c-tier1", type: "bar", stack: "s" },
          { key: "new_subs_plus", label: `Pro Plus, $${META.prices ? META.prices.plus : 68}`, color: "--c-tier2", type: "bar", stack: "s" },
          { key: "new_subs_max", label: `Max, $${META.prices ? META.prices.max : 200}`, color: "--c-tier3", type: "bar", stack: "s" },
        ], yFormat: F.num, tipFormat: F.int, partLabel: "In progress", tipNote: (r) => `First month at list price: ${F.usd(r.new_sub_first_month_usd)}` })))));
    const arr = K.disclosed_arr;
    const rulesEl = fig({ slug: "burn-rules", span: 5, title: T("rev_rules_t"), sub: T("rev_rules_s"), src: "Venice blog, Apr 15 and Jul 17, 2026; venice.ai/pricing",
        body: `<div class="tw"><table class="t"><thead><tr><th>When</th><th class="r">Burned</th></tr></thead><tbody>${[
          [`New Pro plan ($${META.prices.pro} a month)`, "$2"], [`New Pro Plus plan ($${META.prices.plus})`, "$5"], [`New Max plan ($${META.prices.max})`, "$10"],
          ["API-credit purchase", pct(META.credit_burn_share) + " of it"], ["Once a month", "The buyback budget"]].map(([a, b]) => `<tr><td>${a}</td><td class="r" style="white-space:nowrap">${b}</td></tr>`).join("")}</tbody></table></div><p class="card-note">Each sale's burn is its own swap through the Aerodrome VVV/WETH pool; the buyback is one transaction a month.</p>` });
    const apiEl = grid(chartFig({ slug: "api-purchases", span: 12, title: T("rev_api_t"), sub: T("rev_api_s"), note: W.apiNote(), basis: "modeled", conf: "medium", src: "Base credit burns (venicestats classification) divided by 5%", csvCols: ["credits_burn_usd_vs", "implied_api_credit_purchases", "days_in_month"],
      time: { rows: MA.filter((m) => m.m >= "2026-07"), key: "m", def: "All", bars: true } },
      (api) => ({ data: api, height: 200, legend: true, series: [{ key: "implied_api_credit_purchases", label: "Implied API purchases (modeled)", color: "--c-tier1", type: "bar", hatch: true }],
        yFormat: F.usd, yMax: ok(arr) ? (arr / 12) * 1.12 : null, refLines: ok(arr) ? [{ value: arr / 12, label: `${ARR}, per month`, color: "--muted", inDomain: true }] : [], partLabel: "In progress",
        tipNote: (r) => { const n = r.days_covered ? r.days_covered.api : r.days; return n ? `Annualized ${F.usd((r.implied_api_credit_purchases * 365) / n)}` : ""; } })));
    const dailyEl = grid(chartFig({ slug: "burns-daily", span: 12, title: T("rev_daily_t"), sub: T("rev_daily_s"), basis: "onchain", src: "Allium daily burns; Base after Allium's last day", csvCols: ["burn_programmatic_usd"],
      time: { rows: (() => { const rs = D.filter((r) => r.burn_programmatic_usd != null), i = rs.findIndex((r) => r.burn_programmatic_usd >= 500); return i > 0 ? rs.slice(i) : rs; })(), key: "d", def: "1Y", bars: true, agg: { burn_programmatic_usd: "sum" } } },
      (dr) => ({ data: dr, height: 220, series: [{ key: "burn_programmatic_usd", label: "Subscriptions and API credits", color: "--c-burn", type: "bar" }], yFormat: F.usd, partLabel: "In progress" })));
    const bb = (V.disc_history || []).slice().reverse();
    const bbRow = (x) => { const r = D.find((d) => d.d === x.date); return `<tr><td>${day(x.date)}</td><td class="r">${d3.format(",.0f")(x.vvv_burned)}</td><td class="r">${r && r.price ? F.usd(x.vvv_burned * r.price) : "–"}</td><td class="addr hide-sm">${x.tx_hash ? `<a href="https://basescan.org/tx/${x.tx_hash}" target="_blank" rel="noopener">${x.tx_hash.slice(0, 10)}…</a>` : "–"}</td></tr>`; };
    const BB_N = 5;   // rows shown before "Show all": the table then matches the burn rules card beside it
    const bbEl = fig({ slug: "buybacks", span: 7, title: T("rev_buyback_t"), sub: T("rev_buyback_s"), src: "Base, Venice buyback Safe 0x35fb…dc57",
      menu: [{ icon: "dl", label: "Download CSV", run: () => VC.download(`venice_buybacks_${AS_OF}.csv`, VC.toCSV(csvRows(V.disc_history || []))) }],
      body: `<div class="tw"><table class="t"><thead><tr><th>Date</th><th class="r">VVV burned</th><th class="r">Value then</th><th class="hide-sm">Transaction</th></tr></thead><tbody>${bb.slice(0, BB_N).map(bbRow).join("")}</tbody></table></div>${bb.length > BB_N ? `<div class="rows-f"><span>${BB_N} of ${bb.length} buybacks</span><button type="button" class="more-rows">Show all ${bb.length}</button></div>` : ""}` });
    const mbb = bbEl.querySelector(".more-rows");
    if (mbb) mbb.addEventListener("click", () => { const all = mbb.textContent.startsWith("Show all"); bbEl.querySelector("tbody").innerHTML = (all ? bb : bb.slice(0, BB_N)).map(bbRow).join(""); mbb.textContent = all ? `Show ${BB_N}` : `Show all ${bb.length}`; mbb.previousElementSibling.textContent = `${all ? bb.length : BB_N} of ${bb.length} buybacks`; });
    view.appendChild(band("rev_api", apiEl, dailyEl, grid(bbEl, rulesEl)));
  };

  PAGES.supply = (view) => {
    view.appendChild(intro(`<p>${T("sup_lede")}</p>`, [
      ["Emissions per year", vM(K.emission_yr) + " VVV", `Down from ${P.emit_launch} at launch`],
      ["Burned so far", vM(K.burned) + " VVV", ok(K.burned_oneoff) ? `${vM(K.burned_oneoff)} of it in two burns on Mar 12, 2025` : ""],
      ["Break-even price", F.usd2(K.break_even_price), "Burns buy all new VVV at or below it"],
    ]));
    const steps = (V.waterfall || []).map((w) => {
      const k = w.key || (w.kind === "start" ? "genesis" : w.kind === "end" ? "today" : /emission/i.test(w.label) ? "emissions" : /airdrop/i.test(w.label) ? "airdrop_burn" : /team/i.test(w.label) ? "team_burn" : "revenue_burns");
      const role = { genesis: ["--c-total", "--fg"], today: ["--c-total", "--fg"], emissions: ["--c-lead", "--fg"], airdrop_burn: ["--c-oneoff", "--fg-2"], team_burn: ["--c-oneoff", "--fg-2"], revenue_burns: ["--c-burn", "--burn-text"] }[k] || ["--c-total", "--fg"];
      return { ...w, color: role[0], textColor: role[1], hatch: k === "airdrop_burn" || k === "team_burn" };
    });
    const wfEl = fig({ slug: "waterfall", span: 6, title: T("sup_wf_t"), sub: T("sup_wf_s"), basis: "onchain", conf: "high", src: "Allium mints and burns, Base burn transactions",
      menu: [{ icon: "dl", label: "Download CSV", run: () => VC.download(`venice_supply_waterfall_${AS_OF}.csv`, VC.toCSV(V.waterfall.map((w) => ({ step: w.label.replace("\n", " "), vvv: Math.round(w.value) })))) },
        { icon: "img", label: "Download PNG", run: () => VC.exportPNG(wfEl.querySelector(".card"), { title: wfEl.querySelector("h3").textContent, sub: wfEl.querySelector(".sub").textContent, meta: `Data through ${day(AS_OF)}.`, src: "Allium mints and burns, Base burn transactions. On-chain, high confidence", name: `venice_supply_waterfall_${AS_OF}.png` }) }],
      body: h('<div class="wf"></div>') });
    const anim = ANIM && !SEEN.has("waterfall"); SEEN.add("waterfall");
    requestAnimationFrame(() => VC.waterfall(wfEl.querySelector(".wf"), { steps, height: 266, animate: anim, fmt: (v) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + "M" : (v / 1e3).toFixed(0) + "K"), axisFmt: F.num }));
    const cuts = evs((e) => e.emission_cut || e.d === "2025-03-12");
    view.appendChild(band("sup_launch", grid(wfEl, emittedBurned()), grid(chartFig({ slug: "net-supply", span: 12, events: true, title: T("sup_net_t"), sub: W.takeaway.net() + " VVV.", basis: "onchain", src: "Allium; after Allium's last day, Base mints and burns", csvCols: ["net_supply", "minted", "burned_allium"],
      time: { rows: D.filter((r) => r.net_supply), key: "d", def: "All", agg: { net_supply: "last", minted: "sum", burned_allium: "sum" } } },
      (ns) => ({ data: ns, height: 260, yMin: "auto", series: [{ key: "net_supply", label: "Net supply", color: "--c-lead", type: "line", fmt: (v) => vM(v, 2) + " VVV" }], yFormat: F.num, events: cuts })))));
    view.appendChild(grid(calcInflation()));
  };

  PAGES.holders = (view) => {
    view.appendChild(intro(`<p>${T("hold_lede")}</p>${contractLine(["VVV", "sVVV"])}`, [
      ["Free float", P.free_float + " VVV", "Not burned, staked, vesting or Venice's"],
      ["Venice treasury", vM(K.venice_vvv) + " VVV", W.venFlow()],
      ["Unstake queue (7 days)", C(K.cooldown) + " VVV", ok(K.cooldown_30d) ? `${C(K.cooldown_30d)} on ${day(K.cooldown_30d_date)}` : "Waiting out the cooldown"],
    ]));
    const parts = (V.where || []).map((w) => { const k = whereKey(w); return { ...w, label: WHERE_LABEL[k] || w.label, color: ROLE[k] || "--c-other", hatch: k === "burned" || k === "venice_staked" }; });
    const wb = h('<div class="wb"></div>');
    view.appendChild(grid(fig({ slug: "where", span: 12, title: T("hold_where_t"), sub: T("hold_where_s"), basis: "mixed", conf: "high", src: "Base balances; Venice wallets from Venice docs and venicestats, each checked on-chain",
      menu: [{ icon: "dl", label: "Download CSV", run: () => VC.download(`venice_where_vvv_sits_${AS_OF}.csv`, VC.toCSV((V.where || []).map((w) => ({ bucket: w.label, vvv: Math.round(w.value), note: w.note })))) }], body: wb })));
    const anW = ANIM && !SEEN.has("where"); SEEN.add("where");
    requestAnimationFrame(() => VC.stackBar(wb, { parts, total: K.ever_minted, fmt: (v) => vM(v), animate: anW }));
    const defs = V.supply_defs || [];
    const defsEl = (fig({ slug: "supply-defs", span: 12, title: T("hold_defs_t"), sub: T("hold_defs_s"),
      body: `<div class="tw"><table class="t"><thead><tr><th>Measure</th><th class="r">VVV</th><th>Answers</th><th class="hide-sm">How it's counted</th></tr></thead><tbody>${defs.map((x) => `<tr><td style="white-space:nowrap"><b>${x.name}</b></td><td class="r">${vM(x.value, 2)}</td><td>${x.question}</td><td class="hide-sm" style="color:var(--muted)">${x.formula ? `${esc(x.formula)}. ` : ""}${x.note}</td></tr>`).join("")}</tbody></table></div>${V.supply_identity ? `<p class="card-note">${esc(V.supply_identity)}</p>` : ""}` }));
    view.appendChild(grid(defsEl, vestingFig()));
    const hEv = evs((e) => ["2025-08-20", "2026-05-12", "2026-10-20"].includes(e.d));
    view.appendChild(grid(
      chartFig({ slug: "holders", span: 6, events: true, eventsBelow: true, title: T("hold_holders_t"), sub: W.holdersSub(), basis: "onchain", src: `Allium balances, through ${day(K.holders_date || META.allium_snapshot)}. ${T("hold_count_note")}`, csvCols: ["holders"],
        time: { rows: D.filter((r) => r.holders != null), key: "d", def: "1Y", agg: { holders: "last" } } },
        (hs) => ({ data: hs, height: 230, yMin: "auto", series: [{ key: "holders", label: "Holders", color: "--c-lead", type: "line", fmt: F.int }], yFormat: F.num, events: hEv })),
      chartFig({ slug: "staked-share", span: 6, title: T("hold_stake_t"), sub: W.stakeSub(), basis: "onchain", src: "Base sVVV mints and burns; circulating = net supply minus Venice wallets' unstaked VVV", csvCols: ["staking_ratio_circ", "staked", "circulating"],
        time: { rows: D.filter((r) => r.staking_ratio_circ != null), key: "d", def: "1Y", agg: { staking_ratio_circ: "last", staked: "last", circulating: "last" } } },
        (st) => ({ data: st, height: 230, yMin: "auto", topPad: true, series: [
          { key: "staking_ratio_circ", label: "Staked share", color: "--c-staked", type: "line", fmt: (v) => pct(v, 1) },
          { key: "staked", label: "Staked VVV", color: "--c-staked", type: "line", noLegend: true, noLine: true, fmt: (v) => vM(v, 2) },
        ], yFormat: F.pct0 }))));
    view.appendChild(grid(venFig()));
    view.appendChild(grid(topHolders()));
    sections(view, [["hold_where", 2], ["hold_count", 1], ["hold_move", 2]]);
  };
  function vestingFig() {
    const v = V.vesting;
    if (!v) return null;
    const strip = `<dl class="facts in-card">${[["Still locked", vM(v.locked, 2) + " VVV", `In ${v.active_streams} active streams`], ["Released a day", C(v.daily_release) + " VVV", `About ${pct(v.daily_release * 30 / (K.free_float || 1), 1)} of the free float a month`], ["Fully vested by", d3.utcFormat("%b %Y")(parse(v.fully_vested_by)), "When the last stream ends"]].map(([l, x, sub]) => `<div><dt>${l}</dt><dd class="fv">${x}</dd><dd class="fs">${sub}</dd></div>`).join("")}</dl>`;
    const cliff = v.cliff && v.cliff.date ? `<p class="prose">On ${day(v.cliff.date)}, ${v.cliff.stream_count} streams end and the daily release drops by ${v.cliff.drop_pct}%.</p>` : "";
    const flow = ok(v.recipients_net_flow_30d) ? `<p class="prose">Over the last 30 days, the wallets that receive these streams ${v.recipients_net_flow_30d < 0 ? "sold" : "bought"} a net ${C(Math.abs(v.recipients_net_flow_30d))} VVV on DEXs.</p>` : "";
    const totals = `<table class="kv"><tbody>${[["Deposited into streams", v.deposited], ["Withdrawn by recipients so far", v.withdrawn], ["Recipients", v.recipients], ["Streams in all", v.total_streams]].filter((r) => ok(r[1])).map(([l, x]) => `<tr><td class="lab">${l}</td><td class="v">${/Recipients|Streams/.test(l) ? d3.format(",")(x) : vM(x, 2) + " VVV"}</td></tr>`).join("")}</tbody></table>`;
    // left: the three figures and what changes next; right: the stream totals
    const body = `<div class="vest"><div class="vest-l">${strip}${cliff}${flow}</div><div class="vest-r">${totals}</div></div>`;
    return fig({ slug: "vesting", span: 12, title: T("hold_vest_t"), sub: T("hold_vest_s"), src: "venicestats vesting index of Sablier streams on Base", body });
  }
  function venFig() {
    const tops = (V.top_holders || []).filter((t) => t.kind !== "Venice contract" && Math.abs(t.net_flow_30d || 0) >= 100000).sort((a, b) => Math.abs(b.net_flow_30d) - Math.abs(a.net_flow_30d)).slice(0, 3);
    const why = (t) => t.move_note || t.note || (t.kind === "Vesting" ? "released from vesting streams" : t.kind === "Exchange" ? (t.net_flow_30d > 0 ? "moved onto the exchange" : "withdrawn from the exchange") : t.kind === "DEX pool" ? "pool balance change" : "no public label");
    const flows = (K.venice_flows_30d || []).filter((x) => Math.abs(x.vvv) >= 500);
    const f = K.venice_flow_30d;
    const lead = `Venice's labeled wallets hold ${vM(K.venice_vvv)} VVV unstaked, ${twice((K.venice_vvv || 0) / (K.free_float || 1)).replace("about the same as", "about as much as")} the free float.${ok(f) ? ` Over the 30 days to ${day(K.venice_flow_30d_to || AS_OF)} their balance ${Math.abs(f) < 1000 ? "barely moved" : (f < 0 ? "fell" : "rose") + " by " + C(Math.abs(f)) + " VVV"}${f < 0 && K.venice_to_exchange_30d === 0 ? ", none of it to a labeled exchange" : ""}.` : ""}`;
    const body = `<p class="prose" style="margin:0 0 10px">${lead}</p><div class="two">
      ${flows.length ? `<div class="tw"><table class="t"><thead><tr><th>Venice wallets, last 30 days</th><th class="r">VVV</th></tr></thead><tbody>${flows.map((x) => `<tr><td>${esc(x.label)}</td><td class="r">${F.signed(x.vvv, (v) => C(v))}</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${tops.length ? `<div class="tw"><table class="t"><thead><tr><th>Largest 30-day moves, top wallets</th><th class="r">VVV</th></tr></thead><tbody>${tops.map((t) => `<tr><td>${esc(t.label || short(t.address))}<span class="sub-n">${esc(why(t))}</span></td><td class="r">${F.signed(t.net_flow_30d, (x) => C(x))}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>`;
    return fig({ slug: "venice-wallets", span: 12, title: "Venice's wallets and the big movers", sub: `Venice wallets from Base transfers to ${day(K.venice_flow_30d_to || AS_OF)}; top wallets from Allium to ${day(META.allium_snapshot)}.`, src: "Base transfers; Allium top holders", body });
  }
  function topHolders() {
    const all = (V.top_holders || []).map((t, i) => ({ ...t, rank: t.rank || i + 1, usd: K.price ? t.balance * K.price : null }));
    let sortK = "balance", dir = -1, showAll = false;
    const maxPct = d3.max(all, (t) => t.pct_net) || 1;
    const el = fig({ slug: "top-holders", span: 12, title: T("hold_top_t"), sub: W.takeaway.top(), src: `Allium top holders, through ${day(META.allium_snapshot)}; labels from Venice docs, venicestats and Basescan`,
      menu: [{ icon: "dl", label: "Download CSV", run: () => VC.download(`venice_top_holders_${AS_OF}.csv`, VC.toCSV(csvRows(V.top_holders || []))) }], body: "<div></div>" });
    const th = (k, label, cls = "r") => `<th class="sort ${cls}" ${sortK === k ? `aria-sort="${dir < 0 ? "descending" : "ascending"}"` : ""}><button type="button" data-k="${k}">${label}</button></th>`;
    const render = () => {
      const rows = all.slice().sort((a, b) => dir * ((a[sortK] || 0) - (b[sortK] || 0)));
      const shown = showAll ? rows : rows.slice(0, 15);
      el.querySelector(".card-b").innerHTML = `<div class="tw"><table class="t"><thead><tr><th class="r hide-sm" style="width:36px">#</th><th>Wallet</th><th class="hide-sm">Owner</th>${th("balance", "VVV")}<th class="r hide-sm">Value</th>${th("pct_net", "Share of net supply", "r hide-sm")}${th("net_flow_30d", "30-day change")}</tr></thead><tbody>${shown.map((t) => `<tr><td class="r muted hide-sm">${t.rank}</td><td class="addr"><a href="https://basescan.org/address/${t.address}" target="_blank" rel="noopener">${short(t.address)}</a>${copyBtn(t.address, "address")}<span class="own" style="display:none">${esc(t.label || "Unlabeled")}</span></td><td class="hide-sm">${t.label ? esc(t.label) : '<span class="muted">Unlabeled</span>'}${t.note ? `<span class="sub-n">${esc(t.note)}</span>` : ""}</td><td class="r">${vM(t.balance, 2)}</td><td class="r hide-sm">${F.usd(t.usd)}</td><td class="r hide-sm bar-cell"><span class="bar" style="width:${Math.max(t.pct_net > 0 ? 2 : 0, Math.round((t.pct_net / maxPct) * 64))}px"></span><span>${pct(t.pct_net, 1)}</span></td><td class="r${t.net_flow_30d ? "" : " muted"}">${t.net_flow_30d ? F.signed(t.net_flow_30d, (x) => C(x)) : "0"}</td></tr>`).join("")}</tbody></table></div>
        <div class="rows-f"><span>${shown.length} of ${all.length} wallets</span>${all.length > 15 ? `<button type="button" class="more-rows">${showAll ? "Show 15" : `Show all ${all.length}`}</button>` : ""}</div>`;
      el.querySelectorAll("th.sort button").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.k; if (k === sortK) dir = -dir; else { sortK = k; dir = -1; } render(); }));
      const mb = el.querySelector(".more-rows"); if (mb) mb.addEventListener("click", () => { showAll = !showAll; render(); });
      if (window.innerWidth < 700) el.querySelectorAll(".own").forEach((o) => (o.style.display = "block"));
    };
    render();
    return el;
  }

  PAGES.diem = (view) => {
    view.appendChild(intro(`<p>${T("diem_lede")}</p>${contractLine(["DIEM", "sVVV"])}`, [
      ["DIEM outstanding", C(K.diem_supply), ok(K.diem_cap) ? `Cap ${C(K.diem_cap)}` : ""],
      ["Minted by Venice", P.diem_venice_share, "Of DIEM outstanding"],
      ["Daily credit used", P.diem_util, "Last 30 days, all staked DIEM (venicestats)"],
    ]));
    view.appendChild(h(`<div class="steps3">${[1, 2, 3].map((n) => `<div><h3><span>${n}</span>${T("diem_step_" + n + "_h")}</h3><p>${T("diem_step_" + n)}</p></div>`).join("")}</div>`));
    const DS = D.filter((r) => r.diem_price);
    const dAgg = { diem_price: "last", diem_credit_yield: "last", diem_mint_cost: "last", mint_rate: "last" };
    view.appendChild(grid(
      chartFig({ slug: "diem-yield", span: 6, title: T("diem_yield_t"), sub: T("diem_yield_s"), basis: "modeled", conf: "high", src: "DEX prices via CoinGecko and venicestats", csvCols: ["diem_price", "diem_credit_yield"],
        time: { rows: DS, key: "d", def: "1Y", agg: dAgg } },
        (ds) => ({ data: ds, height: 240, yMin: 0, series: [
          { key: "diem_credit_yield", label: "Implied yield", color: "--c-diem", type: "line", fmt: (v) => pct(v, 1) },
          { key: "diem_price", label: "DIEM price", color: "--c-diem", type: "line", noLegend: true, noLine: true, fmt: F.usd0 },
        ], yFormat: F.pct0, tipNote: (r) => (r.diem_price ? `Pays back in ${(r.diem_price / 365).toFixed(1)} years at full use` : "") })),
      chartFig({ slug: "diem-mint", span: 6, title: T("diem_mint_t"), sub: T("diem_mint_s"), basis: "onchain", conf: "high", src: "sVVV mint-rate table, DEX prices", csvCols: ["diem_mint_cost", "diem_price", "mint_rate"],
        time: { rows: DS.filter((r) => r.diem_mint_cost), key: "d", def: "1Y", agg: dAgg } },
        (ds) => ({ data: ds, height: 240, yMin: 0, series: [
          { key: "diem_mint_cost", label: "sVVV locked per DIEM, in USD", color: "--c-lead", type: "line", fmt: F.usd0 },
          { key: "diem_price", label: "DIEM market price", color: "--c-diem", type: "line", fmt: F.usd0 },
        ], yFormat: F.usd, tipNote: (r) => (r.diem_mint_cost && r.diem_price ? `Locks ${(r.diem_mint_cost / r.diem_price).toFixed(1)}× the price` : "") }))));
    view.appendChild(grid(
      chartFig({ slug: "diem-supply", span: 6, title: T("diem_supply_t"), sub: T("diem_supply_s"), basis: "onchain", conf: "high", src: "Base DIEM mints and burns; Venice wallet labels", csvCols: ["diem_supply", "diem_supply_venice", "diem_supply_market"],
        time: { rows: D.filter((r) => r.diem_supply != null && r.d >= "2025-08-17"), key: "d", def: "1Y", agg: { diem_supply: "last", diem_supply_venice: "last", diem_supply_market: "last" } } },
        (dsup) => ({ data: dsup, height: 240, yMin: 0, series: [
          { key: "diem_supply_market", label: "Minted by others", color: "--c-diem", type: "area", stack: "d" },
          { key: "diem_supply_venice", label: "Minted by Venice", color: "--c-venice", type: "area", stack: "d" },
        ], yFormat: F.num, tipFormat: F.int })),
      calcDiem()));
    const dist = V.diem_dist || [];
    const dEl = fig({ slug: "diem-holders", span: 12, title: T("diem_dist_t"), sub: `${W.takeaway.diem()} Staked DIEM is ${P.diem_staked} of ${P.diem_supply} outstanding (${P.diem_staked_share}); DIEM in pools and unstaked wallets is not in these bands.`, basis: "thirdparty", src: `venicestats bands of staked DIEM${V.diem_dist_utc ? ", " + timeUTC(V.diem_dist_utc).replace(/, \d+:\d+$/, "") : ""}`,
      menu: [{ icon: "dl", label: "Download CSV", run: () => VC.download(`venice_staked_diem_bands_${AS_OF}.csv`, VC.toCSV(csvRows(dist))) }],
      // the bars and the band table side by side, one row per band in the same order (stacked on narrow screens)
      body: `<div class="hb-pair"><div><div class="hb-h">Share of staked DIEM</div><div class="hb"></div></div><div class="tw"><table class="t hb-t"><thead><tr><th>Band</th><th class="r">Wallets</th><th class="r hide-sm">Share of wallets</th><th class="r">DIEM staked</th></tr></thead><tbody>${dist.slice().reverse().map((b) => `<tr><td>${b.range_label || b.bucket}</td><td class="r">${d3.format(",")(b.wallets)}</td><td class="r hide-sm">${pct(b.pctWallets / 100, 1)}</td><td class="r">${d3.format(",")(b.totalDiem)}</td></tr>`).join("")}</tbody></table></div></div>` });
    view.appendChild(grid(dEl));
    sections(view, [[null, 1], ["diem_price", 1], ["diem_hold", 2]]);
    if (dist.length) requestAnimationFrame(() => VC.hbars(dEl.querySelector(".hb"), { rows: dist.slice().reverse().map((b) => ({ label: b.range_label || b.bucket, value: b.pctDiem / 100, color: "--c-diem", note: `${d3.format(",")(b.wallets)} wallets (${b.pctWallets}% of holders) hold ${d3.format(",")(b.totalDiem)} DIEM` })), fmt: (v) => pct(v, 1), labelW: 120, max: d3.max(dist, (b) => b.pctDiem / 100) }));
  };

  PAGES.valuation = (view) => {
    const lede = T("val_lede") + (K.mcap_to_burn > 30 ? ` Paying that much for a year of burns only makes sense if burns keep growing fast.` : "");
    view.appendChild(intro(`<p>${lede}</p>`, [
      ["Market cap ÷ ARR", xx(K.mcap_to_arr), `Venice's stated ${ARR}, ${d3.utcFormat("%b %Y")(parse(K.disclosed_arr_date || AS_OF))}`],
      ["FDV ÷ ARR", xx(K.fdv_to_arr), "Counting every VVV that exists"],
      ["Market cap ÷ burns", xx(K.mcap_to_burn, 0), "A year of burns: what holders receive"],
      ["Break-even price", F.usd2(K.break_even_price), "Burns buy all new VVV at or below it"],
    ]));
    const MB = D.filter((r) => r.mcap_to_burn != null);
    view.appendChild(grid(MB.length ? chartFig({ slug: "multiple", span: 7, title: T("val_mult_t"), sub: T("val_mult_s"), basis: "onchain", src: "Price from Allium, then CoinGecko; burns from Allium and Base", csvCols: ["mcap_to_burn", "mcap_circ", "burn_usd_yr"],
      time: { rows: MB, key: "d", def: "1Y", agg: { mcap_to_burn: "last", mcap_circ: "last", burn_usd_yr: "last" } } },
      (r) => ({ data: r, height: 330, yMin: 0, endLabel: true, series: [{ key: "mcap_to_burn", label: "Market cap ÷ annual burns", color: "--c-lead", type: "line", fmt: (v) => xx(v, 0) },
        { key: "burn_usd_yr", label: "Annual burns", color: "--c-burn", type: "line", noLegend: true, noLine: true, fmt: F.usd }], yFormat: (v) => v + "×" })) : null, scenarioFig()));
    view.appendChild(grid(peersFig()));
    const VS = D.filter((r) => r.dex_volume != null);
    view.appendChild(grid(
      chartFig({ slug: "dex-volume", span: 6, logToggle: true, title: T("val_vol_t"), sub: W.takeaway.dex(), basis: "onchain", conf: "medium", src: `Allium, base.dex.trades, through ${day(META.market_through || META.allium_snapshot)}; wash trades not removed`, csvCols: ["buy_volume", "sell_volume", "dex_volume"],
        time: { rows: VS, key: "d", def: "1Y", bars: true, agg: { buy_volume: "sum", sell_volume: "sum", dex_volume: "sum" } } },
        (vs) => ({ data: vs, height: 220, total: "Total", clipQ: 0.98, series: [
          { key: "buy_volume", label: "Buys", color: "--c-buy", type: "bar", stack: "v" },
          { key: "sell_volume", label: "Sells", color: "--c-sell", type: "bar", stack: "v" }], yFormat: F.usd, partLabel: "In progress" })),
      chartFig({ slug: "traders", span: 6, title: T("val_tr_t"), sub: W.takeaway.traders(), basis: "onchain", src: `Allium, base.dex.trades, through ${day(META.market_through || META.allium_snapshot)}`, csvCols: ["traders", "trades"],
        time: { rows: VS, key: "d", def: "1Y", agg: { traders: "mean", trades: "sum" } } },
        (vs, g) => ({ data: vs, height: 220, yMin: 0, series: [{ key: "traders", label: g === "D" ? "Traders" : "Average daily traders", color: "--c-total", type: "line", fmt: F.int }], yFormat: F.num }))));
    view.appendChild(grid(caseFig()));
    sections(view, [["val_burn", 1], [null, 1], ["val_trade", 1], [null, 1]]);
  };
  function scenarioFig() {
    const base = (K.burn_usd_yr || 0) / 12, em = (K.emission_yr || 0) / 12, price = K.price || 1;
    const g6 = K.burn_growth_6m;
    const rowsG = [0, 0.04, 0.08, 0.194].concat(ok(g6) ? [Math.round(g6 * 1000) / 1000] : []).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    const nice = (v) => (v >= 10 ? Math.round(v) : Math.round(v * 2) / 2);
    const cols = [0.5, 0.75, 1, 1.5, 2].map((m) => (m === 1 ? price : nice(price * m)));
    const start = parse(AS_OF);
    const cell = (g, p) => {
      for (let n = 0; n <= 36; n++) if ((base * Math.pow(1 + g, n)) / p >= em) return n === 0 ? ["Now", "now"] : [d3.utcFormat("%b %Y")(d3.utcMonth.offset(start, n)), ""];
      return ["Later", "never"];
    };
    const paceName = K.month_6m_before && K.month_last_full ? `${d3.utcFormat("%b")(parse(K.month_6m_before + "-01"))}–${d3.utcFormat("%b %Y")(parse(K.month_last_full + "-01"))} pace` : "last six months";
    const rowLabel = (g) => (g === 0 ? "No growth" : `${g < 0 ? MINUS : ""}${Math.abs(g * 100).toFixed(g === 0.194 ? 1 : 0)}% a month${g === 0.194 ? " (Bankless)" : ok(g6) && Math.abs(g - g6) < 1e-3 ? ` (${paceName})` : ""}`);
    const body = `<div class="tw"><table class="t scen"><thead><tr><th>Burn growth</th>${cols.map((c) => `<th class="${c === price ? "now-col" : ""}">${F.usd2(c).replace(/\.00$/, "")}${c === price ? "<br><span class='muted' style='font-weight:400'>today</span>" : ""}</th>`).join("")}</tr></thead><tbody>${rowsG.map((g) => `<tr><td>${rowLabel(g)}</td>${cols.map((c) => { const [t, cls] = cell(g, c); return `<td class="${cls}${c === price ? " now-col" : ""}">${t}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="card-note">Shaded: today's VVV price. Later: not within three years. ${ok(g6) ? `The ${paceName} row repeats how burns moved from ${F.usd(K.burn_rev_6m_before_usd)} to ${F.usd(K.burn_rev_last_full_usd)} a month${g6 >= d3.max(rowsG) ? "; it is the most optimistic case, not a forecast" : ""}. ` : ""}Bankless's 19.4% is David Hoffman's figure for the monthly buyback alone since December 2025. Emissions held at today's rate.</p>`;
    return fig({ slug: "scenarios", span: 5, title: T("val_scen_t"), sub: T("val_scen_s"), basis: "modeled", src: "Model on this page's burn and emission figures", body });
  }
  function peersFig() {
    const pr = V.peers;
    if (!pr || !pr.rows || !pr.rows.length) return null;
    const GROUPS = [["ai", "AI and compute"], ["benchmark", "Other tokens that return revenue to holders"]];
    const mode = (arr) => { const c = d3.rollup(arr.filter(Boolean), (v) => v.length, (x) => x); return [...c].sort((a, b) => b[1] - a[1])[0]?.[0]; };
    const third = pr.rows.filter((r) => r.row_kind !== "page");
    const commonDate = mode(third.map((r) => r.as_of)), commonSrc = mode(third.map((r) => r.source));
    const x1 = (v) => (!ok(v) ? "—" : v < 10 ? v.toFixed(1) + "×" : xx(v, 0));
    const row = (r) => {
      const notes = [r.caveat || ""];
      if (r.row_kind !== "page" && r.as_of && r.as_of !== commonDate) notes.push(`Figures as of ${day(r.as_of)}.`);
      if (r.row_kind !== "page" && r.source && r.source !== commonSrc) notes.push(`Source: ${r.source}.`);
      return `<tr class="${r.id === "venice_page" ? "hl" : r.id === "venice_defillama" ? "hl2" : ""}"><td><b>${esc(r.name)}</b>${/^Venice/.test(r.name) ? "" : ` <span class="muted">${esc(r.symbol || "")}</span>`}<span class="sub-n">${notes.filter(Boolean).map(esc).join(" ")}</span></td>
        <td class="r">${F.usd(r.market_cap_usd)}</td><td class="r hide-sm">${F.usd(r.fdv_usd)}</td>
        <td class="r hide-sm">${ok(r.flow_usd_yr) ? F.usd(r.flow_usd_yr) : "—"}<span class="sub-n">${esc(r.flow_label || "Fees")}</span></td>
        <td class="r">${ok(r.multiple) ? `<b>${x1(r.multiple)}</b>` : `—${ok(r.fee_multiple) ? `<span class="sub-n">${x1(r.fee_multiple)} on fees</span>` : ""}`}</td><td class="hide-sm">${esc(r.holders_receive || "")}</td></tr>`;
    };
    const win = mode(third.map((r) => r.window_days));
    const head = `<tr><th>Token</th><th class="r">Market cap</th><th class="r hide-sm">FDV</th><th class="r hide-sm">A year of fees or burns</th><th class="r"><span class="hide-sm">Market cap ÷ paid to holders</span><span class="show-sm">Multiple</span></th><th class="hide-sm">Holders receive</th></tr>`;
    const body = GROUPS.map(([g, label]) => {
      const rs = pr.rows.filter((r) => (r.group || "ai") === g).sort((a, b) => (a.id === "venice_page" ? -2 : a.id === "venice_defillama" ? -1 : 0) - (b.id === "venice_page" ? -2 : b.id === "venice_defillama" ? -1 : 0) || (a.multiple ?? 1e9) - (b.multiple ?? 1e9));
      return rs.length ? `<tr class="grp"><th colspan="6" scope="colgroup">${label}</th></tr>${rs.map(row).join("")}` : "";
    }).join("");
    const sub = `${T("val_peers_s")} Third-party rows annualize the last ${win || 90} days.`;
    return fig({ slug: "peers", span: 12, title: T("val_peers_t"), sub, basis: "thirdparty", src: `${commonSrc || "DefiLlama; CoinGecko"}, ${day(commonDate)}. "Paid to holders" is DefiLlama's holders revenue; payments to service providers count as fees`,
      menu: [{ icon: "dl", label: "Download CSV", run: () => VC.download(`venice_peers_${AS_OF}.csv`, VC.toCSV(csvRows(pr.rows.map((r) => { const o = { ...r }; Object.keys(o).forEach((k) => { if (o[k] && typeof o[k] === "object") delete o[k]; }); return o; })))) }],
      body: `<div class="tw"><table class="t peers"><thead>${head}</thead><tbody>${body}</tbody></table></div>` });
  }
  // Thesis checks: each argument with the condition that would change it and whether the data shows it today
  function caseFig() {
    const rows = V.thesis_checks || [];
    if (!rows.length) return null;
    const st = (r) => `<span class="st st-${r.status}">${esc(r.status_text || "")}</span>`;
    const body = `<div class="tw"><table class="t checks"><thead><tr><th>Argument and evidence</th><th>Would change our mind</th><th>Status today</th></tr></thead><tbody>${["for", "against"].map((side) => `<tr class="grp"><th colspan="3" scope="colgroup">${side === "for" ? "For VVV" : "Against VVV"}</th></tr>${rows.filter((r) => r.side === side).map((r) => `<tr><td><b>${esc(r.argument)}</b><div class="ev">${esc(r.evidence)}</div></td><td>${esc(r.trigger)}</td><td>${st(r)}</td></tr>`).join("")}`).join("")}</tbody></table></div>`;
    return fig({ slug: "checks", span: 12, title: T("val_case_t"), sub: T("val_case_s"), body });
  }

  PAGES.method = (view) => {
    view.appendChild(intro(`<p>${T("met_lede")}</p>`));
    // a documentation page: a sticky index on the left, one section per topic on the right, each with its own card
    const DOC = [];
    const block = (id, nav, title, lead, body) => { DOC.push([id, nav]); return `<section class="band" id="m-${id}" aria-labelledby="m-${id}-h"><header class="band-h"><h2 id="m-${id}-h">${title}</h2>${lead ? `<p>${lead}</p>` : ""}</header><div class="card doc-card">${body}</div></section>`; };
    const table = (head, rows, rcols = [], cls = "", cols = "") => `<div class="tw"><table class="t ${cls}">${cols}<thead><tr>${head.map((x, i) => `<th${rcols.includes(i) ? ' class="r"' : ""}>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${rcols.includes(i) ? ' class="r"' : ""} data-l="${head[i]}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    const dl = (rows) => `<dl class="defs">${rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl>`;
    const parts = [];
    const rowOf = (...blocks) => parts.push(...blocks);
    const chainBurns = META.chain && META.chain.burns && /chain/.test(META.burn_method || "");
    const nKnown = (V.disc_history || []).length + 2;

    (rowOf(
      block("labels", "Labels", "What the labels under each chart mean", "Every chart's source line ends with one of these.", table(["Label", "Means", "Example"], [
        ["<b>On-chain</b>", "Computed from Base transactions", "Monthly burns, DIEM supply"],
        ["<b>Third-party classification</b>", "On-chain events sorted by someone else, here venicestats", "Subscriptions against API credits"],
        ["<b>Modeled</b>", "On-chain inputs run through a stated rule", "Implied API purchases"],
        ["<b>Reported by Venice</b>", "Venice said it and we can't check it", "$100M+ ARR, user count"],
        ["<b>Confidence</b>", "How far the number would move if an assumption were wrong", "High, medium"],
      ])),
      block("dates", "Dates and coverage", "Dates and coverage", "Which day each figure is as of, and where each series comes from.", dl([
        ["Days", `UTC days. Every figure on the page is as of ${day(AS_OF)}, the last complete day.`],
        ["VVV price", `${PS.map((x) => `${day(x.from)} to ${day(x.to)}: ${x.definition}`).join("; ")}.${K.price_source ? " Headline: " + K.price_source + "." : ""}`],
        ["Allium data", `Allium's shared Venice queries. Market and DEX figures run through ${day(META.market_through || META.allium_full_through)}, the last complete Allium day; holders through ${day(K.holders_date || META.allium_snapshot)}.`],
        [`After ${VC.fmtDayShort(parse(META.allium_full_through || META.allium_snapshot))}`, chainBurns ? "Burns, mints, staking and DIEM come from our own pull of Base events, dated by block time." : "Staking and DIEM come from our own pull of Base events, dated by block time."],
        ["Burn dollars", "Each burn valued at that day's price. A month valued this way lands within about 1% of pricing each swap. Each monthly buyback is spread evenly over the days of its cycle in the annual burn rate."],
        ["DEX volume", "Raw, before Allium's wash-trade flag is applied."],
      ]))));

    (rowOf(
      block("split", "How burns are split", "How burns are split by source", "Five steps from the total VVV burned to subscriptions and API credits.", `<ol class="steps">
        <li>Start from the daily total of VVV burned (Allium${chainBurns ? ", then Base after Allium's last day" : ""}).</li>
        <li>Take out the ${nKnown} burns that aren't programmatic: the unclaimed-airdrop and team burns of Mar 12, 2025, and ${(V.disc_history || []).length} monthly buybacks from Venice's buyback Safe, each matched to its transaction.</li>
        <li>What's left is programmatic burning through the Aerodrome VVV/WETH pool, set off by subscriptions and API-credit purchases.</li>
        <li>Split that into subscriptions and API credits using venicestats' classification. On-chain the two look alike: same sender, same router, overlapping sizes.</li>
        <li>Implied API purchases are credit burns divided by ${pct(META.credit_burn_share)}, the share in Venice's post of Jul 17, 2026.</li></ol>
        <p class="note">The list of known burns comes from venicestats, so this split isn't independent of it. The total in step 1 is.</p>`),
      block("limits", "Known limits", "Known limits", "What the data cannot show yet, what that does to the numbers, and what would fix it.", table(["Limit", "Effect", "Fix"], [
        ["Subscription and credit burns look alike on-chain", "That split rests on venicestats", "Needs Venice to disclose it"],
        ["Burns valued at the day's median price", "Monthly totals within about 1%", "Price each swap"],
        ["DEX volume includes wash trades", "Volume reads high", "Apply Allium's wash-trade flag"],
        ["Wallet owners from public tags only", "Some large wallets stay unlabeled", "Allium's identity tables"],
        [`Allium data ends ${day(META.allium_snapshot)}`, "Later days come from our own Base pull", "Run the SQL below inside Allium"],
      ]))));

    const rec = (V.reconcile || []).map((x) => [`<b>${x.metric}</b><div class="cell-note">${x.note}</div>`, x.allium != null ? C(x.allium, 2, true) : "–", x.chain != null ? C(x.chain, 2, true) : "–", x.venicestats != null ? C(x.venicestats, 2, true) : "–"]);
    const nInd = (V.reconcile || []).filter((x) => x.independent).length, nAll = (V.reconcile || []).length;
    const indS = (V.reconcile || []).some((x) => "independent" in x) ? `${nInd} of these ${nAll} figures have an independent second source; each note says whether its check is independent.` : "Each note says whether its check is independent.";
    (rowOf(block("checks", "Checking the numbers", "Checking the numbers", `Each figure from up to three sources. ${indS}`, table(["Quantity", "Allium", "Our Base pull", "venicestats"], rec, [1, 2, 3], "recon", '<colgroup><col><col class="n"><col class="n"><col class="n"></colgroup>'))));

    (rowOf(block("denominator", "Denominators", "Readings that depend on the denominator", "The same data gives different headlines depending on what you divide by. Both columns are correct; they answer different questions.", `${table(["Reading", "One way", "The other way"], [
      ["Supply change since launch", `${pct(K.net_change_headline_pct, 1)} counting the March 2025 burns`, `${K.net_change_ex_oneoff_pct >= 0 ? "+" : ""}${pct(K.net_change_ex_oneoff_pct, 1)} leaving them out`],
      ["Staked share", `${pct(K.staked_pct_net, 1)} of net supply, which includes Venice's own ${vM(K.venice_vvv)} unstaked VVV`, `${pct(K.staking_ratio_circ, 1)} of circulating supply`],
    ])}`)));

    (rowOf(
      // two short sections side by side
      `<div class="doc-pair">${block("downloads", "Downloads", "Downloads", "The data behind every chart, as a workbook or plain tables.", table(["File", "What's in it"], [
        [`<a href="downloads/venice-deep-dive-data.xlsx" download>Workbook (.xlsx)</a>`, "Daily and monthly tables, holders, supply buckets, burns, sources and a field dictionary"],
        [`<a href="downloads/venice_daily.csv" download>Daily table (.csv)</a>`, `${D.length} days from ${day(D[0] && D[0].d)} (contract deployment)`],
        [`<a href="downloads/venice_monthly.csv" download>Monthly table (.csv)</a>`, "One row a month"],
        ["Each chart", "Its own CSV and PNG, in the ⋯ menu at the top right of the card"],
      ], [], "files"))}${block("contracts", "Contracts", "Contracts on Base", "The three token contracts, each linked to Basescan.", `<div class="contracts">${Object.entries(META.contracts || {}).map(([k, a]) => `<div><b>${k}</b><a class="addr" href="https://basescan.org/token/${a}" target="_blank" rel="noopener">${a}</a>${copyBtn(a, k + " contract address")}</div>`).join("")}</div>`)}</div>`,
      block("sources", "Sources", "Sources", "Built by Blockchain at Berkeley. Where each input comes from and what it is used for.", table(["Source", "Used for"], [
        ["Allium, Venice's shared queries", "Price, volume, traders, holders, mints and burns"],
        ["Base, through Envio HyperSync", chainBurns ? "sVVV and DIEM mints and burns, VVV burns after Allium's last day, Venice wallet flows" : "sVVV and DIEM mints and burns"],
        ["venicestats.com", "Subscription and credit classification, the known buyback and one-off burns, vesting, daily staking and DIEM figures"],
        ["CoinGecko", "DIEM price, peer market caps"],
        ...(V.peers ? [["DefiLlama and project dashboards", "Peer fees and revenue"]] : []),
        ["Venice", "Pricing page; burn posts of Apr 15 and Jul 17, 2026"],
        ["Reported figures", "ARR (Erik Voorhees, Aug 17, 2026), tokens a day (Venice's head of API, Oct 29, 2026), users (Bankless, Oct 28, 2026)"],
      ]))));

    rowOf(block("sql", "Allium SQL", "Allium SQL", "One query per metric, written for Allium's Base tables and checked against Allium's published schema. They have not been run inside Allium yet; the wallet-label query needs Allium's paid identity tables.", '<div class="sqll"></div>'));
    const doc = h(`<div class="doc"><nav class="doc-ix" aria-label="On this page"><p>On this page</p><ol>${DOC.map(([id, nav]) => `<li><a href="#m-${id}" data-sec="m-${id}">${nav}</a></li>`).join("")}</ol></nav><div class="doc-body">${parts.join("")}</div></div>`);
    (window.VENICE_SQL || []).forEach((x) => doc.querySelector(".sqll").appendChild(h(`<details class="sql"><summary>${esc(x.title.replace(/\s*\((chapter|Monitor|whale)[^)]*\)/g, ""))}<span>${esc(x.file.split("#").pop())}</span></summary><pre>${esc(x.sql)}</pre></details>`)));
    view.appendChild(doc);
    requestAnimationFrame(docIndex);
  };

  /* ---------- Method index ----------
     Links scroll to their section (the hash is kept in the URL with replaceState, so the tab's own history is not
     touched); the section under the sticky tabs is marked as current. One scroll listener for the page's lifetime. */
  function docIndex() {
    const ix = document.querySelector(".doc-ix"); if (!ix) return;
    ix.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-sec]"); if (!a) return;
      e.preventDefault();
      const el = document.getElementById(a.dataset.sec); if (!el) return;
      el.scrollIntoView({ block: "start", behavior: REDUCE() ? "auto" : "smooth" });
      history.replaceState(history.state, "", urlFor(tab) + "#" + a.dataset.sec);
    });
    markDoc();
  }
  function markDoc() {
    const ix = document.querySelector(".doc-ix"); if (!ix) return;
    const line = $("#tabs").getBoundingClientRect().bottom + 24;
    let cur = null;
    ix.querySelectorAll("a[data-sec]").forEach((a) => { const el = document.getElementById(a.dataset.sec); if (el && el.getBoundingClientRect().top <= line) cur = a; });
    if (!cur) cur = ix.querySelector("a[data-sec]");
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = [...ix.querySelectorAll("a[data-sec]")].pop();
    ix.querySelectorAll("a[data-sec]").forEach((a) => (a === cur ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  }
  window.addEventListener("scroll", () => { if (tab === "method") markDoc(); }, { passive: true });

  /* ---------- flow diagram ----------
     Two groups split by a vertical line: off-chain (users and Venice, in dollars) and on Base (everything VVV).
     Boxes are coloured by kind: money grey, VVV blue-grey, DIEM blue, burned orange. Below 700px it stacks. */
  function drawFlow(el) {
    el.innerHTML = "";
    const css = VC.css, mix = (a, b, t) => d3.interpolateRgb(css(a), css(b))(t);
    const KIND = { money: "--c-other", vvv: "--c-lead", diem: "--c-diem", burn: "--c-burn" };
    const boxStyle = (k) => ({ fill: mix("--card", KIND[k], 0.08), stroke: mix("--card", KIND[k], k === "burn" ? 1 : 0.45) });
    const B = {
      users: { k: "money", t: "Users and developers", d: `${K.users || "Millions of"} users (Venice's figure)` },
      venice: { k: "money", t: "Venice", d: `${ARR} (Venice's figure)` },
      market: { k: "vvv", t: "VVV market", d: `${P.free_float} VVV in free float` },
      burned: { k: "burn", t: "Burned", d: `${vM(K.burned)} VVV so far` },
      newv: { k: "vvv", t: "New VVV", d: `${vM(K.emission_yr)} a year` },
      svvv: { k: "vvv", t: "Staked VVV (sVVV)", d: `${vM(K.staked)}, ${ok(K.staker_apr) ? K.staker_apr.toFixed(1) + "% a year" : ""}` },
      diem: { k: "diem", t: "DIEM", d: `${C(K.diem_supply)} outstanding` },
    };
    const narrow = el.clientWidth < 700;
    const svg = d3.select(el).append("svg").attr("role", "img").attr("aria-label", "How money moves between users, Venice, VVV, sVVV and DIEM");
    const defs = svg.append("defs");
    defs.append("marker").attr("id", "ar").attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto-start-reverse").append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", css("--fg-2"));
    const box = (b, x, y, w, hgt) => {
      b.x = x; b.y = y; b.w = w; b.h = hgt;
      const s = boxStyle(b.k), g = svg.append("g").attr("class", "dg-box");
      g.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", hgt).attr("rx", 6).attr("fill", s.fill).attr("stroke", s.stroke);
      g.append("text").attr("class", "t").attr("x", x + w / 2).attr("y", y + hgt / 2 - 3).attr("text-anchor", "middle").text(b.t);
      g.append("text").attr("class", "d").attr("x", x + w / 2).attr("y", y + hgt / 2 + 14).attr("text-anchor", "middle").text(b.d);
    };
    const edge = (pts, label, lx, ly, anchor = "middle") => {
      const g = svg.append("g").attr("class", "dg-edge");
      g.append("path").attr("d", d3.line()(pts)).attr("marker-end", "url(#ar)");
      String(label).split("\n").forEach((ln, i) => g.append("text").attr("x", lx).attr("y", ly + i * 15).attr("text-anchor", anchor).text(ln));
    };
    // a dashed bracket, not an arrow: nothing flows between burned and new VVV
    const link = (a, b) => {
      const g = svg.append("g").attr("class", "dg-link");
      g.append("line").attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1]);
      const vert = Math.abs(a[0] - b[0]) < 1;
      [a, b].forEach((p) => g.append("line").attr("x1", vert ? p[0] - 5 : p[0]).attr("x2", vert ? p[0] + 5 : p[0]).attr("y1", vert ? p[1] : p[1] - 5).attr("y2", vert ? p[1] : p[1] + 5).style("stroke-dasharray", "none"));
    };
    if (!narrow) {
      // laid out on a 1000-wide grid and stretched to the card, so type stays at its set size
      const Wd = el.clientWidth, sx = Wd / 1000, X = (v) => v * sx, H = 330, bw = X(186), bh = 64, r1 = 44, r2 = 226;
      svg.attr("viewBox", `0 0 ${Wd} ${H}`).attr("height", H);
      const cx = { off: X(20), c1: X(290), c2: X(548), c3: X(794) };
      svg.append("line").attr("x1", X(240)).attr("x2", X(240)).attr("y1", 8).attr("y2", H - 8).attr("stroke", css("--line-strong")).attr("stroke-dasharray", "3 4");
      svg.append("text").attr("class", "dg-group").attr("x", cx.off).attr("y", 20).text("Off-chain, in dollars");
      svg.append("text").attr("class", "dg-group").attr("x", cx.c1).attr("y", 20).text("On Base");
      B.diem.d = `${C(K.diem_supply)} outstanding, ${P.diem_util} of credit used`;
      box(B.venice, cx.off, r1, bw, bh); box(B.users, cx.off, r2, bw, bh);
      box(B.market, cx.c1, r1, bw, bh); box(B.burned, cx.c2, r1, bw, bh); box(B.newv, cx.c3, r1, bw, bh);
      box(B.diem, cx.c1, r2, bw, bh); box(B.svvv, cx.c2, r2, bw, bh);
      const mid = (bx) => bx.y + bx.h / 2, R = (bx) => bx.x + bx.w, Cx = (bx) => bx.x + bx.w / 2;
      const gapMid = (l, r) => (R(l) + r.x) / 2;
      edge([[Cx(B.users), r2 - 2], [Cx(B.users), r1 + bh + 4]], "pay", Cx(B.users) + 8, (r1 + bh + r2) / 2 + 4, "start");
      edge([[R(B.venice) + 2, mid(B.venice)], [B.market.x - 4, mid(B.market)]], "buys VVV", gapMid(B.venice, B.market), mid(B.venice) - 9);
      svg.select(".dg-edge:last-of-type").append("text").attr("x", gapMid(B.venice, B.market)).attr("y", mid(B.venice) + 20).attr("text-anchor", "middle").text(`${P.burn_yr} a year`);
      edge([[R(B.market) + 2, mid(B.market)], [B.burned.x - 4, mid(B.burned)]], "burns", gapMid(B.market, B.burned), mid(B.market) - 9);
      link([R(B.burned) + 4, mid(B.burned)], [B.newv.x - 4, mid(B.newv)]);
      svg.append("text").attr("x", gapMid(B.burned, B.newv)).attr("y", r1 - 10).attr("text-anchor", "middle").style("font", "600 12px var(--sans)").style("fill", css("--burn-text")).style("paint-order", "stroke").style("stroke", css("--card")).style("stroke-width", "4px").text(`burns ${P.cov} of new VVV (30 days)`);
      edge([[Cx(B.newv), r1 + bh + 2], [Cx(B.newv), mid(B.svvv)], [R(B.svvv) + 4, mid(B.svvv)]], "paid to stakers", Cx(B.newv) + 8, (r1 + bh + r2) / 2 + 4, "start");
      const sy = r1 + bh + 46;
      edge([[Cx(B.market), r1 + bh + 2], [Cx(B.market), sy], [B.svvv.x + bw * 0.3, sy], [B.svvv.x + bw * 0.3, r2 - 4]], "stake", (Cx(B.market) + B.svvv.x + bw * 0.3) / 2, sy - 8);
      edge([[B.svvv.x - 2, mid(B.svvv)], [R(B.diem) + 4, mid(B.diem)]], "lock sVVV", gapMid(B.diem, B.svvv), mid(B.svvv) - 9);
      svg.select(".dg-edge:last-of-type").append("text").attr("x", gapMid(B.diem, B.svvv)).attr("y", mid(B.svvv) + 20).attr("text-anchor", "middle").text(`${P.mint_rate} per DIEM`);
      edge([[B.diem.x - 2, mid(B.diem)], [R(B.users) + 4, mid(B.users)]], "$1 of API", gapMid(B.users, B.diem), mid(B.diem) - 9);
      svg.select(".dg-edge:last-of-type").append("text").attr("x", gapMid(B.users, B.diem)).attr("y", mid(B.diem) + 20).attr("text-anchor", "middle").text("credit a day");
    } else {
      const Wd = el.clientWidth, bw = Wd - 120, bh = 48, gap = 38;
      const order = [["users", "pay"], ["venice", `buys VVV, ${P.burn_yr} a year`], ["market", "burns"], ["burned", ""], ["newv", "paid to stakers"], ["svvv", `lock ${P.mint_rate} sVVV per DIEM`], ["diem", "$1 of API credit a day, back to users"]];
      const H = order.length * (bh + gap) + 20;
      svg.attr("viewBox", `0 0 ${Wd} ${H}`).attr("height", H);
      order.forEach(([k, lab], i) => {
        const y = 10 + i * (bh + gap);
        box(B[k], 0, y, bw, bh);
        if (i === 3) { link([bw / 2, y + bh + 6], [bw / 2, y + bh + gap - 6]); svg.append("text").attr("x", bw / 2 + 10).attr("y", y + bh + gap / 2 + 4).style("font", "600 12px var(--sans)").style("fill", css("--burn-text")).text(`burns ${P.cov} of new VVV (30 days)`); }
        else if (i < order.length - 1) edge([[bw / 2, y + bh + 2], [bw / 2, y + bh + gap - 4]], lab, bw / 2 + 10, y + bh + gap / 2 + 4, "start");
      });
      svg.append("text").attr("class", "dg-group").attr("x", bw / 2 + 10).attr("y", 10 + 6 * (bh + gap) + bh + 20).text(order[6][1]);
    }
  }

  /* ---------- calculators ---------- */
  const setFill = (inp) => inp.style.setProperty("--fill", ((inp.value - inp.min) / (inp.max - inp.min)) * 100 + "%");
  // The simulator answers one question: when do burns overtake emissions? Growth is capped at 25% a month, the burn
  // line stops six months after the crossing, and cumulative burns never exceed the free float.
  function calcInflation() {
    const st = (ST["calc-burns"] = ST["calc-burns"] || {});
    const base = (K.burn_usd_yr || 0) / 12;
    const g6 = K.burn_growth_6m, GMAX = 25, gMin = Math.min(0, Math.floor((g6 || 0) * 100));
    const presets = [["None", 0], ["Slow", 8], ["Bankless", 19.4]].concat(ok(g6) && g6 * 100 <= GMAX && g6 * 100 >= gMin ? [["Last 6 months", Math.round(g6 * 1000) / 10]] : []);
    const price0 = K.price, emit0 = K.emission_yr;
    const pMin = Math.max(0.5, Math.floor(price0 * 0.25)), pMax = Math.ceil(price0 * 4);
    const g6txt = !ok(g6) ? "" : g6 >= 0 ? `, which grew ${pct(g6, 0)} a month over the last six months${g6 * 100 > GMAX ? " (above this scale)" : ""}` : `, which fell ${pct(-g6, 0)} a month over the last six months`;
    const el = fig({ slug: "calc-burns", span: 12, title: T("sup_calc_t"), sub: T("sup_calc_s"), basis: "modeled", src: "Model on this page's burn and emission figures", body: `<div class="calc">
      <div class="ctrl">
        <label><span class="lv">Monthly growth in burn dollars <b data-o="c1"></b></span><input data-i="c1" type="range" min="${gMin}" max="${GMAX}" step="0.1" value="${Math.min(GMAX, st.c1 ?? 8)}" aria-describedby="calc-hint"></label>
        <div class="presets" role="group" aria-label="Growth presets">${presets.map(([l, v]) => `<button type="button" data-g="${v}">${l} (${v < 0 ? MINUS : ""}${Math.abs(v)}%)</button>`).join("")}</div>
        <label><span class="lv">VVV price <b data-o="c2"></b></span><input data-i="c2" type="range" min="${pMin}" max="${pMax}" step="0.01" value="${st.c2 ?? price0}"></label>
        <label><span class="lv">Emissions per year <b data-o="c3"></b></span><input data-i="c3" type="range" min="0" max="4" step="0.01" value="${st.c3 ?? emit0 / 1e6}"></label>
      </div>
      <div class="out"><div class="res" aria-live="polite"><div><div class="l" data-o="l1">Burns exceed emissions from</div><div class="v" data-o="r1"></div></div><div><div class="l">Supply change, next 12 months</div><div class="v" data-o="r2"></div></div><div><div class="l">Break-even VVV price</div><div class="v" data-o="r3"></div></div></div><div class="cchart"></div>
      <div class="hint" id="calc-hint">Starts from ${P.burn_yr} a year of revenue burns${g6txt}. David Hoffman (Bankless) puts the monthly buyback's growth since December 2025 at 19.4% a month; the buyback is ${ok(K.buyback_share) ? pct(K.buyback_share) : "part"} of burns.</div></div></div>` });
    const o = (k) => el.querySelector(`[data-o="${k}"]`), inp = (k) => el.querySelector(`[data-i="${k}"]`), i = (k) => +inp(k).value;
    const run = () => {
      const g = i("c1") / 100;
      // untouched sliders use the page's exact figures, so the results match the numbers above
      const p = Math.abs(i("c2") - price0) < 0.005 ? price0 : i("c2"), e = Math.abs(i("c3") * 1e6 - emit0) < 5000 ? emit0 : i("c3") * 1e6;
      st.c1 = i("c1"); st.c2 = i("c2"); st.c3 = i("c3"); saveST();
      el.querySelectorAll("input[type=range]").forEach(setFill);
      el.querySelectorAll(".presets button").forEach((b) => b.setAttribute("aria-pressed", String(Math.abs(+b.dataset.g - i("c1")) < 0.05)));
      o("c1").textContent = (g < 0 ? MINUS : "") + Math.abs(g * 100).toFixed(1).replace(/\.0$/, "") + "%"; o("c2").textContent = F.usd2(p); o("c3").textContent = (e / 1e6).toFixed(2) + "M VVV";
      [["c1", o("c1").textContent + " a month"], ["c2", F.usd2(p)], ["c3", o("c3").textContent + " a year"]].forEach(([k, t]) => inp(k).setAttribute("aria-valuetext", t));
      const cap = K.free_float || Infinity, pts = [];
      let cross = null, net12 = 0, burnedSum = 0, stop = 36;
      const start = d3.utcMonth.floor(parse(AS_OF));
      for (let n = 0; n <= 36; n++) {
        let burnV = (base * Math.pow(1 + g, n)) / p; const em = e / 12;
        burnV = Math.max(0, Math.min(burnV, cap - burnedSum));
        burnedSum += burnV;
        if (cross == null && burnV >= em && em > 0) { cross = n; stop = Math.min(36, n + 6); }
        if (n < 12) net12 += em - burnV;
        pts.push({ d: iso(d3.utcMonth.offset(start, n)), emis: em, burn: n <= stop ? burnV : null });
        if (burnedSum >= cap) stop = Math.min(stop, n);
      }
      o("l1").textContent = cross === 0 ? "Burns already exceed emissions" : "Burns exceed emissions from";
      o("r1").textContent = e === 0 ? "No emissions" : cross == null ? "Not within 3 years" : cross === 0 ? "Now" : VC.fmtMon(parse(pts[cross].d));
      o("r2").textContent = (net12 >= 0 ? "+" : MINUS) + C(Math.abs(net12)) + " VVV";
      o("r3").textContent = e > 0 ? F.usd2(p === price0 && e === emit0 && ok(K.break_even_price) ? K.break_even_price : (base * 12) / e) : "–";
      // the x axis ends shortly after the burn line does, so the right half of the plot is never empty
      const shown = pts.slice(0, Math.min(36, Math.max(12, stop + 2)) + 1);
      VC.timeChart(el.querySelector(".cchart"), { data: shown, period: "M", height: 300, series: [
        { key: "emis", label: "New VVV per month", color: "--c-lead", type: "line", dash: true },
        { key: "burn", label: "VVV burned per month", color: "--c-burn", type: "area" },
      ], yFormat: (v) => C(v), yMin: 0, tipFormat: (v) => (v == null ? "–" : C(v) + " VVV"), tipDate: (d) => VC.fmtMon(d) });
    };
    el.querySelectorAll("input").forEach((x) => x.addEventListener("input", run));
    el.querySelectorAll(".presets button").forEach((b) => b.addEventListener("click", () => { inp("c1").value = b.dataset.g; run(); }));
    requestAnimationFrame(run);
    return el;
  }
  function calcDiem() {
    const st = (ST["calc-diem"] = ST["calc-diem"] || {});
    const el = fig({ slug: "calc-diem", span: 6, title: T("diem_calc_t"), sub: T("diem_calc_s"), basis: "modeled", src: "Market price from DEX trades; credit use across all staked DIEM", body: `<div class="calc" style="grid-template-columns:1fr">
      <div class="ctrl" style="border-right:0;padding:0 0 16px;border-bottom:1px solid var(--line-2)">
        <label><span class="lv">Share of daily credit you'd use <b data-o="d1"></b></span><input data-i="d1" type="range" min="10" max="100" step="1" value="${st.d1 ?? Math.round(K.diem_util_30d * 100)}"></label>
        <label><span class="lv">Return you want per year <b data-o="d2"></b></span><input data-i="d2" type="range" min="5" max="60" step="1" value="${st.d2 ?? 20}"></label>
      </div>
      <div class="out" style="padding:16px 0 0"><div class="res" aria-live="polite"><div><div class="l">Worth to you</div><div class="v" data-o="e1"></div></div><div><div class="l">Market price</div><div class="v">${F.usd0(K.diem_price)}</div></div><div><div class="l">Price vs your value</div><div class="v" data-o="e2"></div></div></div>
      <div class="hint">${T("diem_calc_hint")}</div></div></div>` });
    const o = (k) => el.querySelector(`[data-o="${k}"]`), i = (k) => +el.querySelector(`[data-i="${k}"]`).value;
    const run = () => {
      const u = i("d1") / 100, rr = i("d2") / 100;
      st.d1 = i("d1"); st.d2 = i("d2"); saveST();
      el.querySelectorAll("input[type=range]").forEach(setFill);
      o("d1").textContent = (u * 100).toFixed(0) + "%"; o("d2").textContent = (rr * 100).toFixed(0) + "%";
      const fv = (365 * u) / rr, ratio = K.diem_price / fv;
      o("e1").textContent = F.usd0(fv);
      // above your value: price ÷ value − 1; below it: 1 − price ÷ value (never more than 100%)
      o("e2").textContent = Math.abs(ratio - 1) < 0.1 ? "About right" : ratio > 1 ? `${pct(ratio - 1)} above` : `${pct(1 - ratio)} below`;
      o("e2").className = "v " + (Math.abs(ratio - 1) < 0.1 ? "" : ratio > 1 ? "down" : "up");
    };
    el.querySelectorAll("input").forEach((x) => x.addEventListener("input", run));
    run();
    return el;
  }

  // first render: no slide, charts draw in as they come into view
  if (tabQ === "market" || (q.get("tab") && q.get("tab") !== tab)) writeURL();
  syncChrome(); moveInk(false);
  build(true);
  scrollToHash();
})();
