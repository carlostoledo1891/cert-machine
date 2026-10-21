/* instruments/selfaudit/entropy.js — the self-audit of cert-machine, Phase 3: the ENTROPY family (4 register rows: the
   three sum–difference certificates of certs/sumdiff-ledger.json — optconst-3b, optconst-3c, optconst-3c-95 — and the
   Fourier entropy–influence truth table of certs/fei-ledger.json, optconst-71). The pre-registration names the three
   planted classes of certs/method-eval.json for this family, put here on the register's own rows:

     FALSE   the bar claimed just above the ratio: for a sum–difference certificate the certificate's OWN printed upper
             end (value_true_prefix, interval_hi, the certified interval's top) raised by one unit in its last digit; for the
             truth table its printed ratio_hi_dec raised by one unit — witness: the ratio enclosed by a standard-library
             program that shares no code with the decider (verify_sumdiff.py's door and entropies; an independent
             Walsh–Hadamard transform, exact influence and outward entropy for the table), its upper end below the bar
     TRUE    the law translated by (7, −3): every linear form shifts by a constant, no entropy moves (the sum–difference
             rows); the truth table's input coordinates rotated by one and the table re-bound by its sha256: every Fourier
             weight, the influence, balance and monotonicity are unchanged (the FEI row — negating the table is NOT an
             invariance of this row: the artifact's second claim, logic-monotone, turns anti-monotone, and the decider
             refutes it; the first draft's negation class came back as a false refutation of my own making and was replaced)
     MALFORMED  a weight moved by one unit of its denominator (the weights no longer sum to 1: the door refuses); a hex
             digit beyond 2^n (a truth table the artifact's n cannot hold)

   THE OBJECT is the certificate as its file holds it, read as instruments/sumdiff/sumdiff.js reads it (parseExact: every
   integer of 16 digits or more kept as its digit string) and written back the same way; for the FEI row the artifact
   JSON. THE DECIDER UNDER TEST: instruments/sumdiff/sumdiff.js decide (readCertificate → door → the ratio at the
   instrument's precisions), the path of tools/run-sumdiff-ledger.js; instruments/fei/fei.py decide(artifact, threshold,
   record_dec), the path of tools/run-fei-ledger.py, run as the ledger runs it (python3 -I). THE WITNESS is
   instruments/selfaudit/witness_entropy.py; the float check instruments/selfaudit/floatcheck_entropy.py.           MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const S = require(path.join(ROOT, 'instruments', 'sumdiff', 'sumdiff.js'));

const SUMDIFF = 'certs/sumdiff-ledger.json', FEI = 'certs/fei-ledger.json';
const FEI_ART = 'corpus/optimization-constants/num2026/fei_c71_n18_artifact.json';
const barOf = (claim) => { const m = /(\d+\.\d+)/.exec(claim); if (!m) throw new Error('entropy: no decimal bar in ' + claim); return m[1]; };
const plusOneUnit = (s) => { const [i, f] = s.split('.'); const n = BigInt(i + f) + 1n; const t = n.toString().padStart(f.length + 1, '0'); return t.slice(0, t.length - f.length) + '.' + t.slice(t.length - f.length); };

function rows(register, J) {
  const out = [];
  const sd = J(SUMDIFF);
  for (const r of sd.rows) {
    const rowId = 'optconst-' + r.id;
    const reg = register.rows.find((x) => x.id === rowId);
    if (!reg) throw new Error('entropy: no register row ' + rowId);
    const text = fs.readFileSync(path.join(ROOT, r.certificate.file), 'utf8');
    const cert = S.parseExact(text);
    /* the certificate's own printed upper end, the bar the FALSE class raises */
    const top = cert.value_true_prefix ? String(cert.value_true_prefix) : cert.interval_hi ? String(cert.interval_hi) : Array.isArray(cert.certified_interval_dps380) ? String(cert.certified_interval_dps380[1]) : null;
    if (!top) throw new Error('entropy: ' + r.id + ' prints no upper end to raise');
    out.push({ rowId, record: SUMDIFF, entryId: r.id, verdict: reg.verdict, entry: { kind: 'sumdiff', file: r.certificate.file, claim: barOf(r.claim), top, cert, points: r.certificate.points } });
  }
  const fe = J(FEI);
  const r = fe.rows[0];
  const reg = register.rows.find((x) => x.id === 'optconst-71');
  if (!reg) throw new Error('entropy: no register row optconst-71');
  const art = JSON.parse(fs.readFileSync(path.join(ROOT, FEI_ART), 'utf8'));
  out.push({ rowId: 'optconst-71', record: FEI, entryId: r.id, verdict: reg.verdict, entry: { kind: 'fei', file: FEI_ART, claim: barOf(r.claim), top: String(art.ratio_hi_dec), art } });
  return out;
}

