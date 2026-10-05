"""The verifiers adapter — `load_environment`, the entry point the Hub calls.

VERIFIED against a live `verifiers` install and then run against live models, not
written from a doc. The version it was exercised on is in TESTED_AGAINST below
and re-checked by `tests/test_verifiers_binding.py`, which SKIPS rather than
guesses when `verifiers` is absent.

The three defects a doc-written binding produced in the first environment of this
family, two of them silent, are each designed out here and each has a test:

  1. `load_environment` was never exported from `__init__`, so the Hub's own
     command would have raised on arrival. Here `__init__.__getattr__` resolves
     it lazily and the binding test imports it by that path.
  2. A plain-string `task` column aborts every rollout. There is no `task` column;
     routing rides in `info["env_id"]`.
  3. Scoring is handed a list of PYDANTIC MESSAGE OBJECTS, not dicts, so a
     `.get("content")` misses on every one and a whole eval prints 0.000 with no
     error raised. `_field` reads either shape.

And one the sibling environment found only by installing its wheel: nothing in
this package may depend on where it is installed. This one is stdlib-only with no
external tools and no data files outside the package, so it has no such surface —
but the rule is why `tests/test_framework_free.py` exists.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, List, Optional

from .api import ENV_ID, GRADERS, preflight, sample, score

TESTED_AGAINST = "0.3.1"


def _content_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            part.get("text") or "" if isinstance(part, dict) else getattr(part, "text", "") or ""
            for part in content
        )
    return ""


def _field(message, name):
    """A message field from either a mapping or a model object. See defect 3."""
    if isinstance(message, dict):
        return message.get(name)
    return getattr(message, name, None)


def _reply_text(completion) -> str:
    if isinstance(completion, str):
        return completion
    if isinstance(completion, list):
        return "".join(
            _content_text(_field(m, "content"))
            for m in completion
            if _field(m, "role") == "assistant"
        )
    return ""


def _final_text(completion) -> str:
    """The LAST assistant message that carries text. In the tool environment (0.4.0) a reply
    is a conversation -- code sent to the tool, outputs read back -- and only the closing
    message is the answer; joining every assistant turn would let a dict literal inside the
    model's own code be read as its verdict. With one assistant message (the single-turn
    environment) this is the same text `_reply_text` returns."""
    if isinstance(completion, str):
        return completion
    if isinstance(completion, list):
        for m in reversed(completion):
            if _field(m, "role") == "assistant":
                t = _content_text(_field(m, "content"))
                if t.strip():
                    return t
    return ""


CALC_SYSTEM_PROMPT = (
    "You have a `calc` tool: it evaluates ONE arithmetic expression per call -- integers and Fraction(...) "
    "exactly; sqrt, log, log10, lgamma, exp, factorial and pi as in Python. Use it for the arithmetic. When "
    "you have decided, end with a message that contains ONLY the JSON object the task asks for."
)

TOOL_SYSTEM_PROMPT = (
    "You have a `python` tool: a persistent Python 3.11 REPL in a sandbox, standard library only "
    "(fractions, decimal, math, itertools, ...). Use it for the arithmetic -- exactly, with integers "
    "and Fractions where it matters. When you have decided, end with a message that contains ONLY the "
    "JSON object the task asks for."
)


from contextlib import contextmanager


@contextmanager
def _container_sandbox_request():
    """A local repair, scoped to building the environment, for the one place verifiers 0.3.1's
    legacy SandboxEnv and prime-sandboxes disagree: SandboxEnv builds
    `CreateSandboxRequest(start_command=<a shell string>, ...)` and never passes `vm`.
      * prime-sandboxes 0.2.39-0.2.42 refuse a string command unless `vm=False`
        ("String start_command values are container-only");
      * 0.3.0 and later take only `StartCommand(executable, args)`.
    So `vf.PythonEnv` cannot be built with ANY release verifiers 0.3.1 accepts. A string command
    is a container shell line, which is what verifiers means: where the model has `vm`, it gets
    `vm=False`; where a string is refused outright, it is split exactly as a POSIX shell would
    split it (shlex) into the executable and its arguments. Nothing else changes, and the
    original class is restored on exit. (2026-10-05: an earlier version pinned
    prime-sandboxes<0.3 instead, and the hosted env-server never started -- the runtime holds a
    newer release.)"""
    import shlex
    import verifiers.legacy.envs.sandbox_env as se
    orig = se.CreateSandboxRequest
    fields = getattr(orig, "model_fields", {})

    def request(**kw):
        sc = kw.get("start_command")
        if not isinstance(sc, str):
            return orig(**kw)
        if "vm" in fields and "vm" not in kw:
            kw["vm"] = False
        try:
            return orig(**kw)
        except Exception:
            from prime_sandboxes import StartCommand
            argv = shlex.split(sc)
            kw.pop("vm", None) if "vm" not in fields else None
            kw["start_command"] = StartCommand(executable=argv[0], args=argv[1:])
            return orig(**kw)

    se.CreateSandboxRequest = request
    try:
        yield
    finally:
        se.CreateSandboxRequest = orig


def _decide(completion, info) -> Dict[str, Any]:
    """The framework layer owns no scoring of its own: `api.score`
    rebuilds the task from (seed, index, dims, mix) and decides the reply exactly.
    A row without dims or mix is a 0.1.0 row and means the 0.1.0 defaults."""
    dims, mix = info.get("dims"), info.get("mix")
    text = _final_text(completion) if info.get("tools") else _reply_text(completion)
    return dict(_decide_cached(int(info["seed"]), int(info["index"]),
                               tuple(dims) if dims else None, tuple(mix) if mix else None,
                               text))


@lru_cache(maxsize=4096)
def _decide_cached(seed, index, dims, mix, text) -> Dict[str, Any]:
    """The rubric asks for several numbers about the SAME reply, and each would
    otherwise re-mint the task (~0.1 s at the default dimensions). `score` is a
    pure function of these five arguments, so remembering it changes nothing but
    the time. Callers get a copy, so nothing they do can reach the cache."""
    return score(seed, index, text, dims, mix)


def _dataset_rows(num_tasks: int, seed: int, start: int, dims=None, mix=None, tools=None) -> List[Dict[str, Any]]:
    """`api.sample` rows in the column shape the framework wants.

    `answer` is the empty string because the framework asks for the column, not
    because there is one: this environment DECIDES submissions in exact rational
    arithmetic rather than matching them, so there is no reference string and
    nothing to leak. See defect 2 for the missing `task` column.
    """
    out = []
    for row in sample(num_tasks, seed, start, dims, mix):
        info = dict(row)
        info["env_id"] = ENV_ID
        if tools:
            info["tools"] = tools
        out.append({"question": info.pop("prompt"), "answer": "", "info": info})
    return out


def load_environment(
    num_tasks: int = 120,
    seed: int = 2026,
    start: int = 0,
    eval_num_tasks: Optional[int] = None,
    eval_seed: Optional[int] = None,
    eval_start: Optional[int] = None,
    grader: str = "exact",
    dims: Optional[List[int]] = None,
    mix: Optional[List[int]] = None,
    tools: str = "none",
    max_turns: int = 6,
    sandbox_memory_gb: int = 1,
    sandbox_disk_size_gb: int = 2,
    sandbox_timeout_minutes: int = 10,
    sandbox_timeout_per_command_seconds: int = 30,
    **kwargs,
):
    """A `SingleTurnEnv` over the procedural generator.

    The taskset is ENDLESS: instances are minted from a seed, so `num_tasks`
    bounds the sample and never the set. Train and eval are disjoint by TASKSET
    SEED rather than by index, because the index chooses the rung — it cycles
    declared / printed / underspecified — and splitting on index would hand the
    two halves different rung mixtures.

    `grader` chooses what TRAINS: "exact" (the default), "answer_key" (0.2.0: the
    binary key of the complete instance, under which an abstention never scores) or
    "ternary" (0.3.0: +1 decided-correct, 0 an abstention that is not due, -1 a
    refuted definite verdict or no readable verdict). Every other number is computed under both, at weight 0, so two runs
    that differ only in `grader` are read on the same columns. `dims` sets the
    lattice dimensions (default 24, 40, 60, 90; (8, 12, 16) keeps a prompt near
    1,500 characters) and `mix` weights the rungs as a deterministic cycle
    (default 1, 1, 1). Both ride in every row, so scoring rebuilds the same task.

    `tools` (0.4.0): "none" (the default, a SingleTurnEnv), "python", a multi-turn
    PythonEnv with a persistent standard-library REPL in a Prime sandbox per rollout, or
    (0.5.0) "calc", a multi-turn ToolEnv with an in-process bounded calculator;
    `max_turns` bounds the conversation. The answer is read from the final assistant
    message only.
    """
    import verifiers as vf
    from datasets import Dataset

    if grader not in GRADERS:
        raise ValueError(f"grader must be one of {GRADERS}, not {grader!r}")
    if tools not in ("none", "python", "calc"):
        raise ValueError(f"tools must be 'none', 'python' or 'calc', not {tools!r}")
    preflight()          # the forgery gate, before anything a model could be scored against

    eval_num_tasks = num_tasks if eval_num_tasks is None else eval_num_tasks
    eval_seed = seed + 1 if eval_seed is None else eval_seed
    eval_start = start if eval_start is None else eval_start
    trains_on = {"exact": "certified", "answer_key": "key_match", "ternary": "ternary"}[grader]

    def reward(completion, info, **_) -> float:
        """What trains: `certified` under the exact grader, `key_match` under the
        answer key. Deliberately NOT the only thing measured."""
        return float(_decide(completion, info)[trains_on])

    def certified(completion, info, **_) -> float:
        """The exact grader's verdict on the reply, whichever grader trains."""
        return float(_decide(completion, info)["certified"])

    def key_match(completion, info, **_) -> float:
        """The answer key's verdict on the reply, whichever grader trains."""
        return float(_decide(completion, info)["key_match"])

    def ternary(completion, info, **_) -> float:
        """+1 decided-correct, 0 an abstention that is not due, -1 a refuted definite verdict
        or no readable verdict -- whichever grader trains."""
        return float(_decide(completion, info)["ternary"])

    def due(completion, info, **_) -> float:
        """1 when the task's decided answer is an abstention (a property of the task)."""
        return float(_decide(completion, info)["due"])

    def abstained_due(completion, info, **_) -> float:
        """1 when the reply abstained on a task where abstaining is the decided answer."""
        return float(_decide(completion, info)["abstained_due"])

    def abstained_not_due(completion, info, **_) -> float:
        """1 when the reply abstained on a task whose answer is definite."""
        return float(_decide(completion, info)["abstained_not_due"])

    def abstained(completion, info, **_) -> float:
        """1 when the reply said STRADDLES or NEEDS_DATA."""
        return float(_decide(completion, info)["abstained"])

    def confident_wrong(completion, info, **_) -> float:
        """1 when the reply gave a definite verdict the exact grader refutes."""
        return float(_decide(completion, info)["confident_wrong"])

    def well_formed(completion, info, **_) -> float:
        """1 only when the reply declared the reference it decided against AND
        that reference is what the task stated. A RIGHT VERDICT REACHED FROM THE
        WRONG REFERENCE IS NOT RIGHT — the environment exists because a bit-exact
        grader once reported 32 of 37 published records as wrong by comparing
        against a quantity the claims were not about."""
        return float(_decide(completion, info)["well_formed"])

    def not_hacked(completion, info, **_) -> float:
        """0 when a float grader would have disagreed with the exact decision."""
        return float(_decide(completion, info)["not_hacked"])

    def refused_parse(completion, info, **_) -> float:
        """1 when no readable verdict came back. Kept apart from `reward` so a
        reply that could not be read is never confused with a wrong answer."""
        return 1.0 if _decide(completion, info)["verdict"] is None else 0.0

    funcs = [reward, certified, key_match, ternary, abstained, confident_wrong,
             due, abstained_due, abstained_not_due, well_formed, not_hacked, refused_parse]
    rubric = vf.Rubric(funcs=funcs, weights=[1.0] + [0.0] * (len(funcs) - 1))
    tag = None if tools == "none" else tools
    train = Dataset.from_list(_dataset_rows(num_tasks, seed, start, dims, mix, tag))
    evals = Dataset.from_list(_dataset_rows(eval_num_tasks, eval_seed, eval_start, dims, mix, tag))
    if tools == "python":
        # 0.4.0: the same tasks, grader and rubric, plus a persistent Python REPL in a Prime
        # sandbox per rollout (verifiers' PythonEnv, the pattern of primeintellect/math-python).
        # Standard library only: nothing to pip-install, so a sandbox is ready in seconds. The
        # tool gives the model the MEANS to decide the arithmetic; it never sees the grader.
        with _container_sandbox_request():
            return vf.PythonEnv(
                dataset=train,
                eval_dataset=evals,
                system_prompt=TOOL_SYSTEM_PROMPT,
                rubric=rubric,
                max_turns=max_turns,
                pip_install_packages="",
                cpu_cores=1,
                memory_gb=sandbox_memory_gb,
                disk_size_gb=sandbox_disk_size_gb,
                timeout_minutes=sandbox_timeout_minutes,
                timeout_per_command_seconds=sandbox_timeout_per_command_seconds,
                **kwargs,
            )
    if tools == "calc":
        # 0.5.0: the same tasks, graders and rubric, with an in-process calculator tool
        # (lattice_claims/calc.py: one whitelisted expression per call, stdlib, bounded). It needs
        # no sandbox: the sandbox path would not load on Hosted Training on 2026-10-05.
        from .calc import calc
        return vf.ToolEnv(dataset=train, eval_dataset=evals, tools=[calc], max_turns=max_turns,
                          system_prompt=CALC_SYSTEM_PROMPT, rubric=rubric, **kwargs)
    return vf.SingleTurnEnv(dataset=train, eval_dataset=evals, rubric=rubric, **kwargs)
