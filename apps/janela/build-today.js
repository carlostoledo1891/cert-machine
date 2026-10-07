/* build-today.js — the day's data for the Janela app, gated.

   usage: node apps/janela/build-today.js [--out DIR] [--platforms FILE] [--field FILE] [--feed YYYYMMDD]
     --feed re-runs a past day: check out the main commit its today.json names, run
     `python apps/janela/audit/field.py YYYY-MM-DD`, then this with --feed YYYYMMDD
     defaults: corpus/janela/field/{platforms-latest.json,latest.bin} -> site/janela/data/ (git-ignored:
     a LOCAL copy for a page opened from disk or a desk preview; production reads janela-field only)

   Refuses unless instruments/window/battery.js and apps/janela/battery.js are green, the units' forecast
   and the map field are the feed's own run, and every published decision re-decides identically from the
   written bytes (the codes AND the digest over every verdict, witness and threshold). Writes today.json
   (+ field.bin beside it); with the default output also today.js and field.js, the same bytes as scripts,
   so a page opened from disk (file://) still has its data.

   The daily Action writes to a temporary directory and force-pushes it as the single commit of the
   orphan branch janela-field: the day's data never enters main.
   apps/janela · cert-machine                                             MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const APP = __dirname;
const ROOT = path.join(APP, '..', '..');
const die = (m) => { console.error('janela today REFUSED: ' + m); process.exit(1); };
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const OUT = path.resolve(arg('--out', path.join(ROOT, 'site', 'janela', 'data')));
const PLAT = path.resolve(arg('--platforms', path.join(ROOT, 'corpus', 'janela', 'field', 'platforms-latest.json')));
const FIELD = path.resolve(arg('--field', path.join(ROOT, 'corpus', 'janela', 'field', 'latest.bin')));
const NOAA_UNITS = path.resolve(arg('--noaa-units', path.join(ROOT, 'corpus', 'janela', 'field', 'platforms-noaa-latest.json')));
const LOCAL = OUT === path.join(ROOT, 'site', 'janela', 'data');

/* gate 1 — the batteries, run */
const battery = require('./gates.js').batteries(die);

/* gate 2 — the inputs are one run */
let N;
const FEED_DAY = arg('--feed', null);
if (FEED_DAY !== null && !/^\d{8}$/.test(FEED_DAY)) die('--feed takes YYYYMMDD');
try { N = require('./numbers.js').load(FEED_DAY ? { feed: FEED_DAY } : {}); } catch (e) { die(e.message); }
/* the main commit the day is built from, so a Nota de decisão names the code that decided it */
let git = null;
try {
  const cp = require('child_process');
  git = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (cp.execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: ROOT, encoding: 'utf8' }).trim()) git += '+dirty';
} catch (e) { git = null; }
const gz = fs.readFileSync(path.join(ROOT, N.feed.file));
const raw = zlib.gunzipSync(gz);
const feed = Object.assign(JSON.parse(raw.toString('utf8')), { file: N.feed.file, sha: sha(raw) });
/* the second provider's day (NOAA, the same run), shown beside and never decided on: null when it was not read */
let noaa = null;
if (N.noaa) {
  const nraw = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, N.noaa.file)));
  if (sha(nraw) !== N.noaa.sha) die(N.noaa.file + ' changed between two reads');
  noaa = Object.assign(JSON.parse(nraw.toString('utf8')), { file: N.noaa.file, sha: N.noaa.sha });
}
/* NOAA at the units (noaa.py --units): used only when it is the same run; another run is left out, said so in the day */
let noaaUnits = null;
if (noaa && fs.existsSync(NOAA_UNITS)) {
  const ub = fs.readFileSync(NOAA_UNITS);
  const u = JSON.parse(ub.toString('utf8'));
  if (u.run === feed.run) noaaUnits = Object.assign(u, { sha: sha(ub) });
  else console.log('janela today: ' + path.relative(ROOT, NOAA_UNITS) + ' is the run ' + u.run + ', not ' + feed.run + ' — the units decide on ECMWF\'s band alone');
}
if (!fs.existsSync(PLAT)) die(PLAT + ' is missing: run apps/janela/audit/field.py first');
const pbytes = fs.readFileSync(PLAT);
const platforms = Object.assign(JSON.parse(pbytes.toString('utf8')), { sha: sha(pbytes) });
let field = null;
if (fs.existsSync(FIELD)) {
  field = fs.readFileSync(FIELD);
  if (field.slice(0, 4).toString() !== 'JNF1') die('the field is not a JNF1 file');
  const run = String(field.readUInt32LE(16));
  if (run.slice(0, 8) !== feed.run.slice(0, 10).replace(/-/g, '')) die('the field (' + run + ') is not the feed\'s run (' + feed.run + ')');
}

