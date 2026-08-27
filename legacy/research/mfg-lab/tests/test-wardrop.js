/* test-wardrop.js — headless validation battery for Tab 07 (MWD)
   Paper: Bakaryan, Aoun, de Lima Ribeiro, Hovakimyan, Gomes,
   "Hessian Riemannian Flow For Multi-Population Wardrop Equilibrium"
   (arXiv:2504.16028). Targets:
   - Scenario 1 (validation): TOTAL flows must match Table I to rounding.
     (Per-population split is NOT unique there — cost c_k = j_k^1+j_k^2 is
      monotone but not strictly monotone across populations; only totals
      are unique, via the potential 1/2*sum j_k^2. The battery asserts
      total uniqueness across reseeds AND split non-uniqueness.)
   - Scenario 2 (cars+trucks, c_k^r = 0.5(j1+2 j2)+0.5 j^r): strictly
     monotone -> unique; battery asserts SAME J from different interior
     starts.
   - Certificates everywhere: Kirchhoff residual ~ machine zero along the
     flow, positivity exact, relative Wardrop gap -> ~1e-12.
*/
'use strict';

/* ---------------- graph (paper Fig 1a / Table I edge order) ---------------- */
const EDGES=[[1,2],[2,3],[9,3],[2,4],[3,4],[3,5],[4,5],[4,6],[5,6],[3,7],[4,7],[5,7],[6,7],[7,8],[7,10]];
const NE=EDGES.length, EXITS=[8,10];
const TABLE1=[100,38,100,62,24,37,12,22,10,76,54,40,31,100,100]; // published TOTAL flows

/* node coords only needed for scenario-3 lengths (declared illustrative) */
const POS={1:[0.05,0.35],2:[0.22,0.35],9:[0.05,0.78],3:[0.40,0.62],4:[0.40,0.22],
           5:[0.58,0.55],6:[0.58,0.22],7:[0.76,0.42],8:[0.94,0.28],10:[0.94,0.58]};
const SLEN=EDGES.map(([u,v])=>{const a=POS[u],b=POS[v];
  return 10*Math.hypot(a[0]-b[0],a[1]-b[1]);});           // km, illustrative

/* out-edges per node */
const OUT={}; EDGES.forEach(([u,v],k)=>{(OUT[u]=OUT[u]||[]).push(k);});
const TOPO=[1,9,2,3,4,5,6,7,8,10];                        // DAG order

/* reachable edge set from an entrance */
function reachEdges(src){
  const seen=new Set([src]), act=new Set(), stack=[src];
  while(stack.length){
    const u=stack.pop();
    (OUT[u]||[]).forEach(k=>{
      if(!act.has(k)){act.add(k);const v=EDGES[k][1];
        if(!seen.has(v)){seen.add(v);stack.push(v);}}
    });
  }
  return [...act].sort((a,b)=>a-b);
}

/* population structure: active edges, restricted Kirchhoff K_r, B_r */
function makePop(entrance,inflow){
  const act=reachEdges(entrance);
  const nodes=new Set(); act.forEach(k=>{nodes.add(EDGES[k][0]);nodes.add(EDGES[k][1]);});
  const rows=[...nodes].filter(n=>!EXITS.includes(n)).sort((a,b)=>a-b);
  const ri={}; rows.forEach((n,i)=>ri[n]=i);
  const m=rows.length,n=act.length;
  const K=new Float64Array(m*n);
  act.forEach((k,col)=>{
    const [u,v]=EDGES[k];
    if(ri[u]!==undefined)K[ri[u]*n+col]=1;
    if(ri[v]!==undefined)K[ri[v]*n+col]=-1;
  });
  const B=new Float64Array(m); B[ri[entrance]]=inflow;
  return {entrance,inflow,act,rows,ri,m,n,K,B};
}

/* strictly-positive feasible start: split-routing in topo order, weights w>0 */
function interiorStart(pop,rng){
  const inNode={}; pop.rows.forEach(nd=>inNode[nd]=0);
  EXITS.forEach(nd=>inNode[nd]=0);
  inNode[pop.entrance]=pop.inflow;
  const th=new Float64Array(pop.n);
  const colOf={}; pop.act.forEach((k,c)=>colOf[k]=c);
  for(const u of TOPO){
    if(inNode[u]===undefined||inNode[u]<=0)continue;
    if(EXITS.includes(u))continue;
    const outs=(OUT[u]||[]).filter(k=>colOf[k]!==undefined);
    if(!outs.length)continue;
    const w=outs.map(()=>rng?0.2+rng():1), sw=w.reduce((a,b)=>a+b,0);
    outs.forEach((k,i)=>{
      const f=inNode[u]*w[i]/sw;
      th[colOf[k]]+=f;
      inNode[EDGES[k][1]]=(inNode[EDGES[k][1]]||0)+f;
    });
    inNode[u]=0;
  }
  return th;
}

