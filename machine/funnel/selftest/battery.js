/* selftest/battery.js — how a generate-and-verify machine is tested.
   ENGINE SELFTEST — ships nowhere, mints nothing, claims nothing.

   Runs the whole funnel end-to-end against a SYNTHETIC target whose structure
   is fully known (selftest/targets/synthetic.js: 441 integer vectors, exactly
   four hits, all planted, property decided exactly in BigInt, one provably
   empty sub-box), and proves every red control can actually fire:

     1  PLANTED RECALL      enum finds and certifies every planted hit (100%)
     2  EMPTY BOX           exhaust() emits a RECORD with an exhaustionCertificate,
                            zero HIT shapes
     3  RED CONTROLS        (a) sabotaged certify caught by the certificate
                                re-check against the independent recompute
                            (b) gamed score (scaleInflate raises it) refused
                                by the score battery
                            (c) forged experiments line caught by the chained
                                line hashes — resume refuses
                            (d) fs-touching generator caught by the vm
                                write-fence
                            (e) bare superlative refused by the claim guard
     4  KILL-AND-RESUME     3 batches, kill (plus a torn partial line), resume:
                            final run file + best.json byte-identical to an
                            uninterrupted run at the same seed
     5  SCREEN CALIBRATION  a screen rejecting half the planted hits is caught
                            by the recall control; a screen built to leak shows
                            a nonzero measured false-negative rate in the
                            reject audit
     6  LLM MOCK            the llm engine with no key runs deterministically,
                            schema-valid, labeled mock in every record, no
                            network; the dumb-baseline enum control runs at
                            equal budget and both appear in the session summary
     7  PROVENANCE+COUNTERS (M2/M3, adopted 2026-08-20) stats.js memos refuse
                            unprovenanced lines and undefined metrics; the
                            session summary carries BOTH counters (certified
                            HITs and new-to-board admissions) with their
                            definitions, and checkSessionSummary refuses a
                            summary that drops either
     8  LIVE PROMPT CHAIN   (promptSha) with a fake key + stubbed fetch (no
                            network), every live candidate record chains the
                            sha256 of the verbatim request that produced it;
                            verifyLlmLog catches a tampered request; the key
                            appears in no written file; the two counters
                            demonstrably diverge (100 certified HITs, 1
                            new-to-board) on one run
     9  BOARD DISCIPLINE    (Phase 3) canonical dedup kills the permutation-
                            duplicate class; a better instance improves the
                            entry in place with the superseded version archived
                            to mute, discoverer kept; region floors refuse or
                            displace-to-mute, never silently delete; the bingo
                            dry-halt stops a campaign that has gone dry and
                            does NOT fire while admissions keep coming; a
                            non-enum RECORD names the schema box it actually
                            roamed, not the enum grid
    10  CASCADE             (Phase 4) staged screens, cheapest first: the
                            conservation identity in = rejected + passed holds
                            at every stage (checked at write AND re-derived by
                            this battery); the reject audit reports false
                            negatives PER STAGE; a stage that eats a planted
                            hit is refused by name at recall
    11  LLM STEERING        (Phase 4) FunSearch's best-shot pair (v0/v1 sorted
                            worse-to-better, propose v2) appears once the board
                            can supply it; the certifier/cascade failure
                            reasons ride state.recent into the next prompt
    12  SEARCHER            (Phase 4) the program-genome generator: a bounded
                            DSL interpreted under hard step/size caps (no eval,
                            no Function, fence intact), programs credited by
                            their candidates' measured outcomes, the generating
                            law legible in every hypothesis line, byte-
                            identical determinism across runs
    13  STATEMENT SPEC      (Phase 5) statement.json is the one pinned source
                            for what is being searched: header + every claim
                            carry statementSha; a spec that disagrees with the
                            target refuses the run, field named
    14  SHARDED COVER CERT  (Phase 5) exhaustion as per-window certificates +
                            one cover-tiling certificate, the RECORD their
                            mechanical conjunction; the tiny checker
                            (verifyShardedExhaust) refuses tampering, gaps,
                            overlaps by name; a hot shard refuses the whole
                            record; kill-and-resume byte-identical

   Exit 0 iff all fourteen are green. Output is deterministic (no paths, no
   timings), so two battery runs must produce byte-identical stdout. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const F = require(path.join(__dirname, '..', 'funnel.js'));

const TARGETS = p => path.join(__dirname, 'targets', p);
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'funnel-battery-'));
let dirN = 0;
/* every instance dir gets the SAME basename under a unique parent: the
   basename is part of the records (run header, best.json), so byte-identity
   comparisons across dirs require it to match */
