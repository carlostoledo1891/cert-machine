#!/usr/bin/env python3
"""gen.py — the checks added AFTER the first run (2026-11-18), after a review of the first run. Written from the two specs.
  struct/<id>/<m>.lean   each planted statement compared with the canonical proposition AS EXPRESSIONS (no unfolding
                          beyond the one definition), the kind of comparison Lean's comparator makes
  enc/<id>.lean          the statement files' encodings evaluated on small pairs against an encoder written here"""
import json, os, sys
W = sys.argv[1]; OUT = sys.argv[2]
def bits(n):
    out = []
    while n: out.append(n & 1); n >>= 1
    return out
B = lambda b: 'true' if b else 'false'
for sid in ('intmul-gcmu', 'intmul-community'):
    S = json.load(open(f'{W}/corpus/lean-intake/{sid}/spec.json'))
    d = f'{OUT}/struct/{sid}'; os.makedirs(d, exist_ok=True)
    ns0 = S['mutantNamespace']; opens = ''.join(f'open {o}\n' for o in S.get('mutantOpen', []))
    for m in S['mutants']:
        ns = f"{ns0}.{m['id']}"
        src = (f"import {S['canonical']['module']}\nimport Lean\n\n/-! Structural comparison of planted statement {m['id']} ({m['kind']}) with the canonical proposition. -/\n"
               f"namespace {ns}\n{opens}theorem s : {m['statement']} := by\n  sorry\ntheorem t : {S['canonical']['prop']} := by\n  sorry\nend {ns}\n\n"
               "open Lean Meta in\n#eval show MetaM Unit from do\n  let env ← getEnv\n"
               f"  let some s := env.find? `{ns}.s | throwError \"no s\"\n  let some t := env.find? `{ns}.t | throwError \"no t\"\n"
               "  let unfolded := (← unfoldDefinition? t.type).getD t.type\n"
               f"  IO.println s!\"STRUCT {m['id']} folded={{s.type.eqv t.type}} unfolded={{s.type.eqv unfolded}}\"\n")
        open(f"{d}/{m['id']}.lean", 'w').write(src)
pairs = [(a, b) for a in range(0, 18) for b in range(0, 18)] + [(2**64 - 1, 2**64 + 1), (2**100, 3), (0, 2**70 + 5), (123456789, 987654321)]
os.makedirs(f'{OUT}/enc', exist_ok=True)
tup = '[' + ', '.join(f'({a}, {b})' for a, b in pairs) + ']'
sepw = lambda a, b: '[' + ', '.join([f'.bit {B(x)}' for x in bits(a)] + ['.sep'] + [f'.bit {B(x)}' for x in bits(b)]) + ']'
tagw = lambda a, b: '[' + ', '.join([f'.inl {B(x)}' for x in bits(a)] + [f'.inr {B(x)}' for x in bits(b)]) + ']'
outw = lambda n: '[' + ', '.join(B(x) for x in bits(n)) + ']'
prods = '[' + ', '.join(outw(a * b) for a, b in pairs) + ']'
open(f'{OUT}/enc/intmul-gcmu.lean', 'w').write(
    "import SubNLogN.Challenge\nopen SubNLogN.Challenge Computability\n\n/-! The statement file's encodings on small pairs, against an encoder written outside Lean. -/\n"
    f"def pairs : List (ℕ × ℕ) := {tup}\n\n#guard pairs.map encodeNatPair == ([{', '.join(sepw(a, b) for a, b in pairs)}] : List (List PairSym))\n"
    f"#guard pairs.map encNatPair.encode == pairs.map encodeNatPair\n#guard pairs.map (fun p => decodeNatPair (encodeNatPair p)) == pairs.map some\n"
    f"#guard pairs.map (fun p => encodingNatBool.encode (p.1 * p.2)) == ({prods} : List (List Bool))\n"
    f"#guard pairs.map (fun p => (encodeNatPair p).length) == {[len(bits(a)) + 1 + len(bits(b)) for a, b in pairs]}\n#eval IO.println s!\"ENC intmul-gcmu {{pairs.length}} pairs: all guards hold\"\n")
open(f'{OUT}/enc/intmul-community.lean', 'w').write(
    "import IntegerMultBounds.MathlibTM2.Statement\nopen IntegerMultBounds.MathlibTM2 Computability\n\n/-! The statement file's encodings on small pairs, against an encoder written outside Lean. -/\n"
    f"def pairs : List (ℕ × ℕ) := {tup}\n\n#guard pairs.map pairEnc == ([{', '.join(tagw(a, b) for a, b in pairs)}] : List (List (Bool ⊕ Bool)))\n"
    f"#guard pairs.map (fun p => encodingNatBool.encode (p.1 * p.2)) == ({prods} : List (List Bool))\n"
    f"#guard pairs.map (fun p => (pairEnc p).length) == {[len(bits(a)) + len(bits(b)) for a, b in pairs]}\n#eval IO.println s!\"ENC intmul-community {{pairs.length}} pairs: all guards hold\"\n")
print('struct files:', sum(len(os.listdir(f'{OUT}/struct/{s}')) for s in ('intmul-gcmu', 'intmul-community')), '| pairs:', len(pairs))
