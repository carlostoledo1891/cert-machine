/* mh.c — Lueker's automaton M_h for the upper bound on the binary Chvátal–Sankoff constant:
 * build the automaton, power-iterate to a witness vector, certify λ with directed rounding.
 *
 * Written from the paper alone (G. S. Lueker, Improved bounds on the average length of
 * longest common subsequences, J. ACM 56(3) 2009; extended version of 2008-12-18, §3.2,
 * Figure 8 = the journal's Figure 7). mh.py is the reference this file is held to: same
 * state packing, same input order, same orbit representative; `dump` and `sample` print
 * rows the reference re-derives. Nothing here was read from anyone's code.
 *
 * State (x, y, dx, dy), each h bits, packed as x<<3h | y<<2h | dx<<h | dy with the first
 * (oldest) entry of each most significant. One representative per complement orbit (x̄, ȳ,
 * dx, dy ~ x, y, dx, dy): the smaller key. Inputs: for c in {0,1}: (c̄^a c / c) for
 * a = 0..h−1, then (c / c̄^b c) for b = 1..h−1 — 4h−2 in all, in that order.
 *
 * Table file (DIR/table_hH.bin), one row per state in index order: a uint64 mask whose bit p
 * is set when input p is accepted, then the accepted successors' indices as uint32 in input
 * order. Keys file (DIR/keys_hH.bin): the packed state key, uint64, in index order.
 *
 * Build (macOS):  clang -O2 -ffp-model=strict -o mh mh.c -lpthread -lm
 * Build (Linux):  gcc -O2 -frounding-math -fno-fast-math -o mh mh.c -lpthread -lm
 *
 *   mh build H DIR [THREADS] [EXPECTED]  → keys and table; prints states, transitions, rejected. EXPECTED, an
 *                                     estimate of the state count, only pre-sizes the hash map so that a large
 *                                     build never rehashes or reallocates; it changes nothing that is computed.
 *   mh eigen H DIR Z ITERS TOL [T]  → DIR/v_hH.bin (double per state), power iteration
 *   mh certify H DIR Z VFILE [T]    → λ_cert (FE_UPWARD), λ_free (nearest + inflation),
 *                                     the min ratio (FE_DOWNWARD): a lower bound on ρ(A_z)
 *   mh dump H DIR                   → every row "key succkey…" (−1 = ∅) sorted, for mh.py
 *   mh sample H DIR K SEED          → K random states' rows, re-derived by δ here, for mh.py
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <math.h>
#include <fenv.h>
#include <pthread.h>
#include <time.h>
#include <sys/types.h>

#pragma STDC FENV_ACCESS ON

#define REJECT UINT64_MAX
#define MAXT 256

static int H, NIN;
typedef struct { uint32_t top, bot; int tl, bl, a; } input_t;
static input_t IN[64];

static void die(const char *m) { fprintf(stderr, "mh: %s\n", m); exit(2); }
static double now(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec + 1e-9 * t.tv_nsec; }

static void make_inputs(int h) {
    NIN = 0;
    for (int c = 0; c <= 1; c++) {
        int pad = 1 - c;
        for (int a = 0; a < h; a++) {               /* (pad^a c / c) */
            uint32_t top = 0; for (int k = 0; k < a; k++) top = (top << 1) | (uint32_t)pad; top = (top << 1) | (uint32_t)c;
            IN[NIN++] = (input_t){ top, (uint32_t)c, a + 1, 1, a };
        }
        for (int b = 1; b < h; b++) {               /* (c / pad^b c) */
            uint32_t bot = 0; for (int k = 0; k < b; k++) bot = (bot << 1) | (uint32_t)pad; bot = (bot << 1) | (uint32_t)c;
            IN[NIN++] = (input_t){ (uint32_t)c, bot, 1, b + 1, b };
        }
    }
    if (NIN != 4 * h - 2) die("input count");
}

