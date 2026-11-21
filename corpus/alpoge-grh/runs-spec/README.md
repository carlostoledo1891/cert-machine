# SPEC run (amendment A4), 2026-11-21 ~00:45 UTC

Where: the build pod, in a root-owned workspace /root/specws holding only Mathlib at 0df444a3 from a clean
`lake exe cache get` (no release code; the release's build ran as another user). Toolchain v4.33.1 (elan).
File: instruments/alpoge-grh/spec/Spec.lean, sha256 a15f6d86eb74275c505cc5299925d029b34a250b85e0c9d5c69a10afdad50db9.

- `spec-compile-first.out`: the first compile (the file as committed in 0fd9ab3b9) failed only on the notation `π`
  (not open); `π` became `Real.pi` in four `have` lines, no statement changed (DEVIATIONS item 7).
- `spec-compile.out`: the second compile, exit 0, two warnings (`push_neg` deprecated).
- `spec-axioms.out`: `rhStrip_iff` and `re_mem_strip_of_nontrivial` depend on propext, Classical.choice, Quot.sound.
