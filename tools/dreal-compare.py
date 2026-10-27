#!/usr/bin/env python3
"""dreal-compare.py — every query of corpus/dreal-compare/claims.json put to dReal 4 (the delta-complete decider of
Gao, Avigad and Clarke), one fresh process per query, and the raw answers written out. Nothing here decides a verdict:
the mapping from dReal's answers to the three words, and the comparison with cert-machine, are done by
tools/dreal-compare.js --record from the file this script writes.

WHERE IT RUNS. dReal's Python wheel is built for x86_64 Linux only (no wheel for Apple silicon), so this script runs on
a GitHub-hosted runner (.github/workflows/dreal-compare.yml) with the wheel dreal==4.21.6.2 pinned by sha256.

THE ENCODING (read before trusting an answer). A claim carries:
  vars     the declared box: each variable with its two ends as exact decimal or rational strings;
  params   every constant the formulas use, as an exact decimal/rational string or as an exact enclosure [lo, hi] of an
           irrational (pi, ln 10) — each becomes a dReal VARIABLE bounded by the doubles that enclose it (the lower end
           rounded down, the upper end rounded up), never a Python float constant: dReal's symbolic layer folds an
           operation on two constants into one round-to-nearest double (log(10) would become a rounded double, 1/49
           too), and a variable with a thin box cannot be folded;
  defs     named sub-expressions, in a small arithmetic grammar (+ - * / ** with an integer exponent, unary minus,
           log sqrt exp Max Min, sum(...)) over names and integer literals; a division of two integer literals is
           refused (it would be a rounded double);
  given    atoms asserted in every query of the claim (Colebrook's equation);
  queries  name -> a conjunction of atoms; the formula put to dReal is  box AND params AND given AND query.
The box is widened outward to doubles in the same way, so the box decided contains the declared one (as the gate's own
double hull does). dReal's 'unsat' is a proof that no point of that box satisfies the formula (interval constraint
propagation in IBEX with outward rounding); 'delta-sat' says only that the delta-weakening of the formula is
satisfiable in the returned box — it is not a witness for the formula itself.

usage: python3 tools/dreal-compare.py CLAIMS.json OUT.json [--wheel-sha256 HEX] [--only SUBSTRING]      MIT
"""
import ast
import hashlib
import json
import math
import multiprocessing as mp
import os
import platform
import sys
import time
from fractions import Fraction

import dreal as D

FUNCS = {'log': D.log, 'sqrt': D.sqrt, 'exp': D.exp, 'Max': D.Max, 'Min': D.Min}
INT_LIMIT = 2 ** 53


def frac(s):
    if not isinstance(s, str):
        raise ValueError('a number must be a string, got %r' % (s,))
    return Fraction(s.strip())          # exact: '0.1520', '1/49', '1e-9'


def down(q):
    d = float(q)
    return d if Fraction(d) <= q else math.nextafter(d, -math.inf)


def up(q):
    d = float(q)
    return d if Fraction(d) >= q else math.nextafter(d, math.inf)


def bounds(v):
    """the doubles enclosing an exact number or an exact enclosure [lo, hi]"""
    if isinstance(v, list):
        lo, hi = frac(v[0]), frac(v[1])
        if lo > hi:
            raise ValueError('empty enclosure %r' % (v,))
        return down(lo), up(hi)
    q = frac(v)
    return down(q), up(q)


def names_in(src):
    return {n.id for n in ast.walk(ast.parse(src, mode='eval')) if isinstance(n, ast.Name)}


