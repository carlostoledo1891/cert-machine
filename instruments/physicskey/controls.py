#!/usr/bin/env python3
"""The planted files of RULES.md section 9: synthetic runs with a known answer.

Standard library only; no engine. Writes corpus/physics-key/controls/<id>.f64.gz and
runs.json, whose `expected` field is what each decider must return (read by the
record script, never by a decider).
"""
import gzip
import hashlib
import json
import math
import os
import struct
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "corpus", "physics-key", "controls")


def bits(x):
    return struct.pack(">d", float(x)).hex()


def pack(rows):
    return b"".join(struct.pack("<%dd" % len(r), *r) for r in rows)


def entry(run_id, scene, steps, nq, nv, raw, params, expected, sha=None):
    return {
        "id": run_id, "scene": scene, "engine": "planted", "engineVersion": "0",
        "integrator": "none", "timestep": "0.002", "timestepBits": bits(0.002),
        "steps": steps, "nq": nq, "nv": nv,
        "sha256": sha or hashlib.sha256(raw).hexdigest(),
        "params": params, "warnings": {}, "expected": expected,
    }, raw


def fall_exact():
    """RC1: the exact parabola rounded to the nearest double."""
    g, h, n = 9.81, 0.002, 1000
    G = Fraction(g)
    rows, t = [], 0.0
    for _ in range(n + 1):
        T = Fraction(t)
        z = float(-G * T * T / 2)          # float(Fraction) rounds to nearest
        vz = float(-G * T)
        rows.append([t, 0.0, 0.0, z, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, vz, 0.0, 0.0, 0.0])
        t += h                             # accumulated as the engine does
    return entry("rc1-fall-exact", "fall", n, 7, 6, pack(rows), {"G": bits(g)},
                 {"F-POS": {"1e-12": "CERTIFIED"}, "F-VEL": {"1e-12": "CERTIFIED"}})


def top_rows(n, h, bump=None, nan=None):
    rows, t = [], 0.0
    for k in range(n + 1):
        w2 = 4.0
        if bump is not None and k == bump:
            w2 = 4.0 * (1.0 + 2.0 ** -20)
        w1 = float("nan") if (nan is not None and k == nan) else 0.0
        a = 2.0 * t                         # half the rotation angle about y
        rows.append([t, 0.0, 0.0, 0.0, math.cos(a), 0.0, math.sin(a), 0.0,
                     0.0, 0.0, 0.0, w1, w2, 0.0])
        t += h
    return rows


TOP = {"I1": bits(1.0), "I2": bits(2.0), "I3": bits(3.0)}
ALL0 = {law: {"0": "CERTIFIED"} for law in ("T-ENERGY", "T-LMAG", "T-LVEC")}


def main():
    os.makedirs(OUT, exist_ok=True)
    out = [fall_exact()]

    out.append(entry("rc2a-top-constant", "top", 1000, 7, 6, pack(top_rows(1000, 0.01)), TOP, ALL0))
    out.append(entry("rc2b-top-bump", "top", 1000, 7, 6, pack(top_rows(1000, 0.01, bump=700)), TOP, {
        "T-ENERGY": {"1e-6": ["REFUTED", 700], "1e-4": "CERTIFIED"},
        "T-LMAG": {"1e-6": ["REFUTED", 700], "1e-4": "CERTIFIED"},
        "T-LVEC": {"1e-6": "CERTIFIED", "1e-9": ["REFUTED", 700]},
    }))
    out.append(entry("rc3-top-nan", "top", 1000, 7, 6, pack(top_rows(1000, 0.01, nan=5)), TOP,
                     {"status": "nonfinite", "nonFiniteStep": 5, "all": "REFUSED"}))

    full = pack(top_rows(1000, 0.01))
    out.append(entry("rc4a-top-truncated", "top", 1000, 7, 6, full[:-8], TOP,
                     {"status": "malformed", "all": "REFUSED"}))
    flipped = bytearray(full)
    flipped[4000] ^= 1
    out.append(entry("rc4b-top-wrong-sha", "top", 1000, 7, 6, bytes(flipped), TOP,
                     {"status": "malformed", "all": "REFUSED"},
                     sha=hashlib.sha256(full).hexdigest()))

    PEND = {"M": bits(1.0), "L": bits(1.0), "IYY": bits(0.01), "G": bits(9.81)}
    base = [[0.002 * k, 2.0, 0.5] for k in range(11)]
    a = [r[:] for r in base]
    a[4][1:] = [-2.0, -0.5]
    a[7][1:] = [-2.0, 0.5]
    out.append(entry("rc5a-pendulum-return", "pendulum", 10, 1, 1, pack(a), PEND,
                     {"P-ENERGY": {"0": "CERTIFIED"}}))
    b = [r[:] for r in base]
    b[6][2] = 0.5 * (1.0 + 2.0 ** -30)      # same angle, a faster swing: D is rational
    out.append(entry("rc5b-pendulum-speed", "pendulum", 10, 1, 1, pack(b), PEND,
                     {"P-ENERGY": {"1e-9": "CERTIFIED", "1e-12": ["REFUTED", 6], "0": ["REFUTED", 6]}}))
    c = [r[:] for r in base]
    c[3][1] = 2.0 + 2.0 ** -40              # a different angle: D needs the cosine
    out.append(entry("rc5c-pendulum-angle", "pendulum", 10, 1, 1, pack(c), PEND,
                     {"P-ENERGY": {"1e-12": "CERTIFIED", "0": ["REFUTED", 3]}}))

    manifest = []
    for e, raw in out:
        manifest.append(e)
        with open(os.path.join(OUT, e["id"] + ".f64.gz"), "wb") as f:
            with gzip.GzipFile(filename="", mode="wb", fileobj=f, mtime=0, compresslevel=9) as g:
                g.write(raw)
    with open(os.path.join(OUT, "runs.json"), "w") as f:
        json.dump({"format": 1, "runs": manifest}, f, indent=1, sort_keys=True)
        f.write("\n")
    print("wrote %d planted files" % len(manifest))


if __name__ == "__main__":
    main()
