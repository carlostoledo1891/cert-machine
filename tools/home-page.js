/* home-page.js — the home page (/), on the operator's draft of 2026-11-11: "Looks right? Zoom in."
   tools/ · cert-machine

   WHY. Several readers had told the operator the site was almost unreadable, and he drew the home page he wanted: one
   idea per section, plain words, first person, a figure a reader can turn. This file builds that page in the house
   system: the pieces are design/home.js's components, the shell is design/template.js's, and every number, quotation
   and verdict word is READ here from the record that decided it. The page is a marketing touchpoint
   (design/marketing.js): it prints no record line, no hash and no stop sentence. The refusals are below all the same
   (hg), and they stop the build like the old landing's guards: a record that no longer supports a sentence refuses
   the page.

   Called once by tools/build-site.js, which hands it the numbers the hubs already share (the tolerance rate, the
   asterisks, the outside re-runs, the pinned quotations, the kissing wave), so the home page, /verify/ and
   /how-it-works/ cannot disagree. Everything else is read here.

   WHAT THE DRAFT HAD WRONG, and what the records say (each is a guard below):
     · "23 instruments": the instruments' manifest counts 24.
     · "OpenAI and Anthropic each proved it false": the claims are the labs'; the page says each published a proof.
     · the overlap and the sentence under it in the witness red: WARRANT rule 5 keeps the red to a × beside words, so
       the overlap is filled in ink and the × marks it.
     · every refuted cell a red ×: a cell's shape is its verdict, and the red never marks a verdict; the cells are ink.
       (The × beside "Refuted" in the hero's three words is red on the operator's word of 2026-11-11: it is the key of
       the witness mark, beside "the thing that breaks it".)
     · "Everything re-runs": the rerun kit re-derives most records in one line, not all, so the footer does not say it.
   The register's own sentence for the Ramanujan Machine row says "52 printed rows"; the ledger holds 51 printed rows
   and our correction, and this page counts the printed ones (the house rule since 2026-08-27).                    MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function homePage(X) {
  const { ROOT, C, W, fmt, fail, GITHUB, numword, D1, registerSince, tolAdmit, asterisksOff, externalReruns, rerunParties,
    regQuote, qiushi, peer, OUTSIDE, KW, sci15, INSTR, paperStatus, rmPrinted, rmSurvive } = X;
  const H = require(path.join(ROOT, 'design', 'home.js'));
  const CT = require(path.join(ROOT, 'design', 'contact.js'));
  const MKT = require(path.join(ROOT, 'design', 'marketing.js'));
  const OUT = require(path.join(ROOT, 'design', 'outward.js'));
  const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
  const hg = (plain, ok, msg) => { if (!ok) fail((msg ? msg + ' — ' : '') + 'the home page refuses to build if ' + plain); };
  const Cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow10 = (e) => '10' + String(e).split('').map((c) => SUP[c]).join('');
  hg('it is not on design/marketing.js\'s list of marketing pages, and it prints no record lines', MKT.isMarketing('index.html'));

  /* THE PLAIN WORDS OF THE FOUR STANDINGS, said once: the plate near the end prints them, and every value's tooltip is
     its standing's line, so no value keeps a reason the page does not print (R22) */
  const SAY = {
    decided: { k: 'Solid', g: 'Proved. Exactly.' },
    computed: { k: 'Dashed', g: 'Someone printed it, or it was computed and not proved.' },
    chosen: { k: 'Dotted', g: 'Somebody chose it.' },
    refused: { k: 'Nothing', g: 'Refused. So no line at all.' }
  };
  const WHY = { [W.DECIDED]: 'decided — ' + SAY.decided.g, [W.COMPUTED]: 'computed — ' + SAY.computed.g, [W.CHOSEN]: 'chosen — ' + SAY.chosen.g };
  const val = (file, ptr, standing, f) => W.val({ rec: { path: file, ptr }, standing, fmt: f || 'int', why: WHY[standing] });
  const value = (text, standing, from) => W.value(text, standing, Object.assign({ title: WHY[standing] }, from));

  /* ---- THE HERO: one published circle packing, zoomed onto the pair its record names ---------------------------- */
  const INTAKE = 'certs/claims-intake-2026-11-08.json', REG = 'certs/claims-ledger.json';
  const DATA = 'corpus/claims-intake/inputs/thetaevolve-7c12898-CirclePacking-data.json';
  const IN = J(INTAKE), L = J(REG);
  const c5 = IN.claims && IN.claims['5'], dec = c5 && c5.decision;
  const A5 = INTAKE + '#/claims/5/decision/', P5 = '/claims/5/decision/';
  const raw = fs.readFileSync(path.join(ROOT, DATA));
  const pin = ((IN.pins.thetaevolve || {}).files || {})[path.basename(DATA)];
  hg('the circle packing it draws is not, byte for byte, the file the claims record pins',
    !!pin && crypto.createHash('sha256').update(raw).digest('hex') === pin.sha256 && raw.length === pin.bytes);
  const entry = JSON.parse(raw.toString('utf8')).find((e) => e.name === c5.entry);
  const circles = entry ? entry.list : [];
  const row5 = L.rows.find((r) => r.id === 'intake-5');
  hg('the claims record no longer certifies that entry at the tolerance its authors state, with the strict reading failing on the pairs it counts',
    c5 && c5.verdict === 'CERTIFIED' && dec.verdict === 'CERTIFIED' && c5.agree === true && row5 && row5.verdict === 'CERTIFIED' && row5.decidedFrom === INTAKE
    && circles.length === dec.n && circles.every((t) => Array.isArray(t) && t.length === 3 && t.every((v) => typeof v === 'number'))
    && dec.strict && dec.strict.holds === false && dec.strict.pairViolations > 0 && dec.strict.pairs.length === dec.strict.pairViolations
    && dec.underReading.pairViolations === 0 && dec.underReading.sideViolations === 0);
  const tolM = /^0\.(0*)1$/.exec(String(dec.tolerance));
  hg('the tolerance the authors state is no longer a power of ten', !!tolM);
  const tolWord = pow10(-(tolM[1].length + 1));
  const pairsAll = dec.n * (dec.n - 1) / 2;
  const worst = dec.worstPairDistance, [wi, wj] = worst.pair;
  const overlapLo = OUT.fixed(worst.sumMinusDistance[0], 7, false);
  /* the picture is drawn in the browser's doubles from the same coordinates: it must show the overlap the record decided */
  const pic = (() => { const a = circles[wi], b = circles[wj]; return (a[2] + b[2]) - Math.hypot(b[0] - a[0], b[1] - a[1]); })();
  hg('the pair it zooms onto is not the record\'s worst pair, among the pairs that overlap, or the drawing\'s overlap is not the one the record decided',
    dec.strict.pairs.some((p) => p[0] === wi && p[1] === wj) && /[1-9]/.test(overlapLo) && pic > 0 && Math.abs(pic - Number(worst.sumMinusDistance[0])) < 1e-12
    && Number(worst.sumMinusDistance[0]) <= Number(worst.sumMinusDistance[1]));
  const overlap = val(INTAKE, P5 + 'worstPairDistance/sumMinusDistance/0', W.DECIDED, 'lo:7');
  const scope = H.scope({
    caption: dec.n + ' circles in a square · a published record',
    alt: Cap(numword(dec.n)) + ' circles packed in a unit square, drawn from the published coordinates. From afar each touches its neighbours. '
      + 'Zoomed in about a million times on one pair, the two circles overlap, by ' + overlapLo + ' of the side. With no tolerance, '
      + dec.strict.pairViolations + ' of the ' + pairsAll + ' pairs overlap; at the tolerance the authors state, ' + tolWord + ', the packing is certified.',
    /* the figure names its record, the claims record, which pins the published file by sha256; the file's own path is
       not written into the figure (the operator, 2026-11-11: the source is unnamed in the figure and credited, with
       its licence, in the footer) */
    circles, pair: [wi, wj], record: INTAKE,
    sliderLabel: 'Zoom, from one to about a million and a half times',
    saysRaw: ['They touch.', 'Still touching.', 'Still touching?', 'They overlap.', 'They overlap, by ' + overlap + '.'],
    chipsRaw: [
      '<span class="hm-chip">' + C.tag(c5.verdict) + '</span><span>as the authors stated it, with a tolerance of '
        + value(tolWord, W.COMPUTED, { claim: A5 + 'tolerance' }) + '</span>',
      '<span class="hm-chip">' + W.witness('the pair that overlaps, marked in the figure') + C.tag('Fails', 'dep') + '</span><span>with no tolerance: '
        + val(INTAKE, P5 + 'strict/pairViolations', W.DECIDED) + ' of ' + value(String(pairsAll), W.DECIDED, { derived: A5 + 'n' }) + ' pairs overlap</span>'
    ]
  });
  hg('the figure names the source of its circles (it is credited in the footer, with its licence, and nowhere in the figure)', !/thetaevolve/i.test(scope));
  const hero = H.hero({
    lines: ['Looks right?', 'Zoom in.'],
    ledeRaw: 'I’m Carlos. I check published results <b>exactly</b>, whoever printed them: an AI lab, a journal, a simulation, a spreadsheet. '
      + 'You get one word back, and a file you can run.',
    ctasRaw: H.btn({ href: '#register', raw: 'See what I’ve checked', solid: true }) + H.btn({ href: '#doors', raw: 'Work with me' }),
    scopeRaw: scope,
    /* the three words, compact, at the foot of the left column (the operator, 2026-11-11: the section was too big) */
    wordsRaw: H.words({ label: 'Three words. That’s the whole product.', items: [
      { word: 'Certified', text: 'It holds. Here’s the file that proves it.' },
      { word: 'Refuted', text: 'It fails. Here’s the thing that breaks it.' },
      { word: 'Refused', text: 'I can’t decide it, and here’s why. No guessing.' }
    ] })
  });

  /* ---- THE REGISTER: one cell per decided row of certs/claims-ledger.json, by month ------------------------------ */
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const decided = L.rows.map((r, i) => ({ r, i })).filter((x) => x.r.verdict !== 'QUEUED')
    .sort((a, b) => String(a.r.recordedOn).localeCompare(String(b.r.recordedOn)) || a.i - b.i).map((x) => x.r);
  const NOTE = { CERTIFIED: 'it holds', PARTIAL: 'part holds, part refused', MIXED: 'part holds, part fails', REPAIRED: 'failed, then fixed', REFUTED: 'it fails', 'NEEDS DATA': 'refused' };
  const WORDS = Object.keys(H.CELL);
  hg('the register\'s decided count is not its rows that are not queued, a decided row has no date, no page or a verdict this page has no shape for, or its counts by verdict do not add up',
    L.decided === decided.length && decided.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(String(r.recordedOn)) && r.page && H.CELL[r.verdict])
    && WORDS.every((w) => (L.byVerdict[w] || 0) === decided.filter((r) => r.verdict === w).length)
    && WORDS.reduce((a, w) => a + (L.byVerdict[w] || 0), 0) === L.decided && Object.keys(NOTE).join() === WORDS.join(),
    L.decided + ' vs ' + decided.length);
  /* a long sentence is cut at a word, as the old landing cut its claimant column */
  const cut = (s, n) => { const t = String(s).replace(/\s+/g, ' ').trim(); if (t.length <= n) return t;
    const c = t.slice(0, n).replace(/[\s,;:—–-]+\S*$/, '').replace(/[\s,;:—–(-]+$/, ''); return (c || t.slice(0, n)) + '…'; };
  const hrefOf = (p) => (/^https?:\/\//.test(p) ? p : p.replace(/^\//, ''));
  const dateWords = (iso) => Number(iso.slice(8)) + ' ' + MON[Number(iso.slice(5, 7)) - 1] + ' ' + iso.slice(0, 4);
  const rows = decided.map((r) => ({ d: dateWords(r.recordedOn), verdict: r.verdict, w: cut(r.claimant, 60), t: cut(r.claim, 132), h: hrefOf(r.page) }));
  const months = [];
  decided.forEach((r, i) => { const k = r.recordedOn.slice(0, 7); if (!months.length || months[months.length - 1].key !== k) months.push({ key: k, label: MON[Number(k.slice(5)) - 1], rows: [] }); months[months.length - 1].rows.push(i); });
  const first = decided.findIndex((r) => /weight-space-programming/.test(r.page));
  hg('the register no longer starts in ' + registerSince + ', one year\'s months in order, or holds no row for the Weights audit to show first',
    first >= 0 && months.length > 0 && new Set(months.map((m) => m.key.slice(0, 4))).size === 1
    && registerSince === ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(months[0].key.slice(5)) - 1] + ' ' + months[0].key.slice(0, 4));
  const register = H.section({ id: 'register', bodyRaw:
    H.head({ titleRaw: val(REG, '/decided', W.DECIDED) + ' results checked since ' + C.esc(registerSince.replace(/\s+\d{4}$/, '')) + '. Touch one.' })
    + H.field({ months, rows, first, record: REG,
      label: 'The register: ' + L.decided + ' decided results, one cell each, by month. The arrow keys move between them.',
      legend: WORDS.filter((w) => L.byVerdict[w]).map((w) => ({ verdict: w, nRaw: val(REG, '/byVerdict/' + w, W.DECIDED), note: NOTE[w] })) }) });

  /* ---- WHAT THEY PRINTED, WHAT I FOUND: six audits, each a printed number above the decided one ------------------- */
  const WSPB = 'certs/wsp-baseline.json', PG = 'certs/prime-gaps-186.json', GSM = 'certs/gsm8k-ledger.json', ENV = 'certs/envs-record.json';
  const OREL = 'corpus/openai-math/release.json', OK_ = 'certs/openai-math-kernel.json', OST = 'certs/openai-math-statements.json';
  const Wb = J(WSPB), Pg = J(PG), Gs = J(GSM), En = J(ENV), Orel = J(OREL), Ok = J(OK_), S = J(OST);
  /* 1 · the Weights audit */
  const wspBest = Wb.reading && Wb.reading.best_no_edit_arm, wspRow = decided[first];
  const wspPrinted = Wb.post_printed.unedited_math500_printed * 100;
  hg('the Weights record no longer holds the post\'s printed score with no edit, a best no-edit arm, and the reading "mostly a settings effect"; or the register no longer quotes the post\'s "6×"',
    wspBest && typeof wspBest.percent === 'number' && wspPrinted > 0 && wspPrinted < wspBest.percent && /settings effect/i.test(String(Wb.reading.verdict || ''))
    && /\(6×\)/.test(wspRow.claim) && /MIT CSAIL/.test(wspRow.claimant) && wspBest.percent > 0.9 * Wb.reading.target_percent);
  /* 2 · prime gaps */
  const pgAxioms = Pg.lean.audit.axioms.filter((a) => /^PrimeGap186\./.test(a));
  const pgBound = (/_le_(\d+)$/.exec((Pg.lean.audit.theorems.find((t) => /primeGapLiminf_le_\d+$/.test(t.name)) || {}).name || '') || [])[1];
  hg('the prime-gaps record no longer says OpenAI\'s Lean proof of the bound holds on three declared assumptions, all three still assumed',
    pgBound && pgAxioms.length === 3 && Pg.verdicts.axioms === 'ASSUMED, all three' && Pg.verdicts.statementLayer === 'CERTIFIED' && /accept/.test(Pg.verdicts.kernels)
    && /openai/i.test(Pg.pins.repository));
  /* 3 · GSM8K */
  const gsmItems = Gs.test.items + Gs.train.items, gsmWrong = Gs.test.classes.PRINTED_STEP_WRONG + Gs.train.classes.PRINTED_STEP_WRONG;
  hg('the GSM8K ledger\'s classes do not number its items, or its count of wrong printed steps disagrees with its findings',
    ['test', 'train'].every((k) => Object.values(Gs[k].classes).reduce((a, n) => a + n, 0) === Gs[k].items)
    && gsmWrong === Gs.findings.printedStepWrongTest + Gs.findings.printedStepWrongTrain && gsmWrong > 0);
  /* 4 · the Ramanujan Machine: the printed rows only, never our correction row (tools/build-site.js counts them) */
  hg('the Ramanujan Machine audit no longer finds exactly one printed row refuted', rmPrinted > 0 && rmSurvive === rmPrinted - 1);
  /* 5 · OpenAI's math release */
  const sShort = (S.counts.words.DIFFERENT || 0) + (S.counts.words['NARROWER — UNDECLARED'] || 0);
  hg('the kernel record no longer decides every proof of OpenAI\'s release as certified or refused, on a second kernel; or no formalized family states less than its headline',
    Ok.counts.decided === Orel.counted.challenges && (Ok.counts.words.CERTIFIED || 0) + (Ok.counts.words.REFUSED || 0) === Ok.counts.decided
    && (Ok.counts.words.REFUSED || 0) > 0 && /\bnanoda/.test(Ok.decider) && sShort > 0 && S.rows.length === S.counts.families);
  /* 6 · the graders: the rate is exact over a mix picked here, so it is CHOSEN (dotted) */
  const gi = En.graders.findIndex((g) => /absolute/.test(g.name)), gEnc = En.graders.find((g) => /^enclosure/.test(g.name));
  hg('the graders record no longer gives the tolerance grader\'s rate this page prints, or its certificate grader admits a wrong answer',
    gi >= 0 && Math.round(En.graders[gi].falseAccept * En.graders[gi].wrongSubmissions) === tolAdmit.k && En.graders[gi].wrongSubmissions === tolAdmit.n && gEnc && gEnc.falseAccept === 0);
  const pairs = H.pairs([
    { href: 'reports/weight-space-programming.html', k: 'A viral post · MIT CSAIL',
      wasRaw: value((Math.round(wspPrinted * 10) / 10).toFixed(1) + '%', W.COMPUTED, { claim: WSPB + '#/post_printed/unedited_math500_printed' }) + ' before the edit',
      isRaw: val(WSPB, '/reading/best_no_edit_arm/percent', W.DECIDED, 'lo:1') + '%',
      textRaw: 'The model was already that good. The “6×” was mostly a settings effect.' },
    { href: 'reports/prime-gaps-186.html', k: 'A Lean proof · OpenAI',
      wasRaw: 'prime gaps ≤ ' + value(pgBound, W.COMPUTED, { claim: PG + '#/lean/audit/theorems' }),
      isRaw: value(pgBound, W.DECIDED, { derived: PG + '#/verdicts/statementLayer' }),
      smallRaw: '<em>if ' + value(String(pgAxioms.length), W.DECIDED, { derived: PG + '#/lean/audit/axioms' }) + ' things hold</em>',
      textRaw: 'The proof is fine. It rests on ' + numword(pgAxioms.length) + ' assumptions, and they’re still assumptions.' },
    { href: 'reports/gsm8k-audit.html', k: 'A benchmark · GSM8K',
      wasRaw: value(fmt(gsmItems), W.COMPUTED, { claim: [GSM + '#/test/items', GSM + '#/train/items'] }) + ' answer keys',
      isRaw: value(fmt(gsmWrong), W.DECIDED, { derived: [GSM + '#/test/classes/PRINTED_STEP_WRONG', GSM + '#/train/classes/PRINTED_STEP_WRONG'] }),
      smallRaw: 'wrong steps',
      textRaw: 'Models are graded against this key. I re-did its arithmetic, step by step.' },
    { href: 'reports/rm-audit.html', k: 'A results table · the Ramanujan Machine',
      wasRaw: fmt(rmPrinted) + ' formulas', isRaw: fmt(rmSurvive), smallRaw: 'hold',
      textRaw: 'One has a sign slip. The corrected constant is certified next to it.' },
    { href: 'reports/openai-math.html', k: 'A release · OpenAI',
      wasRaw: val(OREL, '/counted/challenges', W.COMPUTED) + ' formal proofs',
      isRaw: val(OK_, '/counts/words/CERTIFIED', W.DECIDED),
      smallRaw: '+ ' + val(OK_, '/counts/words/REFUSED', W.DECIDED) + ' refused',
      textRaw: 'The proofs pass a second checker. But ' + value(fmt(sShort) + ' of ' + fmt(S.counts.families), W.COMPUTED, { derived: [OST + '#/counts/words', OST + '#/rows'] }) + ' prove less than their headline says.' },
    { href: 'reports/envs.html', k: 'A grader · “close enough”',
      wasRaw: 'within tolerance',
      isRaw: value(tolAdmit.pct, W.CHOSEN, { derived: [ENV + '#/graders/' + gi + '/falseAccept', ENV + '#/graders/' + gi + '/wrongSubmissions'] }),
      textRaw: 'of provably wrong answers get through. A certificate grader lets none.' }
  ]);
  const printed = H.section({ bodyRaw: H.head({ title: 'What they printed. What I found.' }) + pairs
    + '<p class="hm-key"><span><span class="w-computed">Dashed</span> means someone printed it, or it was computed and not proved.</span>'
    + '<span>Plain means I decided it.</span><span><span class="w-chosen">Dotted</span> means I picked the test mix.</span></p>' });

  /* ---- THE HARD ONE: the two claimed refutations of ETH, carried to a standard machine --------------------------- */
  const ethA = J('certs/eth-chain.json'), ethO = J('certs/eth-openai-chain.json'), ethH = J('certs/eth-hawkley-bridge.json');
  hg('one of the two ETH chains or Hawkley\'s bridge is no longer certified, a chain no longer ends on a standard multitape Turing machine, or the report no longer dates the conjecture to 1999',
    ethA.verdict === 'CERTIFIED' && ethO.verdict === 'CERTIFIED' && ethH.word === 'CERTIFIED'
    && /multitape Turing machine/.test(ethA.scope) && /multitape Turing machine/.test(ethO.scope) && /Hawkley/.test(ethO.scope)
    && /Impagliazzo and Paturi in 1999/.test(fs.readFileSync(path.join(ROOT, 'reports', 'eth-chain.html'), 'utf8')));
  const eth = H.section({ bodyRaw:
    H.head({ title: 'The hard one: two labs, one famous conjecture.',
      pRaw: 'OpenAI and Anthropic each published a proof that it is false. Each on a computer of its own design. With AI agents, I carried both proofs to the textbook computer.' })
    + H.chain({
      alt: 'OpenAI’s theorem links to Anthropic’s theorem, which links to a standard Turing machine, each link decided in Lean. The last step, to the textbook’s definition, has no line: it is a reading.',
      nodes: [{ title: 'OpenAI’s theorem', sub: 'on OpenAI’s machine' }, { title: 'Anthropic’s theorem', sub: 'on Anthropic’s machine' },
        { title: 'A standard Turing machine', sub: 'the one every course teaches' }, { title: 'The textbook’s conjecture', sub: 'ETH, 1999', read: true }],
      links: [{ decided: true, word: 'decided' }, { decided: true, word: 'decided' }, { decided: false, word: 'a reading' }] })
    + '<div class="hm-after"><p>Solid lines are checked by machine; the first is Daniel Hawkley’s proof, replayed here. The last step has no line. '
    + 'It takes a human to read a definition, and I won’t draw what I didn’t decide.</p>' + H.more({ href: 'reports/eth-chain.html', text: 'The full story' }) + '</div>' });

  /* ---- OTHER PEOPLE RAN IT AGAIN: three pinned quotations (design/outside.js checked each against its snapshot) ---- */
  const qReg = OUTSIDE.plain(regQuote.quote);
  const qQiu = /independently verified the complete configurations in all (\d+) dimensions/.exec(OUTSIDE.plain(qiushi.quote));
  const qPeer = OUTSIDE.plain(peer.quote).split(', and ')[0];
  hg('one of the three quotations is no longer, word for word, part of its pinned credit; the registry\'s is no longer Davis, Ivanisvili and Tao\'s; or the Qiushi Engine\'s dimensions are not the bounds decided here',
    /^with no code shared with the claimants, by C\. Toledo$/.test(qReg) && /D\. Davis, P\. Ivanisvili, T\. Tao/.test(regQuote.who)
    && qQiu && Number(qQiu[1]) === KW.rows && /Qiushi Engine authors/.test(qiushi.who) && KW.atRequest.length > 0
    && OUTSIDE.plain(peer.quote).startsWith(qPeer) && /^It covers much of the same ground, carefully$/.test(qPeer) && /^maximusrufus, an independent replayer/.test(peer.who));
  hg('an outside re-run on record came back with a verdict other than mine, or the one quoted is not among the replayers',
    externalReruns.length > 0 && externalReruns.every((r) => /same verdict|identical/.test(r.outcome)) && rerunParties.includes(peer.who.replace(/,.*$/, '')));
  /* each quotation links to where it was said: the public source its credit pins (the `url` of its row in
     corpus/recognition.json), read here and never typed; the label says what kind of place the address is */
  hg('a quotation\'s credit no longer gives the public address where it was said, or the address is no longer the registry\'s README, the Qiushi Engine\'s README and the thread on cert-machine',
    [regQuote, qiushi, peer].every((r) => /^https:\/\/github\.com\//.test(String(r.url || '')))
    && /\/teorth\/optimizationproblems\/blob\/[0-9a-f]+\/README\.md$/.test(regQuote.url) && /\/Oxelra-AI\/[^/]+\/blob\/[0-9a-f]+\/README\.md$/.test(qiushi.url)
    && /\/carlostoledo1891\/cert-machine\/issues\/\d+$/.test(peer.url));
  const voices = H.section({ bodyRaw: H.head({ title: 'Other people ran it again.' }) + H.voices([
    { href: regQuote.url, go: 'In the registry’s README', quote: qReg, byRaw: 'The optimization-constants registry of Davis, Ivanisvili and Tao. ' + Cap(numword(asterisksOff)) + ' asterisks came off on my replays.' },
    { href: qiushi.url, go: 'In their README', quote: qQiu[0], byRaw: 'The Qiushi Engine authors, after I asked for their data and checked every pair. All ' + C.esc(sci15(KW.pairs)).replace(/ /g, '\u00a0') + ' of them.' },
    { href: peer.url, go: 'On the thread', quote: qPeer, byRaw: C.esc(peer.who.replace(/,.*$/, '')) + ', an outside replayer. ' + Cap(numword(rerunParties.length)) + ' of them have re-run my work '
      + numword(externalReruns.length) + ' times. Same verdict every time.' }
  ]) });

  /* ---- THE GRAMMAR: the house legend as a plate, in the page's plain words --------------------------------------- */
  hg('the instruments\' manifest counts no instrument', INSTR.count && INSTR.count.all > 0 && INSTR.count.all === INSTR.cards.length);
  const grammar = H.section({ id: 'grammar', bodyRaw: '<div class="hm-gram"><div class="hm-head"><h2>A line can’t lie here.</h2>'
    + '<p>I was a designer first. So every stroke on this site says how much it knows.</p>'
    + '<div class="hm-gram-links">' + H.more({ href: 'grammar/', text: 'See the grammar, drawn live' }) + H.more({ href: 'instruments/', text: 'Play with ' + INSTR.count.all + ' instruments' }) + '</div></div>'
    + H.strokes(SAY) + '</div>' });

  /* ---- THREE WAYS IN ------------------------------------------------------------------------------------------ */
  const doors = H.section({ id: 'doors', bodyRaw: H.head({ title: 'Three ways in.' }) + H.doors([
    { k: 'You have a result', title: 'Get it checked before the world does.', text: 'A proof, a record, a benchmark, a number in a report. Gaps listed first.',
      goRaw: H.btn({ href: 'verify/', raw: 'See Verify', solid: true }) },
    { k: 'You train or grade models', title: 'A grader nobody can game.', text: 'The answer key is a proof. Wrong answers don’t slip through on a tolerance.',
      goRaw: H.btn({ href: 'reports/envs.html', raw: 'See the graders' }) },
    { k: 'You fund open science', title: 'Keep the outside check outside.', text: 'It’s one person and rented machines. Compute, credits or a grant go a long way.',
      goRaw: CT.trigger({ raw: 'Write to me', cls: 'hm-btn' }) }
  ]) });

  /* ---- THE CLOSE: the address, the one description (D1, word for word, once), and the documents ------------------ */
  const contact = H.section({ id: 'contact', cls: 'hm-contact', bodyRaw: '<h2>Got a number you’re not sure about?</h2>'
    + CT.trigger({ raw: C.esc(CT.MAIL), cls: 'hm-mail' })
    + '<p class="hm-d1">' + C.esc(D1.text) + '</p>'
    + '<div class="hm-docs">' + H.more({ href: 'how-it-works/', text: 'How it works' }) + H.more({ href: 'reports/', text: 'All reports' })
    + H.more({ href: GITHUB, text: 'The code · MIT' }) + H.more({ href: 'paper/cert-machine-method.pdf', text: 'The method paper · ' + paperStatus })
    + H.more({ href: CT.PILOT, text: 'Submit a claim in public' }) + '</div>' });

  const body = [hero, register, printed, eth, voices, grammar, doors, contact].join('\n\n');
  hg('the one description is not printed on it exactly once, word for word', body.split(C.esc(D1.text)).length === 2);
  hg('a value on it keeps a reason the page does not print', [...body.matchAll(/<span class="w-val[^>]*title="([^"]*)"/g)].every((m) => Object.values(WHY).includes(m[1].replace(/&quot;/g, '"'))));
  const foot = '<p>Carlos Toledo, independent, Brazil. I work with AI agents; the statements, the checks and what may be claimed are mine. '
    + 'The circles are the entry “' + C.esc(c5.entry) + '” of ThetaEvolve’s published data (' + C.esc(IN.pins.thetaevolve.licence) + '), drawn from its own coordinates. '
    + 'Nothing here is peer-reviewed. <a href="how-it-works/">How it works</a>.</p>';
  hg('the footer no longer credits the circles\' source with its licence', /ThetaEvolve’s published data \(Apache-2\.0\)/.test(foot));
  return { body, foot, css: H.css(), script: H.script() };
};