function freshDir() {
  const d = path.join(tmpRoot, 'case-' + (dirN++), 'instance');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

let failures = 0;
const out = [];
function verdict(label, pass, detail) {
  if (!pass) failures++;
  out.push(label.padEnd(30) + (pass ? 'PASS' : 'FAIL') + ' — ' + detail);
}
function redline(label, fired, detail) {
  if (!fired) failures++;
  out.push('  ' + label.padEnd(34) + (fired ? 'FIRED' : 'DID NOT FIRE') + ' — ' + detail);
}
function readRun(dir, seed) {
  return fs.readFileSync(path.join(dir, 'experiments', 'run-' + seed + '.jsonl'), 'utf8');
}
function baseOpts(extra) {
  return Object.assign({
    targetPath: TARGETS('synthetic.js'),
    generator: 'enum',
    decades: [2, 3],
    batchSize: 32,
    quiet: true, log: () => {},
    env: {}                                    /* no key ever reaches the battery */
  }, extra);
}

async function main() {

  /* ---------------- ITEM 1: PLANTED RECALL ---------------- */
  {
    const dir = freshDir();
    const r = await F.runFunnel(dir, baseOpts({ seed: 's1' }));
    const best = JSON.parse(fs.readFileSync(path.join(dir, 'best.json'), 'utf8'));
    const got = best.entries.map(e => JSON.stringify(e.candidate.v)).sort();
    const want = [[2, 18], [3, 12], [4, 9], [6, 6]].map(v => JSON.stringify(v)).sort();
    const setsEqual = JSON.stringify(got) === JSON.stringify(want);
    const allCertified = best.entries.every(e => e.certificate && e.certRef);
    const hitClaims = r.summary ? r.summary.claims.filter(c => c.shape === 'HIT') : [];
    const recordClaims = r.summary ? r.summary.claims.filter(c => c.shape === 'RECORD') : [];
    const recordHonest = recordClaims.length === 1
      && recordClaims[0].text.includes('best known to this search')
      && recordClaims[0].text.includes('intGrid v in [0,20]x[0,20]');
    const pass = !r.refused && !r.aborted
      && r.summary.counts.generated === 441
      && r.summary.generatorExhausted === true
      && setsEqual && allCertified
      && best.entries.length === 4
      && hitClaims.length === 4
      && recordHonest;
    verdict('ITEM 1 PLANTED RECALL', pass,
      'enum over the full box: 441/441 enumerated, ' + best.entries.length + '/4 planted hits found+certified (recall '
      + (setsEqual ? '100%' : 'INCOMPLETE') + '), ' + hitClaims.length + ' HIT claims + 1 RECORD naming the box with the downgrade');
  }

  /* ---------------- ITEM 2: EMPTY BOX ---------------- */
  {
    const dir = freshDir();
    const r = F.runExhaust(dir, { targetPath: TARGETS('synthetic.js') });
    const file = path.join(dir, 'experiments', 'exhaust.json');
    const rec = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    const noHits = rec && rec.claims.every(c => c.shape !== 'HIT');
    const hasCert = rec && rec.claims.length === 1
      && rec.claims[0].shape === 'RECORD'
      && rec.claims[0].exhaustionCertificate
      && rec.claims[0].exhaustionCertificate.allRejected === true
      && rec.claims[0].exhaustionCertificate.cardinality === 42;
    const pass = !r.refused && !!hasCert && !!noHits && rec.checked === 42;
    verdict('ITEM 2 EMPTY BOX', pass,
      'exhaust() over the barren sub-box: 42/42 elements certified REJECT, one RECORD claim carrying an exhaustionCertificate, 0 HIT lines');
  }

  /* ---------------- ITEM 3: RED CONTROLS ---------------- */
  {
    let fired = 0;

    /* (a) sabotaged certify — caught by the certificate re-check */
    {
      const dir = freshDir();
      const r = await F.runFunnel(dir, baseOpts({ seed: 's3a', targetPath: TARGETS('sabotaged-certify.js') }));
      const ok = !!r.refused && r.refused.reason.includes('CERTIFIER-INTEGRITY')
        && r.refused.failures.some(f => f.control === 'CERTIFIER-INTEGRITY')
        && !fs.existsSync(path.join(dir, 'experiments', 'run-s3a.jsonl'));
      if (ok) fired++;
      redline('RED (a) sabotaged certify()', ok, 'refused to start: independent recompute rejected the forged certificate for knownBad; nothing written');
    }

    /* (b) gamed score — scaleInflate raises it, score battery refuses */
    {
      const dir = freshDir();
      const r = await F.runFunnel(dir, baseOpts({ seed: 's3b', targetPath: TARGETS('gamed-score.js') }));
      const ok = !!r.refused && r.refused.reason.includes('SCORE-BATTERY')
        && r.refused.failures.some(f => /scaleInflate raised the score/.test(f.why));
      if (ok) fired++;
      redline('RED (b) gamed score', ok, 'refused to start: SCORE-BATTERY caught scaleInflate raising the score');
    }

    /* (c) forged experiments line — chained hashes; resume refuses */
    {
      const dir = freshDir();
      await F.runFunnel(dir, baseOpts({ seed: 's3c', batchSize: 8, stopAfterBatches: 2 }));
      const runPath = path.join(dir, 'experiments', 'run-s3c.jsonl');
      const lines = fs.readFileSync(runPath, 'utf8').split('\n').filter(l => l);
      const forged = JSON.parse(lines[2]);
      forged.candidate = { v: [6, 6] };            /* edit a record after write */
      lines[2] = JSON.stringify(forged);
      fs.writeFileSync(runPath, lines.join('\n') + '\n');
      const vf = F.verifyChainFile(runPath, 's3c');
      const r = await F.runFunnel(dir, baseOpts({ seed: 's3c', batchSize: 8 }));
      const ok = !vf.ok && vf.badLine === 2 && !!r.refused && r.refused.reason === 'CHAIN-BROKEN';
      if (ok) fired++;
      redline('RED (c) forged experiments line', ok, 'chain hash mismatch detected at line 2; resume refused (CHAIN-BROKEN)');
    }

    /* (d) generator touching fs — the write-fence */
    {
      const dir = freshDir();
      const r = await F.runFunnel(dir, baseOpts({
        seed: 's3d',
        generatorPath: path.join(__dirname, 'generators', 'evil-fs.js')
      }));
      const noFile = !fs.existsSync(path.join(dir, 'evil-was-here.txt'))
        && !fs.existsSync(path.join(process.cwd(), 'evil-was-here.txt'));
      const ok = !!r.aborted && r.aborted.reason === 'FENCE-VIOLATION' && noFile;
      if (ok) fired++;
      redline('RED (d) fs-touching generator', ok, 'vm fence: require is not defined; run aborted FENCE-VIOLATION and no file was written');
    }

    /* (e) bare superlative — the summary writer's claim guard */
    {
      let threw = false;
      try { F.assertClaimless('largest hit found so far'); } catch (e) { threw = true; }
      let legal = false;
      try { legal = F.recordClaim('test box', null).text.includes('best known to this search'); } catch (e) { legal = false; }
      const ok = threw && legal;
      if (ok) fired++;
      redline('RED (e) bare superlative claim', ok, 'claim guard threw on free-text superlative; RECORD without a certificate carries the literal downgrade');
    }

    verdict('ITEM 3 RED CONTROLS', fired === 5, fired + '/5 red controls demonstrably fired');
  }

  /* ---------------- ITEM 4: KILL-AND-RESUME ---------------- */
  {
    const dirU = freshDir();
    const dirK = freshDir();
    const opts = { seed: 'kr1', batchSize: 8 };
    await F.runFunnel(dirU, baseOpts(opts));                                  /* uninterrupted */
    const killed = await F.runFunnel(dirK, baseOpts(Object.assign({ stopAfterBatches: 3 }, opts)));
    /* simulate a mid-write death on top of the kill: torn partial line */
    fs.appendFileSync(path.join(dirK, 'experiments', 'run-kr1.jsonl'), '{"kind":"candid');
    const resumed = await F.runFunnel(dirK, baseOpts(opts));                  /* resume */
    const runSame = readRun(dirU, 'kr1') === readRun(dirK, 'kr1');
    const bestSame = fs.readFileSync(path.join(dirU, 'best.json'), 'utf8')
      === fs.readFileSync(path.join(dirK, 'best.json'), 'utf8');
    const pass = killed.stopped === 'batches' && !resumed.refused && !resumed.aborted && runSame && bestSame;
    verdict('ITEM 4 KILL-AND-RESUME', pass,
      'killed after 3 batches (+ torn partial line), resumed: run-kr1.jsonl and best.json byte-identical to the uninterrupted run');
  }

  /* ---------------- ITEM 5: SCREEN CALIBRATION ---------------- */
  {
    /* 5a — miscalibrated screen (rejects half the planted hits) -> recall refuses */
    const dirA = freshDir();
    const rA = await F.runFunnel(dirA, baseOpts({ seed: 's5a', targetPath: TARGETS('miscalibrated-screen.js') }));
    const halfCaught = !!rA.refused && rA.refused.reason.includes('RECALL')
      && rA.refused.failures.filter(f => f.control === 'RECALL').length === 2;

    /* 5b — leaky screen (planted hits survive; undeclared true hits leak) ->
       reject audit at rate 1.0 measures a nonzero false-negative count */
    const dirB = freshDir();
    const rB = await F.runFunnel(dirB, baseOpts({ seed: 's5b', targetPath: TARGETS('leaky-screen.js'), rejectAuditRate: 1.0 }));
    const audit = rB.summary && rB.summary.rejectAudit;
    const leakMeasured = !!audit && audit.falseNegatives === 2 && audit.sampled === audit.population && audit.admittedViaAudit === 2;
    const auditHitsAdmitted = leakMeasured && JSON.parse(fs.readFileSync(path.join(dirB, 'best.json'), 'utf8'))
      .entries.filter(e => e.via === 'reject-audit').length === 2;

    const pass = halfCaught && leakMeasured && auditHitsAdmitted;
    verdict('ITEM 5 SCREEN CALIBRATION', pass,
      'miscalibrated screen refused at recall (2/4 planted rejected); leaky screen measured false-negative count 2 (nonzero) with all rejects audited, both leaked hits certified and admitted');
  }

  /* ---------------- ITEM 6: LLM MOCK ---------------- */
  {
    const dirA = freshDir();
    const dirB = freshDir();
    const opts = { seed: 's6', generator: 'llm', decades: [2], batchSize: 16 };
    const rA = await F.runFunnel(dirA, baseOpts(opts));
    const rB = await F.runFunnel(dirB, baseOpts(opts));

    const recs = readRun(dirA, 's6').split('\n').filter(l => l).map(l => JSON.parse(l));
    const cands = recs.filter(r => r.kind === 'candidate');
    const allMock = cands.length > 0 && cands.every(r => r.mock === true && /\[mock\]/.test(r.hypothesis));
    const allValid = rA.summary && rA.summary.counts.schemaInvalid === 0 && rA.summary.mock === true;
    const deterministic = readRun(dirA, 's6') === readRun(dirB, 's6')
      && readRun(dirA, 's6-baseline') === readRun(dirB, 's6-baseline')
      && fs.readFileSync(path.join(dirA, 'experiments', 'session-s6.json'), 'utf8')
        === fs.readFileSync(path.join(dirB, 'experiments', 'session-s6.json'), 'utf8');
    const noNetworkLog = !fs.existsSync(path.join(dirA, 'experiments', 'llm-log.jsonl'));
    const sess = rA.sessionSummary;
    const baselineRan = sess && sess.baseline && sess.baseline.generator === 'enum'
      && sess.baseline.generated === sess.main.generated && sess.main.generated === 100;

    const pass = !!allMock && !!allValid && deterministic && noNetworkLog && !!baselineRan;
    verdict('ITEM 6 LLM MOCK', pass,
      'no key => mock: 100/100 candidates schema-valid, every record labeled mock, byte-identical across two runs, no llm-log (no network); equal-budget enum baseline (100) in the session summary');
  }

  /* ---------------- ITEM 7: PROVENANCE + COUNTERS (M2/M3) ---------------- */
  {
    const S = require(path.join(__dirname, '..', 'stats.js'));
    const dir = freshDir();
    const memo = path.join(dir, 'instrument-log.jsonl');
    let fired = 0;

    /* green path: full provenance, definition at first use, tally re-derives */
    let greenOk = false;
    try {
      S.memoAppend(memo, { seed: 's7', runId: 'run-s7', generator: 'evolve', metric: 'certifiedHits', metricDefinition: 'test definition: certify() HIT count', value: 3 });
      S.memoAppend(memo, { seed: 's7', runId: 'run-s7', generator: 'evolve', metric: 'certifiedHits', value: 4 });
      const t = S.tally(memo, 'certifiedHits');
      greenOk = t.count === 2 && t.sum === 7 && t.definition.includes('test definition');
    } catch (e) { greenOk = false; }

    /* red (f): missing seed refused at write — the instrument-log defect, at the writer */
    {
      let ok = false;
      try { S.memoAppend(memo, { runId: 'run-s7', generator: 'evolve', metric: 'certifiedHits', value: 1 }); }
      catch (e) { ok = /MEMO-UNPROVENANCED/.test(e.message); }
      if (ok) fired++;
      redline('RED (f) memo without seed', ok, 'memoAppend refused the write (MEMO-UNPROVENANCED); nothing appended');
    }

    /* red (g): an unprovenanced line hand-appended past the writer — the reader refuses */
    {
      fs.appendFileSync(memo, JSON.stringify({ metric: 'certifiedHits', value: 99 }) + '\n');
      let ok = false;
      try { S.readMemo(memo); } catch (e) { ok = /MEMO-REFUSED/.test(e.message) && /line 3/.test(e.message); }
      const tol = S.readMemo(memo, { tolerate: true });
      ok = ok && tol.violations.length === 1 && tol.records.length === 2;
      if (ok) fired++;
      redline('RED (g) hand-appended memo line', ok, 'strict read refused naming line 3; tolerant read returned the violation by name and 2 provenanced records');
    }

    /* red (h): a new metric minted without a definition */
    {
      let ok = false;
      try { S.memoAppend(memo, { seed: 's7', runId: 'run-s7', generator: 'evolve', metric: 'admittedHits', value: 1 }); }
      catch (e) { ok = /MEMO-METRIC-UNDEFINED/.test(e.message); }
      if (ok) fired++;
      redline('RED (h) metric minted undefined', ok, 'first use of a metric without metricDefinition refused (MEMO-METRIC-UNDEFINED)');
    }

    /* session summary carries both counters + definitions; the checker refuses a dropped one */
    const dirS = freshDir();
    const rS = await F.runFunnel(dirS, baseOpts({ seed: 's7', generator: 'llm', decades: [2], batchSize: 16 }));
    const sess = JSON.parse(fs.readFileSync(path.join(dirS, 'experiments', 'session-s7.json'), 'utf8'));
    const checkOk = F.checkSessionSummary(sess).ok === true
      && typeof sess.main.certifiedHits === 'number' && typeof sess.main.admittedHits === 'number'
      && typeof sess.baseline.certifiedHits === 'number' && typeof sess.baseline.admittedHits === 'number'
      && sess.metrics.certifiedHits === F.METRIC_DEFS.certifiedHits;
    const runRecsS = readRun(dirS, 's7').split('\n').filter(l => l).map(l => JSON.parse(l));
    const hitCountS = runRecsS.filter(r => r.kind === 'candidate' && r.certVerdict && r.certVerdict.verdict === 'HIT').length;
    const boardS = JSON.parse(fs.readFileSync(path.join(dirS, 'best.json'), 'utf8')).entries.filter(e => e.runSeed === 's7').length;
    const countersDerive = sess.main.certifiedHits === hitCountS && sess.main.admittedHits === boardS;

    /* red (i): a summary with one counter dropped is refused by name */
    {
      const mut = JSON.parse(JSON.stringify(sess));
      delete mut.main.certifiedHits;
      const c1 = F.checkSessionSummary(mut);
      const mut2 = JSON.parse(JSON.stringify(sess));
      delete mut2.metrics;
      const c2 = F.checkSessionSummary(mut2);
      const ok = !c1.ok && /certifiedHits/.test(c1.why) && !c2.ok && /definitions/.test(c2.why);
      if (ok) fired++;
      redline('RED (i) counter dropped', ok, 'checkSessionSummary refused the mutated summary both ways (counter gone; definitions gone)');
    }

    const pass = greenOk && !rS.refused && !rS.aborted && checkOk && countersDerive && fired === 4;
    verdict('ITEM 7 PROVENANCE+COUNTERS', pass,
      'memo writer+reader enforce provenance and metric definitions (' + fired + '/4 red controls fired); session summary prints BOTH counters with definitions, and both re-derive from the run records (certified ' + hitCountS + ', new-to-board ' + boardS + ')');
  }

  /* ---------------- ITEM 8: LIVE PROMPT CHAIN (fake fetch — no network) ---------------- */
  {
    const dir = freshDir();
    const FAKE_KEY = 'selftest-key-000-never-real';
    const fakeFetch = async (url, init) => ({
      ok: true, status: 200,
      json: async () => ({
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', name: 'propose_candidate', input: { candidate: { v: [2, 18] }, hypothesis: 'stubbed live proposer: planted hit, every call' } }]
      })
    });
    const r = await F.runFunnel(dir, baseOpts({
      seed: 's8', generator: 'llm', decades: [2], batchSize: 16,
      env: { ANTHROPIC_API_KEY: FAKE_KEY }, fetch: fakeFetch
    }));
    const logPath = path.join(dir, 'experiments', 'llm-log.jsonl');
    const recs = readRun(dir, 's8').split('\n').filter(l => l).map(l => JSON.parse(l));
    const cands = recs.filter(x => x.kind === 'candidate');
    const allLive = cands.length === 100 && cands.every(x => x.mock === false);
    const allChained = cands.every(x => typeof x.promptSha === 'string' && /^[0-9a-f]{64}$/.test(x.promptSha));
    const logV = F.verifyLlmLog(logPath);
    const logEntries = fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l).map(l => JSON.parse(l));
    const logMatchesRecords = cands.length === logEntries.length
      && cands.every((c, i) => c.promptSha === logEntries[i].promptSha);
    const sess = JSON.parse(fs.readFileSync(path.join(dir, 'experiments', 'session-s8.json'), 'utf8'));
    const diverge = sess.main.certifiedHits === 100 && sess.main.admittedHits === 1;
    let keyAbsent = true;
    for (const f of ['experiments/run-s8.jsonl', 'experiments/llm-log.jsonl', 'experiments/session-s8.json', 'best.json']) {
      if (fs.readFileSync(path.join(dir, f), 'utf8').includes(FAKE_KEY)) keyAbsent = false;
    }

    /* red (j): tamper a logged request — the prompt chain catches it by line */
    let fired = 0;
    {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l);
      const e = JSON.parse(lines[4]);
      e.request.messages[0].content = 'REWRITTEN AFTER THE FACT';
      lines[4] = JSON.stringify(e);
      fs.writeFileSync(logPath + '.tampered', lines.join('\n') + '\n');
      const v = F.verifyLlmLog(logPath + '.tampered');
      const ok = !v.ok && v.badLine === 4 && /does not match/.test(v.why);
      if (ok) fired++;
      redline('RED (j) tampered prompt log', ok, 'verifyLlmLog caught the rewritten request at line 4 (promptSha mismatch)');
    }

    const pass = !r.refused && !r.aborted && allLive && allChained && logV.ok && logV.entries === 100
      && logMatchesRecords && diverge && keyAbsent && fired === 1;
    verdict('ITEM 8 LIVE PROMPT CHAIN', pass,
      'stubbed live llm: 100/100 candidate records chain a promptSha; llm-log verifies (' + (logV.entries || 0) + ' entries) and matches the records 1:1; counters diverge as defined (certified 100, new-to-board 1); key in no written file');
  }

  /* ---------------- ITEM 9: BOARD DISCIPLINE (Phase 3) ---------------- */
  {
    let fired = 0;

    /* unit level: admitHit against a stub target with canonicalKey + regionOf */
    const stub = {
      canonicalKey: c => 'v:' + c.v.slice().map(Number).sort((a, b) => a - b).join(','),
      regionOf: c => (c.v[0] < 10 ? 'lo' : 'hi'),
      recheckCertificate: () => true
    };
    const cert = k => ({ verdict: 'HIT', certificate: { k } });
    const board = { entries: [], mute: [], regionCap: 1 };

    const a1 = F.admitHit(board, stub, { v: [2, 18] }, 0.5, cert(1), 'disc', 1, 'main-loop');
    const okAdmit = a1.admitted === true && board.entries.length === 1 && board.entries[0].region === 'lo';

    /* red (k): the permutation-duplicate class dies at the canonical key */
    const a2 = F.admitHit(board, stub, { v: [18, 2] }, 0.5, cert(2), 'other', 2, 'main-loop');
    const dupDead = a2.admitted === false && a2.board === 'canonical-duplicate'
      && board.entries.length === 1 && board.mute.length === 0;
    if (dupDead) fired++;
    redline('RED (k) permutation duplicate', dupDead, 'same multiset under a different order refused as canonical-duplicate; board unchanged');

    /* a better instance improves IN PLACE: superseded version archived, discoverer kept */
    const a3 = F.admitHit(board, stub, { v: [18, 2] }, 0.9, cert(3), 'improver', 3, 'main-loop');
    const improved = a3.admitted === false && board.entries.length === 1
      && board.entries[0].score === 0.9 && board.entries[0].runSeed === 'disc'
      && board.entries[0].improvedBy.runSeed === 'improver'
      && board.mute.length === 1 && board.mute[0].reason === 'superseded-by-better-instance'
      && board.mute[0].entry.score === 0.5;

    /* red (l): the region floor refuses a weaker hit — and archives a displaced one */
    const a4 = F.admitHit(board, stub, { v: [3, 12] }, 0.4, cert(4), 'weak', 4, 'main-loop');
    const floorHolds = a4.admitted === false && a4.board === 'refused-region-floor' && board.entries.length === 1;
    const a5 = F.admitHit(board, stub, { v: [3, 12] }, 0.95, cert(5), 'strong', 5, 'main-loop');
    const displaced = a5.admitted === true && board.entries.length === 1
      && board.entries[0].score === 0.95
      && board.mute.length === 2 && board.mute[1].reason === 'region-floor-displaced'
      && board.mute[1].entry.key === 'v:2,18';
    const a6 = F.admitHit(board, stub, { v: [15, 3] }, 0.2, cert(6), 'hi-side', 6, 'main-loop');
    const regionsIndependent = a6.admitted === true && board.entries.length === 2;
    if (floorHolds && displaced) fired++;
    redline('RED (l) region floor', floorHolds && displaced, 'weaker hit refused at the full region; stronger hit displaced the champion INTO the mute archive (nothing deleted); other region unaffected');

    /* loop level: board floors refuse ties, and the record names what the board did */
    const dirF = freshDir();
    const rF = await F.runFunnel(dirF, baseOpts({ seed: 's9f', boardCap: 2 }));
    const recsF = readRun(dirF, 's9f').split('\n').filter(l => l).map(l => JSON.parse(l));
    const floorRecs = recsF.filter(x => x.kind === 'candidate' && x.board === 'refused-region-floor');
    const floorLoop = !rF.refused && rF.summary.counts.certified.HIT === 4 && rF.summary.admitted === 2
      && floorRecs.length === 2
      && floorRecs.every(x => x.certVerdict && x.certVerdict.verdict === 'HIT');

    /* loop level: bingo dry-halt stops a dry campaign with recall intact */
    const dirB = freshDir();
    const rB = await F.runFunnel(dirB, baseOpts({ seed: 's9b', decades: [2, 3], bingoDry: 100 }));
    const bingoStops = !rB.refused && /bingo \(dry\)/.test(rB.summary.governor.stopReason)
      && rB.summary.counts.generated < 441 && rB.summary.admitted === 4;

    /* red (m): bingo must NOT fire while the dry streak never reaches the bar */
    const dirC = freshDir();
    const rC = await F.runFunnel(dirC, baseOpts({ seed: 's9c', decades: [2, 3], bingoDry: 400 }));
    const bingoHolds = !rC.refused && rC.summary.counts.generated === 441
      && rC.summary.generatorExhausted === true && rC.summary.admitted === 4;
    if (bingoStops && bingoHolds) fired++;
    redline('RED (m) bingo both directions', bingoStops && bingoHolds, 'dry streak 100 halted early with all 4 hits already boarded; streak bar 400 never fired and the box completed');

    /* a non-enum RECORD names the schema box it roamed, not the enum grid */
    const dirS = freshDir();
    const rS = await F.runFunnel(dirS, baseOpts({ seed: 's9s', generator: 'llm', decades: [2], batchSize: 16 }));
    const recS = rS.summary.claims.filter(c => c.shape === 'RECORD')[0];
    const boxHonest = recS && recS.text.indexOf('candidateSchema box {v:array[2 of integer in [0,20]]}') >= 0
      && recS.text.indexOf('intGrid') < 0;

    const pass = okAdmit && dupDead && improved && floorHolds && displaced && regionsIndependent
      && floorLoop && bingoStops && bingoHolds && boxHonest && fired === 3;
    verdict('ITEM 9 BOARD DISCIPLINE', pass,
      'canonical dedup + in-place improvement (discoverer kept, superseded archived) + region floors (' + fired + '/3 red controls fired); loop: 4 certified HITs vs 2 boarded at cap 2 with the refusals named per record; bingo halted a dry run and held on a live one; non-enum RECORD names the roamed schema box');
  }

  /* ---------------- ITEM 10: CASCADE CONSERVATION (Phase 4) ---------------- */
  {
    const dir = freshDir();
    const r = await F.runFunnel(dir, baseOpts({ seed: 's10', targetPath: TARGETS('cascade.js'), rejectAuditRate: 1.0 }));
    const casc = r.summary && r.summary.cascade;
    const rows = casc ? casc.stages : [];
    const twoStages = rows.length === 2 && rows[0].stage === 'coarse' && rows[1].stage === 'tight';
    const conserved = twoStages
      && rows.every(x => x.in === x.rejected + x.passed)
      && rows[0].passed === rows[1].in
      && rows[1].passed === r.summary.counts.screenPassed
      && casc.preScreen.generated === 441 && casc.preScreen.schemaInvalid === 0;
    const bothPopulated = twoStages && rows[0].rejected > 0 && rows[1].rejected > 0;
    const byStage = r.summary && r.summary.rejectAudit.byStage;
    const auditPerStage = byStage
      && byStage.coarse && byStage.coarse.sampled === byStage.coarse.population
      && byStage.tight && byStage.tight.sampled === byStage.tight.population
      && byStage.coarse.falseNegatives === 0 && byStage.tight.falseNegatives === 0;
    const hitsIntact = r.summary && r.summary.admitted === 4;

    /* red (n): a cascade stage that eats a planted hit is refused BY NAME */
    let fired = 0;
    {
      const dirB = freshDir();
      const rB = await F.runFunnel(dirB, baseOpts({ seed: 's10b', targetPath: TARGETS('cascade-bad.js') }));
      const ok = !!rB.refused && rB.refused.reason.includes('RECALL')
        && rB.refused.failures.some(f => f.control === 'RECALL' && /cascade stage "tight"/.test(f.why))
        && !fs.existsSync(path.join(dirB, 'experiments', 'run-s10b.jsonl'));
      if (ok) fired++;
      redline('RED (n) cascade eats a hit', ok, 'recall refused the run and NAMED stage "tight" as the stage that rejected the planted hit; nothing written');
    }

    const pass = !r.refused && !r.aborted && conserved && bothPopulated && !!auditPerStage && hitsIntact && fired === 1;
    verdict('ITEM 10 CASCADE CONSERVATION', pass,
      'two-stage cascade over the full box: in = rejected + passed at every stage (checked at write AND re-derived here), both stages own nonzero reject populations, the audit reports per-stage false negatives (0/0 at full rate), all 4 hits admitted');
  }

  /* ---------------- ITEM 11: LLM STEERING (Phase 4 — best-shot pair + failure side-channel) ---------------- */
  {
    const dir = freshDir();
    const FAKE_KEY = 'selftest-key-000-never-real';
    /* the stub proposes: two distinct planted hits (board grows to 2), one certify-REJECT,
       then repeats a third hit — so later prompts must carry the pair AND the failure why */
    const script = [{ v: [2, 18] }, { v: [3, 12] }, { v: [5, 5] }, { v: [4, 9] }];
    const bodies = [];
    let call = 0;
    const fakeFetch = async (url, init) => {
      bodies.push(JSON.parse(init.body));
      const cand = script[Math.min(call, script.length - 1)]; call++;
      return {
        ok: true, status: 200,
        json: async () => ({
          stop_reason: 'tool_use',
          content: [{ type: 'tool_use', name: 'propose_candidate', input: { candidate: cand, hypothesis: 'scripted proposer step' } }]
        })
      };
    };
    const r = await F.runFunnel(dir, baseOpts({
      seed: 's11', generator: 'llm', decades: [2], batchSize: 8, maxCandidates: 6,
      env: { ANTHROPIC_API_KEY: FAKE_KEY }, fetch: fakeFetch
    }));
    const late = bodies[bodies.length - 1].messages[0].content;
    const pairShown = late.indexOf('Improvement pair, sorted worse to better') >= 0;
    /* v0 must be the worse score, v1 the better — parse both scores out of the pair block */
    const m0 = /v0 \(score ([0-9.]+)\)/.exec(late);
    const m1 = /v1 \(score ([0-9.]+)\)/.exec(late);
    const pairSorted = m0 && m1 && Number(m0[1]) <= Number(m1[1]);
    const whyShown = late.indexOf('certify: P fails') >= 0 && late.indexOf('why it died') >= 0;
    const earlyNoPair = bodies[0].messages[0].content.indexOf('Improvement pair') < 0;
    const pass = !r.refused && !r.aborted && pairShown && !!pairSorted && whyShown && earlyNoPair;
    verdict('ITEM 11 LLM STEERING', pass,
      'best-shot pair appears once the board holds 2 (absent before), v0/v1 sorted worse-to-better by score; the certify-REJECT reason from the failure side-channel is rendered in the later prompt');
  }

  /* ---------------- ITEM 12: SEARCHER — evolve the searcher, not the object (Phase 4) ---------------- */
  {
    /* unit: the interpreter's caps hold without a run around them */
    const SR = require(path.join(__dirname, '..', 'generators', 'searcher.js'));
    const field = { name: 'v', minLen: 2, maxLen: 2, lo: 0, hi: 20 };
    const capped = SR.interpret([['range', 0, 999999]], field);
    const coerced = SR.interpret([['append', 7, 0]], field);
    const noCrash = SR.interpret([['remove', 5, 0], ['set', 3, 9], ['add', -50, 0]], { name: 'v', minLen: 2, maxLen: 4, lo: 0, hi: 20 });
    const unitOk = capped.length === 2 && coerced.length === 2 && coerced[0] === 7 && coerced[1] === 0
      && Array.isArray(noCrash) && noCrash.every(x => x >= 0 && x <= 20);

    /* red (o): the unbounded builder is capped, not obeyed */
    const rawLen = SR.interpret([['range', 0, 999999]], { name: 'v', minLen: 1, maxLen: 100, lo: 0, hi: 1000000 });
    const capFired = rawLen.length === 64;
    let fired = 0;
    if (capFired) fired++;
    redline('RED (o) unbounded range op', capFired, 'range(0,999999) produced 64 elements, not a million — the step/size caps are load-bearing');

    /* loop: programs find hits, the program text IS the hypothesis, and two runs are byte-identical */
    const dirA = freshDir();
    const dirB = freshDir();
    const opts = { seed: 's1', generator: 'searcher', decades: [2, 3], batchSize: 32 };
    const rA = await F.runFunnel(dirA, baseOpts(opts));
    await F.runFunnel(dirB, baseOpts(opts));
    const recsA = readRun(dirA, 's1').split('\n').filter(l => l).map(l => JSON.parse(l));
    const hitRec = recsA.find(x => x.kind === 'candidate' && x.certVerdict && x.certVerdict.verdict === 'HIT');
    const legible = hitRec && /^\[searcher /.test(hitRec.hypothesis) && /(range\(|append\(|set\()/.test(hitRec.hypothesis);
    const found = rA.summary && rA.summary.admitted >= 1 && rA.summary.counts.certified.HIT >= 1;
    const deterministic = readRun(dirA, 's1') === readRun(dirB, 's1');
    const baselined = rA.sessionSummary && rA.sessionSummary.baseline && rA.sessionSummary.baseline.generator === 'enum';

    const pass = unitOk && capFired && !!found && !!legible && deterministic && !!baselined && fired === 1;
    verdict('ITEM 12 SEARCHER', pass,
      'DSL programs under hard caps: interpreter unit-safe; at seed s1 the evolved program found and re-emitted a certified hit (' + (rA.summary ? rA.summary.counts.certified.HIT : 0) + ' certified HITs, ' + (rA.summary ? rA.summary.admitted : 0) + ' new-to-board), its generating law legible in the hypothesis line; byte-identical across two runs; equal-budget enum baseline ran (seed-variance is real and documented — this seed is pinned)');
  }

  /* ---------------- ITEM 13: STATEMENT SPEC (Phase 5) ---------------- */
  {
    const S = require(TARGETS('synthetic.js'));
    const goodSpec = {
      name: 'synthetic-P',
      statement: 'no v=[a,b] with a,b in [0,20] has a*b=36 and a<=b beyond the four known: [2,18],[3,12],[4,9],[6,6]',
      candidateSchema: S.candidateSchema,
      enumSpec: S.enumSpec
    };

    const dir = freshDir();
    fs.writeFileSync(path.join(dir, 'statement.json'), JSON.stringify(goodSpec, null, 2) + '\n');
    const r = await F.runFunnel(dir, baseOpts({ seed: 's13' }));
    const header = JSON.parse(readRun(dir, 's13').split('\n')[0]);
    const shaOk = typeof header.statementSha === 'string' && header.statementSha.length === 64
      && header.statement === goodSpec.statement;
    const claimsPinned = r.summary && r.summary.claims.length > 0
      && r.summary.claims.every(c => c.statementSha === header.statementSha && c.text.indexOf('statement=sha256:' + header.statementSha) >= 0);

    /* red (p): a spec that disagrees with the target refuses the run, field named */
    let fired = 0;
    {
      const dirB = freshDir();
      const drifted = JSON.parse(JSON.stringify(goodSpec));
      drifted.candidateSchema.properties.v.items.maximum = 19;   /* the statement says 19, the target says 20 */
      fs.writeFileSync(path.join(dirB, 'statement.json'), JSON.stringify(drifted, null, 2) + '\n');
      const rB = await F.runFunnel(dirB, baseOpts({ seed: 's13b' }));
      const ok = !!rB.refused && rB.refused.reason === 'STATEMENT-MISMATCH'
        && rB.refused.failures.some(f => /candidateSchema/.test(f.why))
        && !fs.existsSync(path.join(dirB, 'experiments', 'run-s13b.jsonl'));
      if (ok) fired++;
      redline('RED (p) statement drift', ok, 'statement.json disagreeing with the target on candidateSchema refused (STATEMENT-MISMATCH, field named); nothing written');
    }

    const pass = !r.refused && !r.aborted && shaOk && !!claimsPinned && fired === 1;
    verdict('ITEM 13 STATEMENT SPEC', pass,
      'one pinned source: the run header carries the statement + its sha, every claim carries statement=sha256:<sha>; a drifted spec refuses the run before anything runs');
  }

  /* ---------------- ITEM 14: SHARDED COVER CERTIFICATE (Phase 5) ---------------- */
  {
    const dir = freshDir();
    const r = F.runExhaustSharded(dir, { targetPath: TARGETS('synthetic.js'), windows: 3 });
    const rec = r.record;
    const v = rec && F.verifyShardedExhaust(rec);
    const built = rec && rec.windows.length === 3 && rec.totalChecked === 42
      && rec.claims.length === 1 && rec.claims[0].shape === 'RECORD'
      && rec.claims[0].exhaustionCertificate.kind === 'sharded-exhaustion-conjunction'
      && rec.claims[0].exhaustionCertificate.windowCertShas.length === 3;
    const checkerOk = v && v.ok === true && v.windows === 3 && v.totalChecked === 42;

    /* kill between windows, resume: final record byte-identical to uninterrupted */
    const dirK = freshDir();
    const part = F.runExhaustSharded(dirK, { targetPath: TARGETS('synthetic.js'), windows: 3, stopAfterWindows: 1 });
    const resumed = F.runExhaustSharded(dirK, { targetPath: TARGETS('synthetic.js'), windows: 3 });
    const killResume = part.stopped === 'windows'
      && JSON.stringify(resumed.record) === JSON.stringify(rec);

    let fired = 0;
    /* red (q): a tampered window certificate is caught BY WINDOW by the tiny checker */
    {
      const bad = JSON.parse(JSON.stringify(rec));
      bad.windows[1].certificate.cardinality = 999;
      const vb = F.verifyShardedExhaust(bad);
      const ok = !vb.ok && vb.badWindow === 1 && /does not match its pinned sha/.test(vb.why);
      if (ok) fired++;
      redline('RED (q) tampered window cert', ok, 'verifyShardedExhaust caught the rewritten certificate at window 1 (sha mismatch)');
    }
    /* red (r): a gap and an overlap in the tiling are each refused by name */
    {
      const gap = JSON.parse(JSON.stringify(rec));
      gap.windows[1].dim0[0] += 1;
      const vg = F.verifyShardedExhaust(gap);
      const overlap = JSON.parse(JSON.stringify(rec));
      overlap.windows[1].dim0[0] -= 1;
      const vo = F.verifyShardedExhaust(overlap);
      const ok = !vg.ok && /gap/.test(vg.why) && !vo.ok && /overlap/.test(vo.why);
      if (ok) fired++;
      redline('RED (r) broken tiling', ok, 'a one-integer gap and a one-integer overlap between windows each refused, named as such');
    }
    /* red (s): a shard containing a hit refuses the WHOLE record by window id.
       Box [0,20]x[0,18] contains the planted hit [2,18], which lands in window 0. */
    {
      const hotPath = path.join(tmpRoot, 'hot-target.js');
      fs.writeFileSync(hotPath,
        "'use strict';\nconst T = require(" + JSON.stringify(TARGETS('synthetic.js')) + ");\n"
        + "module.exports = Object.assign({}, T, { emptyBox: { box: { name: 'NOT empty: v[1] up to 18', ranges: [[0,20],[0,18]] }, exhaust: T.emptyBox.exhaust } });\n");
      const dirH = freshDir();
      const rH = F.runExhaustSharded(dirH, { targetPath: hotPath, windows: 3 });
      const ok = !!rH.refused && rH.refused.reason === 'SHARD-INCOMPLETE'
        && rH.refused.failures.some(f => /window 0/.test(f.why) && /never a silent gap/.test(f.why))
        && !fs.existsSync(path.join(dirH, 'experiments', 'exhaust-sharded.json'));
      if (ok) fired++;
      redline('RED (s) hot shard', ok, 'a window whose sub-box contains a certified hit refused the WHOLE record, window 0 named; no record written');
    }

    const pass = !!built && !!checkerOk && killResume && fired === 3;
    verdict('ITEM 14 SHARDED COVER CERT', pass,
      'empty box exhausted in 3 windows: per-window certificates + one cover-tiling certificate, RECORD = their mechanical conjunction (42/42 checked, conservation exact); kill-after-1-window resume byte-identical; the tiny checker refuses tampering, gaps, overlaps by name');
  }

  /* ---------------- verdicts ---------------- */
  for (const line of out) console.log(line);
  console.log(failures === 0 ? 'BATTERY GREEN — all fourteen items pass, every red control fired' : 'BATTERY RED — ' + failures + ' failure(s)');
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('BATTERY CRASHED:', e);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  process.exit(1);
});
