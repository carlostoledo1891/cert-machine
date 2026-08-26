/* tail-sweep.js — run the five-candidate squeeze over the tail l = 31..60 (even d = 62..120)
 * and write tail-deltas.json for kernel.js to consume. Any degree where the squeeze does
 * not close to a UNIQUE survivor with green certificates is left out of the file — the
 * enclosure keeps δ ∈ [0,1] there. Honest by construction. */
'use strict';
const fs = require('fs');
const path = require('path');
const { analyze } = require(path.join(__dirname, 'galois-exceptions.js'));

function main() {
  const t0 = Date.now();
  const out = {};
  let certified = 0, open = [];
  for (let l = 31; l <= 60; l++) {
    const d = 2 * l;
    let r;
    try {
      r = analyze(d, { nPrimes: 400, earlyExit: true });
    } catch (e) {
      console.log('  d=' + d + ' ERROR: ' + e.message);
      open.push(d); continue;
    }
    if (r.certsOk && r.alive.length === 1) {
      const dl = r.alive[0].delta;
      out[l] = { name: r.alive[0].name, n: dl.n.toString(), d: dl.d.toString() };
      certified++;
      console.log('  ==> d=' + d + ' CERTIFIED ' + r.alive[0].name);
    } else {
      open.push(d);
      console.log('  ==> d=' + d + ' NOT CLOSED (survivors: ' + r.alive.map(a => a.name).join(',') + ')');
    }
  }
  /* MUTATION CONTROLS — the sweep's own teeth. Without these, the two most newsworthy
     numbers on the page (d = 80 and d = 120) would come from the one kernel that had never
     been shown able to fail. Both must reclassify or refuse. */
  let mfail = 0;
  const mcheck = (name, ok) => { console.log((ok ? '  ok   ' : '  FAIL ') + name); if (!ok) mfail++; };
  /* WHICH degrees are exceptional is the most newsworthy claim in the submission, and until
     2026-08-03 it was read off console output — nothing asserted the SET. A mis-certified
     ES0 at any other degree would have validated, shipped, and made the page's "28 full
     hyperoctahedral, two index-2" false with every gate green. Now it is the set itself: */
  const es0At = Object.entries(out).filter(([, v]) => v.name === 'ES0')
    .map(([ls]) => Number(ls)).sort((a, b) => a - b);
  mcheck('ES0 certified at exactly l = 40, 60 (d = 80, 120) and nowhere else in the tail',
    JSON.stringify(es0At) === '[40,60]');
  mcheck('every certified tail group is B or ES0 — no third name can enter the file silently',
    Object.values(out).every(v => v.name === 'B' || v.name === 'ES0'));
  const m1 = analyze(80, { nPrimes: 300, earlyExit: true, mutateDisc: true });
  mcheck('MUTATION M1 (disc(f_80)+1): d=80 must NOT still certify as the index-2 group ES0',
    !(m1.certsOk && m1.alive.length === 1 && m1.alive[0].name === 'ES0'));
  /* M2 is the SAME control at the other new exceptional degree, deliberately — the first
     draft mutated a non-exceptional degree instead, which is a no-op: adding 1 to a
     nonsquare discriminant leaves it nonsquare, so nothing could break and the "control"
     would have passed while proving nothing. Both newsworthy degrees now carry teeth. */
  const m2 = analyze(120, { nPrimes: 300, earlyExit: true, mutateDisc: true });
  mcheck('MUTATION M2 (disc(f_120)+1): d=120 must NOT still certify as the index-2 group ES0',
    !(m2.certsOk && m2.alive.length === 1 && m2.alive[0].name === 'ES0'));
  if (mfail) { console.log(mfail + ' MUTATION CONTROL(S) FAILED — the sweep has no teeth; nothing above may be quoted.');
    process.exit(1); }

  fs.writeFileSync(path.join(__dirname, 'tail-deltas.json'), JSON.stringify({
    generated: '2026-08-03', method: 'galois-exceptions.js five-candidate squeeze, earlyExit nPrimes=400',
    certified, open, deltas: out
  }, null, 1));
  console.log('\nSWEEP DONE in ' + Math.round((Date.now() - t0) / 1000) + 's · certified ' + certified + '/30 · open: [' + open.join(',') + ']');
  process.exit(0);
}
main();
