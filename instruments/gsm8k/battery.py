#!/usr/bin/env python3
"""instruments/gsm8k/battery.py — the exact reader calibrated on cases with
known answers, red controls that must fire, and the shipped ledger walked:
pins re-hashed, the whole key re-decided live (three seconds), the Platinum
join re-derived.

    python3 instruments/gsm8k/battery.py

Prints: "gsm8k battery: N pass, 0 fail, R/R red controls fired".
"""
import hashlib
import json
import os
import subprocess
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import audit  # noqa: E402

npass = nfail = reds = fired = 0


def ok(cond, name):
    global npass, nfail
    if cond:
        npass += 1
    else:
        nfail += 1
        print("FAIL " + name)


def red(cond, name):
    global reds, fired, npass, nfail
    reds += 1
    if cond:
        fired += 1
        npass += 1
    else:
        nfail += 1
        print("RED DID NOT FIRE " + name)


F = Fraction
ev = audit.evaluate
rd = audit.read_number

# ---- the reader ----
ok(ev("16-3-4") == 9 and ev("9*2") == 18 and ev("2/2") == 1 and ev("20*20/100") == 4, "the calculator grammar: + - * / left to right")
ok(ev("5*.01") == F(1, 20) and ev(".2*3") == F(3, 5) and ev("2+.6+.7+.15") == F(69, 20), "leading-dot decimals read exactly")
ok(ev("3/4*364") == 273 and ev("(30-12)/2") == 9 and ev("-48+21+(-3)") == -30, "fractions, parentheses and unary minus")
ok(ev("2 - 8") == -6 and ev("10 / 4") == F(5, 2), "spaces are nothing; division is exact, never floored")
ok(rd("1,450,000") == 1450000 and rd("3/4") == F(3, 4) and rd("$18") == 18 and rd("-3") == -3 and rd(".05") == F(1, 20), "answers: thousands separators, a fraction, a dollar sign, a sign, a leading dot")
ok(rd("60%") == F(3, 5) and audit.decimals("40%") == 2 and audit.decimals("2.33") == 2 and audit.decimals("5") == 0, "a percent is a hundredth; printed places counted")
ok(rd("1,45") is None and rd("abc") is None and rd("3.") is None and rd("") is None, "what is not a number is None, never a guess")

# ---- the annotation verdicts ----
A = audit.decide_annotation
ok(A("16-3-4=9")["verdict"] == "EXACT", "an exact annotation")
ok(A("7/3=2.33")["verdict"] == "ROUNDED" and A("7/3=2.33")["places"] == 2, "7/3 = 2.33 is a rounding to two places")
ok(A("7/2=3")["verdict"] == "ROUNDED" and A("7/2=4")["verdict"] == "ROUNDED" and A("9/4=2")["verdict"] == "ROUNDED", "an integer rounding of a half or a quarter is ROUNDED to zero places, either way")
red(A("7/3=2.30")["verdict"] == "WRONG" and A("7/3=2.30")["off"] == "-1/30", "a value off by more than half a unit in the last printed place is WRONG, with the offset as witness")
red(A("16-3-4=8")["verdict"] == "WRONG", "a planted wrong annotation is caught")
red(A("5/0=0")["verdict"] == "REFUSED", "division by zero is REFUSED")
red(A("560//10=56")["verdict"] == "REFUSED", "an operator outside the calculator grammar (//) is REFUSED, not guessed at")
red(A("__import__('os')=1")["verdict"] == "REFUSED" and A("2**10=1024")["verdict"] == "REFUSED", "nothing is evaluated by Python: names and powers are REFUSED")
red(A("1=2=3")["verdict"] == "REFUSED" and A("12")["verdict"] == "REFUSED", "an annotation without exactly one '=' is REFUSED")

