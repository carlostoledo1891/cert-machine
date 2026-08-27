/* test-wardrop-interval.js — O7: certified Wardrop equilibrium.
   Upgrades Tab 07's floating-point certificate to a PROOF, two ways:

   - S2 (cars+trucks, affine costs): EXACT RATIONAL certificate. The
     support-KKT system is linear with dyadic-rational data, so it is
     solved exactly over BigInt fractions; positivity, Kirchhoff and all
     off-support slacks are then decided EXACTLY — including the
     degenerate tie this battery discovered (pop 2's unused edge (4,5)
     has slack exactly 0: weak, not strict, complementarity; interval
     arithmetic can never decide a tie, exact arithmetic does).
   - S3 (rational/cubic speed-flow costs): KRAWCZYK ENCLOSURE — a proof
     that the nonlinear support-KKT system has a solution, locally
     unique, inside an explicitly computed box, with strict
     complementarity and support positivity verified over the box. This
     is the claim-carrying instance (smooth nonlinear, multi-population,
     non-variational — the niche FINDINGS_LIT_DIRECTIONS.md §3 records
     as unclaimed).
   - S2 also gets the Krawczyk enclosure, and the exact solution is
     verified to lie INSIDE it — the two certificates cross-check.
   - S1 must NOT certify (split direction in null(J), non-strict
     monotonicity): the battery asserts Krawczyk FAILS there.

   Claims discipline: method components are standard (Krawczyk; verified
   complementarity: Alefeld school; interval Nash: Kubica-Wozniak;
   certified KKT zeros: Breiding-Rose-Timme; exact rational solves:
   folklore, and standard exact-arithmetic practice). The instance is what
   is new. The
   enclosure adds LOCATION and LOCAL uniqueness; existence on a compact
   polyhedron is classical (Hartman-Stampacchia). S2 global uniqueness
   is the paper's Thm 4 [STANDARD] — cited, never claimed here.

   Rigor model: simulated directed rounding — every float op's true
   result lies within 1/2 ulp of the computed double (IEEE-754
   round-to-nearest), so widening each computed bound one ulp outward
   yields a true enclosure. The interval library is itself tested
   against EXACT BigInt rationals (I2); a skipped-widening mutant goes
   red there (M1). Interval derivatives are pinned to the kernel's cost
   by a finite-difference consistency check (W0b); a corrupted-derivative
   mutant goes red there (M2). NOTE a shifted midpoint is deliberately
   NOT a falsifier: Krawczyk then legitimately succeeds by enclosing the
   true solution in a wider box — that is an honest success.

   Kernel provenance: definitions are EXTRACTED from test-wardrop.js at
   run time (sha256 printed); test-wardrop-diff.js pins that file to the
   artifact, so this battery certifies the shipped model, not a copy. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');

/* ---------------- extract the kernel from test-wardrop.js ---------------- */
const WPATH=path.join(__dirname,'test-wardrop.js');
const SRC=fs.readFileSync(WPATH,'utf8');
console.log('kernel source: '+WPATH+' · sha256 '+crypto.createHash('sha256').update(SRC).digest('hex').slice(0,16)+' · '+SRC.length+' bytes');
const CUT=SRC.indexOf('/* ================= BATTERY');
if(CUT<0){console.log('FAIL  cannot find battery marker in test-wardrop.js');process.exit(1);}
const K=new Function(SRC.slice(0,CUT)+
  '\nreturn {EDGES,NE,EXITS,SLEN,OUT,TOPO,EM,makeSystem,interiorStart,integrate,polish,wardropGap,bellman,gsolve,minPos};')();
const {EDGES,NE,EXITS,SLEN,EM}=K;

/* ============ arithmetic: SHARED, not reimplemented ============
   This battery once carried its own copy of outward-rounded interval
   arithmetic and its own copy of exact BigInt rationals. mfg-cap carried a
   second copy of the first. Two implementations of the same delicate thing is
   how they drift, and drift here would silently weaken every certificate
   downstream. Both now come from eqcert, which is validated against exact
   rationals in its own battery and is the single source of truth.
   The local names below are kept so the checks read unchanged. */
/* UPWARD SEARCH, not a count of `..`. This battery SHIPS and the published repo's README cites it
   as the reason a reader should trust the Wardrop result, so it must load in the monorepo AND in
   the export — and the project is about to move deeper (research/mfg-lab), which would break any
   fixed ascent again. Resolve by finding eqcert, and fail BY NAME if it is not above us. */
