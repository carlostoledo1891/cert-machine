#!/usr/bin/env node
/* confirm-survivors.js — take the audit's survivors and check them against the
   FULL OEIS entry, not just the name.

   The screen can only read the name from the bulk file. OEIS states closed forms
   in FORMULA and COMMENT fields, so a survivor whose name is silent may still
   have a form on record. This fetches each survivor's entry — a few dozen
   requests, one at a time, declared UA — and reports which have NO closed form
   stated anywhere. That is the real shortlist. */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const UA = 'cert-machine/0.1 (validated-numerics research; contact carlos@carlostoledo.co)';
const F = require(path.join(ROOT, 'families/oeis-closedform.js'));

const hits = [];
for (let i = 0; ; i++) { const e = F.enumerate(i); if (!e) break; if (!F.interesting(e)) continue;
  const c = F.certify(e); if (c.verdict === 'HIT') hits.push(c.extra); }
console.log('survivors to confirm: ' + hits.length);

const out = [];
for (const h of hits) {
  const r = cp.spawnSync('curl', ['-sS', '-A', UA, '--max-time', '25',
    'https://oeis.org/search?q=id:' + h.id + '&fmt=json'], { maxBuffer: 8e6 });
  let j = null; try { j = JSON.parse(r.stdout.toString()); } catch (e) {}
  const rec = Array.isArray(j) ? j[0] : (j && j.results && j.results[0]);
  cp.spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},1100)']);
  if (!rec) { out.push({ ...h, fetch: 'FAILED' }); continue; }
  const formula = (rec.formula || []).join(' | ');
  const comment = (rec.comment || []).join(' | ');
  const offset = Number(String(rec.offset || '0').split(',')[0]) || 0;
  /* does the entry state a closed form anywhere? */
  const statesForm = /=/.test(formula) || /sqrt|Pi|log|exp|\^|zeta|Gamma/i.test(formula + ' ' + comment);
  out.push({ id: h.id, name: h.name, offset, survivors: h.survivors.map(s => s.label),
    hasFormulaField: (rec.formula || []).length > 0, statesForm,
    formula: formula.slice(0, 160) });
  process.stdout.write('\r  ' + out.length + '/' + hits.length);
}
console.log('');
fs.writeFileSync(path.join(ROOT, 'corpus/survivors-confirmed.json'), JSON.stringify(out, null, 1) + '\n');

const silent = out.filter(o => o.fetch !== 'FAILED' && !o.statesForm);
console.log('');
console.log('=== entries with NO closed form stated anywhere in the OEIS record ===');
if (!silent.length) console.log('  none — every survivor already has its form on record at OEIS');
for (const s of silent) console.log('  ' + s.id + '  ' + s.name.replace(/^Decimal expansion of\s*/i,'').slice(0,60) + '  -> ' + s.survivors.slice(0,2).join(', '));
console.log('');
console.log('  ' + (out.length - silent.length) + ' of ' + out.length + ' survivors already state a form at OEIS — the screen reads only the NAME and could not see it.');
