import re,sys,os
root=sys.argv[1]; start=sys.argv[2:]
seen={}; todo=list(start)
while todo:
    m=todo.pop()
    if m in seen: continue
    p=os.path.join(root,m.replace(".","/")+".lean")
    if not os.path.exists(p): seen[m]=None; continue
    seen[m]=p
    for line in open(p,encoding="utf8"):
        g=re.match(r"\s*(?:public\s+)?(?:meta\s+)?import\s+(?:all\s+)?(\S+)",line)
        if g: todo.append(g.group(1))
loc=[m for m in seen if seen[m]]; ext=sorted(set(m.split(".")[0] for m in seen if not seen[m]))
print(len(loc),"local modules; external roots:",ext)
tot=0
for m in sorted(loc):
    n=sum(1 for _ in open(seen[m],encoding="utf8")); tot+=n; print(n,m)
print("total lines",tot)
