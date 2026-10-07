#!/usr/bin/env python3
# verify_day.py -- the SECOND verifier of a Janela day.
#
# CLEAN-ROOM. Written 2026-10-07 from instruments/window/verify/SPEC.md ONLY. Its author
# never opened, read, grepped or diffed any of: instruments/window/decide.js,
# instruments/window/q.js, instruments/window/workability.js, instruments/window/battery.js,
# anything under apps/janela/audit/ or apps/janela/app/, apps/janela/build-today.js,
# apps/janela/numbers.js, apps/janela/page.js, apps/janela/battery.js, nor the git history
# of any of them. What it read: SPEC.md, one day file (today-2026-10-06.json), and the data
# records SPEC.md names (operations, dnv-alpha, sites, platforms, regions, the alpha certs).
# Two programs that share no code must agree on every published letter.
#
# Python 3 standard library only. Every number is a fractions.Fraction parsed from its
# decimal text. No float takes part in a decision; the one float in this file is SPEC's own
# instruction for a site-alpha cell (ci90[0] "written as Python's shortest decimal
# (repr(float))"), whose text is then parsed exactly.
#
#   python3 instruments/window/verify/verify_day.py PATH/today.json [--root REPO] [--json]
#
# Exit 0 only when every input pin holds AND every published letter is re-decided equal.

import argparse
import hashlib
import json
import math
import os
import re
import sys
import time
from collections import namedtuple
from fractions import Fraction

N = 29                                   # SPEC: 29 steps on the shared time axis
CRITERIA = ("band", "table", "site")     # the order of the 3 x 29 letters of a preset

FIXED_RECORDS = (
    "apps/janela/scenario/operations.json",
    "apps/janela/scenario/rules/dnv-alpha.json",
    "apps/janela/scenario/sites.json",
    "apps/janela/scenario/platforms.json",
    "apps/janela/scenario/regions.json",
    "certs/janela-alpha.json",
)
VESSEL = frozenset(("draft", "loa", "beam", "speed", "dwt"))      # never decided: ignored
SEA = frozenset(("hs", "tp", "wind_sustained", "wind_gust", "current", "visibility"))
UNIT = {"hs": "m", "wind_sustained": "kn"}                         # any other unit: refuse
OPS = frozenset(("<", "<=", ">", ">="))

Limit = namedtuple("Limit", "var op value unit")
Op = namedtuple("Op", "id TR limits hsAt terminal site")


class Refusal(Exception):
    """The verifier will not decide: a pin, a record or the day file is not as SPEC says."""


# ---------------------------------------------------------------- exact numbers

class Num(str):
    """A JSON number, kept as the exact text it was written in (never a float)."""


DECIMAL = re.compile(r"-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?")


def load_json(raw, what):
    def no_constant(name):
        raise Refusal(f"{what}: non-finite number {name}")
    try:
        return json.loads(raw, parse_float=Num, parse_int=Num, parse_constant=no_constant)
    except ValueError as e:
        raise Refusal(f"{what}: not JSON ({e})")


def rat(x, what):
    """A decimal string (or a JSON number's own text) -> the exact rational it names."""
    if isinstance(x, str) and DECIMAL.fullmatch(x):
        return Fraction(x)
    raise Refusal(f"{what}: {x!r} is not a decimal")


def interval(x, what):
    """[lo, hi] as two decimal strings -> (lo, hi) exact."""
    if not (isinstance(x, list) and len(x) == 2):
        raise Refusal(f"{what}: {x!r} is not [lo, hi]")
    return rat(x[0], what), rat(x[1], what)


def floor2(x):
    """Round an exact rational DOWN to 2 decimal places."""
    return Fraction(math.floor(x * 100), 100)


# ---------------------------------------------------------------- the records and their pins

