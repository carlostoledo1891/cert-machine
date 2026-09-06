# instruments/aag — the empty region, painted by standing

Alharbi, Ashrafyan and Gomes (AMO 93:40, 2026; arXiv:2305.15952) §3.2: the
one-dimensional first-order MFG on (0, 1) with inflow at the left and a relaxed
exit at the right. Their explicit solutions, certified cell by cell.

```
node instruments/aag/run.js          write certs/aag-empty-region.json  (< 1 s)
node instruments/aag/run.js --check  re-derive and compare, write nothing
node instruments/aag/battery.js      the gate: 18 checks, 5 red controls
```

**The vanishing-set certificate.** Each cell of the domain is OCCUPIED (V > 0,
m = V enclosed), EMPTY (V < 0, m = 0 exactly) or REFUSED (the cell straddles a
root at this budget). The three roots are exact, 1/12, 5/12, 3/4; a refused
cell must contain one; the refused length is 4/K at every budget of the ladder.

**The boundary complementarity certificate.** Inflow, relaxed exit, no-entry
sign and the contact product, each an interval from the enclosed solution.
Case 1: contact at x = 1 with exit flux exactly 0. Case 2: the same contact with
exit flux −j₀. "Contact does not necessarily imply that exit occurs" — their
sentence, decided.

**The value function is not unique off the support.** Two branches, both
enclosed, drawn in the CHOSEN standing of the house grammar.

Case 2 is certified for every γ in [−0.5, −0.3] because the paper prints no γ.
