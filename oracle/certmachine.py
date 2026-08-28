"""certmachine — the claim oracle: exact certification of matmul tensor
decompositions. cert-machine/oracle · MIT · stdlib only, zero dependencies.

THE CONTRACT. certify(claim) takes one JSON-shaped claim

    {"task": {"kind": "matmul", "n": 2, "m": 2, "p": 2, "rank": 7},
     "ring": "Q",                      # or "F2"
     "witness": {"u": [[...], ...], "v": [[...], ...], "w": [[...], ...]}}

and returns exactly one of

    {"verdict": "CERTIFIED", "certificate": {...}}   the witness IS a rank-R
        decomposition: every one of the (nm)(mp)(np) tensor equations holds
        exactly over the ring, and rank(witness) <= R. The certificate
        carries the equation count, the rank, and a sha256 of the canonical
        witness bytes.
    {"verdict": "REFUTED", "mechanism": {...}}       the claim is FALSE and
        the mechanism says precisely why: the first violated equation with
        the exact left side, the required right side, and the discrepancy —
        or the rank overflow. Nothing else; the mechanism is the grader's
        own arithmetic, never coaching.
    {"verdict": "REFUSED", "reason": "..."}          the claim is not well
        formed enough to decide (wrong shapes, non-rational entries, floats,
        unsupported ring). A REFUSAL is not a failure verdict on the math —
        it is the refusal to guess.

PROMISES. No float ever participates in a decision: entries must be
integers or exact rational strings "p/q" (floats are REFUSED at the door).
Grading is deterministic. RED CONTROLS RUN AT IMPORT: Strassen's 1969
witness must certify, a sub-float forgery (one coefficient off by 1e-9,
exactly) must be REFUTED, and a malformed claim must be REFUSED — if any
of these fails, the import raises and certify() never becomes available.
Nothing can be turned off silently.

The equation convention (identical to the cert-machine eval harness, which
imports THIS module — one definition, all consumers):

    sum_r u[r][a*m+b] * v[r][c*p+d] * w[r][e*p+f]
        == 1  iff (b == c and e == a and f == d)  else 0

The independent re-check: reports/matmul-eval.html carries a browser-side
mirror of this arithmetic, and the repo's stdlib verifiers re-prove the
published ledgers. The citable path is this module plus its battery:
    python3 oracle/battery.py
"""
from __future__ import annotations

import hashlib
import json
from fractions import Fraction

__all__ = ["certify", "check_Q", "TOOL_DEFINITION_PATH"]
TOOL_DEFINITION_PATH = "oracle/tool-definition.json"


# ---- entry parsing: exact or refused --------------------------------------

def _entry(x):
    """int | 'p/q' | 'n' -> Fraction; anything else (floats included) -> None."""
    if isinstance(x, bool):
        return None
    if isinstance(x, int):
        return Fraction(x)
    if isinstance(x, str):
        try:
            return Fraction(x)          # accepts 'p/q' and integer strings
        except (ValueError, ZeroDivisionError):
            return None
    return None                          # float, list, dict, None: refused


def _parse_witness(task, witness):
    """-> (u, v, w) as Fraction matrices, or a REFUSED reason string."""
    n, m, p = task["n"], task["m"], task["p"]
    dims = {"u": n * m, "v": m * p, "w": n * p}
    out = {}
    if not isinstance(witness, dict):
        return "witness must be an object with u, v, w"
    for key, width in dims.items():
        rows = witness.get(key)
        if not isinstance(rows, list) or not rows:
            return f"witness.{key} must be a non-empty list of rows"
        parsed = []
        for i, row in enumerate(rows):
            if not isinstance(row, list) or len(row) != width:
                return f"witness.{key}[{i}] must be a list of length {width}"
            vals = [_entry(x) for x in row]
            if any(v is None for v in vals):
                bad = row[[v is None for v in vals].index(True)]
                return (f"witness.{key}[{i}] holds a non-exact entry {bad!r} — "
                        "entries must be integers or exact rational strings 'p/q' "
                        "(floats are refused: no float ever participates in a decision)")
            parsed.append(vals)
        out[key] = parsed
    if not (len(out["u"]) == len(out["v"]) == len(out["w"])):
        return "u, v, w must have the same number of rows (one per product)"
    return out["u"], out["v"], out["w"]


# ---- the decision core (shared with the eval harness) ----------------------

def check_Q(u, v, w, n, m, p):
    """The full tensor identity over exact rationals. Returns (ok, bad) where
    bad is the FIRST violated equation as (a, b, c, d, e, f, got, want) with
    got/want as Fractions — iteration order fixed, so the mechanism is
    deterministic. Identical loop to the cert-machine eval harness."""
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
                                return False, (a, b, c, d, e, f, s, want)
    return True, None


def _check_F2(u, v, w, n, m, p):
    """The same identity mod 2. Entries must be integers mod 2 (a Fraction
    with even denominator has no F2 meaning — the caller REFUSES those)."""
    for a in range(n):
        for b in range(m):
            for c in range(m):
                for d in range(p):
                    for e in range(n):
                        for f in range(p):
                            s = sum(int(u[r][a * m + b]) * int(v[r][c * p + d]) * int(w[r][e * p + f])
                                    for r in range(len(u))) % 2
                            want = 1 if (b == c and e == a and f == d) else 0
                            if s != want:
                                return False, (a, b, c, d, e, f, Fraction(s), Fraction(want))
    return True, None


# ---- the public oracle ------------------------------------------------------

