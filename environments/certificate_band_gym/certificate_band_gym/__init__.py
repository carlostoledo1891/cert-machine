"""certificate-band-gym — break a grader, or prove it cannot be broken.

The model is shown a certified interval and a grader, and must produce a value
the grader ACCEPTS and the certificate REFUTES — or answer NO_ATTACK when no
such value exists. Both standing answers lose somewhere, so only checking wins.

Nothing here is an answer key. The negatives carry proofs.
"""
from .band import band_measure, mint_attack, verify_attack, key_at, tau_for_band
from .facts import FACTS, BY_ID
from .forgeries import gate
from .task import Task, grade, make_task, parse, render_prompt

__version__ = "0.1.0"
__all__ = [
    "FACTS", "BY_ID", "Task", "make_task", "render_prompt", "parse", "grade",
    "band_measure", "mint_attack", "verify_attack", "key_at", "tau_for_band", "gate",
]