def read_pinned(root, path, inputs, pins):
    """Read a record's bytes ONCE, hash those bytes, hold them against the day's pin.
    Returns the bytes (the very bytes that are then parsed), or None if unreadable."""
    try:
        with open(os.path.join(root, path), "rb") as f:
            raw = f.read()
    except OSError:
        pins[path] = "missing file"
        return None
    got = hashlib.sha256(raw).hexdigest()
    want = inputs.get(path)
    if want is None:
        pins[path] = "not pinned"
    elif want != got:
        pins[path] = f"differs (pinned {want}, read {got})"
    else:
        pins[path] = "ok"
    return raw


def load_records(root, inputs, pins):
    """SPEC 'The records read from the repository'. Every record read must be pinned in the
    day's `inputs` and hash to its pin; otherwise REFUSE (after listing every pin)."""
    raw = {p: read_pinned(root, p, inputs, pins) for p in FIXED_RECORDS}
    alpha_paths = ["certs/janela-alpha.json"]
    if pins["apps/janela/scenario/regions.json"] == "ok":
        regions = load_json(raw["apps/janela/scenario/regions.json"], "regions.json")
        regs = regions.get("regions") if isinstance(regions, dict) else None
        if not isinstance(regs, dict):
            raise Refusal("regions.json: no `regions` object")
        for name, reg in regs.items():
            path = reg.get("alpha") if isinstance(reg, dict) else None
            if isinstance(path, str) and os.path.isfile(os.path.join(root, path)):
                if path not in alpha_paths:
                    alpha_paths.append(path)
                    raw[path] = read_pinned(root, path, inputs, pins)
    bad = {p: s for p, s in pins.items() if s != "ok"}
    if bad:
        raise Refusal("input pins do not hold: " + "; ".join(f"{p}: {s}" for p, s in bad.items()))
    rec = {p: load_json(raw[p], p) for p in raw}
    return rec, alpha_paths


def parse_limits(raw, what):
    """A list of printed limits -> Limit tuples. Vessel limits are kept (as printed, never
    decided); sea limits are exact; any other variable, or hs/wind in another unit: refuse."""
    if not isinstance(raw, list):
        raise Refusal(f"{what}: limits is not a list")
    out = []
    for j, l in enumerate(raw):
        w = f"{what} limit {j}"
        if not isinstance(l, dict):
            raise Refusal(f"{w}: not an object")
        var, op, unit = l.get("var"), l.get("op"), l.get("unit")
        if op not in OPS:
            raise Refusal(f"{w}: op {op!r} is not one of < <= > >=")
        if var in VESSEL:
            out.append(Limit(var, op, None, unit))
            continue
        if var not in SEA:
            raise Refusal(f"{w}: variable {var!r} is neither the sea's nor the vessel's")
        if var in UNIT and unit != UNIT[var]:
            raise Refusal(f"{w}: {var} in {unit!r}, SPEC decides it only in {UNIT[var]}")
        out.append(Limit(var, op, rat(l.get("value"), w), unit))
    return out


def dnv_tables(rec):
    """DNV Table 4-1 (waves) and 4-6 (wind), exact, from dnv-alpha.json."""
    d = rec["apps/janela/scenario/rules/dnv-alpha.json"]
    cols = [rat(x, "waveColumns") for x in d["waveColumns"]]
    if any(a >= b for a, b in zip(cols, cols[1:])) or not cols:
        raise Refusal("dnv-alpha.json: waveColumns not strictly ascending")
    wave = {}
    for k, row in d["waveTables"]["4-1"]["rows"].items():
        vals = [rat(x, f"Table 4-1 row {k}") for x in row]
        if len(vals) != len(cols):
            raise Refusal(f"Table 4-1 row {k}: {len(vals)} values for {len(cols)} columns")
        wave[rat(k, "Table 4-1 key")] = vals
    wind = {}
    for k, row in d["windTable"]["4-6"]["rows"].items():
        wind[rat(k, "Table 4-6 key")] = [rat(x, f"Table 4-6 row {k}") for x in row]
    return cols, wave, wind


# ---------------------------------------------------------------- site alpha

