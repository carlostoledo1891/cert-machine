#!/usr/bin/env node
/* targets.js — what has already been scouted, and what became of it.

   A LOOKUP. It prints and exits. It refuses nothing, blocks nothing, and is
   wired into no build. Its only job is to stop this project spending another
   afternoon rediscovering that Chen and Kauers got there in February 2025.

   usage: node tools/targets.js            everything, newest verdicts first
          node tools/targets.js poly       anything matching a word           */
'use strict';

const path = require('path');
const T = require(path.join(__dirname, '..', 'corpus', 'targets.json'));
const q = (process.argv[2] || '').toLowerCase();

const rows = T.targets.filter((t) => !q || JSON.stringify(t).toLowerCase().includes(q));
const order = { DEAD: 0, OCCUPIED: 1, UNSCOUTED: 2, OPEN: 3 };
rows.sort((a, b) => (order[a.verdict.split(' ')[0]] ?? 9) - (order[b.verdict.split(' ')[0]] ?? 9));

const wrap = (s, w, pad) => {
  const out = []; let line = '';
  for (const word of String(s).split(/\s+/)) {
    if ((line + ' ' + word).trim().length > w) { out.push(line.trim()); line = word; }
    else line += ' ' + word;
  }
  if (line.trim()) out.push(line.trim());
  return out.map((l, i) => (i === 0 ? '' : pad) + l).join('\n');
};

if (!rows.length) { console.log('\n  nothing scouted matching "' + q + '" — which means unknown, not open.\n'); process.exit(0); }

console.log('');
for (const t of rows) {
  console.log('  ' + t.verdict.padEnd(22) + t.name);
  for (const k of ['killedBy', 'finding', 'measured', 'why', 'structure', 'unscouted', 'worth', 'note']) {
    if (t[k]) console.log('    ' + (k + ':').padEnd(11) + wrap(t[k], 84, ' '.repeat(15)));
  }
  console.log('');
}
console.log('  ' + rows.length + ' of ' + T.targets.length + ' targets. DEAD and OCCUPIED are the valuable rows:');
console.log('  they are the afternoons you do not have to spend again.');
console.log('');
