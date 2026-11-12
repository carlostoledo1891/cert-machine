# TypeIBakerIrving — the source statement (read before the Lean file was opened)

Cited (as the brief gives the Lean file's citation): [2] Lemma 5.
Read: [2] = arXiv 2608.31126v1. Pins in `sources.json`. Baker-Irving's own Lemma 5 (Math. Z. 286 (2017) 821-841), of
which [2] Lemma 5 is "a variant", is not pinned and was not read. This is a reading, not a decision.

## [2] Lemma 5 (Baker-Irving Type I), quoted from the TeX source

> Suppose $f(n;x) = (\alpha \star \beta)(n;x)$, where $\alpha$ is coefficient sequence at scale $M$ and $\beta$ is a
> smooth coefficient sequence at scale $N$ with $M(x) N(x) \asymp x$. Write $N(x) = x^\gamma$. Define the set of moduli
> $D_I(x;\omega,\gamma,\delta;\varepsilon) =$
> - $\{d \in [1, x^{1/2+2\omega}]\cap \mathbb{N}: \exists r \mid d \text{ with } x^{\gamma-\delta -3\varepsilon} < r < x^{\gamma - 3\varepsilon}\}$ if $\gamma \leq \frac{1}{2}$,
> - $\{d \in [1, x^{1/2+2\omega}]\cap \mathbb{N}: \exists r \mid d \text{ with } x^{1-\gamma-\delta -3\varepsilon} < r < x^{1-\gamma - 3\varepsilon}\}$ if $\gamma \in (\frac{1}{2},\frac{1}{2}+2\omega+\varepsilon]$,
> - $[1, x^{1/2+2\omega}]\cap \mathbb{N}$ if $\gamma >\frac{1}{2}+2\omega+\varepsilon$.
>
> Consider triples $(\omega,\gamma,\delta)$ which satisfy the following inequalities:
> $3\gamma-12\omega -3\delta >1$ if $\gamma \leq \tfrac{1}{2}$; $68\omega + 14 \delta <1$ if $\gamma \in (\tfrac{1}{2},\tfrac{1}{2}+2\omega+\varepsilon]$.
> For such triples $(\omega,\gamma,\delta)$, convolution $f$ has equidistribution properties for moduli in
> $D_I(x;\omega,\gamma,\delta;\varepsilon)$.

Followed by: "This lemma is a variant of Lemma 5 of Baker and Irving." The uniformity note after Lemma 3 applies.

Depends on: [2] Definition 6 (iii): "$\alpha$ is said to be smooth at scale $N(x)$ if there are some constants
$1\ll c \ll C \ll 1$ so that for every $x>1$, there exists a smooth function $\psi:\mathbb{R} \rightarrow \mathbb{C}$
supported on $[c,C]$, with $|\psi^{(j)}(t)| \ll_j \log(x)^{O_j(1)}$ for all $t \in \mathbb{R}$, such that
$\alpha(n;x) = \psi(n/N)$." Definition 6 (i), Definition 7, §1 notation as unfolded in `TypeIIPolymath.source.md`.

## What [2] Lemma 5 asserts, in my words

- **Objects.** $\alpha$ any coefficient sequence at scale $M(x)$; $\beta$ a smooth coefficient sequence at scale $N(x)$
  ($\beta(n;x)=\psi_x(n/N(x))$, $\psi_x$ smooth with support in a fixed $[c,C]$ and derivative bounds $\ll_j\log(x)^{O_j(1)}$;
  $\psi_x$ may change with $x$). $M(x)N(x)\asymp x$. **No Siegel-Walfisz hypothesis on either sequence, and no upper bound
  $N(x)\le x^{1/2}$** (unlike Lemmas 3, 4, 6): $\gamma$ ranges over all reals, split into three cases.
- **Moduli by case.** (a) $\gamma\le\frac12$: one divisor $r$ of $d$ in $(x^{\gamma-\delta-3\varepsilon},x^{\gamma-3\varepsilon})$;
  (b) $\frac12<\gamma\le\frac12+2\omega+\varepsilon$: one divisor $r$ in $(x^{1-\gamma-\delta-3\varepsilon},x^{1-\gamma-3\varepsilon})$
  (the window sits at the scale of $M$, not $N$); (c) $\gamma>\frac12+2\omega+\varepsilon$: every $d\le x^{1/2+2\omega}$, no
  factorisation condition. Always $d\le x^{1/2+2\omega}$; squarefree via Def. 7.
- **Parameter range by case.** (a) $3\gamma-12\omega-3\delta>1$; (b) $68\omega+14\delta<1$ (no $\gamma$ in it); (c) none.
- **The case boundary moves with $\varepsilon$.** Both the moduli set and which condition applies depend on $\varepsilon$,
  which Def. 7 quantifies inside ("for any sufficiently small $\varepsilon$"). For a fixed triple: if $\gamma>\frac12+2\omega$,
  small enough $\varepsilon$ puts it in case (c); if $\frac12<\gamma\le\frac12+2\omega$ it is in case (b) for every
  $\varepsilon>0$. So, read with Def. 7, case (b) is effectively $\gamma\in(\frac12,\frac12+2\omega]$ and case (c) is
  $\gamma>\frac12+2\omega$ (my reading of the interaction; the statement does not spell it out).
- **Conclusion and quantifiers.** Def. 7 as in Lemma 3: $\exists\varepsilon^*(\omega,\gamma,\delta)\ \forall\varepsilon<\varepsilon^*\ \forall A\ \exists C(A,\varepsilon)\ \forall x>1\ \forall a$
  coprime to all primes $\le x$: the sum over squarefree $d\in D_I$ of the $[x,2x]$ discrepancies is $\le C x/\log(x)^A$.
- **Status.** Proof in [2] §3.2 is a sketch of changes ("Our explanations are best read side-by-side with the original
  proofs").