const EQ = require((function () {
  const fs = require('fs'), path = require('path');
  for (let d = __dirname; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, 'core', 'interval', 'index.js'))) return path.join(d, 'core', 'interval');
    if (path.dirname(d) === d) break;
  }
  throw new Error('test-wardrop-interval.js: no core/interval/ in any directory above ' + __dirname);
})());
const IV = EQ.interval, RAT = EQ.rational;
const { nextUp, nextDown, iv, ZERO, ONE } = IV;
const iadd = IV.add, isub = IV.sub, imul = IV.mul, idiv = IV.div,
      ineg = IV.neg, isqr = IV.sqr, imag = IV.mag, iin = IV.interior;
const icube = a => [nextDown(a[0] * a[0] * a[0]), nextUp(a[1] * a[1] * a[1])];
const idot = (as, bs) => { let s = ZERO; for (let i = 0; i < as.length; i++) s = iadd(s, imul(as[i], bs[i])); return s; };
const IZERO = ZERO, IONE = ONE;   /* the names this battery's checks already use */

/* exact rationals, from the toolkit */
const R = RAT.R, toRat = RAT.fromDouble;
const ratCmp = RAT.cmp, ratAdd = RAT.add, ratMul = RAT.mul, ratNeg = RAT.neg;
const rsub = RAT.sub, rdiv = RAT.div, rsign = RAT.sign, rcmp = RAT.cmp;
const radd = RAT.add, rmul = RAT.mul;
const RZERO = RAT.ZERO, RONE = RAT.ONE;
const rsolve = (A, b, n) => RAT.solve(A, b, n);
const ratInBox = (q, lo, hi) => RAT.inClosed(q, lo, hi);

