source /root/one/scripts/common.sh
export LEAN_NUM_THREADS=6
cd /root/one/m2
step $1 lake build "${@:2}"
