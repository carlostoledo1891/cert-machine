"""test_kit.py: the kit's figures against cert-machine's own rules, with red controls.

  (a) the README's three examples render to SVG, in colour and in greyscale;
  (b) every SVG passes design/print/check-svg.js: only the five dash patterns design/grammar.js permits (read with
      tools/check-grammar.js's own census, never retyped) and only the print register's colours (their greys on the
      greyscale sheet);
  (c) red controls: a planted forbidden dash, a dash scaled by line width, an off-register colour, a translucent
      register colour and a colour on the greyscale sheet are each REFUSED by that checker; the helpers refuse a stroke
      for REFUSED, a witness or a void without words, a caller's own linestyle, and a fourth series.
Also: register.json and the style files are current against their sources (design/print/kit.js --check), and the
kit's small-width dash rule agrees with design/grammar.js at every width tried.

The checks that need cert-machine (node, design/, tools/) run inside the repository and say SKIP outside it.

usage: python tests/test_kit.py            (or: python -m pytest tests/)        MIT licensed. Part of cert-machine.
"""
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(KIT))
sys.path.insert(0, KIT)

import matplotlib  # noqa: E402
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402

import warrant_mpl as wm  # noqa: E402

NODE = shutil.which('node')
CHECKER = os.path.join(REPO, 'design', 'print', 'check-svg.js')
IN_REPO = bool(NODE) and os.path.exists(CHECKER)
EXAMPLES = ['ex1_design_wave', 'ex2_return_curve', 'ex3_contours']
WANT_DASHES = {'ex1_design_wave': {'5 4'}, 'ex2_return_curve': {'5 4', '1 5', '2 3'}, 'ex3_contours': {'1 5'}}
_OUT = tempfile.mkdtemp(prefix='warrant-mpl-')


class Skip(Exception):
    pass


def _need_repo():
    if not IN_REPO:
        raise Skip('needs cert-machine (node and design/print/check-svg.js)')


def _check(path, mono=False):
    """run OUR checker; returns (ok, its output)"""
    r = subprocess.run([NODE, CHECKER] + (['--mono'] if mono else []) + [path], cwd=REPO, capture_output=True, text=True)
    return r.returncode == 0, (r.stdout + r.stderr).strip()


