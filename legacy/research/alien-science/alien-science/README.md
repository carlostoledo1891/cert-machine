# Alien science — disposition pack (public)

Dual-lane disposition beside Anthropic-reported PGR. MIT. No API key required for
the disposition half. Interactive report:
https://mfg-lab.vercel.app/research/alien-science/alien-science

**Cost refuse:** full ~18k USD re-hill-climb is **REFUSED**. PGR digits stay
Anthropic-reported until you remeasure under Docker Mode B / RunPod Mode C.

## Layout

| Path | Role |
|---|---|
| `disposition-stub.js` | HTTP / MCP-shaped tools: `/api/dispose`, `/api/dispose-fixture` |
| `dual-client.js` | Offline dual-lane CLI; `--via-stub` · optional `--post-pgr` |
| `swap-consistency.js` · `em-channel.js` · `hack-detectors.js` | Kernels (exact rationals via `eqcert/`) |
| `WORKSHOP.md` | Printable seminar note (same claims, denser related work) |
| `MODE_B_RUNBOOK.md` | Docker Mode B + stub checklist |
| `fellows-pack/` | Python CI twin, fixtures, golden outputs |

## 10-minute path (from this directory)

```bash
# Requires Node + Python 3; eqcert/ at repo root (ships with mfg-lab)
node dual-client.js --fixture heldout-ccs-es
node dual-client.js --fixture heldout-ccs-es --plant-mutant
node dual-client.js --fixture em-disagree

node disposition-stub.js --port 8765
# other shell:
DISPOSITION_URL=http://127.0.0.1:8765 node dual-client.js --fixture heldout-ccs-es --via-stub

python3 fellows-pack/tools/dual_client.py --fixture heldout-ccs-es
python3 fellows-pack/tools/volume_runner.py --batch fellows-pack/fixtures/volume_batch_100.jsonl
python3 fellows-pack/kernels/disposition_validate.py --pack fellows-pack/fixtures/exam-pack.public.json
```

Match `fellows-pack/expected_outputs.md` and `fellows-pack/golden/`.

## Legitimacy

| Mode | Meaning |
|---|---|
| Offline disposition | Always legitimate |
| Live `W2S_EVAL_URL` | Their Docker/RunPod spend; never invent predictions |
| Mode A (`labeled_data/` reachable) | PGR lane **illegitimate** |
| ~18k USD re-hill-climb | **REFUSED** |

## Not in this pack

Outreach drafts, prior-art survey notes, monorepo batteries, ledger harvest sources.
Outreach send is a separate owner decision and is not authorized by this folder.
