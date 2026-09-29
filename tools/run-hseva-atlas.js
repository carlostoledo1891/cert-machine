#!/usr/bin/env node
/* run-hseva-atlas.js — the return-level atlas: the method of Reis, Guimarães et
   al. (Ocean Engineering 2026) certified at every open-sea cell of
   corpus/ww3-grid. Writes certs/hseva-atlas.json.

   THE RECORD is instruments/hseva/atlas.js cellRecord(), the one place it is
   made (the atlas page bundles the same bytes). PER CELL, PER BLOCK (daily,
   weekly and monthly maxima of the 1993-2024 daily
   maxima; the unfiltered 3-hourly block is certified at the report's thirteen
   nodes, certs/hseva-ledger.json, and not here — a 93,504-point fit of six
   families takes minutes, a map of them days):
     · the six families by instruments/hseva/fit.js certify() — each fit the
       likelihood's one maximum in a box, the generalized gamma refused at its
       lognormal limit only with the proof, any other refusal recorded;
     · the four criteria and the 100- and 1000-year levels as enclosures over the
       box, printed outward to eight significant digits so they still enclose;
     · each criterion's choice by THE rule (fit.js rankRule): a family's name, or
       REFUSED;
     · what a threshold fitter would have chosen by Anderson–Darling — the
       generalized gamma past α = 500 and the exponentiated Weibull past α = 10⁴
       treated as "the limit" and left out — so the map can show where that rule
       and the certificate part;
     · THE SEVENTH FAMILY (2026-09-28): the generalized extreme value law
       certified beside the six (`gev`, its ξ enclosed) and Anderson–Darling's
       choice among the seven (`seven`), the paper's own fields untouched.
   BESIDE THE RECORDS, never in them, the section `stat` — STATISTICAL, NOT
   CERTIFIED: per cell and block the delta method's 95% intervals on the
   Anderson–Darling family's 100- and 1000-year levels and on the GEV's ξ and
   levels, and per cell the runs estimator of the daily maxima's extremal index.
   The cell's full certificate (boxes, minors, parameters) is not repeated here:
   it is re-derived, the same bytes into the same code, by the atlas page in the
   reader's tab and by instruments/hseva/battery.js on a sample of cells.

   usage: node tools/run-hseva-atlas.js                 every cell (workers in parallel; about two hours on 7)
          node tools/run-hseva-atlas.js --unit a:b      cells a..b-1 as JSON on stdout (a worker)
          node tools/run-hseva-atlas.js --cell ID       one cell as JSON on stdout */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const AT = require(path.join(ROOT, 'instruments', 'hseva', 'atlas.js'));     /* THE cell record, shared with the atlas page */