const claimOf = (e) => (e.kind === 'sumdiff' ? { kind: 'sumdiff', claim: e.claim, cert: e.cert } : { kind: 'fei', claim: e.claim, art: e.art });
const describe = (e) => (e.kind === 'sumdiff' ? 'a ' + e.points + '-point entropy certificate for C' + e.cert.problem.toString().replace(/^C_?/i, '') + ', the bar ' + e.claim : 'the n = ' + e.art.n + ' truth table (' + e.art.n_nonzero + ' nonzero Fourier weights), the bar ' + e.claim);
const clone = (x) => JSON.parse(JSON.stringify(x));

/* the three encodings, translated and bent in place */
function translate(cert) {
  if (Array.isArray(cert.weights)) cert.weights = cert.weights.map((w) => ({ ...w, x: w.x + 7, y: w.y - 3 }));
  else if (Array.isArray(cert.distribution_x_y_numden)) cert.distribution_x_y_numden = cert.distribution_x_y_numden.map(([x, y, nd]) => [x + 7, y - 3, nd]);
  else if (Array.isArray(cert.distribution_x_y_num)) cert.distribution_x_y_num = cert.distribution_x_y_num.map(([x, y, n]) => [x + 7, y - 3, n]);
  else throw new Error('entropy: no distribution to translate');
}
const bump = (v) => (typeof v === 'string' ? (BigInt(v) + 1n).toString() : v + 1);
function bend(cert) {
  if (Array.isArray(cert.weights)) cert.weights[0].num = bump(cert.weights[0].num);
  else if (Array.isArray(cert.distribution_x_y_numden)) cert.distribution_x_y_numden[0][2][0] = bump(cert.distribution_x_y_numden[0][2][0]);
  else if (Array.isArray(cert.distribution_x_y_num)) cert.distribution_x_y_num[0][2] = bump(cert.distribution_x_y_num[0][2]);
}
/* the truth table's input coordinates rotated by one (f'(x) = f(π(x)), π the cyclic shift of the n bit positions), and the
   artifact re-bound to the new table's sha256: a coordinate permutation preserves every Fourier weight, I, balance and
   monotonicity */
function rotateInputs(art) {
  const n = art.n, bits = 1 << n;
  const hex = String(art.true_hex);
  const full = BigInt('0x' + hex);
  const pi = (x) => ((x << 1) | (x >> (n - 1))) & (bits - 1);
  let out = 0n;
  const vals = [];
  for (let x = 0; x < bits; x++) { const neg = ((full >> BigInt(pi(x))) & 1n) === 1n; if (neg) out |= 1n << BigInt(x); vals.push(neg ? '-1' : '1'); }
  art.true_hex = out.toString(16).padStart(hex.length, '0');
  art.sha256_table = require('crypto').createHash('sha256').update(vals.join(',')).digest('hex');
}

