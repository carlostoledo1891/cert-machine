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
        """The rung, measured in ROOM: how many representable doubles fit in the
        band.

        One unit, at both ends of the corpus, and it is the unit the task is
        actually in — a model does not submit a real number, it submits a double,
        so the room that matters is counted in doubles and not in certificate
        widths. Measuring in widths broke on the half of the corpus whose
        certificates have width zero (an exact integer: every band is infinitely
        many widths), and it flattered the other half — a band of five thousand
        doubles and a band of one and a half are not the same problem, and
        "0.9 certificate widths" calls them both a razor.
        """
        if not self.attackable or self.band <= 0:
            return "impossible"
        if self.room < ROOM_RAZOR:
            return "razor"
        if self.room < ROOM_NARROW:
            return "narrow"
        return "wide"

    @property
    def room(self) -> float:
        """The band in representable doubles: band / (one ulp at this magnitude)."""
        u = math.ulp(float(self.fact.midpoint)) or math.ulp(1.0)
        return self.band / u

# The rung edges, in ROOM (representable doubles that fit in the band), and the
# mix the generator aims at. band = 2*tol - w for a midpoint key, so a target
# room R is reached at tol = (w + R*u)/2 — the tolerance is SOLVED FOR rather
# than sampled and hoped over, which is what makes the mix a declared property
# instead of a measured accident.
ROOM_RAZOR, ROOM_NARROW = 16.0, 1e6
RUNG_MIX = ((0.25, "impossible"), (0.60, "razor"), (0.85, "narrow"), (1.00, "wide"))


def _room_schedule(rnd: random.Random) -> float:
    """Target room, in doubles. Zero means the band must be empty.

    A quarter of the mass sits where NO value can be submitted at all: an
    environment that never asks an unanswerable question teaches models to always
    answer. Another 35% sits on the razor — under sixteen doubles of room — which
    is where careful and fast part company.

    THE MIX IS A TARGET, NOT A MEASUREMENT. Keys sit at five positions across the
    certificate and only the midpoint gives band = 2*tol - w exactly; the
    certificate grader has no tolerance at all. So the realized mix drifts from
    this one, and the shipped baseline prints what it actually was rather than
    repeating what it was asked for.
    """
    r = rnd.random()
    rung = next(name for edge, name in RUNG_MIX if r < edge)
    if rung == "impossible":
        return 0.0
    if rung == "razor":
        return rnd.uniform(1.0, ROOM_RAZOR)
    if rung == "narrow":
        return 10 ** rnd.uniform(math.log10(ROOM_RAZOR), math.log10(ROOM_NARROW))
    return 10 ** rnd.uniform(math.log10(ROOM_NARROW), 12.0)


def _tolerance_for(fact: Fact, rnd: random.Random) -> Fraction:
    """The tolerance that puts this fact's band at the drawn room.

    Exact rationals throughout: the ulp is a double, the width is a Fraction, and
    the tolerance that comes out is the one the grader is built with. An empty
    band is produced by construction (tol strictly under w/2, or under half an
    ulp when the certificate has no width), never by sampling until one appears.
    """
    u = Fraction(math.ulp(float(fact.midpoint)) or math.ulp(1.0))
    room = _room_schedule(rnd)
    if room <= 0:
        return (fact.width / 2 if fact.width > 0 else u) * Fraction(
            rnd.randint(30, 90), 100)
    return (fact.width + Fraction(room).limit_denominator(10 ** 9) * u) / 2


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

    # One tolerance path for both halves of the corpus. An exact integer is not a
    # special case here, it is the case where the certificate width is zero and
    # the ulp does all the work — which is the sharpest rung there is, and used
    # to be mislabelled the easiest.
    tol = _tolerance_for(fact, rnd)
    tau = float(tol / fact.width) if fact.width > 0 else None

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
