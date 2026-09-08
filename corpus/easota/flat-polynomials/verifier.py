import numpy as np
import matplotlib.pyplot as plt
import sys

sys.path.insert(0, "solutions")

%matplotlib inline
plt.rcParams["figure.dpi"] = 120
plt.rcParams["font.size"] = 11

def evaluate(data):
    coefficients = np.array(data["coefficients"], dtype=np.float64)
    assert len(coefficients) == 70, f"Expected 70 coefficients, got {len(coefficients)}"
    assert all(c in (-1, 1) for c in coefficients), "All coefficients must be +1 or -1"
    poly_fn = np.poly1d(coefficients)
    num_points = 1_000_000
    zs = np.exp(1j * np.linspace(0, 2 * np.pi, num_points))
    vals = np.abs(poly_fn(zs))
    return float(np.max(vals) / np.sqrt(len(coefficients) + 1))

from alphaevolve_2025 import coefficients as c_ae
from ours_2026 import coefficients as c_ours

payloads = [
    ("AlphaEvolve V2 (Georgiev et al., baseline)", {"coefficients": c_ae.tolist()}),
    ("Ours (2026)", {"coefficients": c_ours.tolist()}),
]

for name, data in payloads:
    c = np.array(data["coefficients"], dtype=np.int8)
    print(
        f"{name}: {len(c)} coeffs, unique {{+1, -1}}, "
        f"sum={int(c.sum())}"
    )

print("=" * 70)
print("VERIFICATION OF ALL SOLUTIONS (Einstein Arena `evaluate`)")
print("=" * 70)
print()

scores = {}
for name, data in payloads:
    score = evaluate(data)
    scores[name] = score
    print(f"{name}")
    print(f"  C+ = {score:.15f}")
    print()

print("=" * 70)
print("COMPARISON (lower C+ is better)")
print("=" * 70)
for name, data in payloads:
    print(f"{name:<45} {scores[name]:.15f}")

thetas = np.linspace(0, 2 * np.pi, 4000, endpoint=False)
z = np.exp(1j * thetas)
colors = ["#C850C0", "#E67E22"]

fig, axes = plt.subplots(1, 2, figsize=(14, 4), sharey=True)
for ax, ((name, data), color) in zip(axes, zip(payloads, colors)):
    c = np.array(data["coefficients"], dtype=np.float64)
    p = np.poly1d(c)
    mag = np.abs(p(z))
    ax.plot(thetas, mag, color=color, lw=1.2)
    ax.set_title(name)
    ax.set_xlabel(r"$\theta$")
    ax.set_ylabel(r"$|g(e^{i\theta})|$")
    ax.set_xlim(0, 2 * np.pi)
plt.tight_layout()
plt.show()



