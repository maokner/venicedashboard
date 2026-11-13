# Venice research redesign

## Reference review

The reference is [Cornell Blockchain Consulting's AMM study on Allium](https://app.allium.so/terminal/deep-dives/amm-market-structure).
Its overview defines the subject before showing charts, names the questions it answers, explains the mechanisms, and connects its findings to the evidence.
Its light surfaces, restrained accent, compact headings and thin separators make long research pages easier to read.
The useful pattern is the relationship between explanation and evidence, rather than a particular arrangement of boxes.

The previous implementation repeated all five section destinations in both the sidebar and the tab bar.
It also gave Venice its own full application identity despite its intended role inside a broader AI research dashboard.
Small, low-contrast green text and numerous tinted containers weakened the hierarchy.
The overview offered little explanation of the subject or the limits of the available evidence.

## Design decisions

Visual thesis: a quiet, light research workspace with neutral typography, thin separators and a restrained purple accent.
The existing Venice symbol remains a small project identifier.
The workspace rail identifies the research universe and current project; the horizontal navigation owns the five research sections.
No additional universe pages or unsupported navigation destinations have been invented.

Content plan: project identity and provenance, research questions and source scope, snapshot findings, headline metrics, charts with interpretation, and detailed methodology.
Each section opens with the question it answers and the limitations relevant to that question.
The overview distinguishes token activity from AI product usage and business revenue, which the supplied source does not report.

Interaction thesis: the section navigation stays visible while reading, selected filters have a short visual transition, and research content enters with a restrained fade and translation.
Reduced-motion preferences disable these transitions.
Chart tooltips, CSV exports, wallet filtering, sorting and pagination remain available.
On mobile, the workspace rail disappears and the single section navigation scrolls horizontally.

## Source verification

The only numerical source is the [supplied Venice Allium dashboard](https://app.allium.so/s/dashboard/9XoYYU3Bw87GoLWEzQkaHw).
On November 13, 2026, all eight local datasets matched the rendered source data by SHA-256 checksum.
The compared values include every daily or weekly chart observation and the 25 wallet rows exposed by the source table.
`public/data/verification.json` records the fields used, row counts, final observations and checksums.
The observed data still ends on November 10, 2026, and the interface labels it as a historical snapshot.

The source staking KPI and staking-contract wallet balance remain separate figures.
Wallet percentages use the underlying source fractions multiplied by 100, correcting the source page's percentage display.
Outstanding supply means cumulative mints minus cumulative burns, including staked balances.
The source's top-50 table exposes 25 rows, so the interface states its actual coverage.

## Validation

The production TypeScript and Vite build passes.
All six existing tests pass, covering source values, daily continuity, date filters, stock aggregation, flow aggregation and weekly emissions.
Prettier checks pass.
The layout was inspected in the shared browser at desktop and 390-pixel mobile widths, including the sticky navigation, chart layout and horizontal overflow.
