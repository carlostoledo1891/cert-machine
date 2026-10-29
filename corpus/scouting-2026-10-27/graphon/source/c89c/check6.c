/* Independent checker for the K6 multiplicity of a weight-class step graphon on Z_2^10 (shares no code with c6.c).
 * Iterates over all count vectors c in N^32 with sum 10 (column-type multiplicities of the 10x5 matrix of
 * x1..x5, with x0 = 0), recomputing the 15 pair weights from scratch at each leaf, and returns
 *   N mod p = sum_c (10!/prod c_t!) * [ prod_pairs n(w) + prod_pairs (D - n(w)) ]  mod p,
 * so that c6 = N / (1024^5 * D^15).   usage: check6 D n0 .. n10 p      build: cc -O3 -o check6 check6.c
 */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
typedef unsigned __int128 u128;
static uint64_t p, n[11], d, fact[11];
static uint64_t mm(uint64_t a, uint64_t b) { return (uint64_t)((u128)a * b % p); }
static int c[32];
static uint64_t total;

static void visit(void) {
    int w[6][6] = {{0}};
    uint64_t den = 1;
    for (int t = 0; t < 32; t++) {
        if (!c[t]) continue;
        den *= fact[c[t]];
        int bit[6]; bit[0] = 0;
        for (int i = 1; i <= 5; i++) bit[i] = (t >> (i - 1)) & 1;
        for (int i = 0; i < 6; i++) for (int j = i + 1; j < 6; j++) if (bit[i] != bit[j]) w[i][j] += c[t];
    }
    uint64_t mult = fact[10] / den, r = 1, b = 1;
    for (int i = 0; i < 6; i++) for (int j = i + 1; j < 6; j++) { r = mm(r, n[w[i][j]]); b = mm(b, (d + p - n[w[i][j]]) % p); }
    total = (total + mm(mult % p, (r + b) % p)) % p;
}

/* compositions of `left` into types k..31 */
static void rec(int k, int left) {
    if (k == 31) { c[31] = left; visit(); c[31] = 0; return; }
    for (int v = left; v >= 0; v--) { c[k] = v; rec(k + 1, left - v); }
    c[k] = 0;
}

int main(int argc, char **argv) {
    d = strtoull(argv[1], 0, 10);
    for (int i = 0; i < 11; i++) n[i] = strtoull(argv[2 + i], 0, 10);
    p = strtoull(argv[13], 0, 10);
    d %= p; for (int i = 0; i < 11; i++) n[i] %= p;
    fact[0] = 1; for (int i = 1; i <= 10; i++) fact[i] = fact[i - 1] * i;
    rec(0, 10);
    printf("%llu\n", (unsigned long long)total);
    return 0;
}
