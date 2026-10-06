/* build.js — Janela's gated build: the window instrument's battery and Janela's
   own green, the week re-decided from the newest feed over the band record (and
   every published decision re-decided once more by the method page's own
   function, which must agree with the record or the build refuses), then:

     site/janela/metodo/index.html   the method page — the document, "por que
                                     confiar" — through design/template.js
     site/janela/{index.html, app.js, geo.js, vendor/}
                                     the APP shell — static: places, presets,
                                     rules, alphas, the month's exact counts and
                                     the deciding modules (apps/janela/app/)

   The DAY's data is not here: apps/janela/build-today.js writes it (gated the
   same way) and the daily Action pushes it to the janela-field branch. When the
   day's inputs are on this disk (corpus/janela/field/), this build also writes
   the local copy the app falls back to (site/janela/data/, git-ignored).

   This page set is rebuilt when code or records change — never daily into main.

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

/* gate 1 — the two batteries, run, not remembered */
const battery = require('./gates.js').batteries(die);

/* gate 2 — the records, read once (numbers.js throws on a record that lost its shape) */
let N;
try { N = require('./numbers.js').load(); } catch (e) { die(e.message); }

/* gate 3 — the method page: built from the records; the page's own decider must equal the record */
const P = require('./page.js');
let page;
try { page = P.build(N, P.bundle(), git, battery); } catch (e) { die(e.message); }
fs.mkdirSync(path.join(SITE, 'metodo'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'metodo', 'index.html'), page.html);

/* gate 4 — the app shell (the vendored map library is the pinned bytes or the build refuses) */
let A;
try { A = require('./app/build-app.js').emit(N, git); } catch (e) { die(e.message); }

const c = N.counts;
console.log('site/janela/metodo/index.html written (' + Math.round(page.html.length / 1024) + ' KB) · rodada ' + N.feed.run
  + ' · ' + N.decisions + ' decisões: ' + c['LIBERADA'] + ' LIBERADA, ' + c['VETADA'] + ' VETADA, ' + c['INDEFINIDA'] + ' INDEFINIDA, ' + c['SEM DADOS'] + ' SEM DADOS'
  + ' (' + page.checked + ' re-decididas pela página, iguais) · faixas ' + N.bands.okCells + '/' + N.bands.cells
  + ' · α ' + (N.alpha ? 'presente' : 'ausente') + ' · placar ' + N.ledger.commits + ' comprometidas, ' + N.ledger.scored + ' avaliadas'
  + ' · bateria ' + battery.checks + ' verificações, ' + battery.reds + ' vermelhos; janela ' + battery.janela.pass + ' + ' + battery.janela.reds + ' vermelhos · git ' + git);
console.log('site/janela/index.html (o app) written (' + Math.round(A.bytes / 1024) + ' KB; geo.js ' + Math.round(A.geo / 1024) + ' KB, ' + A.fields + ' campos) · ' + A.places + ' locais');

/* the local copy of the day's data, when its inputs are on this disk — gated by build-today.js itself */
if (fs.existsSync(path.join(ROOT, 'corpus', 'janela', 'field', 'platforms-latest.json'))) {
  try { process.stdout.write(cp.execFileSync('node', [path.join(APP, 'build-today.js')], { encoding: 'utf8' })); }
  catch (e) { die('the day\'s data did not build:\n' + (e.stdout || '') + (e.stderr || '')); }
} else console.log('janela today: corpus/janela/field/ is empty here — the app reads the published day from the janela-field branch');
