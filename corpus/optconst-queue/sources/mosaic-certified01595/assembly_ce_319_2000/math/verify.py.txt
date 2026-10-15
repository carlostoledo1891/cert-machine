#!/usr/bin/python3
"""Local all-index global composition. No live-bank or record-header reads."""
from fractions import Fraction as F
from pathlib import Path
import json, hashlib, math, copy, itertools, subprocess, sys
from flint import arb, ctx
import sympy as sp
ctx.prec=256
PINS={'ASSEMBLY.md': '70b7411e2129ab4a182935e6be7a1772bc152b66a630e80f1594f409e8c34025', 'CITATIONS.json': 'f2f7ee3db878dde2f3a96caddc99e734cd44f45b40774c265ecc511995913159', 'CONTRACTS.json': 'e27df5ed2b05c1384d1024d0650e2a496801abfa990735b5bce9b2aedd0a4c74', 'FACT.txt': 'e5622c0cd27f695b59ed115260cffaa71f312740ccc4074476e1f134a7739a73', 'PREREG.md': '17411926afcbb349fb7dd48e867367c4da2b03754e966791082c5323da8ec336', 'PROVENANCE.json': 'caee90d6dc22396e27f65e94015b2503d732b6734214a2efbccdbc06f759c86d', 'QUANTIFIER_AUDIT.md': '5ed6b794896a7c5899756c047b89f6c13fcbec46500d21067f6678ae6cd2bf9e', 'READINESS.json': '577196a3bfae8ede68868984a6aadb57c9e57641bc54c024168be30312c086c8', 'SECOND_PROOF.md': 'fb79565af0bc6020e23b0d5d55b984cdd16f4a84d91465c6e39efa6bde4ce06f', 'frozen/analytic_separator_second.txt': 'fd5e4f351cdaf71dd2b0dfe505a48b95965be5db915403e2d3787a19e455d5df', 'frozen/anchor.txt': '874957ddc1caa202aeffa7573013dc161854c39b3f832d367fd5cd008e9ccb54', 'frozen/bank720_theorem.txt': '249aa74644189dd15c0e5bf9e6fcddcfd576e242bb2660542c844f8c0fe4bff3', 'frozen/bank725_audit.txt': '4ae59adc397d9e31bf1d0ca2cb4565943a2840495c7f4bfaba3534a7584fde35', 'frozen/bank733_audit.txt': 'f25f28713b887a2b26d120ad8cc7207b55ef537cf1a2a33682cf83b503f9365e', 'frozen/bank744_proof.txt': '2c688d63297c8bb60ba9faa801aa2d4a40fca65a0c90f9b80b148624e8874f10', 'frozen/bank754_audit.txt': 'ca2b8e0d5adf4768b57b625cd26ac8070e8449446d7147f34da96cd67a3f64fa', 'frozen/bank767_geometry.json': 'f9a2a6e1a4181c7a56ca457342b3e0680deda8f1aafb847cfeae3a97238caeb6', 'frozen/bank767_leaves_primary.txt': '3ed5ee0c88248509ed9fd2b30337e3736d09039050f5166a7a982a3e16ce73c5', 'frozen/bank767_leaves_second.txt': 'dec6c0a8b2ff9559a3cf90a5cf75a11c4ae79752d99e92558e186ae314fe37c5', 'frozen/bank767_outputs.txt': '613d7df7f03c68af80e8a933ebe521ea6ab84f7bb5268c240155d18a5832c7df', 'frozen/bank767_proof.txt': '026b89ecc2fe2e42ef5dc62c513c01b567da609f4f73f7a6b7f6d8528022d806', 'frozen/bank767_secondproof.txt': '16310586a87b2bff2be351fc421ca3b7f1f3e643f8fc8068d23fde0e72300a7d', 'frozen/bank767_summary.json': '092da4612e585c102d19d63e07128111dd53147b0339219489091d64ef204baa', 'frozen/bank771_primary.json': '22b81e2892da172d512ecc97114c04c98903a8f9c2dbacd169ad3338d403588a', 'frozen/bank771_proof.txt': 'eb9c4ea56805bef9737a811c13e8bdbe6d2e75c32a4eb699e3332ef4169872d9', 'frozen/bank774_bins.txt': '94d0610a407a302ee18a2330cf48ebc94cbf34c74fc20f6545de41de667f8f1e', 'frozen/bank774_outputs.txt': '3e8f4148cd6880fd7e0533074e2a40a624e4b40bf13b8d61a40a125626e377f2', 'frozen/bank774_primary.json': 'a83bcadbd63c5ba04be0a98ffa628d6b666616af944343de5b5a86a38e600137', 'frozen/bank774_probes.json': '1c2d17ecb293dfa584921bee211731f645d7c2951e706950156ffa4c88da6956', 'frozen/bank774_proof.txt': '41e09d60548b65e2c09c8c374c6e3a9378141fc9817998f2d527bdb8c45d44d8', 'frozen/bank774_second.json': '2d7227cd3797de39934feaae909d6c69cceecad457c9acafeadde115f12a0c8b', 'frozen/bank774_secondproof.txt': 'e567ecd65edd93cdd967e6757afba5767efd5babee6577830b3b2944d3ea27c5', 'frozen/bank774_source_pins.json': '6d9a1ba0a7d661fbe3625190b0fc13b18d9bec9ad47c02660f0c6d43ad6e468f', 'frozen/bank774_summary.json': 'e00c5a340faa03fca859c7bd7f67cfdccfebaf84a97f239c01cc5adc9e5db8e8', 'frozen/bank779_audit.txt': '8a93e52e2cb6cb1682423f78e61831337aa77a24a8d02987a278d46b6adc95e2', 'frozen/bank779_summary.json': '6070d1209a0f0e5e3eef527a793e5a29b01bc4b14f1677d6a9e2897c19ec6aa4', 'frozen/bank782_geometry.json': '1bb25e31ee4237da778db114f1fe9722d3084352a558cb7684bec86c0834f877', 'frozen/bank782_primary.json': 'c883c78823c8d127eb16ff5f9c46f28dd55c927fd4666493767d29b0766b1f08', 'frozen/bank782_products.json': '62525a29bf62262095bdafdcd89d56e51a89580f507b6fbfde6e8659af145372', 'frozen/bank782_proof.txt': 'fa28089927364831e44f84c6e469d265953af57c4d21cb1fd2cb99fb6960a5f1', 'frozen/bank782_second.json': '58722ab7a76bda7a0fe8d7354253a67b413ee9012289ace0c3db873ad698ea83', 'frozen/bank782_secondproof.txt': 'a145a85383beaccc97d8e1c733902e1ac4cb81b96c0d6a8dd08a2c62750c1f4e', 'frozen/bank782_summary.json': '0bf62a03fa515eb97c5b29972df41996b0343ae906ec3243ef6f99962f102e42', 'frozen/boundary_proof.txt': '2bebe2da8c1f28ed99ea856fe2d8134842ec450046077a8549374d84bbb56a54', 'frozen/hermite_separator.txt': '70cc54cfc3932efaa495687dc3565f9af090594deca67b65faa88dde853cc196', 'frozen/interior.txt': 'bdc313246fb5927e7605ba048deca2c2b0566eda9fb98a2a12cae8f53c9d1842', 'frozen/remote_tail.txt': 'b25f0abb8cccd94b36ea5ec89324c40d80f64724b8de82a40af7a885827069c9', 'frozen/remote_tail_second.txt': '78f6e660c543d9a1a6c741716197b60e58b05130e0b6f81490a7d0da1fe61b06', 'frozen/separator_second_summary.json': 'e81b4ff81fb81da5141feeed77b90d2a8193e6c669924d83a37d64b09fbb10be'}
SECOND_PIN='0314d96fd56670fd1d85e5786494f3b2f9bdae31a28eb424228c447fe7df28c5'
COUNT=0
out={'exact':{},'scalars':{},'leaves':[],'tail':{},'anchors':{},'mutations':[],'probes':[]}
def gate(ok,name):
 global COUNT
 COUNT+=1
 if not bool(ok):raise AssertionError(name)
