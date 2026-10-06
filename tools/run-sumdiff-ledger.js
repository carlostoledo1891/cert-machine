#!/usr/bin/env node
/* run-sumdiff-ledger.js — the optimization-constants registry's asterisked sum–difference bounds, decided.
   Writes certs/sumdiff-ledger.json; `--check` re-derives it and refuses on any difference.

   THE CLAIMS are the registry's (teorth/optimizationproblems @ 2c1968cd, corpus/optimization-constants):
   C3b >= 1.77898884* and C3c >= 1.6747338950414058*, the asterisk meaning "the level of available
   verification is currently at minimal levels", plus the 95-point C3c bound the second superseded. Each is
   decided from the certificate the registry cites, re-hashed against its pin, by instruments/sumdiff (BigInt
   pushforwards, bigfloat intervals), with no code shared with the claimants' checkers (mpmath). The
   certificates' own longer strings, and the improvement the registry prints, are decided beside them.

   ALSO RECORDED, as an observation and not a decision: the 147-point certificate's published checker
   (check_cert.py at the pinned revision, not mirrored) makes its last comparison with mpmath.mpf at the default
   53 bits, so it prints OK for claims above the certified ratio; the run is below, with the false claims used.

   usage: node tools/run-sumdiff-ledger.js [--check] */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const S = require(path.join(ROOT, 'instruments', 'sumdiff', 'sumdiff.js'));
