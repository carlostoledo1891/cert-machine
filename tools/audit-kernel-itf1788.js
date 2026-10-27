#!/usr/bin/env node
/* audit-kernel-itf1788.js — the interval kernel run on ITF1788, the IEEE Std 1788-2015 interval test suite.

   WHY. The method paper admitted that no IEEE 1788 conformance suite had been run on the interval layer. The Arb audit
   (tools/audit-kernel-arb.js) compares the kernel with an independent library on seeded random and adversarial inputs;
   this is the other independent check: the hand-written test cases other people wrote for interval libraries
   (libieeep1788, FI_LIB, MPFI, C-XSC, and the IEEE 1788 examples), collected in ITF1788 (github.com/oheim/ITF1788,
   pinned at one commit in corpus/itf1788/), each one a statement "operation(inputs) = the tightest double interval".

   THE RULE. The kernel is not built to be tight, so a test is never failed for width. It is failed only for soundness:
   ITF1788's expected results are tightest enclosures, so ANY valid enclosure contains them, and a kernel result that
   does not contain the expected interval is a VIOLATION. Each test that runs is one of
     CONTAINED-TIGHT  the kernel returned exactly the expected interval
     CONTAINED        the kernel returned a wider interval that contains it
     REFUSED          the kernel threw (its domain is enforced by refusal; the reason class is recorded)
     VIOLATION        the kernel returned something that does not contain the expected result
   and a test the kernel cannot express is NOT-APPLICABLE, counted per file by reason and never run: decorations (and
   NaI), the empty set (the kernel has no empty interval, so an [empty] input or an [empty] expected result), reverse
   operations, set operations, operations the kernel does not have, binary32 literals, tests with no tightest result.
   Numeric and boolean functions the kernel exports with the IEEE meaning are scored by the direction their callers rely
   on: mag and wid are upper bounds (larger is CONTAINED), mig is a lower bound (smaller is CONTAINED), and subset,
   interior and isMember are proofs (a false where the suite says true is CONTAINED — a lost proof, never a wrong one;
   a true where the suite says false is a VIOLATION).

   LITERALS. Numbers are read exactly (decimal and hexadecimal) and rounded to the nearest double, ties to even — the
   meaning ITF1788's C++ back end gives them (a C double literal); the record counts the literals that are not exactly
   representable, so no verdict rests on a rounding nobody saw. Nothing from ITF1788 is executed: the .itl files are
   parsed here by a lexer that mirrors the grammar in corpus/itf1788/<sha8>/itf1788/dslparser.py.

   RED CONTROLS. Two planted wrong kernels must each produce violations on the suite, or the audit cannot go red:
   addition rounded to nearest with no outward step, and Math.exp at the ends taken as an enclosure.

   usage: node tools/audit-kernel-itf1788.js           the record, certs/kernel-itf1788.json (a few seconds)
          node tools/audit-kernel-itf1788.js --check   the battery: re-hash every pin, re-derive everything, compare with
                                                       the record; nothing written
   Exit 1 on a changed pin, a re-derivation that differs from the record, a red control that does not fire, or any
   VIOLATION not declared in DECLARED below (a violation found, reported and awaiting the lead session's kernel decision is
   declared in this source, never in the generated record). Stdlib only. MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const IV = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const TR = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const AL = require(path.join(ROOT, 'instruments', 'interval', 'algebraic.js'));
const CORPUS = path.join(ROOT, 'corpus', 'itf1788');
const PINS_PATH = path.join(CORPUS, 'PINS.json');
const OUT = path.join(ROOT, 'certs', 'kernel-itf1788.json');
const CHECK = process.argv.includes('--check');
const MODULES = ['instruments/interval/interval.js', 'instruments/interval/transcendental.js', 'instruments/interval/rational.js', 'instruments/interval/algebraic.js'];
const T0 = Date.now();
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/* ---- the pins: every byte read is the byte pinned ------------------------------------------------------------------ */
function verifyPins() {
  const raw = fs.readFileSync(PINS_PATH);
  const pins = JSON.parse(raw);
  const bad = [];
  const sub = pins.commit.slice(0, 8);
  for (const [k, p] of Object.entries(pins.files)) {
    const f = path.join(CORPUS, k);
    if (!fs.existsSync(f)) { bad.push(k + ': missing'); continue; }
    const b = fs.readFileSync(f);
    if (b.length !== p.bytes || sha256(b) !== p.sha256) bad.push(k + ': sha256 differs from the pin');
  }
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(CORPUS, sub))) { const k = path.relative(CORPUS, f).split(path.sep).join('/'); if (!pins.files[k]) bad.push(k + ': not pinned'); }
  const itl = Object.keys(pins.files).filter((k) => k.startsWith(sub + '/itl/') && k.endsWith('.itl')).sort();
  return { pins, bad, itl, pinsSha256: sha256(raw) };
}

