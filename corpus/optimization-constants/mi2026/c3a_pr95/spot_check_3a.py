#!/usr/bin/env python3
"""60-second spot check for the problem-3a certificate artifacts.

Usage:
    python3 pr95_spot_check_3a.py gh3a_b33_d420_T1392_counts.json

Given a counts artifact (the three certificate integers |U+U|, |U-U|, max(U)
plus the claimed digit strings), this script verifies -- in seconds, with no
recounting -- that the claimed bound FOLLOWS from the claimed integers:

  1. the GHR lemma value 1 + ln(D/S)/ln(2*max(U)+1) is enclosed two-sidedly
     with mpmath interval arithmetic at a precision that represents all three
     integers exactly; endpoints are recovered as exact dyadic rationals, so
     the verdicts are exact rational comparisons;
  2. the claimed 40-digit value is exactly the floor truncation of the
     certified lower endpoint (re-derived in integer arithmetic);
  3. the certified value beats the published record 1.1740744 and stays under
     the proven upper bound 4/3;
  4. a log-free pure-integer cross-check: D^11 > S^11 * (2*max(U)+1)^2, which
     alone proves C_3a > 1 + 2/11 = 1.1818... > record, by one big-integer
     comparison (no transcendental functions involved at all).

Trust boundary, stated plainly: this script does NOT recount U+U / U-U; it
proves the implication "counts => bound". To verify the counts themselves,
run the independent recount (independent_check_3a.py in the same artifact
set): ~1 hour single-core at d=120, multi-day at d=420.

Requires Python 3.9+ and mpmath. Exit 0 iff all checks pass.
"""
import json
import sys
from fractions import Fraction

import mpmath

RECORD_PUBLISHED = Fraction(11740744, 10**7)   # 1.1740744 [G2026]
PROVEN_UB = Fraction(4, 3)


def frac_of_raw(raw):
    sign, man, exp, _ = raw
    if man == 0:
        return Fraction(0)
    v = Fraction(man) * (Fraction(2) ** exp)
    return -v if sign else v


def iv_log_int(n):
    """Interval enclosure of ln(n) for an exact big integer n."""
    return mpmath.iv.log(mpmath.iv.mpf(n))


def floor_digits(f, places):
    scaled = f * 10**places
    q = scaled.numerator // scaled.denominator
    s = str(q).rjust(places + 1, "0")
    return s[:-places] + "." + s[-places:]


def main():
    art = json.load(open(sys.argv[1]))
    D = int(art["diff_count"])
    S = int(art["sum_count"])
    M = int(art["max_u"])
    base = 2 * M + 1

    # precision: enough bits to hold the largest integer exactly, plus slack
    mpmath.iv.dps = max(len(str(x)) for x in (D, S, base)) + 60

    ratio = iv_log_int(D) - iv_log_int(S)
    denom = iv_log_int(base)
    val = mpmath.iv.mpf(1) + ratio / denom
    lo, hi = (frac_of_raw(r) for r in val._mpi_)
    assert lo <= hi

    got40 = floor_digits(lo, 40)
    print("certified C_3a >=", got40, "(40-digit floor of the lower endpoint)")
    claimed = art.get("value_lo_40")
    if claimed is not None:
        assert got40 == claimed, f"claimed {claimed} != derived {got40}"
        print("matches the artifact's claimed 40-digit value: True")
    assert lo > RECORD_PUBLISHED, "does not beat the published record 1.1740744"
    assert hi < PROVEN_UB, "violates the proven upper bound 4/3"
    print("beats published record 1.1740744:  True")
    print("below proven upper bound 4/3:      True")

    # log-free integer cross-check: value > 1 + 2/11 (headline d=420 only;
    # smaller rungs sit below 1+2/11 and the check is then not applicable)
    if lo > Fraction(1) + Fraction(2, 11):
        assert D**11 > S**11 * base**2, "integer power check failed"
        print("integer check D^11 > S^11*(2maxU+1)^2 (=> C_3a > 1+2/11 = 1.1818...): True")
    else:
        print("integer power check skipped (this rung is below 1+2/11; applies to d=420 only)")

    print("OK: bound follows from the certificate integers.")
    print("(To verify the integers themselves, run the independent recount;")
    print(" see the verification section of the submission for runtimes.)")


if __name__ == "__main__":
    main()
