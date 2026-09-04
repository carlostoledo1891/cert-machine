/* probe.js — ask a model for the same distances we already know exactly.
   node experiments/exact-geometry/probe.js            (dry run, no network)
   node experiments/exact-geometry/probe.js --live     (spends money)

   WHY THIS IS THE INTERESTING HALF. The reference playground asks a language
   model for pairwise dissimilarities and decides what shape the answers have.
   The method is good and the answer is unfalsifiable: nobody knows the true
   geometry of a model's beliefs about the days of the week, so a circle can be
   reported and never confirmed.
   These three subjects have a ground truth on disk. Eight telescopes whose
   separations this bench measured from the array's own data; six points on a
   circle whose chord distances are 0,1,√3,2 by construction; and the same six
   measured around the rim instead of through the middle. So the model's answers
   can be scored — not "does this look like a circle" but "how far is it from
   the circle, in the same units the exact decision used".

   DISCIPLINE, kept from the bench's own harness:
   · NETWORK OFF BY DEFAULT. --live is required and it says so before spending.
   · EVERY PAIR IS ASKED TWICE, in both orders, in calls that never see each
     other. The disagreement is a consistency test nobody asked the model to
     pass, and it is the first thing worth knowing: a model answering from a
     geometry has a reason to be symmetric; one answering from a reflex does not.
   · The answers are integers, so the decisions downstream stay arithmetic.
   · Nothing is sent but the item names and the question. No data, no results.  */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SETS = require('./sets.js');

const LIVE = process.argv.includes('--live');
const MODEL = 'claude-opus-5';
const only = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
/* THE SCALE IS PART OF THE EXPERIMENT, and getting it wrong invalidates the
   answers rather than the model. Asked on 0-100, the true rim ratios 1 : 2 : 3
   round to 33, 67, 100 — and 33 + 33 < 67, so the model's perfectly correct
   answers are not a metric and the gate refuses them. The endpoint has to be
   divisible by the ratios the subject actually contains: 0-99 gives 33, 66, 99
   and the triangle holds. The reference playground asks for integers on a fixed
   scale the same way, so this is a property of the method, not of this run. */
const SCALE = (() => { const i = process.argv.indexOf('--scale'); return i > 0 ? +process.argv[i + 1] : 100; })();

/* the three subjects with a truth to be scored against */
const STATION_NAMES = {
  AA: 'ALMA (Atacama Large Millimeter Array, Chile)', AX: 'APEX (Atacama Pathfinder Experiment, Chile)',
  LM: 'LMT (Large Millimeter Telescope, Mexico)', MG: 'GLT (Greenland Telescope)',
  MM: 'SMT (Submillimeter Telescope, Arizona)', PV: 'IRAM 30m (Pico Veleta, Spain)',
  SW: 'SMA (Submillimeter Array, Hawaii)', GL: 'GLT (Greenland Telescope)',
};
const QUESTIONS = [
  { id: 'array-a', truth: 'array-a',
    label: (x) => STATION_NAMES[x] || x,
    ask: (a, b) => `Two radio observatories:\nA: ${a}\nB: ${b}\n\nOn a scale where 0 means the same site and ${SCALE} means the two furthest-apart observatories on Earth, how far apart are A and B?\n\nAnswer with a single integer from 0 to ${SCALE} and nothing else.` },
  { id: 'hex-chord', truth: 'hex-chord',
    label: (x) => `vertex ${x}`,
    ask: (a, b) => `Six points are evenly spaced around a circle and numbered 0 to 5 in order.\n\nMeasuring in a STRAIGHT LINE THROUGH the circle, how far apart are ${a} and ${b}?\n\nUse a scale where 0 is the same point and ${SCALE} is the furthest any two of the six can be. Answer with a single integer from 0 to ${SCALE} and nothing else.` },
  { id: 'hex-cycle', truth: 'hex-cycle',
    label: (x) => `vertex ${x}`,
    ask: (a, b) => `Six points are evenly spaced around a circle and numbered 0 to 5 in order.\n\nMeasuring ALONG THE RIM of the circle, by the shorter way round, how far apart are ${a} and ${b}?\n\nUse a scale where 0 is the same point and ${SCALE} is the furthest any two of the six can be. Answer with a single integer from 0 to ${SCALE} and nothing else.` },
];

