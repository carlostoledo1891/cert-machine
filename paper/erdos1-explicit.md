# Erdős problem 1, made explicit

**Status (2026-09-15, ported to cert-machine the same night):** BUILT AND VERIFIED. The bench built eight certificates; this repository re-verified every one from the certificate file alone (`certs/erdos1/verify-*.log`; the bench's own logs are kept beside them) and built four more: the smallest set below Bohman is now **n = 1,701 at N/2^n = 0.217967** (tilt 3/5, d = 81, k = 21; k = 20 lands at 0.220057, above by the width of the buffer), and the two-level tilted lattices at d = 441 (α = 3/4, b = 21: 0.172386 at n = 12,348) and d = 961 (α = 4/5, b = 31: 0.159783 at n = 28,830) reach what Bloom's gadget reaches only at d = 729 and 1331. Headline unchanged: tilt 11/20, b = 13, s = 3 (d = 2197) gives N/2^n = 0.145269 at n = 79,092, 34.0% below Bohman, and C_2197 ≥ 3.4419. A d = 3375 instance (α = 3/5, b = 15, s = 3; Δ_s = 0.2734) was built here and verified on 2026-09-16 (k = 36): **n = 121,500 at N/2^n = 0.136855, 37.7% below Bohman**, the headline now; C_3375 ≥ 3.65. Which instances are verified on this machine, and the exact numbers, are in `certs/erdos1-ledger.json`; the page is `reports/erdos1.html`, the paper `paper/erdos1-explicit.pdf`.

## 1. The problem and the state of play

Erdős's first problem (1931, $500): if $A \subseteq \{1,\dots,N\}$ has $|A| = n$ and all $2^n$ subset sums are distinct (dissociated / sum-distinct), is $N \gg 2^n$? Best constructions: powers of two ($N = 2^{n-1}$), Conway–Guy ($N \le 2^{n-2}$ for large $n$), Bohman 1998 ($N \le 0.22002 \cdot 2^n$ for all large $n$). Lower bound: $N \ge \binom{n}{\lfloor n/2 \rfloor}$ (Dubroff–Fox–Xu).

On 2026-08-28 a pre-release GPT-6 Astra, in Epoch AI's FrontierMath Erdős run, produced a Lean-verified **disproof**: for every $\varepsilon > 0$ there are arbitrarily large $n$ with $N \le \varepsilon 2^n$. Bloom's exposition (erdosproblems.com/1, 2026-09-03) reinterprets it through lattices and notes that "the proof is currently non-quantitative, but just due to the non-effectiveness of the part where we approximate an arbitrary lattice by a primitive lattice", and that an effective version should give $f(n) \le n^{-c/\log\log n}$.

No explicit set below Bohman's constant was known. This note builds one, with every step machine-checkable in exact arithmetic.

Notation. $f(n) = \inf \max A / 2^{n-1}$ over dissociated $A$ with $|A| = n$ (Bloom); the site's ratio is $\rho = N/2^n = f/2$. Bohman: $\rho \le 0.22002$, i.e. $f \le 0.44004$.

## 2. The lattice (Bloom's exposition, verbatim structure)

Fix odd $b \ge 3$. Let $V_m = \{x \in \mathbb{R}^m : \sum x_i = 0\}$.

* $\Lambda_1 = T(\mathbb{Z}^b \cap V_b)$ with $(Tz)_i = z_i + \tfrac12 z_{i+1}$ (indices mod $b$); $v_1 = T(e_0) = (1,0,\dots,0,\tfrac12)$, height $h_1 = \sum v_1 = 3/2$.
* $\Lambda_{s+1} = \{(\lambda_0 + \beta_0 v_s, \dots, \lambda_{b-1} + \beta_{b-1} v_s) : \lambda_j \in \Lambda_s,\ \beta \in \Lambda_1\} \subset V_{b^{s+1}}$, $v_{s+1} = (v_s, 0, \dots, 0, \tfrac12 v_s)$, $h_{s+1} = \tfrac32 h_s$.

**Lemma 1 (Bloom; Lean `composeMatrix_admissible`).** $\Lambda_s$ is a full-rank lattice in $V_d$, $d = b^s$, with $\Lambda_s \cap (-1,1)^d = \{0\}$, and the pair $(\Lambda_s, v_s)$ is admissible: $t v_s \in \Lambda_s + (-1,1)^d \Rightarrow |t| < 1$.

*Proof sketch (base).* If $Tz \in (-1,1)^b$ with $z \in \mathbb{Z}^b \cap V_b$ then $|z_i + z_{i+1}/2| < 1$ forces $z_i \in \{-1,0,1\}$, and $z_i = 1$ forces $z_{i+1} = -1$, which forces $z_{i+2} = 1$, and so on around the odd cycle, a contradiction unless $z = 0$. The strip property is the same case analysis with one non-integral coordinate. *(Step.)* A vector of $\Lambda_{s+1}$ in the open cube has each block in $(\Lambda_s + \beta_j v_s) \cap (-1,1)^{d}$, so $|\beta_j| < 1$ by admissibility of $(\Lambda_s, v_s)$, so $\beta \in \Lambda_1 \cap (-1,1)^b = \{0\}$, so each block is in $\Lambda_s \cap (-1,1)^d = \{0\}$. The strip property for $(\Lambda_{s+1}, v_{s+1})$ follows the same way. $\square$

Let $B_s$ be the $(d-1) \times (d-1)$ matrix of the first $d-1$ coordinates of a basis of $\Lambda_s$ (columns). Then $\Lambda_s = \operatorname{lift}(B_s)\mathbb{Z}^{d-1}$ where $\operatorname{lift}(B) = \binom{B}{-\mathbf{1}^{\mathsf T} B}$, and

$$\Delta_s := |\det B_s| = \frac{(1+2^{-b})^{(b^s-1)/(b-1)}}{(3/2)^s}.$$

Checked exactly for $(b,s) \in \{(3,1),(3,2),(5,1),(5,2),(3,3),(7,1),(9,1),(7,2),(9,2)\}$ and for every instance below (`instruments/erdos1/lattice.py`, `build.py`; re-run at every build by `instruments/erdos1/battery.py`). Lemma 1 was also checked by exhaustive search for $d \le 9$ (`lattice.py`).


## 2b. The tilt family: Bloom's gadget is not special

Replace $T = I + \tfrac12 P$ by $T_\alpha = I + \alpha P$ for a rational $0 < \alpha < 1$ (and odd $b$). Then $h = 1 + \alpha$, $c = |\det T_\alpha| = 1 + \alpha^b$, the iteration is unchanged, and
$$\Delta_s(\alpha, b) = \frac{(1+\alpha^b)^{(b^s-1)/(b-1)}}{(1+\alpha)^s}.$$

**Lemma 1′ (cube, all tilts).** For every $0<\alpha<1$ and odd $b$, $T_\alpha(\mathbb{Z}^b \cap V_b) \cap (-1,1)^b = \{0\}$.

*Proof.* Let $z \in \mathbb{Z}^b$, $z \ne 0$, with $|z_i + \alpha z_{i+1}| < 1$ for all $i$ (indices mod $b$), and let $m = \max_i |z_i| \ge 1$, attained at $i$. Then $\alpha |z_{i+1}| > |z_i| - 1 = m - 1$, so $|z_{i+1}| > (m-1)/\alpha \ge m - 1$, hence $|z_{i+1}| = m$, and the sign of $z_{i+1}$ is opposite to that of $z_i$ (if $z_i = m$ then $\alpha z_{i+1} < 1 - m \le 0$). Propagating around the cycle, $z_{i+b} = (-1)^b z_i = -z_i$, contradicting $z_{i+b} = z_i$. $\square$ (The same inequality at the maximum also gives $(1-\alpha) m < 1$, so $m < 1/(1-\alpha)$.)

**Lemma 1″ (strip, structure).** Let $x_0 \in \mathbb{R}$, $x_1, \dots, x_{b-1} \in \mathbb{Z}$ not all zero, with $|x_i + \alpha x_{i+1}| < 1$ for all $i$ (cyclic, $x_b = x_0$), and $m = \max_{1 \le i \le b-1} |x_i|$. Then $m < 1/(1-\alpha)$ and $|x_{b-1}| = m$.

*Proof.* If the largest index attaining $m$ is $i^* \le b-2$, the argument of Lemma 1′ gives $|x_{i^*+1}| = m$ with $i^*+1 \le b-1$, contradicting maximality; so $i^* = b-1$. If $m \ge 1/(1-\alpha)$: either some $i \le b-2$ attains $m$ and the cube inequality gives $(1-\alpha)m < 1$; or only $x_{b-1}$ does, and then $|x_0| > (m-1)/\alpha$ from $|x_{b-1} + \alpha x_0| < 1$, so $|x_1| > (|x_0|-1)/\alpha > (m-1-\alpha)/\alpha^2$, which with $|x_1| \le m$ forces $m(1-\alpha^2) < 1+\alpha$, i.e. $m < 1/(1-\alpha)$. $\square$

The strip property itself ($|\sum_i x_i| < 1$, i.e. $|t| < 1$) is then decided **exactly per $(\alpha, b)$** by a finite search that Lemma 1″ makes small: for each $m < 1/(1-\alpha)$ and sign of $x_{b-1}$, enumerate the integer chains $x_{b-2}, \dots, x_1$ backwards under $|x_j| \le m$ and $|x_j + \alpha x_{j+1}| < 1$, then intersect the two constraints on $x_0$ and test whether the resulting open interval for $t = \sum x_i$ leaves $(-1,1)$ (`gadget.py`, `strip_tilt`; cross-validated against the brute-force checker of both properties for $b \le 9$).

**What the tilt buys** (`gadget-table.py`, exploratory floats; the certificates are exact). Best $\Delta$ under a dimension budget, versus Bloom's $\alpha = 1/2$:

| budget on $d$ | best tilt | $\Delta$ | Bloom's best |
|---|---|---|---|
| 100 | $\alpha = 0.58$, $b = 9$, $s = 2$, $d = 81$ | 0.4313 | 0.4532 (does not beat Bohman) |
| 200 | $\alpha = 2/3$, $b = 13$, $s = 2$, $d = 169$ | 0.3868 | 0.4452 |
| 1,000 | $\alpha = 0.8$, $b = 31$, $s = 2$, $d = 961$ | 0.3186 | 0.3539 ($d = 729$) |
| 3,000 | $\alpha = 0.55$, $b = 13$, $s = 3$, $d = 2197$ | 0.2901 | 0.3030 |
| 10,000 | $\alpha = 0.65$, $b = 21$, $s = 3$, $d = 9261$ | 0.2351 | 0.2964 |
| 1,000,000 | $\alpha = 0.65$, $b = 31$, $s = 4$ | 0.1417 | 0.1975 |

Two-parameter cyclic gadgets $I + aP + bP^2$ fail the cube condition from $b = 7$ on (period-three patterns such as $(-1,0,1,-1,0,1,\dots)$), so within cyclic gadgets the one-parameter tilt is the lever.

**Instances built with tilts** (all exactly checked; verify logs on disk): $\alpha = 3/5$, $b = 9$, $s = 2$, $d = 81$: $K = 242.5$; $k = 22$ gives $n = 1{,}782$ with $N/2^n = 0.216929$, $k = 28$ gives $n = 2{,}268$ with $0.215928$. This is the smallest explicit set below Bohman's constant, ten times smaller than the $d = 729$ set. $\alpha = 13/20$, $b = 11$, $s = 2$, $d = 121$: $K = 1660.8$, $k = 28$ gives $n = 3{,}388$ with $0.204055$. $\alpha = 2/3$, $b = 13$, $s = 2$, $d = 169$: $K = 349.9$, $k = 28$ gives $n = 4{,}732$ with $0.193433$, already below the $d = 729$ Bloom-gadget set at a fifth of its size. $\alpha = 11/20$, $b = 13$, $s = 3$, $d = 2197$: $k = 36$ gives $n = 79{,}092$ with $0.145269$, against $0.151520$ for Bloom's gadget at the same size. All verified (`verify-b*-a*.log`).

## 3. The effective transfer (what was non-effective, made explicit)

Let $r = d-1$, $D = 2^s$ (a common denominator of $B_s$), $A = D B_s \in \mathbb{Z}^{r\times r}$.

**Step H (Hermite form).** Compute an upper-triangular $H \in \mathbb{Z}^{r\times r}$ with positive diagonal whose column lattice equals the column lattice of $A$ with the first $r$ coordinates reversed. Reversing coordinates $0..r-1$ and changing basis do not affect the cube property of $\operatorname{lift}(\cdot)$ (Lemma 1 is about the lattice, and the deleted coordinate stays the last one). So $F := H/D$ satisfies: for every $z \in \mathbb{Z}^r \setminus \{0\}$, $\|\operatorname{lift}(F) z\|_\infty \ge 1$. **(CA)**

**Step C (chain perturbation).** Let $\operatorname{top}(X)$ append a zero row, and let $\operatorname{sh} \in \mathbb{Z}^{(r+1)\times r}$ have ones at $(i+1, i)$. For an integer $t \ge 1$ put

$$C = \operatorname{top}(tH) - \operatorname{sh}, \qquad S = \begin{pmatrix} I_r & 0 \\ -\mathbf{1}^{\mathsf T} & 1\end{pmatrix}, \qquad M = S C = t \operatorname{lift}(H) - E, \quad E := S\,\operatorname{sh}.$$

**Lemma 2 (saturation).** Deleting row 0 of $C$ leaves an upper-triangular matrix with diagonal $-1$ (because $H$ is upper triangular), so that minor is unimodular, the gcd of the maximal minors of $C$ is 1, and $C\mathbb{Z}^r$ is saturated in $\mathbb{Z}^{r+1}$. Since $S \in GL_{r+1}(\mathbb{Z})$, $M\mathbb{Z}^r = S(C\mathbb{Z}^r)$ is saturated too. Hence if $a \in \mathbb{Z}^{r+1}$ is a primitive vector with $a^{\mathsf T} M = 0$, then $\{c \in \mathbb{Z}^{r+1} : a \cdot c = 0\} = M\mathbb{Z}^r$.

**The weights.** $w_0 = 1$, $w_{j+1} = t \sum_{i \le j} w_i H_{ij}$ ($j = 0,\dots,r-1$) satisfies $w^{\mathsf T} C = 0$; then $a = S^{-\mathsf T} w$, i.e. $a_i = w_i + w_r$ ($i<r$), $a_r = w_r$, satisfies $a^{\mathsf T} M = 0$. (This is `transferWeights` of the Lean proof with the Smith form replaced by the Hermite form.)

**Step K (the buffer).** $E$ is fixed and tiny (rows $0, e_0^{\mathsf T}, \dots, e_{r-2}^{\mathsf T}$, and $(-1,\dots,-1,+1)$). Put
$$K := D \cdot \|E H^{-1}\|_{\infty\to\infty}.$$
Then for every real $z$: $\|Ez\|_\infty \le \|EH^{-1}\|\,\|Hz\|_\infty = K \|Fz\|_\infty \le K\|\operatorname{lift}(F) z\|_\infty$. **(BUF)**

**Lemma 3 (relation gap).** Let $Q = 2^k$ and $t = \lceil (Q + K)/D \rceil$, so $Dt - K \ge Q$. Then $a$ is $Q$-relation-free: $c \in \mathbb{Z}^{r+1}$, $\|c\|_\infty < Q$, $a\cdot c = 0 \Rightarrow c = 0$.

*Proof.* By Lemma 2, $c = Mz$ for some $z \in \mathbb{Z}^r$; if $z \ne 0$ then by (CA) and (BUF)
$\|c\|_\infty = \|t\operatorname{lift}(H)z - Ez\|_\infty \ge Dt\|\operatorname{lift}(F)z\|_\infty - K\|\operatorname{lift}(F)z\|_\infty \ge Dt - K \ge Q$, contradiction. $\square$

**Lemma 4 (binary blocks; Lean `exists_binary_block_set`).** If $a \in \mathbb{Z}_{>0}^{r+1}$ is $2^k$-relation-free then $\mathcal{A} = \{a_i 2^j : 0 \le i \le r,\ 0 \le j < k\}$ has $(r+1)k$ distinct elements and distinct subset sums.

*Proof.* Two subsets with equal sums give $\sum_i a_i c_i = 0$ with $c_i = \sum_{j\in S_i} 2^j - \sum_{j \in S_i'} 2^j \in (-2^k, 2^k)$, so $c = 0$, so $S_i = S_i'$ by uniqueness of binary expansions. Distinctness of elements is the special case of a relation with two nonzero coefficients $\pm 2^j$. $\square$

**Theorem.** With $n = (r+1)k = dk$ and $N = 2^{k-1}\max_i a_i$, the set $\mathcal{A}$ is dissociated, $|\mathcal{A}| = n$, $\mathcal{A} \subseteq \{1,\dots,N\}$, and
$$\frac{N}{2^n} = \frac{\max_i a_i}{2^{kr+1}} \xrightarrow[k\to\infty]{} \frac{\Delta_s}{2}, \qquad \text{explicitly } \frac{N}{2^n} \le \frac{\Delta_s}{2}\Big(1 + \frac{K + D}{2^k}\Big)^{r}\big(1 + \eta_k\big),$$
where $\eta_k \to 0$ is the relative size of the lower-order terms of the recurrence ($\max_i w_i / w_r$ for $i<r$). All of it is computed exactly; nothing is estimated.

## 4. What is checked by machine (`verify.py`)

V1 rebuild $\Lambda_s$ and $A$, compare $|\det A|$. V2 $H$ upper triangular with positive diagonal and $H\mathbb{Z}^r = A'\mathbb{Z}^r$ both ways (exact rational solves, integrality). V3 the minor of $C = S^{-1}M$ has determinant $\pm 1$ (FLINT determinant, not the triangular argument). V4 $\operatorname{null}(M^{\mathsf T})$ has dimension 1 and its primitive generator is $a$ (FLINT nullspace, independent of the recurrence). V5 $K \ge D\|EH^{-1}\|$ with $H^{-1}$ from a solve. V6 $Dt - K \ge 2^k$. V7 positivity, distinctness, $n$, $N$, the ratio, and the comparison with $0.22002$.

The one input not checked by computation at full size is Lemma 1 (cube admissibility of $\Lambda_s$), an elementary structural lemma proved by Bloom and formalized in Lean for the identical gadget; it is checked exhaustively here for $d \le 9$.

## 5. The instance

$b = 9$, $s = 3$: $d = 729$, $r = 728$, $D = 8$, $\Delta_3 = 0.353867$ ($|\det A|$ has 2183 bits). Hermite basis: max entry 3078, 5,957 nonzeros. Buffer $K = 793382/513 = 1546.55$ (about $2.1\,d$). Independent verifier: all checks passed for every instance (`verify.log`).

| k | n = |A| | t | bits of N | N/2^n | Bloom f | vs 0.22002 |
|---|---|---|---|---|---|---|
| 24 | 17,496 | 2,097,346 | 17,494 | 0.189259 | 0.378518 | below (14.0%) |
| 26 | 18,954 | 8,388,802 | 18,952 | 0.179938 | 0.359875 | below (18.2%) |
| 28 | 20,412 | 33,554,626 | 20,410 | 0.177680 | 0.355360 | below (19.2%) |
| 32 | 23,328 | 536,871,106 | 23,326 | 0.176980 | 0.353960 | below (19.6%) |

Limit as $k\to\infty$: $\Delta_3/2 = 0.176934$. The base weights differ from each other by less than $10^{-4}$ relatively; the set is 729 integers of about 7,000 digits, each times the first $k$ powers of two. Certificate: `certs/erdos1/cert-b9-s3.json.gz`; summary with the sha256 of the sorted set: `certs/erdos1/RESULTS-b9-s3.md`.

Buffer scan (`kscan.py`; extended per level in `certs/erdos1/logs/kscan-levels-certmachine.log`, 2026-09-16): $K \approx 1.03$–$1.13\,d$ at $s=2$ (b = 5..15), $1.6$–$2.35\,d$ at $s=3$ (b = 5..13), and at $b = 3$ the four levels $s = 1..4$ give $K/d = 1.11, 1.21, 1.25, 1.27$. The growth of $\|EH^{-1}\|_\infty$ per level at fixed $b$ is about $b/2$ from $s=1$ to $2$ and about $b$ from $s=2$ to $3$ (ratios 4.61 and 8.96 at $b = 9$; 5.86 and 11.2 at $b = 11$; 7.14 and 13.6 at $b = 13$), i.e. the buffer grows like the dimension times a slowly growing function of $s$. That is polynomial in $d$, which is all the effective theorem needs — and it is measured, not proved. In every case the longest row of $H^{-1}$ is the first one (the dual vector of the last projected coordinate), which is where a proof would start. So $k = \lceil\log_2(rK)\rceil + 6$ already puts the ratio within 1% of $\Delta_s/2$.

## 5a. The sets built in cert-machine (2026-09-15, night)

All with the same code, the Hermite basis by PARI, and every instance re-verified here (`certs/erdos1/verify-*.log`):

| α | b | s | d | D | K | k | n | N/2^n | note |
|---|---|---|---|---|---|---|---|---|---|
| 3/5 | 9 | 2 | 81 | 25 | 242.5 | 21 | 1,701 | 0.217967 | the smallest set below Bohman in this family; k = 20 gives 0.220057 |
| 3/4 | 21 | 2 | 441 | 16 | (ledger) | 28 | 12,348 | 0.172386 | Δ = 0.3440; beats the d = 729 Bloom lattice at 60% of its dimension |
| 4/5 | 31 | 2 | 961 | 25 | (ledger) | 30 | 28,830 | 0.159783 | Δ = 0.3186; beats the d = 1331 Bloom lattice |
| 3/5 | 15 | 3 | 3375 | 125 | 21,039 | 36 | 121,500 | 0.136855 | Δ = 0.2734; verified 2026-09-16 (14 h of shared CPU); the headline |

The strip decision for every tilt used (`gadget.py`, `strip_tilt`): 3/5@9, 13/20@11, 2/3@11, 2/3@13, 11/20@13, 3/4@21, 4/5@31, 3/5@15 all admissible, milliseconds each (M = 4 and 64,794 chains at 4/5@31). The candidates not built: 2/3@17 and 2/3@19 at s = 2 (Δ 0.3666, 0.3633: worse than 3/4@21 at similar d), 7/10@25 (Δ 0.3472, D = 100), 3/5@17 at s = 3 (Δ 0.2572 at d = 4913: the next stretch, ~a day of verification), 5/8@15 (Δ 0.2872, D = 512).

At d = 81 the other small-denominator tilts were tried at k = 20 and 21 (build only, not certified): 4/7 gives 0.222162 and 0.219272 (K = 347), 7/12 gives 0.225854 and 0.220940 (K = 600), 5/9 gives 0.224968 and 0.220835 (K = 421); none crosses at k = 20, and 3/5 at k = 21 is the smallest set.

## 5b. Corollary: explicit lower bounds for the constant in Siegel's lemma

In the normalisation of Bloom's exposition (after Aliev), $C_d$ is the least constant such that every nonzero $a \in \mathbb{Z}^d$ has a nonzero $x \in \mathbb{Z}^d$ with $a\cdot x = 0$ and $\|x\|_\infty^{d-1} \le C_d \|a\|_\infty$. Bombieri–Vaaler give $C_d \ll \sqrt d$; the stated lower bound is Schinzel's $C_d \ge 1$, and Bloom notes that the Astra construction should give explicit lower bounds. It does, directly from the certificates: the base weights $a \in \mathbb{Z}^d$ are $2^k$-relation-free (Lemma 3), so every admissible $x$ has $\|x\|_\infty \ge 2^k$ and $2^{k(d-1)} \le C_d \max a$, i.e. $C_d \ge 2^{kr}/\max a = 1/f$ with $f$ the Bloom-normalised ratio of the instance. Exactly, from the verified certificates (`siegel.py`, `certs/erdos1/siegel.json`; the ledger carries the same numbers, truncated rather than rounded):

| d | k | $C_d \ge$ |
|---|---|---|
| 81 | 28 | 2.315584 |
| 169 | 28 | 2.584880 |
| 441 | 28 | 2.900463 |
| 729 | 32 | 2.825178 |
| 961 | 30 | 3.129239 |
| 1331 | 34 | 3.162106 |
| 2197 | 36 | 3.441898 |
| 3375 | 36 | 3.653497 |

For comparison, a Bohman-type set gives $C_d \ge 1/0.44004 = 2.2725$ for all large $d$; the Astra construction shows $C_d \to \infty$ along a sequence of $d$, and these are the first explicit values above 2.28.

## 6. What this adds

* The Astra proof shows existence; Bloom's version isolates the single non-effective step. Replacing the Smith normal form by a Hermite form makes the perturbation, the buffer $K$ and the scale $t$ explicit, so the object exists on disk.
* The smallest instance of this family that beats Bohman is $b = 9$, $s = 3$ ($d = 729$; $s = 2$ tops out at $\Delta \to 4/9 > 0.44004$). Larger $(b,s)$ give $\Delta_s \to 0$: $(11,3)$ 0.316, $(13,3)$ 0.303, $(13,4)$ 0.264, $(17,4)$ 0.206.
* Next: the effective theorem $f(n) \le n^{-c/\log\log n}$ with explicit $c$ needs a structural bound on $K$ (conditioning of $\Lambda_s$'s basis), which the recursive basis should give; and a certified search for better base gadgets (larger height, smaller covolume) would improve every constant.

## 7. Provenance

Bloom's exposition: https://www.erdosproblems.com/1 (2026-09-03). Astra's Lean proof: https://github.com/tadamcz/erdos1 (`Erdos1_219usd_38h.lean`: `chainMatrix`, `transferWeights`, `integer_kernel_no_small_relation`, `exists_integer_transfer_family`, `oddCycleGadget`, `composeMatrix_admissible`). Epoch: https://epoch.ai/latest/announcing-frontiermath-erdos. Bohman: A construction for sets of integers with distinct subset sums, Electron. J. Combin. 5 (1998), R3 (the 0.22002 bound; his Proc. AMS 124 (1996) paper is the Conway–Guy analysis).
