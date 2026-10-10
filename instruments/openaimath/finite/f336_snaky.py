"""F-336 — "Snaky in 21 Maker moves" (openai/math family 187).

THE CLAIM (build/introduction.tex:25-31, Theorem thm:main): "In this game, there is one globally legal Maker policy
that completes an allowed copy of S within at most 21 actual Maker claims against every legal continuation of
Breaker." The game (introduction.tex:7-23): S = {(0,0),(1,0),(2,0),(3,0),(3,1),(4,1)} (Snaky); an allowed copy is
t + R(S), t in Z^2, R one of the 8 signed 2x2 permutation matrices; the board is all of Z^2, initially empty; Maker
moves first; one cell per turn; Maker wins on owning every cell of an allowed copy. Corollary cor:finite-board
(build/strategy.tex:64-71): the same on the initially empty 251-cell board T_727 and on {0..16}^2.
The finite object (build/certificate-proof.tex:129-141, Proposition prop:certificate): verification/certificate.txt,
722 lines (cards 6..727), printed in full in build/certificate-appendix.tex:13 by \\lstinputlisting of that very file;
with the six bases (S minus s_j, S, 1) and the combination rule (templates.tex:41-50)
    T = {p} u U T_i,   A = (U A_i  u  n T_i) minus {p},   h = 1 + max h_i,
it is said to give p_727 = (8,8), A_727 = {}, |T_727| = 251, h_727 = 21, T_727 in {0..16}^2.

DECIDED HERE — two independent decisions over the same published bytes, written from the paper's definitions only.

  I. THE CERTIFICATE AS THE PAPER READS IT (rule-based). The card grammar (certificate-proof.tex:13-67: the alphabet
     0123456789ABCDEFG, references j:sUV with the bit rule — negate x on bit 2, negate y on bit 4, then swap on bit 1,
     then translate —, inline (XY child ...) expressions in the line's frame, backward references) is re-implemented,
     every one of the 1,620 combination nodes is evaluated exactly with the formula above, and every number the paper
     prints about the object is recomputed and compared: 722 lines indexed 6..727; 4,089 references; 898 inline
     combinations; 1,620 nodes; 37,042 local reply classes; heights <= 21; the final card (8,8) / {} / 251 / 21 and
     T_727 in {0..16}^2; cards 6 and 7 against eq:first-card and the A_7/T_7 display; all six rows of Table tab:top
     (A_j, |T_j|, h_j, placements, remaining cells), each of the 32 placed requirements equal to {(8,8)}; the
     nonlocal example (certificate-proof.tex:201-208); the eight R_s against the printed table eq:symmetries; the
     printed SHA-256 of the literal file. Every local reply class (every Breaker cell of the node envelope outside
     A u {p}, plus one exterior class) is checked to leave a child whose envelope avoids it and whose requirement
     is owned. This part proves the headline ONLY TOGETHER WITH Lemma lem:combination and Lemma lem:bases, which
     are proved in prose in the paper (templates.tex:41-109). Their soundness is the paper's; I read the proofs and
     found them correct, but this decider does not mechanise them.

 II. A RULE-FREE GAME SEARCH GUIDED BY THE CERTIFICATE (does not use the A-formula or Lemma lem:combination). The
     policy is the one the paper extracts (strategy.tex:14-33): at a node with pivot p claim p (a replacement claim
     if Maker already owns it); after Breaker's reply b go to the first child, in printed order, whose envelope
     avoids b; at a placed base card claim the missing cell. The envelope E of a node is simply the set of cells
     the policy can ever claim or need below it (E(base) = the placed S, E(node) = {p} u the children's envelopes).
     The search plays this policy against EVERY Breaker reply — every cell of the active envelope not owned by
     either player, plus one class for all cells outside it — carrying the ACTUAL Maker cells claimed along the
     line (never the certificate's A sets) and the actual Breaker cells inside the envelope, and fails a line if a
     pivot or a completing cell is Breaker-owned, if no child avoids the reply, or if a base card is reached with
     two or more cells of its S still unowned. It returns the worst-case number of Maker claims, memoised on
     (node, Maker cells in its envelope, Breaker cells in its envelope) in the node's own frame. Three reductions,
     each an elementary monotonicity/locality fact, make the search finite and exact-or-conservative:
       (a) Breaker cells outside the active envelope are forgotten. Exact: envelopes nest (E(child) is a subset of
           E(node) by definition), every later pivot and completing cell lies in the active envelope, and the
           policy's choice depends only on the latest reply.
       (b) Maker cells outside the active envelope are forgotten. Conservative: they could only forbid Breaker
           replies, and the search only credits a win at a base card, whose S lies in the envelope.
       (c) A replacement claim is modelled as a pass (one move counted, no cell gained). Conservative: by a
           coupling on the same Breaker sequence, the real game's Maker set contains the model's, every real legal
           reply is a model legal reply, and both pick the same child; a model win at a base is a real win.
     Early wins elsewhere on the board are not credited (conservative). If the search returns w <= 21 then the
     policy wins within w actual Maker claims on Z^2 against every legal Breaker continuation. On the finite boards
     of the corollary the same search applies (every pivot and completing cell lies in T_727, a subset of
     {0..16}^2, checked; before claim m <= 21 at most 40 cells are occupied, so a replacement cell always exists).

NOT DECIDED HERE: the rest of the paper beyond the 21-move certificate — the 25-move and 35-move
encodings (verification/supporting/route25, route35), Appendix route25's reduced-envelope bridge, Section
sec:geometry's four-in-a-row result, the Lean finite-reconstruction supplement, and any optimality (the paper
asserts none). The coupling argument for reductions (a)-(c) above is stated here in prose; it is short and
elementary but it is an argument, not a computation.
"""
import hashlib
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