/* Figure 8, line for line. */
static uint64_t delta(uint64_t q, const input_t *p) {
    const int h = H;
    const uint32_t mask = (1u << h) - 1;
    uint32_t x = (uint32_t)(q >> (3 * h)) & mask, y = (uint32_t)(q >> (2 * h)) & mask;
    uint32_t dx = (uint32_t)(q >> h) & mask, dy = (uint32_t)q & mask;
    uint32_t a = (x << p->tl) | p->top; int n = h + p->tl;
    uint32_t b = (y << p->bl) | p->bot; int m = h + p->bl;
    int lcs[2 * 16 + 1][2 * 16 + 1];
    lcs[h][h] = h;
    for (int i = h; i >= 1; i--) lcs[i - 1][h] = lcs[i][h] - (int)((dx >> (h - i)) & 1);
    for (int j = h; j >= 1; j--) lcs[h][j - 1] = lcs[h][j] - (int)((dy >> (h - j)) & 1);
    for (int i = 0; i <= n; i++)
        for (int j = 0; j <= m; j++)
            if (i > h || j > h) {
                if (i == 0) lcs[i][j] = lcs[i][j - 1];
                else if (j == 0) lcs[i][j] = lcs[i - 1][j];
                else if (((a >> (n - i)) & 1) == ((b >> (m - j)) & 1)) lcs[i][j] = lcs[i - 1][j - 1] + 1;
                else { int u = lcs[i][j - 1], w = lcs[i - 1][j]; lcs[i][j] = u > w ? u : w; }
            }
    int i = n, j = m;
    while (i >= h && j >= h) {
        if (lcs[i][j] == lcs[i - 1][j]) i--;
        else if (lcs[i][j] == lcs[i][j - 1]) j--;
        else { i--; j--; }
        if (i == h && j == h) {
            uint32_t ndx = 0, ndy = 0;
            for (int k = 0; k < h; k++) { int d = lcs[n - h + k + 1][m] - lcs[n - h + k][m]; if (d < 0 || d > 1) die("difference outside {0,1}"); ndx = (ndx << 1) | (uint32_t)d; }
            for (int k = 0; k < h; k++) { int d = lcs[n][m - h + k + 1] - lcs[n][m - h + k]; if (d < 0 || d > 1) die("difference outside {0,1}"); ndy = (ndy << 1) | (uint32_t)d; }
            return ((uint64_t)(a & mask) << (3 * h)) | ((uint64_t)(b & mask) << (2 * h)) | ((uint64_t)ndx << h) | ndy;
        }
    }
    return REJECT;
}

static uint64_t canon(uint64_t k) {
    const uint64_t mask = (1ull << H) - 1;
    uint64_t c = k ^ ((mask << (3 * H)) | (mask << (2 * H)));
    return c < k ? c : k;
}

/* ---- hash map key → index: slots hold index+1, keys live in the index-ordered array ---- */
static uint64_t *KEYS; static uint64_t NKEYS, CAPKEYS;
static uint32_t *SLOT; static uint64_t NSLOT;
static inline uint64_t mix(uint64_t k) { k ^= k >> 31; k *= 0x9E3779B97F4A7C15ull; k ^= k >> 29; k *= 0xBF58476D1CE4E5B9ull; k ^= k >> 32; return k; }
static void rehash(uint64_t n) {
    free(SLOT); NSLOT = n; SLOT = calloc(NSLOT, sizeof(uint32_t)); if (!SLOT) die("slots");
    for (uint64_t i = 0; i < NKEYS; i++) { uint64_t s = mix(KEYS[i]) & (NSLOT - 1); while (SLOT[s]) s = (s + 1) & (NSLOT - 1); SLOT[s] = (uint32_t)(i + 1); }
}
static uint32_t insert_or_get(uint64_t k) {
    uint64_t s = mix(k) & (NSLOT - 1);
    for (;;) { uint32_t v = SLOT[s]; if (!v) break; if (KEYS[v - 1] == k) return v - 1; s = (s + 1) & (NSLOT - 1); }
    if (NKEYS == CAPKEYS) { CAPKEYS *= 2; KEYS = realloc(KEYS, CAPKEYS * sizeof(uint64_t)); if (!KEYS) die("keys"); }
    KEYS[NKEYS] = k; SLOT[s] = (uint32_t)(NKEYS + 1); NKEYS++;
    if (NKEYS * 2 > NSLOT) rehash(NSLOT * 2);
    return (uint32_t)(NKEYS - 1);
}

