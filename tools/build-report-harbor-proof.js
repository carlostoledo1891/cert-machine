#!/usr/bin/env node
/* build-report-harbor-proof.js — generate reports/harbor-proof.html:
   HarborProof first light — the FuelEU Maritime counterfactual, decided
   over the official registry of the rule's FIRST live compliance year.

   The shape: pinned real-world data (the EU MRV public emission report,
   reporting period 2025 — every ship's own verified annual fuel and CO2eq)
   × the published rule (Regulation (EU) 2023/1805, constants transcribed
   from pinned OJ bytes) × an exact instrument (instruments/fueleu) — every
   ship re-fueled on paper and DECIDED: compliant by a margin, non-compliant
   with an exact penalty floor, or NEEDS DATA where the registry's own
   opacity leaves the box straddling the limit.

   Gates, every build:
     1. instruments/fueleu/battery.js re-runs (hand-computed limits,
        penalties, flips; the 1e-9 boundary forgery must flip) — or refuse.
     2. The extraction record's source sha256 is re-hashed against the
        pinned registry bytes — drift refuses.
     3. The whole fleet is recomputed HERE, at build, in exact rationals;
        nothing on the page is remembered.

   usage: node tools/build-report-harbor-proof.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const F = require(path.join(ROOT, 'instruments', 'fueleu', 'penalty.js'));
const die = (m) => { console.error('HARBOR-PROOF REFUSED: ' + m); process.exit(1); };
/* WARRANT v2.1 (design/WARRANT.md), 2026-10-28. Every verdict, intensity box, penalty box and flip fraction here is
   exact rational arithmetic: DECIDED, plain. What the page decides them OVER is not: the registry's reports, the
   rule's constants as transcribed, the fossil-oil hypothesis, the uniform-mix hypothesis, and for 2030 the year
   re-sailed unchanged. §3 names them with their grades (rule 11), and a number that holds only given a chosen
   scenario says so in italic (rule 6). The page used to say "nothing about a ship is modeled here"; two of those
   premises are models of a ship, and the page now names them instead. */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const GIVEN30 = '<em>given 2025\'s operations re-sailed unchanged</em>';
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the instrument battery -------------------------------------- */
const bat = cp.spawnSync('node', ['instruments/fueleu/battery.js'], { cwd: ROOT });
const bm = /ALL PASS: (\d+) checks, (\d+) reds fired/.exec(String(bat.stdout));
if (bat.status !== 0 || !bm) die('the fueleu battery did not pass');
const batChecks = bm[1], batReds = bm[2];

/* ---- gate 2: the pinned registry ------------------------------------------ */
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'harbor-proof-2025.json'), 'utf8'));
const srcBytes = fs.readFileSync(path.join(ROOT, REC.source.file));
const srcSha = crypto.createHash('sha256').update(srcBytes).digest('hex');
if (srcSha !== REC.source.sha256) die('registry source drifted: ' + srcSha + ' != ' + REC.source.sha256);

/* ---- the typed constants, read from the instrument and the record (WARRANT rule 8, 2026-10-28) ---- */
const num = (r) => Number(F.dec(r, 6));
if (!(num(F.REFERENCE) === 91.16 && ['2025', '2030', '2035', '2040', '2045', '2050'].map((y) => F.dec(F.mul(F.REDUCTIONS[y], F.R(100)), 1)).join() === '2.0,6.0,14.5,31.0,62.0,80.0')) die('the reference value or the reduction steps moved');
if (!(num(F.GWP.co2) === 1 && num(F.GWP.ch4) === 25 && num(F.GWP.n2o) === 298)) die('the GWP factors moved');
const PSRC = fs.readFileSync(path.join(ROOT, 'instruments', 'fueleu', 'penalty.js'), 'utf8');
if (!(/VLSFO_MJ_PER_T = R\(41000\)/.test(PSRC) && /EUR_PER_T = R\(2400\)/.test(PSRC))) die('the Annex IV constants 41 000 and 2 400 moved');
const OILS = Object.values(F.FUELS);
const lcvs = OILS.map((f) => num(f.lcv)), wtts = OILS.map((f) => num(f.wtt));
if (!(Math.min(...lcvs) === 0.0405 && Math.max(...lcvs) === 0.0427 && Math.min(...wtts) === 13.2 && Math.max(...wtts) === 14.4)) die('the oil rows\' LCV or WtT range moved');
/* THE SCREEN THAT WAS NOT THERE (2026-10-28). The page said the fossil-oil hypothesis is admitted "only when that ratio
   sits in [3,10, 3,35] g/g". No such screen exists: what admits a ship is intensityBoxFromCf, which refuses any ratio
   no mix of the pinned rows reproduces — the rows' own range, [3,1689, 3,2609] with the pinned GWPs. The page now
   prints that range, read from the rows; the counts never changed, because they were always computed by it. */
