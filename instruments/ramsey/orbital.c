/* orbital.c — orbital branching for the clique search of clique.c: one root instead of n when the graph is
 * vertex-transitive, one piece per orbit of the stabilizer of that root instead of one per neighbour. Threaded.
 *
 * orbital.py is the reference and states the lemma with its proof; this file is held to it: the same checks of every
 * given map (a permutation; an automorphism, all n^2 entries; the stabilizer maps fix 0; the group of the transitive
 * maps transitive), the same orbits numbered by smallest element, the same pieces C_i = (N(0) ∩ N(r_i)) minus the
 * earlier orbits, each relabelled core first (the reverse of its smallest-last order), and inside each piece clique.c's
 * search unchanged (smallest-last roots, ties by the smallest label; greedy colouring, lowest label first; the backward
 * walk with its two bounds), so the per-root node counts of every piece equal orbital.py's on every instance both finish
 * (instruments/ramsey/battery-orbital.py). With no maps given (plain mode) there is one piece, the whole graph. Nothing
 * here was read from anyone's code.
 *
 * Input (stdin): "n k", then n lines of n characters '0'/'1' (the graph whose k-cliques are sought: the caller passes
 * the complement to look for an independent set), then "T t" and t lines of n integers (maps whose group must be
 * transitive), then "H h" and h lines of n integers (maps that must fix 0). A map that fails a check is REFUSED: one
 * JSON line {"refused": reason} and exit status 3; nothing is searched.
 *
 * Output (stdout): one JSON line — the reduction (orbits, representatives, piece sizes), found (the k vertices in the
 * input's labels, or null), nodes, units, unitsDone, pieceNodes, complete, timedOut, seconds. complete is true when the
 * answer is final: a clique found, or every unit searched to the end.
 *
 *   -t THREADS   worker threads (default 1); units are handed out one at a time, pieces in order, roots in rank order
 *   -s SECONDS   stop after this long (complete:false; unitsDone tells how far)
 *   -d FILE      progress file: each finished unit appended as "piece rank branch nodes"; units already in it are
 *                skipped on a restart and their counts read back, so a long run survives a stop
 *   -r FILE      write every root's node count, "piece rank nodes" (-1 if not finished), for comparison with orbital.py
 *   -b           split every root into the branches its backward walk takes (units (piece, root, branch)); a root's
 *                count is 1 + the sum of its branches', the same number as unsplit
 *   -R           hand the units out last first (the cheap roots first, so a probe measures the cost per root along the
 *                order); a unit's count does not depend on when it is searched, so the totals are the same
 *   -z           search nothing: read the progress file (-d) and report its totals (a long run re-read by a battery)
 *   -c           check and reduce only: print the reduction and exit without searching
 *
 * Build:  cc -O2 -o orbital orbital.c -lpthread        (no floating point in the search)
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <pthread.h>
#include <stdatomic.h>
#include <time.h>

typedef uint64_t W;
static int n, k, nw, kk;          /* kk: the clique size sought inside each piece (k - 2 with symmetry, k plain) */
static W *adj;                     /* the input graph, n rows of nw words */
static int plain;

typedef struct {                   /* one piece: the induced subgraph, relabelled core first */
  int rep, m, nw;
  int *label;                      /* new label -> input label */
  W *adj;                          /* m rows of nw words, new labels */
  int *order;                      /* smallest-last order of the relabelled graph (ties: smallest new label) */
  W *later;                        /* later[v]: vertices after v in that order */
} Piece;
static Piece *pc; static int npieces;
static int split, reverse, zonly;
typedef struct { int piece, rank, branch; } Unit;
static Unit *units; static int nunits;
static long long *unodes;          /* -1 until done */
static int **rootUnits;            /* split mode: branch units per (piece, rank) */
static int nthreads = 1;
static double limit = 0;
static atomic_int next_unit, stop_flag, timed_out;
static int *found_clique;
static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static FILE *progress;
static double t0;

