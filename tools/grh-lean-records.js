#!/usr/bin/env node
/* grh-lean-records.js — the records of /grh-lean/ (corpus/grh-lean-live/), each written from the lane's own files.

   The page /grh-lean/ is the live page of the grh-lean lane: an independent, pre-registered check of
   github.com/lsernau/grh-lean at commit 72fead10, a Lean 4 formalization of the Riemann Hypothesis and of GRH for
   Dirichlet L-functions ("Levent Alpöge's, with Claude", its README) in two editions. Its builder
   (tools/build-grh-lean-live.js) reads only corpus/grh-lean-live/. This file writes those records from the lane's files
   in corpus/grh-lean-check/ (it never writes there: the control room and the recorder do) and refuses when a source no
   longer says what a record states:
     record.json        the ONLY source of a row's verdict. It must re-derive from the pulled runs
                        (python3 -I tools/check-grh-lean.py --check, run here), so a pull without --write is refused
     PREREG.md          the target, the five theorems, the pinned files, the authors' claims, every row id, the verdict
                        rule and the facts the gaps rest on, each read as a needle
     AMENDMENTS.md      the amendments A1, A2, … (headings), the ceiling (A1), the deadline (A4), the AF_UNIX words (A3)
     PROGRESS.md        one event per "- YYYY-MM-DD HH:MM — text" paragraph; the pod's price and creation time
     runs/<run>/        the pod's _phase.log (every step's start and exit), and the tools' own lines each gap and row
                        note quotes (needles), D1-<edition>.out (the census, every count recomputed here)
     SEAL-*.sha256, *.ots   every file a seal lists must still hash to the sealed value (AMENDMENTS.md, append-only, must
                        still BEGIN with the sealed bytes); one file changed after its seal is allowed only as the lane
                        records it (the runner, see RUNNER below), and each .ots must stamp its own file's sha256
     certs/alpoge-grh-lean.json, corpus/alpoge-grh/   the earlier lane's stop of the same judge, for the comparison
   A time is never ahead of the clock; the money is the pod's price times the time since it was created, at the records'
   minute, rounded down.

   THE D1 RULE (one definition, here; the page prints it from d1.json). The census (instruments/grh-lean/census/
   Unused.lean) lists every release constant outside the closure of the five theorems and marks it `aux` (a name
   component starting with `_`, constructors, recursors, and the usual generated suffixes) or `decl`. This file splits
   the `decl` rows by the LAST components of the name, and nothing else:
     G1 `…congr_simp`             a congruence lemma Lean's simp makes for a function on demand
     G2 `…hcongr_<n>`             a heterogeneous congruence lemma Lean makes
     G3 `…match_<n>.congr_eq_<n>` an equation lemma Lean makes for a `match`
     G4 `…ctorElim`, `…ctorElimType`   the eliminators Lean makes for an inductive type
     G5 `T.c.elim`                when `T.ctorElim` is also in the census: the per-constructor eliminator Lean makes
     G6 `…brecOn.<x>`             the helpers of structural recursion
     I  an instance name of Lean's automatic form: its last component `inst` followed by a capital letter (written by a
        person as `instance : …` with no name, or named that way by hand; the name alone cannot tell)
     W  every other `decl` row: a declaration written in the release's files
   What the names cannot tell is said with the counts: a lemma an attribute writes (`@[simps]`, `@[ext]`) and a structure's
   field projection are counted W.

   usage: node tools/grh-lean-records.js            write state.json, d1.json and d1-<edition>.tsv
          node tools/grh-lean-records.js --check    recompute them at their own minute and refuse on any difference
          node tools/grh-lean-records.js --log "what changed"   append a dated entry to page-log.json with the state  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const LANE_REL = 'corpus/grh-lean-check';
const LANE = path.join(ROOT, LANE_REL);
const OUT_REL = 'corpus/grh-lean-live';
const OUT = path.join(ROOT, OUT_REL);
const die = (m) => { console.error('GRH-LEAN RECORDS REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const abs = (rel) => path.join(ROOT, rel);
const has = (rel) => fs.existsSync(abs(rel));
const rd = (rel) => { need(has(rel), 'a source is gone: ' + rel); return fs.readFileSync(abs(rel)); };
const txt = (rel) => rd(rel).toString('utf8');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const J = (o) => JSON.stringify(o, null, 1) + '\n';
const N3 = (n) => Number(n).toLocaleString('en-US');
const L = (f) => LANE_REL + '/' + f;
/* a needle: the source must still say it, word for word (whitespace folded) */
const says = (rel, needle, why) => { need(norm(txt(rel)).includes(norm(needle)), rel + ' no longer says "' + needle + '"' + (why ? ' (' + why + ')' : '')); return needle; };

const THEOREMS = ['riemannHypothesis', 'riemannZeta_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re', 'LFunction_eq_zero_re', 'LFunction_eq_zero_re_of_isPrimitive'];
const AXIOMS = ['propext', 'Classical.choice', 'Quot.sound'];
/* the rows, in the pre-registration's order, each with its title in plain words and the pod steps it is read from
   (for "running since"); the pre-registration's own wording of each is one click down, in PREREG.md */
const ROWS = [
  ['I1', 'Integrity: every file of the release at the pinned commit hashed into one list before anything was built', ['I1']],
  ['B1', 'The readable edition builds from source', ['B1']],
  ['B2', 'The compact edition builds from source', ['B2']],
  ['A1', 'Axioms: each of the five theorems, in both editions, rests only on propext, Classical.choice and Quot.sound', ['A1-grh', 'A1-compact']],
  ['S1', 'The judge, Comparator, in its sandbox, against our own statement file, written from Mathlib alone', ['S1']],
  ['S2', 'The same judge against the release’s own statement file', ['S2-install', 'S2']],
  ['K1', 'nanoda, a kernel written apart from Lean’s, on the exported proofs', ['EXP', 'K1']],
  ['K2', 'con-leche, a third kernel, on the export, with the five theorems matched against our statement file', ['K2V', 'K2X', 'K2C']],
  ['KR', 'Lean’s own checker, replaying the proof from scratch', ['KR']],
  ['C1-C3', 'Three planted errors, each to be refused: an added axiom, a proof replaced by sorry, and 1/2 changed to 1/3 in a statement', ['CTLB', 'C1X', 'C1K', 'C1KC', 'C1S', 'C2X', 'C2K', 'C2KC', 'C2S', 'C3X', 'C3K', 'C3S']],
  ['E1', 'The compact edition through the same judge, against our statement file', ['E1']],
  ['CHAR', 'The textbook bridge: ζ and L defined by their Dirichlet series and holomorphy on ℂ ∖ {1}, without Mathlib’s definitions, proved equivalent to the statements', []],
  ['D1', 'The declarations the five theorems never use (a list, not a verdict)', ['D1-grh', 'D1-compact']],
].map(([id, title, steps]) => ({ id, title, steps }));
/* the recorder's words: a verdict, or PENDING (a state), or COMPUTED (a list), or null (an output that could not be read) */
const VERDICTS = ['CERTIFIED', 'REFUSED', 'OPEN', 'PENDING', 'COMPUTED', null];
/* RUNNER: the one file a seal lists that the lane changed after the seal, before the run that stands. Allowed only while
   PROGRESS.md records both starts with their audit commits and the pod's log names the script the run used, and that
   script is the file at the run's audit commit */
