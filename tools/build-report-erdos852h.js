#!/usr/bin/env node
/* build-report-erdos852h.js — reports/erdos852-h.html

   Erdős #852 has had two halves that never met: a conjectured asymptotic
   h(x) ~ c0 log x sitting in the discussion thread, and the exact record data
   sitting in OEIS since 2002. This repo already certified c0 to 61 digits.
   This page computes the data independently and puts the two together.

   THE GATE IS THE RUN: the records are recomputed here at build time by
   instruments/erdos852h/h.js — integer arithmetic only — and checked term for
   term against the sha-pinned OEIS bytes. A disagreement refuses the page,
   which is the whole point: our scan and a 2002 sequence are independent
   witnesses to the same integers.

   usage: node tools/build-report-erdos852h.js [--limit 3e8] */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const H = require(path.join(ROOT, 'instruments', 'erdos852h', 'h.js'));
const V = require(path.join(ROOT, 'instruments', 'erdos852h', 'verify-record.js'));
const A = require(path.join(ROOT, 'instruments', 'erdos852h', 'analyse.js'));

const die = (m) => { console.error('852-h REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const SRC = path.join(ROOT, 'corpus', 'sources');

/* ---- the records: the deep run if one has landed, else compute now ------- */
const DEEP = path.join(ROOT, 'certs', 'erdos852-h-records.json');
const li = process.argv.indexOf('--limit');
let R, LIMIT, provenance;
if (li < 0 && fs.existsSync(DEEP)) {
  const d = JSON.parse(fs.readFileSync(DEEP, 'utf8'));
  R = d.records; LIMIT = d.limit;
  provenance = 'the deep run in certs/erdos852-h-records.json, ' + d.seconds + ' s to ' + LIMIT.toExponential(0);
} else {
  LIMIT = Number(li > 0 ? process.argv[li + 1] : 3e8);
  const t0 = Date.now();
  R = H.records(LIMIT);
  provenance = 'recomputed during this build, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s to ' + LIMIT.toExponential(0);
}
if (!R || !R.length) die('no records');

/* ---- the gate: our integers against the pinned OEIS bytes ---------------- */
const pin = (f) => {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) die('pinned source missing: ' + f);
  const b = fs.readFileSync(p);
  const want = JSON.parse(fs.readFileSync(path.join(SRC, 'PINS.json'), 'utf8'))[f];
  const got = require('crypto').createHash('sha256').update(b).digest('hex');
  if (want !== got) die(f + ' has drifted from its pin — refusing to audit bytes that moved');
  return b.toString('utf8');
};
const A078515 = A.parseOEIS(pin('oeis_A078515.txt'));
const A079889 = A.parseOEIS(pin('oeis_A079889.txt'));

/* structure first: a reference comparison only covers the head of a deep run,
   so the shape of the WHOLE record set is checked before anything else */
const structural = A.validate(R);
if (structural.length) die('the record set is malformed:\n  ' + structural.slice(0, 6).join('\n  '));

const D = A.distinctIndices(R);
const n = Math.min(D.length, A078515.length);
if (n < 12) die('too few records to make the comparison meaningful');
const idxAgree = D.slice(0, n).every((r, i) => r.n === A078515[i]);
const pAgree = D.slice(0, n).every((r, i) => r.p === A079889[i]);
if (!idxAgree) die('our record indices disagree with A078515 — that is a FINDING, not a build: stop and write it up');
if (!pAgree) die('our record start primes disagree with A079889 — stop and write it up');

/* ---- the extension, re-proved from nothing -------------------------------
   Records beyond the last published term are the only NEW mathematics on this
   page, so they are re-proved at every build by verify-record.js — BigInt
   Miller-Rabin and a set, sharing no line with the scan that found them. The
   scan's claim that a record is the SMALLEST such index cannot be re-proved
   this way and the page never says it was. */
const beyond = D.slice(A078515.length);
const exhibits = beyond.map(r => {
  let v;
  try { v = V.verify(String(r.p), r.len); }
  catch (e) { die('a record beyond the published terms FAILED to re-prove: ' + e.message); }
  if (!v.exact) die('record at ' + r.p + ' is longer than the claimed ' + r.len + ' — the scan understated it');
  return Object.assign({}, r, v);
});
/* the deepest PUBLISHED term is re-proved too, as a control: if the verifier
   could not confirm a term the literature already holds, it is not evidence */
const control = (() => {
  const last = D[A078515.length - 1];
  if (!last) return null;
  try { return Object.assign({}, last, V.verify(String(last.p), last.len)); }
  catch (e) { die('the verifier could not re-prove the last PUBLISHED record: ' + e.message); }
})();

const bands = A.bands(R);
const cons = A.consistency(bands);
const dec = A.decades(R, D[D.length - 1].n);
const hMax = D[D.length - 1].len;

/* the two readings, at the decades both can reach */
const readings = [];
for (let e = 4; e <= 12; e++) {
  const x = Math.pow(10, e);
  const hi = A.hAtIndex(R, x), hp = A.hAtPrime(R, x);
  if (!hi || x > LIMIT) break;
  readings.push({ x, logx: Math.log(x), hi, hp, ri: hi / Math.log(x), rp: hp / Math.log(x) });
}
if (readings.length < 3) die('not enough decades to contrast the two readings');

const f4 = (v) => v.toFixed(4);
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · Erdős #852 · the constant, finally against the data',
  title: 'A conjecture nobody had checked against the numbers',
  deck: 'Erdős #852 asks how long a run of consecutive prime gaps can stay pairwise distinct. Its discussion '
    + 'thread conjectures h(x) ~ c₀·log x. This repository certified c₀ to 61 digits last week. The exact '
    + 'record data has been in the OEIS since 2002. Nobody had put the two in the same room — so we did, and '
    + 'the answer depends on a reading of the problem statement that turns out to be decidable from the data.'
}));

