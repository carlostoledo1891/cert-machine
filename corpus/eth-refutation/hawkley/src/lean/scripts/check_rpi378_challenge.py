#!/usr/bin/env python3
"""RPI-378.3d: re-derive the Comparator challenge from the trusted sources and compare.

Run from `lean/`:
    python3 scripts/check_rpi378_challenge.py           # check (exit 1 on any difference)
    python3 scripts/check_rpi378_challenge.py --write   # regenerate the challenge file

The challenge is three files:
  ComparatorChallenges/AnthropicETHCrossFormalization.lean    header, imports, theorem with sorry
  .../AnthropicETHCrossFormalization/ParityLifts.lean         byte-for-byte slices of
      OAI/Combinatorics/ParityLifts/Machines.lean lines 5-69, SAT.lean lines 5-35,
      SATChoice.lean lines 24-35
  .../AnthropicETHCrossFormalization/MainResults.lean         byte-identical copy of
      Vendor/Anthropic/MainResults.lean (SHA-256 checked)
"""
import hashlib
import sys

CHALLENGE = "ComparatorChallenges/AnthropicETHCrossFormalization.lean"
PARITY = "ComparatorChallenges/AnthropicETHCrossFormalization/ParityLifts.lean"
MRCOPY = "ComparatorChallenges/AnthropicETHCrossFormalization/MainResults.lean"
MAINRESULTS = "Vendor/Anthropic/MainResults.lean"
MAINRESULTS_SHA256 = "47f78a9550d95b37d8718dd1ee16ae824da893a5e17c319f737e6d0a5ed24944"
SRC = "OAI/Combinatorics/ParityLifts/"

# Anthropic's statement is kept as its own module, byte-identical to the original, because Lean
# shares auxiliary proof terms (`_proof_n`) within a module: placing it in one file with the
# ParityLifts definitions would rename those terms and make the challenge differ from the
# solution environment, where `MainResults` is a separate module.

CHALLENGE_TEXT = """/-
RPI-378.3d Comparator challenge (trusted statement).

The definitions come from two trusted modules, each a byte-for-byte copy of pinned sources:

* `ComparatorChallenges.AnthropicETHCrossFormalization.ParityLifts`: slices of
  `OAI/Combinatorics/ParityLifts/Machines.lean` (lines 5-69), `SAT.lean` (lines 5-35) and
  `SATChoice.lean` (lines 24-35) of thinkthoughts/math at
  81ec97cd23d21675cee4ee76768fffba33a61e17 (unchanged from openai/math); imports Mathlib only.
* `ComparatorChallenges.AnthropicETHCrossFormalization.MainResults`: the whole of
  anthropics/formal-math@16a5ce41304fcdaea4e0be7c132e1c361dc26da5 `eth/MainResults.lean`
  (SHA-256 47f78a9550d95b37d8718dd1ee16ae824da893a5e17c319f737e6d0a5ed24944); imports Mathlib only.

`scripts/check_rpi378_challenge.py` re-derives all three files from those sources and fails on any
difference. The single theorem is the RPI-378.3d statement with `sorry`; the solution module
`OAI.Bridges.AnthropicETH.Main` proves it.
-/
import ComparatorChallenges.AnthropicETHCrossFormalization.ParityLifts
import ComparatorChallenges.AnthropicETHCrossFormalization.MainResults

/-- **RPI-378.3d.** OpenAI ParityLifts' `¬ PositiveRateETH` implies Anthropic's
`MainResults.ETHIsFalse`. -/
theorem OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse :
    ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse := by
  sorry
"""

PARITY_HEADER = """/-
RPI-378.3d trusted definitions: byte-for-byte slices of OpenAI ParityLifts at
thinkthoughts/math 81ec97cd23d21675cee4ee76768fffba33a61e17 (see the challenge file).
-/
import Mathlib

namespace OAI

"""


def lines(path, first, last):
    with open(path, encoding="utf-8") as f:
        ls = f.read().splitlines(keepends=True)
    return "".join(ls[first - 1:last])


def expected():
    with open(MAINRESULTS, "rb") as f:
        raw = f.read()
    if hashlib.sha256(raw).hexdigest() != MAINRESULTS_SHA256:
        sys.exit("FAIL: Vendor/Anthropic/MainResults.lean SHA-256 mismatch")
    parity = (PARITY_HEADER
              + lines(SRC + "Machines.lean", 5, 69) + "\n"
              + lines(SRC + "SAT.lean", 5, 35) + "\n"
              + "namespace ParityWL.Complexity\n\n"
              + lines(SRC + "SATChoice.lean", 24, 35)
              + "end ParityWL.Complexity\n\nend OAI\n")
    return {CHALLENGE: CHALLENGE_TEXT, PARITY: parity, MRCOPY: raw.decode("utf-8")}


def main():
    exp = expected()
    if "--write" in sys.argv:
        import os
        for path, text in exp.items():
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)
            print("wrote", path)
        return
    for path, text in exp.items():
        with open(path, encoding="utf-8") as f:
            cur = f.read()
        if cur != text:
            sys.exit(f"FAIL: {path} differs from the trusted sources")
        print("OK", path, "sha256", hashlib.sha256(cur.encode()).hexdigest())


if __name__ == "__main__":
    main()