def site_cell(cell, what):
    """SPEC: ESTIMATED -> ci90[0] written as Python's shortest decimal (repr(float)), parsed
    exactly and rounded DOWN to 2 decimal places; any other verdict -> EMPTY (None)."""
    if cell.get("verdict") != "ESTIMATED":
        return None
    ci = cell.get("ci90")
    if not (isinstance(ci, list) and len(ci) == 2 and isinstance(ci[0], str)):
        raise Refusal(f"{what}: ESTIMATED cell without a numeric ci90")
    try:
        text = repr(float(ci[0]))
    except (ValueError, OverflowError):
        raise Refusal(f"{what}: ci90[0] {ci[0]!r} is not a number")
    return floor2(rat(text, what))


def site_alpha_tables(rec, alpha_paths):
    """siteId -> (columns ascending, {TPOP: {designHs: alpha or None}}). A site in two
    records is a REFUSAL; so is one cell given twice."""
    tables, where = {}, {}
    for path in alpha_paths:
        sites = rec[path].get("sites") if isinstance(rec[path], dict) else None
        if not isinstance(sites, dict):
            raise Refusal(f"{path}: no `sites` object")
        for sid, s in sites.items():
            if sid in where:
                raise Refusal(f"site {sid!r} appears in two alpha records: {where[sid]} and {path}")
            where[sid] = path
            cells = s.get("cells") if isinstance(s, dict) else None
            if not isinstance(cells, list):
                raise Refusal(f"{path} {sid}: no `cells` list")
            rows, cols = {}, set()
            for c in cells:
                w = f"{path} {sid} cell"
                d, T = rat(c.get("designHs"), w), rat(c.get("TPOP"), w)
                if d in rows.setdefault(T, {}):
                    raise Refusal(f"{w}: designHs {d} TPOP {T} given twice")
                cols.add(d)
                rows[T][d] = site_cell(c, f"{w} ({d} m, {T} h)")
            tables[sid] = (sorted(cols), rows)
    return tables


def alpha_source(place, sites, units, tables):
    """SPEC: a site -> none if terminal, else its own table if it has one; a unit -> its
    bandFrom's table if bandFrom is not null and has one. Neither (or both): SPEC gives no
    rule, so the verifier refuses rather than guess."""
    if place in sites and place in units:
        raise Refusal(f"place {place!r} is both a site and a unit")
    if place in sites:
        if sites[place].get("kind") == "terminal":
            return None
        return tables.get(place)
    if place in units:
        b = units[place].get("bandFrom")
        return None if b is None else tables.get(b)
    raise Refusal(f"place {place!r} is neither in sites.json nor in platforms.json")


# ---------------------------------------------------------------- the window

def need_of(TR):
    """TR rounded UP to the 6 h grid (negative TR counts as 0)."""
    return Fraction(math.ceil(max(Fraction(0), TR) / 6) * 6)


def window(lead, i, need):
    """The step indices k = i, i+1, ... while lead[k] <= lead[i] + need; None when the last
    of them falls short of lead[i] + need (the window runs past the forecast: '-')."""
    end = lead[i] + need
    ks = []
    k = i
    while k < len(lead) and lead[k] <= end:
        ks.append(k)
        k += 1
    if ks and lead[ks[-1]] < end:
        return None
    return ks


# ---------------------------------------------------------------- the alphas

def pick_row(T, keys):
    """The smallest key r with T <= r, or None."""
    fit = [r for r in keys if T <= r]
    return min(fit) if fit else None


def read_columns(cols, vals, design):
    """Read a row at `design`: below the first column -> None ('n'); at or above the last ->
    the last value; at a column's own value -> that value; otherwise exact linear
    interpolation between the two bracketing columns. A value it would use that is EMPTY
    (None) -> None."""
    if design < cols[0]:
        return None
    if design >= cols[-1]:
        return vals[-1]
    for j in range(len(cols) - 1):
        x0, x1 = cols[j], cols[j + 1]
        if x0 <= design < x1:
            if design == x0:
                return vals[j]
            a, b = vals[j], vals[j + 1]
            if a is None or b is None:
                return None
            return a + (design - x0) / (x1 - x0) * (b - a)
    raise AssertionError("unreachable: columns are ascending")


