#!/usr/bin/env python3
"""instruments/box/check.py — the checker of declared claims (version 1, 2026-10-20). Standard library only.

WHAT A DECLARED CLAIM IS. The method paper's Definition 2 read as a file: a domain B (a finite set of pinned
bytes, or a box with rational sides and a source per side), a predicate — a conjunction of relations
g_j(x) REL c_j over a closed vocabulary of functions — the reading (universal or epistemic), the sentence as
the source prints it, the reference (what the number is about), the hypotheses taken from the literature,
the falsifier, and the record that decided it. SCHEMA.md beside this file is the specification; the ten
objects in claims/ are the first corpus.

WHAT THIS CHECKER DECIDES, AND WHAT IT CANNOT. It decides well-formedness, and only that: every number is a
rational or a declared box (a JSON number is a double and is refused; a printed decimal is refused until it
is written as the rational its digits mean, or the box its digits allow); every pin resolves and hashes;
the quoted sentence is byte for byte in the pinned source; the printed bar is in the quote and the exact
bar c is the rational of the printed digits; every function head is in the vocabulary, with its arity;
the reading and the falsifier are declared; the record exists, its verdict is one of the three words, its
bar is the object's bar, and the record's exact value or enclosure, re-decided here against the object's
bar, gives the record's verdict. It does NOT decide whether the predicate is what the sentence means: that
is a reading, done twice and compared (version 3), never a verdict of this program.

THE VOCABULARY IS READ, NOT TYPED. Each head maps to an operation of the interval kernel, and the checker
refuses to run unless certs/kernel-arb-audit.json holds that operation (the kernel's comparison with Arb);
the three verdict words are read from instruments/verdict.js. A rule written here a second time would
diverge from the one in the module; so it is read.

THE OUTCOME WORDS. ADMITTED or REFUSED with one kind from the closed list KINDS. ADMITTED certifies
nothing: it says the object can be handed to a decider.

usage: python3 instruments/box/check.py instruments/box/claims/*.json      one line per object; exit 1 if any REFUSED
       python3 instruments/box/check.py --kinds                             the refusal kinds and their meanings
MIT"""
import hashlib
import json
import os
import re
import sys
from fractions import Fraction

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ARB = os.path.join(ROOT, 'certs', 'kernel-arb-audit.json')
VERDICT_JS = os.path.join(ROOT, 'instruments', 'verdict.js')

ADMITTED = 'ADMITTED'
REFUSED_WORD = 'REFUSED'

# head -> (arity, the kernel operation it names in certs/kernel-arb-audit.json byOp). The heads are
# MathJSON's where MathJSON has them (Add, Subtract, Multiply, Divide, Abs, Square, Power, Exp, Ln, Sin,
# Cos, Tanh, LogGamma); the special functions are the kernel's own names. Nothing outside the audited list.
VOCAB = {
    'Add': (2, 'add'), 'Subtract': (2, 'sub'), 'Multiply': (2, 'mul'), 'Divide': (2, 'div'),
    'Abs': (1, 'abs'), 'Square': (1, 'sqr'), 'Power': (2, 'pow'), 'Exp': (1, 'exp'), 'Ln': (1, 'log'),
    'Sin': (1, 'sin'), 'Cos': (1, 'cos'), 'Tanh': (1, 'tanh'),
    'LogGamma': (1, 'lgamma'), 'Digamma': (1, 'digamma'), 'Trigamma': (1, 'trigamma'),
    'GammaP': (2, 'gammaP'), 'Phi': (1, 'Phi'),
}
RELS = ('le', 'lt', 'ge', 'gt', 'eq', 'in', 'holds')
READINGS = ('universal', 'epistemic')
TOP = ('id', 'text', 'source', 'reading', 'domain', 'predicate', 'reference', 'hypotheses', 'falsifier', 'record')
TOP_OPTIONAL = ('repair', 'notes')

