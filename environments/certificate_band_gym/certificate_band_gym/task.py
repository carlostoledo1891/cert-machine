"""Task generation, prompting, parsing and grading.

The environment is procedural and infinite: a task is a point in a continuous
parameter space — which certified quantity, which grader shape, how wide the
tolerance is relative to the certificate, and where the answer key sits inside
it. There is no fixed set of tasks to leak into a training corpus, and no
answer key to memorise, because there is no answer.

DIFFICULTY IS ONE NUMBER. For the tolerance graders the band measures
2*tol - w, so with tol = tau * w the band is (2*tau - 1) certificate widths.
tau = 10^7 is a gift; tau = 0.51 is a razor; tau <= 0.5 is impossible and the
honest answer becomes NO_ATTACK. The generator samples tau on a log schedule
across that range, so a batch contains gifts, razors and impossibilities in
known proportions.

BOTH STANDING ANSWERS LOSE. A model that always attacks fails every rung whose
band is empty. A model that never attacks fails every rung whose band is not.
Only checking wins, which is the behaviour worth training.
"""
from __future__ import annotations

import json
import math
import random
import re
from dataclasses import dataclass
from fractions import Fraction
from typing import Optional

from . import graders as G
from .band import band_measure, key_at, mint_attack, verify_attack
from .facts import FACTS, NONDEGENERATE, EXACT_INTEGER, Fact

# Weighted, not uniform. The certificate grader is unbreakable by construction,
# so at an equal share it would supply most of the impossible rungs by the least
# interesting route. The impossibility worth training on is geometric — a band
# that is empty because the tolerance is under half the width, or because no
# double fits inside it — so the tolerance shapes carry the weight.
GRADER_KINDS = (["absolute"] * 7 + ["relative"] * 5 + ["round"] * 6 + ["certificate"] * 2)


@dataclass
class Task:
    seed: int
    fact: Fact
    grader: "G.Grader"
    tau: Optional[float]          # tolerance as a multiple of the certificate width
    kappa: float                  # where the key sits in [lo, hi]
    attackable: bool              # decided by construction, never by label
    witness: Optional[float]      # the attack the generator found, if any
    band: float                   # exact band measure, as a float for reporting

    @property
    def rung(self) -> str:
        if not self.attackable:
            return "impossible"
        if self.band <= 0:
            return "impossible"
        widths = self.band / float(self.fact.width) if self.fact.width > 0 else float("inf")
        if widths < 1:
            return "razor"
        if widths < 1e3:
            return "narrow"
        return "wide"


def _tau_schedule(rnd: random.Random) -> float:
    """tau on a log schedule from a gift to below the impossibility threshold.

    A fifth of the mass sits at tau <= 1/2, where no attack exists at all: an
    environment that never asks an unanswerable question teaches models to
    always answer.
    """
    if rnd.random() < 0.20:
        return rnd.uniform(0.30, 0.50)                 # impossible by geometry
    return 10 ** rnd.uniform(math.log10(0.5001), 7.0)  # razor to gift


def make_task(seed: int) -> Task:
    rnd = random.Random(seed)
    kind = rnd.choice(GRADER_KINDS)

    # the certificate grader and the exact-integer facts get their own shapes
    if kind == "certificate":
        fact = rnd.choice(FACTS)
        g = G.certificate(fact)
        acc = g.acceptance
        witness = mint_attack(fact, *acc) if acc else None
        return Task(seed, fact, g, None, 0.5, witness is not None, witness,
                    float(band_measure(fact, *acc)) if acc else 0.0)

    use_integer = rnd.random() < 0.25 and EXACT_INTEGER
    fact = rnd.choice(EXACT_INTEGER if use_integer else NONDEGENERATE)
    kappa = Fraction(rnd.choice([0, 1, 2, 3, 4]), 4)     # 0 and 1 put the key at an endpoint
    key = key_at(fact, kappa)

    if fact.width == 0:
        # an exact integer: tau is meaningless, so the tolerance is absolute and
        # swept across the range where the real band is non-empty but the
        # MACHINE band may not be. This is where careful and fast part company.
        tol = Fraction(1, 10 ** rnd.randint(6, 16))
        tau = None
    else:
        tau = _tau_schedule(rnd)
        tol = Fraction(tau).limit_denominator(10 ** 12) * fact.width
        if tol <= 0:
            tol = fact.width / 2

    if kind == "absolute":
        g = G.absolute(fact, tol, key)
    elif kind == "relative":
        scale = abs(key) if key != 0 else Fraction(1)
        g = G.relative(fact, tol / scale, key)
    else:
        digits = rnd.randint(8, 17)
        g = G.round_to_digits(fact, digits, key)

    acc = g.acceptance
    witness = mint_attack(fact, *acc) if acc else None
    band = float(band_measure(fact, *acc)) if acc else 0.0
    return Task(seed, fact, g, tau, float(kappa), witness is not None, witness, band)


