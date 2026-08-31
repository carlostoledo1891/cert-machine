#!/usr/bin/env node
/* run-bilinear-front.js — point the generation front at polynomial products.

   The front was built against matrix multiplication and generalised to any
   bilinear target (machine/generate/targets.js). This tool is the campaign
   runner for the polynomial families: it walks, it CERTIFIES every scheme it
   keeps with instruments/bilinear, and it writes only what certified.

   WHAT A RESULT MEANS HERE. Every row is compared against the published
   literature in corpus/bilinear-bounds.json, and the comparison is the whole
   point, so it is computed rather than asserted:

     BEAT      rank strictly below the best published upper bound — a new
               upper bound on a quantity someone published a number for
     MATCH     rank equal to it — the free walk reproduced a hand
               construction, or in the tight cases the exact rank
     above     rank above it — the search did not get there, and the row
               says so rather than being dropped
     REFUTES   rank strictly below a published LOWER bound — this would mean
               a published theorem is false. It is far likelier that this
               tool is wrong, so it prints a warning and refuses to treat it
               as a find: a scheme that certifies below a proved lower bound
               is a bug report against this repository until an independent
               check says otherwise.

   usage: node tools/run-bilinear-front.js --targets T8,C8 [--seeds 20]
                                           [--steps 1500000] [--slack 3] */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const F = require(path.join(ROOT, 'machine', 'generate', 'f2scheme.js'));
const G = require(path.join(ROOT, 'machine', 'generate', 'targets.js'));
const WALK = require(path.join(ROOT, 'machine', 'generate', 'proposers', 'flip.js'));
const B = require(path.join(ROOT, 'instruments', 'bilinear', 'tensor.js'));

const CERT = path.join(ROOT, 'certs', 'bilinear-certificate.json');
const BOUNDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'bilinear-bounds.json'), 'utf8'));

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

/** how a certified rank stands against what is published for that target */
function standing(spec, rank) {
  const row = BOUNDS.rows.find(r => r.target === spec);
  if (!row) return { verdict: 'unpublished', row: null };
  if (rank < row.lower) return { verdict: 'REFUTES', row };
  if (rank < row.upper) return { verdict: 'BEAT', row };
  if (rank === row.upper) return { verdict: 'MATCH', row };
  return { verdict: 'above', row };
}

function load() {
  if (!fs.existsSync(CERT)) {
    return {
      what: 'Certified bilinear algorithms for polynomial multiplication over F2, found by the generation '
        + 'front and decided by instruments/bilinear. Every entry is a witness: the scheme is stored in full, '
        + 'so any reader can re-decide it. Published bounds it is measured against live in '
        + 'corpus/bilinear-bounds.json and are not results of this repository.',
      instrument: 'instruments/bilinear/tensor.js',
      ring: 'F2',
      schemeFormat: 'each term is [u, v, w], three bitmasks over the a-, b- and c-coordinates; bit i of u is '
        + 'the coefficient of input a_i, and so on. rank is the number of terms.',
      entries: []
    };
  }
  return JSON.parse(fs.readFileSync(CERT, 'utf8'));
}

/** record one certified entry, keeping the better rank if a row already exists */
function commit(entry) {
  const doc = load();
  const prev = doc.entries.find(e => e.target === entry.target);
  if (prev && prev.rank <= entry.rank) return false;
  if (prev) doc.entries[doc.entries.indexOf(prev)] = entry; else doc.entries.push(entry);
  doc.entries.sort((x, y) => x.target.localeCompare(y.target, 'en', { numeric: true }));
  doc.generated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(CERT, JSON.stringify(doc, null, 2) + '\n');
  return true;
}

