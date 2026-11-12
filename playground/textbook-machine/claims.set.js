/* claims.set.js — the claims of /instruments/textbook-machine/claims/: which objects, said how, changed how.
   playground/textbook-machine/ · cert-machine · 2026-11-12

   ONE LIST read by the page's builder (claims.build.js), its battery (claims.battery.js) and its Chrome gate
   (tools/check-textbook-claims.js). The objects are the first claim set of checker-web.build.js (the operator's four
   shapes); this file adds what a page needs and a checker does not: the claim as one sentence a non-specialist can
   read, and for each claim a few small CHANGES a visitor can make, each a declared edit of the object's text that
   must match exactly once. Every number in a sentence is read from the object or from its record, never typed.

   `expect` is the word the page's copy leads a visitor to: the builder refuses to build, and the battery fails, when
   Node's own check.js through claim-verdict.js gives another. It is never printed on the page: the tab decides.

   HELD (the licence finding of 2026-11-12): an object whose pinned third-party bytes carry no licence to be served
   again inside a script is kept here with its sentence and its changes, and is NOT in the bundle the page serves.
   To serve one, delete its line from HELD and run: node playground/textbook-machine/claims.build.js --write
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const V = require(path.join(ROOT, 'instruments', 'verdict.js'));
const die = (m) => { throw new Error('claims set: ' + m); };
const readJSON = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (x) => Number(x).toLocaleString('en-US');
const b = (s) => '<b>' + esc(s) + '</b>';

/* a printed decimal as the exact fraction the checker wants beside it: 0.25344 -> 25344/100000 */
function fraction(dec) {
  const m = /^(\d+)\.(\d+)$/.exec(dec);
  if (!m) die('not a printed decimal: ' + dec);
  return String(BigInt(m[1] + m[2])) + '/1' + '0'.repeat(m[2].length);
}
/* the bar a record row decided, as its claim prints it (the last decimal of the row's claim) */
function recordBar(o) {
  const row = readJSON(o.record.path).rows.find((r) => r.id === o.record.row);
  const m = row && /(\d+\.\d+)\s*$/.exec(String(row.claim));
  if (!m) die('the record row ' + o.record.row + ' prints no bar');
  return m[1];
}
const barEdit = (p, printed, c) => [['"printed": "' + p.printed + '"', '"printed": "' + printed + '"'], ['"c": "' + p.c + '"', '"c": "' + c + '"']];

const SHAPES = [
  { id: 'number facts', title: 'Number facts',
    say: 'A claim that a quantity is exactly some number. The checker computes the quantity from the file the claim cites, in whole numbers with no rounding, and compares.' },
  { id: 'interval bounds', title: 'Interval bounds',
    say: 'A claim that a constant sits below a bar. Nobody knows the constant exactly, so a computation traps the bound between two exact endpoints, and the whole interval has to clear the bar.' },
  { id: 'finite counterexamples', title: 'Finite counterexamples',
    say: 'A claim about every item in a finite list. One item that breaks it refutes it, and the checker names the item.' },
  { id: 'register replays', title: 'Register replays',
    say: 'A claim I decided before and keep in a public record. Your tab decides it again, and the claim, the record and the new answer all have to agree.' }
];

const HELD = {
  'instruments/claimbox/claims/optq-82-epi.json': 'needs corpus/optconst-queue/c82-2026-10-19/epi/construction.json: BakeLab/Epi-results carries no licence file (that folder\'s PINS.json says so: kept for verification only)',
  'instruments/claimbox/v4/v4-ea-542-circle-packing.json': 'needs corpus/einstein-arena/best-14.json and problems.json: EinsteinArena\'s API output, no licence stated (corpus/sources/easota-platform/einstein-arena-platform-pin.txt says so: held for verification only)'
};