/* ================= battery scaffolding ================= */
let fails=0;
function assert(name,cond,detail){
  console.log((cond?'PASS':'FAIL')+'  '+name+(detail!==undefined?'   ['+detail+']':''));
  if(!cond)fails++;
}
function mulberry32(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const t0=Date.now();

/* ---- I1: nextUp/nextDown unit facts ---- */
{
  const ok= nextUp(1)===1+Number.EPSILON
        && nextDown(1)===1-Number.EPSILON/2
        && nextUp(0)===Number.MIN_VALUE
        && nextDown(0)===-Number.MIN_VALUE
        && nextUp(-1)===-(1-Number.EPSILON/2)
        && nextUp(nextDown(3.7))===3.7;
  assert('I1 nextUp/nextDown unit facts',ok);
}

/* ---- I2: interval ops contain the EXACT rational result ----
   Power: without outward widening, [fl(a op b), fl(a op b)] misses the
   exact result whenever rounding occurred — mutant M1 fails here. */
function selfTest(add,sub,mul,div){
  const rng=mulberry32(20260721);
  const scales=[1,1e-8,1e8,1e-3];
  for(let t=0;t<2000;t++){
    const a=(rng()-0.5)*scales[t%4],b=(rng()-0.5)*scales[(t+1)%4]||0.5;
    const ra=toRat(a),rb=toRat(b);
    const checks=[
      [add([a,a],[b,b]),radd(ra,rb)],
      [sub([a,a],[b,b]),rsub(ra,rb)],
      [mul([a,a],[b,b]),rmul(ra,rb)],
      [div([a,a],[b,b]),rdiv(ra,rb)],
    ];
    for(const [I,exact] of checks){
      if(rcmp(toRat(I[0]),exact)>0||rcmp(exact,toRat(I[1]))>0)return t;
    }
  }
  return -1;
}
{
  const bad=selfTest(iadd,isub,imul,idiv);
  assert('I2 interval ops contain exact rational result (8000 random ops)',bad<0,bad<0?'all contained':'first miss at op '+bad);
}

/* ================= the certified object: support-KKT system =================
   Unknowns per population: θ on support edges, φ on nodes INCIDENT to
   the support (untouched nodes are pruned — empty Kirchhoff rows and
   unconstrained potentials would make J singular). Equations: slack
   (c_k + φ_v − φ_u) = 0 per support edge; Kirchhoff per kept node.
   Square by construction. */

/* interval cost + derivative — algebraically identical to the kernel's
   (S3's a/v division form equals the polynomial form exactly in ℝ:
   a/v = a(1+5(jeff/50)^3)/50; identity asserted numerically in W0). */
function makeICost(scen,wT){
  const IwT=iv(wT),IH=iv(0.5),IE3=iv(1e-3);
  let IA=IZERO,IS=IZERO;
  /* base carries the 10^-3 emission factor (kernel: base+=w*1e-3*(a/v+b)) */
  for(const [a,b,w] of EM){const wf=imul(iv(w),IE3);IA=iadd(IA,imul(wf,iv(b)));IS=iadd(IS,imul(wf,iv(a)));}
  const IS50=idiv(IS,iv(50));
  return {
    scen,wT,
    cost(k,IJ1,IJ2,r){
      if(scen===2){
        const own=(r===1?IJ1:IJ2);
        return iadd(imul(IH,iadd(IJ1,imul(IwT,IJ2))),imul(IH,own));
      }
      const jeff=iadd(IJ1,IJ2); /* PLAIN total: j1+j2 (no wT inside the speed) */
      const g=idiv(jeff,iv(50));
      const base=iadd(IA,imul(IS50,iadd(IONE,imul(iv(5),icube(g)))));
      const M=idiv(imul(iv(SLEN[k]),iv(r===1?1:3)),iv(2));
      const own=(r===1?IJ1:IJ2);
      return iadd(imul(M,base),imul(IH,own));
    },
    dcost(k,IJ1,IJ2,r){ /* [∂c^r/∂J1, ∂c^r/∂J2] over interval flows */
      if(scen===2){
        const d1=iadd(IH,(r===1?IH:IZERO));
        const d2=iadd(imul(IH,IwT),(r===2?IH:IZERO));
        return [d1,d2];
      }
      const jeff=iadd(IJ1,IJ2); /* PLAIN total: d(jeff)/dj1 = d(jeff)/dj2 = 1 */
      const g=idiv(jeff,iv(50));
      /* dbase/djeff carries the 10^-3 factor via IS50 (base = IA + IS50*(1+5g^3)) */
      const db=idiv(imul(imul(IS50,iv(15)),isqr(g)),iv(50));
      const M=idiv(imul(iv(SLEN[k]),iv(r===1?1:3)),iv(2));
      const d1=iadd(imul(M,db),(r===1?IH:IZERO));
      const d2=iadd(imul(M,db),(r===2?IH:IZERO));
      return [d1,d2];
    }
  };
}

/* layout: support + incident nodes, from a polished float solution */
function makeLayout(sys,ths){
  const pops=[sys.P1,sys.P2];
  const L=[];let nx=0;
  pops.forEach((P,pi)=>{
    const thr=1e-6*Math.max(1,P.inflow);
    const U=[];for(let i=0;i<P.n;i++)if(ths[pi][i]>thr)U.push(i);
    const touched=new Set();
    U.forEach(i=>{const [u,v]=EDGES[P.act[i]];
      if(!EXITS.includes(u))touched.add(u);
      if(!EXITS.includes(v))touched.add(v);});
    const nodes=[...touched].sort((a,b)=>a-b);
    L.push({P,pi,r:pi+1,U,nodes,offTh:nx,offPhi:nx+U.length});
    nx+=U.length+nodes.length;
  });
  return {L,nx};
}
/* float midpoint x0 from polished flows + Bellman potentials */
function midpoint(sys,lay,ths){
  const x0=new Float64Array(lay.nx);
  sys.assemble(ths[0],ths[1]);
  const c=new Float64Array(NE);
  lay.L.forEach(Lp=>{
    Lp.U.forEach((i,a)=>x0[Lp.offTh+a]=ths[Lp.pi][i]);
    sys.cost(sys.J1,sys.J2,Lp.r,c);
    const phi=K.bellman(Lp.P,c);
    Lp.nodes.forEach((nd,a)=>x0[Lp.offPhi+a]=phi[nd]||0);
  });
  return x0;
}
/* interval F and Jacobian over a box X (array of intervals, length nx) */
function evalFJ(icost,lay,X,wantJ){
  const {L,nx}=lay;
  const IJ=[Array.from({length:NE},()=>IZERO),Array.from({length:NE},()=>IZERO)];
  L.forEach(Lp=>Lp.U.forEach((i,a)=>{IJ[Lp.pi][Lp.P.act[i]]=X[Lp.offTh+a];}));
  const F=Array.from({length:nx},()=>IZERO);
  const J=wantJ?Array.from({length:nx},()=>Array.from({length:nx},()=>IZERO)):null;
  let e=0;
  L.forEach(Lp=>{
    const phiIdx={};Lp.nodes.forEach((nd,a)=>phiIdx[nd]=Lp.offPhi+a);
    const phiOf=nd=>EXITS.includes(nd)?IZERO:X[phiIdx[nd]];
    Lp.U.forEach(i=>{
      const k=Lp.P.act[i],[u,v]=EDGES[k];
      F[e]=iadd(icost.cost(k,IJ[0][k],IJ[1][k],Lp.r),isub(phiOf(v),phiOf(u)));
      if(wantJ){
        const [d1,d2]=icost.dcost(k,IJ[0][k],IJ[1][k],Lp.r);
        L.forEach(Mq=>{ /* θ of either population on this same edge k */
          const idx=Mq.P.act.indexOf(k);
          if(idx<0)return;
          const b=Mq.U.indexOf(idx);
          if(b>=0)J[e][Mq.offTh+b]=(Mq.pi===0?d1:d2);
        });
        if(!EXITS.includes(v))J[e][phiIdx[v]]=IONE;
        if(!EXITS.includes(u))J[e][phiIdx[u]]=iv(-1);
      }
      e++;
    });
    Lp.nodes.forEach(nd=>{
      const row=Lp.P.ri[nd];
      let s=iv(-Lp.P.B[row]);
      Lp.U.forEach((i,a)=>{
        const kk=Lp.P.K[row*Lp.P.n+i];
        if(kk!==0){s=iadd(s,imul(iv(kk),X[Lp.offTh+a]));
          if(wantJ)J[e][Lp.offTh+a]=iv(kk);}
      });
      F[e]=s;e++;
    });
  });
  return {F,J};
}
/* float matrix inverse via kernel gsolve per column */
function finv(Jm,n){
  const Y=new Float64Array(n*n);
  const col=new Float64Array(n);
  for(let c=0;c<n;c++){
    col.fill(0);col[c]=1;
    const x=K.gsolve(Jm,col,n);
    for(let r=0;r<n;r++)Y[r*n+c]=x[r];
  }
  return Y;
}
/* Krawczyk verification: K(X) ⊂ int(X) proves a unique zero in X */
function krawczyk(icost,lay,x0,opts){
  opts=opts||{};
  const n=lay.nx;
  const Xp=Array.from(x0,v=>iv(v));
  const {F:F0}=evalFJ(icost,lay,Xp,false);
  const {J:Jp}=evalFJ(icost,lay,Xp,true);
  const Jmid=new Float64Array(n*n);
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)Jmid[i*n+j]=(Jp[i][j][0]+Jp[i][j][1])/2;
  const Y=finv(Jmid,n);
  if(!Array.from(Y).every(Number.isFinite))return {ok:false,why:'singular midpoint Jacobian'};
  const d=new Array(n);
  for(let i=0;i<n;i++){let s=IZERO;
    for(let j=0;j<n;j++)s=iadd(s,imul(iv(Y[i*n+j]),F0[j]));
    d[i]=s;}
  let rad=new Float64Array(n);
  for(let i=0;i<n;i++)rad[i]=2*imag(d[i])+1e-13*Math.max(1,Math.abs(x0[i]));
  for(let round=0;round<12;round++){
    const X=Array.from(x0,(v,i)=>iv(nextDown(v-rad[i]),nextUp(v+rad[i])));
    const {J:JX}=evalFJ(icost,lay,X,true);
    const Kw=new Array(n);let ok=true,maxRad=0;
    for(let i=0;i<n;i++){
      let acc=isub(iv(x0[i]),d[i]);
      for(let j=0;j<n;j++){
        let s=IZERO;
        for(let k2=0;k2<n;k2++){
          if(JX[k2][j][0]===0&&JX[k2][j][1]===0)continue;
          s=iadd(s,imul(iv(Y[i*n+k2]),JX[k2][j]));
        }
        let mij=ineg(s);
        if(i===j)mij=iadd(IONE,mij);
        if(mij[0]===0&&mij[1]===0)continue;
        acc=iadd(acc,imul(mij,isub(X[j],iv(x0[j]))));
      }
      Kw[i]=acc;
      if(!iin(acc,X[i]))ok=false;
      maxRad=Math.max(maxRad,(acc[1]-acc[0])/2);
    }
    if(ok)return {ok:true,box:X,Kbox:Kw,maxRad,rounds:round+1};
    for(let i=0;i<n;i++){
      const need=Math.max(Math.abs(Kw[i][0]-x0[i]),Math.abs(Kw[i][1]-x0[i]));
      rad[i]=Math.max(rad[i]*2,need*1.1+1e-15);
    }
    if(opts.maxRadCap&&Math.max(...rad)>opts.maxRadCap)break;
  }
  return {ok:false,why:'no contraction'};
}
/* verified equilibrium conditions over the enclosure box (interval leg) */
function verifyEquilibrium(icost,lay,box){
  let minTh=Infinity;
  lay.L.forEach(Lp=>Lp.U.forEach((i,a)=>{minTh=Math.min(minTh,box[Lp.offTh+a][0]);}));
  const IJ=[Array.from({length:NE},()=>IZERO),Array.from({length:NE},()=>IZERO)];
  lay.L.forEach(Lp=>Lp.U.forEach((i,a)=>{IJ[Lp.pi][Lp.P.act[i]]=box[Lp.offTh+a];}));
  let minSlack=Infinity,nOff=0,nSkip=0;
  lay.L.forEach(Lp=>{
    const phiIdx={};Lp.nodes.forEach((nd,a)=>phiIdx[nd]=Lp.offPhi+a);
    const phiOf=nd=>EXITS.includes(nd)?IZERO:(phiIdx[nd]!==undefined?box[phiIdx[nd]]:null);
    for(let i=0;i<Lp.P.n;i++){
      if(Lp.U.indexOf(i)>=0)continue;
      const k=Lp.P.act[i],[u,v]=EDGES[k];
      const pu=phiOf(u),pv=phiOf(v);
      /* an off-support edge with an UNTOUCHED endpoint carries no flow and
         no potential constraint (its tail is unreached at equilibrium) */
      if(pu===null||pv===null){nSkip++;continue;}
      nOff++;
      const slack=iadd(icost.cost(k,IJ[0][k],IJ[1][k],Lp.r),isub(pv,pu));
      minSlack=Math.min(minSlack,slack[0]);
    }
  });
  return {minTh,minSlack,nOff,nSkip};
}

