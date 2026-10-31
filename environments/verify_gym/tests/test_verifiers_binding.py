"""Both framework adapters, against whatever `verifiers` is installed. Skipped when it is absent, never guessed at."""
import asyncio

import pytest

vf = pytest.importorskip("verifiers", reason="verifiers not installed")

from verify_gym import api                                  # noqa: E402
from verify_gym.policies import cf                          # noqa: E402


class _Msg:
    """A message OBJECT, not a dict: the shape scoring is really handed (the silent defect)."""
    def __init__(self, content, role="assistant"):
        self.role, self.content = role, content


def test_v0_load_environment_is_exposed_under_the_env_id():
    from verifiers.utils.env_utils import env_module_name
    assert env_module_name("verify-gym") == "verify_gym"
    import verify_gym
    assert callable(verify_gym.load_environment)


def test_v0_rows_carry_no_string_task_column_and_no_answer():
    from verify_gym.adapters_v0 import _rows
    rows = _rows(api.train_sample(9))
    assert all(not isinstance(r.get("task"), str) and r["answer"] == "" for r in rows)
    assert all(set(r["info"]) == {"task_id", "env_id", "family", "tier"} for r in rows)


def test_v0_scores_message_objects_and_dicts_alike():
    from verify_gym.adapters_v0 import _decide, _rows
    for r in _rows(api.train_sample(9)):
        reply = cf(r["question"])
        a = _decide([{"role": "assistant", "content": reply}], r["info"])
        b = _decide([_Msg("thinking"), _Msg(reply)], r["info"])
        assert a == b and a["reward"] > 0, r["info"]


def test_v0_builds_a_single_turn_env():
    from verify_gym import load_environment
    env = load_environment(num_tasks=6, eval_num_tasks=6)
    assert len(env.dataset) == 6 and len(env.eval_dataset) == 6


def test_v1_taskset_loads_a_list_and_scores():
    pytest.importorskip("verifiers.v1", reason="no v1 in this verifiers")
    from verify_gym.adapters_v1 import VerifyGymConfig, VerifyGymTaskset

    for split in ("train", "val", "heldout"):
        tasks = VerifyGymTaskset(VerifyGymConfig(split=split, num_tasks=6)).load()
        assert isinstance(tasks, list) and len(tasks) == 6

    class T:
        def __init__(self, reply):
            self.last_reply, self.info = reply, {}

    async def run():
        for t in VerifyGymTaskset(VerifyGymConfig(num_tasks=6)).load():
            good = await t.certified_progress(T(cf(t.data.prompt)))
            junk = await t.certified_progress(T("not json"))
            assert good > 0 and junk == 0.0, t.data.task_id
    asyncio.run(run())