const cfgs = OILS.map((f) => F.cfgPerGram(f)).sort((a, b) => F.cmp(a, b));
/* F.dec truncates; a printed interval rounds outward (rule 8): its upper end up */
const decUp = (r, d) => { const t = F.dec(r, d); return F.cmp(F.fromDec(t), r) < 0 ? F.dec(F.add(F.fromDec(t), F.R(1, 10 ** d)), d) : t; };
const cfgLo = F.dec(cfgs[0], 4), cfgHi = decUp(cfgs[cfgs.length - 1], 4), cfgMgo = Number(F.dec(cfgs[cfgs.length - 1], 6)).toFixed(4);
const comma = (x) => String(x).replace('.', ',');
const genM = /^(\d\d)-(\d\d)-(\d{4})/.exec(REC.source.generated || '');
if (!genM) die('the registry source has no generation date');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const genLong = Number(genM[1]) + ' ' + MONTHS[Number(genM[2]) - 1] + ' ' + genM[3], genShort = Number(genM[1]) + ' ' + MONTHS[Number(genM[2]) - 1].slice(0, 3) + ' ' + genM[3];
const OJ = 'corpus/sources/fueleu_reg-2023-1805_oj-l234_2023-09-22.pdf';
const ojSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, OJ))).digest('hex');
if (!ojSha.startsWith('492df4f7')) die('the pinned Official Journal bytes moved: ' + ojSha.slice(0, 8));

/* ---- the decision, ship by ship ------------------------------------------- */
/* Boxes and screens, all stated on the page:
   - fossil-oil hypothesis: the ship's energy came from the three pinned
     Annex II oil rows (HFO/LFO/MGO) in unknown mix. Outer boxes:
     LCV in [0,0405, 0,0427] MJ/g · WtT in [13,2, 14,4] gCO2eq/MJ.
   - plausibility screen (prune-only, never admits): reported CO2eq/fuel
     must be reproducible by a mix of the pinned rows: 3,1689..3,2609 g/g (there was never a [3,10, 3,35] screen);
     ships outside (LNG, methanol, heavy bio blends, inconsistent reports)
     go to OTHER FUEL / NEEDS DATA and are never decided.
   - FuelEU scope share from the ship's own CO2eq voyage split:
     s = (intra + in-ports + (in + out)/2) / total  (Art. 2 scope), under
     the stated hypothesis that the fuel mix is uniform across voyages.
   - a split set that misses fields or misses closure by more than 2% is
     NEEDS DATA. */
const HALF = F.R(1, 2), MILLION = F.R(1000000);
const T25 = F.targetFor(2025), T30 = F.targetFor(2030);

const dec = (s) => { try { return F.fromDec(s); } catch (e) { return null; } };
const floorCents = (r) => { const n = r[0] * 100n, d = r[1]; return n >= 0n ? n / d : -((-n + d - 1n) / d); };
const ceilCents = (r) => { const n = r[0] * 100n, d = r[1]; return n >= 0n ? (n + d - 1n) / d : -(-n / d); };

const buckets = { decided: 0, straddle: 0, otherFuel: 0, needsScope: 0, noEnergy: 0 };
const counts = { c25: 0, n25: 0, c30: 0, n30: 0 };
let sumLo25 = 0n, sumHi25 = 0n, sumLo30 = 0n, sumHi30 = 0n;
const rows = [];
const flips = [];

