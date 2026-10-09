/* abatimento.js — the Registro de Abatimento's kernel: a technology's abatement
   potential DECIDED over the whole envelope of premises it declares, never at
   one point of it. apps/abatimento · cert-machine                          MIT

   THE OBJECT. A scenario (cenário) is a versioned record: an emission source,
   a set of premises each declared as a RANGE with its source, and a formula
   that is a signed sum of products of premises:

       abatimento [tCO2e/ano] = Σ_t  sinal_t · fator_t · Π_{k ∈ vars_t} premissa_k

   with every premise non-negative and each premise appearing at most once per
   term. Such a form is MULTILINEAR (affine in each premise separately), so its
   minimum and maximum over the box of premises are attained at CORNERS of the
   box. The kernel enumerates the corners, evaluates each in EXACT RATIONAL
   arithmetic (BigInt numerators and denominators; no float ever participates
   in a verdict), and returns the enclosure [lo, hi] with the two corners that
   attain it as witnesses. Nothing is sampled, nothing is approximated.

   THE WORDS (the house grammar, as in Contraprova and Decidível):
     PROVADO   the statement holds for EVERY admissible point of the envelope;
     REFUTADO  it fails for every admissible point — the failure is proved;
     RECUSADO  the envelope holds points on both sides; the receipt names the
               premise whose narrowing would decide, and to what width.

   WHAT IS DECIDED
     · the class of abatement potential against declared thresholds (the
       MACC's own classes: Incremental / Moderado / Alto);
     · whether a published point claim ("≈ 142 mil tCO2e/ano") is COMPATÍVEL
       with the envelope (inside the enclosure) or not;
     · the ranking of two scenarios (decided only where enclosures separate);
     · the technical and the agreed deployment envelopes over a ramp-up;
     · the aggregation of several scenarios, with the double-counting audit:
       two scenarios on the same source declared mutually exclusive cannot be
       summed, and the sum on a source cannot exceed the source's emissions;
     · the diff between two versions: which premise moved, what it did to the
       enclosure and to the verdicts.

   WHAT IS NOT DECIDED (said here, said on the page): life-cycle inventories.
   An LCA number enters as a declared range with its study pinned; the kernel
   decides over it, it does not compute it. */
'use strict';
/* a relative require (no path module): the page bundle resolves modules by basename */
const RAT = require('../../../instruments/interval/rational.js');
const { R, add, sub, mul, div, cmp } = RAT;

/* ---- exact decimals: "0.0289" -> 289/10000, "-1.5" -> -3/2, "142000" -> 142000/1 ---- */
function Q(s) {
  if (s && typeof s === 'object' && 'n' in s) return s;
  s = String(s).trim().replace(',', '.');
  const fr = /^([+-]?\d+)\/(\d+)$/.exec(s);           /* "451153/802464": a rational printed by toStr */
  if (fr) return R(BigInt(fr[1]), BigInt(fr[2]));
  const m = /^([+-]?)(\d*)(?:\.(\d+))?$/.exec(s);
  if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) throw new Error('abatimento: not a decimal: ' + s);
  const sign = m[1] === '-' ? -1n : 1n, ip = m[2] || '0', fp = m[3] || '';
  return R(sign * BigInt(ip + fp), 10n ** BigInt(fp.length));
}
const ZERO = R(0n, 1n), ONE = R(1n, 1n), TWO = R(2n, 1n);
const lt = (a, b) => cmp(a, b) < 0, le = (a, b) => cmp(a, b) <= 0, ge = (a, b) => cmp(a, b) >= 0, gt = (a, b) => cmp(a, b) > 0;
const qmin = (a, b) => (lt(a, b) ? a : b), qmax = (a, b) => (gt(a, b) ? a : b);
/* a rational as a decimal string with d places, rounded half away from zero — for display only */
function dec(q, d) {
  const neg = q.n < 0n, n = neg ? -q.n : q.n, scale = 10n ** BigInt(d);
  const r = (n * scale * 2n + q.d) / (2n * q.d);
  const ip = r / scale, fp = (r % scale).toString().padStart(d, '0');
  return (neg && r !== 0n ? '-' : '') + ip.toString() + (d ? '.' + fp : '');
}
const toStr = (q) => (q.d === 1n ? q.n.toString() : q.n.toString() + '/' + q.d.toString());

