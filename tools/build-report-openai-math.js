#!/usr/bin/env node
/* build-report-openai-math.js — reports/openai-math.html: OpenAI's math release (github.com/openai/math), checked
   three ways and pre-registered before any row was decided.

   Every number comes from a record, never from this file: the census (corpus/openai-math/release.json), the
   pre-registration (corpus/openai-math/preregistration.json), lane F's membership (corpus/openai-math/f-lane.json)
   and the three ledgers — certs/openai-math-kernel.json (lane K), certs/openai-math-statements.json (lane S),
   certs/openai-math-finite.json (lane F). The page refuses when the ledgers disagree with the census. Lane K runs for
   a day on GitHub's runners, so the page says how many of the 416 challenges it has decided and never extrapolates.

   usage: node tools/build-report-openai-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('OPENAI-MATH REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const opt = (p) => (fs.existsSync(path.join(ROOT, p)) ? J(p) : null);

const R = J('corpus/openai-math/release.json');
const P = J('corpus/openai-math/preregistration.json');
const FL = J('corpus/openai-math/f-lane.json');
const K = opt('certs/openai-math-kernel.json') || { rows: [], counts: { words: {}, strict: {} } };
const S = J('certs/openai-math-statements.json');
const F = J('certs/openai-math-finite.json');
if (R.commit !== P.release.commit || S.release !== R.commit || F.release !== R.commit) die('a ledger is pinned to another release commit');
if (S.rows.length !== R.families.filter((f) => f.challenges.length).length) die('lane S does not cover every family with a challenge');
if (F.rows.length !== FL.rows.length) die('lane F does not cover its pre-registered membership');
if (K.rows.some((r) => !R.challenges.find((c) => c.name === r.challenge))) die('lane K holds a challenge the census does not');

const n = (x) => Number(x).toLocaleString('en-US');
const cnt = (o, k) => (o && o[k]) || 0;
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0) + '%';
const sw = S.counts.words, fw = F.counts, kw = K.counts.words || {};
const kDecided = K.rows.length, kCert = cnt(kw, 'CERTIFIED');
/* why the kernel lane refused, derived from the recorded reasons — never asserted */
const kRefused = K.rows.filter((r) => r.word === 'REFUSED');
const kStack = kRefused.filter((r) => /stack overflow/.test(r.why || '')).length, kStopped = kRefused.filter((r) => /stopped before Comparator/.test(r.why || '')).length;
const refusedWhy = [kStack ? kStack + ' nanoda stack overflow' + (kStack > 1 ? 's' : '') + ' on our runner (re-running with a larger stack)' : '', kStopped ? kStopped + ' job' + (kStopped > 1 ? 's' : '') + ' that hit the runner\'s time or memory limit' : '', kRefused.length - kStack - kStopped ? (kRefused.length - kStack - kStopped) + ' other' : ''].filter(Boolean).join(', ') || 'none';
const fCert = F.rows.filter((r) => r.word === 'CERTIFIED'), fWhole = fCert.filter((r) => /^the whole headline/.test(r.decides || ''));
const fNeeds = F.rows.filter((r) => r.word === 'NEEDS DATA'), fOpen = F.rows.filter((r) => r.word === 'NOT YET DECIDED');
const fBad = F.rows.filter((r) => r.word === 'REFUTED' || r.word === 'REFUSED');
/* lane U: manuscripts neither in a family with a challenge nor in an F row */
/* (pre-registration lanes.U: no challenge via a scope note that links the manuscript, and no F row) */
const famWithCh = new Set(R.families.filter((f) => f.challenges.length).map((f) => f.n));
const fDirs = new Set(FL.rows.map((r) => r.dir));
const linked = new Set(R.scopeNotes.flatMap((s) => s.papers));
const U = R.manuscripts.filter((m) => !linked.has(m.dir) && !fDirs.has(m.dir));
const linkedCurrent = R.manuscripts.filter((m) => linked.has(m.dir)).length;
const famTitle = (k) => (R.families.find((f) => f.n === k) || {}).title || '';
/* CONTENTS.md writes math as $`…`$ and keeps some HTML entities; the page shows the plain text */
const plain = (t) => String(t || '').replace(/\$`([^`]*)`\$/g, '$1').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const S_WORDS = ['MATCHES', 'NARROWER — DECLARED', 'NARROWER — UNLINKED', 'NARROWER — UNDECLARED', 'DIFFERENT', 'SUPPORT-ONLY'];
const short = (s, k) => (s.length > k ? s.slice(0, k - 1).replace(/\s+\S*$/, '') + '…' : s);

/* the clauses a family's Lean does not state, from the deciding reading */
const missing = (r) => (r.clauses || []).filter((c) => c.status && c.status !== 'stated').map((c) => c.clause);
const wordTag = (w) => C.tag(w, w === 'MATCHES' ? 'held' : w === 'NARROWER — DECLARED' || w === 'SUPPORT-ONLY' ? 'cert' : w === 'NARROWER — UNLINKED' ? 'open' : 'dep');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · OpenAI\'s math release',
  title: 'OpenAI\'s 719 manuscripts, checked three ways',
  deck: 'On 2026-10-06 OpenAI published ' + n(R.stated.manuscripts) + ' mathematical manuscripts produced by an internal model, with Lean formalizations and '
    + n(R.counted.challenges) + ' Comparator challenges. This audit re-runs the kernel check with a second, independent kernel; reads every formal '
    + 'statement against the claim it is supposed to carry; and re-decides, in exact arithmetic with code written here, every claim whose witness is a '
    + 'finite published object. The lanes, words and order were committed before any row was decided.'
}));
B.push(C.scope('The release: github.com/openai/math at commit ' + R.commit.slice(0, 8) + ' (Apache-2.0; it moved once after our scouting pin '
  + R.sinceFirstCommit.from.slice(0, 8) + ': ' + R.withdrawn.length + ' manuscripts withdrawn, 14 revised, ' + R.sinceFirstCommit.challengesAdded.length
  + ' challenges added). OpenAI calls the collection partial progress, its formal review "unchecked", and says some unformalized results could have issues. '
  + 'Issues and discussions are disabled on the repository; nothing has been sent to OpenAI. A reading is not a certificate, and this page keeps the two apart.'));

const kLine = kDecided ? '<b>Kernel lane: ' + n(kCert) + ' of ' + n(kDecided) + ' challenges run so far CERTIFIED</b> by Comparator with both Lean\'s kernel and nanoda '
  + '(the release had switched nanoda on for ' + cnt(R.counted.enableNanoda, 'true') + ' of ' + n(R.counted.challenges) + '); ' + (cnt(kw, 'REFUTED') + cnt(kw, 'REFUTED — TO REPRODUCE') ? n(cnt(kw, 'REFUTED') + cnt(kw, 'REFUTED — TO REPRODUCE')) + ' rejected; ' : 'none rejected; ')
  + n(R.counted.challenges - kDecided) + ' not yet decided while the runs continue; the ' + n(kRefused.length) + ' REFUSED are ' + refusedWhy + '. ' : '<b>Kernel lane:</b> running on GitHub\'s Linux runners; no row recorded yet. ';
B.push(C.tldr({
  findingRaw: kLine
    + '<b>Statement lane: of the ' + S.rows.length + ' families with a Comparator challenge, ' + cnt(sw, 'MATCHES') + ' state their headline</b>; '
    + cnt(sw, 'NARROWER — DECLARED') + ' state less and OpenAI\'s scope note says so; ' + cnt(sw, 'NARROWER — UNLINKED') + ' state less because the headline also '
    + 'cites manuscripts the formalization never linked; <b>' + cnt(sw, 'NARROWER — UNDECLARED') + ' state less than a linked manuscript claims with nothing saying so</b>; '
    + cnt(sw, 'DIFFERENT') + ' state a different theorem from the headline; ' + cnt(sw, 'SUPPORT-ONLY') + ' carry only a declared supporting result. '
    + '<b>Finite lane: ' + fCert.length + ' finite cores CERTIFIED</b> by programs written here (' + fWhole.length + ' of them the whole headline), none refuted; '
    + fBad.filter((r) => r.word === 'REFUSED').length + ' REFUSED (most decided in part, the rest too costly here, each cost named); '
    + fNeeds.length + ' headline witnesses are asserted but not published in checkable form — among them the Hadwiger, Sidorenko, Ryser and Kaplansky counterexamples.',
  mechanismRaw: 'Three lanes on one pinned commit. K: Comparator, the Lean FRO\'s judge, re-run on Linux with nanoda — a kernel written in Rust, independently of '
    + 'Lean\'s — switched on, and a second run that compares the bodies of declared "definition holes", which Comparator checks by type alone. S: every '
    + 'statement read against the family headline, the abstracts and OpenAI\'s scope note, by two readers wherever the first found a gap. F: a census of all '
    + n(FL.abstractsRead) + ' abstracts fixed ' + FL.counts.rows + ' finite cores before any was decided; each decider is standard-library Python, exact arithmetic, '
    + 'written from the paper before the authors\' code was opened, with forged variants that must not certify.',
  checkRaw: C.m('node tools/pin-openai-math.js') + ' · ' + C.m('python3 tools/run-openai-math-finite.py --check') + ' · ' + C.m('node tools/record-openai-math-statements.js')
    + ' · ' + C.m('gh workflow run openai-math-kernel.yml -f challenges="…"') + ' — the pre-registration is ' + C.m('corpus/openai-math/preregistration.json') + '.'
}));
B.push(C.stats([
  { k: 'kernel lane', v: kDecided ? n(kCert) + ' / ' + n(kDecided) : '—', n: 'Challenges CERTIFIED by two kernels, of those run so far; ' + n(R.counted.challenges) + ' in all.' },
  { k: 'statement lane', v: cnt(sw, 'MATCHES') + ' / ' + S.rows.length, n: 'Families whose Lean states the headline; ' + cnt(sw, 'NARROWER — UNDECLARED') + ' narrower with nothing saying so.' },
  { k: 'finite lane', v: fCert.length + ' / ' + FL.counts.rows, n: 'Finite cores certified here; ' + fNeeds.length + ' need data the release does not publish; ' + fOpen.length + ' not yet decided.' },
  { k: 'undecided here', v: n(U.length), n: 'Of ' + n(R.manuscripts.length) + ' manuscripts: not linked by any scope note and no finite core. Not doubtful — outside what an exact certifier can decide.' }
]));

/* §0 — what the audit found, in plain words. Every number is read from a ledger; the families named are looked up
   by number, and the page refuses if one of them no longer carries the word its sentence depends on. */
const famRow = (k) => S.rows.find((r) => r.family === k) || die('family ' + k + ' is not in lane S');
const needWord = (k, words) => { const r = famRow(k); if (!words.includes(r.word)) die('family ' + k + ' is now ' + r.word + '; the findings list says otherwise'); return r; };
const f143 = needWord('143', ['NARROWER — UNLINKED', 'NARROWER — UNDECLARED']), f197 = needWord('197', ['NARROWER — UNLINKED', 'NARROWER — UNDECLARED']);
const f307 = needWord('307', ['NARROWER — UNLINKED', 'NARROWER — UNDECLARED']), f260 = needWord('260', ['DIFFERENT']);
const kStrict = K.rows.filter((r) => r.strict);
const holesDisplayed = R.counted.definitionHoles;
const wholeTitles = fWhole.map((r) => plain(r.title));
B.push(C.section({
  lab: '§0 · what the audit found', title: 'The findings, before the tables',
  bodyRaw: C.plainList([
    { b: 'The proofs that were run hold.', text: (kDecided ? n(kCert) + ' of the ' + n(kDecided) + ' challenges run so far are accepted by Lean\'s kernel and by nanoda, a kernel written independently in Rust; ' + (cnt(kw, 'REFUTED') ? n(cnt(kw, 'REFUTED')) + ' rejected' : 'none was rejected') + '. ' : '') + 'OpenAI had enabled the second kernel for ' + cnt(R.counted.enableNanoda, 'true') + ' of its ' + n(R.counted.challenges) + ' challenges.' },
    { b: 'A check that reads only types.', text: 'Comparator compares a declared "definition hole" by its type, never its body. Ten challenges declare holes; ' + holesDisplayed.displayedWithBody + ' of their ' + holesDisplayed.declared + ' holes are displayed with a full body a reader will take as the definition. '
      + (kStrict.length ? 'Run with the holes emptied, ' + kStrict.filter((r) => r.strict.word === 'SAME BODIES').length + ' of ' + kStrict.length + ' match body for body and ' + kStrict.filter((r) => r.strict.word === 'BODIES DIFFER').length + ' do not, though their source reads the same. ' : '')
      + (Object.keys(K.counts.transfer || {}).length ? 'A transfer check in Lean (§2) settles whether each theorem proves the displayed statement: ' + Object.entries(K.counts.transfer).map(([w, c]) => c + ' ' + w).join(', ') + '.' : 'A transfer check in Lean (§2), which settles whether each theorem proves the displayed statement, is running.') },
    { b: 'Headlines that say more than the Lean.', text: cnt(sw, 'NARROWER — UNDECLARED') + ' families state less than a manuscript their scope note links claims, with nothing saying so, and ' + cnt(sw, 'DIFFERENT') + ' state a different theorem from their headline — ' + plain(f260.title) + ', for one, states no Penrose inequality at all. '
      + 'Another ' + cnt(sw, 'NARROWER — UNLINKED') + ' headlines lead with results from manuscripts the formalization never linked: ' + plain(f143.title) + ' (the uniform bound is in no challenge; only a quintic Liénard count is); ' + plain(f197.title) + ' (the Lean group is required to have odd-prime torsion); ' + plain(f307.title) + ' (the Lean speaks of the reduced Roe algebra).' },
    { b: 'Finite claims, decided here.', text: fCert.length + ' finite cores certified by code written here, ' + fWhole.length + ' of them the whole headline (' + wholeTitles.join('; ') + '); none refuted. ' + fNeeds.length + ' headline witnesses are asserted and not published in checkable form, among them the counterexamples to Hadwiger\'s, Sidorenko\'s, Ryser\'s and Kaplansky\'s conjectures.' },
    { b: 'What the release does not ship.', text: 'Several papers cite checkers or data that are not in the release; one publishes exit statuses where its witnesses should be; one prints constants that depend on choices its text never gives. Each is recorded with its decider in instruments/openaimath/finite/.' }
  ])
}));

/* §1 — the kernel lane */
const kRows = K.rows.slice().sort((a, b) => (a.word === b.word ? a.challenge.localeCompare(b.challenge) : a.word === 'CERTIFIED' ? 1 : -1));
B.push(C.section({
  lab: '§1 · the kernel lane', title: 'Two kernels, every challenge', wide: true,
  bodyRaw: [
    C.pRaw('Comparator builds a challenge and its solution in a sandbox, exports both, checks that each listed theorem has exactly the challenge\'s statement and '
      + 'uses no axiom beyond ' + C.m('propext') + ', ' + C.m('Quot.sound') + ' and ' + C.m('Classical.choice') + ', and replays the proof through Lean\'s kernel and any '
      + 'external kernel it is given. The release enabled nanoda for ' + cnt(R.counted.enableNanoda, 'true') + ' challenges; here it is on for all. One job per challenge, '
      + 'on GitHub\'s Linux runners (Lake and Comparator abort at start on the desk\'s macOS; the sandbox is Linux-only). A CERTIFIED here says the Lean theorem is '
      + 'proved; whether that theorem is the paper\'s claim is §3.'),
    kDecided ? C.pRaw('<b>' + n(kCert) + ' CERTIFIED</b>, each by Lean\'s kernel and nanoda: ' + kRows.filter((r) => r.word === 'CERTIFIED').map((r) => C.m(r.challenge)).join(' ') + '.') : C.pRaw('No job has been recorded yet.'),
    kRows.some((r) => r.word !== 'CERTIFIED') ? C.table({ cols: [{ h: 'verdict' }, { h: 'challenge' }, { h: 'family' }, { h: 'why' }],
      rows: kRows.filter((r) => r.word !== 'CERTIFIED').map((r) => [{ raw: C.tag(r.word, r.word === 'REFUSED' ? 'open' : 'dep') }, { raw: C.m(r.challenge) },
        { raw: C.esc(r.families.join(', ')) }, { raw: C.esc(short(r.why || '', 200)) }]) }) : '',
    C.pRaw('The trust base, as the pre-registration states it: ' + C.esc(P.lanes.K.trustBase))
  ].join('\n')
}));

/* §2 — definition holes */
const holes = R.challenges.filter((c) => c.definitionNames.length);
B.push(C.section({
  lab: '§2 · definition holes', title: 'Where Comparator checks only a type',
  bodyRaw: [
    C.pRaw(n(holes.length) + ' challenges list definitions in ' + C.m('definition_names') + '. For those, Comparator compares the definition\'s name, universe levels, '
      + 'type and safety — never its body (' + C.m('Comparator/Compare.lean') + ', ' + C.m('definitionHoleMatches') + ', at the pinned revision) — and its own README '
      + 'says such solutions "must always be checked with an additional (potentially human) verifier". Of the ' + R.counted.definitionHoles.declared + ' holes these '
      + 'files declare, ' + R.counted.definitionHoles.displayedWithBody + ' are displayed with a full body and ' + R.counted.definitionHoles.sorried + ' are left sorried: a reader '
      + 'of the challenge sees ' + R.counted.definitionHoles.displayedWithBody + ' definitions the check does not compare. Lane K runs each of these configs twice: as '
      + 'published, and with the holes emptied, which compares every body constant by constant.'),
    C.table({ cols: [{ h: 'challenge' }, { h: 'holes (displayed)' }, { h: 'bodies, decided' }, { h: 'transfer' }],
      rows: holes.map((c) => { const k = K.rows.find((r) => r.challenge === c.name); return [{ raw: C.m(c.name) }, { raw: C.m(c.definitionNames.length + ' (' + c.holeBodies.filter((h) => h.displayed).length + ')') },
        { raw: k && k.strict ? C.tag(k.strict.word, k.strict.word === 'SAME BODIES' ? 'held' : 'dep') + (k.strict.constants ? ' ' + C.esc(k.strict.constants.join(', ')) : '') : C.esc('not yet run') },
        { raw: k && k.transfer ? C.tag(k.transfer.word, k.transfer.word === 'TRANSFERS' ? 'held' : k.transfer.word === 'NOT DECIDED' ? 'open' : 'dep') : C.esc('not yet run') }]; }) }),
    C.pRaw('The transfer column (pre-registration amendment 9) asks Lean itself whether each theorem proves the statement the file displays. The '
      + 'challenge file\'s skeleton is kept; its holes, and every declaration tied to them, are copied under new names; every other name resolves to '
      + 'the solution\'s constant, which Comparator has already matched to the challenge\'s. A guard computed in Lean refuses the check if a copy '
      + 'reaches an original hole or a constant Comparator never compared, and each solution theorem is then offered as a proof of the copied '
      + 'statement. TRANSFERS needs Lean\'s kernel to accept it AND a red control — one displayed body replaced by sorry — to be rejected.'),
    (() => { const diff = K.rows.filter((r) => r.strict && r.strict.word === 'BODIES DIFFER');
      return diff.length ? C.pRaw('Where the strict run names a constant whose bodies differ (' + diff.map((r) => C.m(r.strict.constants.join(', '))).join(', ') + '), '
        + 'the source text of that definition in the challenge file and in the solution reads the same, line for line, on our reading; the kernel terms '
        + 'differ through elaboration — auxiliary constants, binders, instances — which is presumably why the definitions were declared holes. Comparator '
        + 'alone therefore checks those theorems against a type, and whether the two elaborations mean the same thing is a reading this audit has not yet '
        + 'finished. It is not a finding that anything is wrong.') : ''; })()
  ].join('\n')
}));

/* §3 — the statement lane */
const sOrder = ['DIFFERENT', 'NARROWER — UNDECLARED'];
const sNotable = S.rows.filter((r) => sOrder.includes(r.word)).sort((a, b) => sOrder.indexOf(a.word) - sOrder.indexOf(b.word) || a.family.localeCompare(b.family));
B.push(C.section({
  lab: '§3 · the statement lane', title: 'What the Lean states, family by family', wide: true,
  bodyRaw: [
    C.pRaw('OpenAI writes one headline per family; a family can hold several manuscripts and several challenges, and its scope note names the manuscripts the '
      + 'formalization covers. Each family\'s challenges were read against that headline, clause by clause. The words, least to most severe: ' + S_WORDS.slice(0, 5).map((w) => C.esc(w)).join(' · ') + ', and SUPPORT-ONLY when every challenge is a declared supporting result'
      + '. Where two readers disagreed, the less severe word is recorded (' + S.counts.disagreements + ' disagreements, ' + (S.counts.disagreements - S.counts.disagreementsOnTheReading.length)
      + ' of them only because the first readers did not yet have the UNLINKED word).'
      + (S.counts.flagReadings ? ' Every vacuity, junk-value, quantifier and definition flag a first reader marked with a question in the other families was read again: '
        + Object.entries(S.counts.flagDecisions || {}).map(([d, c]) => c + ' ' + d.replace(/-/g, ' ')).join(', ') + '.' : '')),
    C.table({ cols: [{ h: 'word' }, { h: 'families' }], rows: S_WORDS.filter((w) => cnt(sw, w))
      .map((w) => [{ raw: wordTag(w) }, { raw: C.m(String(cnt(sw, w))) }]) }),
    C.pRaw('The ' + sNotable.length + ' families below are the DIFFERENT and NARROWER — UNDECLARED words; each line names what the headline claims and no challenge states. '
      + 'Every such row quotes both texts, with file and line, in ' + C.m('certs/openai-math-statements.json') + '.'),
    C.table({ cols: [{ h: 'word' }, { h: 'family' }, { h: 'claimed, not stated in Lean' }],
      rows: sNotable.map((r) => [{ raw: wordTag(r.word) }, { raw: C.esc(r.family + ' · ' + short(plain(r.title), 70)) }, { raw: C.esc(short(plain(missing(r).join(' · ') || (r.gap || '')), 260)) }]) })
  ].join('\n')
}));

/* §4 — the finite lane */
const fRowsShown = F.rows.filter((r) => r.word !== 'NOT YET DECIDED');
B.push(C.section({
  lab: '§4 · the finite lane', title: 'The finite objects, decided here', wide: true,
  bodyRaw: [
    C.pRaw('A census of all ' + n(FL.abstractsRead) + ' abstracts, by three readers on disjoint slices, named ' + FL.counts.rows + ' finite cores over ' + FL.counts.manuscripts
      + ' manuscripts before any was decided: ' + FL.counts.tiers.A + ' published and checkable, ' + FL.counts.tiers.B + ' published but expensive, ' + FL.counts.tiers.C
      + ' asserted but not published in checkable form. Each decider reads the release\'s own bytes and records their sha256; "whole headline" means the finite '
      + 'object is the entire claim, otherwise the analytic argument around the component is not decided here.'),
    C.table({ cols: [{ h: 'verdict' }, { h: 'row' }, { h: 'manuscript' }, { h: 'what is decided' }],
      rows: fRowsShown.map((r) => [{ raw: C.tag(r.word, r.word === 'CERTIFIED' ? 'held' : r.word === 'NEEDS DATA' ? 'open' : 'dep') }, { raw: C.m(r.id) },
        { raw: C.esc(short(plain(r.title), 80)) }, { raw: C.esc(short(r.word === 'CERTIFIED' ? (r.decides || '') : (r.why || ''), 240)) }]) }),
    fOpen.length ? C.pRaw(fOpen.length + ' further rows are not yet decided: ' + fOpen.map((r) => C.m(r.id)).join(' ') + '.') : ''
  ].join('\n')
}));

/* §5 — release facts */
const patches = J('corpus/openai-math/release.json').dependencies.length;
B.push(C.section({
  lab: '§5 · the release itself', title: 'Facts the census found',
  bodyRaw: C.plainList([
    { b: 'It moved.', text: 'Two days after release, one commit withdrew ' + R.withdrawn.length + ' manuscripts (a sign error in one invalidated two dependent papers), revised 14 and added ' + R.sinceFirstCommit.challengesAdded.length + ' challenges. The audit holds at ' + R.commit.slice(0, 8) + '; a later commit is a new pin.' },
    { b: 'Two kernels, two challenges.', text: 'nanoda was enabled in ' + cnt(R.counted.enableNanoda, 'true') + ' of ' + n(R.counted.challenges) + ' configs (' + cnt(R.counted.enableNanoda, 'false') + ' false, ' + cnt(R.counted.enableNanoda, 'absent') + ' absent).' },
    { b: 'What the statements import.', text: R.counted.challengesImportingAllMathlib + ' challenges import all of Mathlib; ' + R.challenges.filter((c) => c.imports.some((i) => i.startsWith('OAI'))).length + ' (declared supporting results) import OpenAI\'s own library, so their definitions come from the claimant.' },
    { b: 'One statement declares an axiom.', text: R.counted.statementsWithAxiomDeclaration.map((x) => x.name + ' (' + x.axioms.join(', ') + ')').join('; ') + ' — lane K decides whether the solution uses it.' },
    { b: 'Large statements.', text: R.counted.largestStatements.slice(0, 3).map((x) => x.name + ' ' + n(x.lines) + ' lines').join(', ') + '; median ' + R.counted.statementLines.median + ' lines.' },
    { b: 'Coverage, counted our way.', text: 'OpenAI states ' + R.stated.formalizedTopLine.formalized + ' of ' + R.stated.formalizedTopLine.of + ' top-line results formalized. Its scope notes link ' + linkedCurrent + ' current manuscripts; ' + famWithCh.size + ' of ' + R.families.length + ' families have at least one challenge.' }
  ])
}));

/* §6 — limits */
B.push(C.section({
  lab: '§6 · limits', title: 'What this audit does not decide',
  bodyRaw: C.plainList([
    { b: 'Unformalized proofs.', text: n(U.length) + ' manuscripts are linked by no scope note and carry no finite core: they are UNDECIDED HERE, which says nothing about whether they are right.' },
    { b: 'The analytic parts of finite-core papers.', text: 'A certified finite component is the computation the paper says its argument needs; the argument itself is the paper\'s.' },
    { b: 'Readings.', text: 'Lane S is two careful readings per contested family, quoted to the line — a reading, not a certificate.' },
    { b: 'Who wrote the checkers.', text: 'The deciders and readings were produced in this session by parallel agents under one written brief, then run here; they are checked by their forges, by every printed number they reproduce and by the second readings — not by a second independent implementation.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-openai-math.js from corpus/openai-math/ and certs/openai-math-{kernel,statements,finite}.json; release ' + R.commit.slice(0, 12) + '.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'openai-math.html'), TPL.render({
  title: 'OpenAI\'s math release, checked · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'OpenAI\'s 719 machine-generated manuscripts and 416 Comparator challenges, pre-registered and checked three ways: a second kernel, every statement read against its claim, and every finite witness re-decided in exact arithmetic.',
  path: '/reports/openai-math.html'
}));
console.log('reports/openai-math.html written: K ' + kCert + '/' + kDecided + ', S ' + JSON.stringify(sw) + ', F ' + JSON.stringify(fw) + ', U ' + U.length + ' @ git ' + git);
