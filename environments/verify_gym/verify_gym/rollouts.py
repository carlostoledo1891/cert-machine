"""The rollout log: what a training run (or a readiness run) writes, one JSON object per line, so that every reward
it paid can be decided again afterwards by the second decider (recheck.py).

    line 1      {"format": "verify-gym-rollouts/1", "split": "train" | "val" | "heldout", ...}
    each other  {"task_id": "kroot/train/17", "reply": "<the model's whole reply text>", "reward": 0.35, ...}

`task_id` is the environment's own id; the row is rebuilt from it, never from anything else in the log. `reply` is
the text the reward was computed from, unedited. `reward` is the number the trainer used, as a JSON number. Any
other key is kept and ignored, except three that are read when present: `sample` (the index within its group;
with it, a (task_id, sample) pair may appear once), `finish_reason` ("length" means the caller cut the reply off,
and such a reply is paid 0), and `reply_sha256` (when present it must be the sha256 of `reply` in UTF-8).

A reward is a JSON number in [0, 1], never a boolean. It is read as its PROGRESS, reward x cap with the cap taken
from the rebuilt row; the product must be within 1e-6 of an integer, because the environment only ever pays
progress / cap (a trainer that stores rewards as float32 cannot write k/20 exactly, and 1e-6 is far below the
smallest step, 1/20). Standard library only: a trainer can import this to write the log.               MIT"""
from __future__ import annotations

import hashlib
import json
import math

FORMAT = "verify-gym-rollouts/1"
SPLITS = ("train", "val", "heldout")
EPS = 1e-6


def header(split, **extra):
    if split not in SPLITS:
        raise ValueError("split must be one of %s" % (SPLITS,))
    return {"format": FORMAT, "split": split, **extra}


def sample(task_id, reply, reward, **extra):
    return {"task_id": task_id, "reply": reply, "reward": reward,
            "reply_sha256": hashlib.sha256(reply.encode("utf-8")).hexdigest(), **extra}


def dumps(head, samples):
    return "".join(json.dumps(o, ensure_ascii=False, sort_keys=True) + "\n" for o in [head] + list(samples))


def progress_of(reward, cap):
    """The integer progress a logged reward stands for, or None when no reward of this environment equals it."""
    k = round(reward * cap)
    return k if abs(reward * cap - k) <= EPS and 0 <= k <= cap else None


def loads(text):
    """(header, samples). Raises ValueError naming the first line that is not the format."""
    lines = [l for l in text.splitlines() if l.strip()]
    if not lines:
        raise ValueError("an empty log")
    try:
        head = json.loads(lines[0])
    except ValueError:
        raise ValueError("line 1 is not JSON")
    if not isinstance(head, dict) or head.get("format") != FORMAT:
        raise ValueError("line 1 is not a %s header" % FORMAT)
    if head.get("split") not in SPLITS:
        raise ValueError("the header's split must be one of %s" % (SPLITS,))
    out, seen = [], set()
    for n, l in enumerate(lines[1:], start=2):
        try:
            o = json.loads(l)
        except ValueError:
            raise ValueError("line %d is not JSON" % n)
        if not isinstance(o, dict):
            raise ValueError("line %d is not an object" % n)
        tid, reply, rw = o.get("task_id"), o.get("reply"), o.get("reward")
        if not isinstance(tid, str) or tid.count("/") != 2:
            raise ValueError("line %d: task_id must be family/split/index" % n)
        if tid.split("/")[1] != head["split"]:
            raise ValueError("line %d: %s is not from the header's split %r" % (n, tid, head["split"]))
        if not isinstance(reply, str):
            raise ValueError("line %d: reply must be a string" % n)
        if isinstance(rw, bool) or not isinstance(rw, (int, float)) or not math.isfinite(rw) or not 0 <= rw <= 1:
            raise ValueError("line %d: reward must be a number in [0, 1]" % n)
        if "reply_sha256" in o and o["reply_sha256"] != hashlib.sha256(reply.encode("utf-8")).hexdigest():
            raise ValueError("line %d: reply_sha256 is not the reply's" % n)
        if "sample" in o:
            if (tid, o["sample"]) in seen:
                raise ValueError("line %d: (%s, sample %s) appears twice" % (n, tid, o["sample"]))
            seen.add((tid, o["sample"]))
        o["_line"] = n
        out.append(o)
    return head, out
