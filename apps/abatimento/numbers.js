/* numbers.js — every number the Abatimento page, deck, Registro de cálculo and
   Proposta display, read from the records that decided it. ONE module for all
   consumers (the corpus.js lesson). A record that no longer says what a sentence
   needs makes this module throw, and the build refuses.
   apps/abatimento · cert-machine                                            MIT */
'use strict';
const need = (c, m) => { if (!c) throw new Error('abatimento numbers: ' + m); };
const toF = (s) => { const [n, d] = String(s).split('/'); return Number(n) / (d ? Number(d) : 1); };

function load(ledger, D) {
  const N = { D, ledger };
  const R = Object.fromEntries(ledger.receipts.map((x) => [x.id + '@' + x.versao, x.receipt]));
  N.r = (id, v) => { const r = R[id + '@' + (v || Math.max(...ledger.receipts.filter((x) => x.id === id).map((x) => x.versao)))]; need(r, 'no receipt ' + id); return r; };
  N.c = (id, v) => { const c = D.cenarios.find((x) => x.id === id && (v ? x.versao === v : true)); need(c, 'no scenario ' + id); return v ? c : D.cenarios.filter((x) => x.id === id).sort((a, b) => b.versao - a.versao)[0]; };

  /* the demonstrator's own counts */
  N.versoes = ledger.receipts.length;
  N.cenarios = new Set(ledger.receipts.map((x) => x.id)).size;
  N.fontes = Object.keys(D.fontes_emissoras).length;
  N.battery = ledger.battery;
  need(N.battery.fired === N.battery.reds && N.battery.fail === 0, 'the battery is not green in the record');
  N.aggs = ledger.aggregations;
  N.dup = N.aggs.filter((a) => a.result.verdict === 'RECUSADO').length;

  /* the lead case: TBG v1 -> v2 */
  const v1 = N.r('tbg-ecomp', 1), v2 = N.r('tbg-ecomp', 2);
  need(v1.verdict === 'RECUSADO' && v2.verdict === 'PROVADO' && v2.classe.decidida === 'Moderado', 'the TBG story changed');
  N.tbg = { v1, v2, diff: ledger.diffs[0], mid: ledger.pointPipeline['tbg-ecomp@1'], claim: 142000,
    lo1: toF(v1.enclosure[0]), hi1: toF(v1.enclosure[1]), lo2: toF(v2.enclosure[0]), hi2: toF(v2.enclosure[1]),
    dom: v1.sensibilidade.linhas[0], preco: v1.sensibilidade.preco };
  need(N.tbg.mid >= 100000 && N.tbg.mid < 1000000, 'the point pipeline no longer lands in Moderado on v1');
  need(N.tbg.lo1 < 100000 && N.tbg.hi1 >= 100000, 'v1 no longer straddles 100 mil');

  /* the CCUS pair: same source, mutually exclusive */
  N.ccus = { amina: N.r('ccus-amina-fpso'), oxi: N.r('oxicombustao-fpso'), both: N.aggs.find((a) => a.id === 'fpso-x-ambos'), ok: N.aggs.find((a) => a.id === 'fpso-x-correto') };
  need(N.ccus.both.result.verdict === 'RECUSADO' && N.ccus.ok.result.verdict === 'PROVADO', 'the CCUS aggregation story changed');
  need(N.ccus.amina.classe.porClasse.find((x) => x.classe === 'Alto').verdict === 'REFUTADO', 'Alto is no longer refuted for the single unit');
  N.esc2 = N.aggs.find((a) => a.id === 'escopo2-duplo'); need(N.esc2.result.verdict === 'RECUSADO', 'the scope-2 double count is no longer refused');
  N.irec = N.r('irec-2025'); need(N.irec.verdict === 'RECUSADO', 'the I-REC factor story changed');
  N.portfolio = N.aggs.find((a) => a.id === 'portfolio'); need(N.portfolio.result.verdict === 'PROVADO', 'the clean portfolio sum is not PROVADO');

  /* Petrobras's own numbers, as quoted from the pinned Caderno (corpus/sources/petrobras-caderno-clima-2025.json) */
  N.pb = {
    macc: 1000, fundoUSD: '1,0 bilhão', fundoOpp: 35, fundoCommitted: 'US$ 540 milhões', fundoMt: '1,5 milhão',
    emis2025: 50, cut2015: 36, og2025: 47, intensEP: '14,7', presal: 10, irecT: 183000, irecMWh: 3940000,
    flareRotina: 8, tbgClaim: 142000, bogClaim: 77000, target2030: 30, pn: 'US$ 13 bilhões',
    classes: 'Incremental 0–100 mil · Moderado 100 mil–1 milhão · Alto > 1 milhão tCO2e/ano'
  };
  N.pb.irecFactor = (N.pb.irecT / N.pb.irecMWh).toFixed(4).replace('.', ',');

  N.br = {
    int: (x) => Math.round(typeof x === 'number' ? x : toF(x)).toLocaleString('pt-BR'),
    dec: (x, d) => (typeof x === 'number' ? x : toF(x)).toFixed(d).replace('.', ','),
    mil: (x) => { const v = typeof x === 'number' ? x : toF(x); return Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(2).replace('.', ',') + ' milhão' : Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil'; }
  };
  return N;
}
module.exports = { load };
