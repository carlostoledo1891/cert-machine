#!/usr/bin/env node
/* read-optconst-registry.js — what the optimization-constants registry did with our decisions, as a record.

   The method paper's second exercise ends with "what the claimant did next", and in that exercise the party that acted
   is the registry's maintainer: on 2026-10-18 he merged #216 (three asterisks removed on our replay, the replay cited on
   each page), merged #221 and #210 with their asterisks, and #230 (the replay of #221's certificate) was opened. A
   sentence of the paper may quote that only from a record, so this tool pins the registry's bytes after those merges —
   the README, CONTRIBUTING and the constant pages at upstream main, the pull requests' metadata, the maintainer's #176
   comment that stated the rule — and reads the facts the paper quotes from those bytes alone.

   usage: node tools/read-optconst-registry.js            fetch (gh api), pin, read → corpus/optconst-queue/registry-<date>/
          node tools/read-optconst-registry.js --check    offline: re-hash the pins and re-read the facts; exit 1 on a difference
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const REPO = 'teorth/optimizationproblems';
const DATE = '2026-10-18';
const DIR = path.join(ROOT, 'corpus', 'optconst-queue', 'registry-' + DATE);
const RECORD = path.join(DIR, 'record.json');
const CHECK = process.argv.includes('--check');
const die = (m) => { console.error('REGISTRY READ REFUSED: ' + m); process.exit(1); };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const gh = (args) => cp.execFileSync('gh', args, { maxBuffer: 64 * 1024 * 1024 });
const PAGES = ['README.md', 'CONTRIBUTING.md', 'constants/3b.md', 'constants/3c.md', 'constants/71a.md', 'constants/21a.md'];
const PRS = [216, 221, 210, 226, 230];

/* ---- fetch and pin (skipped by --check) ---------------------------------------------------------------- */
if (!CHECK) {
  fs.mkdirSync(path.join(DIR, 'upstream', 'constants'), { recursive: true });
  fs.mkdirSync(path.join(DIR, 'api'), { recursive: true });
  const head = JSON.parse(gh(['api', 'repos/' + REPO + '/commits/main']).toString());
  const files = {};
  for (const p of PAGES) {
    const meta = JSON.parse(gh(['api', 'repos/' + REPO + '/contents/' + p + '?ref=' + head.sha]).toString());
    const buf = Buffer.from(meta.content, 'base64');
    fs.writeFileSync(path.join(DIR, 'upstream', p), buf);
    files['upstream/' + p] = { url: 'https://github.com/' + REPO + '/blob/' + head.sha + '/' + p, sha256: sha(buf) };
  }
  for (const n of PRS) {
    const pr = JSON.parse(gh(['api', 'repos/' + REPO + '/pulls/' + n]).toString());
    /* the fields the record reads, as the API returned them (the full object changes with every comment) */
    const keep = { number: pr.number, title: pr.title, html_url: pr.html_url, user: pr.user.login, created_at: pr.created_at, state: pr.state,
      merged: pr.merged, merged_at: pr.merged_at, merged_by: pr.merged_by ? pr.merged_by.login : null, merge_commit_sha: pr.merged ? pr.merge_commit_sha : null };
    const buf = Buffer.from(JSON.stringify(keep, null, 1) + '\n');
    fs.writeFileSync(path.join(DIR, 'api', 'pr-' + n + '.json'), buf);
    files['api/pr-' + n + '.json'] = { url: 'https://api.github.com/repos/' + REPO + '/pulls/' + n, sha256: sha(buf) };
  }
  const comments = JSON.parse(gh(['api', 'repos/' + REPO + '/issues/176/comments', '--paginate']).toString());
  const rule = comments.find((c) => c.user.login === 'teorth' && /independently replayed/.test(c.body));
  if (!rule) die('the #176 comment that states the rule is not on the thread');
  const rbuf = Buffer.from(JSON.stringify({ html_url: rule.html_url, user: rule.user.login, created_at: rule.created_at, body: rule.body }, null, 1) + '\n');
  fs.writeFileSync(path.join(DIR, 'api', 'issue-176-rule.json'), rbuf);
  files['api/issue-176-rule.json'] = { url: rule.html_url, sha256: sha(rbuf) };
  fs.writeFileSync(path.join(DIR, 'PINS.json'), JSON.stringify({ what: 'The optimization-constants registry after the 2026-10-18 merges, pinned: the pages at upstream main and the pull requests the method paper\'s second exercise quotes. Read by tools/read-optconst-registry.js; nothing here is ours.', repo: REPO, commit: head.sha, committed: head.commit.committer.date, fetched: new Date().toISOString(), files }, null, 1) + '\n');
}

/* ---- read the facts from the pinned bytes only ---------------------------------------------------------- */
const PINS = JSON.parse(fs.readFileSync(path.join(DIR, 'PINS.json'), 'utf8'));
for (const [rel, p] of Object.entries(PINS.files)) if (sha(fs.readFileSync(path.join(DIR, rel))) !== p.sha256) die(rel + ' moved from its pin');
const T = (rel) => fs.readFileSync(path.join(DIR, rel), 'utf8');
const readme = T('upstream/README.md'), contributing = T('upstream/CONTRIBUTING.md');
const page = { '3b': T('upstream/constants/3b.md'), '3c': T('upstream/constants/3c.md'), '71': T('upstream/constants/71a.md'), '21': T('upstream/constants/21a.md') };
const pr = Object.fromEntries(PRS.map((n) => [n, JSON.parse(T('api/pr-' + n + '.json'))]));
const rule = JSON.parse(T('api/issue-176-rule.json'));

