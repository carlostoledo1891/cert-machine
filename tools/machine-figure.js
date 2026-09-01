/* machine-figure.js — the machine schematic, built from the ledger.
   tools/ · cert-machine

   TWO drawings, one file. The control page (/machine/) shows the FULL
   schematic (machineFlow); the landing shows the COMPACT one
   (machineFlowCompact) — operator instruction 2026-08-31, superseding the
   earlier identical-on-both-pages ruling: the full drawing was too big for
   the homepage. Both live HERE so their prose and their counts can never
   drift apart, and every count on a node is read off ledger.json at build
   time; nothing is typed in.

   THE DRAWING IS VERTICAL AND DENSE, designed at 800 units wide so desktop
   renders it near 1:1 (the template caps the rendered width at that same
   800). Records fall down the page — the families in four columns,
   ENUMERATE, SCREEN, the instrument row (four across, feeding CERTIFY
   through the channel the record flow also drops through), CERTIFY, the
   three outcomes, then the ledger, the closed-form hunt and its two endings,
   the gates and the control page. The height is computed from the family
   count, so a new family grows the drawing instead of falling off it (the
   6th and 7th both did, silently, until looked at).

   machineFlow(ledger, { gates })
     gates: {green, ran} — the battery result of the control build. The
     control page passes its own live run; the landing reads batteries.json,
     the record that same run wrote (operator ruling: the drawing is
     IDENTICAL on both pages, so the landing shows the measured count, with
     its provenance — the control build — named in the narration). */
'use strict';

const path = require('path');
const C = require(path.join(__dirname, '..', 'design', 'components.js'));

