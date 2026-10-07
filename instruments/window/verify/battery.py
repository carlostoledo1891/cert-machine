#!/usr/bin/env python3
# battery.py -- the battery of the clean-room second verifier (verify_day.py).
#
# CLEAN-ROOM, 2026-10-07, from instruments/window/verify/SPEC.md only (same list of
# never-read files as verify_day.py's header). Three parts:
#   GREEN  hand-computed expectations: a few unit checks, then a synthetic world (records +
#          a day file built in a temp dir, pinned by sha256) whose every letter was worked out
#          by hand in the comments below; it must verify with zero differences.
#   RED    controls: each mutates the green world in one way and the verifier MUST fail.
#   REAL   the published day: every decision must be re-decided equal.
#
#   python3 instruments/window/verify/battery.py [--day PATH/today.json]
# exit != 0 on any failure.

import argparse
import copy
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timedelta
from fractions import Fraction as F

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True           # no __pycache__ left in the repository
import verify_day as V  # noqa: E402

# the real day: the desk's local copy, written by apps/janela/build-today.js (git-ignored); --day names another
REAL_DAY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "site", "janela", "data", "today.json")
DNV = "apps/janela/scenario/rules/dnv-alpha.json"

RESULTS = {"green": 0, "red": 0, "fail": 0}


def check(kind, name, cond, detail=""):
    if cond:
        RESULTS[kind] += 1
        print(f"ok    {kind:5} {name}")
    else:
        RESULTS["fail"] += 1
        print(f"FAIL  {kind:5} {name}  {detail}")


# ================================================================ GREEN 1: unit checks

def unit_checks():
    dnv_rec = {DNV: V.load_json(open(os.path.join(ROOT, DNV), "rb").read(), DNV)}
    dnv = V.dnv_tables(dnv_rec)
    # Table 4-1 row "12" = [0.65, 0.76, 0.79, 0.80] over columns [1, 2, 4, 6].
    # design 3.5 m lies between columns 2 and 4:
    #   alpha = 0.76 + (3.5 - 2)/(4 - 2) * (0.79 - 0.76) = 0.76 + 0.75 * 0.03 = 0.7825
    # (0.7825, not 0.785), and the limit 3.5 * 0.7825 = 2.73875 exactly.
    check("green", "Table 4-1, 3.5 m at TPOP 12 h -> 0.7825",
          V.table_wave_alpha(dnv, F(12), F("3.5")) == F("0.7825"))
    # TPOP 6 h reads row 12 too (smallest key >= 6); 2.5 m: 0.76 + 0.25*0.03 = 0.7675
    check("green", "Table 4-1, 2.5 m at TPOP 6 h -> 0.7675 (row 12)",
          V.table_wave_alpha(dnv, F(6), F("2.5")) == F("0.7675"))
    # 2.0 m at TPOP 24 h: column 2 exactly, row 24 = [0.63, 0.73, 0.76, 0.78] -> 0.73
    check("green", "Table 4-1, 2.0 m at TPOP 24 h -> 0.73 (a column's own value)",
          V.table_wave_alpha(dnv, F(24), F("2.0")) == F("0.73"))
    # 7.0 m >= the last column 6 -> row 12's last value 0.80
    check("green", "Table 4-1, 7.0 m (>= last column) -> 0.80",
          V.table_wave_alpha(dnv, F(6), F("7.0")) == F("0.80"))
    check("green", "Table 4-1, 0.5 m (< first column) -> n",
          V.table_wave_alpha(dnv, F(0), F("0.5")) is None)
    check("green", "Table 4-1, TPOP 75 h (no row) -> n",
          V.table_wave_alpha(dnv, F(75), F("3.0")) is None)
    # Table 4-6: TPOP 12 -> the smallest key >= 12 is 24 -> first value 0.80
    check("green", "Table 4-6 at TPOP 12 h -> row 24, first value 0.80",
          V.dnv_limits([V.Limit("hs", "<=", F("3.5"), "m"), V.Limit("wind_sustained", "<=", F(50), "kn")],
                       F(12), lambda t, d: V.table_wave_alpha(dnv, t, d), dnv)
          == [V.Limit("hs", "<=", F("2.73875"), "m"), V.Limit("wind_sustained", "<=", F(40), "kn")])
    # site cells: repr(float(...)) then exact, then DOWN to 2 places
    cell = lambda lo: {"verdict": "ESTIMATED", "ci90": [V.Num(lo), V.Num("0.99")]}
    check("green", "site cell 0.58 -> 0.58 (a float floor would give 0.57)",
          V.site_cell(cell("0.58"), "") == F("0.58"))
    check("green", "site cell 0.86999999999999999 -> repr(float) '0.87' -> 0.87",
          V.site_cell(cell("0.86999999999999999"), "") == F("0.87"))
    check("green", "site cell 0.8684 -> 0.86 (rounded DOWN)",
          V.site_cell(cell("0.8684"), "") == F("0.86"))
    check("green", "site cell REFUSED -> EMPTY",
          V.site_cell({"verdict": "REFUSED"}, "") is None)
    # the window
    lead = [F(h) for h in range(0, 169, 6)]
    check("green", "need: TR 45 -> 48, TR 0 -> 0, TR -3 -> 0",
          (V.need_of(F(45)), V.need_of(F(0)), V.need_of(F(-3))) == (48, 0, 0))
    check("green", "window TR 24 at i=24 -> steps 24..28; at i=25 -> '-'",
          V.window(lead, 24, F(24)) == [24, 25, 26, 27, 28] and V.window(lead, 25, F(24)) is None)
    # deciding
    hs_lt2 = [V.Limit("hs", "<", F(2), "m")]
    check("green", "strict '<': unfavourable edge == limit -> I (not LIBERADA)",
          V.decide([{"hs": (F("1.5"), F("2.0"))}], hs_lt2) == "I")
    check("green", "strict '<': favourable edge == limit -> V",
          V.decide([{"hs": (F("2.0"), F("2.5"))}], hs_lt2) == "V")
    check("green", "'<=': unfavourable edge == limit -> L",
          V.decide([{"hs": (F("1.5"), F("2.0"))}], [V.Limit("hs", "<=", F(2), "m")]) == "L")
    # hs offered at step 0 (I there) but not at step 1: hs is MISSING, not DECIDED, so its
    # out-of-limit edge cannot speak -> S
    check("green", "a MISSING limit cannot veto: I-value at one step, absent at another -> S",
          V.decide([{"hs": (F("1.5"), F("2.5"))}, {}], [V.Limit("hs", "<=", F(2), "m")]) == "S")
    check("green", "a window with no step -> R", V.decide([], hs_lt2) == "R")
    check("green", "vessel limits are never decided",
          V.decide([{}], [V.Limit("draft", "<=", None, "m")]) == "L")


