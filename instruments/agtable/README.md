# instruments/agtable — their tables, re-decided

Ashrafyan–Gomes (arXiv:2403.02785) end with two tables: the relative error of
their semi-Lagrangian scheme against the analytic solutions of two price-
formation tests, at four meshes, to two digits. This instrument encloses the
analytic solutions in interval arithmetic, writes the scheme from the paper's
description, runs it on the paper's meshes at the paper's tolerance and at
1e−8, and meets every printed cell with an interval and a verdict.

```
node instruments/agtable/run.js          write certs/agtable-redecided.json (about 5 s)
node instruments/agtable/run.js --check  re-derive and compare, write nothing
node instruments/agtable/battery.js      the gate: 24 checks, 5 red controls
```

| file | what |
|---|---|
| `exact.js` | the supply Q, its integrals, the two prices, u(·,0) and m(·,T) of both tests as intervals; a verified cube root; the bump and its mass |
| `sl.js` | the scheme of §4/§8 with the inner infimum solved exactly (convex, closed-form stationary points) and feet held at the walls |
| `derive.js` | the enclosures on the finest grid, the runs, the verdicts, the orders, the tolerance's share, the density as printed |
| `../interval/taylor2.js` | a second-order interval jet: value, f′, f″ through every operation, and the midpoint rule with its remainder |
| `../../corpus/ashrafyan-gomes-2403.02785/tables.json` | the printed numbers, pinned |

**Verdicts.** REPRODUCED: our error interval meets the printed value's
two-digit rounding box. NEAR: within 15 %. DIFFERS: otherwise, with the
factor. A DIFFERS cell is a statement about an independent implementation
of the described scheme, not about the printed number.

**Decided.** The enclosures and their widths; the clearing identity
ϖ + a₁ + 2a₂K = −Q at 21 times; the bump masses; that the initial density as
printed (support |x| < 1) has no finite integral.

**Measured.** Everything about the scheme: 13 of 24 cells reproduced, 5
near, 6 differ (u and m of test 1 at the fine meshes; the price of test 2 at
the finest, where the port does better); first order in the price; the
tolerance ε = 0.004 is 39 % of the finest printed price error of test 1.