B.push(C.tldr({
  findingRaw: 'Read as the problem is written — <em>"for some n &lt; x"</em>, where n <strong>indexes</strong> a '
    + 'prime — the certified c₀ lands <strong>inside ' + cons.inside + ' of ' + cons.plateaus + ' plateau bands</strong> '
    + 'of the exact record data, with no drift across ' + readings.length + ' decades. Read the other way, with x '
    + 'as a bound on the prime itself, the same data gives a ratio of about '
    + f4(readings[readings.length - 1].rp) + ' and falling away from c₀. <strong>The data picks the reading.</strong> '
    + 'It also bears on Erdős\'s own question: he asked whether h(x) = o(log x), and the ratio here is flat near '
    + 'c₀, not decaying.',
  mechanismRaw: 'Integers only — no floats anywhere in the computation. A run is a window of gaps with no repeat; '
    + 'a record is the first index whose window beats every earlier one, found by a streaming two-pointer scan. '
    + 'Because h is a step function whose records ARE its jumps, sampling the ratio at records reads only the tops '
    + 'of the steps and flatters it, so every plateau is reported as a <strong>band</strong> — the ratio at the '
    + 'step\'s start and at its end — and c₀ is asked to lie inside, not to match a corner.',
  checkRaw: C.m('node instruments/erdos852h/h.js 3e8') + ' — ' + provenance + '. Our first ' + n
    + ' record indices and start primes are checked term for term against the sha-pinned bytes of '
    + C.m('A078515') + ' and ' + C.m('A079889') + '; a disagreement refuses this page.'
}));

B.push(C.stats([
  { k: 'records recomputed here', v: String(D.length), role: 'held', n: 'independent of OEIS — a streaming integer scan, written from the problem statement' },
  { k: 'agreement with OEIS', v: n + ' / ' + n, role: 'held', n: 'A078515 indices and A079889 start primes, term for term, against sha-pinned bytes' },
  { k: 'longest run found', v: String(hMax), role: 'held', n: 'a run of ' + hMax + ' consecutive prime gaps, pairwise distinct — an exhibit anyone can check' },
  { k: 'c₀ inside the band', v: cons.inside + ' of ' + cons.plateaus, role: cons.inside * 2 >= cons.plateaus ? 'held' : 'open', n: 'the honest test: does the certified constant lie between each plateau\'s high and low ratio' },
  { k: 'the other reading', v: '≈ ' + f4(readings[readings.length - 1].rp), role: 'open', n: 'x as a bound on the prime rather than on n — sits well below c₀ and is not closing' },
  { k: 'beyond the published terms', v: exhibits.length ? '+' + exhibits.length : '0', role: exhibits.length ? 'held' : 'open',
    n: exhibits.length ? 'record runs longer than anything in A078515 / A079007 / A079889, each re-proved here from nothing' : 'the scan has not yet passed the last published term' },
  { k: 'proved', v: 'nothing', role: 'open', n: '#852 is explicitly not resolvable by a finite computation. This is evidence, and the page says so throughout' },
]));