/* ---- exact literals: a decimal or hexadecimal number as a rational, rounded to the nearest double, ties to even ---- */
const bitlen = (n) => (n === 0n ? 0 : n.toString(2).length);
const DV = new DataView(new ArrayBuffer(8));
function dblParts(x) {                       /* finite x >= 0 as m·2^e exactly */
  DV.setFloat64(0, x);
  const bits = DV.getBigUint64(0), ex = Number((bits >> 52n) & 0x7ffn), fr = bits & ((1n << 52n) - 1n);
  return ex === 0 ? [fr, -1074] : [fr | (1n << 52n), ex - 1075];
}
function ratToDouble(neg, n, d) {            /* n >= 0, d > 0 (BigInt) */
  if (n === 0n) return { v: neg ? -0 : 0, exact: true };
  const at = (e) => { const N = e >= 0 ? n : n << BigInt(-e), D = e >= 0 ? d << BigInt(e) : d; return [N / D, N % D, D]; };
  let e = bitlen(n) - bitlen(d) - 53, q, r, D;
  [q, r, D] = at(e);
  while (q >= 1n << 53n) [q, r, D] = at(++e);
  while (q < 1n << 52n) [q, r, D] = at(--e);
  if (e < -1074) { e = -1074; [q, r, D] = at(e); }
  const exact = r === 0n;
  if (2n * r > D || (2n * r === D && (q & 1n) === 1n)) q += 1n;
  if (q === 1n << 53n) { q = 1n << 52n; e++; }
  if (e + 52 > 1023) return { v: neg ? -Infinity : Infinity, exact: false };
  const v = Number(q) * 2 ** e;
  const [m2, e2] = dblParts(v);              /* self-check through the bits: v is q·2^e exactly */
  const k = Math.min(e, e2);
  if ((q << BigInt(e - k)) !== (m2 << BigInt(e2 - k))) throw new Error('ratToDouble: self-check failed');
  return { v: neg ? -v : v, exact };
}
function parseNumber(text) {                 /* FLOAT or INF token → { v, exact, type } */
  let s = text, type = 'double';
  const inf = /^([+-]?)infinity([FLfl]?)$/.exec(s);
  if (inf) return { v: inf[1] === '-' ? -Infinity : Infinity, exact: true, type: inf[2] ? (/[fF]/.test(inf[2]) ? 'float' : 'long_double') : 'double' };
  const neg = s[0] === '-';
  if (s[0] === '+' || s[0] === '-') s = s.slice(1);
  let m;
  if (/^0[xX]/.test(s)) {
    m = /^0[xX]([0-9a-fA-F]*)(?:\.([0-9a-fA-F]*))?[pP]([+-]?[0-9]+)([FLfl]?)$/.exec(s);
    if (!m) throw new Error('bad hex literal ' + text);
    const frac = m[2] || '', M = BigInt('0x' + ((m[1] || '') + frac || '0')), e = Number(m[3]) - 4 * frac.length;
    if (m[4]) type = /[fF]/.test(m[4]) ? 'float' : 'long_double';
    return { ...(e >= 0 ? ratToDouble(neg, M << BigInt(e), 1n) : ratToDouble(neg, M, 1n << BigInt(-e))), type };
  }
  m = /^([0-9]*)(?:\.([0-9]*))?(?:[eE]([+-]?[0-9]+))?([FLfl]?)$/.exec(s);
  if (!m) throw new Error('bad decimal literal ' + text);
  const frac = m[2] || '', M = BigInt((m[1] || '') + frac || '0'), e = Number(m[3] || 0) - frac.length;
  if (m[4]) type = /[fF]/.test(m[4]) ? 'float' : 'long_double';
  return { ...(e >= 0 ? ratToDouble(neg, M * 10n ** BigInt(e), 1n) : ratToDouble(neg, M, 10n ** BigInt(-e))), type };
}
function hex(x) {                            /* a double printed exactly, in ITL's own hexadecimal notation */
  if (typeof x === 'boolean') return String(x);
  if (typeof x !== 'number') return JSON.stringify(x);
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'infinity';
  if (x === -Infinity) return '-infinity';
  if (x === 0) return Object.is(x, -0) ? '-0x0p+0' : '0x0p+0';
  const s = x < 0 ? '-' : '', [m, e] = dblParts(Math.abs(x));
  if (m >= 1n << 52n) {
    const f = (m - (1n << 52n)).toString(16).padStart(13, '0').replace(/0+$/, ''), p = e + 52;
    return s + '0x1' + (f ? '.' + f : '') + 'p' + (p >= 0 ? '+' : '') + p;
  }
  return s + '0x0.' + m.toString(16).padStart(13, '0').replace(/0+$/, '') + 'p-1022';
}
const hexIv = (a) => (Array.isArray(a) ? '[' + a.map(hex).join(', ') + ']' : hex(a));

