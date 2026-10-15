# FOUNDATION — EXTERNAL_GRAM_SPATIAL_RECOVERY_AUDIT

## 0. Exact object, novelty and quantifiers

This is an EXTERNAL record-use audit of EXACT memory774
GRAM_SPATIAL_RECOVERY (ladder_astra-s26), frozen at snapshot791. Its producer
is ladder_astra; this auditor is functional_astra and produced neither767
nor774. We retain source767, whose complete phase proof is independently
audited in789. We do NOT repeat that phase-tree audit,786's global
composition audit, or782/788's continuation. The new contribution is an
independent proof, all-bin/all-leaf arithmetic, and boundary audit of774,
not another claim to its already banked exterior region. In particular the
s26 rejected weaker exterior is not resubmitted.

Write

 a=4/25, b=3/16, X=6000000185827, C=690988,
 H=2299999, W=66476100549959, delta=1/10,
 c(x)=log(sqrt(1+x^2)/(4*pi))/4-1/(2*(1+x^2)),
 a_n(t,x)=exp(t*log(n)^2/4-(1/2+t*c(x))*log(n)),
 A_(t,x,K)(z)=sum_(n=1)^K a_n(t,x) z^v(n).

Coordinates are EVERY prime through K; v(n) is the actual valuation vector,
not independent composite phases. The exact audited finite conclusion is:
for EVERY real t in CLOSED[a,b], EVERY real x in CLOSED[X,W], y=0, and
EVERY z in the CLOSED full-prime unit polydisc, with the NATURAL RIGHT index

 N=floor(sqrt(x/(4*pi)+t/16)),

one has C<=N<=H and |A_(t,x,N)(z)|>1/100. With the banked REAL-gauge lift738,
externally audited754, this excludes simultaneous H_t(x)=H_t'(x)=0 there.
The lower spatial endpoint, BOTH time endpoints, and EVERY internal RIGHT
wall are included. The terminal wall entering2300000 is excluded. W is
inside the H cell throughout the band and is the CLOSED tail729 seam.
This audit neither proves that tail nor substitutes real-axis simplicity
for the separate all-complex stall tail. It is not an official checker
receipt, physical COVER export, candidate acceptance or new Lambda bound.
Local theorem is RH-free. Eventual initialization alone uses PT2021
T=3000175332800, required INITIAL X/2=6000000185827/2, exact margin350479773/2,
with anchorV1-H-213. No new RH computation occurs.

## 1. Complete source and the indispensable stronger hypothesis

Let S consist of all integers smooth over2,3,5,7 and let R consist of all
r<=C coprime to210. UNIQUE n=rs partitions EVERY integer1..C. Define

 F_r(z)=sum_(s in S,rs<=C) a_(rs)(a,X) z^v(s), F_*=delta.

Let P_r=F_r(1,1,1,1), M_r=F_r(-1,-1,-1,-1), and for r>1 or r=*,

 v_r=sqrt((8/9)(P_r/P_1)^2+(1/9)(M_r/M_1)^2),
 V=v_*+sum_(r>1)v_r, w_r=v_r/V.

For the synthetic fibre P_*=M_*=delta. Both denominators are positive;
all v_r and all w_r are positive, and sum w_r=1. Source767 proves the
STRONG inequality

 |F_1|^2 > delta^2/w_* + sum_(r>1)|F_r|^2/w_r                 (G)

on the ENTIRE distinguished smooth torus. Its positive Fourier form is
|E|^2 times this difference: positivity establishes E!=0 BEFORE division.
No stability of E is assumed. The phase proof behind(G) is consumed as a
banked premise, not inferred from its scalar consequence |A|>delta, from
hashes, or from our selected controls. A scalar modulus floor by itself
would not identify this weighted vector inequality.

Source767 additionally proves full-prime-torus nonvanishing. X has natural
index C at time a, checked by exact wall signs below. General720, audited733,
therefore supplies closed full-polydisc stability. Setting every rough
prime variable to0 leaves precisely F_1, proving F_1 zero-free on the
closed smooth polydisc. This is the ONLY natural-index stability invocation;
it is never applied to a future oversized base cutoff. Compactness and
continuity provide a zero-free neighborhood, so every quotient below is
holomorphic near the closed smooth polydisc.

## 2. Independent universal support-function proof

We audit the following exact universal statement, including all degenerate
cases. Let d>=0 and a FINITE set J (possibly empty) be given. Let F_0,F_j
be finite complex polynomials in d variables, F_0 nonzero throughout the
CLOSED unit polydisc. Let delta>0, weights w_*>0,w_j>0 with
w_*+sum_J w_j=1, and fixed real labels r_j>1. Suppose(G), with0 replacing1,
holds STRICTLY at EVERY point of the distinguished torus. For EVERY s>=0,
EVERY inward point (p_i^(-s)z_i), where p_i>1 and |z_i|<=1, and EVERY
independent complex multiplier eta_j with |eta_j|<=1,

 |F_0(p^-s z)+sum_J r_j^-s eta_j F_j(p^-s z)|
   > delta*sqrt((1-sum_J w_j r_j^(-2s))/w_*).               (U)

