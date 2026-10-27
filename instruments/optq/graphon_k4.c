/* graphon_k4.c — the FIRST implementation here of the registry's C_89 (K4) Ramsey-multiplicity graphon density
   (J. SK, teorth/optimizationproblems #255, constants/89a.md, [SK2026]): the exact numerator of the monochromatic-K4
   density of a rational step graphon with equal blocks, modulo primes, for EVERY block (no symmetry assumed).
   Written 2026-10-27 by an AI agent from the registry's definition and the data schema; no code shared with the
   claimant's evaluators (exact_eval.py, float_eval.py, refine.py: pinned as text, never run) or with
   instruments/optq/graphon-k4-second.js, the second implementation. No BLAS: the product is this file's own kernel.

   Object (schema rational-step-graphon-v1): m blocks of equal measure, red value R_ij/D on the block pair (i,j), the
   diagonal included; blue value (D - R_ij)/D. Definition (89a.md): value = t(K4,W) + t(K4,1-W),
     t(K4,W) = m^-4 sum over ORDERED 4-tuples (i,j,k,l) of blocks of W_ij W_ik W_il W_jk W_jl W_kl,
   so value = (N(R) + N(D-R)) / (m^4 D^6), N(X) = sum_i f_X(i), with, for x = X_i (row i) and S = {j : x_j != 0},
     f_X(i) = sum_{j,k,l in S} x_j x_k x_l X_jk X_jl X_kl = sum_{j,k in S} Y_jk Q_jk,
     Y_jk = x_j x_k X_jk,   Q = X_SS diag(x_S) X_SS   (symmetric, so the sum is the diagonal plus twice the upper part).
   Modulo p < 2^21: Q_jk = sum_l (X_jl x_l mod p) X_lk is accumulated exactly in IEEE doubles (every term < 2^42 and
   the accumulator is reduced at least every 1024 terms, so it stays below 2^53), then reduced; Y and the pairing are
   done in 64-bit integers. This program prints f_red(i) mod p and f_blue(i) mod p for every block and prime; the
   driver (tools/replay-graphon-k4.js) sums them, lifts by the Chinese remainder theorem and checks one extra prime.

   build:  cc -O3 -march=native -ffp-contract=fast -pthread -o graphon_k4 graphon_k4.c        (gcc or clang)
   usage:  gunzip -c X.json.gz | ./graphon_k4 [--threads=T] [--nprimes=K | --primes=p,q,..] [--blocks=a:b]
                                              [--done=file] [--perturb=i,j,delta]
           ./graphon_k4 --selftest           the kernel against a brute force over all m^4 tuples, small m
   output: a header line "M m D sum fingerprint", "P p1 p2 ..", then one line per finished block
           "B i r_1 b_1 r_2 b_2 ..." (red and blue residues per prime), flushed as each block finishes, "T seconds".
   MIT */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <math.h>
#include <pthread.h>
#include <time.h>
#include <unistd.h>

typedef double v4 __attribute__((vector_size(32)));
#define MR 4
#define NR 8
static int KC = 256;            /* l-chunk of one micro-kernel call */
static int RED_EVERY = 1024;    /* the accumulators are reduced mod p at least this often (in l) */

static void die(const char *m) { fprintf(stderr, "graphon_k4: %s\n", m); exit(2); }
static double *dalloc(size_t n) { void *p = NULL; if (posix_memalign(&p, 64, n * sizeof(double) + 64)) die("out of memory"); return p; }

