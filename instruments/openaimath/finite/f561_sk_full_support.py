"""F-561 — "Full support of the zero-temperature Sherrington-Kirkpatrick order parameter" (openai/math family 281).

THE CLAIM (headline): every admissible integrable minimizer of the zero-temperature Parisi functional for the pure,
zero-field SK model has full relative Stieltjes support on [0,1). Its one finite object is the exact certificate of
build/certificate.tex (Section cert:section), Lemma cert:identity-lemma (lines 117-127):
    z^2 - 12Rvb^2 + 6v^4 = (z+Q)^2 + ST + sum_{i=0}^4 p_i P_i + W(F_2) + L(x_0v^2 + hbv) + P_rem
over Q, with B = b - 2v, S = z + bv - 2Rb, the constants of eq:cert:constants-first (line 38), eq:cert:QT (44),
eq:cert:constants-second (56), F_2 of eq:cert:polynomials (62), P_i of eq:cert:squares (98), p_i of
eq:cert:constants (108), P_rem the 22 positive coefficients of Table cert:table (lines 143-164), and
W(F) = DF + (v + R - K)F with D given on R,K,v,b,j by the derivative rules signs.tex:424 (eq shape:D-rules):
    D(R,K,v,b,j) = (2Rv, 2vK + Rj, -Rb, -z - bv, -jv + Kb - L).
Proposition cert:coercivity (lines 166-193) then gives E_f[z^2 - 12vw^2 + 6v^4] >= (1661507/1521000000) E_f v^4
>= (1/1000) E_f v^4.

WHAT IS DECIDED HERE, exactly (Fraction coefficients, sparse polynomials of _poly.py; nothing from the release runs):
  1. Every expression is PARSED FROM THE LaTeX BYTES (a small recursive-descent parser for the paper's polynomial
     notation: juxtaposition, + -, ^, \\frac, parentheses): the six + four + five constants, Q, T, F_2, P_0..P_4, S, the
     L term, the five derivative rules, the left side, and the 22 table entries.
  2. W is implemented from the parsed rules by the chain rule on R,K,v,b,j (W_0: the same with -L dropped from Dj).
     In Q[R,K,v,b,j,z,L], then after b = B + 2v in Q[R,K,v,B,j,z,L]:
       the residual  LHS - (z+Q)^2 - ST - sum p_i P_i - W(F_2) - L(x_0v^2 + hbv)  equals the table polynomial
       EXACTLY (every coefficient, every unlisted one zero) — i.e. the identity of the lemma holds over Q.
  3. The intermediate claims: d_b F_2 = 2Q + T (and the printed expansion of d_b F_2); d_j F_2 = x_0 v^2 + hbv and
     W(F_2) = W_0(F_2) - L(x_0v^2 + hbv) (eq cert:L-correction); the z-coefficient of W(F_2) is -d_b F_2; the
     expression z^2 - 12Rvb^2 + 6v^4 - (z+Q)^2 - ST - W(F_2) has no z.
  4. Signs: the table has 22 distinct monomials in R,K,v,B,j with positive coefficients; p_0..p_4 > 0; each P_i is
     its printed prefactor (Rj, RB, Kv, vB, 1 — products of the sign-constrained variables) times the square of its
     printed linear form; g_0, h > 0 (so T = v(g_0R + hj) >= 0) and x_0, h > 0 (so L(x_0v^2 + hbv) >= 0); the
     printed 1661507/1521000000 - 1/1000 = 140507/1521000000 > 0. Hence, under the signs eq cert:signs
     (R,K,v,B,j,L,S >= 0, b >= 0), the right side minus W(F_2) is >= (1661507/1521000000) v^4 pointwise.
  5. The algebra of Lemma shape:ibp, re-derived from the definitions (signs.tex:399-411) as identities of rational
     functions in the jets r, r_x, ..., r_xxxx, s, ..., s_xxx (denominators powers of r, cleared exactly):
     with R = r^2, K = rs, v = r_x, w = r_xx, z = r_xxx, b = -w/r, j = s_x - (s/r)v, L = -r s_xx, a = s_x:
     each of the five rules D = r d/dx; B = -2H and S = 2rH_x with H = w/(2r) + v; Rb^2 = w^2; and, end to end for
     F = F_2, d/dx(r F f) = W(F) f when f_x/f = r - s.

WHAT IS NOT DECIDED (theory, not the finite object):
  - That the signs eq cert:signs hold (Lemmas shape:backward, shape:forward: PDE comparison arguments), the
    integrability and vanishing boundary terms that make E_f W(F_2) = 0 (Lemma shape:ibp), and hence
    Proposition cert:coercivity itself beyond its pointwise algebra.
  - The analytic step that USES the inequality: Proposition prop:gap-curvature (curvature.tex:9-53, q''' >=
    E v^4/(1000c^2) > 0 on a constant interval, by passing the finite-step inequality to the limit), the gap
    exclusion of Section sec:variation, Corollary cor:smooth-measure (order-parameter-regularity.tex:137) and so the
    full-support headline.

OBSERVED AFTER THIS DECIDER RAN (2026-10-09; not part of the decision): the preprint ships no checking script. The
Lean file lean/OAI/Probability/SKSupport/Density/Certificate.lean transcribes the same 15 constants, F_2 (written as
x_0v^2j + yv^3 + mKv^2 + n_0Rv^2 - F_1), P_0..P_4 and a 22-term remainder equal to Table cert:table coefficient for
coefficient (compared here in scratch). It hand-writes the five partial derivatives of F_2 and proves
rational_identity by `ring`; that Lean was not compiled or run by this audit.
"""
import os
import re
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, compose, const, diff, mul, pw, scale, sub, total, var  # noqa: E402

