# Target — θ(p_c) = 0 on ℤ^d, two labs' proofs bridged to one hand-written statement (2026-11-12)

Chosen by the operator on 2026-11-12 ("Percolation, two-lab bridge"; "full power"). The scout row
`percolation-theta-pc-2026-11-12` is in cert-machine's public corpus/targets.json and STAYS there (the operator's word,
same day); everything else of this lane stays here until the operator says "reveal".

## The claim we will make if every stage holds

> θ(p_c) = 0 for nearest-neighbour Bernoulli bond percolation on ℤ^d, every d ≥ 2, as stated BY US from Grimmett
> (1999, §1.3–1.4, p_c = sup{p : θ(p) = 0}) in a Mathlib-only file, is proved in Lean from Anthropic's development
> (J. Leder with Claude, anthropics/formal-math 795efb86, unmerged) by a bridge we wrote; at d = 3 it is ALSO proved
> from OpenAI's development (openai/math, family 213, `CriticalZ3`) by a second bridge. Two independent AI proofs, one
> statement neither lab wrote, every step kernel-checked; what stays a reading is named first.

The mathematics is Kozma–Nitzan's reduction and the labs' proofs; ours is the statement, the bridges and the checks.

## Pins

| what | where | pin |
|---|---|---|
| Anthropic's development | anthropics/formal-math, `percolation/` — NOT on main: PR #22 closed unmerged 2026-08-28; the commit is reachable only by its hash | `795efb86f191735c5481675763537cfb4ff37e55`; tarball sha256 `10f3e6b94b9584799670bfd842e3cadb2287fa9e9f50b9fb6b5ec9a2756955c4` (~/Projects/percolation-scout) |
| its toolchain / Mathlib | lean-toolchain, lake-manifest | v4.32.0 / mathlib `81a5d257c8e410db227a6665ed08f64fea08e997` |
| OpenAI's development | openai/math `lean/ComparatorChallenges/CriticalZ3.lean` (blob `56e93b89…`, the same at fd4aeeb2 and 4eaee875) | head `4eaee875`; v4.34.1; mathlib `d13f23b723b8a846827a245b89c10fc7d3f11612` |
| our statement | ~/Projects/plumb-scout/perc/Textbook.lean (copied here at the seal) | sha256 at the seal |

## Stages (each pre-registered; a stage's rules are sealed before it runs)

- **P0 — the statement.** Textbook.lean written by hand (done in draft), elaborated unchanged at BOTH Mathlib pins;
  pre-registration; seal. US$0, the Mac (Mathlib only, no third-party code built here).
- **P1 — replay Anthropic.** On a pod (third-party Lean is never built on the Mac): `lake build` of 795efb86, the axiom
  audit of the seven compared theorems, Comparator on its own comparator.json, nanoda, leanchecker --fresh, and two
  planted controls (its challenge at `1 ≤ d`; `θ = 1` for `θ = 0`) that must be refused.
- **P2 — bridge A (Anthropic → ours, every d ≥ 2).** In Anthropic's toolchain: from their compared statement
  (`∀ d, 2 ≤ d → PercolationContinuity d`) to `TextbookPercolation.Statement`. Their library may be used in the proof
  (it is kernel-checked); our statement file may not import it. The work: ℓ¹-adjacency = `SimpleGraph.hasse`; our
  `infinitePi` on the `Sym2` subtype = their `setBernoulli` on the graph's edge set (a measurable bijection of
  configurations); their cluster (`Reachable` in `fromEdgeSet`) = ours (`ReflTransGen`); their p_c
  (inf over {θ > 0} ∪ {1}) = ours (sup over {θ = 0}) by their `theta_mono_holds`.
- **P3 — bridge O (OpenAI → ours, d = 3).** In OpenAI's toolchain: from `CriticalZ3.critical_no_infinite` (bond part) to
  `Statement3`. The work: their bond index `Vertex × Fin 3` ≃ our edges; `bernoulliMeasure true false p` = our
  `PMF.bernoulli`; "a.s. every cluster finite" ⇒ θ(0-cluster) = 0; their sInf p_c = our sup p_c, which needs θ monotone
  (from their library if it has it, else our own coupling — the expensive branch).
- **P4 — the seam.** The same bytes of Textbook.lean elaborate on v4.32.0 and v4.34.1; the Mathlib definitions it uses
  (`Measure.infinitePi`, `PMF.bernoulli`, `PMF.toMeasure`, `Sym2.lift`, `Set.Infinite`, `sSup` on ℝ,
  `Relation.ReflTransGen`) compared by source text at the two revisions. A difference is named, never hidden.
- **P5 — anchors and red controls.** Proved in Lean by us: θ_d(1) = 1 and θ_d(0) = 0 (so `Statement` forces p_c < 1:
  the theorem is not vacuous); planted wrong statements the bridges must NOT prove (θ(p_c) = 1; the statement at d = 1;
  p_c as inf {θ > 0} without ∪ {1} where that matters). Optional: the statement is false at d = 1 (p_c(ℤ) = 1).
- **P6 — all kernels** on the final environments (Lean, leanchecker --fresh, nanoda, lean4lean; Comparator with our file
  as the challenge), then the reveal pack, on the operator's word.

## Predictions (written before any bridge code)

- P1: builds and audits clean (prob 0.9; their AUDIT.md reports it, nobody outside has re-run it).
- P2: closes (0.8). Risk: the configuration-space bijection between `Edge d → Bool` and `Set (Sym2 V)` restricted to
  the edge set, and `infinitePi` under it; `setBernoulli`'s own definition decides how hard.
- P3: closes (0.65). Risk: no monotonicity lemma in OpenAI's library → our own coupling (days).
- P4: the definitions agree in text, or differ only in proofs (0.8).
- Cost: P1–P3 a pod, 16 vCPU / 64–128 GB, about US$0.5–1.1 an hour, 4–10 hours in all; cap US$25 unless the operator
  raises it.

## What would kill or wound it (the kill review, 2026-11-12)

1. Someone already bridged either development to an independent statement: NOT FOUND (formal-conjectures #7746 copies
   OpenAI's statements; no Anthropic statement in formal-conjectures; Kalai, 6 Sep: "we still need to verify if the
   formalisation is done correctly").
2. Anthropic withdrew the work: UNKNOWN. The commit was never merged and its PR was closed the same day ("placeholder");
   no retraction found; OpenAI's paper cites it as "a public research announcement". Ask nobody before the reveal; say so
   on the page.
3. OpenAI's ℤ³ theorem is ours already: its replay is (lane K, 10-10, CERTIFIED); the bridge to an independent
   statement is not.
4. Licence: Anthropic's folder carries LICENSE + NOTICE (Apache-2.0 per the formal-math repository); openai/math is
   Apache-2.0. Our bridges import their libraries; nothing is copied into our statement.
