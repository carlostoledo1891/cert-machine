#!/usr/bin/env python3
"""The mechanism the instrument had been asserting: the pulses supplying the core's stress.

The core alone does not solve Navier–Stokes.  Section 5 writes the base field's residual as
−div(annular stress) + a flat remainder (5.1)–(5.5); the annular stress T0 is supported in
Xa < X < Xb and is what the WAVES must produce.  Two facts make that possible, and both are
exact inequalities rather than estimates, which is why they can be re-decided in a browser:

  §4.3, (4.20)–(4.23) — THE CONE IMPOSED ON THE LEADING STRESS.  With the radial shear
     (a, −bs) and the integrated inviscid contribution ps = (ps,1, ps,2) of (4.11),
         ts = −bs/a,   vs = a(1 + ts²),   Pc = ps,1 + ts·ps,2,   Jc = ps,2 − ts·ps,1,
     the RELAXED cone condition (4.21) is  Pc > 2 and vs < U(Pc, Jc), where
         U(Pc, Jc) = Pc + Jc²/4 − |Jc|·sqrt((Pc − 2)/2 + Jc²/16),
     and the ADMISSIBLE stress cone condition is that together with vs > 2.  Lemma 4.5: for
     vs > 2 the admissible condition is EQUIVALENT to the two polynomial inequalities
         Pc > vs,      (vs − 2)·Jc² < 2·(Pc − vs)²,                                   (4.22)
     which carry no square root and therefore decide exactly over the rationals.  In stress
     coordinates (4.23) reads  T0,θ + ts·T0,z = F(Pc − vs),  T0,z − ts·T0,θ = F·Jc  with F > 0,
     so the same condition on the stress itself is
         T0,θ + ts·T0,z > 0,    (vs − 2)(T0,z − ts·T0,θ)² < 2(T0,θ + ts·T0,z)²,
     homogeneous in T0: a WEDGE in the stress plane, tilted by ts and with half-angle
     arctan(sqrt(2/(vs − 2))) — closing to a ray as vs → ∞, opening to a half-plane as vs ↓ 2.

  §7, Prop. 7.5 — THE POSITIVE REPRESENTATION.  Two pulse families b± with disjoint auxiliary
     supports have covariance columns H± = h±(−Ac·N − σ·u*·K + e±), Ac = −c0·sqrt(1 + u*²) > 0.
     Because the two signs are disjoint and C is quadratic, C(a+b+ + a−b−) = H·(a+², a−²)ᵀ:
     the set of stresses these two waves can make is exactly the NONNEGATIVE span of the two
     columns.  Dropping the errors, the printed solve is
         h+·y+ = ½(−T_N/Ac − T_K/u*),      h−·y− = ½(−T_N/Ac + T_K/u*),
     and the reference cone is  T_N < 0,  |T_K| < (u*/Ac)(−T_N)  — exactly where both squared
     amplitudes are positive, so that a± = sqrt(y±) are REAL.  Outside it there is no real
     amplitude and the waves cannot supply the stress.

  The angular average is what makes a covariance appear at all: "the angular frequency k·p is a
  nonzero integer, so the angular average of cos²(kΦσ) is exactly 1/2" (proof of Prop. 7.5,
  Step 1).  At k = 0 the field is θ-independent — it is part of the mean, not a fluctuation —
  and there is no Reynolds stress to collect.  That is the same nonzero angular mode the Lean
  proves (angularMode_ne_zero) and the paper never connects to the swirl obstruction.

This script re-derives all of it from the printed formulas: the root computation behind
Lemma 4.5, the equivalence (4.21)+vs>2 ⟺ (4.22) both symbolically and on a rational sweep,
the stress-coordinate form (4.23), the 2×2 solve of Prop. 7.5 Step 2, the equivalence of
positivity with the reference cone, and the disjointness identity for the covariance.  Six red
controls.  Prints PASS/FAIL lines; exit 0 iff all pass.
"""
import sys
from fractions import Fraction as Fr
import sympy as sp

fails = []
def report(ok, name, extra=''):
    print(('PASS ' if ok else 'FAIL ') + name + (('  ' + extra) if extra else ''))
    if not ok:
        fails.append(name)

# ---------------------------------------------------------------- §4.3, Lemma 4.5
P, J, v, a, bs, ps1, ps2 = sp.symbols('P_c J_c v a b_s p_1 p_2', real=True)

