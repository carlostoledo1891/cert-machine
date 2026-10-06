#!/usr/bin/env node
/* register.js — every number the register pre-paper (paper/tex/register.tex) quotes, read from
   the records that decided it and written as LaTeX macros to paper/tex/register-numbers.tex.

   The paper \input{register-numbers.tex}s this file, so it cannot quote a number the machine did
   not record. A record that no longer says what a sentence needs makes this refuse (need()),
   exactly as tools/build-paper-numbers.js does for the Elsevier manuscripts. Table rows are
   emitted as macros too. Nothing here is typed: the one constant of corpus construction that
   is (the Ramanujan Machine audit carries exactly one correction row of ours) is named below
   and checked against the family counts.

   Records read:
     certs/claims-ledger.json            the register (rows, verdicts, kinds, months, dates)
     certs/erdos852-certificate.json     the refutation example (C*, one integer inequality)
     certs/sumproduct-ledger.json        the repair example (C84b)
     certs/design-table-audit.json       the refusal example (NEEDS DATA, a printed design table)
     certs/kissing-ledger.json           the NEEDS DATA row that closed in four days
     certs/horizonmath-ledger.json       the second refutation (a checker wider than its definition)
     certs/easota-ledger.json            the tolerance-witness repairs
     certs/countex-ledger.json, certs/ai-claims-summary.json, certs/polymaps-ledger.json,
     certs/strassen-certificate.json, certs/gsm8k-ledger.json, certs/ecbench-ledger.json,
     certs/horizon-ledger.json, certs/hseva-ledger.json, certs/sumdiff-ledger.json,
     certs/fei-ledger.json, certs/turan-ledger.json, certs/gnnw-certificate.json,
     corpus/navier-stokes/build.json, ledger.json (the engine loop; the ramanujan-audit family)
     corpus/navier-stokes/upstream-f9e8bc5b.json   the Navier–Stokes row re-decided at the upstream commit
     corpus/machine-claims-100.json      the hundred pre-registered claims (October's rows)
     certs/matmul-eval-ledger.jsonl      the grader's refusal rate on submitted proposals
     certs/sublevel-tao179.json, certs/lambda56-campaign.json, certs/mfg2p-regime-map.json,
     certs/mfg-regime-map.json           the refusal kinds the refusals page keeps apart
     certs/lambda4-audit.json, certs/lambda4-campaign.json, paper/lambda4-proof.md
                                         the lab theorem an outside audit re-certified
     tools/build-report-methods.js       the bug catalogue and the red-control count (parsed)
     notes/positioning-decisions-2026-09-03.md   the date of the position

   usage: node tools/paper-numbers/register.js                                            MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'paper', 'tex', 'register-numbers.tex');
const die = (m) => { console.error('REGISTER NUMBERS REFUSED: ' + m); process.exit(1); };
const need = (c, m) => { if (!c) die(m); };
const J = (rel) => { const f = path.join(ROOT, rel); need(fs.existsSync(f), 'missing record ' + rel); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const T = (rel) => { const f = path.join(ROOT, rel); need(fs.existsSync(f), 'missing file ' + rel); return fs.readFileSync(f, 'utf8'); };
const int = (x) => Math.round(Number(x)).toLocaleString('en-US').replace(/,/g, '{,}');
const dec = (x, d) => Number(x).toFixed(d);
const pct = (a, b, d) => (100 * a / b).toFixed(d) + '\\%';
/* a small or large number in scientific form, as math: $8.7\times10^{-11}$ */
const sci = (x, d) => { const m = /^(-?[\d.]+)e([+-]?\d+)$/.exec(Number(x).toExponential(d)); return '$' + m[1] + '\\times10^{' + Number(m[2]) + '}$'; };
const git = (() => { try { return cp.execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
/* plain text into LaTeX: the characters the records use */
const tex = (s) => String(s).replace(/\\/g, '\\textbackslash{}').replace(/([&%$#_{}])/g, '\\$1').replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}')
  .replace(/≥/g, '$\\ge$').replace(/≤/g, '$\\le$').replace(/→/g, '$\\to$').replace(/−/g, '$-$').replace(/×/g, '$\\times$').replace(/²/g, '$^2$').replace(/³/g, '$^3$').replace(/°/g, '$^\\circ$').replace(/–/g, '--').replace(/—/g, '---').replace(/…/g, '\\ldots{}')
  .replace(/α/g, '$\\alpha$').replace(/ε/g, '$\\varepsilon$').replace(/λ/g, '$\\lambda$').replace(/Σ/g, '$\\Sigma$').replace(/ℝ/g, '$\\mathbb{R}$').replace(/ℚ/g, '$\\mathbb{Q}$').replace(/⊗/g, '$\\otimes$').replace(/‑/g, '-').replace(/"/g, "''");
/* a verdict word as the paper sets it */
const VW = { CERTIFIED: '\\textsc{certified}', PARTIAL: '\\textsc{partial}', REFUTED: '\\textsc{refuted}', MIXED: '\\textsc{mixed}', REPAIRED: '\\textsc{repaired}', 'NEEDS DATA': '\\textsc{needs data}', QUEUED: '\\textsc{queued}' };
const vw = (v) => { need(VW[v], 'a verdict outside the grammar: ' + v); return VW[v]; };

const M = ['%% generated by tools/paper-numbers/register.js from the records named in its header — do not edit (git ' + git + ')'];
const def = (name, val) => { if (!/^[A-Za-z]+$/.test(name)) die('bad macro name ' + name); M.push('\\newcommand{\\' + name + '}{' + val + '}'); };
const rows = (name, rr) => def(name, rr.map((r) => r.join(' & ') + ' \\\\').join('\n'));

/* ======================================================================= the register */
const R = J('certs/claims-ledger.json');
need(R.rows.length === R.count, 'the register disagrees with its own count');
need(R.decided + R.pending === R.count, 'decided + pending is not the row count');
need(R.rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.recordedOn)), 'a row has no recordedOn date');
need(R.rows.every((r) => R.kindsDefined[r.kind]), 'a row has a kind outside the closed vocabulary');
need(R.submitted === 0 && Object.keys(R.byOrigin).length === 1 && R.byOrigin['self-initiated'] === R.count, 'the origin column moved: the paper says every row is self-initiated and none submitted');
need(Object.values(R.byMonth).reduce((a, b) => a + b, 0) === R.count, 'the months do not add up');
def('RepoCommit', git);
def('RegDate', R.meta.date); def('RegGit', R.meta.git);
def('RegRows', int(R.count)); def('RegDecided', int(R.decided)); def('RegPending', int(R.pending));
def('RegSubmitted', int(R.submitted));
const sources = [...new Set(R.rows.map((r) => r.decidedFrom))], pages = [...new Set(R.rows.map((r) => r.page))];
def('RegSources', int(sources.length)); def('RegPages', int(pages.length));
def('RegKinds', int(Object.keys(R.kindsDefined).length));
def('RegKindsUsed', int(Object.keys(R.byKind).filter((k) => k !== 'none').length));
const V = (k) => R.byVerdict[k] || 0;
def('VCertified', int(V('CERTIFIED'))); def('VPartial', int(V('PARTIAL'))); def('VRefuted', int(V('REFUTED'))); def('VMixed', int(V('MIXED')));
def('VRepaired', int(V('REPAIRED'))); def('VNeedsData', int(V('NEEDS DATA'))); def('VQueued', int(V('QUEUED')));
need(V('CERTIFIED') + V('PARTIAL') + V('REFUTED') + V('MIXED') + V('REPAIRED') + V('NEEDS DATA') + V('QUEUED') === R.count, 'a verdict outside the seven words');
const decided = R.rows.filter((r) => r.verdict !== 'QUEUED');
const holds = decided.filter((r) => r.kind === 'none'), defects = decided.filter((r) => r.kind !== 'none');
def('RegHolds', int(holds.length)); def('RegDefects', int(defects.length));
def('RegHoldsPct', pct(holds.length, decided.length, 0));
def('RegTheorems', int(V('CERTIFIED') + V('REFUTED')));
/* rows whose claimant names an AI system — a coarse regex measurement, the rule stated in the paper */
const AI = /GPT|Codex|Claude|Opus|ChatGPT|AlphaEvolve|AlphaTensor|agents|frontier-model|TTT-Discover|Mosaic|Numaro|AI\b/i;
const aiRows = decided.filter((r) => AI.test(r.claimant || '')), otherRows = decided.filter((r) => !AI.test(r.claimant || ''));
def('AiRows', int(aiRows.length)); def('AiRowsDefects', int(aiRows.filter((r) => r.kind !== 'none').length));
def('OtherRows', int(otherRows.length)); def('OtherRowsDefects', int(otherRows.filter((r) => r.kind !== 'none').length));
/* the kinds, by rows and by the items inside aggregates */
const KIND_ORDER = Object.keys(R.kindsDefined);
const itemsByKind = {};
for (const r of decided) { const ks = r.kinds || { [r.kind]: 1 }; for (const [k, n] of Object.entries(ks)) itemsByKind[k] = (itemsByKind[k] || 0) + n; }
const kname = (k) => k.replace(/-/g, ' ');
rows('KindRows', KIND_ORDER.map((k) => [kname(k), tex(R.kindsDefined[k]), int(R.byKind[k] || 0), int(itemsByKind[k] || 0)]));
const KM = { 'none': 'KNone', 'narrower-scope': 'KNarrower', 'float-printed-as-exact': 'KFloat', 'sign-slip': 'KSign', 'arithmetic-slip': 'KArith', 'tolerance-witness': 'KTolerance', 'not-the-optimum': 'KNotOptimum', 'wrong-quantity': 'KWrongQuantity', 'not-from-the-published-data': 'KNotFromData', 'outside-support': 'KOutsideSupport', 'clause-missing-from-formal-statement': 'KClause', 'data-not-public': 'KDataNotPublic', 'depends-on-reading': 'KReading', 'checker-wider-than-definition': 'KChecker' };
for (const k of KIND_ORDER) { need(KM[k], 'a kind this tool does not name: ' + k); def(KM[k], int(R.byKind[k] || 0)); }
need(Object.keys(KM).every((k) => R.kindsDefined[k]), 'the vocabulary lost a kind this tool names');
const topDefect = Object.entries(R.byKind).filter(([k]) => k !== 'none').sort((a, b) => b[1] - a[1])[0];
def('KTopDefect', kname(topDefect[0])); def('KTopDefectRows', int(topDefect[1]));
const aggregates = decided.filter((r) => r.kinds);
def('RegAggregates', int(aggregates.length));
def('AggItems', int(Object.values(itemsByKind).reduce((a, b) => a + b, 0) - decided.filter((r) => !r.kinds).length));
rows('AggRows', aggregates.map((r) => [tex(r.claim), vw(r.verdict), Object.entries(r.kinds).map(([k, n]) => int(n) + ' ' + kname(k)).join(', ')]));
/* months and the dated diff */
const months = Object.keys(R.byMonth).sort();
need(JSON.stringify(months) === JSON.stringify(['2026-08', '2026-09', '2026-10']), 'the register no longer spans exactly August to October 2026: the month paragraphs need rewriting');
const MON = { '2026-08': 'August 2026', '2026-09': 'September 2026', '2026-10': 'October 2026' };
const monthRows = months.map((m) => { const rr = R.rows.filter((r) => r.recordedOn.slice(0, 7) === m); const c = (v) => rr.filter((r) => r.verdict === v).length; return [MON[m], int(rr.length), int(c('CERTIFIED')), int(c('PARTIAL')), int(c('REFUTED')), int(c('MIXED')), int(c('REPAIRED')), int(c('NEEDS DATA')), int(c('QUEUED')), int(rr.filter((r) => r.verdict !== 'QUEUED' && r.kind !== 'none').length)]; });
rows('MonthRows', monthRows);
def('MonthAugRows', int(R.byMonth['2026-08'])); def('MonthSepRows', int(R.byMonth['2026-09']));
def('MonthSepDecided', int(R.rows.filter((r) => r.recordedOn.slice(0, 7) === '2026-09' && r.verdict !== 'QUEUED').length));
def('MonthOctRows', int(R.byMonth['2026-10']));
const dates = [...new Set(R.rows.map((r) => r.recordedOn))].sort();
def('RegFirstDate', dates[0]); def('RegLastDate', dates[dates.length - 1]); def('RegDays', int(dates.length));
/* October is of another making: the paragraph says every October row but one is a decided row of the hundred
   pre-registered machine claims, and the one is the Navier–Stokes row re-decided on its claimant's later commit */
const MC = J('corpus/machine-claims-100.json');
need(MC.count === 100 && MC.rows.length === 100 && /^\d{4}-\d{2}-\d{2}$/.test(MC.registered) && /named before any is decided/.test(MC.what), 'the pre-registration is not one hundred claims named before any was decided');
const isMc = (r) => /^certs\/mc100-/.test(r.decidedFrom);
const octRows = R.rows.filter((r) => r.recordedOn.slice(0, 7) === '2026-10');
const mcRows = R.rows.filter(isMc), octOther = octRows.filter((r) => !isMc(r));
need(mcRows.every((r) => r.recordedOn.slice(0, 7) === '2026-10' && r.recordedOn > MC.registered), 'a pre-registered row is dated outside October or before its registration');
need(octOther.length === 1 && octOther[0].id === 'navier-stokes-openai-2026' && (octOther[0].history || []).length === 1, 'October holds a row that is neither pre-registered nor the re-decided Navier–Stokes row: the October sentence needs rewriting');
need(mcRows.every((r) => MC.rows.some((m) => r.id === 'mc100-' + m.id)), 'a register row from the pre-registered pools names no pre-registered claim');
const mcSources = [...new Set(mcRows.map((r) => r.decidedFrom))];
def('McRegistered', MC.registered); def('McCount', int(MC.count)); def('McRows', int(mcRows.length));
def('McSources', int(mcSources.length)); def('McPools', int(Object.keys(MC.caps).length));
const dayRows = (d) => R.rows.filter((r) => r.recordedOn === d);
const biggestOf = (ds) => ds.map((d) => [d, dayRows(d).length]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
const bigAll = biggestOf(dates), bigAugSep = biggestOf(dates.filter((d) => d < '2026-10'));
need(dayRows(bigAll[0]).every(isMc), 'the largest day of the register is no longer a day of the pre-registered set');
def('RegBiggestDayAugSep', bigAugSep[0]); def('RegBiggestDayAugSepRows', int(bigAugSep[1]));
const LABEL = {
  'certs/ai-claims-summary.json': ['six AI-assisted manuscripts, lane audit', 'manuscripts produced with frontier-model help', 'ai-claims-audit'],
  'certs/erdos852-certificate.json': ['Erd\\H{o}s \\#852, the constant $C^*$', 'a problem-thread post, frontier-model help', 'erdos852'],
  'certs/kissing-ledger.json': ['kissing configurations in $\\mathbb{R}^{11}$', 'AlphaEvolve, EinsteinArena, the Station, classical', 'kissing'],
  'ledger.json (family ramanujan-audit)': ['Ramanujan Machine result sheets', 'the Ramanujan Machine project', 'rm-audit'],
  'certs/strassen-certificate.json': ['matrix-multiplication schemes', 'Strassen, AlphaTensor, AlphaEvolve', 'alphaevolve'],
  'certs/easota-ledger.json': ['EinsteinArena state-of-the-art table', 'AlphaEvolve, TTT-Discover, Together AI agents, Haugland', 'easota'],
  'certs/ecbench-ledger.json': ['environmental-contour benchmark counts', 'the benchmark\'s teams', 'ec-benchmark'],
  'certs/gsm8k-ledger.json': ['GSM8K answer keys', 'GSM8K', 'gsm8k-audit'],
  'certs/horizon-ledger.json': ['METR time-horizon fits', 'METR', 'time-horizon'],
  'certs/hseva-ledger.json': ['printed $H_s$ marginal fits', 'the benchmark\'s teams', 'return-levels'],
  'certs/design-table-audit.json': ['a printed design table', 'Bhaskaran et al.', 'return-level-atlas'],
  'corpus/navier-stokes/audit.json': ['Navier--Stokes Lean certificate', 'OpenAI', 'navier-stokes'],
  'certs/sumdiff-ledger.json': ['registry asterisks C3b, C3c', 'Mosaic Intelligence, Y.\\ Lin', 'optimization-constants'],
  'certs/fei-ledger.json': ['registry asterisk C71', 'Numaro', 'optimization-constants'],
  'certs/sumproduct-ledger.json': ['registry asterisk C84b', 'Althoefer with ChatGPT', 'optimization-constants'],
  'certs/turan-ledger.json': ['registry asterisk C42', 'Griego; R\\"ohrig with Codex', 'optimization-constants'],
  'certs/countex-ledger.json': ['an AI counterexample library', 'Sra; GPT, Codex and Claude models', 'counterexample-machine'],
  'certs/horizonmath-ledger.json': ['HorizonMath credited discoveries', 'GPT-5.4 and GPT-5.6 models', 'horizonmath'],
  'certs/gnnw-certificate.json': ['GNNW\'s unverified iteration', 'ChatGPT 5.6 Sol, printed by Gupta et al.', 'diagonal-ramsey'],
  'certs/polymaps-ledger.json': ['polynomial maps, two 2026 papers', 'Gao with Claude; Casta\\~neda et al.', 'polymaps'],
  /* the hundred pre-registered machine claims (corpus/machine-claims-100.json), one record per pool decided so far */
  'certs/mc100-alphaevolve-nb-matmul.json': ['AlphaEvolve notebook, pre-registered', 'AlphaEvolve', 'mc100'],
  'certs/mc100-alphatensor-f2.json': ['AlphaTensor over $\\mathbb{F}_2$, pre-registered', 'AlphaTensor', 'mc100'],
  'certs/mc100-alphatensor-q.json': ['AlphaTensor, standard arithmetic, pre-registered', 'AlphaTensor', 'mc100'],
  'certs/mc100-einstein-arena.json': ['EinsteinArena bests, pre-registered', 'EinsteinArena agents', 'mc100'],
  'certs/mc100-station-v2.json': ['the Station, pre-registered', 'the Station\'s agents', 'mc100']
};
for (const s of sources) need(LABEL[s], 'a source this tool does not label: ' + s);
const srcRows = sources.map((s) => { const rr = R.rows.filter((r) => r.decidedFrom === s); const c = (v) => rr.filter((r) => r.verdict === v).length; const first = rr.map((r) => r.recordedOn).sort()[0]; return { s, first, row: [LABEL[s][0], LABEL[s][1], int(rr.length), int(c('CERTIFIED')), int(c('PARTIAL')), int(c('REFUTED')), int(c('MIXED')), int(c('REPAIRED')), int(c('NEEDS DATA')), int(c('QUEUED')), first] }; })
  .sort((a, b) => a.first.localeCompare(b.first) || a.s.localeCompare(b.s));
rows('SourceRows', srcRows.map((x) => x.row));
rows('DateRows', dates.map((d) => { const rr = R.rows.filter((r) => r.recordedOn === d); const ss = [...new Set(rr.map((r) => LABEL[r.decidedFrom][0]))]; return [d, int(rr.length), ss.join('; ')]; }));
const biggest = dates.map((d) => [d, R.rows.filter((r) => r.recordedOn === d).length]).sort((a, b) => b[1] - a[1])[0];
def('RegBiggestDay', biggest[0]); def('RegBiggestDayRows', int(biggest[1]));
/* the grammar's words as the register defines them */
def('RegWhat', tex(R.what)); def('RegScope', tex(R.scope.replace(/^What can be decided here:\s*/, '')));

/* ======================================================================= the three examples */
/* (a) refutation — Erdős #852, C* */
{
  const c = J('certs/erdos852-certificate.json');
  const P = c.cstar.published, E = c.cstar.enclosure, F = c.cstar.refutation;
  need(P.verdict === 'REFUTED', 'the #852 record no longer refutes the published C*');
  need(E.lo < E.hi && P.value < E.lo, 'the published C* is not below the enclosure: the refutation paragraph would be false');
  def('CstarPublished', P.value); def('CstarLo', E.lo); def('CstarHi', E.hi);
  def('CstarDefinition', tex(c.cstar.definition));
  const m1 = /(\d+) odd primes to (\d+) at (\d+) bits/.exec(E.method); need(m1, 'the enclosure method line moved');
  def('CstarPrimes', int(m1[1])); def('CstarPrimeBound', int(m1[2])); def('CstarBits', m1[3]);
  def('CstarLimit', int(F.limit));
  const m2 = /One integer inequality: (.+?)\. No tail bound/.exec(F.statement); need(m2, 'the refutation statement no longer names its one integer inequality');
  def('CstarInequality', m2[1].replace(/·/g, '\\cdot ').replace(/\^(\d+)/g, '^{$1}'));
  const m3 = /\(N\/D - 1\)\/2 > (\d+)\/10\^(\d+)/.exec(F.statement); need(m3, 'the refutation statement lost the window edge');
  def('CstarWindowNum', m3[1]); def('CstarWindowDen', m3[2]);
  const m4 = /p-1 >= (\d+)/.exec(P.mechanism); need(m4, 'the mechanism line lost its threshold');
  def('CstarThreshold', int(m4[1]));
  const m5 = /~(\d+)% of the factors vanish/.exec(P.mechanism); need(m5, 'the mechanism line lost its vanishing fraction');
  def('CstarVanish', m5[1] + '\\%');
  /* where the published decimal parts from the enclosure: decimal place and significant digit, computed, not read from prose */
  const pub = P.value.replace('0.', ''), lo = E.lo.replace('0.', ''), hi = E.hi.replace('0.', '');
  let i = 0; while (i < pub.length && pub[i] === lo[i] && pub[i] === hi[i]) i++;
  need(i < pub.length, 'the published decimal agrees with the enclosure on every digit it prints');
  const lead = pub.search(/[1-9]/);
  def('CstarPlace', String(i + 1)); def('CstarSig', String(i + 1 - lead));
  def('CstarPublishedDigits', String(pub.length - lead));
  const m6 = /published in the problem thread \((\d{4}-\d{2}-\d{2})\)/.exec(c.what); need(m6, 'the record no longer dates the thread post');
  def('CstarThreadDate', m6[1]);
  need(c.c0.published.verdict === 'VERIFIED_ROUNDED', 'c0 is no longer the verified-as-a-rounding companion');
  def('CzeroPublished', c.c0.published.value); def('CzeroDigits', String(c.c0.certifiedDigits.replace(/^1\./, '').length));
  def('CstarVerifier', 'tools/verify\\_erdos852.py');
}
/* (b) repair — the registry's C84b */
{
  const d = J('certs/sumproduct-ledger.json'); const r = d.rows[0];
  need(r.id === '84b' && r.verdict === 'REPAIRED', 'C84b is no longer the repaired row');
  need(Number(r.ceiling) < 0.000719 && Number(r.ceiling) > 0.0007, 'the ceiling no longer separates the quoted constant from the theorem');
  def('SpClaim', tex(r.claim)); def('SpRepairedTo', tex(r.repairedTo)); def('SpCeiling', r.ceiling); def('SpAtNote', r.cAtNoteChoice[0]);
  const mq = /c >= ([\d.]+)/.exec(r.claim); need(mq, 'the claim lost its quoted c'); def('SpQuotedC', mq[1]);
  const mt = /c >= ([\d.]+)/.exec(r.repairedTo); need(mt, 'the repair lost its c'); def('SpTheoremC', mt[1]);
  def('SpNoteDate', d.note.date); def('SpNoteAuthor', tex(d.note.author)); def('SpNoteTitle', tex(d.note.title));
  def('SpRegistryCommit', d.registry.commit.slice(0, 8)); def('SpChecks', int(r.checks.length));
  need(r.checks.every((k) => k.ok), 'a C84b check no longer holds');
  rows('SpCheckRows', r.checks.map((k, i) => [String(i + 1), '\\texttt{' + tex(k.name).replace(/\$\\le\$/g, '<=').replace(/\$\\ge\$/g, '>=') + '}', k.detail ? '\\texttt{' + tex(k.detail) + '}' : '---']));
  const mreg = /Unverified/.test(d.registry.row); need(mreg, 'the registry row no longer says Unverified');
  def('SpClaimant', tex(r.claimant));
}
/* (c) refusal — the printed design table */
{
  const d = J('certs/design-table-audit.json'); const S = d.summary;
  const reg = R.rows.find((r) => r.id === 'design-table-bhaskaran-2023'); need(reg && reg.verdict === 'NEEDS DATA', 'the design-table row is no longer NEEDS DATA');
  def('DtAreas', int(d.rows.length)); def('DtDecided', int(S.decided));
  def('DtOff', int(S.verdicts['OFF THE MAXIMUM'] || 0)); def('DtOutside', int(S.verdicts['OUTSIDE ITS SUPPORT'] || 0));
  need((S.verdicts['OFF THE MAXIMUM'] || 0) + (S.verdicts['OUTSIDE ITS SUPPORT'] || 0) === S.decided, 'the design-table verdicts do not add up');
  def('DtCitation', tex(d.table.source.citation)); def('DtDoi', d.table.source.doi);
  const mp = /commercial hindcast \(([^)]+)\)/.exec(d.what); need(mp, 'the record no longer names the private hindcast');
  def('DtPrivate', tex(mp[1]));
  const mu = /public hindcast \(([^)]+)\)/.exec(d.what); need(mu, 'the record no longer names the public hindcast');
  def('DtPublic', tex(mu[1]).replace(/\\_/g, '\\_\\allowbreak{}'));
  const kms = d.rows.map((r) => r.cells[0].km); def('DtKmMin', int(Math.min(...kms))); def('DtKmMax', int(Math.max(...kms)));
  const yrs = [...new Set(d.rows.map((r) => r.cells[0].years))]; need(yrs.length === 1, 'the cells do not share one block count'); def('DtYears', int(yrs[0]));
  const MN = { gumbelLS: 'Gumbel, least squares', gumbelML: 'Gumbel, max.\\ likelihood', gumbelMOM: 'Gumbel, moments', gevML: 'GEV, max.\\ likelihood' };
  const names = {}; for (const r of d.rows) names[r.la] = r.name;
  rows('DtLevelRows', S.levels.map((l) => { need(MN[l.method], 'a method this tool does not name: ' + l.method); return [tex(names[l.la] || String(l.la)), MN[l.method], dec(l.printed, 2), dec(l.certified, 2), (l.d > 0 ? '+' : '$-$') + dec(Math.abs(l.d), 2)]; }));
  const METH = ['gumbelLS', 'gumbelML', 'gumbelMOM', 'gevML'];
  need(S.levels.every((l) => METH.includes(l.method)), 'a method outside the four the table prints');
  rows('DtMatrixRows', d.rows.map((r) => [tex(r.name)].concat(METH.map((m) => { const l = S.levels.find((x) => x.la === r.la && x.method === m); need(l, 'no level for ' + r.name + ' ' + m); return dec(l.printed, 2) + ' / ' + dec(l.certified, 2); }))));
  const dmax = Math.max(...S.levels.map((l) => Math.abs(l.d))); def('DtMaxGap', dec(dmax, 2));
  const dmin = Math.min(...S.levels.map((l) => Math.abs(l.d))); def('DtMinGap', dec(dmin, 2));
}
/* the NEEDS DATA row that closed */
{
  const k = J('certs/kissing-ledger.json'); const kr = k.rows || k.ledger || k.entries;
  const r = kr.find((x) => x.id === 'ea-604'); need(r && r.verdict === 'CERTIFIED' && r.needsDataFrom && r.bytesPublished, 'the headline 604 row no longer records its NEEDS DATA interval');
  const days = Math.round((Date.parse(r.bytesPublished) - Date.parse(r.needsDataFrom)) / 86400000);
  def('KissNeedsFrom', r.needsDataFrom); def('KissBytes', r.bytesPublished); def('KissDays', int(days));
  def('KissContacts', int(r.contacts)); def('KissMs', int(r.ms)); def('KissN', int(r.n));
  def('KissRows', int(kr.length)); def('KissCertified', int(kr.filter((x) => x.verdict === 'CERTIFIED').length)); def('KissQueued', int(kr.filter((x) => x.verdict === 'QUEUED').length));
  need(kr.filter((x) => x.verdict === 'NEEDS DATA').length === 0, 'a kissing row is NEEDS DATA again: the refusals table row would be wrong');
  need(r.congruence && r.congruence['station-604-1'] && r.congruence['station-604-1'].verdict === 'CONGRUENT', 'the congruence certificate moved');
}
/* the second refutation — HorizonMath's Ramsey certificate */
{
  const h = J('certs/horizonmath-ledger.json');
  const r = h.rows.find((x) => x.id === 'ramsey-asymptotic'); need(r && r.verdict === 'REFUTED' && r.kind === 'checker-wider-than-definition', 'the Ramsey certificate row is no longer the refutation this paper describes');
  const D = r.decided;
  def('HmPoints', int(D.points)); def('HmOutside', int(D.outsideR)); def('HmNotPlaced', int(D.notPlacedByU)); def('HmNotRefuted', int(D.notRefutedHere));
  const mc = /<= ([\d.]+)\^\(k\+o\(k\)\), improving ([\d.]+)/.exec(r.claim); need(mc, 'the claim lost its two constants');
  def('HmC', mc[1]); def('HmGnnw', mc[2]);
  const last = r.points[r.points.length - 1]; need(last.lambda === 1 && last.outsideR, 'the pair at lambda = 1 is no longer the excluded one');
  def('HmGapE', last.outsideR.e); def('HmGapP', last.outsideR.p); def('HmGap', dec(last.outsideR.gap, 5));
  const mx = /\(X\(1\), Y\(1\)\) = \(([\d.]+), ([\d.]+)\)/.exec(r.scope); need(mx, 'the scope lost the pair');
  def('HmXone', mx[1]); def('HmYone', mx[2]); def('HmEU', dec(D.eMinusU1[0], 5));
  need(r.theirCheckerWithAnd && /min\(bu, bs\)\)` -> `max\(bu, bs\)`/.test(r.theirCheckerWithAnd.change), 'the one-line change to their checker is no longer recorded');
  const ml = /line (\d+)/.exec(r.theirCheckerWithAnd.change); need(ml, 'the checker line moved'); def('HmCheckerLine', ml[1]);
  need(/valid: false/.test(r.theirCheckerWithAnd.output), 'their checker with the conjunction no longer fails the certificate');
  const kk = h.rows.find((x) => x.id === 'keich-thin-triangles-128'); need(kk && kk.verdict === 'CERTIFIED', 'the Kakeya row is no longer certified');
  def('HmKakeyaNum', kk.decided.area.num); def('HmKakeyaDen', int(kk.decided.area.den)); def('HmKakeyaDec', kk.decided.area.decimal.slice(0, 12)); def('HmKakeyaPieces', int(kk.decided.pieces));
  const nd = h.rows.find((x) => x.id === 'gpt56-closed-forms'); need(nd && nd.verdict === 'NEEDS DATA', 'the closed-forms row is no longer NEEDS DATA');
  def('HmCommit', h.source.commit.slice(0, 8));
}
/* the tolerance-witness repairs — EinsteinArena */
{
  const e = J('certs/easota-ledger.json');
  const w = e.rows.filter((r) => r.verdict === 'WITNESSED').length, rep = e.rows.filter((r) => r.verdict === 'REPAIRED');
  need(w + rep.length === e.rows.length, 'an easota row is neither witnessed nor repaired');
  def('EaRows', int(e.rows.length)); def('EaWitnessed', int(w)); def('EaRepaired', int(rep.length));
  def('EaProblems', int(new Set(e.rows.map((r) => r.problem)).size)); def('EaCommit', e.provenance.commit.slice(0, 8));
  const circ = rep.find((r) => r.id === 'circles/ours_2026'); need(circ && circ.repair && circ.repair.deficit, 'the circle-packing repair moved');
  def('EaCirclesDeficit', sci(circ.repair.deficit, 2)); def('EaCirclesOverlaps', int(circ.asPublished.overlappingPairs)); def('EaCirclesPrinted', circ.printed); def('EaCirclesExact', circ.exact.slice(0, 12));
  const ov = rep.filter((r) => r.problem === 'erdos-minimum-overlap'); need(ov.length === 3, 'the overlap repairs are not three');
  def('EaOverlapRepairs', int(ov.length)); def('EaOverlapMiss', sci(Math.max(...ov.map((r) => Math.abs(Number(r.asPublished.sumMinusHalfN)))), 2)); def('EaOverlapDeltaMax', sci(Math.max(...ov.map((r) => Math.abs(Number(r.repair.delta)))), 2));
  need(e.rows.filter((r) => r.printedAgrees === false).length === 1 && e.rows.find((r) => r.printedAgrees === false).id === 'circles/ours_2026', 'the one row whose printed digits are not the exact value\'s moved');
}

/* ======================================================================= the sources' own counts */
{
  const a = J('certs/ai-claims-summary.json'); need(a.lanes === 6 && a.verdicts.length === 6, 'the lane audit is not six lanes');
  def('AiLanes', int(a.lanes)); def('AiConfirmed', int(a.confirmed)); def('AiPartial', int(a.partial)); def('AiRefuted', int(a.refuted));
  def('AiChecks', int(a.checks)); def('AiChecksFrom', int(a.checksFrom)); def('AiMutations', int(a.mutations)); def('AiSeconds', dec(a.seconds, 1));
  rows('LaneRows', a.verdicts.map((v) => [tex(v.short), v.verdict === 'CONFIRMED' ? '\\textsc{certified}' : vw(v.verdict), tex(v.scope), v.namedChecks == null ? '---' : int(v.namedChecks), int(v.mutations)]));
}
{
  const l = J('ledger.json'); const f = (l.families || []).find((x) => x.name === 'ramanujan-audit'); need(f, 'no ramanujan-audit family');
  const c = f.counts; const corrections = 1;             /* the one row of ours in that corpus (tools/build-report-rm-audit.js) */
  need(c.hits + c.rejects === c.certified && c.rejects === 1, 'the Ramanujan family counts moved');
  def('RmCertified', int(c.certified)); def('RmPrinted', int(c.certified - corrections)); def('RmSurvive', int(c.hits - corrections)); def('RmRefuted', int(c.rejects)); def('RmCorrections', int(corrections));
  const reg = R.rows.find((r) => r.id === 'rm-registry'); need(reg, 'no rm-registry row');
  def('RmRegisterSays', tex(reg.claim + '; ' + reg.scope));
  /* the register's own row counts the correction among the printed rows: the paper reports it as an erratum, and the sentence refuses when it is fixed */
  const mm = /(\d+) printed rows/.exec(reg.claim); need(mm, 'the rm row no longer states a printed-row count');
  def('RmRegisterPrinted', int(mm[1]));
  def('RmErratum', Number(mm[1]) === c.certified ? 'counts' : 'no longer counts');
  let ref = 0, dcd = 0, fam = 0; const where = [];
  for (const g of l.families || []) { const k = g.counts || {}; ref += k.refused || 0; dcd += k.certified || 0; fam++; if (k.refused) where.push(g.name); }
  need(dcd > 0, 'the engine loop decided nothing');
  def('LoopRefused', int(ref)); def('LoopDecided', int(dcd)); def('LoopFamilies', int(fam)); def('LoopWhere', tex(where.join(', ')));
}
{
  const g = J('certs/gsm8k-ledger.json'); const F = g.findings;
  def('GsItems', int(g.test.items + g.train.items)); def('GsTest', int(g.test.items)); def('GsTrain', int(g.train.items));
  def('GsAnnotations', int(g.test.annotationsTotal + g.train.annotationsTotal));
  const annEx = (g.test.annotations.EXACT || 0) + (g.train.annotations.EXACT || 0), annRef = (g.test.annotations.REFUSED || 0) + (g.train.annotations.REFUSED || 0);
  need(annEx + annRef === g.test.annotationsTotal + g.train.annotationsTotal, 'the annotation classes do not add up to the total');
  def('GsAnnotExact', int(annEx)); def('GsAnnotRefused', int(annRef));
  def('GsWrong', int(F.printedStepWrongTest + F.printedStepWrongTrain)); def('GsWrongTest', int(F.printedStepWrongTest)); def('GsWrongTrain', int(F.printedStepWrongTrain));
  const b = J('certs/ecbench-ledger.json').summary; need(b.agree + b.disagree === b.comparisons, 'the ecbench summary disagrees with itself');
  def('EcContours', int(b.contours)); def('EcComparisons', int(b.comparisons)); def('EcAgree', int(b.agree)); def('EcExact', int(b.exactlyEqual)); def('EcDisagree', int(b.disagree)); def('EcNotSimple', int(b.notSimple));
  const h = J('certs/horizon-ledger.json'); const A = Object.values(h.agents), live = A.filter((x) => x.live && x.live.coefficientsVerdict);
  need(h.counts.certified === h.counts.fits, 'a METR fit is not certified');
  def('MeFits', int(h.counts.fits)); def('MeLive', int(live.length)); def('MeReproduced', int(live.filter((x) => x.live.coefficientsVerdict === 'REPRODUCED').length));
  const reg = R.rows.find((r) => r.id === 'metr-horizon'); def('MeScope', tex(reg.scope));
  const P = J('certs/hseva-ledger.json').printed.rows; const regp = R.rows.find((r) => r.id === 'ecbench-marginals');
  def('HsPrinted', int(P.length)); def('HsScope', tex(regp.scope));
  def('HsOk', int(regp.kinds.none || 0)); def('HsTz', int(regp.kinds['wrong-quantity'] || 0));
  const s = J('certs/strassen-certificate.json'); def('MmRows', int(s.entries.length));
  const mmc = (re) => s.entries.filter((e) => re.test(e.source)).length;
  def('MmAlphaTensor', int(mmc(/^AlphaTensor/))); def('MmAlphaEvolve', int(mmc(/^AlphaEvolve/))); def('MmCalibration', int(mmc(/^Strassen|^generated here/)));
  need(mmc(/^AlphaTensor/) + mmc(/^AlphaEvolve/) + mmc(/^Strassen|^generated here/) === s.entries.length, 'a matrix-multiplication row this tool does not attribute'); def('MmCharTwo', int(s.entries.filter((e) => /REFUTED over Q/.test(e.statement)).length));
  const p = J('certs/polymaps-ledger.json'); def('PmRows', int(p.rows.length)); def('PmCertified', int(p.rows.filter((r) => r.verdict === 'CERTIFIED').length)); def('PmPartial', int(p.rows.filter((r) => r.verdict === 'PARTIAL').length));
  const cx = J('certs/countex-ledger.json'); def('CxRows', int(cx.rows.length)); def('CxCertified', int(cx.rows.filter((r) => r.verdict === 'CERTIFIED').length)); def('CxPartial', int(cx.rows.filter((r) => r.verdict === 'PARTIAL').length)); def('CxCommit', cx.source.commit.slice(0, 8));
  const dpp = cx.rows.find((r) => r.id === 'dpp-feasible-step'); need(dpp && dpp.kind === 'depends-on-reading', 'the DPP case is no longer the reading-dependent one');
  const sd = J('certs/sumdiff-ledger.json'), fe = J('certs/fei-ledger.json'), tu = J('certs/turan-ledger.json');
  def('OcRows', int(sd.rows.length + fe.rows.length + 1 + tu.rows.length)); def('OcAsterisks', int(sd.rows.filter((r) => r.registry).length + fe.rows.length + 1 + 1));
  def('OcRegistryCommit', sd.registry.commit.slice(0, 8)); def('OcStarNote', tex(sd.registry.starNote.replace(/^README: /, '')));
  const z = J('certs/gnnw-certificate.json'); need(z.decided.verdict === 'CERTIFIED', 'GNNW is not certified'); def('GnC', z.decided.c[0].slice(0, 13)); def('GnPrintedIs', tex(z.decided.printedIs));
  const nb = J('corpus/navier-stokes/build.json'); need(nb.exitCode === 0 && nb.onlyStandardAxioms, 'the Navier–Stokes build record no longer holds'); def('NsJobs', int(nb.jobsBuilt)); def('NsCommit', nb.commit.slice(0, 8));
  /* the clause kind's one row, re-decided: PARTIAL at the announced commit (kept as history), CERTIFIED once the
     upstream commit proved the clause and was built here; the paragraph says the kind now has no row */
  const ns = R.rows.find((r) => r.id === 'navier-stokes-openai-2026'), up = J('corpus/navier-stokes/upstream-f9e8bc5b.json');
  need(ns && ns.verdict === 'CERTIFIED' && ns.kind === 'none' && ns.alsoDecidedFrom === 'corpus/navier-stokes/upstream-f9e8bc5b.json', 'the Navier–Stokes row is not CERTIFIED from the upstream record: the defects paragraph needs rewriting');
  const nh = (ns.history || [])[0];
  need(ns.history.length === 1 && nh.verdict === 'PARTIAL' && nh.kind === 'clause-missing-from-formal-statement' && nh.at === nb.commit.slice(0, 8), 'the Navier–Stokes row does not keep its PARTIAL at the announced commit as history');
  need(!R.byKind['clause-missing-from-formal-statement'] && R.kindsDefined['clause-missing-from-formal-statement'], 'the clause kind has a row again, or left the vocabulary: the defects paragraph needs rewriting');
  need(up.pin === nb.commit && up.decided.energyClauseFormalAtPin === false && up.decided.energyClauseFormalAtHead === true && up.decided.redControl.fired === true, 'the upstream record does not decide the clause not formal at the pin and formal upstream');
  need(up.build.verdict === 'PASS' && up.onlyStandardAxioms === true && up.comparator.ranAtHead === false, 'the upstream build is not PASS on the standard axioms, or Comparator is now recorded as re-run');
  def('NsHeadCommit', up.head.slice(0, 8)); def('NsHeadDate', up.commits[up.commits.length - 1].authored.slice(0, 10));
  def('NsRecorded', ns.recordedOn); def('NsPriorRecorded', nh.recordedOn);
}

/* ======================================================================= refusals, by kind, each with its denominator */
{
  const ev = fs.readFileSync(path.join(ROOT, 'certs', 'matmul-eval-ledger.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.model !== 'fake');
  const n = (o) => ev.filter((r) => r.outcome === o).length;
  const E = { rows: ev.length, certified: n('certified'), rejected: n('rejected'), malformed: n('malformed'), declined: n('declined'), budget: n('budget-exhausted') };
  need(E.certified + E.rejected + E.malformed + E.declined + E.budget === E.rows, 'the eval ledger holds an outcome this tool does not classify');
  E.claims = E.certified + E.rejected + E.malformed;
  def('EvRows', int(E.rows)); def('EvCertified', int(E.certified)); def('EvRejected', int(E.rejected)); def('EvMalformed', int(E.malformed)); def('EvDeclined', int(E.declined)); def('EvBudget', int(E.budget)); def('EvClaims', int(E.claims));
  def('EvRefusalRate', pct(E.malformed, E.claims, 1)); def('EvModels', int(new Set(ev.map((r) => r.model)).size));
  const sub = J('certs/sublevel-tao179.json'); const th = Object.entries(sub.theorems || {}); const failed = th.filter(([, t]) => t.failed);
  const lam = J('certs/lambda56-campaign.json'); const w = ((lam.stages || {})['lambda6-generic'] || {}).worklist || []; const closed = Object.keys(lam.stages || {}).filter((k) => k.startsWith('lambda6-family:') && lam.stages[k].status === 'CLOSED').length;
  const mapOf = (p) => { const m = J(p); const t = {}; for (const c of m.cells || []) { const v = c.verdict || c.v || c.regime; t[v] = (t[v] || 0) + 1; } return { cells: (m.cells || []).length, undecided: t.UNDECIDED || 0 }; };
  const m2 = mapOf('certs/mfg2p-regime-map.json'), m1 = mapOf('certs/mfg-regime-map.json');
  const ai = J('certs/ai-claims-summary.json');
  const l = J('ledger.json'); let ref = 0, dcd = 0; for (const g of l.families || []) { const k = g.counts || {}; ref += k.refused || 0; dcd += k.certified || 0; }
  const kr = (() => { const k = J('certs/kissing-ledger.json'); return k.rows || k.ledger || k.entries; })();
  const RR = [
    ['\\textsc{refused}', 'the engine loop (the instrument declined to decide an object it enumerated)', ref, dcd, 'objects certified'],
    ['\\textsc{refused}', 'the matrix-multiplication eval board (a submitted reply carried no parseable proposal)', E.malformed, E.claims, 'claims submitted'],
    ['\\textsc{needs data}', 'the kissing ledger (decidable, but the claimant had published no bytes)', kr.filter((x) => x.verdict === 'NEEDS DATA').length, kr.length, 'ledger rows'],
    ['\\textsc{open}', 'the Erd\\H{o}s \\#1038 supremum campaign (a degree attempted, budget exhausted, recorded)', failed.length, th.length, 'degrees attempted'],
    ['\\textsc{open}', 'the $\\lambda(6)$ campaign (a family still computing, published as unfinished)', w.length - closed, w.length, 'families in the worklist'],
    ['\\textsc{undecided}', 'the two-population regime map (a swept cell whose box did not close)', m2.undecided, m2.cells, 'cells swept'],
    ['\\textsc{undecided}', 'the one-population regime map', m1.undecided, m1.cells, 'cells swept'],
    ['\\textsc{scope}', 'the six-lane audit (a lane that reached a fragment and says which)', ai.verdicts.filter((v) => v.scope).length, ai.verdicts.length, 'lanes audited']
  ];
  for (const r of RR) need(r[3] > 0 && r[2] <= r[3], 'a refusal row has no denominator or exceeds it: ' + r[1]);
  rows('RefusalRows', RR.map((r) => [r[0], r[1], int(r[2]), int(r[3]), r[4]]));
  def('RefKinds', int(new Set(RR.map((r) => r[0])).size));
  def('RefUndecided', int(m2.undecided + m1.undecided)); def('RefCells', int(m2.cells + m1.cells)); def('RefUndecidedPct', pct(m2.undecided + m1.undecided, m2.cells + m1.cells, 1));
  def('SubFailedDegree', tex(failed.map(([k]) => k).join(', '))); def('LamClosed', int(closed)); def('LamWorklist', int(w.length));
}

/* ======================================================================= the lab theorem an outside audit re-certified */
{
  const a = J('certs/lambda4-audit.json'); need(a.sweep && a.sweep.refuters === 0 && a.finiteRecertified > 0, 'the in-house lambda(4) audit no longer holds');
  def('LfBox', int(a.box)); def('LfSets', int(a.setsWalked)); def('LfFinite', int(a.finiteRecertified)); def('LfRefuters', int(a.sweep.refuters)); def('LfDate', a.meta.date);
  const c = J('certs/lambda4-campaign.json'); const fams = c.lambda4families; need(fams && Object.keys(fams).length === 9, 'the lambda(4) families are not nine');
  let closed = 0, skips = 0;
  (function walk(o) { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
    if (o.enumerated !== undefined && o.undecided !== undefined) { need(!o.undecided.length, 'an undecided finite part in the lambda(4) record'); closed += o.closed; if (Array.isArray(o.skipped)) for (const x of o.skipped) { need(x === '1,2,3,4', 'a set other than the extremizer was skipped'); skips++; } }
    Object.values(o).forEach(walk); })(fams);
  def('LfClosed', int(closed)); def('LfSkips', int(skips)); def('LfFamilies', int(Object.keys(fams).length));
  const gen = c.lambda4generic; need(gen && Array.isArray(gen.exceptions), 'the generic stage lost its exceptions'); def('LfGeneric', int(gen.exceptions.length));
  const W = T('paper/lambda4-proof.md').replace(/\s+/g, ' ');
  const mo = /\*\*Independent audit \((\d{4}-\d{2}-\d{2})\)\.\*\* An outside audit with no shared code\s*\(\[([^\]]+)\]\(([^)]+)\),\s*posted on \[teorth\/erdosproblems #(\d+)\]/.exec(W);
  need(mo, 'the lambda(4) write-up no longer records the outside audit as this paper states it');
  def('LfOutsideDate', mo[1]); def('LfOutsideRepo', tex(mo[2])); def('LfOutsideUrl', mo[3]); def('LfIssue', mo[4]);
  const ms = /largest element <= (\d+) as a proof-independent control \(\{1,2,3,4\}\s*deepest; the nearest rival \{([\d,]+)\} at about (-[\d.]+)\)/.exec(W);
  need(ms, 'the write-up no longer states the outside sweep bound and the nearest rival');
  def('LfOutsideMax', ms[1]); def('LfRival', '\\{' + ms[2] + '\\}'); def('LfRivalValue', '$' + ms[3] + '$');
  need(/the skip count above, the cone listing in Section 5, and the note that the cubic has three real roots/.test(W), 'the three documentation findings are no longer the ones the write-up names');
  def('LfFindings', 'three');
  need(/re-certified all finite cases with interval arithmetic/.test(W), 'the write-up no longer says the outside audit re-certified all finite cases');
}

/* ======================================================================= the bug catalogue and the red controls (parsed from the page builder) */
{
  const src = T('tools/build-report-methods.js');
  const bugs = [...src.matchAll(/^\s+caught: '([^']+)'/gm)].map((m) => m[1]);
  need(bugs.length >= 5, 'the bug catalogue shrank below what the paper describes');
  const by = {}; for (const b of bugs) { const k = b.replace(/ →.*$/, ''); by[k] = (by[k] || 0) + 1; }
  def('BugsN', int(bugs.length)); def('BugsMechanisms', int(Object.keys(by).length));
  rows('BugRows', Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => [tex(k), int(n)]));
  need(!/caught: 'reading the code'/.test(src), 'the catalogue now credits reading the code');
  const cheats = [...src.matchAll(/^\s+([a-z]): \{ cheat: '/gm)].length;
  need(cheats >= 10, 'the red-control table shrank');
  def('CheatsN', int(cheats));
  const gates = [...src.matchAll(/^\s+\['([^']+)', \['/gm)].length; def('GatesN', int(gates));
}
/* the position's date */
{
  const P = T('notes/positioning-decisions-2026-09-03.md');
  const m = /## RULINGS — (\d{4}-\d{2}-\d{2})/.exec(P); need(m, 'the positioning note lost its rulings date');
  def('PosDate', m[1]);
  need(/no shared code with the claimant|independence \*\*from the claimant\*\*/.test(P), 'the positioning note no longer restates independence as independence from the claimant');
}

fs.writeFileSync(OUT, M.join('\n') + '\n');
console.log('wrote paper/tex/register-numbers.tex (' + (M.length - 1) + ' macros)');
