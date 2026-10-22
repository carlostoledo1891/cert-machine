# The ξ′ window issue on the zeta23 formalization's repository — POSTED 2026-10-23 as anthropics/formal-math #30

https://github.com/anthropics/formal-math/issues/30 — on the operator's "proceed the github issue"; the pre-send checks below all passed at posting (HEAD e1a4e650, the six XiPrime
files byte for byte, no prior thread on the window, the links 200, the lift battery and xi_window.py --check green). The paste block
below is the text as posted.

# (the draft) New issue on the zeta23 formalization's repository: the ξ′ window and the tail (2026-10-22; the abstract's print folded in on 2026-10-23)

A second, separate matter from the law-file request (a comment on their issue #8). This one carries an improvement the
formalizers can take as a drop-in: the window of Remark 7.1 optimised exactly, and D₁ truncated at fifteen terms instead of
nine. Every number is a decision of the receiver on a certificate at claimbox afd776c (public) and is re-derived by
`node tools/paper-numbers/riemann-finite-layer.js` here (the third implementation); re-run it before posting. Post ONLY on
the operator's word: `gh issue create -R anthropics/formal-math -t "<title>" -F <paste block>`, then SEND-QUEUE (lane Z) +
GITHUB-OUTREACH + corpus/outreach.json.

Pre-send checks:
- [ ] the repository re-read: XiPrime unchanged since e1a4e650 (the six pinned files), no issue or PR on the ξ′ window meanwhile
- [ ] `node tools/check-claimbox-lift.js` green; `python3 tools/xi_window.py --check` green in claimbox
- [ ] the links below resolve at claimbox afd776c380318bf7b6a7949ec18d130dc64e62a1

Title: XiPrime: the quartic window sits 8.9e-7 below its own family's optimum; a degree-6 window and D1trunc 15 give 0.86864150 / 0.93432075, with an exact optimality certificate over polynomial windows of degree ≤ 20

---- PASTE BELOW THIS LINE ----

Two small, exact improvements to the certified ξ′ constants, within the paper's method and the formalization's own hypotheses, which you may want to take as a drop-in. Nothing here touches the theorems; the paper's five printed digits do not move.

**The window is a Rayleigh quotient.** For an even polynomial window `v(s) = Σ c_i s^{2i}` on `[−1/2, 1/2]`, `κ₉(v) = (∫v² + J(v))/(∫v)²` is `cᵀMc/(bᵀc)²` with `b_i = ∫s^{2i}` and `M_ij = ∫s^{2i+2j} + sym 2∫₀¹ D1trunc9(r)·(s^{2i} ⋆ s^{2j})(r) dr` — the pair autocorrelations are polynomials in `r` — so the minimiser over each degree is `c ∝ M⁻¹b` with `κ* = 1/(bᵀM⁻¹b)`, exactly, in rational arithmetic. `Defs.lean` says of `vQuartic` that it "saturates the numerically optimal window to 10⁻⁶"; exactly, it sits `8.85·10⁻⁷` below the optimum of its own degree, and the optimum saturates from degree 6 on (`0.868641158957` at nine terms, twelve digits unchanged to degree 20), `9.85·10⁻⁷` above the quartic.

**A certified window.** The degree-6 optimum rounded to thousandths,

`v₆(s) = 1 − (157/500) s² − (3763/1000) s⁴ − (122/125) s⁶`,

satisfies `WindowProfile` by its coefficients (every coefficient after the first negative: `v₆ ≤ 1` on ℝ and decreasing in `|s|`; `v₆(1/2) = 10737/16000 > 0`; even; polynomial). With `D1trunc 9` it gives `P ≥ 0.86864115`, `D ≥ 0.93432057` (exact: `0.868641158927…`, `0.934320579463…`), one unit of the sixth digit above `AtOne.lean`'s `0.86864017` / `0.93432008`.

**The tail is the larger lever.** `eps9 = D1coeff 9 · 231/211 = 3.42·10⁻⁷` is more than a third of the window's whole gain. `Statement.lean` already states the route for every `K ≥ 9` ("D₁ ≤ D1trunc K + ε_K on [0,1]"); with `ε_K = D1coeff K · (K+2)(2K+3)/((K+2)(2K+3) − 2(K+1))` (the ratio at `k = K`, decreasing — the `D1coeff_succ_le` pattern), `ε₁₅ = 8192/180952685768570625 = 4.5·10⁻¹⁴`, and `v₆` at fifteen terms gives

`P ≥ 0.86864150`, `D ≥ 0.93432075` (exact: `0.868641500500…`, `0.934320750250…`),

a change of `1.33·10⁻⁶` over the current constants by the same window shape and three more terms of a series the files already hold. What a Lean instance needs, as far as we can see from outside: `D1coeff_succ_le` at `k ≥ 15` (ratio `32/561`) beside the `k ≥ 9` lemma, and the four lemma instances `AtOne.lean` proves for `vQuartic` — the two integrals, the closed form of `v ⋆ v`, positivity — with `v₆`'s rationals; all of them are printed in the certificate (`intV`, `intV2`, `vConv`, `window`).

**Optimality, decided.** That no even polynomial window of a degree does better is `N := M − κ*·bbᵀ ⪰ 0` with one zero eigenvalue at `c*`. The certificate prints the pair autocorrelation rows (from which the checker recomputes `M`), `L`, `D` and `c*` for `N = LDLᵀ`; the claims — residual zero, every pivot ≥ 0, the least pivot not > 0, `κ(c*) − κ* = 0` and not < 0, `P*` in an eleven-digit bracket — hold, and the two controls that must fail do, at degrees 6 and 20, at nine and fifteen terms: `P* = 0.868641500529…` at degree 20 and fifteen terms. The polynomial saturation is observed, not proved, for `L²`.

**A calibration.** With the ζ kernel `D(s) = s` the same functional is the Montgomery–Taylor problem; the polynomial optima give exactly `2 − 531/400 = 0.6725` at degree 2 and `0.672500703679411…` from degree 6 on — the closed form `2 − 1/c₁* = 0.6725007036794116…` to eighteen digits — which is what one expects from `cos(√2 s)` being the optimal window, and is the check that the machinery is right. (The parameter direction is closed too: at fixed `λ < 1` the constant only falls; the limit form at `λ = 1` is the right place.)

**One line on the paper's abstract, since this repository is the paper's public home.** The abstract prints "the constants become 0.6725 and 0.8362". The exact second constant is `0.836250351839705822…`, so `0.8362` is a truncation (a rounding prints `0.8363`), true as a lower bound, as the theorem's `0.83625…` makes clear; `0.6725` is a rounding and holds. A print, not a mathematical point — mentioned here only because the formalization's comparator carries the paper's decimals.

**Where everything is.** The certificates and the decisions are public in the translator's repository at commit afd776c:
- the windows: [xi-w6k15.json](https://github.com/carlostoledo1891/claimbox/blob/afd776c380318bf7b6a7949ec18d130dc64e62a1/corpus/riemann/zeta23/xi-w6k15.json) (and xi-w6.json, xi-o20k15.json beside it)
- the optimality certificates: xi-opt6k15.json, xi-opt20k15.json, xi-zeta2/6/20.json in the same folder
- the write-up with every claim and its expected word: [mathematician.md §7–§8](https://github.com/carlostoledo1891/claimbox/blob/afd776c380318bf7b6a7949ec18d130dc64e62a1/corpus/riemann/mathematician.md)
- the run: [records/riemann-math-run.json](https://github.com/carlostoledo1891/claimbox/blob/afd776c380318bf7b6a7949ec18d130dc64e62a1/records/riemann-math-run.json) (99 claims, 81 holding, 18 planted controls refuted)
- the tool: `tools/xi_window.py` (`--check` reproduces every rational of the quartic certificate; `--sweep-terms`, `--sweep-lambda`, `--sweep-zeta`)

Prepared with AI assistance (Claude); every number above is a decision of an exact checker over the certificates, re-derived by a second, independent implementation before posting.
