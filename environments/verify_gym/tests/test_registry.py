"""The ground does not move: the held-out set is the pre-registered one, the pools never touch it, and appending
a family or a stage moves no existing task."""
import hashlib
import json
import os

import pytest

from verify_gym import api
from verify_gym.families import REGISTRY
from verify_gym.task import make_row, render_prompt

PREREG_SHA256 = "789cead61a5cb4612589b511562d9a6bfb4fe7d2b7dd2dcfc80b94193e71978d"   # notes/verify-gym-preregistration-2026-10-31.md


def test_the_heldout_file_is_the_preregistered_one():
    h = next(h for h in api.curriculum()["heldout"] if h["version"] == "v0")
    raw = open(os.path.join(api.HERE, h["file"]), "rb").read()
    assert hashlib.sha256(raw).hexdigest() == h["sha256"] == PREREG_SHA256
    rows = api.heldout("v0")
    assert len(rows) == 120 and sorted({r["family"] for r in rows}) == sorted(REGISTRY)
    assert len({r["key"] for r in rows}) == 120


def test_every_frozen_task_regenerates_and_renders_unchanged():
    for r in api.heldout("v0"):
        fam, split, idx = r["id"].split("/")
        assert make_row(fam, split, int(idx)) == r, r["id"]
        assert render_prompt(r) == r["prompt"], r["id"]


@pytest.mark.parametrize("split", ["train", "val"])
def test_the_pools_are_disjoint_from_the_heldout_set(split):
    hk = api.heldout_keys()
    for f in REGISTRY:
        for i in range(400):
            assert api.family_pool_row(f, split, i)["key"] not in hk


def test_the_training_streams_have_not_moved():
    """The first rows of each family's training stream, as they were on 2026-10-31. A change to a generator is a
    new family version, never an edit."""
    head = {f: [api.family_train_row(f, i)["key"] for i in range(3)] for f in REGISTRY}
    assert head == {
        "xx": ["xx:N=834080", "xx:N=28", "xx:N=58"],
        "kroot": ["kroot:n=945867,k=4", "kroot:n=282708,k=3", "kroot:n=58,k=2"],
        "poly": ["poly:1369,259,-25009,39602|615/256|315/128", "poly:4,-2,-1,-3|0|2", "poly:2,-5,-5,9,-5|3/2|3"],
    }


def test_the_stage_rotation_is_by_mix_and_stable():
    ids = [api.train_row("v0", n)["id"] for n in range(6)]
    assert ids == ["xx/train/0", "kroot/train/0", "poly/train/0", "xx/train/1", "kroot/train/1", "poly/train/1"]


def test_appending_a_family_moves_no_task():
    """A family's rows depend only on its own (family, split, index): registering a new one changes nothing else."""
    before = [make_row(f, "train", i) for f in list(REGISTRY) for i in range(3)]

    class Dummy:
        id, version, cap, limit, tiers = "dummy", 1, 1, 10, [("t", 1)]

    REGISTRY["dummy"] = Dummy
    try:
        after = [make_row(f, "train", i) for f in ["xx", "kroot", "poly"] for i in range(3)]
    finally:
        del REGISTRY["dummy"]
    assert before == after


def test_the_curriculum_and_the_code_agree_on_cap_and_limit():
    for entry in api.curriculum()["families"]:
        F = REGISTRY[entry["id"]]
        assert entry["cap"] == F.cap and 10 ** entry["limit_digits"] == F.limit and entry["version"] == F.version
    assert [e["id"] for e in api.curriculum()["families"]] == list(REGISTRY)


def test_a_moved_heldout_file_is_refused(tmp_path, monkeypatch):
    h = next(h for h in api.curriculum()["heldout"] if h["version"] == "v0")
    real = api._read

    def tampered(name):
        raw = real(name)
        return raw.replace(b'"N": ', b'"N":  ', 1) if name == h["file"] else raw
    monkeypatch.setattr(api, "_read", tampered)
    api._CACHE.pop("heldout:v0", None)
    try:
        with pytest.raises(RuntimeError):
            api.heldout("v0")
    finally:
        api._CACHE.pop("heldout:v0", None)