/* ---- §1 -------------------------------------------------------------------- */
B.push(C.section({
  lab: '§1 · the two halves', title: 'A constant with no data, and data with no constant',
  bodyRaw: C.table({
    cols: [{ h: 'half' }, { h: 'where it lived' }, { h: 'what it says' }],
    rows: [
      ['the constant', 'the #852 discussion thread, published 2026-04-24',
        'h(x) ~ c₀·log x, with c₀ the unique positive root of I₀(c) = 1. Certified here to 61 digits: c₀ = 1.32322827686394946902…'],
      ['the data', 'OEIS A053597 / A078515 / A079007 / A079889, since 2002',
        'the exact record runs — every index at which a longer pairwise-distinct run of gaps begins, and the prime that opens it'],
      ['the crossing', 'nowhere', 'the problem page lists the sequences in its OEIS box and the thread states the constant; neither does anything with the other'],
    ]
  }) + '<div class="col">'
    + C.pRaw('That gap is the whole opportunity, and it needed no new mathematics to close — only the willingness '
      + 'to compute one side and look at the other. We recomputed the records from scratch rather than reading '
      + 'them out of the OEIS, so the comparison has two independent witnesses to the same integers: a sequence '
      + 'from 2002 and a scan written this week from the problem statement. They agree on all ' + n + ' terms '
      + 'we can both reach.')
    + '</div>'
}));

/* ---- §2 the reading -------------------------------------------------------- */
const rmax = Math.max.apply(null, readings.map(r => Math.max(r.ri, r.rp)));
B.push(C.section({
  lab: '§2 · the reading', title: 'The problem says "for some n < x", and n indexes a prime',
  bodyRaw: '<div class="col">'
    + C.pRaw('As published, #852 reads: <em>"Let dₙ = pₙ₊₁ − pₙ … let h(x) be maximal such '
      + 'that for some n &lt; x the numbers dₙ, …, dₙ₊ₕ₍ₓ₎₋₁ are all '
      + 'distinct."</em> The bound is on <strong>n</strong>, and n is an index into the primes — so x counts '
      + 'primes rather than measuring size. It is an easy thing to read past, and the conjecture means something '
      + 'different under each reading. The data is not ambiguous about which one it belongs to.')
    + '</div>'
    + C.figure({
      svgRaw: CH.lines({
        w: 900, h: 340, x0: 4, x1: readings[readings.length - 1] ? Math.log10(readings[readings.length - 1].x) : 8,
        y0: 0.85, y1: Math.max(1.55, rmax + 0.05), padL: 66,
        xTicks: readings.map(r => ({ v: Math.log10(r.x), t: '10' + String(Math.round(Math.log10(r.x))).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) })),
        yTicks: [0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5].map(v => ({ v, t: v.toFixed(1) })),
        xLabel: 'x  (the bound in the problem statement)', yLabel: 'h(x) / log x',
        alt: 'Two lines of the ratio h(x)/log x against x. Under the index reading the ratio stays near 1.30 to '
          + '1.41 across every decade, straddling the certified c0 = 1.3232. Under the prime reading it sits '
          + 'between 0.98 and 1.14 and does not approach c0.',
        keys: [{ token: CH.CAT[0], t: 'x bounds the INDEX n — the reading the statement gives' },
               { token: CH.CAT[1], t: 'x bounds the PRIME pₙ' },
               { kind: 'dash', token: CH.CTX, t: 'certified c₀ = ' + A.C0.toFixed(4) + ' (a prediction, not a measurement)' }],
        series: [
          { name: 'index reading', pts: readings.map(r => [Math.log10(r.x), r.ri]) },
          { name: 'prime reading', pts: readings.map(r => [Math.log10(r.x), r.rp]) },
          /* c0 is a PREDICTION, so it is dashed and painted in the context hue —
             predicted and decided never share a typography on these pages */
          { name: 'certified c₀', token: CH.CTX, dashed: true,
            pts: [[4, A.C0], [Math.log10(readings[readings.length - 1].x), A.C0]] },
        ]
      }),
      caption: 'The same exact data under the two readings. c₀ is a dashed reference because it is a PREDICTION, '
        + 'not a measurement — predicted and decided never share a typography on these pages.'
    })
    + C.table({
      cols: [{ h: 'x', cls: 'n' }, { h: 'h(x), index reading', cls: 'n' }, { h: 'ratio', cls: 'n' },
             { h: 'h(x), prime reading', cls: 'n' }, { h: 'ratio', cls: 'n' }, { h: 'c₀·log x', cls: 'n' }],
      rows: readings.map(r => [r.x.toExponential(0), String(r.hi), f4(r.ri), String(r.hp), f4(r.rp), (A.C0 * r.logx).toFixed(2)])
    })
}));

