import itertools
import json
import math
from pathlib import Path

repo = Path.cwd().resolve()
while repo != repo.parent and not (repo / "einstein-arena").exists():
    repo = repo.parent

problem_dir = repo / "EinsteinArena-new-SOTA" / "circles-rectangle"
alpha = json.loads((problem_dir / "solutions" / "alphaevolve_2025.json").read_text())
ours = json.loads((problem_dir / "solutions" / "ours_2026.json").read_text())

def evaluate(data):
    circles = [tuple(map(float, c)) for c in data["circles"]]
    radii = [r for _, _, r in circles]
    min_x = min(x - r for x, y, r in circles)
    max_x = max(x + r for x, y, r in circles)
    min_y = min(y - r for x, y, r in circles)
    max_y = max(y + r for x, y, r in circles)
    width = max_x - min_x
    height = max_y - min_y
    if width + height > 2 + 1e-9:
        return float("-inf")
    for c1, c2 in itertools.combinations(circles, 2):
        if math.hypot(c1[0] - c2[0], c1[1] - c2[1]) < c1[2] + c2[2] - 1e-9:
            return float("-inf")
    return sum(radii)

print({
    "alphaevolve_2025": evaluate(alpha),
    "ours_2026": evaluate(ours),
})

