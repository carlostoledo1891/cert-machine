# Is Codex's target.cnf the same formula as cert-machine's cm5.cnf up to renaming variables? Reconstruct the renaming
# from the formula's own structure (no knowledge of core_cnf.py), then compare the clause multisets.
import sys, itertools
from collections import Counter, defaultdict
def load(p):
    cl=[]
    for line in open(p):
        if line[0] in 'cp': continue
        cl.append(tuple(int(x) for x in line.split()[:-1]))
    return cl
ours, theirs = load(sys.argv[1]), load(sys.argv[2])
# our variable meaning, re-derived the same way from OUR file (so both sides are read by one procedure)
def structure(cl):
    three = [c for c in cl if len(c) == 3]
    cnt = Counter(abs(l) for c in three for l in c)
    OO = {v for v, k in cnt.items() if k >= 30}
    assert len(OO) == 10, len(OO)
    two = [c for c in cl if len(c) == 2]
    g = defaultdict(set)
    for a, b in two: g[-a].add(-b); g[-b].add(-a)
    comps, seen = [], set()
    for v in g:
        if v in seen: continue
        st, comp = [v], set()
        while st:
            x = st.pop()
            if x in comp: continue
            comp.add(x); st.extend(g[x] - comp)
        seen |= comp; comps.append(sorted(comp))
    assert len(comps) == 5 and all(len(c) == 35 for c in comps), [len(c) for c in comps]
    cls_of = {v: k for k, c in enumerate(comps) for v in c}
    same = defaultdict(set); oo_pair = {}
    for c in three:
        vs = [abs(l) for l in c]
        o = [v for v in vs if v in OO]
        if len(o) == 1:
            p = o[0]; a, b = [v for v in vs if v not in OO]
            same[a].add(b); same[b].add(a)
            oo_pair.setdefault(p, set()).update({cls_of[a], cls_of[b]})
    return OO, comps, cls_of, g, same, oo_pair
def labelling(cl):
    OO, comps, cls_of, g, same, oo_pair = structure(cl)
    # label class 0 by an isomorphism onto C35(1,7,11,16): fix the first vertex at 0 and extend by backtracking
    N = 35; S = {1, 7, 11, 16, 34, 28, 24, 19}
    adjc = lambda u, v: (v - u) % N in S
    c0 = comps[0]; order = []
    st = [c0[0]]; seen = set()
    while st:                                   # BFS order for a fast backtrack
        x = st.pop(0)
        if x in seen: continue
        seen.add(x); order.append(x); st.extend(sorted(g[x]))
    lab = {}
    def bt(i, used):
        if i == len(order): return True
        x = order[i]
        for u in range(N):
            if u in used: continue
            if all(adjc(u, lab[y]) == (y in g[x]) for y in lab):
                lab[x] = u; used.add(u)
                if bt(i + 1, used): return True
                del lab[x]; used.discard(u)
        return False
    assert bt(0, set())
    # propagate the core labels to the other classes through the "same core vertex" links
    for x in list(lab):
        for y in same[x]: lab.setdefault(y, lab[x])
    assert len(lab) == 175 and all(len({lab[v] for v in c}) == 35 for c in comps)
    mp = {}
    for k, c in enumerate(comps):
        for v in c: mp[v] = ('oc', k, lab[v])
    for p, pair in oo_pair.items():
        assert len(pair) == 2; mp[p] = ('oo',) + tuple(sorted(pair))
    return mp
mo, mt = labelling(ours), labelling(theirs)
canon = lambda cl, mp: Counter(tuple(sorted((l > 0, mp[abs(l)]) for l in c)) for c in cl)
eq = canon(ours, mo) == canon(theirs, mt)
print('same formula up to renaming (outside order and core automorphism fixed by the reconstruction):', eq)
