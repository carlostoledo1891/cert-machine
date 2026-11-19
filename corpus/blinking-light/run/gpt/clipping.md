# A direct proof of the analytic bound

Let c=C1, q=C2, delta=c²-q>0 and g=sigma/r. For the target data, the following argument gives (239+166 sqrt(2))/2009 with no computation or auxiliary resolvent.

Use time units r=1. Let h and d be the half-sum and half-difference of Kf and K*f. With S and A the symmetric and skew parts of L, their generator equations are h-f=Sh+Ad and d=Sd+Ah. Let F(h)=sign(h)(|h|-s)_+ for a threshold s in [0,1]. Test the first equation against F(h) and the second against d. The symmetric terms on edge ij are -H[(Δh)(ΔF)+(Δd)²]/2, where H is the sum of the two stationary fluxes. Monotonicity of F makes the first term nonpositive. The skew terms sum to the current J against mid(h-F(h)) Δd by flow conservation. Since |h-F(h)|≤s, completing the square on each edge and using J log(x/y)≥2 J²/H gives

```
||d||² - <f-h,F(h)> <= s² g/4.                                       (1)
```

Fix m∈[0,1) and let s=1-2(sqrt(2)-1)(1-m). We claim (1-y)F(y)≤(y-m)² for -1≤y≤1. It is immediate for y≤s. For s<y<1 it is equivalent to s≥y-(y-m)²/(1-y). Setting t=1-y, the right side is 1+2(1-m)-2t-(1-m)²/t; its maximum is s by AM-GM. The endpoint y=1 is immediate. Oddness gives (f-h)F(h)≤(fh-m)².

Using <f,h>=c and ||h||²-||d||²=q, inequality (1) now gives

```
g >= 4[delta-(m-c)²] / [1-k(1-m)]²,       k=2(sqrt(2)-1).
```

At the target take s0=1-k(1-c) and m=c-k delta/s0, which lies strictly between 0 and 1. Substitution gives 4 delta/(s0²-k² delta)=(239+166 sqrt(2))/2009. The stronger computer-assisted result in potential-bound.md uses a second test function to shift part of the edge current term onto the available symmetric energy (Δh)(ΔF).
