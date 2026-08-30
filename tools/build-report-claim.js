#!/usr/bin/env node
/* build-report-claim.js — reports/claim-<id>.html, one page per lane.

   The flagship (reports/ai-claims-audit.html) carries the board and the
   finding. These six carry the evidence: for each claim, the verifier's OWN
   check ledger as it printed it at this build, the named falsifiers, and the
   boundary the audit did not cross.

   Nothing here is transcribed. Every row below is a line the verifier emitted
   during this build, parsed by instruments/laneaudit/audit.js — the same
   module the flagship consumes, so the two pages cannot disagree.

   usage: node tools/build-report-claim.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const AUDIT = require(path.join(ROOT, 'instruments', 'laneaudit', 'audit.js'));

const die = (m) => { console.error('CLAIM REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

let L;
try { L = AUDIT.run(); } catch (e) { die(e.message); }
if (L.some(r => r.verdict === 'REFUTED')) die('a lane came back REFUTED — stop and write it up');

const VT = { CONFIRMED: 'held', PARTIAL: 'open', REFUTED: 'dep' };
const num = (v) => v === null ? '—' : String(v);
const ms = (v) => v === null ? 'sub-millisecond' : (v >= 1000 ? (v / 1000).toFixed(1) + ' s' : v + ' ms');

/* The verifier's rows carry bracketed measurements and arrows; they are DATA
   off a child process, so they go through esc() like any other value. */
const rowsTable = (items, head) => C.table({
  cols: [{ h: '', cls: 'n' }, { h: head }],
  rows: items.map((t, i) => [String(i + 1), t])
});

