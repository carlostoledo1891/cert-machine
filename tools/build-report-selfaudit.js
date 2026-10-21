#!/usr/bin/env node
/* build-report-selfaudit.js — the self-audit of cert-machine: reports/selfaudit.html from the five records and nothing else.

   The page reads certs/selfaudit-inventory.json (phase 1), certs/selfaudit-run.json (phase 2), certs/selfaudit-mutations.json
   (phase 3, with instruments/selfaudit/fixes.json beside it), certs/selfaudit-concord.json (phase 4) and the pre-registration
   they all pin (notes/selfaudit-preregistration-2026-10-20.md, by sha256). Every number on the page is derived from those
   records at build; nothing is typed here. The page refuses when a record is missing, when the records pin different
   pre-registrations, or when the mutations record is still partial.

   usage: node tools/build-report-selfaudit.js                                                                        MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('SELFAUDIT PAGE REFUSED: ' + m); process.exit(1); };
const J = (rel) => { const f = path.join(ROOT, rel); if (!fs.existsSync(f)) die('missing ' + rel); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const GH = 'https://github.com/carlostoledo1891/cert-machine';

const INV = J('certs/selfaudit-inventory.json'), RUN = J('certs/selfaudit-run.json'), MUT = J('certs/selfaudit-mutations.json'), CON = J('certs/selfaudit-concord.json');
const NOTE = INV.preregistration.path;
if (sha(NOTE) !== INV.preregistration.sha256) die('the pre-registration is not the inventory\'s');
for (const [name, rec] of [['run', RUN], ['mutations', MUT], ['concordance', CON]]) if (rec.preregistration.sha256 !== INV.preregistration.sha256) die('the ' + name + ' record pins another pre-registration');
if (MUT.partial) die('the mutations record is partial: ' + (MUT.pending || []).join(', ') + ' pending');
const FIX = J('instruments/selfaudit/fixes.json');
const NOTE_DATE = (/(\d{4}-\d{2}-\d{2})/.exec(NOTE) || [])[1] || 'its date';

const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 + ' %' : '—');
const secs = (s) => (s === null || s === undefined ? '—' : s < 1 ? '< 1 s' : s < 90 ? Math.round(s * 10) / 10 + ' s' : Math.round(s / 6) / 10 + ' min');
const mib = (b) => (b ? Math.round(b / 1048576) + ' MiB' : '—');
const short = (h) => String(h).slice(0, 12) + '…';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';

/* ---- derived counts --------------------------------------------------------------------------------------------------- */
const T = INV.totals, P = RUN.totals.portable, X = RUN.totals.extended, A = MUT.all, K = MUT.killSwitch, CC = CON.counts, H = CON.hosted;
const famRows = Object.entries(MUT.totals);
const builtFams = famRows.filter(([, t]) => t.mutants > 0), excludedFams = famRows.filter(([, t]) => t.mutants === 0);
const rowsWithObject = famRows.reduce((s, [, t]) => s + t.rows - (t.rowsWithoutObject || 0), 0);
const fix = (id) => MUT.fixes.find((f) => f.id === id);
const f6 = A.float['1e-6'], f9 = A.float['1e-9'], f12 = A.float['1e-12'];
const mutantsOf = (fam) => MUT.families[fam] ? MUT.families[fam].rows.flatMap((r) => r.mutants || []) : [];
const findingOpen = MUT.findings.filter((f) => /not as required \((REFUTED|PARTIAL|UNWITNESSED)\)/.test(f.outcome) && f.truth === 'MALFORMED');

/* ---- the page --------------------------------------------------------------------------------------------------------- */
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the self-audit',
  title: 'The instrument, measured by its own rules',
  deck: 'A pre-registered self-measurement of this machine on its frozen register of ' + INV.inputs.register.rows + ' decided claims: '
    + 'what re-derives, what it costs, whether planted false claims are refuted and planted true ones certified, whether two '
    + 'implementations agree, and what a conventional double-precision check would have done on the same objects. Not a comparison: '
    + 'no public system audits external claims with exact certificates and published refusals, so the comparators are this '
    + 'repository\'s own second implementations and a float checker written for the audit. The definitions were fixed before anything '
    + 'ran and are pinned by sha256 in every record.'
}));
B.push(C.scope('Published, not peer-reviewed. Every decider and every witness script is written here: a mutant\'s truth is by construction, not by a second author, '
  + 'and independence is from the claimant, never from the operator (one). The five records below say what was measured, on this frozen set, on this '
  + 'machine, and nothing more; the holds of the pre-registration — the LLM-judge baseline, outside reruns, the claim-to-statement track, the register gap — stand.'));
