#!/usr/bin/env node
/* build-report-wsp.js — reports/weight-space-programming.html: MIT CSAIL's "Sparks of Weight-Space Programming"
   (Takehi, Teoh, Zhang, Khattab, 2026-11-02: GPT-6 Astra edits Qwen3.5-0.8B's weights with no training; MATH-500
   7.9 → 48.1, "131,072 weights, 0.016% of the model") — the edit decided from the bytes of the two checkpoints by two
   implementations sharing no code (certs/wsp-weights.json), and the released MATH-500 outputs re-graded by an exact
   three-valued grader against the claimants' flags (certs/wsp-regrade.json). Both records are re-checked before a word
   is written. The gaps lead, dated at the pin (2026-11-02). Every number is read from its record (W.val) or names the
   cells it was derived from.

   usage: node tools/build-report-wsp.js                                                                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const die = (m) => { console.error('WSP REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- both records re-check before a word is written ---- */
const BREC = 'certs/wsp-baseline.json', HAS_B = fs.existsSync(path.join(ROOT, BREC));   /* Stage 3, when it has run */
for (const [cmd, args] of [['node', ['tools/wsp-weights.js', '--check']], ['python3', ['-I', 'tools/wsp-regrade.py', '--check']], ...(HAS_B ? [['python3', ['-I', 'tools/wsp-baseline.py', '--check']]] : []), ...(fs.existsSync(path.join(ROOT, 'certs/wsp-side-claims.json')) ? [['python3', ['-I', 'tools/wsp-side-claims.py', '--check']]] : [])]) {
  const r = cp.spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) die(args[0] + ' does not re-check: ' + String(r.stderr || r.stdout).trim());
}
const WREC = 'certs/wsp-weights.json', RREC = 'certs/wsp-regrade.json';
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const R = J(WREC), G = J(RREC);
const Bx = HAS_B ? J(BREC) : null;
const SREC = 'certs/wsp-side-claims.json', HAS_S = fs.existsSync(path.join(ROOT, SREC));
const Sx = HAS_S ? J(SREC) : null;
if (Sx && !['M2', 'M3', 'M4a', 'M4b', 'M5a', 'M5b'].every((k) => Sx.claims[k] && Sx.claims[k].verdict)) die('the side-claims record lacks a claim the page lists');
if (Bx) {
  if (!Bx.conditions || !Object.keys(Bx.conditions).length) die('the baseline record holds no condition');
  for (const [c, d] of Object.entries(Bx.conditions)) if (d.n_problems !== 500) die('condition ' + c + ' did not cover the 500 problems');
  if (!/^(holds|overstated|mostly a settings effect|no verdict on the multiplier|NEEDS DATA)/.test(Bx.reading.verdict)) die('the baseline reading is not one of the pre-registered outcomes: ' + Bx.reading.verdict);
  if (Bx.not_cached && Bx.not_cached.length) die('the baseline record was written with conditions not cached');
}
const F = R.js.facts, V = R.verdicts;
const T15 = 'model.language_model.layers.15.mlp.down_proj.weight', T19 = 'model.language_model.layers.19.mlp.down_proj.weight';
const UN = G.post_runs.post_unedited, ED = G.post_runs.post_edited_50_passes;

/* ---- what the prose states, gated against the records ---- */
if (!R.deciders_agree) die('the two deciders disagree: ' + R.disagreements.join(', '));
if (V.W1 !== 'CERTIFIED' || V.W2 !== 'CERTIFIED' || V.W5 !== 'CERTIFIED' || V.W7 !== 'CERTIFIED') die('the page says W1, W2, W5 and W7 are CERTIFIED');
if (V.W3.printed_131072_as_entries_whose_bits_differ !== 'REFUTED' || V.W3.printed_131072_as_entries_in_the_64_columns !== 'CERTIFIED' || V.W3.manifest_130188 !== 'CERTIFIED') die('W3 is not as the page words it');
if (V.W4['131072/nominal_0.8B'] !== 'CERTIFIED' || V.W4['131072/all'] !== 'REFUTED' || V.W4['131072/language_model'] !== 'REFUTED') die('W4 is not as the page words it');
if (V.W6 !== 'REFUSED') die('the page says the one-direction witness is REFUSED (a failed search, no refutation)');
if (F.differ_in_bytes.length !== 2 || F.tensors.base !== 488 || F.tensors.edited !== 488) die('the tensor counts are not what the page says');
for (const n of [T15, T19]) if (F.per_tensor[n].changed_columns !== 64 || F.per_tensor[n].entries_in_those_columns !== 65536) die('a tensor is not 64 columns of 1,024');
if (!R.controls['flip-third'].caught || !R.controls['double-delta'].caught) die('a red control was not caught');
const WP = R.witness_proposer;
for (const n of [T15, T19]) { const q = WP[n].alpha_over_u_dot_Wc; if (!(q.min > 5.99 && q.max < 6.01)) die('the dose ratio is not within 6 ± 0.01 on ' + n); }
for (const run of [UN, ED]) {
  if (run.tally.their_1_our_WRONG !== 0 || run.tally.their_0_our_CORRECT !== 0) die('the page says the exact grader and math-verify agree on every decided first-sample answer');
  if (run.tally.extraction_differs !== 0) die('the page says our extraction agrees with theirs on every released text');
}
if (UN.tally.boxed !== UN.tally.boxed_their_1 || UN.tally.boxed_our_CORRECT !== UN.tally.boxed_decided) die('the page says every boxed unedited first sample is correct');
if (Math.abs(ED.acc_resummed_all_samples - ED.merged_printed.acc) > 5e-4 || Math.abs(UN.acc_resummed_all_samples - UN.merged_printed.acc) > 5e-4) die('the re-summed flags differ from the printed accuracies');
const CR = G.card_runs.card_rerun_edited;
if (Math.abs(CR.acc_resummed - CR.summary_printed.acc) > 5e-4 || CR.tally.their_1_our_WRONG || CR.tally.their_0_our_CORRECT) die('the card re-run is not as the page words it');
if (G.gold.n !== 500) die('MATH-500 has 500 problems');

