/* build-today.js — the day's data for the Janela app, gated.

   usage: node apps/janela/build-today.js [--out DIR] [--platforms FILE] [--field FILE]
     defaults: corpus/janela/field/{platforms-latest.json,latest.bin} -> site/janela/data/ (git-ignored:
     the local fallback the app reads when the published copy is out of reach)

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
const LOCAL = OUT === path.join(ROOT, 'site', 'janela', 'data');

/* gate 1 — the batteries, run */
const battery = require('./gates.js').batteries(die);

/* gate 2 — the inputs are one run */
let N;
try { N = require('./numbers.js').load(); } catch (e) { die(e.message); }
const gz = fs.readFileSync(path.join(ROOT, N.feed.file));
const raw = zlib.gunzipSync(gz);
const feed = Object.assign(JSON.parse(raw.toString('utf8')), { file: N.feed.file, sha: sha(raw) });
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
const ledger = { proposers: N.ledger.proposers, commits: N.ledger.commits, scored: N.ledger.scored, first: N.ledger.first, files: N.ledger.files };
const D = require('./app/data.js');
let made;
try { made = D.make({ feed, platforms, fieldSha: field ? sha(field) : null, ledger, battery }); } catch (e) { die(e.message); }
const json = JSON.stringify(made.today);

/* gate 3 — the tab's check, run here on the written bytes */
const re = D.redecide(json);
if (re.n !== made.checks.decisions || re.same !== re.n) die('re-decided from the published bytes: ' + re.same + ' of ' + re.n + ' codes equal');
if (re.digest !== made.checks.digest) die('re-decided from the published bytes, the digest differs: ' + re.digest + ' vs ' + made.checks.digest);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'today.json'), json);
if (field) fs.writeFileSync(path.join(OUT, 'field.bin'), field);
if (LOCAL) {
  fs.writeFileSync(path.join(OUT, 'today.js'), 'window.JANELA_TODAY=' + json.replace(/</g, '\\u003c') + ';\n');
  if (field) fs.writeFileSync(path.join(OUT, 'field.js'), 'window.JANELA_FIELD="' + field.toString('base64') + '";\n');
}
const c = made.checks;
console.log('janela today: rodada ' + feed.run + ' · ' + c.places + ' locais · ' + c.decisions + ' decisões publicadas, re-decididas dos bytes escritos, iguais (digest '
  + c.digest.slice(0, 12) + ') · arredondamento para fora: ' + c.sound + ' decisões exatas das regras dos terminais iguais, ' + c.grew + ' viraram INDEFINIDA · '
  + Math.round(json.length / 1024) + ' KB -> ' + path.relative(ROOT, OUT));
