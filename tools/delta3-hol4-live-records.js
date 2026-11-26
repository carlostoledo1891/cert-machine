#!/usr/bin/env node
/* delta3-hol4-live-records.js — the records of /delta3-hol4/ (corpus/delta3-hol4-live/), written from the run's own files.

   The page /delta3-hol4/ is the live report of the δ₃-in-HOL4 work: a checker for the five certificates behind
   δ₃ = 117/2192, written in HOL4 and run in its kernel, and the blind benchmark now proving its lemmas (two model
   families, the same statements, every attempt judged by the HOL4 kernel). Its builder (tools/build-delta3-hol4-live.js)
   reads only corpus/delta3-hol4-live/. This file writes those records from hol4/delta3/ — PRIVATE files, read here
   READ-ONLY and never published — and writes ONLY aggregates and dated facts. It refuses when a source no longer says
   what a record states, and when a time a source states is ahead of the clock.

     harness/RUN.json            the start, the cap, the two families; an end field (end_utc / ended_utc) closes the run
     harness/attempts.jsonl      every judged attempt: counted per family, never copied (no statement id leaves this file
                                 while the run is open; the per-statement strip is written only once the run has ended)
     harness/runs/tokens.tsv     one row per finished batch agent: its start, end and token count
     harness/RUN-PROTOCOL.md     the rules, the three rulings, what ends the run, what happens to an accepted proof
     harness/FREEZE-2.json       its public fields only: when it froze, the digest of the public files and their names,
                                 the cipher's name, what it supersedes (never the archive's or the plaintext's digests)
     harness/PIN.json, JUDGE.json, MOVED-PRERUN.txt, agents/BRIEF.md   the pin, the judge's limits and controls, the move
     WORKLOG.md                  the batches, every batch start and end, the pause, the findings, the actions; after the run:
                                 the audits, the rebuilds, the readers, the 16:19 ruling, the key, Layer 1, the clean room,
                                 the public repository
     README.md, repo-draft/README.md   what the checker is, what is proved and what is not, the measured times
   after the run (2026-11-25, from 15:09 UTC), each cross-read against another source where one says the same:
     harness/score/score.json, SCORE.md   the frozen scorer's output: the gate, the classes, every success row with its exact
                                 interval (each found again in SCORE.md's printed line), the blind rows, the readers' flags,
                                 the tokens; counted and copied as totals, never per statement
     harness/audit/AUDIT.md, sets.json   the first blinding audit; notes/(private)/audit-astra/work/sets.json the second
     assembly/check.out, README.md, SOURCES.tsv   the Layer-1 read-back (three soundness theorems, the bounds, the axioms),
                                 the forgery recount, the fresh-copy replay, how each of the chain's lemmas was made
     assembly/repo/delta3-hol4/README.md, .github/workflows/replay.yml   the public repository's own words (byte-equal to
                                 the pushed files on 2026-11-25), and its CakeML job
     upstream/README.md          the HOL4 pull request, prepared and not opened
     notes/(private)/astra-lean-slab/REPORT.md, control-room-replay-lean/REPLAY-NOTE.md   the one Lean-kernel trial

   It never opens the answer key, its archive, any LEMMAS.md or anything under outreach/ (refused by name below).

   usage: node tools/delta3-hol4-live-records.js            write state.json; when a batch starts or ends, the run ends, or
                                                            a new fact or event enters the state, append a dated entry to
                                                            page-log.json saying so (the build refuses a stale log)
          node tools/delta3-hol4-live-records.js --log "what changed"   append a written entry for the current state  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SRC_REL = 'hol4/delta3';
const SRC = path.join(ROOT, SRC_REL);
const OUT = path.join(ROOT, 'corpus', 'delta3-hol4-live');
const die = (m) => { console.error('DELTA3-HOL4 RECORDS REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const J = (o) => JSON.stringify(o, null, 1) + '\n';
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const N_ = (x) => Number(x).toLocaleString('en-US');
/* the files this tool may never open, whatever a caller passes (the key, in every place it now lives, included) */
const FORBIDDEN = /LEMMAS\.md|key\.json|KEY-ARCHIVE|unlock-key|regen-key|outreach\/|\.enc$|day2-prerun-work|freeze-1\/|key-revealed|\/key\//i;
const rd = (rel) => {
  need(!FORBIDDEN.test(rel), 'this tool never opens ' + rel);
  const p = path.join(SRC, rel);
  need(fs.existsSync(p), 'a source is gone: ' + SRC_REL + '/' + rel);
  return fs.readFileSync(p);
};
const txt = (rel) => rd(rel).toString('utf8');
/* the run's private notes folder (notes/<name>-hol4-2026-11-24/): the second blinding audit and the Lean trial. Its name is
   found, never written here, and never reaches a record: the records name it notes/(private)/… */
const NOTES_DIR = (() => {
  const d = path.join(ROOT, 'notes');
  const hit = fs.existsSync(d) ? fs.readdirSync(d).filter((x) => /^[a-z]+-hol4-2026-11-24$/.test(x)) : [];
  need(hit.length === 1, 'the run’s notes folder (notes/…-hol4-2026-11-24/) is not there exactly once');
  return path.join(d, hit[0]);
})();
const ntxt = (rel) => {
  need(!FORBIDDEN.test(rel), 'this tool never opens ' + rel);
  const p = path.join(NOTES_DIR, rel);
  need(fs.existsSync(p), 'a source is gone: notes/(private)/' + rel);
  return fs.readFileSync(p, 'utf8');
};
const SOURCES = ['harness/RUN.json', 'harness/attempts.jsonl', 'harness/runs/tokens.tsv', 'harness/RUN-PROTOCOL.md', 'harness/FREEZE-2.json',
  'harness/PIN.json', 'harness/JUDGE.json', 'harness/MOVED-PRERUN.txt', 'agents/BRIEF.md', 'WORKLOG.md', 'README.md', 'repo-draft/README.md',
  'harness/score/score.json', 'harness/score/SCORE.md', 'harness/audit/AUDIT.md', 'harness/audit/sets.json',
  'assembly/SOURCES.tsv', 'assembly/check.out', 'assembly/README.md', 'assembly/repo/delta3-hol4/README.md',
  'assembly/repo/delta3-hol4/.github/workflows/replay.yml', 'upstream/README.md'];
const NOTE_SOURCES = ['audit-astra/work/sets.json', 'astra-lean-slab/REPORT.md', 'control-room-replay-lean/REPLAY-NOTE.md'];
const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };

