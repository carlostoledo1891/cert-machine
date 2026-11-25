#!/usr/bin/env node
/* omega-live-records.js — the records of /omega/ (corpus/omega-live/), each written from the lane's own files.

   The page /omega/ is the live page of the ω = 9/4 lane: an audit, in the open, of OpenAI's November 24 release claiming
   that the exponent of matrix multiplication is 9/4 over every field. Its builder (tools/build-omega-live.js) reads only
   corpus/omega-live/. This file writes those records from the lane's files in corpus/omega-nine-fourths/ (it never
   writes there: other agents do) and refuses when a source no longer says what a record states:
     PREREG.md            every row id and gap id must stand in it; the gaps, the phase titles, the verdict rule, the
                          independence sentence, the target's commit and pinned files and the ceiling are READ from it
     AMENDMENTS.md        the amendments (headings), the pod lines (id, price, creation time), the agents' start time
     DEVIATIONS.md        the corrections ledger, one entry per "Dn (when, …). text" paragraph
     SEAL-*.sha256        every file a seal lists must still hash to the sealed value (an append-only file —
                          AMENDMENTS.md, DEVIATIONS.md — must still BEGIN with the sealed bytes); the .ots beside it must
                          stamp that seal file's own sha256, and is read for its attestation (a Bitcoin block, else pending)
     runs/<run>/PROGRESS.md  one line per row event, "- YYYY-MM-DD HH:MM — <ROW> <word> …"; the word gives the state
     bridge/PROGRESS.md   (VERBS below); a step line whose word is not a state is running only when it ends "running." or
                          "in progress.", and any other is refused, never guessed
     blind/, reader/, proof-readers/, provenance/   the runs' RUN.txt (start, end, exit; the TASK.md hash it started
                          from must be the task file's), the seals that name the blind statements, the reports' presence
   A state is never ahead of the clock: every time a source states must be at or before the moment the records are
   written; the money is the pods' price times the time since each was created, at the records' minute, rounded down.

   usage: node tools/omega-live-records.js            write state.json and ledger.json
          node tools/omega-live-records.js --final    the same, marked final, and certs/omega-nine-fourths.json beside them;
                                                      refused while any row is running or pending or no verdict is declared
          node tools/omega-live-records.js --check    recompute them at their own minute and refuse on any difference
          node tools/omega-live-records.js --log "what changed"   append a dated entry to page-log.json with the state  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const LANE_REL = 'corpus/omega-nine-fourths';
const LANE = path.join(ROOT, LANE_REL);
const OUT = path.join(ROOT, 'corpus', 'omega-live');
const die = (m) => { console.error('OMEGA-LIVE RECORDS REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const has = (rel) => fs.existsSync(path.join(LANE, rel));
const rd = (rel) => { need(has(rel), 'a source is gone: ' + LANE_REL + '/' + rel); return fs.readFileSync(path.join(LANE, rel)); };
const txt = (rel) => rd(rel).toString('utf8');
const filled = (rel) => has(rel) && fs.statSync(path.join(LANE, rel)).isFile() && fs.statSync(path.join(LANE, rel)).size > 0;
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const J = (o) => JSON.stringify(o, null, 1) + '\n';
const iso = (d, t) => d + 'T' + (t.length === 5 ? t + ':00' : t) + 'Z';
const hm = (ms) => new Date(ms).toISOString().slice(11, 16) + ' UTC';
const N3 = (n) => Number(n).toLocaleString('en-US');

/* the rows, in the pre-registration's order, each with a title in plain words (the pre-registration's own wording of
   every row is one click down, in PREREG.md) */
const ROWS = [
  ['PIN', 1, 'Pin the release: every file the proof uses hashed before anything is built'],
  ['K0', 1, 'Build the proof; list its axioms; search it for unsafe code'],
  ['K1', 1, 'The release’s own check (Comparator, Lean’s kernel only), as released'],
  ['K1N', 1, 'The same check with a second kernel, nanoda, switched on'],
  ['EXP', 1, 'Export the three theorems and the challenge for outside checkers'],
  ['K2', 1, 'nanoda at a second version, on the export'],
  ['K3', 1, 'con-leche, a third independently written checker'],
  ['KR', 1, 'Lean’s own checker, replayed from scratch'],
  ['CR', 1, 'A second machine that never ran the release’s code'],
  ['C1', 1, 'Control: 9/4 changed to 2.24, and 1/2 to 0.49, must be refused'],
  ['C2', 1, 'Control: the main theorem re-typed as False must be refused'],
  ['C3', 1, 'Control: one definition changed (a multiplication costs 2) must be refused'],
  ['CEN', 1, 'Census: what the three theorems use; whether divisions, the per-n bound or border rank are proved anywhere'],
  ['F1', 2, 'Two blind statements, written from the textbooks without seeing the release’s'],
  ['F2', 2, 'Bridge: each blind statement proved from the release’s theorems'],
  ['F3', 2, 'Anchors: the exponent is not Lean’s empty-set 0, and the formula gives the trivial values'],
  ['F4', 2, 'The statement reader: every difference between the Lean statement and the textbooks, each decided'],
  ['P1', 3, 'Two independent readings of the lower-bound proof'],
  ['P2', 3, 'Divisions, the per-n bound and Corollary 1.2: proved in the release, or not'],
  ['U', 3, 'Where the upper bound comes from, and how the release was received'],
  /* rows registered AFTER the seal, each by its amendment (with its brief sealed there), in a fourth band; outside the
     CERTIFIED rule unless the amendment says otherwise */
  ['X1', 4, 'Sun’s printed border-rank bound for 32 × 32 matrices, decided exactly', 'A10', 'prompts/sun-check.md'],
  /* rows added AFTER THE VERDICT (Phase 4, amendment A13, which does not change it), in a fifth band: each of G3a–G3d is a
     "- <id>" line of A13, whose body hashes the prover's brief; G3-CR, the clean-room replay, is the control room's
     addition, standing in DEVIATIONS.md (its pod) and in the prover's log (its start) */
  ['G3a', 5, 'The per-n bound counting every multiplication and division gate', null, 'prompts/pern-prover.md', 'A13'],
  ['G3b', 5, 'The paper’s per-n bound in nonscalar gates: ⌈n^{9/4}/2⌉ at every n ≥ 2, over every field', null, 'prompts/pern-prover.md', 'A13'],
  ['G3c', 5, 'The asymptotic rank of T_n over every field equals n^{9/4}', null, 'prompts/pern-prover.md', 'A13'],
  ['G3d', 5, 'The geometric border rank of T_n is at least n^{9/4}', null, 'prompts/pern-prover.md', 'A13'],
  ['G3-CR', 5, 'A clean-room replay of the Phase 4 proofs on a fresh machine that never ran the release’s code', null, null, null, { file: 'DEVIATIONS.md', needle: 'for the Phase 4 clean-room replay' }],
  /* Phase 5 (amendment A15, its statements sealed by A16), also after the verdict and outside it, in a sixth band: each of
     G3e, G3f, G2a, G2b is a "- <id>" line of A15, whose body hashes the prover's brief; P5-CR, the clean-room replay A15
     names, stands in DEVIATIONS.md (its pod) and in the prover's log */
  ['G3e', 6, 'Corollary 1.3, border rank: for every format a × b × c (a, b, c ≥ 1) and every field, the geometric border rank of T_{a,b,c} is at least max{ab, bc, ca, (abc)^{3/4}}', null, 'prompts/rect-prover.md', 'A15'],
  ['G3f', 6, 'Corollary 1.3, asymptotic rank: the same bound for the asymptotic rank of T_{a,b,c}, over every field', null, 'prompts/rect-prover.md', 'A15'],
  ['G2a', 6, 'The paper’s 1/2 ≤ α_F ≤ 2/3, in its own circuit model, where division gates are allowed', null, 'prompts/rect-prover.md', 'A15'],
  ['G2b', 6, 'The stronger α_F = 1/2 with division gates allowed (more than the paper claims)', null, 'prompts/rect-prover.md', 'A15'],
  ['P5-CR', 6, 'A clean-room replay of the Phase 5 proofs on a fresh machine that never ran the release’s code', null, null, null, { file: 'DEVIATIONS.md', needle: 'for the Phase 5 clean-room replay' }],
].map(([id, phase, title, amendment, brief, listed, logged]) => ({ id, phase, title, amendment, brief, listed, logged }));
const PHASE_AFTER = 'Added after the seal';
const PHASE_VERDICT = 'Added after the verdict (amendment A13)';
const PHASE_VERDICT2 = 'Added after the verdict (amendments A15, A16)';
const CONTROLS = new Set(['C1', 'C2', 'C3']);
const READ_ROWS = new Set(['P1', 'P2', 'U']);
const STATES = ['passed', 'read', 'running', 'pending', 'failed', 'refused', 'open'];
/* the word right after a row id in a PROGRESS.md line. A control passes when the checkers REFUSE it, so for C1–C3
   "refused" is a pass and "accepted" a failure; for every other row the reverse. "stopped" is a row that could not run. */
