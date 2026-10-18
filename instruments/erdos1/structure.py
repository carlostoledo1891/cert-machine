#!/usr/bin/env python
"""structure.py — the structure of the Hermite basis H_s behind the Erdős #1 buffer K, decided exactly over a
pre-registered grid of (b, s).

On 2026-10-18 a note (F. Schmidt, "Analytic Solution of the Perturbation Buffer Problem for Erdős Problem #1",
github.com/enzocage/Analytic-Solution-oft-he-Perturbation-Buffer-Problem-for-Erd-s-Problem-1 @ 8564602b) stated that
the canonical Hermite basis H_s of this repository's construction (paper/erdos1-explicit.md §3) has a b-independent
structure, and derived from it an explicit bound on the buffer K(b, s) = D_s ||E H_s^-1||_{inf->inf}. Its proofs of
the structure are sketches. This decides the stated structure exactly on every (b, s) of the grid below — no code of
the note's is run; H is computed here twice where affordable, by FLINT and by PARI (two Hermite-form implementations
that share no code), and must be identical.

Per (b, s), each a statement of the note, decided:
  T3.1   (s = 1) H_1 = [M_b u; 0 I], M_b = (2^b+1)/3, u_j = (2^{j+1}-1)/3 (j odd), (2^b-2^{j+1})/3 (j even);
         K(b,1) = ((3b+1)2^b + 9b - 17) / (3(2^b+1))
  T4.1   (s >= 2) with Block 0 = the first r_{s-1} indices and Blocks 1..b-1 of size d_{s-1}: Block 0's diagonal block
         is 2 H_{s-1}; Blocks 2..b-1 have identical diagonal blocks G and no coupling among themselves; (s >= 3) the
         lower sub-blocks 1..b-1 of G (size d_{s-2}) are copies of 2 G' (G' = Block 2 of H_{s-1}), uncoupled
  T5.1   every column of H, and of H^-1, has at most N_s = 3*2^{s-1} - 1 nonzeros, the maximum attained;
         supp(col_j H^-1) = supp(col_j H) for every j (no fill-in)
  T5.2   the longest directed path in DAG(H) (an edge i -> k when i < k and H[i][k] != 0) has exactly s edges
  T6.2b  min_j H[j][j] >= D/4 for s >= 2 (its proof also says the minimum equals D/4; recorded beside it)
  T6.1   (s = 2) max_j ||col_j(D H^-1)||_1 = 7*2^b/(2^b+1)
  T6.2c  max_j ||col_j(D H^-1)||_1 <= 4 N_s^s and K(b, s) <= 4 N_s^s (b^s - 1)
and K(b, s) itself, exactly, in this repository's definition (E's rows: 0, e_0..e_{r-2}, (-1,...,-1,+1)). The
note's Table 1 is compared with these exact values row by row.

H^-1 is computed column by column by exact back-substitution over the only rows that can be nonzero (x_i != 0 needs
H[i][k] != 0 for some k with x_k != 0) — exact Fractions, no assumption of the structure being decided.

usage: python structure.py            the grid (hours: the PARI forms at r ~ 2,000-3,000 dominate) -> certs/erdos1/buffer-structure.json
       python structure.py --check    the battery: s <= 3, b <= 7, both Hermite implementations, the red controls; nothing written
MIT"""
import sys, os, json, gzip, time, subprocess, tempfile, hashlib, heapq
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr
from flint import fmpz_mat
from lattice import lambda_s_basis, B_matrix, delta_formula

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'certs', 'erdos1', 'buffer-structure.json')
CHECK = '--check' in sys.argv
GRID = ([(b, 1) for b in range(3, 42, 2)] + [(b, 2) for b in range(3, 32, 2)] + [(b, 3) for b in range(3, 14, 2)]
        + [(3, 4), (5, 4), (7, 4), (3, 5), (5, 5), (3, 6), (3, 7)])
if CHECK: GRID = [(b, s) for (b, s) in GRID if s <= 3 and b <= 7]
FLINT_MAX_R = 400            # FLINT's Hermite form beside PARI's up to this size (it grows much faster than PARI's)
T0 = time.time()
def log(*a): print(f"[{time.time()-T0:7.1f}s]", *a, flush=True)
def die(m): print('STRUCTURE REFUSED: ' + m, file=sys.stderr); sys.exit(1)

