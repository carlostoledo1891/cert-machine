import decimal, os, sys
c = decimal.Context(prec=60); D = decimal.Decimal
ln2 = c.ln(D(2))
assert D(2) / D(3) <= ln2 < D(5) / D(6), 'the changed edge inequality is not refuted at x = 2, y = 1'
t = open(os.environ['PLANT']).read()
assert 'J log(x/y)≥(5/2)J²/H on every edge' in t
print('at x = 2, y = 1: (x-y) ln(x/y) = %s < (5/2)(x-y)^2/(x+y) = %s; the original constant 2 gives %s <= ln 2' % (+ln2, D(5) / D(6), D(2) / D(3)))
