/*
 * Modular kernel of the independent decider.  For each prime p (< 2^31) it computes, mod p,
 *   r0 = I1                       (cap-violation part of I)
 *   r1 = s_Z0 * J1                (cap-violation part of J0)
 *   r2 = s_ZD * J3                (region iii correction)
 *   r3 = s_Pi * J2                (region ii correction, rectangle)
 * exactly as decomp.py (the Fraction reference) defines them.  Big integers are reduced
 * with GMP; all arithmetic is scalar mod p (no polynomial/matrix library products).
 *
 * usage: kernel input.txt out.txt p1 p2 ...   (appends one line per prime: p r0 r1 r2 r3)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <gmp.h>
#include <time.h>

typedef uint64_t u64;
typedef unsigned __int128 u128;
static u64 P;
static inline u64 mm(u64 a, u64 b) { return (a * b) % P; }
static inline u64 ad(u64 a, u64 b) { u64 c = a + b; return c >= P ? c - P : c; }
static inline u64 sb(u64 a, u64 b) { return a >= b ? a - b : a + P - b; }
static u64 pw(u64 a, u64 e) { u64 r = 1; a %= P; while (e) { if (e & 1) r = mm(r, a); a = mm(a, a); e >>= 1; } return r; }
static u64 inv(u64 a) { return pw(a, P - 2); }
static u64 redi(long long v) { long long q = v % (long long)P; if (q < 0) q += P; return (u64)q; }

#define NF 2048
static u64 fact[NF], ifact[NF];

/* ---------------- data ---------------- */
static long gU, LU, tauU; static int KI, KJ;
static int npart; static int *plen, **pp, *psz;
static int ngs; static int *gsplitn, **gs1, **gs2; static int *isgam; static int *gsl; /* split list index by partition */
typedef struct { int n; int *g; int *e; mpz_t *v; } ZL;
static ZL Zl[3];
typedef struct { int n; int *b, *i, *j; mpz_t *v; } HL;
static HL HTl, H0Tl;
static int *pideg; /* per partition, -1 if not a Pi gamma */
static int npairs; static int *pb1, *pb2, *pfac, *png, **pgam; static long **pN;
typedef struct { int m, nw; int sg[4]; long d[4]; } WM;
typedef struct { int Kv; long Smax; int nm; WM *ms; } WS;
static WS W[3];
typedef struct { int m; long umax, Th; int nk; long eta[64]; } RM;
static int RKv, nrect; static RM *R;

static char *tok(FILE *f) { static char buf[1 << 16]; if (fscanf(f, "%65535s", buf) != 1) return NULL; return buf; }
static long rl(FILE *f) { char *t = tok(f); if (!t) { fprintf(stderr, "eof\n"); exit(1); } return atol(t); }
static void expect(FILE *f, const char *s) { char *t = tok(f); if (!t || strcmp(t, s)) { fprintf(stderr, "expected %s got %s\n", s, t ? t : "EOF"); exit(1); } }

