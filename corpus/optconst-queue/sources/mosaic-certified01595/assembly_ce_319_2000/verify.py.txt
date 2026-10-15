#!/usr/bin/python3
"""Confined delivery of immutable791; fresh dual arithmetic, exact audit joins."""
from fractions import Fraction as F
from pathlib import Path
import copy, hashlib, itertools, json, subprocess, sys
PINS = {'ASSEMBLY.md': 'a0055d8509120b861731533128761cb79ed3faff265f62a972c1fc87091d9616', 'BANK_SNAPSHOT.json': 'c1a888a005d0851db6389fc849a39d68fb96b2a695665d08f74c29f3710a1b63', 'ORIGINS.json': '6910106ae4a140891957efeb5b9ea71ec30940e0bb9a403057cb01f1cfd3e23d', 'PREREG.md': 'f568205479b4aa2cecd44770b6352dc1b10b433dc15073e48b3910d96a443020', 'QUALIFICATIONS.json': '56d5e0e8d773795300fde5f4c9b8b06efa78d3ff8b29f8dc89b98936bfd1e95d', 'REPLAY_CONTRACT.json': 'baa6f2a2e717d41f698fbcb4a3110b9cffe81be50b19d661e38d2e3f8f9df6fd', 'frozen/ACCEPTED_SOURCE_TEXTS.json': 'd5004326debc05a90e5a813ecb6f766f0d1f51fb46b55a4345c1e805f0c50799', 'frozen/ALLINDEX782_SOURCE_TEXTS.json': '4592085f527fd47563ea95604634ba8767b1aaaaa4f1497bffae50c886c7c806', 'frozen/accepted791_stdout.txt': '223c479b5c96612c63da07b06b388228e2ade6e9c42548875186d10a7360c6f1', 'frozen/external789_ARITHMETIC.txt': '3b5d5f1725bac7d56e0c93ea33183ee9870c85264021222e40fd73c4e43e3b25', 'frozen/external789_AUDIT.txt': '3da4fcfd073884f7e8c25919ecbaade9cac7c4ae07437185c0ed7dc22fed5684', 'frozen/external789_COMPLETE_RESULTS.json': '58db76fc8a5597fc4097996cee3cc14bf54578c95b5d48588fc70ecbff5e73d8', 'frozen/external789_INPUT_PINS.json': '7fdaed0cfb5bbab79524bc79ba9a23704a8216a4a7e5c454498d07cf647a0fe7', 'frozen/external789_ORIGINAL_PRODUCT_DIGESTS.json': 'e82910cd33531b01ef59d083e0d2795990f90262ded159f9ab07c7eef99fb4d7', 'frozen/external789_SUMMARY.json': 'ec53e01772655ca1eab9bf522df996919d0b1bb4580f5a81ddd758d0d07d5d1e', 'frozen/external798_ARITHMETIC.txt': '9d70bc4608b6af215c5bc56629ba88b48a06ca3c4fde9808b236dcca553348be', 'frozen/external798_AUDIT.txt': '8fea6e09a1a4001811e94bb4a467abe1cc8af1f81ae02fbb0983a0ec561c8ddc', 'frozen/external798_RELEASE_PINS.json': '2c3de75eeb7de02ee75ca6acf633b332fb2d71645e3d350f3e6a115992bb1639', 'frozen/external798_SUMMARY.json': '5850a3c30305f2ede87f2e3c0646930842f000950e609bdae733a32027b19df0', 'frozen/external799_AUDIT_RESULT.json': 'bdd4b0c1a1dcb21a9e5d521c845a21c6e1403493d849e7bc34b3423effc374c8', 'frozen/external799_INPUT_PINS.json': '21daf4ff20c32b81e548e6616ca6be3c9d661f88e86d809ec99e02a1b22c98b8', 'frozen/external799_PROOF_AUDIT.txt': 'e683e9b50eda4062bb971da190e2e2c7b6f3edfc413658ff97d4ea98f94e4584', 'frozen/external799_RESULT.json': 'dc7b725937aecd36e68130e5b79aba13747fa4dff637c49b86d22349e8fada2a', 'frozen/external800_ARITHMETIC_RESULTS.json': '6c341fe368b0dab70a9131aa013495b346e6c5c028b56eefdb6edf8cbca675f2', 'frozen/external800_AUDIT.txt': '4fe7a601ccf93212c4e4e050f78b92fe494bf2e9d2d613b0d1ee3c19c8ff79c6', 'frozen/external800_DIRECT_PREMISE_PROVENANCE.json': '28230ad1804f5c83444b88f34815659445dd0d20c0667325f2ac108db7d08a13', 'frozen/external800_RELEASE_PINS.json': '48e0315a6bf2a058d89b8d96d612354f5e549c584480af86d350e0bf7eef52cf', 'frozen/external800_RESULT.json': 'e2d04434a6aa4ba3028850d3c801b979142a305cf0fa6ce7caaf81fadbfb17c0', 'frozen/external800_SCOPE_RESULTS.json': 'c13388a9019a3c2a27e7639139d6d722e2c4982fdd9de27f26b027919ff87d1d', 'math/ASSEMBLY.md': '70b7411e2129ab4a182935e6be7a1772bc152b66a630e80f1594f409e8c34025', 'math/CITATIONS.json': 'f2f7ee3db878dde2f3a96caddc99e734cd44f45b40774c265ecc511995913159', 'math/CONTRACTS.json': 'e27df5ed2b05c1384d1024d0650e2a496801abfa990735b5bce9b2aedd0a4c74', 'math/FACT.txt': 'e5622c0cd27f695b59ed115260cffaa71f312740ccc4074476e1f134a7739a73', 'math/FROZEN.sha256': '595ba531727e3b189ee70512baf0e02b23614fd1bf120602dc232e7eefde41f8', 'math/PREREG.md': '17411926afcbb349fb7dd48e867367c4da2b03754e966791082c5323da8ec336', 'math/PROVENANCE.json': 'caee90d6dc22396e27f65e94015b2503d732b6734214a2efbccdbc06f759c86d', 'math/QUANTIFIER_AUDIT.md': '5ed6b794896a7c5899756c047b89f6c13fcbec46500d21067f6678ae6cd2bf9e', 'math/READINESS.json': '577196a3bfae8ede68868984a6aadb57c9e57641bc54c024168be30312c086c8', 'math/SECOND_PROOF.md': 'fb79565af0bc6020e23b0d5d55b984cdd16f4a84d91465c6e39efa6bde4ce06f', 'math/SOURCES.sha256': '7e7c2fdabfbe2290277dce807872ad23dbe9a7fbda06240be7dc5affaa44df37', 'math/frozen/analytic_separator_second.txt': 'fd5e4f351cdaf71dd2b0dfe505a48b95965be5db915403e2d3787a19e455d5df', 'math/frozen/anchor.txt': '874957ddc1caa202aeffa7573013dc161854c39b3f832d367fd5cd008e9ccb54', 'math/frozen/bank720_theorem.txt': '249aa74644189dd15c0e5bf9e6fcddcfd576e242bb2660542c844f8c0fe4bff3', 'math/frozen/bank725_audit.txt': '4ae59adc397d9e31bf1d0ca2cb4565943a2840495c7f4bfaba3534a7584fde35', 'math/frozen/bank733_audit.txt': 'f25f28713b887a2b26d120ad8cc7207b55ef537cf1a2a33682cf83b503f9365e', 'math/frozen/bank744_proof.txt': '2c688d63297c8bb60ba9faa801aa2d4a40fca65a0c90f9b80b148624e8874f10', 'math/frozen/bank754_audit.txt': 'ca2b8e0d5adf4768b57b625cd26ac8070e8449446d7147f34da96cd67a3f64fa', 'math/frozen/bank767_geometry.json': 'f9a2a6e1a4181c7a56ca457342b3e0680deda8f1aafb847cfeae3a97238caeb6', 'math/frozen/bank767_leaves_primary.txt': '3ed5ee0c88248509ed9fd2b30337e3736d09039050f5166a7a982a3e16ce73c5', 'math/frozen/bank767_leaves_second.txt': 'dec6c0a8b2ff9559a3cf90a5cf75a11c4ae79752d99e92558e186ae314fe37c5', 'math/frozen/bank767_outputs.txt': '613d7df7f03c68af80e8a933ebe521ea6ab84f7bb5268c240155d18a5832c7df', 'math/frozen/bank767_proof.txt': '026b89ecc2fe2e42ef5dc62c513c01b567da609f4f73f7a6b7f6d8528022d806', 'math/frozen/bank767_secondproof.txt': '16310586a87b2bff2be351fc421ca3b7f1f3e643f8fc8068d23fde0e72300a7d', 'math/frozen/bank767_summary.json': '092da4612e585c102d19d63e07128111dd53147b0339219489091d64ef204baa', 'math/frozen/bank771_primary.json': '22b81e2892da172d512ecc97114c04c98903a8f9c2dbacd169ad3338d403588a', 'math/frozen/bank771_proof.txt': 'eb9c4ea56805bef9737a811c13e8bdbe6d2e75c32a4eb699e3332ef4169872d9', 'math/frozen/bank774_bins.txt': '94d0610a407a302ee18a2330cf48ebc94cbf34c74fc20f6545de41de667f8f1e', 'math/frozen/bank774_outputs.txt': '3e8f4148cd6880fd7e0533074e2a40a624e4b40bf13b8d61a40a125626e377f2', 'math/frozen/bank774_primary.json': 'a83bcadbd63c5ba04be0a98ffa628d6b666616af944343de5b5a86a38e600137', 'math/frozen/bank774_probes.json': '1c2d17ecb293dfa584921bee211731f645d7c2951e706950156ffa4c88da6956', 'math/frozen/bank774_proof.txt': '41e09d60548b65e2c09c8c374c6e3a9378141fc9817998f2d527bdb8c45d44d8', 'math/frozen/bank774_second.json': '2d7227cd3797de39934feaae909d6c69cceecad457c9acafeadde115f12a0c8b', 'math/frozen/bank774_secondproof.txt': 'e567ecd65edd93cdd967e6757afba5767efd5babee6577830b3b2944d3ea27c5', 'math/frozen/bank774_source_pins.json': '6d9a1ba0a7d661fbe3625190b0fc13b18d9bec9ad47c02660f0c6d43ad6e468f', 'math/frozen/bank774_summary.json': 'e00c5a340faa03fca859c7bd7f67cfdccfebaf84a97f239c01cc5adc9e5db8e8', 'math/frozen/bank779_audit.txt': '8a93e52e2cb6cb1682423f78e61831337aa77a24a8d02987a278d46b6adc95e2', 'math/frozen/bank779_summary.json': '6070d1209a0f0e5e3eef527a793e5a29b01bc4b14f1677d6a9e2897c19ec6aa4', 'math/frozen/bank782_geometry.json': '1bb25e31ee4237da778db114f1fe9722d3084352a558cb7684bec86c0834f877', 'math/frozen/bank782_primary.json': 'c883c78823c8d127eb16ff5f9c46f28dd55c927fd4666493767d29b0766b1f08', 'math/frozen/bank782_products.json': '62525a29bf62262095bdafdcd89d56e51a89580f507b6fbfde6e8659af145372', 'math/frozen/bank782_proof.txt': 'fa28089927364831e44f84c6e469d265953af57c4d21cb1fd2cb99fb6960a5f1', 'math/frozen/bank782_second.json': '58722ab7a76bda7a0fe8d7354253a67b413ee9012289ace0c3db873ad698ea83', 'math/frozen/bank782_secondproof.txt': 'a145a85383beaccc97d8e1c733902e1ac4cb81b96c0d6a8dd08a2c62750c1f4e', 'math/frozen/bank782_summary.json': '0bf62a03fa515eb97c5b29972df41996b0343ae906ec3243ef6f99962f102e42', 'math/frozen/boundary_proof.txt': '2bebe2da8c1f28ed99ea856fe2d8134842ec450046077a8549374d84bbb56a54', 'math/frozen/hermite_separator.txt': '70cc54cfc3932efaa495687dc3565f9af090594deca67b65faa88dde853cc196', 'math/frozen/interior.txt': 'bdc313246fb5927e7605ba048deca2c2b0566eda9fb98a2a12cae8f53c9d1842', 'math/frozen/remote_tail.txt': 'b25f0abb8cccd94b36ea5ec89324c40d80f64724b8de82a40af7a885827069c9', 'math/frozen/remote_tail_second.txt': '78f6e660c543d9a1a6c741716197b60e58b05130e0b6f81490a7d0da1fe61b06', 'math/frozen/separator_second_summary.json': 'e81b4ff81fb81da5141feeed77b90d2a8193e6c669924d83a37d64b09fbb10be', 'math/second_line.py': '0314d96fd56670fd1d85e5786494f3b2f9bdae31a28eb424228c447fe7df28c5', 'math/verify.py': 'd1933e8c1f9e1db88efc99f61d07bbda4f735ec7536c9b2f78e4b740ed5a314b'}
COUNT=0