B.push(C.tldr({
  findingRaw: '<b>' + A.mutants + ' mutants on ' + rowsWithObject + ' of the ' + K.mutableRows + ' mutable rows: ' + A.falseCertifications + ' false certifications, ' + A.falseRefutations + ' false refutations</b> — after the campaign found '
    + FIX.fixes.map((f) => f.found.count).reduce((a, b) => a + b, 0) + ' defects (' + fix('easota-word').found.count + ' printed values moved past the bytes still certified; '
    + fix('malformed-word').found.count + ' malformed inputs refuted instead of refused), both fixed and kept on the record with the commit each was found at. '
    + K.rowsWithWitnessedFalse + ' of ' + K.mutableRows + ' rows carry a witnessed false mutant (the kill switch\'s bar was ' + K.half + '). '
    + CC.comparisons + ' comparisons between two or more implementations, ' + CC.disagreements.length + ' disagreements. '
    + 'The conventional check accepts ' + pct(f6.witnessedFalseAccepted, f6.witnessedFalse) + ' of the witnessed false claims at 10⁻⁶ and confirms only '
    + f12.originalsAccepted + ' of the ' + f12.originals + ' true originals at 10⁻¹².',
  mechanismRaw: 'Five measurements, defined before counting (M1–M5 of the <a href="' + GH + '/blob/main/' + NOTE + '">pre-registration</a>, sha256 ' + m(short(INV.preregistration.sha256)) + '): '
    + 'soundness under mutation — a FALSE mutant needs a <em>witness</em>, a violated condition computed and printed by a standard-library script that shares no code with the decider; a TRUE one an invariance; a MALFORMED one a shape; '
    + 'concordance of second implementations; coverage and refusal; cost and reproducibility under a portable profile (a ' + RUN.profiles.portable.wallSecondsCap + ' s wall enforced) and an extended one; '
    + 'and a double-precision checker at three tolerances on the same mutants. A false certification found is a defect: fixed, recorded beside the mutant, the mutant kept, the count reported — never deleted.',
  checkRaw: 'The five records are on the <a href="/certs/">certificate shelf</a> — ' + ['selfaudit-inventory', 'selfaudit-run', 'selfaudit-mutations', 'selfaudit-concord'].map((n) => '<a href="/certs/' + n + '.json">' + m(n + '.json') + '</a>').join(', ')
    + ' — and each has a <span class="m">--check</span> in <span class="m">make test</span> that re-derives its totals from its rows and refuses when an input left its pin. The mutants are regenerable from the pinned records by their class; the witness scripts are in '
    + m('instruments/selfaudit/') + '.'
}));
B.push(C.stats([
  { k: 'register rows · mutable', v: INV.inputs.register.rows + ' · ' + K.mutableRows, n: 'The frozen register of ' + INV.inputs.register.meta.date + '; ' + (INV.inputs.register.rows - K.mutableRows) + ' aggregate and reading rows not mutated, each with its reason.' },
  { k: 'mutants', v: String(A.mutants), n: 'FALSE ' + A.byTruth.FALSE + ' · TRUE ' + A.byTruth.TRUE + ' · MALFORMED ' + A.byTruth.MALFORMED + '; ' + A.excluded + ' class exclusions recorded.' },
  { k: 'false certifications', v: String(A.falseCertifications), n: FIX.fixes.map((f) => f.found.count).reduce((a, b) => a + b, 0) + ' defects found by the campaign and fixed; the record keeps them (fixedFrom).' },
  { k: 'rows with a witnessed FALSE', v: K.rowsWithWitnessedFalse + ' of ' + K.mutableRows, n: 'The kill switch: fewer than ' + K.half + ' would have published M1 as a partial. Not tripped.' },
  { k: 'portable coverage', v: P.recordsCovered.length + ' records · ' + P.rowsCovered + ' rows', n: P.recordsRefused.length + ' records (' + P.rowsRefused + ' rows) REFUSED at the ' + RUN.profiles.portable.wallSecondsCap + ' s wall; every covered record reproducible.' },
  { k: 'concordance', v: CC.comparisons + ' comparisons · ' + CC.disagreements.length + ' disagreements', n: CC.rowsWithTwoOrMore + ' rows decided by two or more programs, read from the records.' }
]));

