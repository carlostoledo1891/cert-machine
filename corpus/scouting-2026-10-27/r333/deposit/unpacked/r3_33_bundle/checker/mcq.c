/* mcq.c - independent exact clique decision for the record-hunt checker.
   Tomita & Seki's MCQ (2003): branch and bound with greedy colouring bound, plain int arrays
   (no bitsets, no code shared with src/clq*.c).
   stdin: m, m rows of '0'/'1' (adjacency), then target t.  stdout: CLIQUE v1..vt (0-based) or NOCLIQUE. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
static int m, t, *A, cur[1024], depth, found, best[1024];
#define ADJ(i,j) A[(i)*m+(j)]
static void colour_sort(int *Q, int q, int *col, int kmin){
  /* greedy sequential colouring of Q (in given order); output Q sorted by colour, colours in col */
  static int cls[1024][1024]; int ncl[1024]; int maxc = 0;
  for (int i = 0; i < q; i++) {
    int v = Q[i], c = 0;
    for (;;) { int ok = 1; for (int j = 0; c < maxc && j < ncl[c]; j++) if (ADJ(v, cls[c][j])) { ok = 0; break; }
      if (c >= maxc) { ncl[c] = 0; maxc = c + 1; }
      if (ok) break; c++; }
    cls[c][ncl[c]++] = v;
  }
  int k = 0, j0 = 0;
  for (int c = 0; c < maxc; c++) for (int j = 0; j < ncl[c]; j++) {
    Q[k] = cls[c][j]; col[k] = c + 1; k++; (void)j0; }
  (void)kmin;
}
static void expand(int *Q, int *col, int q){
  while (q > 0 && !found) {
    if (depth + col[q - 1] < t) return;          /* colour bound */
    int p = Q[q - 1];
    cur[depth++] = p;
    if (depth >= t) { memcpy(best, cur, sizeof(int) * depth); found = 1; return; }
    int *NQ = malloc(sizeof(int) * q), *NC = malloc(sizeof(int) * q), nq = 0;
    for (int i = 0; i < q - 1; i++) if (ADJ(p, Q[i])) NQ[nq++] = Q[i];
    if (nq > 0) { colour_sort(NQ, nq, NC, t - depth); expand(NQ, NC, nq); }
    free(NQ); free(NC);
    depth--; q--;
  }
}
int main(void){
  if (scanf("%d", &m) != 1) return 2;
  A = calloc((size_t)m * m, sizeof(int)); char *row = malloc(m + 2);
  for (int i = 0; i < m; i++) { scanf("%s", row); for (int j = 0; j < m; j++) ADJ(i, j) = row[j] == '1'; }
  scanf("%d", &t);
  if (t <= 0) { printf("CLIQUE\n"); return 0; }
  int *Q = malloc(sizeof(int) * (m + 1)), *col = malloc(sizeof(int) * (m + 1)), *deg = calloc(m, sizeof(int));
  for (int i = 0; i < m; i++) for (int j = 0; j < m; j++) deg[i] += ADJ(i, j);
  for (int i = 0; i < m; i++) Q[i] = i;
  for (int i = 0; i < m; i++) for (int j = i + 1; j < m; j++) if (deg[Q[j]] > deg[Q[i]]) { int x = Q[i]; Q[i] = Q[j]; Q[j] = x; }
  colour_sort(Q, m, col, t);
  expand(Q, col, m);
  if (found) { printf("CLIQUE"); for (int i = 0; i < t; i++) printf(" %d", best[i]); printf("\n"); }
  else printf("NOCLIQUE\n");
  return 0;
}
