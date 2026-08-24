# program.md — newman-mu

> The briefing. Documentation for whoever works this hunt; **loaded by no code**
> — the machine enforces its rules in `funnel.js` and `target.js`, not here.
> Claimless: nothing in this directory mints, sends, or names anything ours.

## The object

A **Newman polynomial** is `f(z) = sum_{a in A} z^a` with `A` a finite set of
non-negative integers — coefficients all 0 or 1, `n = |A|` terms. Write
`M(A) = min_{|z|=1} |f(z)|` and `mu(n) = sup{ M(A) : |A| = n }`.

The reduction the whole hunt rides:

```
|f(e^{i0})|^2  =  n + 2 * sum_{i<j} cos( (a_j - a_i) * 0 )
```

— an integer-coefficient cosine polynomial in the **autocorrelation** (the
multiset of pairwise differences). With `cos(d*0) = T_d(cos 0)` it becomes an
integer-coefficient polynomial in `y = cos 0` on `[-1,1]`, and its certified
global minimum is exactly what `instruments/trigmin` does. `instruments/trigmin/newman.js`
is the adapter; the certifier core is used **unmodified** — checked, not
assumed: `cheb.polyForSet` refuses duplicate members by design, so the adapter
carries the multiplicities and calls the exported `certifyPoly` directly.

## What is already known, and by whom

Read before this hunt opened, and the reason its bar is what it is. **The
occupancy read ran at the FRONT** (`CHARTER.md` §"Where novelty is supposed to
come from"), and it changed the design twice inside an hour.

| n | witness | M(A) | status |
|---|---|---|---|
| 3 | {0,1,3} | 0.607346… | Campbell–Ferguson–Forcade 1983, proved |
| 4 | {0,1,2,4} | 0.752394… | Goddard 1992, proved |
| 5 | {0,1,2,6,9} | **exactly 1** | Mercer 2019; `mu(5) = 1` conjectured |
| 6 | {0,6,9,10,17,24} | 1.0652858911344152 | Goddard 1992 float grid; **certified** in the sin-mfg `mercer-program` probe, and proved the box maximum out to exponent 55 (3,478,761 sets, every one given an exact verdict) |
| 7 | {0,3,7,8,10,16,22} | 1.1018829384861855 | sin-mfg `mercer-program`, certified box maximum at exponents ≤ 30 |
| 8 | {0,3,9,11,13,16,17,21} | 1.3111013028723255 | sin-mfg `mercer-program`, certified box maximum at exponents ≤ 30 |
| 9 | {0,1,2,3,4,7,8,10,12} | 1.362373178133324 | Boyd 1986 degree-12 champion, cited by Mercer |
| 19 | HJ Eq. (2.1), degree 38 | 2.018174563075912 | Hare–Jankauskas arXiv:1910.13994; their value was an uncertified float (Sage critical points), **certified** in sin-mfg `mercer-program` Rung 4 |

**Two corrections the read forced, recorded because they nearly became the
hunt's premise:**

1. `problem-scout/NEXT_TRACKS_2026-08-20.md` frames "μ(6) > 1" as the open first
   case of Boyd's 1986 conjecture. **It is not open.** Goddard 1992 p. 319 (read
   at source by the sin-mfg `mercer-program` aim read) testifies that Boyd
   "shows f(n) > 1 for 6 ≤ n ≤ 16", and Goddard's own exhaustive grid already
   exhibits the six-term witness. sin-mfg then certified it. A hunt aimed there
   would have rebuilt a result its own lab finished four days earlier.
2. A blind float scan finds six-term sets above 1 in seconds — which is exactly
   why the first framing looked attractive and was wrong. **Ease of finding is
   not evidence of novelty.** The object was in print in 1992.

## The bar

```
bar(n)^2  =  max{ certified M(A')^2 : |A'| < n }
```

the **monotone envelope** of the table above. A HIT is an n-term Newman
polynomial that beats everything achievable with fewer terms — which is the
question of whether `mu` is strictly increasing at n, and is a real statement
rather than a threshold picked to make hits happen.

`bar(n)` is **computed at load time from the witness sets**, never transcribed
(C50). The anchors in `target.js` are exponent lists; their values come out of
our own certifier every run. Measured at build: all five re-derive sin-mfg's
certified numbers to within 1 ulp, and the HJ enclosure comes back **identical
to the byte** — `[4.073028567046649, 4.0730285670466495]` from an adapter
written today against a record written four days ago, with no shared code.

Current envelope: `bar(6)=1`, `bar(7)=1.06528…`, `bar(8)=1.10188…`,
`bar(9)=1.31110…`, `bar(10..19)=1.36237…`, `bar(20+)=2.01817…`.

## Where the frontier actually is

