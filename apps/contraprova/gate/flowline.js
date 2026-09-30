/* flowline.js — Contraprova's gate for one engineering number: the pressure at
   the wellhead of a water-injection line, as a model proposes it (an AI
   surrogate, a solver, a spreadsheet), decided over the WHOLE box of declared
   inputs — never at one sample of it. apps/contraprova · cert-machine

   THE COMPUTATION, and the only physics this gate asserts:
     A   = π D²/4,  v = Q/A,  Re = ρ v D / μ
     1/√f = −2 log10( ε/(3.7 D) + 2.51/(Re √f) )          Colebrook, turbulent only
     P_wh = P_d + ρ g Δz − f (L/D) ρ v²/2                   Darcy–Weisbach, descending line
   A PROVADO here means: for EVERY input in the declared box, this model gives a
   wellhead pressure inside the enclosure and every declared rule holds. It is a
   statement about the declared model and the declared inputs, not about the sea.

   THE COLEBROOK ENCLOSURE WITHOUT A SQUARE ROOT. Write x = 1/√f. Then x is the
   root of h(x; a, b) = x + (2/ln 10) ln(a + b x), a = ε/(3.7D), b = 2.51/Re.
   For x > 0, a ≥ 0, b > 0, h is strictly increasing in x, in a and in b (ln is
   increasing and its argument is), so the root x*(a, b) is DECREASING in a and
   in b. Over a box where a ∈ [a₋, a₊] and b ∈ [b₋, b₊] every root therefore lies
   in [x*(a₊, b₊), x*(a₋, b₋)]. A float Newton step only LOCATES each end; the end
   counts when h is PROVED negative just below it (a lower bound) or positive
   just above it (an upper bound), in outward-rounded interval arithmetic with
   ln from instruments/interval/transcendental.js (a series with its remainder).

   THE THREE WORDS. Each check returns PROVADO (holds on the whole box),
   REFUTADO (fails, proved — on the whole box, or at a named impossibility), or
   RECUSADO (the declared evidence does not decide it: the box holds inputs on
   both sides, both sides proved, or the model does not apply). The receipt's
   verdict is REFUTADO if any check refutes, else RECUSADO if any refuses, else
   PROVADO. A refusal says what would decide it (the flip thresholds).       MIT */
'use strict';

const I = require('../../../instruments/interval/interval.js');
const T = require('../../../instruments/interval/transcendental.js');
const Q = require('../../../instruments/interval/rational.js');
const { iv, add, sub, mul, div, sqr, nextUp, nextDown } = I;

const PROVADO = 'PROVADO', REFUTADO = 'REFUTADO', RECUSADO = 'RECUSADO', NAO = 'NÃO AVALIADO';
const DIMS = ['L', 'D', 'eps', 'rho', 'mu', 'dz'];
const LN10 = T.log(iv(10));
const C2 = div(iv(2), LN10);                          /* 2 / ln 10 */
const G = dec('9.80665');                             /* standard gravity, exact by definition */
const RE_TURB = 4000;                                 /* Colebrook's stated domain */
const PSI_PER_BAR = '14.503773773';                   /* 1 bar = 14.5037737730 psi */

/* a declared decimal, enclosed: the double nearest it, widened one ulp each side */
function dec(s) { const d = Number(s); if (!Number.isFinite(d)) throw new Error('flowline: not a number: ' + s); return [nextDown(d), nextUp(d)]; }
function box(b) { const o = {}; for (const k of DIMS) { if (!b[k]) throw new Error('flowline: box needs ' + k); o[k] = [dec(b[k][0])[0], dec(b[k][1])[1]]; if (!(o[k][0] <= o[k][1])) throw new Error('flowline: empty ' + k); } return o; }
const lo = (x) => x[0], hi = (x) => x[1];