DIR = 'preprints/Full-support-of-the-zero-temperature-Sherrington-Kirkpatrick-order-parameter-September-27-2026/build/'
CERT = DIR + 'certificate.tex'
SIGNS = DIR + 'signs.tex'

# the b-ring Q[R,K,v,b,j,z,L]; the B-ring is the same seven slots with slot 3 read as B = b - 2v
VARS = ('R', 'K', 'v', 'b', 'j', 'z', 'L')
NV = len(VARS)
TABLE_VARS = ('R', 'K', 'v', 'B', 'j')


# ---------------------------------------------------------------- a parser for the paper's polynomial notation
def tokenize(s):
    s = s.replace('\\\\', ' ')
    for junk in ('\\left', '\\right', '\\bigl', '\\bigr', '\\Bigl', '\\Bigr', '\\qquad', '\\quad', '\\ ', '\\,', '{}', '&'):
        s = s.replace(junk, '')
    toks, i = [], 0
    while i < len(s):
        ch = s[i]
        if ch.isspace():
            i += 1
        elif s.startswith('\\frac', i):
            i += 5
            args = []
            for _ in range(2):
                while s[i].isspace():
                    i += 1
                if s[i] == '{':
                    j = s.index('}', i)
                    args.append(s[i + 1:j])
                    i = j + 1
                else:
                    args.append(s[i])
                    i += 1
            toks.append(('num', Fraction(int(args[0]), int(args[1]))))
        elif ch.isdigit():
            j = i
            while j < len(s) and s[j].isdigit():
                j += 1
            toks.append(('num', Fraction(int(s[i:j]))))
            i = j
        elif ch.isalpha():
            if s.startswith('_', i + 1):
                toks.append(('sym', s[i:i + 3]))
                i += 3
            else:
                toks.append(('sym', ch))
                i += 1
        elif ch in '+-()^':
            if ch == '^':
                j = i + 1
                if s[j] == '{':
                    k = s.index('}', j)
                    toks.append(('pow', int(s[j + 1:k])))
                    i = k + 1
                else:
                    toks.append(('pow', int(s[j])))
                    i = j + 1
            else:
                toks.append((ch, None))
                i += 1
        else:
            raise ValueError('unparsed character %r in %r' % (ch, s))
    return toks


