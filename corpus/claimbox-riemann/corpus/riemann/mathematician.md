# The mathematician's claims — the fifth session, 2026-10-22

Written by Claude (Fable 5.1) in the claimbox session, as the mathematician the operator asked for: claims I derived from the
pinned sources (corpus/riemann) and from the bytes, each stated on a line of its own in a shape the grammar reads, so that
claimbox translates it and cert-machine decides it from the bytes. Nothing here is to be believed because it is written:
the decisions are in records/riemann-math-run.json, and every expectation I had is in corpus/riemann-math-jobs.json.

## 1. The Montgomery–Taylor constant is decidable by rational arithmetic

The formalization defines c₁* = √2·tan ϑ/(1 + ϑ·tan ϑ) at ϑ = 1/√2 (ChallengeDeps.lean), and the paper defines its reciprocal,
c_MT^{-1} = 1/2 + (1/√2)·cot(1/√2). The receiver admits these closed forms and cannot decide them: Exp, Ln, Sin and Cos are
heads of its interval kernel, and no decider runs that kernel on a claimbox object. The mathematics removes the kernel.

With ϑ² = 1/2 the Maclaurin series give sin ϑ = ϑ·s and cos ϑ = c, where

    s = 1 + Σ_{k≥1} (−1)^k / (2^k (2k+1)!)        c = 1 + Σ_{k≥1} (−1)^k / (2^k (2k)!)

are alternating series of rationals whose terms decrease in absolute value by a factor of at least 12 at every step. Hence
tan ϑ = ϑ·s/c, and since √2·ϑ = 1 and ϑ² = 1/2,

    c₁* = 2s / (2c + s),      1/c₁* = 1/2 + c/s,      2 − 1/c₁* = 3/2 − c/s,      (3 − 1/c₁*)/2 = 5/4 − c/(2s).

By the alternating-series bracket (Leibniz), for an even truncation order K the partial sums satisfy s_{K+1} ≤ s ≤ s_K and
c_{K+1} ≤ c ≤ c_K; and 2s/(2c + s) increases in s and decreases in c on positive values, so

    2·s_{K+1} / (2·c_K + s_{K+1})  ≤  c₁*  ≤  2·s_K / (2·c_{K+1} + s_K),

an enclosure of width 2·10⁻¹⁹ at K = 8, in exact rational arithmetic — Sum, Product, Power over integer ranges, every head in
cert-machine's exact vocabulary. The certificate is zeta23/mt-series.json (K = 8); the translator writes the two ends of the
enclosure as the predicates. A print cut off with an ellipsis, 0.7532960…, says the expansion begins so: the value lies in the
truncation box [0.7532960, 0.7532961). A print "published as 0.8362" is a rounding: half a unit either side. The machine
caught me conflating the two: my first grammar gave the ellipsis the rounding box, and cert-machine then refuted the true
"c₁* = 0.7532960…" and certified a false "c₁* = 0.7532961…" — right about the arithmetic (c₁* = 0.75329606785…) and so
right about my notation being wrong; the grammar now reads an ellipsis as a truncation. The claims, as the sources print them:

c₁* = 0.7532960…
2 − 1/c₁* = 0.67250…
(3 − 1/c₁*)/2 = 0.83625…

and two bounds of my own, one unit of the eighth digit either side of the value:

c₁* ≤ 0.75329607
c₁* ≥ 0.75329606

The paper's abstract (arXiv:2608.13637v2, line 73 of the source) prints "the constants become 0.6725 and 0.8362" where its
theorem prints 0.67250… and 0.83625…. The exact value of the second constant is 0.836250351839705822…, which lies above the
box the four printed digits allow ([0.83615, 0.83625]): 0.8362 is a truncation, and a rounding would print 0.8363. As a lower
bound on a proportion the truncated print is still true — a weaker true statement — so this is a finding about the print,
not about the theorem. Under the register's reading of a printed decimal (the box its digits allow) the claim is refuted and
its companion is certified:

(3 − 1/c₁*)/2, published as 0.8362
2 − 1/c₁*, published as 0.6725

## 2. The 256-periodic law is exactly CUE on the band

Every band enclosure [lo_j, hi_j] of K·S(j), 0 < j < 256, has width one unit and contains j·K/256 exactly — 124 rows have it
at the upper end, 131 at the lower end (counted from LawN256.encl.json). So the law's form factor is consistent with
S(j) = j/256 on every band frequency, the CUE value, to 2^{-140}: the enclosures are not merely near-CUE within 3·10⁻⁴⁰, they
sit on the CUE values. Since j·K/256 is an integer (K = 2^140), containment is the inequality

|2·j·K/256 − lo_j − hi_j| ≤ 1 (0 < j < 256)

It follows that D(1) = S(256)/256 − 1/512 to the same precision, and the closed-band row is 256·S(256) =
54126.5943404763655240001141863212684304432…, i.e. S(256)/256 = 0.8259062857128351672973650235949900578… = D(1) + 1/512.

## 3. The paper's arithmetic on the ceiling, decided from the file's own numbers

"The 2/3 of Theorem (i) is within 0.016 of the ceiling of its own method": with p₀ the exact rational LawN256.lean prints,
p₀ − 2/3 = 0.0151620207971648…:

|p₀ − 2/3| ≤ 0.016

"the resulting bound p₀ + 2.55·10⁻⁶·(|r′(1)| + ∫|r″|) is below 0.6819 … for any window with |r′(1)| + ∫|r″| < 8.2": write
B(8.2) := p₀ + 2.55·10⁻⁶·8.2 = 0.68184954114…:

