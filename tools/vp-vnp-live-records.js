#!/usr/bin/env node
/* vp-vnp-live-records.js — the records of /vp-vnp/ (corpus/vp-vnp-live/), each written from the lane's own files.

   The page /vp-vnp/ is the live page of the VP ≠ VNP lane: an audit, in the open, of Anthropic's release claiming
   VP ≠ VNP over every field. Its builder (tools/build-vp-vnp-live.js) reads only corpus/vp-vnp-live/. This file writes
   those records from the lane's sources and refuses when a source no longer says what a record states:
     corpus/vp-vnp/status.json   the control room's row-by-row state (the only place state is written)
     corpus/vp-vnp/PREREG.md     every row id and gap id the state names must stand in it; its verdict rule is quoted
     corpus/vp-vnp/DEVIATIONS.md the corrections ledger, one entry per deviation
     corpus/vp-vnp/SEAL-*.sha256 every file a seal lists must still hash to the sealed value; the .ots file beside it is
                                 read for its attestation (a Bitcoin block once upgraded, else pending)
     the release's README (the pinned copy in notes/vp-vnp-2026-11-23/src/, its hash checked against
                                 target-SHA256SUMS): the two sentences the page quotes must stand in it
   usage: node tools/vp-vnp-live-records.js            write state.json and ledger.json
          node tools/vp-vnp-live-records.js --check    recompute them and refuse on any difference
          node tools/vp-vnp-live-records.js --log "what changed"   append a dated entry to page-log.json with the state  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const LANE = path.join(ROOT, 'corpus', 'vp-vnp');
const OUT = path.join(ROOT, 'corpus', 'vp-vnp-live');
const README = path.join(ROOT, 'notes', 'vp-vnp-2026-11-23', 'src', 'vp-vnp', 'README.md');
const die = (m) => { console.error('VP-VNP-LIVE RECORDS REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rd = (rel) => { const p = path.join(LANE, rel); need(fs.existsSync(p), 'a source is gone: corpus/vp-vnp/' + rel); return fs.readFileSync(p); };
const norm = (s) => String(s).replace(/`/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ');
const J = (o) => JSON.stringify(o, null, 1) + '\n';

const STATES = ['passed', 'running', 'pending', 'failed', 'refused', 'open'];
const PHASES = { 0: 'Pin and seal', 1: 'Does the proof check?', 2: 'Does the statement say VP ≠ VNP?', 3: 'The gap nobody filled', 4: 'Readable by a person' };
/* phase 0 is the pre-registration itself: each of its rows has the phrase of PREREG.md that states it */
const PHASE0 = { PIN: 'All 333 files hashed in target-SHA256SUMS', SEAL: 'Timestamped on Bitcoin with OpenTimestamps' };
/* the README's sentences the page quotes, word for word */
const QUOTES = ['The result was discovered by an internal research Claude model.', 'Both were written by AI models, and no human mathematician has checked the proof.'];

/* an .ots file's attestations: the Bitcoin tag and its block height (a varuint inside a varbytes payload), or pending */
function otsState(buf) {
  const BTC = Buffer.from('0588960d73d71901', 'hex'), PEND = Buffer.from('83dfe30d2ef90c8e', 'hex');
  const blocks = [];
  let i = buf.indexOf(BTC);
  while (i >= 0) {
    let j = i + 8, n = 0, s = 0, b;
    do { b = buf[j++]; n |= (b & 0x7f) << s; s += 7; } while (b & 0x80);   /* payload length */
    let h = 0; s = 0;
    do { b = buf[j++]; h += (b & 0x7f) * 2 ** s; s += 7; } while (b & 0x80);  /* the block height */
    blocks.push(h);
    i = buf.indexOf(BTC, i + 8);
  }
  return blocks.length ? { state: 'bitcoin', block: Math.min(...blocks) } : buf.indexOf(PEND) >= 0 ? { state: 'pending', block: null } : { state: 'unknown', block: null };
}

