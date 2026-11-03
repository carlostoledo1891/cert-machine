# C_1d upper-bound certificate (600 cells)

Upper bound `C_1d <= 1.460217284022874` for the signed third autocorrelation constant
([teorth/optimizationproblems, constant 1d](https://teorth.github.io/optimizationproblems/constants/1d.html)).

- `construction.json`: 600 signed cell values of a step function on `[-1/4, 1/4]`, stored as IEEE doubles.
- `verify.py`: reads each double as an exact rational and computes `max_t |f*f| / (int f)^2 = 2n * max_m |sum_{i+j=m} v_i v_j| / (sum v)^2` exactly (knot formula, as described on the constant page). Standard library only, runs in under a second:
  `python -I verify.py construction.json`
  prints `ratio 1.460217284022874` and the exact fraction
  `698746209786798359455483373677229695641600/478522078482569620433992386249161163190849`.
- `numeric_check.py`: independent numerical check (cell oversampling plus direct convolution, NumPy).
- `optimize.py`: how it was found. Start from the 300-cell certificate of the previous record, split each cell in two, then sequential linear programming (trust region, HiGHS) on the max of the autocorrelation.

SHA-256 of `construction.json`: `3dd39fae744555179b0356b84e752db724e892bd23dda51403976edfb5b3a28c`

AI disclosure: the optimizer and checkers were written and run by an AI agent (Claude Code) for Mike German. The bound itself is checked mechanically by `verify.py`.
