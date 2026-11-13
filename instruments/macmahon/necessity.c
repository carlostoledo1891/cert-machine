/* necessity.c — the search engine of instruments/macmahon/necessity.py (route A, clean room). C99, no dependency.
 *
 * It knows nothing about cubes. It reads from stdin a table fit[t][v] (for target t and variety v, the 8-bit set
 * of corner slots of t that a cube of variety v fits) and enumerates inventories (multisets of varieties) of
 * total 0, 1, 2, ... in turn, reporting every inventory that builds every target, and stops after the first
 * total at which there is one. necessity.py builds the table from first principles and names the answers.
 *
 * THE SEARCH. An inventory of total T is written in exactly one way as a non-decreasing sequence
 * v[0] <= v[1] <= ... <= v[T-1] of variety indices. The search is the depth-first walk of the tree of all such
 * sequences: the node (v[0..d-1]) has one child for every v[d] >= v[d-1]. Its leaves at depth T are therefore
 * ALL inventories of total T, each once. A leaf is reported when every target is built by it; "built" is decided
 * by an explicit maximum bipartite matching of physical cubes to slots (augmenting paths), never by a count.
 *
 * THE ONE PRUNING RULE (the joker top-up). At a node with d cubes chosen, the last of variety m, every completion
 * adds exactly R = T - d cubes, each of a variety >= m. Replace those unknown cubes by R JOKERS, a joker being
 * allowed in every slot that at least one variety >= m fits. If the stock "the d chosen cubes + R jokers" has no
 * assignment of eight distinct pieces to the eight slots of some target t, the subtree is abandoned.
 * Why this never discards a universal inventory: take any completion that builds t and the assignment that
 * builds it. Each of its R later cubes has a variety >= m, so wherever that cube sits a joker may sit too; swap
 * each later cube for its own joker and the same assignment is an assignment of the joker stock. So a completion
 * that builds t forces the joker stock to build t; contrapositive: joker stock fails t => no completion builds
 * t => no completion is universal. The argument is monotonicity only (a piece replaced by one that is allowed
 * wherever the old one was never breaks a build); it uses no symmetry, no count, no property of any answer.
 * (In the variant "shared" a piece may fill several slots; the same swap argument holds word for word.)
 * At a leaf R = 0, there are no jokers, and the test IS the definition of "builds every target".
 * There is no other pruning. The order in which the targets are tried at a node (the target that failed last is
 * tried first) changes speed only: a node is abandoned iff SOME target fails, whatever the order.
 *
 * With PRUNE = 0 no subtree is ever abandoned: every non-decreasing sequence is visited and every leaf is judged
 * by the matching, target after target, a leaf being set aside at the first target it does not build.
 *
 * The matching for target t at a node is a maximum matching of the chosen cubes into t's slots, obtained from
 * the parent's by one augmenting-path search from the new cube (a maximum matching plus one new vertex and one
 * augmenting search is maximum again: Berge). It is computed only when asked for (need); the jokers are then
 * added the same way on a scratch copy. necessity.py judges every reported inventory again by another routine.
 *
 * stdin : NV NT TMAX SHARED REQUIRED PRUNE, then fit[t][v] as NT rows of NV integers 0..255.
 *         NT is the number of targets that must be built (30; fewer only in self-tests).
 *         REQUIRED is a variety index that every counted inventory must hold, or -1.
 * stdout: "U v[0] ... v[T-1]" for each universal inventory of the first total that has one (in search order),
 *         "L <total> <universal found> <nodes visited at this total>" after each total searched,
 *         "M <m_star>" or "M -1" (none up to TMAX), "N <nodes over all totals>".
 * MIT · cert-machine */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAXV 30
#define MAXT 12

static int NV, NT, TMAX, SHARED, REQUIRED, PRUNE;
static unsigned char fit[MAXV][MAXV];        /* fit[t][v]: slots of target t that variety v fits          */
static unsigned char jok[MAXV][MAXV + 1];    /* jok[t][m]: slots of t that at least one variety >= m fits */
static int T;                                /* the total being searched                                  */
static int chosen[MAXT + 1];                 /* the non-decreasing sequence                               */
static signed char owner[MAXT + 1][MAXV][8]; /* owner[d][t][s]: which of the first d cubes holds slot s of
                                                target t in the kept maximum matching, or -1              */
static unsigned long done[MAXT + 1];         /* bit t of done[d]: owner[d][t] is computed for this path   */
static unsigned long long nodes, found;
static int hint;

