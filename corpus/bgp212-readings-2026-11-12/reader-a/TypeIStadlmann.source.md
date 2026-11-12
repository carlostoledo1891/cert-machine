# TypeIStadlmann — the source statement (read before the Lean file was opened)

Cited (as the brief gives the Lean file's citation): [2] Lemma 6.
Read: [2] = arXiv 2608.31126v1. Pins in `sources.json`. Stadlmann's earlier Theorem 1 (Adv. Math. 468 (2025) 110190),
of which [2] Lemma 6 is "a variant", is not pinned and was not read. This is a reading, not a decision.

## [2] Lemma 6 (S. Type I), quoted from the TeX source

> Suppose $f(n;x) = (\alpha \star \beta)(n;x)$, where $\alpha$ is coefficient sequence at scale $M$ and $\beta$ is a
> coefficient sequence at scale $N$ with $M(x) N(x) \asymp x$ and $N(x) \leq x^{1/2}$. Suppose also that $\beta$ has the
> Siegel-Walfisz property. Write $N(x) = x^\gamma$. Define the set of moduli
> $D_{IIc}(x;\omega,\gamma,\delta;\varepsilon) = \{d \in [1, x^{1/2+2\omega}]\cap \mathbb{N}:$
> $\exists r \mid d \ \exists u \mid \frac{d}{r} \ \exists d_1 \mid r$ with $x^{\gamma -3\varepsilon-\delta} < r < x^{\gamma - 3\varepsilon}$
> and $x^{1-\gamma-6\varepsilon-\delta} d^{-1} < u < x^{1-\gamma-6\varepsilon} d^{-1}$
> and $r^2 x^{2-\gamma-52\varepsilon -\delta} d^{-4} < d_1 < r^2 x^{2-\gamma-52\varepsilon} d^{-4}\}$.
> Consider triples $(\omega,\gamma,\delta)$ which satisfy the following inequalities:
> $8\omega+4\delta + 2\gamma < 1$, $32 \omega + 10 \delta -\gamma<0$, $48\omega + 16 \delta -4\gamma < -1$.
> For such triples $(\omega,\gamma,\delta)$, convolution $f$ has equidistribution properties for moduli in
> $D_{IIc}(x;\omega,\gamma,\delta;\varepsilon)$.

Followed by: "This lemma is a variant of Theorem 1 of [Stadlmann 2023]." The uniformity note after Lemma 3 applies.
Depends on [2] Definitions 6 and 7 and §1 notation, unfolded in `TypeIIPolymath.source.md`.

## What [2] Lemma 6 asserts, in my words

- **Objects.** As Lemma 3: $\alpha$ at scale $M(x)$, $\beta$ at scale $N(x)$ with Siegel-Walfisz, $M(x)N(x)\asymp x$,
  $N(x)\le x^{1/2}$, $N(x)=x^\gamma$ with $\gamma$ a coordinate of a fixed triple.
- **Moduli.** $D_{IIc}$: natural $d\le x^{1/2+2\omega}$ with THREE nested divisors: $r\mid d$ in
  $(x^{\gamma-3\varepsilon-\delta},x^{\gamma-3\varepsilon})$; $u\mid d/r$ in $(x^{1-\gamma-6\varepsilon-\delta}/d,\ x^{1-\gamma-6\varepsilon}/d)$;
  $d_1\mid r$ in $(r^2x^{2-\gamma-52\varepsilon-\delta}/d^4,\ r^2x^{2-\gamma-52\varepsilon}/d^4)$. The second and third windows
  are relative to $d$ (and $r$) itself, not fixed powers of $x$; each window is open with multiplicative width $x^\delta$.
  The constants $6\varepsilon$, $52\varepsilon$ are part of the statement. Squarefree via Def. 7.
- **Parameter range.** Exactly the three strict inequalities $8\omega+4\delta+2\gamma<1$, $32\omega+10\delta-\gamma<0$,
  $48\omega+16\delta-4\gamma<-1$. (Together they force $\frac14+12\omega+4\delta<\gamma<\frac12-4\omega-2\delta$ — my algebra.)
  No stated sign conditions on $\omega,\delta$.
- **Conclusion and quantifiers.** Def. 7 as in Lemma 3 ($\exists\varepsilon^*\ \forall\varepsilon<\varepsilon^*\ \forall A\ \exists C(A,\varepsilon)\ \forall x>1\ \forall a$
  coprime to all primes $\le x$; sum over squarefree $d\in D_{IIc}$ of the $[x,2x]$ discrepancies $\le Cx/\log(x)^A$).
- **Status.** Proof in [2] §3.2 is a sketch of the changes to the earlier proof.
