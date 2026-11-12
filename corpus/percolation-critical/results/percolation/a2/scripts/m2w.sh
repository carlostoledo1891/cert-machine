# direction-2 probe, wave N: build and summarise
source /root/one/scripts/common.sh
export LEAN_NUM_THREADS=6
cd /root/one/m2
step m2-wave$1 lake build
