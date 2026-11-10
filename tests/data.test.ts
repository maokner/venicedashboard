import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { history, selectRows, latest, walletRows, snapshot } from "../src/data";

const close = (actual: number, expected: number, tolerance = 0.0001) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} differs from ${expected}`,
  );

describe("captured Allium data", () => {
  it("contains complete daily histories without duplicate or missing dates", () => {
    for (const [name, rows] of Object.entries(history)) {
      if (name === "emissions") continue;
      assert.equal(rows.at(-1)?.day, "2026-11-10");
      for (let i = 1; i < rows.length; i++) {
        assert.equal(
          Date.parse(rows[i].day) - Date.parse(rows[i - 1].day),
          86400000,
        );
      }
      for (const row of rows) {
        for (const [field, value] of Object.entries(row)) {
          if (field !== "day") assert.ok(Number.isFinite(value));
        }
      }
    }
  });
  it("matches the source headline values and percentage units", () => {
    close(latest("price", "vvv_price_usd"), 19.8458);
    assert.equal(latest("holders", "holders"), 85036);
    close(latest("supply", "circulating_supply"), 81229786.4192);
    close(walletRows[0].pct_of_held_supply * 100, 42.5043);
    assert.equal(walletRows.length, 25);
  });
});

describe("date filters and aggregation", () => {
  it("anchors ranges to the snapshot rather than the current clock", () => {
    const rows = selectRows("price", "30D", "Daily");
    assert.equal(rows.length, 31);
    assert.equal(rows[0].day, "2026-10-11");
    assert.equal(rows.at(-1)?.day, snapshot);
  });
  it("preserves volume totals when aggregating weekly and monthly", () => {
    const daily = selectRows("volume", "180D", "Daily");
    for (const bucket of ["Weekly", "Monthly"]) {
      const aggregated = selectRows("volume", "180D", bucket);
      for (const field of ["buy_volume_usd", "sell_volume_usd"]) {
        const sum = (rows: typeof daily) =>
          rows.reduce((total, row) => total + Number(row[field]), 0);
        close(sum(aggregated), sum(daily), 0.001);
      }
    }
  });
  it("uses the last observation for stock metrics, not a sum", () => {
    const rows = selectRows("holders", "ALL", "Monthly");
    const october = rows.find((r) => r.day === "2026-10-01");
    const lastOctober = history.holders.find((r) => r.day === "2026-10-31");
    assert.equal(october?.holders, lastOctober?.holders);
    assert.equal(rows.at(-1)?.holders, latest("holders", "holders"));
  });
  it("retains weekly source emissions and their negative burn sign", () => {
    assert.equal(selectRows("emissions", "ALL", "Monthly").length, 95);
    assert.ok(history.emissions.every((r) => Number(r.burned) <= 0));
  });
});
