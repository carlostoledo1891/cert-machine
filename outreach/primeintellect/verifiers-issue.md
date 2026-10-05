# GitHub issue for PrimeIntellect-ai/verifiers — POSTED 2026-10-05 on the operator's word: https://github.com/PrimeIntellect-ai/verifiers/issues/2775
# (the posted body adds the 0.4.2 error text, today's fresh-venv repro, and that main is v1-only; this file keeps the draft)

**Title:** legacy `SandboxEnv`/`PythonEnv` (0.3.1) can't be constructed with any prime-sandboxes it accepts

**Body:**

`verifiers==0.3.1` (the latest on PyPI) requires `prime-sandboxes>=0.2.39`. Its legacy `SandboxEnv.__init__`
builds `CreateSandboxRequest(start_command=<shell string>, ...)` without passing `vm`. Every compatible
prime-sandboxes release rejects that:

- **0.2.39–0.2.42:** `ValueError: String start_command values are container-only. Pass vm=False to create a
  container sandbox...` This comes from `validate_vm_start_command`, because `vm` defaults to `None`.
- **0.3.0 and later (0.4.2 resolves today):** `start_command` accepts only `StartCommand(executable,
  args)`, so the string fails validation.

So `vf.PythonEnv(...)` raises at construction on a fresh install. `primeintellect/math-python`, which builds a
`vf.PythonEnv`, would hit the same error. Repro:

```python
pip install verifiers==0.3.1          # pulls prime-sandboxes 0.4.2
python -c "import verifiers as vf, datasets; vf.PythonEnv(dataset=datasets.Dataset.from_list([{'question':'1+1','answer':'2'}]), pip_install_packages='')"
```

A working local repair: supply `vm=False` where the model has it, else
`StartCommand(executable=argv[0], args=argv[1:])` from `shlex.split(start_command)`. I verified it by
creating a real sandbox (running in 3 s, the REPL worker ready, Python executing). An upper-bound pin
(`prime-sandboxes<0.3`) is not a fix: on Hosted Training the env-server then never starts, presumably because
of a conflict with the runtime's own prime-sandboxes. The repair lives in
github.com/carlostoledo1891/cert-machine/blob/main/instruments/wiring/lattice_claims/adapters_v0.py
(`_container_sandbox_request`).
