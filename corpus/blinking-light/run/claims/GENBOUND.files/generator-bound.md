# A generator lower bound for Poisson snapshots

**Proved.** Write `c=C1`, `q=C2` and `delta=c²-q>0`. For a finite stationary jump chain and a lamp taking values in `{-1,1}`,

```
sigma/r >= 4 delta / (1 - sqrt(delta)/2)^2.
```

At the target the right side is exactly **16/361**. The simpler bound `4 delta` follows by using the identity test function in the proof.

## Resolvent and currents

Measure time in mean sampling intervals. With dimensionless generator L, write K=(I-L)^(-1), and use the stationary inner product and its adjoint *. Let S=(L+L*)/2, A=(L-L*)/2, u=Kf, v=K*f, h=(u+v)/2 and d=(u-v)/2. Both resolvents are Markov operators, so |h_i|+|d_i|≤1. Subtract their equations to obtain

```
(I-S)d = A h.
```

The snapshot identities give q=<u,v>=||h||²-||d||² and <f,h>=c. As ||f||=1, a=||d||²≥delta.

Orient each unordered edge i→j arbitrarily. Put x=pi_i L_ij, y=pi_j L_ji, T=x+y and J=x-y. Edges of zero traffic can be omitted and infinite entropy production already satisfies the claim. Discard states of zero stationary probability. Stationarity says that the signed current has zero divergence, including in a reducible chain. In particular, for any test w,

```
<w,A h> = sum_edges J (h_i+h_j)/2 (w_i-w_j).
```

Indeed the original summand is J(w_i h_j-w_j h_i)/2 and the difference sums to zero by stationarity. Also <-S d,w>=sum_edges (T/2)(d_i-d_j)(w_i-w_j).

## A test adapted to the bounded lamp

Set phi(z)=z/(1-|z|/2)^2, w_i=phi(d_i), and let m be the nonnegative divided difference of phi at d_i,d_j (the derivative when they coincide). Every edge satisfies

```
m ((h_i+h_j)/2)^2 <= 1.
```

To check this, put s=|d_i|, t=|d_j|. The absolute midpoint of h is at most 1-(s+t)/2. If the d values have the same sign, the divided difference is (1-st/4)/[(1-s/2)^2(1-t/2)^2]. Use 0≤1-(s+t)/2≤(1-s/2)(1-t/2). With opposite signs, the slope is the weighted average of (1-s/2)^(-2) and (1-t/2)^(-2), with weights s and t. Both are at most (1-(s+t)/2)^(-2) whenever s+t<2. At s+t=2 the h midpoint is zero.

Test (I-S)d=A h against w. Completing a square on each edge, with H=(h_i+h_j)/2 and t=d_i-d_j, gives

```
<d,phi(d)> = sum_edges m (J H t - T t²/2)
           <= sum_edges m J² H²/(2T)
           <= sum_edges J²/(2T)
           <= (sigma/r)/4.
```

The last step uses (x-y)log(x/y)≥2(x-y)²/(x+y). Finally, z↦z/(1-sqrt(z)/2)^2 is increasing and convex on [0,1], for instance by its series with nonnegative coefficients in powers z^(1+k/2). Jensen therefore gives <d,phi(d)>≥a/(1-sqrt(a)/2)^2. Substitution of delta completes the proof.

This proof uses no finite computation. I derived it from the generator identity above.