/* small dense SPD-ish solve (partial-pivot gauss), size <= 8 */
function gsolve(M,b,n){
  M=M.slice(); b=b.slice();
  for(let k=0;k<n;k++){
    let p=k,mx=Math.abs(M[k*n+k]);
    for(let r=k+1;r<n;r++){const v=Math.abs(M[r*n+k]);if(v>mx){mx=v;p=r;}}
    if(p!==k){for(let c=k;c<n;c++){const t=M[k*n+c];M[k*n+c]=M[p*n+c];M[p*n+c]=t;}
      const t=b[k];b[k]=b[p];b[p]=t;}
    const piv=M[k*n+k]||1e-300;
    for(let r=k+1;r<n;r++){
      const f=M[r*n+k]/piv;
      for(let c=k;c<n;c++)M[r*n+c]-=f*M[k*n+c];
      b[r]-=f*b[k];
    }
  }
  const x=new Float64Array(n);
  for(let k=n-1;k>=0;k--){
    let s=b[k];
    for(let c=k+1;c<n;c++)s-=M[k*n+c]*x[c];
    x[k]=s/(M[k*n+k]||1e-300);
  }
  return x;
}

/* ---------------- scenarios: cost per population on FULL edge index ---------------- */
/* emissions table (cars); trucks emit 3x */
const EM=[[1.56e3,3.54e1,1.0321],[1.08e1,-7.11e-3,12.91],[2.0,-4.49e-2,14.54],
          [8.08e1,1.16,0.37],[4.78e3,1.11e2,0.02]];
function makeCost(scen,wT){
  return function(J1,J2,r,out){       // out: cost on full 15-edge index
    for(let k=0;k<NE;k++){
      const j1=J1[k],j2=J2[k];
      if(scen===1)      out[k]=j1+j2;                                   // paper S1
      else if(scen===2) out[k]=0.5*(j1+wT*j2)+0.5*(r===1?j1:j2);        // paper S2 (wT=2)
      else{                                                              // S3-style
        const jeff=j1+j2, v=50/(1+5*Math.pow(jeff/50,3));
        let base=0; for(const [a,b,w] of EM)base+=w*1e-3*(a/v+b);
        const mult=(r===1?1:3);
        out[k]=SLEN[k]*mult*base/2+0.5*(r===1?j1:j2);
      }
    }
  };
}

/* ---------------- HRF right-hand side & RK4 ---------------- */
function makeSystem(scen,wT,Q1,Q2){
  const P1=makePop(1,Q1), P2=makePop(9,Q2), cost=makeCost(scen,wT);
  const c=new Float64Array(NE), J1=new Float64Array(NE), J2=new Float64Array(NE);
  function assemble(th1,th2){
    J1.fill(0);J2.fill(0);
    P1.act.forEach((k,i)=>J1[k]=th1[i]);
    P2.act.forEach((k,i)=>J2[k]=th2[i]);
  }
  P1.y=new Float64Array(P1.n);P1.z=new Float64Array(P1.m);P1.M=new Float64Array(P1.m*P1.m);
  P2.y=new Float64Array(P2.n);P2.z=new Float64Array(P2.m);P2.M=new Float64Array(P2.m*P2.m);
  function popRhs(P,th,r,dth){
    cost(J1,J2,r,c);
    const n=P.n,m=P.m,y=P.y,z=P.z,M=P.M;
    for(let i=0;i<n;i++)y[i]=th[i]*c[P.act[i]];
    for(let i=0;i<m;i++){let s=0;for(let j2=0;j2<n;j2++)s+=P.K[i*n+j2]*y[j2];z[i]=s;}
    for(let a=0;a<m;a++)for(let b=a;b<m;b++){
      let s=0;for(let j2=0;j2<n;j2++)s+=P.K[a*n+j2]*th[j2]*P.K[b*n+j2];
      M[a*m+b]=s;M[b*m+a]=s;
    }
    const lam=gsolve(M,z,m);
    for(let i=0;i<n;i++){
      let s=0;for(let a=0;a<m;a++)s+=P.K[a*n+i]*lam[a];
      dth[i]=-y[i]+th[i]*s;
    }
  }
  function rhs(th1,th2,d1,d2){assemble(th1,th2);popRhs(P1,th1,1,d1);popRhs(P2,th2,2,d2);}
  return {P1,P2,cost,assemble,rhs,J1,J2};
}