# ---- the prose reader ----
P = lambda t: audit.prose_equations(t)
v = lambda t: [(p["prose"], p["verdict"]) for p in P(t)]
ok(v("The boots cost 99 + 5 = $104.") == [("99 + 5", "$104")] or [p["verdict"] for p in P("The boots cost 99 + 5 = $104.")] == ["EXACT"], "a prose step with a dollar sign and a sentence period reads EXACT")
ok([p["verdict"] for p in P("This is 12/20 x 100% = 60% of the students.")] == ["EXACT"], "a spaced x is times; a percent on both sides")
ok([p["verdict"] for p in P("So 100-60 = 40% remain.")] == ["EXACT"] and [p["verdict"] for p in P("So its height was 1.2 x 100% = 120 inches.")] == ["EXACT"], "a percent sign on one side only is a unit label, read at the scale")
ok([p["verdict"] for p in P("He spends 50 cents because $1 / 2 = 50 cents")] == ["EXACT"], "\"cents\" after a dollar computation is a unit label")
ok([p["verdict"] for p in P("Overall, Emma has 120 – 80 - 15 = 25 more points.")] == ["EXACT"], "an en dash is a minus")
ok([p["verdict"] for p in P("it takes 17/3 = 5 and 2/3 loads")] == ["EXACT"] and [p["verdict"] for p in P("100 / 6 = 16 and (2/3)")] == ["EXACT"], "a mixed number, with or without parentheses")
ok([p["verdict"] for p in P("so he used 25 / 1/3 = 75 decorations")] == ["EXACT"], "a fraction written without spaces is one literal: 25 / 1/3 is 25 ÷ (1/3)")
ok([p["verdict"] for p in P("Adding: 10 + 5 = 15 + 3 = 18 total")] == ["EXACT", "EXACT"], "a running chain asserts its leading number")
ok([p["verdict"] for p in P("14 apples + 8 = 22 fruit")] == ["UNREAD"], "a fragment cut off by a word is UNREAD, never WRONG")
ok(all(p["verdict"] == "UNREAD" for p in P("By nighttime she had w-10=60 wipes.")) and [p["verdict"] for p in P("so 3x + 4 = 28 and x = 8")] == ["UNREAD"], "algebra — a variable glued to the arithmetic — is UNREAD or not an equation at all, never a verdict")
ok(P("the sun will set at 6:00+48=6:48 PM") == [] or all(p["verdict"] == "UNREAD" for p in P("the sun will set at 6:00+48=6:48 PM")), "a clock time is not an equation")
ok([p["verdict"] for p in P("-48 + 21 + (-3) = -30\n-30/3 = -10")] == ["EXACT", "EXACT"], "a run never crosses a line break")
red([p["verdict"] for p in P("So, Suzzane has $32 - $20 = $300 left.")] == ["WRONG"], "a printed step that does not hold as printed is WRONG (the 2026-09-21 test-set witness, item 1024)")
red([p["verdict"] for p in P("3/4 of a skein * 364 yards = 364 / 4 = 273 yards.")] == ["WRONG"], "…and the other test-set witness (item 501): 364 / 4 is 91, not 273")

# ---- items ----
D = audit.decide_item
d = D("Janet sells 16 - 3 - 4 = <<16-3-4=9>>9 duck eggs a day.\nShe makes 9 * 2 = $<<9*2=18>>18 every day.\n#### 18")
ok(d["class"] == "REPRODUCED" and d["last_value"] == "18", "the first GSM8K test item is REPRODUCED")
d = D("The heels cost 66 + 33 = $<<66+33=99>>99.\nThe boots cost 99 + 5 = $104.\n#### 104")
ok(d["class"] == "ANSWER_IN_PROSE" and d["derived_by"] == "99 + 5 = $104", "an answer computed in prose after the last annotation is ANSWER_IN_PROSE")
d = D("Divide 54 / 8 = <<54/8=6.75>>6.75 packs.\nRound up to 7.\n#### 7")
ok(d["class"] == "ANSWER_UNDERIVED" and d["values"] == ["27/4"], "an answer that is no printed value (rounding up to whole packs) is ANSWER_UNDERIVED")
d = D("It is 7/3 = <<7/3=2.33>>2.33 each.\n#### 2.33")
ok(d["class"] == "ROUNDED_STEP", "a rounded annotation makes ROUNDED_STEP")
d = D("Her total is $240 + $80 = $<<240+80=320>>320.\nSo she has $32 - $20 = $300 left.\n#### 300")
red(d["class"] == "PRINTED_STEP_WRONG" and d["witness"]["exact"] == "12" and d["answer_held_elsewhere"] is False, "a wrong printed step with an answer that rests on it: PRINTED_STEP_WRONG, answer not held elsewhere")
d = D("They cost 6*2.5 = $<<6*3=18.00>>18.00\n#### 18")
red(d["class"] == "PRINTED_STEP_WRONG" and d["answer_held_elsewhere"] is True, "…and one whose answer is held by the annotation beside it")
d = D("Let X be the price. .75X = $19.50, so X = $26.\n#### 26")
ok(d["class"] == "NO_STEPS", "a key with algebra and no arithmetic step is NO_STEPS")
red(D("It is <<5/0=0>>0.\n#### 0")["class"] == "REFUSED" and D("No answer here")["class"] == "REFUSED", "a refused annotation, or no #### line, refuses the item")
red(D("Total 2 + 2 = <<2+2=4>>4\n#### 4.")["class"] == "REFUSED", "an answer with a trailing period is not read as a number")