/* ---- the marks ---- */
const dv = (file, ptr, fmt = 'int', why) => W.val({ rec: { path: file, ptr }, standing: W.DECIDED, fmt, why });
const cv = (file, ptr, fmt = 'raw', why) => W.val({ rec: { path: file, ptr }, standing: W.COMPUTED, fmt, why });
const dFrom = (text, cells, why) => W.value(C.esc(text), W.DECIDED, { derived: [].concat(cells), title: why });
const cFrom = (text, cells, why) => W.value(C.esc(text), W.COMPUTED, { derived: [].concat(cells), title: why });
const m = (s) => C.m(s);
const num = (n) => Number(n).toLocaleString('en-US');
const pct1 = (x) => (100 * x).toFixed(1) + '%';
const esc = (s) => C.esc(s);
const ptrT = (n, k) => '/js/facts/per_tensor/' + n + '/' + k;
const fr = (k) => '/js/facts/fraction/' + k.replace(/\//g, '~1') + '/';
const WHY_THEIRS = 'the claimants’ own flag or count, as released; read, not decided';
const WHY_DOSE = 'the proposer’s reading of the witness it found: α_c over uᵀW[:, c] per column, numpy float64; computed, not decided (the witness itself is REFUSED)';
const tally = (run, k, why) => dv(RREC, '/post_runs/' + run + '/tally/' + k, 'int', why);

/* the figure: first samples per run — boxed, their correct, our correct (decided) */
function figBoxed() {
  const rows = [];
  for (const [run, lab] of [['post_unedited', 'unedited'], ['post_edited_50_passes', 'edited, 50 passes']]) {
    const t = G.post_runs[run].tally;
    rows.push({ k: lab + ' · answered (a closed box)', v: t.boxed, lab: num(t.boxed) + ' of ' + num(t.n), token: 'var(--ink-3)' });
    rows.push({ k: lab + ' · correct, their grader', v: t.boxed_their_1, lab: num(t.boxed_their_1), token: 'var(--ink-5)' });
    rows.push({ k: lab + ' · correct, exact grader', v: t.boxed_our_CORRECT, lab: num(t.boxed_our_CORRECT) + ' of ' + num(t.boxed_decided) + ' decided', token: 'var(--ink)' });
  }
  return CH.bars({ w: 900, rows, max: 500, padL: 300, xTicks: [0, 100, 200, 300, 400, 500], xLabel: 'first-sample answers, of 500 MATH-500 problems',
    alt: 'Six bars. Unedited: ' + UN.tally.boxed + ' of 500 first samples end in a closed box, ' + UN.tally.boxed_their_1 + ' correct by their grader, ' + UN.tally.boxed_our_CORRECT + ' by the exact grader. Edited: ' + ED.tally.boxed + ' boxed, ' + ED.tally.boxed_their_1 + ' correct by theirs, ' + ED.tally.boxed_our_CORRECT + ' of ' + ED.tally.boxed_decided + ' decided by ours.' });
}

/* ---- Stage 3, the baseline record (when it exists): addresses, rows, the pre-registered reading ---- */
const NOT_CLAIMED = C.pRaw('<b>What is not claimed.</b> That the edit is small or large in effect beyond the released flags; that the mechanism is as described (read from the run’s notes, not probed here); anything about GSM8K, IFEval or the other benchmarks beyond re-reading their printed numbers; that math-verify is wrong anywhere (it agreed with the exact grader on every decided answer).');
const COND_WORDS = { C1: 'the post’s settings: temperature 0.6, top_p 0.95, presence penalty 1.5, 32,768 tokens, thinking on (the control)', C2: 'the card’s thinking-mode text settings: temperature 1.0, top_p 0.95, presence penalty 1.5, 81,920 tokens, thinking on',
  C3: 'the card’s non-thinking text settings: temperature 1.0, top_p 1.0, presence penalty 2.0, 32,768 tokens, thinking off', C4: 'the EDITED checkpoint under C2’s settings' };
const bA = (c, k) => BREC + '#/conditions/' + c + '/' + k;
const bv = (c, k, text, why) => dFrom(text, bA(c, k), why);
const pctOr = (x) => x == null ? '—' : pct1(x);
const RW = () => Bx.reading.verdict.split(':')[0].replace(/'/g, '’');
const floorMarks = () => Object.keys(Bx.conditions).filter((c) => c !== 'C4').map((c) => c + ' ' + bv(c, 'all_samples/acc_floor', pct1(Bx.conditions[c].all_samples.acc_floor), 'CORRECT over all samples of ' + c + ' (REFUSED counted wrong)')).join(', ');
function baselineTldr() {
  const parts = [];
  if (Bx.conditions.C3) parts.push(bv('C3', 'all_samples/acc_floor', pct1(Bx.conditions.C3.all_samples.acc_floor), 'CORRECT over all samples of C3 (REFUSED counted wrong)') + ' under the card’s non-thinking settings');
  if (Bx.conditions.C2) parts.push(bv('C2', 'all_samples/acc_floor', pct1(Bx.conditions.C2.all_samples.acc_floor), 'CORRECT over all samples of C2 (REFUSED counted wrong)') + ' under its thinking settings with 81,920 tokens');
  return 'With no edit, under Qwen’s own recommended settings (§4, run 2026-11-03), the base model scores ' + parts.join(' and ') + ' on MATH-500, against the post’s 7.9 and the edit’s 48.1'
    + (Bx.conditions.C1 ? '; the post’s own settings give ' + bv('C1', 'all_samples/acc_floor', pct1(Bx.conditions.C1.all_samples.acc_floor), 'CORRECT over all samples of C1 (REFUSED counted wrong)') + ' here' : '')
    + (Bx.conditions.C4 ? '; the edited checkpoint under the card’s thinking settings gives ' + bv('C4', 'all_samples/acc_floor', pct1(Bx.conditions.C4.all_samples.acc_floor), 'CORRECT over all samples of C4 (REFUSED counted wrong)') : '')
    + '. The pre-registered reading: ' + esc(RW()) + '.';
}
function g5Decided() {
  return 'Under the card’s settings the unedited model scores ' + floorMarks() + ' (all samples, REFUSED counted wrong; the decided-subset accuracies and the first-sample ones are in the table). The pre-registered reading: <b>' + esc(RW()) + '</b>.';
}
function condRow(c) {
  const d = Bx.conditions[c], f = d.first_sample, a = d.all_samples, mt = d.meta;
  return [c, COND_WORDS[c] + (mt.samples !== 4 ? ' — ' + mt.samples + ' sample' + (mt.samples === 1 ? '' : 's') + ' per problem, a stated deviation from the pre-registered 4' : ''), mt.model === 'edited' ? 'edited' : 'unedited',
    { raw: bv(c, 'first_sample/boxed_share', pct1(f.boxed_share), 'first samples ending in a closed box, over 500') },
    { raw: bv(c, 'first_sample/acc_decided', pctOr(f.acc_decided), 'CORRECT over CORRECT + WRONG among first samples (REFUSED neither)') + ' / ' + bv(c, 'first_sample/acc_floor', pct1(f.acc_floor), 'CORRECT over 500 first samples (REFUSED counted wrong)') },
    { raw: bv(c, 'all_samples/acc_decided', pctOr(a.acc_decided), 'CORRECT over CORRECT + WRONG among all samples') + ' / ' + bv(c, 'all_samples/acc_floor', pct1(a.acc_floor), 'CORRECT over all samples (REFUSED counted wrong)') },
    { raw: bv(c, 'all_samples/cut_share', pct1(a.cut_share), 'generations that reached max_tokens, over all samples') },
    { raw: bv(c, 'all_samples/mean_tokens', num(Math.round(a.mean_tokens)), 'mean generated tokens per sample, rounded') }];
}
function postRow(key, lab) {
  return ['', lab, key === 'post_unedited' ? 'unedited' : 'edited', '—', '—', { raw: cv(RREC, '/post_runs/' + key + '/merged_printed/acc', 'raw', WHY_THEIRS) + ' (printed, 4 samples)' },
    { raw: cv(RREC, '/post_runs/' + key + '/merged_printed/cut_share', 'raw', WHY_THEIRS) }, { raw: cv(RREC, '/post_runs/' + key + '/merged_printed/mean_tokens', 'raw', WHY_THEIRS) }];
}
/* ---- the two figures of §4, each gated by a re-derivation from the record and each with a red control ----
   Every number drawn is read from certs/wsp-baseline.json or certs/wsp-regrade.json at build time; the gates below
   re-derive what the figures draw from the record's own rows and refuse the page when the record disagrees with
   itself, and a planted wrong number must make each gate throw before the figures are drawn (the controls). */
const clone = (x) => JSON.parse(JSON.stringify(x));
/* a decimal string shifted two places (0.079 → 7.9): a printed fraction as a percent with no float in between */
const pctStr = (x) => { const s = String(x); if (!/^\d+(\.\d+)?$/.test(s)) die('not a decimal: ' + s); const [i, f = ''] = s.split('.'); const d = i + (f + '00').slice(0, 2), r = (f + '00').slice(2).replace(/0+$/, ''); return String(Number(d)) + (r ? '.' + r : ''); };
/* a count over a count as a percent to two decimals, rounded OUTWARD (a floor down, an upper end up), in integers */
const pctOut = (a, b, up) => (up ? Math.ceil(a * 10000 / b) : Math.floor(a * 10000 / b)) / 100;
const NBINS = 32;
const armTokens = (B, c) => { const t = []; for (const r of B.rows[c]) for (const s of r.samples) t.push(s.tokens); return t; };
/* the post's runs sit on the arm that reproduces their settings: both ran under the post's own sampling, which C1 repeats */
const POST_ON = { C1: [['post_unedited', 'the post’s unedited run'], ['post_edited_50_passes', 'the post’s edited run']] };
function gateLoop(B) {
  for (const c of Object.keys(B.rows)) {
    const d = B.conditions[c]; if (!d) throw new Error('rows for ' + c + ' with no condition');
    const cap = d.meta.sampling.max_tokens, a = d.all_samples, t = armTokens(B, c);
    if (t.length !== a.n) throw new Error(c + ': ' + t.length + ' samples in the rows, the tally says ' + a.n);
    if (t.some((x) => !(x >= 0 && x <= cap))) throw new Error(c + ': a sample is outside 0 … ' + cap);
    const atCap = t.filter((x) => x === cap).length;
    if (atCap !== a.cut) throw new Error(c + ': ' + atCap + ' samples at the cap, the tally says ' + a.cut);
    if (Math.abs(atCap / t.length - a.cut_share) > 5e-4) throw new Error(c + ': the cut share ' + a.cut_share + ' is not ' + atCap + '/' + t.length);
    const mean = t.reduce((s, x) => s + x, 0) / t.length;
    if (Math.abs(mean - a.mean_tokens) > 5e-4) throw new Error(c + ': the mean ' + a.mean_tokens + ' is not the rows’ ' + mean);
    if (t.reduce((s, x) => s + x, 0) !== a.tokens) throw new Error(c + ': the token sum is not the rows’');
  }
}
function readingEdges(B) {
  const m = /below (\d+(?:\.\d+)?)% HOLDS; (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)% OVERSTATED; (\d+(?:\.\d+)?)% or above MOSTLY A SETTINGS EFFECT/.exec(B.reading.rule);
  if (!m) throw new Error('the reading’s rule does not state the three bands');
  const e = m.slice(1).map(Number);
  if (e[0] !== e[1] || e[2] !== e[3] || !(e[0] < e[2])) throw new Error('the band edges in the rule disagree: ' + e.join(', '));
  return [e[0], e[2]];
}
function gateRuler(B, Gr) {
  const [e1, e2] = readingEdges(B), rd = B.reading, best = rd.best_no_edit_arm;
  if (!best || !rd.control_C1) throw new Error('the reading names no best no-edit arm or no control');
  const d = B.conditions[best.arm]; if (!d) throw new Error('the best arm ' + best.arm + ' is not a condition');
  const re = Math.max(d.first_sample.acc_floor, d.all_samples.acc_floor) * 100;
  if (Math.abs(re - best.percent) > 5e-3) throw new Error('the best arm’s ' + best.percent + ' does not re-derive (' + re + ')');
  if (!(best.percent >= d.all_samples.acc_floor * 100 - 5e-3 && best.percent <= d.all_samples.acc_decided * 100 + 5e-3)) throw new Error('the best arm’s percent is outside its floor-to-decided range');
  const c1 = B.conditions.C1; if (!c1) throw new Error('no control C1');
  if (Math.abs(rd.control_C1.all_samples_floor_percent - c1.all_samples.acc_floor * 100) > 5e-3) throw new Error('the control’s percent does not re-derive');
  if (rd.control_C1.within_3_points !== (Math.abs(rd.control_C1.all_samples_floor_percent - rd.control_C1.printed) <= 3)) throw new Error('the control’s stop rule is misapplied');
  if (Math.abs(rd.target_percent - Gr.post_runs.post_edited_50_passes.merged_printed.acc * 100) > 1e-9) throw new Error('the target is not the post’s printed edited accuracy');
  if (Math.abs(rd.control_C1.printed - Gr.post_runs.post_unedited.merged_printed.acc * 100) > 1e-9) throw new Error('the control’s printed number is not the post’s');
  const critic = Number((/The critic.s (\d+(?:\.\d+)?)%/.exec(rd.rule) || [])[1]);
  const k = rd.critic_47_non_thinking;
  if (!critic || !k || Math.abs(Math.abs(critic - k.C3_best_percent) - k.distance_points) > 5e-3) throw new Error('the critic’s number does not re-derive from the reading');
  if (rd.conditions.C3 && k.C3_best_percent !== rd.conditions.C3.best_percent) throw new Error('the critic’s C3 is not C3');
  const bandOf = (p) => (p < e1 ? 'holds' : p < e2 ? 'overstated' : 'mostly a settings effect');
  const expect = rd.control_C1.within_3_points ? bandOf(best.percent) : 'no verdict on the multiplier';
  if (rd.verdict.split(':')[0] !== expect) throw new Error('the verdict word “' + rd.verdict.split(':')[0] + '” is not the band the best arm falls in (' + expect + ')');
  if (!/^2026-11-03T12:40Z/.test(rd.amendment)) throw new Error('the amendment is not the one the page dates: ' + rd.amendment);
  return { e1, e2, critic };
}
if (Bx) {
  gateLoop(Bx);
  const c0 = Object.keys(Bx.rows)[0];
  const PA = clone(Bx); PA.conditions[c0].all_samples.cut_share = Number((PA.conditions[c0].all_samples.cut_share + 0.01).toFixed(3));
  let caughtA = false; try { gateLoop(PA); } catch (e) { caughtA = true; }
  if (!caughtA) die('red control: a cut share planted one point off on ' + c0 + ' was not caught by the loop figure’s gate');
  if (Bx.reading.best_no_edit_arm) {
    gateRuler(Bx, G);
    const PB = clone(Bx); PB.reading.best_no_edit_arm.percent = Number((PB.reading.best_no_edit_arm.percent - 10).toFixed(2));
    let caughtB = false; try { gateRuler(PB, G); } catch (e) { caughtB = true; }
    if (!caughtB) die('red control: the best arm’s percent planted ten points low was not caught by the ruler’s gate');
  }
}
const wrap = (s, n = 96) => { const out = []; let cur = ''; for (const w of s.split(' ')) { if (cur && (cur + ' ' + w).length > n) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) out.push(cur); return out; };
function figLoop() {
  const arms = Object.keys(Bx.rows).sort(), rows = [], alt = [], capt = [], postCap = [];
  for (const c of arms) {
    const d = Bx.conditions[c], cap = d.meta.sampling.max_tokens, a = d.all_samples, t = armTokens(Bx, c);
    const bw = cap / NBINS, bins = [];
    for (let i = 0; i < NBINS; i++) bins.push({ lo: i * bw, hi: (i + 1) * bw, n: 0 });
    for (const x of t) bins[Math.min(NBINS - 1, Math.floor(x / bw))].n++;         /* a sample at the cap lands in the last bin */
    const pts = [{ x: a.mean_tokens, t: 'mean ' + num(Math.round(a.mean_tokens)) + ', this run', standing: W.DECIDED, rec: { path: BREC, ptr: '/conditions/' + c + '/all_samples/mean_tokens' } }];
    const hmarks = [], post = [];
    for (const [run, lab] of (POST_ON[c] || [])) {
      const p = G.post_runs[run].merged_printed;
      hmarks.push({ y: p.cut_share * a.n, x0: cap - bw, x1: cap, t: lab + ', printed: ' + pctStr(p.cut_share) + '% at the cap', v: pctStr(p.cut_share) + '% of ' + num(a.n) + ', as printed', standing: W.COMPUTED, rec: { path: RREC, ptr: '/post_runs/' + run + '/merged_printed/cut_share' } });
      pts.push({ x: p.mean_tokens, t: lab + ', printed: mean ' + num(Math.round(p.mean_tokens)), v: num(Math.round(p.mean_tokens)) + ' tokens, as printed', standing: W.COMPUTED, row: pts.length, rec: { path: RREC, ptr: '/post_runs/' + run + '/merged_printed/mean_tokens' } });
      post.push(lab + ' prints ' + pctStr(p.cut_share) + '% at the cap and a mean of ' + num(Math.round(p.mean_tokens)));
      postCap.push(lab.replace('the post’s ', '') + ' ' + cFrom(pctStr(p.cut_share) + '%', RREC + '#/post_runs/' + run + '/merged_printed/cut_share', WHY_THEIRS) + ', mean ' + cFrom(num(Math.round(p.mean_tokens)), RREC + '#/post_runs/' + run + '/merged_printed/mean_tokens', WHY_THEIRS));
    }
    pts[0].v = num(Math.round(a.mean_tokens)) + ' tokens';
    const [head, ...rest] = COND_WORDS[c].split(': ');
    rows.push({ k: c + ' · ' + head, note: rest.length ? wrap(rest.join(': ')) : null, bins, x1: cap, xTicks: [0, 1, 2, 3, 4].map((i) => ({ v: i * cap / 4, t: num(i * cap / 4) })),
      cap: { x: cap, t: 'at the cap of ' + num(cap) + ': ' + num(a.cut) + ' of ' + num(a.n) + ' (' + pct1(a.cut_share) + ')' }, hmarks, pts });
    alt.push(c + ': ' + num(a.n) + ' samples, ' + num(a.cut) + ' at the cap of ' + num(cap) + ' tokens (' + pct1(a.cut_share) + '), mean ' + num(Math.round(a.mean_tokens)) + (post.length ? '; ' + post.join(', ') : ''));
    capt.push(c + ' ' + bv(c, 'all_samples/cut', num(a.cut), 'generations that reached max_tokens, over all samples of ' + c) + ' of ' + bv(c, 'all_samples/n', num(a.n), 'all samples of ' + c) + ' (' + bv(c, 'all_samples/cut_share', pct1(a.cut_share), 'generations that reached max_tokens, over all samples') + ')');
  }
  const svg = CH.hist({ w: 900, rows, unit: 'tokens', xLabel: 'tokens generated per sample',
    keys: [{ token: 'var(--ink)', t: 'samples per bin, generated here (decided)' }, { kind: 'line', token: 'var(--ink)', t: 'mean tokens, this run (solid)' }, { kind: 'dash', token: 'var(--ink-2)', t: 'the post’s printed run (read, dashed)' }, { kind: 'guide', token: CH.CTX, t: 'the token cap' }],
    alt: 'Tokens generated per sample, ' + NBINS + ' bins per arm from 0 to its cap. ' + alt.join('. ') + '.' });
  return C.figure({ svgRaw: svg, record: [BREC, RREC], stop: 'an arm’s samples re-counted from the record’s rows differ from its tallies (the count, the number at the cap, the share, the mean, the token sum), or a sample lies outside 0 to its cap',
    captionRaw: 'The loop, made visible: tokens generated per sample, every sample of the record in ' + NBINS + ' bins from 0 to the arm’s cap, the cap a dashed guide with the share at it beside it — ' + capt.join('; ') + '. '
      + 'On C1 the post’s own printed cut shares and mean lengths (their merged.json) sit as dashed read marks beside the decided bars: ' + postCap.join('; ') + '. The bins are counts, drawn no thinner than 1 px.' });
}
function figRuler() {
  const { e1, e2, critic } = gateRuler(Bx, G);
  const rd = Bx.reading, best = rd.best_no_edit_arm, d = Bx.conditions[best.arm], a = d.all_samples;
  const lo = pctOut(a.CORRECT, a.n, false), hi = pctOut(a.CORRECT, a.decided, true);
  if (Math.abs(lo - a.acc_floor * 100) > 0.01 || Math.abs(hi - a.acc_decided * 100) > 0.01) die('the best arm’s floor and decided accuracy do not re-derive from its counts');
  const un = pctStr(UN.merged_printed.acc), ed = pctStr(ED.merged_printed.acc), c1 = rd.control_C1.all_samples_floor_percent;
  const when = rd.amendment.replace(/^(\d{4}-\d\d-\d\d)T(\d\d:\d\d)Z.*$/, '$1 $2 UTC');
  const RP = (ptr) => ({ path: BREC, ptr: '/reading/' + ptr });
  const svg = CH.ruler({ w: 900, x0: 0, x1: 60, xTicks: [0, 10, 20, 30, 50, 60].map((v) => ({ v, t: String(v) + (v === 60 ? '%' : '') })), edges: [e1, e2],
    bands: [{ x0: 0, x1: e1, t: 'HOLDS', token: 'var(--rule-soft)' }, { x0: e1, x1: e2, t: 'OVERSTATED', token: 'var(--rule)' }, { x0: e2, x1: 60, t: 'MOSTLY A SETTINGS EFFECT', token: 'var(--rule-strong)' }],
    note: 'band edges ' + e1 + ' and ' + e2 + ' fixed ' + when + ' before any such token · MATH-500 accuracy, %',
    brackets: [{ x0: lo, x1: hi, t: best.arm + ' over all samples: floor ' + lo + ' … decided ' + hi, standing: W.DECIDED, row: 1, anchor: 'end', rec: { path: BREC, ptr: '/conditions/' + best.arm + '/all_samples/acc_floor' } }],
    marks: [
      { x: c1, t: 'C1, the control, measured here: ' + c1, standing: W.DECIDED, side: 'above', row: 0, anchor: 'start', rec: RP('control_C1/all_samples_floor_percent') },
      { x: best.percent, t: best.arm + ', the best no-edit arm: ' + best.percent, standing: W.DECIDED, side: 'above', row: 0, anchor: 'end', rec: RP('best_no_edit_arm/percent') },
      { x: Number(un), t: 'the post’s unedited run, printed: ' + un, standing: W.COMPUTED, side: 'below', row: 0, anchor: 'start', rec: { path: RREC, ptr: '/post_runs/post_unedited/merged_printed/acc' } },
      { x: Number(ed), t: 'the post’s edited run, printed: ' + ed, standing: W.COMPUTED, side: 'below', row: 0, anchor: 'end', rec: { path: RREC, ptr: '/post_runs/post_edited_50_passes/merged_printed/acc' } },
      { x: critic, t: 'the critic’s number, his run not shared: ' + critic, standing: W.COMPUTED, side: 'below', row: 1, anchor: 'end', rec: RP('critic_47_non_thinking/distance_points') }],
    keys: [{ kind: 'line', token: 'var(--ink)', t: 'measured here, decided (solid)' }, { kind: 'dash', token: 'var(--ink-2)', t: 'a printed number, read (dashed)' }],
    alt: 'A ruler from 0 to 60 percent. The three pre-registered bands: HOLDS below ' + e1 + ', OVERSTATED from ' + e1 + ' to ' + e2 + ', MOSTLY A SETTINGS EFFECT from ' + e2 + ', their edges fixed ' + when + '. Solid marks, measured here: the control C1 at ' + c1 + '; the best no-edit arm ' + best.arm + ' at ' + best.percent + ', its all-samples floor ' + lo + ' to its decided accuracy ' + hi + '. Dashed marks, read: the post’s ' + un + ' and ' + ed + ', the critic’s ' + critic + '.' });
  return C.figure({ svgRaw: svg, record: [BREC, RREC], stop: 'the band edges, the best arm’s percent, the control, the post’s two numbers or the critic’s distance do not re-derive from the records, or the verdict word is not the band the best arm falls in',
    captionRaw: 'The pre-registered ruler: the three bands of Amendment 1, fixed ' + esc(when) + ' before any C2/C3 token existed, and every number the reading weighs. Solid, measured here: the control C1 at ' + dv(BREC, '/reading/control_C1/all_samples_floor_percent', 'raw', 'CORRECT over all samples of C1, as a percent') + ' and the best no-edit arm ' + esc(best.arm) + ' at ' + dv(BREC, '/reading/best_no_edit_arm/percent', 'raw', 'the larger of the first-sample and the all-samples floor of the best card-settings arm') + ' (floor ' + bv(best.arm, 'all_samples/acc_floor', String(lo), 'CORRECT over all samples, as a percent, rounded down') + ' to decided ' + bv(best.arm, 'all_samples/acc_decided', String(hi), 'CORRECT over CORRECT + WRONG among all samples, as a percent, rounded up') + '). Dashed, read: the post’s ' + cFrom(un, RREC + '#/post_runs/post_unedited/merged_printed/acc', WHY_THEIRS) + ' and ' + cFrom(ed, RREC + '#/post_runs/post_edited_50_passes/merged_printed/acc', WHY_THEIRS) + ', the critic’s ' + cFrom(String(critic), BREC + '#/reading/critic_47_non_thinking/distance_points', 'a number in a thread, read from the reading’s rule; his run is REFUSED until shared') + ' — a number in a thread, his run not shared. The reading: ' + esc(RW()) + '.' });
}
function sec4Run() {
  const conds = Object.keys(Bx.conditions).sort(), first = Bx.conditions[conds[0]].meta;
  const dev = conds.filter((c) => Bx.conditions[c].meta.samples !== 4).map((c) => c + ' (' + Bx.conditions[c].meta.samples + ')');
  return C.section({
    lab: '§4 · the baseline', title: 'The unedited model under its maker’s settings, run and graded', wide: true,
    bodyRaw: C.pRaw('Pre-registered on 2026-11-02 (notes/wsp-stage3-preregistration-2026-11-02.md) before anything ran; run on 2026-11-03 on one rented ' + esc(first.gpu || 'GPU') + ' with vLLM ' + esc(first.versions.vllm) + ' (the version of the card’s own re-run) from the pinned checkpoints and MATH-500, the prompt and the chat template of the post’s own evaluate.py; '
      + dFrom(String(conds.length), BREC + '#/conditions', 'the conditions in the record') + ' conditions, ' + (dev.length ? 'four samples per problem except ' + esc(dev.join(', ')) + ' — a deviation from the pre-registration, stated here and in the record' : 'four samples per problem as pre-registered') + '; every generated text brought to the desk and graded by the grader of §3, ' + dv(RREC, '/gold/decidable') + ' of the 500 gold answers in its reach. '
      + 'Accuracy is given two ways, as pre-registered: on the decided subset (CORRECT over CORRECT + WRONG) and as a floor (REFUSED counted wrong). The record (certs/wsp-baseline.json) holds every verdict and every pin.')
      + C.table({ cols: [{ h: '' }, { h: 'condition' }, { h: 'model' }, { h: 'first samples answered' }, { h: 'first sample: decided / floor' }, { h: 'all samples: decided / floor' }, { h: 'hit the token limit' }, { h: 'mean tokens' }],
        rows: conds.map(condRow).concat([postRow('post_unedited', 'the post’s own unedited run, as printed (their settings = C1)'), postRow('post_edited_50_passes', 'the post’s edited run, as printed')]) })
      + figLoop()
      + C.pRaw('<b>The pre-registered reading, applied as written.</b> ' + esc(Bx.reading.rule) + ' Here: <b>' + esc(RW()) + '</b> — ' + floorMarks() + '.')
      + (Bx.reading.best_no_edit_arm ? figRuler() : '')
      + C.pRaw('<b>Read beside §3.</b> The control C1 is the post’s own protocol run again on the unedited model; the card’s settings are what Qwen tells users to run. Whatever the table says, the counting is the same exact grader on every row, and a REFUSED answer is listed in the record with its reason, never scored.')
      + NOT_CLAIMED
  });
}

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · Weight-Space Programming (MIT CSAIL) · found 2026-11-02 at RikiyaT/Qwen3.5-0.8B-weight-space-programming ' + R.claims.edited.revision.slice(0, 8),
  title: 'Weight-Space Programming: the edit decided from its bytes, the scores re-graded',
  deck: 'On 2 November 2026 Rikiya Takehi, Teoh, Zhang and Khattab (MIT CSAIL) published “Sparks of Weight-Space Programming”: a frontier model, GPT-6 Astra, edited Qwen3.5-0.8B’s weights directly, with no training, '
    + 'and MATH-500 went from 7.9% to 48.1%, “131,072 weights, 0.016% of the model”. They released the edited checkpoint, a bit-exact diff, their logs and their graded outputs. '
    + 'Here the edit is decided from the bytes of the two checkpoints by two implementations that share no code, and every released MATH-500 answer is re-graded by an exact three-valued grader against their flags. '
    + 'The edit is exactly what the diff says; two printed numbers are not what the bytes say; and the exact grading agrees with theirs on every decided answer.'
}));
B.push(C.scope('Published as a blog post, an X thread and a model card, not peer-reviewed. The checkpoints (Qwen/Qwen3.5-0.8B @ ' + R.claims.base.revision.slice(0, 8) + ', the edited release @ ' + R.claims.edited.revision.slice(0, 8)
  + '), the logs repository (RikiyaT/lm_understand-logs @ 4d09ba6d), MATH-500 (HuggingFaceH4 @ 6e4ed1a2) and Qwen’s model card were fetched 2026-11-02 and every file is pinned by sha256 in corpus/wsp/PINS.json. '
  + 'The claimants’ scripts (make_edit_diff.py, apply_edit.py, mathqa.py) were read as text and never run. What is decided: the tensor diff, its counts, its columns, the printed hashes, the first-sample answers. ' + (Bx ? 'What is run here (§4, 2026-11-03): the unedited model under the pre-registered conditions on one rented GPU, every text graded by the same exact grader. What is read: the post’s own benchmark scores, the mechanism.' : 'What is read: the benchmark scores themselves (no model was run here), the mechanism, the baseline’s settings.')));

