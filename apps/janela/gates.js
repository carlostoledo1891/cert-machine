/* gates.js — the two batteries Janela's builds refuse without, RUN, not remembered.
   Shared by build.js (the shell and the method page) and build-today.js (the
   daily data): one definition of "green".
   apps/janela · cert-machine                                             MIT */
'use strict';
const path = require('path');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

function batteries(die) {
  let out = '';
  try { out = cp.execFileSync('node', [path.join(ROOT, 'instruments', 'window', 'battery.js')], { encoding: 'utf8' }); }
  catch (e) { die('instruments/window/battery.js is not green:\n' + (e.stdout || '') + (e.stderr || '')); }
  const bm = /ALL PASS: (\d+) checks, (\d+) reds fired/.exec(out);
  if (!bm) die('the window battery did not print its ALL PASS line:\n' + out);
  let jout = '';
  try { jout = cp.execFileSync('node', [path.join(__dirname, 'battery.js')], { encoding: 'utf8' }); }
  catch (e) { die('apps/janela/battery.js is not green:\n' + (e.stdout || '') + (e.stderr || '')); }
  const jm = /janela battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(jout);
  if (!jm || jm[2] !== jm[3]) die('the janela battery did not pass whole:\n' + jout);
  return { checks: +bm[1], reds: +bm[2], janela: { pass: +jm[1], reds: +jm[2] } };
}

module.exports = { batteries };