function main() {
  const specs = String(arg('targets', 'T8')).split(',').map(s => s.trim()).filter(Boolean);
  const seeds = Number(arg('seeds', 20));
  const steps = Number(arg('steps', 1500000));
  const slack = Number(arg('slack', 3));

  let wrote = 0, warned = 0;

  for (const spec of specs) {
    const target = G.parse(spec);
    const naive = F.naive(target).length;
    const t0 = Date.now();

    /* TWO VARIABLES, DELIBERATELY. `best` is the record and is never cleared;
       `startFrom` is only the seed for the next walk, and the adaptive restart
       clears THAT. Holding one variable for both is a bug that hides itself:
       the run still prints the right rank, but the scheme handed to the
       certifier is whatever survived the last restart — which can be nothing,
       and then the naive algorithm gets certified and reported as the find. */
    let best = null, bestRank = Infinity, startFrom = null, pluses = 0;
    for (let seed = 1; seed <= seeds; seed++) {
      const r = WALK.walk({ target, seed, steps, start: startFrom, slack });
      pluses += r.pluses || 0;
      /* adaptive restart, the same rule the controller uses: continue from the
         best while the walk is still paying, start clean the moment it is not */
      if (r.bestRank < bestRank) { bestRank = r.bestRank; best = r.best; startFrom = r.best; }
      else startFrom = null;
    }
    if (!best) { console.error('REFUSED ' + spec + ': the walk returned no scheme'); process.exitCode = 1; continue; }
    const secs = (Date.now() - t0) / 1000;

    /* THE AUTHORITY. Nothing is written that this does not verify. */
    const claim = F.toClaim(best, target, 'gen-' + spec);
    const a = B.audit(claim);
    if (a.verdict !== 'VERIFIED') {
      console.error('REFUSED ' + spec + ': the best scheme did not certify — ' + a.verdict + ': ' + a.why);
      process.exitCode = 1;
      continue;
    }
    if (a.rank !== bestRank) {
      console.error('REFUSED ' + spec + ': the instrument counted rank ' + a.rank + ', the walk claimed ' + bestRank);
      process.exitCode = 1;
      continue;
    }

    const st = standing(spec, bestRank);
    if (st.verdict === 'REFUTES') {
      console.error('WARNING ' + spec + ': rank ' + bestRank + ' certifies BELOW the published lower bound '
        + st.row.lower + '. That is a bug report against this repository until checked independently — '
        + 'it is NOT being recorded as a find.');
      warned++;
    }

    const entry = {
      target: spec,
      statement: target.statement,
      rank: bestRank,
      naive,
      equations: a.equations,
      standing: st.verdict,
      publishedUpper: st.row ? st.row.upper : null,
      publishedLower: st.row ? st.row.lower : null,
      search: { proposer: 'flip@v1', seeds, steps, slack, pluses, seconds: Number(secs.toFixed(1)), costUsd: 0 },
      scheme: best.map(t => t.slice())
    };
    /* MERGE AGAINST DISK, ONE TARGET AT A TIME. Two campaigns on different
       families are the normal way to run this, and a tool that loads the file
       once and writes it back at the end silently deletes whatever the other
       one recorded meanwhile. So the record is re-read at every write and only
       this target's row is touched — and a run that dies halfway has still
       kept everything it certified. */
    const better = commit(entry);
    if (better) wrote++;
    const prev = better ? null : load().entries.find(e => e.target === spec);

    console.log(spec.padEnd(4)
      + ' naive ' + String(naive).padStart(3)
      + ' -> rank ' + String(bestRank).padStart(3)
      + '  ' + a.verdict.padEnd(9)
      + '  published ' + (st.row ? st.row.lower + '..' + st.row.upper : '  —  ').padEnd(7)
      + '  ' + st.verdict.padEnd(11)
      + '  ' + secs.toFixed(0) + 's'
      + (better ? '' : '  (kept the existing rank ' + prev.rank + ')'));
  }

  const doc2 = load();
  console.log('\ncerts/bilinear-certificate.json: ' + doc2.entries.length + ' certified entries, '
    + wrote + ' new or improved this run' + (warned ? ', ' + warned + ' WARNING' : ''));
}

main();