const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function machineFlow(ledger, { gates }) {
  const T = ledger.totals || {};
  const F = ledger.families;
  const sum = (k) => F.reduce((t, f) => t + f.counts[k], 0);
  const screened = sum('screened'), hits = sum('hits'), rejects = sum('rejects'), refused = sum('refused');

  /* ---- geometry -------------------------------------------------------- */
  const W = 800;                                   /* design width */
  /* the family grid: FOUR columns, filled row-major, self-sizing in rows —
     the 12th family wraps to a fourth row and pushes everything below down */
  const nCol = 4, colW = 188, famH = 46, famStep = 54, famTop = 10;
  const colX = [0, 1, 2, 3].map((c) => 8 + c * (colW + 8));
  const colMid = colX.map((x) => x + colW / 2);
  const famY = F.map((_, i) => famTop + Math.floor(i / nCol) * famStep);
  const famNodes = F.map((f, i) => ({
    x: colX[i % nCol], y: famY[i], w: colW, h: famH, role: 'dep',
    k: f.name.toUpperCase(), v: commas(f.counts.generated) + ' generated',
    t: 'family · ' + f.name,
    d: f.statement + ' One file, six functions — enumerate, value, interesting, certify, key, statement; the engine supplies the loop, the scale and the dedup.'
  }));
  /* the lowest box of each column, where that column's feed edge starts */
  const colBottom = [0, 1, 2, 3].map((c) => {
    const ys = famY.filter((_, i) => i % nCol === c);
    return ys.length ? Math.max(...ys) + famH : null;
  });
  const famBottom = Math.max(...colBottom.filter((v) => v !== null));

  /* the spine: ENUMERATE and SCREEN as full-width bands (every family column
     drops straight in), then the instrument row, then CERTIFY */
  const sx = 8, sw = W - 16, scx = sx + sw / 2, bandH = 50;
  const enumY = famBottom + 32, enumB = enumY + bandH;
  const screenY = enumB + 30, screenB = screenY + bandH;

  /* the instrument row, FOUR ACROSS between SCREEN and CERTIFY: two boxes
     each side of a centre channel, and the record flow drops through the
     channel while every instrument feeds CERTIFY from above */
  const iW = 178, iH = 46, iX = [8, 194, 428, 614];
  const iY = screenB + 26, iB = iY + iH;
  const iMid = iX.map((x) => x + iW / 2);
  const certY = iB + 26, certB = certY + bandH;
  const instr = [
    { k: 'INTERVAL · KRAWCZYK', v: 'outward-rounded', t: 'instrument · interval / Krawczyk',
      d: 'Outward-rounded interval arithmetic checked against exact BigInt rationals, and the Krawczyk operator with STRICT interior containment — existence and uniqueness, or nothing. The census turns its certificates into completeness theorems: exactly N periodic points, the rest of the plane excluded.' },
    { k: 'TRIGMIN', v: 'certified minima', t: 'instrument · trigmin',
      d: 'Certified global minima of integer cosine polynomials: Chebyshev reduction, BigInt Sturm isolation, interval-Newton refinement. Feeds the Newman envelope — the bar a hit has to beat.' },
    { k: 'CENSUS', v: 'exact counts', t: 'instrument · census',
      d: 'Interval branch-and-bound over the phase plane: a certified a priori bound confines every periodic point, tube iteration excludes, Krawczyk-as-contraction resolves each remainder to exactly one point. It can refuse; it can never return a wrong count.' },
    { k: 'SOS · RATIONAL', v: 'lower bounds', t: 'instrument · sum-of-squares',
      d: 'Exact rational sum-of-squares decompositions — a tight global lower bound whose checker goes red on a corrupted certificate. Python, stdlib fractions only.' }
  ].map((n, r) => ({ ...n, x: iX[r], y: iY, w: iW, h: iH, role: 'dep' }));

  /* the outcome row, then the ledger column down to the page nodes */
  const oY = certB + 40, oH = 50, oW = 250, oX = [8, 274, 540], oB = oY + oH;
  const oMid = oX.map((x) => x + oW / 2);
  const lx = 220, lw = 360, lcx = lx + lw / 2;
  const ledgerY = oB + 48, ledgerB = ledgerY + bandH, ledgerMid = ledgerY + bandH / 2;
  const huntY = ledgerB + 28, huntB = huntY + bandH;
  const rY = huntB + 40, rH = 46, rX = [120, 420], rW = 260;
  const rMid = rX.map((x) => x + rW / 2);
  const gY = rY + rH + 44, gMid = gY + rH / 2;
  const H = gY + rH + 20;

  const gatesNode = {
    k: 'THE GATES', v: gates.green + '/' + gates.ran + ' batteries',
    t: 'the gates — batteries and red controls',
    d: 'Every battery is executed at every control build, never remembered: ' + gates.green + '/' + gates.ran + ' green at this ledger\'s build. Red controls are deliberate forgeries the instruments must catch — a control that cannot fire is decoration. Every real bug this project has found was found by a control, none by reading code.'
  };

  const selfNode = {
    k: 'THE CONTROL PAGE', v: '/machine/',
    t: 'the control page',
    d: 'The live dashboard this schematic feeds: every family, every battery, the full ledger decomposition, drift status. Generated from the ledger alone — editing it by hand is a change to nothing; the next build overwrites it, which is the point.'
  };

  const nodes = famNodes.concat([
    { x: sx, y: enumY, w: sw, h: bandH, role: 'sig', k: 'ENUMERATE', v: commas(T.generated || 0) + ' objects',
      t: 'enumerate — deterministic and indexed',
      d: 'Every family enumerates by integer index, deterministically: a run of any size resumes and reproduces, and two runs at the same limit produce identical hits. ' + commas(T.generated || 0) + ' objects this build.' },
    { x: sx, y: screenY, w: sw, h: bandH, role: 'sig', k: 'SCREEN · FLOAT', v: commas(screened) + ' pass',
      t: 'screen — float, and it may only prune',
      d: 'A fast float estimate decides only what is WORTH certifying. The screen may prune, never admit: nothing it passes is believed, and everything it passes goes to the certifier. Duplicates fold by canonical key on the way.' },
    { x: sx, y: certY, w: sw, h: bandH, role: 'sig', k: 'CERTIFY · EXACT', v: commas(T.certified || 0) + ' decided',
      t: 'certify — the only authority',
      d: 'The instruments decide: interval enclosures, exact rational arithmetic, strict interior containment for uniqueness. The engine never decides mathematics — it counts, dedupes, and hands the certifier what survived. ' + commas(T.certified || 0) + ' decisions this build.' },
    { x: oX[0], y: oY, w: oW, h: oH, role: 'held', k: 'HIT · CERTIFIED', v: commas(hits),
      t: 'HIT — a certificate exists',
      d: 'A HIT ships with its certificate: an explicit enclosure, an exact count, or an existence-and-uniqueness box, plus the falsifier the certificate must survive. ' + commas(hits) + ' this build.' },
    { x: oX[1], y: oY, w: oW, h: oH, role: 'sig', k: 'REJECT · PROVED', v: commas(rejects),
      t: 'REJECT — proved uninteresting',
      d: 'The certifier examined the candidate and proved it below the bar. A REJECT here is a theorem about the object, not a failed search. ' + commas(rejects) + ' this build.' },
    { x: oX[2], y: oY, w: oW, h: oH, role: 'warn', k: 'REFUSED · HONEST', v: commas(refused),
      t: 'REFUSED — absence of proof',
      d: 'The instrument declined to decide — a singular preconditioner, an exhausted budget, a containment that would not close. Absence of proof is never evidence of absence, and a refusal is never converted into a verdict. ' + commas(refused) + ' this build.' },
    { x: lx, y: ledgerY, w: lw, h: bandH, role: 'sig', k: 'LEDGER', v: 'ledger.json',
      t: 'the ledger',
      d: 'Everything the engine produced, as records on disk: ' + commas((ledger.conjectures || []).length) + ' conjectures kept with their enclosures and certificates. Every number in this drawing is read off the ledger at build time; nothing is typed in.' },
    { x: lx, y: huntY, w: lw, h: bandH, role: 'sig', k: 'CLOSED-FORM HUNT', v: commas(T.closedFormTested || 0) + ' tested',
      t: 'the closed-form hunt',
      d: 'Every certified enclosure is interrogated for small closed forms — rationals, square roots, multiples and powers of the standard constants. The enclosure decides: outside means refuted exactly, inside means a surviving candidate. Nothing is accepted on digits agreeing.' },
    { x: rX[0], y: rY, w: rW, h: rH, role: 'held', k: 'REFUTED EXACTLY', v: commas(T.closedFormRefuted || 0),
      t: 'refuted exactly',
      d: commas(T.closedFormRefuted || 0) + ' candidate closed forms proved wrong: the value provably lies outside a certified enclosure. The Ramanujan Machine matches truncated decimals and argues from collision probability; this decides.' },
    { x: rX[1], y: rY, w: rW, h: rH, role: 'warn', k: 'SURVIVORS · OPEN', v: commas(T.closedFormCandidates || 0) + ' candidates',
      t: 'the survivors',
      d: commas(T.closedFormCandidates || 0) + ' forms remain inside their enclosures — candidates, not results. They stay open until a tighter enclosure refutes them or an exact argument confirms them.' },
    { x: rX[0], y: gY, w: rW, h: rH, role: 'held', ...gatesNode },
    { x: rX[1], y: gY, w: rW, h: rH, role: 'dep', ...selfNode }
  ], instr);

  const edges = [
    /* every family column drops straight into the full-width ENUMERATE */
    ...colMid.flatMap((cx, c) => colBottom[c] === null ? [] : [
      { d: 'M' + cx + ' ' + colBottom[c] + ' L' + cx + ' ' + (enumY - 2) }
    ]),
    { d: 'M' + scx + ' ' + enumB + ' L' + scx + ' ' + (screenY - 2) },
    /* the record flow drops through the instrument row's centre channel */
    { d: 'M' + scx + ' ' + screenB + ' L' + scx + ' ' + (certY - 2),
      lab: 'dedup by key', lx: scx + 10, ly: screenB + 18, anchor: 'start' },
    /* the row feeds CERTIFY */
    ...iMid.map((cx) => ({ d: 'M' + cx + ' ' + iB + ' L' + cx + ' ' + (certY - 2) })),
    /* CERTIFY fans straight down to the three outcomes */
    ...oMid.map((cx) => ({ d: 'M' + cx + ' ' + certB + ' L' + cx + ' ' + (oY - 2) })),
    /* only a HIT reaches the ledger; REJECT and REFUSED are terminal */
    { d: 'M' + oMid[0] + ' ' + oB + ' L' + oMid[0] + ' ' + (ledgerMid - 8)
        + ' Q' + oMid[0] + ' ' + ledgerMid + ' ' + (oMid[0] + 8) + ' ' + ledgerMid
        + ' L' + (lx - 2) + ' ' + ledgerMid,
      lab: 'only certificates', lx: oMid[0] + 8, ly: Math.round((oB + ledgerMid) / 2), anchor: 'start' },
    { d: 'M' + lcx + ' ' + ledgerB + ' L' + lcx + ' ' + (huntY - 2) },
    /* the hunt's two endings */
    { d: 'M' + (lcx - 70) + ' ' + huntB + ' C' + (lcx - 70) + ' ' + (huntB + 18)
        + ' ' + rMid[0] + ' ' + (rY - 18) + ' ' + rMid[0] + ' ' + (rY - 2) },
    { d: 'M' + (lcx + 70) + ' ' + huntB + ' C' + (lcx + 70) + ' ' + (huntB + 18)
        + ' ' + rMid[1] + ' ' + (rY - 18) + ' ' + rMid[1] + ' ' + (rY - 2) },
    /* the ledger rebuilds the control page, down the right margin;
       the gates gate that same build */
    { d: 'M' + (lx + lw + 2) + ' ' + ledgerMid + ' L748 ' + ledgerMid
        + ' Q756 ' + ledgerMid + ' 756 ' + (ledgerMid + 8)
        + ' L756 ' + (gMid - 8) + ' Q756 ' + gMid + ' 748 ' + gMid
        + ' L' + (rX[1] + rW + 4) + ' ' + gMid },
    { d: 'M' + (rX[0] + rW + 2) + ' ' + gMid + ' L' + (rX[1] - 2) + ' ' + gMid }
  ];

  return C.flow({
    w: W, h: H,
    alt: 'Schematic of the conjecture engine: the families feed enumerate, screen and certify; the instruments decide; only certificates reach the ledger, which feeds the closed-form hunt and the pages.',
    readout: {
      k: 'the machine',
      d: 'Generate at scale, screen in float, certify the survivors exactly. Select any node for what it does — every count is read off ledger.json at build time.'
    },
    nodes, edges,
    caption: 'The loop this repository runs. Families supply objects and mathematics; the engine supplies scale and bookkeeping; the instruments alone decide. REJECT and REFUSED are terminal by design — only a certificate reaches the ledger, the gates run on every build, and every page is rebuilt from the ledger alone.'
  });
}