static double now(void) { struct timespec ts; clock_gettime(CLOCK_MONOTONIC, &ts); return ts.tv_sec + ts.tv_nsec * 1e-9; }
static int pop(const W *a, int w) { int c = 0; for (int i = 0; i < w; i++) c += __builtin_popcountll(a[i]); return c; }
static int any(const W *a, int w) { for (int i = 0; i < w; i++) if (a[i]) return 1; return 0; }
static int lowest(const W *a, int w) { for (int i = 0; i < w; i++) if (a[i]) return i * 64 + __builtin_ctzll(a[i]); return -1; }
static void clr(W *a, int v) { a[v >> 6] &= ~((W)1 << (v & 63)); }
static void set(W *a, int v) { a[v >> 6] |= (W)1 << (v & 63); }
static int has(const W *a, int v) { return (a[v >> 6] >> (v & 63)) & 1; }
#define ROW(v) (adj + (size_t)(v) * nw)

static void refuse(const char *why) { printf("{\"refused\": \"%s\"}\n", why); exit(3); }

typedef struct { const Piece *g; W *P, *U, *Q; int *cv, *cc; int R[64]; long long nodes; } Ctx;

/* clique.c's search on the piece x->g with the target kk: 1 found (x->R[0..kk-1]), 0 none, -1 stopped */
static int search(Ctx *x, int size, int depth) {
  x->nodes++;
  if ((x->nodes & 0xFFFF) == 0) {
    if (atomic_load(&stop_flag)) return -1;
    if (limit > 0 && now() - t0 > limit) { atomic_store(&timed_out, 1); atomic_store(&stop_flag, 1); return -1; }
  }
  if (size == kk) return 1;
  const int w = x->g->nw, m = x->g->m;
  const W *A = x->g->adj;
  W *P = x->P + (size_t)depth * w;
  if (pop(P, w) < kk - size) return 0;
  W *U = x->U, *Q = x->Q;
  int *cv = x->cv + (size_t)depth * m, *cc = x->cc + (size_t)depth * m, len = 0, c = 0;
  memcpy(U, P, w * sizeof(W));
  while (any(U, w)) {
    c++;
    memcpy(Q, U, w * sizeof(W));
    int v;
    while ((v = lowest(Q, w)) >= 0) {
      cv[len] = v; cc[len] = c; len++;
      clr(U, v); clr(Q, v);
      const W *a = A + (size_t)v * w;
      for (int i = 0; i < w; i++) Q[i] &= ~a[i];
    }
  }
  W *Pn = x->P + (size_t)(depth + 1) * w;
  for (int i = len - 1; i >= 0; i--) {
    int v = cv[i];
    if (size + cc[i] < kk) return 0;
    const W *a = A + (size_t)v * w;
    for (int j = 0; j < w; j++) Pn[j] = P[j] & a[j];
    x->R[size] = v;
    int r = search(x, size + 1, depth + 1);
    if (r != 0) return r;
    clr(P, v);
  }
  return 0;
}

/* the colouring of P (clique.c's) on piece g, into cv/cc; returns its length */
static int colour(const Piece *g, const W *P, W *U, W *Q, int *cv, int *cc) {
  int len = 0, c = 0, v, w = g->nw;
  memcpy(U, P, w * sizeof(W));
  while (any(U, w)) {
    c++;
    memcpy(Q, U, w * sizeof(W));
    while ((v = lowest(Q, w)) >= 0) {
      cv[len] = v; cc[len] = c; len++;
      clr(U, v); clr(Q, v);
      const W *a = g->adj + (size_t)v * w;
      for (int i = 0; i < w; i++) Q[i] &= ~a[i];
    }
  }
  return len;
}

static void root_P(const Piece *g, int rank, W *P) {
  int r = g->order[rank];
  const W *a = g->adj + (size_t)r * g->nw, *l = g->later + (size_t)r * g->nw;
  for (int j = 0; j < g->nw; j++) P[j] = a[j] & l[j];
}

