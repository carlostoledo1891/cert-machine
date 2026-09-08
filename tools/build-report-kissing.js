#!/usr/bin/env node
/* build-report-kissing.js — reports/kissing.html: the kissing ledger.

   Dimension 11's kissing record moved three times in eighteen months and
   every mover was an AI system — AlphaEvolve (593), the EinsteinArena
   agents (594 on the public rung; 604 in the paper), the Station agents
   (three exact 604s in Q(sqrt2)). Each was validated by its producer's own
   verifier. This page re-decides every public witness in exact arithmetic
   over Z[sqrt2] on BigInt, shared-nothing with all of them. The
   EinsteinArena 604's bytes were not public when this ledger first ran
   (2026-09-03): the row read NEEDS DATA and named what would decide it;
   the maintainer published the file on request four days later and the
   row decided. The page tells that story with the dates from the record.

   Gates: the ledger re-runs live at this build (every verdict recomputed
   from the pinned corpus bytes), and the kissing battery must pass with
   every red control fired. A REFUTED row refuses the page.

   usage: node tools/build-report-kissing.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('KISSING REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the ledger, recomputed live ---- */
const led = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-kissing-ledger.js')], { cwd: ROOT });
if (led.status !== 0) die('the ledger run failed:\n' + String(led.stderr).slice(-600));

/* ---- gate 2: the battery, every red fired ---- */
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'kissing', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /kissing battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the kissing battery did not pass clean:\n' + bout.slice(-600));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'kissing-ledger.json'), 'utf8'));
const row = (id) => { const r = L.rows.find((x) => x.id === id); if (!r) die('missing row ' + id); return r; };
const ae = row('alphaevolve-593'), ea = row('ea-594-winner');
const s1 = row('station-604-1'), s2 = row('station-604-2'), s3 = row('station-604-3');
const sh = row('station-shell-582'), lift = row('station-d12-lift'), ea604 = row('ea-604');
const certified = L.rows.filter((r) => r.verdict === 'CERTIFIED').length;
if (ea604.verdict !== 'CERTIFIED' || ea604.uniformNorm !== true) die('the EinsteinArena 604 row is not CERTIFIED at its shell norm');
if (!ea604.sameGramProfileAs || ea604.sameGramProfileAs.length !== 1 || ea604.sameGramProfileAs[0] !== 'station-604-1') die('the Gram-profile sentence (EinsteinArena 604 ~ Station configuration 1 only) would be false');
if (ea604.contacts !== s1.contacts) die('the EinsteinArena 604 and Station configuration 1 no longer share a contact count');
const daysToBytes = Math.round((Date.parse(ea604.bytesPublished) - Date.parse(ea604.needsDataFrom)) / 86400000);
if (!(daysToBytes > 0)) die('the NEEDS DATA interval is not positive');
const sharedS1 = ea604.sharedDirectionsWith['station-604-1'];
if (L.rows.some((r) => r.verdict === 'REFUTED')) die('a REFUTED row reached the page builder');
for (const c of [s1, s2, s3]) if (c.uniformNorm !== true) die('a 604 configuration lost its shell-norm-4 uniformity');
const distinct = new Set([s1.contacts, s2.contacts, s3.contacts]).size === 3;
if (!distinct) die('the three 604 contact counts collided — the non-congruence sentence would be false');
const fmt = (x) => x.toLocaleString('en-US');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the registry · every witness re-decided at this build',
  title: 'Thirty years at 582. Then three AIs in eighteen months.',
  deck: 'The kissing number asks how many unit spheres can touch a central one — Newton and Gregory argued '
    + 'about dimension 3 in 1694. In dimension 11 the record stood near 582 for decades, then moved three times '
    + 'in eighteen months, every mover an AI system, each validated by its producer\'s own verifier. This page '
    + 're-decides every public witness in exact arithmetic, shared-nothing with all of them — including the '
    + 'record whose bytes were not public until this ledger asked for them.'
}));

B.push(C.tldr({
  findingRaw: '<strong>K(11) &ge; 604 is independently certified here</strong> — all three of the Station '
    + 'agents\' 604-point configurations decide CERTIFIED in exact Z[&radic;2] arithmetic, at shell norm '
    + 'exactly 4, with ' + fmt(s1.contacts) + ' / ' + fmt(s2.contacts) + ' / ' + fmt(s3.contacts)
    + ' exact contacts (distinct counts: the three are provably pairwise non-congruent). The whole AI ladder '
    + 'certifies from each claimant\'s own bytes: AlphaEvolve\'s 593, the EinsteinArena rung winner\'s 594 — and '
    + 'now <strong>EinsteinArena\'s headline 604</strong>, whose coordinates were not public when this ledger first '
    + 'ran. That row read NEEDS DATA for ' + daysToBytes + ' days and named the bytes that would decide it; the '
    + 'platform\'s maintainer published them on request and the row decided CERTIFIED with ' + fmt(ea604.contacts)
    + ' exact contacts. Its exact Gram profile is identical to the Station\'s configuration 1 — necessary for '
    + 'congruence, not sufficient; whether the two are one configuration is not decided here.',
  mechanismRaw: 'A set of nonzero directions with every pairwise angle &ge; 60&deg; IS a kissing configuration '
    + '(put each sphere at 2x/|x|), and that condition is scale-invariant per vector: '
    + C.m('⟨x,y⟩ ≤ 0  or  4⟨x,y⟩² ≤ ⟨x,x⟩⟨y,y⟩') + ', decided '
    + 'exactly. The whole instrument is BigInt arithmetic in Z[&radic;2] — the field the 604s live in — with '
    + 'the classical two-case sign test; a decimal literal is read as the exact rational it denotes, never as '
    + 'its float64 neighbor. No float participates in any decision on this page.',
  checkRaw: C.m('node instruments/kissing/battery.js') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls '
    + 'that must fire, D4 (24) and E8 (240) re-proved from generated bytes at every run. '
    + C.m('node tools/run-kissing-ledger.js') + ' rebuilds every verdict from the pinned corpus bytes.'
}));

