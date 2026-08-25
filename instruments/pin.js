/* pin.js — a certificate is over a byte sequence, not over "the map in that
   paper". Sources transcribed into families live in corpus/sources/ with
   their sha256 recorded in PINS.json; a family entry that cites a pinned
   source re-hashes it at certify time. If the bytes have drifted, the
   transcription no longer points at anything and the certifier must REFUSE —
   the same discipline the source lab applies to this repo's own lift.

   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = path.join(__dirname, '..', 'corpus', 'sources');
const PINS = JSON.parse(fs.readFileSync(path.join(DIR, 'PINS.json'), 'utf8'));

const cache = new Map();

/* verify(file, [opts]) -> { file, sha256, ok, [why] } — re-hash the pinned
   source on disk and compare. Cached per process: the bytes cannot change
   under a run without the next process noticing. opts.pins substitutes the
   pin table — the seam the battery's red control forges through; never
   passed by a family. */
function verify(file, opts) {
  const pins = (opts && opts.pins) || PINS;
  if (pins === PINS && cache.has(file)) return cache.get(file);
  const expected = pins[file];
  let r;
  if (!expected) r = { file, ok: false, why: 'no pin recorded for ' + file + ' in corpus/sources/PINS.json' };
  else {
    try {
      const sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(DIR, file))).digest('hex');
      r = sha256 === expected
        ? { file, sha256, ok: true }
        : { file, sha256, expected, ok: false, why: 'sha256 mismatch — the source bytes drifted from their pin' };
    } catch (e) {
      r = { file, expected, ok: false, why: 'source file unreadable: ' + e.message };
    }
  }
  if (pins === PINS) cache.set(file, r);
  return r;
}

module.exports = { verify, PINS };
