# Brief for the Phase 1 runner (ω = 9/4 lane, cert-machine, 2026-11-25)

You run Phase 1 of corpus/omega-nine-fourths/PREREG.md (rows PIN, K0, K1, K1N, EXP, K2, K3, KR, C1, C2, C3, CEN) on
the pod the control room created, and prepare CR for a second pod. Read PREREG.md first; its words govern. Templates
that worked before: tools/runpod-vp-vnp-p1.sh, tools/runpod-vp-vnp-cr.sh (the VP ≠ VNP lane: every Lean, cargo and go
step as an unprivileged user, results root-owned in /results, one log line per step with exit, time and peak memory)
and .github/workflows/openai-math-kernel.yml (the October openai-math lane's pins for Lean v4.34.1: Comparator
d03acab154d269c06e60e4de7e4cc85deebff94b, lean4export 076e8e57707e813375e8f9da8bf989799ace9680, landrun
811cfff51ceaf3d9843708aa6d22e9b84ccac8b4, nanoda 3a2407216ee84a75f9e1aead6803d0578be06ae7; `lake update` runs the
release's post-update patch hook). Write tools/runpod-omega-p1.sh and tools/runpod-omega-cr.sh in the same style.

Rules: build ONLY the closure of the solution module and the challenge module (the library is 52,000+ files; never
`lake build` the whole of OAI). Never execute anything of the release outside the pod. The pin step comes first: a
sparse checkout at 92b516ef, the PREREG's sha256s checked, then target-SHA256SUMS of every file the two modules
import transitively (from the import graph, before building), written to corpus/omega-nine-fourths/A1-target-SHA256SUMS;
hash it into corpus/omega-nine-fourths/SEAL-A1.sha256 and stamp it (`~/Library/Python/3.9/bin/ots stamp`) BEFORE K0
starts. Record the closure's size (files, lines, modules, which dependencies, which patched files) as CEN's first line.
Pull every result home into corpus/omega-nine-fourths/runs/p1/ with hashes on both ends. If a row cannot run (memory,
time), say which and why, and stop that row rather than improvise around the PREREG; a deviation is written in
corpus/omega-nine-fourths/DEVIATIONS.md with its time, before the deviating step runs. Ssh key ~/.ssh/id_ed25519_runpod.
`date -u` before every time you write. Nothing committed, nothing sent.
Hand back, first line: "P1: K0 … K1 … K1N … K2 … K3 … KR … C1 … C2 … C3 …" with each row's outcome, then CEN, then
what is NOT established, then the exact script for CR.