const RUNNER = 'tools/runpod-grh-lean.sh';

/* an .ots file: the digest it stamps (sha256 op 0x08 after the 31-byte magic and the version byte), and its attestations
   (the parser of tools/omega-live-records.js) */
function ots(buf) {
  const MAGIC = Buffer.from('004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294', 'hex');
  need(buf.subarray(0, 31).equals(MAGIC) && buf[32] === 0x08, 'an .ots file is not an OpenTimestamps sha256 proof');
  const digest = buf.subarray(33, 65).toString('hex');
  const BTC = Buffer.from('0588960d73d71901', 'hex'), PEND = Buffer.from('83dfe30d2ef90c8e', 'hex');
  const blocks = [];
  let i = buf.indexOf(BTC);
  while (i >= 0) {
    let j = i + 8, s = 0, b;
    do { b = buf[j++]; s += 7; } while (b & 0x80);
    let h = 0; s = 0;
    do { b = buf[j++]; h += (b & 0x7f) * 2 ** s; s += 7; } while (b & 0x80);
    blocks.push(h);
    i = buf.indexOf(BTC, i + 8);
  }
  return { digest, state: blocks.length ? 'bitcoin' : buf.indexOf(PEND) >= 0 ? 'pending' : 'unknown', block: blocks.length ? Math.min(...blocks) : null };
}
/* the length of the head of `buf` (ending at a newline, or the whole) whose sha256 is `h`, else 0 */
function headHashing(buf, h) {
  if (sha(buf) === h) return buf.length;
  for (let i = buf.indexOf(10); i >= 0; i = buf.indexOf(10, i + 1)) if (sha(buf.subarray(0, i + 1)) === h) return i + 1;
  return 0;
}

/* ------------------------------------------------------------ D1: the census, recomputed and classified */
function d1Edition(run, edition) {
  const rel = 'runs/' + run + '/D1-' + edition + '.out';
  const o = txt(L(rel));
  const lines = o.split('\n').filter((l) => l.startsWith('D1\t')).map((l) => l.split('\t'));
  need(lines.every((l) => l.length === 5), rel + ': a census line is not of five fields');
  const m = /^D1SUM (.*)$/m.exec(o);
  need(m, rel + ': no D1SUM line');
  const sum = Object.fromEntries(m[1].split(' ').map((kv) => kv.split('=')).map(([k, v]) => [k, Number(v)]));
  /* every count the summary states, recomputed from the lines */
  const dec = lines.filter((l) => l[2] === 'decl'), aux = lines.filter((l) => l[2] === 'aux');
  need(dec.length + aux.length === lines.length, rel + ': a census line is neither decl nor aux');
  need(sum.release_outside === lines.length && sum.outside_decl === dec.length && sum.outside_aux === aux.length
    && sum.outside_modules === new Set(lines.map((l) => l[3])).size && sum.release_in_closure + sum.release_outside === sum.release_constants,
  rel + ': the D1SUM line does not count its own lines (outside ' + lines.length + ', decl ' + dec.length + ', aux ' + aux.length + ')');
  const names = new Set(lines.map((l) => l[4]));
  const RULES = [
    ['G1', 'generated', 'a congruence lemma Lean’s simp makes for a function (name ends .congr_simp)', (p) => p[p.length - 1] === 'congr_simp'],
    ['G2', 'generated', 'a heterogeneous congruence lemma Lean makes (name ends .hcongr_<n>)', (p) => /^hcongr_\d+$/.test(p[p.length - 1])],
    ['G3', 'generated', 'an equation lemma Lean makes for a match (name ends .match_<n>.congr_eq_<n>)', (p) => /^congr_eq_\d+$/.test(p[p.length - 1]) && p.length > 1 && /^match_\d+(_\d+)?$/.test(p[p.length - 2])],
    ['G4', 'generated', 'an eliminator Lean makes for an inductive type (name ends .ctorElim or .ctorElimType)', (p) => ['ctorElim', 'ctorElimType'].includes(p[p.length - 1])],
    ['G5', 'generated', 'a per-constructor eliminator Lean makes (T.c.elim, with T.ctorElim in the census)', (p) => p[p.length - 1] === 'elim' && p.length >= 3 && names.has(p.slice(0, -2).concat('ctorElim').join('.'))],
    ['G6', 'generated', 'a helper of structural recursion (name ends .brecOn.<x>)', (p) => p.length >= 2 && p[p.length - 2] === 'brecOn'],
    ['I', 'instance', 'an instance name of Lean’s automatic form (last component inst followed by a capital letter)', (p) => /^inst[A-Z]/.test(p[p.length - 1])],
  ];
  /* a Lean name splits at its dots; none of the release's names in this census quotes a dot inside «…» */
  need(!dec.some((l) => /[«»]/.test(l[4])), rel + ': a name with «…» quoting: the rule splits names at dots and cannot read it');
  const rows = dec.map((l) => {
    const p = l[4].split('.');
    const r = RULES.find((x) => x[3](p));
    return { rule: r ? r[0] : 'W', cls: r ? r[1] : 'written', kind: l[1], module: l[3], file: 'src/' + l[3].replace(/\./g, '/') + '.lean', name: l[4] };
  });
  const by = (k) => rows.filter((r) => r.rule === k).length;
  const rules = RULES.map(([id, cls, words]) => ({ id, class: cls, words, count: by(id) })).concat([{ id: 'W', class: 'written', words: 'every other decl row: a declaration written in the release’s files', count: by('W') }]);
  need(rules.reduce((a, r) => a + r.count, 0) === dec.length, rel + ': the rule does not split every decl row');
  const W = rows.filter((r) => r.rule === 'W');
  const files = {};
  for (const r of W) (files[r.file] = files[r.file] || []).push({ kind: r.kind, name: r.name });
  const areas = {};
  for (const r of W) { const a = r.module.split('.').slice(0, 2).join('.'); areas[a] = (areas[a] || 0) + 1; }
  return {
    edition, source: L(rel), source_sha256: sha(rd(L(rel))), summary: sum,
    rules, written: W.length, written_kinds: { theorem: W.filter((r) => r.kind === 'theorem').length, def: W.filter((r) => r.kind === 'def').length, other: W.filter((r) => !['theorem', 'def'].includes(r.kind)).length },
    written_files: Object.keys(files).length,
    areas: Object.entries(areas).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([area, n]) => ({ area, n })),
    by_file: Object.keys(files).sort().map((f) => ({ file: f, names: files[f] })),
    tsv: 'rule\tclass\tkind\tmodule\tfile\tname\n' + rows.map((r) => [r.rule, r.cls, r.kind, r.module, r.file, r.name].join('\t')).join('\n') + '\n'
  };
}