const B = require(path.join(ROOT, 'instruments', 'bigfloat', 'bigfloat.js'));
const OUT = path.join(ROOT, 'certs', 'sumdiff-ledger.json');
const CORPUS = path.join(ROOT, 'corpus', 'optimization-constants');
const die = (m) => { console.error('sumdiff-ledger: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const M = JSON.parse(fs.readFileSync(path.join(CORPUS, 'meta.json'), 'utf8'));
for (const [f, h] of Object.entries(M.files)) if (sha(fs.readFileSync(path.join(CORPUS, f))) !== h) die(f + ' is not the pinned bytes');
const cert = (f) => S.readCertificate(S.parseExact(fs.readFileSync(path.join(CORPUS, f), 'utf8')));

/* the registry's table row for a constant, read from the pinned README: the printed lower-bound cell */
const readme = fs.readFileSync(path.join(CORPUS, 'registry', 'README.md'), 'utf8');
const rowOf = (k) => { const m = new RegExp('\\| \\[' + k + '\\]\\([^)]*\\) \\| ([^|]+) \\| ([^|]+) \\| ([^|]+) \\|').exec(readme); if (!m) die('no registry row for ' + k); return { name: m[1].trim(), lower: m[2].trim(), upper: m[3].trim() }; };

const CLAIMS = [
  { id: '3b', constant: 'C3b', file: 'mi2026/c3b_pr92/certificate_3b_13pt.json', claim: '1.77898884', claimant: 'Mosaic Intelligence (2026)', source: 'doi:10.5281/zenodo.20794135 (teorth/optimizationproblems PR #92)', registry: true },
  { id: '3c', constant: 'C3c', file: 'l2026/certificate_3c_147pt.json', claim: '1.6747338950414058', claimant: 'Y. Lin (2026)', source: 'gist CoolRmal/5368357c @ 62621d2d (teorth/optimizationproblems PR #185)', registry: true },
  { id: '3c-95', constant: 'C3c', file: 'mi2026/c3c_pr93/certificate_3c_v3_95pt.json', claim: '1.6747338950208249', claimant: 'Mosaic Intelligence (2026)', source: 'doi:10.5281/zenodo.20794135 (teorth/optimizationproblems PR #93), superseded by the 147-point certificate', registry: false },
];
/* the certificates' own longer statements, decided beside the registry's */
const ALSO = [
  { of: '3b', claim: '1.778988841420693549', what: 'the certificate\'s printed "true value" prefix', expect: 'CERTIFIED' },
  { of: '3b', claim: '1.778988841420693550', what: 'the prefix\'s next value (the prefix is a truncation iff this is refuted)', expect: 'REFUTED' },
  { of: '3c-95', claim: '1.674733895020824993378207577602265184970', what: 'the 95-point certificate\'s 39-digit bound', expect: 'CERTIFIED' },
  { of: '3c', claim: '1.674733895041405870063135756722213999136383713818148696811828', what: 'the 147-point certificate\'s 60-digit bound', expect: 'CERTIFIED' },
  { of: '3c', claim: '1.6747338950414059', what: 'a FALSE claim one unit above in the 17th significant digit — the same double as the true bound', expect: 'REFUTED' },
];

function build() {
  const certs = {}, rows = [];
  for (const c of CLAIMS) {
    const C = cert(c.file), d = S.decide(C, c.claim), reg = c.registry ? rowOf(c.id) : null;
    if (reg && !reg.lower.includes(c.claim + '*')) die('the registry row for ' + c.id + ' no longer prints ' + c.claim + '*');
    certs[c.id] = C;
    rows.push({ id: c.id, constant: c.constant, claim: c.constant + ' >= ' + c.claim, claimant: c.claimant, source: c.source, registry: reg ? { row: c.id, printedLower: reg.lower, printedUpper: reg.upper, asterisk: true } : null,
      certificate: { file: 'corpus/optimization-constants/' + c.file, sha256: M.files[c.file], points: C.pts.length, denominatorDigits: C.den.toString().length },
      verdict: d.verdict, bits: d.P, rho: S.digits(d.R.rho, 40), entropies: { target: S.digits(d.R.HT, 30), forms: d.R.Hs.map((h) => S.digits(h, 30)) } });
  }
  const also = ALSO.map((a) => { const d = S.decide(certs[a.of], a.claim); if (d.verdict !== a.expect) die('"' + a.claim + '" came back ' + d.verdict + ', not ' + a.expect); return { of: a.of, claim: a.claim, what: a.what, verdict: d.verdict, bits: d.P }; });
  /* the improvement the registry prints for the 147-point certificate: 2.06 × 10⁻¹¹ over the 95-point one */
  const P = 256, gap = B.sub(S.ratio(certs['3c'], P).rho, S.ratio(certs['3c-95'], P).rho, P);
  const improvement = { printed: '2.06e-11', enclosure: S.digits(gap, 16), rounds: B.cmp(gap.lo, B.fromRatio(2055n, 10n ** 14n, P).hi) > 0 && B.cmp(gap.hi, B.fromRatio(2065n, 10n ** 14n, P).lo) < 0 };
  if (!improvement.rounds) die('the printed improvement 2.06e-11 is not the rounding of the certified gap');
  const code = {};
  for (const rel of ['instruments/sumdiff/sumdiff.js', 'instruments/bigfloat/bigfloat.js', 'instruments/bigfloat/functions.js']) code[rel] = sha(fs.readFileSync(path.join(ROOT, rel)));
  return {
    what: 'Two asterisked lower bounds of the optimization-constants registry (teorth/optimizationproblems @ ' + M.registry.commit.slice(0, 8) + ') decided from the certificates it cites: the entropy ratio H(X−Y)/max(H over the other forms) of each certificate\'s law enclosed by exact BigInt pushforwards and outward-rounded bigfloat logarithms, with no code shared with the claimants\' mpmath checkers; a claim "C >= c" is CERTIFIED when the enclosure lies above c. Independently, tools/verify_sumdiff.py re-derives the same verdicts with the Python standard library alone.',
    generated: new Date().toISOString().slice(0, 10),
    registry: M.registry, corpus: { meta: 'corpus/optimization-constants/meta.json', sha256: sha(fs.readFileSync(path.join(CORPUS, 'meta.json'))) },
    code, rows, also, improvement,
    observed: {
      what: 'The 147-point certificate\'s own checker, check_cert.py at the pinned gist revision (sha256 ' + M.l2026.notMirrored['check_cert.py'].slice(0, 12) + '…, not mirrored), run on 2026-09-29 with mpmath 1.3.0: it encloses the ratio at 100 digits (iv.dps = 100) but makes its final comparison, mpmath.mpf(lo_str) >= mpmath.mpf(claimed), in the default context of 53 bits, so any claim within a double of the true bound prints OK.',
      runs: [
        { claimed: '1.674733895041405870063135756722213999136383713818148696811828', printed: 'OK', truth: 'CERTIFIED here (the certificate\'s own bound)' },
        { claimed: '1.674733895041405870063135756722213999136383713818148696811900', printed: 'OK', truth: 'not certified here: above the certified lower end at the 58th decimal' },
        { claimed: '1.6747338950414058800', printed: 'OK', truth: 'REFUTED here: above the ratio at the 17th significant digit' },
        { claimed: '1.67473389504140590', printed: 'OK', truth: 'REFUTED here' },
      ],
      note: 'The bound the registry prints is TRUE (decided above); the checker that accompanies it would also have accepted a false one. The Mosaic Intelligence checkers set mp.dps = 80 before comparing and do not have this weakness.',
    },
  };
}

const L = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no ledger to check');
  const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('the ledger is not what the certificates and the code give now');
  console.log('sumdiff-ledger: re-derived, identical');
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('sumdiff-ledger: ' + L.rows.map((r) => r.claim + ' ' + r.verdict + ' (' + r.bits + ' bits)').join(' · ') + ' · ' + L.also.length + ' further strings decided · improvement ' + L.improvement.enclosure[0].slice(0, 14));
}
