# Brief for the bridge and anchor authors (VP ≠ VNP lane, cert-machine, 2026-11-24; rows F2, F3, F4 of PREREG.md)

You write Lean 4 proofs, with a compiler, on the lane's pod, in the release's own environment (Lean v4.33.1, Mathlib
0df444a3, the release built). You do not decide anything: the control room replays your files with the checkers
afterwards. Your value is a proof that goes through without changing what any sealed statement means.

## The pod (shared; be careful)

ssh -i ~/.ssh/id_ed25519_runpod -o BatchMode=yes -o ServerAliveInterval=15 -p 35568 root@38.80.152.147
Work as the user `tester` (runuser -u tester -- bash -lc '…'; PATH needs /home/tester/.elan/bin). Your workspace is
given below: a copy of the built release. Never write outside it; never touch /results, /opt/vpd, /home/tester/fm,
/home/tester/exports, /home/tester/ci-tools or another author's workspace; never kill a process you did not start, and
never use `pkill -f` with a pattern that appears in your own command line. Phase-1 checks run on the same machine
(128 GB, 16 vCPU): compile one file at a time (`lake env lean <file>`, or `lake build <Module>` after adding a
`[[lean_lib]]` for your own folder to the workspace's lakefile — record that change).

## Rules

- The sealed blind statements are corpus/vp-vnp/blind/A/BlindA.lean and blind/B/BlindB.lean (sha256 in SEAL-1A,
  SEAL-1B). Copy yours into your workspace as `CertMachine/BlindX.lean`. If it does not elaborate, repair ONLY what is
  needed for it to elaborate with its evident meaning (a wrong Mathlib name, a missing instance argument, a coercion),
  one change at a time, each logged in REPAIRS.md with the error message that forced it. If a repair would change what
  a definition or proposition means, STOP and report it: that is a finding, not a repair.
- Never edit the release's files. Never use sorry, axiom, native_decide, implemented_by or extern in your final files.
  `#print axioms` of every final theorem must show only propext, Classical.choice, Quot.sound.
- Keep a WORKLOG.md (what you tried, what failed, how long). Your final files: the repaired blind file, REPAIRS.md,
  your proof files, WORKLOG.md, and a CHALLENGE file: your blind file's five propositions stated as theorems with
  `sorry` (module CertMachine.ChallengeX, importing only CertMachine.BlindX), the theorems named exactly as in your
  proof module, so the control room can run Comparator with OUR statement as the challenge.
- When done, copy your final files back to the Mac under notes/vp-vnp-blind-2026-11-23/bridge-X/ (scp) and report.

## Author A — bridge for BlindA (workspace /home/tester/ws-A)
Prove, in module CertMachine.BridgeA (importing Solution and CertMachine.BlindA), theorems
`CertMachine.BridgeA.mainTheorem : BlindA.MainTheorem`, `.mainTheoremApprox`, `.separation`, `.separationClosure`,
`.permanentOverReal`, each from the release's Solution theorems. BlindA counts only operations (inputs and constants
free) and defines complexity as a minimum; the release counts every gate. The existential constant absorbs the
difference (an SLP of length ℓ gives a release circuit of at most 3ℓ + 1 gates; the bound with c gives one with a
smaller c for large m) — prove it, do not assume it.

## Author B — bridge for BlindB (workspace /home/tester/ws-B)
The same for BlindB, module CertMachine.BridgeB, theorems `CertMachine.BridgeB.mainTheorem` etc. BlindB's circuits
are DAGs with every vertex counted.

## Author C — anchors and the red control (workspace /home/tester/ws-C), module CertMachine.Anchors
On the release's definitions (Statement.*):
A1 every polynomial over a commutative semiring in finitely many variables has a circuit (∃ s, Computes f s);
A2 Computes f s → Computes f (s + 1);
A3 Computes (X v ^ 2 ^ k) (k + 1) (one variable gate and k squarings: reuse, so circuits, not formulas);
A4 over a field, Computes f s → Approximates f s;
A5 for every c > 0 and every k, eventually (m : ℝ) ^ k < m ^ (c * logb 2 m ^ (1/3)) (the bound is superpolynomial);
A6 from MainTheorem alone (not from separation): the permanent family over a field of characteristic ≠ 2, and the
    Hamiltonian-cycle family over any field, are not in VP;
R1 PROVE FALSE the planted claim "the main bound holds for the dense power (Σ_{i,j} X (i, j)) ^ m" over ℚ (state it
    exactly as MainTheorem's shape with p = 0 and that polynomial; refute it with a repeated-squaring circuit);
then, as far as time allows, A1–A3 for BlindA's and BlindB's models too.
