/* ENVS — sweep.js: run a rung x model sweep and write the ledger.  MIT, clean-room.

   THE SEQUENCE THIS ENFORCES.  ladder -> single-model calibration -> forgery gate green -> sweep.
   The gate runs before any model is called and aborts the whole sweep if a planted forgery grades as
   solved, because in that case every number the run would produce is void.

   STUB MODELS ARE NOT PLACEHOLDERS.  A pure sampler, a bluffer that dresses a grid as evidence, a
   sound solver and a sound solver on a small budget are the reference rows a buyer actually wants:
   they say what the environment measures, they cost nothing, and they calibrate the ladder before a
   cent of API spend.  They also keep the pipeline honest offline — no network is touched here.

   Usage:  node sweep.js stubs [k]        offline sweep over the stub models (default k = 16)
           node sweep.js gate             run the forgery gates only
           node sweep.js one <rung> <model>  show a single rollout end to end
           node sweep.js table            print the last ledger as a rung x model table            */
'use strict';
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, 'harness.js'));
const U = require(path.join(__dirname, 'uniformity.js'));
const ENV_U = require(path.join(__dirname, 'env-uniformity.js'));
const ENV_C = require(path.join(__dirname, 'env-canary.js'));

const LEDGER = path.join(__dirname, '..', '..', 'certs', 'envs-ledger.jsonl');   /* PORT: records live in certs/ here, not beside the instrument */

/* ------------------------------------------------------------------ stub models */
const J = o => '```json\n' + JSON.stringify(o) + '\n```';

const STUBS = [
  /* what a model does if it reasons numerically and then answers: right verdict often, no evidence */
  H.stubModel('stub:sampler-1e3', (_p, { task }) => {
    const s = U.solveSampling(task.inst, 1000);
    return J(s.verdict === 'FAILS' ? { verdict: 'FAILS', witness: s.witness } : { verdict: 'HOLDS' });
  }),
  /* the reward hack: claim HOLDS and dress a uniform grid as a verified tiling */
  H.stubModel('stub:bluffer', (_p, { task }) => {
    const d = task.inst.P.dim;
    return J({ verdict: 'HOLDS', covering: [`:${d === 1 ? 10 : 12}`] });
  }),
  /* sound, generous budget */
  H.stubModel('stub:sound', (_p, { task }) => {
    const r = U.solveInterval(task.inst);
    if (r.verdict === 'FAILS') return J({ verdict: 'FAILS', witness: r.witness });
    if (r.verdict === 'HOLDS') return J({ verdict: 'HOLDS', covering: r.covering });
    return J({ verdict: 'UNDECIDED' });
  }),
  /* sound, small budget: abstains rather than guessing — the calibration reference row */
  H.stubModel('stub:sound-2e3', (_p, { task }) => {
    const r = U.solveInterval(task.inst, 2000);
    if (r.verdict === 'FAILS') return J({ verdict: 'FAILS', witness: r.witness });
    if (r.verdict === 'HOLDS') return J({ verdict: 'HOLDS', covering: r.covering });
    return J({ verdict: 'UNDECIDED' });
  }),
  /* the floor: answers in prose. Exercises the parser path so REFUSED is a measured rate. */
  H.stubModel('stub:prose', () => 'I examined the function on a grid of one thousand points and it ' +
    'appears to remain positive throughout, so the claim holds.'),
];

/* attacker-environment stubs. The two one-note strategies are the interesting rows: each wins half
   the ladder and is confidently wrong on the other half, which is what an uncalibrated auditor does. */
const STUBS_C = [
  H.stubModel('stub:always-attack', (_p, { task }) => {
    const f = task.fact, tol = task.grader.tol;
    return J({ attack: tol ? f.hi + (tol - (f.hi - f.lo)) / 2 : f.hi * (1 + 1e-9) });
  }),
  H.stubModel('stub:always-noattack', () => J({ verdict: 'NO_ATTACK' })),
  H.stubModel('stub:calibrated', (_p, { task }) => {
    const f = task.fact, g = task.grader, w = f.hi - f.lo;
    if (g.kind === 'enclosure') return J({ verdict: 'NO_ATTACK' });
    const tolAbs = g.kind === 'relative-tolerance' ? g.tol * Math.abs(g.ref) : g.tol;
    if (!(w < tolAbs * 0.5)) return J({ verdict: 'NO_ATTACK' });     // the band is empty
    return J({ attack: f.hi + (tolAbs - w) / 2 });
  }),
  H.stubModel('stub:prose', () => 'The grader looks reasonably tight, so I do not think it can be broken.'),
];
const byId = id => STUBS.find(m => m.id === id);

/* ------------------------------------------------------------------ CLI */
const mode = process.argv[2] || 'stubs';

