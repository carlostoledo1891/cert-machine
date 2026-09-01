# The value of lambda(4)

**A machine-derived proof that lambda(4) = -L(1,2,3,4), completing the program of Mercer's Section 5.**

Draft v0.9 · 2026-09-01 · repository cert-machine @ git d76c7c1 · record `certs/lambda4-campaign.json`

## Status

This proof was derived and verified by a certified-arithmetic engine and has **not** been peer-reviewed.
Every constant in this document is interpolated from the machine record at build time; the mathematical
prose (lemma proofs, cone bijections, the proof template) is authored and should be reviewed like any
mathematics. An independent audit walk (direct trigonometric summation, no code shared with the engine)
covered every gcd-reduced 4-set with max element <= 30 — 25819 sets, every one reached by an explicit clause of this proof, 423 finite-clause sets re-certified fresh, and a full sweep found zero refuters.
Reproduction: `node tools/run-lambda4-campaign.js` (the whole campaign, ~30 min),
`node instruments/lambda4/battery.js` (calibration + red controls, ~1 s),
`node tools/audit-lambda4.js` (the independent walk).

## 1. Statement

For a set A = {a_1 < ... < a_n} of positive integers write f_A(t) = sum cos(a_i t) and
L(A) = min_t f_A(t) < 0. Following Mercer [M], -lambda(n) = sup_A L(A) over all n-element sets;
lambda(n) is the shallowest possible dip. Mercer proved lambda(2) = 9/8 and
lambda(3) = (17 + 7*sqrt(7))/27, and conjectured:

**Theorem.** lambda(4) = -L(1,2,3,4). Numerically lambda(4) = 1.5195578816428...;
exactly, lambda(4) is the root of

    512 y^3 - 1227 y^2 + 600 y + 125 = 0

in the certified enclosure [-855435038691829/562949953421312, -6843480309534631/4503599627370496] negated. Equality
holds for {1,2,3,4} and its dilations and, by strictness of every closure below, for no other set.

The extremal value is an algebraic number of degree 3: with c = cos t,
f_{1,2,3,4} = 8c^4 + 4c^3 - 6c^2 - 2c, and the cubic above is the exact resultant of this
quartic minus y against its derivative, restricted to the enclosure. Both the enclosure
(BigInt Sturm isolation + interval Newton) and the sign change of the cubic across it
(exact rational evaluation) are re-proved mechanically at every build of this document's
companion page.

Since gcd-scaling leaves L(A) unchanged (f_{kA}(t) = f_A(kt)), it suffices to prove
min f_A <= L(1,2,3,4) for every A = {a<b<c<d} with gcd(A) = 1 — the domain N'_4.

## 2. The toolkit

### 2.1 Averages over equispaced sets

For m >= 1 and an anchor xi, let S = S(m, xi) = { t : m t = xi (mod 2pi) }, a set of m
equally spaced points. For the average <g>_S = (1/m) sum_{t in S} g(t):

**Lemma A (the average of a cosine).** <cos(k t)>_S = cos(t' xi) if k = t' m for a
nonnegative integer t', and 0 otherwise.

*Proof.* With t_j = (xi + 2 pi j)/m, sum_j cos(k t_j) = Re[ e^{i k xi / m} sum_j e^{2 pi i k j / m} ],
and the inner geometric sum is m when m | k and 0 otherwise; when k = t' m the phase is e^{i t' xi}. □

Products expand by cos A cos B = (cos(A+B) + cos(A-B))/2, so the inner product
<w, g>_S of two cosine polynomials is a finite rational combination of Lemma-A averages.
The anchors used are xi in {0, pi/6, pi/3, pi/2, 2pi/3, pi, 4pi/3}; at every multiple this
proof evaluates, cos(t' xi) is rational (at pi/6 only even multiples and t' = 3, 9 mod 12
occur, all rational: 0, ±1/2, ±1).

### 2.2 The piecewise structure over a cone

Every family below is presented by a **cone**: members are linear forms with nonnegative
integer coefficients over free parameters x_1, ..., x_k >= 1. Two elementary principles
make Lemma A computable uniformly over a cone:

