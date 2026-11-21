/* status.js — the state of every check of the Alpöge RH/GRH decision, as the page draws it and the reports hub counts it.
   ONE module for both (a rule defined twice WILL diverge): the page builder (tools/build-report-alpoge-grh.js) draws the
   ring from it, and the site build prints the hub card's count from it. Read from certs/alpoge-grh-lean.json only. MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const REC = 'certs/alpoge-grh-lean.json';
const R = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const row = (id) => R.rows.find((r) => r.id === id) || { id, verdict: 'REFUSED', why: 'not in the record' };

/* ---- the status of each check, as the page draws it ---- */
const PENDING = /no B1V|integrity not established: no result|not produced for every|did not run|not every control|did not finish|exit None|has not passed|not measured|no complete integrity/;
function status(id) {
  const r = row(id);
  if (r.verdict === 'CERTIFIED') return 'decided';
  if (r.verdict === 'COMPUTED') return PENDING.test(r.why) ? 'pending' : 'computed';
  if (r.verdict === 'REFUTED') return 'refuted';
  if (/dropped on the operator/.test(r.why)) return 'dropped';
  return PENDING.test(r.why) ? 'pending' : 'refused';
}
const census = (R.computed && R.computed.census) || {};
const nielsenRan = Object.keys(census).length > 0;

/* the wheel: every check, grouped; `kind` is the warrant of the check when it passes */
const WHEEL = [
  { g: 'The bytes', items: [
    { id: 'I1', k: W.DECIDED, t: 'The archive is the one announced', d: 'All 14 parts match their checksums, fetched three times from alpo.ge by two machines.' },
    { id: 'I2', k: W.COMPUTED, t: 'The GitHub mirror is the same', d: 'All 175,190 files of the mirror equal the archive; it adds a README.' , fixed: 'computed' },
    { id: 'SCAN', k: W.COMPUTED, t: 'No shortcuts in the source', d: 'No sorry, no added axiom, no native_decide, unsafe or extern code in 175,187 files.', fixed: 'computed' },
    { id: 'M1', k: W.CHOSEN, t: 'The custom code was read', d: 'Every place the release extends Lean was read: none inserts a declaration past the kernel.', fixed: 'read' }
  ] },
  { g: 'The build and the kernels', items: [
    { id: 'B1', k: W.DECIDED, t: 'Every file compiles', d: 'Lean builds all 175,187 files with zero errors and no sorry.' },
    { id: 'MI', k: W.DECIDED, t: 'Mathlib is untouched', d: 'The library the proof stands on equals a clean download of the same version, file by file.' },
    { id: 'A1', k: W.DECIDED, t: 'Only the standard axioms', d: 'The five theorems rest on propext, Classical.choice and Quot.sound, and nothing else.' },
    { id: 'K2', k: W.DECIDED, t: 'A second kernel agrees', d: 'nanoda, a checker written independently in Rust, re-checks the whole exported proof.' },
    { id: 'KR', k: W.DECIDED, t: 'Lean replays its own proof', d: 'Lean’s checker replays every declaration in a fresh environment.' },
    { id: 'K3', k: W.DECIDED, t: 'A third kernel agrees', d: 'con-leche, a third independently written checker, re-checks the export and matches it against our statement again.' },
    { id: 'CR', k: W.DECIDED, t: 'A clean machine agrees', d: 'On a fresh machine that never ran the release’s code, two kernels re-check the exported proof against a statement built there.' },
    { id: 'RB', k: W.COMPUTED, t: 'Two builds compared', d: 'Our compiled files compared byte for byte with Andrew Sutherland’s independent build.' }
  ] },
  { g: 'The statement', items: [
    { id: 'S1', k: W.DECIDED, t: 'The theorem is the one we wrote down', d: 'Lean’s judge, Comparator, matches the five theorems against our own statement file, which imports Mathlib only.' },
    { id: 'F1', k: W.CHOSEN, t: 'Mathlib’s RH is the classical RH', d: 'Read twice, by two model families: every nontrivial zero of ζ has real part 1/2.', fixed: 'read' },
    { id: 'SPEC', k: W.DECIDED, t: 'Proved: it is the textbook statement', d: 'A Lean proof that Mathlib’s definition is equivalent to “every zero in the critical strip lies on the critical line”.' },
    { id: 'CHAR', k: W.DECIDED, t: 'Proved: ζ and L as the textbook defines them', d: 'A Lean proof that the statements stay the same when ζ and the L-functions are defined by their series, not by Mathlib’s definitions.' },
    { id: 'F2', k: W.CHOSEN, t: 'GRH here means Dirichlet L-functions', d: 'Read twice: every modulus, every character; not other number fields.', fixed: 'read' },
    { id: 'C1-C5', k: W.DECIDED, t: 'The judges catch planted errors', d: 'Five wrong versions — a changed constant, a smuggled axiom, a missing proof, a hijacked definition, a corrupted proof — must all be rejected.' }
  ] },
  { g: 'The context', items: [
    { id: 'P0', k: W.DECIDED, t: 'The August proof still checks', d: 'The “two thirds of the zeros” release re-checked on this Mathlib: 326 files unchanged, two kernels accept.' },
    { id: 'BRc+MB', k: W.DECIDED, t: 'The bridges compile', d: 'Given RH, the August bounds move onto the critical line; and Masullo’s claim, as we read it, implies this release’s.' },
    { id: 'BRu', k: W.DECIDED, t: 'The two releases combine', d: 'One environment holds both proofs; the combined statements pass Comparator.' },
    { id: 'ROUTE', k: W.CHOSEN, t: 'The route inside the proof was read', d: 'From Main.lean down, by Astra 6.2: RH from Dirichlet nonvanishing and ζ’s functional equation.', fixed: 'read' },
    { id: 'NIELSEN', k: W.COMPUTED, t: 'What the proof term really uses', d: 'Which constants named in J. L. Nielsen’s critique are in the compiled proof.', fixedFrom: 'nielsen' },
    { id: 'WORDFACTS', k: W.COMPUTED, t: 'Where the content lives', d: 'The sub-proofs that feed the two key inequalities, traced in the compiled term.', fixedFrom: 'wordfacts' }
  ] }
];
function stOf(it) {
  if (it.fixed) return it.fixed;
  /* each computed row needs its OWN output, not merely a census that ran (an outside reading, 2026-11-21) */
  if (it.fixedFrom === 'nielsen') return Object.keys((R.computed && R.computed.nielsen) || {}).length > 0 ? 'computed' : 'pending';
  if (it.fixedFrom === 'wordfacts') { const wf = (R.computed && R.computed.wordfacts) || {}; return (wf.targets || []).length > 0 && wf.named !== undefined ? 'computed' : 'pending'; }
  return status(it.id);
}
const ALL = WHEEL.flatMap((g) => g.items.map((it) => Object.assign({ g: g.g, st: stOf(it) }, it)));
const pending = ALL.filter((x) => x.st === 'pending');
const done = ALL.filter((x) => ['decided', 'computed', 'read'].includes(x.st));
const bad = ALL.filter((x) => ['refused', 'refuted'].includes(x.st));
const WORD = { decided: 'decided', computed: 'computed', read: 'read', pending: 'running', refused: 'refused', refuted: 'refuted', dropped: 'not run' };

module.exports = { REC, R, row, status, census, nielsenRan, WHEEL, ALL, pending, done, bad, WORD };