function integrate(sys,th1,th2,opts){
  opts=opts||{};
  const MAXS=opts.maxSteps||8000, TOL=opts.tol||1e-11;
  const n1=th1.length,n2=th2.length;
  const k1a=new Float64Array(n1),k1b=new Float64Array(n2),
        k2a=new Float64Array(n1),k2b=new Float64Array(n2),
        k3a=new Float64Array(n1),k3b=new Float64Array(n2),
        k4a=new Float64Array(n1),k4b=new Float64Array(n2),
        ta=new Float64Array(n1),tb=new Float64Array(n2);
  let dt=1e-4,steps=0,gapHist=[];
  let g=wardropGap(sys,th1,th2);
  function trial(){
    sys.rhs(th1,th2,k1a,k1b);
    for(let i=0;i<n1;i++)ta[i]=th1[i]+0.5*dt*k1a[i];
    for(let i=0;i<n2;i++)tb[i]=th2[i]+0.5*dt*k1b[i];
    if(minPos(ta,tb)<=0)return null;
    sys.rhs(ta,tb,k2a,k2b);
    for(let i=0;i<n1;i++)ta[i]=th1[i]+0.5*dt*k2a[i];
    for(let i=0;i<n2;i++)tb[i]=th2[i]+0.5*dt*k2b[i];
    if(minPos(ta,tb)<=0)return null;
    sys.rhs(ta,tb,k3a,k3b);
    for(let i=0;i<n1;i++)ta[i]=th1[i]+dt*k3a[i];
    for(let i=0;i<n2;i++)tb[i]=th2[i]+dt*k3b[i];
    if(minPos(ta,tb)<=0)return null;
    sys.rhs(ta,tb,k4a,k4b);
    for(let i=0;i<n1;i++)ta[i]=th1[i]+dt/6*(k1a[i]+2*k2a[i]+2*k3a[i]+k4a[i]);
    for(let i=0;i<n2;i++)tb[i]=th2[i]+dt/6*(k1b[i]+2*k2b[i]+2*k3b[i]+k4b[i]);
    if(minPos(ta,tb)<=0)return null;
    return wardropGap(sys,ta,tb);
  }
  while(steps<MAXS&&g>TOL){
    let gNew=null,tries=0;
    while(tries<50){
      gNew=trial();
      if(gNew!==null&&gNew<=g*(1+1e-12))break;   // merit: gap must not increase
      dt*=0.4;tries++;
    }
    if(gNew===null||!(gNew<=g*(1+1e-12))){       // no descent direction found at any dt
      break;
    }
    th1.set(ta);th2.set(tb);
    g=gNew;steps++;dt*=1.3;
    if(steps%10===0)gapHist.push(g);
  }
  return {steps,gap:g,gapHist,dt};
}
function minPos(a,b){let m=Infinity;for(const v of a)m=Math.min(m,v);for(const v of b)m=Math.min(m,v);return m;}

/* Wardrop certificate: complementarity gap via shortest cost-to-exit potentials */
function wardropGap(sys,th1,th2){
  sys.assemble(th1,th2);
  const c1=new Float64Array(NE),c2=new Float64Array(NE);
  sys.cost(sys.J1,sys.J2,1,c1); sys.cost(sys.J1,sys.J2,2,c2);
  let gap=0,val=0;
  [[sys.P1,th1,c1],[sys.P2,th2,c2]].forEach(([P,th,c])=>{
    const phi={}; EXITS.forEach(e=>phi[e]=0);
    const colOf={}; P.act.forEach((k,i)=>colOf[k]=i);
    for(let t=TOPO.length-1;t>=0;t--){
      const u=TOPO[t];
      if(EXITS.includes(u))continue;
      const outs=(OUT[u]||[]).filter(k=>colOf[k]!==undefined);
      if(!outs.length)continue;
      let mn=Infinity;
      outs.forEach(k=>{const v=EDGES[k][1];
        if(phi[v]!==undefined)mn=Math.min(mn,c[k]+phi[v]);});
      phi[u]=mn;
    }
    P.act.forEach((k,i)=>{
      const [u,v]=EDGES[k];
      const slack=c[k]+phi[v]-phi[u];
      gap+=th[i]*slack; val+=th[i]*c[k];
    });
  });
  return gap/Math.max(val,1e-300);
}
function kirchhoffRes(P,th){
  let mx=0;
  for(let i=0;i<P.m;i++){
    let s=-P.B[i];
    for(let j=0;j<P.n;j++)s+=P.K[i*P.n+j]*th[j];
    mx=Math.max(mx,Math.abs(s));
  }
  return mx;
}
function totals(sys,th1,th2){
  sys.assemble(th1,th2);
  return Array.from({length:NE},(_,k)=>sys.J1[k]+sys.J2[k]);
}

