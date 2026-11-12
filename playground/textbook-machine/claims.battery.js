#!/usr/bin/env node
/* claims.battery.js — one verdict per claim, held to Node; and the bundle the claims page serves.
   playground/textbook-machine/ · cert-machine · 2026-11-12

     node playground/textbook-machine/claims.battery.js      every check and every red control; exit 1 on any failure

   The page /instruments/textbook-machine/claims/ shows ONE word per claim. The rule that picks it is claim-verdict.js,
   and this file runs that same text three ways: required in Node over Node's own check.js; inside the bare sandbox of
   checker-web.battery.js beside the bundle, as the tab runs it; and against instruments/verdict.js, whose composition
   it must equal wherever every part carries a word.

   WHAT IT HOLDS
     the set       claims.set.js names the objects of checker-web.build.js's first set, shape for shape, and nothing else
     the bundle    out/claims-checker.js and its manifest re-derive byte for byte; it passes the gate of
                   checker-web.battery.js (the recorded check.js sha256, the bytes between the marks, the file on disk);
                   it carries no held object and no file only a held object needs
     the rule      for every object of the set, held ones too: the module over Node's check.js result gives the word
                   that a second reading gives — the three words read off Node's printed line and composed by
                   instruments/verdict.js — and the module in the sandbox over the bundle's result gives it again
     the changes   every declared change of every claim turns the word the set says, by Node and (for the served
                   claims) by the bundle in the sandbox; the first variant is the object as it stands
     composition   on every list of one to five words, as a record's and as the object's own, the module equals
                   verdict.js compose()
   RED CONTROLS, each of which must fire as named: one REFUTED part among certified ones gives REFUTED; a claim the
   checker refuses gives REFUSED whatever its parts say; an admitted claim with nothing decided gives REFUSED (where the
   bare composition of no words would say CERTIFIED); a part left undecided beside certified ones gives REFUSED, never
   CERTIFIED; no line gives REFUSED with nothing admitted; a repair's word never enters the verdict; a word that is
   not one of the three is refused; a planted wrong expectation is caught by the comparison; a held object given to
   the served bundle is refused there for a file it does not carry. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const B = require('./checker-web.build.js');
const WB = require('./checker-web.battery.js');
const SET = require('./claims.set.js');
const CB = require('./claims.build.js');
const CV = require('./claim-verdict.js');
const ROOT = B.ROOT;
const V = require(path.join(ROOT, 'instruments', 'verdict.js'));
const W = CB.W;
const MODULE_TEXT = fs.readFileSync(path.join(__dirname, 'claim-verdict.js'), 'utf8');

function main() {
  const ok = [], bad = [], red = [];
  const t = (name, cond, why) => { if (cond) ok.push(name); else bad.push(name + (why ? '\n          ' + why : '')); };
  const r = (name, fired, why) => { if (fired) red.push('RED ' + name); else bad.push('RED ' + name + (why ? '\n          ' + why : '')); };

  /* ---- the set ---- */
  const all = SET.resolve(), served = SET.served(), held = all.filter((c) => c.held !== null);
  t('claims.set.js names the ' + B.SET.length + ' objects of the first claim set, shape for shape, in its order (' + served.length + ' served, ' + held.length + ' held)',
    JSON.stringify(all.map((c) => [c.shape, c.path])) === JSON.stringify(B.SET.map((x) => [x.shape, x.path])));
  t('every claim has a first variant that is the object as it stands and at least one declared change', all.every((c) => c.variants[0].edits.length === 0 && c.variants.length >= 2));
  t('every shape that has a served claim has one whose changes reach a second word', SET.SHAPES.filter((s) => served.some((c) => c.shape === s.id)).every((s) => served.some((c) => c.shape === s.id && new Set(c.variants.map((v) => v.expect)).size >= 2)));

  /* ---- the bundle the page serves ---- */
  const bp = path.join(ROOT, CB.BUNDLE_REL), mp = path.join(ROOT, B.manifestPathOf(CB.BUNDLE_REL));
  if (!fs.existsSync(bp) || !fs.existsSync(mp)) { console.log('claims page: REFUSED, no ' + CB.BUNDLE_REL + ' (node playground/textbook-machine/claims.build.js --write)'); return 1; }
  const bundleText = fs.readFileSync(bp, 'utf8'), D = CB.derive();
  const refusal = WB.gate(bundleText, fs.readFileSync(path.join(ROOT, B.CHECK_REL)));
  if (refusal) { console.log('claims page: REFUSED, ' + refusal); return 1; }
  ok.push('the served bundle passes the checker bundle\'s gate: the recorded check.js sha256, the bytes between its marks, the file on disk');
  t(CB.BUNDLE_REL + ' and its manifest re-derive byte for byte (' + D.manifest.bundle.bytes.toLocaleString('en-US') + ' bytes, ' + D.manifest.totals.files + ' files)',
    bundleText === D.bundle && fs.readFileSync(mp, 'utf8') === D.manifestText, 'node playground/textbook-machine/claims.build.js --write after a reviewed change');
  const servedFiles = new Set(D.manifest.files.map((f) => f.path));
  const full = JSON.parse(fs.readFileSync(path.join(ROOT, B.manifestPathOf(B.OUT_BUNDLE)), 'utf8'));
  const needOf = (p) => full.objects.find((o) => o.path === p).needs;
  const servedNeeds = new Set([].concat(...served.map((c) => needOf(c.path))));
  const heldOnly = [...new Set([].concat(...held.map((c) => needOf(c.path).concat([c.path]))))].filter((f) => !servedNeeds.has(f));
  t('the served bundle carries no held object and none of the ' + heldOnly.length + ' files only a held object needs (' + heldOnly.filter((f) => f.startsWith('corpus/')).join(', ') + ')',
    heldOnly.length > 0 && heldOnly.every((f) => !servedFiles.has(f)) && D.manifest.objects.length === served.length);

  /* ---- the rule, three ways ---- */
  const S = WB.sandbox(bundleText);
  S.call('(function () { ' + MODULE_TEXT + '\n; return typeof ClaimVerdict.claimVerdict; })()');
  const inTab = (text, file) => S.call('(function () { var got = ClaimChecker.decide(' + JSON.stringify(text) + ', ' + JSON.stringify(file) + '), cv = ClaimVerdict.claimVerdict(got, ' + JSON.stringify(W) + ');'
    + ' return { verdict: cv.verdict, why: cv.why, kind: cv.kind, repair: cv.repair, parts: cv.parts.map(function (p) { return p.word; }), line: got.line, exit: got.exit }; })()');
  t('claim-verdict.js runs in the bare sandbox beside the bundle and adds one global there', S.call('typeof ClaimVerdict.claimVerdict') === 'function' && S.hostTypes().every((x) => x === 'undefined'));
  /* a second reading of Node's printed line: REFUSED when the line says so; else the three words it prints for the
     parts (the bracket when a record is attached, else "from the object:"), the repair apart, composed by verdict.js */
  const second = (line) => {
    if (line === null || line.startsWith(V.REFUSED)) return V.REFUSED;
    const br = /^ADMITTED {2}\S+ {2}\[([^\]]*)\]/.exec(line);
    const rec = br[1].split(' · ').filter((w) => w && !w.startsWith('repair:'));
    const fo = / {2}from the object: (.*?)(?: {2}inputs: | {2}# s)/.exec(line);
    const words = rec.length ? rec : fo ? fo[1].match(/CERTIFIED|REFUTED|REFUSED/g) || [] : [];
    return words.length ? V.compose(words) : null;
  };
  const table = CB.nodeTable(all), lines = [];
  for (const row of table) {
    const c = all.find((x) => x.id === row.id), n = row.variants[0], s2 = second(n.line);
    const tab = c.held === null ? inTab(c.text, c.file) : null;
    lines.push('          ' + (c.held === null ? 'served ' : 'held   ') + c.shape.padEnd(23) + n.verdict.padEnd(10) + row.id + (n.repair ? '  (repair: ' + n.repair + ')' : '') + (n.kind ? '  ' + n.kind : ''));
    t('one verdict, ' + row.id + ': ' + n.verdict + ' by the module over Node' + ', by a second reading of Node\'s line through verdict.js' + (tab ? ', and by the module in the sandbox over the bundle' : ' (held: not in the served bundle)'),
      n.verdict === s2 && n.verdict === n.expect && (!tab || (tab.verdict === n.verdict && tab.why === n.why && tab.kind === n.kind && tab.repair === n.repair && JSON.stringify(tab.parts) === JSON.stringify(n.parts) && CB.mask(tab.line) === n.line && tab.exit === n.exit)),
      'module ' + n.verdict + ' / second reading ' + s2 + ' / set ' + n.expect + (tab ? ' / sandbox ' + tab.verdict : ''));
  }
  const seen = new Set(table.filter((row) => all.find((x) => x.id === row.id).held === null).map((row) => row.variants[0].verdict));
  t('the served claims show the three words as they stand', V.WORDS.every((w) => seen.has(w)), [...seen].join(' '));

  /* ---- the declared changes ---- */
  let nChanges = 0; const chBad = [];
  for (const row of table) {
    const c = all.find((x) => x.id === row.id);
    row.variants.forEach((n, i) => {
      if (i === 0) return;
      nChanges++;
      const tab = c.held === null ? inTab(SET.applyEdits(c.text, c.variants[i].edits), c.file) : null;
      if (n.verdict !== n.expect || second(n.line) !== n.verdict || (tab && (tab.verdict !== n.verdict || tab.kind !== n.kind || CB.mask(tab.line) !== n.line)))
        chBad.push(row.id + ' "' + n.label + '": Node ' + n.verdict + ', second reading ' + second(n.line) + ', set ' + n.expect + (tab ? ', sandbox ' + tab.verdict : ''));
    });
  }
  t('each of the ' + nChanges + ' declared changes turns the word the set says, by the module over Node, by the second reading, and in the sandbox for the served claims', nChanges >= all.length && !chBad.length, chBad.join('\n          '));
  const flips = table.map((row) => row.id + ': ' + row.variants.map((v) => v.verdict).join(' -> '));

  /* ---- composition: the module against instruments/verdict.js on every list of one to five words ---- */
  const admitted = (decided, fromObject) => ({ line: 'ADMITTED', exit: 0, kind: null, result: { word: 'ADMITTED', kind: null, msg: '', decided, fromObject, notes: [] } });
  const fo = (w) => (w === null ? null : { word: w, value: null });
  let lists = 0; const compBad = [];
  (function walk(ws) {
    if (ws.length) {
      lists++;
      const want = V.compose(ws);
      const asObject = CV.claimVerdict(admitted([], ws.map(fo)), W).verdict, asRecord = CV.claimVerdict(admitted(ws.slice(), ws.map(() => null)), W).verdict;
      if (asObject !== want || asRecord !== want) compBad.push(ws.join(' · ') + ': compose ' + want + ', object ' + asObject + ', record ' + asRecord);
    }
    if (ws.length < 5) for (const w of V.WORDS) walk(ws.concat([w]));
  })([]);
  t('on all ' + lists + ' lists of one to five words, as the object\'s own and as a record\'s, the module equals verdict.js compose()', lists === 363 && !compBad.length, compBad.slice(0, 3).join('; '));

  /* ---- red controls ---- */
  const cv = (got) => CV.claimVerdict(got, W);
  r('one REFUTED part among four certified ones gives REFUTED, from the object and from a record',
    cv(admitted([], [W.CERTIFIED, W.CERTIFIED, W.REFUTED, W.CERTIFIED, W.CERTIFIED].map(fo))).verdict === W.REFUTED
    && cv(admitted([W.CERTIFIED, W.REFUTED], [null, null])).verdict === W.REFUTED && cv(admitted([W.CERTIFIED, W.CERTIFIED], [null, null])).verdict === W.CERTIFIED);
  const refusedGot = { line: 'REFUSED   x  schema: y', exit: 1, kind: 'schema', result: { word: W.REFUSED, kind: 'schema', msg: 'y', decided: [W.CERTIFIED], fromObject: [fo(W.CERTIFIED)], notes: [] } };
  r('a claim the checker refuses gives REFUSED whatever its parts say, and is not admitted', cv(refusedGot).verdict === W.REFUSED && cv(refusedGot).admitted === false && cv(refusedGot).why === 'checker-refused');
  const nothing = cv(admitted([], [null]));
  r('an admitted claim with nothing decided gives REFUSED, "nothing was decided", where the composition of no words says ' + V.compose([]),
    nothing.verdict === W.REFUSED && nothing.why === 'nothing-decided' && /nothing was decided/.test(nothing.reason) && V.compose([]) === W.CERTIFIED);
  const partial = cv(admitted([], [fo(W.CERTIFIED), null, fo(W.CERTIFIED)]));
  r('a part left undecided beside two certified ones gives REFUSED, never CERTIFIED; with a refuted part beside it, REFUTED',
    partial.verdict === W.REFUSED && partial.why === 'part-undecided' && cv(admitted([], [fo(W.CERTIFIED), null, fo(W.REFUTED)])).verdict === W.REFUTED);
  r('no line at all (the checker refused to run) gives REFUSED with nothing admitted', [{ line: null, exit: 2, kind: null, result: null }, null, { line: null, exit: 0, result: { decided: [W.CERTIFIED], fromObject: [null] } }]
    .every((g) => { const x = cv(g); return x.verdict === W.REFUSED && x.why === 'silent' && !x.admitted; }));
  const rep = (w) => cv(admitted([W.REFUTED, CV.REPAIR + w], [null]));
  r('a repair\'s word never enters the verdict: REFUTED with its repair CERTIFIED stays REFUTED, and CERTIFIED with a repair REFUTED stays CERTIFIED',
    rep(W.CERTIFIED).verdict === W.REFUTED && rep(W.CERTIFIED).repair === W.CERTIFIED && cv(admitted([W.CERTIFIED, CV.REPAIR + W.REFUTED], [null])).verdict === W.CERTIFIED);
  r('a word that is not one of the three is refused as unreadable, and so is a record whose words do not number the parts',
    cv(admitted([], [fo('PROVED')])).why === 'unreadable' && cv(admitted(['REPAIRED'], [null])).verdict === W.REFUSED && cv(admitted([W.CERTIFIED, W.CERTIFIED], [null])).why === 'unreadable');
  let threw = false; try { CV.claimVerdict(admitted([], [fo(W.CERTIFIED)]), { CERTIFIED: 'A', REFUTED: 'A', REFUSED: 'B' }); } catch (e) { threw = true; }
  r('the module refuses to run on three words that are not three', threw);
  const planted = table.map((row) => row.variants[0]).find((n) => n.verdict === W.CERTIFIED);
  r('a planted wrong expectation is caught: the comparison this battery makes can fail', planted && planted.verdict !== W.REFUTED && second(planted.line.replace(W.CERTIFIED, W.REFUTED)) === W.REFUTED);
  const h = held[0];
  if (h) {
    const got = inTab(h.text, h.file), node = table.find((row) => row.id === h.id).variants[0];
    r('a held object given to the served bundle is refused there for a file it does not carry (' + got.kind + '), though Node in the repository decides it ' + node.verdict,
      got.verdict === W.REFUSED && got.kind === 'pin-unresolved' && node.verdict !== W.REFUSED, JSON.stringify(got));
  }

  for (const s of ok) console.log('  ok    ' + s);
  for (const s of red) console.log('  ok    ' + s);
  for (const s of bad) console.log('  FAIL  ' + s);
  console.log('  one verdict per claim, as the objects stand:');
  for (const l of lines) console.log(l);
  console.log('  the declared changes:');
  for (const l of flips) console.log('          ' + l);
  console.log(bad.length ? 'claims page (one verdict per claim): FAIL, ' + bad.length + ' failure(s)'
    : 'claims page (one verdict per claim): PASS, ' + ok.length + ' checks and ' + red.length + ' red controls');
  return bad.length ? 1 : 0;
}

if (require.main === module) { try { process.exit(main()); } catch (e) { console.error('claims page: REFUSED, ' + (e && e.stack || e)); process.exit(1); } }