const VERBS = { started: 'running', running: 'running', restarted: 'running', resumed: 'running', passed: 'passed', failed: 'failed',
  stopped: 'refused', open: 'open', read: 'read', accepted: 'ACC', refused: 'REF',
  /* the runner's words (control room, 2026-11-25 04:1x UTC): "<ROW> setup …" is a row being set up, so running;
     "<ROW> done" is a step row (EXP) finished with its output recorded, so passed */
  setup: 'running', done: 'passed',
  /* "F4 decision tests …": the runner's report of the reader's tests, a step toward F4's decision, which the lane log states (A12) */
  decision: 'running',
  /* "CEN additions (XCEN, exit 0)": further census items the control room asked for, finished; CEN had already passed */
  additions: 'passed' };

/* P5-CR's note once it has passed, each fact read from its lines in phase5/prover/PROGRESS.md (say(needles, words)) */
const P5CR_NOTE = (say) => say(['P5-CR passed: all 4 gates held', 'no openai/math clone on the pod', 'BYTE-IDENTICAL to the prover pod\'s chal.ndjson and chalPlanted2.ndjson',
  'Checked 96137 declarations with no typechecker errors', 'accepted 92893 declarations', '4 axioms justified by the solution', 'the planted challenge refused, exit 1', 'STOPPED at 15:02:34 UTC on infrastructure, not a gate'],
  'On a fresh machine that never downloaded or ran the release’s code, the exported proof arrived intact and was checked again from scratch: nanoda and con-leche accept it, con-leche finds all four statements justified against our sealed statements, rebuilt there byte for byte as on the prover’s machine, and the planted false copy is refused. One setup step stopped once on the machine’s package mirror, not on a check; the script was fixed and the setup rerun.');

/* an .ots file: the digest it stamps (sha256 op 0x08 after the 31-byte magic and the version byte), and its attestations */
function ots(buf) {
  const MAGIC = Buffer.from('004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294', 'hex');
  need(buf.subarray(0, 31).equals(MAGIC) && buf[32] === 0x08, 'an .ots file is not an OpenTimestamps sha256 proof');
  const digest = buf.subarray(33, 65).toString('hex');
  const BTC = Buffer.from('0588960d73d71901', 'hex'), PEND = Buffer.from('83dfe30d2ef90c8e', 'hex');
  const blocks = [];
  let i = buf.indexOf(BTC);
  while (i >= 0) {
    let j = i + 8, s = 0, b;
    do { b = buf[j++]; s += 7; } while (b & 0x80);   /* payload length */
    let h = 0; s = 0;
    do { b = buf[j++]; h += (b & 0x7f) * 2 ** s; s += 7; } while (b & 0x80);  /* the block height */
    blocks.push(h);
    i = buf.indexOf(BTC, i + 8);
  }
  return { digest, state: blocks.length ? 'bitcoin' : buf.indexOf(PEND) >= 0 ? 'pending' : 'unknown', block: blocks.length ? Math.min(...blocks) : null };
}

