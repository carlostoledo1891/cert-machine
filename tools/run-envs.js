#!/usr/bin/env node
/* run-envs.js — run the three environments and write certs/envs-record.json.
   tools/ · cert-machine

   Everything the environments page says is read from this record, and this record is written by
   running the environments, never by hand. Offline: no model is called, no byte leaves the
   machine (the harness refuses the network unless ENVS_ALLOW_NETWORK=1).

   usage: node tools/run-envs.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(ROOT, 'instruments/envs/lib.js'));
const C = require(path.join(ROOT, 'instruments/envs/canary.js'));
const U = require(path.join(ROOT, 'instruments/envs/uniformity.js'));
const EC = require(path.join(ROOT, 'instruments/envs/env-canary.js'));
const EU = require(path.join(ROOT, 'instruments/envs/env-uniformity.js'));

const die = (m) => { console.error('ENVS RUN REFUSED: ' + m); process.exit(1); };
const t0 = Date.now();
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the corpus ------------------------------------------------------------- */
const corpus = L.FACTS.map(f => ({
  id: f.id, what: f.what, lo: f.lo, hi: f.hi, width: f.hi - f.lo,
  record: f.record || null, sha256: f.sha256 || null, source: f.source,
  publishedWrong: f.publishedWrong !== undefined ? f.publishedWrong : null
}));
if (corpus.some(f => !f.record && f.id !== 'terra.sigmaStar')) die('a fact names no record');

/* ---- the grader QA suite ------------------------------------------------------ */
const subs = C.buildSuite();
const TOLS = [...new Set(subs.map(s => s.tol).filter(Boolean))].sort((a, b) => b - a);
const families = {};
for (const s of subs) families[s.family] = (families[s.family] || 0) + 1;

const graders = Object.values(C.GRADERS).map(g => {
  const r = C.score(g, subs);
  const byTol = {};
  for (const tol of TOLS) {
    const at = subs.filter(s => s.truth === false && s.tol === tol);
    const acc = at.filter(s => { try { return !!g.decide(s); } catch (e) { return false; } }).length;
    byTol[String(tol)] = at.length ? acc / at.length : null;
  }
  const fooledBy = {};
  for (const s of r.fooled) fooledBy[s.family] = (fooledBy[s.family] || 0) + 1;
  return {
    name: g.name, falseAccept: r.faRate, falseReject: r.frRate,
    soundness: (1 - r.faRate) * (1 - r.frRate),
    wrongSubmissions: r.faTot, rightSubmissions: r.frTot,
    falseAcceptByTolerance: byTol, fooledBy
  };
});
const sound = graders.find(g => /enclosure/.test(g.name));
if (!sound || sound.falseAccept !== 0 || sound.falseReject !== 0)
  die('the enclosure grader is no longer sound on this suite — the whole page would be a lie');

/* ---- the uniformity gym -------------------------------------------------------- */
const suite = U.makeSuite(12, 20260903);
const SOLVERS = [
  ['sampling K=1e3', i => U.solveSampling(i, 1000)],
  ['sampling K=1e5', i => U.solveSampling(i, 100000)],
  ['sampling + bluffed tiling', i => U.solveBluff(i, 1000, i.dim === 1 ? 10 : 12)],
  ['interval bisection (sound)', i => U.solveInterval(i)],
  ['interval, 2e3-cell budget', i => U.solveInterval(i, 2000)]
];
const uniformity = {
  instances: suite.length,
  twoDimensional: suite.filter(s => s.dim === 2).length,
  needled: suite.filter(s => s.truth === 'FAILS').length,
  razor: suite.filter(s => s.razor).length,
  scoring: '+1 correct WITH evidence · 0 correct but unsupported · +0.25 honest UNDECIDED · -1 wrong',
  solvers: SOLVERS.map(([n, f]) => {
    const r = U.run(suite, n, f);
    return { name: n, score: r.total, correct: r.correct, wrong: r.wrong, unsupported: r.unsupported, abstained: r.abstain, needlesMissed: r.missed };
  })
};
const bluff = uniformity.solvers.find(s => /bluff/.test(s.name));
if (!(bluff && bluff.score < 0)) die('the bluffed tiling no longer scores negative — the environment stopped teaching the lesson');

