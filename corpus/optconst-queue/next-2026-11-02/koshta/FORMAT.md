# C1c certificate format and exact scoring rule

Constant (teorth/optimizationproblems, `constants/1c.md`): $C_{1c}$ is the least $C$ with
$\min_{0\le t\le 1}\int_{\mathbb R} f(x)f(x+t)\,dx \le C\,(\int f)^2$ for all non-negative $f\in L^1(\mathbb R)$.
Any admissible $f$ gives the lower bound $C_{1c} \ge \min_{t\in[0,1]} \int f(x)f(x+t)dx / (\int f)^2$.

## File

A JSON object with (at least) these keys:

- `K`: a positive integer (the grid is $1/K$).
- `weights_int`: a list of $n \ge 1$ non-negative integers $w_0,\dots,w_{n-1}$, not all zero. JSON integers
  only (no floats, no strings); there is no size limit on the integers.

Other keys (`note`, `score_num`, ...) are ignored by the scorer.

The function is $f=\sum_{i=0}^{n-1} w_i\,\mathbf 1_{[i/K,(i+1)/K)}$, supported in $[0, n/K)$.
An end-refined grid is written in this same format: a grid that is finer near one end is an equal-step
function at the finer $K$ whose weights repeat in runs elsewhere.

## Score

Let $S=\sum_i w_i$ and, for $0\le k\le K$, $A_k=\sum_{i=0}^{n-1-k} w_i w_{i+k}$ (an empty sum is $0$, so
$A_k=0$ when $k\ge n$). The score is the rational number

$$\mathrm{score} = \frac{K\cdot\min_{0\le k\le K} A_k}{S^2},$$

computed exactly in integer arithmetic (reduce the fraction or compare by cross-multiplication; never
through floating point). The certificate proves $C_{1c}\ge\mathrm{score}$.

**Why this is exact.** For $t=(k+\theta)/K$ with integer $k\ge 0$ and $\theta\in[0,1]$, cell $i$ of $f$ meets
cell $i+k$ of $f(\cdot+t)$ in length $(1-\theta)/K$ and cell $i+k+1$ in length $\theta/K$, and no other cell.
So $\int f(x)f(x+t)\,dx = \frac1K\big((1-\theta)A_k+\theta A_{k+1}\big)$ is linear in $t$ between consecutive
multiples of $1/K$, and its minimum over $t\in[0,1]$ is $\frac1K\min_{0\le k\le K}A_k$. With
$\int f = S/K$ the ratio is $K\min_k A_k/S^2$. (Same argument as Kravitz, arXiv:2004.06611, Thm 3.1.)

## Reference scorer

`score_exact.py <file>` prints the exact fraction and the minimising $k$. It splits each weight into 15-bit
limbs and forms every limb-pair correlation with int64 `numpy.correlate` (each entry is below
$n\cdot 2^{30}<2^{63}$), then recombines with Python integers. An independent verifier should not reuse it.

Calibration: rozetyp's `certificate.json` (github.com/rozetyp/barnard-steinerberger-lower-bound @ `19f3971`,
SHA-256 `62ac49dd…1fd0e`) scores exactly $21072342208353792/51354782902387969 = 0.41032871754918741\ldots$
at $k=4665$, matching the listed $0.4103287$.