/* ---- the ITL lexer: the token regexes of dslparser.py, tried in its order (first match wins, as PLY's master regex) */
const SUF = '(?:[Uu][Ll]?|[Uu](?:LL|ll)|(?:LL|ll)[Uu]?|[Ll][Uu]?)';
const HX = '[0-9a-fA-F]+';
const RULES = [
  ['FLOAT', '[+-]?(?:0[xX](?:(?:' + HX + ')?\\.' + HX + '|' + HX + '\\.|' + HX + ')[pP][+-]?[0-9]+[FLfl]?|(?:[0-9]*\\.[0-9]+|[0-9]+\\.)(?:[eE][+-]?[0-9]+)?[FLfl]?|[0-9]+[eE][+-]?[0-9]+[FLfl]?)'],
  ['INT', '[+-]?(?:0[xX][0-9a-fA-F]+' + SUF + '?|0' + SUF + '?|[1-9][0-9]*' + SUF + '?)'],
  ['STRING', '"(?:[^\\\\\\n]|\\\\[\\s\\S])*?"'],
  ['INF', '[+-]?infinity[FLfl]?'],
  ['NAN', 'NaN[FLfl]?'],
  ['NAI', 'nai[FLfl]?'],
  ['EMPTY', 'empty[FLfl]?'],
  ['ENTIRE', 'entire[FLfl]?'],
  ['EXCEPTION', '(?:UndefinedOperation|PossiblyUndefinedOperation|InvalidOperand|IntvlPartOfNaI|IntvlOverflow)'],
  ['ID', '[a-zA-Z][a-zA-Z0-9_-]*'],
  ['COMMENT', '\\/\\*[\\s\\S]*?\\*\\/'],
  ['COMMENT', '\\/\\/[^\\n]*'],
  ['COMMENT', '#\\*[\\s\\S]*?\\*#'],
  ['COMMENT', '#[^\\n]*'],
  ['NEWLINE', '\\n+'],
  ['SPACE', '[ \\t]+']
].map(([t, re]) => [t, new RegExp(re, 'y')]);
const LITERAL_CHARS = '{};=<_[].,';
const RESERVED = { testcase: 'TESTCASE', trv: 'DEC', def: 'DEC', dac: 'DEC', com: 'DEC', ill: 'DEC', true: 'BOOL', false: 'BOOL', signal: 'SIGNAL' };
const OVERLAP = new Set(['bothEmpty', 'firstEmpty', 'secondEmpty', 'before', 'meets', 'overlaps', 'starts', 'containedBy', 'finishes', 'equals', 'finishedBy', 'contains', 'startedBy', 'overlappedBy', 'metBy', 'after']);
function lex(text, file) {
  const toks = [];
  let i = 0, line = 1;
  outer: while (i < text.length) {
    for (const [t, re] of RULES) {
      re.lastIndex = i;
      const m = re.exec(text);
      if (!m || m[0].length === 0) continue;
      const v = m[0];
      if (t !== 'COMMENT' && t !== 'NEWLINE' && t !== 'SPACE') {
        let type = t;
        if (t === 'ID') type = RESERVED[v] || (OVERLAP.has(v) ? 'OVERLAP' : 'ID');
        toks.push({ t: type, v, line, at: i, end: i + v.length });
      }
      line += (v.match(/\n/g) || []).length;
      i += v.length;
      continue outer;
    }
    if (LITERAL_CHARS.includes(text[i])) { toks.push({ t: text[i], v: text[i], line, at: i, end: i + 1 }); i++; continue; }
    throw new Error(file + ':' + line + ': illegal character ' + JSON.stringify(text[i]));
  }
  return toks;
}