/* the README's bound table: the row of a constant, its lower and upper cells, and whether a cell carries the asterisk */
const tableRow = (id) => { const l = readme.split('\n').find((x) => x.startsWith('| [' + id + '](')); if (!l) die('no README row for ' + id); const c = l.split('|').map((s) => s.trim()); return { lower: c[3], upper: c[4] }; };
const r3b = tableRow('3b'), r3c = tableRow('3c'), r71 = tableRow('71'), r21 = tableRow('21');
/* a page cites our replay when its references hold a [T2026] entry naming Toledo; a row "points" at it when a table row carries "Independently replayed [T2026]" */
const cites = (t) => /\[T2026\]\**\s*Toledo, Carlos/.test(t) || /id="T2026"><\/a>\*\*\[T2026\]\*\* Toledo, Carlos/.test(t);
const rowNotes = (t) => t.split('\n').filter((l) => l.startsWith('|') && /Independently replayed \[\[?T2026/.test(l)).length;
const starRows21 = page['21'].split('\n').filter((l) => /^\| [0-9.]+\* \|/.test(l)).length;
const ruleSentence = 'is removed when that changes — when the paper is refereed and published, or when the argument is formalized or independently replayed';

const facts = {
  registryCommit: PINS.commit, registryCommitted: PINS.committed, fetched: PINS.fetched,
  rule: { contributing: contributing.includes(ruleSentence), stated: rule.created_at.slice(0, 10), by: rule.user, url: rule.html_url,
    promise: /If the 13-point certificate does get independently replayed, or formalized, the asterisk comes off/.test(rule.body) },
  replay: {
    pr: 216, merged: pr[216].merged, mergedAt: pr[216].merged_at, mergedBy: pr[216].merged_by, mergeCommit: pr[216].merge_commit_sha,
    readme: { '3b': r3b.lower, '3c': r3c.lower, '71': r71.lower },
    asterisksNow: { '3b': r3b.lower.includes('*'), '71': r71.lower.includes('*'), '3cL2026': /^1\.6747338950414058(\s|\(|$)/.test(r3c.lower) && !/^1\.6747338950414058\*/.test(r3c.lower) },
    pagesCiting: ['3b', '3c', '71'].filter((k) => cites(page[k])),
    rowNotes: { '3b': rowNotes(page['3b']), '3c': rowNotes(page['3c']), '71': rowNotes(page['71']) }
  },
  queue: {
    221: { merged: pr[221].merged, mergedAt: pr[221].merged_at, asteriskKept: /1\.674894211307116\*/.test(r3c.lower) },
    210: { merged: pr[210].merged, mergedAt: pr[210].merged_at, upperCell: r21.upper, asteriskedRows: starRows21 },
    226: { state: pr[226].state, merged: pr[226].merged },
    230: { state: pr[230].state, merged: pr[230].merged, createdAt: pr[230].created_at, user: pr[230].user, title: pr[230].title }
  }
};
/* the sentences the paper writes, each a fact above: refuse a snapshot that no longer supports them */
const F = facts;
if (!(F.rule.contributing && F.rule.promise && F.rule.by === 'teorth')) die('the rule is not as the paper states it (CONTRIBUTING sentence and the #176 promise by the maintainer)');
if (!(F.replay.merged && F.replay.mergedBy === 'teorth' && !F.replay.asterisksNow['3b'] && !F.replay.asterisksNow['71'] && F.replay.asterisksNow['3cL2026'])) die('#216 is not merged with the three asterisks gone');
if (F.replay.pagesCiting.length !== 3) die('the replay is cited on ' + F.replay.pagesCiting.length + ' pages, not three');
if (!(F.queue[221].merged && F.queue[210].merged)) die('#221 and #210 are not both merged');
const out = JSON.stringify({ what: 'Facts read from the pinned registry bytes in this directory (PINS.json); the method paper quotes them through tools/paper-numbers/cert-machine-method.js.', facts }, null, 1) + '\n';
if (CHECK) {
  const was = fs.readFileSync(RECORD, 'utf8');
  if (was !== out) die('the facts re-read from the pins differ from ' + path.relative(ROOT, RECORD));
  console.log('registry record re-derived identical from ' + Object.keys(PINS.files).length + ' pinned files');
} else {
  fs.writeFileSync(RECORD, out);
  console.log('wrote ' + path.relative(ROOT, RECORD) + ' — #216 merged ' + F.replay.mergedAt + ', cited on ' + F.replay.pagesCiting.join(', ') + '; #221 asterisk kept ' + F.queue[221].asteriskKept + '; 21a asterisked rows ' + F.queue[210].asteriskedRows + '; #230 ' + F.queue[230].state);
}