function token() {
  try {
    return execFileSync('ant', ['auth', 'print-credentials', '--access-token'], { encoding: 'utf8' }).trim();
  } catch (e) {
    throw new Error('no active Anthropic credential — run `ant auth login`, or export ANTHROPIC_API_KEY');
  }
}

async function ask(prompt, auth) {
  const headers = { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' };
  if (auth.kind === 'oauth') { headers.authorization = `Bearer ${auth.value}`; headers['anthropic-beta'] = 'oauth-2025-04-20'; }
  else headers['x-api-key'] = auth.value;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers,
    body: JSON.stringify({
      model: MODEL, max_tokens: 2000,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const m = text.match(/-?\d+/);
  return { n: m ? Math.max(0, Math.min(SCALE, parseInt(m[0], 10))) : null, text, usage: j.usage };
}

(async () => {
  const jobs = QUESTIONS.filter(q => !only || q.id === only);
  let calls = 0;
  for (const q of jobs) {
    const S = SETS.find(s => s.id === q.truth);
    calls += S.items.length * (S.items.length - 1);          // every ordered pair
  }
  console.log(`probe: ${jobs.length} subject(s), ${calls} calls to ${MODEL}, scale 0-${SCALE} (every pair, both orders)`);
  if (!LIVE) {
    console.log('DRY RUN — no network. Re-run with --live to spend.');
    for (const q of jobs) {
      const S = SETS.find(s => s.id === q.truth);
      console.log(`\n  ${q.id}: ${S.items.length} items → ${S.items.length * (S.items.length - 1)} calls`);
      console.log('  sample prompt:\n    ' + q.ask(q.label(S.items[0]), q.label(S.items[1])).replace(/\n/g, '\n    '));
    }
    return;
  }

  const auth = process.env.ANTHROPIC_API_KEY
    ? { kind: 'key', value: process.env.ANTHROPIC_API_KEY }
    : { kind: 'oauth', value: token() };
  const out = { model: MODEL, scale: SCALE, builtAt: new Date().toISOString(), subjects: [] };
  let inTok = 0, outTok = 0, failed = 0;

  for (const q of jobs) {
    const S = SETS.find(s => s.id === q.truth);
    const n = S.items.length;
    const raw = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const prompt = q.ask(q.label(S.items[i]), q.label(S.items[j]));
      let got = null;
      for (let attempt = 0; attempt < 3 && got === null; attempt++) {
        try { const r = await ask(prompt, auth); inTok += r.usage.input_tokens; outTok += r.usage.output_tokens; got = r.n; }
        catch (e) { if (attempt === 2) { console.log(`  ! ${S.items[i]}→${S.items[j]}: ${e.message}`); failed++; } else await new Promise(r => setTimeout(r, 800 * (attempt + 1))); }
      }
      raw[i][j] = got === null ? 0 : got;
      process.stdout.write(`\r  ${q.id}: ${i * n + j + 1}/${n * n}   `);
    }
    out.subjects.push({ id: q.id, items: S.items, raw, truth: S.D });
    console.log(`\r  ${q.id}: done (${n * (n - 1)} calls)          `);
  }
  out.usage = { inputTokens: inTok, outputTokens: outTok, failed,
    estUSD: +(inTok * 5e-6 + outTok * 25e-6).toFixed(4) };
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'probe.json'), JSON.stringify(out));
  console.log(`\nwritten out/probe.json — ${inTok} in / ${outTok} out tokens, about $${out.usage.estUSD}${failed ? `, ${failed} calls failed` : ''}`);
})();
