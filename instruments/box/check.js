#!/usr/bin/env node
/* instruments/box/check.js — the SECOND checker of declared claims (version 3, 2026-10-20), in JavaScript, sharing no
   code with instruments/box/check.py: the same specification (SCHEMA.md), the same refusal kinds, the same decisions
   from the object — exact rationals on BigInt here, Python's Fraction there — so that the battery can hold the two
   to each other on every object. The words are read from instruments/verdict.js and the kernel vocabulary from
   certs/kernel-arb-audit.json, as in the Python. JSON is parsed by a reader of its own that keeps every number's text,
   so that a JSON number in an object is refused as a double and an integer datum beyond 2^53 is still exact.

   usage: node instruments/box/check.js <object.json>...     one line per object; exit 1 if any REFUSED
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const ARB = path.join(ROOT, 'certs', 'kernel-arb-audit.json');
const VERDICT_JS = path.join(ROOT, 'instruments', 'verdict.js');
const ADMITTED = 'ADMITTED', REFUSED_WORD = 'REFUSED';

const VOCAB = { Add: [2, 'add'], Subtract: [2, 'sub'], Multiply: [2, 'mul'], Divide: [2, 'div'], Abs: [1, 'abs'], Square: [1, 'sqr'], Power: [2, 'pow'],
  Exp: [1, 'exp'], Ln: [1, 'log'], Sin: [1, 'sin'], Cos: [1, 'cos'], Tanh: [1, 'tanh'], LogGamma: [1, 'lgamma'], Digamma: [1, 'digamma'],
  Trigamma: [1, 'trigamma'], GammaP: [2, 'gammaP'], Phi: [1, 'Phi'] };
const EXACT_EXTRA = { Min: 2, Max: 2, Kronecker: 2 };
const QUANT = ['Sum', 'Product', 'MaxOver', 'MinOver'];
const EXACT_HEADS = new Set(['Add', 'Subtract', 'Multiply', 'Divide', 'Abs', 'Square', 'Power', 'Min', 'Max', 'Kronecker', 'Index', ...QUANT]);
const RELS = ['le', 'lt', 'ge', 'gt', 'eq', 'in', 'holds'];
const READINGS = ['universal', 'epistemic'];
const TOP = ['id', 'text', 'source', 'reading', 'domain', 'predicate', 'reference', 'hypotheses', 'falsifier'];
const TOP_OPTIONAL = ['record', 'repair', 'notes'];
const ELEMENTS = ['doubles', 'integers', 'rationals'];
const KINDS = ['schema', 'json-number', 'decimal-literal', 'rational', 'box-order', 'unbounded', 'pin-unresolved', 'pin-mismatch', 'quote-not-verbatim',
  'printed-not-in-quote', 'printed-mismatch', 'vocabulary', 'arity', 'symbol', 'named', 'reading', 'falsifier', 'reference', 'data', 'index', 'empty-range',
  'division-by-zero', 'record-missing', 'record-row-missing', 'record-verdict-word', 'record-value', 'record-bar-mismatch', 'record-decision-mismatch',
  'record-value-mismatch', 'repair'];

class Refuse extends Error { constructor(kind, msg) { super(msg); if (!KINDS.includes(kind)) throw new Error('unknown kind ' + kind); this.kind = kind; this.msg = msg; } }
const die = (m) => { process.stderr.write('BOX CHECKER (JS) REFUSED TO RUN: ' + m + '\n'); process.exit(2); };

/* ---- the words and the vocabulary, read ---------------------------------------------------------------------- */
let WORDS = null;
function loadVocab(arbPath = ARB, verdictPath = VERDICT_JS) {
  if (!fs.existsSync(arbPath)) die('the kernel audit is missing; the vocabulary is read from it');
  const byOp = JSON.parse(fs.readFileSync(arbPath, 'utf8')).byOp || {};
  for (const h of Object.keys(VOCAB)) if (!(VOCAB[h][1] in byOp)) die('the vocabulary names ' + h + ' -> kernel ' + VOCAB[h][1] + ', which the Arb audit does not hold');
  if (!fs.existsSync(verdictPath)) die('instruments/verdict.js is missing; the three words are read from it');
  const src = fs.readFileSync(verdictPath, 'utf8');
  const words = [...src.matchAll(/^const (?:CERTIFIED|REFUTED|REFUSED) = '([A-Z]+)';/gm)].map((m) => m[1]);
  if (words.slice().sort().join() !== 'CERTIFIED,REFUSED,REFUTED') die('verdict.js does not declare the three words where this checker reads them');
  return words; // [CERTIFIED, REFUTED, REFUSED] in file order
}