# ---- the two Hermite forms -------------------------------------------------------------------------------------
def matrix_A(b, s):
    basis, _ = lambda_s_basis(b, s, Fr(1, 2)); d = b ** s; r = d - 1; D = 2 ** s
    B = B_matrix(basis); A = [[B[i][j] * D for j in range(r)] for i in range(r)]
    if any(x.denominator != 1 for row in A for x in row): die('D is not a common denominator at %s' % ((b, s),))
    return [[int(x) for x in row] for row in A], r, D

def hermite_flint(A, r):
    H1 = fmpz_mat(A).transpose().hnf()
    return [[int(H1[r - 1 - j, r - 1 - i]) for j in range(r)] for i in range(r)]

def hermite_pari(A, r, det):
    work = tempfile.mkdtemp(prefix='hnf-'); Af = os.path.join(work, 'A.gp'); Hf = os.path.join(work, 'H.txt'); sc = os.path.join(work, 'run.gp')
    with open(Af, 'w') as f: f.write("A=[" + ";".join(",".join(str(x) for x in row) for row in A[::-1]) + "];\n")
    with open(sc, 'w') as f:
        f.write(f'default(parisizemax, 12000000000);\nread("{Af}");\nH=mathnfmod(A, {det});\n'
                f'for(i=1,{r}, for(j=1,{r}, write1("{Hf}", H[i,j], " ")); write("{Hf}", ""));\nquit;\n')
    out = subprocess.run(['gp', '-q', '-f', sc], capture_output=True, text=True)
    if out.returncode != 0 or not os.path.exists(Hf): return None, (out.stderr + out.stdout)[-300:]
    H = [[int(x) for x in line.split()] for line in open(Hf) if line.strip()]
    for p in (Af, Hf, sc): os.remove(p)
    os.rmdir(work)
    return H, None

def canonical(H, r, det):
    """upper triangular, positive diagonal, entries reduced 0 <= H[i][j] < H[i][i], diagonal product = |det A|"""
    prod = 1
    for i in range(r):
        if H[i][i] <= 0 or any(H[i][j] for j in range(i)) or any(not (0 <= H[i][j] < H[i][i]) for j in range(i + 1, r)): return False
        prod *= H[i][i]
    return prod == det

# ---- the statements -----------------------------------------------------------------------------------------------
def supports(H, r): return [frozenset(i for i in range(r) if H[i][j]) for j in range(r)]

def inverse_columns(H, r, sup):
    """column j of H^-1 by exact back-substitution, visiting only rows that can be nonzero"""
    cols = []
    for j in range(r):
        x = {j: Fr(1, H[j][j])}; heap = [-i for i in sup[j] if i < j]; heapq.heapify(heap); seen = set(-h for h in heap)
        while heap:
            i = -heapq.heappop(heap)
            v = -sum(H[i][k] * x[k] for k in x if k > i and H[i][k]) / H[i][i]
            if v:
                x[i] = v
                for p in sup[i]:
                    if p < i and p not in seen: seen.add(p); heapq.heappush(heap, -p)
        cols.append(x)
    return cols

