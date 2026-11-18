#!/usr/bin/env node
/* record-intmul.js — the audit of two Lean proofs that integers multiply below n log n on a Turing machine
   (Cui, Liu, Woodruff: lockqueue/intmul @ 4738aeff; Brown, Daniel: platypii/integer-mult-bounds-lean @ aaf10926), each
   pre-registered question (corpus/intmul/preregistration.json, Q1–Q6) read back from the facts. Writes
   certs/intmul-audit.json; `--check` re-derives it and refuses on any difference.

   THE MATHEMATICS IS NOT OURS, and no verdict here is on OpenAI's manuscript. What this record reads:
     certs/lean-intake-intmul-gcmu.json, certs/lean-intake-intmul-community.json   the two intake records (their own
                                           tool, tools/lean-intake.js, decides them from corpus/lean-intake/<id>/runs)
     corpus/intmul/preregistration.json    the questions, the words, the stop rules: written before the pod
     corpus/intmul/amendments.json         every departure from them, written after
     corpus/intmul/pod/                    what the pod wrote outside the two registered runs (logs over 200 kB gzipped)
     corpus/intmul/bridge/                 the Lean sources of the theorem joining the two statements, and their check log
     corpus/intmul/checks/                 the inputs of the checks added after the first result
     corpus/intmul/programs/               the released programs against Python's integers, row by row
     corpus/intmul/readings/               the two readings of the statements (hashed, never parsed for a verdict)
     corpus/intmul/public-record.json      dates of the public record, read from primary sources (a reading)
   Nothing is run here: no Lean, no pod. A fact that is missing, or that stops saying what a sentence of the record
   states, refuses the build.

   usage: node tools/record-intmul.js [--check]                                                                    MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..');
const F = path.join(ROOT, 'corpus', 'intmul');
const OUT = path.join(ROOT, 'certs', 'intmul-audit.json');
const die = (m) => { console.error('record-intmul: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const has = (rel) => fs.existsSync(path.join(F, rel)) || fs.existsSync(path.join(F, rel + '.gz'));
const rd = (rel) => { const p = path.join(F, rel);
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  if (fs.existsSync(p + '.gz')) return zlib.gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8');
  return die('missing fact corpus/intmul/' + rel); };
const one = (rel) => rd(rel).trim();
const shaOf = (rel) => sha(fs.readFileSync(path.join(F, rel)));
const root = (rel) => { const p = path.join(ROOT, rel); if (!fs.existsSync(p)) die('missing ' + rel); return fs.readFileSync(p, 'utf8'); };
const jl = (rel) => rd(rel).split('\n').filter(Boolean).map((l) => JSON.parse(l));
const STD = ['Classical.choice', 'Quot.sound', 'propext'];
const std = (a) => JSON.stringify([...a].sort()) === JSON.stringify(STD);
/* `/usr/bin/time -v`, as every step on the pod was wrapped */
const timeV = (text) => { const w = /Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (\S+)/.exec(text), k = /Maximum resident set size \(kbytes\): (\d+)/.exec(text), e = /Exit status: (\d+)/.exec(text);
  return { wall: w ? w[1] : null, peakGiB: k ? Math.round(Number(k[1]) / 1048576 * 10) / 10 : null, exitStatus: e ? Number(e[1]) : null }; };
/* one step of the optional checks: <base>.start .end .exit .out .err (the .err ends with time -v) */
const step = (base) => { const err = rd(base + '.err'); return Object.assign({ files: 'corpus/intmul/' + base + '.*', start: one(base + '.start'), end: has(base + '.end') ? one(base + '.end') : null, exit: has(base + '.exit') ? Number(one(base + '.exit')) : null }, timeV(err)); };
const lines = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean);
const grab = (t, re, what) => { const m = re.exec(t); if (!m) die('a fact no longer says: ' + what); return m; };

const PRE = JSON.parse(rd('preregistration.json'));
const AM = JSON.parse(rd('amendments.json'));
const COST = JSON.parse(rd('pod/cost.json'));
const PUB = JSON.parse(rd('public-record.json'));
const cert = (id) => JSON.parse(root('certs/lean-intake-' + id + '.json'));
const G = cert('intmul-gcmu'), C = cert('intmul-community');
const RUN = (id, f) => root('corpus/lean-intake/' + id + '/runs/2026-11-17/' + f);

