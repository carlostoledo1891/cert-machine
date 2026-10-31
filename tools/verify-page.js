/* verify-page.js — /verify/, the product face, tailored to the people reviewing it (the operator, 2026-10-31: "Bring
   more visual appeal, graphs, schemas, charts. We have the tools! Let's impress!").
   tools/ · cert-machine

   Called once by tools/build-site.js, which hands it the landing's own numbers (tolAdmit, asterisksOff, the reruns,
   the pinned outside quotation) so the product page and the evidence cannot disagree. Every other number is read
   here from its record and printed through playground/warrant.js with its address (W.val, or W.value with the cells
   it is derived from); every figure names its record and the sentence of the check below that would refuse it.
   Every chart is drawn by design/charts.js; the schema is design/components.js flow(). Nothing on this page is live:
   the future the deck speaks of is said in words, never drawn as a feed.

   Its refusals are its own (vg): they stop the build like the landing's guards, and are not listed on the landing. */
'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function verifyPage(X) {
  const { ROOT, C, W, fmt, fail, GITHUB, numword, tolAdmit, tolPct, asterisksOff, externalReruns, rerunsOwn, qiushi, OUTSIDE, appCards } = X;
  const CH = require(path.join(ROOT, 'design', 'charts.js'));
  const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
  const vg = (plain, ok, msg) => { if (!ok) fail((msg ? msg + ' — ' : '') + '/verify/ refuses to build if ' + plain); };
  const PILOT = GITHUB + '/issues/new?template=pilot.yml';
  const HUB = 'https://app.primeintellect.ai/dashboard/environments/carlos-toledo/';
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow10 = (e) => '10' + String(e).split('').map((c) => SUP[c]).join('');
  const SURF = CH.SURFACE;

  /* ---- the records ------------------------------------------------------------------------------------------- */
  const REG = 'certs/claims-ledger.json', HM = 'certs/horizonmath-ledger.json', KWR = 'certs/kissing-wave.json',
    XXR = 'certs/xx-ledger.json', OK_ = 'certs/openai-math-kernel.json', OREL = 'corpus/openai-math/release.json',
    OST = 'certs/openai-math-statements.json', ENV = 'certs/envs-record.json', MUT = 'certs/selfaudit-mutations.json';
  const L = J(REG), Kw = J(KWR), Xx = J(XXR), Ok = J(OK_), Orel = J(OREL), S = J(OST), E = J(ENV), M = J(MUT).all;

  /* ---- THE HERO: the register's decided claims, cumulative over the days they were recorded --------------------
     Three exact counts per day (all decided, CERTIFIED, every other verdict), drawn as steps: a count does not move
     between two recorded days, so the flat runs are as decided as the risers. The × sits where the one refuted claim
     whose own decision record exhibits the object that breaks it was recorded (WARRANT rule 5): HorizonMath's R(k,k)
     certificate, read for its pairs outside R. erdos852's refutation is a box clearing a box and carries no ×. */
  const decided = L.rows.filter((r) => r.verdict !== 'QUEUED');
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
  const days = [...new Set(decided.map((r) => r.recordedOn))].sort();
  const t0 = Date.parse(days[0] + 'T00:00:00Z');
  const dn = (s) => Math.round((Date.parse(s + 'T00:00:00Z') - t0) / 864e5);
  const cum = (pred) => days.map((d) => decided.filter((r) => r.recordedOn <= d && pred(r)).length);
  const sAll = cum(() => true), sCert = cum((r) => r.verdict === 'CERTIFIED'), sOther = cum((r) => r.verdict !== 'CERTIFIED');
  const refuted = decided.filter((r) => r.verdict === 'REFUTED');
  const hmRow = refuted.find((r) => r.decidedFrom === HM);
  const hmRec = hmRow ? J(HM).rows.find((y) => y.claim === hmRow.claim && y.verdict === 'REFUTED') : null;
  const hmOut = hmRec && Array.isArray(hmRec.points) ? hmRec.points.filter((p) => p.outsideR).length : 0;
  const HERO_STOP = 'its three curves do not end at the register\'s decided count, its CERTIFIED count and the rest, or the refuted claim it marks no longer exhibits, in its own record, pairs outside R';
  vg(HERO_STOP, decided.every((r) => isDate(r.recordedOn)) && sAll[sAll.length - 1] === L.decided
    && sCert[sCert.length - 1] === L.byVerdict.CERTIFIED && sOther[sOther.length - 1] === L.decided - L.byVerdict.CERTIFIED
    && hmRec && hmOut > 0 && refuted.every((r) => r === hmRow || r.decidedFrom === 'certs/erdos852-certificate.json'));
  const wDay = dn(hmRow.recordedOn), wIdx = days.indexOf(hmRow.recordedOn);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const lastDay = dn(days[days.length - 1]);
  const tickDays = (mid) => {
    const out = [];
    for (let t = t0; t <= t0 + (lastDay + 6) * 864e5; t += 864e5) {
      const d = new Date(t);
      if (d.getUTCDate() === 1 || (mid && d.getUTCDate() === 15)) out.push({ v: Math.round((t - t0) / 864e5), t: MON[d.getUTCMonth()] + ' ' + d.getUTCDate() });
    }
    return out;
  };
  const HKEYS = (short) => [
    { token: 'var(--c-1)', kind: 'line', t: short ? 'all decided' : 'every decided claim' },
    { token: 'var(--c-2)', kind: 'line', t: 'CERTIFIED' },
    { token: 'var(--c-3)', kind: 'line', t: short ? 'every other verdict' : 'REFUTED, PARTIAL, MIXED, REPAIRED, NEEDS DATA' },
  ];
  function heroSvg({ w, h, padL, padR, mid, short, alt }) {
    const nLeg = CH.legendLines(HKEYS(short), w - padL - padR);
    const yMax = Math.ceil((L.decided + 10) / 25) * 25;
    const f = CH.frame({ w, h, x0: -1.5, x1: lastDay + 1.5, y0: 0, y1: yMax, padL, padR, padT: 30, padB: 32 + nLeg * 19 });
    const out = [CH.open({ w, h, alt })];
    out.push(CH.axes(f, { xTicks: tickDays(mid), yTicks: [0, 25, 50, 75, 100, 125, 150].filter((v) => v <= yMax).map((v) => ({ v, t: String(v) })) }));
    out.push(CH.txt(f.L - 9, f.T - 14, short ? 'claims decided, to date' : 'published claims decided, cumulative, by the day each was recorded', 't-note', 'start'));
    const step = (s) => days.map((d, i) => (i ? 'L' + f.px(dn(d)).toFixed(1) + ' ' + f.py(s[i - 1]).toFixed(1) + ' ' : 'M' + f.px(dn(d)).toFixed(1) + ' ' + f.py(0).toFixed(1) + ' ')
      + 'L' + f.px(dn(d)).toFixed(1) + ' ' + f.py(s[i]).toFixed(1)).join(' ');
    out.push('    <path d="' + step(sAll) + ' L' + f.px(lastDay).toFixed(1) + ' ' + f.py(0).toFixed(1) + ' Z" fill="var(--c-1)" opacity="0.08"/>');
    const series = [[sOther, 'var(--c-3)'], [sCert, 'var(--c-2)'], [sAll, 'var(--c-1)']];
    for (const [s, tok] of series) out.push('    <path d="' + step(s) + '" fill="none" stroke="' + tok + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>');
    for (const [s, tok] of series) days.forEach((d, i) => out.push('    <circle cx="' + f.px(dn(d)).toFixed(1) + '" cy="' + f.py(s[i]).toFixed(1) + '" r="3.2" fill="' + tok + '" stroke="' + SURF + '" stroke-width="1.5"/>'));
    /* the end of each curve, named with its count */
    const ends = [[sAll, ' decided'], [sCert, ' CERTIFIED'], [sOther, ' other verdicts']].map(([s, word]) => [s, short ? '' : word]);
    for (const [s, word] of ends) out.push(CH.txt(f.px(lastDay) + 10, f.py(s[s.length - 1]) + 4, fmt(s[s.length - 1]) + word, 't-lab', 'start'));
    /* hover: one target per recorded day, on the total curve */
    days.forEach((d, i) => out.push('    <circle ' + CH.hit('cx="' + f.px(dn(d)).toFixed(1) + '" cy="' + f.py(sAll[i]).toFixed(1) + '" r="11" fill="transparent"',
      d + ' · ' + fmt(sAll[i] - (i ? sAll[i - 1] : 0)) + ' recorded that day',
      fmt(sAll[i]) + ' decided to date: ' + fmt(sCert[i]) + ' CERTIFIED, ' + fmt(sOther[i]) + ' other') + '/>'));
    /* the witness: on the curve of the verdicts that are not CERTIFIED, on the day the refuted claim was recorded */
    const wx = f.px(wDay), wy = f.py(sOther[wIdx]);
    out.push('    ' + W.witnessMark(wx, wy, { size: short ? 6 : 7, width: 3, casing: SURF }));
    const lab = short ? ['R(k,k) refuted:', fmt(hmOut) + ' pairs outside R'] : ['HorizonMath’s R(k,k) bound, refuted:', fmt(hmOut) + ' of its certificate’s ' + fmt(hmRec.points.length) + ' pairs lie outside R'];
    /* the words sit left of the ×, in the empty band between the CERTIFIED curve and the curve it marks */
    lab.forEach((s, k) => out.push(CH.txt(wx - 14, wy - 13 + k * 17, s, k ? 't-note' : 't-lab', 'end')));
    out.push(CH.legend(HKEYS(short), f.L, f.h - 8, undefined, f.pw));
    out.push(CH.close);
    return out.join('\n');
  }
  const HERO_ALT = 'A step chart of the register’s published claims, decided and recorded day by day from ' + days[0] + ' to ' + days[days.length - 1]
    + ': ' + numword(L.decided) + ' decided in all, ' + numword(L.byVerdict.CERTIFIED) + ' of them CERTIFIED and ' + numword(L.decided - L.byVerdict.CERTIFIED)
    + ' with another verdict. A red cross on ' + hmRow.recordedOn + ' marks HorizonMath’s refuted R(k,k) bound, whose own certificate has ' + numword(hmOut) + ' pairs outside R.';
  const hero = C.figure({
    hero: true, record: [REG, HM], stop: HERO_STOP,
    svgRaw: heroSvg({ w: 1000, h: 420, padL: 52, padR: 150, mid: true, short: false, alt: HERO_ALT }),
    svgNarrowRaw: heroSvg({ w: 360, h: 400, padL: 38, padR: 40, mid: false, short: true, alt: HERO_ALT }),
    captionRaw: 'Every published claim this machine has decided, one at a time, as each was recorded: '
      + W.val({ rec: { path: REG, ptr: '/decided' }, standing: W.DECIDED, fmt: 'int', why: 'the register’s count of decided rows' }) + ' since ' + C.esc(days[0])
      + ', from DeepMind, OpenAI, agent platforms and AI-assisted manuscripts among others. Each step is an exact count. '
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
        + W.val({ rec: { path: OK_, ptr: '/counts/words/REFUSED' }, standing: W.DECIDED, fmt: 'int' }) + ' refused with the reason, from a release of '
        + W.val({ rec: { path: OREL, ptr: '/stated/manuscripts' }, standing: W.DECIDED, fmt: 'int' }) + ' machine-generated manuscripts · <a href="../reports/openai-math.html">the audit</a>' },
    { k: 'provably wrong answers minted to attack graders', vRaw: W.val({ rec: { path: ENV, ptr: '/provablyWrong' }, standing: W.DECIDED, fmt: 'int' }),
      nRaw: 'each one outside a certified enclosure and inside a grader’s tolerance, minted from certificates already on disk · <a href="../reports/envs.html">the measurement</a>' },
  ]);

  /* ---- THE SCHEMA: what the product is, drawn as the flow kit draws the machine ---------------------------------- */
  const nodes = [
    { id: 'claim', x: 20, y: 20, w: 260, h: 64, role: 'dep', k: '1 · THE CLAIM', v: 'a published claim, its bytes',
      t: 'the claim', d: 'What a model, a paper or a leaderboard said, with the files behind it: a configuration, a table, a proof, an answer. Each file is pinned by its SHA-256 before anything is read, so the verdict names exactly what it decided.' },
    { id: 'stated', x: 320, y: 20, w: 260, h: 64, role: 'held', k: '2 · STATED', v: 'claimbox: words → an object',
      t: 'stated', d: 'claimbox turns the claim’s words into an object a machine can check, prints it back in plain words, and refuses what does not come down to finitely many exact facts, naming why. A statement is read against the claim before anything is decided, and the reading is kept apart from the decision.' },
    { id: 'decided', x: 320, y: 160, w: 260, h: 64, role: 'sig', k: '3 · DECIDED', v: 'exact; no code of yours runs',
      t: 'decided', d: 'Exact rational arithmetic, interval enclosures rounded outward, or a second proof kernel, in code written apart from the claimant’s. No floating-point number takes part in a decision, and the decider is attacked with planted forgeries before it is trusted.' },
    { id: 'cert', x: 20, y: 160, w: 260, h: 64, role: 'sig', k: '4 · THE CERTIFICATE', v: 'CERTIFIED · REFUTED · REFUSED',
      t: 'the certificate', d: 'One of three words. CERTIFIED, with a falsifier that would break it. REFUTED, with the object that breaks the claim. REFUSED, with the reason and what would make it decidable. Each re-runs with one command, without this engine.' },
    { id: 'audit', x: 20, y: 306, w: 260, h: 64, role: 'warn', k: 'AN AUDIT · FOR LABS', v: 'the report, gaps listed first',
      t: 'an audit', d: 'For labs, AI-for-science companies and registries: a published claim goes in at step 1, and a report comes out listing every gap first, then every finite part decided, every formal statement read against the claim.' },
    { id: 'grader', x: 320, y: 306, w: 260, h: 64, role: 'warn', k: 'A GRADER · FOR RL TEAMS', v: 'the reward is the certificate',
      t: 'a grader', d: 'For RL and evaluation teams: a task family is stated once at step 2, then every model answer is decided at step 3 and the certificate is the reward. It must refuse planted wrong answers before it grades anything, so a policy cannot learn to fool it.' },
  ];
  const edges = [
    { d: 'M282 52 L318 52' },
    { d: 'M450 86 L450 158', lab: 'nothing of yours is run', lx: 440, ly: 126, anchor: 'end' },
    { d: 'M318 192 L282 192' },
    { d: 'M150 226 L150 304', lab: 'per claim', lx: 140, ly: 270, anchor: 'end' },
    { d: 'M190 226 C190 268 450 262 450 304', lab: 'per answer', lx: 462, ly: 270, anchor: 'start' },
  ];
  const schema = C.flow({ w: 600, h: 392, nodes, edges, source: 'built: a diagram of the four steps and the two offers this page describes; it carries no number',
    alt: 'A schema of Verify in four steps: a published claim and its bytes are stated as an object by claimbox, decided exactly by code that shares nothing with the claimant, and returned as a certificate (certified, refuted or refused). The certificate feeds two offers: an audit report per claim, for labs, and a reward per answer, for RL teams.',
    readout: { k: 'a claim, decided', d: 'Select a step for what it does and why it can be trusted.' },
    caption: 'The product in four steps. An audit is the whole path for one published claim; a grader states a task family once and runs steps 3 and 4 on every answer a model gives.' });

  /* ---- graders: what a tolerance admits (the envs record, drawn as /reports/envs.html draws it) ----------------- */
  const encl = E.graders.find((g) => /enclosure/.test(g.name)), absT = E.graders.find((g) => /absolute/.test(g.name));
  const ENV_STOP = 'the certificate grader false-accepts or false-rejects a submission in the record, or the absolute-tolerance grader false-accepts fewer than half of the provably-wrong ones';
  vg(ENV_STOP, encl && encl.falseAccept === 0 && encl.falseReject === 0 && absT && absT.falseAccept >= 0.5);
  const tols = E.tolerancesProbed.slice().sort((a, b) => a - b);
  const tolWord = (t) => pow10(Math.round(Math.log10(t)));
  const ser = [['absolute tolerance', absT, 'var(--c-1)'], ['relative tolerance', E.graders.find((g) => /relative/.test(g.name)), 'var(--c-2)'],
    ['exact match of a decimal', E.graders.find((g) => /exact/.test(g.name)), 'var(--c-3)']].filter((x) => x[1]);
  const pctS = (x) => (100 * x).toFixed(1) + '%';
  const envSvg = CH.scatter({
    w: 760, h: 360, logX: true, x0: tols[0] * 0.5, x1: tols[tols.length - 1] * 2, y0: 0, y1: 100, padL: 54,
    xLabel: 'the grader’s tolerance (log scale)', yLabel: 'wrong answers admitted (%)',
    yTicks: [0, 25, 50, 75, 100].map((v) => ({ v, t: String(v) })),
    xTicks: [1e-15, 1e-12, 1e-9, 1e-6, 1e-3].map((v) => ({ v, t: tolWord(v) })),
    alt: 'The share of provably wrong answers each grader admits, against its tolerance on a log axis, measured at ' + tols.length + ' tolerances and joined by dotted lines. The tolerance graders admit fewer as the tolerance tightens but never none; the certificate grader is a solid line at zero, because it reads no tolerance.',
    hlines: [{ y: 0, token: 'var(--ink)', t: 'certificate grader: 0 at every tolerance' }],
    curves: ser.map(([, g]) => ({ pts: tols.map((t) => [t, 100 * (g.falseAcceptByTolerance[String(t)] || 0)]), standing: W.CHOSEN })),
    pts: [].concat(...ser.map(([n, g, tok]) => tols.map((t) => ({ x: t, y: 100 * (g.falseAcceptByTolerance[String(t)] || 0), token: tok,
      k: n + ' · tolerance ' + tolWord(t), v: pctS(g.falseAcceptByTolerance[String(t)] || 0) + ' of the provably wrong answers minted at that tolerance admitted' })))),
    keys: ser.map(([n, , tok]) => ({ token: tok, t: n }))
  });
  const envFig = C.figure({ svgRaw: envSvg, record: ENV, stop: ENV_STOP,
    captionRaw: 'Answers minted wrong from certificates, each outside a proved enclosure and inside the grader’s tolerance. Tightening the tolerance by '
      + numword(Math.round(Math.log10(tols[tols.length - 1] / tols[0]))) + ' orders of magnitude does not close the hole; only a grader that reads the certificate admits none, and it rejected nothing right. Each dot is an exact count at one tolerance; the dotted joins are a picture between them.' });

  /* ---- the self-audit: a float check against the decider, on the same planted mutants --------------------------- */
  const MUT_STOP = 'the self-audit record counts a false certification or a false refutation, or a float check it draws admits no witnessed-false mutant';
  const taus = ['1e-6', '1e-9', '1e-12'];
  vg(MUT_STOP, M.falseCertifications === 0 && M.falseRefutations === 0 && M.mutants > 0 && taus.every((t) => M.float[t] && M.float[t].witnessedFalseAccepted > 0));
  const mutRows = taus.map((t) => ({ k: 'float check at ' + tolWord(Number(t)), v: M.float[t].witnessedFalseAccepted, token: 'var(--c-3)',
    lab: fmt(M.float[t].witnessedFalseAccepted) + ' of ' + fmt(M.float[t].witnessedFalse) + ' accepted', hover: fmt(M.float[t].witnessedFalseAccepted) + ' of ' + fmt(M.float[t].witnessedFalse) + ' witnessed-false mutants accepted' }))
    .concat([{ k: 'this decider', v: M.falseCertifications, token: 'var(--c-1)', lab: fmt(M.falseCertifications) + ' of ' + fmt(M.byTruth.FALSE) + ' certified',
      hover: fmt(M.falseCertifications) + ' of ' + fmt(M.byTruth.FALSE) + ' false mutants certified; ' + fmt(M.falseRefutations) + ' true ones refuted' }]);
  const mutSvg = CH.bars({ w: 860, h: mutRows.length * 34 + 80 + 19, rowH: 34, max: M.float['1e-6'].witnessedFalse, padL: 190, padR: 170, rows: mutRows,
    xTicks: [0, 100, 200, 300].filter((v) => v <= M.float['1e-6'].witnessedFalse).map((v) => ({ v, t: String(v) })),
    xLabel: 'planted false values accepted',
    keys: [{ token: 'var(--c-3)', t: 'a double-precision check at a tolerance' }, { token: 'var(--c-1)', t: 'the exact decider' }],
    alt: 'Bars: of the planted false values each witnessed by an independent script, a double-precision check accepted ' + taus.map((t) => fmt(M.float[t].witnessedFalseAccepted) + ' at tolerance ' + t).join(', ') + '; the exact decider certified none of the ' + fmt(M.byTruth.FALSE) + ' false mutants.' });
  const mutFig = C.figure({ svgRaw: mutSvg, record: MUT, stop: MUT_STOP,
    captionRaw: 'The verifier is attacked before it is trusted: '
      + W.val({ rec: { path: MUT, ptr: '/all/mutants' }, standing: W.DECIDED, fmt: 'int' }) + ' mutants of '
      + W.val({ rec: { path: MUT, ptr: '/all/rows' }, standing: W.DECIDED, fmt: 'int' }) + ' register rows, pre-registered, each false one witnessed by a script that shares no code with the decider. '
      + 'The decider certified none of the false ones and refuted none of the true ones; the same mutants through a floating-point check pass in the numbers above.' });

  /* ---- audits: what reading the statement finds (OpenAI's 242 formalized families) ---------------------------- */
  const SW = ['MATCHES', 'NARROWER — DECLARED', 'NARROWER — UNLINKED', 'SUPPORT-ONLY', 'NARROWER — UNDECLARED', 'DIFFERENT'];
  const SHORT = ['NARROWER — UNDECLARED', 'DIFFERENT'];
  const sw = S.counts.words;
  const sShort = SHORT.reduce((a, w) => a + (sw[w] || 0), 0);
  const OST_STOP = 'its bars do not sum to the families the statements record read, or none of them states less than its headline with nothing saying so';
  vg(OST_STOP, Object.keys(sw).every((w) => SW.includes(w)) && SW.reduce((a, w) => a + (sw[w] || 0), 0) === S.rows.length && S.rows.length === S.counts.families && sShort > 0);
  const READ = 'computed — a reading by AI agents, second-read where the first found a gap: a claim about the statement, not a certificate';
  const ostSvg = CH.bars({ w: 860, h: SW.length * 30 + 80 + 19, rowH: 30, max: Math.max(...SW.map((w) => sw[w] || 0)), padL: 200, padR: 70,
    rows: SW.map((w) => ({ k: w, v: sw[w] || 0, token: SHORT.includes(w) ? 'var(--c-1)' : 'var(--c-3)', lab: fmt(sw[w] || 0) })),
    xTicks: [0, 50, 100].map((v) => ({ v, t: String(v) })), xLabel: 'formalized families',
    keys: [{ token: 'var(--c-1)', t: 'states less than its headline, and nothing says so' }, { token: 'var(--c-3)', t: 'matches, or the release says what it covers' }],
    alt: 'Bars: OpenAI’s ' + S.rows.length + ' formalized families by how their Lean statements read against the headline: ' + SW.map((w) => (sw[w] || 0) + ' ' + w).join(', ') + '.' });
  const ostFig = C.figure({ svgRaw: ostSvg, record: OST, stop: OST_STOP,
    captionRaw: 'A proof checker verifies the statement it is handed; nobody checked the statement against the claim. Read clause by clause, '
      + W.value(fmt(sShort) + ' of ' + fmt(S.rows.length), W.COMPUTED, { derived: [OST + '#/counts/words', OST + '#/rows'], title: READ })
      + ' of OpenAI’s formalized families prove a different or weaker theorem than their headline, with nothing in the release saying so, while the proofs themselves pass a second kernel. Each word is a reading, kept apart from what was decided.' });

  /* ---- the register's verdict mix ----------------------------------------------------------------------------- */
  const VW = ['CERTIFIED', 'PARTIAL', 'REPAIRED', 'MIXED', 'REFUTED', 'NEEDS DATA'];
  const REG_STOP = 'its bars do not number the register\'s decided claims verdict by verdict';
  vg(REG_STOP, VW.reduce((a, w) => a + (L.byVerdict[w] || 0), 0) === L.decided && Object.keys(L.byVerdict).every((w) => VW.includes(w) || w === 'QUEUED'));
  const VDESC = { CERTIFIED: 'held, with its falsifier', PARTIAL: 'a fragment certified, the core refused', REPAIRED: 'refuted as printed; the object beside it certified',
    MIXED: 'one record holds both', REFUTED: 'the object that breaks it, printed', 'NEEDS DATA': 'the bytes that would decide it, named' };
  const regSvg = CH.bars({ w: 860, rowH: 30, max: L.byVerdict.CERTIFIED, padL: 130, padR: 400,
    rows: VW.map((w) => ({ k: w, v: L.byVerdict[w] || 0, token: w === 'CERTIFIED' ? 'var(--c-2)' : w === 'REFUTED' ? 'var(--c-1)' : 'var(--c-3)', lab: fmt(L.byVerdict[w] || 0) + ' · ' + VDESC[w] })),
    xTicks: [0, 50, 100].map((v) => ({ v, t: String(v) })), xLabel: 'published claims',
    alt: 'Bars: the register’s ' + L.decided + ' decided claims by verdict: ' + VW.map((w) => (L.byVerdict[w] || 0) + ' ' + w).join(', ') + '.' });
  const regFig = C.figure({ svgRaw: regSvg, record: REG, stop: REG_STOP,
    captionRaw: 'Most published claims hold. The value is in the ones that do not, and in saying exactly which part held: every verdict above names its record, and none is a summary.' });

  /* ---- what came back ------------------------------------------------------------------------------------------ */
  const back = C.stats([
    { k: 'asterisks removed from a registry on these replays', v: String(asterisksOff),
      nRaw: 'the optimization-constants registry (Davis, Ivanisvili, Tao), which cites the replays · <a href="../reports/optimization-constants.html">the replays</a>' },
    { k: 'outside re-derivations, no disagreement', v: String(externalReruns.length),
      nRaw: rerunsOwn + ' of them by people with no connection to this work, with their own code · <a href="../reports/rerun.html">the rerun kit</a>' },
  ]);

  /* ---- built on the same engine -------------------------------------------------------------------------------- */
  /* the apps by name, once each (SkyAudit's two cities are one app); the frozen Petrobras submissions are not named */
  const appNames = [...new Set(appCards.map((a) => a.title.replace(/\s*[·—:-].*$/, '').split(/\s+/)[0]).filter((t) => !/Contraprova|Decidível|Abatimento|Registro/i.test(t)))];
  vg('the apps hub it points at lists no app', appNames.length > 0);
  const products = C.cards([
    { href: '#gym', k: 'under development', title: 'Verify Gym', desc: 'A training ground where the reward is certified decimals: both ends of an interval proven, or nothing.' },
    { href: HUB + 'lattice-claims', k: 'RL environment · Prime Intellect hub', title: 'lattice-claims', desc: 'A lattice claim is decided exactly, or the grader says what it would need.' },
    { href: HUB + 'blind-spot', k: 'RL environment · Prime Intellect hub', title: 'blind-spot', desc: 'An RTL mutation task: a kill is simulated, never taken from an answer key.' },
    { href: HUB + 'break-the-grader', k: 'RL environment · Prime Intellect hub', title: 'break-the-grader', desc: 'The reward is breaking a grader, and “I could not break it” is scored apart.' },
    { href: '../claimbox/', k: 'open source', title: 'claimbox', desc: 'From a claim’s text to an object a machine can check, printed back in plain words, or refused with the reason.' },
    { href: '../grammar/', k: 'open source · kits for matplotlib and the web', title: 'WARRANT, the visual grammar', desc: 'Charts that show what decided each number: proved, computed, chosen or refused. Copy kits/warrant-mpl or warrant.js.' },
    { href: '../reports/rerun.html', k: 'open kit', title: 'The re-run kit', desc: 'Re-derive a verdict with your own code; the outside re-derivations so far are listed with it.' },
    { href: '../apps/', k: 'decision apps', title: 'Apps on the same verdicts', desc: appNames.join(', ') + ' and PU Verificado: operational answers with the certificate one click down.' },
  ]);

  const legend = '<div class="col">' + W.legendHtml({ compact: true }) + '</div>';
  const body = [
    C.header({
      eyebrow: 'cert-machine · verify',
      title: 'Verify: an independent check for what AI systems claim',
      deck: 'AI systems are producing numbers, claims and proofs faster than anyone can read them, and the pace is still rising. '
        + 'Soon, perhaps, they will produce them continuously, and every one will need checking before anyone builds on it. '
        + 'Verify re-decides a claim from its own bytes, with code that shares nothing with the claimant, and returns one of three words: '
        + 'CERTIFIED, REFUTED with the object that breaks it, or REFUSED with the reason. Every verdict comes with a certificate anyone can re-run.'
    }),
    C.pRaw('<a href="' + C.escAttr(PILOT) + '">Request a pilot →</a> · <a href="#offers">The two offers →</a> · <a href="#how">How it works →</a> · <a href="#engine">Everything built on it →</a>'),
    hero,
    scale,
    C.section({
      lab: 'the offers', title: 'Two ways to use it', id: 'offers',
      bodyRaw: C.plainList([
        { b: 'Graders that cannot be gamed, for RL and evaluation teams.',
          raw: 'Send a task family, its answer format and what counts as correct. You get a grader whose ground truth is a certificate, in code you run, '
            + 'that must refuse a set of planted wrong answers before it grades anything. On the mix measured here a tolerance grader admitted '
            + tolPct + ' of ' + fmt(tolAdmit.n) + ' provably wrong answers; the certificate grader admitted none and rejected nothing right.' },
        { b: 'Independent audits, for labs, AI-for-science companies and registries.',
          raw: 'Send a claim as published, with its bytes. You get the gaps listed first, every finite part decided in exact arithmetic or by a second, '
            + 'independent proof kernel, and every formal statement read against the claim and kept apart from what was decided. Before or after publication; the pilot’s terms say when the report is published.' }
      ]) + C.pRaw('<a href="' + C.escAttr(PILOT) + '">Request a pilot →</a>')
    }),
    C.section({ lab: 'how it works', title: 'From a claim to a certificate', id: 'how', wide: true, bodyRaw: schema }),
    C.section({
      lab: 'for graders', title: 'A tolerance is a hole a model can learn', wide: true,
      bodyRaw: envFig + legend + '<div class="col">' + C.pRaw('A grader that compares decimals within a tolerance rewards answers that are provably wrong, and a policy trained against it learns exactly those. '
        + 'Three environments built on certificates instead run on Prime Intellect’s Environments Hub. <a href="../reports/envs.html">The measurement →</a>') + '</div>'
    }),
    C.section({
      lab: 'for audits', title: 'What it has already caught', wide: true,
      bodyRaw: ostFig + '<div class="col">' + C.pRaw('<a href="../reports/openai-math.html">The OpenAI audit →</a>') + '</div>'
        + regFig + '<div class="col">' + C.pRaw('<a href="../reports/claims.html">Every claim, with its verdict →</a>') + '</div>'
        + '<div class="col">' + C.quote({ text: '“' + OUTSIDE.plain(qiushi.quote) + '”', cite: 'the claimant, after an audit: ' + qiushi.who }) + '</div>' + back
    }),
    C.section({
      lab: 'why you can trust it', title: 'The verifier is attacked first', wide: true,
      bodyRaw: mutFig
    }),
    C.section({
      lab: 'the engine', title: 'Built on the same engine', id: 'engine', wide: true,
      bodyRaw: '<div class="col">' + C.p('The two offers above are what a pilot buys. Everything below runs on the same decider and the same three words, and most of it is open.') + '</div>' + products
    }),
    C.section({
      lab: 'the training ground', title: 'Verify Gym', id: 'gym',
      bodyRaw: C.pRaw(C.tag('under development', 'open'))
        + C.p('An always-evolving training ground on top of cert-machine. Models propose the tightest rational interval they can around a constant: '
          + 'first, roots of x^x = y, k-th roots of integers and real roots of integer polynomials. The reward is certified decimals, both ends proven exactly; '
          + 'an end that is refuted, malformed or unchecked earns nothing, so the reward cannot be gamed.')
        + C.p('New families arrive from the register’s newly decided claims. A held-out set is frozen, and a public scorecard ranks every model, ours included. '
          + 'A trained open model ships only if it beats its own base on the held-out set.')
    }),
    C.section({
      lab: 'the limits', title: 'What it refuses',
      bodyRaw: C.plainList([
        { b: 'Claims that do not come down to finitely many exact facts.', text: 'An asymptotic statement, a “for all n”, or a proof written in prose is refused with the reason, and the refusal says what would make it decidable.' },
        { b: 'Your code.', text: 'Nothing a claimant wrote is run. The decision comes from code written apart from it, so a bug cannot certify itself.' },
        { b: 'Meaning, passed off as a decision.', text: 'A kernel cannot say what a statement means. Where a verdict rests on reading a statement, the report says so and keeps the reading apart from what was decided.' },
        { b: 'A verdict it cannot back.', text: 'Absence of proof is never turned into CERTIFIED or REFUTED. Not peer-reviewed; every page ships its own falsifiers.' }
      ])
    }),
    C.section({
      lab: 'a pilot', title: 'How a pilot starts',
      bodyRaw: C.plainList([
        { b: '1. Open a request.', raw: 'The <a href="' + C.escAttr(PILOT) + '">pilot form</a> asks what you want checked and where it is published. The form is public; if the claim is not, say so and leave only how to reach you.' },
        { b: '2. Scope before work.', text: 'Before anything is run, you get the list of what can be decided, what will be read, and what will be refused, and why.' },
        { b: '3. The certificate.', text: 'Each verdict comes with its certificate and a one-line command that re-derives it without this engine.' }
      ]) + C.pRaw('<a href="' + C.escAttr(PILOT) + '">Request a pilot →</a>')
    })
  ].join('\n\n') + CH.script();
  const foot = '<p>Built by tools/build-site.js and tools/verify-page.js from ' + [REG, HM, KWR, XXR, OK_, OREL, OST, ENV, MUT, 'corpus/external-reruns.json', 'corpus/recognition.json'].join(', ')
    + ' and the registry snapshots in corpus/optconst-queue/. Nothing on this page is live. MIT. <a href="' + GITHUB + '">Source</a>.</p>';
  return { body, foot };
};
