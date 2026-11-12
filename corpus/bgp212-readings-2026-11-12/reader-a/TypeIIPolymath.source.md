# TypeIIPolymath — the source statements (read before the Lean file was opened)

Cited (as the brief gives the Lean file's citation): [2] Lemma 3; [1] Theorem 2.8(iv).
Read: [2] = arXiv 2608.31126v1 (Stadlmann, "Bounded gaps between primes"); [1] = arXiv 1402.0811v3 (Polymath,
"New equidistribution estimates of Zhang type"). Pins in `sources.json`. This is a reading, not a decision.

## [2] Lemma 3 (Polymath Type II), quoted from the TeX source

> Suppose $f(n;x) = (\alpha \star \beta)(n;x)$, where $\alpha$ is coefficient sequence at scale $M$ and $\beta$ is a
> coefficient sequence at scale $N$ with $M(x) N(x) \asymp x$ and $N(x) \leq x^{1/2}$. Suppose also that $\beta$ has the
> Siegel-Walfisz property. Write $N(x) = x^\gamma$. Define the set of moduli
> $D_{IIa}(x;\omega,\gamma,\delta;\varepsilon) = \{d \in [1, x^{1/2+2\omega}]\cap \mathbb{N}: \text{There exists a divisor } r \mid d \text{ with } x^{\gamma -3\varepsilon-\delta} < r < x^{\gamma - 3\varepsilon}\}$.
> Consider triples $(\omega,\gamma,\delta)$ which satisfy the following inequalities:
> $24\omega + 7\delta -5\gamma <-2$, $8\omega + 3\delta -\gamma <0$.
> For such triples $(\omega,\gamma,\delta)$, convolution $f$ has equidistribution properties for moduli in
> $D_{IIa}(x;\omega,\gamma,\delta;\varepsilon)$.

Followed by: "This lemma is a variant of Theorem 2.8(iv) of Polymath [1], and serves as replacement for Theorem 2.8(i)."
And the note that governs Lemmas 3-7: "permissible $(\omega,\gamma,\delta)$ are defined via strict inequalities. If we
restrict the choice of $(\omega,\gamma,\delta)$ to triples which satisfy these inequalities with room to spare (e.g. for
some fixed $\varepsilon_1$ ...), then $\varepsilon$ can be chosen uniformly in $(\omega,\gamma,\delta)$. This means that
we can ensure that the implied constant in the equidistribution estimate does not depend on the triple."

### Definitions the statement depends on ([2] §3.1)

- Definition 6 (coefficient sequences): a function $\alpha:\mathbb{N}\times(1,\infty)\to\mathbb{R}$ with
  $|\alpha(n;x)| \ll \tau(n)^{O(1)}\log(x)^{O(1)}$. (i) located at scale $N(x)$: there are constants $1\ll c\ll C\ll 1$ with
  $\alpha(\cdot;x)$ supported on $[cN(x),CN(x)]$ for every $x>1$. (ii) Siegel-Walfisz property:
  $|\sum_{n\equiv a (q),(n,r)=1}\alpha(n;x) - \frac{1}{\phi(q)}\sum_{(n,qr)=1}\alpha(n;x)| \ll_A \tau(qr)^{O(1)} N(x)/\log(x)^A$
  "for any $x>1$, any $q, r \geq 1$, any $A >1$, and any residue class $a$ mod $q$ with $(a,q)=1$."
- Convolution: $(\alpha\star\beta)(n)=\sum_{d\mid n}\alpha(d)\beta(n/d)$ (the $x$ argument carried along).
- Definition 7 (equidistribution for moduli in $D(x;\omega,\gamma,\delta;\varepsilon)$): "For any sufficiently small
  $\varepsilon >0$ and for all $x>1$ and $A>0$, and for all $a \in \mathbb{Z}$ with $(a,p)=1$ for $p \leq x$,
  $\sum_{d \in D(x;\omega,\gamma,\delta;\varepsilon),\ d \text{ squarefree}} | \sum_{n \in [x,2x],\ n \equiv a (d)} f(n;x) - \frac{1}{\phi(d)} \sum_{n \in [x,2x],\ (n,d)=1} f(n;x) | \ll_{A,\varepsilon} x/\log(x)^A$.
  Note that the implied constant is only allowed to depend on $\omega$, $\gamma$ and $\delta$ insofar that they determine
  which $\varepsilon$ are sufficiently small."
- §1 Notation: "$X \ll_A Y$ ... the implied constant may depend on $A$."

## What [2] Lemma 3 asserts, in my words

- **Objects.** Two coefficient sequences in the sense of Def. 6: $\alpha$ at scale $M(x)$ (no arithmetic hypothesis), $\beta$
  at scale $N(x)$ with the Siegel-Walfisz property. $M(x)N(x)\asymp x$ (two-sided, fixed constants). $N(x)\le x^{1/2}$ for
  every $x$ (an upper bound only; no lower bound on $N$ beyond what the two inequalities force on $\gamma$).
- **$\gamma$.** Defined by $N(x)=x^\gamma$ and then treated as one coordinate of a triple constrained by fixed strict
  inequalities, so literally $\gamma$ is a constant exponent. The case of an $x$-dependent exponent is reached only through
  the uniformity note (triples with room $\varepsilon_1$ to spare get one $\varepsilon$ and one constant).
- **Moduli.** $D_{IIa}$: every natural $d\le x^{1/2+2\omega}$ having at least one divisor $r$ in the open window
  $(x^{\gamma-3\varepsilon-\delta}, x^{\gamma-3\varepsilon})$. No smoothness, no dense divisibility, no prime-in-$I$
  restriction on $d$; squarefreeness enters only through Def. 7's sum. The level is $x^{1/2+2\omega}$ exactly (not
  $x^{1/2+2\omega+o(1)}$).
