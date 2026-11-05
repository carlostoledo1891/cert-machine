# lean/INTAKE.md — the intake of a lab's Lean claim: the route, as it was done twice

A lab publishes a Lean proof of a theorem (Anthropic's and OpenAI's refutations of the Exponential Time Hypothesis, October
2026). The claim is the theorem's statement on the lab's machine model; the proof is the lab's bytes at one commit; the
question cert-machine decides is whether that proof, in a neutral library's Lean, proves the statement a reader pinned by
hand. The route below closed the ETH model gap for both labs on 2026-11-04/05 (cert-machine `corpus/eth-refutation/chain/`
and `openai-chain/`, claimbox `lean/eth-bridge/AnthropicEth/` and `OpenAIEth/`); it is written here so the next claim
starts in minutes instead of a day. Everything claimbox writes under `lean/` is a **proposal until cert-machine decides
it** (commitment 5); cert-machine's pins, axioms files, challenge module, pod and decision script are its own and are never
written here (commitment 10).

```
1 statement pinned      cert-machine, by hand, before any proof is read     corpus/<claim>/statement.lean
2 scout                 tools/intake_scout.py                               scout-pins.json · scout-closure.txt · scout-blobs.json · scout-report.json
3 scaffold              tools/intake_port.py scaffold                       lean_lib blocks · PORT.md template · Planted/ ×3 · the claim skeleton · CHECKLIST.md
4 port                  an agent, on the Mac or a pod; the ledger by        tools/intake_port.py ledger   (§4 and §5 of PORT.md, mechanically)
5 pre-flight            tools/intake_port.py check                          the L3s facts measured here before cert-machine measures them
6 decision              cert-machine, on a pod                              its script, its record; CHECKLIST.md names what it needs
```

## 1. The statement, pinned by hand

The trusted part is small: a `namespace`, a docstring, one `theorem NAME : TYPE :=` — the head only, no proof. cert-machine
writes it (`corpus/eth-refutation/openai-chain/statement.lean`, 243 bytes) before any proof is read, and later decides the
claim file's block from `namespace` to that `:=` byte-equal to it. The type names the neutral library's definition (for ETH,
`ComplexityAbstracts.SubexponentialSATAbstract.ETH` of cslib-community/complexitylib), never the lab's. That the neutral
definition is the textbook one stays a reading of a definition, said in the record.

## 2. The scout: the closure, every file pinned, before any port

```
python3 tools/intake_scout.py --repo URL --commit SHA --src lean [--src <one per upstream srcDir>] \
    --root lean/<the lab's solution root>.lean --root lean/<each bridge root>.lean --out corpus-or-scratch/<claim> \
    [--work DIR] [--base URL@SHA]
```

A sparse clone (`--filter=blob:none`, the `--src` folders only); the import closure of the roots by reading `import` lines
(`public import` and `import all` too; comments stripped, so an `import` in a docstring is not one), a module resolved against
the `--src` folders in order (OpenAI: one, `lean`; Anthropic: `eth` and one `eth/proof/<library>` per lean_lib); for every file its sha256 and its git blob id; the modules that are not
in the tree (Mathlib, Lean core, a vendored statement) listed by prefix; a census of the words to read (`sorry`, `axiom`,
`native_decide`, `implemented_by`, `extern`, `unsafe`, `skipKernelTC`, `quotPrecheck`) with the files that hold them — hits,
not verdicts (OpenAI's five `axiom` hits are docstring words). `--base` compares the closure blob by blob with another commit
(a fork against its base: which files are the base's bytes, which are the fork author's). `--tree DIR` reads a checkout
already on disk; with a `.git` present, the blob ids are also checked against the commit's tree, so an edited checkout is seen.

The roots are the **lab's own solution root and every bridge root**, not the bridge roots alone: rooted at Hawkley's two
bridge files only, the OpenAI closure is 2,688 files; with OpenAI's `SubexponentialSAT/Main.lean` it is the 3,210 cert-machine
pinned. The pin file is cert-machine's shape exactly (`{"commit", "files": {path: sha256}}`, paths from the repository root,
no trailing newline): its decision script reads it as is (the L3s block of `tools/runpod-eth-openai-chain.sh`).