/* ---- the JSON reader: the one schema, from stdin ------------------------------------------------------------- */
static char *buf; static size_t blen, bpos;
static void ws(void) { while (bpos < blen && (buf[bpos] == ' ' || buf[bpos] == '\n' || buf[bpos] == '\r' || buf[bpos] == '\t')) bpos++; }
static int peek(void) { ws(); return bpos < blen ? buf[bpos] : -1; }
static void expect(char c) { if (peek() != c) { fprintf(stderr, "at %zu: expected '%c'\n", bpos, c); die("bad JSON"); } bpos++; }
static char *str(void) {                                         /* a JSON string without escapes (the schema has none) */
  expect('"'); size_t s = bpos; while (bpos < blen && buf[bpos] != '"') { if (buf[bpos] == '\\') die("escape in a string"); bpos++; }
  if (bpos >= blen) die("unterminated string"); char *o = strndup(buf + s, bpos - s); bpos++; return o;
}
static int64_t integer(void) {
  ws(); int neg = 0; if (buf[bpos] == '-') { neg = 1; bpos++; }
  if (bpos >= blen || buf[bpos] < '0' || buf[bpos] > '9') die("expected an integer");
  int64_t v = 0; while (bpos < blen && buf[bpos] >= '0' && buf[bpos] <= '9') { if (v > (INT64_MAX - 9) / 10) die("integer overflow"); v = v * 10 + (buf[bpos++] - '0'); }
  if (bpos < blen && (buf[bpos] == '.' || buf[bpos] == 'e' || buf[bpos] == 'E')) die("a non-integer number where an integer is required");
  return neg ? -v : v;
}
static void skip(void) {
  int c = peek();
  if (c == '"') { free(str()); return; }
  if (c == '{' || c == '[') { char close = c == '{' ? '}' : ']'; bpos++; if (peek() == close) { bpos++; return; }
    for (;;) { if (c == '{') { free(str()); expect(':'); } skip(); if (peek() == ',') { bpos++; continue; } expect(close); return; } }
  while (bpos < blen && buf[bpos] != ',' && buf[bpos] != '}' && buf[bpos] != ']') bpos++;
}
static int m = -1; static int64_t D = -1; static uint32_t *R;      /* R: m*m red numerators */
static void read_input(void) {
  size_t cap = 1 << 24; buf = malloc(cap); blen = 0; size_t r;
  while ((r = fread(buf + blen, 1, cap - blen, stdin)) > 0) { blen += r; if (blen == cap) { cap *= 2; buf = realloc(buf, cap); } }
  bpos = 0; expect('{'); int have_schema = 0, have_w = 0; char *w0 = NULL; int nw = 0, wsame = 1;
  int64_t *vals = NULL; size_t nv = 0, vcap = 0; int rows = 0, rowlen = -1;
  for (;;) {
    char *k = str(); expect(':');
    if (!strcmp(k, "schema")) { char *s = str(); if (strcmp(s, "rational-step-graphon-v1")) die("an unexpected schema"); have_schema = 1; free(s); }
    else if (!strcmp(k, "edge_probability_denominator")) D = integer();
    else if (!strcmp(k, "block_weights")) {          /* compared as their literal tokens: equal measure is all we use */
      expect('['); have_w = 1;
      for (;;) { ws(); size_t s = bpos; skip(); char *t = strndup(buf + s, bpos - s); while (strlen(t) && (t[strlen(t)-1] == ' ' || t[strlen(t)-1] == '\n')) t[strlen(t)-1] = 0;
        if (!w0) w0 = t; else { if (strcmp(w0, t)) wsame = 0; free(t); } nw++; if (peek() == ',') { bpos++; continue; } expect(']'); break; }
    } else if (!strcmp(k, "red_probability_numerators")) {
      expect('[');
      for (;;) { expect('['); int len = 0;
        for (;;) { int64_t v = integer(); if (nv == vcap) { vcap = vcap ? vcap * 2 : 1 << 20; vals = realloc(vals, vcap * sizeof *vals); } vals[nv++] = v; len++; if (peek() == ',') { bpos++; continue; } expect(']'); break; }
        if (rowlen < 0) rowlen = len; else if (len != rowlen) die("rows of different lengths");
        rows++; if (peek() == ',') { bpos++; continue; } expect(']'); break; }
    } else skip();
    free(k); if (peek() == ',') { bpos++; continue; } expect('}'); break;
  }
  if (!have_schema || !have_w || D <= 0 || rows <= 0) die("a field is missing");
  if (rows != rowlen) die("R is not square");
  if (nw != rows || !wsame) die("the blocks are not of equal measure");
  if (D >= (1LL << 21)) die("D >= 2^21 is not handled (entries must stay below every prime)");
  m = rows; R = malloc((size_t)m * m * sizeof *R);
  for (size_t t = 0; t < (size_t)m * m; t++) { if (vals[t] < 0 || vals[t] > D) die("an entry is outside [0, D]"); R[t] = (uint32_t)vals[t]; }
  for (int i = 0; i < m; i++) for (int j = 0; j < i; j++) if (R[(size_t)i * m + j] != R[(size_t)j * m + i]) die("R is not symmetric");
  free(vals); free(buf);
}