function build(clock) {
  const asOf = Math.floor(clock / 60000) * 60000;
  const times = [];
  const at = (label, ms) => { need(Number.isFinite(ms), label + ': not a time'); times.push([label, ms]); return ms; };
  const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

  /* ------------------------------------------------------------ the run */
  const RUN = JSON.parse(txt('harness/RUN.json'));
  need(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(RUN.start_utc || ''), 'RUN.json has no start_utc');
  const start = at('RUN.json start', Date.parse(RUN.start_utc));
  need(Number.isInteger(RUN.cap) && RUN.cap > 0, 'RUN.json has no cap');
  need(RUN.families && RUN.families.claude === 'claude-opus-5-5' && RUN.families.gpt === 'gpt-6.2-astra', 'RUN.json no longer names the two families as claude-opus-5-5 and gpt-6.2-astra');
  const DAY = RUN.start_utc.slice(0, 10);
  const W = txt('WORKLOG.md'), WN = norm(W);
  const P = txt('harness/RUN-PROTOCOL.md'), PN = norm(P);
  /* the run is open until RUN.json carries an end, or the work log says the run has ended */
  const endField = RUN.end_utc || RUN.ended_utc || null;
  const endLine = /^- \**(\d\d:\d\d)(?::\d\d)?\**[^\n]*\bthe (?:blind )?run (?:has )?ended\b/im.exec(W) || /^- \**(\d\d:\d\d)(?::\d\d)?\**[^\n]*\bTHE RUN (?:HAS )?ENDED\b/m.exec(W);
  const ended = endField ? at('RUN.json end', Date.parse(endField)) : endLine ? at('the work log’s end of the run', Date.parse(DAY + 'T' + endLine[1] + ':00Z')) : null;
  const run_open = ended === null;

  /* the batches: "b1 = S001–S018, …" on the work log's Batches line */
  const bl = /\*\*Batches\*\*[^\n]*(?:\n {2,}[^\n]*)*/.exec(W);
  need(bl, 'WORKLOG.md has no **Batches** line');
  const batches = [...norm(bl[0]).matchAll(/\bb(\d+) = S(\d{3})–S(\d{3})/g)].map((m) => ({ id: 'b' + m[1], from: Number(m[2]), to: Number(m[3]) }));
  need(batches.length >= 2 && batches.every((b, i) => b.id === 'b' + (i + 1) && b.from === (i ? batches[i - 1].to + 1 : 1)), 'the work log’s batches are not b1, b2, … in order, back to back');
  const size = batches[0].to - batches[0].from + 1;
  need(batches.every((b) => b.to - b.from + 1 === size), 'the batches are not all one size');
  const N = batches[batches.length - 1].to;
  const nWord = (/\b(\w+) batches of (\d+)\b/.exec(norm(bl[0])) || []);
  need(WORDNUM[nWord[1]] === batches.length && Number(nWord[2]) === size, 'the work log no longer says "' + batches.length + ' batches of ' + size + '"');
  need(/the same for both families/.test(norm(bl[0])), 'the work log no longer says the batches are the same for both families');
  const inFlight0 = WORDNUM[(/At most (\w+) batches per family in flight/.exec(WN) || die('the work log no longer says how many batches per family may be in flight'))[1]];

  /* the attempts of the run: from start_utc, families claude and gpt, statements S001…; counted, never copied */
  const FAM = [{ id: 'claude', name: 'Claude Opus 5.5', model: RUN.families.claude, agent: 'claude' }, { id: 'gpt', name: 'GPT-6.2 Astra', model: RUN.families.gpt, agent: 'astra' }];
  const rows = txt('harness/attempts.jsonl').split('\n').filter((l) => l.trim()).map((l, i) => { try { return JSON.parse(l); } catch (e) { return die('attempts.jsonl line ' + (i + 1) + ' is not JSON'); } });
  const runRows = rows.filter((r) => Date.parse(r.time_utc) >= start && FAM.some((f) => f.id === r.family));
  for (const r of runRows) {
    need(/^S\d{3}$/.test(r.lemma) && Number(r.lemma.slice(1)) >= 1 && Number(r.lemma.slice(1)) <= N, 'an attempt of the run names a statement outside S001–S' + String(N).padStart(3, '0'));
    need(r.model === RUN.families[r.family], 'an attempt of family ' + r.family + ' was made by another model');
    at('an attempt', Date.parse(r.time_utc));
  }
  const one = (k) => [...new Set(runRows.map((r) => JSON.stringify(r[k])))];
  const limits = one('time_limit_s').length === 1 && one('cpu_limit_s').length === 1 && one('mem_limit_gb').length === 1
    ? { wall_s: runRows.length ? runRows[0].time_limit_s : null, cpu_s: runRows.length ? runRows[0].cpu_limit_s : null, mem_gb: runRows.length ? runRows[0].mem_limit_gb : null } : null;
  const uniform = { judge_code: one('judge_code').length, freeze: one('freeze').length, host: one('host').length, limits: !!limits };
  const pauseOf = () => {
    const m = /\*\*(\d\d:\d\d)–(\d\d:\d\d) UTC, PAUSE\b/.exec(W) || die('the work log no longer records the pause ("**HH:MM–HH:MM UTC, PAUSE")');
    const r = /\*\*(\d\d:\d\d:\d\d) UTC, RESUME\*\*/.exec(W) || die('the work log no longer records the resume ("**HH:MM:SS UTC, RESUME**")');
    const d = /The pause lasted (\d+) h (\d+) min/.exec(WN) || die('the work log no longer says how long the pause lasted');
    need(/the pod keeps running/.test(WN) && /SIGSTOPped whole/.test(WN) && /Claude agents were told to finish the attempt in flight, submit nothing new/.test(WN) && /no attempt was in flight for the Claude family/.test(WN), 'the work log no longer says what the pause stopped and what it kept running');
    const st = /SIGSTOPped whole \(process trees, state kept\) at (\d\d:\d\d:\d\d)/.exec(WN) || die('the work log no longer says when the GPT sessions were stopped');
    return { from: at('the pause', Date.parse(DAY + 'T' + m[1] + ':00Z')), stopped: at('the stop', Date.parse(DAY + 'T' + st[1] + 'Z')), to: at('the resume', Date.parse(DAY + 'T' + r[1] + 'Z')), lasted: d[1] + ' h ' + d[2] + ' min' };
  };
  const pause = pauseOf();

  /* the batch agents: started (named "started" in a sentence of the log, or an attempt), ended (tokens.tsv, or the log) */
  const TOK = txt('harness/runs/tokens.tsv').split('\n').filter((l) => l.trim());
  const th = TOK[0].split('\t');
  need(['family', 'agent', 'batch', 'started_utc', 'ended_utc', 'total_tokens', 'source'].every((k) => th.includes(k)), 'tokens.tsv’s header has changed');
  const tok = TOK.slice(1).map((l) => Object.fromEntries(l.split('\t').map((v, i) => [th[i], v])));
  /* a time with unread digits ("13:23:3xZ") is read to its minute when only seconds are missing, else not at all */
  const fuzzy = (s) => { const m = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)(?::([\dx][\dx]))?Z$/.exec(s || ''); return m ? Date.parse(m[1] + 'T' + m[2] + ':' + m[3] + ':' + (m[4] ? m[4].replace(/x/g, '0') : '00') + 'Z') : null; };
  /* the log's bullets from the run's start on, each with its leading time */
  const runSec = W.slice(W.indexOf('the blind run starts'));
  need(runSec.length > 100, 'the work log has no section "… the blind run starts"');
  const bullets = runSec.split(/\n(?=- )/).map((b) => norm(b)).filter((b) => b.startsWith('- '));
  const lead = (b) => { const m = /^- \**(\d\d:\d\d(?::\d\d)?)/.exec(b); return m ? Date.parse(DAY + 'T' + (m[1].length === 5 ? m[1] + ':00' : m[1]) + 'Z') : null; };
  const startedIn = {}, endedIn = {};
  for (const b of bullets) for (const s of b.split(/(?<=[.;])\s+/)) {
    const names = [...s.matchAll(/\b(claude|astra)-b(\d+)\b/g)].map((m) => m[1] + '-b' + m[2]);
    for (const a of names) {
      if (/\bstarted\b/.test(s) && !startedIn[a]) startedIn[a] = lead(b);
      if (new RegExp('\\b' + a + ' ended\\b').test(s) && !endedIn[a]) endedIn[a] = lead(b);
    }
  }
  /* the first wave's start: "Astra sessions started HH:MM:SS" (GPT) and "started HH:MM–HH:MM: claude-b1, …" (Claude) */
  const w1g = /Astra sessions started (\d\d:\d\d:\d\d) by run-astra\.sh: b1 \S+, b2 \S+, b3 \S+/.exec(WN) || die('the work log no longer says when the first GPT batches started');
  const w1c = /started (\d\d:\d\d)–(\d\d:\d\d): claude-b1, claude-b2, claude-b3/.exec(WN) || die('the work log no longer says when the first Claude batches started');
  for (const k of [1, 2, 3]) { startedIn['astra-b' + k] = startedIn['astra-b' + k] || Date.parse(DAY + 'T' + w1g[1] + 'Z'); startedIn['claude-b' + k] = startedIn['claude-b' + k] || Date.parse(DAY + 'T' + w1c[2] + ':00Z'); }
  const families = FAM.map((f) => {
    const R = runRows.filter((r) => r.family === f.id);
    const by = {};
    for (const r of R) (by[r.lemma] = by[r.lemma] || []).push(r);
    let capOver = 0, afterJudged = 0, outside = 0;
    const cls = {};
    for (const [id, list] of Object.entries(by)) {
      list.sort((a, b) => a.seq - b.seq);
      if (list.length > RUN.cap) capOver++;
      const j = list.findIndex((r) => r.outcome === 'proved' || r.outcome === 'refuted');
      if (j >= 0 && j < list.length - 1) afterJudged++;
      cls[id] = j >= 0 ? list[j].outcome : list.length >= RUN.cap ? 'cap' : 'open';
    }
    for (const r of R) { const b = /-b(\d+)$/.exec(r.agent); const B = b && batches[Number(b[1]) - 1]; const n = Number(r.lemma.slice(1)); if (!B || n < B.from || n > B.to) outside++; }
    const count = (c) => Object.values(cls).filter((x) => x === c).length;
    const statements = { proved: count('proved'), refuted: count('refuted'), cap: count('cap'), open: count('open') };
    statements.untouched = N - statements.proved - statements.refuted - statements.cap - statements.open;
    const outcomes = {};
    for (const r of R) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
    const bs = batches.map((b) => {
      const a = f.agent + '-' + b.id;
      const t = tok.find((x) => x.agent === a && x.family === f.id);
      const att = R.filter((r) => r.agent === a);
      const endT = (t && fuzzy(t.ended_utc)) || endedIn[a] || null;
      const startT = (t && fuzzy(t.started_utc)) || startedIn[a] || (att.length ? Math.min(...att.map((r) => Date.parse(r.time_utc))) : null);
      const state = endT ? 'done' : startT ? 'running' : 'waiting';
      if (startT) at(a + ' start', startT);
      if (endT) at(a + ' end', endT);
      need(!endT || !startT || endT >= startT, a + ' ends before it starts');
      return { id: b.id, state, started_utc: startT ? iso(startT) : null, ended_utc: endT ? iso(endT) : null, tokens: t ? Number(t.total_tokens) || null : null, attempts: att.length };
    });
    const doneB = bs.filter((b) => b.state === 'done');
    const tk = doneB.filter((b) => b.tokens);
    /* each family's tokens are counted by its own tool, in its own way: said beside the number, never compared bare */
    const srcs = tok.filter((x) => x.family === f.id).map((x) => x.source);
    need(srcs.every((x) => f.id === 'claude' ? /^Agent tool usage report/.test(x) : /^astra\.log "tokens used"/.test(x)), 'tokens.tsv names a counter other than the Agent tool’s (Claude) or Codex’s (GPT)');
    const source = [f.id === 'claude' ? 'the Agent tool’s usage report for each agent' : 'Codex’s own “tokens used” count for each session'];
    const inPause = R.filter((r) => { const t = Date.parse(r.time_utc); return t > pause.stopped && t < pause.to; }).length;
    return { id: f.id, name: f.name, model: f.model, attempts: R.length, outcomes, statements, batches: bs,
      batches_done: doneB.length, batches_running: bs.filter((b) => b.state === 'running').length,
      first_attempt_utc: R.length ? iso(Math.min(...R.map((r) => Date.parse(r.time_utc)))) : null,
      last_attempt_utc: R.length ? iso(Math.max(...R.map((r) => Date.parse(r.time_utc)))) : null,
      all_done_utc: doneB.length === batches.length ? iso(Math.max(...doneB.map((b) => Date.parse(b.ended_utc)))) : null,
      tokens: { total: tk.reduce((a, b) => a + b.tokens, 0), batches: tk.length, counter: source.join('; ') },
      judged_in_pause: inPause, cap_over: capOver, after_judged: afterJudged, outside_batch: outside,
      per_statement: run_open ? null : Array.from({ length: N }, (_, i) => cls['S' + String(i + 1).padStart(3, '0')] || 'untouched') };
  });
  /* the Claude family's pace change (13:29 ruling): "the Claude family may run up to 6 batches at once" */
  const pace = /- (\d\d:\d\d) RULING \(operator, dialog\):[^\n]*Also: the Claude family may run up to (\d+) batches at once/.exec(W) || die('the work log no longer records the Claude family’s pace ruling');

  /* ------------------------------------------------------------ the rules, from the protocol and the brief */
  const BR = norm(txt('agents/BRIEF.md'));
  for (const n of ['At most 3 attempts per statement', 'Stop at the first judged outcome', 'Some statements are false on purpose.', 'Do not run `hol` or `Holmake` yourself', '600 s of wall time, 1200 s of CPU per process, 6 GB of resident memory'])
    need(BR.includes(n), 'agents/BRIEF.md no longer says: ' + n);
  need(RUN.cap === 3 && BR.includes('At most ' + RUN.cap + ' attempts per statement'), 'the brief’s cap is not RUN.json’s');
  need(!limits || (limits.wall_s === 600 && limits.cpu_s === 1200 && limits.mem_gb === 6), 'the run’s attempts carry limits other than the brief’s');
  for (const n of ['Both families get the statements in the same order, the same batches, and no hints beyond the brief.', 'Decoys are marked in the encrypted key'])
    need(PN.includes(n), 'RUN-PROTOCOL.md no longer says: ' + n);
  const PIN = JSON.parse(txt('harness/PIN.json'));
  need(/^trindemossen-\d+-v\d+$/.test(PIN.hol_tag) && /^v\d+\.\d+\.\d+$/.test(PIN.poly_tag), 'PIN.json names no HOL4 tag or Poly/ML tag');
  const FZ = JSON.parse(txt('harness/FREEZE-2.json'));
  need(FZ.dry_run === false && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(FZ.frozen_utc) && /^[0-9a-f]{64}$/.test(FZ.digest) && FZ.public && typeof FZ.public === 'object', 'FREEZE-2.json is not a real freeze with a digest and its public files');
  need(/passphrase is held by the operator only/.test(FZ.note || ''), 'FREEZE-2.json no longer says the passphrase is held by one person only');
  need(FZ.supersedes && /printed into Claude session transcripts/.test(FZ.supersedes.why || ''), 'FREEZE-2.json no longer says why it superseded the first freeze');
  const frozen = at('FREEZE-2 frozen_utc', Date.parse(FZ.frozen_utc));
  need(frozen < start, 'the freeze is not before the run');
  const JU = JSON.parse(txt('harness/JUDGE.json'));
  const controls = /controls 1-9 PASS \(9\/9\), memory limit PASS, refuting C01 fails \(PASS\), refuting C02 refuted \(PASS\)/.test(JU.controls_on_this_code || '');
  need(controls, 'JUDGE.json no longer records the nine controls, the memory limit and the two refutation controls passing on this code');
  need(/^[0-9a-f]{64}$/.test(JU.judge_code) && runRows.every((r) => r.judge_code === JU.judge_code), 'an attempt of the run was judged by a judge code other than JUDGE.json’s');
  need((JU.not_covered || []).some((x) => /A DELIBERATE forgery from inside the build is stopped only by the identifier deny-list \(a text filter, not a proof\) and by reading every proved script/.test(x)), 'JUDGE.json no longer says what stops a deliberate forgery');
  need((JU.not_covered || []).some((x) => /Reads are not restricted/.test(x)), 'JUDGE.json no longer says reads are not restricted');

  /* ------------------------------------------------------------ what went wrong, and what was done (each fact read) */
  const has = (hay, n, where) => { need(hay.includes(n), where + ' no longer says: ' + n); return true; };
  const tw = (re, what) => { const m = re.exec(W) || re.exec(WN); need(m, 'the work log no longer records ' + what); return m; };
  const tAt = (hm, what) => at(what, Date.parse(DAY + 'T' + (hm.length === 5 ? hm + ':00' : hm) + 'Z'));
  const hm = (ms) => new Date(ms).toISOString().slice(11, 16);
  const dayOf = (s) => { const d = new Date(s); return d.getUTCDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()]; };
  /* 1, the log */
  const f1 = tw(/\*\*Two findings from claude-b2's report \((\d\d:\d\d)\)/, 'the two findings of 13:41');
  for (const n of ['Cross-family leak through harness/attempts.jsonl', 'The log holds every attempt of both families; the brief forbids harness/work/<other family>/ but not the log', 'claude-b2 read it', 'the GPT family ran ahead, so a Claude agent reading it could see GPT outcomes',
    'new Claude agents get the same message at their start', 'The blinding audit counts every read of attempts.jsonl per agent and statement', 'scoring reports the Claude family with and without the statements an agent could have seen in the log first']) has(WN, n, 'the work log');
  const told = tw(/(\d\d:\d\d): every running Claude agent \(([^)]*)\) told not to read attempts\.jsonl or other agents' results, and to report whether it had and for which statements/, 'the 13:42 message to the Claude agents');
  const toldN = told[2].split(',').filter((s) => /\bb\d+\b/.test(s)).length;
  /* 2, the material from before the run */
  const f2 = tw(/\*\*(\d\d:\d\d) CONTAMINATION found/, 'the contamination found at 13:51');
  for (const n of ['harness/work/claude/ still held the Day-2 S33 attempts', 'a harness builder that had READ LEMMAS.md', 'The brief allows reading harness/, so a Claude agent could read a proof written with the key\'s plaintext in view',
    'same-family reuse is allowed by the brief and is reported, not excluded', 'whose lists — before decoys — identify 41 of 44 planted texts', 'only renumbered',
    'any statement an agent decided after such a read is reported separately']) has(WN, n, 'the work log');
  const folders = WORDNUM[(/those (\w+) folders moved out of harness\//.exec(WN) || die('the work log no longer says how many folders were moved out'))[1]];
  const contam = (/((?:S\d{3}(?:, | and ))*S\d{3}) for the Claude family are marked CONTAMINATED/.exec(WN) || die('the work log no longer says which statements are marked contaminated'))[1].split(/, | and /).length;
  const mv = /^Moved (\d{4}-\d\d-\d\d) (\d\d:\d\d) UTC by the control room, out of the agents' readable tree/.exec(txt('harness/MOVED-PRERUN.txt')) || die('MOVED-PRERUN.txt no longer says when the material was moved');
  const movedAt = at('the move', Date.parse(mv[1] + 'T' + mv[2] + ':00Z'));
  const planted41 = /identify (\d+) of (\d+) planted texts/.exec(WN);
  /* 3 and 4, the two holes in the scoring rules, and the rulings */
  has(WN, 'A finding about the scoring rules (RUN-PROTOCOL.md, "How decoys are scored"), written before the key is opened.', 'the work log');
  const r1 = tw(/- (\d\d:\d\d) RULING \(operator, dialog\): a refuted D-planted decoy counts as correct, in its own 'text refuted' column; no stop/, 'the 13:29 ruling');
  const r2 = tw(/- (\d\d:\d\d) RULING \(operator, dialog\): the accepted scripts are read by agents only — one Claude and one Astra reader, independently, every script; the report says no human read them/, 'the 13:47 ruling on the readers');
  const r3 = tw(/- (\d\d:\d\d) RULING \(operator, dialog\): the gate judges what the kernel judged — zero 'proved' on a false GOAL, zero 'refuted' on a true TEXT; planted statements with a vacuous goal in their own class/, 'the 13:47 ruling on the gate');
  for (const n of ['## Ruling of 2026-11-25 13:29 UTC (the operator, dialog), before the key is unlocked: refutations of D-planted decoys', 'So a `refuted` on a D-planted decoy is CORRECT: it does not stop the run, and it is reported in its own column, "text refuted"',
    'The early stop is unchanged: a family that refutes such a decoy first cannot then prove it, and the report says so.',
    '## Ruling of 2026-11-25 13:47 UTC (the operator, dialog): who reads the accepted scripts', 'is done by AGENTS ONLY: two independent readers, one Claude (Opus 5.5) and one GPT-6.2 (Astra), each reads every accepted script against the seven-item checklist alone', 'The report says plainly that no human read the scripts.',
    '## Ruling of 2026-11-25 13:47 UTC (the operator, dialog), before the key is unlocked: the gate judges what the kernel judged', '**The gate: zero `proved` on a statement whose goal is false, and zero `refuted` on a statement whose text is true**','Planted statements whose goal is vacuously true form their own class ("planted, vacuous goal"; proved = correct, refuted = correct)'])
    has(PN, norm(n), 'RUN-PROTOCOL.md');
  for (const n of ['A planted statement can be provable.', 'the gate "zero planted proved" would misfire on a correct vacuous proof']) has(WN, n, 'the work log');
  for (const n of ['The harness builders (Claude agents) have read LEMMAS.md', 'the residual signals measured in the dry runs are listed above and are reported with the results']) has(PN, n, 'RUN-PROTOCOL.md');

  const gaps = [
    { id: 'log', when: hm(tAt(f1[1], 'finding 1')), title: 'The judge’s log could be read across the two families',
      happened: 'The judge writes every attempt of both families to one log. The brief forbade reading the other family’s folder, but not that log. A Claude agent read it; the GPT family was ahead, so a Claude agent reading the log could see GPT outcomes before attempting the same statement.',
      done: 'At ' + told[1] + ' UTC the ' + toldN + ' Claude agents then running were told not to read the log or other agents’ results, and to report whether they had, and for which statements. Each later Claude agent gets the same message at its start.',
      scoring: 'The blinding audit counts every read of the log, per agent and per statement. The Claude family is scored twice: with all its statements, and without the statements an agent could have seen in the log first.' },
    { id: 'prerun', when: hm(tAt(f2[1], 'finding 2')), title: 'Work from before the run, by an agent that had seen the answer texts, could be read',
      happened: 'A folder the proving agents were allowed to read still held earlier attempts and proofs written before the run by a Claude agent that built the harness and had read the texts of the true statements. One Claude proving agent used that material for ' + contam + ' of its statements. Also readable: the first answer key’s statement list, whose lists identify ' + planted41[1] + ' of its ' + planted41[2] + ' planted texts (this run uses the same texts, renumbered), and one accepted proof from before the run.',
      done: 'At ' + hm(movedAt) + ' UTC all of it (' + folders + ' folders, the first statement list and the accepted proof) was moved out of the folders the agents may read; a note stands in its place.',
      scoring: 'Those ' + contam + ' statements are marked contaminated for the Claude family, which is reported with and without them. The blinding audit lists every read of the moved material by any agent of either family, with its time; any statement decided after such a read is reported separately.' },
    { id: 'decoy-text', when: hm(tAt(r1[1], 'ruling 1')), title: 'A correct refutation would have stopped the run',
      happened: 'A refutation proves that a statement’s text, taken alone without its “may use” hypotheses, is false. A decoy whose text is a planted (false) text is true as a whole, because one of its hypotheses is false, yet its text can be refuted. The protocol said that refuting a decoy meant a kernel or judge fault and stopped the run. This was found during the run and written down before the answer key is opened.',
      done: 'Ruled at ' + r1[1] + ' UTC, before the key is opened: such a refutation is correct. It is reported in its own column, “text refuted”, beside “proved”, and it does not stop the run. A family that refuted such a decoy first can no longer prove it, and the report says so.',
      scoring: 'The rule that stops the run stays for a refutation of a true original or of a decoy whose text is true.' },
    { id: 'vacuous', when: hm(tAt(r3[1], 'ruling 3')), title: 'A planted statement can be true, vacuously',
      happened: 'A Claude agent found that a planted statement’s “may use” list can name a decoy whose text is false. The planted statement then holds vacuously and has a correct kernel proof, and the gate “zero planted statements proved” would have flagged a correct proof as a fault.',
      done: 'Ruled at ' + r3[1] + ' UTC, before the key is opened: the gate judges what the kernel judged. Zero “proved” on a statement whose goal is false, and zero “refuted” on a statement whose text is true; either one would mean a kernel or judge fault. A planted statement whose goal holds vacuously is scored in its own class.',
      scoring: 'Every statement is classed by the truth of what the kernel was asked to judge, read from the key once it is opened.' }];
  const rulings = [
    { when: r1[1], text: 'A refuted decoy text counts as correct, in its own column; it does not stop the run.' },
    { when: r2[1], text: 'Agents, not people, read the accepted scripts: one Claude and one GPT-6.2 reader, each alone, every script. The report will say that no person read them.' },
    { when: r3[1], text: 'The gate judges what the kernel judged: no proof of a false goal, no refutation of a true text.' }];
  const limitsKnown = [
    { text: 'The first answer key, frozen at ' + FZ.supersedes.frozen_utc.slice(11, 16) + ' UTC on ' + dayOf(FZ.supersedes.frozen_utc) + ', was printed into AI session transcripts on the machine that runs the benchmark. It was replaced before the run by a fresh key, frozen at ' + FZ.frozen_utc.slice(11, 16) + ' UTC on ' + dayOf(FZ.frozen_utc) + ' and encrypted under a passphrase that one person, Carlos Toledo, holds.' },
    { text: 'The Claude agents that built the harness read the texts of the true statements. The proving agents are other agents; the blinding audits checked what each of them read.' },
    { text: 'Nothing stops an agent from reading a file: the machine does not restrict reads. The blinding rule was checked afterwards, on every agent’s tool log, twice.' },
    { text: 'Agents of the same family may read each other’s scripts. The brief allows it; reuse is reported, not excluded.' },
    { text: 'The decoys remove the signal that used to mark the true statements; weaker signals remain, were measured before the run, and are reported with the results.' },
    { text: 'The judge trusts the files HOL4 writes. A deliberate forgery from inside a build would be stopped only by a text filter on the script and by reading the script, which is why every accepted proof was rebuilt alone and read by two agents.' }];
  if (families.some((f) => f.judged_in_pause)) limitsKnown.push({ text: 'The judge kept running through the pause: ' + families.filter((f) => f.judged_in_pause).map((f) => f.judged_in_pause + ' ' + f.name + (f.judged_in_pause === 1 ? ' attempt' : ' attempts')).join(' and ') + ', already submitted when the agents stopped (' + hm(pause.stopped) + ' UTC), ' + (families.reduce((a, f) => a + f.judged_in_pause, 0) === 1 ? 'was' : 'were') + ' judged during it.' });
  for (const f of families) {
    if (f.cap_over) gaps.push({ id: 'cap-' + f.id, when: hm(asOf), title: 'The ' + f.name + ' family has more than ' + RUN.cap + ' attempts at ' + f.cap_over + (f.cap_over === 1 ? ' statement' : ' statements'), happened: 'The judge enforces the cap; the log shows it was passed.', done: 'Not yet investigated.', scoring: 'Reported with the results.' });
    if (f.after_judged) gaps.push({ id: 'stop-' + f.id, when: hm(asOf), title: 'The ' + f.name + ' family attempted ' + f.after_judged + (f.after_judged === 1 ? ' statement' : ' statements') + ' after a judged outcome', happened: 'The judge stops a family at its first judged outcome; the log shows a later attempt.', done: 'Not yet investigated.', scoring: 'Reported with the results.' });
  }

  /* ------------------------------------------------------------ the timeline: each event read from the log */
  const events = [
    { at: iso(start), title: 'The run starts', text: 'From here the judge enforces the cap of ' + RUN.cap + ' attempts per statement per family.' },
    { at: iso(Math.min(Date.parse(DAY + 'T' + w1g[1] + 'Z'), Date.parse(DAY + 'T' + w1c[2] + ':00Z'))), title: 'Both families start', text: 'Each family starts its first ' + inFlight0 + ' batches; at most ' + inFlight0 + ' per family run at once, and the next starts, in order, when one ends.' },
    { at: iso(pause.from), title: 'Pause', text: 'The Claude agents finish the attempt in flight and stop; the GPT sessions are frozen where they are; the judge keeps running.' },
    { at: iso(pause.to), title: 'Resume', text: 'After ' + pause.lasted + '.' },
    { at: iso(tAt(pace[1], 'pace ruling')), title: 'A ruling, and a faster pace', text: 'A refuted decoy text counts as correct. The Claude family may run up to ' + pace[2] + ' batches at once, to keep pace; the limit had been ' + inFlight0 + ' for each family.' },
    { at: iso(tAt(f1[1], 'finding 1')), title: 'Two findings', text: 'A Claude agent reports that the judge’s log can be read across families, and that a planted statement can hold vacuously.' },
    { at: iso(tAt(told[1], 'message')), title: 'The log is put off limits', text: 'The ' + toldN + ' running Claude agents are told not to read it.' },
    { at: iso(tAt(r2[1], 'rulings')), title: 'Two rulings', text: 'Agents read the accepted scripts; the gate judges what the kernel judged.' },
    { at: iso(movedAt), title: 'Material from before the run moved out', text: 'A Claude agent’s report shows it could be read; it is moved out of the agents’ reach.' }];
  for (const f of families) if (f.all_done_utc) events.push({ at: f.all_done_utc, title: 'The ' + f.name + ' family finishes', text: 'All ' + batches.length + ' of its batches have ended.' });
  if (ended) events.push({ at: iso(ended), title: 'The run ends', text: 'Every statement is judged or at the cap for both families, or the run was stopped.' });
  events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  /* ------------------------------------------------------------ the work: the checker (README and the repository draft) */
  const D1 = txt('README.md'), D1N = norm(D1), DR = txt('repo-draft/README.md'), DRN = norm(DR);
  const frac = (a, b) => { const g = (x, y) => y ? g(y, x % y) : x; const k = g(a, b); return [a / k, b / k]; };
  const slabs = [...D1.matchAll(/^\| slab([A-D]) `slab-(\d+)_(\d+)-(\d+)_(\d+)-[^`]*\.json` \| (\d+) \| ([\d,]+)(?: \([^)]*\))? \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|$/gm)]
    .map((m) => ({ id: 'slab' + m[1], lo: frac(+m[2], +m[3]), hi: frac(+m[4], +m[5]), n: +m[6], forms: Number(m[7].replace(/,/g, '')), check_s: +m[8], build_s: +m[9], peak_gb: +m[10] }));
  need(slabs.length === 4, 'README.md no longer has the four slabs’ table');
  const js = /\| the same check in JavaScript, same machine \(the mirror in `export\.js`\) \| ([\d.]+) s — the kernel is \*\*([\d.]+)× slower\*\* \|/.exec(D1) || die('README.md no longer gives the JavaScript time and the factor');
  const inner = /\| the inner certificate, on \[0, 1\/5\], with ([\d,]+) forms \| `⊢ inner_check <data> ⇔ T` \|/.exec(DR) || die('repo-draft/README.md no longer states the inner certificate’s theorem');
  const innerT = /delta3_inner ([\d.]+) s \(([\d.]+) GB, cv_eval ([\d.]+) s\) \*\*⇔ T\*\*/.exec(WN) || die('the work log no longer gives the inner certificate’s -v10 run');
  const battery = /the battery's (\d+) planted forgeries \| (\d+) give `⇔ F` in the kernel and the (\d+) cover forgeries give `⇔ F`; the loader refuses the malformed one before the kernel/.exec(DRN) || die('repo-draft/README.md no longer states the battery’s forgeries');
  const more = /\| (\d+) more planted forgeries \((\d+) slab, (\d+) inner\) \| each gives `⇔ F` \|/.exec(DR) || die('repo-draft/README.md no longer states the six further forgeries');
  const bin = /That is (\d+) of (\d+) agreements with the kernel, at ([\d.]+)–([\d.]+) s per certificate\./.exec(DRN) || die('repo-draft/README.md no longer states the binary’s agreements');
  const v9 = /byte-identical theorem statements on all (\d+) inputs that reach the kernel/.exec(DRN) || die('repo-draft/README.md no longer compares -v9 and -v10');
  for (const n of ['the five regions reach from 0 to 1/2 with no gap', '`⊢ cover_all <regions> ⇔ T`', '`DIAGONALLY_DOMINANT_PSD` and `DIAGONALLY_DOMINANT_PD`', 'Each one carries only the `DISK_THM` tag, with no axioms and no hypotheses.',
    '**Soundness, not yet.** The next milestone is the theorem that an accepting `slab_check` implies L_θ(y) ≥ B − ε(1+n) on its region.', 'The same theorems for `inner_check` and `cover_all` come after it.',
    '**The model constants are data.**', '**The analytic reduction is not in HOL4.**', 'The uniqueness of the extremal colouring is not in HOL4 either.', '**The witness is untrusted.**', 'A wrong hint can only turn T into F.',
    '**Strictness is tested differently from the JavaScript verifier.**', 'That test is sufficient for positive definiteness but not necessary.',
    'That primitive is a port of the compute facility proved sound for Candle (O. Abrahamsson, M. O. Myreen, M. Norrish, H. Kanabar, J. Åman Pohjola, *J. Automated Reasoning* 69(1):7, 2025). The port itself is not proved inside HOL4.',
    'The binary adds CakeML\'s released compiler binary, the C FFI stubs of its basis library and the gcc link step.',
    'A builder agent finishes any lemma left after the blind run. Those lemmas are marked non-blind, and the scores count only blind attempts.',
    'It becomes the README of the small public repository only at the first green slab']) has(DRN, norm(n), 'repo-draft/README.md');
  const lean = /Snively formalised the full statement in Lean: \[dreadpiratechan\/erdos-1186\]\((https:\/\/github\.com\/dreadpiratechan\/erdos-1186)\), v([\d.]+) \((\d+ \w+ \d{4})\)/.exec(DRN) || die('repo-draft/README.md no longer credits the Lean formalisation');
  const sfm = /Star Fleet Math stated δ₃ = 117\/2192, with an exact rational sum-of-squares certificate, by (\d+ \w+ \d{4}) \(Internet Archive capture (\d{14})\)/.exec(DRN) || die('repo-draft/README.md no longer credits Star Fleet Math');
  has(D1N, '`Thm.compute` is an interpreter inside the kernel', 'README.md');
  has(D1N, '**Absent:** positive (semi)definiteness, Gershgorin\'s theorem or diagonal dominance', 'README.md');
  const work = {
    value: '117/2192', problem: 'Erdős #1186', certificates: 5,
    regions: [{ id: 'inner', lo: [0, 1], hi: [1, 5], forms: Number(inner[1].replace(/,/g, '')), check_s: Number(innerT[3]), tag: '-v10' }]
      .concat(slabs.map((s) => ({ id: s.id, lo: s.lo, hi: s.hi, n: s.n, forms: s.forms, check_s: s.check_s, tag: '-v9' }))).sort((a, b) => a.lo[0] / a.lo[1] - b.lo[0] / b.lo[1]),
    js_s: Number(js[1]), kernel_factor: Number(js[2]),
    battery: { planted: +battery[1], kernel_f: +battery[2], cover_f: +battery[3], loader: +battery[1] - +battery[2] - +battery[3] }, more_forgeries: +more[1],
    binary: { agree: +bin[1], of: +bin[2], lo_s: Number(bin[3]), hi_s: Number(bin[4]) }, v9_v10_inputs: +v9[1],
    hol_tag: PIN.hol_tag, poly_tag: PIN.poly_tag,
    lean: { url: lean[1], version: lean[2], date: lean[3] }, sfm: { date: sfm[1], capture: sfm[2] } };
  need(work.regions.length === 5 && work.regions.every((r, i) => i === 0 || r.lo[0] * work.regions[i - 1].hi[1] === work.regions[i - 1].hi[0] * r.lo[1]) && work.regions[4].hi[0] * 2 === work.regions[4].hi[1], 'the five regions do not run from 0 to 1/2 back to back');
  need(work.battery.loader === 1, 'the battery’s counts no longer leave exactly one input for the loader');

  /* ------------------------------------------------------------ after the run: the scoring (harness/score/), read, never re-run */
  need(!run_open, 'the scoring records below are for a run that has ended; the run is open');
  const SC = JSON.parse(txt('harness/score/score.json'));
  const SCM = norm(txt('harness/score/SCORE.md'));
  need(SC.run && SC.run.start_utc === RUN.start_utc && SC.run.cap === RUN.cap && SC.run.families && SC.run.families.claude === RUN.families.claude && SC.run.families.gpt === RUN.families.gpt, 'score.json scored a run other than RUN.json’s');
  need(SC.key && SC.key.frozen_utc === FZ.frozen_utc && SC.key.freeze_file === 'FREEZE-2.json', 'score.json’s key is not the one FREEZE-2.json froze');
  const scoredAt = at('score.json scored_utc', Date.parse(SC.scored_utc));
  need(scoredAt > ended, 'score.json was scored before the run ended');
  need(SC.gate && Array.isArray(SC.gate.faults) && SC.gate.held === (SC.gate.faults.length === 0), 'score.json’s gate does not agree with its own faults');
  need(SC.gate.held && SCM.includes('**Gate held**: no `proved` on a false goal and no `refuted` on a true text.'), 'the gate did not hold, or SCORE.md no longer says it held: this page has no words for a failed gate');
  need(Array.isArray(SC.anomalies) && SC.anomalies.length === 0 && SCM.includes('Anomalies: none.'), 'the scoring reports anomalies');
  const CLASSES = ['T', 'P', 'P-vac', 'D-planted', 'D-true'];
  need(Object.keys(SC.classes).length === CLASSES.length && CLASSES.every((c) => Number.isInteger(SC.classes[c])) && CLASSES.reduce((a, c) => a + SC.classes[c], 0) === N, 'score.json’s classes are not the five, or do not add up to ' + N);
  const C0 = SC.counting;
  const judgedOf = (f) => f.statements.proved + f.statements.refuted;
  need(C0.run_lines === families.reduce((a, f) => a + f.attempts, 0), 'score.json counts other run attempts than attempts.jsonl gives');
  need(C0.judged === families.reduce((a, f) => a + judgedOf(f), 0) && SC.gate.judged_lines_checked === C0.judged && SC.gate.judged_outside_run === 0, 'score.json judged other attempts than attempts.jsonl gives');
  need(C0.rebuilt === C0.judged && C0.not_counted.length === 0 && SCM.includes(C0.rebuilt + ' of ' + C0.judged + ' REBUILT with the same decision') && SCM.includes('Judged but not counted: none. Every judged attempt counts.'), 'not every judged attempt was rebuilt and counted: this page has no words for that yet');
  need(C0.both_readers_pass + C0.style_only_flags_counted === C0.judged, 'the readers’ counts do not add up to the judged attempts');
  for (const f of families) {
    const nj = C0.not_judged_by_reason[f.id] || {};
    need((nj['cap reached'] || 0) === f.statements.cap && (nj['never attempted'] || 0) === f.statements.untouched && Object.keys(nj).every((k) => k === 'cap reached' || k === 'never attempted'), f.name + ': score.json’s not-judged statements are not attempts.jsonl’s');
  }
  /* the success rows, per class and family, each cross-read against SCORE.md's printed line (rounded outward to 0.1 %) */
  const p1 = (k, n) => (100 * k / n).toFixed(1);
  const lo1 = (x) => (Math.floor(x * 1000 + 1e-9) / 10).toFixed(1), hi1 = (x) => (Math.ceil(x * 1000 - 1e-9) / 10).toFixed(1);
  const iv = (o) => { need(o && Number.isInteger(o.k) && Number.isInteger(o.n) && o.n > 0 && Array.isArray(o.ci95) && o.ci95[0] <= o.k / o.n + 1e-12 && o.k / o.n <= o.ci95[1] + 1e-12, 'an interval of score.json does not hold its rate'); return { k: o.k, n: o.n, rate: p1(o.k, o.n), lo: lo1(o.ci95[0]), hi: hi1(o.ci95[1]) }; };
  const VARIANTS = [['claude', 'all'], ['claude', 'blind'], ['gpt', 'all']];
  const success = [];
  for (const c of CLASSES) for (const [fam, variant] of VARIANTS) {
    const r = SC.success.find((x) => x.cls === c && x.family === fam && x.variant === variant);
    need(r, 'score.json has no success row for ' + c + ', ' + fam + ', ' + variant);
    need(r.proved + r.refuted + r.not_judged + r.excluded === r.n && r.excluded === 0, 'the ' + c + ' row of ' + fam + ' (' + variant + ') does not add up, or excludes a judged attempt');
    need(variant !== 'all' || r.n === SC.classes[c], 'the ' + c + ' row of ' + fam + ' is not the whole class');
    need(r.success_is === (c === 'P' ? 'refuted' : 'proved') && r.success.k === r[r.success_is] && r.success.n === r.n, 'the ' + c + ' row of ' + fam + ' counts another success than the protocol’s');
    const row = { cls: c, family: fam, variant, n: r.n, proved: r.proved, refuted: r.refuted, not_judged: r.not_judged, success_is: r.success_is, success: iv(r.success) };
    if (c === 'P-vac' || c === 'D-planted') {
      need(r.beside && r.beside.k === r.refuted && r.either && r.either.k === r.proved + r.refuted, 'the ' + c + ' row of ' + fam + ' has no “refuted, also correct” or “either” column');
      row.beside = Object.assign({ name: r.beside.name }, iv(r.beside)); row.either = iv(r.either);
    } else need(!r.beside && !r.either, 'the ' + c + ' row of ' + fam + ' carries a second correct decision');
    for (const x of [row.success, row.beside, row.either].filter(Boolean)) need(SCM.includes(x.k + '/' + x.n + ' = ' + x.rate + ' % [' + x.lo + ', ' + x.hi + ']'), 'SCORE.md does not print ' + x.k + '/' + x.n + ' = ' + x.rate + ' % [' + x.lo + ', ' + x.hi + ']');
    success.push(row);
  }
  for (const f of families) {
    const all = success.filter((r) => r.family === f.id && r.variant === 'all');
    need(all.reduce((a, r) => a + r.proved, 0) === f.statements.proved && all.reduce((a, r) => a + r.refuted, 0) === f.statements.refuted, f.name + ': the classes’ proved and refuted do not add up to the judge’s log');
    const es = SC.early_stop[f.id];
    need(es && es.dplanted_text_refuted.length === all.find((r) => r.cls === 'D-planted').refuted && es.pvac_refuted.length === all.find((r) => r.cls === 'P-vac').refuted, f.name + ': the early stops are not the refuted decoys and vacuous statements');
  }
  /* the blind rows: the union of the two blinding audits' sets, cross-read against both audits' own files */
  const A1 = JSON.parse(txt('harness/audit/sets.json')), A2 = JSON.parse(ntxt('audit-astra/work/sets.json'));
  const srt = (a) => [...new Set(a)].sort();
  const same = (a, b) => JSON.stringify(srt(a)) === JSON.stringify(srt(b));
  const first = { CONTAMINATED: [...A1.claude.CONTAMINATED.used, ...A1.claude.CONTAMINATED.read_before_decision_use_not_shown], 'OTHER-FAMILY-VISIBLE': [...A1.claude.OTHER_FAMILY_VISIBLE.gpt_verdict_visible, ...A1.claude.OTHER_FAMILY_VISIBLE.gpt_three_failures_visible], 'SAME-FAMILY-REUSE': A1.claude.SAME_FAMILY_REUSE };
  const second = A2.claude;
  const SETS = ['CONTAMINATED', 'OTHER-FAMILY-VISIBLE', 'SAME-FAMILY-REUSE'];
  for (const s of SETS) {
    need(same(first[s], SC.blind.audits['claude audit'].claude[s]) && same(second[s], SC.blind.audits['astra audit'].claude[s]), 'score.json’s ' + s + ' is not the audits’ own');
    need(SC.blind.audits['claude audit'].gpt[s].length === 0 && SC.blind.audits['astra audit'].gpt[s].length === 0 && A2.gpt[s].length === 0, 'a blinding audit puts a GPT statement in ' + s + ': this page has no words for that yet');
  }
  need(A1.gpt.CONTAMINATED.length === 0 && A1.gpt.OTHER_FAMILY_VISIBLE.length === 0 && A1.gpt.SAME_FAMILY_REUSE.length === 0, 'the first audit puts a GPT statement in a set');
  const uC = srt([...first.CONTAMINATED, ...second.CONTAMINATED]), uV = srt([...first['OTHER-FAMILY-VISIBLE'], ...second['OTHER-FAMILY-VISIBLE']]);
  const excl = srt([...uC, ...uV]);
  need(same(excl, SC.blind.excluded.claude) && SC.blind.excluded.gpt.length === 0, 'score.json leaves out other statements than the union of the two audits');
  const blindRows = success.filter((r) => r.variant === 'blind');
  const blindJudged = blindRows.reduce((a, r) => a + r.proved + r.refuted, 0);
  need(blindRows.reduce((a, r) => a + r.n, 0) === N - excl.length && SCM.includes((N - excl.length) + ' remain (' + blindJudged + ' of them judged and counted)'), 'the blind rows are not the ' + (N - excl.length) + ' statements left');
  const blind = { rule: 'the union of the two audits’ CONTAMINATED and OTHER-FAMILY-VISIBLE sets, the stricter reading', left_out: excl.length, contaminated: uC.length, visible_only: excl.length - uC.length, remaining: N - excl.length, judged_remaining: blindJudged, gpt_left_out: 0,
    audits: SETS.map((s) => ({ set: s, first: srt(first[s]).length, second: srt(second[s]).length, union: srt([...first[s], ...second[s]]).length })) };
  /* the two audits, in words read from them */
  const AU = norm(txt('harness/audit/AUDIT.md'));
  const cov = /Log coverage: (\d+) Claude tool calls \([^)]*\) and (\d+) Codex shell commands/.exec(AU) || die('AUDIT.md no longer gives its log coverage');
  const notClean = /\| agents not clean \| (\w+) of 9 \((b\d)–(b\d)\) \| (\w+) of 9 \|/.exec(AU) || die('AUDIT.md no longer counts the agents that are not clean');
  const protoReads = /\| reads of RUN-PROTOCOL\.md after 13:29 that showed the S003 sentence \| (\d+) \([^)]*\) \| (\d+) \([^)]*\) \|/.exec(AU) || die('AUDIT.md no longer counts the reads of the protocol’s S003 sentence');
  has(AU, 'That is the same session as the nine Claude provers, so this is not an outside reading of the Claude family.', 'AUDIT.md');
  const au1 = tw(/\*\*(\d\d:\d\d) BLINDING AUDIT done\*\*/, 'the first blinding audit');
  for (const n of ['All nine GPT sessions clean; six Claude agents not clean (b1–b6).', 'Nobody read the key, LEMMAS.md, the other family\'s folder or logs, or ran HOL outside the judge',
    'Undisclosed by the agents and found here: claude-b1 and claude-b2 read the whole non-blind S33-9 script at 11:08–11:09', 'claude-b3 also read freeze-1 (texts only)']) has(WN, n, 'the work log');
  const au2 = tw(/\*\*(\d\d:\d\d) Astra's independent re-audit\*\*/, 'the second blinding audit');
  for (const n of ['agrees on every agent and every read that matters', 'zero cross-family reads and zero prover-run HOL builds in both', 'Its caveat: the WORKLOG it had to read already carried the first audit\'s headline, which limits independence.', 'SCORING USES THE UNION (the stricter of the two)']) has(WN, n, 'the work log');
  const ncW = /All nine GPT sessions clean; (\w+) Claude agents not clean \(b1–b6\)/.exec(WN) || die('the work log no longer counts the Claude agents that are not clean');
  need(WORDNUM[ncW[1]] === Number(notClean[1]) && notClean[4] === '0', 'AUDIT.md’s count of agents not clean is not the work log’s');
  notClean[1] = ncW[1];
  /* the leak of 14:06: the protocol file named one statement and both families' outcomes on it */
  const lk = tw(/- (\d\d:\d\d) A leak of my own, closed: the 13:29 ruling appended to harness\/RUN-PROTOCOL\.md \(readable by agents\) named S003 and both families' outcomes on it\./, 'the protocol’s leak of 14:06');
  has(WN, 'Both families had already judged S003, so no attempt on S003 could change; the text could still hint at the role of statements sharing S003\'s text.', 'the work log');
  /* the two readers, and the ruling of 16:19 */
  const rdA = tw(/\*\*(\d\d:\d\d) Astra reader done\*\* \([^)]*\): (\d+) of (\d+) pass all seven items; (\d+) flagged — item 2 \(top-level ML\) (\d+):/, 'the GPT-6.2 reader’s result');
  const rdA4 = /item 4 \(ancestors\) (\d+): seq/.exec(WN) || die('the work log no longer counts the reader’s item-4 flags');
  const rdC = tw(/\*\*(\d\d:\d\d) Claude reader done\*\* \([^)]*\): (\d+) of (\d+) pass all seven items, 0 flags\./, 'the Claude reader’s result');
  has(WN, 'no reader found a soundness problem', 'the work log');
  const r4 = tw(/- (\d\d:\d\d) RULING \(operator, dialog\): style-only reader flags \(items 2 and 4 alone, the other reader passing, no flag on 1\/3\/5\/6\/7\) do not exclude an attempt; all (\d+) are listed in the report\./, 'the 16:19 ruling on the readers’ flags');
  has(PN, norm('## Ruling of 2026-11-25 ' + r4[1] + ' UTC (the operator, dialog), before the key is unlocked: style-only reader flags'), 'RUN-PROTOCOL.md');
  has(PN, 'Ruled: a flag on item 2 or 4 alone does NOT exclude an attempt when the other reader passed it and neither reader flagged item 1, 3, 5, 6 or 7.', 'RUN-PROTOCOL.md');
  const RF = SC.reader_flags;
  need(RF.length === C0.style_only_flags_counted && RF.length === Number(r4[2]) && RF.length === Number(rdA[4]) && Number(rdA[2]) === C0.both_readers_pass && Number(rdA[3]) === C0.judged && Number(rdC[2]) === C0.judged && Number(rdC[3]) === C0.judged, 'the readers’ counts in the work log are not score.json’s');
  need(RF.every((x) => x.claude_flags === 'none' && (x.astra_flags === '2' || x.astra_flags === '4') && x.counts === true && /style-only flag on item [24]/.test(x.why || '')), 'a reader flag is not a style-only flag of the GPT-6.2 reader that the 16:19 ruling counts');
  const readers = { scripts: C0.judged, claude_pass: Number(rdC[2]), gpt_pass: Number(rdA[2]), gpt_flagged: RF.length, item2: RF.filter((x) => x.astra_flags === '2').length, item4: RF.filter((x) => x.astra_flags === '4').length,
    flagged_gpt: RF.filter((x) => x.family === 'gpt').length, flagged_claude: RF.filter((x) => x.family === 'claude').length, gpt_done: rdA[1], claude_done: rdC[1] };
  need(readers.item2 === Number(rdA[5]) && readers.item4 === Number(rdA4[1]), 'the readers’ flags by item are not the work log’s');
  /* the scoring program, frozen before the key, and the key */
  const fr0 = tw(/- (\d\d:\d\d) SCORING PROGRAM FROZEN before the key: harness\/score\.py sha256 ([0-9a-f]{64}) \((\d+)\/(\d+) tests on synthetic keys/, 'the scoring program’s freeze');
  need(fr0[2] === SC.scorer.sha256 && fr0[3] === fr0[4], 'the scoring program that ran is not the one frozen before the key, or a test failed');
  need(fs.existsSync(path.join(SRC, 'harness/score/SEAL-PRE-KEY.sha256.ots')) && /stamped with OpenTimestamps/.test(WN), 'the scoring inputs’ OpenTimestamps seal is gone');
  const ku = tw(/\*\*(\d\d:\d\d) KEY UNLOCKED by the operator \(unlock-key\.sh, checked against FREEZE-2\) and SCORED\*\*/, 'the unlocking of the key');
  const tokens = Object.fromEntries(families.map((f) => {
    const t = SC.tokens[f.id];
    need(t && t.total === f.tokens.total && t.missing.length === 0 && t.judged === judgedOf(f), f.name + ': score.json’s tokens are not tokens.tsv’s');
    return [f.id, { total: t.total, judged: t.judged, per_judged: Math.round(t.per_judged) }];
  }));
  for (const f of families) need(SCM.includes(N_(tokens[f.id].total) + ' | ' + tokens[f.id].judged + ' | ' + N_(tokens[f.id].per_judged) + ' |'), 'SCORE.md does not print ' + f.name + '’s tokens as score.json gives them');
  const scored = { scored_utc: SC.scored_utc.replace(/(\d\d:\d\d:\d\d)Z$/, '$1Z'), unlocked: ku[1], frozen_scorer: fr0[1], scorer_tests: fr0[3], gate_held: true, judged: C0.judged, rebuilt: C0.rebuilt, run_lines: C0.run_lines,
    classes: SC.classes, success, blind, tokens, readers, ruling_readers: r4[1] };

  /* ------------------------------------------------------------ Layer 1: the three soundness theorems and the five certificates (assembly/) */
  const CO = txt('assembly/check.out');
  const sound = [...CO.matchAll(/^SOUND (\w+) EXACT_(S\d{3}) (\w+) oracles \[([^\]]*)\] axioms \[([^\]]*)\] hyps (\d+)$/gm)].map((m) => ({ name: m[1], statement: m[2], exact: m[3] === 'true', clean: m[4] === 'DISK_THM' && m[5] === '' && m[6] === '0' }));
  need(sound.length === 3 && sound.map((s) => s.name).join(' ') === 'slab_check_sound inner_check_sound cover_all_sound' && sound.every((s) => s.exact && s.clean), 'check.out no longer reads back the three soundness theorems exactly, DISK_THM only, no axiom, no hypothesis');
  const holdsAll = (CO.match(/^HOLDS /gm) || []).length, holdsOk = [...CO.matchAll(/^HOLDS delta3_\w+_sound S\d{3}_holds oracles \[DISK_THM\] axioms \[\] hyps 0$/gm)].length;
  need(holdsAll > 0 && holdsAll === holdsOk, 'a lemma read back in check.out carries a tag, an axiom or a hypothesis');
  const axl = [...CO.matchAll(/^AXIOMS_IN (\w+) (.+)$/gm)];
  need(axl.length === 1 && axl[0][1] === 'bool' && axl[0][2].split(',').sort().join(',') === 'BOOL_CASES_AX,ETA_AX,INFINITY_AX,SELECT_AX', 'check.out finds axioms other than bool’s four');
  const anc = Number((/^ANCESTRY_SIZE (\d+)$/m.exec(CO) || die('check.out no longer gives the ancestry’s size'))[1]);
  const thms = [...CO.matchAll(/^THM (\w+) oracles \[([^\]]*)\] axioms \[([^\]]*)\] hyps (\d+)$/gm)];
  need(thms.map((m) => m[1]).join(' ') === 'slabA_bound_n slabB_bound_n slabC_bound_n slabD_bound_n inner_bound_n cover_bound_regions delta3_layer1' && thms.every((m) => m[2] === 'DISK_THM' && m[3] === '' && m[4] === '0'), 'check.out no longer reads back the six bounds and delta3_layer1, DISK_THM only');
  const checks = [...CO.matchAll(/^CHECK (\w+)_check oracles \[DISK_THM\] axioms \[\] hyps 0 rhs (\w+)$/gm)];
  need(checks.length === 6 && checks.every((m) => m[2] === 'T'), 'check.out no longer has the six kernel checks returning T');
  /* each slab's bound: the exact rational in check.out, its region and its grid, and the decimal the work log states */
  const big = (s) => BigInt(s);
  const bounds = ['A', 'B', 'C', 'D'].map((k) => {
    const m = new RegExp('THM slab' + k + '_bound_n [^\\n]*\\n\\|- !y\\. in_box (\\d+) y /\\\\ qv (\\d+) (\\d+) <= mval slab' + k + '_grid y /\\\\\\s+mval slab' + k + '_grid y <= qv (\\d+) (\\d+) ==>\\s+qv (\\d+) (\\d+) <=\\s+Ltheta slab' + k + '_ab').exec(CO) || die('check.out no longer states slab ' + k + '’s bound');
    const v = Number(big(m[6]) * 10n ** 40n / big(m[7])) / 1e40;
    return { id: 'slab' + k, n: Number(m[1]), lo: [Number(m[2]), Number(m[3])], hi: [Number(m[4]), Number(m[5])], digits_num: m[6].length, digits_den: m[7].length, approx: v.toExponential(4) };
  });
  const approxLine = tw(/A ≈ ([\d.]+e-\d+), B ≈ ([\d.]+e-\d+), C ≈ ([\d.]+e-\d+), D ≈ ([\d.]+e-\d+) as exact rationals/, 'the slab bounds’ decimals');
  need(bounds.every((b, i) => b.approx === approxLine[i + 1]), 'the slab bounds in check.out are not the decimals the work log states');
  for (const b of bounds) { const r = work.regions.find((x) => x.id === b.id); need(r && r.lo[0] * b.lo[1] === b.lo[0] * r.lo[1] && r.hi[0] * b.hi[1] === b.hi[0] * r.hi[1], b.id + '’s region in check.out is not the certificate’s'); }
  const AS = norm(txt('assembly/README.md'));
  const fg = /The battery \(`instruments\/delta3\/battery\.js`\) has (\d+) forgeries: (\d+) `red\(…\)` certificate forgeries and (\d+) cover forgeries\. The frozen checker refuses all (\d+) on the HOL side: (\d+) by the kernel \(`⇔ F`: (\d+) battery certificates, (\d+) covers\) and (\d+) by the loader before the kernel/.exec(AS) || die('assembly/README.md no longer recounts the forgeries');
  need(+fg[1] === +fg[4] && +fg[2] + +fg[3] === +fg[1] && +fg[5] + +fg[8] === +fg[1] && +fg[6] + +fg[7] === +fg[5], 'the forgery recount does not add up');
  has(AS, 'The "6 more" of the draft README are the same forgeries', 'assembly/README.md');
  has(AS, 'it was never run on the frozen checker.', 'assembly/README.md');
  const rp = /Third fresh-copy replay of the staged tree \((\d+) files, SHA256SUMS [0-9a-f]+…; (\d\d:\d\d:\d\d)–(\d\d:\d\d:\d\d)\): \*\*exit 0, PASSED, ([\d.]+) s, peak ([\d.]+) GB\*\*; the same (\d+) verdicts/.exec(AS) || die('assembly/README.md no longer records the third fresh-copy replay');
  has(AS, 'no CONTAMINATED proof on any chain', 'assembly/README.md');
  const l1 = tw(/\*\*(\d\d:\d\d) LAYER 1 HOLDS\*\*/, 'Layer 1');
  const sb = tw(/\*\*(\d\d:\d\d) NON-BLIND BUILDER \(hol4\/delta3\/assembly\/, (\d\d:\d\d)–(\d\d:\d\d)\):\*\* S149 PROVED/, 'the builder’s S149');
  has(WN, 'The slab soundness theorem delta3_slab_sound.slab_check_sound is assembled with no hypothesis', 'the work log');
  const cr = tw(/\*\*(\d\d:\d\d) CLEAN-ROOM proofs\*\* \(hol4\/delta3\/cleanroom\/, a fresh Claude agent that saw only the public brief, the definitions, the judge code and the HOL4 sources\): S040 PROVED/, 'the clean-room proofs');
  has(WN, 'With these, NO lemma on the Layer-1 chain needs a contaminated proof.', 'the work log');
  has(WN, 'no read of any earlier proof, the key, LEMMAS.md, the builder\'s folder or transcripts', 'the work log');
  const repoB = bullets.find((b) => b.includes('github.com/carlostoledo1891/delta3-hol4, PUBLIC')) || die('the work log no longer records the public repository');
  const repoAt = lead(repoB);
  at('the repository', repoAt);
  const ci = /CI run \d+ \(replay\) started (\d\d:\d\d:\d\d)Z/.exec(repoB) || die('the work log no longer says when the repository’s CI replay started');
  /* the repository's CI, once the work log records it: the first replay on GitHub's runner, and the CakeML job started */
  const ciG = /- (\d\d:\d\d) \*\*CI GREEN\*\*: the repository's first run \(push, (\d\d:\d\d)–(\d\d:\d\d) UTC; run \d+\) built Poly\/ML and HOL4 from scratch on GitHub's runner and replayed everything in (\d+) min (\d+) s: (\d+) theorem files identical to their records \+ r24 refused by the loader; read-back exact\./.exec(WN);
  const cake = /The CakeML job started by hand \(workflow_dispatch, run \d+, (\d\d:\d\d) UTC; ~(\d+) h expected\)/.exec(WN);
  if (ciG) { tAt(ciG[1], 'CI green'); need(ciG[2] === ci[1].slice(0, 5), 'the CI run the work log calls green is not the one it says started'); }
  if (cake) tAt(cake[1], 'the CakeML job');
  /* the CakeML job's result and the HOL4 pull request, once the work log records them */
  const cakeG = /- (\d\d:\d\d) \*\*CakeML job GREEN on CI\*\* \(workflow_dispatch run (\d+): replay [\d:–]+, cakeml (\d\d:\d\d):\d\d–(\d\d:\d\d):\d\d UTC, (\d+) min on GitHub's runner: the toolchain built from nothing, the binary decides the (\d+) inputs\)/.exec(WN);
  if (cakeG) { tAt(cakeG[1], 'CakeML green'); need(cake && /The CakeML job started by hand \(workflow_dispatch, run (\d+),/.exec(WN)[1] === cakeG[2], 'the CakeML job the work log calls green is not the one it says started'); }
  const prO = /- (\d\d:\d\d) HOL4 PULL REQUEST opened on the operator's word .*? opened as a DRAFT .*?: (https:\/\/github\.com\/HOL-Theorem-Prover\/HOL\/pull\/(\d+))/.exec(WN);
  const prR = prO && /- (\d\d:\d\d) HOL4 PULL REQUEST #(\d+) marked READY for review/.exec(WN);
  if (prO) tAt(prO[1], 'the HOL4 pull request');
  /* the work log's times are of the run's day; a line written after midnight UTC (the ready mark, 00:43 on 26 Nov) is
     read as the next day, and it must still say so in its own words */
  const nextDay = (hm, label) => { need(/\(26 Nov;/.test(WN) || label !== 'ready', 'a next-day line without its date'); return at(label, Date.parse(DAY + 'T' + hm + ':00Z') + 86400000); };
  const prRAt = prR ? nextDay(prR[1], 'ready') : null;
  if (prR) { need(prRAt > tAt(prO[1], 'the HOL4 pull request'), 'the pull request is marked ready before it was opened'); need(prR[2] === prO[3], 'the pull request marked ready is not the one opened'); }
  const RM = norm(txt('assembly/repo/delta3-hol4/README.md'));
  for (const n of ['**The three soundness theorems.** If `slab_check` accepts, the slab polynomial L_θ is at least the claimed bound on the whole region.', 'A GitHub Actions workflow (`.github/workflows/replay.yml`) runs it on every push.',
    '**The model constants are data.**', '**The analytic reduction is not in HOL4.**', '**Each certificate lives on its own grid**']) has(RM, norm(n), 'the repository’s README');
  const proved = { theorems: sound.map((s) => s.name), lemmas_read_back: holdsOk, ancestry: anc, axioms: axl[0][2].split(','), checks_T: checks.length, bounds,
    forgeries: { total: +fg[1], certs: +fg[2], covers: +fg[3], kernel: +fg[5], loader: +fg[8] }, replay: { files: +rp[1], s: Number(rp[4]), peak_gb: Number(rp[5]), verdicts: +rp[6] },
    layer1_at: l1[1], slab_sound_at: sb[1], cleanroom_at: cr[1], repo: { url: 'https://github.com/carlostoledo1891/delta3-hol4', public_at: hm(repoAt), ci_started: ci[1].slice(0, 5),
      ci_green: ciG ? { at: ciG[1], from: ciG[2], to: ciG[3], took: ciG[4] + ' min ' + ciG[5] + ' s', theorem_files: Number(ciG[6]) } : null, cakeml_started: cake ? { at: cake[1], expected_h: Number(cake[2]) } : null,
      cakeml_green: cakeG ? { at: cakeG[1], run: cakeG[2], from: cakeG[3], to: cakeG[4], min: Number(cakeG[5]), inputs: Number(cakeG[6]) } : null,
      pr: prO ? { url: prO[2], number: Number(prO[3]), opened_at: prO[1], ready_at: prR ? prR[1] : null } : null } };

  /* ------------------------------------------------------------ how each lemma on the chain was made (assembly/SOURCES.tsv) */
  const ST = txt('assembly/SOURCES.tsv').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  const sh = ST[0].split('\t');
  need(['lemma', 'part', 'name', 'statement', 'used_by', 'family', 'status'].every((k) => sh.includes(k)), 'SOURCES.tsv’s header has changed');
  const HOW = { 'blind gpt': 'gpt-blind', 'blind claude': 'claude-blind', 'OTHER-FAMILY-VISIBLE claude': 'claude-visible', 'CLEAN-ROOM claude': 'clean-room', 'NON-BLIND claude': 'builder' };
  const lemmas = ST.slice(1).map((l, i) => {
    const r = Object.fromEntries(l.split('\t').map((v, j) => [sh[j], v]));
    const how = HOW[r.status + ' ' + r.family];
    need(r.lemma === 'L' + String(i + 1).padStart(2, '0') && how && /^(SLAB|STRICT|INNER|COVER)$/.test(r.part) && /^S\d{3}$/.test(r.statement) && /^[a-z0-9_]+$/.test(r.name), 'SOURCES.tsv row ' + (i + 1) + ' is not a lemma with a known source');
    need(how !== 'claude-blind' || !excl.includes(r.statement), r.lemma + ' is called blind, yet the audits left its statement out');
    need(how !== 'claude-visible' || (uV.includes(r.statement) && !uC.includes(r.statement)), r.lemma + ' is called other-family-visible, yet the audits do not say so');
    const t = /(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)/.exec(r.why || '');
    need(!(how === 'clean-room' || how === 'builder') || t, r.lemma + ': SOURCES.tsv gives no time for a proof made after scoring');
    if (t) at(r.lemma + ' proved', Date.parse(t[1]));
    const only = r.alternatives === '-' && /the only accepted proof/.test(r.why || '');
    need(how !== 'builder' || /no accepted proof in either family \(Claude 3 attempts, GPT 3, all failed\); the builder, who had read the key, judged claude-b\d's third script with one fix/.test(r.why || ''), r.lemma + ': SOURCES.tsv no longer says how the builder made it');
    need(how !== 'claude-visible' || /saw GPT's three failed attempts before deciding/.test(r.why || ''), r.lemma + ': SOURCES.tsv no longer says what its agent saw');
    need(how !== 'clean-room' || /a fresh agent that never saw any earlier proof of it \(audited\), to replace the run's only accepted proof, which was CONTAMINATED; proved at its first attempt by a copy of the frozen judge/.test(r.why || ''), r.lemma + ': SOURCES.tsv no longer says how the clean room made it');
    need(how === 'gpt-blind' || how === 'clean-room' || how === 'builder' || only, r.lemma + ': a Claude proof on the chain that is not the only accepted one');
    return Object.assign({ id: r.lemma, part: r.part, name: r.name, statement: r.statement, used_by: r.used_by.split(','), how, only }, t && (how === 'clean-room' || how === 'builder') ? { proved_at: t[1] } : {});
  });
  for (const n of ['Every one of the 42 proofs, the three after scoring included, was accepted by the same judge code under the same frozen statements.', 'None of this changes the scores, which count only blind attempts.',
    'Where both families had a blind proof, I took the one judged first.', 'L26 (diagonal dominance), L29 (strictness)',
    'L26 and L29 had only one accepted proof in the run, and both of those were built on an earlier proof written by an agent that had read the answer key.',
    'The two contaminated proofs stay in `proofs/accepted/` as the run\'s record.', 'The decrypted answer key is in `agents/key/`.', 'That run is logged here in full.',
    'also CakeML\'s basis, the translation, the compile and the 52 binary runs']) has(RM, n, 'the repository’s README');
  has(AS, 'The only true statement neither family proved.', 'assembly/README.md');
  const howN = (h) => lemmas.filter((x) => x.how === h).length;
  const srcLine = /Sources now: (\d+) GPT blind, (\d+) Claude blind, (\d+) Claude OTHER-FAMILY-VISIBLE \(S\d{3}\), (\d+) CLEAN-ROOM \([^)]*\), (\d+) builder \(S\d{3}\); no CONTAMINATED proof on any chain/.exec(AS) || die('assembly/README.md no longer counts the chain’s sources');
  need([howN('gpt-blind'), howN('claude-blind'), howN('claude-visible'), howN('clean-room'), howN('builder')].join() === srcLine.slice(1, 6).join() && lemmas.length === srcLine.slice(1, 6).reduce((a, b) => a + +b, 0), 'SOURCES.tsv’s sources are not assembly/README.md’s count');
  need(sound.every((s) => lemmas.some((x) => x.statement === s.statement)), 'a soundness theorem is not a lemma of the chain');

  /* ------------------------------------------------------------ the day after the run: each event read from the work log */
  const rb = tw(/\*\*(\d\d:\d\d) REBUILDS DONE: (\d+) of (\d+) accepted attempts REBUILT\*\*/, 'the rebuilds');
  need(+rb[2] === C0.rebuilt && +rb[3] === C0.judged, 'the work log’s rebuild count is not score.json’s');
  const after = [
    { at: iso(tAt(au1[1], 'audit 1')), title: 'The first blinding audit', text: 'A Claude agent reads every agent’s tool log: the GPT family is clean, ' + notClean[1] + ' of the nine Claude agents are not.' },
    { at: iso(tAt(rb[1], 'rebuilds')), title: 'Every accepted proof rebuilt', text: rb[2] + ' of ' + rb[3] + ' rebuilt alone, with the same decision; the judge machine is deleted.' },
    { at: iso(tAt(au2[1], 'audit 2')), title: 'The second blinding audit', text: 'A GPT-6.2 agent audits the same logs on its own and agrees on every read that matters.' },
    { at: iso(tAt(r4[1], 'readers')), title: 'Both readers done, and a ruling', text: 'No reader finds a soundness problem; style-only flags do not exclude an attempt.' },
    { at: iso(tAt(ku[1], 'key')), title: 'The key is unlocked, and the run scored', text: 'The gate holds in both families.' },
    { at: iso(tAt(sb[1], 'slab sound')), title: 'The slab soundness theorem', text: 'The one true statement neither family proved is finished by a builder that had read the key, and the slab theorem is assembled.' },
    { at: iso(tAt(l1[1], 'layer 1')), title: 'Layer 1 holds', text: 'The three soundness theorems, and the five certificates through them.' },
    { at: iso(tAt(cr[1], 'clean room')), title: 'Two lemmas proved again, clean', text: 'A fresh agent that never saw their earlier proofs proves the two lemmas whose only accepted proofs were contaminated.' },
    { at: iso(repoAt), title: 'The repository is public', text: 'Its replay runs on every push.' }];
  if (ciG) after.push({ at: iso(tAt(ciG[1], 'CI green')), title: 'The replay passes on CI', text: 'On GitHub’s own runner, Poly/ML and HOL4 built from scratch, everything replayed in ' + ciG[4] + ' min ' + ciG[5] + ' s; the read-back is exact.' + (cake ? ' The CakeML job is started by hand.' : '') });
  if (prO) after.push({ at: iso(tAt(prO[1], 'the HOL4 pull request')), title: 'The dominance lemma offered to HOL4', text: 'Pull request #' + prO[3] + ' is opened as a draft, so that HOL4’s build runs on it first.' });
  if (cakeG) after.push({ at: iso(tAt(cakeG[1], 'CakeML green')), title: 'The CakeML job passes on CI', text: 'On GitHub’s own runner, from nothing: CakeML’s basis, the translation, the compile and the ' + cakeG[6] + ' binary runs, in ' + cakeG[5] + ' min (' + cakeG[3] + '–' + cakeG[4] + ' UTC).' });
  if (prR) after.push({ at: iso(prRAt), title: 'The pull request is ready for review', text: 'Its build passed in the fork; pull request #' + prR[2] + ' is marked ready for HOL4’s maintainers.' });
  events.push(...after);
  events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  /* ------------------------------------------------------------ what happens next, each read from its source */
  const WF = txt('assembly/repo/delta3-hol4/.github/workflows/replay.yml');
  need(/^# The CakeML job \(replay\.sh --cakeml\) is run by hand or weekly:/m.test(WF) && /has not been run on one\.$/m.test(WF) && /^ {2}cakeml:$/m.test(WF) && /if: github\.event_name == 'workflow_dispatch' \|\| github\.event_name == 'schedule'/.test(WF), 'the workflow no longer says its CakeML job runs by hand or weekly and has not run on a standard runner');
  if (cakeG) has(RM, norm('CakeML job green on CI (' + cakeG[5] + ' min): run [' + cakeG[2] + ']'), 'the repository’s README');
  else has(RM, 'In this repository\'s layout it has not been run yet; in CI it runs by hand or weekly.', 'the repository’s README');
  const binW = work.binary;
  const LR = ntxt('astra-lean-slab/REPORT.md'), LRN = norm(LR), LP = norm(ntxt('control-room-replay-lean/REPLAY-NOTE.md'));
  const leanT = /^L1: PASS ([\d.]+) s, ([\d.]+) GB$/m.exec(LR) || die('the Lean trial’s report no longer opens with its result');
  has(LRN, 'The other four certificates have no Lean verdict from this run.', 'the Lean trial’s report');
  has(LRN, 'all 1,998 forms with multiplicity', 'the Lean trial’s report');
  const leanRe = /(\d+) of (\d+) Lean invocations exit 0/.exec(LP) || die('the Lean replay note no longer counts its runs');
  need(leanRe[1] === leanRe[2], 'the Lean replay did not pass');
  const slabC = work.regions.find((r) => r.id === 'slabC');
  need(slabC.forms === 1998, 'the Lean trial’s slab is not slab C (1,998 forms)');
  const UP = norm(txt('upstream/README.md'));
  has(UP, 'Nothing has been sent anywhere; the pull request is the operator\'s to open.', 'upstream/README.md');
  has(UP, 'The pull request package (title, body, commit message, release-notes patch, steps) is in `pr/`; the operator opens it.', 'upstream/README.md');
  const next = [
    ...(cakeG ? [] : [{ title: 'The CakeML job on CI', short: 'CakeML on CI', state: cake ? 'started ' + cake[1] + ' UTC, running' : 'set up, not yet run', text: 'The repository’s replay runs on every push. Its second job, which also builds CakeML’s basis, translates and compiles the checker and runs the binary on all ' + binW.of + ' inputs, runs by hand or weekly. '
      + (cake ? 'It was started by hand at ' + cake[1] + ' UTC and is expected to take about ' + cake[2] + ' h; until it ends, it has not run on a standard CI runner nor in the repository’s own layout.' : 'It has not yet run on a standard CI runner, nor in the repository’s own layout.') }]),
    { title: 'A bridge to Lean, as a plan', short: 'Lean bridge', state: 'a plan; one trial so far', text: 'The plan: decide the certificates in Lean’s own kernel as well, read the data back and refuse the forgeries there, and set the result beside the Lean formalisation of the full statement by Snively. So far one slab has been decided in Lean’s kernel, as a trial before the run, in ' + Math.round(Number(leanT[1])) + ' s (HOL4: ' + slabC.check_s.toFixed(2) + ' s); the other four have no Lean verdict.' },
    prO ? { title: 'The dominance lemma, offered to HOL4', short: 'HOL4 pull request', state: prR ? 'ready for review' : 'open as a draft', text: 'The lemma that weighted diagonal dominance gives positive (semi)definiteness is offered to the HOL4 repository as pull request #' + prO[3] + ' (' + prO[2] + '). '
        + (prR ? 'Its build passed in the fork and it is marked ready for review; whether it is merged is the HOL4 maintainers’ decision.' : 'It is open as a draft while HOL4’s build runs on it; it is marked ready for review only if that build is green.') }
      : { title: 'The dominance lemma, offered to HOL4', short: 'HOL4 pull request', state: 'prepared, not opened', text: 'The lemma that weighted diagonal dominance gives positive (semi)definiteness is prepared as a pull request to the HOL4 repository. Opening it is Carlos Toledo’s step; nothing has been sent.' }];

  /* ------------------------------------------------------------ what went wrong, continued: the protocol's sentence, the audits, the readers */
  gaps.push(
    { id: 'protocol', when: lk[1], title: 'A sentence in the protocol named one statement and both families’ outcomes on it',
      happened: 'The text of the 13:29 ruling, added to the protocol file the agents may read, named one statement and how both families had decided it. Both had already decided it, so no attempt on it could change; the sentence could still hint at the role of the statements that share its text.',
      done: 'At ' + lk[1] + ' UTC the statement and its outcomes were taken out of the protocol file; the case is kept in the private work log.',
      scoring: 'The blinding audit counted the reads of the protocol after 13:29 that showed the sentence: ' + protoReads[1] + ' by Claude agents, ' + protoReads[2] + ' by a GPT session.' },
    { id: 'audits', when: au1[1], title: 'What the two blinding audits found',
      happened: 'After the run, a Claude agent read every agent’s tool log (' + N_(cov[1]) + ' Claude tool calls, ' + N_(cov[2]) + ' GPT shell commands). All nine GPT sessions were clean; ' + notClean[1] + ' of the nine Claude agents were not. It found two reads the agents had not reported: two Claude agents read the whole proof from before the run in the run’s first minutes, and a third read the texts of the first statement list. Nobody read the answer key or the other family’s folder, or ran HOL4 outside the judge.',
      done: 'A GPT-6.2 agent then audited the same logs on its own (at ' + au2[1] + ' UTC). It agreed on every agent and every read that matters, and differed on the size of three sets (the table below). Scoring uses the union of the two, the stricter reading.',
      scoring: N_(blind.left_out) + ' of the Claude family’s statements are left out of its blind rows: ' + blind.contaminated + ' where an agent used or read the material from before the run, and ' + blind.visible_only + ' more where an agent could have seen the GPT family’s outcome first. ' + blind.remaining + ' statements remain. The GPT family has none left out.' },
    { id: 'readers', when: r4[1], title: 'The two readers disagreed on style in ' + readers.gpt_flagged + ' scripts',
      happened: 'Every accepted script was read by two agents, each alone, against a seven-item checklist; no person read them. The Claude reader passed all ' + readers.scripts + '. The GPT-6.2 reader passed ' + readers.gpt_pass + ' and flagged ' + readers.gpt_flagged + ' on two style items only: top-level code in the script (' + readers.item2 + ') and two extra standard HOL4 theories (' + readers.item4 + '). Neither reader found a soundness problem.',
      done: 'Ruled at ' + r4[1] + ' UTC, before the key was opened: a flag on one of those two style items alone, with the other reader passing and no flag on the five other items, does not exclude an attempt. All ' + readers.gpt_flagged + ' are listed, with both readers’ reasons, in the scoring report.',
      scoring: 'Every one of the ' + readers.scripts + ' accepted attempts counts.' });
  rulings.push({ when: r4[1], text: 'A reader’s flag on style alone, with the other reader passing, does not exclude an attempt. All ' + readers.gpt_flagged + ' such flags are listed in the scoring report.' });
  limitsKnown.push({ text: 'The blinding audits are agent audits. The first was done by a Claude agent of the same session as the nine Claude provers; the second, by a GPT-6.2 agent, read a work log that already carried the first one’s headline.' },
    { text: 'Each family’s tokens are counted by its own tool (the Agent tool’s report for Claude, Codex’s count for GPT), so the two totals are not one measure.' });

  /* ------------------------------------------------------------ the clock */
  for (const [label, ms] of times) need(ms <= clock, 'a state is ahead of the clock: ' + label + ' says ' + new Date(ms).toISOString() + ', the clock reads ' + new Date(clock).toISOString());
  const sig = (run_open ? 'open' : 'ended') + ' ' + families.map((f) => f.id + ':' + f.batches.map((b) => b.state[0]).join('')).join(' ') + ' gaps:' + gaps.length + ' events:' + events.length
    + ' scored:1 layer1:1 lemmas:' + lemmas.length + ' next:' + next.length + ' ci:' + (ciG ? 1 : 0) + ' cake:' + (cakeG ? 2 : cake ? 1 : 0) + ' pr:' + (prR ? 2 : prO ? 1 : 0);
  const out = {
    what: 'The state of the δ₃-in-HOL4 work and its blind benchmark as the live page /delta3-hol4/ shows it, written by tools/delta3-hol4-live-records.js from the run’s private files in hol4/delta3/ and its notes (read-only, not published): aggregates and dated facts only; no statement’s outcome while the run was open; after scoring, the scorer’s totals, the audits’ set sizes, the Layer-1 read-back and the chain’s sources.',
    as_of: new Date(asOf).toISOString().slice(0, 16) + 'Z', sig, run_open,
    run: { start_utc: RUN.start_utc, ended_utc: ended ? iso(ended) : null, cap: RUN.cap, statements: N, batches: batches.length, batch_size: size, in_flight: inFlight0,
      claude_in_flight_from: { at: iso(tAt(pace[1], 'pace')), max: Number(pace[2]) }, pause: { from: iso(pause.from), stopped: iso(pause.stopped), to: iso(pause.to), lasted: pause.lasted }, limits, uniform, hol_tag: PIN.hol_tag, poly_tag: PIN.poly_tag,
      judge: { code_12: JU.judge_code.slice(0, 12), controls: '9 of 9 controls, the memory limit and both refutation controls passed on the judge machine before the run' } },
    freeze: { frozen_utc: FZ.frozen_utc, digest_12: FZ.digest.slice(0, 12), cipher: FZ.cipher.replace(/\s*\(OpenSSL[\s\S]*$/, '').trim(), public_files: Object.keys(FZ.public).map((f) => f.replace(/^\.\.\//, '')), supersedes_utc: FZ.supersedes.frozen_utc },
    families, gaps, rulings, limits_known: limitsKnown, events, work, scored, proved, lemmas, next,
    sources: SOURCES.map((f) => ({ file: SRC_REL + '/' + f, sha256_12: sha(rd(f)).slice(0, 12) }))
      .concat(NOTE_SOURCES.map((f) => ({ file: 'notes/(private)/' + f, sha256_12: sha(ntxt(f)).slice(0, 12) })))
  };
  /* the records never name anyone the work may later be sent to, nor the private notes folder */
  need(!/sequent|verifereum/i.test(JSON.stringify(out)), 'the records would name someone the work may be sent to');
  return out;
}

if (require.main !== module) { module.exports = { build }; return; }
const argv = process.argv.slice(2);
const LOG = path.join(OUT, 'page-log.json');
const readLog = () => fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : { what: 'The public change log of /delta3-hol4/: one dated entry per change of the page or of its state (a batch starting or ending, the run ending, a new fact or event). The builder refuses when the newest entry is not the records’ state.', entries: [] };
const entryOf = (S, what, auto) => Object.assign({ at: new Date().toISOString().slice(0, 16) + 'Z', as_of: S.as_of, sig: S.sig, run_open: S.run_open,
  done: S.families.map((f) => f.id + ':' + f.batches_done).join(' '), what }, auto ? { auto: true } : {});
if (argv[0] === '--log') {
  const what = argv.slice(1).join(' ').trim();
  need(what, 'a log entry says what changed');
  const p = path.join(OUT, 'state.json');
  need(fs.existsSync(p), 'no state to log: write the records first');
  const S = JSON.parse(fs.readFileSync(p, 'utf8'));
  const L = readLog();
  L.entries.push(entryOf(S, what, false));
  fs.writeFileSync(LOG, J(L));
  console.log('page-log.json: entry ' + L.entries.length + ' at ' + L.entries[L.entries.length - 1].at);
  process.exit(0);
}
const S = build(Date.now());
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'state.json'), J(S));
/* a change of a batch's state, of the run's, or of the facts and events gets its own dated entry, said in words */
const L = readLog();
const last = L.entries[L.entries.length - 1];
if (last && last.sig !== S.sig) {
  const was = {};
  for (const part of last.sig.split(' ')) { const m = /^(\w+):([a-z]+)$/.exec(part); if (m) was[m[1]] = m[2]; }
  const says = [];
  for (const f of S.families) {
    const w = was[f.id] || '';
    const ended = f.batches.filter((b, i) => b.state === 'done' && w[i] !== 'd').map((b) => b.id);
    const began = f.batches.filter((b, i) => b.state === 'running' && w[i] !== 'r').map((b) => b.id);
    const list = (a) => a.length === 1 ? 'batch ' + a[0] : 'batches ' + a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
    if (ended.length) says.push('The ' + f.name + ' family finished ' + list(ended) + (f.batches_done === f.batches.length ? ', its last' : '') + '.');
    if (began.length) says.push('The ' + f.name + ' family started ' + list(began) + '.');
  }
  if (last.run_open && !S.run_open) says.push('The run has ended.');
  if (S.proved && S.proved.repo.ci_green && !/ ci:1\b/.test(last.sig) && / scored:1\b/.test(last.sig)) says.push('The repository’s replay passed on CI (' + S.proved.repo.ci_green.from + '–' + S.proved.repo.ci_green.to + ' UTC)' + (S.proved.repo.cakeml_started ? ', and its CakeML job was started by hand at ' + S.proved.repo.cakeml_started.at + ' UTC' : '') + '.');
  if (S.proved && S.proved.repo.pr && !/ pr:[12]\b/.test(last.sig)) says.push('The dominance lemma is offered to HOL4 as pull request #' + S.proved.repo.pr.number + ', open as a draft while HOL4’s build runs on it.');
  if (S.proved && S.proved.repo.cakeml_green && !/ cake:2\b/.test(last.sig)) says.push('The repository’s CakeML job passed on CI in ' + S.proved.repo.cakeml_green.min + ' min (' + S.proved.repo.cakeml_green.from + '–' + S.proved.repo.cakeml_green.to + ' UTC).');
  if (S.proved && S.proved.repo.pr && S.proved.repo.pr.ready_at && !/ pr:2\b/.test(last.sig)) says.push('Pull request #' + S.proved.repo.pr.number + ' is marked ready for review.');
  if (!/ scored:1\b/.test(last.sig) && S.scored) says.push('The run is scored, Layer 1 holds and the repository is public. The page now says, in this order: what is proved; the run’s results per family and class, with exact intervals; what went wrong and what was done, now with the two blinding audits and the readers’ ruling; how each of the ' + S.lemmas.length + ' lemmas on the chain was made; and what is next.');
  const gw = /gaps:(\d+) events:(\d+)/.exec(last.sig) || [, 0, 0];
  if (S.gaps.length !== Number(gw[1])) says.push('The list of what went wrong now has ' + S.gaps.length + ' items.');
  if (S.events.length !== Number(gw[2]) && !says.length) says.push('The timeline now has ' + S.events.length + ' events.');
  L.entries.push(entryOf(S, says.join(' ') || 'The state changed.', true));
  fs.writeFileSync(LOG, J(L));
  console.log('page-log.json: entry ' + L.entries.length + ' (' + L.entries[L.entries.length - 1].what + ')');
} else if (!last) console.log('page-log.json has no entry yet: add the first with --log "…"');
console.log('corpus/delta3-hol4-live written as of ' + S.as_of + ': run ' + (S.run_open ? 'OPEN' : 'ENDED') + '; ' + S.families.map((f) => f.name + ' ' + f.batches_done + ' of ' + f.batches.length + ' batches done, ' + f.batches_running + ' running, ' + f.attempts + ' attempts, '
  + f.statements.proved + ' proved, ' + f.statements.refuted + ' refuted, ' + f.statements.cap + ' at the cap').join('; ') + '; ' + S.gaps.length + ' gaps, ' + S.events.length + ' events');
