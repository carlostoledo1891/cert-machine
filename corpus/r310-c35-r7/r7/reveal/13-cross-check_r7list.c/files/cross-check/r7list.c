/* cert-machine's own count of the R(7) configurations and of the private-neighbour rule's survivors
 * (2026-11-22, written from the definitions in the tracks' messages; no track's code read).
 *
 * X = one (3,8;27,85)-graph. r(x) = 9 - deg_X(x). A side choice is an unordered pair {S1,S2} (S1 = S2 allowed) of
 * independent 6-sets of X whose union meets every independent 7-set of X. A configuration is an unordered pair of side
 * choices {PA, PB} whose unions are disjoint (A-B is complete, so a common X-neighbour would be a triangle).
 * a(x), b(x) = number of rows of side A, B containing x; r'(x) = r(x) - a(x) - b(x) = C-neighbours x still needs.
 * P_B = {x : b(x) = 0, r'(x) = 1}, P_A = {x : a(x) = 0, r'(x) = 1}.
 * Rule (K = 9): a C row holds at most one vertex of P_A and at most one of P_B. Each needs exactly one C row, so:
 *   V1: |P_A| <= 7 and |P_B| <= 7.
 *   V2: V1, and every vertex of P_A u P_B lies in some usable row: an independent 7-set R with r'(x) >= 1 on R,
 *       |R n P_A| <= 1 and |R n P_B| <= 1.
 * With a third argument the configurations are appended to that file as five uint16 (core, the two 6-set indices of
 * each side, in lexicographic DFS order), the layout of the track's configs.bin, so the two lists can be compared.
 * Usage: r7list cores.g6 index [out.bin]
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
typedef uint32_t u32;
static int n; static u32 adj[32]; static int r[32];
static u32 s6[5000], s7[1000]; static int n6 = 0, n7 = 0;
static void rec(int start, int size, u32 set, u32 cand) {
  if (size == 6) s6[n6++] = set;
  if (size == 7) { s7[n7++] = set; return; }
  for (int v = start; v < n; v++) if ((cand >> v) & 1) rec(v + 1, size + 1, set | (1u << v), cand & ~adj[v] & ~((2u << v) - 1));
}
typedef struct { u32 s1, s2, u; int a, b; } Side;
int main(int argc, char **argv) {
  char line[256]; FILE *f = fopen(argv[1], "r"); int which = atoi(argv[2]);
  for (int i = 0; i <= which; i++) if (!fgets(line, sizeof line, f)) return 1;
  int d[64], L = strlen(line); while (L && line[L-1] == '\n') line[--L] = 0;
  for (int i = 0; i < L; i++) d[i] = line[i] - 63;
  n = d[0]; int bi = 1, bit = 5;
  for (int j = 1; j < n; j++) for (int i = 0; i < j; i++) { int b = (d[bi] >> bit) & 1; if (--bit < 0) { bit = 5; bi++; } if (b) { adj[i] |= 1u << j; adj[j] |= 1u << i; } }
  for (int x = 0; x < n; x++) r[x] = 9 - __builtin_popcount(adj[x]);
  rec(0, 0, 0, (1u << n) - 1);
  Side *S = malloc(200000 * sizeof(Side)); long ns = 0;
  for (int a = 0; a < n6; a++) for (int b = a; b < n6; b++) {
    u32 U = s6[a] | s6[b]; int ok = 1;
    for (int t = 0; t < n7; t++) if (!(s7[t] & U)) { ok = 0; break; }
    if (ok) { S[ns].s1 = s6[a]; S[ns].s2 = s6[b]; S[ns].u = U; S[ns].a = a; S[ns].b = b; ns++; }
  }
  FILE *out = argc > 3 ? fopen(argv[3], "ab") : NULL;
  long configs = 0, v1 = 0, v2 = 0, rneg = 0, hist[28] = {0};
  for (long p = 0; p < ns; p++) for (long q = p + 1; q < ns; q++) {
    if (S[p].u & S[q].u) continue;
    configs++;
    if (out) { uint16_t rec5[5] = { (uint16_t)which, (uint16_t)S[p].a, (uint16_t)S[p].b, (uint16_t)S[q].a, (uint16_t)S[q].b }; fwrite(rec5, sizeof rec5, 1, out); }
    u32 PA = 0, PB = 0, Z = 0; int bad = 0;
    for (int x = 0; x < n; x++) {
      int a = ((S[p].s1 >> x) & 1) + ((S[p].s2 >> x) & 1), b = ((S[q].s1 >> x) & 1) + ((S[q].s2 >> x) & 1);
      int rp = r[x] - a - b;
      if (rp < 0) bad = 1;
      if (rp == 0) Z |= 1u << x;
      if (rp == 1 && b == 0) PB |= 1u << x;
      if (rp == 1 && a == 0) PA |= 1u << x;
    }
    if (bad) { rneg++; continue; }
    int ca = __builtin_popcount(PA), cb = __builtin_popcount(PB);
    hist[ca > cb ? ca : cb]++;
    if (ca > 7 || cb > 7) continue;
    v1++;
    u32 cover = 0;
    for (int t = 0; t < n7; t++) {
      u32 R = s7[t];
      if (R & Z) continue;
      if (__builtin_popcount(R & PA) > 1 || __builtin_popcount(R & PB) > 1) continue;
      cover |= R;
    }
    if (((PA | PB) & ~cover) == 0) v2++;
  }
  printf("core %d: side choices %ld; configurations %ld (negative demand %ld); V1 survivors %ld; V2 survivors %ld\n", which, ns, configs, rneg, v1, v2);
  printf("  max(|P_A|,|P_B|) histogram:"); for (int i = 0; i < 28; i++) if (hist[i]) printf(" %d:%ld", i, hist[i]); printf("\n");
  return 0;
}
