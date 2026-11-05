#!/bin/bash
# cert-machine, 2026-11-05 ~23:00 UTC, by hand on qfmk1og820iz15 (128 GB): does con-leche master fit under 64 GB with fewer
# workers? The same binary and export as E5; --verified (the default) at --jobs=8 and --jobs=4; peak RSS by /usr/bin/time -v.
R=/results U=tester H=/home/tester X=$H/export-comparator.ndjson CL=$H/src/con-leche/.lake/build/bin/con-leche
st() { flock /tmp/status.lock python3 -c 'import json,sys,os,time
p="/results/_status.json"; s=json.load(open(p)); s[sys.argv[1]]=sys.argv[2]; s["_updated"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
json.dump(s,open(p+".tmp","w"),indent=1); os.replace(p+".tmp",p)' "$1" "$2"; chmod 644 $R/_status.json; }
for j in 8 4; do
  n=E8.con-leche-master-j$j; st _phase "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$H/.elan/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd /tmp && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout 14400 env LEAN_ABORT_ON_PANIC=1 CON_LECHE_VERBOSE=1 "$0" --jobs="$1" "$2"' "$CL" "$j" "$X" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  st "$n" "exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
done
st _phase complete2