# ================================================================ GREEN 2: the synthetic world

LEAD = list(range(0, 169, 6))                                        # 0, 6, ..., 168
T_AXIS = [(datetime(2026, 10, 6) + timedelta(hours=h)).strftime("%Y-%m-%dT%H") for h in LEAD]
CALM = {"hb": ["0.2", "0.4"], "wb": ["5", "10"], "hd": ["0.300", "0.301"],
        "wd": ["10.00", "10.01"], "tp": "9.1", "wdir": 120, "g": "14.0"}   # tp/wdir/g: pictures


def lit(x):
    return f"@LIT:{x}@"


def dumps(obj):
    """JSON whose @LIT:..@ strings become bare number literals, written exactly as given."""
    return re.sub(r'"@LIT:([0-9eE.+-]+)@"', r"\1", json.dumps(obj, indent=1)).encode()


def est(d, T, lo):
    return {"designHs": d, "TPOP": T, "verdict": "ESTIMATED", "ci90": [lit(lo), lit("0.99")]}


def ref(d, T):
    return {"designHs": d, "TPOP": T, "verdict": "REFUSED", "why": "synthetic"}


def mk_steps(every=None, at=None, drop=None):
    out = []
    for k in range(29):
        s = copy.deepcopy(CALM)
        s.update(copy.deepcopy(every or {}))
        s.update(copy.deepcopy((at or {}).get(k, {})))
        for key in (drop or {}).get(k, ()):
            s.pop(key)
        out.append(s)
    return out


def lim(var, op, value, unit):
    return {"var": var, "op": op, "value": value, "unit": unit}


