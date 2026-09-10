"""The binding, exercised against a live `verifiers` — or SKIPPED, never guessed.

This file is the reason `adapters_v0.py` may claim to have been verified. It is
skipped when `verifiers` is absent, because a binding test that passes without
the framework installed is the same lie as a control that cannot fire.

Each test here corresponds to one of the three defects a doc-written binding
produced in the sibling environment, two of which were silent.
"""
import pytest

vf = pytest.importorskip("verifiers", reason="verifiers is not installed; the binding is not exercised")
pytest.importorskip("datasets")

from blind_spot import load_environment                      # noqa: E402
from blind_spot.adapters_v0 import TESTED_AGAINST, _reply_text   # noqa: E402
from blind_spot.design import tools_missing                  # noqa: E402

pytestmark = pytest.mark.skipif(bool(tools_missing()), reason=f"missing tools: {tools_missing()}")


def reward_funcs(env):
    """The rubric's functions by name.

    Written from the LIVE object: `SingleTurnEnv` does not keep the `Rubric` it
    was handed — it wraps it in a `RubricGroup` alongside a
    `MultiTurnMonitorRubric`, and that group's own `.funcs` is EMPTY because it
    delegates to `.rubrics`. A test that reached for `env.rubric.funcs` would
    have found nothing and had to be written around, which is the sort of thing
    only an install tells you."""
    r = env.rubric
    for sub in getattr(r, "rubrics", []):
        if getattr(sub, "funcs", None):
            return {f.__name__: f for f in sub.funcs}
    return {f.__name__: f for f in (r.funcs or r._get_reward_funcs())}


def test_the_version_it_was_verified_against_is_recorded():
    """Not an assertion that they match — a newer verifiers is fine — but the
    file must SAY which one it was exercised on, or 'verified' means nothing."""
    assert TESTED_AGAINST
    installed = getattr(vf, "__version__", None)
    if installed and installed != TESTED_AGAINST:
        pytest.skip(f"exercised against {TESTED_AGAINST}, running {installed} — "
                    "re-verify and update TESTED_AGAINST")


def test_load_environment_builds_and_carries_no_answer_key():
    """DEFECT 2: verifiers refuses a plain-string `task` column outright, so
    there must not be one. And there is no answer to leak: a kill is verified by
    simulation, not matched against a string."""
    env = load_environment(num_tasks=3, seed=2026)
    d = env.dataset
    assert len(d) == 3
    assert "task" not in d.column_names
    assert all(r == "" for r in d["answer"])
    assert d["info"][0]["env_id"] == "blind-spot"
    assert {r["rung"] for r in d["info"]} == {"located", "profile", "blind"}


def test_train_and_eval_are_disjoint_tasksets():
    env = load_environment(num_tasks=3, seed=2026)
    assert env.dataset["info"][0]["seed"] != env.eval_dataset["info"][0]["seed"]


def test_scoring_reads_pydantic_messages_and_not_only_dicts():
    """DEFECT 3, the expensive one. The framework hands scoring a list of
    pydantic message objects; a `.get("content")` misses on every one and the
    whole eval prints 0.000 with no error raised. Both shapes must read."""
    class Msg:                                   # a stand-in with attributes, not keys
        def __init__(self, role, content):
            self.role, self.content = role, content

    text = '{"verdict": "UNDECIDED"}'
    assert _reply_text([Msg("assistant", text)]) == text
    assert _reply_text([{"role": "assistant", "content": text}]) == text
    assert _reply_text([Msg("assistant", [{"type": "text", "text": text}])]) == text
    assert _reply_text([Msg("user", "ignored")]) == ""


def test_the_rubric_scores_a_real_submission_through_the_simulator():
    """End to end: build the env, take its first task, answer it with the SAT
    witness, and check the rubric's reward function returns +1 — through the
    actual netlist. This is the positive control at the framework layer."""
    from blind_spot import api
    env = load_environment(num_tasks=3, seed=2026)
    info = dict(env.dataset["info"][0])
    t = api.task_for(info["mutant"], info["rung"])
    if t.mutant["equivalent"]:
        reply = '{"verdict": "EQUIVALENT"}'
    else:
        w = t.mutant["witness"]
        reply = '{"verdict": "KILL", "pairs": [{"u": %s, "v": %s}]}' % (w["u"], w["v"])
    fn = reward_funcs(env)
    got = fn["reward"](completion=[{"role": "assistant", "content": reply}], info=info)
    assert got == 1.0, f"the truthful answer scored {got}"
    assert fn["false_claim"](completion=[{"role": "assistant", "content": reply}], info=info) == 0.0


def test_a_false_claim_is_scored_minus_one_at_the_framework_layer():
    """The failure the environment exists to punish, reaching the rubric."""
    from blind_spot import api
    env = load_environment(num_tasks=12, seed=2026)
    infos = [dict(i) for i in env.dataset["info"]]
    eq = next((i for i in infos if i["equivalent"]), None)
    if eq is None:
        pytest.skip("no proved-equivalent mutant in this draw")
    t = api.task_for(eq["mutant"], eq["rung"])
    w = next(m for m in __import__("blind_spot.pool", fromlist=["x"]).load()["mutants"] if m["witness"])["witness"]
    reply = '{"verdict": "KILL", "pairs": [{"u": %s, "v": %s}]}' % (w["u"], w["v"])
    fn = reward_funcs(env)
    assert fn["reward"](completion=[{"role": "assistant", "content": reply}], info=eq) == -1.0
    assert fn["false_claim"](completion=[{"role": "assistant", "content": reply}], info=eq) == 1.0
