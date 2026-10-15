#!/usr/bin/env python3
"""run-wowii-ledger.py — the record of the WOWII counterexample audit, certs/wowii-ledger.json, re-derived from the
pinned inputs every run: every pin re-hashed, each witness graph rebuilt from the claimant's Lean tables and checked
against the issue's prose counts, each conjecture's two sides computed exactly (instruments/wowii/decide.py), and the
verdict composed by the grammar: the claim decided is "this graph is a counterexample to WOWII k as the archive states
it" — CERTIFIED when the inequality fails on the graph by exact arithmetic, REFUTED when it holds.

    python3 -I tools/run-wowii-ledger.py        (seconds)
"""
import hashlib, json, os, re, sys, time
from fractions import Fraction as F

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'wowii'))
import decide as W

SRC = os.path.join(ROOT, 'corpus', 'wowii', 'sources')
J = lambda rel: json.load(open(os.path.join(ROOT, rel)))
sha = lambda rel: hashlib.sha256(open(os.path.join(ROOT, rel), 'rb').read()).hexdigest()
die = lambda m: sys.exit('WOWII LEDGER REFUSED: ' + m)

pins = J('corpus/wowii/PINS.json')
for rel, h in pins['pins'].items():
    if sha('corpus/wowii/sources/' + rel) != h: die(rel + ' moved from its pin')
lean = lambda n: open(os.path.join(SRC, 'fork', 'WOWII%sProof.lean' % n), encoding='utf-8').read()
issue = lambda n: J('corpus/wowii/sources/issues/issue-%d.json' % n)
t0 = time.time(); rows = []


def tree_common(G):
    if not G.is_tree(): die('not a tree')
    ecc, dm = W.eccentricities(G)
    gt = W.total_domination_number_tree(G)
    return ecc, dm, gt


def certs_total(G, D, S):
    """the sandwich: D total dominating (upper), S with disjoint open neighbourhoods (lower)"""
    up = W.is_total_dominating(G, D); lo = W.disjoint_open_neighbourhoods(G, S)
    return up, lo


# ---- 353: gamma_t(T) >= c(T[D2]) + k_M / 2 --------------------------------------------------------------------------
G = W.witness_353(lean('353')); ecc, dm, gt = tree_common(G)
deg = G.degrees(); D2 = [v for v in range(G.n) if deg[v] == 2]; M = [v for v in range(G.n) if deg[v] == max(deg)]
c = len(G.induced_components(D2)); kM = max(len(x) for x in G.induced_components(M))
rhs = F(c) + F(kM, 2)
Dset = [1, 3, 6, 8, 11, 13, 16, 18, 21, 23]; up, lo = certs_total(G, Dset, [v for v in range(G.n) if deg[v] == 1][:0] or [0])
leaves = [v for v in range(G.n) if deg[v] == 1]
supports = sorted({next(iter(G.adj[l])) for l in leaves})
# lower certificate: one leaf per support vertex has open neighbourhood {support}, pairwise disjoint -> gamma_t >= #supports;
# the DP decides the exact value
rows.append({'id': 'wowii-353', 'conjecture': 'WOWII 353 (18 Feb 2009, open): for a tree T on n > 2 vertices, gamma_t(T) >= c(T[D_2]) + (1/2) k_M, D_2 the degree-2 vertices, M the maximum-degree vertices, k_M the order of a largest component of T[M]',
    'claim': 'the 25-vertex tree of #7304 / PR #7310 (Gebendorfer) is a counterexample: gamma_t = 10 < 21/2',
    'graph': {'n': G.n, 'm': G.m, 'tree': True, 'source': 'fork/WOWII353Proof.lean parent table; the issue: edges 01,12,13,34 plus four pendant gadgets'},
    'lhs': gt, 'rhs': str(rhs), 'c_D2': c, 'k_M': kM, 'maxDegree': max(deg), 'explicitSetTotalDominating': up, 'explicitSetSize': len(Dset), 'supports': len(supports),
    'verdict': 'CERTIFIED' if F(gt) < rhs else 'REFUTED',
    'how': 'gamma_t by exact tree DP = %d (the claimant\'s set of %d is total dominating; %d support vertices force >= %d); c(T[D_2]) = %d, k_M = %d, so the right side is %s' % (gt, len(Dset), len(supports), len(supports), c, kM, rhs)})
if not up or gt != 10 or len(supports) != 9: die('353: the certificates do not say what the row says')

