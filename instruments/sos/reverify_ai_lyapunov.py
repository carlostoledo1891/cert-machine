#!/usr/bin/env python3
# Probe, claimless. F6 pointed at a real object: exact re-verification of the machine-DISCOVERED
# Lyapunov functions in "A constrained symbolic regression approach for Lyapunov function
# discovery" (arXiv:2606.10045, 2026), system Eq.17:  x1' = -x1 + 4x2 ,  x2' = -x1 - x2^3.
# FAIRNESS NOTE (read before any framing): the paper is rigorous and self-aware. It states the
# VALID function is x1^2 + 4x2^2 (Eq.22) and EXPLICITLY flags x1^2 + 3.97x2^2 (Eq.23) as having an
# incorrect coefficient. This re-verification therefore CONFIRMS a correct machine-generated
# result and CORROBORATES the authors' own honesty about the under-sampled ones. No gap is claimed.
from fractions import Fraction as F
def clean(p): return {m:c for m,c in p.items() if c!=0}
def add(*ps):
    r={}
    for p in ps:
        for m,c in p.items(): r[m]=r.get(m,F(0))+c
    return clean(r)
def scal(k,p): return clean({m:k*c for m,c in p.items()})
def mul(a,b):
    r={}
    for ma,ca in a.items():
        for mb,cb in b.items():
            m=(ma[0]+mb[0],ma[1]+mb[1]); r[m]=r.get(m,F(0))+ca*cb
    return clean(r)
def deriv(p,i):
    r={}
    for m,c in p.items():
        if m[i]==0: continue
        nm=list(m); e=nm[i]; nm[i]-=1; r[tuple(nm)]=r.get(tuple(nm),F(0))+c*e
    return clean(r)
def ev(p,x1,x2):
    return sum((c*(x1**a)*(x2**b) for (a,b),c in p.items()), F(0))
X1={(1,0):F(1)}; X2={(0,1):F(1)}
f1=add(scal(F(-1),X1), scal(F(4),X2))
f2=add(scal(F(-1),X1), scal(F(-1),mul(X2,mul(X2,X2))))
def vdot(V): return add(mul(deriv(V,0),f1), mul(deriv(V,1),f2))
def is_wsos(p,squares,coeffs):
    if any(c<0 for c in coeffs): return False
    acc={}
    for c,s in zip(coeffs,squares): acc=add(acc,scal(c,mul(s,s)))
    return len(clean(add(p,scal(F(-1),acc))))==0
def check(n,ok,d=""):
    print(f"{'PASS' if ok else 'FAIL':4}  {n}"+(f"   [{d}]" if d else "")); return ok
fails=0
print("== exact re-verification of machine-discovered Lyapunov functions (arXiv:2606.10045) ==\n")

# VALID (Eq.22): V = x1^2 + 4x2^2  ->  -Vdot = 2x1^2 + 8x2^4 = (sqrt2 x1)^2 + ... use weighted SOS
V=add(mul(X1,X1), scal(F(4),mul(X2,X2)))
Vd=vdot(V)                                        # expect -2x1^2 - 8x2^4
negVd=scal(F(-1),Vd)
fails+=not check("C1 V=x1^2+4x2^2 : Vdot has no cross term (the exact coefficient kills it)",
                 Vd=={(2,0):F(-2),(0,4):F(-8)}, f"Vdot={{{', '.join(f'{k}:{v}' for k,v in Vd.items())}}}")
fails+=not check("C2 -Vdot is an exact weighted SOS: 2*x1^2 + 8*(x2^2)^2 (neg. definite)",
                 is_wsos(negVd,[X1,mul(X2,X2)],[F(2),F(8)]), "zero only at origin -> VALID global Lyapunov")

# UNDER-SAMPLED variants the paper reports (x1^2+2x2^2, x1^2+3x2^2, x1^2+3.97x2^2): each should FAIL
for c,label in [(F(2),"2"),(F(3),"3"),(F(397,100),"3.97 (Eq.23, paper-flagged)")]:
    Vc=add(mul(X1,X1), scal(c,mul(X2,X2))); Vdc=vdot(Vc)
    # exact witness on the maximizing line x1 = (8-2c)/4 * x2 /? ; use x1=(2-c/2)x2 small x2
    # generic: pick small x2 and x1 that maximizes the quadratic-in-x1 part
    a=Vdc.get((2,0),F(0)); b=Vdc.get((1,1),F(0))      # Vdot = a x1^2 + b x1 x2 + (x2^4 term)
    found=None
    for x2n in [F(1,1000),F(1,2000),F(1,5000)]:
        x1n=(-b*x2n)/(2*a) if a!=0 else F(0)          # vertex of the downward parabola in x1
        val=ev(Vdc,x1n,x2n)
        if val>0: found=(x1n,x2n,val); break
    fails+=not check(f"R x1^2+{label}x2^2 is NOT a Lyapunov function : exact witness Vdot>0",
                     found is not None, f"x=({found[0]},{found[1]}) -> Vdot={found[2]}" if found else "no witness")

print()
print("ALL PASS — the paper's valid function is confirmed exact; the under-sampled ones fail exactly,\n"
      "           corroborating the authors' own statement. A clean re-verification, no gap claimed."
      if fails==0 else f"{fails} FAILED")
raise SystemExit(1 if fails else 0)