/* ------------------------------------------------------------ the physics -- */
function kinematics(B, Qd) {
  const q = div(Qd, iv(86400));                       /* m³/d → m³/s */
  const A = div(mul(T.PI, sqr(B.D)), iv(4));
  const v = div(q, A);
  const Re = div(mul(mul(B.rho, v), B.D), B.mu);
  return { q, A, v, Re };
}
/* h(x; a, b) enclosed at a thin x and thin a, b */
function h(x, a, b) { return add(iv(x), mul(C2, T.log(add(iv(a), mul(iv(b), iv(x)))))); }
function newton(a, b) {
  let x = 8;
  for (let k = 0; k < 60; k++) {
    const u = a + b * x, fx = x + (2 / Math.LN10) * Math.log(u), d = 1 + (2 / Math.LN10) * b / u;
    const nx = x - fx / d; if (Math.abs(nx - x) < 1e-15 * x) { x = nx; break; } x = nx;
  }
  return x;
}
/* [a lower bound of x*(a₊,b₊), an upper bound of x*(a₋,b₋)] — each end PROVED */
function colebrookX(aI, bI) {
  let xl = newton(aI[1], bI[1]), xr = newton(aI[0], bI[0]), step = 1e-13;
  for (let k = 0; ; k++) { const t = xl * (1 - step); if (hi(h(t, aI[1], bI[1])) < 0) { xl = t; break; } step *= 4; if (k > 30) throw new Error('flowline: Colebrook lower end not proved'); }
  step = 1e-13;
  for (let k = 0; ; k++) { const t = xr * (1 + step); if (lo(h(t, aI[0], bI[0])) > 0) { xr = t; break; } step *= 4; if (k > 30) throw new Error('flowline: Colebrook upper end not proved'); }
  return [xl, xr];
}
/* the wellhead pressure over a box, in bar, and the pieces it came from */
function wellhead(B, Qd, Pd) {
  const K = kinematics(B, Qd);
  const a = div(B.eps, mul(dec('3.7'), B.D)), b = div(dec('2.51'), K.Re);
  const X = colebrookX(a, b);
  const fI = div(iv(1), sqr(X));
  const dPf = div(mul(mul(div(B.L, B.D), B.rho), sqr(K.v)), mul(iv(2), sqr(X)));  /* Pa */
  const hyd = mul(mul(B.rho, G), B.dz);
  const P = div(sub(add(mul(Pd, iv(1e5)), hyd), dPf), iv(1e5));
  return { P, f: fI, v: K.v, Re: K.Re, dPf: div(dPf, iv(1e5)), hyd: div(hyd, iv(1e5)) };
}

/* ----------------------------------------------------- deciding on a box -- */
/* the float model at one point — a PROPOSER only: it chooses which dimension to
   bisect and nothing else; no verdict ever reads it */
function pointP(p, Qd, Pd) {
  const q = Qd / 86400, A = Math.PI * p.D * p.D / 4, v = q / A, Re = p.rho * v * p.D / p.mu;
  const x = newton(p.eps / (3.7 * p.D), 2.51 / Re);
  return Pd + (p.rho * 9.80665 * p.dz - (p.L / p.D) * p.rho * v * v / (2 * x * x)) / 1e5;
}
const mid = (B) => { const o = {}; for (const k of DIMS) o[k] = (B[k][0] + B[k][1]) / 2; return o; };
/* bisect the dimension that moves P_wh most across the box */
function split(B, Qd, Pd) {
  const c = mid(B); let best = DIMS[0], bw = -1;
  for (const k of DIMS) {
    const a = Object.assign({}, c, { [k]: B[k][0] }), b = Object.assign({}, c, { [k]: B[k][1] });
    const w = Math.abs(pointP(b, Qd, Pd) - pointP(a, Qd, Pd)); if (w > bw) { bw = w; best = k; }
  }
  const m = (B[best][0] + B[best][1]) / 2, L = Object.assign({}, B), R = Object.assign({}, B);
  L[best] = [B[best][0], m]; R[best] = [m, B[best][1]];
  return [L, R];
}
/* decide P_wh ≤ bound on the box: the proved-ok subboxes, the proved-violating
   ones, the ones left open at the depth, and the enclosure over all of them */
