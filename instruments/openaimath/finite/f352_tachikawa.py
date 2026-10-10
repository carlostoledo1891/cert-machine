"""F-352 — "A counterexample to Tachikawa's second conjecture" (openai/math family 199).

THE CLAIM (paper.tex:54-61, sections/introduction.tex:23-36, Theorem thm:main): over k = F_2(q,H_1,H_2) there are a
finite-dimensional symmetric algebra A and a finite-dimensional nonprojective module M with Ext^i_A(M,M) = 0 for every
i > 0. The construction starts from the ten-dimensional algebra C, printed as corners and a COMPLETE 10 x 10
multiplication table (sections/algebra.tex:15-45), said to be the multiplication of the companion paper (F-351); then
T = C x DC, B = C (x) C inside E = T (x) T, a bimodule Y from derived induction, a fiber F, Lambda = [[E,0],[F,E]], the
module Z of eq. t:explicit-module (triangular.tex:184-190), and A = Lambda x D Lambda, M = A (x)_Lambda Z.

WHAT IS DECIDED HERE, exactly over F_2[q] (F_2[q][H, H^-1] for the twist, F_2[q][Q] with Q = q^i for the resolution),
every object parsed from the LaTeX bytes:
  C   (algebra.tex:15-84) the printed table is unital (e + f), respects the printed corners, and equals, entry for
      entry, the product list of the companion paper (its 03-algebra.tex, read here too) — the paper's claim that
      "the multiplication of C is the one in [OpenAIAR2026]"; associative on all 1000 triples; the printed 11-triple
      table (both arrays), and that those are exactly the composable positive-degree triples of degree <= 4; the
      printed grading is homogeneous; the radical span is an ideal, (rad C)^5 = 0, C/rad = k^2.
      eCe = k<x,y>/(x^2, y^2, yx - q^-1 xy) (relations, spanning); fCe = (x + q^-1 y)eCe as right modules via
      t -> x + q^-1 y, j -> q^-1 z (decided for q times that map), with tx = j, ty = q^2 j, jx = jy = 0; that ideal is
      the kernel of r -> (x+y)r (first syzygy of (x+y)eCe).
  T   built, and the paper's formula (a phi b)(c) = phi(bca) checked on all 1000 (a, phi, b); associative on all
      8000 triples; t_T(a,phi) = phi(1) symmetric, t_T((a,phi)(b,psi)) = phi(b) + psi(a) on all 400 letter pairs,
      nondegenerate; rad T = rad C + DC is an ideal, nilpotent, T/rad = k^2. h_H is an automorphism (H indeterminate).
  E, B dim B = 100, dim E = 400; t_E = t_T (x) t_T has Gram G (x) G (G the 20 x 20 Gram of t_T), its 400 x 400
      entries computed: a symmetric permutation matrix, so t_E is symmetric and nondegenerate; the printed corner-
      dimension matrix (a:corner-parity) of B, entry for entry, all even, from corner dimensions 4,2,2,2 of C.
  Prop a:dual-dimensions (algebra.tex:170-252): the z-coefficient pairing eC x Ce -> k has exactly the printed
      nonzero entries ez,xy,yx,ze,uj,vt with coefficients 1,q,1,1,1,q and determinant q^2; e -> z* gives D(eC) = Ce and
      D(Ce) = eC; the two printed surjections Ce -> D(fC) (e -> j*) and eC -> D(Cf) (e -> v*) have the printed images,
      rank four and kernels <l_-2,z>, <l_0,z>; the printed images/kernels of rho_{l_-2} and lambda_{l_0}; the printed
      rho_t, lambda_u, independent and spanning those kernels — so both printed four-term sequences are exact.
  Prop a:resolution (257-338): the printed rho_u, rho_{l_i}, lambda_{l_i} as identities in F_2[q][Q] (all i at once);
      every printed image and kernel decided for EVERY i >= 0 (resp. i >= 1) by the parametrised exact rank of
      _f35x_algebra; R exact at every index; the dual complex: lambda_u injective with image <u,y+qx,z,v>, q l_-1 =
      qx + y, cohomology only the line of v in degree 2, on which vf = v, ve = 0, vt = qz (a boundary): it is Ds.
  stable.tex Lemma e:socle: a f* b = chi(a) chi(b) f* for all 400 letter pairs of T (hence a zeta b = chi(a) chi(b)
      zeta for zeta = f* (x) f* in E, by tensoring); chi is a character of T; f* lies in rad T with f* f = f*;
      sigma_H(zeta) = H^2 zeta.
  bimodule.tex Lemma b:trace-obstruction, its finite core: the functional a -> tr_k(L_a R_{p_f}) on B vanishes on all
      100 basis vectors (so on all of B); dim(p_v B p_f) = 4 for each vertex v; chi_B(p_f) = 1.

WHAT IS NOT DECIDED (theory, not a finite object). The headline — that M is nonprojective with Ext^i_A(M,M) = 0 for
all i > 0 — and everything it rests on: Ext_T^*(s,s) = k[tau], the Kunneth step, symmetric stable duality, the
projective-dimension bounds (a:dimension-bounds, inferred from the exact sequences decided here), the bar-complex
bimodule Y (four cosyzygies of c_5 K, never written out), the stable Hom profile W^a, Lemma b:ordinary-factorization
and the derived-category half of the trace obstruction, the lifts g_H (chosen stable representatives), the fiber F,
Lambda, the complete resolution P and the lift v~ (chosen), the module Z of t:explicit-module, the transfer to
A = Lambda x D Lambda, and the corollaries. F, v~, Z, A and M are not published in checkable form; none is checked.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402,F401
from _f35x_algebra import (LOWER, UPPER, L, C_from_products, Patched, T_from_C, angle_spans, apply_map,  # noqa: E402
                           assoc_failures, between, clean, coords, det_int, e_add, e_mul, e_scale, e_str, endpoints, h,
                           h_el, is_homogeneous, nonzero_words, parse_corners, parse_expr, parse_poly, pmul, rank_for_all,
                           rank_int, same_span, shift_Q, span_decision, span_symbol, spec, split_top, table_after,
                           tuple_after)

DIR = 'preprints/A-counterexample-to-Tachikawas-second-conjecture-September-23-2026/build/sections/'
ALG, STAB, BIM = DIR + 'algebra.tex', DIR + 'stable.tex', DIR + 'bimodule.tex'
AR_ALG = 'preprints/An-explicit-counterexample-to-the-Auslander-Reiten-conjecture-September-23-2026/build/03-algebra.tex'


def parse_table(tex):
    lab = tex.index('\\label{a:multiplication}')
    spec_ = '\\begin{array}{c|cccccccccc}'
    body = tex[tex.rindex(spec_, 0, lab) + len(spec_):tex.rindex('\\end{array}', 0, lab)].replace('\\hline', '')
    rows = [r for r in (clean(x) for x in body.split('\\\\')) if r]
    head = rows[0].split('&')[1:]
    MU = {a: {} for a in LOWER}
    seen = []
    for r in rows[1:]:
        cells = r.split('&')
        a = cells[0]
        seen.append(a)
        for b, c in zip(head, cells[1:]):
            v = parse_expr(c)
            if v:
                MU[a][b] = {l: co for (l, _), co in v.items()}
    return head, seen, MU


def parse_ar_products(tex):
    lab = tex.index('\\label{alg:C-products}')
    body = tex[tex.rindex('\\begin{gathered}', 0, lab) + len('\\begin{gathered}'):tex.rindex('\\end{gathered}', 0, lab)]
    body = body.replace('\\\\', ',').replace('\\qquad', ',')
    prods = {}
    for eq in [clean(x).rstrip('.') for x in split_top(clean(body), ',')]:
        if eq:
            parts = eq.split('=')
            for lhs in parts[:-1]:
                prods[(lhs[0], lhs[1])] = parse_expr(parts[-1])
    return prods


def decide(src=None):
    src = src or Sources()
    checks = []
    alg, stab, bim, ar = (src.text(p) for p in (ALG, STAB, BIM, AR_ALG))
    val = {}

    # ---------------- C
    corners = parse_corners(between(alg, '\\text{corner}', '\\label{a:corners}'))
    check(checks, 'C: the corner table names ten distinct letters, e and f in their own corners',
          sorted(corners) == sorted(LOWER) and corners['e'] == ('e', 'e') and corners['f'] == ('f', 'f'), str(corners))
    head, seen, MUC = parse_table(alg)
    check(checks, 'C: the multiplication table is complete, 10 x 10, rows and columns the ten letters',
          sorted(head) == sorted(LOWER) and sorted(seen) == sorted(LOWER) and len(head) == len(seen) == 10)
    one = e_add(L('e'), L('f'))
    check(checks, 'C: the unit is 1 = e + f (two-sided, from the table rows and columns e, f)',
          all(e_mul(one, L(a), MUC) == L(a) == e_mul(L(a), one, MUC) for a in LOWER))
    cb = [(a, b) for a in LOWER for b, v in MUC[a].items()
          if corners[a][1] != corners[b][0] or any(corners[l] != (corners[a][0], corners[b][1]) for l in v)]
    check(checks, 'C: the table respects the corners (every nonzero product composable, value in the corner)', not cb, str(cb))
    ar_corners = parse_corners(between(ar, '\\text{corner}', '\\label{alg:C-corners}'))
    MU_ar = C_from_products(ar_corners, parse_ar_products(ar))
    diff = [(a, b) for a in LOWER for b in LOWER if MUC[a].get(b, {}) != MU_ar[a].get(b, {})]
    check(checks, 'C: the table equals, entry for entry (100 entries), the multiplication of the companion paper [OpenAIAR2026]',
          ar_corners == corners and not diff and '\\cite[Section~4.1]{OpenAIAR2026}' in alg, str(diff))
    fails = assoc_failures(MUC, LOWER)
    check(checks, 'C: associative on all 10^3 = 1000 basis triples', not fails, str(fails[:5]))
    degs = {}
    for lhs, d in re.findall(r'((?:\\deg [a-z]=)+)(\d)', between(alg, 'Give the basis vectors the degrees', '\\end{gathered}')):
        for ch in re.findall(r'\\deg ([a-z])=', lhs):
            degs[ch] = int(d)
    check(checks, 'C: the printed grading covers the ten letters (e,f:0 u,t:1 x,y,n:2 v,j:3 z:4)',
          degs == {'e': 0, 'f': 0, 'u': 1, 't': 1, 'x': 2, 'y': 2, 'n': 2, 'v': 3, 'j': 3, 'z': 4}, str(degs))
    hb = is_homogeneous(MUC, degs) if len(degs) == 10 else ['grading']
    check(checks, 'C: the table is homogeneous for that grading', not hb, str(hb[:5]))
    printed = {}
    for hdr in ('abc&utu', 'abc&unt'):
        hd, rows = table_after(alg, hdr)
        printed.update(dict(zip(hd, rows['(ab)c=a(bc)'])))
    radC = [a for a in LOWER if a not in 'ef']
    low = sorted(a + b + c for a in radC for b in radC for c in radC
                 if corners[a][1] == corners[b][0] and corners[b][1] == corners[c][0] and degs.get(a, 9) + degs.get(b, 9) + degs.get(c, 9) <= 4)
    check(checks, 'C: the printed triples (two arrays, 5 + 6) are exactly the composable positive-degree triples of degree <= 4',
          sorted(printed) == low and len(printed) == 11, 'printed %s computed %s' % (sorted(printed), low))
    tri_bad = []
    for w, s in printed.items():
        a, b, c = w
        lft = e_mul(e_mul(L(a), L(b), MUC), L(c), MUC)
        rgt = e_mul(L(a), e_mul(L(b), L(c), MUC), MUC)
        if not (lft == rgt == parse_expr(s)):
            tri_bad.append((w, s, e_str(lft), e_str(rgt)))
    check(checks, 'C: (ab)c = a(bc) = the printed value for all 11 printed triples', not tri_bad, str(tri_bad))
    nw = nonzero_words(MUC, radC)
    val['C_nonzero_radical_words_by_length'] = nw
    ideal = all(set(e_mul(L(a), L(b), MUC)) | set(e_mul(L(b), L(a), MUC)) <= {(r, 0) for r in radC} for a in LOWER for b in radC)
    check(checks, 'C: the positive-degree span is a two-sided ideal with fifth power zero; quotient ke + kf = k^2 (e, f orthogonal idempotents)',
          ideal and len(nw) <= 4 and e_mul(L('e'), L('f'), MUC) == {} == e_mul(L('f'), L('e'), MUC), 'nonzero radical words by length %s' % nw)

    xy, yx = e_mul(L('x'), L('y'), MUC), e_mul(L('y'), L('x'), MUC)
    check(checks, 'C: eCe = k<x,y>/(x^2, y^2, yx - q^-1 xy): x^2 = y^2 = 0, q yx = xy, and e, x, y, yx = z span eCe',
          not e_mul(L('x'), L('x'), MUC) and not e_mul(L('y'), L('y'), MUC) and e_scale(yx, 2) == xy and yx == L('z')
          and 'eCe\\cong k\\langle x,y\\rangle/(x^2,y^2,yx-q^{-1}xy)' in alg)
    check(checks, 'C: tx = j, ty = q^2 j, jx = jy = 0 (right-linearity of t -> x + q^-1 y, j -> q^-1 z)',
          e_mul(L('t'), L('x'), MUC) == L('j') and e_mul(L('t'), L('y'), MUC) == e_scale(L('j'), 4)
          and not e_mul(L('j'), L('x'), MUC) and not e_mul(L('j'), L('y'), MUC))
    R = ['e', 'x', 'y', 'z']
    phi = {'t': parse_expr('qx+y'), 'j': L('z')}      # q times the printed map
    lin = all(apply_map(lambda b: phi[b], ['t', 'j'], coords(e_mul(L(w), L(r), MUC), ['t', 'j'])) == e_mul(phi[w], L(r), MUC)
              for w in ('t', 'j') for r in R)
    ideal_span = [v for v in (e_mul(phi['t'], L(r), MUC) for r in R) if v]
    check(checks, 'C: fCe = (x + q^-1 y)eCe as right eCe-modules (the map, scaled by q, is right-linear and its two images are a basis of the ideal)',
          lin and same_span([phi['t'], phi['j']], ideal_span, R, 0) and rank_int([[c.get(0, 0) for c in coords(v, R)] for v in phi.values()]) == 2)
    mxy = lambda b: e_mul(parse_expr('x+y'), L(b), MUC)  # noqa: E731
    kerv = [coords(v, R) for v in (parse_expr('qx+y'), L('z'))]
    check(checks, 'C: (x + q^-1 y)eCe is the kernel of r -> (x+y)r on eCe (first syzygy of (x+y)eCe)',
          all(apply_map(mxy, R, k) == {} for k in kerv) and rank_int([[c.get(0, 0) for c in k] for k in kerv]) == 2
          and rank_int([[c.get(0, 0) for c in coords(mxy(b), R)] for b in R]) == 2)

    # ---------------- T
    MU = T_from_C(MUC)
    ep = endpoints(corners)
    letters = LOWER + UPPER
    fbad = []
    for a in LOWER:
        for b in LOWER:
            for P_ in UPPER:
                lhs = e_mul(e_mul(L(a), L(P_), MU), L(b), MU)
                rhs = {}
                for c in LOWER:     # (a phi b)(c) = phi(b c a)
                    co = e_mul(e_mul(L(b), L(c), MUC), L(a), MUC).get((P_.lower(), 0), 0)
                    if co:
                        rhs[(c.upper(), 0)] = co
                if lhs != rhs:
                    fbad.append(a + P_ + b)
    check(checks, 'T: the paper\'s dual action (a phi b)(c) = phi(bca) holds for all 1000 (a, phi, b) in the constructed T', not fbad, str(fbad[:5]))
    tf = assoc_failures(MU, letters)
    check(checks, 'T: dimension 20, associative on all 20^3 = 8000 basis triples, unit e + f',
          not tf and len(letters) == 20 and all(e_mul(one, L(a), MU) == L(a) == e_mul(L(a), one, MU) for a in letters), str(tf[:5]))

    def tT(x):
        out = {}
        for (l, k), c in x.items():
            if l in 'EF':
                out[k] = out.get(k, 0) ^ c
        return {k: c for k, c in out.items() if c}
    G = [[tT(e_mul(L(a), L(b), MU)) for b in letters] for a in letters]

    def phipsi(a, b):     # phi(b) + psi(a) for letters a = (a0, phi), b = (b0, psi)
        s = 0
        if a.isupper() and b.islower():
            s ^= int(a.lower() == b)
        if b.isupper() and a.islower():
            s ^= int(b.lower() == a)
        return {0: 1} if s else {}
    check(checks, 'T: t_T((a,phi)(b,psi)) = phi(b) + psi(a) on all 400 letter pairs; symmetric',
          all(G[i][j] == phipsi(letters[i], letters[j]) == G[j][i] for i in range(20) for j in range(20)))
    Gi = [[g.get(0, 0) for g in row] for row in G]
    perm = all(sorted(row) == [0] * 19 + [1] for row in Gi) and sorted(row.index(1) for row in Gi) == list(range(20))
    check(checks, 'T: the Gram matrix of t_T is a permutation matrix (a <-> a*), rank 20: t_T is nondegenerate',
          perm and rank_int(Gi) == 20)
    radT = [a for a in letters if a not in 'ef']
    nwT = nonzero_words(MU, radT)
    val['T_nonzero_radical_words_by_length'] = nwT
    idealT = all(set(e_mul(L(a), L(b), MU)) | set(e_mul(L(b), L(a), MU)) <= {(r, 0) for r in radT} for a in letters for b in radT)
    check(checks, 'T: rad T = (rad C) + DC: an ideal, nilpotent (index %d), T/rad = k^2' % (len(nwT) + 1), idealT and len(nwT) < 20, 'nonzero radical words by length %s' % nwT)
    check(checks, 'T: h_H (fix C, scale DC by H) is an algebra automorphism, H an indeterminate',
          all(h_el(e_mul(L(a), L(b), MU)) == e_mul(h(a), h(b), MU) for a in letters for b in letters))

    # ---------------- B, E
    check(checks, 'B, E: dim B = 10^2 = 100 and dim E = 20^2 = 400, as printed', '\\(\\dim_k B=100\\) and \\(\\dim_k E=400\\)' in alg
          and len(LOWER) ** 2 == 100 and len(letters) ** 2 == 400)
    ge_ok, cols = True, set()
    for i1 in range(20):
        for i2 in range(20):
            row = [(j1, j2) for j1 in range(20) if Gi[i1][j1] for j2 in range(20) if Gi[i2][j2]]
            ge_ok &= len(row) == 1 and Gi[row[0][0]][i1] == 1 and Gi[row[0][1]][i2] == 1
            cols.add(row[0] if row else None)
    check(checks, 'E: t_E = t_T (x) t_T has Gram G (x) G on the 400 x 400 basis pairs — a symmetric permutation matrix: symmetric, nondegenerate',
          ge_ok and len(cols) == 400 and None not in cols)
    verts = [('e', 'e'), ('e', 'f'), ('f', 'e'), ('f', 'f')]
    cdim = [[sum(1 for a in LOWER for b in LOWER
                 if e_mul(e_mul(L(p[0]), L(a), MUC), L(pp[0]), MUC) == L(a) and e_mul(e_mul(L(p[1]), L(b), MUC), L(pp[1]), MUC) == L(b))
             for pp in verts] for p in verts]
    pm = between(alg, '\\bigl(\\dim_k(pB p\')\\bigr)_{p,p\'}=', '\\end{pmatrix}')
    pm = pm[pm.index('\\begin{pmatrix}') + len('\\begin{pmatrix}'):]
    printed_m = [[int(x) for x in clean(r).split('&')] for r in pm.split('\\\\') if clean(r)]
    cC = [sum(1 for a in LOWER if corners[a] == v) for v in verts]
    val['B_corner_dims'] = cdim
    check(checks, 'B: the printed corner-dimension matrix (16 8 8 4 / 8 8 4 4 / 8 4 8 4 / 4 4 4 4) is computed exactly; all entries even; '
          'products of the corner dimensions 4,2,2,2 of C', printed_m == cdim and all(x % 2 == 0 for r in cdim for x in r) and cC == [4, 2, 2, 2]
          and 'e\\otimes e,e\\otimes f,f\\otimes e,f\\otimes f' in alg, 'computed %s' % cdim)

    # ---------------- Prop a:dual-dimensions
    eC, Ce, fC, Cf = ['e', 'x', 'y', 'z', 'u', 'v'], ['e', 'x', 'y', 'z', 't', 'j'], ['f', 't', 'j', 'n'], ['f', 'u', 'v', 'n']
    check(checks, 'dual: the printed ordered bases of eC and Ce are the letters with left / right idempotent e',
          '\\mathcal B_{eC}=(e,x,y,z,u,v),\\qquad' in alg and '\\mathcal B_{Ce}=(e,x,y,z,t,j)' in alg
          and eC == [a for a in LOWER if corners[a][0] == 'e'] and Ce == [a for a in LOWER if corners[a][1] == 'e'])
    pair = [[e_mul(L(a), L(b), MUC).get(('z', 0), 0) for b in Ce] for a in eC]
    mp = re.search(r'products\s+\\\(([a-z,]+)\\\),\s+with coefficients\s+\\\(([^\\]+)\\\)', alg)
    nz = {a + b: pair[i][j] for i, a in enumerate(eC) for j, b in enumerate(Ce) if pair[i][j]}
    printed_nz = mp and dict(zip(mp.group(1).split(','), [parse_poly(c).get(0) for c in mp.group(2).split(',')]))
    dt = det_int(pair)
    val['pairing_det'] = dt
    check(checks, 'dual: the z-coefficient pairing eC x Ce has exactly the printed nonzero entries ez,xy,yx,ze,uj,vt with coefficients 1,q,1,1,1,q',
          bool(mp) and nz == printed_nz, 'computed %s' % nz)
    check(checks, 'dual: its determinant is q^2 != 0, as printed', dt == 4 and 'Thus it has determinant \\(q^2\\ne0\\)' in alg, str(dt))
    DeC, DCe = [a.upper() for a in eC], [a.upper() for a in Ce]
    zr = [coords(e_mul(L(a), L('Z'), MU), DeC) for a in Ce]
    zl = [coords(e_mul(L('Z'), L(a), MU), DCe) for a in eC]
    check(checks, 'dual: e -> z* gives D(eC) = Ce (a -> a z*) and D(Ce) = eC (a -> z* a), both bijective',
          rank_int([[c.get(0, 0) for c in v] for v in zr]) == 6 and rank_int([[c.get(0, 0) for c in v] for v in zl]) == 6)
    DfC, DCf = [a.upper() for a in fC], [a.upper() for a in Cf]
    s1 = tuple_after(alg, 'Ce\\longrightarrow D(fC):\\quad', '\\longmapsto')
    s2 = tuple_after(alg, 'eC\\longrightarrow D(Cf):\\quad', '\\longmapsto')
    check(checks, 'dual: Ce -> D(fC), e -> j*, sends (e,x,y,z,t,j) to the printed (j*, t*, q^2 t*, 0, q n*, f*)',
          [e_mul(L(a), L('J'), MU) for a in Ce] == s1)
    check(checks, 'dual: eC -> D(Cf), e -> v*, sends (e,x,y,z,u,v) to the printed (v*, u*, u*, 0, n*, f*)',
          [e_mul(L('V'), L(a), MU) for a in eC] == s2)
    kk = angle_spans(between(alg, 'Each has rank four; their kernels are respectively', 'The intermediate maps'))
    ok1, d1 = span_decision(lambda b: e_mul(L(b), L('J'), MU), Ce, DfC, [a.lower() + '^*' for a in DfC], kk[0], 0)
    ok2, d2 = span_decision(lambda b: e_mul(L('V'), L(b), MU), eC, DCf, [a.lower() + '^*' for a in DCf], kk[1], 0)
    check(checks, 'dual: both have rank four (onto D(fC), D(Cf)) with kernels <l_-2,z> and <l_0,z>', ok1 and ok2
          and kk == [['\\ell_{-2}', 'z'], ['\\ell_0', 'z']], d1 + ' | ' + d2)
    tb = angle_spans(between(alg, '\\text{map}&\\text{image}&\\text{kernel}', '\\end{array}'))
    l_m2 = span_symbol('\\ell_{-2}')
    ok3, d3 = span_decision(lambda b: e_mul(L(b), l_m2, MU), Ce, Ce, tb[0], tb[1], 0)
    ok4, d4 = span_decision(lambda b: e_mul(span_symbol('\\ell_0'), L(b), MU), eC, eC, tb[2], tb[3], 0)
    check(checks, 'dual: rho_{l_-2} on Ce has image <l_-2,z>, kernel <y+qx,z,t,j>; lambda_{l_0} on eC has image <l_0,z>, kernel <y+qx,z,u,v>',
          ok3 and ok4 and tb == [['\\ell_{-2}', 'z'], ['y+qx', 'z', 't', 'j'], ['\\ell_0', 'z'], ['y+qx', 'z', 'u', 'v']], d3 + ' | ' + d4)
    rt = tuple_after(alg, '\\rho_t:(f,u,v,n)', '\\longmapsto')
    lu = tuple_after(alg, '\\lambda_u:(f,t,j,n)', '\\longmapsto')
    rt_ok = [e_mul(L(a), L('t'), MUC) for a in Cf] == rt and rank_int([[c.get(0, 0) for c in coords(v, Ce)] for v in rt]) == 4 \
        and same_span(rt, [span_symbol(s) for s in tb[1]], Ce, 0)
    lu_ok = [e_mul(L('u'), L(a), MUC) for a in fC] == lu and rank_int([[c.get(0, 0) for c in coords(v, eC)] for v in lu]) == 4 \
        and same_span(lu, [span_symbol(s) for s in tb[3]], eC, 0)
    check(checks, 'dual: rho_t (f,u,v,n) -> (t, y+qx, qz, qj) and lambda_u (f,t,j,n) -> (u, y+qx, z, v) as printed; each four independent, spanning the kernel',
          rt_ok and lu_ok)
    check(checks, 'dual: both printed sequences 0 -> Cf -> Ce -> Ce -> D(fC) -> 0 and 0 -> fC -> eC -> eC -> D(Cf) -> 0 are exact',
          ok1 and ok2 and ok3 and ok4 and rt_ok and lu_ok and same_span([span_symbol(s) for s in kk[0]], [span_symbol(s) for s in tb[0]], Ce, 0)
          and same_span([span_symbol(s) for s in kk[1]], [span_symbol(s) for s in tb[2]], eC, 0))

    # ---------------- Prop a:resolution, for every i
    ell = parse_expr('\\ell_i')
    ru = tuple_after(alg, '\\rho_u(e,x,y,z,t,j)', '=')
    rl = tuple_after(alg, '\\rho_{\\ell_i}(e,x,y,z,t,j)', '=')
    ll = tuple_after(alg, '\\lambda_{\\ell_i}(e,x,y,z,u,v)', '=')
    check(checks, 'res: the printed rho_u, rho_{l_i} (on Ce) and lambda_{l_i} (on eC) hold as identities in F_2[q][Q], Q = q^i (all i)',
          [e_mul(L(a), L('u'), MUC) for a in Ce] == ru and [e_mul(L(a), ell, MUC) for a in Ce] == rl
          and [e_mul(ell, L(a), MUC) for a in eC] == ll)
    sp = angle_spans(between(alg, 'is nonzero.\nConsequently', 'The first image is'))
    o1, e1 = span_decision(lambda b: e_mul(L(b), L('u'), MUC), Ce, Cf, sp[0], sp[1], 0)
    o2, e2 = span_decision(lambda b: e_mul(L(b), ell, MUC), Ce, Ce, sp[2], sp[3], 0)
    check(checks, 'res: rho_u has image <u,v,n> = rad(Cf), kernel <l_0,z,j>; rho_{l_i} has image <l_i,z,j>, kernel <l_(i+1),z,j>, for EVERY i >= 0',
          o1 and o2 and sp == [['u', 'v', 'n'], ['\\ell_0', 'z', 'j'], ['\\ell_i', 'z', 'j'], ['\\ell_{i+1}', 'z', 'j']]
          and sorted(sp[0]) == sorted(a for a in Cf if a != 'f'), e1 + ' | ' + e2)
    check(checks, 'res: each later image is the preceding kernel — the resolution R of s is exact at every index',
          same_span([span_symbol(s) for s in sp[1]], [spec(span_symbol(s), 0) for s in sp[2]], Ce, 0)
          and same_span([shift_Q(span_symbol(s), 1) for s in sp[2]], [span_symbol(s) for s in sp[3]], Ce, 0))
    check(checks, 'res: the dual complex starts injectively, lambda_u with image <u,y+qx,z,v>',
          rank_int([[c.get(0, 0) for c in coords(v, eC)] for v in lu]) == 4
          and same_span(lu, [span_symbol(s) for s in angle_spans(between(alg, 'The first arrow is injective, with image', 'For \\(i\\ge0\\)'))[0]], eC, 0))
    sp2 = angle_spans(between(alg, 'The image and kernel are therefore', 'Since \\(q\\ell_{-1}=qx+y\\)'))
    o3, e3 = span_decision(lambda b: e_mul(span_symbol('\\ell_0'), L(b), MUC), eC, eC, sp2[0], sp2[1], 0)
    o4, e4 = span_decision(lambda b: e_mul(ell, L(b), MUC), eC, eC, sp2[2], sp2[3], 1)
    check(checks, 'res: lambda_{l_0} has image <l_0,z>, kernel <l_-1,z,u,v>; lambda_{l_i} has image <l_i,z,v>, kernel <l_(i-1),z,v>, for EVERY i >= 1',
          o3 and o4 and sp2 == [['\\ell_0', 'z'], ['\\ell_{-1}', 'z', 'u', 'v'], ['\\ell_i', 'z', 'v'], ['\\ell_{i-1}', 'z', 'v']], e3 + ' | ' + e4)
    check(checks, 'res: q l_-1 = qx + y, so ker(lambda_{l_0}) = im(lambda_u)',
          span_symbol('\\ell_{-1}') == parse_expr('qx+y') and same_span(lu, [span_symbol(s) for s in sp2[1]], eC, 0))
    coh = rank_for_all([coords(x, eC) for x in (span_symbol('\\ell_0'), L('z'), L('v'))], 0)[0] == {3} and \
        same_span([span_symbol(s) for s in ['\\ell_0', 'z', 'v']], [spec(span_symbol(s), 1) for s in sp2[3]], eC, 0) and \
        same_span([shift_Q(span_symbol(s), 1) for s in sp2[3]], [span_symbol(s) for s in sp2[2]], eC, 0)
    check(checks, 'res: the only cohomology is <l_0,z,v>/<l_0,z> = k v-bar in degree 2 (ker lambda_{l_(i+1)} = im lambda_{l_i} for i >= 1)',
          coh and o3 and o4 and '{\\langle\\ell_0,z,v\\rangle_k}\n     {\\langle\\ell_0,z\\rangle_k}=k\\overline v' in alg)
    vr = {b: e_mul(L('v'), L(b), MUC) for b in LOWER}
    check(checks, 'res: vf = v, ve = 0, and vt = qz (in im lambda_{l_0}) is the only nonzero radical product: the line is Ds',
          vr['f'] == L('v') and not vr['e'] and {b for b in radC if vr[b]} == {'t'} and vr['t'] == e_scale(L('z'), 2))

    # ---------------- stable.tex: the socle element, the character, the twist
    chi = {a: int(a == 'f') for a in letters}
    check(checks, 'socle: chi (f -> 1, every other letter -> 0) is a character of T: chi(ab) = chi(a) chi(b) on all 400 pairs',
          all(e_mul(L(a), L(b), MU).get(('f', 0), 0) == chi[a] * chi[b] for a in letters for b in letters))
    soc = all(e_mul(e_mul(L(a), L('F'), MU), L(b), MU) == ({('F', 0): 1} if chi[a] and chi[b] else {}) for a in letters for b in letters)
    check(checks, 'socle: a f* b = chi(a) chi(b) f* for all 400 letter pairs of T (so a zeta b = chi(a) chi(b) zeta in E by tensoring)',
          soc and 'a\\zeta b=\\chi(a)\\chi(b)\\zeta' in stab)
    check(checks, 'socle: f* lies in rad T with f* f = f* (zeta in (rad E) p_f); sigma_H(zeta) = h(f*) (x) h(f*) = H^2 zeta',
          'F' in radT and e_mul(L('F'), L('f'), MU) == L('F') and h('F') == {('F', 1): 1})

    # ---------------- bimodule.tex: the finite core of the trace obstruction
    def coef_f(x, letter):
        return x.get((letter, 0), 0)
    tr_bad = []
    for a1 in LOWER:
        for a2 in LOWER:
            tr = 0
            for c1 in LOWER:
                x1 = coef_f(e_mul(e_mul(L(a1), L(c1), MUC), L('f'), MUC), c1)
                if not x1:
                    continue
                for c2 in LOWER:
                    tr ^= pmul(x1, coef_f(e_mul(e_mul(L(a2), L(c2), MUC), L('f'), MUC), c2))
            if tr:
                tr_bad.append(a1 + a2)
    check(checks, 'trace: tr_k(L_a R_{p_f}) on B vanishes for all 100 basis vectors a of B (so for every a in B)', not tr_bad, str(tr_bad))
    check(checks, 'trace: dim(p_v B p_f) = 4 for each of the four vertices v (the p_f column of the corner matrix); chi_B(p_f) = 1',
          [r[3] for r in cdim] == [4, 4, 4, 4] and chi['f'] * chi['f'] == 1 and '\\(\\dim_k(p_vBp_f)=4\\) for every \\(v\\)' in bim)

    val.update({'C_dim': 10, 'T_dim': 20, 'B_dim': 100, 'E_dim': 400})
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the ten-dimensional algebra C (and its identity with the companion paper\'s), T and its '
                       'symmetrizing form, E = T (x) T symmetric nondegenerate, the corner table of B, the exact sequences of '
                       'Prop a:dual-dimensions, the resolution of s for every i, the socle element and the finite trace computation '
                       '— not the Ext vanishing over A (Y, F, Lambda, Z, A, M are not published)',
            'value': val}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(Patched([(ALG, 't&t&0&j&q^2j&0', 't&t&0&j&qj&0')]))
    out.append(('C: the table entry t.y = q^2 j changed to q j', r['verdict']))
    r = decide(Patched([(ALG, '16&8&8&4\\\\', '12&8&8&4\\\\')]))
    out.append(('B: the printed corner dimension dim(eeB ee) = 16 changed to 12', r['verdict']))
    r = decide(Patched([(ALG, 'with coefficients \\(1,q,1,1,1,q\\)', 'with coefficients \\(1,q,1,1,1,1\\)')]))
    out.append(('dual: the printed pairing coefficient of vt changed from q to 1', r['verdict']))
    r = decide(Patched([(ALG, '=(\\ell_i,q^iz,qz,0,(1+q^i)v,0)', '=(\\ell_i,q^iz,qz,0,(1+q^{i+1})v,0)')]))
    out.append(('res: the printed lambda_{l_i}(u) = (1+q^i)v changed to (1+q^(i+1))v', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    import time
    t0 = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t0))
    t1 = time.time()
    for d, v in forge():
        print('forge:', v, '-', d)
    print('forges %.1fs' % (time.time() - t1))
