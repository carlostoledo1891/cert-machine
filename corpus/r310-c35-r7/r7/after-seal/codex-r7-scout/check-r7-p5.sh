#!/bin/sh
# Rebuild the private R(7) results on the repository pins and replay each module.
set -eu
src=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
repo=$(git -C "$src" rev-parse --show-toplevel)
chen="$src/../audit/chen-23678020"
build=$(mktemp -d)
finish() {
  status=$?
  trap - EXIT
  rm -rf "$build"
  printf 'replay script exit %s\n' "$status"
  exit "$status"
}
trap finish EXIT
cd "$repo/instruments/rh-comparison"
if [ "$#" -eq 0 ]; then
  set -- R7Independence R7SideChoices R7ControlData R7Control R7Layout R7Exchanges R7ExchangeControl \
    R7Composition R7CoreTransport R7Catalogue R7X0 R7Cnf R7CnfSound R7CnfBridge R7RecordModel \
    R7Closing R7ProductionEmbed R7ProductionData R7ProductionClosing
fi
python3 "$src/r7_control_data.py" > "$build/control-from-ledger.lean"
cmp "$src/R7ControlData.lean" "$build/control-from-ledger.lean"
shasum -a 256 "$src/../claude-r7/prod-out/control_k10_sat.tsv" "$src/../claude-r7/cores_e85.g6" "$chen/repo/lean/R310/R7.lean"
case " $* " in
  *" R7Catalogue "*|*" R7X0 "*|*" R7RecordModel "*) python3 "$src/check_r7_catalogue.py" ;;
esac
case " $* " in
  *" R7Cnf "*|*" R7CnfSound "*|*" R7CnfBridge "*|*" R7RecordModel "*)
    # Pin the two imported definitions before compiling them from Claude's directory.
    (cd "$src/../claude-r7/p4-lean"
     shasum -a 256 -c <<'PINS'
3ec2b8ca9fa14b00327fd1c7ac527294b81ccf0d256f21fc6b3e9031e4452a03  R7Cnf.lean
519b96e24c7ad1cc7b1fa5378761736469c01f6390392480653b33dbf5b651d5  R7CnfSound.lean
PINS
    )
    (cd "$src/../claude-r7"
     shasum -a 256 -c <<'PINS'
76c2666b7f2c4de5d54951cf2ba5e17337c541fa89b5e39ce5d9de45142ced9e  configs.bin
6b2373618c34d588dfbf073e28794dab68400a15ef6e06d96bc618b490c8ce57  cores_e85.g6
PINS
    )
    ;;
esac
case " $* " in
  *" R7ProductionData "*|*" R7ProductionClosing "*)
    (cd "$src/../claude-r7"
     shasum -a 256 -c <<'PINS'
76c2666b7f2c4de5d54951cf2ba5e17337c541fa89b5e39ce5d9de45142ced9e  configs.bin
ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793  prod-out/prod.tsv
PINS
    )
    ;;
esac
lake env sh -eu -c '
  src=$1
  build=$2
  export LEAN_PATH="$build:$3:$LEAN_PATH"
  shift 3
  lean --version
  for module do
    case "$module" in
      R7Cnf|R7CnfSound) module_src="$src/../claude-r7/p4-lean" ;;
      *) module_src="$src" ;;
    esac
    shasum -a 256 "$module_src/$module.lean"
    status=0
    lean -DwarningAsError=true -R "$module_src" -o "$build/$module.olean" "$module_src/$module.lean" || status=$?
    printf "%s build exit %s\n" "$module" "$status"
    [ "$status" -eq 0 ] || exit "$status"
    leanchecker -v "$module" || status=$?
    printf "%s leanchecker exit %s\n" "$module" "$status"
    [ "$status" -eq 0 ] || exit "$status"
  done
  case " $* " in
    *" R7ProductionData "*|*" R7ProductionClosing "*)
      shasum -a 256 "$src/R7ExportProduction.lean" "$src/check_r7_production.py"
      status=0
      lean -DwarningAsError=true --run "$src/R7ExportProduction.lean" "$build/cfg.bin" "$build/levels.bin" || status=$?
      printf "production export exit %s\n" "$status"
      [ "$status" -eq 0 ] || exit "$status"
      python3 "$src/check_r7_production.py" "$build/cfg.bin" "$build/levels.bin" || status=$?
      printf "production comparison exit %s\n" "$status"
      [ "$status" -eq 0 ] || exit "$status"
      ;;
  esac
' check "$src" "$build" "$chen/build" "$@"
