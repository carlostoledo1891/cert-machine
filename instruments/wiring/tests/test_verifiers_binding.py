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


# --- 0.2.0: the grader switch, and dims/mix carried through the framework -----

def test_an_unknown_grader_is_refused_before_anything_is_built():
    with pytest.raises(ValueError):
        load_environment(num_tasks=1, grader="judge")


def test_the_grader_switch_changes_what_trains_and_nothing_that_is_measured():
    """An honest NEEDS_DATA on an underspecified task: the exact grader pays it,
    the answer key does not, and BOTH runs log the same `certified` and
    `key_match` for it — which is what lets two runs be read on one scale."""
    kw = dict(num_tasks=4, seed=2026, dims=[8, 12, 16], mix=[1, 0, 1])
    exact, keyed = load_environment(grader="exact", **kw), load_environment(grader="answer_key", **kw)
    row = next(dict(i) for i in exact.dataset["info"] if i["rung"] == "underspecified")
    C = [{"role": "assistant",
          "content": '{"verdict": "NEEDS_DATA", "missing": "%s"}' % row["missing"].split(".")[1]}]
    fe, fk = reward_funcs(exact), reward_funcs(keyed)
    assert fe["reward"](completion=C, info=row) == 1.0
    assert fk["reward"](completion=C, info=row) == 0.0
    for name, want in (("certified", 1.0), ("key_match", 0.0), ("abstained", 1.0), ("confident_wrong", 0.0)):
        assert fe[name](completion=C, info=row) == want == fk[name](completion=C, info=row)


def test_dims_and_mix_ride_in_every_row_so_scoring_rebuilds_the_same_task():
    """Without dims in the row, the scorer would rebuild the DEFAULT-dimension
    task and grade a reply against a lattice the model never saw."""
    env = load_environment(num_tasks=4, seed=2026, dims=[8, 12, 16], mix=[1, 0, 1])
    infos = [dict(i) for i in env.dataset["info"]]
    assert {i["rung"] for i in infos} == {"declared", "underspecified"}
    assert all(i["dims"] == [8, 12, 16] and i["mix"] == [1, 0, 1] for i in infos)
    row = next(i for i in infos if i["rung"] == "declared")
    t = api.make_taskset(row["seed"], row["dims"], row["mix"]).sample(row["index"])
    assert t.prompt() == env.dataset[infos.index(row)]["question"]
    ns = sum(int(c) ** 2 for c in t.data.claim["vector"])
    reply = '{"verdict": "%s", "reference": {"norm_squared": %d, "factor": "21/20"}}' % (row["truth"], ns)
    C = [{"role": "assistant", "content": reply}]
    fn = reward_funcs(env)
    assert fn["reward"](completion=C, info=row) == 1.0
    # the verdict alone could match a wrongly rebuilt task by chance; the
    # declared norm cannot, because it is the norm of THIS task's vector
    assert fn["well_formed"](completion=C, info=row) == 1.0
    stripped = {k: v for k, v in row.items() if k not in ("dims", "mix")}
    assert fn["well_formed"](completion=C, info=stripped) == 0.0, "the control: without dims the task is a different one"
