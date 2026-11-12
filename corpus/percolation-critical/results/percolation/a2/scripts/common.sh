# common helpers for the A2 one-Lean run (sourced)
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
export LEAN_NUM_THREADS=24
I=/root/one/in; R=/root/one/runs; mkdir -p $R
TRUE=4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae
OAI=4eaee87548250b2682affda7d05d947c05554bae
step() { local name=$1; shift; local t0=$(date +%s); echo "$(date -u +%FT%TZ) start $name" >> $R/TIMELINE; ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$(date -u +%FT%TZ) $name exit $rc ($(cat $R/$name.seconds) s)" | tee -a $R/TIMELINE; return 0; }