const { PAPER_SIX } = require(path.join(ROOT, 'instruments', 'hseva', 'families.js'));
const GRID = path.join(ROOT, 'corpus', 'ww3-grid');
const OUT = path.join(ROOT, 'certs', 'hseva-atlas.json');
const die = (m) => { console.error('HSEVA ATLAS REFUSED: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
/* THE CODE that certifies: the modules the atlas page inlines (one bundler's list) and atlas.js, by sha256. The parent
   takes them once; every worker takes them again and refuses to run on other bytes; the ledger records them, and the
   page refuses to build over a ledger its own bundle did not write. The corpus's meta.json likewise. */
const { CORE } = require(path.join(ROOT, 'playground', 'return-level-check', 'bundle.js'));
const codeNow = () => Object.fromEntries(CORE.map(([, rel]) => rel).concat(['instruments/hseva/atlas.js']).map((rel) => [rel, sha(fs.readFileSync(path.join(ROOT, rel)))]));
const metaNow = () => sha(fs.readFileSync(path.join(GRID, 'meta.json')));
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const BLOCKS = AT.BLOCKS, CRIT = AT.CRIT;

const META = () => JSON.parse(fs.readFileSync(path.join(GRID, 'meta.json'), 'utf8'));
let DAYS = null;
function days(meta) {
  if (DAYS) return DAYS;
  const d0 = Date.UTC(1993, 0, 1); DAYS = [];
  for (let k = 0; k < meta.days; k++) DAYS.push(new Date(d0 + k * 86400000).toISOString().slice(0, 10));
  return DAYS;
}
function series(meta, c) {
  const b = fs.readFileSync(path.join(GRID, c.file));
  if (crypto.createHash('sha256').update(b).digest('hex') !== c.sha256) die(c.id + ': the cell file does not match its sha256');
  const v = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
  if (v.length !== meta.days) die(c.id + ': ' + v.length + ' days, the corpus has ' + meta.days);
  const h = new Array(v.length); for (let i = 0; i < v.length; i++) { if (!(v[i] > 0)) die(c.id + ': a day that is not positive'); h[i] = v[i] / 500; }
  return { n: v.length, t: days(meta), h, den: 500, step: 24 };
}

const UNIT = arg('--unit'), ONE = arg('--cell');
if (UNIT || ONE) {
  if (process.env.HSEVA_ATLAS_PIN) {
    const pin = JSON.parse(process.env.HSEVA_ATLAS_PIN);
    if (JSON.stringify(codeNow()) !== JSON.stringify(pin.code)) die('the code changed under the run (a worker found other bytes than the parent pinned)');
    if (metaNow() !== pin.meta) die('corpus/ww3-grid/meta.json changed under the run');
  }
  const meta = META(), sea = meta.cells.filter((c) => c.status === 'sea');
  let pick;
  if (ONE) { pick = sea.filter((c) => c.id === ONE); if (!pick.length) die('no sea cell ' + ONE); }
  else { const [a, b] = UNIT.split(':').map(Number); pick = sea.slice(a, b); }
  const res = pick.map((c) => { const st = {}, rec = AT.cellRecord(c.id, series(meta, c), null, st); return { rec, st }; });
  process.stdout.write(JSON.stringify(ONE ? res[0].rec : res), () => process.exit(0));
} else {
  const meta = META(), sea = meta.cells.filter((c) => c.status === 'sea');
  const PIN = { code: codeNow(), meta: metaNow() };
  const t0 = Date.now(), per = 16, units = [];
  for (let a = 0; a < sea.length; a += per) units.push([a, Math.min(sea.length, a + per)]);
  const results = new Array(units.length);
  const width = Math.max(1, Math.min(os.cpus().length - 1, 8));
  let done = 0;
  const runAll = () => new Promise((resolve) => {
    const queue = units.map((u, i) => i); let live = 0;
    const next = () => {
      if (!queue.length && !live) return resolve();
      while (live < width && queue.length) {
        const i = queue.shift(), [a, b] = units[i]; live++;
        const ch = cp.spawn(process.execPath, [__filename, '--unit', a + ':' + b], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'], env: Object.assign({}, process.env, { HSEVA_ATLAS_PIN: JSON.stringify(PIN) }) });
        let buf = ''; ch.stdout.setEncoding('utf8'); ch.stdout.on('data', (d) => { buf += d; });
        ch.on('close', (code) => {
          if (code !== 0) die('unit ' + a + ':' + b + ' exited ' + code);
          results[i] = JSON.parse(buf); live--; done++;
          if (done % 5 === 0 || done === units.length) console.log('  ' + done + '/' + units.length + ' units (' + b + ' cells) at ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
          next();
        });
      }
    };
    next();
  });
  runAll().then(() => {
    if (JSON.stringify(codeNow()) !== JSON.stringify(PIN.code) || metaNow() !== PIN.meta) die('the code or the corpus changed during the run');
    const both = [].concat(...results), cells = both.map((q) => q.rec);
    const atlas = {
      what: 'The return-level atlas: the method of Reis, Guimarães, Farina, Paul, de Paula and Ribeiro (Ocean Engineering 359, 2026, 125841) — six families by maximum likelihood, four criteria, 100- and 1000-year levels — certified on the daily, weekly and monthly maxima of every open-sea cell of corpus/ww3-grid (a 4° global lattice, a 1° lattice of the Brazilian margin and the report\'s thirteen nodes of the paper\'s own WAVEWATCH III hindcast, 1993-2024).',
      generated: new Date().toISOString().slice(0, 10),
      conventions: {
        fit: 'c: 1 certified (the likelihood\'s one maximum in a box — fit.js certify: Krawczyk and the second order); c: 0 with e: 1 — the generalized gamma refused at its lognormal limit with the proof (∂ℓ/∂Q < 0 over the k-SE box around the lognormal fit and 0 < Q ≤ q1); c: 0 with s: 1 — the exponentiated Weibull\'s (α, k, λ) climb stopped at α = 10⁴ and its Gumbel coordinates (k, θ = λ^k, β = θ ln α) did not certify it either ("the climb passed k = 0.001" in w: toward the Fréchet corner), nothing proved; for the GEV, s: 1 is a maximum at or past ξ = −0.5, where it is not regular; c: 0 without s — refused; w the reason, its head and its tail',
        numbers: 'every pair an enclosure printed outward to eight significant digits; ad, ks, mse, chi2 the criteria (chi2 "U" undefined as the paper has it, "R" refused); l100, l1000 the return levels F⁻¹(1 − b/(T·8766)) in metres; a the generalized gamma\'s α (Stacy) or the exponentiated Weibull\'s α (null past the doubles); p: 1 certified in Prentice\'s coordinates (μ, σ, Q); g: 1 certified in the exponentiated Weibull\'s Gumbel coordinates (k, θ = λ^k, β = θ ln α)',
        rank: 'per criterion, the family fit.js rankRule decides, or "R" (REFUSED)',
        naive: 'what Anderson–Darling decides if the generalized gamma past α = 500, the exponentiated Weibull past α = 10⁴ (α as recorded) and a family whose (α, k, λ) climb stopped at its boundary are taken for "the limit" and left out, any other refusal blocking — the rule this repository used before 2026-09-27, kept to show where it and the certificate part',
        max: 'the largest daily maximum in 1993-2024, m (the record)',
        gev: 'the SEVENTH family, not the paper\'s: the generalized extreme value law (μ, σ, ξ), certified as the six are (families.js gev, ξ = 0 an ordinary point) — its likelihood has no global maximum (below ξ = −1 it is unbounded at the support\'s upper end), so its fit is the certified maximum where it is regular, ξ > −0.5 (Smith 1985), and a box reaching −0.5 is refused; the same fields as a fit, and x, its ξ enclosed',
        seven: 'what Anderson–Darling decides among the six and the GEV by the same rank rule, unchanged (fit.js rankRule), or "R": a family refused other than at its proved edge blocks it, so the GEV decides only where the six are decided or tied; rank and naive remain the paper\'s six',
      },
      corpus: { meta: 'corpus/ww3-grid/meta.json', sha256: PIN.meta },
      code: PIN.code,
      families: PAPER_SIX, seventh: 'gev', blocks: BLOCKS, criteria: CRIT, returnPeriods: [100, 1000],
      cells,
      stat: {
        what: 'STATISTICAL, NOT CERTIFIED — beside the records, never in them. Per cell and block: f the family Anderson–Darling decides; l100, l1000 the 95% intervals of the delta method on its 100- and 1000-year levels, taken on the log of the level so they stay positive (fit.js deltaLevel: Σ = (−H)⁻¹, the observed information at the float candidate in the certificate\'s own coordinates, −H tested positive definite by Cholesky; the level\'s gradient by central differences); gev: the same for the GEV, and x the symmetric 95% interval on its ξ. Asymptotic: successive blocks taken as independent and the model as right; four significant figures, rounded outward; null where it cannot be formed. Per cell, ei: the runs estimator of the extremal index of the daily maxima (Smith & Weissman 1994) — u the ⌈0.95 n⌉-th smallest day, a new cluster after at least r = 3 days at or below u, θ = clusters/exceedances.',
        cells: Object.fromEntries(both.map((q) => [q.rec.id, q.st])),
      },
      seconds: Number(((Date.now() - t0) / 1000).toFixed(1)),
    };
    fs.writeFileSync(OUT, JSON.stringify(atlas) + '\n');
    console.log('  certs/hseva-atlas.json written: ' + cells.length + ' cells in ' + atlas.seconds + ' s');
  });
}
