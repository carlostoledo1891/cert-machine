# rational.py and lower.py: two independent exact checkers for the blinking-light record

Written 2026-11-19 by an agent of the control room, under the pre-registration's independence rule
(`notes/blinking-light-preregistration-2026-11-19.md`, "Who decides"). Python 3.9 standard library only. Nothing here
is committed by its author.

## 1. Gaps and limits (read these first)

**What `lower.py` does not establish.**

- It decides the FINITE conditions of a certificate only: (D1) for both lamp values, (LOC), continuity, and the
  arithmetic l1 C1 + l2 C2 + mu = bound. It does not decide Theorem D (weak duality, `lifting.md` §3), Theorem C or
  Lemma S (locality, `locality.md`). Those are what turn L1 into g(3/10, 2/25) >= 0.3657254238. A PROVED from
  `lower.py` is a statement about the certificate's polynomial inequalities. The lower bound on g stays conditional
  on two theorems that no machine has checked.
- The conditions it checks are my reading of those theorems' text (§3 below). I re-derived them and they agree with
  the pre-registration. If the theorems needed a different condition, `lower.py` would be checking the wrong thing,
  and it cannot detect that itself.
- The layout of `functions` is not labelled in the files; it is inferred (§4). The evidence is strong: a parity
  pattern across seven files, and every alternative layout tried is refuted. It is still an inference. A different
  intended layout would make PROVED a statement about a different certificate.
- The certificate functions are read as independent of the lamp value f, as `locality.md` states for this family.
  Theorem D allows f-dependence, but the format has no slot for it.
- Continuity is checked as "the odd functions vanish at h = 0". Interpolation between knots is continuous by
  construction, so nothing else can break it. The C^3-up-to-the-boundary hypothesis of Theorem C holds because every
  function is a polynomial on each closed strip.
- One implementation only. The soundness argument (§5) rests on:
  - the direct evaluator being a faithful transcription of the formulas. It is short, and it is cross-checked
    against Theorem C's original-coordinate statement (§6);
  - Python's exact `int`/`Fraction` arithmetic;
  - the Bernstein enclosure property;
  - the coverage logic of the bisection.
- If bisection reaches its level limit (40 per direction) or its budget (400,000 boxes per strip and condition)
  without a sign, the verdict is REFUSED ("not proved"). It is never REFUTED without an exact negative value at a
  rational point. A condition with an exact zero at a non-dyadic interior point would come out REFUSED, not PROVED
  (tested, §6). None of the files checked here has such a zero.

**What `rational.py` does not establish.**

- It decides only files whose rates are ALL rational. U2 (`run/claude/mix156.json`, two free rates in a 10^-30 box)
  is out of scope and is refused; U2 rests on `lamp` alone.
- It checks C1 and C2 against the file's own `target` and uses the file's own `r`. It reports both, but does not
  insist that they are (3/10, 2/25) and 2; the judge must.
- An edge listed without its reverse is REFUSED (the format's word), not REFUTED, even though its infinite sigma
  would refute any finite claim.

**Not done here.**

- Neither program was run on U2's controls (KU2a, KU2b): U2 is out of scope.
- The record's judge (`judge.py`) is not mine. While I worked, `lamp.py` (sha256 988cfe18…, the run's checker),
  `judge.py` and `README.md` appeared in this folder, written by another session. I did not open any of them.

## 2. What was read, and what was not

Read:
- `notes/blinking-light-preregistration-2026-11-19.md`
- `corpus/blinking-light/run/GOAL.md`
- `corpus/blinking-light/run/claude/lifting.md` and `locality.md`
- the data files: the seven `run/claude/cert*.json`, `run/gpt/rational-mixture-84.json`,
  `run/inherited/baseline/ring.json`, and `run/claude/mix156.json` (only its keys, to confirm the refusal)
- the format definitions for lamp-network-1, quoted in the task

