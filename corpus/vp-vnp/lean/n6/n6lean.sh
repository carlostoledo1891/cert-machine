#!/bin/bash
# n6lean.sh FILE.lean [more lean args]
# Compiles ONE Lean file with the release's exact pins (Lean v4.33.1, Mathlib 0df444a3), without lake, and writes
# its .olean under ./build/ so that later files can import it. Run it from YOUR work folder; FILE.lean is a path
# relative to that folder, and its module name is the path (N6A/Det.lean is module N6A.Det, import N6A.Det).
# Imports are found, in this order: ./build (your own modules), the shared workspace's build (Statement,
# CertMachine.Anchors, CertMachine.N6Statement), then Mathlib and its dependencies. Nothing outside ./build is written.
# Exit code = lean's. Compile files in dependency order; recompile a file after changing something it imports.
WS="$HOME/Projects/vp-vnp-n6-ws"
LP="$PWD/build:$WS/.lake/build/lib/lean"
for d in "$WS"/.lake/packages/*; do [ -d "$d/.lake/build/lib/lean" ] && LP="$LP:$d/.lake/build/lib/lean"; done
f="$1"; shift
out="build/${f%.lean}.olean"
mkdir -p "$(dirname "$out")"
LEAN_PATH="$LP" exec "$HOME/.elan/toolchains/leanprover--lean4---v4.33.1/bin/lean" -D autoImplicit=false -o "$out" "$@" "$f"
