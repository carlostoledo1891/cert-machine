/* Monochromatic-K6 density of the step graphon on Z_2^10 with W(x,y) = f(|x xor y|) (red probability by Hamming
 * weight; f(0) is the density inside a block), as a sum over the C(41,10) multisets of 10 column types.
 * Fix x0 = 0 (translation invariance); a 5-tuple (x1..x5) is a 10-column 0/1 matrix, each column a 5-bit type, and
 * all 15 pair weights are column counts. c6 = (1/1024^5) sum_multisets mult * [prod f(w_p) + prod (1 - f(w_p))].
 *
 *   c6 float  f0 .. f10          -> c6 and the gradient (double)
 *   c6 exact  D n0 .. n10 prime  -> numerator sum mult*[prod n + prod (D-n)] mod prime (for CRT)
 * build: cc -O3 -o c6 c6.c -lpthread
 */
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define NT 4
static int PI[15], PJ[15];               /* pair (i,j), i<j in 0..5 (0 = the fixed zero vector) */
static double F[11];                      /* red prob by weight */
static int EXACT; static uint64_t P, NUM[11], DEN;
static uint64_t FACT[11];

typedef struct { int t0; double c, g[11]; uint64_t acc; } Job;

static inline uint64_t mulm(uint64_t a, uint64_t b) { return (unsigned __int128)a * b % P; }

/* pair weight contribution of column type t (bits b1..b5 of x1..x5; x0 bit is 0) */
static int CW[32][15];

static void leaf(const int *w, uint64_t mult, Job *J) {
    if (EXACT) {
        uint64_t a = 1, b = 1;
        for (int p = 0; p < 15; p++) { a = mulm(a, NUM[w[p]]); b = mulm(b, (DEN - NUM[w[p]]) % P); }
        J->acc = (J->acc + mulm(mult % P, (a + b) % P)) % P;
        return;
    }
    double pre[16], suf[16], qre[16], quf[16];
    pre[0] = qre[0] = 1;
    for (int p = 0; p < 15; p++) { pre[p + 1] = pre[p] * F[w[p]]; qre[p + 1] = qre[p] * (1 - F[w[p]]); }
    suf[15] = quf[15] = 1;
    for (int p = 14; p >= 0; p--) { suf[p] = suf[p + 1] * F[w[p]]; quf[p] = quf[p + 1] * (1 - F[w[p]]); }
    double m = (double)mult;
    J->c += m * (pre[15] + qre[15]);
    for (int p = 0; p < 15; p++) J->g[w[p]] += m * (pre[p] * suf[p + 1] - qre[p] * quf[p + 1]);
}

/* DFS over multisets: column types in nondecreasing order */
static void dfs(int left, int tmin, int *w, int *cnt, uint64_t denom, Job *J) {
    if (left == 0) { leaf(w, FACT[10] / denom, J); return; }
    for (int t = tmin; t < 32; t++) {
        for (int p = 0; p < 15; p++) w[p] += CW[t][p];
        cnt[t]++;
        dfs(left - 1, t, w, cnt, denom * cnt[t], J);  /* denom accumulates prod c_t! */
        cnt[t]--;
        for (int p = 0; p < 15; p++) w[p] -= CW[t][p];
    }
}

static void *work(void *arg) {
    Job *J = arg; int w[15], cnt[32];
    for (int t0 = J->t0; t0 < 32; t0 += NT) {  /* first (smallest) column type */
        memset(w, 0, sizeof w); memset(cnt, 0, sizeof cnt);
        for (int p = 0; p < 15; p++) w[p] += CW[t0][p];
        cnt[t0] = 1;
        dfs(9, t0, w, cnt, 1, J);
    }
    return NULL;
}

int main(int argc, char **argv) {
    int k = 0;
    for (int i = 0; i < 6; i++) for (int j = i + 1; j < 6; j++) { PI[k] = i; PJ[k] = j; k++; }
    for (int t = 0; t < 32; t++) for (int p = 0; p < 15; p++) {
        int bi = PI[p] == 0 ? 0 : (t >> (PI[p] - 1)) & 1, bj = (t >> (PJ[p] - 1)) & 1;
        CW[t][p] = bi != bj;
    }
    FACT[0] = 1; for (int i = 1; i <= 10; i++) FACT[i] = FACT[i - 1] * i;
    if (!strcmp(argv[1], "exact")) {
        EXACT = 1; DEN = strtoull(argv[2], 0, 10);
        for (int i = 0; i < 11; i++) NUM[i] = strtoull(argv[3 + i], 0, 10);
        P = strtoull(argv[14], 0, 10);
        for (int i = 0; i < 11; i++) NUM[i] %= P; DEN %= P;
    } else for (int i = 0; i < 11; i++) F[i] = atof(argv[2 + i]);
    pthread_t th[NT]; Job J[NT];
    for (int t = 0; t < NT; t++) { memset(&J[t], 0, sizeof(Job)); J[t].t0 = t; pthread_create(&th[t], 0, work, &J[t]); }
    for (int t = 0; t < NT; t++) pthread_join(th[t], 0);
    if (EXACT) { uint64_t s = 0; for (int t = 0; t < NT; t++) s = (s + J[t].acc) % P; printf("%llu\n", (unsigned long long)s); return 0; }
    double c = 0, g[11] = {0}, M5 = 1024.0 * 1024 * 1024 * 1024 * 1024;
    for (int t = 0; t < NT; t++) { c += J[t].c; for (int i = 0; i < 11; i++) g[i] += J[t].g[i]; }
    printf("%.17g", c / M5);
    for (int i = 0; i < 11; i++) printf(" %.17g", g[i] / M5);
    printf("\n");
    return 0;
}