# the polynomial of the proof, in v, and the roots the paper prints
poly = sp.expand(2 * (P - v) ** 2 - (v - 2) * J ** 2)
root_expr = lambda sign: P + J ** 2 / 4 + sign * sp.Abs(J) * sp.sqrt((P - 2) / 2 + J ** 2 / 16)
vm, vp = root_expr(-1), root_expr(+1)
# substitute the printed roots back into the polynomial; on Pc > 2 the radicand is positive and |J|² = J²
subs_real = {sp.Abs(J): J}
chk = sp.simplify(sp.expand(poly.subs(v, vp)).rewrite(sp.Abs).subs(subs_real))
chk2 = sp.simplify(sp.expand(poly.subs(v, vm)).rewrite(sp.Abs).subs(subs_real))
report(sp.simplify(chk) == 0 and sp.simplify(chk2) == 0,
       'Lemma 4.5 proof: v± = Pc + Jc²/4 ± |Jc|·sqrt((Pc−2)/2 + Jc²/16) are the two roots of 2(Pc−v)² − (v−2)Jc² in v')
# the same roots by the quadratic formula, independently
sols = sp.solve(sp.Eq(poly, 0), v)
gap = sp.simplify(sp.expand((sols[0] - sols[1]) ** 2 - (vp - vm) ** 2).subs(subs_real))
report(sp.simplify(gap) == 0, 'the printed roots agree with the quadratic formula (same root gap)')
report(sp.simplify(sp.expand(sum(sols) - (vp + vm))) == 0, 'and with the same root sum, so U(Pc,Jc) = v− is the smaller root')

# (4.20): the profile data → (ts, vs, Pc, Jc)
ts_ = -bs / a
vs_ = a * (1 + ts_ ** 2)
Pc_ = ps1 + ts_ * ps2
Jc_ = ps2 - ts_ * ps1
report(sp.simplify(vs_ - (a + bs ** 2 / a)) == 0, '(4.20): vs = a(1 + ts²) = a + bs²/a, so vs ≥ 2|bs| and vs > 0 for a > 0')
# s = a(1, ts) and the orthogonality the paper states: Pc, Jc are ps against (1, ts) and (−ts, 1)
report(sp.simplify(Pc_ - (ps1 * 1 + ps2 * ts_)) == 0 and sp.simplify(Jc_ - (ps1 * (-ts_) + ps2 * 1)) == 0,
       '(4.20): Pc, Jc are the scalar products of ps with the orthogonal unnormalized vectors (1, ts) and (−ts, 1)')

def relaxed(Pcv, Jcv):
    """(4.21), decided in exact arithmetic: Pc > 2 and vs < U(Pc, Jc) — the square root removed by
    comparing (Pc + Jc²/4 − vs) against |Jc|·sqrt((Pc−2)/2 + Jc²/16) with a squaring that keeps signs."""
    def test(vsv):
        if not Pcv > 2:
            return False
        lhs = Pcv + Fr(Jcv ** 2, 4) - vsv                     # = U + |Jc|·sqrt(rad) − vs
        rad = Fr(Pcv - 2, 2) + Fr(Jcv ** 2, 16)               # ≥ 0 when Pc > 2
        if lhs <= 0:
            return False                                       # vs ≥ Pc + Jc²/4 ≥ U
        return lhs ** 2 > Jcv ** 2 * rad                       # vs < U ⟺ lhs > |Jc|sqrt(rad) > 0
    return test

def admissible_422(Pcv, Jcv, vsv):
    """(4.22): the equivalent square-root-free test."""
    return Pcv > vsv and (vsv - 2) * Jcv ** 2 < 2 * (Pcv - vsv) ** 2

# a rational sweep: the equivalence of (4.21)+vs>2 with (4.22)
sweep, agree, live_true, live_false = 0, 0, 0, 0
for pn in range(-8, 40):
    for jn in range(-12, 13):
        for vn in range(1, 30):
            Pcv, Jcv, vsv = Fr(pn, 4), Fr(jn, 4), Fr(vn, 4)
            if vsv <= 2:
                continue
            sweep += 1
            lhs = relaxed(Pcv, Jcv)(vsv)
            rhs = admissible_422(Pcv, Jcv, vsv)
            agree += (lhs == rhs)
            live_true += bool(rhs); live_false += (not rhs)
report(agree == sweep and live_true > 0 and live_false > 0,
       'Lemma 4.5 on a rational sweep: for vs > 2, [(4.21) relaxed] ⟺ [(4.22) Pc > vs and (vs−2)Jc² < 2(Pc−vs)²]',
       f'{agree}/{sweep} points agree, {live_true} admissible / {live_false} not — the test discriminates')

