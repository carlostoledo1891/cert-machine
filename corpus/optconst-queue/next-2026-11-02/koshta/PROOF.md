# C_1c ≥ 0.4103333: the argument

## The constant

$C_{1c}$ (constant 1c of T. Tao et al., *Optimization constants in mathematics*,
github.com/teorth/optimizationproblems) is the least constant $C$ such that

$$\min_{0\le t\le 1}\int_{\mathbb R} f(x)f(x+t)\,dx \;\le\; C\Big(\int_{\mathbb R} f\Big)^2$$

for every non-negative $f\in L^1(\mathbb R)$ [BS2020]. Hence any single admissible $f$ with $\int f>0$ gives

$$C_{1c}\;\ge\;\frac{\min_{0\le t\le 1}\int f(x)f(x+t)\,dx}{(\int f)^2}. \tag{1}$$

## The function

Take $K = 24576$, $n = 24592$, and the non-negative integers $w_0,\dots,w_{n-1}$ listed in
`K24576_0.4103333.json` (key `weights_int`). Put

$$f=\sum_{i=0}^{n-1} w_i\,\mathbf 1_{[i/K,(i+1)/K)} .$$

It is non-negative, bounded and compactly supported, so $f\in L^1$, and $\int f = S/K$ with $S=\sum_i w_i>0$.

## Lemma (equal steps make the autocorrelation piecewise linear)

Let $A_k=\sum_{i=0}^{n-1-k} w_i w_{i+k}$ for $k\ge 0$, with $A_k = 0$ when $k\ge n$. For $t=(k+\theta)/K$ with an
integer $k\ge0$ and $\theta\in[0,1]$,

$$\int f(x)f(x+t)\,dx=\frac{(1-\theta)A_k+\theta A_{k+1}}{K}.$$

*Proof.* For $x$ in cell $i$, i.e. $x\in[i/K,(i+1)/K)$, the point $x+t$ runs over $[(i+k+\theta)/K,(i+k+1+\theta)/K)$. That
interval meets cell $i+k$ in length $(1-\theta)/K$, meets cell $i+k+1$ in length $\theta/K$, and meets no other cell.
Summing $w_i w_j\cdot(\text{overlap})$ over $i$ gives the formula. $\square$

This is the argument in the proof of [K2021, Thm 3.1].

So on each interval $[k/K,(k+1)/K]$ the autocorrelation is linear in $t$, and its minimum there is at an
endpoint. Together these intervals cover $[0,1]$ for $k=0,\dots,K-1$, so

$$\min_{0\le t\le1}\int f(x)f(x+t)\,dx=\frac1K\min_{0\le k\le K}A_k,$$

and by (1)

$$C_{1c}\;\ge\;\frac{K\min_{0\le k\le K}A_k}{S^2}. \tag{2}$$

## The computation

The right side of (2) is a finite computation in integers. For the certificate it equals

$$\frac{134648548624804778248790016}{328144294688458468928334649}=0.4103333527484933395\ldots,$$

and the minimum is at $k=21264$. Each checker in this repository computes this independently:

- `verify.py` computes all $A_k$ at once, exactly, by Kronecker substitution. With byte-aligned slots of width
  $2^{8b}>n\max_i w_i^2\ge A_k$, it sets $P=\sum_i w_i2^{8bi}$ and $Q=\sum_j w_{n-1-j}2^{8bj}$. Slot $n-1+k$ of
  the exact integer product $PQ$ is $A_k$, and no carries occur because every coefficient is below $2^{8b}$.
  With `--direct` it also sums every $A_k$ term by term.
- `verify_independent.py` was written separately, from the definition and the format only. It uses the same
  substitution, plus two redundancy checks: $\sum_m c_m=S^2$, and a direct recomputation of $A_{k^*}$.
- `score_exact.py` splits each weight into 15-bit limbs and correlates them in int64 with numpy.

## Comparisons (exact, in integers)

Let $p/q$ be the fraction above.

- **It beats the previous bound [R2026]**, $21072342208353792/51354782902387969$: the cross-difference
  $p\cdot 51354782902387969-21072342208353792\cdot q$ is positive. It equals
  $78111354391070300258050966852881578496$, so the gain is $4.6352\times10^{-6}$.
- **Seven-digit value:** $10^7p\ge 4103333\,q$ and $10^7p<4103334\,q$, so $p/q\in[0.4103333,0.4103334)$ and
  $C_{1c}\ge 0.4103333$.
- **Kravitz's $\tau$** [K2021]: $\tau=C_{1c}^{-1/2}$, and $156111^2\,p\ge10^{10}q$, so $\tau\le 1.56111$.

## References

- [BS2020] R. C. Barnard, S. Steinerberger, *Three convolution inequalities on the real line with connections to
  additive combinatorics*, J. Number Theory 207 (2020), 42–55. arXiv:1903.08731.
- [K2021] N. Kravitz, *Generalized difference sets and autocorrelation integrals*, arXiv:2004.06611.
- [R2026] rozetyp, *A lower bound for the Barnard–Steinerberger autocorrelation constant*,
  github.com/rozetyp/barnard-steinerberger-lower-bound, commit `19f3971`.