/* The COMPACT drawing, for the landing only: the spine and nothing else —
   enumerate (families folded into the band), screen, certify, the three
   outcomes, the ledger+gates. Five stops where the full drawing has twenty;
   the same narrations ride the readout, so nothing is dumbed down, only
   drawn smaller. Roughly a third of the full drawing's height. */
function machineFlowCompact(ledger, { gates }) {
  const T = ledger.totals || {};
  const F = ledger.families;
  const sum = (k) => F.reduce((t, f) => t + f.counts[k], 0);
  const screened = sum('screened'), hits = sum('hits'), rejects = sum('rejects'), refused = sum('refused');

  const W = 800, sx = 8, sw = W - 16, scx = sx + sw / 2, bandH = 50, gap = 30;
  const enumY = 10, enumB = enumY + bandH;
  const screenY = enumB + gap, screenB = screenY + bandH;
  const certY = screenB + gap, certB = certY + bandH;
  const oY = certB + 40, oH = 50, oW = 250, oX = [8, 274, 540], oB = oY + oH;
  const oMid = oX.map((x) => x + oW / 2);
  const ledgerY = oB + 42, H = ledgerY + bandH + 14;

  const nodes = [
    { x: sx, y: enumY, w: sw, h: bandH, role: 'sig',
      k: 'ENUMERATE · ' + F.length + ' FAMILIES', v: commas(T.generated || 0) + ' objects',
      t: 'enumerate — deterministic and indexed',
      d: F.length + ' families, one file and six functions each; every one enumerates by integer index, '
        + 'deterministically, so a run of any size resumes and reproduces. ' + commas(T.generated || 0)
        + ' objects this build. The full family table is on the control page.' },
    { x: sx, y: screenY, w: sw, h: bandH, role: 'sig', k: 'SCREEN · FLOAT', v: commas(screened) + ' pass',
      t: 'screen — float, and it may only prune',
      d: 'A fast float estimate decides only what is WORTH certifying. The screen may prune, never admit: '
        + 'nothing it passes is believed, and everything it passes goes to the certifier.' },
    { x: sx, y: certY, w: sw, h: bandH, role: 'sig', k: 'CERTIFY · EXACT', v: commas(T.certified || 0) + ' decided',
      t: 'certify — the only authority',
      d: 'The instruments decide: interval enclosures, exact rational arithmetic, strict interior containment '
        + 'for uniqueness. The engine never decides mathematics. ' + commas(T.certified || 0) + ' decisions this build.' },
    { x: oX[0], y: oY, w: oW, h: oH, role: 'held', k: 'HIT · CERTIFIED', v: commas(hits),
      t: 'HIT — a certificate exists',
      d: 'A HIT ships with its certificate: an explicit enclosure, an exact count, or an existence-and-uniqueness '
        + 'box, plus the falsifier the certificate must survive. ' + commas(hits) + ' this build.' },
    { x: oX[1], y: oY, w: oW, h: oH, role: 'sig', k: 'REJECT · PROVED', v: commas(rejects),
      t: 'REJECT — proved uninteresting',
      d: 'The certifier examined the candidate and proved it below the bar. A REJECT here is a theorem about the '
        + 'object, not a failed search. ' + commas(rejects) + ' this build.' },
    { x: oX[2], y: oY, w: oW, h: oH, role: 'warn', k: 'REFUSED · HONEST', v: commas(refused),
      t: 'REFUSED — absence of proof',
      d: 'The instrument declined to decide. Absence of proof is never evidence of absence, and a refusal is '
        + 'never converted into a verdict. ' + commas(refused) + ' this build.' },
    { x: sx, y: ledgerY, w: sw, h: bandH, role: 'held',
      k: 'LEDGER · THE GATES', v: 'ledger.json · ' + gates.green + '/' + gates.ran + ' batteries',
      t: 'the ledger, and the gates on every build',
      d: 'Only certificates reach ledger.json, where the closed-form hunt interrogates every enclosure. Every '
        + 'battery is executed at every control build, never remembered — ' + gates.green + '/' + gates.ran
        + ' green at this ledger\'s build — and red controls are deliberate forgeries the instruments must catch.' }
  ];

  const edges = [
    { d: 'M' + scx + ' ' + enumB + ' L' + scx + ' ' + (screenY - 2) },
    { d: 'M' + scx + ' ' + screenB + ' L' + scx + ' ' + (certY - 2),
      lab: 'dedup by key', lx: scx + 10, ly: screenB + 20, anchor: 'start' },
    ...oMid.map((cx) => ({ d: 'M' + cx + ' ' + certB + ' L' + cx + ' ' + (oY - 2) })),
    /* only a HIT reaches the ledger; REJECT and REFUSED are terminal */
    { d: 'M' + oMid[0] + ' ' + oB + ' L' + oMid[0] + ' ' + (ledgerY - 2),
      lab: 'only certificates', lx: oMid[0] + 10, ly: oB + 26, anchor: 'start' }
  ];

  return C.flow({
    w: W, h: H,
    alt: 'Compact schematic of the conjecture engine: enumerate across ' + F.length + ' families, screen in '
      + 'float, certify exactly, three outcomes, and only certificates reach the ledger the gates guard.',
    readout: {
      k: 'the machine',
      d: 'Generate at scale, screen in float, certify the survivors exactly. Select any stage for what it does — '
        + 'every count is read off ledger.json at build time.'
    },
    nodes, edges,
    caption: 'The loop, in five stops. The screen may only prune; the instruments alone decide; REJECT and '
      + 'REFUSED are terminal by design. The full drawing — every family, every instrument, the closed-form '
      + 'hunt — is on the control page.'
  });
}

module.exports = { machineFlow, machineFlowCompact };
