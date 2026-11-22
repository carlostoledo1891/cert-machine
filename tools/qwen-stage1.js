#!/usr/bin/env node
/* qwen-stage1.js: the JavaScript decider of Stage 1 of the audit of "Language Models Can Rewrite Their Own Weights"
   (arXiv 2611.21885 v2), public files only. Rules: notes/qwen-self-rewriting-preregistration-2026-11-22.md.

   Node, no dependencies (https, crypto, zlib, typed arrays, BigInt). It shares no code with
   instruments/qwen-self-rewriting/stage1.py, the Python decider that re-derives every value below. It reads the public
   checkpoint Qwen/Qwen3.5-27B at one pinned commit by anonymous HTTPS range requests, one at a time; it never reads
   `main`. Every number is a dyadic rational computed on integers (BigInt) from bit patterns; there is no floating-point
   accumulation.

   usage: node tools/qwen-stage1.js offline | i1 | i2 | plan | run | controls  [--claims F --pins F --runs DIR --root DIR]
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const os = require('os');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ME = 'js', OTHER = 'py';
const DT_BYTES = { BF16: 2, F16: 2, F32: 4, F64: 8, I8: 1, U8: 1, BOOL: 1, I16: 2, U16: 2, I32: 4, U32: 4, I64: 8, U64: 8 };
const FMT = { BF16: [8, 7], F16: [5, 10], F32: [8, 23], F64: [11, 52] }; // exponent bits, fraction bits
const READINGS = ['abs_over_lower', 'abs_over_mean2', 'signed_over_lower', 'signed_over_mean2'];

class Stop extends Error {}
class HttpStatus extends Error { constructor(status) { super('HTTP status ' + status); this.status = status; } }
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const dump = (p, obj) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj, null, 1) + '\n'); };
const load = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------- exact numbers */
const B = BigInt;
const babs = (a) => (a < 0n ? -a : a);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
const bitlen = (a) => a.toString(2).length; // a > 0
class Q {
  constructor(n, d = 1n) { if (d === 0n) throw new Error('zero denominator'); if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  static of(x) {
    if (x instanceof Q) return x;
    if (typeof x === 'bigint') return new Q(x);
    if (typeof x === 'number') { if (!Number.isSafeInteger(x)) throw new Error('not an integer: ' + x); return new Q(B(x)); }
    const s = String(x).trim().replace(/^\+/, '');
    if (s.includes('/')) { const [a, b] = s.split('/'); return new Q(B(a), B(b)); }
    const neg = s.startsWith('-'); const t = neg ? s.slice(1) : s; const [ip, fp = ''] = t.split('.');
    const v = new Q(B(ip + fp), 10n ** B(fp.length)); return neg ? v.neg() : v;
  }
  add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.of(o); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  abs() { return new Q(babs(this.n), this.d); }
  cmp(o) { o = Q.of(o); const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : (l > r ? 1 : 0); }
  eq(o) { return this.cmp(o) === 0; }
  lt(o) { return this.cmp(o) < 0; }
  le(o) { return this.cmp(o) <= 0; }
  gt(o) { return this.cmp(o) > 0; }
  ge(o) { return this.cmp(o) >= 0; }
  sign() { return this.n < 0n ? -1 : (this.n > 0n ? 1 : 0); }
  toString() { return `${this.n}/${this.d}`; }
}
const qs = (x) => Q.of(x).toString();
const pow10 = (e) => (e >= 0 ? new Q(10n ** B(e)) : new Q(1n, 10n ** B(-e)));
const pow2 = (e) => (e >= 0 ? new Q(1n << B(e)) : new Q(1n, 1n << B(-e)));
const floorQ = (x) => (x.n >= 0n ? x.n / x.d : -((-x.n + x.d - 1n) / x.d));
const ceilQ = (x) => -floorQ(x.neg());
function isqrt(n) { if (n < 2n) return n; let x = 1n << B((bitlen(n) + 1) >> 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }

/* [lower, upper]: two decimals with `digits` significant digits that enclose the rational x (equal iff exact) */
function sci(x, digits = 12) {
  x = Q.of(x);
  if (x.n === 0n) return ['0', '0'];
  const neg = x.n < 0n; const a = x.abs();
  let e = a.n.toString().length - a.d.toString().length;
  while (pow10(e).gt(a)) e -= 1;
  while (pow10(e + 1).le(a)) e += 1;
  const s = a.div(pow10(e - digits + 1));
  const lo = s.n / s.d; const hi = s.d === 1n ? lo : lo + 1n;
  const f = (m, ee) => { if (m === 10n ** B(digits)) { m /= 10n; ee += 1; } const t = m.toString(); return t[0] + '.' + t.slice(1) + 'e' + ee; };
  return neg ? ['-' + f(hi, e), '-' + f(lo, e)] : [f(lo, e), f(hi, e)];
}
/* [lower, upper] decimals enclosing sqrt(X), X a rational >= 0 */
function sciSqrt(X, digits = 12) {
  X = Q.of(X);
  if (X.n === 0n) return ['0', '0'];
  let k = digits + 3, r, y;
  for (;;) { y = X.mul(pow10(2 * k)); r = isqrt(y.n / y.d); if (r >= 10n ** B(digits + 2)) break; k += 5; }
  const exact = new Q(r * r).eq(y);
  return [sci(new Q(r).div(pow10(k)), digits)[0], sci(new Q(exact ? r : r + 1n).div(pow10(k)), digits)[1]];
}
/* a printed decimal -> [value, unit of its last printed digit] */
function parseDec(s) { const t = s.trim().replace(/^\+/, ''); const nd = t.includes('.') ? t.split('.')[1].length : 0; return [Q.of(t), new Q(1n, 10n ** B(nd))]; }
function band(x, printed) { const [d, u] = parseDec(printed); const diff = Q.of(x).sub(d).abs(); return diff.le(u.div(2)) ? 'MATCH' : (diff.le(u) ? 'NEAR' : 'FAR'); }
/* the band of sqrt(X) against a printed number, decided on the squares */
function bandSqrt(X, printed) {
  const [d, u] = parseDec(printed); X = Q.of(X);
  const inside = (w) => { const lo = d.sub(w), hi = d.add(w); return (lo.sign() <= 0 || X.ge(lo.mul(lo))) && hi.sign() >= 0 && X.le(hi.mul(hi)); };
  return inside(u.div(2)) ? 'MATCH' : (inside(u) ? 'NEAR' : 'FAR');
}
/* a bit pattern as an exact rational; null for infinity or NaN */
function decode(bits, fmt) {
  const [ew, fw] = FMT[fmt]; bits = B(bits);
  const e = Number((bits >> B(fw)) & ((1n << B(ew)) - 1n)); const f = bits & ((1n << B(fw)) - 1n); const bias = (1 << (ew - 1)) - 1;
  if (e === (1 << ew) - 1) return null;
  let v;
  if (e === 0) v = new Q(f, 1n << B(bias - 1 + fw));
  else { const m = (1n << B(fw)) | f; const sh = e - bias - fw; v = sh >= 0 ? new Q(m << B(sh)) : new Q(m, 1n << B(-sh)); }
  return (bits >> B(ew + fw)) ? v.neg() : v;
}
/* round a dyadic rational to the format, to nearest, ties to even, by shifting; overflow gives the infinity pattern */
function encode(x, fmt) {
  const [ew, fw] = FMT[fmt]; const bias = (1 << (ew - 1)) - 1; x = Q.of(x);
  const sign = x.n < 0n ? (1n << B(ew + fw)) : 0n; const a = babs(x.n);
  if (a === 0n) return 0n;
  if ((x.d & (x.d - 1n)) !== 0n) throw new Error('encode needs a dyadic rational');
  const k = bitlen(x.d) - 1;
  let e = bitlen(a) - 1 - k; if (e < 1 - bias) e = 1 - bias;
  const sh = fw - e - k; let n;
  if (sh >= 0) n = a << B(sh);
  else { const s = B(-sh); const q = a >> s; const rem = a - (q << s); const half = 1n << (s - 1n); n = q + ((rem > half || (rem === half && (q & 1n) === 1n)) ? 1n : 0n); }
  if (n === (1n << B(fw + 1))) { e += 1; n = 1n << B(fw); }
  if (e > bias) return sign | (((1n << B(ew)) - 1n) << B(fw));
  if (n < (1n << B(fw))) return sign | n;
  return sign | (B(e + bias) << B(fw)) | (n - (1n << B(fw)));
}
/* an independent test that `bits` is t rounded to nearest, ties to even: no neighbour is closer, and on a tie the last
   fraction bit is 0. It does not call encode. */
function nearestOk(t, bits, fmt) {
  const [ew, fw] = FMT[fmt]; bits = B(bits); t = Q.of(t);
  const top = ((1n << B(ew)) - 1n) << B(fw); const mag = bits & ((1n << B(ew + fw)) - 1n);
  if (mag >= top) return false;
  const neg = (bits >> B(ew + fw)) === 1n; const v = decode(bits, fmt);
  if (neg && v.n === 0n && t.sign() > 0) return false;
  const d = v.sub(t).abs(); const limit = pow2(1 << (ew - 1)); const tiny = decode(1n, fmt);
  for (const m2 of [mag - 1n, mag + 1n]) {
    let w;
    if (m2 < 0n) w = neg ? tiny : tiny.neg();
    else if (m2 >= top) w = neg ? limit.neg() : limit;
    else { w = decode(m2, fmt); if (neg) w = w.neg(); }
    const d2 = w.sub(t).abs(); const c = d2.cmp(d);
    if (c < 0 || (c === 0 && (mag & 1n) === 1n)) return false;
  }
  return true;
}
/* |value| of a bf16 pattern in units of 2^-133 (a BigInt); the pattern must be finite */
function units(p) { const e = (p >> 7) & 0xFF, f = p & 0x7F; return e === 0 ? B(f) : B(0x80 | f) << B(e - 1); }
const U133 = 1n << 133n;
const hex4 = (p) => p.toString(16).padStart(4, '0');

/* ---------------------------------------------------------------- bf16 tensors by census */
function u16view(buf) {
  if (os.endianness() !== 'LE') throw new Stop('this decider needs a little-endian host');
  if (buf.byteOffset % 2 === 0) return new Uint16Array(buf.buffer, buf.byteOffset, buf.length >> 1);
  const copy = new Uint8Array(buf.length); copy.set(buf); return new Uint16Array(copy.buffer, 0, buf.length >> 1);
}
function census(buf) { const a = u16view(buf); const c = new Float64Array(65536); for (let i = 0; i < a.length; i++) c[a[i]] += 1; return c; }
function censusSha(c) { const parts = []; for (let p = 0; p < 65536; p++) if (c[p]) parts.push(hex4(p) + ':' + c[p] + '\n'); return sha256(Buffer.from(parts.join(''), 'ascii')); }
function magnitudes(c) { const m = new Float64Array(0x8000); for (let p = 0; p < 0x8000; p++) m[p] = c[p] + c[p | 0x8000]; return m; }
function orderStat(mag, k) { let acc = 0; for (let p = 0; p < 0x8000; p++) { acc += mag[p]; if (acc > k) return p; } throw new Stop('order statistic out of range'); }
function matrixStats(c) {
  const mag = magnitudes(c); let n = 0, nonfinite = 0;
  for (let p = 0; p < 0x8000; p++) { n += mag[p]; if (p >= 0x7F80) nonfinite += mag[p]; }
  const out = { n, nonfinite };
  if (nonfinite || n === 0) return [out, mag];
  let maxAbs = -1; for (let p = 0x7F7F; p >= 0; p--) if (mag[p]) { maxAbs = p; break; }
  let maxSigned = -1; for (let p = 0x7F7F; p >= 0; p--) if (c[p]) { maxSigned = p; break; }
  if (maxSigned < 0) for (let p = 0x8000; p < 0xFF80; p++) if (c[p]) { maxSigned = p; break; }
  const lo = orderStat(mag, Math.floor((n - 1) / 2)), hi = orderStat(mag, Math.floor(n / 2));
  const numAbs = new Q(units(maxAbs)); const numSigned = new Q((maxSigned & 0x8000) ? -units(maxSigned & 0x7FFF) : units(maxSigned));
  const denLower = new Q(units(lo)); const denMean2 = new Q(units(lo) + units(hi), 2n); const zero = new Q(0n);
  const ratio = { abs_over_lower: denLower.sign() > 0 ? numAbs.div(denLower) : zero, abs_over_mean2: denMean2.sign() > 0 ? numAbs.div(denMean2) : zero,
    signed_over_lower: denLower.sign() > 0 ? numSigned.div(denLower) : zero, signed_over_mean2: denMean2.sign() > 0 ? numSigned.div(denMean2) : zero };
  Object.assign(out, { max_abs_bits: hex4(maxAbs), max_signed_bits: hex4(maxSigned), median_lower_bits: hex4(lo), median_upper_bits: hex4(hi), median_lower_is_zero: denLower.sign() === 0,
    ratio: Object.fromEntries(READINGS.map((k) => [k, qs(ratio[k])])), ratio_abs_over_lower_dec: sci(ratio.abs_over_lower, 9) });
  return [out, mag];
}
/* n, the sum and the sum of squares of a bf16 tensor, in units of 2^-133 and 2^-266 */
function sums(c) {
  let n = 0, s = 0n, q = 0n;
  for (let p = 0; p < 0x8000; p++) { const a = c[p], b = c[p | 0x8000]; if (a || b) { const u = units(p); n += a + b; s += B(a - b) * u; q += B(a + b) * u * u; } }
  return [n, s, q];
}

/* ---------------------------------------------------------------- the paper's text (K7) */
function normText(s) {
  s = s.split('\\texttt').join('').split('\\sigma').join('\u03c3').split('\\_').join('_').split('\\%').join('%');
  s = s.split('$').join('').split('{').join('').split('}').join('').split('~').join(' ');
  s = s.split('--').join('-').split('\u2013').join('-').split('\u2212').join('-');
  return s.split(/\s+/).filter((w) => w.length).join(' ');
}
function texFiles(ctx) {
  const p = ctx.pins.paper.tex; const raw = fs.readFileSync(path.join(ctx.root, p.path));
  if (raw.length !== p.bytes || sha256(raw) !== p.sha256) throw new Stop('the TeX archive does not match its pin');
  const tar = zlib.gunzipSync(raw); const out = {}; let off = 0;
  const cstr = (b, a, n) => { const s = b.subarray(a, a + n); const z = s.indexOf(0); return s.subarray(0, z < 0 ? n : z).toString('utf8'); };
  while (off + 512 <= tar.length) {
    const hd = tar.subarray(off, off + 512);
    if (hd.every((x) => x === 0)) break;
    let name = cstr(hd, 0, 100);
    if (hd.subarray(257, 263).toString('latin1') === 'ustar\0') { const pre = cstr(hd, 345, 155); if (pre) name = pre + '/' + name; }
    const size = parseInt(cstr(hd, 124, 12).trim() || '0', 8); const type = hd[156];
    if ((type === 0x30 || type === 0) && name.endsWith('.tex')) out[name.replace(/^[./]+/, '')] = tar.subarray(off + 512, off + 512 + size).toString('utf8');
    off += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}
/* every quoted sentence searched in the pinned TeX. alter = [row, index, from, to] plants a misquote. */
function checkQuotes(ctx, alter) {
  const files = texFiles(ctx);
  const res = { quotes: 0, found: 0, at_stated_lines: 0, missing: [], found_off_the_stated_lines: [] };
  const seen = new Set();
  for (const row of ctx.claims.rows) {
    (row.quotes || []).forEach((q, i) => {
      let text = q.text;
      if (alter && alter[0] === row.id && alter[1] === i) { if (!text.includes(alter[2])) throw new Stop('the planted misquote does not apply'); text = text.split(alter[2]).join(alter[3]); }
      const key = JSON.stringify([text, q.file, q.lines]);
      if (seen.has(key)) return;
      seen.add(key); res.quotes += 1;
      const src = files[q.file]; const needle = normText(text);
      const where = { row: row.id, text, file: q.file, lines: q.lines };
      if (src === undefined || !normText(src).includes(needle)) { res.missing.push(where); return; }
      res.found += 1;
      if (normText(src.split('\n').slice(q.lines[0] - 1, q.lines[1]).join('\n')).includes(needle)) res.at_stated_lines += 1; else res.found_off_the_stated_lines.push(where);
    });
  }
  res.all_found = res.missing.length === 0;
  return res;
}
function requireQuotes(ctx, alter) { const r = checkQuotes(ctx, alter); if (!r.all_found) throw new Stop('K7: a quoted sentence is not in the pinned TeX: ' + JSON.stringify(r.missing)); return r; }

/* ---------------------------------------------------------------- the network */
function request(urlStr, headers, method, allowHttp) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    let lib;
    if (u.protocol === 'https:') lib = https; else if (u.protocol === 'http:' && allowHttp) lib = http; else { reject(new Stop('scheme refused: ' + urlStr.split('?')[0])); return; }
    const req = lib.request(u, { method, headers, agent: false }, (res) => resolve({ res, host: u.host }));
    req.setTimeout(90000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}
class Net {
  constructor(ctx, logname = 'ranges.jsonl') {
    this.ctx = ctx; this.log = path.join(ctx.out, logname); fs.mkdirSync(ctx.out, { recursive: true });
    this.allowHttp = !!ctx.pins.fixture; this.ua = ctx.pins.requests.user_agent; this.retries = Number(ctx.pins.requests.retries_per_range);
    this.pause = Number(ctx.pins.requests.pause_seconds === undefined ? 5 : ctx.pins.requests.pause_seconds); this.seq = 0; this.total = 0; this.hub = new URL(ctx.base).host;
  }
  write(rec) { fs.appendFileSync(this.log, JSON.stringify(rec) + '\n'); }
  async once(url, first, last, sink, method) {
    const hops = []; let cur = url;
    for (let i = 0; i < 6; i++) {
      const hdr = { 'User-Agent': this.ua, Accept: '*/*', 'Accept-Encoding': 'identity' };
      if (first !== null) hdr.Range = `bytes=${first}-${last}`;
      const { res, host } = await request(cur, hdr, method, this.allowHttp);
      const h = res.headers; const g = (k) => (h[k] === undefined ? null : String(h[k]));
      hops.push({ host, status: res.statusCode, commit: g('x-repo-commit'), linked_etag: g('x-linked-etag'), linked_size: g('x-linked-size'), etag: g('etag'), content_range: g('content-range') });
      if (method === 'HEAD') { /* like the hub's own client: follow a redirect only while it stays on the same host */
        res.resume();
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && h.location && new URL(h.location, cur).host === new URL(cur).host) { cur = new URL(h.location, cur).toString(); continue; }
        return { hops, body: null, got: 0, digest: null };
      }
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        res.resume();
        if (!h.location) throw new Error('a redirect without a location');
        cur = new URL(h.location, cur).toString(); continue;
      }
      let want;
      if (first !== null) {
        if (res.statusCode !== 206) { res.destroy(); throw new HttpStatus(res.statusCode); }
        const m = /^bytes (\d+)-(\d+)\/(\d+|\*)$/.exec(h['content-range'] || '');
        if (!m || Number(m[1]) !== first || Number(m[2]) !== last) { res.destroy(); throw new Error(`content-range ${h['content-range']} for bytes ${first}-${last}`); }
        want = last - first + 1;
      } else {
        if (res.statusCode !== 200) { res.destroy(); throw new HttpStatus(res.statusCode); }
        want = h['content-length'] !== undefined ? Number(h['content-length']) : null;
      }
      return await new Promise((resolve, reject) => {
        const hs = crypto.createHash('sha256'); let got = 0; const chunks = [];
        const body = (!sink && want !== null) ? Buffer.alloc(want) : null;
        res.on('data', (c) => {
          hs.update(c);
          if (sink) sink.feed(got, c);
          else if (body) { if (got + c.length > want) { res.destroy(); reject(new Error('long read')); return; } c.copy(body, got); } else chunks.push(c);
          got += c.length;
        });
        res.on('end', () => {
          if (want !== null && got !== want) { reject(new Error(`short read: ${got} of ${want} bytes`)); return; }
          resolve({ hops, body: sink ? null : (body || Buffer.concat(chunks)), got, digest: hs.digest('hex') });
        });
        res.on('aborted', () => reject(new Error('aborted')));
        res.on('error', reject);
      });
    }
    throw new Error('too many redirects');
  }
  /* one request with at most `retries` retries; logs it; checks the commit and LFS hash the server reports */
  async get(url, o = {}) {
    const first = o.first === undefined ? null : o.first, last = o.last === undefined ? null : o.last;
    const kind = o.kind || '', name = o.name || '', method = o.method || 'GET';
    if (url.includes('/main/') || url.endsWith('/main')) throw new Stop('a URL names main');
    let attempt = 0, r, sink, t0;
    for (;;) {
      attempt += 1; t0 = Date.now(); sink = o.sinkFactory ? o.sinkFactory() : null;
      try { r = await this.once(url, first, last, sink, method); break; } catch (e) {
        if (e instanceof Stop) throw e;
        const err = `${e instanceof HttpStatus ? 'HttpStatus' : (e.code || e.name)}: ${e.message}`;
        this.write({ kind, name, url, first, last, attempt, error: err, time_utc: now() });
        const transient = !(e instanceof HttpStatus) || [408, 429, 500, 502, 503, 504].includes(e.status);
        if (o.soft && !transient) return { body: null, rec: { error: err }, sink: null };
        if (attempt > this.retries || !transient) throw new Stop(`request failed (${kind} ${name} ${url}): ${err}`);
        await sleep(this.pause * attempt * 1000);
      }
    }
    const rep = {}; /* what the hub itself reports: the last response from the hub's host that carries each header */
    for (const h of r.hops) if (h.host === this.hub) for (const k of ['commit', 'linked_etag', 'linked_size', 'etag']) if (h[k]) rep[k] = h[k];
    this.seq += 1; this.total += r.got;
    const rec = { n: this.seq, kind, name, method, url, first: first !== null ? first : (r.got ? 0 : null), last: last !== null ? last : (r.got ? r.got - 1 : null), length: r.got,
      sha256: r.digest, time_utc: now(), seconds: Math.round(Date.now() - t0) / 1000, status: r.hops[r.hops.length - 1].status, hosts: r.hops.map((h) => h.host),
      commit: rep.commit || null, lfs_sha256: rep.linked_etag ? rep.linked_etag.replace('W/', '').replace(/^"+|"+$/g, '') : null,
      linked_size: rep.linked_size ? Number(rep.linked_size) : null, etag: rep.etag || null, attempts: attempt };
    this.write(rec);
    if (method === 'GET' && rec.commit !== null && rec.commit !== this.ctx.commit && url.includes('/resolve/' + this.ctx.commit + '/')) throw new Stop(`the server reports commit ${rec.commit} for ${url}`);
    if (o.shard) {
      if (rec.lfs_sha256 !== null && rec.lfs_sha256 !== o.shard.lfs_sha256) throw new Stop(`the server reports LFS sha256 ${rec.lfs_sha256} for ${o.shard.file}`);
      if (rec.linked_size !== null && rec.linked_size !== o.shard.bytes) throw new Stop(`the server reports size ${rec.linked_size} for ${o.shard.file}`);
    }
    return { body: r.body, rec, sink };
  }
}
class Ctx {
  constructor(argv) {
    const opt = { claims: path.join(ROOT, 'corpus', 'qwen-self-rewriting', 'claims.json'), pins: path.join(ROOT, 'corpus', 'qwen-self-rewriting', 'PINS.json'),
      runs: path.join(ROOT, 'corpus', 'qwen-self-rewriting', 'runs', 'stage1'), root: ROOT };
    this.cmd = argv[0] || 'help';
    for (let i = 1; i < argv.length; i += 2) { const k = argv[i].replace(/^--/, ''); if (!argv[i].startsWith('--') || !(k in opt) || argv[i + 1] === undefined) throw new Stop('unknown option ' + argv[i]); opt[k] = argv[i + 1]; }
    this.root = opt.root; this.claims = load(opt.claims); this.pins = load(opt.pins);
    this.claimsSha = sha256(fs.readFileSync(opt.claims)); this.pinsSha = sha256(fs.readFileSync(opt.pins));
    this.out = path.join(opt.runs, ME); this.other = path.join(opt.runs, OTHER);
    const m = this.pins.model; this.commit = m.commit;
    if (!/^[0-9a-f]{40}$/.test(this.commit)) throw new Stop('the pinned commit is not a full hash');
    this.base = m.base_url.replace(/\/+$/, '');
    if (!(this.base === 'https://huggingface.co' || this.pins.fixture)) throw new Stop('base URL refused');
    this.repo = m.repo; this.shards = m.shards;
    this.row = Object.fromEntries(this.claims.rows.map((r) => [r.id, r])); this.names = this.claims.names;
  }
  resolve(file, commit) { return `${this.base}/${this.repo}/resolve/${commit || this.commit}/${file}`; }
  api(commit) { if (!/^[0-9a-f]{40}$/.test(commit)) throw new Stop('not a full commit hash'); return `${this.base}/api/models/${this.repo}/revision/${commit}?blobs=true`; }
  meta() { return { decider: 'tools/qwen-stage1.js', node: process.version, claims_sha256: this.claimsSha, pins_sha256: this.pinsSha, code_sha256: sha256(fs.readFileSync(__filename)), written_utc: now() }; }
  P(id) { return this.row[id].params || {}; }
}
function batteryGuard() {
  let t;
  try { t = cp.execFileSync('pmset', ['-g', 'batt'], { encoding: 'utf8', timeout: 10000 }); } catch (e) { return; }
  const m = /(\d+)%/.exec(t);
  if (t.includes('Battery Power') && m && Number(m[1]) <= 25) throw new Stop(`on battery at ${m[1]}%: stopped`);
}

/* ---------------------------------------------------------------- I1, I2 */
async function listing(net, ctx, commit, kind) {
  const { body, rec } = await net.get(ctx.api(commit), { kind, name: commit, soft: true });
  if (body === null) return { available: false, why: rec.error };
  try {
    const j = JSON.parse(body.toString('utf8')); const files = {};
    for (const s of j.siblings) { const lfs = s.lfs || {}; files[s.rfilename] = { size: lfs.size !== undefined ? lfs.size : (s.size !== undefined ? s.size : null), sha256: lfs.sha256 || null, git_blob: s.blobId || null }; }
    return { available: true, sha: j.sha || null, files, body_sha256: rec.sha256 };
  } catch (e) { return { available: false, why: 'unreadable: ' + e.name, body_sha256: rec.sha256 }; }
}
async function cmdI1(ctx) {
  requireQuotes(ctx);
  const net = new Net(ctx); const api = await listing(net, ctx, ctx.commit, 'api-listing');
  const rows = [], bad = [];
  if (api.available && api.sha !== ctx.commit) bad.push(`the API listing reports commit ${api.sha}`);
  for (const sh of ctx.shards) {
    const { body, rec } = await net.get(ctx.resolve(sh.file), { first: 0, last: 7, kind: 'len8', name: sh.file });
    const n = Number(body.readBigUInt64LE(0));
    const r = { file: sh.file, len8_hex: body.toString('hex'), header_bytes: n, pinned: { bytes: sh.bytes, lfs_sha256: sh.lfs_sha256 }, resolve: { commit: rec.commit, lfs_sha256: rec.lfs_sha256, size: rec.linked_size }, api: null };
    if (rec.commit !== null && rec.commit !== ctx.commit) bad.push(`${sh.file}: resolve reports commit ${rec.commit}`);
    if (rec.lfs_sha256 !== null && rec.lfs_sha256 !== sh.lfs_sha256) bad.push(`${sh.file}: resolve reports LFS sha256 ${rec.lfs_sha256}`);
    if (rec.linked_size !== null && rec.linked_size !== sh.bytes) bad.push(`${sh.file}: resolve reports size ${rec.linked_size}`);
    const gotResolve = rec.lfs_sha256 !== null && rec.linked_size !== null; let gotApi = false;
    if (api.available) {
      const a = api.files[sh.file]; r.api = a || null;
      if (!a) bad.push(`${sh.file}: absent from the API listing`);
      else {
        if (a.sha256 !== null && a.sha256 !== sh.lfs_sha256) bad.push(`${sh.file}: the API listing reports LFS sha256 ${a.sha256}`);
        if (a.size !== null && a.size !== sh.bytes) bad.push(`${sh.file}: the API listing reports size ${a.size}`);
        gotApi = a.sha256 !== null && a.size !== null;
      }
    }
    r.reported_by = [['resolve', gotResolve], ['api', gotApi]].filter((x) => x[1]).map((x) => x[0]);
    if (!r.reported_by.length) bad.push(`${sh.file}: no source reports both its size and its LFS sha256`);
    if (!(n > 0 && n < sh.bytes - 8)) bad.push(`${sh.file}: header length ${n}`);
    rows.push(r);
  }
  dump(path.join(ctx.out, 'i1.json'), { meta: ctx.meta(), row: 'I1', passed: bad.length === 0, failures: bad, commit: ctx.commit,
    rule: 'I1 passes iff, for each shard, at least one of the two sources (the resolve response at the pinned commit; the API listing of that commit) reports its size and its LFS sha256, and no source reports a commit, a size or a hash other than the pinned one',
    api_listing: { available: api.available, sha: api.sha === undefined ? null : api.sha, body_sha256: api.body_sha256 === undefined ? null : api.body_sha256, why: api.why === undefined ? null : api.why }, shards: rows, bytes_read: net.total });
  console.log(`I1 ${bad.length ? 'FAILED: ' + bad.join('; ') : 'PASSED'} (${rows.length} shards; ${net.total} bytes read)`);
  if (bad.length) throw new Stop('I1 failed');
}
async function cmdI2(ctx) {
  const net = new Net(ctx); const names = ctx.shards.map((s) => s.file); const pin = Object.fromEntries(ctx.shards.map((s) => [s.file, s.lfs_sha256]));
  const per = [], otherWeights = {};
  for (const c of ctx.pins.model.commits.ids) {
    let li = await listing(net, ctx, c, 'api-listing-i2');
    const row = { commit: c, source: 'api', lfs_sha256: {} };
    if (li.available && names.some((k) => k in li.files) && names.filter((k) => k in li.files).every((k) => li.files[k].sha256 === null)) li = { available: false };
    if (li.available) {
      for (const k of names) row.lfs_sha256[k] = k in li.files ? li.files[k].sha256 : null;
      for (const [k, v] of Object.entries(li.files)) if (k.endsWith('.safetensors') && !names.includes(k)) { otherWeights[k] = otherWeights[k] || {}; otherWeights[k][c] = v.sha256; }
    } else {
      row.source = 'resolve-head';
      for (const k of names) { const { rec } = await net.get(ctx.resolve(k, c), { kind: 'head-i2', name: c.slice(0, 12) + ':' + k, method: 'HEAD' }); row.lfs_sha256[k] = [200, 301, 302, 303, 307, 308].includes(rec.status) ? rec.lfs_sha256 : null; }
    }
    per.push(row);
  }
  const distinct = Object.fromEntries(names.map((k) => [k, [...new Set(per.map((r) => r.lfs_sha256[k]).filter(Boolean))].sort()]));
  const values = { commits: per.length, per_commit: per, distinct_per_shard: distinct,
    commits_with_all_11_shards: per.filter((r) => names.every((k) => r.lfs_sha256[k])).length,
    commits_with_no_shard: per.filter((r) => !names.some((k) => r.lfs_sha256[k])).map((r) => r.commit),
    commits_with_some_shards: per.filter((r) => names.some((k) => r.lfs_sha256[k]) && !names.every((k) => r.lfs_sha256[k])).map((r) => r.commit),
    every_listed_hash_equals_the_pin: names.every((k) => distinct[k].length === 0 || (distinct[k].length === 1 && distinct[k][0] === pin[k])),
    other_safetensors_files: otherWeights };
  dump(path.join(ctx.out, 'i2.json'), { meta: ctx.meta(), row: 'I2', verdict: 'COMPUTED', values, bytes_read: net.total });
  console.log(`I2 COMPUTED: ${per.length} commits; every listed hash equals the pin: ${values.every_listed_hash_equals_the_pin}; ${net.total} bytes read`);
}

/* ---------------------------------------------------------------- headers */
const numel = (shape) => shape.reduce((p, s) => p * s, 1);
/* every tensor of the 11 headers, with its absolute byte range in its shard */
function tensorsOf(headers, headerBytes) {
  const out = [];
  for (const file of Object.keys(headers).sort()) {
    for (const [name, d] of Object.entries(headers[file])) {
      if (name === '__metadata__') continue;
      const [a, b] = d.data_offsets; const start = 8 + headerBytes[file];
      out.push({ name, file, dtype: d.dtype, shape: [...d.shape], entries: numel(d.shape), length: b - a, first: start + a, last: start + b - 1 });
    }
  }
  return out;
}
const lengthFailures = (T) => T.filter((t) => (DT_BYTES[t.dtype] || 0) * t.entries !== t.length).map((t) => t.name).sort();
function layerOf(name, prefix) {
  if (!name.startsWith(prefix)) return null;
  const rest = name.slice(prefix.length); const dot = rest.indexOf('.'); const i = dot < 0 ? rest : rest.slice(0, dot);
  return /^[0-9]+$/.test(i) ? [Number(i), dot < 0 ? '' : rest.slice(dot + 1)] : null;
}
function rowS3(T) {
  const by = {};
  for (const t of T) { by[t.dtype] = by[t.dtype] || { tensors: 0, entries: 0 }; by[t.dtype].tensors += 1; by[t.dtype].entries += t.entries; }
  const non = T.filter((t) => t.dtype !== 'BF16').map((t) => ({ name: t.name, dtype: t.dtype, shape: t.shape, entries: t.entries })).sort((a, b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)));
  return { verdict: non.length ? 'REFUTED' : 'CERTIFIED', values: { tensors: T.length, by_dtype: by, not_bf16: non, not_bf16_count: non.length, not_bf16_entries: non.reduce((s, x) => s + x.entries, 0) } };
}
function rowE1(T, linearLayers, names, expected) {
  const pre = names.layer_prefix; const per = [], tensors = [];
  for (const i of linearLayers) {
    const found = T.filter((t) => t.name.startsWith(`${pre}${i}.`) && t.name.includes(names.linear_marker) && t.name.includes(names.bias_word)).map((t) => t.name).sort();
    per.push({ layer: i, bias_tensors: found });
    const want = `${pre}${i}.${names.time_step_bias_suffix}`;
    if (found.includes(want)) tensors.push(want);
  }
  const none = per.filter((p) => p.bias_tensors.length === 0).map((p) => p.layer); const many = per.filter((p) => p.bias_tensors.length > 1).map((p) => p.layer);
  const oneNamed = per.every((p) => p.bias_tensors.length === 1 && p.bias_tensors[0] === `${pre}${p.layer}.${names.time_step_bias_suffix}`);
  const v = none.length ? 'REFUTED' : (many.length ? 'REFUSED' : ((oneNamed && per.length === expected) ? 'CERTIFIED' : 'REFUSED'));
  return { verdict: v, values: { linear_attention_layers: per.length, per_layer: per, tensors, count: tensors.length, layers_with_none: none, layers_with_more_than_one: many } };
}
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const nul = (x) => (x === undefined ? null : x);
function headerRows(cfg, T, ctx) {
  const names = ctx.names; const pre = names.layer_prefix; const byname = new Map(T.map((t) => [t.name, t])); const rows = {};
  const tc = cfg.text_config || {}; const lt = tc.layer_types || [];
  const cfgLinear = [], cfgFull = [];
  lt.forEach((x, i) => { if (x === 'linear_attention') cfgLinear.push(i); if (x === 'full_attention') cfgFull.push(i); });
  const lay = new Map();
  for (const t of T) { const lo = layerOf(t.name, pre); if (lo) { if (!lay.has(lo[0])) lay.set(lo[0], []); lay.get(lo[0]).push(t); } }
  const num = (a, b) => a - b;
  const hdrLayers = [...lay.keys()].sort(num);
  const hdrLinear = hdrLayers.filter((i) => lay.get(i).some((t) => t.name.includes(names.linear_marker)));
  const hdrFull = hdrLayers.filter((i) => lay.get(i).some((t) => t.name.includes(names.full_marker)));
  /* S1 */
  let p = ctx.P('S1'); const [w0, w1] = p.window;
  const inWindow = hdrLinear.filter((i) => w0 <= i && i <= w1 && cfgLinear.includes(i));
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const checks = [[`config.json: num_hidden_layers is ${p.layers}`, tc.num_hidden_layers === p.layers],
    [`config.json: layer_types has ${p.layers} entries`, lt.length === p.layers],
    [`headers: the layers are 0 to ${p.layers - 1} and no other`, sameList(hdrLayers, range(p.layers))],
    [`config.json: ${p.linear_layers} linear-attention layers`, cfgLinear.length === p.linear_layers],
    ['headers: the layers with tensors under .linear_attn. are config\'s linear-attention layers', sameList(hdrLinear, cfgLinear)],
    ['layer 62 is a linear-attention layer in both', p.must_be_linear.every((i) => cfgLinear.includes(i) && hdrLinear.includes(i))],
    [`at least ${p.window_min} linear-attention layers lie in ${w0}-${w1}`, inWindow.length >= p.window_min]];
  rows.S1 = { verdict: checks.every((c) => c[1]) ? 'CERTIFIED' : 'REFUTED',
    values: { config: { num_hidden_layers: nul(tc.num_hidden_layers), layer_types_entries: lt.length, linear_attention: cfgLinear, full_attention: cfgFull },
      headers: { layers: hdrLayers.length, with_linear_attn: hdrLinear, with_self_attn: hdrFull, self_attn_layers_equal_config_full_attention: sameList(hdrFull, cfgFull) },
      linear_attention_in_window: inWindow, checks: checks.map((c) => ({ text: c[0], holds: c[1] })), failed: checks.filter((c) => !c[1]).map((c) => c[0]) } };
  /* S2 */
  p = ctx.P('S2'); let t = byname.get(names.layer30_matrix);
  if (!t) rows.S2 = { verdict: 'REFUTED', values: { tensor: names.layer30_matrix, present: false } };
  else {
    const two = t.shape.length === 2; const ok = two && t.shape[0] >= p.rows_needed && p.rows * t.shape[1] === p.weights;
    rows.S2 = { verdict: ok ? 'CERTIFIED' : 'REFUTED', values: { tensor: t.name, present: true, shard: t.file, shape: t.shape, dtype: t.dtype, entries: t.entries, two_axes: two,
      rows_times_columns: two ? p.rows * t.shape[1] : null, rows_needed: p.rows_needed } };
  }
  /* S3 */
  rows.S3 = rowS3(T);
  /* S4 */
  p = ctx.P('S4'); const chosen = [];
  for (const i of p.mlp_layers) { const n = `${pre}${i}.${names.output_matrix_suffixes.mlp}`; if (byname.has(n)) chosen.push(n); }
  const hidden = tc.hidden_size; const cands = []; let tooMany = false;
  for (let i = p.linear_window[0]; i <= p.linear_window[1]; i++) {
    if (!hdrLinear.includes(i)) continue;
    const c = lay.get(i).filter((x) => x.name.includes(names.linear_marker) && x.shape.length === 2 && x.shape[0] === hidden).map((x) => x.name).sort();
    cands.push({ layer: i, candidates: c }); tooMany = tooMany || c.length > 1;
    const n = `${pre}${i}.${names.output_matrix_suffixes.linear}`; if (byname.has(n)) chosen.push(n);
  }
  const N = chosen.reduce((s, n) => s + byname.get(n).entries, 0);
  rows.S4 = { verdict: tooMany ? 'REFUSED' : (chosen.length === p.expected ? 'CERTIFIED' : 'REFUTED'),
    values: { count: chosen.length, entries: N, tensors: chosen.map((n) => ({ name: n, shape: byname.get(n).shape, entries: byname.get(n).entries })),
      candidates_rule: `a tensor under .linear_attn. with two axes whose first axis is config's hidden_size (${hidden === undefined ? 'None' : hidden})`, linear_layers_in_window: cands } };
  /* S5 */
  const gl = ctx.P('S5').groups; const groups = Object.fromEntries([...gl, 'other'].map((g) => [g, { tensors: 0, entries: 0 }]));
  for (const x of T) { const g = gl.find((gg) => x.name.startsWith(gg)) || 'other'; groups[g].tensors += 1; groups[g].entries += x.entries; }
  rows.S5 = { verdict: 'COMPUTED', values: { tensors: T.length, entries: T.reduce((s, x) => s + x.entries, 0), by_group: groups, bytes_of_tensor_data: T.reduce((s, x) => s + x.length, 0) } };
  /* E1, E2 */
  rows.E1 = rowE1(T, hdrLinear, names, ctx.P('E1').expected);
  const e2 = rows.E1.values.tensors.map((n) => { const x = byname.get(n); return { name: n, shard: x.file, first_byte: x.first, last_byte: x.last, dtype: x.dtype, shape: x.shape, entries: x.entries }; });
  rows.E2 = { verdict: 'COMPUTED', values: { tensors: e2, count: e2.length, entries: e2.reduce((s, x) => s + x.entries, 0), dtypes: [...new Set(e2.map((x) => x.dtype))].sort() } };
  /* the output matrices */
  const outm = [];
  for (const i of hdrLayers) for (const kind of ['mlp', 'linear', 'full']) { const n = `${pre}${i}.${names.output_matrix_suffixes[kind]}`; if (byname.has(n)) outm.push({ name: n, layer: i, kind }); }
  return [rows, outm];
}
async function cmdPlan(ctx) {
  requireQuotes(ctx);
  const i1 = load(path.join(ctx.out, 'i1.json'));
  if (!i1.passed || i1.commit !== ctx.commit) throw new Stop('I1 has not passed');
  const net = new Net(ctx); const whole = {}, bodies = {};
  for (const f of ctx.pins.model.files_whole) {
    const { body, rec } = await net.get(ctx.resolve(f.file), { kind: 'file', name: f.file });
    const blob = crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${body.length}\0`, 'latin1'), body])).digest('hex');
    whole[f.file] = { bytes: body.length, sha256: rec.sha256, git_blob: blob, matches_pin: body.length === f.bytes && rec.sha256 === f.sha256_of_fetched_copy && blob === f.git_blob };
    if (!whole[f.file].matches_pin) throw new Stop(`${f.file} at the pinned commit is not the pinned file`);
    bodies[f.file] = body;
  }
  const cfg = JSON.parse(bodies['config.json'].toString('utf8')); const index = JSON.parse(bodies['model.safetensors.index.json'].toString('utf8'));
  const headers = {}, hbytes = {}, hsha = {}; let T;
  try {
    for (const s of i1.shards) {
      const sh = ctx.shards.find((x) => x.file === s.file); const n = s.header_bytes;
      const { body, rec } = await net.get(ctx.resolve(sh.file), { first: 8, last: 8 + n - 1, kind: 'header', name: sh.file, shard: sh });
      fs.mkdirSync(path.join(ctx.out, 'headers'), { recursive: true }); fs.writeFileSync(path.join(ctx.out, 'headers', sh.file + '.header.json'), body);
      hbytes[sh.file] = n; hsha[sh.file] = rec.sha256; headers[sh.file] = JSON.parse(body.toString('utf8'));
    }
    T = tensorsOf(headers, hbytes);
  } catch (e) {
    if (e instanceof Stop) throw e;
    dump(path.join(ctx.out, 'plan.json'), { meta: ctx.meta(), parsed: false, why: `${e.name}: ${e.message}`, rows: Object.fromEntries(['S1', 'S2', 'S3', 'S4'].map((k) => [k, { verdict: 'REFUSED', values: { why: 'a header cannot be parsed' } }])) });
    throw new Stop('a header cannot be parsed');
  }
  const [rows, outm] = headerRows(cfg, T, ctx);
  const byname = new Map(T.map((t) => [t.name, t])); const size = Object.fromEntries(ctx.shards.map((s) => [s.file, s.bytes])); const wm = index.weight_map || {};
  const count = new Map(); for (const t of T) count.set(t.name, (count.get(t.name) || 0) + 1);
  const checks = { length_failures: lengthFailures(T), names_twice: [...count.entries()].filter((x) => x[1] > 1).map((x) => x[0]).sort(),
    past_the_end: T.filter((t) => t.last >= size[t.file]).map((t) => t.name).sort(),
    tensor_bytes_plus_header_fill_each_shard: Object.keys(size).every((f) => 8 + hbytes[f] + T.filter((t) => t.file === f).reduce((s, t) => s + t.length, 0) === size[f]),
    index_names_equal_header_names: sameList(Object.keys(wm).sort(), [...byname.keys()].sort()), index_shard_differs: Object.keys(wm).filter((n) => byname.has(n) && wm[n] !== byname.get(n).file).sort() };
  if (checks.length_failures.length || checks.names_twice.length || checks.past_the_end.length) throw new Stop('a header is inconsistent: ' + JSON.stringify(checks));
  const need = outm.map((m) => ({ ...byname.get(m.name), layer: m.layer, kind: m.kind, role: 'output-matrix' }));
  for (const x of rows.E2.values.tensors) need.push({ ...byname.get(x.name), role: 'time-step-bias' });
  const bad = need.filter((t) => t.role === 'output-matrix' && (t.dtype !== 'BF16' || t.shape.length !== 2)).map((t) => t.name);
  if (bad.length) throw new Stop('an output matrix is not a two-axis BF16 tensor: ' + bad.join(', '));
  const lines = [];
  for (const s of ctx.shards) { lines.push([s.file, 0, 7, 'len8', '-']); lines.push([s.file, 8, 8 + hbytes[s.file] - 1, 'header', '-']); }
  for (const f of ctx.pins.model.hashed_whole) lines.push([f, 0, size[f] - 1, 'whole', '-']);
  for (const t of need) lines.push([t.file, t.first, t.last, 'tensor', t.name]);
  const cmpS = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
  lines.sort((a, b) => cmpS(a[0], b[0]) || a[1] - b[1] || a[2] - b[2] || cmpS(a[3], b[3]) || cmpS(a[4], b[4]));
  const text = lines.map((x) => `${x[0]}\t${x[1]}\t${x[2]}\t${x[3]}\t${x[4]}\n`).join('');
  fs.writeFileSync(path.join(ctx.out, 'ranges.tsv'), text, 'ascii');
  need.sort((a, b) => cmpS(a.file, b.file) || a.first - b.first);
  const plan = { meta: ctx.meta(), parsed: true, commit: ctx.commit, files_whole: whole, header_bytes: hbytes, header_sha256: hsha, checks, rows, tensors: need, ranges: lines.length,
    ranges_sha256: sha256(Buffer.from(text, 'ascii')), bytes_planned: lines.reduce((s, x) => s + x[2] - x[1] + 1, 0), bytes_read: net.total };
  dump(path.join(ctx.out, 'plan.json'), plan);
  console.log(`plan: ${T.length} tensors in the headers, ${need.length} needed, ${lines.length} ranges, ${plan.bytes_planned} bytes planned; ranges sha256 ${plan.ranges_sha256}`);
  for (const k of ['S1', 'S2', 'S3', 'S4', 'E1']) console.log(`  ${k} ${rows[k].verdict}`);
}

/* ---------------------------------------------------------------- the edit (E2, E3, E4) */
function words(buf, dtype) {
  const w = DT_BYTES[dtype]; const out = [];
  for (let i = 0; i + w <= buf.length; i += w) out.push(w === 2 ? B(buf.readUInt16LE(i)) : (w === 4 ? B(buf.readUInt32LE(i)) : buf.readBigUInt64LE(i)));
  return out;
}
function packBits(bits, dtype) {
  const w = DT_BYTES[dtype]; const b = Buffer.alloc(bits.length * w);
  bits.forEach((x, i) => { if (w === 2) b.writeUInt16LE(Number(x), i * 2); else if (w === 4) b.writeUInt32LE(Number(x), i * 4); else b.writeBigUInt64LE(x, i * 8); });
  return b;
}
/* the edit y = x + c of one tensor under each reading */
function editTensor(buf, dtype, c) {
  const xb = words(buf, dtype); const x = xb.map((b) => decode(b, dtype));
  if (x.some((v) => v === null)) return { base_nonfinite: x.filter((v) => v === null).length };
  const INF = 0x7F80n; const R = {};
  R.a = { dtype, bits: x.map((v) => encode(v.add(c), dtype)) };
  R.b = { dtype: 'BF16', bits: x.map((v) => encode(v.add(c), 'BF16')) };
  const mid = x.map((v) => encode(v.add(c), 'F32')); const midv = mid.map((b) => decode(b, 'F32'));
  R.c = { dtype: 'BF16', bits: midv.map((v) => (v === null ? INF : encode(v, 'BF16'))), mid };
  if (dtype !== 'BF16') {
    const first = x.map((v) => encode(v, 'BF16')); const fv = first.map((b) => decode(b, 'BF16'));
    R.d = { dtype: 'BF16', bits: fv.map((v) => (v === null ? INF : encode(v.add(c), 'BF16'))), mid: first };
  }
  for (const r of Object.values(R)) { r.values = r.bits.map((b) => decode(b, r.dtype)); r.bytes = packBits(r.bits, r.dtype); }
  return { x, readings: R, base_nonfinite: 0 };
}
/* recompute every y against x + cCheck with the independent test; the number of entries that fail, per reading */
function roundingFailures(E, cCheck) {
  const out = {}; const x = E.x;
  for (const [k, r] of Object.entries(E.readings)) {
    let bad = 0;
    for (let i = 0; i < x.length; i++) {
      let ok;
      if (k === 'a' || k === 'b') ok = nearestOk(x[i].add(cCheck), r.bits[i], r.dtype);
      else if (k === 'c') { const m = decode(r.mid[i], 'F32'); ok = nearestOk(x[i].add(cCheck), r.mid[i], 'F32') && m !== null && nearestOk(m, r.bits[i], 'BF16'); }
      else { const m = decode(r.mid[i], 'BF16'); ok = nearestOk(x[i], r.mid[i], 'BF16') && m !== null && nearestOk(m.add(cCheck), r.bits[i], 'BF16'); }
      if (!ok) bad += 1;
    }
    out[k] = bad;
  }
  return out;
}
const qeq = (a, b) => (a === null || b === null ? a === b : a.eq(b));
/* E2 (with hashes), E3, E4 and the specification object, from the base bytes of the time-step bias tensors */
function editRows(ctx, plan, base, constant) {
  const c = Q.of(constant); const e1 = plan.rows.E1; const tens = plan.rows.E2.values.tensors; const keys = ['a', 'b', 'c', 'd'];
  const specT = [], e2T = []; const tot = { entries: 0, base_nonfinite: 0, ns: 0, nb: 0, nob: 0, differ: 0 };
  const pair = {}; const nonfiniteY = {}, fails = {}, diffs = {}, cat = {}; const used = new Set();
  for (const k of keys) { nonfiniteY[k] = 0; fails[k] = 0; diffs[k] = new Map(); cat[k] = crypto.createHash('sha256'); }
  let xmin = null, xmax = null;
  for (const t of tens) {
    const buf = base[t.name]; const E = (t.dtype in FMT) ? editTensor(buf, t.dtype, c) : { base_nonfinite: null, unsupported: true };
    e2T.push({ ...t, sha256: sha256(buf) }); tot.entries += t.entries;
    const head = { name: t.name, shard: t.shard, first_byte: t.first_byte, last_byte: t.last_byte, dtype: t.dtype, shape: t.shape, entries: t.entries, sha256_base: sha256(buf) };
    if (!E.readings) { tot.base_nonfinite += E.base_nonfinite || 0; specT.push({ ...head, edited: null }); continue; }
    const x = E.x, R = E.readings; const app = keys.filter((k) => k in R); app.forEach((k) => used.add(k));
    x.forEach((v, i) => {
      if (xmin === null || v.lt(xmin)) xmin = v;
      if (xmax === null || v.gt(xmax)) xmax = v;
      const t0 = v.add(c);
      if (!qeq(decode(encode(t0, t.dtype), t.dtype), t0)) tot.ns += 1;
      if (!qeq(decode(encode(t0, 'BF16'), 'BF16'), t0)) tot.nb += 1;
      if (t.dtype !== 'BF16' && !qeq(decode(encode(v, 'BF16'), 'BF16'), v)) tot.nob += 1;
      const ys = app.map((k) => R[k].values[i]);
      if (ys.some((y) => !qeq(y, ys[0]))) tot.differ += 1;
      for (let a = 0; a < app.length; a++) for (let b = a + 1; b < app.length; b++) if (!qeq(ys[a], ys[b])) pair[app[a] + app[b]] = (pair[app[a] + app[b]] || 0) + 1;
      app.forEach((k, j) => { const y = ys[j]; if (y === null) nonfiniteY[k] += 1; else { const d = y.sub(v); const key = d.toString(); const e = diffs[k].get(key); if (e) e.count += 1; else diffs[k].set(key, { d, count: 1 }); } });
    });
    for (const [k, n] of Object.entries(roundingFailures(E, c))) fails[k] += n;
    for (const k of app) cat[k].update(R[k].bytes);
    specT.push({ ...head, edited: Object.fromEntries(app.map((k) => [k, { dtype: R[k].dtype, bytes: R[k].bytes.length, sha256: sha256(R[k].bytes) }])) });
  }
  const applicable = keys.filter((k) => used.has(k)); const realised = {}; const catHex = Object.fromEntries(applicable.map((k) => [k, cat[k].digest('hex')]));
  for (const k of applicable) {
    const ds = [...diffs[k].values()].sort((a, b) => a.d.cmp(b.d)); const hit = diffs[k].get(c.toString());
    realised[k] = { distinct: ds.length, min: ds.length ? qs(ds[0].d) : null, max: ds.length ? qs(ds[ds.length - 1].d) : null, entries_equal_to_the_constant: hit ? hit.count : 0,
      list_sha256: sha256(Buffer.from(ds.map((x) => qs(x.d) + '\n').join(''), 'ascii')), list: ds.length <= 16 ? ds.map((x) => ({ difference: qs(x.d), entries: x.count })) : null };
  }
  const stored = [...new Set(tens.map((t) => t.dtype))].sort(); const rows = {};
  rows.E2 = { verdict: 'COMPUTED', values: { tensors: e2T, count: e2T.length, entries: tot.entries, dtypes: stored } };
  const onlyBf16 = stored.length === 1 && stored[0] === 'BF16';
  rows.E3 = { verdict: 'COMPUTED', values: {
    constant: qs(c), stored_dtypes: stored,
    constant_representable: Object.fromEntries([...new Set([...stored, 'BF16'])].sort().map((d) => [d, (d in FMT) ? qeq(decode(encode(c, d), d), c) : null])),
    entries: tot.entries, base_nonfinite: tot.base_nonfinite,
    entries_where_x_plus_constant_is_not_representable_in_the_stored_dtype: tot.ns,
    entries_where_x_plus_constant_is_not_representable_in_bf16: tot.nb,
    base_entries_bf16_cannot_hold: onlyBf16 ? null : tot.nob,
    base_min: xmin !== null ? qs(xmin) : null, base_max: xmax !== null ? qs(xmax) : null,
    base_min_dec: xmin !== null ? sci(xmin, 9) : null, base_max_dec: xmax !== null ? sci(xmax, 9) : null,
    realised_y_minus_x: realised } };
  const okAll = applicable.length > 0 && specT.every((s) => s.edited !== null);
  const finite = okAll && tot.base_nonfinite === 0 && applicable.every((k) => nonfiniteY[k] === 0);
  const checked = okAll && applicable.every((k) => fails[k] === 0);
  const verdict = e1.verdict === 'REFUTED' ? 'REFUTED' : ((e1.verdict === 'CERTIFIED' && finite && checked && tot.differ === 0) ? 'CERTIFIED' : 'REFUSED');
  const pick = (o) => Object.fromEntries(applicable.map((k) => [k, o[k]]));
  rows.E4 = { verdict, values: { E1: e1.verdict, constant: qs(c), readings: applicable, every_y_finite: finite, nonfinite_y: pick(nonfiniteY), rounding_check_failures: pick(fails), entries: tot.entries,
    entries_where_readings_differ: tot.differ, entries_where_two_readings_differ: Object.fromEntries(Object.keys(pair).sort().map((k) => [k, pair[k]])), edited_sha256_all_tensors: catHex,
    note: 'CERTIFIED here also needs both deciders to write identical bytes; the recorder checks it' } };
  let spec = null;
  if (e1.verdict === 'CERTIFIED') {
    spec = { what: "Our rebuild of session 8's edit from its description in the paper (time-step bias +0.5 in all 48 linear-attention layers). It is ours. It is not the authors' file.",
      model: { repo: ctx.repo, commit: ctx.commit }, constant: qs(c),
      readings: { a: "y = x + c as an exact sum, rounded once to nearest, ties to even, in the tensor's stored dtype", b: 'the same sum rounded once to bf16', c: 'the sum rounded to binary32, then to bf16',
        d: 'x rounded to bf16 first, then the sum rounded once to bf16 (only if the stored dtype is not BF16)' },
      tensors: specT, entries: tot.entries, entries_where_readings_differ: tot.differ, edited_sha256_all_tensors: catHex };
  }
  return [rows, spec];
}
const specText = (spec) => JSON.stringify(spec, null, 1) + '\n';
/* the specification is written only when E1 is CERTIFIED (spec is null otherwise) */
function writeSpec(p, spec) { if (spec === null) return null; const text = specText(spec); fs.writeFileSync(p, text, 'ascii'); return sha256(Buffer.from(text, 'ascii')); }

/* ---------------------------------------------------------------- the arithmetic rows (A1-A6) */
const pct = (x) => Q.of(x).mul(100);
function comb(n, k) { let r = 1n; for (let i = 1n; i <= B(k); i++) r = r * (B(n) - B(k) + i) / i; return r; }
/* P[X >= a] for X ~ Binomial(n, 1/2), exact */
function binomTail(n, a) { let s = 0n; let c = comb(n, a); for (let k = a; k <= n; k++) { s += c; c = c * B(n - k) / B(k + 1); } return new Q(s, 1n << B(n)); }
/* the integers k with lo <= k <= hi (rational ends) */
function intsIn(lo, hi) { const out = []; for (let k = ceilQ(lo); k <= floorQ(hi); k++) out.push(Number(k)); return out; }
function arithmeticRows(ctx, s4Entries, varN) {
  const rows = {};
  /* A1 */
  let p = ctx.P('A1'); const A = p.answers;
  const countsFor = (printed, strict) => {
    const [d, u] = parseDec(printed);
    return intsIn(d.sub(u.div(2)).mul(A).div(100), d.add(u.div(2)).mul(A).div(100)).filter((k) => !strict || pct(new Q(B(k), B(A))).sub(d).abs().lt(u.div(2)));
  };
  const pairs = p.pairs.map((x) => { const diff = x.only_edit - x.only_base; const ch = pct(new Q(B(diff), B(A)));
    return { label: x.label, only_edit: x.only_edit, only_base: x.only_base, difference: diff, change_points: qs(ch), change_points_dec: sci(ch, 9), printed_change: x.printed_change, band: band(ch, x.printed_change) }; });
  const bases = (strict) => {
    const out = [];
    for (const Bc of countsFor(p.base_printed, strict)) {
      if (!p.pairs.every((x) => countsFor(x.printed_accuracy, strict).includes(Bc + x.only_edit - x.only_base))) continue;
      const [d, u] = parseDec(p.session1.printed_change);
      const c1 = countsFor(p.session1.printed_accuracy, strict).filter((k) => { const g = pct(new Q(B(k - Bc), B(A))).sub(d).abs(); return strict ? g.lt(u.div(2)) : g.le(u.div(2)); });
      if (!c1.length) continue;
      out.push({ B: Bc, base_percent: qs(pct(new Q(B(Bc), B(A)))), base_percent_dec: sci(pct(new Q(B(Bc), B(A))), 9),
        edited: p.pairs.map((x) => { const k = Bc + x.only_edit - x.only_base; const v = pct(new Q(B(k), B(A))); const [dd, uu] = parseDec(x.printed_accuracy);
          return { label: x.label, correct: k, percent: qs(v), printed: x.printed_accuracy, exact_tie: v.sub(dd).abs().eq(uu.div(2)) }; }),
        session1_correct_counts: c1 });
    }
    return out;
  };
  rows.A1 = { verdict: 'COMPUTED', values: { answers: A, pairs, base_counts_ties_allowed: bases(false), base_counts_ties_excluded: bases(true),
    rule: 'B is kept when each printed accuracy and change is within half a unit of the last printed digit of the value B gives; a value exactly half a unit away is a tie' } };
  /* A2 */
  p = ctx.P('A2'); const z = Q.of(p.z);
  rows.A2 = { verdict: 'COMPUTED', values: { z: p.z, intervals: p.intervals.map((x) => { const lo = Q.of(x.lo), hi = Q.of(x.hi), ch = parseDec(x.printed_change)[0]; const mid = lo.add(hi).div(2), half = hi.sub(lo).div(2);
    return { label: x.label, lo: x.lo, hi: x.hi, midpoint: qs(mid), half_width: qs(half), half_width_over_z: qs(half.div(z)), half_width_over_z_dec: sci(half.div(z), 9), printed_change: x.printed_change, midpoint_minus_printed_change: qs(mid.sub(ch)) }; }) } };
  /* A3 */
  p = ctx.P('A3'); const tests = [];
  for (const x of p.sign_tests) {
    let cands;
    if ('a' in x) cands = [x.a]; else { const [d, u] = parseDec(x.derive.printed_accuracy); cands = intsIn(d.sub(u.div(2)).mul(x.derive.problems).div(100), d.add(u.div(2)).mul(x.derive.problems).div(100)); }
    for (const a of cands) {
      const n = a + x.b; const pv = binomTail(n, a);
      const t = { label: x.label, a, b: x.b, n, p: qs(pv), p_dec: sci(pv, 9), count_derived: 'derive' in x };
      if ('bound_exp' in x) { t.printed_bound = `10^${x.bound_exp}`; t.p_below_printed_bound = pv.lt(pow10(x.bound_exp)); t.p_below_a_tenth_of_it = pv.lt(pow10(x.bound_exp - 1)); }
      if ('printed_p' in x) { t.printed_p = x.printed_p; t.band = band(pv, x.printed_p); }
      tests.push(t);
    }
  }
  const N = p.flips;
  rows.A3 = { verdict: 'COMPUTED', values: { sign_tests: tests, flips: N,
    smallest_p_from_flips: { as_count_over_flips: { zero_count: '0/1', one_count: qs(new Q(1n, B(N))) }, as_count_plus_one_over_flips_plus_one: { zero_count: qs(new Q(1n, B(N + 1))), zero_count_dec: sci(new Q(1n, B(N + 1)), 9) } },
    permutation_p_not_computable: 'the per-problem differences are not printed' } };
  /* A4 */
  rows.A4 = { verdict: 'COMPUTED', values: { pairs: ctx.P('A4').pairs.map((x) => { const [c0, cu] = parseDec(x.correct), [t0, tu] = parseDec(x.cut); const h = new Q(100n);
    const lo = c0.sub(cu.div(2)).div(h.sub(t0.sub(tu.div(2)))), hi = c0.add(cu.div(2)).div(h.sub(t0.add(tu.div(2)))), pt = c0.div(h.sub(t0));
    return { label: x.label, correct: x.correct, out_of_tokens: x.cut, low: qs(lo), high: qs(hi), from_printed_values: qs(pt), low_dec: sci(lo, 9)[0], high_dec: sci(hi, 9)[1], from_printed_values_dec: sci(pt, 9) }; }),
  assumes: 'no answer that ran out of tokens counts as correct' } };
  /* A5 */
  p = ctx.P('A5'); const nb = p.benchmarks.length, per = p.per_benchmark_problems; const cols = {}, solved = {};
  for (const k of ['base', 'damaged', 'repaired']) {
    const tot = p.benchmarks.reduce((s, b) => s.add(Q.of(b[k])), new Q(0n)); const mean = tot.div(nb);
    cols[k] = { sum: qs(tot), mean: qs(mean), mean_dec: sci(mean, 9), printed: p.pooled_printed[k], band: band(mean, p.pooled_printed[k]), problems_solved: qs(tot.mul(per).div(100)) };
    solved[k] = tot.mul(per).div(100);
  }
  const ident = p.benchmarks.map((b) => { const l = Q.of(b.damaged).mul(per).div(100).add(b.right).sub(b.wrong), r = Q.of(b.repaired).mul(per).div(100);
    return { name: b.name, damaged_plus_right_minus_wrong: qs(l), repaired: qs(r), holds: l.eq(r) }; });
  const right = p.benchmarks.reduce((s, b) => s + b.right, 0), wrong = p.benchmarks.reduce((s, b) => s + b.wrong, 0);
  const quot = p.quotients.map((x) => { let v = Q.of(x.num).div(Q.of(x.den)); if (x.percent) v = v.mul(100); return { label: x.label, value: qs(v), value_dec: sci(v, 9), printed: x.printed, in_percent: x.percent, band: band(v, x.printed) }; });
  const nm = p.named_matrix; const baseSolved = Q.of(nm.base_printed).mul(nm.problems).div(100); const after = baseSolved.sub(nm.named_fails_base_solves).add(nm.named_solves_base_fails);
  const ds = p.distance; const a = Q.of(ds.repaired_norm), b = Q.of(ds.published_norm), cs = Q.of(ds.cosine); const d2 = a.mul(a).add(b.mul(b)).sub(cs.mul(2).mul(a).mul(b));
  rows.A5 = { verdict: 'COMPUTED', values: {
    columns: cols, changed: { right_sum: right, wrong_sum: wrong, printed_right: p.pooled_printed.right, printed_wrong: p.pooled_printed.wrong, sums_equal_printed: right === p.pooled_printed.right && wrong === p.pooled_printed.wrong },
    per_benchmark: ident, pooled_identity_holds: solved.damaged.add(right).sub(wrong).eq(solved.repaired), quotients: quot,
    quotients_from_counts: { repaired_over_base_percent: qs(solved.repaired.div(solved.base).mul(100)), repaired_over_base_percent_dec: sci(solved.repaired.div(solved.base).mul(100), 9),
      repaired_over_damaged: qs(solved.repaired.div(solved.damaged)), repaired_over_damaged_dec: sci(solved.repaired.div(solved.damaged), 9) },
    named_matrix: { base_solved: qs(baseSolved), base_minus_lost_plus_gained: qs(after), printed_solved: nm.solved_named, holds: after.eq(nm.solved_named) },
    distance: { from_the_three_printed_numbers_squared: qs(d2), from_the_three_printed_numbers_dec: sciSqrt(d2, 9), printed: ds.printed_distance, band: bandSqrt(d2, ds.printed_distance),
      formula: 'sqrt(a^2 + b^2 - 2 cos a b) with a = 39.7, b = 3.85, cos = 0.002' } } };
  /* A6 */
  p = ctx.P('A6'); const v = { changed: p.changed, entries_of_the_20_matrices: s4Entries };
  if (s4Entries) { const share = pct(new Q(B(p.changed), B(s4Entries))); Object.assign(v, { percent: qs(share), percent_dec: sci(share, 9), printed_percent: p.printed_percent, band: band(share, p.printed_percent) }); }
  const k2 = Q.of(p.strength).mul(p.strength); const ps = Q.of(p.printed_sigma);
  v.with_the_printed_sigma = { expected_norm_squared: qs(k2.mul(ps).mul(ps).mul(p.overwritten)), expected_norm_dec: sciSqrt(k2.mul(ps).mul(ps).mul(p.overwritten), 9), standard_deviation_dec: sciSqrt(k2.mul(ps).mul(ps).div(2), 9) };
  if (varN !== null) v.with_the_exact_sigma = { expected_norm_squared: qs(k2.mul(varN).mul(p.overwritten)), expected_norm_dec: sciSqrt(k2.mul(varN).mul(p.overwritten), 9),
    standard_deviation_squared: qs(k2.mul(varN).div(2)), standard_deviation_dec: sciSqrt(k2.mul(varN).div(2), 9) };
  v.printed_norm = p.printed_norm; v.formulas = 'expected norm 200 sigma sqrt(139,264); standard deviation 200 sigma / sqrt(2)';
  rows.A6 = { verdict: 'COMPUTED', values: v };
  return rows;
}

/* ---------------------------------------------------------------- the run */
/* sha256 of chosen byte intervals of a stream */
class Intervals {
  constructor(items) { this.items = [...items].sort((a, b) => a[0] - b[0] || a[1] - b[1]); this.h = new Map(this.items.map((x) => [x[2], crypto.createHash('sha256')])); this.i = 0; }
  feed(pos, chunk) {
    const end = pos + chunk.length;
    while (this.i < this.items.length && this.items[this.i][1] < pos) this.i += 1;
    for (let j = this.i; j < this.items.length && this.items[j][0] < end; j++) {
      const [a, b, k] = this.items[j]; const lo = Math.max(a, pos), hi = Math.min(b + 1, end);
      if (lo < hi) this.h.get(k).update(chunk.subarray(lo - pos, hi - pos));
    }
  }
}
const rowsOf = (buf, shape, firstRow, lastRow) => buf.subarray(firstRow * shape[1] * 2, (lastRow + 1) * shape[1] * 2);
/* W1-W5 from the per-matrix records and the layer-30 matrix's census and rows */
function weightRows(ctx, mats, l30) {
  const rows = {}; const name30 = ctx.names.layer30_matrix; let varN = null; const U266 = U133 * U133;
  if (l30 === null || l30.stats.nonfinite) {
    for (const k of ['W1', 'W2', 'W3']) rows[k] = { verdict: 'REFUSED', values: { why: 'the layer-30 matrix was not read, or holds a value that is not finite' } };
  } else {
    const [n, s, q] = l30.sums; const nn = B(n);
    varN = new Q(nn * q - s * s, (nn * nn) << 266n); const varN1 = new Q(nn * q - s * s, (nn * (nn - 1n)) << 266n);
    const pr = ctx.P('W1').printed; const b0 = bandSqrt(varN, pr), b1 = bandSqrt(varN1, pr);
    rows.W1 = { verdict: b0 !== b1 ? 'REFUSED' : { MATCH: 'CERTIFIED', FAR: 'REFUTED', NEAR: 'REFUSED' }[b0],
      values: { tensor: name30, shape: l30.shape, entries: n, sha256: l30.sha256, census_sha256: l30.census_sha256, sum: qs(new Q(s, U133)), sum_of_squares: qs(new Q(q, U266)), mean_dec: sci(new Q(s, U133 * nn), 9),
        variance_dividing_by_n: qs(varN), variance_dividing_by_n_minus_1: qs(varN1), sd_dividing_by_n_dec: sciSqrt(varN), sd_dividing_by_n_minus_1_dec: sciSqrt(varN1), printed: pr,
        band_dividing_by_n: b0, band_dividing_by_n_minus_1: b1 } };
    const r2 = {}, r3 = {}; const p2 = ctx.P('W2'), p3 = ctx.P('W3');
    for (const [key, off] of (l30.rows !== null ? [['rows_counted_from_0', 0], ['rows_counted_from_1', -1]] : [])) {
      const f = p2.first_row + off, la = p2.last_row + off; const R = l30.rows[key]; const ss = new Q(R.q, U266); const mx = new Q(units(R.max_abs), U133);
      r2[key] = { first_row_from_0: f, last_row_from_0: la, entries: R.n, sha256_of_the_rows: R.sha256, sum_of_squares: qs(ss), norm_dec: sciSqrt(ss), band: bandSqrt(ss, p2.printed) };
      r3[key] = { first_row_from_0: f, last_row_from_0: la, largest_abs_bits: hex4(R.max_abs), largest_abs: qs(mx), largest_abs_dec: sci(mx), band: band(mx, p3.printed) };
    }
    for (const [k, r, pr2] of [['W2', r2, p2.printed], ['W3', r3, p3.printed]]) {
      if (l30.rows === null) { rows[k] = { verdict: 'REFUSED', values: { why: 'the matrix has fewer rows than the row range needs' } }; continue; }
      const bs = ['rows_counted_from_0', 'rows_counted_from_1'].map((x) => r[x].band);
      rows[k] = { verdict: bs[0] === 'MATCH' ? 'CERTIFIED' : (bs.every((b) => b === 'FAR') ? 'REFUTED' : 'REFUSED'), values: { tensor: name30, printed: pr2, readings: r } };
    }
  }
  /* W4 */
  const p4 = ctx.P('W4'); const others = mats.filter((m) => m.name !== name30);
  const v4 = { printed: p4.printed, matrices: others.length, by_kind: Object.fromEntries(['mlp', 'linear', 'full'].map((k) => [k, others.filter((m) => m.kind === k).length])),
    nonfinite_matrices: others.filter((m) => m.nonfinite).map((m) => m.name), per_matrix: others };
  if (others.length !== p4.others || v4.nonfinite_matrices.length) rows.W4 = { verdict: 'REFUSED', values: { ...v4, why: 'the other output matrices are not 127 finite matrices' } };
  else {
    const rd = {}; const sub = others.filter((m) => m.kind === 'mlp' || m.kind === 'linear');
    const best = (list, k) => list.reduce((mx, m) => { const r = Q.of(m.ratio[k]); return mx === null || r.gt(mx) ? r : mx; }, null);
    for (const k of READINGS) {
      const b = best(others, k), bsub = best(sub, k);
      rd[k] = { M: qs(b), M_dec: sci(b), attained_by: others.filter((m) => Q.of(m.ratio[k]).eq(b)).map((m) => m.name), band: band(b, p4.printed),
        M_over_the_matrices_E3_names: qs(bsub), M_over_the_matrices_E3_names_dec: sci(bsub), matrices_E3_names: sub.length,
        attained_by_among_them: sub.filter((m) => Q.of(m.ratio[k]).eq(bsub)).map((m) => m.name), band_among_them: band(bsub, p4.printed) };
    }
    const bs = READINGS.map((k) => rd[k].band);
    v4.readings = rd; v4.matrices_with_median_zero = others.filter((m) => m.median_lower_is_zero).map((m) => m.name);
    rows.W4 = { verdict: bs[0] === 'MATCH' ? 'CERTIFIED' : (bs.every((b) => b === 'FAR') ? 'REFUTED' : 'REFUSED'), values: v4 };
  }
  /* W5 */
  if (l30 === null || l30.stats.nonfinite) rows.W5 = { verdict: 'COMPUTED', values: { why: 'the layer-30 matrix was not read, or holds a value that is not finite' } };
  else {
    const st = l30.stats, mag = l30.mag, n = l30.sums[0]; const p5 = ctx.P('W5'); const m = p5.entries_changed_max;
    const klo = Math.floor((n - 1) / 2), khi = Math.floor(n / 2); const val = (pp) => new Q(units(pp), U133);
    const at = (k) => ((k >= 0 && k <= n - 1) ? val(orderStat(mag, k)) : (k < 0 ? new Q(0n) : null));
    const loL = at(klo - m), hiL = at(klo + m); const loM = at(klo - m).add(at(khi - m)).div(2);
    const hiM = (at(klo + m) !== null && at(khi + m) !== null) ? at(klo + m).add(at(khi + m)).div(2) : null;
    const implied = p5.pairs.map((x) => { const [a, au] = parseDec(x.num), [b, bu] = parseDec(x.den); const lo = a.sub(au.div(2)).div(b.add(bu.div(2))), hi = a.add(au.div(2)).div(b.sub(bu.div(2)));
      return { label: x.label, low: qs(lo), high: qs(hi), low_dec: sci(lo, 9)[0], high_dec: sci(hi, 9)[1], meets_the_range_lower_middle: hi.ge(loL) && (hiL === null || lo.le(hiL)),
        meets_the_range_mean_of_two: hi.ge(loM) && (hiM === null || lo.le(hiM)) }; });
    const mx = val(parseInt(st.max_abs_bits, 16)), ml = val(parseInt(st.median_lower_bits, 16)), mu = val(parseInt(st.median_upper_bits, 16));
    rows.W5 = { verdict: 'COMPUTED', values: { tensor: name30, entries: n,
      base: { largest_abs: qs(mx), largest_abs_dec: sci(mx, 9), median_lower_middle: qs(ml), median_lower_middle_dec: sci(ml, 9), median_mean_of_two: qs(ml.add(mu).div(2)), ratio: st.ratio, ratio_abs_over_lower_dec: st.ratio_abs_over_lower_dec },
      entries_that_may_differ: m,
      median_range_lower_middle: { low: qs(loL), high: hiL !== null ? qs(hiL) : null, low_dec: sci(loL, 9), high_dec: hiL !== null ? sci(hiL, 9) : null },
      median_range_mean_of_two: { low: qs(loM), high: hiM !== null ? qs(hiM) : null, low_dec: sci(loM, 9), high_dec: hiM !== null ? sci(hiM, 9) : null },
      implied_by_the_printed_numbers: implied,
      note: "1397, 10.1 and 0.108 belong to copies that are not public; a null upper end means the copy's median is not bounded above" } };
  }
  return [rows, varN];
}
/* one output matrix: its record for W4, and for the layer-30 matrix what W1-W5 need */
function processMatrix(t, buf, ctx) {
  const counts = census(buf); const [st, mag] = matrixStats(counts);
  const rec = { name: t.name, layer: t.layer, kind: t.kind, shape: t.shape, entries: st.n, sha256: sha256(buf), census_sha256: censusSha(counts), nonfinite: st.nonfinite };
  for (const [k, v] of Object.entries(st)) if (k !== 'n' && k !== 'nonfinite') rec[k] = v;
  let l30 = null;
  if (t.name === ctx.names.layer30_matrix) {
    const p = ctx.P('W2'); let rr = {}; let bad = false;
    for (const [key, off] of [['rows_counted_from_0', 0], ['rows_counted_from_1', -1]]) {
      if (t.shape[0] <= p.last_row) { rr = null; break; }
      const sl = rowsOf(buf, t.shape, p.first_row + off, p.last_row + off); const cs = census(sl); const [n, , q] = sums(cs); const mg = magnitudes(cs);
      let mx = -1, nf = 0; for (let pp = 0x7FFF; pp >= 0; pp--) { if (mg[pp] && mx < 0) mx = pp; if (pp >= 0x7F80) nf += mg[pp]; }
      rr[key] = { n, q, sha256: sha256(sl), max_abs: mx, nonfinite: nf }; bad = bad || nf > 0;
    }
    l30 = { shape: t.shape, sha256: rec.sha256, census_sha256: rec.census_sha256, stats: bad ? { ...st, nonfinite: 1 } : st, mag, sums: sums(counts), rows: rr };
  }
  return [rec, l30];
}
async function cmdRun(ctx) {
  requireQuotes(ctx);
  const plan = load(path.join(ctx.out, 'plan.json'));
  if (!plan.parsed || plan.commit !== ctx.commit) throw new Stop('no plan');
  const mine = fs.readFileSync(path.join(ctx.out, 'ranges.tsv')); const theirsPath = path.join(ctx.other, 'ranges.tsv');
  if (!fs.existsSync(theirsPath) || !fs.readFileSync(theirsPath).equals(mine)) throw new Stop("the two deciders' range lists are not equal; no tensor is read");
  batteryGuard();
  const net = new Net(ctx); const tStart = Date.now(); const shard = Object.fromEntries(ctx.shards.map((s) => [s.file, s])); const T = plan.tensors;
  /* shard 11, whole */
  const streamSha = {}, whole = {};
  for (const f of ctx.pins.model.hashed_whole) {
    const items = [[0, 8 + plan.header_bytes[f] - 1, '__len8_and_header__'], ...T.filter((t) => t.file === f).map((t) => [t.first, t.last, t.name])];
    const { rec, sink } = await net.get(ctx.resolve(f), { kind: 'whole', name: f, sinkFactory: () => new Intervals(items), shard: shard[f] });
    whole[f] = { bytes: rec.length, sha256: rec.sha256, equals_lfs_sha256: rec.sha256 === shard[f].lfs_sha256 && rec.length === shard[f].bytes };
    if (!whole[f].equals_lfs_sha256) throw new Stop(`${f} hashed whole is not the pinned file`);
    for (const [k, h] of sink.h) streamSha[k] = h.digest('hex');
    console.log(`whole ${f} sha256 equals the LFS value; ${rec.length} bytes in ${Math.round(rec.seconds)} s`);
  }
  /* one range per tensor */
  const mats = [], base = {}, sameAsStream = []; let l30 = null;
  for (let i = 0; i < T.length; i++) {
    const t = T[i];
    if (i % 16 === 0) batteryGuard();
    let { body, rec } = await net.get(ctx.resolve(t.file), { first: t.first, last: t.last, kind: 'tensor', name: t.name, shard: shard[t.file] });
    if (t.name in streamSha) {
      sameAsStream.push({ name: t.name, equal: streamSha[t.name] === rec.sha256 });
      if (streamSha[t.name] !== rec.sha256) throw new Stop(`${t.name}: the range and the whole stream differ`);
    }
    if (t.role === 'output-matrix') { const [m, l] = processMatrix(t, body, ctx); mats.push(m); l30 = l || l30; } else base[t.name] = Buffer.from(body);
    body = null;
    console.log(`${String(i + 1).padStart(3)}/${T.length} ${t.name} ${rec.length} bytes ${rec.seconds.toFixed(1)} s`);
  }
  const order = ['mlp', 'linear', 'full'];
  mats.sort((a, b) => a.layer - b.layer || order.indexOf(a.kind) - order.indexOf(b.kind));
  const rows = {}; for (const k of ['S1', 'S2', 'S3', 'S4', 'S5', 'E1']) rows[k] = plan.rows[k];
  const [wrows, varN] = weightRows(ctx, mats, l30); Object.assign(rows, wrows);
  const [erows, spec] = editRows(ctx, plan, base, ctx.P('E4').constant); Object.assign(rows, erows);
  rows.E4.values.specification_sha256 = writeSpec(path.join(ctx.out, 'session8-edit-spec.json'), spec);
  Object.assign(rows, arithmeticRows(ctx, plan.rows.S4.values.entries, varN));
  dump(path.join(ctx.out, 'results.json'), { meta: ctx.meta(), commit: ctx.commit, rows,
    integrity: { hashed_whole: whole, ranges_equal_to_the_whole_stream: sameAsStream, len8_and_header_sha256_in_the_stream: streamSha.__len8_and_header__ === undefined ? null : streamSha.__len8_and_header__ },
    bytes_read: net.total, requests: net.seq, seconds: Math.round((Date.now() - tStart) / 100) / 10 });
  console.log(`run: ${net.total} bytes in ${net.seq} requests, ${Math.round((Date.now() - tStart) / 1000)} s`);
  for (const k of Object.keys(rows).sort()) console.log(`  ${k} ${rows[k].verdict}`);
}

/* ---------------------------------------------------------------- the controls */
function k6() {
  let cases = 0; const bad = [];
  for (const printed of ['0.0111', '3.85', '0.071', '162.3']) {
    const [d, u] = parseDec(printed); const eps = u.div(1000000); const h = u.div(2);
    const list = [[d.add(h), 'MATCH'], [d.sub(h), 'MATCH'], [d, 'MATCH'], [d.add(h).add(eps), 'NEAR'], [d.sub(h).sub(eps), 'NEAR'], [d.add(u), 'NEAR'], [d.sub(u), 'NEAR'],
      [d.add(u).add(eps), 'FAR'], [d.sub(u).sub(eps), 'FAR'], [d.add(u.mul(3)), 'FAR'], [d.sub(u.mul(3)), 'FAR']];
    for (const [x, want] of list) {
      cases += 2;
      if (band(x, printed) !== want) bad.push(`band(${qs(x)}, ${printed})`);
      if (bandSqrt(x.mul(x), printed) !== want) bad.push(`band_sqrt(${qs(x)}^2, ${printed})`);
    }
  }
  /* the hand-worked matrix: 2 rows x 3 columns, 0.5 -0.25 1.0 / 0.0 2.0 -1.5 */
  const buf = Buffer.alloc(12); [0x3F00, 0xBE80, 0x3F80, 0x0000, 0x4000, 0xBFC0].forEach((p, i) => buf.writeUInt16LE(p, 2 * i));
  const counts = census(buf); const [n, s, q] = sums(counts); const [st] = matrixStats(counts); const [n2, , q2] = sums(census(rowsOf(buf, [2, 3], 1, 1)));
  const nn = B(n); const U266 = U133 * U133;
  const got = { entries: n, sum: qs(new Q(s, U133)), sum_of_squares: qs(new Q(q, U266)), variance_dividing_by_n: qs(new Q(nn * q - s * s, (nn * nn) << 266n)),
    variance_dividing_by_n_minus_1: qs(new Q(nn * q - s * s, (nn * (nn - 1n)) << 266n)), largest_abs_bits: st.max_abs_bits, largest_signed_bits: st.max_signed_bits,
    median_lower_bits: st.median_lower_bits, median_upper_bits: st.median_upper_bits, ratio_abs_over_lower: st.ratio.abs_over_lower, ratio_abs_over_mean2: st.ratio.abs_over_mean2,
    second_row_sum_of_squares: qs(new Q(q2, U266)), second_row_entries: n2, 'second_row_norm_band_against_2.5': bandSqrt(new Q(q2, U266), '2.5') };
  const hand = { entries: 6, sum: '7/4', sum_of_squares: '121/16', variance_dividing_by_n: '677/576', variance_dividing_by_n_minus_1: '677/480', largest_abs_bits: '4000', largest_signed_bits: '4000',
    median_lower_bits: '3f00', median_upper_bits: '3f80', ratio_abs_over_lower: '4/1', ratio_abs_over_mean2: '8/3', second_row_sum_of_squares: '25/4', second_row_entries: 3, 'second_row_norm_band_against_2.5': 'MATCH' };
  const equal = Object.keys(hand).every((k) => got[k] === hand[k]) && Object.keys(got).length === Object.keys(hand).length;
  return { edge_cases: cases, edge_failures: bad, hand_worked_matrix: { computed: got, by_hand: hand, equal }, caught: bad.length === 0 && equal };
}
function k7(ctx) {
  const base = checkQuotes(ctx); const pl = ctx.claims.controls.find((c) => c.id === 'K7').planted;
  const alt = checkQuotes(ctx, [pl.row, pl.quote, pl.from, pl.to]);
  let stops = false; try { requireQuotes(ctx, [pl.row, pl.quote, pl.from, pl.to]); } catch (e) { if (e instanceof Stop) stops = true; else throw e; }
  return { planted_stops_the_stage: stops, quotes_searched: base.quotes, found: base.found, at_the_stated_lines: base.at_stated_lines, missing: base.missing, found_off_the_stated_lines: base.found_off_the_stated_lines,
    planted: pl, planted_missing: alt.missing, caught: base.all_found && alt.missing.length === 1 && !alt.all_found && stops };
}
function unitTests() {
  let seed = 20261122 >>> 0;
  const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rint = (n) => Math.floor(rnd() * n);
  const dv = new DataView(new ArrayBuffer(8));
  const f64bits = (x) => { dv.setFloat64(0, x, true); return dv.getBigUint64(0, true); };
  const f32bits = (x) => { dv.setFloat32(0, x, true); return B(dv.getUint32(0, true)); };
  const t = {};
  const known = [[0x3F80, new Q(1n)], [0xBFC0, new Q(-3n, 2n)], [0x0001, new Q(1n, 1n << 133n)], [0x0080, new Q(1n, 1n << 126n)], [0x7F7F, new Q(255n << 127n, 128n)], [0x3F00, new Q(1n, 2n)]];
  t.bf16_known_values = { cases: known.length + 2, failures: known.filter(([b, v]) => !qeq(decode(b, 'BF16'), v)).length + (decode(0x7F80, 'BF16') !== null ? 1 : 0) + (decode(0xFFC1, 'BF16') !== null ? 1 : 0) };
  let bad = 0, n = 0;
  for (let p = 0; p < 0x10000; p++) if ((p & 0x7FFF) < 0x7F80 && p !== 0x8000) { n += 1; if (encode(decode(p, 'BF16'), 'BF16') !== B(p)) bad += 1; }
  for (let p = 0; p < 0x7F80; p++) { n += 1; if (!new Q(units(p), U133).eq(decode(p, 'BF16'))) bad += 1; }
  t.bf16_every_finite_pattern_round_trips = { cases: n, failures: bad };
  bad = 0; n = 0;
  for (let i = 0; i < 20000; i++) {
    const x = (rnd() * 8 - 4) * Math.pow(2, rint(291) - 160); n += 1;
    if (encode(decode(f64bits(x), 'F64'), 'F32') !== f32bits(Math.fround(x))) bad += 1;
  }
  t.binary32_rounding_against_the_hardware = { cases: n, failures: bad };
  bad = 0; n = 0;
  for (let i = 0; i < 20000; i++) {
    const b = (rint(65536) * 65536 + rint(65536)) >>> 0;
    if ((b & 0x7F800000) === 0x7F800000) continue;
    let trick = ((b + 0x7FFF + ((b >>> 16) & 1)) / 65536) & 0xFFFF;
    const v = decode(b, 'F32'); if (v.n === 0n) trick &= 0x7FFF;
    const got = Number(encode(v, 'BF16')); n += 1;
    if (got !== trick && !(got === 0 && trick === 0x8000)) bad += 1;
  }
  t.bf16_rounding_against_the_bit_formula = { cases: n, failures: bad };
  bad = 0; n = 0;
  for (let i = 0; i < 5000; i++) {
    const p = rint(0x7F7F); const mid = decode(p, 'BF16').add(decode(p + 1, 'BF16')).div(2); const even = p % 2 === 0 ? p : p + 1; n += 2;
    if (encode(mid, 'BF16') !== B(even)) bad += 1;
    if (encode(mid.neg(), 'BF16') !== B(0x8000 | even)) bad += 1;
  }
  t.bf16_ties_go_to_even = { cases: n, failures: bad };
  bad = 0; n = 0;
  for (const fmt of ['BF16', 'F32', 'F16', 'F64']) {
    const [ew, fw] = FMT[fmt];
    for (let i = 0; i < 4000; i++) {
      let b = 0n; for (let j = 0; j < ew + fw + 1; j += 16) b = (b << 16n) | B(rint(65536));
      b &= (1n << B(ew + fw + 1)) - 1n;
      const v = decode(b, fmt); if (v === null) continue;
      for (const c of [new Q(1n, 2n), new Q(1n, 4n), new Q(-1n, 2n)]) for (const out of ['BF16', 'F32']) {
        const y = encode(v.add(c), out); if (decode(y, out) === null) continue;
        n += 1; if (!nearestOk(v.add(c), y, out)) bad += 1;
        const wrong = y ^ 1n; n += 1; if (nearestOk(v.add(c), wrong, out) && !qeq(decode(wrong, out), decode(y, out))) bad += 1;
      }
    }
  }
  t.rounding_of_exact_sums_against_the_nearest_test = { cases: n, failures: bad };
  if (typeof Math.f16round === 'function') {
    bad = 0; n = 0; const d16 = new DataView(new ArrayBuffer(2));
    for (let i = 0; i < 20000; i++) { const x = (rnd() * 8 - 4) * Math.pow(2, rint(48) - 28); d16.setFloat16(0, x, true); n += 1; if (encode(decode(f64bits(x), 'F64'), 'F16') !== B(d16.getUint16(0, true))) bad += 1; }
    t.binary16_rounding_against_the_hardware = { cases: n, failures: bad };
  }
  const eqa = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const exp = [[sci(new Q(1n, 3n), 5), ['3.3333e-1', '3.3334e-1']], [sci(new Q(1n, 8n), 5), ['1.2500e-1', '1.2500e-1']], [sci(new Q(-2n, 3n), 4), ['-6.667e-1', '-6.666e-1']],
    [sci(new Q(999999n, 1000n), 3), ['9.99e2', '1.00e3']], [sciSqrt(new Q(2n), 6), ['1.41421e0', '1.41422e0']], [sciSqrt(new Q(9n, 4n), 6), ['1.50000e0', '1.50000e0']],
    [sci(new Q(162300001n, 1000000n), 6), ['1.62300e2', '1.62301e2']], [qs(binomTail(4, 3)), '5/16'], [qs(binomTail(66, 66)), '1/' + (1n << 66n)]];
  t.decimal_enclosures_and_the_sign_test = { cases: exp.length, failures: exp.filter(([a, b]) => !eqa(a, b)).length };
  t.all_pass = Object.values(t).every((v) => v.failures === 0);
  return t;
}
function cmdOffline(ctx) {
  const out = { meta: ctx.meta(), K6: k6(), K7: k7(ctx), unit_tests: unitTests() };
  dump(path.join(ctx.out, 'offline.json'), out);
  console.log(`K6 ${out.K6.caught ? 'caught' : 'NOT CAUGHT'}: ${out.K6.edge_cases} edge cases, ${out.K6.edge_failures.length} failures; the hand-worked matrix equal: ${out.K6.hand_worked_matrix.equal}`);
  const k = out.K7;
  console.log(`K7 ${k.caught ? 'caught' : 'NOT CAUGHT'}: ${k.quotes_searched} quotes searched, ${k.found} found, ${k.at_the_stated_lines} at the stated lines; the planted misquote missing: ${k.planted_missing.length === 1}`);
  for (const [name, v] of Object.entries(out.unit_tests)) if (typeof v === 'object') console.log(`unit ${name}: ${v.cases} cases, ${v.failures} failures`);
  if (!(out.K6.caught && k.caught && out.unit_tests.all_pass)) throw new Stop('an offline control failed');
}
async function cmdControls(ctx) {
  const plan = load(path.join(ctx.out, 'plan.json')); const res = load(path.join(ctx.out, 'results.json'));
  const planted = Object.fromEntries(ctx.claims.controls.map((c) => [c.id, c.planted]));
  const net = new Net(ctx, 'ranges-controls.jsonl'); const shard = Object.fromEntries(ctx.shards.map((s) => [s.file, s]));
  const T = Object.fromEntries(plan.tensors.map((t) => [t.name, t])); const out = { meta: ctx.meta() }; const name30 = ctx.names.layer30_matrix;
  /* K1 */
  const t = T[name30]; const p = ctx.P('W2'); const c = t.shape[1];
  const a = t.first + p.first_row * c * 2, b = t.first + (p.last_row + 1) * c * 2 - 1; const late = planted.K1.late_bytes;
  const r0 = (await net.get(ctx.resolve(t.file), { first: a, last: b, kind: 'control-K1-on-time', name: name30, shard: shard[t.file] })).rec;
  const r1 = (await net.get(ctx.resolve(t.file), { first: a + late, last: b + late, kind: 'control-K1-late', name: name30, shard: shard[t.file] })).rec;
  const recorded = res.rows.W2.values.readings.rows_counted_from_0.sha256_of_the_rows;
  out.K1 = { first_byte: a, last_byte: b, late_bytes: late, recorded_sha256: recorded, on_time_sha256: r0.sha256, late_sha256: r1.sha256, on_time_equals_recorded: r0.sha256 === recorded,
    late_differs_from_recorded: r1.sha256 !== recorded, caught: r0.sha256 === recorded && r1.sha256 !== recorded };
  /* K2 */
  const headers = {};
  for (const s of ctx.shards) headers[s.file] = JSON.parse(fs.readFileSync(path.join(ctx.out, 'headers', s.file + '.header.json'), 'utf8'));
  const allT = tensorsOf(headers, plan.header_bytes);
  const gone = `${ctx.names.layer_prefix}${planted.K2.delete_layer}.${ctx.names.time_step_bias_suffix}`;
  const linear = res.rows.S1.values.headers.with_linear_attn;
  const e1 = rowE1(allT.filter((x) => x.name !== gone), linear, ctx.names, ctx.P('E1').expected);
  const tmp = path.join(ctx.out, 'K2-must-not-exist.json'); if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  const fakePlan = { rows: { E1: e1, E2: { values: { tensors: plan.rows.E2.values.tensors.filter((x) => x.name !== gone) } } } };
  /* K3 reads the base bytes again; K2 uses them to show that no specification is built */
  const base = {};
  for (const x of plan.rows.E2.values.tensors) { const { body } = await net.get(ctx.resolve(x.shard), { first: x.first_byte, last: x.last_byte, kind: 'control-K3', name: x.name, shard: shard[x.shard] }); base[x.name] = Buffer.from(body); }
  const spec2 = editRows(ctx, fakePlan, base, ctx.P('E4').constant)[1]; const wrote = writeSpec(tmp, spec2);
  out.K2 = { deleted: gone, E1: e1.verdict, count: e1.values.count, layers_with_none: e1.values.layers_with_none, specification_written: wrote !== null || fs.existsSync(tmp),
    caught: e1.verdict === 'REFUTED' && e1.values.count === plan.rows.E2.values.tensors.length - 1 && wrote === null && !fs.existsSync(tmp) };
  /* K3 */
  const e2 = Object.fromEntries(res.rows.E2.values.tensors.map((x) => [x.name, x.sha256]));
  const sameBase = Object.keys(e2).every((n) => base[n] && sha256(base[n]) === e2[n]) && Object.keys(e2).length === Object.keys(base).length;
  const cw = Q.of(planted.K3.constant), cr = Q.of(ctx.P('E4').constant); const rej = {};
  for (const x of plan.rows.E2.values.tensors) {
    if (!(x.dtype in FMT)) continue;
    const E = editTensor(base[x.name], x.dtype, cw);
    if (E.readings) for (const [k, n] of Object.entries(roundingFailures(E, cr))) rej[k] = (rej[k] || 0) + n;
  }
  const spec3 = editRows(ctx, plan, base, planted.K3.constant)[1]; const wrongSha = spec3 ? sha256(Buffer.from(specText(spec3), 'ascii')) : null;
  const realSha = res.rows.E4.values.specification_sha256;
  const specAgain = editRows(ctx, plan, base, ctx.P('E4').constant)[1]; const againSha = specAgain ? sha256(Buffer.from(specText(specAgain), 'ascii')) : null;
  out.K3 = { constant: planted.K3.constant, base_bytes_equal_the_recorded: sameBase, entries_rejected_by_the_check: rej, specification_sha256_with_the_wrong_constant: wrongSha, specification_sha256: realSha,
    rebuilt_with_the_right_constant_equals_recorded: againSha === realSha,
    caught: Object.keys(rej).length > 0 && Object.values(rej).every((v) => v > 0) && wrongSha !== null && wrongSha !== realSha && againSha === realSha && sameBase };
  /* K4 */
  const target = planted.K4.tensor; const f = allT.find((x) => x.name === target).file;
  const alt = JSON.parse(JSON.stringify(headers)); alt[f][target].dtype = planted.K4.dtype_to;
  const altT = tensorsOf(alt, plan.header_bytes); const s3 = rowS3(altT); const listed = s3.values.not_bf16.some((x) => x.name === target); const lf = lengthFailures(altT);
  out.K4 = { tensor: target, header_of: f, dtype_to: planted.K4.dtype_to, S3: s3.verdict, S3_lists_the_tensor: listed, length_check_failures: lf, length_check_failures_without_the_change: lengthFailures(allT),
    caught: listed && s3.verdict === 'REFUTED' && lf.length === 1 && lf[0] === target && lengthFailures(allT).length === 0 };
  /* K5 */
  batteryGuard();
  const { body, rec } = await net.get(ctx.resolve(t.file), { first: t.first, last: t.last, kind: 'control-K5', name: name30, shard: shard[t.file] });
  const w1 = res.rows.W1.values; const cs0 = censusSha(census(body)); const same = rec.sha256 === w1.sha256 && cs0 === w1.census_sha256;
  body[planted.K5.byte] ^= (1 << planted.K5.bit);
  const shaFlip = sha256(body), csFlip = censusSha(census(body));
  out.K5 = { tensor: name30, byte: planted.K5.byte, bit: planted.K5.bit, reread_equals_recorded: same, sha256: w1.sha256, sha256_after_the_flip: shaFlip, census_sha256: w1.census_sha256,
    census_sha256_after_the_flip: csFlip, caught: same && shaFlip !== w1.sha256 && csFlip !== w1.census_sha256 };
  out.bytes_read = net.total;
  dump(path.join(ctx.out, 'controls.json'), out);
  for (const k of ['K1', 'K2', 'K3', 'K4', 'K5']) console.log(`${k} ${out[k].caught ? 'caught' : 'NOT CAUGHT'}`);
}

async function main(argv) {
  try {
    const ctx = new Ctx(argv);
    const cmds = { offline: cmdOffline, i1: cmdI1, i2: cmdI2, plan: cmdPlan, run: cmdRun, controls: cmdControls };
    if (!(ctx.cmd in cmds)) { console.log('usage: node tools/qwen-stage1.js offline | i1 | i2 | plan | run | controls  [--claims F --pins F --runs DIR --root DIR]'); return 2; }
    await cmds[ctx.cmd](ctx);
    return 0;
  } catch (e) {
    if (e instanceof Stop) { console.error('STOP: ' + e.message); return 1; }
    throw e;
  }
}
if (require.main === module) main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
module.exports = { Q, sci, sciSqrt, band, bandSqrt, decode, encode, nearestOk, census, censusSha, matrixStats, sums, Net, Ctx, Intervals };
