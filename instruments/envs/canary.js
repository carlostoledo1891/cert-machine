/* ENVS · ENVIRONMENT A — canary.js: THE GRADER QA SUITE.  MIT, clean-room.

   WHAT THIS IS.  Not a training environment — a TEST SUITE FOR OTHER PEOPLE'S GRADERS.  You point it
   at a checker and it reports two numbers that nobody currently measures:

       FALSE-ACCEPT RATE   how often the grader passes a submission that is provably wrong
       FALSE-REJECT RATE   how often it fails a submission that is provably right

   Both are required.  A false-accept benchmark alone is trivially gamed by rejecting everything, so
   every run carries controls drawn from inside the certified enclosures.  A grader is only as good as
   min(1 - FA, 1 - FR), and reporting one without the other is the same mistake the graders make.

   WHY IT CANNOT BE BLUFFED.  Submissions are not hand-written adversarial examples; they are minted
   mechanically from certified enclosures (see lib.js).  Given an enclosure of width 4e-13 and a
   grader tolerance of 1e-9, the set of values that are simultaneously provably-wrong and
   guaranteed-to-pass is ~2500x wider than the enclosure.  There is no shortage and no cleverness
   required.  The tolerance IS the vulnerability.

   HOW TO RUN IT ON YOUR OWN GRADER.  Write a module exporting { name, decide(submission) -> bool }
   where submission = { factId, what, value, tol }.  Then:
       node canary.js run ./path/to/your-grader.js
   Nothing leaves your machine.  The suite prints the rates and the exact submissions that fooled it.

   Usage:  node canary.js demo            run the built-in reference graders (the self-test)
           node canary.js run <module>    run one external grader module
           node canary.js list            show the fact corpus and how many canaries each mints    */
'use strict';
const path = require('path');
const L = require(path.join(__dirname, 'lib.js'));

/* PORT PATCH (cert-machine): the bench probed three tolerances. The curve is
   the whole argument — a tolerance grader's false-accept rate does NOT fall off
   a cliff as the tolerance tightens — and three points cannot show a curve. */
const TOLS = [1e-3, 1e-4, 1e-6, 1e-8, 1e-9, 1e-10, 1e-12, 1e-14, 1e-15];

/* ---------------------------------------------------------------------------------------------
   Build the submission set: canaries (provably wrong) + controls (provably right).
--------------------------------------------------------------------------------------------- */
function buildSuite() {
  const subs = [];
  for (const fact of L.FACTS) {
    for (const tol of TOLS) {
      for (const c of L.mintCanaries(fact, tol)) {
        subs.push({ ...c, what: fact.what, truth: false, reference: (fact.lo + fact.hi) / 2 });
      }
    }
    for (const c of L.mintControls(fact)) {
      subs.push({ ...c, what: fact.what, tol: 1e-9, reference: (fact.lo + fact.hi) / 2 });
    }
    // the realistic honest submission: the midpoint printed at full double precision and read back.
    // A grader that rejects this is rejecting the best a double can carry.
    const rt = Number(((fact.lo + fact.hi) / 2).toPrecision(17));
    if (rt >= fact.lo && rt <= fact.hi)
      subs.push({ family: 'control', factId: fact.id, what: fact.what, value: rt, tol: 1e-9,
                  truth: true, reference: (fact.lo + fact.hi) / 2, why: 'midpoint at full double precision' });
  }
  // the #852 family: the naive float evaluation of a cancelling sum whose true value is exactly 0
  for (const n of [1e4, 1e6]) {
    const c = L.cancellationCanary(n);
    if (c.value !== 0) {
      subs.push({
        family: 'float-cancellation', factId: 'synth.cancellingSum', what: `sum with ${n} cancelling terms, true value exactly 0`,
        value: c.value, tol: 1e-9, truth: false, reference: 0,
        why: `naive IEEE-754 evaluation returns ${c.value.toExponential(3)}; the true value is exactly 0 ` +
             `(certified enclosure [${c.truthEnclosure[0].toExponential(2)}, ${c.truthEnclosure[1].toExponential(2)}])`,
      });
    }
    subs.push({
      family: 'control', factId: 'synth.cancellingSum', what: `sum with ${n} cancelling terms`,
      value: 0, tol: 1e-9, truth: true, reference: 0, why: 'the exact value',
    });
  }
  return subs;
}

