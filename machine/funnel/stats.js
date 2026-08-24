/* stats.js — provenance-at-write memos and a stats reader that REFUSES what it
   cannot trace. ENGINE TOOLING — research/_engine/funnel · ships nowhere.

   Implements PROBES.md machine rule 3 (adopted 2026-08-20, paid for by
   instrument-log.jsonl's missing seed field: one wrong reconciliation, two
   permanent correction lines):

     "every record a campaign emits carries its provenance (seed/runId,
      generator, and the metric's NAME) at write time; a comparative count may
      not enter a ledger line, session summary, or page without its metric
      definition attached at first use. Stats refuse unprovenanced lines."

   The memo is the INSTANCE-side record class this governs — the machine's own
   chained run files already carry seed + harnessSha per line (funnel.js).
   Instances that used to hand-roll instrument-log.jsonl appends use
   memoAppend() instead; readers use readMemo()/tally(), which throw with a
   named reason rather than silently tallying lines nobody can re-derive.

   Refusal reasons are STRINGS BY CONTRACT (batteries match on them):
     MEMO-UNPROVENANCED   a line is missing seed, runId, generator, or metric
     MEMO-METRIC-UNDEFINED  a metric's first use in the file carries no
                            metricDefinition
     MEMO-UNPARSEABLE     a line is not valid JSON
     METRIC-UNDEFINED     tally() asked for a metric the file never defines */
'use strict';
const fs = require('fs');

const PROVENANCE_FIELDS = ['seed', 'runId', 'generator', 'metric'];

function provenanceViolation(rec) {
  for (const f of PROVENANCE_FIELDS) {
    if (typeof rec[f] !== 'string' || rec[f].length === 0) return 'missing or empty ' + f;
  }
  return null;
}

/* scan an existing memo for the metric names already defined in it */
function definedMetrics(file) {
  const defs = {};
  if (!fs.existsSync(file)) return defs;
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.length > 0);
  for (const l of lines) {
    let rec;
    try { rec = JSON.parse(l); } catch (e) { continue; } /* readMemo owns the refusal */
    if (rec && typeof rec.metric === 'string' && typeof rec.metricDefinition === 'string' && rec.metricDefinition.length > 0) {
      if (!(rec.metric in defs)) defs[rec.metric] = rec.metricDefinition;
    }
  }
  return defs;
}

/* append one memo line. Throws (writes NOTHING) unless the record carries full
   provenance, and — on a metric's first use in this file — its definition. */
function memoAppend(file, rec) {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) {
    throw new Error('MEMO-UNPROVENANCED: record must be an object');
  }
  const v = provenanceViolation(rec);
  if (v) throw new Error('MEMO-UNPROVENANCED: ' + v);
  const defs = definedMetrics(file);
  if (!(rec.metric in defs)) {
    if (typeof rec.metricDefinition !== 'string' || rec.metricDefinition.length === 0) {
      throw new Error('MEMO-METRIC-UNDEFINED: first use of metric ' + JSON.stringify(rec.metric)
        + ' in ' + file + ' carries no metricDefinition');
    }
  }
  fs.appendFileSync(file, JSON.stringify(rec) + '\n');
  return true;
}

/* read a memo strictly. Returns {records, metrics}. Throws MEMO-REFUSED listing
   every violation (line numbers 1-based) unless opts.tolerate — and even then
   the violations come back, named, in .violations. */
function readMemo(file, opts) {
  const o = opts || {};
  const records = [];
  const metrics = {};
  const violations = [];
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(l => l.length > 0) : [];
  for (let i = 0; i < lines.length; i++) {
    let rec;
    try { rec = JSON.parse(lines[i]); } catch (e) {
      violations.push({ line: i + 1, why: 'MEMO-UNPARSEABLE' });
      continue;
    }
    const v = provenanceViolation(rec);
    if (v) {
      violations.push({ line: i + 1, why: 'MEMO-UNPROVENANCED: ' + v });
      continue;
    }
    if (!(rec.metric in metrics)) {
      if (typeof rec.metricDefinition === 'string' && rec.metricDefinition.length > 0) {
        metrics[rec.metric] = rec.metricDefinition;
      } else {
        violations.push({ line: i + 1, why: 'MEMO-METRIC-UNDEFINED: first use of ' + JSON.stringify(rec.metric) });
        continue;
      }
    }
    records.push(rec);
  }
  if (violations.length && !o.tolerate) {
    const head = violations.slice(0, 5).map(x => 'line ' + x.line + ': ' + x.why).join('; ');
    throw new Error('MEMO-REFUSED: ' + violations.length + ' unprovenanced/undefined line(s) in ' + file + ' — ' + head);
  }
  return { records, metrics, violations };
}

/* tally one metric from a memo. Strict read; refuses undefined metrics. A
   count that leaves this function carries its own definition — quote them
   together (rule 3's "definition attached at first use"). */
function tally(file, metric) {
  const m = readMemo(file);
  if (!(metric in m.metrics)) {
    throw new Error('METRIC-UNDEFINED: ' + JSON.stringify(metric) + ' is never defined in ' + file);
  }
  const rows = m.records.filter(r => r.metric === metric);
  let sum = 0, numeric = 0;
  for (const r of rows) {
    if (typeof r.value === 'number' && Number.isFinite(r.value)) { sum += r.value; numeric++; }
  }
  return { metric, definition: m.metrics[metric], count: rows.length, numericValues: numeric, sum };
}

module.exports = { memoAppend, readMemo, tally, PROVENANCE_FIELDS };
