"""Independent Arb root/Jensen + analytic quadrature checker. No candidate code imports."""
import json,sys,time,math
from fractions import Fraction as F
from flint import arb,acb,fmpz_poly,ctx
ctx.prec=160
ctx.threads=1

def ball(q):
 q=F(q); return arb(q.numerator)/q.denominator

def evaluate(data,tol='1e-12'):
 D=sum((len(r['coeffs'])-1)*r['multiplicity'] for r in data['denominator'])
 da=sum((len(r['coeffs'])-1)*F(r['q_rational']) for r in data['numerator'])
 assert da<D and D>0
 for s in data['numerator']:
  assert F(s['q_rational'])>=0
  for r in data['denominator']:
   assert fmpz_poly(s['coeffs'][::-1]).gcd(fmpz_poly(r['coeffs'][::-1])).degree()==0
 roots=[]; mahler=arb(0); const=arb(0)
 T=fmpz_poly([0,1,-1])
 for kind in ['denominator','numerator']:
  for rec in data[kind]:
   assert all(isinstance(c,int) for c in rec['coeffs'])
   if kind=='denominator':
    assert abs(rec['coeffs'][0])==1 and isinstance(rec['multiplicity'],int) and rec['multiplicity']>0
    w=-ball(F(rec['multiplicity'],D))
   else: w=ball(F(rec['q_rational'])/D)
   p=fmpz_poly([0])
   for c in rec['coeffs']: p=p*T+c
   rr=p.complex_roots(); assert sum(m for r,m in rr)==p.degree()
   const+=w*arb(abs(rec['coeffs'][0])).log()
   for r,m in rr:
    roots.append((r,w*m))
    if kind=='denominator': mahler+=(-w)*m*abs(r).max(1).log()
 print('degrees',D,str(da),'normalized Mahler',mahler,flush=True)
 pi=arb.pi(); tau=2*pi
 def interval_g(a,b):
  u=acb(0,tau*(a+b)/2).exp(); delta=pi*(b-a)
  lo=const; hi=const; valid=True
  for r,w in roots:
   d=abs(u-r); low=d.lower()-delta; high=d.upper()+delta
   if w>0:
    hi+=w*high.log()
    if low>0: lo+=w*low.log()
    else: valid=False
   else:
    if not low>0: return None,None
    hi+=w*low.log();lo+=w*high.log()
  return (lo if valid else None),hi
 def analytic(x,flag):
  u=(acb(0,tau)*x).exp(); v=(-acb(0,tau)*x).exp()
  out=acb(const)
  for r,w in roots:
   out+=w*((u-r)*(v-r.conjugate())).log(analytic=flag)/2
  return out
 total=arb(0); error=arb(0); counts=[0,0,0]; stack=[(arb(0),arb(1)/2,0)]
 while stack:
  a,b,depth=stack.pop();lo,hi=interval_g(a,b); width=b-a
  if hi is not None and hi<0: counts[0]+=1;continue
  if lo is not None and lo>0:
   val=acb.integral(analytic,a,b,abs_tol=arb(tol)*width/16,rel_tol=arb(tol)/16,eval_limit=20000,depth_limit=20)
   if val.is_finite() and val.real.rad()<arb(tol)*width:
    total+=val.real;counts[1]+=1;continue
  if hi is not None and hi.max(0)<arb(tol):
   # enclosure [0, width max(0,hi)]; endpoint bounds are outward.
   cap=(width*hi.max(0)).upper(); total+=arb(cap/2,cap/2);error+=cap;counts[2]+=1;continue
  assert depth<60,(a,b,hi)
  mid=(a+b)/2;stack.extend([(mid,b,depth+1),(a,mid,depth+1)])
 integral=2*total; B=mahler+integral
 print('counts',counts,'crossing error',2*error,flush=True)
 print('integral / D',integral,'B',B,flush=True)
 return dict(D=D,degreeA=str(da),mahler_normalized=str(mahler),integral_normalized=str(integral),bound=str(B),upper=str(B.upper()),counts=counts,target_pass=bool(B<ball(data.get('target','0.2536331'))))

if __name__=='__main__':
 data=json.load(open(sys.argv[1]));start=time.time()
 result=evaluate(data,sys.argv[3] if len(sys.argv)>3 else '1e-12');result['seconds']=time.time()-start
 json.dump(result,open(sys.argv[2],'w'),indent=2);print(result,flush=True)
 if not result['target_pass']: raise SystemExit(1)
