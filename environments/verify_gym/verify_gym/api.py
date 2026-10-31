"""The framework-free API: rows in, decisions out. Every consumer (the CLI, both adapters, the battery, the tests)
imports this module; nothing here imports anything outside the standard library.

    curriculum()          curriculum.json: the families in the order added, the training stages, the held-out sets
    heldout(version)      the frozen held-out tasks, refused unless their file hashes to the curriculum's sha256
    train_row(stage, n)   row n of a training stage (a stage's mix never changes once listed)
    row(task_id)          a row rebuilt from its id alone: generated (train) or read from the frozen file (heldout)
    score(task_id, reply) the reward, decided exactly, from the id and the reply and nothing else
    preflight()           the forgery gate; every consumer runs it before it hands back a number
"""
from __future__ import annotations

import hashlib
import json
import os

from .families import REGISTRY
from .task import grade, make_row

HERE = os.path.dirname(os.path.abspath(__file__))
ENV_ID = "verify-gym"
_CACHE = {}


def _read(name):
    with open(os.path.join(HERE, name), "rb") as f:
        return f.read()


def curriculum():
    if "cur" not in _CACHE:
        _CACHE["cur"] = json.loads(_read("curriculum.json").decode("utf-8"))
    return _CACHE["cur"]


def heldout(version="v0"):
    """The frozen held-out rows of one version. The file's sha256 must be the one the curriculum (and the
    pre-registration) records, or this refuses."""
    key = "heldout:" + version
    if key not in _CACHE:
        entry = next((h for h in curriculum()["heldout"] if h["version"] == version), None)
        if entry is None:
            raise KeyError("no held-out set %r" % version)
        raw = _read(entry["file"])
        got = hashlib.sha256(raw).hexdigest()
        if got != entry["sha256"]:
            raise RuntimeError("verify-gym: %s hashes to %s, the curriculum pins %s - refusing to read a held-out "
                               "set that moved" % (entry["file"], got, entry["sha256"]))
        rows = json.loads(raw.decode("utf-8"))["tasks"]
        _CACHE[key] = rows
    return _CACHE[key]


def heldout_keys():
    if "hkeys" not in _CACHE:
        _CACHE["hkeys"] = {r["key"] for h in curriculum()["heldout"] for r in heldout(h["version"])}
    return _CACHE["hkeys"]


POOLS = ("train", "val")        # val: checkpoint selection only; the held-out set is never used to pick anything


def family_pool_row(family, split, index):
    """Task `index` of one family's training ("train") or validation ("val") stream. An instance that is in any
    held-out set is redrawn (retry 1, 2, ...), so both pools are disjoint from the held-out set by key, and no
    other index moves."""
    if split not in POOLS:
        raise KeyError("no pool %r" % split)
    hk = heldout_keys()
    retry = 0
    while True:
        r = make_row(family, split, index, retry)
        if r["key"] not in hk:
            return r
        retry += 1


def family_train_row(family, index):
    return family_pool_row(family, "train", index)


def stage(stage_id="v0"):
    s = next((s for s in curriculum()["stages"] if s["id"] == stage_id), None)
    if s is None:
        raise KeyError("no stage %r" % stage_id)
    return s


def train_row(stage_id, n):
    """Row n of a training stage: the stage's families in rotation, by their mix weights. Row n of a stage is the
    same forever; a new stage is a new id."""
    s = stage(stage_id)
    slots = [f for f, w in zip(s["families"], s["mix"]) for _ in range(w)]
    fam = slots[n % len(slots)]
    within = (n // len(slots)) * slots.count(fam) + slots[: n % len(slots)].count(fam)
    return family_train_row(fam, within)


def train_sample(num_tasks, start=0, stage_id="v0"):
    return [train_row(stage_id, n) for n in range(start, start + num_tasks)]


def row(task_id):
    """A row from its id alone. Never from anything a reply or a caller supplies."""
    fam, split, idx = task_id.split("/")
    if fam not in REGISTRY:
        raise KeyError("unknown family %r" % fam)
    if split in POOLS:
        return family_pool_row(fam, split, int(idx))
    for h in curriculum()["heldout"]:
        for r in heldout(h["version"]):
            if r["id"] == task_id:
                return r
    raise KeyError("no task %r" % task_id)


def score(task_id, reply):
    """The whole reward: the row rebuilt from its id, the reply decided exactly. `reward` trains; `decimals`,
    `progress` and the verdict are kept apart so a refusal, a wrong side and a loose bracket are never confused."""
    return grade(row(task_id), reply)


def preflight(n=6):
    """Run the forgery gate. Any caller that reports numbers without calling this first is reporting numbers it
    has not earned."""
    from .forgeries import gate
    g = gate(n)
    if not g["ok"]:
        raise RuntimeError("verify-gym: the forgery gate failed (%d of %d planted forgeries scored, %d green controls "
                           "failed) - refusing to run. %s" % (g["leaked"], g["planted"], g["green_failed"],
                                                               g["failures"][:2]))
    return g
