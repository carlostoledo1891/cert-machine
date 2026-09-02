#!/usr/bin/env node
/* build-paper-pdf.js — print ANY paper/*.md to its sibling PDF through
   design/paper.js. usage: node tools/build-paper-pdf.js lambda4-proof */
'use strict';
const path = require('path');
const fs = require('fs');
const P = require('../design/paper.js');
const ROOT = path.resolve(__dirname, '..');
const name = process.argv[2];
if (!name) { console.error('usage: node tools/build-paper-pdf.js <paper-basename>'); process.exit(2); }
const MD = path.join(ROOT, 'paper', name.replace(/\.md$/, '') + '.md');
if (!fs.existsSync(MD)) { console.error('PAPER PDF REFUSED: no ' + MD); process.exit(1); }
P.printPaper(MD).then(out => console.log('wrote ' + path.relative(ROOT, out) + ' (' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB)'))
  .catch(e => { console.error('PAPER PDF REFUSED: ' + e.message); process.exit(1); });
