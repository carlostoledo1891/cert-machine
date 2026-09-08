import itertools
import json
from pathlib import Path

repo = Path.cwd().resolve()
while repo != repo.parent and not (repo / "einstein-arena").exists():
    repo = repo.parent

problem_dir = repo / "EinsteinArena-new-SOTA" / "heilbronn-convex"
alpha = json.loads((problem_dir / "solutions" / "alphaevolve_2025.json").read_text())
ours = json.loads((problem_dir / "solutions" / "ours_2026.json").read_text())

def tri_area(p1, p2, p3):
    return abs(
        p1[0] * (p2[1] - p3[1])
        + p2[0] * (p3[1] - p1[1])
        + p3[0] * (p1[1] - p2[1])
    ) / 2.0

def convex_hull(points):
    pts = sorted(set(tuple(map(float, p)) for p in points))
    if len(pts) <= 1:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    return lower[:-1] + upper[:-1]

def polygon_area(poly):
    if len(poly) < 3:
        return 0.0
    area = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2.0

def evaluate(data):
    points = [tuple(map(float, p)) for p in data["points"]]
    hull_area = polygon_area(convex_hull(points))
    min_area = min(
        tri_area(points[i], points[j], points[k])
        for i, j, k in itertools.combinations(range(len(points)), 3)
    )
    return min_area / hull_area

print({
    "alphaevolve_2025": evaluate(alpha),
    "ours_2026": evaluate(ours),
})