- **(Positivity.)** A form with nonnegative coefficients summing to >= 1 is >= 1 at every
  point of the cone (its minimum is at x = (1,...,1)).
- **(Bounded multiples.)** If B*m - k has nonnegative coefficients summing to >= 1, then
  k < B*m on the cone, so k = t' m is possible only for t' < B — finitely many candidate
  linear conditions, each kept only if neither it nor its negation is certified positive.

Consequently <w, g>_S, as a function on the cone, equals an exact rational **base value**
plus, for each of finitely many linear **collision conditions**, an exact rational **delta**
added when that condition holds. Additivity over simultaneously active conditions is exact,
not approximate: each Lemma-A average depends only on its own divisibility condition.
Forms of unknown sign are handled through evenness of cosine: |k| = t' m with the vanishing
case t' = 0 (contributing cos 0 = 1) included as a genuine condition.

### 2.3 The dip extraction

**Lemma B (Mercer's Lemma 3.4, with the hypothesis made explicit).** If w >= 0 on the
circle, <w, g>_S <= 0, and <w, 1>_S > 0, then g(t) <= 0 for some t in S.

*Proof.* If g > 0 everywhere on S, then sum w(t) g(t) >= 0 with equality only if w g
vanishes identically on S, forcing w = 0 on S and <w,1>_S = 0. □

The engine verifies <w,1>_S > 0 on **every** branch it closes: the worst case over all
collision subsets of the positivity expression (conservative, since inconsistent subsets
only help). All weights are drawn from the nonnegative cone generated by constants,
(1 - cos k t), (1 + cos k t) and their squares.

### 2.4 The two-set estimate

**Lemma C (Mercer's Lemma 3.1).** Equispaced sets S(m_1, xi_1), S(m_2, xi_2) with
g = gcd(m_1, m_2) contain points t_1, t_2 with |t_1 - t_2| <= pi g / (m_1 m_2).

Whenever Lemma C is invoked, g = 1 is **certified**, never assumed: every member of the
(gcd-reduced) set is exhibited as an integer combination of the two orders, so a common
divisor of the orders would divide gcd(A) = 1.

Evaluating at the S(m_1, xi_1)-point t_1 provided by Lemma C: m_1 t_1 = xi_1 exactly, and
|m_2 t_1 - xi_2| <= pi/m_1. A member k = u m_1 + v m_2 then satisfies
k t_1 = u xi_1 + v xi_2 + v delta with |v delta| <= |v| pi / N, N the value of m_1.
Each member is finished by one of:

- **exact** (v = 0): cos(k t_1) = cos(u xi_1), a rational from the anchor table;
- **Lemma D** (target pi): cos(pi + e) <= -1 + e^2/2 for all e (since cos e >= 1 - e^2/2);
- **Lemma E** (target 2pi/3 or 4pi/3; Mercer's Lemma 3.3): cos(2pi/3 ± e) <= -1/2 + (3/pi) e
  for 0 <= e <= pi/6. *Proof.* On [pi/2, 2pi/3], cos'' = -cos >= 0, so cos is convex and lies
  below the chord through (pi/2, 0) and (2pi/3, -1/2), whose equation is -(3/pi)(t - pi/2);
  at t = 2pi/3 - e this is -1/2 + (3/pi)e. For the right side cos(2pi/3 + e) <= -1/2 <=
  -1/2 + (3/pi)e. The pi/6 range restriction keeps the left side inside [pi/2, 2pi/3]. □
  The validity range is carried as a floor on every derived threshold.
- **Lemma F** (target pi/2 or 3pi/2, new here): cos(pi/2 ± e) <= e and cos(3pi/2 ± e) <= e,
  for all e, since |cos(pi/2 + x)| = |sin x| <= |x|.

Summing gives a certified bound f_A(t_1) <= Aq + Bq pi^2/N^2 + Cq/N + Dq pi/N with exact
rationals Aq, Bq, Cq, Dq >= 0 (except Aq), decreasing in N. The **derived threshold** N_0 is
the least integer at or above every validity floor whose bound clears the target
L(1,2,3,4) (compared through a directed rational enclosure of pi — floating point never
enters a decision). Below N_0 the family is a finite list, and every member of it is
decided by the certified minimum instrument (Chebyshev reduction, BigInt Sturm isolation,
interval Newton — calibrated by re-deriving Mercer's lambda(2) and lambda(3) at every test
run, thresholds a >= 3, b >= 3, b >= 33 re-derived, 324 calibration sets decided).

## 3. The generic case

On S(d, pi) take the weight w = (1 - cos a t) + (1 - cos b t) + 2 (1 - cos c t)^2 and the
target g = 3/5 + cos a t + cos b t + cos c t. The engine computes <w, g>_S = 0 and
<w, 1>_S = 5 in base, so by Lemma B, cos a t + cos b t + cos c t <= -3/5 somewhere on S;
adding cos(d t) = -1 there gives min f_A <= -8/5 < L(1,2,3,4). The computation is valid
except on the collision conditions, which the engine derives (they are OUTPUT — the
fourteen match Mercer's hand-written list exactly) together with each one's exact delta:

| condition | delta | consequence | example |
|---|---|---|---|
| `2a = d` | 1/2 | must be handled | {3,4,5,6} |
| `2b = d` | 1/2 | must be handled | {1,2,3,4} |
| `2c = a+d` | -1/2 | closes itself | {1,2,3,5} |
| `2c = b+d` | -1/2 | closes itself | {1,2,3,4} |
| `2c = d` | 7/5 | must be handled | {1,2,3,6} |
| `3c = 2d` | 1/2 | must be handled | {1,2,4,6} |
| `3c = d` | -1/2 | closes itself | {1,2,3,9} |
| `a+2c = 2d` | 1/2 | must be handled | {2,3,4,5} |
| `a+2c = d` | -1/2 | closes itself | {1,2,3,7} |
| `a+b = d` | 1 | must be handled | {2,3,4,5} |
| `a+c = d` | 5/2 | must be handled | {1,2,3,4} |
| `b+2c = 2d` | 1/2 | must be handled | {1,2,3,4} |
| `b+2c = d` | -1/2 | closes itself | {1,2,3,8} |
| `b+c = d` | 5/2 | must be handled | {1,2,3,5} |

Five of the fourteen carry strictly negative delta: any set activating only those still has
<w, g>_S <= 0 and is closed by the same argument. **The remaining reduction is the nine
positive-delta families.** As a structural consistency check, {1,2,3,4} activates four
conditions with delta sum +3 > 0 — the generic argument correctly cannot close the
extremal set, and a red control keeps it that way.

## 4. The template for a family

Each family is closed by the same three moves, one level down:

1. **A second-level dot theorem** on the family's own cone: a weight and an anchored
   equispaced set chosen so that the anchored members contribute <= -1 exactly and the
   base inner product is <= 0; the collision conditions are again derived, and any
   positive-delta condition defines a **subfamily** with one fewer degree of freedom.
   Where the family's region is not a single cone (a and c-b incomparable, parity
   constraints), it is first **triangulated** into finitely many cones, checked onto
   point-by-point over a box (and, in Section 5, argued once each).
2. **Anchored closures** (Section 2.4) for every subfamily, with derived thresholds; a
   subfamily whose two parameters are independently unbounded gets a union of two
   closures, one per tail.
3. **Finite decisions** below the thresholds, one certificate per set. In the three
   families containing {1,2,3,4} (the equality families d = 2b, d = a+c, 2d = 2c+b),
   the extremal set appears exactly once, in a single cone or ray, where the finite
   decision SKIPS it as the definitional witness — equality, not a violation — and
   certifies every neighbour strictly below the target.

Two conditions of the family 2d = 2c+b are not closed by new work at all: their sets
satisfy d = 2a (respectively d = a+b) identically, families already closed — the record
marks them DELEGATED. In total 2231 finite sets were decided across the nine families,
zero undecided, and the only skipped set — ever — is {1,2,3,4}.

## 5. The nine families

The cone parametrizations below are bijections onto the stated regions; each is the
standard prefix/chain substitution (new variables = successive differences, each >= 1),
composed where noted with a parity substitution (a = 2t etc.) or a triangulation on the
one incomparable pair. Onto-ness is checked point-by-point over a box at every campaign
run; the inverse maps are stated inline. Derived data (thresholds, floors, finite counts)
below is read from the record.

### 5.1  Family d = 2c

Region a < b < c free (prefix cone; d = 2c derived). Dot on S(c, 2pi/3): anchored c, d at -1/2 each; w = 2(1-cos a)^2 + 2(1-cos b)^2; base -2/5. Four positive conditions.

Closures and finite parts (from the record):

  - b = 2a: N0 = 19 (floor 12) OR N0 = 19 (floor 12) ; finite 50 enumerated / 50 certified
  - c = 2a: N0 = 3 ; finite 1 enumerated / 1 certified
  - c = 2b: N0 = 3 ; finite 1 enumerated / 1 certified
  - c = a+b: N0 = 25 (floor 12) ; finite 179 enumerated / 179 certified

### 5.2  Family d = 2a

Region a < b < c < 2a: chain with the substitution a = (c-b) + (b-a) + r, all differences >= 1 — inverse r = 2a - c. Dot on S(a, 2pi/3): anchored a, d at -1/2; w = 2(1-cos b)^2 + 2(1-cos c)^2; base -2/5. EVERY condition is negative: the family closes generically.

Closures and finite parts (from the record):



### 5.3  Family d = b+c

Prefix cone. Dot on S(b+c, pi): anchored d at -1; w = 2(1-cos a)^2; base -1/5. One condition, negative (paired collision events on 2a = c and 2a = b cancel exactly): closes generically.

Closures and finite parts (from the record):



### 5.4  Family d = a+b

Region c < a+b: substitution a = (c-b) + r. Dot on S(a+b, pi): w = 2(1-cos c)^2; base -1/5. One positive condition, 2d = 3c — the doubly constrained subfamily {3p+q, 3p+2q, 4p+2q, 6p+3q} (inverse: q = b-a, p = (2a-b)/3). On S(gamma, pi/3), gamma = d/3, the four members are CONSTANT at -3/2 — above the target; the closure instead evaluates on S(gamma, pi/2) where c anchors at -1, d at 0, a lands at pi (Lemma D) and b at pi/2 (Lemma F).

Closures and finite parts (from the record):

  - E: 2d = 3c: N0 = 8 ; finite 8 enumerated / 8 certified

### 5.5  Family d = a+c

Prefix cone; EQUALITY family. Dot on S(a+c, pi): w = 2(1-cos b)^2; base -1/5. Two positive conditions: the arithmetic-progression subfamily {b-t, b, b+t, 2b} (2b = a+c), closed by the reflection estimate — evaluation on S(b, pi) with companion S(t, 0), so a and c land at pi (Lemma D) and d = 2b at cos 2pi = +1, giving -2 + pi^2/N^2; and 3b = 2d, closed on S(b/2, pi/2). The extremal set lives in the AP subfamily and is the skipped witness.

Closures and finite parts (from the record):

  - AP: 2b = a+c: N0 = 5 ; finite 5 enumerated / 4 certified / skipped 1,2,3,4
  - 3b = 2d: N0 = 8 ; finite 17 enumerated / 17 certified

### 5.6  Family 2d = 2c+a

Parity substitution a = 2t; chain cone (t, b-a, c-b). Dot on S(d, pi): w = 2(1-cos a)^2; base -1/5. Four positive conditions — read from the engine after a hand-translation error was caught by the coverage gate — with subfamilies 2c = 3a, b = 2a (two-closure union), c = 2a (triangulated on b vs 3a into two cones and the single reduced ray {2,3,4,5}), and 2c = 2b+a (union on S(a/2, pi/2), Lemma F).

Closures and finite parts (from the record):

  - 2c = 3a: N0 = 6 (floor 6) ; finite 9 enumerated / 9 certified
  - b = 2a: N0 = 13 (floor 6) OR N0 = 44 (floor 24) ; finite 144 enumerated / 144 certified
  - c = 2a, b < 3a/2·2: N0 = 7 (floor 6) ; finite 11 enumerated / 11 certified
  - c = 2a, b = 3al: finite only ; finite 1 enumerated / 1 certified
  - c = 2a, b > 3al: N0 = 7 (floor 6) ; finite 11 enumerated / 11 certified
  - 2c = 2b+a: N0 = 14 OR N0 = 17 ; finite 39 enumerated / 39 certified

### 5.7  Family d = 2b

EQUALITY family; a and c-b incomparable, so triangulate: D1 (a < c-b), D2 (a = c-b, i.e. c = a+b), D3 (a > c-b) — chain substitutions with inverses r = 2b-c and e = a - (c-b). Dots on S(b, 2pi/3) for D1/D3 (anchored b, d at -1/2; w = 2(1-cos a)^2 + 2(1-cos c)^2; base -2/5); ten positive conditions consolidating to SIX subfamilies (U1 b=2a; U2 the AP family again; U3 c=3b-2a; U4 2c=3b+a; U5 2c=3b-a, a 1090-set two-tail box; U6 c=2a). D2 closes directly by an anchored closure with the extremal set skipped.

Closures and finite parts (from the record):

  - U1: b = 2a (cone 1): N0 = 7 (floor 6) ; finite 11 enumerated / 11 certified
  - U1: b = 2a (cone 2): N0 = 7 (floor 6) ; finite 11 enumerated / 11 certified
  - U1: b = 2a (cone 3): finite only ; finite 1 enumerated / 0 certified / skipped 1,2,3,4
  - U2: c = 2b-a (AP) (cone 1): N0 = 5 ; finite 5 enumerated / 4 certified / skipped 1,2,3,4
  - U3: c = 3b-2a (cone 1): N0 = 19 (floor 12) ; finite 50 enumerated / 50 certified
  - U4: 2c = 3b+a (cone 1): N0 = 19 (floor 12) ; finite 50 enumerated / 50 certified
  - U5: 2c = 3b-a (cone 1): N0 = 32 (floor 12) OR N0 = 57 (floor 24) ; finite 1090 enumerated / 1090 certified
  - U6: c = 2a (cone 1): N0 = 19 (floor 12) ; finite 101 enumerated / 101 certified
  - cone D2 (direct closure): N0 = 13 (floor 6) ; finite 45 enumerated / 44 certified / skipped 1,2,3,4

### 5.8  Family 2d = 2c+b

EQUALITY family; parity b = 2*beta; triangulate on a vs beta (cones i, ii, iii). Dots on S(c, pi) for i/iii (anchored c at -1; w = 2(1-cos a)^2; g covers a, b, d; base -1/5); cone ii (a = beta) closes by a two-closure union with the extremal set skipped. Two conditions DELEGATE (their sets satisfy d = 2a resp. d = a+b); the rest: d = b+2a, c = a+b (three cones incl. the extremal ray), d = 2c-2a (on S(c-a, pi/2), Lemma F), c = 2a, 2c = 3a (on S(a/2, pi/3)).

Closures and finite parts (from the record):

  - d = b+2a: N0 = 13 (floor 12) ; finite 22 enumerated / 22 certified
  - c = a+b (cone 1): N0 = 19 (floor 6) ; finite 101 enumerated / 101 certified
  - c = a+b (cone 2): finite only ; finite 1 enumerated / 0 certified / skipped 1,2,3,4
  - c = a+b (cone 3): N0 = 19 (floor 6) ; finite 101 enumerated / 101 certified
  - d = 2a: DELEGATED to family d = 2a
  - d = a+b: DELEGATED to family d = a+b
  - d = 2c-2a: N0 = 6 ; finite 1 enumerated / 1 certified
  - c = 2a: N0 = 19 (floor 12) ; finite 50 enumerated / 50 certified
  - 2c = 3a: N0 = 7 ; finite 5 enumerated / 5 certified

### 5.9  Family 2d = 3c

Parity c = 2*gamma; seven cones (b vs gamma, then a vs p = b-gamma, then j = a-p vs p). Dots on S(gamma, pi/3) with the LINEAR weight (1-cos a) + (1-cos b) against g = 1/10 + cos a + cos b: anchored c at -1/2, d at -1; base -4/5. Cone W1 (b < gamma) closes generically. Subfamilies: 2b = 3gamma and 4a = 3c close on the pi/6 anchor (members at multiples 3, 4, 6 of s — cosines 0, -1/2, -1, all rational); a+b = c on S(gamma, pi/3); 2a = c on S(gamma, pi/2); a+b = d delegates; four reduced rays decided directly. Note: two condition vectors in cone W3c define the same hyperplane (unequal keys, equal content); both map to the same subfamily and their deltas co-activate additively.

Closures and finite parts (from the record):

  - 2b = 3gam (cone 1): N0 = 3 ; finite 1 enumerated / 1 certified
  - 2b = 3gam (cone 2): N0 = 3 ; finite 1 enumerated / 1 certified
  - 2b = 3gam (cone 3): N0 = 3 ; finite 1 enumerated / 1 certified
  - 2b = 3gam (ray 1): finite only ; finite 1 enumerated / 1 certified
  - 2b = 3gam (ray 2): finite only ; finite 1 enumerated / 1 certified
  - a+b = c: N0 = 7 (floor 6) ; finite 11 enumerated / 11 certified
  - a = gam: N0 = 4 ; finite 3 enumerated / 3 certified
  - 4a = 3c: N0 = 3 ; finite 1 enumerated / 1 certified
  - a+b = d: DELEGATED to family d = a+b
  - {1,3,4,6} ray: finite only ; finite 1 enumerated / 1 certified
  - {4,5,6,9} ray: finite only ; finite 1 enumerated / 1 certified
  - {2,4,6,9} ray: finite only ; finite 1 enumerated / 1 certified
  - {6,7,8,12} ray: finite only ; finite 1 enumerated / 1 certified
  - cone W2 (direct closure): N0 = 4 ; finite 3 enumerated / 3 certified

## 6. Assembly

Every A in N'_4 is covered: if d avoids all fourteen conditions, or activates only
negative-delta ones, the generic case gives min f_A <= -8/5. Otherwise A lies in at least
one of the nine families, each of which certifies min f_A <= L(1,2,3,4) for all its
members (strictly, except the skipped witness). Hence sup_A L(A) = L(1,2,3,4), attained
by {1,2,3,4}; that is, lambda(4) = -L(1,2,3,4). □

## 7. What a referee should check

1. Lemmas A–F above (elementary; proofs included).
2. The positivity/bounded-multiples principles of 2.2, and additivity of deltas.
3. The cone parametrizations of Section 5 (each a one-line change of variables; the
   campaign additionally checks each onto over a box, point-by-point).
4. That the engine's derived data is what this document quotes — regenerate it:
   the record is rewritten from scratch by `node tools/run-lambda4-campaign.js` and this
   document by `node tools/build-lambda4-writeup.js`; the independent audit
   `node tools/audit-lambda4.js` re-walks every clause with no shared code.
5. The finite certificates: each is a certified enclosure of a specific minimum from the
   calibrated instrument; the audit re-certifies every finite-clause set in its box fresh.

## References

- [M] I. Mercer, *Finite searches, Chowla's cosine problem, and large Newman polynomials*,
  INTEGERS 19 (2019), #A4 (arXiv:1709.06612). The statement, Section-5 strategy, and
  Lemmas C–E are his; this work executes and completes the strategy.
- B. Bedert, *Polynomial bounds for the Chowla Cosine Problem*, arXiv:2509.05260 (asymptotic side).
- Jin–Milojević–Tomon–Zhang, arXiv:2509.03490 (asymptotic side).