def _example(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(KIT, 'examples', name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _render(name, mode):
    fig = _example(name).build(mode)
    path = os.path.join(_OUT, '%s%s.svg' % (name, '-grey' if mode == 'grey' else ''))
    fig.savefig(path)
    plt.close('all')
    return path


def _planted(draw, mode='colour'):
    """a small figure in the register with one planted defect, saved to SVG"""
    wm.use(mode)
    fig, ax = plt.subplots(figsize=(2, 1.5))
    draw(ax)
    path = os.path.join(_OUT, 'planted-%d.svg' % len(os.listdir(_OUT)))
    fig.savefig(path)
    plt.close('all')
    return path


# ------------------------------------------------------------------------------------------------- the tests ----

def test_register_current():
    """register.json, both style files and the examples' data are what design/print/kit.js writes from the sources"""
    _need_repo()
    r = subprocess.run([NODE, os.path.join(REPO, 'design', 'print', 'kit.js'), '--check'], cwd=REPO, capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr


def test_dash_rule_matches_grammar():
    """the kit's dashes() picks the same pattern as design/grammar.js claim()/pick() at every width tried"""
    _need_repo()
    widths = [0.4, 0.6, 1.0, 1.25, 1.49, 1.5, 1.51, 2.0, 3.0]
    js = ("const G=require('./design/grammar.js');const w=" + json.dumps(widths)
          + ";console.log(JSON.stringify({p:G.PERMITTED,c:w.map(G.claim),k:w.map(G.pick),g:G.GUIDE}))")
    g = json.loads(subprocess.run([NODE, '-e', js], cwd=REPO, capture_output=True, text=True, check=True).stdout)
    assert wm.REGISTER['patterns']['PERMITTED'] == g['p']
    fmt = lambda t: ' '.join('%g' % v for v in t)  # noqa: E731
    for w, c, k in zip(widths, g['c'], g['k']):
        assert fmt(wm.dashes(wm.COMPUTED, w)) == c, (w, wm.dashes(wm.COMPUTED, w), c)
        assert fmt(wm.dashes(wm.CHOSEN, w)) == k, (w, wm.dashes(wm.CHOSEN, w), k)
    assert wm.dashes(wm.DECIDED, 1.5) is None
    assert fmt(wm._pattern('GUIDE')) == g['g']


def test_examples_render_and_pass():
    """(a) each example renders in colour and greyscale; (b) OUR checker passes every SVG, and the patterns it was
    meant to draw are there"""
    for name in EXAMPLES:
        for mode in ('colour', 'grey'):
            path = _render(name, mode)
            assert os.path.getsize(path) > 1000, path
            if not IN_REPO:
                continue
            ok, out = _check(path, mono=(mode == 'grey'))
            assert ok, out
            body = out.split('[dashes ', 1)[1] if '[dashes ' in out else ''
            for d in WANT_DASHES[name]:
                assert '"%s"' % d in body, '%s (%s) does not draw "%s": %s' % (name, mode, d, out)
    if not IN_REPO:
        raise Skip('rendered; the SVG checks need cert-machine')


def test_red_forbidden_dash():
    """(c) a planted dash outside design/grammar.js ("6 4", the identity dash frontier's contract records) is refused"""
    _need_repo()
    p = _planted(lambda ax: ax.plot([0, 1], [0, 1], color=wm.colour('ink'), linestyle=(0, (6, 4))))
    ok, out = _check(p)
    assert not ok and '"6 4"' in out, out


def test_red_scaled_dash():
    """(c) a dash scaled by the line width (matplotlib's default) mints a new pattern, and is refused"""
    _need_repo()

    def draw(ax):
        matplotlib.rcParams['lines.scale_dashes'] = True
        ax.plot([0, 1], [0, 1], color=wm.colour('ink'), linestyle='--', linewidth=2)
    p = _planted(draw)
    ok, out = _check(p)
    assert not ok and '"10 8"' in out, out


def test_red_off_register_colour():
    """(c) a planted colour outside the register (matplotlib's default blue) is refused"""
    _need_repo()
    p = _planted(lambda ax: ax.plot([0, 1], [0, 1], color='#1f77b4'))
    ok, out = _check(p)
    assert not ok and '#1f77b4' in out, out


def test_red_translucent():
    """(c) a register colour at 40% opacity is a colour nobody validated, and is refused"""
    _need_repo()
    p = _planted(lambda ax: ax.plot([0, 1], [0, 1], color=wm.colour('ink'), alpha=0.4))
    ok, out = _check(p)
    assert not ok and 'opacity' in out, out


def test_red_colour_on_grey_sheet():
    """(c) the colour sheet's blue on the greyscale sheet is refused"""
    _need_repo()
    p = _render('ex1_design_wave', 'colour')
    ok, out = _check(p, mono=True)
    assert not ok and '#3368c1' in out, out


def test_red_helpers_refuse():
    """(c) the helpers refuse what the grammar forbids, before anything is drawn"""
    wm.use('colour')
    fig, ax = plt.subplots()
    cases = [
        ('a stroke for REFUSED', lambda: wm.line(ax, [0, 1], [0, 1], wm.REFUSED), ValueError),
        ('a witness without words', lambda: wm.witness(ax, 0, 0, ''), ValueError),
        ('a void without words', lambda: wm.void(ax, 0, 1, 0, 1, words=' '), ValueError),
        ('a caller\'s own linestyle', lambda: wm.line(ax, [0, 1], [0, 1], wm.COMPUTED, ls='--'), TypeError),
        ('a caller\'s own colour', lambda: wm.line(ax, [0, 1], [0, 1], wm.DECIDED, color='red'), TypeError),
        ('a fourth series', lambda: wm.knot(ax, 0, 0, series=3), ValueError),
    ]
    for what, fn, exc in cases:
        try:
            fn()
        except exc:
            continue
        raise AssertionError('accepted ' + what)
    plt.close('all')


TESTS = [test_register_current, test_dash_rule_matches_grammar, test_examples_render_and_pass, test_red_forbidden_dash,
         test_red_scaled_dash, test_red_off_register_colour, test_red_translucent, test_red_colour_on_grey_sheet, test_red_helpers_refuse]


# under pytest a Skip is a skip
try:
    import pytest  # noqa: E402

    def _wrap(fn):
        def inner():
            try:
                fn()
            except Skip as e:
                pytest.skip(str(e))
        inner.__name__, inner.__doc__ = fn.__name__, fn.__doc__
        return inner
    for _t in TESTS:
        globals()[_t.__name__] = _wrap(_t)
except ImportError:
    pass


def main():
    import matplotlib as mpl
    print('warrant-mpl tests  (matplotlib %s, python %s, %s)' % (mpl.__version__, sys.version.split()[0], 'inside cert-machine' if IN_REPO else 'outside cert-machine'))
    fails = skips = 0
    for t in TESTS:
        try:
            t()
            print('PASS  %s: %s' % (t.__name__, ' '.join(t.__doc__.split())))
        except Skip as e:
            skips += 1
            print('SKIP  %s: %s' % (t.__name__, e))
        except Exception as e:  # noqa: BLE001
            fails += 1
            print('FAIL  %s: %s' % (t.__name__, str(e).splitlines()[0] if str(e) else type(e).__name__))
    print('%s   (%d tests, %d failed, %d skipped; SVGs in %s)' % ('ALL PASS' if not fails else 'FAILED', len(TESTS), fails, skips, _OUT))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
