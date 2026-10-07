/* placar.js — how the Janela ledger's record becomes an admission verdict, ONCE.
   apps/janela/audit · cert-machine

   Read by score.js (the daily print), numbers.js (the method page and the
   app's day, hence the PLACAR) and the battery. A rule defined twice WILL
   diverge.

   WHY NOT ONE ROW = ONE TRIAL (decided 2026-10-06, before the first score
   existed). One satellite overflight scores every row that targets the same
   time at the same site — up to seven leads — and nearby sites share it:
   campos and campos-p25 are 44 km apart, and one SWOT pass crossed campos,
   campos-p25, espirito-santo and potiguar within five minutes on
   2026-10-05. The rows are not independent; the binomial tail of the rows
   would prune a proposer on one bad overflight (two rows missed of two
   already put the 4/5 tail at 1/25, under the bar 1/20).

   THE RULE (admission-v1):
     trial     one per (proposer, UTC day of the target): every scored row of
               the proposer whose target falls on that day belongs to ONE
               trial. observe.py writes days strictly in order, so a day's
               rows are all scored in the same run and a trial never grows
               after it is formed.
     outcome   the covered flag of ONE of those rows, drawn by lot: the rows
               sorted by id, index = sha256(domain + '|' + day) mod n. The lot
               depends on the proposer's name, the day and which rows a
               satellite reached — never on whether any row was covered.
     looks     the exact binomial tail (instruments/forecast/admission.js) is
               read only at m = 30, 60, 120, 240, … trials, the j-th look
               (j = 0, 1, …) against the bar 1/20 · 2^-(j+1). The bars sum to
               1/20: a proposer whose claim is true is pruned with
               probability at most 1/20 over its whole life, not 1/20 per day.
     sticky    the first look whose tail is at or under its bar prunes the
               proposer for good. Admission returns only as a NEW proposer
               version (recalibrated), with its own record from zero.
     before    the first look the proposer is ADMITTED and PENDING: nothing
               has been tested yet, and the page says so.

   STATED, NOT PROVED: the trials are treated as independent across days.
   Weather persists for days, so this is a convention printed with every
   verdict, weaker than a theorem and much stronger than a row count.

   Every scored row stays in the descriptive record (scored, covered); only
   the admission reads the trials.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const crypto = require('crypto');
const A = require('../../../instruments/forecast/admission.js');

const RULE = 'admission-v1 (apps/janela/audit/placar.js)';
const FIRST_LOOK = 30;
const BAR = [1, 20];

/* the rule in the reader's words — the method page and the app print THIS string */
const RULE_PT = 'Um ensaio por dia-alvo: as faixas de um proponente avaliadas para o mesmo dia dividem as mesmas passagens de satélite e não são '
  + 'independentes, então uma só decide o dia, sorteada por sha256(proponente|dia) — o sorteio não olha o resultado. A cauda binomial exata '
  + 'P[X ≤ k], X ~ Binomial(m, reivindicação), só é lida com m = 30, 60, 120, 240… dias, contra 1/40, 1/80, 1/160…: somadas, 1/20 na vida '
  + 'inteira do proponente, não 1/20 por dia. A primeira leitura sob a barra poda esta versão para sempre; só uma versão recalibrada, com '
  + 'registro novo, volta. Dias são tratados como independentes: uma convenção declarada, não um teorema. Cobrir mais do que diz não poda; '
  + 'o escore de Winkler, exato, cobra a faixa larga demais. Regra fixada em 06/10/2026, antes da primeira avaliação.';

/* the proposers in the reader's words — the app's PLACAR and the method page print these */
const NAMES_PT = {
  'janela/hs-altimeter/ens-c40of50': 'Ensemble ECMWF, os 40 centrais de 50',
  'janela/hs-altimeter/calibrated-v1': 'A faixa medida da Janela, v1',
  'janela/hs-altimeter/calibrated-sergipe-v1': 'A faixa medida da Janela, Sergipe-Alagoas, v1',
  'janela/hs-altimeter/noaa-gefs-c25of31': 'Ensemble NOAA (WAVEWATCH III), os 25 centrais de 31',
  'janela/hs-altimeter/calibrated-noaa-v1': 'A faixa medida da NOAA (WAVEWATCH III), v1',
  'janela/hs-altimeter/union-v1': 'A faixa que decide: ECMWF ∪ NOAA, v1',
  'janela/hs-altimeter/calibrated-noaa-sergipe-v1': 'A faixa medida da NOAA, Sergipe-Alagoas, v1',
  'janela/hs-altimeter/union-sergipe-v1': 'A faixa que decide em Sergipe-Alagoas: ECMWF ∪ NOAA, v1'
};

