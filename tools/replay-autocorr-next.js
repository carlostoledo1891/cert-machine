#!/usr/bin/env node
/* replay-autocorr-next.js — four newer family-1 rows of the registry, each decided twice, as the second party.

   By 2026-11-02 the optimization-constants registry carried three newer asterisked step-function bounds that nobody
   but their submitters had replayed: C_1c >= 0.4103333* (Koshta, K = 24576, #261), C_1d <= 1.460217284022874*
   (steps-re, 600 cells, #247) and C_1d <= 1.459989046905384* (the 600-cell C'_4 function of the AlphaEvolve repository's
   pull request 13, added to the page by #248). The registry's rule (CONTRIBUTING, 2026-10-26) takes an asterisk off when
   someone independent confirms the replay in the pull request or issue thread; this is that replay, in the form of
   tools/replay-autocorr.js (2026-10-18): the bytes pinned by digest (corpus/optconst-queue/next-2026-11-02/), the bounds
   read from the registry's own pinned pages, two implementations sharing no code with each other or with the claimants'
   verifiers (kept as text, never run) — instruments/optq/autocorr.py (Python, Fraction and int, every lag summed term
   by term) and instruments/optq/stepfun-exact.js (JavaScript BigInt, Kronecker products) — and red controls that must
   come out wrong. The AlphaEvolve function is given as 600 decimal literals in a Python file; it is decided under both
   readings the page names: the decimals exactly, and the binary64 numbers Python makes of them.

   [SCIEL2026] (#248, 800 cells) is not decided: its certificate is a restricted Zenodo record (files on request), so
   there are no bytes to pin. It is recorded as NEEDS DATA, with that reason.

   usage: node tools/replay-autocorr-next.js            both implementations, the red controls → certs/autocorr-replay-next.json
          node tools/replay-autocorr-next.js --check    the battery: the JavaScript decider re-derives every row and red
                                                        control and compares with the record; nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SE = require(path.join(ROOT, 'instruments', 'optq', 'stepfun-exact.js'));
const OUT = path.join(ROOT, 'certs', 'autocorr-replay-next.json');
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('AUTOCORR REPLAY (NEXT) REFUSED: ' + m); process.exit(1); };
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const J = (rel) => JSON.parse(rd(rel).toString('utf8'));
const DIR = 'corpus/optconst-queue/next-2026-11-02';

/* ---- the inputs and the registry's words, each against its pin ------------------------------------------- */
const PINS = J(DIR + '/PINS.json').files;
const pinned = (rel) => { const buf = rd(DIR + '/' + rel); if (!PINS[rel] || sha(buf) !== PINS[rel].sha256) die(rel + ' does not match its pin'); return buf; };
const page = { '1c': pinned('upstream/constants/1c.md').toString('utf8'), '1d': pinned('upstream/constants/1d.md').toString('utf8') };
const rowOf = (k, ref) => page[k].split('\n').find((x) => x.startsWith('| $') && x.includes('| [' + ref + '] |')) || die('no [' + ref + '] row on the ' + k + ' page');
const bound = (row) => { const m = /^\| \$([0-9.]+)(\*?)\$(\*?) \|/.exec(row); if (!m) die('no bound in the row ' + row.slice(0, 60)); return { claim: m[1], asterisked: !!(m[2] || m[3]) }; };
const rKos = rowOf('1c', 'Kos2026'), rSteps = rowOf('1d', 'STEPS2026'), rAer = rowOf('1d', 'AER2026'), rSciel = rowOf('1d', 'SCIEL2026');
const sKos = /\*\*Exact value:\*\* \$(\d+)\/(\d+) = ([0-9.]+)\\dots\$, the minimum attained at \$k = (\d+)\$/.exec(rKos) || die('the Kos2026 row no longer states its fraction, decimal and k');
const sSteps = /rational number \$(\d+) \/ (\d+)\$, which is \$([0-9.]+)\\dots\$/.exec(rSteps) || die('the STEPS2026 row no longer states its fraction');
const sAer = /\(\\int f\)\^2\$ is \$([0-9.]+)\\dots\$/.exec(rAer) || die('the AER2026 row no longer states its decimal');
/* the digests the rows themselves print, compared with the pinned bytes */
const printedSha = (row, file) => { const m = new RegExp(file.replace(/[.]/g, '\\.') + '`: `([0-9a-f]{64})`').exec(row) || new RegExp(file.replace(/[.]/g, '\\.') + '` \\(SHA-256 `([0-9a-f]{64})`\\)').exec(row); return m ? m[1] : null; };
const refLine = (k, ref) => page[k].split('\n').find((x) => x.startsWith('- [' + ref + ']')) || '';
const SOURCES = [
  { id: '1c-koshta-k24576', kind: '1c', ref: 'Kos2026', thread: 'teorth/optimizationproblems#261', producer: 'Dennis Koshta with Claude (c1c-autocorrelation-certificate @ a4ee94ef), K = 24576', rel: 'koshta/K24576_0.4103333.json', ...bound(rKos),
    stated: { fraction: sKos[1] + '/' + sKos[2], decimal: sKos[3], at: +sKos[4] }, printedSha: printedSha(rKos, 'K24576_0.4103333.json') },
  { id: '1d-steps-n600', kind: '1d', ref: 'STEPS2026', thread: 'teorth/optimizationproblems#247', producer: 'steps-re for Mike German (c1d-certificate @ 9a091494), 600 cells', rel: 'steps-re/construction.json', ...bound(rSteps),
    stated: { fraction: sSteps[1] + '/' + sSteps[2], decimal: sSteps[3] }, printedSha: printedSha(refLine('1d', 'STEPS2026'), 'construction.json') },
  { id: '1d-aer-n600-decimal', kind: '1d', ref: 'AER2026', thread: 'teorth/optimizationproblems#248', producer: 'the AlphaEvolve repository of problems, pull request 13 (unclegareth-create @ 4b3bbd2a), C\'_4 with 600 cells, the decimals read exactly', rel: 'aer-pr13/c4prime-n600.decimal.json', ...bound(rAer),
    stated: { decimal: sAer[1] }, printedSha: printedSha(refLine('1d', 'AER2026'), 'problem_4_signed_autoconvolution_bounds.py'), shaOf: 'aer-pr13/problem_4_signed_autoconvolution_bounds.py.txt' },
  { id: '1d-aer-n600-binary64', kind: '1d', ref: 'AER2026', thread: 'teorth/optimizationproblems#248', producer: 'the same 600 literals, read as the binary64 numbers Python makes of them', rel: 'aer-pr13/c4prime-n600.double.json', ...bound(rAer),
    stated: { decimal: sAer[1] } }
];
for (const s of SOURCES) if (s.printedSha && s.printedSha !== PINS[s.shaOf || s.rel].sha256) die(s.id + ': the page prints sha256 ' + s.printedSha.slice(0, 12) + '…, the pinned bytes are ' + PINS[s.shaOf || s.rel].sha256.slice(0, 12) + '…');
/* the AlphaEvolve extraction must be the 600 literals of the pinned Python file, in order, and the two readings the same list */
{
  const lit = /^STEP_FUNCTION_C4_PRIME_N600 = \[([^\]]*)\]/m.exec(pinned('aer-pr13/problem_4_signed_autoconvolution_bounds.py.txt').toString('utf8')) || die('the AER2026 literal is gone from its pinned file');
  const want = lit[1].split(',').map((x) => x.trim()).filter(Boolean), dec = JSON.parse(pinned('aer-pr13/c4prime-n600.decimal.json')).values, dbl = JSON.parse(pinned('aer-pr13/c4prime-n600.double.json')).values;
  if (want.length !== 600 || dec.length !== 600 || dec.some((x, i) => x !== want[i]) || dbl.some((x, i) => x !== Number(want[i]))) die('the AER2026 extraction is not the pinned literal');
}
const OBJ = Object.fromEntries(SOURCES.map((s) => [s.id, JSON.parse(pinned(s.rel).toString('utf8'))]));
const heights = (s) => (s.kind === '1c' ? OBJ[s.id].weights_int : OBJ[s.id].values);
const optsOf = (s, extra = {}) => Object.assign(s.kind === '1c' ? { K: OBJ[s.id].K } : {}, extra);
const NOT_DECIDED = [{ id: '1d-sciel-n800', ref: 'SCIEL2026', thread: 'teorth/optimizationproblems#248', claim: 'C_1d <= ' + bound(rSciel).claim, verdict: 'NEEDS DATA',
  why: 'the certificate is a restricted Zenodo record (doi:10.5281/zenodo.23541324, files on request): there are no public bytes to pin; the submitters offer access to anyone checking the bound' }];

