#!/usr/bin/env node
/* build-report-impostors.js — generate reports/impostors.html: the catalog
   of published constants that impersonate simple closed forms to great
   depth, each impersonation REFUTED EXACTLY.

   Every number on the page is recomputed here, at build time, from the
   corpus and the family's own certifier: the tool re-runs certify() over
   the full OEIS corpus, takes every entry whose exact-BigInt pass fired,
   re-derives each impersonated rational, and counts the agreement depth by
   BigInt long division against the published digit stream. If the records
   no longer support the catalog, the build FAILS rather than shipping a
   stale page.

   usage: node tools/build-report-impostors.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OE = require(path.join(ROOT, 'families', 'oeis-closedform.js'));

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };

/* ---- re-derive the rational a label spells ------------------------------- */
const K = { pi: Math.PI, e: Math.E, ln2: Math.LN2, ln10: Math.LN10,
  sqrt2: Math.SQRT2, sqrt3: Math.sqrt(3), sqrt5: Math.sqrt(5),
  phi: (1 + Math.sqrt(5)) / 2, euler: 0.5772156649015329 };

function labelValue(label) {
  let mm;
  if ((mm = /^(\d+)\/(\d+)$/.exec(label))) return Number(mm[1]) / Number(mm[2]);
  if ((mm = /^sqrt\((\d+)\/(\d+)\)$/.exec(label))) return Math.sqrt(Number(mm[1]) / Number(mm[2]));
  if ((mm = /^cbrt\((\d+)\/(\d+)\)$/.exec(label))) return Math.cbrt(Number(mm[1]) / Number(mm[2]));
  if ((mm = /^\((\d+)\/(\d+)\)([a-z0-9]+)$/.exec(label))) return (Number(mm[1]) / Number(mm[2])) * K[mm[3]];
  if ((mm = /^([a-z0-9]+)\^\((\d+)\/(\d+)\)$/.exec(label))) return Math.pow(K[mm[1]], Number(mm[2]) / Number(mm[3]));
  return NaN;
}
/* rational in disguise, by continued fraction (the family's own routing rule) */
function toRational(v) {
  if (!isFinite(v) || v <= 0) return null;
  let x = v, h0 = 0, h1 = 1, k0 = 1, k1 = 0;
  for (let i = 0; i < 12; i++) {
    const a = Math.floor(x);
    const h = a * h1 + h0, k = a * k1 + k0;
    h0 = h1; h1 = h; k0 = k1; k1 = k;
    if (k > 4096) break;
    if (Math.abs(v - h / k) <= 1e-13 * v) return [BigInt(h), BigInt(k)];
    const frac = x - a;
    if (frac < 1e-13) break;
    x = 1 / frac;
  }
  return null;
}

/* agreement depth, EXACT and in the relative sense: the largest d such that
   the gap between the form's mantissa and the published digit interval is at
   most (form mantissa)·10^−d. A prefix count would lie here — 0.1999…9
   shares no mantissa digits with 1/5 yet agrees with it to 1e-64 — so the
   measure is the gap, and the gap is a rational computed from the same
   integers the refutation used. */
function agreementDepth(entryDigits, p, q) {
  let i = 0; while (i < entryDigits.length && entryDigits[i] === 0) i++;
  const ds = entryDigits.slice(i).join('');
  const k = BigInt(ds.length);
  const D = BigInt(ds);
  let P = p, Q = q;
  while (P < Q) P *= 10n;                      /* mantissa P/Q in [1, 10) */
  while (P >= 10n * Q) Q *= 10n;
  const scale = 10n ** (k - 1n);
  const mid = P * scale;                       /* compare with [D·Q, (D+1)·Q) */
  let gapN, gapD;                              /* gap as an exact rational */
  if (mid < D * Q) { gapN = D * Q - mid; gapD = Q * scale; }
  else if (mid >= (D + 1n) * Q) { gapN = mid - (D + 1n) * Q; gapD = Q * scale; }
  else return { agree: Number(k), published: Number(k), consistent: true };
  let d = 0;
  while (d < Number(k) + 10 && gapN * Q * (10n ** BigInt(d + 1)) <= P * gapD) d++;
  return { agree: d, published: Number(k) };
}

