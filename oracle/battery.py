#!/usr/bin/env python3
"""battery.py — the claim oracle's gate: calibrations against known answers,
reds that must fire. Run: python3 oracle/battery.py (exit != 0 on failure).
oracle · cert-machine

Note the import itself is the first red set: certmachine refuses to import
with a broken grader (Strassen must certify, the sub-float forgery must be
refuted, a float entry must be refused) — this battery re-proves those and
adds the rest."""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import certmachine as cm  # noqa: E402  (import runs its own reds)

n_ok = 0
reds = 0


def ok(name, cond):
    global n_ok
    if not cond:
        print("FAIL " + name)
        sys.exit(1)
    n_ok += 1
    print("PASS " + name)


def red(name, cond):
    global reds
    ok(name + " (RED ok)", cond)
    reds += 1


CLAIM222 = {"task": {"kind": "matmul", "n": 2, "m": 2, "p": 2, "rank": 7}, "ring": "Q"}


def c(**kw):
    d = json.loads(json.dumps(CLAIM222))
    d.update(kw)
    return d


# ---- calibrations -----------------------------------------------------------
r = cm.certify(c(witness=cm.STRASSEN7))
ok("Strassen 1969 CERTIFIES: 64 equations, rank 7, sha stable",
   r["verdict"] == "CERTIFIED" and r["certificate"]["equations_checked"] == 64
   and r["certificate"]["witness_rank"] == 7)
sha1 = r["certificate"]["witness_sha256"]
ok("determinism: the same claim yields the same certificate sha",
   cm.certify(c(witness=cm.STRASSEN7))["certificate"]["witness_sha256"] == sha1)


def naive(n, m, p):
    u, v, w = [], [], []
    for i in range(n):
        for j in range(m):
            for k in range(p):
                uu = [0] * (n * m); uu[i * m + j] = 1
                vv = [0] * (m * p); vv[j * p + k] = 1
                ww = [0] * (n * p); ww[i * p + k] = 1
                u.append(uu); v.append(vv); w.append(ww)
    return {"u": u, "v": v, "w": w}


r = cm.certify({"task": {"kind": "matmul", "n": 3, "m": 3, "p": 3, "rank": 27},
                "ring": "Q", "witness": naive(3, 3, 3)})
ok("naive <3,3,3> rank-27 CERTIFIES (729 equations)",
   r["verdict"] == "CERTIFIED" and r["certificate"]["equations_checked"] == 729)

ok("rational entries as strings: scaled Strassen row certifies",
   cm.certify(c(witness={**cm.STRASSEN7,
                         "u": [["1/2" if x == 1 else str(x) for x in cm.STRASSEN7["u"][0]]]
                              + cm.STRASSEN7["u"][1:],
                         "w": [[str(2 * x) for x in cm.STRASSEN7["w"][0]]] + cm.STRASSEN7["w"][1:]}
               ))["verdict"] == "CERTIFIED")

# the characteristic-2 story as a known-answer pair (the AlphaTensor shape)
flip = json.loads(json.dumps(cm.STRASSEN7)); flip["u"][6] = [0, 1, 0, 1]
ok("sign-flipped Strassen: REFUTED over Q ...",
   cm.certify(c(witness=flip))["verdict"] == "REFUTED")
ok("... and CERTIFIED over F2 — the speedup-needs-characteristic-2 mechanism, reproduced",
   cm.certify(c(ring="F2", witness=flip))["verdict"] == "CERTIFIED")

# ---- reds: refuted with the exact mechanism ----------------------------------
forged = json.loads(json.dumps(cm.STRASSEN7)); forged["u"][0][0] = "1000000001/1000000000"
r = cm.certify(c(witness=forged))
red("sub-float forgery (1e-9, exact) REFUTED with the first violated equation",
    r["verdict"] == "REFUTED" and r["mechanism"]["kind"] == "equation_violation"
    and r["mechanism"]["discrepancy"] not in ("", "0"))
r2 = cm.certify(c(witness=forged))
ok("mechanism determinism: same forgery, same first violation",
   r2["mechanism"]["first_violation"] == r["mechanism"]["first_violation"]
   and r2["mechanism"]["discrepancy"] == r["mechanism"]["discrepancy"])

eight = naive(2, 2, 2)
r = cm.certify(c(witness=eight))   # rank 8 > claimed 7
red("rank overflow REFUTED: 8 products against a rank-7 claim",
    r["verdict"] == "REFUTED" and r["mechanism"]["kind"] == "rank_overflow")

r = cm.certify(c(witness={**cm.STRASSEN7, "u": [[0.5, 0, 0, 1]] + cm.STRASSEN7["u"][1:]}))
red("a float entry is REFUSED at the door (never decided)", r["verdict"] == "REFUSED"
    and "float" in r["reason"])

red("F2 with fractional entries is REFUSED",
    cm.certify(c(ring="F2", witness={**cm.STRASSEN7,
                                     "u": [["1/2", 0, 0, 1]] + cm.STRASSEN7["u"][1:]}))["verdict"] == "REFUSED")
red("an unsupported ring is REFUSED with the reason",
    cm.certify(c(ring="Zi", witness=cm.STRASSEN7))["verdict"] == "REFUSED")
red("wrong row width is REFUSED, not guessed",
    cm.certify(c(witness={"u": [[1, 0, 0]], "v": [[1, 0, 0, 0]], "w": [[1, 0, 0, 0]]}))["verdict"] == "REFUSED")

# rank-6 <2,2,2>: a well-formed impossible claim must come back REFUTED
# (Winograd 1971 — no rank-6 witness exists, so any submitted one fails)
six = {"u": cm.STRASSEN7["u"][:6], "v": cm.STRASSEN7["v"][:6], "w": cm.STRASSEN7["w"][:6]}
r = cm.certify({"task": {"kind": "matmul", "n": 2, "m": 2, "p": 2, "rank": 6}, "ring": "Q", "witness": six})
ok("a truncated rank-6 witness is REFUTED (Winograd's floor holds per-instance)",
   r["verdict"] == "REFUTED")

print(f"ALL PASS: {n_ok} checks, {reds} reds fired")
