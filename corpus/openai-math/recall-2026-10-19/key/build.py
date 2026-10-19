# Builds the blind packets and the answer key for the lane-S recall experiment.
# Deterministic given draw.json (written by draw.py). Reads the openai-math clone
# and cert-machine read-only; writes only under ../packets and this key/ directory.
#   python3 -I build.py
import hashlib, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PACKETS = os.path.join(ROOT, 'packets')
CLONE = '/Users/carlostoledo/Projects/openai-math'
CM = '/Users/carlostoledo/Projects/cert-machine'

draw = json.load(open(os.path.join(HERE, 'draw.json')))
release = json.load(open(CM + '/corpus/openai-math/release.json'))
stmts = json.load(open(CM + '/certs/openai-math-statements.json'))
fam = {f['n']: f for f in release['families']}
chal = {c['name']: c for c in release['challenges']}
recorded = {r['family']: r['word'] for r in stmts['rows']}

NU = 'NARROWER — UNDECLARED'
DIFF = 'DIFFERENT'

# One edit per mutated family: (line number, original line, mutated line, kind, difficulty,
# expected word, what the headline has that the statement lacks, arguable note or None).
MUT = {
 '005': (8,
   "    Irrational (∑' j : ℕ, (-1 : ℝ) ^ j / ((2 * j + 1 : ℕ) : ℝ) ^ 2) := by",
   "    Irrational (∑' j : ℕ, (1 : ℝ) ^ j / ((2 * j + 1 : ℕ) : ℝ) ^ 2) := by",
   'e', 'subtle', DIFF,
   "The headline's constant is the alternating sum Σ(−1)^j/(2j+1)^2 (Catalan's G); the sign is gone, so the statement asserts the irrationality of Σ1/(2j+1)^2 = π²/8, a different constant.",
   None),
 '026': (39,
   "        c * (N : ℝ) ≤ ((LargePrimeGaps.largeGapIndices C N).card : ℝ)) ∧",
   "        c * Real.sqrt (N : ℝ) ≤ ((LargePrimeGaps.largeGapIndices C N).card : ℝ)) ∧",
   'a', 'subtle', NU,
   "The headline has a positive proportion (at least c·N of the first N indices) of gaps exceeding C log p_n for every C > 0; the statement only has at least c·√N such indices, which is not a positive proportion (the ratio-increase conjunct is untouched and only covers gaps above roughly log p_n).",
   "The scope note (026.md) describes only the ratio corollary, and the first readers recorded that as 'an understatement by the note, not a gap'. A reader could therefore argue NARROWER — DECLARED (the note never claims the large-gap clause). The note does not say the clause is left out or weakened, so the key's word is NARROWER — UNDECLARED; score DECLARED as 'defect seen, declared-ness disputed'."),
 '081': (43,
   "  ∀ d n : ℕ, 4 ≤ d → 2 ≤ n → n + 2 ≤ d →",
   "  ∀ d n : ℕ, 4 ≤ d → 2 ≤ n → n + 2 = d →",
   'b', 'subtle', NU,
   "The headline covers every 2 ≤ n ≤ d − 2 (every codimension at least two); the statement covers only n = d − 2 (codimension exactly two).",
   None),
 '155': (57,
   "      (∀ A : Set (Space 3),",
   "      (∀ A : Set (Space 3), A ⊆ Set.range castLattice →",
   'c', 'easy', NU,
   "The headline's ℝ³ clause holds 'even with arbitrary real translation vectors'; the statement only rules out fully periodic tilings whose translation set lies in the integer lattice.",
   None),
 '156': (20,
   "  ∃ C : Fin 10 → Set Matrix4,",
   "  ∃ C : Fin 9 → Set Matrix4,",
   'a', 'subtle', NU,
   "The headline says the set cannot be covered by ten sets of smaller diameter (d + 1 for d = 9, which is what disproves Borsuk); the statement only rules out covers by nine sets.",
   "The definition keeps its name HasTenSmallCover while its body says Fin 9; the mismatch is a visible clue."),
 '173': (28,
   "  (firstNeighbors r v).card ≤ (secondNeighbors r v).card",
   "  (secondNeighbors r v).card ≤ (firstNeighbors r v).card",
   'e', 'subtle', DIFF,
   "The headline gives a vertex with at least as many second out-neighbours as first; the statement's inequality is reversed, giving a vertex with at least as many first out-neighbours as second.",
   "The reversed statement may be easy or even trivial (any sink satisfies it), but it neither implies nor is implied by Seymour's conjecture, so the word stays DIFFERENT."),
 '188': (57,
   "      (normalizedLeave n G - sharpConstant) ^ 2)) atTop (\U0001d4dd 0) ∧",
   "      |normalizedLeave n G - sharpConstant|)) atTop (\U0001d4dd 0) ∧",
   'd', 'subtle', NU,
   "The headline has mean-square (L²) convergence of the normalized leave; the statement only has mean-absolute (L¹) convergence, alongside the untouched convergence in probability and of the normalized expectation, none of which gives L².",
   None),
 '189': (24,
   "    (∀ m n : ℤ, n ≤ m → 3 ≤ n → (m, n) ≠ (3, 3) →",
   "    (∀ m n : ℤ, n ≤ m → 3 ≤ n → m ≤ 2 * n → (m, n) ≠ (3, 3) →",
   'b', 'easy', NU,
   "The headline covers every m ≥ n ≥ 3; the statement covers only n ≤ m ≤ 2n.",
   None),
 '192': (35,
   "  ∀ x, f x = -1 ∨ f x = 1",
   "  ∀ x, |f x| ≤ 1",
   'd', 'subtle', NU,
   "The headline's witness is a sign-valued (±1) Boolean function; the statement's IsBoolean only asks |f x| ≤ 1, so both clauses may be witnessed by any [−1,1]-valued function.",
   "The edit is in a definition (IsBoolean) shared by both conjuncts. That is deliberate: the signed and the absolute clauses imply each other (flip input signs), so weakening only one of them would leave the statement equivalent to the original."),
 '295': (32,
   "    (n : ℕ) (f : Cochain M (n + 2))",
   "    [TopologicalSpace.SeparableSpace M] (n : ℕ) (f : Cochain M (n + 2))",
   'c', 'easy', NU,
   "The headline covers every complex von Neumann algebra; the statement adds norm-separability of M, which no infinite-dimensional von Neumann algebra has, so only finite-dimensional algebras remain.",
   "The scope note says 'No separability or type restriction is imposed', which contradicts the plant rather than declaring it."),
 '328': (27,
   "    (hF : ∀ a b : C, ‖(F a : X) - (F b : X)‖ ≤ ‖(a : X) - (b : X)‖) :",
   "    (hF : ∀ a b : C, ‖(F a : X) - (F b : X)‖ ≤ ‖(a : X) - (b : X)‖ / 2) :",
   'a', 'easy', NU,
   "The headline covers every nonexpansive (1-Lipschitz) self-map; the statement requires F to be 1/2-Lipschitz, a strict contraction, which Banach's fixed-point theorem already handles without reflexivity.",
   "The docstring above the theorem (unaltered) still says 'nonexpansive'; that mismatch is a visible clue."),
 '369': (21,
   "    IsSimplyConnected Ω ∧ SmoothBoundary Ω",
   "    Convex ℝ Ω ∧ SmoothBoundary Ω",
   'b', 'easy', NU,
   "The headline covers every smooth bounded simply connected planar domain; the statement covers only convex ones.",
   None),
}

