# verified-v0: certified answers to the Verify Gym held-out set

`verified-v0.jsonl.gz` holds every reply in the scorecard's model rows that answered a frozen held-out task with
a bracket that both deciders call CERTIFIED. That means both sides are proved by exact integer arithmetic, by
`environments/verify_gym/verify_gym/exact.py` and again by `environments/verify_gym/check.js`, which share no
code. Before the file is written, every row is re-decided by check.js. The rows paid a reward above 0 also go
through `recheck.py` as a rollout log, and it must AGREE. A reply cut off at the caller's token limit is never
included.

The file is written and re-derived by `environments/verify_gym/filter.py` (`--check`). Its counts, the sha256 of
the text and of the archive, and the recheck result are in `certs/verify-gym-filter.json` under `dataset`.

**These are HELD-OUT tasks.** A model trained on this file can never be evaluated on `heldout-v0`. The file is
not published anywhere; whether it is, and where, is the operator's decision.

## One row (one JSON object per line, keys sorted)

| key | what it is |
|---|---|
| `id` | `<row>\|<task_id>\|<sample>`, unique |
| `task_id`, `family`, `instance` | the task: `xx/heldout/0`, the family, and its parameters (N; n and k; the polynomial and its isolating interval) |
| `stated` | the bracket the task gave (`lo`, `hi` as text) and its decimals `d0` |
| `cap` | the most decimals the task pays for |
| `prompt_sha256` | sha256 of the frozen prompt text (the prompt itself is in `heldout-v0.json`) |
| `model`, `provider`, `thinking`, `date`, `row`, `sample` | who answered, how, and which of the 8 samples |
| `reply`, `reply_sha256` | the model's whole reply text, unedited, and its sha256 |
| `answer` | `lo`, `hi` as the reply wrote them, and `lo_exact`, `hi_exact` as reduced fractions |
| `certificate` | `verdict` (always CERTIFIED), `sides` (both CERTIFIED), `decimals` (certified decimals of hi − lo), `progress` (decimals beyond the stated bracket, capped), `deciders` |
| `reward`, `reward_exact` | progress / cap, as a float and as an exact fraction. 0 for a certified answer that is no tighter than the stated bracket |

## Licence

Our part is MIT: the selection, the certificates and the schema. The `reply` texts are model outputs, generated
through Prime Inference on 2026-10-31 (the last row finished on 2026-11-01). Each model's own licence and Prime Intellect's terms of service apply to
them. They are not restated or reviewed here, so read the model's card before reusing its outputs, and before
training on them in particular.