/* ---- a JSON reader that keeps number text ------------------------------------------------------------------------ */
class Num { constructor(text) { this.text = text; } }
function parseJSON(text) {
  let i = 0;
  const ws = () => { while (i < text.length && ' \t\r\n'.includes(text[i])) i++; };
  const err = (m) => { throw new SyntaxError('JSON: ' + m + ' at ' + i); };
  function value() {
    ws();
    const c = text[i];
    if (c === '{') {
      i++; const o = {}; ws();
      if (text[i] === '}') { i++; return o; }
      for (;;) { ws(); if (text[i] !== '"') err('key'); const k = string(); ws(); if (text[i] !== ':') err(':'); i++; o[k] = value(); ws(); if (text[i] === ',') { i++; continue; } if (text[i] === '}') { i++; return o; } err(', or }'); }
    }
    if (c === '[') {
      i++; const a = []; ws();
      if (text[i] === ']') { i++; return a; }
      for (;;) { a.push(value()); ws(); if (text[i] === ',') { i++; continue; } if (text[i] === ']') { i++; return a; } err(', or ]'); }
    }
    if (c === '"') return string();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i, i + 400));
    if (!m) err('value');
    i += m[0].length;
    return new Num(m[0]);
  }
  function string() {
    i++; let out = '';
    for (;;) {
      const c = text[i++];
      if (c === undefined) err('unterminated string');
      if (c === '"') return out;
      if (c === '\\') {
        const e = text[i++];
        if (e === 'u') { out += String.fromCharCode(parseInt(text.slice(i, i + 4), 16)); i += 4; }
        else out += { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }[e];
      } else out += c;
    }
  }
  const v = value(); ws();
  if (i !== text.length) err('trailing');
  return v;
}

/* ---- exact rationals on BigInt ------------------------------------------------------------------------------------ */
const babs = (a) => (a < 0n ? -a : a);
function gcd(a, b) { a = babs(a); b = babs(b); while (b) { [a, b] = [b, a % b]; } return a; }
class Q {
  constructor(n, d = 1n) { if (d === 0n) throw new Refuse('division-by-zero', 'rational'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  static fromString(s) { const m = /^(-?\d+)(?:\/([1-9]\d*))?$/.exec(s); if (!m) throw new Error('not a rational ' + s); return new Q(BigInt(m[1]), m[2] ? BigInt(m[2]) : 1n); }
  static fromDecimal(s) { const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s); if (!m) throw new Error('not a decimal ' + s); const frac = m[3] || ''; return new Q(BigInt((m[1] || '') + m[2] + frac), 10n ** BigInt(frac.length)); }
  static fromDouble(x) { // exact: a finite double is m · 2^e
    if (!Number.isFinite(x)) throw new Refuse('data', 'not a finite double');
    let k = 0; let y = x;
    while (!Number.isInteger(y)) { y *= 2; k++; }
    return new Q(BigInt(y), 2n ** BigInt(k));
  }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Q(this.n * o.n, this.d * o.d); }
  div(o) { if (o.n === 0n) throw new Refuse('division-by-zero', 'Divide'); return new Q(this.n * o.d, this.d * o.n); }
  abs() { return new Q(babs(this.n), this.d); }
  neg() { return new Q(-this.n, this.d); }
  cmp(o) { const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
  eq(o) { return this.n === o.n && this.d === o.d; }
  isInt() { return this.d === 1n; }
  toInt() { if (!this.isInt()) throw new Refuse('index', String(this) + ' is not an integer'); return Number(this.n); }
  pow(n) { if (n === 0) return new Q(1n); const b = n < 0 ? new Q(this.d, this.n) : this; let r = new Q(1n); for (let i = 0; i < Math.abs(n); i++) r = r.mul(b); return r; }
  toString() { return this.d === 1n ? String(this.n) : String(this.n) + '/' + String(this.d); }
}
const Z = (k) => new Q(BigInt(k));

/* ---- small readers ------------------------------------------------------------------------------------------------ */
const RAT = /^-?\d+(?:\/[1-9]\d*)?$/, DEC = /^-?\d+\.\d+$/, INT = /^-?\d+$/, SYM = /^[A-Za-z_][A-Za-z0-9_]*$/;
const isNum = (v) => v instanceof Num;
const isStr = (v) => typeof v === 'string';
function rational(s, where) {
  if (isNum(s) || typeof s === 'number' || typeof s === 'boolean') throw new Refuse('json-number', where + ': ' + (isNum(s) ? s.text : String(s)));
  if (!isStr(s)) throw new Refuse('schema', where + ' must be a string');
  if (DEC.test(s)) throw new Refuse('decimal-literal', where + ': ' + s);
  if (!RAT.test(s)) throw new Refuse('rational', where + ': ' + s);
  return Q.fromString(s);
}
function printedRational(s, where) {
  if (!isStr(s) || !(DEC.test(s) || INT.test(s))) throw new Refuse('schema', where + ' (printed) must be the digits as printed');
  return Q.fromDecimal(s);
}
function printedBox(s) { const d = s.includes('.') ? s.split('.')[1].length : 0; const half = new Q(5n, 10n ** BigInt(d + 1)); const p = Q.fromDecimal(s); return [p.sub(half), p.add(half)]; }
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function pinned(pin, where, root) {
  if (!pin || typeof pin !== 'object' || Array.isArray(pin) || Object.keys(pin).sort().join() !== 'path,sha256') throw new Refuse('schema', where + ' must be {path, sha256}');
  const p = path.join(root, pin.path);
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) throw new Refuse('pin-unresolved', where + ': ' + pin.path);
  if (sha256(p) !== pin.sha256) throw new Refuse('pin-mismatch', where + ': ' + pin.path);
  return p;
}
function need(obj, keys, optional, where) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Refuse('schema', where + ' must be an object');
  const missing = keys.filter((k) => !(k in obj)), unknown = Object.keys(obj).filter((k) => !keys.includes(k) && !optional.includes(k));
  if (missing.length) throw new Refuse('schema', where + ' is missing ' + missing.join(', '));
  if (unknown.length) throw new Refuse('schema', where + ' has unknown field(s) ' + unknown.join(', '));
}
function strList(xs, where, allowEmpty) {
  if (!Array.isArray(xs) || (!xs.length && !allowEmpty) || xs.some((x) => !isStr(x) || !x.trim()))
    throw new Refuse(where === 'falsifier' ? 'falsifier' : 'schema', where + ' must be a list of non-empty strings' + (allowEmpty ? '' : ', not empty'));
}
const countOf = (v, where) => { if (!isNum(v) || !/^[1-9]\d*$/.test(v.text)) throw new Refuse('schema', where + ' must be a positive integer'); return Number(v.text); };