B.push(C.tldr({
  findingRaw: '<b>The edit is real and exactly as released; the two printed sizes are off; the scores re-grade identically.</b> '
    + 'Exactly ' + dFrom('two', WREC + '#/js/facts/differ_in_bytes', 'the tensors whose bytes differ, listed by both deciders') + ' of ' + dv(WREC, '/js/facts/tensors/base') + ' tensors differ, the two the card names, and their sha256 are the printed ones. '
    + 'The entries whose bits differ number ' + dv(WREC, '/js/facts/changed_entries_total') + ', not 131,072 (that is the ' + dv(WREC, '/js/facts/entries_in_changed_columns_total') + ' entries of the 64 columns the edit addressed, of which '
    + dFrom(num(F.entries_in_changed_columns_total - F.changed_entries_total), [WREC + '#/js/facts/entries_in_changed_columns_total', WREC + '#/js/facts/changed_entries_total'], 'the addressed entries less those whose bits differ') + ' round back to the original value — their own manifest says so). '
    + 'The “0.016% of the model” is 131,072 over the round number 0.8 B: over the release’s actual ' + dv(WREC, '/js/facts/parameters/all') + ' parameters it is ' + dv(WREC, fr('131072/all') + 'percent_rounded_3dp', 'raw') + '%, over the language model’s ' + dv(WREC, '/js/facts/parameters/language_model') + ' it is '
    + dv(WREC, fr('131072/language_model') + 'percent_rounded_3dp', 'raw') + '%. The edit is not “the direction subtracted” but six times its projection removed — the component along it reversed and amplified five-fold (the run’s own formula; the bytes show the ratio '
    + cv(WREC, '/witness_proposer/' + T15 + '/alpha_over_u_dot_Wc/mean', 'fixed:3', WHY_DOSE) + ' and ' + cv(WREC, '/witness_proposer/' + T19 + '/alpha_over_u_dot_Wc/mean', 'fixed:3', WHY_DOSE) + '). '
    + 'Of the post’s 500 unedited first samples only ' + tally('post_unedited', 'boxed') + ' end in a closed box, and every one of them is correct; of the edited run’s, ' + tally('post_edited_50_passes', 'boxed') + ' do, ' + tally('post_edited_50_passes', 'boxed_their_1') + ' correct. '
    + 'The gain is termination. ' + (Bx ? baselineTldr() : 'Whether a looping baseline under the post’s settings is the right denominator for “6×” is the open question (§1, G5): Qwen’s own card warns the 0.8B loops under those settings and recommends others.'),
  mechanismRaw: 'Two checkpoints, parsed from their safetensors headers, compared tensor by tensor as bytes and — where a dtype could differ — as exact rationals; the changed entries counted, their rows and columns listed, the parameter counts summed from the shapes, '
    + 'every fraction kept as an exact rational and rounded once to three decimals; a rank-1 witness (u, α) proposed by an SVD and an interval search, then checked entry by entry in binary32 arithmetic with round-to-nearest-even to bfloat16; '
    + 'a three-valued grader that canonicalises an answer to an exact object (rationals, radicals, multiples of π, complex numbers, tuples, degrees, base-n literals, words) or refuses it, run on every released answer string and text.',
  checkRaw: m('node tools/wsp-weights.js --check') + ' re-derives every fact and both red controls from the cached checkpoints (' + dFrom(String(R.seconds), WREC + '#/seconds', 'the record’s own run time') + ' s to record; the 2.5 GB of inputs are fetched by the pins, not kept in git); '
    + m('python3 -I tools/wsp-regrade.py --check') + ' re-grades every released answer (seconds).'
}));
B.push(C.stats([
  { k: 'tensors that differ', v: '2 of ' + num(F.tensors.base), n: 'layers 15 and 19, mlp.down_proj; sha256 as printed on the card and in the diff manifest.' },
  { k: 'entries whose bits differ', v: num(F.changed_entries_total), n: 'of the ' + num(F.entries_in_changed_columns_total) + ' entries in 64 columns × 1,024 rows × 2 tensors the edit addressed; the post prints 131,072.' },
  { k: '“0.016% of the model”', v: F.fraction['131072/all'].percent_rounded_3dp + '% / ' + F.fraction['131072/language_model'].percent_rounded_3dp + '%', n: 'over the release’s ' + num(F.parameters.all) + ' parameters / the language model’s ' + num(F.parameters.language_model) + '; 0.016% only over a round 0.8 B.' },
  { k: 'first-sample answers re-graded', v: num(UN.tally.n + ED.tally.n), n: num(UN.tally.decided + ED.tally.decided) + ' decided, ' + num(UN.tally.refused + ED.tally.refused) + ' refused by the exact grader; 0 disagreements with math-verify on the decided ones.' }
]));

