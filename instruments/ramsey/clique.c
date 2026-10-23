/* clique.c — does a graph have a clique of size k? The exact, exhaustive search of clique.py, in C, threaded.
 *
 * clique.py is the reference and states the algorithm in full; this file is held to it: the same smallest-last
 * order (least remaining degree, ties by the smallest label), roots in that order with candidates their later
 * neighbours, the same greedy colouring (lowest label first), the same backward walk with the same two bounds.
 * On every graph both finish, the per-root node counts must be equal (instruments/ramsey/battery.py). Nothing here
 * was read from anyone's code.
 *
 * Input (stdin): a line "n k", then n lines of n characters '0'/'1' — the adjacency of the graph to search (the
 * caller passes the complement to look for an independent set). The caller has already refused a file that is not
 * a simple graph (graph.py); this program re-checks squareness, symmetry and the diagonal anyway.
 *
 * Output (stdout): one JSON line — found (the clique's vertices, or null), nodes, roots, rootsDone, complete,
 * seconds. complete is true when the answer is final: a clique found, or every root searched to the end.
 *
 *   -t THREADS      worker threads (default 1); roots are handed out one at a time
 *   -s SECONDS      stop after this long (complete:false, rootsDone tells how far)
 *   -d FILE         progress file: each finished root appended as "rank nodes"; roots already in it are skipped
 *                   on a restart (their counts are read back into the totals), so a long run survives a stop
 *   -r FILE         write every root's node count, "rank nodes" in rank order, for comparison with clique.py
 *
 * Build:  cc -O2 -o clique clique.c -lpthread        (macOS clang or Linux gcc; no floating point anywhere)
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <pthread.h>
#include <stdatomic.h>
#include <time.h>

typedef uint64_t W;
static int n, k, nw;
static W *adj;               /* n rows of nw words */
static W *later;             /* later[r]: vertices of higher rank than r */
static int *order, *rankof;
static int nthreads = 1;
static double limit = 0;
static atomic_int next_root, stop_flag, timed_out;
static atomic_llong total_nodes;
static long long *root_nodes;  /* -1 until done */
static int *found_clique, found_size;
static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static FILE *progress;
static double t0;

#define ROW(v) (adj + (size_t)(v) * nw)

static double now(void) { struct timespec ts; clock_gettime(CLOCK_MONOTONIC, &ts); return ts.tv_sec + ts.tv_nsec * 1e-9; }
static int pop(const W *a) { int c = 0; for (int i = 0; i < nw; i++) c += __builtin_popcountll(a[i]); return c; }
static int any(const W *a) { for (int i = 0; i < nw; i++) if (a[i]) return 1; return 0; }
static int lowest(const W *a) { for (int i = 0; i < nw; i++) if (a[i]) return i * 64 + __builtin_ctzll(a[i]); return -1; }
static void clr(W *a, int v) { a[v >> 6] &= ~((W)1 << (v & 63)); }
static int has(const W *a, int v) { return (a[v >> 6] >> (v & 63)) & 1; }

typedef struct { W *P, *U, *Q; int *cv, *cc; int R[64]; long long nodes; } Ctx;

/* returns 1 when a clique was found (ctx->R[0..k-1]), 0 otherwise; -1 when stopped */
static int search(Ctx *x, int size, int depth) {
  x->nodes++;
  if ((x->nodes & 0xFFFF) == 0) {
    if (atomic_load(&stop_flag)) return -1;
    if (limit > 0 && now() - t0 > limit) { atomic_store(&timed_out, 1); atomic_store(&stop_flag, 1); return -1; }
  }
  if (size == k) return 1;
  W *P = x->P + (size_t)depth * nw;
  if (pop(P) < k - size) return 0;
  /* colour P: list in colouring order */
  W *U = x->U, *Q = x->Q;
  int *cv = x->cv + (size_t)depth * n, *cc = x->cc + (size_t)depth * n, len = 0, c = 0;
  memcpy(U, P, nw * sizeof(W));
  while (any(U)) {
    c++;
    memcpy(Q, U, nw * sizeof(W));
    int v;
    while ((v = lowest(Q)) >= 0) {
      cv[len] = v; cc[len] = c; len++;
      clr(U, v); clr(Q, v);
      const W *a = ROW(v);
      for (int i = 0; i < nw; i++) Q[i] &= ~a[i];
    }
  }
  W *Pn = x->P + (size_t)(depth + 1) * nw;
  for (int i = len - 1; i >= 0; i--) {
    int v = cv[i];
    if (size + cc[i] < k) return 0;
    const W *a = ROW(v);
    for (int j = 0; j < nw; j++) Pn[j] = P[j] & a[j];
    x->R[size] = v;
    int r = search(x, size + 1, depth + 1);
    if (r != 0) return r;
    clr(P, v);
  }
  return 0;
}

