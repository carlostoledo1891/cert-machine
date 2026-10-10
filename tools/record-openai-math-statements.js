#!/usr/bin/env node
/* record-openai-math-statements.js — lane S's ledger, certs/openai-math-statements.json.

   Lane S READS (it never certifies): each family's Comparator statements against the headline OpenAI wrote for the
   family, the abstracts, and OpenAI's own scope note. The readings themselves are kept verbatim in
   corpus/openai-math/readings/ (first/ — eight first readers over disjoint batches; second/ — the pre-registered second
   readers of every family whose first word was not MATCHES or NARROWER — DECLARED). This tool derives the ledger from
   those files by the rule of corpus/openai-math/preregistration.json (lanes.S.secondReading): where the two readers
   disagree, the LESS severe word is recorded and both are shown. The rule lives here and only here.

   A family whose word rests on a definition hole (lanes.S.flags DEFINITION HOLE) is marked conditional until lane K's
   strict run decides the bodies (certs/openai-math-kernel.json, rows[].strict).

   usage: node tools/record-openai-math-statements.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const RD = path.join(ROOT, 'corpus', 'openai-math', 'readings');
const OUT = path.join(ROOT, 'certs', 'openai-math-statements.json');
const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'release.json'), 'utf8'));
const prereg = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'preregistration.json'), 'utf8'));
const die = (m) => { console.error('LANE S REFUSED: ' + m); process.exit(1); };

const RANK = { 'MATCHES': 0, 'SUPPORT-ONLY': 0, 'NARROWER — DECLARED': 1, 'NARROWER — UNLINKED': 2, 'NARROWER — UNDECLARED': 3, 'DIFFERENT': 4 };
const WORDS = new Set(Object.keys(prereg.lanes.S.words).concat(['SUPPORT-ONLY']));
const norm = (w) => String(w || '').replace(/\s*-\s*/g, ' — ').replace(/\s+—\s+/g, ' — ').replace(/^SUPPORT — ONLY$/, 'SUPPORT-ONLY').trim();

const files = (d) => fs.existsSync(path.join(RD, d)) ? fs.readdirSync(path.join(RD, d)).filter((f) => f.endsWith('.json')).sort() : [];
const first = new Map(), second = new Map();
for (const f of files('first')) for (const r of JSON.parse(fs.readFileSync(path.join(RD, 'first', f), 'utf8')).families) {
  if (first.has(r.family)) die('family ' + r.family + ' read twice in the first pass');
  first.set(r.family, Object.assign({ file: 'first/' + f }, r));
}
for (const f of files('second')) for (const r of JSON.parse(fs.readFileSync(path.join(RD, 'second', f), 'utf8')).families) {
  if (second.has(r.family)) die('family ' + r.family + ' read twice in the second pass');
  second.set(r.family, Object.assign({ file: 'second/' + f }, r));
}
const withChallenges = release.families.filter((f) => f.challenges.length);
for (const f of withChallenges) if (!first.has(f.n)) die('family ' + f.n + ' has no first reading');

const kernel = fs.existsSync(path.join(ROOT, 'certs', 'openai-math-kernel.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'openai-math-kernel.json'), 'utf8')) : { rows: [] };
const strictOf = new Map(kernel.rows.filter((r) => r.strict).map((r) => [r.challenge, r.strict]));
const byName = new Map(release.challenges.map((c) => [c.name, c]));

const rows = withChallenges.map((F) => {
  const a = first.get(F.n), b = second.get(F.n);
  const w1 = norm(a.word);
  if (!WORDS.has(w1)) die('family ' + F.n + ': first word ' + JSON.stringify(a.word) + ' is not a pre-registered word');
  const needsSecond = !(w1 === 'MATCHES' || w1 === 'NARROWER — DECLARED');
  if (needsSecond && !b) return { family: F.n, title: F.title, firstWord: w1, word: null, state: 'AWAITING SECOND READING', challenges: F.challenges };
  let word = w1, disagreement = null;
  if (b) {
    const w2 = norm(b.word);
    if (!WORDS.has(w2)) die('family ' + F.n + ': second word ' + JSON.stringify(b.word) + ' is not a pre-registered word');
    if (w2 !== w1) { disagreement = { first: w1, second: w2, kind: w1 === 'NARROWER — UNDECLARED' && w2 === 'NARROWER — UNLINKED' ? 'the word only: the first readers had no UNLINKED (amendment 3)' : 'the reading' }; word = RANK[w2] <= RANK[w1] ? w2 : w1; }
  }
  const holes = F.challenges.filter((c) => (byName.get(c) || {}).definitionNames && byName.get(c).definitionNames.length);
  const conditional = holes.length ? holes.map((c) => ({ challenge: c, strict: strictOf.get(c) ? strictOf.get(c).word : 'NOT YET RUN' })) : null;
  const flags = [];
  for (const c of a.challenges || []) for (const fl of c.flags || []) flags.push({ challenge: c.name, flag: fl });
  return {
    family: F.n, title: F.title, headline: F.desc, challenges: F.challenges,
    word, firstWord: w1, secondWord: b ? norm(b.word) : null, disagreement,
    clauses: (b && b.clauses) || a.clauses || [], gap: a.gap || null, scopeNoteOnGap: a.scopeNoteOnGap || null,
    note: b ? b.note : null, firstSuspicious: a.suspicious || null, confidence: a.confidence || null,
    conditionalOnLaneK: conditional, flags, readings: [a.file].concat(b ? [b.file] : []),
  };
});
const tally = (xs) => xs.reduce((o, x) => ((o[x] = (o[x] || 0) + 1), o), {});
const decided = rows.filter((r) => r.word);
const ledger = {
  what: 'Lane S of the openai/math audit: every family with a Comparator challenge, its statements READ against the headline OpenAI wrote for it, the abstracts and OpenAI\'s scope note. A reading is not a certificate. Words, precedence and the second-reading rule are corpus/openai-math/preregistration.json (lanes.S, amendments 1 and 3); disagreements record the less severe word and show both.',
  release: release.commit,
  counts: {
    families: rows.length, decided: decided.length, awaiting: rows.length - decided.length,
    words: tally(decided.map((r) => r.word)), firstPassWords: tally(rows.map((r) => r.firstWord)),
    secondReadings: rows.filter((r) => r.secondWord).length, disagreements: rows.filter((r) => r.disagreement).length,
    disagreementsOnTheReading: rows.filter((r) => r.disagreement && r.disagreement.kind === 'the reading').map((r) => r.family),
    conditionalOnLaneK: rows.filter((r) => r.conditionalOnLaneK).length,
  },
  rows,
};
writeStable(OUT, ledger);
console.log('certs/openai-math-statements.json: ' + decided.length + ' of ' + rows.length + ' families decided — ' + JSON.stringify(ledger.counts.words) + '; ' + ledger.counts.disagreements + ' disagreements; awaiting ' + ledger.counts.awaiting);