assert sorted(MUT) == sorted(draw['mutated']), 'mutation table must cover exactly the drawn families'

def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()

def headline_line(n):
    lines = open(os.path.join(CLONE, 'CONTENTS.md'), encoding='utf-8').read().split('\n')
    hits = [l for l in lines if l.startswith('**%s. ' % n)]
    assert len(hits) == 1, n
    line = hits[0]
    title = line[len('**%s. ' % n):line.index('.**')]
    return title, line

README = """# Packets

There are 24 directories, P01 to P24. Each holds one result family of the openai/math
release and three files:

- `headline.md`: the family's title and its headline paragraph as given in the release's
  CONTENTS.md.
- `scope-note.md`: OpenAI's Lean scope note for the family (`lean/docs/NNN.md` in the
  release). Its relative links point into the release and do not resolve here.
- `challenge.lean`: the Lean challenge statement for the family.
"""

if os.path.exists(PACKETS):
    shutil.rmtree(PACKETS)
os.makedirs(PACKETS)
with open(os.path.join(PACKETS, 'README.md'), 'w', encoding='utf-8') as fh:
    fh.write(README)

entries = {}
for pid, n in sorted(draw['packetOrder'].items()):
    f = fam[n]
    assert len(f['challenges']) == 1
    cname = f['challenges'][0]
    c = chal[cname]
    src_lean = os.path.join(CLONE, c['statement'])
    src_note = os.path.join(CLONE, f['scopeNote'])
    assert sha(src_lean) == c['statementSha256'], cname
    title, line = headline_line(n)
    d = os.path.join(PACKETS, pid)
    os.makedirs(d)
    with open(os.path.join(d, 'headline.md'), 'w', encoding='utf-8') as fh:
        fh.write('# %s\n\n%s\n' % (title, line))
    shutil.copyfile(src_note, os.path.join(d, 'scope-note.md'))
    raw = open(src_lean, 'rb').read()
    e = {
        'family': n, 'title': title, 'challenge': cname,
        'source': {'challenge': c['statement'], 'challengeSha256': c['statementSha256'],
                   'scopeNote': f['scopeNote'], 'scopeNoteSha256': sha(src_note)},
        'recordedWord': recorded[n],
        'mutated': n in MUT,
    }
    if n in MUT:
        ln, old, new, kind, diff, word, desc, arguable = MUT[n]
        text = raw.decode('utf-8')
        lines = text.split('\n')
        assert lines[ln - 1] == old, (n, ln, lines[ln - 1])
        assert sum(1 for l in lines if l == old) == 1, (n, 'original line not unique')
        assert old not in open(src_note, encoding='utf-8').read()
        lines[ln - 1] = new
        out = '\n'.join(lines).encode('utf-8')
        # exactly one line differs, everything else byte-identical
        a, b = raw.split(b'\n'), out.split(b'\n')
        assert len(a) == len(b) and [i for i in range(len(a)) if a[i] != b[i]] == [ln - 1]
        e.update({'kind': kind, 'difficulty': diff, 'line': ln,
                  'originalLine': old, 'mutatedLine': new,
                  'expectedWord': word, 'headlineHasStatementLacks': desc,
                  'arguable': arguable})
    else:
        out = raw
        e.update({'expectedWord': recorded[n]})
    with open(os.path.join(d, 'challenge.lean'), 'wb') as fh:
        fh.write(out)
    e['files'] = {fn: sha(os.path.join(d, fn)) for fn in ('headline.md', 'scope-note.md', 'challenge.lean')}
    entries[pid] = e

