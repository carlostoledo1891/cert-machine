#!/usr/bin/env node
// Decider 1 from the command line:
//   node instruments/physicskey/decide-cli.js <runs.json> [--out <file>] [--only <run-id>]
// Reads each run's <id>.f64.gz beside the manifest and prints the object of
// RULES.md section 6, keys sorted, one space of indent (the same bytes decider 2 writes).
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { decideRun } = require('./decide.js');

function sorted(v) {
  if (Array.isArray(v)) return v.map(sorted);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = sorted(v[k]);
    return o;
  }
  return v;
}

function decideManifest(manifestPath, only) {
  const dir = path.dirname(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const runs = {};
  for (const entry of manifest.runs) {
    if (entry.notRun !== undefined) continue;
    if (only && entry.id !== only) continue;
    let bytes = null, sha = null;
    try {
      bytes = zlib.gunzipSync(fs.readFileSync(path.join(dir, entry.id + '.f64.gz')));
      sha = crypto.createHash('sha256').update(bytes).digest('hex');
    } catch (e) { bytes = null; }
    runs[entry.id] = decideRun(entry, bytes, sha);
  }
  return sorted({ runs });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const out = flag('--out'), only = flag('--only');
  if (args.length !== 1) { console.error('usage: decide-cli.js <runs.json> [--out file] [--only id]'); process.exit(2); }
  const text = JSON.stringify(decideManifest(args[0], only), null, 1) + '\n';
  if (out) fs.writeFileSync(out, text); else process.stdout.write(text);
}

module.exports = { decideManifest };
