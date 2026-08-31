# OEIS submission packs — the Erdős #290 family

STATUS (2026-08-28): packs 1–3 are READY — content is campaign-independent
and every term below was recomputed today by exact integer resultants
(Bareiss, no libraries) with the composition identity verified on the data.
Packs 4–5 (the constants) are STAGED and wait for the l ≈ 310 campaign
("first three digits unconditional") plus the extended-precision b-file.
All sends are the operator's clicks; during review, editor comments come
back here and replies are drafted for pasting.

Recommended order: 1 → 2 → 3 (any time, concurrently with the campaign),
then 4 → 5 when the campaign summits and the issue-164 follow-up has
engaged Woett.

---

## PACK 1 — Discriminant of the derivative of x(x-1)...(x-d)

NAME
  Discriminant of the derivative of x*(x-1)*(x-2)*...*(x-d).

DATA (offset 1)
  1, 12, 2000, 6728000, 653817577728, 2524149828635000832,
  512837705591326260986904576, 7039151565244751994562764269005307904,
  8164988878828438579131448183584441815764303872000

OFFSET
  1

COMMENTS
  a(d) is the discriminant of f_d(x) = Sum_{i=0..d} Product_{j=0..d, j<>i}
  (x-j), the derivative of Product_{j=0..d} (x-j). Since the product has
  d+1 distinct real roots, f_d has d distinct real roots and a(d) > 0.
  For even d = 2l, recentring gives f_d(x+l) = h(x^2) for a polynomial h
  of degree l with lead(h) = d+1, and (restoring the non-monic factor in
  the composition law of Altmann-Awtrey-Cryan-Shannon-Touchette)
    a(d) = (d+1) * (2^l * l! * disc(h))^2,
  so for even d, a(d) is a perfect square if and only if d+1 is, i.e.
  exactly when d = 4k(k+1) (A033996). This square/non-square dichotomy
  controls whether the Galois group of f_d can drop into the even-weight
  subgroup of the signed symmetric group S_l^+, which is the mechanism
  behind the exceptional degrees in the computation of the constant for
  Erdos problem #290 (see the van Doorn help-wanted issue linked below).
  The polynomials f_d and their root densities delta(f_d) appear in
  W. van Doorn's resolution of Erdos problem #290 (arXiv:2411.03073,
  Section 3.3).

LINKS
  W. van Doorn, On the non-monotonicity of the denominator of generalized
    harmonic sums, arXiv:2411.03073 [math.NT], 2024.
  T. F. Bloom, Erdos Problem #290, https://www.erdosproblems.com/290
  W. van Doorn, HELP WANTED: Computing sequence for Erdos problem #290,
    https://github.com/teorth/erdosproblems/issues/164
  K. Altmann, C. Awtrey, S. Cryan, K. Shannon, M. Touchette, Galois groups
    of doubly even octic polynomials, J. Algebra Appl. 19 (2020) 2050014.
  H. V. Chen, A. Y. M. Chin, S. H. Tan, restatement of the disc(h(x^2))
    composition law, arXiv:2210.10257, Prop. 2.8.
  Carlos Toledo, Erdos #290: the 4k(k+1) theorem (rerunnable computation),
    https://www.carlostoledo.co/reports/erdos290.html
  [attach b-file: b-disc-fd.txt, terms d = 1..20]

FORMULA
  For even d = 2l: a(d) = (d+1) * (2^l * l! * A?????? (l))^2, where
  A?????? is the disc(h) sequence (PACK 2 — fill its A-number).

EXAMPLE
  For d = 3: f_3(x) = 4x^3 - 18x^2 + 22x - 6 has discriminant 2000.

PROG
  (PARI) a(d) = poldisc(deriv(prod(j=0, d, (x-j))))

KEYWORD
  nonn

XREFS
  Cf. A033996 (d with a(d) a perfect square, for even d), A375081,
  PACK 2's A-number.

---

## PACK 2 — Discriminant of the pair polynomial h_l

NAME
  Discriminant of the polynomial h_l defined by f(x+l) = h_l(x^2), where
  f is the derivative of x*(x-1)*...*(x-2l).

DATA (offset 1)
  1, 145, 12510288, 2303072868513024, 2457947913003328321280212992,
  34165122738451955705810966277767294877696000

OFFSET
  1

