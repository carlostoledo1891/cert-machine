/* cert-machine D2: Lemma P by exhaustive branching, written from the statement (2026-11-21).
 *
 * Lemma P (core = circulant C_n(steps), optionally with vertices deleted): there are no three pairwise-disjoint
 * independent sets A, B, C of the core such that A u B and B u C both meet every independent k-set of the core.
 *
 * Search: a node is (A, B, C, forbidden masks fA, fB, fC). A vertex v may join X in {A,B,C} iff v is in no set,
 * v is not forbidden from X, and v has no neighbour in X. A "requirement" is an independent k-set E with
 * E n (A u B) = 0 (side 0: options v->A or v->B, v in E) or E n (B u C) = 0 (side 1: options v->B or v->C).
 * Options are listed in canonical order: v ascending; for each v, the two sets in the order of the side.
 * Branch i takes option i and forbids options 0..i-1. A requirement with no option closes the node.
 * No requirement left = a configuration: Lemma P fails (printed).
 *
 * Usage: lp_search [-n 35] [-s 1,7,11,16] [-k 8] [-d 0,..] [-c cert.txt] [-r]
 *   -noA/-noB  that set is empty (forbidden everywhere);
 *   -A/-B/-C  preset members (a sub-case; no validity check of the preset is made here);
 *   -d  deleted vertices; -c write the certificate (preorder: "side mask" per node); -r root symmetry (off: none).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

typedef uint64_t u64;
static int n = 35, k = 8, nsteps = 4, steps[16] = {1, 7, 11, 16};
static u64 adj[64], alive;
static u64 *ind; static long nind = 0, capind = 0;
static FILE *cert = NULL;
static long nodes = 0, leaves = 0, configs = 0, maxdepth = 0;

static void enum_ind(u64 set, int size, int next, u64 cand) {
  if (size == k) {
    if (nind == capind) { capind = capind ? 2 * capind : 4096; ind = realloc(ind, capind * sizeof(u64)); }
    ind[nind++] = set; return;
  }
  for (int v = next; v < n; v++)
    if ((cand >> v) & 1) enum_ind(set | (1ULL << v), size + 1, v + 1, cand & ~adj[v] & ~(1ULL << v));
}

typedef struct { u64 S[3], F[3]; } State;

static int can(const State *s, int v, int X) {
  u64 b = 1ULL << v;
  if ((s->S[0] | s->S[1] | s->S[2]) & b) return 0;
  if (s->F[X] & b) return 0;
  if (adj[v] & s->S[X]) return 0;
  return 1;
}

/* options of requirement (E, side) in canonical order; returns count */
static int options(const State *s, u64 E, int side, int *ov, int *oX) {
  int m = 0, X0 = side == 0 ? 0 : 1, X1 = side == 0 ? 1 : 2;
  for (int v = 0; v < n; v++) if ((E >> v) & 1) {
    if (can(s, v, X0)) { ov[m] = v; oX[m] = X0; m++; }
    if (can(s, v, X1)) { ov[m] = v; oX[m] = X1; m++; }
  }
  return m;
}

static void print_config(const State *s) {
  printf("CONFIGURATION");
  for (int X = 0; X < 3; X++) {
    printf(" %c=[", "ABC"[X]); int first = 1;
    for (int v = 0; v < n; v++) if ((s->S[X] >> v) & 1) { printf(first ? "%d" : ",%d", v); first = 0; }
    printf("]");
  }
  printf("\n");
}

static int stop_at_first = 1;

static int search(State *s, int depth) {  /* returns 1 if a configuration was found below */
  nodes++; if (depth > maxdepth) maxdepth = depth;
  int best = -1, bestm = 1000, bestside = 0; int ov[32], oX[32];
  for (long i = 0; i < nind && bestm > 0; i++) {
    u64 E = ind[i];
    for (int side = 0; side < 2; side++) {
      u64 U = side == 0 ? (s->S[0] | s->S[1]) : (s->S[1] | s->S[2]);
      if (E & U) continue;
      int m = options(s, E, side, ov, oX);
      if (m < bestm) { bestm = m; best = (int)i; bestside = side; if (m == 0) break; }
    }
  }
  if (best < 0) { configs++; print_config(s); return 1; }
  if (cert) fprintf(cert, "%d %llx\n", bestside, (unsigned long long)ind[best]);
  int m = options(s, ind[best], bestside, ov, oX);
  if (m == 0) { leaves++; return 0; }
  int found = 0;
  for (int i = 0; i < m; i++) {
    State t = *s;
    for (int j = 0; j < i; j++) t.F[oX[j]] |= 1ULL << ov[j];
    t.S[oX[i]] |= 1ULL << ov[i];
    if (search(&t, depth + 1)) { found = 1; if (stop_at_first) return 1; }
  }
  return found;
}

