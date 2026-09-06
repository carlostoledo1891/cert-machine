# instruments/maxval — the maximal value function, drawn

Gomes and Üçer (arXiv:2606.28378, Theorem 1.8): for a first-order
time-dependent mean-field game with a fixed density, the value function is
decided only where the density lives and is one member of a set where it does
not; among all subsolutions there is a unique maximal one. This instrument
builds an explicit game with a vacuum and draws the theorem on it.

```
node instruments/maxval/run.js          write certs/maxval-cylinder.json  (~10 s)
node instruments/maxval/run.js --check  re-derive and compare, write nothing
node instruments/maxval/battery.js      the gate: 18 checks, 5 red controls
```

**The instance.** Circle of length 6, H = ½p² − m, a parabolic bump of
density with support shrinking from r = 2 to r = 3/2 under a quadratic
terminal cost, everything in closed form through r = 2 sin²θ.

**The pair, verified.** HJ and transport residuals enclose 0 on every support
cell; the strict subsolution inequality holds on every vacuum cell (a corner
bound, because the identity's dependency problem refuses the raw interval);
u(T) = u_T exactly.

**The maximal one, enclosed.** On every vacuum cell u* lies between the free
Hopf–Lax value (a rigorous branch-and-bound minimum over y) and the cheapest
path proved clear of the moving support. Tight where the free minimiser's path
is clear; a wider bracket where it is not; refused only on the cells that meet
the boundary. u* = u on the support by the theorem. u* ≥ u wherever both are
decided, and the gap is proved positive on most of the vacuum.

Files: `maxval.js`, `run.js`, `battery.js`, `FINDINGS_LIT.md`.
