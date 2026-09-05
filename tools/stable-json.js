/* stable-json.js — write a record only when the record changed.
   tools/ · cert-machine

   WHY. certs/erdos1038-inf.json embeds a `builtAt` timestamp, so its bytes —
   and therefore its sha256 — changed on EVERY build even when not one certified
   number moved. certs/envs-record.json pins that sha, so the pin churned with
   it, and a pin that changes every run is not pinning anything: a reader
   diffing two builds cannot tell a re-run from a re-derivation, which is the
   whole job of a content hash.

   THE FIX IS NOT TO DELETE THE TIMESTAMP. `builtAt` is provenance and it is
   worth keeping. It is to stop rewriting the file when the content is the same,
   so `builtAt` comes to mean WHEN THIS CONTENT WAS FIRST PRODUCED rather than
   when the build last ran — which is both more useful and more true.

     writeStable('certs/x.json', obj)                 // volatile: builtAt, generated, ms, seconds
     writeStable('certs/x.json', obj, ['stamp'])      // plus your own

   Volatile keys are stripped at EVERY depth before comparing, so a nested
   sub-certificate's timestamp does not resurrect the churn. Returns true if it
   wrote, false if the content was unchanged and the file was left alone. */
'use strict';

const fs = require('fs');

const VOLATILE = ['builtAt', 'generated', 'generatedAt', 'ms', 'seconds', 'elapsed', 'elapsedMs'];

/* a deep copy with the volatile keys removed, key order normalised so a
   reordered but identical record still compares equal */
function stable(v, keys) {
  if (Array.isArray(v)) return v.map((x) => stable(x, keys));
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) if (!keys.includes(k)) out[k] = stable(v[k], keys);
    return out;
  }
  return v;
}

function writeStable(file, obj, extraVolatile, { space = 1 } = {}) {
  const keys = VOLATILE.concat(extraVolatile || []);
  const next = JSON.stringify(obj, null, space) + '\n';
  if (fs.existsSync(file)) {
    let prev = null;
    try { prev = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { prev = null; }
    if (prev && JSON.stringify(stable(prev, keys)) === JSON.stringify(stable(obj, keys))) return false;
  }
  fs.writeFileSync(file, next);
  return true;
}

module.exports = { writeStable, stable, VOLATILE };
