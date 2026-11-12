#!/usr/bin/env node
/* battery.js — the textbook machine's record, re-derived, and the machines held to what the page says they do.
   playground/textbook-machine/ · cert-machine · 2026-11-12

     node playground/textbook-machine/battery.js           re-derive out/facts.json and compare byte for byte; run every
                                                            check and every red control; exit 1 on any failure
     node playground/textbook-machine/battery.js --write   write out/facts.json from machines.js (then run the checks)

   WHAT IT HOLDS, each against something that is not the machine under test:
     the palindrome machine     against a reversed string, on every word of a and b up to length 10 (2,047 words)
     the lock checker           against "every character is 1", on every setting of 1 to 10 switches (2,046)
     the finder                 answers yes on every n from 1 to 10 and leaves every switch on, which is the one setting
                                that opens the lock; and the series "more than doubles" for every n the page prints
     the sentence runner        the sparse step function the page animates against the fast byte-array run, which share
                                no code: the same end and the same count on every machine and sample input
     the champions              the step counts and the 1s left, against the numbers their sources print (SOURCES below,
                                each read at its page on 2026-11-11): 6, 21, 107 and 47,176,870 steps
     the claims                 the five verdicts the page prints, and REFUSED when the budget is cut below a run
   RED CONTROLS: a palindrome machine with one rule changed, a champion with one character changed, a series whose last
   ratio is exactly 2, a claim decided with a budget of 10, and a record with one count moved must each be caught. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const TM = require('./machines.js');
const HERE = __dirname;
const REC = path.join(HERE, 'out', 'facts.json');

/* the busy beaver values as their sources print them, read 2026-11-11. The tab and this battery run each champion; that
   no other machine of its size runs longer is the cited proof's, never this file's. */
const SOURCES = {
  2: { steps: 6, ones: 4, who: 'Radó, 1962', url: 'https://bbchallenge.org/story', quote: 'BB(2) = 6, [Rado, 1962]' },
  3: { steps: 21, ones: 5, who: 'Lin and Radó, 1963', url: 'https://bbchallenge.org/story', quote: 'BB(3) = 21, [Rado and Lin, 1963]' },
  4: { steps: 107, ones: 13, who: 'Brady, 1983; formalized by the bbchallenge project in 2024', url: 'https://wiki.bbchallenge.org/wiki/BB(4)', quote: '1RB1LB_1LA0LC_1RZ1LD_1RD0RA, which runs for 107 steps, 13 ones' },
  5: { steps: 47176870, ones: 4098, who: 'the bbchallenge Collaboration, 2024, proved in the Coq proof assistant (now Rocq): 181,385,789 machines settled', url: 'https://arxiv.org/abs/2509.12337', quote: 'S(5) = 47,176,870 … Σ(5) = 4,098' },
  6: { steps: null, who: 'unknown; the best lower bound, found by mxdys in June 2025, is more than 10↑↑10↑↑10↑↑8, and since Antihydra (June 2024) settling it means solving a problem like Collatz’s', url: 'https://wiki.bbchallenge.org/wiki/BB(6)', quote: 'S(6)>Σ(6)>10↑↑10↑↑10↑↑8 … we must solve a Collatz-like problem in order to solve BB(6)' }
};

const moreThanDoubles = (s) => s.every((v, i) => i === 0 || v > 2 * s[i - 1]);
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

function derive() {
  const series = TM.series();
  if (!moreThanDoubles(series.find)) throw new Error('the finder no longer more than doubles with every switch');
  const champions = TM.CHAMPIONS.map((c) => {
    const j = TM.runAll(TM.parseStd(c.std), '', 1e9);
    return { states: c.states, std: c.std, end: j.end, steps: j.steps, ones: j.ones };
  });
  const claims = TM.CLAIMS.map((c) => Object.assign({ id: c.id, text: c.text }, TM.decide(c)));
  /* the space-time picture of the four-state champion: the tape after each step, the cells it ever touched */
  const m = TM.M.beaver, s = TM.begin(m, ''), rows = [], heads = [];
  let lo = 0, hi = 0;
  const snap = () => { rows.push(Object.assign({}, s.tape)); heads.push(s.pos); lo = Math.min(lo, s.pos); hi = Math.max(hi, s.pos); };
  snap();
  while (!s.end) { TM.step(m, s); snap(); }
  const spacetime = { lo, hi, heads, rows: rows.map((t) => { let r = ''; for (let i = lo; i <= hi; i++) r += t[i] === '1' ? '1' : '0'; return r; }) };
  return {
    what: 'The textbook machine: every step count the page /instruments/textbook-machine/ prints, counted by running the machines of machines.js. Re-derived by battery.js.',
    machines: { file: 'playground/textbook-machine/machines.js', sha256: sha(path.join(HERE, 'machines.js')) },
    series, ratios: series.find.slice(1).map((v, i) => Math.round(1000 * v / series.find[i]) / 1000),
    champions, sources: SOURCES, budget: TM.BUDGET, claims, spacetime
  };
}
const text = (d) => JSON.stringify(d, null, 1) + '\n';

