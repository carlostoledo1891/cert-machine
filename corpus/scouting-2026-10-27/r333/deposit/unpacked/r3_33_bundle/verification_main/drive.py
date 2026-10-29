# My independent proof driver: alpha(Cay(Z240,±S)) < K  via orbital branching (multiplier stabilizer of 0) + smallest-next split,
# each job decided by my bbmis. Usage: drive.py K workers [maxjobs] [stop_on_yes]
import sys, time, subprocess
from multiprocessing import Pool
n=240; S=[14,34,38,40,43,50,58,60,63,67,69,70,79,87,89,99]
K=int(sys.argv[1]); P=int(sys.argv[2]); LIM=int(sys.argv[3]) if len(sys.argv)>3 else 10**9; STOP=len(sys.argv)>4
D=set([s%n for s in S]+[(-s)%n for s in S]); adj=lambda u,v:(u-v)%n in D
assert all(not ((a+b)%n in D) for a in D for b in D), "triangle"
M=[m for m in range(1,n) if __import__('math').gcd(m,n)==1 and set((m*d)%n for d in D)==D]
Vp=[v for v in range(1,n) if v not in D]; seen=set(); orbits=[]
for v in Vp:
    if v not in seen:
        o=sorted(set((m*v)%n for m in M)); seen|=set(o); orbits.append(o)
J=[]
for i,o in enumerate(orbits):
    r=o[0]; banned=set(x for p in orbits[:i] for x in p)
    W=[v for v in Vp if v!=r and v not in banned and not adj(v,r)]
    for j,w in enumerate(W):
        C=[u for u in W[j+1:] if not adj(u,w)]
        if len(C)>=K-3: J.append((i,r,w,C))
def run(job):
    i,r,w,C=job; m=len(C); t0=time.time()
    s=f"{m}\n"+"\n".join("".join('1' if adj(C[a],C[b]) else '0' for b in range(m)) for a in range(m))+f"\n{K-3}\n"
    out=subprocess.run(['./bbmis'],input=s,capture_output=True,text=True).stdout.split()
    if out and out[0]=='YES':   # verify witness independently, return full set
        I=[0,r,w]+[C[int(x)] for x in out[1:]]
        assert len(set(I))==K and all(not adj(a,b) for a in I for b in I if a!=b), "bad witness"
        return i,w,m,'YES',I,round(time.time()-t0,1)
    return i,w,m,(out[0] if out else 'ERR'),None,round(time.time()-t0,1)
if __name__=="__main__":
    print(f"K={K} multipliers={M} orbits={len(orbits)} jobs={len(J)}",flush=True); t0=time.time(); nyes=nerr=0; done=0
    with Pool(P) as p:
        for res in p.imap_unordered(run,J[:LIM]):
            done+=1
            if res[3]=='YES': nyes+=1; print("YES",res,flush=True)
            elif res[3]!='NO': nerr+=1; print("ERR",res,flush=True)
            if res[5]>60 or done%100==0: print(done,res[:4],res[5],flush=True)
            if STOP and nyes: break
    print(f"FINISHED K={K}: {done} of {len(J)} jobs, YES={nyes}, ERR={nerr}, {time.time()-t0:.0f}s",flush=True)
    print("RESULT: alpha <",K,"PROVEN" if (done==len(J) and nyes==0 and nerr==0) else "NOT PROVEN",flush=True)