for (const s of REC.ships) {
  const fuel = dec(s.fuel_t), tot = dec(s.co2eq_t);
  if (!fuel || !tot || F.cmp(fuel, F.R(0)) <= 0 || F.cmp(tot, F.R(0)) <= 0) { buckets.noEnergy++; continue; }
  const intra = dec(s.co2eq_intra_t), out = dec(s.co2eq_out_t), inn = dec(s.co2eq_in_t), ports = dec(s.co2eq_ports_t);
  if (!intra || !out || !inn || !ports) { buckets.needsScope++; continue; }
  const parts = F.add(F.add(intra, out), F.add(inn, ports));
  const gap = F.abs(F.sub(parts, tot));
  if (F.cmp(gap, F.mul(tot, F.R(2, 100))) > 0) { buckets.needsScope++; continue; }
  const cf = F.div(tot, fuel);
  const box = F.intensityBoxFromCf(cf);
  if (box.verdict !== 'BOX') { buckets.otherFuel++; continue; }
  const scope = F.div(F.add(F.add(intra, ports), F.mul(HALF, F.add(inn, out))), tot);
  if (F.cmp(scope, F.R(0)) <= 0) { buckets.noEnergy++; continue; }

  const { iLo, iHi } = box;
  const eLo = F.mul(F.mul(F.mul(scope, fuel), MILLION), box.lcvLo); /* MJ in FuelEU scope */
  const eHi = F.mul(F.mul(F.mul(scope, fuel), MILLION), box.lcvHi);

  const v25 = F.cmp(iHi, T25) <= 0 ? 'COMPLIANT' : F.cmp(iLo, T25) > 0 ? 'NON-COMPLIANT' : 'STRADDLES';
  const v30 = F.cmp(iHi, T30) <= 0 ? 'COMPLIANT' : F.cmp(iLo, T30) > 0 ? 'NON-COMPLIANT' : 'STRADDLES';
  if (v25 === 'STRADDLES' || v30 === 'STRADDLES') { buckets.straddle++; }
  else buckets.decided++;
  if (v25 === 'COMPLIANT') counts.c25++; if (v25 === 'NON-COMPLIANT') counts.n25++;
  if (v30 === 'COMPLIANT') counts.c30++; if (v30 === 'NON-COMPLIANT') counts.n30++;

  const p25lo = F.penaltyEUR(iLo, 2025, eLo).penalty, p25hi = F.penaltyEUR(iHi, 2025, eHi).penalty;
  const p30lo = F.penaltyEUR(iLo, 2030, eLo).penalty, p30hi = F.penaltyEUR(iHi, 2030, eHi).penalty;
  sumLo25 += floorCents(p25lo); sumHi25 += ceilCents(p25hi);
  sumLo30 += floorCents(p30lo); sumHi30 += ceilCents(p30hi);

  const fl = F.blendFlip(iLo, F.R(0), 2030), fh = F.blendFlip(iHi, F.R(0), 2030);
  if (fh.verdict === 'FLIPS') flips.push(fh.p);

  rows.push({ imo: s.imo, name: s.name, type: s.type, cf, scope, iLo, iHi, v25, v30, p25lo, p30lo, p30hi,
    flipLo: fl.verdict === 'FLIPS' ? fl.p : F.R(0), flipHi: fh.verdict === 'FLIPS' ? fh.p : F.R(0) });
}
const graded = buckets.decided + buckets.straddle;
if (!graded) die('no ship was decidable — the pipeline is broken');

const eurM = (cents) => (Number(cents / 1000000n) / 100).toLocaleString('en-US', { maximumFractionDigits: 1 });
rows.sort((a, b) => F.cmp(b.p30lo, a.p30lo));
flips.sort((a, b) => F.cmp(a, b));
const flipMedian = flips.length ? flips[Math.floor(flips.length / 2)] : null;
/* ONE MEDIAN, ONE PRINT (2026-10-28). The tl;dr and the stats printed F.dec(…, 2) — a truncation, 6.31% — and the
   figure printed the rounding, 6.32%, of the same number. And 12,620 is even: the median is any value between the two
   middle ships, 6.316167% and 6.316200%. Both round to the same two places, so at the printed precision it is one
   number and DECIDED; the build refuses if the two middles ever print differently. */
const pct2 = (r) => Number(F.dec(F.mul(r, F.R(100)), 6)).toFixed(2);
const flipMid = flips.length % 2 ? [flipMedian, flipMedian] : [flips[flips.length / 2 - 1], flipMedian];
if (flips.length && pct2(flipMid[0]) !== pct2(flipMid[1])) die('the two middle flip fractions print differently: the median is a choice at this precision');
const flipMedP = flipMedian ? pct2(flipMedian) + '%' : '—';
const top = rows.slice(0, 20);
const undecided = buckets.straddle + buckets.otherFuel + buckets.needsScope;
/* WHAT EVERY VERDICT RESTS ON (WARRANT v2.1, rule 11). Graded by what this page's records checked: the registry is
   the companies' and their verifiers', the constants were transcribed and read, the two hypotheses are stated and
   not tested, and 2030 is a chosen scenario. A grade is where the checking stopped. */