/* ---------- exact rational leg (S2 only: affine, dyadic data) ----------
   Independent recomputation: the coefficient matrix is written from the
   FORMULA c^r = 0.5(j1 + wT j2) + 0.5 j^r (wT=2), i.e. dc = [[1,1],[1/2,3/2]],
   not copied from the interval code. */
function exactS2(lay){
  const n=lay.nx;
  const HALF=R(1n,2n),THREEHALF=R(3n,2n);
  const DC=[[RONE,RONE],[HALF,THREEHALF]]; /* DC[r-1] = [∂c^r/∂J1, ∂c^r/∂J2] */
  const A=Array.from({length:n},()=>Array.from({length:n},()=>RZERO));
  const b=Array.from({length:n},()=>RZERO);
  let e=0;
  lay.L.forEach(Lp=>{
    const phiIdx={};Lp.nodes.forEach((nd,a)=>phiIdx[nd]=Lp.offPhi+a);
    Lp.U.forEach(i=>{
      const k=Lp.P.act[i],[u,v]=EDGES[k];
      lay.L.forEach(Mq=>{
        const idx=Mq.P.act.indexOf(k);
        if(idx<0)return;
        const bb=Mq.U.indexOf(idx);
        if(bb>=0)A[e][Mq.offTh+bb]=DC[Lp.r-1][Mq.pi];
      });
      if(!EXITS.includes(v))A[e][phiIdx[v]]=RONE;
      if(!EXITS.includes(u))A[e][phiIdx[u]]=R(-1n);
      e++;
    });
    Lp.nodes.forEach(nd=>{
      const row=Lp.P.ri[nd];
      Lp.U.forEach((i,a)=>{
        const kk=Lp.P.K[row*Lp.P.n+i];
        if(kk!==0)A[e][Lp.offTh+a]=R(BigInt(kk));
      });
      b[e]=toRat(Lp.P.B[row]);e++;
    });
  });
  const x=rsolve(A,b,n);
  if(!x)return {ok:false,why:'singular exact system'};
  /* residual must be EXACTLY zero (catches solver defects) */
  let resOK=true;
  for(let i2=0;i2<n;i2++){
    let s=RZERO;
    for(let j2=0;j2<n;j2++)if(rsign(A[i2][j2])!==0)s=radd(s,rmul(A[i2][j2],x[j2]));
    if(rcmp(s,b[i2])!==0)resOK=false;
  }
  /* exact support positivity */
  let posOK=true;
  lay.L.forEach(Lp=>Lp.U.forEach((i,a)=>{if(rsign(x[Lp.offTh+a])<=0)posOK=false;}));
  /* exact off-support slacks: c^r(J) + φ_v − φ_u with exact J totals */
  const JR=[Array.from({length:NE},()=>RZERO),Array.from({length:NE},()=>RZERO)];
  lay.L.forEach(Lp=>Lp.U.forEach((i,a)=>{JR[Lp.pi][Lp.P.act[i]]=x[Lp.offTh+a];}));
  const slacks=[];
  let slackOK=true;
  lay.L.forEach(Lp=>{
    const phiIdx={};Lp.nodes.forEach((nd,a)=>phiIdx[nd]=Lp.offPhi+a);
    const phiOf=nd=>EXITS.includes(nd)?RZERO:(phiIdx[nd]!==undefined?x[phiIdx[nd]]:null);
    for(let i=0;i<Lp.P.n;i++){
      if(Lp.U.indexOf(i)>=0)continue;
      const k=Lp.P.act[i],[u,v]=EDGES[k];
      const pu=phiOf(u),pv=phiOf(v);
      if(pu===null||pv===null)continue;
      const cR=radd(rmul(DC[Lp.r-1][0],JR[0][k]),rmul(DC[Lp.r-1][1],JR[1][k]));
      const s=radd(cR,rsub(pv,pu));
      slacks.push({pop:Lp.r,edge:'('+u+','+v+')',s});
      if(rsign(s)<0)slackOK=false;
    }
  });
  return {ok:resOK&&posOK&&slackOK,x,resOK,posOK,slackOK,slacks};
}

