"""The binding, exercised against a live `verifiers` — or SKIPPED, never guessed.

Skipped when `verifiers` is absent, because a binding test that passes without
the framework installed is the same lie as a control that cannot fire. Each test
corresponds to one of the three defects a doc-written binding produced in the
first environment of this family, two of them silent.
"""
import pytest

vf = pytest.importorskip("verifiers", reason="verifiers is not installed; the binding is not exercised")
pytest.importorskip("datasets")

from lattice_claims import api, load_environment                  # noqa: E402
from lattice_claims.adapters_v0 import TESTED_AGAINST, _reply_text  # noqa: E402


def reward_funcs(env):
    """The rubric's functions by name.

    Written from the LIVE object: `SingleTurnEnv` does not keep the `Rubric` it
    was handed — it wraps it in a `RubricGroup` beside a `MultiTurnMonitorRubric`,
    and that group's own `.funcs` is EMPTY because it delegates to `.rubrics`."""
    r = env.rubric
    for sub in getattr(r, "rubrics", []):
        if getattr(sub, "funcs", None):
            return {f.__name__: f for f in sub.funcs}
    return {f.__name__: f for f in (r.funcs or r._get_reward_funcs())}


def test_the_version_it_was_verified_against_is_recorded():
    assert TESTED_AGAINST
    installed = getattr(vf, "__version__", None)
    if installed and installed != TESTED_AGAINST:
        pytest.skip(f"exercised against {TESTED_AGAINST}, running {installed} — re-verify")


def test_load_environment_builds_and_carries_no_answer_key():
    """DEFECT 2: verifiers refuses a plain-string `task` column, so there must not
    be one. And there is no answer to leak: the verdict is DECIDED in exact
    rational arithmetic, not matched against a string."""
    env = load_environment(num_tasks=3, seed=2026)
    d = env.dataset
    assert len(d) == 3
    assert "task" not in d.column_names
    assert all(r == "" for r in d["answer"])
    assert d["info"][0]["env_id"] == "lattice-claims"
    assert {r["rung"] for r in d["info"]} == {"declared", "printed", "underspecified"}


def test_train_and_eval_are_disjoint_tasksets():
    env = load_environment(num_tasks=3, seed=2026)
    assert env.dataset["info"][0]["seed"] != env.eval_dataset["info"][0]["seed"]


def test_scoring_reads_pydantic_messages_and_not_only_dicts():
    """DEFECT 3, the expensive one: the framework hands scoring pydantic message
    objects, and a `.get("content")` misses on every one — a whole eval printing
    0.000 with no error raised."""
    class Msg:
        def __init__(self, role, content):
            self.role, self.content = role, content

    text = '{"verdict": "REFUSED"}'
    assert _reply_text([Msg("assistant", text)]) == text
    assert _reply_text([{"role": "assistant", "content": text}]) == text
    assert _reply_text([Msg("assistant", [{"type": "text", "text": text}])]) == text
    assert _reply_text([Msg("user", "ignored")]) == ""


def test_the_rubric_scores_a_truthful_submission_through_the_exact_grader():
    """End to end at the framework layer: answer the task with the verdict the
    exact grader decided, and the declared reference the task stated."""
    env = load_environment(num_tasks=6, seed=2026)
    fn = reward_funcs(env)
    infos = [dict(i) for i in env.dataset["info"]]
    row = next(i for i in infos if i["rung"] == "declared")
    t = api.Taskset(seed=row["seed"]).sample(row["index"])
    ns = sum(int(c) ** 2 for c in t.data.claim["vector"])
    reply = '{"verdict": "%s", "reference": {"norm_squared": %d, "factor": "21/20"}}' % (row["truth"], ns)
    C = [{"role": "assistant", "content": reply}]
    assert fn["reward"](completion=C, info=row) == 1.0
    assert fn["well_formed"](completion=C, info=row) == 1.0
    assert fn["refused_parse"](completion=C, info=row) == 0.0


def test_a_right_verdict_from_the_wrong_reference_is_not_well_formed():
    """THE THESIS, at the framework layer. The verdict is right and the reference
    is one the task did not state; `reward` may score it, `well_formed` must not."""
    env = load_environment(num_tasks=6, seed=2026)
    fn = reward_funcs(env)
    row = next(dict(i) for i in env.dataset["info"] if i["rung"] == "declared")
    reply = '{"verdict": "%s", "reference": {"norm_squared": 1, "factor": "21/20"}}' % row["truth"]
    C = [{"role": "assistant", "content": reply}]
    assert fn["reward"](completion=C, info=row) == 1.0
    assert fn["well_formed"](completion=C, info=row) == 0.0


def test_an_unreadable_reply_is_zero_and_flagged_apart():
    env = load_environment(num_tasks=3, seed=2026)
    fn = reward_funcs(env)
    row = dict(env.dataset["info"][0])
    C = [{"role": "assistant", "content": "I think it is probably fine."}]
    assert fn["reward"](completion=C, info=row) == 0.0
    assert fn["refused_parse"](completion=C, info=row) == 1.0