static void load(const char *path) {
    FILE *f = fopen(path, "r"); if (!f) { perror(path); exit(1); }
    expect(f, "DATUM"); gU = rl(f); LU = rl(f); tauU = rl(f); KI = rl(f); KJ = rl(f);
    expect(f, "NPART"); npart = rl(f);
    plen = malloc(sizeof(int) * npart); pp = malloc(sizeof(int *) * npart); psz = malloc(sizeof(int) * npart);
    for (int i = 0; i < npart; i++) { plen[i] = rl(f); pp[i] = malloc(sizeof(int) * (plen[i] + 1)); psz[i] = 0; for (int j = 0; j < plen[i]; j++) { pp[i][j] = rl(f); psz[i] += pp[i][j]; } }
    expect(f, "SPLITS"); ngs = rl(f);
    gsplitn = calloc(npart, sizeof(int)); gs1 = calloc(npart, sizeof(int *)); gs2 = calloc(npart, sizeof(int *)); isgam = calloc(npart, sizeof(int));
    for (int t = 0; t < ngs; t++) { int gi = rl(f); int n = rl(f); isgam[gi] = 1; gsplitn[gi] = n; gs1[gi] = malloc(sizeof(int) * n); gs2[gi] = malloc(sizeof(int) * n); for (int s = 0; s < n; s++) { gs1[gi][s] = rl(f); gs2[gi][s] = rl(f); } }
    const char *zn[3] = {"ZI", "Z0", "ZD"};
    for (int z = 0; z < 3; z++) {
        expect(f, zn[z]); int n = rl(f); Zl[z].n = n; Zl[z].g = malloc(sizeof(int) * n); Zl[z].e = malloc(sizeof(int) * n); Zl[z].v = malloc(sizeof(mpz_t) * n);
        for (int t = 0; t < n; t++) { Zl[z].g[t] = rl(f); Zl[z].e[t] = rl(f); mpz_init_set_str(Zl[z].v[t], tok(f), 10); }
    }
    HL *hs[2] = {&HTl, &H0Tl}; const char *hn[2] = {"HT", "H0T"};
    for (int h = 0; h < 2; h++) {
        expect(f, hn[h]); int n = rl(f); HL *H = hs[h]; H->n = n; H->b = malloc(sizeof(int) * n); H->i = malloc(sizeof(int) * n); H->j = malloc(sizeof(int) * n); H->v = malloc(sizeof(mpz_t) * n);
        for (int t = 0; t < n; t++) { H->b[t] = rl(f); H->i[t] = rl(f); H->j[t] = rl(f); mpz_init_set_str(H->v[t], tok(f), 10); }
    }
    expect(f, "PIDEG"); { int n = rl(f); pideg = malloc(sizeof(int) * npart); for (int i = 0; i < npart; i++) pideg[i] = -1; for (int t = 0; t < n; t++) { int gi = rl(f); int d = rl(f); if (gi >= 0) pideg[gi] = d; } }
    expect(f, "PAIRS"); npairs = rl(f);
    pb1 = malloc(sizeof(int) * npairs); pb2 = malloc(sizeof(int) * npairs); pfac = malloc(sizeof(int) * npairs); png = malloc(sizeof(int) * npairs); pgam = malloc(sizeof(int *) * npairs); pN = malloc(sizeof(long *) * npairs);
    for (int t = 0; t < npairs; t++) { pb1[t] = rl(f); pb2[t] = rl(f); pfac[t] = rl(f); png[t] = rl(f); pgam[t] = malloc(sizeof(int) * (png[t] + 1)); pN[t] = malloc(sizeof(long) * (png[t] + 1)); for (int s = 0; s < png[t]; s++) { pgam[t][s] = rl(f); pN[t][s] = rl(f); } }
    const char *wn[3] = {"WIN0", "WIN1", "WIN2"};
    for (int w = 0; w < 3; w++) {
        expect(f, wn[w]); W[w].Kv = rl(f); W[w].Smax = rl(f); W[w].nm = rl(f); W[w].ms = malloc(sizeof(WM) * (W[w].nm + 1));
        for (int t = 0; t < W[w].nm; t++) { WM *x = &W[w].ms[t]; x->m = rl(f); x->nw = rl(f); for (int s = 0; s < x->nw; s++) { x->sg[s] = rl(f); x->d[s] = rl(f); } }
    }
    expect(f, "RECT"); RKv = rl(f); nrect = rl(f); R = malloc(sizeof(RM) * (nrect + 1));
    for (int t = 0; t < nrect; t++) { R[t].m = rl(f); R[t].umax = rl(f); R[t].Th = rl(f); R[t].nk = rl(f); for (int k = 0; k < R[t].nk; k++) R[t].eta[k] = rl(f); }
    expect(f, "END"); fclose(f);
}

/* ---------------- helpers mod p ---------------- */
static u64 binom(int n, int k) { if (k < 0 || k > n) return 0; return mm(fact[n], mm(ifact[k], ifact[n - k])); }
static u64 nmono(int pi, int n) { /* n!/(n-l)!/prod mult! */
    int l = plen[pi]; if (l > n) return 0; u64 r = mm(fact[n], ifact[n - l]);
    int i = 0; while (i < l) { int j = i; while (j < l && pp[pi][j] == pp[pi][i]) j++; r = mm(r, ifact[j - i]); i = j; }
    return r;
}
/* psi_e(w): coef[j+1] = e!/(e-j)! g^(e-j) */
static void psi(int e, u64 *out /* len e+2 */) { u64 gm = redi(gU); out[0] = 0; for (int j = 0; j <= e; j++) out[j + 1] = mm(mm(fact[e], ifact[e - j]), pw(gm, e - j)); }