function decideLE(B, Qd, Pd, bound, depth, acc) {
  acc = acc || { ok: 0, bad: 0, open: 0, env: [Infinity, -Infinity], evals: 0 };
  const w = wellhead(B, Qd, Pd); acc.evals++;
  if (hi(w.P) <= bound) { acc.ok++; widen(acc.env, w.P); return acc; }
  if (lo(w.P) > bound) { acc.bad++; widen(acc.env, w.P); return acc; }
  if (depth <= 0) { acc.open++; widen(acc.env, w.P); return acc; }
  const md = [(Qd[0] + Qd[1]) / 2, (Pd[0] + Pd[1]) / 2];
  for (const S of split(B, md[0], md[1])) decideLE(S, Qd, Pd, bound, depth - 1, acc);
  return acc;
}
function widen(env, P) { env[0] = Math.min(env[0], P[0]); env[1] = Math.max(env[1], P[1]); }
/* a tight enclosure of P_wh over the box: the union over a fixed bisection */
function envelope(B, Qd, Pd, depth) {
  const env = [Infinity, -Infinity]; let evals = 0;
  const md = [(Qd[0] + Qd[1]) / 2, (Pd[0] + Pd[1]) / 2];
  (function go(S, d) { if (d === 0) { widen(env, wellhead(S, Qd, Pd).P); evals++; return; } for (const X of split(S, md[0], md[1])) go(X, d - 1); })(B, depth);
  return { env, evals };
}
/* the 64 corners of the box, each a THIN box decided on its own: a corner with
   P_wh proved above the bound is a declared input that violates the rule; one
   proved at or below it is a declared input that respects it */
function corners(B, Qd, Pd, bound) {
  let above = null, below = null, evals = 0;
  for (let m = 0; m < 1 << DIMS.length; m++) {
    const C = {}; DIMS.forEach((k, i) => { const x = B[k][(m >> i) & 1]; C[k] = [x, x]; });
    const P = wellhead(C, Qd, Pd).P; evals++;
    if (lo(P) > bound && (!above || lo(P) > above.P[0])) above = { at: C, P };
    if (hi(P) <= bound && (!below || hi(P) < below.P[1])) below = { at: C, P };
  }
  return { above, below, evals };
}
function pointText(C) {
  const n = (x, d) => x.toFixed(d).replace('.', ',');
  return 'ε = ' + n(C.eps[0] * 1e3, 3) + ' mm, μ = ' + n(C.mu[0] * 1e3, 2) + ' mPa·s, D = ' + n(C.D[0] * 1e3, 1) + ' mm, ρ = ' + Math.round(C.rho[0]).toLocaleString('pt-BR')
    + ' kg/m³, Δz = ' + Math.round(C.dz[0]).toLocaleString('pt-BR') + ' m, L = ' + Math.round(C.L[0]).toLocaleString('pt-BR') + ' m';
}

/* ------------------------------------------------------------ exact bits -- */
function ratOf(s) {
  const m = /^\s*(-?)(\d+)(?:[.,](\d+))?\s*$/.exec(String(s)); if (!m) throw new Error('flowline: not a decimal: ' + s);
  const frac = m[3] || '', n = BigInt(m[2] + frac) * (m[1] ? -1n : 1n);
  return Q.R(n, 10n ** BigInt(frac.length));
}
const ratStr = (r) => (Number(r.n) / Number(r.d)).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

/* ------------------------------------------------------------ the receipt -- */
/* proposal: { Q (m³/d), Pd (bar), claim: { Pwh (bar), v (m/s)?, f? },
               split: { header, wells: [..] }? }   all decimals as strings
   rules:    { PwhMax (bar), vMax (m/s) }                                      */