/* ---- the Python decider on the same bytes -------------------------------------------------------------------- */
function decidePy(s, claim, mutate) {
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'optq', 'autocorr.py'), s.kind, path.join(ROOT, DIR, s.rel), claim, JSON.stringify(mutate || null)], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) die('autocorr.py failed on ' + s.id + ': ' + (r.stderr || '').slice(-400));
  return JSON.parse(r.stdout);
}
const frac = (v) => v.split('/').map(BigInt);
const roundTo = ([p, q], k, up) => { const s = 10n ** BigInt(k), t = (p * s) / q, r = (p * s) % q; const u = up && r !== 0n ? t + 1n : t; return (u / s) + '.' + (u % s).toString().padStart(k, '0'); };

/* ---- the rows ------------------------------------------------------------------------------------------------ */
const rows = SOURCES.map((s) => {
  const t = Date.now(), js = SE.decide(s.kind, heights(s), s.claim, optsOf(s));
  const row = { id: s.id, constant: s.kind === '1c' ? 'C_1c' : 'C_1d', ref: s.ref, thread: s.thread, producer: s.producer, source: DIR + '/' + s.rel, sha256: PINS[s.rel].sha256, n: heights(s).length,
    claim: (s.kind === '1c' ? 'C_1c >= ' : 'C_1d <= ') + s.claim, asteriskedAtPin: s.asterisked, printedShaMatches: s.printedSha ? true : null, js, jsSeconds: +((Date.now() - t) / 1000).toFixed(1) };
  row.stated = Object.assign({}, s.stated, {
    fractionMatches: s.stated.fraction ? (() => { const [a, b] = frac(js.value), [c, d] = frac(s.stated.fraction); return a * d === b * c; })() : null,
    decimalMatches: js.decimal.startsWith(s.stated.decimal), atMatches: s.stated.at !== undefined ? js.at === s.stated.at : null });
  if (!CHECK) {
    const t2 = Date.now(); row.py = decidePy(s, s.claim); row.pySeconds = +((Date.now() - t2) / 1000).toFixed(1);
    row.agree = row.py.verdict === js.verdict && row.py.value === js.value;
    row.verdict = row.agree ? js.verdict : 'REFUSED';
  }
  if (row.stated.fractionMatches === false || !row.stated.decimalMatches || row.stated.atMatches === false) row.gap = 'the page prints ' + (s.stated.fraction ? s.stated.fraction.slice(0, 20) + '… = ' : '') + s.stated.decimal + '…' + (s.ref === 'AER2026' ? ' for both readings' : '') + '; under this reading the exact value is ' + js.decimal.slice(0, 22) + '… (the bound ' + s.claim + ' holds all the same)';
  console.log('  ' + s.id.padEnd(21) + ' n=' + String(row.n).padStart(5) + '  ' + js.verdict.padEnd(9) + ' ' + js.decimal + (row.py ? '  py ' + row.py.verdict + (row.agree ? ' (the same fraction)' : ' — DISAGREES') : '') + '  stated: ' + (row.stated.fractionMatches === false || !row.stated.decimalMatches ? 'DIFFERS' : 'matches'));
  if (row.gap) console.log('      gap: ' + row.gap);
  return row;
});
const R = Object.fromEntries(rows.map((r) => [r.id, r]));
for (const x of NOT_DECIDED) console.log('  ' + x.id.padEnd(21) + '          ' + x.verdict + ' — ' + x.why);

