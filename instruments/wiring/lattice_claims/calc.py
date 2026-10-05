"""calc — the tool of tools="calc" (0.5.0): a calculator the model can call, nothing more.

It evaluates a short program over integers, Fractions and floats with a whitelist of syntax and
functions: statements separated by ';' or newlines, each a simple assignment `name = expression`
or an expression, the value of the last one returned (0.5.1: the probe showed models write
`q = ...; n = 16; ...` and `sum(...)`, and spent every turn retyping 50-digit numbers). No
imports, no attribute access, no subscripting, no comprehensions, no loops, no strings. It exists because the hosted
sandbox path (tools="python", a Prime sandbox per rollout) would not load on Hosted Training
on 2026-10-05 (0.4.0-0.4.2), and the question the tool answers -- can the policy DECIDE the
arithmetic once it has the means? -- needs a calculator, not a computer.

Guards, so a hostile or careless expression cannot hang the env-server:
  * exponents: |e| <= 4096, and a base's bit length times |e| <= 1,000,000 bits;
  * factorial(n), n <= 2000; comb arguments <= 4000;
  * every intermediate integer is checked at <= 1,000,000 bits;
  * the expression text is <= 2000 characters and its tree <= 400 nodes.
Exactness is the model's choice: integers and Fraction(...) stay exact, while pi, sqrt, log,
lgamma and the rest are floats, as in Python. Nothing here reads the task or the grader.
Standard library only.
"""
import ast
import math
from fractions import Fraction

__all__ = ["calc", "evaluate", "CalcError"]

MAX_TEXT, MAX_NODES, MAX_BITS, MAX_EXP, MAX_STMTS = 4000, 1200, 1_000_000, 4096, 30


class CalcError(ValueError):
    pass


def _check_int(v):
    if isinstance(v, int) and not isinstance(v, bool) and v.bit_length() > MAX_BITS:
        raise CalcError("integer exceeds %d bits" % MAX_BITS)
    if isinstance(v, Fraction) and (v.numerator.bit_length() > MAX_BITS or v.denominator.bit_length() > MAX_BITS):
        raise CalcError("fraction exceeds %d bits" % MAX_BITS)
    return v


def _factorial(n):
    if not isinstance(n, int) or n < 0 or n > 2000:
        raise CalcError("factorial takes an integer 0..2000")
    return math.factorial(n)


def _comb(n, k):
    if not (isinstance(n, int) and isinstance(k, int)) or not (0 <= k <= n <= 4000):
        raise CalcError("comb takes integers 0 <= k <= n <= 4000")
    return math.comb(n, k)


def _pow(a, b):
    if isinstance(b, int) and not isinstance(b, bool):
        if abs(b) > MAX_EXP:
            raise CalcError("exponent beyond +/-%d" % MAX_EXP)
        size = a.bit_length() if isinstance(a, int) else (
            max(a.numerator.bit_length(), a.denominator.bit_length()) if isinstance(a, Fraction) else 1)
        if size * abs(b) > MAX_BITS:
            raise CalcError("power would exceed %d bits" % MAX_BITS)
    return a ** b


def _sum(xs, start=0):
    if not isinstance(xs, tuple) or len(xs) > 10_000:
        raise CalcError("sum takes a list or tuple of at most 10,000 numbers")
    t = start
    for x in xs:
        t = _check_int(t + x)
    return t


def _powf(a, b, m=None):
    if m is not None:
        if not all(isinstance(v, int) for v in (a, b, m)) or b < 0:
            raise CalcError("pow(a, b, m) takes non-negative integers")
        return pow(a, b, m)
    return _pow(a, b)


FUNCS = {
    "Fraction": Fraction, "abs": abs, "min": min, "max": max, "round": round, "int": int, "float": float,
    "sum": _sum, "pow": _powf,
    "sqrt": math.sqrt, "isqrt": math.isqrt, "exp": math.exp, "log": math.log, "log10": math.log10,
    "log2": math.log2, "lgamma": math.lgamma, "gamma": math.gamma, "floor": math.floor, "ceil": math.ceil,
    "factorial": _factorial, "comb": _comb, "gcd": math.gcd,
}
CONSTS = {"pi": math.pi, "e": math.e}
BINOPS = {ast.Add: lambda a, b: a + b, ast.Sub: lambda a, b: a - b, ast.Mult: lambda a, b: a * b,
          ast.Div: lambda a, b: a / b, ast.FloorDiv: lambda a, b: a // b, ast.Mod: lambda a, b: a % b,
          ast.Pow: _pow}