static void *worker(void *arg) {
  (void)arg;
  int maxm = 1, maxw = 1;
  for (int p = 0; p < npieces; p++) { if (pc[p].m > maxm) maxm = pc[p].m; if (pc[p].nw > maxw) maxw = pc[p].nw; }
  Ctx x;
  x.P = calloc((size_t)(kk + 3) * maxw, sizeof(W));
  x.U = calloc(maxw, sizeof(W)); x.Q = calloc(maxw, sizeof(W));
  x.cv = calloc((size_t)(kk + 3) * maxm, sizeof(int)); x.cc = calloc((size_t)(kk + 3) * maxm, sizeof(int));
  for (;;) {
    if (atomic_load(&stop_flag)) break;
    int i = atomic_fetch_add(&next_unit, 1);
    if (i >= nunits) break;
    if (reverse) i = nunits - 1 - i;
    if (unodes[i] >= 0) continue;
    Unit u = units[i];
    const Piece *g = &pc[u.piece];
    int res;
    x.g = g;
    x.nodes = 0;
    x.R[0] = g->order[u.rank];
    if (u.branch < 0) {
      root_P(g, u.rank, x.P);
      res = search(&x, 1, 0);
    } else {
      /* the branch the root's backward walk takes at list index u.branch: the root's candidates less the vertices
         listed after it, cut to that vertex's neighbours; searched at size 2 exactly as the unsplit walk would */
      W *P = x.P, *Pn = x.P + g->nw;
      root_P(g, u.rank, P);
      int len = colour(g, P, x.U, x.Q, x.cv, x.cc);
      for (int j = len - 1; j > u.branch; j--) clr(P, x.cv[j]);
      int v = x.cv[u.branch];
      const W *a = g->adj + (size_t)v * g->nw;
      for (int j = 0; j < g->nw; j++) Pn[j] = P[j] & a[j];
      x.R[1] = v;
      res = search(&x, 2, 1);
    }
    if (res < 0) break;
    pthread_mutex_lock(&mu);
    unodes[i] = x.nodes;
    if (progress) { fprintf(progress, "%d %d %d %lld\n", u.piece, u.rank, u.branch, x.nodes); fflush(progress); }
    if (res == 1 && !found_clique) {
      found_clique = malloc(k * sizeof(int));
      int o = 0;
      if (!plain) { found_clique[o++] = 0; found_clique[o++] = g->rep; }
      for (int j = 0; j < kk; j++) found_clique[o++] = g->label[x.R[j]];
      atomic_store(&stop_flag, 1);
    }
    pthread_mutex_unlock(&mu);
  }
  free(x.P); free(x.U); free(x.Q); free(x.cv); free(x.cc);
  return NULL;
}

static int **read_maps(const char *tag, int *count) {
  char t[8];
  if (scanf("%7s %d", t, count) != 2 || strcmp(t, tag) || *count < 0 || *count > 100000) { fprintf(stderr, "orbital: expected \"%s count\"\n", tag); exit(2); }
  int **m = malloc((*count + 1) * sizeof(int *));
  for (int g = 0; g < *count; g++) {
    m[g] = malloc(n * sizeof(int));
    for (int v = 0; v < n; v++) if (scanf("%d", &m[g][v]) != 1) { fprintf(stderr, "orbital: map %s %d is short\n", tag, g); exit(2); }
  }
  return m;
}

static int is_perm(const int *p) {
  char *seen = calloc(n, 1); int ok = 1;
  for (int v = 0; v < n && ok; v++) { if (p[v] < 0 || p[v] >= n || seen[p[v]]) ok = 0; else seen[p[v]] = 1; }
  free(seen); return ok;
}

static int is_aut(const int *p) {
  W *img = calloc(nw, sizeof(W)); int ok = 1;
  for (int v = 0; v < n && ok; v++) {
    memset(img, 0, nw * sizeof(W));
    for (int u = 0; u < n; u++) if (has(ROW(v), u)) set(img, p[u]);
    if (memcmp(img, ROW(p[v]), nw * sizeof(W))) ok = 0;
  }
  free(img); return ok;
}

