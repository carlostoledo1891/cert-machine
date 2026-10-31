#!/usr/bin/env node
/* build-report-xx.js — reports/xx.html: the real root of x^x = y for every y to a thousand, computed by an AI model's
   Newton iteration, a hundred and five of them trapped between two fractions, and every side of every trap decided
   HERE by one exact integer comparison (tools/run-xx-ledger.py → certs/xx-ledger.json). The operator, 2026-10-31: "I
   want the page built here on the reports page with the grammar" — the story of claimbox's unpublished page
   (~/Projects/claimbox/web/pages/xx.py), drawn in WARRANT.

   THE TWO DECISIONS. The decided marks come from our ledger; claimbox's words (its check records, which cert-machine's
   receiver wrote) are shown beside them, and the ledger refuses to exist if any word differs. The study's numbers —
   the roots, their continued fractions, the closest fractions, the statistics — are the proposer's: COMPUTED, dashed.
   Every number on the page is read from its record through playground/warrant.js (W.val) or names the cells it was
   computed from (derived). The data come in through LIFT-claimbox.json (corpus/claimbox-xx), never read in place.

   usage: node tools/build-report-xx.js                                                                            MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const die = (m) => { console.error('XX REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the ledger re-derives before a word is written (~10 s) ---- */
{
  const r = cp.spawnSync('python3', ['-I', 'tools/run-xx-ledger.py', '--check'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) die('the ledger does not re-derive: ' + String(r.stderr || r.stdout).trim());
}
const LED = 'certs/xx-ledger.json';
const LIFTED = 'corpus/claimbox-xx';
const STU = LIFTED + '/records/xxy-study.json';
const CB = LIFTED + '/records/xxy-check.json';
const CB64 = LIFTED + '/records/xx64-check.json';
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const L = J(LED), S = J(STU), K = J(CB), K64 = J(CB64);
const PROV = J('PROVENANCE-claimbox.json');

/* ---- what the prose states, gated against the records ---- */
const cnt = L.counts;
if (cnt.agreeWithClaimbox !== cnt.claims || cnt.xx64AgreeWithClaimbox !== cnt.xx64Claims) die('claimbox\'s words and ours disagree');
if (cnt.REFUTED !== cnt.planted || cnt.CERTIFIED + cnt.REFUTED !== cnt.claims) die('a claim other than a planted one is not CERTIFIED');
if (cnt.mutantsFlipped !== cnt.mutants) die('a mutant did not flip');
if (K.claims.length !== cnt.claims || K64.claims.length !== cnt.xx64Claims) die('the ledger and claimbox\'s records count different claims');
if (L.claims.some((r) => r.claimbox.word !== r.word) || L.xx64.some((r) => r.claimbox.word !== r.word)) die('a row disagrees with claimbox');
if (JSON.stringify(L.exactRoots) !== JSON.stringify(S.exactRoots)) die('the whole-number roots of the ledger and the study differ');
const EXACT = L.exactRoots;
const kOf = (y) => { for (let k = 1; k < 12; k++) if (k ** k === y) return k; return null; };
if (EXACT.length !== 4 || EXACT.some((y) => !kOf(y))) die('the page says the whole-number roots are the four k^k');
for (const y of EXACT) {
  for (const s of ['ge', 'le']) { const r = L.claims.find((c) => c.id === 'y' + y + '_' + s); if (!r || r.word !== 'CERTIFIED') die('y = ' + y + ': x ' + s + ' k is not certified'); }
}
if (S.rows.filter((r) => r.exact).map((r) => r.y).join() !== EXACT.join()) die('a computed root other than k^k is whole');
const ROW = new Map(S.rows.map((r) => [r.y, r]));
for (const r of S.rows) for (const v of [].concat(r.closest || [], ...(r.bracket || []))) if (!Number.isSafeInteger(v)) die('y = ' + r.y + ': a fraction of the study is past 2^53 and would print wrong');
const BR = new Map(L.brackets.map((b) => [b.y, b]));
if (S.count !== S.rows.length) die('the study counts its roots differently from its rows');
const beside = S.rows.filter((r) => r.y > S.dmax).map((r) => r.y);
if (beside.join() !== '3124,3125,3126') die('the three roots beside 5^5 are not 3124, 3125, 3126');
const r64 = L.xx64, lo64 = r64.find((r) => r.id === 'cf_above_10'), hi64 = r64.find((r) => r.id === 'cf_below_9');
if (!lo64 || !hi64 || lo64.word !== 'CERTIFIED' || hi64.word !== 'CERTIFIED') die('the x^x = 64 bracket is not certified both sides');
if (lo64.digits[0] !== lo64.digits[1]) die('the page says both sides of the 64 comparison have the same number of digits');
if (L.bracket64.lo !== lo64.a || L.bracket64.hi !== hi64.a) die('the 64 bracket and its claims differ');
/* the reduction: proved in Lean (certs/xx-reduction-lean.json, re-hashed by the ledger) or read; the page says which */
const RED = L.reduction, LREC = 'certs/xx-reduction-lean.json';
const PROVED = RED.standing === 'proved in Lean, kernel-checked';
if (!PROVED && RED.standing !== 'read, not decided') die('the ledger names a reduction standing the page does not word: ' + RED.standing);
const LR = PROVED ? J(LREC) : null;
if (PROVED && (String(LR.run.id) !== String(RED.run.id) || LR.run.conclusion !== 'success')) die('the ledger and the Lean record name different runs');
const THM = PROVED ? RED.theorems : null;
if (PROVED) for (const n of [].concat(THM.unique, Object.values(THM.fraction), Object.values(THM.whole))) {
  const t = LR.theorems.find((x) => x.name === n);
  if (!t || t.word !== 'PROVED' || t.kernels.length !== 3) die(n + ' is not PROVED by three kernels in the Lean record');
}
/* cert-machine's own claim, which the decider must refuse */
const OWN = L.own.rows, own64 = OWN.find((r) => r.id === 'cm_xx64_transcendental');
if (!own64 || own64.word !== 'REFUSED' || cnt.own !== OWN.length || cnt.ownRefused !== cnt.own) die('cert-machine\u2019s own claim is not the one REFUSED row the page describes');
if (!own64.reason || !own64.trueBy || !own64.decidableBy) die('the refused claim has no reason, no citation or no way to decide it in the ledger');
/* a ledger sentence in page type: a^b becomes a raised b, x^x the one glyph */
const prose = (t) => C.esc(t).replace(/x\^x/g, 'xˣ').replace(/([A-Za-z0-9]+)\^([A-Za-z0-9]+)/g, '$1<sup>$2</sup>');
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = (n) => WORD[n] || String(n), Word = (n) => { const w = word(n); return w[0].toUpperCase() + w.slice(1); };
const sh64 = L.bracket64.sharedDecimals;
if (!(sh64 >= 2 && sh64 <= 12)) die('the 64 bracket shares ' + sh64 + ' decimals; the title spells it in words up to twelve');
const pl64 = r64.filter((r) => r.expect === 'REFUTED');
if (pl64.length !== 2 || pl64.some((r) => r.word !== 'REFUTED')) die('the two planted x^x = 64 bounds are not refuted');
/* the near-k^k rows: the closest fraction there is k itself */
for (const z of S.near) { const k = Math.round(Number(z.x)); if (Math.abs(k ** k - z.y) !== 1) die('a near row is not beside k^k: ' + z.y); }
/* Gauss–Kuzmin: the a = 1 frequency is the largest, as the sentence says */
const fr = S.stats.frequency;
if (Object.keys(fr).some((k) => fr[k] > fr['1'])) die('a quotient other than 1 is the most frequent');
/* the champion is the largest partial quotient in the study */
const champ = S.stats.largest[0];
if (S.rows.some((r) => r.exact && r.cf.length !== 1)) die('a whole-number root’s continued fraction holds more than the number itself');
for (const r of S.rows) for (const a of (r.cf || []).slice(1)) if (a > champ.a) die('a larger partial quotient than the champion: y = ' + r.y);
/* the claim statements in claimbox's records name the model that proposed them */
const proposedBy = (() => { const t = fs.readFileSync(path.join(ROOT, LIFTED, 'corpus/xxy/claims.claim'), 'utf8'); const m = t.match(/proposed by model:([\w.-]+)/g) || []; return [...new Set(m.map((x) => x.split(':')[1]))]; })();
if (proposedBy.length !== 1 || proposedBy[0] !== 'claude-opus-5-5') die('the claims name ' + proposedBy.join(', ') + ' as proposer; the page says claude-opus-5-5');

/* ---- the marks ---- */
const WHY_ROOT = 'computed by the proposer’s Newton iteration in 160-digit arithmetic; nothing decided it';
const WHY_CF = 'a partial quotient of the computed root, kept where the 120- and 160-digit roots agree; computed, not decided';
const WHY_STAT = 'a statistic of the computed continued fractions; an observation, nothing decided it';
const WHY_LAW = 'the law’s value as the study prints it, rounded to nearest; a literature value, not decided here';
const dv = (file, ptr, fmt = 'int', why) => W.val({ rec: { path: file, ptr }, standing: W.DECIDED, fmt, why });
const cv = (file, ptr, fmt = 'raw', why = WHY_ROOT) => W.val({ rec: { path: file, ptr }, standing: W.COMPUTED, fmt, why });
const dFrom = (text, cells, why) => W.value(C.esc(text), W.DECIDED, { derived: [].concat(cells), title: why });
const cFrom = (text, cells, why) => W.value(C.esc(text), W.COMPUTED, { derived: [].concat(cells), title: why });
const at = (y) => '/rows[y=' + y + ']';
const sup = (s) => '<sup>' + s + '</sup>';
const tag = (w) => C.tag(w);
const fmtInt = (n) => Number(n).toLocaleString('en-US');
const andList = (xs) => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];

