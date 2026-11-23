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
/* the record says PENDING for a check whose step has not run yet (tools/check-alpoge-grh.py holds that one rule) */
function status(id) {
  const r = row(id);
  if (r.verdict === 'PENDING') return 'pending';
  if (r.verdict === 'CERTIFIED') return 'decided';
  if (r.verdict === 'COMPUTED') return 'computed';
  if (r.verdict === 'REFUTED') return 'refuted';
  if (/dropped on the operator/.test(r.why)) return 'dropped';
  return 'refused';
}
const census = (R.computed && R.computed.census) || {};
const nielsenRan = Object.keys(census).length > 0;

/* the wheel: every check, grouped; `kind` is the warrant of the check when it passes. Each `d` says what the check
   tests, or what the record found where the check is done; it never states a result the record does not hold (a check
   that is pending or refused carries its own reason, read from the record, wherever the page lists it). */
const WHEEL = [
  { g: 'The bytes', items: [
    { id: 'I1', k: W.DECIDED, t: 'The archive is the one announced', d: 'All 14 parts fetched for this check match the checksums pinned the day the release appeared; two later machines fetched them again, and they matched.' },
    { id: 'I2', k: W.COMPUTED, t: 'The GitHub mirror is the same', d: 'All 175,190 files of the archive are in the mirror, byte for byte; the mirror also holds README.md and .gitignore.' , fixed: 'computed' },
    { id: 'SCAN', k: W.COMPUTED, t: 'No shortcuts found in the source', d: 'A text scan of the 175,187 Lean files finds no sorry, axiom, native_decide, implemented_by, extern or unsafe.', fixed: 'computed' },
    { id: 'M1', k: W.CHOSEN, t: 'The custom code was read', d: 'Every run_cmd, elaborator and tactic macro the scan found was read, once: no declaration inserted outside the kernel’s check was found.', fixed: 'read' }
  ] },
  { g: 'The build and the kernels', items: [
    { id: 'B1', k: W.DECIDED, t: 'Every file compiles', d: 'Lean builds all 175,187 Lean source files with exit 0, and every source has its compiled file.' },
    { id: 'MI', k: W.DECIDED, t: 'Mathlib matches a clean download', d: 'The workspace’s compiled Mathlib files equal a clean cache download of the same version, byte for byte; two of Lake’s hash sidecar files write the same numbers with different leading zeros (amendment A14, written after that result).' },
    { id: 'A1', k: W.DECIDED, t: 'Only the standard axioms', d: 'The five theorems rest on propext, Classical.choice and Quot.sound, and nothing else.' },
    { id: 'K2', k: W.DECIDED, t: 'A second kernel agrees', d: 'nanoda, a checker written independently in Rust, checks the whole exported proof.' },
    { id: 'KR', k: W.DECIDED, t: 'Lean replays its own proof', d: 'Lean’s checker replays the compiled modules behind Main, starting from an empty environment.' },
    { id: 'K3', k: W.DECIDED, t: 'A third kernel agrees', d: 'con-leche, a third independently written checker, checks the exported proof and, separately, matches it against our challenge.' },
    { id: 'CR', k: W.DECIDED, t: 'A clean machine agrees', d: 'On a fresh machine that never ran the release’s code, whose only input from the build was the exported proof: nanoda checks the export, and con-leche matches the five theorems to the challenge compiled there.' },
    { id: 'RB', k: W.COMPUTED, t: 'Two builds compared', d: 'Our compiled files compared byte for byte with Andrew Sutherland’s independent build: a measurement, not a requirement.' }
  ] },
  { g: 'The statement', items: [
    { id: 'S1', k: W.DECIDED, t: 'The statements match our challenge', d: 'Comparator tests whether the five theorems state what our challenge states: Mathlib’s RH and the four statements as the release writes them, compiled from Mathlib alone.' },
    { id: 'F1', k: W.CHOSEN, t: 'Mathlib’s RH is the classical RH', d: 'Read twice, by two model families: every nontrivial zero of ζ has real part 1/2.', fixed: 'read' },
    { id: 'SPEC', k: W.DECIDED, t: 'Proved: RH in its textbook strip form', d: 'A Lean proof that Mathlib’s definition is equivalent to “every zero in the critical strip lies on the critical line”, over the same Mathlib ζ.' },
    { id: 'CHAR', k: W.DECIDED, t: 'Proved: ζ and L as the textbook defines them', d: 'A Lean proof that Mathlib’s RH and the release’s Dirichlet zero statement are each equivalent to their textbook forms, with ζ and L characterised by their series instead of Mathlib’s definitions.' },
    { id: 'F2', k: W.CHOSEN, t: 'GRH here means Dirichlet L-functions', d: 'Read twice: every modulus, every character; no general claim about other number fields.', fixed: 'read' },
    { id: 'C1-C5', k: W.DECIDED, t: 'The tools catch planted errors', d: 'Five planted changes — a changed constant, a smuggled axiom, a missing proof, a hijacked definition, the exported theorem re-typed as False — each to be rejected by the tool it targets.' }
  ] },
  { g: 'The context', items: [
    { id: 'P0', k: W.DECIDED, t: 'The August proof still checks', d: 'The August release (asymptotically, at least two thirds of the zeros simple and on the line) rebuilt on this Mathlib: 326 files unchanged, its own judge run accepted with two kernels.' },
    { id: 'BRc+MB', k: W.DECIDED, t: 'The conditional bridges compile', d: 'Assuming RH and the August bound, the August distinct-zero bound holds on the critical line; and our reading of Masullo’s description for ℚ implies the release’s primitive-character statement.' },
    { id: 'BRu', k: W.DECIDED, t: 'The two releases in one environment', d: 'Tests whether both proofs build in one Lean environment and Comparator accepts the combined statements.' },
    { id: 'ROUTE', k: W.CHOSEN, t: 'The route inside the proof was read', d: 'From Main.lean down, read once by Astra 6.2, five items spot-checked here: RH from Dirichlet nonvanishing and ζ’s functional equation.', fixed: 'read' },
    { id: 'NIELSEN', k: W.COMPUTED, t: 'What the proof term really uses', d: 'Which of the 21 names probed from J. L. Nielsen’s critique occur in the compiled proof, matched by the last part of the name.', fixedFrom: 'nielsen' },
    { id: 'WORDFACTS', k: W.COMPUTED, t: 'What feeds the two inequalities', d: 'The release-side dependencies of four selected declarations behind the divisor link’s two inequalities, traced in the compiled term.', fixedFrom: 'wordfacts' }
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
/* refused and refuted are told apart wherever a count is printed: a refuted check is a finding, a refused one is not */
const refused = ALL.filter((x) => x.st === 'refused');
const refuted = ALL.filter((x) => x.st === 'refuted');
/* "pending" says what the record knows: no exit yet. Whether a pending step is running or queued is read per check */
const WORD = { decided: 'decided', computed: 'computed', read: 'read', pending: 'pending', refused: 'refused', refuted: 'refuted', dropped: 'not run' };

module.exports = { REC, R, row, status, census, nielsenRan, WHEEL, ALL, pending, done, bad, refused, refuted, WORD };
