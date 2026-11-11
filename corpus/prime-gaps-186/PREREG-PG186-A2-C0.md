# Pre-registration — prime gaps 186, the wider tables (A′) and the certificate on stock FLINT (C0), 2026-11-10

Written and committed before either run. Sealed as seal 10. The operator's answers (2026-11-10): next = "B + the cheap
C step"; pod limit US$10; "Widen to below 2,000". Phase B (the pod) gets its own pre-registration. Everything
PREREG-PG186.md says first, and its gaps, apply unchanged: this does not verify the bound 186.

## A′ — axioms 1 and 2 on every instance for every prime below 2,000

Same questions, verdict words, anchors, agreement rule and output format as A1 and A2 of PREREG-PG186.md, with 2,000
for 500: 303 primes, 276,747 instances of axiom 1 and 359,158,973 of axiom 2.

- **Decider A**: `pg186/a_py/decide.py` with ONE change, a `--jobs` option that runs primes in separate processes; no
  arithmetic line changes. Its int64 steps keep their run-time no-overflow assertions; an assertion that fails at some
  prime makes that prime REFUSED (named), and a fix is a dated amendment before a re-run.
- **Decider B**: extended by the SAME separate session that wrote it, under the same independence rules, told only
  the new bound and to re-prove every "below 2⁵³" and precision claim for p < 2,000.
- One fresh run of each over ALL primes below 2,000. Decider A's lines for p < 500 must equal phase A's byte for byte;
  decider B's likewise unless its author changes a printed convention, which it must then state.
- Budget: four hours of wall time per decider on the Mac (on the charger; a battery guard stops the runs at 25%). A
  decider past it stops; REFUSED covers the primes not finished by both.
- Controls R3 and R4 re-read over the wider range (the least prime is already known: 17 and 83). New, "the deciders
  decide": the least prime, if any, where max |Kl₃| > 2.8, and where max |Σ|/(p√p) > 5.5.
- **Predictions.** Every instance holds (≥ 99%). Guess, to be graded: over p < 2,000 the first maximum exceeds 2.8 and
  the second lies between 5 and 6.

## C0 — the claimant's certificate on stock FLINT

The README: the certificate was tested with python-flint 0.9.0 and "a custom FLINT 3.6.0 build with corrected signed
polynomial convolution (not bundled)"; "a mandatory startup regression detects the known defect".

- **Environment**: a fresh Python 3.12 virtual environment on the Mac; `numpy` and `python-flint==0.9.0` from PyPI
  (the wheel's bundled FLINT version recorded); the pinned `prime_gap_186_certificate.py` (sha256 in PINS-PG186.txt),
  unmodified, in an empty directory. The script was read first: no network, no subprocess, one output file.
- **C0a**: the claimant's own regression, `check_flint_signed_fft` (lines 520–528), transcribed verbatim into a
  six-line file and run on the stock wheel. It PASSES or RAISES.
- **C0b**: if C0a passes, the certificate itself: `python -I -B prime_gap_186_certificate.py --workers 4 --output
  fresh.json` (`-I` added: isolated mode; nothing else differs from the README's command), budget three hours.
- **Words.** REPRODUCED: the unmodified script ends with `passed: true` on stock FLINT — a replay of the claimant's
  program, never an independent decision of the integrals. REFUSED (environment): C0a raises, so the certificate cannot
  run on the published stack; then ONE more attempt with the newest python-flint wheel on PyPI, same two steps, and
  the record says which stock builds carry the defect. REFUSED (resources): over budget. A run that ends with
  `passed: false` or an arithmetic error is reported as it is, with no verdict word, and stops for the operator.
- **Prediction** (TARGET-PG186.md, unchanged): C0a raises on the stock 0.9.0 wheel (60%).

## Compute and money

The Mac, US$0. Nothing is posted; the target stays private.
