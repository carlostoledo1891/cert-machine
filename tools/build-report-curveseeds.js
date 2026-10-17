#!/usr/bin/env node
/* build-report-curveseeds.js — reports/curve-seeds.html: Anthropic's 2026-10-16 claim that the NIST / X9.62 curve seeds
   are lrand48 candidates seeded from Unix timestamps (and six base points FreeLIP draws), re-decided from the standards
   by two deciders that share no code with each other or with the claimant. Every number comes from
   certs/curveseeds-ledger.json (tools/run-curveseeds-ledger.js), re-derived here before a word is written, and from the
   battery's own count.

   usage: node tools/build-report-curveseeds.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('CURVESEEDS REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

try { cp.execFileSync(process.execPath, ['tools/run-curveseeds-ledger.js'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || '') + (e.stderr || e.message)); }
let bat = ''; try { bat = cp.execFileSync(process.execPath, ['instruments/curveseeds/battery.js'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /ALL PASS\s+\((\d+) checks, (\d+)\/(\d+) red controls fired\)/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'curveseeds-ledger.json'), 'utf8'));
const PRE = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'curveseeds', 'preregistration.json'), 'utf8'));
const S = L.rows.filter((r) => r.claim === 'S'), Dr = L.rows.filter((r) => r.claim === 'D'), G = L.rows.filter((r) => r.claim === 'G');
const cert = (rows) => rows.filter((r) => r.verdict === 'CERTIFIED').length;
if (L.rows.length !== 34) die('the page is written for 34 rows; the ledger has ' + L.rows.length);
const allCert = cert(L.rows) === L.rows.length;
if (!allCert) die('the page says every row is CERTIFIED — the record no longer does (' + JSON.stringify(L.counts.byVerdict) + '); rewrite it');
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'dep');
const fmt = (n) => Number(n).toLocaleString('en-US');
const grp = (s) => s.replace(/(.{8})(?=.)/g, '$1 ');
const order = ['P-192', 'P-224', 'P-256', 'P-384', 'P-521', 'prime192v2', 'prime192v3', 'prime239v1', 'prime239v2', 'prime239v3', 'B-233', 'B-283', 'B-409', 'B-571'];
const byOrder = (rows) => rows.slice().sort((a, b) => order.indexOf(a.curve) - order.indexOf(b.curve));
const scan = L.scan || null;

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · a frontier lab’s claim, decided the day it was published',
  title: 'NIST’s ECDSA curve seeds: the timestamp-and-lrand48 origin, re-decided from the standards',
  deck: 'On 16 October 2026 Anthropic published that the fourteen seeds behind the NIST and ANSI X9.62 elliptic curves — a question open since 1997 and carrying a bounty — are outputs of the C library’s '
    + 'lrand48, seeded from Unix timestamps of May 1997 to April 1998, and that six base points come from FreeLIP’s random generator. Every row of that claim that a computation can decide is re-decided here, '
    + 'the same evening, from the POSIX specification of drand48, from ANSI X9.62’s derivation as FIPS 186-2 prints its intermediates, and from FreeLIP’s source — by two programs that share no code with each other '
    + 'or with the claimant’s. All ' + L.rows.length + ' rows hold. The claims beyond the checkable core are listed as readings, each with what would decide it.'
}));
B.push(C.scope('The claim: anthropic.com/research/ecdsa-curve-origins as fetched 2026-10-16 (sha256 ' + L.pins['anthropic-ecdsa-curve-origins-2026-10-16.html'].slice(0, 12) + '…), its two code blocks pinned as evidence and never run. '
  + (L.pins['anthropic-ecdsa-curve-origins-2026-10-17.html'] ? 'The publisher edited the post on 17 October (14:19 UTC): copy edits only, namely serial commas, thousands separators (1,842; 1/5,810), one “on” and “Acknowledgments”. The code, its printed outputs, the figures and every number are unchanged, and the edited bytes are pinned beside the decided ones (' + L.pins['anthropic-ecdsa-curve-origins-2026-10-17.html'].slice(0, 12) + '…). ' : '')
  + 'The published objects: FIPS PUB 186-2 (' + L.pins['fips186-2.pdf'].slice(0, 12) + '…) — for each prime curve p, r, the seed s, c, b, G; for each binary curve the field polynomial, r, and the seed and b in the normal basis — and OpenSSL’s crypto/ec/ec_curve.c at a pinned commit for the five X9.62 example curves, whose standard is paywalled; '
  + 'the two sources must agree on every NIST field or the reader refuses. The specifications: IEEE Std 1003.1 for the drand48 family; FreeLIP 1.1’s lip.c (Lenstra–Leyland, 1997) for zrstarts, zrandom and zrandomb. '
  + 'Pre-registered in corpus/curveseeds/preregistration.json with ' + (L.amendments === 1 ? 'one dated amendment' : L.amendments + ' dated amendments') + ' before any row was decided. '
  + 'Decided: that each published seed is the stated candidate of the stated srand48 run (14 rows); that each seed yields its published curve by X9.62’s SHA-1 procedure (14); that each of six base points is the first point FreeLIP’s generator draws from the stated seed (6). '
  + 'Not decided: the skipped-candidate claim, which needs point counting' + (scan ? ' (the optional lane below counts apart)' : '') + '; the probabilities and the interpretation; anything about the security of the curves.'));
B.push(C.tldr({
  findingRaw: '<b>' + cert(L.rows) + ' of ' + L.rows.length + ' checkable rows hold.</b> Each of the fourteen seeds is exactly the stated 20-byte candidate of the lrand48 stream that srand48 starts from the stated Unix time — '
    + 'the five NIST prime curves and five X9.62 example curves as the top byte of each output (lrand48() >> 23), the four binary curves as whole 31-bit words from a clock the claim reads as halved. '
    + 'Each seed then yields its published curve under ANSI X9.62’s procedure: for the five NIST prime curves the SHA-1 chain reproduces the intermediate c that FIPS 186-2 itself prints, and b²·c ≡ −27 (mod p) for all ten prime curves; for the four binary curves the chain is the published b in the normal basis, bit for bit. '
    + 'The six base points of May 1997 are the first x on the curve that FreeLIP’s generator — zrstarts(seed), state × 3¹²¹ mod 2¹⁰⁷ − 1, 26-bit limbs, seven draws discarded — produces from LIP seeds 20000 to 20517; each published Gy squares to the curve. '
    + '<b>What the post claims beyond what it checks</b> is in §4: the skipped candidates (point counting), the 1/5810, the halved clock, and "less plausible", each named for what it is. '
    + 'A seed reproducing from a 32-bit srand48 argument and a small index is the computation; that the argument is the moment a program ran in 1997 is the reader’s inference, and the page does not make it for them.',
  mechanismRaw: 'Integers only. The LCG from the man page (X ← 5DEECE66D·X + B mod 2⁴⁸; srand48 puts the argument in the high 32 bits over 330E; lrand48 is the high 31 bits); SHA-1 from the standard library; FreeLIP’s generator as lip.c codes it, including its rejection step. '
    + 'Two deciders — Python (int, hashlib) and Node (BigInt, crypto) — written separately, calibrated before any row on FIPS’s own printed c for P-256 and printed normal-basis b for B-233, agree on ' + fmt(L.crossCheck.fieldsCompared) + ' fields; one difference refuses the run. '
    + L.redControls.of + ' forgeries must fail and do: a timestamp one second off, a candidate one off, the wrong shift, the clock not halved, mrand48 for lrand48, a flipped seed byte, the chain run backwards, the prime chain without X9.62’s leftmost-bit rule, a LIP seed one off, 30-bit limbs, no outputs skipped.',
  checkRaw: C.m('node tools/run-curveseeds-ledger.js') + ' (seconds) · ' + C.m('node instruments/curveseeds/battery.js') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls · ' + C.m('python3 -I instruments/curveseeds/decide.py') + ' decides every row with nothing but the standard library.'
}));
B.push(C.stats([
  { k: 'seeds', v: cert(S) + ' of ' + S.length, n: 'each the stated candidate of the stated srand48 run; ten prime-curve, four binary-curve' },
  { k: 'seed → curve', v: cert(Dr) + ' of ' + Dr.length, n: 'X9.62’s SHA-1 chain: FIPS’s printed c reproduced (5), b²c ≡ −27 (10), the normal-basis b (4)' },
  { k: 'base points', v: cert(G) + ' of ' + G.length, n: 'FreeLIP’s generator from the stated LIP seeds; first x on the curve after ' + G.map((r) => r.tries).join(', ') + ' tries' },
  { k: 'deciders', v: '2 · 0', n: fmt(L.crossCheck.fieldsCompared) + ' fields compared, no shared code, no difference' },
  { k: 'red controls', v: bm[3], n: 'forgeries that must fail; all fired' },
  { k: 'readings', v: String(L.readings.length), n: 'claims beyond the checkable core, each with what would decide it' }
]));

B.push(C.section({
  lab: '§1 · the seeds', title: 'Fourteen seeds, each the stated candidate of the stated run', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'curve' }, { h: 'srand48 clock (UTC)' }, { h: 'srand48 argument' }, { h: 'candidate' }, { h: 'the published seed' }, { h: 'source' }, { h: 'verdict' }],
    rows: byOrder(S).map((r) => [{ raw: C.esc(r.curve) }, { raw: C.esc(r.timestamp) }, { raw: C.esc(String(r.kind === 'binary' ? r.srand48Argument : r.unix) + (r.kind === 'binary' ? ' (= ⌊t/2⌋, t = ' + r.unix + ')' : '')) },
      { raw: C.esc(String(r.candidate)) }, { raw: '<span class="m">' + C.esc(grp(r.published)) + '</span>' }, { raw: C.esc(r.publishedFrom) }, { raw: tag(r.verdict) }])
  }) + C.pRaw('A CERTIFIED row says: start the POSIX generator with srand48(argument), take the n-th block of twenty outputs (prime curves: the top byte of each, lrand48() >> 23) or of five outputs (binary curves: each whole 31-bit value as a 32-bit word), and the 160 bits are the published seed. '
    + 'The candidate index is 1-based, as the post defines it ("the first 20 bytes are candidate 1"). The published seeds are read from the pinned FIPS 186-2 text layer (the NIST curves; the binary seeds in the normal basis FIPS gives them in) and from OpenSSL’s table (the X9.62 example curves), never retyped. '
    + 'The four binary runs are 206 seconds apart on the same afternoon under the halved-clock reading; without the halving the srand48 arguments read as February 1984 and the red control shows no seed reproduces.')
}));
B.push(C.section({
  lab: '§2 · seed → curve', title: 'Each seed yields its published curve by X9.62’s procedure', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'curve' }, { h: 'field' }, { h: 'the chain’s output' }, { h: 'against the standard' }, { h: 'verdict' }],
    rows: byOrder(Dr).map((r) => [{ raw: C.esc(r.curve) }, { raw: C.esc(r.kind === 'prime' ? 'GF(p), ' + r.bits + ' bits' : 'GF(2^' + r.m + '), t^' + r.fieldPolynomial.slice(0, -1).join(' + t^') + ' + 1') },
      { raw: r.kind === 'prime' ? 'c = <span class="m">' + C.esc(r.c.slice(0, 16)) + '…</span>' : 'b (normal basis) = <span class="m">' + C.esc(r.bNormal.slice(0, 16)) + '…</span>' },
      { raw: C.esc(r.kind === 'prime' ? (r.cMatchesPublished === true ? 'equals FIPS 186-2’s printed c; b²c + 27 ≡ 0 (mod p)' : r.cMatchesPublished === null ? 'no c printed for this curve; b²c + 27 ≡ 0 (mod p) holds' : 'differs from FIPS’s c') : (r.bMatchesPublished ? 'equals FIPS 186-2’s normal-basis b, bit for bit' : 'differs')) },
      { raw: tag(r.verdict) }])
  }) + C.pRaw('ANSI X9.62-1998 A.3.3 turns a seed into a curve: with t the field size in bits, s = ⌊(t − 1)/160⌋ and v = t − 160s, the chain is the rightmost v bits of SHA-1(seed) followed by SHA-1(seed + 1) … SHA-1(seed + s). In the prime case the leftmost bit of the first block is cleared and the result is c, with b any solution of b²c ≡ a³ (mod p), a = −3; FIPS 186-2 prints that c, and the calibration that regenerates it is what caught the leftmost-bit rule (amendment 1). In the binary case the chain is b itself, in the normal basis FIPS uses for s and b. '
    + 'This row is the standard’s own promise, not the post’s; it is decided so that one record closes the chain from a 32-bit clock value to the published curve. For the X9.62 example curves no c is printed anywhere open, so the congruence alone decides.')
}));
B.push(C.section({
  lab: '§3 · the base points', title: 'Six base points from FreeLIP’s generator', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'curve' }, { h: 'LIP seed' }, { h: 'tries' }, { h: 'x produced' }, { h: 'Gy' }, { h: 'verdict' }],
    rows: G.map((r) => [{ raw: C.esc(r.curve) }, { raw: C.esc(String(r.lipSeed)) }, { raw: C.esc(String(r.tries)) }, { raw: '<span class="m">' + C.esc(r.producedX.slice(0, 16)) + '…</span>' + (r.producedX === r.publishedGx ? ' = the published Gx' : ' ≠ Gx') },
      { raw: C.esc((r.GySquaresToCurve ? 'squares to x³ − 3x + b; ' : 'does not square to the curve; ') + (r.GyIsTheOddRoot ? 'the odd root' : 'the even root') + (r.GyIsTheSmallerRoot ? ', the smaller' : ', the larger')) }, { raw: tag(r.verdict) }])
  }) + C.pRaw('FreeLIP (lip.c): zrstarts(seed) sets the state to the seed and the multiplier to 3¹²¹ mod (2¹⁰⁷ − 1); zrandom(b) advances the state and returns it mod b, redrawing in the rare case the state falls in the top partial block; zrandomb(p) draws one limb more than p has, the first most significant, and reduces mod p. '
    + 'The limb is 26 bits (NBITS in the SINGLE_MUL build of lip.h; 30 bits fails the red control), seven single draws are discarded first (the post’s reading of the generating program; zero fails the red control), and the first x with x³ − 3x + b a quadratic residue is the base point’s abscissa. '
    + 'The post explains no other base point — P-224, P-256, P-384, P-521 and the binary curves stay open — and nothing here changes that.')
}));
B.push(C.section({
  lab: '§4 · beyond the checkable core', title: 'What the post claims beyond what this page can decide',
  bodyRaw: C.plainList(L.readings.map((r) => ({ b: r.id + ' · ' + r.status + '.', text: r.what + ' — ' + r.why + '. What would decide it: ' + r.wouldDecide + '.' })))
    + (scan && scan.runs ? C.pRaw('<b>The optional lane, counted apart.</b> Every candidate below the published index of each run, derived by X9.62 and point-counted with PARI/GP (Schoof–Elkies–Atkin with the seadata tables) — outside the standard library, so outside the certificate above. A candidate is <em>viable</em> when its c gives a curve (c ≢ 0, 4c + 27 ≢ 0, −27/c a square mod p); it then has two curves, y² = x³ − 3x ± b, which are quadratic twists of each other when p ≡ 3 (mod 4) and isomorphic when p ≡ 1 (mod 4). The published b is one of the two roots, and the post\u2019s "parameters chosen the same way" is read as that root.')
      + C.plainList(Object.entries(scan.runs).map(([k, v]) => {
          const clock = PRE.claim.table.prime[k][0]; const siblings = new Set(Object.entries(PRE.claim.table.prime).filter(([n, [c]]) => c === clock && n !== k).map(([, [, idx]]) => idx));
          const sk = (a) => { const own = a.filter((n) => !siblings.has(n)), other = a.filter((n) => siblings.has(n)); return (own.length ? own.join(', ') : 'none') + (other.length ? ' (besides ' + other.join(', ') + ', published as other curves of this run)' : ''); };
          const root = v.pMod4 === 1 ? 'the two roots give isomorphic curves' : 'the published b is the ' + (v.publishedRoot === '+' ? '+√(−27/c) = (−27/c)^((p+1)/4) root' : '−√(−27/c) root');
          return { b: k + ' (' + clock.slice(0, 10) + '; ' + v.bits + '-bit; p ≡ ' + v.pMod4 + ' mod 4).', text: 'Published candidate ' + v.publishedCandidate + ', prime-order: ' + (v.publishedIsPrimeOrder ? 'yes' : 'NO') + '; ' + v.viable + ' viable candidates below it; ' + root + '. Skipped prime-order candidates under the published root: ' + sk(v.skippedUnderThePublishedRoot) + '. Under either root: ' + sk(v.skippedUnderEitherRoot) + '.' };
        }))
      + C.pRaw('The published candidate of every run comes out prime-order, which is the lane\u2019s calibration against the standard. "Skipped" lists the earlier candidates of the same run that also give a prime-order curve and were not themselves published; for the X9.62 runs, which produced three curves each, the run\u2019s other published curves are set apart. The published b is the +√(−27/c) root wherever p ≡ 3 (mod 4) — the root (−27/c)^((p+1)/4) a program computes first — which is what makes "the published root" a reading of "chosen the same way". The post counts 1 (P-256), 3 (P-224) and 7 (the two X9.62 runs together) under a criterion it does not state; where the table differs from those numbers the difference is the criterion, not the arithmetic, and the criterion is what would close it. Record: corpus/curveseeds/scan.json (tools/curveseeds-scan.py' + (scan.pod ? ', run on RunPod ' + C.esc(scan.pod.id) + ', ' + C.esc(String(scan.pod.cpus)) + ' vCPU' : '') + '); the P-384 and P-521 runs are not in the post, which scanned no further than P-224 and the X9.62 curves.')
      : C.pRaw('The point-counting lane for R1 (every candidate below the published index, under a stated root convention for b, with Schoof–Elkies–Atkin in PARI/GP) is outside the standard library and not part of this certificate; if run, its counts will appear here, counted apart.'))
}));
B.push(C.section({
  lab: '§5 · conventions', title: 'The conventions every verdict above rests on',
  bodyRaw: C.plainList(L.conventions.map((c, i) => ({ b: 'C' + (i + 1) + '.', text: c })))
    + C.pRaw((L.amendments === 1 ? 'One amendment' : L.amendments + ' amendments') + ' to the pre-registration, dated before any row was decided. ' + PRE.amendments.map((a, i) => '<b>Amendment ' + (i + 1) + '.</b> ' + C.esc(a.seen) + ' ' + C.esc(a.change)).join(' '))
}));
B.push(C.section({
  lab: '§6 · limits', title: 'What is not claimed',
  bodyRaw: C.plainList([
    { b: 'That the clock values are moments in 1997.', text: 'The computation shows that a 32-bit srand48 argument and a small index regenerate 160 published bits, fourteen times. That the argument was the wall clock of a program is the natural reading and the post’s; it is not a computation.' },
    { b: 'Uniqueness.', text: 'That no other generator or convention produces the same bytes is not decided; the red controls show the nearby conventions do not.' },
    { b: 'Security.', text: 'Nothing here bears on the strength of any curve. The post’s "much less plausible" is interpretation and is listed as such.' },
    { b: 'The skipped candidates.', text: 'Whether candidate 876 of the P-256 run, three P-224 candidates and seven X9.62 candidates also yield prime-order curves needs point counting; it is R1, not a row of this certificate' + (scan ? ', and the optional lane’s own counts are reported apart' : '') + '.' },
    { b: 'Same-evening work.', text: 'Built in the hours after the post appeared, from the standards, with the forgeries listed; nothing has been reviewed by anyone else yet. The pre-registration, the pins and the two deciders are in the repository for whoever wants to break it.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-curveseeds.js from certs/curveseeds-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'curve-seeds.html'), TPL.render({
  title: 'NIST’s ECDSA curve seeds: the timestamp-and-lrand48 origin, re-decided from the standards · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Anthropic’s 2026-10-16 claim that the fourteen NIST and X9.62 curve seeds are lrand48 candidates seeded from 1997–98 Unix timestamps, and six base points FreeLIP’s generator draws, re-decided the same day from the POSIX, X9.62/FIPS 186-2 and FreeLIP specifications by two deciders sharing no code: ' + cert(L.rows) + ' of ' + L.rows.length + ' checkable rows hold; the claims beyond them listed as readings.',
  path: '/reports/curve-seeds.html'
}));
console.log('reports/curve-seeds.html written: ' + L.rows.length + ' rows, ' + cert(L.rows) + ' certified @ git ' + git);
