"""iterate.py — the FLOAT PROPOSER of the GNNW chain (never an authority: every round it proposes is decided by
tools/verify_gnnw_gai.py and instruments/gnnw/second.js). For a region f = h + qr e^-l (a bound already established),
find q minimising q(1) subject to max over M of slack(l) >= delta l on a grid and the l -> 0 limit >= delta.
Needs numpy and scipy: run with instruments/hseva/.venv/bin/python (make hseva-venv).
  iterate2.py DEG DELTA STEPS   rounds of the chain from G_AI, written to chain_degDEG.json (the floats the page quotes)
  buildchain.py N               the first N rounds of chain_deg9.json with their witnesses M -> corpus/gnnw/chain.json"""
import numpy as np, json, sys
from scipy.optimize import minimize
QAI = np.array([-0.3864, 0.8347, -2.0156, 2.7171, -1.7541, 0.4522])
Q03 = np.array([-0.25, 0.03, 0.08])
def pv(c, x):  # sum c_i x^(i+1)
    return sum(ci * x**(i+1) for i, ci in enumerate(c))
def dpv(c, x): return sum((i+1) * ci * x**i for i, ci in enumerate(c))
def h(x): return (1+x)*np.log1p(x) - x*np.log(x)
def F(c, x): return h(x) + pv(c, x)*np.exp(-x)
def Fp(c, x): return np.log((1+x)/x) + (dpv(c, x) - pv(c, x))*np.exp(-x)
class Region:
    def __init__(self, qr):
        self.qr = qr
        t = np.concatenate([np.logspace(-12, -2, 20000, endpoint=False), np.linspace(1e-2, 1, 200001)])
        fp, ff = Fp(qr, t), F(qr, t)
        self.lnA = -fp                   # ln A(t), increasing
        self.lnB = t*fp - ff             # ln B(t), decreasing
        self.lna, self.lnb, self.f1 = self.lnA[-1], self.lnB[-1], ff[-1]
        self.t = t
    def lnY(self, lnx):
        lnx = np.asarray(lnx, float); out = np.empty_like(lnx)
        B = lnx >= self.lnb; A = lnx <= self.lna; Mid = ~(A | B)
        # B-branch: X = B(t) (lnB decreasing in t) -> Y = A(t)
        out[B] = np.interp(-lnx[B], -self.lnB, self.lnA)
        out[Mid] = -self.f1 - lnx[Mid]
        # A-branch: X = A(t) (increasing) -> Y = B(t)
        out[A] = np.interp(lnx[A], self.lnA, self.lnB)
        return out
def slack_max(c, lam, R, iters=60):
    fp = Fp(c, lam); Fv = F(c, lam); u = np.exp(-fp)
    lo = np.full_like(lam, 1e-9); hi = np.full_like(lam, 0.99)
    g = (np.sqrt(5)-1)/2
    def s(M):
        lnX = np.log1p(-u)/(1-M) + np.log1p(-M)
        return Fv + 0.5*(lnX + lam*np.log(M) + lam*R.lnY(lnX))
    x1 = hi - g*(hi-lo); x2 = lo + g*(hi-lo); f1 = s(x1); f2 = s(x2)
    for _ in range(iters):
        m = f1 < f2
        lo = np.where(m, x1, lo); hi = np.where(m, hi, x2)
        x1n = np.where(m, x2, hi - g*(hi-lo)); x2n = np.where(m, lo + g*(hi-lo), x1)
        f1n = np.where(m, f2, s(x1n)); f2n = np.where(m, s(x2n), f1)
        f1, f2 = f1n, f2n
        x1, x2 = x1n, x2n
    Mbest = (x1+x2)/2
    return np.maximum(f1, f2), Mbest
def S0(c, Rq):  # the l -> 0 limit of slack/l, maximised over mu
    E = np.exp(-c[0]); mu = ((2-E) + np.sqrt((E-2)**2 + 4*E))/2
    return 1 + c[0] + 0.5*(-E - mu + np.log(mu) + np.log(E+mu) - Rq[0])
if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'AI'
    Rq = QAI if which == 'AI' else Q03
    R = Region(Rq)
    lam = np.concatenate([np.logspace(-4, -2, 15, endpoint=False), np.linspace(0.01, 1, 180)])
    delta = float(sys.argv[2]) if len(sys.argv) > 2 else 1e-4
    def cons(c):
        s, _ = slack_max(c, lam, R)
        return np.concatenate([s/lam - delta, [S0(c, Rq) - delta]])
    obj = lambda c: pv(c, 1.0)
    c0 = QAI.copy()
    print('start: q(1)=%.6f c=%.6f  min cons=%.3e' % (obj(c0), 4*np.exp(obj(c0)/np.e), cons(c0).min()))
    res = minimize(obj, c0, method='SLSQP', constraints=[{'type': 'ineq', 'fun': cons}], bounds=[(-3, 3)]*6, options={'maxiter': 400, 'ftol': 1e-12})
    c = res.x
    print(res.message, 'q(1)=%.6f  base c=%.6f  min cons=%.3e' % (obj(c), 4*np.exp(obj(c)/np.e), cons(c).min()))
    print('coeffs', [round(x, 6) for x in c])
    json.dump({'region': which, 'delta': delta, 'q': list(c), 'base': 4*np.exp(obj(c)/np.e)}, open('iter_%s.json' % which, 'w'))