function build() {
  const ST = JSON.parse(rd('status.json'));
  const PRE = rd('PREREG.md').toString('utf8');
  const rowsSec = PRE.slice(PRE.indexOf('## Rows'), PRE.indexOf('## Verdict rule'));
  need(rowsSec.length > 100, 'PREREG.md has no Rows section before its Verdict rule');
  const gapsSec = PRE.slice(PRE.indexOf('## Gaps'), PRE.indexOf('## Rows'));
  const rule = PRE.slice(PRE.indexOf('## Verdict rule') + '## Verdict rule'.length).trim();
  for (const n of ['CERTIFIED', 'BOTH blind statements', 'REFUTED', 'REFUSED', 'OPEN', 'What CERTIFIED would not say']) need(rule.includes(n), 'the verdict rule no longer says "' + n + '"');
  need(/^\d{4}-\d\d-\d\dT\d\d:\d\dZ$/.test(ST.as_of), 'status.json as_of is not a UTC minute');
  need(Date.parse(ST.as_of) <= Date.now() + 60000, 'status.json as_of is ahead of the clock: ' + ST.as_of);
  need(['OPEN', 'CERTIFIED', 'REFUTED', 'REFUSED'].includes(ST.verdict), 'an unknown verdict: ' + ST.verdict);
  /* rows: every id of phases 1-3 stands in PREREG's Rows; phases 0 and 4 are named there as phases */
  const ids = new Set();
  for (const r of ST.rows) {
    need(!ids.has(r.id), 'a row id twice: ' + r.id); ids.add(r.id);
    need(STATES.includes(r.state), 'row ' + r.id + ' has an unknown state: ' + r.state);
    need(PHASES[r.phase] !== undefined, 'row ' + r.id + ' has an unknown phase');
    if (r.phase >= 1 && r.phase <= 3) need(new RegExp('(^|[\\s(])' + r.id + '(\\s|$)', 'm').test(rowsSec), 'row ' + r.id + ' does not stand in PREREG.md’s Rows');
    else if (r.phase === 4) need(rowsSec.includes('Phase 4'), 'phase 4 is not in PREREG.md’s Rows');
    else need(PHASE0[r.id] && norm(PRE).includes(PHASE0[r.id]), 'row ' + r.id + ' of phase 0 has no needle in PREREG.md');
    need(typeof r.title === 'string' && r.title.length > 8 && typeof r.note === 'string', 'row ' + r.id + ' lacks a title or a note');
  }
  for (const g of ST.gaps) need(new RegExp('\\b' + g.id + '\\b').test(gapsSec), 'gap ' + g.id + ' does not stand in PREREG.md’s gaps');
  /* seals: every listed file still hashes to its sealed value */
  const seals = ST.seals.map((s) => {
    const lines = rd(s.file).toString('utf8').trim().split('\n');
    for (const l of lines) {
      const m = /^([0-9a-f]{64})\s+(.+)$/.exec(l.trim()); need(m, s.file + ': a line is not "sha256  path"');
      if (sha(rd(m[2])) !== m[1]) {
        /* an append-only record (DEVIATIONS.md) may grow after its seal: the sealed bytes are kept in sealed/<seal>/
           and must hash to the sealed value and stand, unchanged, at the head of the current file */
        const snap = 'sealed/' + s.id + '/' + m[2];
        need(m[2] === 'DEVIATIONS.md' && fs.existsSync(path.join(LANE, snap)), s.file + ': ' + m[2] + ' no longer hashes to its sealed value');
        const was = rd(snap), now = rd(m[2]);
        need(sha(was) === m[1], s.file + ': ' + snap + ' is not the sealed ' + m[2]);
        need(now.length >= was.length && now.subarray(0, was.length).equals(was), s.file + ': ' + m[2] + ' was changed, not appended to, after its seal');
      }
    }
    const o = otsState(rd(s.ots));
    need(o.state !== 'unknown', s.ots + ' holds no attestation');
    return { id: s.id, what: s.what, stamped_utc: s.stamped_utc, files: lines.length, file: 'corpus/vp-vnp/' + s.file, file_sha256: sha(rd(s.file)), ots: 'corpus/vp-vnp/' + s.ots, ots_state: o.state, bitcoin_block: o.block };
  });
  /* the README's quoted sentences, in the pinned copy */
  need(fs.existsSync(README), 'the pinned README is gone: ' + path.relative(ROOT, README));
  const rb = fs.readFileSync(README);
  const pin = rd('target-SHA256SUMS').toString('utf8').split('\n').find((l) => / \.\/README\.md$/.test(l));
  need(pin && pin.slice(0, 64) === sha(rb), 'the README copy is not the pinned one');
  for (const q of QUOTES) need(norm(rb.toString('utf8')).includes(q), 'the README no longer says: ' + q);
  /* the corrections ledger */
  const DEV = rd('DEVIATIONS.md').toString('utf8');
  /* one entry per paragraph that opens with its id and its time: "D0 (2026-11-23 23:58 UTC, …). text" */
  const entries = DEV.split(/\n\s*\n/).map((par) => /^(D\d+) \(([^)]*)\)\. ([\s\S]+)$/.exec(par.trim())).filter(Boolean).map((m) => ({ id: m[1], when: m[2], text: m[3].replace(/\s+/g, ' ').trim() }));
  need(entries.length >= 1 && entries[0].id === 'D0', 'DEVIATIONS.md has no D0');
  const counts = Object.fromEntries(STATES.map((s) => [s, ST.rows.filter((r) => r.state === s).length]));
  const SOURCES = ['status.json', 'PREREG.md', 'DEVIATIONS.md', 'target-SHA256SUMS', 'prompts/blind-writer.md', 'prompts/adversarial-reader.md'].concat(ST.seals.flatMap((s) => [s.file, s.ots]));
  const scripts = ['tools/runpod-vp-vnp-p1.sh', 'instruments/vp-vnp/census/Census.lean', 'instruments/vp-vnp/controls/C1.lean', 'instruments/vp-vnp/controls/c2.py'].filter((f) => fs.existsSync(path.join(ROOT, f)));
  const state = {
    what: 'The state of the VP ≠ VNP lane as the live page shows it, written by tools/vp-vnp-live-records.js from corpus/vp-vnp/status.json and checked against PREREG.md, the seals and the pinned README.',
    as_of: ST.as_of, verdict: ST.verdict, verdict_words: ST.verdict_words, ceiling_usd: ST.ceiling_usd, spent_usd: ST.spent_usd,
    target: ST.target, quotes: QUOTES, gaps: ST.gaps,
    phases: Object.entries(PHASES).map(([n, t]) => ({ phase: Number(n), title: t, rows: ST.rows.filter((r) => r.phase === Number(n)).map((r) => ({ id: r.id, title: r.title, state: r.state, note: r.note })) })),
    counts: Object.assign({ all: ST.rows.length }, counts),
    verdict_rule: rule.replace(/\s+/g, ' '), panel: ST.panel, independence: ST.independence, seals,
    sources: SOURCES.map((f) => ({ file: 'corpus/vp-vnp/' + f, sha256_12: sha(rd(f)).slice(0, 12) })),
    scripts: scripts.map((f) => ({ file: f, sha256_12: sha(fs.readFileSync(path.join(ROOT, f))).slice(0, 12) }))
  };
  const ledger = { what: 'The corrections ledger of the VP ≠ VNP lane: every deviation from the pre-registration, read from corpus/vp-vnp/DEVIATIONS.md.', entries };
  return { 'state.json': state, 'ledger.json': ledger };
}

