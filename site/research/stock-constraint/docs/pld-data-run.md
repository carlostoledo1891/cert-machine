# Running the T3 test on real CCEE PLD data — recipe for Carlos

The statistical pipeline is validated (two-arm selftest, permutation contrast
null, `make check-py`). What it has never touched is **real data**. One real-data
line is the highest-leverage addition before the note goes to Ribeiro — it turns
"a testable prediction" into "a prediction I tested".

CCEE's open-data portal blocks this execution environment's IP (verified: its WAF
403s curl, a browser user-agent, and a real headless browser alike). It works
fine from your own browser in Brazil. So **you download; the tool does the rest**,
and it is now built so a format mismatch can't fail you silently.

## 1 · Download the data (your browser)

Portal: **dadosabertos.ccee.org.br → dataset `pld_horario`** (PLD horário /
hourly settlement price).

- Get the **hourly PLD** for submarket **SUDESTE/CO (SE)** — the hydro-dominated
  one the model is about.
- A useful span is **2024–2025** (more days ⇒ tighter statistics, and it must
  cover BOTH seasons — wet Dec–Apr and dry May–Nov — for the seasonal contrast).
- Save the CSV(s). If CCEE splits by year/month, download several and pass them
  all; the loader concatenates.

Optional, for the level anchor: the **PLDx** series (hydro opportunity cost) if
you want `--pldx-level`.

## 2 · Inspect FIRST — never skip this

```
python3 research/stock-constraint/tests/pld_martingale_test.py <file.csv> --sub SE --inspect
```

This prints the schema and the **detected column mapping** without running the
test. You want to see all four detected:

```
detected column mapping (must have price + date, ideally all four):
    sub    -> nom_submercado
    hour   -> ...            (may be "NOT FOUND" if the date column already has hours — that's fine)
    price  -> val_pld
    date   -> din_instante
parsed OK: NNNNN hourly rows · <start> .. <end> · price range ...
detected band: floor XX.XX · cap XXX.XX ...
```

- If **price** or **date** shows `*** NOT FOUND ***`, the column names differ from
  what the tool expects. **Paste the whole `--inspect` output back to me** and
  I'll add the real column names to `PATTERNS` (top of the file) — a one-line fix.
- Check the parsed **date range** spans what you downloaded (this is where a bad
  date format shows up; the tool now auto-handles ISO and DD/MM/YYYY).
- Check the **submarket value** printed matches your `--sub` (it may be `SUDESTE`,
  `SE`, `SE/CO`, `SUDESTE/CENTRO-OESTE` — pass whatever substring selects it).

## 3 · Run it

```
python3 research/stock-constraint/tests/pld_martingale_test.py <file.csv> --sub SE
```

Optionally pin the regulated band instead of auto-detecting it (use the year's
official ANEEL/CCEE floor and cap — they change yearly):

```
python3 research/stock-constraint/tests/pld_martingale_test.py <file.csv> --sub SE --floor <PLD_MIN> --cap <PLD_MAX>
```

And, if you have PLDx, add `--pldx-level <value>` for the water-value anchor.

## 4 · Read the result honestly

The output that matters for the note is the **seasonal contrast** line:

```
seasonal contrast (permutation null): median-range dry−wet = +X.XXpp · z = +Z.ZZ (SIGNIFICANT/…) · wet flatter (supports T3) / dry flatter (against T3)
```

and the pooled **flatness ratio / shrinkage** and **jump concentration (S2)**.

- **Favorable** (z ≳ 2, wet flatter, high jump-concentration): add ONE sentence to
  the note and the outreach email — e.g. *"On SE hourly PLD (2024–25), price within
  hydro-marginal windows is flat with shrinkage ×N; the wet/dry flatness contrast
  is z = Z, in the direction T3 predicts."* That is the line that lands.
- **Unfavorable / null** (z small, or dry flatter): **disclose it honestly and
  still send.** A clean null against a real prediction is scientifically
  respectable and on-brand for this note; the confounds are already stated
  (dry-season thermal margin dilutes flatness). Do NOT bury it.

Either way, **paste the output back to me** and I'll help interpret it, write the
honest one-liner, and — if favorable — wire it into the note and the outreach
draft. This is not a pass/fail gate; it is an effect-size measurement.

## What this does NOT claim
A DESSEM/PLD series carries unit-commitment, network and ramp structure the model
abstracts away, so T3 predicts *approximate* flatness with attributable jumps, not
exactness — which is exactly why the test reports effect sizes against nulls, not
a verdict.
