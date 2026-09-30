/* run.js — Decidível's ledger: every cell of the decidability map under every
   knowledge scenario, the headline receipt and its scenario table, the three
   attributes of the headline cell (Ip, Is, Vp/Vs), the Monte Carlo the study
   would have run at the survey's resolution, the sign map (the gas density
   above which a proved model gains impedance), the correlated-frame rows and
   the price of information at 1.5% — all decided by engine/rockphys.js over the
   boxes of declared.json. The map and the sign scan run in worker threads; the
   ledger is deterministic whatever the thread count.

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
const four = (A) => [Math.floor(A.lo * 1e6) / 1e6, A.loA === null ? null : r6(A.loA), A.hiA === null ? null : r6(A.hiA), Math.ceil(A.hi * 1e6) / 1e6, A.sign];

function cellTask(t) {
  /* the four proved numbers, rounded OUTWARD at the sixth digit so the printed ones still hold */
  return four(R.absRange(R.box(t.box), { budget: BUDGET }));
}
function signTask(t) { const s = R.signDensity(t.box, { budget: 300 }); return s.rhoFlip; }

/* THE CORRELATED FRAME: the convex hull of the plugs' (s, G/K), widened by tol,
   covered by boxes of an n × n grid over the declared rectangle. A grid box is
   kept when it meets the hull (separating-axis test, both convex), so the cover
   contains the hull — a decision over the cover is a decision over the hull. */
function hullCover(pts, rect, n) {
  const P = pts.map(([s, g]) => [Number(s), Number(g)]), t = Number(rect.tol);
  const cloud = []; for (const [x, y] of P) for (const dx of [-t, t]) for (const dy of [-t, t]) cloud.push([x + dx, y + dy]);
  cloud.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of cloud) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of cloud.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  const [sa, sb] = rect.s.map(Number), [ga, gb] = rect.gk.map(Number);
  const meets = (bx) => {                                            /* SAT: rectangle vs convex polygon */
    const rc = [[bx[0], bx[2]], [bx[1], bx[2]], [bx[1], bx[3]], [bx[0], bx[3]]];
    const axes = [[1, 0], [0, 1]];
    for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length]; axes.push([-(b[1] - a[1]), b[0] - a[0]]); }
    for (const [ax, ay] of axes) {
      const pr = (S) => { let lo = Infinity, hi = -Infinity; for (const [x, y] of S) { const v = x * ax + y * ay; lo = Math.min(lo, v); hi = Math.max(hi, v); } return [lo, hi]; };
      const [l1, h1] = pr(rc), [l2, h2] = pr(hull);
      if (h1 < l2 || h2 < l1) return false;
    }
    return true;
  };
  const boxes = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const bx = [sa + (sb - sa) * i / n, sa + (sb - sa) * (i + 1) / n, ga + (gb - ga) * j / n, ga + (gb - ga) * (j + 1) / n];
    if (meets(bx)) boxes.push(bx.map((x) => x.toFixed(6)));
  }
  return { hull: hull.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]), boxes, grid: n };
}
/* the union of boxes decided as one: proved bounds are the extremes of the
   proved bounds, attained values the extremes of the attained ones */
function unionFour(vs) {
  const lo = Math.min(...vs.map((v) => v[0])), hi = Math.max(...vs.map((v) => v[3]));
  const la = vs.map((v) => v[1]), ha = vs.map((v) => v[2]);
  const loA = la.includes(null) ? null : Math.min(...la), hiA = ha.includes(null) ? null : Math.max(...ha);
  const signs = new Set(vs.map((v) => v[4]));
  return [lo, loA, hiA, hi, signs.size === 1 ? vs[0][4] : 0];
}