def table_wave_alpha(dnv, T, design):
    cols, wave, _ = dnv
    r = pick_row(T, wave)
    return None if r is None else read_columns(cols, wave[r], design)


def site_wave_alpha(src, T, design):
    if src is None:
        return None
    cols, rows = src
    r = pick_row(T, rows)
    if r is None:
        return None
    return read_columns(cols, [rows[r].get(c) for c in cols], design)


def dnv_limits(limits, T, wave_alpha, dnv):
    """SPEC 'table and site', steps 1-4: the limits to decide against, or None ('n')."""
    hs = [l for l in limits if l.var == "hs"]
    if not hs or any(l.op not in ("<", "<=") for l in hs):
        return None
    alpha = wave_alpha(T, hs[0].value)          # the design Hs is the FIRST hs limit's value
    if alpha is None:
        return None
    wind = None
    if any(l.var == "wind_sustained" for l in limits):
        r = pick_row(T, dnv[2])
        if r is None:
            return None
        wind = dnv[2][r][0]                     # Table 4-6: the row's FIRST value
    out = []
    for l in limits:
        if l.var == "hs":
            out.append(l._replace(value=l.value * alpha))
        elif l.var == "wind_sustained":
            out.append(l._replace(value=l.value * wind))
        else:
            out.append(l)                       # every other limit as printed
    return out


# ---------------------------------------------------------------- deciding a window

def holds(x, op, value):
    if op == "<":
        return x < value
    if op == "<=":
        return x <= value
    if op == ">":
        return x > value
    return x >= value


def edges(op, lo, hi):
    """(unfavourable, favourable) edge: for < and <= the unfavourable edge is hi."""
    return (hi, lo) if op in ("<", "<=") else (lo, hi)


def decide(steps, limits):
    """SPEC 'Deciding a window'. `steps`: one {var: (lo, hi)} per step of the window.
    A sea limit is DECIDED when every step offers its variable, else MISSING; only DECIDED
    limits can veto (V) or leave a window undefined (I)."""
    if not steps:
        return "R"
    sea = [l for l in limits if l.var not in VESSEL]
    decided = [l for l in sea if all(l.var in s for s in steps)]
    if any(not holds(edges(l.op, *s[l.var])[1], l.op, l.value) for s in steps for l in decided):
        return "V"
    if any(not holds(edges(l.op, *s[l.var])[0], l.op, l.value) for s in steps for l in decided):
        return "I"
    if len(decided) < len(sea):
        return "S"
    return "L"


# ---------------------------------------------------------------- the day file

def parse_step(step, what):
    """Keep only the decided keys (hb, wb, hd, wd) as exact intervals; the rest are pictures."""
    if not isinstance(step, dict):
        raise Refusal(f"{what}: not an object")
    return {k: interval(step[k], f"{what} {k}") for k in ("hb", "wb", "hd", "wd") if k in step}


def offered(step, hs_at, hs_key, wind_key):
    """The variables a step offers to a criterion: hs from `hs_key` (absent at a berth),
    wind_sustained from `wind_key`."""
    v = {}
    if hs_key in step and hs_at != "berth":
        v["hs"] = step[hs_key]
    if wind_key in step:
        v["wind_sustained"] = step[wind_key]
    return v


def criterion_letters(op, criterion, steps, lead, src, dnv):
    """The 29 letters of one operation x one criterion at one place."""
    need = need_of(op.TR)
    T = need / 2                                # TPOP, hours
    if criterion == "band":
        limits = op.limits
        offer = [offered(s, op.hsAt, "hb", "wb") for s in steps]
    else:
        if op.terminal:
            limits = None
        elif criterion == "table":
            limits = dnv_limits(op.limits, T, lambda t, d: table_wave_alpha(dnv, t, d), dnv)
        else:
            limits = dnv_limits(op.limits, T, lambda t, d: site_wave_alpha(src, t, d), dnv)
        offer = [offered(s, op.hsAt, "hd", "wd") for s in steps]
    out = []
    for i in range(N):
        ks = window(lead, i, need)
        if ks is None:
            out.append("-")                     # the window runs past the forecast
        elif limits is None:
            out.append("n")                     # the criterion does not apply
        else:
            out.append(decide([offer[k] for k in ks], limits))
    return "".join(out)