const PREMISES = [
  { grade: W.ASSUMED, label: 'The registry\'s reports',
    evidence: 'each ship\'s annual fuel, CO2eq and voyage split as its company reported them and its MRV verifier checked them; taken as reported. The CO2eq is the registry\'s, matched against the oil rows with the pinned GWPs; whether the registry used the same GWPs is not checked here, and the spike in §2b sits where no pinned row does.' },
  { grade: W.ASSUMED, label: 'The rule\'s constants',
    evidence: 'read and transcribed from the pinned Official Journal bytes and RED II Annex V; the battery re-derives the limits, a penalty and a flip threshold from them against hand computations from the same constants, so the transcription itself was read, not machine-checked.' },
  { grade: W.ASSUMED, label: 'The fossil-oil hypothesis',
    evidence: 'a ship whose reported CO2eq per gram of fuel some mix of the three pinned oil rows reproduces ([' + comma(cfgLo) + ', ' + comma(cfgHi) + '] g/g) burned such a mix. The screen prunes; it does not prove the fuel: any other fuel with the same ratio passes it.' },
  { grade: W.ASSUMED, label: 'One fuel mix on every voyage',
    evidence: 'the FuelEU scope share is the ship\'s CO2eq voyage split read as an energy split, which holds if the mix is the same on every voyage.' },
  { grade: W.ASSUMED, label: '2030, re-sailed',
    evidence: 'the 2030 figures re-sail 2025\'s operations unchanged under the 2030 limit: a chosen scenario, not a forecast.' },
];

/* ---- the page ------------------------------------------------------------- */
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · HarborProof · first light — FuelEU Maritime, first live compliance year',
  title: 'Re-sail the fleet\'s real year under the rule, and decide it',
  deck: 'Replay a real year of operations under the rule that is in force, and get a verdict with a proof, '
    + 'not a forecast. Every ship in the official EU-MRV registry of 2025 — the first year FuelEU Maritime '
    + 'penalties exist — is re-fueled on paper under the regulation\'s own published arithmetic, in exact '
    + 'rationals over stated boxes: compliant by a margin, non-compliant with an exact penalty floor in EUR, '
    + 'or NEEDS DATA where the public record\'s own opacity leaves the verdict open. Nothing here is an '
    + 'estimate: every verdict is decided over a stated box, given the hypotheses §3 names; where an estimate '
    + 'would be needed, the instrument refuses instead.'
}));

B.push(C.tldr({
  findingRaw: 'All three of the regulation\'s own default oil rows sit ABOVE the limit that is live right now '
    + '— an oil-only ship cannot comply with FuelEU by construction — and this page prices that exactly: the '
    + counts.n25.toLocaleString('en-US') + ' registry ships whose 2025 reports are consistent with oil-only '
    + 'operation carry a penalty-exposure floor of EUR ' + eurM(sumLo25) + 'M on the year they already sailed, '
    + 'growing to EUR ' + eurM(sumLo30) + 'M under the 2030 limit, ' + GIVEN30 + ' — with the exact zero-WtW blend '
    + 'fraction that flips each ship computed per ship (median ' + flipMedP + ').',
  mechanismRaw: 'the official per-ship registry (verifier-checked annual fuel + CO2eq, sha-pinned) × Regulation (EU) '
    + '2023/1805\'s own formulas (constants transcribed from pinned OJ bytes) × exact rational interval '
    + 'arithmetic — verdicts decided over the WHOLE stated box, never at a point; boxes that straddle the limit '
    + 'are refused as NEEDS DATA, never guessed.',
  checkRaw: C.m('node instruments/fueleu/battery.js') + ' (' + batChecks + ' checks, ' + batReds + ' reds) · '
    + C.m('python3 tools/extract-harbor-proof.py') + ' · ' + C.m('node tools/build-report-harbor-proof.js')
}));

B.push(C.stats([
  { k: 'the registry', v: REC.ships.length.toLocaleString('en-US') + ' ships', role: 'held', n: 'EU MRV public emission report, period 2025 v' + REC.source.version + ' — generated ' + genShort + ', sha-pinned; every number a company\'s report, checked by its MRV verifier; none of them ours' },
  { k: 'decided', v: graded.toLocaleString('en-US'), role: 'held', n: buckets.decided.toLocaleString('en-US') + ' fully decided both years over their whole constrained box · ' + buckets.straddle.toLocaleString('en-US') + ' straddle a limit · ' + buckets.otherFuel.toLocaleString('en-US') + ' outside the oil hypothesis — the maybe-compliant ships, undecidable until their fuel mix is public' },
  { k: '2025, the live year', v: counts.n25.toLocaleString('en-US') + ' over', role: 'warn', n: 'ships whose WHOLE intensity box exceeds the ' + F.dec(T25, 4) + ' gCO2eq/MJ limit in force right now (' + counts.c25.toLocaleString('en-US') + ' compliant) — every pinned oil row exceeds it, so oil-only operation is non-compliant by the rule\'s design' },
  { k: 'penalty floor, 2025', v: 'EUR ' + eurM(sumLo25) + 'M', role: 'warn', n: 'the Annex IV arithmetic summed over the fleet at the FAVORABLE end of every box (floor-rounded cents) — before pooling, banking and borrowing, which are company-level flexibilities' },
  { k: 're-sailed under 2030', v: 'EUR ' + eurM(sumLo30) + 'M', role: 'warn', nRaw: 'the -6% limit, ' + GIVEN30 + ': the exposure floor; the ceiling end of the boxes reaches EUR ' + eurM(sumHi30) + 'M' },
  { k: 'the flip threshold', v: flipMedP, n: 'median exact fraction of scope energy that must come from a zero-WtW fuel to comply in 2030 — computed per ship, the disclosure-shaped number the rule is designed to force' }
]));

