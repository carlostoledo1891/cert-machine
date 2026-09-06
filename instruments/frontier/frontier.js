/* frontier.js — the concentration frontier of the congestion enclosure, as a
   measurement re-derived from pinned data.

   THE DATA (lifted from the source lab, sha-pinned in PROVENANCE.json):
     corpus/refusal-frontier/sigma-N14.json   six σ ladders over 16 amplitudes A at N = 14,
                                              each point CERTIFIED (Z1, Z2, Y0, r, min m, min w)
                                              or REFUSE with a named mode, plus a bisected bracket
     corpus/refusal-frontier/refine-N.json    three σ × four N (14, 20, 28, 40) fine ladders
                                              near the boundary, G = 1024 held fixed
     corpus/refusal-frontier/arec.json        the N-free ceiling A_rec(σ) — the amplitude where
                                              cMrecip, the one N-independent term of the Z1 tail
                                              bound, reaches 1 — beside A⋆ at each N and the ratio

   THE INSTANCE they were produced on: the discounted Gomes–Mitake congestion
   system with a = ½, V(x, m) = A cos 2πx + γ m, γ = ½, ν = 1.05 — the system
   of reports/mfg-congest.html, whose one published point is re-run at every
   build of that page. The frontier itself took hours and is NOT re-run here.

   WHAT THIS FILE DOES: it re-derives every sentence the page makes from the
   files — patterns, monotonicity, brackets, modes, the rise of A⋆ with N,
   the N-invariance of A_rec, the ratios, the local slopes (floats, labelled)
   — and refuses if any of them fails or if a pin has moved.

   MIT licensed. Part of cert-machine (instruments/frontier). */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'corpus', 'refusal-frontier');
const FILES = ['sigma-N14.json', 'refine-N.json', 'arec.json'];

const sha256File = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

/* the pins: every data file must hash to what PROVENANCE.json recorded at lift time */
function pins() {
  const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'PROVENANCE.json'), 'utf8'));
  const out = {};
  for (const f of FILES) {
    const dst = 'corpus/refusal-frontier/' + f;
    const e = prov.files.find(x => x.dst === dst);
    const local = sha256File(path.join(DIR, f));
    out[f] = { pinned: e ? e.local_sha256 : null, local, ok: !!e && e.local_sha256 === local && !e.patched };
  }
  return out;
}

function load() {
  return {
    sigma: JSON.parse(fs.readFileSync(path.join(DIR, 'sigma-N14.json'), 'utf8')),
    refine: JSON.parse(fs.readFileSync(path.join(DIR, 'refine-N.json'), 'utf8')),
    arec: JSON.parse(fs.readFileSync(path.join(DIR, 'arec.json'), 'utf8'))
  };
}

const pattern = (ladder) => ladder.map(p => (p.status === 'CERTIFIED' ? 'C' : 'R')).join('');
const monotone = (pat) => /^C*R*$/.test(pat);
function bracketOf(entry) {
  const cs = entry.ladder.filter(p => p.status === 'CERTIFIED'), rs = entry.ladder.filter(p => p.status !== 'CERTIFIED');
  return [cs.length ? cs[cs.length - 1].A : null, rs.length ? rs[0].A : null];
}

/* every certified point carries a real certificate; every refusal a name */
function pointOK(p) {
  if (p.status === 'CERTIFIED') return p.Z1 < 1 && p.r > 0 && p.minM > 0 && p.minW > 0;
  return typeof p.mode === 'string' && p.mode.length > 0;
}