def parse_poly(s, env):
    toks = tokenize(s)
    pos = [0]

    def peek():
        return toks[pos[0]] if pos[0] < len(toks) else (None, None)

    def expr():
        sign = 1
        if peek()[0] in '+-' and peek()[0] is not None:
            sign = -1 if toks[pos[0]][0] == '-' else 1
            pos[0] += 1
        r = scale(term(), sign)
        while peek()[0] in ('+', '-'):
            sg = -1 if toks[pos[0]][0] == '-' else 1
            pos[0] += 1
            r = add(r, term(), sg)
        return r

    def term():
        r = const(1, NV)
        n = 0
        while peek()[0] in ('num', 'sym', '('):
            r = mul(r, factor())
            n += 1
        if not n:
            raise ValueError('empty term at token %d of %r' % (pos[0], s))
        return r

    def factor():
        a = atom()
        if peek()[0] == 'pow':
            a = pw(a, toks[pos[0]][1], NV)
            pos[0] += 1
        return a

    def atom():
        kind, val = toks[pos[0]]
        pos[0] += 1
        if kind == 'num':
            return const(val, NV)
        if kind == 'sym':
            return env[val]
        if kind == '(':
            r = expr()
            assert toks[pos[0]][0] == ')', s
            pos[0] += 1
            return r
        raise ValueError('unexpected %r in %r' % (kind, s))
    r = expr()
    if pos[0] != len(toks):
        raise ValueError('trailing tokens in %r' % s)
    return r


def block(tex, label, env_name='equation'):
    i = tex.index('\\label{%s}' % label)
    j = tex.index('\\end{%s}' % env_name, i)
    return tex[i + len('\\label{%s}' % label):j]


def tuple_eq(body):
    """'(A,C,...) =\\left(v1,v2,...\\right)' -> (names, value strings)"""
    m = re.search(r'\(([^()]*)\)\s*=\s*\\left\((.*)\\right\)', body, re.S)
    names = [x.strip() for x in m.group(1).split(',')]
    vals = [x.strip() for x in m.group(2).split(',')]
    return names, vals


