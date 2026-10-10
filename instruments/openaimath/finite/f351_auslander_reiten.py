"""F-351 — "An explicit counterexample to the Auslander-Reiten conjecture" (openai/math family 199).

THE CLAIM (main.tex:48, 01-introduction.tex:26-38, Theorem thm:main): over k = F_2(q,H_1,H_2) there are a
finite-dimensional algebra Lambda and a finite-dimensional nonprojective left module Z with
Ext^i(Z,Z) = 0 = Ext^i(Z,Lambda) for every i >= 1; Lambda/rad = k^8, rad(Lambda)^4 != 0. The construction starts from a
ten-dimensional algebra C printed by corners and products (03-algebra.tex:12-33), its trivial extension T = C x DC
(03-algebra.tex:80-124), and a degree-three Hochschild cochain p on T printed as a 179-entry table
(09-cochain.tex:15-45), with A = T (x) T, Lambda = [[A,0],[F,A]].

WHAT IS DECIDED HERE, exactly over F_2[q] (and F_2[q][H, H^-1] for the twist, F_2[q][Q] with Q = q^i for the
resolution) — every printed object and number of the finite core, parsed from the LaTeX bytes:
  C   (03-algebra.tex:12-62) the corners and the product list define a unital algebra respecting the corners;
      associativity on all 10^3 basis triples; the printed 11-triple associativity table (values and both
      bracketings), and that those 11 are exactly the composable radical triples of total degree <= 4; the grading
      is homogeneous; the radical span N is an ideal with N^5 = 0, utut = q(1+q)z != 0, C/N = k x k.
      Remark alg:antecedent (64-78): eCe has x^2 = y^2 = 0, xy = q yx, z = yx; fCe = (x + q^-1 y)R as right
      R-modules by t -> x + q^-1 y, j -> q^-1 z (decided for q times that map); that ideal is the kernel of
      r -> (x+y)r on R (the first syzygy of (x+y)R).
  T   (80-124) built from the printed dual actions: 20 letters, associative on all 20^3 triples, unital; the printed
      transposition recurrences (09-cochain.tex:58-63); lambda(a,phi) = phi(1) is symmetric with trace-dual of each
      letter its starred letter (Gram = permutation matrix, rank 20); the dual of iCj lies in jLi; radical span r an
      ideal, r^6 = 0 (counted by nonzero radical words), T/r = k x k; deg(a*) = 5 - deg(a) homogeneous, max 5.
      h_H (fix C, scale DC by H) is an algebra automorphism for an indeterminate H.
  p   (09-cochain.tex) 179 entries with distinct inputs (printed count); radical composable inputs, output with the
      same endpoints; weight -1 (one more capital in than out); the normalized Hochschild cocycle equation
      (coc:closure-recurrence) on ALL 18^4 = 104,976 radical four-words, of which exactly 15,250 are composable
      (printed counts); the boundary identity coc:boundary for all 324 pairs and every output, with H an
      indeterminate (03-algebra.tex:179-185), and separately its two printed coefficient forms
      (09-cochain.tex:100-110); the z_H support set equals the gamma set; p(t,x,J) = 0, p(t,y,J) = q^3 f; the
      products tx = j, ty = q^2 j, xJ = T, yJ = q^2 T; zeta = q^2[t|x|J] + [t|y|J] is a cycle of the two-sided-simple
      bar complex and pairs with p to q^3 != 0; every entry with output f has exactly one capital input.
  res (04-resolution.tex:22-105, Lemma res:base) the printed tables for a u, a l_i, l_i a, u (f,t,j,n), as
      identities in F_2[q][Q] (so for every i >= 0 at once); every printed image and kernel, decided for EVERY
      i >= 0 (resp. i >= 1) by the parametrised exact rank of _f35x_algebra (finitely many exact computations);
      hence exactness of R at every index, Ext_C^i(s,C) supported in degree 2 on the line of v, whose right action
      is that of s^r (vf = v, ve = 0, vt = qz a boundary).
  lift (06-lift.tex:72-90, 125-136, 259-262) w w* = left(w)*, w* w = right(w)*; row and column dimensions 6,4;
      pi(xi_H) = 0; the endpoint identity lift:endpoint for r = e, f; the coevaluation h(a) xi_H = xi_H a in
      T (x)_I T for all 20 letters; the projected identity lift:projected-casimir for all 18 radical letters; the
      evaluation H f*. 08-consequences.tex:38-44: (ut)^2 = (y+qx)^2 = q(1+q)z, eu = u, ue = 0.
  dims dim C = 10, dim T = 20, dim A = 400 (20^2), 2 dim A = 800.

WHAT IS NOT DECIDED (theory, not a finite object). The headline: Ext^i_Lambda(Z,Z) = Ext^i_Lambda(Z,Lambda) = 0 for
every i >= 1, Gorenstein-projectivity and nonprojectivity of Z, Lambda/rad = k^8 and rad(Lambda)^4 != 0 for Lambda
itself, and persistence under field extension. These rest on the paper's homological arguments: Ext_T^*(s,s) = k[tau]
(the triangle res:triangle and Yoneda products), the Kunneth step to A, symmetric stable duality, the two-cone Hom
profile, the chain-level lifts (Lemmas lift:B, lift:G — whose G_i are chosen by projectivity, not printed), and the
fiber F, which is defined as the kernel of a map built from CHOSEN representatives g_i of stable classes (07-branches
.tex:68-78): F, Lambda and Z are never published as finite tables, so none of them is checked here. That the class of
p is nonzero in Ext^3 from the cycle pairing, and that p is a chain map P -> P[3], are the paper's (standard)
arguments; this decider certifies the finite identities they consume.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402,F401
from _f35x_algebra import (LOWER, UPPER, L, C_from_products, Patched, T_from_C, angle_spans, apply_map,  # noqa: E402
                           assoc_failures, between, clean, coords, e_add, e_mul, e_scale, e_str, endpoints, eps, h,
                           h_el, is_homogeneous, letter_el, nonzero_words, parse_corners, parse_expr, parse_poly, pmul,
                           pstr, rank_for_all, rank_int, same_span, shift_Q, span_decision, span_symbol, spec,
                           split_top, star, table_after)

DIR = 'preprints/An-explicit-counterexample-to-the-Auslander-Reiten-conjecture-September-23-2026/build/'
ALG, RES, LIFT, CONS, COC, INTRO = (DIR + f for f in ('03-algebra.tex', '04-resolution.tex', '06-lift.tex',
                                                       '08-consequences.tex', '09-cochain.tex', '01-introduction.tex'))
RAD = [a for a in LOWER + UPPER if a not in 'ef']


# ------------------------------------------------------------------ parsing

def parse_products(tex):
    lab = tex.index('\\label{alg:C-products}')
    body = tex[tex.rindex('\\begin{gathered}', 0, lab) + len('\\begin{gathered}'):tex.rindex('\\end{gathered}', 0, lab)]
    body = body.replace('\\\\', ',').replace('\\qquad', ',')
    prods = {}
    for eq in [clean(x).rstrip('.') for x in split_top(clean(body), ',')]:
        if not eq:
            continue
        parts = eq.split('=')
        val = parse_expr(parts[-1])
        for lhs in parts[:-1]:
            if len(lhs) != 2 or (lhs[0], lhs[1]) in prods:
                raise ValueError('product ' + eq)
            prods[(lhs[0], lhs[1])] = val
    return prods


def parse_cochain(tex):
    tab = between(tex, '\\begin{tabular}', '\\end{tabular}')
    entries = []
    for coef, words in re.findall(r'\$([^$]+)\$\s*&\s*\\texttt\{([^}]*)\}', tab):
        c = parse_poly(clean(coef))
        if list(c) != [0]:
            raise ValueError('coefficient ' + coef)
        for w in words.split():
            entries.append((w, c[0]))
    return entries


# ------------------------------------------------------------------ T (x)_I T

def tens(x, y, ep):
    out = {}
    for (a, k1), c1 in x.items():
        for (b, k2), c2 in y.items():
            if ep[a][1] == ep[b][0]:
                key = (a, b, k1 + k2)
                v = out.get(key, 0) ^ pmul(c1, c2)
                if v:
                    out[key] = v
                else:
                    out.pop(key, None)
    return out


def t_add(*xs):
    out = {}
    for x in xs:
        for key, c in x.items():
            v = out.get(key, 0) ^ c
            if v:
                out[key] = v
            else:
                out.pop(key, None)
    return out


# ------------------------------------------------------------------ decide

def decide(src=None):
    src = src or Sources()
    checks = []
    alg, coc, res, lift, cons, intro = (src.text(p) for p in (ALG, COC, RES, LIFT, CONS, INTRO))
    val = {}

    # ---------------- C
    corners = parse_corners(between(alg, '\\text{corner}', '\\label{alg:C-corners}'))
    check(checks, 'C: the corner table names ten distinct basis letters, two idempotents e, f in their own corners',
          sorted(corners) == sorted(LOWER) and corners['e'] == ('e', 'e') and corners['f'] == ('f', 'f'), str(corners))
    prods = parse_products(alg)
    val['C_product_rules'] = len(prods)
    MUC = C_from_products(corners, prods)
    bad_corner = [(a, b) for (a, b), v in prods.items()
                  if corners[a][1] != corners[b][0] or any(corners[l] != (corners[a][0], corners[b][1]) for (l, _) in v)]
    check(checks, 'C: every printed product respects the corners (composable, value in the right corner)', not bad_corner, str(bad_corner))
    one = e_add(L('e'), L('f'))
    check(checks, 'C: 1 = e + f is a two-sided unit', all(e_mul(one, L(a), MUC) == L(a) == e_mul(L(a), one, MUC) for a in LOWER))
    fails = assoc_failures(MUC, LOWER)
    check(checks, 'C: associative on all 10^3 = 1000 basis triples', not fails, str(fails[:5]))
    check(checks, 'C: dimension ten', len(LOWER) == 10 and len(set(corners)) == 10)

    deg = {'e': 0, 'f': 0, 'u': 1, 't': 1, 'x': 2, 'y': 2, 'n': 2, 'v': 3, 'j': 3, 'z': 4}
    check(checks, 'C: the paper prints the grading u,t:1  x,y,n:2  v,j:3  z:4, idempotents 0',
          'Give $u,t$ degree one, $x,y,n$ degree two, $v,j$ degree three, and $z$\ndegree four; the idempotents have degree zero.' in alg)
    hb = is_homogeneous(MUC, deg)
    check(checks, 'C: every product is homogeneous for that grading', not hb, str(hb[:5]))

    head, rows = table_after(alg, 'abc&utu')
    printed = dict(zip(head, rows['(ab)c=a(bc)']))
    radC = [a for a in LOWER if a not in 'ef']
    low_triples = sorted(a + b + c for a in radC for b in radC for c in radC
                         if corners[a][1] == corners[b][0] and corners[b][1] == corners[c][0] and deg[a] + deg[b] + deg[c] <= 4)
    check(checks, 'C: the 11 printed triples are exactly the composable radical triples of total degree <= 4',
          sorted(printed) == low_triples and len(printed) == 11, 'printed %s, computed %s' % (sorted(printed), low_triples))
    tri_bad = []
    for w, s in printed.items():
        a, b, c = w
        lft = e_mul(e_mul(L(a), L(b), MUC), L(c), MUC)
        rgt = e_mul(L(a), e_mul(L(b), L(c), MUC), MUC)
        if not (lft == rgt == parse_expr(s)):
            tri_bad.append((w, s, e_str(lft), e_str(rgt)))
    check(checks, 'C: the printed associativity table — (ab)c = a(bc) = the printed value for all 11', not tri_bad, str(tri_bad))

    nw = nonzero_words(MUC, radC)
    val['C_nonzero_radical_words_by_length'] = nw
    ideal = all(set(l for (l, _) in e_mul(L(a), L(b), MUC)) <= set(radC) for a in LOWER for b in radC) and \
        all(set(l for (l, _) in e_mul(L(b), L(a), MUC)) <= set(radC) for a in LOWER for b in radC)
    check(checks, 'C: the span N of the eight non-idempotent letters is a two-sided ideal', ideal)
    check(checks, 'C: (rad C)^5 = 0 (no nonzero product of five radical letters) and N^4 != 0', len(nw) == 4, 'nonzero words by length %s' % nw)
    utut = e_mul(e_mul(e_mul(L('u'), L('t'), MUC), L('u'), MUC), L('t'), MUC)
    check(checks, 'C: utut = q(1+q)z != 0 (Lemma alg:C, and (ut)^2 = (y+qx)^2 in 08-consequences)',
          utut == {('z', 0): pmul(2, 3)} and e_mul(L('u'), L('t'), MUC) == parse_expr('y+qx')
          and e_mul(parse_expr('y+qx'), parse_expr('y+qx'), MUC) == utut
          and 'utut=q(1+q)z\\ne0' in alg and '(ut)^2=(y+qx)^2=q(1+q)z\\ne0' in cons, e_str(utut))
    check(checks, 'C/N = k x k: e, f orthogonal idempotents', e_mul(L('e'), L('e'), MUC) == L('e') and e_mul(L('f'), L('f'), MUC) == L('f')
          and not e_mul(L('e'), L('f'), MUC) and not e_mul(L('f'), L('e'), MUC))
    check(checks, '08-consequences: eu = u and ue = 0 (C noncommutative)', e_mul(L('e'), L('u'), MUC) == L('u') and not e_mul(L('u'), L('e'), MUC))

    # Remark alg:antecedent
    xy, yx = e_mul(L('x'), L('y'), MUC), e_mul(L('y'), L('x'), MUC)
    check(checks, 'Remark: eCe = k<x,y>/(x^2, y^2, xy - q yx) with z = yx (relations hold; e,x,y,yx span eCe)',
          not e_mul(L('x'), L('x'), MUC) and not e_mul(L('y'), L('y'), MUC) and xy == e_scale(yx, 2) and yx == L('z'))
    check(checks, 'Remark: fCe has actions tx = j, ty = q^2 j, jx = jy = 0',
          e_mul(L('t'), L('x'), MUC) == L('j') and e_mul(L('t'), L('y'), MUC) == e_scale(L('j'), 4)
          and not e_mul(L('j'), L('x'), MUC) and not e_mul(L('j'), L('y'), MUC))
    R = ['e', 'x', 'y', 'z']
    phi = {'t': parse_expr('qx+y'), 'j': L('z')}     # q times the printed t -> x + q^-1 y, j -> q^-1 z
    lin = all(apply_map(lambda b: phi[b], ['t', 'j'], coords(e_mul(L(w), L(r), MUC), ['t', 'j'])) == e_mul(phi[w], L(r), MUC)
              for w in ('t', 'j') for r in R)
    ideal_span = [e_mul(phi['t'], L(r), MUC) for r in R]
    iso = same_span([phi['t'], phi['j']], [v for v in ideal_span if v], ['e', 'x', 'y', 'z'], 0) and \
        rank_int([[c.get(0, 0) for c in coords(v, R)] for v in (phi['t'], phi['j'])]) == 2
    check(checks, 'Remark: t -> x + q^-1 y, j -> q^-1 z (scaled by q) is right R-linear onto the right ideal (x + q^-1 y)R, bijective', lin and iso)
    kerv = [coords(v, R) for v in (parse_expr('qx+y'), L('z'))]
    mxy = lambda b: e_mul(parse_expr('x+y'), L(b), MUC)  # noqa: E731
    syz = all(apply_map(mxy, R, k) == {} for k in kerv) and rank_int([[c.get(0, 0) for c in k] for k in kerv]) == 2 and rank_int([[c.get(0, 0) for c in coords(mxy(b), R)] for b in R]) == 2
    check(checks, 'Remark: (x + q^-1 y)R is the kernel of r -> (x+y)r on R (first syzygy of (x+y)R)', syz)

    # ---------------- T
    MU = T_from_C(MUC)
    ep = endpoints(corners)
    letters = LOWER + UPPER
    check(checks, 'T: twenty basis letters (lower case and their duals), dimension 20', len(set(letters)) == 20)
    rec_ok = True
    for a in LOWER:
        for b in LOWER:
            for c in LOWER:
                rec_ok &= MU[a].get(b.upper(), {}).get(c.upper(), 0) == MUC[c].get(a, {}).get(b, 0)
                rec_ok &= MU[b.upper()].get(a, {}).get(c.upper(), 0) == MUC[a].get(c, {}).get(b, 0)
            rec_ok &= not MU[a.upper()].get(b.upper())
    check(checks, 'T: the printed transposition recurrences coc:transpose-recurrence hold for the dual actions alg:dual-actions', rec_ok)
    check(checks, 'T: the dual of a corner iCj lies in jLi (dual letters have swapped endpoints under the actions)',
          all(e_mul(L(ep[A][0]), L(A), MU) == L(A) == e_mul(L(A), L(ep[A][1]), MU) for A in UPPER))
    tf = assoc_failures(MU, letters)
    check(checks, 'T: associative on all 20^3 = 8000 basis triples', not tf, str(tf[:5]))
    check(checks, 'T: 1 = e + f is a two-sided unit', all(e_mul(one, L(a), MU) == L(a) == e_mul(L(a), one, MU) for a in letters))

    def lam(x):
        out = {}
        for (l, k), c in x.items():
            if l in 'EF':
                out[k] = out.get(k, 0) ^ c
        return {k: c for k, c in out.items() if c}
    G = [[lam(e_mul(L(a), L(b), MU)) for b in letters] for a in letters]
    sym = all(G[i][j] == G[j][i] for i in range(20) for j in range(20))
    dual = all(lam(e_mul(L(a), L(star(b)), MU)) == ({0: 1} if a == b else {}) for a in letters for b in letters)
    check(checks, 'T: lambda(a,phi) = phi(1) is symmetric on all 400 letter pairs', sym)
    check(checks, 'T: the trace-dual of each letter is its starred letter, lambda(a b*) = delta_ab (Gram = permutation)', dual)
    check(checks, 'T: the trace form is nondegenerate (Gram rank 20 over F_2(q))', rank_int([[g.get(0, 0) for g in row] for row in G]) == 20)
    radT = RAD
    idealT = all(set(l for (l, _) in e_mul(L(a), L(b), MU)) <= set(radT) and set(l for (l, _) in e_mul(L(b), L(a), MU)) <= set(radT)
                 for a in letters for b in radT)
    nwT = nonzero_words(MU, radT)
    val['T_nonzero_radical_words_by_length'] = nwT
    check(checks, 'T: the span r of the 18 letters other than e, f is a two-sided ideal; T/r = k x k', idealT)
    check(checks, 'T: r^6 = 0 (no nonzero product of six radical letters)', len(nwT) <= 5, 'nonzero words by length %s' % nwT)
    degT = dict(deg)
    degT.update({a.upper(): 5 - deg[a] for a in LOWER})
    hT = is_homogeneous(MU, degT)
    check(checks, 'T: deg(a*) = 5 - deg(a) makes every product homogeneous; all radical degrees in 1..5',
          not hT and all(1 <= degT[a] <= 5 for a in radT), str(hT[:5]))
    aut = all(h_el(e_mul(L(a), L(b), MU)) == e_mul(h(a), h(b), MU) for a in letters for b in letters)
    check(checks, 'h_H (fix C, scale DC by H) is an algebra automorphism of T, H an indeterminate (400 pairs)', aut)

    # ---------------- the cochain p
    entries = parse_cochain(coc)
    m = re.search(r'There are (\d+) entries', coc)
    check(checks, 'p: the table has the printed number of entries (179)', m is not None and len(entries) == int(m.group(1)) == 179,
          '%d parsed, %s printed' % (len(entries), m and m.group(1)))
    inputs = [w[:3] for w, _ in entries]
    check(checks, 'p: distinct three-letter inputs', len(set(inputs)) == len(inputs))
    P = {}
    shape_bad = []
    for w, c in entries:
        a, b, cc, o = w
        if not (a in radT and b in radT and cc in radT and o in letters) or not (
                ep[a][1] == ep[b][0] and ep[b][1] == ep[cc][0] and ep[o] == (ep[a][0], ep[cc][1])):
            shape_bad.append(w)
        P.setdefault((a, b, cc), {})
        P[(a, b, cc)][o] = P[(a, b, cc)].get(o, 0) ^ c
    check(checks, 'p: every entry has composable radical inputs and an output with the same two endpoints (an I-bimodule map)', not shape_bad, str(shape_bad))
    wt_bad = [w for w, _ in entries if sum(ch.isupper() for ch in w[:3]) != sum(ch.isupper() for ch in w[3]) + 1]
    check(checks, 'p: weight -1 — one more capital input letter than capital output letters, in every entry', not wt_bad, str(wt_bad))
    Pel = {k: letter_el(v) for k, v in P.items()}

    def pv(a, b, c):
        return Pel.get((a, b, c), {})

    def p_lin(x, b, c, slot):
        """p with an element in one slot (linear extension)"""
        out = {}
        for (l, k), co in x.items():
            t = pv(l, b, c) if slot == 0 else (pv(b, l, c) if slot == 1 else pv(b, c, l))
            out = e_add(out, e_scale(t, co, k))
        return out

    prod_cache = {(a, b): e_mul(L(a), L(b), MU) for a in letters for b in letters}
    n_comp, closure_bad = 0, []
    for a in radT:
        for b in radT:
            ab = prod_cache[(a, b)]
            for c in radT:
                bc = prod_cache[(b, c)]
                pabc = pv(a, b, c)
                for d in radT:
                    comp = ep[a][1] == ep[b][0] and ep[b][1] == ep[c][0] and ep[c][1] == ep[d][0]
                    n_comp += comp
                    tot = e_add(e_mul(L(a), pv(b, c, d), MU),
                                p_lin(ab, c, d, 0),
                                p_lin(bc, a, d, 1),
                                p_lin(prod_cache[(c, d)], a, b, 2),
                                e_mul(pabc, L(d), MU))
                    if tot:
                        closure_bad.append(a + b + c + d)
    val['four_words'] = len(radT) ** 4
    val['composable_four_words'] = n_comp
    printed_words = re.search(r'18\^4=104\\,976', coc) and re.search(r'precisely \$15\\,250\$', coc)
    check(checks, 'p: 18^4 = 104,976 radical four-words, exactly 15,250 composable (printed counts)',
          bool(printed_words) and len(radT) ** 4 == 104976 and n_comp == 15250, 'computed %d composable' % n_comp)
    check(checks, 'p: the normalized Hochschild cocycle equation holds on all 104,976 radical four-words, every output coefficient',
          not closure_bad, '%d failing words %s' % (len(closure_bad), closure_bad[:6]))

    zset = re.search(r'Hqa,&a\\in\\\{([A-Za-z,]+)\\\}', alg)
    gset = re.search(r'q,&a\\in\\\{([A-Za-z,]+)\\\}', coc)
    Z = set(zset.group(1).split(',')) if zset else set()
    check(checks, 'p: the support {u,v,t,E,X,Y,Z,U,V} of z_H (03-algebra) equals that of gamma (09-cochain)',
          bool(zset and gset) and Z == set(gset.group(1).split(',')) and Z == set('uvtEXYZUV'), str(sorted(Z)))

    def zH(x):
        return {(l, k + 1): pmul(c, 2) for (l, k), c in x.items() if l in Z}
    bd_bad, n_pairs = [], 0
    for a in radT:
        for b in radT:
            n_pairs += 1
            lhs = {}
            for w in radT:                          # p(a, b, h(w)) = H^eps(w) p(a, b, w)
                pw = {(l, k + eps(w)): c for (l, k), c in pv(a, b, w).items()}
                lhs = e_add(lhs, e_mul(pw, L(star(w)), MU))
            rhs = e_add(e_mul(L(a), zH(L(b)), MU), zH(prod_cache[(a, b)]), e_mul(zH(L(a)), h(b, -1), MU))
            if lhs != rhs:
                bd_bad.append(a + b)
    check(checks, 'p: the boundary identity coc:boundary, sum_w p(a,b,h(w)) w* = a z_H(b) + z_H(ab) + z_H(a) h^-1(b), '
          'for all 18^2 = 324 pairs with H an indeterminate', not bd_bad and n_pairs == 324 and '18^2=324' in coc, str(bd_bad[:6]))
    gam = {a: (2 if a in Z else 0) for a in letters}
    bc_bad = []
    for a in radT:
        for b in radT:
            mu = prod_cache[(a, b)]
            for v in letters:
                muv = mu.get((v, 0), 0)
                s0 = s1 = 0
                for w in radT:
                    for o, co in P.get((a, b, w), {}).items():
                        t = pmul(co, MU[o].get(star(w), {}).get(v, 0))
                        if eps(w):
                            s1 ^= t
                        else:
                            s0 ^= t
                if s0 != (pmul(gam[a], muv) if eps(b) else 0) or s1 != pmul(gam[b] ^ gam[v] ^ (0 if eps(b) else gam[a]), muv):
                    bc_bad.append(a + b + v)
    check(checks, 'p: the two printed coefficient forms coc:boundary-constant and coc:boundary-linear hold for every (a,b,v)', not bc_bad, str(bc_bad[:6]))

    check(checks, 'p: p(t,x,J) = 0 and p(t,y,J) = q^3 f, as printed', pv('t', 'x', 'J') == {} and pv('t', 'y', 'J') == {('f', 0): 8}
          and '$p(t,x,J)=0$ and $p(t,y,J)=q^3f$' in alg)
    four = {'tx': 'j', 'ty': 'q^2j', 'xJ': 'T', 'yJ': 'q^2T'}
    check(checks, 'zeta: tx = j, ty = q^2 j, xJ = T, yJ = q^2 T in T', all(prod_cache[(k[0], k[1])] == parse_expr(v) for k, v in four.items())
          and 'tx=j,\\qquad ty=q^2j,\\qquad xJ=T,\\qquad yJ=q^2T' in alg)
    zeta = {('t', 'x', 'J'): 4, ('t', 'y', 'J'): 1}
    dz = {}
    for (a, b, c), co in zeta.items():           # outer actions vanish on the endpoint simples; inner products remain
        for (l, k), cc in prod_cache[(a, b)].items():
            dz[(l, c)] = dz.get((l, c), 0) ^ pmul(co, cc)
        for (l, k), cc in prod_cache[(b, c)].items():
            dz[(a, l)] = dz.get((a, l), 0) ^ pmul(co, cc)
    dz = {k: v for k, v in dz.items() if v}
    check(checks, 'zeta = q^2[t|x|J] + [t|y|J] has endpoints f on both sides and is a cycle in s^r (x)_T P (x)_T s', not dz
          and all(ep[a][0] == 'f' and ep[c][1] == 'f' for (a, b, c) in zeta), str(dz))
    pair = 0
    for (a, b, c), co in zeta.items():
        pair ^= pmul(co, P.get((a, b, c), {}).get('f', 0))
    val['p_on_zeta'] = pstr(pair)
    check(checks, 'zeta: the simple-valued cochain pairs to q^3 != 0 with zeta', pair == 8, pstr(pair))
    fout = [w for w, _ in entries if w[3] == 'f']
    check(checks, 'p: every entry with output f (the only output the character of s sees) has exactly one capital input',
          all(sum(ch.isupper() for ch in w[:3]) == 1 for w in fout), '%d entries with output f' % len(fout))

    # ---------------- Lemma res:base, for every i
    rho = lambda g: (lambda b: e_mul(L(b), g, MU))    # noqa: E731  right multiplication
    lmb = lambda g: (lambda b: e_mul(g, L(b), MU))    # noqa: E731  left multiplication
    ell = parse_expr('\\ell_i')
    Ce, Cf, eC, fC = ['e', 'x', 'y', 'z', 't', 'j'], ['f', 'u', 'v', 'n'], ['e', 'x', 'y', 'z', 'u', 'v'], ['f', 't', 'j', 'n']
    check(checks, 'res: the bases of Ce, Cf (and eC, fC) are the letters with that right (left) idempotent, as printed',
          Ce == [a for a in LOWER if corners[a][1] == 'e'] and sorted(Cf) == sorted(a for a in LOWER if corners[a][1] == 'f')
          and '(e,x,y,z,t,j),\\qquad(f,u,v,n)' in res)
    head, rows = table_after(res, ' a&e&x&y&z&t&j')
    tab1 = all(e_mul(L(b), L('u'), MU) == parse_expr(s) for b, s in zip(head, rows['au'])) and \
        all(e_mul(L(b), ell, MU) == parse_expr(s) for b, s in zip(head, rows['a\\ell_i']))
    check(checks, 'res: the printed table of a u and a l_i on Ce holds as identities in F_2[q][Q], Q = q^i (all i >= 0)', tab1 and head == Ce)
    head2, rows2 = table_after(res, ' a&e&x&y&z&u&v')
    tab2 = all(e_mul(ell, L(b), MU) == parse_expr(s) for b, s in zip(head2, rows2['\\ell_ia']))
    check(checks, 'res: the printed table of l_i a on eC holds as identities in F_2[q][Q] (all i >= 0)', tab2 and head2 == eC)
    mfc = re.search(r'sends the basis \$\(([^)]*)\)\$ of \$fC\$ to\s+\$\(([^$]*)\)\$', res)
    lu = mfc and [parse_expr(x) for x in split_top(clean(mfc.group(2)), ',')]
    check(checks, 'res: left multiplication by u sends (f,t,j,n) to (u, y+qx, z, v), four independent vectors',
          bool(mfc) and clean(mfc.group(1)).split(',') == fC and [e_mul(L('u'), L(b), MU) for b in fC] == lu
          and rank_int([[c.get(0, 0) for c in coords(v, eC)] for v in lu]) == 4)
    para = res[res.index('Consequently, right multiplication by $u$'):res.index('These identities prove exactness')]
    sp = angle_spans(para)
    ok1, d1 = span_decision(rho(L('u')), Ce, Cf, sp[0], sp[1], 0)
    check(checks, 'res: right multiplication by u on Ce has image <u,v,n> = rad(Cf) and kernel <l_0,z,j>', ok1 and sp[0] == ['u', 'v', 'n']
          and sorted(sp[0]) == sorted(a for a in Cf if a != 'f') and sp[1] == ['\\ell_0', 'z', 'j'], d1)
    ok2, d2 = span_decision(rho(ell), Ce, Ce, sp[2], sp[3], 0)
    check(checks, 'res: right multiplication by l_i on Ce has image <l_i,z,j> and kernel <l_(i+1),z,j>, for EVERY i >= 0', ok2
          and sp[2] == ['\\ell_i', 'z', 'j'] and sp[3] == ['\\ell_{i+1}', 'z', 'j'], d2)
    exact = same_span([span_symbol(s) for s in sp[1]], [spec(span_symbol(s), 0) for s in sp[2]], Ce, 0) and \
        same_span([shift_Q(span_symbol(s), 1) for s in sp[2]], [span_symbol(s) for s in sp[3]], Ce, 0)
    check(checks, 'res: ker(u) = im(l_0) and ker(l_i) = im(l_(i+1)) for every i >= 0 — R is exact at every index', exact and ok1 and ok2)
    para2 = res[res.index('The index $i=0$ is exceptional'):res.index('The cohomology in degree')]
    sp2 = angle_spans(para2)
    ok3, d3 = span_decision(lmb(parse_expr('\\ell_0')), eC, eC, sp2[1], sp2[0], 0)
    imu = [e_mul(L('u'), L(b), MU) for b in fC]
    check(checks, 'res: l_0 on eC (exceptional): kernel <qx+y,z,u,v> = image of u., image <l_0,z>',
          ok3 and sp2[0] == ['qx+y', 'z', 'u', 'v'] and sp2[1] == ['\\ell_0', 'z'] and same_span(imu, [span_symbol(s) for s in sp2[0]], eC, 0), d3)
    ok4, d4 = span_decision(lmb(ell), eC, eC, sp2[3], sp2[2], 1)
    check(checks, 'res: l_i on eC for EVERY i >= 1: kernel <l_(i-1),z,v>, image <l_i,z,v>', ok4 and sp2[2] == ['\\ell_{i-1}', 'z', 'v']
          and sp2[3] == ['\\ell_i', 'z', 'v'] and 'For every $i\\geq1$, the coefficient $1+q^i$ is nonzero' in res, d4)
    v_line = rank_for_all([coords(x, eC) for x in (parse_expr('\\ell_0'), L('z'), L('v'))], 0)[0] == {3}
    high = same_span([shift_Q(span_symbol(s), 1) for s in sp2[2]], [span_symbol(s) for s in sp2[3]], eC, 0)
    check(checks, 'res: Hom complex cohomology — 0 in degree 0 (u. injective) and 1 (ker l_0. = im u.); in degree 2 ker(l_1.) = '
          '<l_0,z,v> over im(l_0.) = <l_0,z> is the line of v; ker(l_(i+1).) = im(l_i.) for every i >= 1',
          ok3 and ok4 and v_line and high and rank_int([[c.get(0, 0) for c in coords(v, eC)] for v in lu]) == 4
          and same_span([span_symbol(s) for s in ['\\ell_0', 'z', 'v']], [spec(span_symbol(s), 1) for s in sp2[2]], eC, 0))
    vr = {b: e_mul(L('v'), L(b), MU) for b in LOWER}
    check(checks, 'res: v f = v, v e = 0, and vt = qz is the only nonzero radical product (a boundary): the line is s^r',
          vr['f'] == L('v') and not vr['e'] and {b for b in radC if vr[b]} == {'t'} and vr['t'] == e_scale(L('z'), 2))

    # ---------------- 06-lift
    ww = all(e_mul(L(w), L(star(w)), MU) == L(corners[w][0].upper()) and e_mul(L(star(w)), L(w), MU) == L(corners[w][1].upper())
             for w in LOWER)
    check(checks, 'lift: for every lower-case letter w, w w* = left(w)* and w* w = right(w)*', ww)
    dims = ([sum(corners[a][0] == i for a in LOWER) for i in 'ef'], [sum(corners[a][1] == i for a in LOWER) for i in 'ef'])
    check(checks, 'lift: row dimensions of C are 6,4 and column dimensions 6,4', dims == ([6, 4], [6, 4]), str(dims))
    pix = {}
    for w in letters:
        pix = e_add(pix, e_mul(h(w), L(star(w)), MU))
    check(checks, 'lift: pi(xi_H) = sum_w h(w) w* = 0 in characteristic two (H an indeterminate)', pix == {}, e_str(pix))
    endp = True
    for r in 'ef':
        s = {}
        for w in radT:
            if ep[w][0] == r:
                s = e_add(s, e_mul(h(w), L(star(w)), MU))
        endp &= s == L(r.upper())
    check(checks, 'lift: the endpoint identity lift:endpoint, sum over radical w with left(w) = r of h(w) w* = r*, r = e, f', endp)
    xi = {}
    for w in letters:
        xi = t_add(xi, tens(h(w), L(star(w)), ep))

    def lmul_t(g, X):
        out = {}
        for (a, b, k), c in X.items():
            out = t_add(out, tens(e_mul(g, {(a, k): c}, MU), L(b), ep))
        return out

    def rmul_t(X, g):
        out = {}
        for (a, b, k), c in X.items():
            out = t_add(out, tens({(a, k): c}, e_mul(L(b), g, MU), ep))
        return out
    coev = all(lmul_t(h(a), xi) == rmul_t(xi, L(a)) for a in letters)
    check(checks, 'lift: the twisted coevaluation h(a) xi_H = xi_H a holds in T (x)_I T for all 20 letters a', coev)
    pc = True
    for a in radT:
        lhs = {}
        for w in radT:
            lhs = t_add(lhs, tens(e_mul(L(a), h(w), MU), L(star(w)), ep), tens(h(w), e_mul(L(star(w)), h(a, -1), MU), ep))
        pc &= lhs == tens(L(a), L(ep[a][1].upper()), ep)
    check(checks, 'lift: lift:projected-casimir, sum a h(w) (x) w* + sum h(w) (x) w* h^-1(a) = a (x) r*, for all 18 radical a', pc)
    chi = lambda l: 1 if l == 'f' else 0          # noqa: E731  the character of s
    check(checks, 'lift: in xi_H only w = f* has chi(w*) != 0, with value h(f*) = H f*',
          [w for w in letters if chi(star(w))] == ['F'] and h('F') == {('F', 1): 1})

    # ---------------- dimensions
    check(checks, 'dims: dim C = 10, dim T = 20, dim A = 400, dim Lambda = 800 + dim F (800 = 2 dim A)',
          'symmetric algebra of dimension $20$' in intro and 'symmetric algebra of dimension $400$' in intro
          and 'dimension $800+\\dim_\\kk F$' in intro and len(letters) ** 2 == 400 and 2 * 400 == 800)

    val.update({'C_dim': 10, 'T_dim': 20, 'A_dim': 400, 'cochain_entries': len(entries)})
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the ten-dimensional algebra C, its trivial extension T and trace, the 179-entry '
                       'cochain (cocycle and boundary identities, evaluation q^3), the resolution of s over C for every i, and the '
                       'finite identities of the lift — not the Ext vanishing over Lambda (F, Lambda, Z are not published)',
            'value': val}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(Patched([(ALG, 'ty=q^2j,\\\\', 'ty=qj,\\\\')]))
    out.append(('C: the printed product ty = q^2 j changed to ty = q j', r['verdict']))
    r = decide(Patched([(COC, 'xXuu xXvv xXyy xXzz', 'xXuu xXvv xXyy'), (COC, '$q^2$ & \\texttt{EuNT', '$q^2$ & \\texttt{xXzz EuNT')]))
    out.append(('p: the entry xXzz moved from coefficient q to coefficient q^2 (count, weight, endpoints kept)', r['verdict']))
    r = decide(Patched([(ALG, '&z&q^2z&0', '&z&qz&0')]))
    out.append(('C: the printed associativity value for uty changed from q^2 z to q z', r['verdict']))
    r = decide(Patched([(RES, 'a\\ell_i&\\ell_i&q^{i+1}z', 'a\\ell_i&\\ell_i&q^{i}z')]))
    out.append(('res: the printed x l_i = q^(i+1) z changed to q^i z', r['verdict']))
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
