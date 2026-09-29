# C_3c — 4-slope Kakeya-type sum–difference constant: certified lower bound 1.6747338950208249

Mosaic Intelligence — certified extremal-combinatorics record.

## Result

A 95-point entropy construction certifies

    C_3c >= 1.6747338950208249
    (45-digit floor: 1.674733895020824993378207577602265184970142270)

improving the published record 1.67473389 ([G2026]), and safely below the proven
upper bound 7/4 ([KT1999]).

C_3c is the least exponent with |A -_G B| <= max(|A|,|B|,|A +_G B|,|A +_G 2B|)^{C_3c};
in the entropy formulation the bound is

    H(X-Y) / max(H(X), H(Y), H(X+Y), H(X+2Y)) >= 1.6747338950208249.

## Files

- `check_3c.py` — self-contained single-file verifier (Python 3.9+, `mpmath`).
  The full 95-point certificate is inlined: no second download and no predecessor
  file are required. (This repairs the original public replay, whose checker
  required an unbundled predecessor certificate.)
- `certificate_3c_v3_95pt.json` — the 95 exact rational weights (common
  denominator 10^200; all numerators positive; sum exactly 1).

## Verify (well under a minute)

    pip install mpmath
    python3 check_3c.py

The five entropies are enclosed with mpmath interval arithmetic at 365 digits;
interval endpoints are recovered as exact dyadic rationals, so every verdict is
an exact rational comparison. Expected output ends with
`OK: C_3c >= 1.6747338950208249 certified` (exit 0).

## Provenance

Supplement to the merged contribution
https://github.com/teorth/optimizationproblems/pull/93 (constants/3c.md, tag
[MI2026]). Fully AI-derived: constructed and certified by Mosaic Intelligence's
automated search-and-verification system; all numerical results independently
re-run before release.

## License

Code (`check_3c.py`): MIT. Data/text (`certificate_3c_v3_95pt.json`, this
README): CC-BY-4.0.