def read_day(day):
    """The parts of today.json SPEC uses, checked for shape."""
    for key in ("t", "lead", "presets", "places", "dec", "decisions", "inputs"):
        if key not in day:
            raise Refusal(f"day file: no `{key}`")
    t = day["t"]
    if not (isinstance(t, list) and len(t) == N and all(isinstance(x, str) for x in t)):
        raise Refusal(f"day file: `t` is not {N} ISO hours")
    if any(a >= b for a, b in zip(t, t[1:])):
        raise Refusal("day file: `t` is not strictly increasing")
    if not (isinstance(day["lead"], list) and len(day["lead"]) == N):
        raise Refusal(f"day file: `lead` is not {N} numbers")
    lead = [rat(x, "lead") for x in day["lead"]]
    presets, ids = [], set()
    for p in day["presets"]:
        if p.get("id") in ids:
            raise Refusal(f"preset {p.get('id')!r} given twice")
        ids.add(p.get("id"))
        hs_at = p.get("hsAt", "approach")       # SPEC's presets carry none: the approach
        if hs_at not in ("approach", "berth"):
            raise Refusal(f"preset {p['id']!r}: hsAt {hs_at!r}")
        presets.append(Op(p["id"], rat(p.get("TR"), f"preset {p['id']} TR"),
                          parse_limits(p.get("limits"), f"preset {p['id']}"),
                          hs_at, False, None))
    if not isinstance(day["places"], dict) or not isinstance(day["dec"], dict):
        raise Refusal("day file: `places` or `dec` is not an object")
    if not isinstance(day["inputs"], dict):
        raise Refusal("day file: `inputs` is not an object")
    return lead, presets


def terminal_rules(rec, preset_ids):
    rules = []
    for o in rec["apps/janela/scenario/operations.json"]["operations"]:
        if o.get("hsAt") not in ("approach", "berth"):
            raise Refusal(f"rule {o.get('id')!r}: hsAt {o.get('hsAt')!r}")
        if o["id"] in preset_ids or any(r.id == o["id"] for r in rules):
            raise Refusal(f"rule id {o['id']!r} collides with another operation")
        rules.append(Op(o["id"], Fraction(0), parse_limits(o.get("limits"), f"rule {o['id']}"),
                        o["hsAt"], True, o.get("site")))
    return rules


# ---------------------------------------------------------------- the walk

