/* s488.c — P5 of PREREG-488.md: search for a SMALL explicit counterexample to Erdős #488 (a PROPOSER, not a decider:
   any hit is re-decided by the two P4 deciders and then by Lean).

   A = the P-smooth numbers in (T, c·T], P a set of primes; f(x) = #{1 ≤ j ≤ x : some a ∈ A divides j}, by an exact sieve
   up to M. A counterexample is n ≥ max A, m > n with 2·m·f(n) < n·f(m) (the statement's inequality, cleared of
   denominators). For each configuration: the best ratio R = max over n ≥ max A of (max_{m > n, m ≤ M} f(m)/m) / (f(n)/n),
   compared exactly by cross-multiplication in 128-bit integers.

   usage: s488 M c T p1 p2 ... (primes in P)   — prints one line: R, the best n and m, f(n), f(m), |A|, max A   */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int smooth(uint64_t x, const int *P, int np) {
  for (int i = 0; i < np; i++) while (x % P[i] == 0) x /= P[i];
  return x == 1;
}

int main(int argc, char **argv) {
  if (argc < 5) { fprintf(stderr, "usage: s488 M c T p...\n"); return 2; }
  uint64_t M = strtoull(argv[1], 0, 10), c = strtoull(argv[2], 0, 10), T = strtoull(argv[3], 0, 10);
  int np = argc - 4, P[64];
  for (int i = 0; i < np && i < 64; i++) P[i] = atoi(argv[4 + i]);
  uint64_t lo = T + 1, hi = c * T;
  if (hi >= M) { printf("SKIP hi>=M\n"); return 0; }
  uint8_t *mark = calloc(M + 1, 1);
  uint64_t nA = 0, maxA = 0;
  for (uint64_t a = lo; a <= hi; a++) if (a > 1 && smooth(a, P, np)) {
    nA++; maxA = a;
    for (uint64_t j = a; j <= M; j += a) mark[j] = 1;
  }
  if (!nA) { printf("EMPTY\n"); free(mark); return 0; }
  uint32_t *f = malloc((M + 1) * sizeof(uint32_t));
  f[0] = 0;
  for (uint64_t x = 1; x <= M; x++) f[x] = f[x - 1] + mark[x];
  /* suffix best m (max f(m)/m) for m > n */
  uint64_t *best = malloc((M + 2) * sizeof(uint64_t));
  best[M + 1] = 0; best[M] = M;
  for (uint64_t m = M - 1; m >= 1; m--) {
    uint64_t b = best[m + 1];
    best[m] = ((__uint128_t)f[m] * b > (__uint128_t)f[b] * m) ? m : b;
    if (m == 1) break;
  }
  double bestR = 0; uint64_t bn = 0, bm = 0; int hit = 0;
  for (uint64_t n = maxA; n < M; n++) {
    uint64_t m = best[n + 1];
    if (!f[n]) continue;
    double R = ((double)f[m] / m) / ((double)f[n] / n);
    if (R > bestR) { bestR = R; bn = n; bm = m; }
    if ((__uint128_t)2 * m * f[n] < (__uint128_t)n * f[m]) hit = 1;
  }
  printf("%s R=%.6f n=%llu m=%llu f(n)=%u f(m)=%u |A|=%llu maxA=%llu c=%llu T=%llu P=", hit ? "HIT" : "no", bestR,
         (unsigned long long)bn, (unsigned long long)bm, f[bn], f[bm], (unsigned long long)nA, (unsigned long long)maxA,
         (unsigned long long)c, (unsigned long long)T);
  for (int i = 0; i < np; i++) printf("%d%s", P[i], i + 1 < np ? "," : "\n");
  free(mark); free(f); free(best);
  return 0;
}