PRE = 'preprints/Snaky-in-21-Maker-moves-September-25-2026/'
CERT = PRE + 'verification/certificate.txt'
INTRO = PRE + 'build/introduction.tex'
TEMPL = PRE + 'build/templates.tex'
CPROOF = PRE + 'build/certificate-proof.tex'
STRAT = PRE + 'build/strategy.tex'
VERIF = PRE + 'build/verification.tex'
APPX = PRE + 'build/certificate-appendix.tex'
PAPER = PRE + 'build/paper.tex'

ALPHA = '0123456789ABCDEFG'
REF = re.compile(r'(0|[1-9][0-9]*)(?::([0-7])([0-9A-G]{2}))?$')
INF = 10 ** 6
BOUND = 21


class Malformed(Exception):
    pass


class LineFails(Exception):
    def __init__(self, why, path):
        Exception.__init__(self, why)
        self.why = why
        self.path = path


def coord(w):
    if len(w) != 2 or w[0] not in ALPHA or w[1] not in ALPHA:
        raise Malformed('bad coordinate %r' % w)
    return (ALPHA.index(w[0]), ALPHA.index(w[1]))


def rmat(s):
    """the paper's bit rule (certificate-proof.tex:25-30), as a matrix (a, b, c, d): (x, y) -> (ax + by, cx + dy)"""
    def f(x, y):
        if s & 2:
            x = -x
        if s & 4:
            y = -y
        if s & 1:
            x, y = y, x
        return x, y
    a, c = f(1, 0)
    b, d = f(0, 1)
    return (a, b, c, d)


def ap(F, q):
    R, t = F
    return (R[0] * q[0] + R[1] * q[1] + t[0], R[2] * q[0] + R[3] * q[1] + t[1])


def compose(F, G):
    """F o G"""
    (a, b, c, d), t = F
    (e, f, g, h), u = G
    return ((a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h), ap(F, u))


IDENT = ((1, 0, 0, 1), (0, 0))


def place(F, pts):
    return frozenset(ap(F, q) for q in pts)