CMPOPS = {ast.Lt: lambda a, b: a < b, ast.LtE: lambda a, b: a <= b, ast.Gt: lambda a, b: a > b,
          ast.GtE: lambda a, b: a >= b, ast.Eq: lambda a, b: a == b, ast.NotEq: lambda a, b: a != b}


def _ev(node, env=None):
    env = {} if env is None else env
    if isinstance(node, ast.Expression):
        return _ev(node.body, env)
    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
            raise CalcError("only numbers are allowed as constants")
        return _check_int(node.value)
    if isinstance(node, ast.Name):
        if node.id in env:
            return env[node.id]
        if node.id in CONSTS:
            return CONSTS[node.id]
        raise CalcError("unknown name %r (built in: %s)" % (node.id, ALLOWED))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
        v = _ev(node.operand, env)
        return -v if isinstance(node.op, ast.USub) else +v
    if isinstance(node, ast.BinOp) and type(node.op) in BINOPS:
        return _check_int(BINOPS[type(node.op)](_ev(node.left, env), _ev(node.right, env)))
    if isinstance(node, ast.Compare):
        left = _ev(node.left, env)
        for op, right in zip(node.ops, node.comparators):
            if type(op) not in CMPOPS:
                raise CalcError("comparison not allowed")
            r = _ev(right, env)
            if not CMPOPS[type(op)](left, r):
                return False
            left = r
        return True
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in FUNCS and not node.keywords:
        return _check_int(FUNCS[node.func.id](*[_ev(a, env) for a in node.args]))
    if isinstance(node, (ast.Tuple, ast.List)):
        return tuple(_ev(e, env) for e in node.elts)
    if isinstance(node, ast.Call):
        raise CalcError("only the built-in functions may be called: " + ALLOWED)
    raise CalcError("not allowed: %s" % type(node).__name__)


ALLOWED = ", ".join(sorted(FUNCS)) + "; constants " + ", ".join(sorted(CONSTS))


def evaluate(expression: str):
    """The value of a whitelisted program: statements separated by ';' or newlines, each a simple
    assignment `name = expr` or an expression; the value of the last one. Raises CalcError."""
    if not isinstance(expression, str) or len(expression) > MAX_TEXT:
        raise CalcError("input must be a string of at most %d characters" % MAX_TEXT)
    try:
        tree = ast.parse(expression.strip(), mode="exec")
    except SyntaxError as e:
        raise CalcError("syntax error: %s" % e.msg)
    if sum(1 for _ in ast.walk(tree)) > MAX_NODES:
        raise CalcError("input too large (more than %d syntax nodes)" % MAX_NODES)
    if len(tree.body) > MAX_STMTS:
        raise CalcError("at most %d statements per call" % MAX_STMTS)
    env, last = {}, None
    for st in tree.body:
        if isinstance(st, (ast.Import, ast.ImportFrom)):
            raise CalcError("no import is needed or allowed; built in: " + ALLOWED)
        if isinstance(st, ast.Assign) and len(st.targets) == 1 and isinstance(st.targets[0], ast.Name):
            name = st.targets[0].id
            if name in FUNCS or name in CONSTS or name.startswith("_"):
                raise CalcError("cannot assign to %r" % name)
            last = env[name] = _ev(st.value, env)
        elif isinstance(st, ast.Expr):
            last = _ev(st.value, env)
        else:
            raise CalcError("only assignments `name = expression` and expressions are allowed, not %s" % type(st).__name__)
    if last is None:
        raise CalcError("nothing to evaluate")
    return last


def calc(expression: str) -> str:
    """Evaluate a short arithmetic program and return the value of its last line.

    Write statements separated by ';' or newlines: assignments `name = expression` and
    expressions, e.g. "q = 1117; n = 16; ns = sum([3**2, 4**2]); 0.5*log(ns) <= log(q)/n".
    Built in (no import needed): Fraction, abs, min, max, round, int, float, sum, pow, sqrt,
    isqrt, exp, log, log10, log2, lgamma, gamma, floor, ceil, factorial, comb, gcd; constants
    pi and e. Integers and Fraction(...) are exact; the other functions return floats. No
    imports, loops, comprehensions, attributes or strings.

    Args:
        expression: the program, e.g. "a = Fraction(21, 20); a**2 * 400".
    """
    try:
        v = evaluate(expression)
    except CalcError as e:
        return "error: %s" % e
    except (ZeroDivisionError, OverflowError, ValueError, TypeError) as e:
        return "error: %s: %s" % (type(e).__name__, e)
    return repr(v) if not isinstance(v, Fraction) else "Fraction(%d, %d)" % (v.numerator, v.denominator)
