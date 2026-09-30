import numpy as np, json, sys, os
import iterate as it
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
ch = json.load(open(os.path.join(HERE, 'chain_deg9.json')))
nsteps = int(sys.argv[1]) if len(sys.argv) > 1 else 5
cert = json.load(open(os.path.join(ROOT, 'certs', 'gnnw-certificate.json')))
steps = [{'q': cert['q'], 'm': cert['m'], 'note': 'G_AI, the remark\'s polynomial, in the region of F_0.03'}]
region = np.array([float(x) for x in cert['q']])
N = 100
for k in range(1, nsteps + 1):
    q = ['%.6f' % x for x in ch['chain'][k]]
    qf = np.array([float(x) for x in q])
    R = it.Region(region)
    lam = np.array([j / N for j in range(1, N + 1)])
    s, M = it.slack_max(qf, lam, R, iters=80)
    E = np.exp(-qf[0]); mu0 = ((2 - E) + np.sqrt((E - 2) ** 2 + 4 * E)) / 2
    vals = ['%.6f' % v for v in M / lam]
    # float check of the piecewise-linear witness through the rounded nodes on a fine grid
    nodes = np.array([mu0] + [float(v) for v in vals])
    fine = np.concatenate([np.logspace(-8, -2, 200, endpoint=False), np.linspace(0.01, 1, 20001)])
    j = np.minimum((fine * N).astype(int), N - 1); u = fine * N - j
    Mf = fine * (nodes[j] * (1 - u) + nodes[j + 1] * u)
    fp = it.Fp(qf, fine); Fv = it.F(qf, fine); uu = np.exp(-fp)
    lnX = np.log1p(-uu) / (1 - Mf) + np.log1p(-Mf)
    sl = Fv + 0.5 * (lnX + fine * np.log(Mf) + fine * R.lnY(lnX))
    w = np.argmin(sl / fine)
    print('step %d: base %.6f  S0 %.3e  float min slack/l on the fine grid %.3e at %.4f' % (k + 1, 4 * np.exp(it.pv(qf, 1.0) / np.e), it.S0(qf, region), (sl / fine)[w], fine[w]))
    steps.append({'q': q, 'm': {'N': N, 'm0': '%.6f' % mu0, 'values': vals}, 'note': 'iteration %d: this program\'s float optimiser (degree 9, SLSQP, margin 5e-5 l on 215 points), in the region of step %d' % (k, k)})
    region = qf
json.dump({'what': 'A chain of GNNW Theorem 14 iterations: step 1 is the remark\'s G_AI in the region of F_0.03 (Theorem 1); each later step is a degree-9 polynomial proposed by this program\'s float optimiser, in the region of the bound the step before it establishes. Witness M per step as in m-nodes.json.', 'steps': steps},
          open(os.path.join(ROOT, 'corpus', 'gnnw', 'chain.json'), 'w'), indent=1)
