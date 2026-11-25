# Brief for the Phase 4 prover (ω = 9/4 lane, cert-machine, 2026-11-25)

Prove, in the release's environment (openai/math 92b516ef, Lean v4.34.1, Mathlib d13f23b7), the sealed Phase 4 statements
in corpus/omega-nine-fourths/phase4/writer/PerN.lean — or show exactly why one cannot be proved from the release. Read
PREREG.md, AMENDMENTS.md (A13 governs this phase), the statement reader's report (reader/REPORT.md: M3, M4, M5; its test
T4 already proves a weaker per-n form inside the release) and the census (runs/p1/PROGRESS.md: docs/379.md's theorems
`divisionOmega_square_eq_formalOmega`, `algebraicClosure_rank_le_twice_cost` / `_productQuotientCount`, and
`square_asymptoticRank_eq_rpow_formalOmega` on the route).

Work in corpus/omega-nine-fourths/phase4/prover/ and on the pod the control room creates (its address arrives by message):
your own build of the release (as the bridge author did), an unprivileged user, one heavy job at a time.
1. Elaboration repairs of PerN.lean: names and syntax only, each logged in phase4/prover/REPAIRS.md before use; a repair
   that changes meaning is a finding — stop and report it.
2. Proofs of PerN.GatesPerNAll, PerN.GatesPerN, PerN.AsymptoticRank (and PerN.BorderRankLower if stated) from the
   release's theorems plus lemmas of your own. The nonscalar form needs the paper's Lemma 2.4 in its NONSCALAR count
   (rank over the algebraic closure ≤ 2 × nonscalar multiplication-or-division gates); if the release proves only the
   all-gates count, prove the nonscalar lemma yourself (the paper's argument: evaluate at A + uX, B + vY with u² = v² = 0
   at a point where every intermediate function is regular; a scalar multiplication adds no product).
3. Comparator (the runner's pins: d03acab1, lean4export 076e8e57, landrun 811cfff5), our PerN.lean as the challenge,
   nanoda on; con-leche 5ea446d5 --verified and --compare; a planted control (one constant changed) must be refused.
No sorry, no new axiom, no native_decide. `date -u` before any time. Progress lines in phase4/prover/PROGRESS.md in the form
"- YYYY-MM-DD HH:MM — <ROW> <word> …" (rows G3a, G3b, G3c, G3d; words started, running, passed, failed, open).
Hand back, per statement: PROVED (built, axioms the three, Comparator + nanoda + con-leche) or NOT PROVED (the reason).
