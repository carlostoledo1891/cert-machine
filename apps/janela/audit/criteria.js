/* criteria.js — one operation, one window, three criteria.
   apps/janela/audit · cert-machine

   The app's question is not "is the sea below the limit at 09h" but "can this
   operation START at 09h and RUN for TR hours": the window [t, t + TR]. This
   module answers it three ways, with the same decider every time
   (instruments/window/decide.js) and the same pinned DNV reading
   (apps/janela/audit/dnv.js, unchanged — its sha256 is pinned by the
   workability record):

     band   the MEASURED band (forecast x the error measured against satellites
            at this site and lead), at every step of the window, against the
            limits as printed;
     table  DNV-OS-H101: the DETERMINISTIC forecast at every step of the window
            against OPWF = alpha x OPLIM, alpha from Table 4-1 at design Hs =
            OPLIM and TPOP = TR / 2 (B402); a wind limit takes Table 4-6's
            alpha, the smaller column (the 10-year wind is not assessed here);
     site   the same, with the SITE alpha: the lower end of the 90% interval
            estimated at the site (certs/janela-alpha.json), rounded down to
            0.01, interpolated between design-Hs columns as the standard does —
            only where both columns are estimated, never extrapolated.

   The deterministic forecast is carried as the 1 mm / 0.01 kn interval that
   holds it (the published data is rounded OUTWARD), so a DNV verdict is sound
   exactly like a band verdict: LIBERADA and VETADA over the wider interval
   hold over the true value, and only INDEFINIDA can grow.

   TR is rounded UP to the forecast's 6 h grid: a window of 30 h is decided on
   the steps t .. t + 36 h. A window that runs past the last forecast step is
   not decided (null): there is nothing to decide it on.

   Runs in Node and, unchanged, in the reader's tab (a require shim resolves
   modules by file name). Pure: no file is read here.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const Q = require('../../../instruments/window/q.js');
const D = require('../../../instruments/window/decide.js');

const STEP_H = 6;
const UNIT = { hs: 'm', wind_sustained: 'kn' };
const CODE = { 'LIBERADA': 'L', 'VETADA': 'V', 'INDEFINIDA': 'I', 'SEM DADOS': 'S', 'RECUSADA': 'R' };

/* the window's steps: indices k >= i with lead_k <= lead_i + TR rounded up to the grid; null past the horizon */
function span(steps, i, TR) {
  const need = Math.ceil(Math.max(0, TR) / STEP_H) * STEP_H;
  const L0 = steps[i].lead, idx = [];
  for (let k = i; k < steps.length && steps[k].lead <= L0 + need; k++) idx.push(k);
  return steps[idx[idx.length - 1]].lead >= L0 + need ? idx : null;
}
function trOf(TR) { return Math.ceil(Math.max(0, TR) / STEP_H) * STEP_H; }

/* the published step: hb/wb = measured band [lo, hi] or null; hd/wd = deterministic [lo, hi] */
function bandVars(op, st) {
  const v = {};
  if (st.hb && op.hsAt !== 'berth') v.hs = { lo: st.hb[0], hi: st.hb[1] };
  if (st.wb) v.wind_sustained = { lo: st.wb[0], hi: st.wb[1] };
  return v;
}
function detVars(op, st) {
  const v = {};
  if (st.hd && op.hsAt !== 'berth') v.hs = { lo: st.hd[0], hi: st.hd[1] };
  if (st.wd) v.wind_sustained = { lo: st.wd[0], hi: st.wd[1] };
  return v;
}
function run(op, limits, steps, idx, vars) {
  const fc = { unit: UNIT, steps: idx.map((k) => ({ t: steps[k].t, vars: vars(op, steps[k]) })) };
  return D.decide({ id: op.id, limits }, fc, [steps[idx[0]].t, steps[idx[idx.length - 1]].t]);
}

/* linear between design-Hs columns, rows as steps 'TPOP <= x' — the standard's own reading, on a table
   whose cells may be null (not estimated): an interpolation needs BOTH ends, nothing is extrapolated */
function interp(rows, columns, designHs, TPOP) {
  const rs = Object.keys(rows).map(Number).sort((a, b) => a - b);
  const r = rs.find((x) => TPOP <= x);
  if (r === undefined) return null;
  const ys = rows[String(r)].map((v) => (v === null || v === undefined ? null : Q.parse(String(v))));
  const xs = columns.map((c) => Q.parse(String(c)));
  const h = Q.parse(designHs);
  if (Q.cmp(h, xs[0]) < 0) return null;
  if (Q.cmp(h, xs[xs.length - 1]) >= 0) return ys[ys.length - 1];
  for (let k = 0; k + 1 < xs.length; k++) {
    if (Q.cmp(xs[k], h) <= 0 && Q.cmp(h, xs[k + 1]) <= 0) {
      if (Q.cmp(h, xs[k]) === 0) return ys[k];
      if (Q.cmp(h, xs[k + 1]) === 0) return ys[k + 1];
      if (!ys[k] || !ys[k + 1]) return null;
      const w = Q.div(Q.sub(h, xs[k]), Q.sub(xs[k + 1], xs[k]));
      return Q.add(ys[k], Q.mul(Q.sub(ys[k + 1], ys[k]), w));
    }
  }
  return null;
}

/* the alphas a DNV criterion needs for this operation and window length.
   ctx: { dnv: the dnv.js module, wind46: Table 4-6 {rows}, site: {rows, columns} | null, why: reason when site is null } */