/* ---- the ITL parser: testcase qualident { test* }, test = op literals [= literals] [<= literals] [signal E] ; ------ */
function parseItl(text, file) {
  const toks = lex(text, file);
  let i = 0;
  const peek = () => toks[i] || { t: 'EOF', v: '', line: -1 };
  const next = () => { const k = peek(); i++; return k; };
  const expect = (t) => { const k = next(); if (k.t !== t) throw new Error(file + ':' + k.line + ': expected ' + t + ', got ' + k.t + ' ' + JSON.stringify(k.v)); return k; };
  const number = () => { const k = next(); if (k.t !== 'FLOAT' && k.t !== 'INF') throw new Error(file + ':' + k.line + ': expected a number, got ' + JSON.stringify(k.v)); return { k: 'num', text: k.v, ...parseNumber(k.v) }; };
  const START = new Set(['[', 'INT', 'FLOAT', 'INF', 'STRING', 'BOOL', 'OVERLAP', 'DEC', 'NAN', '{']);
  function literal() {
    const k = next();
    switch (k.t) {
      case '[': {
        let L;
        const h = peek();
        if (h.t === 'EMPTY' || h.t === 'ENTIRE' || h.t === 'NAI') { next(); L = { k: h.t.toLowerCase(), type: /[fFlL]$/.test(h.v) ? 'float' : 'double' }; }
        else { const lo = number(); expect(','); const hi = number(); L = { k: 'iv', lo, hi }; }
        expect(']');
        if (peek().t === '_') { next(); L.dec = expect('DEC').v; }
        return L;
      }
      case 'INT': return { k: 'int', text: k.v };
      case 'FLOAT': case 'INF': return { k: 'num', text: k.v, ...parseNumber(k.v) };
      case 'STRING': return { k: 'str', text: k.v };
      case 'BOOL': return { k: 'bool', v: k.v === 'true' };
      case 'OVERLAP': return { k: 'overlap', text: k.v };
      case 'DEC': return { k: 'dec', text: k.v };
      case 'NAN': return { k: 'nan' };
      case '{': {
        const items = [];
        if (peek().t !== '}') {
          for (;;) { const e = peek(); if (e.t === 'NAN') { next(); items.push({ k: 'nan' }); } else items.push(number()); if (peek().t !== ',') break; next(); }
        }
        expect('}');
        return { k: 'array', items };
      }
      default: throw new Error(file + ':' + k.line + ': unexpected ' + JSON.stringify(k.v));
    }
  }
  const seq = () => { const out = []; while (START.has(peek().t)) out.push(literal()); return out; };
  const tests = [];
  while (peek().t !== 'EOF') {
    expect('TESTCASE');
    let name = expect('ID').v;
    while (peek().t === '.') { next(); name += '.' + expect('ID').v; }
    expect('{');
    do {
      const op = expect('ID');
      const inputs = seq();
      let tight = null, accurate = null, signal = null;
      if (peek().t === '=') { next(); tight = seq(); if (!tight.length) throw new Error(file + ':' + op.line + ': empty tightest output'); }
      if (peek().t === '<') { next(); expect('='); accurate = seq(); if (!accurate.length) throw new Error(file + ':' + op.line + ': empty accurate output'); }
      if (peek().t === 'SIGNAL') { next(); signal = expect('EXCEPTION').v; }
      if (!tight && !accurate) throw new Error(file + ':' + op.line + ': a test needs an output');
      const semi = expect(';');
      tests.push({ file, testcase: name, line: op.line, op: op.v, inputs, tight, accurate, signal, src: text.slice(op.at, semi.end).replace(/\s+/g, ' ') });
    } while (peek().t !== '}');
    expect('}');
  }
  return tests;
}