function build(clock) {
  const asOf = Math.floor(clock / 60000) * 60000;
  const times = [];   /* every time a source states, checked against the clock at the end */
  const at = (label, ms) => { need(Number.isFinite(ms), label + ': not a time'); times.push([label, ms]); return ms; };

  /* ------------------------------------------------------------ the pre-registration */
  const PRE = txt('PREREG.md');
  const sec = (a, b) => { const i = PRE.indexOf(a), j = b ? PRE.indexOf(b) : PRE.length; need(i >= 0 && j > i, 'PREREG.md has no section "' + a + '" before "' + b + '"'); return PRE.slice(i + a.length, j); };
  const rowsSec = sec('## Rows', '## Verdict rule');
  const gapsSec = sec('## Gaps as of the pin', '## Rows');
  const ruleSec = norm(sec('## Verdict rule', '## Ceiling'));
  const target = {
    repo: 'openai/math',
    commit: (/github\.com\/openai\/math at commit ([0-9a-f]{40})/.exec(norm(PRE)) || die('PREREG.md names no commit of github.com/openai/math'))[1],
    committed: (/\((\d{4}-\d\d-\d\d \d\d:\d\d:\d\d) UTC, "Add November 24 mathematics manuscripts and Lean formalizations"\)/.exec(norm(PRE)) || die('PREREG.md no longer dates the commit'))[1],
    paper_folder: 'preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026',
    pinned: [...PRE.matchAll(/^\| (\S+)(?: \(([^)]*)\))? \| ([0-9a-f]{64}) \|$/gm)].map((m) => ({ file: m[1], about: m[2] || '', sha256: m[3] }))
  };
  need(target.pinned.length >= 10, 'PREREG.md pins fewer than ten files');
  need(norm(PRE).includes('preprints/' + target.paper_folder.slice('preprints/'.length) + '/paper.pdf'), 'PREREG.md no longer pins the paper in ' + target.paper_folder);
  /* the claim's words this page states, each as the pre-registration says it */
  for (const n of ['The new part is the LOWER bound: ω_F ≥ 9/4', 'The paper credits the upper bound ω_F ≤ 9/4 to an OpenAI preprint (over ℂ) and to Amanov, van den Berg and Zuiddam (every field)',
    'OpenAI\'s claim "The matrix multiplication exponent is nine fourths"', 'formalOmega F 1 1 1 = 9/4', 'Permitted axioms propext, Quot.sound, Classical.choice'])
    need(norm(PRE).includes(n), 'PREREG.md no longer says: ' + n);
  /* the phases, titled as PREREG.md titles them */
  const PHASES = {};
  for (const m of rowsSec.matchAll(/^Phase (\d) — ([^(\n]+?)(?: \(|$)/gm)) PHASES[m[1]] = m[2].trim().replace(/^./, (c) => c.toUpperCase());
  for (const p of [1, 2, 3]) need(PHASES[p], 'PREREG.md has no Phase ' + p + ' in its Rows');
  for (const r of ROWS.filter((x) => x.phase <= 3)) need(new RegExp('(^|[\\s(])' + r.id + '(\\s|$)', 'm').test(rowsSec), 'row ' + r.id + ' does not stand in PREREG.md’s Rows');
  /* the gaps, word for word */
  const gaps = gapsSec.split(/\n- (?=G\d+ )/).slice(1).map((g) => { const m = /^(G\d+) ([\s\S]+)$/.exec(g.trim()); need(m, 'a gap of PREREG.md is not "- Gn text"'); return { id: m[1], text: norm(m[2]) }; });
  need(gaps.length === 7 && gaps.every((g, i) => g.id === 'G' + (i + 1)), 'PREREG.md’s gaps are not G1–G7 in order');
  /* the verdict rule, in its three sentences */
  const iOther = ruleSec.indexOf(' Otherwise the verdict names the first failing row:'), iNot = ruleSec.indexOf('What CERTIFIED would NOT say:');
  need(ruleSec.startsWith('CERTIFIED (the formal claim') && iOther > 0 && iNot > iOther, 'the verdict rule no longer reads CERTIFIED … Otherwise … What CERTIFIED would NOT say');
  const verdict_rule = { certified: ruleSec.slice(0, iOther).trim(), otherwise: ruleSec.slice(iOther, iNot).trim(), not_say: ruleSec.slice(iNot).trim() };
  for (const n of ['REFUTED (a proved defect in meaning', 'REFUSED (a row could not be run', 'OPEN (undecided, with the reason)']) need(verdict_rule.otherwise.includes(n), 'the verdict rule no longer says ' + n);
  for (const n of ['that any human has checked the mathematics', 'divisions, the per-n bound, border rank or asymptotic rank unless CEN finds them proved', 'the kernels, the three axioms, the Mathlib definitions the statements use']) need(verdict_rule.not_say.includes(n), 'the verdict rule no longer says what CERTIFIED would not say: ' + n);
  const independence = (/The claim was made by OpenAI models and GPT-6\.2-astra is an OpenAI model: independence is by procedure \(separate prompts, sealed outputs, no shared files\), not by vendor, and the release says so\./.exec(norm(PRE)) || die('PREREG.md no longer states the independence sentence'))[0];
  for (const n of ['Claude agents (writer A, the adversarial reader, the bridge\'s author, reader 1), GPT-6.2-astra (writer B, reader 2)', 'writer A a Claude agent, writer B GPT-6.2-astra', '(a Claude agent and GPT-6.2-astra, separately)', 'Written by the control room (Claude Opus 5.5, for Carlos Toledo)'])
    need(norm(PRE).includes(n), 'PREREG.md no longer names the panel as: ' + n);
  const ceiling_usd = Number((/Pods: US\$(\d+)/.exec(PRE) || die('PREREG.md states no pod ceiling'))[1]);

  /* ------------------------------------------------------------ the amendments */
  const AM = txt('AMENDMENTS.md');
  const amendments = [...AM.matchAll(/^## (A\d+(?:-c)?) — (\d{4}-\d\d-\d\d) (~?)(\d\d:\d\d) UTC: (.+)$/gm)].map((m) => ({ id: m[1], day: m[2], approx: m[3] === '~', hm: m[4], title: m[5].replace(/\s*\(SEAL-[^)]*\)\s*$/, '').trim() }));
  need(amendments.length >= 2 && /^## /m.test(AM) && (AM.match(/^## /gm) || []).length === amendments.length, 'an AMENDMENTS.md heading is not "## An — YYYY-MM-DD HH:MM UTC: title"');
  for (const a of amendments) at('amendment ' + a.id + '’s heading', Date.parse(iso(a.day, a.hm)));
  /* a correction "An-c" that says when An was really sealed gives its seal time */
  const sealedAt = {};
  for (const m of norm(AM).matchAll(/read (\d\d:\d\d:\d\d) UTC when (A\d+) was sealed/g)) { const a = amendments.find((x) => x.id === m[2]); if (a) sealedAt[m[2]] = at(m[2] + '’s corrected seal time', Date.parse(iso(a.day, m[1]))); }
  /* each amendment's body; its "- C-n" bullets are our corrections, its "- Nn" bullets facts found after the pin, and a
     paragraph "<ROW>'s scope (…): text" a change of a row's scope, all quoted as written */
  const heads = [...AM.matchAll(/^## (A\d+(?:-c)?) — /gm)].map((m) => ({ id: m[1], i: m.index }));
  const bodyOf = (id) => { const k = heads.findIndex((h) => h.id === id); const a = AM.indexOf('\n', heads[k].i) + 1, b = k + 1 < heads.length ? heads[k + 1].i : AM.length; return AM.slice(a, b).trim(); };
  for (const a of amendments) a.body = bodyOf(a.id);
  const corrections = [], facts = [], scopes = [];
  for (const a of amendments) {
    /* a bullet is its "- " line and the indented lines under it */
    const bullets = [];
    for (const l of a.body.split('\n')) { if (/^- /.test(l)) bullets.push(l.slice(2)); else if (/^\s+\S/.test(l) && bullets.length) bullets[bullets.length - 1] += ' ' + l.trim(); else bullets.push(null); }
    for (const bl of bullets.filter(Boolean)) {
      const m = /^(C-\d+|N\d+) ([\s\S]+)$/.exec(bl);
      if (!m) continue;
      const item = { id: m[1], amendment: a.id, when: a.day + ' ' + (a.approx ? '~' : '') + a.hm + ' UTC', text: norm(m[2]), gaps: [...new Set((m[2].match(/\bG\d\b/g) || []))] };
      (m[1].startsWith('C-') ? corrections : facts).push(item);
    }
    for (const m of a.body.matchAll(/^([A-Z][A-Z0-9]*)'s scope \(([^)]*)\): ([\s\S]+?)(?=\n\n|(?![\s\S]))/gm)) scopes.push({ row: m[1], amendment: a.id, when: a.day + ' ' + a.hm + ' UTC', why: norm(m[2]), text: norm(m[3]) });
  }
  /* the control room's own correction after Phase 5 (no amendment carries it; the house rule: our misses are reported
     before the results). Each fact it states is read from the file that states it, and it refuses when one no longer does. */
  {
    const P1 = norm(txt('runs/p1/PROGRESS.md')), P5L = norm(txt('phase5/prover/PROGRESS.md'));
    for (const n of ['CEN additions (XCEN, exit 0): docs/379.md\'s division theorems are SpectralBooks.divisionOmega_square_eq_formalOmega', 'MatrixExponent.omega_eq (division model) IS on the route'])
      need(P1.includes(n), 'correction C-4: runs/p1/PROGRESS.md no longer says "' + n + '"');
    need(!txt('runs/p1/PROGRESS.md').split('\n').filter((l) => /— CEN /.test(l)).some((l) => l.includes('Rectangle.exponent_eq')), 'correction C-4: the census lines do name Rectangle.exponent_eq (runs/p1/PROGRESS.md), so there is no miss to correct');
    need(norm(txt('VERDICT.md')).includes('divisions beyond the square case'), 'correction C-4: VERDICT.md no longer says "divisions beyond the square case"');
    need(P5L.includes('the release\'s rectangular exponent WITH division (MatrixExponent.Rectangle.exponent_eq via exponent_lt_of_rank)'), 'correction C-4: phase5/prover/PROGRESS.md no longer says the prover used Rectangle.exponent_eq');
    const LIB = txt('phase5/prover/src/RectProof/Lib.lean');
    need(LIB.includes('import OAI.LinearAlgebra.MatrixExponent.FieldFormula') && LIB.includes('Rectangle.exponent_eq K'), 'correction C-4: RectProof/Lib.lean no longer imports FieldFormula and uses Rectangle.exponent_eq');
    need(txt('phase5/prover/inputs/rel/ME_FieldFormula.lean').includes('theorem Rectangle.exponent_eq (F : Type*) [Field F]'), 'correction C-4: the release’s FieldFormula.lean (phase5/prover/inputs/rel/) no longer states Rectangle.exponent_eq');
    need(!corrections.some((c) => c.id === 'C-4'), 'an amendment now has its own C-4: renumber the control room’s correction');
    at('correction C-4', Date.parse('2026-11-25T14:57:00Z'));
    corrections.push({ id: 'C-4', amendment: null, by: 'the control room, after Phase 5', when: '2026-11-25 14:57 UTC', gaps: ['G2'],
      text: 'The census (row CEN, at 04:58 UTC) named the release’s division theorems for the square case only (`MatrixExponent.omega_eq`, and `SpectralBooks.divisionOmega_square_eq_formalOmega` beside it), and the verdict’s text followed it: it lists “divisions beyond the square case” among what it does not say. The census missed `MatrixExponent.Rectangle.exponent_eq` (in `OAI/LinearAlgebra/MatrixExponent/FieldFormula.lean`), the rectangular exponent in the release’s own division model; Phase 5’s prover found it and used it to prove α_F = 1/2 with division gates. So divisions beyond the square case are not in the statements this audit checked (Comparator’s challenge), but they are proved in the release’s files. The verdict does not change.' });
  }
  for (const c of corrections) for (const g of c.gaps) need(/^G[1-7]$/.test(g), 'correction ' + c.id + ' names a gap the pre-registration does not have: ' + g);
  const A3 = norm(AM.slice(AM.indexOf('## A3 '), AM.indexOf('\n## ', AM.indexOf('## A3 ') + 4) > 0 ? AM.indexOf('\n## ', AM.indexOf('## A3 ') + 4) : AM.length));
  const st = /Started (\d\d:\d\d)–(\d\d:\d\d) UTC with the four Claude agents \(([^)]+)\) and the provenance scout/.exec(A3) || die('amendment A3 no longer says when the agents started');
  const a3 = amendments.find((a) => a.id === 'A3');
  const started = at('A3’s start of the agents', Date.parse(iso(a3.day, st[1])));
  const startedWho = st[3].split(',').map((s) => s.trim());
  for (const w of ['Phase 1 runner', 'writer A', 'the adversarial reader', 'proof reader 1']) need(startedWho.includes(w), 'amendment A3 no longer names ' + w + ' among the agents started');
  /* the pods: "pod: <id>, <machine>, US$<x>/h, created YYYY-MM-DD HH:MM:SS UTC" (or "pod (replacement): …"); an end "<id> … deleted|terminated … <time>" */
  const PODTXT = [norm(AM)].concat(has('DEVIATIONS.md') ? [norm(txt('DEVIATIONS.md'))] : []).join(' ');
  /* "pod (replacement): <id>, …" too: the Phase 5 prover's second pod is declared that way in DEVIATIONS.md */
  const pods = [...PODTXT.matchAll(/pod(?: \([a-z ]+\))?: ([a-z0-9]{10,20}), ([^,]+), US\$(\d+(?:\.\d+)?)\/h, created (\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d) UTC/g)].map((m) => ({ id: m[1], machine: m[2], usd_per_h: Number(m[3]), created_utc: iso(m[4], m[5]) }));
  need(pods.length >= 1, 'AMENDMENTS.md names no pod with its price and creation time');

  /* ------------------------------------------------------------ the corrections ledger */
  const deviations = has('DEVIATIONS.md') ? txt('DEVIATIONS.md').split(/\n\s*\n/).map((par) => /^(D\d+) \(([^)]*)\)\. ([\s\S]+)$/.exec(par.trim())).filter(Boolean)
    .map((m) => ({ id: m[1], when: m[2], rows: (/\brows? ([A-Z][A-Z0-9]*(?:(?:, | and )[A-Z][A-Z0-9]*)*)/.exec(m[2]) || [, ''])[1].split(/, | and /).filter(Boolean), text: norm(m[3]) })) : [];
  for (const d of deviations) { const m = /^(\d{4}-\d\d-\d\d) (\d\d:\d\d) UTC/.exec(d.when); need(m, 'deviation ' + d.id + ' is not dated "YYYY-MM-DD HH:MM UTC"'); at('deviation ' + d.id, Date.parse(iso(m[1], m[2]))); }
  deviations.forEach((d, i) => need(i === 0 || Number(d.id.slice(1)) === Number(deviations[i - 1].id.slice(1)) + 1, 'the deviations are not numbered in order at ' + d.id));

  /* ------------------------------------------------------------ the seals */
  const APPEND_ONLY = new Set(['AMENDMENTS.md', 'DEVIATIONS.md', 'PROGRESS.md']);   /* PROGRESS.md (the lane-level log) is append-only too: sealed in A11 and A12, it grows by one line per row event (control room, 2026-11-25) */
  const sealFiles = fs.readdirSync(LANE).filter((f) => /^SEAL-[A-Za-z0-9]+\.sha256$/.test(f))
    .sort((a, b) => { const k = (f) => f === 'SEAL-0.sha256' ? -1 : Number((/A(\d+)/.exec(f) || [, 1e9])[1]) * 10 + (/c\.sha256$/.test(f) ? 1 : 0); return k(a) - k(b); });
  need(sealFiles[0] === 'SEAL-0.sha256', 'the lane has no SEAL-0.sha256');
  const sealedPaths = {};
  const seals = sealFiles.map((f) => {
    const id = f.slice(0, -'.sha256'.length);
    const lines = txt(f).trim().split('\n');
    for (const l of lines) {
      const m = /^([0-9a-f]{64})\s+(.+)$/.exec(l.trim()); need(m, f + ': a line is not "sha256  path"');
      const rel = m[2].replace(new RegExp('^' + LANE_REL + '/'), '');
      const now = rd(rel);
      if (sha(now) !== m[1]) {
        /* an append-only file grows after its seal: the sealed bytes must still stand, unchanged, at its head */
        need(APPEND_ONLY.has(rel), f + ': ' + rel + ' no longer hashes to its sealed value');
        let ok = false;
        for (let i = now.indexOf(10); i >= 0 && !ok; i = now.indexOf(10, i + 1)) ok = sha(now.subarray(0, i + 1)) === m[1];
        need(ok, f + ': ' + rel + ' was changed, not appended to, after its seal');
      }
      (sealedPaths[rel] = sealedPaths[rel] || []).push(id);
    }
    const o = ots(rd(f + '.ots'));
    need(o.digest === sha(rd(f)), f + '.ots does not stamp ' + f + ' (its digest is not the file’s sha256)');
    need(o.state !== 'unknown', f + '.ots holds no attestation');
    const aid = id === 'SEAL-0' ? null : id.slice(5).replace(/c$/, '-c');
    const am = aid ? amendments.find((a) => a.id === aid) : null;
    /* the stamp's time: the seal's own .stamped-at when the lane wrote one, else its amendment's (corrected) heading time */
    const own = has(id + '.stamped-at') ? at(id + '.stamped-at', Date.parse(txt(id + '.stamped-at').trim())) : null;
    need(id !== 'SEAL-0' || own, 'SEAL-0 has no stamped-at');
    const stamped = own || (am ? (sealedAt[am.id] || Date.parse(iso(am.day, am.hm))) : null);
    const dev = deviations.find((d) => d.text.includes('(' + id + ')') || d.text.includes(' ' + id + ' '));
    const what = id === 'SEAL-0' ? 'the pre-registration' : am ? am.title
      : lines.some((l) => /A1-target-SHA256SUMS$/.test(l)) ? 'the sha256 of every file the two modules import, written at the pin step before anything is built'
      : dev ? 'the files deviation ' + dev.id + ' names, hashed before any of them is built' : 'amendment ' + aid;
    return { id, amendment: aid, what, stamped_utc: stamped ? new Date(stamped).toISOString().slice(0, 19) + 'Z' : null,
      stamped_approx: !own && !!(am && am.approx && !sealedAt[am.id]), files: lines.length, file: LANE_REL + '/' + f, file_sha256: sha(rd(f)), ots_state: o.state, bitcoin_block: o.block };
  });
  need(sealedPaths['PREREG.md'] && sealedPaths['PREREG.md'].includes('SEAL-0'), 'SEAL-0 does not seal PREREG.md');
  const sealOf = (re) => Object.keys(sealedPaths).filter((p) => re.test(p)).flatMap((p) => sealedPaths[p]).sort()[0] || null;
  /* a row added after the seal stands in its amendment's heading ("a new row X1"), and its brief is hashed in that amendment */
  for (const r of ROWS.filter((x) => x.amendment)) {
    const a = amendments.find((x) => x.id === r.amendment);
    need(a && new RegExp('\\brow ' + r.id + '\\b').test(a.title), 'row ' + r.id + ' is not registered by amendment ' + r.amendment);
    need(new RegExp('[0-9a-f]{64}\\s+' + r.brief.replace(/[.]/g, '\\.') + '\\b').test(a.body), 'amendment ' + r.amendment + ' does not hash ' + r.brief);
    need(has(r.brief), 'the brief of row ' + r.id + ' is gone: ' + r.brief);
  }
  if (ROWS.some((x) => x.amendment)) PHASES[4] = PHASE_AFTER;
  /* a row listed in an amendment's body ("- G3a  …"), with its brief hashed there; or one standing in a lane file */
  for (const r of ROWS.filter((x) => x.listed)) {
    const a = amendments.find((x) => x.id === r.listed);
    need(a && new RegExp('^- ' + r.id + '\\s', 'm').test(a.body), 'row ' + r.id + ' is not listed in amendment ' + r.listed);
    need(new RegExp('[0-9a-f]{64}\\s+' + r.brief.replace(/[.]/g, '\\.') + '\\b').test(a.body) && has(r.brief), 'amendment ' + r.listed + ' does not hash ' + r.brief + ', or it is gone');
  }
  for (const r of ROWS.filter((x) => x.logged)) need(norm(txt(r.logged.file)).includes(r.logged.needle), 'row ' + r.id + ' stands nowhere in ' + r.logged.file + ' ("' + r.logged.needle + '")');
  if (ROWS.some((x) => x.phase === 5)) PHASES[5] = PHASE_VERDICT;
  if (ROWS.some((x) => x.phase === 6)) PHASES[6] = PHASE_VERDICT2;

  /* ------------------------------------------------------------ the runs */
  function run(dir) {
    if (!has(dir + '/RUN.txt')) return null;
    const R = txt(dir + '/RUN.txt');
    const s = /^start (\S+) TASK\.md ([0-9a-f]{64})$/m.exec(R); need(s, dir + '/RUN.txt has no "start <time> TASK.md <sha256>" line');
    need(sha(rd(dir + '/TASK.md')) === s[2], dir + '/RUN.txt started from a TASK.md that is not the one in its folder');
    const e = /^end (\S+) exit (\d+)$/m.exec(R);
    return { start: at(dir + ' start', Date.parse(s[1])), end: e ? at(dir + ' end', Date.parse(e[1])) : null, exit: e ? Number(e[2]) : null };
  }
  const runB = run('blind/B'), runR2 = run('proof-readers/astra');

  /* ------------------------------------------------------------ the progress lines */
  const progFiles = (has('runs') ? fs.readdirSync(path.join(LANE, 'runs')).filter((d) => has('runs/' + d + '/PROGRESS.md')).map((d) => 'runs/' + d + '/PROGRESS.md') : [])
    .concat(['bridge/PROGRESS.md', 'phase4/prover/PROGRESS.md', 'phase5/prover/PROGRESS.md', 'PROGRESS.md'].filter((f) => has(f)));   /* bridge/: the bridge author's log (rows F2, F3; amendment A9); phase4/prover/: the Phase 4 prover's (rows G3a–G3d, G3-CR; A13); phase5/prover/: the Phase 5 prover's and its clean-room replay's (rows G3e, G3f, G2a, G2b, P5-CR; A15) */
  const progress = [];
  for (const f of progFiles) for (const l of txt(f).split('\n')) {
    const m = /^- (\d{4}-\d\d-\d\d) (\d\d:\d\d(?::\d\d)?) — (\S+)(?: (\S+))?(.*)$/.exec(l.trim());
    if (!m) { need(!/^- \d{4}/.test(l.trim()), f + ': a line the records cannot read: ' + l.trim()); continue; }
    const t = at(f + ' line "' + l.trim().slice(0, 40) + '…"', Date.parse(iso(m[1], m[2])));
    const row = ROWS.find((r) => r.id === m[3].replace(/[:,.]$/, ''));
    let word = m[4] ? m[4].replace(/[:,.;]$/, '').toLowerCase() : '';
    if (row && word === 'in' && /^ progress\b/.test(m[5])) word = 'running';   /* "K0 in progress" */
    progress.push({ file: LANE_REL + '/' + f, line: l.trim(), t, row: row ? row.id : null, word });
    /* a line that opens with something else ("run started …; K0 in progress.") may still name a row with its state */
    /* a line that names several rows ("G3a passed; G3b passed; …") gives each its state: on a row's own line, only a
       segment that opens with another row id after "; " counts */
    for (const r of ROWS) {
      if (row && r.id === row.id) continue;
      /* on a row's own line the state word must close its segment (";", ":", " (" or the line's end), so a citation such
         as "K0 passed per runs/p1/PROGRESS.md" is not read as an event */
      const q = new RegExp(row ? '(?:^|;\\s)' + r.id + ' (started|running|passed|failed|stopped)(?=[;:]| \\(|\\.?$)' : '(?:^|[\\s;(])' + r.id + ' (in progress|started|passed|failed|stopped)\\b').exec(m[3] + (m[4] ? ' ' + m[4] : '') + m[5]);
      if (q) progress.push({ file: LANE_REL + '/' + f, line: l.trim(), t, row: r.id, word: q[1] === 'in progress' ? 'running' : q[1], echo: true });
    }
  }
  progress.sort((a, b) => a.t - b.t);
  const last = {};
  for (const p of progress) if (p.row) {
    /* a step line ("K0 lake update exit 0 (…); … build of the two modules running.") names no state word after the id;
       it is read as running only when it ENDS saying so, and refused otherwise */
    const v = VERBS[p.word] || (/\b(running|in progress)\.?$/.test(p.line) ? 'running' : undefined);
    need(v, p.file + ': "' + p.line + '" — after a row id the records read only ' + Object.keys(VERBS).join(', ') + ' (add a word to VERBS in tools/omega-live-records.js, never guess one)');
    const stt = v === 'ACC' ? (CONTROLS.has(p.row) ? 'failed' : 'passed') : v === 'REF' ? (CONTROLS.has(p.row) ? 'passed' : 'failed') : v;
    need(stt !== 'read' || READ_ROWS.has(p.row), p.file + ': "read" is a state of the READ rows (P1, P2, U) only: ' + p.line);
    /* a row still running keeps the time it started, not the time of its latest step line */
    last[p.row] = { state: stt, t: stt === 'running' && last[p.row] && last[p.row].state === 'running' ? last[p.row].t : p.t, word: p.word };
  }

  /* ------------------------------------------------------------ each row's state */
  const devNote = (id) => { const d = deviations.filter((x) => x.rows.includes(id)).map((x) => x.id); return d.length ? ' See ' + (d.length > 1 ? 'deviations ' : 'deviation ') + d.join(', ') + '.' : ''; };
  const WORDS = { running: 'Started', passed: 'Passed', failed: 'Failed', refused: 'Stopped: it could not run', open: 'Left open', read: 'Read' };
  const p1Started = startedWho.includes('Phase 1 runner') ? started : null;
  const rows = ROWS.map((r) => {
    let state = 'pending', note = '';
    if (r.phase === 1) note = r.id === 'CR' ? 'Runs on a second, fresh machine, after the export.' : p1Started ? 'Queued in the Phase 1 run, on a rented machine since ' + hm(p1Started) + '.' : '';
    if (CONTROLS.has(r.id) && state === 'pending') note += ' A control passes when the checkers refuse it.';
    if (r.id === 'F1') {
      const sA = sealOf(/^blind\/A\/.*\.lean$/), sB = sealOf(/^blind\/B\/.*\.lean$/);
      const sealT = (sid) => { const s = seals.find((x) => x.id === sid); return s && s.stamped_utc ? (s.stamped_approx ? 'about ' : '') + hm(Date.parse(s.stamped_utc)) : 'a sealed time'; };
      const A = sA ? 'written and sealed at ' + sealT(sA) + ' (amendment ' + sA.slice(5).replace(/c$/, '-c') + ')' : startedWho.includes('writer A') ? 'writing since ' + hm(started) : 'not started';
      const B = sB ? 'written and sealed at ' + sealT(sB) + ' (amendment ' + sB.slice(5).replace(/c$/, '-c') + ')' : runB ? (runB.end ? 'finished at ' + hm(runB.end) + ', not yet sealed' : 'writing since ' + hm(runB.start)) : 'not started';
      state = (sA || sB || startedWho.includes('writer A') || runB) ? 'running' : 'pending';
      note = 'Writer A (a Claude agent): ' + A + '. Writer B (GPT-6.2-astra): ' + B + '.' + (sA && sB ? ' Both were sealed before either was elaborated; next, each is elaborated against the release’s Lean and Mathlib.' : '');
    }
    const bridgeBrief = sealOf(/^prompts\/bridge-author\.md$/);
    const bb = bridgeBrief ? ' The bridge author’s brief was sealed (amendment ' + bridgeBrief.slice(5).replace(/c$/, '-c') + '); its proofs compile once K0 has passed.' : '';
    if (r.id === 'F2') note = 'Waits for F1 and K0.' + bb + (scopes.some((x) => x.row === 'F2') ? ' Its scope was set by amendment ' + scopes.filter((x) => x.row === 'F2').map((x) => x.amendment).join(', ') + ', before any bridge attempt.' : '');
    if (r.id === 'F3') note = 'Waits for K0.' + bb;
    if (r.id === 'F4' && startedWho.includes('the adversarial reader')) {
      state = 'running';
      note = filled('reader/REPORT.md') ? 'The reading is in; each material difference now waits for its Lean test.' : 'Reading since ' + hm(started) + '.';
    }
    if (r.id === 'P1') {
      const one = filled('proof-readers/claude/REPORT.md'), two = (filled('proof-readers/astra/work/REPORT.md') || filled('proof-readers/astra/REPORT.md')) && runR2 && runR2.end && runR2.exit === 0;
      const s1 = startedWho.includes('proof reader 1'), s2 = !!runR2;
      state = one && two ? 'read' : s1 || s2 ? 'running' : 'pending';
      note = one && two ? 'Both readings are in: reader 1 (a Claude agent) and reader 2 (GPT-6.2-astra, finished at ' + hm(runR2.end) + '), each written alone, neither seeing the other’s.'
        : 'Reader 1 (a Claude agent): ' + (one ? 'its reading is in' : s1 ? 'reading since ' + hm(started) : 'not started') + '. Reader 2 (GPT-6.2-astra): ' + (two ? 'its reading is in' : s2 ? 'reading since ' + hm(runR2.start) : 'not started') + '. Each reads alone; neither sees the other’s report.';
    }
    if (r.id === 'P2') note = 'Waits for CEN and the two readings.';
    if (r.amendment) note = 'Registered by amendment ' + r.amendment + ', with its brief sealed, before it starts; outside the CERTIFIED rule.'
      + (r.id === 'X1' ? ' Two reconstructions of the printed tables with no shared code, and an exact check at random points; its own verdict words are REFUTED-AS-PRINTED, PASSES-POINTS or NEEDS DATA.' : '');
    if (r.id === 'U') { state = filled('provenance/SCOUT.md') ? 'read' : 'running'; note = state === 'read' ? 'The provenance report is in.' : 'Collecting sources since ' + hm(started) + '.'; }
    if (last[r.id]) {
      const L = last[r.id];
      state = L.state;
      note = WORDS[L.state] + ' at ' + hm(L.t) + (r.phase === 1 && r.id !== 'CR' ? ' on the Phase 1 machine' : '') + '.' + (L.state === 'running' ? '' : '');
      if (r.id === 'F1' && L.state === 'running') note = WORDS.running + ' at ' + hm(L.t) + '.';
    }
    if (r.phase === 5 && state === 'passed') {
      const P4 = norm(txt('phase4/prover/PROGRESS.md'));
      const say = (needles, words) => { for (const n of needles) need(P4.includes(n), 'phase4/prover/PROGRESS.md no longer says "' + n + '" (row ' + r.id + ')'); return words; };
      note = 'Passed at ' + hm(last[r.id].t) + '. ' + (r.id === 'G3-CR'
        ? say(['never ran the release\'s code, all 4 gates held', 'Checked 95337 declarations with no typechecker errors', 'all four theorems justified', 'refused, exit 1'],
          'On a fresh machine that never ran the release’s code: nanoda (a second version) and con-leche accept the transferred export, con-leche justifies all four statements against the challenge exported there, and the planted challenge is refused.')
        : say(['nanoda kernel accepts the solution', 'Lean default kernel accepts the solution', 'Your solution is okay!', 'justifies all four theorems', 'Const does not match between challenge and target', 'it refuses, exit 1'],
          'Proved from the release’s theorems: Comparator, with our sealed statement file as the challenge, accepts the proof under Lean’s kernel and nanoda; con-leche justifies it; a planted copy with one constant changed is refused by both.'));
    }
    /* Phase 5: each passed row in one plain line of what it means, then how it was checked, every fact read from the
       prover's log (and the replay's lines in it) */
    if (r.phase === 6 && state === 'passed') {
      const P5L = norm(txt('phase5/prover/PROGRESS.md'));
      const say = (needles, words) => { for (const n of needles) need(P5L.includes(n), 'phase5/prover/PROGRESS.md no longer says "' + n + '" (row ' + r.id + ')'); return words; };
      const CHK = say(['nanoda kernel accepts the solution', 'Lean default kernel accepts the solution', 'Your solution is okay!', 'justifies all four theorems', 'refused it, exit 1', 'it refuses, exit 1', 'is refused by Comparator, exit 1', 'the sealed Rect.lean elaborates unchanged (no repair'],
        ' Checked as in Phase 4: Comparator (with Lean’s kernel and with nanoda) and con-leche accept the proof against our sealed statements, and both refuse two planted copies made false by one changed number.');
      const WHAT = {
        G3e: say(['G3e from G3f by asymptoticRank_le_geometricBorderRank'], 'In plain words: no bilinear algorithm for an a × b times b × c matrix product, not even an approximate one, gets by with fewer multiplications than this bound. Proved from the release’s theorems by way of the asymptotic-rank bound below.'),
        G3f: say(['G3f from the release\'s flattening bound + our own cube argument'], 'In plain words: the same floor holds for the cost per product when many such products are computed together, over any field. Proved from the release’s square-matrix theorem and its flattening bound, with our own argument that three relabelled copies of the rectangular product combine into a square one.'),
        G2a: say(['G2b and G2a:'], 'In plain words: α says how wide the middle dimension can grow (an n × n^β matrix times an n^β × n one) while the product still costs about n² operations; in the paper’s model, where a circuit may also divide, α lies between 1/2 and 2/3, as the paper claims. It follows from the next row.'),
        G2b: say(['β ≤ 1/2 by compiling the release\'s division-free programs', 'the release\'s rectangular exponent WITH division (MatrixExponent.Rectangle.exponent_eq via exponent_lt_of_rank)'], 'In plain words: α is exactly 1/2, sharper than the paper’s claim. Up to 1/2, the release’s division-free programs, rewritten as circuits of our model, already cost about n²; beyond 1/2, the release’s own rectangular exponent with divisions (a theorem in its files that our census missed, correction C-4) shows that even circuits that divide cost more.')
      };
      note = 'Passed at ' + hm(last[r.id].t) + '. ' + (r.id === 'P5-CR' ? P5CR_NOTE(say) : WHAT[r.id] + CHK);
    }
    note = (note + devNote(r.id)).trim();
    /* the row's record, one click down on the final report: every log line that names it, and the files its state is read from */
    const files = { F1: ['blind/A/BlindA.lean', 'blind/A/NOTES.md', 'blind/B/work/BlindB.lean', 'blind/B/work/NOTES.md', 'blind/B/RUN.txt'], F4: ['reader/REPORT.md'],
      P1: ['proof-readers/claude/REPORT.md', 'proof-readers/astra/work/REPORT.md', 'proof-readers/astra/REPORT.md', 'proof-readers/astra/RUN.txt'], U: ['provenance/SCOUT.md'] }[r.id] || [];
    const evidence = progress.filter((p) => p.row === r.id).map((p) => ({ file: p.file, line: p.line }))
      .concat(files.filter((f) => filled(f)).map((f) => ({ file: LANE_REL + '/' + f, sha256_12: sha(rd(f)).slice(0, 12) })));
    need(STATES.includes(state), 'row ' + r.id + ' has an unknown state: ' + state);
    need(state !== 'read' || READ_ROWS.has(r.id), 'row ' + r.id + ' is "read", a state of the READ rows only');
    return { id: r.id, phase: r.phase, title: r.title, state, note, evidence };
  });

  /* ------------------------------------------------------------ the clock and the money */
  for (const [label, ms] of times) need(ms <= clock, 'a state is ahead of the clock: ' + label + ' says ' + new Date(ms).toISOString() + ', the clock reads ' + new Date(clock).toISOString());
  let spent = 0;
  for (const p of pods) {
    const c = at('pod ' + p.id + ' created', Date.parse(p.created_utc));
    need(c <= clock, 'pod ' + p.id + ' was created after the clock');
    const endRe = new RegExp('\\b' + p.id + '\\b.{0,80}?\\b(?:deleted|terminated)\\b.{0,40}?(\\d{4}-\\d\\d-\\d\\d)[ T](\\d\\d:\\d\\d(?::\\d\\d)?)');
    const e = endRe.exec(PODTXT + ' ' + progress.map((x) => x.line).join(' '));
    p.ended_utc = e ? iso(e[1], e[2]) : null;
    const end = Math.min(asOf, e ? Date.parse(p.ended_utc) : Infinity);
    spent += Math.max(0, end - c) / 3600000 * p.usd_per_h;
  }
  const spent_usd = Math.floor(spent * 100) / 100;

  /* ------------------------------------------------------------ Phase 4 (after the verdict) and the published exports */
  const P5 = rows.filter((r) => r.phase === 5);
  const pern = sealOf(/^phase4\/writer\/PerN\.lean$/);
  const phase4 = P5.length ? {
    amendment: 'A13', statements: { file: LANE_REL + '/phase4/writer/PerN.lean', sha256: has('phase4/writer/PerN.lean') ? sha(rd('phase4/writer/PerN.lean')) : null, sealed_by: pern },
    rows: P5.map((r) => r.id), closes_g3: ['G3a', 'G3b', 'G3c', 'G3d', 'G3-CR'].every((id) => (P5.find((r) => r.id === id) || {}).state === 'passed') && !!pern
  } : null;
  /* Phase 5 (amendments A15, A16), after the verdict too: its sealed statements, its rows, and the solution export the
     three checkers accepted on the prover's machine (its digest and size as the lane recorded them) */
  const P6 = rows.filter((r) => r.phase === 6);
  const rect = sealOf(/^phase5\/writer\/Rect\.lean$/);
  const SOL5 = { file: 'sol.ndjson', sha256: '1e4aca344f9afe67fd8f847864d5cba6fe8eb53d86c15677365494537cde1957', bytes: 1218760170 };
  if (P6.length) {
    need(has('phase5/prover/pod-logs/work/exports/sol.ndjson.sha256') && txt('phase5/prover/pod-logs/work/exports/sol.ndjson.sha256').includes(SOL5.sha256), 'the Phase 5 solution export’s sha256 is not the one recorded in phase5/prover/pod-logs/work/exports/sol.ndjson.sha256');
    need(norm(txt('phase5/prover/PROGRESS.md')).includes('sol.ndjson ' + N3(SOL5.bytes) + ' bytes, sha256 ' + SOL5.sha256), 'the Phase 5 solution export’s size and sha256 are not the ones the prover logged');
  }
  const phase5 = P6.length ? {
    amendments: ['A15', 'A16'], statements: { file: LANE_REL + '/phase5/writer/Rect.lean', sha256: has('phase5/writer/Rect.lean') ? sha(rd('phase5/writer/Rect.lean')) : null, sealed_by: rect },
    rows: P6.map((r) => r.id), solution_export: Object.assign({}, SOL5, { recorded_in: LANE_REL + '/phase5/prover/pod-logs/work/exports/sol.ndjson.sha256' }),
    proved_all: P6.every((r) => r.state === 'passed') && !!rect
  } : null;
  /* the exported proofs, published as release assets (the operator's choice, A13): each name, size and sha256 must be the
     one the lane recorded when the file came home, so a link never points at bytes the lane did not check */
  const tag = (/tag (omega-nine-fourths-export-\d{4}-\d\d-\d\d)/.exec(norm(AM)) || [, null])[1];
  const ASSETS = [
    { name: 'export.ndjson.zst', what: 'the Phase 1 export of the three theorems', sha256: '4731e942060bb4d759f9cb77ef496794f5c30b5bd3b2fcace01c86cb19282ed5', bytes: 172572532, recorded_in: 'runs/p1/LARGE-FILES.txt', size_in: 'runs/p1/LARGE-FILES.txt' },
    { name: 'phase4-export.ndjson.zst', what: 'the Phase 4 export of the four statements’ proofs', sha256: '0644a59535ac0822be9562a280875df71768762a5895b479333e823683b65284', bytes: 128599600, recorded_in: 'phase4/prover/pod-logs/work/exports/sol.ndjson.zst.sha256', size_in: 'phase4/prover/PROGRESS.md' },
    /* an asset not yet uploaded carries published: false (no link is printed); the Phase 5 export was uploaded by the
       control room after P5-CR passed, and GitHub's digest and size were checked equal to these */
    { name: 'phase5-export.ndjson.zst', what: 'the Phase 5 export of the four statements’ proofs', sha256: '5a19d2613705e61e15c9613fb0973dffb6193fae7fefafa77418a97dd57d7770', bytes: 129490641, recorded_in: 'phase5/prover/pod-logs/work/exports/sol.ndjson.zst.sha256', size_in: 'phase5/prover/PROGRESS.md' }];
  const exports = tag ? {
    tag, url: 'https://github.com/carlostoledo1891/cert-machine/releases/tag/' + tag,
    files: ASSETS.map((a) => {
      need(has(a.recorded_in) && txt(a.recorded_in).includes(a.sha256), a.name + ': its sha256 is not the one recorded in ' + a.recorded_in);
      need(norm(txt(a.size_in)).includes(N3(a.bytes) + ' bytes'), a.name + ': its size is not the one the lane logged in ' + a.size_in);
      return Object.assign({}, a, { recorded_in: LANE_REL + '/' + a.recorded_in, size_in: LANE_REL + '/' + a.size_in, url: a.published === false ? null : 'https://github.com/carlostoledo1891/cert-machine/releases/download/' + tag + '/' + a.name });
    })
  } : null;

  /* ------------------------------------------------------------ the verdict */
  /* the verdict is OPEN until the lane declares one in VERDICT.md: "VERDICT: <word>" on its first line, the reason after */
  let verdict = 'OPEN', verdict_declared = false, verdict_reason = '';
  if (has('VERDICT.md')) { const m = /^VERDICT: (CERTIFIED|REFUTED|REFUSED|OPEN)\b[^\n]*\n?([\s\S]*)$/.exec(txt('VERDICT.md')); need(m, 'VERDICT.md does not open with "VERDICT: CERTIFIED|REFUTED|REFUSED|OPEN"'); verdict = m[1]; verdict_declared = true; verdict_reason = norm(m[2]); }
  const verdict_words = { OPEN: 'nothing decided yet', CERTIFIED: 'by the rule sealed before any run', REFUTED: 'a proved defect in meaning', REFUSED: 'a row could not be run' }[verdict];

  const counts = Object.assign({ all: rows.length }, Object.fromEntries(STATES.map((s) => [s, rows.filter((r) => r.state === s).length])));
  const SOURCES = ['PREREG.md', 'AMENDMENTS.md', 'DEVIATIONS.md', 'prompts/blind-writer.md', 'prompts/adversarial-reader.md', 'prompts/proof-reader.md', 'prompts/provenance-scout.md', 'prompts/kernel-runner.md',
    'blind/B/TASK.md', 'blind/B/RUN.txt', 'proof-readers/astra/TASK.md', 'proof-readers/astra/RUN.txt', 'proof-readers/astra/INPUTS.sha256', 'SEAL-0.stamped-at']
    .concat(progFiles).concat(sealFiles.flatMap((f) => [f, f + '.ots'])).filter((f, i, a) => has(f) && a.indexOf(f) === i);
  const scripts = ['tools/runpod-omega-p1.sh', 'tools/runpod-omega-cr.sh'].filter((f) => fs.existsSync(path.join(ROOT, f)));
  const state = {
    what: 'The state of the ω = 9/4 lane as the live page shows it, written by tools/omega-live-records.js from the lane’s files in corpus/omega-nine-fourths/ and checked against PREREG.md, the seals and the clock.',
    as_of: new Date(asOf).toISOString().slice(0, 16) + 'Z', final: false, verdict, verdict_declared, verdict_reason, verdict_words, ceiling_usd, spent_usd, pods,
    target, gaps, started_utc: new Date(started).toISOString().slice(0, 16) + 'Z',
    phases: Object.keys(PHASES).map(Number).sort().map((n) => ({ phase: n, title: PHASES[n], rows: rows.filter((r) => r.phase === n).map(({ id, title, state: s, note, evidence }) => ({ id, title, state: s, note, evidence })) })),
    counts, verdict_rule, independence,
    panel: [
      { who: 'Writer A, a Claude agent (Anthropic)', role: 'writes a blind statement of the claim in Lean from Bürgisser, Clausen and Shokrollahi’s textbook, without seeing the release’s (F1)' },
      { who: 'Writer B, GPT-6.2-astra (OpenAI, in Codex, no network)', role: 'writes the second blind statement, from Bläser’s survey and the circuit tradition, without seeing the release’s or writer A’s (F1)' },
      { who: 'The statement reader, a separate Claude agent', role: 'lists every difference between the release’s Lean statement and the textbooks, each to be decided by a Lean test or left open by name (F4)' },
      { who: 'The bridge’s author, a Claude agent', role: 'proves each blind statement from the release’s theorems, in the release’s own environment (F2)' },
      { who: 'Reader 1, a Claude agent, and reader 2, GPT-6.2-astra', role: 'two independent readings of the lower-bound proof, each alone: the load-bearing steps in order, each step’s source, and every step neither the Lean nor a citation covers (P1)' },
      { who: 'The Phase 1 runner, a Claude agent', role: 'builds and checks the proof on rented machines, every step logged (Phase 1)' },
      { who: 'The provenance scout', role: 'where the upper bound comes from and how the release was received, every fact with its source (U)' },
      { who: 'The control room, Claude Opus 5.5 (Anthropic), for Carlos Toledo', role: 'wrote and sealed the pre-registration and its amendments, and writes the records this page reads' }],
    facts, scopes, phase4, phase5, exports,
    seals, amendments: amendments.map(({ id, day, approx, hm: h, title, body }) => ({ id, when: day + ' ' + (approx ? '~' : '') + h + ' UTC', title, correction: /-c$/.test(id) ? norm(body) : null })),
    progress: progress.filter((p) => !p.echo).map(({ file, line }) => ({ file, line })),
    sources: SOURCES.map((f) => ({ file: LANE_REL + '/' + f, sha256_12: sha(rd(f)).slice(0, 12) })),
    scripts: scripts.map((f) => ({ file: f, sha256_12: sha(fs.readFileSync(path.join(ROOT, f))).slice(0, 12) }))
  };
  const ledger = { what: 'The corrections ledger of the ω = 9/4 lane: every deviation from the pre-registration, read from corpus/omega-nine-fourths/DEVIATIONS.md, and every amendment, read from AMENDMENTS.md.',
    corrections, deviations: deviations.map(({ id, when, text }) => ({ id, when, text })), amendments: state.amendments };
  return { 'state.json': state, 'ledger.json': ledger };
}

/* FINAL (the verdict's report, built by the same builder with FINAL=1): only when every pre-registered row has a state
   that is neither running nor pending, and the lane has declared its verdict in VERDICT.md with its reason (a verdict
   other than CERTIFIED names the row it rests on, as the sealed rule says). The records are marked final and the
   certificate certs/omega-nine-fourths.json is written beside them, from the same state. */
const CERT_REL = 'certs/omega-nine-fourths.json';
function finalize(recs) {
  const S = recs['state.json'], L = recs['ledger.json'];
  const rows = S.phases.flatMap((p) => p.rows);
  const open = rows.filter((r) => r.state === 'running' || r.state === 'pending');
  need(!open.length, 'FINAL refused: ' + open.length + ' row(s) still running or pending (' + open.map((r) => r.id + ' ' + r.state).join(', ') + ')');
  need(S.verdict_declared, 'FINAL refused: the lane has not declared a verdict (corpus/omega-nine-fourths/VERDICT.md, first line "VERDICT: <word>")');
  need(S.verdict === 'CERTIFIED' || rows.some((r) => new RegExp('\\b' + r.id + '\\b').test(S.verdict_reason)), 'FINAL refused: a ' + S.verdict + ' verdict names the row it rests on, and VERDICT.md’s reason names none');
  S.final = true;
  const seal0 = S.seals.find((x) => x.id === 'SEAL-0');
  const cert = {
    what: 'The decision of OpenAI’s claim that the exponent of matrix multiplication is 9/4 over every field (github.com/openai/math at ' + S.target.commit + '), row by row, under the pre-registration corpus/omega-nine-fourths/PREREG.md; written by tools/omega-live-records.js --final from the lane’s files, the same records the page /omega/ is built from.',
    as_of: S.as_of, verdict: S.verdict, verdict_reason: S.verdict_reason, verdict_rule: S.verdict_rule,
    target: { repo: S.target.repo, commit: S.target.commit, committed_utc: S.target.committed, pinned: S.target.pinned },
    preregistration: { file: 'corpus/omega-nine-fourths/PREREG.md', sha256: sha(rd('PREREG.md')), seal: seal0.file, seal_sha256: seal0.file_sha256, stamped_utc: seal0.stamped_utc, ots_state: seal0.ots_state, bitcoin_block: seal0.bitcoin_block },
    rows: S.phases.filter((p) => p.phase <= 4).flatMap((p) => p.rows.map((r) => ({ id: r.id, phase: p.phase, title: r.title, state: r.state, note: r.note, evidence: r.evidence }))),
    gaps: S.gaps, facts_after_pin: S.facts, corrections: L.corrections, deviations: L.deviations, amendments: L.amendments.map((a) => ({ id: a.id, when: a.when, title: a.title })),
    seals: S.seals.map((x) => ({ id: x.id, file: x.file, sha256: x.file_sha256, ots_state: x.ots_state, bitcoin_block: x.bitcoin_block })),
    spent_usd: S.spent_usd, ceiling_usd: S.ceiling_usd, records: ['corpus/omega-live/state.json', 'corpus/omega-live/ledger.json']
  };
  /* Phase 4 (amendment A13), after the verdict, which it does not change: its own section, beside the fields above */
  if (S.phase4) cert.phase4 = Object.assign({ what: 'After the verdict, which it does not change (amendment A13): the corollaries the release does not state (gap G3), stated by us without seeing the release’s Lean, sealed before elaboration (A14), and proved from the release’s theorems.' }, S.phase4,
    { rows: S.phases.filter((p) => p.phase === 5).flatMap((p) => p.rows.map((r) => ({ id: r.id, phase: 5, title: r.title, state: r.state, note: r.note, evidence: r.evidence }))) });
  /* Phase 5 (amendments A15, A16), after the verdict as well, which it does not change: its own section beside Phase 4's */
  if (S.phase5) cert.phase5 = Object.assign({ what: 'After the verdict, which it does not change (amendments A15, A16): Corollary 1.3 for every format (border rank and asymptotic rank of T_{a,b,c}), and the paper’s α_F in its own circuit model with division gates (1/2 ≤ α_F ≤ 2/3, and α_F = 1/2), stated by us without seeing the release’s Lean, sealed before elaboration (A16), proved from the release’s theorems, and replayed on a clean machine.' }, S.phase5,
    { rows: S.phases.filter((p) => p.phase === 6).flatMap((p) => p.rows.map((r) => ({ id: r.id, phase: 6, title: r.title, state: r.state, note: r.note, evidence: r.evidence }))) });
  if (S.exports) cert.exports = S.exports;
  cert.pods = S.pods;
  return Object.assign({}, recs, { cert });
}

if (require.main !== module) { module.exports = { build }; return; }
const argv = process.argv.slice(2);
if (argv[0] === '--log') {
  const what = argv.slice(1).join(' ').trim();
  need(what, 'a log entry says what changed');
  const S = JSON.parse(fs.readFileSync(path.join(OUT, 'state.json'), 'utf8'));
  const f = path.join(OUT, 'page-log.json');
  const L = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { what: 'The public change log of /omega/: one dated entry per change of the page or of its state. The builder refuses when the newest entry’s state is not the records’.', entries: [] };
  /* the entry carries every row's state, so a later refresh that moved only the clock (the as-of minute, the money) needs
     no new entry, and one that moved any row does */
  L.entries.push(Object.assign({ at: new Date().toISOString().slice(0, 16) + 'Z', as_of: S.as_of, passed: S.counts.passed, running: S.counts.running, verdict: S.verdict,
    rows: S.phases.flatMap((p) => p.rows).map((r) => r.id + ':' + r.state).join(' '), what }, S.final ? { final: true } : {}));   /* a FINAL build needs an entry written for the final records */
  fs.writeFileSync(f, J(L));
  console.log('page-log.json: entry ' + L.entries.length + ' at ' + L.entries[L.entries.length - 1].at);
  process.exit(0);
}
const outPath = (f) => f === 'cert' ? path.join(ROOT, CERT_REL) : path.join(OUT, f);
if (argv.includes('--check')) {
  const p = path.join(OUT, 'state.json');
  need(fs.existsSync(p), 'no records to check: corpus/omega-live/state.json');
  const stored = JSON.parse(fs.readFileSync(p, 'utf8'));
  const was = Date.parse(stored.as_of);
  let recs = build(Math.min(Date.now(), was + 59999));
  if (stored.final) recs = finalize(recs);
  let bad = 0;
  for (const [f, o] of Object.entries(recs)) { const q = outPath(f); if (!fs.existsSync(q) || fs.readFileSync(q, 'utf8') !== J(o)) { console.error('  differs: ' + path.relative(ROOT, q)); bad++; } }
  if (bad) die(bad + ' record(s) differ from their sources at their own minute: rewrite them (node tools/omega-live-records.js)');
  console.log('corpus/omega-live: ' + Object.keys(recs).length + ' records re-derived at ' + new Date(was).toISOString().slice(0, 16) + 'Z, all equal');
  process.exit(0);
}
const recs = argv.includes('--final') ? finalize(build(Date.now())) : build(Date.now());
fs.mkdirSync(OUT, { recursive: true });
for (const [f, o] of Object.entries(recs)) fs.writeFileSync(outPath(f), J(o));
if (argv.includes('--final')) console.log('FINAL: the records are marked final and ' + CERT_REL + ' is written (add its row to tools/certs-shelf.js, which refuses an undescribed certificate)');
const S = recs['state.json'];
console.log('corpus/omega-live written: ' + S.counts.all + ' rows (' + S.counts.passed + ' passed, ' + S.counts.running + ' running, ' + S.counts.pending + ' pending'
  + (S.counts.read ? ', ' + S.counts.read + ' read' : '') + '), ' + S.seals.length + ' seals (' + S.seals.map((s) => s.id + ' ' + (s.bitcoin_block ? 'block ' + s.bitcoin_block : s.ots_state)).join(', ') + '), '
  + recs['ledger.json'].deviations.length + ' deviation(s), ' + recs['ledger.json'].amendments.length + ' amendment(s), US$' + S.spent_usd.toFixed(2) + ' spent, as of ' + S.as_of);
