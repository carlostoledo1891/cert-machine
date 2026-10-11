/* lr.c — a clean-room decider for one prime gate of the lonely runner proofs (instruments/lonelyrunner/README.md).
 *
 * Written from the text of Allikvere, "Fifteen lonely runners" (arXiv:2609.02604 v2), Sections 2 and 4, and the
 * definitions it recalls from Sungkawichai-Trakulthongchai; none of the author's code was read. One gate per run:
 *
 *   cc -O3 -o lr lr.c && ./lr <k> <p> [--no-neargcd] [--k1 <K1>]
 *
 * prints one JSON record of every count the computation passes through, and the verdict:
 *   CLOSED  — every improper level-1 orbit is eventually proper, or handled by the few-exception shift lemma
 *   OPEN    — some terminal lift is neither proper nor handled (listed, up to a cap)
 * --no-neargcd switches the shift lemma off (a red control); --k1 overrides k+1 in the distance test (a red control:
 * the covering threshold of a different problem).
 */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAXK 16
#define MAXN 1024                 /* classes (p up to 2049) */
#define CW ((MAXN + 63) / 64)     /* words of a class or time bitset */

static int K, K1, P, NCL, M, Q;   /* speeds, threshold denominator, prime, classes, cover size, quota */
static int NEARGCD = 1;
static long JOBS = 1, JOB = 0, SPLITD = 3, split_counter = 0;
static int BOUND = 1;   /* the coverage bound: the r best new coverages of admissible classes must reach the uncovered count */   /* --jobs J --job j: the subtrees at depth SPLITD, round robin */
static const char *SURV_OUT = NULL;                                /* --survivors FILE: write the level-32 orbits, skip the terminal */
static int nw;                    /* words actually used for class bitsets */

typedef uint64_t word;
static inline int popc(word x) { return __builtin_popcountll(x); }
static inline long dist(long x, long N) { x %= N; if (x < 0) x += N; return x < N - x ? x : N - x; }
static inline int cls(long x) { x %= P; if (x < 0) x += P; return x <= P / 2 ? (int)x : (int)(P - x); }
static long gcdl(long a, long b) { while (b) { long t = a % b; a = b; b = t; } return a < 0 ? -a : a; }
static long modinv(long a, long m) { long t = 0, nt = 1, r = m, nr = a % m; while (nr) { long q = r / nr, x; x = t - q * nt; t = nt; nt = x; x = r - q * nr; r = nr; nr = x; } return t < 0 ? t + m : t; }

/* ------------------------------------------------------------------ stage 1: minimal covers, up to units */
static word cover[MAXN + 1][CW];   /* cover[v]: time classes covered by speed class v (bit t-1) */
static word who[MAXN + 1][CW];     /* who[t]: speed classes covering time t (bit v-1) */
static int cnt[MAXN + 1], own[MAXN + 1], priv[MAXN + 1];
static int chosen[MAXK + 1], depth;
static word covered[CW];
static long nodes = 0;

typedef struct { int s; uint16_t c[MAXK]; } cov_t;
static cov_t *covs = NULL; static long ncov = 0, capcov = 0;
static long covs_by_size[MAXK + 1];

static int dead;                   /* a chosen class lost its last private time */
static void add_class(int y) {
  chosen[depth++] = y;
  for (int w = 0; w < nw; w++) for (word b = cover[y][w]; b; b &= b - 1) {
    int t = w * 64 + __builtin_ctzll(b) + 1;
    if (cnt[t] == 0) { priv[y]++; covered[w] |= (word)1 << (t - 1 - w * 64); }
    else if (cnt[t] == 1) { if (--priv[own[t]] == 0) dead++; }
    own[t] ^= y; cnt[t]++;
  }
}
static void remove_class(int y) {
  depth--;
  for (int w = 0; w < nw; w++) for (word b = cover[y][w]; b; b &= b - 1) {
    int t = w * 64 + __builtin_ctzll(b) + 1;
    cnt[t]--; own[t] ^= y;
    if (cnt[t] == 0) { priv[y]--; covered[w] &= ~((word)1 << (t - 1 - w * 64)); }
    else if (cnt[t] == 1) { if (priv[own[t]]++ == 0) dead--; }
  }
}
static int cmp_u16(const void *a, const void *b) { return (int)*(const uint16_t *)a - (int)*(const uint16_t *)b; }
static int lexcmp(const uint16_t *a, const uint16_t *b, int s) { for (int i = 0; i < s; i++) if (a[i] != b[i]) return a[i] < b[i] ? -1 : 1; return 0; }