B(8.2) ≤ 0.6819

and the decimal constant of ceiling_law256_decimal, c_256 := 1/(6·256²) + τ/512 = 2.5431315104…·10⁻⁶, against the paper's
rounded coefficient 2.55·10⁻⁶:

c_256 ≤ 2.55·10⁻⁶

## 4. The ξ′ constants are rational arithmetic too, and re-derive exactly

The paper's Remark 7.1 states that at least 0.85838 of the zeros of ξ′ are simple and on the critical line and at least
0.92919 are distinct (flat window), 0.86864 and 0.93432 with the quartic window v(s) = 1 − (7/100)(2s)² − (51/200)(2s)⁴.
The formalization proves eight-digit versions (Zeta23/XiPrime/Certificate/AtOne.lean: 0.85838371, 0.92919185, 0.86864017,
0.93432008) from a certificate whose every number is rational: the diagonal density D₁(s) = s − 4s² + Σ_{k≥0} a_k s^{2k+3}
with a_k = 2·4^{k+1}·k!/(2k+2)! (Lemma 7.1), truncated at nine terms with the tail ε₉ = a_9·231/211 (the coefficient
ratio is at most 20/231 from k = 9 on), the window integral J(v) = 2∫₀¹ D1trunc9(r)·vConv(r) dr with vConv the window's
autocorrelation, κ₉(v) = (∫v² + J(v))/(∫v)², and the proportions 2 − κ₉ − ε₉ and 3/2 − (κ₉ + ε₉)/2. I re-derived every
number from those definitions with exact fractions, including the quartic window's degree-9 autocorrelation polynomial by
my own polynomial arithmetic, and each equals the Lean's computer-algebra-generated closed form. The certificate is
zeta23/xi-certificate.json. The identities, as the Lean files print them:

J_flat = 12517210259/88388425125
kappa9_flat = 100905635384/88388425125
eps9 = 1024/2990212875
J_quartic = 29965280330934234270211/285991090937677125000000
kappa9_quartic = 277244140547469154168336/245053976636191319722125

the Lean's eight-digit constants (the margins are 3.6·10⁻⁹ and 6.8·10⁻⁹):

P_flat ≥ 0.85838371
D_flat ≥ 0.92919185
P_quartic ≥ 0.86864017
D_quartic ≥ 0.93432008

the paper's five-digit prints:

P_flat ≥ 0.85838
D_flat ≥ 0.92919
P_quartic ≥ 0.86864
D_quartic ≥ 0.93432

and a control one unit of the eighth digit above the exact value P_flat = 16008819950038/18649957701375 = 0.8583837135…:

P_flat ≥ 0.85838372

A first pass of mine took "D1trunc 9" as ten terms (k = 0..9) and reproduced none of the printed rationals; nine terms
(k = 0..8, the tail from k = 9 matching ε₉ = a_9·231/211) reproduce all of them. The machine's refusal to match was the
correction.

## 5. The paper the mathematicians are reading has no finite numerical layer

The operator placed the 11/12 manuscript (paper2.pdf, 784,503 bytes, sha256 f919b57829b178c8e60e7c17b018cf773e7907cf64
2ef5a3347d8a826e8dbf18 — byte for byte the release's pinned file) and the release's overview.pdf in Downloads; pdftotext
26.07.0 extracted 3,073 lines. The paper states 34 numbered theorems, lemmas, propositions and corollaries and prints no
decimal constant at all: every number of the form d.dd is an equation label or a DOI, and the one occurrence of
"numerical" is a reference title. Nothing in it is a claim the pipeline can touch; it is a proof for human readers,
exactly as the video says, and the quasi-Riemann statement itself stands only in the 7/8 manuscript's Lean files.

## 6. An exploration: the bandwidth-one programme at small N

Floats, not a certificate (the script is tools/ceiling_lp.py). A law on N-periodic marked configurations — marks 1 and 2
on the grid (1/q)·Z_N, marks summing to N — minimising the expected simple-point fraction subject to the CUE band
constraints E[S(j)] = j/N for 0 < j < N, with S(j) = (1/N)|Σ_i m_i e(j x_i/N)|², configurations up to translation and
reflection, solved by a dense two-phase simplex. On the integer grid (q = 1) the programme is infeasible at N = 4, 6, 8.
On the half-integer grid (q = 2) the optimum is 0.713388 at N = 4, 0.707336 at N = 6 and 0.705267 at N = 8, falling with
N but far above the N = 256 law's 0.6818287. Finer grids lower it further: at N = 4, 0.708333 (q = 3), 0.704798 (q = 4),
0.701828 (q = 6); at N = 6, 0.700966 (q = 3), 0.697554 (q = 4). So the authors' law lives on fine or structured rational
positions, as its header says, and the values move towards its 0.6818 in both N and q. The optimal laws have one shape
throughout: the rigid lattice of N simple points at unit spacing — whose form factor vanishes on the whole band — carries
the largest weight (0.59 to 0.69), and a few configurations of double points, whose form factors are large at a few
frequencies, are mixed in to lift the average onto the CUE values j/N exactly. On the half-integer grid the simple points
sit on one parity class and the doubles on the other, and the leading weight at N = 8 is 0.5858 = 2 − √2 to four digits —
the weights are algebraic, as the cosines in the constraints make them, which is why no law of this programme can be a
claimbox object until the receiver decides over Cos or over a cyclotomic field. Past N = 8 the enumeration of
configurations must give way to column generation.
