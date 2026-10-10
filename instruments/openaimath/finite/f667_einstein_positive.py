"""F-667 -- "Positively curved Einstein four-manifolds" (openai/math family 348).

THE CLAIM (build/sections/01-introduction.tex:13-20, Theorem thm:classification): "Let (M,g) be a connected smooth
closed Einstein four-manifold with strictly positive sectional curvature, without an orientability assumption. There
is a constant a > 0 such that (M,ag) is isometric to the standard round S^4, to CP^2 with its Fubini--Study metric,
or to RP^4 with its standard round metric."  Its finite input is the section "Exact polynomial certificates"
(build/sections/07-certificates.tex, the same three lemmas as F-665 -- the file differs from F-665's only in prose:
"This section" for "This appendix", the checker's location, one sentence on the exchanged derivative, the zero-set
sentence), Section 4's sine minorant, upper-deficit rows and moment-obstruction table (04-volume.tex, same
certificates, reordered prose), and the conditional lower-volume rows of 08-classification.tex:197-219 (two integrals
with prefactor a0^3/27 against 698 and 40554 / 10^6, base 2(a0^2-4)/9 = 4883/3750, total > 1343/1000 > 4/3), which
F-665 does not use.  The release ships byte-identical verification/results.json and verify.py with F-665.

WHAT IS DECIDED HERE: everything f665_einstein_zero_plane.py decides (its docstring lists it: both derivations of every
certificate polynomial from Section 6 and from the certificate section's own instructions, Bernstein coefficients two
ways, the 12 triangle rows with the exact zero lists, the 28 + 7 interval boxes, the coverings, the Section 6
identities, Section 4, and the agreement of results.json), run on THIS paper's own files (its 06-coupling.tex,
07-certificates.tex, 04-volume.tex, results.json, each pinned by sha256), plus the two lower-volume integrals,
the base constant and the 1343/1000 > 4/3 comparison, and their results.json values.

RESULT: CERTIFIED (the same engine; this paper's own sections, byte-different from F-665's in prose only, give the
same polynomials and tables; the lower-volume rows give 0.000698489 > 698e-6, 0.040554741 > 40554e-6, and a total
1.3434... > 1343/1000 > 4/3).  Observations on the release's checker: as in f665_einstein_zero_plane.py (verify.py and
results.json are byte-identical between the two papers).

WHAT IS NOT DECIDED (theory): the classification itself -- the Weyl-block calculus, the weak identities, the polar and
radial volume comparisons, the Jensen/log-determinant argument and the inequality -log(sin x/x) - x^2/6 >= ... behind
the lower-volume bound (Lemma lem:lower-radial), one-block vanishing, the diameter/injectivity/topology lemma and the
Myers--Synge--Klingenberg input (Appendix B), the Taylor inequality behind S(z) <= sin(pi z), the derivation of
eq:19-eq:23 from eq:16-eq:18 beyond the identities checked, the zero-set limits, and the orientation-cover argument.
The Lean tree lean/OAI/Geometry/EinsteinFour is not read or run.
"""
import os
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
import f665_einstein_zero_plane as E  # noqa: E402

CLASS = 'build/sections/08-classification.tex'


def decide(src=None, **kw):
    src = src or Sources()
    res = E.decide(src=src, paper='667', with_lower=True, **kw)
    t = ''.join(src.text(E.DIRS['667'] + CLASS).split())
    extra = []
    check(extra, 'the paper prints the lower-volume table and base term (08-classification.tex:205-219)',
          all(k in t for k in ('&$[0,1/2]$&15&$698/10^6$', '&$[1/2,1]$&15&$40554/10^6$', '$2(a_0^2-4)/9=4883/3750$', '$1343/1000>4/3$')))
    intro = ''.join(src.text(E.DIRS['667'] + 'build/sections/01-introduction.tex').split())
    check(extra, 'the theorem as stated (01-introduction.tex:13-20)', 'tothestandardround$S^4$,to$\\mathbb{CP}^2$withitsFubini--Study' in intro)
    res['checks'] = extra + res['checks']
    if not all(c['pass'] for c in extra) and res['verdict'] == 'CERTIFIED':
        res['verdict'] = 'REFUSED'
    res['decides'] = res['decides'].replace('not the classification theorem', 'not the classification theorem of F-667')
    return res


def forge():
    out = []
    z = list(E.Z_KAPPA)
    z[0] += 1
    out.append(('kappa coefficient 4 z_1 = -43 changed to -42', decide(kappa_z=tuple(z))['verdict']))
    out.append(('lower-volume row [1/2,1] printed as 40555/10^6 (the exact value is 0.0405547...)',
                decide(printed={'lower': {'lower_2': Fraction(40555, 10 ** 6)}})['verdict']))
    out.append(('vertex E moved from (1,1/2) to (1,2/5)', decide(vertices={'E': (Fraction(1), Fraction(2, 5))})['verdict']))
    return out


if __name__ == '__main__':
    E.main(decide, forge)