/* the found cover T (containing class 1, every class with a private time, class 1 with >= Q of them) is kept iff it is
   the least of the sorted sets x^{-1}T over its classes x with >= Q private times */
static void found_cover(void) {
  int s = depth; uint16_t me[MAXK], img[MAXK];
  for (int i = 0; i < s; i++) me[i] = (uint16_t)chosen[i];
  qsort(me, s, sizeof me[0], cmp_u16);
  for (int i = 0; i < s; i++) {
    int x = chosen[i];
    if (x == 1 || priv[x] < Q) continue;
    long xi = modinv(x, P);
    for (int j = 0; j < s; j++) img[j] = (uint16_t)cls(xi * chosen[j]);
    qsort(img, s, sizeof img[0], cmp_u16);
    if (lexcmp(img, me, s) < 0) return;
  }
  if (ncov == capcov) { capcov = capcov ? 2 * capcov : 1024; covs = realloc(covs, capcov * sizeof *covs); }
  covs[ncov].s = s; memcpy(covs[ncov].c, me, s * sizeof me[0]); ncov++; covs_by_size[s]++;
}

static void search(word *allowed) {
  nodes++;
  if (depth == SPLITD && (split_counter++ % JOBS) != JOB) return;
  if ((nodes & ((1L << 32) - 1)) == 0) fprintf(stderr, "stage1: %ld nodes, %ld covers, %ld subtrees at depth %ld\n", nodes, ncov, split_counter, SPLITD);
  if (dead || priv[1] < Q) return;
  int unc = 0, best = -1, bestc = 1 << 30;
  for (int w = 0; w < nw; w++) {
    word u = ~covered[w];
    if (w == nw - 1 && NCL % 64) u &= ((word)1 << (NCL % 64)) - 1;
    for (; u; u &= u - 1) {
      int t = w * 64 + __builtin_ctzll(u) + 1; unc++;
      int c = 0; for (int v = 0; v < nw; v++) c += popc(who[t][v] & allowed[v]);
      if (c < bestc) { bestc = c; best = t; }
    }
  }
  if (unc == 0) { if (depth > SPLITD || JOB == 0) found_cover(); return; }   /* a cover above the split depth: job 0 keeps it */
  if (depth == K || bestc == 0 || unc > (K - depth) * M) return;
  if (BOUND && K - depth >= 1) {
    /* each class still admissible adds at most its new coverage; the r = K - depth largest must reach unc */
    int r = K - depth, top[MAXK]; for (int i = 0; i < r; i++) top[i] = 0;
    for (int w = 0; w < nw; w++) for (word b = allowed[w]; b; b &= b - 1) {
      int y = w * 64 + __builtin_ctzll(b) + 1, nc = 0;
      for (int v = 0; v < nw; v++) nc += popc(cover[y][v] & ~covered[v]);
      if (nc > top[r - 1]) { int i = r - 1; while (i > 0 && top[i - 1] < nc) { top[i] = top[i - 1]; i--; } top[i] = nc; }
    }
    int sum = 0; for (int i = 0; i < r; i++) sum += top[i];
    if (sum < unc) return;
  }
  word next[CW]; memcpy(next, allowed, nw * sizeof(word));
  for (int w = 0; w < nw; w++) for (word b = who[best][w] & allowed[w]; b; b &= b - 1) {
    int y = w * 64 + __builtin_ctzll(b) + 1;
    next[w] &= ~((word)1 << (y - 1 - w * 64));   /* y is chosen now and forbidden in every later branch of this node */
    add_class(y);
    search(next);
    remove_class(y);
  }
}

