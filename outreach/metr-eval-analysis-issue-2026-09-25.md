# Issue for METR/eval-analysis-public — the Time Horizon 1.1 fits, certified (DRAFT 2026-09-25; a SEND)

Written for: the maintainers of github.com/METR/eval-analysis-public. Posting is Carlos's call;
`gh` can open it on the word. Every number below is a field of certs/horizon-ledger.json.

---

**Title:** Independent re-derivation of the TH1.1 logistic fits with the optimum certified (all 44 fits; your printed coefficients are the rounding of the certified box for 22 of 23 models)

**Body:**

I re-implemented the headline estimator (`horizon.utils.logistic.logistic_regression` with
`invsqrt_task_weight`, `regularization = 0.00001`, `x = log2(human_minutes)`) in standard-library
Python and certified each fit rather than refitting it: a float Newton finds the candidate, then the
Krawczyk operator, evaluated in outward-rounded interval arithmetic with exp/log from series with
proved remainders, proves a box around the candidate holds exactly one zero of the penalised score.
The horizon is then the interval extension of 2^((logit p − b)/w) over that box.

Data: `reports/time-horizon-1-1/data/raw/runs.jsonl` at commit 52cb829 (21 aliases), and the two
files behind metr.org/time-horizons (`/assets/task_results_1_1.yaml`, `/assets/benchmark_results_1_1.yaml`,
fetched 2026-09-22; 23 agents). Per-run fitting is collapsed to per-task fitting with the mean
outcome, which is the same score exactly (Σ_runs (w/n)(y_r − p) = w(ȳ − p)).

What comes out:

- 44 of 44 fits certify, with box radius below 1e-10 in every case.
- The coefficients printed in `task_results_1_1.yaml` (three decimals) are the rounding of the
  certified box for 22 of 23 agents. The exception is `Claude Mythos Preview (early)`: printed
  intercept 5.582, certified box [5.5826910, 5.5826911] → 5.583.
- The p50 estimates in `benchmark_results_1_1.yaml` lie between 1e-6 and 1.8e-4 (relative) from
  the certified enclosure and never inside it — consistent with L-BFGS stopping at its tolerance.
  Every enclosure lies inside the printed bootstrap interval.
- `doubling_time_in_days.from_2023_on.point_estimate` (128.744) re-derives as an enclosure
  [128.74034182617, 128.74034182764] from an exact least-squares line through the certified
  log2 horizons of the 14 `is_sota` agents with p50 ≤ 960 min released 2023 or later.
- The March runs file and the May site file agree to 2e-4 on the 20 shared aliases; the January
  post's seven TH1.1 horizons match the May file for one model (Claude 3.7 Sonnet, 60) and differ
  by 3–12 % for six, which the May site numbers reflect too — runs were added in between.

Page with every table and the method: https://carlostoledo.co/reports/time-horizon.html.
Code: https://github.com/carlostoledo1891/cert-machine — `instruments/horizon/` (interval.py, fit.py,
data.py), `tools/run-horizon-ledger.py` (re-runs all 44 in ~2 minutes on 8 cores), a battery of
33 checks with 7 red controls. Standard library only; no sklearn, no numpy.

Two things I would offer, if useful:
1. A `certify_fit(runs, weights, regularization)` function that returns the box and the horizon
   enclosure, as an optional check beside `logistic_regression` — it would have flagged the
   Mythos intercept rounding and would make "the printed number is the fit's number" a test.
2. Nothing about the bootstrap intervals, task set, human baselines or binarisation is touched or
   questioned here; the certificate is about the optimiser only, and it says your published points
   are what the estimator says they should be.

Thanks for publishing the runs and the site files — none of this is possible without them.

---
Notes for the sender: the Mythos line quotes the box ends from the ledger
(`agents["Claude Mythos Preview (early)"].live.box.intercept`); check them once more against the
ledger at send time in case a re-run moved a digit.