/* ---- parallel successor computation over a chunk of states ---- */
typedef struct { uint64_t lo, hi; uint64_t *buf; } job_t;
static void *succ_job(void *arg) {
    job_t *j = arg;
    for (uint64_t s = j->lo; s < j->hi; s++) {
        uint64_t q = KEYS[s];
        for (int p = 0; p < NIN; p++) { uint64_t r = delta(q, &IN[p]); j->buf[(s - j->lo) * NIN + p] = r == REJECT ? REJECT : canon(r); }
    }
    return NULL;
}

static void cmd_build(int h, const char *dir, int threads, uint64_t expected) {
    char fn[512]; double t0 = now();
    CAPKEYS = expected ? expected + expected / 16 + 1024 : 1 << 20; KEYS = malloc(CAPKEYS * sizeof(uint64_t)); if (!KEYS) die("keys"); NKEYS = 0;
    uint64_t slots = 1 << 21; while (slots < 2 * expected + 2) slots <<= 1; rehash(slots);
    uint64_t mask = (1ull << h) - 1;
    uint64_t q0 = (mask << h) | mask;                /* x = y = 0^h, dx = dy = 1^h */
    if (canon(q0) != q0) die("start state not canonical");
    insert_or_get(q0);
    snprintf(fn, sizeof fn, "%s/table_h%d.bin", dir, h); FILE *ft = fopen(fn, "wb"); if (!ft) die("table file");
    const uint64_t CH = 1u << 18;
    uint64_t *buf = malloc(CH * NIN * sizeof(uint64_t)); uint32_t *row = malloc(CH * (NIN + 2) * sizeof(uint32_t));
    if (!buf || !row) die("buffers");
    pthread_t th[MAXT]; job_t jobs[MAXT];
    uint64_t head = 0, rejected = 0; int report = 0;
    while (head < NKEYS) {
        uint64_t hi = head + CH < NKEYS ? head + CH : NKEYS, n = hi - head;
        int T = threads; if ((uint64_t)T > n) T = (int)n;
        for (int t = 0; t < T; t++) { jobs[t].lo = head + n * t / T; jobs[t].hi = head + n * (t + 1) / T; jobs[t].buf = buf + (jobs[t].lo - head) * NIN; pthread_create(&th[t], NULL, succ_job, &jobs[t]); }
        for (int t = 0; t < T; t++) pthread_join(th[t], NULL);
        uint64_t out = 0;
        for (uint64_t i = 0; i < n; i++) {
            uint64_t m = 0; uint64_t at = out; out += 2;
            for (int p = 0; p < NIN; p++) {
                uint64_t r = buf[i * NIN + p];
                if (r == REJECT) { rejected++; continue; }
                m |= 1ull << p; row[out++] = insert_or_get(r);
            }
            row[at] = (uint32_t)m; row[at + 1] = (uint32_t)(m >> 32);
        }
        if (fwrite(row, sizeof(uint32_t), out, ft) != out) die("table write");
        head = hi;
        if (++report % 64 == 0) fprintf(stderr, "  %llu states, %llu to go, %.0f s\n", (unsigned long long)NKEYS, (unsigned long long)(NKEYS - head), now() - t0);
    }
    fclose(ft);
    snprintf(fn, sizeof fn, "%s/keys_h%d.bin", dir, h); FILE *fk = fopen(fn, "wb"); if (!fk) die("keys file");
    if (fwrite(KEYS, sizeof(uint64_t), NKEYS, fk) != NKEYS) die("keys write"); fclose(fk);
    printf("h=%d states=%llu inputs=%d transitions=%llu accepted=%llu rejected=%llu seconds=%.1f\n", h, (unsigned long long)NKEYS, NIN,
           (unsigned long long)(NKEYS * NIN), (unsigned long long)(NKEYS * NIN - rejected), (unsigned long long)rejected, now() - t0);
}