/* ------------------------------------------------------------------ lifting */
/* the improper (or, with want_witness_free, the witness-free) lifts of v (residues modulo l*P) to level f*l */
typedef struct { long *v; long n, cap; } vecs_t;   /* flat K-tuples */
static void vpush(vecs_t *s, const long *w) { if (s->n == s->cap) { s->cap = s->cap ? 2 * s->cap : 256; s->v = realloc(s->v, s->cap * K * sizeof(long)); } memcpy(s->v + s->n * K, w, K * sizeof(long)); s->n++; }

static int gcd_proper(const long *w, long L) {   /* for some i, gcd(L, w_j : j != i) > 1 */
  long pre[MAXK + 1], suf[MAXK + 1];
  pre[0] = L; for (int i = 0; i < K; i++) pre[i + 1] = gcdl(pre[i], w[i]);
  suf[K] = L; for (int i = K - 1; i >= 0; i--) suf[i] = gcdl(suf[i + 1], w[i]);
  for (int i = 0; i < K; i++) if (gcdl(pre[i], suf[i + 1]) > 1) return 1;
  return 0;
}

static int TW;                         /* words of a time bitset in the current stage */
static word *good, *allg, *suff;       /* good[(i*F+a)*TW], allg[i*TW], suff[i*TW] */
static int F; static long LEV, N, LP_old;
static long base[MAXK], cur[MAXK];
static vecs_t *outv; static int want_wf; static long stage_nodes;

static void lift_dfs(int i, const word *viable) {
  stage_nodes++;
  int any = 0;
  for (int w = 0; w < TW; w++) if (viable[w] & suff[i * TW + w]) { any = 1; break; }   /* a time good for every completion */
  if (any) return;
  if (i == K) {
    for (int w = 0; w < TW; w++) if (viable[w]) return;             /* witness */
    if (!want_wf && gcd_proper(cur, LEV)) return;                     /* proper by the gcd condition */
    vpush(outv, cur); return;
  }
  word nv[TW > 0 ? TW : 1];
  for (int a = 0; a < F; a++) {
    for (int w = 0; w < TW; w++) nv[w] = viable[w] & good[(i * F + a) * TW + w];
    cur[i] = base[i] + (long)a * LP_old;
    lift_dfs(i + 1, nv);
  }
}

/* the witness-free lifts by a search driven by the times (the paper's terminal stage: "branching on the time class
   with fewest remaining options"): a time still good for every assigned coordinate must be killed by some unassigned
   coordinate taking a digit for which it is bad; the search branches on the killers of the time with the fewest, and
   forbids in branch j the killers 1..j-1, so every witness-free lift is reached through exactly one first killer of
   that time. When no time is left, the unassigned coordinates take every digit not forbidden. */