const CLAIMS = [
  { path: 'instruments/claimbox/v4/v4-int64-sum-integers.json', shape: 'number facts',
    who: 'A two-number test file, written to try the checker on a sum too large for ordinary arithmetic.',
    variants: (o) => {
      const p = o.predicate[0], n = p.printed, less = String(BigInt(n) - 1n);
      return [
        { label: 'as printed', say: 'The two whole numbers in the file add up to ' + b('exactly ' + n) + '.', edits: [], expect: V.CERTIFIED },
        { label: 'say less than', say: 'The two whole numbers in the file add up to ' + b('less than ' + n) + '.', edits: [['"rel": "' + p.rel + '"', '"rel": "lt"']], expect: V.REFUTED },
        { label: 'state one less', say: 'The two whole numbers in the file add up to ' + b('exactly ' + less) + '.', edits: barEdit(p, less, less), expect: V.REFUSED }
      ];
    } },
  { path: 'playground/textbook-machine/mutants/tm-mutant-json-number.json', shape: 'number facts',
    who: 'The same claim, damaged on purpose in one place.',
    variants: (o) => {
      const n = o.predicate[0].printed;
      return [
        { label: 'as written', say: 'The same sum, with ' + n + ' ' + b('written bare, without quotes') + '.', edits: [], expect: V.REFUSED },
        { label: 'put the quotes back', say: 'The same sum, with ' + n + ' ' + b('written in quotes, as text') + '.', edits: [['"c": ' + n, '"c": "' + n + '"']], expect: V.CERTIFIED }
      ];
    } },
  { path: 'instruments/claimbox/claims/optq-82-epi.json', shape: 'interval bounds',
    who: 'Printed by the public registry of optimization constants, from a construction by Épi.',
    variants: (o) => {
      const p = o.predicate[0], cut = p.printed.slice(0, -2);
      return [
        { label: 'as printed', say: 'A constant from number theory, C<sub>82</sub>, is ' + b('at most ' + p.printed) + '.', edits: [], expect: V.CERTIFIED },
        { label: 'two digits fewer', say: 'A constant from number theory, C<sub>82</sub>, is ' + b('at most ' + cut) + '.', edits: barEdit(p, cut, fraction(cut)), expect: V.REFUSED }
      ];
    } },
  { path: 'instruments/claimbox/claims/optq-82-pinho.json', shape: 'interval bounds',
    who: 'Printed by the public registry of optimization constants, from a certificate by R. Pinho.',
    variants: (o) => {
      const p = o.predicate[0], cut = p.printed.slice(0, -2);
      return [
        { label: 'as printed', say: 'A constant from number theory, C<sub>82</sub>, is ' + b('below ' + p.printed) + '.', edits: [], expect: V.CERTIFIED },
        { label: 'two digits fewer', say: 'A constant from number theory, C<sub>82</sub>, is ' + b('below ' + cut) + '.', edits: barEdit(p, cut, fraction(cut)), expect: V.REFUSED },
        { label: 'say above', say: 'A constant from number theory, C<sub>82</sub>, is ' + b('above ' + p.printed) + '.', edits: [['"rel": "' + p.rel + '"', '"rel": "gt"']], expect: V.REFUSED }
      ];
    } },
  { path: 'instruments/claimbox/v4/v4-ea-542-circle-packing.json', shape: 'finite counterexamples',
    who: 'A packing of circles published on EinsteinArena, with the score the platform gave it.',
    variants: (o) => {
      const n = o.domain.count, more = String(BigInt(n) + 1n), score = o.predicate[0].printed;
      const tail = ' circles all lie inside the unit square, no two overlap, and their radii add up to ' + esc(score) + '.';
      return [
        { label: 'as printed', say: 'The ' + b(n) + tail, edits: [], expect: V.REFUTED },
        { label: 'say one more circle', say: 'The ' + b(more) + tail, edits: [['"count": ' + n, '"count": ' + more]], expect: V.REFUSED }
      ];
    } },
  { path: 'instruments/claimbox/claims/optq-1d-cert2026.json', shape: 'register replays',
    who: 'Printed by the public registry of optimization constants, from a step function with ' + '{count}' + ' steps.',
    variants: (o) => {
      const p = o.predicate[0], r = o.repair;
      return [
        { label: 'as printed', say: 'A constant called C<sub>1d</sub> is ' + b('at most ' + p.printed) + '.', edits: [], expect: V.REFUTED },
        { label: 'state the repaired bound', say: 'A constant called C<sub>1d</sub> is ' + b('at most ' + r.printed) + '.', edits: barEdit(p, r.printed, r.c), expect: V.REFUSED }
      ];
    } },
  { path: 'instruments/claimbox/claims/optq-1c-rozetyp-k3072.json', shape: 'register replays',
    who: 'Printed in the claimant’s own README, from a certificate of ' + '{count}' + ' whole numbers.',
    variants: (o) => {
      const p = o.predicate[0], rb = recordBar(o);
      return [
        { label: 'as printed', say: 'A constant called C<sub>1c</sub> is ' + b('at least ' + p.printed) + '.', edits: [], expect: V.REFUSED },
        { label: 'state ' + rb, say: 'A constant called C<sub>1c</sub> is ' + b('at least ' + rb) + '.', edits: barEdit(p, rb, fraction(rb)), expect: V.CERTIFIED }
      ];
    } }
];

/* an object's text with one change applied; every edit must match exactly once */
function applyEdits(text, edits, what) {
  let t = text;
  for (const [find, put] of edits) {
    if (t.split(find).length !== 2) die((what || 'a change') + ' edits ' + JSON.stringify(find) + ', which the object holds ' + (t.split(find).length - 1) + ' times, not once');
    t = t.split(find).join(put);
  }
  return t;
}

/* every claim, resolved against its object on disk: { id, path, file, shape, held, who, text, variants: [{ label, say, edits, expect }] } */
function resolve() {
  return CLAIMS.map((c) => {
    const text = fs.readFileSync(path.join(ROOT, c.path), 'utf8');
    const o = JSON.parse(text);
    const variants = c.variants(o);
    if (!variants.length || variants[0].edits.length) die(c.path + ': the first variant is the object as it stands');
    for (const v of variants) { applyEdits(text, v.edits, c.path + ' "' + v.label + '"'); if (!V.isVerdict(v.expect)) die(c.path + ': expect is one of the three words'); }
    if (!SHAPES.some((s) => s.id === c.shape)) die(c.path + ': no shape ' + c.shape);
    return { id: o.id, path: c.path, file: path.basename(c.path), shape: c.shape, held: c.path in HELD ? HELD[c.path] : null,
      who: c.who.replace('{count}', fmt(o.domain.count)), text, variants };
  });
}
const served = () => resolve().filter((c) => c.held === null);

module.exports = { SHAPES, HELD, CLAIMS, resolve, served, applyEdits, esc, ROOT };