Also loaded, but not relied on: `corpus/blinking-light/run/CLAUDE.md`, the Claude track's brief. It was loaded
automatically into context when I read a file in that folder. It contains no method and was not used.

Not opened:
- any `.py` file under `corpus/blinking-light/` or `~/Projects/multitrack/` (`lamp.py`, `lamp-v2.py`,
  `verify_local.py`, `review_local_certificate.py`, `cert_falsify.py`, `fit.py`, `plain.py`, `ring.py`, …)
- `claude/notes.md` and every other `.md` under `run/gpt/` or `run/claude/`
- `chat/`, `CHAT.md`, `run/control/tests/`
- the `.log` files
- `lamp.py`, `judge.py` and `README.md` in this folder

None of those programs was run.

## 3. (D1) and (LOC), re-derived and compared with the pre-registration

Notation of the theorems:
- β, γ, ψ are the certificate functions on the square of labels (w, v);
- p = (β+γ)/2 and q = (β−γ)/2, so β = p + q and γ = p − q;
- h = (w+v)/2 and d = (w−v)/2, so w = h + d and v = h − d.

The square |w|, |v| <= 1 is the diamond |h| + |d| <= 1, because max(|h+d|, |h−d|) = |h| + |d|.

**(D1).** Theorem D asks, for every label and both lamp values:

    β (w − f) + γ (v − f) − l1 f (w + v)/2 − l2 w v − mu >= 0.

Substituting:
- β (w − f) + γ (v − f) = (p+q)(h+d−f) + (p−q)(h−d−f) = 2 p (h − f) + 2 q d;
- f (w + v)/2 = f h;
- w v = h² − d².

So (D1) is

    2 p (h − f) + 2 q d − l1 f h − l2 (h² − d²) − mu >= 0   on the diamond, for f = ±1.

This is **identical to the pre-registration's (D1).** `lower.py`'s direct evaluator computes it in the ORIGINAL form
(β, γ, w, v). Its expansion computes the (h, d) form. The two are proved equal on every strip (§5).

**(LOC).** Theorem C's hypothesis, in original coordinates, is Δᵀ D(β,γ) Δ >= ¼ (ξ0·Δ)², where:
- Δᵀ D Δ = (∇β·Δ) Δw + (∇γ·Δ) Δv;
- ξ0 = (β − ψ_w, −γ − ψ_v).

Change to (Δh, Δd), using Δw = Δh + Δd and Δv = Δh − Δd:
- Δᵀ D Δ = 2p_h Δh² + 2(p_d + q_h) Δh Δd + 2q_d Δd², because β_h + γ_h = 2p_h, β_d − γ_d = 2q_d and
  β_d + β_h − γ_h + γ_d = 2(p_d + q_h);
- ξ0·Δ = (2q − ψ_h) Δh + (2p − ψ_d) Δd, because ψ_h = ψ_w + ψ_v and ψ_d = ψ_w − ψ_v.

Multiplying by 4, the condition is PSD of

    [[8 p_h − x1², 4(p_d + q_h) − x1 x2], [same, 8 q_d − x2²]],   x1 = 2q − ψ_h,  x2 = 2p − ψ_d.

This is **identical to Theorem C's matrix and to the pre-registration's (LOC).** It is also consistent with:
- lifting.md's sufficient form of (D2), (Dβ)(Dw) + (Dγ)(Dv) >= (1/16)[(β+β')Dw − (γ+γ')Dv − 2Dψ]², because the
  bracket is τ − τ' ≈ 2 ξ0·Δ;
- the K0 sufficient condition (t+t')/2 <= −((t−t')/2)²/8.

I checked this numerically and exactly as well. Exact forward-mode derivatives in (w, v) of β, γ, ψ give a matrix G
in original coordinates, and det G · 64 = det M exactly at 31 points in each of cert222g, cert222f and cert333. The
factor is 64 because (Δh, Δd) = T(Δw, Δv) with det T = −1/2, so det G = det(M/4)·(det T)² = det M / 64. At cert222f's
witness both are negative.

