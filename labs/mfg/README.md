# labs/mfg — the mean-field-game lab

A certifier for stationary mean-field games, and the map it produces.

The model is the stationary (ergodic) quadratic MFG on the 1-torus:

```
-sigma u'' + 1/2 (u')^2 + rho  =  c m + A cos 2 pi x        (HJB)
-sigma m'' - ( m u' )'         =  0                          (Fokker-Planck)
int m = 1,   int u = 0,   m > 0
```

`c` is the coupling — `c > 0` is crowd-aversion (Lasry–Lions monotone, unique),
`c < 0` is herding, where uniqueness theory is silent. `A` is the depth of the
potential well.

## What is new here

The lifted kernel (`legacy/core/mfg/validate.js`, from the published mfg-lab
tree) proves, for **one** parameter triple, that an exact solution lies within an
explicit radius of a numerical candidate and is the only one in that ball.

`box.js` proves the same sentence **with a quantifier in front of it**: for every
`(sigma, c, A)` in a rectangle, with one candidate and one radius. That is what
turns a point result into a map — a grid of point results proves nothing between
its points, so it can never be a partition.

Two disjoint box certificates over the same cell prove **multiplicity for every
parameter in the cell**: a set of positive measure on which uniqueness provably
fails, each cell carrying its own exact witness.

## Files

| file | what it is |
|---|---|
| `box.js` | the box certifier: uniform-over-a-rectangle radii-polynomial validation with a tangent predictor, positivity over the box, the refutation mode, and the cell decision |
| `regime.js` | the sweep: walks the `(c, A)` plane, refines what refuses, writes `certs/mfg-regime-map.json` |
| `battery.js` | the gate: agreement with the lifted kernel at zero width, corner checks, refutation, six falsifiers |
| `widget.js` | the browser bundle — assembled from the sources above, gated against the Node answers |

## The three verdicts

- **MULTIPLE** — two exact solutions for every parameter in the cell, in two
  provably disjoint certified balls, both densities certified positive.
- **UNIQUE** — the cell lies in `c >= 0`, where Lasry–Lions gives *global*
  uniqueness (**cited, not proved here**); what is proved here is the enclosure
  of that solution, uniform over the cell.
- **UNDECIDED** — everything else, with the reason kept verbatim. Roughly half
  of the undecided cells carry at least one certified enclosure: a solution is
  enclosed, and whether it is alone is open.

`UNDECIDED` is a measurement, not a shrug. Near the bifurcation
`c* = -sigma^2 (2 pi)^2` the linearisation of the constant state is singular and
**no** enclosure can exist — a certifier that certified there would be broken,
and `battery.js` X1 requires the refusal.

## Run it

```
node labs/mfg/battery.js        the gate: 8 checks + 6 falsifiers
node labs/mfg/regime.js --fast  a quick sweep (a few minutes)
node labs/mfg/regime.js         the full map -> certs/mfg-regime-map.json
```

Decide one cell, or refute a candidate equilibrium, from a script:

```js
const B = require('./box.js');

B.decideCell({ sigma: [0.5, 0.5], c: [-16.03125, -15.96875], A: [0.2875, 0.3125], N: 16 },
             { nu: 1.02 });
// -> { verdict: 'MULTIPLE', witness: { separation, rSum, aligned, herding, minM, b1 } }

B.refuteCandidate(x, { sigma: [0.5, 0.5], c: [1, 1], A: [1, 1], N: 16 }, 1e-3, { nu: 1.05 });
// -> { verdict: 'REFUTED', mechanism: { equation: 'F_1', residual, rowBound, margin } }
```

`refuteCandidate` decides the **negative**: if one equation's residual exceeds
what the whole ball of radius `delta` could move it, then no exact solution lies
that close, whatever the rest of the vector does. That is the direction a solver
can never give you — a residual near zero is evidence; a residual provably too
large is a proof.

## Honest scope

- Everything is proved in the **even** subspace (V is even, so `f_{-k} = f_k`).
  In the monotone regime classical global uniqueness upgrades that to the full
  space; in the herding regime it does not, and the multiplicity statement is
  "at least two solutions", which is what disjoint balls give.
- `UNIQUE` cells cite Lasry–Lions for global uniqueness. That citation is the
  literature's; the enclosure is ours.
- The `(c, A)` map is at `sigma = 1/2`. `box.js` takes a `sigma` interval and
  charges for it honestly (see the tail diagonal defect in the header), but a
  wide `sigma` box costs `Z1` directly, so the published map holds it thin.
- The radii-polynomial machinery is van den Berg–Lessard, unchanged. The
  uniform-over-a-box variant with a tangent predictor, the refutation mode, and
  the partition are this lab's.

## Provenance and licence

The kernels under `legacy/core/` were lifted **file-level** from the published
`mfg-lab` tree and are recorded with their sha256 in `PROVENANCE.json`;
`make drift` re-hashes both ends. They are never edited here — `box.js` is a
second implementation of the same argument, which is exactly why `battery.js`
G1/G2 demand bit-for-bit agreement at zero width. A rule defined twice will
diverge; the only defence is a check that fires when it does.

MIT, like the rest of the machine.
