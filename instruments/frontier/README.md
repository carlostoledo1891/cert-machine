# instruments/frontier — the concentration frontier, as a measurement

The congestion mean-field-game enclosure (reports/mfg-congest.html) certifies
one point. In the source lab the same certifier was swept over the potential
amplitude A at six viscosities σ and four truncation orders N, and the place
where it stops certifying was measured. This instrument reads that data —
lifted and sha-pinned under corpus/refusal-frontier/ — re-derives every
statement the page makes from it, and gates them.

```
node instruments/frontier/run.js          write certs/frontier-measurement.json
node instruments/frontier/run.js --check  re-derive and compare, write nothing
node instruments/frontier/battery.js      the gate: pins, ladders, brackets, ceilings, 5 red controls
```

**What is decided.** Every CERTIFIED point on a ladder is a validated
enclosure (Z1 < 1, radius, positive density). Every refusal is named by its
mode. A ladder is monotone: no certified point above a refused one. The A⋆
bracket is [last certified, first refused] of what was evaluated. A⋆ rises
with N at every σ. The N-free ceiling A_rec, where the one N-independent
coefficient of the Z1 bound reaches 1, is bit-identical across N = 14 … 40.

**What is not.** Anything between evaluated points; the limit of A⋆(N); the
a-axis; existence in the refused region. The local slopes are floats and are
drawn dashed.
