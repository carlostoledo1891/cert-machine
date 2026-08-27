#!/usr/bin/env node
/* sweep-claims.js — the per-session claim-surface sweep (S4).

   Fetches the surfaces this lab audits or has outreach standing on, diffs
   them against the last sweep, and REPORTS. A report, not a gate: exit 0
   always; acting on a finding is a session decision. No cron — run it at
   session start (the operator's standing instruction: fix causes, add no
   ceremony).

   Surfaces:
     1. Ramanujan Machine results page — a NEW sheet is new audit corpus
        for the registry (reports/rm-audit.html says it updates as sheets
        appear; this is the tool that notices).
     2. erdosproblems #852 thread — the posted C* correction sits in the
        moderation queue; the standing instruction is to snapshot the
        thread as evidence bytes when it becomes public.
     3. erdosproblems #510 page — the lambda-table comment was posted by
        the operator 2026-08-26 and sits in moderation; same standing
        instruction (shout + snapshot) when the table appears.
     4. arXiv — recent entries mentioning the Ramanujan Machine (new
        proofs of audited rows, or new sheets' papers).

   State: corpus/claims-seen.json (what previous sweeps saw). First run
   seeds it and reports current status.

   usage: node tools/sweep-claims.js */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(ROOT, 'corpus', 'claims-seen.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { rmSheets: [], arxiv: [], erdos852Comments: null };
const fetchText = (url) => {
  try { return execFileSync('curl', ['-sL', '--max-time', '30', '-A', UA, url], { maxBuffer: 16 * 1024 * 1024 }).toString(); }
  catch (e) { return null; }
};
let findings = 0;
const say = (m) => { console.log(m); };
const finding = (m) => { findings++; console.log('!! ' + m); };

/* 1 · Ramanujan Machine results sheets */
{
  const html = fetchText('https://www.ramanujanmachine.com/idea/results/');
  if (!html) say('rm-results: fetch failed (transient; not a finding)');
  else {
    const pdfs = [...new Set([...html.matchAll(/href="(https?:\/\/[^"]+\.pdf)"/g)].map((m) => m[1]))].sort();
    const fresh = pdfs.filter((u) => !state.rmSheets.includes(u));
    if (state.rmSheets.length === 0) say('rm-results: seeded with ' + pdfs.length + ' sheet PDFs (first sweep)');
    else if (fresh.length) fresh.forEach((u) => finding('NEW RM SHEET: ' + u + ' — new audit corpus for the registry'));
    else say('rm-results: ' + pdfs.length + ' sheets, none new');
    state.rmSheets = pdfs;
  }
}

/* 2 · the #852 moderation queue (standing instruction) */
{
  const html = fetchText('https://www.erdosproblems.com/forum/discuss/852?cb=' + Math.floor(Math.random() * 1e9));
  if (!html) say('erdos852: fetch failed (transient)');
  else {
    const m = /(\d+)\s+comments?/.exec(html);
    const n = m ? Number(m[1]) : null;
    const corrected = /0\.07524038617830/.test(html);
    /* measured, not remembered: the shout stops only when a snapshot pin exists */
    const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'sources', 'PINS.json'), 'utf8'));
    const snapshotted = Object.keys(pins).some((k) => /^erdos852_thread_correction-public/.test(k));
    if (corrected && !snapshotted) finding('erdos852: THE CORRECTION IS PUBLIC — snapshot the thread as evidence bytes beside the original pin NOW');
    else if (corrected) say('erdos852: correction PUBLIC, snapshot pinned — watch closed');
    else if (n !== null && state.erdos852Comments !== null && n !== state.erdos852Comments) {
      finding('erdos852: comment count moved ' + state.erdos852Comments + ' -> ' + n + ' (correction digits not visible yet) — read the thread');
    } else say('erdos852: ' + (n === null ? 'count unreadable' : n + ' comments') + ', correction still in the moderation queue');
    if (n !== null) state.erdos852Comments = n;
  }
}

/* 3 · the #510 moderation queue (comment posted 2026-08-26) */
{
  const html = fetchText('https://www.erdosproblems.com/510?cb=' + Math.floor(Math.random() * 1e9));
  if (!html) say('erdos510: fetch failed (transient)');
  else {
    /* the table's n=13 bound is the signature: 12 ceiled decimals, stated
       nowhere else on the internet unless our comment (or a copy) is live */
    const visible = /2\.318232650153/.test(html);
    if (visible) finding('erdos510: THE LAMBDA TABLE IS PUBLIC — snapshot the page as evidence bytes beside outreach/erdos510-comment.md NOW');
    else say('erdos510: comment not visible yet, still in the moderation queue');
    state.erdos510Visible = visible;
  }
}

/* 4 · arXiv — Ramanujan Machine mentions */
{
  const xml = fetchText('http://export.arxiv.org/api/query?search_query=all:%22Ramanujan+Machine%22&sortBy=submittedDate&sortOrder=descending&max_results=15');
  if (!xml) say('arxiv: fetch failed (transient)');
  else {
    const ids = [...xml.matchAll(/<id>(http:\/\/arxiv\.org\/abs\/[^<]+)<\/id>/g)].map((m) => m[1]);
    const titles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1].trim()).slice(1); /* first <title> is the feed's */
    const fresh = ids.map((id, i) => ({ id, title: titles[i] || '' })).filter((e) => !state.arxiv.includes(e.id));
    if (state.arxiv.length === 0) say('arxiv: seeded with ' + ids.length + ' recent "Ramanujan Machine" entries (first sweep)');
    else if (fresh.length) fresh.forEach((e) => finding('NEW ARXIV: ' + e.id + ' — ' + e.title + ' (a proof of an audited row updates its registry status)'));
    else say('arxiv: nothing new mentioning the Ramanujan Machine');
    state.arxiv = [...new Set([...state.arxiv, ...ids])];
  }
}

state.lastSweep = new Date().toISOString();
fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n');
say((findings ? findings + ' finding(s) above' : 'no findings') + ' · state: corpus/claims-seen.json');