/* the data */
const ledger = { proposers: N.ledger.proposers, commits: N.ledger.commits, scored: N.ledger.scored, first: N.ledger.first, files: N.ledger.files, rule: N.ledger.rule, firstLook: N.ledger.firstLook };
const D = require('./app/data.js');
let made;
try { made = D.make({ feed, noaa, noaaUnits, platforms, fieldSha: field ? sha(field) : null, ledger, battery, git }); } catch (e) { die(e.message); }
const json = JSON.stringify(made.today);

/* gate 3 — the tab's check, run here on the written bytes */
const re = D.redecide(json);
if (re.n !== made.checks.decisions || re.same !== re.n) die('re-decided from the published bytes: ' + re.same + ' of ' + re.n + ' codes equal');
if (re.digest !== made.checks.digest) die('re-decided from the published bytes, the digest differs: ' + re.digest + ' vs ' + made.checks.digest);

/* gate 4 — THE SECOND VERIFIER: instruments/window/verify/verify_day.py, written clean-room from its SPEC.md
   (Python standard library; it never read decide.js, q.js or criteria.js), re-decides every published letter from
   the written bytes and checks every input pin. Two programs that share no code must agree on all of them; the
   result rides in the day (today.second), so the app can say so. */
let final = json;
{
  const os = require('os'), cp = require('child_process');
  const VER = path.join(ROOT, 'instruments', 'window', 'verify', 'verify_day.py');
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'janela-')), 'today.json');
  fs.writeFileSync(tmp, json);
  const t0 = Date.now();
  let rep;
  try { rep = JSON.parse(cp.execFileSync('python3', [VER, tmp, '--root', ROOT, '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 })); }
  catch (e) { die('the second verifier refused the day:\n' + String(e.stdout || '').slice(0, 2000) + String(e.stderr || '').slice(0, 2000)); }
  if (!rep.ok || rep.equal !== rep.decisions || rep.decisions !== made.checks.decisions) die('the second verifier disagrees: ' + rep.equal + ' of ' + rep.decisions + ' equal (published ' + made.checks.decisions + ')');
  const second = { verifier: 'instruments/window/verify/verify_day.py', sha256: sha(fs.readFileSync(VER)), spec: 'instruments/window/verify/SPEC.md',
    specSha256: sha(fs.readFileSync(path.join(ROOT, 'instruments', 'window', 'verify', 'SPEC.md'))), decisions: rep.decisions, equal: rep.equal, ms: Date.now() - t0 };
  final = JSON.stringify(Object.assign({}, made.today, { second }));
  /* the decisions the first gate re-decided are the same bytes: only the result was added */
  if (D.redecide(final).digest !== made.checks.digest) die('adding the second verifier\'s result moved the decisions');
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'today.json'), final);
if (field) fs.writeFileSync(path.join(OUT, 'field.bin'), field);
if (LOCAL) {
  fs.writeFileSync(path.join(OUT, 'today.js'), 'window.JANELA_TODAY=' + final.replace(/</g, '\\u003c') + ';\n');
  if (field) fs.writeFileSync(path.join(OUT, 'field.js'), 'window.JANELA_FIELD="' + field.toString('base64') + '";\n');
}
const c = made.checks;
console.log('janela today: rodada ' + feed.run + ' · ' + c.places + ' locais · ' + c.decisions + ' decisões publicadas, re-decididas dos bytes escritos, iguais (digest '
  + c.digest.slice(0, 12) + ') · arredondamento para fora: ' + c.sound + ' decisões exatas das regras dos terminais iguais, ' + c.grew + ' viraram INDEFINIDA · '
  + Math.round(final.length / 1024) + ' KB · segundo verificador ' + JSON.parse(final).second.equal + '/' + JSON.parse(final).second.decisions + ' -> ' + path.relative(ROOT, OUT));