function build() {
  /* ---- pins: the pre-registration, the two specs, the two records ---- */
  for (const id of ['intmul-gcmu', 'intmul-community']) need(sha(fs.readFileSync(path.join(ROOT, 'corpus/lean-intake/' + id + '/spec.json'))) === PRE.specs[id], 'the spec of ' + id + ' is not the pre-registered one');
  need(G.pins.canonical.head === PRE.claims['google-cmu'].commit && G.pins.canonical.sha256 === PRE.claims['google-cmu'].files['lean/SubNLogN/Challenge.lean'], 'the Google/CMU record is not of the pre-registered pin');
  need(C.pins.canonical.head === PRE.claims.community.commit && C.pins.canonical.sha256 === PRE.claims.community.files['IntegerMultBounds/MathlibTM2/Statement.lean'], 'the community record is not of the pre-registered pin');

  /* ---- Q4 first, because Q1 leans on it: the planted statements, the planted defects ---- */
  const controls = (R) => { const m = R.mutants;
    const predicted = m.filter((x) => x.predicted), verdict = m.filter((x) => x.tested);
    return { planted: m.length, predicted: predicted.length, gotAVerdict: verdict.length,
      asPredicted: predicted.filter((x) => x.tested && x.asExpected).length,
      rewordingsAccepted: m.filter((x) => x.kind === 'same' && x.outcome === 'ACCEPTED').length + ' of ' + m.filter((x) => x.kind === 'same').length,
      refused: m.filter((x) => /^REFUSED/.test(x.outcome)).map((x) => x.id),
      noVerdict: m.filter((x) => !x.tested).map((x) => ({ id: x.id, change: x.why, predicted: x.predicted ? x.expect : 'none (the kernel decides)' })),
      noPrediction: m.filter((x) => !x.predicted).map((x) => ({ id: x.id, change: x.why, outcome: x.outcome })),
      rows: m.map((x) => ({ id: x.id, kind: x.kind, change: x.why, predicted: x.predicted ? x.expect : 'none', outcome: x.outcome })) }; };
  const cg = controls(G), cc = controls(C);
  /* the structural comparison, added after the first result: each planted statement against the statement, as
     expressions, with no unfolding of the big power (folded: against the named constant; unfolded: against its body) */
  const struct = (short, R) => { const out = [];
    for (const m of R.mutants) { /* C6 of each spec names a Mathlib constant the statement file does not import: its first comparison did not elaborate (exit 1) and it was compared again with Mathlib imported (C6m) */
      const t = rd('pod/extra/struct/' + short + '-' + (m.id === 'C6' ? 'C6m' : m.id) + '.log');
      const s = grab(t, /^STRUCT (\S+) folded=(true|false) unfolded=(true|false)$/m, 'a STRUCT line for ' + short + ' ' + m.id);
      need(s[1] === m.id && /^exit 0$/m.test(t), 'the structural comparison of ' + short + ' ' + m.id + ' did not end with exit 0');
      out.push({ id: m.id, kind: m.kind, sameAsNamed: s[2] === 'true', sameAsBody: s[3] === 'true' }); }
    const changed = out.filter((x) => x.kind !== 'same'), same = out.filter((x) => x.kind === 'same');
    need(changed.every((x) => !x.sameAsNamed && !x.sameAsBody), 'a changed statement of ' + short + ' is the same expression as the statement');
    need(/^exit 1$/m.test(rd('pod/extra/struct/' + short + '-C6.log')) && /Unknown constant/.test(rd('pod/extra/struct/' + short + '-C6.log')), 'the first C6 comparison of ' + short + ' no longer fails on an unknown constant');
    return { changedAllDifferent: changed.length + ' of ' + changed.length, rewordings: same.map((x) => ({ id: x.id, sameAsNamed: x.sameAsNamed, sameAsBody: x.sameAsBody })),
      rewordingsDifferentAsExpressions: same.filter((x) => !x.sameAsNamed && !x.sameAsBody).map((x) => x.id),
      c6: 'compared with Mathlib imported (C6m); its first comparison did not elaborate: the statement file does not import the constant it names' }; };
  const sg = struct('gcmu', G), sc = struct('community', C);
  need(sg.rewordingsDifferentAsExpressions.join() === 'S3' && sc.rewordingsDifferentAsExpressions.join() === 'S3', 'the rewordings that differ as expressions are no longer S3 alone');
  /* nanoda shown one planted defect (the added axiom), in both of its modes */
  const r2t = rd('pod/extra/red-R2-nanoda-true.log'), r2f = rd('pod/extra/red-R2-nanoda-false.log');
  const defectToNanoda = {
    export: one('pod/extra/red-R2-export.log'),
    hardError: { exit: Number(grab(r2t, /^exit (\d+)$/m, 'an exit line')[1]), says: grab(r2t, /export file declares unpermitted axiom "([^"]+)"/, 'the unpermitted axiom named')[0] },
    softError: { exit: Number(grab(r2f, /^exit (\d+)$/m, 'an exit line')[1]), says: grab(r2f, /depends on \S+ which was not found in the environment/, 'the missing axiom named')[0] } };
  need(defectToNanoda.hardError.exit !== 0 && defectToNanoda.softError.exit !== 0, 'nanoda no longer fails on the planted axiom');

  /* ---- the comparator runs (optional checks, run after the registered ones) ---- */
  const last = (base) => { const o = lines(rd(base + '.out')), e = lines(rd(base + '.err')).filter((l) => /^uncaught exception|overflowed its stack|^fatal runtime error/.test(l)); return { out: o.slice(-4), err: e }; };
  const env = (f) => Object.fromEntries(lines(rd(f)).filter((l) => /^(comparator|lean4export|nanoda|landrun|kernel|lean): /.test(l)).map((l) => { const i = l.indexOf(': '); return [l.slice(0, i), l.slice(i + 2)]; }));
  const firstTry = Object.assign(step('pod/extra2/A1.comparator-positive'), { nanoda: env('pod/extra2/A.env.txt').nanoda, said: last('pod/extra2/A1.comparator-positive').err });
  need(firstTry.said.some((l) => /overflowed its stack/.test(l)), 'the first comparator attempt no longer ends in a stack overflow');
  const pos = step('pod/extra2/r2/A1.comparator-positive'), posSaid = last('pod/extra2/r2/A1.comparator-positive').out;
  need(pos.exit === 0 && posSaid.includes('Nanoda kernel accepts the solution') && posSaid.includes('Lean default kernel accepts the solution') && posSaid.includes('Your solution is okay!'), 'comparator no longer accepts the Google/CMU proof under both kernels');
  /* the release's nine controls, with what its own replay record says of each (lean/replay at the pin) */
  const NINE = [['S0_IdenticalCopy', 'a byte-identical copy of the statement', 'accepted'], ['S1_Exp45', 'the exponent 46 made 45', 'statement'], ['S2_NoFinite', 'the finite-alphabets clause deleted', 'statement'], ['S3_StrictLt', '≤ made <', 'statement'],
    ['P1_Sorry', 'the proof replaced by sorry', 'axiom'], ['P2_AddedAxiom', 'an added axiom', 'axiom'], ['P3_NativeDecide', 'native_decide', 'axiom'], ['P4_ExtraAxiomTransitive', 'an axiom hidden one step away', 'axiom'], ['P5_DefinitionSwap', 'the statement redefined as True', 'statement']];
  const nine = NINE.map(([id, change, expect]) => { const base = ['pod/extra2/r2/A2.control-' + id, 'pod/extra2/r3/A2.control-' + id].find((b) => has(b + '.exit')) || die('no run of the control ' + id);
    const s = step(base), l = last(base), ex = l.err.find((x) => /^uncaught exception/.test(x)) || null;
    const got = s.exit === 0 && l.out.includes('Your solution is okay!') ? 'accepted' : ex && /^uncaught exception: Const does not match between challenge and target/.test(ex) ? 'statement' : ex && /^uncaught exception: Illegal axiom detected/.test(ex) ? 'axiom' : 'other';
    return { id, change, exit: s.exit, start: s.start, end: s.end, said: ex ? ex.replace(/^uncaught exception: /, '') : l.out.slice(-1)[0], outcome: got === 'accepted' ? 'accepted' : got === 'statement' ? 'refused: the statement does not match' : got === 'axiom' ? 'refused: an axiom outside the three' : 'OTHER', asTheReleaseReports: got === expect }; });
  need(nine.every((x) => x.asTheReleaseReports), 'a control of the release no longer comes out as the release reports');
  const ck = step('pod/extra2/r2/C1.comparator-control-kappa'), ckSaid = last('pod/extra2/r2/C1.comparator-control-kappa').err[0] || '';
  need(ck.exit === 1 && /Challenge and solution theorem statement do not match: 'IntegerMultBounds\.MathlibTM2\.mulInTime'/.test(ckSaid), 'comparator no longer refuses the community statement with the numerator raised by one');

  /* ---- Q1 · Google/CMU ---- */
  const gFresh = Object.assign({ files: 'corpus/intmul/pod/extra/gcmu-fresh.*', start: one('pod/extra/gcmu-fresh.start'), end: one('pod/extra/gcmu-fresh.end'), exit: Number(one('pod/extra/gcmu-fresh.exit')) }, timeV(rd('pod/extra/gcmu-fresh.err')));
  const gNanoda = Number(grab(RUN('intmul-gcmu', 'nanoda.log'), /Checked (\d+) declarations with no typechecker errors/, 'nanoda\'s count')[1]);
  const l4l = step('pod/extra2/B1.lean4lean-gcmu'), l4lf = step('pod/extra2/B2.lean4lean-gcmu-fresh');
  const l4lSaid = lines(rd('pod/extra2/B2.lean4lean-gcmu-fresh.err')).find((l) => /^uncaught exception/.test(l)) || '';
  const clg = step('pod/extra2/r4/A3.con-leche-gcmu'), clgSaid = one('pod/extra2/r4/A3.con-leche-gcmu.out');
  const clEnv = lines(rd('pod/extra2/r4/L.env.txt'))[0];
  const q1g = {
    release: PRE.claims['google-cmu'].repo + ' @ ' + PRE.claims['google-cmu'].commit.slice(0, 8), theorem: G.pins.claim.decl, statement: G.pins.canonical.decl,
    record: 'certs/lean-intake-intmul-gcmu.json', recordVerdict: G.verdict,
    axioms: G.F1.axioms, builtFromSource: Number(grab(RUN('intmul-gcmu', 'claim.log'), /Build completed successfully \((\d+) jobs\)/, 'the build\'s job count')[1]) + ' jobs, exit ' + RUN('intmul-gcmu', 'claim.exit').trim(),
    nanoda: { build: '8de7e0c4', declarations: gNanoda, seconds: G.kernels[2].seconds, word: G.kernels[2].word, export: G.kernels[2].export },
    freshReplay: Object.assign({ what: 'leanchecker --fresh on the headline module: Lean\'s kernel on the whole closure, Mathlib included' }, gFresh),
    comparator: { what: 'leanprover/comparator on the release\'s own configuration (replay/configs/positive.json), in a copy of the checkout', tools: env('pod/extra2/r2/A.env.txt'), firstTry, run: Object.assign(pos, { said: posSaid.slice(-4) }) },
    lean4lean: { build: lines(rd('pod/extra2/tools/lean4lean2.log')).filter((l) => /^lean4lean on|in use|master/.test(l)), headlineModuleAlone: { exit: l4l.exit, said: one('pod/extra2/B1.lean4lean-gcmu.out').split('\n').slice(-1)[0], wall: l4l.wall }, fresh: { exit: l4lf.exit, wall: l4lf.wall, said: l4lSaid.replace(/^uncaught exception: /, ''), word: 'NO VERDICT: stopped at its recursion limit, not a rejection' } },
    conLeche: { tool: clEnv, exit: clg.exit, said: clgSaid, wall: clg.wall, peakGiB: clg.peakGiB, word: clg.exit === 0 && /^con-leche: accepted \d+ declarations/.test(clgSaid) ? 'ACCEPTS' : 'DOES NOT ACCEPT' },
    plantedStatements: cg, plantedDefects: G.reds.map((r) => ({ id: r.id, defect: r.why, caught: r.caught, how: r.how })),
  };
  need(G.verdict === 'CERTIFIED' && std(G.F1.axioms) && G.kernels[2].word === 'ACCEPTS' && gFresh.exit === 0 && gFresh.exitStatus === 0, 'the Google/CMU facts moved');
  need(cg.asPredicted === cg.predicted - cg.noVerdict.filter((x) => x.predicted !== 'none (the kernel decides)').length && cg.noVerdict.map((x) => x.id).join() === 'C1,C2,C5,C6,C11', 'the Google/CMU planted statements moved');
  need(l4l.exit === 0 && l4lf.exit === 1 && /deep recursion detected/.test(l4lSaid), 'the lean4lean facts moved');
  need(q1g.plantedDefects.length === 3 && q1g.plantedDefects.every((r) => r.caught), 'a planted defect was not caught (Google/CMU)');
  /* the checkers that accepted the whole closure, each written independently of the others */
  q1g.acceptedBy = ['Lean\'s kernel (the build from source; then a fresh replay of the whole closure)', 'nanoda (Rust): build 8de7e0c4 on the intake\'s export, and build ' + q1g.comparator.tools.nanoda.slice(0, 8) + ' inside comparator'].concat(q1g.conLeche.word === 'ACCEPTS' ? ['con-leche (--verified) on the intake\'s export'] : []);
  q1g.word = 'CERTIFIED';
  q1g.wordNote = 'CERTIFIED under amendment A1: five planted statements reached the check and got no verdict, so the pre-registered sentence about the planted statements is met only when read as "got a verdict". What those five were meant to show is shown by two checks added after the run: every changed statement differs from the statement as an expression, and comparator refuses the release\'s own exponent-45 control.';

  /* ---- Q1 · community ---- */
  const wd = lines(rd('pod/extra/memory-watchdog.txt')), wdStop = wd.findIndex((l) => /STOPPED the run/.test(l));
  need(wdStop > 0, 'the watchdog log no longer shows the stop');
  const resumed = JSON.parse(RUN('intmul-community', '_resumed.json'));
  const g3 = lines(rd('pod/extra/guard3.txt')), g2 = lines(rd('pod/extra/guard2.txt'));
  const g3Stop = g3.find((l) => /second nanoda attempt is stopped/.test(l)) || die('guard3 no longer shows the second stop');
  /* the fresh replay's memory, minute by minute, from the guard's own lines */
  const fr = g3.map((l) => { const m = /^(\d\d:\d\d:\d\d) anon (\d+) GiB \| registered nanoda ([\d.]+) \| fresh ([\d.]+)/.exec(l); return m ? { at: m[1], gb: Number(m[4]) } : null; }).filter(Boolean);
  const firstOver = fr.find((x) => x.gb >= 12);
  const cFreshStop = one('pod/extra/community-fresh.stopped');
  const fs1 = grab(cFreshStop, /^(\S+) stopped by hand .* elapsed (\d+) s, VmRSS (\d+) kB/, 'the fresh replay\'s stop line');
  const cPosStop = one('pod/extra2/r3/C1.comparator-positive.stopped');
  const clc = has('pod/extra2/r4/C2.con-leche-community.exit') ? step('pod/extra2/r4/C2.con-leche-community') : null;
  const clcOut = has('pod/extra2/r4/C2.con-leche-community.out') ? one('pod/extra2/r4/C2.con-leche-community.out') : '';
  const clcStopped = has('pod/extra2/r4/C2.con-leche-community.stopped') ? one('pod/extra2/r4/C2.con-leche-community.stopped') : null;
  const q1c = {
    release: PRE.claims.community.repo + ' @ ' + PRE.claims.community.commit.slice(0, 8), theorem: C.pins.claim.decl, statement: C.F1.canonical,
    record: 'certs/lean-intake-intmul-community.json', recordVerdict: C.verdict,
    holds: {
      builtFromSource: Number(grab(RUN('intmul-community', 'claim.log'), /Build completed successfully \((\d+) jobs\)/, 'the build\'s job count')[1]) + ' jobs, exit ' + RUN('intmul-community', 'claim.exit').trim() + ', ' + Math.round(Number(RUN('intmul-community', 'claim.seconds'))) + ' s: Lean\'s kernel accepted every module as it was compiled',
      axioms: C.F1.axioms, statementIdentity: C.F1.report, statementIdentityHow: C.F1.how,
      plantedStatements: cc, plantedDefects: C.reds.map((r) => ({ id: r.id, defect: r.why, caught: r.caught, how: r.how })),
      comparatorControl: Object.assign({ what: 'comparator (no nanoda) on a challenge module written here, the numerator of the saving raised by one', tools: env('pod/extra2/r2/C.env.txt'), said: ckSaid.replace(/^uncaught exception: /, ''), outcome: 'refused: the statement does not match' }, ck),
    },
    secondKernel: {
      word: 'STOPPED on memory, twice; never a rejection',
      export: C.kernels[2].export,
      first: { what: 'nanoda 8de7e0c4, the registered step', started: grab(RUN('intmul-community', '_status.txt'), /^(\S+) start nanoda$/m, 'the start of the nanoda step')[1], stopped: wd[wdStop], lastReading: wd[wdStop - 1], by: 'the run\'s own memory watchdog (93% of the container\'s limit, file cache counted)', runExit: one('pod/intmul-community.exit') },
      second: { what: 'the same binary, configuration and export, started by hand', started: resumed.started, ended: resumed.ended, exit: Number(resumed.exit), seconds: C.kernels[2].seconds, stopped: g3Stop, by: 'our guard (pod-guard3.sh)', sha256: { binary: resumed.binary_sha256, config: resumed.config_sha256, export: resumed.export_sha256 } },
    },
    freshReplay: { what: 'leanchecker --fresh on the theorem\'s module: Lean\'s kernel on the whole closure', start: one('pod/extra/community-fresh.start'), stoppedAt: fs1[1], elapsedSeconds: Number(fs1[2]), residentGiBWhenStopped: Math.round(Number(fs1[3]) / 1048576 * 10) / 10, exit: Number(one('pod/extra/community-fresh.exit')), firstReadingOver12GiB: firstOver ? firstOver.at : null, readingsBeforeIt: firstOver ? fr.filter((x) => x.at < firstOver.at).length : fr.length, word: 'STOPPED on memory by hand; no output, not a rejection' },
    comparatorPositive: { what: 'comparator (no nanoda) on the true statement', start: one('pod/extra2/r3/C1.comparator-positive.start'), stopped: cPosStop, word: 'NO VERDICT: stopped by our guard, not run again' },
    lean4lean: { word: 'NOT RUN', why: one('pod/extra2/B3.skipped') },
    conLeche: clc ? { tool: clEnv, exit: clc.exit, said: clcOut.split('\n').slice(-1)[0], errSaid: lines(rd('pod/extra2/r4/C2.con-leche-community.err')).filter((l) => /^con-leche|^Command|rejected|declined|error/i.test(l)).slice(0, 6), wall: clc.wall, peakGiB: clc.peakGiB, stopped: clcStopped,
        word: clc.exit === 0 && /^con-leche: accepted \d+ declarations/.test(clcOut) ? 'ACCEPTS' : clcStopped ? 'STOPPED' : 'DOES NOT ACCEPT' }
      : (() => { /* con-leche ran alone on the pod: the guard's "optional" column is its memory, minute by minute */
        const st = one('pod/extra2/r4/A3.con-leche-gcmu.end').slice(11, 19);   /* the other con-leche run shared the pod until then */
        const cv = g3.map((l) => { const m = /^(\d\d:\d\d:\d\d) anon \d+ GiB \|.*\| optional ([\d.]+)$/.exec(l); return m ? { at: m[1], gib: Number(m[2]) } : null; }).filter((x) => x && x.at > st);
        const firstBig = cv.find((x) => x.gib >= 12) || die('the guard no longer shows con-leche growing');
        const before = cv.filter((x) => x.at < firstBig.at), stopLine = g3.filter((l) => /the optional checks are stopped/.test(l)).pop();
        return { tool: clEnv, word: 'STOPPED', start: one('pod/extra2/r4/C2.con-leche-community.start'), stopped: clcStopped || die('con-leche on the community export has neither an exit nor a stop note'), guardLine: stopLine,
          aloneFrom: one('pod/extra2/r4/A3.con-leche-gcmu.end'), readingsBeforeTheGrowth: before.length, highestBeforeTheGrowthGiB: Math.max(...before.map((x) => x.gib)), firstReadingOver12GiB: firstBig.at, lastReadingGiB: cv.filter((x) => x.gib > 0).pop().gib }; })(),
  };
  need(C.verdict === 'REFUSED' && C.words.F1 === 'CERTIFIED' && std(C.F1.axioms) && C.F1.report.defeq === true && C.kernels[2].word === 'REJECTS OR STOPPED' && Number(resumed.exit) === 137, 'the community facts moved');
  need(cc.noVerdict.length === 0 && cc.asPredicted === cc.predicted && cc.gotAVerdict === cc.planted, 'the community planted statements moved');
  need(q1c.holds.plantedDefects.length === 3 && q1c.holds.plantedDefects.every((r) => r.caught), 'a planted defect was not caught (community)');
  const secondChecker = q1c.conLeche.word === 'ACCEPTS';
  q1c.word = 'REFUSED';
  q1c.reason = secondChecker
    ? 'resources: the pre-registered second kernel, nanoda, never finished (stopped on memory twice), and Lean\'s own kernel was stopped on memory on a fresh replay of the closure. A different independent checker, con-leche, accepts the closure; that was not the pre-registered kernel and was added after the result, so the word stays REFUSED and the acceptance is stated beside it.'
    : 'resources: no second kernel finished. nanoda was stopped on memory twice, Lean\'s own kernel was stopped on memory on a fresh replay of the closure, and con-leche, a third checker, was stopped on memory too. Nothing rejected the proof.';

  /* ---- Q2 · the readings; the encodings on small pairs ---- */
  const enc = (id, f) => { const t = rd(f), m = grab(t, new RegExp('^ENC ' + id + ' (\\d+) pairs: all guards hold$', 'm'), 'the encodings of ' + id + ' on small pairs'); need(/^exit 0$/m.test(t), 'the encodings check of ' + id + ' did not exit 0'); return Number(m[1]); };
  const q2 = {
    word: 'READING',
    readings: [{ file: 'corpus/intmul/readings/first.md', sha256: shaOf('readings/first.md') }, { file: 'corpus/intmul/readings/second.md', sha256: shaOf('readings/second.md') }],
    whatBothFound: [
      'Neither proposition is its paper\'s theorem as written. Both are about Mathlib\'s multi-stack machine (FinTM2), on least-significant-bit-first words, with time measured in the total encoded length. The papers speak of a multitape machine. The step between the two is a classical simulation, argued in prose in both releases and formalized in neither; the Google/CMU paper says so.',
      'Both propositions are bare existence claims: one fixed machine, outside every quantifier over inputs, with no hypothesis that could be unsatisfiable.',
      'The Google/CMU statement requires every stack alphabet finite; the community statement does not (Mathlib asks it of the input stack only).',
      'The community theorem has the larger saving: κ = 4222422970/2^46, about 2^-14.02, against 2^-46. The Google/CMU paper\'s sentence that κ "improves from 2^-182 to 2^-46" does not mention it; reported without judging priority.',
      'The readers found no way to meet either proposition with something that is not, up to a constant factor, a multitape Turing machine running in the stated time.',
    ],
    encodingsOnSmallPairs: { what: 'each release\'s encoder evaluated in Lean on pairs produced by an encoder of ours (corpus/intmul/checks/first/gen.py), as #guard lines', gcmu: enc('intmul-gcmu', 'pod/extra/enc/gcmu.log') + ' pairs, all hold', community: enc('intmul-community', 'pod/extra/enc/community.log') + ' pairs, all hold' },
    notRead: 'Read only in part: the Google/CMU paper (its Algorithm 1, Sections 4–7 and appendices were not read), OpenAI\'s manuscript (abstract, Theorem 1, the start of §2), the community repository\'s proof files. A reading is not a verdict.',
  };

  /* ---- Q3 · the theorem joining the two statements ---- */
  const srcPod = Object.fromEntries(lines(rd('pod/extra/bridge-sources.sha256')).map((l) => l.split(/\s+/).reverse()));
  const SRC = ['SubNLogN/Challenge.lean', 'IntMulBridge/Bounds.lean', 'IntMulBridge/Encodings.lean', 'IntMulBridge/Finite.lean', 'IntMulBridge/Main.lean'];
  const sources = SRC.map((f) => { const h = shaOf('bridge/assembly/' + f); need(srcPod[f] === h, 'bridge/assembly/' + f + ' is not the file the pod compiled and exported'); return { file: 'corpus/intmul/bridge/assembly/' + f, sha256: h }; });
  need(sources[0].sha256 === PRE.claims['google-cmu'].files['lean/SubNLogN/Challenge.lean'], 'the bridge\'s copy of the Google/CMU statement file is not the pinned bytes');
  const chk = rd('bridge/assembly/check.log');
  need(/^RESULT: all five modules compile with exit 0/m.test(chk) && /^IntMulBridge\.community_proves_challenge : SubNLogN\.Challenge\.IntMulSubNLogN$/m.test(chk), 'the bridge\'s check log moved');
  const axLine = (t, n) => { const m = new RegExp("'" + n.replace(/\./g, '\\.') + "' depends on axioms: \\[([^\\]]+)\\]").exec(t); return m ? m[1].split(', ') : die('no axioms line for ' + n); };
  const mainLog = rd('pod/extra/bridge-asm2/Main.log');
  need(std(axLine(mainLog, 'IntMulBridge.community_proves_challenge')) && std(axLine(chk, 'IntegerMultBounds.MathlibTM2.mulInTime')), 'the bridge no longer rests on the three axioms');
  const bx = grab(one('pod/extra/bridge-export.log'), /^export exit (\d+) bytes (\d+) sha256 ([0-9a-f]{64})$/, 'the bridge export line');
  const bStop = g2.find((l) => /bridge theorem's nanoda is stopped/.test(l)) || die('guard2 no longer shows the bridge stop');
  need(bx[1] === '0' && /^exit 137$/m.test(rd('pod/extra/bridge-nanoda.log')), 'the bridge export or its nanoda run moved');
  const q3 = {
    theorem: 'IntMulBridge.community_proves_challenge : SubNLogN.Challenge.IntMulSubNLogN',
    says: 'The community proof gives the Google/CMU statement, as the Google/CMU statement file words it: compiled in the community release\'s environment (Lean 4.34.1), importing the community\'s theorem and a byte-identical copy of the Google/CMU statement file.',
    sources, axioms: axLine(mainLog, 'IntMulBridge.community_proves_challenge'),
    leanKernel: 'ACCEPTS: all five modules compile with exit 0 (corpus/intmul/bridge/assembly/check.log); after one comment line of Encodings.lean was changed (corpus/intmul/pod/extra/bridge-encodings-comment.diff) all five were compiled again, and the export below is of that build',
    export: { exit: Number(bx[1]), bytes: Number(bx[2]), sha256: bx[3], exporter: 'lean4export ' + one('pod/extra/bridge-lean4export-commit.txt') },
    secondKernel: { word: 'STOPPED on memory; never a rejection', what: 'nanoda 8de7e0c4 on the export', scriptStarted: one('pod/extra/bridge.start'), stopped: bStop, exit: 137 },
    parts: [
      { name: 'IntMulBridge.natForm_iff_bigOForm', says: 'for one time function, the Google/CMU inequality in ℕ and the community\'s =O form at κ = 2^-46 are equivalent' },
      { name: 'IntMulBridge.community_to_natForm', says: 'the community\'s bound at its κ gives the Google/CMU inequality' },
      { name: 'IntMulEnc.reencode', says: 'a machine for the tagged input encoding, with finite alphabets, gives one for the separator encoding, with finite alphabets, at a linear extra cost' },
      { name: 'IntMulBridge.mulInTimeFinite', says: 'the community machine rebuilt along the community\'s own chain, carrying that every stack alphabet is finite' },
    ],
    limits: [
      'One direction only. That the Google/CMU proof gives the community statement at κ = 2^-46 is a written argument (second reading, section 3); it is not built. It cannot give the community theorem itself, whose saving is larger.',
      'The finite-alphabets module rebuilds the community machine through the community\'s own lemmas. It is not proved equal to the machine hidden inside their existential theorem, which cannot be taken out and asked.',
      'The two releases pin different Lean and Mathlib versions. The statement proved here is the Google/CMU statement file compiled under the community\'s versions: the same bytes, and four Mathlib files diffed at both pins (no definition differs); the definitions underneath (asymptotics, real powers, logarithms) were not diffed.',
      'One kernel. Lean\'s kernel accepted the five modules; nanoda on the export was stopped on memory. The theorem imports the community proof, so it inherits that proof\'s missing second kernel.',
    ],
    word: 'PROVED IN LEAN, ONE KERNEL',
    wordNote: 'not CERTIFIED: the pre-registered word asks for two kernels',
  };

  /* ---- Q5 · the released programs against Python\'s integers ---- */
  const c1 = jl('programs/c.jsonl'), c2 = jl('programs/c2.jsonl'), py1 = jl('programs/py.jsonl'), py2 = jl('programs/py2.jsonl');
  const cAll = c1.concat(c2);
  need(cAll.every((r) => r.ours === 'EXACT' && r.exit === 0 && /^release_check=EXACT MATCH/.test(r.release_says)), 'a C row is not EXACT');
  need(py2.every((r) => r.python_int === 'EXACT' && (r.schoolbook === 'EXACT' || r.schoolbook === 'not run')), 'a Python row is not EXACT');
  const hit = (k) => py2.filter((r) => r.counts && r.counts[k]).length;
  const q5 = {
    word: 'EXACT on every input tried',
    c: { what: 'the C program of the companion paper (the O(n log n) multiplier; every product inside it is GMP\'s mpz_mul on pieces), against Python\'s integers', rows: cAll.length, exact: cAll.filter((r) => r.ours === 'EXACT').length, firstPass: c1.length, secondPass: c2.length,
      bits: [...new Set(cAll.map((r) => r.bits))].sort((a, b) => a - b), cases: [...new Set(cAll.map((r) => r.case))], modes: [...new Set(cAll.map((r) => r.algo))] },
    python: { what: 'the Python reference of Algorithm 1, against Python\'s integers and against a schoolbook product of ours, with the library\'s own counters recorded for each row', rows: py2.length, exactAgainstPythonIntegers: py2.filter((r) => r.python_int === 'EXACT').length, exactAgainstOurSchoolbook: py2.filter((r) => r.schoolbook === 'EXACT').length, schoolbookNotRun: py2.filter((r) => r.schoolbook === 'not run').length,
      smallInputShortcut: py2.filter((r) => r.counts && Object.keys(r.counts).length === 1 && r.counts['multiply.direct']).length, ranTheForcedBridge: hit('bridge.dft'), ranTheHierarchy: hit('hierarchy.multiply1'), fellBackToThe2DTransform: hit('multiply.fallback_2d'),
      sizes: [...new Set(py2.map((r) => String(r.bits)))], supersedes: 'programs/py.jsonl (' + py1.length + ' rows, all EXACT; its row labels said more than ran, and it recorded no counter)' },
    say: [
      'The C program implements the companion O(n log n) multiplier, not the algorithm below n log n, by its own README. "Exact" is a fact about that program; its arithmetic is GMP\'s.',
      'Algorithm 1 at the theorem\'s parameters is not executable at any feasible size, by the release\'s own statement. The Python rows exercise its pieces on test parameters; ' + py2.filter((r) => r.counts && Object.keys(r.counts).length === 1 && r.counts['multiply.direct']).length + ' of the ' + py2.length + ' rows return Python\'s own product through the small-input shortcut.',
      'No timing is quoted: the rows ran while the pod was building.',
      'Sizes above 10^8 bits were not run (the pre-registered refusal on resources).',
    ],
  };

  /* ---- Q6 · what the theorem buys, in exact arithmetic ---- */
  const K = 2n ** 46n, NUM = 4222422970n;
  need(NUM < K, 'the community saving is not below 1');
  const inv = (K * 1000n) / NUM;   /* 1/κ for the community theorem, to three decimals, rounded down */
  const q6 = {
    word: 'COMPUTED',
    gcmu: { kappa: '2^-46', twoTo46: K.toString(), says: 'The bound is n·(log2 n)^(1 − 2^-46): n log n divided by (log2 n)^(2^-46). That divisor equals 2 exactly when log2 n = 2^(2^46), that is for inputs of 2^(2^(2^46)) bits, and is below 2 for every shorter input.' },
    community: { kappa: NUM + '/2^46', kappaAsPowerOfTwo: '2^-' + (46 - Math.log2(Number(NUM))).toFixed(2) + ' (rounded)', oneOverKappa: (inv / 1000n) + '.' + String(inv % 1000n).padStart(3, '0') + ' (rounded down)', says: 'The bound is O(n·(ln n)^(1 − κ)): n ln n divided by (ln n)^κ. That divisor equals 2 exactly when ln n = 2^(1/κ), with 1/κ a little over ' + (inv / 1000n).toLocaleString('en-US') + '.' },
    constants: 'In both statements the constant in front and the length from which the bound holds are asserted to exist and are not given.',
  };

  /* ---- the amendments and the cost, as written ---- */
  need(Array.isArray(AM.amendments) && AM.amendments.every((a) => a.id && a.about && a.text), 'the amendments file is not a list of {id, about, text}');
  need(COST.pod === '3ik2qpnhfed4kx' && COST.deletedConfirmed === true && COST.usd <= 15, 'the cost file does not show the pod deleted inside the cap');

  /* ---- what is still open, first on any page ---- */
  const gaps = [
    { lead: 'The community proof has no second kernel.', text: 'nanoda was stopped on memory twice (' + q1c.secondKernel.first.lastReading.replace(/^\S+ /, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + ' the first time, ' + (/stopped at ([\d.]+) GB/.exec(g3Stop) || [])[1] + ' GiB the second). Lean\'s own kernel, replaying the whole closure afresh, was stopped at ' + q1c.freshReplay.residentGiBWhenStopped + ' GiB after ' + Math.floor(q1c.freshReplay.elapsedSeconds / 3600) + ' h ' + Math.round(q1c.freshReplay.elapsedSeconds % 3600 / 60) + ' min.'
      + (secondChecker ? ' A third checker, con-leche, accepts the closure; it was not the pre-registered kernel, so the word stays REFUSED.' : ' A third checker, con-leche, alone on the machine, stayed under ' + Math.ceil(q1c.conLeche.highestBeforeTheGrowthGiB + 0.5) + ' GiB for ' + q1c.conLeche.readingsBeforeTheGrowth + ' minutes, then grew by more than 10 GiB a minute and was stopped at ' + q1c.conLeche.lastReadingGiB + ' GiB.')
      + ' Nothing rejected the proof. The cause of the memory growth was not found.' },
    { lead: 'Some planted statements got no verdict.', text: cg.noVerdict.length + ' of the ' + cg.planted + ' statements planted against the Google/CMU proof got no verdict from the intake: its check ran into the elaborator\'s recursion limit under the 2^46 power. Every one that changes the saving is among them. The sentence written before the run is met only as amended afterwards. What those statements were meant to show comes from two checks added after the run.' },
    { lead: 'The theorem joining the two statements is partial.', text: 'It goes one way, was accepted by one kernel, and rebuilds the community machine instead of opening the one inside their theorem.' },
    { lead: 'The statements were read, not decided.', text: 'Neither formal statement is its paper\'s theorem as written: both are about Mathlib\'s multi-stack machine, and the step to a multitape machine is a classical argument that neither release formalizes. That the statements say what the papers say is a reading, made twice.' },
    { lead: 'A third proof was not audited.', text: 'A third Lean development of the same result exists (Prove2Me, prove2me/formalpedia). It was not audited here, and who was first is not decided here.' },
    { lead: 'Nothing here is about practical speed.', text: 'The saving reaches a factor of 2 only at sizes no computer will hold, the constants are not given, and the fast algorithm itself is not executable at any feasible size.' },
    { lead: 'The comparator runs are not the planned ones.', text: 'They used the release\'s own statement and configuration for Google/CMU and a challenge module written here for the community proof, not a statement typed from the paper as the plan said. Comparator\'s sandbox ran in best-effort mode on this machine.' },
    { lead: 'The source is not judged.', text: 'OpenAI\'s manuscript, which both proofs point to, is not judged here.' },
  ];

  const code = {};
  for (const f of ['tools/record-intmul.js', 'corpus/intmul/preregistration.json', 'corpus/intmul/amendments.json', 'corpus/intmul/public-record.json', 'corpus/intmul/README.md', 'corpus/intmul/pod/cost.json', 'certs/lean-intake-intmul-gcmu.json', 'certs/lean-intake-intmul-community.json'])
    code[f] = sha(fs.readFileSync(path.join(ROOT, f)));
  return {
    format: 1,
    what: 'The audit of two Lean proofs that two n-bit integers multiply in O(n (log n)^(1−κ)) steps on a Turing machine, for a fixed κ > 0: the Google/CMU release (Cui, Liu, Woodruff; κ = 2^-46) and the community release (Brown, Daniel; κ = 4222422970/2^46). Each pre-registered question read back from the facts.',
    notDecided: 'The mathematics is not ours. Not decided here: whether either statement is the informal theorem (a reading); OpenAI\'s manuscript; a third Lean development (Prove2Me), not audited; who was first; anything about practical speed. CERTIFIED never says more than what the kernels checked.',
    generated: new Date().toISOString().slice(0, 10),
    preregistration: { file: 'corpus/intmul/preregistration.json', sha256: shaOf('preregistration.json'), written: PRE.written, words: PRE.words },
    pins: PRE.claims,
    verdicts: {
      'Q1 Google/CMU': q1g.word + ' (as amended, A1)',
      'Q1 community': q1c.word + ' on resources' + (secondChecker ? ' (con-leche accepts; nanoda and the fresh replay stopped on memory)' : ' (no second kernel finished: nanoda, Lean\'s fresh replay and con-leche each stopped on memory)'),
      'Q2': q2.word,
      'Q3': q3.word,
      'Q4': 'Google/CMU ' + cg.asPredicted + ' of ' + cg.predicted + ' predictions met, ' + cg.noVerdict.length + ' statements with no verdict; community ' + cc.asPredicted + ' of ' + cc.predicted + '; defects ' + (q1g.plantedDefects.filter((r) => r.caught).length + q1c.holds.plantedDefects.filter((r) => r.caught).length) + ' of ' + (q1g.plantedDefects.length + q1c.holds.plantedDefects.length) + ' caught',
      'Q5': q5.word,
      'Q6': q6.word,
    },
    gaps,
    Q1: { 'google-cmu': q1g, community: q1c },
    Q2: q2, Q3: q3,
    Q4: { 'google-cmu': cg, community: cc,
      structuralComparison: { what: 'every planted statement compared with the statement as an expression, with nothing unfolded but the definition itself; added after the first result (amendment A1)', 'google-cmu': sg, community: sc },
      comparatorControls: { 'google-cmu': nine, community: [{ id: 'ControlKappa', change: 'the numerator of the saving raised by one', exit: ck.exit, said: ckSaid.replace(/^uncaught exception: /, ''), outcome: 'refused: the statement does not match' }] },
      aDefectShownToNanoda: defectToNanoda },
    Q5: q5, Q6: q6,
    publicRecord: { file: 'corpus/intmul/public-record.json', what: PUB.what, rows: PUB.rows },
    amendments: { file: 'corpus/intmul/amendments.json', count: AM.amendments.length, list: AM.amendments },
    cost: COST,
    code,
  };
}

const L = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
const line = Object.entries(L.verdicts).map(([k, v]) => k + ': ' + v).join(' · ');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/intmul-audit.json is not what the facts and this code give now');
  console.log('PASS record-intmul: re-derived, identical · ' + line);
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('record-intmul: ' + line);
}