/* ---- the attacker ladder -------------------------------------------------------- */
const tasks = EC.rungs.map(r => EC.makeTask(r.id, 7));
const attacker = {
  rungs: EC.rungs.map((r, i) => {
    const t = tasks[i];
    const no = EC.grade(t, { verdict: 'NO_ATTACK' });
    const tol = t.grader.tol;
    const c = tol ? L.toleranceInterior(t.fact, tol, 1) : null;
    const att = EC.grade(t, { attack: c ? c.value : (t.fact.lo + t.fact.hi) / 2 });
    return {
      id: r.id, label: r.label, note: r.note, attackable: !!t.attackable,
      fact: t.fact.id, grader: t.grader.kind, tolerance: tol,
      noAttackScore: no.score, mintedAttackScore: att.score,
      attackBandWidth: c ? c.worstDistanceToEnclosure : 0
    };
  })
};
if (attacker.rungs.some(r => r.attackable && r.noAttackScore >= 1)) die('a breakable rung rewards "no attack"');
if (attacker.rungs.some(r => !r.attackable && r.mintedAttackScore >= 1)) die('an unbreakable rung was broken — it is mislabelled');

/* ---- the forgery gate ------------------------------------------------------------ */
let planted = 0, leaked = 0;
for (const env of [EU, EC]) for (const r of env.rungs) for (const f of env.forgeries(r.id)) {
  planted++;
  if (env.grade(f.task, f.submission).score >= 1) leaked++;
}
if (leaked) die(leaked + ' planted forgeries were graded as solved');

/* ---- the ledger, if a sweep has run ---------------------------------------------- */
const LP = path.join(ROOT, 'certs', 'envs-ledger.jsonl');
const ledger = fs.existsSync(LP)
  ? fs.readFileSync(LP, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
  : [];

const out = {
  what: 'The environments record. Three environments over one idea: a certified enclosure is a '
    + 'canary factory. If a quantity is certified to width w and a grader accepts anything within '
    + 'tol > w of a stored decimal, every value in the surrounding band is simultaneously provably '
    + 'NOT the quantity and guaranteed to pass — so adversarial submissions are minted, without '
    + 'limit, from certificates already on disk. canary.js grades OTHER PEOPLE\'S graders with them; '
    + 'the uniformity gym rewards evidence over verdicts; the attacker environment rewards breaking '
    + 'a grader, and scores "I could not break it" separately from a false break.',
  honestyRule: 'Canaries are minted ONLY from facts marked certified, and mintCanaries throws on '
    + 'anything else rather than quietly degrading: the claim "provably wrong" is the product, and '
    + 'it may not rest on a decimal somebody re-typed. Every fact here is read out of a record in '
    + 'certs/ and that record is sha256-pinned beside it; the battery refuses on drift.',
  network: 'Offline. No model was called to produce this record; the harness refuses the network '
    + 'unless ENVS_ALLOW_NETWORK=1, which is the operator\'s decision, not the harness\'s.',
  corpus, canaryFamilies: families, submissions: subs.length,
  provablyWrong: subs.filter(s => s.truth === false).length,
  provablyRight: subs.filter(s => s.truth !== false).length,
  tolerancesProbed: TOLS, graders, uniformity, attacker,
  forgeries: { planted, leaked },
  ledgerRows: ledger.length,
  ledgerModels: [...new Set(ledger.map(r => r.model))],
  meta: { date: new Date().toISOString().slice(0, 10), git, ms: Date.now() - t0 }
};
fs.writeFileSync(path.join(ROOT, 'certs', 'envs-record.json'), JSON.stringify(out, null, 1) + '\n');
console.log('certs/envs-record.json written · ' + corpus.length + ' facts · ' + subs.length + ' submissions · '
  + 'tolerance grader false-accept ' + (100 * graders[0].falseAccept).toFixed(1) + '%, enclosure grader '
  + (100 * sound.falseAccept).toFixed(1) + '% · ' + planted + ' forgeries planted, ' + leaked + ' leaked @ git ' + git);