/* ---- expressions: well-formedness ---------------------------------------------------------------------------------- */
function walk(e, symbols, where, root, dataSym, bound) {
  if (isNum(e) || typeof e === 'number' || typeof e === 'boolean') throw new Refuse('json-number', where + ': ' + (isNum(e) ? e.text : String(e)));
  if (isStr(e)) {
    if (RAT.test(e)) return true;
    if (DEC.test(e)) throw new Refuse('decimal-literal', where + ': ' + e);
    if (SYM.test(e)) { if (symbols.has(e) || bound.includes(e)) return true; throw new Refuse('symbol', where + ': ' + e + ' is not declared by the domain'); }
    throw new Refuse('schema', where + ': unreadable token ' + JSON.stringify(e));
  }
  if (Array.isArray(e)) {
    if (!e.length || !isStr(e[0])) throw new Refuse('schema', where + ': an expression list starts with its head');
    const head = e[0];
    if (QUANT.includes(head)) {
      if (e.length !== 5) throw new Refuse('arity', where + ': ' + head + ' takes var, lo, hi, body');
      const v = e[1];
      if (!isStr(v) || !SYM.test(v) || symbols.has(v) || bound.includes(v)) throw new Refuse('schema', where + ': ' + head + ' binds a fresh symbol');
      const a = walk(e[2], symbols, where + '.' + head + '.lo', root, dataSym, bound), b = walk(e[3], symbols, where + '.' + head + '.hi', root, dataSym, bound);
      const c = walk(e[4], symbols, where + '.' + head + '.body', root, dataSym, bound.concat([v]));
      return a && b && c;
    }
    if (head === 'Index') {
      if (dataSym === null) throw new Refuse('vocabulary', where + ': Index needs a typed data block in the domain');
      if (!(e.length === 3 || e.length === 4) || e[1] !== dataSym) throw new Refuse('arity', where + ': Index takes the data symbol and one or two indices');
      let ok = true;
      e.slice(2).forEach((a, i) => { ok = walk(a, symbols, where + '.Index[' + i + ']', root, dataSym, bound) && ok; });
      return ok;
    }
    let arity;
    if (head in EXACT_EXTRA) arity = EXACT_EXTRA[head]; else if (head in VOCAB) arity = VOCAB[head][0]; else throw new Refuse('vocabulary', where + ': ' + head);
    if (e.length - 1 !== arity) throw new Refuse('arity', where + ': ' + head + ' takes ' + arity + ', given ' + (e.length - 1));
    let ok = EXACT_HEADS.has(head);
    e.slice(1).forEach((a, i) => { ok = walk(a, symbols, where + '.' + head + '[' + i + ']', root, dataSym, bound) && ok; });
    return ok;
  }
  if (e && typeof e === 'object') {
    need(e, ['named', 'where', 'args'], [], where + ' (named)');
    if (!isStr(e.named) || !e.named.trim()) throw new Refuse('schema', where + ': named must be a non-empty string');
    if (!isStr(e.where) || !fs.existsSync(path.join(root, e.where))) throw new Refuse('named', where + ': ' + String(e.where));
    if (!Array.isArray(e.args)) throw new Refuse('schema', where + ': args must be a list');
    e.args.forEach((a, i) => walk(a, symbols, where + '.args[' + i + ']', root, dataSym, bound));
    return false;
  }
  throw new Refuse('schema', where + ': unreadable expression');
}

