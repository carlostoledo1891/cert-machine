/* verify-page.js — /verify/, the product face, cut for a reviewer who gives it ninety seconds (the operator,
   2026-10-31, v3, "Proceed all": the hook in the title, the avalanche from both sides, the OpenAI chart in two groups,
   one rigor block, a direct contact, a top half read in ninety seconds, charts that read on a phone).
   tools/ · cert-machine

   Called once by tools/build-site.js, which hands it the landing's own numbers (tolAdmit, asterisksOff, the reruns,
   the pinned outside quotation) so the product page and the evidence cannot disagree. Every other number is read
   here from its record and printed through playground/warrant.js with its address (W.val, or W.value with the cells
   it is derived from); every figure names its record and the sentence of the check below that would refuse it.
   Every chart is drawn by design/charts.js twice, at a desk's width and at a phone's (.vw-w / .vw-n, swapped by the
   page's own css, returned below; the hero swaps by the template's own rule); the schema is design/components.js
   flow(). Nothing on this page is live: the future the deck speaks of is said in words, never drawn as a feed.

   THE TOP HALF is what a reviewer reads in ninety seconds: the hook, the avalanche (what one AI release published
   against what this machine decided, both from records), the scale, three proof points, the two offers with a direct
   contact. THE REST sits below, compact. The reasons the values' tooltips carry are said once, at the page's end
   (design/reasons.js pageReasons), not after every section.

   Its refusals are its own (vg): they stop the build like the landing's guards, and are not listed on the landing. */
