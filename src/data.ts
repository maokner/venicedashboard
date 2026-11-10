import holders from "../public/data/holders.json";
import transfers from "../public/data/transfers.json";
import supply from "../public/data/supply.json";
import emissions from "../public/data/emissions.json";
import price from "../public/data/price.json";
import volume from "../public/data/volume.json";
import traders from "../public/data/traders.json";
import wallets from "../public/data/wallets.json";
export type Row = { day: string; [key: string]: number | string };
export const datasets = {
  holders,
  transfers,
  supply,
  emissions,
  price,
  volume,
  traders,
};
export type Dataset = keyof typeof datasets;
export const history = Object.fromEntries(
  Object.entries(datasets).map(([key, value]) => [
    key,
    value.data.map((r) => ({ ...r, day: r.day.slice(0, 10) })),
  ]),
) as unknown as Record<Dataset, Row[]>;
export const walletRows = wallets.data;
export const source =
  "https://app.allium.so/s/dashboard/9XoYYU3Bw87GoLWEzQkaHw";
export const snapshot = history.price.at(-1)!.day;
export const staked = 32990000;
export const latest = (dataset: Dataset, field: string) =>
  Number(history[dataset].at(-1)![field]);
export const compact = (n: number, digits = 2) =>
  Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: digits,
  }).format(n);
export const number = (n: number) =>
  Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
export const pctChange = (dataset: Dataset, field: string, days: number) => {
  const rows = history[dataset];
  const current = Number(rows.at(-1)![field]);
  const prior = Number(rows.at(-1 - days)?.[field]);
  return prior ? (current / prior - 1) * 100 : 0;
};
export function selectRows(
  dataset: Dataset,
  range: string,
  bucket: string,
): Row[] {
  const cutoff =
    range === "ALL"
      ? ""
      : new Date(Date.parse(snapshot) - Number.parseInt(range) * 86400000)
          .toISOString()
          .slice(0, 10);
  const rows = history[dataset].filter((r) => r.day >= cutoff);
  if (bucket === "Daily" || dataset === "emissions") return rows;
  const groups = new Map<string, Row>();
  const sum = ["volume", "traders", "transfers"].includes(dataset);
  rows.forEach((row) => {
    const date = new Date(row.day + "T00:00:00Z");
    if (bucket === "Weekly")
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    else date.setUTCDate(1);
    const key = date.toISOString().slice(0, 10);
    const previous = groups.get(key);
    const next: Row = { ...row, day: key };
    if (sum && previous)
      Object.keys(row)
        .filter((k) => k !== "day")
        .forEach((k) => (next[k] = Number(previous[k]) + Number(row[k])));
    groups.set(key, next);
  });
  return [...groups.values()];
}
export function download(name: string, rows: object[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((row) =>
      keys
        .map((key) =>
          JSON.stringify((row as Record<string, unknown>)[key] ?? ""),
        )
        .join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
