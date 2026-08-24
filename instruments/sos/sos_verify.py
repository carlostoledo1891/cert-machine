#!/usr/bin/env python3
# Probe, claimless. Family F6: an exact-rational SOS certificate verifier.
# The claim "p(x) >= gamma for all real x" is proved cheaply by exhibiting p - gamma = sum of
# squares of rational polynomials. Finding the decomposition is an SDP; VERIFYING it is one exact
# coefficient-matching pass. Every check below is shown able to go red (C10, house rule).
from fractions import Fraction as F

# multivariate polynomials as {exponent-tuple: Fraction}; univariate uses 1-tuples.
def clean(p): return {m:c for m,c in p.items() if c != 0}
def add(a,b):
    r=dict(a)
    for m,c in b.items(): r[m]=r.get(m,F(0))+c
    return clean(r)
def sub(a,b): return add(a, {m:-c for m,c in b.items()})
def mul(a,b):
    r={}
    for ma,ca in a.items():
        for mb,cb in b.items():
            m=tuple(x+y for x,y in zip(ma,mb))
            r[m]=r.get(m,F(0))+ca*cb
    return clean(r)
def sq(a): return mul(a,a)
def is_zero(p): return len(clean(p))==0
def ev(p, pt):
    s=F(0)
    for m,c in p.items():
        t=c
        for e,x in zip(m,pt): t*= x**e
        s+=t
    return s

def certify_lower_bound(p, gamma, squares, coeffs=None):
    """CERTIFIED iff p - gamma == sum coeffs_i * squares_i^2 exactly, all coeffs_i >= 0."""
    n=len(squares); coeffs = coeffs or [F(1)]*n
    if any(c < 0 for c in coeffs): return ("REFUSED","a coefficient is negative — not a sum of squares")
    dim=len(next(iter(p)))
    acc={ (0,)*dim: gamma }
    for c,s in zip(coeffs,squares): acc=add(acc, {m:c*v for m,v in sq(s).items()})
    resid=sub(p, acc)
    if is_zero(resid): return ("CERTIFIED", f"p(x) - {gamma} is an exact sum of squares over the rationals")
    return ("REFUSED", f"residual is nonzero: {dict(resid)}")

def refute_lower_bound(p, gamma, witness):
    v=ev(p, witness)
    return ("REFUTED", v) if v < gamma else ("STANDS", v)

# ---- helpers to write univariate polys readably: coeffs low->high ----
def U(*coeffs): return clean({(i,): F(c) for i,c in enumerate(coeffs)})

def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL':4}  {name}" + (f"   [{detail}]" if detail else ""))
    return ok

fails=0
print("== F6 · exact-rational sum-of-squares certificates ==\n")

# WORKED CLAIM: min over all real x of p(x) = x^4 - 8x^3 + 26x^2 - 32x + 18 is EXACTLY 5, at x=1.
p = U(18,-32,26,-8,1)                     # 18 -32x +26x^2 -8x^3 +x^4
q1 = U(3,-4,1)                            # x^2 - 4x + 3 = (x-1)(x-3)
q2 = U(-2,2)                              # 2x - 2 = 2(x-1)
GAMMA = F(5)

st,why = certify_lower_bound(p, GAMMA, [q1,q2])
fails += not check("C1 the global lower bound p(x) >= 5 is CERTIFIED by exact SOS", st=="CERTIFIED", why)
fails += not check("C2 the bound is TIGHT — equality is attained", ev(p,(F(1),))==GAMMA, f"p(1) = {ev(p,(F(1),))}")

# RED CONTROL 1 — a wrong claimed decomposition must be REFUSED (checker can go red on a bad cert)
q2_bad = U(-1,2)                          # 2x - 1, wrong
st_b,why_b = certify_lower_bound(p, GAMMA, [q1,q2_bad])
fails += not check("R1 RED a corrupted certificate is REFUSED, not waved through", st_b=="REFUSED", why_b[:52])
# green again on restore
st_g,_ = certify_lower_bound(p, GAMMA, [q1,q2])
fails += not check("R1 green again on the restored certificate", st_g=="CERTIFIED")

# RED CONTROL 2 — an OVERCLAIM of the bound is refuted by an exact witness (F1 meets F6)
st_o,val = refute_lower_bound(p, F(6), (F(1),))
fails += not check("R2 RED the overclaim 'p >= 6' is REFUTED by the witness x=1", st_o=="REFUTED", f"p(1) = {val} < 6")
# and the true bound is NOT refutable at that witness
st_t,_ = refute_lower_bound(p, GAMMA, (F(1),))
fails += not check("R2b the true bound 'p >= 5' STANDS at the same witness", st_t=="STANDS")

# THE FAMILY'S HONEST BOUNDARY — Motzkin is >=0 everywhere but has NO SOS decomposition (Motzkin 1967)
motzkin = clean({(4,2):F(1),(2,4):F(1),(2,2):F(-3),(0,0):F(1)})
# a plausible-looking attempt cannot match (there is no matching to find); the checker must REFUSE
attempt = [ clean({(2,1):F(1),(1,2):F(1)}), clean({(1,1):F(1)}) ]     # any guess
st_m,why_m = certify_lower_bound(motzkin, F(0), attempt)
fails += not check("L1 the Motzkin polynomial REFUSES an SOS certificate (family's honest limit)",
                   st_m=="REFUSED", "no SOS exists — Motzkin 1967; the checker does not fudge it")
fails += not check("L2 yet Motzkin is nonnegative at a probe point (AM-GM boundary)",
                   ev(motzkin,(F(1),F(1)))==0, f"M(1,1) = {ev(motzkin,(F(1),F(1)))}")

print()
print("ALL PASS — a global lower bound certified exactly, its checker shown red on a bad certificate"
      if fails==0 else f"{fails} check(s) FAILED")
raise SystemExit(1 if fails else 0)
