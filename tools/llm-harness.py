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




# --------------------------------------------------------------------------
# 2b. The matmul family: propose a rank-<=R decomposition of the <n,m,p>
#     matmul tensor over Q. Grading is a certificate: the proposal either IS
#     an exact tensor identity over Fractions or it is not. False positives
#     are provably false — the property FrontierMath-style human grading
#     cannot offer. Convention (stated in every prompt, graded exactly):
#         C[i][k] = sum_r w[r][i*p+k] * (sum_{i',j'} u[r][i'*m+j'] A[i'][j'])
#                                     * (sum_{j'',k''} v[r][j''*p+k''] B[j''][k''])
#     equivalently, for all index pairs:
#         sum_r u[r][a*m+b] v[r][c*p+d] w[r][e*p+f] == 1 iff (b==c, e==a, f==d) else 0
# --------------------------------------------------------------------------

STRASSEN7 = {
    "u": [[1,0,0,1],[0,0,1,1],[1,0,0,0],[0,0,0,1],[1,1,0,0],[-1,0,1,0],[0,1,0,-1]],
    "v": [[1,0,0,1],[1,0,0,0],[0,1,0,-1],[-1,0,1,0],[0,0,0,1],[1,1,0,0],[0,0,1,1]],
    "w": [[1,0,0,1],[0,0,1,-1],[0,1,0,1],[1,0,1,0],[-1,1,0,0],[0,0,0,1],[1,0,0,0]],
}


def naive_decomposition(n, m, p):
    """Rank n*m*p: one product per (i,j,k). Always correct — the easy rung."""
    u, v, w = [], [], []
    for i in range(n):
        for j in range(m):
            for k in range(p):
                uu = [0] * (n * m); uu[i * m + j] = 1
                vv = [0] * (m * p); vv[j * p + k] = 1
                ww = [0] * (n * p); ww[i * p + k] = 1
                u.append(uu); v.append(vv); w.append(ww)
    return {"u": u, "v": v, "w": w}