PRESETS = [
    # need 24, T 12; decided i with lead[i] <= 144 -> 25 letters, then 4 '-'
    {"id": "a24", "TR": 24, "limits": [lim("hs", "<=", "3.5", "m"), lim("wind_sustained", "<=", "50", "kn")]},
    # TR 45 rounds UP to need 48, T 24; lead[i] <= 120 -> 21 letters, then 8 '-'
    {"id": "b45", "TR": 45, "limits": [lim("hs", "<=", "2.0", "m")]},
    # TR 0: one step, all 29 decided; design 0.5 < first column 1 -> table/site n
    {"id": "c0", "TR": 0, "limits": [lim("hs", "<", "0.5", "m")]},
    # need 6; lead[i] <= 162 -> 28 letters, 1 '-'; an hs limit with '>=' -> table/site n
    {"id": "d6", "TR": 6, "limits": [lim("hs", "<=", "3.0", "m"), lim("hs", ">=", "0.1", "m")]},
    # need 150, T 75 > 72 -> no row -> table/site n; lead[i] <= 18 -> 4 letters, 25 '-'
    {"id": "e150", "TR": 150, "limits": [lim("hs", "<=", "3.0", "m"), lim("wind_sustained", "<=", "20", "kn")]},
    # need 12, T 6 -> row 12; design 7.0 >= last column 6; lead[i] <= 156 -> 27, 2 '-'
    {"id": "f12", "TR": 12, "limits": [lim("hs", "<=", "7.0", "m")]},
]
DECIDED = {"a24": 25, "b45": 21, "c0": 29, "d6": 28, "e150": 4, "f12": 27}

RULES = [
    {"id": "t-strict", "site": "term", "hsAt": "approach",
     "limits": [lim("hs", "<", "2.0", "m"), lim("wind_sustained", "<", "30", "kn")]},
    {"id": "t-berth", "site": "term", "hsAt": "berth",
     "limits": [lim("hs", "<=", "1.5", "m"), lim("wind_sustained", "<=", "16", "kn"), lim("draft", "<=", "13", "m")]},
    {"id": "t-le", "site": "term", "hsAt": "approach", "limits": [lim("hs", "<=", "2.0", "m")]},
    {"id": "t-vis", "site": "term", "hsAt": "approach",
     "limits": [lim("hs", "<=", "2.2", "m"), lim("visibility", ">", "1.0", "NM")]},
]

# ---- the site alpha records (cells deliberately out of order: columns must be sorted)
# fieldA, as read by SPEC:
#   row 12: col 2 = repr(float(0.86999999999999999)) = '0.87' -> 0.87; col 4 = 0.58 -> 0.58;
#           col 6 = 0.95.   a24 (3.5 m, T 12): 0.87 + 0.75 * (0.58 - 0.87) = 0.6525
#           -> hs limit 3.5 * 0.6525 = 2.28375; f12 (7.0 m >= 6): 0.95 -> 7.0 * 0.95 = 6.65
#   row 24: col 2 = 0.90 -> b45 (2.0 m, T 24): 2.0 * 0.90 = 1.8
FIELD_A = [est(6, 12, "0.95"), est(4, 12, "0.58"), est(2, 12, "0.86999999999999999"), est(1, 12, "0.80"),
           ref(6, 24), est(4, 24, "0.85"), est(2, 24, "0.90"), est(1, 24, "0.70")] + \
          [c for T in (36, 48, 72) for c in (est(1, T, "0.70"), est(2, T, "0.75"), est(4, T, "0.80"), ref(6, T))]
# fieldB: row 12 col 4 EMPTY -> a24 (interpolation 2..4) -> n; row 24: cols 1 and 4 EMPTY but
#   b45 reads column 2 exactly (0.75 -> limit 1.5) -> decided; col 6 EMPTY -> f12 n
FIELD_B = [est(1, 12, "0.80"), est(2, 12, "0.80"), ref(4, 12), ref(6, 12),
           ref(1, 24), est(2, 24, "0.75"), ref(4, 24), ref(6, 24)] + \
          [c for T in (36, 48, 72) for c in (est(1, T, "0.70"), est(2, T, "0.75"), est(4, T, "0.80"), ref(6, T))]
# term: a full record, but a terminal site has no alpha source -> site n everywhere
TERM = [est(d, T, "0.90") for d in (1, 2, 4, 6) for T in (12, 24, 36, 48, 72)]
# fieldR, in the REGION record: row 12: 0.70 + 0.75 * (0.80 - 0.70) = 0.775 -> 3.5 * 0.775 =
#   2.7125; row 24 col 2 = 0.66 -> 1.32; col 6 EMPTY -> f12 n
FIELD_R = [est(1, 12, "0.60"), est(2, 12, "0.70"), est(4, 12, "0.80"), ref(6, 12),
           est(1, 24, "0.60"), est(2, 24, "0.66"), est(4, 24, "0.70"), ref(6, 24)] + \
          [c for T in (36, 48, 72) for c in (est(1, T, "0.60"), est(2, T, "0.65"), est(4, T, "0.70"), ref(6, T))]