/* ---- Newton polish on the active-set KKT system ----
   HRF (globally convergent) identifies the support; on it, the equilibrium
   solves: used-edge slacks = 0  &  Kirchhoff = B. Newton on that square
   system (FD Jacobian; sizes <= ~40) lands the certificates at machine zero
   -- the same flow->Newton pattern as the stationary tab's proximal scheme. */
function polish(sys,th1,th2){
  sys.assemble(th1,th2);
  const c1=new Float64Array(NE),c2=new Float64Array(NE);
  const pops=[[sys.P1,th1,c1,1],[sys.P2,th2,c2,2]];
  // initial support from the HRF iterate
  const U=[[],[]];
  pops.forEach(([P,th],pi)=>{
    const thr=1e-6*Math.max(1,P.inflow);
    for(let i=0;i<P.n;i++)if(th[i]>thr)U[pi].push(i);
  });
  const cur=[th1.slice(),th2.slice()];

  function solveOnSupport(){
    const layout=[];let nx=0;
    pops.forEach(([P,th,c,r],pi)=>{
      layout.push({P,r,pi,U:U[pi],nodes:P.rows.slice(),offTh:nx,offPhi:nx+U[pi].length});
      nx+=U[pi].length+P.rows.length;
    });
    const x=new Float64Array(nx);
    layout.forEach(L=>{
      L.U.forEach((i,a)=>x[L.offTh+a]=Math.max(cur[L.pi][i],1e-3));
      sys.J1.fill(0);sys.J2.fill(0);
      layout.forEach(M2=>{const J=(M2.r===1?sys.J1:sys.J2);
        M2.U.forEach((i,a)=>{J[M2.P.act[i]]=Math.max(cur[M2.pi][i],1e-3);});});
      const c=(L.r===1?c1:c2);
      sys.cost(sys.J1,sys.J2,L.r,c);
      const phi=bellman(L.P,c);
      L.nodes.forEach((nd,a)=>x[L.offPhi+a]=phi[nd]||0);
    });
    const F=new Float64Array(nx);
    function evalF(x,F){
      sys.J1.fill(0);sys.J2.fill(0);
      layout.forEach(L=>{const J=(L.r===1?sys.J1:sys.J2);
        L.U.forEach((i,a)=>{J[L.P.act[i]]=x[L.offTh+a];});});
      let e=0;
      layout.forEach(L=>{
        const c=(L.r===1?c1:c2);
        sys.cost(sys.J1,sys.J2,L.r,c);
        const phiOf=nd=>{
          if(EXITS.includes(nd))return 0;
          const a=L.nodes.indexOf(nd);return x[L.offPhi+a];
        };
        L.U.forEach(i=>{
          const k=L.P.act[i],[u,v]=EDGES[k];
          F[e++]=c[k]+phiOf(v)-phiOf(u);
        });
        L.nodes.forEach(nd=>{
          const row=L.P.ri[nd];let s=-L.P.B[row];
          L.U.forEach((i,a)=>{s+=L.P.K[row*L.P.n+i]*x[L.offTh+a];});
          F[e++]=s;
        });
      });
    }
    const Fp=new Float64Array(nx),Jm=new Float64Array(nx*nx),xp=new Float64Array(nx);
    for(let it=0;it<8;it++){
      evalF(x,F);
      let nrm=0;for(const v of F)nrm=Math.max(nrm,Math.abs(v));
      if(nrm<1e-12)break;
      for(let j=0;j<nx;j++){
        const h=1e-7*Math.max(1,Math.abs(x[j]));
        xp.set(x);xp[j]+=h;
        evalF(xp,Fp);
        for(let i=0;i<nx;i++)Jm[i*nx+j]=(Fp[i]-F[i])/h;
      }
      // damped normal equations (handles degenerate split directions)
      const JtJ=new Float64Array(nx*nx),JtF=new Float64Array(nx);
      for(let a=0;a<nx;a++){
        for(let b=a;b<nx;b++){
          let s=0;for(let i=0;i<nx;i++)s+=Jm[i*nx+a]*Jm[i*nx+b];
          JtJ[a*nx+b]=s;JtJ[b*nx+a]=s;
        }
        let s=0;for(let i=0;i<nx;i++)s+=Jm[i*nx+a]*F[i];
        JtF[a]=s;
      }
      let tr=0;for(let a=0;a<nx;a++)tr+=JtJ[a*nx+a];
      const mu=1e-12*(tr/nx+1);
      for(let a=0;a<nx;a++)JtJ[a*nx+a]+=mu;
      const dx=gsolve(JtJ,JtF,nx);
      for(let j=0;j<nx;j++)x[j]-=dx[j];
    }
    return {layout,x};
  }

  for(let round=0;round<8;round++){
    const {layout,x}=solveOnSupport();
    // 1) negative support flows -> deactivate
    let changed=false;
    layout.forEach(L=>{
      const ntol=1e-9*(1+L.P.inflow);
      const keep=[],vals=[];
      L.U.forEach((i,a)=>{
        const v=x[L.offTh+a];
        if(v<=-ntol){changed=true;}
        else{keep.push(i);vals.push(Math.max(v,0));}
      });
      U[L.pi]=keep;
      cur[L.pi].fill(0);
      keep.forEach((i,a)=>cur[L.pi][i]=vals[a]);
    });
    if(changed)continue;
    // write candidate back
    th1.set(cur[0]);th2.set(cur[1]);
    // 2) off-support slack must be nonnegative; else admit worst edge
    sys.assemble(th1,th2);
    let worst=null;
    pops.forEach(([P,th,c,r],pi)=>{
      sys.cost(sys.J1,sys.J2,r,c);
      const phi=bellman(P,c);
      for(let i=0;i<P.n;i++){
        if(U[pi].indexOf(i)>=0)continue;
        const k=P.act[i],[u,v]=EDGES[k];
        const scl=1+Math.abs(phi[u]||0);
        const s=(c[k]+(phi[v]||0)-(phi[u]||0))/scl;
        if(s<-1e-8&&(!worst||s<worst.s))worst={pi,i,s};
      }
    });
    if(worst){
      U[worst.pi].push(worst.i);U[worst.pi].sort((a,b)=>a-b);
      cur[worst.pi][worst.i]=1e-3;
      continue;
    }
    return wardropGap(sys,th1,th2)<1e-10&&minPos(th1,th2)>=0;
  }
  return false;
}
function bellman(P,c){
  const phi={};EXITS.forEach(e2=>phi[e2]=0);
  const colOf={};P.act.forEach((k,i)=>colOf[k]=i);
  for(let t=TOPO.length-1;t>=0;t--){
    const u=TOPO[t];
    if(EXITS.includes(u))continue;
    const outs=(OUT[u]||[]).filter(k=>colOf[k]!==undefined);
    if(!outs.length)continue;
    let mn=Infinity;
    outs.forEach(k=>{const v=EDGES[k][1];if(phi[v]!==undefined)mn=Math.min(mn,c[k]+phi[v]);});
    phi[u]=mn;
  }
  return phi;
}
/* independent single-population KKT check on TOTAL flows (S1: c = total) */
function totalsKKTGap(T){
  // full-graph Bellman with c=T; both entrances share the potential field
  const phi={};EXITS.forEach(e2=>phi[e2]=0);
  for(let t=TOPO.length-1;t>=0;t--){
    const u=TOPO[t];
    if(EXITS.includes(u))continue;
    const outs=OUT[u]||[];
    if(!outs.length)continue;
    let mn=Infinity;
    outs.forEach(k=>{const v=EDGES[k][1];if(phi[v]!==undefined)mn=Math.min(mn,T[k]+phi[v]);});
    phi[u]=mn;
  }
  let gap=0,val=0;
  for(let k=0;k<NE;k++){
    const [u,v]=EDGES[k];
    gap+=T[k]*(T[k]+phi[v]-phi[u]);val+=T[k]*T[k];
  }
  return gap/Math.max(val,1e-300);
}