/* large-group transform: A[r], r = 0..m+2|pi|, times nmono(pi,m) */
static int largeA(int pi, int m, u64 *A) {
    int deg = m - plen[pi]; int len = deg + 1; for (int r = 0; r < len; r++) A[r] = 0; A[deg] = 1;
    u64 tmp[512], ps[128];
    for (int t = 0; t < plen[pi]; t++) {
        int e = 2 * pp[pi][t]; psi(e, ps);
        int nl = len + e + 1; for (int r = 0; r < nl; r++) tmp[r] = 0;
        for (int a = 0; a < len; a++) if (A[a]) for (int b = 1; b <= e + 1; b++) tmp[a + b] = ad(tmp[a + b], mm(A[a], ps[b]));
        len = nl; memcpy(A, tmp, sizeof(u64) * len);
    }
    u64 M = nmono(pi, m); for (int r = 0; r < len; r++) A[r] = mm(A[r], M);
    return len; /* len-1 = m + 2|pi| */
}
/* tail at d: out[j+1] = sum_{r>=j+1} A[r] d^(r-1-j)/(r-1-j)! */
static void tailop(const u64 *A, int len, long d, u64 *out) {
    if (d == 0) { memcpy(out, A, sizeof(u64) * len); return; }
    u64 dd = redi(d); u64 dp[512]; dp[0] = 1; for (int n = 1; n < len; n++) dp[n] = mm(dp[n - 1], dd);
    for (int r = 0; r < len; r++) out[r] = 0;
    for (int r = 1; r < len; r++) if (A[r]) for (int j = 0; j < r; j++) out[j + 1] = ad(out[j + 1], mm(A[r], mm(dp[r - 1 - j], ifact[r - 1 - j])));
}
/* small-group transform: B[k][t], r2 = ns + t, t = 0..2|pi|, k = 0..kmax; times nmono(pi,ns) */
static void smallB(int pi, int ns, int kmax, u64 *B /* (kmax+1)*(2|pi|+1) */) {
    int S = 2 * psz[pi] + 1; int ell = plen[pi];
    /* work arrays over (k, r) with r = 0..ell+2|pi| (product of phi's), k <= min(ell,kmax) */
    int RW = ell + 2 * psz[pi] + 1; int KW = kmax + 1;
    u64 *cur = calloc((size_t)KW * RW, sizeof(u64)), *nx = calloc((size_t)KW * RW, sizeof(u64));
    cur[0] = 1; int curdeg = 0; u64 ps[128];
    for (int t = 0; t < ell; t++) {
        int e = 2 * pp[pi][t]; psi(e, ps);
        memset(nx, 0, sizeof(u64) * KW * RW);
        for (int k = 0; k < KW; k++) for (int r = 0; r <= curdeg; r++) { u64 c = cur[k * RW + r]; if (!c) continue;
            /* k=0 part: e! w^(e+1) */
            nx[k * RW + r + e + 1] = ad(nx[k * RW + r + e + 1], mm(c, fact[e]));
            if (k + 1 < KW) for (int b = 1; b <= e + 1; b++) nx[(k + 1) * RW + r + b] = sb(nx[(k + 1) * RW + r + b], mm(c, ps[b]));
        }
        curdeg += e + 1; u64 *tp = cur; cur = nx; nx = tp;
    }
    /* now cur has degrees ell..ell+2|pi| ; multiply by w^(n0) (1-z)^(n0), n0 = ns-ell */
    int n0 = ns - ell; u64 M = nmono(pi, ns);
    for (int k = 0; k < KW; k++) for (int t = 0; t < S; t++) {
        u64 s = 0;
        for (int k1 = 0; k1 <= k; k1++) { u64 c = cur[k1 * RW + ell + t]; if (!c) continue; int k2 = k - k1; if (k2 > n0) continue; u64 bc = binom(n0, k2); if (k2 & 1) s = sb(s, mm(c, bc)); else s = ad(s, mm(c, bc)); }
        B[k * S + t] = mm(s, M);
    }
    free(cur); free(nx);
}