function decide(proposal, boxDecl, rules, opts) {
  const depth = (opts && opts.depth) || 12;
  const B = box(boxDecl);
  const Qd = dec(proposal.Q), Pd = dec(proposal.Pd);
  const checks = [], thresholds = [], flip = {};
  const K = kinematics(B, Qd);
  const put = (id, name, verdict, text) => checks.push({ id, name, verdict, text });
  const f1 = (x) => x.toFixed(1).replace('.', ','), f3 = (x) => x.toFixed(3).replace('.', ',');
  /* every printed bound is rounded OUTWARD, so the printed interval still contains the proved one */
  const dn = (x, d) => (Math.floor(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ','), up = (x, d) => (Math.ceil(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');

  /* 1 — conservation of mass at the manifold (exact rationals) */
  if (proposal.split) {
    const hdr = ratOf(proposal.split.header);
    const sum = proposal.split.wells.reduce((s, w) => Q.add(s, ratOf(w)), Q.ZERO);
    if (Q.cmp(hdr, sum) !== 0) put('massa', 'Conservação de massa no manifold', REFUTADO, 'Entram ' + ratStr(hdr) + ' m³/d e saem ' + ratStr(sum) + ' m³/d pelos poços — a diferença é exata, não arredondamento.');
    else put('massa', 'Conservação de massa no manifold', PROVADO, 'Entram e saem ' + ratStr(hdr) + ' m³/d, em aritmética racional exata.');
  }

  /* 2 — kinematics: a claimed velocity must be Q/A for some declared D */
  if (proposal.claim.v !== undefined) {
    const cv = dec(proposal.claim.v);
    if (hi(cv) < lo(K.v) || lo(cv) > hi(K.v)) put('cinematica', 'Coerência interna (v = Q/A)', REFUTADO, 'A velocidade declarada, ' + proposal.claim.v.replace('.', ',') + ' m/s, não é Q/A para nenhum diâmetro declarado: Q/A ∈ [' + dn(lo(K.v), 3) + '; ' + up(hi(K.v), 3) + '] m/s.');
    else put('cinematica', 'Coerência interna (v = Q/A)', PROVADO, 'A velocidade declarada está em Q/A ∈ [' + dn(lo(K.v), 3) + '; ' + up(hi(K.v), 3) + '] m/s.');
  }

  /* 3 — the model-free bound: friction cannot add pressure */
  const cP = dec(proposal.claim.Pwh);
  const hydMax = div(mul(mul(iv(B.rho[1]), G), iv(B.dz[1])), iv(1e5));
  const ceiling = add(Pd, hydMax);
  if (lo(cP) > hi(ceiling)) put('energia', 'Limite físico (atrito ≥ 0)', REFUTADO, 'A pressão declarada, ' + proposal.claim.Pwh.replace('.', ',') + ' bar, excede P_d + ρgΔz ≤ ' + up(hi(ceiling), 1) + ' bar: exigiria atrito negativo, energia criada na linha.');
  else put('energia', 'Limite físico (atrito ≥ 0)', PROVADO, 'A pressão declarada não excede P_d + ρgΔz ≤ ' + up(hi(ceiling), 1) + ' bar.');

  /* 4 — the model's domain: Colebrook is stated for turbulent flow only */
  const inDomain = lo(K.Re) >= RE_TURB;
  const qMin = (() => {                                /* Re₋ ≥ 4000 ⇔ Q ≥ 4000·π·D₊·μ₊/(4 ρ₋) · 86400 */
    const q = mul(div(mul(mul(iv(RE_TURB), T.PI), mul(iv(B.D[1]), iv(B.mu[1]))), mul(iv(4), iv(B.rho[0]))), iv(86400));
    return Math.ceil(hi(q));
  })();
  if (inDomain) put('dominio', 'Domínio do modelo (Re ≥ 4.000)', PROVADO, 'Re ∈ [' + Math.floor(lo(K.Re)).toLocaleString('pt-BR') + '; ' + Math.ceil(hi(K.Re)).toLocaleString('pt-BR') + '] em toda a caixa: turbulento, Colebrook se aplica.');
  else {
    put('dominio', 'Domínio do modelo (Re ≥ 4.000)', RECUSADO, 'Re ∈ [' + Math.floor(lo(K.Re)).toLocaleString('pt-BR') + '; ' + Math.ceil(hi(K.Re)).toLocaleString('pt-BR') + ']: parte da caixa não é turbulenta, e nenhum modelo declarado vale ali. Não há decisão a dar.');
    flip.qMin = qMin;
    thresholds.push('Com Q ≥ ' + qMin.toLocaleString('pt-BR') + ' m³/d o escoamento é turbulento em toda a caixa e o portão decide.');
  }

  /* 5 — the velocity rule */
  if (rules.vMax !== undefined) {
    const vm = dec(rules.vMax);
    if (hi(K.v) <= lo(vm)) put('velocidade', 'Regra: v ≤ ' + rules.vMax.replace('.', ',') + ' m/s', PROVADO, 'v ≤ ' + up(hi(K.v), 3) + ' m/s em toda a caixa.');
    else if (lo(K.v) > hi(vm)) put('velocidade', 'Regra: v ≤ ' + rules.vMax.replace('.', ',') + ' m/s', REFUTADO, 'v ≥ ' + dn(lo(K.v), 3) + ' m/s em toda a caixa.');
    else put('velocidade', 'Regra: v ≤ ' + rules.vMax.replace('.', ',') + ' m/s', RECUSADO, 'v ∈ [' + dn(lo(K.v), 3) + '; ' + up(hi(K.v), 3) + '] m/s atravessa o limite dentro da caixa.');
  }

  let env = null, evals = 0;
  if (inDomain) {
    /* 6 — a claimed friction factor must solve Colebrook for some declared input */
    if (proposal.claim.f !== undefined) {
      const fc = dec(proposal.claim.f);
      const a = div(B.eps, mul(dec('3.7'), B.D)), b = div(dec('2.51'), K.Re);
      const X = colebrookX(a, b), fI = div(iv(1), sqr(iv(X[0], X[1])));
      if (hi(fc) < lo(fI) || lo(fc) > hi(fI)) put('colebrook', 'Solução de Colebrook', REFUTADO, 'f = ' + proposal.claim.f.replace('.', ',') + ' não resolve Colebrook para nenhuma entrada declarada: as soluções estão em [' + dn(lo(fI), 5) + '; ' + up(hi(fI), 5) + ']. O solver parou antes de convergir.');
      else put('colebrook', 'Solução de Colebrook', PROVADO, 'f declarado está entre as soluções provadas, [' + dn(lo(fI), 5) + '; ' + up(hi(fI), 5) + '].');
    }
    /* 7 — the claimed pressure against the enclosure */
    const E = envelope(B, Qd, Pd, 7); env = E.env; evals += E.evals;
    if (hi(cP) < env[0] || lo(cP) > env[1]) {
      let why = '';
      const psi = div(cP, dec(PSI_PER_BAR));
      if (lo(psi) >= env[0] && hi(psi) <= env[1]) why = ' Dividido por 14,504, cai dentro: é compatível com psi informado como bar.';
      else if (hi(cP) < env[0]) why = ' Fica ' + dn(env[0] - hi(cP), 1) + ' bar abaixo do mínimo possível.';
      else why = ' Fica ' + dn(lo(cP) - env[1], 1) + ' bar acima do máximo possível.';
      put('modelo', 'Consistência com o modelo físico', REFUTADO, 'P_wh declarada, ' + proposal.claim.Pwh.replace('.', ',') + ' bar, está fora de [' + dn(env[0], 1) + '; ' + up(env[1], 1) + '] bar — o intervalo que contém P_wh para TODA entrada declarada.' + why);
    } else put('modelo', 'Consistência com o modelo físico', PROVADO, 'P_wh declarada está em [' + dn(env[0], 1) + '; ' + up(env[1], 1) + '] bar, que contém P_wh para toda entrada declarada.');

    /* 8 — the operational rule, decided on the whole box */
    const bound = Number(rules.PwhMax);
    const name = 'Regra: P_wh ≤ ' + rules.PwhMax + ' bar';
    const W = corners(B, Qd, Pd, bound); evals += W.evals;
    /* whether the WHOLE box respects the bound: impossible once a violating corner is proved */
    const allOk = (S) => { const r = decideLE(S, Qd, Pd, bound, depth); evals += r.evals; return r.bad === 0 && r.open === 0; };
    const allBad = (S) => { const r = decideLE(S, Qd, Pd, bound, depth); evals += r.evals; return r.ok === 0 && r.open === 0; };
    if (!W.above && allOk(B)) put('limite', name, PROVADO, 'Provado em toda a caixa: nenhuma entrada declarada leva P_wh acima de ' + rules.PwhMax + ' bar.');
    else if (!W.below && allBad(B)) put('limite', name, REFUTADO, 'Violada em toda a caixa: P_wh > ' + rules.PwhMax + ' bar para toda entrada declarada.');
    else {
      put('limite', name, RECUSADO, W.above && W.below
        ? 'A caixa declarada contém entradas dos dois lados, ambos provados. Viola: ' + pointText(W.above.at) + ' → P_wh ≥ ' + dn(lo(W.above.P), 1) + ' bar. Respeita: ' + pointText(W.below.at) + ' → P_wh ≤ ' + up(hi(W.below.P), 1) + ' bar. A evidência declarada não decide.'
        : 'Não decidido na profundidade do portão.');
      /* the flip thresholds: P_wh = P_d + G(box), so the pump pressure moves the whole enclosure */
      const Gl = env[0] - hi(Pd), Gh = env[1] - lo(Pd);   /* bounds on G over the box */
      const greenPd = Math.floor((bound - Gh) * 10) / 10, redPd = Math.ceil((bound - Gl) * 10) / 10;
      flip.pdGreen = greenPd; flip.pdRed = redPd;
      thresholds.push('Com P_d ≤ ' + f1(greenPd) + ' bar a regra fica PROVADA na caixa inteira; acima de ' + f1(redPd) + ' bar fica REFUTADA.');
      /* and the disclosure that would decide it: for each input whose higher values
         only add friction (μ, ε), the smallest lower end at which the whole box is safe */
      const DISC = { mu: ['medir a viscosidade da água injetada e mostrar μ ≥ ', 1e3, 2, ' mPa·s'], eps: ['inspecionar a linha e mostrar rugosidade ε ≥ ', 1e3, 3, ' mm'] };
      for (const k of Object.keys(DISC)) {
        let a0 = B[k][0], b0 = B[k][1];
        const safe = (m) => allOk(Object.assign({}, B, { [k]: [m, B[k][1]] }));
        if (!safe(b0)) continue;
        for (let j = 0; j < 16; j++) { const m = (a0 + b0) / 2; if (safe(m)) b0 = m; else a0 = m; }
        const [t, sc, d, u] = DISC[k];
        flip[k] = Math.ceil(b0 * sc * 10 ** d) / 10 ** d;
        thresholds.push('Ou ' + t + up(b0 * sc, d) + u + ' (a caixa declara ' + (Number(boxDecl[k][0]) * sc).toFixed(d).replace('.', ',') + '–' + (Number(boxDecl[k][1]) * sc).toFixed(d).replace('.', ',') + u + '): com isso a regra fica PROVADA.');
      }
    }
  } else {
    if (proposal.claim.f !== undefined) put('colebrook', 'Solução de Colebrook', NAO, 'Fora do domínio do modelo.');
    put('modelo', 'Consistência com o modelo físico', NAO, 'Fora do domínio do modelo: nenhum intervalo de P_wh é afirmado.');
    put('limite', 'Regra: P_wh ≤ ' + rules.PwhMax + ' bar', NAO, 'Fora do domínio do modelo.');
  }

  const vs = checks.map((c) => c.verdict);
  const verdict = vs.includes(REFUTADO) ? REFUTADO : vs.includes(RECUSADO) ? RECUSADO : PROVADO;
  return {
    verdict,
    enclosure: env ? [Math.floor(env[0] * 10) / 10, Math.ceil(env[1] * 10) / 10] : null,
    claim: proposal.claim.Pwh,
    checks, thresholds, flip, evals,
    proved: checks.filter((c) => c.verdict === PROVADO).length,
    of: checks.filter((c) => c.verdict !== NAO).length
  };
}

module.exports = { decide, ratOf, wellhead, colebrookX, newton, box, dec, decideLE, envelope, corners, pointP, kinematics, PROVADO, REFUTADO, RECUSADO, NAO, DIMS };