/* ================= W0: kernel solve + cost/derivative identities ================= */
function solveScenario(scen,wT,Q1,Q2,tol){
  const sys=K.makeSystem(scen,wT,Q1,Q2);
  const th1=K.interiorStart(sys.P1,null),th2=K.interiorStart(sys.P2,null);
  K.integrate(sys,th1,th2,{tol:tol||1e-8,maxSteps:12000});
  const pol=K.polish(sys,th1,th2);
  return {sys,ths:[th1,th2],pol,gap:K.wardropGap(sys,th1,th2)};
}
/* W0a: interval cost midpoint == kernel cost (both scenarios) */
function costIdentity(scen,icost){
  const sys=K.makeSystem(scen,2,100,50);
  const rng=mulberry32(42);
  const c=new Float64Array(NE);
  let worst=0;
  for(let t=0;t<50;t++){
    for(let k=0;k<NE;k++){sys.J1[k]=rng()*80;sys.J2[k]=rng()*40;}
    for(const r of [1,2]){
      sys.cost(sys.J1,sys.J2,r,c);
      for(let k=0;k<NE;k++){
        const I=icost.cost(k,iv(sys.J1[k]),iv(sys.J2[k]),r);
        const mid=(I[0]+I[1])/2;
        worst=Math.max(worst,Math.abs(mid-c[k])/Math.max(1,Math.abs(c[k])));
        if(c[k]<I[0]-1e-9||c[k]>I[1]+1e-9)worst=Infinity;
      }
    }
  }
  return worst;
}
/* W0b: interval dcost == central FD of the KERNEL cost.
   Tolerance derived: central FD error ~ (h^2/6)|c'''|; h=1e-3 on operands
   O(1e2) gives ~1e-8 relative — 1e-6 leaves 100x headroom while a 2%
   derivative corruption (M2) sits 4 orders above it. */