/* ---- the red controls: each must come out wrong in both implementations ---------------------------------------- */
const S1c = SOURCES[0], S1d = SOURCES[1], SAer = SOURCES[2];
const above1c = (() => { const [p, q] = frac(R[S1c.id].js.value); const s = 10n ** 15n, t = (p * s) / q + 2n; return (t / s) + '.' + (t % s).toString().padStart(15, '0'); })();
const below1d = roundTo(frac(R[S1d.id].js.value), 15, false);
const zeroSum = (() => { const fr = heights(S1d).map(SE.exact), { D, a } = SE.common(fr), T = a.reduce((s, x) => s + x, 0n), v0 = a[0] - T, [p, q] = SE.reduce([v0, D]); return p + '/' + q; })();
const REDS = [
  { id: 'a-bound-above-the-value', on: S1c, claim: above1c, expect: 'REFUTED', what: 'the Kos2026 function against a lower bound 2·10^-15 above its exact value' },
  { id: 'a-negative-weight', on: S1c, claim: S1c.claim, mutate: { index: 1, value: '-1' }, expect: 'REFUSED', what: 'the Kos2026 function with its second weight made negative' },
  { id: 'a-bound-below-the-value', on: S1d, claim: below1d, expect: 'REFUTED', what: 'the STEPS2026 function against an upper bound 10^-15 below its exact value' },
  { id: 'a-zero-integral', on: S1d, claim: S1d.claim, mutate: { index: 0, value: zeroSum }, expect: 'REFUSED', what: 'the STEPS2026 function with its first value changed so that Σv = 0 exactly' },
  { id: 'a-doubled-cell', on: SAer, claim: SAer.claim, mutate: { index: 599, scale: 2 }, expect: 'REFUTED', what: 'the AER2026 function (decimals) with its last, largest cell doubled' }
];
const reds = REDS.map((x) => {
  const js = SE.decide(x.on.kind, heights(x.on), x.claim, optsOf(x.on, x.mutate ? { mutate: x.mutate } : {}));
  const r = { id: x.id, what: x.what, claim: x.claim, expect: x.expect, js: js.verdict, jsWhy: js.why || js.decimal };
  if (!CHECK) { const py = decidePy(x.on, x.claim, x.mutate); r.py = py.verdict; r.pyWhy = py.why || py.valueDecimal; }
  r.fired = r.js === x.expect && (CHECK || r.py === x.expect);
  console.log('  RED ' + x.id.padEnd(24) + ' expect ' + x.expect.padEnd(8) + ' js ' + r.js + (r.py ? '  py ' + r.py : '') + (r.fired ? '  fired' : '  DID NOT FIRE'));
  return r;
});

