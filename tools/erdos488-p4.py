#!/usr/bin/env python3
"""decide_p4.py -- an independent exact checker for five facts about the odd
primes below 257.  Standard library only, integer arithmetic only (no floats
anywhere in a decision).  Run with:  python3 -I decide_p4.py [--controls]

Facts
  F1  |O| = 53, O = the odd primes below 257 (from our own sieve)
  F2  totient(Q) = phi, Q = prod O, phi = prod (p-1); totient computed by trial
      division and the general formula prod p^(e-1)(p-1), no squarefree assumption
  F3  128 < Q
  F4  3*Q < 16*phi
  F5  2^4096 * (8*4096+1)^53 < 3^4096

Controls (--controls): planted false variants that must decide False
  C-a F5 with 1000 in place of 4096 (both places)
  C-b F4 with the factor k = floor(3Q/phi), computed: the largest integer k
      with k*phi <= 3Q, hence the largest k for which 3Q < k*phi is false
  C-c F1 with 54

Exit 0 only if every fact is True and (with --controls) every control is False.
"""
import hashlib
import json
import sys

if hasattr(sys, "set_int_max_str_digits"):
    sys.set_int_max_str_digits(0)

DIGIT_LIMIT = 400


def num(n):
    """An exact integer as a decimal string if under 400 digits, else its
    bit length, digit count and the sha256 of its decimal string."""
    s = str(n)
    if len(s) < DIGIT_LIMIT:
        return s
    return {
        "bitLength": n.bit_length(),
        "decimalDigits": len(s),
        "sha256OfDecimal": hashlib.sha256(s.encode("ascii")).hexdigest(),
    }


def sieve(limit):
    """Primes p < limit by the sieve of Eratosthenes."""
    if limit < 3:
        return []
    is_p = bytearray([1]) * limit
    is_p[0] = 0
    is_p[1] = 0
    i = 2
    while i * i < limit:
        if is_p[i]:
            for j in range(i * i, limit, i):
                is_p[j] = 0
        i += 1
    return [k for k in range(limit) if is_p[k]]


def is_prime_naive(n):
    """Trial division by every integer 2..isqrt(n): a second, sieve-free test."""
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True


def factorise(n, trial_primes):
    """Factorise n by trial division over trial_primes (ascending).  Returns
    {p: e}.  Counts multiplicities (no squarefree assumption).  Refuses if a
    cofactor > 1 is left that the trial bound cannot certify as prime."""
    if n < 1:
        raise ValueError("factorise needs n >= 1")
    fac = {}
    m = n
    last = 1
    for p in trial_primes:
        if p * p > m:
            break
        last = p
        while m % p == 0:
            fac[p] = fac.get(p, 0) + 1
            m //= p
    if m > 1:
        # m has no prime factor <= last; it is prime iff (next prime)^2 > m,
        # which holds if we broke out of the loop on p*p > m.
        if not any(p * p > m for p in trial_primes):
            raise RuntimeError("trial list too short to finish factorisation")
        fac[m] = fac.get(m, 0) + 1
    # Re-multiply as a check that the factorisation is exact.
    back = 1
    for p, e in fac.items():
        back *= p ** e
    if back != n:
        raise RuntimeError("factorisation does not multiply back")
    return fac


def totient_general(n, trial_primes):
    """Euler's totient from the factorisation: prod p^(e-1) * (p-1)."""
    t = 1
    for p, e in factorise(n, trial_primes).items():
        t *= p ** (e - 1) * (p - 1)
    return t