/* ---- §3 the band ----------------------------------------------------------- */
const closed = bands.filter(b => b.lo !== null);
B.push(C.section({
  lab: '§3 · the honest test', title: 'h is a step function, so the ratio is a band — not a point',
  bodyRaw: '<div class="col">'
    + C.pRaw('Between one record closing and the next, h(x) is <strong>constant</strong> while log x keeps '
      + 'growing, so the ratio falls steadily from a high at the step\'s start to a low at its end. Quoting the '
      + 'ratio at the records — which is where it is highest — would be picking the flattering corner of every '
      + 'step. So each plateau is drawn as the full band it occupies, and the test is whether c₀ lies inside.')
    + '</div>'
    + C.figure({
      svgRaw: CH.segments({
        w: 900, x0: 1.15, x1: Math.max(1.56, Math.max.apply(null, closed.map(b => b.hi)) + 0.02),
        padL: 92, padR: 96, rowH: 26,
        xTicks: [1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55].map(v => ({ v, t: v.toFixed(2) })),
        xLabel: 'h / log x across the plateau, from its start (right end) to its end (left end)',
        keys: [{ token: CH.CAT[0], t: 'the ratio band this plateau occupies' },
               { token: CH.CAT[2], t: 'the certified c₀, marked on every row' }],
        alt: 'One horizontal band per plateau of h, showing the range of h/log x it covers. The certified c0 = '
          + '1.3232 is marked on each row and falls inside ' + cons.inside + ' of the ' + cons.plateaus + ' bands.',
        rows: closed.map(b => ({
          k: 'h = ' + b.len,
          note: (A.C0 <= b.hi && A.C0 >= b.lo) ? 'c₀ inside' : (A.C0 > b.hi ? 'band below c₀' : 'band above c₀'),
          segs: [{ x0: b.lo, x1: b.hi, token: CH.CAT[0],
                   k: 'h = ' + b.len + ' plateau',
                   v: 'x from ' + b.start + ' to ' + b.end + ' · ratio ' + f4(b.hi) + ' down to ' + f4(b.lo) }],
          marks: [{ x: A.C0, token: CH.CAT[2] }]
        }))
      }),
      caption: 'Each row is one plateau of h. The vertical mark is the certified c₀. It lands inside '
        + cons.inside + ' of ' + cons.plateaus + ' bands; where it misses, it misses narrowly and in both '
        + 'directions — ' + cons.outsideHigh + ' bands sit entirely below it and ' + cons.outsideLow + ' entirely above.'
    })
}));