B.push(C.section({
  lab: '§1 · the rule, pinned', title: 'A penalty that is a published exact formula',
  bodyRaw: [
    C.pRaw('FuelEU Maritime (Regulation (EU) 2023/1805) caps the well-to-wake GHG intensity of the energy a '
      + 'ship uses: the reference value is <span class="m">91,16 gCO2eq/MJ</span> and the limit steps down '
      + '<span class="m">-2%</span> from 2025, <span class="m">-6%</span> from 2030, <span class="m">-14,5%</span> '
      + 'from 2035, <span class="m">-31%</span>, <span class="m">-62%</span>, <span class="m">-80%</span> '
      + '(Art. 4(2)). The compliance balance is <span class="m">(GHGIE_target − GHGIE_actual) × energy</span> '
      + '(Annex IV A) and the penalty is <span class="m">|CB| / (GHGIE_actual × 41 000) × EUR 2 400</span> '
      + '(Annex IV B) — a closed-form function of numbers a company must already report. Its first reporting '
      + 'period is 2025, and the penalty for it fell due by 30 June 2026 (Art. 23, read from the pinned text): it is in force, not coming.'),
    C.pRaw('Every constant used here is transcribed from the pinned Official Journal bytes — '
      + '<span class="m">corpus/sources/fueleu_reg-2023-1805_oj-l234_2023-09-22.pdf</span>, sha256 '
      + '<span class="m">' + ojSha.slice(0, 8) + '…</span> — and the GWP factors from the pinned RED II Annex V C(4) '
      + '(<span class="m">CO2 1 · CH4 25 · N2O 298</span>). The instrument\'s battery re-derives the limits, a '
      + 'hand-computed penalty and a hand-computed flip threshold from those constants at every build, and a '
      + 'forged intensity one part in 10⁹ over the limit must flip the verdict — no tolerance window exists '
      + 'for an optimizer to land in.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · the data', title: 'The fleet\'s own verified reports, not our measurements',
  bodyRaw: [
    C.pRaw('The activity record is the EU-MRV public emission report for period 2025 — '
      + REC.ships.length.toLocaleString('en-US') + ' ships\' verifier-checked annual totals: fuel consumed, '
      + 'CO2eq emitted, and the voyage split (intra-EU / inbound / outbound / in-port) that determines FuelEU '
      + 'scope. Version ' + REC.source.version + ', generated ' + genLong + ', fetched from the THETIS-MRV '
      + 'public API and pinned: <span class="m">' + REC.source.sha256.slice(0, 16) + '…</span>. The build '
      + 're-hashes the bytes and refuses on drift; the extraction is stdlib Python, keeps every figure as the '
      + 'exact decimal string the registry printed, and is rerunnable in one command.'),
    C.p('No ship\'s operation is modeled here: no speed curves, no engine assumptions, no AIS. The energy is '
      + 'the ship\'s own reported fuel; the scope share is the ship\'s own reported voyage split. What the '
      + 'registry does not say — which fuel, exactly — enters as a box under two stated hypotheses (§3), and '
      + 'the box is the honest price of the record\'s opacity.')
  ].join('\n')
}));

/* ---- the disclosure number, as a population -------------------------------
   The flip fraction is the number the rule exists to force out of a shipowner:
   how much zero-WtW fuel this hull must burn to comply. One median is a
   headline; the SHAPE is the finding — a tight ridge, because the constraint
   binding these ships is the regulation's own oil rows, not their individual
   operations. */
{
  const pct = r => Number(F.dec(F.mul(r, F.R(100)), 4));
  const vals = flips.map(pct);
  const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  const NB = 44, w = (hi - lo) / NB;
  const bins = [];
  for (let i = 0; i < NB; i++) bins.push({ n: 0, a: lo + i * w, b: lo + (i + 1) * w });
  for (const v of vals) bins[Math.min(NB - 1, Math.floor((v - lo) / w))].n++;
  const q = f => vals[Math.min(vals.length - 1, Math.floor(f * vals.length))];
  const med = pct(flipMedian);
  const peak = Math.max.apply(null, bins.map(b => b.n));
  /* The tall bin is not noise and it is not a binning artefact — measure it
     rather than describing it: how many ships, and how many DISTINCT reported
     ratios do they carry between them. */
  const pk = bins.reduce((a, b, i) => (b.n > bins[a].n ? i : a), 0);
  const inPeak = vals.filter(v => v >= bins[pk].a && v < bins[pk].b);
  const peakDistinct = new Set(inPeak.map(v => v.toFixed(4))).size;
  const peakShare = (100 * inPeak.length / vals.length).toFixed(0);
  /* the spike's own ratios: the flip fraction is a function of the reported CO2eq/fuel alone, so the tall bin is an
     interval of ratios, and the sentence "a shared default emission factor" gets its number (2026-10-28) */
  const peakCf = rows.filter((r) => { const v = pct(r.flipHi); return v >= bins[pk].a && v < bins[pk].b; }).map((r) => r.cf).sort((a, b) => F.cmp(a, b));
  if (peakCf.length !== inPeak.length) die('the spike\'s ships and its ratios do not match');
  const peakCfLo = F.dec(peakCf[0], 4), peakCfHi = decUp(peakCf[peakCf.length - 1], 4);
  if (!cfgs.every((c) => F.cmp(c, peakCf[0]) < 0 || F.cmp(c, peakCf[peakCf.length - 1]) > 0)) die('a pinned oil row lies inside the spike: the sentence would be false');
  const fig = CH.dist({
    w: 900, h: 300, x0: lo, x1: hi, y0: 0, y1: peak,
    bins: bins.map(b => ({ n: b.n, k: b.a.toFixed(2) + '–' + b.b.toFixed(2) + '%' })),
    unit: 'ships',
    xTicks: [lo, 4, 5, 6, 7, 8, 9, hi].filter(v => v >= lo && v <= hi)
      .map(v => ({ v, t: v.toFixed(v % 1 ? 2 : 0) + '%' })),
    yTicks: [{ v: 0, t: '0' }, { v: peak / 2, t: Math.round(peak / 2).toLocaleString('en-US') },
             { v: peak, t: peak.toLocaleString('en-US') }],
    xLabel: 'zero-WtW share of scope energy required to comply in 2030  (exact, per ship)',
    yLabel: 'ships',
    marks: [{ x: med, t: 'median ' + med.toFixed(2) + '%', token: 'var(--c-3)' }],
    unitLabel: 'ships',
    alt: 'A distribution of the exact zero-well-to-wake fuel share each ship must reach to comply in 2030. '
      + flips.length.toLocaleString('en-US') + ' ships span ' + lo.toFixed(2) + '% to ' + hi.toFixed(2)
      + '%, piled into a narrow ridge around the median of ' + med.toFixed(2) + '%.'
  });
  B.push(C.section({
    lab: '§2b · the disclosure number', title: 'How much clean fuel, exactly — for every ship at once',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('A verdict tells an owner they fail. This tells them the price of passing: the exact fraction of '
        + 'scope energy that must come from a zero-well-to-wake fuel before the 2030 limit is cleared. It is '
        + 'computed per ship from that ship\'s own reported numbers, in exact rationals, and it is the number '
        + 'the regulation is designed to force into the open.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: flips.length.toLocaleString('en-US') + ' ships, each contributing one '
        + 'exact fraction. The whole fleet lives inside one percentage point — ' + lo.toFixed(2) + '% to '
        + hi.toFixed(2) + '%, median ' + med.toFixed(2) + '%, 10th percentile ' + q(0.10).toFixed(2)
        + '% and 90th ' + q(0.90).toFixed(2) + '% — because what binds these ships is the regulation\'s own '
        + 'oil rows, not the particulars of how each one sailed. THE SPIKE is the part worth stopping on: '
        + inPeak.length.toLocaleString('en-US') + ' ships (' + peakShare + '% of the decided fleet) land in a '
        + 'single bin ' + ((bins[pk].b - bins[pk].a) * 100).toFixed(1) + ' hundredths of a point wide, and '
        + 'between them they carry only ' + peakDistinct + ' distinct values: every one of them reports between ' + peakCfLo + ' and ' + peakCfHi + ' g CO2eq per g of fuel, a ratio no pinned oil row gives (MGO\'s, with the pinned GWPs, is ' + cfgMgo + '). Two thousand independent '
        + 'measurements would not do that; one emission factor applied by default would. The chart is reading the '
        + 'registry\'s reporting practice, not the sea. The ' + NB + ' equal bins, from the smallest fraction to the largest, are a chosen layout; the ratios above are not.' })
  }));
}

B.push(C.section({
  lab: '§3 · the method', title: 'Boxes, screens, and refusal — stated in full',
  bodyRaw: [
    C.pRaw('<strong>The fossil-oil hypothesis.</strong> A decided ship is assumed to burn some mix of the '
      + 'regulation\'s three pinned oil rows (HFO, LFO, MGO): LCV in <span class="m">[0,0405, 0,0427]</span> '
      + 'MJ/g, well-to-tank in <span class="m">[13,2, 14,4]</span> gCO2eq/MJ. Its tank-to-wake intensity is '
      + 'not assumed at all — it is the ship\'s own reported CO2eq divided by its own reported fuel. A '
      + 'plausibility screen (prune-only, like every screen in this machine) admits the hypothesis only when '
      + 'some mix of the pinned rows reproduces that ratio — <span class="m">[' + comma(cfgLo) + ', ' + comma(cfgHi) + ']</span> g/g, where the pinned oil rows themselves '
      + 'live; LNG burners, methanol, heavy bio blends and inconsistent reports fall outside and are counted, '
      + 'never decided. ' + buckets.otherFuel.toLocaleString('en-US') + ' ships sit there today.'),
    C.pRaw('<strong>The box is constrained by the ship\'s own numbers, then decided whole.</strong> The '
      + 'reported CO2eq/fuel ratio pins the feasible oil mixes to a one-parameter family, and the intensity '
      + 'extremes of that family sit at two-fuel vertex blends — computed exactly, so each box is tight: it '
      + 'contains every mix consistent with the observation and nothing else. COMPLIANT means every point of '
      + 'the box clears the limit; NON-COMPLIANT means every point exceeds it; a straddling box is NEEDS '
      + 'DATA, never guessed (' + buckets.straddle.toLocaleString('en-US') + ' today — the tightened boxes '
      + 'decide everything the screen admits). The undecided mass lives in the '
      + buckets.otherFuel.toLocaleString('en-US') + ' ships OUTSIDE the oil screen — LNG, methanol, bio '
      + 'blends: precisely the candidates for actual compliance, and precisely the rows the public record '
      + 'cannot yet decide. The per-fuel breakdown FuelEU already makes companies compute would decide every '
      + 'one; NEEDS DATA is this page measuring that opacity. Penalty sums use directed rounding (floors on '
      + 'the floor, ceilings on the ceiling), so the stated exposure range is a theorem under the stated '
      + 'hypotheses, not an estimate.'),
    C.pRaw('<strong>What this is not.</strong> FuelEU compliance is assessed per company with banking, '
      + 'borrowing and pooling; these figures are the raw per-ship Annex IV arithmetic before those '
      + 'flexibilities, under the stated boxes — a mathematically certified counterfactual, not a compliance '
      + 'determination, not a verification statement in the class-society sense, and not legal advice. '
      + 'Scope shares inherit the stated uniform-fuel-mix-across-voyages hypothesis; ice-class and OPS '
      + 'derogations are not applied. Every one of these boundaries is a place the same instrument can '
      + 'sharpen as more of the record becomes public.'),
    C.pRaw('<strong>What every verdict rests on.</strong> The arithmetic is exact; what it is exact about is a set of '
      + 'premises. In the order a ship travels through them, each with the rung its checking reached — <b>validated</b> '
      + '(against the thing itself, held out), <b>compared</b> (against a model that keeps more), <b>verified</b> (the '
      + 'code against an exact solution of its own equations) or <b>assumed</b> (adopted, chosen or read; no machine '
      + 'here checked it):')
      + W.premisesHtml(PREMISES, { meetLine: 'The arithmetic is exact; the weakest premise is <b>' + W.GRADE[W.weakest(...PREMISES.map((q) => q.grade))] + '</b>. Every verdict and every euro on this page is decided <em>given</em> these premises, and none of them is checked here against a ship.' })
  ].join('\n')
}));

B.push(C.section({
  lab: '§4 · the board', title: 'The twenty largest 2030 exposures, decided', wide: true,
  bodyRaw: '<div class="col">'
    + C.p('Ranked by the FLOOR of the 2030 penalty box — the amount the Annex IV arithmetic yields even at '
      + 'the most favorable end of every stated box. Names and IMO numbers are the registry\'s own; these are '
      + 'public, verifier-checked reports, restated under a published formula. The 2030 columns hold given 2025\'s operations re-sailed unchanged.')
    + '</div>'
    + C.table({
      cols: [{ h: 'IMO' }, { h: 'ship' }, { h: 'type' }, { h: 'FuelEU scope share' }, { h: 'intensity box gCO2eq/MJ' }, { h: '2025' }, { h: 're-sailed 2030' }, { h: '2030 penalty box [EUR]' }, { h: 'zero-WtW blend to flip 2030' }],
      rows: top.map((r) => [
        { raw: '<span class="m">' + C.esc(r.imo) + '</span>' },
        r.name, r.type,
        F.dec(F.mul(r.scope, F.R(100)), 1) + '%',
        { raw: '<span class="m">[' + F.dec(r.iLo, 2) + ', ' + F.dec(r.iHi, 2) + ']</span>' },
        r.v25, r.v30,
        { raw: '<span class="m">[' + Number(floorCents(r.p30lo) / 100n).toLocaleString('en-US') + ', ' + Number(ceilCents(r.p30hi) / 100n).toLocaleString('en-US') + ']</span>' },
        { raw: '<span class="m">[' + F.dec(F.mul(r.flipLo, F.R(100)), 2) + '%, ' + F.dec(F.mul(r.flipHi, F.R(100)), 2) + '%]</span>' }
      ])
    })
    + '<div class="col">'
    + C.pRaw('The full fleet: ' + buckets.decided.toLocaleString('en-US') + ' ships decided in both years · '
      + buckets.straddle.toLocaleString('en-US') + ' NEEDS DATA (box straddles a limit) · '
      + buckets.otherFuel.toLocaleString('en-US') + ' outside the fossil-oil screen · '
      + buckets.needsScope.toLocaleString('en-US') + ' with unusable voyage splits · '
      + buckets.noEnergy.toLocaleString('en-US') + ' with no reported EU-scope activity. Every count is '
      + 'recomputed from the pinned registry at this build.')
    + '</div>'
}));

B.push(C.section({
  lab: '§5 · what the flip threshold is for', title: 'The rule as an incentive machine, made exact',
  bodyRaw: [
    C.p('For every non-compliant ship the instrument computes the exact energy fraction that must come from '
      + 'a zero-well-to-wake fuel for the same operations to comply in 2030 — an interval, because the '
      + 'fuel-type opacity propagates. That number is what a charterer, a lender under the Poseidon '
      + 'Principles, or a fuel supplier actually negotiates about; today it is bought as consultancy '
      + 'estimate. Here it is a computation anyone can rerun, and the same arithmetic generalizes to any '
      + 'candidate fuel intensity — replace zero with the fuel\'s pinned WtW value and the blend fraction '
      + 'is one exact division away.'),
    C.pRaw('This page is first light for the observatory, not its final shape: the roadmap is per-fuel '
      + 'candidate boxes (methanol, ammonia, wind-assist), company-level aggregation with pooling arithmetic, '
      + 'AIS-replay voyage scoping, and committed FORECASTS of next year\'s margins graded by '
      + '<a href="/reports/forecast-gym.html">the Forecast Gym</a>\'s machinery. The instrument, the pinned '
      + 'rule, and the registry join are the load-bearing parts, and they are live above.')
  ].join('\n')
}));

const foot = '<p>Generated by tools/build-report-harbor-proof.js @ git ' + git + '. Gates at '
  + 'this build: instruments/fueleu/battery.js (' + batChecks + ' checks, ' + batReds + ' reds fired — limits, '
  + 'penalty and flip re-derived by hand from pinned OJ bytes; the 1e-9 boundary forgery flipped), the registry '
  + 'bytes re-hashed against their pin, and the whole fleet recomputed in exact rationals during this build. '
  + 'Verdicts are decided over stated boxes; a straddling box is refused as NEEDS DATA, never guessed. Not a '
  + 'compliance determination; not legal advice. MIT. <a href="https://github.com/carlostoledo1891/cert-machine">Source</a>.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'harbor-proof.html'),
  TPL.render({ title: 'HarborProof · cert-machine', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/harbor-proof.html',
    desc: 'HarborProof: every ship in the official EU-MRV 2025 registry re-fueled on paper under FuelEU Maritime\'s own penalty formula, in exact rationals — penalty floors in EUR, exact blend fractions that flip each verdict, NEEDS DATA where the record cannot say.' }));
console.log('reports/harbor-proof.html written: ' + REC.ships.length + ' ships, ' + graded + ' graded ('
  + buckets.decided + ' decided, ' + buckets.straddle + ' straddle), 2025 floor EUR ' + eurM(sumLo25)
  + 'M, 2030 floor EUR ' + eurM(sumLo30) + 'M @ git ' + git);
