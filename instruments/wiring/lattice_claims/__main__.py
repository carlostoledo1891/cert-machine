"""    python -m lattice_claims gate                 the forgery battery
    python -m lattice_claims baseline [--n N]     reference policies by rung, no API key
    python -m lattice_claims tasks N [--prompts]  sample tasks"""
import sys

from .forgeries import run as run_forgeries
from .policies import POLICIES, run_policy
from .taskset import RUNGS, Taskset


def main(argv):
    cmd = argv[0] if argv else "gate"
    if cmd == "gate":
        rows, accepted = run_forgeries()
        for name, must, caught, note, _ in rows:
            print(f"  {'caught ' if caught else 'ACCEPTED'} {name:<30} {must:<12} {note}")
        print(f"{len(rows)} planted, {len(accepted)} accepted" + ("" if not accepted else "  <-- REFUSING"))
        return 1 if accepted else 0
    if cmd == "baseline":
        n = int(argv[argv.index("--n") + 1]) if "--n" in argv else 20
        dims = (8, 12, 16)
        ts = Taskset(seed=2026, dims=dims)
        tasks = {r: [ts.sample(i * 3 + RUNGS.index(r), rung=r) for i in range(n)] for r in RUNGS}
        print(f"{n} tasks per rung, dims {dims}")
        print(f"  {'policy':<12}" + "".join(f"{r:>16}" for r in RUNGS) + f"{'overall':>10}")
        for name in POLICIES:
            cells, tot = [], 0
            for r in RUNGS:
                g = run_policy(name, tasks[r])
                c = sum(x["certified"] for x in g)
                tot += c
                cells.append(f"{int(c):>10}/{n:<5}")
            print(f"  {name:<12}" + "".join(cells) + f"{int(tot):>6}/{3 * n}")
        return 0
    if cmd == "tasks":
        n = int(argv[1]) if len(argv) > 1 and argv[1].isdigit() else 3
        ts = Taskset(seed=0)
        for i in range(n):
            t = ts.sample(i)
            print(f"{t.id}  rung={t.data.rung}  truth={t._truth}")
            if "--prompts" in argv:
                print(t.prompt(), "\n")
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
