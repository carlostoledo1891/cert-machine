#!/usr/bin/env python3
"""instruments/box/check.py — the checker of declared claims (version 3, 2026-10-20). Standard library only.

WHAT A DECLARED CLAIM IS. The method paper's Definition 2 read as a file: a domain B (a finite set of pinned
bytes, or a box with rational sides and a source per side), a predicate — a conjunction of relations
g_j(x) REL c_j over a closed vocabulary of functions — the reading (universal or epistemic), the sentence as
the source prints it, the reference (what the number is about), the hypotheses taken from the literature,
the falsifier, and the record that decided it. SCHEMA.md beside this file is the specification; the ten
objects in claims/ are the first corpus; the objects in primitive/ are decided from the object alone.

WHAT THIS CHECKER DECIDES, AND WHAT IT CANNOT. It decides well-formedness: every number is a rational or a
declared box (a JSON number is a double and is refused; a printed decimal is refused until it is written as
the rational its digits mean, or the box its digits allow); every pin resolves and hashes; the quoted
sentence is byte for byte in the pinned source; the printed bar is in the quote and the exact bar c is the
rational of the printed digits; every function head is in the vocabulary, with its arity; the reading and the
falsifier are declared; when a record is attached, it exists, its verdict is one of the three words, its bar
is the object's bar, and the record's exact value or enclosure, re-decided here against the object's bar,
gives the record's verdict. SINCE VERSION 3 it also DECIDES, from the object alone, every predicate written in
the exact heads over typed data (the finite quantifier: Sum, Product, MaxOver, MinOver over integer ranges,
Index into the decoded bytes, a forall over index tuples): the decision is a verdict with its witness — the
first index tuple that violates, and the count of all that do — and where a record is attached the decision
must be the record's and a single value must equal the record's exactly. It does NOT decide whether the
predicate is what the sentence means: that is a reading, done twice and compared, never a verdict of this
program. A transcendental head (Exp, Ln, Sin, …) is well-formed but not exactly evaluable here: the object is
admitted and not decided from the object; the record stays the authority.

THE VOCABULARY IS READ, NOT TYPED. Each kernel head maps to an operation of the interval kernel, and the
checker refuses to run unless certs/kernel-arb-audit.json holds that operation; the three verdict words are
read from instruments/verdict.js. The exact heads (Min, Max, Kronecker, Index, the four quantifiers) are
rational arithmetic and need no kernel.

THE OUTCOME WORDS. ADMITTED or REFUSED with one kind from the closed list KINDS. ADMITTED certifies nothing
by itself: it says the object can be handed to a decider — and, for the exact class, it carries the decision
this program made, in the three words, with the witness.

usage: python3 instruments/box/check.py <object.json>...        one line per object; exit 1 if any REFUSED
       python3 instruments/box/check.py --smt <object.json>     the object's predicate unrolled to SMT-LIB 2 on stdout (exact class only)
       python3 instruments/box/check.py --kinds                   the refusal kinds and their meanings
MIT"""
import hashlib
import json
import os
import re
import sys
import time
from fractions import Fraction

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ARB = os.path.join(ROOT, 'certs', 'kernel-arb-audit.json')
VERDICT_JS = os.path.join(ROOT, 'instruments', 'verdict.js')

ADMITTED = 'ADMITTED'
REFUSED_WORD = 'REFUSED'

# kernel heads: head -> (arity, the kernel operation it names in certs/kernel-arb-audit.json byOp). MathJSON's names where
# MathJSON has them; the special functions are the kernel's own. Nothing outside the audited list.
VOCAB = {
    'Add': (2, 'add'), 'Subtract': (2, 'sub'), 'Multiply': (2, 'mul'), 'Divide': (2, 'div'),
    'Abs': (1, 'abs'), 'Square': (1, 'sqr'), 'Power': (2, 'pow'), 'Exp': (1, 'exp'), 'Ln': (1, 'log'),
    'Sin': (1, 'sin'), 'Cos': (1, 'cos'), 'Tanh': (1, 'tanh'),
    'LogGamma': (1, 'lgamma'), 'Digamma': (1, 'digamma'), 'Trigamma': (1, 'trigamma'),
    'GammaP': (2, 'gammaP'), 'Phi': (1, 'Phi'),
}
# exact heads (version 3): rational arithmetic, no kernel. Index takes the data symbol and one or two index expressions.
EXACT_EXTRA = {'Min': 2, 'Max': 2, 'Kronecker': 2}
QUANT = ('Sum', 'Product', 'MaxOver', 'MinOver')          # [head, var, lo, hi, body]
EXACT_HEADS = ('Add', 'Subtract', 'Multiply', 'Divide', 'Abs', 'Square', 'Power') + tuple(EXACT_EXTRA) + QUANT + ('Index',)
RELS = ('le', 'lt', 'ge', 'gt', 'eq', 'in', 'holds')
READINGS = ('universal', 'epistemic')
TOP = ('id', 'text', 'source', 'reading', 'domain', 'predicate', 'reference', 'hypotheses', 'falsifier')
TOP_OPTIONAL = ('record', 'repair', 'notes')
ELEMENTS = ('doubles', 'integers', 'rationals')