/* ---- primes ----------------------------------------------------------------------------------------------- */
static int isprime(uint64_t n) { if (n < 2) return 0; for (uint64_t q = 2; q * q <= n; q++) if (n % q == 0) return 0; return 1; }
static int np = 0; static uint64_t P[64];

/* ---- the kernel ----------------------------------------------------------------------------------------- */
/* C[MR x NR] += sum_{l < kc} a[l*MR + r] * b[l*NR + c]  (a, b packed; the doubles are exact integers) */
static inline void micro(const double *restrict a, const double *restrict b, int kc, double *restrict c) {
  v4 c00 = {0}, c01 = {0}, c10 = {0}, c11 = {0}, c20 = {0}, c21 = {0}, c30 = {0}, c31 = {0};
  for (int l = 0; l < kc; l++) {
    v4 b0, b1; memcpy(&b0, b + l * NR, 32); memcpy(&b1, b + l * NR + 4, 32);
    const double *al = a + l * MR;
    v4 a0 = {al[0], al[0], al[0], al[0]}, a1 = {al[1], al[1], al[1], al[1]}, a2 = {al[2], al[2], al[2], al[2]}, a3 = {al[3], al[3], al[3], al[3]};
    c00 += a0 * b0; c01 += a0 * b1; c10 += a1 * b0; c11 += a1 * b1;
    c20 += a2 * b0; c21 += a2 * b1; c30 += a3 * b0; c31 += a3 * b1;
  }
  v4 t[8] = {c00, c01, c10, c11, c20, c21, c30, c31};
  for (int r = 0; r < MR; r++) for (int q = 0; q < 2; q++) for (int e = 0; e < 4; e++) c[r * NR + q * 4 + e] += t[r * 2 + q][e];
}

typedef struct { double *A, *B, *C; uint32_t *xs; int *S; uint64_t *xm; } work_t;