/* ---------------------------------------------------------------- the figures ---- */
const FIG_W = 900;

/* 1. the curve y = x^x and every root on it; a decided root is drawn as its bracket */
const WIDE = [];
function figCurve() {
  const f = CH.frame({ w: FIG_W, h: 400, x0: 1, x1: 6.1, y0: 1, y1: 3400, logY: true, padL: 62, padR: 22, padT: 34, padB: 50 });
  const out = [CH.open({ w: f.w, h: f.h, alt: 'The curve y = x to the x on a logarithmic y axis from 1 to 3,400, x from 1 to 6.1, dashed because it is drawn in floating point. '
    + S.count + ' roots sit on it: ' + L.counts.roots + ' solid dots for the roots trapped between decided fractions, larger at the four whole-number roots x = 2, 3, 4, 5; the rest hollow dashed circles, computed only.' })];
  out.push(CH.axes(f, { yTicks: [1, 10, 100, 1000].map((v) => ({ v, t: fmtInt(v) })), xTicks: [1, 2, 3, 4, 5, 6].map((v) => ({ v, t: String(v) })), xLabel: 'x' }));
  out.push(CH.txt(f.L - 9, f.T - 14, 'y = xˣ', 't-note', 'end'));
  const SUPD = { 2: '²', 3: '³', 4: '⁴', 5: '⁵' };
  for (const y of EXACT) {
    const k = kOf(y), x = f.px(k);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + f.T + '" x2="' + x.toFixed(1) + '" y2="' + (f.T + f.ph) + '" stroke="var(--ink-5)" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"/>');
    const lab = k + SUPD[k] + ' = ' + fmtInt(y);
    out.push(CH.txt(CH.clampX(f, x + (k < 5 ? 6 : -6), lab, k < 5 ? 'start' : 'end'), f.T - 14, lab, 't-ax', k < 5 ? 'start' : 'end'));
  }
  const pts = [];
  for (let i = 0; i <= 600; i++) { const x = 1 + i * 5.1 / 600; const v = Math.pow(x, x); if (v <= 3400) pts.push(f.px(x).toFixed(1) + ',' + f.py(v).toFixed(1)); }
  out.push('    <polyline points="' + pts.join(' ') + '" ' + W.attrs(W.COMPUTED, { width: 1.4 }) + ' stroke-linejoin="round"/>');
  const decided = new Set(S.decidedYs);
  /* computed roots first, decided on top */
  for (const r of S.rows) {
    if (decided.has(r.y)) continue;
    out.push('    <circle cx="' + f.px(Number(r.xShort)).toFixed(1) + '" cy="' + f.py(r.y).toFixed(1) + '" r="2.2" ' + W.attrs(W.COMPUTED, { width: 1, rec: { path: STU, ptr: at(r.y) + '/xShort' } }) + '/>');
  }
  for (const y of S.decidedYs) {
    const b = BR.get(y), cy = f.py(y).toFixed(1);
    if (b.exact) { out.push('    <circle cx="' + f.px(b.k).toFixed(1) + '" cy="' + cy + '" r="5.5" fill="var(--ink)" stroke="var(--sunk)" stroke-width="1" data-w="decided" data-rec="' + LED + '#/brackets[y=' + y + ']/k"/>'); continue; }
    /* the bracket's ends, moved outward to the pixel: the drawn extent always contains the decided one */
    const x0 = Math.floor(f.px(Number(b.loDec)) * 10) / 10, x1 = Math.ceil(f.px(Number(b.hiDec)) * 10) / 10;
    if (x1 - x0 < 3) out.push('    <circle cx="' + ((x0 + x1) / 2).toFixed(1) + '" cy="' + cy + '" r="3.2" fill="var(--ink)" stroke="var(--sunk)" stroke-width="1" data-w="decided" data-rec="' + LED + '#/brackets[y=' + y + ']/width"/>');
    else {
      WIDE.push(y);
      out.push('    <line x1="' + x0.toFixed(1) + '" y1="' + cy + '" x2="' + x1.toFixed(1) + '" y2="' + cy + '" ' + W.attrs(W.DECIDED, { width: 3, rec: { path: LED, ptr: '/brackets[y=' + y + ']/width' } }) + '/>');
      for (const x of [x0, x1]) out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (Number(cy) - 6).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (Number(cy) + 6).toFixed(1) + '" ' + W.attrs(W.DECIDED, { width: 2 }) + '/>');
    }
  }
  out.push(CH.close);
  return out.join('\n');
}

