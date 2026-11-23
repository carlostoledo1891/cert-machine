#!/bin/sh
# Replay the new semantic interface on the control room's existing dependency builds.
set -eu
case "$#:${1-}" in
  0:|1:--fresh) ;;
  *) echo "usage: $0 [--fresh]" >&2; exit 2 ;;
esac
src=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
scout=$(dirname "$src")
repo=$(git -C "$src" rev-parse --show-toplevel)
work=$(mktemp -d)
finish() {
  rc=$?
  trap - EXIT
  rm -rf "$work"
  printf 'replay exit %s\n' "$rc"
  exit "$rc"
}
trap finish EXIT
cd "$repo/instruments/rh-comparison"
lake env sh -eu -c '
  src=$1; scout=$2; work=$3
  export LEAN_PATH="$scout/audit/chen-23678020/build:$LEAN_PATH"
  for name in p4-lean-build p5b-build p5c-build p5d-build; do
    bundle="$scout/control-room-checks/$name"
    for olean in "$bundle"/olean/*.olean; do
      module=$(basename "$olean" .olean)
      case "$module" in
        R7Cnf|R7CnfMain|R7CnfSound) origin="$scout/claude-r7/p4-lean" ;;
        *) origin="$src" ;;
      esac
      cmp "$origin/$module.lean" "$bundle/src/$module.lean"
    done
    LEAN_PATH="$bundle/olean:$LEAN_PATH"
  done
  export LEAN_PATH="$work:$LEAN_PATH"
  lean --version
  shasum -a 256 "$src/R7ProductionP4.lean" "$scout/claude-r7/p4-lean/R7CnfSound.lean"
  lean -DwarningAsError=true -R "$src" -o "$work/R7ProductionP4.olean" "$src/R7ProductionP4.lean"
  printf "R7ProductionP4 build exit 0\n"
  leanchecker -v R7ProductionP4
  printf "R7ProductionP4 leanchecker exit 0\n"
  if [ "$4" = --fresh ]; then
    leanchecker --fresh -v R7ProductionP4
    printf "R7ProductionP4 fresh replay exit 0\n"
  fi
' sh "$src" "$scout" "$work" "${1-}"
