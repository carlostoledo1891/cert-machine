"""Prove a current-test inequality on the full lamp diamond using rational arithmetic.
Usage: python3 -B verify_potential.py potential.json 3/20
"""
from fractions import Fraction as Q
import json
import sys

def midpoint(p,q):
    return tuple((a+b)/2 for a,b in zip(p,q))

def verify(file,G):
    p=json.load(open(file))
    center=Q(p['center'])
    points=list(zip(*(map(Q,p[k]) for k in ('h','a','b'))))
    assert points[0]==(0,0,0) and points[-1][0]==1
    assert 0<=center<=1
    for l,r in zip(points,points[1:]):
        h,a,_=l
        H,A,_=r
        assert h<H and 0<=a<=A
        slope=(A-a)/(H-h)
        intercept=a-slope*h
        # (y-center)^2 - (1-y)*a(y) is a quadratic.
        def surplus(y):
            return (y-center)**2-(1-y)*(slope*y+intercept)
        critical=(2*center+slope-intercept)/(2*(1+slope))
        assert min(surplus(q) for q in [h,H,min(H,max(h,critical))])>=0
    points=[tuple(-v for v in p) for p in reversed(points[1:])]+points
    count=0
    def box(l,r,L,R,depth):
        nonlocal count
        count+=1
        verts=[(p,q) for p in (l,r) for q in (L,R)]
        def ratio(p,q):
            h,a,b=p
            k,z,w=q
            dh=h-k
            da=a-z
            u=dh-(b-w)
            den=dh*da
            assert den>=0
            if den==0:
                assert u==0
                return 0
            return u*u/den
        m=max(ratio(p,q) for p,q in verts)
        def limit(p,q,m):
            h,a,b=p
            k,z,w=q
            return ((b-a+w-z)**2+(2-abs(h)-abs(k))**2*m)/4
        if max(limit(p,q,m) for p,q in verts)<=G:
            return
        if any(limit(p,q,ratio(p,q))>G for p,q in verts):
            raise ValueError(('coefficient exceeds bound at vertex',l,r,L,R))
        assert depth<32
        if r[0]-l[0] >= R[0]-L[0]:
            mid=midpoint(l,r)
            box(l,mid,L,R,depth+1)
            box(mid,r,L,R,depth+1)
        else:
            mid=midpoint(L,R)
            box(l,r,L,mid,depth+1)
            box(l,r,mid,R,depth+1)
    cells=list(zip(points,points[1:]))
    for i,(l,r) in enumerate(cells):
        for j,(L,R) in enumerate(cells[i:],start=i):
            # For the same linearity cell the ratio is constant; corners
            # with h=k have zero numerator and are handled by continuity.
            box(l,r,L,R,0)
    lower=4*(Q(1,100)-(center-Q(3,10))**2)/G
    print('Verified',count,'boxes; gamma <=',G,'and g >=',lower)

if __name__=='__main__':
    verify(sys.argv[1],Q(sys.argv[2]))