/* the looks reached after m trials: m = 30·2^j, bar = 1/20 · 2^-(j+1) */
function looks(m) {
  const out = [];
  for (let at = FIRST_LOOK, j = 0; at <= m; at *= 2, j++) out.push({ j, m: at, bar: [BAR[0], BAR[1] * 2 ** (j + 1)] });
  return out;
}

/* the lot: which of a day's n rows decides the trial */
function lot(domain, day, n) {
  return crypto.createHash('sha256').update(domain + '|' + day).digest().readUInt32BE(0) % n;
}

/* trials(rows) -> { domain: [{ day, n, id, covered }] } in day order, from ledger rows */
function trials(rows) {
  const commit = {};
  for (const r of rows) if (r.type === 'commit') commit[r.id] = r;
  const g = {};
  for (const r of rows) {
    if (r.type !== 'score') continue;
    const c = commit[r.id];
    if (!c) throw new Error('REFUSED: a score row with no commit: ' + r.id);
    const day = c.targetTime.slice(0, 10);
    const k = c.domain + '|' + day;
    (g[k] = g[k] || { domain: c.domain, day, rows: [] }).rows.push({ id: r.id, covered: !!r.covered });
  }
  const out = {};
  for (const t of Object.values(g)) {
    t.rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const pick = t.rows[lot(t.domain, t.day, t.rows.length)];
    (out[t.domain] = out[t.domain] || []).push({ day: t.day, n: t.rows.length, id: pick.id, covered: pick.covered });
  }
  for (const d of Object.keys(out)) out[d].sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  return out;
}

/* admission(claim [pN,pD], list of trials in day order) -> the verdict and its looks */
function admission(claim, list) {
  const done = [];
  let pruned = null;
  for (const lk of looks(list.length)) {
    const covered = list.slice(0, lk.m).filter((t) => t.covered).length;
    const a = A.admit({ claim, scored: lk.m, covered, bar: lk.bar });
    done.push({ m: lk.m, covered, tail: a.tailStr, bar: lk.bar.join('/'), status: a.status, through: list[lk.m - 1].day });
    if (a.status === 'DEADMITTED') { pruned = done[done.length - 1]; break; }
  }
  return {
    rule: RULE, trials: list.length, trialsCovered: list.filter((t) => t.covered).length,
    status: pruned ? 'DEADMITTED' : 'ADMITTED', pending: !done.length, looks: done, prunedAt: pruned,
    next: pruned ? null : FIRST_LOOK * 2 ** done.length
  };
}

/* the DESCRIPTIVE breakdown of the scored rows, per site and per lead range — never an admission: the rows of a day
   share their overflights, so these are counts to read, not trials to test */
const LEADS = [[0, 24, '0–24 h'], [24, 72, '1–3 dias'], [72, 169, '3–7 dias']];
function breakdown(rows) {
  const commit = {};
  for (const r of rows) if (r.type === 'commit') commit[r.id] = r;
  const out = {};
  for (const r of rows) {
    if (r.type !== 'score') continue;
    const c = commit[r.id]; if (!c) continue;
    const d = out[c.domain] = out[c.domain] || { bySite: {}, byLead: {} };
    const sid = c.id.split(':')[1], lead = c.forecast && c.forecast.lead;
    const L = LEADS.find(([a, b]) => lead >= a && lead < b);
    const s = d.bySite[sid] = d.bySite[sid] || [0, 0];
    s[0]++; if (r.covered) s[1]++;
    if (L) { const l = d.byLead[L[2]] = d.byLead[L[2]] || [0, 0]; l[0]++; if (r.covered) l[1]++; }
  }
  return out;
}

/* HEAD TO HEAD (the independent referee, 2026-10-07): two proposers judged on the SAME targets — the same site, the
   same run and lead, hence the same target time and the same satellite pass. Descriptive, never an admission: counts
   of who covered, the mean width, and — only when both claim the same coverage, so the Winkler score is one scale —
   the mean Winkler score (lower is better). Exact rationals summed, the means printed rounded. */
