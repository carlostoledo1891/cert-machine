import numpy as np
import matplotlib.pyplot as plt
import sys

sys.path.insert(0, 'solutions')

%matplotlib inline
plt.rcParams['figure.dpi'] = 120
plt.rcParams['font.size'] = 11

def verify_sequence(sequence, name=""):
    """Verify that a sequence defines a valid step function and compute its upper bound."""
    seq = np.array(sequence)
    n = len(seq)

    vals_ok = np.all((seq >= 0) & (seq <= 1))
    target_sum = n / 2.0
    actual_sum = np.sum(seq)
    sum_ok = np.isclose(actual_sum, target_sum, atol=1e-6)

    convolution = np.correlate(seq, 1 - seq, mode='full')
    upper_bound = np.max(convolution) / n * 2

    status = "VALID" if (vals_ok and sum_ok) else "INVALID"
    print(f"{name}")
    print(f"  Steps: {n}")
    print(f"  Values in [0,1]: {vals_ok}")
    print(f"  Sum: {actual_sum:.10f} (target: {target_sum:.1f}, {'OK' if sum_ok else 'FAIL'})")
    print(f"  Upper bound: C_5 <= {upper_bound:.15f}")
    print(f"  Status: {status}")
    print()

    return upper_bound, vals_ok and sum_ok


def compute_upper_bound(sequence):
    seq = np.array(sequence)
    convolution = np.correlate(seq, 1 - seq, mode='full')
    return np.max(convolution) / len(seq) * 2

from haugland_2016 import h_values as haugland_h
from alphaevolve_2025 import h_values as alphaevolve_h
from ttt_discover_2026 import h_values as ttt_h
from together_ai_2026 import h_values as together_h

solutions = [
    ("Haugland (2016) — Human Best", haugland_h, 'gray'),
    ("AlphaEvolve (2025) — Google DeepMind", alphaevolve_h, '#C850C0'),
    ("TTT-Discover (2026) — Yuksekgonul et al.", ttt_h, '#1976D2'),
    ("Ours (2026)", together_h, '#E67E22'),
]

print("=" * 70)
print("VERIFICATION OF ALL STEP FUNCTION CONSTRUCTIONS")
print("=" * 70)
print()

bounds = {}
for name, h, _ in solutions:
    bound, valid = verify_sequence(h, name)
    bounds[name] = bound
    assert valid, f"{name} is INVALID!"

print("=" * 70)
print("All solutions verified successfully.")
print("=" * 70)

print(f"{'Method':<45} {'Steps':>6}  {'Upper Bound':>18}")
print("-" * 75)
for name, h, _ in solutions:
    bound = compute_upper_bound(h)
    marker = " <-- NEW SOTA" if name.startswith("Ours") else ""
    print(f"{name:<45} {len(h):>6}  {bound:>18.15f}{marker}")

def plot_step_function(ax, seq, title, color):
    """Plot a single step function."""
    n = len(seq)
    edges = np.linspace(-1, 1, n + 1)
    ax.step(edges[:-1], seq, where='post', color=color, linewidth=1.2)
    ax.set_xlim(-1.05, 1.05)
    ax.set_ylim(-0.05, 1.1)
    ax.set_title(title, fontsize=10)
    ax.set_xlabel('x')
    ax.set_ylabel('h(x)')
    ax.axhline(y=0.5, color='lightgray', linestyle='--', linewidth=0.8)
    ax.grid(True, alpha=0.3)


fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

import math

def ceil_to_decimals(x, decimals):
    factor = 10 ** decimals
    return math.ceil(x * factor) / factor

for i, (name, h, color) in enumerate(solutions):
    bound = compute_upper_bound(h)
    bound_up = ceil_to_decimals(bound, 6)
    label = f"{name}\nUpper bound: {bound_up:.6f} ({len(h)} steps)"
    plot_step_function(axes[i], h, label, color)

plt.suptitle("Erdős' Minimum Overlap Problem — Step Function Constructions", fontsize=18, fontweight='bold', y=1.01)
plt.tight_layout()
plt.show()



