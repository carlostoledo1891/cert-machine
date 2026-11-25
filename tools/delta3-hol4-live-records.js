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
     WORKLOG.md                  the batches, every batch start and end, the pause, the findings, the actions
     README.md, repo-draft/README.md   what the checker is, what is proved and what is not, the measured times

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
/* the files this tool may never open, whatever a caller passes */
const FORBIDDEN = /LEMMAS\.md|key\.json|KEY-ARCHIVE|unlock-key|regen-key|outreach\/|\.enc$|day2-prerun-work|freeze-1\//i;
const rd = (rel) => {
  need(!FORBIDDEN.test(rel), 'this tool never opens ' + rel);
  const p = path.join(SRC, rel);
  need(fs.existsSync(p), 'a source is gone: ' + SRC_REL + '/' + rel);
  return fs.readFileSync(p);
};
const txt = (rel) => rd(rel).toString('utf8');
const SOURCES = ['harness/RUN.json', 'harness/attempts.jsonl', 'harness/runs/tokens.tsv', 'harness/RUN-PROTOCOL.md', 'harness/FREEZE-2.json',
  'harness/PIN.json', 'harness/JUDGE.json', 'harness/MOVED-PRERUN.txt', 'agents/BRIEF.md', 'WORKLOG.md', 'README.md', 'repo-draft/README.md'];
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
    { text: 'The Claude agents that built the harness read the texts of the true statements. The proving agents are other agents; the blinding audit checks what each of them read.' },
    { text: 'Nothing stops an agent from reading a file: the machine does not restrict reads. The blinding rule is checked afterwards, on every agent’s tool log.' },
    { text: 'Agents of the same family may read each other’s scripts. The brief allows it; reuse is reported, not excluded.' },
    { text: 'The decoys remove the signal that used to mark the true statements; weaker signals remain, were measured before the run, and are reported with the results.' },
    { text: 'The judge trusts the files HOL4 writes. A deliberate forgery from inside a build would be stopped only by a text filter on the script and by reading the script, which is why every accepted proof is rebuilt and read (below).' }];
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

  /* ------------------------------------------------------------ what happens next, in order, each read from its source */
  for (const n of ['stop the queue watcher and the runner', 'the blinding audit on every transcript and astra.log of the run', 'the operator unlocks the key (`unlock-key.sh`)', 'A fresh rebuild** in a new, separate process, from the submitted script alone, against the frozen base', 'It must print `REBUILT`'])
    has(PN, norm(n), 'RUN-PROTOCOL.md');
  const next = [
    { title: 'The run ends', short: 'run ends', text: 'When every statement is judged or at the cap for both families, or the run is stopped. The judge machine is stopped, its log brought home, and the machine deleted.' },
    { title: 'A fresh rebuild of every accepted proof', short: 'fresh rebuild', text: 'Each accepted script is built again, alone, in a new process against the frozen statements; an attempt counts only if the rebuild gives the same decision.' },
    { title: 'Two readers for every accepted script', short: 'two readers', text: 'One Claude and one GPT-6.2 agent, each alone, read every accepted script against a seven-item checklist. No person reads them, and the report will say so.' },
    { title: 'The blinding audit', short: 'blinding audit', text: 'Every agent’s tool log is read for forbidden reads: the judge’s log, the moved material, the answer texts.' },
    { title: 'The key is unlocked', short: 'key unlocked', text: 'Carlos Toledo types the passphrase; the key says which statements are true, planted or decoys. Nobody knows that before.' },
    { title: 'Scoring', short: 'scoring', text: 'By what the kernel judged, per family and per class, with exact 95% intervals, the Claude family also without the statements touched by the two leaks above.' },
    { title: 'A non-blind builder finishes the slab lemmas', short: 'non-blind builder', text: 'Any lemma of the slab proof left unproved after the run is finished by a builder agent that is not blind. Those lemmas are labelled non-blind, and the scores count only blind attempts.' },
    { title: 'The slab theorem', short: 'slab theorem', text: 'The theorem that an accepting slab check implies the bound on its region, for the four slabs: the next milestone of the soundness proof.' },
    { title: 'A public repository', short: 'public repository', text: 'The checker, its proofs and the run’s records in a small public repository of their own.' }];

  /* ------------------------------------------------------------ the clock */
  for (const [label, ms] of times) need(ms <= clock, 'a state is ahead of the clock: ' + label + ' says ' + new Date(ms).toISOString() + ', the clock reads ' + new Date(clock).toISOString());
  const sig = (run_open ? 'open' : 'ended') + ' ' + families.map((f) => f.id + ':' + f.batches.map((b) => b.state[0]).join('')).join(' ') + ' gaps:' + gaps.length + ' events:' + events.length;
  return {
    what: 'The state of the δ₃-in-HOL4 work and its blind benchmark as the live page /delta3-hol4/ shows it, written by tools/delta3-hol4-live-records.js from the run’s private files in hol4/delta3/ (read-only, not published): aggregates and dated facts only; no statement’s outcome while the run is open.',
    as_of: new Date(asOf).toISOString().slice(0, 16) + 'Z', sig, run_open,
    run: { start_utc: RUN.start_utc, ended_utc: ended ? iso(ended) : null, cap: RUN.cap, statements: N, batches: batches.length, batch_size: size, in_flight: inFlight0,
      claude_in_flight_from: { at: iso(tAt(pace[1], 'pace')), max: Number(pace[2]) }, pause: { from: iso(pause.from), stopped: iso(pause.stopped), to: iso(pause.to), lasted: pause.lasted }, limits, uniform, hol_tag: PIN.hol_tag, poly_tag: PIN.poly_tag,
      judge: { code_12: JU.judge_code.slice(0, 12), controls: '9 of 9 controls, the memory limit and both refutation controls passed on the judge machine before the run' } },
    freeze: { frozen_utc: FZ.frozen_utc, digest_12: FZ.digest.slice(0, 12), cipher: FZ.cipher.replace(/\s*\(OpenSSL[\s\S]*$/, '').trim(), public_files: Object.keys(FZ.public).map((f) => f.replace(/^\.\.\//, '')), supersedes_utc: FZ.supersedes.frozen_utc },
    families, gaps, rulings, limits_known: limitsKnown, events, work, next,
    sources: SOURCES.map((f) => ({ file: SRC_REL + '/' + f, sha256_12: sha(rd(f)).slice(0, 12) }))
  };
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
  const gw = /gaps:(\d+) events:(\d+)/.exec(last.sig) || [, 0, 0];
  if (S.gaps.length !== Number(gw[1])) says.push('The list of what went wrong now has ' + S.gaps.length + ' items.');
  if (S.events.length !== Number(gw[2]) && !says.length) says.push('The timeline now has ' + S.events.length + ' events.');
  L.entries.push(entryOf(S, says.join(' ') || 'The state changed.', true));
  fs.writeFileSync(LOG, J(L));
  console.log('page-log.json: entry ' + L.entries.length + ' (' + L.entries[L.entries.length - 1].what + ')');
} else if (!last) console.log('page-log.json has no entry yet: add the first with --log "…"');
console.log('corpus/delta3-hol4-live written as of ' + S.as_of + ': run ' + (S.run_open ? 'OPEN' : 'ENDED') + '; ' + S.families.map((f) => f.name + ' ' + f.batches_done + ' of ' + f.batches.length + ' batches done, ' + f.batches_running + ' running, ' + f.attempts + ' attempts, '
  + f.statements.proved + ' proved, ' + f.statements.refuted + ' refuted, ' + f.statements.cap + ' at the cap').join('; ') + '; ' + S.gaps.length + ' gaps, ' + S.events.length + ' events');