UNITS_FROM_A = ["u-rough", "u-mid", "u-tight", "u-over", "u-tab-eq", "u-tab-over",
                "u-wind-eq", "u-wind-over", "u-gap", "u-big"]

# term's steps: CALM except
#   3: hb [1.5, 2.0]   5: hb [2.0, 2.5]   7: no hb   9: wb [12, 20]   11: wb [17, 20]
#   13: no wb          15: no hb and wb [35, 40]
TERM_STEPS = mk_steps(at={3: {"hb": ["1.5", "2.0"]}, 5: {"hb": ["2.0", "2.5"]},
                          9: {"wb": ["12", "20"]}, 11: {"wb": ["17", "20"]}, 15: {"wb": ["35", "40"]}},
                      drop={7: ["hb"], 13: ["wb"], 15: ["hb"]})

PLACES = {
    "fieldA": mk_steps(),
    "fieldB": mk_steps(),
    "fieldC": mk_steps(),
    "fieldR": mk_steps(every={"hd": ["2.7125", "2.7126"]}),
    "term": TERM_STEPS,
    "u-null": mk_steps(),
    "u-c": mk_steps(),
    "u-rough": mk_steps(every={"hb": ["3.6", "4.0"], "wb": ["55", "60"], "hd": ["3.600", "3.601"], "wd": ["55.00", "55.01"]}),
    "u-mid": mk_steps(every={"hb": ["3.0", "4.0"], "wb": ["10", "20"]}),
    "u-tight": mk_steps(every={"hd": ["2.28374", "2.28375"]}),
    "u-over": mk_steps(every={"hd": ["2.28375", "2.28376"]}),
    "u-tab-eq": mk_steps(every={"hd": ["2.73874", "2.73875"]}),
    "u-tab-over": mk_steps(every={"hd": ["2.73875", "2.73876"]}),
    "u-wind-eq": mk_steps(every={"wd": ["39.99", "40.00"]}),
    "u-wind-over": mk_steps(every={"wd": ["40.00", "40.01"]}),
    # u-gap: no hb at step 10, no wd at step 15, hd [3.000, 3.001] at step 20
    "u-gap": mk_steps(at={20: {"hd": ["3.000", "3.001"]}}, drop={10: ["hb"], 15: ["wd"]}),
    "u-big": mk_steps(every={"hd": ["5.600", "5.601"]}),
}


def runs(*pairs):
    """runs('L', 3, 'S', 5, ...) -> 'LLLSSSSS...' (must be 29 long)."""
    s = "".join(ch * n for ch, n in zip(pairs[::2], pairs[1::2]))
    assert len(s) == 29, (pairs, len(s))
    return s


def at(default, marks):
    return "".join(marks.get(i, default) for i in range(29))


def U(letter, p):
    """One letter over every decided start, '-' after."""
    return letter * DECIDED[p] + "-" * (29 - DECIDED[p])


def row(p, band, table, site):
    return "".join(x if len(x) == 29 else U(x, p) for x in (band, table, site))


def calm(site_a24, site_b45, site_f12):
    """A CALM place: hb [0.2,0.4] wb [5,10] hd [0.300,0.301] wd [10.00,10.01] -- inside
    every limit (a24 band 3.5/50, table 2.73875/40; b45 2.0 and 1.46; c0 0.4 < 0.5; d6 0.1..3;
    e150 3.0/20; f12 7.0 and 5.6). Only the site letter depends on the alpha source."""
    return {"a24": row("a24", "L", "L", site_a24), "b45": row("b45", "L", "L", site_b45),
            "c0": row("c0", "L", "n", "n"), "d6": row("d6", "L", "n", "n"),
            "e150": row("e150", "L", "n", "n"), "f12": row("f12", "L", "L", site_f12)}


def three(a24, b45, f12):
    """A place whose c0/d6/e150 band is L and whose table/site there are n."""
    return {"a24": row("a24", *a24), "b45": row("b45", *b45), "c0": row("c0", "L", "n", "n"),
            "d6": row("d6", "L", "n", "n"), "e150": row("e150", "L", "n", "n"), "f12": row("f12", *f12)}


