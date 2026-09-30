/* run.js — Decidível's ledger: every cell of the decidability map under every
   knowledge scenario, the headline receipt, and the scenario table, decided by
   engine/rockphys.js over the boxes of declared.json. The map is the costly
   part (360 cells × 5 scenarios, each two proved extremes), so it runs in
   worker threads; the ledger is deterministic whatever the thread count.

   usage: node apps/decidivel/run.js            writes data/decidivel-ledger.json
          node apps/decidivel/run.js --check    re-derives it and refuses on any difference
   apps/decidivel · cert-machine                                             MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const R = require('./engine/rockphys.js');

const APP = __dirname, ROOT = path.join(APP, '..', '..');
const OUT = path.join(APP, 'data', 'decidivel-ledger.json');
const BUDGET = 12000;
const r6 = (x) => (x === null ? null : Math.round(x * 1e6) / 1e6);

function cellTask(t) {
  const A = R.absRange(R.box(t.box), { budget: BUDGET });
  /* the four proved numbers, rounded OUTWARD at the sixth digit so the printed ones still hold */
  return [Math.floor(A.lo * 1e6) / 1e6, A.loA === null ? null : r6(A.loA), A.hiA === null ? null : r6(A.hiA), Math.ceil(A.hi * 1e6) / 1e6, A.sign];
}

if (!isMainThread) {
  parentPort.postMessage(workerData.tasks.map((t) => [t.i, cellTask(t)]));
} else {
  const D = JSON.parse(fs.readFileSync(path.join(APP, 'declared.json'), 'utf8'));
  const G = D.grid;
  const phis = [], sgs = [];
  for (let i = 0; Math.round((G.phi.from + i * G.phi.step) * 1e6) < Math.round(G.phi.to * 1e6); i++) phis.push([i === 0 ? G.phiFloor : (G.phi.from + i * G.phi.step).toFixed(2), (G.phi.from + (i + 1) * G.phi.step).toFixed(2)]);
  for (let j = 0; Math.round((G.sg.from + j * G.sg.step) * 1e6) < Math.round(G.sg.to * 1e6); j++) sgs.push([j === 0 ? G.sgFloor : (G.sg.from + j * G.sg.step).toFixed(2), (G.sg.from + (j + 1) * G.sg.step).toFixed(2)]);
  const tasks = [];
  const scen = Object.keys(D.scenarios);
  for (const k of scen) for (let j = 0; j < sgs.length; j++) for (let i = 0; i < phis.length; i++) {
    const box = Object.assign({}, D.box, D.scenarios[k].mod, { phi: phis[i], dSg: sgs[j] });
    tasks.push({ i: tasks.length, k, box });
  }
  const n = Math.max(1, Math.min(os.cpus().length, 8));
  const t0 = Date.now();
  const chunks = Array.from({ length: n }, (_, w) => tasks.filter((_, i) => i % n === w));
  Promise.all(chunks.map((c) => new Promise((res, rej) => {
    const wk = new Worker(__filename, { workerData: { tasks: c } });
    wk.on('message', res); wk.on('error', rej);
  }))).then((parts) => {
    const res = new Array(tasks.length);
    for (const p of parts) for (const [i, v] of p) res[i] = v;
    const maps = {};
    for (const k of scen) maps[k] = [];
    tasks.forEach((t, i) => maps[t.k].push(res[i]));

    /* the headline: one receipt, and the same cell under each scenario */
    const H = D.headline;
    const hbox = Object.assign({}, D.box, { phi: H.phi, dSg: H.dSg });
    const receipt = R.decide(hbox, { theta: H.theta }, { noPrice: true, budget: BUDGET });
    const table = scen.map((k) => { const v = cellTask({ box: Object.assign({}, hbox, D.scenarios[k].mod) }); return { k, range: v, verdict: R.classifyAbs({ lo: v[0], loA: v[1], hiA: v[2], hi: v[3] }, Number(H.theta) * 100) }; });

    /* what a Monte Carlo feasibility study would have said about the same cell,
       under the scenario where the engine can decide (K3): 1,000 seeded draws */
    const mc = (() => {
      const box = Object.assign({}, hbox, D.scenarios.K3.mod);
      let seed = 20260930; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
      const v = [];
      for (let i = 0; i < 1000; i++) { const q = {}; for (const k of R.DIMS) { const a = Number(box[k][0]), b = Number(box[k][1]); q[k] = a + (b - a) * rnd(); } v.push(Math.abs(Math.sqrt(R.pointR(q)) - 1) * 100); }
      v.sort((x, y) => x - y);
      const A = cellTask({ box });
      return { scenario: 'K3', draws: 1000, min: r6(v[0]), p05: r6(v[50]), median: r6(v[500]), p95: r6(v[950]), max: r6(v[999]), provedLo: A[0], attainedLo: A[1], attainedHi: A[2], provedHi: A[3] };
    })();
    const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
    const ledger = {
      what: 'Decidível: is a WAG gas front visible to 4D seismic in a pre-salt-like carbonate, for EVERY admissible rock and fluid? Each map cell is a box (a porosity bin × a gas-saturation bin × every declared range); its four numbers are |ΔIp/Ip| in percent — a proved lower bound of the smallest change, the smallest a witness attains, the largest a witness attains, a proved upper bound of the largest — and the sign (−1 every model loses impedance, +1 gains, 0 both).',
      engine: { 'apps/decidivel/engine/rockphys.js': sha('apps/decidivel/engine/rockphys.js'), 'instruments/interval/interval.js': sha('instruments/interval/interval.js') },
      declared: { file: 'apps/decidivel/declared.json', sha256: sha('apps/decidivel/declared.json') },
      budget: BUDGET,
      axes: { phi: phis, sg: sgs },
      scenarios: scen,
      maps,
      headline: { box: hbox, theta: H.theta, receipt, table, mc }
    };
    const text = JSON.stringify(ledger) + '\n';
    if (process.argv.includes('--check')) {
      const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
      if (old !== text) { console.error('decidivel ledger DEVIATES from ' + path.relative(ROOT, OUT)); process.exit(1); }
      console.log('decidivel ledger re-derived identical (' + tasks.length + ' cells, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
      return;
    }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, text);
    console.log('data/decidivel-ledger.json: ' + tasks.length + ' cells in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s on ' + n + ' threads; headline ' + receipt.verdict);
  }).catch((e) => { console.error(e); process.exit(1); });
}