KINDS = {
    'schema': 'a field missing, unknown or of the wrong shape',
    'json-number': 'a JSON number where a value is expected: a JSON number is a double; write the rational as a string',
    'decimal-literal': 'a decimal string where a rational is expected: write the rational its digits mean (p/q), or declare the box its digits allow with rel "in"',
    'rational': 'a string that is not a rational p/q',
    'box-order': 'a box side with lo > hi',
    'unbounded': 'a box side with an infinite end (version 1 admits finite sides only)',
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
    'record-missing': 'the deciding record is not on disk',
    'record-row-missing': 'the deciding record has no row of that id',
    'record-verdict-word': 'the record\'s verdict is not one of the three words, or the object declares another',
    'record-value': 'the record\'s value is neither an exact rational nor an enclosure of two numbers',
    'record-bar-mismatch': 'the record decided a bar other than the object\'s',
    'record-decision-mismatch': 'the record\'s value re-decided against the object\'s bar does not give the record\'s verdict',
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
    """refuses to run unless every head's kernel operation is in the Arb audit and the three words are in verdict.js"""
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
    """the exact rational the printed digits mean"""
    if not isinstance(s, str) or not (DEC.match(s) or INT.match(s)):
        raise Refuse('schema', where + ' (printed) must be the digits as printed, e.g. "1.4630715826075594"')
    return Fraction(s)


def printed_box(s):
    """the box the printed digits allow: half a unit of the last printed digit either way"""
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


# ---- expressions ------------------------------------------------------------------------------------------------
def walk(e, symbols, where, root):
    if isinstance(e, bool) or isinstance(e, (int, float)):
        raise Refuse('json-number', where + ': ' + repr(e))
    if isinstance(e, str):
        if RAT.match(e):
            return
        if DEC.match(e):
            raise Refuse('decimal-literal', where + ': ' + e)
        if SYM.match(e):
            if e in symbols:
                return
            raise Refuse('symbol', where + ': ' + e + ' is not declared by the domain')
        raise Refuse('schema', where + ': unreadable token ' + repr(e))
    if isinstance(e, list):
        if not e or not isinstance(e[0], str):
            raise Refuse('schema', where + ': an expression list starts with its head')
        head = e[0]
        if head not in VOCAB:
            raise Refuse('vocabulary', where + ': ' + head)
        arity = VOCAB[head][0]
        if len(e) - 1 != arity:
            raise Refuse('arity', where + ': ' + head + ' takes ' + str(arity) + ', given ' + str(len(e) - 1))
        for i, a in enumerate(e[1:]):
            walk(a, symbols, where + '.' + head + '[' + str(i) + ']', root)
        return
    if isinstance(e, dict):
        need(e, ('named', 'where', 'args'), (), where + ' (named)')
        if not isinstance(e['named'], str) or not e['named'].strip():
            raise Refuse('schema', where + ': named must be a non-empty string')
        if not isinstance(e['where'], str) or not os.path.isfile(os.path.join(root, e['where'])):
            raise Refuse('named', where + ': ' + str(e.get('where')))
        if not isinstance(e['args'], list):
            raise Refuse('schema', where + ': args must be a list')
        for i, a in enumerate(e['args']):
            walk(a, symbols, where + '.args[' + str(i) + ']', root)
        return
    raise Refuse('schema', where + ': unreadable expression')


# ---- the record ------------------------------------------------------------------------------------------------
def get_path(obj, dotted):
    cur = obj
    for k in dotted.split('.'):
        if not isinstance(cur, dict) or k not in cur:
            return None
        cur = cur[k]
    return cur


def record_value(v, where):
    """('exact', Fraction) for a rational string; ('enclosure', (lo, hi)) for two numbers, converted exactly"""
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


# ---- the check -------------------------------------------------------------------------------------------------
def check_obj(o, root=ROOT):
    """returns {'word': ADMITTED|REFUSED, 'kind', 'msg', 'id', 'decided': [...], 'notes': [...]}"""
    out = {'word': REFUSED_WORD, 'kind': None, 'msg': '', 'id': o.get('id') if isinstance(o, dict) else None, 'decided': [], 'notes': []}
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
        if d['kind'] == 'finite':
            need(d, ('kind', 'pin', 'decoder', 'count', 'variable'), (), 'domain')
            pinned(d['pin'], 'domain.pin', root)
            if not isinstance(d['count'], int) or isinstance(d['count'], bool) or d['count'] < 1:
                raise Refuse('schema', 'domain.count must be a positive integer (declared, not decoded, in version 1)')
            if not isinstance(d['decoder'], str) or not d['decoder'].strip():
                raise Refuse('schema', 'domain.decoder must say how the bytes are read')
            if not isinstance(d['variable'], str) or not SYM.match(d['variable']):
                raise Refuse('schema', 'domain.variable must be a symbol')
            symbols.add(d['variable'])
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

        # the predicate
        P = o['predicate']
        if not isinstance(P, list) or not P:
            raise Refuse('schema', 'predicate must be a non-empty list')
        preds = []
        for i, p in enumerate(P):
            w = 'predicate[' + str(i) + ']'
            need(p, ('g', 'rel'), ('printed', 'c', 'note'), w)
            if p['rel'] not in RELS:
                raise Refuse('schema', w + ': rel must be one of ' + ', '.join(RELS))
            walk(p['g'], symbols, w + '.g', root)
            if p['rel'] == 'holds':
                if not isinstance(p['g'], dict) or 'printed' in p or 'c' in p:
                    raise Refuse('schema', w + ': "holds" takes a named exact predicate and no bar')
                preds.append({'rel': 'holds'})
                continue
            if 'printed' not in p or 'c' not in p:
                raise Refuse('schema', w + ': an inequality carries printed and c')
            pr = printed_rational(p['printed'], w)
            if p['printed'] not in s['quote']:
                raise Refuse('printed-not-in-quote', w + ': ' + p['printed'])
            if p['rel'] == 'in':
                if not isinstance(p['c'], list) or len(p['c']) != 2:
                    raise Refuse('schema', w + ': "in" takes c = [lo, hi]')
                lo, hi = rational(p['c'][0], w + '.c[0]'), rational(p['c'][1], w + '.c[1]')
                if lo > hi:
                    raise Refuse('box-order', w + '.c')
                if (lo, hi) != printed_box(p['printed']):
                    raise Refuse('printed-mismatch', w + ': c is not the box the digits of ' + p['printed'] + ' allow')
                preds.append({'rel': 'in', 'c': (lo, hi), 'printed': p['printed']})
            else:
                c = rational(p['c'], w + '.c')
                if c != pr:
                    raise Refuse('printed-mismatch', w + ': c = ' + p['c'] + ' is not the rational of ' + p['printed'])
                preds.append({'rel': p['rel'], 'c': c, 'printed': p['printed']})

        # the record, read-only: the verdict word, the bar, and the value re-decided
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
        value = record_value(get_path(row, r['value']), 'record.value ' + r['value'])
        claim_str = str(row.get('claim', ''))
        m = BAR_IN_CLAIM.search(claim_str)
        rec_bar = Fraction(m.group(0)) if m else None
        mr = REL_IN_CLAIM.search(claim_str)
        rec_rel = REL_WORD.get(mr.group(0)) if mr else None
        decided = []
        for p in preds:
            if p['rel'] == 'holds':
                decided.append(rv)
                continue
            if p['rel'] != 'in' and rec_bar is not None and rec_bar != p['c']:
                raise Refuse('record-bar-mismatch', 'the record decided ' + m.group(0) + ', the object states ' + p['printed'])
            if p['rel'] != 'in' and rec_rel is not None and rec_rel != p['rel']:
                out['notes'].append('the record\'s claim prints the relation ' + mr.group(0) + ', the object states ' + p['rel'] + '; the decision below is under the object\'s')
            decided.append(decide(value, p['rel'], p['c']))
        composed = compose(decided)
        if composed != rv:
            raise Refuse('record-decision-mismatch', 'the value re-decided gives ' + composed + ', the record says ' + rv)
        out['decided'] = decided

        # the repair, when the record carries one
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
            dv = decide(value, ineq[0]['rel'], c)
            if dv != rep['verdict']:
                raise Refuse('repair', 'the value re-decided against the repaired bar gives ' + dv + ', the object says ' + rep['verdict'])
            out['decided'].append('repair:' + dv)

        out['word'] = ADMITTED
        return out
    except Refuse as e:
        out['kind'], out['msg'] = e.kind, e.msg
        return out


def check(path, root=ROOT):
    with open(path, encoding='utf-8') as f:
        o = json.load(f)
    res = check_obj(o, root)
    if res['word'] == ADMITTED and res['id'] != os.path.splitext(os.path.basename(path))[0]:
        res['notes'].append('the file name is not the id')
    return res


def run(argv):
    global WORDS
    WORDS = load_vocab()
    if '--kinds' in argv:
        for k, v in KINDS.items():
            print(k.ljust(26) + v)
        return 0
    paths = [a for a in argv if not a.startswith('--')]
    if not paths:
        print(__doc__)
        return 2
    bad = 0
    for p in paths:
        res = check(p)
        if res['word'] == ADMITTED:
            print('ADMITTED  ' + str(res['id']) + '  [' + ' · '.join(res['decided']) + ']' + ''.join('  note: ' + n for n in res['notes']))
        else:
            bad += 1
            print('REFUSED   ' + str(res['id']) + '  ' + str(res['kind']) + ': ' + res['msg'])
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(run(sys.argv[1:]))