/* ---- the record ----------------------------------------------------------------------------------------------- */
const deciders = { js: sha(rd('tools/replay-autocorr-next.js')), jsModule: sha(rd('instruments/optq/stepfun-exact.js')), py: sha(rd('instruments/optq/autocorr.py')) };
if (CHECK) {
  const was = J('certs/autocorr-replay-next.json');
  for (const r of rows) { const w = was.rows.find((x) => x.id === r.id); if (!w || w.js.value !== r.js.value || w.js.verdict !== r.js.verdict || w.claim !== r.claim || w.sha256 !== r.sha256) die('the row ' + r.id + ' no longer matches the record'); }
  if (!reds.every((r) => r.fired)) die('a red control did not fire');
  if (Object.keys(deciders).some((k) => was.deciders[k] !== deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
  console.log('autocorr replay (next): ' + rows.length + ' rows re-derived identical, ' + reds.length + '/' + reds.length + ' red controls fired (the JavaScript decider; the record holds both)');
} else {
  if (!rows.every((r) => r.agree)) die('the two implementations disagree on ' + rows.filter((r) => !r.agree).map((r) => r.id).join(', '));
  if (!reds.every((r) => r.fired)) die('a red control did not fire in both implementations');
  const rec = {
    what: 'Four newer family-1 rows of the optimization-constants registry — C_1c [Kos2026] (#261), C_1d [STEPS2026] (#247) and C_1d [AER2026] under both of its readings (#248) — decided exactly by two implementations that share no code (instruments/optq/autocorr.py; instruments/optq/stepfun-exact.js) against the bounds the registry prints, read from its pinned pages; offered as the second party the registry\'s asterisk rule asks for. [SCIEL2026] not decided: restricted bytes.',
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: +((Date.now() - T0) / 1000).toFixed(1), node: process.version,
    python: cp.execFileSync('python3', ['-I', '-c', 'import sys; print(sys.version.split()[0])'], { encoding: 'utf8' }).trim(),
    deciders, pins: DIR + '/PINS.json', registryCommit: J(DIR + '/PINS.json').registryCommit,
    counts: rows.reduce((c, r) => ((c[r.verdict] = (c[r.verdict] || 0) + 1), c), {}), rows, notDecided: NOT_DECIDED, redControls: reds
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote certs/autocorr-replay-next.json — ' + Object.entries(rec.counts).map(([k, v]) => v + ' ' + k).join(', ') + ', 1 NEEDS DATA; both implementations agree on every fraction; ' + reds.length + '/' + reds.length + ' red controls fired in both (' + rec.seconds + ' s)');
}