static int assigned[MAXK], forb[MAXK];
static void wf_emit(int i) {
  if (i == K) { vpush(outv, cur); return; }
  if (assigned[i] >= 0) { cur[i] = base[i] + (long)assigned[i] * LP_old; wf_emit(i + 1); return; }
  for (int a = 0; a < F; a++) if (!(forb[i] >> a & 1)) { cur[i] = base[i] + (long)a * LP_old; wf_emit(i + 1); }
}
static void wf_search(const word *viable) {
  stage_nodes++;
  int best_t = -1, best_k = 1 << 30;
  for (int w = 0; w < TW; w++) for (word b = viable[w]; b; b &= b - 1) {
    int t = w * 64 + __builtin_ctzll(b), kc = 0;
    for (int i = 0; i < K && kc < best_k; i++) if (assigned[i] < 0)
      for (int a = 0; a < F; a++) if (!(forb[i] >> a & 1) && !(good[(i * F + a) * TW + t / 64] >> (t % 64) & 1)) kc++;
    if (kc < best_k) { best_k = kc; best_t = t; if (kc == 0) break; }
  }
  if (best_t < 0) { wf_emit(0); return; }        /* no time left: every completion is witness-free */
  if (best_k == 0) return;                        /* a time no remaining coordinate can kill: every completion has it */
  int added_i[MAXK * 16], added_a[MAXK * 16], nadded = 0;
  word nv[TW];
  for (int i = 0; i < K; i++) if (assigned[i] < 0)
    for (int a = 0; a < F; a++) if (!(forb[i] >> a & 1) && !(good[(i * F + a) * TW + best_t / 64] >> (best_t % 64) & 1)) {
      assigned[i] = a;
      for (int w = 0; w < TW; w++) nv[w] = viable[w] & good[(i * F + a) * TW + w];
      wf_search(nv);
      assigned[i] = -1;
      forb[i] |= 1 << a; added_i[nadded] = i; added_a[nadded++] = a;   /* killer (i, a) is excluded from later branches */
    }
  for (int j = 0; j < nadded; j++) forb[added_i[j]] &= ~(1 << added_a[j]);
}

/* times new at level f*l, folded by c <-> N-c: c in 1..N/2 with the level of c/N not among `known` (levels where no
   witness can exist: the previous level, or the factor levels at the terminal stage) */
static long *tlist; static int ntimes;
static void make_times(long Nn, long lev, const long *known, int nk) {
  ntimes = 0; tlist = realloc(tlist, (Nn / 2 + 2) * sizeof(long));
  for (long c = 1; c <= Nn / 2; c++) {
    long lvl = lev / gcdl(c, lev);           /* c/(lev*P) has level lvl (it lies in (lvl*P)^-1 Z) */
    int skip = 0; for (int j = 0; j < nk; j++) if (known[j] % lvl == 0) { skip = 1; break; }
    if (!skip) tlist[ntimes++] = c;
  }
}

/* the good-time bitset of every residue x modulo N at one (level, known-levels) setting, computed on first use: the
   time set depends only on the level, so the same table serves every vector lifted to that level */
typedef struct { long N, key; int tw, nt; word *tab; uint8_t *done; long *times; } gcache_t;
static gcache_t gc[16]; static int ngc = 0;
static gcache_t *cache_for(long Nn, long lev, const long *known, int nk) {
  long key = lev; for (int j = 0; j < nk; j++) key = key * 1000003 + known[j];
  for (int i = 0; i < ngc; i++) if (gc[i].N == Nn && gc[i].key == key) return &gc[i];
  gcache_t *g = &gc[ngc++];
  make_times(Nn, lev, known, nk);
  g->N = Nn; g->key = key; g->nt = ntimes; g->tw = (ntimes + 63) / 64; if (g->tw == 0) g->tw = 1;
  g->times = malloc((ntimes + 1) * sizeof(long)); memcpy(g->times, tlist, ntimes * sizeof(long));
  g->tab = calloc((size_t)Nn * g->tw, sizeof(word)); g->done = calloc(Nn, 1);
  return g;
}
static const word *good_of(gcache_t *g, long x) {
  word *row = g->tab + (size_t)x * g->tw;
  if (!g->done[x]) {
    for (int j = 0; j < g->nt; j++) if ((long)K1 * dist(g->times[j] * x, g->N) >= g->N) row[j / 64] |= (word)1 << (j % 64);
    g->done[x] = 1;
  }
  return row;
}