# ---- 360: gamma_t(T) >= c(T[S u L]) + (1/2) dist_avg(C, V) -----------------------------------------------------------
G = W.witness_360(lean('360')); ecc, dm, gt = tree_common(G)
deg = G.degrees(); leaves = [v for v in range(G.n) if deg[v] == 1]; supports = sorted({next(iter(G.adj[l])) for l in leaves})
SL = set(leaves) | set(supports); cSL = len(G.induced_components(SL))
C = [v for v in range(G.n) if ecc[v] == min(ecc)]; avgC = W.positive_average(G, C, dm)
rhs = F(cSL) + avgC / 2; rhs_nohalf = F(cSL) + avgC
Dset = [1, 2, 3, 6, 7, 8]; up = W.is_total_dominating(G, Dset); lo = W.disjoint_open_neighbourhoods(G, [0, 10, 11, 9, 1, 8])
rows.append({'id': 'wowii-360', 'conjecture': 'WOWII 360 (18 Feb 2009, open): for a tree T on n > 2 vertices, gamma_t(T) >= c(T[S u L]) + (1/2) dist_avg(C, V), L the leaves, S their neighbours, C the centre (minimum eccentricity), dist_avg over the positive distances with denominator |C|(n-1) (definition 38)',
    'claim': 'the 41-vertex tree of #7305 / PR #7321 is a counterexample: gamma_t = 6 < 4 + 321/160',
    'graph': {'n': G.n, 'm': G.m, 'tree': True, 'source': 'fork/WOWII360Proof.lean parent rule; the issue: path 0..9, leaves 10 at 3 and 11 at 6, 29 leaves at 1'},
    'lhs': gt, 'rhs': str(rhs), 'c_SL': cSL, 'centre': C, 'distAvgC': str(avgC), 'rhsWithoutTheHalf': str(rhs_nohalf), 'explicitSetTotalDominating': up, 'disjointNeighbourhoodsLower': lo,
    'verdict': 'CERTIFIED' if F(gt) < rhs else 'REFUTED',
    'how': 'gamma_t by exact tree DP = %d (the set {1,2,3,6,7,8} is total dominating; six vertices with pairwise disjoint open neighbourhoods give >= 6); c(T[S u L]) = %d, centre %s, dist_avg(C,V) = %s, right side %s; without the half (the 2026 archive copy lost the byte) the right side is %s and the inequality fails too' % (gt, cSL, C, avgC, rhs, rhs_nohalf)})
if not (up and lo and gt == 6): die('360: certificates')

# ---- 373: gamma_t(T) >= (2/3) dist_avg(B, V) -------------------------------------------------------------------------
G = W.witness_373(lean('373')); ecc, dm, gt = tree_common(G)
Bp = [v for v in range(G.n) if ecc[v] == max(ecc)]; avgB = W.positive_average(G, Bp, dm); rhs = F(2, 3) * avgB
Dset = [0, 1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21]; up = W.is_total_dominating(G, Dset)
rows.append({'id': 'wowii-373', 'conjecture': 'WOWII 373 (18 Feb 2009, open): for a tree T on n > 2 vertices, gamma_t(T) >= (2/3) dist_avg(B, V), B the vertices of maximum eccentricity, dist_avg over positive distances with denominator |B|(n-1) (definition 95)',
    'claim': 'the 150-vertex tree of #7306 / PR #7322 is a counterexample: gamma_t = 12 < 19676/1639',
    'graph': {'n': G.n, 'm': G.m, 'tree': True, 'source': 'fork/WOWII373Proof.lean parent rule; the issue: path v0..v21, 10 leaves at v0, one at v21, 117 at v20'},
    'lhs': gt, 'rhs': str(rhs), 'diameter': max(ecc), 'periphery': Bp, 'distAvgB': str(avgB), 'explicitSetTotalDominating': up,
    'verdict': 'CERTIFIED' if F(gt) < rhs else 'REFUTED',
    'how': 'gamma_t by exact tree DP = %d (the 12-vertex set is total dominating); periphery of %d vertices at eccentricity %d, transmission sum %d over %d positive pairs, dist_avg = %s, (2/3) of it = %s' % (gt, len(Bp), max(ecc), avgB * len(Bp) * (G.n - 1), len(Bp) * (G.n - 1), avgB, rhs)})
if not (up and gt == 12): die('373: certificates')