KINDS = {
    'schema': 'a field missing, unknown or of the wrong shape',
    'json-number': 'a JSON number where a value is expected: a JSON number is a double; write the rational as a string',
    'decimal-literal': 'a decimal string where a rational is expected: write the rational its digits mean (p/q), or declare the box its digits allow with rel "in"',
    'rational': 'a string that is not a rational p/q',
    'box-order': 'a box side with lo > hi',
    'unbounded': 'a box side with an infinite end (finite sides only)',
    'pin-unresolved': 'a pinned path that is not on disk',
    'pin-mismatch': 'a pinned file whose sha256 is not the declared one',
    'quote-not-verbatim': 'the quoted sentence is not byte for byte in the pinned source',
    'printed-not-in-quote': 'the printed bar does not appear in the quoted sentence',
    'printed-mismatch': 'the exact bar c is not the rational of the printed digits (or, for "in", not the box the digits allow)',
    'vocabulary': 'an expression head outside the closed vocabulary',
    'arity': 'an expression head with the wrong number of arguments',
    'symbol': 'a symbol the domain does not declare',
    'named': 'a named function without a definition on disk',
    'reading': 'a reading other than universal or epistemic',
    'falsifier': 'no falsifier, or an empty one',
    'reference': 'no statement of what the number is about',
    'data': 'the typed data block is malformed, or the bytes do not decode as declared (shape, elements, select)',
    'index': 'an index that is not an integer, or out of range, or a quantifier bound that is not an integer',
    'empty-range': 'a maximum or minimum over an empty range',
    'division-by-zero': 'the exact evaluation divided by zero',
    'record-missing': 'the deciding record is not on disk',
    'record-row-missing': 'the deciding record has no row of that id',
    'record-verdict-word': 'the record\'s verdict is not one of the three words, or the object declares another',
    'record-value': 'the record\'s value is neither an exact rational nor an enclosure of two numbers',
    'record-bar-mismatch': 'the record decided a bar other than the object\'s',
    'record-decision-mismatch': 'the record\'s value re-decided against the object\'s bar, or the decision from the object, does not give the record\'s verdict',
    'record-value-mismatch': 'the value computed from the object is not the record\'s exact value',
    'repair': 'the repair block is malformed, or its bar re-decided does not give its verdict',
}


class Refuse(Exception):
    def __init__(self, kind, msg):
        assert kind in KINDS, kind
        Exception.__init__(self, msg)
        self.kind = kind
        self.msg = msg


def die(m):
    sys.stderr.write('BOX CHECKER REFUSED TO RUN: ' + m + '\n')
    sys.exit(2)


# ---- the vocabulary and the words, read ----------------------------------------------------------------------
def load_vocab(arb_path=ARB, verdict_path=VERDICT_JS):
    """refuses to run unless every kernel head's operation is in the Arb audit and the three words are in verdict.js"""
    if not os.path.exists(arb_path):
        die('the kernel audit ' + os.path.relpath(arb_path, ROOT) + ' is missing; the vocabulary is read from it')
    with open(arb_path, encoding='utf-8') as f:
        by_op = json.load(f).get('byOp') or {}
    for head, (_, op) in VOCAB.items():
        if op not in by_op:
            die('the vocabulary names ' + head + ' -> kernel ' + op + ', which the Arb audit does not hold')
    if not os.path.exists(verdict_path):
        die('instruments/verdict.js is missing; the three words are read from it')
    with open(verdict_path, encoding='utf-8') as f:
        src = f.read()
    words = re.findall(r"^const (?:CERTIFIED|REFUTED|REFUSED) = '([A-Z]+)';", src, re.M)
    if sorted(words) != ['CERTIFIED', 'REFUSED', 'REFUTED']:
        die('verdict.js does not declare the three words where this checker reads them')
    return tuple(words)


WORDS = None  # set by run()


# ---- small readers --------------------------------------------------------------------------------------------
RAT = re.compile(r'^-?\d+(?:/[1-9]\d*)?$')
DEC = re.compile(r'^-?\d+\.\d+$')
INT = re.compile(r'^-?\d+$')
SYM = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')


def rational(s, where):
    if isinstance(s, bool) or isinstance(s, (int, float)):
        raise Refuse('json-number', where + ': ' + repr(s))
    if not isinstance(s, str):
        raise Refuse('schema', where + ' must be a string')
    if DEC.match(s):
        raise Refuse('decimal-literal', where + ': ' + s)
    if not RAT.match(s):
        raise Refuse('rational', where + ': ' + s)
    return Fraction(s)


def printed_rational(s, where):
    if not isinstance(s, str) or not (DEC.match(s) or INT.match(s)):
        raise Refuse('schema', where + ' (printed) must be the digits as printed, e.g. "1.4630715826075594"')
    return Fraction(s)


def printed_box(s):
    d = len(s.split('.')[1]) if '.' in s else 0
    half = Fraction(5, 10 ** (d + 1))
    p = Fraction(s)
    return p - half, p + half


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def pinned(pin, where, root):
    if not isinstance(pin, dict) or set(pin) != {'path', 'sha256'}:
        raise Refuse('schema', where + ' must be {path, sha256}')
    p = os.path.join(root, pin['path'])
    if not os.path.isfile(p):
        raise Refuse('pin-unresolved', where + ': ' + pin['path'])
    if sha256(p) != pin['sha256']:
        raise Refuse('pin-mismatch', where + ': ' + pin['path'])
    return p


def need(obj, keys, optional, where):
    if not isinstance(obj, dict):
        raise Refuse('schema', where + ' must be an object')
    missing = [k for k in keys if k not in obj]
    unknown = [k for k in obj if k not in keys and k not in optional]
    if missing:
        raise Refuse('schema', where + ' is missing ' + ', '.join(missing))
    if unknown:
        raise Refuse('schema', where + ' has unknown field(s) ' + ', '.join(unknown))


def str_list(xs, where, allow_empty):
    if not isinstance(xs, list) or (not xs and not allow_empty) or any(not isinstance(x, str) or not x.strip() for x in xs):
        raise Refuse('falsifier' if where == 'falsifier' else 'schema', where + ' must be a list of non-empty strings' + ('' if allow_empty else ', not empty'))


