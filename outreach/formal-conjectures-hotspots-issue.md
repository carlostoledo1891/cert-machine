> **UPDATED 2026-09-03 — the theorem is now a FAMILY, not a specimen.** Both
> drafts below were written for the single domain c = 17/20. The certified
> result is now: for every c in [0.845, 0.85] the
> trapezoid A(0,0) B(1,0) C(c,9/10) D(1/4,9/10) has simple mu_1 and its second
> Neumann eigenfunction attains its extrema on the boundary only —
> 17 chunks tiling the interval with shared endpoints,
> 738 sigma-cells inside them, mu_1 >= 11.85157
> and mu_2 >= 13.90774 uniformly. To our knowledge the
> first certified hot-spots result for a POSITIVE-MEASURE FAMILY beyond every
> proven class; the old specimen is its right endpoint.
>
> This makes both asks STRONGER, and each needs its opening rewritten around
> the family before it goes out. Scope to keep honest in both: the six-stage
> chain ran on the bench and is audited here, not re-derived (reports/ember.html
> says so), and the convex-quadrilateral conjecture itself remains OPEN — this
> is a family, not the census. Page: https://carlostoledo.co/reports/ember.html
> · record: certs/ember-band.json · auditor: instruments/emberband/verify-band.js

# formal-conjectures issue: the hot spots conjecture (STAGED — POST ONLY ON APPROVAL)

Destination: https://github.com/google-deepmind/formal-conjectures/issues/new
(template "New conjecture"; the `new conjecture` label is applied by
maintainers — external issue authors cannot set labels).
Post command, on approval:
  gh issue create --repo google-deepmind/formal-conjectures \
    --title "New conjecture: the hot spots conjecture (Rauch, 1974)" \
    --body-file <this body>
Scouted 2026-09-02: zero existing issues or Lean files mention "hot spots"
or "Rauch" (2,615 formalized statements searched). ams-35 label exists.

--- BODY BELOW THIS LINE ---

### What is the conjecture

**The hot spots conjecture (J. Rauch, 1974).** For a bounded convex domain
$\Omega \subset \mathbb{R}^2$, every eigenfunction of the first nonzero
Neumann eigenvalue of $-\Delta$ on $\Omega$ attains its maximum and its
minimum only on the boundary $\partial\Omega$.

Informal statement and history: Bañuelos–Burdzy, *On the "hot spots"
conjecture of J. Rauch* (J. Funct. Anal. 164 (1999) 1–33). The conjecture
is **false in general**: Burdzy–Werner constructed a planar counterexample
with holes (Ann. of Math. 149 (1999); arXiv:math/9803030), and it is false
even for **convex** domains in sufficiently high dimension (de Dios Pont,
*Convex sets can have interior hot spots*, arXiv:2412.06344). So the
dimension restriction is part of the open statement, and the
high-dimensional refutation would make a natural negative `variants` entry
alongside the open planar case.

Proved classes (candidate `variants`, category `research solved`):
- lip domains (Atar–Burdzy, J. Amer. Math. Soc. 17 (2004));
- all Euclidean triangles (Judge–Mondal, Ann. of Math. 191 (2020), with
  the 2022 erratum); partial acute-triangle results earlier
  (arXiv:1308.3005);
- certain non-convex "L-tiled" polygons (Hatcher, arXiv:2405.19508);
- quadrangles with symmetry, subcases (arXiv:2604.19003).

The Polymath7 project (2012) attacked the acute-triangle case, including
a validated-numerics route, before the analytic triangle proof:
https://michaelnielsen.org/polymath/index.php?title=The_hot_spots_conjecture

Recent computational context, for the problem's current edge (disclosure:
my own work): a certified, machine-checked proof that one explicit convex
trapezoid outside all of the classes above — no symmetry axis, not a lip
domain — has the hot-spots property, with the maximum pinned to a single
vertex: https://carlostoledo.co/reports/ember.html (records archived at
https://doi.org/10.5281/zenodo.22225860). The general planar convex case,
and convex quadrilaterals in particular, remain open.

### Prerequisites needed

Neumann eigenvalues of the Laplacian on a Euclidean domain. To my
knowledge Mathlib does not yet carry the Neumann spectrum of $-\Delta$ on
domains; a workable route may be the variational (min–max Rayleigh
quotient) characterization over $H^1(\Omega)$, or an abstract statement
parameterized by an eigenvalue/eigenfunction predicate, as this
repository does for other analysis conjectures whose full context is not
yet in Mathlib.

### [AMS categories](https://github.com/google-deepmind/formal-conjectures/labels?q=ams-)

* ams-35

### Choose either option
- [ ] I plan on adding this conjecture to the repository
- [x] This issue is up for grabs: I would like to see this conjecture added by somebody else
