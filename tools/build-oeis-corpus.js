#!/usr/bin/env node
/* build-oeis-corpus.js — build the constants corpus from OEIS's own bulk files.

   names.gz and stripped.gz are the downloads OEIS publishes for exactly this
   purpose. Two requests instead of fifteen hundred: the polite way to take a
   corpus from a volunteer-run service, and faster besides. */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..');

const names = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'corpus/names.gz'))).toString('utf8').split('\n');
const strip = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'corpus/stripped.gz'))).toString('utf8').split('\n');

const wanted = new Map();
for (const l of names) {
  if (l[0] !== 'A') continue;
  const sp = l.indexOf(' ');
  if (sp < 0) continue;
  const id = l.slice(0, sp), name = l.slice(sp + 1).trim();
  if (!/^Decimal expansion of/i.test(name)) continue;
  wanted.set(id, name);
}

const entries = [];
for (const l of strip) {
  if (l[0] !== 'A') continue;
  const sp = l.indexOf(' ');
  if (sp < 0) continue;
  const id = l.slice(0, sp);
  const name = wanted.get(id);
  if (!name) continue;
  const digits = l.slice(sp + 1).trim().replace(/^,|,$/g, '').split(',')
    .map(s => s.trim()).filter(s => /^-?\d+$/.test(s)).map(Number);
  if (digits.length < 12) continue;
  entries.push({ id, name, digits, offset: null });
}
fs.writeFileSync(path.join(ROOT, 'corpus/oeis-constants.json'),
  JSON.stringify({ source: 'OEIS names.gz + stripped.gz bulk downloads', entries }, null, 0) + '\n');
console.log('corpus: ' + entries.length + ' decimal-expansion constants (from ' + wanted.size + ' named)');
