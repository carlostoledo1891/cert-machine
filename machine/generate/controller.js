/* controller.js — the generation loop (SPEC-GENERATION.md §5).

   A proposer proposes; the instrument decides; a proposer that stops earning
   its place stops being called. Nothing here does mathematics: it picks a
   proposer, records the proposal before the certifier sees it, hands the
   object to the authority, records the verdict, and updates admission.

   THE FITNESS IS NOT A SCORE. For this target the graduated signal is the
   exact count of violated tensor equations, so a candidate that misses by 3
   equations ranks above one that misses by 500 — an integer, computed by an
   instrument the proposer never touches, from an object the proposer cannot
   forge. That is the whole design, and it is why the reward hacks documented
   against scalar-score evolutionary systems have nothing to attack here.

   THE TARGET IS A PARAMETER. Nothing in this loop knows what tensor is being
   attacked; it parses a name, hands the target to the proposer, and hands the
   result to whichever instrument is the authority for that family. Matrix
   multiplication keeps instruments/strassen — the authority that put the
   existing <3,3,3> record on the books, unchanged so that record still means
   what it meant. Everything else is decided by instruments/bilinear.

   usage: node machine/generate/controller.js [--target T8] [--rounds 6]
                                              [--steps 120000] [--ledger PATH]
     --target 3,3,3  matrix multiplication <n,m,p>
     --target P8     full product of two degree-7 polynomials
     --target T8     truncated (short) product, the low 8 coefficients
     --target C10    cyclic product modulo X^10 - 1  (= negacyclic, over F2) */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const F = require('./f2scheme.js');
const G = require('./targets.js');
const L = require('./ledger.js');
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));
const BL = require(path.join(ROOT, 'instruments', 'bilinear', 'tensor.js'));
const { admit } = require(path.join(ROOT, 'instruments', 'forecast', 'admission.js'));

const PROPOSERS = { flip: require('./proposers/flip.js') };

/* ---- the certifier ------------------------------------------------------
   The controller adds nothing to the verdict; it only records the width
   beside it. Which instrument is the authority depends on the family, and
   the choice is made HERE and stated, not buried in a default:

     matmul <n,m,p>   instruments/strassen  — unchanged, so the <3,3,3>
                      record on the books still means exactly what it meant
     everything else  instruments/bilinear  — exact over F2 for any target,
                      and it rebuilds the tensor from the target's NAME
                      rather than trusting the object handed to it */
function certify(obj) {
  const { scheme, target } = obj;
  const res = F.residual(scheme, target);          /* the exact width */
  if (res.violations > 0) {
    return { verdict: 'REJECT', width: res.violations, rank: scheme.length,
      mechanism: 'equation (a=' + res.first.a + ',b=' + res.first.b + ',c=' + res.first.c
        + ') is ' + res.first.got + ', the tensor requires ' + res.first.want };
  }
  const claim = F.toClaim(scheme, target, 'generated');
  const a = G.isMatmul(target) ? T.audit(claim) : BL.audit(claim);
  if (a.verdict !== 'VERIFIED') {
    return { verdict: 'REFUSED', width: res.violations, rank: scheme.length,
      mechanism: 'the residual is zero but the instrument says ' + a.verdict + ': ' + (a.why || '') };
  }
  return { verdict: 'HIT', width: 0, rank: scheme.length,
    mechanism: 'VERIFIED over ' + a.ring + (a.layout ? ', layout ' + a.layout : '')
      + ', ' + a.equations + ' equations' };
}