/* f_X(i) mod p for every prime, X = R (blue = 0) or D - R (blue = 1); out[k] for prime k */
static void block_value(int i, int blue, const uint32_t *Rm, work_t *w, uint64_t *out) {
  const uint32_t *Ri = Rm + (size_t)i * m;
  int n = 0;
  for (int j = 0; j < m; j++) { uint32_t v = blue ? (uint32_t)(D - Ri[j]) : Ri[j]; if (v) { w->S[n] = j; w->xs[n] = v; n++; } }
  if (n == 0) { for (int k = 0; k < np; k++) out[k] = 0; return; }
  int nP = (n + MR - 1) / MR, nQ = (n + NR - 1) / NR, nl = n;          /* row panels, column panels */
  /* B: X_SS packed in column panels of NR, layout [panel][l][c]; identical for every prime (entries <= D < p) */
  for (int qp = 0; qp < nQ; qp++) for (int l = 0; l < nl; l++) {
    const uint32_t *Rl = Rm + (size_t)w->S[l] * m;
    for (int c = 0; c < NR; c++) { int k = qp * NR + c; double v = 0; if (k < n) { uint32_t r = Rl[w->S[k]]; v = blue ? (double)(D - r) : (double)r; } w->B[((size_t)qp * nl + l) * NR + c] = v; }
  }
  for (int kp = 0; kp < np; kp++) {
    const uint64_t p = P[kp];
    /* A: A_jl = X_jl * x_l mod p, row panels of MR, layout [panel][l][r] */
    for (int jp = 0; jp < nP; jp++) for (int r = 0; r < MR; r++) {
      int j = jp * MR + r;
      if (j >= n) { for (int l = 0; l < nl; l++) w->A[((size_t)jp * nl + l) * MR + r] = 0; continue; }
      const uint32_t *Rj = Rm + (size_t)w->S[j] * m;
      for (int l = 0; l < nl; l++) { uint64_t xjl = blue ? (uint64_t)(D - Rj[w->S[l]]) : Rj[w->S[l]]; w->A[((size_t)jp * nl + l) * MR + r] = (double)((xjl * w->xs[l]) % p); }
    }
    uint64_t acc = 0;
    const double pd = (double)p;
    for (int jp = 0; jp < nP; jp++) {
      int j0 = jp * MR;
      for (int qp = j0 / NR; qp < nQ; qp++) {                         /* the upper part: column panels reaching k >= j0 */
        int k0 = qp * NR;
        double c[MR * NR]; memset(c, 0, sizeof c);
        int since = 0;
        for (int l0 = 0; l0 < nl; l0 += KC) {
          int kc = nl - l0 < KC ? nl - l0 : KC;
          micro(w->A + ((size_t)jp * nl + l0) * MR, w->B + ((size_t)qp * nl + l0) * NR, kc, c);
          since += kc;
          if (since >= RED_EVERY) { for (int t = 0; t < MR * NR; t++) c[t] = fmod(c[t], pd); since = 0; }
        }
        for (int r = 0; r < MR; r++) {
          int j = j0 + r; if (j >= n) break;
          const uint32_t *Rj = Rm + (size_t)w->S[j] * m;
          for (int cc = 0; cc < NR; cc++) {
            int k = k0 + cc; if (k >= n || k < j) continue;
            double qv = c[r * NR + cc];
            if (!(qv >= 0 && qv < 9007199254740992.0)) die("an accumulator left the exact range");
            uint64_t q = (uint64_t)qv % p;
            uint64_t xjk = blue ? (uint64_t)(D - Rj[w->S[k]]) : Rj[w->S[k]];
            uint64_t y = ((((uint64_t)w->xs[j] * w->xs[k]) % p) * xjk) % p;
            uint64_t term = (y * q) % p;
            acc += (k == j) ? term : 2 * term;
            if (acc >= (1ULL << 62)) acc %= p;
          }
        }
      }
    }
    out[kp] = acc % p;
  }
}

/* ---- threads -------------------------------------------------------------------------------------------- */
static int lo_b = 0, hi_b = -1; static char *done_mark; static int next_b; static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static const uint32_t *RUN_R;
static void *worker(void *arg) {
  (void)arg; work_t w; size_t cap = (size_t)(m + NR) * (m + NR);
  w.A = dalloc(cap); w.B = dalloc(cap); w.C = NULL;
  w.xs = malloc(m * sizeof(uint32_t)); w.S = malloc(m * sizeof(int));
  if (!w.A || !w.B) die("out of memory");
  uint64_t red[64], blu[64];
  for (;;) {
    pthread_mutex_lock(&mu); int i = -1; while (next_b < hi_b) { int c = next_b++; if (!done_mark[c]) { i = c; break; } } pthread_mutex_unlock(&mu);
    if (i < 0) break;
    block_value(i, 0, RUN_R, &w, red); block_value(i, 1, RUN_R, &w, blu);
    pthread_mutex_lock(&mu);
    printf("B %d", i); for (int k = 0; k < np; k++) printf(" %llu %llu", (unsigned long long)red[k], (unsigned long long)blu[k]); printf("\n"); fflush(stdout);
    pthread_mutex_unlock(&mu);
  }
  free(w.A); free(w.B); free(w.xs); free(w.S); return NULL;
}

