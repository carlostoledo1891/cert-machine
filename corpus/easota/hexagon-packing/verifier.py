import itertools
import json
import math
from pathlib import Path

repo = Path.cwd().resolve()
while repo != repo.parent and not (repo / "einstein-arena").exists():
    repo = repo.parent

problem_dir = repo / "EinsteinArena-new-SOTA" / "hexagon-packing"
alpha = json.loads((problem_dir / "solutions" / "alphaevolve_2025.json").read_text())
ours = json.loads((problem_dir / "solutions" / "ours_2026.json").read_text())

def hex_verts(cx, cy, side, angle_deg):
    angle = math.radians(angle_deg)
    return [
        (
            cx + side * math.cos(angle + 2 * math.pi * i / 6),
            cy + side * math.sin(angle + 2 * math.pi * i / 6),
        )
        for i in range(6)
    ]

def normals(verts):
    result = []
    for i in range(len(verts)):
        p1, p2 = verts[i], verts[(i + 1) % len(verts)]
        edge = (p2[0] - p1[0], p2[1] - p1[1])
        mag = math.hypot(*edge)
        if mag > 1e-12:
            result.append((-edge[1] / mag, edge[0] / mag))
    return result

def project(verts, axis):
    dots = [vx * axis[0] + vy * axis[1] for vx, vy in verts]
    return min(dots), max(dots)

def intersects(v1, v2):
    for axis in normals(v1) + normals(v2):
        mn1, mx1 = project(v1, axis)
        mn2, mx2 = project(v2, axis)
        if mx1 < mn2 - 1e-9 or mx2 < mn1 - 1e-9:
            return False
    return True

def inside_hex(pt, outer):
    for i in range(len(outer)):
        p1, p2 = outer[i], outer[(i + 1) % len(outer)]
        edge = (p2[0] - p1[0], p2[1] - p1[1])
        pv = (pt[0] - p1[0], pt[1] - p1[1])
        if edge[0] * pv[1] - edge[1] * pv[0] < -1e-9:
            return False
    return True

def evaluate(data):
    inner = [(float(h[0]), float(h[1]), 1.0, float(h[2])) for h in data["hexagons"]]
    outer = hex_verts(
        float(data["outer_center"][0]),
        float(data["outer_center"][1]),
        float(data["outer_side_length"]),
        float(data["outer_angle_deg"]),
    )
    penalty = 0
    for i, j in itertools.combinations(range(len(inner)), 2):
        if intersects(hex_verts(*inner[i]), hex_verts(*inner[j])):
            penalty += 1
    for hexagon in inner:
        if any(not inside_hex(vertex, outer) for vertex in hex_verts(*hexagon)):
            penalty += 1
    return float(data["outer_side_length"]) + 100.0 * penalty

print({
    "alphaevolve_2025": evaluate(alpha),
    "ours_2026": evaluate(ours),
})

