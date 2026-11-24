# Task: an adversarial reading of one Lean statement file (read-only, no Lean runs needed)

You are GPT-6.2-astra, a side assistant to a control room (a Claude model) that is auditing a public Lean 4 release:
anthropics/formal-math, folder vp-vnp, commit 918c8e27 — a formal proof that VP ≠ VNP over every field
(superpolynomial circuit lower bounds for the permanent and the Hamiltonian-cycle polynomial). Nothing here is to be
taken on trust, including this brief.

Files on this disk (read-only):
- The release: /Users/carlostoledo/Projects/cert-machine/notes/vp-vnp-2026-11-23/src/vp-vnp/
  (paper.pdf, Statement.lean, Challenge.lean, Solution.lean, Paper/…)
- The paper as text (pdftotext -layout): /Users/carlostoledo/Projects/cert-machine/notes/vp-vnp-2026-11-23/paper.txt
  Remark N.6 is at lines 3674–3680; Definition N.1 at 3558–3565; Section 1.2 (related work) at 93–146.
- THE FILE TO READ: /Users/carlostoledo/Projects/cert-machine/corpus/vp-vnp/lean/n6/N6Statement.lean

Context. Remark N.6 is the one numbered statement of the paper that the release does not formalize. The control room
wrote N6Statement.lean to state it in Lean (definitions and three propositions, no proofs): `DetHasSmallCircuits`,
`ApproxByDet`, `RemarkN6`, `PermCharTwo`. Proofs are being attempted by others. Your job is the reading that a
hostile referee would do BEFORE anyone cares about the proofs: does each proposition say what the paper's remark and
the literature mean, or is it weaker, vacuous, stronger than provable, or about something else?

Do this:
1. Read Remark N.6, Definition N.1 and Section 1.2 in paper.txt, and Statement.lean (the release's own definitions:
   Computes, perm, Beyond, Approximates, MainTheoremApprox). Then read N6Statement.lean line by line.
2. List EVERY difference you can find between (a) each Lean definition/proposition and (b) the paper's words and the
   standard notions: determinantal complexity dc(f) (Valiant; Mignon–Ressayre), border determinantal complexity
   (Mulmuley–Sohoni, Landsberg–Manivel–Ressayre), "affine matrix", "division-free circuit". Things to probe at least:
   the quantifier order of c, p, m₀, F, m, n; whether `(M i j).totalDegree ≤ 1` is "affine" (constants allowed? over
   which ring — the entries' coefficients are Laurent series: is that the right notion of approximation by
   determinants "in the sense of Definition N.1"?); whether ApproxByDet could be vacuous or trivially true for small
   n; n = 0 and m = 0, 1 edge cases; whether `Beyond c m n` (a strict inequality on reals, with Real.logb and rpow)
   reads as "size more than m^(c (log₂ m)^(1/3))"; the universe variable; whether `DetHasSmallCircuits` over every
   commutative ring with ONE exponent is the standard statement or something stronger/weaker; whether `det` is the
   usual determinant polynomial (index convention (i, j), any transpose); whether `PermCharTwo` is the right negation
   and whether its quantifiers make it easier or harder than it should be; anything that makes `RemarkN6` follow
   WITHOUT the main theorem (that would mean the statement is too weak) or be false even granting it.
3. For each difference: quote the Lean line and the paper line (with line numbers), say MATERIAL (changes what is
   claimed), IMMATERIAL (and why), or UNSURE, and where it helps propose a one-line Lean test that would decide it
   (a theorem statement only; do not prove it).
4. Say plainly which claims in your answer come from your memory of the literature rather than from a file on this
   disk. Do not invent quotes or references.

You may write notes in your work folder. No network, no Lean runs, at most 30 minutes.

Your final message: the numbered list of differences (most serious first), then one last line exactly of the form
VERDICT: <a> material, <b> immaterial, <c> unsure
