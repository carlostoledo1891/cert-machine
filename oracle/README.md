# the claim oracle — `certify()` for AI mathematical search

A reward channel that cannot be hacked, packaged: one function that takes a
claimed rank-R decomposition of the ⟨n,m,p⟩ matrix-multiplication tensor and
returns exactly one of

- **CERTIFIED** — every one of the (nm)(mp)(np) tensor equations holds
  exactly over the ring (`Q` or `F2`); the certificate carries the equation
  count, the witness rank, and a sha256 of the canonical witness bytes.
- **REFUTED** — with the *mechanism*: the first violated equation, the exact
  left side, the required right side, and the exact discrepancy — or the
  rank overflow. The mechanism is the grader's own arithmetic, never
  coaching (the template-locked-feedback discipline of
  `reports/verifier-loop.html`).
- **REFUSED** — the claim is not well-formed enough to decide (floats,
  wrong shapes, unsupported ring). A refusal is not a math verdict; it is
  the refusal to guess.

**Promises.** Stdlib only, zero dependencies. No float ever participates in
a decision (float entries are REFUSED at the door). Deterministic. **Red
controls run at import**: Strassen 1969 must certify, a 1e-9 sub-float
forgery must be refuted, a float entry must be refused — a broken grader
refuses to import. Nothing can be turned off silently.

## Ten seconds

```bash
python3 - <<'EOF'
import sys; sys.path.insert(0, 'oracle')
from certmachine import certify, STRASSEN7
print(certify({"task": {"kind": "matmul", "n": 2, "m": 2, "p": 2, "rank": 7},
               "ring": "Q", "witness": STRASSEN7})["verdict"])
EOF
# CERTIFIED
python3 oracle/battery.py     # 14 checks, 6 red controls that must fire
```

Or pipe a claim: `python3 oracle/certmachine.py < claim.json`.

## In a training loop (the tool shape)

`tool-definition.json` is the ready-made Messages-API tool (strict schema —
the claim validates exactly before the oracle runs). Minimal wiring with the
SDK's tool runner:

```python
import json, sys
sys.path.insert(0, "oracle")
from anthropic import Anthropic, beta_tool
from certmachine import certify

@beta_tool
def certify_matmul_decomposition(task: dict, ring: str, witness: dict) -> str:
    """Exactly certify/refute a matmul tensor decomposition claim."""
    return json.dumps(certify({"task": task, "ring": ring, "witness": witness}))

client = Anthropic()
runner = client.beta.messages.tool_runner(
    model="claude-opus-5",
    max_tokens=16000,
    tools=[certify_matmul_decomposition],
    messages=[{"role": "user", "content":
        "Find a rank-7 decomposition of the <2,2,2> matmul tensor over Q. "
        "Submit it through the certifier and repair from its mechanism until CERTIFIED."}],
)
print(runner.until_done())
```

The REFUTED mechanism is the whole feedback loop: the model reads the first
violated equation and the exact discrepancy, repairs, resubmits. The grader
cannot be sweet-talked and the reward cannot be gamed — a strictly exact
check has no gap between graded-correct and is-correct.

## The contract

- `claim-schema.json` / `certificate-schema.json` — the wire shapes.
- The equation convention is stated in the module docstring and in the tool
  description; it is the same convention the cert-machine eval harness
  grades with — the harness imports THIS module (`check_Q`), so there is
  one definition and 300+ ledger rows behind it
  (`certs/matmul-eval-ledger.jsonl`, `reports/matmul-eval.html`).
- Scope, honestly: v1 decides matmul tensor decompositions over `Q` and
  `F2`. The `Z[i]` audit (AlphaEvolve's rank-48) lives in
  `instruments/strassen/` and joins a later version. This oracle decides
  finitely many exact-arithmetic facts; it REFUSES everything else.

## Independent re-checks

`reports/matmul-eval.html` carries a browser-side mirror of the same
arithmetic (paste a decomposition, get the verdict client-side), and the
repo's stdlib verifiers re-prove the published ledgers. Rerun everything:
`make test`.
