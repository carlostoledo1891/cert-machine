#!/usr/bin/env node
/* build-cryptids-benchmark.js — the comparison of the two arms of the cryptids audit, written from their records
   (notes/cryptids-benchmark-preregistration-2026-10-23.md, metrics M1–M8). It reads:
     certs/cryptids-audit.json                        arm H: the lane's rows
     certs/cryptids-recall-h.json                     arm H: the twelve plants
     corpus/claimbox-cryptids/cryptids-run.json       arm C: what the reader wrote, what the grammar refused, what the checker said
     corpus/claimbox-cryptids/objects/*.json          arm C: the objects (quotes, pins, predicates)
     certs/claimbox-cryptids-decisions.json           arm C: the receiver's words (tm.py); -js.json its second implementation
     corpus/claimbox-cryptids/cryptids-recall.json    arm C: the twelve plants (lifted from claimbox)
     certs/cryptids-kernel.json                       the kernel lane, when it has run
   and writes certs/cryptids-benchmark.json. Every number the report and the paper print comes from that file.
     node tools/build-cryptids-benchmark.js            write it
     node tools/build-cryptids-benchmark.js --check    recompute and refuse unless identical (the battery)         MIT */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const die = (m) => { console.error('cryptids benchmark REFUSED: ' + m); process.exit(1); };
const need = (c, m) => { if (!c) die(m); };
const CHECK = process.argv.includes('--check');

const H = J('certs/cryptids-audit.json');
const HR = J('certs/cryptids-recall-h.json');
const CRUN = J('corpus/claimbox-cryptids/cryptids-run.json');
const CDEC = J('certs/claimbox-cryptids-decisions.json');
const CDECJS = exists('certs/claimbox-cryptids-decisions-js.json') ? J('certs/claimbox-cryptids-decisions-js.json') : null;
const CREC = exists('corpus/claimbox-cryptids/cryptids-recall.json') ? J('corpus/claimbox-cryptids/cryptids-recall.json') : null;
const KER = exists('certs/cryptids-kernel.json') ? J('certs/cryptids-kernel.json') : null;
const objDir = path.join(ROOT, 'corpus', 'claimbox-cryptids', 'objects');
const COBJ = fs.readdirSync(objDir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(objDir, f), 'utf8')));
need(H.rows.length >= 20, 'arm H states fewer than 20 claims: the kill switch');
need(CRUN.written >= 20, 'arm C states fewer than 20 claims: the kill switch');