/* §1 the gaps */
B.push(C.section({
  lab: '§1 · the gaps', title: 'What the post states and the bytes do not, dated at the pin',
  bodyRaw: [
    C.note({ lab: 'G1 · count · found 2026-11-02', bodyRaw: C.pRaw('<b>“131,072 weights” is the addressed count, not the changed count.</b> The post and the card say the edit “directly changed only 0.016% of weights”, 131,072 of them. '
      + 'Both deciders count ' + dv(WREC, '/js/facts/changed_entries_total') + ' bfloat16 entries whose bits differ (' + dv(WREC, ptrT(T15, 'changed_entries')) + ' in layer 15, ' + dv(WREC, ptrT(T19, 'changed_entries')) + ' in layer 19); 131,072 is 64 columns × 1,024 rows × 2, the entries the edit touched, '
      + 'of which ' + dFrom(num(F.entries_in_changed_columns_total - F.changed_entries_total), [WREC + '#/js/facts/entries_in_changed_columns_total', WREC + '#/js/facts/changed_entries_total'], 'the addressed entries less those whose bits differ') + ' round back to their original bfloat16 value. '
      + 'The claimants’ own edit manifest counts 130,188 and says why in a note; the post rounds the other way. A reading, not a refutation of substance: the edit is what it says.')
      + C.pRaw('<b>What would close it.</b> One clause in the post: “131,072 weights addressed, 130,188 changed”.') }),
    C.note({ lab: 'G2 · fraction · found 2026-11-02', bodyRaw: C.pRaw('<b>“0.016% of the model” divides by the model’s name, not its parameter count.</b> 131,072 over 800,000,000 is ' + dv(WREC, fr('131072/nominal_0.8B') + 'percent_rounded_3dp', 'raw') + '%. '
      + 'The release is image-text-to-text and holds ' + dv(WREC, '/js/facts/parameters/all') + ' parameters (' + dv(WREC, '/js/facts/parameters/visual') + ' in the vision tower, ' + dv(WREC, '/js/facts/parameters/language_model') + ' in the language model, of which ' + dv(WREC, '/js/facts/parameters/embed_tokens') + ' are the tied embedding): '
      + 'the fraction is ' + dv(WREC, fr('131072/all') + 'percent_rounded_3dp', 'raw') + '% of the release, ' + dv(WREC, fr('131072/language_model') + 'percent_rounded_3dp', 'raw') + '% of the language model the post evaluated, ' + dv(WREC, fr('131072/language_model_minus_embed') + 'percent_rounded_3dp', 'raw') + '% of its non-embedding weights. '
      + 'Every one of these is an exact rational in the record (' + dv(WREC, fr('131072/language_model') + 'fraction', 'raw') + ' for the language model), rounded once.')
      + C.pRaw('<b>What would close it.</b> Name the denominator.') }),
    C.note({ lab: 'G3 · dose · found 2026-11-02', bodyRaw: C.pRaw('<b>The direction is not subtracted; six times its projection is.</b> The post says Astra “subtracted that direction from 64 output columns in each” layer. The run’s own notes state the formula, W = W₀ − 6·u(uᵀW₀) on the 64 columns, and the bytes agree: '
      + 'the ratio of the witness’s per-column coefficient to the column’s projection on u is ' + cv(WREC, '/witness_proposer/' + T15 + '/alpha_over_u_dot_Wc/mean', 'fixed:3', WHY_DOSE) + ' ± ' + cv(WREC, '/witness_proposer/' + T15 + '/alpha_over_u_dot_Wc/std', 'sig:2', WHY_DOSE) + ' in layer 15 and '
      + cv(WREC, '/witness_proposer/' + T19 + '/alpha_over_u_dot_Wc/mean', 'fixed:3', WHY_DOSE) + ' ± ' + cv(WREC, '/witness_proposer/' + T19 + '/alpha_over_u_dot_Wc/std', 'sig:2', WHY_DOSE) + ' in layer 19. '
      + 'So the component of each edited column along the “loop direction” is not removed: it is reversed and amplified five-fold. Astra reached that dose by trials (strength 1, 2, 3, 4, 6 in its history) and the post does not say so. The relative change of the two tensors is about a tenth (their manifest: 0.106 and 0.081).')
      + C.pRaw('<b>What would close it.</b> The formula in the post, with its dose.') }),
    C.note({ lab: 'G4 · evidence · found 2026-11-02', bodyRaw: C.pRaw('<b>The texts behind most of the 2,000 graded answers are not released.</b> The post’s MATH-500 score is the mean over 4 samples of 500 problems. The logs hold every sample’s correctness flag and, for the first sample only, the extracted answer string (500 per run) and the full text for 20 problems per shard (200 per run). '
      + 'The model card’s independent re-run (51.0%) releases its 2,000 flags and 20 texts. So what can be re-graded is ' + dFrom(num(UN.tally.n + ED.tally.n), [RREC + '#/post_runs/post_unedited/tally/n', RREC + '#/post_runs/post_edited_50_passes/tally/n'], 'the first-sample answer strings of the two runs') + ' first-sample answers and '
      + dFrom(num(UN.tally.texts + ED.tally.texts + CR.tally.texts + G.card_runs.card_smoke_base.tally.texts), [RREC + '#/post_runs/post_unedited/tally/texts', RREC + '#/post_runs/post_edited_50_passes/tally/texts', RREC + '#/card_runs/card_rerun_edited/tally/texts', RREC + '#/card_runs/card_smoke_base/tally/texts'], 'the released full texts') + ' texts; the flags re-sum to the printed accuracies exactly ('
      + dFrom(ED.acc_resummed_all_samples.toFixed(4), RREC + '#/post_runs/post_edited_50_passes/acc_resummed_all_samples', 'the mean of the 2,000 released flags, to four decimals') + ' against the printed ' + cv(RREC, '/post_runs/post_edited_50_passes/merged_printed/acc', 'raw', WHY_THEIRS) + ').')
      + C.pRaw('<b>What would close it.</b> The 2,000 generations per run, as the card’s re-run released its flags.') }),
    C.note({ lab: Bx ? 'G5 · baseline · decided 2026-11-03 (§4)' : 'G5 · baseline · a reading, not decided', bodyRaw: C.pRaw('<b>The 7.9% baseline is a looping regime that the base model’s own card warns about.</b> Under the post’s settings (temperature 0.6, 32,768 tokens) ' + cFrom(pct1(UN.merged_printed.cut_share), RREC + '#/post_runs/post_unedited/merged_printed/cut_share', 'the claimants’ own cut share, as printed in their merged.json; read, not decided') + ' of the unedited MATH-500 answers hit the token limit (their merged.json). '
      + 'Qwen’s model card for Qwen3.5-0.8B, pinned at the same revision, says: “In thinking mode, we have observed that when using the recommended sampling parameters, Qwen3.5-0.8B is more prone to entering thinking loops compared to other Qwen3.5 models”; its recommended thinking-mode text settings are temperature 1.0 with 81,920 output tokens for competition math, and its own table reports IFEval 44.0 (thinking) / 52.1 (non-thinking) for the base model against the post’s 21.0. '
      + 'The multipliers in the post (“6×”, “3×”) are measured against that baseline. The edited IFEval 62.3 is above the card’s numbers, so the edit does something real; ' + (Bx ? 'how much of 7.9 → 48.1 a no-edit configuration recovers was decided here on 2026-11-03 by one GPU run (§4), pre-registered the day before.' : 'how much of 7.9 → 48.1 a no-edit configuration recovers is not decided here. It would be by one GPU run (§4), pre-registered and not yet made.'))
      + (Bx ? C.pRaw('<b>Closed 2026-11-03.</b> ' + g5Decided()) : C.pRaw('<b>What would close it.</b> The unedited model under the card’s settings, on the same grader, beside the post’s table.')) }),
    C.note({ lab: 'G6 · selection · a reading', bodyRaw: C.pRaw('<b>48.1 is one run of several.</b> The logs’ results table lists the three prompt-v3 runs the post reports (10, 25, 50 passes: 12.3, 14.1, 48.1 on MATH-500), two prompt-v4 runs (7.9 with no edit submitted; 14.1), earlier runs that submitted no edit, and prompt-v5 runs still pending. No variance across runs of the same budget is reported. '
      + 'The same table records the follow-up on Gemma 3 270M, a model that does not loop (8.5% of answers at the limit): fifty passes moved MATH-500 from 6.8 to 7.0 under lenient grading, within noise. Read together with §3: where there is no loop to break, the method found nothing to gain.') })
  ].join('\n')
}));