`--check PINS --tree DIR` re-hashes every pinned file (`DRIFT`/`GONE`, exit 1): the drift check of a checkout, a port's
unchanged half, or cert-machine's own corpus copy.

## 3. The scaffold

```
python3 tools/intake_port.py scaffold --name <Lab>Eth --chain <Lab>Chain --pins scout-pins.json --src lean \
    --statement statement.lean --lib <Name>=<module prefix> [--lib …] [--lean-options "autoImplicit = false"] \
    --planted-import <the neutral definition's module> [--claim-import MOD …] \
    --label "the <Lab> chain" --planted-prefix planted_<lab>_chain [--repo URL --commit SHA] [--tree DIR] --out DIR
```

One `[[lean_lib]]` per upstream library (`--lib` names the library the port's lakefile carries and the module prefix it
holds: every pinned module must fall under one prefix, or the scaffold stops), srcDir the port folder, globs `PREFIX.+`,
upstream's package-level leanOptions. A `PORT.md` with the kinds and the admissibility rule (§4 below), §4 in the line form
cert-machine parses, §5 filled from the pins. The three planted variants from the statement (§5). The claim file's skeleton
with the trusted block byte for byte and the proof left to write. `CHECKLIST.md`, the asks of §6 with this claim's paths.
With `--tree` (the scout's clone) the closure's files are copied in at their upstream paths, each checked against its pin
first. Paste the blocks into `lakefile.toml`; add the lab's LICENSE and NOTICE beside the files.

## 4. The port: proof-only, every change in PORT.md

The porter (an agent; the Mac cannot build a 3,000-module closure — one module a minute, 5 GB of oleans per `lean`; the
Anthropic closure of 809 built there, the OpenAI one on a pod cert-machine rented) repairs what the newer Lean and Mathlib
break, and nothing else. The kinds, as they occurred:

- **R0** an import renamed (Hawkley's `import MainResults` → `import EthBridge.Anthropic.MainResults`: the one vendored copy);
- **R1** a library representation change that forces a statement's or definition's text (Mathlib's `Set` became a
  structure: `DecidablePred s` → `DecidablePred (· ∈ s)`), each listed in PORT.md §3 one by one;
- **R2** a binder or case name a library renamed, inside a proof (`Nat.strong_induction_on`'s `h` → `ind`, 16 sites);
- **R3** dead tactic lines after a tactic that now closes its goal (six lines after a `simp`).

**Admissibility.** Statements and definitions change text only by R1; the trusted statement and the lab's headline theorems
stay in files byte-identical to their pins; no `sorry`, no new `axiom`, no `native_decide`, `implemented_by`, `extern`,
`unsafe`, `debug.skipKernelTC`. A file that cannot be kept under these rules stops the port and is reported by name; a proof
that cannot be repaired is reported as the declarations left — never closed by `sorry`, an axiom or a weaker statement.

The ledger's mechanical half is written, not typed:

```
python3 tools/intake_port.py ledger --upstream <the scout's clone> --src lean --port lean/<project>/<Lab>Eth --pins scout-pins.json --out ledger.md
```

Every modified file with both sha256s (the pin's and the file's now) and every changed line with its upstream line number,
marked `signature line` when it lies in a declaration's head (from the keyword to the first `:=`/`where`/`by`; a heuristic,
read by hand) or `proof`; the kind left as `R?` for the porter; every unchanged file's sha256 for §5. On OpenAIEth it
reproduces PORT.md's twenty entries (files, both sha256s, the change counts, the four signature-line hunks) and §5 byte for
byte.

## 5. The three planted variants (commitment 7)

From the statement alone, under `Planted/`, never a default target: the statement closed by `sorry`; the same through a new
axiom; the trusted statement quietly changed (a leading `¬` dropped, else the type negated) and closed by `sorry`. cert-machine
must refuse each — the first two on the axioms and nanoda, the third on the statement check before any kernel runs. The
scaffold writes them; the `Sorry` and `Axiom` files it writes for the OpenAI chain are byte-equal to the ones decided.

## 6. The pre-flight, then what cert-machine needs

```
python3 tools/intake_port.py check --port lean/<project>/<Lab>Eth --pins scout-pins.json --src lean --statement statement.lean \
    --claim lean/<project>/EthBridge/<Lab>Chain.lean --planted-statement lean/<project>/Planted/<Lab>ChainStatement.lean
```

The facts cert-machine's L3s block decides, measured here first and in the same words: the claim's trusted block byte-equal to
the pin, the planted statement's not; every `.lean` under the port byte-equal to its pin (unchanged) or listed in PORT.md with
the pin's sha256 as upstream and its sha256 now as here (modified as declared); anything else a refusal, each named (not in
the pin; differs and not in PORT.md; PORT.md names a sha256 that is not the pin; pinned file missing; listed but absent); the
census over the port. Exit 1 on any refusal, a block that is not the pin, a `sorry`/`native_decide` word or an `axiom`
declaration. It measures; the verdict is cert-machine's.

Then cert-machine needs (CHECKLIST.md, with the paths filled): the statement pin (§1); the scout files (§2) under its corpus;
the port at a named claimbox commit; its own axioms files (`#print axioms` of the claim and of every lab theorem it rests
on, and of the three planted names); a challenge module written from the pin plus its import and `sorry`, for
`lake comparator`, with a second config against the planted statement that must be rejected; its decision script, adapted
from `tools/runpod-eth-openai-chain.sh` with the names changed (L2 build, L3 axioms, L3s statement and port ledger, L4
nanoda with the sorry and axiom variants as negative controls, L5 `leanchecker --fresh`, the judge with named external
checkers after the amendment of 2026-11-05 — leanchecker-paranoid, the pinned nanoda with a 1 GiB stack, lean4lean with
fuel ×100, Lean's default kernel); a pod with the memory the closure needs (OpenAI's: 128 GB, `leanchecker --fresh` at 99 GB
peak); its record. A pre-registration note there, dated, before the pod. None of it is written in claimbox.

## Calibration (2026-11-05, on the two chains as decided)

- Scout, OpenAI chain: thinkthoughts/math at d6b79b7d, roots `SubexponentialSAT/Main.lean` + Hawkley's two bridge files —
  3,210 files, 569,603 lines; `scout-pins.json` and `scout-closure.txt` **byte-equal** to cert-machine's
  `corpus/eth-refutation/openai-chain/` (3,210 of 3,210 digests equal); the git tree agrees on 3,210; against openai/math at
  7ef5c0cc: 3,183 same blob, 0 differing, 27 only in the fork (Hawkley's), as cert-machine's `scout-blobcheck.json`.
- Scout, Anthropic chain: anthropics/formal-math at 16a5ce41, root `eth/Solution.lean`, ten `--src` folders — 810 files, 119,146 lines:
  the 809 of `AnthropicEth/PORT.md` with their 809 upstream sha256s equal, plus `MainResults.lean` (vendored once, not copied); the
  git tree agrees on 810; census 0.
- Scaffold: the four `[[lean_lib]]` blocks byte-equal to the ones in `lean/eth-bridge/lakefile.toml`; `Planted/OpenAIChainSorry.lean`
  and `OpenAIChainAxiom.lean` byte-equal to the files decided; the `Statement` variant the same statement change (the negation
  dropped) with its comment worded by the tool.
- Ledger on OpenAIEth against the clone: 3,190 unchanged, 20 modified, 0 missing; the twenty sha256 pairs and change counts
  of PORT.md §4, the four signature-line hunks, §5 byte-equal.
- Check on OpenAIEth against cert-machine's pins: claim block equals the pin, planted does not, 3,190 unchanged, 20 modified
  as declared, 0 refusals, census 5 docstring `axiom` words and 0 declarations — cert-machine's L3s counts.
- Red controls (`tests/battery.py` §16): a flipped byte → `DRIFT`, exit 1; a deleted file → `GONE`; a port file changed without a
  PORT.md row, a row naming the wrong upstream sha256, a planted `sorry`, the claim's negation dropped — each refused by name.
