#!/usr/bin/env python3
"""
llm_conjecture_harness.py — model proposes, cert-machine decides.

Runs an LLM (or any callable) as the *generate* stage of the six-function
family interface, then pushes every proposal through the family's own
screen -> certify pipeline and records per-proposal verdicts in a ledger.

The harness never trusts the model. A proposal can end in exactly one of:

    malformed   the reply did not parse into an object of the family
    rejected    the family's `interesting` screen pruned it (float, prune-only)
    refuted     `certify` produced an exact certificate that the claim is FALSE
    certified   `certify` produced an exact certificate that the claim is TRUE
    undecided   `certify` could not decide (timeout / width too large)

Stdlib only. Fractions for every decision. No floats decide anything.

Usage
    python llm_conjecture_harness.py --dry-run             # fake proposer, no network
    python llm_conjecture_harness.py --model claude-sonnet-4-6 --n 50
    ANTHROPIC_API_KEY=... python llm_conjecture_harness.py --model ... --family egyptian

Plugging in your own family: subclass Family and implement the six methods.
`certify` MUST return an exact verdict object (see Verdict) or None.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import re
import sys
import time
import urllib.request
from dataclasses import dataclass, asdict
from fractions import Fraction
from typing import Any, Callable, Iterable, Optional


# --------------------------------------------------------------------------
# 1. Family interface (mirrors enumerate / value / interesting / certify / key / statement)
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class Verdict:
    """An exact decision. `holds` is a proof outcome, never a float comparison."""
    holds: bool
    witness: str            # human-readable exact witness (rational, box, etc.)
    certificate: dict       # machine-checkable payload, stdlib-serialisable


class Family:
    name: str = "abstract"

    # -- generate stage: what the model is asked, and how we parse the reply --
    def prompt(self, target: Any) -> str:
        raise NotImplementedError

    def parse(self, reply: str) -> Optional[Any]:
        """Return a candidate object or None if malformed."""
        raise NotImplementedError

    # -- the six functions --
    def enumerate(self, n: int, seed: int) -> Iterable[Any]:
        """Targets to pose to the model (not candidates — the model produces those)."""
        raise NotImplementedError

    def value(self, obj: Any) -> float:
        """Float evaluation. Used ONLY by `interesting`. May be wrong."""
        raise NotImplementedError

    def interesting(self, obj: Any, target: Any) -> bool:
        """Float screen. May only prune. Must never be the reason something is admitted."""
        raise NotImplementedError

    def certify(self, obj: Any, target: Any) -> Optional[Verdict]:
        """Exact decision or None (undecided)."""
        raise NotImplementedError

    def key(self, obj: Any) -> str:
        return hashlib.sha256(repr(obj).encode()).hexdigest()[:16]

    def statement(self, obj: Any, target: Any) -> str:
        raise NotImplementedError

    # -- red controls: proposals that MUST be refuted, or the harness is not discriminating --
    def red_controls(self, target: Any) -> list[Any]:
        return []


# --------------------------------------------------------------------------
# 2. A demonstration family whose certification is unfakeable: Egyptian fractions
#    target: a rational p/q.  proposal: a set of distinct unit-fraction denominators.
#    claim: sum(1/d) == p/q exactly.  Certified with Fraction — no float anywhere in the decision.
# --------------------------------------------------------------------------

class EgyptianFamily(Family):
    name = "egyptian"

    def enumerate(self, n, seed):
        rng = random.Random(seed)
        for _ in range(n):
            q = rng.randint(5, 60)
            p = rng.randint(1, q - 1)
            yield Fraction(p, q)

    def prompt(self, target):
        return (
            f"Write {target.numerator}/{target.denominator} as a sum of DISTINCT unit fractions "
            f"1/d1 + 1/d2 + ... with at most 6 terms. Reply with ONLY a JSON list of the "
            f"denominators, e.g. [2,3,7]. No prose."
        )

    def parse(self, reply):
        m = re.search(r"\[[\d,\s]*\]", reply)
        if not m:
            return None
        try:
            ds = json.loads(m.group(0))
        except json.JSONDecodeError:
            return None
        if not ds or not all(isinstance(d, int) and d >= 1 for d in ds):
            return None
        return tuple(sorted(ds))

    def value(self, obj):
        return sum(1.0 / d for d in obj)          # float; only feeds the screen

    def interesting(self, obj, target):
        # prune-only: distinct denominators, at most 6 terms, float sum within 1e-9.
        # A false proposal can survive this; a true one never fails it.
        if len(set(obj)) != len(obj) or len(obj) > 6:
            return False
        return abs(self.value(obj) - float(target)) < 1e-9

    def certify(self, obj, target):
        s = sum(Fraction(1, d) for d in obj)      # exact
        holds = (s == target) and len(set(obj)) == len(obj)
        return Verdict(
            holds=holds,
            witness=f"sum = {s.numerator}/{s.denominator}",
            certificate={"denominators": list(obj), "sum": [s.numerator, s.denominator],
                         "target": [target.numerator, target.denominator], "distinct": len(set(obj)) == len(obj)},
        )

    def statement(self, obj, target):
        return f"{target} = " + " + ".join(f"1/{d}" for d in obj)

    def red_controls(self, target):
        # Off-by-one in last denominator: passes a lax screen at large d, must be refuted exactly.
        greedy = self._greedy(target)
        if len(greedy) >= 2:
            broken = greedy[:-1] + (greedy[-1] + 1,)
            return [tuple(sorted(broken))]
        return []

    @staticmethod
    def _greedy(x: Fraction) -> tuple:
        out = []
        while x > 0:
            d = -(-x.denominator // x.numerator)   # ceil(1/x)
            out.append(d)
            x -= Fraction(1, d)
        return tuple(out)


FAMILIES = {"egyptian": EgyptianFamily}


# --------------------------------------------------------------------------
# 3. Proposers
# --------------------------------------------------------------------------

Proposer = Callable[[str], str]


def anthropic_proposer(model: str, max_tokens: int = 200) -> Proposer:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        sys.exit("ANTHROPIC_API_KEY not set")

    def call(prompt: str) -> str:
        body = json.dumps({"model": model, "max_tokens": max_tokens,
                           "messages": [{"role": "user", "content": prompt}]}).encode()
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages", data=body,
            headers={"content-type": "application/json", "x-api-key": key,
                     "anthropic-version": "2023-06-01"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
        return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
    return call


def fake_proposer(family: Family, seed: int = 0, error_rate: float = 0.4) -> Proposer:
    """Deterministic stand-in: right most of the time, wrong in ways a float screen might miss."""
    rng = random.Random(seed)

    def call(prompt: str) -> str:
        m = re.search(r"Write (\d+)/(\d+)", prompt)
        target = Fraction(int(m.group(1)), int(m.group(2)))
        greedy = list(EgyptianFamily._greedy(target))
        roll = rng.random()
        if roll < error_rate * 0.25:
            return "I think the answer is probably something like 1/2 + 1/3"   # malformed
        if roll < error_rate * 0.5:
            greedy[-1] += 1                                                   # subtly wrong
        elif roll < error_rate * 0.75:
            greedy.append(greedy[-1])                                         # repeated term
        elif roll < error_rate:
            greedy = greedy[:-1]                                              # dropped term
        return json.dumps(greedy)
    return call


# --------------------------------------------------------------------------
# 4. The loop
# --------------------------------------------------------------------------

@dataclass
class Row:
    family: str
    target: str
    proposal_raw: str
    obj: Optional[str]
    outcome: str                 # malformed | rejected | refuted | certified | undecided
    statement: Optional[str]
    witness: Optional[str]
    certificate: Optional[dict]
    key: Optional[str]
    latency_s: float


def decide(fam: Family, obj: Any, target: Any) -> tuple[str, Optional[Verdict]]:
    if obj is None:
        return "malformed", None
    if not fam.interesting(obj, target):
        return "rejected", None
    v = fam.certify(obj, target)
    if v is None:
        return "undecided", None
    return ("certified" if v.holds else "refuted"), v


def run_red_controls(fam: Family, targets: list) -> None:
    fired = total = 0
    for t in targets:
        for bad in fam.red_controls(t):
            total += 1
            outcome, _ = decide(fam, bad, t)
            # A red control must NOT be certified. Rejected-by-screen is fine but not
            # informative; refuted is the outcome that proves the certifier discriminates.
            if outcome == "certified":
                sys.exit(f"RED CONTROL PASSED CERTIFICATION — instrument is broken: {fam.statement(bad, t)}")
            fired += outcome == "refuted"
    print(f"red controls: {total} run, {fired} refuted exactly, 0 certified  [ok]", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--family", default="egyptian", choices=FAMILIES)
    ap.add_argument("--model", default=None, help="Anthropic model id; omit with --dry-run")
    ap.add_argument("--n", type=int, default=30)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--ledger", default="harness-ledger.jsonl")
    args = ap.parse_args()

    fam = FAMILIES[args.family]()
    targets = list(fam.enumerate(args.n, args.seed))
    run_red_controls(fam, targets)

    propose = fake_proposer(fam, args.seed) if args.dry_run else anthropic_proposer(args.model)
    tally = {"malformed": 0, "rejected": 0, "refuted": 0, "certified": 0, "undecided": 0}
    seen = set()

    with open(args.ledger, "a") as ledger:
        for t in targets:
            t0 = time.time()
            raw = propose(fam.prompt(t))
            obj = fam.parse(raw)
            outcome, v = decide(fam, obj, t)
            k = fam.key(obj) if obj is not None else None
            if k in seen:
                continue                     # dedup, inherited from the engine
            seen.add(k)
            tally[outcome] += 1
            row = Row(fam.name, str(t), raw.strip(), repr(obj) if obj is not None else None, outcome,
                      fam.statement(obj, t) if obj is not None else None,
                      v.witness if v else None, v.certificate if v else None, k, round(time.time() - t0, 3))
            ledger.write(json.dumps(asdict(row)) + "\n")

    n = sum(tally.values())
    print(json.dumps({
        "family": fam.name, "model": args.model or "fake", "proposals": n, **tally,
        "certified_rate": round(tally["certified"] / n, 3) if n else None,
        # The number a paper would quote: of well-formed proposals that looked right to a float
        # screen, how many were actually true?
        "screen_survivor_truth_rate": round(
            tally["certified"] / max(1, tally["certified"] + tally["refuted"] + tally["undecided"]), 3),
    }, indent=2))


if __name__ == "__main__":
    main()