/* ---- the selftest: brute force over all ordered 4-tuples, modulo each prime ------------------------------- */
static uint64_t brute(const uint32_t *Rm, int mm, int64_t DD, int blue, uint64_t p) {
  uint64_t t = 0;
  #define X(a, b) ((uint64_t)(blue ? (uint64_t)(DD - Rm[(size_t)(a) * mm + (b)]) : Rm[(size_t)(a) * mm + (b)]) % p)
  for (int i = 0; i < mm; i++) for (int j = 0; j < mm; j++) for (int k = 0; k < mm; k++) for (int l = 0; l < mm; l++) {
    uint64_t v = X(i, j) * X(i, k) % p; v = v * X(i, l) % p; v = v * X(j, k) % p; v = v * X(j, l) % p; v = v * X(k, l) % p; t = (t + v) % p;
  }
  return t;
}
static int selftest(void) {
  uint64_t seed = 89; int fails = 0;
  #define RND() (seed = seed * 6364136223846793005ULL + 1442695040888963407ULL, (seed >> 33))
  int ms[] = {1, 3, 5, 9, 13, 21, 34};
  np = 3; P[0] = 2097143; P[1] = 2097133; P[2] = 1000003;
  for (int trial = 0; trial < 14; trial++) {
    int mm = ms[trial % 7]; int64_t DD = trial < 7 ? 7 : (1 << 20);
    uint32_t *Rm = malloc((size_t)mm * mm * sizeof *Rm);
    for (int i = 0; i < mm; i++) for (int j = i; j < mm; j++) { uint64_t u = RND() % 4; uint32_t v = u == 0 ? 0 : u == 1 ? (uint32_t)DD : (uint32_t)(RND() % (DD + 1)); Rm[(size_t)i * mm + j] = Rm[(size_t)j * mm + i] = v; }
    int save_m = m; int64_t save_D = D; m = mm; D = DD;
    KC = trial % 2 ? 3 : 256; RED_EVERY = trial % 2 ? 5 : 1024;         /* odd trials exercise the chunk and reduction boundaries */
    work_t w; size_t cap = (size_t)(m + NR) * (m + NR); w.A = dalloc(cap); w.B = dalloc(cap); w.xs = malloc(m * 4); w.S = malloc(m * sizeof(int));
    for (int blue = 0; blue < 2; blue++) {
      uint64_t tot[3] = {0, 0, 0}, o[64];
      for (int i = 0; i < m; i++) { block_value(i, blue, Rm, &w, o); for (int k = 0; k < np; k++) tot[k] = (tot[k] + o[k]) % P[k]; }
      for (int k = 0; k < np; k++) { uint64_t b = brute(Rm, mm, DD, blue, P[k]); if (b != tot[k]) { fails++; fprintf(stderr, "SELFTEST FAILED m=%d D=%lld blue=%d p=%llu: kernel %llu brute %llu\n", mm, (long long)DD, blue, (unsigned long long)P[k], (unsigned long long)tot[k], (unsigned long long)b); } }
    }
    free(w.A); free(w.B); free(w.xs); free(w.S); free(Rm); m = save_m; D = save_D;
  }
  KC = 256; RED_EVERY = 1024;
  printf("graphon_k4 selftest: %s (14 random step graphons, m = 1..34, D = 7 and 2^20, both colours, 3 primes; chunk and reduction boundaries exercised)\n", fails ? "FAILED" : "kernel = brute force over all ordered 4-tuples");
  return fails ? 1 : 0;
}