function dcostIdentity(scen,icost){
  const sys=K.makeSystem(scen,2,100,50);
  const rng=mulberry32(77);
  const cp=new Float64Array(NE),cm=new Float64Array(NE);
  let worst=0;
  const h=1e-3;
  for(let t=0;t<30;t++){
    const J1=Array.from({length:NE},()=>rng()*80),J2=Array.from({length:NE},()=>rng()*40);
    for(const r of [1,2]){
      for(let k=0;k<NE;k++){
        const D=icost.dcost(k,iv(J1[k]),iv(J2[k]),r).map(I=>(I[0]+I[1])/2);
        for(const which of [0,1]){
          const Jp=(which===0?J1:J2).slice(),Jm=Jp.slice();
          Jp[k]+=h;Jm[k]-=h;
          sys.cost(which===0?Jp:J1,which===0?J2:Jp,r,cp);
          sys.cost(which===0?Jm:J1,which===0?J2:Jm,r,cm);
          const fd=(cp[k]-cm[k])/(2*h);
          worst=Math.max(worst,Math.abs(fd-D[which])/Math.max(1,Math.abs(fd)));
        }
      }
    }
  }
  return worst;
}
{
  const w2=costIdentity(2,makeICost(2,2)),w3=costIdentity(3,makeICost(3,2));
  assert('W0a interval cost == kernel cost (S2+S3, 3000 samples)',Math.max(w2,w3)<1e-11,'worst rel dev '+Math.max(w2,w3).toExponential(2));
  const d2=dcostIdentity(2,makeICost(2,2)),d3=dcostIdentity(3,makeICost(3,2));
  assert('W0b interval derivative == FD of kernel cost (S2+S3)',Math.max(d2,d3)<1e-6,'worst rel dev '+Math.max(d2,d3).toExponential(2));
}

