/* lpfam.c -- Lemma P over a FAMILY of independent 8-sets (C35 review check, control room, 2026-11-23).
 * Written from Lemma P's statement (PathLemma.lean, structure Feasible); no track's search code read.
 *
 * A "forbidden triple" for a family F is (A, B, C): subsets of the available vertices, each independent in the core,
 * pairwise disjoint, with A u B meeting every member of F and B u C meeting every member of F.
 * Lemma P (F = all 3,360 independent 8-sets) says none exists. If none exists for a sub-family F, Lemma P follows,
 * since every triple for the full family is a triple for F.
 *
 * Input (stdin):  line 1: n, then n adjacency masks (decimal).
 *                 each further line: <forbidden-vertex mask> <k> <m_1> ... <m_k>   (one problem per line)
 * Output: one line per problem:  FEAS <A> <B> <C> <nodes>   or   INFEAS <nodes>      (masks in decimal)
 *
 * Search: complete branching. At a node pick the unmet constraint (E, "AB") or (E, "BC") with the fewest options.
 * For (E,"AB") the options are v in E that may still go to A, or to B; the branches are, in vertex order,
 * "v -> A", "v -> B", and then v is excluded from A and B for the later branches (v may still go to C).
 * This covers every triple extending the node exactly once. No symmetry is used.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
typedef uint64_t u64;
static int n; static u64 nb[64]; static u64 *F; static int k;
static long long nodes;
static u64 rA, rB, rC; static int found;

static void search(u64 A, u64 B, u64 C, u64 canA, u64 canB, u64 canC) {
    if (found) return;
    nodes++;
    int best = -1, bestopt = 1 << 30, besttype = 0;
    for (int i = 0; i < k; i++) {
        u64 E = F[i];
        if (!(E & (A | B))) {
            int o = __builtin_popcountll(E & canA) + __builtin_popcountll(E & canB);
            if (o < bestopt) { bestopt = o; best = i; besttype = 0; if (o == 0) return; }
        }
        if (!(E & (B | C))) {
            int o = __builtin_popcountll(E & canB) + __builtin_popcountll(E & canC);
            if (o < bestopt) { bestopt = o; best = i; besttype = 1; if (o == 0) return; }
        }
    }
    if (best < 0) { found = 1; rA = A; rB = B; rC = C; return; }
    u64 E = F[best];
    if (besttype == 0) {
        u64 cand = E & (canA | canB);
        while (cand) {
            u64 bit = cand & -cand; int v = __builtin_ctzll(cand); cand &= cand - 1;
            if (canA & bit)
                search(A | bit, B, C, canA & ~nb[v] & ~bit, canB & ~bit, canC & ~bit);
            if (found) return;
            if (canB & bit)
                search(A, B | bit, C, canA & ~bit, canB & ~nb[v] & ~bit, canC & ~bit);
            if (found) return;
            canA &= ~bit; canB &= ~bit;
        }
    } else {
        u64 cand = E & (canB | canC);
        while (cand) {
            u64 bit = cand & -cand; int v = __builtin_ctzll(cand); cand &= cand - 1;
            if (canB & bit)
                search(A, B | bit, C, canA & ~bit, canB & ~nb[v] & ~bit, canC & ~bit);
            if (found) return;
            if (canC & bit)
                search(A, B, C | bit, canA & ~bit, canB & ~bit, canC & ~nb[v] & ~bit);
            if (found) return;
            canB &= ~bit; canC &= ~bit;
        }
    }
}

int main(void) {
    if (scanf("%d", &n) != 1) return 1;
    for (int i = 0; i < n; i++) { unsigned long long x; if (scanf("%llu", &x) != 1) return 1; nb[i] = x; }
    F = malloc(sizeof(u64) * 8192);
    unsigned long long forb;
    while (scanf("%llu %d", &forb, &k) == 2) {
        if (k > 8192) return 2;
        for (int i = 0; i < k; i++) { unsigned long long x; if (scanf("%llu", &x) != 1) return 1; F[i] = x; }
        u64 all = ((1ULL << n) - 1) & ~(u64)forb;
        nodes = 0; found = 0;
        search(0, 0, 0, all, all, all);
        if (found) printf("FEAS %llu %llu %llu %lld\n", (unsigned long long)rA, (unsigned long long)rB,
                          (unsigned long long)rC, nodes);
        else printf("INFEAS %lld\n", nodes);
        fflush(stdout);
    }
    return 0;
}
