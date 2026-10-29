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
  if(argc>5 && argv[5][0]=='c'){ for(int u=0;u<N;u++){ for(int j=0;j<nw;j++) adj[u][j]=~adj[u][j]; for(int v=N;v<nw*64;v++) bclr(adj[u],v); bclr(adj[u],u);} }
  clock_t t0=clock(); int ok;
  if(fix>=1){ int v=fix-1; R[0]=v; bs NP; for(int j=0;j<nw;j++) NP[j]=P[j]&adj[v][j];
    if(target<=1) ok=1; else ok=search(NP,1); }
  else ok=search(P,0);
  if(ok){printf("FOUND"); for(int i=0;i<target;i++) printf(" %d",R[i]+1); printf("\n");}
  else printf("NONE\n");
  int MR=(argc>6)?atoi(argv[6]):0;
  if(ok && MR>0 && fix>=1){
    static bs A0[MAXN]; memcpy(A0,adj,sizeof(bs)*N); int perm[MAXN], ip[MAXN]; srand(12345);
    for(int rep=0;rep<MR;rep++){
      for(int i=0;i<N;i++) perm[i]=i;
      for(int i=N-1;i>0;i--){int j=rand()%(i+1); int x=perm[i];perm[i]=perm[j];perm[j]=x;}
      for(int i=0;i<N;i++) ip[perm[i]]=i;           /* new label of old vertex v is ip[v] */
      for(int u=0;u<N;u++){ memset(adj[ip[u]],0,sizeof(bs)); for(int v=0;v<N;v++) if((A0[u][v>>6]>>(v&63))&1ULL) bset(adj[ip[u]],ip[v]); }
      int v=ip[fix-1]; R[0]=v; bs NP; for(int j=0;j<nw;j++) NP[j]=P[j]&adj[v][j];
      /* P is all-ones on 0..N-1 (no exclusions in this mode) */
      nodes=0; if(search(NP,1)){ printf("FOUND"); for(int i=0;i<target;i++) printf(" %d",perm[R[i]]+1); printf("\n"); }
    }
  }
  fprintf(stderr,"nodes %lld time %.2fs\n",nodes,(double)(clock()-t0)/CLOCKS_PER_SEC);
  return 0;
}