EXPECT = {
    # site source fieldA (2.28375 / 1.8 / 6.65): all L
    "fieldA": calm("L", "L", "L"),
    # fieldB: a24 -> col 4 EMPTY -> n; b45 -> exact column 2 -> L; f12 -> col 6 EMPTY -> n
    "fieldB": calm("n", "L", "n"),
    # no alpha record / bandFrom null / bandFrom without record -> site n
    "fieldC": calm("n", "n", "n"),
    "u-null": calm("n", "n", "n"),
    "u-c": calm("n", "n", "n"),
    # fieldR hd [2.7125, 2.7126]: a24 table 2.7126 <= 2.73875 L; site (region alpha, limit
    # 2.7125): lo == limit holds, hi fails -> I. b45: 2.7125 > 1.46 and > 1.32 -> V V.
    # f12: table 2.7126 <= 5.6 L; site col 6 EMPTY -> n
    "fieldR": three(("L", "L", "I"), ("L", "V", "V"), ("L", "L", "n")),
    # u-rough hb [3.6,4.0] wb [55,60] hd [3.600,3.601] wd [55.00,55.01]: favourable edges
    # fail everywhere (3.6 > 3.5, 2.73875, 2.28375, 2.0, 1.46, 1.8, 0.5, 3.0; 55 > 50, 20)
    # -> V; f12: 4.0 <= 7, 3.601 <= 5.6, <= 6.65 -> L L L
    "u-rough": {"a24": row("a24", "V", "V", "V"), "b45": row("b45", "V", "V", "V"),
                "c0": row("c0", "V", "n", "n"), "d6": row("d6", "V", "n", "n"),
                "e150": row("e150", "V", "n", "n"), "f12": row("f12", "L", "L", "L")},
    # u-mid hb [3.0,4.0] wb [10,20]: a24 band 3.0 <= 3.5 but 4.0 > 3.5 -> I; b45 3.0 > 2 -> V;
    # c0 -> V; d6 (<= 3.0): lo 3.0 holds, hi 4.0 fails -> I; e150 hs I, wind 20 <= 20 -> I
    "u-mid": {"a24": row("a24", "I", "L", "L"), "b45": row("b45", "V", "L", "L"),
              "c0": row("c0", "V", "n", "n"), "d6": row("d6", "I", "n", "n"),
              "e150": row("e150", "I", "n", "n"), "f12": row("f12", "L", "L", "L")},
    # site limit a24 = 2.28375 (fieldA): hi == limit -> L; lo == limit, hi above -> I
    "u-tight": three(("L", "L", "L"), ("L", "V", "V"), ("L", "L", "L")),
    "u-over": three(("L", "L", "I"), ("L", "V", "V"), ("L", "L", "L")),
    # table limit a24 = 2.73875: hi == limit -> L; lo == limit, hi above -> I; site V
    "u-tab-eq": three(("L", "L", "V"), ("L", "V", "V"), ("L", "L", "L")),
    "u-tab-over": three(("L", "I", "V"), ("L", "V", "V"), ("L", "L", "L")),
    # wind limit a24 (table and site alike) = 50 * 0.80 = 40
    "u-wind-eq": three(("L", "L", "L"), ("L", "L", "L"), ("L", "L", "L")),
    "u-wind-over": three(("L", "I", "I"), ("L", "L", "L"), ("L", "L", "L")),
    # u-big hd [5.600,5.601]: f12 table limit 7.0 * 0.80 = 5.6: lo == limit, hi above -> I;
    # site 6.65 -> L; a24/b45: 5.6 above every limit -> V
    "u-big": three(("L", "V", "V"), ("L", "V", "V"), ("L", "I", "L")),
    # u-gap (source fieldA): hb absent at 10, wd absent at 15, hd [3.000,3.001] at 20
    "u-gap": {
        # a24, windows i..i+4: band S where the window holds 10 (i 6..10);
        # table/site: V where it holds 20 (i 16..20: 3.000 > 2.73875 and > 2.28375),
        # else S where it holds 15 (i 11..15: wind MISSING), else L
        "a24": runs("L", 6, "S", 5, "L", 14, "-", 4)
               + runs("L", 11, "S", 5, "V", 5, "L", 4, "-", 4)
               + runs("L", 11, "S", 5, "V", 5, "L", 4, "-", 4),
        # b45, windows i..i+8, no wind limit: band S for i 2..10; table/site V for i 12..20
        "b45": runs("L", 2, "S", 9, "L", 10, "-", 8)
               + runs("L", 12, "V", 9, "-", 8) + runs("L", 12, "V", 9, "-", 8),
        "c0": at("L", {10: "S"}) + "n" * 29 + "n" * 29,
        # d6, windows i, i+1: S for i 9, 10
        "d6": runs("L", 9, "S", 2, "L", 17, "-", 1) + U("n", "d6") + U("n", "d6"),
        # e150, i 0..3: every window holds step 10 -> hs MISSING -> S
        "e150": U("S", "e150") + U("n", "e150") + U("n", "e150"),
        # f12, windows i..i+2: band S for i 8..10; 3.001 <= 5.6 and <= 6.65 -> L
        "f12": runs("L", 8, "S", 3, "L", 16, "-", 2) + U("L", "f12") + U("L", "f12"),
    },
    # term (terminal: site n). hs absent at 7 and 15, wind absent at 13; nothing else breaks
    # a24 (3.5/50) or a24's table (hd/wd CALM at every step).
    "term": {
        # a24: S where the window i..i+4 holds 7 (i 3..7), 13 (9..13) or 15 (11..15)
        "a24": runs("L", 3, "S", 5, "L", 1, "S", 7, "L", 9, "-", 4) + U("L", "a24") + U("n", "a24"),
        # b45 (hs <= 2.0), windows i..i+8: i 0..5 also hold step 5 (hb [2.0,2.5]: hi > 2.0)
        # but hold step 7 too, where hs is absent: hs is MISSING there, not DECIDED, so step
        # 5 cannot make it I -> S. i 0..15 hold 7 or 15 -> S; i 16..20 -> L
        "b45": runs("S", 16, "L", 5, "-", 8) + U("L", "b45") + U("n", "b45"),
        # c0 (hs < 0.5) per step: 3, 5 -> lo 1.5 / 2.0 not < 0.5 -> V; 7, 15 -> S
        "c0": at("L", {3: "V", 5: "V", 7: "S", 15: "S"}) + "n" * 29 + "n" * 29,
        # d6, windows i, i+1: S for i 6, 7, 14, 15
        "d6": runs("L", 6, "S", 2, "L", 6, "S", 2, "L", 12, "-", 1) + U("n", "d6") + U("n", "d6"),
        # e150 (hs <= 3, wind <= 20): every window holds 7, 13 and 15; step 15's wind 35 > 20
        # would veto, but wind is absent at 13, so wind is MISSING -> S, not V
        "e150": U("S", "e150") + U("n", "e150") + U("n", "e150"),
        # f12, windows i..i+2: S for i 5..7 and 13..15
        "f12": runs("L", 5, "S", 3, "L", 5, "S", 3, "L", 11, "-", 2) + U("L", "f12") + U("n", "f12"),
        # the terminal rules, TR 0, one step each:
        # t-strict (hs < 2.0, wind < 30): 3 hb hi 2.0 not < 2.0 -> I; 5 lo 2.0 -> V;
        #   7, 13 -> S; 15 wind lo 35 >= 30 -> V (a DECIDED limit vetoes while hs is MISSING)
        "t-strict": at("L", {3: "I", 5: "V", 7: "S", 13: "S", 15: "V"}),
        # t-berth (hsAt berth: hs never offered; wind <= 16; draft ignored): S where the wind
        #   clears; 9 wb [12,20] -> I; 11 [17,20] -> V; 15 [35,40] -> V. Step 5's hb [2.0,2.5]
        #   would veto hs <= 1.5 if hs were offered: it is not, so S.
        "t-berth": at("S", {9: "I", 11: "V", 15: "V"}),
        # t-le (hs <= 2.0): 3 hi 2.0 <= 2.0 -> L; 5 -> I; 7, 15 -> S
        "t-le": at("L", {5: "I", 7: "S", 15: "S"}),
        # t-vis (hs <= 2.2, visibility never offered -> MISSING): 5 hi 2.5 > 2.2 -> I; else S
        "t-vis": at("S", {5: "I"}),
    },
}