def decide(b, s, H, r, D, Hprev):
    d = b ** s; Ns = 3 * 2 ** (s - 1) - 1; rec = dict(b=b, s=s, d=d, r=r, D=D, Ns=Ns)
    sup = supports(H, r)
    nnz = [len(x) for x in sup]
    rec['maxColNnzH'] = max(nnz)
    rec['transitivelyClosed'] = all(i in sup[j] for j in range(r) for k in sup[j] for i in sup[k])
    depth = [0] * r
    for k in range(r):
        for i in sup[k]:
            if i < k and depth[i] + 1 > depth[k]: depth[k] = depth[i] + 1
    rec['depth'] = max(depth); rec['minDiag'] = min(H[i][i] for i in range(r))
    cols = inverse_columns(H, r, sup)
    rec['maxColNnzHinv'] = max(len(x) for x in cols)
    rec['noFillIn'] = all(frozenset(cols[j]) == sup[j] for j in range(r))
    if not rec['noFillIn']:   # the first column where they differ, and how: an entry of H^-1 outside supp(col_j H), or one inside it that cancels to 0
        j = next(j for j in range(r) if frozenset(cols[j]) != sup[j])
        extra, missing = sorted(set(cols[j]) - sup[j]), sorted(sup[j] - set(cols[j]))
        rec['fillInWitness'] = dict(column=j, inverseOutsideSupport=extra[:5], cancelledInsideSupport=missing[:5],
                                    H=[[i, H[i][j]] for i in missing[:5]], columnsDiffering=sum(1 for jj in range(r) if frozenset(cols[jj]) != sup[jj]))
    colL1 = [D * sum(abs(v) for v in cols[j].values()) for j in range(r)]
    rowL1 = [Fr(0)] * r
    for j in range(r):
        for i, v in cols[j].items(): rowL1[i] += abs(v)
    last = Fr(0)
    for j in range(r):
        x = cols[j]; last += abs(x.get(r - 1, 0) - sum(v for i, v in x.items() if i <= r - 2))
    K = D * max(max(rowL1[:r - 1]) if r > 1 else Fr(0), last)
    mc = max(colL1)
    rec.update(K=str(K), K_float=float(K), K_over_d=float(K) / d, maxColL1=str(mc), maxColL1_float=float(mc))
    stm = {}
    if s == 1:
        Mb = (2 ** b + 1) // 3; u = [((2 ** (j + 1) - 1) // 3 if j % 2 else (2 ** b - 2 ** (j + 1)) // 3) for j in range(1, b - 1)]
        stm['T3.1 H_1 closed form'] = H[0][0] == Mb and [H[0][j] for j in range(1, r)] == u and all(H[i][j] == (1 if i == j else 0) for i in range(1, r) for j in range(r))
        stm['T3.1 K(b,1) closed form'] = K == Fr((3 * b + 1) * 2 ** b + 9 * b - 17, 3 * (2 ** b + 1))
    else:
        d1 = b ** (s - 1); r1 = d1 - 1
        idx = [list(range(r1))] + [list(range(r1 + (m - 1) * d1, r1 + m * d1)) for m in range(1, b)]
        blk = lambda rs, cs: [[H[i][j] for j in cs] for i in rs]
        stm['T4.1a Block 0 = 2 H_{s-1}'] = blk(idx[0], idx[0]) == [[2 * x for x in row] for row in Hprev]
        G = [blk(idx[m], idx[m]) for m in range(2, b)]
        stm['T4.1c Blocks 2..b-1 identical'] = all(g == G[0] for g in G)
        stm['T4.1c Blocks 2..b-1 uncoupled'] = all(H[i][j] == 0 for m in range(2, b) for mp in range(m + 1, b) for i in idx[m] for j in idx[mp])
        if s >= 3:
            d2 = b ** (s - 2); r2 = d2 - 1; sub = [list(range(m * d2, (m + 1) * d2)) for m in range(b)]
            Gp = [[Hprev[i][j] for j in range(r2 + d2, r2 + 2 * d2)] for i in range(r2 + d2, r2 + 2 * d2)]   # Block 2 of H_{s-1}
            Gs = G[0]
            stm['T4.1d lower sub-blocks of G = 2 G_{s-2}'] = all([[Gs[i][j] for j in sub[m]] for i in sub[m]] == [[2 * x for x in row] for row in Gp] for m in range(1, b))
            stm['T4.1d lower sub-blocks uncoupled'] = all(Gs[i][j] == 0 for m in range(1, b) for mp in range(m + 1, b) for i in sub[m] for j in sub[mp])
        stm['T6.2b min diagonal >= D/4'] = 4 * rec['minDiag'] >= D
        rec['minDiagEqualsDOver4'] = 4 * rec['minDiag'] == D   # the note's proof of T6.2(b) says the minimum IS D/4; recorded, not a statement
    stm['T5.1 max column nnz of H = N_s'] = rec['maxColNnzH'] == Ns
    stm['T5.1 max column nnz of H^-1 = N_s'] = rec['maxColNnzHinv'] == Ns
    stm['T5.1 supp(col H^-1) = supp(col H)'] = rec['noFillIn']
    stm['T5.2 DAG depth = s'] = rec['depth'] == s
    if s == 2: stm['T6.1 max column l1 = 7 2^b/(2^b+1)'] = mc == Fr(7 * 2 ** b, 2 ** b + 1)
    stm['T6.2c max column l1 <= 4 N_s^s'] = mc <= 4 * Ns ** s
    stm['T6.2c K <= 4 N_s^s (b^s-1)'] = K <= 4 * Ns ** s * r
    rec['statements'] = stm; rec['allHold'] = all(stm.values())
    return rec

