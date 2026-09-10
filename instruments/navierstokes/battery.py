#!/usr/bin/env python3
"""instruments/navierstokes/battery.py — the computable checks of the OpenAI
Navier–Stokes writeup, re-run from the formulas as printed, with the result
written to corpus/navier-stokes/probes.json.

These decide identities the PAPER states (a coordinate change, a rescaling, a
kernel integral, the exact heat exterior).  They are probes of the writeup, not
of the theorem: the theorem's authority is the Lean certificate, and an identity
that failed here would be a REFUTED of the printed formula, never of the result.
Every check is symbolic (sympy) or high-precision numeric (mpmath, 25 digits,
residuals reported); none is interval-certified, and the record says so.
"""
import json, os, re, subprocess, sys, time, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'corpus', 'navier-stokes', 'probes.json')

SCRIPTS = [
    ('symbolic_checks.py', 'C2–C6, C11: similarity-coordinate derivatives (Lemma 4.1), the commutator kernel norm (Lemma 10.5), the derivative count (10.12), the viscosity rescaling (10.22)–(10.23), the periodic λ-rescaling (Cor. 10.6), the exterior q-cancellation (3.1), and a numeric spot check of the cutoff bound (10.3)'),
    ('heat_exterior_ode.py', 'C1a: K = (r²/2)^{-A} H(4τ/r²) solves the radial swirl heat equation iff Z²H″ + (1+2(1+h)Z)H′ + h(1+h)H = 0, i.e. (A.37)'),
    ('coefficient_equations.py', 'C1 of the §5 memo: the expansion (5.1) substituted into the axisymmetric Navier–Stokes operator in (q, X, η) with the derivatives of Lemma 4.1, expanded by exact q-exponent, and compared term by term with the printed order-n coefficient equations (5.2)–(5.6), the sparsity of A₁ in (5.7) (no ∂²_η, no mixed derivatives, A₁D₀A₁ = 0 — the block nilpotency behind (5.8)), and the divisibility of Ω_k by X'),
    ('axis_profile.py', 'C14 of the §4 memo: the axis initial-value problem (4.13)+(4.7) of Appendix B integrated numerically in Y = ΛX at representative data the paper never fixes (h = 0.01, j0 = 0.05, P* = 2, δ* = 0.1, σ* from (B.2)); Φ, u and the shear scale as 1/Λ toward the closed form f0(Yχ) as Proposition B.2 claims, Φ > 0, (B.17) holds from Λ = 10⁶ on, the exit inequality holds — a consistency check of the transcription at these data, decided in floating point, never a certification'),
    ('swirl_maximum_principle.py', 'The obstruction the paper never names: for an axisymmetric flow the swirl Γ = r·uθ obeys a drift–diffusion equation with no zeroth-order term (derived here symbolically from the θ-momentum equation), so a bounded compactly supported force from rest gives a bounded swirl and |uθ| ≤ C/r — while the paper\'s leading field has Γ = √(2X) q^{−h} E → ∞ (its own r·uθ = q^{−h}H, p. 27). The axisymmetric background alone is impossible; the theorem lives on the pulses\' nonzero angular frequencies (p. 12). Also: the blowup is type II (outside the axisymmetric type-I exclusions of KNSS/CSYT), and every classical necessary condition for a singularity — Serrin, ESS, BKM, Leray\'s two lower bounds, finite energy and dissipation — is met by the stated exponents'),
    ('heat_exterior_num.py', 'C1b: the integral H(Z) = Γ(1+h)⁻¹∫₀^∞ e^{-v} v^h (1+Zv)^{-h} dv of (A.32) satisfies (A.37) and H^{(m)}(0) = (−1)^m (h)_m (1+h)_m of (A.35)'),
    ('stress_cone.py', 'The mechanism by which the pulses cancel the core\'s momentum residual, re-derived from the printed formulas: the roots behind Lemma 4.5 and the equivalence of the relaxed cone condition (4.21)+vs>2 with the square-root-free (4.22) on a rational sweep; the stress-coordinate form (4.23), whose frame change has determinant 1+ts² so the shear tilt rotates the wedge and its half-angle is arctan(sqrt(2/(vs−2))); Proposition 7.5 Step 2 — the printed h±y± = ½(−T_N/Ac ∓ T_K/u*) solve H(y+,y−)ᵀ = T, det H = −2h+h−Ac·u*, and both squared amplitudes are positive EXACTLY on the reference cone T_N < 0, |T_K| < (u*/Ac)(−T_N), so outside it no real wave amplitude exists; ⟨cos²(kΦ)⟩_θ = 1/2 and ⟨cos(kΦ)⟩_θ = 0 for nonzero integer k, both false at k = 0 — an axisymmetric pulse is part of the mean and supplies no stress to it; and the disjointness identity C(a+b+ + a−b−) = H(a+²,a−²)ᵀ, which overlapping supports break'),
]

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def run(script):
    t0 = time.time()
    r = subprocess.run([sys.executable, os.path.join(HERE, 'probes', script)], capture_output=True, text=True, timeout=1800)
    return r.returncode, r.stdout + r.stderr, time.time() - t0