/* 2. how tight each trap is: the decimals each decided bracket pins (bar) against the decimals its better end gets right
   by the computed root (dashed step). Exact roots run to the top line, which is labelled, never past it. */
const P10 = (d) => 10n ** BigInt(d);
function decScaled(str, d) {   /* floor(str · 10^d) for a positive plain decimal string */
  const [ip, fp = ''] = str.split('.');
  return BigInt(ip + fp.slice(0, d).padEnd(d, '0'));
}
function fracFloor(p, q, d) { return (BigInt(p) * P10(d)) / BigInt(q); }
function sharedWithRoot(p, q, xs, cap) {   /* decimals the fraction p/q shares with the computed root's digits */
  let d = 0;
  while (d < cap && fracFloor(p, q, d + 1) === decScaled(xs, d + 1)) d++;
  return d;
}
const ZERO_TICK = 8;                                    /* how far a zero's tick hangs under the axis */
const zeroTick = (x, y0, w) => '    <rect x="' + x.toFixed(1) + '" y="' + (y0 + 1.5).toFixed(1) + '" width="' + w.toFixed(1)
  + '" height="' + ZERO_TICK + '" fill="var(--c-2)" data-w="decided"/>';
function figTight() {
  const ys = S.decidedYs.filter((y) => y <= 100);
  const vals = ys.map((y) => {
    const b = BR.get(y), r = ROW.get(y);
    if (b.exact) return { y, exact: true };
    const tick = sharedWithRoot(r.closest[0], r.closest[1], r.x, 40);
    if (tick < b.sharedDecimals) die('y = ' + y + ': the closest fraction shares fewer decimals with the root than the bracket pins');
    return { y, bar: b.sharedDecimals, tick };
  });
  const finite = vals.filter((v) => !v.exact);
  const zeros = finite.filter((v) => v.bar === 0).map((v) => v.y);
  const top = Math.max(...finite.map((v) => Math.max(v.bar, v.tick))) + 1;
  const f = CH.frame({ w: FIG_W, h: 300, x0: 0, x1: ys.length, y0: 0, y1: top, padL: 62, padR: 22, padT: 22, padB: 48 });
  const yt = []; for (let d = 0; d < top; d += 2) yt.push({ v: d, t: String(d) });
  yt.push({ v: top, t: 'exact' });
  const out = [CH.open({ w: f.w, h: f.h, alt: 'For each y from 2 to ' + ys[ys.length - 1] + ', a bar: the decimal places on which the two decided fractions agree, from ' + Math.min(...finite.map((v) => v.bar)) + ' to ' + Math.max(...finite.map((v) => v.bar))
    + '. A dashed step line above the bars: the places the closest fraction shares with the computed root. At y = 4 and y = 27 the root is a whole number and the bar reaches the top line, labelled exact.'
    + (zeros.length ? ' At y = ' + zeros.join(' and y = ') + ' the two fractions share no decimal: the bar has no height, and a short solid tick under the axis marks the zero, keyed 0 decimals shared.' : '') })];
  out.push(CH.axes(f, { yTicks: yt, xTicks: [], xLabel: 'y', yLabel: 'decimals' }));
  const bw = f.pw / ys.length;
  const step = [];
  vals.forEach((v, i) => {
    const x = f.L + i * bw;
    const h = v.exact ? top : v.bar;
    out.push('    <rect x="' + (x + 1).toFixed(1) + '" y="' + f.py(h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + (f.py(0) - f.py(h)).toFixed(1) + '" fill="' + (v.exact ? 'var(--ink)' : 'var(--c-2)') + '" data-rec="' + LED + '#/brackets[y=' + v.y + ']/sharedDecimals"/>');
    /* a true zero (the two fractions share no decimal) has no height to draw: a short solid tick hangs under the
       axis in the bar's colour, a decided mark, so the zero reads as a value and not as a missing bar (keyed below) */
    if (!v.exact && v.bar === 0) out.push(zeroTick(x + 1, f.py(0), bw - 2));
    const t = v.exact ? top : v.tick;
    step.push((i ? 'L' : 'M') + x.toFixed(1) + ' ' + f.py(t).toFixed(1) + ' L' + (x + bw).toFixed(1) + ' ' + f.py(t).toFixed(1));
    if ([2, 10, 27, 50, 64, 100].includes(v.y)) out.push(CH.txt(x + bw / 2, f.T + f.ph + 18, String(v.y), 't-ax', 'middle'));
  });
  out.push('    <path d="' + step.join(' ') + '" ' + W.attrs(W.COMPUTED, { width: 1.6 }) + '/>');
  if (zeros.length) {                                  /* the key: the tick as drawn, on the axis title's line */
    const label = '0 decimals shared', kx = f.L + f.pw - 19 - Math.ceil(label.length * 6.9), ky = f.T + f.ph + 42;
    out.push(zeroTick(kx, ky - 11.5, bw - 2), CH.txt(kx + 19, ky, label, 't-note', 'start'));
  }
  out.push(CH.close);
  return { svg: out.join('\n'), top, ys };
}

/* 3. every continued fraction at a glance: y = 2..400 by the first thirty partial quotients, the size of a quotient in
   the five steps of the order ramp; a quotient of 1 is the ground */
const HEAT_Y = 400, HEAT_N = 30;
const BUCKETS = [{ lo: 2, hi: 2, t: 'a = 2' }, { lo: 3, hi: 5, t: '3–5' }, { lo: 6, hi: 20, t: '6–20' }, { lo: 21, hi: 100, t: '21–100' }, { lo: 101, hi: Infinity, t: 'over 100' }];
function figHeat() {
  const Lp = 44, T0 = 30, cw = (FIG_W - Lp - 12) / (HEAT_Y - 1), ch = 7;
  const h = T0 + HEAT_N * ch + 64;
  const paths = BUCKETS.map(() => []);
  for (const r of S.rows) {
    if (r.y > HEAT_Y) continue;
    const x = Lp + (r.y - 2) * cw;
    r.cf.slice(1, HEAT_N + 1).forEach((a, i) => {
      const b = BUCKETS.findIndex((B) => a >= B.lo && a <= B.hi);
      if (b >= 0) paths[b].push('M' + x.toFixed(2) + ' ' + (T0 + i * ch).toFixed(1) + 'h' + (cw + 0.05).toFixed(2) + 'v' + (ch - 0.6).toFixed(1) + 'h-' + (cw + 0.05).toFixed(2) + 'z');
    });
  }
  const out = [CH.open({ w: FIG_W, h, alt: 'A grid: one column per root for y from 2 to ' + HEAT_Y + ', one row per partial quotient, the first thirty. Larger quotients are brighter, in five steps. The columns at y = 4, 27 and 256 are empty: those roots are whole numbers.' })];
  out.push('    <rect x="' + Lp + '" y="' + T0 + '" width="' + (FIG_W - Lp - 12) + '" height="' + (HEAT_N * ch) + '" fill="var(--sunk)" stroke="var(--rule)" stroke-width="1"/>');
  BUCKETS.forEach((B, i) => { if (paths[i].length) out.push('    <path d="' + paths[i].join('') + '" fill="' + CH.SEQ[i] + '"/>'); });
  for (const y of EXACT.filter((y) => y <= HEAT_Y)) {
    const x = Lp + (y - 2) * cw + cw / 2;
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (T0 - 6) + '" x2="' + x.toFixed(1) + '" y2="' + (T0 + HEAT_N * ch) + '" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"/>');
    out.push(CH.txt(x, T0 - 10, String(y), 't-ax', 'middle'));
  }
  out.push(CH.txt(Lp - 6, T0 + 7, '1', 't-ax', 'end'), CH.txt(Lp - 6, T0 + HEAT_N * ch - 1, String(HEAT_N), 't-ax', 'end'));
  out.push(CH.txt(Lp + (FIG_W - Lp - 12) / 2, T0 + HEAT_N * ch + 18, 'y, from 2 to ' + HEAT_Y + ' · rows: the partial quotients, the first at the top', 't-note', 'middle'));
  out.push(CH.legend(BUCKETS.map((B, i) => ({ token: CH.SEQ[i], t: B.t })), Lp, h - 8, undefined, FIG_W - Lp - 12));
  out.push(CH.close);
  return out.join('\n');
}