function build(clock) {
  const asOf = Math.floor(clock / 60000) * 60000;
  const times = [];
  const at = (label, ms) => { need(Number.isFinite(ms), label + ': not a time'); times.push([label, ms]); return ms; };

  /* ------------------------------------------------------------ the record: re-derives, or nothing is written */
  const chk = cp.spawnSync('python3', ['-I', path.join(ROOT, 'tools', 'check-grh-lean.py'), '--check'], { cwd: ROOT, encoding: 'utf8' });
  need(chk.status === 0, 'corpus/grh-lean-check/record.json does not re-derive from the pulled runs (python3 -I tools/check-grh-lean.py --check: ' + norm((chk.stdout || '') + (chk.stderr || '')).slice(0, 200) + '); run it with --write first');
  const REC = JSON.parse(txt(L('record.json')));
  const RUN = REC.run;
  need(/^[a-z0-9]{10,20}$/.test(RUN || '') && has(L('runs/' + RUN + '/_phase.log')), 'record.json names no pulled run with a _phase.log');
  const R = (f) => L('runs/' + RUN + '/' + f);
  const recRow = (id) => { const r = REC.rows.find((x) => x.id === id); need(r, 'record.json has no row ' + id); return r; };
  need(REC.rows.length === ROWS.length && ROWS.every((r) => REC.rows.some((x) => x.id === r.id)), 'record.json’s rows are not this file’s ' + ROWS.map((r) => r.id).join(', '));
  for (const r of REC.rows.concat([REC.claim])) need(VERDICTS.includes(r.verdict), 'record.json: row ' + r.id + ' has a verdict this page cannot say: ' + r.verdict);
  need(!REC.rows.concat([REC.claim]).some((r) => r.verdict === 'REFUTED'), 'record.json says REFUTED, which its recorder never writes');

  /* ------------------------------------------------------------ the pre-registration */
  const P = 'PREREG.md';
  const PRE = norm(txt(L(P)));
  const commit = (/github\.com\/lsernau\/grh-lean at commit ([0-9a-f]{40})/.exec(PRE) || die('PREREG.md names no commit of lsernau/grh-lean'))[1];
  need(commit === REC.target.commit, 'PREREG.md and record.json name different commits');
  const committed = (/\((\d{4}-\d\d-\d\d \d\d:\d\d:\d\d) UTC, "Lean proof of GRH"\)/.exec(PRE) || die('PREREG.md no longer dates the commit'))[1];
  says(L(P), '"Levent Alpöge\'s, with Claude"', 'the credit');
  for (const t of THEOREMS) says(L(P), '`' + t + '`', 'the five theorems');
  const editions = { readable: (/`grh\/` \(readable, ~([\d,]+) lines\)/.exec(PRE) || die('PREREG.md no longer sizes the readable edition'))[1], compact: (/`grh-compact\/` \(~([\d,]+) lines\)/.exec(PRE) || die('PREREG.md no longer sizes the compact edition'))[1] };
  const pinned = [...txt(L(P)).matchAll(/^\| `([^`]+)`(?: \(([^)]*)\))? \| ([0-9a-f]{64}) \|$/gm)].map((m) => ({ file: m[1], about: m[2] || '', sha256: m[3] }));
  need(pinned.length === 3 && pinned[0].file === 'src/Statements.lean', 'PREREG.md no longer pins Statements.lean, Challenge.lean and comparator.json');
  const statements = pinned[0].sha256;
  need(txt('corpus/alpoge-grh/PINS.json').includes(statements), 'Statements.lean’s pinned sha256 is not the one the earlier lane pinned (corpus/alpoge-grh/PINS.json): the fidelity reading cannot be carried');
  const claims = {
    sandbox: says(L(P), 'Comparator v4.35.0 accepted the proofs "with a stand-in for its sandbox and `ulimit -s unlimited`" (64 GB, a few hours)'),
    unused: says(L(P), '"several hundred of the more than 20,000 declarations are not used by the five theorems"'),
    kernels: says(L(P), 'an export of the closure is accepted by nanoda, con-leche and con-ron')
  };
  /* every row id stands in the rows table (B1, B2 and C1–C3 share a line there) */
  const table = [...txt(L(P)).matchAll(/^\| ([A-Z][A-Z0-9, –-]*?) \|/gm)].map((m) => m[1]).join(' ');
  for (const r of ROWS) for (const id of r.id === 'C1-C3' ? ['C1–C3'] : [r.id]) need(new RegExp('(^|[ ,])' + id + '([ ,]|$)').test(table), 'row ' + id + ' does not stand in PREREG.md’s rows table');
  const ruleI = PRE.indexOf('**Verdict rule.**'), ruleJ = PRE.indexOf('## Machines and money');
  need(ruleI > 0 && ruleJ > ruleI, 'PREREG.md has no verdict rule before "Machines and money"');
  const verdict_rule = PRE.slice(ruleI + '**Verdict rule.**'.length, ruleJ).trim();
  for (const n of ['is CERTIFIED when B1, A1, S1, K1, K2 and KR pass and C1–C3 are refused', 'no person reads the proof', 'because `Statements.lean` is byte-identical']) need(verdict_rule.includes(n), 'the verdict rule no longer says: ' + n);
  const sealedAt = (/on (\d{4}-\d\d-\d\d) at about (\d\d:\d\d) UTC, before any build/.exec(PRE) || die('PREREG.md no longer says when it was written'));
  const machine = (/One build\/check machine, (cpu3m 16 vCPU \/ 128 GB) \(catalog price US\$([\d.]+)\/h/.exec(PRE) || die('PREREG.md no longer names its machine'));

  /* ------------------------------------------------------------ the amendments */
  const AMT = txt(L('AMENDMENTS.md'));
  const amendments = [...AMT.matchAll(/^## (A\d+) \((\d{4}-\d\d-\d\d) (\d\d:\d[\dx]) UTC, ([^)]*)\) — (.+)$/gm)].map((m) => ({ id: m[1], when: m[2] + ' ' + m[3] + ' UTC', note: m[4], title: m[5].trim() }));
  need(amendments.length >= 4 && (AMT.match(/^## /gm) || []).length === amendments.length && amendments.every((a, i) => a.id === 'A' + (i + 1)), 'an AMENDMENTS.md heading is not "## An (YYYY-MM-DD HH:MM UTC, …) — title", in order');
  for (const a of amendments) if (/\d\d:\d\d UTC$/.test(a.when)) at('amendment ' + a.id, Date.parse(a.when.replace(' UTC', 'Z').replace(' ', 'T')));
  const ceiling_usd = Number((/Ceiling US\$(\d+) for this lane/.exec(AMT) || die('amendment A1 states no ceiling'))[1]);
  const deadline = (/this lane's DEADLINE is (\d{4}-\d\d-\d\d \d\d:\d\d) UTC/.exec(norm(AMT)) || die('amendment A4 states no deadline'))[1];
  const afunix = says(L('AMENDMENTS.md'), 'Comparator\'s systemd AF_UNIX guard cannot run in a container');
  says(L('AMENDMENTS.md'), 'S2 last and dropped first');

  /* ------------------------------------------------------------ the progress lines */
  const PRG = txt(L('PROGRESS.md'));
  const progress = [];
  for (const l of PRG.split('\n')) {
    const m = /^- (\d{4}-\d\d-\d\d) (\d\d:\d\d) — (.*)$/.exec(l);
    if (m) { progress.push({ t: at('PROGRESS.md ' + m[1] + ' ' + m[2], Date.parse(m[1] + 'T' + m[2] + ':00Z')), at: m[1] + 'T' + m[2] + 'Z', text: m[3] }); continue; }
    if (/^\s+\S/.test(l) && progress.length) { progress[progress.length - 1].text += ' ' + l.trim(); continue; }
    need(!/^- \d/.test(l), 'PROGRESS.md: a line the records cannot read: ' + l.slice(0, 60));
  }
  need(progress.length >= 3, 'PROGRESS.md holds fewer than three events');
  progress.forEach((p, i) => need(i === 0 || p.t >= progress[i - 1].t, 'PROGRESS.md is not in time order at ' + p.at));
  const PGN = norm(PRG);
  /* the pod: "pod <id> (<name>, <machine>, disk …, US$<x>/h, <region>, created HH:MM:SS UTC, …)" on the line of its day */
  const podLine = progress.find((p) => /pod ([a-z0-9]{10,20}) \(/.test(p.text) && /created \d\d:\d\d:\d\d UTC/.test(p.text));
  need(podLine, 'PROGRESS.md names no pod with its price and creation time');
  const pm = /pod ([a-z0-9]{10,20}) \(([^,]+), ([^,]+), disk ([^,]+), US\$([\d.]+)\/h, ([^,]+), created (\d\d:\d\d:\d\d) UTC/.exec(podLine.text) || die('PROGRESS.md: the pod line is not "pod <id> (<name>, <machine>, disk …, US$x/h, <region>, created HH:MM:SS UTC"');
  need(pm[1] === RUN, 'the pod PROGRESS.md names is not the run record.json reads');
  const pod = { id: pm[1], name: pm[2], machine: pm[3], disk: pm[4], usd_per_h: Number(pm[5]), region: pm[6], created_utc: podLine.at.slice(0, 10) + 'T' + pm[7] + 'Z' };
  need(pod.usd_per_h === Number(machine[2]) && pod.machine === machine[1], 'the pod is not the machine and price PREREG.md registered');
  const created = at('pod created', Date.parse(pod.created_utc));
  const endM = new RegExp('(\\d{4}-\\d\\d-\\d\\d)[ T](\\d\\d:\\d\\d)[^.]{0,80}\\b' + RUN + '\\b[^.]{0,80}\\b(?:deleted|terminated)\\b').exec(progress.map((p) => p.at.slice(0, 10) + ' ' + p.at.slice(11, 16) + ' ' + p.text).join('\n'));
  pod.deleted_utc = endM ? endM[1] + 'T' + endM[2] + ':00Z' : null;
  const end = Math.min(asOf, pod.deleted_utc ? at('pod deleted', Date.parse(pod.deleted_utc)) : Infinity);
  const spent_usd = Math.floor(Math.max(0, end - created) / 3600000 * pod.usd_per_h * 100) / 100;
  need(spent_usd <= ceiling_usd, 'spent US$' + spent_usd + ' is above the lane’s ceiling of US$' + ceiling_usd);
  /* the attempt that ran nothing, and the runner changed after its seal (RUNNER) */
  says(L('PROGRESS.md'), 'First start (audit 8d96a4ff) ended at setup, exit 127');
  const attempt0 = says(L('PROGRESS.md'), 'ended at setup, exit 127: the image has no /usr/bin/time; nothing ran');
  const restart = (/Restarted (\d\d:\d\d:\d\d) UTC with the fix \(audit ([0-9a-f]{8})\)/.exec(PGN) || die('PROGRESS.md no longer records the restart with its audit commit'));
  need(REC.tools.audit_commit && REC.tools.audit_commit.startsWith(restart[2]), 'the run’s audit commit (record.json) is not the restart’s in PROGRESS.md');
  /* CHAR ran on another lane's pod (amendment A2), paid by that lane */
  const charPod = (/On pod ([a-z0-9]{10,20}) \(amendment A2\)/.exec(PGN) || die('PROGRESS.md no longer names the pod CHAR ran on'))[1];
  says(L('AMENDMENTS.md'), 'US$0.96/h, paid by that lane');

  /* ------------------------------------------------------------ the pod's log: every step */
  const PH = txt(R('_phase.log'));
  const steps = {};
  const invocations = [];
  for (const l of PH.split('\n').filter(Boolean)) {
    const m = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ) (.*)$/.exec(l);
    need(m, R('_phase.log') + ': a line the records cannot read: ' + l.slice(0, 60));
    const t = at('_phase.log ' + m[1], Date.parse(m[1]));
    let q;
    if ((q = /^(\S+) running \(timeout (\d+) s\)$/.exec(m[2]))) steps[q[1]] = { step: q[1], start_utc: m[1], timeout_s: Number(q[2]) };
    else if ((q = /^(\S+) exit (\d+) after (\d+) s$/.exec(m[2]))) { need(steps[q[1]], '_phase.log: ' + q[1] + ' exits before it runs'); Object.assign(steps[q[1]], { end_utc: m[1], exit: Number(q[2]), seconds: Number(q[3]) }); need(Math.abs((t - Date.parse(steps[q[1]].start_utc)) / 1000 - Number(q[3])) <= 1, '_phase.log: ' + q[1] + '’s seconds are not its start to its exit'); }
    else if ((q = /^invoked: (\S+) \(pid \d+; audit ([0-9a-f]{40}); deadline (\d+); script ([0-9a-f]{16})\)$/.exec(m[2]))) invocations.push({ at_utc: m[1], what: q[1], audit: q[2], deadline: Number(q[3]), script16: q[4] });
    else if (/^invocation done: /.test(m[2])) continue;
    else die(R('_phase.log') + ': a line the records cannot read: ' + l.slice(0, 80));
  }
  need(invocations.length >= 1 && invocations.every((v) => v.audit === REC.tools.audit_commit), 'an invocation in _phase.log ran another audit commit than record.json’s');
  need(new Date(invocations[0].deadline * 1000).toISOString().slice(0, 16).replace('T', ' ') === deadline, 'the pod’s deadline is not amendment A4’s');
  const stepList = Object.values(steps).sort((a, b) => a.start_utc < b.start_utc ? -1 : a.start_utc > b.start_utc ? 1 : 0);

  /* ------------------------------------------------------------ the seals */
  const audit = REC.tools.audit_commit;
  const gitShow = (p) => { const r = cp.spawnSync('git', ['-C', ROOT, 'show', audit + ':' + p], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 }); return r.status === 0 ? r.stdout : null; };
  const runnerAtAudit = gitShow(RUNNER);
  need(runnerAtAudit, RUNNER + ' is not in the run’s audit commit');
  need(invocations.every((v) => sha(runnerAtAudit).startsWith(v.script16)), 'the script the pod ran (its _phase.log) is not ' + RUNNER + ' at the run’s audit commit');
  const stamp = (f) => {
    const o = ots(rd(L(f + '.ots')));
    need(o.state !== 'unknown', f + '.ots holds no attestation');
    const head = headHashing(rd(L(f)), o.digest);
    need(head > 0, f + '.ots does not stamp ' + f + ' nor a head of it');
    return { file: L(f), ots: L(f + '.ots'), stamps_bytes: head, whole: head === rd(L(f)).length, ots_state: o.state, bitcoin_block: o.block };
  };
  const seals = [Object.assign({ id: 'PREREG', what: 'the pre-registration' }, stamp('PREREG.md')), Object.assign({ id: 'AMENDMENTS', what: 'the amendments as they stood when this proof was made (A1)' }, stamp('AMENDMENTS.md'))];
  need(seals[0].whole, 'PREREG.md.ots does not stamp PREREG.md as it stands');
  const runner = { file: RUNNER, sealed_sha256: null, run_sha256: sha(runnerAtAudit), now_sha256: sha(rd(RUNNER)), audit_commit: audit, attempt0, restart_utc: podLine.at.slice(0, 10) + 'T' + restart[1] + 'Z' };
  for (const f of fs.readdirSync(LANE).filter((x) => /^SEAL-A\d+\.sha256$/.test(x)).sort((a, b) => Number(/\d+/.exec(a)[0]) - Number(/\d+/.exec(b)[0]))) {
    const id = f.slice(5, -7);
    need(amendments.some((a) => a.id === id), f + ' seals an amendment AMENDMENTS.md does not have');
    const s = Object.assign({ id: 'SEAL-' + id, what: 'amendment ' + id + ': ' + amendments.find((a) => a.id === id).title }, stamp(f));
    need(s.whole, f + '.ots does not stamp ' + f);
    s.files = [];
    for (const l of txt(L(f)).trim().split('\n')) {
      const m = /^([0-9a-f]{64})\s+(.+)$/.exec(l.trim());
      need(m, f + ': a line is not "sha256  path"');
      const rel = path.normalize(path.join(LANE_REL, m[2]));
      const now = rd(rel);
      let state = sha(now) === m[1] ? 'unchanged' : null;
      if (!state && rel === L('AMENDMENTS.md')) state = headHashing(now, m[1]) ? 'appended to' : null;
      if (!state && rel === RUNNER) { runner.sealed_sha256 = m[1]; runner.sealed_by = 'SEAL-' + id; state = 'changed after the seal, before the run (recorded)'; }
      need(state, f + ': ' + rel + ' no longer hashes to its sealed value');
      s.files.push({ file: rel, sha256: m[1], state });
    }
    seals.push(s);
  }
  need(runner.sealed_sha256 && runner.sealed_sha256 !== runner.run_sha256 && runner.now_sha256 === runner.run_sha256, 'the runner’s seal and run are not as the records state (sealed, then changed once more before the run, unchanged since)');
  need(seals.find((s) => s.id === 'SEAL-A3') && seals.find((s) => s.id === 'SEAL-A3').files.some((x) => x.file === 'tools/check-grh-lean.py' && x.state === 'unchanged'), 'the recorder is not the one amendment A3 sealed');

  /* ------------------------------------------------------------ the rows: verdicts from record.json only */
  const fmtMin = (s) => s >= 5400 ? (Math.round(s / 360) / 10) + ' h' : Math.round(s / 60) + ' min';
  const rows = ROWS.map((r) => {
    const x = recRow(r.id);
    const run = r.steps.map((s) => steps[s]).filter((s) => s && s.end_utc === undefined);
    const st = { verdict: x.verdict, state: x.state || (x.verdict === null ? 'unreadable' : 'done') };
    if (x.verdict === 'PENDING') st.state = run.length ? 'running' : 'not started';
    let note = '';
    if (x.verdict === 'CERTIFIED' || x.verdict === 'COMPUTED') {
      if (r.id === 'I1') note = 'The clone at the pinned commit hashed to one list of ' + N3(REC.target.files) + ' files before any build; every registered pin matched.';
      if (r.id === 'B1' || r.id === 'B2') note = '`lake build` exited 0 after ' + fmtMin(x.seconds) + ': all ' + N3(x.built_release_modules) + ' modules of the release compiled on our machine, none brought in pre-built, no `sorry`.';
      if (r.id === 'A1') note = 'Each of the five theorems, in both editions, depends on [propext, Classical.choice, Quot.sound] and nothing else (`#print axioms`).';
      if (r.id === 'S1') note = 'Accepted after ' + fmtMin(x.seconds) + ', peak memory ' + x.peak_rss_gb + ' GiB: “' + says(R('S1.out'), 'Lean default kernel accepts the solution') + '”, “' + says(R('S1.out'), 'Your solution is okay!') + '”.';
      if (r.id === 'S2' || r.id === 'E1') note = 'Accepted after ' + fmtMin(x.seconds) + '.';
      if (r.id === 'K1') note = 'nanoda checked ' + N3(x.declarations) + ' declarations of the exported closure of the five theorems in ' + fmtMin(x.seconds) + ' with no typechecker error.';
      if (r.id === 'K2') note = 'con-leche accepted the ' + N3(x.declarations) + ' declarations of the export, and found each of the five theorems “' + says(R('K2C.out'), 'justified by the solution') + '” against our statement file.';
      if (r.id === 'KR') note = '`leanchecker --fresh Main` exited 0 after ' + fmtMin(x.seconds) + ', peak memory ' + x.peak_rss_gb + ' GiB.';
      if (r.id === 'C1-C3') note = 'Every planted error was refused by every check it went through; each refusal is quoted below.';
      if (r.id === 'CHAR') note = 'Re-run at the release’s Lean and Mathlib with our four files unchanged: the eight theorems of the bridge compile and depend on the three standard axioms only. It ran on another lane’s machine (amendment A2).';
      if (r.id === 'D1') note = 'The census is in for both editions; its counts are below.';
    } else if (x.verdict === 'PENDING') {
      note = run.length ? 'Running on the pod since ' + run[0].start_utc.slice(11, 16) + ' UTC.' : 'Not run yet.';
      if (r.id === 'A1') { for (const t of THEOREMS) says(R('A1-grh.out'), "'" + t + "' depends on axioms: [propext, Classical.choice, Quot.sound]", 'A1, the readable edition'); need(!/sorryAx/.test(txt(R('A1-grh.out'))), 'A1-grh.out names sorryAx'); }
      if (r.id === 'A1') note = 'The readable edition passed: each of the five theorems depends on [propext, Classical.choice, Quot.sound] only. The compact edition: ' + (run.length ? 'running since ' + run[0].start_utc.slice(11, 16) + ' UTC.' : 'not run yet (after its build).');
      if (r.id === 'D1' && x.editions && x.editions.grh && x.editions.grh.state === 'done') note = 'The readable edition’s census is in (below). The compact edition: ' + (run.length ? 'running since ' + run[0].start_utc.slice(11, 16) + ' UTC.' : steps.B2 && steps.B2.exit === 0 ? 'not run yet (in the runner’s order it comes after E1).' : 'not run yet (after its build).');
      if (r.id === 'S2') note += (run.length ? '' : ' By amendment A3 it runs last, and it is the row dropped if the ceiling comes near.');
    } else if (x.verdict === 'REFUSED') note = 'Refused: ' + x.why + '.';
    else if (x.verdict === null) note = 'No verdict: the output could not be read (' + x.why + ').';
    return { id: r.id, title: r.title, verdict: x.verdict, state: st.state, note, why: x.why, steps: r.steps };
  });
  /* the controls: what each planted, and each refusal in the tool's own words */
  const c = recRow('C1-C3').controls || {};
  const ref = (step, needle) => { const st = c[step.slice(0, 2)] && c[step.slice(0, 2)][step]; return st && st.refused ? { step, exit: st.exit, line: says(R(step + '.err'), needle) } : null; };
  says('instruments/grh-lean/controls/GrhC1.lean', 'theorem LFunction_eq_zero_re_of_isPrimitive : PrimitiveDirichletLZerosOnLine := CertMachine.plantedAxiomC1', 'control C1');
  const controls = [
    { id: 'C1', planted: 'the fifth theorem, `LFunction_eq_zero_re_of_isPrimitive`, proved from an added axiom (`CertMachine.plantedAxiomC1`)', refusals: [ref('C1S', 'Illegal axiom detected: \'CertMachine.plantedAxiomC1\''), ref('C1K', 'not implemented yet: non-standard axiom (CertMachine.plantedAxiomC1)'), ref('C1KC', 'not implemented yet: non-standard axiom (CertMachine.plantedAxiomC1)')] },
    { id: 'C2', planted: 'the proof of `LFunction_ne_zero_of_half_lt_re` replaced by `sorry`', refusals: [ref('C2S', 'Illegal axiom detected: \'sorryAx\''), ref('C2K', 'use of the sorryAx axiom in value of LFunction_ne_zero_of_half_lt_re'), ref('C2KC', 'use of the sorryAx axiom in value of LFunction_ne_zero_of_half_lt_re')] },
    { id: 'C3', planted: '1/2 changed to 1/3 in our statement file’s `DirichletLZerosOnLine`', refusals: [ref('C3S', 'Const does not match between challenge and target \'DirichletLZerosOnLine\''), ref('C3K', 'is not justified by the solution')] }
  ].map((x) => Object.assign(x, { refusals: x.refusals.filter(Boolean) }));
  const STEPWORD = { S: 'Comparator', K: 'con-leche --verified', KC: 'con-leche --compare' };
  for (const x of controls) for (const f of x.refusals) f.by = STEPWORD[f.step.slice(2)];
  if (recRow('C1-C3').verdict === 'CERTIFIED') need(controls.every((x) => x.refusals.length >= 2), 'C1–C3 is CERTIFIED, but a control’s refusals are not on file');

  /* ------------------------------------------------------------ the gaps and limits, each read where it is stated */
  const landrun = says(R('S1.err'), 'kernel supports Landlock ABI v4, so these default restrictions are not enforced: device ioctl (ABI v5), pathname UNIX socket connections (ABI v9), UDP bind/connect/send (ABI v10), abstract UNIX socket and signal scoping (ABI v6)');
  need(REC.tools.landlock === '4' && /\/run\/systemd\/system: absent/.test(REC.tools.systemd_run || ''), 'record.json no longer records Landlock ABI 4 and no systemd manager');
  const K1 = recRow('K1');
  const nanodaLine = says(R('K1.out'), 'Checked ' + K1.declarations + ' declarations with no typechecker errors, 1 pretty printer errors');
  says(R('K1.out'), '"Unable to print axioms"');
  const gaps = [
    { id: 'sandbox', b: 'The judge’s sandbox is partial on this machine.', text: 'The host’s kernel offers Landlock ABI v4, and landrun, the sandbox Comparator calls, warns at every start: “' + landrun + '”. Comparator also asks for a systemd guard against UNIX sockets, which cannot run in a container (amendment A3); the machine has no systemd manager. The sockets a sandboxed process could have reached were recorded before each judge run.', sources: [R('S1.err'), L('AMENDMENTS.md'), L('record.json')] },
    { id: 'conleche', b: 'con-leche refused the added axiom as an unsupported feature, not as an error.', text: 'Its line for control C1 is “' + says(R('C1K.err'), 'not implemented yet: non-standard axiom (CertMachine.plantedAxiomC1)') + '” (exit 2). It is a refusal, and Comparator refused the same control by name, but con-leche did not judge that proof; it declined to read it.', sources: [R('C1K.err'), R('C1S.err')] },
    { id: 'nanoda', b: 'nanoda printed one error of its own printer.', text: 'Its line is “' + nanodaLine + ': [ "Unable to print axioms" ]”: a failure to print the list of axioms, with no typechecker error. The axioms are checked by row A1 and by Comparator, not by this printout.', sources: [R('K1.out')] },
    { id: 'person', b: 'No person read the mathematics.', text: 'The rows check what a machine can check: that Lean and two kernels written apart from it accept the proofs, from the three standard axioms, of the five theorems as stated. Lean, Mathlib and the axioms propext, Classical.choice and Quot.sound are trusted. Nothing here says that RH or GRH hold beyond that.', sources: [L(P)] },
    { id: 'fidelity', b: 'What the statements mean is carried from the earlier lane, not read again.', text: 'The release’s statement file is byte for byte the one of Alpöge’s earlier release, whose statements our earlier lane read against the textbooks; that reading is carried over, and only the textbook bridge (CHAR) was re-run, because Mathlib moved.', sources: [L(P), 'corpus/alpoge-grh/PINS.json'] },
    { id: 'standin', b: 'The authors’ own run of the judge used a stand-in for its sandbox.', text: 'Their README says Comparator accepted the proofs “with a stand-in for its sandbox and `ulimit -s unlimited`”. Rows S1 and E1 run it in its own sandbox, partial as said above; S2 runs it on their own statement file.', sources: [L(P)] },
    { id: 'runner', b: 'The script that runs the steps changed after its seal.', text: 'Amendment A3 sealed the runner with the other instruments. It was changed twice before the run whose results stand: the order of the steps set to the one A3 fixes, and the install of GNU time after a start that ran nothing (“' + attempt0 + '”). The script the run used is named in the pod’s log; both hashes are one click down.', sources: [L('SEAL-A3.sha256'), L('PROGRESS.md'), R('_phase.log')] },
    { id: 'stamps', b: seals.every((s) => s.ots_state === 'bitcoin') ? 'Every timestamp is in a Bitcoin block.' : 'The timestamps await a Bitcoin block.', text: seals.every((s) => s.ots_state === 'bitcoin') ? 'The pre-registration and each amendment’s seal are stamped with OpenTimestamps and anchored in Bitcoin; the blocks are one click down.' : 'The pre-registration and each amendment’s seal are stamped with OpenTimestamps; ' + (seals.every((s) => s.ots_state !== 'bitcoin') ? 'all ' + seals.length + ' proofs are' : seals.filter((s) => s.ots_state !== 'bitcoin').length + ' of the ' + seals.length + ' proofs are') + ' still pending at the calendars, not yet in a block. Until then a stamp shows the calendars’ receipt, not a block.', sources: seals.map((s) => s.ots) }
  ];

  /* ------------------------------------------------------------ why this run could finish: the earlier lane's stop */
  const OLD = JSON.parse(txt('certs/alpoge-grh-lean.json'));
  const oS1 = OLD.rows.find((x) => x.id === 'S1'), oB1 = OLD.rows.find((x) => x.id === 'B1'), oK2 = OLD.rows.find((x) => x.id === 'K2');
  need(oS1 && oS1.verdict === 'REFUSED' && oS1.stop && oS1.stop.reason === 'cost' && oS1.stop.verdict_lines === 0, 'certs/alpoge-grh-lean.json no longer records S1 stopped on cost with no verdict');
  says('corpus/alpoge-grh/DEVIATIONS.md', 'runs S1 and C1 on a 376 GB machine', 'the machine');
  says('corpus/alpoge-grh/DEVIATIONS.md', 'Comparator 3927ad38) were rebuilt with the release\'s toolchain v4.33.1', 'the judge');
  const oFiles = (/all (\d+) sources have an \.olean/.exec(oB1.why) || die('the earlier B1 no longer counts its sources'))[1];
  const oDecl = Number((/nanoda checked (\d+) declarations of the exported closure/.exec(oK2.why) || die('the earlier K2 no longer counts nanoda\'s declarations'))[1]);
  const S1 = recRow('S1'), B1 = recRow('B1');
  const compare = S1.verdict === 'CERTIFIED' ? {
    earlier: { release: 'Alpöge’s release of 20 November 2026', judge: 'Comparator v4.33.0', lean: 'v4.33.1', machine_memory_bytes: oS1.stop.memory_limit_bytes, wall_seconds: oS1.stop.wall_seconds, rss_kib: oS1.stop.rss_kb, verdict_lines: 0, stopped_utc: oS1.stop.at, words: oS1.stop.words,
      files: Number(oFiles), build_seconds: oB1.seconds, nanoda_declarations: oDecl, source: 'certs/alpoge-grh-lean.json' },
    here: { judge: 'Comparator v4.35.0', lean: 'v4.35.0', machine: pod.machine, wall_seconds: S1.seconds, rss_gib: S1.peak_rss_gb, rss_kib: Number((/Maximum resident set size \(kbytes\): (\d+)/.exec(txt(R('S1.err'))) || die('S1.err has no peak memory line'))[1]),
      modules: B1.built_release_modules, build_seconds: B1.seconds, nanoda_declarations: K1.declarations, source: L('record.json') }
  } : null;
  if (compare) need(Math.round(compare.here.rss_kib / 1048576 * 10) / 10 === S1.peak_rss_gb, 'S1’s peak memory in record.json is not its line in S1.err');
  /* PROGRESS.md gives S1's peak as kB/10^6 ("15.9 GB"); this page states the recorder's GiB from the same line */
  const s1prog = /S1 passed: [^]*?peak RSS ([\d.]+) GB/.exec(PGN);

  /* ------------------------------------------------------------ D1 */
  const D1 = recRow('D1');
  const d1 = { rule_source: 'tools/grh-lean-records.js', census: 'instruments/grh-lean/census/Unused.lean', census_sha256: sha(rd('instruments/grh-lean/census/Unused.lean')), editions: [] };
  for (const e of ['grh', 'compact']) {
    const ed = D1.editions && D1.editions[e];
    if (!ed || ed.state !== 'done') continue;
    const x = d1Edition(RUN, e);
    for (const k of Object.keys(ed.summary)) need(Number(ed.summary[k]) === x.summary[k], 'D1-' + e + ': record.json’s summary ' + k + ' is not the census line’s');
    need(ed.outside_decl.length === x.summary.outside_decl, 'D1-' + e + ': record.json lists ' + ed.outside_decl.length + ' decl rows, the census ' + x.summary.outside_decl);
    d1.editions.push(x);
  }
  const unread = says(L('PROGRESS.md'), 'Not yet read: how many of the 1,394 \'decl\' rows are compiler-generated');

  /* ------------------------------------------------------------ the instruments and versions */
  const INSTR = ['instruments/grh-lean/Challenge.lean', 'instruments/grh-lean/controls/GrhC1.lean', 'instruments/grh-lean/controls/GrhC2.lean', 'instruments/grh-lean/controls/ChallengeC3.lean', 'instruments/grh-lean/census/Unused.lean', 'instruments/alpoge-grh/spec/Textbook.lean', 'instruments/alpoge-grh/spec/Spec.lean', 'instruments/alpoge-grh/spec/TextbookAx.lean', 'instruments/alpoge-grh/Challenge.lean', 'tools/check-grh-lean.py', RUNNER];
  const ieq = REC.instruments_equal_audit_commit || {};
  const instruments = INSTR.map((f) => ({ file: f, sha256: sha(rd(f)), equal_audit_commit: f in ieq ? ieq[f] : null }));
  need(Object.values(ieq).length && Object.values(ieq).every((v) => v === true), 'record.json: an instrument the pod fetched is not the repository’s at the audit commit');
  const challengeSeal = says(R('S1-gate.txt'), 'challenge unchanged since CHB-grh-seal');
  const conlecheLean = (/^con-leche lean-toolchain leanprover\/lean4:(v[\d.]+)$/m.exec(txt(R('judges.txt'))) || die('judges.txt no longer names con-leche’s toolchain'))[1];
  const versions = Object.assign({}, REC.tools.judges, { lean: REC.target.lean, mathlib: REC.target.mathlib, landlock_abi: REC.tools.landlock, conleche_lean: conlecheLean });
  for (const [k, v] of Object.entries({ comparator: 'e3dcf308', nanoda: '0da9f98f', 'con-leche': '5ea446d5', landrun: '573aa723' })) need((versions[k] || '').startsWith(v), 'record.json’s ' + k + ' is not ' + v);
  need(versions.mathlib.startsWith('56a00585') && versions.lean === 'v4.35.0', 'record.json’s Lean or Mathlib is not the release’s pins');
  const exportFact = { sha256: REC.rows.find((x) => x.id === 'K1').export_sha256, bytes: Number((/^(\d+) bytes$/m.exec(txt(R('export.sha256'))) || die('export.sha256 has no size'))[1]) };
  need(txt(R('export.sha256')).startsWith(exportFact.sha256), 'export.sha256 is not record.json’s export digest');

  /* ------------------------------------------------------------ the clock, the state */
  for (const [label, ms] of times) need(ms <= clock, 'a state is ahead of the clock: ' + label + ' says ' + new Date(ms).toISOString() + ', the clock reads ' + new Date(clock).toISOString());
  const pending = rows.filter((r) => r.verdict === 'PENDING');
  const counts = { all: rows.length, certified: rows.filter((r) => r.verdict === 'CERTIFIED').length, computed: rows.filter((r) => r.verdict === 'COMPUTED').length, refused: rows.filter((r) => r.verdict === 'REFUSED').length,
    running: rows.filter((r) => r.state === 'running').length, not_started: rows.filter((r) => r.state === 'not started').length, pending: pending.length, unreadable: rows.filter((r) => r.verdict === null).length };
  const SOURCES = ['PREREG.md', 'PREREG.md.ots', 'AMENDMENTS.md', 'AMENDMENTS.md.ots', 'PROPOSED-AMENDMENTS.md', 'PROGRESS.md', 'record.json'].concat(fs.readdirSync(LANE).filter((f) => /^SEAL-A\d+\.sha256(\.ots)?$/.test(f)).sort())
    .map((f) => ({ file: L(f), sha256_12: sha(rd(L(f))).slice(0, 12) }))
    .concat([R('_phase.log')].concat(d1.editions.map((e) => e.source)).map((f) => ({ file: f, sha256_12: sha(rd(f)).slice(0, 12) })));
  const state = {
    what: 'The state of the grh-lean lane as the live page /grh-lean/ shows it, written by tools/grh-lean-records.js from corpus/grh-lean-check/ (its record.json the only source of a verdict) and checked against PREREG.md, the seals and the clock.',
    as_of: new Date(asOf).toISOString().slice(0, 16) + 'Z',
    target: { repo: 'lsernau/grh-lean', commit, tree: REC.target.tree, committed_utc: committed, files: REC.target.files, editions, pinned, statements_sha256: statements, theorems: THEOREMS, axioms: AXIOMS, credit: 'Levent Alpöge’s, with Claude' },
    claim: { verdict: REC.claim.verdict, why: REC.claim.why, rule_rows: ['B1', 'A1', 'S1', 'K1', 'K2', 'KR', 'C1-C3'] },
    in_the_open: pending.length > 0, remaining: pending.map((r) => r.id),
    counts, rows, controls, gaps, compare, s1_progress_gb: s1prog ? Number(s1prog[1]) : null, claims,
    verdict_rule, prereg_written: sealedAt[1] + ' ' + sealedAt[2] + ' UTC', amendments, ceiling_usd, deadline_utc: deadline, spent_usd, pod, char_pod: charPod,
    steps: stepList, invocations, progress: progress.map(({ at: a, text }) => ({ at: a, text })),
    seals, runner, versions, instruments, challenge_seal: challengeSeal, export: exportFact, afunix, d1_unread_line: unread,
    sources: SOURCES, run: RUN, run_dir: L('runs/' + RUN)
  };
  const d1rec = { what: 'D1 of the grh-lean lane, recomputed from the census output and split by the rule stated in tools/grh-lean-records.js (the rule’s words are in each edition’s rules). A list, never a verdict.', as_of: state.as_of,
    rule_source: d1.rule_source, census: d1.census, census_sha256: d1.census_sha256, pending: D1.verdict === 'PENDING', editions: d1.editions.map(({ tsv, ...rest }) => Object.assign(rest, { tsv: OUT_REL + '/d1-' + rest.edition + '.tsv' })) };
  const out = { 'state.json': J(state), 'd1.json': J(d1rec) };
  for (const e of d1.editions) out['d1-' + e.edition + '.tsv'] = e.tsv;
  return out;
}