**`10 <= n <= 18`.** Nothing is certified there by anyone we located. The
envelope sits at Boyd's 9-term 1.36237…, so a HIT at those n is the first
Newman polynomial with fewer than 19 terms to beat the 9-term champion.

That matters because of the one genuinely open question in this corner:
**the least n with `mu(n) >= 2`.** Hare–Jankauskas reached it at 19 terms;
Boyd's own estimate was ≤ 272 degree-wise. HJ's search exhausted all
`{0,1}`-polynomials of **degree ≤ 40** — so an 18-term polynomial of degree 45
or 60 is *outside anything anyone has searched*. Their exclusion of the smaller
degrees is itself uncertified (their words: a 94.6-hour double-precision FFT
filter), which is a second, separate front.

**Difficulty, measured before opening the hunt so nobody mistakes this for a
lottery:** 30 seconds of blind hill-climbing at n = 16, 17, 18 tops out around
`min|f| ≈ 1.07–1.12` against the 2.0 that would be needed. The gap is enormous
and structure is doing all the work in the known witnesses. Expect no tripwire.

## The candidate

A **gap vector** `g = [g_1..g_{n-1}]`, every `g_i >= 1`, with
`A = [0, g_1, g_1+g_2, …]`. Every integer vector with entries ≥ 1 is a valid
strictly-increasing exponent set, so the enumerable box has **no invalid
points** — enumerating exponents directly would throw away all but a `1/(n-1)!`
fraction as unsorted.

Schema admits `minItems 5 … maxItems 18`, i.e. `n` in `[6,19]`, which is what
the five planted hits need. **The shipped `enum` and `evolve` generators read
`minItems` as a fixed length, so they search `n = 6` only.** Reaching the
`10..18` frontier needs an instance-local generator — the machine's README makes
the interface, not the shipped files, the contract. Said plainly here so that no
n=6 campaign is ever read as a search of the whole schema.

Canonical form divides out the gcd: dilation `A -> kA` leaves `M` exactly
invariant, so the score is bit-for-bit invariant under it rather than nearly so.

## The screen cascade

1. **`exact-f(-1)`** — `|f(-1)|^2 = (sum (-1)^a)^2` is an **integer**, and
   `-1` is on the circle, so `M^2 <= |f(-1)|^2`. A candidate failing to clear
   the bar here cannot possibly HIT and the rejection is a **proof, not an
   estimate**. Measured on the enum box: kills 31.3% on its own, at the cost of
   `n` integer additions.
2. **`grid-4096`** — float sampling. A sampled minimum can only sit **above**
   the true one, so pruning below the bar is sound. A `1e-9` headroom leaves a
   thin band above the bar to be certified rather than pruned, so near-misses
   come back as enclosures and float slop cannot turn a real hit into silence.

Expected false-negative rate: **0**, and the reject audit measures it rather
than assuming it.

## The certificate

`certifyNewman` builds `|f|^2` **itself** as an exact BigInt polynomial
(`G = n*T_0 + 2*sum m_d T_d`) and certifies its minimum, so no interval step of
ours sits between the certifier and the answer. The first draft certified the
cosine sum and then computed `n + 2*[lo,hi]`; that was sound but **30× looser**
on the HJ witness (1.6e-14 wide against 5.2e-16) and is why the constant is
folded into the polynomial.

`recheckCertificate` re-derives by three paths that do not share code with the
one that produced it: the difference multiset and its conservation identity; an
**independent** polynomial assembly (`chebT` per difference) evaluated
**exactly** in rational arithmetic at every candidate argmin; and a dense
direct sample of `|f|^2` from the exponents, forming no differences at all.
The third exists because a thin forgery agrees with itself at its own midpoint —
the exact spot check cannot see a narrowed enclosure, and the dense sample can.
Both are red-controlled in `battery.js`.

## Forbidden moves

- No claim leaves this directory. Nothing here mints a ledger entry, sends an
  email, or publishes a page.
- The tripwire is a **flag**, never a result. No literature gate has run on
  anything this hunt produces.
- "Certified enclosure", never bare "certified"; enclosures are proofs-of-object
  pending independent verification.
- Do not edit `/Users/carlostoledo/Documents/sin-mfg`. It is read-only from
  here, permanently.
- `battery.js` is green before any campaign. 30 checks, 8 of them red controls.

## Budget

First campaign: `enum`, the full declared box — gap vectors in `[1,8]^5`, 32,768
six-term Newman polynomials, decades `[2,3,4,5]`. Goddard's champion has gap
vector `[6,3,1,7,7]`, so **the known n=6 optimum is inside the box** and a blind
enumeration can reach it. That is deliberate: a baseline that cannot reach the
answer measures nothing.
