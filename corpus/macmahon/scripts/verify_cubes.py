#!/usr/bin/env python3
"""Independent geometric verification: proper rotations and exposed cube faces.

Does not import either C++ algorithm. Also checks the finite incidence facts
used in the written proof and exports explicit solutions for all ten sets.
"""
from collections import Counter, defaultdict
import hashlib
import itertools
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'results'


def require(condition,message):
    if not condition: raise ValueError(message)


def cyclic(t):
    return min(t,t[1:]+t[:1],t[2:]+t[:2])


def rotations():
    result=[]
    for p in itertools.permutations(range(3)):
        parity=(-1)**sum(p[i]>p[j] for i in range(3) for j in range(i+1,3))
        for signs in itertools.product((-1,1),repeat=3):
            if parity*math.prod(signs)!=1: continue
            move=[None]*6
            for i in range(3):
                for s in (-1,1):
                    source=2*i+(s<0); dest=2*p[i]+(s*signs[i]<0)
                    move[dest]=source
            result.append(tuple(move))
    require(len(set(result))==24,'Expected 24 proper rotations')
    return sorted(result)


ROT=rotations()
POSITIONS=list(itertools.product((0,1),repeat=3))
FACES=[tuple(2*i+p[i] for i in range(3)) for p in POSITIONS]


def rotate(cube,r): return tuple(cube[i] for i in r)
def canonical(cube): return min(rotate(cube,r) for r in ROT)


def corners(cube):
    result=[]
    for p,faces in zip(POSITIONS,FACES):
        values=tuple(cube[i] for i in faces)
        if sum(p)%2: values=(values[0],values[2],values[1])
        result.append(cyclic(values))
    return tuple(result)