function derive() {
  const D = load();
  const P = pins();
  const ladders = D.sigma.map(e => {
    const pat = pattern(e.ladder);
    const gridBracket = bracketOf(e);
    const lastC = e.ladder.filter(p => p.status === 'CERTIFIED').slice(-1)[0];
    const firstR = e.hiPt || e.ladder.filter(p => p.status !== 'CERTIFIED')[0];   /* the bisected first refusal when the file has it */
    return { sigma: e.sigma, N: e.N, grid: e.grid, pattern: pat, monotone: monotone(pat),
      gridBracket, bisected: [e.bracket.lo, e.bracket.hi], bisectRelWidth: e.bracket.relWidth,
      firstMode: firstR ? firstR.mode : null, firstZ1: firstR ? firstR.Z1 : null,
      lastMinM: lastC ? lastC.minM : null, lastMinW: lastC ? lastC.minW : null,
      pointsOK: e.ladder.every(pointOK), certified: pat.split('C').length - 1, refused: pat.split('R').length - 1,
      ladder: e.ladder.map(p => ({ A: p.A, status: p.status, mode: p.mode || null, Z1: p.Z1, minM: p.minM === undefined ? null : p.minM })) };
  });
  const refine = D.refine.map(e => ({ sigma: e.sigma, N: e.N, G: e.G, pattern: e.pattern, monotone: monotone(e.pattern),
    patternAgrees: pattern(e.ladder) === e.pattern, gridBracket: bracketOf(e), bisected: [e.bracket.lo, e.bracket.hi],
    cMrecipLastC: e.ladder.filter(p => p.status === 'CERTIFIED').slice(-1)[0].cMrecip,
    cMrecipFirstR: (e.ladder.filter(p => p.status !== 'CERTIFIED')[0] || {}).cMrecip || null }));
  /* A⋆ rises with N at every σ */
  const bySigma = {};
  for (const r of refine) (bySigma[r.sigma] = bySigma[r.sigma] || []).push(r);
  const rise = Object.keys(bySigma).map(s => {
    const rows = bySigma[s].sort((a, b) => a.N - b.N);
    const lows = rows.map(r => r.bisected[0]);
    return { sigma: +s, N: rows.map(r => r.N), AstarLo: lows, rising: lows.every((v, i) => i === 0 || v > lows[i - 1]),
      movePct: 100 * (lows[lows.length - 1] - lows[0]) / lows[0] };
  });
  /* the ceiling: bit-identical across N per σ; the ratio recomputed */
  const byS = {};
  for (const a of D.arec) (byS[a.sigma] = byS[a.sigma] || []).push(a);
  const ceiling = Object.keys(byS).map(s => {
    const rows = byS[s].sort((a, b) => a.N - b.N);
    const same = rows.every(r => r.Arec[0] === rows[0].Arec[0] && r.Arec[1] === rows[0].Arec[1]);
    /* the stored ratio is A⋆_lo / A_rec_hi — the LOWER bound of A⋆/A_rec over both brackets */
    const ratios = rows.map(r => ({ N: r.N, Astar: r.Astar, ratio: r.ratio, recomputed: r.Astar[0] / r.Arec[1], agrees: Math.abs(r.ratio - r.Astar[0] / r.Arec[1]) < 1e-12 }));
    /* the local slope of the gap 1 − A⋆/A_rec against N, from consecutive pairs: a FLOAT */
    const slopes = [];
    for (let i = 1; i < rows.length; i++) {
      const g0 = 1 - rows[i - 1].ratio, g1 = 1 - rows[i].ratio;
      slopes.push({ N0: rows[i - 1].N, N1: rows[i].N, slope: Math.log(g1 / g0) / Math.log(rows[i].N / rows[i - 1].N) });
    }
    return { sigma: +s, Arec: rows[0].Arec, sameAcrossN: same, ratios, slopes, ratiosRising: ratios.every((r, i) => i === 0 || r.ratio > ratios[i - 1].ratio), allBelowOne: ratios.every(r => r.Astar[1] < rows[0].Arec[0]) };
  });
  return { pins: P, ladders, refine, rise, ceiling,
    instance: { system: 'discounted Gomes–Mitake congestion, a = 1/2', V: 'A cos 2πx + γ m, γ = 0.5', nu: 1.05, rCap: 1e-2, N14grid: D.sigma[0].grid } };
}

function allOK(R) {
  return Object.values(R.pins).every(p => p.ok)
    && R.ladders.every(l => l.monotone && l.pointsOK && l.firstMode === 'Z1_GE_1')
    && R.refine.every(r => r.monotone && r.patternAgrees)
    && R.rise.every(r => r.rising)
    && R.ceiling.every(c => c.sameAcrossN && c.ratios.every(x => x.agrees) && c.ratiosRising && c.allBelowOne);
}

module.exports = { FILES, DIR, sha256File, pins, load, pattern, monotone, bracketOf, pointOK, derive, allOK };