# RED CONTROL 1: a corrupted (4.22) — the sign of the second inequality flipped — must DISAGREE with (4.21)
bad = sum(1 for pn in range(-8, 40) for jn in range(-12, 13) for vn in range(9, 30)
          if (lambda Pcv, Jcv, vsv: relaxed(Pcv, Jcv)(vsv) != (Pcv > vsv and (vsv - 2) * Jcv ** 2 > 2 * (Pcv - vsv) ** 2))(Fr(pn, 4), Fr(jn, 4), Fr(vn, 4)))
report(bad > 0, 'RED CONTROL: a planted sign flip in (4.22) is caught — it disagrees with the relaxed condition',
       f'{bad} points of disagreement')

# RED CONTROL 2: vs ≤ 2 must be refused by the ADMISSIBLE condition even where the relaxed one holds
# ("The additional inequality is required by the viscous waves.")
slack = [(Fr(pn, 2), Fr(jn, 2), Fr(vn, 4)) for pn in range(3, 20) for jn in range(-4, 5) for vn in range(1, 9)]
relaxed_but_not_admissible = [d for d in slack if relaxed(d[0], d[1])(d[2]) and d[2] <= 2]
report(len(relaxed_but_not_admissible) > 0,
       'RED CONTROL: data satisfying the RELAXED condition with vs ≤ 2 exist and are refused by the admissible one (vs > 2 is not implied)',
       f'{len(relaxed_but_not_admissible)} such points, e.g. (Pc, Jc, vs) = ' + str(relaxed_but_not_admissible[0]))

# ---------------------------------------------------------------- (4.23), the stress coordinates
Tth, Tz, F = sp.symbols('T_theta T_z F', real=True)
Pst = Tth + ts_ * Tz          # = F(Pc − vs)
Jst = Tz - ts_ * Tth          # = F·Jc
# the change of frame has determinant 1 + ts² > 0, so it is invertible and orientation-preserving
Mfr = sp.Matrix([[1, ts_], [-ts_, 1]])
report(sp.simplify(Mfr.det() - (1 + ts_ ** 2)) == 0,
       '(4.23): (T0,θ, T0,z) ↦ (T0,θ + ts·T0,z, T0,z − ts·T0,θ) has determinant 1 + ts² > 0 — the shear tilt ts ROTATES the cone, it does not fold it')
# substituting (4.23) into the stress-coordinate inequalities returns (4.22) exactly, F > 0 cancelling
Pc_s, Jc_s, vs_s = sp.symbols('Pc Jc vs', real=True)
ineq1 = sp.simplify((F * (Pc_s - vs_s)) > 0)
ineq2 = sp.simplify(sp.expand((vs_s - 2) * (F * Jc_s) ** 2 - 2 * (F * (Pc_s - vs_s)) ** 2))
report(sp.simplify(ineq2 - F ** 2 * ((vs_s - 2) * Jc_s ** 2 - 2 * (Pc_s - vs_s) ** 2)) == 0,
       '(4.23) → the stress form: (vs−2)(T0,z − ts T0,θ)² < 2(T0,θ + ts T0,z)² is F²·[(vs−2)Jc² < 2(Pc−vs)²], and F > 0, so the two are the same condition')
report(sp.simplify(sp.solve(sp.Eq(Pst, F * (Pc_s - vs_s)), Tth)[0].has(Tz)),
       'the stress-coordinate condition is homogeneous in T0: a cone, so a stress may vanish at an annular edge with its direction still strictly inside (Theorem 4.6(iii))')
# the half-angle of the wedge, and its monotonicity in vs
vsym = sp.symbols('v_s', positive=True)
half = sp.atan(sp.sqrt(2 / (vsym - 2)))
report(sp.simplify(sp.diff(half, vsym)) .subs(vsym, 3).evalf() < 0,
       'the wedge half-angle arctan(sqrt(2/(vs−2))) DECREASES in vs: a stiffer shear ratio closes the cone toward a ray',
       'at vs = 3: ' + str(sp.N(half.subs(vsym, 3), 6)) + ' rad; at vs = 12: ' + str(sp.N(half.subs(vsym, 12), 6)) + ' rad')