# ---- the run ----------------------------------------------------------------------------------------------------
NOTE_TABLE = {   # the note's Table 1 (p. 11), as printed: max column l1 of D H^-1, and K(b, s)
    (3, 1): ('8/3', '10/3'), (5, 1): ('32/11', '60/11'), (7, 1): ('128/43', '306/43'), (9, 1): ('512/171', '1602/171'),
    (3, 2): ('56/9', '152/9'), (5, 2): ('224/33', '1712/33'), (7, 2): ('896/129', '13736/129'), (9, 2): ('3584/513', '93272/513'),
    (3, 3): ('376/27', '2336/27'), (5, 3): ('1616/99', '46880/99'), (3, 4): ('2480/81', '35296/81')}
rows, prev, reds = [], {}, []
for (b, s) in sorted(GRID, key=lambda t: (t[0] ** t[1], t[0])):   # by size: (b, s-1) always comes before (b, s), the largest last
    A, r, D = matrix_A(b, s); det = abs(int(delta_formula(b, s, Fr(1, 2)) * D ** r))
    t = time.time(); Hp, why = hermite_pari(A, r, det); tp = time.time() - t
    if Hp is None:   # a resource limit is a refusal of that case, recorded, never a pass
        rows.append(dict(b=b, s=s, d=b ** s, r=r, refused='PARI could not compute the Hermite form: ' + why, pariSeconds=round(tp, 1)))
        log(f"b={b:2d} s={s} r={r:5d}  REFUSED (resources): {why[-120:]}"); continue
    impl = ['PARI mathnfmod']; tf = None
    if r <= FLINT_MAX_R:
        t = time.time(); Hf = hermite_flint(A, r); tf = time.time() - t
        if Hf != Hp: die('FLINT and PARI disagree at %s' % ((b, s),))
        impl.append('FLINT hnf')
    cache = os.path.join(HERE, 'cache', f'H-b{b}-s{s}.json.gz')
    if os.path.exists(cache):
        if json.load(gzip.open(cache, 'rt')) != Hp: die('the cached Hermite form of %s differs from PARI\'s' % ((b, s),))
        impl.append('cache (an earlier run)')
    if not canonical(Hp, r, det): die('PARI\'s form is not the canonical Hermite form at %s' % ((b, s),))
    rec = decide(b, s, Hp, r, D, prev.get((b, s - 1)))
    rec.update(hermite=impl, pariSeconds=round(tp, 1), flintSeconds=round(tf, 1) if tf else None,
               Hsha256=hashlib.sha256(json.dumps(Hp).encode()).hexdigest())
    if (b, s) in NOTE_TABLE:
        c, k = NOTE_TABLE[(b, s)]
        rec['noteTable'] = dict(maxColL1=c, K=k, maxColL1Matches=Fr(c) == Fr(rec['maxColL1']), KMatches=Fr(k) == Fr(rec['K']))
    rows.append(rec); prev[(b, s)] = Hp
    bad = [k for k, v in rec['statements'].items() if not v]
    log(f"b={b:2d} s={s} r={r:5d}  K={rec['K_float']:.4f} (K/d {rec['K_over_d']:.3f})  {'ALL HOLD' if not bad else 'FAILS: ' + ', '.join(bad)}"
        + (f"  note's table: l1 {'=' if rec['noteTable']['maxColL1Matches'] else '!='}  K {'=' if rec['noteTable']['KMatches'] else '!='}" if 'noteTable' in rec else '')
        + f"  [{'+'.join(x.split()[0] for x in impl)}; PARI {tp:.1f}s{'' if tf is None else ', FLINT %.1fs' % tf}]")