/* ---------------- window piece ---------------- */
static u64 **Zd[3]; static int *Zemax[3];
static u64 window_piece(int w) {
    WS *ws = &W[w]; int Kv = ws->Kv; long Smax = ws->Smax; u64 total = 0;
    int maxsz = 0; for (int i = 0; i < npart; i++) if (psz[i] > maxsz) maxsz = psz[i];
    int AL = Kv + 2 * maxsz + 2;
    u64 *Araw = malloc(sizeof(u64) * npart * AL); int *Alen = malloc(sizeof(int) * npart);
    u64 *Atl = malloc(sizeof(u64) * npart * AL);
    int EM = 0; for (int i = 0; i < npart; i++) if (Zd[w][i] && Zemax[w][i] > EM) EM = Zemax[w][i];
    int RM_ = Kv + 2 * maxsz + 2;
    for (int t = 0; t < ws->nm; t++) {
        int m = ws->ms[t].m, ns = Kv - m;
        for (int i = 0; i < npart; i++) { Alen[i] = 0; if (plen[i] <= m) Alen[i] = largeA(i, m, Araw + (size_t)i * AL); }
        u64 accm = 0;
        for (int s = 0; s < ws->ms[t].nw; s++) {
            long d = ws->ms[t].d[s]; int sg = ws->ms[t].sg[s];
            long sig0 = (long)m * gU + d; if (sig0 >= Smax) continue;
            int kmax = (int)((Smax - sig0 - 1) / gU);
            /* Omega tables: Om[k][e][r] */
            int KW = kmax + 1;
            u64 *Om = calloc((size_t)KW * (EM + 1) * (RM_ + 1), sizeof(u64));
            for (int k = 0; k < KW; k++) {
                long sig = sig0 + (long)k * gU; long lam = LU - sig, T = Smax - sig;
                u64 RD[NF / 2], DD[NF / 2]; u64 rd = redi(lam - T), td = redi(T);
                u64 a = 1, b = 1; for (int n = 0; n < EM + RM_ + 2; n++) { RD[n] = mm(a, ifact[n]); DD[n] = mm(b, ifact[n]); a = mm(a, rd); b = mm(b, td); }
                if (lam - T == 0) { for (int n = 1; n < EM + RM_ + 2; n++) RD[n] = 0; RD[0] = 1; }
                for (int e = 0; e <= EM; e++) for (int r = 1; r <= RM_; r++) {
                    u64 s2 = 0; for (int j = 0; j <= e; j++) s2 = ad(s2, mm(RD[e - j], DD[r + j]));
                    Om[((size_t)k * (EM + 1) + e) * (RM_ + 1) + r] = mm(fact[e], s2);
                }
            }
            for (int i = 0; i < npart; i++) if (Alen[i]) tailop(Araw + (size_t)i * AL, Alen[i], d, Atl + (size_t)i * AL);
            /* B for all partitions with len <= ns */
            u64 **Bp = calloc(npart, sizeof(u64 *));
            for (int i = 0; i < npart; i++) if (plen[i] <= ns) { Bp[i] = malloc(sizeof(u64) * KW * (2 * psz[i] + 1)); smallB(i, ns, kmax, Bp[i]); }
            u64 accw = 0;
            u64 *Phi = malloc(sizeof(u64) * KW * (RM_ + 1));
            for (int gi = 0; gi < npart; gi++) {
                if (!Zd[w][gi]) continue; if (!isgam[gi]) continue;
                int rmax = Kv + 2 * psz[gi]; if (rmax > RM_) rmax = RM_;
                int rmin = 1 + ns; if (rmin < 1) rmin = 1;
                for (int k = 0; k < KW; k++) for (int r = rmin; r <= rmax; r++) {
                    u64 s2 = 0; for (int e = 0; e <= Zemax[w][gi]; e++) { u64 z = Zd[w][gi][e]; if (z) s2 = ad(s2, mm(z, Om[((size_t)k * (EM + 1) + e) * (RM_ + 1) + r])); }
                    Phi[k * (RM_ + 1) + r] = s2;
                }
                for (int sp = 0; sp < gsplitn[gi]; sp++) {
                    int g1 = gs1[gi][sp], g2 = gs2[gi][sp];
                    if (plen[g1] > m || plen[g2] > ns) continue;
                    u64 *A = Atl + (size_t)g1 * AL; int la = Alen[g1]; u64 *B = Bp[g2]; int S = 2 * psz[g2] + 1;
                    for (int k = 0; k < KW; k++) {
                        u64 *Ph = Phi + k * (RM_ + 1); u64 *Bk = B + k * S;
                        for (int tt = 0; tt < S; tt++) { u64 bb = Bk[tt]; if (!bb) continue; int r2 = ns + tt;
                            u128 acc = 0; for (int r1 = 1; r1 < la; r1++) acc += (u128)(A[r1] * Ph[r1 + r2]);
                            accw = ad(accw, mm(bb, (u64)(acc % P)));
                        }
                    }
                }
            }
            free(Phi);
            for (int i = 0; i < npart; i++) if (Bp[i]) free(Bp[i]); free(Bp); free(Om);
            accm = sg > 0 ? ad(accm, accw) : sb(accm, accw);
        }
        total = ad(total, mm(accm, binom(Kv, m)));
    }
    free(Araw); free(Alen); free(Atl);
    return total;
}