/* 4. near k^k: the one large quotient (bar) against k^k·(1 + ln k), the slope of x^x at k (dashed tick) */
function figNear() {
  const N = S.near, rowH = 34, T0 = 14, Lp = 92, h = T0 + N.length * rowH + 44;
  const f = CH.frame({ w: FIG_W, h, x0: 10, x1: 12000, y0: 0, y1: 1, logX: true, padL: Lp, padR: 22, padT: T0, padB: 44 });
  const out = [CH.open({ w: FIG_W, h, alt: 'Six rows, the roots for y beside 3 cubed, 4 to the 4th and 5 to the 5th. Each bar is the large partial quotient of that root, on a log scale from 10 to 10,000; a dashed tick on each bar marks k to the k times one plus the log of k. Bars and ticks nearly coincide.' })];
  for (const v of [10, 100, 1000, 10000]) {
    const x = f.px(v);
    out.push('    <line x1="' + x.toFixed(1) + '" y1="' + (T0 - 4) + '" x2="' + x.toFixed(1) + '" y2="' + (h - 34) + '" stroke="' + CH.GRID + '" stroke-width="1"/>');
    out.push(CH.txt(x, h - 18, fmtInt(v), 't-ax', 'middle'));
  }
  N.forEach((z, i) => {
    const y = T0 + i * rowH;
    out.push(CH.txt(Lp - 10, y + rowH / 2 + 4, 'y = ' + fmtInt(z.y), 't-ax', 'end'));
    out.push('    <rect x="' + Lp + '" y="' + (y + 6).toFixed(1) + '" width="' + (f.px(z.quotient) - Lp).toFixed(1) + '" height="' + (rowH - 12) + '" rx="2" fill="var(--c-2)" data-rec="' + STU + '#/near[y=' + z.y + ']/quotient"/>');
    const xp = f.px(z.predicted);
    out.push('    <line x1="' + xp.toFixed(1) + '" y1="' + (y + 1).toFixed(1) + '" x2="' + xp.toFixed(1) + '" y2="' + (y + rowH - 1).toFixed(1) + '" ' + W.attrs(W.COMPUTED, { width: 2, rec: { path: STU, ptr: '/near[y=' + z.y + ']/predicted' } }) + '/>');
  });
  out.push(CH.close);
  return out.join('\n');
}

/* 5. the pooled partial quotients against the Gauss–Kuzmin law */
function figGK() {
  const st = S.stats;
  const f = CH.frame({ w: FIG_W, h: 280, x0: 0.5, x1: 10.5, y0: 0, y1: 0.45, padL: 62, padR: 22, padT: 16, padB: 48 });
  const out = [CH.open({ w: f.w, h: f.h, alt: 'Ten bars, how often each partial quotient from 1 to 10 occurs among those pooled from the irrational roots, falling from about 0.41 at 1 to about 0.01 at 10. A dashed tick on each bar marks the Gauss–Kuzmin law; bars and ticks nearly coincide.' })];
  out.push(CH.axes(f, { yTicks: [0, 0.1, 0.2, 0.3, 0.4].map((v) => ({ v, t: v.toFixed(1) })), xTicks: Array.from({ length: 10 }, (_, i) => ({ v: i + 1, t: String(i + 1) })), xLabel: 'the partial quotient a' }));
  const bw = f.pw / 10;
  for (let k = 1; k <= 10; k++) {
    const x = f.px(k) - bw / 2, fq = st.frequency[String(k)], g = st.gaussKuzmin[String(k)];
    out.push('    <rect x="' + (x + 6).toFixed(1) + '" y="' + f.py(fq).toFixed(1) + '" width="' + (bw - 12).toFixed(1) + '" height="' + (f.py(0) - f.py(fq)).toFixed(1) + '" fill="var(--c-2)" data-rec="' + STU + '#/stats/frequency/' + k + '"/>');
    out.push('    <line x1="' + (x + 2).toFixed(1) + '" y1="' + f.py(g).toFixed(1) + '" x2="' + (x + bw - 2).toFixed(1) + '" y2="' + f.py(g).toFixed(1) + '" ' + W.attrs(W.COMPUTED, { width: 2, rec: { path: STU, ptr: '/stats/gaussKuzmin/' + k } }) + '/>');
  }
  out.push(CH.close);
  return out.join('\n');
}

const TIGHT = figTight();