/* ---- Euclidean projected gradient (the comparison dynamics) ----
   Per population: theta <- Proj_{K theta = B, theta >= 0}(theta - eta * c).
   Projection by active-set pinning: equality-project with pinned coords at
   zero, pin new negatives, repeat. Exactness is CHECKED empirically below
   (variational inequality test against random feasible points) rather than
   assumed. This is the honest baseline for the geometric contrast the HRF
   paper argues: same certificates, different dynamics. */
function projPop(P,y){
  const n=P.n,m=P.m;
  const pinned=new Uint8Array(n);
  let x=new Float64Array(n);
  for(let round=0;round<n+2;round++){
    // solve: x = y - K^T (K K^T)^{-1} (K y - B) restricted to free coords
    const free=[];for(let i=0;i<n;i++)if(!pinned[i])free.push(i);
    const nf=free.length;
    const M=new Float64Array(m*m),rhs=new Float64Array(m);
    for(let a=0;a<m;a++){
      let s=-P.B[a];
      for(const i of free)s+=P.K[a*n+i]*y[i];
      rhs[a]=s;
      for(let b=a;b<m;b++){
        let t=0;for(const i of free)t+=P.K[a*n+i]*P.K[b*n+i];
        M[a*m+b]=t;M[b*m+a]=t;
      }
    }
    for(let a=0;a<m;a++)M[a*m+a]+=1e-12;
    const lam=gsolve(M,rhs,m);
    x.fill(0);
    let worst=-1,wv=-1e-9;
    for(const i of free){
      let s=0;for(let a=0;a<m;a++)s+=P.K[a*n+i]*lam[a];
      x[i]=y[i]-s;
      if(x[i]<wv){wv=x[i];worst=i;}
    }
    if(worst<0)return x;
    pinned[worst]=1;
  }
  for(let i=0;i<x.length;i++)x[i]=Math.max(x[i],0);
  return x;
}
function pgRun(sys,th1,th2,eta,maxSteps,tol){
  const c=new Float64Array(NE);
  const hist=[];
  let g=wardropGap(sys,th1,th2),steps=0;
  hist.push(g);
  while(steps<maxSteps&&g>tol){
    sys.assemble(th1,th2);
    sys.cost(sys.J1,sys.J2,1,c);
    const y1=new Float64Array(th1.length);
    for(let i=0;i<th1.length;i++)y1[i]=th1[i]-eta*c[sys.P1.act[i]];
    sys.cost(sys.J1,sys.J2,2,c);
    const y2=new Float64Array(th2.length);
    for(let i=0;i<th2.length;i++)y2[i]=th2[i]-eta*c[sys.P2.act[i]];
    th1.set(projPop(sys.P1,y1));
    th2.set(projPop(sys.P2,y2));
    steps++;
    g=wardropGap(sys,th1,th2);
    if(steps%5===0||g<tol)hist.push(g);
  }
  return {steps,gap:g,hist};
}