**Domain of (LOC).** The cells are the strips between consecutive lines h = ±h_k, k = 0..K (h = 0 is a line,
because of |h|), intersected with the diamond. PSD at every interior point of a cell is equivalent to PSD on the
closed cell, by continuity of polynomials. `lower.py` proves the closed form and gives refutation witnesses at
strictly interior points.

**Agreement.** No disagreement with the pre-registration's (D1), (LOC) or continuity. Notation-only differences, not
disagreements: states 1..N against 0..N−1, and k_ij >= 0 against > 0.

Observations, not assumed by the checker:
- In this family D1 is even in d.
- D1(f = −1)(h, d) = D1(f = +1)(−h, −d), under the lamp-flip parity of the format. `lower.py` checks both f on both
  sides anyway.
- The d^10 and d^9 terms of ac − b² cancel: −ξξᵀ has rank 1, so the determinant is quadratic in ξ. `cert222g`'s
  determinant therefore has d-degree 8, not 10.

## 4. The format, as read

`functions` holds na + nk + npsi lists, in the order A_0..A_{na−1}, K_0..K_{nk−1}, P_0..P_{npsi−1}. List i gives that
function's values at the knots 0 = h_0 < … < h_K = 1, linear in |h| between knots. A and P are odd in h
(A(h) = sign(h)·A(|h|)); K is even (K(h) = K(|h|)). Then:

    p = Σ A_k d^(2k),   q = Σ K_k d^(2k+1),   psi = Σ P_k d^(2k+1).

Evidence:
1. **The parity pattern.** In all seven files, with (na, nk, npsi) in {(2,1,1), (2,2,2), (3,2,2), (3,3,3)}, the value
   at h = 0 is exactly 0 at the indices [0, na) and [na+nk, na+nk+npsi), and non-zero at every index in
   [na, na+nk). This is the signature of the order A…, K…, P… with A, P odd and K even.
   For example, cert333 at h = 0 reads 0, 0, 0, 474181/25000, −55447/20000, 526119/100000, 0, 0, 0.
2. **The order of names** in the pre-registration's paragraph: "A_0..A_{na−1}, K_0..K_{nk−1}, P_0..P_{npsi−1}".
3. **Wrong readings all fail.** Under this reading cert222g proves. Each of these alternatives is REFUTED at once:
   - swapping A_0 and A_1: D1 = −0.0297 at (31/400, 369/1600);
   - swapping K_0 and K_1: D1 = −5.99 at (1/400, 399/640);
   - swapping P_0 and P_1: LOC a = −201.9 at (3/400, −397/800);
   - interleaving A_0, K_0, A_1, K_1: D1 = −15.76 at (1/400, −399/800).
4. **The knots** run from 0 to 1, strictly increasing, in every file. `bound` equals l1·(3/10) + l2·(2/25) + mu
   exactly in every file.

## 5. Method and why it is sound

### rational.py

- **Validation.** Every number is a `Fraction`. Edges must be in range, with no self-loops or duplicates, positive
  rates, and every edge's reverse present. The lamp must be ±1. Irreducibility is checked by forward and backward
  reachability from state 0.
- **Out of scope.** A file with "free" or "box" is REFUSED as out of scope.
- **Stationary law.** π comes from the column equations of πL = 0 for j < N−1, plus Σπ = 1, solved by sparse exact
  Gaussian elimination (sparsest pivot). It is then **checked by substitution**: every column of πL is 0 (including
  the dropped one), Σπ = 1, and every π_i > 0.
- **K f and K² f.** Kf solves (rI − L)x = r f, and K²f solves (rI − L)y = r x. Each is checked by substitution.
- **C1 and C2** are exact rationals, compared with the target by equality. REFUTED prints both exact values and
  their differences from the target.