/* ---------------------------------------------------------------- the page ---- */
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · an AI model’s proposals, stated by claimbox, decided here',
  title: 'xˣ = y, by fractions',
  deck: 'It began with one picture, xˣ = 64. The equation has one real root, and no fraction equals it. What a fraction can do is trap it: one fraction on either side, each side '
    + 'one comparison of two whole numbers, decided exactly. An AI model computed the root for every y to a thousand and proposed the traps; claimbox stated them as claims; '
    + 'this page decides every side again with code of its own and reads what the fractions show.'
}));
B.push('<p class="scope">Decided here: every side of every trap the study proposed, the four whole-number roots from both sides, and the eight claims about xˣ = 64, each by one exact '
  + 'comparison of integers (certs/xx-ledger.json, tools/run-xx-ledger.py). claimbox’s words are shown beside ours. Computed and not decided: the roots’ digits, their continued fractions, '
  + 'the closest fractions and every statistic. '
  + (PROVED ? 'Proved in Lean and checked by two kernels: that the root is unique and that a fraction bounds it exactly when one integer exceeds another (certs/xx-reduction-lean.json). Read and not decided: the negative-base convention. '
    : 'Read and not decided: the argument that the root is unique and that a fraction bounds it exactly when one integer exceeds another. ')
  + 'Refused: ' + word(cnt.ownRefused) + ' claim of our own, that the root of 64 is transcendental. Cited and not decided: the Gelfond–Schneider theorem.</p>');
B.push(C.tldr({
  findingRaw: '<b>' + dv(LED, '/counts/CERTIFIED') + ' of ' + dv(LED, '/counts/claims') + ' claims CERTIFIED</b> and the other ' + dv(LED, '/counts/planted') + ', the planted wrong brackets, REFUTED: '
    + dv(LED, '/counts/roots') + ' roots of xˣ = y each trapped between two fractions, and at y = ' + andList(EXACT.map((y, i) => dv(LED, '/exactRoots/' + i)))
    + ' the root pinned to a whole number from both sides. The root of 64 is decided to ' + word(sh64) + ' decimals. claimbox’s record gives the same word on every claim. '
    + Word(cnt.ownRefused) + ' claim of cert-machine’s own, that the root of 64 is transcendental, is ' + tag(own64.word) + ': it is true, by a cited theorem, and no comparison of two integers decides it.',
  mechanismRaw: 'For a fraction p/q above 1, x > p/q exactly when p' + sup('p') + ' < N' + sup('q') + '·q' + sup('p') + ', where N = y is read from the pinned file; '
    + 'both sides are computed as whole numbers and compared. No logarithm is evaluated. ' + dv(LED, '/counts/mutants') + ' mutants, each fraction moved one unit the wrong way or each whole-number bound made strict, must flip to REFUTED, and all do.'
    + (PROVED ? ' That the comparison decides the bracket is proved in Lean and checked by two kernels (§4).' : ''),
  checkRaw: C.m('python3 -I tools/run-xx-ledger.py --check') + ' (seconds; the Python standard library) re-hashes the copies and re-decides every claim.'
}));
B.push(C.stats([
  { k: 'roots computed', vRaw: dv(STU, '/count'), nRaw: 'one for every y from 2 to ' + dv(STU, '/dmax') + ', and ' + word(beside.length) + ' beside 5⁵, by Newton’s method in 160-digit arithmetic' },
  { k: 'roots trapped', vRaw: dv(LED, '/counts/roots'), nRaw: 'each between two fractions, every side one exact comparison of whole numbers' },
  { k: 'claims certified', vRaw: dv(LED, '/counts/CERTIFIED') + ' of ' + dv(LED, '/counts/claims'), nRaw: 'the other ' + dv(LED, '/counts/planted') + ' are the planted wrong brackets, all refuted' },
  { k: 'roots that are fractions', vRaw: dv(LED, '/counts/exactRoots'), nRaw: 'exactly the y of the form kᵏ; every other root is transcendental (a theorem cited)' }
]));

/* §1 · the picture */
const s64 = (id) => L.xx64.find((r) => r.id === id);
const at64 = (id, f) => '/xx64[id=' + id + ']/' + f;
const ORIGIN = { proposed: 'proposed', 'planted wrong bound': 'planted wrong' };
const cf64 = ROW.get(64).cf;
if (Math.max(...cf64.slice(1, 10)) !== cf64[4]) die('the fifth quotient of the root of 64 is not the large one among the first ten');
B.push(C.section({
  lab: '§1 · the picture', title: 'The root of 64, ' + word(sh64) + ' decimals decided', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('x = ln 64 / W(ln 64), where W is Lambert’s function. That form describes the number; it decides nothing. The decimals below are decided by two fractions.') + '</div>'
    + C.table({
      cols: [{ h: 'what' }, { h: 'the number' }, { h: 'decided here' }, { h: 'claimbox’s record' }],
      rows: [
        [{ raw: 'the root, computed' }, { raw: cv(STU, at(64) + '/x') }, { raw: '—' }, { raw: '—' }],
        [{ raw: 'below it' }, { raw: 'x &gt; ' + dv(LED, at64('cf_above_10', 'a'), 'raw') }, { raw: tag(lo64.word) }, { raw: tag(lo64.claimbox.word) }],
        [{ raw: 'above it' }, { raw: 'x &lt; ' + dv(LED, at64('cf_below_9', 'a'), 'raw') }, { raw: tag(hi64.word) }, { raw: tag(hi64.claimbox.word) }],
        [{ raw: 'so, printed outward' }, { raw: dv(LED, '/bracket64/loDec', 'lo:' + sh64) + ' &lt; x &lt; ' + dv(LED, '/bracket64/hiDec', 'hi:' + sh64) }, { raw: tag('CERTIFIED') }, { raw: '—' }]
      ]
    })
    + '<div class="col">' + C.pRaw('xˣ grows for x above 1, so x is above a fraction p/q exactly when (p/q)' + sup('p/q') + ' is below 64, that is, when p' + sup('p') + ' is below 64' + sup('q') + '·q' + sup('p') + '. '
      + 'For the fraction below, each side of that comparison is a whole number of ' + dv(LED, at64('cf_above_10', 'digits/0')) + ' digits. The recorder computes both exactly and compares them; '
      + (PROVED ? 'the step from x to the comparison is proved in Lean and checked by two kernels (§4).' : 'the step from x to the comparison is read, not decided (§4).'))
    + C.eq(dFrom(String(lo64.a.split('/')[0]), LED + '#' + at64('cf_above_10', 'a'), 'p, the numerator of the decided fraction') + sup(dFrom(lo64.a.split('/')[0], LED + '#' + at64('cf_above_10', 'a'), 'p')) + ' &lt; '
      + dFrom('64', LED + '#' + at64('cf_above_10', 'N'), 'N, read from the pinned file') + sup(dFrom(lo64.a.split('/')[1], LED + '#' + at64('cf_above_10', 'a'), 'q')) + ' · '
      + dFrom(lo64.a.split('/')[1], LED + '#' + at64('cf_above_10', 'a'), 'q') + sup(dFrom(lo64.a.split('/')[0], LED + '#' + at64('cf_above_10', 'a'), 'p')))
    + C.pRaw('The two fractions are neighbouring convergents of the root’s continued fraction, ' + cFrom('[' + cf64[0] + '; ' + cf64.slice(1, 10).join(', ') + ', …]', STU + '#' + at(64) + '/cf', WHY_CF)
      + ': the closest fractions for their size, on opposite sides of x. Its large fifth quotient is why ' + cv(STU, at(64) + '/closest/0') + '/' + cv(STU, at(64) + '/closest/1') + ', with a denominator below a thousand, '
      + 'is already off by only ' + cv(STU, at(64) + '/error') + '.') + '</div>'
    + C.table({
      cols: [{ h: 'the claim about xˣ = 64' }, { h: 'origin' }, { h: 'each side, digits' }, { h: 'decided here' }, { h: 'claimbox’s record' }],
      rows: L.xx64.map((r) => [{ raw: 'x ' + C.esc({ gt: '>', lt: '<', ge: '≥', le: '≤' }[r.rel]) + ' ' + dv(LED, at64(r.id, 'a'), 'raw') },
        { raw: C.esc(ORIGIN[r.origin] || r.origin) }, { raw: dv(LED, at64(r.id, 'digits/0')) + ' and ' + dv(LED, at64(r.id, 'digits/1')) }, { raw: tag(r.word) }, { raw: tag(r.claimbox.word) }])
        .concat([[{ raw: prose(own64.form) }, { raw: 'cert-machine’s own' },
          { raw: W.value('no comparison', W.REFUSED, { derived: LED + '#/own/rows[id=' + own64.id + ']/why', title: 'refused: ' + own64.why }) },
          { raw: tag(own64.word) }, { raw: C.esc('—') }]])
    })
    + '<div class="col">' + C.pRaw('The first two rows are the AI’s four-decimal proposal; the planted rows move it one unit in the last decimal, the wrong way, and are refuted. A refutation here is a comparison of two numbers, so it has no witness point to draw.')
    + C.pRaw('<b>The last row is cert-machine’s own claim, and it is refused.</b> ' + prose(own64.reason) + ' It is true: ' + prose(own64.trueBy.replace(/^Cited, not decided: /, '')) + ' That theorem is cited, not decided here (§3, one). '
      + '<b>What would make it decidable.</b> ' + prose(own64.decidableBy) + ' claimbox stated no such claim; it is the one row of this page that is not claimbox’s.')
    + W.legendHtml({ compact: true }) + '</div>'
}));