def build_world():
    """The green world: {repoPath: bytes} and the day dict, pinned."""
    files = {
        "apps/janela/scenario/operations.json": dumps({"operations": RULES}),
        DNV: open(os.path.join(ROOT, DNV), "rb").read(),       # the real Table 4-1 / 4-6
        "apps/janela/scenario/sites.json": dumps({"sites": [
            {"id": "fieldA", "kind": "field"}, {"id": "fieldB", "kind": "field"},
            {"id": "fieldC", "kind": "field"}, {"id": "fieldR", "kind": "coast"},
            {"id": "term", "kind": "terminal"}]}),
        "apps/janela/scenario/platforms.json": dumps({"units": [
            {"id": "u-null", "bandFrom": None}, {"id": "u-c", "bandFrom": "fieldC"}]
            + [{"id": u, "bandFrom": "fieldA"} for u in UNITS_FROM_A]}),
        # region "ghost" names an alpha file that does not exist: skipped, never required
        "apps/janela/scenario/regions.json": dumps({"regions": {
            "r": {"sites": ["fieldR"], "alpha": "certs/janela-alpha-r.json"},
            "ghost": {"sites": [], "alpha": "certs/janela-alpha-ghost.json"}}}),
        "certs/janela-alpha.json": dumps({"sites": {
            "fieldA": {"cells": FIELD_A}, "fieldB": {"cells": FIELD_B}, "term": {"cells": TERM}}}),
        "certs/janela-alpha-r.json": dumps({"sites": {"fieldR": {"cells": FIELD_R}}}),
    }
    units = {u: "fieldA" for u in UNITS_FROM_A}
    units.update({"u-null": None, "u-c": "fieldC"})
    day = {
        "v": 1, "run": "2026-10-06T00", "t": T_AXIS, "lead": LEAD, "presets": PRESETS,
        "places": {p: {"node": [-25.5, -43.0], "bandFrom": units.get(p), "steps": s}
                   for p, s in PLACES.items()},
        "dec": EXPECT,
    }
    day["decisions"] = sum(len(c) for d in EXPECT.values() for c in d.values())
    pin(files, day)
    return files, day


