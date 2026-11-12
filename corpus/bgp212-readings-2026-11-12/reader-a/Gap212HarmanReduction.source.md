# Gap212HarmanReduction — the source statements (read before the Lean file was opened)

Cited (as the brief gives the Lean file's citation): [2] Proposition 2, Definition 9.
Read: [2] = arXiv 2608.31126v1. Pins in `sources.json`. This is a reading, not a decision. Neither "212" nor any
specific parameter choice for it appears in [2]; [2]'s own application (proof of its Theorem 1, $H_1\le240$, $k=49$) uses
$\xi_1=0.38$, $\xi_2=\xi_3=0.4$, for which Proposition 2 gives $\rho=1_{\mathbb P}$, $c_1=c_2=0$.

## [2] Definition 9 (Decomposition), quoted

> Let $\epsilon = 10^{-10}$ and let $\xi_1, \xi_2, \xi_3 \in (0,1)$. Then $\mathcal{H}(\xi_1,\xi_2,\xi_3)$ denotes the set
> of functions $f: \mathbb{N} \times (1,\infty) \rightarrow \mathbb{C}$ which satisfy one of the following three conditions:
> (I) $f(n;x) = (\alpha \star \beta)(n;x)$, where $\alpha$ is a coefficient sequence at scale $M$ and $\beta$ is a smooth
> coefficient sequence at scale $N$ with $M(x) N(x) \asymp x$. Additionally, $N(x) = x^{\gamma(x)}$ with $\gamma(x) \geq \xi_1-\epsilon$.
> (II) $f(n;x) = (\alpha \star \beta)(n;x)$, where $\alpha$ is a coefficient sequence at scale $M$, $\beta$ is a coefficient
> sequence at scale $N$ with $M(x) N(x) \asymp x$, and $\alpha$ and $\beta$ both have the Siegel--Walfisz property.
> Additionally, $N = x^{\gamma(x)}$ with $\xi_2 -\epsilon \leq \gamma(x) \leq 1- \xi_2+\epsilon$.
> (III) $f(n;x) = (\alpha \star \psi_1 \star \psi_2 \star \psi_3)(n;x)$, where $\alpha$ is a coefficient sequence at scale
> $M$ and $\psi_1$, $\psi_2$ and $\psi_3$ are smooth coefficient sequences at scales $N_1$, $N_2$ and $N_3$ with
> $M(x) N_1(x) N_2(x) N_3(x) \asymp x$. Additionally, $x^{1-2\xi_3-\epsilon} \leq N_1(x), N_2(x), N_3(x) \leq x^{\xi_3+\epsilon}$
> and $N_i(x)N_j(x) \geq x^{1-\xi_3-\epsilon}$ for $i \neq j$.

## [2] Proposition 2, quoted (statement only; the proof is summarised below)

> Let $T_k(\delta,\underline{A},\underline{B},\varepsilon)$ be as given in Definition 1, let $Q^*(x;\delta,\underline{A},\underline{B},\varepsilon,\varepsilon_0)$
> be as given in Definition 2 and let $\mathcal{H}(\xi_1,\xi_2,\xi_3)$ be as given in Definition 9.
> Suppose $\xi_1, \xi_2, \xi_3 \in (0,1)$ satisfy all of the following inequalities:
> $2\xi_1 + 3\xi_2 <2$, $\xi_2 \leq \xi_3$, $\xi_1+ 9\xi_2 < 4$, $2\xi_1+ \xi_2>1$, $17 \xi_2 < 7$.
> Suppose further that for every $f \in \mathcal{H}(\xi_1,\xi_2,\xi_3)$, $x>1$, $\varepsilon_0 >0$, $A>0$ and
> $a\in \mathbb{Z}$ with $(a,P(x))=1$,
> $\sum_{q \in Q^*(x;\delta,\underline{A},\underline{B},\varepsilon,\varepsilon_0),\ q \text{ squarefree}} | \sum_{n \in [x,2x],\ n \equiv a (q)} f(n;x) - \frac{1}{\phi(q)} \sum_{n \in [x,2x],\ (n,q)=1}f(n;x) | \ll_{A,\varepsilon_0} \frac{x}{\log(x)^A}$.
> We then write $p_j = x^{\alpha_j}$ and define the minorant
> $\rho(n;x) = 1_{\mathbb{P}}(n) - \sum_{n = p_1p_2p_3p_4p_5;\ 1 -2\xi_2 < \alpha_4 < \alpha_3 < \alpha_2 < \alpha_1 < \xi_2;\ \alpha_1+\alpha_2 < \xi_2;\ \alpha_2+\alpha_3+\alpha_4 >1-\xi_2;\ \alpha_5>\alpha_4} 1 - \sum_{n = p_2p_3p_4p_5p_6;\ 1-2\xi_2 < \alpha_2, \alpha_3, \alpha_4, \alpha_5, \alpha_6 < 8\xi_2-3;\ \alpha_2, \alpha_4 > \alpha_3;\ \alpha_2+\alpha_4 < \xi_2;\ \alpha_3 + \alpha_4 + \alpha_5 >1-\xi_2;\ \alpha_6 > \alpha_5} 1$.
> Furthermore, we choose the constants
> $c_1 = \int^{\xi_2}_{1 -2\xi_2}\int^{\min\{\alpha_1, \xi_2-\alpha_1\}}_{1 -2\xi_2}\int^{\alpha_2}_{1 -2\xi_2}\int^{\min\{\alpha_3,(1-\alpha_1-\alpha_2-\alpha_3)/2\}}_{\max\{1 -2\xi_2, 1 - \xi_2-\alpha_2-\alpha_3\}} \frac{d\alpha_1 d\alpha_2 d\alpha_3 d\alpha_4}{\alpha_1\alpha_2\alpha_3\alpha_4(1-\sum_{i=1}^4\alpha_i)}$
> $+ \int^{8\xi_2-3 }_{1 -2\xi_2}\int^{\min\{8\xi_2-3 , \alpha_2\}}_{1 -2\xi_2}\int_{\max\{\alpha_3, 1 -2\xi_2\}}^{\min\{8\xi_2-3 , \xi_2-\alpha_2\}}\int^{\min\{8\xi_2-3 ,(1-\sum_{i=2}^4\alpha_i)/2\}}_{\max\{1 -2\xi_2,1 - \xi_2-\alpha_3-\alpha_4\}} \frac{d\alpha_2 d\alpha_3 d\alpha_4 d\alpha_5}{\prod_{i=2}^5\alpha_i(1-\sum_{i=2}^5\alpha_i)}$,
> $c_2 = 24$ if $\xi_2 > \frac{4}{10}$, $0$ if $\xi_2 \leq \frac{4}{10}$.
> Then $\rho(n;x)$ has the following properties:
> (1) Prime minorant: $-c_2 \leq \rho(n;x) \leq 1_{\mathbb{P}}(n)$ for all large $x$ and $n \in [x,2x]$.
> (2) $\rho$ has equidistribution properties for moduli corresponding to $T_k(\delta,\underline{A},\underline{B},\varepsilon)$. (See Definition 3.)
> (3) If $\rho(n;x) \neq 0$, then all prime factors of $n$ exceed $x^{1-2\xi_2}$.
> (4) The sum of $\rho(n;x)$ over $[x,2x]$ satisfies $\sum_{n \in [x,2x]} \rho(n;x) = (1-c_1 +o(1)) \frac{x}{\log(x)}$.

After the statement: "(Note: If $\xi_2 \leq \frac{4}{10}$, then $\rho(n;x)$ is simply $1_{\mathbb{P}}(n)$.)"

### Definitions the statement depends on

- §1: "We write $P(y)= \prod_{p <y} p$" (strict $p<y$); "$y$-smooth if all its prime factors are of size less than $y$".
- Definition 1 ($T_k$): $k\in\mathbb N$, $\delta>0$, $\varepsilon>0$, $n\in\mathbb N$, $\underline A=(A_0,\dots,A_n)$ with
  "$-\varepsilon =A_0 < \dots < A_n <\frac{1}{2}-\varepsilon$"; $\underline B$ an $n\times\lfloor 1/\delta\rfloor$ matrix with
  "$\delta<B_{j,m} \leq B_{j,m+1} \leq B_{j,m} + \delta$"; $T_k=\bigcup_{j=1}^n\{t\in[0,1]^k: \sum_i t_i\in[A_{j-1}+\varepsilon, A_j+\varepsilon)
  \text{ and } \sum_{i\in I}t_i\le B_{j,|I|}\text{ for } I=\{i:t_i>\delta\}\}$.
- Definition 2 ($Q$, $Q^*$): $Q(x;\delta,\underline A,\underline B,\varepsilon,j,j',m,m',\varepsilon_0)$ is the set of integers
  $ee'\prod_{i=1}^m f_i\prod_{i'=1}^{m'}f'_{i'}\in[1,x]$ with $\log_x(f_1\cdots f_m)\le(1-\varepsilon_0)B_{j,m}$,
  $\log_x(f'_1\cdots f'_{m'})\le(1-\varepsilon_0)B_{j',m'}$, $\log_x(f_1\cdots f_m e)\le(1-\varepsilon_0)(A_j-\varepsilon)$,
  $\log_x(f'_1\cdots f'_{m'}e')\le(1-\varepsilon_0)(A_{j'}+\varepsilon)$ (sic: $-\varepsilon$ on the unprimed side, $+\varepsilon$
  on the primed side), "$ee'$ is $x^\delta$-smooth", $\log_x f_i,\log_x f'_i\ge\delta$. $Q^*=\bigcup_{j,j'=1}^n\bigcup_{m,m'=0}^{\lfloor1/\delta\rfloor}Q$.
- Definition 3 (equidistribution for moduli corresponding to $T_k$): "For any $x>1$, $\varepsilon_0>0$ and $A>0$, and for
  any $a \in \mathbb{Z}$ with $(a,p)=1$ for all primes $p \leq x$", the same squarefree-$q\in Q^*$ sum $\ll_{A,\varepsilon_0} x/\log(x)^A$.
- Definition 6 (coefficient sequences, Siegel-Walfisz, smooth) as unfolded in `TypeIIPolymath.source.md` and
  `TypeIBakerIrving.source.md`.

## What [2] Proposition 2 (with Definition 9) asserts, in my words

- **Fixed data.** $k,\delta,\underline A,\underline B,\varepsilon$ as in Def. 1 (arbitrary; the proposition puts no
  condition linking them to the $\xi_i$ — the link is the equidistribution hypothesis), and $\xi_1,\xi_2,\xi_3\in(0,1)$.
- **Hypothesis 1 (numerics).** All five: $2\xi_1+3\xi_2<2$, $\xi_2\le\xi_3$ (non-strict), $\xi_1+9\xi_2<4$,
  $2\xi_1+\xi_2>1$, $17\xi_2<7$.
- **Hypothesis 2 (equidistribution of the class $\mathcal H$).** For every $f\in\mathcal H(\xi_1,\xi_2,\xi_3)$, every
  $x>1$, $\varepsilon_0>0$, $A>0$, every $a$ with $(a,P(x))=1$: the squarefree-$Q^*$ discrepancy sum over $n\in[x,2x]$ is
  $\ll_{A,\varepsilon_0}x/\log(x)^A$. The class $\mathcal H$: Type (I) $\alpha\star\beta$ with $\beta$ smooth and
  $\gamma(x)\ge\xi_1-\epsilon$ (no upper bound on $\gamma$, no Siegel-Walfisz); Type (II) $\alpha\star\beta$ with BOTH
  sequences Siegel-Walfisz and $\xi_2-\epsilon\le\gamma(x)\le1-\xi_2+\epsilon$; Type (III) quadruple convolutions with
  $x^{1-2\xi_3-\epsilon}\le N_i\le x^{\xi_3+\epsilon}$ and $N_iN_j\ge x^{1-\xi_3-\epsilon}$. Here $\epsilon=10^{-10}$ is a
  numeric constant distinct from the $\varepsilon$ of Def. 1, and the exponent $\gamma(x)$ may vary with $x$ (contrast
  Lemmas 3-7, where $\gamma$ is a fixed coordinate). In (III) the bounds are with no implied constants ($\le$, $\ge$).
- **Construction.** $\rho=1_{\mathbb P}-\Gamma_2-\Gamma_2^*$ with the two explicit 5-prime counting sums (strict
  inequalities in the statement), $c_1$ = the sum of the two explicit 4-fold integrals, $c_2=24$ or $0$ by $\xi_2>0.4$.
- **Conclusion.** (1) $-c_2\le\rho\le1_{\mathbb P}$ on $[x,2x]$ for large $x$; (2) $\rho$ satisfies Def. 3 for $T_k$'s moduli
  $Q^*$ (residues $a$ coprime to all primes $\le x$); (3) $\rho(n;x)\ne0\Rightarrow$ every prime factor of $n$ exceeds
  $x^{1-2\xi_2}$; (4) $\sum_{n\in[x,2x]}\rho(n;x)=(1-c_1+o(1))x/\log x$.
- **Quantifier shape.** $\forall$ data, $\forall\xi$ [numerics] $\wedge$ [$\forall f\in\mathcal H$: Def.-3-type bound]
  $\Rightarrow$ (1)-(4) for the specific $\rho,c_1,c_2$. It is an implication between equidistribution statements, not an
  equidistribution statement itself.
- **Small mismatches inside the source, recorded not resolved.** (a) Hypothesis uses $(a,P(x))=1$ ($p<x$); conclusion (2)
  via Def. 3 uses $(a,p)=1$ for $p\le x$. (b) The statement's $\Gamma_2^*$ has strict $1-2\xi_2<\alpha_i<8\xi_2-3$; the
  proof's (4.4) has $\le$. (c) The proof uses $\xi_2<\xi_3$; the statement has $\xi_2\le\xi_3$. (d) The proof derives
  $7\xi_2<3$ and $12\xi_2<5$ as needed; both follow from $17\xi_2<7$ ($7/17<5/12<3/7$ — my arithmetic), so the statement
  is not missing them.
- **Status.** The proof re-runs the author's earlier Lemmas 19-22 (Adv. Math. 2025) "with specific numeric values replaced
  by variables", and lists the inequalities each step needs; it is a sketch against that paper, which is not pinned here.