def reds_ok(lines):
    """Every probe must carry red controls that fire: a check that cannot fail is not a check."""
    fired = [l for l in lines if l.startswith('RED FIRED') or l.startswith('PASS RED CONTROL')]
    dead = [l for l in lines if l.startswith('RED DID NOT FIRE') or l.startswith('FAIL RED CONTROL')]
    return bool(fired) and not dead, len(fired), len(dead)

def judge(script, out):
    """Return (verdict, lines) from a script's stdout."""
    lines = [l for l in out.splitlines() if l.strip()]
    rok, nfired, ndead = reds_ok(lines)
    if script == 'symbolic_checks.py':
        fails = [l for l in lines if l.split()[1:2] == ['FAIL']]
        passes = [l for l in lines if l.split()[1:2] == ['PASS']]
        m = re.search(r'C2 worst q/\(C0\(tau\+\|z\|\^\{1/D\}\)\) on grid = ([0-9.]+)', out)
        c2ok = m is not None and float(m.group(1)) <= 1.0
        return ('PASS' if not fails and passes and c2ok and rok else 'FAIL'), lines
    if script == 'heat_exterior_ode.py':
        return ('PASS' if 'matches (A.37): True' in out and rok else 'FAIL'), [l for l in lines if l.startswith(('(1)', 'RED'))]
    if script == 'swirl_maximum_principle.py':
        n_fail = len([l for l in lines if l.startswith('FAIL ')]); n_pass = len([l for l in lines if l.startswith('PASS ')])
        ok = n_fail == 0 and n_pass > 0 and '# 0 FAIL' in out and rok
        return ('PASS' if ok else 'FAIL'), [l for l in lines if l.startswith(('PASS ', 'FAIL ', '# '))]
    if script == 'axis_profile.py':
        n_pass = len([l for l in lines if l.startswith('PASS ')]); n_fail = len([l for l in lines if l.startswith('FAIL ')])
        m = re.search(r'# total [0-9.]+s; (\d+) FAIL', out)
        ok = n_fail == 0 and n_pass > 0 and m is not None and m.group(1) == '0' and rok
        return ('PASS' if ok else 'FAIL'), [l for l in lines if l.startswith(('PASS ', 'FAIL ', 'RED', '# total'))]
    if script == 'coefficient_equations.py':
        n_pass = len([l for l in lines if l.startswith('PASS ')]); n_fail = len([l for l in lines if l.startswith('FAIL ')])
        m = re.search(r'(\d+)/(\d+) passed', out)
        ok = n_fail == 0 and n_pass > 0 and m is not None and m.group(1) == m.group(2) and rok
        return ('PASS' if ok else 'FAIL'), [l for l in lines if l.startswith(('FAIL ', 'RED')) or 'passed' in l or l.startswith('PASS ')]
    if script == 'stress_cone.py':
        n_fail = len([l for l in lines if l.startswith('FAIL ')]); n_pass = len([l for l in lines if l.startswith('PASS ')])
        ok = n_fail == 0 and n_pass > 0 and '# 0 FAIL' in out and rok
        return ('PASS' if ok else 'FAIL'), [l for l in lines if l.startswith(('PASS ', 'FAIL ', '# '))]
    if script == 'heat_exterior_num.py':
        m = re.search(r'worst relative residual: ([0-9.e+-]+)', out)
        ok = m is not None and float(m.group(1)) < 1e-15
        diffs = re.findall(r'diff (-?[0-9.e+-]+)', out)
        ok = ok and all(abs(float(d)) < 1e-20 for d in diffs) and rok
        return ('PASS' if ok else 'FAIL'), lines
    return 'FAIL', lines

