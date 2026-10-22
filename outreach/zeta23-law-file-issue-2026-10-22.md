# New issue on the zeta23 formalization's repository — DRAFT, NOT SENT (2026-10-22)

The pinned repository is anthropics/zeta-23-lean at e1a4e650; on 2026-10-22 its address redirected to
anthropics/formal-math (check-bib recorded the resolved title "GitHub - anthropics/formal-math"). Post where the redirect
lands. This is GATE 2 of the Riemann companion: the issue goes out BEFORE the paper is pushed, so that the file's authors
are asked before anyone reads that it is unavailable. Every number below is a field of claimbox's records at b37d980
(public) and is re-derived by `node tools/paper-numbers/riemann-finite-layer.js` here; re-run it and re-read the pinned
files before posting. Post ONLY on the operator's word:
`gh issue create -R anthropics/formal-math -t "<title>" -F <paste block>`, then SEND-QUEUE (lane Z) + GITHUB-OUTREACH, then
the paper's two sentences ("has been drafted and will be posted" in §2 and in the competing-interest declaration) become
"was posted on <date>", regenerate, push.

Pre-send checks:
- [ ] the repository re-read at its new address: no commit since e1a4e650 that publishes `cert_N256_blk_b128m.json` (search the
      tree for `cert_N256`), no open issue asking for it, issues enabled
- [ ] `node tools/check-claimbox-lift.js` green (the copies held; the numbers identical)
- [ ] the links below resolve at claimbox b37d9800aa81428f7c3d16b8dfb97cdce80aef30

Title: PairCeiling/LawN256: the row certificate re-checked from its integers without Lean; a request for the law file behind EnclOK

---- PASTE BELOW THIS LINE ----

We re-checked the numerical certificate of the bandwidth-one ceiling independently of Lean, and would like to ask for the one file that would let such a check reach `EnclOK`.

**What we did.** At commit e1a4e650 we decoded the 256 integer literals of `Zeta23/PairCeiling/LawN256.lean` (sha256 `11ae9f7dcc17…`) exactly as the file prints them, and decided the row certificate over them in exact rational arithmetic with two programs, one in Python and one in JavaScript, that share no code with each other or with Lean:

- `|256·S(j) − j| ≤ 3·10⁻⁴⁰` for `0 < j < 256`, at both ends of every enclosure (the worst row sits `1.836·10⁻⁴⁰` from its target);
- `|D(1)| ≤ 0.82395317`, with `D(1) = Σ_{j≤256} S(j)/256 − 1/2` evaluated at both ends of the enclosures, which is exact since `D(1)` is monotone in each `S(j)` (`|D(1)| = 0.82395316071…`, under the bound by `9.3·10⁻⁹`);
- `p₀ ≤ 0.6818287` for the exact rational the file's header prints.

All three hold. This is a no-shared-code concordance with `LawN256_check` on the printed integers and nothing more: the independence is in the checking code, not in the data. One observation on the way, most likely by construction: every band enclosure contains `j·K/256` exactly (124 rows at the upper end, 131 at the lower), so the law's form factor sits on the CUE values to `2⁻¹⁴⁰`, not merely within `3·10⁻⁴⁰` of them.

**What we could not check.** As AUDIT.md says, the ceiling theorems carry the displayed hypothesis `EnclOK`, verified outside Lean by 70-digit interval arithmetic from the law file `cert_N256_blk_b128m.json` (sha256 `cc3de9917db4…`), which the header of `LawN256.lean` describes as available from the authors. Without that file there is no reading of any published byte that decides `EnclOK`; the certificate is conditional on it, for the kernel and for us alike. The audit is admirably clear about this, and we want to be equally clear that nothing here is a criticism of the formalization.

**The request.** Would you publish `cert_N256_blk_b128m.json` (the law's weights and positions), ideally with the interval-arithmetic script that produced the enclosures, either in the repository or as a deposit with a DOI? With it we would re-derive the enclosures from the law by an independent interval arithmetic and publish that check beside this one, and the certificate would be checkable end to end by anyone.

**Where the check is.** The decoded enclosures, the claim objects (each with the reading of the bytes written down) and the run are public in the translator's repository at commit b37d980:
- the run: https://github.com/carlostoledo1891/claimbox/blob/b37d9800aa81428f7c3d16b8dfb97cdce80aef30/records/riemann-run.json
- the decoded enclosures: https://github.com/carlostoledo1891/claimbox/blob/b37d9800aa81428f7c3d16b8dfb97cdce80aef30/corpus/riemann/zeta23/LawN256.encl.json
- the objects: https://github.com/carlostoledo1891/claimbox/tree/b37d9800aa81428f7c3d16b8dfb97cdce80aef30/records/riemann

Two smaller notes from the same pass, for whatever use they are: the Montgomery–Taylor constant `c₁* = √2·tan ϑ/(1 + ϑ·tan ϑ)` at `ϑ = 1/√2` is decidable by rational arithmetic alone (with `ϑ² = 1/2`, `sin ϑ = ϑ·s` and `cos ϑ = c` for two alternating rational series, so `c₁* = 2s/(2c + s)`; the `K = 8` bracket is `[0.75329606785607067702, 0.75329606785607067722]`), and the five rationals of the `XiPrime` certificate (`J`, `κ₉` and `ε₉` for the flat and quartic windows) re-derive exactly from the definitions — `D₁` truncated at nine terms, `k = 0..8`, with the tail `a₉·231/211`.

Prepared with AI assistance (Claude); every number above is a decision of an exact checker over the pinned bytes, re-run before posting.
