#!/usr/bin/env python3
"""tensorlb — independent audit of published tensor-rank LOWER-BOUND certificates.

The repo has audited the UPPER-bound side of <3,3,3> for months (Strassen,
Laderman, AlphaTensor, AlphaEvolve, all in certs/strassen-certificate.json).
This instrument audits the OTHER wall.

TARGET: Chengu Wang, "Automated Lower Bounds for Bilinear Complexity over
Finite Fields", arXiv:2603.07280 (2026-03-07), which proves R_F2(<3,3,3>) >= 20
and thereby improves Blaeser's 19 (2003). Code MIT at
github.com/wcgbg/tensor-rank-lower-bound. At the time of writing that repo has
2 stars and, so far as we can establish, the result has never been
independently checked.

METHOD, and why it is not a reimplementation. Wang's certificate proves each
node's bound by one of four inference rules. The orthodox audit reimplements
those rules and can therefore only ever AGREE. This instrument instead computes
GROUND TRUTH directly -- the true minimum rank of each constrained sub-tensor --
and asks whether his number is the truth. A method that can DISAGREE is worth
strictly more than one that cannot.

VERDICTS, kept honest and distinct:
  CONFIRMED  a two-sided bound was computed (matrix rank), so rank == lb exactly
  TIGHT-IF   an upper bound equal to lb was found; his lower bound is tight IF
             correct. This is NOT independent confirmation of rank >= lb.
  SURVIVES   an attack was mounted and found nothing cheaper than lb
  REFUTED    a decomposition of rank < lb exists -- the certificate is wrong

Nothing here is trusted from Wang's code: the constraint semantics and the
c-index convention are both undocumented and were recovered from the bytes.

usage: python3 instruments/tensorlb/verify.py <cert.pb.txt> [--n 2|3]
"""
import re, sys, collections, random

ESC = {'n':10,'t':9,'r':13,'\\':92,'"':34,"'":39,'a':7,'b':8,'f':12,'v':11}

def decode(lit):
    """protobuf text-format bytes literal -> list of byte values."""
    out=[]; i=0
    while i < len(lit):
        if lit[i]=='\\':
            j=i+1
            if j<len(lit) and lit[j] in '01234567':
                d=''
                while j<len(lit) and lit[j] in '01234567' and len(d)<3: d+=lit[j]; j+=1
                out.append(int(d,8)); i=j
            elif j<len(lit) and lit[j]=='x':
                h=''; j+=1
                while j<len(lit) and lit[j] in '0123456789abcdefABCDEF' and len(h)<2: h+=lit[j]; j+=1
                out.append(int(h,16)); i=j
            else:
                out.append(ESC.get(lit[j], ord(lit[j]))); i=j+1
        else:
            out.append(ord(lit[i])); i+=1
    return out

def masks(bs, na):
    """constraint functionals: na<=8 -> 1 byte each, else little-endian 2 bytes."""
    if na <= 8: return list(bs)
    return [bs[i] | (bs[i+1] << 8) for i in range(0, len(bs)-1, 2)]

def matmul_tensor(n):
    """<n,n,n> trilinear form over F2. c-index convention c[k][i] -- RECOVERED
       from the certificate's own witnesses, not documented anywhere."""
    T = {}
    for i in range(n):
        for j in range(n):
            for k in range(n):
                T[(i*n+j, j*n+k, k*n+i)] = 1
    return T

def reduce_space(mk, na):
    piv = {}
    for m in mk:
        mm = m
        for p in sorted(piv, reverse=True):
            if mm >> p & 1: mm ^= piv[p]
        if mm: piv[mm.bit_length()-1] = mm
    def red(a):
        v = 1 << a
        for p in sorted(piv, reverse=True):
            if v >> p & 1: v ^= piv[p]
        return v
    return red, na - len(piv)

def sub_tensor(mk, n, na):
    red, dim = reduce_space(mk, na)
    T = collections.Counter()
    for (a,b,c), val in matmul_tensor(n).items():
        rv = red(a)
        for i in range(na):
            if rv >> i & 1: T[(i,b,c)] ^= val
    return {k for k,v in T.items() if v}, dim

def f2_rank(rows, ncols):
    rows = list(rows); r = 0
    for col in range(ncols):
        p = next((i for i in range(r,len(rows)) if rows[i] >> col & 1), None)
        if p is None: continue
        rows[r], rows[p] = rows[p], rows[r]
        for i in range(len(rows)):
            if i != r and rows[i] >> col & 1: rows[i] ^= rows[r]
        r += 1
    return r

