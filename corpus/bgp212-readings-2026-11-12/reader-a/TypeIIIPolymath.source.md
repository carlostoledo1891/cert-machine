# TypeIIIPolymath — the source statements (read before the Lean file was opened)

Cited (as the brief gives the Lean file's citation): [2] Lemma 7; [1] Theorem 2.8(v).
Read: [2] = arXiv 2608.31126v1; [1] = arXiv 1402.0811v3. Pins in `sources.json`. This is a reading, not a decision.

## [2] Lemma 7 (Polymath Type III), quoted from the TeX source

> Suppose $f(n;x) = (\alpha \star \psi_1 \star \psi_2 \star \psi_3)(n;x)$, where $\alpha$ is coefficient sequence at scale
> $M$ and $\psi_1$, $\psi_2$ and $\psi_3$ are smooth coefficient sequences at scales $N_1$, $N_2$ and $N_3$ with
> $M(x) N_1(x) N_2(x) N_3(x) \asymp x$, $N_1(x)N_2(x),\ N_1(x)N_3(x),\ N_2(x)N_3(x) \gg x^{1-\gamma}$,
> $x^{1-2\gamma} \ll N_1(x), N_2(x), N_3(x) \ll x^{\gamma}$.
> Define the set of moduli
> $D_{III}(x;\omega,\gamma,\delta;\varepsilon) = \{d \in [1, x^{1/2+2\omega}]\cap \mathbb{N}: \exists r \mid d \text{ with } x^{1/3+4\delta/3 -4\omega/3-\delta} < r < x^{1/3+4\delta/3 -4\omega/3}\}$.
> Consider triples $(\omega,\gamma,\delta)$ which satisfy the following inequality: $28\omega +9\gamma +8\delta <4$.
> For such triples $(\omega,\gamma,\delta)$, convolution $f$ has equidistribution properties for moduli in
> $D_{III}(x;\omega,\gamma,\delta;\varepsilon)$.

Followed by: "This lemma is a variant of Theorem 2.8(v) of Polymath [1]." The uniformity note after Lemma 3 applies.
Depends on [2] Definition 6 (i), (iii) (located at scale; smooth at scale, quoted in `TypeIBakerIrving.source.md`),
Definition 7 and §1 notation (unfolded in `TypeIIPolymath.source.md`).

## What [2] Lemma 7 asserts, in my words

- **Objects.** A quadruple convolution: $\alpha$ any coefficient sequence at scale $M(x)$ (no Siegel-Walfisz), and three
  smooth coefficient sequences $\psi_i$ at scales $N_i(x)$. $MN_1N_2N_3\asymp x$.
- **$\gamma$ here is not $\log_x N$.** Unlike Lemmas 3-6, $\gamma$ is a free parameter bounding the three smooth scales:
  each pairwise product $N_iN_j\gg x^{1-\gamma}$, and each $x^{1-2\gamma}\ll N_i\ll x^\gamma$ — constant-factor slack
  ($\ll$, $\gg$), no $x^{o(1)}$ slack.
- **Moduli.** $D_{III}$: natural $d\le x^{1/2+2\omega}$ with one divisor $r$ in the open window
  $(x^{1/3+\delta/3-4\omega/3},\ x^{1/3+4\delta/3-4\omega/3})$ (the source writes the lower exponent as
  $1/3+4\delta/3-4\omega/3-\delta$). **This window does not involve $\varepsilon$**, unlike Lemmas 3-6; $\varepsilon$ enters
  only through Def. 7's quantifier. Squarefree via Def. 7.
- **Parameter range.** Exactly $28\omega+9\gamma+8\delta<4$, strict, one inequality. No stated sign conditions; no stated
  $\omega<1/12$ (for nonempty $N_i$ ranges one needs $1-2\gamma\le\gamma$, i.e. $\gamma\ge\frac13$, and then the inequality
  forces $\omega<\frac1{28}$ when $\delta\ge0$ — my algebra; the lemma itself does not say so).
- **Conclusion and quantifiers.** Def. 7 as in Lemma 3: $\exists\varepsilon^*(\omega,\gamma,\delta)\ \forall\varepsilon<\varepsilon^*\ \forall A>0\ \exists C(A,\varepsilon)\ \forall x>1\ \forall a$
  coprime to all primes $\le x$: $\sum_{d\in D_{III},\ d\text{ sqfree}}|\sum_{n\in[x,2x],n\equiv a(d)}f-\frac1{\phi(d)}\sum_{n\in[x,2x],(n,d)=1}f|\le Cx/\log(x)^A$.
- **Status.** [2] §3.2: Theorem 2.8(v) of [1] is the one result whose proof does not start from [1] §5; Lemma 7's proof is
  a sketch of changes.

## [1] Theorem 2.8(v), quoted from the TeX source (v3)

> **Theorem 2.8 (New Type I, II, III estimates).** Let $\varpi,\delta,\sigma > 0$ be fixed quantities. ...
> (v) If $\sigma > \frac{1}{18} + \frac{28}{9} \varpi + \frac{2}{9} \delta$ and $\varpi<1/12$, then
> $\mathrm{Type}_{III}^{(1)}[\varpi,\delta,\sigma]$ holds.
> The proofs of the claims in (iii) and (v) require Deligne's work on the Riemann Hypothesis over finite fields ...

Definition 2.6 (iii) (with $0<\varpi<1/4$, $0<\delta<1/4+\varpi$, $0<\sigma<1/2$ fixed): "We say that
$\mathrm{Type}_{III}^{(i)}[\varpi,\delta,\sigma]$ holds if, for any $I$ and $a\ (P_I)$ as above, for any quantities
$M, N_1,N_2,N_3 \gg 1$ which satisfy the conditions $M N_1 N_2 N_3 \sim x$, $N_1 N_2, N_1 N_3, N_2 N_3 \gtrapprox x^{1/2+\sigma}$,
$x^{2\sigma} \lessapprox N_1,N_2,N_3 \lessapprox x^{1/2-\sigma}$, for any coefficient sequences $\alpha,\psi_1,\psi_2,\psi_3$
located at scales $M$, $N_1$, $N_2$, $N_3$, respectively, with $\psi_1,\psi_2,\psi_3$ smooth, and finally for any
$Q \lessapprox x^{1/2+2\varpi}$, we have
$\sum_{q\leq Q,\ q \in \mathcal{D}_I^{(i)}(x^\delta)} |\Delta(\alpha \star \psi_1 \star \psi_2 \star \psi_3; a\ (q))| \ll x \log^{-A} x$
for any fixed $A>0$."

Depends on [1] Definition 1.2, 2.1, 2.2, (2.2), 2.5 (incl. (iii) smooth at scale $N$: $\alpha(n)=\psi(n/N)$, $\psi$ smooth,
supported on a fixed $[c,C]$, $|\psi^{(j)}|\ll\log^{O(1)}x$ for fixed $j$), (1.1); unfolded in `TypeIIPolymath.source.md`.

### What [1] Theorem 2.8(v) asserts, in my words

For fixed $0<\varpi<1/12$, $0<\delta<1/4+\varpi$, $0<\sigma<1/2$ with $\sigma>\frac1{18}+\frac{28}9\varpi+\frac29\delta$: for
every bounded $I$, primitive $a\ (P_I)$, scales with $MN_1N_2N_3\sim x$, $N_iN_j\gtrapprox x^{1/2+\sigma}$,
$x^{2\sigma}\lessapprox N_i\lessapprox x^{1/2-\sigma}$, coefficient sequences ($\psi_i$ smooth), $Q\lessapprox x^{1/2+2\varpi}$ and
fixed $A$: the sum over squarefree, ($1$-tuply) $x^\delta$-densely divisible $q\le Q$ with primes in $I$ of
$|\Delta(\alpha\star\psi_1\star\psi_2\star\psi_3;a\ (q))|$ is $\ll x\log^{-A}x$.

## The two cited statements are not the same statement

Substituting $\sigma=\frac12-\gamma$ (my substitution; [2] does not state it) maps [1]'s scale conditions onto [2]'s
($x^{1/2+\sigma}=x^{1-\gamma}$, $x^{2\sigma}=x^{1-2\gamma}$, $x^{1/2-\sigma}=x^\gamma$) and [1]'s inequality onto
$28\varpi+9\gamma+2\delta<4$. [2] has $28\omega+9\gamma+\mathbf{8}\delta<4$: a stronger hypothesis on $\delta$ (the price,
as read, of the relaxed moduli). Further: (a) moduli: [1] densely divisible squarefree with primes in $I$; [2] one divisor in
a window at $x^{1/3+\dots}$; (b) [1] states $\varpi<1/12$, [2] does not; (c) [1]'s scale hypotheses have $x^{o(1)}$ slack
($\lessapprox$/$\gtrapprox$), [2]'s have constant slack only, so [1] admits more scale configurations; (d) residue, $[x,2x]$
cut-off as for Type II. A Lean premise can match at most one of them literally.
