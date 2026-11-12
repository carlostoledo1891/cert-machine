# Table of deprecated aliases in the NEW Mathlib: old_name <- new_name, with namespaces resolved roughly.
import re,os,sys,json
root=sys.argv[1]; out={}
pat=re.compile(r"@\[deprecated[^\]]*\(since := \"(2026-\d\d-\d\d)\"\)[^\]]*\]\s*(?:protected\s+)?alias\s+(\S+)\s*:=\s*(\S+)")
for d,_,fs in os.walk(os.path.join(root,"Mathlib")):
    for f in fs:
        if not f.endswith(".lean"): continue
        s=open(os.path.join(d,f),encoding="utf8").read()
        for m in pat.finditer(s):
            out.setdefault(m.group(3).split(".")[-1],[]).append((m.group(2),m.group(3),m.group(1),os.path.join(d,f)[len(root)+1:]))
json.dump(out,open(sys.argv[2],"w"),indent=0)
print(len(out),"new short names with deprecated old aliases")