def parse(text):
    """the certificate grammar; returns {card: (pivot, children)}, child = ('ref', j, s, t) | ('node', pivot, children)"""
    if not text.endswith('\n'):
        raise Malformed('no final newline')
    lines = text[:-1].split('\n')
    cards = {}
    stats = {'refs': 0, 'inline': 0}
    for ln in lines:
        toks = ln.replace('(', ' ( ').replace(')', ' ) ').split()
        if len(toks) < 3 or not re.match(r'(0|[1-9][0-9]*)$', toks[0]):
            raise Malformed('bad line head %r' % ln[:40])
        j = int(toks[0])
        pos = [1]

        def node():
            if pos[0] >= len(toks):
                raise Malformed('truncated')
            p = coord(toks[pos[0]])
            pos[0] += 1
            kids = []
            while pos[0] < len(toks) and toks[pos[0]] != ')':
                t = toks[pos[0]]
                if t == '(':
                    pos[0] += 1
                    sub = node()
                    if pos[0] >= len(toks) or toks[pos[0]] != ')':
                        raise Malformed('unclosed parenthesis in card %d' % j)
                    pos[0] += 1
                    stats['inline'] += 1
                    kids.append(('node',) + sub)
                else:
                    m = REF.match(t)
                    if not m:
                        raise Malformed('bad reference %r in card %d' % (t, j))
                    k = int(m.group(1))
                    if k >= j:
                        raise Malformed('forward reference %d in card %d' % (k, j))
                    s = int(m.group(2)) if m.group(2) else 0
                    tv = coord(m.group(3)) if m.group(3) else (0, 0)
                    stats['refs'] += 1
                    kids.append(('ref', k, s, tv))
                    pos[0] += 1
            if not kids:
                raise Malformed('empty child list in card %d' % j)
            return (p, kids)

        root = node()
        if pos[0] != len(toks):
            raise Malformed('trailing tokens in card %d' % j)
        if j in cards:
            raise Malformed('duplicate card %d' % j)
        cards[j] = root
    return lines, cards, stats


def target(src):
    tex = src.text(INTRO)
    m = re.search(r'S=\\\{([^\\]*)\\\}\\subset\\Z\^2', tex)
    return [tuple(int(v) for v in pr.split(',')) for pr in re.findall(r'\(([-0-9]+,[-0-9]+)\)', m.group(1))]


def evaluate(cards, S):
    """rule-based: A, T, h of every card and node, by eq:combination"""
    AA, TT, HH = {}, {}, {}
    for j in range(6):
        AA[j] = frozenset(S) - {S[j]}
        TT[j] = frozenset(S)
        HH[j] = 1
    nodes = []          # (card, pivot, A, T, h, [(A_i, T_i, h_i)], inline?)

    def child_val(c):
        if c[0] == 'ref':
            _, k, s, tv = c
            F = (rmat(s), tv)
            return place(F, AA[k]), place(F, TT[k]), HH[k]
        return ev(c[1], c[2], True)

    def ev(p, kids, inline):
        vals = [child_val(c) for c in kids]
        T = frozenset([p]).union(*[v[1] for v in vals])
        inter = frozenset.intersection(*[v[1] for v in vals])
        A = (frozenset().union(*[v[0] for v in vals]) | inter) - {p}
        h = 1 + max(v[2] for v in vals)
        nodes.append((cur[0], p, A, T, h, vals, inline))
        return A, T, h

    cur = [None]
    for j in sorted(cards):
        cur[0] = j
        p, kids = cards[j]
        AA[j], TT[j], HH[j] = ev(p, kids, False)
    return AA, TT, HH, nodes