'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function verifyPage(X) {
  const { ROOT, C, W, fmt, fail, GITHUB, numword, tolAdmit, tolPct, asterisksOff, externalReruns, rerunsOwn, qiushi, OUTSIDE, appCards } = X;
  const CH = require(path.join(ROOT, 'design', 'charts.js'));
  const RS = require(path.join(ROOT, 'design', 'reasons.js'));
  const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
  const vg = (plain, ok, msg) => { if (!ok) fail((msg ? msg + ' — ' : '') + '/verify/ refuses to build if ' + plain); };
  const PILOT = GITHUB + '/issues/new?template=pilot.yml';
  const MAIL = 'carlos@carlostoledo.co';   /* published on this page by the operator's word (2026-10-31) */
  const mail = '<a href="mailto:' + MAIL + '"><span class="m">' + MAIL + '</span></a>';
  const HUB = 'https://app.primeintellect.ai/dashboard/environments/carlos-toledo/';
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow10 = (e) => '10' + String(e).split('').map((c) => SUP[c]).join('');
  const SURF = CH.SURFACE;
  /* a chart drawn twice: the desk's drawing and the phone's, swapped at the template's phone width by the css below */
  const dual = (wide, narrow) => '<div class="vw-w">\n' + wide + '\n</div><div class="vw-n">\n' + narrow + '\n</div>';
  const css = '/* /verify/ (tools/verify-page.js): every chart carries a second drawing at a phone\'s scale */\n'
    + '.vw-n{display:none}\n@media (max-width:680px){.vw-w{display:none}.vw-n{display:block}}\n'
    /* the standing legend under the tolerance chart sat flush on the paragraph after it */
    + '.col > .w-legend{margin-bottom:var(--s-4)}';
  /* bars with a legend: the legend's lines are counted before the drawing is sized, so a wrapped key is never cut */
  const barsH = (rows, rowH, keys, w, padL, padR) => rows * rowH + 61 + 19 * Math.max(1, CH.legendLines(keys, w - padL - padR));

  /* ---- the records ------------------------------------------------------------------------------------------- */
  const REG = 'certs/claims-ledger.json', HM = 'certs/horizonmath-ledger.json', KWR = 'certs/kissing-wave.json',
    XXR = 'certs/xx-ledger.json', OK_ = 'certs/openai-math-kernel.json', OREL = 'corpus/openai-math/release.json',
    OST = 'certs/openai-math-statements.json', ENV = 'certs/envs-record.json', MUT = 'certs/selfaudit-mutations.json';
  const L = J(REG), Kw = J(KWR), Xx = J(XXR), Ok = J(OK_), Orel = J(OREL), S = J(OST), E = J(ENV), M = J(MUT).all;

  /* ---- THE HERO: the avalanche from both sides ----------------------------------------------------------------
     Two cumulative counts on one calendar, both exact and both read from records. Above: the manuscripts of ONE AI
     release (OpenAI's mathematics collection, pinned), by the date each manuscript's folder carries. Below: the
     published claims this machine has decided, by the day each was recorded in the register. No "AI output per day"
     is drawn: only what a record counts. The × sits where the one refuted claim whose own decision record exhibits the
     object that breaks it was recorded (WARRANT rule 5): HorizonMath's R(k,k) certificate, read for its pairs outside
     R. erdos852's refutation is a box clearing a box and carries no ×. */
  const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON = MONTH.map((m) => m.slice(0, 3));
  const pad2 = (n) => String(n).padStart(2, '0');
  const msDate = (s) => { const m = /^([A-Z][a-z]+)-(\d{1,2})-(\d{4})$/.exec(String(s)); return m && MONTH.includes(m[1]) ? m[3] + '-' + pad2(MONTH.indexOf(m[1]) + 1) + '-' + pad2(m[2]) : null; };
  /* the record reads "Month-D-YYYY" off the folder's name; one folder is named in ISO form ("…-2026-09-24"), which the
     record leaves null, and its date is read off the same folder name here */
  const msDates = Orel.manuscripts.map((m) => msDate(m.date) || ((/-(\d{4}-\d{2}-\d{2})$/.exec(m.dir) || [])[1] || null));
  const msFromDir = Orel.manuscripts.filter((m) => !msDate(m.date)).length;   /* said in the caption, in words */
  const oDays = [...new Set(msDates)].sort();
  const oCum = oDays.map((d) => msDates.filter((x) => x <= d).length);
  const oOn = oDays.map((d) => msDates.filter((x) => x === d).length);
  const oPeak = oOn.indexOf(Math.max(...oOn));

  const decided = L.rows.filter((r) => r.verdict !== 'QUEUED');
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
  const days = [...new Set(decided.map((r) => r.recordedOn))].sort();
  const sAll = days.map((d) => decided.filter((r) => r.recordedOn <= d).length);
  const refuted = decided.filter((r) => r.verdict === 'REFUTED');
  const hmRow = refuted.find((r) => r.decidedFrom === HM);
  const hmRec = hmRow ? J(HM).rows.find((y) => y.claim === hmRow.claim && y.verdict === 'REFUTED') : null;
  const hmOut = hmRec && Array.isArray(hmRec.points) ? hmRec.points.filter((p) => p.outsideR).length : 0;
  const HERO_STOP = 'its release curve does not end at the manuscripts OpenAI\'s release states, each one dated, its register curve does not end at the register\'s decided count, or the refuted claim it marks no longer exhibits, in its own record, pairs outside R';
  vg(HERO_STOP, msDates.every(Boolean) && msDates.length === Orel.stated.manuscripts && oCum[oCum.length - 1] === Orel.stated.manuscripts
    && Orel.counted.manuscriptLinks === Orel.stated.manuscripts
    && decided.every((r) => isDate(r.recordedOn)) && sAll[sAll.length - 1] === L.decided
    && hmRec && hmOut > 0 && refuted.every((r) => r === hmRow || r.decidedFrom === 'certs/erdos852-certificate.json'));
  vg('the release no longer marks its own formal review unchecked', Orel.stated.review === 'unchecked');
  const t0 = Date.parse([days[0], oDays[0]].sort()[0] + 'T00:00:00Z');
  const dn = (s) => Math.round((Date.parse(s + 'T00:00:00Z') - t0) / 864e5);
  const lastDay = Math.max(dn(days[days.length - 1]), dn(oDays[oDays.length - 1]));
  const wDay = dn(hmRow.recordedOn), wIdx = days.indexOf(hmRow.recordedOn);
  const tickDays = (mid) => {
    const out = [];
    for (let t = t0; t <= t0 + (lastDay + 1) * 864e5; t += 864e5) {
      const d = new Date(t);
      if (d.getUTCDate() === 1 || (mid && d.getUTCDate() === 15)) out.push({ v: Math.round((t - t0) / 864e5), t: MON[d.getUTCMonth()] + ' ' + d.getUTCDate() });
    }
    return out;
  };
  const HKEYS = (short) => [
    { token: 'var(--c-3)', kind: 'line', t: short ? 'OpenAI’s release: manuscripts' : 'one AI release (OpenAI’s mathematics): manuscripts, by the date each carries' },
    { token: 'var(--c-1)', kind: 'line', t: short ? 'claims decided here' : 'published claims decided here, by the day each was recorded' },
  ];
  function heroSvg({ w, h, padL, padR, mid, short, alt }) {
    const nLeg = CH.legendLines(HKEYS(short), w - padL - padR);
    const yMax = Math.ceil((Orel.stated.manuscripts + 20) / 250) * 250;
    const f = CH.frame({ w, h, x0: -1.5, x1: lastDay + 1.5, y0: 0, y1: yMax, padL, padR, padT: 30, padB: 32 + nLeg * 19 });
    const out = [CH.open({ w, h, alt })];
    out.push(CH.axes(f, { xTicks: tickDays(mid), yTicks: [0, 250, 500, 750, 1000].filter((v) => v <= yMax).map((v) => ({ v, t: String(v) })) }));
    out.push(CH.txt(f.L - (short ? 30 : 9), f.T - 14, short ? 'published, and decided, to date' : 'what one AI release published, and what this machine decided, cumulative', 't-note', 'start'));
    const step = (ds, s) => ds.map((d, i) => (i ? 'L' + f.px(dn(d)).toFixed(1) + ' ' + f.py(s[i - 1]).toFixed(1) + ' ' : 'M' + f.px(dn(d)).toFixed(1) + ' ' + f.py(0).toFixed(1) + ' ')
      + 'L' + f.px(dn(d)).toFixed(1) + ' ' + f.py(s[i]).toFixed(1)).join(' ');
    const oEnd = f.px(dn(oDays[oDays.length - 1])), rEnd = f.px(dn(days[days.length - 1]));
    /* the release as a mass, the register as a line */
    out.push('    <path d="' + step(oDays, oCum) + ' L' + oEnd.toFixed(1) + ' ' + f.py(0).toFixed(1) + ' Z" fill="var(--c-3)" opacity="0.14"/>');
    out.push('    <path d="' + step(days, sAll) + ' L' + rEnd.toFixed(1) + ' ' + f.py(0).toFixed(1) + ' Z" fill="var(--c-1)" opacity="0.10"/>');
    for (const [ds, s, tok] of [[oDays, oCum, 'var(--c-3)'], [days, sAll, 'var(--c-1)']]) {
      out.push('    <path d="' + step(ds, s) + '" fill="none" stroke="' + tok + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>');
      ds.forEach((d, i) => out.push('    <circle cx="' + f.px(dn(d)).toFixed(1) + '" cy="' + f.py(s[i]).toFixed(1) + '" r="3" fill="' + tok + '" stroke="' + SURF + '" stroke-width="1.5"/>'));
    }
    /* the end of each curve, named with its count */
    out.push(CH.txt(oEnd + 10, f.py(oCum[oCum.length - 1]) + 4, fmt(oCum[oCum.length - 1]) + (short ? '' : ' manuscripts'), 't-lab', 'start'));
    out.push(CH.txt(rEnd + (short ? 10 : 10), f.py(sAll[sAll.length - 1]) + 4, fmt(sAll[sAll.length - 1]) + (short ? '' : ' decided'), 't-lab', 'start'));
    /* hover: one target per day on each curve */
    oDays.forEach((d, i) => out.push('    <circle ' + CH.hit('cx="' + f.px(dn(d)).toFixed(1) + '" cy="' + f.py(oCum[i]).toFixed(1) + '" r="10" fill="transparent"',
      d + ' · ' + fmt(oOn[i]) + ' manuscript' + (oOn[i] === 1 ? '' : 's') + ' carry this date', fmt(oCum[i]) + ' of the release’s manuscripts dated by then') + '/>'));
    days.forEach((d, i) => out.push('    <circle ' + CH.hit('cx="' + f.px(dn(d)).toFixed(1) + '" cy="' + f.py(sAll[i]).toFixed(1) + '" r="10" fill="transparent"',
      d + ' · ' + fmt(sAll[i] - (i ? sAll[i - 1] : 0)) + ' recorded that day', fmt(sAll[i]) + ' published claims decided to date') + '/>'));
    /* the witness: on the register's curve, on the day the refuted claim was recorded. Its words sit on a leader in the
       band the two curves leave empty: right of the × at a desk (the release is above, the register below), above the
       release's plateau on a phone, where the right-hand band is too narrow for the words */
    const wx = f.px(wDay), wy = f.py(sAll[wIdx]);
    const lab = short ? ['R(k,k) bound, refuted:', fmt(hmOut) + ' pairs outside R'] : ['HorizonMath’s R(k,k) bound, refuted:', fmt(hmOut) + ' of ' + fmt(hmRec.points.length) + ' certificate pairs outside R'];
    const ly = short ? f.py(yMax * 0.86) : f.py(Orel.stated.manuscripts * 0.42);
    out.push('    <line x1="' + wx.toFixed(1) + '" y1="' + (wy - 9).toFixed(1) + '" x2="' + wx.toFixed(1) + '" y2="' + (ly + 8).toFixed(1) + '" stroke="' + CH.CTX + '" stroke-width="1"/>');
    lab.forEach((s, k) => out.push(CH.txt(short ? wx - 6 : wx + 8, ly + k * 17, s, k ? 't-note' : 't-lab', short ? 'end' : 'start')));
    out.push('    ' + W.witnessMark(wx, wy, { size: short ? 6 : 7, width: 3, casing: SURF }));
    out.push(CH.legend(HKEYS(short), f.L, f.h - 8, undefined, f.pw));
    out.push(CH.close);
    return out.join('\n');
  }
  const HERO_ALT = 'Two step curves on one calendar. One AI release, OpenAI’s mathematics collection, holds ' + numword(Orel.stated.manuscripts)
    + ' manuscripts dated from ' + oDays[0] + ' to ' + oDays[oDays.length - 1] + ', ' + numword(oOn[oPeak]) + ' of them on ' + oDays[oPeak]
    + '. Over the same weeks and before them, this machine decided ' + numword(L.decided) + ' published claims, recorded day by day from ' + days[0] + ' to ' + days[days.length - 1]
    + '. A red cross on the lower curve on ' + hmRow.recordedOn + ' marks HorizonMath’s refuted R(k,k) bound, whose own certificate has ' + numword(hmOut) + ' pairs outside R.';
  const hero = C.figure({
    hero: true, record: [OREL, REG, HM], stop: HERO_STOP,
    svgRaw: heroSvg({ w: 1000, h: 420, padL: 52, padR: 150, mid: true, short: false, alt: HERO_ALT }),
    svgNarrowRaw: heroSvg({ w: 330, h: 400, padL: 38, padR: 40, mid: false, short: true, alt: HERO_ALT }),
    captionRaw: 'One AI release, OpenAI’s mathematics collection, holds '
      + W.val({ rec: { path: OREL, ptr: '/stated/manuscripts' }, standing: W.DECIDED, fmt: 'int', why: 'the manuscripts the release links, counted in a clone at the pinned commit' })
      + ' machine-generated manuscripts, '
      + W.value(fmt(oOn[oPeak]), W.DECIDED, { derived: OREL + '#/manuscripts', title: 'decided — the manuscripts whose folder carries that one date, counted' })
      + ' of them dated ' + C.esc(oDays[oPeak]) + ', and marks its own formal review “' + C.esc(Orel.stated.review) + '”. Checking runs at another pace: since ' + C.esc(days[0]) + ' this machine has decided '
      + W.val({ rec: { path: REG, ptr: '/decided' }, standing: W.DECIDED, fmt: 'int', why: 'the register’s count of decided rows' })
      + ' published claims, one at a time, from DeepMind, OpenAI, agent platforms and AI-assisted manuscripts. Each step is an exact count'
      + (msFromDir === 1 ? '; the one manuscript the release record leaves undated takes its date from its folder’s name. '
        : msFromDir ? '; the ' + numword(msFromDir) + ' manuscripts the release record leaves undated take their dates from their folders’ names. ' : '. ')
      + W.witness('a counterexample exhibited by the claim’s own record') + ' is a counterexample on the claim’s own record: '
      + W.value(fmt(hmOut), W.DECIDED, { derived: HM + '#/rows[id=' + hmRec.id + ']/points', title: 'decided — the pairs its own certificate uses that the record places outside R' })
      + ' pairs of the certificate behind a published Ramsey bound fall outside the region the bound needs. Hover a day for its counts.'
  });

  /* ---- the scale: four things already decided, each read from its record --------------------------------------- */
  const kwRows = Kw.rows.filter((r) => r.engine && r.engine.pairs);
  const kwPairs = kwRows.reduce((a, r) => a + r.engine.pairs, 0), kwSec = kwRows.reduce((a, r) => a + r.engine.seconds, 0);
  vg('the kissing pairs it counts were not every pair of each configuration, decided with no violation, or a configuration it counts has no recorded time',
    kwRows.length > 0 && kwRows.every((r) => r.engine.violations === 0 && r.engine.pairs === r.engine.n * (r.engine.n - 1) / 2 && Number.isFinite(r.engine.seconds)));
  const e15 = Math.floor(Math.log10(kwPairs));
  const kwSci = (Math.floor(kwPairs / 10 ** (e15 - 2)) / 100).toFixed(2) + ' × ' + pow10(e15);   /* cut toward zero: "more than" */
  const kwH = (Math.floor(kwSec / 360) / 10).toFixed(1);
  const xxBig = Xx.xx64.slice().sort((a, b) => b.digits[0] - a.digits[0])[0];
  vg('the largest x^x = 64 comparison it prints was not decided, or the claimbox receiver disagrees with it',
    xxBig && xxBig.word === xxBig.expect && xxBig.claimbox && xxBig.claimbox.word === xxBig.word && Xx.counts.agreeWithClaimbox === Xx.counts.claims);
  vg('the second kernel has not decided every OpenAI challenge in the release', Ok.counts.decided === Ok.counts.of && Ok.counts.of === Orel.counted.challenges);
  const scale = C.stats([
    { k: 'vector pairs of published kissing configurations, each decided exactly', vRaw: 'over ' + W.value(kwSci, W.DECIDED, { derived: KWR + '#/rows', title: 'decided — every pair of every configuration, summed and cut toward zero' }),
      nRaw: 'every pair of ' + fmt(kwRows.length) + ' configurations from three claimants, in exact arithmetic, in '
        + W.value(kwH, W.COMPUTED, { derived: KWR + '#/rows', title: 'computed — the wall-clock seconds the engine recorded per configuration, summed, on one 8-core machine' })
        + ' machine-hours · <a href="../reports/kissing.html">the kissing wave</a>' },
    { k: 'digits in the largest integers compared exactly', vRaw: W.val({ rec: { path: XXR, ptr: '/xx64[id=' + xxBig.id + ']/digits/0' }, standing: W.DECIDED, fmt: 'int', why: 'the digit count of each side of the comparison' }),
      nRaw: 'x^x = 64, the root an AI model proposed, trapped between two fractions; each side is one exact comparison of whole numbers · <a href="../reports/xx.html">the page</a>' },
    { k: 'OpenAI formal proofs replayed on a second, independent kernel', vRaw: W.val({ rec: { path: OK_, ptr: '/counts/decided' }, standing: W.DECIDED, fmt: 'int' }),
      nRaw: W.val({ rec: { path: OK_, ptr: '/counts/words/CERTIFIED' }, standing: W.DECIDED, fmt: 'int' }) + ' certified, '
        + W.val({ rec: { path: OK_, ptr: '/counts/words/REFUSED' }, standing: W.DECIDED, fmt: 'int' }) + ' refused with the reason: every Lean challenge in the release above · <a href="../reports/openai-math.html">the audit</a>' },
    { k: 'provably wrong answers minted to attack graders', vRaw: W.val({ rec: { path: ENV, ptr: '/provablyWrong' }, standing: W.DECIDED, fmt: 'int' }),
      nRaw: 'each one outside a certified enclosure and inside a grader’s tolerance, minted from certificates already on disk · <a href="../reports/envs.html">the measurement</a>' },
  ]);

  /* ---- PROOF 1: the self-audit, a float check against the decider on the same planted mutants -------------------- */
  const MUT_STOP = 'the self-audit record counts a false certification or a false refutation, or a float check it draws admits no witnessed-false mutant';
  const taus = ['1e-6', '1e-9', '1e-12'];
  vg(MUT_STOP, M.falseCertifications === 0 && M.falseRefutations === 0 && M.mutants > 0 && taus.every((t) => M.float[t] && M.float[t].witnessedFalseAccepted > 0));
  const tolWord = (t) => pow10(Math.round(Math.log10(t)));
  const mutRows = (short) => taus.map((t) => ({ k: (short ? 'float, ' : 'float check at ') + tolWord(Number(t)), v: M.float[t].witnessedFalseAccepted, token: 'var(--c-3)',
    lab: fmt(M.float[t].witnessedFalseAccepted) + ' of ' + fmt(M.float[t].witnessedFalse) + (short ? '' : ' accepted'), hover: fmt(M.float[t].witnessedFalseAccepted) + ' of ' + fmt(M.float[t].witnessedFalse) + ' witnessed-false mutants accepted' }))
    .concat([{ k: 'this decider', v: M.falseCertifications, token: 'var(--c-1)', lab: fmt(M.falseCertifications) + ' of ' + fmt(M.byTruth.FALSE) + (short ? '' : ' certified'),
      hover: fmt(M.falseCertifications) + ' of ' + fmt(M.byTruth.FALSE) + ' false mutants certified; ' + fmt(M.falseRefutations) + ' true ones refuted' }]);
  const MUT_ALT = 'Bars: of the planted false values each witnessed by an independent script, a double-precision check accepted ' + taus.map((t) => fmt(M.float[t].witnessedFalseAccepted) + ' at tolerance ' + t).join(', ') + '; the exact decider certified none of the ' + fmt(M.byTruth.FALSE) + ' false mutants.';
  const mutKeys = (short) => [{ token: 'var(--c-3)', t: short ? 'a float check at a tolerance' : 'a double-precision check at a tolerance' }, { token: 'var(--c-1)', t: 'the exact decider' }];
  const mutTicks = [0, 100, 200, 300].filter((v) => v <= M.float['1e-6'].witnessedFalse).map((v) => ({ v, t: String(v) }));
  const mutSvg = (w, padL, padR, short) => CH.bars({ w, h: barsH(4, 34, mutKeys(short), w, padL, padR), rowH: 34, max: M.float['1e-6'].witnessedFalse, padL, padR, rows: mutRows(short),
    xTicks: short ? mutTicks.filter((t) => t.v !== 100) : mutTicks, xLabel: short ? 'planted false values accepted' : 'planted false values accepted', keys: mutKeys(short), alt: MUT_ALT });
  const mutFig = C.figure({ svgRaw: dual(mutSvg(860, 190, 170, false), mutSvg(320, 104, 30, true)), record: MUT, stop: MUT_STOP,
    captionRaw: 'The verifier is attacked before it is trusted: '
      + W.val({ rec: { path: MUT, ptr: '/all/mutants' }, standing: W.DECIDED, fmt: 'int' }) + ' mutants of '
      + W.val({ rec: { path: MUT, ptr: '/all/rows' }, standing: W.DECIDED, fmt: 'int' }) + ' register rows, pre-registered, each false one witnessed by a script that shares no code with the decider. '
      + 'The decider certified none of the false ones and refuted none of the true ones; the same mutants through a floating-point check pass in the numbers above.' });

  /* ---- PROOF 2: what reading the statement finds (OpenAI's formalized families), in two groups ------------------
     The six words are readings, not certificates. The page draws two groups in plain words; the six-way split is one
     click down. The groups must partition the families the record read, or the build stops. */
  const SW = ['MATCHES', 'NARROWER — DECLARED', 'NARROWER — UNLINKED', 'SUPPORT-ONLY', 'NARROWER — UNDECLARED', 'DIFFERENT'];
  const SHORT = ['NARROWER — UNDECLARED', 'DIFFERENT'];
  const HOLD = SW.filter((w) => !SHORT.includes(w));
  const sw = S.counts.words;
  const sumOf = (ws) => ws.reduce((a, w) => a + (sw[w] || 0), 0);
  const sShort = sumOf(SHORT), sHold = sumOf(HOLD);
  const byRow = (ws) => S.rows.filter((r) => ws.includes(r.word)).length;
  const OST_STOP = 'its two groups do not sum to the families the statements record read, a row\'s reading falls in neither group, the rows disagree with the record\'s counts, or no family states less than its headline with nothing saying so';
  vg(OST_STOP, Object.keys(sw).every((w) => SW.includes(w)) && sHold + sShort === S.counts.families && S.rows.length === S.counts.families
    && byRow(HOLD) === sHold && byRow(SHORT) === sShort && S.rows.every((r) => SW.includes(r.word)) && sShort > 0);
  const READ = 'computed — a reading by AI agents, second-read where the first found a gap: a claim about the statement, not a certificate';
  const GKEYS = [{ token: 'var(--c-3)', t: 'says what its headline claims, or the release says what it covers' }, { token: 'var(--c-1)', t: 'claims more than it proves, and nothing says so' }];
  const GKEYS_N = [{ token: 'var(--c-3)', t: 'as claimed, or declared' }, { token: 'var(--c-1)', t: 'claims more, unsaid' }];
  const OST_ALT = 'Bars: OpenAI’s ' + S.counts.families + ' formalized families, read statement against headline, in two groups: ' + sHold + ' say what their headline claims or the release says what they cover, and '
    + sShort + ' claim more than they prove with nothing saying so. The six readings: ' + SW.map((w) => (sw[w] || 0) + ' ' + w).join(', ') + '.';
  const gRows = (short) => [
    { k: short ? 'as claimed' : 'as claimed, or declared', v: sHold, token: 'var(--c-3)', lab: fmt(sHold), hover: HOLD.map((w) => fmt(sw[w] || 0) + ' ' + w).join(' · ') },
    { k: short ? 'claims more' : 'claims more, unsaid', v: sShort, token: 'var(--c-1)', lab: fmt(sShort), hover: SHORT.map((w) => fmt(sw[w] || 0) + ' ' + w).join(' · ') }];
  const gTicks = [0, 100, 200].map((v) => ({ v, t: String(v) }));
  const ostSvg = (w, padL, padR, short) => CH.bars({ w, h: barsH(2, 40, short ? GKEYS_N : GKEYS, w, padL, padR), rowH: 40, max: S.counts.families, padL, padR, rows: gRows(short),
    xTicks: gTicks, xLabel: 'formalized families', keys: short ? GKEYS_N : GKEYS, alt: OST_ALT });
  const ostFig = C.figure({ svgRaw: dual(ostSvg(860, 200, 70, false), ostSvg(320, 100, 20, true)), record: OST, stop: OST_STOP,
    captionRaw: 'A proof checker verifies the statement it is handed; nobody checked the statement against the claim. Read clause by clause, '
      + W.value(fmt(sShort) + ' of ' + fmt(S.counts.families), W.COMPUTED, { derived: [OST + '#/counts/words', OST + '#/rows'], title: READ })
      + ' of OpenAI’s formalized families prove a different or weaker theorem than their headline, with nothing in the release saying so, while the proofs themselves pass a second kernel. Each group is a reading, kept apart from what was decided.' });
  /* the six readings, one click down */
  const sixRows = (short) => SW.map((w) => ({ k: w, v: sw[w] || 0, token: SHORT.includes(w) ? 'var(--c-1)' : 'var(--c-3)', lab: fmt(sw[w] || 0) }));
  const sixKeys = (short) => short ? GKEYS_N : GKEYS;
  const SIX_STOP = 'its bars do not sum to the families the statements record read';
  vg(SIX_STOP, sumOf(SW) === S.counts.families);
  const sixSvg = (w, padL, padR, short) => CH.bars({ w, h: barsH(SW.length, 30, sixKeys(short), w, padL, padR), rowH: 30, max: Math.max(...SW.map((x) => sw[x] || 0)), padL, padR,
    rows: sixRows(short), xTicks: (short ? [0, 100] : [0, 50, 100]).map((v) => ({ v, t: String(v) })), xLabel: 'formalized families', keys: sixKeys(short),
    alt: 'Bars: OpenAI’s ' + S.counts.families + ' formalized families by how their Lean statements read against the headline: ' + SW.map((w) => (sw[w] || 0) + ' ' + w).join(', ') + '.' });
  const sixFig = C.figure({ wide: false, svgRaw: dual(sixSvg(860, 200, 70, false), sixSvg(320, 172, 36, true)), record: OST, stop: SIX_STOP,
    captionRaw: 'The six readings behind the two groups. MATCHES: the statement says what the headline says. NARROWER — DECLARED: weaker, and the release says so. NARROWER — UNLINKED: weaker, and a scope note says so without linking it. SUPPORT-ONLY: a lemma, not the result. NARROWER — UNDECLARED and DIFFERENT: weaker or another theorem, and nothing says so. Readings, not certificates.' });
  const sixFold = '<div class="wide"><details class="more"><summary>The six readings, one by one</summary>' + sixFig + '</details></div>';

  /* ---- PROOF 3: what came back from outside ------------------------------------------------------------------- */
  const back = C.stats([
    { k: 'asterisks removed from a registry on these replays', v: String(asterisksOff),
      nRaw: 'the optimization-constants registry (Davis, Ivanisvili, Tao), which cites the replays · <a href="../reports/optimization-constants.html">the replays</a>' },
    { k: 'outside re-derivations, no disagreement', v: String(externalReruns.length),
      nRaw: rerunsOwn + ' of them by people with no connection to this work, with their own code · <a href="../reports/rerun.html">the rerun kit</a>' },
  ]);

  /* ---- BELOW: the schema --------------------------------------------------------------------------------------- */
  const nodes = [
    { id: 'claim', x: 20, y: 20, w: 260, h: 64, role: 'dep', p: '1 · The claim.', k: '1 · THE CLAIM', v: 'a published claim, its bytes',
      t: 'the claim', d: 'What a model, a paper or a leaderboard said, with the files behind it: a configuration, a table, a proof, an answer. Each file is pinned by its SHA-256 before anything is read, so the verdict names exactly what it decided.' },
    { id: 'stated', x: 320, y: 20, w: 260, h: 64, role: 'held', p: '2 · Stated.', k: '2 · STATED', v: 'claimbox: words → an object',
      t: 'stated', d: 'claimbox turns the claim’s words into an object a machine can check, prints it back in plain words, and refuses what does not come down to finitely many exact facts, naming why. A statement is read against the claim before anything is decided, and the reading is kept apart from the decision.' },
    { id: 'decided', x: 320, y: 160, w: 260, h: 64, role: 'sig', p: '3 · Decided.', k: '3 · DECIDED', v: 'exact; no code of yours runs',
      t: 'decided', d: 'Exact rational arithmetic, interval enclosures rounded outward, or a second proof kernel, in code written apart from the claimant’s. No floating-point number takes part in a decision, and the decider is attacked with planted forgeries before it is trusted.' },
    { id: 'cert', x: 20, y: 160, w: 260, h: 64, role: 'sig', p: '4 · The certificate.', k: '4 · THE CERTIFICATE', v: 'CERTIFIED · REFUTED · REFUSED',
      t: 'the certificate', d: 'One of three words. CERTIFIED, with a falsifier that would break it. REFUTED, with the object that breaks the claim. REFUSED, with the reason and what would make it decidable. Each re-runs with one command, without this engine.' },
    { id: 'audit', x: 20, y: 306, w: 260, h: 64, role: 'warn', p: 'An audit.', k: 'AN AUDIT · FOR LABS', v: 'the report, gaps listed first',
      t: 'an audit', d: 'For labs, AI-for-science companies and registries: a published claim goes in at step 1, and a report comes out listing every gap first, then every finite part decided, every formal statement read against the claim.' },
    { id: 'grader', x: 320, y: 306, w: 260, h: 64, role: 'warn', p: 'A grader.', k: 'A GRADER · FOR RL TEAMS', v: 'the reward is the certificate',
      t: 'a grader', d: 'For RL and evaluation teams: a task family is stated once at step 2, then every model answer is decided at step 3 and the certificate is the reward. It must refuse planted wrong answers before it grades anything, so a policy cannot learn to fool it.' },
  ];
  const edges = [
    { d: 'M282 52 L318 52' },
    { d: 'M450 86 L450 158', lab: 'nothing of yours is run', lx: 440, ly: 126, anchor: 'end' },
    { d: 'M318 192 L282 192' },
    { d: 'M150 226 L150 304', lab: 'per claim', lx: 140, ly: 270, anchor: 'end' },
    { d: 'M190 226 C190 268 450 262 450 304', lab: 'per answer', lx: 462, ly: 270, anchor: 'start' },
  ];
  /* a phone does not get the drawing at half scale (the 600-wide schematic read at ~0.5x on a 390 px screen): it gets
     the same steps as a list, each with what the drawing's readout says on click, shown inline. Not a second flow():
     the schematic is the page's one interactive figure and its ids and script are bound once. `p` is the step's name
     in that list; the drawing ignores it. */
  const SCHEMA_CAP = 'The product in four steps. An audit is the whole path for one published claim; a grader states a task family once and runs steps 3 and 4 on every answer a model gives.';
  const schemaPhone = '<div class="col">' + C.p(SCHEMA_CAP) + C.plainList(nodes.map((n) => ({ b: n.p, text: n.d }))) + '</div>';
  const schemaFlow = C.flow({ w: 600, h: 392, nodes, edges, source: 'built: a diagram of the four steps and the two offers this page describes; it carries no number',
    alt: 'A schema of Verify in four steps: a published claim and its bytes are stated as an object by claimbox, decided exactly by code that shares nothing with the claimant, and returned as a certificate (certified, refuted or refused). The certificate feeds two offers: an audit report per claim, for labs, and a reward per answer, for RL teams.',
    readout: { k: 'a claim, decided', d: 'Select a step for what it does and why it can be trusted.' },
    caption: SCHEMA_CAP });
  const schema = dual(schemaFlow, schemaPhone);

  /* ---- BELOW: graders, what a tolerance admits (the envs record, drawn as /reports/envs.html draws it) ---------- */
  const encl = E.graders.find((g) => /enclosure/.test(g.name)), absT = E.graders.find((g) => /absolute/.test(g.name));
  const ENV_STOP = 'the certificate grader false-accepts or false-rejects a submission in the record, or the absolute-tolerance grader false-accepts fewer than half of the provably-wrong ones';
  vg(ENV_STOP, encl && encl.falseAccept === 0 && encl.falseReject === 0 && absT && absT.falseAccept >= 0.5);
  const tols = E.tolerancesProbed.slice().sort((a, b) => a - b);
  const ser = [['absolute tolerance', absT, 'var(--c-1)'], ['relative tolerance', E.graders.find((g) => /relative/.test(g.name)), 'var(--c-2)'],
    ['exact match of a decimal', E.graders.find((g) => /exact/.test(g.name)), 'var(--c-3)']].filter((x) => x[1]);
  const pctS = (x) => (100 * x).toFixed(1) + '%';
  const ENV_ALT = 'The share of provably wrong answers each grader admits, against its tolerance on a log axis, measured at ' + tols.length + ' tolerances and joined by dotted lines. The tolerance graders admit fewer as the tolerance tightens but never none; the certificate grader is a solid line at zero, because it reads no tolerance.';
  const envSvg = (short) => CH.scatter({
    w: short ? 320 : 760, h: short ? 320 : 360, logX: true, x0: tols[0] * 0.5, x1: tols[tols.length - 1] * 2, y0: 0, y1: 100, padL: short ? 34 : 54, padR: short ? 12 : 22,
    xLabel: short ? 'tolerance (log scale)' : 'the grader’s tolerance (log scale)', yLabel: short ? undefined : 'wrong answers admitted (%)', yTitle: short ? 'wrong answers admitted (%)' : undefined, padT: short ? 30 : undefined,
    yTicks: [0, 25, 50, 75, 100].map((v) => ({ v, t: String(v) })),
    xTicks: (short ? [1e-15, 1e-9, 1e-3] : [1e-15, 1e-12, 1e-9, 1e-6, 1e-3]).map((v) => ({ v, t: tolWord(v) })),
    alt: ENV_ALT,
    /* the certificate grader's line is named in the legend at both widths: a label on the line itself sat on the dots at 0 */
    hlines: [{ y: 0, token: 'var(--ink)' }],
    curves: ser.map(([, g]) => ({ pts: tols.map((t) => [t, 100 * (g.falseAcceptByTolerance[String(t)] || 0)]), standing: W.CHOSEN })),
    pts: [].concat(...ser.map(([n, g, tok]) => tols.map((t) => ({ x: t, y: 100 * (g.falseAcceptByTolerance[String(t)] || 0), token: tok,
      k: n + ' · tolerance ' + tolWord(t), v: pctS(g.falseAcceptByTolerance[String(t)] || 0) + ' of the provably wrong answers minted at that tolerance admitted' })))),
    keys: ser.map(([n, , tok]) => ({ token: tok, t: short ? n.replace('exact match of a decimal', 'exact decimal match') : n }))
      .concat([{ token: 'var(--ink)', kind: 'line', t: short ? 'certificate grader: always 0' : 'certificate grader: 0 at every tolerance' }])
  });
  const envFig = C.figure({ svgRaw: dual(envSvg(false), envSvg(true)), record: ENV, stop: ENV_STOP,
    captionRaw: 'Answers minted wrong from certificates, each outside a proved enclosure and inside the grader’s tolerance. Tightening the tolerance by '
      + numword(Math.round(Math.log10(tols[tols.length - 1] / tols[0]))) + ' orders of magnitude does not close the hole; only a grader that reads the certificate admits none, and it rejected nothing right. Each dot is an exact count at one tolerance; the dotted joins are a picture between them.' });

  /* ---- BELOW: the register's verdict mix ----------------------------------------------------------------------- */
  const VW = ['CERTIFIED', 'PARTIAL', 'REPAIRED', 'MIXED', 'REFUTED', 'NEEDS DATA'];
  const REG_STOP = 'its bars do not number the register\'s decided claims verdict by verdict';
  vg(REG_STOP, VW.reduce((a, w) => a + (L.byVerdict[w] || 0), 0) === L.decided && Object.keys(L.byVerdict).every((w) => VW.includes(w) || w === 'QUEUED'));
  const VDESC = { CERTIFIED: 'held, with its falsifier', PARTIAL: 'a fragment certified, the core refused', REPAIRED: 'refuted as printed; the object beside it certified',
    MIXED: 'one record holds both', REFUTED: 'the object that breaks it, printed', 'NEEDS DATA': 'the bytes that would decide it, named' };
  const REG_ALT = 'Bars: the register’s ' + L.decided + ' decided claims by verdict: ' + VW.map((w) => (L.byVerdict[w] || 0) + ' ' + w).join(', ') + '.';
  const regSvg = (short) => CH.bars({ w: short ? 320 : 860, rowH: 30, max: L.byVerdict.CERTIFIED, padL: short ? 100 : 130, padR: short ? 44 : 400,
    rows: VW.map((w) => ({ k: w, v: L.byVerdict[w] || 0, token: w === 'CERTIFIED' ? 'var(--c-2)' : w === 'REFUTED' ? 'var(--c-1)' : 'var(--c-3)',
      lab: fmt(L.byVerdict[w] || 0) + (short ? '' : ' · ' + VDESC[w]), hover: fmt(L.byVerdict[w] || 0) + ' · ' + VDESC[w] })),
    xTicks: (short ? [0, 100] : [0, 50, 100]).map((v) => ({ v, t: String(v) })), xLabel: 'published claims', alt: REG_ALT });
  const regFig = C.figure({ svgRaw: dual(regSvg(false), regSvg(true)), record: REG, stop: REG_STOP,
    captionRaw: 'Most published claims hold. The value is in the ones that do not, and in saying exactly which part held: every verdict above names its record, and none is a summary.' });

  /* ---- BELOW: built on the same engine --------------------------------------------------------------------------- */
  /* the apps by name, once each (SkyAudit's two cities are one app); the frozen Petrobras submissions are not named */
  const appNames = [...new Set(appCards.map((a) => a.title.replace(/\s*[·—:-].*$/, '').split(/\s+/)[0]).filter((t) => !/Contraprova|Decidível|Abatimento|Registro/i.test(t)))];
  vg('the apps hub it points at lists no app', appNames.length > 0);
  const products = C.cards([
    { href: HUB + 'lattice-claims', k: 'RL environment · Prime Intellect hub', title: 'lattice-claims', desc: 'A lattice claim is decided exactly, or the grader says what it would need.' },
    { href: HUB + 'blind-spot', k: 'RL environment · Prime Intellect hub', title: 'blind-spot', desc: 'An RTL mutation task: a kill is simulated, never taken from an answer key.' },
    { href: HUB + 'break-the-grader', k: 'RL environment · Prime Intellect hub', title: 'break-the-grader', desc: 'The reward is breaking a grader, and “I could not break it” is scored apart.' },
    { href: '../claimbox/', k: 'open source', title: 'claimbox', desc: 'From a claim’s text to an object a machine can check, printed back in plain words, or refused with the reason.' },
    { href: '../grammar/', k: 'open source · kits for matplotlib and the web', title: 'WARRANT, the visual grammar', desc: 'Charts that show what decided each number: proved, computed, chosen or refused. Copy kits/warrant-mpl or warrant.js.' },
    { href: '../reports/rerun.html', k: 'open kit', title: 'The re-run kit', desc: 'Re-derive a verdict with your own code; the outside re-derivations so far are listed with it.' },
    { href: '../apps/', k: 'decision apps', title: 'Apps on the same verdicts', desc: appNames.join(', ') + ' and PU Verificado: operational answers with the certificate one click down.' },
  ]);

  const legend = '<div class="col">' + W.legendHtml({ compact: true }) + '</div>';
  const col = (raw) => '<div class="col">' + raw + '</div>';
  const pilotLine = '<a href="' + C.escAttr(PILOT) + '">Request a pilot →</a> · or write to ' + mail;
  const sections = [
    C.header({
      eyebrow: 'cert-machine · verify',
      title: 'AI now publishes faster than anyone can check. Verify checks it.',
      deck: 'Verify re-decides a published claim from its own bytes, with code that shares nothing with the claimant, and returns one of three words: '
        + 'CERTIFIED, REFUTED with the object that breaks it, or REFUSED with the reason. Every verdict comes with a certificate anyone can re-run.'
    }),
    C.pRaw(pilotLine + ' · <a href="#evidence">The evidence</a> · <a href="#offers">The offers</a> · <a href="#how">How it works</a> · <a href="#engine">Built on it</a>'),
    hero,
    scale,
    /* three proof points, the strongest trust signal first */
    C.section({ lab: 'proof 1 of 3 · trust', title: 'The verifier is attacked before it is trusted', id: 'evidence', wide: true, bodyRaw: mutFig }),
    C.section({ lab: 'proof 2 of 3 · audits', title: 'It reads the statement a proof checker is handed', wide: true,
      bodyRaw: ostFig + col(C.pRaw('<a href="../reports/openai-math.html">The OpenAI audit →</a>')) + sixFold }),
    C.section({ lab: 'proof 3 of 3 · outside', title: 'Outside checkers re-ran it and agreed', wide: true,
      bodyRaw: col(C.quote({ text: '“' + OUTSIDE.plain(qiushi.quote) + '”', cite: 'the claimant, after an audit: ' + qiushi.who })) + back }),
    C.section({
      lab: 'the offers', title: 'Two ways to use it', id: 'offers',
      bodyRaw: C.plainList([
        { b: 'Graders that cannot be gamed, for RL and evaluation teams.',
          raw: 'Send a task family, its answer format and what counts as correct. You get a grader whose ground truth is a certificate, in code you run, '
            + 'that must refuse planted wrong answers before it grades anything. On the mix measured here a tolerance grader admitted '
            + tolPct + ' of ' + fmt(tolAdmit.n) + ' provably wrong answers; the certificate grader admitted none and rejected nothing right.' },
        { b: 'Independent audits, for labs, AI-for-science companies and registries.',
          raw: 'Send a claim as published, with its bytes. You get the gaps listed first, every finite part decided in exact arithmetic or by a second, '
            + 'independent proof kernel, and every formal statement read against the claim and kept apart from what was decided. Before or after publication; the pilot’s terms say when the report is published.' }
      ]) + C.pRaw(pilotLine + '. The form is public; a claim that is not yet public goes by e-mail.')
    }),
    C.section({ lab: 'below · how it works', title: 'From a claim to a certificate', id: 'how', wide: true, bodyRaw: schema }),
    C.section({
      lab: 'below · for graders', title: 'A tolerance is a hole a model can learn', wide: true,
      bodyRaw: envFig + legend + col(C.pRaw('A grader that compares decimals within a tolerance rewards answers that are provably wrong, and a policy trained against it learns exactly those. '
        + 'Three environments built on certificates instead run on Prime Intellect’s Environments Hub. <a href="../reports/envs.html">The measurement →</a>'))
    }),
    C.section({ lab: 'below · every verdict', title: 'What the register holds', wide: true,
      bodyRaw: regFig + col(C.pRaw('<a href="../reports/claims.html">Every claim, with its verdict →</a>')) }),
    C.section({
      lab: 'below · the engine', title: 'Built on the same engine', id: 'engine', wide: true,
      bodyRaw: col(C.p('The two offers above are what a pilot buys. Everything below runs on the same decider and the same three words, and most of it is open.'))
        + '<div class="col" id="gym">' + C.pRaw(C.tag('under development', 'open') + ' <b>Verify Gym.</b> An always-evolving training ground on top of cert-machine. Models propose the tightest rational interval they can around a constant: '
          + 'first, roots of x^x = y, k-th roots of integers and real roots of integer polynomials. The reward is certified decimals, both ends proven exactly; '
          + 'an end that is refuted, malformed or unchecked earns nothing, so the reward cannot be gamed. New families arrive from the register’s newly decided claims; '
          + 'a held-out set is frozen, and a public scorecard ranks every model, ours included. A trained open model ships only if it beats its own base on the held-out set.') + '</div>' + products
    }),
    C.section({
      lab: 'below · the limits', title: 'What it refuses',
      bodyRaw: C.plainList([
        { b: 'Claims that do not come down to finitely many exact facts.', text: 'An asymptotic statement, a “for all n”, or a proof written in prose is refused with the reason, and the refusal says what would make it decidable.' },
        { b: 'Your code.', text: 'Nothing a claimant wrote is run. The decision comes from code written apart from it, so a bug cannot certify itself.' },
        { b: 'Meaning, passed off as a decision.', text: 'A kernel cannot say what a statement means. Where a verdict rests on reading a statement, the report says so and keeps the reading apart from what was decided.' },
        { b: 'A verdict it cannot back.', text: 'Absence of proof is never turned into CERTIFIED or REFUTED. Not peer-reviewed; every page ships its own falsifiers.' }
      ])
    }),
    C.section({
      lab: 'below · a pilot', title: 'How a pilot starts', id: 'pilot',
      bodyRaw: C.plainList([
        { b: '1. Open a request.', raw: 'The <a href="' + C.escAttr(PILOT) + '">pilot form</a> asks what you want checked and where it is published. The form is public; if the claim is not, write to ' + mail + ' instead.' },
        { b: '2. Scope before work.', text: 'Before anything is run, you get the list of what can be decided, what will be read, and what will be refused, and why.' },
        { b: '3. The certificate.', text: 'Each verdict comes with its certificate and a one-line command that re-derives it without this engine.' }
      ]) + C.pRaw(pilotLine)
    })
  ];
  /* ONE rigor block (the operator, 2026-10-31): every value's reason that only its tooltip carries, said once at the
     page's end instead of after each section. design/reasons.js leaves a page that carries its own block alone. */
  let body = sections.join('\n\n');
  const why = RS.pageReasons(body);
  if (why) { const at = body.lastIndexOf('</section>'); body = body.slice(0, at) + why + body.slice(at); }
  body += CH.script();
  const foot = '<p>Built by tools/build-site.js and tools/verify-page.js from ' + [REG, HM, KWR, XXR, OK_, OREL, OST, ENV, MUT, 'corpus/external-reruns.json', 'corpus/recognition.json'].join(', ')
    + ' and the registry snapshots in corpus/optconst-queue/. Nothing on this page is live. MIT. <a href="' + GITHUB + '">Source</a>.</p>';
  return { body, foot, css };
};
