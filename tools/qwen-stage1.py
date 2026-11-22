#!/usr/bin/env python3
"""qwen-stage1.py: the entry point of the Python decider of Stage 1 of the audit of "Language Models Can Rewrite Their
Own Weights" (arXiv 2611.21885 v2). The decider is instruments/qwen-self-rewriting/stage1.py; the recorder that
compares the two deciders and writes the certificate is instruments/qwen-self-rewriting/record.py.

usage: python3 -I tools/qwen-stage1.py offline | i1 | i2 | plan | run | controls | record  [options]
MIT"""
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "instruments", "qwen-self-rewriting"))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "record":
        import record
        sys.exit(record.main(sys.argv[2:]))
    import stage1
    sys.exit(stage1.main(sys.argv[1:]))