if (require.main !== module) { module.exports = { build }; return; }
const argv = process.argv.slice(2);
if (argv[0] === '--log') {
  const what = argv.slice(1).join(' ').trim();
  need(what, 'a log entry says what changed');
  const S = JSON.parse(fs.readFileSync(path.join(OUT, 'state.json'), 'utf8'));
  const f = path.join(OUT, 'page-log.json');
  const PL = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { what: 'The public change log of /grh-lean/: one dated entry per change of the page or of its state. The builder refuses when the newest entry’s state is not the records’.', entries: [] };
  PL.entries.push({ at: new Date().toISOString().slice(0, 16) + 'Z', as_of: S.as_of, claim: S.claim.verdict, rows: S.rows.map((r) => r.id + ':' + (r.verdict || 'null') + (r.state === 'running' ? '/running' : '')).join(' '), what });
  fs.writeFileSync(f, J(PL));
  console.log('page-log.json: entry ' + PL.entries.length + ' at ' + PL.entries[PL.entries.length - 1].at);
  process.exit(0);
}
if (argv.includes('--check')) {
  const p = path.join(OUT, 'state.json');
  need(fs.existsSync(p), 'no records to check: ' + OUT_REL + '/state.json');
  const was = Date.parse(JSON.parse(fs.readFileSync(p, 'utf8')).as_of);
  const recs = build(Math.min(Date.now(), was + 59999));
  let bad = 0;
  for (const [f, s] of Object.entries(recs)) { const q = path.join(OUT, f); if (!fs.existsSync(q) || fs.readFileSync(q, 'utf8') !== s) { console.error('  differs: ' + OUT_REL + '/' + f); bad++; } }
  if (bad) die(bad + ' record(s) differ from their sources at their own minute: rewrite them (node tools/grh-lean-records.js)');
  console.log(OUT_REL + ': ' + Object.keys(recs).length + ' records re-derived at ' + new Date(was).toISOString().slice(0, 16) + 'Z, all equal');
  process.exit(0);
}
const recs = build(Date.now());
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT).filter((x) => /^d1-.*\.tsv$/.test(x) && !(x in recs))) fs.rmSync(path.join(OUT, f));
for (const [f, s] of Object.entries(recs)) fs.writeFileSync(path.join(OUT, f), s);
const S = JSON.parse(recs['state.json']);
console.log(OUT_REL + ' written: claim ' + S.claim.verdict + '; ' + S.counts.certified + ' of ' + S.counts.all + ' rows CERTIFIED, ' + S.counts.computed + ' COMPUTED, ' + S.counts.pending + ' PENDING (' + S.counts.running + ' running)'
  + (S.remaining.length ? ' — remaining ' + S.remaining.join(', ') : '') + '; D1 editions ' + (JSON.parse(recs['d1.json']).editions.map((e) => e.edition + ' ' + e.written + ' written').join(', ') || 'none') + '; US$' + S.spent_usd.toFixed(2) + ' of US$' + S.ceiling_usd + '; as of ' + S.as_of);