/* §2 · every root */
const DTL = [2, 3, 4, 10, 27, 64, 100, 255, 256, 257];
for (const y of DTL) if (!ROW.has(y) || !BR.has(y)) die('the detail table names y = ' + y + ', which is not decided');
const detailRows = DTL.map((y) => {
  const r = ROW.get(y), b = BR.get(y);
  const brk = b.exact ? 'x ≥ ' + dv(LED, '/brackets[y=' + y + ']/k') + ' and x ≤ ' + dv(LED, '/brackets[y=' + y + ']/k')
    : dv(LED, '/brackets[y=' + y + ']/lo', 'raw') + ' &lt; x &lt; ' + dv(LED, '/brackets[y=' + y + ']/hi', 'raw');
  const ids = b.exact ? ['y' + y + '_ge', 'y' + y + '_le'] : ['y' + y + '_gt', 'y' + y + '_lt'];
  const rows = ids.map((id) => L.claims.find((c) => c.id === id));
  if (rows.some((c) => c.word !== rows[0].word || c.claimbox.word !== rows[0].word)) die('y = ' + y + ': the two sides do not share one word here and in claimbox; the table prints one word per row');
  return [{ raw: dv(STU, at(y) + '/y') }, { raw: r.exact ? dv(LED, '/brackets[y=' + y + ']/k', 'int', 'a whole number, decided from both sides here') : cv(STU, at(y) + '/x', 'fixed:12') + '…' },
    { raw: cv(STU, at(y) + '/closest/0') + '/' + cv(STU, at(y) + '/closest/1') }, { raw: r.exact ? dFrom('0', [LED + '#/brackets[y=' + y + ']/k', STU + '#' + at(y) + '/closest'], 'zero: the closest fraction is k, and the root is k, decided from both sides') : cv(STU, at(y) + '/error') },
    { raw: brk }, { raw: tag(rows[0].word) + ' ' + tag(rows[0].claimbox.word) }];
});
B.push(C.section({
  lab: '§2 · every root', title: 'A thousand roots on one curve', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Each dot is the root of xˣ = y. A solid dot is trapped between fractions decided here; a hollow dashed one is computed only. The large dots are the roots that are whole numbers.') + '</div>'
    + C.figure({ svgRaw: figCurve(), record: [STU, LED], stop: 'a decided dot’s bracket is not CERTIFIED on both sides here, or claimbox’s word on it differs',
      captionRaw: 'Solid: the ' + dv(LED, '/counts/roots') + ' decided roots, each drawn as its bracket: a dot where the two fractions are closer than a pixel, a bar from one to the other where they are not ('
        + WIDE.map((y) => 'y = ' + dv(LED, '/brackets[y=' + y + ']/y') + ', from ' + dv(LED, '/brackets[y=' + y + ']/lo', 'raw') + ' to ' + dv(LED, '/brackets[y=' + y + ']/hi', 'raw')).join('; ')
        + '). Dashed: the curve y = xˣ, drawn in floating point, and the ' + dFrom(fmtInt(S.count - S.decidedYs.length), [STU + '#/count', STU + '#/decidedYs'], 'the computed roots less the decided ones') + ' roots computed only. The guides fall at x = 2, 3, 4, 5.' })
    + '<div class="col"><h3>How tight each trap is</h3>' + C.pRaw('For y up to 100, the bar is the number of decimal places on which the two decided fractions agree: those decimals of the root are decided. '
      + 'The dashed line is how many decimals the closest fraction with a denominator of at most ' + dv(STU, '/dmax') + ' shares with the computed root. Where the root is a whole number, the bar reaches the top line, labelled exact.') + '</div>'
    + C.figure({ svgRaw: TIGHT.svg, record: [LED, STU], stop: 'a closest fraction shares fewer decimals with the computed root than its decided bracket pins',
      caption: 'The bracket’s two fractions are the last two convergents with a denominator of at most one thousand. Where the next partial quotient is large, the closest fraction is far better than its size suggests, and the dashed line rises above the bar.' })
    + '<div class="col"><h3>Every continued fraction, at a glance</h3>' + C.pRaw('Each column is one root, for y from 2 to ' + HEAT_Y + '; each row is a partial quotient, the first at the top. '
      + 'The brighter a cell, the larger the quotient, and a large quotient means the convergent before it is an unusually good fraction. Near 27 and 256 the bright cells pile up at the top: there, the whole number is the fraction.') + '</div>'
    + C.figure({ svgRaw: figHeat(), record: STU, stop: 'a whole-number root’s column holds a quotient, or a computed root other than kᵏ is whole',
      caption: 'Every cell is computed: the quotients of the computed roots, kept where the 120- and 160-digit roots agree; a missing cell is a quotient the two did not agree on. A quotient of 1, the commonest, is the ground. The roots at 4, 27 and 256 have a single quotient, the whole number itself, and leave an empty column.' })
    + '<div class="col"><h3>The roots, in detail</h3></div>'
    + C.table({ cols: [{ h: 'y' }, { h: 'the root x' }, { h: 'closest fraction, q ≤ 1,000' }, { h: 'its error', cls: 'k' }, { h: 'the bracket' }, { h: 'both sides: here · claimbox', cls: 'k' }], rows: detailRows })
    + '<div class="col">' + C.pRaw('The root, the closest fraction and its error are the proposer’s, computed. The bracket is decided here, both sides; the first word is this page’s and the second claimbox’s record, each the same on both sides.') + '</div>'
    + '<div class="col">' + W.legendHtml({ compact: true }) + '</div>'
}));