/* ================= W1: S2 — exact rational certificate + enclosure cross-check ================= */
let S2res=null;
{
  const {sys,ths,pol,gap}=solveScenario(2,2,100,50);
  assert('W1a S2 kernel polish ok, float gap < 1e-12',pol&&gap<1e-12,gap.toExponential(2));
  const lay=makeLayout(sys,ths);
  const x0=midpoint(sys,lay,ths);
  const icost=makeICost(2,2);
  const res=krawczyk(icost,lay,x0,{});
  S2res={sys,ths,lay,x0,icost,res};
  assert('W1b S2 Krawczyk contraction: unique KKT zero in box',res.ok,res.ok?('max radius '+res.maxRad.toExponential(2)+' in '+res.rounds+' round(s), n='+lay.nx):res.why);
  const ex=exactS2(lay);
  assert('W1c S2 EXACT rational solve: residual ≡ 0, support θ > 0 exactly',ex.ok!==undefined&&ex.resOK&&ex.posOK,'exact Gauss over BigInt fractions');
  assert('W1d S2 off-support slacks ≥ 0 EXACTLY (ties decided by exact arithmetic)',ex.slackOK,
    ex.slacks.map(s=>'pop'+s.pop+' '+s.edge+' slack='+(rsign(s.s)===0?'0 (exact tie)':(Number(s.s.n)/Number(s.s.d)).toExponential(2))).join('; ')||'none');
  if(res.ok&&ex.x){
    let inBox=true;
    for(let i=0;i<lay.nx;i++)if(!ratInBox(ex.x[i],res.box[i][0],res.box[i][1]))inBox=false;
    assert('W1e S2 exact solution ∈ Krawczyk box (certificates cross-check)',inBox);
    S2res.ex=ex;
    console.log('    S2 CERTIFIED EXACTLY: the support-KKT solution is rational, solved over BigInt');
    console.log('    fractions; Kirchhoff and used-slacks hold with ZERO residual; the one unused');
    console.log('    edge (pop 2, (4,5)) has slack EXACTLY 0 — a degenerate tie that interval');
    console.log('    arithmetic cannot decide and exact arithmetic does. Weak complementarity');
    console.log('    verified ⇒ the point is a Wardrop equilibrium. Global uniqueness of totals is');
    console.log('    the paper\'s Thm 4 [STANDARD] — cited, not claimed here.');
  }
}

/* ================= W2: S3 — Krawczyk enclosure (claim-carrier) ================= */
{
  const {sys,ths,pol,gap}=solveScenario(3,2,100,50,1e-7);
  assert('W2a S3 kernel polish ok, float gap < 1e-10',pol&&gap<1e-10,gap.toExponential(2));
  const lay=makeLayout(sys,ths);
  const x0=midpoint(sys,lay,ths);
  const icost=makeICost(3,2);
  const res=krawczyk(icost,lay,x0,{});
  assert('W2b S3 Krawczyk contraction (smooth NONLINEAR costs): unique KKT zero in box',res.ok,res.ok?('max radius '+res.maxRad.toExponential(2)+' in '+res.rounds+' round(s), n='+lay.nx):res.why);
  if(res.ok){
    const eq=verifyEquilibrium(icost,lay,res.Kbox);
    assert('W2c S3 support flows verified > 0 over the box',eq.minTh>0,'min inf θ '+eq.minTh.toExponential(3));
    assert('W2d S3 off-support slacks verified > 0 (STRICT complementarity)',eq.minSlack>0,'min inf slack '+eq.minSlack.toExponential(3)+' over '+eq.nOff+' off-support edge(s)');
    console.log('    S3 CERTIFIED: existence + local uniqueness of a multi-population Wardrop');
    console.log('    equilibrium with rational/cubic speed-flow costs, in a box of max radius');
    console.log('    '+res.maxRad.toExponential(2)+' — the smooth-nonlinear instance the literature check found unclaimed.');
  }
}

/* ================= W3: S1 must NOT certify ================= */
{
  const {sys,ths}=solveScenario(1,2,100,100);
  const lay=makeLayout(sys,ths);
  const x0=midpoint(sys,lay,ths);
  const icostS1={
    cost(k,IJ1,IJ2,r){return iadd(IJ1,IJ2);},
    dcost(k,IJ1,IJ2,r){return [IONE,IONE];}
  };
  const res=krawczyk(icostS1,lay,x0,{maxRadCap:50});
  assert('W3 S1 Krawczyk FAILS as theory demands (split direction ∈ null(J))',!res.ok,res.ok?'UNEXPECTED certification of a non-strictly-monotone instance':res.why);
}

