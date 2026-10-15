# External arithmetic, entire tails, and exact representation checks

## A. Complete primary source reconstruction

The new audit_primary.py enumerates the smooth monoid using FOUR nested
prime-power loops, including1 exactly once, and tests rough support with
gcd(r,210)=1. For each product n=rs<=C it evaluates

 a_(rs)(t,X)=a_r(t,X)*a_s(t,X)*exp(t*log(r)*log(s)/2).

This identity follows by expanding(log r+log s)^2. It is not an
approximation or recursive definition. Arb384 encloses every operation.
An occupancy array rejects duplicates and omissions for ALL n=1..690988.
The same factorization simultaneously reconstructs the distinct745
aligned13/80 total and smooth core. Exact ratios and squared signed profiles
construct every v_r and v_*. The source weights are not reconstructed
from their already rounded56-bit cells.

Each true coefficient is rounded outward to the adjacent56-bit dyadic
cell, with unambiguous floor/ceil gated. The complete textual stream is
hashed in order; this matches the exact accepted767 and BOTH774 stream
hashes. The complete positive weights, including the synthetic weight,
are handled likewise. Full files need not ship: the streams are regenerated
LIVE and their hashes are authenticated by the banked frozen outputs.
Arb endpoint extraction yields exact rationals before any decimal or
integer operation; Arb nearest-mode printed digits never enter a gate.

For EVERY bin, the full exact positive weight sum is enclosed first and
then rounded to a100-bit dyadic cell. All224 cells, all exact counts,
minimum/maximum labels and sums agree with BOTH accepted bin files.
The secondary independently regenerates the integer metadata with wheel
residues and rational boundary bisection, not primary gcd/bit_length logic.
The primary's regenerated cells provide a COMPLETE reconstruction, not a
selection of controls standing in for omitted mass.

## B. Independent primary transport integral

Let f(v)=exp(a(log v)^2/4-(1/2+a*c(x))log v). Write l=log C,
h=log U-log C. With v=exp(l+h*z),

 integral_C^U f(v)dv
  =integral_0^1 h*exp((a/4)(l+h*z)^2+(1/2-a*c(x))(l+h*z)) dz.

The integrand is an ENTIRE exponential of a polynomial in complex z.
Therefore the Acb callback may ignore its analyticity flag safely: there
is no logarithm or square-root evaluation on a complex quadrature ball.
All parameter balls are already outward-real enclosures. Acb validated
integration encloses the ENTIRE integral; it is neither sampled quadrature
nor the producer's erfi antiderivative. Precision384 and tolerance2^-330
are implementation goals, not a justification to accept an unbounded
remainder. Finite-real enclosure and comparison are checked explicitly.

The primary uses the independently rebuilt unrounded complete bin sums
inside the recovering expression. Its interval lies INSIDE both producer
scalar enclosures for each of the277 original leaf/control/parent scalar
fields, and both original anchor lines. Exact head values0 and1/10 are
handled as exact algebra, not forced to reproduce harmless outward one-ULP
straddles. The gate>1/100 is strict on every accepted leaf.

## C. Independent secondary integral, with full infinite remainder

The new audit_secondary.py uses mpmath.iv at110 decimal digits. All inputs
are exact integers/rationals, or copied100-bit dyadic bin enclosures. Pi
is enclosed using exact alternating arctangent rational partial sums in
Machin's identity; it is not taken from the primary library. Both lines
have independent endpoint-to-Fraction and signed FLOOR/CEIL helpers.

For the same integral now write l=log C,u=log U,m=(l+u)/2,h=(u-l)/2,
A=a/4,B=1/2-a*c(x),E=A*m^2+B*m,P=(2*A*m+B)*h,Q=A*h^2. Then

 I=2*h*exp(E)*sum_(j,k>=0) P^(2*j)*Q^k /
                    ((2*j)! k! (2*j+2*k+1)).

Derivation: expand exp(P*z) and exp(Q*z^2) on[-1,1]. Odd powers cancel;
uniform absolute convergence permits termwise integration. All retained
even terms are nonnegative when Q>=0, including when P is negative.
Every target checks |P|<1 and0<=Q<1 by intervals. Truncating the double
sum to0<=j,k<=K=64 leaves a nonnegative remainder bounded by

 exp(|P|+Q) * (|P|^(2*K+2)/(2*K+2)! + Q^(K+1)/(K+1)!)
 <=9*(1/(2*K+2)!+1/(K+1)!).

Indeed the sum outside the rectangular index set is bounded by the union
of the j-tail and k-tail. For z>=0, the exponential tail beginning at n
is <=exp(z)*z^n/n!, since(n+i)!>=n!*i!. Also exp(|P|+Q)<exp(2)<9.
The latter follows from exp(1)<3 (the factorial series). Multiplying by
2*h*exp(E) supplies the ENTIRE upper error. This is a distinct symmetric
double-series organization, not the producer's degree100 recurrence.

At U=C the integral is EXACT0 with no limiting division. This formula
handles every accepted leaf, every original point control and every
rejected parent. It retains the same directed pairs except the algebraic
head1/10, whose exact value explains the producer's harmless straddle.
The independent iv bins are broader than the primary's unrounded ones;
we check rigorous interval overlap, directed pairs and positivity, not
false containment of a broader enclosure in a narrower one. The primary
separately establishes containment of every original audited field.

## D. Exact interfaces and adverse tests

Coverage is proved by two exact methods: event sweep of CLOSED real-index
leaves and disjoint half-open integer ownership with terminalH included.
The raw natural-wall formula proves the continuum RIGHT convention.
Integer-square rational side controls exercise that representation.
The count H-C=1609011 and complete entrant index sum are independently
regenerated. The positivity/decreasing-density/support assertions,
normalized support identity, source stability prerequisites and physical
REAL-gauge admission are separately challenged in controls.py.

No float is used in a gate. Runtime measurements, if retained, are only
local resource logs. Canonical mathematical outputs are deterministic and
recomputed in a source-only scratch copy. check.py authenticates all
inputs, asserts both COMPLETE outputs, compares them, checks domain and
proof bindings, and prints the final scoped audit summary. No outside
file or producer code is executed.