/* §3 · what the fractions show */
const nearAt = (y, f) => '/near[y=' + y + ']/' + f;
const CHP = (i, f) => '/champions/rows/' + i + '/' + f;
const chRows = L.champions.rows.slice(0, 6).map((z, i) => [{ raw: dv(LED, CHP(i, 'y')) }, { raw: dv(LED, CHP(i, 'n'), 'int', 'the position in the continued fraction, counted from the computed quotients') },
  { raw: cv(LED, CHP(i, 'a'), 'int', WHY_CF) }, { raw: cv(LED, CHP(i, 'p'), 'raw', WHY_CF) + '/' + cv(LED, CHP(i, 'q'), 'raw', WHY_CF) }]);
if (L.champions.rows[0].y !== champ.y || L.champions.rows[0].a !== champ.a) die('the ledger\u2019s champions and the study\u2019s differ');
B.push(C.section({
  lab: '§3 · what the fractions show', title: 'Four things the continued fractions say', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Read from the computed roots. The brackets are decided; the patterns below are observations on computed numbers, and each is labelled as one. The first is a theorem, cited.')
    + '<h3>One: only kᵏ has a fraction for a root (a theorem, cited)</h3>'
    + C.pRaw('The root is a whole number exactly at y = ' + andList(EXACT.map((y, i) => dv(LED, '/exactRoots/' + i))) + ', and each is pinned from both sides: x ≥ k and x ≤ k, both certified here. '
      + 'For every other whole y the root is not even algebraic. If it were a fraction p/q in lowest terms with q above 1, then p' + sup('p') + ' = y' + sup('q') + '·q' + sup('p') + ', which q cannot divide; '
      + 'if it were an irrational algebraic number, xˣ would be transcendental by the Gelfond–Schneider theorem. That theorem is cited, not decided here, which is why the claim of §1’s last row is refused. So ' + dv(LED, '/counts/exactRoots') + ' roots are fractions, and every other one is a number no fraction will ever equal.')
    + '<h3>Two: near kᵏ, one enormous step (an observation)</h3>'
    + C.pRaw('Just off kᵏ the root sits just off k, by about 1/(kᵏ(1 + ln k)), the reciprocal of the slope of xˣ at k. Its continued fraction says so with one huge quotient: at y = ' + dv(STU, nearAt(255, 'y')) + ' it is ' + cv(STU, nearAt(255, 'quotient'), 'int', WHY_CF)
      + ', where the slope predicts ' + cv(STU, nearAt(255, 'predicted'), 'raw', 'kᵏ(1 + ln k) in floating point, as the study prints it') + '; at y = ' + dv(STU, nearAt(3126, 'y')) + ' it is ' + cv(STU, nearAt(3126, 'quotient'), 'int', WHY_CF)
      + ', against ' + cv(STU, nearAt(3126, 'predicted'), 'raw', 'kᵏ(1 + ln k) in floating point, as the study prints it') + '. The closest fraction there is the whole number k.') + '</div>'
    + C.figure({ svgRaw: figNear(), record: STU, stop: 'a row of the figure is not a root beside kᵏ',
      caption: 'Bars: the large partial quotient each root shows, computed. Dashed ticks: kᵏ·(1 + ln k), the slope of xˣ at k, computed in floating point. The x axis is logarithmic.' })
    + '<div class="col"><h3>Three: elsewhere, the roots look like typical numbers (an observation)</h3>'
    + C.pRaw('Pool the partial quotients of all the irrational roots and they follow the law that almost every real number obeys: a quotient of 1 occurs ' + cv(STU, '/stats/frequency/1', 'raw', WHY_STAT) + ' of the time, against the law’s '
      + cv(STU, '/stats/gaussKuzmin/1', 'raw', WHY_LAW) + '. Their geometric mean is ' + cv(STU, '/stats/geometricMean', 'raw', WHY_STAT) + ', against Khinchin’s constant ' + cv(STU, '/stats/khinchin', 'raw', WHY_LAW)
      + ', and (ln q' + '<sub>n</sub>)/n averages ' + cv(STU, '/stats/levyMean', 'raw', WHY_STAT) + ', against Lévy’s ' + cv(STU, '/stats/levy', 'raw', WHY_LAW) + '. These are observations on ' + dv(STU, '/count') + ' computed roots, not a proof.') + '</div>'
    + C.figure({ svgRaw: figGK(), record: STU, stop: 'a quotient other than 1 is the most frequent',
      captionRaw: 'Bars: how often each partial quotient occurs among the ' + cv(STU, '/stats/pooledQuotients', 'int', WHY_STAT) + ' pooled from the irrational roots, computed. Dashed ticks: the Gauss–Kuzmin law, log₂(1 + 1/(a(a + 2))), as the study prints it.' })
    + '<div class="col"><h3>Four: a few roots have fractions that are almost too good (an observation)</h3>'
    + C.pRaw('A large partial quotient makes the convergent just before it unusually close. The largest found is ' + cv(STU, '/stats/largest/0/a', 'int', WHY_CF) + ', in the root for y = ' + dv(STU, '/stats/largest/0/y') + '. '
      + 'Its convergent sits closer to the root than a fraction of its size usually can. For y = ' + dv(STU, at(100) + '/y') + ', the fraction ' + cv(STU, at(100) + '/closest/0') + '/' + cv(STU, at(100) + '/closest/1') + ' is already off by only ' + cv(STU, at(100) + '/error') + '.') + '</div>'
    + C.table({ cols: [{ h: 'y' }, { h: 'position' }, { h: 'partial quotient (computed)' }, { h: 'the convergent just before it (computed)' }], rows: chRows })
    + '<div class="col">' + W.legendHtml({ compact: true }) + '</div>'
}));