/* ---- M1: claims stated, by class and word ---- */
const count = (arr, key) => { const o = {}; for (const x of arr) { const k = key(x); o[k] = (o[k] || 0) + 1; } return o; };
const hByClass = {}; for (const r of H.rows) { hByClass[r.class] = hByClass[r.class] || {}; hByClass[r.class][r.verdict] = (hByClass[r.class][r.verdict] || 0) + 1; }
const decBy = new Map(CDEC.rows.map((r) => [r.id, r]));
const cWord = (o) => { const d = decBy.get(o.id); if (d) return d.verdict; const row = CRUN.rows.find((r) => r.id === o.id); const w = row && row.certMachine ? row.certMachine.split('  ')[0] : null; if (w === 'REFUSED') return 'REFUSED'; const m = row && row.certMachine && /\b(CERTIFIED|REFUTED)\b/.exec(row.certMachine); return m ? m[1] : 'ADMITTED'; };
const kindOf = (o) => { const g = o.predicate[0].g; if (g && typeof g === 'object' && g.named) return g.named.replace(/\(.*$/, '').replace(/ .*$/, ''); return o.predicate[0].rel === 'in' ? 'arithmetic' : 'other'; };
const cByKind = {}; for (const o of COBJ) { const k = kindOf(o), w = cWord(o); cByKind[k] = cByKind[k] || {}; cByKind[k][w] = (cByKind[k][w] || 0) + 1; }
const cRefusals = count(CRUN.rows.filter((r) => r.refused), (r) => r.refused.split(':')[0]);
const cCheckerRefused = CRUN.rows.filter((r) => r.certMachine && r.certMachine.startsWith('REFUSED')).map((r) => ({ id: r.id, line: r.certMachine.slice(0, 160) }));

/* ---- M2: pins ---- */
const hQuoted = H.rows.filter((r) => r.source && r.source.quote !== undefined);
const hQuotedTrue = hQuoted.filter((r) => r.source.quoted).length;
const hPinned = H.rows.filter((r) => r.source && r.source.sha256).length;
const cQuoted = COBJ.filter((o) => o.source && o.source.quote).length;
const cPinned = COBJ.filter((o) => o.domain && o.domain.pin && o.domain.pin.sha256 && o.source && o.source.sha256).length;

/* ---- M3: refusals with a rule ---- */
const hRefused = H.rows.filter((r) => r.verdict === 'REFUSED').map((r) => ({ id: r.id, rule: r.note || '' }));

/* ---- M5: concordance over the claims both arms decide ---- */
const ALIAS = {   /* arm H id → arm C id(s): the same claim, named differently */
  'cells-zf': ['cells-zf-393', 'cells-zf-380'], 'goldbach-boot-steps': ['goldbach-boot-ref', 'goldbach-boot-cand'],
  'goldbach-steps-through-40': ['goldbach-through-40-ref', 'goldbach-through-40-cand'], 'zf-no-halt-250k': ['no-halt-250k-zf_393', 'no-halt-250k-zf_380'],
  'riemann-104-no-halt-250k': ['no-halt-250k-riemann_104'], 'riemann-95-no-halt-250k': ['no-halt-250k-riemann_95'], 'no-halt-250k-goldbach_21': ['no-halt-250k-goldbach_21'],
  'core-transitions-goldbach': ['core-transitions-goldbach'], 'riemann-104-checkpoint-k': ['riemann-104-checkpoint-100', 'riemann-104-checkpoint-116', 'riemann-104-checkpoint-500', 'riemann-104-checkpoint-1000'],
  'riemann-120-checkpoint-table': ['riemann-120-checkpoint-0', 'riemann-120-checkpoint-100', 'riemann-120-checkpoint-116', 'riemann-120-checkpoint-500', 'riemann-120-checkpoint-1000'],
  'cells-riemann': ['cells-riemann-120', 'cells-riemann-104'], 'cells-riemann-95': ['cells-riemann-95', 'halting-riemann-95'],
  'pct-riemann_104': ['pct-riemann-104'], 'pct-riemann_104-tr': ['pct-riemann-104-tr'], 'pct-zf_380': ['pct-zf-380'],
  'cand-states-goldbach_21': ['cand-states-goldbach_21', 'verifypy-cand-states-goldbach_21'], 'cand-states-zf_380': ['verifypy-cand-states-zf_380'], 'cand-states-riemann_104': ['verifypy-cand-states-riemann_104'], 'cand-states-riemann_95': ['cand-states-riemann_95', 'verifypy-cand-states-riemann_95'],
  'kernel-equivalences': ['theorem-goldbach_21', 'theorem-zf_380', 'theorem-zf_393', 'theorem-zf_432', 'theorem-riemann_95', 'theorem-riemann_104', 'theorem-riemann_120', 'theorem-riemann_744'],
};
const cWordById = new Map();
for (const o of COBJ) cWordById.set(o.id, cWord(o));
for (const r of CRUN.rows) if (r.refused) cWordById.set(r.id, 'REFUSED');
const pairs = [];
for (const r of H.rows) {
  const targets = ALIAS[r.id] || (cWordById.has(r.id) ? [r.id] : []);
  for (const t of targets) if (cWordById.has(t)) pairs.push({ h: r.id, c: t, hWord: r.verdict, cWord: cWordById.get(t) });
}
const agree = pairs.filter((p) => p.hWord === p.cWord);
const disagree = pairs.filter((p) => p.hWord !== p.cWord);
const hOnly = H.rows.filter((r) => !(ALIAS[r.id] || cWordById.has(r.id))).map((r) => ({ id: r.id, word: r.verdict, class: r.class }));
const cOnly = [...cWordById.keys()].filter((id) => !pairs.some((p) => p.c === id)).map((id) => ({ id, word: cWordById.get(id) }));

/* ---- M6: cost ---- */
const lines = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').length;
const cost = {
  H: { seconds: H.seconds, lines: { 'tools/run-cryptids.py': lines('tools/run-cryptids.py'), 'tools/run-cryptids.js (second implementation)': lines('tools/run-cryptids.js'), 'tools/run-cryptids-recall.py': lines('tools/run-cryptids-recall.py') }, reused: 'nothing: one lane for one source' },
  C: { secondsDecide: CDEC.seconds, secondsBatch: CRUN.rows.reduce((s, r) => s + (r.certMachineSeconds || 0), 0),
       lines: { 'instruments/claimbox/tm.py (the receiver\'s decider, reused by every machine claim)': lines('instruments/claimbox/tm.py'), 'instruments/claimbox/tm.js (second implementation)': lines('instruments/claimbox/tm.js') },
       claimboxLines: 'the reader (claimbox/readers/cryptids.py), the machine family in grammar.py and translate.py: counted in claimbox\'s record', reused: 'the object format, check.py and check.js (shared with every object the receiver has ever admitted), the batch and record machinery, the lift' },
};

/* ---- M8: the producer's checker ---- */
const hRow = (id) => H.rows.find((r) => r.id === id);
const gaps = [
  { gap: 'verify.py never builds Lean and checks theorem statements by substring', status: 'confirmed by reading; the kernel lane decides the build and the axioms (certs/cryptids-kernel.json)', rows: ['challenge-states-all', 'challenge-states-constructive'] },
  { gap: 'the riemann_104 check never runs riemann_120 although its docstring says it does', status: 'confirmed by reading; the stage run here: riemann_120 does not halt within its printed 89,775,610-step bootstrap, and the write-up\'s reference column is REFUSED because the root event is not stated in finite terms', rows: ['riemann-120-no-halt-boot-length', 'riemann-120-checkpoint-table'] },
  { gap: 'the proof files\' sha256s are recorded and compared to nothing', status: 'confirmed: no pin exists; the recall plant in a proof file flips no word in either arm', rows: ['verifypy-proof-hashes'] },
  { gap: 'the Goldbach message says 92 cells checked where the code checks 42', status: 'confirmed by reading verify.py (verify_goldbach_proof_tables: the message counts candidate and edited cells, the loop runs over the 42 candidate cells); both arms check the 42 under the write-up\'s map', rows: ['goldbach-embed'] },
  { gap: 'two ZF boot checkpoints (39,753 / state 64 and 39,773 / state 99) are used without explanation', status: 'measured: both hold; step 39,773 is not an entry into state 64, so the two are different events twenty steps apart', rows: ['zf-393-39773-state-99', 'zf-39773-is-not-state-64'] },
  { gap: 'the simulations stop at 250,000 steps', status: 'confirmed; the ten-million-step correspondence and the 89,775,610-step run were done here', rows: ['zf-overhead-10m', 'riemann-120-no-halt-boot-length'] },
  { gap: 'the ZF write-up\'s "785 → 759 non-halting transitions" and the riemann_104 write-up\'s "238 → 207" count by two conventions', status: 'found by both arms: the ZF numbers are the non-halting cells plus one (the explicit halt line is counted), the Riemann numbers are the non-halting cells', rows: ['cells-zf'] },
  { gap: 'the riemann_104 checkpoint table\'s "checkpoint k" is not defined in finite terms', status: 'found by both arms: the printed candidate steps are root entries (the 179th, 210th, 879th, 1,721st), not the 100th, 116th, 500th, 1,000th; REFUSED with the threshold: publish the selection rule', rows: ['riemann-104-table-steps-are-root-entries', 'riemann-104-checkpoint-k'] },
].map((g) => Object.assign(g, { words: g.rows.map((id) => { const r = hRow(id); return r ? r.verdict : null; }) }));

const OUT = {
  what: 'The cryptids audit run twice: arm H by hand (one lane for the source) and arm C through claimbox (a reader, the grammar, cert-machine\'s receiver), compared on the eight pre-registered metrics. Written from the two arms\' records by tools/build-cryptids-benchmark.js; --check refuses when it would differ.',
  preregistration: 'notes/cryptids-benchmark-preregistration-2026-10-23.md',
  target: H.source,
  order: 'arm H first, then arm C, by the same agent; what arm H learned about the source was available to arm C (stated in the pre-registration)',
  M1: { H: { rows: H.rows.length, words: H.summary, byClass: hByClass }, C: { jobs: CRUN.jobs, written: CRUN.written, refusedByGrammar: CRUN.refused, admittedByChecker: CRUN.rows.filter((r) => r.certMachine && r.certMachine.startsWith('ADMITTED')).length, refusedByChecker: cCheckerRefused, decidedByReceiver: CDEC.summary, byKind: cByKind, grammarRefusals: cRefusals } },
  M2: { H: { rowsWithQuote: hQuoted.length, quotedVerbatim: hQuotedTrue, rowsWithFileDigest: hPinned, of: H.rows.length }, C: { objectsWithQuote: cQuoted, objectsWithPinAndSourceDigest: cPinned, of: COBJ.length, note: 'every object carries a quote found byte for byte in its source and the digest of the bytes it is about: the format refuses otherwise' } },
  M3: { H: hRefused, C: { byGrammar: CRUN.rows.filter((r) => r.refused).map((r) => ({ id: r.id, rule: r.refused.slice(0, 140) })), byChecker: cCheckerRefused } },
  M4: { H: { caught: HR.caught, of: HR.of, greenControlQuiet: HR.green_control_quiet, misses: HR.results.filter((r) => !r.ok).map((r) => r.plant) },
        C: CREC ? { caught: CREC.caught, of: CREC.of, greenControlQuiet: CREC.green_control_quiet, misses: CREC.results.filter((r) => !r.ok).map((r) => r.plant) } : 'not yet lifted' },
  M5: { pairs: pairs.length, agree: agree.length, disagree, hOnly, cOnly, note: 'a pair is the same claim under its two names; H-only rows are claims arm H stated and arm C has no object for (its own measurements, the statement-string checks, the counts the receiver has no decider for); C-only are the receiver\'s per-file digests from verify.py' },
  M6: cost,
  M7: { H: { trust: ['tools/run-cryptids.py: the parsers, the simulator, every claim\'s prose and its expected value (one file, this author)', 'tools/run-cryptids.js: the same computations again, same author, held to the record by the battery'], checkerSharingNoCode: 'none: the record is a JSON the lane wrote; nothing outside the lane and its twin checks it' },
        C: { trust: ['claimbox/readers/cryptids.py: which sentences were read and quoted', 'claimbox/grammar.py and translate.py (the machine family): what each sentence means as a predicate', 'instruments/claimbox/tm.py: the decider for machines (tm.js its twin)', 'instruments/claimbox/check.py and check.js: the object format\'s checkers, which admit or refuse every object'], checkerSharingNoCode: 'check.py (and check.js) accept or refuse each object: the quote in the source, the pins, the record\'s row and word, the arithmetic decided from the object; they share no code with the reader' } },
  M8: gaps,
  secondImplementations: { H: 'tools/run-cryptids.js recomputes the decision-bearing rows (the battery runs it; 0 disagreements at the last run)', C: CDECJS ? { objects: CDEC.rows.length, jsObjects: CDECJS.rows.length, disagree: CDEC.rows.filter((r) => { const o = CDECJS.rows.find((x) => x.id === r.id); return !o || o.verdict !== r.verdict || JSON.stringify(o.computed) !== JSON.stringify(r.computed); }).length } : null },
  kernel: KER || 'not yet run',
  generated: new Date().toISOString().slice(0, 10),
};
const outPath = path.join(ROOT, 'certs', 'cryptids-benchmark.json');
const text = JSON.stringify(OUT, null, 1) + '\n';
if (CHECK) {
  need(fs.existsSync(outPath), 'certs/cryptids-benchmark.json is missing');
  const old = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const strip = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.generated; return JSON.stringify(c); };
  need(strip(old) === strip(OUT), 'the benchmark would change: rerun tools/build-cryptids-benchmark.js and read the diff');
  console.log('cryptids benchmark: identical (' + pairs.length + ' pairs, ' + agree.length + ' agree, ' + disagree.length + ' disagree; H recall ' + HR.caught + '/' + HR.of + (CREC ? ', C recall ' + CREC.caught + '/' + CREC.of : '') + ')');
} else {
  fs.writeFileSync(outPath, text);
  console.log('certs/cryptids-benchmark.json written: H ' + H.rows.length + ' rows, C ' + COBJ.length + ' objects; ' + pairs.length + ' pairs, ' + agree.length + ' agree, ' + disagree.length + ' disagree; H-only ' + hOnly.length + ', C-only ' + cOnly.length);
  for (const d of disagree) console.log('  disagree ' + d.h + ' (' + d.hWord + ') vs ' + d.c + ' (' + d.cWord + ')');
}
