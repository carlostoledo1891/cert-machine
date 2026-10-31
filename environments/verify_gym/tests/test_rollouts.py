"""The rollout log format (verify_gym/rollouts.py): what a trainer writes so that recheck.py can decide every paid
reward again. The re-check itself needs node and lives in the battery; the format is tested here."""
import json
import struct

import pytest

from verify_gym import api, rollouts
from verify_gym.policies import cf


def _log(*samples, split="train"):
    return rollouts.dumps(rollouts.header(split, run="t"), samples)


def test_a_log_round_trips_and_keeps_the_trainers_own_keys():
    r = api.train_row("v0", 0)
    s = rollouts.sample(r["id"], cf(r["prompt"]), api.score(r["id"], cf(r["prompt"]))["reward"], sample=0, step=3)
    head, got = rollouts.loads(_log(s))
    assert head["split"] == "train" and got[0]["step"] == 3 and got[0]["reply"] == s["reply"]


@pytest.mark.parametrize("bad, why", [
    ({"task_id": "xx/train/0", "reply": "x", "reward": True}, "reward"),
    ({"task_id": "xx/train/0", "reply": "x", "reward": 1.5}, "reward"),
    ({"task_id": "xx/train/0", "reply": "x", "reward": float("nan")}, "reward"),
    ({"task_id": "xx/train/0", "reply": 7, "reward": 0}, "reply"),
    ({"task_id": "xx/heldout/0", "reply": "x", "reward": 0}, "split"),
    ({"task_id": "xx/train/0", "reply": "x", "reward": 0, "reply_sha256": "0" * 64}, "sha256"),
])
def test_a_line_that_is_not_the_format_is_named(bad, why):
    with pytest.raises(ValueError, match=why):
        rollouts.loads(_log(bad))


def test_a_sample_index_appears_once_per_task_and_the_header_is_required():
    s = rollouts.sample("xx/train/0", "x", 0, sample=1)
    with pytest.raises(ValueError, match="twice"):
        rollouts.loads(_log(s, s))
    with pytest.raises(ValueError, match="header"):
        rollouts.loads(json.dumps(s) + "\n")


def test_a_reward_reads_as_its_progress_even_from_float32_storage():
    for cap in (8, 20):
        for k in range(cap + 1):
            f32 = struct.unpack("f", struct.pack("f", k / cap))[0]
            assert rollouts.progress_of(f32, cap) == k
    assert rollouts.progress_of(0.333, 20) is None and rollouts.progress_of(0.33, 8) is None