for (const r of L) {
  const other = L.filter(x => x.id !== r.id);
  const lg = r.ledger;
  const B = [];

  B.push(C.header({
    eyebrow: 'cert-machine · one of six · re-verified from the manuscript',
    title: r.short,
    deck: r.claim + ' ' + r.problem
  }));

  B.push(C.tldr({
    findingRaw: '<strong>' + r.verdict + '</strong> — ' + C.esc(r.scope) + '. '
      + (r.verdict === 'PARTIAL'
        ? 'Every machine-checkable fragment of this claim holds; the argument that carries the theorem does not reduce to arithmetic and was not audited.'
        : 'What a machine can decide about this claim, it decided, and it held. What it cannot decide is stated below rather than left to the reader to notice.'),
    mechanismRaw: 'Written against the manuscript. The author\'s code was never executed'
      + (r.id === 'mathieu' ? ' — though in this lane, and only this one, it was <em>read</em> to cross-check which identities the TeX intended' : '')
      + '. ' + C.esc(r.sourceCheck ? 'Verification that existed at source: ' + r.sourceCheck : ''),
    checkRaw: C.m('node legacy/research/challenges/lane/' + r.dir + '/verify.js') + ' — '
      + ms(r.ms) + ' at this build, '
      + (r.rows === null ? 'a summary report' : r.rows + ' named checks')
      + ' and ' + r.mutations + ' mutation controls, every control rejected.'
  }));

  B.push(C.stats([
    { k: 'verdict', v: r.verdict, role: r.verdict === 'PARTIAL' ? 'open' : 'held', n: r.scope },
    { k: 'named checks', v: num(r.rows), role: 'held',
      n: r.rows === null ? 'this verifier reports a summary, not named rows — see below' : 'each one printed by the verifier at this build and listed on this page' },
    { k: 'the verifier\'s own total', v: num(r.reported), role: 'held',
      n: r.reported === null ? 'this verifier prints no total of its own' : (r.reported !== r.rows && r.rows !== null ? 'its total folds the ' + r.mutations + ' mutation controls in; ours does not' : 'stated by the verifier itself') },
    { k: 'mutation controls', v: String(r.mutations), role: 'held', n: 'deliberate corruptions of the claim — every one rejected, or this page would not build' },
    { k: 'runtime', v: ms(r.ms), role: 'held', n: 'plain Node, no packages, no author code' },
    { k: 'analytic core', v: 'not audited', role: 'open', n: 'true of all six claims in this set, and the reason the flagship exists' },
  ]));

  /* ---- §1 the claim at source ------------------------------------------- */
  B.push(C.section({
    lab: '§1 · at source', title: 'What was claimed, by whom, and what checking already existed',
    bodyRaw: C.table({
      cols: [{ h: 'field', cls: 'k' }, { h: 'as recorded at source' }],
      rows: [
        ['the claim', r.claim],
        ['the problem', r.problem],
        ['credited AI system', r.system],
        ['verification at source', r.sourceCheck],
        ['our verdict', { raw: C.tag(r.verdict, VT[r.verdict]) + ' ' + C.tag(r.scope, 'dep') }],
      ]
    })
  }));

  /* ---- §2 what was certified -------------------------------------------- */
  const stageFig = lg.stages.length >= 2 ? C.figure({
    svgRaw: CH.bars({
      w: 900, padL: 300, padR: 70,
      max: Math.max.apply(null, lg.stages.map(s => s.checks.length)) + 1,
      xTicks: [0, 5, 10, 15, 20].filter(v => v <= Math.max.apply(null, lg.stages.map(s => s.checks.length)) + 1).map(v => ({ v })),
      xLabel: 'named checks in each stage of the verifier\'s own run',
      alt: 'Bar chart of named checks per stage for ' + r.short + ': '
        + lg.stages.map(s => s.title + ' ' + s.checks.length).join(', ') + '.',
      rows: lg.stages.map(s => ({
        k: s.title.length > 32 ? s.title.slice(0, 31) + '…' : s.title,
        v: s.checks.length, lab: String(s.checks.length), token: CH.CAT[0],
        hover: s.checks.length + ' named checks in stage [' + s.n + ']'
      }))
    }),
    caption: 'The verifier organises its own run into ' + lg.stages.length + ' stages. This is that structure, '
      + 'counted at build time — not a summary written by hand.'
  }) : '';

  let evidence;
  if (lg.shape === 'staged') {
    /* one table per stage, the stage name carried by the table's own header —
       a builder does not hand-write headings, it passes data to components */
    evidence = stageFig + lg.stages.filter(s => s.checks.length).map(s =>
      rowsTable(s.checks, '[' + s.n + ']  ' + s.title)
    ).join('\n');
  } else if (lg.shape === 'flat') {
    evidence = '<div class="col">' + C.pRaw('This verifier prints one flat list rather than stages. All '
      + lg.flat.length + ' named rows follow, in the order it emitted them.') + '</div>'
      + rowsTable(lg.flat, 'what the verifier proved');
  } else {
    evidence = '<div class="col">'
      + C.pRaw('<strong>This verifier reports a summary rather than named rows.</strong> It states its own '
        + 'totals and its mutation-control outcome and stops there, so there is no per-check ledger to show '
        + 'and this page does not manufacture one. Its complete output at this build is reproduced verbatim:')
      + C.code(lg.raw) + '</div>';
  }

  B.push(C.section({
    lab: '§2 · what we certified', title: 'The ledger, as the verifier printed it at this build',
    bodyRaw: '<div class="col">' + C.pRaw(C.esc(r.checked)) + '</div>' + evidence
  }));

  /* ---- §3 the falsifiers ------------------------------------------------- */
  B.push(C.section({
    lab: '§3 · the falsifiers', title: 'Proof that this verifier can fail',
    bodyRaw: '<div class="col">' + C.pRaw('A verifier that cannot reject a false claim is not evidence, it is '
      + 'decoration. So each one carries mutation controls: the claim is deliberately corrupted and the '
      + 'verifier must refuse it. All ' + r.mutations + ' were rejected in the run that built this page, and a '
      + 'control that stopped firing would refuse the page instead.') + '</div>'
      + (lg.controls.length
        ? rowsTable(lg.controls, 'the corruption, and how it was caught')
        : '<div class="col">' + C.pRaw('This verifier reports ' + r.mutations + ' controls rejected as a count '
          + 'rather than naming them individually, so there is nothing to list here beyond that count. The '
          + 'count is parsed from its output, not asserted.') + '</div>')
  }));

  /* ---- §4 the boundary --------------------------------------------------- */
  B.push(C.section({
    lab: '§4 · the boundary', title: 'What this audit did NOT reach',
    bodyRaw: C.note({ lab: 'not audited', bodyRaw: C.pRaw(C.esc(r.notChecked)) })
      + '<div class="col">' + C.pRaw('This is the part worth reading twice. The verdict at the top of this '
        + 'page is true inside its scope line and false outside it, and the sentence above is where the '
        + 'scope line comes from. Across all six claims in this set the same split appears: the computational '
        + 'fragment certifies and the analytic core does not — '
        + '<a href="/reports/ai-claims-audit.html">the flagship page measures exactly that</a>.') + '</div>'
  }));

  /* ---- §5 re-run --------------------------------------------------------- */
  B.push(C.section({
    lab: '§5 · re-run it', title: 'One command, no dependencies',
    bodyRaw: '<div class="col">'
      + C.code('git clone https://github.com/carlostoledo1891/cert-machine\ncd cert-machine\nnode legacy/research/challenges/lane/' + r.dir + '/verify.js')
      + C.pRaw('Plain Node, no packages. It prints the ledger above, runs its own falsifiers, and exits '
        + 'non-zero if anything fails. ' + C.m('node instruments/laneaudit/audit.js') + ' runs all six.')
      + '</div>'
      + C.cards(other.map(x => ({
        href: '/reports/claim-' + x.id + '.html',
        k: x.verdict + (x.rows === null ? '' : ' · ' + x.rows + ' checks'),
        title: x.short, desc: x.claim,
        n: x.scope
      })))
  }));

  const foot = '<footer class="col"><p>Generated by tools/build-report-claim.js @ git ' + git
    + '. Every row on this page was printed by ' + 'legacy/research/challenges/lane/' + r.dir + '/verify.js '
    + 'during this build and parsed by instruments/laneaudit/audit.js — the same module the flagship reads, '
    + 'so the two pages cannot quote different numbers. A failing check or a mutation control that stopped '
    + 'firing would refuse this page.</p></footer>';

  fs.writeFileSync(path.join(ROOT, 'reports', 'claim-' + r.id + '.html'),
    TPL.render({
      title: r.short + ' — re-verified',
      bodyRaw: B.join('\n\n') + CH.script(),
      footRaw: foot,
      path: '/reports/claim-' + r.id + '.html',
      desc: r.short + ': ' + r.claim + ' Re-verified here from the manuscript — ' + r.verdict
        + ', ' + r.scope + '. The full check ledger, the falsifiers, and the boundary the audit did not cross.'
    }));
}

console.log('six claim pages written: ' + L.map(r => 'claim-' + r.id + '.html').join(', ') + ' @ git ' + git);