def main():
    table={}
    for line in (OUT/'tableau.txt').read_text().splitlines():
        if not line or line.startswith('#'): continue
        name,*values=line.split()
        table[name]=frozenset(cyclic(tuple(map(int,v))) for v in values)
    names=list(table); index={n:i for i,n in enumerate(names)}
    varieties=sorted({canonical(c) for c in itertools.permutations(range(1,7))})
    require(len(varieties)==30,'Expected 30 rotational varieties')
    lookup={frozenset(corners(c)):c for c in varieties}
    require(len(lookup)==30 and set(lookup)==set(table.values()),'Table disagrees with geometric cube generation')
    cubes=[lookup[table[n]] for n in names]
    all_corners=set.union(*(set(c) for c in table.values()))
    require(len(all_corners)==40,'Expected 40 oriented corners')

    # Establish the corner / pair-of-directed-triangles correspondence.
    actual={frozenset(n for n in names if c in table[n]):c for c in all_corners}
    expected=set(); known_sets=set()
    for pair in itertools.combinations(range(1,6),2):
        a=(0,*pair); b=tuple(i for i in range(6) if i not in a)
        selected={chr(65+i)+chr(97+j) for part in (a,b) for i in part for j in part if i!=j}
        known_sets.add(sum(1<<index[n] for n in selected))
        for aa in (a,(a[0],a[2],a[1])):
            for bb in (b,(b[0],b[2],b[1])):
                arcs=frozenset(chr(65+i)+chr(97+j) for part in (aa,bb) for i,j in zip(part,part[1:]+part[:1]))
                expected.add(arcs)
                require(arcs in actual,'Missing directed-triangle corner')
    require(set(actual)==expected,'Corner correspondence is not exact')
    require(len(known_sets)==10,'Expected ten triangle-pair sets')

    # Build compatibility directly from exposed faces after physical rotations.
    fits=[]
    for t,target in enumerate(cubes):
        slots=[]
        for faces in FACES:
            choices={}
            for c,cube in enumerate(cubes):
                for rid,r in enumerate(ROT):
                    oriented=rotate(cube,r)
                    if all(oriented[f]==target[f] for f in faces): choices[c]=rid
            slots.append(choices)
        fits.append(slots)
        for c in range(30):
            geometrical={corners(target)[p] for p in range(8) if c in slots[p]}
            require(geometrical==table[names[t]]&table[names[c]],'Corner sharing disagrees with actual rotations')
            i,j=names[t].lower();u,v=names[c].lower()
            expected_count=8 if t==c else 0 if i==u or j==v or (u,v)==(j,i) else 2
            require(len(geometrical)==expected_count,'Tableau unusability rule failed')

    def match(t,mask):
        owners={}
        def aug(p,seen):
            for c in fits[t][p]:
                if not mask>>c&1 or c in seen: continue
                seen.add(c)
                if c not in owners or aug(owners[c],seen): owners[c]=p; return True
            return False
        if not all(aug(p,set()) for p in range(8)): return None
        assignment=[None]*8
        for c,p in owners.items(): assignment[p]=[names[c],fits[t][p][c]]
        require(len({x[0] for x in assignment})==8,'Repeated cube in matching')
        for p,(name,rid) in enumerate(assignment):
            c=index[name]; oriented=rotate(cubes[c],ROT[rid])
            require(mask>>c&1 and all(oriented[f]==cubes[t][f] for f in FACES[p]),'Invalid physical placement')
        return assignment

    # Independent enumeration of every 2-regular simple graph on six vertices.
    candidates=[]; candidate_histogram=Counter(); accepted=set()
    for edges in itertools.combinations(list(itertools.combinations(range(6),2)),6):
        degree=Counter(v for e in edges for v in e)
        if any(degree[v]!=2 for v in range(6)): continue
        mask=sum(1<<index[chr(65+i)+chr(97+j)] for u,v in edges for i,j in ((u,v),(v,u)))
        candidates.append(mask)
        built=sum(match(t,mask) is not None for t in range(30))
        candidate_histogram[built]+=1
        if built==30: accepted.add(mask)
    require(len(candidates)==70 and accepted==known_sets,'Classification among necessary candidates failed')
    require(candidate_histogram=={18:60,30:10},'Unexpected candidate target counts')

    # Check the additional multiset support types: a doubled edge plus C4,
    # and three doubled edges. Each must omit a geometric corner type.
    repeated_supports=set()
    for pair in itertools.combinations(range(6),2):
        rest=[v for v in range(6) if v not in pair]
        for order in itertools.permutations(rest[1:]):
            cycle=(rest[0],*order)
            edges={tuple(sorted(e)) for e in zip(cycle,cycle[1:]+cycle[:1])}|{pair}
            repeated_supports.add(frozenset(edges))
    def pairings(vertices):
        if not vertices: yield (); return
        a=vertices[0]
        for b in vertices[1:]:
            for others in pairings(tuple(v for v in vertices if v not in (a,b))):
                yield ((a,b),*others)
    repeated_supports.update(frozenset(edges) for edges in pairings(tuple(range(6))))
    require(len(repeated_supports)==60,'Expected 60 additional multiset supports')
    for edges in repeated_supports:
        selected=[chr(65+i)+chr(97+j) for u,v in edges for i,j in ((u,v),(v,u))]
        covered=set.union(*(set(table[n]) for n in selected))
        require(covered!=all_corners,'Repeated-variety support unexpectedly covers every corner')

    witnesses=[]
    for mask in sorted(known_sets):
        witnesses.append({'mask':mask,'cubes':[names[i] for i in range(30) if mask>>i&1],
                          'targets':{names[t]:match(t,mask) for t in range(30)}})
    by_cube={c:i for i,c in enumerate(cubes)}; initial=min(known_sets); orbit=Counter()
    for perm in itertools.permutations(range(1,7)):
        transformed=0
        for i,cube in enumerate(cubes):
            if initial>>i&1:
                new=canonical(tuple(perm[c-1] for c in cube)); transformed|=1<<by_cube[new]
        orbit[transformed]+=1
    require(set(orbit)==known_sets and set(orbit.values())=={72},'Colour-permutation orbit disagrees')

    verified=[]; examples=0
    for path in sorted(OUT.glob('k*.json')):
        d=json.loads(path.read_text()); k=d['k']; h=d['histogram']
        require(d['names']==names and d['complete'] and d['checked']==math.comb(30,k),'Incomplete or mislabelled enumeration')
        require(sum(h)==d['checked'] and d['target_tests']==30*d['checked'],'Enumeration accounting failed')
        if k==8: require(h==[2774940,2256390,720405,91920,8910,360]+[0]*25,'Published eight-cube distribution not reproduced')
        if k==12: require(set(d['universal_masks'])==known_sets,'Full enumeration disagrees with independent proof candidates')
        for built,mask in enumerate(d.get('example_masks',[])):
            if mask is None: continue
            require(mask.bit_count()==k and sum(match(t,mask) is not None for t in range(30))==built,'Incorrect histogram example')
            examples+=1
        if '-matching' in path.stem:
            other=json.loads((OUT/f'k{k}.json').read_text())
            require(h==other['histogram'] and d['universal_masks']==other['universal_masks'],'Graph/matching classifications disagree')
        verified.append({'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    geometry={'face_order':['+x','-x','+y','-y','+z','-z'],'positions':POSITIONS,'exposed_faces':FACES,
              'rotations_destination_to_source':ROT,'cubes':dict(zip(names,cubes))}
    (OUT/'geometry.json').write_text(json.dumps(geometry,indent=2)+'\n')
    (OUT/'universal_witnesses.json').write_text(json.dumps(witnesses,indent=2)+'\n')
    extrema=[]
    for k,built in ((9,9),(10,20),(11,22),(13,29)):
        data=json.loads((OUT/f'k{k}.json').read_text());mask=data['example_masks'][built]
        entry={'k':k,'built':built,'mask':mask,'cubes':[names[c] for c in range(30) if mask>>c&1],'targets':{}}
        for t in range(30):
            placement=match(t,mask)
            if placement is not None:
                entry['targets'][names[t]]={'placements':placement}
            else:
                for subset in range(1,256):
                    slots=[p for p in range(8) if subset>>p&1]
                    neighbours={c for p in slots for c in fits[t][p] if mask>>c&1}
                    if len(neighbours)<len(slots):
                        entry['targets'][names[t]]={'hall_corners':slots,'neighbours':[names[c] for c in sorted(neighbours)]}
                        break
                else: raise ValueError('No Hall certificate for rejected target')
        extrema.append(entry)
    (OUT/'extremal_witnesses.json').write_text(json.dumps(extrema,indent=2)+'\n')
    report={'proper_rotations':24,'cube_varieties':30,'oriented_corners':40,'necessary_simple_candidates':70,
            'necessary_multiset_candidates':130,'excluded_repeated_variety_supports':60,
            'candidate_target_histogram':dict(candidate_histogram),'universal_sets':10,'colour_orbit_size':10,
            'stabilizer_order':72,'explicit_target_solutions':300,'histogram_examples_checked':examples,'enumerations':verified}
    (OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
    print(f'PASS: geometric regeneration, all 40 corner incidences, 70 necessary candidates, 300 explicit target solutions, colour orbit, {len(verified)} enumerations, {examples} histogram examples')


if __name__=='__main__': main()
