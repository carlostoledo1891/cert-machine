"""Independent exact/Arb verifier of the Doche limit-point formula.
No imports from search code or upstream. Coefficients are descending integers.
A successful run proves C82 < target; the argument is in README.md ("Why the certificate implies the bound").
"""
import argparse, json, hashlib, time
from fractions import Fraction
from flint import arb, acb, fmpz_poly, ctx


def aq(q):
    q = Fraction(q)
    return arb(q.numerator) / q.denominator


def load(path):
    raw = open(path, 'rb').read(); c = json.loads(raw)
    den, num = [], []
    for rec in c['denominator']:
        cs = rec['coeffs']; m = rec.get('multiplicity', 1)
        assert all(type(v) is int for v in cs) and len(cs)>1 and abs(cs[0])==1
        assert type(m) is int and m>0
        den.append((fmpz_poly(cs[::-1]), Fraction(m)))
    for rec in c['numerator']:
        cs = rec['coeffs']; q = Fraction(rec['q_rational'])
        assert all(type(v) is int for v in cs) and len(cs)>1 and cs[0]!=0 and q>=0
        if q: num.append((fmpz_poly(cs[::-1]), q))
    dq = sum(p.degree()*m for p,m in den)
    da = sum(p.degree()*q for p,q in num)
    assert da < dq and dq>0
    for p,q in num:
        for r,m in den: assert p.gcd(r).degree()==0, 'numerator/denominator not coprime'
    return c, den, num, dq, da, hashlib.sha256(raw).hexdigest()


def composed(p):
    z = fmpz_poly([0,1,-1]); v = fmpz_poly([0])
    for a in reversed(p.coeffs()): v = v*z+int(a)
    return v


def roots(p):
    rr=p.complex_roots(); assert sum(m for r,m in rr)==p.degree()
    return [r for r,m in rr for _ in range(m)]


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('certificate');ap.add_argument('--target');ap.add_argument('--tol',default='1e-9');ap.add_argument('--precision',type=int,default=160);ap.add_argument('--out',default='verification.json');args=ap.parse_args()
    ctx.prec=args.precision; start=time.time()
    c,den,num,dq,da,sha=load(args.certificate)
    target=aq(args.target or c['target']); tol=aq(args.tol)*aq(dq)
    # Composed integer polynomials and validated complete root multisets.
    cache={}
    def data(p):
        k=tuple(p.coeffs())
        if k not in cache:
            cp=composed(p);cache[k]=(cp,roots(cp))
        return cache[k]
    logm=arb(0)
    for p,m in den:
        cp,rs=data(p);v=arb(abs(int(cp.leading_coefficient()))).log()
        for r in rs: v+=abs(r).max(arb(1)).log()
        logm+=aq(m)*v
    # g = log|A| - log|Q|, evaluated from independently composed roots.
    signed=[];constant=arb(0)
    for group,sgn in [(num,1),(den,-1)]:
        for p,w in group:
            cp,rs=data(p); weight=aq(w)*sgn
            constant+=weight*arb(abs(int(cp.leading_coefficient()))).log()
            signed.extend((r,weight) for r in rs)
    pi2=2*arb.pi(); leaves=0;depthmax=0; bisected=0; zero=0
    def panel(k,depth):
        nonlocal leaves,depthmax,bisected,zero
        width=arb(1)/(2**depth);h=width/2;mid=arb(2*k+1)/(2**(depth+1))
        angle=pi2*mid;u=acb(angle.cos(),angle.sin());rad=pi2*h
        gu=constant;gm=constant;gp=arb(0);M=arb(0); separated=True
        for r,w in signed:
            delta=u-r;d=abs(delta);lo=d.lower()-rad;hi=d.upper()+rad
            if w>0:gu+=w*hi.log()
            elif lo>0:gu+=w*lo.log()
            else:gu=arb.pos_inf()
            if not lo>0:
                separated=False
            elif separated:
                gm+=w*d.log()
                gp+=w*(acb(0,1)*pi2*u/delta).real
                M+=abs(w)*pi2*pi2*abs(r)/(lo*lo)
        if gu<0:
            leaves+=1;zero+=1;depthmax=max(depthmax,depth);return arb(0)
        if separated:
            # |g''| <= M on the whole panel. Positive part is 1-Lipschitz.
            err=M*width**3/24
            reach=abs(gp)*h+M*h*h/2
            if gm-reach>0:
                val=gm*width+err
                error=err
            elif gm+reach<0:
                val=arb(0);error=arb(0)
            else:
                val=gm.max(arb(0))*width+abs(gp)*width*width/4+err
                error=abs(gp)*width*width/4+err
            if error < tol*width:
                leaves+=1;depthmax=max(depthmax,depth);return val
        assert depth<48, f'unresolved panel {k}/2^{depth}'
        bisected+=1
        return panel(2*k,depth+1)+panel(2*k+1,depth+1)
    # Exactly [0,1/2] tiled by binary recursion; other half by conjugation.
    integ=2*panel(0,1)
    bound=(logm+integ)/aq(dq)
    ok=bool(bound<target)
    report={'verified':ok,'target':str(args.target or c['target']),'certificate_sha256':sha,'degree_Q':str(dq),'degree_A':str(da),'logM_ball':str(logm),'integral_upper_ball':str(integ),'bound_upper_ball':str(bound),'leaves_half_circle':leaves,'zero_panels':zero,'bisections':bisected,'max_depth':depthmax,'precision':ctx.prec,'tolerance':args.tol,'seconds':time.time()-start}
    json.dump(report,open(args.out,'w'),indent=2);print(json.dumps(report,indent=2),flush=True)
    if not ok:raise SystemExit(1)

if __name__=='__main__':main()