/* ---- expressions: exact evaluation --------------------------------------------------------------------------------- */
function ev(e, env, data, where) {
  if (isStr(e)) return RAT.test(e) ? Q.fromString(e) : env.get(e);
  const head = e[0];
  if (head === 'Index') {
    let cur = data;
    for (const a of e.slice(2)) {
      const i = ev(a, env, data, where).toInt();
      if (!Array.isArray(cur) || i < 0 || i >= cur.length) throw new Refuse('index', where + ': Index ' + i + ' out of range');
      cur = cur[i];
    }
    if (Array.isArray(cur)) throw new Refuse('index', where + ': Index does not reach a scalar');
    return cur;
  }
  if (QUANT.includes(head)) {
    const v = e[1], lo = ev(e[2], env, data, where).toInt(), hi = ev(e[3], env, data, where).toInt();
    if ((head === 'MaxOver' || head === 'MinOver') && hi < lo) throw new Refuse('empty-range', where + ': ' + head + ' over ' + lo + '..' + hi);
    let acc = head === 'Sum' ? Z(0) : head === 'Product' ? Z(1) : null;
    const env2 = new Map(env);
    for (let k = lo; k <= hi; k++) {
      env2.set(v, Z(k));
      const x = ev(e[4], env2, data, where);
      if (head === 'Sum') acc = acc.add(x); else if (head === 'Product') acc = acc.mul(x);
      else if (head === 'MaxOver') acc = acc === null || x.cmp(acc) > 0 ? x : acc; else acc = acc === null || x.cmp(acc) < 0 ? x : acc;
    }
    return acc;
  }
  const a = e.slice(1).map((x) => ev(x, env, data, where));
  switch (head) {
    case 'Add': return a[0].add(a[1]);
    case 'Subtract': return a[0].sub(a[1]);
    case 'Multiply': return a[0].mul(a[1]);
    case 'Divide': if (a[1].n === 0n) throw new Refuse('division-by-zero', where); return a[0].div(a[1]);
    case 'Abs': return a[0].abs();
    case 'Square': return a[0].mul(a[0]);
    case 'Power': { const n = a[1].toInt(); if (a[0].n === 0n && n < 0) throw new Refuse('division-by-zero', where + '.Power'); return a[0].pow(n); }
    case 'Min': return a[0].cmp(a[1]) <= 0 ? a[0] : a[1];
    case 'Max': return a[0].cmp(a[1]) >= 0 ? a[0] : a[1];
    case 'Kronecker': return Z(a[0].eq(a[1]) ? 1 : 0);
    default: throw new Error('not exact: ' + head);
  }
}

/* ---- typed data ------------------------------------------------------------------------------------------------------ */
function decodeData(spec, p, where) {
  need(spec, ['select', 'elements', 'shape'], [], where);
  if (!ELEMENTS.includes(spec.elements)) throw new Refuse('data', where + ': elements must be one of ' + ELEMENTS.join(', '));
  if (!Array.isArray(spec.shape) || !spec.shape.length || spec.shape.some((s) => !isStr(s) || !SYM.test(s)) || new Set(spec.shape).size !== spec.shape.length)
    throw new Refuse('data', where + ': shape must be a list of distinct symbols, one per dimension');
  let doc;
  try { doc = parseJSON(fs.readFileSync(p, 'utf8')); } catch (e) { throw new Refuse('data', where + ': the pinned bytes are not JSON (' + String(e.message).slice(0, 60) + ')'); }
  let cur = doc;
  for (const k of String(spec.select).split('.')) {
    if (Array.isArray(cur) && INT.test(k)) { const i = Number(k); if (i < 0 || i >= cur.length) throw new Refuse('data', where + ': select index out of range'); cur = cur[i]; }
    else if (cur && typeof cur === 'object' && !Array.isArray(cur) && k in cur) cur = cur[k];
    else throw new Refuse('data', where + ': select ' + spec.select + ' does not resolve');
  }
  const sizes = {};
  const conv = (x, depth, w) => {
    if (depth === spec.shape.length) {
      if (spec.elements === 'doubles') { if (!isNum(x)) throw new Refuse('data', w + ': not a JSON number'); return Q.fromDouble(Number(x.text)); }
      if (spec.elements === 'integers') { if (!isNum(x) || !INT.test(x.text)) throw new Refuse('data', w + ': not a JSON integer'); return new Q(BigInt(x.text)); }
      if (!isStr(x) || !RAT.test(x)) throw new Refuse('data', w + ': not a rational string'); return Q.fromString(x);
    }
    if (!Array.isArray(x)) throw new Refuse('data', w + ': expected a list at depth ' + depth);
    const name = spec.shape[depth];
    if (name in sizes && sizes[name] !== x.length) throw new Refuse('data', w + ': ' + name + ' is ' + sizes[name] + ' elsewhere, ' + x.length + ' here (not rectangular)');
    sizes[name] = x.length;
    return x.map((y, i) => conv(y, depth + 1, w + '[' + i + ']'));
  };
  return [conv(cur, 0, where), sizes];
}