/* lift one vector v (modulo l*P) by factor f; collect into out */
static void lift_one(const long *v, long l, int f, const long *known, int nk, int wf, vecs_t *out) {
  F = f; LEV = l * f; N = LEV * P; LP_old = l * P;
  gcache_t *g = cache_for(N, LEV, known, nk);
  ntimes = g->nt; TW = g->tw;
  good = realloc(good, (size_t)K * F * TW * sizeof(word)); allg = realloc(allg, (size_t)K * TW * sizeof(word));
  suff = realloc(suff, (size_t)(K + 1) * TW * sizeof(word));
  for (int i = 0; i < K; i++) for (int a = 0; a < F; a++)
    memcpy(good + (size_t)(i * F + a) * TW, good_of(g, (v[i] + (long)a * LP_old) % N), TW * sizeof(word));
  for (int i = 0; i < K; i++) for (int w = 0; w < TW; w++) { word g = ~(word)0; for (int a = 0; a < F; a++) g &= good[(i * F + a) * TW + w]; allg[i * TW + w] = g; }
  for (int w = 0; w < TW; w++) suff[K * TW + w] = 0;               /* nothing to complete: no universal time */
  for (int i = K - 1; i >= 0; i--) for (int w = 0; w < TW; w++) suff[i * TW + w] = (i == K - 1 ? allg[i * TW + w] : allg[i * TW + w] & suff[(i + 1) * TW + w]);
  /* suff[i] = times good for every digit of every coordinate i..K-1; at i == K it must be empty, and the test at the
     leaf is the viable set itself */
  word vi[TW]; for (int w = 0; w < TW; w++) vi[w] = ~(word)0;
  if (ntimes % 64) vi[TW - 1] = ((word)1 << (ntimes % 64)) - 1;
  if (ntimes == 0) vi[0] = 0;
  memcpy(base, v, K * sizeof(long)); want_wf = wf; outv = out;
  if (wf) { for (int i = 0; i < K; i++) { assigned[i] = -1; forb[i] = 0; } wf_search(vi); }
  else lift_dfs(0, vi);
}

/* ------------------------------------------------------------------ survivors: canonical orbits */
static void canon_row(const long *r, uint16_t *out) {          /* lexicographic minimum of sorted unit images (classes) */
  uint16_t img[MAXK]; int first = 1;
  for (long u = 1; u <= P / 2; u++) {
    for (int i = 0; i < K; i++) img[i] = (uint16_t)cls(u * r[i]);
    qsort(img, K, sizeof img[0], cmp_u16);
    if (first || lexcmp(img, out, K) < 0) { memcpy(out, img, K * sizeof img[0]); first = 0; }
  }
}
typedef struct { uint16_t c[MAXK]; int used; } hent;
static hent *ht; static long hcap = 0, hn = 0;
static uint64_t hkey(const uint16_t *c) { uint64_t h = 1469598103934665603ULL; for (int i = 0; i < K; i++) { h ^= c[i]; h *= 1099511628211ULL; } return h; }
static int hinsert(const uint16_t *c) {
  if (2 * (hn + 1) > hcap) {
    long oc = hcap; hent *old = ht; hcap = hcap ? 2 * hcap : 1 << 16; ht = calloc(hcap, sizeof *ht); hn = 0;
    for (long i = 0; i < oc; i++) if (old[i].used) hinsert(old[i].c);
    free(old);
  }
  for (uint64_t h = hkey(c) % hcap;; h = (h + 1) % hcap) {
    if (!ht[h].used) { ht[h].used = 1; memcpy(ht[h].c, c, K * sizeof c[0]); hn++; return 1; }
    if (!lexcmp(ht[h].c, c, K)) return 0;
  }
}

/* ------------------------------------------------------------------ main */
static const int LEVELS[] = {2, 4, 8, 16, 32};
static long rows_total = 0, rows_f2 = 0, died_at[6] = {0}, surv_rows = 0;
static long lift_nodes_total = 0;
static vecs_t A, Bv;

