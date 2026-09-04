"""The zero-dependency claim, as a test that can fail.

The README says the graders, the band geometry and the corpus import only the
standard library. That is the kind of claim which is true on the day it is
written and quietly false three commits later.

It is checked in a SUBPROCESS. Blocking imports in this interpreter would poison
every test that runs after it — numpy, once evicted from `sys.modules`, refuses
to load a second time in the same process — and a claim about what a fresh
interpreter can do should be tested in a fresh interpreter anyway.
"""
import subprocess
import sys
import textwrap

BLOCKED = ("verifiers", "datasets", "pydantic", "numpy", "torch", "pandas",
           "openai", "anthropic", "requests", "httpx")

PROBE = textwrap.dedent(f"""
    import sys
    BLOCKED = {BLOCKED!r}

    class Blocker:
        def find_module(self, name, path=None):
            if name.split('.')[0] in BLOCKED:
                raise ImportError('blocked: ' + name)
        def find_spec(self, name, path=None, target=None):
            if name.split('.')[0] in BLOCKED:
                raise ImportError('blocked: ' + name)

    sys.meta_path.insert(0, Blocker())

    import break_the_grader as g
    assert len(g.FACTS) >= 50, 'corpus'
    assert g.gate(range(16))['ok'], 'battery'

    from break_the_grader.api import preflight, sample, score
    rows = sample(8)
    assert len(rows) == 8 and all('prompt' in r for r in rows), 'rows'
    assert score(0, '{{"verdict": "NO_ATTACK"}}')['verdict'] in ('SOLVED', 'WRONG')
    preflight(range(16))

    from break_the_grader.policies import POLICIES
    assert set(POLICIES) == {{'never', 'always', 'naive', 'careful'}}
    for name, policy in POLICIES.items():
        reply = policy(rows[0]['prompt'])
        assert isinstance(reply, str) and reply.strip(), name

    print('OK')
""")


def test_core_runs_with_every_third_party_import_blocked():
    proc = subprocess.run([sys.executable, "-c", PROBE],
                          capture_output=True, text=True)
    assert proc.returncode == 0, proc.stderr[-2000:]
    assert proc.stdout.strip().endswith("OK")


def test_the_adapters_are_the_only_modules_that_import_verifiers():
    """Import sites, read off the source. If a third file starts importing the
    framework, the claim above stops being about two files and this fails."""
    import pathlib
    pkg = pathlib.Path(__file__).resolve().parent.parent / "break_the_grader"
    importers = sorted(p.name for p in pkg.glob("*.py")
                       if "import verifiers" in p.read_text())
    assert importers == ["adapters_v0.py", "adapters_v1.py"], importers
