/* oracle-widget.js — the browser-side exact-rational matmul certifier, as a
   source string, plus its gate. ONE definition serving every page that
   embeds the paste box (reports/matmul-eval.html and /oracle/). The gate
   executes the widget source in Node against the known answers — Strassen
   must CERTIFY, the sub-float forgery must be REFUTED with a first
   violation, a float entry must be REFUSED — and the calling build must
   refuse if gate() throws. Mirror of oracle/certmachine.py; the library is
   the citable path, this is the ten-second one.                            */
'use strict';

const WIDGET_CORE = `
function cmParseEntry(x){
  if (typeof x === 'number') { if (!Number.isInteger(x)) return null; return [BigInt(x), 1n]; }
  if (typeof x === 'string') {
    var m = x.trim().match(/^(-?\\d+)(?:\\/(-?\\d+))?$/); if (!m) return null;
    var n = BigInt(m[1]), d = m[2] === undefined ? 1n : BigInt(m[2]);
    if (d === 0n) return null; if (d < 0n) { n = -n; d = -d; } return [n, d];
  }
  return null;
}
function cmCertify(claim){
  function refused(r){ return { verdict: 'REFUSED', reason: r }; }
  if (!claim || typeof claim !== 'object') return refused('claim must be a JSON object');
  var t = claim.task || {};
  if (t.kind !== 'matmul') return refused("task.kind must be 'matmul'");
  var n = t.n|0, m = t.m|0, p = t.p|0, R = t.rank|0;
  if (!(n>=1&&n<=6&&m>=1&&m<=6&&p>=1&&p<=6&&R>=1&&R<=256)) return refused('task out of the supported box');
  if (claim.ring !== 'Q' && claim.ring !== 'F2') return refused("ring must be 'Q' or 'F2'");
  var dims = { u: n*m, v: m*p, w: n*p }, W = {};
  for (var key in dims) {
    var rows = (claim.witness||{})[key];
    if (!Array.isArray(rows) || !rows.length) return refused('witness.' + key + ' must be a non-empty list');
    W[key] = [];
    for (var i = 0; i < rows.length; i++) {
      if (!Array.isArray(rows[i]) || rows[i].length !== dims[key]) return refused('witness.' + key + '[' + i + '] must have length ' + dims[key]);
      var out = [];
      for (var j = 0; j < rows[i].length; j++) {
        var e = cmParseEntry(rows[i][j]);
        if (!e) return refused('witness.' + key + '[' + i + '] holds a non-exact entry ' + JSON.stringify(rows[i][j]) + ' — integers or exact rationals only; floats are refused');
        if (claim.ring === 'F2' && e[1] !== 1n) return refused('F2 entries must be integers');
        out.push(e);
      }
      W[key].push(out);
    }
  }
  if (!(W.u.length === W.v.length && W.v.length === W.w.length)) return refused('u, v, w must have the same number of rows');
  if (W.u.length > R) return { verdict: 'REFUTED', mechanism: { kind: 'rank_overflow', witness_rank: W.u.length, claimed_rank: R } };
  for (var a = 0; a < n; a++) for (var b = 0; b < m; b++) for (var c = 0; c < m; c++)
  for (var d = 0; d < p; d++) for (var e2 = 0; e2 < n; e2++) for (var f = 0; f < p; f++) {
    var num = 0n, den = 1n;
    for (var r = 0; r < W.u.length; r++) {
      var x = W.u[r][a*m+b], y = W.v[r][c*p+d], z = W.w[r][e2*p+f];
      var tn = x[0]*y[0]*z[0], td = x[1]*y[1]*z[1];
      num = num*td + tn*den; den = den*td;
    }
    if (claim.ring === 'F2') { num = ((num % 2n) + 2n) % 2n; den = 1n; }
    var want = (b === c && e2 === a && f === d) ? 1n : 0n;
    if (num !== want * den) {
      var g = num - want*den;
      return { verdict: 'REFUTED', mechanism: { kind: 'equation_violation',
        first_violation: [a, b, c, d, e2, f],
        got: den === 1n ? String(num) : String(num) + '/' + String(den),
        want: String(want), discrepancy: den === 1n ? String(g) : String(g) + '/' + String(den) } };
    }
  }
  return { verdict: 'CERTIFIED', certificate: { ring: claim.ring, witness_rank: W.u.length,
    equations_checked: (n*m)*(m*p)*(n*p),
    statement: 'exact rank-' + W.u.length + ' decomposition of <' + n + ',' + m + ',' + p + '> over ' + claim.ring
      + ': all ' + (n*m)*(m*p)*(n*p) + ' equations hold exactly (browser mirror — the citable path is oracle/certmachine.py)' } };
}`;