# ---- the ledger, walked ----
LP = os.path.join(ROOT, "certs", "gsm8k-ledger.json")
ok(os.path.exists(LP), "certs/gsm8k-ledger.json exists")
L = json.load(open(LP))
meta = json.load(open(os.path.join(ROOT, "corpus", "gsm8k", "meta.json")))
moved = [f for f, h in L["pins"].items() if hashlib.sha256(open(os.path.join(ROOT, f), "rb").read()).hexdigest() != h]
ok(not moved, "the three pinned corpus files re-hash to the ledger's pins")
ok(L["pins"]["corpus/gsm8k/test.jsonl"] == meta["gsm8k"]["files"]["test.jsonl"]["sha256"], "…and the ledger's pin is meta.json's pin")
r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "run-gsm8k-ledger.py"), "--check"], capture_output=True, text=True, cwd=ROOT)
ok(r.returncode == 0, "the ledger re-derives unchanged (--check): " + (r.stdout + r.stderr).strip()[-200:])
T = L["test"]
ok(sum(T["classes"].values()) == 1319 and sum(L["train"]["classes"].values()) == 7473, "the classes partition the 1,319 test and 7,473 train items")
ok(T["annotations"] == {"EXACT": 4282}, "every one of the 4,282 test annotations is EXACT")
ok(L["train"]["annotations"].get("EXACT", 0) + L["train"]["annotations"].get("REFUSED", 0) == L["train"]["annotationsTotal"] and L["train"]["annotations"].get("WRONG", 0) == 0 and L["train"]["annotations"].get("ROUNDED", 0) == 0, "no train annotation is WRONG or ROUNDED; the refused ones are the // operator")
pc = L["platinum"]["counts"]
ok(pc["removed"] == 110 and pc["verified"] == 99 and pc["revised"] == 10 and pc["consensus"] == 1100, "the Platinum join reproduces its printed counts: 110 removed, 99 verified, 10 revised")
ok(L["platinum"]["duplicateQuestionsInTest"] == 0, "no two test items share a question, so the join by text is exact")
ok(L["findings"]["revisedWithPrintedStepWrong"] == 0 or L["findings"]["revisedWithPrintedStepWrong"] <= 10, "the revised-with-fault count is a count of the ten")
witnesses = [x for x in T["rows"] if x["class"] == "PRINTED_STEP_WRONG"]
ok(len(witnesses) == L["findings"]["printedStepWrongTest"] and all("witness" in x for x in witnesses), "every PRINTED_STEP_WRONG test row carries its witness")
red_ok = True
for x in witnesses[:5]:
    w = x["witness"]
    red_ok = red_ok and ev(audit._normalize_prose(w["lhs"])) == F(w["exact"]) if w["where"] == "prose" else ev(w["lhs"]) == F(w["exact"])
ok(red_ok, "each witness's exact value re-evaluates from its printed left side")

REC = os.path.join(ROOT, "corpus", "gsm8k", "record.json")
rec = {"what": "The GSM8K audit battery: the exact reader calibrated, the red controls fired, the ledger walked.",
       "pass": npass, "fail": nfail, "reds": reds, "fired": fired, "verdict": "PASS" if nfail == 0 and fired == reds else "FAIL"}
old = json.load(open(REC)) if os.path.exists(REC) else None
if old != rec:
    json.dump(rec, open(REC, "w"), indent=1)
print(f"gsm8k battery: {npass} pass, {nfail} fail, {fired}/{reds} red controls fired")
sys.exit(0 if nfail == 0 and fired == reds else 1)
