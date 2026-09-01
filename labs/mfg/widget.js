/* widget.js — the MFG certifier, IN THE BROWSER.

   The paste box on the lab page runs the SAME code as the sweep. Not a
   re-implementation, not a "browser mirror": the bundle below is ASSEMBLED at
   build time from the actual source files —

       legacy/core/interval/interval.js     outward-rounded interval arithmetic
       legacy/core/mfg/mfg1d.js             the model and its Newton solver
       labs/mfg/box.js                      the box certifier and the decision

   — wrapped in an explicit CommonJS shim, with nothing retyped. If a byte of
   any of them changes, the page's certifier changes with it. gate() then
   EXECUTES the assembled bundle in Node and requires it to answer identically
   to the require()-based path on known instances; the calling build refuses if
   it throws. That is the whole defence against the browser copy drifting away
   from the one that produced the map.

   Nothing is uploaded: the certifier runs in the reader's tab, on the reader's
   parameters. The citable path is the repository.

   MIT licensed. Part of cert-machine (labs/mfg). */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');

const SRC = [
  { name: 'EqInterval', file: path.join(ROOT, 'legacy', 'core', 'interval', 'interval.js') },
  { name: 'MFG1D', file: path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js') },
  { name: 'MFGBox', file: path.join(ROOT, 'labs', 'mfg', 'box.js') }
];

/* the shim: each file gets its own module/exports, and require() resolves only
   the three names this bundle actually contains — anything else throws rather
   than silently returning undefined. */
function bundle() {
  let out = '/* assembled by labs/mfg/widget.js from the repository sources — do not edit here */\n';
  const shas = [];
  for (const s of SRC) {
    const code = fs.readFileSync(s.file, 'utf8');
    shas.push({ file: path.relative(ROOT, s.file), sha256: crypto.createHash('sha256').update(code).digest('hex') });
    out += 'var ' + s.name + ' = (function(){var module={exports:{}};var exports=module.exports;'
         + 'var require=function(p){'
         + 'if(/interval\\.js$/.test(p))return EqInterval;'
         + 'if(/mfg1d\\.js$/.test(p))return MFG1D;'
         + 'throw new Error("the bundle does not carry "+p);};'
         + 'var self=undefined;\n' + code + '\nreturn module.exports;})();\n';
  }
  out += ENTRY;
  return { code: out, sources: shas };
}

/* the entry point the page calls. One JSON object in, one verdict out. */
const ENTRY = `
function mfgParseNum(x, what) {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (typeof x === 'string' && /^-?\\d+(\\.\\d+)?([eE][-+]?\\d+)?$/.test(x.trim())) return Number(x);
  throw new Error(what + ' must be a finite number');
}
function mfgParseRange(x, what) {
  if (Array.isArray(x)) {
    if (x.length !== 2) throw new Error(what + ' must be a number or a [lo, hi] pair');
    var lo = mfgParseNum(x[0], what + '[0]'), hi = mfgParseNum(x[1], what + '[1]');
    if (!(lo <= hi)) throw new Error(what + ' must have lo <= hi');
    return [lo, hi];
  }
  var v = mfgParseNum(x, what);
  return [v, v];
}
function mfgCertify(claim) {
  var refused = function (r) { return { verdict: 'REFUSED', reason: r }; };
  if (!claim || typeof claim !== 'object' || Array.isArray(claim)) return refused('the claim must be a JSON object');
  var box, nu, N;
  try {
    N = claim.N === undefined ? 16 : (claim.N | 0);
    if (!(N >= 4 && N <= 24)) return refused('N must be an integer in 4..24 (the certified band of Fourier modes)');
    nu = claim.nu === undefined ? 1.02 : mfgParseNum(claim.nu, 'nu');
    if (!(nu >= 1 && nu <= 1.2)) return refused('nu must lie in [1, 1.2] — outside that the Banach-algebra weights are useless');
    box = { sigma: mfgParseRange(claim.sigma === undefined ? 0.5 : claim.sigma, 'sigma'),
            c: mfgParseRange(claim.c, 'c'), A: mfgParseRange(claim.A === undefined ? 0 : claim.A, 'A'), N: N };
  } catch (e) { return refused(e.message); }
  if (!(box.sigma[0] > 0)) return refused('sigma must be strictly positive');
  if (box.A[0] < 0) return refused('A is the depth of the potential well and is taken >= 0');
  var wc = box.c[1] - box.c[0], wa = box.A[1] - box.A[0], ws = box.sigma[1] - box.sigma[0];
  if (wc > 4 || wa > 1 || ws > 0.4) return refused('that cell is far wider than anything this argument closes — try a cell of a few hundredths');

  var mode = claim.mode || 'cell';
  if (mode === 'refute') {
    var cand = claim.candidate;
    if (!cand || typeof cand !== 'object') return refused("mode 'refute' needs a candidate {rho, a:[...], b:[...]} and a delta");
    var delta;
    try { delta = mfgParseNum(claim.delta, 'delta'); } catch (e) { return refused(e.message); }
    var x = new Float64Array(2 * N + 1);
    try {
      x[0] = mfgParseNum(cand.rho, 'candidate.rho');
      for (var k = 1; k <= N; k++) {
        x[k] = cand.a && cand.a[k - 1] !== undefined ? mfgParseNum(cand.a[k - 1], 'candidate.a[' + (k - 1) + ']') : 0;
        x[N + k] = cand.b && cand.b[k - 1] !== undefined ? mfgParseNum(cand.b[k - 1], 'candidate.b[' + (k - 1) + ']') : 0;
      }
    } catch (e) { return refused(e.message); }
    return MFGBox.refuteCandidate(x, box, delta, { nu: nu });
  }
  if (mode !== 'cell') return refused("mode must be 'cell' or 'refute'");

  var d;
  try { d = MFGBox.decideCell(box, { nu: nu }); }
  catch (e) { return refused('the certifier stopped: ' + e.message); }
  var head = { verdict: d.verdict, cell: { sigma: box.sigma, c: box.c, A: box.A }, N: N, nu: nu,
               enclosures: d.enclosures };
  if (d.verdict === 'MULTIPLE') {
    head.statement = 'For EVERY (sigma, c, A) in this cell the system has at least TWO exact solutions: two '
      + 'certified balls, separation ' + d.witness.separation.toExponential(6) + ' against a combined radius '
      + d.witness.rSum.toExponential(6) + ', both densities bounded below by ' + d.witness.minM.toExponential(6) + '.';
    head.witness = d.witness;
  } else if (d.verdict === 'UNIQUE') {
    head.statement = 'This cell lies in the monotone half-plane c >= 0, where Lasry-Lions gives GLOBAL uniqueness '
      + '(cited, not proved here). What is proved here is the enclosure: one exact solution within '
      + d.witness.enclosure.r.toExponential(6) + ' of the predictor, uniformly over the cell, density >= '
      + d.witness.minM.toExponential(6) + '.';
    head.witness = d.witness;
  } else {
    head.statement = 'UNDECIDED — and that is a measurement, not a shrug: ' + d.why;
    if (d.aligned) head.enclosure = d.aligned;
  }
  return head;
}`;

/* ---- the gate: the assembled bundle must answer what Node answers -------- */
function gate() {
  const { code } = bundle();
  const certify = new Function(code + '; return mfgCertify;')();
  const B = require(path.join(__dirname, 'box.js'));

  /* 1 — a MULTIPLE cell, matching the direct path number for number */
  const cell = { sigma: 0.5, c: [-16.03125, -15.96875], A: [0.2875, 0.3125], N: 16, nu: 1.02 };
  const w = certify(cell);
  const d = B.decideCell({ sigma: [0.5, 0.5], c: cell.c, A: cell.A, N: 16 }, { nu: 1.02 });
  if (w.verdict !== 'MULTIPLE') throw new Error('bundle failed to find the multiplicity cell: ' + JSON.stringify(w).slice(0, 200));
  if (d.verdict !== w.verdict) throw new Error('bundle and Node disagree on the verdict');
  if (w.witness.separation !== d.witness.separation || w.witness.rSum !== d.witness.rSum
      || w.witness.minM !== d.witness.minM) throw new Error('bundle and Node disagree on the multiplicity witness');

  /* 2 — a UNIQUE cell */
  const u = certify({ sigma: 0.5, c: [0.95, 1.05], A: [0.98, 1.02], N: 16, nu: 1.05 });
  if (u.verdict !== 'UNIQUE') throw new Error('bundle failed on the monotone cell: ' + JSON.stringify(u).slice(0, 200));

  /* 3 — the bifurcation must REFUSE, never certify */
  const cStar = -0.25 * (2 * Math.PI) * (2 * Math.PI);
  const b = certify({ sigma: 0.5, c: [cStar - 0.01, cStar + 0.01], A: 0, N: 16, nu: 1.02 });
  if (b.verdict === 'MULTIPLE' || b.verdict === 'UNIQUE') throw new Error('bundle certified AT the bifurcation');

  /* 4 — refutation, with the same witness the Node path gives */
  const M1D = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
  const P = M1D.makeProblem({ sigma: 0.5, c: 1, A: 1, N: 16 });
  const s = M1D.solve(P);
  const un = M1D.unpack(s.x, 16);
  const a = [], bb = [];
  for (let k = 1; k <= 16; k++) { a.push(un.a[k]); bb.push(un.b[k]); }
  bb[0] += 0.05;
  const r = certify({ mode: 'refute', sigma: 0.5, c: 1, A: 1, N: 16, nu: 1.05, delta: 1e-3,
                      candidate: { rho: un.rho, a, b: bb } });
  if (r.verdict !== 'REFUTED' || !r.mechanism || !(r.mechanism.margin > 0)) throw new Error('bundle failed to refute a wrong candidate');
  const bad = Float64Array.from(s.x); bad[17] += 0.05;
  const rn = B.refuteCandidate(bad, { sigma: [0.5, 0.5], c: [1, 1], A: [1, 1], N: 16 }, 1e-3, { nu: 1.05 });
  if (rn.mechanism.equation !== r.mechanism.equation || rn.mechanism.margin !== r.mechanism.margin) {
    throw new Error('bundle and Node disagree on the refutation witness');
  }

  /* 5 — floats where structure is required, and nonsense, must be REFUSED */
  for (const junk of [null, 42, { c: 'banana', A: 0 }, { c: [-1, -3], A: 0 }, { c: -12, A: 0, N: 400 },
                      { c: -12, A: 0, sigma: -1 }, { c: [-40, 40], A: 0 }]) {
    if (certify(junk).verdict !== 'REFUSED') throw new Error('bundle accepted junk: ' + JSON.stringify(junk));
  }
  return true;
}

/* ---- the interactive block (textarea + buttons + output), shared markup --- */
function boxHtml(opts) {
  opts = opts || {};
  const { code, sources } = bundle();
  const examples = {
    multiple: { sigma: 0.5, c: [-16.03125, -15.96875], A: [0.2875, 0.3125], N: 16, nu: 1.02 },
    unique: { sigma: 0.5, c: [0.95, 1.05], A: [0.98, 1.02], N: 16, nu: 1.05 },
    bifurcation: { sigma: 0.5, c: [-9.88, -9.86], A: 0, N: 16, nu: 1.02 }
  };
  const btn = (id, label, primary) => '<button id="' + id + '" style="font:inherit;padding:6px 14px;cursor:pointer;'
    + (primary ? 'background:var(--sig);color:var(--paper);border:none' : 'background:var(--sunk);color:var(--ink);border:1px solid var(--rule)')
    + ';border-radius:6px;margin:0 6px 6px 0">' + label + '</button>';
  return '<div class="col"><textarea id="mfg-in" spellcheck="false" rows="6" style="width:100%;font-family:var(--f-mono);'
    + 'font-size:13px;background:var(--sunk);color:var(--ink);border:1px solid var(--rule);border-radius:6px;padding:10px" '
    + 'placeholder=\'{"sigma":0.5,"c":[-16.03,-15.97],"A":[0.288,0.313],"N":16,"nu":1.02}\'>'
    + JSON.stringify(examples.multiple) + '</textarea>'
    + '<div style="margin:8px 0">' + btn('mfg-go', 'decide this cell', true)
    + btn('mfg-ex1', 'a multiplicity cell') + btn('mfg-ex2', 'a monotone cell') + btn('mfg-ex3', 'the bifurcation')
    + btn('mfg-ex4', 'refute a candidate') + '</div>'
    + '<pre id="mfg-out" style="white-space:pre-wrap;background:var(--sunk);border:1px solid var(--rule);'
    + 'border-radius:6px;padding:10px;font-size:13px;min-height:1.5em;overflow-x:auto"></pre>'
    + '<p class="scope">Runs in this tab. Nothing is uploaded, nothing is logged; the certifier is the repository\'s own '
    + 'code, assembled from ' + sources.map(s => s.file).join(', ') + '. A cell takes about a tenth of a second.</p></div>'
    + '<script>' + code + `
(function(){
  var EX = ${JSON.stringify(examples)};
  var inp = document.getElementById('mfg-in'), out = document.getElementById('mfg-out');
  function set(o){ inp.value = JSON.stringify(o); out.textContent = ''; out.style.borderColor = 'var(--rule)'; }
  document.getElementById('mfg-ex1').onclick = function(){ set(EX.multiple); };
  document.getElementById('mfg-ex2').onclick = function(){ set(EX.unique); };
  document.getElementById('mfg-ex3').onclick = function(){ set(EX.bifurcation); };
  document.getElementById('mfg-ex4').onclick = function(){
    var P = MFG1D.makeProblem({sigma:0.5,c:1,A:1,N:16}), s = MFG1D.solve(P), u = MFG1D.unpack(s.x,16);
    var a = [], b = [];
    for (var k=1;k<=16;k++){ a.push(u.a[k]); b.push(u.b[k]); }
    b[0] = b[0] + 0.05;                      /* a candidate that is 5e-2 wrong */
    set({mode:'refute', sigma:0.5, c:1, A:1, N:16, nu:1.05, delta:1e-3, candidate:{rho:u.rho, a:a, b:b}});
  };
  document.getElementById('mfg-go').onclick = function(){
    var claim; try { claim = JSON.parse(inp.value); }
    catch (e) { out.textContent = 'REFUSED: not JSON — ' + e.message; out.style.borderColor='var(--rule)'; return; }
    out.textContent = 'deciding…';
    setTimeout(function(){
      var t0 = Date.now(), r;
      try { r = mfgCertify(claim); } catch (e) { r = { verdict: 'REFUSED', reason: 'the certifier stopped: ' + e.message }; }
      out.textContent = JSON.stringify(r, null, 1) + '\\n\\n[' + (Date.now()-t0) + ' ms in this tab]';
      out.style.borderColor = (r.verdict === 'MULTIPLE' || r.verdict === 'UNIQUE') ? 'var(--held)'
                            : r.verdict === 'REFUTED' ? 'var(--sig)' : 'var(--rule)';
    }, 10);
  };
})();</script>`;
}

/* ---- the same bundle as a standalone command-line verifier ---------------
   Ships beside the page. No dependencies at all — not even a Node built-in —
   so a reader can run the page's certifier on their own parameters without
   cloning anything, and diff its answers against the map. Same bytes as the
   browser, same bytes as the sweep. */
function cli() {
  const { code, sources } = bundle();
  return '#!/usr/bin/env node\n'
    + '/* mfg-certify.js — the cert-machine mean-field-game certifier, standalone.\n\n'
    + '   usage:  node mfg-certify.js \'{"sigma":0.5,"c":[-16.03,-15.97],"A":[0.288,0.313]}\'\n'
    + '           node mfg-certify.js < claim.json\n\n'
    + '   Verdicts: MULTIPLE (two exact solutions for EVERY parameter in the cell,\n'
    + '   in two provably disjoint certified balls) / UNIQUE (the monotone half-plane,\n'
    + '   where global uniqueness is Lasry-Lions\' and the enclosure is ours) /\n'
    + '   UNDECIDED (with the reason) / REFUTED (mode "refute": no exact solution lies\n'
    + '   within delta of your candidate, and the equation that proves it) / REFUSED.\n\n'
    + '   Assembled from, and identical to, the repository sources:\n'
    + sources.map(s => '     ' + s.file + '  sha256 ' + s.sha256 + '\n').join('')
    + '   https://github.com/carlostoledo1891/cert-machine — MIT.\n'
    + '   No dependencies. Nothing is uploaded; there is nothing here that could be. */\n'
    + "'use strict';\n" + code + `
function main(argv) {
  var text = argv[2];
  if (!text) {
    try { text = require('fs').readFileSync(0, 'utf8'); } catch (e) { text = ''; }
  }
  if (!text.trim()) {
    console.error('usage: node mfg-certify.js \\'{"sigma":0.5,"c":[-16.03,-15.97],"A":[0.288,0.313]}\\'');
    process.exit(2);
  }
  var claim;
  try { claim = JSON.parse(text); }
  catch (e) { console.log(JSON.stringify({ verdict: 'REFUSED', reason: 'not JSON — ' + e.message }, null, 1)); process.exit(1); }
  var r = mfgCertify(claim);
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.verdict === 'REFUSED' ? 1 : 0);
}
if (require.main === module) main(process.argv);
`;
}

module.exports = { bundle, gate, boxHtml, cli, SRC };
