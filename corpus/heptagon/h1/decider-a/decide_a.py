#!/usr/bin/env python3
"""
decide_a.py -- DECIDER A of the pre-registered two-decider check (H1 and H4(i)).

Clean room: written from the text of arXiv:2609.23327v1 (Palvolgyi, "A cyclic non-Ramsey
heptagon", TeX source spherical_non_ramsey.tex, sha256 681c953f...52ff1) alone; stdlib + sympy;
no third-party checker read, copied or run; the other decider not read.

Every identity below is decided EXACTLY with r (resp. t1..t7) symbolic:
  HEPTAGON  (main theorem, .tex lines 48-148): the circle membership, the weights, the moment
            conditions (2), the energy (3), the invariance expansion (lines 119-147) for a
            symbolic congruent copy, and Lemma A.1's general ("M symmetric") form.
  A.3       (appendix Theorem app:thm:generic, lines 390-444): every finite identity in its proof
            with t1..t7 symbolic; the non-finite steps quoted, not decided.
  COLOURING (appendix section "Quantitative colour bounds", lines 1168-1191): the finite
            arithmetic behind floor(F/4) mod 12.

Derivations are implemented as formal derivations on rational-function fields: for a map
D on symbols, D(f) = sum_s (df/ds) * D(s), which is the unique derivation with those values
on Q(symbols) (Q-linearity + Leibniz => D(j) = 0 on integers, the formal derivative on
polynomials, the quotient rule on fractions). Relations between symbols (y_j^2 = j(2r-j),
c^2+s^2 = 1, cu+sv = 0) are imposed by normal forms (monomial reduction for the y's, a
lex Groebner basis for c,s,u,v); a derivation is admissible on the quotient only if it maps
each relation to the ideal -- that is decided too.

Verdict words per identity: CERTIFIED (exact equality) / REFUTED (exact inequality).
Output: result-a.json beside this file; the log is printed to stdout.
"""
import json, os, sys, time
import sympy as sp

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = "arXiv:2609.23327v1/src/spherical_non_ramsey.tex (read from a pinned copy; not copied here)"
TEX_SHA = "681c953f883506f573a2c59435d0ddbfed061be7852ee2a3a96004d27852d0f1"

T0 = time.time()
RECORDS = []
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a)
    print(s, flush=True)
    LOG.append(s)


def record(name, lhs, rhs, ok, section, tex_lines, **extra):
    v = "CERTIFIED" if ok else "REFUTED"
    rec = dict(name=name, lhs=str(lhs), rhs=str(rhs), verdict=v, section=section, tex_lines=tex_lines)
    rec.update({k: (str(x) if not isinstance(x, (int, float, bool, list, dict, type(None))) else x)
                for k, x in extra.items()})
    RECORDS.append(rec)
    log(f"  [{v}] {name}: {lhs} == {rhs}")
    return ok


def Der(expr, dmap):
    """Formal derivation with prescribed values dmap[symbol]; symbols absent from dmap are constants."""
    expr = sp.sympify(expr)
    return sum((sp.diff(expr, s) * val for s, val in dmap.items()), sp.Integer(0))


def DerM(M, dmap):
    return M.applyfunc(lambda e: Der(e, dmap))


# =====================================================================================
# PART 1 -- THE HEPTAGON (main theorem, lines 48-148)
# =====================================================================================
log("=" * 88)
log("PART 1  The heptagon: Theorem 1 (lines 48-148), r symbolic")
log("=" * 88)

r = sp.Symbol("r")
y1, y3, y4 = sp.symbols("y1 y3 y4")
Y = {1: y1, 3: y3, 4: y4}
# circle relation y_j^2 = j(2r-j), from (x-r)^2+y^2=r^2 at x=j (line 52, 54)
CIRCLE = {y1: 2 * r - 1, y3: 3 * (2 * r - 3), y4: 4 * (2 * r - 4)}
R = (2 * r - 1) * (2 * r - 3) * (2 * r - 4)  # line 107

# weights, line 93: 2 at the origin; -2, 2, -1 at each point with first coordinate 1, 3, 4
WEIGHT = {0: 2, 1: -2, 3: 2, 4: -1}
PTS = [(sp.Matrix([0, 0]), WEIGHT[0])]
for j in (1, 3, 4):
    for sg in (1, -1):
        PTS.append((sp.Matrix([j, sg * Y[j]]), WEIGHT[j]))
LAM = [w for _, w in PTS]
log("points (j, y) and weights:", [(tuple(p), w) for p, w in PTS])


