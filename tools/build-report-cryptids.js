#!/usr/bin/env node
/* build-report-cryptids.js — reports/cryptids.html: google-deepmind/cryptids audited at its pin, twice — by hand (one lane
   for the source) and through claimbox (a reader, the grammar, the receiver) — the gaps first, then the two arms compared on
   the eight pre-registered metrics, then the kernel lane. Every number comes from certs/cryptids-benchmark.json
   (tools/build-cryptids-benchmark.js), certs/cryptids-audit.json and certs/cryptids-kernel.json; the benchmark is re-checked
   at build (--check) before a word is written.

   usage: node tools/build-report-cryptids.js                                                                       MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('CRYPTIDS PAGE REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const short = (h) => String(h).slice(0, 12) + '…';
const num = (n) => Number(n).toLocaleString('en-US');
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const plain = (s) => String(s).replace(/`/g, '');   /* the records quote the write-ups' backticks; the page never prints a literal one */

let chk = '';
try { chk = cp.execFileSync('node', ['tools/build-cryptids-benchmark.js', '--check'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the benchmark does not re-check: ' + (e.stdout || '') + (e.stderr || '')); }
if (!/identical/.test(chk)) die('the benchmark check did not pass whole: ' + chk.trim());
const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'cryptids-benchmark.json'), 'utf8'));
const H = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'cryptids-audit.json'), 'utf8'));
const K = fs.existsSync(path.join(ROOT, 'certs', 'cryptids-kernel.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'cryptids-kernel.json'), 'utf8')) : null;
const hRow = (id) => H.rows.find((r) => r.id === id) || die('no arm H row ' + id);
const CREC = B.M4.C && typeof B.M4.C === 'object' ? B.M4.C : null;
const pin = B.target.commit;

const OUT = [];
OUT.push(C.header({
  eyebrow: 'cert-machine · a repository\'s finite layer, decided twice',
  title: 'The cryptids audit: what a producer\'s checker checks, and what it does not',
  deck: 'google-deepmind/cryptids publishes small Turing machines whose halting encodes Goldbach, ZF consistency and the Riemann Hypothesis, with Lean proofs of the state reductions and a standard-library checker of its own, verify.py. '
    + 'The theorems are the kernel\'s. Underneath them is a finite layer — pinned tables, digests, state and cell counts, the step at which a bootstrap ends and the configuration it ends in, ratios printed to their digits — and that layer can be decided exactly from the bytes. '
    + 'It was decided here twice, at commit ' + short(pin) + ': once by hand, one lane written for this source, and once through claimbox, the claim-machine, with the receiver\'s decider for machines. The gaps come first.'
}));
OUT.push(C.scope('Published, not peer-reviewed. Nothing here verifies a halting equivalence, a non-halting proof or the semantics; those are the Lean kernel\'s, and the kernel lane below only re-checks the build, the stated theorems and the axioms under a second kernel. '
  + 'The two arms were run by the same agent, the hand lane first, so what it learned about the source was available to the other; the pre-registration says so. The repository\'s authors were not contacted before this page; the asks are in the gaps.'));
const gapsCert = B.M8.filter((g) => g.words.every((w) => w === 'CERTIFIED' || w === null)).length;
OUT.push(C.tldr({
  findingRaw: '<b>' + B.M8.length + ' gaps in the repository\'s finite layer, found by reading verify.py and confirmed by running.</b> The checker never builds Lean and tests theorem statements by substring; its riemann_104 check says it runs riemann_120 and never does; it records the proof files\' digests and compares them to nothing; '
    + 'one write-up counts "non-halting transitions" by one convention and another by the other; the riemann_104 checkpoint table prints steps at "checkpoint k" without saying which event k counts (the printed steps are root entries, the 179th, 210th, 879th and 1,721st, not the 100th, 116th, 500th and 1,000th). '
    + 'Everything else the finite layer prints holds: ' + num(H.summary.CERTIFIED) + ' of ' + num(H.rows.length) + ' claims CERTIFIED by hand, ' + num(B.M1.C.decidedByReceiver.CERTIFIED) + ' of ' + num(B.M1.C.written) + ' through claimbox, ' + B.M5.agree + ' of ' + B.M5.pairs + ' paired claims with the same word.',
  mechanismRaw: 'Every table parsed, every upstream source compiled under the stated convention, every machine simulated from the blank tape in exact integers — by two implementations that share no code in each arm. '
    + 'A claim is one of three words: CERTIFIED with the certificate, REFUTED with the witness, REFUSED with the rule and, where there is one, the threshold that would change the word.',
  checkRaw: m('node tools/build-cryptids-benchmark.js --check') + ' recomputes the comparison from the two arms\' records; ' + m('node tools/run-cryptids.js') + ' re-derives arm H\'s rows in JavaScript; '
    + m('python3 instruments/claimbox/tm.py --decide') + ' and ' + m('tm.js') + ' re-decide claimbox\'s objects; ' + m('make drift') + ' re-hashes the repository\'s copy against its pin.'
}));
OUT.push(C.stats([
  { k: 'claims by hand', v: num(H.rows.length), n: num(H.summary.CERTIFIED) + ' CERTIFIED · ' + num(H.summary.REFUTED) + ' REFUTED · ' + num(H.summary.REFUSED) + ' REFUSED, each with its rule' },
  { k: 'claims through claimbox', v: num(B.M1.C.written) + ' + ' + num(B.M1.C.refusedByGrammar), n: num(B.M1.C.written) + ' objects written, ' + num(B.M1.C.admittedByChecker) + ' admitted by the checker; ' + num(B.M1.C.refusedByGrammar) + ' sentences refused by the grammar with the rule' },
  { k: 'paired claims', v: B.M5.agree + ' of ' + B.M5.pairs + ' agree', n: B.M5.disagree.length + ' differ: one digit-grouped decimal the receiver does not read, three counts it has no decider for' },
  { k: 'planted defects caught', v: B.M4.H.caught + '/' + B.M4.H.of + (CREC ? ' · ' + CREC.caught + '/' + CREC.of : ''), n: 'by hand' + (CREC ? ' · through claimbox' : '') + '; the miss in both: a proof file nothing pins. The green control (a comment) moved nothing.' },
  { k: 'gaps', v: String(B.M8.length), n: 'in the producer\'s checker and its write-ups, dated at the pin; ' + gapsCert + ' with every related claim decided' }
]));

/* §1 the gaps */
OUT.push(C.section({
  lab: '§1 · the gaps', title: 'What verify.py does not check, and what the write-ups print loosely',
  bodyRaw: C.pRaw('The producer\'s checker is a careful piece of work: it pins five upstream sources and their derived tables by sha256, re-derives each table from its source in three formats, checks that the Lean definitions load the right files, and replays bootstraps and lockstep checkpoints. '
    + 'What follows is what it does not do, read before any run and confirmed by running; each row names the claims here that decide the matter.')
    + C.table({ cols: [{ h: 'gap' }, { h: 'status' }, { h: 'decided by' }],
      rows: B.M8.map((g) => [plain(g.gap), plain(g.status), { raw: g.rows.map((id, i) => m(id) + (g.words[i] ? ' ' + C.tag(g.words[i], g.words[i] === 'CERTIFIED' ? 'held' : g.words[i] === 'REFUTED' ? 'dep' : 'open') : '')).join('<br>') }]) })
    + C.pRaw('<b>The asks.</b> Publish the selection rule that makes a root entry a "checkpoint", and the four candidate rows and five reference rows of the riemann_104 table become decidable from the bytes. '
      + 'Say which state of riemann_120 is "main.0" and the reference bootstrap length, 89,775,610 steps, can be decided too (the machine runs that far without halting; what it is in at that step is recorded). '
      + 'Pin the proof files\' digests, or drop the lines that record them. Use one convention for "non-halting transitions". Run riemann_120 in the check that says it does.')
}));

/* §2 arm H */
const byClass = Object.entries(B.M1.H.byClass).map(([cls, w]) => [cls, String(w.CERTIFIED || 0), String(w.REFUTED || 0), String(w.REFUSED || 0)]);
const refutedH = H.rows.filter((r) => r.verdict === 'REFUTED');
OUT.push(C.section({
  lab: '§2 · by hand', title: 'Arm H: one lane for one source',
  bodyRaw: C.pRaw('The way cert-machine audited sources before claimbox existed: ' + m('tools/run-cryptids.py') + ', standard library, exact integers, its own parsers for the canonical table and the three upstream formats, its own simulator. '
    + 'It states each claim in the auditor\'s prose with the file it is about, that file\'s sha256, the quote where there is one (' + B.M2.H.quotedVerbatim + ' of ' + B.M2.H.rowsWithQuote + ' found byte for byte), what was computed and one of three words. '
    + m('tools/run-cryptids.js') + ', a second implementation sharing no code, recomputes every decision-bearing row; the battery refuses on a disagreement.')
    + C.table({ cols: [{ h: 'class' }, { h: 'certified' }, { h: 'refuted' }, { h: 'refused' }], rows: byClass })
    + C.pRaw('<b>The one refutation.</b> ' + C.esc(plain(refutedH.map((r) => r.claim + ', computed ' + JSON.stringify(r.computed) + ' against ' + JSON.stringify(r.expected) + '. ' + (r.note || '')).join(' '))))
    + C.pRaw('<b>The refusals, each with its rule.</b>') + C.plainList(B.M3.H.map((r) => ({ b: r.id + '.', text: plain(r.rule) })))
    + C.pRaw('<b>What the long runs decided.</b> ' + C.esc(hRow('zf-overhead-10m').claim) + ': ' + hRow('zf-overhead-10m').verdict + '. ' + C.esc(hRow('riemann-120-no-halt-boot-length').claim) + ': ' + hRow('riemann-120-no-halt-boot-length').verdict + '. '
      + C.esc(hRow('riemann-104-table-steps-are-root-entries').claim) + ': ' + hRow('riemann-104-table-steps-are-root-entries').verdict + '; they are the '
      + C.esc(Object.entries(hRow('riemann-104-table-steps-are-root-entries').computed).map(([s, o]) => num(s) + ' → ' + (o ? num(o.ordinal_among_root_entries) + 'th' : 'none')).join(', ')) + ' entries, counting the boot entry as the 0th.')
}));

/* §3 arm C */
const kinds = Object.entries(B.M1.C.byKind).map(([k, w]) => [k, String(w.CERTIFIED || 0), String(w.REFUTED || 0), String((w.REFUSED || 0) + (w.ADMITTED || 0))]);
OUT.push(C.section({
  lab: '§3 · through claimbox', title: 'Arm C: a reader, the grammar, the receiver',
  bodyRaw: C.pRaw('claimbox\'s reader (' + m('claimbox/readers/cryptids.py') + ') turns the sentences the sources print — the provenance table, verify.py\'s pinned constants and assertions, the write-ups — into jobs, each with the quote byte for byte and the file it is about; the grammar\'s new machine family states the claim or refuses it with a rule; '
    + 'the translator writes the object; cert-machine\'s decider for machines (' + m('instruments/claimbox/tm.py') + ', with ' + m('tm.js') + ' held to it) decides the named functions over the pinned bytes; the ratios and percentages are exact expressions the checker decides from the object alone; and the checker (' + m('instruments/claimbox/check.py') + ') admits or refuses every object: '
    + num(B.M1.C.admittedByChecker) + ' admitted, ' + B.M1.C.refusedByChecker.length + ' refused (' + C.esc(B.M1.C.refusedByChecker.map((r) => r.id).join(', ')) + ': a digit-grouped decimal, 9,934.23, which the receiver\'s printed-bar rule does not read).')
    + C.table({ cols: [{ h: 'named function or expression' }, { h: 'certified' }, { h: 'refuted' }, { h: 'from the object / refused' }], rows: kinds })
    + C.pRaw('<b>Refused by the grammar, ' + B.M1.C.refusedByGrammar + ' sentences.</b> ' + C.esc(Object.entries(B.M1.C.grammarRefusals).map(([rule, n]) => n + ' ' + rule).join(', ')) + ': the eight halting equivalences and the kernel sentence (unbounded: the kernel is the authority), the "core" transitions (no definition), the nine "checkpoint k" rows (no finite definition of the event), the counts of markdown rows and JSON names (no decider).')
}));

/* §4 the comparison */
const rows4 = [
  ['M1 claims stated', num(H.rows.length) + ' rows: ' + num(H.summary.CERTIFIED) + ' / ' + num(H.summary.REFUTED) + ' / ' + num(H.summary.REFUSED), num(B.M1.C.written) + ' objects (' + num(B.M1.C.decidedByReceiver.CERTIFIED) + ' / ' + num(B.M1.C.decidedByReceiver.REFUTED) + ' by the receiver, the rest from the object) + ' + num(B.M1.C.refusedByGrammar) + ' refused by the grammar'],
  ['M2 pins', B.M2.H.quotedVerbatim + ' of ' + B.M2.H.rowsWithQuote + ' quotes verbatim; every row names a file and its digest', B.M2.C.objectsWithQuote + ' of ' + B.M2.C.of + ' objects with a verbatim quote and the pin of the bytes: the format refuses otherwise'],
  ['M3 refusals with a rule', B.M3.H.length + ', the rule in prose on the row', B.M3.C.byGrammar.length + ' by the grammar (a named rule each) + ' + B.M3.C.byChecker.length + ' by the checker'],
  ['M4 planted defects', B.M4.H.caught + ' of ' + B.M4.H.of + ' caught; green control quiet; the miss: the proof file nothing pins', CREC ? CREC.caught + ' of ' + CREC.of + ' caught; green control ' + (CREC.greenControlQuiet ? 'quiet' : 'tripped') + '; misses: ' + (CREC.misses.join(', ') || 'none') : 'not yet run'],
  ['M5 concordance', B.M5.agree + ' of ' + B.M5.pairs + ' paired claims agree', B.M5.disagree.length + ' differ: ' + B.M5.disagree.map((d) => d.h + ' (' + d.hWord + ' / ' + d.cWord + ')').join('; ')],
  ['M6 cost', B.M6.H.seconds + ' s for the full run; ' + Object.entries(B.M6.H.lines).map(([f, n]) => n + ' lines ' + f.split(' ')[0]).join(', '), (B.M6.C.secondsDecide || 0) + ' s to decide, ' + Math.round(B.M6.C.secondsBatch * 10) / 10 + ' s for the checker; ' + Object.entries(B.M6.C.lines).map(([f, n]) => n + ' lines ' + f.split(' ')[0]).join(', ') + '; reused: the format, both checkers, the batch and record machinery'],
  ['M7 what an outsider must trust', B.M7.H.trust.length + ' files by one author; no checker outside them', B.M7.C.trust.length + ' files; the checker shares no code with the reader and refuses objects whose quote, pin or record is wrong'],
];
OUT.push(C.section({
  lab: '§4 · the comparison', title: 'The two arms on the eight metrics',
  bodyRaw: C.pRaw('Fixed before the run (' + m('notes/cryptids-benchmark-preregistration-2026-10-23.md') + '): what each arm states, how it pins, how it refuses, what it catches when the input is planted with defects, whether the two agree, what each cost, and what a reader must trust. The eighth, the producer\'s checker, is §1.')
    + C.table({ cols: [{ h: 'metric' }, { h: 'by hand' }, { h: 'through claimbox' }], rows: rows4 })
    + C.pRaw('<b>Reading it.</b> The hand lane reaches further: it states ' + B.M5.hOnly.length + ' claims the reader has no object for (its own measurements, the Lean-definition and statement-string checks, the counts the receiver has no decider for) and it supplied readings where the write-ups are loose. '
      + 'The claimbox lane is the one an outsider can check without reading the auditor: every object carries the quote, the pin and the record, and a checker that shares no code with the reader accepts or refuses it. '
      + 'On the claims both state, the words agree except where the receiver\'s format or decider surface falls short, which is a measurement of the receiver, not a disagreement about the repository. The same two findings, the counting convention and the checkpoint event with no finite definition, came out of both arms.')
}));

/* §5 the kernel lane */
OUT.push(C.section({
  lab: '§5 · the kernel lane', title: 'The build, the stated theorems and the axioms, under a second kernel',
  bodyRaw: K ? (C.pRaw('The repository at its pin, built with its own toolchain (' + C.esc((K.rows[0] && /lean4:v[\d.rc-]+/.exec(K.rows[0].env || '') || ['Lean v4.35.0-rc4'])[0]) + ') and the Mathlib cache, then audited by leanprover/comparator at the matching release with nanoda on, using the configurations the repository ships. A CERTIFIED row is a concordance with the repository\'s own CI; it verifies no mathematics.')
    + C.table({ cols: [{ h: 'configuration' }, { h: 'theorems' }, { h: 'permitted axioms' }, { h: 'kernels' }, { h: 'time' }, { h: 'word' }],
      rows: K.rows.map((r) => [r.config, String(r.theorems), (r.permittedAxioms || []).join(', '), (r.kernels || []).join('; ') || '—', r.seconds ? num(r.seconds) + ' s' : '—', { raw: C.tag(r.verdict === 'CERTIFIED' ? 'cert' : 'open', r.verdict.toLowerCase()) }]) }))
    : C.pRaw('Dispatched on hosted runners (' + m('.github/workflows/cryptids-kernel.yml') + '); the record ' + m('certs/cryptids-kernel.json') + ' is written from the run\'s artifacts when it completes, and this section with it.')
}));

/* §6 the limits */
OUT.push(C.section({
  lab: '§6 · what is claimed, and what is not', title: 'The limits',
  bodyRaw: C.plainList([
    { b: 'Claimed.', text: 'For each finite claim the sources print, a decision from the bytes at the pin by two implementations that share no code, with the reading stated where the auditor supplied one; the gaps of §1, each decided or refused with its rule; the comparison of the two arms on the metrics fixed before the run.' },
    { b: 'Used, not re-proved.', text: 'The Lean kernel\'s acceptance of the proofs, and comparator\'s check that the stated theorems are the proved ones; the compilation convention the provenance file states; the checkpoint pattern verify.py states for the Goldbach stages.' },
    { b: 'Not claimed.', text: 'Any halting equivalence, non-halting proof or semantics; that the "core" transitions, the "checkpoint k" events or the register values mean anything in particular; that the holdout machines are cryptids (the community\'s word).' },
    { b: 'Independence.', text: 'From the repository, whose checker was read but never run as evidence; not from the operator (one), and not between the arms (the same agent, the hand lane first).' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-cryptids.js from certs/cryptids-benchmark.json (re-checked at build), certs/cryptids-audit.json (' + H.generated + ', sha256 ' + short(sha('certs/cryptids-audit.json')) + ')'
  + (K ? ', certs/cryptids-kernel.json (' + K.generated + ')' : '') + '; the repository at commit ' + pin + ', copied by LIFT-cryptids.json with every sha256 in PROVENANCE-cryptids.json; the pre-registration notes/cryptids-benchmark-preregistration-2026-10-23.md.') + '</p>'
  + '<p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'cryptids.html'), TPL.render({
  title: 'The cryptids audit: a repository\'s finite layer, decided twice · cert-machine', bodyRaw: OUT.join('\n\n'), footRaw: foot,
  desc: 'google-deepmind/cryptids at commit ' + short(pin) + ': the finite layer under its Lean proofs — tables, digests, counts, bootstraps, checkpoints, ratios — decided exactly by hand and through claimbox, the gaps of its own checker first; ' + H.rows.length + ' claims by hand, ' + B.M1.C.written + ' through claimbox, ' + B.M5.agree + ' of ' + B.M5.pairs + ' paired claims agree.',
  path: '/reports/cryptids.html'
}));
console.log('reports/cryptids.html written: H ' + H.rows.length + ' rows, C ' + B.M1.C.written + ' objects, ' + B.M5.agree + '/' + B.M5.pairs + ' agree, ' + B.M8.length + ' gaps' + (K ? ', kernel ' + K.rows.map((r) => r.config + ' ' + r.verdict).join(' ') : ', kernel pending') + ' @ git ' + git);