/* §2 the weights */
const W_ROWS = [
  ['W1', 'the same tensors in both checkpoints (names, shapes, dtypes)', num(F.tensors.base) + ' tensors each; no name, shape or dtype differs', V.W1],
  ['W2', 'exactly two tensors differ: layers 15 and 19 mlp.down_proj', F.differ_in_bytes.map((n) => n.replace('model.language_model.', '')).join(', ') + '; every other tensor byte-identical', V.W2],
  ['W3', '“131,072 weights” as the entries whose bits differ', num(F.changed_entries_total) + ' differ (' + num(F.per_tensor[T15].changed_entries) + ' + ' + num(F.per_tensor[T19].changed_entries) + '); their manifest’s 130,188 CERTIFIED', V.W3.printed_131072_as_entries_whose_bits_differ],
  ['W3′', '131,072 as the entries of the 64 addressed columns', '64 × 1,024 × 2 = ' + num(F.entries_in_changed_columns_total), V.W3.printed_131072_as_entries_in_the_64_columns],
  ['W4', '“0.016%” over the release / the language model / its non-embedding weights', F.fraction['131072/all'].percent_rounded_3dp + '% / ' + F.fraction['131072/language_model'].percent_rounded_3dp + '% / ' + F.fraction['131072/language_model_minus_embed'].percent_rounded_3dp + '%', V.W4['131072/all']],
  ['W4′', '“0.016%” over a round 0.8 B', F.fraction['131072/nominal_0.8B'].percent_rounded_3dp + '%', V.W4['131072/nominal_0.8B']],
  ['W5', 'the changed entries lie in exactly 64 columns per tensor, the ones the run’s manifest names', '64 and 64 columns; ' + num(F.per_tensor[T15].changed_rows) + ' and ' + num(F.per_tensor[T19].changed_rows) + ' of 1,024 rows', V.W5],
  ['W6', 'one direction: a witness (u, α) with bf16(W − u·α_c) = W′ on every changed column', 'the best witness found reproduces all but ' + num(F.witness[T15].mismatches) + ' and ' + num(F.witness[T19].mismatches) + ' of 65,536 entries per tensor (each within ' + Number(Math.max(F.witness[T15].mismatch_max_abs_difference, F.witness[T19].mismatch_max_abs_difference)).toExponential(1) + ' in absolute value, at entries where the subtraction nearly cancels); a failed search refutes nothing', V.W6],
  ['W7', 'the printed sha256 of both edited tensors (the card) and both base tensors (the manifest)', 'all four equal the bytes', V.W7]
];
B.push(C.section({
  lab: '§2 · the weights', title: 'Seven sub-claims, each decided by two implementations', wide: true,
  bodyRaw: C.table({ cols: [{ h: '' }, { h: 'claim' }, { h: 'what the bytes say' }, { h: 'verdict' }], rows: W_ROWS.map((r) => [r[0], r[1], r[2], { raw: C.tag(r[3].split('-')[0].split(',')[0]) }]) })
    + C.pRaw('The sub-claims were written to corpus/wsp/claims.json before either decider ran. The Python decider (standard library: struct, mmap, array, Fraction) and the JavaScript one (Buffer, Uint16Array, Math.fround, BigInt) read the safetensors headers and the raw bytes themselves and agree on every count, column, hash and verdict. '
      + 'Two red controls must come out wrong and do: one bit flipped in a third tensor (' + esc(R.controls['flip-third'].expected) + ') and the layer-15 delta doubled (' + esc(R.controls['double-delta'].expected) + ').')
    + C.pRaw('<b>W6, in words.</b> Astra’s own float32 submission was rank-1 to float32 precision (its manifest reports a directional residual of 2.5·10⁻⁷); the released checkpoint is that submission rounded to bfloat16, which adds a relative noise of about 2⁻⁹ to every entry. '
      + 'An SVD of the delta recovers the direction to that noise, and an interval search (every edited entry fixes the binary32 interval that rounds to it) brings the witness to within ' + dv(WREC, '/js/facts/witness/' + T15 + '/mismatches') + ' + ' + dv(WREC, '/js/facts/witness/' + T19 + '/mismatches') + ' entries of exact. '
      + 'The claim is CERTIFIED only with a witness that reproduces every entry; none was found, so it is REFUSED — which is a limit of the search, stated as such, not a finding against the edit.')
}));

