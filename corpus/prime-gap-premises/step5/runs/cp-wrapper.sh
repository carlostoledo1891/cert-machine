#!/bin/sh
# step 5 deviation (4): the package calls /bin/cp -cR (macOS clone flag); GNU cp has no -c. Same copy, no clone.
if [ "$1" = "-cR" ]; then shift; exec /usr/bin/cp.gnu -R "$@"; fi
exec /usr/bin/cp.gnu "$@"