/* ---- the kernel, operation by operation, with the IEEE 1788 name it answers to --------------------------------------- */
const KOPS = {
  neg: { sig: ['iv'], out: 'iv', fn: 'interval.neg', f: (a) => IV.neg(a) },
  add: { sig: ['iv', 'iv'], out: 'iv', fn: 'interval.add', f: (a, b) => IV.add(a, b) },
  sub: { sig: ['iv', 'iv'], out: 'iv', fn: 'interval.sub', f: (a, b) => IV.sub(a, b) },
  mul: { sig: ['iv', 'iv'], out: 'iv', fn: 'interval.mul', f: (a, b) => IV.mul(a, b) },
  div: { sig: ['iv', 'iv'], out: 'iv', fn: 'interval.div', f: (a, b) => IV.div(a, b) },
  sqr: { sig: ['iv'], out: 'iv', fn: 'interval.sqr', f: (a) => IV.sqr(a) },
  sqrt: { sig: ['iv'], out: 'iv', fn: 'algebraic.sqrtInterval', f: (a) => AL.sqrtInterval(a) },
  pown: { sig: ['iv', 'int'], out: 'iv', fn: 'interval.pow', f: (a, n) => IV.pow(a, n) },
  abs: { sig: ['iv'], out: 'iv', fn: 'interval.abs', f: (a) => IV.abs(a) },
  exp: { sig: ['iv'], out: 'iv', fn: 'transcendental.exp', f: (a) => TR.exp(a) },
  log: { sig: ['iv'], out: 'iv', fn: 'transcendental.log', f: (a) => TR.log(a) },
  sin: { sig: ['iv'], out: 'iv', fn: 'transcendental.sin', f: (a) => TR.sin(a) },
  cos: { sig: ['iv'], out: 'iv', fn: 'transcendental.cos', f: (a) => TR.cos(a) },
  tanh: { sig: ['iv'], out: 'iv', fn: 'transcendental.tanh', f: (a) => TR.tanh(a) },
  mag: { sig: ['iv'], out: 'upper', fn: 'interval.mag', f: (a) => IV.mag(a) },
  mig: { sig: ['iv'], out: 'lower', fn: 'interval.mig', f: (a) => IV.mig(a) },
  wid: { sig: ['iv'], out: 'upper', fn: 'interval.width', f: (a) => IV.width(a) },
  subset: { sig: ['iv', 'iv'], out: 'proof', fn: 'interval.subset', f: (a, b) => IV.subset(a, b) },
  interior: { sig: ['iv', 'iv'], out: 'proof', fn: 'interval.interior', f: (a, b) => IV.interior(a, b) },
  isMember: { sig: ['num', 'iv'], out: 'proof', fn: 'interval.contains (arguments swapped)', f: (x, X) => IV.contains(X, x) }
};
/* the two planted wrong kernels (RED CONTROLS) — each refuses what the kernel refuses (NaN), and is wrong only in rounding */
const RED = {
  'red:add': { op: 'add', what: 'addition rounded to nearest, no outward step', f: (a, b) => { const r = [a[0] + b[0], a[1] + b[1]]; if (Number.isNaN(r[0]) || Number.isNaN(r[1])) throw new Error('indeterminate'); return r; } },
  'red:exp': { op: 'exp', what: 'Math.exp at the two ends taken as an enclosure', f: (a) => [Math.exp(a[0]), Math.exp(a[1])] }
};
/* DECLARED VIOLATIONS: found by this audit, reported, and not fixed here — a kernel change is the lead session's call (it
   forces re-derivation of every record that pins interval.js). Declared in this source, never in the generated record, so
   regenerating the record cannot launder a new violation: any violation not listed here fails the run. */
const DECLARED = {
  'libieeep1788_rec_bool.itl:139 isMember -infinity [entire] = false;': 'found 2026-10-27',
  'libieeep1788_rec_bool.itl:140 isMember infinity [entire] = false;': 'found 2026-10-27'
};
const DECLARED_WHY = 'interval.contains(a, x) answers a[0] <= x && x <= a[1], so ±∞ is a member of any interval with that infinite end; an IEEE 1788 interval holds reals only, so isMember(±∞, X) is false. The minimal fix is const contains = (a, x) => Number.isFinite(x) && a[0] <= x && x <= a[1]; no enclosure is affected.';
const DECORATION_OPS = new Set(['newDec', 'setDec', 'decorationPart', 'intervalPart', 'd-numsToInterval', 'd-textToInterval']);
const SET_OPS = new Set(['intersection', 'convexHull']);
const isReverse = (op) => /Rev(?:Bin|Ten|ToPair|1|2)?$/.test(op);
const NA_REASONS = ['decorations', 'reverse operation', 'set operation', 'not in the kernel', 'empty set', 'binary32 literal', 'no tightest result', 'signature'];