KINDS = {
 'a': 'a constant or exponent changed in the weaker direction',
 'b': 'a quantifier domain restricted',
 'c': 'a hypothesis added that the headline does not have',
 'd': 'a conclusion weakened',
 'e': 'a change that makes the statement DIFFERENT (direction reversed, sign flipped)',
}

key = {
 'what': 'Answer key for the lane-S recall experiment: 24 blind packets, 12 carrying one planted defect each, 12 unaltered controls. Keep out of every reader\'s reach.',
 'built': '2026-10-19',
 'release': {'repository': release['repository'], 'commit': release['commit'],
             'contentsSha256': sha(os.path.join(CLONE, 'CONTENTS.md'))},
 'seed': draw['seed'], 'python': draw['python'],
 'procedure': [
  'Eligible: rows of certs/openai-math-statements.json with word MATCHES whose family has exactly one challenge, and that challenge (corpus/openai-math/release.json) has statementLines <= 70, empty definitionNames and holeBodies, support false and supportByName false. Sorted by family number. 30 qualify.',
  'rng = random.Random(20261019) (CPython ' + draw['python'] + '); chosen = sorted(rng.sample(eligible, 24)); mutated = sorted(rng.sample(chosen, 12)); order = list(chosen); rng.shuffle(order); P01..P24 = order. Same rng object, calls in that order (key/draw.py).',
  'Kind and difficulty per mutated family were assigned by hand after reading each statement, to spread kinds a-e roughly evenly (3/3/2/2/2) and difficulty 5 easy / 7 subtle. Plants that a stronger untouched clause would mask were avoided (see selection.md).',
  'Each mutated challenge.lean differs from the release file in exactly one line (asserted by key/build.py); no comment, whitespace or other byte changes. Controls are byte-identical copies.',
  'headline.md = "# <title>" + the CONTENTS.md paragraph for the family, verbatim. scope-note.md = byte copy of lean/docs/NNN.md.',
 ],
 'kinds': KINDS,
 'expectedWordRule': 'kinds a-d: NARROWER — UNDECLARED; kind e: DIFFERENT; controls: the recorded word (MATCHES).',
 'eligible': draw['eligible'],
 'chosen': draw['chosen'],
 'mutatedFamilies': draw['mutated'],
 'controlFamilies': sorted(set(draw['chosen']) - set(draw['mutated'])),
 'packetOrder': draw['packetOrder'],
 'readmeSha256': sha(os.path.join(PACKETS, 'README.md')),
 'packets': entries,
}
with open(os.path.join(HERE, 'key.json'), 'w', encoding='utf-8') as fh:
    json.dump(key, fh, ensure_ascii=False, indent=1)
    fh.write('\n')
print('ok', len(entries), 'packets;', sum(e['mutated'] for e in entries.values()), 'mutated')
