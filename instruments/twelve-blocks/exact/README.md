# Exact values of V(n) and the unit scale: the second judge

V(n) is the least number of monochromatic 3-term progressions over the 2-colourings of 1..n. In a second run
(2026-11-19) two AI models produced certificates of exact values; this directory decides them.

**Two kinds of statement, kept apart.** Unconditional: exact values, each by a certificate that a short checker verifies in
exact arithmetic and a colouring that attains it; nothing but the definition is used. Not decided: the two models'
theorems about every large n, each read once by the other model and resting on the unrefereed October result.

```
python3 instruments/twelve-blocks/exact/judge.py --check     the pins, and U0 (to n = 10), U1 (n <= 50), U2, U5 again    (~30 s)
python3 instruments/twelve-blocks/exact/judge.py --write     every statement and control, writes certs/twelve-blocks-exact.json  (~12 min)
python3 instruments/twelve-blocks/exact/judge.py --only U1   one statement, printed
python3 instruments/twelve-blocks/exact/cubepsd.py FILE.json one certificate (unpack it first: xz -dk)
```

Python 3.9+ standard library; numpy only to PROPOSE a triangular factor for the large matrices (nothing is accepted on a float).

## What is decided (pre-registered in notes/twelve-blocks-2-preregistration-2026-11-19.md)

| | statement | how |
|---|---|---|
| U0 | 4M = T + Σ w x_i x_j, the identity the certificates rest on | against triples counted one by one, 124,766 colourings |
| U1 | V(n) for every n = 1..95 | 95 certificates (33,368 cubes) and 95 colourings |
| U2 | V(548) ≥ 15,385 | one all-free cube, a 549-row matrix |
| U3 | at n = 548, no colouring that agrees with the twelve blocks outside 48 named sites has fewer than 15,756 | 82 cubes |
| U4 | in that sub-cube exactly 51 colourings have 15,756 | 2,260 cubes and 51 listed exceptions, each counted |
| U5 | one all-free cube cannot prove V(548) ≥ 15,386 | an exact rational point of the relaxation |
| U6 | the first run's formula value is attained at every n ≤ 3288 | counts from bits |
| T1, T2 | two finite tests of the conditional theorems (the two maps; the witnesses from 20,700) | counts from bits |

| E1 | a colouring of 1..548 with at most 15,756 agrees with the twelve blocks, or their colour exchange, outside those 48 sites | a separate judge, `judge548/` (Node), nine items by finite exact computation |

Fourteen planted wrong versions are refused. E1 with U3 and U4 gives **V(548) = 15,756 exactly, with 102 minimising
colourings**, recorded under `unitScale`: no theorem about the continuum and no paper lemma, the October multipliers as
numbers whose identities are verified, and four slab bounds from `instruments/delta3/verify.js`. `judge548/REPORT.md`
leads with its gaps; seven of its eight planted errors are refused and the eighth, soundly, is not (it was badly chosen:
amendment A2).

```
python3 instruments/twelve-blocks/exact/judge.py --unit      runs judge548 and its named controls, rewrites "unitScale"   (~1 min)
node instruments/twelve-blocks/exact/judge548/judge.js       the nine items, about 6 s
```

## The certificate format, and why a certificate proves its claim

`corpus/twelve-blocks-2/run/claude/CERT-FORMAT-V.md` (one page and two addenda, written by the Claude track before any
certificate was relied on). With x_i = ±1, a triple is monochromatic exactly when (1 + x_a x_b + x_b x_c + x_a x_c)/4 = 1,
so 4M(x) = T + Σ_{i<j} w(i,j) x_i x_j with w(i,j) the number of triples through i and j. A certificate splits the 2ⁿ
colourings into disjoint cubes (partial colourings); on each cube it gives integers U so that one integer matrix A is
positive semidefinite, and then zᵀAz ≥ 0 for z = (1, the free signs) reads 4M ≥ T + c₀ − ΣU/(2D); one strict integer
inequality makes that exceed 4(v − 1). `cubepsd.py` rebuilds A from the cube and the definition of w, proves A positive
semidefinite exactly (two fraction eliminations up to 64 rows; above that an exact Gram remainder that must be
diagonally dominant), checks the inequality and checks that the cubes are disjoint and fill the space. It was written
from the format page alone and shares no code with the search.

## Independence

The checker, the table decider and the tests were written by the run's control room (Claude Fable 5.2 in Claude Code)
DURING the run, and gave these verdicts there first; the pre-registration says so. No program of either track was
opened. The certificates were found by the Claude track, the same model family as the checker's author; that is why
the checker is short, exact and written from the format's page, and why GPT's independent re-verification of
V(46)..V(50), V(64) and V(88) is recorded in the run's conversation. A certificate is checked, not trusted.