# ---- expressions: well-formedness ---------------------------------------------------------------------------------
def walk(e, symbols, where, root, data_sym=None, bound=()):
    """checks heads, arities and symbols; returns True iff every head is exact (evaluable here)"""
    if isinstance(e, bool) or isinstance(e, (int, float)):
        raise Refuse('json-number', where + ': ' + repr(e))
    if isinstance(e, str):
        if RAT.match(e):
            return True
        if DEC.match(e):
            raise Refuse('decimal-literal', where + ': ' + e)
        if SYM.match(e):
            if e in symbols or e in bound:
                return True
            raise Refuse('symbol', where + ': ' + e + ' is not declared by the domain')
        raise Refuse('schema', where + ': unreadable token ' + repr(e))
    if isinstance(e, list):
        if not e or not isinstance(e[0], str):
            raise Refuse('schema', where + ': an expression list starts with its head')
        head = e[0]
        if head in QUANT:
            if len(e) != 5:
                raise Refuse('arity', where + ': ' + head + ' takes var, lo, hi, body')
            var = e[1]
            if not isinstance(var, str) or not SYM.match(var) or var in symbols or var in bound:
                raise Refuse('schema', where + ': ' + head + ' binds a fresh symbol')
            a = walk(e[2], symbols, where + '.' + head + '.lo', root, data_sym, bound)
            b = walk(e[3], symbols, where + '.' + head + '.hi', root, data_sym, bound)
            c = walk(e[4], symbols, where + '.' + head + '.body', root, data_sym, bound + (var,))
            return a and b and c
        if head == 'Index':
            if data_sym is None:
                raise Refuse('vocabulary', where + ': Index needs a typed data block in the domain')
            if len(e) not in (3, 4) or e[1] != data_sym:
                raise Refuse('arity', where + ': Index takes the data symbol ' + str(data_sym) + ' and one or two indices')
            ok = True
            for i, a in enumerate(e[2:]):
                ok = walk(a, symbols, where + '.Index[' + str(i) + ']', root, data_sym, bound) and ok
            return ok
        if head in EXACT_EXTRA:
            arity = EXACT_EXTRA[head]
        elif head in VOCAB:
            arity = VOCAB[head][0]
        else:
            raise Refuse('vocabulary', where + ': ' + head)
        if len(e) - 1 != arity:
            raise Refuse('arity', where + ': ' + head + ' takes ' + str(arity) + ', given ' + str(len(e) - 1))
        ok = head in EXACT_HEADS
        for i, a in enumerate(e[1:]):
            ok = walk(a, symbols, where + '.' + head + '[' + str(i) + ']', root, data_sym, bound) and ok
        return ok
    if isinstance(e, dict):
        need(e, ('named', 'where', 'args'), (), where + ' (named)')
        if not isinstance(e['named'], str) or not e['named'].strip():
            raise Refuse('schema', where + ': named must be a non-empty string')
        if not isinstance(e['where'], str) or not os.path.isfile(os.path.join(root, e['where'])):
            raise Refuse('named', where + ': ' + str(e.get('where')))
        if not isinstance(e['args'], list):
            raise Refuse('schema', where + ': args must be a list')
        for i, a in enumerate(e['args']):
            walk(a, symbols, where + '.args[' + str(i) + ']', root, data_sym, bound)
        return False
    raise Refuse('schema', where + ': unreadable expression')


# ---- expressions: exact evaluation ---------------------------------------------------------------------------------
def as_int(v, where):
    if isinstance(v, int) and not isinstance(v, bool):
        return v
    if isinstance(v, Fraction) and v.denominator == 1:
        return int(v)
    raise Refuse('index', where + ': ' + str(v) + ' is not an integer')


def num(s):
    """an integer literal is a Python int, a rational one a Fraction; both exact, and they mix exactly"""
    return int(s) if INT.match(s) else Fraction(s)


def exact_of(x):
    """a decoded element: ints stay ints; a double or a rational string that is integral becomes an int"""
    f = Fraction(x)
    return int(f) if f.denominator == 1 else f


def ev(e, env, data, where='g'):
    """exact evaluation; env maps symbols to ints or Fractions; data is the decoded array (nested lists)"""
    if isinstance(e, str):
        if RAT.match(e):
            return num(e)
        return env[e]
    head = e[0]
    if head == 'Index':
        cur = data
        for a in e[2:]:
            i = as_int(ev(a, env, data, where), where + '.Index')
            if not isinstance(cur, list) or i < 0 or i >= len(cur):
                raise Refuse('index', where + ': Index ' + str(i) + ' out of range')
            cur = cur[i]
        if isinstance(cur, list):
            raise Refuse('index', where + ': Index does not reach a scalar')
        return cur
    if head in QUANT:
        var, lo, hi, body = e[1], as_int(ev(e[2], env, data, where), where), as_int(ev(e[3], env, data, where), where), e[4]
        if head in ('MaxOver', 'MinOver') and hi < lo:
            raise Refuse('empty-range', where + ': ' + head + ' over ' + str(lo) + '..' + str(hi))
        acc = 0 if head == 'Sum' else 1 if head == 'Product' else None
        env2 = dict(env)
        for k in range(lo, hi + 1):
            env2[var] = k
            v = ev(body, env2, data, where)
            if head == 'Sum':
                acc += v
            elif head == 'Product':
                acc *= v
            elif head == 'MaxOver':
                acc = v if acc is None or v > acc else acc
            else:
                acc = v if acc is None or v < acc else acc
        return acc
    args = [ev(a, env, data, where) for a in e[1:]]
    if head == 'Add':
        return args[0] + args[1]
    if head == 'Subtract':
        return args[0] - args[1]
    if head == 'Multiply':
        return args[0] * args[1]
    if head == 'Divide':
        if args[1] == 0:
            raise Refuse('division-by-zero', where)
        q = Fraction(args[0]) / Fraction(args[1])
        return int(q) if q.denominator == 1 else q
    if head == 'Abs':
        return abs(args[0])
    if head == 'Square':
        return args[0] * args[0]
    if head == 'Power':
        n = as_int(args[1], where + '.Power')
        if args[0] == 0 and n < 0:
            raise Refuse('division-by-zero', where + '.Power')
        q = Fraction(args[0]) ** n
        return int(q) if q.denominator == 1 else q
    if head == 'Min':
        return min(args)
    if head == 'Max':
        return max(args)
    if head == 'Kronecker':
        return 1 if args[0] == args[1] else 0
    raise AssertionError('not exact: ' + head)


