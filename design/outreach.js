/* outreach.js — a thread's status, said on a page in the words of the record (corpus/outreach.json), for any page.

   WHY ONE MODULE (2026-11-05). /eth/ §5b and the Anthropic chain report both say what became of the two complexitylib
   pull requests. Written per page the sentence would diverge (the corpus.js lesson), and typed it would go stale: a
   row's status word changes, the page must change with it. So the record is read here the way tools/build-site.js
   reads it (every status word must be in the record's own statusWords, or the build refuses, as the sync does), and
   the one sentence is assembled from the rows' fields alone. An outreach status is a fact about a thread, not a decided
   claim: plain prose, no verdict tag. A reviewer who is not a maintainer is never named as a credit (corpus/recognition.json
   holds credits; this file holds none).

   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[mo - 1] + ' ' + y; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let cached = null;
function load() {
  if (cached) return cached;
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'outreach.json'), 'utf8'));
  for (const r of rec.rows) if (!r.status || !r.sent || !rec.statusWords[r.status])
    throw new Error('outreach.js: row ' + r.id + ' carries a status word that is not defined in the record');
  cached = rec;
  return rec;
}
function row(id) {
  const r = load().rows.find((x) => x.id === id);
  if (!r) throw new Error('outreach.js: no row ' + id + ' in corpus/outreach.json');
  return r;
}

/* what a pull request's status word says on a page; any other word is the record's own gloss, verbatim */
const PR_PHRASE = {
  'reviewed, not merged': 'approved by the library’s reviewer agent, which is not human approval; merge pending',
  'merged': 'merged upstream',
  'open, no comments': 'awaiting review',
  'closed, no comment': 'closed without comment',
};
const phrase = (status) => PR_PHRASE[status] || load().statusWords[status];

/* THE COMPLEXITYLIB PULL REQUESTS (the operator's line, 2026-11-05): C1 and the reusable half of C2 offered upstream as
   #2509 and #2510 on the maintainer's invitation in #739. The invitation is the #739 row's `answered`; the date is the
   rows' `sent`; the standing is each row's status word. One HTML sentence, the same on every page that says it. */
const CX = { issue: 'gh-complexitylib-739-2026-11-05', c1: 'gh-complexitylib-pr-2509-2026-11-05', c2: 'gh-complexitylib-pr-2510-2026-11-05' };
function complexitylibPRs() {
  const issue = row(CX.issue), p1 = row(CX.c1), p2 = row(CX.c2);
  if (issue.status !== 'answered') throw new Error('outreach.js: #739 is ' + issue.status + ', and the page says the PRs were invited there');
  const num = (r) => '#' + (/(\d+)\s*$/.exec(r.where) || /\/(\d+)$/.exec(r.url) || [null, '?'])[1];
  const a = (r) => '<a href="' + esc(r.url) + '">' + esc(num(r)) + '</a>';
  const when = p1.sent === p2.sent ? longDate(p1.sent) : longDate(p1.sent) + ' and ' + longDate(p2.sent);
  const standing = p1.status === p2.status ? esc(phrase(p1.status)) : esc(num(p1) + ' ' + phrase(p1.status) + '; ' + num(p2) + ' ' + phrase(p2.status));
  return 'C1 and the reusable part of C2 are offered upstream: complexitylib pull requests ' + a(p1) + ' and ' + a(p2)
    + ' (' + esc(when) + ', on the maintainer’s invitation in ' + a(issue) + '), ' + standing + '.';
}

module.exports = { load, row, phrase, longDate, complexitylibPRs };
