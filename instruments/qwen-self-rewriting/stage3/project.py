#!/usr/bin/env python3
"""project.py: Stage 3's money rule, written before any pod exists (notes/qwen-self-rewriting-stage3-preregistration-
2026-11-26.md, "The stop rule"). Python standard library only. The pod runner calls it; nothing else decides whether an
arm starts.

  cap        CAP_USD = 20.00 for the whole pod, from its creation to its deletion. PRICE = the hourly price read from
             the RunPod catalog at the create (an env value; there is no default).
  deadline   DEADLINE = POD_START + CAP_USD / PRICE hours - RESERVE_S. At DEADLINE everything stops (the runner's
             watchdog); RESERVE_S (900 s) is kept for the last pull, the seal and the deletion.
  token model before anything is measured (the paper's cut shares, App. E.9; a finished answer at LF_HI tokens):
             A: 490 x (0.336 x 16,384 + 0.664 x LF_HI);  B: 490 x (0.261 x 16,384 + 0.739 x LF_HI);
             C: 490 x (0.336 x 32,768 + 0.664 x LF_HI)   (every answer cut at 16,384 in A assumed to run to 32,768)
  probe      PROBE_S (600 s) after arm A's requests are sent, R0 = generated tokens per second between 120 s and PROBE_S
             (the server's own counter). A continues iff A_START + tokens_A / R0 x MARGIN + 16,384 / TAIL <= DEADLINE;
             otherwise A is stopped there and every arm is REFUSED on resources. With PAIR_AB on (the default), A also
             stops there unless A and then B both fit (B by the token model, RESTART and TAIL): A alone decides no claim.
  B starts   iff now + RESTART + A's generation wall-clock x MARGIN <= DEADLINE (same model size, settings and problems).
  C starts   iff now + RESTART + tokens_C / (R_A x C_DERATE) x MARGIN + 32,768 / TAIL <= DEADLINE, with
             tokens_C = 490 x (s_A x 32,768 + (1 - s_A) x Lf_A) from A's measured cut share s_A and its mean finished
             length Lf_A, and R_A = A's tokens / A's generation wall-clock.
  constants  MARGIN 1.10; TAIL 40 tokens/s (one sequence's speed in a thin batch at the end of an arm); C_DERATE 0.75
             (longer sequences, fewer of them in memory); RESTART = A's measured server start (600 s before it is known).
usage: project.py plan --price P [--start EPOCH]            the table for the pre-registration (R = 1,250 and 2,500)
       project.py deadline --price P --start EPOCH          prints the deadline (epoch seconds)
       project.py probe  --state STATE.json --now EPOCH     prints {"continue": bool, ...}
       project.py decide --arm B|C --state STATE.json --now EPOCH   prints {"start": bool, ...}
MIT"""
import argparse
import json
import sys
import time

import os
CAP_USD = float(os.environ.get('CAP_USD', '20.00'))   # raised by the operator on 28 Nov; the pod's env sets it
RESERVE_S = 900
N = 490
LF_HI = 8000
CUT = {"A": 0.336, "B": 0.261, "C": 0.336}
BUDGET = {"A": 16384, "B": 16384, "C": 32768}
MARGIN = 1.10
TAIL = 40.0
C_DERATE = 0.75
RESTART_DEFAULT = 600.0
PROBE_S = 600
PROBE_FROM_S = 120


def deadline(price, start):
    return start + CAP_USD / price * 3600.0 - RESERVE_S


def tokens_model(arm, lf=LF_HI, cut=None):
    c = CUT[arm] if cut is None else cut
    return N * (c * BUDGET[arm] + (1 - c) * lf)