def pin(files, day):
    day["inputs"] = {p: hashlib.sha256(b).hexdigest() for p, b in files.items()}
    day["inputs"]["corpus/unrelated.bin"] = "0" * 64     # a pin the verifier never reads


def run_world(files, day, tmp, cli=False):
    root = tempfile.mkdtemp(dir=tmp)
    for p, b in files.items():
        os.makedirs(os.path.dirname(os.path.join(root, p)), exist_ok=True)
        with open(os.path.join(root, p), "wb") as f:
            f.write(b)
    day_path = os.path.join(root, "today.json")
    with open(day_path, "w") as f:
        json.dump(day, f)
    if cli:
        p = subprocess.run([sys.executable, os.path.join(HERE, "verify_day.py"), day_path,
                            "--root", root, "--json"], capture_output=True, text=True)
        return p.returncode, json.loads(p.stdout)
    return V.verify(day_path, root)


def world_checks(tmp):
    files, day = build_world()
    letters = "".join(c for d in EXPECT.values() for c in d.values())
    check("green", "the hand-computed expectations hold every letter L V I S - n",
          set("LVIS-n") <= set(letters), sorted(set(letters)))
    r = run_world(files, day, tmp)
    check("green", f"synthetic world: {day['decisions']} letters, all re-decided equal",
          r["ok"] and r["decisions"] == day["decisions"] == r["equal"] == 8990 and not r["differences"],
          json.dumps({k: r[k] for k in ("ok", "decisions", "equal", "refused")})
          + " " + json.dumps(r["differences"][:5]))
    want_pins = set(files)                                  # 7 records; the ghost never read
    check("green", "synthetic world: the 7 records read are exactly the 7 pinned, all ok",
          set(r["pins"]) == want_pins and all(s == "ok" for s in r["pins"].values()), r["pins"])
    code, rj = run_world(files, day, tmp, cli=True)
    check("green", "CLI on the synthetic world: exit 0, --json ok", code == 0 and rj["ok"], code)
    return files, day


# ================================================================ RED controls