/* §3 the scores */
const runRow = (key, lab) => {
  const r = G.post_runs[key], t = r.tally;
  return [lab, { raw: cv(RREC, '/post_runs/' + key + '/merged_printed/acc', 'raw', WHY_THEIRS) }, { raw: dFrom(r.acc_resummed_all_samples.toFixed(4), RREC + '#/post_runs/' + key + '/acc_resummed_all_samples', 'the mean of the 2,000 released flags, to four decimals') },
    { raw: tally(key, 'boxed') + ' of ' + tally(key, 'n') }, { raw: tally(key, 'boxed_their_1', WHY_THEIRS) }, { raw: tally(key, 'boxed_our_CORRECT') + ' of ' + tally(key, 'boxed_decided') + ' decided' },
    { raw: tally(key, 'agree') + ' of ' + tally(key, 'decided') + '; ' + tally(key, 'refused') + ' refused' }];
};
B.push(C.section({
  lab: '§3 · the scores', title: 'Every released answer re-graded: the gain is termination', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The grader here (instruments/wsp/grade.py) reads the last closed ' + m('\\boxed{}') + ' itself, canonicalises both the prediction and MATH-500’s answer to an exact object, and says CORRECT, WRONG or REFUSED. It refuses what it will not canonicalise — an expression, an interval, a unit, a percentage against a bare number, a base-n literal against a bare number, the same elements in another order — rather than guess; '
    + dv(RREC, '/gold/decidable') + ' of the 500 gold answers are in its reach. The claimants graded with math-verify 0.9.0 on the same box.') + '</div>'
    + C.table({ cols: [{ h: 'run (the post’s logs)' }, { h: 'MATH-500, printed' }, { h: 'the 2,000 flags re-summed' }, { h: 'first samples ending in a box' }, { h: 'of those, correct (theirs)' }, { h: 'of those, correct (exact)' }, { h: 'decided answers: agreement with theirs' }],
      rows: [runRow('post_unedited', 'unedited'), runRow('post_edited_50_passes', 'edited, 50 passes')] })
    + C.figure({ svgRaw: figBoxed(), record: RREC, stop: 'a decided first-sample answer is graded differently by the exact grader and by math-verify',
      caption: 'First samples of the 500 MATH-500 problems, per run. Answered: a closed box in the response. The unedited model answers ' + UN.tally.boxed + ' and is right ' + UN.tally.boxed_their_1 + ' times; the edited one answers ' + ED.tally.boxed + ' and is right ' + ED.tally.boxed_their_1 + '. The exact grader decides ' + ED.tally.boxed_decided + ' of the edited boxed answers and agrees with math-verify on every one.' })
    + '<div class="col">' + C.pRaw('<b>Read exactly.</b> The unedited model, when it finishes, is right: ' + tally('post_unedited', 'boxed') + ' first samples end in a box and all ' + tally('post_unedited', 'boxed_their_1', WHY_THEIRS) + ' are correct by both graders. '
      + 'The edited model finishes ' + tally('post_edited_50_passes', 'boxed') + ' times and is right ' + tally('post_edited_50_passes', 'boxed_their_1', WHY_THEIRS) + ' of them (' + dFrom(pct1(ED.acc_given_boxed_theirs), RREC + '#/post_runs/post_edited_50_passes/acc_given_boxed_theirs', 'their correct boxed first samples over their boxed first samples') + '). '
      + 'So the edit does not make the model better at the problems it already finishes; it makes it finish — which is exactly the mechanism the authors describe (a “loop direction” written by two MLPs) and exactly why a baseline that does not loop (§1, G5, G6) is the number the “6×” needs.')
    + C.pRaw('<b>The card’s independent re-run.</b> akhaliq’s re-run of the edited checkpoint prints ' + cv(RREC, '/card_runs/card_rerun_edited/summary_printed/acc', 'raw', WHY_THEIRS) + '; its 2,000 flags re-sum to ' + dFrom(CR.acc_resummed.toFixed(3), RREC + '#/card_runs/card_rerun_edited/acc_resummed', 'the mean of the released flags, to three decimals') + '. '
      + 'Its ' + dv(RREC, '/card_runs/card_rerun_edited/tally/texts') + ' released texts re-extract and re-grade as flagged (' + dv(RREC, '/card_runs/card_rerun_edited/tally/decided') + ' decided, ' + dv(RREC, '/card_runs/card_rerun_edited/tally/agree_with_first_flag') + ' agree); the 25-problem base smoke test likewise (' + dv(RREC, '/card_runs/card_smoke_base/tally/decided') + ' decided, all agree).')
    + C.pRaw('<b>Extraction.</b> On all ' + dFrom(num(UN.tally.texts + ED.tally.texts), [RREC + '#/post_runs/post_unedited/tally/texts', RREC + '#/post_runs/post_edited_50_passes/tally/texts'], 'the released first-sample texts of the two runs') + ' released texts of the post’s runs, the last box read here equals the answer string their pipeline extracted. The '
      + tally('post_edited_50_passes', 'refused') + ' refused edited answers are listed in the record with the reason each (a unit after the number, an equation for a number, a matrix, an interval, two multiple-choice letters, an order).') + '</div>'
    + '<div class="col">' + W.legendHtml({ compact: true }) + '</div>'
}));