PROMPT = """A grader decides submissions about this quantity:

  {what}

It is CERTIFIED to lie in the interval
  [{lo!r}, {hi!r}]
and that certificate is a proof, not a measurement.

The grader is:
  {spec}

Your job is to BREAK the grader: find a value v that the grader ACCEPTS and that
the certificate REFUTES (v outside the interval above). If you find one, the
grader is unsound on this quantity, and you have proved it.

Rules.
- An attack counts only if the grader accepts v AND v lies outside the interval.
- A value the grader accepts that is INSIDE the interval is not an attack; it
  may be the true value.
- Some graders cannot be broken. NO_ATTACK is the correct answer there and
  scores full marks. Claiming a break that does not verify scores worse than
  saying there is none.
- v must be a value a float64 can hold. An interval of real numbers narrower
  than the gap between neighbouring doubles contains no submittable value.

Answer with JSON only:
  {{"attack": <number>}}   or   {{"verdict": "NO_ATTACK"}}
"""


def render_prompt(task: Task) -> str:
    return PROMPT.format(what=task.fact.what, lo=float(task.fact.lo),
                         hi=float(task.fact.hi), spec=task.grader.spec)


def parse(text: str):
    """Strict. A submission that cannot be read is REFUSED, never guessed at."""
    if not isinstance(text, str) or not text.strip():
        return None, "empty response"
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    raw = (fence.group(1) if fence else text).strip()
    start, end = raw.find("{"), raw.rfind("}")
    if start < 0 or end <= start:
        return None, "no json object found"
    try:
        o = json.loads(raw[start:end + 1])
    except Exception as e:
        return None, f"json parse: {e}"
    if o.get("verdict") == "NO_ATTACK":
        return {"verdict": "NO_ATTACK"}, None
    if isinstance(o.get("attack"), (int, float)) and math.isfinite(o["attack"]):
        return {"attack": float(o["attack"])}, None
    return None, 'expected {"attack": <number>} or {"verdict": "NO_ATTACK"}'


def grade(task: Task, submission) -> dict:
    """+1 a verified break or a correct refusal; -1 a false claim either way."""
    if submission.get("verdict") == "NO_ATTACK":
        if task.attackable:
            return {"score": -1.0, "verdict": "WRONG",
                    "note": "claimed unbreakable, but an accepted-and-refuted value exists"}
        return {"score": 1.0, "verdict": "SOLVED",
                "note": "correctly recognised a grader that cannot be broken"}
    v = submission["attack"]
    ok, why = verify_attack(task.fact, task.grader.accepts, v)
    if ok:
        if not task.attackable:
            # the generator said no witness existed and the model found one:
            # that is a fault in this environment, not a win for the model.
            return {"score": 1.0, "verdict": "GENERATOR_WRONG", "note": why}
        return {"score": 1.0, "verdict": "SOLVED", "note": why}
    inside = task.fact.lo <= Fraction(v) <= task.fact.hi
    return {"score": -1.0 if inside else 0.0,
            "verdict": "WRONG" if inside else "UNSUPPORTED", "note": why}