/* ---------------------------------------------------------------------------------------------
   REFERENCE GRADERS — the three shapes actually found in the wild.
--------------------------------------------------------------------------------------------- */
const GRADERS = {
  /* the common one: compare to a stored answer key within an absolute tolerance */
  absoluteTolerance: {
    name: 'absolute-tolerance (|v - key| < tol)',
    decide: s => Math.abs(s.value - s.reference) < s.tol,
  },
  /* the other common one: relative tolerance */
  relativeTolerance: {
    name: 'relative-tolerance (|v - key|/|key| < tol)',
    decide: s => {
      const d = Math.abs(s.value - s.reference);
      const scale = Math.max(Math.abs(s.reference), 1e-300);
      return d / scale < s.tol;
    },
  },
  /* brittle exact-string matching: no false accepts, but rejects honest submissions */
  exactMatch: {
    name: 'exact-match (v === key)',
    decide: s => s.value === s.reference,
  },
  /* the sound one: accept iff the value lies inside the certified enclosure */
  enclosure: {
    name: 'enclosure (v in certified [lo,hi])  <- the sound grader',
    decide: s => {
      const f = L.factById(s.factId);
      if (!f) return s.value === s.reference;          // the synthetic fact: truth is exactly 0
      return s.value >= f.lo && s.value <= f.hi;
    },
  },
};

/* ---------------------------------------------------------------------------------------------
   Scoring
--------------------------------------------------------------------------------------------- */
function score(grader, subs) {
  let fa = 0, faTot = 0, fr = 0, frTot = 0;
  const fooled = [], wronglyRejected = [];
  for (const s of subs) {
    let accepted;
    try { accepted = !!grader.decide(s); } catch { accepted = false; }
    if (s.truth === false) {
      faTot++;
      if (accepted) { fa++; fooled.push(s); }
    } else {
      frTot++;
      if (!accepted) { fr++; wronglyRejected.push(s); }
    }
  }
  return { fa, faTot, fr, frTot, faRate: fa / faTot, frRate: fr / frTot, fooled, wronglyRejected };
}

function byFamily(subs, res) {
  const m = new Map();
  for (const s of subs) {
    if (s.truth !== false) continue;
    const e = m.get(s.family) || { n: 0, fooled: 0 };
    e.n++;
    if (res.fooled.includes(s)) e.fooled++;
    m.set(s.family, e);
  }
  return m;
}

function report(grader, subs) {
  const r = score(grader, subs);
  const pct = v => (100 * v).toFixed(1).padStart(5) + '%';
  console.log(`\n  ${grader.name}`);
  console.log(`     FALSE-ACCEPT ${pct(r.faRate)}  (${r.fa}/${r.faTot} provably-wrong submissions passed)`);
  console.log(`     FALSE-REJECT ${pct(r.frRate)}  (${r.fr}/${r.frTot} provably-right submissions failed)`);
  // A single headline number, because a buyer needs one. Soundness is the product of the two
  // survival rates: being right about wrong answers AND right about right ones. Reporting either
  // alone is the mistake the graders themselves make.
  console.log(`     SOUNDNESS    ${pct((1 - r.faRate) * (1 - r.frRate))}  = (1 - FA) x (1 - FR)`);
  // per-tolerance: a grader can be sound at 1e-12 and useless at 1e-6, and the buyer sets the tol
  const byTol = new Map();
  for (const s of subs) {
    if (s.truth !== false) continue;
    const e = byTol.get(s.tol) || { n: 0, f: 0 };
    e.n++; if (r.fooled.includes(s)) e.f++;
    byTol.set(s.tol, e);
  }
  const tolRows = [...byTol.entries()].sort((a, b) => b[0] - a[0])
    .map(([t, e]) => `${t.toExponential(0)}: ${pct(e.f / e.n).trim()}`);
  if (tolRows.length > 1) console.log(`     by tolerance: ${tolRows.join('  ·  ')}`);
  const fam = byFamily(subs, r);
  const rows = [...fam.entries()].filter(([, e]) => e.fooled > 0)
    .map(([k, e]) => `${k} ${e.fooled}/${e.n}`);
  if (rows.length) console.log(`     fooled by: ${rows.join(' · ')}`);
  if (r.fooled.length) {
    const s = r.fooled[0];
    console.log(`     e.g. ${s.factId} = ${s.value}`);
    console.log(`          ${s.why}`);
  }
  return r;
}