function alphas(op, TR, crit, ctx) {
  const T = trOf(TR) / 2;
  const hsL = op.limits.filter((l) => l.var === 'hs'), wL = op.limits.filter((l) => l.var === 'wind_sustained');
  const out = { TPOP: T, hs: null, wind: null, na: null };
  if (!hsL.length) { out.na = 'a operação não limita Hs: o α da DNV é um fator sobre o limite de onda'; return out; }
  if (hsL.some((l) => l.op !== '<' && l.op !== '<=')) { out.na = 'o α da DNV reduz um limite superior de Hs'; return out; }
  const design = hsL[0].value;
  if (crit === 'table') {
    out.hs = ctx.dnv.alpha('4-1', design, T);
    if (!out.hs) { out.na = Q.cmp(Q.parse(design), [1n, 1n]) < 0 ? 'Hs de projeto abaixo de 1 m: a DNV diz caso a caso (Nota 3)' : 'TPOP acima de 72 h: fora da Tabela 4-1'; return out; }
  } else {
    if (!ctx.site) { out.na = ctx.why || 'sem α do local estimado aqui'; return out; }
    out.hs = interp(ctx.site.rows, ctx.site.columns, design, T);
    if (!out.hs) { out.na = 'o α do local não está estimado para Hs de projeto ' + design + ' m e TPOP ' + T + ' h aqui (pares insuficientes); não se extrapola'; return out; }
  }
  if (wL.length) {
    const rs = Object.keys(ctx.wind46.rows).map(Number).sort((a, b) => a - b);
    const r = rs.find((x) => T <= x);
    if (r === undefined) { out.na = 'TPOP acima de 72 h: fora da Tabela 4-6 (vento)'; out.hs = null; return out; }
    out.wind = Q.parse(String(ctx.wind46.rows[String(r)][0]));
  }
  return out;
}
/* the limits a DNV criterion decides against: every Hs and wind limit times its alpha (OPWF), the rest as printed */
function scaled(op, a) {
  return op.limits.map((l) => {
    if (l.var === 'hs') return Object.assign({}, l, { value: Q.str(Q.mul(a.hs, Q.parse(l.value))) });
    if (l.var === 'wind_sustained' && a.wind) return Object.assign({}, l, { value: Q.str(Q.mul(a.wind, Q.parse(l.value))) });
    return l;
  });
}

/* decide(op, steps, i, TR, crit, ctx) -> the decider's full result, or
     null                      the window runs past the forecast's last step
     { verdict: 'n/a', why }   the criterion does not apply here (no alpha, or a terminal rule) */
function decideWindow(op, steps, i, TR, crit, ctx) {
  const idx = span(steps, i, TR);
  if (!idx) return null;
  if (crit === 'band') return Object.assign(run(op, op.limits, steps, idx, bandVars), { span: [idx[0], idx[idx.length - 1]] });
  if (op.npcp) return { verdict: 'n/a', why: 'uma regra da Capitania é uma condição na hora, não uma operação marinha com TPOP: o α da DNV não se aplica a ela' };
  const a = alphas(op, TR, crit, ctx);
  if (a.na) return { verdict: 'n/a', why: a.na };
  const lim = scaled(op, a);
  const r = run(op, lim, steps, idx, detVars);
  return Object.assign(r, { span: [idx[0], idx[idx.length - 1]], alpha: { hs: Q.str(a.hs), wind: a.wind ? Q.str(a.wind) : null, TPOP: a.TPOP },
    opwf: lim.filter((l) => l.var === 'hs' || l.var === 'wind_sustained').map((l) => ({ var: l.var, op: l.op, value: l.value, unit: l.unit })) });
}

/* one letter per start step, for a whole week: L V I S R, '-' past the horizon, 'n' not applicable */
function code(r) { return r === null ? '-' : r.verdict === 'n/a' ? 'n' : CODE[r.verdict]; }
function week(op, steps, TR, crit, ctx) {
  let s = '';
  const full = [];
  for (let i = 0; i < steps.length; i++) { const r = decideWindow(op, steps, i, TR, crit, ctx); s += code(r); full.push(r); }
  return { codes: s, full };
}
/* the canonical form of a result: what two deciders must agree on, verdict, witness, threshold and all */
function canon(r) {
  if (r === null) return '-';
  if (r.verdict === 'n/a') return 'n|' + r.why;
  return [r.verdict, JSON.stringify(r.witness || null), JSON.stringify(r.flip || null), (r.notForecast || []).join(','), (r.decidedOn || []).join(','),
    r.alpha ? r.alpha.hs + '/' + r.alpha.wind : ''].join('|');
}

/* every published decision of ONE place, in THE order the digest is taken in: each preset under the three
   criteria (one string of 3 x 29 letters), then each terminal rule at this place under the band criterion.
   The build and the reader's tab both walk the places through this function, so they cannot walk differently. */
function place(p, steps, ctx, presets, npcp, crits) {
  const row = {}, lines = [];
  let n = 0;
  for (const op of presets) {
    let codes = '';
    for (const crit of crits) {
      const w = week(op, steps, op.TR, crit, ctx);
      codes += w.codes; n += w.full.length;
      lines.push(p.id + '|' + op.id + '|' + crit + '|' + w.full.map(canon).join(';'));
    }
    row[op.id] = codes;
  }
  for (const op of npcp) {
    if (op.site !== p.id) continue;
    const w = week(op, steps, op.TR, 'band', ctx);
    row[op.id] = w.codes; n += w.full.length;
    lines.push(p.id + '|' + op.id + '|band|' + w.full.map(canon).join(';'));
  }
  return { row, lines, n };
}

module.exports = { span, trOf, interp, alphas, scaled, decideWindow, week, code, canon, place, CODE, STEP_H };
