import numpy as np, json, sys
n=240; S=[14,34,38,40,43,50,58,60,63,67,69,70,79,87,89,99]
D=sorted(set([s%n for s in S]+[(-s)%n for s in S])); Dset=set(D)
print("degree",len(D))
# cross-check against the certificate's edge list
c=json.load(open('../certificates/R3_34_n240_Z240.json'))
print("cert keys",list(c.keys())[:12])
# triangle-free: exists a,b in D with a+b in D ?
tri=[(a,b) for a in D for b in D if (a+b)%n in Dset]
print("triangle pairs",len(tri))
# multiplier automorphisms
M=[m for m in range(1,n) if np.gcd(m,n)==1 and set((m*d)%n for d in D)==Dset]
print("multipliers preserving D:",M)
# Delsarte LP bound: max sum a_x, a_0=1, a_x=0 on D, a>=0, Fourier >=0
from scipy.optimize import linprog
xs=np.arange(n); free=[x for x in xs if x!=0 and x not in Dset]
C=np.cos(2*np.pi*np.outer(xs,xs)/n)  # real since a symmetric can be assumed
# variables a_x for x in free (symmetrize: a_x=a_{-x}) ; Fourier_j = 1 + sum a_x cos(2pi jx/n) >= 0
A_ub=-C[:,free]; b_ub=np.ones(n)
res=linprog(-np.ones(len(free)),A_ub=A_ub,b_ub=b_ub,bounds=[(0,None)]*len(free),method='highs')
print("Delsarte/theta' LP bound on alpha:",1-res.fun)