int main(int argc, char **argv) {
  int threads = (int)sysconf(_SC_NPROCESSORS_ONLN), nprimes = 9; const char *done_file = NULL, *primes_arg = NULL; int pi = -1, pj = -1; long pdelta = 0;
  for (int a = 1; a < argc; a++) {
    if (!strcmp(argv[a], "--selftest")) return selftest();
    else if (!strncmp(argv[a], "--threads=", 10)) threads = atoi(argv[a] + 10);
    else if (!strncmp(argv[a], "--nprimes=", 10)) nprimes = atoi(argv[a] + 10);
    else if (!strncmp(argv[a], "--primes=", 9)) primes_arg = argv[a] + 9;
    else if (!strncmp(argv[a], "--blocks=", 9)) { if (sscanf(argv[a] + 9, "%d:%d", &lo_b, &hi_b) != 2) die("--blocks=a:b"); }
    else if (!strncmp(argv[a], "--done=", 7)) done_file = argv[a] + 7;
    else if (!strncmp(argv[a], "--perturb=", 10)) { if (sscanf(argv[a] + 10, "%d,%d,%ld", &pi, &pj, &pdelta) != 3) die("--perturb=i,j,delta"); }
    else die("unknown argument");
  }
  if (primes_arg) { const char *s = primes_arg; while (*s) { P[np++] = strtoull(s, (char **)&s, 10); if (*s == ',') s++; else if (*s) die("--primes"); } }
  else for (uint64_t q = (1ULL << 21) - 1; np < nprimes; q--) if (isprime(q)) P[np++] = q;
  for (int k = 0; k < np; k++) if (!isprime(P[k]) || P[k] >= (1ULL << 21) || P[k] < 3) die("each prime must be a prime below 2^21");
  read_input();
  for (int k = 0; k < np; k++) if ((uint64_t)D >= P[k]) die("D must be below every prime");
  if (pi >= 0) { if (pi >= m || pj >= m) die("--perturb outside R"); int64_t v = (int64_t)R[(size_t)pi * m + pj] + pdelta; if (v < 0 || v > D) die("--perturb leaves [0, D]"); R[(size_t)pi * m + pj] = (uint32_t)v; R[(size_t)pj * m + pi] = (uint32_t)v; }
  if (hi_b < 0) hi_b = m; if (lo_b < 0 || hi_b > m || lo_b > hi_b) die("--blocks outside [0, m]");
  /* the fingerprint the driver re-computes from the JSON: sum R_ij and sum R_ij * (i*m + j + 1) mod 2^64 */
  uint64_t sum = 0, fp = 0; for (size_t t = 0; t < (size_t)m * m; t++) { sum += R[t]; fp += (uint64_t)R[t] * (uint64_t)(t + 1); }
  printf("M %d %lld %llu %llu\n", m, (long long)D, (unsigned long long)sum, (unsigned long long)fp);
  printf("P"); for (int k = 0; k < np; k++) printf(" %llu", (unsigned long long)P[k]); printf("\n"); fflush(stdout);
  done_mark = calloc(m, 1);
  if (done_file) { FILE *f = fopen(done_file, "r"); if (f) { char line[1 << 14]; while (fgets(line, sizeof line, f)) { int b; if (line[0] == 'B' && sscanf(line + 1, "%d", &b) == 1 && b >= 0 && b < m) done_mark[b] = 1; } fclose(f); } }
  next_b = lo_b; RUN_R = R;
  struct timespec t0, t1; clock_gettime(CLOCK_MONOTONIC, &t0);
  if (threads < 1) threads = 1;
  pthread_t *th = malloc(threads * sizeof *th);
  for (int t = 0; t < threads; t++) pthread_create(&th[t], NULL, worker, NULL);
  for (int t = 0; t < threads; t++) pthread_join(th[t], NULL);
  clock_gettime(CLOCK_MONOTONIC, &t1);
  printf("T %.1f\n", (t1.tv_sec - t0.tv_sec) + 1e-9 * (t1.tv_nsec - t0.tv_nsec));
  return 0;
}