static void parse_list(const char *a, int *out, int *cnt) {
  *cnt = 0; const char *p = a;
  while (*p) { out[(*cnt)++] = atoi(p); while (*p && *p != ',') p++; if (*p) p++; }
}

int main(int argc, char **argv) {
  u64 preset[3] = {0, 0, 0}; int emptyset[3] = {0, 0, 0};
  int del[64], ndel = 0; const char *certpath = NULL;
  for (int i = 1; i < argc; i++) {
    if (!strcmp(argv[i], "-n")) n = atoi(argv[++i]);
    else if (!strcmp(argv[i], "-k")) k = atoi(argv[++i]);
    else if (!strcmp(argv[i], "-s")) parse_list(argv[++i], steps, &nsteps);
    else if (!strcmp(argv[i], "-d")) parse_list(argv[++i], del, &ndel);
    else if (!strcmp(argv[i], "-c")) certpath = argv[++i];
    else if (!strcmp(argv[i], "-all")) stop_at_first = 0;
    else if (!strcmp(argv[i], "-noA")) emptyset[0] = 1;
    else if (!strcmp(argv[i], "-noB")) emptyset[1] = 1;
    else if (!strcmp(argv[i], "-A") || !strcmp(argv[i], "-B") || !strcmp(argv[i], "-C")) {
      int X = argv[i][1] - 'A', tmp[64], cnt; parse_list(argv[++i], tmp, &cnt);
      for (int j = 0; j < cnt; j++) preset[X] |= 1ULL << tmp[j];
    }
    else { fprintf(stderr, "unknown argument %s\n", argv[i]); return 2; }
  }
  alive = (n == 64) ? ~0ULL : ((1ULL << n) - 1);
  for (int i = 0; i < ndel; i++) alive &= ~(1ULL << del[i]);
  for (int u = 0; u < n; u++) {
    adj[u] = 0;
    for (int v = 0; v < n; v++) {
      int d = ((v - u) % n + n) % n;
      for (int j = 0; j < nsteps; j++) if (d == steps[j] || d == n - steps[j]) adj[u] |= 1ULL << v;
    }
  }
  /* triangle check of the core, as a sanity fact */
  long tri = 0;
  for (int u = 0; u < n; u++) for (int v = u + 1; v < n; v++) if ((adj[u] >> v) & 1) tri += __builtin_popcountll(adj[u] & adj[v] & ~((2ULL << v) - 1));
  enum_ind(0, 0, 0, alive);
  printf("core n=%d steps=", n); for (int j = 0; j < nsteps; j++) printf(j ? ",%d" : "%d", steps[j]);
  printf(" deleted=%d triangles=%ld independent-%d-sets=%ld\n", ndel, tri, k, nind);
  if (certpath) { cert = fopen(certpath, "w"); if (!cert) { perror(certpath); return 2; } }
  State s; memset(&s, 0, sizeof s);
  /* deleted vertices may join no set */
  for (int X = 0; X < 3; X++) s.F[X] = ~alive;
  for (int X = 0; X < 3; X++) s.S[X] = preset[X];
  for (int X = 0; X < 3; X++) if (emptyset[X]) s.F[X] = ~0ULL;
  int found = search(&s, 0);
  if (cert) fclose(cert);
  printf("nodes=%ld closed-leaves=%ld configurations=%ld maxdepth=%ld\n", nodes, leaves, configs, maxdepth);
  printf(found ? "RESULT: configuration exists (Lemma P FAILS on this core)\n"
               : "RESULT: every branch closed (Lemma P HOLDS on this core)\n");
  return found ? 1 : 0;
}