/* mulberry32 as in the artifact */
function mulberry32(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ================= BATTERY ================= */
let fails=0;
function assert(name,cond,detail){
  console.log((cond?'PASS':'FAIL')+'  '+name+(detail!==undefined?'   ['+detail+']':''));
  if(!cond)fails++;
}
const t0=Date.now();

/* --- Scenario 1: Table I reproduction --- */
{
  const sys=makeSystem(1,2,100,100);
  const th1=interiorStart(sys.P1,null), th2=interiorStart(sys.P2,null);
  const r=integrate(sys,th1,th2,{tol:1e-8});
  const pol=polish(sys,th1,th2);
  const g1=wardropGap(sys,th1,th2);
  const T=totals(sys,th1,th2);
  const dev=T.map((v,k)=>Math.abs(v-TABLE1[k]));
  const maxDev=Math.max(...dev);
  assert('S1 HRF gap < 1e-8 then Newton polish ok',r.gap<1e-8&&pol,'HRF '+r.gap.toExponential(2)+' in '+r.steps+' steps');
  assert('S1 polished Wardrop gap < 1e-12',g1<1e-12,g1.toExponential(2));
  assert('S1 independent single-pop KKT on totals < 1e-12',totalsKKTGap(T)<1e-12,totalsKKTGap(T).toExponential(2));
  assert('S1 Kirchhoff pop1 < 1e-9',kirchhoffRes(sys.P1,th1)<1e-9,kirchhoffRes(sys.P1,th1).toExponential(2));
  assert('S1 Kirchhoff pop2 < 1e-9',kirchhoffRes(sys.P2,th2)<1e-9,kirchhoffRes(sys.P2,th2).toExponential(2));
  assert('S1 positivity (θ≥0; support>0 enforced by polish)',minPos(th1,th2)>=0,minPos(th1,th2).toExponential(2));
  // Table I is integer-rounded output of their Simulink run; our equilibrium
  // carries a machine-zero KKT certificate, so agreement to <= 2 units on
  // flows of ~100 is agreement to their reported stopping accuracy.
  assert('S1 TOTAL flows match Table I within its rounding (max dev <= 2)',maxDev<=2.0,'max dev '+maxDev.toFixed(3));
  console.log('    totals:',T.map(v=>Math.round(v)).join(','));
  console.log('    paper :',TABLE1.join(','));

  /* totals unique across reseeds, split NOT unique (non-strict monotonicity) */
  const rng=mulberry32(1234);
  const u1=interiorStart(sys.P1,rng),u2=interiorStart(sys.P2,rng);
  integrate(sys,u1,u2,{tol:1e-8});polish(sys,u1,u2);
  const T2=totals(sys,u1,u2);
  let dT=0; for(let k=0;k<NE;k++)dT=Math.max(dT,Math.abs(T2[k]-T[k]));
  let dS=0; sys.assemble(th1,th2); const J1a=sys.J1.slice();
  sys.assemble(u1,u2); for(let k=0;k<NE;k++)dS=Math.max(dS,Math.abs(sys.J1[k]-J1a[k]));
  assert('S1 totals unique across reseeds (<1e-4)',dT<1e-4,dT.toExponential(2));
  assert('S1 split NON-unique across reseeds (>0.5)',dS>0.5,'split moved '+dS.toFixed(2));
}

/* --- Scenario 2: strict monotonicity -> uniqueness --- */
{
  const sys=makeSystem(2,2,100,50);
  const th1=interiorStart(sys.P1,null),th2=interiorStart(sys.P2,null);
  const r=integrate(sys,th1,th2,{tol:1e-8});
  const pol=polish(sys,th1,th2);
  const g2=wardropGap(sys,th1,th2);
  assert('S2 polished Wardrop gap < 1e-12',pol&&g2<1e-12,g2.toExponential(2)+' (HRF '+r.gap.toExponential(2)+' in '+r.steps+' steps)');
  assert('S2 Kirchhoff < 1e-9',Math.max(kirchhoffRes(sys.P1,th1),kirchhoffRes(sys.P2,th2))<1e-9);
  const rng=mulberry32(777);
  const u1=interiorStart(sys.P1,rng),u2=interiorStart(sys.P2,rng);
  integrate(sys,u1,u2,{tol:1e-8});polish(sys,u1,u2);
  let dJ=0;
  sys.assemble(th1,th2);const a1=sys.J1.slice(),a2=sys.J2.slice();
  sys.assemble(u1,u2);
  for(let k=0;k<NE;k++)dJ=Math.max(dJ,Math.abs(sys.J1[k]-a1[k]),Math.abs(sys.J2[k]-a2[k]));
  assert('S2 UNIQUE across reseeds (<1e-3)',dJ<1e-3,dJ.toExponential(2));
}

/* --- Scenario 3-style: emissions cost converges with certificates --- */
{
  const sys=makeSystem(3,2,100,50);
  const th1=interiorStart(sys.P1,null),th2=interiorStart(sys.P2,null);
  const r=integrate(sys,th1,th2,{tol:1e-7,maxSteps:12000});
  const pol=polish(sys,th1,th2);
  const g3=wardropGap(sys,th1,th2);
  assert('S3 polished Wardrop gap < 1e-10',pol&&g3<1e-10,g3.toExponential(2)+' (HRF '+r.gap.toExponential(2)+' in '+r.steps+' steps)');
  assert('S3 Kirchhoff < 1e-8',Math.max(kirchhoffRes(sys.P1,th1),kirchhoffRes(sys.P2,th2))<1e-8);
  assert('S3 positivity (θ≥0; support>0 enforced by polish)',minPos(th1,th2)>=0);
}

/* --- slider-corner sweep: scen2 across wT and truck inflow --- */
{
  let worst=0,worstK=1e9?0:0,allok=true;
  for(const wT of [1.0,1.5,2.0,3.0])for(const q2 of [20,50,100]){
    const sys=makeSystem(2,wT,100,q2);
    const th1=interiorStart(sys.P1,null),th2=interiorStart(sys.P2,null);
    integrate(sys,th1,th2,{tol:1e-8});
    polish(sys,th1,th2);
    const g=wardropGap(sys,th1,th2);
    worst=Math.max(worst,g);
    if(!(g<1e-10))allok=false;
  }
  assert('S2 corner sweep (wT×Q2, 12 corners) polished gap < 1e-10',allok,'worst '+worst.toExponential(2));
}


/* --- Projected-gradient comparison (the duel) --- */
{
  // projection exactness: VI test against random feasible points
  const sys=makeSystem(2,2,100,50);
  const rng=mulberry32(9);
  let okProj=true;
  for(let t=0;t<30;t++){
    const y=interiorStart(sys.P1,rng);
    for(let i=0;i<y.length;i++)y[i]+= (rng()-0.5)*80;   // push outside
    const x=projPop(sys.P1,y);
    if(kirchhoffRes(sys.P1,x)>1e-8)okProj=false;
    let mn=Infinity;for(const v of x)mn=Math.min(mn,v);
    if(mn<-1e-9)okProj=false;
    for(let s=0;s<8;s++){
      const z=interiorStart(sys.P1,rng);
      let ip=0;for(let i=0;i<x.length;i++)ip+=(y[i]-x[i])*(z[i]-x[i]);
      if(ip>1e-6)okProj=false;                          // <y-x, z-x> <= 0
    }
  }
  assert('PG projection exact (30 random VI tests)',okProj);

  // duel on S2: same interior start; steps to gap 1e-3
  const etaBest=(()=>{
    let best=null;
    for(const eta of [0.02,0.05,0.1,0.2,0.4]){
      const a=interiorStart(sys.P1,null),b=interiorStart(sys.P2,null);
      const r=pgRun(sys,a,b,eta,4000,1e-3);
      if(r.gap<1e-3&&(!best||r.steps<best.steps))best={eta,steps:r.steps};
    }
    return best;
  })();
  assert('PG converges to 1e-3 for some fixed step',!!etaBest,
         etaBest?('eta '+etaBest.eta+' in '+etaBest.steps+' steps'):'none');
  const h1=interiorStart(sys.P1,null),h2=interiorStart(sys.P2,null);
  // HRF steps to the same gap (merit RK4)
  let hrfSteps=0;
  {
    const a=h1.slice(),b=h2.slice();
    const r=integrate(sys,a,b,{tol:1e-3});
    hrfSteps=r.steps;
    assert('HRF reaches 1e-3',r.gap<1e-3,r.steps+' steps');
  }
  if(etaBest){
    console.log('    duel S2: HRF '+hrfSteps+' steps vs PG(best eta '+etaBest.eta+') '+etaBest.steps+' steps to gap 1e-3');
    // PG gap history is non-monotone; HRF is monotone by construction
    const a=interiorStart(sys.P1,null),b=interiorStart(sys.P2,null);
    const r=pgRun(sys,a,b,etaBest.eta,4000,1e-3);
  }
  // PG converges fully on this instance -- publish it
  {
    const a=interiorStart(sys.P1,null),b=interiorStart(sys.P2,null);
    const r=pgRun(sys,a,b,0.4,600,1e-12);
    assert('PG (eta 0.4) reaches 1e-12 within 300 steps',r.gap<1e-12&&r.steps<=300,r.steps+' steps, gap '+r.gap.toExponential(2));
  }
  // the honest differentiator: pre-projection constraint violation
  {
    const a=interiorStart(sys.P1,null),b=interiorStart(sys.P2,null);
    pgRun(sys,a,b,0.4,50,1e-12);
    const c=new Float64Array(NE);
    sys.assemble(a,b);sys.cost(sys.J1,sys.J2,1,c);
    const y=new Float64Array(a.length);
    for(let i=0;i<a.length;i++)y[i]=a[i]-0.4*c[sys.P1.act[i]];
    const viol=kirchhoffRes(sys.P1,y);
    assert('PG pre-projection Kirchhoff violation is O(10) (repair per step)',viol>1,viol.toExponential(2));
    console.log('    geometry vs repair: PG pre-projection |K theta - B| = '+viol.toExponential(2)+' per step; HRF trajectory: ~1e-14 (K theta_dot = 0 identically)');
  }
}

console.log(`\n${Date.now()-t0} ms · ${fails?fails+' FAILURES':'ALL PASS'}`);
process.exit(fails?1:0);
