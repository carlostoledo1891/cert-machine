import numpy as np, json, sys, os
from scipy.optimize import minimize
import iterate as it
def run(Rq, deg, delta, c0, bound=10.0):
    R = it.Region(np.array(Rq))
    lam = np.concatenate([np.logspace(-4, -2, 15, endpoint=False), np.linspace(0.01, 1, 200)])
    cons = lambda c: np.concatenate([it.slack_max(c, lam, R)[0]/lam - delta, [it.S0(c, Rq) - delta]])
    obj = lambda c: it.pv(c, 1.0)
    c0 = np.concatenate([c0, np.zeros(max(0, deg - len(c0)))])[:deg]
    res = minimize(obj, c0, method='SLSQP', constraints=[{'type': 'ineq', 'fun': cons}], bounds=[(-bound, bound)]*deg, options={'maxiter': 600, 'ftol': 1e-13})
    c = res.x
    return c, 4*np.exp(obj(c)/np.e), cons(c).min(), res.message
if __name__ == '__main__':
    chain = [list(it.QAI)]
    base = [4*np.exp(it.pv(it.QAI, 1.0)/np.e)]
    deg = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    delta = float(sys.argv[2]) if len(sys.argv) > 2 else 5e-5
    steps = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    for k in range(steps):
        c, b, mc, msg = run(chain[-1], deg, delta, np.array(chain[-1]))
        print('iteration %d (region = previous): base %.6f  min cons %.2e  %s' % (k+1, b, mc, msg), flush=True)
        print('   q =', [round(float(x), 6) for x in c], flush=True)
        if mc < -1e-9: break
        chain.append([float(x) for x in c]); base.append(float(b))
    json.dump({'deg': deg, 'delta': delta, 'chain': chain, 'base': base}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chain_deg%d.json' % deg), 'w'), indent=1)
