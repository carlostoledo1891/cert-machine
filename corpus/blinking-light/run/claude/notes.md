# Claude track: notes on g(3/10, 2/25)

Units: r = 1 throughout (g = sigma/r). K = (1 - L)^-1, w = Kf, v = K*f, h = (w+v)/2, d = (w-v)/2.
Each statement is marked PROVED, DECIDED (by the run's checker), COMPUTED (floats) or GUESS.

## 0. Where things stand

    0.3657254  <=  g(3/10, 2/25)  <=  0.3771285

- lower bound: PROVED, cert222g.json + verify_local.py, on top of Theorem D (lifting.md) and Theorem C (locality.md);
  both theorems were re-derived by gpt (g19, g39), who also re-verified the first certificate of the series with a
  separate program (g41). Before the series: gpt's 64/245 = 0.26122 (g16), which I re-checked.
- upper bound: DECIDED, mix156.json (a ring carrying the current + an equilibrium two-state lamp + one bridge edge).
- GUESS: g(3/10, 2/25) = 0.3769 (+- 0.0001), the limit of the family "telegraph + ring" (section 5).

## 1. First bound (PROVED; superseded)

sigma >= 4 r ||d||^2 >= 4 r (C1^2 - C2): from (r - S) d = A h, <u, A v> = (1/2) sum_{i<j} J_ij (u_i - u_j)(v_i + v_j),
(a-b) ln(a/b) >= 2 (a-b)^2/(a+b) and Cauchy-Schwarz, with |h| <= 1.

## 2. The lifting and duality (PROVED; lifting.md)

- Parametrise a network by masses p and fluxes Q_ij = p_i k_ij: the stationary law is p for any p, sigma depends on Q
  only, dC1/dp_i = 1 - (f_i - w_i)(f_i - v_i), dC1/dQ_ab = v_a w_b, dC2/dQ_ab = v_a (Kw)_b + (K*v)_a w_b.
- Theorem L: in the labels z = (w, v, f) the problem is a convex program (linear constraints, convex objective).
  Hence g(c,q) is CONVEX: non-ergodic mixtures are allowed in the infimum (gpt's g26: at the target the infimum over
  irreducible networks is the same).
- Theorem D: weak duality, one certificate format (psi, beta, gamma, l1, l2, mu) for every lower bound. The bound is
  automatically affine in (C1, C2).
- On an optimal network the multipliers are explicit: beta = (l1/2) v + l2 K*v, gamma = (l1/2) w + l2 K w, and on
  every edge with fluxes a, b: tau = ln(a/b) + 1 - b/a (this fixes psi along the network).
  [PROVED as KKT conditions; COMPUTED to 1e-8 on the optima below.]
- The dual functions cannot depend on the lamp: a lamp-on and a lamp-off state may carry the same (w, v).

## 3. Rings are not optimal; the optimum is a mixture (COMPUTED, then DECIDED)

- Rings with no imposed symmetry: 0.44525 (40 states), limit about 0.4430 (gpt certified 0.4431419 at 400 states).
- The best ring C and its time-reversed mirror image C~ have label curves that cross on the diagonal w = v, where
  their dual multipliers disagree (beta != gamma). Both cannot be optimal in a convex program. Joining C to C~ by
  rungs and optimising (twolane.py) produced a REDUCIBLE network: a two-state equilibrium telegraph (most of the
  mass) plus a ring carrying all the current. The heavy atoms of the best rings were emulating that telegraph.
- telegraph + N-ring (mix.py, mixrefine.py), g: N=6 0.53725, 8 0.47002, 10 0.43719, 12 0.41903, 16 0.40075,
  20 0.39220, 40 0.38072, 80 0.37788, 160 0.37712. Extrapolation a + b/N^2: 0.3769 (+- 0.0001).
- Irreducible versions: ONE bridge edge between the ring and the telegraph. A bridge carries no stationary current
  and no entropy production. DECIDED by inherited/checker/lamp-v2.py:
    mix42.json    42 states  g in [0.383218568610, 0.383218568611]
    mix80.json    80 states  g in [0.377894276766, 0.377894276767]
    mix156.json  156 states  g in [0.377128261269, 0.377128261270]
  (bridge.py, certify.py, relabel.py; the relabelling is the cyclic-reduction order the interval elimination needs.)
  gpt's rational-mixture-84.json (g <= 0.377876231746) uses my 80-ring with two rational telegraphs.

## 4. The reduction to one scale-free function

At the mixture optimum the multipliers are exactly l1 = 2 m Lambda, l2 = -Lambda, mu = -Lambda m^2, where m is the
telegraph's own C1 (COMPUTED): the supporting line of the convex function g is tangent to the equilibrium parabola
at (m, m^2):   sigma/r >= Lambda (2 m C1 - m^2 - C2) = -Lambda <(K* - m) f, (K - m) f>.
Define the constraint-free quantity

    R(m) = sup over networks of  -<f, (K - m)^2 f> / sigma  =  sup (||d||^2 - ||h - m f||^2) / sigma.

PROVED: g(c,q) >= sup_m (2 m c - m^2 - q)/R(m) (definition of R), with equality whenever the mixture "telegraph with
C1 = m, plus a maximiser of R(m)" hits the target with weights in [0,1] (convexity).
COMPUTED over 40-state rings (pure.py): R(m)/m = 0.0901 to 0.0911 for 0.2 <= m <= 0.5, least near m = 0.265. For the
target the best m is 0.2828: close to sqrt(C2) = 0.28284 but NOT equal to it in general (other targets tested;
m = sqrt(C2) for all targets would force R(m) proportional to m, which is only approximately true). The closed form
g = G (C1 - sqrt(C2)) is therefore FALSE as an identity (within about 1% on the targets tried, G near 22).

Shape of the ring component at the optimum (N = 80, mass normalised to 1): half-turn symmetric and symmetric under
(w,v) -> (v,w); current 0.1696, total affinity 12.27; mass density lowest mid-arc and about three times higher at the
lamp boundaries; a mass-free gap carrying 7.8% of the affinity across each lamp boundary; labels w from -0.124 to
0.661 along the lamp-on arc. Its own (C1, C2) = (0.3776, 0.0802); mixture weight of the ring 0.1816, telegraph flip
rate 1.268 r.

## 5. Evidence that telegraph + ring is optimal (COMPUTED; not a proof)

- Chord test: with the multipliers of section 2, (D2) holds for ALL pairs of labels of the 40-ring + telegraph
  (max excess 3e-9, on ring neighbours where it is an equality; telegraph-ring pairs have slack 0.6).
- One-extra-label test: for every label on a 21 x 21 grid of the square there are (psi0, beta0, gamma0) satisfying
  (D2) against all current labels with reduced cost >= 0.0119 > 0: no single extra state helps (dualmix.py).
- The mixture's ring is its own mirror image in label space, so the argument that killed rings does not apply.
- Warning from experience: "complete graphs started at the ring optimum return to it" (N <= 10) had looked like
  evidence that rings were optimal. It was not. Local tests in rate space are weak; the lifted tests are better, and
  only a dual certificate with the same value would settle it.

## 6. Locality and the exact lower bound (PROVED; locality.md, verify_local.py, cert211.json)

- Lemma S: an edge can be replaced, at no cost and with no change of the dual sum, by a chain through zero-mass
  labels on the arc w = A + B e^-x, v = A' + B' e^x.
- Theorem C: for continuous piecewise-smooth certificates the pair condition (D2) is equivalent to the pointwise
  matrix inequality   4 [[2 p_h, p_d + q_h],[p_d + q_h, 2 q_d]] >= xi xi^T,  xi = (2q - psi_h, 2p - psi_d).
  So a piecewise-polynomial certificate is checked by polynomial inequalities in two variables.
- cert211.json: p = A0(h) + A1(h) d^2, q = K0(h) d, psi = P0(h) d on 25 rational knots. verify_local.py proves
  (D1) and the matrix inequality on every strip (Bernstein coefficients, bisection, fractions): 310 boxes, < 1 s.
  Result: sigma/r >= (2006731 C1 - 3573121 C2 - 282241)/100000 for every network; at the target 0.3392862.
- The series, all proved by the same verifier (boxes):
    cert211.json   A0 + A1 d^2 | K0 d | P0 d,                25 knots   0.3392862   (300)
    cert211b.json  same family,                              46 knots   0.3532012   (603)
    cert222.json   + K1 d^3, P1 d^3,                         34 knots   0.3587562   (831)
    cert322.json   + A2 d^4,                                 34 knots   0.3606284   (693)
    cert333.json   + K2 d^5, P2 d^5,                         34 knots   0.3613756   (683)
    cert222g.json  the cert222 family,                       62 knots   0.3657254   (2201)
  (cert222g is the search's output cert222f.json scaled by 9999/10000 with scale_cert.py: rounding the knot values
  to five decimals had eaten the margin at one corner, and scaling a certificate down only adds slack, since
  4M - xi xi^T becomes t[(4M - xi xi^T) + (1-t) xi xi^T]. cert222f.json itself is NOT proved.)
  Each is an affine bound sigma/r >= l1 C1 + l2 C2 + mu valid at every (C1, C2).
- How they are found (cert_lp.py, floats, no part of the proof): LP with tangent cuts of the matrix inequality at
  sample points, safety margins, then a second LP that keeps the bound and minimises the variation of the slopes;
  points where a fine float grid finds too little margin are added and the LP repeated.
- Controls (cert_controls.py; the control room's own test k40): the global (D2) with the exact region K0 on 2.9e6
  random pairs: no violation; an optimiser cannot push sigma below the bound; spoiled copies are refused.

## 7. What the remaining gap is made of (COMPUTED, sampled LPs in the local form, f6loc.py)

Best value certified by a family "functions of h times powers of d" (sampled, no margins, so slightly optimistic):
   p = A0, q = K0 d, psi = P0 d  (gpt's g16 family, variable K0)          0.2624
   + A1 d^2                                                              0.3537 (30 knots), 0.3600 (60 knots)
   + K1 d^3, P1 d^3                                                      0.3602 (30 knots)
   + A2 d^4                                                              0.3618 (30 knots)
   + K2 d^5, P2 d^5                                                      0.3682 (36 knots)
   one more power of d in each                                            0.3692 (36 knots)
   (six functions on 60 knots: 0.3664; knots are worth more than powers at this point)
The four-function family saturates near 0.360 whatever the knots. In its optimum the matrix inequality is tight on
whole two-dimensional regions (all d in the strip |h| < 0.25 that the ring crosses through its mass-free gap, and
near the turning point), i.e. the family is fighting a constraint that the true dual meets only along the curve.
Polynomials in d converge slowly; a genuinely two-dimensional discretisation of (beta, gamma, psi) on the square is
the next step, and by Theorem C its verification stays a set of small polynomial checks, one per mesh cell.
The true optimum's multipliers along the curve (for anyone who continues): with Lambda = 38.94, m = 0.28278 (N = 80),
qhat/d = kappa(h) rises from 0.566 at the lamp boundary (h = 0.244) to 0.689 at the turning point (h = 0.489);
psihat/d from 0.204 to 0.459; and phat = [(h - m)^2 + (2 kappa - 1) d^2]/(2(1 - h)) on the curve (f3-80.npz).

## 8. Open

1. The exact value. If telegraph + ring is optimal it is a transcendental-looking number near 0.3769 defined by a
   variational problem for a measure on a circle (an eighth-order ODE with a pointwise constraint); I found no closed
   form, and the natural candidate G (C1 - sqrt C2) is false.
2. A dual certificate at 0.3769 (would prove optimality of the mixture and settle the constant).
3. The function R(m), hence g(C1, C2) on the whole region below the parabola where the envelope touches it.
4. The paper's continuous-record question: untouched here. The lifting works for any finite set of linear
   functionals of resolvents, so the same convex-program-plus-locality route should apply.
