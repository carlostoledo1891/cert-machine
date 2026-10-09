/* battery.js — the Registro de Abatimento kernel's battery. apps/abatimento · cert-machine

   GREEN: every scenario version decides as its record states; the enclosure of every
   version equals, character for character, the one reference.py (Python fractions,
   no shared code) computes; the two witness corners re-evaluate exactly to the
   enclosure's ends; 300 random interior points per scenario fall inside the enclosure;
   the aggregations decide as stated (the double-counting cases RECUSADO, the clean ones
   PROVADO); the v1 -> v2 diff names exactly one narrowed premise; the price of
   information on v1 names the dominant premise and, applied, decides the class.
   RED: forgeries that must be refused — a premise with lo > hi, a negative premise, a
   premise used twice in one term, a deployment fraction above 1, a point claim one unit
   outside the enclosure, a class threshold placed one unit inside the enclosure (a point
   pipeline would call it decided), two mutually exclusive scenarios summed, a sum that
   abates more than its source emits, and a float midpoint pipeline that prints a class the
   envelope does not support.

   usage: node apps/abatimento/engine/battery.js                                    MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const A = require('./abatimento.js');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cenarios.json'), 'utf8'));

let pass = 0, fail = 0, reds = 0, fired = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL: ' + m); } };
const red = (fn, m) => { reds++; try { fn(); console.error('RED NOT FIRED: ' + m); } catch (e) { fired++; } };
const byId = (ref) => { const [id, v] = String(ref).split('@'); return D.cenarios.find((c) => c.id === id && (v === undefined ? true : String(c.versao) === v)) || D.cenarios.filter((c) => c.id === id).sort((a, b) => b.versao - a.versao)[0]; };
const toF = (s) => { const [n, d] = String(s).split('/'); return Number(n) / (d ? Number(d) : 1); };

/* 1. every version decides as its record states */
const receipts = D.cenarios.map((c) => ({ c, r: A.decide(c, D.classes) }));
for (const { c, r } of receipts) {
  const e = c.espera || {};
  ok(r.verdict === e.verdict, c.id + '@' + c.versao + ' decided ' + r.verdict + ', expected ' + e.verdict);
  if (e.classe) ok(r.classe.decidida === e.classe, c.id + '@' + c.versao + ' class ' + r.classe.decidida + ', expected ' + e.classe);
  if (e.afirmacao) ok(r.afirmacao && r.afirmacao.verdict === e.afirmacao, c.id + '@' + c.versao + ' claim ' + (r.afirmacao && r.afirmacao.verdict));
  if (e.dominante) ok(r.sensibilidade.linhas[0].premissa === e.dominante, c.id + '@' + c.versao + ' dominant premise ' + r.sensibilidade.linhas[0].premissa + ', expected ' + e.dominante);
  if (e.classeAfirmadaRefutada) { const row = r.classe.porClasse.find((x) => x.classe === c.afirmacao.classe); ok(row && row.verdict === 'REFUTADO', c.id + ' claimed class ' + c.afirmacao.classe + ' should be REFUTADO for this unit'); }
}

/* 2. the second implementation agrees exactly */
let ref = null;
try { ref = JSON.parse(cp.execFileSync('python3', [path.join(__dirname, 'reference.py')], { encoding: 'utf8' })); } catch (e) { ok(false, 'reference.py did not run: ' + (e.stderr || e.message)); }
let agree = 0;
if (ref) for (const { c, r } of receipts) {
  const q = ref.find((x) => x.id === c.id && x.versao === c.versao);
  const same = q && q.lo === r.enclosure[0] && q.hi === r.enclosure[1] && q.decidida === r.classe.decidida
    && q.classes.every(([nome, v]) => r.classe.porClasse.find((x) => x.classe === nome).verdict === v)
    && ((q.afirmacao === null && (r.afirmacao === null || r.afirmacao === undefined)) || (r.afirmacao && q.afirmacao === r.afirmacao.verdict));
  ok(same, c.id + '@' + c.versao + ': reference disagrees ' + JSON.stringify(q) + ' vs ' + JSON.stringify([r.enclosure, r.classe.decidida]));
  if (same) agree++;
}