/* ---- loading ---- */
static uint64_t load_keys(int h, const char *dir) {
    char fn[512]; snprintf(fn, sizeof fn, "%s/keys_h%d.bin", dir, h);
    FILE *f = fopen(fn, "rb"); if (!f) die("keys file missing"); fseeko(f, 0, SEEK_END); off_t sz = ftello(f); fseeko(f, 0, SEEK_SET);
    NKEYS = (uint64_t)sz / 8; KEYS = malloc((size_t)sz); if (!KEYS) die("keys alloc");
    if (fread(KEYS, 8, NKEYS, f) != NKEYS) die("keys read"); fclose(f); return NKEYS;
}

/* A streaming reader of variable-length rows: fills `out` with up to maxrows rows (each
   mask-lo, mask-hi, successors…) and `off` with their starts; returns the row count. */
typedef struct { FILE *f; uint32_t *buf; uint64_t cap, len, pos; } reader_t;
static reader_t reader_open(int h, const char *dir) {
    char fn[512]; snprintf(fn, sizeof fn, "%s/table_h%d.bin", dir, h);
    reader_t r; r.f = fopen(fn, "rb"); if (!r.f) die("table file missing");
    r.cap = 1u << 26; r.buf = malloc(r.cap * sizeof(uint32_t)); if (!r.buf) die("reader buffer"); r.len = r.pos = 0; return r;
}
static uint64_t reader_rows(reader_t *r, uint64_t maxrows, uint32_t *out, uint64_t *off, uint64_t outcap) {
    uint64_t n = 0, o = 0;
    for (;;) {
        if (n == maxrows) break;
        if (r->len - r->pos < 2) {                   /* refill */
            memmove(r->buf, r->buf + r->pos, (r->len - r->pos) * sizeof(uint32_t)); r->len -= r->pos; r->pos = 0;
            size_t got = fread(r->buf + r->len, sizeof(uint32_t), r->cap - r->len, r->f); r->len += got;
            if (r->len < 2) break;
        }
        uint64_t m = (uint64_t)r->buf[r->pos] | ((uint64_t)r->buf[r->pos + 1] << 32);
        uint64_t L = 2 + (uint64_t)__builtin_popcountll(m);
        if (r->len - r->pos < L) {
            memmove(r->buf, r->buf + r->pos, (r->len - r->pos) * sizeof(uint32_t)); r->len -= r->pos; r->pos = 0;
            size_t got = fread(r->buf + r->len, sizeof(uint32_t), r->cap - r->len, r->f); r->len += got;
            if (r->len < L) die("truncated table");
        }
        if (o + L > outcap) break;
        memcpy(out + o, r->buf + r->pos, L * sizeof(uint32_t)); off[n++] = o; o += L; r->pos += L;
    }
    off[n] = o; return n;
}
static void reader_close(reader_t *r) { fclose(r->f); free(r->buf); }

/* ---- weights with directed rounding ---- */
static void weights(double z, int h, double *w, int dir) {
    /* dir = FE_UPWARD gives w[p] ≥ the exact weight, FE_DOWNWARD gives w[p] ≤ it. */
    for (int p = 0; p < NIN; p++) {
        int a = IN[p].a;
        fesetround(dir);
        double pw = 1.0; for (int k = 0; k < a + 2; k++) pw *= z;                 /* z^{a+2} */
        if (a < h - 1) { w[p] = pw; continue; }
        double num = 1.0; for (int k = 0; k < h + 1; k++) num *= z;             /* z^{h+1} */
        fesetround(dir == FE_UPWARD ? FE_DOWNWARD : FE_UPWARD);
        double den = 1.0 - z;
        fesetround(dir);
        w[p] = num / den;
    }
    fesetround(FE_TONEAREST);
}

