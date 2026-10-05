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
    "a = 1; b", "'text'", "x", "math.pi", "Fraction(1, denominator=2)", "().__class__.__bases__",
])
def test_everything_outside_the_whitelist_is_refused(expr):
    assert calc(expr).startswith("error:")


@pytest.mark.parametrize("expr", ["2**(10**6)", "factorial(10**5)", "comb(10**6, 3)", "(2**4000)**4000",
                                  "9" * 4001, "+".join(["1"] * 700), "; ".join("x%d = 1" % i for i in range(31))])
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


# --- 0.5.1: programs, sum, pow, helpful refusals ------------------------------------------

def test_programs_with_assignments_and_the_last_value_returned():
    assert calc("q = 1117; n = 16; q * n") == str(1117 * 16)
    assert calc("a = Fraction(21, 20)\nb = a**2\nb * 400") == "Fraction(441, 1)"
    assert calc("ns = sum([3**2, 4**2]); isqrt(ns)") == "5"
    assert calc("pow(3, 200, 1000)") == str(pow(3, 200, 1000))


@pytest.mark.parametrize("prog", ["from math import pi", "import os", "x = 1; for i in (1,): x", "pi = 3",
                                  "sum = 1", "_x = 1", "x.y = 1", "a, b = 1, 2", "sum(x for x in (1, 2))"])
def test_programs_refuse_everything_but_assignments_and_expressions(prog):
    assert calc(prog).startswith("error:")


def test_an_import_is_answered_with_the_list_of_built_ins():
    r = calc("from math import gamma, pi")
    assert "no import" in r and "lgamma" in r


def test_a_task_decided_in_one_call_the_way_a_model_writes_it():
    ts = Taskset(seed=11, dims=(8, 12, 16))
    t = ts.sample(0, rung="declared")
    n, q = t.data.lattice["n"], int(t.data.lattice["q"])
    vec = ", ".join("%s**2" % c for c in t.data.claim["vector"])
    prog = "q = %d; n = %d; ns = sum([%s]); 0.5*log(ns) <= log(21/20) + (log(q) + lgamma(n/2 + 1) - (n/2)*log(pi))/n" % (q, n, vec)
    assert evaluate(prog) == (t._truth == "ADMISSIBLE")