class Search:
    """rule-free: the certificate-guided policy against every Breaker reply (see the docstring, part II)"""

    def __init__(self, cards, S):
        self.S = frozenset(S)
        self.N = []                     # node id -> ('base', j) | ('comb', pivot, E, children, first_avoid)
        self.root = {}
        for j in range(6):
            self.N.append(('base', j))
            self.root[j] = j
        self.E = {j: self.S for j in range(6)}
        for j in sorted(cards):
            p, kids = cards[j]
            self.root[j] = self.build(p, kids)
        self.memo = {}
        self.replies = 0

    def build(self, p, kids):
        ch = []
        for c in kids:
            if c[0] == 'ref':
                _, k, s, tv = c
                F = (rmat(s), tv)
                tgt = self.root[k]
                Ek = self.N[tgt][2] if self.N[tgt][0] == 'comb' else self.S
                inv = {ap(F, q): q for q in Ek}
                ch.append((tgt, frozenset(inv), inv, F, 'card %d placed s=%d t=%s' % (k, s, tv)))
            else:
                nid = self.build(c[1], c[2])
                ch.append((nid, self.N[nid][2], None, IDENT, 'inline node'))
        E = frozenset([p]).union(*[c[1] for c in ch])
        first = {}
        for b in E:
            first[b] = next((i for i, c in enumerate(ch) if b not in c[1]), -1)
        self.N.append(('comb', p, E, ch, first))
        return len(self.N) - 1

    def W(self, nid, M, B, F, path):
        """worst-case Maker claims to finish from node nid (Maker to move), M/B = Maker/Breaker cells in its envelope"""
        key = (nid, M, B)
        if key in self.memo:
            return self.memo[key]
        nd = self.N[nid]
        if nd[0] == 'base':
            miss = self.S - M
            if len(miss) >= 2:
                raise LineFails('a base card is reached with %d cells of its copy unowned' % len(miss), path)
            if miss & B:
                raise LineFails('the completing cell is Breaker-owned', path)
            v = len(miss)
        else:
            _, p, E, ch, first = nd
            if p in B:
                raise LineFails('the pivot %s is Breaker-owned' % (ap(F, p),), path)
            M1 = M | {p}
            classes = {0: 'a cell outside the envelope'}       # the exterior class always exists on Z^2
            for b in E - M1 - B:
                i = first[b]
                self.replies += 1
                if i < 0:
                    raise LineFails('Breaker reply %s leaves no child' % (ap(F, b),), path + [('claim', ap(F, p)), ('reply', ap(F, b))])
                if i not in classes:
                    classes[i] = ap(F, b)
            self.replies += 1
            worst = 0
            for i in sorted(classes):
                tgt, Ei, inv, G, label = ch[i]
                if inv is None:
                    Mc, Bc = M1 & Ei, B & Ei
                else:
                    Mc = frozenset(inv[q] for q in M1 if q in inv)
                    Bc = frozenset(inv[q] for q in B if q in inv)
                FG = compose(F, G)
                w = self.W(tgt, Mc, Bc, FG, path + [('claim', ap(F, p)), ('reply', classes[i]), ('go', label)])
                worst = max(worst, w)
            v = 1 + worst
        self.memo[key] = v
        return v


def rule_free(cards, S, card=727):
    se = Search(cards, S)
    try:
        w = se.W(se.root[card], frozenset(), frozenset(), IDENT, [])
        return w, None, se
    except LineFails as e:
        return INF, (e.why, ' '.join('%s %s' % st for st in e.path)), se


