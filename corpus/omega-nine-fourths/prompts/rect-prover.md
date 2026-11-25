# Brief for the Phase 5 prover (ω = 9/4 lane, cert-machine, 2026-11-25)

Prove, in the release's environment (openai/math 92b516ef, Lean v4.34.1, Mathlib d13f23b7), the sealed Phase 5 statements
in corpus/omega-nine-fourths/phase5/writer/Rect.lean — or show exactly why one cannot be proved from the release. Read
PREREG.md, AMENDMENTS.md (A15 governs this phase), the statement reader's report (reader/REPORT.md: M6 says Corollary 1.3
per format is absent from the release), the census (runs/p1/PROGRESS.md) and Phase 4 — its statements
(phase4/writer/PerN.lean) and its proofs (phase4/prover/src/, all PROVED and accepted by three checkers): the border-rank and
asymptotic-rank bounds for T_n and the nonscalar Lemma 2.4 there are yours to reuse.

Work in corpus/omega-nine-fourths/phase5/prover/ and on the pod the control room creates (its address arrives by message):
your own build of the release (phase4/prover/scripts/ shows how the Phase 4 prover built it), an unprivileged user, one
heavy job at a time. Build first; elaborate Rect.lean only after the control room's message that A16 has sealed it.
1. Elaboration repairs of Rect.lean: names and syntax only, each logged in phase5/prover/REPAIRS.md before use; a repair
   that changes meaning is a finding — stop and report it.
2. Proofs of Rect.BorderRankRect, Rect.AsymptoticRankRect, Rect.AlphaBounds and Rect.DualExponentDiv from the release's
   theorems, Phase 4's proofs and lemmas of your own. The paper's route (consequences.tex, proof of Corollary 1.3): the
   three one-factor flattenings have ranks ab, bc, ca (closedness of rank conditions for border rank, multiplicativity of
   flattening ranks for asymptotic rank); T_{a,b,c} ⊗ T_{b,c,a} ⊗ T_{c,a,b} ≃ T_{abc}; cyclic invariance and
   submultiplicativity give each value cubed ≥ (abc)^{9/4} from Phase 4. For α_F ≤ 2/3: the border bound at a = c = n,
   b = ⌊n^β⌋ is Ω(n^{3(2+β)/4}) and the bilinearization (Lemma 2.4, entrywise for rectangular products, nonscalar count)
   carries it to circuits with divisions. For α_F ≥ 1/2: a division-free program is a circuit of the division model, so the
   release's division-free upper bound at β = 1/2 transfers. DualExponentDiv needs the release's lower bound in the division
   model (Strassen's division elimination, or the route the release uses for its square theorem with divisions) — report
   NOT PROVED with the exact missing step if it does not go through.
3. Comparator (the runner's pins: d03acab1, lean4export 076e8e57, landrun 811cfff5), our Rect.lean as the challenge,
   nanoda on; con-leche 5ea446d5 --verified and --compare; a planted control (one constant changed, e.g. 3/4 -> 4/5 or
   2/3 -> 3/5) must be refused.
No sorry, no new axiom, no native_decide. `date -u` before any time. Progress lines in phase5/prover/PROGRESS.md in the form
"- YYYY-MM-DD HH:MM — <ROW> <word> …" (rows G3e, G3f, G2a, G2b; words started, running, passed, failed, open).
Hand back, per statement: PROVED (built, axioms the three, Comparator + nanoda + con-leche) or NOT PROVED (the reason).
