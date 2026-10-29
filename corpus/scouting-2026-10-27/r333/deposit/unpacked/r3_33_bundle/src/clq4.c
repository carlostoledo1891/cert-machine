/* clq.c - bitset branch-and-bound clique decision (BBMC-style greedy colouring bound).
   Usage: clq <graph.clq> <target> [excluded_file|-] [fix_vertex|-1]
   Graph: DIMACS "p edge N M" / "e u v" (1-based). Searches for a clique of size >= target
   among vertices not listed in excluded_file (whitespace-separated 1-based ids).
   If fix_vertex >= 1, only cliques containing that vertex are searched.
   Prints "FOUND v1 v2 ..." (1-based) or "NONE", plus node count. Exit 0. */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <time.h>
#define MAXN 512
#define W 8
typedef uint64_t bs[W];
static int N, nw, target;
static bs adj[MAXN];
static int R[MAXN];
static long long nodes;
static inline void bset(uint64_t *b,int v){b[v>>6]|=1ULL<<(v&63);}
static inline void bclr(uint64_t *b,int v){b[v>>6]&=~(1ULL<<(v&63));}
static inline int bempty(const uint64_t *b){for(int i=0;i<nw;i++) if(b[i]) return 0; return 1;}
static int search(const uint64_t *P0,int sz){
  nodes++;
  bs P,U,Q; int L[MAXN],C[MAXN],nl=0;
  memcpy(P,P0,sizeof(bs)); memcpy(U,P0,sizeof(bs));
  int kmin=target-sz; int col=0;
  while(!bempty(U)){
    col++; memcpy(Q,U,sizeof(bs));
    for(int i=0;i<nw;i++){
      while(Q[i]){
        int v=(i<<6)+__builtin_ctzll(Q[i]);
        bclr(U,v); bclr(Q,v);
        for(int j=0;j<nw;j++) Q[j]&=~adj[v][j];
        if(col>=kmin){L[nl]=v;C[nl]=col;nl++;}
      }
    }
  }
  for(int i=nl-1;i>=0;i--){
    if(sz+C[i]<target) return 0;
    int v=L[i]; R[sz]=v;
    if(sz+1>=target) return 1;
    bs NP; int ne=1;
    for(int j=0;j<nw;j++){NP[j]=P[j]&adj[v][j]; if(NP[j]) ne=0;}
    if(!ne && search(NP,sz+1)) return 1;
    bclr(P,v);
  }
  return 0;
}
int main(int argc,char**argv){
  if(argc<3){fprintf(stderr,"usage\n");return 2;}
  FILE*f=fopen(argv[1],"r"); if(!f){perror("open");return 2;}
  char line[256]; int M=0;
  while(fgets(line,sizeof line,f)){
    if(line[0]=='p'){sscanf(line,"p edge %d %d",&N,&M); if(N>MAXN){fprintf(stderr,"N too big\n");return 2;}}
    else if(line[0]=='e'){int u,v; sscanf(line,"e %d %d",&u,&v); u--;v--; if(u!=v){bset(adj[u],v);bset(adj[v],u);}}
  }
  fclose(f); nw=(N+63)/64; target=atoi(argv[2]);
  bs P; memset(P,0,sizeof P); for(int v=0;v<N;v++) bset(P,v);
  if(argc>3 && strcmp(argv[3],"-")){FILE*g=fopen(argv[3],"r"); int x; while(fscanf(g,"%d",&x)==1) bclr(P,x-1); fclose(g);}
  int fix=(argc>4)?atoi(argv[4]):-1;
  int ORD = getenv("NOORD")==NULL;
  if(argc>5 && argv[5][0]=='c'){ for(int u=0;u<N;u++){ for(int j=0;j<nw;j++) adj[u][j]=~adj[u][j]; for(int v=N;v<nw*64;v++) bclr(adj[u],v); bclr(adj[u],u);} }
  clock_t t0=clock(); int ok;
  static int lab[MAXN], inv_lab[MAXN]; int m=0;
  if(ORD){
    /* candidate set: P (and N(fix) if fix) */
    bs Q; memcpy(Q,P,sizeof(bs)); int base=0;
    if(fix>=1){ for(int j=0;j<nw;j++) Q[j]&=adj[fix-1][j]; base=1; }
    int vs[MAXN], nv=0; for(int v=0;v<N;v++) if((Q[v>>6]>>(v&63))&1ULL) vs[nv++]=v;
    int deg[MAXN], alive[MAXN], order[MAXN];
    for(int i=0;i<nv;i++){ alive[i]=1; deg[i]=0; for(int j=0;j<nv;j++) if(i!=j && ((adj[vs[i]][vs[j]>>6]>>(vs[j]&63))&1ULL)) deg[i]++; }
    for(int pos=nv-1;pos>=0;pos--){ int b=-1; for(int i=0;i<nv;i++) if(alive[i] && (b<0||deg[i]<deg[b])) b=i;
      order[pos]=b; alive[b]=0; for(int i=0;i<nv;i++) if(alive[i] && ((adj[vs[b]][vs[i]>>6]>>(vs[i]&63))&1ULL)) deg[i]--; }
    static bs A2[MAXN]; memset(A2,0,sizeof(bs)*MAXN);
    for(int a=0;a<nv;a++) for(int b2=0;b2<nv;b2++) if((adj[vs[order[a]]][vs[order[b2]]>>6]>>(vs[order[b2]]&63))&1ULL) bset(A2[a],b2);
    for(int a=0;a<nv;a++) lab[a]=vs[order[a]];
    memcpy(adj,A2,sizeof(bs)*MAXN); m=nv; int oldN=N; N=nv; nw=(N+63)/64; (void)oldN;
    bs NP; memset(NP,0,sizeof NP); for(int v=0;v<N;v++) bset(NP,v);
    int tgt0=target; target=target-base;
    ok = (target<=0) ? 1 : search(NP,0);
    if(ok){ printf("FOUND"); if(fix>=1) printf(" %d",fix); for(int i=0;i<target;i++) printf(" %d",lab[R[i]]+1); printf("\n"); }
    else printf("NONE\n");
    target=tgt0;
    fprintf(stderr,"nodes %lld time %.2fs (ordered, %d cand)\n",nodes,(double)(clock()-t0)/CLOCKS_PER_SEC,m);
    return 0;
  }
  if(fix>=1){ int v=fix-1; R[0]=v; bs NP; for(int j=0;j<nw;j++) NP[j]=P[j]&adj[v][j];
    if(target<=1) ok=1; else ok=search(NP,1); }
  else ok=search(P,0);
  if(ok){printf("FOUND"); for(int i=0;i<target;i++) printf(" %d",R[i]+1); printf("\n");}
  else printf("NONE\n");
  fprintf(stderr,"nodes %lld time %.2fs\n",nodes,(double)(clock()-t0)/CLOCKS_PER_SEC);
  return 0;
}
