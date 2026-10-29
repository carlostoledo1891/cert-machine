/* bbmis.c - my own exact "is there an independent set of size >= t" decider (bitset B&B with greedy-colouring bound
   on the complement). Input (stdin): m, then m rows of '0'/'1' = adjacency of G (edges = conflicts), then t.
   Output: YES v1..vt  or  NO.  Written independently of ~/record-hunt (no shared code). */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#define W 4                      /* up to 256 vertices */
typedef struct { uint64_t w[W]; } bs;
static int m, t; static bs NB[256];   /* NB[v] = vertices compatible with v (non-adjacent in G, v excluded) */
static int stack_[256], depth, found, sol[256];
static inline int bs_empty(const bs*a){ for(int i=0;i<W;i++) if(a->w[i]) return 0; return 1; }
static inline int bs_first(const bs*a){ for(int i=0;i<W;i++) if(a->w[i]) return i*64+__builtin_ctzll(a->w[i]); return -1; }
static inline void bs_clr(bs*a,int v){ a->w[v>>6]&=~(1ULL<<(v&63)); }
static inline void bs_and(bs*r,const bs*a,const bs*b){ for(int i=0;i<W;i++) r->w[i]=a->w[i]&b->w[i]; }
static inline void bs_andnot(bs*r,const bs*a,const bs*b){ for(int i=0;i<W;i++) r->w[i]=a->w[i]&~b->w[i]; }
/* colour classes in the compatibility graph: each class must be a set of pairwise INCOMPATIBLE vertices
   (an independent set of the compatibility graph), so any compatible family uses each class at most once. */
static void search(bs P){
  int order[256], colour[256], q=0, k=0;
  bs U=P;
  while(!bs_empty(&U)){                     /* greedy colouring: build classes of pairwise-incompatible vertices */
    k++; bs Q=U;
    while(!bs_empty(&Q)){
      int v=bs_first(&Q); bs_clr(&Q,v); bs_clr(&U,v);
      bs tmp; bs_andnot(&tmp,&Q,&NB[v]); Q=tmp;   /* keep only vertices incompatible with v */
      order[q]=v; colour[q]=k; q++;
    }
  }
  for(int i=q-1;i>=0 && !found;i--){
    if(depth+colour[i]<t) return;           /* colour bound: vertices order[0..i] use <= colour[i] classes */
    int v=order[i]; stack_[depth++]=v;
    if(depth>=t){ memcpy(sol,stack_,sizeof(int)*depth); found=1; return; }
    bs NP; bs_and(&NP,&P,&NB[v]);
    if(!bs_empty(&NP)) search(NP);
    depth--; bs_clr(&P,v);
  }
}
int main(void){
  if(scanf("%d",&m)!=1||m>256) return 2; static char row[300];
  memset(NB,0,sizeof NB);
  for(int i=0;i<m;i++){ scanf("%s",row); for(int j=0;j<m;j++) if(j!=i && row[j]=='0') NB[i].w[j>>6]|=1ULL<<(j&63); }
  scanf("%d",&t);
  if(t<=0){ puts("YES"); return 0; }
  bs P; memset(&P,0,sizeof P); for(int v=0;v<m;v++) P.w[v>>6]|=1ULL<<(v&63);
  search(P);
  if(found){ printf("YES"); for(int i=0;i<t;i++) printf(" %d",sol[i]); puts(""); } else puts("NO");
  return 0;
}