/* ---- one streamed pass over the table, threaded by rows ---- */
typedef struct {
    const uint32_t *rows; const uint64_t *off; uint64_t r0, n, s0;
    const double *v; double *nv; const double *w, *wu, *wd;
    int mode;                                        /* 0 = power step, 1 = certify */
    double up_max, dn_min, near_max;
} pass_t;
static void *pass_job(void *arg) {
    pass_t *j = arg;
    if (j->mode == 1) {
        fesetround(FE_UPWARD); volatile double one = 1.0, tiny = 0x1p-60; if (!(one + tiny > 1.0)) die("FE_UPWARD not honoured");
        fesetround(FE_DOWNWARD); if (!(one - tiny < 1.0)) die("FE_DOWNWARD not honoured");
        j->up_max = 0; j->dn_min = INFINITY; j->near_max = 0;
    }
    for (uint64_t i = 0; i < j->n; i++) {
        const uint32_t *r = j->rows + j->off[j->r0 + i];
        uint64_t m = (uint64_t)r[0] | ((uint64_t)r[1] << 32); const uint32_t *t = r + 2;
        if (j->mode == 0) {
            double acc = 0.0; int k = 0;
            for (int p = 0; p < NIN; p++) if (m >> p & 1) acc += j->w[p] * j->v[t[k++]];
            j->nv[j->s0 + i] = acc;
        } else {
            double vs = j->v[j->s0 + i]; int k;
            fesetround(FE_UPWARD);   double up = 0.0; k = 0; for (int p = 0; p < NIN; p++) if (m >> p & 1) up += j->wu[p] * j->v[t[k++]]; up /= vs;
            fesetround(FE_DOWNWARD); double dn = 0.0; k = 0; for (int p = 0; p < NIN; p++) if (m >> p & 1) dn += j->wd[p] * j->v[t[k++]]; dn /= vs;
            fesetround(FE_TONEAREST); double nr = 0.0; k = 0; for (int p = 0; p < NIN; p++) if (m >> p & 1) nr += j->wu[p] * j->v[t[k++]]; nr /= vs;
            if (up > j->up_max) j->up_max = up; if (dn < j->dn_min) j->dn_min = dn; if (nr > j->near_max) j->near_max = nr;
        }
    }
    fesetround(FE_TONEAREST);
    return NULL;
}
/* Streams the whole table once; returns the number of rows seen. */
static uint64_t sweep(int h, const char *dir, int threads, pass_t *proto, uint64_t N) {
    reader_t rd = reader_open(h, dir);
    const uint64_t MAXR = 1u << 21, OUTCAP = (uint64_t)MAXR * (NIN + 2);
    uint32_t *out = malloc(OUTCAP * sizeof(uint32_t)); uint64_t *off = malloc((MAXR + 1) * sizeof(uint64_t)); if (!out || !off) die("sweep buffers");
    pthread_t th[MAXT]; pass_t jobs[MAXT]; uint64_t seen = 0;
    proto->up_max = 0; proto->dn_min = INFINITY; proto->near_max = 0;
    for (;;) {
        uint64_t n = reader_rows(&rd, MAXR, out, off, OUTCAP); if (!n) break;
        if (seen + n > N) die("table has more rows than keys");
        int T = threads; if ((uint64_t)T > n) T = (int)n;
        for (int t = 0; t < T; t++) { jobs[t] = *proto; jobs[t].rows = out; jobs[t].off = off; jobs[t].r0 = n * t / T; jobs[t].n = n * (t + 1) / T - jobs[t].r0; jobs[t].s0 = seen + jobs[t].r0; pthread_create(&th[t], NULL, pass_job, &jobs[t]); }
        for (int t = 0; t < T; t++) { pthread_join(th[t], NULL); if (jobs[t].up_max > proto->up_max) proto->up_max = jobs[t].up_max; if (jobs[t].dn_min < proto->dn_min) proto->dn_min = jobs[t].dn_min; if (jobs[t].near_max > proto->near_max) proto->near_max = jobs[t].near_max; }
        seen += n;
    }
    reader_close(&rd); free(out); free(off);
    if (seen != N) die("table row count differs from the key count");
    return seen;
}

