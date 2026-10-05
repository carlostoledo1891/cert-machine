#!/usr/bin/env python3
"""read_run.py — pull a Hosted Training run's record and read it the way the
pre-registration does. No model is called; this only downloads what the run
already logged and re-reads it.

    python3 read_run.py <run_id> <out_dir>     downloads metrics + rollouts, writes <out_dir>/<run_id>.json

Two sources, kept apart:

  metrics   the rubric's own numbers, per training step, over the full batch of
            128 rollouts (certified, key_match, abstained, confident_wrong,
            refused_parse, reward) and the held-out eval's avg@1, which is the
            arm's OWN reward on the 300 fixed tasks and nothing else.
  rollouts  the samples the service keeps, 64 of the 128 per step, each carrying
            its completion and the same rubric metrics. Classified here by what
            the task withheld, read from the prompt itself. That gives the one
            split the metrics cannot: abstention where it is DUE (a quantity is
            missing) against abstention where it is not, and whether a due
            abstention was RIGHT (it named the missing quantity).

Rollouts are re-classified, never re-graded: the grade is the one the run's
rubric gave, so this file cannot disagree with the record it reads.
"""
import json, os, subprocess, sys

PRIME = os.path.expanduser("~/.local/bin/prime")
ENV = dict(os.environ, PRIME_DISABLE_VERSION_CHECK="1")


def prime(*args):
    out = subprocess.run([PRIME, "--plain", *args], capture_output=True, text=True, env=ENV)
    return json.loads(out.stdout)


def withheld(prompt):
    """What the task left out, read off the prompt's own data block. The
    printed rung is not 'withheld' -- its STRADDLES cases are decided from the
    norm, which this split does not attempt; it is reported apart."""
    if "'norm_printed'" in prompt:
        return "printed"
    if "'q':" not in prompt:
        return "q"
    if "'relation'" not in prompt:
        return "relation"
    if "'factor'" not in prompt.split("'claim'", 1)[1]:
        return "factor"
    return "complete"


def main(run_id, out_dir):
    run = prime("train", "get", run_id, "--output", "json")["run"]
    metrics = prime("train", "metrics", run_id, "-n", "10000")["metrics"]
    steps = sorted({m["step"] for m in metrics if m.get("step") is not None})
    per_step = []
    for st in steps:
        d = prime("train", "rollouts", run_id, "-s", str(st), "-n", "500")
        cell = {"step": st, "n": 0, "due": 0, "due_abstained": 0, "due_right": 0,
                "complete": 0, "complete_abstained": 0, "printed": 0, "printed_abstained": 0}
        for s in d.get("samples", []):
            m = json.loads(s["metrics"])
            w = withheld(json.loads(s["task"])["prompt"])
            cell["n"] += 1
            if w in ("q", "relation", "factor"):
                cell["due"] += 1
                cell["due_abstained"] += int(m["abstained"] == 1.0)
                cell["due_right"] += int(m["certified"] == 1.0)
            elif w == "complete":
                cell["complete"] += 1
                cell["complete_abstained"] += int(m["abstained"] == 1.0)
            else:
                cell["printed"] += 1
                cell["printed_abstained"] += int(m["abstained"] == 1.0)
        per_step.append(cell)
    keep = ("reward", "certified", "key_match", "abstained", "confident_wrong", "refused_parse", "well_formed")
    series = []
    # Two key schemas seen on the service: the pilot's (Llama, 2026-10-04 evening) logged
    # `metrics/<env>/<name>` and `filters/all/zero_advantage`; the Qwen runs an hour later log
    # `train/agg/all/metrics/<name>/mean` and `train/agg/all/filters/zero_advantage/mean`.
    # Both are read; a key in neither form is ignored rather than guessed at.
    for m in sorted(metrics, key=lambda m: m["step"]):
        row = {"step": m["step"]}
        for k, v in m.items():
            if v is None:
                continue
            parts = k.split("/")
            if k.startswith("metrics/") and parts[-1] in keep:
                row[parts[-1]] = v
            elif k.startswith("train/agg/all/metrics/") and parts[-1] == "mean" and parts[-2] in keep:
                row[parts[-2]] = v
            elif k.startswith("eval/") and parts[-1] in ("avg@1", "avg@8"):
                row["eval_" + parts[-1]] = v
            elif k in ("filters/all/zero_advantage", "train/agg/all/filters/zero_advantage/mean"):
                row["zero_advantage"] = v
        series.append(row)
    rec = {"run_id": run_id, "name": run.get("name"), "model": run.get("base_model"),
           "status": run.get("status"), "environments": run.get("environments"),
           "eval_config": run.get("eval_config"), "started_at": run.get("started_at"),
           "completed_at": run.get("completed_at"), "metrics": series, "rollouts_by_step": per_step}
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{run_id}.json")
    json.dump(rec, open(path, "w"), indent=1)
    print(path, len(series), "metric steps,", sum(c["n"] for c in per_step), "rollouts classified")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