/* ---------------- Pi and the rectangle piece ---------------- */
#define DM 64
static u64 **Pi; /* per partition: (pideg+1)^2 dense, index i*(DM)+j  */
static u64 Gfun(int a, int b, u64 D, u64 Rm) { /* sum_j (R-D)^(b-j)/(b-j)! D^(a+j+1)/(a+j+1)! */
    u64 RD = sb(Rm, D); u64 s = 0;
    for (int j = 0; j <= b; j++) s = ad(s, mm(mm(pw(RD, b - j), ifact[b - j]), mm(pw(D, a + j + 1), ifact[a + j + 1])));
    return s;
}
static void build_Pi(void) {
    int nb = npart; u64 **ht = calloc(nb, sizeof(u64 *)), **h0 = calloc(nb, sizeof(u64 *));
    for (int t = 0; t < HTl.n; t++) { int b = HTl.b[t]; if (!ht[b]) ht[b] = calloc(DM * DM, sizeof(u64)); ht[b][HTl.i[t] * DM + HTl.j[t]] = mpz_fdiv_ui(HTl.v[t], P); }
    for (int t = 0; t < H0Tl.n; t++) { int b = H0Tl.b[t]; if (!h0[b]) h0[b] = calloc(DM * DM, sizeof(u64)); h0[b][H0Tl.i[t] * DM + H0Tl.j[t]] = mpz_fdiv_ui(H0Tl.v[t], P); }
    if (!Pi) Pi = calloc(npart, sizeof(u64 *));
    for (int i = 0; i < npart; i++) if (pideg[i] >= 0) { if (!Pi[i]) Pi[i] = malloc(sizeof(u64) * DM * DM); memset(Pi[i], 0, sizeof(u64) * DM * DM); }
    u64 *tmp = malloc(sizeof(u64) * DM * DM);
    for (int t = 0; t < npairs; t++) {
        int b1 = pb1[t], b2 = pb2[t];
        memset(tmp, 0, sizeof(u64) * DM * DM);
        for (int pass = 0; pass < 2; pass++) {
            u64 *x = pass ? h0[b1] : ht[b1], *y = pass ? h0[b2] : ht[b2]; if (!x || !y) continue;
            for (int i1 = 0; i1 < DM / 2; i1++) for (int j1 = 0; j1 + i1 < DM / 2; j1++) { u64 a = x[i1 * DM + j1]; if (!a) continue;
                for (int i2 = 0; i2 < DM / 2; i2++) for (int j2 = 0; j2 + i2 < DM / 2; j2++) { u64 b = y[i2 * DM + j2]; if (!b) continue;
                    u64 v = mm(a, b); int id = (i1 + i2) * DM + j1 + j2; tmp[id] = pass ? sb(tmp[id], v) : ad(tmp[id], v); } }
        }
        for (int s = 0; s < png[t]; s++) { int gi = pgam[t][s]; if (gi < 0 || !Pi[gi]) continue; u64 c = mm(redi(pN[t][s]), (u64)pfac[t]);
            int dg = pideg[gi]; for (int i = 0; i <= dg; i++) for (int j = 0; i + j <= dg; j++) { u64 v = tmp[i * DM + j]; if (v) Pi[gi][i * DM + j] = ad(Pi[gi][i * DM + j], mm(c, v)); } }
    }
    free(tmp); for (int i = 0; i < nb; i++) { free(ht[i]); free(h0[i]); } free(ht); free(h0);
}
static u64 rect_piece(void) {
    int Kv = RKv; u64 total = 0;
    int maxsz = 0; for (int i = 0; i < npart; i++) if (psz[i] > maxsz) maxsz = psz[i];
    int IM = 0; for (int i = 0; i < npart; i++) if (pideg[i] > IM) IM = pideg[i];
    int AL = Kv + 2 * maxsz + 2; u64 *A = malloc(sizeof(u64) * AL);
    u64 **Ai = calloc(npart, sizeof(u64 *)), **Bi = calloc(npart, sizeof(u64 *));
    int NP = AL + IM + 4;
    u64 *Gt = malloc(sizeof(u64) * (IM + 1) * AL);
    u64 *Et = malloc(sizeof(u64) * 64 * NP);
    for (int t = 0; t < nrect; t++) {
        int m = R[t].m, ns = Kv - m; int KW = R[t].nk; u64 Th = redi(R[t].Th);
        for (int i = 0; i < npart; i++) {
            if (!Ai[i]) Ai[i] = malloc(sizeof(u64) * (IM + 1)); if (!Bi[i]) Bi[i] = malloc(sizeof(u64) * (IM + 1));
            memset(Ai[i], 0, sizeof(u64) * (IM + 1)); memset(Bi[i], 0, sizeof(u64) * (IM + 1));
        }
        if (m > 0) { /* Gt[i][r1] = i! G(r1-1, i, umax, Th) */
            u64 um = redi(R[t].umax), RD = sb(Th, um);
            u64 *rdp = malloc(sizeof(u64) * NP), *dp = malloc(sizeof(u64) * NP);
            rdp[0] = 1; dp[0] = 1; for (int n = 1; n < NP; n++) { rdp[n] = mm(rdp[n - 1], RD); dp[n] = mm(dp[n - 1], um); }
            for (int i = 0; i <= IM; i++) for (int r1 = 1; r1 < AL; r1++) { u64 s = 0; int a = r1 - 1;
                for (int j = 0; j <= i; j++) s = ad(s, mm(mm(rdp[i - j], ifact[i - j]), mm(dp[a + j + 1], ifact[a + j + 1])));
                Gt[i * AL + r1] = mm(fact[i], s); }
            free(rdp); free(dp);
        }
        for (int k = 0; k < KW; k++) { u64 et = redi(R[t].eta[k]); u64 v = 1; for (int n = 0; n < NP; n++) { Et[k * NP + n] = mm(v, ifact[n]); v = mm(v, et); } }
        for (int i = 0; i < npart; i++) {
            if (plen[i] > m) continue;
            if (m == 0) { u64 v = 1; for (int ii = 0; ii <= IM; ii++) { Ai[i][ii] = v; v = mm(v, Th); } continue; }
            int la = largeA(i, m, A);
            for (int ii = 0; ii <= IM; ii++) { u128 s = 0;
                for (int r1 = 1; r1 < la; r1++) s += (u128)(A[r1] * Gt[ii * AL + r1]);
                Ai[i][ii] = (u64)(s % P); }
        }
        for (int i = 0; i < npart; i++) {
            if (plen[i] > ns) continue;
            int S = 2 * psz[i] + 1; u64 *B = malloc(sizeof(u64) * KW * S); smallB(i, ns, KW - 1, B);
            for (int jj = 0; jj <= IM; jj++) { u128 s = 0;
                for (int k = 0; k < KW; k++) for (int tt = 0; tt < S; tt++) { u64 b = B[k * S + tt]; if (!b) continue;
                    s += (u128)(b * Et[k * NP + jj + ns + tt]); }
                Bi[i][jj] = mm(fact[jj], (u64)(s % P)); }
            free(B);
        }
        u64 acc = 0;
        for (int gi = 0; gi < npart; gi++) {
            if (!Pi || !Pi[gi] || !isgam[gi]) continue; int dg = pideg[gi];
            for (int sp = 0; sp < gsplitn[gi]; sp++) { int g1 = gs1[gi][sp], g2 = gs2[gi][sp]; if (plen[g1] > m || plen[g2] > ns) continue;
                u64 *a = Ai[g1], *b = Bi[g2];
                for (int i = 0; i <= dg; i++) { if (!a[i]) continue; u128 s = 0; for (int j = 0; i + j <= dg; j++) s += (u128)(Pi[gi][i * DM + j] * b[j]);
                    acc = ad(acc, mm(a[i], (u64)(s % P))); }
            }
        }
        total = ad(total, mm(acc, binom(Kv, m)));
    }
    for (int i = 0; i < npart; i++) { free(Ai[i]); free(Bi[i]); } free(Ai); free(Bi); free(A); free(Gt); free(Et);
    return total;
}