def main(argv):
    controls = "--controls" in argv[1:]
    unknown = [a for a in argv[1:] if a != "--controls"]
    if unknown:
        sys.stderr.write("unknown arguments: %r\n" % unknown)
        return 2

    # --- the prime sets -------------------------------------------------
    P = sieve(257)
    # Independent cross-check of the sieve: every n < 257 by naive trial division.
    P_naive = [n for n in range(257) if is_prime_naive(n)]
    sieve_agrees = (P == P_naive)
    O = [p for p in P if p != 2]

    # --- products -------------------------------------------------------
    Q = 1
    phi = 1
    for p in O:
        Q *= p
        phi *= (p - 1)

    # A separate, larger prime list for the trial-division factorisation.
    trial = sieve(2000)
    tot = totient_general(Q, trial)
    fac_Q = factorise(Q, trial)
    max_exp = max(fac_Q.values())

    facts = []

    # F1
    f1 = (len(O) == 53) and sieve_agrees
    facts.append({
        "id": "F1",
        "statement": "|O| = 53, where O = the odd primes below 257 (own sieve, "
                     "cross-checked by naive trial division)",
        "result": f1,
        "numbers": {
            "countP": str(len(P)),
            "countO": str(len(O)),
            "claimedCountO": "53",
            "largestInO": str(O[-1]),
            "sieveAgreesWithTrialDivision": sieve_agrees,
            "O": [str(p) for p in O],
        },
    })

    # F2
    f2 = (tot == phi)
    facts.append({
        "id": "F2",
        "statement": "totient(Q) = phi, Q = prod of O, phi = prod (p-1) over O; "
                     "totient from trial-division factorisation and the general "
                     "formula prod p^(e-1)(p-1)",
        "result": f2,
        "numbers": {
            "Q": num(Q),
            "phi": num(phi),
            "totientQ": num(tot),
            "distinctPrimeFactorsOfQ": str(len(fac_Q)),
            "maxExponentInQ": str(max_exp),
            "QbitLength": str(Q.bit_length()),
        },
    })

    # F3
    f3 = (128 < Q)
    facts.append({
        "id": "F3",
        "statement": "128 < Q",
        "result": f3,
        "numbers": {"lhs": "128", "Q": num(Q)},
    })

    # F4
    lhs4 = 3 * Q
    rhs4 = 16 * phi
    f4 = (lhs4 < rhs4)
    facts.append({
        "id": "F4",
        "statement": "3*Q < 16*phi",
        "result": f4,
        "numbers": {
            "threeQ": num(lhs4),
            "sixteenPhi": num(rhs4),
            "difference_16phi_minus_3Q": num(rhs4 - lhs4),
            "floor_3Q_over_phi": str(lhs4 // phi),
        },
    })

    # F5
    def fact5(n, k):
        a = 2 ** n
        b = (8 * n + 1) ** k
        lhs = a * b
        rhs = 3 ** n
        return lhs < rhs, a, b, lhs, rhs

    f5, a5, b5, lhs5, rhs5 = fact5(4096, 53)
    facts.append({
        "id": "F5",
        "statement": "2^4096 * (8*4096+1)^53 < 3^4096 (exact integers)",
        "result": f5,
        "numbers": {
            "base_8n_plus_1": str(8 * 4096 + 1),
            "two_pow_4096": num(a5),
            "base_pow_53": num(b5),
            "lhs": num(lhs5),
            "rhs_three_pow_4096": num(rhs5),
            "lhsBitLength": str(lhs5.bit_length()),
            "rhsBitLength": str(rhs5.bit_length()),
        },
    })

    all_true = all(f["result"] is True for f in facts)
    out = {"facts": facts, "allTrue": all_true}
    ok = all_true

    if controls:
        ctrls = []

        # C-a
        ca, a_a, b_a, lhs_a, rhs_a = fact5(1000, 53)
        ctrls.append({
            "id": "C-a",
            "statement": "planted: 2^1000 * (8*1000+1)^53 < 3^1000",
            "result": ca,
            "caughtAsFalse": (ca is False),
            "numbers": {
                "base_8n_plus_1": str(8 * 1000 + 1),
                "lhs": num(lhs_a),
                "rhs_three_pow_1000": num(rhs_a),
                "lhsBitLength": str(lhs_a.bit_length()),
                "rhsBitLength": str(rhs_a.bit_length()),
            },
        })

        # C-b: the factor is computed, not guessed.
        k = lhs4 // phi           # largest k with k*phi <= 3Q
        cb = (lhs4 < k * phi)
        ctrls.append({
            "id": "C-b",
            "statement": "planted: 3*Q < %d*phi  (k = floor(3Q/phi) = %d, the "
                         "largest integer factor for which the claim is false; "
                         "k+1 = %d makes it true)" % (k, k, k + 1),
            "result": cb,
            "caughtAsFalse": (cb is False),
            "numbers": {
                "k": str(k),
                "threeQ": num(lhs4),
                "kPhi": num(k * phi),
                "kPlus1Phi": num((k + 1) * phi),
                "kPlus1ClaimHolds": (lhs4 < (k + 1) * phi),
                "factor15ClaimHolds": (lhs4 < 15 * phi),
            },
        })

        # C-c
        cc = (len(O) == 54)
        ctrls.append({
            "id": "C-c",
            "statement": "planted: |O| = 54",
            "result": cc,
            "caughtAsFalse": (cc is False),
            "numbers": {"countO": str(len(O)), "claimedCountO": "54"},
        })

        all_caught = all(c["caughtAsFalse"] for c in ctrls)
        out["controls"] = ctrls
        out["allControlsCaught"] = all_caught
        ok = ok and all_caught

    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
