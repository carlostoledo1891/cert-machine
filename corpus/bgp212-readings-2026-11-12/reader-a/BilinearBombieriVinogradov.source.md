# BilinearBombieriVinogradov — the source statement (read before the Lean file was opened)

Cited (as the brief gives the Lean file's citation): [1] Theorem 2.9.
Read: [1] = arXiv 1402.0811v3 (Polymath, "New equidistribution estimates of Zhang type"; the brief's title for [1],
"Variants of the Selberg sieve...", is Polymath 8b = arXiv 1407.4897, whose Theorem 2.8 is Motohashi's generalized
Bombieri-Vinogradov theorem $\mathrm{GEH}[\vartheta]$, $\vartheta<1/2$ — a different statement; see `sources.json`). In v1 and
v2 of 1402.0811 this theorem is not numbered 2.9 (it is the 24th numbered environment of Section 2 there). Pins in
`sources.json`. This is a reading, not a decision.

## [1] Theorem 2.9 (Bombieri-Vinogradov theorem), quoted from the TeX source (v3)

> Let $N,M \gg 1$ be such that $NM \sim x$ and $N \geq x^\eps$ for some fixed $\eps>0$. Let $\alpha,\beta$ be coefficient
> sequences at scale $M,N$ respectively such that $\beta$ has the Siegel-Walfisz property. Then for any fixed $A>0$ there
> exists a fixed $B>0$ such that
> $$ \sum_{q \leq x^{1/2} \log^{-B} x} \sup_{a \in (\mathbb{Z}/q\mathbb{Z})^\times} |\Delta(\alpha\star\beta; a\ (q))| \ll x \log^{-A} x.$$

Followed by: "See [bfi, Theorem 0] for the proof" (Bombieri-Friedlander-Iwaniec) — [1] does not prove it; it introduces it
as the "bilinear" form of the Bombieri-Vinogradov theorem "(the principle of which is due to Gallagher and Motohashi)".

### Definitions the statement depends on ([1], v3)

- Definition 1.2 (asymptotic notation): "$x$ ... a large real parameter, which one should think of as going off to
  infinity; in particular, we will implicitly assume that it is larger than any specified fixed constant. Some
  mathematical objects will be independent of $x$ and referred to as fixed; but unless otherwise specified we allow all
  mathematical objects under consideration to depend on $x$ ... $X = O(Y)$ or $X \ll Y$ if one has $|X| \leq CY$ for some
  fixed $C$ ... $X \sim Y$ to denote the estimate $Y \ll X \ll Y$."
- (1.1) discrepancy: $\Delta(\alpha; a\ (q)) := \sum_{n = a\ (q)} \alpha(n) - \frac{1}{\phi(q)} \sum_{(n,q)=1} \alpha(n)$, for
  finitely supported $\alpha$ and a primitive class $a\ (q)$.
- Definition 2.5: coefficient sequence = "a finitely supported sequence $\alpha \colon \N \to \R$ (which may depend on $x$)
  that obeys the bounds $|\alpha(n)| \ll \tau^{O(1)}(n) \log^{O(1)}(x)$"; (i) located at scale $N$: "supported on an interval
  of the form $[cN, CN]$ for some $1 \ll c < C \ll 1$"; (ii) Siegel-Walfisz property:
  "$| \Delta(\alpha 1_{(\cdot,r)=1}; a\ (q)) | \ll \tau(qr)^{O(1)} N \log^{-A} x$ for any $q,r \geq 1$, any fixed $A$, and any
  primitive residue class $a\ (q)$."
- Dirichlet convolution as usual (§1.3, Basic notation).

## What [1] Theorem 2.9 asserts, in my words

- **Objects.** $x$ large; scales $M,N\gg1$ (may depend on $x$) with $NM\sim x$ (two-sided, fixed constants) and
  $N\ge x^{\varepsilon}$ for one fixed $\varepsilon>0$ — a lower bound on $N$ only; no upper bound on $N$ and no lower
  bound on $M$ beyond $M\gg1$. $\alpha$ a coefficient sequence located at scale $M$ (no arithmetic hypothesis), $\beta$ at
  scale $N$ with the Siegel-Walfisz property. Coefficient sequences are real-valued, finitely supported, may depend on $x$.
- **Conclusion and quantifier order.** $\forall$ fixed $A>0$ $\exists$ fixed $B>0$ (depending on $A$ and on the fixed data:
  $\varepsilon$, the implied constants of $\sim$, of the coefficient bounds and of Siegel-Walfisz) such that, for $x$
  large, $\sum_{q\le x^{1/2}\log^{-B}x}\ \sup_{a\in(\mathbb Z/q\mathbb Z)^\times}|\Delta(\alpha\star\beta;a\ (q))|\le C\,x\log^{-A}x$
  with a fixed $C$.
- **Moduli.** EVERY natural $q\le x^{1/2}\log^{-B}x$: not restricted to squarefree, smooth, or densely divisible $q$. The
  level is $x^{1/2}$ divided by a power of $\log x$ — not $x^{1/2}$, and not $x^{1/2-\eta}$.
- **Residues.** The supremum over primitive classes is inside the sum: the residue may be chosen separately for each $q$
  (stronger than a single $a$ for all $q$).
- **Sum over $n$.** The discrepancy runs over all $n$ (no $[x,2x]$ cut-off; $\alpha\star\beta$ is supported on
  $[c_1c_2x', C_1C_2x']$ with $x'=MN\sim x$).
- **Status.** Cited, not proved, in [1] ("See [bfi, Theorem 0]").
