#!/usr/bin/env bash
# runpod-alpoge-grh-parallel.sh — amendment A15 (2026-11-22): the parallel pod. It runs, on a hash-checked copy of the
# release's compiled artifacts, the steps of phase 2 that do not depend on the statement judge, while S1 runs on the
# build pod:
#   KR   lake env leanchecker --fresh Main          (Lean's own replay of the whole closure, single process)
#   EXP  lean4export of the five theorems' closure to a file; its sha256; the five roots found in it
#   K2   nanoda on that file          C5   the same file with riemannHypothesis re-typed as False must be rejected
# Before this script: `runpod-alpoge-grh-verifier.sh setup` on this pod (the official toolchain by its published digest,
# the judges built by root, the 14 parts fetched again against the pins, the challenge built first), then
# `runpod-alpoge-grh-verifier-copy.sh` from the operator's Mac (both ends' sha256 lists equal). Every Lean step runs as
# the unprivileged user `verifier`; results are root-owned in /results. The roots check and the C5 rewriter below are
# phase 2's own, byte for byte.
# usage: bash parallel.sh pre | kr | exp        (kr and exp are started separately so they can overlap)
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
MODE=${1:?pre, kr or exp}
R=/results U=verifier H=/home/verifier W=/home/tester/release/lean T=/opt/judges D=/data
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_parallel.log; }
step() {  # name, timeout seconds, workdir, command... (run as verifier, outputs written by root)
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
if [ "$MODE" = pre ]; then
  # the gates the dropped row V had before its checks: the copy's lists equal, the challenge untouched, no workspace bin
  [ -s $R/copy-source.sha256 ] && [ -s $R/copy-dest.sha256 ] && cmp -s $R/copy-source.sha256 $R/copy-dest.sha256 || { log "PARALLEL-HALT: the copy's sha256 lists are missing or differ"; exit 1; }
  log "copy lists equal: $(wc -l < $R/copy-dest.sha256) files, list sha256 $(sha256sum < $R/copy-dest.sha256 | cut -c1-64)"
  find $W/.lake/build -path '*CertMachine/Challenge*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.after-copy.sha256
  [ -s $R/challenge-build.after-copy.sha256 ] && cmp -s <(grep 'CertMachine/Challenge' $R/challenge-build.sha256) $R/challenge-build.after-copy.sha256 && log "challenge build unchanged by the copy" || { log "PARALLEL-HALT: the challenge build changed or is missing after the copy"; exit 1; }
  if [ -e $W/.lake/build/bin ]; then ls -laR $W/.lake/build/bin > $R/workspace-bin.txt 2>&1; log "PARALLEL-HALT: .lake/build/bin present after the copy"; exit 1; fi
  log "release oleans after the copy: $(find $W/.lake/build -name '*.olean' | grep -vc CertMachine)"
  (cd /opt/toolchain && find bin lib -type f -exec sha256sum {} \; | sort -k2) > $R/toolchain-official.sha256
  sha256sum $T/lean4export/.lake/build/bin/lean4export $T/nanoda_lib/target/release/nanoda_bin > $R/judges-used.sha256
  mkdir -p $D && chown root:root $D && chmod 755 $D
  log "parallel pre done"
  exit 0
fi
grep -q "parallel pre done" $R/_parallel.log 2>/dev/null || { echo "run 'pre' first"; exit 1; }
if [ "$MODE" = kr ]; then
  step KR 259200 $W bash -c 'lake env leanchecker --fresh Main'
  log "parallel kr done"
  exit 0
fi
if [ "$MODE" = exp ]; then
  step EXP 86400 $W bash -c "lake env $T/lean4export/.lake/build/bin/lean4export Main -- riemannHypothesis riemannZeta_eq_zero_re LFunction_ne_zero_of_half_lt_re LFunction_eq_zero_re LFunction_eq_zero_re_of_isPrimitive"
  mv $R/EXP.out $D/export.ndjson && chmod 644 $D/export.ndjson
  ls -la $D/export.ndjson | tee -a $R/_parallel.log; sha256sum $D/export.ndjson > $R/export.sha256; head -c 300 $D/export.ndjson > $R/export.head
python3 -I - $D/export.ndjson > $R/export-roots.txt 2>&1 <<'PY6'
import json, sys
roots = {'riemannHypothesis', 'riemannZeta_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re', 'LFunction_eq_zero_re', 'LFunction_eq_zero_re_of_isPrimitive'}
ids, found, decls = {}, set(), 0
for line in open(sys.argv[1]):
    if line.startswith('{"in"'):
        o = json.loads(line)
        if 'str' in o and o['str']['pre'] == 0 and o['str']['str'] in roots: ids[o['in']] = o['str']['str']
    elif '"thm"' in line[:8] or '"defn"' in line[:9] or '"axiom"' in line[:10] or '"inductive"' in line[:13] or '"opaque"' in line[:10] or '"quot"' in line[:8]:
        decls += 1
        if line.startswith('{"thm"'):
            o = json.loads(line)
            if o['thm']['name'] in ids and o['thm'].get('value') is not None: found.add(ids[o['thm']['name']])
print('roots %d/5 found as theorems with a value: %s' % (len(found), sorted(found)))
print('declaration lines', decls)
PY6
  log "export roots: $(head -1 $R/export-roots.txt)"
  if [ "$(cat $R/EXP.exit)" = 0 ] && [ -s $D/export.ndjson ] && [ -s $R/export.sha256 ] && grep -q '^roots 5/5' $R/export-roots.txt; then log "parallel export good (export, digest, five roots)"; else log "PARALLEL-HALT: the export is not usable"; exit 1; fi
  cat > $D/nanoda.json <<EOF
{"export_file_path": "$D/export.ndjson", "use_stdin": false, "num_threads": 32, "stack_size_bytes": 1073741824,
 "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,
 "nat_extension": true, "string_extension": true, "print_success_message": true}
EOF
  chown $U:$U $D/nanoda.json; cp $D/nanoda.json $R/
  step K2 172800 $D $T/nanoda_lib/target/release/nanoda_bin $D/nanoda.json
cat > /opt/judges/c5.py <<'PY5'
import json, sys
names, false_name, false_expr, rh_name, done = {}, None, None, None, False
for line in sys.stdin:
    if not done:
        o = json.loads(line)
        if 'in' in o and 'str' in o and o['str']['pre'] == 0:
            if o['str']['str'] == 'False': false_name = o['in']
            if o['str']['str'] == 'riemannHypothesis': rh_name = o['in']
        elif 'ie' in o and 'const' in o and false_name is not None and o['const']['name'] == false_name and o['const']['us'] == []:
            false_expr = o['ie']
        elif 'thm' in o and rh_name is not None and o['thm']['name'] == rh_name:
            if false_expr is None: sys.stderr.write('C5: no expression for False before riemannHypothesis\n'); sys.exit(3)
            o['thm']['type'] = false_expr; line = json.dumps(o, separators=(',', ':')) + '\n'; done = True
            sys.stderr.write('C5: riemannHypothesis re-typed as False (expr %d)\n' % false_expr)
    sys.stdout.write(line)
if not done: sys.stderr.write('C5: riemannHypothesis not found\n'); sys.exit(4)
PY5
  sed 's#"export_file_path": "[^"]*", "use_stdin": false#"use_stdin": true#' $D/nanoda.json > $D/nanoda-stdin.json; cp $D/nanoda-stdin.json $R/
  step C5 172800 $D bash -c "set -o pipefail; python3 -I /opt/judges/c5.py < $D/export.ndjson | $T/nanoda_lib/target/release/nanoda_bin $D/nanoda-stdin.json"
  log "parallel exp done"
  exit 0
fi
