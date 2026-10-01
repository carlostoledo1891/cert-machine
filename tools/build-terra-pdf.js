#!/usr/bin/env node
/* build-terra-pdf.js — render paper/terra-peaks.md to its PDF through
   design/paper.js, THE print engine (journal-article look; one module).
   requires: tools/build-terra-writeup.js run first (it gates on the certs). */
'use strict';
/* SUPERSEDED 2026-10-01: paper/terra-peaks.pdf is now written by tectonic from paper/tex/terra-peaks.tex;
   printing the superseded markdown note over it would destroy the paper. Refuses unless ALLOW_STALE_MD. */
if (!process.env.ALLOW_STALE_MD) { console.error('build-terra-pdf.js: superseded by the LaTeX paper — run tools/build-paper-tex.js terra-peaks'); process.exit(1); }
const path = require('path');
const fs = require('fs');
const P = require('../design/paper.js');
const ROOT = path.resolve(__dirname, '..');
const MD = path.join(ROOT, 'paper', 'terra-peaks.md');
if (!fs.existsSync(MD)) { console.error('TERRA PDF REFUSED: run tools/build-terra-writeup.js first'); process.exit(1); }
P.printPaper(MD).then(out => console.log('wrote ' + path.relative(ROOT, out) + ' (' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB)'))
  .catch(e => { console.error('TERRA PDF REFUSED: ' + e.message); process.exit(1); });