const PAIRS = [
  ['janela/hs-altimeter/ens-c40of50', 'janela/hs-altimeter/noaa-gefs-c25of31', 'os ensembles brutos: ECMWF × NOAA'],
  ['janela/hs-altimeter/calibrated-v1', 'janela/hs-altimeter/calibrated-noaa-v1', 'as faixas medidas: ECMWF × NOAA'],
  ['janela/hs-altimeter/calibrated-v1', 'janela/hs-altimeter/union-v1', 'a faixa do ECMWF × a união que decide']
];
function headToHead(rows) {
  const commit = {}, score = {};
  for (const r of rows) { if (r.type === 'commit') commit[r.id] = r; else if (r.type === 'score') score[r.id] = r; }
  /* the shared key: site, run, lead (the id without its proposer suffix) */
  const keyOf = (c) => { const p = c.id.split(':'); return p[1] + '|' + p.slice(2, 4).join(':'); };
  const by = {};
  for (const [id, s] of Object.entries(score)) {
    const c = commit[id]; if (!c) continue;
    (by[c.domain] = by[c.domain] || {})[keyOf(c)] = { c, s };
  }
  const R = (x) => { const [n, d = '1'] = String(x).split('/'); return [BigInt(n), BigInt(d)]; };
  const add = (a, b) => [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
  const mean = (sum, n) => (n ? Number(sum[0] * 10000n / (sum[1] * BigInt(n))) / 10000 : null);
  return PAIRS.map(([a, b, name]) => {
    const A = by[a] || {}, B = by[b] || {};
    const keys = Object.keys(A).filter((k) => B[k]);
    let both = 0, onlyA = 0, onlyB = 0, neither = 0, wA = [0n, 1n], wB = [0n, 1n], sA = [0n, 1n], sB = [0n, 1n];
    for (const k of keys) {
      const ca = A[k].s.covered, cb = B[k].s.covered;
      if (ca && cb) both++; else if (ca) onlyA++; else if (cb) onlyB++; else neither++;
      wA = add(wA, R(A[k].s.width)); wB = add(wB, R(B[k].s.width)); sA = add(sA, R(A[k].s.winkler)); sB = add(sB, R(B[k].s.winkler));
    }
    const alpha = (d) => { const x = Object.values(d)[0]; return x ? x.c.forecast.alpha.join('/') : null; };
    const same = alpha(A) && alpha(A) === alpha(B);
    return { a, b, name, n: keys.length, both, onlyA, onlyB, neither, widthA: mean(wA, keys.length), widthB: mean(wB, keys.length),
      winklerA: same ? mean(sA, keys.length) : null, winklerB: same ? mean(sB, keys.length) : null, sameClaim: !!same };
  });
}

/* the whole record per proposer: descriptive counts + the admission over trials.
   The claim is the one every commit of the proposer carries (coverage = 1 − alpha);
   a proposer whose rows disagree on it is refused, never averaged. */
function record(rows) {
  const per = {};
  const dom = {};
  for (const r of rows) if (r.type === 'commit') dom[r.id] = r.domain;
  for (const r of rows) {
    const d = r.type === 'commit' ? r.domain : dom[r.id];
    if (!d) throw new Error('REFUSED: a score row with no commit: ' + r.id);
    per[d] = per[d] || { domain: d, commits: 0, scored: 0, covered: 0, alpha: null };
    if (r.type === 'commit') {
      per[d].commits++;
      const a = r.forecast && r.forecast.alpha && r.forecast.alpha.map(Number);
      if (!a) throw new Error('REFUSED: commit ' + r.id + ' carries no alpha');
      if (per[d].alpha && (per[d].alpha[0] !== a[0] || per[d].alpha[1] !== a[1])) throw new Error('REFUSED: proposer ' + d + ' commits two different claims');
      per[d].alpha = a;
    } else { per[d].scored++; if (r.covered) per[d].covered++; }
  }
  const T = trials(rows), BD = breakdown(rows);
  for (const p of Object.values(per)) {
    p.breakdown = BD[p.domain] || { bySite: {}, byLead: {} };
    const claim = [p.alpha[1] - p.alpha[0], p.alpha[1]];
    p.claim = claim.join('/');
    p.admission = admission(claim, T[p.domain] || []);
  }
  return per;
}

module.exports = { RULE, RULE_PT, NAMES_PT, FIRST_LOOK, BAR, LEADS, PAIRS, looks, lot, trials, admission, breakdown, record, headToHead };