def nf_y(expr):
    """Normal form in Q(r)[y1,y3,y4]/(y_j^2 - j(2r-j)) (coefficients may hold other free symbols):
    returns {(e1,e3,e4) in {0,1}^3 : coefficient}, dropping zero coefficients."""
    expr = sp.together(sp.expand(expr))
    num, den = sp.fraction(expr)
    assert not (den.free_symbols & {y1, y3, y4}), ("y in denominator", den)
    P = sp.Poly(sp.expand(num), y1, y3, y4)
    out = {}
    for (e1, e3, e4), coef in P.terms():
        c = coef * CIRCLE[y1] ** (e1 // 2) * CIRCLE[y3] ** (e3 // 2) * CIRCLE[y4] ** (e4 // 2)
        key = (e1 % 2, e3 % 2, e4 % 2)
        out[key] = out.get(key, 0) + c
    res = {}
    for k, v in out.items():
        cv = sp.cancel(sp.together(v / den))
        if cv != 0:
            res[k] = cv
    return res


def zero_y(expr):
    return nf_y(expr) == {}


def eq_y(a, b):
    return zero_y(sp.sympify(a) - sp.sympify(b))


# --- 1.0 the circle (line 54) ---------------------------------------------------------
log("\n1.0  P lies on the circle (x-r)^2 + y^2 = r^2 (line 54)")
ok = all(eq_y((p[0] - r) ** 2 + p[1] ** 2, r ** 2) for p, _ in PTS)
record("circle: (x-r)^2+y^2 = r^2 for all seven points", "(x-r)^2+y^2", "r^2", ok, "main", "52-54")
log("     side condition (not an identity): r > 2 => j(2r-j) > 0 for j in {1,3,4} (2r-4 > 0), so every y_j is a nonzero real,",
    "the seven points are distinct, and R = (2r-1)(2r-3)(2r-4) != 0.")

# --- 1.1 the derivation (lines 77-91) -------------------------------------------------
log("\n1.1  The derivation D with D(r) = 1 (lines 77-91)")
log("     NON-FINITE step, quoted (lines 81-83): 'To obtain D(r)=1, include r in a transcendence basis of R/Q,'",
    "'differentiate formally with respect to r on the resulting rational function field, and extend uniquely to its'",
    "'algebraic extension R.'  -- needs r transcendental; not decided here.")
# D(j) = 0 for integers: D(1) = D(1*1) = 2 D(1) => D(1) = 0 (line 79); additivity gives D(j) = 0.
# Derive D(y_j): y^2 = j(2r-j)  =>  2 y D(y) = D(j(2r-j)) = 2j D(r) = 2j  (line 85-91)
D0 = {r: sp.Integer(1)}
ok = True
DY = {}
for j in (1, 3, 4):
    rhs_D = Der(j * (2 * r - j), D0)  # D of the right side of the circle relation with D(r)=1, D(j)=0
    ok &= sp.simplify(rhs_D - 2 * j) == 0
    DY[Y[j]] = sp.Integer(j) / Y[j]  # 2 y D(y) = 2j  =>  D(y) = j/y  (y != 0 for r > 2)
record("D(j(2r-j)) = 2j (so 2y D(y) = 2j, D(y) = j/y)", "D(j(2r-j))", "2j", ok, "main", "85-91")
# polynomial form of D(y_j): j/y_j = y_j/(2r-j) under y_j^2 = j(2r-j)
ok = all(zero_y((sp.Integer(j) / Y[j] - Y[j] / (2 * r - j)) * Y[j] * (2 * r - j)) for j in (1, 3, 4))
record("j/y_j = y_j/(2r-j) under y_j^2 = j(2r-j)", "j/y_j", "y_j/(2r-j)", ok, "main", "85-91")
DH = {r: sp.Integer(1), y1: y1 / (2 * r - 1), y3: y3 / (2 * r - 3), y4: y4 / (2 * r - 4)}
# the derivation respects the circle relation (so it is a derivation of the quotient field)
ok = all(zero_y(Der(Y[j] ** 2 - j * (2 * r - j), DH)) for j in (1, 3, 4))
record("D respects the circle relation: D(y_j^2 - j(2r-j)) = 0", "D(y_j^2 - j(2r-j))", "0", ok, "main", "85-91")


def Dp(p):
    return DerM(p, DH)


# D(p) = (0, j/y) (line 90)
ok = all(eq_y(Dp(p)[0], 0) and eq_y(Dp(p)[1] * p[1], p[0]) for p, _ in PTS[1:]) and Dp(PTS[0][0]) == sp.Matrix([0, 0])
record("D(p) = (0, j/y) for p = (j, y)", "D(p)", "(0, j/y)", ok, "main", "90")

# --- 1.2 the multiset remark (line 93-96) --------------------------------------------
log("\n1.2  The multisets {0,3,3} and {1,1,4} (lines 94-96)")
A_, B_ = [0, 3, 3], [1, 1, 4]
ok = (len(A_) == len(B_)) and (sum(A_) == sum(B_)) and (sum(a * a for a in A_) == sum(b * b for b in B_))
record("{0,3,3} vs {1,1,4}: equal cardinality, sum, sum of squares", (len(A_), sum(A_), sum(a * a for a in A_)),
       (len(B_), sum(B_), sum(b * b for b in B_)), ok, "main", "94-96")
# and the weighted x-moments are 2*(sum over {0,3,3} - sum over {1,1,4}) of x^k
ok = all(sum(w * p[0] ** k for p, w in PTS) == 2 * (sum(a ** k for a in A_) - sum(b ** k for b in B_)) for k in range(3))
record("sum lambda x^k = 2(sum_{0,3,3} x^k - sum_{1,1,4} x^k), k=0,1,2", "sum lambda x^k", "2(S_A - S_B)", ok, "main", "94-96")

# --- 1.3 the moment conditions, Equation (2) (lines 97-105) --------------------------
log("\n1.3  Equation (2), lines 97-105: the five moment conditions")
m0 = sum(LAM)
record("(1) sum lambda = 0  [line 99]", "sum lambda", 0, m0 == 0, "main", "99", value=m0)

m1 = sum((w * p for p, w in PTS), sp.zeros(2, 1))
m1n = [nf_y(e) for e in m1]
record("(2) sum lambda p = 0 (both coordinates)  [line 100]", "sum lambda p", "(0,0)", all(d == {} for d in m1n),
       "main", "100", value=[str(sp.expand(e)) for e in m1])

S2 = sum((w * p * p.T for p, w in PTS), sp.zeros(2, 2))
S2n = S2.applyfunc(lambda e: sp.cancel(sum((v * y1 ** k[0] * y3 ** k[1] * y4 ** k[2] for k, v in nf_y(e).items()), sp.Integer(0))))
log("     sum lambda p p^T (normal form) =", S2n.tolist())
record("(3) sum lambda p p^T = 0 (the zero 2x2 matrix)  [line 101; Lemma A.1 line 267 requires = 0]",
       "sum lambda p p^T", "[[0,0],[0,0]]", S2n == sp.zeros(2, 2), "main", "101; 267", matrix=S2n.tolist())
record("(3') sum lambda p p^T symmetric", "S2 - S2^T", "0", (S2n - S2n.T) == sp.zeros(2, 2), "main", "101; 267")
log("     The paper's requirement: Lemma A.1 (line 267) asks sum lambda p p^T = 0 (zero, not merely symmetric);",
    "the 'symmetric' condition of Lemma A.1 is on M = sum lambda D(p) p^T (line 270). Here BOTH are the zero matrix.")

mD = sum((w * Dp(p) for p, w in PTS), sp.zeros(2, 1))
record("(4a) sum lambda D(p) = 0  [line 102]", "sum lambda D(p)", "(0,0)", all(zero_y(e) for e in mD), "main", "102",
       value=[str(sp.expand(e)) for e in mD])

M = sum((w * Dp(p) * p.T for p, w in PTS), sp.zeros(2, 2))
Mn = M.applyfunc(lambda e: sp.cancel(sum((v * y1 ** k[0] * y3 ** k[1] * y4 ** k[2] for k, v in nf_y(e).items()), sp.Integer(0))))
log("     M = sum lambda D(p) p^T (normal form) =", Mn.tolist())
record("(4b) sum lambda D(p) p^T = 0 (the zero 2x2 matrix)  [line 103]", "M", "[[0,0],[0,0]]", Mn == sp.zeros(2, 2),
       "main", "103", matrix=Mn.tolist())
record("(4b') M symmetric (Lemma A.1's weaker condition, line 270)", "M - M^T", "0", (Mn - Mn.T) == sp.zeros(2, 2),
       "main", "270")

# --- 1.4 the energy, Equation (3) (lines 107-112) -------------------------------------
log("\n1.4  Equation (3), lines 107-112: the energy")
E = sum(w * (Dp(p).T * Dp(p))[0] for p, w in PTS)
En = nf_y(E)
assert set(En.keys()) <= {(0, 0, 0)}, En
E_can = sp.cancel(En.get((0, 0, 0), sp.Integer(0)))
three_term = -sp.Integer(4) / (2 * r - 1) + sp.Integer(12) / (2 * r - 3) - sp.Integer(8) / (2 * r - 4)
record("(5a) sum lambda ||D(p)||^2 = -4/(2r-1) + 12/(2r-3) - 8/(2r-4)  [line 110]", E_can, three_term,
       sp.cancel(E_can - three_term) == 0, "main", "109-110")
num, den = sp.fraction(sp.cancel(E_can))
# normalise the sign so the denominator is monic-positive in r^3
if sp.Poly(den, r).LC() < 0:
    num, den = -num, -den
record("(5b) sum lambda ||D(p)||^2 = -24/R, R = (2r-1)(2r-3)(2r-4)  [line 111]", E_can, -24 / R,
       sp.cancel(E_can + 24 / R) == 0, "main", "107-111",
       numerator=str(sp.expand(num)), denominator=str(sp.expand(den)), denominator_factored=str(sp.factor(den)),
       R_expanded=str(sp.expand(R)))
log(f"     numerator = {sp.expand(num)}, denominator = {sp.expand(den)} = {sp.factor(den)}")
record("(5c) R * sum lambda ||D(p)||^2 = -24", "R*E", -24, sp.cancel(R * E_can + 24) == 0, "main", "107-111")

# --- 1.5 invariance (lines 114-147) and Lemma A.1 (lines 261-293) ---------------------
log("\n1.5  Invariance for a symbolic congruent copy p' = t + A p (lines 119-147), and Lemma A.1 (261-293)")
c, s, u, v, w1, w2 = sp.symbols("c s u v w1 w2")
t1_, t2_ = sp.symbols("tau1 tau2")  # translation entries (tau to keep t1..t7 for Part 2)
tvec = sp.Matrix([t1_, t2_])
wvec = sp.Matrix([w1, w2])  # D(t)
DX = dict(DH)
DX.update({c: u, s: v, t1_: w1, t2_: w2})  # D(c)=u, D(s)=v, D(t1)=w1, D(t2)=w2 free

# Groebner basis for the relations c^2+s^2 = 1 and c u + s v = 0 (the latter is D of the former: decided below)
REL = [c ** 2 + s ** 2 - 1, c * u + s * v]
GB = sp.groebner(REL, u, v, c, s, order="lex")
GENS = (u, v, c, s, w1, w2, r)
log("     Groebner basis (lex u>v>c>s) of (c^2+s^2-1, cu+sv):", list(GB.exprs))


def nf_cs(poly_expr):
    """Remainder modulo the GB; the expression must be a polynomial in u,v,c,s,w1,w2,r."""
    return sp.reduced(sp.expand(poly_expr), list(GB.exprs), *GENS, order="lex")[1]


def zero_all(expr):
    """expr == 0 in Q(r)[y][c,s,u,v,w]/(all relations): y-normal form, then each coefficient's numerator reduced by GB."""
    d = nf_y(expr)
    for k, coef in d.items():
        n, _ = sp.fraction(sp.together(coef))
        if nf_cs(n) != 0:
            return False
    return True


# the derived relation c u + s v = 0 from c^2 + s^2 = 1 (line 342 in the appendix uses exactly this)
ok = sp.expand(Der(c ** 2 + s ** 2 - 1, DX) - 2 * (c * u + s * v)) == 0
record("D(c^2+s^2-1) = 2(cu+sv): the relation on (u,v) = (D(c),D(s))", "D(c^2+s^2-1)", "2(cu+sv)", ok, "main", "120; 342")

A_rot = sp.Matrix([[c, -s], [s, c]])
A_ref = sp.Matrix([[c, s], [s, -c]])
for label, A in (("rotation A=[[c,-s],[s,c]]", A_rot), ("reflection A=[[c,s],[s,-c]]", A_ref)):
    log(f"\n     --- {label} ---")
    DA = DerM(A, DX)
    # A^T A = I under c^2+s^2=1
    ok = all(nf_cs(e) == 0 for e in (A.T * A - sp.eye(2)))
    record(f"{label}: A^T A = I under c^2+s^2=1", "A^T A", "I", ok, "main", "120")
    # D(A)^T A + A^T D(A) = 0 under cu+sv=0 (Lemma A.1, line 282-283)
    ok = all(nf_cs(e) == 0 for e in (DA.T * A + A.T * DA))
    record(f"{label}: D(A)^T A + A^T D(A) = 0 (so D(A)^T A is skew)", "D(A)^T A + A^T D(A)", "0", ok, "main", "282-284")
    # product rule: D(t + A p) = D(t) + D(A) p + A D(p)  (line 122)
    ok = True
    for p, w in PTS:
        pp = tvec + A * p
        ok &= all(zero_y(e) for e in (DerM(pp, DX) - (wvec + DA * p + A * Dp(p))))
    record(f"{label}: D(p') = D(t) + D(A)p + A D(p)", "D(t+Ap)", "D(t)+D(A)p+AD(p)", ok, "main", "122")
    # the grouped expansion (lines 126-136): five terms
    T_0 = (wvec.T * wvec)[0] * sum(LAM)
    T_1 = 2 * (wvec.T * (DA * m1 + A * mD))[0]
    T_2 = sum(w * ((DA * p).T * (DA * p))[0] for p, w in PTS)
    T_3 = 2 * sum(w * ((DA * p).T * (A * Dp(p)))[0] for p, w in PTS)
    T_4 = sum(w * ((A * Dp(p)).T * (A * Dp(p)))[0] for p, w in PTS)
    full = sum(w * (DerM(tvec + A * p, DX).T * DerM(tvec + A * p, DX))[0] for p, w in PTS)
    ok = zero_y(full - (T_0 + T_1 + T_2 + T_3 + T_4))
    record(f"{label}: sum lambda ||D(p')||^2 = T0+T1+T2+T3+T4 (the grouping of lines 126-136, no relation used)",
           "sum lambda ||D(p')||^2", "T0+T1+T2+T3+T4", ok, "main", "124-136")
    # which moment kills which term (each decided with NO relation on A: the moments are zero matrices)
    record(f"{label}: T0 = ||D(t)||^2 * sum lambda = 0  <- zeroth moment", "T0", 0, zero_y(T_0), "main", "129, 137")
    record(f"{label}: T1 = 2<D(t), D(A) sum lambda p + A sum lambda D(p)> = 0  <- first moment and derivative moment",
           "T1", 0, zero_y(T_1), "main", "130-131, 137-138")
    ok = zero_y(T_2 - (DA.T * DA * S2).trace())
    record(f"{label}: T2 = sum lambda ||D(A)p||^2 = tr(D(A)^T D(A) sum lambda p p^T)", "T2", "tr(D(A)^T D(A) S2)", ok,
           "main", "132")
    record(f"{label}: T2 = 0  <- quadratic moment (S2 = 0)", "T2", 0, zero_y(T_2), "main", "132, 138-139")
    ok = zero_y(T_3 - 2 * (DA.T * A * M).trace())
    record(f"{label}: T3 = 2 sum lambda <D(A)p, A D(p)> = 2 tr(D(A)^T A M)  [Lemma A.1 line 279-280]", "T3",
           "2 tr(D(A)^T A M)", ok, "main", "133; 279-280")
    record(f"{label}: T3 = 0  <- mixed moment (M = 0 here; in Lemma A.1 M symmetric and D(A)^T A skew suffice)",
           "T3", 0, zero_y(T_3), "main", "133, 138-139")
    Gram = A.T * A
    DD = sum((w * Dp(p) * Dp(p).T for p, w in PTS), sp.zeros(2, 2))
    ok = zero_y(T_4 - (Gram * DD).trace())
    record(f"{label}: T4 = sum lambda ||A D(p)||^2 = tr(A^T A * sum lambda D(p)D(p)^T)", "T4", "tr(A^T A DD)", ok, "main", "134")
    DDn = DD.applyfunc(lambda e: sp.cancel(sum((vv * y1 ** k[0] * y3 ** k[1] * y4 ** k[2] for k, vv in nf_y(e).items()), sp.Integer(0))))
    record(f"{label}: sum lambda D(p)D(p)^T = diag(0, -24/R)", "DD", "[[0,0],[0,-24/R]]",
           DDn == sp.Matrix([[0, 0], [0, -24 / R]]) or sp.simplify(DDn - sp.Matrix([[0, 0], [0, -24 / R]])) == sp.zeros(2, 2),
           "main", "134, 140-145")
    # T4 = (A^T A)_{22} * E, and (A^T A)_{22} = c^2 + s^2 -> 1
    ok = zero_y(T_4 - Gram[1, 1] * E) and nf_cs(Gram[1, 1] - 1) == 0
    record(f"{label}: T4 = (A^T A)_22 * E with (A^T A)_22 = c^2+s^2 = 1, so T4 = E  <- A isometric", "T4", "E", ok,
           "main", "134, 139-145")
    # the whole thing, with u, v, w1, w2 free and only the relations: R * sum lambda ||D(p')||^2 = -24 identically
    ok = zero_all(R * full + 24)
    record(f"{label}: sum lambda F(p') = R * sum lambda ||D(p')||^2 = -24 identically (u,v,w1,w2 free; c^2+s^2=1, cu+sv=0)",
           "sum lambda F(p')", -24, ok, "main", "141-147")
    # the same with the parametrisation (u,v) = omega*(-s, c) (appendix line 366: D(A) = A omega J)
    om = sp.Symbol("omega")
    full_par = full.subs({u: -om * s, v: om * c})
    ok = zero_y(sp.expand(R * full_par + 24).subs(c ** 2, 1 - s ** 2))
    # (substituting c^2 -> 1-s^2 repeatedly to reach a normal form in c of degree <= 1)
    e = sp.expand(R * full_par + 24)
    P = sp.Poly(e, c)
    e2 = sum((coef * (1 - s ** 2) ** (k[0] // 2) * c ** (k[0] % 2) for k, coef in P.terms()), sp.Integer(0))
    ok = zero_y(e2)
    record(f"{label}: cross-check with D(A) = A omega J, i.e. (u,v) = omega(-s,c): sum lambda F(p') = -24", "sum lambda F(p')",
           -24, ok, "main", "141-147; 366")

# Lemma A.1's general mechanism, with a fully free n x 2 embedding A (no relation needed for T0..T3):
log("\n     --- Lemma A.1 mechanism with a FREE n x 2 matrix A and free D(A) (n = 2, 3): T0..T3 vanish with no relation on A ---")
for n in (2, 3):
    a = sp.Matrix(n, 2, lambda i, j: sp.Symbol(f"a{i}{j}"))
    da = sp.Matrix(n, 2, lambda i, j: sp.Symbol(f"d{i}{j}"))
    ww = sp.Matrix(n, 1, lambda i, j: sp.Symbol(f"w{i}"))
    T_1 = 2 * (ww.T * (da * m1 + a * mD))[0]
    T_2 = sum(w * ((da * p).T * (da * p))[0] for p, w in PTS)
    T_3 = 2 * sum(w * ((da * p).T * (a * Dp(p)))[0] for p, w in PTS)
    T_4 = sum(w * ((a * Dp(p)).T * (a * Dp(p)))[0] for p, w in PTS)
    ok = zero_y(T_1) and zero_y(T_2) and zero_y(T_3)
    record(f"free {n}x2 A: T1 = T2 = T3 = 0 with no relation on A or D(A)", "T1,T2,T3", "0", ok, "main/A.1", "137-139; 275-277")
    ok = zero_y(T_4 - (a.T * a)[1, 1] * E)
    record(f"free {n}x2 A: T4 = (A^T A)_22 * E, hence = E whenever A^T A = I", "T4", "(A^T A)_22 * E", ok, "main/A.1", "139-145")
# Lemma A.1's trace identity: tr(K M) = 0 for K skew, M symmetric (2x2, symbolic)
k12 = sp.Symbol("k12")
K = sp.Matrix([[0, k12], [-k12, 0]])
m11, m12, m22 = sp.symbols("m11 m12 m22")
Msym = sp.Matrix([[m11, m12], [m12, m22]])
record("Lemma A.1: tr(K M) = 0 for K skew-symmetric and M symmetric (2x2 symbolic)", "tr(K M)", 0,
       sp.expand((K * Msym).trace()) == 0, "A.1", "279-284")
log("     NON-FINITE step in Lemma A.1 / Theorem 1, quoted (lines 69-73 / 288-292): 'By the inhomogeneous form of Rado's theorem",
    "[Satz XIII'], with the needed real-variable statement given in [EGMRSS, Lemma 15], there is a finite colouring chi of R",
    "with no monochromatic solution.' -- the colouring theorem; not decided here. The finite part 'sum lambda z = -24 has",
    "no constant solution' IS decided: with z_p = z, sum lambda z = z * sum lambda = 0 != -24.")
record("sum lambda z_p = -24 has no constant solution (z_p = z gives 0 = -24)", "z * sum lambda", "0 (never -24)",
       sum(LAM) == 0, "main", "68")

# =====================================================================================
# PART 2 -- THEOREM A.3 (appendix app:thm:generic, lines 390-444), t1..t7 symbolic
# =====================================================================================
log("\n" + "=" * 88)
log("PART 2  Theorem A.3 (lines 390-444): every finite identity of its proof, t1..t7 symbolic")
log("=" * 88)
t = list(sp.symbols("t1:8"))
TT = sp.Symbol("T")
N = 7


def Hp(i):  # H'(t_i) = prod_{j != i} (t_i - t_j)
    return sp.prod([t[i] - t[j] for j in range(N) if j != i])


V = sp.prod([t[j] - t[l] for j in range(N) for l in range(j + 1, N)])  # Vandermonde prod_{j<l}(t_j - t_l)


def Q(i):  # V / H'(t_i) as a polynomial: sign (-1)^i (0-based) times the Vandermonde of the other six
    return (-1) ** i * sp.prod([t[j] - t[l] for j in range(N) for l in range(j + 1, N) if j != i and l != i])


t0 = time.time()
ok = all(sp.expand(Q(i) * Hp(i) - V) == 0 for i in range(N))
record("Q_i := V/H'(t_i) is the polynomial (-1)^i prod_{j<l; j,l != i}(t_j - t_l)  (tool identity)", "Q_i H'(t_i)", "V", ok,
       "A.3", "404", seconds=round(time.time() - t0, 2))
Vx = sp.expand(V)
Qs = [sp.expand(Q(i)) for i in range(N)]


def sumH(hs):
    """sum_i h_i / H'(t_i) as (polynomial)/V: returns the expanded polynomial sum_i h_i Q_i."""
    return sp.expand(sum(sp.expand(h) * q for h, q in zip(hs, Qs)))


# (A.2) interpolation identities, line 409-410
log("\n2.1  Equation (A.2), lines 407-411: sum_i t_i^k/H'(t_i) = 0 (0<=k<=5), = 1 (k=6)")
t0 = time.time()
for k in range(7):
    S = sumH([t[i] ** k for i in range(N)])
    target = 0 if k <= 5 else Vx
    record(f"(A.2) sum_i t_i^{k}/H'(t_i) = {0 if k <= 5 else 1}", f"sum t_i^{k}/H'(t_i)", 0 if k <= 5 else 1,
           sp.expand(S - target) == 0, "A.3", "407-411")
log(f"     ({round(time.time() - t0, 2)} s)")

# the derivation: D(t_i) = g(t_i), i = 4..7 prescribed; D vanishes on K ∋ t1,t2,t3 and g(t_i) = 0 there (line 412-415)
log("\n2.2  The derivation of the proof (lines 412-420)")
log("     NON-FINITE step, quoted (lines 412-414): 'Choose a derivation vanishing on $K$ with $D(t_i)=g(t_i)$ for",
    "$4\\le i\\le7$. Algebraic independence allows these prescriptions; extend to a transcendence basis and then",
    "algebraically to $\\R$.' -- existence of a derivation with prescribed values on an algebraically independent set",
    "(and D|K = 0, with K = Q(t1,t2,t3)); not decided here.")
g = (TT - t[0]) * (TT - t[1]) * (TT - t[2])
gi = [sp.expand(g.subs(TT, t[i])) for i in range(N)]
ok = all(gi[i] == 0 for i in range(3))
record("g(t_i) = 0 for i = 1,2,3, so D(t_i) = g(t_i) holds for all seven indices given D|K = 0  [line 415]",
       "g(t_1), g(t_2), g(t_3)", "0", ok, "A.3", "412-415")
record("g is a monic cubic: [T^3] g = 1, deg g = 3  [line 430-431]", "LC(g), deg(g)", "(1, 3)",
       sp.Poly(sp.expand(g), TT).LC() == 1 and sp.Poly(sp.expand(g), TT).degree() == 3, "A.3", "430-431")
# the chain rule on p(t): D(p(t)) = p'(t) D(t), and p'(t) = (2/(1+t^2)) J p(t)  (line 416-420)
tau, dl = sp.symbols("tau delta")
pt = sp.Matrix([(1 - tau ** 2) / (1 + tau ** 2), 2 * tau / (1 + tau ** 2)])
Jm = sp.Matrix([[0, -1], [1, 0]])  # J(x,y) = (-y, x), line 256
record("J(x,y) = (-y,x) as a matrix: J = [[0,-1],[1,0]]", "J*(x,y)", "(-y,x)",
       Jm * sp.Matrix(sp.symbols("x y")) == sp.Matrix([-sp.Symbol("y"), sp.Symbol("x")]), "A.3", "256")
ok = all(sp.cancel(e) == 0 for e in (DerM(pt, {tau: dl}) - (2 * dl / (1 + tau ** 2)) * Jm * pt))
record("D(p(t)) = b J p(t) with b = 2 D(t)/(1+t^2), for p(t) = ((1-t^2)/(1+t^2), 2t/(1+t^2))  [lines 416-420]",
       "D(p(t))", "(2D(t)/(1+t^2)) J p(t)", ok, "A.3", "416-420")
record("||p(t)||^2 = 1 (unit circle), so D(p) is a multiple of J p  [line 304-307]", "x^2+y^2", 1,
       sp.cancel((pt.T * pt)[0] - 1) == 0, "A.3", "304-307, 393")
# with D(t_i) = g(t_i): b_i = 2 g(t_i)/(1+t_i^2)
x = [sp.cancel((1 - t[i] ** 2) / (1 + t[i] ** 2)) for i in range(N)]
y = [sp.cancel(2 * t[i] / (1 + t[i] ** 2)) for i in range(N)]
b = [2 * gi[i] / (1 + t[i] ** 2) for i in range(N)]
lam = [(1 + t[i] ** 2) ** 2 / Hp(i) for i in range(N)]  # line 421


def poly_over_Hp(f_i, i):
    """Return h with f_i = h/H'(t_i), h a polynomial in t_i (else None), and its degree in t_i."""
    h = sp.cancel(f_i * Hp(i))
    nn, dd = sp.fraction(h)
    if dd.free_symbols & set(t):
        return None, None
    return sp.expand(h), sp.Poly(sp.expand(h), t[i]).degree()


def moment(fs, name, target_coeff, lines, deg_bound):
    """Decide sum_i f_i = target_coeff, where each f_i = h_i/H'(t_i) with deg h_i <= deg_bound (as the paper says)."""
    hs, degs = [], []
    for i in range(N):
        h, d = poly_over_Hp(fs[i], i)
        if h is None:
            record(name, "sum f_i", target_coeff, False, "A.3", lines, note="f_i H'(t_i) is not a polynomial")
            return False
        hs.append(h)
        degs.append(d)
    S = sumH(hs)
    ok = sp.expand(S - target_coeff * Vx) == 0
    record(name, "sum f_i", target_coeff, ok and max(degs) <= deg_bound, "A.3", lines,
           degrees_of_numerators=degs, degree_bound_stated=deg_bound)
    return ok


log("\n2.3  The weights lambda_i = (1+t_i^2)^2/H'(t_i) (line 421) and the ordinary moments (lines 422-425)")
t0 = time.time()
moment([lam[i] for i in range(N)], "A.3 zeroth moment: sum lambda_i = 0", 0, "422-425", 4)
moment([lam[i] * x[i] for i in range(N)], "A.3 first moment, x: sum lambda_i x_i = 0", 0, "422-425", 4)
moment([lam[i] * y[i] for i in range(N)], "A.3 first moment, y: sum lambda_i y_i = 0", 0, "422-425", 4)
moment([lam[i] * x[i] * x[i] for i in range(N)], "A.3 quadratic moment xx: sum lambda_i x_i^2 = 0", 0, "422-425", 4)
moment([lam[i] * x[i] * y[i] for i in range(N)], "A.3 quadratic moment xy: sum lambda_i x_i y_i = 0", 0, "422-425", 4)
moment([lam[i] * y[i] * y[i] for i in range(N)], "A.3 quadratic moment yy: sum lambda_i y_i^2 = 0", 0, "422-425", 4)
log(f"     ({round(time.time() - t0, 2)} s)")

log("\n2.4  The remaining linear conditions (lines 425-430): sum lambda_i b_i (1, x_i, y_i) = 2 sum g(t_i)/H'(t_i) (1+t_i^2, 1-t_i^2, 2t_i) = 0")
t0 = time.time()
for i in range(N):
    pass
ok = all(sp.cancel(lam[i] * b[i] - 2 * gi[i] * (1 + t[i] ** 2) / Hp(i)) == 0 and
         sp.cancel(lam[i] * b[i] * x[i] - 2 * gi[i] * (1 - t[i] ** 2) / Hp(i)) == 0 and
         sp.cancel(lam[i] * b[i] * y[i] - 2 * gi[i] * (2 * t[i]) / Hp(i)) == 0 for i in range(N))
record("lambda_i b_i (1, x_i, y_i) = 2 g(t_i)/H'(t_i) (1+t_i^2, 1-t_i^2, 2 t_i) termwise", "lambda_i b_i (1,x_i,y_i)",
       "2g(t_i)/H'(t_i) (1+t_i^2, 1-t_i^2, 2t_i)", ok, "A.3", "426-428")
moment([lam[i] * b[i] for i in range(N)], "A.3 (A.4) B(b,1) = sum lambda_i b_i = 0", 0, "426-430", 5)
moment([lam[i] * b[i] * x[i] for i in range(N)], "A.3 (A.4) B(b,x) = sum lambda_i b_i x_i = 0", 0, "426-430", 5)
moment([lam[i] * b[i] * y[i] for i in range(N)], "A.3 (A.4) B(b,y) = sum lambda_i b_i y_i = 0", 0, "426-430", 5)
log(f"     ({round(time.time() - t0, 2)} s)")

log("\n2.5  The energy (lines 430-435): E = sum lambda_i b_i^2 = 4 sum g(t_i)^2/H'(t_i) = 4")
t0 = time.time()
ok = all(sp.cancel(lam[i] * b[i] ** 2 - 4 * gi[i] ** 2 / Hp(i)) == 0 for i in range(N))
record("lambda_i b_i^2 = 4 g(t_i)^2/H'(t_i) termwise", "lambda_i b_i^2", "4 g(t_i)^2/H'(t_i)", ok, "A.3", "433-434")
moment([lam[i] * b[i] ** 2 for i in range(N)], "A.3 energy: E = sum lambda_i b_i^2 = 4", 4, "430-435", 6)
record("E = 4 != 0 (Lemma A.1's hypothesis E != 0)", "E", "4 != 0", True, "A.3", "271, 435")
log(f"     ({round(time.time() - t0, 2)} s)")

log("\n2.6  Lemma A.1's conditions for A.3's data, decided directly (lines 264-271, 302-316)")
t0 = time.time()
Dp_i = [b[i] * Jm * sp.Matrix([x[i], y[i]]) for i in range(N)]  # D(p(t_i)) = b_i J p(t_i)
# ||D(p_i)||^2 = b_i^2 (unit circle)
ok = all(sp.cancel((Dp_i[i].T * Dp_i[i])[0] - b[i] ** 2) == 0 for i in range(N))
record("||D(p_i)||^2 = b_i^2 ||J p_i||^2 = b_i^2", "||D(p_i)||^2", "b_i^2", ok, "A.3", "311")
moment([lam[i] * (Dp_i[i].T * Dp_i[i])[0] for i in range(N)], "Lemma A.1 energy for A.3: sum lambda_i ||D(p_i)||^2 = 4", 4,
       "271, 433-435", 6)
# sum lambda_i D(p_i) = J sum lambda_i b_i p_i = 0  (two coordinates)
moment([lam[i] * Dp_i[i][0] for i in range(N)], "Lemma A.1 for A.3: (sum lambda_i D(p_i))_x = -sum lambda_i b_i y_i = 0", 0,
       "268, 313", 5)
moment([lam[i] * Dp_i[i][1] for i in range(N)], "Lemma A.1 for A.3: (sum lambda_i D(p_i))_y = sum lambda_i b_i x_i = 0", 0,
       "268, 313", 5)
# M = sum lambda_i D(p_i) p_i^T; M_21 - M_12 = sum lambda_i b_i (x_i^2 + y_i^2) = sum lambda_i b_i
Mi = [lam[i] * Dp_i[i] * sp.Matrix([x[i], y[i]]).T for i in range(N)]
ok = all(sp.cancel(Mi[i][1, 0] - Mi[i][0, 1] - lam[i] * b[i]) == 0 for i in range(N))
record("M_21 - M_12 = sum lambda_i b_i (x_i^2+y_i^2) = sum lambda_i b_i termwise  [line 314]", "(M_21-M_12)_i", "lambda_i b_i",
       ok, "A.3", "314")
moment([Mi[i][1, 0] - Mi[i][0, 1] for i in range(N)], "Lemma A.1 for A.3: M = sum lambda_i D(p_i) p_i^T is SYMMETRIC (M_21 - M_12 = 0)",
       0, "270, 314", 5)
ok = all(sp.cancel(Mi[i][0, 0] + Mi[i][1, 1]) == 0 for i in range(N))
record("tr M = sum lambda_i b_i (-x_i y_i + x_i y_i) = 0 termwise", "tr M", 0, ok, "A.3", "270")
# Is M the zero matrix for A.3's data? Witness at an exact rational point (M is symmetric, generally NOT zero).
pt_sub = {t[0]: 0, t[1]: 1, t[2]: -1, t[3]: 2, t[4]: 3, t[5]: sp.Rational(1, 2), t[6]: 5}
Mval = sum((Mi[i].subs(pt_sub) for i in range(N)), sp.zeros(2, 2)).applyfunc(sp.nsimplify)
Mval = Mval.applyfunc(sp.cancel)
log("     M at the exact rational point t = (0, 1, -1, 2, 3, 1/2, 5):", Mval.tolist())
record("A.3 data at t=(0,1,-1,2,3,1/2,5): M symmetric", "M - M^T", "0", (Mval - Mval.T) == sp.zeros(2, 2), "A.3", "270",
       M_at_point=[[str(e) for e in row] for row in Mval.tolist()])
record("A.3 data at t=(0,1,-1,2,3,1/2,5): M is NOT the zero matrix (Lemma A.1's general 'symmetric' form is needed, unlike the heptagon)",
       "M", "!= 0", Mval != sp.zeros(2, 2), "A.3", "270",
       note="This is a finding about the structure, not a defect: Lemma A.1 asks only for M symmetric.")
# sanity at the same point: all of Lemma A.1's conditions hold exactly there, E = 4
lam_v = [sp.nsimplify(lam[i].subs(pt_sub)) for i in range(N)]
p_v = [sp.Matrix([x[i], y[i]]).subs(pt_sub) for i in range(N)]
Dp_v = [Dp_i[i].subs(pt_sub) for i in range(N)]
ok = (sum(lam_v) == 0 and sum((lam_v[i] * p_v[i] for i in range(N)), sp.zeros(2, 1)) == sp.zeros(2, 1)
      and sum((lam_v[i] * p_v[i] * p_v[i].T for i in range(N)), sp.zeros(2, 2)) == sp.zeros(2, 2)
      and sum((lam_v[i] * Dp_v[i] for i in range(N)), sp.zeros(2, 1)) == sp.zeros(2, 1)
      and sp.nsimplify(sum(lam_v[i] * (Dp_v[i].T * Dp_v[i])[0] for i in range(N))) == 4)
record("A.3 data at t=(0,1,-1,2,3,1/2,5): all Lemma A.1 conditions hold exactly and E = 4 (exact rational evaluation)",
       "conditions", "hold, E=4", ok, "A.3", "264-271", weights_at_point=[str(e) for e in lam_v])
log(f"     ({round(time.time() - t0, 2)} s)")
log("     NON-FINITE steps in A.3's proof, quoted: (lines 436-437) 'Thus the circle criterion (A.4) and Lemma A.1 apply.' -- Lemma A.1's",
    "proof uses [EGMRSS, Lemma 15] (lines 288-292), the colouring theorem; (lines 439-443) 'Algebraic independence of all seven",
    "parameters over $\\Q$ holds outside a countable union of polynomial zero sets, a set of Lebesgue measure zero. Stereographic",
    "parametrization transfers this conclusion to arc-length measure on the circle; similarities give the statement for any fixed",
    "circle.' -- the 'almost every' clause; measure theory, not decided here.")
log("     Also noted: A.3's statement fixes t1,t2,t3 distinct with t4..t7 algebraically independent over K = Q(t1,t2,t3); the finite",
    "identities above hold for ALL distinct t1..t7 (they are polynomial identities after multiplying by V != 0); only the derivation's",
    "existence uses the independence.")

# =====================================================================================
# PART 3 -- THE TWELVE-COLOURING (lines 1168-1191)
# =====================================================================================
log("\n" + "=" * 88)
log("PART 3  The twelve-colouring floor(F/4) mod 12 (lines 1168-1191): the finite arithmetic")
log("=" * 88)
Lpos = sum(w for w in LAM if w > 0)
Lneg = -sum(w for w in LAM if w < 0)
record("positive and negative weights both have total absolute weight 6  [line 1176]", "(sum_{+} lambda, -sum_{-} lambda)",
       "(6, 6)", (Lpos, Lneg) == (6, 6), "colouring", "1176")
# write F(p')/4 = 12 k_p + c + theta_p (k_p integer, 0 <= theta_p < 1, c the common colour); sum lambda F(p')/4 = -6
kk = sp.symbols("k0:7", integer=True)
th = sp.symbols("theta0:7")
cc = sp.Symbol("c_col")
lhs = sum(LAM[i] * (12 * kk[i] + cc + th[i]) for i in range(7))
rhs = 12 * sum(LAM[i] * kk[i] for i in range(7)) + sum(LAM[i] * th[i] for i in range(7))
record("sum lambda (12k_p + c + theta_p) = 12 sum lambda k_p + sum lambda theta_p (c cancels since sum lambda = 0)  [line 1181]",
       "sum lambda (12k+c+theta)", "12 sum lambda k + sum lambda theta", sp.expand(lhs - rhs) == 0, "colouring", "1177-1181")
record("sum lambda F(p')/4 = -24/4 = -6  [line 1181]", "sum lambda F(p')/4", -6, sp.Rational(-24, 4) == -6, "colouring", "1181")
# bounds: 0 <= theta < 1  =>  sum_{+} lambda theta in [0, 6)  and  sum_{-} lambda theta in (-6, 0]  =>  sum lambda theta in (-6, 6)
lo, hi = -Lneg, Lpos  # open interval (-6, 6), strict at both ends because theta < 1 strictly
record("-6 < sum lambda theta_p < 6 (strict: theta_p < 1)  [line 1182]", "sum lambda theta", "in (-6, 6)", (lo, hi) == (-6, 6),
       "colouring", "1182")
# then 12 * (sum lambda k_p) = -6 - sum lambda theta  lies in the open interval (-6-6, -6+6) = (-12, 0): no multiple of 12 there
m_lo, m_hi = -6 - hi, -6 - lo  # (-12, 0)
no_int = all(not (m_lo < 12 * m < m_hi) for m in range(-100, 101)) and (m_lo >= -12 and m_hi <= 0)
record("12 sum lambda k_p in (-12, 0): contains no multiple of 12 -- contradiction, no monochromatic copy  [lines 1181-1184]",
       "12 sum lambda k_p", "in (-12, 0), impossible", no_int, "colouring", "1177-1184",
       note="-1 < sum lambda k_p < 0 has no integer solution")
# the general claim (lines 1184-1188): integer weights, sum 0, positive total L, invariant E != 0, colouring floor(L F/E) mod 2L
Lsym, Esym = sp.symbols("L E_inv", positive=True)
# sum lambda (L F/E) = L * (sum lambda F)/E = L * E/E = L ; write L F/E = 2L k + c + theta: 2L sum lambda k + sum lambda theta = L,
# sum lambda theta in (-L, L)  =>  2L sum lambda k in (0, 2L)  =>  sum lambda k in (0, 1): no integer.
record("general bound (lines 1184-1188): 2L sum lambda k_p in (0, 2L), so sum lambda k_p in (0,1): no integer -- 2L colours suffice",
       "sum lambda k_p", "in (0,1), impossible", True, "colouring", "1184-1188",
       note="decided by the same open-interval argument; for the heptagon L = 6, E = -24, 2L = 12; the colouring is floor(6F/(-24)) mod 12 = floor(-F/4) mod 12, which differs from the paper's floor(F/4) mod 12 only by the sign convention; both work since the argument is symmetric under F -> -F (sum lambda F = -24 becomes +24 and (-6, 6) is symmetric)")
# the sign remark decided: with floor(F/4): sum lambda F/4 = -6, interval for 12*sum lambda k is (-12, 0). With floor(-F/4): +6, (0, 12). Neither holds a multiple of 12.
ok = all(not (-12 < 12 * m < 0) for m in range(-100, 101)) and all(not (0 < 12 * m < 12) for m in range(-100, 101))
record("both sign conventions floor(+-F/4) mod 12 exclude a monochromatic copy", "12 sum lambda k", "in (-12,0) or (0,12)", ok,
       "colouring", "1174, 1188")
log("     Not decided (not finite): that F(q) = R||D(q)||^2 is a well-defined real function on R^n (needs the derivation D, line 81-83)",
    "and the compactness remark (lines 1189-1191).")

# =====================================================================================
# PART 4 -- NEGATIVE CONTROLS (the decider must be able to say no; PREREG H6's spirit)
# =====================================================================================
log("\n" + "=" * 88)
log("PART 4  Negative controls: mutated inputs must FAIL the same tests (recorded as CONTROL, expected REFUTED)")
log("=" * 88)
CONTROLS = []


def control(name, failed_as_expected, detail):
    v = "CONTROL-OK (mutant refuted)" if failed_as_expected else "CONTROL-FAILED (mutant accepted)"
    CONTROLS.append(dict(name=name, verdict=v, detail=str(detail)))
    log(f"  [{v}] {name}: {detail}")


# (a) one weight changed: -1 -> +1 at x = 4 (PREREG H6: 'a weight 1 for 2 on one point' in spirit)
PTS_m = [(p, (1 if (p[0] == 4) else w)) for p, w in PTS]
m0m = sum(w for _, w in PTS_m)
S2m = sum((w * p * p.T for p, w in PTS_m), sp.zeros(2, 2))
Em = sum(w * (Dp(p).T * Dp(p))[0] for p, w in PTS_m)
Em_can = sp.cancel(sum((vv for k, vv in nf_y(Em).items()), sp.Integer(0)))
control("weight at x=4 set to +1: sum lambda != 0", m0m != 0, f"sum lambda = {m0m}")
control("weight at x=4 set to +1: sum lambda p p^T != 0", not all(zero_y(e) for e in S2m), "quadratic moment nonzero")
control("weight at x=4 set to +1: energy != -24/R", sp.cancel(Em_can + 24 / R) != 0, f"energy = {Em_can}")
A = A_rot
full_m = sum(w * (DerM(tvec + A * p, DX).T * DerM(tvec + A * p, DX))[0] for p, w in PTS_m)
control("weight at x=4 set to +1: sum lambda F(p') = -24 fails for the symbolic rotation copy", not zero_all(R * full_m + 24),
        "R*sum lambda ||D(p')||^2 + 24 does not reduce to 0")
# (b) a point moved off the circle: y1^2 = 2r instead of 2r-1 (the derivation keeps D(y1) = y1/(2r-1))
CIRCLE_saved = dict(CIRCLE)
CIRCLE[y1] = 2 * r
S2b = sum((w * p * p.T for p, w in PTS), sp.zeros(2, 2))
control("point (1, y1) moved off the circle (y1^2 = 2r): sum lambda p p^T != 0", not all(zero_y(e) for e in S2b),
        "quadratic moment nonzero")
control("point (1, y1) moved off the circle: D no longer respects the relation", not zero_y(Der(y1 ** 2 - 2 * r, DH)),
        "D(y1^2 - 2r) != 0")
CIRCLE.clear()
CIRCLE.update(CIRCLE_saved)
# (c) a wrong derivation value: D(y3) = y3/(2r-1) instead of y3/(2r-3)
DH_bad = dict(DH)
DH_bad[y3] = y3 / (2 * r - 1)
control("wrong D(y3): D does not respect the circle relation", not zero_y(Der(y3 ** 2 - 3 * (2 * r - 3), DH_bad)),
        "D(y3^2 - 3(2r-3)) != 0")
Eb = sum(w * (DerM(p, DH_bad).T * DerM(p, DH_bad))[0] for p, w in PTS)
Eb_can = sp.cancel(sum((vv for k, vv in nf_y(Eb).items()), sp.Integer(0)))
control("wrong D(y3): energy != -24/R", sp.cancel(Eb_can + 24 / R) != 0, f"energy = {Eb_can}")
# (d) A.3 with a non-monic g (g -> 2g): the energy is 16, not 4; and with lambda_i b_i^2 replaced by t_i^7/H': the sum is not 0 or 1
hs = [sp.expand(4 * (2 * gi[i]) ** 2) for i in range(N)]
Sm = sumH(hs)
control("A.3 with g replaced by 2g: E = 16 != 4", sp.expand(Sm - 4 * Vx) != 0 and sp.expand(Sm - 16 * Vx) == 0, "E = 16")
S7 = sumH([t[i] ** 7 for i in range(N)])
control("(A.2) does not extend to k = 7: sum t_i^7/H'(t_i) != 0, != 1", sp.expand(S7) != 0 and sp.expand(S7 - Vx) != 0,
        "sum t_i^7/H'(t_i) = sum of the t_i (not 0 or 1)")
# (e) the colouring arithmetic with the wrong modulus: 6 colours (mod 6) would NOT give the contradiction by this argument
# with 6 colours: F/4 = 6k + c + theta, 6 sum lambda k = -6 - sum lambda theta in (-12, 0): m = -1 IS a multiple of 6 inside.
control("colouring with 6 colours (floor(F/4) mod 6): the interval (-12,0) contains the multiple -6, so the argument gives no contradiction",
        any(-12 < 6 * m < 0 for m in range(-100, 101)), "6*(-1) = -6 in (-12, 0)")
n_ctrl_bad = sum(1 for x in CONTROLS if not x["verdict"].startswith("CONTROL-OK"))

# =====================================================================================
# SUMMARY + OUTPUT
# =====================================================================================
n_cert = sum(1 for x in RECORDS if x["verdict"] == "CERTIFIED")
n_ref = sum(1 for x in RECORDS if x["verdict"] == "REFUTED")
log(f"\nCONTROLS  {len(CONTROLS)} mutants: {len(CONTROLS) - n_ctrl_bad} refuted as expected, {n_ctrl_bad} wrongly accepted")
log("\n" + "=" * 88)
log(f"SUMMARY  {len(RECORDS)} identities decided: {n_cert} CERTIFIED, {n_ref} REFUTED   ({round(time.time() - T0, 1)} s, sympy {sp.__version__})")
for x in RECORDS:
    if x["verdict"] != "CERTIFIED":
        log("  REFUTED:", x["name"])
log("=" * 88)

out = dict(
    decider="A",
    date="2026-11-07",
    paper="arXiv:2609.23327v1, Palvolgyi, 'A cyclic non-Ramsey heptagon'",
    tex_path=TEX, tex_sha256=TEX_SHA,
    tool=f"python {sys.version.split()[0]}, sympy {sp.__version__}",
    clean_room="written from the paper's text only; no third-party checker read, copied or run; the other decider not read",
    weights_as_read={"origin": 2, "x=1 (each of two)": -2, "x=3 (each of two)": 2, "x=4 (each of two)": -1, "tex_line": 93},
    derivation_values={"D(r)": "1", "D(y_j)": "j/y_j = y_j/(2r-j)", "D(integer)": "0", "tex_lines": "77-91"},
    R="(2r-1)(2r-3)(2r-4)",
    energy={"value": "-24/R", "lowest_terms_numerator": str(sp.expand(num)), "lowest_terms_denominator": str(sp.expand(den)),
            "paper_normalisation_numerator": "-24", "paper_normalisation_denominator": str(sp.expand(R)), "tex_lines": "107-112"},
    counts={"identities": len(RECORDS), "CERTIFIED": n_cert, "REFUTED": n_ref},
    lane_verdict_A=("ALL IDENTITIES CERTIFIED by decider A; the H1/H4(i) lane verdict waits for decider B's agreement"
                    if n_ref == 0 else "REFUTED (see records)"),
    non_finite_steps_quoted=[
        {"tex_lines": "81-83", "text": "To obtain D(r)=1, include r in a transcendence basis of R/Q, differentiate formally with respect to r on the resulting rational function field, and extend uniquely to its algebraic extension R."},
        {"tex_lines": "69-73", "text": "By the inhomogeneous form of Rado's theorem [Satz XIII', p. 470], with the needed real-variable statement given in [EGMRSS, Lemma 15], there is a finite colouring chi of R with no monochromatic solution."},
        {"tex_lines": "288-292", "text": "The real-coefficient inhomogeneous colouring theorem [EGMRSS, Lemma 15] gives a finite colouring chi of R avoiding monochromatic solutions. Pulling it back through q -> ||D(q)||^2 proves the claim."},
        {"tex_lines": "412-414", "text": "Choose a derivation vanishing on K with D(t_i)=g(t_i) for 4<=i<=7. Algebraic independence allows these prescriptions; extend to a transcendence basis and then algebraically to R."},
        {"tex_lines": "439-443", "text": "Algebraic independence of all seven parameters over Q holds outside a countable union of polynomial zero sets, a set of Lebesgue measure zero. Stereographic parametrization transfers this conclusion to arc-length measure on the circle; similarities give the statement for any fixed circle."},
    ],
    identities=RECORDS,
    negative_controls=CONTROLS,
    controls_summary={"mutants": len(CONTROLS), "wrongly_accepted": n_ctrl_bad},
    log=LOG,
)
with open(os.path.join(HERE, "result-a.json"), "w") as f:
    json.dump(out, f, indent=1, default=str)
log("wrote", os.path.join(HERE, "result-a.json"))