B.push(C.stats([
  { k: 'the record, certified here', v: 'K(11) ≥ 604', role: 'held', n: 'four published 604-point configurations — the Station\'s three and EinsteinArena\'s headline — each independently re-decided from sha-pinned bytes' },
  { k: 'the interval, today', v: '604 ≤ K(11) ≤ 868', role: 'open', n: 'upper bound: literature (SDP), NOT audited here — this page touches lower-bound witnesses only' },
  { k: 'ladder rows certified', v: certified + ' of ' + L.rows.length, role: 'held', n: '582 · 593 · 594 · 604×4 · a D12 lift · two classical calibrations — every verdict recomputed at this build' },
  { k: 'exact contacts, config 2', v: fmt(s2.contacts), role: 'held', n: 'pairs at exactly 60° — decided as equalities in Z[√2], not as floats that look close' },
  { k: 'needs data → certified', v: daysToBytes + ' days', role: 'held', n: 'EinsteinArena\'s headline 604: NEEDS DATA on ' + ea604.needsDataFrom + ', coordinates published on request ' + ea604.bytesPublished + ', decided the same day in ' + ea604.ms + ' ms' },
  { k: 'calibration', v: 'E8: 6,720 contacts', role: 'held', n: '240·56/2 — the textbook count of 60° pairs in the E8 root system, re-derived from generated bytes every run' },
]));

B.push(C.section({
  lab: '§1 · the ladder', title: 'Eighteen months, three machines, one dimension',
  wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'bound' }, { h: 'who, when' }, { h: 'the bytes' }, { h: 'verdict here', cls: 'n' }, { h: 'exact contacts', cls: 'n' }],
    rows: [
      ['582', 'classical shell (Best 1977 class); bytes from the Station bundle', 'integer vectors, norm² 4', { raw: C.tag('CERTIFIED', 'cert') }, fmt(sh.contacts)],
      ['592', 'Ganzhinov 2022 (arXiv:2207.08266) — the last pre-AI record', 'not yet pulled', { raw: C.tag('QUEUED', 'dep') }, '—'],
      ['593', 'AlphaEvolve (DeepMind), May 2025', 'integer vectors, entries up to ~8.7·10¹²', { raw: C.tag('CERTIFIED', 'cert') }, fmt(ae.contacts)],
      ['594', 'EinsteinArena agents — the solved public rung, score-0 winner', 'decimal literals, read as exact rationals', { raw: C.tag('CERTIFIED', 'cert') }, fmt(ea.contacts)],
      ['604 ×3', 'The Station agents (dualverse-ai), 2026', '(a+b√2)/6 entries, shell norm exactly 4', { raw: C.tag('CERTIFIED', 'cert') }, fmt(s1.contacts) + ' · ' + fmt(s2.contacts) + ' · ' + fmt(s3.contacts)],
      ['604', 'EinsteinArena (arXiv:2606.10402) — the paper\'s headline, credited by Cohn\'s table; coordinates published on request ' + ea604.bytesPublished, 'p + q√2 integer pairs, shell norm exactly 36', { raw: C.tag('CERTIFIED', 'cert') }, fmt(ea604.contacts)],
      ['(R¹²) 604', 'the Station\'s D₁₂ lift of configuration 3 — the construction device, integer coordinates', 'integer vectors in R¹²', { raw: C.tag('CERTIFIED', 'cert') }, fmt(lift.contacts)],
    ]
  }) + '<div class="col">'
  + C.pRaw('Three sentences of history. The norm-4 integer shell tops out at 582 — the Station carries a Lean 4 '
    + 'proof of that maximum, which is why every deeper record needs a richer alphabet: AlphaEvolve went to '
    + 'enormous integers, the 604s live in Q(&radic;2). Ganzhinov\'s 592 (2022) was the last human record; '
    + 'AlphaEvolve took 593 in May 2025; the two agent platforms then pushed to 604 within a year. The upper '
    + 'bound 868 is semidefinite-programming literature and is not audited by this page.')
  + C.pRaw('The distinct contact counts are doing quiet work in that table: congruent configurations have equal '
    + 'contact counts, so ' + fmt(s1.contacts) + ' &ne; ' + fmt(s2.contacts) + ' &ne; ' + fmt(s3.contacts)
    + ' certifies that the three Station 604s are pairwise non-congruent — three genuinely different ways to reach '
    + 'the record, decided by the same exact arithmetic that certifies them.')
  + C.pRaw('The EinsteinArena 604 has ' + fmt(ea604.contacts) + ' contacts — configuration 1\'s count — and more than '
    + 'that: its whole exact Gram profile (all ' + fmt(ea604.pairs) + ' normalised inner products as a multiset, '
    + 'and each vector\'s own profile) coincides with configuration 1\'s and with neither of the other two. '
    + 'The two published lists are not the same list: ' + fmt(sharedS1) + ' of the 604 directions coincide exactly. '
    + 'Equal profiles are necessary for congruence and never sufficient, so whether the two platforms reached one '
    + 'configuration or two is a question this page records and does not decide.') + '</div>'
}));

