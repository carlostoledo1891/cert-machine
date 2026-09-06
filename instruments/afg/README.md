# instruments/afg — the Almulla–Ferreira–Gomes first-order game, enclosed by the current

The first-order stationary mean-field game of Almulla, Ferreira and Gomes
(*Dynamic Games and Applications* 7(4) 657–682, 2017; arXiv:1511.06576), on the
1-torus with V = sin 2πx, in the one case the paper says has no closed form:
b = cos² 2πx, ∫b = 1/2.

```
node instruments/afg/run.js          write certs/afg-enclosure.json   (~20 s)
node instruments/afg/run.js --check  re-derive and compare, write nothing
node instruments/afg/battery.js      the gate: record re-derived, 10 checks, 6 red controls
```

## The idea in four lines

The transport equation integrates once: m (u_x + b) = j, a constant current.
Then u_x = j/m − b and the Hamilton–Jacobi equation is a scalar equation in m at
every x, with a strictly increasing left side, so m(x) is a verified inverse.
Two scalars (j, H̄) remain, fixed by ∫m = 1 and ∫u_x = 0; a Krawczyk box
encloses them with every integral a rigorous midpoint quadrature.

## Files

```
afg.js        the certifier: fields, φ and its verified inverse, F and DF, Krawczyk, tubes, the Certificate
run.js        the record
battery.js    the gate
FINDINGS_LIT.md   the literature gate on this exact instance (2026-09-06)
```

`instruments/interval/quadrature.js` is the rigorous integral this instrument
needed and the library did not have; it has its own test.

## What is and is not claimed

Claimed: existence of a classical solution with (j, H̄) in the recorded box,
local uniqueness there, the density enclosed pointwise and strictly positive,
the value function enclosed pointwise and periodic. The b = 0 control hits the
paper's own closed form.

Assumed and cited, not re-proved: global uniqueness (AFG Lemma 2.3, the
operator is monotone). Not claimed: any reproduction of the paper's figures
(there is no table), any first anywhere (see FINDINGS_LIT.md).
