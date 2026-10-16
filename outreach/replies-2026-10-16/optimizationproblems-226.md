# Reply draft — teorth/optimizationproblems PR #226 (Patankar / vidigoat) — NOT POSTED

Thread: https://github.com/teorth/optimizationproblems/pull/226
Our comment (C3, posted 2026-10-15T23:12:52Z): https://github.com/teorth/optimizationproblems/pull/226#issuecomment-6204217690
The response (2026-10-16T03:25:05Z): https://github.com/teorth/optimizationproblems/pull/226#issuecomment-6207378455

## What he wrote (verbatim)

> Thanks for checking these! For 16a and 70a, `./check.sh` in the linked repo re-runs both certificates in a few seconds: `python3 tao/certificates/bgw.py --K 4000 --mu 41/5` (interval sums for 16a) and `python3 tao/certificates/rbm_cube.py --n 300000 --t 0.013` (70a). The arguments are written out in `tao/PROOFS.md`: https://github.com/vidigoat/optimization-records/blob/main/tao/PROOFS.md

What is asked, in effect: decide the two bounds we declined on 10-15 (16a and 70a), using his derivation. We did not run his scripts (no code shared with the claimant); we read tao/PROOFS.md, re-derived each formula from the registry's definition, and computed each number in the standard library.

## What we did

- Pinned his material as text, never run: corpus/optconst-queue/sources/vidigoat-39fb848/{PROOFS.md, bgw.py.txt, rbm_cube.py.txt} (repo @ 39fb848fbbb052564b3689cf4625499b2e52ab6b) and his comment prs/pr-226-comment-6207378455.json; sha256 in corpus/optconst-queue/PINS.json (amended, dated).
- Pre-registration amended (corpus/optconst-queue/preregistration.json, `amendments[0]`, 2026-10-16) before the numbers were seen.
- New deciders, standard library only (instruments/optq/):
  - ivdec.py — π by Machin in integer arithmetic (an interval, width 9e-68 at 60 digits), directed-rounding Decimal contexts, ±1-ulp enclosures around the decimal module's correctly rounded ln/exp/sqrt.
  - bgw16a.py — 16a. Registry: L = max_{δ≥1}[4πΘ(δ) − ln δ − ln(1+ln δ)], Θ(δ) = sup |u(0)|² over zero-mean u, ‖∇u‖² = 1, ‖Δu‖² = δ. Torus 2π×2π fixed independently by BDZ2013 (2.4) and (3.14) (arXiv:1012.2061; the registry's 2.15627 row is BDZ's). For the PR's u (c_k = 1/(|k|²(|k|²+41/5)), 0 < |k|² ≤ 4000²), Parseval gives L ≥ S₀²/(π S₁) − ln δ − ln(1+ln δ), δ = S₂/S₁ ≥ 1. Sums as fixed-point floors/ceilings at 2^200 over 50,265,328 lattice points (= Gauss's circle count) in 3,126,894 norm classes.
  - rbm70a.py — 70a. Registry: C₇₀ the least C with some |det u| = 1 giving |u(B₁)+B₂|^{1/n} ≤ C(|B₁|^{1/n}+|B₂|^{1/n}) for every symmetric pair. Chain read and holding: Steiner; V_j of a zonotope = sum of its j-face parallelotope volumes; Szász on the Gram matrix; AM–GM ⇒ V_j(u(cube)) ≥ C(n,j) aʲ, so the cube is in its worst position for every u. The Steiner sum at n = 300,000, a/r = 13/1000 by outward-rounded decimal recurrences; n-th roots via ln/exp.
- Ledger rows optq-226-16a and optq-226-70a in certs/optq-ledger.json flipped REFUSED (not attempted) → CERTIFIED, with `decidedOn: 2026-10-16` and the claimant's source recorded; tools/run-optq-ledger.py, tools/build-report-optq.js (§4 rewritten, scope line, tl;dr), instruments/optq/battery.py (+7 checks, +3 red controls), tools/build-control.js description updated.

