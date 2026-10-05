# exact/ — attempt at δ₃ = 117/2192 (session 35)

Goal: prove Q(φ) ≥ Q(φ*) = −5/137 for every measurable φ:[0,1]→[−1,1], where φ* is the
twelve-block colouring. With the Parrilo–Robertson–Saracino reduction (../THEOREM.md §1), this
gives δ₃ ≥ 117/2192. Their twelve-block construction gives δ₃ ≤ 117/2192.

## The idea: centre the problem at φ*

Write σ = (1 − φφ*)/2 ∈ [0,1]. This is the part of φ that is flipped against φ*, and
m = ∫σ = ½‖φ − φ*‖₁. Then, exactly and globally:

  E(σ) := (Q(φ) − Q(φ*))/4 = ∫ h σ + Q(φ*σ),  where h = −φ* g* ≥ 0 and g* = Kφ*.

Facts about h (phistar.py, local1.py):
- h is continuous and piecewise linear, with nodes at the multiples of 1/1096.
- Its zeros are exactly the 11 breakpoints of φ*, with one-sided slopes 1 or 3/2.
- ∫h = 5/137.

Two consequences:
- The breakpoint-shift Hessian D + SCS is positive definite, with smallest eigenvalue 0.1266
  (local1.py).
- Without loss of generality m ≤ ½, because φ → −φ maps σ to 1 − σ and leaves Q unchanged.

## Discretisation in σ (grid.py)

The grid is aligned with φ*'s breakpoints. y_i is the average of σ on cell i. E(σ) ≥ L(y), where L
is built from three kinds of term:
- **Each cell:** ∫_I hσ ≥ a y + b y². This is the bathtub principle; b comes from the curvature
  of the level-set measure.
- **Pairs fully inside R:** exact, s_i s_j w_i w_j y_i y_j.
- **Cut pairs:** bounded by 0 / w_i w_j y_i y_j − A_out, or by −A_in / −w_i w_j y_i y_j.

At y = 0 the bound is exact to first order. Unlike the old x-coordinate discretisation (../), it
does not lose anything at φ*.

## Region cover

- **Inner region m ≤ r_in (inner.py):** a zero-gap certificate. Every form used vanishes at y = 0.
  The identity is L0 = yᵀPy + Σ λ y_i(1−y_j) + Σ ν y_j(r_in − m) + κ m(r_in − m) + Σ N y_i y_j + Σ c y,
  with P ≻ 0 proved exactly. This makes φ* a minimiser on the whole L¹ ball of radius 2 r_in.
- **Outer slabs lo ≤ m ≤ hi (scert.py):** Shor + RLT + the slab's RLT products + triangle cuts.
  Duals are rounded to rationals, the residual S is rebuilt exactly, and S + εI ⪰ 0 is proved
  exactly. The result is L ≥ B − ε(1+n) > 0.

## Independent check

- vcheck.py re-derives φ*, h, the bathtub minorants, the polygon-clipping areas and every form.
  It proves PD-ness by fraction-free Bareiss elimination (Sylvester) and checks the cover of [0, ½].
- vred.py: forged certificates must be rejected.

## Run

```
../.venv/bin/python inner.py rin=1/5 tag=r20-g24_4_8
../.venv/bin/python scert.py lo=1/5 hi=3/10 rounds=8 target=2e-4
../.venv/bin/python scert.py lo=3/10 hi=2/5 rounds=6
../.venv/bin/python scert.py lo=2/5 hi=9/20 rounds=10 target=2e-4 coarse=8 fine=4 D=0
../.venv/bin/python scert.py lo=9/20 hi=1/2 rounds=10 target=3e-4 coarse=8 fine=4 D=0
../.venv/bin/python vcheck.py inner-*.json slab-*.json
../.venv/bin/python vred.py <slab.json> <inner.json> <all certificate files>
```

## Page and paper (built only from the verified run)

```
node build-page.js                         # site/mono3ap/ (refuses unless vcheck.log says THEOREM VERIFIED)
cd paper && ../../.venv/bin/python certnumbers.py && tectonic delta3-paper.tex
```
