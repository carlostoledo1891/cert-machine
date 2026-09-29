# wins/fei_71a — new record lower bound for the FEI constant (constant 71a)

## Claim

    C_71  >  6.521845710923046575          (full certified floor:
    6.5218457109230465756581439729485784683666...)

beating the live merged record (PR #124 / MI2026b, re-fetched 2026-07-22)

    C_71  >  6.514326913930565372

by exactly 1/133 = 0.0075187969924812... The new function is on n=18 variables,
**balanced** (f̂(∅)=0 exactly) and **logic-monotone** (exhaustively verified), with
exact total influence I = 261/128 — identical to the n=17 record's. Via O'Donnell–Tan
2013 / Hod 2017 Prop 1.2 amplification (g balanced, H[g]>0 ⇒ C ≥ H[g]/(I[g]−1)),
and because the function is monotone, the same bound holds even restricted to
monotone functions.

## Verify (60 seconds, three independent paths)

1. **Self-contained PR checker** (pure python + mpmath, zero repo imports):
   `python3 check_c71_n18.py` → SELFTEST PASS (Maj₃, β(1/2)) + ALL CERTIFIED, exit 0.
   Every verdict is an exact rational comparison of interval endpoints. The bar used
   is the PREVIOUS record's certified UPPER endpoint (6.514326913930565372650625175957),
   so the strict improvement is itself certified, not implied by truncations.
2. **Task verifier** (independent numpy WHT): `python3 ../../tasks/fei_71a/verify.py
   fei_c71_n18_artifact.json` → RESULT: PASS, exit 0.
3. **Referee pipeline**: `python3 runner.py fei_71a --certify` (exact-Fraction influence,
   interval entropy, val gate) → certify PASS.

## Construction (one paragraph, the PR method text)

Take the MI2026b n=17 record function g17 (itself a perturbed-majority-of-9 core on
x1..x9 with eight low-influence auxiliary variables acting on the majority boundary).
In g17, auxiliary variable x10 acts on four cells of the 9-variable core while every
other auxiliary acts on two — a resource-shortage artifact (only 8 auxiliaries exist
at n=17). Adding an 18th variable and rehosting two of x10's four cells onto it makes
the hosting uniform: nine auxiliary variables, each deciding exactly two core cells.
Halving those coefficient magnitudes raises spectral entropy by exactly twice the
moved weight at *identical* total influence (261/128), giving a certified gain of
exactly 1/133 over the n=17 record. The result is a strict local optimum over all
16,838 single cell-moves (swap-freeze / relocate / rehost), the same optimality
property the n=17 record had in its own class.

## Proposed constants/71a.md table row

| $>6.521845710923046575$ | [[VN2026](#VN2026)] | Explicit balanced **logic-monotone** function on 18 variables via the [[OT2013](#OT2013)] amplification rule $C \ge H/(I-1)$; exact influence $261/128$; obtained from the [[MI2026b](#MI2026b)] $n=17$ function by equalising the auxiliary-variable action ("hosting dilution": the one 4-cell auxiliary is split 2+2 with the new 18th variable), which raises $H$ by exactly twice the moved spectral weight at identical influence — certified gain exactly $1/133$; exact-rational spectrum + interval arithmetic; replayable single-file certificate. The function is monotone, so the same bound holds even restricted to monotone functions. |

Best-established-range line: $$6.521845710923046575\ <\ C_{71}\ \le\ \infty.$$

## Files

- `check_c71_n18.py` — the self-contained certificate + checker (inlined truth table,
  SHA-256-bound). THE deliverable for a PR.
- `fei_c71_n18_artifact.json` — truth table (hex, TRUE=-1 bitmask) + genotype
  (512-cell skeleton + hosting map) + exact claims.
- Verification chain: `tasks/fei_71a/verify.py` (independent), `tasks/fei_71a/benchmark.py`
  (referee), ledger `results/fei_71a.tsv`.

## Provenance / calibration

Instrument reproduced, before any claim: Maj₃ → C=4 exactly; MI2026b n=17 → their
certified value to 1e-61 (I=261/128); Hod chain → 4+3log₄3; Hod β(1/2)=6.4547837166.
Live record re-fetched from teorth/optimizationproblems on 2026-07-20 and again on
2026-07-22 (unchanged, MI2026b top). NOT SUBMITTED anywhere — PR-ready materials only.

## The measured ceiling past n=18 (for the next session)

- n=19 by dependent-pair growth from the n=18 optimum: exhaustive 40,401 (T,F)-pair
  scan maxes at 6.4670 < 6.5218 — the +0.008/var family runway ENDS at n=18 (dilution
  was the last rung; hosting is now uniform, nothing left to dilute).
- Open (untested) routes: richer per-cell sub-functions over 2+ tail vars (the "messy
  g14 mode" at scale), hosting at pc3/pc6 boundary levels, larger (10/11-var) cores.


Numaro.tech - AI Autoresearch