def main():
    checks, allok = [], True
    for script, what in SCRIPTS:
        code, out, dt = run(script)
        verdict, lines = judge(script, out)
        if code != 0:
            verdict = 'FAIL'
        allok = allok and verdict == 'PASS'
        checks.append({'script': 'instruments/navierstokes/probes/' + script, 'sha256': sha(os.path.join(HERE, 'probes', script)),
                       'what': what, 'verdict': verdict, 'seconds': round(dt, 1),
                       'redsFired': len([l for l in out.splitlines() if l.startswith('RED FIRED') or l.startswith('PASS RED CONTROL')]),
                       'redsDead': len([l for l in out.splitlines() if l.startswith('RED DID NOT FIRE') or l.startswith('FAIL RED CONTROL')]), 'output': lines})
        print(f'{verdict}  {script}  ({dt:.0f}s)')
    rec = {
        'what': 'Computable checks of the printed formulas in OpenAI, "Finite time blowup for Navier–Stokes" (2026-09-08), re-run by this battery; a probe of the writeup, not a certification of the theorem (the Lean certificate is the claim).',
        'paper_sha256': '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
        'discipline': 'every probe carries red controls — a deliberately wrong variant of the same test that must be rejected; a script whose reds do not all fire is FAIL, whatever its checks say.',
        'method': 'sympy symbolic identities; mpmath quadrature at 25 digits for the heat exterior (residuals reported, not interval-certified); the cutoff bound (10.3) is also proved exactly by the two-case argument: 1−η² ≥ 1/2 gives q ≤ 2τ, otherwise |η| > 2^{-1/2} gives q ≤ (√2|z|)^{1/D}, so q ≤ 2^{1/(2D)}(τ + |z|^{1/D}) since 1/(2D) > 1.',
        'note': 'A first run on 2026-09-09 reported the integral H failing (A.37) and (A.35); that was this battery\'s own bug — the m-th Z-derivative of (1+Zv)^{-h} carries (−1)^m (h)_m, not (−h)_m. Recorded so a later reader of the scratch logs does not mistake it for a finding.',
        'ran': time.strftime('%Y-%m-%d %H:%M:%S %z'),
        'verdict': 'PASS' if allok else 'FAIL',
        'checks': checks,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # stable record: rewrite only when the content (timestamp and timings aside) changed, so 'ran' means when this content was first produced
    strip = lambda r: json.dumps({k: v for k, v in r.items() if k != 'ran'} | {'checks': [{k: v for k, v in c.items() if k != 'seconds'} for c in r['checks']]}, sort_keys=True)
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT))
            if strip(old) == strip(rec):
                rec = old
        except Exception:
            pass
    json.dump(rec, open(OUT, 'w'), indent=2, ensure_ascii=False)
    print('wrote', os.path.relpath(OUT, ROOT), rec['verdict'])
    sys.exit(0 if allok else 1)

if __name__ == '__main__':
    main()