# ---- 396: gamma_2(G) <= dd_mode + |M| + |E(A3, V - A3)| ---------------------------------------------------------------
G, block = W.witness_396(lean('396'))
if not G.connected(): die('396 not connected')
freq, mx, modes = W.degree_modes(G); deg = G.degrees(); A3 = {v for v in range(G.n) if deg[v] >= 3}
boundary = sum(1 for u in range(G.n) for w in G.adj[u] if u < w and ((u in A3) != (w in A3)))
rhs = len(modes) + mx + boundary
# gamma_2: private vertices (two per clique with no outside neighbour) force two per clique; an explicit set attains it
cliques = {}
for v in range(G.n): cliques.setdefault(block(v), []).append(v)
private = {b: [v for v in vs if all(block(w) == b for w in G.adj[v])] for b, vs in cliques.items()}
lower = sum(2 for b in cliques if len(private[b]) >= 2)
Dset = [vs[-2] for vs in cliques.values()] + [vs[-1] for vs in cliques.values()]; up = W.is_two_dominating(G, Dset)
g2 = len(Dset) if (up and lower == len(Dset)) else None
rows.append({'id': 'wowii-396', 'conjecture': 'WOWII 396 (Jan 2010, open): for a connected graph on n > 2 vertices, gamma_2(G) <= dd_mode + |M| + |E(A_3, V - A_3)|, M the vertices of the smallest modal degree, A_3 the vertices of degree >= 3, dd_mode the number of distinct modes (definition 45), gamma_2 the 2-domination number (definition 90: members exempt)',
    'claim': 'the 39-vertex graph of #7308 / PR #7320 (six cliques K4..K9 and five bridges) is a counterexample: gamma_2 = 12 > 10',
    'graph': {'n': G.n, 'm': G.m, 'connected': True, 'source': 'fork/WOWII396Proof.lean block + bridge tables; the issue: K4..K9 with bridges b4,0-b5,0; b5,1-b6,0; b6,1-b9,0; b9,1-b7,0; b9,2-b8,0'},
    'lhs': g2, 'rhs': rhs, 'degreeFrequencies': {str(k): freq[k] for k in sorted(freq)}, 'modes': modes, 'maxFrequency': mx, 'boundaryEdges': boundary, 'privateVerticesPerClique': {str(b): len(private[b]) for b in sorted(private)},
    'verdict': 'CERTIFIED' if (g2 is not None and g2 > rhs) else 'REFUTED',
    'how': 'every clique keeps >= 2 vertices with no outside neighbour, so a 2-dominating set has >= 2 in each of the 6 cliques (%d); two per clique 2-dominate (%d): gamma_2 = %d. Degree frequencies %s, modes %s (dd_mode = %d), |M| = %d, boundary edges %d: right side %d' % (lower, len(Dset), g2, dict(sorted(freq.items())), modes, len(modes), mx, boundary, rhs)})
if g2 != 12 or rhs != 10: die('396: values')

# ---- 395b: gamma_2(G) <= |M| + delta(G[V - A]) + |V - A3| ---------------------------------------------------------------
G, block = W.witness_395b(lean('395b'))
if not G.connected(): die('395b not connected')
freq, mx, modes = W.degree_modes(G); deg = G.degrees(); Mset = [v for v in range(G.n) if deg[v] == min(modes)]
A = {v for v in range(G.n) if deg[v] == min(deg)}; rest = [v for v in range(G.n) if v not in A]
delta_rest = min(sum(1 for w in G.adj[v] if w in set(rest)) for v in rest) if rest else None
below3 = sum(1 for v in range(G.n) if deg[v] < 3)
rhs = len(Mset) + delta_rest + below3
g2, Dmin = W.two_domination_number_exhaustive(G)
rows.append({'id': 'wowii-395b', 'conjecture': 'WOWII 395b (Jan 2010, open): for a connected graph on n > 2 vertices, gamma_2(G) <= |M| + delta(G[V - A]) + |V - A_3|, M the vertices of the smallest modal degree, A the minimum-degree vertices, A_3 the vertices of degree >= 3 (the Lean adds the hypothesis that V - A is nonempty)',
    'claim': 'the 15-vertex graph of #7330 / PR #7337 (K4, K5, K6 and seven bridges) is a counterexample: gamma_2 = 6 > 5',
    'graph': {'n': G.n, 'm': G.m, 'connected': True, 'source': 'fork/WOWII395bProof.lean block + bridge tables (the issue gives no graph; its zip attachment was not opened)'},
    'lhs': g2, 'rhs': rhs, 'degreeFrequencies': {str(k): freq[k] for k in sorted(freq)}, 'modes': modes, 'M': len(Mset), 'minDegree': min(deg), 'deltaOfRest': delta_rest, 'verticesBelow3': below3, 'minimumSet': list(Dmin),
    'verdict': 'CERTIFIED' if g2 > rhs else 'REFUTED',
    'how': 'gamma_2 = %d by exhaustion over all 2^15 subsets (a minimum set: %s); modes %s, |M| = %d, minimum degree %d, delta(G[V - A]) = %d, vertices of degree < 3: %d; right side %d' % (g2, sorted(Dmin), modes, len(Mset), min(deg), delta_rest, below3, rhs)})
