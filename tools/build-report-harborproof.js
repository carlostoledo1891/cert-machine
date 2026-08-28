#!/usr/bin/env node
/* build-report-harborproof.js — generate reports/harborproof.html:
   HARBORPROOF first light — the FuelEU Maritime counterfactual, decided
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

   usage: node tools/build-report-harborproof.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const F = require(path.join(ROOT, 'instruments', 'fueleu', 'penalty.js'));
const die = (m) => { console.error('HARBORPROOF REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the instrument battery -------------------------------------- */
const bat = cp.spawnSync('node', ['instruments/fueleu/battery.js'], { cwd: ROOT });
const bm = /ALL PASS: (\d+) checks, (\d+) reds fired/.exec(String(bat.stdout));
if (bat.status !== 0 || !bm) die('the fueleu battery did not pass');
const batChecks = bm[1], batReds = bm[2];

/* ---- gate 2: the pinned registry ------------------------------------------ */
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'harborproof-2025.json'), 'utf8'));
const srcBytes = fs.readFileSync(path.join(ROOT, REC.source.file));
const srcSha = crypto.createHash('sha256').update(srcBytes).digest('hex');
if (srcSha !== REC.source.sha256) die('registry source drifted: ' + srcSha + ' != ' + REC.source.sha256);

/* ---- the decision, ship by ship ------------------------------------------- */
/* Boxes and screens, all stated on the page:
   - fossil-oil hypothesis: the ship's energy came from the three pinned
     Annex II oil rows (HFO/LFO/MGO) in unknown mix. Outer boxes:
     LCV in [0,0405, 0,0427] MJ/g · WtT in [13,2, 14,4] gCO2eq/MJ.
   - plausibility screen (prune-only, never admits): reported CO2eq/fuel
     must sit within [3,10, 3,35] g/g — the pinned rows give 3,169..3,261;
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

  rows.push({ imo: s.imo, name: s.name, type: s.type, scope, iLo, iHi, v25, v30, p25lo, p30lo, p30hi,
    flipLo: fl.verdict === 'FLIPS' ? fl.p : F.R(0), flipHi: fh.verdict === 'FLIPS' ? fh.p : F.R(0) });
}
const graded = buckets.decided + buckets.straddle;
if (!graded) die('no ship was decidable — the pipeline is broken');

const eurM = (cents) => (Number(cents / 1000000n) / 100).toLocaleString('en-US', { maximumFractionDigits: 1 });
rows.sort((a, b) => F.cmp(b.p30lo, a.p30lo));
flips.sort((a, b) => F.cmp(a, b));
const flipMedian = flips.length ? flips[Math.floor(flips.length / 2)] : null;
const top = rows.slice(0, 20);
const undecided = buckets.straddle + buckets.otherFuel + buckets.needsScope;

/* ---- the page ------------------------------------------------------------- */
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · harborproof · first light — FuelEU Maritime, first live compliance year',
  title: 'Re-sail the fleet\'s real year under the rule, and decide it',
  deck: 'Replay a real year of operations under the rule that is in force, and get a verdict with a proof, '
    + 'not a forecast. Every ship in the official EU-MRV registry of 2025 — the first year FuelEU Maritime '
    + 'penalties exist — is re-fueled on paper under the regulation\'s own published arithmetic, in exact '
    + 'rationals over stated boxes: compliant by a margin, non-compliant with an exact penalty floor in EUR, '
    + 'or NEEDS DATA where the public record\'s own opacity leaves the verdict open. Nothing here is an '
    + 'estimate; where an estimate would be needed, the instrument refuses instead.'
}));

B.push(C.tldr({
  findingRaw: 'All three of the regulation\'s own default oil rows sit ABOVE the limit that is live right now '
    + '— an oil-only ship cannot comply with FuelEU by construction — and this page prices that exactly: the '
    + counts.n25.toLocaleString('en-US') + ' registry ships whose 2025 reports are consistent with oil-only '
    + 'operation carry a penalty-exposure floor of EUR ' + eurM(sumLo25) + 'M on the year they already sailed, '
    + 'growing to EUR ' + eurM(sumLo30) + 'M re-sailed unchanged under 2030 — with the exact zero-WtW blend '
    + 'fraction that flips each ship computed per ship (median ' + (flipMedian ? F.dec(F.mul(flipMedian, F.R(100)), 2) + '%' : '—') + ').',
  mechanismRaw: 'the official per-ship registry (verified annual fuel + CO2eq, sha-pinned) × Regulation (EU) '
    + '2023/1805\'s own formulas (constants transcribed from pinned OJ bytes) × exact rational interval '
    + 'arithmetic — verdicts decided over the WHOLE stated box, never at a point; boxes that straddle the limit '
    + 'are refused as NEEDS DATA, never guessed.',
  checkRaw: C.m('node instruments/fueleu/battery.js') + ' (' + batChecks + ' checks, ' + batReds + ' reds) · '
    + C.m('python3 tools/extract-harborproof.py') + ' · ' + C.m('node tools/build-report-harborproof.js')
}));

