#!/usr/bin/env node
/* check.js: verify-gym's SECOND decider, in JavaScript BigInt. It shares no code with verify_gym/exact.py and
   decides the polynomial family's isolation by a different theorem (a Sturm sequence over exact rationals, where
   the Python decider uses Descartes' rule on a Moebius transform).

   stdin:  {"items": [{"id", "family", "inst", "lo", "hi", "limit_digits", "cap", "d0"}, ...]}
           lo and hi are the endpoint TEXTS as the reply wrote them (the JSON extraction is the Python layer's).
   stdout: {"families": [...], "results": {"<id>": {"verdict", "sides", "decimals", "progress"}}}

   The battery runs every held-out answer of every reference policy and every planted forgery through both
   deciders and refuses on the first field that differs.                                                    MIT */
'use strict';

const FAMILIES = ['xx', 'kroot', 'poly'];
const RAW = 80;
const DEC = new RegExp('^(-?)(\\d{1,' + RAW + '})(?:\\.(\\d{1,' + RAW + '}))?$');
const FRA = new RegExp('^(-?)(\\d{1,' + RAW + '})/(\\d{1,' + RAW + '})$');

const abs = (a) => (a < 0n ? -a : a);
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const sgn = (a) => (a > 0n ? 1 : a < 0n ? -1 : 0);

// a rational is [n, d], d > 0, in lowest terms
function Q(n, d) {
  if (d === 0n) throw new Error('zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return [n / g, d / g];
}
const qcmp = (a, b) => sgn(a[0] * b[1] - b[0] * a[1]);
const qsub = (a, b) => Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const qadd = (a, b) => Q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const qmul = (a, b) => Q(a[0] * b[0], a[1] * b[1]);
const qdiv = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
const qfrom = (s) => {               // "p/q" or an integer, the instance's own fields (trusted text)
  const m = String(s).match(/^(-?\d+)(?:\/(\d+))?$/);
  if (!m) throw new Error('bad rational in an instance: ' + s);
  return Q(BigInt(m[1]), BigInt(m[2] || '1'));
};

function readEndpoint(text) {
  if (typeof text !== 'string') return null;
  const s = text.trim();
  if (s.length > 2 * RAW + 2) return null;
  let m = s.match(FRA);
  if (m) {
    const d = BigInt(m[3]);
    if (d === 0n) return null;
    return Q(m[1] ? -BigInt(m[2]) : BigInt(m[2]), d);
  }
  m = s.match(DEC);
  if (m) {
    const f = m[3] || '';
    const n = BigInt(m[2] + f);
    return Q(m[1] ? -n : n, 10n ** BigInt(f.length));
  }
  return null;
}

// ---- the three families: the word on x > a ('gt') or x < a ('lt') ----------------------------------------
function xx(inst, a, rel) {
  const N = BigInt(inst.N);
  if (N < 2n) return 'REFUSED';
  if (qcmp(a, [1n, 1n]) < 0) return 'REFUSED';
  const [p, q] = a;
  const c = sgn(p ** p - N ** q * q ** p);
  return (rel === 'gt' ? c < 0 : c > 0) ? 'CERTIFIED' : 'REFUTED';
}

function kroot(inst, a, rel) {
  const n = BigInt(inst.n), k = BigInt(inst.k);
  if (n < 2n || k < 2n) return 'REFUSED';
  if (a[0] <= 0n) return 'REFUSED';
  const [p, q] = a;
  const c = sgn(p ** k - n * q ** k);
  return (rel === 'gt' ? c < 0 : c > 0) ? 'CERTIFIED' : 'REFUTED';
}

// polynomials over Q: arrays of rationals, LEADING coefficient first
const trim = (P) => { let i = 0; while (i < P.length - 1 && P[i][0] === 0n) i++; return P.slice(i); };
const isZero = (P) => P.length === 1 && P[0][0] === 0n;
function evalQ(P, x) { let v = [0n, 1n]; for (const c of P) v = qadd(qmul(v, x), c); return v; }
function deriv(P) {
  const d = P.length - 1;
  return trim(P.slice(0, d).map((c, i) => qmul(c, [BigInt(d - i), 1n])));
}
function rem(A, B) {                 // remainder of A by B, exact
  let R = A.slice();
  while (!isZero(R) && R.length >= B.length) {
    const f = qdiv(R[0], B[0]);
    const S = R.map((c, i) => (i < B.length ? qsub(c, qmul(f, B[i])) : c));   // S[0] is now 0
    R = S.length > 1 ? trim(S.slice(1)) : [[0n, 1n]];
  }
  return R;
}
function sturmChain(P) {
  const chain = [P, deriv(P)];
  while (!isZero(chain[chain.length - 1]) && chain[chain.length - 1].length > 1) {
    const r = rem(chain[chain.length - 2], chain[chain.length - 1]);
    if (isZero(r)) break;
    chain.push(r.map((c) => qmul(c, [-1n, 1n])));
  }
  return chain;
}
function signChanges(chain, x) {
  const s = chain.map((P) => sgn(evalQ(P, x)[0])).filter((v) => v !== 0);
  let n = 0;
  for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) n++;
  return n;
}
const ISO = new Map();
function isolated(inst) {
  const key = JSON.stringify([inst.coeffs, inst.lo0, inst.hi0]);
  if (!ISO.has(key)) {
    const P = trim(inst.coeffs.map((c) => [BigInt(c), 1n]));
    const l = qfrom(inst.lo0), h = qfrom(inst.hi0);
    let ok = P.length >= 2 && qcmp(l, h) < 0;
    if (ok) {
      const sl = sgn(evalQ(P, l)[0]), sh = sgn(evalQ(P, h)[0]);
      ok = sl * sh < 0;
      if (ok) {
        const ch = sturmChain(P);
        ok = signChanges(ch, l) - signChanges(ch, h) === 1;       // Sturm: distinct roots in (l, h]
      }
    }
    ISO.set(key, ok);
  }
  return ISO.get(key);
}