/* one augmenting-path search from piece u; lm[i] = slots piece i is allowed in; own[s] = piece in slot s or -1 */
static int augment(const unsigned char *lm, signed char *own, int u, unsigned *seen)
{
    int s;
    for (s = 0; s < 8; s++) {
        unsigned b = 1u << s;
        if ((lm[u] & b) && !(*seen & b)) {
            *seen |= b;
            if (own[s] < 0 || augment(lm, own, own[s], seen)) {
                own[s] = (signed char)u;
                return 1;
            }
        }
    }
    return 0;
}

/* make owner[d][t] a maximum matching of the first d chosen cubes into the slots of target t */
static void need(int t, int d)
{
    unsigned char lm[MAXT + 1];
    unsigned seen = 0;
    int i;
    if (done[d] >> t & 1UL) return;
    if (d == 0) {
        memset(owner[0][t], -1, 8);
    } else {
        need(t, d - 1);
        memcpy(owner[d][t], owner[d - 1][t], 8);
        for (i = 0; i < d; i++) lm[i] = fit[t][chosen[i]];
        augment(lm, owner[d][t], d - 1, &seen);
    }
    done[d] |= 1UL << t;
}

/* Can the d chosen cubes plus T - d jokers fill all eight slots of target t? (At a leaf: do the cubes build t?) */
static int target_ok(int t, int d)
{
    unsigned char lm[MAXT + 1];
    signed char tmp[8];
    unsigned seen, J = jok[t][d > 0 ? chosen[d - 1] : 0];
    int i, s;

    if (SHARED) {
        /* a piece may fill several slots: slot s can be filled iff some piece is allowed in it */
        unsigned c = 0;
        for (i = 0; i < d; i++) c |= fit[t][chosen[i]];
        if (T - d > 0) c |= J;
        for (s = 0; s < 8; s++) if (!(c & (1u << s))) return 0;
        return 1;
    }
    need(t, d);
    memcpy(tmp, owner[d][t], 8);
    for (i = 0; i < d; i++) lm[i] = fit[t][chosen[i]];
    for (i = d; i < T; i++) {
        lm[i] = (unsigned char)J;
        seen = 0;
        if (!augment(lm, tmp, i, &seen)) break;   /* jokers are identical: if one finds no path, no later one will */
    }
    for (s = 0; s < 8; s++) if (tmp[s] < 0) return 0;
    return 1;
}

/* the test of the node with d cubes chosen: 1 = keep (at a leaf: universal), 0 = abandon (at a leaf: not universal) */
static int node_ok(int d)
{
    int k, t;
    if (!PRUNE && d < T) return 1;           /* unpruned: nothing is abandoned above the leaves */
    for (k = 0; k < NT; k++) {
        t = hint + k; if (t >= NT) t -= NT;
        if (!target_ok(t, d)) { hint = t; return 0; }
    }
    return 1;
}

static void leaf(void)
{
    int i, has = REQUIRED < 0;
    for (i = 0; i < T; i++) if (chosen[i] == REQUIRED) has = 1;
    if (!has) return;                        /* outside the variant's domain: not counted */
    found++;
    printf("U");
    for (i = 0; i < T; i++) printf(" %d", chosen[i]);
    printf("\n");
}

static void search(int d, int vmin)
{
    int v;
    if (d == T) { leaf(); return; }
    for (v = vmin; v < NV; v++) {
        chosen[d] = v;
        done[d + 1] = 0;
        nodes++;
        if (node_ok(d + 1)) search(d + 1, v);
    }
}

int main(void)
{
    int t, v, x, m = -1;
    unsigned long long all = 0;
    if (scanf("%d %d %d %d %d %d", &NV, &NT, &TMAX, &SHARED, &REQUIRED, &PRUNE) != 6) return 2;
    if (NV < 1 || NV > MAXV || NT < 0 || NT > MAXV || TMAX < 0 || TMAX > MAXT || REQUIRED >= NV) return 2;
    for (t = 0; t < NT; t++)
        for (v = 0; v < NV; v++) {
            if (scanf("%d", &x) != 1 || x < 0 || x > 255) return 2;
            fit[t][v] = (unsigned char)x;
        }
    for (t = 0; t < NT; t++) {
        jok[t][NV] = 0;
        for (v = NV - 1; v >= 0; v--) jok[t][v] = (unsigned char)(jok[t][v + 1] | fit[t][v]);
    }
    for (T = 0; T <= TMAX; T++) {
        nodes = 0; found = 0; hint = 0;
        done[0] = 0;
        nodes++;                             /* the root: the empty sequence */
        if (node_ok(0)) search(0, 0);
        printf("L %d %llu %llu\n", T, found, nodes);
        fflush(stdout);
        all += nodes;
        if (found) { m = T; break; }
    }
    printf("M %d\n", m);
    printf("N %llu\n", all);
    return 0;
}