def parse_paper(src):
    tex = src.text(CERT)
    sig = src.text(SIGNS)
    env = {x: var(i, NV) for i, x in enumerate(VARS)}
    env['B'] = sub(env['b'], scale(env['v'], 2))
    out = {'env': env}
    consts = {}
    for label in ('cert:constants-first', 'cert:constants-second', 'cert:constants'):
        names, vals = tuple_eq(block(tex, label))
        for nm, vs in zip(names, vals):
            p = parse_poly(vs, env)
            assert set(p) <= {(0,) * NV}
            consts[nm] = p.get((0,) * NV, Fraction(0))
    out['consts'] = consts
    for nm, c in consts.items():
        env[nm] = const(c, NV)
    qt = block(tex, 'cert:QT').replace('\\qquad', '|')
    exprs = {}
    for piece in qt.split('|'):
        piece = piece.strip().rstrip(',.').strip()
        nm, rhs = piece.split('=', 1)
        exprs[nm.strip()] = rhs
    out['Q_tex'], out['T_tex'] = exprs['Q'], exprs['T']
    env['Q'] = parse_poly(exprs['Q'], env)
    env['T'] = parse_poly(exprs['T'], env)
    f2 = tex[tex.index('\\label{cert:polynomials}'):]
    f2 = f2[f2.index('\\begin{aligned}') + len('\\begin{aligned}'):f2.index('\\end{aligned}')]
    f2 = f2.strip()
    assert f2.startswith('F_2={}&')
    out['F2_tex'] = f2[len('F_2={}&'):].rstrip('.').strip()
    env['F_2'] = parse_poly(out['F2_tex'], env)
    sq = tex[tex.index('\\label{cert:squares}'):]
    sq = sq[sq.index('\\begin{aligned}') + len('\\begin{aligned}'):sq.index('\\end{aligned}')]
    P = {}
    for line in sq.split('\\\\'):
        line = line.strip().rstrip(',.').strip()
        nm, rhs = line.split('&=')
        P[nm.strip()] = rhs.strip()
    out['P_tex'] = P
    # S, the identity, the derivative rules
    m = re.search(r'\$S=([^$]*)\$', block(tex, 'cert:identity-lemma', 'lemma'))
    out['S_tex'] = m.group(1)
    env['S'] = parse_poly(out['S_tex'], env)
    i0 = tex.index('\\label{cert:identity}')
    ident = re.sub(r'\s+', '', tex[i0:tex.index('\\end{aligned}', i0)])
    out['identity_tex'] = ident
    m = re.search(r'\\begin\{aligned\}(.*?)=\{\}&', ident)
    out['LHS_tex'] = m.group(1)
    m = re.search(r'\+(L\([^)]*\))\+P_\{\\mathrm\{rem\}\}', ident)
    out['Lterm_tex'] = m.group(1)
    rules = re.sub(r'\s+', ' ', sig[sig.index('\\label{shape:D-rules}'):sig.index('\\end{equation}', sig.index('\\label{shape:D-rules}'))])
    m = re.search(r'\\mathcal D\(([^)]*)\) =\\bigl\((.*)\\bigr\)', rules)
    names = [x.strip() for x in m.group(1).split(',')]
    vals = [x.replace('\\ ', '').strip() for x in m.group(2).split(',')]
    out['rules_tex'] = dict(zip(names, vals))
    # the table
    i1 = tex.index('\\label{cert:table}')
    tab = tex[tex.rindex('\\begin{tabular}', 0, i1):tex.rindex('\\end{tabular}', 0, i1)]
    entries = re.findall(r'\$([A-Za-z0-9^]+)\$\s*&\s*\$(\d+)/(\d+)\$', tab)
    out['table'] = [(mono, Fraction(int(a), int(b))) for mono, a, b in entries]
    m = re.search(r'\\frac\{(\d+)\}\{(\d+)\}-\\frac1\{1000\}\s*=\\frac\{(\d+)\}\{(\d+)\}>0', re.sub(r'\s+', '', tex))
    out['margin_printed'] = (Fraction(int(m.group(1)), int(m.group(2))), Fraction(int(m.group(3)), int(m.group(4))))
    m = re.search(r'\\partial_bF_2=([^$=]*?)=2Q\+T', re.sub(r'\s+', '', tex))
    out['dbF2_tex'] = m.group(1)
    m = re.search(r'\\partial_jF_2=(.*?),', re.sub(r'\s+', '', tex))
    out['djF2_tex'] = m.group(1)
    return out


def mono_exps(mono):
    """'R^2vB' -> exponent tuple in the B-ring (slots R,K,v,B,j,z,L)"""
    e = [0] * NV
    for sym, p in re.findall(r'([A-Za-z])(?:\^(\d+))?', mono):
        e[('R', 'K', 'v', 'B', 'j').index(sym)] += int(p or 1)
    return tuple(e)


def W(F, rules, env):
    r = {}
    for i, x in enumerate(('R', 'K', 'v', 'b', 'j')):
        r = add(r, mul(diff(F, i), rules[x]))
    return add(r, mul(total(env['v'], env['R'], scale(env['K'], -1)), F))


def to_B_ring(p, env):
    subs = [var(i, NV) for i in range(NV)]
    subs[3] = add(var(3, NV), scale(var(2, NV), 2))   # b = B + 2v
    return compose(p, subs, NV)


# ---------------------------------------------------------------- jets, for the algebra of Lemma shape:ibp
JN = 9   # r0..r4, s0..s3


def jr(i):
    return var(i, JN)


def js(i):
    return var(5 + i, JN)


def jdx(N):
    """d/dx of a polynomial in the jets"""
    out = {}
    for i in range(4):
        out = add(out, mul(diff(N, i), jr(i + 1)))
    for i in range(3):
        out = add(out, mul(diff(N, 5 + i), js(i + 1)))
    assert not diff(N, 4) and not diff(N, 8), 'jet order exceeded'
    return out