static int uf_find(int *par, int x) { while (par[x] != x) { par[x] = par[par[x]]; x = par[x]; } return x; }

/* smallest-last of an m-vertex graph A (w words a row): least remaining degree, ties by the smallest label */
static void smallest_last(const W *A, int m, int w, int *order) {
  int *deg = calloc(m + 1, sizeof(int)); char *alive = calloc(m + 1, 1);
  for (int v = 0; v < m; v++) { deg[v] = pop(A + (size_t)v * w, w); alive[v] = 1; }
  for (int i = 0; i < m; i++) {
    int best = -1;
    for (int v = 0; v < m; v++) if (alive[v] && (best < 0 || deg[v] < deg[best])) best = v;
    order[i] = best; alive[best] = 0;
    const W *a = A + (size_t)best * w;
    for (int u = 0; u < m; u++) if (alive[u] && has(a, u)) deg[u]--;
  }
  free(deg); free(alive);
}

/* the subgraph of the input induced on the vertices lab[0..m-1], vertex i being lab[i] */
static W *induce(const int *lab, int m, int w) {
  W *B = calloc((size_t)(m ? m : 1) * w, sizeof(W));
  for (int i = 0; i < m; i++) for (int j = 0; j < m; j++) if (has(ROW(lab[i]), lab[j])) set(B + (size_t)i * w, j);
  return B;
}

/* piece p on the input vertices in mask M: relabel core first, then its smallest-last order and later sets */
static void make_piece(Piece *g, const W *M, int rep) {
  int m = pop(M, nw), w = (m + 63) / 64;
  if (w < 1) w = 1;
  g->rep = rep; g->m = m; g->nw = w;
  int *inc = malloc((m + 1) * sizeof(int)), t = 0;
  for (int v = 0; v < n; v++) if (has(M, v)) inc[t++] = v;
  W *B0 = induce(inc, m, w);
  int *o0 = malloc((m + 1) * sizeof(int));
  smallest_last(B0, m, w, o0);
  g->label = malloc((m + 1) * sizeof(int));
  for (int i = 0; i < m; i++) g->label[i] = inc[o0[m - 1 - i]];      /* label 0: the vertex removed last */
  free(B0); free(o0); free(inc);
  g->adj = induce(g->label, m, w);
  g->order = malloc((m + 1) * sizeof(int));
  smallest_last(g->adj, m, w, g->order);
  g->later = calloc((size_t)(m ? m : 1) * w, sizeof(W));
  W *acc = calloc(w, sizeof(W));
  for (int i = m - 1; i >= 0; i--) { int v = g->order[i]; memcpy(g->later + (size_t)v * w, acc, w * sizeof(W)); set(acc, v); }
  free(acc);
}