# ---- typed data ------------------------------------------------------------------------------------------------------
def decode_data(spec, path, where):
    """spec = {select, elements, shape}; returns (nested lists of Fractions, {shape symbol: size})"""
    need(spec, ('select', 'elements', 'shape'), (), where)
    if spec['elements'] not in ELEMENTS:
        raise Refuse('data', where + ': elements must be one of ' + ', '.join(ELEMENTS))
    if not isinstance(spec['shape'], list) or not spec['shape'] or any(not isinstance(s, str) or not SYM.match(s) for s in spec['shape']) or len(set(spec['shape'])) != len(spec['shape']):
        raise Refuse('data', where + ': shape must be a list of distinct symbols, one per dimension')
    with open(path, 'rb') as f:
        try:
            doc = json.loads(f.read().decode('utf-8'))
        except (ValueError, UnicodeDecodeError) as e:
            raise Refuse('data', where + ': the pinned bytes are not JSON (' + str(e)[:60] + ')')
    cur = doc
    for k in str(spec['select']).split('.'):
        if isinstance(cur, list) and INT.match(k):
            k = int(k)
            if k < 0 or k >= len(cur):
                raise Refuse('data', where + ': select index ' + str(k) + ' out of range')
            cur = cur[k]
        elif isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            raise Refuse('data', where + ': select ' + spec['select'] + ' does not resolve')
    sizes = {}

    def conv(x, depth, w):
        if depth == len(spec['shape']):
            if spec['elements'] == 'doubles':
                if isinstance(x, bool) or not isinstance(x, (int, float)):
                    raise Refuse('data', w + ': not a JSON number')
                return exact_of(x)
            if spec['elements'] == 'integers':
                if isinstance(x, bool) or not isinstance(x, int):
                    raise Refuse('data', w + ': not a JSON integer')
                return x
            if not isinstance(x, str) or not RAT.match(x):
                raise Refuse('data', w + ': not a rational string')
            return exact_of(x)
        if not isinstance(x, list):
            raise Refuse('data', w + ': expected a list at depth ' + str(depth))
        name = spec['shape'][depth]
        if name in sizes and sizes[name] != len(x):
            raise Refuse('data', w + ': ' + name + ' is ' + str(sizes[name]) + ' elsewhere, ' + str(len(x)) + ' here (not rectangular)')
        sizes[name] = len(x)
        return [conv(y, depth + 1, w + '[' + str(i) + ']') for i, y in enumerate(x)]
    return conv(cur, 0, where), sizes


# ---- the record ------------------------------------------------------------------------------------------------
def get_path(obj, dotted):
    cur = obj
    for k in dotted.split('.'):
        if not isinstance(cur, dict) or k not in cur:
            return None
        cur = cur[k]
    return cur


def record_value(v, where):
    if isinstance(v, str) and RAT.match(v):
        return ('exact', Fraction(v))
    if isinstance(v, list) and len(v) == 2 and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
        lo, hi = Fraction(v[0]), Fraction(v[1])
        if lo > hi:
            raise Refuse('record-value', where + ': enclosure with lo > hi')
        return ('enclosure', (lo, hi))
    raise Refuse('record-value', where + ': ' + repr(v)[:80])


BAR_IN_CLAIM = re.compile(r'-?\d+\.\d+')
REL_IN_CLAIM = re.compile(r'(<=|>=|≤|≥|<|>|=)')
REL_WORD = {'<=': 'le', '≤': 'le', '>=': 'ge', '≥': 'ge', '<': 'lt', '>': 'gt', '=': 'eq'}


def decide(value, rel, c):
    """the one predicate of instruments/verdict.js, over an exact value or an enclosure (bar thin); 'in' and 'eq' as
    Definition 2's exact cases. Every line is the inclusion property read once."""
    C, R, F = WORDS
    kind, v = value
    v = Fraction(v) if kind == 'exact' else v
    lo, hi = (v, v) if kind == 'exact' else v
    if rel == 'in':
        blo, bhi = c
        if blo <= lo and hi <= bhi:
            return C
        if hi < blo or lo > bhi:
            return R
        return F
    if rel == 'eq':
        if kind == 'exact':
            return C if v == c else R
        return R if (hi < c or lo > c) else F
    if rel == 'lt':
        return C if hi < c else (R if lo >= c else F)
    if rel == 'le':
        return C if hi <= c else (R if lo > c else F)
    if rel == 'gt':
        return C if lo > c else (R if hi <= c else F)
    if rel == 'ge':
        return C if lo >= c else (R if hi < c else F)
    raise AssertionError(rel)


def compose(words):
    C, R, F = WORDS
    if R in words:
        return R
    if F in words:
        return F
    return C


