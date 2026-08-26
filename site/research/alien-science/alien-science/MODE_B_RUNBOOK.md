# Mode B runbook — dual-lane under Docker isolation

**Audience:** owner machine only (or a Fellows host that already runs Anthropic’s W2S sandbox).
**Status:** P3 · 2026-07-31. Documents the legitimate local stress-test path.
**Cost refuse:** this runbook does **not** re-hill-climb their ~18k USD chat run.

Upstream: [safety-research/automated-w2s-research](https://github.com/safety-research/automated-w2s-research)
(public; **no LICENSE file** as of 2026-07-31 — do not assume MIT).

Companion: `disposition-stub.js` (our lane) · report page labs for the disagreement table.

---

## What “Mode B” means here

| Lane | Who serves it | Legitimacy rule |
|---|---|---|
| **PGR** | Their Flask `/api/evaluate-predictions` | Agent in Docker; **no** `labeled_data/` mount |
| **Disposition** | Our `disposition-stub.js` on the **host** | Fixtures / mutants stay server-side; agent posts claim payloads only |

Mode A (bare subprocess with labels reachable) marks the PGR lane **illegitimate**.
Mode C (RunPod) is the same shape with cloud orchestration — not detailed here.

```text
┌──────────────────────────── host ────────────────────────────┐
│  labeled_data/          ← NEVER mounted into the agent       │
│  W2S Flask :8000        ← /api/evaluate-predictions (PGR)    │
│  disposition-stub :8765 ← /api/dispose · /api/dispose-fixture│
└───────────────┬──────────────────────────┬───────────────────┘
                │ predictions              │ claim / fixture id
                ▼                          ▼
        ┌───────────────┐          ┌──────────────────┐
        │ Docker agent  │          │ dual-client.js   │
        │ mounts:       │          │ --post-pgr       │
        │  data/ (ro)   │          │ --via-stub       │
        │  cache (ro)   │          │                  │
        │  NO labels    │          └──────────────────┘
        └───────────────┘
```

---

## Prerequisites

1. Node.js on PATH (this monorepo).
2. A clone of `automated-w2s-research` with `uv sync` already done (owner machine).
3. Docker image built (`./scripts/docker-build-push.sh` or their `run.sh` path).
4. `labeled_data.tar.gz` prepared on the **host** only (`GROUND_TRUTH_DIR`).
5. No requirement to spend Anthropic API budget for the **disposition** half.

---

## Steps (decidable)

### 1 · Start their PGR server (host)

```bash
# Inside the upstream clone — owner machine only
export GROUND_TRUTH_DIR="$PWD/labeled_data"   # host only
python run.py server --port 8000
export W2S_EVAL_URL=http://127.0.0.1:8000
```

### 2 · Start our disposition stub (host)

```bash
# cwd = this directory (public: research/alien-science/alien-science/)
node disposition-stub.js --port 8765
# other shell:
export DISPOSITION_URL=http://127.0.0.1:8765
curl -s "$DISPOSITION_URL/health"
curl -s "$DISPOSITION_URL/api/tools"   # MCP-shaped tool list
```

### 3 · Offline disposition sanity (no Docker, no GPU)

```bash
# cwd = this directory
node dual-client.js --fixture heldout-ccs-es
DISPOSITION_URL=http://127.0.0.1:8765 \
  node dual-client.js --fixture heldout-ccs-es --via-stub
DISPOSITION_URL=http://127.0.0.1:8765 \
  node dual-client.js --fixture heldout-ccs-es --via-stub --plant-mutant
```

Expect: clean → `CERTIFIED` / `agree_with_teeth`; plant → `REFUSED` / `disagree`.
`--via-stub` without `DISPOSITION_URL` exits nonzero (no silent fake remote).

### 4 · Launch the agent under Docker (Mode B)

```bash
# Upstream clone
export DOCKER_LOCAL_MODE=true
export DOCKER_LOCAL_IMAGE=w2s-research
export ANTHROPIC_API_KEY=...          # their spend, not ours
# Dashboard → launch with "Docker (local GPUs)"
```

**Pre-flight checklist before treating any PGR as *measured here*:**

1. `DOCKER_LOCAL_MODE=true` (not bare subprocess).
2. Agent filesystem listing does **not** contain `labeled_data/`.
3. Predictions leave the container only via `/api/evaluate-predictions`.
4. Disposition fixtures / `fellows-pack/fixtures/exam-pack.public.json` ground truth stay on the host (stub or local Node).
5. `cost_refuse.status` remains `REFUSED` for the ~18k USD re-hill-climb.

### 5 · Optional live dual-lane call

```bash
# Predictions must be real — never invented by this monorepo
W2S_EVAL_URL=http://127.0.0.1:8000 \
DISPOSITION_URL=http://127.0.0.1:8765 \
W2S_EVAL_BODY='{"predictions":[...],"dataset":"chat","weak_model":"...","strong_model":"..."}' \
  node dual-client.js --fixture heldout-ccs-es --post-pgr --via-stub
```

---

## MCP shape (what Fellows can wire)

`GET $DISPOSITION_URL/api/tools` returns two tools next to their `evaluate_predictions`:

| Tool | Role |
|---|---|
| `dispose_claim` | Open dispose: kernel + payload → disposition/v0 |
| `dispose_fixture` | Server-owned clean/mutant; plant applied host-side |

An AAR should call disposition the way it calls PGR eval: **post evidence, receive a verdict it cannot rewrite**.

---

## Explicit refusals (do not soft-pedal)

| Ask | Answer |
|---|---|
| Re-run the ~18k USD hill-climb from this runbook? | **REFUSED** |
| Treat Mode A PGR as measured? | **FORBIDDEN** |
| Re-attribute 0.97 / 0.23 / 0.94 / 0.47 as ours? | **FORBIDDEN** until Mode B/C remeasure |
| Soft-CERTIFY a mutant via client JSON? | Stub returns **400**; battery goes red if ever honored |

---

## Exit map (P3)

| DONE-WHEN | Artifact |
|---|---|
| Disposition HTTP stub | `disposition-stub.js` |
| MCP tool descriptors | `GET /api/tools` |
| dual-client `--via-stub` | `dual-client.js` |
| Mode B steps + checklist | this file |
| Battery | monorepo `make check-alien-science` (stub + Mode B gate) |