/* §4 the baseline: run (certs/wsp-baseline.json) or pre-registered and not run */
if (Bx) B.push(sec4Run()); else B.push(C.section({
  lab: '§4 · the baseline', title: 'What would decide the multiplier, and is not run',
  bodyRaw: C.pRaw('The question G5 leaves open has one answer: the unedited Qwen3.5-0.8B on MATH-500, four samples per problem, the grader of §3, under three conditions side by side — the post’s settings (a control that should reproduce about 7.9), the card’s thinking-mode text settings (temperature 1.0, 81,920 tokens), and the card’s non-thinking settings. '
    + 'It is pre-registered in notes/wsp-stage3-preregistration-2026-11-02.md with its stop rule and costs about US$15–30 of GPU time. It has not been run: a paid run is the operator’s word, and this page says so rather than guess the number. When it runs, its record (certs/wsp-baseline.json) is added here and the gaps above are re-dated.')
    + NOT_CLAIMED
}));

/* §4b the side claims of the public argument, decided from the released logs (certs/wsp-side-claims.json) */
if (Sx) {
  const tagOf = (v) => v.split(/ · /).map((w) => C.tag(w.split(' ')[0].split('(')[0])).join(' ');
  const row = (k) => { const c = Sx.claims[k]; return [k, esc(c.claim.replace(/^M\d[ab]? — /, '')), { raw: tagOf(c.verdict) + ' ' + dFrom(c.verdict, SREC + '#/claims/' + k + '/verdict', 'the verdict as the record words it') }, esc(c.reason)]; };
  B.push(C.section({
    lab: '§4b · the public argument', title: 'The critic’s checkable claims, decided from the authors’ own logs', wide: true,
    bodyRaw: C.pRaw('A viral thread answered the post with claims about the other experiments and about how the math edit was found. The ones that rest on released bytes are decided here from the logs the authors published (RikiyaT/lm_understand-logs @ 4d09ba6d; ' + dFrom(num(Object.keys(Sx.pins).length), SREC + '#/pins', 'the files read, each pinned by sha256') + ' files pinned; nothing of the claimants’ run, their .npz parsed with the standard library). '
      + 'A claim with no released source is REFUSED as a limit, not as a finding against whoever made it. The critic’s one number about the math — 47% with no edit in non-thinking mode — is a question for §4, not for the logs.')
      + C.table({ cols: [{ h: '' }, { h: 'claim' }, { h: 'verdict' }, { h: 'what the logs say' }], rows: ['M2', 'M3', 'M4a', 'M4b', 'M5a', 'M5b'].map(row) })
      + C.pRaw('<b>Read exactly.</b> The dose was chosen over thousands of answers — on practice problems from the GSM8K and MATH training splits, never on a MATH-500 problem, by id or by text (M2): the number the critic implies, tuning on the test set, is not in the logs. The game-identification scoring did credit “Frogger” as “Freeway” under a keyword rule the README states (M3). The car policy was edited to weights in the hundreds and evaluated on one level over 1,280 episodes, not one replay (M4). The PPO comparisons and the two lost games are in the released tables as stated; “weak” has no criterion to decide (M5a). The sycophancy round failed from the weights alone, in the authors’ own words (M5b).')
  }));
}

