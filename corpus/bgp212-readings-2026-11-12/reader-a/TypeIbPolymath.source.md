# TypeIbPolymath — the source statements (read before the Lean file was opened)

Cited (as the brief gives the Lean file's citation): [2] Lemma 4; [1] Theorem 2.8(ii).
Read: [2] = arXiv 2608.31126v1; [1] = arXiv 1402.0811v3. Pins in `sources.json`. This is a reading, not a decision.

## [2] Lemma 4 (Polymath Type I(ii)), quoted from the TeX source

> Suppose $f(n;x) = (\alpha \star \beta)(n;x)$, where $\alpha$ is coefficient sequence at scale $M$ and $\beta$ is a
> coefficient sequence at scale $N$ with $M(x) N(x) \asymp x$ and $N(x) \leq x^{1/2}$. Suppose also that $\beta$ has the
> Siegel-Walfisz property. Write $N(x) = x^\gamma$. Define the set of moduli
> $D_{IIb}(x;\omega,\gamma,\delta;\varepsilon) = \{d \in [1, x^{1/2+2\omega}]\cap \mathbb{N}: \exists r \mid d \ \exists u \mid \tfrac{d}{r} \text{ with } x^{\gamma -3\varepsilon-\delta} < r < x^{\gamma - 3\varepsilon} \text{ and } x^{1/2 -\gamma-2\omega -6 \varepsilon-\delta } < u < x^{1/2-\gamma-2\omega -6\varepsilon}\}$.
> Consider triples $(\omega,\gamma,\delta)$ which satisfy the following inequalities:
> $24\omega +7\delta -3\gamma <-1$, $8\omega+3\delta - \gamma <0$.
> For such triples $(\omega,\gamma,\delta)$, convolution $f$ has equidistribution properties for moduli in
> $D_{IIb}(x;\omega,\gamma,\delta;\varepsilon)$.

Followed by: "This lemma is a variant of Theorem 2.8(ii) of Polymath [1]." The uniformity note after Lemma 3 (strict
inequalities; with room $\varepsilon_1$ to spare, one $\varepsilon$ and a triple-independent constant) applies "in all
subsequent lemmas". Naming: [2] titles the lemma "Type I(ii)" but names its moduli set $D_{IIb}$.

Depends on: [2] Definition 6 (coefficient sequences, located at scale, Siegel-Walfisz property), Definition 7
(equidistribution for moduli in $D(x;\omega,\gamma,\delta;\varepsilon)$), §1 notation. Their full text and my unfolding
are in `TypeIIPolymath.source.md` (identical conventions; not repeated).

## What [2] Lemma 4 asserts, in my words

- **Objects.** As in Lemma 3: $\alpha$ a coefficient sequence at scale $M(x)$, $\beta$ at scale $N(x)$ with Siegel-Walfisz;
  $M(x)N(x)\asymp x$; $N(x)\le x^{1/2}$; $\gamma$ defined by $N(x)=x^\gamma$ and treated as a fixed coordinate of the triple.
- **Moduli.** $D_{IIb}$: natural $d\le x^{1/2+2\omega}$ admitting a divisor $r$ in $(x^{\gamma-3\varepsilon-\delta},x^{\gamma-3\varepsilon})$
  AND a divisor $u$ of the cofactor $d/r$ in $(x^{1/2-\gamma-2\omega-6\varepsilon-\delta},x^{1/2-\gamma-2\omega-6\varepsilon})$.
  Both windows open, each of multiplicative width $x^\delta$; $r$ and $u$ are coprime parts only in the sense that $u\mid d/r$
  (for squarefree $d$ this makes them coprime). Squarefreeness enters through Def. 7's sum. No smoothness or dense
  divisibility of $d$.
- **Parameter range.** Exactly: $24\omega+7\delta-3\gamma<-1$ and $8\omega+3\delta-\gamma<0$, strict. No stated sign
  conditions on $\omega,\delta$; no stated lower bound on $\gamma$ other than what these force
  ($\gamma>\frac13+8\omega+\frac73\delta$ from the first).
- **Conclusion and quantifiers.** Def. 7: there is a threshold $\varepsilon^*(\omega,\gamma,\delta)$; for every
  $\varepsilon\in(0,\varepsilon^*)$, every $A>0$, a constant $C(A,\varepsilon)$ such that for all $x>1$ and all $a$
  coprime to every prime $\le x$: $\sum_{d\in D_{IIb},\ d\text{ squarefree}}|\sum_{n\in[x,2x],n\equiv a(d)}f(n;x)-\frac{1}{\phi(d)}\sum_{n\in[x,2x],(n,d)=1}f(n;x)|\le C\,x/\log(x)^A$.
  Implicitly the constant also depends on the sequences' own constants (my reading; not stated).
- **Status.** Proof in [2] §3.2 is a sketch of the changes to [1]'s proof, using the second inequality of [1]
  Corollary 4.16 (recorded as [2] Lemma 9) instead of the $q$-van der Corput bound.

## [1] Theorem 2.8(ii), quoted from the TeX source (v3)

> **Theorem 2.8 (New Type I, II, III estimates).** Let $\varpi,\delta,\sigma > 0$ be fixed quantities. ...
> (ii) If $56\varpi + 16\delta + 4 \sigma < 1$, then $\mathrm{Type}_{I}^{(2)}[\varpi,\delta,\sigma]$ holds.

Definition 2.6 (i), with "$0 < \varpi < 1/4$, $0 < \delta < 1/4+\varpi$, and $0 < \sigma < 1/2$ ... fixed quantities, and
let $i \geq 1$ be a fixed natural number": "We say that $\mathrm{Type}_I^{(i)}[\varpi,\delta,\sigma]$ holds if, for any $I$
and $a\ (P_I)$ as above, any quantities $M,N \gg 1$ with $M N \sim x$ and $x^{1/2-\sigma} \lessapprox N \lessapprox x^{1/2-2\varpi-c}$
for some fixed $c>0$, any $Q \lessapprox x^{1/2+2\varpi}$, and any coefficient sequences $\alpha,\beta$ located at scales
$M,N$ respectively, with $\beta$ having the Siegel-Walfisz property, we have
$\sum_{q\leq Q,\ q \in \mathcal{D}_I^{(i)}(x^\delta)} |\Delta(\alpha \star \beta; a\ (q))| \ll x \log^{-A} x$ for any fixed $A>0$."

Depends on [1] Definition 1.2, 2.1, 2.2, (2.2), 2.5, (1.1), unfolded in `TypeIIPolymath.source.md`. For $i=2$
("doubly densely divisible", Def. 2.1 with $i=2$): for each split $j+k=1$ and each $1\le R\le x^\delta q$ a factorisation
$q=q'r$, $x^{-\delta}R\le r\le R$, with $q'$ $j$-tuply and $r$ $k$-tuply $x^\delta$-densely divisible.

### What [1] Theorem 2.8(ii) asserts, in my words

For fixed $0<\varpi<1/4$, $0<\delta<1/4+\varpi$, $0<\sigma<1/2$ with $56\varpi+16\delta+4\sigma<1$: for every fixed $c>0$,
every bounded $I$, primitive $a\ (P_I)$, $MN\sim x$ with $x^{1/2-\sigma}\lessapprox N\lessapprox x^{1/2-2\varpi-c}$,
$Q\lessapprox x^{1/2+2\varpi}$, coefficient sequences $\alpha,\beta$ (at $M,N$; $\beta$ Siegel-Walfisz) and fixed $A$: the
sum over squarefree, doubly $x^\delta$-densely divisible $q\le Q$ with prime factors in $I$ of $|\Delta(\alpha\star\beta;a\ (q))|$
is $\ll x\log^{-A}x$.

## The two cited statements are not the same statement

(a) moduli: [1] doubly densely divisible squarefree $q$ with primes in $I$; [2] $d$ with two divisors $r$, $u\mid d/r$ in
specified windows; (b) numerics: [1] $56\varpi+16\delta+4\sigma<1$ with $N\gtrapprox x^{1/2-\sigma}$ (with $\sigma=\frac12-\gamma$
this is $56\varpi+16\delta-4\gamma<-1$ — my algebra); [2] $24\omega+7\delta-3\gamma<-1$ and $8\omega+3\delta-\gamma<0$ — a
different numerology, not a re-parametrisation; (c) [1] requires $N\lessapprox x^{1/2-2\varpi-c}$, [2] only $N\le x^{1/2}$;
(d) residue, $[x,2x]$ cut-off and $o(1)$ slack differ as for Type II. [2] calls it "a variant". A Lean premise can match
at most one of them literally.