class Builder:
    def __init__(self, claim):
        self.claim = claim
        self.defs = claim.get('defs', {})
        self.vars = claim.get('vars', {})
        self.params = claim.get('params', {})
        self.env = {}
        self.dvars = {}
        self.bounds = []

    def name(self, n):
        if n in self.env:
            return self.env[n]
        if n in self.vars or n in self.params:
            if n in FUNCS or n == 'sum':
                raise ValueError('a variable shadows a function: ' + n)
            v = D.Variable(n)
            e = D.Expression(v)
            lo, hi = bounds(self.vars[n] if n in self.vars else self.params[n])
            self.bounds += [e >= lo, e <= hi]
            self.dvars[n] = v
            self.env[n] = e
            return e
        if n in self.defs:
            e = self.expr(ast.parse(self.defs[n], mode='eval').body)
            self.env[n] = e
            return e
        raise ValueError('unknown name ' + n)

    def expr(self, node):
        if isinstance(node, ast.Name):
            return self.name(node.id)
        if isinstance(node, ast.Constant):
            if type(node.value) is not int or abs(node.value) >= INT_LIMIT:
                raise ValueError('only integer literals below 2^53 may appear in a formula: %r' % (node.value,))
            return node.value
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            x = self.expr(node.operand)
            return -x
        if isinstance(node, ast.BinOp):
            if isinstance(node.op, ast.Pow):
                if not (isinstance(node.right, ast.Constant) and type(node.right.value) is int):
                    raise ValueError('an exponent must be an integer literal')
                base = self.expr(node.left)
                if isinstance(base, int):
                    raise ValueError('a power of a literal')
                return base ** node.right.value
            a, b = self.expr(node.left), self.expr(node.right)
            if isinstance(a, int) and isinstance(b, int):
                if isinstance(node.op, ast.Div):
                    raise ValueError('a division of two literals would round')
                r = {ast.Add: lambda: a + b, ast.Sub: lambda: a - b, ast.Mult: lambda: a * b}[type(node.op)]()
                if abs(r) >= INT_LIMIT:
                    raise ValueError('a literal product beyond 2^53')
                return r
            if isinstance(node.op, ast.Add):
                return a + b
            if isinstance(node.op, ast.Sub):
                return a - b
            if isinstance(node.op, ast.Mult):
                return a * b
            if isinstance(node.op, ast.Div):
                return a / b
            raise ValueError('operator %s is not in the grammar' % type(node.op).__name__)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
            args = [self.expr(x) for x in node.args]
            if node.func.id == 'sum':
                if not args:
                    raise ValueError('an empty sum')
                acc = args[0]
                for x in args[1:]:
                    acc = acc + x
                return acc
            if node.func.id in FUNCS:
                if any(isinstance(x, int) for x in args):
                    raise ValueError('a function of a literal would be folded to a rounded double')
                return FUNCS[node.func.id](*args)
        raise ValueError('not in the grammar: ' + ast.dump(node)[:120])

    def atom(self, src):
        node = ast.parse(src, mode='eval').body
        if not (isinstance(node, ast.Compare) and len(node.ops) == 1):
            raise ValueError('an atom is one comparison: ' + src)
        a, b = self.expr(node.left), self.expr(node.comparators[0])
        if isinstance(a, int) and isinstance(b, int):
            raise ValueError('a comparison of two literals: ' + src)
        if isinstance(a, int):
            a, b = b, a
            flip = {ast.Lt: ast.Gt, ast.LtE: ast.GtE, ast.Gt: ast.Lt, ast.GtE: ast.LtE, ast.Eq: ast.Eq}
            op = flip[type(node.ops[0])]
        else:
            op = type(node.ops[0])
        if op is ast.Lt:
            return a < b
        if op is ast.LtE:
            return a <= b
        if op is ast.Gt:
            return a > b
        if op is ast.GtE:
            return a >= b
        if op is ast.Eq:
            return a == b
        raise ValueError('relation not in the grammar: ' + src)

    def formula(self, qname):
        atoms = [self.atom(s) for s in self.claim.get('given', [])] + [self.atom(s) for s in self.claim['queries'][qname]]
        return D.And(*(self.bounds + atoms))


