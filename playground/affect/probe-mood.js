/* probe-mood.js — the same questions, asked by six different people.
   node experiments/neural-geometry/probe-mood.js            (dry run)
   node experiments/neural-geometry/probe-mood.js --live     (spends money)

   Nothing about the task changes across moods. The pair, the scale, the demand
   for a bare integer are identical to the character; the only difference is one
   sentence in front, and that sentence never mentions the items. */
'use strict';
const fs = require('fs');
const path = require('path');
const { MODELS, auth, pool, makeAsker, blankSpend, priceOut, Fatal } = require('./api.js');
const MOODS = require('./moods.js');
const { AFFECT, PAIRWISE, LADDER, SCALARS } = require('./affect.js');

const LIVE = process.argv.includes('--live');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : d; };
const SCALE = +arg('--scale', 99);
const CONC = +arg('--conc', 16);
const onlyMood = arg('--mood', null);

const pairPrompt = (S, mood, a, b) => `${mood.prefix}${S.ask(a, b)}\n\n`
  + `Use a scale where 0 means identical and ${SCALE} means as far apart as any two items in the set can be. `
  + `Answer with a single integer from 0 to ${SCALE} and nothing else.`;
const scalarPrompt = (X, mood, item) => `${mood.prefix}${X.ask(item)}\n\n`
  + `Use a scale from 0 to ${SCALE}, where ${X.ends(SCALE)}. `
  + `Answer with a single integer from 0 to ${SCALE} and nothing else.`;

const moods = MOODS.filter(m => !onlyMood || m.id === onlyMood);
const nPair = PAIRWISE.reduce((t, S) => t + S.items.length * (S.items.length - 1), 0);
const total = (nPair * moods.length + SCALARS.length * AFFECT.length * moods.length
  + (onlyMood ? 0 : LADDER.items.length * (LADDER.items.length - 1))) * MODELS.length;

(async () => {
  console.log(`probe-mood: ${moods.length} moods × ${PAIRWISE.length} subjects × ${MODELS.length} models`);
  console.log(`  ${total} calls, scale 0-${SCALE}, concurrency ${CONC}`);
  if (!LIVE) {
    console.log('\nDRY RUN — no network. Re-run with --live to spend.\n');
    for (const m of moods.slice(0, 3)) console.log(`[${m.id}]\n  ${pairPrompt(PAIRWISE[0], m, 'happy', 'sad').replace(/\n/g, '\n  ')}\n`);
    console.log(`[scalar]\n  ${scalarPrompt(SCALARS[1], moods[0], 'angry').replace(/\n/g, '\n  ')}`);
    return;
  }
  const A = auth(), spend = blankSpend(), call = makeAsker(A, SCALE, spend);
  const out = { scale: SCALE, builtAt: new Date().toISOString(), models: MODELS.map(m => ({ id: m.id, label: m.label, short: m.short })),
    moods: MOODS.map(m => ({ id: m.id, label: m.label, near: m.near, valence: m.valence, arousal: m.arousal, note: m.note, prefix: m.prefix })),
    subjects: PAIRWISE.map(S => ({ id: S.id, title: S.title, kind: S.kind, order: S.order, note: S.note, items: S.items })),
    ladder: { id: LADDER.id, title: LADDER.title, kind: LADDER.kind, order: LADDER.order, note: LADDER.note, items: LADDER.items, byModel: {} },
    scalars: SCALARS.map(x => ({ id: x.id, label: x.label })),
    affect: AFFECT, cells: {}, ratings: {} };
  const save = () => fs.writeFileSync(path.join(__dirname, 'out', 'mood.json'), JSON.stringify(out));
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });

  const t00 = Date.now();
  for (const mood of moods) {
    for (const S of PAIRWISE) {
      const n = S.items.length, jl = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) jl.push([i, j]);
      for (const M of MODELS) {
        const t0 = Date.now();
        const res = await pool(jl.map(([i, j]) => () => call(M, pairPrompt(S, mood, S.items[i], S.items[j]))), CONC,
          (d, t) => { if (d % 40 === 0) process.stdout.write(`\r  ${mood.id}/${S.id}/${M.short} ${d}/${t}   `); });
        const raw = Array.from({ length: n }, () => new Array(n).fill(0));
        jl.forEach(([i, j], k) => { raw[i][j] = res[k] === null ? 0 : res[k]; });
        out.cells[`${mood.id}|${S.id}|${M.id}`] = raw;
        console.log(`\r  ${mood.id}/${S.id}/${M.short}  ${jl.length} calls, ${((Date.now() - t0) / 1000).toFixed(0)}s        `);
      }
    }
    /* the scalar axes, which never mention another feeling */
    for (const M of MODELS) {
      for (const X of SCALARS) {
        const v = await pool(AFFECT.map(it => () => call(M, scalarPrompt(X, mood, it))), CONC);
        out.ratings[`${mood.id}|${X.id}|${M.id}`] = v.map(x => (x === null ? 0 : x));
      }
      console.log(`  ${mood.id}/scalars/${M.short}  ${SCALARS.length * AFFECT.length} calls`);
    }
    save();
  }
  /* the ladder, once, neutral */
  if (!onlyMood) {
    const n = LADDER.items.length, jl = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) jl.push([i, j]);
    for (const M of MODELS) {
      const res = await pool(jl.map(([i, j]) => () => call(M, pairPrompt(LADDER, MOODS[0], LADDER.items[i], LADDER.items[j]))), CONC);
      const raw = Array.from({ length: n }, () => new Array(n).fill(0));
      jl.forEach(([i, j], k) => { raw[i][j] = res[k] === null ? 0 : res[k]; });
      out.ladder.byModel[M.id] = raw;
      console.log(`  ladder/${M.short}  ${jl.length} calls`);
    }
  }
  out.spend = priceOut(spend);
  save();
  console.log(`\n${((Date.now() - t00) / 60000).toFixed(1)} min\nspend:`);
  for (const s of out.spend) console.log(`  ${s.label.padEnd(10)} ${s.in} in / ${s.out} out  ≈ $${s.usd}${s.fail ? `  (${s.fail} failed)` : ''}`);
  console.log(`  total ≈ $${out.spend.reduce((t, s) => t + s.usd, 0).toFixed(2)}\nwritten out/mood.json`);
})().catch(e => {
  if (e instanceof Fatal) {
    console.error(`\n\nSTOPPED — ${e.message}`);
    console.error('Nothing partial was written for the condition in flight; completed conditions are already in out/mood.json.');
    process.exit(1);
  }
  throw e;
});
