#!/bin/bash
# our pinned nanoda on the comparator's own config (export path, permitted axioms), with 16 threads and a 1 GiB thread stack
set -euo pipefail
python3 -c "import json,sys; c=json.load(open(sys.argv[1])); c['num_threads']=16; c['stack_size_bytes']=1073741824; c['print_success_message']=True; json.dump(c, open(sys.argv[2],'w'))" "$1" "$1.pinned.json"
exec /home/tester/src/nanoda/target/release/nanoda_bin "$1.pinned.json"
