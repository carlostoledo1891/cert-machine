"""The simulator must not care how deep its directory is.

FOUND BY INSTALLING THE WHEEL, 2026-09-09. The testbench holds the case-file
plusarg in `reg [1023:0] f`, which is 128 characters. `sim.simulate` passed an
ABSOLUTE path; in the source lab the tree sits about seventy characters deep and
everything worked, and the moment the wheel was installed into a site-packages
directory two hundred characters deep the path was TRUNCATED, `$readmemh` read
nothing, the memory stayed X, and every verdict came back "xxx" — with no error
raised anywhere. A whole environment scoring every submission as unparseable,
silently, because of the length of a directory name.

`simulate` now runs `vvp` with `cwd=pool_dir` and passes basenames. This test
holds it there: it drives the simulator through a symlink whose path is far past
the buffer and requires the same verdicts as the short path gives.
"""
import os
import shutil
import tempfile

import pytest

from blind_spot import pool as _pool, sim
from blind_spot.design import D, POOL_DIR, tools_missing

pytestmark = pytest.mark.skipif(bool(tools_missing()), reason=f"missing tools: {tools_missing()}")

# comfortably past the 128 characters the testbench can hold
DEEP = "d" * 60


def test_the_same_pairs_simulate_the_same_from_a_very_deep_directory():
    _pool.ensure_sim()
    m = next(e for e in _pool.load()["mutants"] if e["witness"])
    w = m["witness"]
    pairs = [(tuple(w["u"]), tuple(w["v"]))]
    short = sim.simulate([(m["id"], pairs[0][0], pairs[0][1])])

    root = tempfile.mkdtemp(prefix="blindspot-deep-")
    try:
        deep = os.path.join(root, DEEP, DEEP, DEEP)          # > 190 characters
        os.makedirs(os.path.dirname(deep), exist_ok=True)
        os.symlink(POOL_DIR, deep)
        assert len(os.path.join(deep, "cases.hex")) > 190, "the fixture is not deep enough to bite"
        deep_res = sim.simulate([(m["id"], pairs[0][0], pairs[0][1])], pool_dir=deep)
    finally:
        shutil.rmtree(root, ignore_errors=True)

    assert deep_res == short, f"the same pair gave {deep_res} deep and {short} shallow"
    assert deep_res[0][0] != deep_res[0][1], "the witness must still kill; 'xxx' is the bug this guards"
    assert "pins=" not in deep_res[0][0], "an X verdict is the truncated-path failure"


def test_a_kill_from_a_deep_directory_is_still_a_kill():
    """The same fact one layer up, through `kills`, which is what grading calls."""
    _pool.ensure_sim()
    m = next(e for e in _pool.load()["mutants"] if e["witness"])
    w = m["witness"]
    root = tempfile.mkdtemp(prefix="blindspot-deep-")
    try:
        deep = os.path.join(root, DEEP, DEEP, DEEP)
        os.makedirs(os.path.dirname(deep), exist_ok=True)
        os.symlink(POOL_DIR, deep)
        hits = sim.kills(m["id"], [(tuple(w["u"]), tuple(w["v"]))], pool_dir=deep)
    finally:
        shutil.rmtree(root, ignore_errors=True)
    assert len(hits) == 1, "the SAT witness stopped killing when the path got long"