static void *worker(void *arg) {
  (void)arg;
  Ctx x;
  x.P = calloc((size_t)(k + 2) * nw, sizeof(W));
  x.U = calloc(nw, sizeof(W)); x.Q = calloc(nw, sizeof(W));
  x.cv = calloc((size_t)(k + 2) * n, sizeof(int)); x.cc = calloc((size_t)(k + 2) * n, sizeof(int));
  for (;;) {
    if (atomic_load(&stop_flag)) break;
    int i = atomic_fetch_add(&next_root, 1);
    if (i >= n) break;
    if (root_nodes[i] >= 0) continue;            /* done in an earlier run */
    int r = order[i];
    const W *a = ROW(r), *l = later + (size_t)r * nw;
    for (int j = 0; j < nw; j++) x.P[j] = a[j] & l[j];
    x.nodes = 0;
    x.R[0] = r;
    int res = search(&x, 1, 0);
    if (res < 0) break;                          /* stopped: this root is not done */
    atomic_fetch_add(&total_nodes, x.nodes);
    pthread_mutex_lock(&mu);
    root_nodes[i] = x.nodes;
    if (progress) { fprintf(progress, "%d %lld\n", i, x.nodes); fflush(progress); }
    if (res == 1 && !found_clique) { found_clique = malloc(k * sizeof(int)); memcpy(found_clique, x.R, k * sizeof(int)); found_size = k; atomic_store(&stop_flag, 1); }
    pthread_mutex_unlock(&mu);
  }
  free(x.P); free(x.U); free(x.Q); free(x.cv); free(x.cc);
  return NULL;
}

int main(int argc, char **argv) {
  const char *pfile = NULL, *rfile = NULL;
  for (int i = 1; i < argc; i++) {
    if (!strcmp(argv[i], "-t") && i + 1 < argc) nthreads = atoi(argv[++i]);
    else if (!strcmp(argv[i], "-s") && i + 1 < argc) limit = atof(argv[++i]);
    else if (!strcmp(argv[i], "-d") && i + 1 < argc) pfile = argv[++i];
    else if (!strcmp(argv[i], "-r") && i + 1 < argc) rfile = argv[++i];
    else { fprintf(stderr, "usage: clique [-t threads] [-s seconds] [-d progress] [-r rootfile] < matrix\n"); return 2; }
  }
  if (scanf("%d %d", &n, &k) != 2 || n < 1 || k < 1 || k > 60) { fprintf(stderr, "clique: bad header\n"); return 2; }
  nw = (n + 63) / 64;
  adj = calloc((size_t)n * nw, sizeof(W));
  char *line = malloc(n + 8);
  for (int i = 0; i < n; i++) {
    if (scanf("%s", line) != 1 || (int)strlen(line) != n) { fprintf(stderr, "clique: row %d is not %d characters\n", i, n); return 2; }
    for (int j = 0; j < n; j++) {
      if (line[j] != '0' && line[j] != '1') { fprintf(stderr, "clique: row %d has a character that is not 0 or 1\n", i); return 2; }
      if (line[j] == '1') ROW(i)[j >> 6] |= (W)1 << (j & 63);
    }
  }
  for (int i = 0; i < n; i++) {
    if (has(ROW(i), i)) { fprintf(stderr, "clique: vertex %d is joined to itself\n", i); return 2; }
    for (int j = i + 1; j < n; j++) if (has(ROW(i), j) != has(ROW(j), i)) { fprintf(stderr, "clique: not symmetric at (%d, %d)\n", i, j); return 2; }
  }
  /* smallest-last: least remaining degree, ties by the smallest label */
  order = malloc(n * sizeof(int)); rankof = malloc(n * sizeof(int));
  int *deg = malloc(n * sizeof(int)); char *alive = malloc(n);
  for (int v = 0; v < n; v++) { deg[v] = pop(ROW(v)); alive[v] = 1; }
  for (int i = 0; i < n; i++) {
    int best = -1;
    for (int v = 0; v < n; v++) if (alive[v] && (best < 0 || deg[v] < deg[best])) best = v;
    order[i] = best; rankof[best] = i; alive[best] = 0;
    for (int u = 0; u < n; u++) if (alive[u] && has(ROW(best), u)) deg[u]--;
  }
  later = calloc((size_t)n * nw, sizeof(W));
  W *acc = calloc(nw, sizeof(W));
  for (int i = n - 1; i >= 0; i--) { int v = order[i]; memcpy(later + (size_t)v * nw, acc, nw * sizeof(W)); acc[v >> 6] |= (W)1 << (v & 63); }
  root_nodes = malloc(n * sizeof(long long));
  for (int i = 0; i < n; i++) root_nodes[i] = -1;
  long long resumed = 0;
  if (pfile) {
    FILE *f = fopen(pfile, "r");
    if (f) { int i; long long c; while (fscanf(f, "%d %lld", &i, &c) == 2) if (i >= 0 && i < n && root_nodes[i] < 0) { root_nodes[i] = c; resumed += c; } fclose(f); }
    progress = fopen(pfile, "a");
  }
  atomic_store(&total_nodes, resumed);
  t0 = now();
  pthread_t *th = malloc(nthreads * sizeof(pthread_t));
  for (int i = 0; i < nthreads; i++) pthread_create(&th[i], NULL, worker, NULL);
  for (int i = 0; i < nthreads; i++) pthread_join(th[i], NULL);
  int done = 0; for (int i = 0; i < n; i++) if (root_nodes[i] >= 0) done++;
  int complete = found_clique != NULL || done == n;
  if (rfile) { FILE *f = fopen(rfile, "w"); for (int i = 0; i < n; i++) fprintf(f, "%d %lld\n", i, root_nodes[i]); fclose(f); }
  printf("{\"n\": %d, \"k\": %d, \"found\": ", n, k);
  if (found_clique) { printf("["); for (int i = 0; i < found_size; i++) printf(i ? ", %d" : "%d", found_clique[i]); printf("]"); } else printf("null");
  printf(", \"nodes\": %lld, \"roots\": %d, \"rootsDone\": %d, \"complete\": %s, \"timedOut\": %s, \"seconds\": %.1f}\n",
    (long long)atomic_load(&total_nodes), n, done, complete ? "true" : "false", atomic_load(&timed_out) ? "true" : "false", now() - t0);
  return 0;
}
