#!/usr/bin/python3
"""Separate real-interval/Machin, complete-series and interval-subtraction line.
Own s28 lineage generalized; imports no primary or producer helper/output.
Accepted banked outputs are comparators, never numerical input to formulas.
"""
from fractions import Fraction as Q
from pathlib import Path
from mpmath import iv
import json, math, copy
iv.dps=90
COUNT=0
out={'exact':{},'scalars':{},'leaves':[],'tail':{},'anchors':{},'mutations':[]}
def ck(ok,n):
 global COUNT
 COUNT+=1
 if not bool(ok):raise AssertionError(n)
def qi(x):
 x=Q(x);return iv.mpf(x.numerator)/x.denominator
def bounds(x):
 def binary(t):
  sign,mant,exp,bc=t
  return Q((-1 if sign else 1)*int(mant))*Q(2)**int(exp)
 return binary(x._mpi_[0]),binary(x._mpi_[1])
def lo(x):return bounds(x)[0]
def hi(x):return bounds(x)[1]
def hull(a,b):return iv.mpf([qi(a).a,qi(b).b])
def text(x,d,upper=False):
 x=Q(x);j=-((-x.numerator*10**d)//x.denominator) if upper else x.numerator*10**d//x.denominator
 return ('-' if j<0 else '')+str(abs(j)//10**d)+'.'+str(abs(j)%10**d).zfill(d)
def box(x,d=12):
 l,u=bounds(x);return {'lo':str(l),'hi':str(u),'FLOOR'+str(d):text(l,d),'CEIL'+str(d):text(u,d,True)}
def save(key,x,d=18):out['scalars'][key]=box(x,d)
def match(x,old,name,d=12):
 l,u=bounds(x);ck(max(l,Q(old['lo']))<=min(u,Q(old['hi'])),name+' overlap')
 for k in ['FLOOR'+str(d),'CEIL'+str(d)]:ck(box(x,d)[k]==old[k],name+' directed cell '+k)
for v,l,u in [(Q(-1,3),'-0.33334','-0.33333'),(Q(-1,10**8),'-0.00001','0.00000'),(Q(1,7),'0.14285','0.14286'),(Q(-1,8),'-0.12500','-0.12500')]:
 ck(text(v,5)==l and text(v,5,True)==u,'signed rounding')
def atan(n):
 value=Q(0);term=Q(1,n)
 for k in range(160):value+=(-1)**k*term**(2*k+1)/(2*k+1)
 return hull(value,value+term**321/321)
pi=16*atan(5)-4*atan(239);ck(lo(pi)>3 and hi(pi)<4,'Machin bounds')
a,source,b=Q(319,2000),Q(4,25),Q(3,16);X,C,H=6000000185827,690988,2299999;h=source-a;eps=Q(1,10**12)
def clock(x):return (iv.log(1+x*x)/2-iv.log(4*pi))/4-1/(2*(1+x*x))
def leftwall(n,t):return 4*pi*(qi(n)**2-qi(t)/16)
c0=clock(qi(X));lC=iv.log(qi(C))
rows=[list(map(int,line.split())) for line in Path('frozen/bank774_bins.txt').read_text().splitlines()]
ck(rows[0][:5]==[-1,0,0,0,0] and len(rows)==225,'whole Gram input')
vs=hull(Q(rows[0][5],2**100),Q(rows[0][6],2**100));ck(lo(vs)>0,'norm denominator')
weights=[(iv.log(qi(row[1])),hull(Q(row[5],2**100),Q(row[6],2**100))) for row in rows[1:]]
def norm(s):
 terms=[v*(1-iv.exp(-2*ln*s)) for ln,v in weights]
 return iv.sqrt(1+sum(terms)/vs)/10
# Independent disjoint old partition, with cardinality/event proof below.
old=[(n,n) for n in range(2,256)];n=256
while n<=C:
 stop=min(C,n+n//128);old.append((n,stop));n=stop+1
ck(len(old)==1240 and sum(u-l+1 for l,u in old)==C-1,'complete old integer occupancy')
ck(lo(2*c0-lC)>0,'reverse multiplier increases on entire old interval')
coeff=[]
for lower,upper in old:
 ll,lu=iv.log(qi(lower)),iv.log(qi(upper))
 amp=iv.exp(qi(source)*ll*ll/4-(qi(Q(1,2))+qi(source)*c0)*ll)
 inc=iv.exp(qi(h)*lu*(c0-lu/4))-1
 val=(upper-lower+1)*amp*inc;ck(lo(val)>0,'complete positive debit')
 coeff.append((ll,val))
def defect(s):return sum(weight*iv.exp(-s*ll) for ll,weight in reversed(coeff))
maxrem=Q(0)
def entrants(time,c,U):
 global maxrem
 if U==C:return qi(0)
 A=qi(time)/4;B=qi(Q(1,2))-qi(time)*c;length=iv.log(qi(Q(U,C)));D=2*A*lC+B
 ck(lo(length)>0 and lo(D)>0,'positive integral representation')
 mag=D*length+A*length**2;ck(hi(mag)<1 and lo(mag)>0,'whole series remainder guard')
 # exp(D*u+A*u^2) coefficient recurrence, degree100. Every higher
 # monomial comes from exponential order >=51, tail <=3/51! for mag<1.
 coefficients=[qi(1),D]
 for j in range(2,101):coefficients.append((D*coefficients[-1]+2*A*coefficients[-2])/j)
 integral=qi(0);power=length
 for j,v in enumerate(coefficients):integral+=v*power/(j+1);power*=length
 R=hi(length)*Q(3,math.factorial(51));maxrem=max(maxrem,R)
 return iv.exp(A*lC*lC+B*lC)*(integral+hull(0,R))
def expression(time,L,U,backward):
 xx=qi(X) if L==C else leftwall(L,b);cc=clock(xx);ss=qi(0) if L==C else qi(time)*(cc-c0)
 base=norm(ss);debit=defect(ss) if backward else qi(0);entry=entrants(time,cc,U)
 return {'x_left':xx,'shift':ss,'old_norm':base,'backward_debit_cap':debit,'entry_integral':entry,'retained':base-debit-entry,'density_slope':qi(-Q(1,2))+qi(time)*(iv.log(qi(U))/2-cc),'support_gap':4*cc-iv.log(qi(U))}
# Same-engine accepted regimes FIRST, not fixtures hardcoded as results.
old774=json.loads(Path('frozen/bank774_primary.json').read_text());old774s=json.loads(Path('frozen/bank774_second.json').read_text())
for name,value in [('c_source',c0),('entry100000',100000*iv.exp(qi(source)*lC*lC/4-(qi(Q(1,2))+qi(source)*c0)*lC)),('source_left_gap',qi(X)-leftwall(C,source)),('source_right_gap',leftwall(C+1,b)-X),('support_gap790988',4*c0-iv.log(qi(790988)))]:
 for oldline in [old774,old774s]:match(value,oldline['anchors'][name],name,18)
 out['anchors'][name]=box(value,18)
for L,U in [(1000000,1000000),(H,H),(1897746,2098872)]:
 row=expression(source,L,U,False);ref=next(v for v in old774['point_controls']+old774['leaves'] if (v['L'],v['U'])==(L,U))
 for key,prior in [('old_norm','old_norm_lower_expression'),('entry_integral','entry_integral_upper'),('retained','retained_lower_expression')]:match(row[key],ref[prior],'old distinct regime '+key)
partition=json.loads(Path('frozen/bank782_geometry.json').read_text())
accepted=[json.loads(Path('frozen/'+name).read_text()) for name in ['bank782_primary.json','bank782_second.json']]
for L,U in partition:
 values=expression(a,L,U,True);ck(lo(values['shift'])>=0 and hi(values['density_slope'])<0 and lo(values['support_gap'])>0,'uniform finite guards');ck(lo(values['retained'])>Q(1,250000),'entire leaf positive')
 row={'L':L,'U':U}
 for key,value in values.items():
  for prod in accepted:match(value,next(q for q in prod['finite_leaves'] if (q['L'],q['U'])==(L,U))[key],'new finite '+key)
  row[key]=box(value)
 out['leaves'].append(row)
worst=min(out['leaves'],key=lambda v:Q(v['retained']['lo']))
ck(all(Q(worst['retained']['hi'])<Q(v['retained']['lo']) for v in out['leaves'] if v is not worst),'unique all-leaf minimum')
out['minimum']={'L':worst['L'],'U':worst['U'],**worst['retained']}
# Infinite branch by direct split: same constants, independent interval paths.
lH=iv.log(qi(H));cproxy=lH/2-qi(eps);s=qi(a)*(cproxy-c0);oldnorm=norm(s);olddebit=defect(s)
beta=b/16;loss=qi(beta)/(4*(qi(H)**2-qi(beta)))+1/(2*leftwall(H,b)**2)
k=qi(a)*lC/2;alpha=qi(Q(1,2)+a*eps);g=iv.exp(lH*(alpha-qi(a)*lH/4));cap=g/k;entry=entrants(a,cproxy,H)
values={'c_error_cap':loss,'c_lower':cproxy,'shift':s,'old_norm':oldnorm,'backward_debit_cap':olddebit,'entry_at_seam':entry,'entry_barrier':cap,'entry_barrier_gap':cap-entry,'forcing_at_seam':g,'forcing_log_slope':alpha-qi(a)*lH/2,'kappa':k,'density_slope':qi(-Q(1,2)+a*eps),'support_gap':lH-4*qi(eps),'retained':oldnorm-olddebit-cap}
ck(0<lo(loss) and hi(loss)<eps and lo(s)>0 and lo(k)>0,'whole infinite clock guards')
ck(hi(values['forcing_log_slope'])<0 and hi(values['density_slope'])<0 and lo(values['support_gap'])>0 and lo(cap-entry)>0 and lo(values['retained'])>Q(1,250000),'infinite direct split prerequisites')
ck(lo(lH/2-clock(leftwall(H,b)))>0,'positive clock loss')
for key,value in values.items():
 for prod in accepted:match(value,prod['tail'][key],'infinite branch '+key)
 out['tail'][key]=box(value)
save('INFINITE_BRANCH_SUFFICIENT',values['retained'],12);save('INFINITE_BARRIER_SEAM_GAP',cap-entry,12)
p,q,m,d=Q(1,800000),Q(1600001,40000000000),Q(1,250000),Q(1,400000)
square=(12*m)**2-(12*p)**2-(q+2*d)**2
ck(square==Q(86396399999,1600000000000000000000)>0 and m>p,'projection exact difference of squares')
deriv=(12*iv.sqrt(qi(m*m-p*p))-qi(q))/2;ck(lo(deriv)>d,'zero derivative')
save('ZERO_DERIVATIVE_LOWER',deriv)
# Adjacent-square classifier instead of wall-minus-site for the band.
ratio=qi(X)/(4*pi)
ck(lo(ratio+qi(a)/16)>C*C and hi(ratio+qi(b)/16)<(C+1)**2,'whole-band natural source index')
save('head_left',4*pi*(ratio+qi(a)/16-C*C));save('head_right',4*pi*((C+1)**2-ratio-qi(b)/16))
save('V1_site_gap1',qi(X)-leftwall(C,0),4);save('V1_site_gap2',leftwall(C+1,Q(1809,10000))-(X+1),4)
ck(out['scalars']['V1_site_gap1']['FLOOR4']=='5377392.8789' and out['scalars']['V1_site_gap2']['FLOOR4']=='11989041.1415','V1 geometry anchors')
# Exact interval subtraction: None denotes upper +infinity.
def nonempty(i):
 l,u,lc,uc=i;return u is None or l<u or l==u and lc and uc
def intersect(i,j):
 l=max(i[0],j[0]);lc=(i[2] if l==i[0] else True) and (j[2] if l==j[0] else True)
 u=j[1] if i[1] is None else i[1] if j[1] is None else min(i[1],j[1])
 uc=False if u is None else (i[3] if u==i[1] else True) and (j[3] if u==j[1] else True)
 v=(l,u,lc,uc);return v if nonempty(v) else None
def remove(i,j):
 v=intersect(i,j)
 if v is None:return [i]
 pieces=[(i[0],v[0],i[2],not v[2])]
 if v[1] is not None:pieces.append((v[1],i[1],not v[3],i[3]))
 return [w for w in pieces if nonempty(w)]
def complement(target,cover):
 left=[target]
 for c in cover:left=[v for w in left for v in remove(w,c)]
 return left
def inside(i,x):return (x>i[0] or x==i[0] and i[2]) and (i[1] is None or x<i[1] or x==i[1] and i[3])
def decode(box0,axis):return (Q(box0[axis][0]),None if box0[axis][1]=='inf' else Q(box0[axis][1]),*box0[axis+'_closed'])
def full_union(boxes):
 times=sorted({a,b}|{Q(v) for bx in boxes for v in bx['t']});cells=[times[0]-1,times[-1]+1]+times+[(v+w)/2 for v,w in zip(times,times[1:])]
 for tt in cells:
  active=[decode(bx,'x') for bx in boxes if inside(decode(bx,'t'),tt)]
  if a<=tt<=b:
   if complement((Q(0),None,True,False),active):return False
   if any(complement(v,[(Q(0),None,True,False)]) for v in active):return False
  elif active:return False
 return True
contract=json.loads(Path('CONTRACTS.json').read_text());boxes=contract['emitted_boxes']
ck(full_union(boxes) and len(boxes)==2,'exact global interval difference empty')
ck(complement((Q(C),None,True,False),[(Q(L),Q(U),True,True) for L,U in partition]+[(Q(H),None,True,False)])==[],'all-index continuum union before natural selection')
ck(remove((Q(0),Q(1),True,True),(Q(0),Q(1),False,False))==[(Q(0),Q(0),True,True),(Q(1),Q(1),True,True)],'isolated endpoints selftest')
# Discrete old-bin proof by half-open unit-cell intervals [L,U+1).
ck(complement((Q(2),Q(C+1),True,False),[(Q(L),Q(U+1),True,False) for L,U in old])==[],'all old terms by independent subtraction')
ck(sum(U-L+1 for L,U in old)==C-1,'no repeated old term')
for j,name in enumerate(['isolated seam','initial time','unbounded ray','new-time collar','integer gap','excess point']):
 bb=copy.deepcopy(boxes)
 if j==0:bb[0]['x_closed'][1]=False;bb[1]['x_closed'][0]=False
 if j==1:
  for bx in bb:bx['t_closed'][0]=False
 if j==2:bb.pop()
 if j==3:bb[1]['t'][0]='4/25'
 if j==4:bb[0]['x'][1]=str(X-1);bb[1]['x'][0]=str(X+1)
 if j==5:bb[0]['x'][0]='-1'
 ck(not full_union(bb),name);out['mutations'].append(name)
ck(complement((Q(C),None,True,False),[(Q(C),Q(H),True,False),(Q(H),None,False,False)])==[(Q(H),Q(H),True,True)],'isolated index-H hole is detected')
ck(not full_union([dict(boxes[0]),dict(boxes[1],t=['4/25','3/16'])]),'old practical-tail time cannot fill lower collar')
T=3000175332800
ck(T-Q(X,2)==Q(350479773,2)>0 and Q(21,125)+Q(39,2000)==b and 0<a<b<Q(1,2),'anchor height and strict band')
ck(Q(186,1000)+Q(16733,100000)**2/2==Q(19999966445,10**11) and T-Q(5000000194858,2)==500175235371,'distinct accepted old height regime')
for name,value in [('a',a),('b',b),('source_time',source),('backward_duration',h),('X',X),('C',C),('H',H),('raw_floor',m),('zero_derivative_floor',d),('derivative_squared_surplus',square),('RH_required',Q(X,2)),('RH_margin',T-Q(X,2)),('stall_r',a/2),('stall_exponent',128/(a/2)),('improvement_over786',source-a),('improvement_over_board',Q(33,200)-a),('old_nonconstant_terms',C-1),('old_bins',len(old)),('rough_bins',len(weights)),('finite_leaves',len(partition)),('missing_components',0),('excess_components',0)]:out['exact'][name]=str(value)
out['checks']=COUNT;out['max_unscaled_complete_series_remainder']=str(maxrem);out['full_proof_not_sampled']=True;out['external_record_audit']=False
Path('SECOND_RESULT.json').write_text(json.dumps(out,indent=2,sort_keys=True)+'\n')
print('SECOND_LINE_CHECKS',COUNT)
print('SECOND_MINIMUM',worst['L'],worst['U'],worst['retained']['FLOOR12'],worst['retained']['CEIL12'])
print('SECOND_INFINITE',out['tail']['retained']['FLOOR12'],out['tail']['retained']['CEIL12'])
print('SECOND_LINE: ALL PASS')
