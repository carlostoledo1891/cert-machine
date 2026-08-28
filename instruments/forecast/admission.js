/* admission.js — the prune rule for forecast proposers, decided exactly.
   instruments/forecast · cert-machine

   Doctrine (CLAUDE.md): a forecaster that misses its certified coverage
   stops being ADMITTED until recalibrated — prune-only. This module makes
   that rule a computation instead of a judgment.

   The mechanism: a proposer claims coverage p = pN/pD with each commit.
   After m of its forecasts are scored and k were covered, compute the
   EXACT binomial tail

       tail = P[ X <= k ],   X ~ Binomial(m, p)
            = sum_{i=0..k} C(m,i) p^i (1-p)^(m-i)

   in exact rationals (BigInt — no float ever participates). The verdict:

       DEADMITTED  when tail <= bar (default 1/20)
       ADMITTED    otherwise

   read as: "IF the claimed coverage were true, a record this bad or
   worse has probability <= tail — computed exactly." The bar is a stated
   convention, printed into every verdict; the tail itself is the
   certificate. Only under-coverage prunes: covering MORE than claimed is
   the conservative direction, and the Winkler score already prices
   over-wide intervals, so hedging is not a way to win — it is only a way
   not to be pruned.

   With m = 0 the tail is 1 and every proposer starts ADMITTED: admission
   is lost by record, never by opinion. MIT. Part of cert-machine.          */
'use strict';

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
const norm = ([n, d]) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const ratStr = ([n, d]) => d === 1n ? String(n) : String(n) + '/' + String(d);

/* C(m, i) as BigInt, exact */
function choose(m, i) {
  if (i < 0 || i > m) return 0n;
  let num = 1n, den = 1n;
  for (let j = 0; j < i; j++) { num *= BigInt(m - j); den *= BigInt(j + 1); }
  return num / den;                                   /* always exact: den | num */
}

/* P[X <= k], X ~ Binomial(m, pN/pD), as a normalized exact rational */
function binomialTail(k, m, pN, pD) {
  const P = BigInt(pN), D = BigInt(pD), Q = D - P;
  if (!(P >= 0n && P <= D && D > 0n)) throw new Error('REFUSED: claimed coverage must satisfy 0 <= pN/pD <= 1');
  let num = 0n;
  for (let i = 0; i <= Math.min(k, m); i++) {
    num += choose(m, i) * P ** BigInt(i) * Q ** BigInt(m - i);
  }
  return norm([num, D ** BigInt(m)]);
}

/* admit({claim: [pN,pD], scored, covered, bar: [1,20]}) -> verdict */
function admit({ claim, scored, covered, bar }) {
  const [pN, pD] = claim;
  const [bN, bD] = bar || [1, 20];
  if (covered > scored) throw new Error('REFUSED: covered exceeds scored');
  const tail = binomialTail(covered, scored, pN, pD);
  /* tail <= bar  <=>  tail[0]*bD <= tail[1]*bN */
  const pruned = tail[0] * BigInt(bD) <= tail[1] * BigInt(bN);
  return {
    status: pruned ? 'DEADMITTED' : 'ADMITTED',
    tailStr: ratStr(tail), bar: [bN, bD],
    text: pruned
      ? 'DEADMITTED: if the claimed coverage ' + pN + '/' + pD + ' were true, a record of ' + covered + '/'
        + scored + ' covered or worse has probability ' + ratStr(tail) + ' <= ' + bN + '/' + bD
        + ' (the stated bar), computed exactly. Admission returns only by recalibrating and rebuilding a record.'
      : 'ADMITTED: ' + covered + '/' + scored + ' covered under claimed coverage ' + pN + '/' + pD
        + ' — exact tail ' + ratStr(tail) + ' > bar ' + bN + '/' + bD + '.'
  };
}

module.exports = { admit, binomialTail, choose };