/* ---- the loop ------------------------------------------------------------ */
async function run(opts) {
  const target = opts.target || G.parse(opts.spec || '3,3,3');
  const rounds = opts.rounds || 6;
  const ledger = L.open(opts.ledger);
  const runId = 'gen-' + target.name.replace(/[<>,]/g, '') + '-' + Date.now();
  const bar = [1, 20];

  /* the rank to beat, and the honest default: the definition itself. A run
     that is not told an incumbent is racing the naive algorithm, not a
     published record — and says so. */
  const incumbent = opts.incumbent === undefined ? F.naive(target).length : opts.incumbent;
  let best = null, bestRank = Infinity;
  let lastRoundImproved = false, seedCounter = 0;
  const log = [];

  for (let round = 0; round < rounds; round++) {
    /* 1. pick a proposer — admitted only */
    const board = L.board(ledger);
    const admitted = Object.keys(PROPOSERS).filter(name => {
      const b = board.find(x => x.proposer.split('@')[0] === name);
      if (!b || !b.claim || b.scored === 0) return true;      /* no record yet: admitted */
      return admit({ claim: b.claim, scored: b.scored, covered: b.hits, bar }).status !== 'DEADMITTED';
    });
    if (!admitted.length) { log.push('every proposer is DEADMITTED — stopping'); break; }
    const name = admitted[round % admitted.length];

    /* 2. context: what to beat, what already certified, what was refuted */
    const ctx = {
      family: G.isMatmul(target) ? 'strassen-audit' : 'bilinear',
      statement: target.statement + ', r < ' + incumbent,
      target: { kind: 'minimise', quantity: 'rank', incumbent, tensor: target },
      /* ADAPTIVE RESTART, not greed and not a fixed alternation. Continuing
         from the best scheme every round collapses the walk into one basin
         (measured: it settles at 24 while a fresh walk reaches 23), and a
         fixed odd/even alternation just tied freshness to the seed parity so
         half the seeds were never tried. So: continue from the best while the
         walk is still paying, and start clean with a fresh seed the moment a
         round returns nothing. */
      best: (best && lastRoundImproved) ? [{ scheme: best, rank: bestRank }] : [],
      refuted: log.slice(-3),
      budget: { steps: opts.steps || 120000 },
      seed: ++seedCounter
    };

    /* 3. propose */
    const proposals = await PROPOSERS[name].propose(ctx);

    /* 4. record BEFORE certifying, then certify */
    for (const pr of proposals) {
      const row = L.propose(ledger, {
        run: runId, proposer: pr.proposer, target: 'rank ' + target.name + ' F2',
        obj: { rank: pr.obj.scheme.length, key: F.key(pr.obj.scheme) },
        claim: pr.claim, rationale: pr.rationale, seed: ctx.seed
      });
      const d = certify(pr.obj);
      L.decide(ledger, { run: runId, proposer: pr.proposer, key: row.key,
        verdict: d.verdict, width: d.width, rank: d.rank, mechanism: d.mechanism, costUsd: 0 });

      if (d.verdict === 'HIT' && d.rank < bestRank) { bestRank = d.rank; best = pr.obj.scheme; }
      if (d.verdict !== 'HIT') log.push(d.mechanism);
    }
    lastRoundImproved = proposals.length > 0;
    log.push('round ' + round + ' · ' + name + ' · seed ' + ctx.seed + ' · ' + proposals.length
      + ' proposals · best rank ' + (bestRank === Infinity ? '—' : bestRank)
      + (lastRoundImproved ? '' : ' · restarting fresh'));
  }

  return { runId, target, incumbent, bestRank, best, board: L.board(ledger), log, ledgerFile: ledger.file };
}

if (require.main === module) {
  const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
  const incArg = arg('incumbent');
  run({ spec: arg('target', '3,3,3'), rounds: Number(arg('rounds', 6)),
    steps: Number(arg('steps', 120000)), ledger: arg('ledger'),
    incumbent: incArg === undefined ? undefined : Number(incArg) })
    .then(r => {
      console.log('run ' + r.runId + '  —  ' + r.target.statement);
      for (const l of r.log) console.log('  ' + l);
      console.log('\n  incumbent rank ' + r.incumbent + ' -> best certified rank ' + r.bestRank);
      console.log('  board:');
      for (const b of r.board) {
        const a = b.claim ? admit({ claim: b.claim, scored: b.scored, covered: b.hits, bar: [1, 20] }) : null;
        console.log('    ' + b.proposer.padEnd(12) + b.hits + '/' + b.scored + ' certified'
          + '  best rank ' + (b.best === null ? '—' : b.best)
          + '  $' + b.costUsd.toFixed(4) + '  ' + (a ? a.status : 'no record'));
      }
      console.log('  ledger: ' + r.ledgerFile);
    })
    .catch(e => { console.error('GENERATION REFUSED: ' + e.message); process.exit(1); });
}

module.exports = { run, certify };
