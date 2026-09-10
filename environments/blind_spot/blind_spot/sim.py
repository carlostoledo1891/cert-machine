"""One control design carrying every mutation in the pool, simulated once.

MCY builds one mutated netlist per mutation and compiles a testbench for each.
Here the whole pool is elaborated ONCE into a single design with a 16-bit
`mutsel` input -- yosys's own `mutate -ctrl` -- so mutsel = 0 is the unmutated
netlist and mutsel = k is mutation k, in MCY's numbering (k = 1 is `-mode none`,
the identity, so 0 and 1 are the same design by two different routes).  The
testbench instantiates the design twice, once at 0 and once at the record's
mutsel, drives the same pair into both and prints both verdicts.  Compiling
takes a tenth of a second and a batch of four thousand records runs in about
one, which is what makes a reference-policy table of several thousand
submissions cheap enough to be printed on every run.

A kill is a record whose two verdict triples differ.  Nothing here knows what
the predicate means.
"""
import os
import subprocess
import tempfile

from .design import CTRL_BITS, D, DESIGN_IL, POOL_DIR, TOP, W, require_tools, to_unsigned

COORD_BITS = 2 * D * W                      # 66
REC_BITS = CTRL_BITS + COORD_BITS           # 82
HEX_DIGITS = (REC_BITS + 3) // 4            # 21

_PORTS_U = ",".join(f".u{i}(c[{COORD_BITS - 1 - W * i}:{COORD_BITS - W * (i + 1)}])" for i in range(D))
_PORTS_V = ",".join(f".v{i}(c[{COORD_BITS - 1 - W * (D + i)}:{COORD_BITS - W * (D + i + 1)}])" for i in range(D))

TB = f"""`timescale 1ns/1ps
module tb;
  parameter integer NMAX = 65536;
  reg [{REC_BITS - 1}:0] mem [0:NMAX-1];
  reg [{REC_BITS - 1}:0] c;
  reg [1023:0] f;
  integer k, n;
  reg valid;
  wire [{CTRL_BITS - 1}:0] sel = c[{REC_BITS - 1}:{COORD_BITS}];
  wire c0, r0, f0, c1, r1, f1;
  {TOP} g(.mutsel({CTRL_BITS}'d0), .valid(valid), {_PORTS_U}, {_PORTS_V},
    .certified(c0), .refuted(r0), .refused(f0));
  {TOP} m(.mutsel(sel), .valid(valid), {_PORTS_U}, {_PORTS_V},
    .certified(c1), .refuted(r1), .refused(f1));
  initial begin
    if (!$value$plusargs("cases=%s", f)) f = "cases.hex";
    if (!$value$plusargs("n=%d", n)) n = NMAX;
    $readmemh(f, mem);
    valid = 1;
    for (k = 0; k < n; k = k + 1) begin
      c = mem[k]; #1;
      $display("%0d %b%b%b %b%b%b", sel, c0, r0, f0, c1, r1, f1);
    end
    $finish;
  end
endmodule
"""


def build_pool_design(mutations, pool_dir=POOL_DIR):
    """Elaborate design.il with every mutation under `mutsel`; write pool.il,
    pool.v and the compiled simulator.  `mutations` is {id: mutation string}
    where the string is MCY's `mutate ...` line; ids are MCY's."""
    require_tools()
    os.makedirs(pool_dir, exist_ok=True)
    lines = [f"read_rtlil {DESIGN_IL}"]
    for k in sorted(mutations):
        opts = mutations[k].split(" ", 1)[1] if mutations[k].startswith("mutate ") else mutations[k]
        if "-mode none" in opts:
            continue                          # the identity needs no wiring: mutsel k is then 0's twin
        lines.append(f"mutate -ctrl mutsel {CTRL_BITS} {k} {opts}")
    lines += [f"write_rtlil {os.path.join(pool_dir, 'pool.il')}",
              f"write_verilog -norename {os.path.join(pool_dir, 'pool.v')}"]
    ys = os.path.join(pool_dir, "pool.ys")
    open(ys, "w").write("\n".join(lines) + "\n")
    r = subprocess.run(["yosys", "-q", "-l", os.path.join(pool_dir, "pool.log"), ys],
                       capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError("yosys failed building the pool:\n" + r.stdout[-2000:] + r.stderr[-2000:])
    open(os.path.join(pool_dir, "tb_pool.v"), "w").write(TB)
    r = subprocess.run(["iverilog", "-o", os.path.join(pool_dir, "simpool"),
                        os.path.join(pool_dir, "tb_pool.v"), os.path.join(pool_dir, "pool.v")],
                       capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError("iverilog failed:\n" + r.stderr[-2000:])
    return os.path.join(pool_dir, "simpool")


def _record(sel, u, v):
    if len(u) != D or len(v) != D:
        raise ValueError(f"a pair is {len(u)} and {len(v)} coordinates; the design has {D}")
    bits = 0
    for x in list(u) + list(v):
        bits = (bits << W) | to_unsigned(int(x))
    return (sel << COORD_BITS) | bits


def simulate(records, pool_dir=POOL_DIR):
    """records: iterable of (mutsel, u, v).  Returns a list of (orig, mutant)
    verdict strings in the same order, each one of 'certified', 'refuted',
    'refused', or the raw pin pattern when the mutant lights no pin or two."""
    records = list(records)
    if not records:
        return []
    sim = os.path.join(pool_dir, "simpool")
    if not os.path.exists(sim):
        raise RuntimeError("the pool simulator is not built; run `python -m blind_spot pool`")
    with tempfile.NamedTemporaryFile("w", suffix=".hex", delete=False, dir=pool_dir) as f:
        for sel, u, v in records:
            f.write(format(_record(sel, u, v), f"0{HEX_DIGITS}x") + "\n")
        path = f.name
    try:
        r = subprocess.run(["vvp", "-n", sim, f"+cases={path}", f"+n={len(records)}"],
                           capture_output=True, text=True)
    finally:
        os.unlink(path)
    out = []
    for line in r.stdout.splitlines():
        parts = line.split()
        if len(parts) == 3 and parts[0].isdigit() and len(parts[1]) == 3 and len(parts[2]) == 3:
            out.append((_name(parts[1]), _name(parts[2])))
    if len(out) != len(records):
        raise RuntimeError(f"simulator returned {len(out)} verdicts for {len(records)} records:\n{r.stdout[-800:]}\n{r.stderr[-800:]}")
    return out


def _name(bits):
    return {"100": "certified", "010": "refuted", "001": "refused"}.get(bits, "pins=" + bits)


def kills(sel, pairs, pool_dir=POOL_DIR):
    """Which of `pairs` distinguish mutant `sel` from the original.  Returns a
    list of (u, v, orig, mutant) for the pairs that do."""
    res = simulate([(sel, u, v) for u, v in pairs], pool_dir)
    return [(u, v, o, m) for (u, v), (o, m) in zip(pairs, res) if o != m]