- **σ enclosure.** σ is the exact sum, over unordered pairs, of enclosures of J·ln(a/b), with J = a − b; the sign of
  J is the sign of the logarithm. Each ln x is enclosed by:
  - x = 2^k m with m ∈ [3/4, 3/2], so ln x = k ln 2 + 2 atanh(y) with y = (m−1)/(m+1) ∈ [−1/7, 1/5], and
    ln 2 = 2 atanh(1/3);
  - atanh(y) = Σ y^(2n+1)/(2n+1) for 0 <= y < 1. All terms are >= 0, so a partial sum is a lower bound, and the tail
    after M terms is <= y^(2M+1)/((2M+1)(1 − y²)). Odd symmetry covers y < 0;
  - the partial sums use integer fixed point in 2^−192 units, rounding every product and quotient DOWN for the lower
    sum and UP for the upper sum (all quantities are non-negative). The invariant p_lo/2^W <= y^(2n+1) <= p_hi/2^W
    is kept at every step.

  This is sound without trusting any library's rounding claim. Enclosure widths are about 10^−55. Tested against
  `decimal` at 120 digits on 400 random rationals with up to 40-digit numerators and denominators: every reference
  value lies inside its enclosure.
- **Verdicts.** CERTIFIED if C1 and C2 are exact and, when a claim is given, σ_hi <= claim. REFUTED if σ_lo > claim
  or a target is missed. Otherwise REFUSED. The claim comparison uses the exact rational ends, not the printed
  decimals. The printed decimals are rounded outward.

### lower.py

**Per strip.** Strips are k = 0..K−1, on both sides (h > 0 and h < 0); no symmetry is used. On each strip, p, q and ψ
are polynomials in (h, d): each A_k, K_k and P_k is affine in h there, with the parity applied on the negative side.
The five conditions are built from them:
- D1 for f = +1 and f = −1;
- a = 8p_h − x1², c = 8q_d − x2², and det = ac − b².

The three minors a, c and det are together equivalent to PSD of a symmetric 2×2 matrix; a and det alone are not
enough when a = 0. Derivatives are taken of the strip polynomials.

**Box map.** h = h_lo + (h_hi − h_lo)t and d = (1 − |h|)(2u − 1) map [0,1]² ONTO the closed cell. So a condition is
>= 0 on the cell iff its composition is >= 0 on the box.

**Bernstein form.** The composition is converted exactly to tensor Bernstein form and multiplied by a positive
integer (the LCM of the denominators).

**Search** (exact integer de Casteljau, depth-first):
- all coefficients >= 0 ⇒ the polynomial is >= 0 on that box. It is a non-negative combination of Bernstein basis
  functions, which are >= 0 on the box;
- a negative corner coefficient ⇒ a negative value at that corner, since corner coefficients are values. A rational
  point strictly inside the box is then found near that corner, by halving the distance toward the box centre, and
  the condition is re-evaluated there by the direct evaluator. That point and value are the witness;
- otherwise the box is halved at 1/2, in t or u, whichever has the larger coefficient variation. The halves carry
  the exact Bernstein coefficients of the restricted polynomial times 2^n; common powers of 2 are removed;
- the boxes form a binary partition of [0,1]², so if every leaf is proved, the whole box is.

**Self-checks that are proofs.** Before any search, three exact identity checks run per strip. A failure is
REFUSED ("internal self-check failed").
1. *Expansion = direct evaluator, as polynomials in (h, d).* The direct evaluator works by interpolation and the
   chain rule on the knot data, and computes D1 in the original (β, γ, w, v) form. Both sides have h-degree <= 4 and
   d-degree <= 4·m0, with m0 = 2·max(na, nk, npsi) + 1. Agreement on a 5 × (4m0+1) tensor grid is therefore
   identity.
2. *Composition with the box map = expansion*, on an (n+1) × (m+1) grid in (t, u), where n and m are the
   composition's degree bounds.
