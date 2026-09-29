# C_3b — Kakeya-type sum–difference constant: certified lower bound 1.77898884

Mosaic Intelligence — certified extremal-combinatorics record.

## Result

A 13-point entropy construction certifies

    C_3b >= 1.77898884        (true value 1.778988841420693549...)

improving the previous record 1.77898 ([GGSWT2025]) in the sixth decimal place
(certified margin 8.84e-6), and safely below the proven upper bound 11/6 = 1.8333...
([KT1999]).

C_3b is the least exponent with |A -_G B| <= max(|A|,|B|,|A +_G B|)^{C_3b}; in the
equivalent entropy formulation the bound is

    H(X-Y) / max(H(X), H(Y), H(X+Y)) >= 1.77898884

for the explicit pair (X,Y) given by the certificate.

## Files

- `check_3b.py` — self-contained verifier (Python 3.9+, `mpmath` only). The full
  13-point certificate is inlined. Exact rational pushforwards; the only inexact
  step (the logarithm) is enclosed with mpmath interval arithmetic; the printed
  lower endpoint is a rigorous lower bound on C_3b.
- `certificate_3b_13pt.json` — the 13 exact rational weights (common denominator
  10^36, reduced; sum exactly 1; support symmetric under (x,y) -> (y,x)).

## Verify (under 1 second)

    pip install mpmath
    python3 check_3b.py

Expected output ends with `OK: C_3b >= 1.77898884 certified` (exit 0).

## Provenance

Supplement to the merged contribution
https://github.com/teorth/optimizationproblems/pull/92 (constants/3b.md, tag
[MI2026]). Fully AI-derived: constructed and certified by Mosaic Intelligence's
automated search-and-verification system; all numerical results independently
re-run before release.

## License

Code (`check_3b.py`): MIT. Data/text (`certificate_3b_13pt.json`, this README):
CC-BY-4.0.