int main(int argc, char **argv) {
  const char *pfile = NULL, *rfile = NULL; int checkonly = 0;
  for (int i = 1; i < argc; i++) {
    if (!strcmp(argv[i], "-t") && i + 1 < argc) nthreads = atoi(argv[++i]);
    else if (!strcmp(argv[i], "-s") && i + 1 < argc) limit = atof(argv[++i]);
    else if (!strcmp(argv[i], "-d") && i + 1 < argc) pfile = argv[++i];
    else if (!strcmp(argv[i], "-r") && i + 1 < argc) rfile = argv[++i];
    else if (!strcmp(argv[i], "-b")) split = 1;
    else if (!strcmp(argv[i], "-R")) reverse = 1;
    else if (!strcmp(argv[i], "-z")) zonly = 1;
    else if (!strcmp(argv[i], "-c")) checkonly = 1;
    else { fprintf(stderr, "usage: orbital [-t threads] [-s seconds] [-d progress] [-r rootfile] [-b] [-R] [-z] [-c] < input\n"); return 2; }
  }
  if (scanf("%d %d", &n, &k) != 2 || n < 1 || k < 0 || k > 60) { fprintf(stderr, "orbital: bad header\n"); return 2; }
  nw = (n + 63) / 64;
  adj = calloc((size_t)n * nw, sizeof(W));
  char *line = malloc(n + 8);
  for (int i = 0; i < n; i++) {
    if (scanf("%s", line) != 1 || (int)strlen(line) != n) { fprintf(stderr, "orbital: row %d is not %d characters\n", i, n); return 2; }
    for (int j = 0; j < n; j++) {
      if (line[j] != '0' && line[j] != '1') { fprintf(stderr, "orbital: row %d has a character that is not 0 or 1\n", i); return 2; }
      if (line[j] == '1') set(ROW(i), j);
    }
  }
  for (int i = 0; i < n; i++) {
    if (has(ROW(i), i)) { fprintf(stderr, "orbital: vertex %d is joined to itself\n", i); return 2; }
    for (int j = i + 1; j < n; j++) if (has(ROW(i), j) != has(ROW(j), i)) { fprintf(stderr, "orbital: not symmetric at (%d, %d)\n", i, j); return 2; }
  }
  int nt, nh;
  int **T = read_maps("T", &nt), **H = read_maps("H", &nh);
  /* every check the lemma needs, before anything is searched */
  for (int g = 0; g < nt + nh; g++) {
    int *p = g < nt ? T[g] : H[g - nt];
    if (!is_perm(p)) refuse("a given map is not a permutation of the vertices");
    if (!is_aut(p)) refuse("a given map is not an automorphism of the graph");
  }
  for (int g = 0; g < nh; g++) if (H[g][0] != 0) refuse("a map given for the stabilizer moves vertex 0");
  plain = (nt == 0 && nh == 0);
  if (!plain && nt == 0) refuse("no transitive group was given (T is empty)");
  if (plain && k < 1) { fprintf(stderr, "orbital: plain mode needs k >= 1\n"); return 2; }
  int orbit0 = n;
  if (!plain) {
    char *seen = calloc(n, 1); int *stack = malloc(n * sizeof(int)), sp = 0, cnt = 1;
    seen[0] = 1; stack[sp++] = 0;
    while (sp) { int y = stack[--sp]; for (int g = 0; g < nt; g++) { int z = T[g][y]; if (!seen[z]) { seen[z] = 1; cnt++; stack[sp++] = z; } } }
    free(seen); free(stack);
    orbit0 = cnt;
    if (cnt != n) refuse("the group generated by T is not transitive");
  }
  /* pieces */
  int *osize = calloc(n + 1, sizeof(int));
  pc = calloc(n + 1, sizeof(Piece));
  if (plain) {
    kk = k; npieces = 1;
    W *M = calloc(nw, sizeof(W));
    for (int v = 0; v < n; v++) set(M, v);
    make_piece(&pc[0], M, -1);
    free(M);
  } else {
    kk = k - 2;
    int *par = malloc(n * sizeof(int));
    for (int v = 0; v < n; v++) par[v] = v;
    for (int g = 0; g < nh; g++) for (int v = 0; v < n; v++) {
      int a = uf_find(par, v), b = uf_find(par, H[g][v]);
      if (a != b) { if (a < b) par[b] = a; else par[a] = b; }
    }
    const W *C = ROW(0);
    W *excluded = calloc(nw, sizeof(W)), *M = calloc(nw, sizeof(W));
    npieces = 0;
    for (int v = 0; v < n; v++) {
      if (uf_find(par, v) != v || !has(C, v)) continue;           /* v is the smallest element of its orbit, in N(0) */
      const W *a = ROW(v);
      for (int j = 0; j < nw; j++) M[j] = C[j] & a[j] & ~excluded[j];
      for (int u = 0; u < n; u++) if (uf_find(par, u) == v) {
        if (!has(C, u)) refuse("an orbit of H leaves N(0)");
        set(excluded, u); osize[npieces]++;
      }
      make_piece(&pc[npieces], M, v);
      npieces++;
    }
    for (int u = 0; u < n; u++) if (has(C, u) && !has(excluded, u)) refuse("a neighbour of 0 is in no orbit");
    free(excluded); free(M); free(par);
  }

  printf("{\"n\": %d, \"k\": %d, \"mode\": \"%s\", \"tMaps\": %d, \"hMaps\": %d, \"orbitOf0\": %d, \"pieces\": %d", n, k, plain ? "plain" : "orbital", nt, nh, orbit0, npieces);
  if (!plain) {
    printf(", \"orbitSizes\": ["); for (int p = 0; p < npieces; p++) printf(p ? ", %d" : "%d", osize[p]); printf("]");
    printf(", \"reps\": ["); for (int p = 0; p < npieces; p++) printf(p ? ", %d" : "%d", pc[p].rep); printf("]");
  }
  printf(", \"pieceSizes\": ["); for (int p = 0; p < npieces; p++) printf(p ? ", %d" : "%d", pc[p].m); printf("]");
  fflush(stdout);
  if (checkonly) { printf("}\n"); return 0; }

  t0 = now();
  /* the trivial sizes: a clique of size <= 2 through 0 needs no search */
  if (!plain && k <= 2) {
    int f = (k <= 0) ? 0 : (k == 1 ? 1 : (npieces > 0 ? 2 : -1));
    printf(", \"split\": false, \"found\": ");
    if (f < 0) printf("null"); else { printf("["); if (f >= 1) printf("0"); if (f == 2) printf(", %d", pc[0].rep); printf("]"); }
    printf(", \"nodes\": 0, \"units\": 0, \"unitsDone\": 0, \"pieceNodes\": [], \"complete\": true, \"timedOut\": false, \"seconds\": 0.0}\n");
    return 0;
  }
  if (kk < 2) split = 0;     /* a root of a 1-clique search has no branches to split */
  /* the units: every root of every piece (split: every branch its backward walk takes) */
  int cap = 1024; units = malloc(cap * sizeof(Unit)); nunits = 0;
  rootUnits = calloc(npieces, sizeof(int *));
  {
    int maxm = 1, maxw = 1;
    for (int p = 0; p < npieces; p++) { if (pc[p].m > maxm) maxm = pc[p].m; if (pc[p].nw > maxw) maxw = pc[p].nw; }
    W *P = calloc(maxw, sizeof(W)), *U = calloc(maxw, sizeof(W)), *Q = calloc(maxw, sizeof(W));
    int *cv = calloc(maxm, sizeof(int)), *cc = calloc(maxm, sizeof(int));
    for (int p = 0; p < npieces; p++) {
      const Piece *g = &pc[p];
      rootUnits[p] = calloc(g->m + 1, sizeof(int));
      for (int r = 0; r < g->m; r++) {
        if (!split) {
          if (nunits == cap) { cap *= 2; units = realloc(units, cap * sizeof(Unit)); }
          units[nunits++] = (Unit){p, r, -1};
          continue;
        }
        root_P(g, r, P);
        if (pop(P, g->nw) < kk - 1) continue;      /* the root closes at its first bound: no branch */
        int len = colour(g, P, U, Q, cv, cc);
        for (int i = len - 1; i >= 0; i--) {
          if (1 + cc[i] < kk) break;
          if (nunits == cap) { cap *= 2; units = realloc(units, cap * sizeof(Unit)); }
          units[nunits++] = (Unit){p, r, i};
          rootUnits[p][r]++;
        }
      }
    }
    free(P); free(U); free(Q); free(cv); free(cc);
  }
  unodes = malloc((size_t)(nunits + 1) * sizeof(long long));
  for (int i = 0; i < nunits; i++) unodes[i] = -1;
  if (pfile) {
    FILE *f = fopen(pfile, "r");
    if (f) {
      int p, r, b; long long c;
      while (fscanf(f, "%d %d %d %lld", &p, &r, &b, &c) == 4) {
        if ((b >= 0) != split) { fprintf(stderr, "orbital: the progress file was written in the other split mode\n"); return 2; }
        int lo = 0, hi = nunits - 1, at = -1;
        while (lo <= hi) {                        /* units are sorted by piece, rank, then branch descending */
          int mid = (lo + hi) / 2; Unit u = units[mid];
          int cmp = u.piece != p ? (u.piece < p ? -1 : 1) : u.rank != r ? (u.rank < r ? -1 : 1) : u.branch != b ? (u.branch > b ? -1 : 1) : 0;
          if (!cmp) { at = mid; break; }
          if (cmp < 0) lo = mid + 1; else hi = mid - 1;
        }
        if (at < 0) { fprintf(stderr, "orbital: the progress file names a unit (%d %d %d) this input does not have\n", p, r, b); return 2; }
        unodes[at] = c;
      }
      fclose(f);
    }
    progress = fopen(pfile, "a");
  }
  pthread_t *th = malloc(nthreads * sizeof(pthread_t));
  if (zonly) nthreads = 0;                       /* -z: report what the progress file holds, search nothing */
  for (int i = 0; i < nthreads; i++) pthread_create(&th[i], NULL, worker, NULL);
  for (int i = 0; i < nthreads; i++) pthread_join(th[i], NULL);
  /* totals: unit counts, plus (split mode) one node for each root whose branches are all done */
  long long total = 0; int done = 0;
  long long *pn = calloc(npieces, sizeof(long long));
  for (int i = 0; i < nunits; i++) if (unodes[i] >= 0) { done++; total += unodes[i]; pn[units[i].piece] += unodes[i]; }
  long long **rootn = calloc(npieces, sizeof(long long *));
  for (int p = 0; p < npieces; p++) { rootn[p] = calloc(pc[p].m + 1, sizeof(long long)); for (int r = 0; r < pc[p].m; r++) rootn[p][r] = split ? 1 : -1; }
  if (split) {
    int **left = calloc(npieces, sizeof(int *));
    for (int p = 0; p < npieces; p++) { left[p] = calloc(pc[p].m + 1, sizeof(int)); for (int r = 0; r < pc[p].m; r++) left[p][r] = rootUnits[p][r]; }
    for (int i = 0; i < nunits; i++) if (unodes[i] >= 0) { left[units[i].piece][units[i].rank]--; rootn[units[i].piece][units[i].rank] += unodes[i]; }
    for (int p = 0; p < npieces; p++) for (int r = 0; r < pc[p].m; r++) {
      if (left[p][r] == 0) { total++; pn[p]++; } else rootn[p][r] = -1;
    }
  } else {
    for (int i = 0; i < nunits; i++) rootn[units[i].piece][units[i].rank] = unodes[i];
  }
  int complete = found_clique != NULL || done == nunits;
  if (rfile) {
    FILE *f = fopen(rfile, "w");
    for (int p = 0; p < npieces; p++) for (int r = 0; r < pc[p].m; r++) fprintf(f, "%d %d %lld\n", p, r, rootn[p][r]);
    fclose(f);
  }
  printf(", \"split\": %s, \"found\": ", split ? "true" : "false");
  if (found_clique) { printf("["); for (int i = 0; i < k; i++) printf(i ? ", %d" : "%d", found_clique[i]); printf("]"); } else printf("null");
  printf(", \"nodes\": %lld, \"units\": %d, \"unitsDone\": %d, \"pieceNodes\": [", total, nunits, done);
  for (int p = 0; p < npieces; p++) printf(p ? ", %lld" : "%lld", pn[p]);
  printf("], \"complete\": %s, \"timedOut\": %s, \"seconds\": %.1f}\n", complete ? "true" : "false", atomic_load(&timed_out) ? "true" : "false", now() - t0);
  return 0;
}
