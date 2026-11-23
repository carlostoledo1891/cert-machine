/* cert-machine D2 cross-check (2026-11-21): counts on C35(1,7,11,16), from the statement.
 *  - independent sets by size, and their orbits under the affine maps x -> a x + b (mod 35) preserving the steps;
 *  - for one representative B per orbit, the number of PARTNERS: independent A, disjoint from B, with A u B meeting
 *    every independent 8-set; the sum over representatives (orbit-invariant, so any choice of representatives);
 *  - for each representative, whether two disjoint partners exist (Lemma P fails iff yes for some B).
 * Brute force over all independent A (73,926) per representative: no pruning, so nothing to trust but the loops.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
typedef uint64_t u64;
#define N 35
static u64 adj[N];
static u64 *ind; static long nind = 0, cap = 0;
static u64 *i8; static long ni8 = 0;

static void push(u64 s) { if (nind == cap) { cap = cap ? 2 * cap : 1024; ind = realloc(ind, cap * 8); } ind[nind++] = s; }
static void enum_ind(u64 set, int next, u64 cand) {
  push(set);
  for (int v = next; v < N; v++) if ((cand >> v) & 1) enum_ind(set | (1ULL << v), v + 1, cand & ~adj[v] & ~((2ULL << v) - 1));
}
static int cmpu(const void *a, const void *b) { u64 x = *(u64 *)a, y = *(u64 *)b; return x < y ? -1 : x > y; }
static long find(u64 s) { long lo = 0, hi = nind - 1; while (lo <= hi) { long m = (lo + hi) / 2; if (ind[m] == s) return m; if (ind[m] < s) lo = m + 1; else hi = m - 1; } return -1; }

int main(void) {
  int steps[4] = {1, 7, 11, 16};
  int D[N] = {0};
  for (int j = 0; j < 4; j++) { D[steps[j]] = 1; D[N - steps[j]] = 1; }
  for (int u = 0; u < N; u++) { adj[u] = 0; for (int v = 0; v < N; v++) if (D[((v - u) % N + N) % N]) adj[u] |= 1ULL << v; }
  enum_ind(0, 0, (1ULL << N) - 1);
  qsort(ind, nind, 8, cmpu);
  long bysize[N + 1] = {0};
  for (long i = 0; i < nind; i++) bysize[__builtin_popcountll(ind[i])]++;
  printf("independent sets: %ld; by size:", nind);
  for (int s = 0; s <= 10; s++) printf(" %ld", bysize[s]);
  printf("\n");
  i8 = malloc(bysize[8] * 8);
  for (long i = 0; i < nind; i++) if (__builtin_popcountll(ind[i]) == 8) i8[ni8++] = ind[i];
  /* multipliers preserving the step set */
  int mults[N], nm = 0;
  for (int a = 1; a < N; a++) {
    int ok = 1; for (int d = 1; d < N; d++) if (D[d] && !D[(a * d) % N]) ok = 0;
    int g = 1; for (int p = 2; p <= a; p++) if (a % p == 0 && N % p == 0) g = 0;
    if (ok && g) mults[nm++] = a;
  }
  printf("multipliers: %d (", nm); for (int i = 0; i < nm; i++) printf(i ? " %d" : "%d", mults[i]); printf("); affine maps: %d\n", nm * N);
  /* orbits */
  char *seen = calloc(nind, 1); long norb = 0, *rep = malloc(nind * sizeof(long));
  for (long i = 0; i < nind; i++) {
    if (seen[i]) continue;
    rep[norb++] = i;
    for (int m = 0; m < nm; m++) for (int b = 0; b < N; b++) {
      u64 t = 0; for (int v = 0; v < N; v++) if ((ind[i] >> v) & 1) t |= 1ULL << ((mults[m] * v + b) % N);
      long k = find(t); if (k < 0) { printf("ERROR: image not independent\n"); return 1; } seen[k] = 1;
    }
  }
  printf("orbits of independent sets: %ld\n", norb);
  /* partners */
  long total = 0, bad = 0;
  u64 *part = malloc(nind * 8);
  for (long r = 0; r < norb; r++) {
    u64 B = ind[rep[r]]; long np = 0;
    for (long a = 0; a < nind; a++) {
      u64 A = ind[a]; if (A & B) continue;
      u64 U = A | B; int ok = 1;
      for (long e = 0; e < ni8; e++) if (!(i8[e] & U)) { ok = 0; break; }
      if (ok) part[np++] = A;
    }
    total += np;
    for (long x = 0; x < np && !bad; x++) for (long y = x + 1; y < np; y++) if (!(part[x] & part[y])) { bad++; printf("DISJOINT PARTNERS for B=%llx\n", (unsigned long long)B); break; }
  }
  printf("partners summed over one representative per orbit: %ld\n", total);
  printf(bad ? "RESULT: a configuration exists\n" : "RESULT: no representative has two disjoint partners (Lemma P holds)\n");
  return bad ? 1 : 0;
}
