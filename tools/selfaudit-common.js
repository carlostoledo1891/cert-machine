/* selfaudit-common.js — the rules the self-audit's phases share (one module, several consumers: a rule defined twice
   WILL diverge). Used by tools/run-selfaudit-inventory.js (phase 1) and tools/run-selfaudit.js (phase 2).

   recordRows(doc)            the rows a record carries, whatever it calls them
   findRecordRow(rows, id)    the record row a register row id names (the register's id ends with the record's row id,
                              slashes written as dashes; the longest match wins)
   timingOf(rows, id)         the per-row timing a record carries for that register row: { field, ms } or nulls
   leafDiff(a, b)             the JSON paths at which two parsed documents differ, arrays of objects compared per key
                              as [*].key (the same walk Phase 1 ran by hand on the re-derived records)
   isStampPath(p)             whether a differing path is one the records declare as a stamp (the pre-registration's
                              "generated, seconds, git"): generated, generatedAt, generatedBy and git at the ROOT only
                              (a git field below the root is a pinned commit, never a stamp); a leaf keyed ms, seconds,
                              runMs or rowMsTotal anywhere, the root included (seconds at the root in gsm8k and horizon;
                              timing.runMs, timing.rowMsTotal, decision.seconds, congruence.ms, measured.ms, detail.ms,
                              families[*].ms — exactly what Phase 1 saw, and nothing else)                          MIT */
'use strict';

const TIMING_FIELDS = ['ms', 'seconds'];
const ROOT_STAMPS = new Set(['generated', 'generatedAt', 'generatedBy', 'git']);
const LEAF_STAMPS = new Set(['ms', 'seconds', 'runMs', 'rowMsTotal']);

const recordRows = (d) => {
  let rows = d.rows || d.entries || d.claims || d.decisions || [];
  if (!Array.isArray(rows) && typeof rows === 'object') rows = Object.values(rows);
  return Array.isArray(rows) ? rows.filter((x) => x && typeof x === 'object') : [];
};

const findRecordRow = (rows, id) => {
  const cands = rows.filter((x) => typeof x.id === 'string').map((x) => [x, String(x.id).replace(/\//g, '-')]);
  const hits = cands.filter(([, n]) => id === n || id.endsWith('-' + n));
  if (!hits.length) return null;
  hits.sort((a, b) => b[1].length - a[1].length);
  return hits[0][0];
};

const timingOf = (rows, id) => {
  const x = findRecordRow(rows, id);
  if (!x) return { field: null, ms: null };
  for (const f of TIMING_FIELDS) if (typeof x[f] === 'number') return { field: f, ms: f === 'ms' ? x[f] : Math.round(x[f] * 1000) };
  return { field: null, ms: null };
};

const leafDiff = (a, b, pre = '', out = new Set()) => {
  const join = (k) => (pre ? pre + '.' + k : k);
  if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) { out.add(pre || '<root>'); return out; }
  if (Array.isArray(a)) {
    if (a.length !== b.length) { out.add(pre + '[len ' + a.length + '→' + b.length + ']'); return out; }
    a.forEach((x, i) => {
      const y = b[i];
      if (JSON.stringify(x) === JSON.stringify(y)) return;
      if (x && y && typeof x === 'object' && !Array.isArray(x) && typeof y === 'object' && !Array.isArray(y)) {
        for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) leafDiff(x[k], y[k], pre + '[*].' + k, out);
      } else out.add(pre + '[' + i + ']');
    });
  } else if (a && typeof a === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a) || !(k in b)) out.add(join(k));
      else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) leafDiff(a[k], b[k], join(k), out);
    }
  } else out.add(pre || '<root>');
  return out;
};

const isStampPath = (p) => {
  if (ROOT_STAMPS.has(p)) return true;
  return LEAF_STAMPS.has(p.split('.').pop());
};

module.exports = { TIMING_FIELDS, ROOT_STAMPS, LEAF_STAMPS, recordRows, findRecordRow, timingOf, leafDiff, isStampPath };
