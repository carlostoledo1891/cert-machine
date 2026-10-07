# The second verifier of a Janela day — the specification

This file is the ONLY description of Janela's decision rule a second verifier may read. It is
written from the rule, not from the first implementation's code: the verifier is built without
reading `instruments/window/decide.js`, `instruments/window/q.js`, `apps/janela/audit/criteria.js`,
`apps/janela/audit/dnv.js`, `apps/janela/app/*.js` or `apps/janela/build-today.js`, so that two
programs that share no code must agree on every published verdict.

## What is verified

A **day file** `today.json` (the day's data the app publishes) carries, for every place, the
forecast steps and the published decisions. The verifier re-decides every published decision
from the bytes of the day file and the scenario records, and compares letter by letter.

Input: the path of a `today.json`, and the repository root (for the records named below).
Output: the count of decisions re-decided, how many are equal, every difference
(place, operation, criterion, start index, published letter, re-decided letter), and an exit
status: 0 when every decision is equal AND the input pins hold, 1 otherwise.
Only the Python 3 standard library. Every number is an exact rational (`fractions.Fraction`)
parsed from its decimal string; no float takes part in a decision.

## The day file (`today.json`), the parts used

- `t`: the shared time axis, 29 ISO hours (`"2026-10-06T00"`, …), strictly increasing.
- `lead`: 29 integers, hours after the run (`0, 6, …, 168`).
- `presets`: the operations decided everywhere, in order: `{id, TR, limits}`; a limit is
  `{var, op, value, unit}` with `op` one of `< <= > >=` and `value` a decimal string.
- `places`: `{ placeId: { node, bandFrom, steps: [29 objects] } }`. A step may carry:
  - `hb: [lo, hi]` — the MEASURED band of significant wave height (m), decimal strings;
  - `wb: [lo, hi]` — the measured band of sustained 10 m wind (kn);
  - `hd: [lo, hi]` — the deterministic forecast of Hs (m), as a 1 mm interval;
  - `wd: [lo, hi]` — the deterministic forecast wind (kn), as a 0.01 kn interval;
  - other keys (`wdir`, `g`, `tp`, `mwd`, `ens`) are pictures, never decided on.
- `dec`: `{ placeId: { opId: codes } }` — the PUBLISHED decisions. For each preset the string is
  3 × 29 letters: the band criterion's 29, then the table criterion's 29, then the site
  criterion's 29. For each terminal rule at the place (see below) the string is 29 letters,
  the band criterion only.
- `decisions`: the total number of letters published (every letter is one decision).
- `inputs`: `{ repoPath: sha256 }` — the records the day was built from. Before deciding, the
  verifier hashes each record it reads and REFUSES (exit 1) if one differs from its pin here.

## The records read from the repository

- `apps/janela/scenario/operations.json` → `operations`: the terminal rules (Capitania acts).
  Each `{id, site, limits, hsAt}`; `hsAt` is `"approach"` or `"berth"`. A terminal rule is
  decided only at its own `site`, with window length TR = 0 (a condition at the hour).
- `apps/janela/scenario/rules/dnv-alpha.json` → `waveColumns` (design Hs, m: `[1, 2, 4, 6]`),
  `waveTables["4-1"].rows` (`{ "12": [4 alphas], "24": …, "36": …, "48": …, "72": … }`, keyed
  by TPOP in hours), `windTable["4-6"].rows` (`{ "24": [a, b], "48": …, "72": … }`).
- `apps/janela/scenario/sites.json` → `sites[]`: `{id, kind}`; `kind` is `field`, `platform`,
  `coast` or `terminal`.
- `apps/janela/scenario/platforms.json` → `units[]`: `{id, bandFrom}` (`bandFrom` a site id or null).
- The site-alpha records: `certs/janela-alpha.json`, and for every region in
  `apps/janela/scenario/regions.json` → `regions[name].alpha` whose file exists, that file too.
  Each has `sites: { siteId: { cells: [ {designHs, TPOP, verdict, ci90: [lo, hi], …} ] } }`.
  A site appearing in two records is a REFUSAL.

## Which site alpha a place uses

The SITE ALPHA TABLE of a site with an alpha record: columns = the distinct `designHs` values
of its cells, ascending; rows keyed by `TPOP`; each cell = if `verdict == "ESTIMATED"`, the
lower end `ci90[0]` written as Python's shortest decimal (`repr(float)`), parsed exactly and
rounded DOWN to 2 decimal places; otherwise EMPTY.

A place's alpha source:
- a site (id in `sites.json`): none if its `kind` is `terminal`; else itself, if it has an alpha
  record; else none;
- a unit (id in `platforms.json`): its `bandFrom`, if that is not null and has an alpha record;
  else none.

## The window

The criteria answer "can this operation START at step i and RUN for TR hours".
- `need = ceil(max(0, TR) / 6) * 6` hours (TR rounded UP to the 6 h grid).
- The window's steps are the indices k = i, i+1, … while `lead[k] <= lead[i] + need`.
- If the last of those steps has `lead < lead[i] + need`, the window runs past the forecast:
  the letter is `-` (not decided).
- TR = 0 gives the single step i.

## The three criteria

For each start step i, each operation, each criterion:

**band** — the variables offered at each step are: `hs` from `hb` (absent if the step has no `hb`,
or if the operation's `hsAt` is `"berth"`), `wind_sustained` from `wb` (absent without `wb`).
The limits are the operation's limits as printed. Decide (below).

**table** and **site** (the DNV criteria). For a terminal rule: letter `n` (not applicable).
Otherwise compute the alphas, with `T = need / 2` (TPOP, hours):
1. The Hs limits are the limits with `var == "hs"`. If there is none, or any of them has an
   `op` other than `<` or `<=`: letter `n`. The design Hs is the FIRST Hs limit's value.
2. The wave alpha:
   - table: from DNV Table 4-1 — the row is the smallest TPOP key `r` with `T <= r` (none: `n`);
     with columns `X = waveColumns`: design < X[0]: `n`; design >= the last column: that row's
     last value; otherwise linear interpolation between the two bracketing columns, exactly
     (at a column's own value, that column's value).
   - site: the place's site alpha table (none: `n`); the same row and column reading, except
     that a cell may be EMPTY: the answer is `n` whenever the value it would use (the exact
     column, the last column, or EITHER end of an interpolation) is empty.
3. The wind alpha: only if the operation limits `wind_sustained`. Table 4-6 — the row is the
   smallest key `r` with `T <= r` (none: letter `n`); the alpha is that row's FIRST value.
   The same wind alpha serves both DNV criteria.
4. The limits decided against: every `hs` limit's value × the wave alpha; every
   `wind_sustained` limit's value × the wind alpha (when there is one); every other limit as
   printed. Exact products.
5. The variables offered at each step: `hs` from `hd` (absent if no `hd`, or `hsAt == "berth"`),
   `wind_sustained` from `wd` (absent without `wd`).
Decide (below).

## Deciding a window

Inputs: the window's steps, each offering some variables as intervals `[lo, hi]`; the limits.
Units: `hs` is in `m`, `wind_sustained` in `kn`; the verifier must refuse a limit on those
variables in another unit.
- Limits on `draft`, `loa`, `beam`, `speed`, `dwt` are the vessel's, never decided: ignore them.
- Limits on `hs`, `tp`, `wind_sustained`, `wind_gust`, `current`, `visibility` are the sea's.
  Any other variable: refuse.
- A sea limit is DECIDED when EVERY step of the window offers its variable; otherwise it is
  MISSING.
- The edges of an interval for a limit: for `<` and `<=` the unfavourable edge is `hi` and the
  favourable edge `lo`; for `>` and `>=` the reverse.
- `holds(x, op, value)`: `x < value`, `x <= value`, `x > value`, `x >= value`.

The letter, in this order:
1. If the window has no step: `R`.
2. If, at some step, for some DECIDED limit, the favourable edge does not hold: `V` (VETADA).
3. Else if, at some step, for some decided limit, the unfavourable edge does not hold: `I`
   (INDEFINIDA).
4. Else if some sea limit is MISSING: `S` (SEM DADOS).
5. Else: `L` (LIBERADA).

## The walk, and what the counts must be

For every place in `dec`: for every preset in `presets` order, the three criteria in the order
band, table, site, each over i = 0 … 28 — 87 letters, compared with `dec[place][preset]`; then
every terminal rule whose `site` is this place, the band criterion, 29 letters, compared with
`dec[place][ruleId]`. The places in `dec` must be exactly the places in `places`. The total
number of letters must equal `decisions`. Any letter that differs, any missing or extra key,
any count that differs: exit 1, with the list.