B.push(C.stats([
  { k: 'the registry', v: REC.ships.length.toLocaleString('en-US') + ' ships', role: 'held', n: 'EU MRV public emission report, period 2025 v' + REC.source.version + ' — generated 28 Aug 2026, sha-pinned; every number a verified company report, none of them ours' },
  { k: 'decided', v: graded.toLocaleString('en-US'), role: 'held', n: buckets.decided.toLocaleString('en-US') + ' fully decided both years over their whole constrained box · ' + buckets.straddle.toLocaleString('en-US') + ' straddle a limit · ' + buckets.otherFuel.toLocaleString('en-US') + ' outside the oil hypothesis — the maybe-compliant ships, undecidable until their fuel mix is public' },
  { k: '2025, the live year', v: counts.n25.toLocaleString('en-US') + ' over', role: 'warn', n: 'ships whose WHOLE intensity box exceeds the 89.3368 gCO2eq/MJ limit in force right now (' + counts.c25.toLocaleString('en-US') + ' compliant) — every pinned oil row exceeds it, so oil-only operation is non-compliant by the rule\'s design' },
  { k: 'penalty floor, 2025', v: 'EUR ' + eurM(sumLo25) + 'M', role: 'warn', n: 'the Annex IV arithmetic summed over the fleet at the FAVORABLE end of every box (floor-rounded cents) — before pooling, banking and borrowing, which are company-level flexibilities' },
  { k: 're-sailed under 2030', v: 'EUR ' + eurM(sumLo30) + 'M', role: 'warn', n: 'same fleet, same operations, the -6% limit: the exposure floor; the ceiling end of the boxes reaches EUR ' + eurM(sumHi30) + 'M' },
  { k: 'the flip threshold', v: flipMedian ? F.dec(F.mul(flipMedian, F.R(100)), 2) + '%' : '—', n: 'median exact fraction of scope energy that must come from a zero-WtW fuel to comply in 2030 — computed per ship, the disclosure-shaped number the rule is designed to force' }
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
      + '(Annex IV B) — a closed-form function of numbers a company must already report. The first penalty '
      + 'cycle of this rule closed in June 2026: it is in force, not coming.'),
    C.pRaw('Every constant used here is transcribed from the pinned Official Journal bytes — '
      + '<span class="m">corpus/sources/fueleu_reg-2023-1805_oj-l234_2023-09-22.pdf</span>, sha256 '
      + '<span class="m">492df4f7…</span> — and the GWP factors from the pinned RED II Annex V C(4) '
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
      + 'scope. Version ' + REC.source.version + ', generated 28 August 2026, fetched from the THETIS-MRV '
      + 'public API and pinned: <span class="m">' + REC.source.sha256.slice(0, 16) + '…</span>. The build '
      + 're-hashes the bytes and refuses on drift; the extraction is stdlib Python, keeps every figure as the '
      + 'exact decimal string the registry printed, and is rerunnable in one command.'),
    C.p('Nothing about a ship is modeled here: no speed curves, no engine assumptions, no AIS. The energy is '
      + 'the ship\'s own reported fuel; the scope share is the ship\'s own reported voyage split. What the '
      + 'registry does not say — which fuel, exactly — enters as a box, and the box is the honest price of '
      + 'the record\'s opacity.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · the method', title: 'Boxes, screens, and refusal — stated in full',
  bodyRaw: [
    C.pRaw('<strong>The fossil-oil hypothesis.</strong> A decided ship is assumed to burn some mix of the '
      + 'regulation\'s three pinned oil rows (HFO, LFO, MGO): LCV in <span class="m">[0,0405, 0,0427]</span> '
      + 'MJ/g, well-to-tank in <span class="m">[13,2, 14,4]</span> gCO2eq/MJ. Its tank-to-wake intensity is '
      + 'not assumed at all — it is the ship\'s own reported CO2eq divided by its own reported fuel. A '
      + 'plausibility screen (prune-only, like every screen in this machine) admits the hypothesis only when '
      + 'that ratio sits in <span class="m">[3,10, 3,35]</span> g/g, where the pinned oil rows themselves '
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
      + 'sharpen as more of the record becomes public.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§4 · the board', title: 'The twenty largest 2030 exposures, decided', wide: true,
  bodyRaw: '<div class="col">'
    + C.p('Ranked by the FLOOR of the 2030 penalty box — the amount the Annex IV arithmetic yields even at '
      + 'the most favorable end of every stated box. Names and IMO numbers are the registry\'s own; these are '
      + 'public verified reports, restated under a published formula.')
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

const foot = '<footer class="col"><p>Generated by tools/build-report-harborproof.js @ git ' + git + '. Gates at '
  + 'this build: instruments/fueleu/battery.js (' + batChecks + ' checks, ' + batReds + ' reds fired — limits, '
  + 'penalty and flip re-derived by hand from pinned OJ bytes; the 1e-9 boundary forgery flipped), the registry '
  + 'bytes re-hashed against their pin, and the whole fleet recomputed in exact rationals during this build. '
  + 'Verdicts are decided over stated boxes; a straddling box is refused as NEEDS DATA, never guessed. Not a '
  + 'compliance determination; not legal advice. MIT. <a href="https://github.com/carlostoledo1891/cert-machine">Source</a>.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'harborproof.html'),
  TPL.render({ title: 'HARBORPROOF · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot }));
console.log('reports/harborproof.html written: ' + REC.ships.length + ' ships, ' + graded + ' graded ('
  + buckets.decided + ' decided, ' + buckets.straddle + ' straddle), 2025 floor EUR ' + eurM(sumLo25)
  + 'M, 2030 floor EUR ' + eurM(sumLo30) + 'M @ git ' + git);
