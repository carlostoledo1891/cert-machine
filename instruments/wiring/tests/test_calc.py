"""The calculator tool of tools="calc" (0.5.0): exact where asked, refuses everything else,
bounded so no expression can hang the env-server, and enough to DECIDE a task. Stdlib only."""
import math
from fractions import Fraction

import pytest

from lattice_claims.calc import CalcError, calc, evaluate
from lattice_claims.taskset import Taskset


def test_exact_integers_and_fractions():
    assert calc("2**100") == str(2 ** 100)
    assert calc("Fraction(1, 3) + Fraction(1, 6)") == "Fraction(1, 2)"
    assert calc("Fraction(21, 20)**2 * 400") == "Fraction(441, 1)"
    assert evaluate("factorial(20) // comb(20, 10)") == math.factorial(20) // math.comb(20, 10)
    assert evaluate("3 < 4 <= 4") is True


@pytest.mark.parametrize("expr", [
    "__import__('os')", "(1).__class__", "open('x')", "[x for x in (1,)]", "lambda: 1",
    "a = 1", "'text'", "x", "math.pi", "Fraction(1, denominator=2)", "().__class__.__bases__",
])
def test_everything_outside_the_whitelist_is_refused(expr):
    assert calc(expr).startswith("error:")


@pytest.mark.parametrize("expr", ["2**(10**6)", "factorial(10**5)", "comb(10**6, 3)", "(2**4000)**4000",
                                  "9" * 2001, "+".join(["1"] * 500)])
def test_nothing_can_run_away(expr):
    assert calc(expr).startswith("error:")


def test_errors_come_back_as_text_not_exceptions():
    assert calc("1/0").startswith("error: ZeroDivisionError")
    assert calc("log(-1)").startswith("error:")


def test_the_calculator_is_enough_to_decide_a_declared_task():
    """The means to decide: the log-domain test the task's own conventions describe, through
    the tool alone, agrees with the exact grader on every declared task of a sample."""
    ts = Taskset(seed=11, dims=(8, 12, 16))
    for i in range(0, 60, 3):
        t = ts.sample(i, rung="declared")
        n, q = t.data.lattice["n"], int(t.data.lattice["q"])
        ns = sum(int(c) ** 2 for c in t.data.claim["vector"])
        lhs = evaluate("0.5 * log(%d)" % ns)
        rhs = evaluate("log(21/20) + (log(%d) + lgamma(%d/2 + 1) - (%d/2) * log(pi)) / %d" % (q, n, n, n))
        assert ("ADMISSIBLE" if lhs <= rhs else "REFUSED") == t._truth
