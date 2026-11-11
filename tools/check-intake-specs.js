#!/usr/bin/env node
/* check-intake-specs.js — every Lean intake spec on disk against the written format (instruments/intake/SPEC.md,
   instruments/intake/spec.schema.json), plus the rules a schema cannot say. A battery: exits 1 on the first spec that
   does not hold. The validator reads the subset of JSON Schema the schema uses (type, properties, required,
   additionalProperties, items, enum, pattern) — no dependency.

   usage: node tools/check-intake-specs.js [spec.json ...]      (default: corpus/lean-intake/<id>/spec.json, all)   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'instruments', 'intake', 'spec.schema.json'), 'utf8'));

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
function validate(v, s, at, out) {
  const t = typeOf(v), want = s.type === undefined ? null : [].concat(s.type);
  if (want && !want.includes(t) && !(t === 'integer' && want.includes('number'))) { out.push(`${at}: ${t}, the format says ${want.join(' or ')}`); return; }
  if (s.enum && !s.enum.includes(v)) out.push(`${at}: ${JSON.stringify(v)} is not one of ${s.enum.map((e) => JSON.stringify(e)).join(', ')}`);
  if (s.pattern && t === 'string' && !new RegExp(s.pattern).test(v)) out.push(`${at}: ${JSON.stringify(v.slice(0, 60))} does not match ${s.pattern}`);
  if (t === 'array' && s.items) v.forEach((x, i) => validate(x, s.items, `${at}[${i}]`, out));
  if (t === 'object') {
    for (const k of s.required || []) if (!(k in v)) out.push(`${at}: no ${k}`);
    for (const [k, x] of Object.entries(v)) {
      if (s.properties && s.properties[k]) validate(x, s.properties[k], `${at}.${k}`, out);
      else if (s.additionalProperties === false) out.push(`${at}.${k}: a field the format does not have`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') validate(x, s.additionalProperties, `${at}.${k}`, out);
    }
  }
}
/* the rules beyond the schema */
function rules(S, file, out) {
  const dir = path.basename(path.dirname(file));
  /* a spec in its place (corpus/lean-intake/<id>/spec.json) is named as its folder; a spec checked elsewhere, before the lift, is not */
  if (path.basename(file) === 'spec.json' && S.id !== dir && S.id + '-claimbox' !== dir) out.push(`id ${S.id} is not its folder ${dir} (or the folder without -claimbox)`);
  const dup = (l) => l.filter((x, i) => l.indexOf(x) !== i);
  if (dup(S.mutants.map((m) => m.id)).length) out.push('planted statements share an id: ' + dup(S.mutants.map((m) => m.id)).join(', '));
  if (dup((S.claimReds || []).map((r) => r.id)).length) out.push('planted defects share an id');
  if (S.canonical.axioms && S.canonical.axioms.length && !S.canonical.selfContained) out.push('canonical.axioms needs canonical.selfContained');
  if (S.claim.module && (S.claim.url !== S.canonical.url || S.claim.commit !== S.canonical.commit)) out.push('claim.module needs the claimant\'s file in the canonical repository at the same commit');
  if (S.f2 && S.f2NotApplicable) out.push('both f2 and f2NotApplicable');
  if (S.f2 && !S.f2.decider && !(S.f2.reading && S.f2.table)) out.push('f2 needs a decider, or a reading and its table');
  if (S.format === 2) {
    for (const k of ['canonical', 'claim']) if (!/^[0-9a-f]{40}$/.test(S[k].commit)) out.push(`format 2: ${k}.commit is the full 40-character commit`);
    if (!S.f2 && !S.f2NotApplicable) out.push('format 2: a spec without f2 says why (f2NotApplicable)');
    if (!S.mutants.some((m) => m.kind === 'same')) out.push('format 2: no rewording planted (the controls need one accepted)');
    if (!S.mutants.some((m) => m.kind !== 'same')) out.push('format 2: no changed statement planted (the controls need one refused)');
    /* no path of a home directory anywhere in the spec: a public record would carry it */
    const walk = (v, at) => { if (typeof v === 'string') { if (/(^|[\s"'=:(])(\/Users\/|\/home\/|~\/)/.test(v)) out.push(`${at}: a home-directory path`); } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, at + '.' + k); };
    walk(S, '$');
  }
}
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(ROOT, 'corpus', 'lean-intake')).map((d) => path.join(ROOT, 'corpus', 'lean-intake', d, 'spec.json')).filter((f) => fs.existsSync(f)).sort();
let bad = 0, v2 = 0;
for (const f of files) {
  const S = JSON.parse(fs.readFileSync(f, 'utf8')), out = [];
  validate(S, SCHEMA, '$', out);
  if (!out.length) rules(S, f, out);
  if (S.format === 2) v2++;
  if (out.length) { bad++; console.error(`REFUSED ${path.relative(ROOT, f)}\n  ` + out.slice(0, 12).join('\n  ')); }
}
if (bad) { console.error(`check-intake-specs: ${bad} of ${files.length} specs do not hold the format`); process.exit(1); }
console.log(`check-intake-specs: OK — ${files.length} specs hold the written format (${v2} in format 2, ${files.length - v2} in the first)`);
