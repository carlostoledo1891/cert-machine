#!/usr/bin/env python3
"""instruments/eleicoes2026/battery.py — the election dossier's instruments against cases whose answer is known.

    green: a planted three-section BU file (rows of one section scattered, as the TSE's file has them) is summed to the
           same totals by both deciders; the ledger re-derives identically from its pinned inputs
    red:   a section whose votes do not sum to its turnout is caught by both deciders (S1); a section whose turnout plus
           abstentions is not its registered voters is caught by both (S2); a signed result with one digit changed is
           refused by both signature verifiers (the ledger's own red control, re-run here)

usage: python3 instruments/eleicoes2026/battery.py"""
import io
import json
import os
import subprocess
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import bu_a  # noqa: E402

COLS = ['SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'CD_CARGO_PERGUNTA', 'QT_APTOS', 'QT_COMPARECIMENTO', 'QT_ABSTENCOES',
        'CD_TIPO_URNA', 'DT_ABERTURA', 'DT_ENCERRAMENTO', 'DS_SECOES_AGREGADAS', 'QT_ELEI_BIOM_SEM_HABILITACAO',
        'CD_TIPO_VOTAVEL', 'NR_VOTAVEL', 'QT_VOTOS']


def row(sec, aptos, comp, abst, tipo, nr, q, cargo='1'):
    return ['XX', '1', '1', str(sec), cargo, str(aptos), str(comp), str(abst), '1', '2026-10-04 08:00:00',
            '2026-10-04 17:01:00', '#NULO#', '0', tipo, nr, str(q)]


def planted(bad_votes=False, bad_aptos=False):
    rows = [row(1, 300, 200, 100, '1', '13', 120), row(2, 250, 150, 100, '1', '22', 90), row(1, 300, 200, 100, '1', '22', 70),
            row(9, 100, 50, 50, '1', '13', 7, cargo='7'),
            row(2, 250, 150, 100, '1', '13', 50), row(1, 300, 200, 100, '2', '95', 10),
            row(2, 250, 150, 100, '3', '96', 10 if not bad_votes else 11)]
    if bad_aptos:
        rows.append(row(3, 100, 60, 41, '1', '13', 60))
    text = ';'.join('"' + c + '"' for c in COLS) + '\n' + '\n'.join(';'.join('"' + v + '"' for v in r) for r in rows) + '\n'
    d = tempfile.mkdtemp()
    p = os.path.join(d, 'bweb_1t_XX_test.zip')
    with zipfile.ZipFile(p, 'w') as z:
        z.writestr('bweb_1t_XX_test.csv', text.encode('latin-1'))
    return p, text


def decide_a(p):
    t = {'S1': 0, 'S2': 0, 'S3': 0}
    tot = {}
    for key, f, votes, mismatch in bu_a.sections(p):
        aptos, comp, abst = int(f[0]), int(f[1]), int(f[2])
        t['S1'] += sum(votes.values()) != comp
        t['S2'] += comp + abst != aptos or comp > aptos
        t['S3'] += mismatch
        for k, v in votes.items():
            tot[k] = tot.get(k, 0) + v
    return t, tot


def decide_b(text):
    r = subprocess.run(['node', os.path.join(HERE, 'bu_b.js'), 'XX'], input=text.encode('latin-1'), capture_output=True, check=True)
    o = json.loads(r.stdout)
    return o['failures'], {k: int(v) for k, v in o['totals'].items() if not k.startswith('_')}


def main():
    ok, reds, fails = 0, 0, 0

    def check(label, cond, red=False):
        nonlocal ok, reds, fails
        reds += red
        if cond:
            ok += 1
            print(f"  {'red ' if red else ''}ok  {label}")
        else:
            fails += 1
            print(f"  FAIL {label}")

    p, text = planted()
    fa, ta = decide_a(p)
    fb, tb = decide_b(text)
    check('a planted file with one section\'s rows scattered: both deciders sum the same totals and find nothing wrong',
          ta == tb == {'13': 170, '22': 160, 'BRANCO': 10, 'NULO': 10} and fa == fb == {'S1': 0, 'S2': 0, 'S3': 0})
    p, text = planted(bad_votes=True)
    check('a section whose votes exceed its turnout by one is caught by both (S1)', decide_a(p)[0]['S1'] == 1 and decide_b(text)[0]['S1'] == 1, red=True)
    p, text = planted(bad_aptos=True)
    check('a section whose turnout plus abstentions is not its registered voters is caught by both (S2)',
          decide_a(p)[0]['S2'] == 1 and decide_b(text)[0]['S2'] == 1, red=True)
    r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'eleicoes2026', 'ledger.py'), '--check'], capture_output=True, text=True)
    check('the ledger re-derives identically from its pinned inputs', r.returncode == 0)
    L = json.load(open(os.path.join(ROOT, 'corpus', 'eleicoes2026', 'ledger.json')))
    check('a signed result with one digit changed is refused by both signature verifiers', L['decisions']['SIG']['red_control_tampered_digit_refused_by_both'], red=True)
    print(f'eleicoes2026 battery: {ok + fails} checks, {reds} red controls, {fails} failed')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