/* ---- the record -------------------------------------------------------------------------------------------------------- */
const getPath = (o, dotted) => { let cur = o; for (const k of dotted.split('.')) { if (!cur || typeof cur !== 'object' || !(k in cur)) return undefined; cur = cur[k]; } return cur; };
function recordValue(v, where) {
  if (isStr(v) && RAT.test(v)) return ['exact', Q.fromString(v)];
  if (Array.isArray(v) && v.length === 2 && v.every(isNum)) { const lo = Q.fromDouble(Number(v[0].text)), hi = Q.fromDouble(Number(v[1].text)); if (lo.cmp(hi) > 0) throw new Refuse('record-value', where + ': enclosure with lo > hi'); return ['enclosure', [lo, hi]]; }
  throw new Refuse('record-value', where + ': ' + JSON.stringify(v === undefined ? null : (isNum(v) ? v.text : v)).slice(0, 80));
}
const BAR_IN_CLAIM = /-?\d+\.\d+/, REL_IN_CLAIM = /(<=|>=|≤|≥|<|>|=)/;
const REL_WORD = { '<=': 'le', '≤': 'le', '>=': 'ge', '≥': 'ge', '<': 'lt', '>': 'gt', '=': 'eq' };

function decide(value, rel, c) {
  const [C, R, F] = WORDS;
  const [kind, v] = value;
  const [lo, hi] = kind === 'exact' ? [v, v] : v;
  if (rel === 'in') { const [blo, bhi] = c; if (blo.cmp(lo) <= 0 && hi.cmp(bhi) <= 0) return C; if (hi.cmp(blo) < 0 || lo.cmp(bhi) > 0) return R; return F; }
  if (rel === 'eq') { if (kind === 'exact') return v.eq(c) ? C : R; return (hi.cmp(c) < 0 || lo.cmp(c) > 0) ? R : F; }
  if (rel === 'lt') return hi.cmp(c) < 0 ? C : lo.cmp(c) >= 0 ? R : F;
  if (rel === 'le') return hi.cmp(c) <= 0 ? C : lo.cmp(c) > 0 ? R : F;
  if (rel === 'gt') return lo.cmp(c) > 0 ? C : hi.cmp(c) <= 0 ? R : F;
  if (rel === 'ge') return lo.cmp(c) >= 0 ? C : hi.cmp(c) < 0 ? R : F;
  throw new Error(rel);
}
function compose(words) { const [C, R, F] = WORDS; if (words.includes(R)) return R; if (words.includes(F)) return F; return C; }

function decideFromObject(p, env0, data, where) {
  const [C, R] = WORDS;
  if (!p.forall.length) { const v = ev(p.g, env0, data, where); return { word: decide(['exact', v], p.rel, p.c), witness: null, violations: null, value: v.toString() }; }
  let violations = 0, witness = null;
  const env = new Map(env0);
  const loop = (k) => {
    if (k === p.forall.length) {
      const v = ev(p.g, env, data, where);
      if (decide(['exact', v], p.rel, p.c) !== C) { violations++; if (!witness) { const at = {}; for (const [vr] of p.forall) at[vr] = env.get(vr).toInt(); witness = { at, value: v.toString() }; } }
      return;
    }
    const [vr, loE, hiE] = p.forall[k];
    const lo = ev(loE, env, data, where + '.forall').toInt(), hi = ev(hiE, env, data, where + '.forall').toInt();
    for (let i = lo; i <= hi; i++) { env.set(vr, Z(i)); loop(k + 1); }
    env.delete(vr);
  };
  loop(0);
  return { word: violations ? R : C, witness, violations, value: null };
}