static void process_row(const uint16_t *row) {
  long r[MAXK]; for (int i = 0; i < K; i++) r[i] = row[i];
  rows_total++;
  A.n = 0; vpush(&A, r);
  long l = 1;
  for (int s = 0; s < 5; s++) {
    int f = LEVELS[s] / (int)l; long known[1] = {l};
    Bv.n = 0;
    for (long j = 0; j < A.n; j++) { stage_nodes = 0; lift_one(A.v + j * K, l, f, known, 1, 0, &Bv); lift_nodes_total += stage_nodes; }
    vecs_t t = A; A = Bv; Bv = t; l = LEVELS[s];
    if (s == 0 && A.n) rows_f2++;
    if (A.n == 0) { died_at[s]++; return; }
  }
  surv_rows++;
  uint16_t c[MAXK]; canon_row(r, c); hinsert(c);
}

static void extras(const uint16_t *T, int s, int need, int from, uint16_t *row, int len) {
  if (need == 0) { uint16_t tmp[MAXK]; memcpy(tmp, row, len * sizeof tmp[0]); qsort(tmp, len, sizeof tmp[0], cmp_u16); process_row(tmp); return; }
  for (int x = from; x <= NCL; x++) { row[len] = (uint16_t)x; extras(T, s, need - 1, x, row, len + 1); }
}

