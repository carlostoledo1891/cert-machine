#!/usr/bin/env node
/* check-marks.js — every printed number that names its record is re-read from it.
   tools/ · cert-machine · 2026-10-29 (D10 of the roundtable's rulings)

   THE RULE. A mark that carries data-rec="<file>#<pointer>" (playground/warrant.js W.val and W.attrs) is a projection
   of one record cell. This gate walks the built site, follows every address back into the record (design/record.js:
   the same resolver and the same printer the builder used), prints the datum again by the mark's own data-fmt and
   standing, and refuses a page whose text differs, whose pointer no longer resolves, or whose decided value was cut
   to nearest where an end was needed. A mark with no address is not checked here: tools/check-grammar.js counts
   those (`unpointed`) and the count may only shrink.

   WHY A GATE AND NOT A BUILDER CHECK. Each builder already guards its own numbers by hand, which is how a careful
   author broke every rule once (design/WARRANT.md). This gate reads the PAGE, not the builder, so a sentence a
   builder forgot to guard is still held to its record — and a reader can follow the same address.

     node tools/check-marks.js            gate; non-zero on any mark that does not re-read
     node tools/check-marks.js --report   every pointed mark, by page
   Red controls: three planted marks (a dangling pointer, an inward-rounded upper end, a wrong digit) run against the
   same check with an in-memory record; each must be refused, or the run fails.                                 MIT */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const R = require(path.join(ROOT, 'design', 'record.js'));
const { skipDir } = require(path.join(ROOT, 'design', 'zones.js'));

const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!skipDir(SITE, p)) walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/* one element: its attributes and, for a value span, its text. Returns null when sound, else the reason. */
function checkMark({ rec, fmt, w, text }, reader) {
  const m = /^([^#]+)#(.+)$/.exec(rec || '');
  if (!m) return 'data-rec is not <file>#<pointer>: ' + rec;
  let datum;
  try { datum = reader(m[1], m[2]); } catch (e) { return e.message; }
  if (fmt === undefined) return null;                       /* a stroke: the pointer resolving is the check */
  let want;
  try { want = R.print(datum, fmt, w); } catch (e) { return e.message; }
  const got = unesc(text).replace(/\s+/g, ' ').trim();
  if (got !== want) return 'prints ' + JSON.stringify(got) + ', the record prints ' + JSON.stringify(want) + ' (' + fmt + ')';
  return null;
}

/* every pointed mark in a page's HTML */
function marksIn(html) {
  const out = [];
  const re = /<(span|line|path|polyline|polygon|rect|circle|ellipse)\b([^>]*\bdata-rec="[^"]*"[^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[2], at = (k) => { const a = new RegExp('\\b' + k + '="([^"]*)"').exec(attrs); return a ? unesc(a[1]) : undefined; };
    const item = { tag: m[1], rec: at('data-rec'), fmt: at('data-fmt'), w: at('data-w'), text: undefined, pos: m.index };
    if (m[1] === 'span') {
      const close = html.indexOf('</span>', re.lastIndex);
      item.text = html.slice(re.lastIndex, close).replace(/<[^>]+>/g, '');
    }
    out.push(item);
  }
  return out;
}

function main() {
  const report = process.argv.includes('--report');
  const reader = (file, ptr) => {
    if (!/^(certs|corpus)\//.test(file)) throw new Error('record: a pointer names a file outside certs/ or corpus/: ' + file);
    return R.read(file, ptr);
  };
  let pages = 0, marks = 0, bad = 0;
  for (const file of walk(SITE)) {
    const rel = path.relative(SITE, file);
    const items = marksIn(fs.readFileSync(file, 'utf8'));
    if (!items.length) continue;
    pages++;
    for (const it of items) {
      marks++;
      const why = checkMark(it, reader);
      if (why) { bad++; console.log('  FAIL  ' + rel + ': ' + it.rec + ' — ' + why); }
      else if (report) console.log('  ok    ' + rel + ': ' + it.rec + (it.fmt ? ' (' + it.fmt + ') ' + JSON.stringify(unesc(it.text).trim()) : ' (a stroke)'));
    }
  }
  /* the red controls: an in-memory record, three planted marks, each must be refused */
  const REC = { rows: [{ id: 'a', n: 22560, hi: '1.5027434867', ms: 61 }] };
  const fake = (file, ptr) => { if (file !== 'certs/planted.json') throw new Error('record: no file ' + file); return R.resolve(REC, ptr); };
  const reds = [
    ['a dangling pointer', { rec: 'certs/planted.json#/rows[id=b]/n', fmt: 'int', w: 'decided', text: '22,560' }],
    ['an upper end rounded inward', { rec: 'certs/planted.json#/rows[id=a]/hi', fmt: 'hi:6', w: 'decided', text: '1.502743' }],
    ['a wrong digit', { rec: 'certs/planted.json#/rows[id=a]/n', fmt: 'int', w: 'decided', text: '22,650' }],
    ['a decided value cut to nearest', { rec: 'certs/planted.json#/rows[id=a]/hi', fmt: 'fixed:4', w: 'decided', text: '1.5027' }],
  ];
  const sound = checkMark({ rec: 'certs/planted.json#/rows[id=a]/n', fmt: 'int', w: 'decided', text: '22,560' }, fake) === null
    && checkMark({ rec: 'certs/planted.json#/rows[id=a]/hi', fmt: 'hi:6', w: 'decided', text: '1.502744' }, fake) === null
    && checkMark({ rec: 'certs/planted.json#/rows[id=a]/ms', fmt: 'int', w: 'computed', text: '61' }, fake) === null;
  let fired = 0;
  for (const [what, it] of reds) {
    const why = checkMark(it, fake);
    if (why) { fired++; console.log('       RED ok    ' + what + ' is refused (' + why.slice(0, 70) + ')'); }
    else console.log('       RED FAIL  ' + what + ' was accepted');
  }
  if (!sound) console.log('  FAIL  a sound planted mark was refused');
  const ok = bad === 0 && fired === reds.length && sound;
  console.log((ok ? 'check-marks: PASS' : 'check-marks: FAIL') + ' — ' + marks + ' pointed mark(s) on ' + pages + ' page(s), ' + bad + ' refused · ' + fired + '/' + reds.length + ' red controls fired');
  return ok ? 0 : 1;
}

if (require.main === module) process.exit(main());
module.exports = { checkMark, marksIn };