def witness_terms(expr):
    out = []
    for t in expr.split(' + '):
        f = re.findall(r'\(([^)]*)\)', t)
        if len(f) != 3: return None
        out.append(tuple(sorted(int(v[1:]) for v in s.split('+')) for s in f))
    return out

def witness_tensor(terms):
    T = collections.Counter()
    for (A,B,C) in terms:
        for a in A:
            for b in B:
                for c in C: T[(a,b,c)] ^= 1
    return {k for k,v in T.items() if v}

def parse(path):
    txt = open(path).read()
    g = lambda k: (re.search(k+r':\s*(\d+)', txt) or [None,'0'])[1]
    na = int(g('na')); n = round(na ** 0.5)
    nodes = []
    for blk in re.split(r'\nconstrained_tensors \{', txt)[1:]:
        cm = re.search(r'constraints:\s*"((?:[^"\\]|\\.)*)"', blk)
        mk = masks(decode(cm.group(1)), na) if cm else []
        lb = int(re.search(r'rank_lower_bound:\s*(\d+)', blk).group(1))
        ub = re.search(r'rank_upper_bound_proof:\s*"rank=(\d+)\.\s*((?:[^"\\]|\\.)*)"', blk)
        nodes.append({'mk': mk, 'lb': lb,
                      'ub': int(ub.group(1)) if ub else None,
                      'expr': ub.group(2).strip() if ub else None})
    return n, na, nodes

def audit(path, trials=600, seed=20260830):
    n, na, nodes = parse(path)
    rng = random.Random(seed)
    res = {'witness_ok':0,'witness_bad':0,'CONFIRMED':0,'TIGHT-IF':0,'SURVIVES':0,'REFUTED':0,'NOT-ATTACKED':0}
    rows = []
    for idx, nd in enumerate(nodes):
        T, dim = sub_tensor(nd['mk'], n, na)
        # (a) re-verify any upper-bound witness against the sub-tensor we rebuilt
        if nd['expr'] is not None:
            terms = witness_terms(nd['expr']) if nd['expr'] else []
            ok = (witness_tensor(terms) == T) and (len(terms) == nd['ub'])
            res['witness_ok' if ok else 'witness_bad'] += 1
        # (b) ground truth where a two-sided bound is available
        M = collections.defaultdict(lambda: [0]*na)
        for (i,b,c) in T: M[i][b] |= 1 << c
        verdict, val = 'NOT-ATTACKED', None
        if dim <= 1:
            val = max((f2_rank(r, na) for r in M.values()), default=0)
            verdict = 'REFUTED' if val < nd['lb'] else ('CONFIRMED' if val == nd['lb'] else 'SURVIVES')
        elif dim == 2:
            k = sorted(M); M0, M1 = M[k[0]], M[k[1]]
            best = f2_rank(M0, na) + f2_rank(M1, na)
            for _ in range(trials):
                X = [0]*na; cur = best; 
                for _s in range(nd['lb']):
                    u = rng.randrange(1, 1<<na); v = rng.randrange(1, 1<<na)
                    Xc = [x ^ (v if (u>>i & 1) else 0) for i,x in enumerate(X)]
                    c2 = f2_rank(Xc,na) + f2_rank([a^b for a,b in zip(M0,Xc)],na) \
                                        + f2_rank([a^b for a,b in zip(M1,Xc)],na)
                    if c2 < cur: X, cur = Xc, c2
                best = min(best, cur)
            val = best
            verdict = 'REFUTED' if best < nd['lb'] else ('TIGHT-IF' if best == nd['lb'] else 'SURVIVES')
        res[verdict] += 1
        rows.append((idx, dim, nd['lb'], val, verdict))
    return n, res, rows

if __name__ == '__main__':
    path = sys.argv[1]
    n, res, rows = audit(path)
    print(f"tensorlb audit of {path}  (<{n},{n},{n}> over F2)")
    print(f"  nodes: {len(rows)}")
    print(f"  upper-bound witnesses re-verified: {res['witness_ok']} ok, {res['witness_bad']} BAD")
    print(f"  CONFIRMED (two-sided, rank==lb proved): {res['CONFIRMED']}")
    print(f"  TIGHT-IF  (upper==lb; not a proof of lb): {res['TIGHT-IF']}")
    print(f"  SURVIVES  (attacked, nothing cheaper found): {res['SURVIVES']}")
    print(f"  NOT-ATTACKED (dim>2, beyond this instrument):  {res['NOT-ATTACKED']}")
    print(f"  REFUTED   (a cheaper decomposition exists): {res['REFUTED']}")
    if res['witness_bad'] or res['REFUTED']:
        print("\n  *** THE CERTIFICATE IS CONTRADICTED ***"); sys.exit(1)
