"""Both framework adapters, against whatever `verifiers` is actually installed.

Skipped when the framework is absent — never guessed at. The three defects these
tests pin were all found by running the binding, not by reading the spec, and two
of them fail SILENTLY: a whole evaluation reports 0.000 with no error raised.
"""
import pytest

vf = pytest.importorskip("verifiers", reason="verifiers not installed")

from break_the_grader.task import make_task     # noqa: E402


def _witness_reply(seed):
    t = make_task(seed)
    return ('{"attack": %r}' % t.witness) if t.attackable else '{"verdict": "NO_ATTACK"}'


class _Msg:
    """A message object rather than a dict — the shape scoring is really handed.

    This is the silent one. `verifiers` passes pydantic messages to the reward
    functions; a `.get("content")` guarded by `isinstance(m, dict)` misses every
    time, every reply reads as unparseable, and the eval reports zeros with no
    error anywhere.
    """
    def __init__(self, content):
        self.role, self.content = "assistant", content


def test_v0_load_environment_is_exposed_under_the_env_id():
    """`vf.load_environment('break-the-grader')` is the command the Hub prints.
    It resolves the dashed id to the underscored module and demands the symbol
    at package top level — which a `load_environment` hidden in a submodule does
    not satisfy."""
    from verifiers.utils.env_utils import env_module_name
    assert env_module_name("break-the-grader") == "break_the_grader"
    import break_the_grader
    assert callable(break_the_grader.load_environment)


def test_v0_dataset_rows_carry_no_string_task_column():
    """verifiers 0.2.0: 'Plain string task routes are no longer supported.'
    A `task` column of type str aborts every rollout."""
    from break_the_grader.adapters_v0 import _dataset_rows
    rows = _dataset_rows(8, 0)
    assert rows and all(not isinstance(r.get("task"), str) for r in rows)
    assert all(r["info"]["env_id"] == "break-the-grader" for r in rows)


def test_v0_scores_message_objects_and_dicts_alike():
    from break_the_grader.adapters_v0 import _decide, _dataset_rows
    for row in _dataset_rows(24, 0):
        info = row["info"]
        reply = _witness_reply(info["seed"])
        as_dict = _decide([{"role": "assistant", "content": reply}], info)
        as_obj = _decide([_Msg(reply)], info)
        assert as_dict == as_obj, info["seed"]
        assert as_obj["reward"] == 1.0 and as_obj["well_formed"] == 1.0


def test_v1_taskset_loads_a_list_and_scores():
    """0.2.0 declares `load() -> list` and its Taskset is not iterable; 0.3.1
    widened it to `Iterable`. A list satisfies both."""
    import asyncio
    pytest.importorskip("verifiers.v1", reason="no v1 in this verifiers")
    from break_the_grader.adapters_v1 import BreakTheGraderTaskset, BreakTheGraderConfig

    tasks = BreakTheGraderTaskset(BreakTheGraderConfig(num_tasks=24)).load()
    assert isinstance(tasks, list) and len(tasks) == 24

    class T:
        def __init__(self, reply):
            self.last_reply, self.info = reply, {}

    async def run():
        for task in tasks:
            good = await task.certificate_band(T(_witness_reply(task.data.seed)))
            junk = await task.certificate_band(T("not json"))
            assert good == 1.0, task.data.seed
            assert junk == 0.0
    asyncio.run(run())
