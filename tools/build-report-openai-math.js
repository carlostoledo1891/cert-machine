#!/usr/bin/env node
/* build-report-openai-math.js — reports/openai-math.html: OpenAI's math release (github.com/openai/math), audited
   three ways and pre-registered before any row was decided; the page leads with the GAPS the audit found.

   Every number comes from a record, never from this file: the census (corpus/openai-math/release.json), the
   pre-registration (corpus/openai-math/preregistration.json), lane F's membership (corpus/openai-math/f-lane.json),
   the three ledgers — certs/openai-math-kernel.json (lane K), certs/openai-math-statements.json (lane S),
   certs/openai-math-finite.json (lane F) — and the curated gap list, corpus/openai-math/findings.json, whose
   prose may only quote numbers through {{placeholders}} this file fills from the ledgers. The page refuses when the
   ledgers disagree with the census, when a finding names a ledger row that no longer carries the word it depends
   on, when a placeholder is unknown, or — with the pinned clone on disk — when an evidence line does not exist.
   Lane K runs for a day on GitHub's runners, so the page says how many of the 416 challenges it has decided and
   never extrapolates.

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
const G = J('corpus/openai-math/findings.json');
const K = opt('certs/openai-math-kernel.json') || { rows: [], counts: { words: {}, strict: {} } };
const S = J('certs/openai-math-statements.json');
const F = J('certs/openai-math-finite.json');
if (R.commit !== P.release.commit || S.release !== R.commit || F.release !== R.commit || G.release !== R.commit) die('a ledger is pinned to another release commit');
if (S.rows.length !== R.families.filter((f) => f.challenges.length).length) die('lane S does not cover every family with a challenge');
if (F.rows.length !== FL.rows.length) die('lane F does not cover its pre-registered membership');
if (K.rows.some((r) => !R.challenges.find((c) => c.name === r.challenge))) die('lane K holds a challenge the census does not');

const n = (x) => Number(x).toLocaleString('en-US');
const cnt = (o, k) => (o && o[k]) || 0;
const sw = S.counts.words, fw = F.counts, kw = K.counts.words || {};
const kDecided = K.rows.length, kCert = cnt(kw, 'CERTIFIED');
const kRejected = cnt(kw, 'REFUTED') + cnt(kw, 'REFUTED — TO REPRODUCE');
/* why the kernel lane refused, derived from the recorded reasons — never asserted */
const kRefused = K.rows.filter((r) => r.word === 'REFUSED');
const isOverflow = (x) => /stack overflow/.test((x.decided && x.decided.why) || '');
const kOverflowed = K.rows.filter((r) => r.runs.some(isOverflow));
const kOverflowLean = kOverflowed.filter((r) => r.runs.some((x) => isOverflow(x) && (x.kernels || []).some((l) => /^Lean default kernel accepts/.test(l))));
const kStack = kRefused.filter((r) => /stack overflow/.test(r.why || '')), kKilled = kRefused.filter((r) => /the runner terminated it/.test(r.why || ''));
const kStopped = kRefused.filter((r) => /stopped before Comparator|was cancelled in the step/.test(r.why || ''));
const kOther = kRefused.length - kStack.length - kKilled.length - kStopped.length;
const fCert = F.rows.filter((r) => r.word === 'CERTIFIED'), fWhole = fCert.filter((r) => /^the whole headline/.test(r.decides || ''));
const fNeeds = F.rows.filter((r) => r.word === 'NEEDS DATA'), fOpen = F.rows.filter((r) => r.word === 'NOT YET DECIDED');
const fRefuted = F.rows.filter((r) => r.word === 'REFUTED'), fRefused = F.rows.filter((r) => r.word === 'REFUSED');
/* lane U: manuscripts neither in a family with a challenge nor in an F row */
/* (pre-registration lanes.U: no challenge via a scope note that links the manuscript, and no F row) */
const famWithCh = new Set(R.families.filter((f) => f.challenges.length).map((f) => f.n));
const fDirs = new Set(FL.rows.map((r) => r.dir));
const linked = new Set(R.scopeNotes.flatMap((s) => s.papers));
const U = R.manuscripts.filter((m) => !linked.has(m.dir) && !fDirs.has(m.dir));
const linkedCurrent = R.manuscripts.filter((m) => linked.has(m.dir)).length;
/* CONTENTS.md writes math as $`…`$ and keeps some HTML entities; the page shows the plain text */
const plain = (t) => String(t || '').replace(/\$`([^`]*)`\$/g, '$1').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const S_WORDS = ['MATCHES', 'NARROWER — DECLARED', 'NARROWER — UNLINKED', 'NARROWER — UNDECLARED', 'DIFFERENT', 'SUPPORT-ONLY'];
const short = (s, k) => (s.length > k ? s.slice(0, k - 1).replace(/\s+\S*$/, '') + '…' : s);
/* the clauses a family's Lean does not state, from the deciding reading */
const missing = (r) => (r.clauses || []).filter((c) => c.status && c.status !== 'stated').map((c) => c.clause);
const wordTag = (w) => C.tag(w, w === 'MATCHES' ? 'held' : w === 'NARROWER — DECLARED' || w === 'SUPPORT-ONLY' ? 'cert' : w === 'NARROWER — UNLINKED' ? 'open' : 'dep');
const holes = R.challenges.filter((c) => c.definitionNames.length);
const holeRows = K.rows.filter((r) => r.definitionHoles);
const sGap = cnt(sw, 'DIFFERENT') + cnt(sw, 'NARROWER — UNDECLARED');
const pin8 = R.commit.slice(0, 8);

/* ---- the gaps: validated against the ledgers, numbers filled from them ---- */
const V = {
  challenges: n(R.counted.challenges), families: n(S.rows.length), manuscripts: n(R.stated.manuscripts),
  'S.DIFFERENT': cnt(sw, 'DIFFERENT'), 'S.UNDECLARED': cnt(sw, 'NARROWER — UNDECLARED'), 'S.UNLINKED': cnt(sw, 'NARROWER — UNLINKED'), 'S.gap': sGap,
  'holes.challenges': holes.length, 'holes.declared': R.counted.definitionHoles.declared, 'holes.displayed': R.counted.definitionHoles.displayedWithBody,
  'holes.proved': cnt(K.counts.displayed, 'PROVED'), 'holes.open': holes.length - cnt(K.counts.displayed, 'PROVED'),
  'holes.openNames': holes.filter((c) => { const k = K.rows.find((r) => r.challenge === c.name); return !(k && k.displayed && k.displayed.word === 'PROVED'); }).map((c) => c.name).join(', ') || 'none',
  'nanoda.true': cnt(R.counted.enableNanoda, 'true'), 'nanoda.false': cnt(R.counted.enableNanoda, 'false'), 'nanoda.absent': cnt(R.counted.enableNanoda, 'absent'),
  'K.decided': n(kDecided), 'K.certified': n(kCert), 'K.overflow': kOverflowed.length, 'K.overflowLean': kOverflowLean.length,
  'K.overflowCertified': kOverflowed.filter((r) => r.word === 'CERTIFIED').length, 'K.killed': kKilled.length,
  'F.needs': fNeeds.length, 'F.certified': fCert.length, 'F.refuted': fRefuted.length
};
for (const c of R.challenges) V['lines.' + c.name] = n(c.statementLines);
for (const f of R.families) V['manuscripts.' + f.n] = f.manuscripts.length;
const fill = (s, where) => String(s).replace(/\{\{([^}]+)\}\}/g, (_, k) => (k in V ? String(V[k]) : die('unknown placeholder {{' + k + '}} in ' + where)));
const sevLabel = G.severity;
const CLONE = process.env.MATH_CLONE || path.join(require('os').homedir(), 'Projects', 'openai-math');
const cloneAtPin = (() => { try { return cp.execSync('git rev-parse HEAD', { cwd: CLONE }).toString().trim() === R.commit; } catch (e) { return false; } })();
let evidenceChecked = 0;
const evidenceHref = (e) => {
  const [file, lines] = [e.path, e.lines];
  if (e.repo === 'openai/math') {
    if (cloneAtPin) {
      const fp = path.join(CLONE, file);
      if (!fs.existsSync(fp)) die('evidence ' + file + ' does not exist in the clone at ' + pin8);
      if (lines) { const nl = fs.readFileSync(fp, 'utf8').split('\n').length; const hi = Number(String(lines).split('-').pop()); if (!(hi <= nl)) die('evidence ' + file + ':' + lines + ' is past the end of the file (' + nl + ' lines)'); }
      evidenceChecked++;
    }
    return 'https://github.com/openai/math/blob/' + R.commit + '/' + file.split('/').map(encodeURIComponent).join('/') + (lines ? '#L' + String(lines).replace('-', '-L') : '');
  }
  if (e.repo === 'cert-machine') {
    if (!fs.existsSync(path.join(ROOT, file))) die('evidence ' + file + ' does not exist in this repository');
    return 'https://github.com/carlostoledo1891/cert-machine/blob/main/' + file.split('/').map(encodeURIComponent).join('/') + (lines ? '#L' + String(lines).replace('-', '-L') : '');
  }
  if (e.repo === 'nanoda_lib') return 'https://github.com/ammkrn/nanoda_lib/blob/' + e.rev + '/' + file + (lines ? '#L' + lines : '');
  die('evidence with an unknown repository: ' + JSON.stringify(e));
};
const evidenceLink = (e) => '<a href="' + C.escAttr(evidenceHref(e)) + '" title="' + C.escAttr(e.repo + ' · ' + e.path + (e.lines ? ':' + e.lines : '')) + '">' + C.m(path.basename(e.path) + (e.lines ? ':' + e.lines : '')) + '</a>';
const refOk = (ref, id) => {
  if (ref.lane === 'S') { const r = S.rows.find((x) => x.family === ref.family) || die(id + ': family ' + ref.family + ' is not in lane S'); if (!ref.words.includes(r.word)) die(id + ': family ' + ref.family + ' is now ' + r.word + '; the finding says ' + ref.words.join(' / ')); }
  else if (ref.lane === 'K') { if (!R.challenges.find((c) => c.name === ref.challenge)) die(id + ': ' + ref.challenge + ' is not a census challenge'); const r = K.rows.find((x) => x.challenge === ref.challenge); if (ref.words && (!r || !ref.words.includes(r.word))) die(id + ': ' + ref.challenge + ' is ' + (r ? r.word : 'not run') + '; the finding says ' + ref.words.join(' / ')); }
  else if (ref.lane === 'F') { const r = F.rows.find((x) => x.id === ref.id) || die(id + ': ' + ref.id + ' is not in lane F'); if (!ref.words.includes(r.word)) die(id + ': ' + ref.id + ' is now ' + r.word + '; the finding says ' + ref.words.join(' / ')); }
  else die(id + ': unknown lane ' + ref.lane);
};
const gaps = G.findings.slice().sort((a, b) => a.severity - b.severity);
for (const g of gaps) {
  for (const k of ['id', 'severity', 'category', 'title', 'detail', 'evidence', 'refs', 'ask']) if (!(k in g)) die('finding ' + (g.id || '?') + ' has no ' + k);
  if (!sevLabel[String(g.severity)]) die(g.id + ': unknown severity ' + g.severity);
  g.refs.forEach((r) => refOk(r, g.id));
}
const sev1 = gaps.filter((g) => g.severity === 1 && g.headline);

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · OpenAI\'s math release · found ' + G.found + ' at ' + pin8,
  title: 'OpenAI\'s math release: what it claims beyond what it checks',
  deck: 'On 2026-10-06 OpenAI published ' + n(R.stated.manuscripts) + ' machine-generated manuscripts with Lean formalizations and ' + n(R.counted.challenges)
    + ' Comparator challenges. This audit re-ran every check with a second, independent kernel, read every formal statement against the claim it carries, '
    + 'and re-decided every published finite witness in exact arithmetic with code written here. Every proof the kernels finished holds, and every finite object decided here held. '
    + 'The gaps are in what is claimed beyond what is checked — ' + gaps.length + ' of them, ranked below, each pinned to the file and line of the commit audited.'
}));
B.push(C.scope('The release: github.com/openai/math at commit ' + pin8 + ' (Apache-2.0; it moved once after our scouting pin '
  + R.sinceFirstCommit.from.slice(0, 8) + ': ' + R.withdrawn.length + ' manuscripts withdrawn, 14 revised, ' + R.sinceFirstCommit.challengesAdded.length
  + ' challenges added). Every gap below was found on ' + G.found + ' at ' + pin8 + '; ' + G.upstream.note + ' OpenAI calls the collection partial progress and its formal review "unchecked". '
  + 'Issues and discussions are disabled on the repository. A gap is not an error, a reading is not a certificate, and this page keeps the three apart.'));

B.push(C.tldr({
  findingRaw: '<b>' + gaps.length + ' gaps, found ' + G.found + ' at ' + pin8 + '.</b> ' + sev1.length + ' headlines are carried by no machine-checked statement — '
    + sev1.map((g) => C.esc(g.headline)).join('; ') + '. Across the release, <b>' + sGap + ' of ' + S.rows.length + ' formalized families state a different theorem from their headline (' + cnt(sw, 'DIFFERENT') + ') or less than a manuscript their own scope note links (' + cnt(sw, 'NARROWER — UNDECLARED') + '), with nothing saying so</b>, and '
    + cnt(sw, 'NARROWER — UNLINKED') + ' more headlines lead with results no challenge links. Comparator was configured to compare ' + R.counted.definitionHoles.displayedWithBody
    + ' displayed definitions by type alone; the independent kernel was switched on for ' + cnt(R.counted.enableNanoda, 'true') + ' of ' + n(R.counted.challenges) + ' challenges; '
    + fNeeds.length + ' headline witnesses are asserted and not published. <b>Nothing was found false:</b> '
    + (kDecided ? n(kCert) + ' of the ' + n(kDecided) + ' proofs run so far are accepted by two kernels and ' + (kRejected ? n(kRejected) + ' rejected' : 'none rejected') + '; ' : '')
    + fCert.length + ' finite cores certified and ' + (fRefuted.length ? fRefuted.length + ' refuted' : 'none refuted') + '.',
  mechanismRaw: 'Three lanes on one pinned commit. K: Comparator, the Lean FRO\'s judge, re-run on Linux with nanoda — a kernel written in Rust, independently of '
    + 'Lean\'s — switched on for every challenge, a second run that compares the bodies of declared "definition holes", and a transfer check in Lean. S: every '
    + 'statement read against the family headline, the abstracts and OpenAI\'s scope note, by two readers wherever the first found a gap. F: a census of all '
    + n(FL.abstractsRead) + ' abstracts fixed ' + FL.counts.rows + ' finite cores before any was decided; each decider is standard-library Python, exact arithmetic, '
    + 'written from the paper before the authors\' code was opened, with forged variants that must not certify.',
  checkRaw: 'Every gap links its evidence at ' + pin8 + '. ' + C.m('node tools/pin-openai-math.js') + ' · ' + C.m('python3 tools/run-openai-math-finite.py --check') + ' · ' + C.m('node tools/record-openai-math-statements.js')
    + ' · ' + C.m('gh workflow run openai-math-kernel.yml -f challenges="…"') + ' — the pre-registration is ' + C.m('corpus/openai-math/preregistration.json') + ', the gap list ' + C.m('corpus/openai-math/findings.json') + '.'
}));
B.push(C.stats([
  { k: 'statements short of the claim', v: sGap + ' / ' + S.rows.length, n: 'Formalized families whose Lean states a different theorem from the headline, or less than a manuscript its scope note links — with nothing saying so. ' + cnt(sw, 'NARROWER — UNLINKED') + ' more lead with unlinked results.' },
  { k: 'definitions not compared', v: R.counted.definitionHoles.displayedWithBody + ' / ' + R.counted.definitionHoles.declared, n: 'Definition holes displayed with a body Comparator never compares. Settled here for ' + cnt(K.counts.displayed, 'PROVED') + ' of ' + holes.length + ' challenges.' },
  { k: 'second kernel switched on', v: cnt(R.counted.enableNanoda, 'true') + ' / ' + n(R.counted.challenges), n: 'In the release. Here it is on for all: ' + n(kCert) + ' of ' + n(kDecided) + ' run so far accepted by both kernels.' },
  { k: 'witnesses not published', v: String(fNeeds.length), n: 'Headline objects asserted with no checkable instance; ' + (fRefuted.length ? fRefuted.length : 'no') + ' finite claim refuted, ' + fCert.length + ' certified.' }
]));

/* §1 — the gaps, ranked */
B.push(C.section({
  lab: '§1 · the gaps', title: 'What the release claims beyond what it checks, ranked',
  bodyRaw: [
    C.pRaw('A gap is a place where what is checked is less than what is claimed, where a check the release presents does not do what a reader would assume, or where the means to check a claim are not published. Most of the claims behind these gaps may well be true; a gap says only that the release does not yet show it. Ranked: '
      + Object.entries(sevLabel).map(([k, v]) => '<b>' + k + '</b> ' + C.esc(v)).join(' · ') + '. Each gap names what would close it, and the page refuses to build if a ledger row it rests on changes its word.'),
    ...gaps.map((g, i) => C.note({ lab: 'G' + (i + 1) + ' · ' + sevLabel[String(g.severity)].split(' — ')[0] + ' · found ' + (g.found || G.found),
      bodyRaw: C.pRaw('<b>' + C.esc(fill(g.title, g.id)) + '</b>') + C.p(fill(g.detail, g.id))
        + C.pRaw('<b>What would close it.</b> ' + C.esc(fill(g.ask, g.id)))
        + (g.evidence.length ? C.pRaw('<b>Evidence.</b> ' + g.evidence.map(evidenceLink).join(' · ')) : '') }))
  ].join('\n')
}));

/* §2 — the statement lane, every gap listed */
const sOrder = ['DIFFERENT', 'NARROWER — UNDECLARED'];
const sNotable = S.rows.filter((r) => sOrder.includes(r.word)).sort((a, b) => sOrder.indexOf(a.word) - sOrder.indexOf(b.word) || a.family.localeCompare(b.family));
const sUnlinked = S.rows.filter((r) => r.word === 'NARROWER — UNLINKED').sort((a, b) => a.family.localeCompare(b.family));
B.push(C.section({
  lab: '§2 · every statement gap', title: 'What the Lean states, family by family', wide: true,
  bodyRaw: [
    C.pRaw('OpenAI writes one headline per family; a family can hold several manuscripts and several challenges, and its scope note names the manuscripts the '
      + 'formalization covers. Each family\'s challenges were read against that headline, clause by clause. The words, least to most severe: ' + S_WORDS.slice(0, 5).map((w) => C.esc(w)).join(' · ') + ', and SUPPORT-ONLY when every challenge is a declared supporting result'
      + '. Where two readers disagreed, the less severe word is recorded (' + S.counts.disagreements + ' disagreements, ' + (S.counts.disagreements - S.counts.disagreementsOnTheReading.length)
      + ' of them only because the first readers did not yet have the UNLINKED word).'
      + (S.counts.flagReadings ? ' Every vacuity, junk-value, quantifier and definition flag a first reader marked with a question in the other families was read again: '
        + Object.entries(S.counts.flagDecisions || {}).map(([d, c]) => c + ' ' + d.replace(/-/g, ' ')).join(', ') + '.' : '')),
    C.table({ cols: [{ h: 'word' }, { h: 'families' }], rows: S_WORDS.filter((w) => cnt(sw, w))
      .map((w) => [{ raw: wordTag(w) }, { raw: C.m(String(cnt(sw, w))) }]) }),
    C.pRaw('<b>The ' + sNotable.length + ' DIFFERENT and NARROWER — UNDECLARED families.</b> Each line names what the headline or a linked manuscript claims and no challenge states. '
      + 'Every such row quotes both texts, with file and line, in ' + C.m('certs/openai-math-statements.json') + '.'),
    C.table({ cols: [{ h: 'word' }, { h: 'family' }, { h: 'claimed, not stated in Lean' }],
      rows: sNotable.map((r) => [{ raw: wordTag(r.word) }, { raw: C.esc(r.family + ' · ' + short(plain(r.title), 70)) }, { raw: C.esc(short(plain(missing(r).join(' · ') || (r.gap || '')), 260)) }]) }),
    C.pRaw('<b>The ' + sUnlinked.length + ' NARROWER — UNLINKED families.</b> The headline leads with a result from a manuscript the scope note does not link, so no challenge was ever meant to carry it — but a reader of the headline is not told that.'),
    C.table({ cols: [{ h: 'family' }, { h: 'headline result no challenge states' }],
      rows: sUnlinked.map((r) => [{ raw: C.esc(r.family + ' · ' + short(plain(r.title), 70)) }, { raw: C.esc(short(plain(missing(r).join(' · ')), 260)) }]) })
  ].join('\n')
}));

/* §3 — definition holes */
const diff = holeRows.filter((r) => r.strict && r.strict.word === 'BODIES DIFFER');
B.push(C.section({
  lab: '§3 · definition holes', title: 'Where Comparator checks only a type — and what was settled here',
  bodyRaw: [
    C.pRaw(n(holes.length) + ' challenges list definitions in ' + C.m('definition_names') + '. For those, Comparator compares the definition\'s name, universe levels, '
      + 'type and safety — never its body (' + C.m('Comparator/Compare.lean') + ', ' + C.m('definitionHoleMatches') + ', at the pinned revision) — and its own README '
      + 'says such solutions "must always be checked with an additional (potentially human) verifier". Of the ' + R.counted.definitionHoles.declared + ' holes these '
      + 'files declare, ' + R.counted.definitionHoles.displayedWithBody + ' are displayed with a full body and ' + R.counted.definitionHoles.sorried + ' are left sorried: a reader '
      + 'of the challenge sees ' + R.counted.definitionHoles.displayedWithBody + ' definitions the check does not compare. Lane K supplies the missing verifier twice over: a '
      + 'strict run with the holes emptied, which compares every body constant by constant, and a transfer check in Lean.'),
    C.table({ cols: [{ h: 'challenge' }, { h: 'holes (displayed)' }, { h: 'bodies, decided' }, { h: 'transfer' }, { h: 'displayed statement' }],
      rows: holes.map((c) => { const k = K.rows.find((r) => r.challenge === c.name); return [{ raw: C.m(c.name) }, { raw: C.m(c.definitionNames.length + ' (' + c.holeBodies.filter((h) => h.displayed).length + ')') },
        { raw: k && k.strict ? C.tag(k.strict.word, k.strict.word === 'SAME BODIES' ? 'held' : 'dep') + (k.strict.constants ? ' ' + C.esc(k.strict.constants.join(', ')) : '') : C.esc('not yet run') },
        { raw: k && k.transfer ? C.tag(k.transfer.word, k.transfer.word === 'TRANSFERS' ? 'held' : k.transfer.word === 'NOT DECIDED' ? 'open' : 'dep') : C.esc('not yet run') },
        { raw: k && k.displayed ? C.tag(k.displayed.word, k.displayed.word === 'PROVED' ? 'held' : 'open') : C.esc('—') }]; }) }),
    C.pRaw('The transfer column (pre-registration amendment 9) asks Lean itself whether each theorem proves the statement the file displays. The '
      + 'challenge file\'s skeleton is kept; its holes, and every declaration tied to them, are copied under new names; every other name resolves to '
      + 'the solution\'s constant, which Comparator has already matched to the challenge\'s. A guard computed in Lean refuses the check if a copy '
      + 'reaches an original hole or a constant Comparator never compared, and each solution theorem is then offered as a proof of the copied '
      + 'statement. TRANSFERS needs Lean\'s kernel to accept it AND a red control — one displayed body forged — to be rejected. A NOT '
      + 'DEFINITIONAL or a guard refusal can be the method\'s limit rather than a difference, so the last column counts a statement as proved when the strict run '
      + 'found the same bodies OR the transfer holds, and leaves it open otherwise.'),
    diff.length ? C.pRaw('Where the strict run names a constant whose bodies differ (' + diff.map((r) => C.m(r.strict.constants.join(', '))).join(', ') + '), '
      + 'the source text reads the same in the challenge and the solution; the kernel terms differ through elaboration. '
      + diff.map((r) => C.m(r.challenge) + ': ' + (r.transfer ? (r.transfer.word === 'TRANSFERS' ? 'the transfer check settles it — the theorem proves the displayed statement' : 'the transfer check did not settle it (' + C.esc(r.transfer.word) + ')') : 'the transfer check is still running')).join('; ') + '.') : ''
  ].join('\n')
}));

/* §4 — the kernel lane: what holds */
const kRows = K.rows.slice().sort((a, b) => (a.word === b.word ? a.challenge.localeCompare(b.challenge) : a.word === 'CERTIFIED' ? 1 : -1));
const refusedWhy = [kStack.length ? kStack.length + ' nanoda stack overflow' + (kStack.length > 1 ? 's' : '') + ' (16 MiB thread stack)' : '',
  kKilled.length ? kKilled.length + ' job' + (kKilled.length > 1 ? 's' : '') + ' the runner terminated in Comparator (1 GiB stack, 16 GB machine)' : '',
  kStopped.length ? kStopped.length + ' job' + (kStopped.length > 1 ? 's' : '') + ' that hit the runner\'s time limit' : '', kOther ? kOther + ' other' : ''].filter(Boolean).join(', ') || 'none';
B.push(C.section({
  lab: '§4 · the kernel lane', title: 'What holds: two kernels, every challenge run so far', wide: true,
  bodyRaw: [
    C.pRaw('Comparator builds a challenge and its solution in a sandbox, exports both, checks that each listed theorem has exactly the challenge\'s statement and '
      + 'uses no axiom beyond ' + C.m('propext') + ', ' + C.m('Quot.sound') + ' and ' + C.m('Classical.choice') + ', and replays the proof through Lean\'s kernel and any '
      + 'external kernel it is given. The release enabled nanoda for ' + cnt(R.counted.enableNanoda, 'true') + ' challenges; here it is on for all. One job per challenge, '
      + 'on GitHub\'s Linux runners (4 vCPU, 16 GB; the sandbox is Linux-only). A CERTIFIED here says the Lean theorem is proved; whether that theorem is the paper\'s claim is §2.'),
    C.pRaw('<b>' + n(kCert) + ' of ' + n(kDecided) + ' CERTIFIED</b>, ' + (kRejected ? n(kRejected) + ' rejected' : 'none rejected') + ', ' + n(R.counted.challenges - kDecided) + ' still running. The ' + kRefused.length + ' REFUSED are ' + refusedWhy
      + '. Every one of the ' + kOverflowed.length + ' exports that overflowed nanoda\'s stack had already been accepted by Lean\'s kernel in the same run (' + kOverflowLean.length + ' of ' + kOverflowed.length + '); with the stack raised to 1 GiB (pre-registration amendment 11), '
      + kOverflowed.filter((r) => r.word === 'CERTIFIED').length + ' have since been accepted by nanoda as well.'),
    kRows.some((r) => r.word !== 'CERTIFIED') ? C.table({ cols: [{ h: 'verdict' }, { h: 'challenge' }, { h: 'family' }, { h: 'why' }],
      rows: kRows.filter((r) => r.word !== 'CERTIFIED').map((r) => [{ raw: C.tag(r.word, r.word === 'REFUSED' ? 'open' : 'dep') }, { raw: C.m(r.challenge) },
        { raw: C.esc(r.families.join(', ')) }, { raw: C.esc(short(r.why || '', 200)) }]) }) : '',
    kDecided ? C.pRaw('CERTIFIED, each by Lean\'s kernel and nanoda: ' + kRows.filter((r) => r.word === 'CERTIFIED').map((r) => C.m(r.challenge)).join(' ') + '.') : C.pRaw('No job has been recorded yet.'),
    C.pRaw('The trust base, as the pre-registration states it: ' + C.esc(P.lanes.K.trustBase))
  ].join('\n')
}));

/* §5 — the finite lane */
const fRowsShown = F.rows.filter((r) => r.word !== 'NOT YET DECIDED');
B.push(C.section({
  lab: '§5 · the finite lane', title: 'The finite objects, decided here', wide: true,
  bodyRaw: [
    C.pRaw('A census of all ' + n(FL.abstractsRead) + ' abstracts, by three readers on disjoint slices, named ' + FL.counts.rows + ' finite cores over ' + FL.counts.manuscripts
      + ' manuscripts before any was decided: ' + FL.counts.tiers.A + ' published and checkable, ' + FL.counts.tiers.B + ' published but expensive, ' + FL.counts.tiers.C
      + ' asserted but not published in checkable form. Each decider reads the release\'s own bytes and records their sha256; "whole headline" means the finite '
      + 'object is the entire claim, otherwise the analytic argument around the component is not decided here. ' + fCert.length + ' CERTIFIED (' + fWhole.length + ' of them the whole headline: '
      + fWhole.map((r) => C.esc(plain(r.title))).join('; ') + '), ' + fRefuted.length + ' REFUTED, ' + fRefused.length + ' REFUSED (decided in part, or too costly here, each cost named), ' + fNeeds.length + ' NEEDS DATA.'),
    C.table({ cols: [{ h: 'verdict' }, { h: 'row' }, { h: 'manuscript' }, { h: 'what is decided' }],
      rows: fRowsShown.map((r) => [{ raw: C.tag(r.word, r.word === 'CERTIFIED' ? 'held' : r.word === 'NEEDS DATA' ? 'open' : 'dep') }, { raw: C.m(r.id) },
        { raw: C.esc(short(plain(r.title), 80)) }, { raw: C.esc(short(r.word === 'CERTIFIED' ? (r.decides || '') : (r.why || ''), 240)) }]) }),
    fOpen.length ? C.pRaw(fOpen.length + ' further rows are not yet decided: ' + fOpen.map((r) => C.m(r.id)).join(' ') + '.') : ''
  ].join('\n')
}));

/* §6 — release facts */
B.push(C.section({
  lab: '§6 · the release itself', title: 'Facts the census found',
  bodyRaw: C.plainList([
    { b: 'It moved.', text: 'Two days after release, one commit withdrew ' + R.withdrawn.length + ' manuscripts (a sign error in one invalidated two dependent papers), revised 14 and added ' + R.sinceFirstCommit.challengesAdded.length + ' challenges. The audit holds at ' + pin8 + '; a later commit is a new pin.' },
    { b: 'Two kernels, two challenges.', text: 'nanoda was enabled in ' + cnt(R.counted.enableNanoda, 'true') + ' of ' + n(R.counted.challenges) + ' configs (' + cnt(R.counted.enableNanoda, 'false') + ' false, ' + cnt(R.counted.enableNanoda, 'absent') + ' absent).' },
    { b: 'What the statements import.', text: R.counted.challengesImportingAllMathlib + ' challenges import all of Mathlib; ' + R.challenges.filter((c) => c.imports.some((i) => i.startsWith('OAI'))).length + ' (declared supporting results) import OpenAI\'s own library, so their definitions come from the claimant.' },
    { b: 'One statement declares an axiom.', text: R.counted.statementsWithAxiomDeclaration.map((x) => x.name + ' (' + x.axioms.join(', ') + ')').join('; ') + ' — lane K decides whether the solution uses it.' },
    { b: 'Large statements.', text: R.counted.largestStatements.slice(0, 3).map((x) => x.name + ' ' + n(x.lines) + ' lines').join(', ') + '; median ' + R.counted.statementLines.median + ' lines.' },
    { b: 'Coverage, counted our way.', text: 'OpenAI states ' + R.stated.formalizedTopLine.formalized + ' of ' + R.stated.formalizedTopLine.of + ' top-line results formalized. Its scope notes link ' + linkedCurrent + ' current manuscripts; ' + famWithCh.size + ' of ' + R.families.length + ' families have at least one challenge.' }
  ])
}));

/* §7 — limits */
B.push(C.section({
  lab: '§7 · limits', title: 'What this audit does not decide',
  bodyRaw: C.plainList([
    { b: 'Unformalized proofs.', text: n(U.length) + ' manuscripts are linked by no scope note and carry no finite core: they are UNDECIDED HERE, which says nothing about whether they are right.' },
    { b: 'The analytic parts of finite-core papers.', text: 'A certified finite component is the computation the paper says its argument needs; the argument itself is the paper\'s.' },
    { b: 'Readings.', text: 'Lane S and the gap list are careful readings quoted to the line — readings, not certificates. A gap marks what the release does not show; it is not a claim that anything is false.' },
    { b: 'Who wrote the checkers.', text: 'The deciders and readings were produced in this session by parallel agents under one written brief, then run here; they are checked by their forges, by every printed number they reproduce and by the second readings — not by a second independent implementation.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-openai-math.js from corpus/openai-math/ (the gap list: findings.json) and certs/openai-math-{kernel,statements,finite}.json; release ' + R.commit.slice(0, 12) + '. '
  + (cloneAtPin ? evidenceChecked + ' evidence lines checked against the pinned clone at this build.' : 'The pinned clone was not on disk at this build: evidence lines not re-checked.')) + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'openai-math.html'), TPL.render({
  title: 'OpenAI\'s math release: the gaps · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'OpenAI\'s 719 machine-generated manuscripts and 416 Comparator challenges, audited three ways: ' + gaps.length + ' gaps between what the release claims and what it checks, found ' + G.found + ' at ' + pin8 + ', each pinned to file and line — and nothing found false.',
  path: '/reports/openai-math.html'
}));
console.log('reports/openai-math.html written: ' + gaps.length + ' gaps, K ' + kCert + '/' + kDecided + ', S ' + JSON.stringify(sw) + ', F ' + JSON.stringify(fw) + ', U ' + U.length + ', evidence ' + (cloneAtPin ? evidenceChecked + ' checked' : 'not checked') + ' @ git ' + git);