static void cmd_eigen(int h, const char *dir, double z, int iters, double tol, int threads) {
    double t0 = now(); uint64_t N = load_keys(h, dir);
    double *v = malloc(N * sizeof(double)), *nv = malloc(N * sizeof(double)); if (!v || !nv) die("vectors");
    for (uint64_t i = 0; i < N; i++) v[i] = 1.0;
    double w[64]; for (int p = 0; p < NIN; p++) { int a = IN[p].a; w[p] = a < h - 1 ? pow(z, a + 2) : pow(z, h + 1) / (1.0 - z); }
    double lo = 0, hi = 0; int it;
    for (it = 1; it <= iters; it++) {
        pass_t proto = { 0 }; proto.v = v; proto.nv = nv; proto.w = w; proto.mode = 0;
        sweep(h, dir, threads, &proto, N);
        lo = INFINITY; hi = 0; double mx = 0;
        for (uint64_t i = 0; i < N; i++) { double r = nv[i] / v[i]; if (r < lo) lo = r; if (r > hi) hi = r; if (nv[i] > mx) mx = nv[i]; }
        for (uint64_t i = 0; i < N; i++) { v[i] = nv[i] / mx; if (!(v[i] > 0)) die("component fell to zero"); }
        fprintf(stderr, "  iter %d ratio [%.17g, %.17g] spread %.3e %.0f s\n", it, lo, hi, (hi - lo) / hi, now() - t0);
        if ((hi - lo) / hi < tol) break;
    }
    char fn[512]; snprintf(fn, sizeof fn, "%s/v_h%d.bin", dir, h); FILE *fv = fopen(fn, "wb"); if (!fv) die("v file");
    if (fwrite(v, sizeof(double), N, fv) != N) die("v write"); fclose(fv);
    printf("h=%d states=%llu z=%a iters=%d ratio_min=%.17g ratio_max=%.17g seconds=%.1f written=%s\n", h, (unsigned long long)N, z, it, lo, hi, now() - t0, fn);
}

static void cmd_certify(int h, const char *dir, double z, const char *vfile, int threads) {
    double t0 = now(); uint64_t N = load_keys(h, dir);
    double *v = malloc(N * sizeof(double)); if (!v) die("v alloc");
    FILE *fv = fopen(vfile, "rb"); if (!fv) die("v file missing");
    if (fread(v, sizeof(double), N, fv) != N) die("v read: size differs from the state count");
    { double extra; if (fread(&extra, sizeof(double), 1, fv) == 1) die("v file longer than the state count"); }
    fclose(fv);
    for (uint64_t i = 0; i < N; i++) if (!(v[i] > 0) || !isfinite(v[i])) die("v not positive and finite");
    double wu[64], wd[64]; weights(z, h, wu, FE_UPWARD); weights(z, h, wd, FE_DOWNWARD);
    pass_t proto = { 0 }; proto.v = v; proto.wu = wu; proto.wd = wd; proto.mode = 1;
    sweep(h, dir, threads, &proto, N);
    /* rounding-mode-free bound: a term passes through one product, at most NIN−1 additions
       and one division, each within a factor (1+2^-53): inflate by (1+2^-52)^(NIN+1), rounded up. */
    fesetround(FE_UPWARD); double infl = 1.0; for (int k = 0; k < NIN + 1; k++) infl *= 1.0 + 0x1p-52; double free_max = proto.near_max * infl; fesetround(FE_TONEAREST);
    printf("h=%d states=%llu z=%a (%.17g)\n", h, (unsigned long long)N, z, z);
    printf("weights_up:"); for (int p = 0; p < NIN; p++) printf(" %a", wu[p]); printf("\n");
    printf("lambda_cert=%a (%.17g)  rounding: FE_UPWARD per thread, self-tested\n", proto.up_max, proto.up_max);
    printf("lambda_free=%a (%.17g)  rounding: nearest, inflated by (1+2^-52)^%d\n", free_max, free_max, NIN + 1);
    printf("ratio_min_down=%a (%.17g)  a lower bound on the spectral radius\n", proto.dn_min, proto.dn_min);
    printf("seconds=%.1f\n", now() - t0);
}