# ---- deciding from the object -----------------------------------------------------------------------------------------
def decide_from_object(p, env0, data, where):
    """p: a parsed predicate with exact g; returns {'word', 'witness', 'violations', 'value'}"""
    C, R, F = WORDS
    if not p['forall']:
        v = ev(p['g'], env0, data, where)
        return {'word': decide(('exact', v), p['rel'], p['c']), 'witness': None, 'violations': None, 'value': v}
    violations = 0
    witness = None
    env = dict(env0)

    def loop(k):
        nonlocal violations, witness
        if k == len(p['forall']):
            v = ev(p['g'], env, data, where)
            w = decide(('exact', v), p['rel'], p['c'])
            if w != C:
                violations += 1
                if witness is None:
                    witness = {'at': {var: int(env[var]) for var, _, _ in p['forall']}, 'value': str(v)}
            return
        var, lo_e, hi_e = p['forall'][k]
        lo, hi = as_int(ev(lo_e, env, data, where), where + '.forall'), as_int(ev(hi_e, env, data, where), where + '.forall')
        for i in range(lo, hi + 1):
            env[var] = i
            loop(k + 1)
        env.pop(var, None)
    loop(0)
    return {'word': R if violations else C, 'witness': witness, 'violations': violations, 'value': None}


# ---- the check -------------------------------------------------------------------------------------------------
def check_obj(o, root=ROOT):
    """returns {'word': ADMITTED|REFUSED, 'kind', 'msg', 'id', 'decided': [...], 'fromObject': [...], 'notes': [...]}"""
    out = {'word': REFUSED_WORD, 'kind': None, 'msg': '', 'id': o.get('id') if isinstance(o, dict) else None, 'decided': [], 'fromObject': [], 'notes': [], 'seconds': 0.0}
    t0 = time.time()
    try:
        need(o, TOP, TOP_OPTIONAL, 'the object')
        if not isinstance(o['id'], str) or not o['id'].strip():
            raise Refuse('schema', 'id must be a non-empty string')
        if not isinstance(o['text'], str) or not o['text'].strip():
            raise Refuse('schema', 'text must be a non-empty string')
        if o['reading'] not in READINGS:
            raise Refuse('reading', repr(o['reading']))
        if not isinstance(o['reference'], str) or not o['reference'].strip():
            raise Refuse('reference', 'reference is empty')
        str_list(o['hypotheses'], 'hypotheses', True)
        str_list(o['falsifier'], 'falsifier', False)
        if 'notes' in o:
            str_list(o['notes'], 'notes', True)

        # the source and its quote
        s = o['source']
        need(s, ('what', 'path', 'sha256', 'quote'), (), 'source')
        src_path = pinned({'path': s['path'], 'sha256': s['sha256']}, 'source', root)
        if not isinstance(s['quote'], str) or not s['quote'].strip():
            raise Refuse('schema', 'source.quote must be a non-empty string')
        with open(src_path, 'rb') as f:
            src_text = f.read().decode('utf-8', 'replace')
        if s['quote'] not in src_text:
            raise Refuse('quote-not-verbatim', s['path'])

        # the domain
        d = o['domain']
        if not isinstance(d, dict) or d.get('kind') not in ('finite', 'box'):
            raise Refuse('schema', 'domain.kind must be finite or box')
        symbols = set()
        box_symbols = set()
        env0 = {}
        data = None
        data_sym = None
        if d['kind'] == 'finite':
            need(d, ('kind', 'pin', 'decoder', 'count', 'variable'), ('data',), 'domain')
            dpath = pinned(d['pin'], 'domain.pin', root)
            if not isinstance(d['count'], int) or isinstance(d['count'], bool) or d['count'] < 1:
                raise Refuse('schema', 'domain.count must be a positive integer')
            if not isinstance(d['decoder'], str) or not d['decoder'].strip():
                raise Refuse('schema', 'domain.decoder must say how the bytes are read')
            if not isinstance(d['variable'], str) or not SYM.match(d['variable']):
                raise Refuse('schema', 'domain.variable must be a symbol')
            symbols.add(d['variable'])
            if 'data' in d:
                data, sizes = decode_data(d['data'], dpath, 'domain.data')
                data_sym = d['variable']
                first = d['data']['shape'][0]
                if sizes.get(first) != d['count']:
                    raise Refuse('data', 'domain.count is ' + str(d['count']) + ', the decoded ' + first + ' is ' + str(sizes.get(first)))
                for name, size in sizes.items():
                    if name in symbols:
                        raise Refuse('data', 'shape symbol ' + name + ' collides')
                    symbols.add(name)
                    env0[name] = size
        else:
            need(d, ('kind', 'sides'), (), 'domain')
            if not isinstance(d['sides'], list) or not d['sides']:
                raise Refuse('schema', 'domain.sides must be a non-empty list')
            for i, side in enumerate(d['sides']):
                w = 'domain.sides[' + str(i) + ']'
                need(side, ('name', 'lo', 'hi', 'source'), (), w)
                if not isinstance(side['name'], str) or not SYM.match(side['name']) or side['name'] in symbols:
                    raise Refuse('schema', w + ': name must be a fresh symbol')
                if side['lo'] in ('inf', '-inf') or side['hi'] in ('inf', '-inf'):
                    raise Refuse('unbounded', w)
                lo, hi = rational(side['lo'], w + '.lo'), rational(side['hi'], w + '.hi')
                if lo > hi:
                    raise Refuse('box-order', w + ': ' + side['lo'] + ' > ' + side['hi'])
                if not isinstance(side['source'], str) or not side['source'].strip():
                    raise Refuse('schema', w + ': every side carries the source of its bounds')
                symbols.add(side['name'])
                box_symbols.add(side['name'])

        # the predicate
        P = o['predicate']
        if not isinstance(P, list) or not P:
            raise Refuse('schema', 'predicate must be a non-empty list')
        preds = []
        for i, p in enumerate(P):
            w = 'predicate[' + str(i) + ']'
            need(p, ('g', 'rel'), ('printed', 'c', 'note', 'forall'), w)
            if p['rel'] not in RELS:
                raise Refuse('schema', w + ': rel must be one of ' + ', '.join(RELS))
            bound = ()
            forall = []
            if 'forall' in p:
                if not isinstance(p['forall'], list) or not p['forall']:
                    raise Refuse('schema', w + ': forall is a non-empty list of [var, lo, hi]')
                for q in p['forall']:
                    if not isinstance(q, list) or len(q) != 3 or not isinstance(q[0], str) or not SYM.match(q[0]) or q[0] in symbols or q[0] in bound:
                        raise Refuse('schema', w + ': each forall entry is [a fresh symbol, lo, hi]')
                    walk(q[1], symbols, w + '.forall.lo', root, data_sym, bound)
                    walk(q[2], symbols, w + '.forall.hi', root, data_sym, bound)
                    bound = bound + (q[0],)
                    forall.append((q[0], q[1], q[2]))
            exact = walk(p['g'], symbols, w + '.g', root, data_sym, bound)
            if p['rel'] == 'holds':
                if not isinstance(p['g'], dict) or 'printed' in p or 'c' in p or forall:
                    raise Refuse('schema', w + ': "holds" takes a named exact predicate and no bar')
                preds.append({'rel': 'holds', 'exact': False, 'forall': [], 'g': p['g']})
                continue
            if 'c' not in p:
                raise Refuse('schema', w + ': an inequality carries c')
            if 'printed' in p:
                pr = printed_rational(p['printed'], w)
                if p['printed'] not in s['quote']:
                    raise Refuse('printed-not-in-quote', w + ': ' + p['printed'])
            elif p['c'] != '0' or p['rel'] == 'in':
                raise Refuse('schema', w + ': a bar the claimant printed must carry printed; only the zero of a structural inequality may omit it')
            else:
                pr = Fraction(0)
            if p['rel'] == 'in':
                if not isinstance(p['c'], list) or len(p['c']) != 2:
                    raise Refuse('schema', w + ': "in" takes c = [lo, hi]')
                lo, hi = rational(p['c'][0], w + '.c[0]'), rational(p['c'][1], w + '.c[1]')
                if lo > hi:
                    raise Refuse('box-order', w + '.c')
                if (lo, hi) != printed_box(p['printed']):
                    raise Refuse('printed-mismatch', w + ': c is not the box the digits of ' + p['printed'] + ' allow')
                preds.append({'rel': 'in', 'c': (lo, hi), 'printed': p['printed'], 'exact': exact, 'forall': forall, 'g': p['g']})
            else:
                c = rational(p['c'], w + '.c')
                if c != pr:
                    raise Refuse('printed-mismatch', w + ': c = ' + p['c'] + ' is not the rational of ' + str(p.get('printed')))
                preds.append({'rel': p['rel'], 'c': c, 'printed': p.get('printed'), 'exact': exact, 'forall': forall, 'g': p['g']})

        # decisions from the object: every exact predicate over bound symbols, with its witness. A box side's symbol is
        # not a value (a box is decided by an interval cover, not evaluated at a point), so a predicate that names one
        # is admitted and left to the record.
        def uses(e, names):
            if isinstance(e, str):
                return e in names
            if isinstance(e, list):
                return any(uses(x, names) for x in e[1:])
            if isinstance(e, dict):
                return any(uses(x, names) for x in e.get('args', []))
            return False
        from_object = []
        for i, p in enumerate(preds):
            if p['rel'] == 'holds' or not p['exact'] or uses(p['g'], box_symbols):
                from_object.append(None)
                if p['rel'] != 'holds':
                    out['notes'].append('predicate[' + str(i) + '] not decided from the object: ' + ('a box variable (the interval decider\'s)' if p['rel'] != 'holds' and p['exact'] and uses(p['g'], box_symbols) else 'a transcendental or named head'))
                continue
            if any(isinstance(x, list) and (x[0] == 'Index' or x[0] in QUANT) for x in [p['g']]) and data is None and p['forall']:
                raise Refuse('vocabulary', 'predicate[' + str(i) + ']: a forall over indices needs a typed data block')
            res = decide_from_object(p, env0, data, 'predicate[' + str(i) + '].g')
            res['value'] = str(res['value']) if res['value'] is not None else None
            from_object.append(res)
        out['fromObject'] = from_object

        # the record, read-only: the verdict word, the bar, and the value re-decided
        if 'record' in o:
            r = o['record']
            need(r, ('path', 'row', 'value', 'verdict'), (), 'record')
            rp = os.path.join(root, r['path'])
            if not os.path.isfile(rp):
                raise Refuse('record-missing', r['path'])
            with open(rp, encoding='utf-8') as f:
                rec = json.load(f)
            if r['row'] is None:
                row = rec
            else:
                rows = rec.get('rows') if isinstance(rec, dict) else None
                row = next((x for x in (rows or []) if isinstance(x, dict) and x.get('id') == r['row']), None)
                if row is None:
                    raise Refuse('record-row-missing', r['path'] + ' row ' + str(r['row']))
            rv = row.get('verdict')
            if rv not in WORDS:
                raise Refuse('record-verdict-word', 'the record says ' + repr(rv))
            if r['verdict'] != rv:
                raise Refuse('record-verdict-word', 'the object declares ' + repr(r['verdict']) + ', the record says ' + rv)
            value = record_value(get_path(row, r['value']), 'record.value ' + str(r['value'])) if r['value'] is not None else None
            claim_str = str(row.get('claim', ''))
            m = BAR_IN_CLAIM.search(claim_str)
            rec_bar = Fraction(m.group(0)) if m else None
            mr = REL_IN_CLAIM.search(claim_str)
            rec_rel = REL_WORD.get(mr.group(0)) if mr else None
            decided = []
            for i, p in enumerate(preds):
                if p['rel'] == 'holds':
                    decided.append(rv)
                    continue
                if p['rel'] != 'in' and p['printed'] is not None and rec_bar is not None and rec_bar != p['c']:
                    raise Refuse('record-bar-mismatch', 'the record decided ' + m.group(0) + ', the object states ' + p['printed'])
                if p['rel'] != 'in' and p['printed'] is not None and rec_rel is not None and rec_rel != p['rel']:
                    out['notes'].append('the record\'s claim prints the relation ' + mr.group(0) + ', the object states ' + p['rel'] + '; the decision below is under the object\'s')
                fo = from_object[i]
                if value is not None:
                    dv = decide(value, p['rel'], p['c'])
                    if fo is not None and fo['value'] is not None and value[0] == 'exact' and Fraction(fo['value']) != value[1]:
                        raise Refuse('record-value-mismatch', 'the object gives ' + fo['value'][:40] + '…, the record holds ' + str(value[1])[:40] + '…')
                    if fo is not None and fo['word'] != dv:
                        raise Refuse('record-decision-mismatch', 'from the object ' + fo['word'] + ', from the record\'s value ' + dv)
                    decided.append(dv)
                elif fo is not None:
                    decided.append(fo['word'])
                else:
                    decided.append(rv)
            composed = compose(decided)
            if composed != rv:
                raise Refuse('record-decision-mismatch', 'the re-decision gives ' + composed + ', the record says ' + rv)
            out['decided'] = decided

            if 'repair' in o:
                rep = o['repair']
                need(rep, ('printed', 'c', 'verdict', 'how'), (), 'repair')
                ineq = [p for p in preds if p['rel'] not in ('holds', 'in')]
                if len(ineq) != 1:
                    raise Refuse('repair', 'a repair needs exactly one inequality predicate')
                if rep['verdict'] not in WORDS:
                    raise Refuse('repair', 'verdict ' + repr(rep['verdict']))
                pr = printed_rational(rep['printed'], 'repair')
                c = rational(rep['c'], 'repair.c')
                if c != pr:
                    raise Refuse('repair', 'c is not the rational of ' + rep['printed'])
                rrep = row.get('repair') if isinstance(row.get('repair'), dict) else None
                if rrep is None or rep['printed'] not in str(rrep.get('claim', '')):
                    raise Refuse('repair', 'the record holds no repair printing ' + rep['printed'])
                src_value = value if value is not None else (('exact', Fraction(from_object[preds.index(ineq[0])]['value'])) if from_object[preds.index(ineq[0])] and from_object[preds.index(ineq[0])]['value'] else None)
                if src_value is None:
                    raise Refuse('repair', 'no value to re-decide the repair against')
                dv = decide(src_value, ineq[0]['rel'], c)
                if dv != rep['verdict']:
                    raise Refuse('repair', 'the value re-decided against the repaired bar gives ' + dv + ', the object says ' + rep['verdict'])
                out['decided'].append('repair:' + dv)
        elif 'repair' in o:
            raise Refuse('repair', 'a repair needs a record')
        else:
            out['notes'].append('no record attached' + ('' if any(from_object) else ': a proposal, undecided'))

        out['word'] = ADMITTED
        return out
    except Refuse as e:
        out['kind'], out['msg'] = e.kind, e.msg
        return out
    finally:
        out['seconds'] = round(time.time() - t0, 3)