/* ---- the envelope: every premise a closed box of non-negative rationals ---- */
function readBox(k, b) {
  if (!b || b.lo === undefined || b.hi === undefined) throw new Error('abatimento: premise ' + k + ' has no [lo, hi]');
  const lo = Q(b.lo), hi = Q(b.hi);
  if (gt(lo, hi)) throw new Error('abatimento: premise ' + k + ' has lo > hi');
  if (lt(lo, ZERO)) throw new Error('abatimento: premise ' + k + ' is negative — a reduction is a negative-signed term, never a negative premise');
  return { lo, hi };
}
function readScenario(c) {
  if (!c || !c.premissas || !Array.isArray(c.termos) || !c.termos.length) throw new Error('abatimento: a scenario needs premissas and termos');
  const P = {};
  for (const [k, b] of Object.entries(c.premissas)) P[k] = readBox(k, b);
  const T = c.termos.map((t, i) => {
    if (!Array.isArray(t.vars) || !t.vars.length) throw new Error('abatimento: term ' + i + ' names no premise');
    const seen = new Set();
    for (const v of t.vars) {
      if (!P[v]) throw new Error('abatimento: term ' + i + ' uses an undeclared premise ' + v);
      if (seen.has(v)) throw new Error('abatimento: term ' + i + ' uses ' + v + ' twice — not multilinear, the corner rule does not apply');
      seen.add(v);
    }
    const sinal = t.sinal === -1 || t.sinal === '-1' || t.sinal === '-' ? -1n : 1n;
    const fator = t.fator === undefined ? ONE : Q(t.fator);
    if (lt(fator, ZERO)) throw new Error('abatimento: term ' + i + ' has a negative factor — put the sign in sinal');
    return { nome: t.nome || ('termo ' + (i + 1)), escopo: String(t.escopo || '1'), tipo: t.tipo || 'operacional', sinal, fator, vars: t.vars.slice() };
  });
  return { P, T };
}

/* evaluate the form at a point (premise -> rational) */
function evalAt(T, point) {
  let s = ZERO;
  for (const t of T) {
    let p = t.fator;
    for (const v of t.vars) p = mul(p, point[v]);
    s = t.sinal < 0n ? sub(s, p) : add(s, p);
  }
  return s;
}
/* per-term contributions at a point, for the receipt */
function termsAt(T, point) {
  return T.map((t) => { let p = t.fator; for (const v of t.vars) p = mul(p, point[v]); return { nome: t.nome, escopo: t.escopo, tipo: t.tipo, sinal: t.sinal < 0n ? -1 : 1, valor: toStr(p) }; });
}

/* THE ENCLOSURE by corner enumeration — exact for a multilinear form.
   Returns lo, hi and the witnessing corners (premise -> 'lo' | 'hi'). */
function enclose(P, T) {
  const keys = Object.keys(P);
  const n = keys.length;
  if (n > 20) throw new Error('abatimento: ' + n + ' premises — the corner enumeration is capped at 20 (2^20 corners)');
  let lo = null, hi = null, wlo = null, whi = null, evals = 0;
  const point = {};
  for (let mask = 0; mask < (1 << n); mask++) {
    const corner = {};
    for (let i = 0; i < n; i++) { const k = keys[i]; const side = (mask >> i) & 1 ? 'hi' : 'lo'; point[k] = P[k][side]; corner[k] = side; }
    const v = evalAt(T, point); evals++;
    if (lo === null || lt(v, lo)) { lo = v; wlo = Object.assign({}, corner); }
    if (hi === null || gt(v, hi)) { hi = v; whi = Object.assign({}, corner); }
  }
  return { lo, hi, wlo, whi, evals, n };
}
const cornerPoint = (P, w) => Object.fromEntries(Object.keys(P).map((k) => [k, P[k][w[k]]]));
const widthOf = (E) => sub(E.hi, E.lo);

/* ---- the class of potential: thresholds [a, b) in tCO2e/ano; b null = unbounded ---- */
function decideClass(E, classes) {
  const out = [];
  for (const [nome, [a, b]] of Object.entries(classes)) {
    const A = Q(a), B = b === null || b === undefined ? null : Q(b);
    const inside = ge(E.lo, A) && (B === null || lt(E.hi, B));
    const outside = lt(E.hi, A) || (B !== null && ge(E.lo, B));
    out.push({ classe: nome, de: toStr(A), ate: B === null ? null : toStr(B), verdict: inside ? 'PROVADO' : outside ? 'REFUTADO' : 'RECUSADO' });
  }
  const proved = out.find((x) => x.verdict === 'PROVADO');
  /* the thresholds the enclosure straddles, in order */
  const straddled = [];
  for (const [, [a, b]] of Object.entries(classes)) for (const t of [a, b]) {
    if (t === null || t === undefined) continue;
    const TQ = Q(t);
    if (lt(E.lo, TQ) && ge(E.hi, TQ) && !straddled.some((s) => cmp(s, TQ) === 0)) straddled.push(TQ);
  }
  return { porClasse: out, decidida: proved ? proved.classe : null, limiares: straddled.map(toStr) };
}