# RED CONTROLS: each must come out as a failure, or the decisions could not have failed
H3 = prev[(3, 2)]; r3 = len(H3)
Hm = [row[:] for row in H3]; i0 = next(i for i in range(r3) for j in range(i + 1, r3) if Hm[i][j] == 0); j0 = next(j for j in range(i0 + 1, r3) if Hm[i0][j] == 0)
Hm[i0][j0] = 1   # an off-diagonal entry planted outside the support (still reduced)
reds.append(dict(id='an entry planted outside the support', expect='a structural statement fails', fired=not decide(3, 2, Hm, r3, 4, prev[(3, 1)])['allHold']))
Hn = [row[:] for row in H3]; Hn[0][1] = Hn[0][0]   # an entry not reduced modulo its diagonal
reds.append(dict(id='an entry not reduced', expect='not the canonical form', fired=not canonical(Hn, r3, abs(int(delta_formula(3, 2, Fr(1, 2)) * 4 ** r3)))))
H5 = prev[(5, 2)]; r5 = len(H5); d1 = 5; r1 = 4
Hb = [row[:] for row in H5]
for i in range(r1 + 2 * d1, r1 + 3 * d1):     # Block 3's diagonal block doubled: no longer a copy of Block 2's
    for j in range(r1 + 2 * d1, r1 + 3 * d1): Hb[i][j] *= 2
reds.append(dict(id='a diagonal block doubled', expect='T4.1c fails', fired=not decide(5, 2, Hb, r5, 4, prev[(5, 1)])['statements']['T4.1c Blocks 2..b-1 identical']))
H51 = [row[:] for row in prev[(5, 1)]]; H51[0][1] += 1   # one top-row entry of H_1 moved
reds.append(dict(id='a top-row entry of H_1 moved', expect='T3.1 fails', fired=not decide(5, 1, H51, len(H51), 2, None)['statements']['T3.1 H_1 closed form']))
for x in reds: log(f"RED {x['id']}: {'fired' if x['fired'] else 'DID NOT FIRE'}")
if not all(x['fired'] for x in reds): die('a red control did not fire')
held = sum(1 for x in rows if x['allHold'])
log(f"{held} of {len(rows)} (b, s) cases: every statement holds" + ('' if held == len(rows) else ' — see the FAILS lines'))
if CHECK:
    was = json.load(open(OUT)) if os.path.exists(OUT) else None
    if was:
        W = {(x['b'], x['s']): x for x in was['rows']}
        for x in rows:
            w = W.get((x['b'], x['s']))
            if w and (w['K'] != x['K'] or w['Hsha256'] != x['Hsha256'] or w['statements'] != x['statements']): die('%s does not re-derive as recorded' % ((x['b'], x['s']),))
    log('structure battery: %d cases re-derived, both Hermite implementations agree, %d/%d red controls fired' % (len(rows), len(reds), len(reds)))
else:
    rec = dict(what='The Hermite basis H_s of the Erdős #1 construction (paper/erdos1-explicit.md §3), decided against the structural statements of F. Schmidt\'s note of 2026-10-18 (github.com/enzocage/Analytic-Solution-oft-he-Perturbation-Buffer-Problem-for-Erd-s-Problem-1 @ 8564602b; its code not run) over a pre-registered grid of (b, s); H by PARI and, up to r = %d, by FLINT, identical; K(b, s) exact in this repository\'s definition. Written by instruments/erdos1/structure.py.' % FLINT_MAX_R,
               generated=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), seconds=round(time.time() - T0, 1), python=sys.version.split()[0],
               decider=hashlib.sha256(open(os.path.abspath(__file__), 'rb').read()).hexdigest(),
               grid=[list(x) for x in GRID], held=held, cases=len(rows), rows=rows, redControls=reds)
    json.dump(rec, open(OUT, 'w'), indent=1); open(OUT, 'a').write('\n')
    log('wrote ' + os.path.relpath(OUT, ROOT))
