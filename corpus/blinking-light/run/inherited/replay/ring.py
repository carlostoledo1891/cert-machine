# Independent exact replay of the four-state ring, written from the pasted text only.
from fractions import Fraction as Fr
from itertools import product
import cmath, math
N=4; cw,ccw=Fr(3),Fr(1); lam=Fr(2)
L=[[Fr(0)]*N for _ in range(N)]
for i in range(N):
    L[i][(i+1)%N]+=cw; L[i][(i-1)%N]+=ccw; L[i][i]-=cw+ccw
lamp=[1,1,0,0]
def inv(M):
    n=len(M); A=[row[:]+[Fr(int(i==j)) for j in range(n)] for i,row in enumerate(M)]
    for c in range(n):
        p=next(r for r in range(c,n) if A[r][c]!=0); A[c],A[p]=A[p],A[c]
        pv=A[c][c]; A[c]=[x/pv for x in A[c]]
        for r in range(n):
            if r!=c and A[r][c]!=0:
                f=A[r][c]; A[r]=[a-f*b for a,b in zip(A[r],A[c])]
    return [row[n:] for row in A]
# kernel between Poisson(lam) samples: P = lam (lam I - L)^-1
P=inv([[ (lam if i==j else 0)-L[i][j] for j in range(N)] for i in range(N)]); P=[[lam*x for x in r] for r in P]
pi=[Fr(1,4)]*4
assert all(sum(pi[i]*L[i][j] for i in range(N))==0 for j in range(N))
agree=sum(pi[i]*P[i][j] for i in range(N) for j in range(N) if lamp[i]==lamp[j])
both=sum(pi[i]*P[i][j]*P[j][k] for i in range(N) for j in range(N) for k in range(N) if lamp[i]==lamp[j]==lamp[k])
print('P(agree) =',agree,' P(both) =',both,' diff from agree^2 =',both-agree**2)
# reversibility in law of the lamp sequence: every word of length <= 7 equals its reverse
def word(w):
    v=[pi[i] if lamp[i]==w[0] else Fr(0) for i in range(N)]
    for b in w[1:]:
        v=[sum(v[i]*P[i][j] for i in range(N)) if lamp[j]==b else Fr(0) for j in range(N)]
    return sum(v)
bad=[w for n in range(1,8) for w in product([0,1],repeat=n) if word(w)!=word(w[::-1])]
print('words of length 1..7 unequal to their reversal:',len(bad))
print('entropy production 2 ln 3 =',2*math.log(3))
# spectrum of L (circulant): eigenvalues cw(w-1)+ccw(conj(w)-1)
print('eigenvalues of L:',[complex(3*(cmath.exp(2j*math.pi*k/4)-1)+(cmath.exp(-2j*math.pi*k/4)-1)) for k in range(4)])
# the lamp's continuous-time autocorrelation: does it oscillate (complex modes with weight)?
