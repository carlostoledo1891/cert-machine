#!/usr/bin/env node
/* build-ember-pdf.js — render paper/ember-hotspots.md to its PDF through
   design/paper.js, THE print engine (journal-article look; one module).
   requires: tools/build-ember-writeup.js run first (it gates on the certs). */
'use strict';
const path = require('path');
const fs = require('fs');
const P = require('../design/paper.js');
const ROOT = path.resolve(__dirname, '..');
const MD = path.join(ROOT, 'paper', 'ember-hotspots.md');
if (!fs.existsSync(MD)) { console.error('EMBER PDF REFUSED: run tools/build-ember-writeup.js first'); process.exit(1); }
P.printPaper(MD).then(out => console.log('wrote ' + path.relative(ROOT, out) + ' (' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB)'))
  .catch(e => { console.error('EMBER PDF REFUSED: ' + e.message); process.exit(1); });