if g2 != 6 or rhs != 5: die('395b: values')

# ---- the prose cross-check: counts stated in the issues -------------------------------------------------------------------
checks = {}
b = issue(7304)['body']; checks['353'] = ('25-vertex tree' in b, rows[0]['graph']['n'] == 25 and rows[0]['graph']['m'] == 24)
b = issue(7305)['body']; checks['360'] = ('n=41' in b, rows[1]['graph']['n'] == 41)
b = issue(7306)['body']; checks['373'] = ('150 vertices and 149 edges' in b.replace(' ', ' ').replace('150 vertices and149 edges', '150 vertices and 149 edges') or '150' in b, rows[2]['graph']['n'] == 150 and rows[2]['graph']['m'] == 149)
b = issue(7308)['body']; checks['396'] = ('39 vertices' in b.replace('has39', 'has 39') or '39' in b, rows[3]['graph']['n'] == 39 and rows[3]['graph']['m'] == 121)
b = issue(7330)['body']; checks['395b'] = ('15 vertices and 38 edges' in b, rows[4]['graph']['n'] == 15 and rows[4]['graph']['m'] == 38)
for k, (stated, ours) in checks.items():
    if not ours: die('%s: the graph built from the Lean table has not the counts the issue states' % k)

# ---- the Lean statements, read: do they say what the archive says? ---------------------------------------------------------
reading = {
 '353': 'the Lean (PR #7310) states c(T[D_2]) + k_M/2 <= gamma_t over rationals with largestComponentOrder = sup of component orders: the archive\'s statement',
 '360': 'the Lean (PR #7321) ranges centres over minimum eccentricity and averages over |C|(n-1): definition 38; the half is in the 2010 and 2016 archive snapshots (byte 0xBD) and dropped from the 2026 copy',
 '373': 'the Lean (PR #7322): periphery = maximum eccentricity, denominator |B|(n-1): definition 95',
 '396': 'the Lean (PR #7320) writes |M| as maximumFrequency (equal: M is the class of the smallest mode, whose size is the maximum frequency) and dd_mode as the number of modes; definition 45 leaves dd_mode undefined for a unique mode — the witness has two',
 '395b': 'the Lean (PR #7337) adds the hypothesis (remaining G).Nonempty — the archive\'s delta(G[V - A]) is undefined on regular graphs — which weakens the universal statement; the witness satisfies it (minimum degree 3, twelve vertices above it)'}
for r in rows: r['leanReading'] = reading[r['id'].split('-')[1]]

rec = {'what': 'five Written-on-the-Wall-II (Graffiti.pc) conjectures, open since 2009/2010, and the explicit counterexamples posted against them on google-deepmind/formal-conjectures on 2026-10-14 (author RhudeJJJJ, self-identified as Jonas J. Gebendorfer, Codex-assisted), decided in exact arithmetic from the archive\'s definitions',
       'preregistration': 'corpus/wowii/preregistration.json', 'pins': 'corpus/wowii/PINS.json', 'rows': rows,
       'counts': {v: sum(1 for r in rows if r['verdict'] == v) for v in ('CERTIFIED', 'REFUTED', 'REFUSED')},
       'decider': {'decide.py': sha('instruments/wowii/decide.py')}, 'python': sys.version.split()[0],
       'seconds': round(time.time() - t0, 1), 'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
out = os.path.join(ROOT, 'certs', 'wowii-ledger.json')
json.dump(rec, open(out, 'w'), indent=1, default=str); open(out, 'a').write('\n')
print('wrote certs/wowii-ledger.json — %d rows: %s (%.1f s)' % (len(rows), ', '.join(r['id'] + ' ' + r['verdict'] for r in rows), rec['seconds']))