function notApplicable(t) {
  const lits = [...t.inputs, ...(t.tight || []), ...(t.accurate || [])];
  if (DECORATION_OPS.has(t.op) || lits.some((L) => L.dec || L.k === 'nai' || L.k === 'dec')) return 'decorations';
  if (isReverse(t.op)) return 'reverse operation';
  if (SET_OPS.has(t.op)) return 'set operation';
  const K = KOPS[t.op];
  if (!K) return 'not in the kernel';
  if (lits.some((L) => L.k === 'empty')) return 'empty set';
  if (lits.some((L) => (L.type && L.type !== 'double') || (L.k === 'iv' && (L.lo.type !== 'double' || L.hi.type !== 'double')))) return 'binary32 literal';
  if (!t.tight) return 'no tightest result';
  /* a number argument may be written as NaN; a number result may be written as an integer literal (mpfi: wid [-8.0, 0.0] = +8) */
  const fits = (L, s) => (s === 'iv' ? L.k === 'iv' || L.k === 'entire' : s === 'int' ? L.k === 'int' : s === 'num' ? L.k === 'num' || L.k === 'nan' : false);
  const outFits = (L) => (K.out === 'iv' ? L.k === 'iv' || L.k === 'entire' : K.out === 'proof' ? L.k === 'bool' : L.k === 'num' || L.k === 'int');
  if (t.inputs.length !== K.sig.length || !t.inputs.every((L, j) => fits(L, K.sig[j])) || t.tight.length !== 1 || !outFits(t.tight[0])) return 'signature';
  return null;
}
const value = (L) => {
  if (L.k === 'iv') return [L.lo.v, L.hi.v];
  if (L.k === 'entire') return [-Infinity, Infinity];
  if (L.k === 'num') return L.v;
  if (L.k === 'bool') return L.v;
  if (L.k === 'nan') return NaN;
  if (L.k === 'int') {
    const m = /^([+-]?)(0[xX][0-9a-fA-F]+|[0-9]+)[uUlL]*$/.exec(L.text), n = BigInt(m[2]);
    if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('int literal too large');
    return m[1] === '-' ? -Number(n) : Number(n);
  }
  throw new Error('no value for ' + L.k);
};
const inexact = (L) => (L.k === 'iv' ? !L.lo.exact || !L.hi.exact : L.k === 'num' ? !L.exact : false);

function classify(out, res, exp) {
  if (out === 'iv') {
    if (!Array.isArray(res) || res.length !== 2 || typeof res[0] !== 'number' || typeof res[1] !== 'number' || Number.isNaN(res[0]) || Number.isNaN(res[1]) || res[0] > res[1]) return 'violation';
    if (res[0] === exp[0] && res[1] === exp[1]) return 'tight';
    return res[0] <= exp[0] && exp[1] <= res[1] ? 'contained' : 'violation';
  }
  if (out === 'upper' || out === 'lower') {
    if (typeof res !== 'number' || Number.isNaN(res)) return 'violation';
    if (res === exp) return 'tight';
    return (out === 'upper' ? res > exp : res < exp) ? 'contained' : 'violation';
  }
  if (typeof res !== 'boolean') return 'violation';           /* proof */
  if (res === exp) return 'tight';
  return res === false && exp === true ? 'contained' : 'violation';
}
function refusalClass(msg) {
  if (/malformed operand/.test(msg)) return 'malformed operand';
  if (/indeterminate/.test(msg)) return 'indeterminate (0·∞ or ∞−∞)';
  if (/containing 0/.test(msg)) return 'divisor contains 0';
  if (/non-finite|need positive finite|bad interval|rational: non-finite/.test(msg)) return 'infinite endpoint';
  if (/need positive interval|negative lower end/.test(msg)) return 'outside the domain (log, sqrt)';
  if (/radicand must be positive/.test(msg)) return 'sqrt: an upper end of 0';
  if (/out of finite range/.test(msg)) return 'exp: 2^k beyond the double range';
  if (/argument reduction|reduce:/.test(msg)) return 'argument reduction';
  if (/subnormal/.test(msg)) return 'subnormal argument';
  if (/exponent/.test(msg)) return 'exponent range';
  return 'other: ' + msg.slice(0, 80);
}
function run(f, args) {
  try { return { res: f(...args.map((a) => (Array.isArray(a) ? a.slice() : a))) }; } catch (e) { return { threw: String((e && e.message) || e) }; }
}

