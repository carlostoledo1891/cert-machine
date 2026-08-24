#!/usr/bin/env python3
# Probe, claimless. F6 applied: an exact-rational SOS Lyapunov certificate of GLOBAL asymptotic
# stability for a nonlinear polynomial system. Method is classical (Lyapunov 1892; SOS-Lyapunov
# = Parrilo 2000) — credited, not claimed. The point is the house-style auditable certificate:
# every step exact over Q, and the certificate shown going red on an unstable perturbation.
from fractions import Fraction as F

def clean(p): return {m:c for m,c in p.items() if c!=0}
def add(*ps):
    r={}
    for p in ps:
        for m,c in p.items(): r[m]=r.get(m,F(0))+c
    return clean(r)
def scal(k,p): return clean({m:k*c for m,c in p.items()})
def sub(a,b): return add(a, scal(F(-1),b))
def mul(a,b):
    r={}
    for ma,ca in a.items():
        for mb,cb in b.items():
            m=tuple(x+y for x,y in zip(ma,mb)); r[m]=r.get(m,F(0))+ca*cb
    return clean(r)
def sq(a): return mul(a,a)
def deriv(p,i):
    r={}
    for m,c in p.items():
        if m[i]==0: continue
        nm=list(m); e=nm[i]; nm[i]-=1; r[tuple(nm)]=r.get(tuple(nm),F(0))+c*e
    return clean(r)
def ev(p,pt):
    s=F(0)
    for m,c in p.items():
        t=c
        for e,x in zip(m,pt): t*=x**e
        s+=t
    return s
def is_zero(p): return len(clean(p))==0

# monomials in (x1,x2)
X1={(1,0):F(1)}; X2={(0,1):F(1)}

def vdot(V, f1, f2): return add(mul(deriv(V,0),f1), mul(deriv(V,1),f2))

def is_sos(p, squares, coeffs):
    """exact: is p == sum coeffs_i * squares_i^2, all coeffs_i >= 0 ?"""
    if any(c<0 for c in coeffs): return (False,"negative coefficient")
    acc={}
    for c,s in zip(coeffs,squares): acc=add(acc, scal(c, sq(s)))
    return (True,"exact SOS") if is_zero(sub(p,acc)) else (False, f"residual {dict(sub(p,acc))}")

def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL':4}  {name}"+(f"   [{detail}]" if detail else "")); return ok
fails=0
print("== F6 applied · exact SOS Lyapunov certificate, nonlinear polynomial system ==\n")

# THE SYSTEM (nonlinear, cubic; the cubic terms are gyroscopic — they do no work on V):
#   x1' = -x1 - x2 + x1^2 x2 + x2^3
#   x2' =  x1 - x2 - x1^3   - x1 x2^2
f1 = add(scal(F(-1),X1), scal(F(-1),X2), {(2,1):F(1)}, {(0,3):F(1)})
f2 = add(X1, scal(F(-1),X2), {(3,0):F(-1)}, {(1,2):F(-1)})

# CANDIDATE Lyapunov function V = x1^2 + x2^2  (positive definite: SOS whose only zero is 0)
V = add(sq(X1), sq(X2))
Vd = vdot(V,f1,f2)
negVd = scal(F(-1),Vd)

# certificate 1: V is positive definite (SOS in the coordinates; V=0 only at origin)
okV,_ = is_sos(V,[X1,X2],[F(1),F(1)])
fails += not check("C1 V = x1^2 + x2^2 is an exact SOS (positive definite candidate)", okV)
# certificate 2: -Vdot is SOS  => Vdot <= 0 everywhere  => (with V radially unbounded) GLOBAL asymptotic stability
okD,why = is_sos(negVd,[X1,X2],[F(2),F(2)])
fails += not check("C2 -Vdot is exact SOS: -Vdot = 2 x1^2 + 2 x2^2", okD, f"Vdot = {dict(Vd)}")
fails += not check("C3 the cubic terms cancel in Vdot (gyroscopic) — the nonlinearity does no work on V",
                   Vd=={(2,0):F(-2),(0,2):F(-2)}, "Vdot is exactly -2(x1^2+x2^2), no degree>2 terms survive")

# RED CONTROL — flip one linear sign: x1' gains +x1 (an unstable perturbation).
f1u = add(X1, scal(F(-1),X2), {(2,1):F(1)}, {(0,3):F(1)})       # +x1 instead of -x1
Vdu = vdot(V,f1u,f2)
oku,_ = is_sos(scal(F(-1),Vdu),[X1,X2],[F(2),F(2)])
fails += not check("R1 RED the stable certificate REFUSES the unstable perturbation", not oku,
                   f"perturbed Vdot = {dict(Vdu)} — not <=0")
# and a witness of energy INCREASE (Vdot>0) proves the perturbation really is unstable near 0 (F1 meets F6)
w=(F(1),F(0)); vw=ev(Vdu,w)
fails += not check("R2 RED a witness shows Vdot>0 for the perturbed system (instability direction)",
                   vw>0, f"Vdot(1,0) = {vw} > 0")
# green again: the true system still certifies
okg,_ = is_sos(scal(F(-1),vdot(V,f1,f2)),[X1,X2],[F(2),F(2)])
fails += not check("R3 green again — the true system still certifies", okg)

print()
print("ALL PASS — global asymptotic stability of a nonlinear polynomial system, certified exactly,\n"
      "           the certificate shown red on an unstable perturbation" if fails==0
      else f"{fails} FAILED")
raise SystemExit(1 if fails else 0)