This includes d=0, J empty, s=0 and arbitrary zero values of individual
F_j. The hypothesis delta>0 and the normalized synthetic weight are
essential. The conclusion is strict, not equality, because(G) is strict.
The function on the right is strictly increasing in finite s if J is
nonempty, and constant delta if J is empty. This concerns the SUFFICIENT
expression only; no physical infimum is claimed to increase.

Proof without an assumed multivariable vector maximum principle: for each
CONSTANT unit complex vector u, the scalar function
u^*(F_j/(sqrt(w_j)F_0),delta/(sqrt(w_*)F_0)) is holomorphic. Compactness of
the torus and(G) give a common bound eta<1 for the vector norm. Iterated
one-variable maximum modulus gives the same bound for every such scalar
function on the closed polydisc. At each particular point choose its
unit dual vector only AFTER this universal assertion. Then the vector
norm is <=eta<1 everywhere. There is no holomorphic phase optimization.

At the inward point put b0=|F_0|, h=delta/sqrt(w_*),
z_j=|F_j|/sqrt(w_j), d_j=sqrt(w_j)r_j^-s, q=sum d_j^2<1.
The vector statement implies b0>sqrt(h^2+sum z_j^2). Ordinary real Cauchy
in the EXTRA synthetic coordinate gives

 h*sqrt(1-q)+sum d_j z_j
 <=sqrt((1-q)+sum d_j^2)*sqrt(h^2+sum z_j^2)<b0.

Subtract the rough envelope and apply reverse triangle to prove(U).
If J is empty, this is b0>delta; if all F_j vanish, the same argument
applies without dividing by their norm. Thus a q=0 exceptional branch
cannot lose strictness. This proof is independent of774's calculus
minimization. The equivalent scalar identity

 (B-sqrt(q)*sqrt(B^2-k))^2-k*(1-q)
       =(sqrt(q)*B-sqrt(B^2-k))^2>=0

for B>=sqrt(k)>0 and0<=q<1 separately corroborates the optimizer and its
sign, but is not needed for the strict support proof.

For our weights the squared bound simplifies exactly to

 delta^2 * (1+sum_(r>1) v_r*(1-r^(-2s))/v_*).              (R)

The derivative of the added sum is sum 2*v_r*log(r)*r^(-2s)>0,
so strict increase holds since actual rough fibres exist. No rescaling of
source weights, dropping the synthetic component, or scalar-source
substitution is permitted.

## 3. Exact spatial identity, complete positive bins, complete entrants

At FIXED time a,

 a_n(a,x)=a_n(a,X)n^-s, s=a(c(x)-c(X)).

Direct differentiation gives c'(x)=x/(4(1+x^2))+x/(1+x^2)^2>0 for x>0.
Thus x>=X means s>=0, the smooth substitution is inward, and rough
multipliers have modulus <=1. This proves applicability of(U) to the
complete OLD polynomial with cutoff C, not to an already enlarged cutoff.

A bin with exact minimal rough label rho and total mass V_g has
sum_(r in bin)v_r(1-r^-2s)>=V_g(1-rho^-2s). Every factor is nonnegative.
Consequently the sum over ALL224 bins gives a conservative lower moment;
using the MAXIMUM label would give the wrong direction. The synthetic
mass is separate and never contracted as though it had a nonunit label.
The audit regenerates every positive weight and bin, including counts,
index sums and extrema. The independent arithmetic is specified in
ARITHMETIC.md; hashes compare complete streams, not samples.

For each ORIGINAL CLOSED index interval[L,U] from774 define
x_L=X when L=C and x_L=4*pi*(L^2-b/16) otherwise, s_L=a(c(x_L)-c(X)).
Every physical target with natural K in[L,U] has
x>=4*pi*(K^2-t/16)>=4*pi*(L^2-b/16), hence x>=x_L. Spatial recovery at x_L
underestimates recovery at x. All entrants C<n<=K, including smooth n,
are bounded by

 sum_(C<n<=K) a_n(a,x) <= integral_C^U a_v(a,x_L) dv.     (E)

The proof checks that a_v decreases on[C,U]: its derivative with respect
to log v is -1/2+a(log v/2-c(x_L)), increasing in v and negative at U.
Thus each a_n(a,x_L)<=integral_(n-1)^n a_v(a,x_L)dv. The lower endpoint C,
not C+1, is necessary. Every one of H-C=1609011 possible entrants is
charged; their mass is bounded analytically rather than sampled. A
positive complete count alone would not establish(E); the monotonicity
and entire integral do.

