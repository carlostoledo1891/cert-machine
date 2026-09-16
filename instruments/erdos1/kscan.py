"""kscan.py — how the buffer K and Δ_s scale with (b,s)."""
import sys, time, io, contextlib, re
from build import build
for b, s in [(7,2),(9,2),(11,2),(13,2),(15,2),(5,3),(7,3)]:
    buf = io.StringIO(); t0 = time.time()
    with contextlib.redirect_stdout(buf):
        build(b, s, [], out=None, verbose=True)
    txt = buf.getvalue()
    K = re.search(r"buffer K = ([0-9.e+-]+)", txt).group(1)
    maxH = re.search(r"max \|entry\| = (\d+)", txt).group(1)
    l1 = re.search(r"max row l1 of H\^-1 = ([0-9.e+-]+)", txt).group(1)
    delta = re.search(r"Δ_s = ([0-9.]+)", txt).group(1)
    print(f"b={b:2d} s={s} d={b**s:5d}  Δ_s={delta}  K={K}  maxH={maxH}  max_row_l1(H^-1)={l1}  ({time.time()-t0:.1f}s)", flush=True)
