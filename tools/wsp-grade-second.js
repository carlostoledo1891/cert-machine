#!/usr/bin/env node
/* wsp-grade-second.js — the second grader (instruments/wsp/grade.js, JavaScript, written from the convention and sharing
   no code with instruments/wsp/grade.py) re-grades EVERY (gold, prediction) pair the Python grader graded in the two
   Weight-Space Programming records — certs/wsp-regrade.json (the released answers of the post's two runs, the released
   texts re-extracted, the two card re-runs) and certs/wsp-baseline.json (every sample of every baseline condition) — and
   compares the verdict words. Where the baseline texts are cached (corpus/wsp/.cache/baseline-runs/<pod>/<C>/
   samples.jsonl.gz) the extraction is compared too (the last closed box, read by both). Three red controls: a pair the
   grader must call WRONG, a \pm it must REFUSE, a reordered tuple it must REFUSE; and a planted flip of one recorded
   verdict that the comparison must catch. The record is certs/wsp-grade-second.json.

   usage: node tools/wsp-grade-second.js            → certs/wsp-grade-second.json
          node tools/wsp-grade-second.js --check    re-derives everything and compares with the record; nothing written
   MIT · cert-machine */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const G = require(path.join(ROOT, 'instruments', 'wsp', 'grade.js'));
const OUT = path.join(ROOT, 'certs', 'wsp-grade-second.json');
const RREC = 'certs/wsp-regrade.json', BREC = 'certs/wsp-baseline.json';
const CACHE = path.join(ROOT, 'corpus', 'wsp', '.cache', 'baseline-runs');
const CHECK = process.argv.includes('--check');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (m) => { console.error('FAIL ' + m); process.exit(1); };
const t0 = Date.now();

/* every pair the Python grader graded, with its recorded verdict; the baseline's own rule (an empty box is WRONG before
   the grader is asked) is applied here as the record states it */
function pairs() {
  const out = [];
  const R = J(RREC), B = J(BREC);
  for (const run of Object.keys(R.post_runs)) {
    for (const r of R.post_runs[run].rows) {
      out.push({ src: RREC + '#/post_runs/' + run, id: r.id, gold: r.gold, pred: r.pred_first === undefined ? null : r.pred_first, theirs: r.verdict });
      if ('our_extraction' in r) out.push({ src: RREC + '#/post_runs/' + run + ' (text)', id: r.id, gold: r.gold, pred: r.our_extraction, theirs: r.text_verdict });
    }
  }
  for (const run of Object.keys(R.card_runs)) {
    for (const r of R.card_runs[run].rows) out.push({ src: RREC + '#/card_runs/' + run, id: r.id, gold: r.gold, pred: r.our_extraction, theirs: r.verdict });
  }
  for (const c of Object.keys(B.rows)) {
    for (const p of B.rows[c]) for (const s of p.samples) out.push({ src: BREC + '#/rows/' + c, id: p.id + '#' + s.k, gold: p.gold, pred: s.pred, empty: !!s.empty_box, theirs: s.verdict });
  }
  return { out, B };
}
const gradeOne = (p) => (p.empty ? 'WRONG' : G.grade(p.gold, p.pred)[0]);

function compare(list) {
  const bySrc = {}, dis = [];
  for (const p of list) {
    const ours = gradeOne(p);
    const t = bySrc[p.src] || (bySrc[p.src] = { pairs: 0, agree: 0, CORRECT: 0, WRONG: 0, REFUSED: 0 });
    t.pairs++; t[ours]++;
    if (ours === p.theirs) t.agree++; else dis.push({ src: p.src, id: p.id, gold: p.gold, pred: p.pred, python: p.theirs, javascript: ours });
  }
  return { bySrc, dis };
}

