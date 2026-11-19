# A joint resolvent estimate for entropy production

**Theorem (proved).** Write c=C1, q=C2, delta=c²-q>0. In every finite stationary jump chain with the stated binary lamp and Poisson sampling, set g=sigma/r. For t≥0, lambda=1+t and t²≤4 lambda,

```
g >= 4 delta lambda² / [(1+t c)² - 4 lambda delta].
```

In particular t=2+2 sqrt(2) gives at c=3/10, q=2/25

```
g >= (17+12 sqrt(2))/(79+46 sqrt(2))
   = (239+166 sqrt(2))/2009 > 0.2358.
```

## Current and resolvent

Scale rates by r so the clock rate is one. All norms and adjoints use the stationary law. States of zero stationary mass can be discarded. Infinite entropy production is immediate, and g=0 forces detailed balance and delta≤0. Write A0=(L-L*)/2 and E(v)=-<v,Lv>. For real v,w,

```
|<v,A0 w>|² <= g ||w||_infinity² E(v).                         (1)
```

For verification, orient each edge i→j, put x=pi_i L_ij, y=pi_j L_ji, J=x-y, H=x+y. Stationarity gives <v,A0 w>=sum J(v_i-v_j)(w_i+w_j)/2, since the sum of J(v_i w_i-v_j w_j) vanishes. Now use Cauchy-Schwarz, E(v)=sum H(v_i-v_j)²/2, and J log(x/y)≥(5/2)J²/H on every edge, so (1) holds with 4g/5 in place of g.

Use a faster resolvent P=(I-L/lambda)^(-1) with symmetric and skew parts S,A. Define B=(I+t(I-S))^(-1), T=BA. Both P and P* are Markov operators. For arbitrary z the two resolvent identities

```
A = P A0 P* / lambda = P* A0 P / lambda
```

allow (1) to be applied twice. Since ||P f||_infinity and ||P*f||_infinity are at most one, averaging the two estimates gives

```
(lambda/g) |<z,Af>|²
 <= <z,Sz> - (||Pz||²+||P*z||²)/2
  = <z,S(I-S)z> - ||Az||².                                    (2)
```

Indeed E(Pz)=lambda(<z,Sz>-||Pz||²), and the same identity holds for P*z, using the generator L*. These identities also imply 0≤S≤I. For a unit vector n let Z=2 sqrt(lambda) T*n. Substitute z=Bn into (2). Because B commutes with S and A*=-A, this gives

```
||Z||² + (lambda/g)|<Z,f>|² <= 1.                              (3)
```

Here 4 lambda B S(I-S)B≤I is exactly 4 lambda b(1-b)≤(1+t b)² with b=1-S in scalar spectral coordinates. Subtracting the left side from the right yields (1-(t+2)b)².

## The two observations

Let K=(I-L)^(-1), h=(Kf+K*f)/2 and d=(Kf-K*f)/2. Then <f,h>=c, ||f||=1 and <K*f,Kf>=q. Write h=cf+s with s perpendicular to f, and put x=||s||². In particular ||d||²=delta+x. The identity lambda Kf=P(f+t Kf), and the adjoint version, give d=T(f+t h) by subtraction.

Take n=d/||d|| in (3). In the direction f, (3) weights the squared projection of Z by 1+lambda/g. In the perpendicular subspace the weight is one. Weighted Cauchy-Schwarz therefore gives

```
4 lambda (delta+x) = <Z,(1+t c)f+t s>²
                   <= (1+t c)² g/(g+lambda) + t² x.
```

For t²≤4 lambda, dropping (4 lambda-t²)x from the left yields the theorem after rearrangement. The resulting denominator is strictly positive by the same inequality and delta>0. At t=2+2 sqrt(2) the coefficient of x is zero. The proof is analytic and uses no finite computation.

I derived (2) by combining the two original-generator current estimates. The basic inequality (1) was also independently derived by the Claude track.