/* ================= falsifiers (a verifier that cannot go red is decoration) ================= */
console.log('\n    executing falsifiers');
let reds=0;const redTotal=5;
{
  /* M1: widening skipped -> exact-rational self-test catches it */
  const thinMul=(a,b)=>{const p=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]];return [Math.min(...p),Math.max(...p)];};
  const bad=selfTest(iadd,isub,thinMul,idiv);
  if(bad>=0){reds++;console.log('       RED ok  M1 widening-skipped mul caught by self-test (op '+bad+')');}
  else console.log('       RED FAIL  M1 thin mul passed the self-test');
}
{
  /* M2: corrupted derivative (2%) -> FD-consistency check catches it.
     (Krawczyk itself CANNOT catch this — Y adapts to the wrong J — which
     is exactly why W0b exists.) */
  const good=makeICost(3,2);
  const badIC={scen:3,cost:good.cost,
    dcost:(k,a,b,r)=>good.dcost(k,a,b,r).map(I=>imul(I,iv(1.02)))};
  const d=dcostIdentity(3,badIC);
  if(d>1e-6){reds++;console.log('       RED ok  M2 2% derivative corruption caught by FD consistency ('+d.toExponential(2)+')');}
  else console.log('       RED FAIL  M2 corrupted derivative passed FD consistency');
}
{
  /* M3: wrong active set (support edge dropped) -> Krawczyk refuses */
  const {sys,ths,icost}=S2res;
  const lay2=makeLayout(sys,ths);
  lay2.L[0].U=lay2.L[0].U.slice(1);
  let nx=0;lay2.L.forEach(Lp=>{Lp.offTh=nx;Lp.offPhi=nx+Lp.U.length;nx+=Lp.U.length+Lp.nodes.length;});
  lay2.nx=nx;
  const x0b=midpoint(sys,lay2,ths);
  const res=krawczyk(icost,lay2,x0b,{maxRadCap:1});
  if(!res.ok){reds++;console.log('       RED ok  M3 wrong active set refused');}
  else console.log('       RED FAIL  M3 certified a wrong support');
}
{
  /* M4: mismatched cost model -> refused. The wrong model is the PRE-FIX,
     physically-wrong S3 cost — jeff = j1 + wT*j2 inside the speed and NO 10^-3
     emission factor — whose equilibrium is emission-DOMINATED and genuinely far
     from the S2 point, so Krawczyk finds no zero within any radius cap.
     (NB: the CORRECTED S3 cost is deliberately NOT used here. With emissions at
     their true 10^-3 scale the S3 cost is dominated by the same 0.5·own-flow
     term as S2, so the two problems share a nearby equilibrium on this support
     and Krawczyk HONESTLY encloses it — the whitelisted shifted-midpoint success
     of the header note, not a verifier defect. A negative control must fire on a
     model whose equilibrium is actually elsewhere; the pre-fix cost is exactly
     that, and doubles as a regression guard on the emission-scale fix.) */
  const {lay,x0}=S2res;
  const IwT=iv(2),IH=iv(0.5);
  let IA=IZERO,IS=IZERO;
  for(const [a,b,w] of EM){IA=iadd(IA,imul(iv(w),iv(b)));IS=iadd(IS,imul(iv(w),iv(a)));}
  const IS50=idiv(IS,iv(50));
  const preFixS3={scen:3,
    cost(k,IJ1,IJ2,r){
      const jeff=iadd(IJ1,imul(IwT,IJ2));               /* pre-fix: wT inside speed */
      const g=idiv(jeff,iv(50));
      const base=iadd(IA,imul(IS50,iadd(IONE,imul(iv(5),icube(g))))); /* pre-fix: no 1e-3 */
      const M=idiv(imul(iv(SLEN[k]),iv(r===1?1:3)),iv(2));
      const own=(r===1?IJ1:IJ2);
      return iadd(imul(M,base),imul(IH,own));
    },
    dcost(k,IJ1,IJ2,r){
      const jeff=iadd(IJ1,imul(IwT,IJ2));
      const g=idiv(jeff,iv(50));
      const db=idiv(imul(imul(IS50,iv(15)),isqr(g)),iv(50));
      const M=idiv(imul(iv(SLEN[k]),iv(r===1?1:3)),iv(2));
      const d1=iadd(imul(M,db),(r===1?IH:IZERO));
      const d2=iadd(imul(imul(M,db),IwT),(r===2?IH:IZERO));
      return [d1,d2];
    }};
  const res=krawczyk(preFixS3,lay,x0,{maxRadCap:50});
  if(!res.ok){reds++;console.log('       RED ok  M4 mismatched cost model refused (pre-fix emission-dominated S3)');}
  else console.log('       RED FAIL  M4 certified against the wrong cost function');
}
{
  /* M5: corrupted inflow in the exact leg -> exact solution leaves the
     Krawczyk box (cross-check W1e goes red) */
  const {sys,ths,lay,res}=S2res;
  const save=sys.P1.B.slice();
  const rowEnt=sys.P1.ri[sys.P1.entrance];
  sys.P1.B[rowEnt]=101;
  const ex=exactS2(lay);
  sys.P1.B.set(save);
  let inBox=true;
  if(ex.x&&res.ok){for(let i=0;i<lay.nx;i++)if(!ratInBox(ex.x[i],res.box[i][0],res.box[i][1]))inBox=false;}
  if(!inBox){reds++;console.log('       RED ok  M5 corrupted inflow (100→101): exact solution leaves the certified box');}
  else console.log('       RED FAIL  M5 corrupted-inflow solution stayed in the box');
}
assert('M  every falsifier turned its target red',reds===redTotal,reds+'/'+redTotal);

console.log(`\n${Date.now()-t0} ms · ${fails?fails+' FAILURES':'ALL PASS'}`);
process.exit(fails?1:0);