/* §4 · how it was done */
B.push(C.section({
  lab: '§4 · how it was done', title: 'Proposed, stated, decided',
  bodyRaw: C.plainList([
    { b: 'An AI model proposes.', raw: 'claude-opus-5-5 computed each root by Newton’s method, its continued fraction, and the two fractions that bracket it (claimbox’s tools/xx_study.py, copied here as evidence and never run). Computed, not trusted.' },
    { b: 'claimbox states.', raw: 'Each bracket became a claim in its language, xroot(n) &gt; p/q, with y read from a pinned file, and cert-machine’s receiver decided it there (claimbox’s check records, the second decision on this page). Eight planted wrong brackets went in with them.' },
    { b: 'cert-machine decides, again.', raw: 'tools/run-xx-ledger.py reads the copies of those records that LIFT-claimbox.json made (every file re-hashed against PROVENANCE-claimbox.json, which names the claimbox commit they came from), '
      + 'decides every side with code that shares nothing with claimbox or the receiver, refuses if any word differs from claimbox’s, and requires every planted bracket and every mutant to come out REFUTED: '
      + dv(LED, '/counts/redControlsFired') + ' of ' + dv(LED, '/counts/redControls') + ' red controls fired.' }
  ].concat(PROVED ? [{ b: 'Lean proves the step.', raw: 'The reduction from the root to the integer comparison is a Lean theorem, checked by two kernels on GitHub’s runners; the ledger re-hashes the Lean file against the run’s record before it names the theorems.' }] : [],
    [{ b: 'Our own claim is refused.', raw: 'One claim the pipeline cannot decide went in beside claimbox’s, and the decider refused it, with the reason and what would decide it written down (§1).' }]))
    + (PROVED
      ? C.pRaw('<b>What the decisions rest on.</b> Each verdict above is an exact integer comparison, and the step from the root to that comparison is <b>decided</b>: proved in Lean 4 with Mathlib (lean/xx-reduction). '
        + 'For a whole N ≥ 2, xˣ = N has exactly one positive real root (' + C.m(THM.unique[0]) + '), and for whole numbers 1 ≤ q ≤ p it lies above p/q exactly when p' + sup('p') + ' &lt; N' + sup('q') + '·q' + sup('p') + ' (' + C.m(THM.fraction.gt) + '; '
        + C.m(THM.fraction.ge) + ', ' + C.m(THM.fraction.lt) + ' and ' + C.m(THM.fraction.le) + ' for the other three comparisons, ' + C.m(THM.whole.ge) + ' and ' + C.m(THM.whole.le) + ' for a whole number). '
        + 'Every one of the ' + dFrom(String(LR.theorems.length), LREC + '#/theorems', 'the theorems of the Lean record, each PROVED') + ' theorems passes Lean’s kernel inside ' + C.m('lake build') + ', Lean’s kernel again inside Comparator on a fresh runner, and nanoda, a kernel written independently of Lean’s (<a href="' + C.escAttr(LR.run.url) + '">run ' + dv(LREC, '/run/id', 'raw') + '</a>), '
        + 'and depends on no axiom beyond propext, Classical.choice and Quot.sound. A fraction the study proposed is above 1 in lowest terms, so 1 ≤ q &lt; p; a whole-number bound is q = 1: every comparison on this page is inside the theorems. What is left is read or cited:')
      + W.premisesHtml([
        { grade: W.ASSUMED, label: 'Only a positive x counts as a root', evidence: 'the theorems speak of positive reals (Mathlib’s Real.rpow); what xˣ means for a negative x, and that no negative x is a root worth counting, is the convention claimbox’s library states (claimbox/library/selfpower.py, copied here); read, not decided' },
        { grade: W.ASSUMED, label: 'The recorder computes p' + sup('p') + ' and N' + sup('q') + '·q' + sup('p') + ' correctly', evidence: 'Python’s whole numbers in tools/run-xx-ledger.py; the theorems say what the comparison means, not that the code computes it. Tested by ' + dv(LED, '/counts/redControls') + ' red controls, not proved' },
        { grade: W.ASSUMED, label: 'Only kᵏ has a fraction for a root (§3, one)', evidence: 'the Gelfond–Schneider theorem, cited, with the two-line divisibility argument for a fraction; not decided here, and the claim of §1’s last row is refused for that reason' }
      ])
      : C.pRaw('<b>What the decisions rest on.</b> Each verdict above is an exact integer comparison. The step from the root to that comparison is an argument, read and not run by any machine here:')
      + W.premisesHtml([
        { grade: W.ASSUMED, label: 'The reduction: x > p/q exactly when p' + sup('p') + ' < N' + sup('q') + '·q' + sup('p') + ', for p/q above 1', evidence: 'xˣ ≤ 1 on (0, 1], strictly increasing on [1, ∞), and no negative real root: the argument written into claimbox’s library (claimbox/library/selfpower.py, copied here); read, not decided' },
        { grade: W.ASSUMED, label: 'Only kᵏ has a fraction for a root (§3, one)', evidence: 'the Gelfond–Schneider theorem, cited, with the two-line divisibility argument for a fraction; not decided here' }
      ]))
    + C.pRaw('<b>What is not claimed.</b> That the computed digits are right beyond the decided ones; that the observations of §3 are theorems; that the root of 64 is transcendental (true, cited, refused here); anything about a y the study did not decide. The study’s numbers are a proposer’s, and this page draws them dashed.')
    + W.legendHtml({ compact: true })
    + C.pRaw('Re-run: ' + C.m('python3 -I tools/run-xx-ledger.py --check') + ' · ' + C.m('make drift') + ' (the copies against claimbox) · in claimbox: ' + C.m('python3 -m claimbox check corpus/xxy/claims.claim --run')
      + (PROVED ? ' · the Lean proof: ' + C.m('.github/workflows/xx-reduction.yml') + ' on GitHub Actions, recorded by ' + C.m('node tools/record-xx-reduction.js <run>') : '') + '.')
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-xx.js from certs/xx-ledger.json (' + L.generated + ', re-derived at build) and the copies of claimbox’s records in corpus/claimbox-xx. MIT.') + '</p>';
const html = TPL.render({
  title: 'xˣ = y, by fractions · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/reports/xx.html',
  desc: 'The real root of x^x = y for every y to a thousand, computed by an AI model; ' + cnt.roots + ' of them trapped between two fractions, every side decided here by one exact integer comparison: '
    + cnt.CERTIFIED + ' of ' + cnt.claims + ' claims certified, the ' + cnt.planted + ' planted wrong brackets refuted, claimbox’s words the same on every claim'
    + (PROVED ? '; the step from the root to the comparison proved in Lean' : '') + '; ' + word(cnt.ownRefused) + ' claim of our own refused.'
});
fs.writeFileSync(path.join(ROOT, 'reports', 'xx.html'), html);
console.log('reports/xx.html written: ' + cnt.roots + ' roots, ' + cnt.CERTIFIED + ' of ' + cnt.claims + ' certified, ' + cnt.planted + ' planted refuted, ' + cnt.mutantsFlipped + ' mutants flipped @ git ' + git + ' (' + Math.round(html.length / 1024) + ' KB)');
