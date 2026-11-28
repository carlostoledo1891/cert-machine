/* stats3.js: the second computation of Stage 3's exact paired tests (notes/qwen-self-rewriting-stage3-preregistration-
   2026-11-26.md), sharing no code with tools/qwen-stage3-record.py, which computes the same p-values as binomial tails.
   Here the sign-flip permutation test of the paper (App. D.3: per problem d_i = the edited model's share of right answers
   minus the base's; flip the sign of each d_i; p = the share of the 2^m sign vectors whose sum is at least the observed)
   is enumerated EXACTLY by counting sign vectors per sum on BigInt, for integer d_i (one answer per problem).
   input (stdin): {"name": [[d_1, ..., d_m]], ...}  output: {"name": {"m", "sum", "greater_or_equal": [num, den],
   "less_or_equal": [num, den]}} with num/den as decimal strings of the exact rational.  usage: node stats3.js < in.json
   MIT */
'use strict';
function tails(d) {
  let ways = new Map([[0, 1n]]);              // sum -> number of sign vectors reaching it
  for (const x of d) {
    if (!Number.isInteger(x)) throw new Error('a non-integer difference');
    if (x === 0) { ways = new Map([...ways].map(([s, c]) => [s, c * 2n])); continue; }
    const next = new Map();
    for (const [s, c] of ways) {
      next.set(s + x, (next.get(s + x) || 0n) + c);
      next.set(s - x, (next.get(s - x) || 0n) + c);
    }
    ways = next;
  }
  const obs = d.reduce((a, b) => a + b, 0);
  let ge = 0n, le = 0n, all = 0n;
  for (const [s, c] of ways) { all += c; if (s >= obs) ge += c; if (s <= obs) le += c; }
  if (all !== 2n ** BigInt(d.length)) throw new Error('the count of sign vectors is wrong');
  const red = (n, q) => { let a = n, b = q; while (b) [a, b] = [b, a % b]; return [String(n / a), String(q / a)]; };
  return { m: d.length, sum: obs, greater_or_equal: red(ge, all), less_or_equal: red(le, all) };
}
if (require.main === module) {
  const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  const out = {};
  for (const k of Object.keys(input)) out[k] = tails(input[k]);
  process.stdout.write(JSON.stringify(out) + '\n');
}
module.exports = { tails };
