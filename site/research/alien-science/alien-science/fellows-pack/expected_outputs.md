# Expected outputs — fellows-pack CI contract

Golden files are bit-stable for offline fixtures. Live PGR fields are never
golden-hashed; tag `remeasured:true` instead. `~18k USD` cost_refuse stays REFUSED.

Held-out note (corrected 2026-08-04): the heldout-ccs-es fixture carries **chat
0.93 only** — the source reports no held-out numbers for CCS + Evolution Strategy
Refinement (fig. 8's 0.94/0.47 are CCS + Self-Distill's). Both clients therefore
emit `heldout_math_pgr: null`, `heldout_code_pgr: null` and pass the fixture's
`heldout_note` through.

| Command | Exit | Must contain |
|---|---|---|
| `python tools/dual_client.py --fixture heldout-ccs-es` | 0 | `disposition.verdict=CERTIFIED`, `disagreement.kind=agree_with_teeth`, `cost_refuse.status=REFUSED`, `pgr.mode=reported` |
| `python tools/dual_client.py --fixture heldout-ccs-es --plant-mutant` | 0 | `disposition.verdict=REFUSED`, `refuse_reason="max residual 1/5 exceeds ε=0"`, `disagreement.kind=disagree` |
| `python tools/volume_runner.py --batch fixtures/volume_batch_100.jsonl` | 0 | `n=100`, `certified + refused = 100`, `mutant_certified=0` |
| `python kernels/disposition_validate.py --pack fixtures/exam-pack.public.json` | 0 | every mutant side ≠ CERTIFIED |
| `W2S_EVAL_URL=… python tools/dual_client.py --post-pgr …` | 0 only if URL set and body real | live `pgr` fields; never silent fake |
| `--post-pgr` without `W2S_EVAL_URL` | ≠0 | error names `W2S_EVAL_URL` |

## Golden files — which golden pins which command, in which language

| File | Language | Exact command (run from `alien-science/`) |
|---|---|---|
| `golden/dual_client_heldout.json` | **Node** | `node dual-client.js --fixture heldout-ccs-es` — byte-identical stdout |
| `golden/dual_client_heldout.mutant.json` | **Node** | `node dual-client.js --fixture heldout-ccs-es --plant-mutant` — byte-identical stdout (`verdict: REFUSED`, `refuse_reason: "max residual 1/5 exceeds ε=0"`) |
| `golden/dual_client_heldout.python.json` | **Python** | `python3 fellows-pack/tools/dual_client.py --fixture heldout-ccs-es` — byte-identical stdout |
| `golden/volume_batch_100.summary.json` | Python | `python3 fellows-pack/tools/volume_runner.py --batch fellows-pack/fixtures/volume_batch_100.jsonl` (`n=100`, `mutant_certified=0`) |
| `golden/plant_mutant.refused.json` | Python | `python3 fellows-pack/tools/volume_runner.py --batch fellows-pack/fixtures/plant_mutant_batch.jsonl` — all REFUSED, `mutant_certified=0` |

The Node and Python dual-client outputs agree on every shared field; the Node
output additionally carries `lanes.disposition.ground_truth_role`,
`lanes.disposition.mode` and a top-level `mode_b_runbook` pointer, and the Python
file uses JSON `\uXXXX` escapes for non-ASCII. That is why each language pins its
own golden.

Re-generate goldens only when fixtures or kernels change deliberately; then
re-hash `MANIFEST.json`. (Done 2026-08-04: heldout fixture correction wave.)
