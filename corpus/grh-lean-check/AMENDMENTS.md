# grh-lean — amendments (append-only; each dated and sealed)

## A1 (2026-11-25 22:5x UTC, before any run) — the ceiling and the start

The operator's answer (dialog): "Cap US$15, start after the Lean pod". Ceiling US$15 for this lane. The first pod is
created only after the Lean-bridge pod alt1te1i1gsnpy (claimbox, gate LB1) is deleted, with no top-up of the RunPod
balance assumed. The balance is read before the pod is created and at every milestone; the lane stops at US$15.

## A2 (2026-11-25 22:5x UTC, before any run) — CHAR runs now, on the Lean-bridge pod

The operator's word ("Let's also do 3 and 4": 3 the unused-declaration map, 4 the textbook statement bridge). CHAR
needs Mathlib only, not the release, so it runs now on the already-running Lean-bridge pod alt1te1i1gsnpy (cpu3c 32
vCPU / 64 GB, US$0.96/h, paid by that lane), in its own folder /root/char, with Lean v4.35.0 and Mathlib 56a00585
(the release's pins), from instruments/alpoge-grh/spec/{Spec,Textbook,TextbookAx}.lean and
instruments/alpoge-grh/Challenge.lean unchanged (the four definitions there are the release's Statements.lean, which
is byte-identical at 72fead10). A file that no longer elaborates at the new Mathlib is repaired as a recorded change,
never silently. D1 stays as registered (from this lane's own build); the community already has a constant-graph tool
for its alpoge branch (leanprover-community/riemann-hypothesis issue #1304, opened 2026-11-24, and many
"remove unreachable modules" PRs), so no census of that branch is added here.

## A3 (2026-11-25 23:25 UTC, before any run) — the runner, the controls' form, the order under the ceiling

The control room adopts the proposals P1–P6 of PROPOSED-AMENDMENTS.md (written by the agent that prepared
tools/runpod-grh-lean.sh, tools/check-grh-lean.py and instruments/grh-lean/, none of it run) as written there, with
this order under A1's US$15 ceiling: setup, DERISK, I1, CHB, B1, A1, EXP, K1, K2, the controls (C1, C2 naming the
planted theorem only; C3 through K2 and S1's check), S1, KR beside the Comparator chain, D1 on the readable edition;
then B2 and E1; S2 last and dropped first. DEADLINE is set from the ceiling and the balance read before the pod is
created. P1's disclosure stands: at the host's Landlock ABI, what landrun enforces is recorded, and Comparator's
systemd AF_UNIX guard cannot run in a container; S1's row says both.
