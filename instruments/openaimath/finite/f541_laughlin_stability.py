"""F-541 — "Uniform Stability of the Spherical Laughlin Gap" (openai/math family 269).

THE CLAIM (build/sections/01-introduction.tex:52-62, Theorem thm:main): "There are constants lambda_* > 0,
Delta_* > 0, and N_* < infinity such that, for every N >= N_*, every real bounded measurable phi on S_{3(N-1)} with
||phi||_inf <= 1, and every real |lambda| <= lambda_*, E_1(N,lambda,phi) - E_0(N,lambda,phi) >= Delta_*."
"We give existential constants" (:71). The proof rests on (i) the unperturbed Fock-space gap of the companion paper
[Gap] = F-542, restated as Theorem thm:unperturbed with gamma_* = 4616733319001/10^14 and the 1/25 gap
(02-preliminaries.tex:166-176), and (ii) Proposition prop:retained-blocks (appendices/retained-blocks.tex:41-50):
H_q^2 >= c_0 H_q + L_4(W_4 R^hi W_4^dagger) for every 0 < c_0 < 1/25, whose finite input is the SAME seven-row
certificate, restated in full in Appendix A (retained-blocks.tex:597-749): eq:3certificate (rb:eq:3certificate,
:229-233), eq:4certificate (rb:eq:4certificate, :296-300), and the final margin rb:eq:finalmargin (:583-587)
1 - 93527408868499/10^14 - 61/4096 - 1222 * 3/10^6 = 4616733319001/10^14 > 1/25.

WHAT IS DECIDED HERE: this paper's own copy of the certificate, read from its own verification/rows.txt (confirmed
byte-identical, by sha256 through Sources, to F-542's rows.txt) and checked against this paper's own printed tables
(floor table :650-660, sign table :724-739, P^2 eta :622, eta :211, 61/4096 :538, 1222 :513-516, the final margin
:583-587, gamma_* in thm:unperturbed). The arithmetic is the clean-room engine written for F-542
(f542_laughlin_gap.py — this audit's code, not the release's): e_z and the four-body matrices E_D, G_D derived in an
exact multiquadratic field from the definitions (eq:coupling, eq:alphadata, eq:ez, eq:S, eq:E, eq:pairstar,
eq:wstar) AND from the paper's rational formulas (rb:eq:erational, rb:eq:Yrational, rb:eq:Lrational,
rb:eq:Zrational), required equal; 13 margins > 0; M = ZBZ >= 0 for D = 1..23 by exact LDL^T over Fraction (zero
pivots require a zero row), with det(xI+M) by exact interpolation as a second method and its sign string compared
with the printed table; then 61/4096, 1222 and the final margin > 1/25.

WHAT IS NOT DECIDED HERE: the stability theorem itself, which has no finite witness — its constants lambda_*,
Delta_*, N_* are existential. Not decided: the zero-mode local estimate (Theorem thm:charge-local-linear), flux
pinning, flags and quasihole branching (Sections 3-6), the local energy descent and loss evolution (Section 7),
the relative bound and quasiadiabatic continuation (Section 8), the analytic part of prop:retained-blocks (normal
ordering, coupling limits, Schur averaging, compression lemma, uniform transfer, the Bessel 1222-eps bound, the
three-body tail), and the unperturbed gap theorem, which is cited from F-542 and is likewise decided there only in
its finite component. A CERTIFIED here says: the finite certificate this paper prints is exactly right.
"""
import os
import re
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
import f542_laughlin_gap as G  # noqa: E402  (this audit's own engine; nothing from the release is imported)

DIR = 'preprints/Uniform-Stability-of-the-Spherical-Laughlin-Gap-October-5-2026'
ROWS = DIR + '/verification/rows.txt'
ROWS_542 = G.ROWS
APPX = DIR + '/build/appendices/retained-blocks.tex'
INTRO = DIR + '/build/sections/01-introduction.tex'
PRELIM = DIR + '/build/sections/02-preliminaries.tex'
ENERGY = DIR + '/build/sections/07-energy.tex'
EPS = G.EPS

DECIDES = ('a finite component: this paper\'s restated seven-row certificate (Appendix A) — 13 three-body margins > 0 '
           'with the printed floors, M >= 0 exactly for D = 1..23 with the printed sign table, P^2 eta, 61/4096, 1222 '
           'and the final margin 4616733319001/10^14 > 1/25 used for 0 < c_0 < 1/25. NOT the stability theorem: '
           'its constants lambda_*, Delta_*, N_* are existential and every analytic step is outside this check.')