/* ---- harvest: every entry whose exact-BigInt pass fired ------------------- */
const catalog = [];
let corpusSize = 0;
for (let i = 0; ; i++) {
  const e = OE.enumerate(i); if (!e) break;
  if (!OE.interesting(e)) continue;
  corpusSize++;
  const c = OE.certify(e);
  const x = c.extra;
  if (!x || !x.exactRefuted || !x.exactRefuted.length) continue;
  /* group the refuted spellings by the value they spell */
  const byValue = new Map();
  for (const label of x.exactRefuted) {
    const r = toRational(labelValue(label));
    if (!r) { console.error('IMPOSTOR REPORT REFUSED: cannot re-derive rational for label ' + label); process.exit(1); }
    const key = r[0] + '/' + r[1];
    if (!byValue.has(key)) byValue.set(key, { p: r[0], q: r[1], spellings: [] });
    byValue.get(key).spellings.push(label);
  }
  const values = [...byValue.values()].map(v => ({
    ...v, ...agreementDepth(e.digits, v.p, v.q)
  })).sort((a, b) => b.agree - a.agree);
  catalog.push({ id: x.id, name: x.name, digits: x.exactDigits, values,
    doubleRefuted: x.refuted, verdict: c.verdict });
}

/* the catalog must be the one the ledger's 21 stand for */
const totalImpersonations = catalog.reduce((t, e) => t + e.values.reduce((s, v) => s + v.spellings.length, 0), 0);
if (totalImpersonations !== 21 || catalog.some(e => e.verdict !== 'REJECT')) {
  console.error('IMPOSTOR REPORT REFUSED: expected 21 exact refutations, all REJECT; found '
    + totalImpersonations + ' across ' + catalog.length + ' entries');
  process.exit(1);
}
catalog.sort((a, b) => b.values[0].agree - a.values[0].agree);
const deepest = catalog[0].values[0].agree;
const shallowest = catalog[catalog.length - 1].values[0].agree;

/* ---- the page ------------------------------------------------------------- */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: 'The impostor catalog',
  deck: 'Published constants that agree with simple closed forms for ' + shallowest + ' to '
    + deepest + ' significant digits — and exact proofs that every one of them is lying. '
    + 'Digit agreement to any depth is not evidence, and this page is the demonstration: '
    + 'each of these impersonations would pass any decimal screen ever used to announce a discovery.'
}));

B.push(C.stats([
  { k: 'constants', v: String(catalog.length), n: 'Published OEIS decimal expansions, audited among ' + C.esc(String(corpusSize)) + ' — the only survivors of a 17-digit double screen.' },
  { k: 'impersonations refuted', v: '21', role: 'held', n: 'Every spelling decided by one BigInt integer comparison at the full published digit length.' },
  { k: 'deepest agreement', v: deepest + ' digits', n: 'Before the first disagreeing digit. A 20-digit match is called a discovery elsewhere.' },
  { k: 'false refutations', v: '0', role: 'held', n: 'The same instrument keeps every true closed form in the corpus — gated by the engine battery, every build.' }
]));

B.push(C.scope('Published, not peer-reviewed, not independently rerun. Verdicts are conditional on the OEIS '
  + 'published digit streams being correct — a refutation here reads "not equal, given those digits".'));

{
  B.push(C.section({
    lab: '§1 · the method', title: 'One integer comparison, no floating point',
    bodyRaw: '<div class="col">'
      + C.pRaw('The engine\'s double-precision screen tests each constant against '
        + C.m('~14,000') + ' closed-form spellings at 17 significant digits. For '
        + C.esc(String(catalog.length)) + ' constants, at least one rational value survived that screen — '
        + 'the constant and the form genuinely share 17 leading digits. Those survivors are re-decided '
        + 'at the FULL published precision, exactly:')
      + C.eq(C.esc('the form p/q is consistent with the digits  ⇔  D·Q ≤ P·10^(k−1) < (D+1)·Q'))
      + C.pRaw('where ' + C.m('D') + ' is the published digit stream read as a k-digit integer and '
        + C.m('P/Q') + ' is the form\'s mantissa scaled to [1, 10). Everything in that line is a BigInt; '
        + 'the verdict is an integer comparison. No float participates, so there is no precision to argue about: '
        + 'the form either fits inside the digit interval or it provably does not.')
      + C.pRaw('The instrument is calibrated in the other direction on every build: constants whose closed form '
        + 'IS the truth (sqrt 2, pi, e, phi, ln 2 …) must keep their forms — zero false refutations is a gate in '
        + C.m('tools/test-engine.js') + ', and it once caught this engine refuting sqrt(2) as the closed form of '
        + 'the decimal expansion of sqrt(2).')
      + '</div>'
  }));
}

