"""The zero-dependency claim, as a test that can fail: the decider, the families, the curriculum, the gate and the
policies import only the standard library. Checked in a SUBPROCESS with every third-party import blocked."""
import os
import subprocess
import sys
import textwrap

BLOCKED = ("verifiers", "datasets", "pydantic", "numpy", "torch", "pandas", "openai", "anthropic", "requests",
           "httpx", "sympy", "mpmath", "gmpy2")
PKG = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

PROBE = textwrap.dedent("""
    import sys
    BLOCKED = %r
    class Blocker:
        def find_spec(self, name, path=None, target=None):
            if name.split('.')[0] in BLOCKED:
                raise ImportError('blocked: ' + name)
    sys.meta_path.insert(0, Blocker())
    sys.path.insert(0, %r)
    import verify_gym as g
    from verify_gym.policies import POLICIES
    assert g.preflight(2)['ok']
    rows = g.heldout('v0')
    assert len(rows) == 120
    r = g.train_row('v0', 0)
    for name, p in POLICIES.items():
        assert isinstance(p(r['prompt']), str), name
    assert g.score(r['id'], POLICIES['cf'](r['prompt']))['reward'] > 0
    print('OK')
""") % (BLOCKED, PKG)


def test_core_runs_with_every_third_party_import_blocked():
    p = subprocess.run([sys.executable, "-c", PROBE], capture_output=True, text=True)
    assert p.returncode == 0, p.stderr[-2000:]
    assert p.stdout.strip().endswith("OK")


def test_the_adapters_are_the_only_modules_that_import_verifiers():
    import pathlib
    pkg = pathlib.Path(PKG) / "verify_gym"
    importers = sorted(p.name for p in pkg.glob("*.py") if "import verifiers" in p.read_text())
    assert importers == ["adapters_v0.py", "adapters_v1.py"], importers