def walk(day, lead, presets, rules, dnv, sites, units, tables):
    """Re-decide every published letter and compare. Returns (re-decided, equal, diffs)."""
    places, dec = day["places"], day["dec"]
    diffs, redecided, equal = [], 0, 0
    for p in places:
        if p not in dec:
            diffs.append({"what": "missing place", "place": p})
    for p, got in dec.items():
        if p not in places:
            diffs.append({"what": "extra place", "place": p})
            continue
        raw_steps = places[p].get("steps") if isinstance(places[p], dict) else None
        if not (isinstance(raw_steps, list) and len(raw_steps) == N):
            raise Refusal(f"place {p!r}: steps is not {N} objects")
        steps = [parse_step(s, f"{p} step {k}") for k, s in enumerate(raw_steps)]
        src = alpha_source(p, sites, units, tables)
        expected = {}
        for op in presets:
            expected[op.id] = ("".join(criterion_letters(op, c, steps, lead, src, dnv)
                                       for c in CRITERIA), CRITERIA)
        for r in rules:
            if r.site == p:
                expected[r.id] = (criterion_letters(r, "band", steps, lead, src, dnv), ("band",))
        if not isinstance(got, dict):
            diffs.append({"what": "malformed", "place": p})
            got = {}
        for opid, (want, crits) in expected.items():
            redecided += len(want)
            pub = got.get(opid)
            if not isinstance(pub, str):
                diffs.append({"what": "missing operation", "place": p, "op": opid})
                continue
            for j, ch in enumerate(want):
                have = pub[j] if j < len(pub) else None
                if have == ch:
                    equal += 1
                else:
                    diffs.append({"what": "letter", "place": p, "op": opid,
                                  "criterion": crits[j // N], "index": j % N,
                                  "published": have, "redecided": ch})
            if len(pub) > len(want):
                diffs.append({"what": "length", "place": p, "op": opid,
                              "published": len(pub), "redecided": len(want)})
        for opid in got:
            if opid not in expected:
                diffs.append({"what": "extra operation", "place": p, "op": opid})
    declared = day["decisions"]
    published = sum(len(c) for d in dec.values() if isinstance(d, dict)
                    for c in d.values() if isinstance(c, str))
    if not (isinstance(declared, str) and DECIMAL.fullmatch(declared)) \
            or Fraction(declared) != redecided or Fraction(declared) != published:
        diffs.append({"what": "count", "declared": str(declared), "redecided": redecided,
                      "published": published})
    return redecided, equal, diffs


def verify(day_path, root):
    """The whole check, as a report dict (also what --json prints)."""
    t0 = time.time()
    me = hashlib.sha256(open(os.path.abspath(__file__), "rb").read()).hexdigest()
    report = {"ok": False, "decisions": 0, "equal": 0, "declared": None, "differences": [],
              "pins": {}, "refused": None, "verifier_sha256": me, "day": day_path}
    try:
        with open(day_path, "rb") as f:
            day = load_json(f.read(), "day file")
        if not isinstance(day, dict):
            raise Refusal("day file: not an object")
        d = day.get("decisions")
        report["declared"] = int(d) if isinstance(d, str) and d.isdigit() else d
        lead, presets = read_day(day)
        rec, alpha_paths = load_records(root, day["inputs"], report["pins"])
        rules = terminal_rules(rec, {p.id for p in presets})
        dnv = dnv_tables(rec)
        sites = {s["id"]: s for s in rec["apps/janela/scenario/sites.json"]["sites"]}
        units = {u["id"]: u for u in rec["apps/janela/scenario/platforms.json"]["units"]}
        tables = site_alpha_tables(rec, alpha_paths)
        n, eq, diffs = walk(day, lead, presets, rules, dnv, sites, units, tables)
        report.update(decisions=n, equal=eq, differences=diffs, ok=not diffs)
    except Refusal as e:
        report["refused"] = str(e)
    except (KeyError, TypeError, AttributeError) as e:
        report["refused"] = f"malformed input ({type(e).__name__}: {e})"
    report["seconds"] = round(time.time() - t0, 3)
    return report


def human(r):
    lines = [f"Janela day, second verifier (clean-room, SPEC.md): {r['day']}"]
    pins = r["pins"]
    if pins:
        held = sum(1 for s in pins.values() if s == "ok")
        lines.append(f"pins: {held}/{len(pins)} hold")
        for p, s in pins.items():
            if s != "ok":
                lines.append(f"  {p}: {s}")
    if r["refused"]:
        lines.append(f"REFUSED: {r['refused']}")
    else:
        lines.append(f"decisions re-decided: {r['decisions']} (declared {r['declared']})")
        lines.append(f"equal: {r['equal']}")
        lines.append(f"differences: {len(r['differences'])}")
        for d in r["differences"][:20]:
            lines.append("  " + json.dumps(d, ensure_ascii=False))
    lines.append(f"{'OK' if r['ok'] else 'FAIL'}  ({r['seconds']} s, verifier sha256 {r['verifier_sha256'][:16]}...)")
    return "\n".join(lines)


def main(argv=None):
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description="Re-decide every published letter of a Janela day.")
    ap.add_argument("day", help="path of today.json")
    ap.add_argument("--root", default=os.path.normpath(os.path.join(here, "..", "..", "..")),
                    help="repository root (for the records SPEC names)")
    ap.add_argument("--json", action="store_true", help="print the report as JSON")
    a = ap.parse_args(argv)
    r = verify(a.day, a.root)
    print(json.dumps(r, indent=1, ensure_ascii=False) if a.json else human(r))
    return 0 if r["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