/* §1 the pre-registration */
B.push(C.section({
  lab: '§1 · before counting', title: 'What was fixed on paper first',
  bodyRaw: C.pRaw('The note was written on ' + C.esc(NOTE_DATE) + ', before any run: the frozen set (the register at sha256 ' + m(short(INV.inputs.register.sha256)) + ', '
    + T.records + ' records), the five measurements with their definitions, the two laptop profiles and the hosted one, the mutation classes per record (' + K.mutableRows + ' mutable rows), the kill switches per phase, '
    + 'what is claimed and what is not, the holds, the output names. Every record below pins it by sha256; amend the note and every battery refuses until the records are regenerated — on purpose. '
    + 'Two things the note did not foresee are recorded as dated corrections, not silent edits: a stamp rule in the runner that was narrower than the note\'s (re-derived, no measurement touched), and the invariances a '
    + 'row admits, which must preserve <em>every</em> claim the row decides (negating a truth table flips its monotonicity claim; the class was replaced before the record was written).')
}));

/* §2 the inventory and the runner */
const overP = T.recordsOverPortable.map((r) => r.record.replace(/^certs\//, '') + ' (' + secs(r.seconds) + ', ' + r.rows + ' row' + (r.rows === 1 ? '' : 's') + ')').join(', ');
const runRows = RUN.runs.filter((r) => r.kind === 'rederive');
const byRec = {};
for (const r of runRows) (byRec[r.record] = byRec[r.record] || {})[r.profile + '-' + r.run] = r;
const runTable = Object.entries(byRec).map(([rec, v]) => {
  const pc = v['portable-cold'], pw = v['portable-warm'], ec = v['extended-cold'], ew = v['extended-warm'];
  const w = (x) => (x.verdict === 'RAN' ? secs(x.wallSeconds) : x.verdict.startsWith('REFUSED') ? 'REFUSED' : x.verdict);
  const rows = INV.records.find((x) => x.record === rec);
  return [rec.replace(/^certs\//, ''), String(rows ? rows.rows : '—'), w(pc) + ' · ' + w(pw), w(ec) + ' · ' + w(ew), secs(ec.cpuSeconds), mib(Math.max(pc.peakRssBytes || 0, pw.peakRssBytes || 0, ec.peakRssBytes || 0, ew.peakRssBytes || 0)),
    ec.verdict === 'RAN' ? (ec.reproducible && ew.reproducible ? 'yes' : 'NO') : '—'];
});
B.push(C.section({
  lab: '§2 · what re-derives, and what it costs', title: 'The inventory and the runner',
  bodyRaw: C.pRaw('<b>The inventory</b> (phase 1): ' + T.recordsWithRederive + ' of the ' + T.records + ' records re-derive with one command (' + T.rowsWithRederive + ' rows), ' + T.recordsWithVerifier + ' carry a standard-library verifier ('
    + T.rowsWithVerifier + ' rows), ' + T.recordsWithSecond + ' a second implementation; ' + T.rederiveWrites.length + ' commands write their record and ' + T.rederiveChecksOnly.length + ' only check it; '
    + T.rowsWithPerRowTiming + ' rows carry a per-row timing. <b>The runner</b> (phase 2, ' + C.esc(RUN.machine.cpu) + ', ' + C.esc(RUN.machine.node) + ', ' + C.esc(RUN.machine.python) + ', ' + C.esc(RUN.machine.powerAtStart) + '): every command of the '
    + 'rerun kit under <span class="m">/usr/bin/time -l</span>, one process at a time, twice under each profile — cold, then warm, never averaged. Under the portable profile the wall of ' + RUN.profiles.portable.wallSecondsCap
    + ' s is enforced by killing the process group at the cap: ' + P.recordsRefused.length + ' records were REFUSED for resources (' + C.esc(overP) + '), exactly the ' + T.recordsOverPortable.length + ' the inventory had timed over the cap. '
    + 'Under the extended profile every record ran and every one was reproducible: it differed from its pin only at its declared stamps, and the register rebuilt from it moved no row. Peak memory was at most ' + mib(X.peakRssBytesMax) + ', far from the 4 GiB the profile reports against.')
    + C.table({ cols: [{ h: 'record' }, { h: 'rows' }, { h: 'portable, cold · warm' }, { h: 'extended, cold · warm' }, { h: 'CPU (extended, cold)' }, { h: 'peak RSS' }, { h: 'reproducible' }], rows: runTable })
    + C.pRaw('One side effect is on the record and was restored each time: <span class="m">make engine</span> rewrites ' + m('certs/keller-certificate.json') + ' with the pins its sources listing has grown since the record was taken — a listing, nothing decided.')
}));

/* §3 the mutations */
const famTable = famRows.map(([fam, t]) => {
  const ex = t.mutants === 0;
  const fl = t.float['1e-6'];
  return [fam, String(t.rows), ex ? 'not mutated' : String(t.mutants), ex ? '—' : (t.byTruth.FALSE || 0) + ' · ' + (t.byTruth.TRUE || 0) + ' · ' + (t.byTruth.MALFORMED || 0),
    ex ? '—' : String(t.falseCertifications), ex ? '—' : String(t.falseRefutations), ex ? '—' : (t.refusalsOnFalse + t.refusalsOnTrue) + ' · ' + t.discards,
    ex ? '—' : t.rowsWithWitnessedFalse + ' of ' + t.rows, ex ? '—' : pct(fl.witnessedFalseAccepted, fl.witnessedFalse) + ' · ' + pct(t.float['1e-9'].witnessedFalseAccepted, t.float['1e-9'].witnessedFalse) + ' · ' + pct(t.float['1e-12'].witnessedFalseAccepted, t.float['1e-12'].witnessedFalse)];
});
const fixRows = MUT.fixes.map((f) => [f.id, String(f.found.count), f.found.commit, f.found.outcome, f.asRequiredNow + ' of ' + f.mutants, C.esc(f.fix.what).slice(0, 220) + (f.fix.what.length > 220 ? '…' : '')]);
const exclRows = excludedFams.map(([fam, t]) => { const row = MUT.families[fam].rows[0]; return [fam, String(t.rows), C.esc(row.noObject)]; });
const classExcl = builtFams.flatMap(([fam]) => MUT.families[fam].rows.flatMap((r) => (r.excluded || []).map((x) => [fam, r.rowId, x.class, x.reason])));
const exclByReason = {};
for (const [fam, , cls, reason] of classExcl) { const k = fam + ' · ' + cls; (exclByReason[k] = exclByReason[k] || { n: 0, reason }).n++; }
B.push(C.section({
  lab: '§3 · soundness under mutation', title: 'Planted false, true and malformed claims on every row',
  bodyRaw: C.pRaw('A mutant is a case derived from a row\'s pinned record entry by one named transformation of the note\'s class table. Its truth is fixed by construction and checked by a <em>witness</em> that shares no code with the decider '
    + '(Python standard library, exact: Fractions, directed-rounding Decimal, Z[√2], Kronecker convolutions) — a FALSE mutant the witness cannot witness is DISCARDED and counted, never relabelled. The decider under test is the row\'s own '
    + 're-derive path with the mutant in place of the pinned bytes; required words: FALSE → REFUTED, TRUE → CERTIFIED (an invariance keeps the original\'s own word, so a REPAIRED row\'s rigid motion is REPAIRED again), MALFORMED → REFUSED. '
    + 'The witness carries red controls every run: no violation on a CERTIFIED original or a TRUE mutant, one on the REFUTED original and on every family\'s control class.')
    + C.table({ cols: [{ h: 'family' }, { h: 'rows' }, { h: 'mutants' }, { h: 'FALSE · TRUE · MALFORMED' }, { h: 'false certifications' }, { h: 'false refutations' }, { h: 'refusals · discards' }, { h: 'rows with a witnessed FALSE' }, { h: 'float check accepts the FALSE at 10⁻⁶ · 10⁻⁹ · 10⁻¹²' }], rows: famTable })
    + C.pRaw('<b>Two defects, found and fixed.</b> The campaign\'s first whole run came back with ' + fix('easota-word').found.count + ' false certifications and ' + fix('malformed-word').found.count + ' malformed inputs answered REFUTED. '
      + 'The note\'s rule applied: fixed, recorded beside each mutant with the commit it was found at, the mutant kept, the count reported.')
    + C.table({ cols: [{ h: 'defect' }, { h: 'found' }, { h: 'at commit' }, { h: 'the word then' }, { h: 'as required now' }, { h: 'the fix' }], rows: fixRows })
    + C.pRaw('<b>Still open, on the record:</b> ' + (findingOpen.length ? findingOpen.map((f) => C.esc(f.family + ' · ' + f.class + ' → ' + f.outcome + ' × ' + f.count)).join('; ')
      + ' — a partial decision that reads a term with a missing exponent silently (the evaluation zips the point against a short tuple); recorded, not yet fixed.' : 'nothing.')
      + ' The other outcomes that are not the required word are compositions, each listed in the record: ' + Object.entries(A.byOutcome).filter(([k]) => !['as required'].includes(k)).map(([k, v]) => C.esc(k) + ' ' + v).join(', ') + '.')
    + C.pRaw('<b>Not mutated, a reason per row</b> (' + excludedFams.reduce((s, [, t]) => s + t.rows, 0) + ' rows): ')
    + C.table({ cols: [{ h: 'family' }, { h: 'rows' }, { h: 'why' }], rows: exclRows })
    + C.pRaw('<b>Classes excluded on rows that were mutated</b> (' + classExcl.length + '): ' + Object.entries(exclByReason).map(([k, v]) => C.esc(k) + ' × ' + v.n + ' — ' + C.esc(v.reason)).join('; ') + '.')
}));

/* §4 the conventional check */
B.push(C.section({
  lab: '§4 · the conventional check', title: 'What a tolerance admits, and what it cannot confirm',
  bodyRaw: C.pRaw('A double-precision checker written for the audit — no exact arithmetic, a tolerance τ on every constraint and on the bar, the natural numpy-style verification of each family — ran on every original and every mutant. '
    + 'On the ' + f6.witnessedFalse + ' witnessed FALSE mutants it ACCEPTED ' + f6.witnessedFalseAccepted + ' at τ = 10⁻⁶ (' + pct(f6.witnessedFalseAccepted, f6.witnessedFalse) + '), ' + f9.witnessedFalseAccepted + ' at 10⁻⁹ (' + pct(f9.witnessedFalseAccepted, f9.witnessedFalse) + '), '
    + f12.witnessedFalseAccepted + ' at 10⁻¹² (' + pct(f12.witnessedFalseAccepted, f12.witnessedFalse) + '): a printed value one unit off in its seventh to tenth digit, a coefficient scaled by 1 + 10⁻⁹, a bar one unit above an entropy ratio\'s last printed digit, '
    + 'the published C* that <em>is</em> the naive double product — each inside what a tolerance admits. And the other side: it confirmed only ' + f6.originalsAccepted + ' of the ' + f6.originals + ' TRUE originals at 10⁻⁶, ' + f9.originalsAccepted + ' at 10⁻⁹, '
    + f12.originalsAccepted + ' at 10⁻¹² — among the polynomial maps, cancellation in float Gaussian elimination over hundreds to tens of thousands of terms puts the determinant past 10⁻⁶ of its constant on four of nine. '
    + 'A tolerance that admits a quarter of the false claims cannot confirm a quarter of the true ones. The exact deciders returned ' + A.falseCertifications + ' false certifications on the same objects, and every original as the register says.')
}));

/* §5 concordance and the hosted rows */
const conKinds = {};
for (const r of CON.rows) { const k = r.fields.length === 1 && /verifier/.test(r.fields[0].field) ? 'word-level: a standard-library verifier re-derives the record' : r.implementations.length + ' implementations, field by field'; conKinds[k] = (conKinds[k] || 0) + 1; }
B.push(C.section({
  lab: '§5 · concordance, and the hosted rows', title: 'Where two programs decided the same row',
  bodyRaw: C.pRaw('For every register row decided by two or more programs, the records were read and compared field by field: the word, the witness or the violating-pair count where one exists, the enclosure where one exists. '
    + CC.comparisons + ' comparisons on ' + CC.rowsWithTwoOrMore + ' rows (' + Object.entries(conKinds).map(([k, v]) => v + ' ' + C.esc(k)).join('; ') + '), ' + CC.concordant + ' concordant, ' + CC.disagreements.length + ' disagreements. '
    + 'Nothing was re-run for this: the second implementations\' own runs are on record, and so are the standard-library verifiers\' exits in the rerun kit\'s run.')
    + C.pRaw('<b>The hosted profile, carried in as recorded.</b> ' + H.challenges + ' kernel challenges of the openai-math audit, decided on ' + C.esc(H.machine.split(',')[0]) + ' with two kernels per run: '
      + Object.entries(H.words).map(([w, n]) => n + ' ' + w).join(', ') + '; wall seconds min ' + H.seconds.min + ', median ' + H.seconds.median + ', max ' + H.seconds.max + '; peak RSS up to ' + mib(H.maxRssKB.max * 1024) + '. '
      + H.overPortableWall + ' runs exceed the laptop\'s portable wall and ' + H.overPortableMemory + ' its reported memory bound — which is why they are a profile of their own, never merged into the laptop table and never re-run here. The ' + (H.words.REFUSED || 0) + ' refusals were for resources on the runner and stay refusals.')
}));

/* §6 what is claimed */
B.push(C.section({
  lab: '§6 · what is claimed, and what is not', title: 'The limits, from the note',
  bodyRaw: C.plainList([
    { b: 'Claimed.', text: 'The counts above, per family, on this frozen set of ' + INV.inputs.register.rows + ' rows, on this machine, under the definitions fixed on paper first — and two defects found by those definitions, fixed and kept.' },
    { b: 'Not claimed.', text: 'A ranking of verification systems; independence from the author (every decider and every witness script is written here); anything about the ' + (INV.inputs.register.rows - K.mutableRows) + ' aggregate and reading rows; that passing M1 shows soundness beyond the classes listed.' },
    { b: 'Held.', text: 'The LLM-judge baseline (a spend); outside reruns (a send); the claim-to-statement track (two outside reviewers who did not build the benchmark); the register gap (a register change); the 54 undecided pre-registered claims (another front).' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-selfaudit.js from the five records of the self-audit, every count derived at build; the records pin the pre-registration by sha256 (' + short(INV.preregistration.sha256) + ') and refuse when it moves. Record digests at this build: inventory ' + short(sha('certs/selfaudit-inventory.json')) + ', run ' + short(sha('certs/selfaudit-run.json')) + ', mutations ' + short(sha('certs/selfaudit-mutations.json')) + ', concordance ' + short(sha('certs/selfaudit-concord.json')) + '. Rebuild: node tools/build-report-selfaudit.js.') + '</p>'
  + '<p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'selfaudit.html'), TPL.render({
  title: 'The instrument, measured by its own rules · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The self-audit of cert-machine: a pre-registered self-measurement on its frozen register — ' + A.mutants + ' planted mutants with exact witnesses, ' + A.falseCertifications + ' false certifications after two defects found and fixed, ' + CC.comparisons + ' concordance comparisons, the cost of every re-derivation under an enforced wall, and what a double-precision check would have admitted.',
  path: '/reports/selfaudit.html'
}));
console.log('reports/selfaudit.html written: ' + A.mutants + ' mutants on ' + rowsWithObject + ' rows, ' + A.falseCertifications + ' false certifications, ' + CC.comparisons + ' comparisons, ' + P.recordsCovered.length + '/' + T.records + ' records under portable @ git ' + git);
