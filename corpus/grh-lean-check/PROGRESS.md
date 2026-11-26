# grh-lean — progress (one line per row event; times from date -u on the machine that ran it)

- 2026-11-25 22:59 — CHAR passed. On pod alt1te1i1gsnpy (amendment A2), Lean v4.35.0 with Mathlib 56a005855ea1 (the
  release's pins; runs/char-alt1te1i1gsnpy/mathlib-rev.txt), the four files UNCHANGED from cert-machine
  (inputs.sha256 = the instruments' sha256: Textbook.lean 5310cb6f…, Spec.lean a15f6d86…, TextbookAx.lean cbf610a2…,
  Challenge.lean 8c1e5e1d…): Spec, Challenge, Textbook, TextbookAx each exit 0 (CHAR.log); the eight theorems
  (Mathlib's ζ and L meet the textbook characterisations; the characterisations determine them on ℂ ∖ {1}; RH and
  GRH in textbook form equivalent to the release's definitions) each depend on [propext, Classical.choice, Quot.sound]
  (TextbookAx.out). Only deprecation warnings (push_neg, Set.mem_setOf_eq); Challenge's five sorry theorems are not
  used by any of the eight, as the axiom lists show.
- 2026-11-25 23:34 — pod tzj3kmtfk6flzc (grh-lean-check-2026-11-25, cpu3m 16 vCPU / 128 GB, disk 160 GB, US$0.88/h,
  EU-RO-1, created 23:33:13 UTC, amendment A4). First start (audit 8d96a4ff) ended at setup, exit 127: the image has no
  /usr/bin/time; nothing ran; that /results is kept on the pod as /results-attempt0. Restarted 23:34:49 UTC with the fix
  (audit 083bbf00), DEADLINE 1795707000 (2026-11-26 15:30 UTC).
- 2026-11-26 00:05 — setup, the Landlock probes (LL2's write refused, as required), DERISK (con-leche reads a v4.35.0
  export; both checkers refuse the bad sample), I1, the challenge builds and their seals for both editions: all done
  before any release module was compiled. B1 (the readable edition, `lake build` from source) exit 0 after 1,268 s.
  A1 (readable): each of the five theorems depends on axioms [propext, Classical.choice, Quot.sound].
- 2026-11-26 00:08 — EXP running (since 00:05:56); KR (leanchecker --fresh Main) started beside it in a second
  invocation (amendment A3, P6).
- 2026-11-26 00:09 — EXP exit 0 after 201 s (the lean4export export of the closure of the five).
- 2026-11-26 00:11 — K1 (nanoda) exit 0 after 137 s: "Checked 222117 declarations with no typechecker errors, 1
  pretty printer errors: [ "Unable to print axioms" ]" — a printing error, not a type error; the recorder's
  nanoda_accepts decides the row.
- 2026-11-26 00:14 — K2 (con-leche): --verified "accepted 216567 declarations"; --compare against cert-machine's
  challenge: "accepted 52169 declarations, 5 axioms justified by the solution", each of the five theorems "justified by
  the solution".
- 2026-11-26 00:19 — the planted controls, each refused by every check it went through: C3 (1/2 → 1/3 in the
  challenge) by con-leche ("axiom LFunction_eq_zero_re is not justified by the solution: its type reads
  DirichletLZerosOnLine, which the solution does not declare alike"); C1 (an added axiom) by con-leche, as "not
  implemented yet: non-standard axiom (CertMachine.plantedAxiomC1)" — a refusal by unsupported feature, exit 2, said as
  such — and by Comparator ("Illegal axiom detected: 'CertMachine.plantedAxiomC1'"); C2 (one proof replaced by sorry)
  by con-leche ("use of the sorryAx axiom in value of LFunction_ne_zero_of_half_lt_re", exit 2) and by Comparator
  ("Illegal axiom detected: 'sorryAx'"). Landlock on this host is ABI v4: landrun warns that device ioctl, pathname
  UNIX socket connections and UDP restrictions are not enforced (P1's disclosure).
- 2026-11-26 00:19 — S1 (Comparator v4.35.0 against cert-machine's challenge) running; KR running since 00:08.
- 2026-11-26 00:51 — KR passed: `leanchecker --fresh Main` (readable edition) exit 0 after 2,546 s (42 min 26 s wall,
  peak RSS 11.1 GB, KR.err). S1 still running (since 00:19:29).
- 2026-11-26 00:56 — S1 passed: Comparator v4.35.0 against cert-machine's Mathlib-only challenge, in its Landlock sandbox
  (ABI 4, P1's disclosure), "Lean default kernel accepts the solution" / "Your solution is okay!", exit 0 after 2,229 s
  (37 min, peak RSS 15.9 GB). The recorder (00:58): I1, B1, S1, K1, K2, KR, CHAR CERTIFIED; A1 waits for the compact
  edition, C1–C3 for C3S (running since 00:56:38), then D1, B2, E1, S2.
- 2026-11-26 01:02 — C3S: Comparator refuses the challenge with 1/2 → 1/3 in DirichletLZerosOnLine ("Const does not
  match between challenge and target 'DirichletLZerosOnLine'", exit 1 after 350 s): all three planted controls are now
  refused by every check they went through. D1 on the readable edition running since 01:02:28.
- 2026-11-26 01:05 — D1 (readable edition) exit 0 after 183 s: "D1SUM closure_constants=222115 missing=0
  release_constants=64456 release_in_closure=50283 release_outside=14173 outside_decl=1394 outside_aux=12779
  outside_modules=753" — 14,173 lines, one per release constant outside the closure of the five. Not yet read: how
  many of the 1,394 'decl' rows are compiler-generated (e.g. `.congr_simp`) rather than written declarations; the
  authors' README says "several hundred". B2 (the compact edition) running.
- 2026-11-26 02:17 — the compact edition: B2 (lake build from source) exit 0 after 1,539 s; A1-compact: each of the five
  theorems depends on [propext, Classical.choice, Quot.sound]; E1 (Comparator against cert-machine's challenge) "Lean
  default kernel accepts the solution" / "Your solution is okay!", exit 0 after 2,598 s; D1-compact exit 0 after 185 s
  ("release_constants=51804 release_in_closure=37778 release_outside=14026 outside_decl=618 outside_aux=13408").
- 2026-11-26 02:18 — THE RECORDER (tools/check-grh-lean.py): claim CERTIFIED — "Lean accepts proofs of the five stated
  theorems from propext, Classical.choice and Quot.sound: B1, A1, S1, K1, K2 and KR pass and C1–C3 are refused". Every
  registered row CERTIFIED except D1 (COMPUTED, a list: 1,394 readable / 618 compact declarations outside the closure,
  by the census's rule, beside generated ones) and S2 (the release's own challenge; running since 02:17:41, dropped
  first under the ceiling). What this does not say: anything about the mathematics beyond what the kernels check; no
  person read the proof.
- 2026-11-26 03:03 — S2 passed: Comparator with the release's own Challenge.lean and comparator.json (nanoda on, as
  theirs): "nanoda kernel accepts the solution", "Lean default kernel accepts the solution", "Your solution is okay!",
  exit 0 after 2,754 s (45 min 54 s, peak RSS 15.9 GB). "invocation done: all" at 03:03:36; the seal lists 358 files
  (RESULTS.sha256; _phase.log differs from its sealed hash only by the two lines the runner appends after the seal).
  Every registered row now has its word: 12 CERTIFIED and D1 COMPUTED. Pulled home; the pod is deleted next.
- 2026-11-26 03:05 — the pod tzj3kmtfk6flzc deleted (list-pods empty after the delete); its small results are home in runs/tzj3kmtfk6flzc/.
- 2026-11-26 19:45 — the operator opened leanprover-community/riemann-hypothesis issue #8747, "An independent check of grh-lean at 72fead10 (both editions)", in his words (https://github.com/leanprover-community/riemann-hypothesis/issues/8747).