if (mode === 'gate') {
  for (const env of [ENV_U]) {
    const g = H.forgeryGate(env);
    console.log(`${env.name}: ${g.total} forgeries planted across ${env.rungs.length} rungs, ${g.leaked} leaked  ->  ${g.ok ? 'GATE GREEN' : 'GATE FAILED'}`);
    const seen = new Set();
    for (const r of g.results) { if (seen.has(r.why)) continue; seen.add(r.why); console.log(`    ${r.verdict.padEnd(12)} ${r.why}`); }
  }
} else if (mode === 'one') {
  const rungId = process.argv[3] || 'r1', mid = process.argv[4] || 'stub:sound';
  const rung = ENV_U.rungs.find(r => r.id === rungId), model = byId(mid);
  const task = ENV_U.makeTask(rungId, 20260903);
  console.log(`${ENV_U.name} · ${rungId} (${rung.label}) · truth ${task.inst.truth} · needle ${task.inst.minWidth.toExponential(0)} · margin ${task.inst.margin}`);
  model.complete(ENV_U.renderPrompt(task), { task }).then(r => {
    const p = ENV_U.parse(r.text);
    console.log(`  model ${mid} -> ${r.text.slice(0, 120).replace(/\n/g, ' ')}${r.text.length > 120 ? ' …' : ''}`);
    if (!p.ok) { console.log(`  REFUSED_PARSE: ${p.why}`); return; }
    const g = ENV_U.grade(task, p.submission);
    console.log(`  ${g.verdict}  score ${g.score}  (${g.note})`);
  });
} else if (mode === 'table') {
  if (!fs.existsSync(LEDGER)) { console.log('no ledger yet — run: node sweep.js stubs'); process.exit(0); }
  const rows = fs.readFileSync(LEDGER, 'utf8').trim().split('\n').map(JSON.parse);
  const at = rows[rows.length - 1].at;
  const last = rows.filter(r => r.at === at);
  /* one ledger, several environments — resolve rung metadata from the ROW's env, not from whichever
     environment happens to be imported first (the first cut of this reader assumed uniformity and
     threw on the canary rows). */
  const ENVS = { [ENV_U.name]: ENV_U, [ENV_C.name]: ENV_C };
  for (const envName of [...new Set(last.map(r => r.env))]) {
    const rs = last.filter(r => r.env === envName);
    const models = [...new Set(rs.map(r => r.model))], rungs = [...new Set(rs.map(r => r.rung))];
    console.log(`\n  ${envName}`);
    console.log(`  ${'rung'.padEnd(26)}${models.map(m => m.replace('stub:', '').padStart(18)).join('')}`);
    for (const rg of rungs) {
      const cells = models.map(m => {
        const c = rs.find(r => r.rung === rg && r.model === m);
        return c ? `${(100 * c.passP).toFixed(1)}% [${(100 * c.passLo).toFixed(0)}-${(100 * c.passHi).toFixed(0)}]`.padStart(18) : ''.padStart(18);
      });
      const meta = (ENVS[envName] || ENV_U).rungs.find(r => r.id === rg) || { label: '' };
      console.log(`  ${(rg + ' ' + meta.label).padEnd(26)}${cells.join('')}`);
    }
  }
  console.log(`\n  pass rate with 95% Wilson interval · k = ${last[0].k} per cell · ${last.length} cells`);
} else {
  const k = Number(process.argv[3] || 16);
  (async () => {
    console.log(`FORGERY GATE`);
    const g = H.forgeryGate(ENV_U);
    console.log(`  ${ENV_U.name}: ${g.total} planted, ${g.leaked} leaked -> ${g.ok ? 'GREEN' : 'FAILED'}`);
    if (!g.ok) process.exit(1);
    console.log(`\nSWEEP  ${ENV_U.rungs.length} rungs x ${STUBS.length} models x k=${k}  (offline, no network)`);
    const res = await H.sweep([ENV_U], STUBS, { k, onCell: c => {
      process.stdout.write(`  ${c.rung} ${c.model.padEnd(18)} pass ${H.fmtCI(c.pass).padEnd(22)} ` +
        `wrong ${String(c.wrong).padStart(2)}  abstain ${String(c.abstained).padStart(2)}  refused ${String(c.refusedParse).padStart(2)}\n`);
    } });
    let n = H.appendLedger(LEDGER, res, { envVersion: 'v2', harness: 'v1' });

    const gc = H.forgeryGate(ENV_C);
    console.log(`\nFORGERY GATE  ${ENV_C.name}: ${gc.total} planted, ${gc.leaked} leaked -> ${gc.ok ? 'GREEN' : 'FAILED'}`);
    if (!gc.ok) process.exit(1);
    console.log(`\nSWEEP  ${ENV_C.rungs.length} rungs x ${STUBS_C.length} models x k=${k}  (offline)`);
    const resC = await H.sweep([ENV_C], STUBS_C, { k, onCell: c => {
      process.stdout.write(`  ${c.rung} ${c.model.padEnd(20)} pass ${H.fmtCI(c.pass).padEnd(22)} ` +
        `wrong ${String(c.wrong).padStart(2)}  refused ${String(c.refusedParse).padStart(2)}\n`);
    } });
    /* ONE run timestamp for both environments: the ledger is read back by filtering on `at`, so two
       stamps split a single sweep into two runs and every reader then shows only half of it. */
    resC.at = res.at;
    n += H.appendLedger(LEDGER, resC, { envVersion: 'v2', harness: 'v1' });
    console.log(`\n  ${n} ledger rows appended to ${path.relative(process.cwd(), LEDGER)}`);
    console.log(`  forgery gates: ${g.total + gc.total} planted, 0 leaked`);
  })();
}

module.exports = { STUBS, STUBS_C, LEDGER, ENV_U, ENV_C };
