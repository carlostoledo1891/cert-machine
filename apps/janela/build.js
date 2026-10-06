/* build.js — Janela's gated build: the window instrument's battery green, the
   week re-decided from today's feed over the band record (and every published
   decision re-decided once more by the page's own function, which must agree
   with the record or the build refuses), then the page, site/janela/index.html,
   through design/template.js.

   usage: node apps/janela/build.js
   apps/janela · cert-machine                                             MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const APP = __dirname;
const ROOT = path.join(APP, '..', '..');
const SITE = path.join(ROOT, 'site', 'janela');
const die = (m) => { console.error('janela build REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* gate 1 — the instrument's battery, run, not remembered */
let out = '';
try { out = cp.execFileSync('node', [path.join(ROOT, 'instruments', 'window', 'battery.js')], { encoding: 'utf8' }); }
catch (e) { die('instruments/window/battery.js is not green:\n' + (e.stdout || '') + (e.stderr || '')); }
const bm = /ALL PASS: (\d+) checks, (\d+) reds fired/.exec(out);
if (!bm) die('the battery did not print its ALL PASS line:\n' + out);
const battery = { checks: +bm[1], reds: +bm[2] };
/* gate 1b — Janela's own battery: the operations agree with the acts, the records re-derive */
let jout = '';
try { jout = cp.execFileSync('node', [path.join(__dirname, 'battery.js')], { encoding: 'utf8' }); }
catch (e) { die('apps/janela/battery.js is not green:\n' + (e.stdout || '') + (e.stderr || '')); }
const jm = /janela battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(jout);
if (!jm || jm[2] !== jm[3]) die('the janela battery did not pass whole:\n' + jout);

/* gate 2 — the records, read once (numbers.js throws on a record that lost its shape) */
let N;
try { N = require('./numbers.js').load(); } catch (e) { die(e.message); }

/* gate 3 — the page: built from the records; the page's own decider must equal the record */
const P = require('./page.js');
let page;
try { page = P.build(N, P.bundle(), git, battery); } catch (e) { die(e.message); }
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), page.html);

const c = N.counts;
console.log('site/janela/index.html written (' + Math.round(page.html.length / 1024) + ' KB) · rodada ' + N.feed.run
  + ' · ' + N.decisions + ' decisões: ' + c['LIBERADA'] + ' LIBERADA, ' + c['VETADA'] + ' VETADA, ' + c['INDEFINIDA'] + ' INDEFINIDA, ' + c['SEM DADOS'] + ' SEM DADOS'
  + ' (' + page.checked + ' re-decididas pela página, iguais) · faixas ' + N.bands.okCells + '/' + N.bands.cells
  + ' · α ' + (N.alpha ? 'presente' : 'ausente') + ' · placar ' + N.ledger.commits + ' comprometidas, ' + N.ledger.scored + ' avaliadas'
  + ' · bateria ' + battery.checks + ' verificações, ' + battery.reds + ' vermelhos · git ' + git);
