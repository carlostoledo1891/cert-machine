import sys,unicodedata
from collections import Counter
for f in sys.argv[1:]:
    s=open(f,encoding='utf-8').read()
    c=Counter(ch for ch in s if ord(ch)>127)
    print(f.split('/')[-1], {f"{ch} U+{ord(ch):04X} {unicodedata.name(ch,'?')}":n for ch,n in sorted(c.items())})
    # identifiers containing non-ascii letters
    import re
    ids=set(re.findall(r'[A-Za-z_\u0080-￿][A-Za-z0-9_\.\u0080-￿]*',s))
    print(' non-ascii identifiers:', sorted(i for i in ids if any(ord(ch)>127 and unicodedata.category(ch).startswith('L') for ch in i)))
    print(' tabs/CR/zero-width:', s.count('\t'), s.count('\r'), sum(s.count(z) for z in '​‌‍﻿ '))