class Rat:
    """N / r^e with N a jet polynomial"""

    def __init__(self, N, e=0):
        self.N, self.e = N, e

    def __add__(self, o):
        e = max(self.e, o.e)
        return Rat(add(mul(self.N, pw(jr(0), e - self.e, JN)), mul(o.N, pw(jr(0), e - o.e, JN))), e)

    def __neg__(self):
        return Rat(scale(self.N, -1), self.e)

    def __sub__(self, o):
        return self + (-o)

    def __mul__(self, o):
        if not isinstance(o, Rat):
            return Rat(scale(self.N, o), self.e)
        return Rat(mul(self.N, o.N), self.e + o.e)

    def D(self):
        """r d/dx (N r^-e) = (r N' - e N r_x) / r^e"""
        return Rat(sub(mul(jr(0), jdx(self.N)), scale(mul(self.N, jr(1)), self.e)), self.e)

    def dx(self):
        return Rat(sub(mul(jr(0), jdx(self.N)), scale(mul(self.N, jr(1)), self.e)), self.e + 1)

    def __eq__(self, o):
        e = max(self.e, o.e)
        return sub(mul(self.N, pw(jr(0), e - self.e, JN)), mul(o.N, pw(jr(0), e - o.e, JN))) == {}


def jet_defs():
    r, s = Rat(jr(0)), Rat(js(0))
    R = Rat(mul(jr(0), jr(0)))
    K = Rat(mul(jr(0), js(0)))
    v, w, z = Rat(jr(1)), Rat(jr(2)), Rat(jr(3))
    b = Rat(scale(jr(2), -1), 1)
    j = Rat(sub(mul(js(1), jr(0)), mul(js(0), jr(1))), 1)
    L = Rat(scale(mul(jr(0), js(2)), -1))
    return dict(r=r, s=s, R=R, K=K, v=v, w=w, z=z, b=b, j=j, L=L)


def poly_to_rat(p, d):
    """substitute the jet definitions into a polynomial of the b-ring"""
    out = Rat({})
    for mono, c in p.items():
        t = Rat(const(c, JN))
        for x, e in zip(VARS, mono):
            for _ in range(e):
                t = t * d[x]
        out = out + t
    return out


