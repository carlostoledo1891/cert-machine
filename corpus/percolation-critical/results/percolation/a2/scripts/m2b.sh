source /root/one/scripts/common.sh
export LEAN_NUM_THREADS=12
cd /root/one/m2
mv $R/m2-build.log $R/m2-build-0-lakefile-slip.log; rm $R/m2-build.exit $R/m2-build.seconds
step m2-build lake build
