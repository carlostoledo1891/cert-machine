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

   usage: node machine/generate/controller.js [--target 3,3,3] [--rounds 6]
                                              [--steps 120000] [--ledger PATH] */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const F = require('./f2scheme.js');
const L = require('./ledger.js');
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));
const { admit } = require(path.join(ROOT, 'instruments', 'forecast', 'admission.js'));

const PROPOSERS = { flip: require('./proposers/flip.js') };

/* ---- the certifier ------------------------------------------------------
   The authority is instruments/strassen. The controller adds nothing to the
   verdict; it only records the width beside it. */
function certify(obj) {
  const { scheme, n, m, p } = obj;
  const res = F.residual(scheme, n, m, p);          /* the exact width */
  if (res.violations > 0) {
    return { verdict: 'REJECT', width: res.violations, rank: scheme.length,
      mechanism: 'equation (a=' + res.first.a + ',b=' + res.first.b + ',c=' + res.first.c
        + ') is ' + res.first.got + ', the tensor requires ' + res.first.want };
  }
  const a = T.audit(F.toClaim(scheme, n, m, p, 'generated'));
  if (a.verdict !== 'VERIFIED') {
    return { verdict: 'REFUSED', width: res.violations, rank: scheme.length,
      mechanism: 'the residual is zero but the instrument says ' + a.verdict + ': ' + (a.why || '') };
  }
  return { verdict: 'HIT', width: 0, rank: scheme.length,
    mechanism: 'VERIFIED over ' + a.ring + ', layout ' + a.layout + ', ' + a.equations + ' equations' };
}

/* ---- the loop ------------------------------------------------------------ */
async function run(opts) {
  const dims = opts.dims || [3, 3, 3];
  const [n, m, p] = dims;
  const rounds = opts.rounds || 6;
  const ledger = L.open(opts.ledger);
  const runId = 'gen-' + dims.join('x') + '-' + Date.now();
  const bar = [1, 20];

  const incumbent = opts.incumbent === undefined ? n * m * p : opts.incumbent;
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
      family: 'strassen-audit',
      statement: 'a rank-r decomposition of the <' + dims + '> matmul tensor over F2, r < ' + (n * m * p),
      target: { kind: 'minimise', quantity: 'rank', incumbent, dims: { n, m, p } },
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
        run: runId, proposer: pr.proposer, target: 'rank<' + dims + '>F2',
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

  return { runId, dims, incumbent, bestRank, best, board: L.board(ledger), log, ledgerFile: ledger.file };
}

if (require.main === module) {
  const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
  const dims = String(arg('target', '3,3,3')).split(',').map(Number);
  run({ dims, rounds: Number(arg('rounds', 6)), steps: Number(arg('steps', 120000)), ledger: arg('ledger') })
    .then(r => {
      console.log('run ' + r.runId);
      for (const l of r.log) console.log('  ' + l);
      console.log('\n  incumbent (naive) rank ' + r.incumbent + ' -> best certified rank ' + r.bestRank);
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