COMMENTS
  The derivative f of Product_{j=0..2l} (x-j) becomes an even polynomial
  after recentring at l, so f(x+l) = h_l(x^2) with deg h_l = l,
  lead(h_l) = 2l+1 and h_l(0) = (-1)^l * (l!)^2. disc(h_l) <> 0 since f
  has 2l distinct real roots. The composition law (see PACK 1) gives
  disc(f) = (2l+1) * (2^l * l! * a(l))^2. The splitting field of h_l is
  the subfield tied to the signed-symmetric Galois structure of f used in
  the computation of the Erdos #290 constant.

LINKS
  [same four links as PACK 1; attach b-file: b-disc-h.txt, terms l = 1..12]

FORMULA
  A??????(2l) = (2l+1) * (2^l * l! * a(l))^2 (PACK 1's A-number).

EXAMPLE
  For l = 2 (d = 4): f_4(x+2) = h_2(x^2) with h_2(y) = 5y^2 - 15y + 4,
  and disc(h_2) = 15^2 - 4*5*4 = 145. The composition law then gives
  disc(f_4) = 5 * (2^2 * 2! * 145)^2 = 5 * 1160^2 = 6728000, matching
  PACK 1's a(4).

PROG
  (PARI) a(l) = my(f=deriv(prod(j=0, 2*l, (x-j))), g=subst(f, x, x+l));
         poldisc(sum(k=0, l, polcoeff(g, 2*k)*y^k))

KEYWORD
  nonn

XREFS
  Cf. PACK 1's A-number, A033996.

---

## PACK 3 — Comment on A033996 (8*binomial(n+1,2) = 4k(k+1))

Proposed added comment:
  Also degrees d = 4k(k+1) are exactly the even d for which the
  discriminant of the derivative of x*(x-1)*...*(x-d) is a perfect
  square: for even d = 2l that discriminant equals
  (d+1)*(2^l*l!*disc(h))^2 (see A?????? and A??????), so it is a square
  iff d+1 = (2k+1)^2. Computationally these are exactly the even degrees
  at which the Galois group of that derivative drops from the full signed
  symmetric group S_l^+ — verified for all even d <= 240 (as of
  2026-08-28; update to the campaign horizon at send time), the drop
  occurring at every 4k(k+1) in range (d = 8, 24, 48, 80, 120, 168,
  224). This underlies the
  computation of the constant in Erdos problem #290; see
  W. van Doorn, arXiv:2411.03073 and
  https://github.com/teorth/erdosproblems/issues/164.

---

## PACK 4 — READY (2026-08-31) — c0 = 1/(1+c), van Doorn's constant

The campaign condition this pack waited on is MET: the horizon reached
l = 310 (every even d <= 620 pinned exactly, 250 degrees closed, none open),
and the first three digits are now unconditional. Every number below is
produced by tools/erdos290-cstar-precision.js and rewritten at each horizon
extension; the b-file is outreach/b-oeis-c0.txt (110 terms).

NAME
  Decimal expansion of 1/(1+c), where c = Sum_{d>=1} delta(f_d)/(d*(d+1))
  and delta(f_d) is the density of primes p for which the derivative of
  x*(x-1)*...*(x-d) has a root mod p; conjecturally the optimal constant
  in van Doorn's lower bound b(a) > a + (c_0+o(1))*log(a) for Erdos
  problem #290.

OFFSET
  0, 1

DATA (offset 0)
  5, 4, 6, 2, 2, 9, 3, 1, 0, 4, 0, 0, 1, 0, 4, 5, 8, 7, 4, 1, 2, 6, 6,
  0, 5, 8, 5, 4, 3, 8, 3, 6, 3, 1, 4, 2, 7, 3, 4, 8, 3, 3, 1, 7, 0, 1,
  5, 3, 6, 0, 2, 5, 7, 1, 9, 9, 4, 1, 7, 7, 1, 2, 9, 4, 1, 0, 5, 4, 3,
  3, 3, 3, 0, 3, 2, 1, 8, 4, 9, 3, 6, 5, 9, 0, 2, 3, 9, 4, 1, 8, 1, 6,
  3, 0, 7, 5, 1, 9, 7, 7, 3, 7, 7, 3, 3, 6, 8, 7, 2, 2

COMMENTS
  The first 3 digits are UNCONDITIONAL. The certified interval is
  1/(1+c) in [0.546083759260, 0.546323774021], obtained from exact
  rational Galois densities pinned for every even d <= 620 together with
  the honest interval [0,1] at every unpinned degree. No estimate enters
  the bracket, so it can only narrow as more degrees are pinned; it
  cannot move.

  The remaining digits hold under one stated assumption: for every even
  d >= 622, Gal(f_d) is either the full signed symmetric group S_l^+
  (l = d/2) or its index-2 subgroup. That assumption is verified at every
  degree where the group has been determined, which is every even
  d <= 620.

  Failure semantics, so the entry can be amended rather than retracted:
  a first failure of the assumption at degree d0 perturbs c by at most
  1/(d0*(d0+1)) and perturbs 1/(1+c) by at most about 0.299/(d0*(d0+1)),
  since the derivative of 1/(1+c) is -1/(1+c)^2 = -0.2984... at this c.
  With d0 = 622 that is below 8e-7, so the digits above are stable well
  past the point where the assumption first bites; a failure would raise
  d0 and shorten the entry, not invalidate it.

  Requested by W. van Doorn (arXiv:2411.03073, the author) at the
  erdosproblems forum and at github.com/teorth/erdosproblems/issues/164:
  "I think it would be worthwhile to add the decimal expansion of c_0 to
  the OEIS".

EXAMPLE
  0.54622931040010458741266058543836314273483317015360...

LINKS
  W. van Doorn, arXiv:2411.03073
  teorth/erdosproblems, issue #164
  Independent certification and the full method, re-run at every build:
  https://www.carlostoledo.co/reports/erdos290.html

KEYWORD
  nonn, cons

XREFS
  Cf. PACK 5 (the constant c itself), PACKS 1-2, A375081, A033996.

---

## PACK 5 — READY (2026-08-31) — c, the density-sum constant

NAME
  Decimal expansion of c = Sum_{d>=1} delta(f_d)/(d*(d+1)), where
  delta(f_d) is the density of primes p for which the derivative of
  x*(x-1)*...*(x-d) has a root mod p. See PACK 4 for 1/(1+c), the
  constant in van Doorn's bound for Erdos problem #290.

OFFSET
  0, 1

DATA (offset 0)
  8, 3, 0, 7, 3, 2, 9, 5, 5, 8, 4, 8, 7, 3, 5, 6, 6, 3, 8, 5, 0, 3, 7,
  2, 7, 4, 8, 0, 3, 3, 4, 7, 9, 7, 4, 7, 2, 9, 3, 4, 3, 8, 0, 0, 4, 7,
  8, 3, 8, 0, 4, 6, 1, 2, 1, 5, 2, 5, 1, 7, 2, 3, 2, 1, 5, 8, 3, 2, 1,
  2, 5, 5, 0, 1, 9, 6, 6, 5, 8, 9, 9, 6, 5, 6, 2, 3, 3, 4, 8, 3, 2, 3,
  6, 4, 6, 5, 5, 1, 9, 0, 1, 6, 1, 6, 5, 2, 2, 0, 9, 5

COMMENTS
  The first 2 digits are UNCONDITIONAL: c lies in the certified interval
  [0.830416407911, 0.831220912621]. That is one digit fewer than PACK 4
  because passing to 1/(1+c) contracts the interval by a factor of about
  0.299. Everything else -- the assumption for even d >= 622, the failure
  semantics, the provenance -- is exactly as in PACK 4.

  Odd d contribute exactly log 2 to the sum, which is proved and carries
  roughly 83 percent of c; the whole difficulty is the even degrees.

KEYWORD
  nonn, cons

XREFS
  Cf. PACK 4, PACKS 1-2.

---

## Submission order, and the one editor question to expect

Send PACKS 1-3 first (campaign-independent integer sequences), then
PACK 4, then PACK 5 as its cross-reference. PACK 4 is the one van Doorn
asked for by name and should carry the correspondence link.

EXPECT THIS QUESTION, and it is fair: "is a conditional constant an
appropriate OEIS entry?" The prepared answer: the assumption is named in
the COMMENTS, its failure semantics are quantified, and there is an
unconditional statement to fall back on -- 1/(1+c) = 0.546... -- so an
editor who prefers an assumption-free entry can take a 3-digit sequence
instead of a 110-digit one. Offer both and let the editor choose. Do not
argue for the long one.