def check(path, root=ROOT):
    with open(path, encoding='utf-8') as f:
        o = json.load(f)
    res = check_obj(o, root)
    if res['word'] == ADMITTED and res['id'] != os.path.splitext(os.path.basename(path))[0]:
        res['notes'].append('the file name is not the id')
    return res


# ---- SMT-LIB export (exact class only) --------------------------------------------------------------------------------
def smt_lit(q):
    q = Fraction(q)
    s = str(abs(q.numerator)) + '.0' if q.denominator == 1 else '(/ ' + str(abs(q.numerator)) + '.0 ' + str(q.denominator) + '.0)'
    return '(- ' + s + ')' if q < 0 else s


def smt_expr(e, env, data):
    """unrolls an exact expression to an SMT-LIB term; bound variables are integers known at unroll time"""
    if isinstance(e, str):
        return smt_lit(Fraction(e)) if RAT.match(e) else smt_lit(env[e])
    head = e[0]
    if head == 'Index':
        return smt_lit(ev(e, env, data))
    if head in QUANT:
        var, lo, hi, body = e[1], as_int(ev(e[2], env, data), 'smt'), as_int(ev(e[3], env, data), 'smt'), e[4]
        terms = []
        env2 = dict(env)
        for k in range(lo, hi + 1):
            env2[var] = k
            terms.append(smt_expr(body, env2, data))
        if head == 'Sum':
            return '(+ ' + ' '.join(terms) + ')' if terms else '0.0'
        if head == 'Product':
            return '(* ' + ' '.join(terms) + ')' if terms else '1.0'
        if not terms:
            raise Refuse('empty-range', 'smt: ' + head)
        # each term is NAMED (define-fun) so that the ite chain stays linear: an inline chain repeats the accumulator
        # at every level and grows as 2^k (found 2026-10-20: the 599-knot maximum of C_1d never finished exporting)
        op = '>=' if head == 'MaxOver' else '<='
        names = []
        for t in terms:
            nm = 'q' + str(len(SMT_DEFS))
            SMT_DEFS.append('(define-fun ' + nm + ' () Real ' + t + ')')
            names.append(nm)
        acc = names[0]
        for nm in names[1:]:
            nxt = 'q' + str(len(SMT_DEFS))
            SMT_DEFS.append('(define-fun ' + nxt + ' () Real (ite (' + op + ' ' + acc + ' ' + nm + ') ' + acc + ' ' + nm + '))')
            acc = nxt
        return acc
    a = [smt_expr(x, env, data) for x in e[1:]]
    if head == 'Add':
        return '(+ ' + a[0] + ' ' + a[1] + ')'
    if head == 'Subtract':
        return '(- ' + a[0] + ' ' + a[1] + ')'
    if head == 'Multiply':
        return '(* ' + a[0] + ' ' + a[1] + ')'
    if head == 'Divide':
        return '(/ ' + a[0] + ' ' + a[1] + ')'
    if head == 'Abs':
        return '(ite (>= ' + a[0] + ' 0.0) ' + a[0] + ' (- ' + a[0] + '))'
    if head == 'Square':
        return '(* ' + a[0] + ' ' + a[0] + ')'
    if head == 'Power':
        n = as_int(ev(e[2], env, data), 'smt')
        if n < 0:
            return '(/ 1.0 ' + smt_expr(['Power', e[1], str(-n)], env, data) + ')'
        return '1.0' if n == 0 else '(* ' + ' '.join([a[0]] * n) + ')'
    if head == 'Min':
        return '(ite (<= ' + a[0] + ' ' + a[1] + ') ' + a[0] + ' ' + a[1] + ')'
    if head == 'Max':
        return '(ite (>= ' + a[0] + ' ' + a[1] + ') ' + a[0] + ' ' + a[1] + ')'
    if head == 'Kronecker':
        return smt_lit(ev(e, env, data))
    raise Refuse('vocabulary', 'smt: ' + head + ' is not exact')


