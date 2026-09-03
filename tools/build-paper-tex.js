#!/usr/bin/env node
/* build-paper-tex.js — compile paper/tex/<name>.tex to paper/<name>.pdf.

   PAPERS are LaTeX here (the bench style, via paper/tex/certmachine.sty);
   PAGES stay in the house design system. design/paper.js remains for the
   markdown drafts that have not been converted.

   usage: node tools/build-paper-tex.js <name> [...names]
          node tools/build-paper-tex.js --all */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const TEX = path.join(ROOT, 'paper', 'tex');
const die = (m) => { console.error('PAPER TEX REFUSED: ' + m); process.exit(1); };

let names = process.argv.slice(2);
if (names.includes('--all')) {
  names = fs.readdirSync(TEX).filter((f) => f.endsWith('.tex')).map((f) => f.replace(/\.tex$/, ''));
}
if (!names.length) die('usage: node tools/build-paper-tex.js <name> | --all');

let ok = 0;
for (const n of names) {
  const src = path.join(TEX, n + '.tex');
  if (!fs.existsSync(src)) die('no ' + path.relative(ROOT, src));
  const r = cp.spawnSync('tectonic', ['--outdir', path.join(ROOT, 'paper'), src],
    { cwd: TEX, maxBuffer: 64 * 1024 * 1024 });
  const out = String(r.stdout) + String(r.stderr);
  if (r.status !== 0) die(n + ' failed to compile:\n' + out.slice(-1500));
  /* a LaTeX run can "succeed" while dropping references or overfull boxes we
     would rather know about; undefined references are treated as failures */
  if (/undefined (reference|citation)/i.test(out)) die(n + ': undefined reference or citation');
  const pdf = path.join(ROOT, 'paper', n + '.pdf');
  if (!fs.existsSync(pdf)) die(n + ': no PDF was written');
  /* placeholders must never reach a compiled paper */
  const tex = fs.readFileSync(src, 'utf8');
  for (const bad of ['[OPERATOR]', 'TODO', 'XXX']) {
    if (tex.includes(bad)) die(n + ' still contains the placeholder ' + bad + ' — fill it or remove it before compiling');
  }
  console.log('wrote paper/' + n + '.pdf (' + (fs.statSync(pdf).size / 1024).toFixed(0) + ' KB)');
  ok++;
}
console.log(ok + ' paper(s) compiled');
