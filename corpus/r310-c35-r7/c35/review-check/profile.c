/* profile.c -- C35 review check (control room, 2026-11-23). Written from the definitions, no track's code read.
 *
 * Reads graph6 lines (n <= 63) on stdin. For each graph prints:
 *   G <index> n <n> e <edges> tri <triangles> alpha <alpha> isets <total independent sets incl. empty>
 *     by-size <c0 c1 ... c_alpha> nine <independent 9-sets>
 *   then one line per vertex x:  V <x> deg <deg> valid <#S> maxvalid <#maximal S>
 * where S ranges over independent sets of G - x that meet every independent 9-set of G - x
 * (the re-attachments of x that keep alpha <= 9 and no triangle), and "maximal" = maximal independent in G - x.
 * The per-vertex block is printed only when argv[1] == "-v".
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

typedef uint64_t u64;
static int n;
static u64 adj[64];
static long long bysize[64];
static u64 *nines; static long nnine, capnine;

static void enum_all(u64 cand, u64 cur, int sz) {
    bysize[sz]++;
    if (sz == 9) {
        if (nnine == capnine) { capnine = capnine ? 2 * capnine : 4096; nines = realloc(nines, capnine * sizeof(u64)); }
        nines[nnine++] = cur;
    }
    while (cand) {
        int v = __builtin_ctzll(cand);
        cand &= cand - 1;
        enum_all(cand & ~adj[v], cur | (1ULL << v), sz + 1);
    }
}

/* per-vertex hitting-set enumeration */
static int W;                 /* words of the 9-set bitset for G - x */
static u64 *member;           /* member[v*W + k]: 9-set k (of G - x) contains v */
static u64 *stackbits;        /* hit bitsets per depth */
static long long nvalid, nmaxvalid;
static u64 Hmask;             /* vertex set of G - x */
static long hn;               /* number of 9-sets of G - x */

static void enum_hit(u64 cand, u64 cur, int depth) {
    /* cur is independent; test it */
    u64 *hit = stackbits + (size_t)depth * W;
    int ok = 1;
    for (int k = 0; k < W; k++) {
        u64 full = (k == W - 1 && (hn % 64)) ? ((1ULL << (hn % 64)) - 1) : ~0ULL;
        if (hn == 0) { full = 0; }
        if ((hit[k] & full) != full) { ok = 0; break; }
    }
    if (ok) {
        nvalid++;
        /* maximal independent in G - x: no vertex of H outside cur is non-adjacent to all of cur */
        u64 nb = cur;
        for (u64 t = cur; t; t &= t - 1) nb |= adj[__builtin_ctzll(t)];
        if ((Hmask & ~nb) == 0) nmaxvalid++;
    }
    while (cand) {
        int v = __builtin_ctzll(cand);
        cand &= cand - 1;
        u64 *nh = stackbits + (size_t)(depth + 1) * W;
        for (int k = 0; k < W; k++) nh[k] = hit[k] | member[(size_t)v * W + k];
        enum_hit(cand & ~adj[v], cur | (1ULL << v), depth + 1);
    }
}

static int parse_g6(const char *s) {
    n = s[0] - 63;
    if (n < 1 || n > 63) return -1;
    memset(adj, 0, sizeof adj);
    int bit = 0; const char *p = s + 1;
    for (int j = 1; j < n; j++)
        for (int i = 0; i < j; i++) {
            int c = p[bit / 6] - 63;
            if ((c >> (5 - bit % 6)) & 1) { adj[i] |= 1ULL << j; adj[j] |= 1ULL << i; }
            bit++;
        }
    return 0;
}

int main(int argc, char **argv) {
    int verbose = (argc > 1 && strcmp(argv[1], "-v") == 0);
    char line[4096]; int idx = 0;
    while (fgets(line, sizeof line, stdin)) {
        line[strcspn(line, "\r\n")] = 0;
        if (!line[0]) continue;
        idx++;
        if (parse_g6(line)) { fprintf(stderr, "bad g6 line %d\n", idx); return 1; }
        int e = 0; long tri = 0;
        for (int v = 0; v < n; v++) e += __builtin_popcountll(adj[v]);
        e /= 2;
        for (int a = 0; a < n; a++) for (int b = a + 1; b < n; b++) if (adj[a] >> b & 1)
            tri += __builtin_popcountll(adj[a] & adj[b] & ~((2ULL << b) - 1));
        memset(bysize, 0, sizeof bysize); nnine = 0;
        u64 all = (n == 64) ? ~0ULL : ((1ULL << n) - 1);
        enum_all(all, 0, 0);
        int alpha = 0; long long tot = 0;
        for (int k = 0; k < 64; k++) { if (bysize[k]) alpha = k; tot += bysize[k]; }
        printf("G %d n %d e %d tri %ld alpha %d isets %lld by-size", idx, n, e, tri, alpha, tot);
        for (int k = 0; k <= alpha; k++) printf(" %lld", bysize[k]);
        printf(" nine %ld\n", nnine);
        if (!verbose) continue;
        for (int x = 0; x < n; x++) {
            Hmask = all & ~(1ULL << x);
            /* 9-sets of G - x: those not containing x */
            hn = 0;
            for (long k = 0; k < nnine; k++) if (!(nines[k] >> x & 1)) hn++;
            W = (int)((hn + 63) / 64); if (W == 0) W = 1;
            member = calloc((size_t)n * W, sizeof(u64));
            stackbits = calloc((size_t)(n + 2) * W, sizeof(u64));
            long kk = 0;
            for (long k = 0; k < nnine; k++) {
                if (nines[k] >> x & 1) continue;
                for (u64 t = nines[k]; t; t &= t - 1) {
                    int v = __builtin_ctzll(t);
                    member[(size_t)v * W + kk / 64] |= 1ULL << (kk % 64);
                }
                kk++;
            }
            nvalid = nmaxvalid = 0;
            enum_hit(Hmask, 0, 0);
            printf("V %d deg %d valid %lld maxvalid %lld\n", x, __builtin_popcountll(adj[x]), nvalid, nmaxvalid);
            free(member); free(stackbits);
        }
    }
    return 0;
}