function checks(F) {
  const bad = [], ok = [];
  const t = (name, cond) => (cond ? ok : bad).push(name);
  const words = (alpha, maxLen) => { const out = ['']; for (let L = 1; L <= maxLen; L++) { const n = Math.pow(alpha.length, L); for (let k = 0; k < n; k++) { let w = '', x = k; for (let i = 0; i < L; i++) { w = alpha[x % alpha.length] + w; x = Math.floor(x / alpha.length); } out.push(w); } } return out; };
  const pal = words('ab', 10);
  t('the palindrome machine agrees with a reversed string on all ' + pal.length + ' words of a and b up to length 10',
    pal.every((w) => TM.runAll(TM.M.palindrome, w, 1e7).end === (w === w.split('').reverse().join('') ? 'YES' : 'NO')));
  const set = words('01', 10).filter((w) => w.length);
  t('the lock checker agrees with "every switch on" on all ' + set.length + ' settings of 1 to 10 switches, in at most n + 1 steps',
    set.every((w) => { const j = TM.runAll(TM.M.check, w, 100); return j.end === (/^1+$/.test(w) ? 'YES' : 'NO') && j.steps <= w.length + 1; }));
  t('the finder answers yes on 1 to 10 switches and leaves every switch on',
    F.series.n.every((n) => { const j = TM.runAll(TM.M.find, '0'.repeat(n), 1e9); return j.end === 'YES' && j.ones === n && j.cells === n; }));
  t('finding more than doubles with every switch, 1 to ' + TM.NMAX + ' (ratios ' + F.ratios.join(', ') + ')', moreThanDoubles(F.series.find));
  t('checking the setting that opens the lock takes n + 1 steps', F.series.check.every((v, i) => v === F.series.n[i] + 1));
  /* the animated step function against the fast run: they share no code */
  const samples = [['count', '0', 5000], ['palindrome', 'abba', 1e6], ['palindrome', 'abbab', 1e6], ['palindrome', 'aabbaa', 1e6], ['check', '1101', 99], ['check', '111', 99], ['find', '00000', 1e6], ['beaver', '', 1e6]];
  t('the page\'s step function and the fast run agree on ' + samples.length + ' runs (end, steps, every cell)', samples.every(([k, input, cap]) => {
    const m = TM.M[k], s = TM.begin(m, input);
    while (!s.end && s.steps < cap) TM.step(m, s);
    const j = TM.runAll(m, input, cap);
    const ones = Object.values(s.tape).filter((v) => v === '1').length;
    return s.end === j.end && s.steps === j.steps && (m.syms.indexOf('1') < 0 || ones === j.ones);
  }));
  for (const c of F.champions) {
    const S = SOURCES[c.states];
    t('the ' + c.states + '-state champion ' + c.std + ' stops after ' + S.steps.toLocaleString('en-US') + ' steps with ' + S.ones + ' ones, as ' + S.url + ' prints',
      c.end === 'HALT' && c.steps === S.steps && c.ones === S.ones);
  }
  t('the champion on the page is the four-state one its source prints', TM.M.beaver.std === TM.CHAMPIONS[2].std);
  const want = { abba: 'CERTIFIED', abab: 'REFUTED', lock10: 'CERTIFIED', beaver: 'CERTIFIED', count: 'REFUSED' };
  t('the five claims decide as the page says: ' + F.claims.map((c) => c.id + ' ' + c.verdict).join(', '), F.claims.every((c) => want[c.id] === c.verdict));
  t('the space-time picture has one row per step and the head moves one cell a row',
    F.spacetime.rows.length === 108 && F.spacetime.heads.every((h, i) => i === 0 || Math.abs(h - F.spacetime.heads[i - 1]) === 1)
    && F.spacetime.rows[107].split('').filter((x) => x === '1').length === 13);
  t('a sentence reads as the page prints it', TM.sentence({ state: 'carry', read: '1', write: '0', move: -1, next: 'carry' }, 7) === 'Step 7. In state carry, reading 1: write 0, move left, stay in carry.');

  /* red controls */
  const red = [];
  const r = (name, fired) => (fired ? red : bad).push('RED ' + name);
  const broken = JSON.parse(JSON.stringify(TM.M.palindrome.rules)); broken['match a'].b = ['b', 0, 'YES'];
  const bm = Object.assign({}, TM.M.palindrome, { rules: broken });
  r('a palindrome machine with one rule changed disagrees with the reversed string somewhere',
    pal.some((w) => TM.runAll(bm, w, 1e7).end !== (w === w.split('').reverse().join('') ? 'YES' : 'NO')));
  r('a four-state champion with one character changed does not stop at 107 steps',
    TM.runAll(TM.parseStd('1RB1LB_1LA0LC_1RZ1LD_1RD0RB'), '', 1e6).steps !== 107);
  r('a series whose last ratio is exactly 2 does not "more than double"', !moreThanDoubles(F.series.find.slice(0, -1).concat([2 * F.series.find[F.series.find.length - 2]])));
  r('the champion\'s claim with a budget of 10 steps is REFUSED, not refuted', TM.decide(TM.CLAIMS.find((c) => c.id === 'beaver'), 10).verdict === 'REFUSED');
  const moved = JSON.parse(text(F)); moved.series.find[3]++;
  r('a record with one count moved is not the derived one', text(moved) !== text(derive()));
  return { ok, bad, red };
}

if (require.main === module) {
  const F = derive();
  if (process.argv.includes('--write')) { fs.mkdirSync(path.dirname(REC), { recursive: true }); fs.writeFileSync(REC, text(F)); console.log('wrote ' + path.relative(process.cwd(), REC)); }
  const { ok, bad, red } = checks(F);
  if (!fs.existsSync(REC) || fs.readFileSync(REC, 'utf8') !== text(F)) bad.unshift('out/facts.json does not re-derive byte for byte (node playground/textbook-machine/battery.js --write after a reviewed change)');
  for (const s of ok) console.log('  ok    ' + s);
  for (const s of red) console.log('  ok    ' + s);
  for (const s of bad) console.log('  FAIL  ' + s);
  console.log(bad.length ? 'textbook machine: FAIL, ' + bad.length + ' failure(s)' : 'textbook machine: PASS, ' + ok.length + ' checks and ' + red.length + ' red controls');
  process.exit(bad.length ? 1 : 0);
}
module.exports = { derive, text, SOURCES, REC };