def gate(ok,msg):
    global COUNT
    COUNT+=1
    if not ok: raise AssertionError(msg)

def sha(b):return hashlib.sha256(b).hexdigest()
def load(n):return json.loads(Path(n).read_text())
def digest(n):return sha(Path(n).read_bytes())
def dump(n,v):Path(n).write_text(json.dumps(v,indent=2,sort_keys=True)+'\n')
def safe(n):
    p=Path(n)
    return not p.is_absolute() and '..' not in p.parts and not p.is_symlink()
def floor_trunc(x,d):
    q=F(x)*10**d;n=q.numerator//q.denominator
    return ('-' if n<0 else '')+str(abs(n)//10**d)+'.'+str(abs(n)%10**d).zfill(d)
def ceil_trunc(x,d):
    q=F(x)*10**d;n=-((-q.numerator)//q.denominator)
    return ('-' if n<0 else '')+str(abs(n)//10**d)+'.'+str(abs(n)%10**d).zfill(d)
def trunc_check():
    for x,d,f,c in [(F(-121,100),1,'-1.3','-1.2'),(F(-1,1000),2,'-0.01','0.00'),(F(121,100),1,'1.2','1.3'),(F(1,10),2,'0.10','0.10')]:
        gate(floor_trunc(x,d)==f and ceil_trunc(x,d)==c,'signed truncation')

def pin_inputs():
    found={}
    for line in Path('FROZEN.sha256').read_text().splitlines():
        if not line or line.startswith('#'):continue
        h,n=line.split();gate(safe(n) and n not in found,'safe unique frozen input')
        gate(digest(n)==h,'frozen bytes '+n);found[n]=h
    gate(found==PINS and len(PINS)>0,'complete hardcoded frozen inputs')
    for line in Path('SOURCES.sha256').read_text().splitlines():
        h,n=line.split();gate(safe(n) and digest(n)==h,'current wrapper source identity')
    return found

def qualifications(snapshot,q):
    # Exact accepted identities, not a mutable PASS flag. The independent
    # verifier authenticates captured bank entries; this only checks the join.
    gate(snapshot['snapshot_entries']==q['snapshot_entries']==805,'captured snapshot')
    facts=snapshot['records'];cit=load('math/CITATIONS.json')
    gate(cit['snapshot_entries']==786,'historical snapshot retained')
    for n,r in cit['facts'].items():
        gate(facts[n]['fact']==r['fact'] and sha(r['fact'].encode())==r['fact_sha256'],'all original citation versions '+n)
    ready=load('math/READINESS.json')
    gate(ready['candidate_release']=='HELD' and ready['snapshot_entries']==786,'historical procedural hold unchanged')
    gate(q['policy']=='ALL_FOUR_DESIGNATED_EXACT_EXTERNAL_AUDITS_BANKED' and not q['uncaptured_acceptance_used'],'release policy')
    expected={(767,789),(774,798),(782,799),(791,800)}
    gate({(e['target'],e['audit']) for e in q['required']}==expected and len(q['required'])==4,'all four exact reviews')
    for e in q['required']:
        t,a=e['target'],e['audit'];tr,ar=facts[str(t)],facts[str(a)]
        gate(e['target_fact_sha256']==sha(tr['fact'].encode()) and e['audit_fact_sha256']==sha(ar['fact'].encode()),'fact identity '+str(a))
        gate(tr['kind']==ar['kind']=='fact' and ar['seat']!=tr['seat'],'external accepted theorem kind')
        gate(ar['verifier']['check']['exit']==0 and ar['verifier']['mode']=='check+llm','captured complete check and review')
        gate(safe(e['target_proof']) and digest(e['target_proof'])==e['target_proof_sha256'],'target manuscript identity')
        target_pin=load(e['audit_manifest'])[e['audit_manifest_key']]
        if isinstance(target_pin,dict):target_pin=target_pin['sha256']
        gate(target_pin==e['target_proof_sha256'],'external original input pin '+str(a))
        gate(len(e['obligations'])==len(set(e['obligations'])) and len(e['obligations'])>=8,'explicit full scope atoms')
    # Two logically different set arrangements for the finite release cut.
    required={e['target']:e for e in q['required']}
    def admitted(edge):
        if edge['target'] not in required:return False
        ref=required[edge['target']]
        return edge==ref
    def direct(edges):
        return sorted(t for t,r in required.items() if not any(admitted(e) and e['target']==t for e in edges))
    def subtract(edges):
        atoms={(t,k) for t,e in required.items() for k in e['obligations']}
        for e in edges:
            if admitted(e):atoms.difference_update((e['target'],k) for k in e['obligations'])
        return sorted({t for t,k in atoms})
    subsets=[]
    for bits in itertools.product([False,True],repeat=4):
        use=[e for b,e in zip(bits,q['required']) if b];miss=direct(use)
        gate(miss==subtract(use),'independent qualification cut')
        gate((miss==[])==all(bits),'no subset waives designated audit')
        subsets.append({'bits':list(bits),'missing':miss})
    mutations=[]
    for index,e in enumerate(q['required']):
        for key,val in [('target',786),('audit',795),('target_proof_sha256','0'*64),('audit_fact_sha256','0'*64),('obligations',e['obligations'][:-1])]:
            ee=copy.deepcopy(q['required']);ee[index][key]=val
            gate(direct(ee)!=[] and direct(ee)==subtract(ee),'reject altered exact witness '+str((index,key)))
            mutations.append([index,key])
    return {'missing':direct(q['required']),'subsets':subsets,'mutations':mutations,'accepted_edges':[[e['audit'],e['target']] for e in q['required']]}

def cell(c):
    lo,hi=F(c['lo']),F(c['hi']);gate(lo<=hi,'ordered directed interval')
    for key in c:
        if key.startswith('FLOOR'):
            d=int(key[5:]);gate(c[key]==floor_trunc(lo,d),'floor from exact endpoint')
        if key.startswith('CEIL'):
            d=int(key[4:]);gate(c[key]==ceil_trunc(hi,d),'ceiling from exact endpoint')
    return lo,hi

def join(a,b,name):
    x,y=cell(a),cell(b)
    gate(max(x[0],y[0])<=min(x[1],y[1]),'external interval overlap '+name)

def audit_joins(math):
    source=load('frozen/external789_SUMMARY.json');recovery=load('frozen/external798_SUMMARY.json')
    cont=load('frozen/external799_RESULT.json');contnum=load('frozen/external799_AUDIT_RESULT.json')
    comp=load('frozen/external800_RESULT.json');compnum=load('frozen/external800_ARITHMETIC_RESULTS.json')
    compscope=load('frozen/external800_SCOPE_RESULTS.json')
    gate(source['target']==767 and source['closed_leaves']==3524,'complete source target')
    gate(source['original_coefficients']=={'fourier':132901,'inverse':53,'raw':690988,'weights':157940},'complete source support')
    gate(not source['memory774_transport_audited'] and not source['official_attestation'],'source audit not recovery/attestation')
    gate(recovery['audited_memory']==774 and recovery['positive_bins']==224 and recovery['synthetic_bins']==1,'universal recovery target')
    gate(recovery['complete_raw_cells']==690988 and recovery['complete_weight_cells']==157940 and recovery['original_leaves']==14,'recovery complete source inputs')
    gate(not recovery['allindex782_audit'] and not recovery['final_composition_audit'],'recovery not all-index/final review')
    gate(recovery['outputs']['OWN_BINS.txt']==digest('math/frozen/bank774_bins.txt'),'same exact complete positive bins')
    gate(cont['status']=='EXTERNAL_782_AUDIT_PASS' and cont['complete_bin_cells']==62952,'complete continuation review')
    gate(contnum['t_closed']==['319/2000','3/16'] and contnum['x_closed']==[6000000185827,'infinity'] and F(contnum['y'])==0,'continuation domain')
    gate(contnum['coverage']['all_right_walls'] and contnum['coverage']['terminal_upper_cutoff'] is None and contnum['coverage']['infinite_left_closed']==2299999,'no terminal wall')
    gate(contnum['census']['old_nonconstant_terms']==690987 and contnum['census']['old_debit_bins']==1240 and contnum['census']['positive_bins']==224,'complete continuation support')
    gate(comp['target_memory']==791 and not comp['universal774_allindex782_separate_external_audits_claimed'],'exact final review not universal audits')
    gate(not comp['candidate_submitted'] and not comp['publication_authorization'],'audit is not record acceptance')
    gate(comp['all_direct_citations']==len(load('math/CITATIONS.json')['facts']),'every direct citation')
    gate(compscope['coverage']['missing_cell_representatives']==compscope['coverage']['excess_cell_representatives']==[],'banked external full union')
    gate(compscope['exact']['positive_axis_boxes']==2 and comp['exact']==compscope['exact'],'external exact scope consistency')
    for k,v in [('a','a'),('b','b'),('X','X'),('RH_required_initial','RH_required'),('RH_margin','RH_margin'),('tail_r','stall_r'),('tail_exponent','stall_exponent')]:
        gate(F(comp['exact'][k])==F(math['exact'][v]),'external exact join '+k)
    for n,leaves,tail in [(799,contnum['finite'],contnum['tail']),(800,compnum['leaves'],compnum['tail'])]:
        gate(len(leaves)==len(math['leaves'])==42,'every external finite leaf '+str(n))
        for r,s in zip(math['leaves'],leaves):
            gate((r['L'],r['U'])==(s['L'],s['U']),'all external geometry')
            for k,v in r.items():
                if k not in ['L','U']:join(v,s[k],str((n,r['L'],r['U'],k)))
        gate(set(tail)==set(math['tail']),'complete infinite field set')
        for k in tail:join(math['tail'][k],tail[k],str((n,'tail',k)))
    for c in [cont['finite_minimum'],comp['finite_expression_minimum']]:
        join(math['minimum'],c,'minimum');gate(F(c['lo'])>F(1,250000),'finite strict floor')
    for c in [cont['infinite_sufficient'],comp['infinite_expression']]:
        join(math['tail']['retained'],c,'infinite floor');gate(F(c['lo'])>F(1,250000),'infinite strict floor')
    join(math['scalars']['ZERO_DERIVATIVE_LOWER'],contnum['derivative_lower_expression'],'real derivative799')
    join(math['scalars']['ZERO_DERIVATIVE_LOWER'],comp['normalized_zero_derivative'],'real derivative800')
    # Original raw/weight/inverse/Fourier output streams remain BANKED. Frozen
    # output digests join to the complete external coefficient reconstruction.
    streams={line.split()[1]:line.split()[0] for line in Path('math/frozen/bank767_outputs.txt').read_text().splitlines() if line and not line.startswith('#')}
    for n,r in load('frozen/external789_ORIGINAL_PRODUCT_DIGESTS.json').items():gate(streams[n]==r['sha256'],'complete source output identity '+n)
    return {'finite_leaves_per_audit':42,'audits_compared':[799,800],'complete_source_audit':789,'universal_recovery_audit':798,'physical_infimum_claimed':False}

def arithmetic(math):
    a=F(319,2000);b=F(3,16);X=6000000185827;T=3000175332800
    gate(0<a<b<=F(1,2) and F(4,25)-a==F(1,2000),'record exact improvement')
    gate(F(21,125)+F(39,2000)==b and F(X,2)<=T and T-F(X,2)==F(350479773,2),'anchor and initial PT2021')
    gate(F(7,50)<=a and 128/(a/2)==F(512000,319),'projection and uniform tail containment')
    for k,v in [('a',a),('b',b),('X',X),('RH_margin',T-F(X,2))]:gate(F(math['exact'][k])==v,'live exact record '+k)
    m,p,q,d=F(1,250000),F(1,800000),F(1600001,40000000000),F(1,400000)
    surplus=144*(m*m-p*p)-(q+2*d)**2
    gate(surplus==F(math['exact']['derivative_squared_surplus']) and surplus>0,'actual real projection reserve')
    boxes=load('math/CONTRACTS.json')['emitted_boxes']
    gate(len(boxes)==2 and {v['module'] for v in boxes}=={'interior','exterior'},'two physical boxes')
    # Independently sort intervals, retaining exact point closure at every time.
    ts={a,b}
    for v in boxes:ts.update(F(t) for t in v['t'])
    times=sorted(ts);time_atoms=times+[(l+u)/2 for l,u in zip(times,times[1:])]+[times[0]-1,times[-1]+1]
    def active(v,t):return (F(v['t'][0])<t<F(v['t'][1]) or t==F(v['t'][0]) and v['t_closed'][0] or t==F(v['t'][1]) and v['t_closed'][1])
    def full(rows):
        rows=sorted(rows,key=lambda r:F(r['x'][0]))
        if not rows or F(rows[0]['x'][0])!=0 or not rows[0]['x_closed'][0]:return False
        end=F(rows[0]['x'][1]) if rows[0]['x'][1]!='inf' else None;closed=rows[0]['x_closed'][1]
        for v in rows[1:]:
            left=F(v['x'][0])
            if end is None:continue
            if left>end or left==end and not(closed or v['x_closed'][0]):return False
            upper=F(v['x'][1]) if v['x'][1]!='inf' else None
            if upper is None:end=None
            elif upper>end:end=upper;closed=v['x_closed'][1]
            elif upper==end:closed=closed or v['x_closed'][1]
        return end is None
    for t in time_atoms:
        use=[v for v in boxes if active(v,t)]
        gate((full(use) if a<=t<=b else not use),'independent interval subtraction at every time atom')
    for mutation in ['gap','open_joint','omit','finite_only','time_endpoint']:
        bb=copy.deepcopy(boxes)
        if mutation=='gap':bb[1]['x'][0]=str(X+1)
        if mutation=='open_joint':bb[0]['x_closed'][1]=False;bb[1]['x_closed'][0]=False
        if mutation=='omit':bb=bb[:1]
        if mutation=='finite_only':bb[1]['x'][1]=str(X+10)
        if mutation=='time_endpoint':bb[0]['t_closed'][0]=False;bb[1]['t_closed'][0]=False
        gate(not full([v for v in bb if active(v,a)]),'reject actual union mutation '+mutation)
    return {'lambda_upper':str(a),'t_lo':str(a),'t_hi':str(b),'anchor_upper':str(b),'X':str(X),
            'RH_required':str(F(X,2)),'RH_margin':str(T-F(X,2)),'improvement_exact':str(F(4,25)-a),
            'FLOOR10':floor_trunc(a,10),'CEIL10':ceil_trunc(a,10),'boxes':boxes,'missing':0,'excess':0}

def replay():
    contract=load('REPLAY_CONTRACT.json')
    for n,h in contract['original_math_inputs'].items():gate(safe(n) and digest('math/'+n)==h,'immutable791 input '+n)
    for n in contract['math_outputs']:
        p=Path('math')/n
        if p.exists():p.unlink()
    p=subprocess.run([sys.executable,'verify.py'],cwd='math',capture_output=True,text=True,timeout=150)
    Path('mathematics.log').write_text(p.stdout);Path('mathematics_stderr.log').write_text(p.stderr)
    gate(p.returncode==0 and not p.stderr,'fresh whole791 run')
    gate(sha(p.stdout.encode())==contract['math_stdout_sha256']==digest('frozen/accepted791_stdout.txt'),'accepted whole stdout reproduction')
    for n,h in contract['math_outputs'].items():gate(digest('math/'+n)==h,'fresh original product '+n)
    gate(p.stdout.splitlines().count('RESULT: ALL PASS')==1,'child whole result')
    math=load('math/RESULT.json')
    gate(math['candidate_release']=='HELD' and math['snapshot']==786,'original historical status not changed')
    gate(not math['new_source_production'] and not math['official_attestation'],'no source/attestation promotion')
    return math,p.stdout

def main():
    trunc_check();pins=pin_inputs();cut=qualifications(load('BANK_SNAPSHOT.json'),load('QUALIFICATIONS.json'))
    gate(cut['missing']==[],'all designated exact audits captured')
    math,stdout=replay();joins=audit_joins(math);record=arithmetic(math)
    result={'mathematical_target':791,'historical_math_snapshot':786,'current_snapshot':805,
      'math_checks':math['checks'],'math_second_checks':math['second_checks'],'delivery_checks':COUNT,
      'mathematics_fresh':True,'historical_hold_preserved':True,'qualification':cut,'audit_joins':joins,
      'record':record,'frozen_files':len(pins),'new_mathematical_fact':False,'official_attestation':False,
      'candidate_accepted':False,'publication_approved':False}
    dump('RELEASE_RESULT.json',result)
    for line in stdout.splitlines():
        if line.startswith(('RESULT','TOTAL CHECKS RUN:','RELEASE_STATUS','MATHEMATICAL_CONCLUSION')):continue
        print(line)
    print('CAPTURED_EXTERNAL_AUDITS 789->767 798->774 799->782 800->791')
    print('EXACT_RELEASE_CUT missing_count',len(cut['missing']))
    print('TARGET_SCORE FLOOR10',record['FLOOR10'],'CEIL10',record['CEIL10'])
    for k,v in [('LAMBDA_UPPER','lambda_upper'),('T_LO','t_lo'),('T_HI','t_hi'),('ANCHOR','anchor_upper'),('X','X')]:print('RECORD_'+k+' =',record[v])
    print('TOTAL CHECKS RUN:',math['checks']+math['second_checks']+COUNT)
    print('RESULT: ALL PASS')
    return 0

if __name__=='__main__':raise SystemExit(main())