function mutants(e) {
  const base = claimOf(e), out = [];
  { const c = clone(base); c.claim = plusOneUnit(e.top); out.push({ class: 'bar-above-ratio', truth: 'FALSE', transformation: 'the bar raised to the certificate\'s own printed upper end ' + e.top + ' plus one unit in its last digit → ' + c.claim, claim: c }); }
  if (e.kind === 'sumdiff') {
    { const c = clone(base); translate(c.cert); out.push({ class: 'law-translated', truth: 'TRUE', preservesOriginal: true, transformation: 'every point translated by (7, −3): each linear form shifts by a constant, no entropy moves', claim: c }); }
    { const c = clone(base); bend(c.cert); out.push({ class: 'weight-moved', truth: 'MALFORMED', transformation: 'the first weight\'s numerator + 1: the weights no longer sum to 1', claim: c }); }
  } else {
    { const c = clone(base); rotateInputs(c.art); out.push({ class: 'inputs-rotated', truth: 'TRUE', preservesOriginal: true, transformation: 'the n input coordinates rotated by one (f\'(x) = f(π(x))) and the artifact re-bound to the new table\'s sha256: every Fourier weight, I, balance and monotonicity unchanged', claim: c }); }
    { const c = clone(base); c.art.true_hex = '1' + String(c.art.true_hex); out.push({ class: 'hex-beyond-2n', truth: 'MALFORMED', transformation: 'a hex digit prepended: a bit at or beyond 2^n', claim: c }); }
  }
  return out;
}

function decide(id, claim) {
  const t0 = process.hrtime.bigint();
  let verdict, why;
  if (claim.kind === 'sumdiff') {
    try {
      const C = S.readCertificate(S.parseExact(JSON.stringify(claim.cert)));
      const d = S.decide(C, claim.claim);
      verdict = d.verdict; why = (d.why || 'ratio ∈ [' + S.digits(d.R.rho, 30).join(', ') + '] at ' + d.P + ' bits against ' + claim.claim);
    } catch (e) { verdict = 'REFUSED'; why = 'the instrument threw: ' + (e.message || e); }
  } else {
    const py = 'import json, sys\nsys.path.insert(0, sys.argv[1])\nimport fei\no = json.load(open(sys.argv[2]))\nr = fei.decide(o["art"], o["claim"], o["art"].get("record_dec"))\nprint(json.dumps({"verdict": r.get("verdict"), "why": r.get("why"), "ratio": r.get("ratio")}))\n';
    const tmp = path.join(require('os').tmpdir(), 'selfaudit-fei-' + process.pid + '-' + Date.now() + '.json');
    fs.writeFileSync(tmp, JSON.stringify(claim));
    const r = cp.spawnSync('python3', ['-I', '-c', py, path.join(ROOT, 'instruments', 'fei'), tmp], { encoding: 'utf8', maxBuffer: 1 << 26 });
    fs.unlinkSync(tmp);
    if (r.status !== 0) { verdict = 'REFUSED'; why = 'the decider threw: ' + String(r.stderr).slice(-200); }
    else { const o = JSON.parse(r.stdout); verdict = o.verdict; why = (o.why || '') + (o.ratio ? ' ratio ∈ [' + o.ratio[0].slice(0, 30) + ', ' + o.ratio[1].slice(0, 30) + ']' : ''); }
  }
  return { verdict, why: String(why).slice(0, 300), ms: Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10 };
}

module.exports = {
  family: 'entropy',
  records: [SUMDIFF, FEI],
  decider: 'sum–difference rows: instruments/sumdiff/sumdiff.js decide (readCertificate → door → the ratio enclosed at the instrument\'s precisions), the path of tools/run-sumdiff-ledger.js; the FEI row: instruments/fei/fei.py decide(artifact, threshold, record_dec), the path of tools/run-fei-ledger.py',
  witness: 'instruments/selfaudit/witness_entropy.py',
  floatcheck: 'instruments/selfaudit/floatcheck_entropy.py',
  redControl: 'bar-above-ratio',
  classes: { FALSE: ['bar-above-ratio'], TRUE: ['law-translated', 'inputs-rotated'], MALFORMED: ['weight-moved', 'hex-beyond-2n'] },
  rows, claimOf, mutants, decide, describe
};