def worker(claim, qname, delta, conn):
    try:
        t0 = time.perf_counter()
        b = Builder(claim)
        f = b.formula(qname)
        t1 = time.perf_counter()
        r = D.CheckSatisfiability(f, delta)
        t2 = time.perf_counter()
        out = {'answer': 'unsat' if r is None else 'delta-sat', 'buildSeconds': t1 - t0, 'solveSeconds': t2 - t1}
        if r is not None:
            out['box'] = {n: [repr(r[v].lb()), repr(r[v].ub())] for n, v in b.dvars.items() if n in claim.get('vars', {})}
        conn.send(out)
    except Exception as e:  # noqa: BLE001 — every failure is reported as an answer, never swallowed
        conn.send({'answer': 'error', 'error': '%s: %s' % (type(e).__name__, e)})


def run(claim, qname, delta, timeout):
    parent, child = mp.Pipe(duplex=False)
    t0 = time.perf_counter()
    p = mp.Process(target=worker, args=(claim, qname, float(delta), child))
    p.start()
    child.close()
    got = None
    if parent.poll(timeout):
        got = parent.recv()
    p.join(5)
    if p.is_alive():
        p.terminate()
        p.join()
    wall = time.perf_counter() - t0
    if got is None:
        got = {'answer': 'timeout' if wall >= timeout else 'error', 'error': None if wall >= timeout else 'the solver process died (exit %s)' % p.exitcode}
    got['wallSeconds'] = wall
    return got


def cpu():
    try:
        with open('/proc/cpuinfo') as fh:
            for line in fh:
                if line.startswith('model name'):
                    return line.split(':', 1)[1].strip()
    except OSError:
        pass
    return platform.processor()


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__)
    src, dst = args[0], args[1]
    opt = lambda k: args[args.index(k) + 1] if k in args else None  # noqa: E731
    raw = open(src, 'rb').read()
    C = json.loads(raw)
    only = opt('--only')
    try:
        from importlib.metadata import version as pkgver
        package = pkgver('dreal')
    except Exception:  # noqa: BLE001
        package = None
    try:
        dver = D.Context.version
        dver = dver if isinstance(dver, str) else str(dver)
    except Exception:  # noqa: BLE001
        dver = None
    out = {
        'claimsSha256': hashlib.sha256(raw).hexdigest(),
        'dreal': {'package': package, 'contextVersion': dver, 'moduleVersion': getattr(D, '__version__', None),
                  'wheelSha256': opt('--wheel-sha256'), 'config': 'CheckSatisfiability(formula, delta): the default Config '
                  'except its precision (one job, no polytope contractor, no local optimization, largest-first branching)'},
        'host': {'python': sys.version.split()[0], 'platform': platform.platform(), 'cpu': cpu(), 'cpus': os.cpu_count()},
        'deltas': C['deltas'], 'timeoutSeconds': C['timeoutSeconds'],
        'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'results': [],
    }
    for claim in C['claims']:
        if only and only not in claim['id']:
            continue
        if claim.get('encodable') is False:
            continue
        for delta in C['deltas']:
            for qname in claim['queries']:
                r = run(claim, qname, delta, C['timeoutSeconds'])
                r.update({'claim': claim['id'], 'query': qname, 'delta': delta})
                out['results'].append(r)
                print('%-58s %-8s δ=%-6s %-9s %8.3f s' % (claim['id'][:58], qname, delta, r['answer'], r['wallSeconds']), flush=True)
    out['finished'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    with open(dst, 'w') as fh:
        json.dump(out, fh, indent=1)
        fh.write('\n')
    bad = [r for r in out['results'] if r['answer'] == 'error']
    print('dreal-compare: %d queries, %d unsat, %d delta-sat, %d timeout, %d error' % (
        len(out['results']), sum(r['answer'] == 'unsat' for r in out['results']),
        sum(r['answer'] == 'delta-sat' for r in out['results']), sum(r['answer'] == 'timeout' for r in out['results']), len(bad)))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    mp.set_start_method('fork')
    main()
