/* ledger.js — the proposal ledger: append-only, commit before certify.

   One row per proposal. The row is OPENED before the certifier runs and
   CLOSED after, so a crash in the middle leaves an honest half-row rather
   than a gap — the same discipline the forecast ledger uses for
   commit-before-score, and for the same reason: a record that can lose its
   losses is not a record.

   Nothing here decides anything. It counts, and it refuses to lose rows.

   MIT. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT = path.join(__dirname, '..', '..', 'certs', 'wip-generation-ledger.jsonl');

const sha = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16);

function open(file) {
  const f = file || DEFAULT;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  return {
    file: f,
    append(row) { fs.appendFileSync(f, JSON.stringify(row) + '\n'); return row; },
    rows() {
      if (!fs.existsSync(f)) return [];
      return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    }
  };
}

/** a proposal, recorded BEFORE the certifier is allowed to see it */
function propose(L, { run, proposer, target, obj, claim, rationale, seed }) {
  return L.append({
    type: 'propose', run, proposer, target,
    key: sha(obj), obj, claim, rationale, seed,
    at: Date.now()
  });
}

/** the verdict, recorded after. `width` is the graduated signal (SPEC §3). */
function decide(L, { run, proposer, key, verdict, width, rank, mechanism, costUsd }) {
  return L.append({
    type: 'decide', run, proposer, key,
    verdict, width, rank, mechanism, costUsd: costUsd || 0,
    at: Date.now()
  });
}

/** per-proposer record: proposals that reached a verdict, and how many HIT */
function board(L) {
  const rows = L.rows();
  const claims = new Map();
  for (const r of rows) if (r.type === 'propose') claims.set(r.key, r);
  const acc = new Map();
  for (const r of rows) {
    if (r.type !== 'decide') continue;
    const a = acc.get(r.proposer) || { proposer: r.proposer, scored: 0, hits: 0, costUsd: 0, claim: null, best: null };
    a.scored++;
    if (r.verdict === 'HIT') a.hits++;
    a.costUsd += r.costUsd || 0;
    const c = claims.get(r.key);
    if (c && !a.claim) a.claim = c.claim;
    if (r.verdict === 'HIT' && r.rank !== undefined && (a.best === null || r.rank < a.best)) a.best = r.rank;
    acc.set(r.proposer, a);
  }
  return [...acc.values()];
}

module.exports = { open, propose, decide, board, sha, DEFAULT };
