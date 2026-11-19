# A certified lower bound from two piecewise linear functions

**Theorem.** Every finite stationary jump network with Poisson snapshot correlations c=3/10 and q=2/25 has

```
sigma/r >= 64/245 = 0.261224489795918…
```

The proof uses an analytic edge inequality and a finite rational certificate for two scalar test functions. Run `python3 -B verify_potential.py potential-refined.json 147/1000` in this folder. The checker uses only the Python standard library and verifies 1,651 boxes of arguments of the test functions. Its number of boxes is independent of the network.

## The reduction

Scale time to r=1, write g=sigma/r, K=(I-L)^(-1), S=(L+L*)/2 and A=(L-L*)/2. All norms and adjoints refer to the stationary law. Write h=(Kf+K*f)/2 and d=(Kf-K*f)/2. Markov contraction gives |h_i|+|d_i|≤1. The resolvent equations give h-f=Sh+Ad and d=Sd+Ah. We also have <f,h>=c and ||h||²-||d||²=q.

Let a(h), b(h) be the continuous odd piecewise linear functions specified by the three rational arrays h,a,b in potential-refined.json. Values between listed nonnegative knots are linearly interpolated. The function a is nondecreasing. We will check two properties. With m=7/25 and Gamma=147/1000, they are

```
(1-y) a(y) <= (y-m)²                                      for -1<=y<=1,       (1)

[(mid(b-a)) Δd - (mid d)(Δh-Δb)]² <= Gamma [Δd²+Δh Δa]                       (2)
```

on every oriented edge between any two points in |h|+|d|≤1. Here Δ denotes the first endpoint minus the second and mid denotes their arithmetic mean.

Test the two generator equations against a(h) and d respectively, and add. Orient each unordered edge arbitrarily and let J be its stationary current and H its total traffic. The symmetric part contributes -H(Δd²+Δh Δa)/2. The skew part, after summing over all edges, is the sum of J mid(h-a) Δd. Indeed <d,Ah>=sum J(mid h)Δd, while <a,Ad>=-sum J(mid a)Δd, by stationarity. Subtract the zero sum of J Δ[(h-b(h))d] to obtain J times the expression inside square brackets on the left of (2).

Writing D=Δd²+Δh Δa≥0, completing a square now gives

```
<d,d> - <f-h,a(h)> <= sum_edges [|J|sqrt(Gamma D) - H D/2]
                      <= sum_edges Gamma J²/(2H) <= Gamma g/4.
```

In the last inequality each positive-traffic edge with forward and reverse flux x,y contributes (x-y)log(x/y)≥2(x-y)²/(x+y) to g. Omit zero-traffic edges. Infinite entropy production is immediate. By oddness, (f-h)a(h)=(1-fh)a(fh)≤(fh-m)². The left side of the displayed bound is therefore at least ||d||²-||h-mf||²=2mc-m²-q=6/625. The result follows.

## How to check the two properties on a continuum

For negative y, (1) follows from a(y)≤0. On each positive linearity interval, the difference of its right and left sides is a convex quadratic. Test both endpoints and its vertex projected onto the interval.

For (2), use h,k for the two h values. Write H0=h-k, A0=a(h)-a(k), W=H0-b(h)+b(k), M=mid(b-a), and D0=1-(|h|+|k|)/2. Then |mid d|≤D0. Cauchy-Schwarz shows that it suffices to check

```
M² + D0² W²/(H0 A0) <= Gamma.                               (3)
```

When H0 A0=0 the certificate checks W=0 and uses zero for the ratio at that point. Treat each pair of sign and linearity intervals as a rectangle. On a rectangle of ordered intervals, H0,A0 have common fixed sign. The maximum of W²/(H0 A0) is bounded by the maximum of its four corner values, denoted U. To see this, take any convex combination of corners giving the point. At each corner |W|≤sqrt(U) sqrt(|H0||A0|). Use the triangle inequality followed by Cauchy-Schwarz on the convex combination. All three quantities W, |H0| and |A0| interpolate affinely here. For points in the same linearity interval, W, A0 are fixed multiples of H0 throughout, so the ratio is constant off the diagonal. This also covers rectangles crossing the diagonal during subdivision. If a is flat, the certificate requires W=0.

On each rectangle, M and D0 are affine. The convex quadratic M²+D0² U is thus bounded by its maximum over the four corners. The checker accepts the rectangle if this maximum is at most Gamma, and otherwise bisects one coordinate. All accepted leaves cover their parent rectangles. All computations, including the bisections, are exact fractions. The numerical search used to select the two functions plays no part in the proof.

The identities for h,d also follow from the other track's independently derived generator equations. The choice of test functions, the subtraction of the edge potential, and the certificate were derived here.
