# Definitions the cited statements rely on (step 1: papers only, Lean not yet read)

Reader B, 2026-11-12. Pins in `sources.json`. Quotes are from the LaTeX sources at the pinned versions
(checked against the rendered PDFs for the theorem numbers). Everything below is a reading, not a decision.

Version choice for [1]: arXiv 1402.0811 **v3** (3 Sep 2014). Its Section 2 numbers "New Type I, II, III estimates"
as **Theorem 2.8** (parts (i)–(v)) and the bilinear Bombieri–Vinogradov theorem as **Theorem 2.9**, matching the
citations. In v1 and v2 the same two theorems are numbered 2.23 and 2.24 (checked by counting the shared theorem
counter in each source and in each PDF), so v1/v2 do not match the citations.

---

## [2] J. Stadlmann, "Bounded gaps between primes", arXiv 2608.31126v1

Note on the paper itself: the abstract and Theorem 1 claim H_1 <= 240 (not 212). Lemma/Proposition/Definition
numbers are separate counters: Lemmas 3–7 are the five "Equidistribution ingredients" (Section 3.2), Proposition 2 is
the Harman's-sieve proposition (Section 4.1), Definition 9 is "Decomposition" (Section 4.1).

**Notation (Section 1.3).** "We say a positive integer n is y-smooth if all its prime factors are of size less
than y. We write P(y) = prod_{p<y} p." (strict `<` in both.)

**Definition 6 (Coefficient sequences).** "A coefficient sequence is a function alpha: N x (1,inf) -> R which
satisfies |alpha(n;x)| << tau(n)^{O(1)} log(x)^{O(1)}.
(i) alpha is said to be located at scale N(x) if there are some constants 1 << c << C << 1 such that alpha(.;x)
is supported on [cN(x), CN(x)] for every x>1.
(ii) If alpha is located at scale N(x), it is said to have the Siegel-Walfisz property if
| sum_{n=a (q), (n,r)=1} alpha(n;x) - 1/phi(q) sum_{(n,qr)=1} alpha(n;x) | <<_A tau(qr)^{O(1)} N(x)/log(x)^A
for any x>1, any q,r>=1, any A>1, and any residue class a mod q with (a,q)=1.
(iii) alpha is said to be smooth at scale N(x) if there are some constants 1<<c<<C<<1 so that for every x>1, there
exists a smooth function psi: R -> C supported on [c,C], with |psi^{(j)}(t)| <<_j log(x)^{O_j(1)} for all t, such
that alpha(n;x) = psi(n/N)."

In my words: real-valued, two arguments (n, x); one pair of constants c, C (independent of x) for the support; the
Siegel–Walfisz sums run over ALL n in N (finite because of the support); the SW bound is for every x>1, uniform in
q, r, a, with constant depending on A only. "Smooth" carries its own c, C and implies "located" (the paper does not
say so explicitly but support of psi in [c,C] gives it).

**Convolution.** (alpha * beta)(n) = sum_{d | n} alpha(d) beta(n/d) (x carried along).

**Definition 7 (Equidistribution), the sum used by Lemmas 3–7.** "Consider f: N x (1,inf) -> C. Let
D(x;omega,gamma,delta;eps) be a set of integers ... For a given set of (omega,gamma,delta), we say f has
equidistribution properties for moduli in D(x;omega,gamma,delta;eps), provided the following holds: For any
sufficiently small eps>0 and for all x>1 and A>0, and for all a in Z with (a,p)=1 for p<=x,
  sum_{d in D(x;omega,gamma,delta;eps), d squarefree} | sum_{n in [x,2x], n = a (d)} f(n;x)
      - 1/phi(d) sum_{n in [x,2x], (n,d)=1} f(n;x) | <<_{A,eps} x / log(x)^A.
Note that the implied constant is only allowed to depend on omega, gamma and delta insofar that they determine which
eps are sufficiently small."

