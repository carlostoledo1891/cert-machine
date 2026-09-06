# instruments/monoflow — monotone, and provably not a gradient

Two certificates on one mean-field-game equilibrium, for the quadratic
stationary MFG of labs/mfg and the Lasry–Lions monotone flow of the Gomes school.

```
node instruments/monoflow/run.js          write certs/monoflow-spectrum.json  (< 1 s)
node instruments/monoflow/run.js --check  re-derive and compare, write nothing
node instruments/monoflow/battery.js      the gate: 16 checks, 5 red controls
```

**Certificate 1 (monotone).** ⟨DA v, v⟩ = c∫δm² + ∫m(δu')², exactly; the
Jacobian assembled here must return c/2 at δm = cos 2πx on every instance.
Positive semidefinite iff c ≥ 0. One line, and called one.

**Certificate 2 (not a gradient flow).** A Krawczyk enclosure of an eigenpair
of the flow Jacobian over the equilibrium's own Galerkin box, with Im μ away
from zero: no Riemannian metric and energy make the flow −G⁻¹∇E near that
equilibrium. Decided at five of seven instances; NOT DECIDED at two, where
every eigenvalue reached is real, and nothing is claimed there.

Files: `monoflow.js` (the certifier), `run.js` (the record), `battery.js`
(the gate), `FINDINGS_LIT.md` (the gate on the claim). The kernel is the
lifted mfg-cap one (legacy/core/mfg): interval Jacobian rows from validate.js.