def red_controls(files, day, tmp):
    def mutated(fn):
        f, d = copy.deepcopy(files), copy.deepcopy(day)
        fn(f, d)
        return run_world(f, d, tmp)

    def flip(f, d):
        d["dec"]["fieldA"]["a24"] = "V" + d["dec"]["fieldA"]["a24"][1:]
    r = mutated(flip)
    check("red", "one published letter flipped -> exactly that difference",
          not r["ok"] and r["differences"] == [{"what": "letter", "place": "fieldA", "op": "a24",
                                                 "criterion": "band", "index": 0,
                                                 "published": "V", "redecided": "L"}],
          r["differences"][:3])

    def flip_rule(f, d):
        s = d["dec"]["term"]["t-berth"]
        d["dec"]["term"]["t-berth"] = s[:9] + "L" + s[10:]      # I -> L at step 9
    r = mutated(flip_rule)
    check("red", "a terminal rule's letter flipped -> fails",
          not r["ok"] and len(r["differences"]) == 1 and r["differences"][0]["index"] == 9,
          r["differences"][:3])

    def flip_site(f, d):
        s = d["dec"]["fieldR"]["a24"]
        d["dec"]["fieldR"]["a24"] = s[:58] + "L" + s[59:]        # region-alpha I -> L
    r = mutated(flip_site)
    check("red", "a region-alpha site letter flipped -> fails",
          not r["ok"] and r["differences"][0]["criterion"] == "site", r["differences"][:3])

    def touch(f, d):
        f["apps/janela/scenario/sites.json"] += b"\n"             # bytes differ, pin kept
    r = mutated(touch)
    check("red", "a record whose bytes differ from its pin -> REFUSED",
          not r["ok"] and r["refused"] and r["pins"]["apps/janela/scenario/sites.json"].startswith("differs"),
          r["refused"])

    def unpin(f, d):
        del d["inputs"]["certs/janela-alpha-r.json"]
    r = mutated(unpin)
    check("red", "a region alpha record read but not pinned -> REFUSED",
          not r["ok"] and r["refused"] and r["pins"].get("certs/janela-alpha-r.json") == "not pinned",
          r["refused"])

    def drop_place(f, d):
        del d["dec"]["u-null"]
    r = mutated(drop_place)
    check("red", "a place missing from dec -> fails",
          not r["ok"] and {"what": "missing place", "place": "u-null"} in r["differences"],
          r["differences"][:3])

    def off_by_one(f, d):
        d["decisions"] += 1
    r = mutated(off_by_one)
    check("red", "the total `decisions` off by one -> fails (a count difference only)",
          not r["ok"] and [x["what"] for x in r["differences"]] == ["count"], r["differences"][:3])

    def extra_op(f, d):
        d["dec"]["fieldA"]["zzz"] = "L" * 29
    r = mutated(extra_op)
    check("red", "an extra operation in dec -> fails",
          not r["ok"] and any(x["what"] == "extra operation" for x in r["differences"]),
          r["differences"][:3])

    def twice(f, d):
        rec = json.loads(f["certs/janela-alpha-r.json"])
        rec["sites"]["fieldA"] = {"cells": []}
        f["certs/janela-alpha-r.json"] = json.dumps(rec).encode()
        pin(f, d)
    r = mutated(twice)
    check("red", "a site in two alpha records -> REFUSED",
          not r["ok"] and r["refused"] and "two alpha records" in r["refused"], r["refused"])

    def feet(f, d):
        d["presets"][0]["limits"][0]["unit"] = "ft"
    r = mutated(feet)
    check("red", "an hs limit in ft -> REFUSED", not r["ok"] and r["refused"] and "ft" in r["refused"],
          r["refused"])

    def swell(f, d):
        d["presets"][1]["limits"].append(lim("swell", "<=", "2", "m"))
    r = mutated(swell)
    check("red", "a limit on an unknown variable -> REFUSED",
          not r["ok"] and r["refused"] and "swell" in r["refused"], r["refused"])

    f2, d2 = copy.deepcopy(files), copy.deepcopy(day)
    flip(f2, d2)
    code, _ = run_world(f2, d2, tmp, cli=True)
    check("red", "CLI on a flipped letter: exit 1", code == 1, code)


# ================================================================ REAL day

def real_day(path):
    if not os.path.isfile(path):
        print(f"SKIP  real  no day file at {path} (pass --day PATH/today.json)")
        return None
    t0 = time.time()
    p = subprocess.run([sys.executable, os.path.join(HERE, "verify_day.py"), path, "--json"],
                       capture_output=True, text=True)
    wall = time.time() - t0
    r = json.loads(p.stdout)
    check("green", f"REAL day {os.path.basename(path)}: {r['decisions']} re-decided, {r['equal']} equal, "
                   f"{len(r['differences'])} differences, exit {p.returncode}, {wall:.2f} s",
          p.returncode == 0 and r["ok"] and r["decisions"] == r["equal"] == r["declared"]
          and all(s == "ok" for s in r["pins"].values()),
          (r["refused"], r["differences"][:20]))
    return r, wall


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--day", default=REAL_DAY)
    a = ap.parse_args()
    tmp = tempfile.mkdtemp(prefix="janela-verify-battery-")
    try:
        unit_checks()
        files, day = world_checks(tmp)
        red_controls(files, day, tmp)
        real_day(a.day)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"\nbattery: {RESULTS['green']} green, {RESULTS['red']} red controls failed as they must, "
          f"{RESULTS['fail']} FAILURES")
    return 1 if RESULTS["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