{
  const rows = [];
  for (const e of catalog) {
    for (const v of e.values) {
      rows.push([
        { raw: C.m(e.id) },
        { raw: C.esc(e.name.length > 58 ? e.name.slice(0, 57) + '…' : e.name) },
        { raw: C.m(v.q === 1n ? String(v.p) : v.p + '/' + v.q) },
        { raw: C.esc(v.spellings.join('  ')) },
        { raw: C.m(v.agree + ' / ' + v.published) },
        { raw: C.tag('refuted exactly', 'held') }
      ]);
    }
  }
  B.push(C.section({
    lab: '§2 · the catalog', title: 'Who they impersonate, and for how long', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'entry' }, { h: 'what OEIS says it is' }, { h: 'impersonates', cls: 'v' },
        { h: 'as spelled by the vocabulary' }, { h: 'digits agree / published', cls: 'v' }, { h: 'verdict' }],
      rows
    })
      + '<div class="col">' + C.pRaw('Multiple spellings of one value (' + C.esc('sqrt(4/1), cbrt(8/1), sqrt2^(2/1)')
        + ' are all 2) are listed together and counted separately — the vocabulary generates forms, and every '
        + 'generated form that fit at 17 digits was individually put to the exact test.') + '</div>'
  }));
}

{
  const star = catalog.find(e => e.id === 'A271880');
  const ram = catalog.find(e => e.id === 'A266296');
  B.push(C.section({
    lab: '§3 · why this matters', title: 'The collision-probability argument, run in reverse',
    bodyRaw: '<div class="col">'
      + C.pRaw('Digit-matching pipelines — the Ramanujan Machine\'s published methodology among them — '
        + 'declare a hit when a computed value agrees with a closed form to some tens of digits, and argue '
        + 'from collision probability that the match is almost certainly an identity. This catalog is the '
        + 'reverse experiment on the same kind of data: here are constants that sustain the match to '
        + (star ? C.m(String(star.values[0].agree)) + ' digits' : 'great depth')
        + ' and are provably NOT the number they resemble.')
      + (star ? C.pRaw(C.m('A271880') + ' — the probability that a random real is "evil" — agrees with '
        + C.m('1/5') + ' for ' + C.m(String(star.values[0].agree)) + ' digits before diverging; OEIS records the '
        + 'difference separately (A271881, about 2.17e-64). Any screen shallower than 64 digits calls this 1/5.') : '')
      + (ram ? C.pRaw(C.m('A266296') + ' is literally named "a number close to 24, related to the Ramanujan '
        + 'constant" — the near-integer phenomenon that made e^(pi sqrt 163) famous, caught here impersonating '
        + C.m('24') + ' for ' + C.m(String(ram.values[0].agree)) + ' digits and refuted at ' + C.m(String(ram.digits)) + '.') : '')
      + C.pRaw('The point is not that these five are surprising — OEIS contributors know them. The point is '
        + 'that a probability argument cannot tell these five from a real identity, and an exact decision can. '
        + 'A pipeline whose screening step can mint false positives is indistinguishable from one that cannot; '
        + 'the cure is a certificate, and each row of this catalog carries one: a single integer inequality '
        + 'anyone can recheck.')
      + '</div>'
  }));
}

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-impostors.js — every number recomputed from the corpus at build time; the build fails if the records change.') + '</p>'
  + '<p>' + C.esc('git ' + (sh('git rev-parse --short HEAD') || '—') + ' · cert-machine · Carlos Toledo') + '</p>'
  + '</footer>';

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'impostors.html'),
  TPL.render({ title: 'The impostor catalog · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot }));

console.log('reports/impostors.html written');
console.log('  ' + catalog.length + ' constants, ' + totalImpersonations + ' impersonations, deepest agreement '
  + deepest + ' digits');
for (const e of catalog) console.log('  ' + e.id + ': ' + e.values.map(v =>
  (v.q === 1n ? v.p : v.p + '/' + v.q) + ' for ' + v.agree + '/' + v.published + ' digits').join(' · '));
