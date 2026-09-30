"""reference.py — Decidível's second implementation, sharing no code with rockphys.js.

Python's decimal module at 50 digits, the same model written out again from the
formulas (Gassmann, Reuss/Voigt, the frame on Nur's trend), no interval
arithmetic and no difference form: the impedance ratio computed DIRECTLY as
rho2*M2 / (rho1*M1). It is not an enclosure but an accurate point value; the
battery asks the engine's thin-point interval to contain it at every sampled
input — and a written-out algebra error in either program (the difference form
is the easy place to make one) shows up as a miss.

usage: python3 reference.py < points.json > values.json
  points: [{"phi","s","phic","gk","Kmin","rhomin","Kw","rhow","Ko","rhoo","Kg","rhog","Swi","dSw","dSg","w"}, ...]
  values: ["r = Ip2^2/Ip1^2", ...]                                         MIT
"""
import json
import sys
from decimal import Decimal, getcontext

getcontext().prec = 50


def ratio(p):
    g = {k: Decimal(v) for k, v in p.items()}
    phi, kr = g['phi'], g['s'] * (1 - g['phi'] / g['phic'])
    kmin, gk = g['Kmin'], g['gk']
    kdry = kr * kmin
    gdry = gk * kdry

    def liquid(sw, so):
        return (sw + so) / (sw / g['Kw'] + so / g['Ko'])

    def ksat(kfl):
        return kdry + (1 - kdry / kmin) ** 2 / (phi / kfl + (1 - phi) / kmin - kdry / kmin ** 2)

    swi = g['Swi']
    so1 = 1 - swi
    k1 = liquid(swi, so1)
    rho_f1 = swi * g['rhow'] + so1 * g['rhoo']

    sw2 = swi + g['dSw']
    sg = g['dSg']
    so2 = 1 - sw2 - sg
    l2 = liquid(sw2, so2)
    sl = 1 - sg
    reuss = 1 / (sl / l2 + sg / g['Kg'])
    voigt = sl * l2 + sg * g['Kg']
    k2 = reuss + g['w'] * (voigt - reuss)
    rho_f2 = sw2 * g['rhow'] + so2 * g['rhoo'] + sg * g['rhog']

    rho1 = (1 - phi) * g['rhomin'] + phi * rho_f1
    rho2 = (1 - phi) * g['rhomin'] + phi * rho_f2
    m1 = ksat(k1) + Decimal(4) / 3 * gdry
    m2 = ksat(k2) + Decimal(4) / 3 * gdry
    return (rho2 * m2) / (rho1 * m1)


if __name__ == '__main__':
    pts = json.load(sys.stdin)
    json.dump([str(ratio(p)) for p in pts], sys.stdout)
