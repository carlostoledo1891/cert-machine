# A faster auxiliary clock gives a universal lower bound

**Proved.** Let c=C1, q=C2, delta=c²-q>0 and g=sigma/r. For every t≥0 with t²<4(1+t),

```
g >= delta (1+t) [4(1+t)-t²] / [1+2ct+qt²].
```

At the target, t=19/10 gives **23171/242880 > 0.0954**. This bound applies to every finite stationary jump chain in the question. The auxiliary clock is an ingredient of the proof and requires no additional observations.

## Two bounds for one operator

Normalize r=1. Let lambda=1+t, P=(I-L/lambda)^(-1), S=(P+P*)/2, A=(P-P*)/2, B=(I+t(I-S))^(-1) and T=BA. Adjoint and norm always use the stationary law. The two operator bounds needed below are

```
||T|| <= 1/(2 sqrt(lambda)),       ||Tf|| <= sqrt(g)/(2 lambda).
```

For the first, the dissipativity of the jump generator gives ||Px||²≤<x,Px> by setting y=Px and using x=y-Ly/lambda. The same holds for the adjoint. Averaging P*P≤S and PP*≤S gives AA*≤S-S² and 0≤S≤I. Therefore TT*≤B(S-S²)B and the scalar inequality b(1-b)/(1+t b)²≤1/(4 lambda), 0≤b≤1, proves the claim. It follows by squaring 1-(t+2)b.

For the second bound, put w=Tf and e=<w,(I-S)w>. If w=0 there is nothing to prove. For each unordered pair oriented i→j, let J=pi_i P_ij-pi_j P_ji and H=pi_i P_ij+pi_j P_ji. The edge entropy G=sum J log[(pi_i P_ij)/(pi_j P_ji)] satisfies G≤g/lambda. In fact the stationary path law out to a fixed time s has KL divergence gs from its time reversal (the expected log ratio of jump rates and stationary endpoint probabilities). Mix the paths with an independent exponential time of mean 1/lambda and retain just the two endpoints. The log-sum inequality gives the bound. Zero-traffic edges are omitted and infinite entropy production is immediate.

Write R=<w,Af>=||w||²+t e. Divergence-free J yields two expressions for R, using the same edge orientation:

```
R = sum_same J f_i(w_i-w_j),
R = -sum_opposite J (w_i+w_j)(f_i-f_j)/2.
```

They follow from R=sum J(w_i f_j-w_j f_i)/2 by adding or subtracting the zero sum of J(w_i f_i-w_j f_j)/2. Here “same” and “opposite” refer to the two lamp signs. Put

```
U = sum_same H(w_i-w_j)^2/2,
V = sum_opposite H(w_i+w_j)^2/2.
```

Then U≤e, and U+V=<fw,(I-S)fw>≤||w||² because S≥0. The two expressions for R, Cauchy-Schwarz on their disjoint edge sets, and J log(x/y)≥2 J²/H give G≥R²(1/U+1/V). If either denominator vanishes then R=0, forcing w=0. With u=U/||w||² in (0,1) this gives

```
G >= ||w||² (1+t u)² / [u(1-u)] >= 4 lambda ||w||².
```

Together with G≤g/lambda this proves the second bound.

## Returning to the measured clock

Use the original one-sample resolvent K=(I-L)^(-1). Let h=(Kf+K*f)/2 and d=(Kf-K*f)/2. For u=Kf the identity lambda u=P(f+t u) follows by applying lambda I-L. For v=K*f use P* instead. Subtracting the two equations gives

```
d = T(f+t h).
```

Decompose h=c f+s. The real vector s is perpendicular to f, since <f,h>=c and ||f||=1. Write x=||s||². By q=<K*f,Kf>=||h||²-||d||², we have ||d||²=delta+x>0. Let n=d/||d|| and v=2 sqrt(lambda) T*n. By the two bounds, ||v||≤1 and y=|<v,f>|≤sqrt(g/lambda). Project v onto f and its orthogonal complement. Since c≥0 by generator dissipativity,

```
2 sqrt(lambda) sqrt(delta+x) <= (1+t c)y + t sqrt(x) sqrt(1-y²).
```

For a>b≥0, a sqrt(delta+x)-b sqrt(x)≥sqrt(delta)*sqrt(a²-b²), by Cauchy-Schwarz (or squaring). Use a=2 sqrt(lambda), b=t sqrt(1-y²). Rearranging gives

```
[(1+t c)²-delta t²] y² >= delta [4 lambda -t²].
```

The right side is positive, hence so is the bracket. Substitution of y²≤g/lambda finishes the proof. All constants at the target follow by rational substitution. This argument was derived independently and uses no numerical inequalities.