3. *The Bernstein array converts back to the power array exactly*, and the integer array equals L × it, with an
   integer L > 0.

So the integer array searched is provably the condition of the definitions, given that the direct evaluator
transcribes them.

**The other checks.**
- *Continuity:* A_k(0) = 0 and P_k(0) = 0 for every k. A failure is REFUTED, with the exact jump of p or ψ across
  h = 0 at a rational d.
- *The arithmetic:* l1 C1 + l2 C2 + mu = bound, exactly. A failure is REFUTED, with the exact difference.

**Witnesses.** A pointwise witness is reported with its strip, the flag `interior: true` (h strictly between knots,
|h| + |d| < 1), the exact value from the direct evaluator (which locates the strip from h alone), and, for LOC, the
matrix entries a, b, c.

## 6. Runs and their outputs

All runs on 2026-11-19, on this 8-core Mac on battery, with `--jobs 4` for `lower.py`. Times are wall-clock.

### rational.py

| file | verdict | N | C1 | C2 | σ enclosure | g enclosure | claim | time |
|---|---|---|---|---|---|---|---|---|
| `run/inherited/baseline/ring.json` | CERTIFIED | 4 | 3/10 | 2/25 | [2.197224577336219382, 2.197224577336219383] | [1.098612288668109691, 1.098612288668109692] | none | 0.04 s |
| `run/gpt/rational-mixture-84.json` | CERTIFIED | 84 | 3/10 | 2/25 | [0.755752463490635672, 0.755752463490635673] | [0.377876231745317836, 0.377876231745317837] | σ <= 0.755752463492 | 8.6 s |
| `run/claude/mix156.json` | REFUSED (out of scope: names free edges) | – | – | – | – | – | – | 0.03 s |

- **The ring:** 2 ln 3 = 2.19722457733621938279… lies inside the enclosure.
- **U1:** the g enclosure lies inside the pre-registration's [0.377876231745, 0.377876231746].
- **Controls**, run from a scratch script:
  - KU1a (rate 0→40 raised by 10^−6): REFUTED, with C1 and C2 printed exactly;
  - KU1b (claim σ <= 0.75575246): REFUTED, since σ_lo = 0.755752463490635672 > claim;
  - the ring with one reverse edge removed: REFUSED ("edge 3->0 listed without its reverse");
  - a two-component network: REFUSED ("not irreducible").

### lower.py, on the certificate files

| file | verdict | objective = bound (exact) | decimal | boxes | time | deepest level (sum of both directions) |
|---|---|---|---|---|---|---|
| `cert222g.json` (L1) | **PROVED** | 1828627119/5000000000 | 0.365725423800 | 3,090 | 3.7 s | D1 6, a 1, c 1, det 9 |
| `cert222f.json` (KL1a) | **REFUTED** | 182881/500000 (matches) | 0.365762000000 | 25 (stopped at first refutation) | 0.2 s | – |
| `cert211.json` | PROVED | 1696431/5000000 | 0.339286200000 | 944 | 0.8 s | det 8 |
| `cert211b.json` | PROVED | 883003/2500000 | 0.353201200000 | 1,910 | 1.5 s | det 11 |
| `cert222.json` | PROVED | 1793781/5000000 | 0.358756200000 | 1,750 | 1.9 s | det 11 |
| `cert322.json` | PROVED | 901571/2500000 | 0.360628400000 | 1,610 | 3.6 s | det 8 |
| `cert333.json` | PROVED | 903439/2500000 | 0.361375600000 | 1,642 | 5.8 s | det 6 |

- **cert222g.** 122 strips × 5 conditions = 610 (strip, condition) pairs, all proved, none undecided. Continuity
  holds, and the bound matches exactly.