SMT_DEFS = []
SMT_REL = {'le': '<=', 'lt': '<', 'ge': '>=', 'gt': '>', 'eq': '='}
SMT_NEG = {'le': '>', 'lt': '>=', 'ge': '<', 'gt': '<=', 'eq': 'distinct'}


def to_smt(o, root=ROOT):
    """the object's exact predicates, unrolled: asserts that SOME instance VIOLATES; sat = REFUTED, unsat = CERTIFIED"""
    res = check_obj(o, root)
    if res['word'] != ADMITTED:
        raise Refuse(res['kind'], res['msg'])
    d = o['domain']
    data, sizes = (decode_data(d['data'], os.path.join(root, d['pin']['path']), 'domain.data') if d.get('kind') == 'finite' and 'data' in d else (None, {}))
    env0 = dict(sizes)
    del SMT_DEFS[:]
    lines = ['; ' + o['id'] + ' — ' + o['text'].replace('\n', ' '), '; generated by instruments/box/check.py --smt; sat = some instance violates (REFUTED), unsat = every instance holds (CERTIFIED)', '(set-logic QF_NRA)']
    disj = []
    for i, p in enumerate(o['predicate']):
        if p['rel'] in ('holds', 'in') or 'forall' in p and not all(isinstance(q, list) for q in p['forall']):
            continue
        rel = p['rel']
        c = Fraction(p['c'])
        if 'forall' not in p:
            disj.append('(' + SMT_NEG[rel] + ' ' + smt_expr(p['g'], env0, data) + ' ' + smt_lit(c) + ')')
            continue
        env = dict(env0)

        def loop(k):
            if k == len(p['forall']):
                disj.append('(' + SMT_NEG[rel] + ' ' + smt_expr(p['g'], env, data) + ' ' + smt_lit(c) + ')')
                return
            var, lo_e, hi_e = p['forall'][k]
            lo, hi = as_int(ev(lo_e, env, data), 'smt'), as_int(ev(hi_e, env, data), 'smt')
            for j in range(lo, hi + 1):
                env[var] = j
                loop(k + 1)
            env.pop(var, None)
        loop(0)
    if not disj:
        raise Refuse('vocabulary', 'nothing in the exact class to export')
    lines.extend(SMT_DEFS)
    lines.append('(assert ' + (disj[0] if len(disj) == 1 else '(or ' + ' '.join(disj) + ')') + ')')
    lines.append('(check-sat)')
    return '\n'.join(lines) + '\n'