function poly(inst, a, rel) {
  if (!isolated(inst)) return 'REFUSED';
  const l = qfrom(inst.lo0), h = qfrom(inst.hi0);
  if (qcmp(a, l) <= 0) return rel === 'gt' ? 'CERTIFIED' : 'REFUTED';
  if (qcmp(a, h) >= 0) return rel === 'gt' ? 'REFUTED' : 'CERTIFIED';
  const P = inst.coeffs.map((c) => [BigInt(c), 1n]);
  const s = sgn(evalQ(P, a)[0]);
  if (s === 0) return 'REFUTED';
  const leftOfRoot = s === sgn(evalQ(P, l)[0]);
  return (rel === 'gt' ? leftOfRoot : !leftOfRoot) ? 'CERTIFIED' : 'REFUTED';
}

const SIDE = { xx, kroot, poly };

function decimals(w) {               // max(0, floor(-log10 w)), w > 0
  const [u, v] = w;
  if (u > v) return 0;
  let k = 0, t = 10n;
  while (u * t <= v) { k++; t *= 10n; }
  return k;
}

function decide(it) {
  const out = { verdict: 'MALFORMED', sides: [null, null], decimals: 0, progress: 0 };
  const side = SIDE[it.family];
  if (!side) return { verdict: 'REFUSED', sides: [null, null], decimals: 0, progress: 0 };
  const lo = readEndpoint(it.lo), hi = readEndpoint(it.hi);
  if (!lo || !hi) return out;
  if (qcmp(lo, hi) >= 0) return out;
  const L = 10n ** BigInt(it.limit_digits);
  const inLimit = (a) => abs(a[0]) < L && a[1] < L;
  if (!inLimit(lo) || !inLimit(hi)) return out;
  const wl = side(it.inst, lo, 'gt'), wh = side(it.inst, hi, 'lt');
  out.sides = [wl, wh];
  if (wl === 'REFUTED' || wh === 'REFUTED') { out.verdict = 'REFUTED'; return out; }
  if (wl === 'REFUSED' || wh === 'REFUSED') { out.verdict = 'REFUSED'; return out; }
  const d = decimals(qsub(hi, lo));
  out.verdict = 'CERTIFIED';
  out.decimals = d;
  out.progress = Math.min(it.cap, Math.max(0, d - it.d0));
  return out;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  const req = JSON.parse(input || '{"items": []}');
  const results = {};
  for (const it of req.items) results[it.id] = decide(it);
  process.stdout.write(JSON.stringify({ families: FAMILIES, results }));
});