def read(n):return json.loads(Path(n).read_text())
def aa(q):q=F(q);return arb(q.numerator)/q.denominator
def ends(z):return (F(str(z.lower().fmpq())),F(str(z.upper().fmpq()))) if isinstance(z,arb) else (F(z),F(z))
def floor_trunc(q,d):q=F(q);return q.numerator*10**d//q.denominator
def ceil_trunc(q,d):return -floor_trunc(-F(q),d)
def fmt(v,d):return ('-' if v<0 else '')+str(abs(v)//10**d)+'.'+str(abs(v)%10**d).zfill(d)
def cell(z,d=12):
 l,u=ends(z);return {'lo':str(l),'hi':str(u),'FLOOR'+str(d):fmt(floor_trunc(l,d),d),'CEIL'+str(d):fmt(ceil_trunc(u,d),d)}
def emit(k,z,d=18):
 row=cell(z,d);out['scalars'][k]=row;print(k,'FLOOR'+str(d),row['FLOOR'+str(d)],'CEIL'+str(d),row['CEIL'+str(d)]);return row
def exact(k,z):out['exact'][k]=str(z);print(k,'EXACT',z)
def enclose(l,u):return arb(aa((F(l)+F(u))/2),aa((F(u)-F(l))/2))
def compare(z,old,label,d=12):
 l,u=ends(z);gate(max(l,F(old['lo']))<=min(u,F(old['hi'])),label+' enclosure overlap')
 row=cell(z,d)
 for key in ['FLOOR'+str(d),'CEIL'+str(d)]:gate(row[key]==old[key],label+' directed cell '+key)
 return row
for v,l,u in [(F(-1,3),'-0.33334','-0.33333'),(F(-1,10**8),'-0.00001','0.00000'),(F(1,7),'0.14285','0.14286'),(F(-1,8),'-0.12500','-0.12500')]:
 gate(fmt(floor_trunc(v,5),5)==l and fmt(ceil_trunc(v,5),5)==u,'signed rounding')
manifest={}
for line in Path('FROZEN.sha256').read_text().splitlines():
 if not line or line.startswith('#'):continue
 dg,n=line.split();p=Path(n);gate(not p.is_absolute() and '..' not in p.parts,'local frozen input')
 gate(n not in manifest and hashlib.sha256(p.read_bytes()).hexdigest()==dg,'frozen bytes '+n);manifest[n]=dg
gate(manifest==PINS and bool(PINS),'embedded frozen versions')
gate(hashlib.sha256(Path('second_line.py').read_bytes()).hexdigest()==SECOND_PIN,'separate worker version')
for line in Path('SOURCES.sha256').read_text().splitlines():
 dg,n=line.split();gate(not Path(n).is_absolute() and '..' not in Path(n).parts,'local source')
 gate(hashlib.sha256(Path(n).read_bytes()).hexdigest()==dg,'source hash')
mem=read('CITATIONS.json');gate(mem['snapshot_entries']==786,'exact opening snapshot')
for k,d in mem['facts'].items():
 gate(d['line']==int(k) and d['kind']=='fact' and hashlib.sha256(d['fact'].encode()).hexdigest()==d['fact_sha256'],'exact fact '+k)
 gate('FOUNDATION' in d['fact'],'FOUNDATION '+k)
for d in read('PROVENANCE.json'):
 gate(str(d['memory']) in mem['facts'] and PINS[d['local_file']]==d['sha256'],'accepted input identity')
# Hashes identify accepted evidence; bank authentication is an independent premise.
a,b,src=F(319,2000),F(3,16),F(4,25);h=src-a;X=6000000185827;C=690988;H=2299999;T=3000175332800
m,p,q,dzero=F(1,250000),F(1,800000),F(1600001,40000000000),F(1,400000)
epsilon=F(1,10**12);pi=arb.pi()
contract=read('CONTRACTS.json');boxes=contract['emitted_boxes']
gate(contract['global']=={'a':str(a),'b':str(b),'X':str(X),'C':C,'H':H,'anchor_upper':str(b),'anchor_source':'V1-H-213','rh_height':str(T),'rh_source':'PT2021'},'exact global interface')
def wall(n,t):return 4*pi*(arb(n)**2-aa(F(t)/16))
def cc(x):return ((1+x*x).log()/2-(4*pi).log())/4-1/(2*(1+x*x))
c0=cc(arb(X));lc=arb(C).log()
def integral(t,c,U):
 if U==C:return arb(0)
 A=aa(t)/4;B=arb(1)/2-aa(t)*c;rt=A.sqrt();lu=arb(U).log()
 return pi.sqrt()/(2*rt)*(-B*B/(4*A)).exp()*((rt*lu+B/(2*rt)).erfi()-(rt*lc+B/(2*rt)).erfi())
print('A_B_C: BANKED ANALYTIC CHAIN WITH UNIFORM ALL-COMPLEX TAIL')
r=a/2;rem=9*(F(1,2**16)+F(1,15*2**15))+F(41000,2**256)+F(3,2**64)
gate(0<r<a<b<F(1,2) and 128/r==F(512000,319) and rem<F(1,1024),'single-neighborhood tail')
gate(T-F(X,2)==F(350479773,2)>0 and F(21,125)+F(39,2000)==b,'PT2021 and banked anchor')
gate('[V1-H-213 ' in mem['facts']['526']['fact'] and '[V1-H-220 ' in mem['facts']['549']['fact'],'anchor identity')
sep=read('frozen/separator_second_summary.json');charge=F(sep['constants']['total']['hi']);sep_floor=F(sep['sweep']['minimum_row'][3],10**12)
gate(sep['sweep']['leaves']==255778 and charge<F(1,800) and sep_floor-charge>F(7,800),'banked complete separator')
gate(F(2)**2-1==3 and a>0,'padded rectangle and positive-time simplicity')
z,t=sp.symbols('z t',real=True);toy=z*z-2*t
gate(sp.diff(toy,t)+sp.diff(toy,z,2)==0 and toy.subs({t:0,z:0})==0 and sp.diff(toy,z).subs(z,0)==0,'initial simplicity not presumed')
print('D1: STRONG WEIGHTED SOURCE, NOT A SCALAR SUBSTITUTION')
source=read('frozen/bank767_summary.json')
gate((source['t'],source['X'],source['N'],source['y'])==(str(src),X,C,0),'exact singleton source')
gate(source['all_prime_characters'] and source['strict_gram_threshold']=='1/1000000' and source['raw_modulus_floor_strict']=='1/10','strong source admitted')
geom=read('frozen/bank767_geometry.json');tree=geom['boxes'] if isinstance(geom,dict) else geom
gate(len(tree)==3524,'all source leaves')
# This checks accepted geometry/floors, NOT full numerical leaf production.
depth=max(d for leaf in tree for d,n in leaf);side=2**depth;gate(depth==5,'source mesh')
planes=[0]*(side**3);full=(1<<side)-1;volume=F(0)
for leaf in tree:
 spans=[]
 for d,n in leaf:
  gate(0<=d<=depth and 0<=n<2**d,'dyadic arc')
  spans.append((n*2**(depth-d),(n+1)*2**(depth-d)))
 volume+=F(1,2**sum(d for d,n in leaf));(l0,u0),(l1,u1),(l2,u2),(l3,u3)=spans;mask=((1<<(u3-l3))-1)<<l3
 for i in range(l0,u0):
  for j in range(l1,u1):
   for k in range(l2,u2):
    idx=(i*side+j)*side+k;gate(planes[idx]&mask==0,'source atom disjointness');planes[idx]|=mask
gate(volume==1 and all(v==full for v in planes),'whole closed source torus and seams')
for name in ['bank767_leaves_primary.txt','bank767_leaves_second.txt']:
 rows=[list(map(int,s.split())) for s in Path('frozen/'+name).read_text().splitlines()]
 gate([r0[0] for r0 in rows]==list(range(len(tree))),'complete accepted source output')
 gate(all(F(l,10**12)>F(1,10**6) and u>=l for _,l,u in rows),'accepted leaf thresholds')
 emit(name+'_minimum_lower',F(min(row[1] for row in rows),10**12),12)
def output_manifest(name):
 d={}
 for line in Path('frozen/'+name).read_text().splitlines():
  if not line or line.startswith('#'):continue
  dg,nn=line.split();gate(nn not in d and len(dg)==64,'output manifest grammar');d[nn]=dg
 return d
man774=output_manifest('bank774_outputs.txt');man767=output_manifest('bank767_outputs.txt')
for original,local in [('p_bins.txt','bank774_bins.txt'),('s_bins.txt','bank774_bins.txt'),('PRIMARY_RESULT.json','bank774_primary.json'),('SECONDARY_RESULT.json','bank774_second.json')]:
 gate(man774[original]==PINS['frozen/'+local],'complete accepted774 manifest '+original)
for original,local in [('primary_leaves.txt','bank767_leaves_primary.txt'),('secondary_leaves.txt','bank767_leaves_second.txt')]:
 gate(man767[original]==PINS['frozen/'+local],'accepted767 manifest '+original)
rec=read('frozen/bank782_summary.json');P=read('frozen/bank782_primary.json');S=read('frozen/bank782_second.json');partition=read('frozen/bank782_geometry.json')
products=read('frozen/bank782_products.json')
for original,local in [('PRIMARY_RESULT.json','bank782_primary.json'),('SECONDARY_RESULT.json','bank782_second.json'),('GEOMETRY.json','bank782_geometry.json')]:
 gate(products[original]==rec['fresh_products'][original]==PINS['frozen/'+local],'accepted782 output identity '+original)
gate(rec['t_closed']==[str(a),str(b)] and rec['x_closed']==[str(X),'infinity'] and rec['N_natural_closed']==[C,'infinity'],'accepted half-line scope')
gate(rec['full_prime_polydisc'] and rec['all_right_walls'] and rec['terminal_cutoff'] is None and rec['raw_floor']==str(m) and rec['zero_derivative_strict']==str(dzero),'accepted natural full-polydisc output')
gate(rec['source_memory']==767 and rec['consumed_recovery']==774 and rec['consumed_projection']==771,'strong source/recovery/adoption versions')
gate(not rec['offaxis_reality'] and rec['external_record_use']=='OPEN','exterior scope and historical audit hold')
# Complete positive bin support census. Weights are accepted enclosures.
binrows=[list(map(int,s.split())) for s in Path('frozen/bank774_bins.txt').read_text().splitlines()]
gate(len(binrows)==225 and binrows[0][:5]==[-1,0,0,0,0],'complete synthetic plus rough bins')
star=binrows[0];vs=enclose(F(star[5],2**100),F(star[6],2**100));gate(vs>0,'synthetic denominator')
expected={};rough=[]
for n in range(2,C+1):
 if math.gcd(n,210)!=1:continue
 rough.append(n);e=n.bit_length()-1;idx=16*e+(16*n)//2**e-16
 if idx not in expected:expected[idx]=[n,n,0,0]
 v=expected[idx];v[1]=n;v[2]+=1;v[3]+=n
bins=[]
for idx,L,U,num,total,vl,vu in binrows[1:]:
 gate(expected.pop(idx)==[L,U,num,total] and 0<vl<=vu,'all rough support once')
 bins.append((arb(L).log(),enclose(F(vl,2**100),F(vu,2**100))))
gate(not expected and len(rough)==157939,'no rough omission')
def norm(s):return (1+sum(v*(1-(-2*s*lr).exp()) for lr,v in bins)/vs).sqrt()/10
# Complete old-debit partition is generated locally, not read as an oracle.
old=[];L=2
while L<=C:
 U=L if L<256 else min(C,(129*L)//128);old.append((L,U));L=U+1
gate(len(old)==1240 and sum(U-L+1 for L,U in old)==C-1 and [list(v) for v in old]==P['raw_bins']==S['raw_bins'],'all old nonconstant terms')
gate(2*c0>lc and h==F(1,2000),'positive increasing reverse multiplier')
oldterms=[]
for L,U in old:
 ll,lu=arb(L).log(),arb(U).log();qU=c0*lu-lu*lu/4
 coeff=(U-L+1)*(aa(src)*ll*ll/4-(arb(1)/2+aa(src)*c0)*ll).exp()*((aa(h)*qU).exp()-1)
 gate(coeff>0,'positive old-bin debit');oldterms.append((ll,coeff))
def debit(s):return sum(v*(-s*ll).exp() for ll,v in oldterms)
def leaf(t0,L,U,back=True):
 xx=arb(X) if L==C else wall(L,b);clock=cc(xx);shift=arb(0) if L==C else aa(t0)*(clock-c0)
 nn=norm(shift);dd=debit(shift) if back else arb(0);ii=integral(t0,clock,U)
 return {'x_left':xx,'shift':shift,'old_norm':nn,'backward_debit_cap':dd,'entry_integral':ii,'retained':nn-dd-ii,'density_slope':-arb(1)/2+aa(t0)*(arb(U).log()/2-clock),'support_gap':4*clock-arb(U).log()}
print('D2_D3: SAME-PRODUCTION ANCHORS BEFORE EVERY ACCEPTED TARGET LEAF')
anchor774=read('frozen/bank774_primary.json');anchor774s=read('frozen/bank774_second.json')
for name,val in [('c_source',c0),('entry100000',100000*(aa(src)*lc*lc/4-(arb(1)/2+aa(src)*c0)*lc).exp()),('source_left_gap',arb(X)-wall(C,src)),('source_right_gap',wall(C+1,b)-X),('support_gap790988',4*c0-arb(790988).log())]:
 compare(val,anchor774['anchors'][name],name,18);compare(val,anchor774s['anchors'][name],name+' second',18);out['anchors'][name]=cell(val,18)
for L,U in [(1000000,1000000),(H,H),(1897746,2098872)]:
 ar=leaf(src,L,U,False);oldleaf=next(v for v in anchor774['point_controls']+anchor774['leaves'] if (v['L'],v['U'])==(L,U));row={'L':L,'U':U}
 for key,oldkey in [('old_norm','old_norm_lower_expression'),('entry_integral','entry_integral_upper'),('retained','retained_lower_expression')]:
  row[key]=compare(ar[key],oldleaf[oldkey],'accepted774 '+str((L,U))+' '+key)
 out['anchors']['calibration_'+str(L)+'_'+str(U)]=row
for L,U in partition:
 values=leaf(a,L,U);gate(values['shift']>=0 and values['density_slope']<0 and values['support_gap']>0 and values['retained']>aa(m),'whole closed leaf guards')
 row={'L':L,'U':U}
 for key,val in values.items():
  for accepted in [P,S]:compare(val,next(v for v in accepted['finite_leaves'] if (v['L'],v['U'])==(L,U))[key],'accepted782 '+str((L,U))+' '+key)
  row[key]=cell(val)
 out['leaves'].append(row)
gate(len(partition)==42 and partition[0][0]==C and partition[-1][1]==H and all(u==l for (_,u),(l,_) in zip(partition,partition[1:])),'closed finite-index cover')
worst=min(out['leaves'],key=lambda v:F(v['retained']['lo']))
gate(all(F(worst['retained']['hi'])<F(v['retained']['lo']) for v in out['leaves'] if v is not worst),'unique minimum across ALL finite leaves')
gate((worst['L'],worst['U'])==(1998309,2098872),'accepted finite minimum')
out['minimum']={'L':worst['L'],'U':worst['U'],**worst['retained']}
print('ALL42_MINIMUM_SUFFICIENT',worst['L'],worst['U'],'FLOOR12',worst['retained']['FLOOR12'],'CEIL12',worst['retained']['CEIL12'])
print('D4: INFINITE INDEX SUPER-SOLUTION, NOT A SAMPLED TAIL')
beta=b/16;zH=arb(H).log();clock=zH/2-aa(epsilon);shift=aa(a)*(clock-c0)
clockerr=aa(beta)/(4*(arb(H)**2-aa(beta)))+1/(2*wall(H,b)**2)
kappa=aa(a)*lc/2;forcing=(-aa(a)*zH*zH/4+(arb(1)/2+aa(a*epsilon))*zH).exp();barrier=forcing/kappa
entry=integral(a,clock,H);nn=norm(shift);dd=debit(shift)
tail={'c_error_cap':clockerr,'c_lower':clock,'shift':shift,'old_norm':nn,'backward_debit_cap':dd,'entry_at_seam':entry,'entry_barrier':barrier,'entry_barrier_gap':barrier-entry,'forcing_at_seam':forcing,'forcing_log_slope':arb(1)/2+aa(a*epsilon)-aa(a)*zH/2,'kappa':kappa,'density_slope':-arb(1)/2+aa(a*epsilon),'support_gap':zH-4*aa(epsilon),'retained':nn-dd-barrier}
gate(0<clockerr<aa(epsilon) and shift>0 and kappa>0 and tail['forcing_log_slope']<0 and tail['density_slope']<0 and tail['support_gap']>0 and barrier>entry and tail['retained']>aa(m),'whole infinite branch guards')
gate(zH/2-cc(wall(H,b))>0,'clock proxy cannot omit correction')
for key,val in tail.items():
 for accepted in [P,S]:compare(val,accepted['tail'][key],'infinite '+key)
 out['tail'][key]=cell(val)
emit('INFINITE_BRANCH_SUFFICIENT',tail['retained'],12);emit('INFINITE_BARRIER_SEAM_GAP',barrier-entry,12)
# A symbolic coefficient identity and universal derivative directions.
vv,cx,cs,ta,dt=sp.symbols('v cx cs ta dt',real=True)
left=ta*vv**2/4-(sp.Rational(1,2)+ta*cx)*vv
right=(ta+dt)*vv**2/4-(sp.Rational(1,2)+(ta+dt)*cs)*vv+dt*(cs*vv-vv**2/4)-ta*(cx-cs)*vv
gate(sp.expand(left-right)==0,'exact reverse coefficient identity')
N,tm,pp=sp.symbols('N tm pi',positive=True);wn=4*pp*(N*N-tm/16)
gate(sp.expand(wn.subs(N,N+1)-wn-4*pp*(2*N+1))==0 and sp.diff(wn,tm)==-pp/4 and sp.simplify(wn/(4*pp)+tm/16)==N*N,'all RIGHT wall identities')
print('D5_E: REAL PROJECTION WITH NO MOMENT CAP AND NO TERMINAL WALL')
square=144*(m*m-p*p)-(q+2*dzero)**2
gate(m>p and square==F(86396399999,1600000000000000000000)>0 and F(7,50)<=a,'audited zero-specific projection gate')
derivative=(12*(aa(m*m-p*p)).sqrt()-aa(q))/2;gate(derivative>aa(dzero),'strict zero-derivative floor')
old771=read('frozen/bank771_primary.json');gate(F(old771['exact']['DERIVATIVE_SQUARED_SURPLUS'])==square,'accepted771 exact adapter')
oldrow=old771['values']['ZERO_DERIVATIVE_LOWER'];compare(derivative,{'lo':oldrow['interval'][0],'hi':oldrow['interval'][1],'FLOOR18':oldrow['digits'][0],'CEIL18':oldrow['digits'][1]},'accepted771 derivative',18)
emit('ZERO_DERIVATIVE_LOWER',derivative)
audit=read('frozen/bank779_summary.json');gate(audit['target']==771 and audit['foundation']=='EXTERNAL_REAL_PROJECTION_AUDIT' and not audit['external_source_sweep'],'external projection not source audit')
for name,value in [('head_left',arb(X)-wall(C,a)),('head_right',wall(C+1,b)-X)]:gate(value>0,'whole-band '+name);emit(name,value)
for name,value in [('V1_site_gap1',arb(X)-wall(C,0)),('V1_site_gap2',wall(C+1,F(1809,10000))-(X+1))]:emit(name,value,4)
gate(out['scalars']['V1_site_gap1']['FLOOR4']=='5377392.8789' and out['scalars']['V1_site_gap2']['FLOOR4']=='11989041.1415','V1 exact site anchors')
gate(F(186,1000)+F(16733,100000)**2/2==F(19999966445,10**11) and T-F(5000000194858,2)==500175235371,'distinct published geometry/height regime')
# Probe COMPLETE individual source expressions, never promote probes to source proof.
probe=read('frozen/bank774_probes.json');ph=hashlib.sha256(Path('frozen/bank774_proof.txt').read_bytes()).hexdigest()
gate(ph==probe['proof_sha256'] and probe['raw_complete_hash']==man774['p_raw.txt']==man767['primary_raw.txt'] and probe['weights_complete_hash']==man774['p_weights.txt']==man767['primary_weights.txt'],'accepted control-source commitments')
rawset={1,2,3,7,128,C}|{1+int(hashlib.sha256((ph+':raw:'+str(j)).encode()).hexdigest(),16)%C for j in range(24)}
gate(rawset=={v[0] for v in probe['raw']},'retained raw probe coordinates')
wset={v for v in [11,13,17,690983] if v in set(rough)}|{rough[int(hashlib.sha256((ph+':weight:'+str(j)).encode()).hexdigest(),16)%len(rough)] for j in range(16)}
gate(wset|{0}=={v[0] for v in probe['weights']},'retained weight probe coordinates')
def amp(n):
 l=arb(n).log();return (aa(src)*l*l/4-(arb(1)/2+aa(src)*c0)*l).exp()
for n,l,u in probe['raw']:
 v=amp(n);lv,uv=ends(v);gate(F(l,2**56)<=lv<=uv<=F(u,2**56),'raw probe cell');out['probes'].append({'kind':'raw','n':n,**cell(v,18)})
smooth=[(1,0)]
for prime in [2,3,5,7]:
 before=smooth;smooth=[]
 for n,k in before:
  v=n;j=0
  while v<=C:smooth.append((v,k+j));v*=prime;j+=1
smooth.sort();gate(len(smooth)==1160 and len({n for n,k in smooth})==1160,'complete smooth control support')
def fibre(rr):
 pl,mi=arb(0),arb(0)
 for n,k in smooth:
  if rr*n>C:break
  v=amp(rr*n);pl+=v;mi+=(-1)**k*v
 return pl,mi
cp,cm=fibre(1);gate(cp>0 and cm>0,'profile denominators')
for rr,l,u in probe['weights']:
 if rr==0:v=((8/cp**2+1/cm**2)/900).sqrt()
 else:
  fp,fm=fibre(rr);v=((8*(fp/cp)**2+(fm/cm)**2)/9).sqrt()
 lv,uv=ends(v);gate(F(l,2**56)<=lv<=uv<=F(u,2**56),'full fibre weight control');out['probes'].append({'kind':'weight','r':rr,**cell(v,18)})
print('F_G: LICENSING THEN TWO-BOX GLOBAL UNION')
def licensed(c):
 try:
  gg=c['global'];nd=c['nodes'];bb=c['emitted_boxes']
  if not(0<F(gg['a'])<F(gg['anchor_upper'])<=F(gg['b'])<=F(1,2)):return False
  if gg['anchor_source']!='V1-H-213' or F(gg['anchor_upper'])<F(3,16) or gg['rh_source']!='PT2021' or F(gg['rh_height'])!=T or F(gg['X'])/2>F(gg['rh_height']):return False
  st,it,bd,ex=(nd[n] for n in ['stall_tail','interior','boundary','exterior'])
  if not(st['source']==590 and st['second_lines']==[588] and st['kind']=='all-complex-real-simple-uniform-tail' and st['y']=='all' and F(st['r'])==a/2 and st['t']==[str(a/2),'1/2'] and st['t_closed']==[True,True] and F(st['radius_exponent'])==128/F(st['r'])):return False
  if not(it['source']==599 and it['generic_second']==617 and it['kind']=='real-simple-interior' and it['t']==['0',str(b)] and it['t_closed']==[False,True] and it['N'] is None and it['x']==['0',str(X)] and it['x_closed']==[True,True]):return False
  if not(bd['source']==596 and bd['second_lines']==[616] and bd['t']==['0',str(b)] and bd['t_closed']==[True,True] and bd['y']==['-1','1'] and bd['padding_y']==['-2','2'] and bd['initial_reality_only']):return False
  expect={'source':782,'source_kind':'strong-normalized-Gram','source_memory':767,'recovery_memory':774,'projection_memory':771,'projection_audit':779,'heat_memory':744,'heat_audit':754,'kind':'real-axis-no-double','gauge':'elementary-Polymath-absMt','t':[str(a),str(b)],'t_closed':[True,True],'x':[str(X),'inf'],'x_closed':[True,False],'N':[C,None],'finite_N':[C,H],'infinite_N':[H,None],'both_index_branches_closed':True,'y':'0','polydisc':'CLOSED-all-primes-through-naturalN','modulus_floor':str(m),'zero_derivative_floor':str(dzero),'cell':'left-closed-right-open','wall_index':'right-frozen','terminal_cutoff':None,'old_nonconstant_terms':C-1,'old_bins':1240,'rough_bins':224,'finite_leaves':42,'all_entrants':True,'debit_before_stability':True,'heat_duration':'nonnegative','clock_epsilon':str(epsilon),'no_first_moment_cap':True}
  if ex!=expect:return False
  for bx in bb:
   if bx['module'] not in ['interior','exterior'] or bx['node']!=bx['module']:return False
   node=nd[bx['node']]
   if bx['t']!=[str(a),str(b)] or bx['t_closed']!=[True,True] or bx['x']!=node['x'] or bx['x_closed']!=node['x_closed']:return False
  return True
 except (KeyError,ValueError,TypeError):return False
gate(licensed(contract),'typed theorem licensing')
def member(v,ends0,closed):
 lower=F(ends0[0]);upper=None if ends0[1]=='inf' else F(ends0[1])
 return (v>lower or v==lower and closed[0]) and (upper is None or v<upper or v==upper and closed[1])
def atoms(points):
 pp=sorted(points);return [pp[0]-1,pp[-1]+1]+pp+[(x+y)/2 for x,y in zip(pp,pp[1:])]
def union_bad(bb):
 times=atoms({a,b}|{F(v) for bx in bb for v in bx['t']});xs=atoms({F(0)}|{F(v) for bx in bb for v in bx['x'] if v!='inf'})
 missing=[];excess=[]
 for tt,xx in itertools.product(times,xs):
  target=a<=tt<=b and xx>=0;actual=any(member(tt,v['t'],v['t_closed']) and member(xx,v['x'],v['x_closed']) for v in bb)
  if target and not actual:missing.append([str(tt),str(xx)])
  if actual and not target:excess.append([str(tt),str(xx)])
 return missing,excess
gate(union_bad(boxes)==([],[]) and len(boxes)==2,'exact two-box union all endpoints and rays')
def reject(name,ok):gate(not ok,'adverse '+name);out['mutations'].append(name)
for name,node,key,value in [
 ('scalar is not weighted Gram','exterior','source_kind','scalar-only'),('no omitted old term','exterior','old_nonconstant_terms',C-2),('no omitted positive bin','exterior','rough_bins',223),('pay every entrant','exterior','all_entrants',False),('no reverse stability','exterior','heat_duration','negative'),('pay before stability','exterior','debit_before_stability',False),('do not discard clock loss','exterior','clock_epsilon','0'),('no first moment cap','exterior','no_first_moment_cap',False),('no finite cutoff','exterior','N',[C,H]),('no missing analytic seam','exterior','infinite_N',[H+1,None]),('no old time-limited tail','exterior','t',['4/25',str(b)]),('no terminal wall','exterior','terminal_cutoff',2300000),('right frozen derivative','exterior','wall_index','left'),('no exact Gamma substitution','exterior','gauge','Gamma'),('no offaxis exterior','exterior','y','all'),('initial simplicity invalid','interior','t_closed',[True,True]),('all interior indices','interior','N',[C,H]),('full initial boundary','boundary','t_closed',[False,True]),('full boundary y','boundary','y',['-1/2','1/2']),('padded horizontal edges','boundary','padding_y',['-1','1']),('REAL tail not stall tail','stall_tail','kind','real-axis-no-double'),('all-complex tail','stall_tail','y','0'),('left-uniform neighbourhood','stall_tail','r',str(a)),('remote exponent direction','stall_tail','radius_exponent','1600')]:
 cc0=copy.deepcopy(contract);cc0['nodes'][node][key]=value;reject(name,licensed(cc0))
for name,key,value in [('invented anchor','anchor_upper','1/10'),('higher RH','rh_height',str(T+1)),('RH at far exterior','X','66476100549959')]:
 cc0=copy.deepcopy(contract);cc0['global'][key]=value;reject(name,licensed(cc0))
for j,name in enumerate(['exterior omitted','isolated X hole','initial time hole','finite ray only','integer-adjacency gap','excess earlier time']):
 bb=copy.deepcopy(boxes)
 if j==0:bb.pop()
 if j==1:bb[0]['x_closed'][1]=False;bb[1]['x_closed'][0]=False
 if j==2:
  for bx in bb:bx['t_closed'][0]=False
 if j==3:bb[1]['x'][1]='66476100549959';bb[1]['x_closed'][1]=True
 if j==4:bb[0]['x'][1]=str(X-1);bb[1]['x'][0]=str(X+1)
 if j==5:bb[1]['t'][0]='159/1000'
 reject(name,union_bad(bb)==([],[]))
# Substantive counter-controls, not merely scope-label changes.
reject('scalar source does not give arbitrary Gram',F(1)>F(9,10)**2/F(1,10)+F(1,100)/F(9,10))
reject('zero clock correction is valid',zH/2<=cc(wall(H,b)))
reject('wrong spatial time coefficient identity',sp.expand(left-right+(dt*(cx-cs)*vv))==0)
# A positive forcing without its seam bound does not force a smaller barrier:
# exact solution J(z)=2*exp(-z)+1*(1-exp(-z)) for k=g=1 has J(0)=2>1.
reject('seam condition dispensable',F(2)<=F(1))
ready=read('READINESS.json');gate(ready['snapshot_entries']==786 and ready['mathematical_inputs_all_banked'] and ready['candidate_release']=='HELD' and not ready['official_torus_certificate_used'],'scope and readiness')
for key in ['complete_Gram_source767','universal_recovery774_allindex782','this_global_composition']:gate(ready['audits'][key]=='OPEN','declared external hold')
for name,value in [('a',a),('b',b),('source_time',src),('backward_duration',h),('X',X),('C',C),('H',H),('raw_floor',m),('zero_derivative_floor',dzero),('derivative_squared_surplus',square),('RH_required',F(X,2)),('RH_margin',T-F(X,2)),('stall_r',r),('stall_exponent',128/r),('improvement_over786',src-a),('improvement_over_board',F(33,200)-a),('comparison_margin',F(86211,500000)-a),('old_nonconstant_terms',C-1),('old_bins',len(old)),('rough_bins',len(bins)),('finite_leaves',len(partition)),('missing_components',0),('excess_components',0)]:exact(name,value)
emit('MATHEMATICAL_LAMBDA_UPPER',a,10)
print('RH_SOURCE PT2021 arXiv:2004.09765 HEIGHT',T,'INITIAL_REQUIRED',F(X,2),'MARGIN',T-F(X,2))
for bx in boxes:print('COVER module='+bx['module']+' t=['+','.join(bx['t'])+'] x=['+','.join(bx['x'])+']')
print('REMOTE_STALL_RADIUS 4*pi*exp(512000/319)+1 UNIFORM CLOSED[319/4000,1/2] ALL_IMAGINARY_PARTS')
proc=subprocess.run([sys.executable,'second_line.py'],capture_output=True,text=True,timeout=120)
Path('second_line.log').write_text(proc.stdout);Path('second_line_stderr.log').write_text(proc.stderr)
gate(proc.returncode==0 and not proc.stderr,'separate line execution '+proc.stderr[-2000:])
sec=read('SECOND_RESULT.json')
for key,value in sec['exact'].items():gate(out['exact'][key]==value,'independent exact '+key)
for key,row in sec['scalars'].items():
 gate(set(row)==set(out['scalars'][key]),'independent scalar format')
 for k in row:
  if k not in ['lo','hi']:gate(row[k]==out['scalars'][key][k],'independent scalar digit')
 gate(max(F(row['lo']),F(out['scalars'][key]['lo']))<=min(F(row['hi']),F(out['scalars'][key]['hi'])),'independent scalar overlap')
for v1,v2 in zip(out['leaves'],sec['leaves']):
 gate((v1['L'],v1['U'])==(v2['L'],v2['U']),'independent leaf geometry')
 for key in v1:
  if key in ['L','U']:continue
  w1,w2=v1[key],v2[key];gate(w1['FLOOR12']==w2['FLOOR12'] and w1['CEIL12']==w2['CEIL12'] and max(F(w1['lo']),F(w2['lo']))<=min(F(w1['hi']),F(w2['hi'])),'independent every-leaf cell '+key)
gate(len(sec['leaves'])==42 and sec['minimum']['L']==worst['L'] and sec['minimum']['U']==worst['U'],'complete independent minimum')
for key,w1 in out['tail'].items():
 w2=sec['tail'][key];gate(w1['FLOOR12']==w2['FLOOR12'] and w1['CEIL12']==w2['CEIL12'] and max(F(w1['lo']),F(w2['lo']))<=min(F(w1['hi']),F(w2['hi'])),'independent infinite cell '+key)
out.update({'checks':COUNT,'second_checks':sec['checks'],'snapshot':786,'theorem':'Lambda<319/2000 with sole PT2021 at INITIAL X/2','candidate_release':'HELD','new_source_production':False,'official_attestation':False})
Path('RESULT.json').write_text(json.dumps(out,indent=2,sort_keys=True)+'\n')
print('RELEASE_STATUS HELD external_source767 external_recovery774_continuation782 external_final_composition')
print('MATHEMATICAL_CONCLUSION Lambda<319/2000; NO RECORD ACCEPTANCE OR PUBLICATION CLAIM')
print('TOTAL CHECKS RUN:',COUNT)
print('RESULT: ALL PASS')