def decide(src=None, text=None, pin_bytes=True, run_search=True, claimed_bound=BOUND):
    src = src or Sources()
    checks = []
    raw = src.text(CERT)
    if text is None:
        text = raw
    intro, templ, cproof, strat, verif, appx = (src.text(x) for x in (INTRO, TEMPL, CPROOF, STRAT, VERIF, APPX))
    src.text(PAPER)
    check(checks, 'the paper states the theorem, the combination rule and the bases as read here',
          all(k in intro for k in ('within at most $21$ actual', 'Let $\\G$ be the eight $2\\times2$ signed permutation matrices'))
          and all(k in templ for k in ('T=\\{p\\}\\cup\\bigcup_{i=1}^rT_i', '\\bigcap_{i=1}^rT_i\\right)\\setminus\\{p\\}', 'h=1+\\max_i h_i',
                                       '(A_j,T_j,h_j)=(S\\setminus\\{s_j\\},S,1)')))
    st = ' '.join(strat.split())
    check(checks, 'the policy searched in II is the paper\'s (strategy.tex:14-29) and the corollary\'s boards are as read (strategy.tex:64-67)',
          all(k in st for k in ('claim its placed pivot $F(p)$ if free', 'claim the first free cell in the fixed enumeration instead',
                                'choose the first child in the printed list whose placed envelope avoids that reply',
                                'on the initially empty $251$-cell board $T_{727}$', 'on the initially empty $17\\times17$ board $\\{0,\\ldots,16\\}^2$')))
    check(checks, 'the appendix prints the literal file (\\lstinputlisting of ../verification/certificate.txt)',
          '\\lstinputlisting[breakatwhitespace=true,frame=single]{../verification/certificate.txt}' in appx)
    if pin_bytes:
        sha = hashlib.sha256(text.encode('utf-8')).hexdigest()
        printed = re.search(r'\n21: ([0-9a-f]{64})\n', verif).group(1)
        check(checks, 'SHA-256 of the decided bytes equals the one printed (verification.tex:75)', sha == printed, sha[:16])
        check(checks, 'the file has 38,367 bytes (census) ', len(text.encode('utf-8')) == 38367, str(len(text.encode('utf-8'))))
    S = target(src)
    check(checks, 'the target S read from eq:target', S == [(0, 0), (1, 0), (2, 0), (3, 0), (3, 1), (4, 1)], str(S))
    # the eight placements against the printed table eq:symmetries
    printed_R = {0: '(x,y)', 1: '(y,x)', 2: '(-x,y)', 3: '(y,-x)', 4: '(x,-y)', 5: '(-y,x)', 6: '(-x,-y)', 7: '(-y,-x)'}
    rows_ok = ('R_s(x,y)&(x,y)&(y,x)&(-x,y)&(y,-x)' in cproof) and ('R_s(x,y)&(x,-y)&(-y,x)&(-x,-y)&(-y,-x)' in cproof)

    def show(R):
        def lin(a, b):
            parts = [('' if a == 1 else '-') + 'x'] if a else []
            parts += [('' if b == 1 else '-') + 'y'] if b else []
            return parts[0]
        return '(%s,%s)' % (lin(R[0], R[1]), lin(R[2], R[3]))
    mats = [rmat(s) for s in range(8)]
    check(checks, 'the bit rule reproduces the printed table eq:symmetries, and the 8 maps are the 8 signed permutations',
          rows_ok and all(show(mats[s]) == printed_R[s] for s in range(8)) and len(set(mats)) == 8
          and all(sorted(map(abs, m)) == [0, 0, 1, 1] and abs(m[0] * m[3] - m[1] * m[2]) == 1 for m in mats))
    try:
        lines, cards, stats = parse(text)
    except Malformed as e:
        check(checks, 'the certificate parses under the paper\'s grammar', False, str(e))
        return {'verdict': 'REFUTED', 'checks': checks, 'sources': src.read, 'decides': 'parse failure', 'value': {}}
    check(checks, 'grammar: every line parses, nonempty child lists, every reference backward and s in 0..7', True)
    check(checks, 'exactly 722 lines, numbered 6..727 in order (prop:certificate)', len(lines) == 722 and sorted(cards) == list(range(6, 728))
          and [int(l.split()[0]) for l in lines] == list(range(6, 728)), str(len(lines)))
    check(checks, '4,089 references, inline ones included (verification.tex:16,22)', stats['refs'] == 4089, str(stats['refs']))
    check(checks, '898 inline combinations (verification.tex:23)', stats['inline'] == 898, str(stats['inline']))
    AA, TT, HH, nodes = evaluate(cards, S)
    check(checks, '1,620 combination nodes (verification.tex:24)', len(nodes) == 1620, str(len(nodes)))
    check(checks, 'every card and node has A in T and p in T; every child envelope inside its parent',
          all(n[2] <= n[3] and n[1] in n[3] and all(v[1] <= n[3] for v in n[5]) for n in nodes))
    check(checks, 'heights of all 728 cards at most 21', max(HH.values()) <= 21, str(max(HH.values())))
    # local reply classes: every Breaker cell of T outside A u {p}, plus one exterior class
    ncls, bad = 0, 0
    for (_, p, A, T, h, vals, _) in nodes:
        own = A | {p}
        if not all(v[0] <= own for v in vals):
            bad += 1
        for b in T - own:
            ncls += 1
            if not any(b not in v[1] for v in vals):
                bad += 1
        ncls += 1
    check(checks, '37,042 local reply classes over all nodes (verification.tex:44)', ncls == 37042, str(ncls))
    check(checks, 'every local reply class leaves a child whose envelope avoids it and whose requirement is owned', bad == 0, '%d bad' % bad)
    # the two elementary cards (eq:first-card and the A_7/T_7 display)
    A6 = frozenset((0, y) for y in range(5))
    T6 = A6 | {(1, 3), (1, 4), (1, 5)}
    A7 = frozenset((0, y) for y in range(1, 5))
    T7 = frozenset((0, y) for y in range(1, 6)) | frozenset((1, y) for y in (0, 1, 2, 4, 5, 6))
    check(checks, 'card 6 = eq:first-card (A_6 = {(0,y):0<=y<=4}, T_6 = A_6 + (1,3),(1,4),(1,5), h_6 = 2)',
          (AA[6], TT[6], HH[6]) == (A6, T6, 2) and 'A_6=\\{(0,y):0\\le y\\le4\\}' in cproof)
    check(checks, 'card 7 = the printed A_7, T_7, h_7 = 3', (AA[7], TT[7], HH[7]) == (A7, T7, 3) and 'A_7&=\\{(0,y):1\\le y\\le4\\},\\qquad h_7=3' in cproof)
    # the final card
    p727 = cards[727][0]
    T727 = TT[727]
    check(checks, 'final card: p = (8,8), A = {}, |T| = 251, h = 21 (eq:final-card)', (p727, AA[727], len(T727), HH[727]) == ((8, 8), frozenset(), 251, 21),
          '%s %s %d %d' % (p727, sorted(AA[727]), len(T727), HH[727]))
    check(checks, 'the printed final values are those of eq:final-card', 'p_{727}=(8,8),\\qquad A_{727}=\\varnothing' in cproof and '|T_{727}|=251,\\qquad h_{727}=21' in cproof)
    check(checks, 'T_727 inside {0..16}^2', all(0 <= x <= 16 and 0 <= y <= 16 for (x, y) in T727))
    check(checks, 'the claimed bound %d is the final height' % claimed_bound, HH[727] <= claimed_bound)
    # Table tab:top
    kids727 = cards[727][1]
    tab = re.findall(r'\n(\d+) & \$\\\{\((\d+),(\d+)\)\\\}\$ & (\d+) *& (\d+) & (\d+) & (\d+)\\\\', cproof)
    groups, order = {}, []
    for c in kids727:
        k = c[1] if c[0] == 'ref' else None
        if k not in groups:
            groups[k] = []
            order.append(k)
        groups[k].append(c)
    tab_ok = len(tab) == 6 and [int(r[0]) for r in tab] == order and len(kids727) == 32 and all(c[0] == 'ref' for c in kids727)
    inter = None
    detail = []
    for r in tab:
        k = int(r[0])
        if k not in groups:
            tab_ok = False
            continue
        for c in groups[k]:
            F = (rmat(c[2]), c[3])
            Tp = place(F, TT[k])
            inter = Tp if inter is None else inter & Tp
        rem = len(inter - {(8, 8)})
        row = (AA[k] == frozenset([(int(r[1]), int(r[2]))]), len(TT[k]) == int(r[3]), HH[k] == int(r[4]), len(groups[k]) == int(r[5]), rem == int(r[6]))
        detail.append('%d:%s' % (k, ''.join('ok' if x else 'X' for x in row) if all(row) else row))
        tab_ok = tab_ok and all(row)
    check(checks, 'Table tab:top: all six rows (A_j, |T_j|, h_j, placements, remaining cells) recomputed', tab_ok, ' '.join(detail))
    check(checks, 'each of the 32 placed child requirements of card 727 is exactly {(8,8)}',
          all(place((rmat(c[2]), c[3]), AA[c[1]]) == frozenset([(8, 8)]) for c in kids727 if c[0] == 'ref'))
    check(checks, 'the intersection of the 32 child envelopes is exactly {(8,8)}', inter == frozenset([(8, 8)]))
    # the nonlocal example, certificate-proof.tex:201-208
    ex_ok = False
    try:
        c708 = next(c for c in kids727 if c[:4] == ('ref', 708, 1, (0, 0)))
        F708 = (rmat(1), (0, 0))
        c684 = next(c for c in cards[708][1] if c[:4] == ('ref', 684, 0, (1, 1)))
        G = compose(F708, (rmat(0), (1, 1)))
        ex_ok = ((7, 8) not in place(F708, TT[708]) and ap(F708, cards[708][0]) == (8, 7)
                 and (8, 6) not in place(G, TT[684]) and (7, 8) not in place(G, TT[684]) and ap(G, cards[684][0]) == (11, 8)
                 and c684 is not None)
    except StopIteration:
        pass
    check(checks, 'the nonlocal example: 708:100 avoids (7,8), pivot (8,7); its child 684:011 avoids (8,6), pivot (11,8)', ex_ok)
    # II. the rule-free search
    value = {'A_727': sorted(AA[727]), 'T_727': len(T727), 'h_727': HH[727], 'nodes': len(nodes), 'reply_classes': ncls}
    if run_search:
        w, fail, se = rule_free(cards, S)
        value.update({'search_worst_case_claims': w if w < INF else None, 'search_states': len(se.memo), 'search_replies_examined': se.replies})
        check(checks, 'II. rule-free search: the certificate policy wins on Z^2 against every Breaker line within %d actual claims' % claimed_bound,
              w <= claimed_bound, ('worst case %d claims, %d states' % (w, len(se.memo))) if fail is None else 'line fails: %s; %s' % fail)
        corr = len(se.N) == 6 + len(nodes) and all(se.N[6 + k][1] == nodes[k][1] and se.N[6 + k][2] == nodes[k][3] for k in range(len(nodes)))
        cross = corr and all((nodes[nid - 6][2] if nid >= 6 else AA[nid]) <= M and not B for (nid, M, B) in se.memo)
        extra = sum(1 for (nid, M, B) in se.memo if (nodes[nid - 6][2] if nid >= 6 else AA[nid]) < M) if corr else -1
        check(checks, 'cross-check I/II: in every state the search reaches, the actual Maker cells contain the certificate\'s A and Breaker owns no envelope cell',
              cross, '%d of %d states hold Maker cells beyond A' % (extra, len(se.memo)))
        # envelopes nest by their definition (E(node) = {p} u the placed children's envelopes), so every pivot and
        # completing cell the policy ever uses lies in the root envelope
        check(checks, 'II. the policy\'s root envelope is T_727 (so every pivot and completing cell lies on the 251-cell board)',
              se.N[se.root[727]][2] == T727)
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': ('the whole headline (Theorem thm:main, 21 Maker moves on Z^2) and Corollary cor:finite-board, '
                        'twice: (I) the certificate evaluates to A_727 = {}, h_727 = 21 under the paper\'s combination '
                        'rule — sound only with Lemma lem:combination, proved in prose; (II) a rule-free search shows the '
                        'certificate-guided policy wins within 21 claims against every Breaker line, given three stated '
                        'monotonicity/locality reductions'),
            'value': value}