/* ---- a published point claim against the envelope ---- */
function decideClaim(E, valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const v = Q(valor);
  const inside = ge(v, E.lo) && le(v, E.hi);
  return { valor: toStr(v), verdict: inside ? 'COMPATÍVEL' : 'INCOMPATÍVEL', lado: inside ? null : lt(v, E.lo) ? 'abaixo' : 'acima' };
}

/* ---- sensitivity: the width each premise's range contributes, and the price of information ----
   For premise k: collapse its box to its midpoint and re-enclose; the share of the width that
   disappears is the premise's contribution. Then, if a class threshold is straddled: the largest
   symmetric fraction of k's box (around its midpoint) at which the class is DECIDED, found by
   bisection in rationals — "medir k com erro ≤ ±x decide". */
function sensitivity(P, T, classes) {
  const E0 = enclose(P, T), W = widthOf(E0);
  const rows = [];
  for (const k of Object.keys(P)) {
    const mid = div(add(P[k].lo, P[k].hi), TWO);
    const P2 = Object.assign({}, P, { [k]: { lo: mid, hi: mid } });
    const E = enclose(P2, T), W2 = widthOf(E);
    const share = cmp(W, ZERO) === 0 ? ZERO : div(sub(W, W2), W);
    rows.push({ premissa: k, larguraSem: toStr(W2), parcela: toStr(share), parcelaPct: dec(mul(share, R(100n, 1n)), 1) });
  }
  rows.sort((a, b) => cmp(Q(b.parcela), Q(a.parcela)));
  /* the price of information on the dominant premise */
  const cls0 = decideClass(E0, classes);
  let preco = null;
  if (!cls0.decidida && rows.length) {
    const k = rows[0].premissa, lo = P[k].lo, hi = P[k].hi, mid = div(add(lo, hi), TWO), half = div(sub(hi, lo), TWO);
    const decidedAt = (f) => { const r = mul(half, f); const P2 = Object.assign({}, P, { [k]: { lo: sub(mid, r), hi: add(mid, r) } }); return decideClass(enclose(P2, T), classes).decidida !== null; };
    if (decidedAt(ZERO)) {
      let a = ZERO, b = ONE;                     /* decided at a (collapsed), maybe not at b (full box) */
      if (decidedAt(b)) a = b; else for (let i = 0; i < 24; i++) { const m = div(add(a, b), TWO); if (decidedAt(m)) a = m; else b = m; }
      const r = mul(half, a);
      preco = { premissa: k, fracao: toStr(a), fracaoPct: dec(mul(a, R(100n, 1n)), 1), meioIntervalo: toStr(r), meioIntervaloDec: dec(r, 6), emTorno: toStr(mid), emTornoDec: dec(mid, 6), decide: true,
        texto: 'medir ' + k + ' com erro de até ±' + dec(r, 4) + ' em torno de ' + dec(mid, 4) + ' (' + dec(mul(a, R(100n, 1n)), 0) + '% da faixa declarada) decide a classe' };
    } else preco = { premissa: k, decide: false, texto: 'fixar ' + k + ' no centro da faixa não decide a classe sozinho: outra premissa também precisa ser medida' };
  }
  return { largura: toStr(W), linhas: rows, preco };
}

/* ---- deployment: technical vs agreed fraction, per year ---- */
function deploy(E, frac) {
  const lo = Q(frac.lo), hi = Q(frac.hi);
  if (lt(lo, ZERO) || gt(hi, ONE) || gt(lo, hi)) throw new Error('abatimento: a deployment fraction must lie in [0, 1] with lo ≤ hi');
  /* E may be negative at lo: the product's extremes are among the four products */
  const c = [mul(E.lo, lo), mul(E.lo, hi), mul(E.hi, lo), mul(E.hi, hi)];
  let a = c[0], b = c[0]; for (const x of c) { a = qmin(a, x); b = qmax(b, x); }
  return { lo: a, hi: b };
}

