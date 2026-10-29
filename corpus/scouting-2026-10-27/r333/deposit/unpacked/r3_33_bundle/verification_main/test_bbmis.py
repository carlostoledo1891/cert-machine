# Validate bbmis against brute force on random graphs and on known Ramsey graphs.
import random, itertools, subprocess
def run(adj,t):
    m=len(adj); s=f"{m}\n"+"\n".join("".join('1' if adj[i][j] else '0' for j in range(m)) for i in range(m))+f"\n{t}\n"
    return subprocess.run(['./bbmis'],input=s,capture_output=True,text=True).stdout.split()
def alpha_brute(adj):
    m=len(adj); best=0
    for mask in range(1<<m):
        vs=[i for i in range(m) if mask>>i&1]
        if len(vs)>best and all(not adj[a][b] for a,b in itertools.combinations(vs,2)): best=len(vs)
    return best
random.seed(1); bad=0
for trial in range(300):
    m=random.randint(4,16); p=random.random()
    adj=[[False]*m for _ in range(m)]
    for i,j in itertools.combinations(range(m),2):
        if random.random()<p: adj[i][j]=adj[j][i]=True
    a=alpha_brute(adj)
    for t in (a,a+1):
        out=run(adj,t); exp='YES' if t<=a else 'NO'
        if out[0]!=exp: bad+=1
        if out[0]=='YES':   # verify the witness
            vs=list(map(int,out[1:])); assert len(set(vs))==t and all(not adj[x][y] for x,y in itertools.combinations(vs,2))
print("random tests mismatches:",bad)
# Known: circulant C_n(S) Ramsey (3,9)-graph? Use Cay(Z13,{1,5}) : R(3,5)=14 graph, alpha=4
n=13; D={1,5,8,12}; adj=[[ (i-j)%n in D for j in range(n)] for i in range(n)]
print("Cay(Z13,{±1,±5}) alpha<=4:",run(adj,5)[0]=='NO', " alpha>=4:",run(adj,4)[0]=='YES')