def forge():
    """each must NOT certify; the byte pin is switched off so only the substantive checks decide"""
    src = Sources()
    raw = src.text(CERT)
    lines = raw[:-1].split('\n')
    out = []

    def run(desc, new_lines, **kw):
        t = '\n'.join(new_lines) + '\n'
        r = decide(text=t, pin_bytes=False, **kw)
        failed = [c['check'][:60] for c in r['checks'] if not c['pass']]
        line = [c['detail'] for c in r['checks'] if c['check'].startswith('II. rule-free search')]
        out.append((desc + ' -> fails: ' + '; '.join(failed) + (' || search: ' + line[0] if line else ''), r['verdict']))

    L = list(lines)
    L[-1] = L[-1].replace('727 88 ', '727 87 ', 1)
    run('card 727 pivot moved (8,8) -> (8,7)', L)
    L = list(lines)
    L[-1] = L[-1].rsplit(' ', 1)[0]
    run('card 727 last child 726:6FF dropped', L)
    L = list(lines)
    i = next(k for k, l in enumerate(L) if l.startswith('708 '))
    L[i] = L[i].replace(' 684:011 ', ' 684:111 ', 1)
    run('card 708: child 684:011 transposed (684:111)', L)
    L = list(lines)
    i = next(k for k, l in enumerate(L) if l.startswith('311 '))
    L[i] = L[i].replace('(41 ', '(42 ', 1)
    run('card 311: inline pivot (4,1) -> (4,2)', L)
    run('the bound claimed as 20 instead of 21', lines, claimed_bound=20)
    return out


if __name__ == '__main__':
    import json
    import time
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    for f in forge():
        print('FORGE', f)
    print('forges %.1fs' % (time.time() - t))
