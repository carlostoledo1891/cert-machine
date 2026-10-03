"""The binding, exercised against a live `verifiers` — or SKIPPED, never guessed."""
import json

import pytest

vf = pytest.importorskip("verifiers", reason="verifiers is not installed; the binding is not exercised")
pytest.importorskip("datasets")

from certified_mathbench import api, load_environment                  # noqa: E402
from certified_mathbench.adapters_v0 import TESTED_AGAINST, _reply_text  # noqa: E402


def reward_funcs(env):
    """The rubric's functions by name, from the LIVE object: `SingleTurnEnv` wraps the Rubric in a RubricGroup
    whose own `.funcs` is empty because it delegates to `.rubrics`."""
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


def test_load_environment_builds_the_whole_ladder_and_carries_no_answer_key():
    env = load_environment()
    d = env.dataset
    assert len(d) == 46
    assert "task" not in d.column_names
    assert all(a == "" for a in d["answer"])
    assert d["info"][0]["env_id"] == "certified-mathbench"
    assert sorted(i["rung_index"] for i in d["info"]) == list(range(46))
    assert env.dataset["info"][0]["rung_index"] != env.eval_dataset["info"][0]["rung_index"]


def test_scoring_reads_pydantic_messages_and_not_only_dicts():
    class Msg:
        def __init__(self, role, content):
            self.role, self.content = role, content

    text = "[0,1,4,6]"
    assert _reply_text([Msg("assistant", text)]) == text
    assert _reply_text([{"role": "assistant", "content": text}]) == text
    assert _reply_text([Msg("assistant", [{"type": "text", "text": text}])]) == text
    assert _reply_text([Msg("user", "ignored")]) == ""


def test_the_rubric_scores_a_certified_object_one_and_a_forgery_zero():
    env = load_environment()
    fn = reward_funcs(env)
    row = next(dict(i) for i in env.dataset["info"] if i["family"] == "golomb" and json.loads(i["target"]) == [13, 106])
    g = api._bench()["golomb"]
    good = json.dumps(list(g.green_controls((13, 106))[0]))
    bad = json.dumps(list(g.red_controls((13, 106))[0]))
    assert fn["reward"](completion=[{"role": "assistant", "content": good}], info=row) == 1.0
    assert fn["reward"](completion=[{"role": "assistant", "content": bad}], info=row) == 0.0
    assert fn["refuted"](completion=[{"role": "assistant", "content": bad}], info=row) == 1.0
    assert fn["malformed"](completion=[{"role": "assistant", "content": "no"}], info=row) == 1.0
    assert fn["reward"](completion=[{"role": "assistant", "content": "no"}], info=row) == 0.0


def test_a_kissing_configuration_scores_through_the_framework():
    env = load_environment()
    fn = reward_funcs(env)
    row = next(dict(i) for i in env.dataset["info"] if i["family"] == "kissing" and json.loads(i["target"]) == [8, 240])
    e8 = api._bench()["kissing"].green_controls((8, 240))[0]
    reply = json.dumps([list(v) for v in e8])
    assert fn["reward"](completion=[{"role": "assistant", "content": reply}], info=row) == 1.0
    short = json.dumps([list(v) for v in e8[:-1]])
    assert fn["rejected"](completion=[{"role": "assistant", "content": short}], info=row) == 1.0
