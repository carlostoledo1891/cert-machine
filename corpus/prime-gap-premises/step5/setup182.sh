#!/bin/bash
# Step 5 (PREREGISTRATION.md, amendment A1), ON THE POD: FLINT v3.6.0 + the one cited correction (7ad753d5) built from
# source, python-flint 0.9.0 (572c8a21) against it, NumPy 2.3.5; a second environment with the stock wheel as control.
# Then the release archive, its sha256, and the repository at b77bf175. Adapted from the 186 audit's c1/setup.sh (ours).
# Run: nohup bash /root/s/setup182.sh > /root/s/setup.log 2>&1 < /dev/null &
set -x
export DEBIAN_FRONTEND=noninteractive
mkdir -p /root/s/runs /root/s/src && cd /root/s
date -u
apt-get update -qq && apt-get install -y -qq git curl unzip build-essential m4 autoconf automake libtool pkg-config libgmp-dev libmpfr-dev python3-venv python3-dev time rsync procps ca-certificates < /dev/null > /dev/null
python3 --version; gcc --version | head -1; nproc; free -g | sed -n 2p; grep -m1 "model name" /proc/cpuinfo
st() { echo "$(date -u +%FT%TZ) $*" >> /root/s/runs/_status.txt; }
st "start setup"
# the archive and the repository, in the background of the build
( cd /root/s/src && curl -sSL --retry 5 -o pg182.zip https://github.com/romyar1/prime-gaps-lean/releases/download/external-numerics-20260909/prime-gaps-external-182-verified-20260909.zip && sha256sum pg182.zip > /root/s/runs/archive.sha256 && st "archive: $(cut -c1-64 /root/s/runs/archive.sha256) $(stat -c %s pg182.zip) bytes"
  for t in 1 2 3; do git clone -q https://github.com/romyar1/prime-gaps-lean.git && break; sleep 15; done
  cd prime-gaps-lean && git checkout -q b77bf175 && git rev-parse HEAD > /root/s/runs/repo.head && st "repo at $(cat /root/s/runs/repo.head)" ) &
# FLINT v3.6.0 + exactly the correction
cd /root/s/src && git clone -q https://github.com/flintlib/flint.git && cd flint && git checkout -q v3.6.0 && git rev-parse HEAD
git -c user.name=replay -c user.email=replay@localhost cherry-pick -n 7ad753d51c82fdec115cb179b41d0e581f1cb0ec
{ git status --short; git diff --cached --stat; git diff --cached; } > /root/s/runs/flint-correction.diff 2>&1
st "flint: v3.6.0 + 7ad753d5 applied ($(git diff --cached --numstat | wc -l) files)"
( ./bootstrap.sh && ./configure --prefix=/root/s/flint-fixed --disable-static && make -j16 && make install ) > /root/s/runs/flint-build.log 2>&1
echo $? > /root/s/runs/flint-build.exit; st "flint build exit $(cat /root/s/runs/flint-build.exit)"
cd /root/s/src && git clone -q https://github.com/flintlib/python-flint.git && cd python-flint && git checkout -q 572c8a213a88c0f92feb1bdb938ce4622f4517fa && git rev-parse HEAD
python3 -m venv /root/s/venv-fixed
export PKG_CONFIG_PATH=/root/s/flint-fixed/lib/pkgconfig LD_LIBRARY_PATH=/root/s/flint-fixed/lib
( /root/s/venv-fixed/bin/pip -q install numpy==2.3.5 && /root/s/venv-fixed/bin/pip install . ) > /root/s/runs/python-flint-build.log 2>&1
echo $? > /root/s/runs/python-flint-build.exit; st "python-flint build exit $(cat /root/s/runs/python-flint-build.exit)"
python3 -m venv /root/s/venv-stock && /root/s/venv-stock/bin/pip -q install numpy==2.3.5 python-flint==0.9.0
for v in fixed stock; do
  { /root/s/venv-$v/bin/python -I -c 'import flint, numpy, sys, platform; print(sys.version); print(platform.platform()); print("python-flint", flint.__version__, "numpy", numpy.__version__); print(flint.__file__)'
    ldd $(/root/s/venv-$v/bin/python -I -c 'import flint.types.fmpz_poly as m; print(m.__file__)') | grep -i flint
    /root/s/venv-$v/bin/pip freeze; } > /root/s/runs/env-$v.txt 2>&1
  /root/s/venv-$v/bin/python -I -B /root/s/repro.py > /root/s/runs/repro-$v.log 2>&1; echo $? > /root/s/runs/repro-$v.exit
  st "env $v: repro: $(tail -1 /root/s/runs/repro-$v.log)"
done
wait
cd /root/s/src && unzip -q pg182.zip -d /root/s/pkg && st "unzipped: $(find /root/s/pkg -type f | wc -l) files"
date -u; st "setup done"