/* ---- aggregation with the double-counting audit ---- */
function aggregate(scenarios, fontes) {
  /* scenarios: [{ id, fonte, exclusivo_com:[], E }] ; fontes: { id: { lo, hi } } (annual emissions of each source) */
  const problems = [], bySource = {};
  let lo = ZERO, hi = ZERO;
  for (const s of scenarios) {
    lo = add(lo, s.E.lo); hi = add(hi, s.E.hi);
    (bySource[s.fonte] = bySource[s.fonte] || []).push(s);
  }
  for (const s of scenarios) for (const x of (s.exclusivo_com || [])) if (scenarios.some((o) => o.id === x)) problems.push({ tipo: 'dupla contagem', ids: [s.id, x].sort(), texto: s.id + ' e ' + x + ' atuam sobre a mesma fonte e são declarados mutuamente exclusivos: a soma conta o mesmo abatimento duas vezes' });
  const porFonte = [];
  for (const [f, list] of Object.entries(bySource)) {
    let a = ZERO, b = ZERO; for (const s of list) { a = add(a, s.E.lo); b = add(b, s.E.hi); }
    const src = fontes && fontes[f] ? { lo: Q(fontes[f].lo), hi: Q(fontes[f].hi) } : null;
    let verdict = 'NÃO AVALIADO', texto = 'a fonte não declara a sua emissão anual';
    if (src) {
      if (gt(a, src.hi)) { verdict = 'REFUTADO'; texto = 'a soma dos abatimentos (≥ ' + dec(a, 0) + ') excede a emissão da fonte (≤ ' + dec(src.hi, 0) + ') em todo o envelope'; }
      else if (gt(b, src.hi)) { verdict = 'RECUSADO'; texto = 'a soma pode chegar a ' + dec(b, 0) + ', acima da emissão máxima da fonte (' + dec(src.hi, 0) + '): há pontos do envelope que abatem mais do que a fonte emite'; }
      else { verdict = 'PROVADO'; texto = 'a soma (≤ ' + dec(b, 0) + ') cabe na emissão da fonte (≥ ' + dec(src.lo, 0) + ') em todo o envelope'; }
    }
    porFonte.push({ fonte: f, ids: list.map((s) => s.id), lo: toStr(a), hi: toStr(b), verdict, texto });
  }
  const dup = problems.filter((p) => p.tipo === 'dupla contagem');
  const uniq = []; for (const p of dup) if (!uniq.some((u) => u.ids.join() === p.ids.join())) uniq.push(p);
  const verdict = uniq.length ? 'RECUSADO' : porFonte.some((p) => p.verdict === 'REFUTADO') ? 'REFUTADO' : porFonte.some((p) => p.verdict === 'RECUSADO') ? 'RECUSADO' : 'PROVADO';
  return { lo: toStr(lo), hi: toStr(hi), loDec: dec(lo, 0), hiDec: dec(hi, 0), verdict, duplaContagem: uniq, porFonte };
}

/* ---- the diff between two versions of a scenario ---- */
function diff(c1, c2, classes) {
  const s1 = readScenario(c1), s2 = readScenario(c2);
  const E1 = enclose(s1.P, s1.T), E2 = enclose(s2.P, s2.T);
  const premissas = [];
  for (const k of new Set([...Object.keys(s1.P), ...Object.keys(s2.P)])) {
    const a = s1.P[k], b = s2.P[k];
    if (!a) premissas.push({ premissa: k, mudanca: 'acrescentada', depois: [toStr(b.lo), toStr(b.hi)] });
    else if (!b) premissas.push({ premissa: k, mudanca: 'removida', antes: [toStr(a.lo), toStr(a.hi)] });
    else if (cmp(a.lo, b.lo) !== 0 || cmp(a.hi, b.hi) !== 0) premissas.push({ premissa: k, mudanca: (ge(b.lo, a.lo) && le(b.hi, a.hi)) ? 'estreitada' : (le(b.lo, a.lo) && ge(b.hi, a.hi)) ? 'alargada' : 'deslocada', antes: [toStr(a.lo), toStr(a.hi)], depois: [toStr(b.lo), toStr(b.hi)] });
  }
  const termos = JSON.stringify(c1.termos) !== JSON.stringify(c2.termos);
  const k1 = decideClass(E1, classes), k2 = decideClass(E2, classes);
  return { de: c1.versao, para: c2.versao, premissas, termosMudaram: termos,
    envelope: { antes: [toStr(E1.lo), toStr(E1.hi)], depois: [toStr(E2.lo), toStr(E2.hi)], larguraAntes: toStr(widthOf(E1)), larguraDepois: toStr(widthOf(E2)) },
    classe: { antes: k1.decidida, depois: k2.decidida, mudou: k1.decidida !== k2.decidida } };
}

