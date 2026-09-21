#!/usr/bin/env python3
"""Run the Inspect pipeline END TO END with Inspect's mock model driven by the
reference policies — no API, no money — and write the logs the ledger reads.

    python3 environments/blind_spot/inspect/run_control.py [--n 36]

WHY THIS EXISTS. The frontier-model run (`inspect eval … --model
anthropic/claude-sonnet-5`) reached the API on 2026-09-21 and was refused with
"credit balance is too low" before any generation (the attempt is kept in
logs/blocked/). Until the operator tops the account up, the pipeline still has
to be shown to run whole — dataset → solver → model → scorer → log → ledger —
and the way to show it without a model is the way the verifiers README does:
the reference policies. `sat` answers with the SAT witness or EQUIVALENT and
must score +1 on every task; `abstain` answers UNDECIDED and must score 0 on
every task; `never` answers EQUIVALENT always and must score −1 on every
killable task. These are CONTROLS of the pipeline, not a measurement of any
model, and the ledger marks them `control: true`.

The policy is a SOLVER, not a mock model output: on the `blind` rung every task
has the same prompt and on `profile` many do (that is what the rung withholds),
so a mock model that reads only the message list cannot know which task it is
answering — the first version of this file did that and the `sat` policy
scored 23 of 36, which is how the fact was learned. The solver reads the
sample's metadata, the way the verifiers reference policies read the task, and
appends the assistant message; the scorer then runs exactly as it does after a
model turn. `mockllm/model` is the eval's model of record and is never asked.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENV = os.path.dirname(HERE)
VENV_PY = os.path.join(ENV, ".venv", "bin", "python")
try:
    import inspect_ai  # noqa: F401
except ImportError:
    if os.path.exists(VENV_PY) and os.path.abspath(sys.executable) != os.path.abspath(VENV_PY):
        os.execv(VENV_PY, [VENV_PY] + sys.argv)
    raise SystemExit("environments/blind_spot/.venv is missing: `make blind-spot-venv`")

sys.path.insert(0, ENV)
sys.path.insert(0, HERE)

from inspect_ai import eval as inspect_eval                 # noqa: E402
from inspect_ai.model import ChatMessageAssistant, ModelOutput   # noqa: E402
from inspect_ai.solver import Generate, TaskState, solver   # noqa: E402

import task as T                                            # noqa: E402
from blind_spot import api                                  # noqa: E402


def truthful(info):
    t = api.task_for(info["mutant"], info["rung"])
    w = t.mutant["witness"]
    if w:
        return json.dumps({"verdict": "KILL", "pairs": [{"u": w["u"], "v": w["v"]}], "where": "the SAT witness"})
    return json.dumps({"verdict": "EQUIVALENT", "where": "the miter"})


POLICIES = {
    "sat": truthful,
    "abstain": lambda info: json.dumps({"verdict": "UNDECIDED"}),
    "never": lambda info: json.dumps({"verdict": "EQUIVALENT", "where": "always"}),
}


@solver
def reference_policy(name: str):
    policy = POLICIES[name]

    async def solve(state: TaskState, generate: Generate) -> TaskState:
        reply = policy(state.metadata)
        state.messages.append(ChatMessageAssistant(content=reply, model=f"policy/{name}"))
        state.output = ModelOutput.from_content(model=f"policy/{name}", content=reply)
        return state
    return solve


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=3 * T.DEFAULT_PER_RUNG)
    ap.add_argument("--seed", type=int, default=T.DEFAULT_SEED)
    ap.add_argument("--policies", nargs="*", default=list(POLICIES))
    ap.add_argument("--log-dir", default=os.path.join(HERE, "logs"))
    a = ap.parse_args()

    task = T.blind_spot(num_tasks=a.n, seed=a.seed)
    for name in a.policies:
        logs = inspect_eval(task, model="mockllm/model", solver=reference_policy(name), log_dir=a.log_dir,
                            log_format="json", display="plain",
                            tags=["control", f"policy:{name}"], metadata={"policy": name, "control": True})
        log = logs[0]
        vals = [s.scores["exact_verifier"].value["reward"] for s in log.samples]
        print(f"{name:<8} {log.status}  n={len(vals)}  mean reward {sum(vals) / len(vals):+.3f}  {os.path.basename(log.location)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