/* 3. witnesses re-evaluate to the ends; random interior points fall inside */
let interior = 0;
for (const { c, r } of receipts) {
  const { P, T } = A.readScenario(c);
  const vlo = A.evalAt(T, A.cornerPoint(P, r.testemunhas.lo.canto)), vhi = A.evalAt(T, A.cornerPoint(P, r.testemunhas.hi.canto));
  ok(A.toStr(vlo) === r.enclosure[0] && A.toStr(vhi) === r.enclosure[1], c.id + '@' + c.versao + ' witnesses do not re-evaluate to the enclosure');
  let seed = 20261008 + c.versao; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const lo = toF(r.enclosure[0]), hi = toF(r.enclosure[1]);
  for (let i = 0; i < 300; i++) {
    const pt = {}; for (const k of Object.keys(P)) { const a = toF(A.toStr(P[k].lo)), b = toF(A.toStr(P[k].hi)); pt[k] = a + (b - a) * rnd(); }
    let s = 0; for (const t of T) { let p = toF(A.toStr(t.fator)); for (const v of t.vars) p *= pt[v]; s += (t.sinal < 0n ? -1 : 1) * p; }
    if (s >= lo - 1e-6 * Math.abs(lo) - 1e-9 && s <= hi + 1e-6 * Math.abs(hi) + 1e-9) interior++; else ok(false, c.id + ' interior point ' + s + ' outside [' + lo + ', ' + hi + ']');
  }
}

/* 4. aggregations */
const E = (ref_) => { const c = byId(ref_); const { P, T } = A.readScenario(c); const e = A.enclose(P, T); return { id: c.id, fonte: c.fonte_emissora, exclusivo_com: c.exclusivo_com, E: { lo: e.lo, hi: e.hi } }; };
const fontes = Object.fromEntries(Object.entries(D.fontes_emissoras).map(([k, v]) => [k, v.emissao]));
for (const g of D.agregacoes) {
  const agg = A.aggregate(g.cenarios.map(E), fontes);
  ok(agg.verdict === g.espera, 'aggregation ' + g.id + ' decided ' + agg.verdict + ', expected ' + g.espera);
  /* the sum is the sum */
  let lo = 0, hi = 0; for (const x of g.cenarios.map(E)) { lo += toF(A.toStr(x.E.lo)); hi += toF(A.toStr(x.E.hi)); }
  ok(Math.abs(toF(agg.lo) - lo) < 1e-6 && Math.abs(toF(agg.hi) - hi) < 1e-6, 'aggregation ' + g.id + ' sum mismatch');
}

/* 5. the diff v1 -> v2 of tbg-ecomp names exactly one narrowed premise, gas_tj, and the class flips to decided */
const d = A.diff(byId('tbg-ecomp@1'), byId('tbg-ecomp@2'), D.classes);
ok(d.premissas.length === 1 && d.premissas[0].premissa === 'gas_tj' && d.premissas[0].mudanca === 'estreitada', 'diff v1->v2: ' + JSON.stringify(d.premissas));
ok(d.classe.antes === null && d.classe.depois === 'Moderado' && d.classe.mudou && !d.termosMudaram, 'diff v1->v2 class flip: ' + JSON.stringify(d.classe));

/* 6. the price of information on v1: the dominant premise, narrowed as prescribed, decides the class */
{
  const c = byId('tbg-ecomp@1'), r = A.decide(c, D.classes), p = r.sensibilidade.preco;
  ok(p && p.decide && p.premissa === 'gas_tj', 'price of information should name gas_tj: ' + JSON.stringify(p));
  if (p && p.decide) {
    const c2 = JSON.parse(JSON.stringify(c));
    const mid = A.Q(p.emTorno), half = A.Q(p.meioIntervalo);
    const RAT = require(path.join(__dirname, '..', '..', '..', 'instruments', 'interval', 'rational.js'));
    c2.premissas.gas_tj.lo = A.toStr(RAT.sub(mid, half)); c2.premissas.gas_tj.hi = A.toStr(RAT.add(mid, half));
    const r2 = A.decide(c2, D.classes);
    ok(r2.classe.decidida !== null, 'applying the prescribed measurement did not decide the class');
    /* and a little wider does not */
    const c3 = JSON.parse(JSON.stringify(c)); const w = RAT.mul(half, RAT.R(1001n, 1000n));
    c3.premissas.gas_tj.lo = A.toStr(RAT.sub(mid, w)); c3.premissas.gas_tj.hi = A.toStr(RAT.add(mid, w));
    const r3 = A.decide(c3, D.classes);
    ok(r3.classe.decidida === null, 'the prescribed width is not maximal: 0.1% wider still decides');
  }
}