/* ---- the receipt of one scenario version ---- */
function decide(c, classes) {
  const { P, T } = readScenario(c);
  const E = enclose(P, T);
  const cls = decideClass(E, classes);
  const claim = c.afirmacao ? decideClaim(E, c.afirmacao.valor) : null;
  const sens = sensitivity(P, T, classes);
  const plo = cornerPoint(P, E.wlo), phi = cornerPoint(P, E.whi);
  const porEscopo = {};
  for (const t of T) { const e = t.escopo + (t.tipo === 'acv' ? '·ACV' : ''); porEscopo[e] = porEscopo[e] || { lo: ZERO, hi: ZERO }; }
  /* per-scope enclosure: each scope's own multilinear sub-form, enclosed exactly */
  for (const e of Object.keys(porEscopo)) {
    const Te = T.filter((t) => (t.escopo + (t.tipo === 'acv' ? '·ACV' : '')) === e);
    const Pe = {}; for (const t of Te) for (const v of t.vars) Pe[v] = P[v];
    const Ee = enclose(Pe, Te); porEscopo[e] = { lo: toStr(Ee.lo), hi: toStr(Ee.hi), loDec: dec(Ee.lo, 0), hiDec: dec(Ee.hi, 0) };
  }
  const implantacao = {};
  if (c.implantacao) for (const [nome, frac] of Object.entries(c.implantacao)) { const D = deploy(E, frac); implantacao[nome] = { fracao: [toStr(Q(frac.lo)), toStr(Q(frac.hi))], lo: toStr(D.lo), hi: toStr(D.hi), loDec: dec(D.lo, 0), hiDec: dec(D.hi, 0) }; }
  /* the verdict word of the receipt: the class question, which is what the MACC asks */
  const verdict = cls.decidida ? 'PROVADO' : (cls.porClasse.every((x) => x.verdict === 'REFUTADO') ? 'REFUTADO' : 'RECUSADO');
  return {
    id: c.id, versao: c.versao, titulo: c.titulo, categoria: c.categoria, fonte: c.fonte_emissora,
    enclosure: [toStr(E.lo), toStr(E.hi)], enclosureDec: [dec(E.lo, 0), dec(E.hi, 0)], largura: toStr(widthOf(E)),
    testemunhas: { lo: { canto: E.wlo, ponto: Object.fromEntries(Object.entries(plo).map(([k, v]) => [k, toStr(v)])), termos: termsAt(T, plo) }, hi: { canto: E.whi, ponto: Object.fromEntries(Object.entries(phi).map(([k, v]) => [k, toStr(v)])), termos: termsAt(T, phi) } },
    cantos: E.evals, premissas: E.n,
    classe: cls, verdict, afirmacao: claim ? Object.assign({ classeAfirmada: c.afirmacao.classe || null }, claim) : null,
    porEscopo, implantacao, sensibilidade: sens,
    formula: T.map((t) => (t.sinal < 0n ? '− ' : '+ ') + (cmp(t.fator, ONE) === 0 ? '' : dec(t.fator, 6) + ' × ') + t.vars.join(' × ') + '  [escopo ' + t.escopo + (t.tipo === 'acv' ? ', ACV' : '') + ']').join('\n')
  };
}

/* a float "point pipeline": the form at the midpoint of every premise — what a spreadsheet prints */
function pointPipeline(c) {
  const { P, T } = readScenario(c);
  const mid = {}; for (const k of Object.keys(P)) mid[k] = (Number(toStr(P[k].lo).split('/').reduce((a, b) => a / b)) + Number(toStr(P[k].hi).split('/').reduce((a, b) => a / b))) / 2;
  let s = 0; for (const t of T) { let p = Number(toStr(t.fator).split('/').reduce((a, b) => a / b)); for (const v of t.vars) p *= mid[v]; s += (t.sinal < 0n ? -1 : 1) * p; }
  return s;
}

module.exports = { Q, dec, toStr, readScenario, enclose, evalAt, decideClass, decideClaim, sensitivity, deploy, aggregate, diff, decide, pointPipeline, cornerPoint };
