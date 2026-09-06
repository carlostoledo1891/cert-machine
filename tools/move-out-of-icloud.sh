#!/bin/zsh
# move-out-of-icloud.sh NEW_ROOT — move cert-machine, sin-mfg and frontier-apps out of iCloud Drive.
# A ONE-OFF operational script (2026-09-06), kept in the repository so the session after the
# move can re-run or finish it; it is not a gate and no battery runs it.
# and repoint the four path-bound places in cert-machine. Refuses while anything is still evicted:
# a dataless file moved out of the iCloud domain can never be hydrated again.
set -e
NEW_ROOT="${1:?usage: move-out-of-icloud.sh /Users/carlostoledo/Projects}"
OLD_ROOT=/Users/carlostoledo/Documents
DATALESS=1073741824
for d in cert-machine sin-mfg frontier-apps; do
  [ -d "$OLD_ROOT/$d" ] || { echo "missing $OLD_ROOT/$d"; exit 1; }
  n=$(find "$OLD_ROOT/$d" -type f -size +0 -not -path '*/node_modules/*' -print0 | xargs -0 stat -f '%f' | awk -v D=$DATALESS '{ if (int($1/D)%2==1) n++ } END { print n+0 }')
  echo "$d: $n evicted file(s)"
  [ "$n" = "0" ] || { echo "REFUSED: $d still has evicted files — let Keep Downloaded finish (or read them through) first"; exit 1; }
done
mkdir -p "$NEW_ROOT"
for d in cert-machine sin-mfg frontier-apps; do mv "$OLD_ROOT/$d" "$NEW_ROOT/$d"; echo "moved $d"; done
cd "$NEW_ROOT/cert-machine"
# the four path-bound places (everything else that names ~/Documents is prose or a historical record)
python3 - "$NEW_ROOT" <<'PY'
import json,sys,re
NEW=sys.argv[1]; OLD='/Users/carlostoledo/Documents'
for p in ['LIFT.json','PROVENANCE.json']:
    j=json.load(open(p)); assert j['source_root']==OLD+'/sin-mfg', (p, j['source_root'])
    s=open(p).read().replace(OLD+'/sin-mfg', NEW+'/sin-mfg', 1); open(p,'w').write(s); print('repointed', p)
p='instruments/hotspots/record.js'; s=open(p).read(); assert s.count(OLD+'/frontier-apps/')==1
open(p,'w').write(s.replace(OLD+'/frontier-apps/', NEW+'/frontier-apps/')); print('repointed', p)
p='CLAUDE.md'; s=open(p).read(); assert OLD+'/sin-mfg' in s
open(p,'w').write(s.replace(OLD+'/sin-mfg', NEW+'/sin-mfg')); print('repointed', p)
PY
# Claude Code keys each project's memory to its path
for d in cert-machine sin-mfg frontier-apps; do
  old="/Users/carlostoledo/.claude/projects/-Users-carlostoledo-Documents-$d"
  new="/Users/carlostoledo/.claude/projects/$(echo "$NEW_ROOT/$d" | tr '/' '-')"
  [ -d "$old" ] && mv "$old" "$new" && echo "memory: $old -> $new"
done
echo "now: cd $NEW_ROOT/cert-machine && make drift && node tools/check-wiring.js && make test"
