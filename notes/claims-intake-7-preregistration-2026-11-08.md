# Claim #7 through the public form (cert-machine #7): pre-registration, 2026-11-08

Written and committed BEFORE any code of ours computes anything from the claimant's values. The operator's word for
this claim (2026-11-08, in session): "Decide it and post" — the verdict is posted on the issue when the record is
written, without another check-in. Later changes are dated amendments appended at the end, never edits above them.

The form (`.github/ISSUE_TEMPLATE/claim.yml`) promises one of three verdicts in public whichever way it falls:
CERTIFIED with a certificate that re-runs on stock Python without this engine, REFUTED with the falsifying witness
printed, or REFUSED with the reason. Filed 2026-11-08 03:22 UTC by maximusrufus, the strict follow-up to #5.

## The claim, verbatim (the issue body)

"26 circles in the unit square, sum of radii 2.63598308, as the source states it. README: "* **Ours (R1-Qwen3-8B):
2.63598308**", with the solution described as "our best-known solution for circle packing (with zero tolerance) in
`Results/CirclePacking/figs/8B-w_RL@65-Formal.png`" and "the formal one (without tolerance as AlphaEvolve)" (key
"8B-w_RL@65-Formal")". Title: "[claim] 26 circles in the unit square, sum of radii 2.63598308 with zero tolerance
(key 8B…". Witness named: `Results/CirclePacking/data.json` at ThetaEvolve `7c12898`, sha256
`c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8`, entry `8B-w_RL@65-Formal`. Kind: an exhibited object.

## What was looked at before this note (and what was not)

Read: the issue body in full; the pre-registration of #3–#6 (notes/claims-intake-preregistration-2026-11-08.md), whose
pins, exactness rules and circle readings this note reuses. Of the data, the STRUCTURE only: the pinned file is the one
already held for #3/#5 (`corpus/claims-intake/inputs/thetaevolve-7c12898-CirclePacking-data.json`, the sha256 the issue
states); the entry `8B-w_RL@65-Formal` is a list of two blocks — 26 centres [x, y], then 26 radii — unlike the other
entries' 26 triples. Finding that boundary printed ~250 bytes at the entry's start and ~200 bytes around the boundary,
which showed the first centres' and the first radii's leading digits. Nothing was computed from them.

Never read, never fetched, never run: ThetaEvolve's `vis.py`, its `programs/` and every evaluator in that repository;
the figure `8B-w_RL@65-Formal.png`.

## The object and the reading (fixed now)

Circle i is (x_i, y_i) = block 1 row i and r_i = block 2 entry i, i = 0..25, every number the rational its decimal
literal denotes. A shape other than 26 pairs + 26 numbers is REFUSED.

The claim's reading is STRICT ("with zero tolerance", "without tolerance as AlphaEvolve"), as #3's:
- radii: r_i > 0;
- containment in [0,1]²: r_i ≤ x_i ≤ 1 − r_i and r_i ≤ y_i ≤ 1 − r_i (touching a side allowed);
- no overlaps: for every pair, (r_i + r_j)² ≤ (x_i − x_j)² + (y_i − y_j)² (tangency allowed);
- the sum: "2.63598308" printed to 8 decimals read as ROUNDING, |Σr − 2.63598308| ≤ 5·10⁻⁹; the truncation reading
  (2.63598308 ≤ Σr < 2.63598309) is decided and reported beside it and does not decide the verdict.

Verdict: CERTIFIED iff all four hold. REFUTED iff any fails, the failing fact printed exactly (the pair or side and its
exact excess); a REFUTED on an overlap or a side refutes these bytes as a strict packing, not the packing value: the
record then also reports the exact repair (every radius reduced by one δ, rounded up at 10⁻²⁰, so that every constraint
holds exactly) and the repaired sum. REFUSED on a pin or shape failure.

Reported always: Σr exactly (all digits); the tightest pair in squared form; (r_i + r_j) − d_ij enclosed to 10⁻³⁰ for the
worst pair; the tightest side slack; the count of exact tangencies and side touches; the same constraints under #5's
tolerance reading (t = 10⁻⁶) as a fact; and, as information, whether Σr exceeds #3's exact AlphaEvolve sum
2.63586275641369812 (certs/claims-intake-2026-11-08.json).

## Exactness and the two implementations

As for #3–#6: every number read as its decimal literal (a JSON reader that keeps numbers as text); no float decides
anything. Two implementations that share no code: the JavaScript decider already used for #3/#5,
`tools/claims-intake-deciders.js` (BigInt rationals; unchanged), driven by a new writer `tools/record-claims-intake-7.js`
→ `certs/claims-intake-7-2026-11-08.json`; and a new standalone checker `corpus/claims-intake/issue-7/check.py` (Python
standard library, `python3 -I`, refusing on a sha256 mismatch), adapted from `circles/check.py` for this entry's two-block
shape. The #3–#6 files are not edited (their record pins their hashes). CERTIFIED or REFUTED only when both reach it and
every compared field agrees; a disagreement is REFUSED and reported. Every printed upper end is rounded up, every lower
end down.

## Controls (each predicted now; each decided by both implementations)

- P1 the radius of the lower-index circle of the tightest pair (squared form) increased by 10⁻⁶: REFUTED.
- P2 circle 0's centre moved through the left side, x_0 := r_0 − 2·10⁻⁶: REFUTED (strict and at t = 10⁻⁶).
- P3 circle 1's centre placed on circle 0's: REFUTED (an overlap).
- P4 the sum claim moved by one unit in the last printed digit (2.63598309): REFUTED on the sum.
- P5 positive, only if a repair exists: every radius reduced by the repair δ̄: the strict packing holds.
- P6 a malformed entry (the first 25 circles): REFUSED.
- P7 a malformed entry (the radii block dropped): REFUSED (the shape check of this entry's format).

## Predictions

The entry was produced for zero tolerance but its numbers are doubles, so an exact excess of rounding size is
plausible. P(CERTIFIED) ≈ 0.55; P(REFUTED by an overlap or a side excess below 10⁻¹²) ≈ 0.4; P(REFUTED on the sum)
≈ 0.05; P(the sum rounds to 2.63598308) ≈ 0.9; P(truncation holds) ≈ 0.5; P(Σr above #3's exact AlphaEvolve sum) ≈ 0.95.
If our numbers disagree with the printed value, our code is suspected first; a disagreement is reported exactly as found.

## Not decided (said first in the reply)

Nothing about optimality or about the packing problem's value; nothing about how the source found or scored the entry;
the figure; the other entries (already decided or not claimed).