/* ---- dump / sample for the reference ---- */
static void print_row_keys(uint64_t key, const uint64_t *succ) {
    printf("%llu", (unsigned long long)key);
    for (int p = 0; p < NIN; p++) { if (succ[p] == REJECT) printf(" -1"); else printf(" %llu", (unsigned long long)succ[p]); }
    printf("\n");
}
typedef struct { uint64_t key; uint64_t succ[64]; } full_row_t;
static int cmp_row(const void *a, const void *b) { uint64_t x = ((const full_row_t *)a)->key, y = ((const full_row_t *)b)->key; return x < y ? -1 : x > y; }
static void cmd_dump(int h, const char *dir) {
    uint64_t N = load_keys(h, dir);
    full_row_t *rows = malloc(N * sizeof(full_row_t)); if (!rows) die("dump alloc");
    reader_t rd = reader_open(h, dir);
    const uint64_t MAXR = 1u << 16, OUTCAP = MAXR * (NIN + 2);
    uint32_t *out = malloc(OUTCAP * sizeof(uint32_t)); uint64_t *off = malloc((MAXR + 1) * sizeof(uint64_t)); uint64_t s = 0;
    for (;;) {
        uint64_t n = reader_rows(&rd, MAXR, out, off, OUTCAP); if (!n) break;
        for (uint64_t i = 0; i < n; i++, s++) {
            const uint32_t *r = out + off[i]; uint64_t m = (uint64_t)r[0] | ((uint64_t)r[1] << 32); int k = 2;
            rows[s].key = KEYS[s];
            for (int p = 0; p < NIN; p++) rows[s].succ[p] = (m >> p & 1) ? KEYS[r[k++]] : REJECT;
        }
    }
    if (s != N) die("dump: row count"); reader_close(&rd);
    qsort(rows, N, sizeof(full_row_t), cmp_row);
    for (uint64_t i = 0; i < N; i++) print_row_keys(rows[i].key, rows[i].succ);
    free(rows); free(out); free(off);
}
static void cmd_sample(int h, const char *dir, int k, uint64_t seed) {
    uint64_t N = load_keys(h, dir); uint64_t succ[64];
    for (int i = 0; i < k; i++) {
        seed = mix(seed + 0x9E3779B97F4A7C15ull); uint64_t s = seed % N;
        for (int p = 0; p < NIN; p++) { uint64_t r = delta(KEYS[s], &IN[p]); succ[p] = r == REJECT ? REJECT : canon(r); }
        print_row_keys(KEYS[s], succ);
    }
}

int main(int argc, char **argv) {
    if (argc < 4) { fprintf(stderr, "usage: see the header of mh.c\n"); return 2; }
    H = atoi(argv[2]); if (H < 1 || H > 15) die("h must be 1..15"); make_inputs(H);
    const char *cmd = argv[1], *dir = argv[3];
    if (!strcmp(cmd, "build")) cmd_build(H, dir, argc > 4 ? atoi(argv[4]) : 8, argc > 5 ? strtoull(argv[5], NULL, 10) : 0);
    else if (!strcmp(cmd, "eigen")) { if (argc < 7) die("eigen H DIR Z ITERS TOL [T]"); cmd_eigen(H, dir, strtod(argv[4], NULL), atoi(argv[5]), strtod(argv[6], NULL), argc > 7 ? atoi(argv[7]) : 8); }
    else if (!strcmp(cmd, "certify")) { if (argc < 6) die("certify H DIR Z VFILE [T]"); cmd_certify(H, dir, strtod(argv[4], NULL), argv[5], argc > 6 ? atoi(argv[6]) : 8); }
    else if (!strcmp(cmd, "dump")) cmd_dump(H, dir);
    else if (!strcmp(cmd, "sample")) { if (argc < 6) die("sample H DIR K SEED"); cmd_sample(H, dir, atoi(argv[4]), strtoull(argv[5], NULL, 10)); }
    else die("unknown command");
    return 0;
}