def plan(price, overhead_s=(25 * 60, 50 * 60)):
    rows = []
    for R in (1250.0, 2500.0):
        for lf, ovh in ((4000, overhead_s[0]), (LF_HI, overhead_s[1])):
            t = {"A": tokens_model("A", lf) / R * MARGIN + BUDGET["A"] / TAIL,
                 "B": RESTART_DEFAULT / 2.5 + tokens_model("B", lf) / R * MARGIN + BUDGET["B"] / TAIL,
                 "C": RESTART_DEFAULT / 2.5 + tokens_model("C", lf) / (R * C_DERATE) * MARGIN + BUDGET["C"] / TAIL}
            avail = CAP_USD / price * 3600.0 - RESERVE_S
            used, fits = ovh, []
            for arm in "ABC":
                if used + t[arm] <= avail:
                    fits.append(arm)
                    used += t[arm]
                else:
                    break
            rows.append({"tokens_per_s": R, "finished_length": lf, "fixed_overhead_min": ovh / 60,
                         "hours": {k: round(v / 3600, 2) for k, v in t.items()},
                         "usd": {k: round(v / 3600 * price, 2) for k, v in t.items()},
                         "fits_in_order": fits, "usd_if_stopped_after_last_fitting_arm": round((used + RESERVE_S) / 3600 * price, 2)})
    return {"price_per_hour": price, "cap_usd": CAP_USD, "hours_available": round(CAP_USD / price, 3), "rows": rows}


def probe(st, now):
    r0 = st["probe_rate"]
    if not r0 or r0 <= 0:
        return {"continue": False, "why": "no generated tokens measured in the probe window"}
    proj = tokens_model("A") / r0 * MARGIN + BUDGET["A"] / TAIL
    end = st["A_start"] + proj
    proj_b = RESTART_DEFAULT + tokens_model("B") / r0 * MARGIN + BUDGET["B"] / TAIL
    proj_c = RESTART_DEFAULT + tokens_model("C") / (r0 * C_DERATE) * MARGIN + BUDGET["C"] / TAIL
    pair = bool(st.get("pair_ab", True))
    fits_a = end <= st["deadline"]
    fits_ab = end + proj_b <= st["deadline"]
    out = {"continue": fits_a and (fits_ab or not pair), "probe_rate": r0, "projected_A_s": round(proj),
           "projected_A_end": round(end), "projected_B_s": round(proj_b), "projected_C_s": round(proj_c),
           "fits_A": fits_a, "fits_A_then_B": fits_ab, "fits_A_B_C": end + proj_b + proj_c <= st["deadline"],
           "pair_ab": pair, "deadline": st["deadline"], "now": now}
    out["why"] = ("A and then B fit under the deadline" if pair else "A fits under the deadline") if out["continue"] else \
        ("A does not fit under the deadline" if not fits_a else "A fits but A then B does not (PAIR_AB: A alone decides no claim)")
    return out


def decide(arm, st, now):
    a = st.get("A_done")
    if not a or not a.get("complete"):
        return {"start": False, "why": "arm A is not complete"}
    restart = st.get("restart_s") or RESTART_DEFAULT
    if arm == "B":
        proj = restart + a["gen_wall_s"] * MARGIN
    elif arm == "C":
        s, lf = a["cut_share"], a["mean_finished_tokens"]
        tok = N * (s * BUDGET["C"] + (1 - s) * lf)
        ra = a["tokens"] / a["gen_wall_s"]
        proj = restart + tok / (ra * C_DERATE) * MARGIN + BUDGET["C"] / TAIL
    else:
        return {"start": False, "why": "unknown arm"}
    end = now + proj
    return {"start": end <= st["deadline"], "arm": arm, "projected_s": round(proj), "projected_end": round(end),
            "deadline": st["deadline"], "now": now,
            "why": ("fits" if end <= st["deadline"] else "does not fit") + " under the deadline"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "deadline", "probe", "decide"])
    ap.add_argument("--price", type=float)
    ap.add_argument("--start", type=float)
    ap.add_argument("--state")
    ap.add_argument("--now", type=float, default=None)
    ap.add_argument("--arm")
    a = ap.parse_args()
    now = a.now if a.now is not None else time.time()
    if a.cmd == "plan":
        print(json.dumps(plan(a.price), indent=1))
    elif a.cmd == "deadline":
        if not a.price or a.price <= 0 or not a.start:
            sys.exit("--price and --start are required")
        print(int(deadline(a.price, a.start)))
    else:
        st = json.load(open(a.state))
        print(json.dumps(probe(st, now) if a.cmd == "probe" else decide(a.arm, st, now)))


if __name__ == "__main__":
    main()