const argv = process.argv.slice(2);
if (argv[0] === '--log') {
  const what = argv.slice(1).join(' ').trim();
  need(what, 'a log entry says what changed');
  const S = JSON.parse(fs.readFileSync(path.join(OUT, 'state.json'), 'utf8'));
  const f = path.join(OUT, 'page-log.json');
  const L = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { what: 'The public change log of /vp-vnp/: one dated entry per change of the page or of its state. The builder refuses when the newest entry’s state is not the records’.', entries: [] };
  L.entries.push({ at: new Date().toISOString().slice(0, 16) + 'Z', as_of: S.as_of, passed: S.counts.passed, running: S.counts.running, verdict: S.verdict, what });
  fs.writeFileSync(f, J(L));
  console.log('page-log.json: entry ' + L.entries.length + ' at ' + L.entries[L.entries.length - 1].at);
  process.exit(0);
}
const recs = build();
if (argv.includes('--check')) {
  let bad = 0;
  for (const [f, o] of Object.entries(recs)) { const p = path.join(OUT, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== J(o)) { console.error('  differs: corpus/vp-vnp-live/' + f); bad++; } }
  if (bad) die(bad + ' record(s) differ from their sources');
  console.log('corpus/vp-vnp-live: ' + Object.keys(recs).length + ' records re-derived, all equal');
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });
for (const [f, o] of Object.entries(recs)) fs.writeFileSync(path.join(OUT, f), J(o));
const S = recs['state.json'];
console.log('corpus/vp-vnp-live written: ' + S.counts.all + ' rows (' + S.counts.passed + ' passed, ' + S.counts.running + ' running, ' + S.counts.pending + ' pending), '
  + S.seals.length + ' seals (' + S.seals.map((s) => s.id + ' ' + (s.bitcoin_block ? 'block ' + s.bitcoin_block : s.ots_state)).join(', ') + '), ' + recs['ledger.json'].entries.length + ' deviation(s), as of ' + S.as_of);