In my words, the quantifiers: there is eps_0 = eps_0(omega,gamma,delta) > 0 such that for every eps in (0, eps_0) and
every A > 0 there is C(A,eps) with: for every real x > 1 and every integer a coprime to every prime p <= x, the sum
is <= C(A,eps) x / log(x)^A.
- **n-range:** n in the closed real interval [x, 2x] (both the progression sum and the main term). NOT all n.
- **moduli:** squarefree d in the set D (every D in Lemmas 3–7 is a subset of [1, x^{1/2+2omega}] ∩ N).
- **residue:** a single fixed integer a, coprime to all primes <= x (so to every d <= x); no sup over a.
- **main term:** (1/phi(d)) times the sum of f over n in [x,2x] coprime to d.
- **absolute value** around each d's term; sum over d (not sup).
- **bound:** x / log(x)^A for EVERY A > 0, constant depending on A and eps (and, implicitly, on the sequences'
  own implied constants — not stated).

**Definition 1 (Simplex subset T_k(delta,A,B,eps)), Definition 2 (Q(x;...,j,j',m,m',eps_0) and
Q*(x;delta,A,B,eps,eps_0) = union over j,j' in 1..n and m,m' in 0..floor(1/delta) of Q(...))**: Q is the set of
integers in [1,x] of the form e e' prod_{i<=m} f_i prod_{i'<=m'} f'_{i'} with log_x(f_1...f_m) <= (1-eps_0)B_{j,m},
log_x(f'_1...f'_{m'}) <= (1-eps_0)B_{j',m'}, log_x(f_1...f_m e) <= (1-eps_0)(A_j - eps),
log_x(f'_1...f'_{m'} e') <= (1-eps_0)(A_{j'} + eps), e e' x^delta-smooth, log_x(f_i), log_x(f'_i) >= delta.

**Definition 3 (Equidistribution for moduli corresponding to T_k).** "For any x>1, eps_0>0 and A>0, and for any a in
Z with (a,p)=1 for all primes p<=x, we have
  sum_{q in Q*(x;delta,A,B,eps,eps_0), q squarefree} | sum_{n in [x,2x], n = a (q)} f(n;x)
      - 1/phi(q) sum_{n in [x,2x], (n,q)=1} f(n;x) | <<_{A,eps_0} x/log(x)^A."
Same n-range, residue and main-term conventions as Definition 7; moduli are the squarefree elements of Q*.

**Definition 9 (Decomposition)** and **Proposition 2** are quoted in `Gap212HarmanReduction.source.md`.

---

## [1] D.H.J. Polymath, "New equidistribution estimates of Zhang type", arXiv 1402.0811v3

**Asymptotic notation (Definition 1.2, Section 1.3 "Basic notation").** "We use x to denote a large real parameter ...
we will implicitly assume that it is larger than any specified fixed constant. Some mathematical objects will be
independent of x and referred to as fixed; but unless otherwise specified we allow all mathematical objects under
consideration to depend on x ... X = O(Y) or X << Y if |X| <= CY for some fixed C ... We use X ≲ Y [lessapprox] to
denote the estimate X <= x^{o(1)} Y, X ~ Y to denote the estimate Y << X << Y ... If asymptotic notation such as O()
or ≲ appears on the left-hand side of a statement, this means that the assertion holds true for any specific
interpretation of that notation."

In my words: every statement is asymptotic in x ("for x large enough"), implied constants depend only on fixed
quantities and are uniform over everything that may vary with x (I, a, M, N, Q, the sequences). `~` here is
two-sided comparability (NOT asymptotic equality). `≲` allows an x^{o(1)} loss. A hypothesis written with `≲`
must be read for every admissible o(1) function.

**Basic notation.** "All sums and products will be over the natural numbers N := {1,2,3,...} unless otherwise
specified." **Discrepancy (eq. disc-def):** "For any function alpha: N -> C with finite support ... and any primitive
congruence class a (q), we define the (signed) discrepancy
  Delta(alpha; a (q)) := sum_{n = a (q)} alpha(n) - 1/phi(q) sum_{(n,q)=1} alpha(n)."
- **n-range:** ALL n in N (alpha has finite support). NOT [x,2x].
- **residue:** a primitive class mod q, i.e. (a,q)=1.

**Definition 2.1 (Multiple dense divisibility).** "(i) Every natural number n is 0-tuply y-densely divisible. (ii) If
i>=1 ... n is i-tuply y-densely divisible if, whenever j,k>=0 are natural numbers with j+k=i-1, and 1<=R<=yn, one can
find a factorisation n=qr, with y^{-1}R <= r <= R such that q is j-tuply y-densely divisible and r is k-tuply
y-densely divisible." D^{(i)}(y) is that set; D_I^{(i)}(y) = S_I ∩ D^{(i)}(y).

**Definition 2.2.** "S_I [is] the set of all squarefree natural numbers whose prime factors lie in I. If I is also a
bounded set ... P_I [is] the product of all the primes in I, thus ... S_I is the set of divisors of P_I."

**Definition 2.5 (Coefficient sequences).** "A coefficient sequence is a finitely supported sequence alpha: N -> R
(which may depend on x) that obeys |alpha(n)| << tau^{O(1)}(n) log^{O(1)}(x) for all n.
(i) ... located at scale N for some N>=1 if it is supported on an interval of the form [cN, CN] for some
1 << c < C << 1.
(ii) A coefficient sequence alpha located at scale N ... [has] the Siegel-Walfisz property, if
|Delta(alpha 1_{(.,r)=1}; a (q))| << tau(qr)^{O(1)} N log^{-A} x for any q,r>=1, any fixed A, and any primitive
residue class a (q).
(iii) ... shifted smooth at scale N ... alpha(n) = psi((n-x_0)/N) for some smooth psi supported on [c,C] for some
fixed 0<c<C ... |psi^{(j)}(x)| << log^{O(1)} x for all fixed j>=0 ... If we can take x_0=0, we call alpha smooth at
scale N."

**Definition 2.6 (Type I, II, III estimates).** Preamble: "Let 0<varpi<1/4, 0<delta<1/4+varpi, and 0<sigma<1/2 be
fixed quantities, and let i>=1 be a fixed natural number. We let I be an arbitrary bounded subset of R and define
P_I = prod_{p in I} p as before. Let a (P_I) be a primitive congruence class."
(i) Type_I^{(i)}[varpi,delta,sigma]: "for any I and a (P_I) as above, any quantities M,N >> 1 with MN ~ x and
x^{1/2-sigma} ≲ N ≲ x^{1/2-2varpi-c} for some fixed c>0, any Q ≲ x^{1/2+2varpi}, and any coefficient sequences
alpha, beta located at scales M,N respectively, with beta having the Siegel-Walfisz property, we have
  sum_{q<=Q, q in D_I^{(i)}(x^delta)} |Delta(alpha * beta; a (q))| << x log^{-A} x
for any fixed A>0."
(ii) Type_II^{(i)}[varpi,delta]: same, with "x^{1/2-2varpi-c} ≲ N ≲ x^{1/2} for some sufficiently small fixed c>0".
(iii) Type_III^{(i)}[varpi,delta,sigma]: "for any quantities M,N_1,N_2,N_3 >> 1 which satisfy MN_1N_2N_3 ~ x,
N_1N_2, N_1N_3, N_2N_3 ≳ x^{1/2+sigma}, x^{2sigma} ≲ N_1,N_2,N_3 ≲ x^{1/2-sigma}, for any coefficient sequences
alpha, psi_1, psi_2, psi_3 located at scales M, N_1, N_2, N_3, respectively, with psi_1, psi_2, psi_3 smooth, and
finally for any Q ≲ x^{1/2+2varpi}, we have sum_{q<=Q, q in D_I^{(i)}(x^delta)} |Delta(alpha*psi_1*psi_2*psi_3;
a (q))| << x log^{-A} x for any fixed A>0."

In my words, the [1] Type sums: **moduli** q <= Q (Q up to x^{1/2+2varpi+o(1)}), q squarefree with all prime
factors in I, and i-tuply x^delta-densely divisible; **residue** one class a mod P_I coprime to P_I (hence primitive
mod every such q); **n-range** all n (the convolution is supported near x at scale ~x, not cut to [x,2x]);
**bound** x log^{-A} x for every fixed A, for x large.