/* ---- the derivation ------------------------------------------------------------------------------------------------- */
function derive(P) {
  const zero = () => ({ tests: 0, tight: 0, contained: 0, refused: 0, notApplicable: 0, violations: 0 });
  const byOp = Object.fromEntries(Object.keys(KOPS).map((op) => [op, { fn: KOPS[op].fn, ...zero(), refusedBy: {} }]));
  const byFile = {}, notInKernel = {}, violations = [];
  const naTotal = Object.fromEntries(NA_REASONS.map((r) => [r, 0]));
  const red = Object.fromEntries(Object.entries(RED).map(([k, R]) => [k, { what: R.what, op: R.op, tests: 0, violationsCaught: 0, contained: 0, refused: 0 }]));
  const literals = { runTestsWithInexactInput: 0, runTestsWithInexactExpected: 0, signalClausesOnRunTests: 0, inexactExpected: [] };
  const signatureNotApplicable = [];
  let suiteTests = 0;
  for (const k of P.itl) {
    const file = k.split('/').pop();
    const tests = parseItl(fs.readFileSync(path.join(CORPUS, k), 'utf8'), file);
    const F = byFile[file] = { tests: tests.length, run: 0, tight: 0, contained: 0, refused: 0, violations: 0, notApplicable: Object.fromEntries(NA_REASONS.map((r) => [r, 0])) };
    suiteTests += tests.length;
    for (const t of tests) {
      const na = notApplicable(t), O = byOp[t.op];
      if (O) O.tests++;
      if (na) {
        F.notApplicable[na]++; naTotal[na]++;
        if (O) O.notApplicable++;
        if (na === 'not in the kernel') notInKernel[t.op] = (notInKernel[t.op] || 0) + 1;
        if (na === 'signature') signatureNotApplicable.push(file + ':' + t.line + ' ' + t.src);
        continue;
      }
      const K = KOPS[t.op], args = t.inputs.map(value), exp = value(t.tight[0]);
      F.run++;
      if (t.inputs.some(inexact)) literals.runTestsWithInexactInput++;
      if (inexact(t.tight[0])) literals.runTestsWithInexactExpected++;
      if (t.signal) literals.signalClausesOnRunTests++;
      const r = run(K.f, args);
      let v;
      if (r.threw !== undefined) {
        const c = refusalClass(r.threw);
        v = 'refused';
        F.refused++; O.refused++; O.refusedBy[c] = (O.refusedBy[c] || 0) + 1;
      } else {
        v = classify(K.out, r.res, exp);
        if (v === 'tight') { F.tight++; O.tight++; }
        else if (v === 'contained') { F.contained++; O.contained++; }
        else {
          F.violations++; O.violations++;
          const at = file + ':' + t.line;
          violations.push({ at, testcase: t.testcase, op: t.op, fn: K.fn, test: t.src, inputs: args.map(hexIv), expected: hexIv(exp), got: hexIv(r.res), expectedLiteralInexact: inexact(t.tight[0]), declared: !!DECLARED[at + ' ' + t.src] });
        }
      }
      if (inexact(t.tight[0])) literals.inexactExpected.push({ at: file + ':' + t.line, test: t.src, read: hexIv(exp), outcome: v });
      for (const [rk, R] of Object.entries(RED)) {
        if (R.op !== t.op) continue;
        const rr = run(R.f, args), X = red[rk];
        X.tests++;
        if (rr.threw !== undefined) X.refused++;
        else if (classify('iv', rr.res, exp) === 'violation') X.violationsCaught++;
        else X.contained++;
      }
    }
  }
  const sum = (key) => Object.values(byOp).reduce((s, o) => s + o[key], 0);
  const counts = { suiteFiles: P.itl.length, suiteTests, kernelOpTests: sum('tests'), run: sum('tight') + sum('contained') + sum('refused') + sum('violations'),
    tight: sum('tight'), contained: sum('contained'), refused: sum('refused'), violations: sum('violations'), notApplicable: Object.values(naTotal).reduce((a, b) => a + b, 0) };
  return { counts, notApplicableByReason: naTotal, byOp, byFile, notInKernel: Object.fromEntries(Object.entries(notInKernel).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))), signatureNotApplicable, literals, redControls: red, violations };
}

/* ---- main ------------------------------------------------------------------------------------------------------------ */
const P = verifyPins();
if (P.bad.length) { console.error('ITF1788 pins: ' + P.bad.length + ' file(s) refused\n  ' + P.bad.join('\n  ')); process.exit(1); }
const D = derive(P);
const ms = Date.now() - T0;
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return 'unknown'; } })();
const modules = Object.fromEntries(MODULES.map((m) => [m, sha256(fs.readFileSync(path.join(ROOT, m)))]));
const itf1788 = { repo: P.pins.repo, commit: P.pins.commit, commitDate: P.pins.commitDate, corpus: 'corpus/itf1788/' + P.pins.commit.slice(0, 8), pins: rel(PINS_PATH), pinsSha256: P.pinsSha256,
  pinnedFiles: Object.keys(P.pins.files).length, itlFiles: P.itl.map((k) => k.split('/').pop()) };