int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "usage: lr <k> <p> [--no-neargcd] [--k1 K1]\n"); return 2; }
  K = atoi(argv[1]); P = atoi(argv[2]); K1 = K + 1;
  const char *term_in[64]; int nterm = 0;
  for (int i = 3; i < argc; i++) {
    if (!strcmp(argv[i], "--no-neargcd")) NEARGCD = 0;
    else if (!strcmp(argv[i], "--k1") && i + 1 < argc) K1 = atoi(argv[++i]);
    else if (!strcmp(argv[i], "--jobs") && i + 1 < argc) JOBS = atol(argv[++i]);
    else if (!strcmp(argv[i], "--job") && i + 1 < argc) JOB = atol(argv[++i]);
    else if (!strcmp(argv[i], "--split") && i + 1 < argc) SPLITD = atol(argv[++i]);
    else if (!strcmp(argv[i], "--survivors") && i + 1 < argc) SURV_OUT = argv[++i];
    else if (!strcmp(argv[i], "--no-bound")) BOUND = 0;
    else if (!strcmp(argv[i], "--terminal-from") && i + 1 < argc) { while (i + 1 < argc && nterm < 64) term_in[nterm++] = argv[++i]; }
    else { fprintf(stderr, "unknown option %s\n", argv[i]); return 2; }
  }
  if (K < 2 || K > MAXK || P < 5 || (P - 1) / 2 > MAXN) { fprintf(stderr, "out of range\n"); return 2; }
  for (long d = 2; d * d <= P; d++) if (P % d == 0) { fprintf(stderr, "p is not prime\n"); return 2; }
  NCL = (P - 1) / 2; M = (P - 1) / K1; nw = (NCL + 63) / 64;
  { long q = 2L * NCL - (long)K * M; Q = q > 0 ? (int)((q + K - 1) / K) : 0; }
  clock_t t0 = clock();
  for (int v = 1; v <= NCL; v++) for (int t = 1; t <= NCL; t++)
    if ((long)K1 * dist((long)t * v, P) < P) { cover[v][(t - 1) / 64] |= (word)1 << ((t - 1) % 64); who[t][(v - 1) / 64] |= (word)1 << ((v - 1) % 64); }
  /* stage 1 */
  word allowed[CW]; memset(allowed, 0, sizeof allowed);
  for (int v = 2; v <= NCL; v++) allowed[(v - 1) / 64] |= (word)1 << ((v - 1) % 64);
  double t1 = 0, t2 = 0;
  if (nterm == 0) {
    depth = 0; add_class(1); search(allowed); remove_class(1);
    t1 = (double)(clock() - t0) / CLOCKS_PER_SEC;
    /* rows: every minimal cover orbit, extended by every multiset of the remaining size */
    for (long i = 0; i < ncov; i++) { uint16_t row[MAXK]; memcpy(row, covs[i].c, covs[i].s * sizeof row[0]); extras(covs[i].c, covs[i].s, K - covs[i].s, 1, row, covs[i].s); }
    t2 = (double)(clock() - t0) / CLOCKS_PER_SEC;
  } else {
    /* the terminal stage on the union of the level-32 orbits written by --survivors runs (one orbit per line) */
    for (int f = 0; f < nterm; f++) {
      FILE *fp = fopen(term_in[f], "r"); if (!fp) { fprintf(stderr, "cannot read %s\n", term_in[f]); return 2; }
      uint16_t c[MAXK]; int v;
      for (;;) { int i; for (i = 0; i < K; i++) { if (fscanf(fp, "%d", &v) != 1) break; c[i] = (uint16_t)v; } if (i < K) break; hinsert(c); }
      fclose(fp);
    }
  }
  if (SURV_OUT) {
    FILE *fp = fopen(SURV_OUT, "w"); if (!fp) { fprintf(stderr, "cannot write %s\n", SURV_OUT); return 2; }
    for (long h = 0; h < hcap; h++) if (ht[h].used) { for (int i = 0; i < K; i++) fprintf(fp, "%s%d", i ? " " : "", ht[h].c[i]); fputc('\n', fp); }
    fclose(fp);
  }
  /* terminal level L = K1 (always k+1, never the --k1 override): its prime-power factors */
  long L = K + 1, fac[8]; int nf = 0;
  { long x = L; for (long d = 2; d <= x; d++) if (x % d == 0) { long pw = 1; while (x % d == 0) { x /= d; pw *= d; } fac[nf++] = pw; } }
  long orbits = 0, wf_total = 0, after_gcd_total = 0, after_ng_total = 0, open_orbits = 0, gcd_only_orbits = 0;
  printf("{\"k\":%d,\"p\":%d,\"K1\":%d,\"n\":%d,\"m\":%d,\"quota\":%d,\"neargcd\":%s,\"jobs\":%ld,\"job\":%ld,\"split\":%ld,\"mode\":\"%s\",", K, P, K1, NCL, M, Q, NEARGCD ? "true" : "false", JOBS, JOB, SPLITD, nterm ? "terminal" : SURV_OUT ? "stages-1-2" : "full");
  printf("\"stage1\":{\"nodes\":%ld,\"minimalCoverOrbitsBySize\":{", nodes);
  { int first = 1; for (int s = 1; s <= K; s++) if (covs_by_size[s]) { printf("%s\"%d\":%ld", first ? "" : ",", s, covs_by_size[s]); first = 0; } }
  printf("},\"seconds\":%.2f},", t1);
  printf("\"stage2\":{\"rows\":%ld,\"rowsWithF2\":%ld,\"diedAt\":{\"2\":%ld,\"4\":%ld,\"8\":%ld,\"16\":%ld,\"32\":%ld},\"survivingRows\":%ld,\"survivingOrbits\":%ld,\"liftNodes\":%ld,\"seconds\":%.2f},",
         rows_total, rows_f2, died_at[0], died_at[1], died_at[2], died_at[3], died_at[4], surv_rows, hn, lift_nodes_total, t2 - t1);
  if (SURV_OUT) { printf("\"cpuSeconds\":%.2f}\n", (double)(clock() - t0) / CLOCKS_PER_SEC); return 0; }
  printf("\"terminal\":{\"level\":%ld,\"factors\":[", L); for (int j = 0; j < nf; j++) printf("%s%ld", j ? "," : "", fac[j]); printf("],\"orbits\":[");
  int printed = 0;
  for (long h = 0; h < hcap; h++) if (ht[h].used) {
    long r[MAXK]; for (int i = 0; i < K; i++) r[i] = ht[h].c[i];
    orbits++;
    /* witness-free lifts at each factor level, from level 1 */
    vecs_t W[8]; memset(W, 0, sizeof W); long wcount[8];
    for (int j = 0; j < nf; j++) { long known[1] = {1}; lift_one(r, 1, (int)fac[j], known, 1, 1, &W[j]); wcount[j] = W[j].n; }
    /* combine by the Chinese remainder theorem and test at level L on the times new to every factor */
    long known[9]; known[0] = 1; for (int j = 0; j < nf; j++) known[j + 1] = fac[j];
    long Nl = L * P; gcache_t *g15 = cache_for(Nl, L, known, nf + 1);   /* the times new to every factor level, cached */
    long wf = 0, ag = 0, ang = 0; long idx[8] = {0};
    long total = 1; for (int j = 0; j < nf; j++) total *= W[j].n;
    for (long comb = 0; comb < total; comb++) {
      long x = comb; for (int j = 0; j < nf; j++) { idx[j] = x % W[j].n; x /= W[j].n; }
      long w[MAXK];
      for (int i = 0; i < K; i++) {
        long a = 0;   /* digit modulo L from the digits modulo each factor (CRT) */
        for (int j = 0; j < nf; j++) {
          long dj = (W[j].v[idx[j] * K + i] - r[i]) / P;      /* digit at factor level fac[j] */
          long Mj = L / fac[j];
          a = (a + dj * Mj % L * modinv(Mj % fac[j], fac[j])) % L;
        }
        w[i] = r[i] + a * P;
      }
      int wit = 0;   /* a witness: a time good for every coordinate — the AND of the coordinates' good-time bitsets */
      { word acc[g15->tw]; memcpy(acc, good_of(g15, w[0] % Nl), g15->tw * sizeof(word));
        for (int i = 1; i < K; i++) { const word *gi = good_of(g15, w[i] % Nl); for (int x = 0; x < g15->tw; x++) acc[x] &= gi[x]; }
        for (int x = 0; x < g15->tw; x++) if (acc[x]) { wit = 1; break; } }
      if (wit) continue;
      wf++;
      if (gcd_proper(w, L)) continue;
      ag++;
      int handled = 0;
      if (NEARGCD) for (long d = 2; d <= L && !handled; d++) {
        int prime = 1; for (long e = 2; e * e <= d; e++) if (d % e == 0) prime = 0;
        if (!prime || L % d) continue;
        int e = 0; for (int i = 0; i < K; i++) if (w[i] % d) e++;
        long md = (2 * d + K1 - 1) / K1;
        if (e >= 2 && e * md < d) handled = 1;
      }
      if (!handled) ang++;
    }
    for (int j = 0; j < nf; j++) free(W[j].v);
    wf_total += wf; after_gcd_total += ag; after_ng_total += ang;
    if (ang) open_orbits++;
    if (ag == 0) gcd_only_orbits++;
    if (printed < 50) {
      printf("%s{\"row\":[", printed ? "," : ""); for (int i = 0; i < K; i++) printf("%s%ld", i ? "," : "", r[i]);
      printf("],\"factorWitnessFree\":["); for (int j = 0; j < nf; j++) printf("%s%ld", j ? "," : "", wcount[j]);
      printf("],\"witnessFree\":%ld,\"improperAfterGcd\":%ld,\"improperAfterNearGcd\":%ld}", wf, ag, ang); printed++;
    }
  }
  double t3 = (double)(clock() - t0) / CLOCKS_PER_SEC;
  printf("],\"orbitsListedMax\":50,\"orbitCount\":%ld,\"witnessFree\":%ld,\"improperAfterGcd\":%ld,\"improperAfterNearGcd\":%ld,\"orbitsClosedByGcdAlone\":%ld,\"openOrbits\":%ld,\"seconds\":%.2f},",
         orbits, wf_total, after_gcd_total, after_ng_total, gcd_only_orbits, open_orbits, t3 - t2);
  printf("\"verdict\":\"%s\",\"jEmpty\":%s,\"cpuSeconds\":%.2f}\n", open_orbits ? "OPEN" : "CLOSED", (after_gcd_total == 0) ? "true" : "false", t3);
  return 0;
}
