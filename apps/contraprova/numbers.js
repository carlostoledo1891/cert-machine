/* numbers.js — every number the Contraprova page and deck display, read from
   the records that decided it. ONE module for both consumers: a figure the
   page states and the deck restates is read here once, or the two WILL
   diverge (the corpus.js lesson). A record that no longer says what a
   sentence needs makes this module throw, and the build refuses.
   apps/contraprova · cert-machine                                        MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const need = (c, m) => { if (!c) throw new Error('contraprova numbers: ' + m); };

function load(gateLedger) {
  const N = {};

  /* ---- the return-level atlas: every open-sea cell of the public hindcast ---- */
  const A = J('certs/hseva-atlas.json');
  let fits = 0, certified = 0, ggLimit = 0, blocks = 0, gevCert = 0;
  for (const cell of A.cells) for (const b of Object.values(cell.blocks)) {
    blocks++;
    for (const f of Object.values(b.fits)) { fits++; if (f.c === 1) certified++; else if (f.e !== undefined) ggLimit++; }
    if (b.gev && b.gev.c === 1) gevCert++;
  }
  N.atlas = { cells: A.cells.length, blocks, fits, certified, ggLimit, refused: fits - certified, gevCert, families: A.families.length, generated: A.generated };
  need(N.atlas.cells > 2000 && N.atlas.certified > 40000, 'the atlas lost its cells');

  /* ---- the same software, the same data, two calls (scipy, recorded as printed) ---- */
  const L = J('certs/hseva-ledger.json');
  const tally = { floc0: {}, default: {} };
  for (const bb of Object.values(L.scipy.buoys)) for (const fams of Object.values(bb)) for (const modes of Object.values(fams))
    for (const [mode, r] of Object.entries(modes)) tally[mode][r.verdict] = (tally[mode][r.verdict] || 0) + 1;
  const tot = (m) => Object.values(tally[m]).reduce((a, b) => a + b, 0);
  const ew = L.scipy.buoys.A.native.expweibull;
  need(ew.floc0.verdict === 'AGREES' && ew.default.verdict === 'BELOW_A_MEMBER', 'the buoy-A exponentiated-Weibull pair changed');
  N.scipy = {
    version: L.scipy.scipy, n: L.buoys.A.n,
    fixed: { agree: tally.floc0.AGREES || 0, of: tot('floc0') },
    free: { agree: tally.default.AGREES || 0, of: tot('default'), undecidable: tally.default.NOT_DECIDED || 0, below: tally.default.BELOW_A_MEMBER || 0, outside: tally.default.OUTSIDE_SUPPORT || 0 },
    ew: { fixed: Number(ew.floc0.level100), free: Number(ew.default.level100), deficit: Math.round(Number(ew.default.deficit)) }
  };
  need(N.scipy.free.agree === 0, 'a location-free scipy fit now agrees — the sentence "none of them" is false');

  /* ---- a published design table, decided against the public record ---- */
  const T = J('certs/design-table-audit.json');
  const lev = T.summary.levels;
  N.table = {
    decided: T.summary.decided, off: T.summary.verdicts['OFF THE MAXIMUM'] || 0, outsideSupport: T.summary.verdicts['OUTSIDE ITS SUPPORT'] || 0,
    outside95: lev.filter((x) => x.outside).length, dMin: Math.min(...lev.map((x) => x.d)), dMax: Math.max(...lev.map((x) => x.d)),
    areas: T.rows.length, kmMin: Math.min(...T.rows.map((r) => r.cells[0].km)), kmMax: Math.max(...T.rows.map((r) => r.cells[0].km)),
    rows: lev.map((x) => { const r = T.rows.find((q) => q.la === x.la); return { k: r.name + ' · ' + x.method.replace('gumbel', 'Gumbel ').replace('gev', 'GEV ').replace('LS', 'MQ').replace('MOM', 'MM').replace('ML', 'MV'), printed: x.printed, decided: x.certified, d: x.d }; }),
    cite: 'Bhaskaran et al., Energies 16, 6935 (2023)'
  };
  need(N.table.decided === 20, 'the design table no longer has 20 decided rows');

  /* ---- published AI mathematics, decided (the claims register) ---- */
  const C = J('certs/claims-ledger.json');
  const row = (id) => { const r = C.rows.find((x) => x.id === id); need(r, 'register row ' + id + ' missing'); return r; };
  const cx = C.rows.filter((r) => r.id.startsWith('countex-'));
  N.ai = {
    decided: C.rows.filter((r) => r.verdict !== 'QUEUED').length,
    horizon: row('horizonmath-ramsey-asymptotic').verdict,
    gnnw: row('gnnw-gai-3782').verdict,
    countex: { of: cx.length, certified: cx.filter((r) => r.verdict === 'CERTIFIED').length, partial: cx.filter((r) => r.verdict === 'PARTIAL').length, refuted: cx.filter((r) => r.verdict === 'REFUTED').length }
  };
  need(N.ai.horizon === 'REFUTED' && N.ai.gnnw === 'CERTIFIED', 'the two headline AI audits changed verdict');

  /* ---- the gate: its receipts and its battery ---- */
  if (gateLedger) {
    N.gate = gateLedger;
    const by = (id) => gateLedger.receipts.find((r) => r.id === id);
    N.gate.lead = by('ia-mais-4-2'); N.gate.fixed = by('ia-ajustada');
    need(N.gate.lead.receipt.verdict === 'RECUSADO' && N.gate.fixed.receipt.verdict === 'PROVADO', 'the lead pair changed verdict');
    N.gate.counts = { PROVADO: 0, REFUTADO: 0, RECUSADO: 0 };
    for (const r of gateLedger.receipts) N.gate.counts[r.receipt.verdict]++;
    const faults = gateLedger.scenarios.cases.filter((c) => c.kind === 'falha');
    N.gate.faults = { of: faults.length, caught: faults.filter((c) => by(c.id).receipt.verdict !== 'PROVADO').length };
    need(N.gate.faults.caught === N.gate.faults.of, 'an injected fault got through the gate');
  }
  return N;
}

/* Brazilian number words, once */
const br = {
  int: (x) => Math.round(x).toLocaleString('pt-BR'),
  dec: (x, d) => Number(x).toFixed(d).replace('.', ','),
  sgn: (x, d) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d).replace('.', ',')
};

module.exports = { load, br };