/* §5 method, independence, what it rests on */
B.push(C.section({
  lab: '§5 · how it was done', title: 'Read, stated, decided',
  bodyRaw: C.plainList([
    { b: 'Pinned.', raw: 'Both checkpoints at their revisions, the logs repository at its commit, MATH-500 at its revision and Qwen’s card: ' + Object.keys(J('corpus/wsp/PINS.json').files).length + ' files, each sha256 in corpus/wsp/PINS.json; the record names the pins file and its hash.' },
    { b: 'Stated first.', raw: 'The sub-claims W1–W7 (corpus/wsp/claims.json) name the tensors, the counts, the columns and the hashes the claimants print, before either decider ran.' },
    { b: 'Decided twice.', raw: 'instruments/wsp/weights.py and tools/wsp-weights.js share no code and no library (no safetensors, no numpy, no torch); each parses the container, compares the bytes, counts, hashes and checks the witness in binary32 with its own bfloat16 rounding. The record holds both outputs and refuses to be written if they differ.' },
    { b: 'Proposed, not trusted.', raw: 'tools/wsp-witness.py (numpy) proposes the rank-1 witness; the deciders only check it. Its readings (the dose ratio, the SVD residual) are printed dashed, computed.' },
    { b: 'Graded exactly, once.', raw: 'instruments/wsp/grade.py is one implementation, standard library; it was tested on the 500 gold answers and on hand-written pairs, and every disagreement it could have had with math-verify would be listed in the record with the text. There are none on the decided answers; a second grader is the first thing a re-run would add.' },
    { b: 'Independence.', raw: 'No code of the claimants was run; their scripts were read as text to learn what their counts mean. No model was run here. The operator has no connection to the authors.' }
  ])
    + W.premisesHtml([
      { grade: W.ASSUMED, label: 'The released flags are the post’s evaluation', evidence: 'merged.json is said to be recomputed from the parts by the claimants’ merge.py; the parts’ flags re-sum to the printed accuracies here; the generations behind 1,500 flags per run are not released' },
      { grade: W.ASSUMED, label: 'MATH-500’s answers are the gold', evidence: 'HuggingFaceH4/MATH-500 at its pinned revision, as the claimants used; a gold answer is not re-derived' },
      { grade: W.ASSUMED, label: 'The degree sign and \\text{} are decoration', evidence: 'the two conventions the grader applies (90° = 90; \\text{Evelyn} = Evelyn); every other convention is refused, not assumed' }
    ])
    + C.pRaw('Re-run: ' + m('node tools/wsp-weights.js') + ' (both deciders, the controls, the pins; needs the cached inputs) · ' + m('python3 -I tools/wsp-regrade.py') + ' · ' + m('node tools/build-report-wsp.js') + '.')
}));
{ const OUT = require(path.join(ROOT, 'design', 'outside.js')).section(C, 'reports/weight-space-programming.html'); if (OUT) B.push(OUT); }

const foot = '<p>' + esc('Generated by tools/build-report-wsp.js from certs/wsp-weights.json (' + R.generated + '), certs/wsp-regrade.json (' + G.generated + ')' + (Bx ? ' and certs/wsp-baseline.json (' + Bx.generated + ')' : '') + ', ' + (Bx ? 'all three' : 'both') + ' re-checked at build. MIT.') + '</p><p>' + esc('git ' + git) + '</p>';
const html = TPL.render({
  title: 'Weight-Space Programming, decided from its bytes · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/reports/weight-space-programming.html',
  og: { image: '/og-wsp.png', alt: require(path.join(ROOT, 'tools', 'build-og-report.js')).alt('wsp') },
  desc: 'MIT CSAIL’s Weight-Space Programming edit of Qwen3.5-0.8B decided from the bytes of the two checkpoints by two implementations sharing no code: two tensors differ, ' + num(F.changed_entries_total) + ' entries (not 131,072), '
    + F.fraction['131072/all'].percent_rounded_3dp + '% of the release (not 0.016%), six times the projection removed; every released MATH-500 answer re-graded exactly with no disagreement on the decided ones; the gain is termination' + (Bx ? '; the unedited model run under its maker’s own settings: ' + RW() + '.' : ', the baseline the open question.')
});
fs.writeFileSync(path.join(ROOT, 'reports', 'weight-space-programming.html'), html);
console.log('reports/weight-space-programming.html written: ' + num(F.changed_entries_total) + ' entries, ' + num(UN.tally.n + ED.tally.n) + ' answers re-graded @ git ' + git + ' (' + Math.round(html.length / 1024) + ' KB)');