/* ---- the check ---------------------------------------------------------------------------------------------------------- */
function checkObj(o, root = ROOT) {
  const out = { word: REFUSED_WORD, kind: null, msg: '', id: o && typeof o === 'object' ? o.id : null, decided: [], fromObject: [], notes: [], seconds: 0 };
  const t0 = Date.now();
  try {
    need(o, TOP, TOP_OPTIONAL, 'the object');
    if (!isStr(o.id) || !o.id.trim()) throw new Refuse('schema', 'id must be a non-empty string');
    if (!isStr(o.text) || !o.text.trim()) throw new Refuse('schema', 'text must be a non-empty string');
    if (!READINGS.includes(o.reading)) throw new Refuse('reading', JSON.stringify(o.reading));
    if (!isStr(o.reference) || !o.reference.trim()) throw new Refuse('reference', 'reference is empty');
    strList(o.hypotheses, 'hypotheses', true);
    strList(o.falsifier, 'falsifier', false);
    if ('notes' in o) strList(o.notes, 'notes', true);

    const s = o.source;
    need(s, ['what', 'path', 'sha256', 'quote'], [], 'source');
    const srcPath = pinned({ path: s.path, sha256: s.sha256 }, 'source', root);
    if (!isStr(s.quote) || !s.quote.trim()) throw new Refuse('schema', 'source.quote must be a non-empty string');
    if (!fs.readFileSync(srcPath, 'utf8').includes(s.quote)) throw new Refuse('quote-not-verbatim', s.path);

    const d = o.domain;
    if (!d || typeof d !== 'object' || !['finite', 'box'].includes(d.kind)) throw new Refuse('schema', 'domain.kind must be finite or box');
    const symbols = new Set();
    const boxSymbols = new Set();
    const env0 = new Map();
    let data = null, dataSym = null;
    if (d.kind === 'finite') {
      need(d, ['kind', 'pin', 'decoder', 'count', 'variable'], ['data'], 'domain');
      const dpath = pinned(d.pin, 'domain.pin', root);
      const count = countOf(d.count, 'domain.count');
      if (!isStr(d.decoder) || !d.decoder.trim()) throw new Refuse('schema', 'domain.decoder must say how the bytes are read');
      if (!isStr(d.variable) || !SYM.test(d.variable)) throw new Refuse('schema', 'domain.variable must be a symbol');
      symbols.add(d.variable);
      if ('data' in d) {
        const [dd, sizes] = decodeData(d.data, dpath, 'domain.data');
        data = dd; dataSym = d.variable;
        const first = d.data.shape[0];
        if (sizes[first] !== count) throw new Refuse('data', 'domain.count is ' + count + ', the decoded ' + first + ' is ' + sizes[first]);
        for (const name of Object.keys(sizes)) { if (symbols.has(name)) throw new Refuse('data', 'shape symbol ' + name + ' collides'); symbols.add(name); env0.set(name, Z(sizes[name])); }
      }
    } else {
      need(d, ['kind', 'sides'], [], 'domain');
      if (!Array.isArray(d.sides) || !d.sides.length) throw new Refuse('schema', 'domain.sides must be a non-empty list');
      d.sides.forEach((side, i) => {
        const w = 'domain.sides[' + i + ']';
        need(side, ['name', 'lo', 'hi', 'source'], [], w);
        if (!isStr(side.name) || !SYM.test(side.name) || symbols.has(side.name)) throw new Refuse('schema', w + ': name must be a fresh symbol');
        if (['inf', '-inf'].includes(side.lo) || ['inf', '-inf'].includes(side.hi)) throw new Refuse('unbounded', w);
        const lo = rational(side.lo, w + '.lo'), hi = rational(side.hi, w + '.hi');
        if (lo.cmp(hi) > 0) throw new Refuse('box-order', w + ': ' + side.lo + ' > ' + side.hi);
        if (!isStr(side.source) || !side.source.trim()) throw new Refuse('schema', w + ': every side carries the source of its bounds');
        symbols.add(side.name); boxSymbols.add(side.name);
      });
    }

    const P = o.predicate;
    if (!Array.isArray(P) || !P.length) throw new Refuse('schema', 'predicate must be a non-empty list');
    const preds = [];
    P.forEach((p, i) => {
      const w = 'predicate[' + i + ']';
      need(p, ['g', 'rel'], ['printed', 'c', 'note', 'forall'], w);
      if (!RELS.includes(p.rel)) throw new Refuse('schema', w + ': rel must be one of ' + RELS.join(', '));
      let bound = [];
      const forall = [];
      if ('forall' in p) {
        if (!Array.isArray(p.forall) || !p.forall.length) throw new Refuse('schema', w + ': forall is a non-empty list of [var, lo, hi]');
        for (const q of p.forall) {
          if (!Array.isArray(q) || q.length !== 3 || !isStr(q[0]) || !SYM.test(q[0]) || symbols.has(q[0]) || bound.includes(q[0])) throw new Refuse('schema', w + ': each forall entry is [a fresh symbol, lo, hi]');
          walk(q[1], symbols, w + '.forall.lo', root, dataSym, bound); walk(q[2], symbols, w + '.forall.hi', root, dataSym, bound);
          bound = bound.concat([q[0]]); forall.push([q[0], q[1], q[2]]);
        }
      }
      const exact = walk(p.g, symbols, w + '.g', root, dataSym, bound);
      if (p.rel === 'holds') {
        if (Array.isArray(p.g) || isStr(p.g) || 'printed' in p || 'c' in p || forall.length) throw new Refuse('schema', w + ': "holds" takes a named exact predicate and no bar');
        preds.push({ rel: 'holds', exact: false, forall: [], g: p.g, printed: null }); return;
      }
      if (!('c' in p)) throw new Refuse('schema', w + ': an inequality carries c');
      let pr;
      if ('printed' in p) { pr = printedRational(p.printed, w); if (!s.quote.includes(p.printed)) throw new Refuse('printed-not-in-quote', w + ': ' + p.printed); }
      else if (p.c !== '0' || p.rel === 'in') throw new Refuse('schema', w + ': a bar the claimant printed must carry printed; only the zero of a structural inequality may omit it');
      else pr = Z(0);
      if (p.rel === 'in') {
        if (!Array.isArray(p.c) || p.c.length !== 2) throw new Refuse('schema', w + ': "in" takes c = [lo, hi]');
        const lo = rational(p.c[0], w + '.c[0]'), hi = rational(p.c[1], w + '.c[1]');
        if (lo.cmp(hi) > 0) throw new Refuse('box-order', w + '.c');
        const [blo, bhi] = printedBox(p.printed);
        if (!lo.eq(blo) || !hi.eq(bhi)) throw new Refuse('printed-mismatch', w + ': c is not the box the digits of ' + p.printed + ' allow');
        preds.push({ rel: 'in', c: [lo, hi], printed: p.printed, exact, forall, g: p.g });
      } else {
        const c = rational(p.c, w + '.c');
        if (!c.eq(pr)) throw new Refuse('printed-mismatch', w + ': c = ' + p.c + ' is not the rational of ' + String(p.printed));
        preds.push({ rel: p.rel, c, printed: 'printed' in p ? p.printed : null, exact, forall, g: p.g });
      }
    });

    const uses = (e, names) => isStr(e) ? names.has(e) : Array.isArray(e) ? e.slice(1).some((x) => uses(x, names)) : (e && typeof e === 'object' && Array.isArray(e.args)) ? e.args.some((x) => uses(x, names)) : false;
    const fromObject = preds.map((p, i) => {
      if (p.rel === 'holds' || !p.exact || uses(p.g, boxSymbols)) { if (p.rel !== 'holds') out.notes.push('predicate[' + i + '] not decided from the object: ' + (p.exact && uses(p.g, boxSymbols) ? 'a box variable (the interval decider\'s)' : 'a transcendental or named head')); return null; }
      return decideFromObject(p, env0, data, 'predicate[' + i + '].g');
    });
    out.fromObject = fromObject;

    if ('record' in o) {
      const r = o.record;
      need(r, ['path', 'row', 'value', 'verdict'], [], 'record');
      const rp = path.join(root, r.path);
      if (!fs.existsSync(rp)) throw new Refuse('record-missing', r.path);
      const rec = parseJSON(fs.readFileSync(rp, 'utf8'));
      let row;
      if (r.row === null) row = rec;
      else { row = (Array.isArray(rec.rows) ? rec.rows : []).find((x) => x && typeof x === 'object' && x.id === r.row); if (!row) throw new Refuse('record-row-missing', r.path + ' row ' + String(r.row)); }
      const rv = row.verdict;
      if (!WORDS.includes(rv)) throw new Refuse('record-verdict-word', 'the record says ' + JSON.stringify(rv));
      if (r.verdict !== rv) throw new Refuse('record-verdict-word', 'the object declares ' + JSON.stringify(r.verdict) + ', the record says ' + rv);
      const value = r.value === null ? null : recordValue(getPath(row, r.value), 'record.value ' + String(r.value));
      const claimStr = String(row.claim || '');
      const m = BAR_IN_CLAIM.exec(claimStr), mr = REL_IN_CLAIM.exec(claimStr);
      const recBar = m ? Q.fromDecimal(m[0]) : null, recRel = mr ? REL_WORD[mr[0]] : null;
      const decided = [];
      preds.forEach((p, i) => {
        if (p.rel === 'holds') { decided.push(rv); return; }
        if (p.rel !== 'in' && p.printed !== null && recBar && !recBar.eq(p.c)) throw new Refuse('record-bar-mismatch', 'the record decided ' + m[0] + ', the object states ' + p.printed);
        if (p.rel !== 'in' && p.printed !== null && recRel && recRel !== p.rel) out.notes.push('the record\'s claim prints the relation ' + mr[0] + ', the object states ' + p.rel + '; the decision below is under the object\'s');
        const fo = fromObject[i];
        if (value !== null) {
          const dv = decide(value, p.rel, p.c);
          if (fo && fo.value !== null && value[0] === 'exact' && !Q.fromString(fo.value).eq(value[1])) throw new Refuse('record-value-mismatch', 'the object gives ' + fo.value.slice(0, 40) + '…, the record holds ' + value[1].toString().slice(0, 40) + '…');
          if (fo && fo.word !== dv) throw new Refuse('record-decision-mismatch', 'from the object ' + fo.word + ', from the record\'s value ' + dv);
          decided.push(dv);
        } else if (fo) decided.push(fo.word); else decided.push(rv);
      });
      const composed = compose(decided);
      if (composed !== rv) throw new Refuse('record-decision-mismatch', 'the re-decision gives ' + composed + ', the record says ' + rv);
      out.decided = decided;
      if ('repair' in o) {
        const rep = o.repair;
        need(rep, ['printed', 'c', 'verdict', 'how'], [], 'repair');
        const ineq = preds.filter((p) => p.rel !== 'holds' && p.rel !== 'in');
        if (ineq.length !== 1) throw new Refuse('repair', 'a repair needs exactly one inequality predicate');
        if (!WORDS.includes(rep.verdict)) throw new Refuse('repair', 'verdict ' + JSON.stringify(rep.verdict));
        const pr = printedRational(rep.printed, 'repair'), c = rational(rep.c, 'repair.c');
        if (!c.eq(pr)) throw new Refuse('repair', 'c is not the rational of ' + rep.printed);
        const rrep = row.repair && typeof row.repair === 'object' ? row.repair : null;
        if (!rrep || !String(rrep.claim || '').includes(rep.printed)) throw new Refuse('repair', 'the record holds no repair printing ' + rep.printed);
        const idx = preds.indexOf(ineq[0]);
        const srcValue = value !== null ? value : (fromObject[idx] && fromObject[idx].value ? ['exact', Q.fromString(fromObject[idx].value)] : null);
        if (!srcValue) throw new Refuse('repair', 'no value to re-decide the repair against');
        const dv = decide(srcValue, ineq[0].rel, c);
        if (dv !== rep.verdict) throw new Refuse('repair', 'the value re-decided against the repaired bar gives ' + dv + ', the object says ' + rep.verdict);
        out.decided.push('repair:' + dv);
      }
    } else if ('repair' in o) throw new Refuse('repair', 'a repair needs a record');
    else out.notes.push('no record attached' + (fromObject.some(Boolean) ? '' : ': a proposal, undecided'));

    out.word = ADMITTED;
    return out;
  } catch (e) {
    if (e instanceof Refuse) { out.kind = e.kind; out.msg = e.msg; return out; }
    throw e;
  } finally {
    out.seconds = Math.round((Date.now() - t0)) / 1000;
  }
}