/* ---------------------------------------------------------------------------------------------
   CLI
--------------------------------------------------------------------------------------------- */
const mode = process.argv[2] || 'demo';
if (require.main !== module) { /* imported: no CLI */ }
else if (mode === 'list') {
  console.log('FACT CORPUS (certified enclosures on this bench)\n');
  for (const f of L.FACTS) {
    const w = f.hi - f.lo;
    let n = 0;
    for (const tol of TOLS) n += L.mintCanaries(f, tol).length;
    console.log(`  ${f.id.padEnd(20)} width ${w.toExponential(2).padStart(9)}   canaries ${String(n).padStart(3)}`);
    console.log(`     ${f.what}`);
    console.log(`     source: ${f.source}`);
  }
} else if (mode === 'demo' || mode === 'run') {
  const subs = buildSuite();
  const nWrong = subs.filter(s => s.truth === false).length;
  console.log(`GRADER QA SUITE — ${subs.length} submissions (${nWrong} provably wrong, ${subs.length - nWrong} provably right)`);
  console.log(`tolerances probed: ${TOLS.map(t => t.toExponential(0)).join(', ')}`);
  if (mode === 'demo') {
    for (const g of Object.values(GRADERS)) report(g, subs);
    console.log('\n  The last grader is the point: the same suite that breaks tolerance checking is passed');
    console.log('  cleanly by a checker that compares against the certificate instead of a decimal.');
  } else {
    const p = process.argv[3];
    if (!p) { console.log('usage: node canary.js run <path-to-grader-module>'); process.exit(1); }
    const g = require(path.resolve(p));
    report(g, subs);
  }
} else if (mode === 'run-cli') {
  /* Adapter for a grader that is not JavaScript. Each submission is written to the child's stdin as
     one JSON object per line; the child answers one line per submission, "accept" or "reject".
     Most real graders are Python, and requiring a JS shim would have made the suite unsellable. */
  const cmd = process.argv.slice(3);
  if (!cmd.length) { console.log('usage: node canary.js run-cli <command> [args...]'); process.exit(1); }
  const { spawnSync } = require('child_process');
  const subs = buildSuite();
  const input = subs.map(s => JSON.stringify({ factId: s.factId, value: s.value, tol: s.tol })).join('\n') + '\n';
  const res = spawnSync(cmd[0], cmd.slice(1), { input, encoding: 'utf8' });
  if (res.error) { console.log(`could not run grader: ${res.error.message}`); process.exit(1); }
  const lines = res.stdout.trim().split('\n');
  if (lines.length !== subs.length) {
    console.log(`grader returned ${lines.length} lines for ${subs.length} submissions — REFUSING to score a misaligned run`);
    process.exit(1);
  }
  const verdicts = lines.map(l => /^\s*(accept|true|1|pass)\s*$/i.test(l));
  let k = 0;
  report({ name: cmd.join(' '), decide: () => verdicts[k++] }, subs);
} else if (mode === 'json') {
  const subs = buildSuite();
  const rows = Object.values(GRADERS).map(g => {
    const r = score(g, subs);
    const byTol = {};
    for (const s of subs) {
      if (s.truth !== false) continue;
      byTol[s.tol] = byTol[s.tol] || { n: 0, f: 0 };
      byTol[s.tol].n++; if (r.fooled.includes(s)) byTol[s.tol].f++;
    }
    const fam = {};
    for (const [k, v] of byFamily(subs, r)) fam[k] = v;
    return { name: g.name, fa: r.fa, faTot: r.faTot, fr: r.fr, frTot: r.frTot,
             faRate: r.faRate, frRate: r.frRate, soundness: (1 - r.faRate) * (1 - r.frRate),
             byTol, fam, example: r.fooled[0] ? { factId: r.fooled[0].factId, value: r.fooled[0].value, why: r.fooled[0].why } : null };
  });
  console.log(JSON.stringify({ nSubs: subs.length, nWrong: subs.filter(s => s.truth === false).length,
    tols: TOLS, facts: L.FACTS.map(f => ({ id: f.id, what: f.what, lo: f.lo, hi: f.hi, width: f.hi - f.lo, source: f.source })), rows }, null, 2));
} else console.log('usage: node canary.js demo | run <module> | run-cli <command> | list | json');

module.exports = { buildSuite, GRADERS, score, report };