def run(argv):
    global WORDS
    WORDS = load_vocab()
    if '--kinds' in argv:
        for k, v in KINDS.items():
            print(k.ljust(26) + v)
        return 0
    paths = [a for a in argv if not a.startswith('--')]
    if '--smt' in argv:
        if len(paths) != 1:
            die('--smt takes one object')
        with open(paths[0], encoding='utf-8') as f:
            o = json.load(f)
        try:
            sys.stdout.write(to_smt(o))
        except Refuse as e:
            die('smt export: ' + e.kind + ': ' + e.msg)
        return 0
    if not paths:
        print(__doc__)
        return 2
    bad = 0
    for p in paths:
        res = check(p)
        if res['word'] == ADMITTED:
            fo = [x for x in res['fromObject'] if x]
            fos = ' · '.join(x['word'] + (' (witness ' + json.dumps(x['witness']['at']) + ', ' + str(x['violations']) + ' violating)' if x['witness'] else '') + (' value ' + x['value'][:30] + ('…' if len(x['value']) > 30 else '') if x['value'] else '') for x in fo)
            print('ADMITTED  ' + str(res['id']) + '  [' + ' · '.join(res['decided']) + ']' + ('  from the object: ' + fos if fos else '') + '  ' + str(res['seconds']) + ' s' + ''.join('  note: ' + n for n in res['notes']))
        else:
            bad += 1
            print('REFUSED   ' + str(res['id']) + '  ' + str(res['kind']) + ': ' + res['msg'])
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(run(sys.argv[1:]))
