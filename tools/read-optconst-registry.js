#!/usr/bin/env node
/* read-optconst-registry.js — what the optimization-constants registry did with our decisions, as a record.

   The method paper's second exercise ends with "what the claimant did next", and in that exercise the party that acted
   is the registry's maintainer. A sentence of the paper may quote that only from a record, so this tool pins the
   registry's bytes — the README, CONTRIBUTING and the constant pages at upstream main, the pull requests' metadata, the
   maintainer's #176 comment that stated the rule, and his own commits the paper quotes — and reads the facts the paper
   quotes from those bytes alone. Each snapshot is kept as it was taken, because each supports the sentences about its
   moment:

     registry-2026-10-18    after the merges of 00:35–00:39 UTC: #216 (three asterisks removed on our replay, the replay
                            cited on each page), #221 and #210 merged with their asterisks; #230 (the replay of #221's
                            certificate) open
     registry-2026-10-18b   after the merges of 05:44–05:56 UTC: #230 merged (the fourth asterisk removed, [T2026b] cited,
                            the reverted note restored), and #225's step functions merged and then asterisked by the
                            maintainer, in a commit that gives the reason
     registry-2026-10-26    after the merges of 03:50–03:53 UTC on 2026-10-26: #232 (the four C_1a/C_1b step-function rows),
                            #243 (C_1c and C_1d) and #257 (C_84b corrected to the note's theorem) merged minutes after the
                            maintainer's hold note; CONTRIBUTING's new rule (removing an asterisk takes a second party);
                            #242, #249 and #275 open

   usage: node tools/read-optconst-registry.js <snapshot>   fetch (gh api), pin, read → corpus/optconst-queue/<snapshot>/
          node tools/read-optconst-registry.js --check      offline: re-hash every snapshot's pins and re-read its facts;
                                                            exit 1 on a difference
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const REPO = 'teorth/optimizationproblems';
const CHECK = process.argv.includes('--check');
const die = (m) => { console.error('REGISTRY READ REFUSED: ' + m); process.exit(1); };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const gh = (args) => cp.execFileSync('gh', args, { maxBuffer: 64 * 1024 * 1024 });
const BASE = ['README.md', 'CONTRIBUTING.md', 'constants/3b.md', 'constants/3c.md', 'constants/71a.md', 'constants/21a.md'];
const SNAPS = {
  'registry-2026-10-18': { pages: BASE, prs: [216, 221, 210, 226, 230], commits: [], read: readMorning },
  'registry-2026-10-18b': { pages: BASE.concat(['constants/1a.md', 'constants/1b.md']), prs: [216, 221, 210, 225, 226, 230], commits: ['3010f7ed'], read: readAfter },
  'registry-2026-10-26': { pages: BASE.concat(['constants/1a.md', 'constants/1b.md', 'constants/1c.md', 'constants/1d.md', 'constants/31a.md', 'constants/82a.md', 'constants/84b.md', 'constants/86a.md']),
    prs: [232, 242, 243, 249, 257, 275], commits: [], read: readThird,
    what: 'The optimization-constants registry after the merges of 2026-10-26 (#232, #243, #257) and the second-party rule' }
};

/* ---- fetch and pin (skipped by --check) ---------------------------------------------------------------- */
function fetchSnapshot(DIR, spec) {
  fs.mkdirSync(path.join(DIR, 'upstream', 'constants'), { recursive: true });
  fs.mkdirSync(path.join(DIR, 'api'), { recursive: true });
  const head = JSON.parse(gh(['api', 'repos/' + REPO + '/commits/main']).toString());
  const files = {};
  for (const p of spec.pages) {
    const meta = JSON.parse(gh(['api', 'repos/' + REPO + '/contents/' + p + '?ref=' + head.sha]).toString());
    const buf = Buffer.from(meta.content, 'base64');
    fs.writeFileSync(path.join(DIR, 'upstream', p), buf);
    files['upstream/' + p] = { url: 'https://github.com/' + REPO + '/blob/' + head.sha + '/' + p, sha256: sha(buf) };
  }
  for (const n of spec.prs) {
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
  /* the maintainer's own commits the paper quotes: author, date, message and files, as the API returned them */
  for (const c of spec.commits) {
    const m = JSON.parse(gh(['api', 'repos/' + REPO + '/commits/' + c]).toString());
    const cbuf = Buffer.from(JSON.stringify({ sha: m.sha, html_url: m.html_url, author: m.author ? m.author.login : null, date: m.commit.author.date, message: m.commit.message, files: m.files.map((f) => f.filename) }, null, 1) + '\n');
    fs.writeFileSync(path.join(DIR, 'api', 'commit-' + c + '.json'), cbuf);
    files['api/commit-' + c + '.json'] = { url: m.html_url, sha256: sha(cbuf) };
  }
  fs.writeFileSync(path.join(DIR, 'PINS.json'), JSON.stringify({ what: (spec.what || 'The optimization-constants registry after the 2026-10-18 merges') + ', pinned: the pages at upstream main and the pull requests the method paper\'s second exercise quotes. Read by tools/read-optconst-registry.js; nothing here is ours.', repo: REPO, commit: head.sha, committed: head.commit.committer.date, fetched: new Date().toISOString(), files }, null, 1) + '\n');
}

/* ---- read the facts from the pinned bytes only ---------------------------------------------------------- */
function pinned(DIR) {
  const PINS = JSON.parse(fs.readFileSync(path.join(DIR, 'PINS.json'), 'utf8'));
  for (const [rel, p] of Object.entries(PINS.files)) if (sha(fs.readFileSync(path.join(DIR, rel))) !== p.sha256) die(path.basename(DIR) + '/' + rel + ' moved from its pin');
  const T = (rel) => fs.readFileSync(path.join(DIR, rel), 'utf8');
  const readme = T('upstream/README.md');
  /* the README's bound table: the row of a constant, its lower and upper cells, and whether a cell carries the asterisk */
  const tableRow = (id) => { const l = readme.split('\n').find((x) => x.startsWith('| [' + id + '](')); if (!l) die('no README row for ' + id); const c = l.split('|').map((s) => s.trim()); return { lower: c[3], upper: c[4] }; };
  return { PINS, T, readme, tableRow };
}
/* a page cites our replay when its references hold a [T2026] entry naming Toledo; a row "points" at it when a table row carries "Independently replayed [T2026]" */
const cites = (t) => /\[T2026\]\**\s*Toledo, Carlos/.test(t) || /id="T2026"><\/a>\*\*\[T2026\]\*\* Toledo, Carlos/.test(t);
const rowNotes = (t) => t.split('\n').filter((l) => l.startsWith('|') && /Independently replayed \[\[?T2026/.test(l)).length;
const prs = (T, list) => Object.fromEntries(list.map((n) => [n, JSON.parse(T('api/pr-' + n + '.json'))]));

/* after the first merges: #216 merged, #221 and #210 asterisked, #230 open */
function readMorning(DIR, spec) {
  const { PINS, T, readme, tableRow } = pinned(DIR);
  const contributing = T('upstream/CONTRIBUTING.md');
  const page = { '3b': T('upstream/constants/3b.md'), '3c': T('upstream/constants/3c.md'), '71': T('upstream/constants/71a.md'), '21': T('upstream/constants/21a.md') };
  const pr = prs(T, spec.prs);
  const rule = JSON.parse(T('api/issue-176-rule.json'));
  const r3b = tableRow('3b'), r3c = tableRow('3c'), r71 = tableRow('71'), r21 = tableRow('21');
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
  return { facts, line: '#216 merged ' + F.replay.mergedAt + ', cited on ' + F.replay.pagesCiting.join(', ') + '; #221 asterisk kept ' + F.queue[221].asteriskKept + '; 21a asterisked rows ' + F.queue[210].asteriskedRows + '; #230 ' + F.queue[230].state };
}

/* after the second merges: #230 merged and #225 asterisked by the maintainer */
function readAfter(DIR, spec) {
  const { PINS, T, readme, tableRow } = pinned(DIR);
  const page = { '3b': T('upstream/constants/3b.md'), '3c': T('upstream/constants/3c.md'), '71': T('upstream/constants/71a.md'), '1a': T('upstream/constants/1a.md'), '1b': T('upstream/constants/1b.md') };
  const pr = prs(T, spec.prs);
  const star = JSON.parse(T('api/commit-3010f7ed.json'));
  const r3b = tableRow('3b'), r3c = tableRow('3c'), r71 = tableRow('71'), r1a = tableRow('1a'), r1b = tableRow('1b');
  /* a page's table row for a bound, and whether it carries the asterisk: "| $1.674894211307116$ | [J2026] |" */
  const row = (t, v, ref) => { const l = t.split('\n').find((x) => x.startsWith('| $' + v + '$') && x.includes('[' + ref + ']')); return l ? { star: /^\| \$[^$]+\$\*/.test(l), note: /Independently replayed \[T2026b?\]/.test(l) } : null; };
  const J = row(page['3c'], '1.674894211307116', 'J2026'), L = row(page['3c'], '1.6747338950414058', 'L2026');
  const A1 = row(page['1a'], '1.5027434868', 'A2026'), A2 = row(page['1b'], '0.3808585504', 'A2026');
  const facts = {
    registryCommit: PINS.commit, registryCommitted: PINS.committed, fetched: PINS.fetched,
    secondReplay: {
      pr: 230, merged: pr[230].merged, mergedAt: pr[230].merged_at, mergedBy: pr[230].merged_by, mergeCommit: pr[230].merge_commit_sha, createdAt: pr[230].created_at,
      readme3c: r3c.lower, rowJ2026: J, rowL2026: L,
      citesT2026: cites(page['3c']), citesT2026b: /\[T2026b\]\**\s*Toledo, Carlos/.test(page['3c']), rowNotes3c: rowNotes(page['3c']),
      progressLine: /\*\*independently replayed:\*\* the two-law certificate behind \$C\\_\{3c\} \\geq 1\.674894211307116\$/.test(readme)
    },
    firstReplayHolds: { '3b': !r3b.lower.includes('*'), '71': !r71.lower.includes('*'), pagesCiting: ['3b', '3c', '71'].filter((k) => cites(page[k])) },
    stepFunctions: {
      pr: 225, merged: pr[225].merged, mergedAt: pr[225].merged_at, mergedBy: pr[225].merged_by,
      readme: { '1a': r1a.upper, '1b': r1b.upper }, rowA2026: { '1a': A1, '1b': A2 }, citesUs: { '1a': /Toledo/.test(page['1a']), '1b': /Toledo/.test(page['1b']) },
      asteriskCommit: { sha: star.sha, author: star.author, date: star.date, reason: (star.message.match(/replayed only by the submitting team's\s+own checker/) || [null])[0] }
    },
    open: { 226: pr[226].state }
  };
  const F = facts, S = F.secondReplay, P = F.stepFunctions;
  if (!(S.merged && S.mergedBy === 'teorth' && S.readme3c === '1.674894211307116' && J && !J.star && J.note && L && !L.star && L.note && S.citesT2026 && S.citesT2026b && S.rowNotes3c === 2)) die('#230 is not merged with the J2026 asterisk gone, [T2026b] cited and both 3c rows noted');
  if (!(F.firstReplayHolds['3b'] && F.firstReplayHolds['71'] && F.firstReplayHolds.pagesCiting.length === 3)) die('the first replay\'s three marks are not still off');
  if (!(P.merged && A1 && A1.star && A2 && A2.star && !P.citesUs['1a'] && !P.citesUs['1b'] && P.asteriskCommit.author === 'teorth' && P.asteriskCommit.reason)) die('#225 is not merged with its rows asterisked by the maintainer, for the reason quoted');
  return { facts, line: '#230 merged ' + S.mergedAt + ' (C3c ' + S.readme3c + ', [T2026b] cited, 3c row notes ' + S.rowNotes3c + '); #225 merged ' + P.mergedAt + ', asterisked by ' + P.asteriskCommit.author + ' in ' + P.asteriskCommit.sha.slice(0, 8) + '; #226 ' + F.open[226] };
}

/* after the merges of 2026-10-26: #232, #243 and #257 merged minutes after the maintainer's hold note that stated the new
   rule; #242, #249 and #275 open. A page's table row for a bound: "| $v$ | [ref] |", the asterisk inside or after the $ */
function rowOf(t, v, ref) {
  const re = new RegExp('^\\| \\$' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\*)?\\$(\\*)? \\| \\[' + ref + '\\]');
  const l = t.split('\n').find((x) => re.test(x));
  if (!l) return null;
  const m = re.exec(l);
  return { star: Boolean(m[1] || m[2]), note: /Independently replayed \[T2026b?\]/.test(l) };
}
function readThird(DIR, spec) {
  const { PINS, T, readme, tableRow } = pinned(DIR);
  const contributing = T('upstream/CONTRIBUTING.md');
  const page = Object.fromEntries(['1a', '1b', '1c', '1d', '31a', '82a', '84b', '86a'].map((k) => [k, T('upstream/constants/' + k + '.md')]));
  const pr = prs(T, spec.prs);
  const citesB = (t) => /\[T2026b\]\**\s*Toledo, Carlos/.test(t);
  const r = Object.fromEntries(['1a', '1b', '1c', '1d', '31', '82', '84b', '86'].map((k) => [k, tableRow(k)]));
  const meta = (n) => ({ merged: pr[n].merged, mergedAt: pr[n].merged_at, mergedBy: pr[n].merged_by, mergeCommit: pr[n].merge_commit_sha, createdAt: pr[n].created_at, state: pr[n].state });
  const facts = {
    registryCommit: PINS.commit, registryCommitted: PINS.committed, fetched: PINS.fetched,
    rule: { secondParty: contributing.includes('**Removing an asterisk takes a second party.**'),
      routes: ['refereed and published', 'Palomar', 'a maintainer signs off', 'someone independent confirms'].filter((w) => contributing.includes(w)) },
    merged: { 232: meta(232), 243: meta(243), 257: meta(257) },
    open: { 242: meta(242), 249: meta(249), 275: meta(275) },
    stepFunctions: { readme: { '1a': r['1a'].upper, '1b': r['1b'].upper },
      rows: { '1a-A2026': rowOf(page['1a'], '1.5027434868', 'A2026'), '1a-EA2026': rowOf(page['1a'], '1.5027435320', 'EA2026'),
        '1b-A2026': rowOf(page['1b'], '0.3808585504', 'A2026'), '1b-EA2026': rowOf(page['1b'], '0.3808585749', 'EA2026') },
      cites: { '1a': citesB(page['1a']), '1b': citesB(page['1b']) },
      progressLine: readme.split('\n').some((l) => /^- \[1a\]\(.*\[1b\]\(.*\*\*independently replayed:\*\*.*Toledo/.test(l)) },
    autocorr: { readme: { '1c': r['1c'].upper, '1d': r['1d'].upper },
      rows: { '1c-R2026': rowOf(page['1c'], '0.4103287', 'R2026'), '1d-CERT2026': rowOf(page['1d'], '1.4630715826075594', 'CERT2026'),
        '1d-CERT2026-asPrinted': rowOf(page['1d'], '1.463071582607559', 'CERT2026') },
      cites: { '1c': cites(page['1c']), '1d': cites(page['1d']) },
      progressLine: readme.split('\n').some((l) => /^- \[1c\]\(.*\[1d\]\(.*\*\*independently replayed:\*\*.*Toledo/.test(l)) },
    sumProduct: { readme: r['84b'].upper, asterisked: /1\.9993\*/.test(r['84b'].upper), cites: cites(page['84b']),
      progressLine: readme.split('\n').some((l) => /^- \[84b\]\(.*\*\*improved upper bound \(unverified\):\*\*.*1\.9993\*/.test(l)) },
    stillAsterisked: { '31': /\*/.test(r['31'].upper), '82': /\*/.test(r['82'].upper), '86': /\*/.test(r['86'].upper),
      cites: { '31a': cites(page['31a']), '82a': cites(page['82a']), '86a': cites(page['86a']) } }
  };
  const F = facts, S = F.stepFunctions, A = F.autocorr;
  const sfRows = Object.values(S.rows), acRows = [A.rows['1c-R2026'], A.rows['1d-CERT2026']];
  if (!(F.rule.secondParty && F.rule.routes.length === 4)) die('CONTRIBUTING does not state the second-party rule with its four routes');
  if (!Object.values(F.merged).every((m) => m.merged && m.mergedBy === 'teorth')) die('#232, #243 and #257 are not all merged by the maintainer');
  if (!Object.values(F.open).every((m) => m.state === 'open' && !m.merged)) die('#242, #249 and #275 are not all open');
  if (!(sfRows.every((x) => x && !x.star && x.note) && !S.readme['1a'].includes('*') && !S.readme['1b'].includes('*') && S.cites['1a'] && S.cites['1b'] && S.progressLine)) die('#232 is not merged with the four step-function rows unmarked, [T2026b] cited and the README line in place');
  if (!(acRows.every((x) => x && !x.star && x.note) && !A.readme['1c'].includes('*') && !A.readme['1d'].includes('*') && A.cites['1c'] && A.cites['1d'] && A.progressLine)) die('#243 is not merged with the C_1c and C_1d rows unmarked, [T2026] cited and the README line in place');
  if (!(F.sumProduct.asterisked && F.sumProduct.cites && F.sumProduct.progressLine)) die('#257 is not merged with C_84b at 1.9993*, [T2026] cited and the README line in place');
  if (!(F.stillAsterisked['31'] && F.stillAsterisked['82'] && F.stillAsterisked['86'] && !F.stillAsterisked.cites['31a'] && !F.stillAsterisked.cites['82a'] && !F.stillAsterisked.cites['86a'])) die('C_31, C_82 and C_86 are not still asterisked with no replay cited (#249 and #242 open)');
  facts.marksRemovedOnReplays = sfRows.length + acRows.length;   // six on this day; four before it (registry-2026-10-18, -18b)
  facts.duplicate1dRow = Boolean(A.rows['1d-CERT2026-asPrinted']);  // the page keeps the row as first printed (asterisked) beside the corrected one
  return { facts, line: '#232 merged ' + F.merged[232].mergedAt + ', #243 ' + F.merged[243].mergedAt + ', #257 ' + F.merged[257].mergedAt + '; six marks off on the replays; the second-party rule stated; #242, #249, #275 open; 1d row kept as printed: ' + facts.duplicate1dRow };
}

/* ---- run --------------------------------------------------------------------------------------------- */
const named = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!CHECK && !SNAPS[named]) die('name a snapshot to fetch: ' + Object.keys(SNAPS).join(' | '));
let pins = 0;
for (const [name, spec] of Object.entries(SNAPS)) {
  if (!CHECK && name !== named) continue;
  const DIR = path.join(ROOT, 'corpus', 'optconst-queue', name), RECORD = path.join(DIR, 'record.json');
  if (!CHECK) fetchSnapshot(DIR, spec);
  const { facts, line } = spec.read(DIR, spec);
  const out = JSON.stringify({ what: 'Facts read from the pinned registry bytes in this directory (PINS.json); the method paper quotes them through tools/paper-numbers/cert-machine-method.js.', facts }, null, 1) + '\n';
  if (CHECK) {
    if (fs.readFileSync(RECORD, 'utf8') !== out) die('the facts re-read from the pins differ from ' + path.relative(ROOT, RECORD));
    pins += Object.keys(JSON.parse(fs.readFileSync(path.join(DIR, 'PINS.json'), 'utf8')).files).length;
  } else {
    fs.writeFileSync(RECORD, out);
    console.log('wrote ' + path.relative(ROOT, RECORD) + ' — ' + line);
  }
}
if (CHECK) console.log('registry records re-derived identical: ' + Object.keys(SNAPS).length + ' snapshots, ' + pins + ' pinned files');
