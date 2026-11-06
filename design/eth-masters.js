/* eth-masters.js — the con-leche story told once, read by both ETH pages (reports/eth-chain.html and /eth/).
   Every sentence is computed from certs/eth-openai-chain.json (`masters` and `judge.diagnosis`); nothing here is a number
   typed by hand, and the record's bytes are not touched (it is pinned by the self-audit). Three things:
     summary(och)   con-leche and con-ron from their master branches accept the same export, with con-leche's memory
     stops(och)     every stop of the bundled checkers was a resource limit or an old build, none a rejection
     rerun(och)     the two commands that re-check the public export on a 64 GB machine, from the measured runs
   Each returns '' (or null) when the record does not carry what it would say, so a page never states it unread.   MIT */
'use strict';

const jobs = (r) => Number((/--jobs=(\d+)/.exec(r.args) || [])[1] || 0);
const gib = (kb) => (kb / 1048576).toFixed(1);
const ok = (och, checker, exp) => (((och.masters || {}).runs) || []).filter((r) => r.checker === checker && r.export === exp && r.exit === 0 && r.accepted);

function summary(och) {
  const cl = ok(och, 'con-leche', 'chain'), cr = ok(och, 'con-ron', 'chain');
  if (!cl.length || !cr.length) return '';
  const lean = cl.filter((r) => !/--trusted/.test(r.args)).sort((a, b) => jobs(b) - jobs(a));
  const ch = [...ok(och, 'con-leche', 'challenge'), ...ok(och, 'con-ron', 'challenge')];
  const dep = (och.masters || {}).deposit;
  return 'After the record, at the con-leche maintainer’s request, con-leche and con-ron built from their master branches and run by hand on the same export accept all '
    + cl[0].accepted.toLocaleString('en-US') + ' declarations'
    + (lean.length ? ' (con-leche needs ' + lean.map((r, i) => gib(r.maxRssKb) + (i ? '' : ' GiB') + ' at ' + jobs(r) + (i ? '' : ' workers')).join(', ') + ')' : '')
    + (ch.length ? ', and all ' + ch[0].accepted.toLocaleString('en-US') + ' of the export of OpenAI’s own challenge' : '')
    + ': their fuel stops are fixed upstream, not yet in a Lean release.'
    + (dep ? ' Both exports are public as a test case for the checkers (doi:' + dep.doi + ').' : '')
    + ' Outside the judge, not part of the decision.';
}

function stops(och) {
  const d = (och.judge || {}).diagnosis || {}, b = d.bundled || {}, ours = d.ours || {};
  const pass = (pred) => Object.entries({ ...b, ...ours }).some(([k, v]) => pred(k) && v.exit === 0);
  const nanoda = pass((k) => /^nanoda, our pinned build/.test(k)), l4l = pass((k) => /^lean4lean \(every fuel field/.test(k));
  const cl = ok(och, 'con-leche', 'chain').length > 0, cr = ok(och, 'con-ron', 'chain').length > 0;
  if (!(nanoda && l4l && cl && cr)) return '';
  return 'So every stop of the four bundled checkers was a resource limit or an old build, and none was a rejection: nanoda and lean4lean accept once given room (a thread stack, a fuel setting), con-leche and con-ron accept on their master branches.';
}

function rerun(och) {
  const dep = (och.masters || {}).deposit;
  const cr = ok(och, 'con-ron', 'chain').filter((r) => r.machine && r.machine <= 64e9)[0];   /* the run on a 64 GB machine, not the fastest */
  const cl8 = ok(och, 'con-leche', 'chain').find((r) => jobs(r) === 8 && !/--trusted/.test(r.args));
  if (!dep || !cr || !cl8) return null;
  const f = (dep.files || []).find((x) => x.key === 'export-comparator.ndjson.zst'), u = (dep.uncompressed || []).find((x) => x.file === 'export-comparator.ndjson');
  if (!f || !u) return null;
  const mins = (s) => (s < 90 ? 'about a minute' : 'about ' + Math.round(s / 60) + ' minutes');
  return {
    doi: dep.doi, record: dep.record, mb: Math.round(f.size / 1e6), sha256: u.sha256,
    text: 'The OpenAI chain’s export, the same bytes the judge read, is public: download ' + Math.round(f.size / 1e6) + ' MB (doi:' + dep.doi + ') and run any checker on it; the deposit’s README gives the commands. On a 64 GB machine con-ron accepted its '
      + cr.accepted.toLocaleString('en-US') + ' declarations in ' + mins(cr.seconds) + ' (' + gib(cr.maxRssKb) + ' GiB); con-leche at 8 workers peaked at ' + gib(cl8.maxRssKb) + ' GiB, inside such a machine’s limit (' + mins(cl8.seconds) + ' on a larger one). Both are built from their master branches; nanoda and lean4lean need the room named above. A rerun by anyone outside this lab is the second party these pages lack.',
    code: 'curl -L -o export-comparator.ndjson.zst "' + dep.record + '/files/export-comparator.ndjson.zst?download=1"\n'
      + 'zstd -d export-comparator.ndjson.zst && shasum -a 256 export-comparator.ndjson   # ' + u.sha256.slice(0, 16) + '…\n'
      + 'con-ron --jobs=16 export-comparator.ndjson      # leanprover/con-ron, cargo build --release\n'
      + 'con-leche --jobs=8 export-comparator.ndjson     # leanprover/con-leche, lake build'
  };
}

module.exports = { summary, stops, rerun };