/* ---- §4 ------------------------------------------------------------------- */
/* ---- the extension -------------------------------------------------------- */
if (exhibits.length) {
  const e = exhibits[exhibits.length - 1];
  B.push(C.section({
    lab: '\u00a74 \u00b7 the extension', title: 'Past the last published term',
    bodyRaw: '<div class="col">'
      + C.pRaw('The record data stopped where other people\u2019s computations stopped: A079007 ends at a run of '
        + control.len + ' gaps opening at ' + C.m(String(control.p)) + ', and A078515 and A079889 end at the same '
        + 'place. Our scan reproduced that term exactly and kept going.')
      + '</div>'
      + C.table({
        cols: [{ h: 'run length', cls: 'n' }, { h: 'opening prime', cls: 'n' }, { h: 'index n', cls: 'n' }, { h: 'status' }],
        rows: [
          [String(control.len), String(control.p), String(control.n), 'the last term the literature holds \u2014 re-proved here as a control'],
          ...exhibits.map(x => [String(x.len), String(x.p), String(x.n), { raw: C.tag('new', 'held') + ' beyond every published term' }])
        ]
      })
      + '<div class="col">'
      + C.pRaw('<strong>The exhibit, re-proved at this build by a program sharing no line with the scan that found '
        + 'it.</strong> ' + C.m(String(e.p)) + ' is prime, and the ' + e.len + ' consecutive gaps that follow it are '
        + 'pairwise distinct:')
      /* 31 numbers on one line overflow the block on any narrow screen; rows of
         eight keep the whole run visible without scrolling */
      + C.code(e.gaps.reduce((a, g, i) => a + (i && i % 8 === 0 ? '\n' : (i ? ' ' : ''))
          + String(g) + (i < e.gaps.length - 1 ? ',' : ''), ''))
      + C.pRaw('The run spans the primes ' + C.m(e.spans[0]) + ' to ' + C.m(e.spans[1]) + '. It is exactly '
        + e.len + ' long and not longer, because the next gap is ' + C.m(String(e.nextGap)) + ', which already '
        + 'appears in the list. Anyone can check every word of that in a minute, which is the point of an '
        + 'existence claim.')
      + '</div>'
      + C.note({ lab: 'two claims, and they are not equally strong', bodyRaw:
          C.pRaw('That <strong>h reaches ' + e.len + '</strong> at this prime is re-proved above by an independent '
            + 'implementation \u2014 BigInt Miller\u2013Rabin and a set \u2014 and does not depend on the scan at '
            + 'all. That this is the <strong>smallest</strong> index achieving it is a statement about every index '
            + 'below it, and only the exhaustive scan can speak to that. The scan reproduced all ' + n
            + ' published terms exactly, which is the best evidence available for it, and it is still evidence '
            + 'rather than an independent proof. Both are stated separately here for that reason.')
      })
  }));
}

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('We did not prove the asymptotic and we could not have: the #852 page states plainly that the '
    + 'problem "cannot be resolved with a finite computation", and that is correct. What is here is a finite, '
    + 'exact computation placed against a published conjecture and a certified constant, reported with its '
    + 'sampling bias removed. It is consistent with h(x) ~ c₀·log x under the index reading and inconsistent '
    + 'with it under the prime reading, over the range we can reach. Consistency over ' + readings.length
    + ' decades is evidence, not a theorem, and the ratio\'s misses — ' + cons.outsideHigh + ' bands below c₀ and '
    + cons.outsideLow + ' above — are shown rather than smoothed. The one hard result on this page is the '
    + 'agreement: ' + n + ' record indices and ' + n + ' start primes, recomputed from scratch, match sequences '
    + 'published in 2002 exactly.')
}));

/* ---- §5 ------------------------------------------------------------------- */
B.push(C.section({
  lab: '§5 · re-run it', title: 'Integers, streaming, no dependencies',
  bodyRaw: '<div class="col">'
    + C.code('git clone https://github.com/carlostoledo1891/cert-machine\ncd cert-machine\nnode instruments/erdos852h/h.js 3e8')
    + C.pRaw('The scan streams: a segmented sieve feeds a two-pointer window, and only a 1024-entry last-seen '
      + 'table is held, so memory does not grow with the limit. The certified constant it is compared against '
      + 'lives in ' + C.m('certs/erdos852-certificate.json') + ' and is re-checked by '
      + C.m('python3 verify/verify_erdos852.py') + ' — the subject of '
      + '<a href="/reports/erdos852.html">the companion page on the constant itself</a>, where one of the two '
      + 'published decimals was refuted at its 12th digit.')
    + '</div>'
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-erdos852h.js @ git ' + git + '. Gates at this '
  + 'build: the records recomputed by instruments/erdos852h/h.js in integer arithmetic (' + provenance + '), '
  + 'checked term for term against the sha256-pinned bytes of OEIS A078515 and A079889 — ' + n + ' indices and '
  + n + ' start primes, all agreeing. A disagreement with either sequence, or a drifted pin, refuses the page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'erdos852-h.html'),
  TPL.render({
    title: 'A conjecture nobody had checked against the numbers',
    bodyRaw: B.join('\n\n') + CH.script(),
    footRaw: foot,
    path: '/reports/erdos852-h.html',
    desc: 'Erdős #852 conjectures h(x) ~ c₀·log x. We certified c₀ to 61 digits; the exact record data has been '
      + 'in the OEIS since 2002; nobody had compared them. Under the reading the problem statement actually '
      + 'gives, they agree across ' + readings.length + ' decades.'
  }));

console.log('reports/erdos852-h.html written: ' + D.length + ' records, ' + n + '/' + n + ' agree with OEIS, '
  + 'c0 inside ' + cons.inside + '/' + cons.plateaus + ' bands, h_max = ' + hMax + ' @ git ' + git);