class MatmulFamily(Family):
    name = "matmul"
    dedup = False   # an EVAL counts every proposal; dedup is for discovery corpora

    # (n, m, p, R): achievable targets only; the ladder runs recall -> hard recall
    LADDER = [(2, 2, 2, 8), (2, 2, 2, 7), (2, 2, 3, 11), (3, 3, 3, 23)]

    def enumerate(self, n, seed):
        rng = random.Random(seed)
        ladder = list(self.LADDER)
        for i in range(n):
            yield ladder[i % len(ladder)] if rng.random() < 2 else ladder[rng.randrange(len(ladder))]

    def prompt(self, target):
        n, m, p, R = target
        return (
            f"Give a rank-{R} (or lower) decomposition of the {n}x{m} by {m}x{p} matrix "
            f"multiplication tensor over the rationals.\n\n"
            f"CONVENTION. A is {n}x{m}, vectorized row-major as a[0..{n*m-1}] with a[r*{m}+c] = A[r][c]. "
            f"B is {m}x{p}, vectorized row-major as b[0..{m*p-1}] with b[r*{p}+c] = B[r][c]. "
            f"C = A*B is {n}x{p}. Your answer is three lists u, v, w, each with R rows: "
            f"u rows have length {n*m}, v rows length {m*p}, w rows length {n*p}. "
            f"It must satisfy, for ALL matrices A and B and all i in 0..{n-1}, k in 0..{p-1}:\n"
            f"  C[i][k] = sum over r of  w[r][i*{p}+k] * (dot(u[r], a)) * (dot(v[r], b))\n\n"
            f"WORKED EXAMPLE at the smaller size 1x2 times 2x1 (rank 2, naive): "
            f'{{"u": [[1,0],[0,1]], "v": [[1,0],[0,1]], "w": [[1],[1]]}} — '
            f"here C[0][0] = 1*(A[0][0])*(B[0][0]) + 1*(A[0][1])*(B[1][0]), which is correct.\n\n"
            f"Entries may be integers or exact fractions written as strings like \"1/2\". "
            f'Reply with ONLY the JSON object {{"u": [...], "v": [...], "w": [...]}} — '
            f"no prose, no markdown code fences."
        )

    @staticmethod
    def _frac(x):
        if isinstance(x, bool):
            raise ValueError
        if isinstance(x, int):
            return Fraction(x)
        if isinstance(x, str):
            return Fraction(x)
        raise ValueError

    def parse(self, reply):
        m = re.search(r"\{.*\}", reply, re.S)
        if not m:
            return None
        try:
            d = json.loads(m.group(0))
            u = [[self._frac(x) for x in row] for row in d["u"]]
            v = [[self._frac(x) for x in row] for row in d["v"]]
            w = [[self._frac(x) for x in row] for row in d["w"]]
        except Exception:
            return None
        if not (u and v and w) or not (len(u) == len(v) == len(w)):
            return None
        return (tuple(tuple(r) for r in u), tuple(tuple(r) for r in v), tuple(tuple(r) for r in w))

    def value(self, obj):
        return float(len(obj[0]))                     # rank; only feeds the screen

    def interesting(self, obj, target):
        # prune-only: shapes, rank bound, and ONE float spot-test on random matrices.
        n, m, p, R = target
        u, v, w = obj
        if len(u) > R:
            return False
        if any(len(r) != n * m for r in u) or any(len(r) != m * p for r in v) or any(len(r) != n * p for r in w):
            return False
        rng = random.Random(1234)
        A = [[rng.uniform(-1, 1) for _ in range(m)] for _ in range(n)]
        B = [[rng.uniform(-1, 1) for _ in range(p)] for _ in range(m)]
        C = [[sum(A[i][j] * B[j][k] for j in range(m)) for k in range(p)] for i in range(n)]
        for i in range(n):
            for k in range(p):
                got = sum(float(w[r][i * p + k])
                          * sum(float(u[r][a]) * A[a // m][a % m] for a in range(n * m))
                          * sum(float(v[r][b]) * B[b // p][b % p] for b in range(m * p))
                          for r in range(len(u)))
                if abs(got - C[i][k]) > 1e-6:
                    return False
        return True

    def certify(self, obj, target):
        # THE decision: the full tensor identity over Fractions. Always decidable.
        n, m, p, R = target
        u, v, w = obj
        ok = len(u) <= R
        bad = None
        for a in range(n):
            for b in range(m):
                for c in range(m):
                    for d in range(p):
                        for e in range(n):
                            for f in range(p):
                                s = sum(u[r][a * m + b] * v[r][c * p + d] * w[r][e * p + f]
                                        for r in range(len(u)))
                                want = Fraction(1 if (b == c and e == a and f == d) else 0)
                                if s != want:
                                    ok = False
                                    if bad is None:
                                        bad = (a, b, c, d, e, f, str(s), str(want))
        return Verdict(
            holds=ok,
            witness=("exact tensor identity holds; rank " + str(len(u)) + " <= " + str(R)) if ok
            else ("identity fails at " + repr(bad) if bad else "rank " + str(len(u)) + " > " + str(R)),
            certificate={"dims": [n, m, p], "rank": len(u), "target_rank": R,
                         "first_violation": bad},
        )

    def statement(self, obj, target):
        n, m, p, R = target
        return f"a rank-{len(obj[0])} decomposition of <{n},{m},{p}> (target <= {R})"

    def red_controls(self, target):
        n, m, p, R = target
        out = []
        if (n, m, p) == (2, 2, 2):
            wrong = {k: [list(r) for r in v] for k, v in STRASSEN7.items()}
            wrong["w"][0][0] = 2                      # one coefficient off: screen may prune it
            out.append(self.parse(json.dumps(wrong)))
            subtle = {k: [list(r) for r in v] for k, v in STRASSEN7.items()}
            subtle["w"][0][0] = "1000000001/1000000000"   # +1e-9: BELOW the float screen's
            out.append(self.parse(json.dumps(subtle)))    # tolerance — must be REFUTED exactly
        nv = naive_decomposition(n, m, p)
        if len(nv["u"]) - 1 <= R:                     # dropped last product, rank fits: must be REFUTED
            dropped = {k: v[:-1] for k, v in nv.items()}
            out.append(self.parse(json.dumps(dropped)))
        return [o for o in out if o is not None]

    # deterministic stand-in for --dry-run
    def fake(self, prompt, rng):
        m = re.search(r"rank-(\d+) \(or lower\) decomposition of the (\d+)x(\d+) by \d+x(\d+)", prompt)
        R, n, mm, p = (int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4)))
        roll = rng.random()
        if roll < 0.10:
            return "I believe Strassen solved this in 1969."          # malformed
        if (n, mm, p, R) == (2, 2, 2, 7):
            if roll < 0.45:
                return json.dumps(STRASSEN7)                           # correct
            wrong = {k: [list(r) for r in v] for k, v in STRASSEN7.items()}
            wrong["v"][3][0] = 1                                       # subtly wrong
            return json.dumps(wrong)
        nv = naive_decomposition(n, mm, p)
        if len(nv["u"]) <= R:
            return json.dumps(nv)                                      # correct (easy rung)
        if roll < 0.55:
            return json.dumps({k: v[: R] for k, v in nv.items()})      # truncated: wrong
        return json.dumps(nv)                                          # over-rank: rejected


FAMILIES = {"egyptian": EgyptianFamily, "matmul": MatmulFamily}


# --------------------------------------------------------------------------
# 3. Proposers
# --------------------------------------------------------------------------

Proposer = Callable[[str], str]


def _oauth_token() -> str:
    """Short-lived access token from the `ant auth login` profile — the
    keyless auth path (nothing static exists to leak or rotate)."""
    import subprocess
    return subprocess.check_output(
        ["ant", "auth", "print-credentials", "--access-token"], text=True).strip()


def anthropic_proposer(model: str, max_tokens: int = 200) -> Proposer:
    # Credential resolution, in order: ANTHROPIC_API_KEY, then the OAuth
    # profile stored by `ant auth login` (preferred: no static key to
    # manage — the operator's post-leak protocol).
    key = os.environ.get("ANTHROPIC_API_KEY")
    token = None
    if not key:
        try:
            token = _oauth_token()
        except Exception:
            sys.exit("no ANTHROPIC_API_KEY and no `ant auth login` profile "
                     "(install: brew install anthropics/tap/ant; then: ant auth login)")

    def call(prompt: str) -> str:
        nonlocal token
        body = json.dumps({"model": model, "max_tokens": max_tokens,
                           "messages": [{"role": "user", "content": prompt}]}).encode()

        def build_request() -> urllib.request.Request:
            headers = {"content-type": "application/json",
                       "anthropic-version": "2023-06-01"}
            if key:
                headers["x-api-key"] = key
            else:
                headers["Authorization"] = "Bearer " + token
                headers["anthropic-beta"] = "oauth-2025-04-20"
            return urllib.request.Request(
                "https://api.anthropic.com/v1/messages", data=body, headers=headers)

        last = None
        for attempt in range(5):                      # transient network/API errors: retry,
            try:                                      # never record them as model outcomes
                with urllib.request.urlopen(build_request(), timeout=120) as r:
                    data = json.load(r)
                return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
            except Exception as e:                    # noqa: BLE001
                last = e
                if token is not None and getattr(e, "code", None) == 401:
                    try:                              # token expired mid-campaign: refresh once per bounce
                        token = _oauth_token()
                    except Exception:                 # noqa: BLE001
                        pass
                time.sleep(2 ** attempt)
        raise RuntimeError(f"API failed after 5 attempts: {last}")
    return call


def fake_proposer(family: Family, seed: int = 0, error_rate: float = 0.4) -> Proposer:
    """Deterministic stand-in: right most of the time, wrong in ways a float screen might miss."""
    rng = random.Random(seed)
    if hasattr(family, "fake"):
        return lambda prompt: family.fake(prompt, rng)

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
    model: str
    tag: str
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
    ap.add_argument("--tag", default="v1", help="campaign tag recorded per row (prompt/version)")
    ap.add_argument("--max-tokens", type=int, default=200,
                    help="reply cap; matmul's upper rungs need thousands")
    ap.add_argument("--proposals", default=None,
                    help="grade a JSONL of externally generated proposals instead of calling any "
                         "API: each line {\"target\": ..., \"proposal\": \"...\"}. Same screen, "
                         "same certifier, same red controls — the outsider submission path.")
    ap.add_argument("--model-label", default=None,
                    help="attribution recorded as the ledger's model field (required with --proposals)")
    args = ap.parse_args()

    fam = FAMILIES[args.family]()
    if args.proposals:
        # The submission path: proposals were generated elsewhere (any model, any
        # provider); this machine only GRADES. Targets must come from the family's
        # own enumeration — the published ladder — so a submission cannot smuggle
        # in an easier task and wear the ladder's name.
        if not args.model_label:
            sys.exit("--proposals requires --model-label (the board needs attribution)")
        universe: dict = {}
        for t in fam.enumerate(max(args.n, 64), args.seed):
            universe.setdefault(str(t), t)
        work = []
        with open(args.proposals) as fh:
            for line in fh:
                if not line.strip():
                    continue
                e = json.loads(line)
                tk = e.get("target")
                if isinstance(tk, list):
                    tk = str(tuple(tk))
                tk = str(tk)
                if tk not in universe:
                    sys.exit(f"target {tk!r} is not in the family's enumeration — "
                             f"submissions are graded on the published ladder only")
                work.append((universe[tk], str(e.get("proposal", e.get("proposal_raw", "")))))
        targets = [t for t, _ in work]
    else:
        work = None
        targets = list(fam.enumerate(args.n, args.seed))
    run_red_controls(fam, targets)

    model_name = args.model_label if args.proposals else (args.model or "fake")
    propose = (None if args.proposals
               else fake_proposer(fam, args.seed) if args.dry_run
               else anthropic_proposer(args.model, args.max_tokens))
    tally = {"malformed": 0, "rejected": 0, "refuted": 0, "certified": 0, "undecided": 0}
    seen = set()

    with open(args.ledger, "a") as ledger:
        for t, pre in (work if work is not None else ((t, None) for t in targets)):
            t0 = time.time()
            if pre is not None:
                raw = pre
            else:
                try:
                    raw = propose(fam.prompt(t))
                except RuntimeError as e:
                    print(f"SKIPPED (api): {t} — {e}", file=sys.stderr)
                    continue                          # an API failure is not a model outcome
            obj = fam.parse(raw)
            outcome, v = decide(fam, obj, t)
            k = fam.key(obj) if obj is not None else None
            if getattr(fam, "dedup", True):
                if k in seen:
                    continue                 # dedup, inherited from the engine
                seen.add(k)
            tally[outcome] += 1
            row = Row(fam.name, model_name, args.tag, str(t), raw.strip(), repr(obj) if obj is not None else None, outcome,
                      fam.statement(obj, t) if obj is not None else None,
                      v.witness if v else None, v.certificate if v else None, k, round(time.time() - t0, 3))
            ledger.write(json.dumps(asdict(row)) + "\n")

    n = sum(tally.values())
    print(json.dumps({
        "family": fam.name, "model": model_name, "proposals": n, **tally,
        "certified_rate": round(tally["certified"] / n, 3) if n else None,
        # The number a paper would quote: of well-formed proposals that looked right to a float
        # screen, how many were actually true?
        "screen_survivor_truth_rate": round(
            tally["certified"] / max(1, tally["certified"] + tally["refuted"] + tally["undecided"]), 3),
    }, indent=2))


if __name__ == "__main__":
    main()