def certify(claim):
    """Decide one claim. Returns a dict with exactly one of the three verdicts
    (see the module docstring). Never raises on claim content — a claim that
    cannot be decided is REFUSED with the reason."""
    def refused(reason):
        return {"verdict": "REFUSED", "reason": reason}

    if not isinstance(claim, dict):
        return refused("claim must be a JSON object")
    task = claim.get("task")
    if not isinstance(task, dict) or task.get("kind") != "matmul":
        return refused("task.kind must be 'matmul' (the v1 oracle scope: rank-R "
                       "decompositions of the <n,m,p> matrix-multiplication tensor)")
    try:
        n, m, p, rank = int(task["n"]), int(task["m"]), int(task["p"]), int(task["rank"])
    except (KeyError, TypeError, ValueError):
        return refused("task needs integer n, m, p, rank")
    if not (1 <= n <= 6 and 1 <= m <= 6 and 1 <= p <= 6 and 1 <= rank <= 256):
        return refused("task out of the supported box: 1 <= n,m,p <= 6, 1 <= rank <= 256")
    ring = claim.get("ring")
    if ring not in ("Q", "F2"):
        return refused("ring must be 'Q' or 'F2' in v1 (the Z[i] audit exists in "
                       "instruments/strassen and joins a later version)")

    parsed = _parse_witness(task, claim.get("witness"))
    if isinstance(parsed, str):
        return refused(parsed)
    u, v, w = parsed

    if ring == "F2":
        for mat in (u, v, w):
            for row in mat:
                if any(x.denominator != 1 for x in row):
                    return refused("F2 entries must be integers (a fraction has no meaning mod 2)")

    R = len(u)
    if R > rank:
        return {"verdict": "REFUTED", "mechanism": {
            "kind": "rank_overflow", "witness_rank": R, "claimed_rank": rank,
            "text": f"the witness uses {R} products but the claim asserts rank <= {rank}"}}

    ok, bad = (check_Q if ring == "Q" else _check_F2)(u, v, w, n, m, p)
    if not ok:
        a, b, c, d, e, f, got, want = bad
        return {"verdict": "REFUTED", "mechanism": {
            "kind": "equation_violation",
            "first_violation": [a, b, c, d, e, f],
            "equation": f"sum_r u[r][{a}*{m}+{b}] * v[r][{c}*{p}+{d}] * w[r][{e}*{p}+{f}]",
            "got": str(got), "want": str(want),
            "discrepancy": str(got - want),
            "text": "the identity fails at the stated index; the discrepancy is exact"}}

    canon = json.dumps({"task": {"kind": "matmul", "n": n, "m": m, "p": p, "rank": rank},
                        "ring": ring,
                        "witness": {k: [[str(x) for x in row] for row in mat]
                                    for k, mat in (("u", u), ("v", v), ("w", w))}},
                       sort_keys=True, separators=(",", ":"))
    return {"verdict": "CERTIFIED", "certificate": {
        "task": {"kind": "matmul", "n": n, "m": m, "p": p, "rank": rank},
        "ring": ring, "witness_rank": R,
        "equations_checked": (n * m) * (m * p) * (n * p),
        "witness_sha256": hashlib.sha256(canon.encode()).hexdigest(),
        "statement": (f"the witness is an exact rank-{R} decomposition of the "
                      f"<{n},{m},{p}> matrix-multiplication tensor over {ring}: all "
                      f"{(n * m) * (m * p) * (n * p)} equations hold exactly"),
        "verify": "python3 oracle/battery.py  (red controls) · the browser mirror on /reports/matmul-eval.html"}}


# ---- red controls at import: the oracle refuses to exist broken -------------

STRASSEN7 = {
    "u": [[1, 0, 0, 1], [0, 0, 1, 1], [1, 0, 0, 0], [0, 0, 0, 1], [1, 1, 0, 0], [-1, 0, 1, 0], [0, 1, 0, -1]],
    "v": [[1, 0, 0, 1], [1, 0, 0, 0], [0, 1, 0, -1], [-1, 0, 1, 0], [0, 0, 0, 1], [1, 1, 0, 0], [0, 0, 1, 1]],
    "w": [[1, 0, 0, 1], [0, 0, 1, -1], [0, 1, 0, 1], [1, 0, 1, 0], [-1, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0]],
}


def _import_reds():
    claim = {"task": {"kind": "matmul", "n": 2, "m": 2, "p": 2, "rank": 7},
             "ring": "Q", "witness": STRASSEN7}
    if certify(claim)["verdict"] != "CERTIFIED":
        raise ImportError("certmachine red control failed: Strassen 1969 did not certify")
    forged = json.loads(json.dumps(STRASSEN7))
    forged["u"][0][0] = "1000000001/1000000000"       # off by 1e-9, exactly
    r = certify({**claim, "witness": forged})
    if r["verdict"] != "REFUTED" or r["mechanism"]["kind"] != "equation_violation":
        raise ImportError("certmachine red control failed: the sub-float forgery was not refuted")
    if certify({"task": {"kind": "matmul", "n": 2, "m": 2, "p": 2, "rank": 7},
                "ring": "Q", "witness": {"u": [[0.1, 0, 0, 1]], "v": [[1]], "w": [[1]]}})["verdict"] != "REFUSED":
        raise ImportError("certmachine red control failed: a float entry was not refused")


_import_reds()


if __name__ == "__main__":
    import sys
    claim = json.load(sys.stdin)
    print(json.dumps(certify(claim), indent=1))