Taking the recovered old floor minus(E) first proves a positive
full-polydisc floor for A_(a,x,K) at the ACTUAL target x and FIXED K.
The 14 original leaves all retain>1/100. We re-evaluate even the13 rejected
parent nodes as arithmetic controls; these failed sufficient expressions
are NOT counterexamples to the polynomial. No new phase tree or tuned
index partition is used. The minimum is derived over all14 sufficient
expressions, is unique at[1897746,2098872], and has FLOOR12 0.011185589489,
CEIL12 0.011185589490. It is NOT a physical or torus infimum.

## 4. Forward heat only AFTER paying entrants

At each fixed target x,K the preceding positive floor supplies stability
at time a, including the case K>N(a,x). With logarithmic prime weights
the ACTUAL supported degree is log K. Both lines check
4*c(x_L)>log U>=log K. GENERAL744 (externally audited754) therefore
preserves the SAME lower norm at every t>=a under the coefficient
multiplier exp((t-a)(log(n)^2/4-c(x)log(n))). This is exactly the change
from A_(a,x,K) to A_(t,x,K). It includes both endpoints of[a,b].
Neither natural-index stability nor forward heat alone pays newly
introduced coefficients. Reversing this order is an invalid inference.
The use of744's GENERAL finite-support theorem, rather than its shorter
illustrative first-halo corollary, is explicit.

## 5. Continuum coverage, all RIGHT walls, physical adoption

Let W_j(t)=4*pi*(j^2-t/16). Algebra gives

 W_(j+1)(t)-W_j(t)=4*pi*(2*j+1)>0,
 dW_j/dt=-pi/4,
 W_j(t)/(4*pi)+t/16=j^2.

Therefore the natural cell is LEFT-CLOSED/RIGHT-OPEN[W_j(t),W_(j+1)(t)),
and exactly at W_j(t) the index is j. These identities cover EVERY internal
wall and EVERY intermediate real t; the finite wall controls are not a
surrogate continuum proof. Both arithmetic lines re-evaluate

 W_C(a)<X<W_(C+1)(b), W_H(a)<W<W_(H+1)(b).

Thus throughout the closed physical rectangle C<=N<=H, W belongs to
predecessor H, and the terminal2300000 wall is strictly outside it. The
closed index leaves meet at common endpoints; an exact event sweep and a
separate half-open integer-ownership census prove their full union. The
finite rectangle meets729's stated CLOSED seam at W but makes no tail
assertion. No forward-time initial RH height is silently increased to W.

At all these natural physical points738/754 licenses the COMPLETE
full-torus modulus floor1/100 using the balanced REAL-gauge errors710/725,
p=1/800000,q=1/25000+1/40000000000, first moment<200,ell<30,gap>12.
No complex derivative charge is substituted. The exact correction is

 Q(r)=12r^2-(30p+q)r-400p-pq,
 Q(1/100)=22375198391999/32000000000000000>1/2000.

Q is increasing for r>=1/100, checked rationally. A true value-and-real-
derivative double zero would force the corrected Hermitian real part to
vanish, contradicting this reserve. Those error/cap theorems remain banked
inputs; this audit verifies the matching premise and exact admission.

## 6. Rigor ladder, dependencies and scope

Rung(a): the new actual coefficient path reproduces accepted745's distinct
aligned13/80 regime, and every767 raw/weight cell at4/25. The SAME new
transport functions reproduce767's head-interface fields and729's far-seam
fields, explicitly compared with each original frozen artifact. These are
arithmetic anchors, not a claim to re-prove their whole theorems.

Rung(b): this zero-producer-code external proof of the universal ball/
support step and complete new arithmetic audit exercise what anchors alone
cannot: positivity recovery with EVERY positive bin and synthetic mass,
ALL14 original leaves, complete entrant control, transfer order and domain
walls. Primary arithmetic uses Arb384 factorized coefficients and entire
Acb quadrature, rather than either producer coefficient/transport helper.
Secondary transport uses mpmath real intervals at110 decimal digits, exact
Machin pi and an independently derived symmetric double series with its
ENTIRE omitted tail. It imports neither producer nor primary code. The
secondary consumes the authenticated100-bit complete bins independently
reconstructed by the primary; it is not a second independent source-phase
proof. Primary shares the standard Arb library with the producer; this is
disclosed, not advertised as independent libraries for source production.

INPUT_ORIGINS.json and CITATIONS.json identify immutable copied banked
inputs and exact fact texts. No checker reads another workspace, and no
producer executable/module or third-party code is shipped or executed.
Source-phase provenance is767/789; natural stability720/733; fixed-cutoff
heat744/754; physical lift738/754 with710/725; tail729 is a seam anchor
only. Kornaus PR180 receives architecture credit, never dependency status.
External audit success, if independently verified, retires only774's
recovery audit item. It does not approve a record package or silently
extend this audit to782,788,790,786 or791.
