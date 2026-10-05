# The δ₃ certificate files: what each field means

This is the INTERFACE between the claimant (frontier-apps session 35) and a verifier, and nothing
more. It was written by the porting session on 2026-10-05 from the claimant's serialisers, the
`json.dump` calls that wrote the files. It says what each field denotes. It does not say how to
check anything; that comes from the mathematics in `claimant/THEOREM-EXACT.md`.

A verifier must establish soundness on its own:
- a form it cannot show is nonnegative on its region is refused, whatever this file says;
- a multiplier of the wrong sign is refused;
- a matrix it cannot prove PSD is refused.

If a convention below is wrong, a correct verifier fails a genuine certificate. It never passes a
false one.

The files are `certs/delta3/inner-r20-g24_4_8.json` and four `certs/delta3/slab-*.json`. Every
rational is a JSON string `"p/q"` or `"p"`.

## Common: the grid

- `grid`: strictly increasing integers in units of 1/1096. The first is 0 and the last is 1096.
- Cell i is I_i = [grid[i]/1096, grid[i+1]/1096], for i = 0 … n−1, with n = len(grid) − 1.
- Write w_i = |I_i|, y_i ∈ [0,1] for the average of σ on I_i, and m = Σ_i w_i y_i.
- The claimant asserts that every edge of φ* (the multiples k/548 that end a block) is a grid
  point, so that φ* is constant on each cell with sign s_i.

R = {(a, b) ∈ [0,1]² : a/2 ≤ b ≤ (1+a)/2}.

**Pairs are ORDERED:** pair (i, j) means a ∈ I_i (first coordinate) and b ∈ I_j (second).
Classify each ordered pair by A_in = area(R ∩ (I_i × I_j)):
- A_in = 0: absent;
- A_in = w_i w_j: full;
- otherwise: cut, with A_out = w_i w_j − A_in.

## Slab files (`slab-*.json`)

| field | meaning |
|---|---|
| `lo`, `hi` | the region R_k = {y ∈ [0,1]^n : lo ≤ m ≤ hi} |
| `B`, `eps` | rationals |
| `claim` | the asserted lower bound on R_k; the claimant intends `claim = B − eps·(1+n)` |
| `theta` | one rational per CUT pair, in lexicographic order of (i, j) over all cut pairs |
| `forms` | a list of `[kind, idx, mu]`, with mu a rational multiplier |

L_θ(y) is the sum of:
- per cell: a_i y_i + b_i y_i², the bathtub minorant of THEOREM-EXACT §2, which the verifier
  computes;
- per full pair: s_i s_j w_i w_j y_i y_j;
- per cut pair t = (i, j): θ_t·bound1 + (1 − θ_t)·bound2, where:

| | bound1 | bound2 |
|---|---|---|
| s_i s_j = +1 | 0 | w_i w_j y_i y_j − A_out |
| s_i s_j = −1 | −A_in | −w_i w_j y_i y_j |

The asserted identity holds as polynomials in y:

  L_θ(y) − B − Σ_f mu_f · f(y) = vᵀ S v,   v = (1, y_0, …, y_{n−1}).

S is NOT stored. It is the symmetric (n+1)×(n+1) coefficient matrix of the left side; the left side
is quadratic in y, so S is determined exactly. The asserted conclusion: S + eps·I ⪰ 0, hence
L ≥ L_θ ≥ B − eps·(1+n) on R_k.

**Form kinds**, with z_i = 1 − 2y_i:

| kind | idx | f(y) |
|---|---|---|
| `yy` | [i, j] | y_i y_j |
| `11` | [i, j] | (1 − y_i)(1 − y_j) |
| `y1` | [i, j] | y_i (1 − y_j) |
| `yd` | i | y_i − y_i² |
| `11d` | i | (1 − y_i)² |
| `y` | i | y_i |
| `1` | i | 1 − y_i |
| `mlo` | null | m − lo |
| `mhi` | null | hi − m |
| `mm` | null | (m − lo)(hi − m) |
| `mlo_y` | j | (m − lo) y_j |
| `mlo_1` | j | (m − lo)(1 − y_j) |
| `mhi_y` | j | (hi − m) y_j |
| `mhi_1` | j | (hi − m)(1 − y_j) |
| `tri` | [i, j, k, [s1, s2, s3]] | 1 + s1 z_i z_j + s2 z_j z_k + s3 z_i z_k, with s ∈ {±1} |

## The inner file (`inner-*.json`)

| field | meaning |
|---|---|
| `rin` | the region {y ∈ [0,1]^n : m ≤ rin} |
| `lam` | an object `"i,j" → λ_ij` (i = j allowed): the term λ_ij y_i (1 − y_j) |
| `nu` | a list: the term ν_j y_j (rin − m) |
| `kap` | the term κ m (rin − m) |
| `N` | an object `"i,j" → N_ij` with i ≤ j: the upper triangle of a symmetric matrix N; the term is yᵀNy = Σ_i N_ii y_i² + 2 Σ_{i<j} N_ij y_i y_j |
| `c` | a list: the term c_i y_i |

L₀(y) is the sum of:
- per cell: a_i y_i + b_i y_i²;
- per full pair: s_i s_j w_i w_j y_i y_j;
- per cut pair with s_i s_j = −1: −w_i w_j y_i y_j. A cut pair with s_i s_j = +1 uses the bound
  0, so it contributes nothing.

The asserted identity holds as polynomials (both sides vanish at y = 0):

  L₀(y) = yᵀPy + Σ λ_ij y_i(1 − y_j) + Σ_j ν_j y_j (rin − m) + κ m (rin − m) + yᵀNy + Σ_i c_i y_i.

P is NOT stored. It is whatever makes the quadratic parts agree. The asserted conclusion: P is
PSD (the claimant says positive definite), every multiplier is ≥ 0, and so L₀ ≥ 0 on the region.

## The cover the claimant asserts

inner [0, 1/5] ∪ [1/5, 3/10] ∪ [3/10, 2/5] ∪ [2/5, 9/20] ∪ [9/20, 1/2] ⊇ [0, 1/2].

Together with E(σ) = E(1 − σ), which holds because φ → −φ leaves Q unchanged, this is meant to
give E ≥ 0 for every σ.
