# Fellows pack — alien-science disposition lane (10-minute re-run)

MIT-clean drop-in for Anthropic Fellows / Alignment Science.
Python-first; JS kernels under `kernels/swap_consistency.js` point at the parent
single-source `swap-consistency.js` (no second copy).

## Legitimacy (read first)

| Mode | Meaning |
|---|---|
| Offline disposition | Always legitimate. No labels. No GPU. |
| Live `W2S_EVAL_URL` | *Their* Docker/RunPod eval spend. Never invent predictions. |
| Mode A `labeled_data/` reachable | Mark PGR lane **illegitimate** (`LABELED_DATA_REACHABLE=1`). |
| ~18k USD re-hill-climb | **REFUSED** — not part of this pack. |

## 10-minute path

From the parent `alien-science/` directory (public tree:
`research/alien-science/alien-science/`):

```bash
python3 fellows-pack/tools/dual_client.py --fixture heldout-ccs-es
python3 fellows-pack/tools/dual_client.py --fixture heldout-ccs-es --plant-mutant

python3 fellows-pack/tools/volume_runner.py \
  --batch fellows-pack/fixtures/volume_batch_100.jsonl

python3 fellows-pack/kernels/disposition_validate.py \
  --pack fellows-pack/fixtures/exam-pack.public.json
```

Match `expected_outputs.md` and `golden/`. Live PGR fields are excluded from golden
hashes (`remeasured:true` instead).

Public exam fixture is swap-only (no ledger identifiers). The larger ledger-harvested
sample stays private in the monorepo when present.

## Crosslang

`swap_consistency.py` mirrors `swap-consistency.js`. Residuals must agree as exact
rational strings (`0`, `1/8`, …).

## Interactive report

https://mfg-lab.vercel.app/research/alien-science/alien-science
