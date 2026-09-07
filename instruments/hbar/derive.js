/* derive.js — the effective Hamiltonian band and the paper's numbers, derived live.
   instruments/hbar · cert-machine · 2026-09-07 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require(path.join(__dirname, 'exact.js'));
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const { iv } = I;

const K_SWEEP = 1024, K_TABLE = 8192, K_P0 = 4096;
const PS = [0, 0.25, 0.5, 0.75, 1, 1.1, 1.2, 1.25, 1.27, 4 / Math.PI, 1.275, 1.28, 1.29, 1.3, 1.35, 1.4, 1.5, 1.75, 2, 2.25, 2.5, 3];
/* the paper's numbers (arXiv:1810.03483v2, §6): Table 1, the Gomes–Oberman value it cites, Table 2 */
const PRINTED = {
  table1: { P: [1.5, 2.5], potential: 'cos 2πx₁ + cos 2πx₂ (separable)', cited: 4.4099660, citedFrom: 'Gomes–Oberman, SIAM J. Control Optim. 43 (2004), as quoted on p. 20',
    k: [10, 100, 1000, 10000], HRF: [4.40251, 4.40916, 4.40989, 4.40996], NM: [4.40935, 4.40994, 4.40996, 4.40996] },
  table2: { P: 0.5, potential: '−sin 2πx', k: 100, N: [15, 30, 60, 120], Hdiamond: [0.964609, 0.964754, 0.96476, 0.96476], exactStated: 1 },
  P0stated: '4/π (p. 17)'
};
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pair = (X) => [X[0], X[1]];

/* where a printed number sits against an enclosure */
function place(v, X) { return v < X[0] ? 'BELOW' : v > X[1] ? 'ABOVE' : 'INSIDE'; }

function derive() {
  /* P₀ for the three potentials, against 4/π */
  const p0 = {};
  for (const k of Object.keys(E.POTS)) { const p = E.P0(E.POTS[k], K_P0); p0[k] = { value: pair(p.value), width: p.width, contains4overPi: I.contains(p.value, 4 / Math.PI) }; }
  /* the band for V = sin 2πx */
  const band = PS.map(P => { const h = E.hbar(P, E.POTS.sin, { K: K_SWEEP }); return { P, regime: h.regime, value: h.value ? pair(h.value) : null, width: h.width === undefined ? null : h.width, stalled: !!h.stalled, tightened: !!h.tightened, it: h.it === undefined ? null : h.it, qWidth: h.qWidth === undefined ? null : h.qWidth, why: h.why || null, mather: h.mather || null }; });
  /* Table 1 re-decided: c(1.5) + c(2.5) for cos */
  const c15 = E.hbar(1.5, E.POTS.cos, { K: K_TABLE }), c25 = E.hbar(2.5, E.POTS.cos, { K: K_TABLE });
  const sum = [c15.value[0] + c25.value[0], I.nextUp(c15.value[1] + c25.value[1])];
  const table1 = { c15: pair(c15.value), c25: pair(c25.value), sum, width: sum[1] - sum[0],
    cited: PRINTED.table1.cited, citedPlace: place(PRINTED.table1.cited, sum), citedGap: PRINTED.table1.cited - sum[1],
    HRF: PRINTED.table1.HRF.map(v => ({ v, place: place(v, sum) })), NM: PRINTED.table1.NM.map(v => ({ v, place: place(v, sum) })) };
  /* Table 2: P = 0.5 on the flat part of −sin: exactly 1 */
  const h05 = E.hbar(0.5, E.POTS.msin, { K: K_SWEEP });
  const table2 = { regime: h05.regime, value: h05.value ? pair(h05.value) : null, Hdiamond: PRINTED.table2.Hdiamond.map(v => ({ v, gap: 1 - v, place: h05.value ? place(v, h05.value) : null })) };
  /* the Mather density at two rotating P for sin */
  const xs = Array.from({ length: 65 }, (_, j) => j / 64);
  const mather = [1.5, 2].map(P => { const h = band.find(b => b.P === P); const md = E.matherDensity(iv(h.value[0], h.value[1]), E.POTS.sin, xs, 2048); return md.ok ? { P, T: pair(md.T), density: md.density, xs } : { P, refused: md.why }; });
  /* the degeneracy: how the band's width grows toward P₀ */
  const rotating = band.filter(b => b.regime === 'ROTATING');
  const counts = { flat: band.filter(b => b.regime === 'FLAT').length, rotating: rotating.length, undecided: band.filter(b => b.regime === 'UNDECIDED').length, refused: band.filter(b => b.regime === 'REFUSED').length };
  const widest = rotating.reduce((m, b) => (b.width > m.width ? b : m), rotating[0]);
  return { PS, K: { sweep: K_SWEEP, table: K_TABLE, P0: K_P0 }, printed: PRINTED, p0, band, table1, table2, mather, counts, widest: { P: widest.P, width: widest.width } };
}

module.exports = { derive, PS, PRINTED, sha, place };