if (!isMainThread) {
  parentPort.postMessage(workerData.tasks.map((t) => [t.i, t.kind === 'sign' ? signTask(t) : cellTask(t)]));
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
    tasks.push({ i: tasks.length, kind: 'cell', k, box });
  }
  const signAt = tasks.length;
  for (let j = 0; j < sgs.length; j++) for (let i = 0; i < phis.length; i++) tasks.push({ i: tasks.length, kind: 'sign', box: Object.assign({}, D.box, { phi: phis[i], dSg: sgs[j] }) });
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
    tasks.slice(0, signAt).forEach((t, i) => maps[t.k].push(res[i]));
    const sign = res.slice(signAt);

    /* the headline: one receipt, the same cell under each scenario, its three attributes */
    const H = D.headline, th = Number(H.theta) * 100;
    const hbox = Object.assign({}, D.box, { phi: H.phi, dSg: H.dSg });
    const receipt = R.decide(hbox, { theta: H.theta }, { noPrice: true, budget: BUDGET });
    const cls = (v) => R.classifyAbs({ lo: v[0], loA: v[1], hiA: v[2], hi: v[3] }, th);
    const table = scen.map((k) => { const v = cellTask({ box: Object.assign({}, hbox, D.scenarios[k].mod) }); return { k, range: v, verdict: cls(v) }; });
    const attributes = {};
    for (const k of scen) { const b = R.box(Object.assign({}, hbox, D.scenarios[k].mod)); attributes[k] = {}; for (const a of ['Ip', 'Is', 'VpVs']) attributes[k][a] = four(R.attrRange(b, a, { budget: BUDGET })); }

    /* the correlated frame: the headline cell with (s, G/K) confined to the plugs' hull, alone and with the lean, uniform gas */
    const cover = hullCover(D.plugs.points.map((p) => [p[1], p[2]]), { s: D.box.s, gk: D.box.gk, tol: D.plugs.tol }, 8);
    const hullRow = (mod) => {
      const vs = cover.boxes.map((bx) => cellTask({ box: Object.assign({}, hbox, mod, { s: [bx[0], bx[1]], gk: [bx[2], bx[3]] }) }));
      const v = unionFour(vs); return { range: v, verdict: cls(v), boxes: vs.length };
    };
    const correlated = { K0: hullRow({}), K3: hullRow({ Kg: D.scenarios.K3.mod.Kg, rhog: D.scenarios.K3.mod.rhog, w: D.scenarios.K3.mod.w }) };

    /* what a Monte Carlo feasibility study would have said about the same cell:
       seeded draws, the fraction that clears the survey's threshold */
    const mcOf = (k, draws, theta) => {
      const box = Object.assign({}, hbox, D.scenarios[k].mod);
      let seed = 20260930; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
      const v = [];
      for (let i = 0; i < draws; i++) { const q = {}; for (const kk of R.DIMS) { const a = Number(box[kk][0]), b = Number(box[kk][1]); q[kk] = a + (b - a) * rnd(); } v.push(Math.abs(Math.sqrt(R.pointR(q)) - 1) * 100); }
      v.sort((x, y) => x - y);
      const det = v.filter((x) => x >= theta).length;
      return { scenario: k, draws, theta, detect: det, pDetect: Math.round(1e4 * det / draws) / 1e4, min: r6(v[0]), p05: r6(v[Math.floor(draws * 0.05)]), median: r6(v[Math.floor(draws / 2)]), p95: r6(v[Math.floor(draws * 0.95)]), max: r6(v[draws - 1]) };
    };
    const mc = (() => { const m = mcOf('K3', 1000, 0); const A = cellTask({ box: Object.assign({}, hbox, D.scenarios.K3.mod) }); return Object.assign(m, { provedLo: A[0], attainedLo: A[1], attainedHi: A[2], provedHi: A[3] }); })();
    const mc15 = { K0: [mcOf('K0', 1000, th), mcOf('K0', 10000, th)], K4: [mcOf('K4', 1000, th), mcOf('K4', 10000, th)] };

    /* the price of information at the survey's resolution: which single measurement decides the headline cell */
    const price = { K0: R.priceOfInformation(hbox, { theta: H.theta }, { budget: 1500 }), K4: R.priceOfInformation(Object.assign({}, hbox, D.scenarios.K4.mod), { theta: H.theta }, { budget: 1500 }) };

    const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
    const ledger = {
      what: 'Decidível: is a WAG gas front visible to 4D seismic in a pre-salt-like carbonate, for EVERY admissible rock and fluid? Each map cell is a box (a porosity bin × a gas-saturation bin × every declared range); its four numbers are |ΔIp/Ip| in percent — a proved lower bound of the smallest change, the smallest a witness attains, the largest a witness attains, a proved upper bound of the largest — and the sign (−1 every model loses impedance, +1 gains, 0 both). sign[] is, per cell under K0, the smallest injected-gas density (g/cm³) at which a proved model gains impedance, or null when none was found at the budget.',
      engine: { 'apps/decidivel/engine/rockphys.js': sha('apps/decidivel/engine/rockphys.js'), 'instruments/interval/interval.js': sha('instruments/interval/interval.js') },
      declared: { file: 'apps/decidivel/declared.json', sha256: sha('apps/decidivel/declared.json') },
      budget: BUDGET,
      axes: { phi: phis, sg: sgs },
      scenarios: scen,
      maps,
      sign,
      cover,
      headline: { box: hbox, theta: H.theta, receipt, table, attributes, correlated, mc, mc15, price }
    };
    const text = JSON.stringify(ledger) + '\n';
    if (process.argv.includes('--check')) {
      const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
      if (old !== text) { console.error('decidivel ledger DEVIATES from ' + path.relative(ROOT, OUT)); process.exit(1); }
      console.log('decidivel ledger re-derived identical (' + tasks.length + ' tasks, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
      return;
    }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, text);
    console.log('data/decidivel-ledger.json: ' + tasks.length + ' tasks in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s on ' + n + ' threads; headline ' + receipt.verdict);
  }).catch((e) => { console.error(e); process.exit(1); });
}