def printed(src):
    ap = src.text(APPX)
    out = {}
    m = re.search(r'^floor&([0-9&]+)\\\\', ap, re.M)
    zs = re.search(r'^\$z\$&([0-9&]+)\\\\', ap, re.M)
    if not (m and zs):
        raise G.Refuse('floor table not found in the appendix')
    out['floors'] = dict(zip([int(x) for x in zs.group(1).split('&')], [int(x) for x in m.group(1).split('&')]))
    out['signs'] = {int(d): s for d, s in re.findall(r'(\d+)&\\texttt\{([+0\-]+)\}', ap)}
    m = re.search(r'P\^2\\eta=\\sum_\\rho\\ell_\\rho\^2=(\d+)', ap)
    out['P2eta'] = int(m.group(1)) if m else None
    m = re.search(r'\\eta&=\\sum_\\rho\\lambda_\\rho\^2=\\frac\{(\d+)\}\{10\^\{14\}\}', ap)
    out['eta'] = Fraction(int(m.group(1)), 10 ** 14) if m else None
    out['eps'] = EPS if (re.search(r'\\varepsilon=3/10\^6', ap) and re.search(r'\\varepsilon=3\\cdot10\^\{-6\}', ap)) else None
    m = re.search(r'\\delta_q\\longrightarrow\\frac\{(\d+)\}\{(\d+)\}', ap)
    out['delta'] = Fraction(int(m.group(1)), int(m.group(2))) if m else None
    out['1222'] = 1222 if re.search(r'=1222\\varepsilon H', ap) else None
    out['1222_split'] = bool(re.search(r'\\sum_\{m=1\}\^\{12\}m\^2\+\s*\\sum_\{m=1\}\^\{11\}m\(m\+1\)', ap))
    m = re.search(r'1-\\frac\{(\d+)\}\{10\^\{14\}\}-\\frac\{61\}\{4096\}\s*-1222\\frac3\{10\^6\}\s*=\\frac\{(\d+)\}\{10\^\{14\}\}>\\frac1\{25\}', ap)
    out['final'] = (int(m.group(1)), int(m.group(2))) if m else None
    pre = src.text(PRELIM)
    m = re.search(r'Let \$\\gamma_\*=(\d+)/10\^\{14\}\$', pre)
    out['gamma'] = Fraction(int(m.group(1)), 10 ** 14) if m else None
    out['poly'] = None            # this paper does not print the expansion or the three series sums
    out['sums'] = None
    return out


def decide(src=None, rows_text=None, floors=None, sign_table=None, eps=EPS):
    src = src or Sources()
    checks = []
    timing = {}
    t0 = time.time()
    try:
        text = src.text(ROWS)
        other = src.text(ROWS_542)
        check(checks, 'verification/rows.txt is byte-identical to F-542\'s (sha256)', src.read[ROWS] == src.read[ROWS_542],
              src.read[ROWS][:16] + ' vs ' + src.read[ROWS_542][:16])
        pr = printed(src)
        ap = src.text(APPX)
        intro = src.text(INTRO)
        pre = src.text(PRELIM)
        en = src.text(ENERGY)
        check(checks, 'the paper states the stability theorem, takes the unperturbed gap as input, and restates both certificates on the same rows',
              'E_1(N,\\lambda,\\varphi)-E_0(N,\\lambda,\\varphi)\\ge\\Delta_*' in intro and 'H_{N,q}\\ge\\frac1{25}(I-P_{N,q})' in pre and
              'e_z<\\frac32(3z-1)(-1/2)^z' in ap and 'G_D(2\\chi-E_D+\\varepsilon I)G_D\\ge0' in ap and
              'z\\in\\{2,4,5,\\ldots,15\\}' in ap and '{../verification/rows.txt}' in ap and '(0<c_0<1/25)' in en,
              'thm:main, thm:unperturbed, rb:eq:3certificate, rb:eq:4certificate, lstinputlisting, eq:retained-energy')
        check(checks, 'eps = 3/10^6 in rb:eq:4certificate and in the arithmetic', pr.get('eps') == EPS)
        if rows_text is not None:
            text = rows_text
        if floors is not None:
            pr['floors'] = floors
        if sign_table is not None:
            pr['signs'] = sign_table
        checks, value, eta2 = G.certify_rows(text, pr, eps=eps, checks=checks, timing=timing)
        check(checks, 'eta printed in rb:eq:Adecomp equals sum l^2 / 10^14', pr.get('eta') == Fraction(eta2, 10 ** 14), str(pr.get('eta')))
        delta, s1222 = G.series_checks(checks, pr)
        g = 1 - Fraction(eta2, 10 ** 14) - delta - s1222 * EPS
        fin = pr.get('final')
        check(checks, '1 - eta - 61/4096 - 1222 eps = the printed 4616733319001/10^14 (rb:eq:finalmargin) = gamma_* of thm:unperturbed',
              fin is not None and fin[0] == eta2 and g == Fraction(fin[1], 10 ** 14) and g == pr.get('gamma'), str(g))
        check(checks, 'the final margin exceeds 1/25 (so every 0 < c_0 < 1/25 is admissible)', g > Fraction(1, 25), 'margin - 1/25 = %s' % (g - Fraction(1, 25)))
        value['final_margin'] = str(g)
    except G.Refuse as e:
        return {'verdict': 'REFUSED', 'checks': checks + [{'check': 'refusal', 'pass': False, 'detail': str(e)}], 'sources': src.read,
                'decides': DECIDES, 'value': {'reason': str(e)}}
    value['runtime_s'] = round(time.time() - t0, 2)
    value.update(timing)
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read, 'decides': DECIDES, 'value': value}


def forge():
    """each must NOT certify; the failing checks are named"""
    text = Sources().text(ROWS)
    out = []
    for desc, bad in G.forge_rows(text):
        r = decide(rows_text=bad)
        out.append((desc + ' -> fails: ' + G._failing(r), r['verdict']))
    pr = printed(Sources())
    fl = dict(pr['floors'])
    fl[5] -= 1
    r = decide(floors=fl)
    out.append(('printed floor at z = 5: 249 -> 248 -> fails: ' + G._failing(r), r['verdict']))
    sg = dict(pr['signs'])
    sg[23] = '++++++++++00'
    r = decide(sign_table=sg)
    out.append(('printed signs at D = 23: +++++++++000 -> ++++++++++00 -> fails: ' + G._failing(r), r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides')}, indent=1))
    print(json.dumps({k: v for k, v in res['value'].items() if k not in ('margins',)}, default=str))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t))
    t = time.time()
    for d, v in forge():
        print('FORGE', v, '-', d)
    print('forges %.1fs' % (time.time() - t))