/* the extraction, where the baseline texts are cached: the last closed box read by grade.js against the record's pred */
function extraction(B) {
  const out = {};
  for (const pod of B.pods || []) {
    for (const c of Object.keys(B.rows)) {
      const f = path.join(CACHE, pod.id, c, 'samples.jsonl.gz');
      if (!fs.existsSync(f)) { out[c] = 'not cached'; continue; }
      const rec = {};
      for (const p of B.rows[c]) for (const s of p.samples) rec[p.id + '#' + s.k] = s.pred;
      let n = 0, agree = 0;
      const lines = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        const s = JSON.parse(line);
        const k = s.id + '#' + s.k;
        if (!(k in rec)) fail('a cached text of ' + c + ' has no sample in the record: ' + k);
        n++;
        if (G.extractBoxed(s.text) === rec[k]) agree++;
      }
      out[c] = { texts: n, extraction_agrees: agree, file_sha256: sha(f) };
    }
  }
  return out;
}

function reds(list) {
  const r = [];
  r.push({ what: 'a wrong number is WRONG', pass: G.grade('4', '5')[0] === 'WRONG' });
  r.push({ what: 'a \\pm is REFUSED, never decided', pass: G.grade('2', '\\pm 2')[0] === 'REFUSED' });
  r.push({ what: 'the same elements in another order are REFUSED, not WRONG', pass: G.grade('(1,2)', '(2,1)')[0] === 'REFUSED' });
  const flipped = list.map((p, i) => (i === 7 ? { ...p, theirs: p.theirs === 'CORRECT' ? 'WRONG' : 'CORRECT' } : p));
  r.push({ what: 'one recorded verdict flipped: the comparison reports exactly one more disagreement', pass: compare(flipped).dis.length === compare(list).dis.length + 1 });
  return r;
}

function build() {
  const { out: list, B } = pairs();
  const { bySrc, dis } = compare(list);
  const red = reds(list);
  if (!red.every((x) => x.pass)) fail('a red control did not fire: ' + JSON.stringify(red.filter((x) => !x.pass)));
  const pairsN = list.length, agree = Object.values(bySrc).reduce((a, t) => a + t.agree, 0);
  return {
    what: 'The Weight-Space Programming answers graded a second time by a JavaScript grader (instruments/wsp/grade.js) written from the convention stated in instruments/wsp/grade.py and sharing no code with it: every (gold, prediction) pair the Python grader graded in certs/wsp-regrade.json (the released first-sample answers of the post\'s two runs, the released texts re-extracted, the two card re-runs) and in certs/wsp-baseline.json (every sample of every baseline condition), the verdict words compared; the extraction compared where the baseline texts are cached; three red controls and a planted flip',
    generated: new Date().toISOString(),
    seconds: 0,
    graders: {
      python: { file: 'instruments/wsp/grade.py', sha256: sha(path.join(ROOT, 'instruments', 'wsp', 'grade.py')) },
      javascript: { file: 'instruments/wsp/grade.js', sha256: sha(path.join(ROOT, 'instruments', 'wsp', 'grade.js')) },
    },
    records: { [RREC]: sha(path.join(ROOT, RREC)), [BREC]: sha(path.join(ROOT, BREC)) },
    pairs: pairsN, agree, disagreements: dis.length, by_source: bySrc, disagreement_rows: dis,
    extraction: extraction(B),
    red_controls: red,
  };
}

const rec = build();
rec.seconds = Math.round((Date.now() - t0) / 100) / 10;
const strip = (r) => { const c = JSON.parse(JSON.stringify(r)); delete c.generated; delete c.seconds; return c; };
if (CHECK) {
  if (!fs.existsSync(OUT)) fail('no record at ' + OUT);
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (JSON.stringify(strip(old)) !== JSON.stringify(strip(rec))) fail('the record differs on re-derivation (pairs, verdicts, pins or extraction moved)');
  if (rec.disagreements !== 0) fail(rec.disagreements + ' disagreements between the two graders');
  console.log('PASS ' + rec.pairs + ' pairs re-graded by the second grader, ' + rec.agree + ' agree, ' + rec.disagreements + ' disagreements; ' + rec.red_controls.length + ' red controls fired; ' + rec.seconds + ' s');
} else {
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote ' + path.relative(ROOT, OUT) + ': ' + rec.pairs + ' pairs, ' + rec.agree + ' agree, ' + rec.disagreements + ' disagreements; extraction ' + JSON.stringify(rec.extraction) + '; ' + rec.seconds + ' s');
  if (rec.disagreements) console.log(JSON.stringify(rec.disagreement_rows.slice(0, 40), null, 1));
}