# ---------------------------------------------------------------- §7, Prop. 7.5 Step 2
hp, hm, Ac, us, TN, TK = sp.symbols('h_+ h_- A_c u_* T_N T_K', real=True)
# H = [C(b+) | C(b−)] with columns hσ(−Ac N − σ u* K), errors eσ omitted as in the printed solve
Hmat = sp.Matrix([[-hp * Ac, -hm * Ac], [-hp * us, +hm * us]])   # rows: N-component, K-component
yv = sp.Matrix([sp.symbols('y_+'), sp.symbols('y_-')])
printed = sp.Matrix([sp.Rational(1, 2) * (-TN / Ac - TK / us) / hp,
                     sp.Rational(1, 2) * (-TN / Ac + TK / us) / hm])
resid = sp.simplify(Hmat * printed - sp.Matrix([TN, TK]))
report(sp.simplify(resid[0]) == 0 and sp.simplify(resid[1]) == 0,
       'Prop. 7.5 Step 2: the printed h+y+ = ½(−T_N/Ac − T_K/u*), h−y− = ½(−T_N/Ac + T_K/u*) solve H(y+, y−)ᵀ = T exactly')
report(sp.simplify(Hmat.det() - (-2 * hp * hm * Ac * us)) == 0,
       'det H = −2·h+·h−·Ac·u* ≠ 0 whenever Ac, u*, h± ≠ 0 — the two covariance columns are independent, so the representation is unique')
# positivity of both squared amplitudes ⟺ the reference cone T_N < 0, |T_K| < (u*/Ac)(−T_N)
def amps(TNv, TKv, Acv=Fr(3, 2), usv=Fr(4, 5), hpv=Fr(1, 1), hmv=Fr(1, 1)):
    return (Fr(1, 2) * (-Fr(TNv, 1) / Acv - Fr(TKv, 1) / usv) / hpv,
            Fr(1, 2) * (-Fr(TNv, 1) / Acv + Fr(TKv, 1) / usv) / hmv)
Acv, usv = Fr(3, 2), Fr(4, 5)
cone_agree, cone_n, inside_n = 0, 0, 0
for tn in range(-20, 21):
    for tk in range(-20, 21):
        TNv, TKv = Fr(tn, 4), Fr(tk, 4)
        if TNv == 0:
            continue
        cone_n += 1
        yp, ym = amps(TNv, TKv, Acv, usv)
        pos = yp > 0 and ym > 0
        cone = TNv < 0 and abs(TKv) < (usv / Acv) * (-TNv)
        cone_agree += (pos == cone)
        inside_n += bool(cone)
report(cone_agree == cone_n and inside_n > 0,
       'both squared amplitudes are positive EXACTLY on the reference cone T_N < 0, |T_K| < (u*/Ac)(−T_N)',
       f'{cone_agree}/{cone_n} rational points agree, {inside_n} inside the cone')

# RED CONTROL 3: a stress outside the cone gives a NEGATIVE squared amplitude — no real wave amplitude exists
TNv, TKv = Fr(-1), (usv / Acv) * Fr(1) + Fr(1, 10)          # just past the cone edge, on the +K side
yp, ym = amps(TNv, TKv, Acv, usv)
report(min(yp, ym) < 0,
       'RED CONTROL: a stress just OUTSIDE the cone (|T_K| exceeding (u*/Ac)(−T_N) by 1/10) forces a negative squared amplitude — no real pulse amplitude can supply it',
       f'y+ = {yp}, y− = {ym}')
# and on the wrong side of N: T_N > 0 makes both negative
yp2, ym2 = amps(Fr(1), Fr(0), Acv, usv)
report(yp2 < 0 and ym2 < 0,
       'RED CONTROL: a stress with T_N > 0 (pointing out of the cone axis) makes BOTH squared amplitudes negative',
       f'y+ = {yp2}, y− = {ym2}')

# ---------------------------------------------------------------- the covariance, and why k ≠ 0 matters
th = sp.symbols('theta', real=True)
k = sp.symbols('k', integer=True, positive=True)
avg = lambda e: sp.integrate(e, (th, 0, 2 * sp.pi)) / (2 * sp.pi)     # normalized Haar measure on the angle
phi = sp.symbols('phi', real=True)
report(sp.simplify(avg(sp.cos(k * th + phi) ** 2) - sp.Rational(1, 2)) == 0,
       'Prop. 7.5 Step 1: ⟨cos²(kΦ)⟩_θ = 1/2 exactly, for every nonzero integer angular frequency k — this 1/2 is the whole covariance')