- **cert222f.** The witness is LOC det = ac − b², at h = 1023/51200 and d = −2559027/2621440, an interior point of the
  strip |h| ∈ [1/100, 1/50] with h > 0. There det =
  −290932482148623284906052135391445090824697299929721620141279385236450541/1169201309864722334562947866173026415724746034380800000000000000000000000
  ≈ −0.24883, from a ≈ 2.2466, b ≈ −18.756, c ≈ 156.47. The same point in cert222g gives det ≈ +1.0662.
- **D1 margin in cert222g.** On a float grid of 1201 × 301 points the least D1 is 1.98 × 10^−4, at
  (±0.375, −0.3375), which matches the pre-registration's "near 1.9 × 10^−4". Exactly, with the bound adjusted:
  - mu raised by 10^−5: PROVED;
  - mu raised by 3·10^−4: REFUTED (D1 = −3.30 × 10^−5 at (117/320, 13601/40960)).

  So the exact least D1 lies in [10^−5, 3·10^−4).

### lower.py, on the pre-registered controls (cert222g mutated)

- **KL1b** (mu + 1/1000): **REFUTED**. D1 with f = +1 at (819/5120, −546227/655360) has value
  −3754165039411461034780632533839/11805916207174113034240000000000000 ≈ −3.18 × 10^−4. The bound also no longer
  matches, since mu changed.
- **KL1c** (bound + 10^−7): **REFUTED** on the arithmetic: objective − bound = −1/10000000. Every pointwise condition
  still proves (3,090 boxes).
- **KL1d** (P_0 + 1 at the knot h = 3/10): **REFUTED**. LOC a = 8p_h − x1² at (117/400, −283/800) has value
  −10851152469937702992982993612038966361/10485760000000000000000000000000000 ≈ −1034.8.
- **KL1a** (cert222f): REFUTED, above.

Every control was refused; none missed.

### Tests of the checkers themselves (scratch scripts, not kept in the repository)

- **Integer de Casteljau.** 200 random 1-D and 50 random 2-D splits. Each half equals 2^n × the parent on its
  sub-interval, exactly.
- **Search behaviour:**
  - (t−1/3)² + (u−1/3)², a touching zero at a non-dyadic point: undecided (REFUSED) at level 80, never PROVED;
  - the same minus 10^−12: a negative corner found;
  - the same plus 10^−6: PROVED;
  - a double zero on the dyadic line u = 1/2: PROVED.
- **Fault injection.** A 10^−30 change to one coefficient of one strip's det expansion. The identity check refused:
  "expansion != direct … strip 17 side −1".
- **Continuity mutants.** P_0(0) = 1/7 is REFUTED, with the jump of ψ (= 1/7 at d = 1/2) listed. A_0(0) = 1/1000 is
  REFUTED.

## 7. Reproduce

    python3 instruments/blinking-light/rational.py corpus/blinking-light/run/gpt/rational-mixture-84.json
    python3 instruments/blinking-light/rational.py corpus/blinking-light/run/inherited/baseline/ring.json
    python3 instruments/blinking-light/rational.py corpus/blinking-light/run/claude/mix156.json      # REFUSED, exit 1
    python3 instruments/blinking-light/lower.py corpus/blinking-light/run/claude/cert222g.json --jobs 4
    python3 instruments/blinking-light/lower.py corpus/blinking-light/run/claude/cert222f.json --jobs 4   # REFUTED, exit 1

Options:
- `lower.py`: `--c1`, `--c2` (default 3/10, 2/25), `--jobs` (default cores − 2), `--max-level` (40), `--budget`
  (400000), `--progress`.
- `rational.py`: `--bits` (192).
- For import: `rational.decide(net) -> dict` and `lower.check(cert, c1, c2) -> dict`.

sha256 at the time of writing:
- `rational.py`: 1f8d9cffeb815bb42dedc877ddfc7c0791862f2ff99fed6a82354566fba6969a
- `lower.py`: f0c2e01fb548a137ddedebfecf8826bdfef2846afbd5f2ccc1bf2a8a98515edb