- **Parameter range.** Exactly the two strict inequalities $24\omega+7\delta-5\gamma<-2$ and $8\omega+3\delta-\gamma<0$.
  The lemma states no sign condition on $\omega$ or $\delta$ (in §4 it is applied with $\omega$ possibly slightly
  negative, $\omega_0\in[-\epsilon,\omega(j,j')]$; $\delta>0$ comes from Def. 1).
- **Conclusion and quantifier order** (Def. 7 unfolded): for $f=\alpha\star\beta$ and each admissible triple, there is a
  threshold $\varepsilon^*(\omega,\gamma,\delta)>0$ such that for every $\varepsilon\in(0,\varepsilon^*)$ and every $A>0$
  there is a constant $C(A,\varepsilon)$ with: for all $x>1$ and all $a\in\mathbb{Z}$ coprime to every prime $p\le x$ (one
  $a$ for all moduli; $a$ may depend on $x$; the bound is uniform in $a$), the sum over squarefree $d\in D_{IIa}$ of the
  absolute discrepancy of $f(\cdot;x)$ restricted to the closed interval $n\in[x,2x]$ is at most $C\,x/\log(x)^A$.
  The main term is $\frac{1}{\phi(d)}\sum_{n\in[x,2x],(n,d)=1}f$.
- **What the constant may depend on.** Stated: $A$ and $\varepsilon$, and the triple only through the threshold. Implicit
  (my reading, not stated): it must also depend on the sequences' own implied constants (the $O(1)$ exponents and
  constants of Def. 6, $c$, $C$, the $\asymp$ constants, the Siegel-Walfisz constants), since multiplying $\alpha$ by a
  constant scales the left side.
- **Status.** [2] §3.2 proves Lemmas 3-7 by sketch: "it is not practical to write down full proofs of the new versions
  listed above. Instead we will just explain the particular changes we make." Lemma 3's proof (via [2] Lemma 8, the
  relaxed Theorem 5.8 of [1]) substitutes $N=x^\gamma$ into the two inequalities below (5.36) of [1] instead of assuming
  $\gamma>\frac12-2\omega-c$.

## [1] Theorem 2.8(iv), quoted from the TeX source (v3)

> **Theorem 2.8 (New Type I, II, III estimates).** Let $\varpi,\delta,\sigma > 0$ be fixed quantities. ...
> (iv) If $68\varpi + 14 \delta < 1$, then $\mathrm{Type}_{II}^{(1)}[\varpi,\delta]$ holds.

Definition 2.6 (ii) ([1] §2.2): with "$0 < \varpi < 1/4$, $0 < \delta < 1/4+\varpi$ ... fixed quantities", $I$ an arbitrary
bounded subset of $\mathbb{R}$, $P_I=\prod_{p\in I}p$, $a\ (P_I)$ a primitive class: "We say that
$\mathrm{Type}_{II}^{(i)}[\varpi,\delta]$ holds if, for any $I$ and $a\ (P_I)$ as above, any quantities $M,N \gg 1$
obeying [$MN\sim x$] and $x^{1/2-2\varpi-c} \lessapprox N \lessapprox x^{1/2}$ for some sufficiently small fixed $c>0$, any
$Q \lessapprox x^{1/2+2\varpi}$, and any coefficient sequences $\alpha,\beta$ located at scales $M,N$ respectively, with
$\beta$ having the Siegel-Walfisz property, we have
$\sum_{q\leq Q,\ q \in \mathcal{D}_I^{(i)}(x^\delta)} |\Delta(\alpha \star \beta; a\ (q))| \ll x \log^{-A} x$ for any fixed $A>0$."

Depends on: Definition 1.2 (asymptotic notation: $x$ a large parameter tending to infinity; "fixed" = independent of $x$;
$X\ll Y$ means $|X|\le CY$ for a fixed $C$; $X\lessapprox Y$ means $X\le x^{o(1)}Y$; $X\sim Y$ means $Y\ll X\ll Y$);
Definition 2.1 ($i$-tuply $y$-dense divisibility; for $i=1$: for every $1\le R\le yn$ a factorisation $n=qr$ with
$y^{-1}R\le r\le R$); Definition 2.2 and (2.2) ($\mathcal{D}_I^{(i)}(y)=\mathcal{S}_I\cap\mathcal{D}^{(i)}(y)$, $\mathcal{S}_I$
the squarefree numbers with all prime factors in $I$); Definition 2.5 (coefficient sequences: finitely supported, may
depend on $x$, $|\alpha(n)|\ll\tau^{O(1)}(n)\log^{O(1)}x$; located at scale $N$: support in $[cN,CN]$, $1\ll c<C\ll 1$;
Siegel-Walfisz: $|\Delta(\alpha 1_{(\cdot,r)=1}; a\ (q))|\ll\tau(qr)^{O(1)}N\log^{-A}x$ for any $q,r\ge1$, fixed $A$,
primitive $a\ (q)$); (1.1) the discrepancy $\Delta(\alpha;a\ (q))=\sum_{n=a\,(q)}\alpha(n)-\frac{1}{\phi(q)}\sum_{(n,q)=1}\alpha(n)$
over all $n$ (no $[x,2x]$ cut-off).

### What [1] Theorem 2.8(iv) asserts, in my words

For fixed $0<\varpi<1/4$, $0<\delta<1/4+\varpi$ with $68\varpi+14\delta<1$: there is a fixed $c>0$ (small) such that for
every bounded $I$ and primitive $a\ (P_I)$, all $M,N\gg1$ with $MN\sim x$ and $x^{1/2-2\varpi-c}\lessapprox N\lessapprox x^{1/2}$,
all $Q\lessapprox x^{1/2+2\varpi}$, all coefficient sequences $\alpha,\beta$ at scales $M,N$ with $\beta$ Siegel-Walfisz,
and every fixed $A$: the sum over squarefree, $x^\delta$-densely divisible $q\le Q$ with prime factors in $I$ of
$|\Delta(\alpha\star\beta;a\ (q))|$ is $\ll x\log^{-A}x$, the constant depending only on fixed quantities.

## The two cited statements are not the same statement

[2] itself calls Lemma 3 "a variant" of [1] 2.8(iv). Differences, as read: (a) moduli: [1] squarefree, prime factors in
$I$, densely divisible, $q\le Q\lessapprox x^{1/2+2\varpi}$; [2] any $d\le x^{1/2+2\omega}$ with one divisor in a width-$x^\delta$
window, squarefree; (b) range of $N$: [1] only $N\gtrapprox x^{1/2-2\varpi-c}$; [2] any $N=x^\gamma\le x^{1/2}$ meeting the
two inequalities; (c) numerics: [1] $68\varpi+14\delta<1$; [2] $24\omega+7\delta-5\gamma<-2$ and $8\omega+3\delta-\gamma<0$
(at $\gamma=\frac12-2\omega$ the first becomes $68\omega+14\delta<1$ — my algebra); (d) residue: [1] $a$ primitive mod $P_I$;
[2] $a$ coprime to every prime $\le x$; (e) sum: [1] over all $n$ (sequences located near $x$); [2] over $n\in[x,2x]$;
(f) [1] has $o(1)$ slack ($\lessapprox$), [2] has none. A Lean premise can match at most one of them literally.