const STRASSEN7 = {
  u: [[1, 0, 0, 1], [0, 0, 1, 1], [1, 0, 0, 0], [0, 0, 0, 1], [1, 1, 0, 0], [-1, 0, 1, 0], [0, 1, 0, -1]],
  v: [[1, 0, 0, 1], [1, 0, 0, 0], [0, 1, 0, -1], [-1, 0, 1, 0], [0, 0, 0, 1], [1, 1, 0, 0], [0, 0, 1, 1]],
  w: [[1, 0, 0, 1], [0, 0, 1, -1], [0, 1, 0, 1], [1, 0, 1, 0], [-1, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0]],
};

/* the gate — throws unless the widget answers the known claims correctly */
function gate() {
  const certify = new Function(WIDGET_CORE + '; return cmCertify;')();
  const base = { task: { kind: 'matmul', n: 2, m: 2, p: 2, rank: 7 }, ring: 'Q', witness: STRASSEN7 };
  if (certify(base).verdict !== 'CERTIFIED') throw new Error('oracle widget failed to certify Strassen');
  const forged = JSON.parse(JSON.stringify(base)); forged.witness.u[0][0] = '1000000001/1000000000';
  const fr = certify(forged);
  if (fr.verdict !== 'REFUTED' || !fr.mechanism.first_violation) throw new Error('oracle widget failed to refute the forgery');
  if (certify({ task: { kind: 'matmul', n: 2, m: 2, p: 2, rank: 7 }, ring: 'Q',
    witness: { u: [[0.5, 0, 0, 1]], v: [[1, 0, 0, 0]], w: [[1, 0, 0, 0]] } }).verdict !== 'REFUSED') {
    throw new Error('oracle widget failed to refuse a float');
  }
}

/* the interactive block (textarea + buttons + output), shared markup */
function boxHtml() {
  return '<div class="col"><textarea id="cm-in" spellcheck="false" style="width:100%;min-height:150px;font-family:var(--f-mono);'
    + 'font-size:13px;background:var(--sunk);color:var(--ink);border:1px solid var(--rule);border-radius:6px;padding:10px" '
    + 'placeholder=\'{"task":{"kind":"matmul","n":2,"m":2,"p":2,"rank":7},"ring":"Q","witness":{"u":[[1,0,0,1],...],"v":[...],"w":[...]}}\'></textarea>'
    + '<div style="margin:8px 0"><button id="cm-go" style="font:inherit;padding:6px 14px;cursor:pointer;'
    + 'background:var(--sig);color:var(--paper);border:none;border-radius:6px">certify</button> '
    + '<button id="cm-ex" style="font:inherit;padding:6px 14px;cursor:pointer;background:var(--sunk);color:var(--ink);'
    + 'border:1px solid var(--rule);border-radius:6px">load Strassen 1969</button></div>'
    + '<pre id="cm-out" style="white-space:pre-wrap;background:var(--sunk);border:1px solid var(--rule);'
    + 'border-radius:6px;padding:10px;font-size:13px;min-height:1.5em;overflow-x:auto"></pre></div>'
    + '<script>' + WIDGET_CORE + `
(function(){
  var S7 = ${JSON.stringify(STRASSEN7)};
  var inp = document.getElementById('cm-in'), out = document.getElementById('cm-out');
  document.getElementById('cm-ex').onclick = function(){
    inp.value = JSON.stringify({task:{kind:'matmul',n:2,m:2,p:2,rank:7},ring:'Q',witness:S7}, null, 1);
  };
  document.getElementById('cm-go').onclick = function(){
    var claim; try { claim = JSON.parse(inp.value); }
    catch (e) { out.textContent = 'REFUSED: not JSON — ' + e.message; return; }
    var r = cmCertify(claim);
    out.textContent = JSON.stringify(r, null, 1);
    out.style.borderColor = r.verdict === 'CERTIFIED' ? 'var(--held)' : r.verdict === 'REFUTED' ? 'var(--sig)' : 'var(--rule)';
  };
})();</script>`;
}

module.exports = { WIDGET_CORE, STRASSEN7, gate, boxHtml };