B.push(C.section({
  lab: '§2 · the verifiers', title: 'Everyone verified their own record. That is the gap.',
  bodyRaw: '<div class="col">'
  + C.pRaw('EinsteinArena scores submissions with Python <code>decimal.Decimal</code> at 30–80 significant '
    + 'digits, and switches to exact integer arithmetic only for integer-valued submissions. Fixed-precision '
    + 'decimal is high-precision float, not proof — and the winning 594 bytes are NOT integers (982 of their '
    + '6,534 entries are decimals). Read as the exact rationals those literals denote, the winner turns out to '
    + 'be a genuine exact witness: 17,088 pairs sit at exactly 60&deg; and every other pair clears it. To our '
    + 'knowledge this page is the first exact reading of those bytes.')
  + C.pRaw('The Station agents did verify their 604s exactly — a sympy notebook pinned to the same npz this '
    + 'page consumes, plus Lean 4 formalizations of spotlight sub-theorems (the 582 shell maximum among them). '
    + 'What this page adds there is independence: different code, different language, different arithmetic '
    + '(BigInt Z[&radic;2] instead of sympy), sharing not one line with the producer — the difference between '
    + 'an author\'s checksum and an audit.')
  + C.pRaw('And one row measured opacity before it measured geometry. On ' + ea604.needsDataFrom + ' EinsteinArena\'s '
    + 'paper claimed 604, the field\'s reference table credited it, the platform\'s own threads discussed the '
    + '&ldquo;frozen 604&rdquo; — and the public API served only the solved 594 rung and the open 605 rung. The row '
    + 'read NEEDS DATA with one sentence attached: publish the vectors in any exact or decimal form and this row '
    + 'decides in minutes. The ledger asked (vinid/einstein-arena#64); on ' + ea604.bytesPublished + ' the '
    + 'maintainer answered with the repository holding the file — 604 rows of 22 integers, p + q&radic;2 per '
    + 'coordinate at shell norm 36, the same field as the Station\'s. It decided in ' + ea604.ms + ' ms. The '
    + 'sentence was the price, exactly.') + '</div>'
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('No new mathematics: no bound is improved, no configuration searched for, and the upper bound '
    + 'is untouched. The Station\'s own exact verification of the 604s predates this page — the claim here is '
    + 'independence (shared-nothing re-decision from their sha-pinned bytes), not priority of verification. '
    + 'What is, to our knowledge, first here: a third-party exact certification of the 604 record from both '
    + 'platforms\' bytes, the exact reading of the EinsteinArena winner\'s bytes, the non-congruence of the three '
    + 'Station 604s stated as a certified corollary, and the EinsteinArena 604\'s Gram profile matched exactly to '
    + 'one of them. Congruence of those two is NOT decided here. Sources are published, not peer-reviewed; the Ganzhinov 592 row and the '
    + 'dimension-12 record 841 (arXiv:2606.18984) are queued, not forgotten.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-kissing.js @ git ' + git + '. Gates at this '
  + 'build: the ledger recomputed live from pinned corpus bytes (upstream sha256 recorded per row; the Station '
  + 'npz hash matches the value their own notebook asserts), the kissing battery (' + nChecks + ' checks, '
  + nReds + ' red controls, all fired), D4 and E8 re-proved from generated bytes. A REFUTED row, a lost '
  + 'shell-norm, or a contact-count collision refuses this page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'kissing.html'),
  TPL.render({ title: 'The kissing ledger: dimension eleven, decided', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/kissing.html',
    desc: 'K(11) >= 604 independently certified: the AI-era kissing-number ladder — AlphaEvolve 593, EinsteinArena 594, the Station\'s three 604s and EinsteinArena\'s headline 604 (NEEDS DATA until published on request) — decided in exact Z[sqrt2] arithmetic from published bytes.' }));
console.log('reports/kissing.html written: ' + certified + '/' + L.rows.length + ' rows certified, battery '
  + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