const DERIVED = ['itf1788', 'counts', 'notApplicableByReason', 'byOp', 'byFile', 'notInKernel', 'signatureNotApplicable', 'literals', 'redControls', 'violations', 'declaredViolationsWhy'];
const rec = {
  what: 'The interval kernel (instruments/interval: interval.js, transcendental.js, algebraic.js) run on ITF1788, the IEEE Std 1788-2015 interval test suite, at one pinned commit. Every test of an operation the kernel implements with the IEEE meaning is run; its expected result is the tightest double enclosure, so any valid enclosure contains it: CONTAINED-TIGHT = exactly the expected interval, CONTAINED = a wider enclosure, REFUSED = the kernel threw (its domain is enforced by refusal), VIOLATION = a result that does not contain the expected one (a soundness defect, each listed). NOT-APPLICABLE tests (decorations, the empty set, reverse and set operations, operations the kernel does not have, binary32 literals, tests with no tightest result) are counted per file and never run. mag and wid are scored as upper bounds, mig as a lower bound, subset/interior/isMember as proofs (a false where the suite says true is CONTAINED, a true where it says false is a VIOLATION). Literals are read exactly and rounded to the nearest double (the C double literal ITF1788 compiles them to). Two planted wrong kernels are red controls. Written by tools/audit-kernel-itf1788.js; --check re-hashes the pins and re-derives every number.',
  generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: ms / 1000, git, node: process.version,
  modules, itf1788, ...D, declaredViolationsWhy: DECLARED_WHY
};
const fired = Object.values(D.redControls).every((r) => r.violationsCaught > 0) && Object.keys(D.redControls).length === 2;

const c = D.counts;
console.log('ITF1788 ' + itf1788.commit.slice(0, 8) + ': ' + c.suiteTests + ' tests in ' + c.suiteFiles + ' files; ' + c.kernelOpTests + ' name an operation the kernel has; ' + c.run + ' run — '
  + c.tight + ' tight, ' + c.contained + ' contained, ' + c.refused + ' refused, ' + c.violations + ' VIOLATIONS; ' + c.notApplicable + ' not applicable');
console.log('  op        tests  tight  contained  refused  n/a  violations');
for (const [op, o] of Object.entries(D.byOp)) console.log('  ' + op.padEnd(9) + String(o.tests).padStart(6) + String(o.tight).padStart(7) + String(o.contained).padStart(11) + String(o.refused).padStart(9) + String(o.notApplicable).padStart(5) + String(o.violations).padStart(12));
console.log('  not applicable by reason: ' + Object.entries(D.notApplicableByReason).filter(([, n]) => n).map(([r, n]) => r + ' ' + n).join(', '));
for (const v of D.violations) console.log('  VIOLATION ' + v.at + ' ' + v.test + '  got ' + v.got + (v.declared ? '  (declared in this tool: reported, fix pending)' : '  — UNDECLARED'));
if (D.violations.some((v) => v.declared)) console.log('  declared: ' + DECLARED_WHY);
for (const [k, r] of Object.entries(D.redControls)) console.log('  RED ' + k + ' (' + r.what + '): ' + r.violationsCaught + ' of ' + r.tests + ' ' + r.op + ' tests caught — ' + (r.violationsCaught ? 'fired' : 'DID NOT FIRE'));

const undeclared = D.violations.filter((v) => !v.declared);
let fail = !fired || undeclared.length > 0;
if (undeclared.length) console.error(undeclared.length + ' UNDECLARED violation(s): a soundness defect of the kernel — report it, do not regenerate it away');
if (CHECK) {
  if (!fs.existsSync(OUT)) { console.error('no record at ' + rel(OUT) + ' — run without --check first'); process.exit(1); }
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const diff = DERIVED.filter((k) => JSON.stringify(old[k]) !== JSON.stringify(rec[k]));
  if (diff.length) { console.error('re-derivation differs from ' + rel(OUT) + ' in: ' + diff.join(', ') + ' — re-run the record and read the change'); fail = true; }
  else console.log('re-derivation identical to ' + rel(OUT) + ' (' + DERIVED.length + ' fields); ' + Object.keys(P.pins.files).length + ' pins re-hashed');
  const moved = MODULES.filter((m) => (old.modules || {})[m] !== modules[m]);
  if (moved.length && !diff.length) console.log('  note: kernel module(s) changed since the record (' + moved.join(', ') + '); every derived number is unchanged');
} else {
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote ' + rel(OUT) + ' in ' + rec.seconds + ' s');
}
if (!fired) console.error('a red control did not fire — the audit cannot go red');
process.exit(fail ? 1 : 0);