def decide(src=None, const_override=None, table_override=None, table_from_residual=False):
    src = src or Sources()
    checks = []
    pp = parse_paper(src)
    env = pp['env']
    if const_override:
        for nm, c in const_override.items():
            pp['consts'][nm] = c
            env[nm] = const(c, NV)
        env['Q'] = parse_poly(pp['Q_tex'], env)
        env['T'] = parse_poly(pp['T_tex'], env)
        env['F_2'] = parse_poly(pp['F2_tex'], env)
    consts = pp['consts']
    check(checks, '1. parsed from the LaTeX: 15 constants, Q, T, F_2, P_0..P_4, S, the five derivative rules, the identity\'s two sides, 22 table rows',
          len(consts) == 15 and len(pp['P_tex']) == 5 and len(pp['rules_tex']) == 5 and len(pp['table']) == 22
          and pp['identity_tex'].endswith('(z+Q)^2+ST+\\sum_{i=0}^4p_iP_i+\\mathcalW(F_2)\\\\&+L(x_0v^2+hbv)+P_{\\mathrm{rem}}.'),
          '; '.join('%s=%s' % (k, v) for k, v in consts.items()))
    rules = {x: parse_poly(t, env) for x, t in pp['rules_tex'].items()}
    rules0 = dict(rules)
    rules0['j'] = add(rules['j'], env['L'])        # W_0: drop -L from Dj
    F2, Q, T, S = env['F_2'], env['Q'], env['T'], env['S']
    z, L = env['z'], env['L']
    lhs = parse_poly(pp['LHS_tex'], env)
    Lterm = parse_poly(pp['Lterm_tex'], env)
    WF2 = W(F2, rules, env)
    W0F2 = W(F2, rules0, env)
    P = {nm: parse_poly(t, env) for nm, t in pp['P_tex'].items()}
    pvals = [consts['p_%d' % i] for i in range(5)]
    # 3. the intermediate claims
    check(checks, '3. d_b F_2 = 2Q + T, and equals the printed expansion', diff(F2, 3) == add(scale(Q, 2), T) == parse_poly(pp['dbF2_tex'], env),
          'd_b F_2 = ' + pp['dbF2_tex'])
    check(checks, '3. d_j F_2 = x_0 v^2 + hbv and W(F_2) = W_0(F_2) - L(x_0 v^2 + hbv) (eq cert:L-correction)',
          diff(F2, 4) == parse_poly(pp['djF2_tex'], env) and sub(WF2, sub(W0F2, Lterm)) == {} and parse_poly(pp['djF2_tex'], env) == parse_poly(pp['Lterm_tex'][2:-1], env))
    zcoef = diff(WF2, 5)
    check(checks, '3. W(F_2) is linear in z with z-coefficient -d_b F_2', diff(zcoef, 5) == {} and sub(zcoef, scale(diff(F2, 3), -1)) == {})
    noz = sub(sub(sub(lhs, pw(add(z, Q), 2, NV)), mul(S, T)), WF2)
    check(checks, '3. z^2 - 12Rvb^2 + 6v^4 - (z+Q)^2 - ST - W(F_2) has no z dependence', diff(noz, 5) == {})
    # 2. the identity
    t0 = time.time()
    resid_b = sub(sub(noz, total(*[scale(P['P_%d' % i], pvals[i]) for i in range(5)])), Lterm)
    resid = to_B_ring(resid_b, env)
    table = dict(pp['table'])
    if table_override:
        table.update(table_override)
    table_poly = {}
    dup = False
    for mono, c in table.items():
        e = mono_exps(mono)
        dup |= e in table_poly
        table_poly[e] = c
    if table_from_residual:
        table_poly = dict(resid)
        table = {''.join('%s%s' % (x, '' if e == 1 else '^%d' % e) for x, e in zip(TABLE_VARS, mono[:5]) if e): c for mono, c in resid.items()}
    free = all(mono[5] == 0 and mono[6] == 0 for mono in resid)
    check(checks, '2. THE IDENTITY: LHS - (z+Q)^2 - ST - sum p_i P_i - W(F_2) - L(x_0v^2+hbv), after b = B + 2v, equals the table polynomial P_rem exactly',
          free and sub(resid, table_poly) == {} and not dup,
          'residual has %d terms (no z, no L: %s); %s; %.2fs' % (len(resid), free, 'every coefficient matches' if sub(resid, table_poly) == {} else
                                                                  'mismatch in %d coefficients' % len(sub(resid, table_poly)), time.time() - t0))
    # 4. signs
    check(checks, '4. the table: 22 distinct monomials in R,K,v,B,j, every coefficient > 0', len(table_poly) == 22 and all(c > 0 for c in table_poly.values()),
          'min coefficient %s' % min(table_poly.values()))
    check(checks, '4. p_0..p_4 > 0', all(p > 0 for p in pvals), ', '.join(str(p) for p in pvals))
    ok_sq = True
    detail = []
    for nm, t in sorted(pp['P_tex'].items()):
        m = re.fullmatch(r'([A-Za-z]*)(?:\\left)?\((.*?)(?:\\right)?\)\^2', t.replace(' ', ''))
        pref, form = m.group(1), m.group(2)
        ok_sq &= all(x in 'RKvBj' for x in pref) and P[nm] == mul(parse_poly(pref or '1', env), pw(parse_poly(form, env), 2, NV))
        detail.append('%s = %s * (...)^2' % (nm, pref or '1'))
    check(checks, '4. each P_i is a product of sign-constrained variables (R,K,v,B,j >= 0) times a square', ok_sq, '; '.join(detail))
    check(checks, '4. T = v(g_0 R + hj) and L(x_0 v^2 + hbv) have positive coefficients (g_0, h, x_0 > 0)',
          consts['g_0'] > 0 and consts['h'] > 0 and consts['x_0'] > 0 and all(c > 0 for c in T.values()) and all(c > 0 for c in Lterm.values()))
    v4 = table_poly.get((0, 0, 4, 0, 0, 0, 0), Fraction(0))
    a, d = pp['margin_printed']
    check(checks, '4. the v^4 coefficient %s - 1/1000 = %s > 0, as printed' % (a, d), v4 == a and a - Fraction(1, 1000) == d and d > 0, str(v4 - Fraction(1, 1000)))
    # 5. the algebra of Lemma shape:ibp in jets
    jd = jet_defs()
    jrules = {x: poly_to_rat(rules[x], jd) for x in ('R', 'K', 'v', 'b', 'j')}
    ok_rules = all(jd[x].D() == jrules[x] for x in ('R', 'K', 'v', 'b', 'j'))
    check(checks, '5. the five rules shape:D-rules follow from R = r^2, K = rs, v = r_x, b = -r_xx/r, j = s_x - (s/r)v, L = -r s_xx (rational jet identities)', ok_rules,
          ', '.join('D%s %s' % (x, 'ok' if jd[x].D() == jrules[x] else 'FAILS') for x in ('R', 'K', 'v', 'b', 'j')))
    H = Rat(jr(2), 0) * Fraction(1, 2)
    H = Rat(H.N, 1) + jd['v']                      # w/(2r) + v
    twoRHx = Rat(scale(jr(0), 2)) * H.dx()
    check(checks, '5. B = b - 2v = -2H and S = z + bv - 2Rb = 2rH_x with H = w/(2r) + v; Rb^2 = w^2',
          poly_to_rat(env['B'], jd) == H * Fraction(-2) and poly_to_rat(S, jd) == twoRHx and jd['R'] * jd['b'] * jd['b'] == jd['w'] * jd['w'])
    F2j = poly_to_rat(F2, jd)
    # d/dx(r F f) / f = d/dx(r F) + r F (r - s)  when f_x/f = r - s
    div = (jd['r'] * F2j).dx() + jd['r'] * F2j * (jd['r'] - jd['s'])
    check(checks, '5. end to end for F_2: d/dx(r F_2 f) = W(F_2) f when f_x/f = r - s (eq cert:divergence, pointwise part)', div == poly_to_rat(WF2, jd))
    ok = all(c['pass'] for c in checks)
    verdict = 'CERTIFIED' if ok else ('REFUSED' if not checks[0]['pass'] else 'REFUTED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the exact rational certificate of Lemma cert:identity-lemma (the identity, every printed constant and '
                       'the positivity of all 22 remainder coefficients) and the pointwise algebra of Lemma shape:ibp; not the sign lemmas, '
                       'the integration by parts, nor the curvature and gap arguments that turn the inequality into full support',
            'value': {'constants': {k: str(v) for k, v in consts.items()}, 'P_rem_terms': len(table_poly), 'v4_coefficient': str(v4),
                      'margin_over_1/1000': str(v4 - Fraction(1, 1000)), 'residual_terms': len(resid), 'F2_terms': len(F2), 'W_F2_terms': len(WF2)}}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(table_override={'v^4': Fraction(1661508, 1521000000)})
    out.append(('the table v^4 coefficient printed as 1661508/1521000000 (one more)', r['verdict']))
    r = decide(const_override={'p_4': Fraction(648, 10000)})
    out.append(('p_4 = 648/10000 instead of 647/10000', r['verdict']))
    r = decide(const_override={'p_4': Fraction(647, 10000) + Fraction(1, 100)}, table_from_residual=True)
    neg = [c for c in r['checks'] if c['check'].startswith('4. the table')][0]
    out.append(('p_4 raised by 1/100 and the table REPLACED by the exact new remainder (identity holds by construction; %s)' % neg['detail'], r['verdict']))
    r = decide(const_override={'h': Fraction(88, 2500)})
    out.append(('h = 88/2500 instead of 87/2500 (enters T, F_2 and the L term)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('%.2fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.2fs' % (time.time() - t))