static void reduce_Z(void) {
    for (int z = 0; z < 3; z++) {
        if (!Zd[z]) { Zd[z] = calloc(npart, sizeof(u64 *)); Zemax[z] = calloc(npart, sizeof(int)); }
        for (int i = 0; i < npart; i++) { if (Zd[z][i]) { free(Zd[z][i]); Zd[z][i] = NULL; } Zemax[z][i] = -1; }
        for (int t = 0; t < Zl[z].n; t++) { int gi = Zl[z].g[t]; if (Zl[z].e[t] > Zemax[z][gi]) Zemax[z][gi] = Zl[z].e[t]; }
        for (int i = 0; i < npart; i++) if (Zemax[z][i] >= 0) Zd[z][i] = calloc(Zemax[z][i] + 1, sizeof(u64));
        for (int t = 0; t < Zl[z].n; t++) Zd[z][Zl[z].g[t]][Zl[z].e[t]] = mpz_fdiv_ui(Zl[z].v[t], P);
    }
}

int main(int argc, char **argv) {
    if (argc < 4) { fprintf(stderr, "usage: kernel input out p...\n"); return 1; }
    load(argv[1]);
    for (int a = 3; a < argc; a++) {
        P = strtoull(argv[a], NULL, 10);
        clock_t c0 = clock();
        fact[0] = 1; for (int i = 1; i < NF; i++) fact[i] = mm(fact[i - 1], i);
        ifact[NF - 1] = inv(fact[NF - 1]); for (int i = NF - 1; i > 0; i--) ifact[i - 1] = mm(ifact[i], i);
        reduce_Z();
        u64 r0 = window_piece(0); clock_t c1 = clock();
        u64 r1 = window_piece(1);
        u64 r2 = window_piece(2); clock_t c2 = clock();
        build_Pi(); u64 r3 = rect_piece(); clock_t c3 = clock();
        FILE *o = fopen(argv[2], "a"); fprintf(o, "%llu %llu %llu %llu %llu\n", (unsigned long long)P, (unsigned long long)r0, (unsigned long long)r1, (unsigned long long)r2, (unsigned long long)r3); fclose(o);
        fprintf(stderr, "p=%llu done: I1 %.1fs, J1+J3 %.1fs, J2 %.1fs\n", (unsigned long long)P, (double)(c1 - c0) / CLOCKS_PER_SEC, (double)(c2 - c1) / CLOCKS_PER_SEC, (double)(c3 - c2) / CLOCKS_PER_SEC);
    }
    return 0;
}