function check(p, root = ROOT) {
  const o = parseJSON(fs.readFileSync(p, 'utf8'));
  const res = checkObj(o, root);
  if (res.word === ADMITTED && res.id !== path.basename(p, '.json')) res.notes.push('the file name is not the id');
  return res;
}

function main(argv) {
  WORDS = loadVocab();
  const paths = argv.filter((a) => !a.startsWith('--'));
  if (!paths.length) { console.log('usage: node instruments/box/check.js <object.json>...'); return 2; }
  let bad = 0;
  for (const p of paths) {
    const res = check(p);
    if (res.word === ADMITTED) {
      const fo = res.fromObject.filter(Boolean);
      const fos = fo.map((x) => x.word + (x.witness ? ' (witness ' + JSON.stringify(x.witness.at) + ', ' + x.violations + ' violating)' : '') + (x.value ? ' value ' + x.value.slice(0, 30) + (x.value.length > 30 ? '…' : '') : '')).join(' · ');
      console.log('ADMITTED  ' + res.id + '  [' + res.decided.join(' · ') + ']' + (fos ? '  from the object: ' + fos : '') + '  ' + res.seconds + ' s' + res.notes.map((n) => '  note: ' + n).join(''));
    } else { bad++; console.log('REFUSED   ' + res.id + '  ' + res.kind + ': ' + res.msg); }
  }
  return bad ? 1 : 0;
}

module.exports = { check, checkObj, parseJSON, Q, loadVocab, setWords: (w) => { WORDS = w; } };
if (require.main === module) process.exit(main(process.argv.slice(2)));
