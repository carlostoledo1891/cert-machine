#!/usr/bin/env node
/* verify_fei.js — the registry's C71 > 6.521845710923046575 (the Fourier entropy–influence constant) decided a second
   time, and planted claims of known truth decided by both implementations: certs/fei-second.json.

   THE FIRST IMPLEMENTATION is instruments/fei/fei.py (Python, Decimal intervals at 60 digits; run by
   tools/run-fei-ledger.py into certs/fei-ledger.json). THIS ONE shares no code with it, and none with the claimant
   (check_c71_n18.py is pinned by sha256 in meta.json, not stored here, never run): JavaScript BigInt, written from the
   registry's definitions (71a.md, pinned) and the artifact's stated convention. It imports one module of this
   repository, instruments/verdict.js, for the three words. fei.py runs through tools/fei-second-harness.py, which imports it
   unchanged and decides nothing itself.

   WHAT IS DECIDED, from the pinned artifact (every file against meta.json's sha256 first — a mismatch refuses the run):
     the truth table   bit x of true_hex set <=> f(x) = -1 (TRUE); a bit at or beyond 2^n refuses;
     the binding       sha256 of the 2^n values written "1" / "-1" and joined by commas = the artifact's sha256_table;
     the spectrum      a_S = 2^n fhat(S) = sum_x f(x) (-1)^{|S ∩ x|} in integers, axis by axis, and 52 coefficients
                       summed again straight from the definition;
     balance           a_∅ = 0;   Parseval   sum_S a_S^2 = 4^n;
     the influence     I = sum_S |S| a_S^2 / 4^n exactly — and again with no Fourier at all, as the edge boundary
                       sum_i Pr_x[f(x) != f(x xor e_i)] — both against the artifact's stated I;
     the entropy       H = sum_S w_S log2(1/w_S), w_S = a_S^2/4^n (71a.md's log2), IN CLOSED FORM: with |a_S| = 2^v m,
                       m odd = prod p^e,  H = A - sum_p B_p log2 p, A and every B_p an exact rational. log2 p = e' +
                       ln(p/2^e')/ln 2 with both logarithms from the atanh series at P bits, every term and the tail
                       bound rounded outward (ln 2 = 2 atanh(1/3)). The few log2 p are the only approximation in the
                       whole decision; everything else is an exact rational, compared exactly;
     the bound         R = H/(I - 1), the amplification rule (O'Donnell–Tan 2013; Hod 2017 Prop 1.2 — cited, not
                       re-proved; it needs g balanced, H > 0, I > 1), against the bar by the 'gt' line of
                       instruments/verdict.js read over exact rationals (its decide() takes doubles): CERTIFIED iff
                       R_lo > bar, REFUTED iff R_hi <= bar, REFUSED otherwise. A failed precondition REFUSES and stops;
                       it is never composed into a refutation. A REFUTED lower bound is a statement about this
                       certificate (its ratio is proved not above the bar), never about C71;
     monotone          the artifact's second claim, exhaustively: x ⊂ y and f(x) TRUE => f(y) TRUE; REFUTED with the
                       witness (x, i) when it fails.

   PLANTED CLAIMS (truth by construction, by the first implementation's record, or by Arb at 1024 bits computed from
   fei.py's own spectrum — never by the decider being measured), decided by both, fei.py's own word recorded beside its
   reading in the three words, and the two required to agree. Ids a–d are the ones the referee asked for; e1–e8 are
   added.

   FOUND AND FIXED. At fei.py 5825dc47… (commit 470fe0b2) these claims found its verdict two-worded, its printed
   enclosure truncated, log2 of a power of two inexact and its dictator refused for the wrong reason; fei.py was
   corrected on 2026-10-19. What was found is kept, verified against that commit's record when git holds it, in the
   record's findingsAtPin.

   usage: node tools/verify_fei.js           both implementations, the Arb reference, the planted claims → certs/fei-second.json
          node tools/verify_fei.js --check   the battery: everything re-derived (Arb too when python-flint is present) and
                                             compared with the record; nothing written                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const V = require(path.join(ROOT, 'instruments', 'verdict.js'));
const { CERTIFIED, REFUTED, REFUSED } = V;
const DIR = 'corpus/optimization-constants/num2026';
const OUT = path.join(ROOT, 'certs', 'fei-second.json');
const HARNESS = path.join(ROOT, 'tools', 'fei-second-harness.py');
const ARBPY = path.join(ROOT, 'instruments', 'zetahankel', '.venv', 'bin', 'python');
const CHECK = process.argv.includes('--check');
const BITS = 512, LOWBITS = 128, ARBPREC = 1024, SHOW = 80;
const T0 = Date.now();
const die = (m) => { console.error('VERIFY_FEI REFUSED: ' + m); process.exit(1); };
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/* ---- exact rationals: [numerator, denominator], denominator > 0, reduced ---------------------------------------- */
const gcd = (a, b) => { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => { if (d === 0n) throw new Error('a zero denominator'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const add = ([a, b], [c, d]) => Q(a * d + c * b, b * d);
const sub = ([a, b], [c, d]) => Q(a * d - c * b, b * d);
const mul = ([a, b], [c, d]) => Q(a * c, b * d);
const div = ([a, b], [c, d]) => Q(a * d, b * c);
const cmp = ([a, b], [c, d]) => { const l = a * d, r = c * b; return l > r ? 1 : l < r ? -1 : 0; };
const ZERO = Q(0n), ONE = Q(1n);
const qstr = ([n, d]) => (d === 1n ? String(n) : n + '/' + d);
const fromDec = (s) => { const m = /^(\d+)(?:\.(\d+))?$/.exec(s); if (!m) throw new Error('not a decimal: ' + s); const f = m[2] || ''; return Q(BigInt(m[1] + f), 10n ** BigInt(f.length)); };
const fromFrac = (s) => { const m = /^(\d+)(?:\/(\d+))?$/.exec(String(s)); if (!m) throw new Error('not a fraction: ' + s); return Q(BigInt(m[1]), BigInt(m[2] || '1')); };
const ulp = (k) => Q(1n, 10n ** BigInt(k));
/* n/d at k decimals, rounded toward -inf (up = false) or +inf (up = true) — an outward-rounded print, never a truncation */
const toDec = ([n, d], k, up) => {
  const s = 10n ** BigInt(k);
  let t = (n * s) / d;
  const r = (n * s) % d;
  if (r !== 0n) { if (up && n > 0n) t += 1n; if (!up && n < 0n) t -= 1n; }
  const neg = t < 0n, u = neg ? -t : t;
  return (neg ? '-' : '') + (u / s) + (k ? '.' + (u % s).toString().padStart(k, '0') : '');
};
const decimalsOf = (s) => (s.split('.')[1] || '').length;
/* a small positive rational as d.dd·10^-k, rounded up: for widths */
const sciUp = (q) => { let k = 0; while (cmp(mul(q, Q(10n ** BigInt(k))), ONE) < 0) k++; const m = toDec(mul(q, Q(10n ** BigInt(k))), 2, true); return m + 'e-' + k; };

/* ---- logarithms: atanh(a/b), 0 <= a < b, as integers [lo, hi] at scale 2^P ------------------------------------------ */
function atanh(a, b, P) {
  const D = 1n << BigInt(P), a2 = a * a, b2 = b * b;
  let lo = 0n, hi = 0n, num = a, den = b;                         /* z^(2j+1) = num/den */
  for (let q = 1n; ; q += 2n) {
    const N = num * D, M = den * q, fl = N / M;
    lo += fl; hi += N % M === 0n ? fl : fl + 1n;                   /* each term floored into lo, ceiled into hi */
    num *= a2; den *= b2;                                           /* the tail after this term is at most z^(q+2)/((q+2)(1 - z^2)) */
    if (num * b2 * D < den * (q + 2n) * (b2 - a2)) return [lo, hi + 1n];   /* the tail is below one unit: one unit up covers it */
  }
}
const LOG2 = new Map();
/* log2 p for an odd integer p >= 3, as exact rationals [lo, hi]: e + ln(p/2^e)/ln 2, ln(p/2^e) = 2 atanh((p - 2^e)/(p + 2^e)) */
function log2(p, P) {
  const key = p + '@' + P;
  if (LOG2.has(key)) return LOG2.get(key);
  const pb = BigInt(p), e = BigInt(pb.toString(2).length - 1), t = 1n << e;
  const [l2lo, l2hi] = atanh(1n, 3n, P), [llo, lhi] = atanh(pb - t, pb + t, P);   /* both halves of 2 atanh(.) / 2 atanh(.) */
  const r = [add(Q(e), Q(llo, l2hi)), add(Q(e), Q(lhi, l2lo))];
  LOG2.set(key, r);
  return r;
}

/* ---- the truth table, its binding, its spectrum -------------------------------------------------------------------- */
function tableOf(art) {
  const n = art.n, hex = art.true_hex;
  if (!Number.isInteger(n) || n < 1 || n > 24) return { refused: 'n = ' + JSON.stringify(n) + ' is not an integer in 1..24' };
  if (typeof hex !== 'string' || !/^[0-9a-fA-F]+$/.test(hex)) return { refused: 'true_hex is not a hexadecimal string' };
  const N = 1 << n, bits = new Uint8Array(N);
  for (let j = 0; j < hex.length; j++) {
    const nib = parseInt(hex[hex.length - 1 - j], 16);
    for (let b = 0; b < 4; b++) if ((nib >> b) & 1) { const x = 4 * j + b; if (x >= N) return { refused: 'the mask sets input ' + x + ', beyond the 2^' + n + ' inputs' }; bits[x] = 1; }
  }
  return { n, N, bits };
}
const bindingOf = (bits) => sha(Buffer.from(Array.from(bits, (b) => (b ? '-1' : '1')).join(','), 'utf8'));
const hexOf = (bits) => { let s = ''; for (let j = Math.ceil(bits.length / 4) - 1; j >= 0; j--) { let nib = 0; for (let b = 0; b < 4; b++) { const x = 4 * j + b; if (x < bits.length && bits[x]) nib |= 1 << b; } s += nib.toString(16); } return s; };
const pc = (x) => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24; };
function spectrum(bits, n) {                                       /* |a| <= 2^i after axis i, so Int32 holds every value exactly (n <= 24) */
  const N = bits.length, a = new Int32Array(N);
  for (let x = 0; x < N; x++) a[x] = bits[x] ? -1 : 1;
  for (let i = 0; i < n; i++) { const b = 1 << i; for (let x = 0; x < N; x++) if (!(x & b)) { const u = a[x], v = a[x | b]; a[x] = u + v; a[x | b] = u - v; } }
  return a;
}
const bySum = (bits, S) => { let s = 0; for (let x = 0; x < bits.length; x++) s += ((pc(S & x) & 1) ^ bits[x]) ? -1 : 1; return s; };
const probes = (n) => { const N = 1 << n, s = new Set([0, N - 1]); for (let i = 0; i < n; i++) s.add(1 << i); for (let j = 1; s.size < Math.min(N, n + 34); j++) s.add((Math.imul(j, 0x9e3779b1) >>> 0) & (N - 1)); return [...s]; };
function edgeInfluence(bits, n) {                                  /* sum_i Pr_x[f(x) != f(x xor e_i)], no Fourier */
  let e = 0;
  for (let i = 0; i < n; i++) { const b = 1 << i; for (let x = 0; x < bits.length; x++) if (!(x & b) && bits[x] !== bits[x | b]) e += 2; }
  return Q(BigInt(e), BigInt(bits.length));
}
function monotoneWitness(bits, n) {
  for (let i = 0; i < n; i++) { const b = 1 << i; for (let x = 0; x < bits.length; x++) if (!(x & b) && bits[x] === 1 && bits[x | b] === 0) return { x, i }; }
  return null;
}
function factorOdd(m) { const f = {}; for (let p = 3; p * p <= m; p += 2) while (m % p === 0) { f[p] = (f[p] || 0) + 1; m /= p; } if (m > 1) f[m] = (f[m] || 0) + 1; return f; }

/* ---- the decision ---------------------------------------------------------------------------------------------- */
function decide(art, threshold, P) {
  const checks = [], pub = { checks };
  const done = (verdict, why) => { V.assertVerdict(verdict, 'verify_fei'); pub.verdict = verdict; if (why) pub.why = why; return { pub }; };
  const gate = (name, ok) => { checks.push({ name, ok }); return ok; };
  let bar;
  try { bar = fromDec(String(threshold)); } catch (e) { return done(REFUSED, 'the bar ' + JSON.stringify(threshold) + ' is not a decimal number'); }
  const T = tableOf(art);
  if (!gate('the truth table reads (hexadecimal, no input beyond 2^n)', !T.refused)) { pub.monotone = { verdict: REFUSED, why: T.refused }; return done(REFUSED, T.refused); }
  const { n, N, bits } = T;
  if (!gate('the truth table is the one the artifact binds by sha256', bindingOf(bits) === art.sha256_table)) { pub.monotone = { verdict: REFUSED, why: 'the binding fails' }; return done(REFUSED, 'the sha256 binding fails: the table is not the one the artifact names'); }
  const w = monotoneWitness(bits, n);
  pub.monotone = w ? { verdict: REFUTED, witness: { x: w.x, i: w.i, why: 'f(' + w.x + ') is TRUE and f(' + (w.x | (1 << w.i)) + ') is FALSE, the second input above the first in coordinate ' + w.i } } : { verdict: CERTIFIED };
  const a = spectrum(bits, n);
  const pr = probes(n), bad = pr.filter((S) => bySum(bits, S) !== a[S]);
  if (!gate('the transform equals the definition at ' + pr.length + ' coefficients summed directly', bad.length === 0)) return done(REFUSED, 'the transform disagrees with the definition at S = ' + bad[0]);
  const hist = new Map();
  for (let S = 0; S < N; S++) { const v = a[S]; if (v) { const k = v < 0 ? -v : v, h = hist.get(k) || [0, 0]; h[0]++; h[1] += pc(S); hist.set(k, h); } }
  const ks = [...hist.keys()].sort((x, y) => x - y);
  pub.n = n; pub.nonzero = ks.reduce((s, k) => s + hist.get(k)[0], 0); pub.distinct = ks.length;
  pub.spectrumSha256 = sha(Buffer.from(Array.from(a).join(','), 'utf8'));
  pub.histogram = ks.map((k) => ({ k, count: hist.get(k)[0] }));
  if (!gate('balanced: a_∅ = 0', a[0] === 0)) return done(REFUSED, 'not balanced: a_∅ = ' + a[0] + ', fhat(∅) = ' + qstr(Q(BigInt(a[0]), BigInt(N))) + '; the amplification rule needs a balanced g');
  const N4 = 1n << BigInt(2 * n);
  let sq = 0n, deg = 0n;
  for (const k of ks) { const kk = BigInt(k) * BigInt(k), [c, d] = hist.get(k); sq += BigInt(c) * kk; deg += BigInt(d) * kk; }
  if (!gate('Parseval: sum a_S^2 = 4^n', sq === N4)) return done(REFUSED, 'Parseval fails: sum a_S^2 = ' + sq);
  const I = Q(deg, N4), Ie = edgeInfluence(bits, n);
  pub.I = qstr(I); pub.Iedge = qstr(Ie);
  if (!gate('I by the spectrum = I by the edge boundary (' + qstr(Ie) + ')', cmp(I, Ie) === 0)) return done(REFUSED, 'the two influences differ');
  let stated;
  try { stated = fromFrac(art.I); } catch (e) { return done(REFUSED, 'the artifact states no readable I'); }
  if (!gate('I = ' + qstr(I) + ', the artifact\'s stated ' + art.I, cmp(I, stated) === 0)) return done(REFUSED, 'the artifact states I = ' + art.I + '; its own table gives ' + qstr(I));
  if (!gate('I > 1', cmp(I, ONE) > 0)) return done(REFUSED, 'I = ' + qstr(I) + ': the amplification rule needs I > 1');
  /* H = A - sum_p B_p log2 p */
  let A = ZERO;
  const B = {};
  for (const k of ks) {
    const c = BigInt(hist.get(k)[0]), kk = BigInt(k) * BigInt(k);
    let v = 0, m = k;
    while (m % 2 === 0) { m /= 2; v++; }
    A = add(A, Q(c * kk * BigInt(2 * n - 2 * v), N4));
    for (const [p, e] of Object.entries(factorOdd(m))) B[p] = add(B[p] || ZERO, Q(2n * c * kk * BigInt(e), N4));
  }
  const ps = Object.keys(B).map(Number).sort((x, y) => x - y);
  pub.closedForm = { A: qstr(A), B: Object.fromEntries(ps.map((p) => [p, qstr(B[p])])),
    text: 'H = ' + qstr(A) + ps.map((p) => ' - (' + qstr(B[p]) + ') log2 ' + p).join('') };
  let Hlo = A, Hhi = A;
  for (const p of ps) { const [lo, hi] = log2(p, P); Hlo = sub(Hlo, mul(B[p], hi)); Hhi = sub(Hhi, mul(B[p], lo)); }
  pub.bits = P;
  pub.log2 = Object.fromEntries(ps.map((p) => { const [lo, hi] = log2(p, P); return [p, [toDec(lo, 60, false), toDec(hi, 60, true)]]; }));
  pub.H = [toDec(Hlo, SHOW, false), toDec(Hhi, SHOW, true)];
  if (!gate('H > 0', cmp(Hlo, ZERO) > 0)) return done(REFUSED, ps.length ? 'H > 0 is not established' : 'H = ' + qstr(A) + ' exactly: the amplification rule needs H > 0');
  const den = sub(I, ONE), Rlo = div(Hlo, den), Rhi = div(Hhi, den);
  pub.ratio = [toDec(Rlo, SHOW, false), toDec(Rhi, SHOW, true)];
  pub.bar = String(threshold);
  /* instruments/verdict.js, relation 'gt', over exact rationals */
  const verdict = cmp(Rlo, bar) > 0 ? CERTIFIED : cmp(Rhi, bar) <= 0 ? REFUTED : REFUSED;
  checks.push({ name: 'H/(I-1) > ' + threshold, ok: verdict === CERTIFIED });
  const out = done(verdict, verdict === REFUTED ? 'the ratio is proved at most ' + threshold + ' (a statement about this certificate, not about C71)' : verdict === REFUSED ? 'the enclosure straddles the bar at ' + P + ' bits: nothing is proved either way' : null);
  out.enc = { Hlo, Hhi, Rlo, Rhi };
  return out;
}

/* ---- fei.py's word, read in the three words: one place -------------------------------------------------------- */
/* Since 2026-10-19 fei.py says the three words itself; this reading of what it prints is kept as an independent
   interpretation, and the record requires the two to agree. Reading: a raise refuses; a failed precondition (binding,
   balance, Parseval, the stated I, I > 1, H > 0) refuses; the bar's own check certifying certifies; otherwise its printed
   upper end — rounded UP since the fix, so read as printed — at or below the bar refutes, and anything else straddles and
   refuses. (At 5825dc47 the print was a truncation and this reading added one unit in its last place.) */
const PRE = [/binds by sha256/, /^balanced/, /^Parseval/, /^I = /, /^I > 1/, /^H > 0/];
const unread = (r) => { const c = r.checks.find((x) => /^the truth table reads/.test(x.name)); return c && !c.ok ? { reading: REFUSED, why: 'fei.py\'s check failed: ' + c.name } : null; };
function readPy(res, threshold) {
  if (res.raised) return { reading: REFUSED, why: 'fei.py raised ' + res.raised };
  if (unread(res.result)) return unread(res.result);
  const r = res.result, by = (re) => r.checks.find((c) => re.test(c.name)) || die('fei.py no longer reports a check matching ' + re);
  for (const re of PRE) { const c = by(re); if (!c.ok) return { reading: REFUSED, why: 'fei.py\'s check failed: ' + c.name }; }
  if (by(/^H\/\(I-1\) > /).ok) return { reading: CERTIFIED };
  const hs = r.ratio[1];
  if (typeof hs !== 'string' || !/^\d+(\.\d+)?$/.test(hs)) return { reading: REFUSED, why: 'fei.py printed an unreadable enclosure ' + hs };
  return cmp(fromDec(hs), fromDec(String(threshold))) <= 0 ? { reading: REFUTED, why: 'its upper end, ' + hs + ', is at or below the bar' }
    : { reading: REFUSED, why: 'its enclosure [' + r.ratio[0] + ', ' + hs + '] straddles the bar' };
}
function readPyMonotone(res) {
  if (res.raised) return { reading: REFUSED, why: 'fei.py raised ' + res.raised };
  if (unread(res.result)) return unread(res.result);
  const r = res.result, bind = r.checks.find((c) => /binds by sha256/.test(c.name)), mono = r.checks.find((c) => /^logic-monotone/.test(c.name));
  if (!bind || !mono) die('fei.py no longer reports its binding and monotone checks');
  return !bind.ok ? { reading: REFUSED, why: 'fei.py\'s binding check failed' } : { reading: mono.ok ? CERTIFIED : REFUTED };
}

/* ---- the inputs and the registry's words, each against its pin ------------------------------------------------- */
const META = JSON.parse(rd(DIR + '/meta.json').toString('utf8'));
for (const [f, h] of Object.entries(META.files)) if (sha(rd(DIR + '/' + f)) !== h) die(DIR + '/' + f + ' is not the pinned bytes (meta.json says ' + h.slice(0, 12) + '…)');
const ART = JSON.parse(rd(DIR + '/fei_c71_n18_artifact.json').toString('utf8'));
const PAGE = rd(DIR + '/71a.md').toString('utf8'), README = rd(DIR + '/README.md').toString('utf8');
const regRow = PAGE.split('\n').find((l) => l.startsWith('| $>') && l.includes('[[Num2026](#Num2026)]')) || die('no [Num2026] row on the pinned 71a.md');
const THRESHOLD = (/^\| \$>([0-9.]+)\$ \|/.exec(regRow) || die('no bound in the [Num2026] row'))[1];
if (!PAGE.includes('$$\n' + THRESHOLD + '\\ <\\ C_{71}')) die('the page\'s best-established range no longer starts at ' + THRESHOLD);
const BAR30 = (/certified UPPER endpoint \(([0-9.]+)\)/.exec(README) || die('the README no longer states the previous record\'s certified upper endpoint'))[1];
const LEDGER = JSON.parse(rd('certs/fei-ledger.json').toString('utf8'));
const LROW = LEDGER.rows[0];
if (LROW.claim !== 'C71 > ' + THRESHOLD) die('the ledger decides ' + LROW.claim + ', not C71 > ' + THRESHOLD);
const STORED = CHECK ? (() => { try { return JSON.parse(rd('certs/fei-second.json').toString('utf8')); } catch (e) { return die('no readable certs/fei-second.json to check against — run without --check first'); } })() : null;

/* ---- the Arb reference (third computation: fei.py's spectrum, Arb's logarithms; none of this file's arithmetic) --- */
const fromManExp = ([m, e]) => (e >= 0 ? Q(BigInt(m) << BigInt(e)) : Q(BigInt(m), 1n << BigInt(-e)));
/* the harness reads its job from a file, not stdin: the n = 18 artifact is 66 KB, past the 64 KB socket buffer, and spawnSync's
   stdin hand-off deadlocked once at that size (2026-10-19, in make test; the rerun passed) */
const withJob = (job, f) => { const d = fs.mkdtempSync(path.join(require('os').tmpdir(), 'fei-job-')), p = path.join(d, 'job.json'); fs.writeFileSync(p, JSON.stringify(job)); try { return f(p); } finally { fs.rmSync(d, { recursive: true, force: true }); } };
function arbLane() {
  if (!fs.existsSync(ARBPY)) return null;
  const t = Date.now(), r = withJob({ artifact: ART, prec: ARBPREC }, (p) => cp.spawnSync(ARBPY, ['-I', HARNESS, '--arb', p], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  if (r.status !== 0) { if (/No module named 'flint'/.test(r.stderr || '')) return null; die('the Arb lane failed: ' + (r.stderr || '').slice(-500)); }
  return Object.assign(JSON.parse(r.stdout), { ms: Date.now() - t });
}
let ARB = arbLane(), arbSource = 'run now';
if (!ARB) { if (!CHECK) die('the Arb lane needs python-flint at ' + path.relative(ROOT, ARBPY) + ' — the truth of two planted claims comes from it'); ARB = STORED.arb; arbSource = 'read from the record (python-flint absent)'; }
const arbR = ARB.ratio.map(fromManExp), arbH = ARB.H.map(fromManExp);
const scale75 = 10n ** 75n;
const t75lo = toDec(sub(Q((arbR[0][0] * scale75) / arbR[0][1], scale75), ulp(75)), 75, false);   /* floor(Arb lower, 75) - 10^-75 */
const t75hi = toDec(add(fromDec(toDec(arbR[1], 75, true)), ulp(75)), 75, true);                      /* ceil(Arb upper, 75) + 10^-75 */

/* ---- the fixtures ------------------------------------------------------------------------------------------------ */
const flipHex = (hex, x) => { const j = hex.length - 1 - (x >> 2), nib = parseInt(hex[j], 16) ^ (1 << (x & 3)); return hex.slice(0, j) + nib.toString(16) + hex.slice(j + 1); };
/* the first FALSE input whose every immediate superset is TRUE: turning it TRUE keeps the function monotone and breaks
   balance, so the bit-flip claims test the binding (b) and balance (c) and nothing else. At the pin the flip was input
   123457, which also broke monotonicity — a second defect claim c did not state (findings). */
const FLIP = (() => { const t = tableOf(ART); for (let x = 0; x < t.N; x++) { if (t.bits[x]) continue; let top = true; for (let i = 0; i < t.n && top; i++) if (!(x & (1 << i)) && !t.bits[x | (1 << i)]) top = false; if (top) return x; } return die('the artifact has no maximal FALSE input'); })();
const resign = (art) => { const t = tableOf(art); return Object.assign({}, art, { sha256_table: bindingOf(t.bits), I: qstr(edgeInfluence(t.bits, t.n)) }); };
const FLIPPED = Object.assign({}, ART, { true_hex: flipHex(ART.true_hex, FLIP) });
const FLIPPED_RESIGNED = resign(FLIPPED);
const I_MOVED = Object.assign({}, ART, { I: qstr(add(fromFrac(ART.I), Q(1n, 128n))) });
const BEYOND = Object.assign({}, ART, { true_hex: '1' + ART.true_hex });
const MONO_BROKEN = (() => {                                      /* swap a FALSE input with the TRUE input just above it: balance kept, monotonicity broken */
  const t = tableOf(ART);
  for (let i = 0; i < t.n; i++) { const b = 1 << i; for (let x = 0; x < t.N; x++) if (!(x & b) && t.bits[x] === 0 && t.bits[x | b] === 1) { const bits = Uint8Array.from(t.bits); bits[x] = 1; bits[x | b] = 0; return { art: resign(Object.assign({}, ART, { true_hex: hexOf(bits) })), x, y: x | b }; } }
  die('the artifact has no FALSE input below a TRUE one');
})();
const small = (n, f, extra) => { const bits = Uint8Array.from({ length: 1 << n }, (_, x) => (f(x) ? 1 : 0)); return Object.assign({ n, true_hex: hexOf(bits), sha256_table: bindingOf(bits) }, extra); };
const MAJ3 = small(3, (x) => pc(x) >= 2, { I: '3/2', ratio_lo_dec: '4', ratio_hi_dec: '4' });       /* weights 1/4 on {1},{2},{3},{1,2,3}: H = 2, I = 3/2, H/(I-1) = 4 */
const DICT = small(2, (x) => x & 1, { I: '1', ratio_lo_dec: '0', ratio_hi_dec: '0' });             /* all weight on {1}: H = 0, I = 1 */
const lo_s = LROW.ratio[0], hi_s = LROW.ratio[1], dL = decimalsOf(hi_s);
const ledgerHi = fromDec(hi_s);                                    /* printed outward since 2026-10-19: the upper end as printed */
const tA = toDec(add(ledgerHi, ulp(dL)), dL, true), tD = toDec(sub(fromDec(lo_s), ulp(dL)), dL, false);

const MAIN = [
  { id: 'registry-bound', claim: 'C71 > ' + THRESHOLD, art: ART, t: THRESHOLD, record: ART.record_dec, what: 'the registry\'s asterisked row, read from the pinned 71a.md (fei.py run as tools/run-fei-ledger.py runs it, with the replaced record)' },
  { id: 'strict-improvement', claim: 'C71 > ' + BAR30, art: ART, t: BAR30, what: 'above the previous record\'s certified upper endpoint, the bar the pinned README says the claimant used' },
  { id: 'logic-monotone', kind: 'monotone', claim: 'the n = 18 function is logic-monotone (TRUE = -1)', art: ART, t: THRESHOLD, what: 'the artifact\'s second claim; with it the bound holds among monotone functions too' }
];
const PLANTED = [
  { id: 'a-bar-above-the-ledger', art: ART, t: tA, truth: 'FALSE', exp: [REFUTED, REFUSED, REFUTED], what: 'the bar one unit (10^-' + dL + ') above the ledger\'s printed upper end (printed outward since the fix; at the pin it was a truncation read as the string + 10^-' + dL + ', which gave this same bar): false by the first implementation\'s record and by Arb; refuted as a statement about this certificate, never about C71. At ' + LOWBITS + ' bits the JS enclosure is wider than the bar\'s distance (js.width128 in this record), so there it must refuse' },
  { id: 'b-one-bit-flipped', art: FLIPPED, t: THRESHOLD, truth: 'MALFORMED', exp: [REFUSED, REFUSED, REFUSED], what: 'input ' + FLIP + ' of the truth table flipped (the first FALSE input whose every immediate superset is TRUE), the published sha256 kept: the binding fails' },
  { id: 'c-unbalanced-binding-bypassed', art: FLIPPED_RESIGNED, t: THRESHOLD, truth: 'MALFORMED', exp: [REFUSED, REFUSED, REFUSED], what: 'the same flip with the binding bypassed EXPLICITLY — sha256_table re-signed to the flipped table\'s own hash and the stated I set to its edge-boundary influence ' + FLIPPED_RESIGNED.I + ' — so balance is the one defect (the flip keeps the function monotone): fhat(∅) = ±2^-17 and the amplification rule does not apply' },
  { id: 'd-bar-below-the-ledger', art: ART, t: tD, truth: 'TRUE', exp: [CERTIFIED, REFUSED, CERTIFIED], what: 'the bar one unit (10^-' + dL + ') below the ledger\'s lower end: true by the first implementation\'s record and by Arb; at ' + LOWBITS + ' bits the JS enclosure is wider than the bar\'s distance (js.width128), so there it must refuse' },
  { id: 'e1-stated-influence-moved', art: I_MOVED, t: THRESHOLD, truth: 'MALFORMED', exp: [REFUSED, REFUSED, REFUSED], what: 'the artifact\'s stated I moved by 1/128 to ' + I_MOVED.I + ', the table untouched: the artifact contradicts its own table' },
  { id: 'e2-bar-1e-75-below-the-value', art: ART, t: t75lo, truth: 'TRUE', exp: [CERTIFIED, REFUSED, REFUSED], what: 'a bar between 10^-75 and 2·10^-75 below the ratio (true by Arb at ' + ARBPREC + ' bits): inside fei.py\'s 60-digit enclosure and the JS\'s ' + LOWBITS + '-bit one, so both must refuse it; decided only at ' + BITS + ' bits' },
  { id: 'e3-bar-1e-75-above-the-value', art: ART, t: t75hi, truth: 'FALSE', exp: [REFUTED, REFUSED, REFUSED], what: 'a bar between 10^-75 and 2·10^-75 above the ratio (false by Arb at ' + ARBPREC + ' bits): inside fei.py\'s 60-digit enclosure and the JS\'s ' + LOWBITS + '-bit one, so both must refuse it; REFUTED at ' + BITS + ' bits' },
  { id: 'e4-mask-beyond-2^n', art: BEYOND, t: THRESHOLD, truth: 'MALFORMED', exp: [REFUSED, REFUSED, REFUSED], what: 'a leading hex digit 1 prepended: the mask sets input 2^18, which does not exist' },
  { id: 'e5-majority-of-three-below-4', art: MAJ3, t: '3.999999999999999999999999999999', truth: 'TRUE', exp: [CERTIFIED, CERTIFIED, CERTIFIED], what: 'majority of three (textbook: four weights 1/4, H = 2, I = 3/2, so H/(I-1) = 4 exactly) against 4 - 10^-30' },
  { id: 'e6-majority-of-three-at-4', art: MAJ3, t: '4', truth: 'FALSE', exp: [REFUTED, REFUTED, REFUTED], what: 'majority of three against 4 itself: the strict inequality fails at equality. Every |a_S| is a power of two, so H is exact in both deciders — the closed form here, fei.py\'s log2 of a power of two since 2026-10-19 (at the pin its log2 4 was an interval and it could only refuse) — and both refute' },
  { id: 'e7-dictator', art: DICT, t: '1', truth: 'MALFORMED', exp: [REFUSED, REFUSED, REFUSED], what: 'a dictator on two variables: balanced, all weight on one set, I = 1 and H = 0 — the amplification rule needs I > 1, the reason both deciders must give (at the pin fei.py raised "a weight above 1" instead)' },
  { id: 'e8-monotonicity-broken', kind: 'monotone', art: MONO_BROKEN.art, t: THRESHOLD, truth: 'FALSE', exp: [REFUTED, REFUTED, REFUTED], what: 'inputs ' + MONO_BROKEN.x + ' (FALSE) and ' + MONO_BROKEN.y + ' (TRUE, one coordinate above it) swapped, re-signed: balance kept, logic-monotone false by construction', claim: 'the swapped function is logic-monotone' }
];

/* ---- run both implementations ---------------------------------------------------------------------------------- */
const ALL = MAIN.concat(PLANTED);
const tj = Date.now();
const JS = ALL.map((c) => { const t = Date.now(), r = decide(c.art, c.t, BITS); return Object.assign(r, { ms: Date.now() - t }); });
const JS128 = ALL.map((c) => decide(c.art, c.t, LOWBITS));
const jsMs = Date.now() - tj;
const tp = Date.now();
const pyRun = withJob({ fixtures: ALL.map((c) => ({ id: c.id, artifact: c.art, threshold: c.t, record: c.record || null })), spectrumOf: ART }, (p) => cp.spawnSync('python3', ['-I', HARNESS, p], { encoding: 'utf8', maxBuffer: 1 << 28 }));
if (pyRun.status !== 0) die('the fei.py harness failed: ' + (pyRun.stderr || '').slice(-600));
const PY = JSON.parse(pyRun.stdout), pyMs = Date.now() - tp;
const word = (c, r) => (c.kind === 'monotone' ? r.pub.monotone.verdict : r.pub.verdict);
const why = (c, r) => (c.kind === 'monotone' ? (r.pub.monotone.witness || {}).why || r.pub.monotone.why || null : r.pub.why || null);
const pyRead = (c, i) => (c.kind === 'monotone' ? readPyMonotone(PY.results[i]) : readPy(PY.results[i], c.t));

/* ---- the main decision, and the agreement ---------------------------------------------------------------------- */
const M = JS[0], MP = M.pub, ME = M.enc, P0 = PY.results[0];
const agree = [];
const ok = (name, c, detail) => { agree.push(Object.assign({ name, ok: !!c }, detail ? { detail } : {})); };
ok('both implementations CERTIFY the registry\'s bound', MP.verdict === CERTIFIED && P0.raw === CERTIFIED);
ok('fei.py, run through the harness, re-derives the ledger\'s row field for field', ['verdict', 'why', 'checks', 'n', 'I', 'distinctWeights', 'nonzero', 'ratio', 'H'].every((k) => JSON.stringify(P0.result[k]) === JSON.stringify(LROW[k])));
ok('the two spectra are identical, coefficient for coefficient with signs (sha256 of the 2^18 comma-joined coefficients)', MP.spectrumSha256 === PY.spectrum.sha256, MP.spectrumSha256);
ok('the histograms of |a_S| agree (' + MP.distinct + ' magnitudes, ' + MP.nonzero + ' nonzero coefficients)', JSON.stringify(Object.fromEntries(MP.histogram.map((h) => [String(h.k), h.count]))) === JSON.stringify(PY.spectrum.histogram) && JSON.stringify(PY.spectrum.histogram) === JSON.stringify(ARB.spectrum.histogram));
ok('I = 261/128 by the spectrum, by the edge boundary, in fei.py and as the artifact states it', MP.I === '261/128' && MP.Iedge === '261/128' && P0.result.I === '261/128' && ART.I === '261/128' && ARB.I === '261/128');
const ledgerLo = fromDec(lo_s);
ok('the JS enclosure overlaps the ledger\'s printed interval', cmp(ME.Rlo, ledgerHi) <= 0 && cmp(ledgerLo, ME.Rhi) <= 0);
ok('the ledger\'s printed interval contains the JS enclosure (printed outward: the lower end down, the upper end up)', cmp(ledgerLo, ME.Rlo) <= 0 && cmp(ME.Rhi, ledgerHi) <= 0);
ok('fei.py\'s printed H contains the JS H', cmp(fromDec(P0.result.H[0]), ME.Hlo) <= 0 && cmp(ME.Hhi, fromDec(P0.result.H[1])) <= 0);
ok('both lower ends are above the registry\'s ' + THRESHOLD, cmp(ME.Rlo, fromDec(THRESHOLD)) > 0 && cmp(ledgerLo, fromDec(THRESHOLD)) > 0);
ok('the Arb ball (' + ARBPREC + ' bits, from fei.py\'s spectrum) lies inside the JS enclosure (' + BITS + ' bits)', cmp(ME.Rlo, arbR[0]) <= 0 && cmp(arbR[1], ME.Rhi) <= 0);
ok('the Arb H lies inside the JS H', cmp(ME.Hlo, arbH[0]) <= 0 && cmp(arbH[1], ME.Hhi) <= 0);
const clo = fromDec(ART.ratio_lo_dec), chi = fromDec(ART.ratio_hi_dec);
ok('the claimant\'s printed bracket [ratio_lo_dec, ratio_hi_dec] (40 decimals) contains the JS enclosure', cmp(clo, ME.Rlo) <= 0 && cmp(ME.Rhi, chi) <= 0);
const agreeAll = agree.every((x) => x.ok);

/* ---- the claims' rows -------------------------------------------------------------------------------------------- */
const rowOf = (c, i) => {
  const py = pyRead(c, i), raw = PY.results[i];
  const r = { id: c.id, claim: c.claim || 'C71 > ' + c.t + ' (from this table)', what: c.what,
    js: { verdict: word(c, JS[i]), why: why(c, JS[i]), ms: JS[i].ms }, js128: { verdict: word(c, JS128[i]), why: why(c, JS128[i]) },
    py: { word: raw.raised ? null : raw.raw, raised: raw.raised, reading: py.reading, why: py.why || null, seconds: raw.seconds } };
  if (c.truth) {
    r.truth = c.truth;
    r.expected = { js: c.exp[0], js128: c.exp[1], py: c.exp[2] };
    r.fired = r.js.verdict === c.exp[0] && r.js128.verdict === c.exp[1] && r.py.reading === c.exp[2];
    r.pyWordAgreesWithReading = r.py.word === null || r.py.word === r.py.reading;
  }
  return r;
};
const mainRows = MAIN.map((c, i) => rowOf(c, i));
const plantedRows = PLANTED.map((c, j) => rowOf(c, MAIN.length + j));
const fired = plantedRows.filter((r) => r.fired).length;
/* the truth of the planted claims within 10^-75 comes from Arb: confirm it here, from the ball */
const arbTruth = (t) => (cmp(arbR[0], fromDec(t)) > 0 ? 'TRUE' : cmp(arbR[1], fromDec(t)) < 0 ? 'FALSE' : 'UNDECIDED');
if (arbTruth(t75lo) !== 'TRUE' || arbTruth(t75hi) !== 'FALSE' || arbTruth(tA) !== 'FALSE' || arbTruth(tD) !== 'TRUE') die('Arb does not confirm the truth of the planted bars');
const falseAccepted = plantedRows.filter((r) => r.truth !== 'TRUE' && [r.js.verdict, r.js128.verdict, r.py.reading, r.py.word].includes(CERTIFIED));
const trueRefuted = plantedRows.filter((r) => r.truth === 'TRUE' && [r.js.verdict, r.js128.verdict, r.py.reading].includes(REFUTED));
const pyWordTrueRefuted = plantedRows.filter((r) => r.truth === 'TRUE' && r.py.word === REFUTED).map((r) => r.id);
const pyWordDiffers = plantedRows.filter((r) => !r.pyWordAgreesWithReading).map((r) => r.id);

/* ---- found at the pin, fixed the same day: what the planted claims found in fei.py, kept, and verified fixed now ---- */
const FOUND = { feiPy: '5825dc475292bf4e02e995e276c1a3422de52796bbea89b758149448fcd78141', commit: '470fe0b2', found: '2026-10-19', fixed: '2026-10-19',
  pyWordDiffersFromReading: ['b-one-bit-flipped', 'c-unbalanced-binding-bypassed', 'e1-stated-influence-moved', 'e2-bar-1e-75-below-the-value', 'e3-bar-1e-75-above-the-value', 'e6-majority-of-three-at-4'],
  pyWordRefutesATrueClaim: ['e2-bar-1e-75-below-the-value'], ledgerTruncated: true, dictatorReason: 'a weight above 1' };
/* the same facts read back from the record that commit holds, when git has it: a retyped history would not be a record */
const atPin = (() => { const r = cp.spawnSync('git', ['show', FOUND.commit + ':certs/fei-second.json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }); return r.status === 0 ? JSON.parse(r.stdout) : null; })();
if (atPin) {
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  if (atPin.deciders['instruments/fei/fei.py'] !== FOUND.feiPy || !same(atPin.plantedSummary.pyWordDiffersFromReading, FOUND.pyWordDiffersFromReading) || !same(atPin.plantedSummary.pyWordRefutesATrueClaim, FOUND.pyWordRefutesATrueClaim)
    || !atPin.findings.some((f) => /truncations/.test(f)) !== !FOUND.ledgerTruncated || !atPin.findings.some((f) => f.includes('"ArithmeticError: ' + FOUND.dictatorReason + '"'))) die('findingsAtPin does not match certs/fei-second.json at ' + FOUND.commit);
} else console.log('  note: git does not hold ' + FOUND.commit + ' here — findingsAtPin not re-read from that commit\'s record');
const e6 = plantedRows.find((r) => r.id === 'e6-majority-of-three-at-4'), e7 = plantedRows.find((r) => r.id === 'e7-dictator');
const fixedNow = {
  ledgerTruncated: cmp(fromDec(lo_s), ME.Rlo) <= 0 && cmp(ME.Rhi, ledgerHi) <= 0,
  pyWordDiffersFromReading: pyWordDiffers.length === 0 && pyWordTrueRefuted.length === 0,
  boundary: e6.py.word === REFUTED,
  dictatorReason: !e7.py.raised && e7.py.word === REFUSED && /^I > 1/.test(PY.results[MAIN.length + PLANTED.findIndex((c) => c.id === 'e7-dictator')].result.why || '')
};
const notFixed = Object.keys(fixedNow).filter((k) => !fixedNow[k]);
const at = 'FOUND at fei.py ' + FOUND.feiPy.slice(0, 8) + '… (commit ' + FOUND.commit + ', ' + FOUND.found + ') and FIXED ' + FOUND.fixed + ': ';
const findings = [
  at + 'certs/fei-ledger.json printed the ratio\'s two ends as one truncated string (str(...)[:44], H at [:30]), so its printed upper end was below the value. fei.py now prints outward — the lower end down, the upper end up, at the same 43 and 29 significant digits — and the ledger reads [' + lo_s + ', ' + hi_s + '], which contains the value (the JS enclosure lies inside it).',
  at + 'fei.py had two words, and on ' + FOUND.pyWordDiffersFromReading.length + ' of the ' + plantedRows.length + ' planted claims (' + FOUND.pyWordDiffersFromReading.join(', ') + ') its own word was REFUTED where the three words say REFUSED — on ' + FOUND.pyWordRefutesATrueClaim.join(', ') + ', a TRUE claim. fei.py now carries the three words check by check and composes them by the method paper\'s rule (REFUTED if any is refuted, else REFUSED if any is refused, else CERTIFIED); the bound and the record are CERTIFIED iff r_lo > bar, REFUTED iff r_hi <= bar, REFUSED on a straddle; a failed precondition is REFUSED with its reason and the bound is then not decided. Its own word now equals the reading on all ' + plantedRows.length + ' planted claims.',
  at + 'log2 of a power of two was an interval, so majority of three at exactly 4 could only be refused. fei.py now writes |a| = 2^v m and takes log2 |a| = v + log2 m with log2 1 = 0 exactly, and refutes it (e6-majority-of-three-at-4).',
  at + 'on the dictator fei.py raised "' + FOUND.dictatorReason + '" (the weight is exactly 1) before reaching its I <= 1 test, so instruments/fei/battery.py\'s red control named for I > 1 fired for that other reason. With log2 4 exact the test is reached: fei.py returns REFUSED, why "' + PY.results[MAIN.length + PLANTED.findIndex((c) => c.id === 'e7-dictator')].result.why + '", and the battery asserts the reason.',
  'FOUND while fixing (' + FOUND.fixed + '): planted claims b and c flipped input 123457, which also broke monotonicity — claim c stated balance as its one defect, and under the composition rule the refuted monotone check would have decided fei.py\'s word. The flip is now input ' + FLIP + ', the first FALSE input whose every immediate superset is TRUE, which keeps the function monotone; the claims keep their ids.'
];

const counts = (rows, f) => rows.reduce((c, r) => ((c[f(r)] = (c[f(r)] || 0) + 1), c), {});
const rec = {
  what: 'The registry\'s C71 > ' + THRESHOLD + ' (Fourier entropy–influence), decided a second time from the cited n = 18 truth table by tools/verify_fei.js (JavaScript BigInt; H in closed form, A - sum B_p log2 p, the logarithms from the atanh series with outward rounding), which shares no code with instruments/fei/fei.py or the claimant; fei.py run beside it through tools/fei-second-harness.py; an Arb reference from fei.py\'s own spectrum; ' + plantedRows.length + ' planted claims of known truth decided by both, fei.py\'s own verdict recorded beside its three-word reading and required to equal it; what the planted claims found in fei.py at ' + FOUND.commit + ' and the fix the same day, in findingsAtPin and findings.',
  generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: null, node: process.version, python: PY.python,
  deciders: { 'tools/verify_fei.js': sha(rd('tools/verify_fei.js')), 'tools/fei-second-harness.py': sha(rd('tools/fei-second-harness.py')), 'instruments/fei/fei.py': sha(rd('instruments/fei/fei.py')), 'instruments/verdict.js': sha(rd('instruments/verdict.js')) },
  inputs: { pins: DIR + '/meta.json', files: META.files, registryCommit: META.registryCommit, threshold: THRESHOLD, thresholdFrom: '71a.md, the [Num2026] row', previousUpperEndpoint: BAR30, previousUpperEndpointFrom: 'README.md', ledger: 'certs/fei-ledger.json', ledgerCode: LEDGER.code },
  js: { verdict: MP.verdict, bits: BITS, n: MP.n, nonzero: MP.nonzero, distinct: MP.distinct, I: MP.I, Iedge: MP.Iedge, spectrumSha256: MP.spectrumSha256,
    histogram: MP.histogram, closedForm: MP.closedForm, log2: MP.log2, H: MP.H, ratio: MP.ratio, width: sciUp(sub(ME.Rhi, ME.Rlo)),
    ratio128: JS128[0].pub.ratio, width128: sciUp(sub(JS128[0].enc.Rhi, JS128[0].enc.Rlo)), checks: MP.checks, ms: M.ms },
  py: { verdict: P0.raw, why: P0.result.why, digits: PY.digits, ratio: P0.result.ratio, H: P0.result.H, spectrumSha256: PY.spectrum.sha256, checks: P0.result.checks, seconds: P0.seconds },
  arb: ARB, arbSource,
  agreement: agree,
  claims: mainRows,
  planted: plantedRows,
  plantedSummary: { planted: plantedRows.length, fired, byTruth: counts(plantedRows, (r) => r.truth), falseAccepted: falseAccepted.map((r) => r.id), trueRefuted: trueRefuted.map((r) => r.id),
    pyWordDiffersFromReading: pyWordDiffers, pyWordRefutesATrueClaim: pyWordTrueRefuted },
  findingsAtPin: FOUND,
  findings,
  timing: { jsMs, pyMs, arbMs: ARB.ms }
};
rec.seconds = +((Date.now() - T0) / 1000).toFixed(1);

/* ---- print, then write or compare ---------------------------------------------------------------------------------- */
console.log('  C71 > ' + THRESHOLD + '   js ' + MP.verdict + '   fei.py ' + P0.raw + '   (I = ' + MP.I + ', ' + MP.nonzero + ' nonzero, ' + MP.distinct + ' magnitudes)');
console.log('  js  H/(I-1) in [' + MP.ratio[0].slice(0, 62) + '…, ' + MP.ratio[1].slice(0, 62) + '…]  at ' + BITS + ' bits');
console.log('  arb H/(I-1) = ' + ARB.ratioText.slice(0, 70) + '…  (' + arbSource + ')');
console.log('  ledger         [' + lo_s + ', ' + hi_s + '] as printed (outward)');
console.log('  ' + MP.closedForm.text);
for (const a of agree) console.log('  ' + (a.ok ? 'ok   ' : 'FAIL ') + a.name);
for (const r of mainRows) console.log('  ' + r.id.padEnd(34) + ' js ' + r.js.verdict.padEnd(9) + ' js128 ' + r.js128.verdict.padEnd(9) + ' fei.py ' + (r.py.word || 'raised').padEnd(9) + ' → ' + r.py.reading);
for (const r of plantedRows) console.log('  PLANTED ' + r.id.padEnd(30) + ' ' + r.truth.padEnd(9) + ' expect ' + [r.expected.js, r.expected.js128, r.expected.py].join('/').padEnd(26) + ' js ' + r.js.verdict.padEnd(9) + ' js128 ' + r.js128.verdict.padEnd(9) + ' fei.py ' + (r.py.word || 'raised').padEnd(9) + ' → ' + r.py.reading.padEnd(9) + (r.fired ? ' fired' : ' DID NOT FIRE'));
for (const f of findings) console.log('  finding: ' + f);
if (!agreeAll) die('an agreement check failed: ' + agree.filter((a) => !a.ok).map((a) => a.name).join('; '));
if (fired !== plantedRows.length) die('a planted claim did not come out as expected: ' + plantedRows.filter((r) => !r.fired).map((r) => r.id).join(', '));
if (falseAccepted.length || trueRefuted.length) die('a false claim was accepted or a true one refuted');
if (pyWordDiffers.length) die('fei.py\'s own word differs from the three-word reading on ' + pyWordDiffers.join(', '));
if (notFixed.length) die('a defect found at ' + FOUND.commit + ' is not fixed in fei.py on disk: ' + notFixed.join(', '));
if (PY.digits !== 60) die('fei.py no longer works at 60 digits (fei.PREC = ' + PY.digits + '): the record\'s py.digits and the method paper say 60');

/* volatile: clocks, versions, the decider digests (a changed digest is noted, not failed), and the Arb ball's printed form
   (a python-flint upgrade may print a different radius; the bars derived from it are compared, inside the planted rows) */
const VOLATILE = new Set(['generated', 'seconds', 'ms', 'node', 'python', 'flint', 'arbSource', 'timing', 'deciders', 'arb']);
const stable = (x) => (Array.isArray(x) ? x.map(stable) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).filter((k) => !VOLATILE.has(k)).sort().map((k) => [k, stable(x[k])])) : x);
if (CHECK) {
  if (JSON.stringify(stable(rec)) !== JSON.stringify(stable(STORED))) {
    const a = stable(rec), b = stable(STORED), diff = Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    die('the record is not what the artifact and the two deciders give now (differs in: ' + diff.join(', ') + ')');
  }
  if (Object.keys(rec.deciders).some((k) => STORED.deciders[k] !== rec.deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
  console.log('fei second: re-derived identical — both CERTIFY C71 > ' + THRESHOLD + ', ' + agree.length + '/' + agree.length + ' agreements, ' + fired + '/' + plantedRows.length + ' planted claims as expected in both (Arb ' + arbSource + '; ' + rec.seconds + ' s)');
} else {
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote certs/fei-second.json — both CERTIFY C71 > ' + THRESHOLD + '; ' + agree.length + '/' + agree.length + ' agreements; ' + fired + '/' + plantedRows.length + ' planted claims as expected in both; ' + findings.length + ' findings (' + rec.seconds + ' s)');
}
