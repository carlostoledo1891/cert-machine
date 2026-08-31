Three follow-ups to the above, one of which I should have noticed the first time.

## 1. The same bracket sharpens the OTHER constant in Theorem 8

I had been treating problem 290 as being about the lower bound. It isn't — Theorem 8 is
two-sided, Lemma 31 gives `1/(1+c)` below and Lemma 30 gives `1/(2c)` above, and
both published constants are those two expressions at two decimals under
`0.82 < c < 0.85`. So the same `c` governs both ends, and a bracket for `c` moves
both.

The upper end costs nothing extra. `1/(2c)` decreases in `c`, so it is fed by the
bracket's certified LOWER endpoint — and a lower endpoint charges the unpinned
tail zero, so no tail assumption, no group information above the horizon and no
further degree enters it:

```
liminf (b(a)-a)/log a  <=  1/(2c)  <=  0.602107563430      (published: 0.61)
```

Together with the other end, Theorem 8 would read

```
0.546083759260  <  liminf (b(a)-a)/log a  <  0.602107563430
```

narrowing the published interval from width 0.07 to 0.0560.

Where that actually comes from, since it flatters me otherwise: at the cited
horizon the same division already gave `0.603053548709`. Almost all of the gain
is that `0.82` is a conservative reading of `c`, not that the horizon was short —
my 250 degrees move it by about `0.001`. Same Lemma 32 dependency as everything
else I have posted; no tail assumption on either endpoint.

## 2. I over-sold the fourth digit, and here is what it would actually take

I said above that a window of width `0.1` on `delta` would shrink the tail
tenfold. That is right, but I never worked out which window. The fourth digit of
`1/(1+c)` needs

```
c in (0.830496064433, 0.830831197364)
```

i.e. the tail's `delta` confined to `(0.0990, 0.5156]` — much weaker on the low
side than I would have guessed, and TIGHTER on the high side. Worth saying
plainly: the fourth digit is an OEIS digit, not a theorem digit. No statement
anywhere carries this constant to four places, whereas `0.54 -> 0.546` really is
a sharper constant in a printed theorem. That changes what I think the sequencing
question is worth, in the direction of your own instinct in the thread.

## 3. On the tail lemma — the obstruction may be the kernel, not the image

Writing `G_d <= S_l^+`, `K = G_d ∩ C_2^l` and `pi(G_d) <= S_l`, the useful
direction seems to me to be:

- if `K` contains the even-weight submodule, then over any `sigma` the sign
  vectors form a coset of `K` which surjects onto the fixed coordinates, so the
  conditional probability of fixing a root is exactly `2^(-fix(sigma))` (up to
  the `sigma = id` term, which only helps);
- `t -> 2^(-t)` is convex, so `E[2^(-fix)] >= 2^(-E[fix])`;
- `E[fix] = 1` by Burnside for ANY transitive `pi(G_d)`.

which gives `delta(f_d) <= 1/2` with no primitivity, no Jordan, and no
identification of `pi(G_d)` at all — comfortably inside the `0.5156` ceiling
above. If that is right, the size of the image is not what the tail lemma needs;
it needs `K` to be large, and `K in {0, <diag>}` is the only dangerous case (there
`delta` can rise toward `1 - 1/e`, past the ceiling). Every one of the 250 degrees
I closed came back with `K` full or even-weight — 244 `S_l^+`, 6 even-weight, no
third behaviour — so the hypothesis has never failed, which of course is not a
proof of anything.

The honest blocker underneath all of it: Lemma 32 establishes irreducibility by
`polisirreducible` for even `d <= 500` and the group by Magma for even `d <= 60`.
Both are computations, so for large `d` there is no theorem that `f_d` is
irreducible — and Lemma 38 needs it. I could find no literature on
`Gal(f_d)` at all outside your paper. The one untried lever I can see is a
Newton-polygon argument at primes dividing `d!`, since `f_d(0) = (-1)^d d!`,
`lead(f_d) = d+1` and `h(0) = (-1)^l (l!)^2` — the shape Filaseta and Trifonov
used for Bessel and generalized Laguerre. I have not attempted it.

## A correction to my own write-up

I had credited the composition-discriminant step to Altmann-Awtrey-Cryan-
Shannon-Touchette 2020 and called handling the non-monic leading factor the new
part. Both halves were wrong: that paper is about `x^8 + a x^4 + b` and carries
no general composition law, and the general non-monic law is already written down
(Cullinan, *The discriminant of a composition*), with hypotheses satisfied here
since `Res(h, x^2) = h(0)^2 = (l!)^4 != 0`. Only the `4k(k+1)` characterisation of
the exceptional set appears to be unclaimed. The page is corrected.

Method and code, as before: https://www.carlostoledo.co/reports/erdos290.html