## Numbers (ours; his in parentheses)

- 16a: enclosure [2.156224753793913363046129, 2.156224753793913363046130] (width 1.43e-52), δ ∈ [3.931809824795461349799787, …] ≥ 1. Claim 2.156224: CERTIFIED. (He prints 2.1562247…, δ ≈ 3.93181.)
- 70a: enclosure [1.201927142572502844960989, 1.201927142572502844960990] (width 1.7e-48). Claim 1.201927: CERTIFIED. (He prints 1.201927.)
- Calibrations: K = 1 gives 4/π exactly and our enclosure contains it; n = 2 equals √(t²+4t+π)/(t+√π) to 45 digits.
- One discrepancy in his prose, not in his claim: PROOFS.md says "cutoff 50: 2.15174". With μ = 41/5 we get 2.151390 (μ = 42/5: 2.151285). His 200 (2.15592), 800 (2.15621) and 4000 figures agree with ours (2.155922, 2.156207, 2.1562248).

## Reply text (ready to paste, ~190 words)

---- PASTE ----
Both decide here and hold, with no code of yours run: your scripts and PROOFS.md are pinned as text and the derivations re-read against the registry's definitions.

16a: with T² = [0, 2π]² (BDZ2013 (2.4), (3.14) — the registry's 2.15627 row is theirs), your u is a real zero-mean trigonometric polynomial, so Parseval gives L ≥ S₀²/(π S₁) − ln δ − ln(1 + ln δ) with δ = S₂/S₁, as you wrote. The three sums enclosed as fixed-point floors and ceilings over 50,265,328 lattice points, π by Machin, ln correctly rounded: δ ∈ [3.9318098247954613, …] ≥ 1 and L ≥ 2.1562247537939133630461 (width 1.4e-52). CERTIFIED above 2.156224.

70a: the chain (Steiner; V_j of a zonotope as the sum of its j-face volumes; Szász on the Gram matrix; AM–GM) reads correctly, so the cube is in its worst position for every |det u| = 1. The Steiner sum at n = 300,000, a/r = 13/1000 by outward-rounded recurrences: C₇₀ ≥ 1.2019271425725028449609 (width 1.7e-48). CERTIFIED above 1.201927; n = 2 reproduces √(t² + 4t + π)/(t + √π).

One line in PROOFS.md: "cutoff 50: 2.15174" — μ = 41/5 gives 2.151390 here (42/5: 2.151285); your 200, 800 and 4000 figures agree with ours.

https://carlostoledo.co/reports/optconst-queue.html (§4; records certs/optq-ledger.json, rows optq-226-16a/70a).
---- END ----

## Pre-send checklist (the operator's)

- [ ] `node tools/build-report-optq.js` green (it re-derives the ledger and runs the battery): counts CERTIFIED 9 · REFUSED 1 · REFUTED 0.
- [ ] certs/optq-ledger.json committed with rows optq-226-16a and optq-226-70a CERTIFIED; the enclosures in this file equal the rows' `values.enclosure`.
- [ ] corpus/optconst-queue/PINS.json amendment read (four pins added; NOTICE.md re-pinned; the 35 untracked atrislabs/.git/* pins removed — a pre-existing gap: the committed ledger could not re-derive from the committed tree).
- [ ] site rebuilt and pushed; https://carlostoledo.co/reports/optconst-queue.html §4 shows the two CERTIFIED bullets; the index card reads "9 certified · 1 refused".
- [ ] `node tools/check-copy.js` green (the copy census; the new §4 text contains none of the counted words).
- [ ] The thread re-read at send time (no newer comment than 6207378455).
- [ ] Framing held: a flipped verdict from REFUSED-not-attempted to CERTIFIED; nothing was refuted; the cutoff-50 line is a slip in prose, named as such; "published, not peer-reviewed, not independently rerun" still applies to the claim as a whole (the PR is unmerged).
- [ ] Our own PR #216 on that repository is unrelated and stays as is.

Nothing here goes out without the operator's word.