/* 7. per-scope enclosures sum to the whole (exact) */
for (const { c, r } of receipts) {
  const RAT = require(path.join(__dirname, '..', '..', '..', 'instruments', 'interval', 'rational.js'));
  let lo = RAT.R(0n, 1n), hi = RAT.R(0n, 1n);
  for (const e of Object.values(r.porEscopo)) { lo = RAT.add(lo, A.Q(e.lo)); hi = RAT.add(hi, A.Q(e.hi)); }
  /* with disjoint premise sets per scope the sum of per-scope enclosures IS the enclosure; with shared premises it is an outer bound */
  ok(RAT.cmp(lo, A.Q(r.enclosure[0])) <= 0 && RAT.cmp(hi, A.Q(r.enclosure[1])) >= 0, c.id + '@' + c.versao + ' per-scope enclosures do not cover the whole');
}

/* REDS */
const base = () => JSON.parse(JSON.stringify(byId('gnl-boiloff')));
red(() => { const c = base(); c.premissas.bog_tj.lo = '1700'; A.decide(c, D.classes); }, 'lo > hi accepted');
red(() => { const c = base(); c.premissas.relq_mwh.lo = '-1'; A.decide(c, D.classes); }, 'negative premise accepted');
red(() => { const c = base(); c.termos[0].vars = ['bog_tj', 'bog_tj']; A.decide(c, D.classes); }, 'a premise used twice in one term accepted (not multilinear)');
red(() => { const c = base(); c.implantacao = { x: { lo: '0.5', hi: '1.2' } }; A.decide(c, D.classes); }, 'deployment fraction above 1 accepted');
red(() => { const c = base(); const r = A.decide(c, D.classes); const RAT = require(path.join(__dirname, '..', '..', '..', 'instruments', 'interval', 'rational.js')); const outside = RAT.add(A.Q(r.enclosure[1]), RAT.R(1n, 1n)); c.afirmacao.valor = A.toStr(outside); if (A.decide(c, D.classes).afirmacao.verdict !== 'INCOMPATÍVEL') return; throw new Error('fired'); }, 'a claim one unit above the enclosure read as compatible');
red(() => { const c = base(); const r = A.decide(c, D.classes); const RAT = require(path.join(__dirname, '..', '..', '..', 'instruments', 'interval', 'rational.js')); const t = RAT.add(A.Q(r.enclosure[0]), RAT.R(1n, 1n)); const cls = { Baixo: ['0', A.toStr(t)], Resto: [A.toStr(t), null] }; const k = A.decide(c, cls); if (k.classe.decidida === null) throw new Error('fired'); }, 'a threshold one unit inside the enclosure left the class decided');
red(() => { const agg = A.aggregate(['ccus-amina-fpso', 'oxicombustao-fpso'].map(E), fontes); if (agg.verdict === 'RECUSADO' && agg.duplaContagem.length === 1) throw new Error('fired'); }, 'two mutually exclusive scenarios summed without a refusal');
red(() => { const big = E('ccus-amina-fpso'); const RAT = require(path.join(__dirname, '..', '..', '..', 'instruments', 'interval', 'rational.js')); const x = { id: 'forjado', fonte: 'fpso-x-turbinas', exclusivo_com: [], E: { lo: RAT.mul(big.E.hi, RAT.R(2n, 1n)), hi: RAT.mul(big.E.hi, RAT.R(3n, 1n)) } }; const agg = A.aggregate([big, x], fontes); if (agg.verdict === 'REFUTADO') throw new Error('fired'); }, 'a sum abating more than the source emits was not refuted');
red(() => { const c = byId('tbg-ecomp@1'); const mid = A.pointPipeline(c); const r = A.decide(c, D.classes); const inModerado = mid >= 100000 && mid < 1000000; if (inModerado && r.classe.decidida === null) throw new Error('fired'); }, 'the float midpoint pipeline and the envelope agree on tbg-ecomp v1 (the demonstration needs them to disagree)');

console.log('abatimento battery: ' + pass + ' pass, ' + fail + ' fail, ' + fired + '/' + reds + ' red controls fired; reference agreement at ' + agree + ' versions; ' + interior + ' interior points inside');
process.exit(fail || fired !== reds ? 1 : 0);
