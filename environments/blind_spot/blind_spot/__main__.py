"""    python -m blind_spot pool                    import MCY's mutations, label each by SAT, build the simulator
    python -m blind_spot sim                     build ONLY the simulator, from labels already on disk (~40 s)
    python -m blind_spot gate                    the planted controls (both kinds)
    python -m blind_spot baseline [--n N]        reference policies by rung and by class, no API key
    python -m blind_spot tasks N [--prompts]     sample tasks"""
import json
import sys

from . import pool as _pool
from .taskset import RUNGS, Taskset, grade


def main(argv):
    cmd = argv[0] if argv else "gate"
    if cmd == "pool":
        _pool.build()
        return 0
    if cmd == "sim":
        print("  simulator at", _pool.ensure_sim(verbose=True))
        return 0
    if cmd == "gate":
        from .forgeries import run
        rows, failed = run()
        for name, expect, ok, note, g in rows:
            print(f"  {'ok    ' if ok else 'FAILED'} {name:<30} {g['outcome']:<13} reward {g['reward']:+.0f}  {note}")
        print(f"{len(rows)} controls, {len(failed)} failed" + ("" if not failed else f"  <-- REFUSING: {failed}"))
        return 1 if failed else 0
    if cmd == "baseline":
        from .baseline import run_baseline, render
        n = int(argv[argv.index("--n") + 1]) if "--n" in argv else 40
        res = run_baseline(n=n, seed=2026)
        print(render(res))
        if "--json" in argv:
            json.dump(res, open(argv[argv.index("--json") + 1], "w"), indent=1)
        return 0
    if cmd == "tasks":
        n = int(argv[1]) if len(argv) > 1 and argv[1].isdigit() else 3
        ts = Taskset(seed=0)
        for i in range(n):
            t = ts.sample(i)
            print(f"{t.id}  rung={t.rung}  class={t.klass}  mutant={t.mutant['id']}  truth={t.truth}")
            if "--prompts" in argv:
                print(t.prompt(), "\n")
        return 0
    print(__doc__)
    return 2


def cli():
    """Console-script entry point (`blind-spot ...`), added on the port so the
    module form and the installed form share one body: `main` takes argv, a
    console script is called with none."""
    sys.exit(main(sys.argv[1:]))


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