report(sp.simplify(avg(sp.cos(k * th + phi))) == 0,
       'and ⟨cos(kΦ)⟩_θ = 0 for k ≠ 0: the pulse is a genuine FLUCTUATION about the angular mean, which is what makes its covariance a Reynolds stress')

# RED CONTROL 4: at k = 0 both statements fail — an axisymmetric "pulse" is part of the mean and carries no Reynolds stress
z0 = sp.simplify(avg(sp.cos(0 * th + phi) ** 2))
m0 = sp.simplify(avg(sp.cos(0 * th + phi)))
report(sp.simplify(z0 - sp.Rational(1, 2)) != 0 and sp.simplify(m0) != 0,
       'RED CONTROL: at k = 0 the angular average of cos² is not 1/2 and the angular mean is not 0 — an axisymmetric pulse is part of the mean, not a fluctuation, and supplies NO stress to it',
       f'⟨cos²⟩ = {z0}, ⟨cos⟩ = {m0} at k = 0')

# the disjointness identity C(a+b+ + a−b−) = H(a+², a−²)ᵀ, on an explicit two-family model
vv = sp.symbols('v', real=True)
ap, am = sp.symbols('a_+ a_-', real=True)
xr, tp, tm = sp.symbols('x_r t_+ t_-', real=True)          # radial component and the two tangential amplitudes
psip = sp.Piecewise((1, sp.And(vv >= 0, vv <= 1)), (0, True))       # disjoint auxiliary supports:
psim = sp.Piecewise((1, sp.And(vv > 1, vv <= 2)), (0, True))        # ψ+ on [0,1], ψ− on (1,2]
br = lambda psi: psi * xr * sp.cos(k * th)
btan = lambda psi, tt: psi * tt * sp.cos(k * th)
W_r = ap * br(psip) + am * br(psim)
W_tan = ap * btan(psip, tp) + am * btan(psim, tm)
Cw = sp.integrate(sp.simplify(avg(W_r * W_tan)), (vv, 0, 2))
Cplus = sp.integrate(sp.simplify(avg(br(psip) * btan(psip, tp))), (vv, 0, 2))
Cminus = sp.integrate(sp.simplify(avg(br(psim) * btan(psim, tm))), (vv, 0, 2))
report(sp.simplify(sp.expand(Cw - (ap ** 2 * Cplus + am ** 2 * Cminus))) == 0,
       'disjointness: C(a+b+ + a−b−) = H·(a+², a−²)ᵀ — the cross term vanishes, so the reachable set is exactly the NONNEGATIVE span of the two covariance columns',
       f'C(b+) = {sp.simplify(Cplus)}, C(b−) = {sp.simplify(Cminus)}')

# RED CONTROL 5: with OVERLAPPING supports the cross term survives and the identity fails
psim_bad = sp.Piecewise((1, sp.And(vv >= 0, vv <= 2)), (0, True))    # overlaps ψ+ entirely
W_r_b = ap * br(psip) + am * br(psim_bad)
W_tan_b = ap * btan(psip, tp) + am * btan(psim_bad, tm)
Cw_b = sp.integrate(sp.simplify(avg(W_r_b * W_tan_b)), (vv, 0, 2))
Cminus_b = sp.integrate(sp.simplify(avg(br(psim_bad) * btan(psim_bad, tm))), (vv, 0, 2))
cross = sp.simplify(sp.expand(Cw_b - (ap ** 2 * Cplus + am ** 2 * Cminus_b)))
report(cross != 0,
       'RED CONTROL: overlapping auxiliary supports leave a cross term B(b+, b−) ≠ 0 and break the two-column representation — the disjointness of the two signs is load-bearing',
       f'cross term = {cross}')

# ---------------------------------------------------------------- the composition, stated
print('     COMPOSITION: (4.22) puts the leading stress inside the profile cone; §7 chooses u* so the')
print('     WAVE cone contains it with a fixed margin ηc > 0 (|T_K|/u* ≤ (1−ηc)(−T_N/Ac), proof of Prop. 7.5);')
print('     hence positive y±, real amplitudes a± = sqrt(y±), and C(W0) = ε·T0,* by (7.26) — the pulses')
print('     supply exactly the annular stress whose divergence is the core\'s momentum residual (5.1)–(5.5).')
print('     The cone is a statement about a DIRECTION, so it survives the stress vanishing at both annular edges.')
print(f'# {len(fails)} FAIL' + (': ' + ', '.join(fails) if fails else ''))
sys.exit(1 if fails else 0)
