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
