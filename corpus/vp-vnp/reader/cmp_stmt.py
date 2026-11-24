import re,sys
pdf=open(sys.argv[1],encoding='utf-8').read()
a=pdf.index('import Mathlib'); b=pdf.index('end Statement')+len('end Statement')
pdf=pdf[a:b]
pdf=pdf.replace('12 CLAUDE','\n')
for x,y in [('∑︀','∑'),('∏︀','∏'),('𝜎','σ'),('𝜀','ε'),(' ̸=',' ≠'),('̸=','≠'),('m0','m₀'),('log2','log₂'),('→0','→₀')]:
    pdf=pdf.replace(x,y)
pdf=re.sub(r'\bN\b','ℕ',pdf); pdf=re.sub(r'\bR\b','ℝ',pdf); pdf=re.sub(r'\bZ\b','ℤ',pdf)
src=open(sys.argv[2],encoding='utf-8').read()
src=src[src.index('import Mathlib'):]
src=src[:src.index('end Statement')+len('end Statement')]
def toks(s): return s.split()
tp,ts=toks(pdf),toks(src)
# the pdf moves the big-operator glyph before the binder; reorder: '∑' then binder -> compare as multiset per line too
print('pdf tokens',len(tp),'src tokens',len(ts))
import difflib
sm=difflib.SequenceMatcher(a=ts,b=tp,autojunk=False)
for op,i1,i2,j1,j2 in sm.get_opcodes():
    if op!='equal': print(op, ts[i1:i2], '->', tp[j1:j2])
from collections import Counter
print('multiset equal:', Counter(tp)==Counter(ts))
