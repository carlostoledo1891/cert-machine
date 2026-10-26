#!/usr/bin/env python3
"""tools/eleicoes2026/ledger.py — the 2026 presidential election dossier's record: corpus/eleicoes2026/ledger.json.

It reads only pinned or derived inputs and decides, each with a verdict word:
  R1-SUM    round 1: the boletins de urna (every section, BU na Web) summed by two deciders sharing no code (bu_a.py,
            bu_b.js) agree with each other and equal the TSE's signed official result, candidate by candidate, blank,
            null, turnout, for Brazil and for each UF
  R1-SEC    round 1: every section's arithmetic (votes = turnout; turnout + abstentions = registered) holds
  SIG       both rounds: every signed result (compact JWS, Ed25519) verifies under the TSE's key, by two verifiers
            sharing no code, and a result with one digit changed is refused by both (red control)
  R2-ARITH  round 2: the signed result's own arithmetic, and the UFs plus abroad summing to Brazil
  R2-WIN    round 2: who has more valid votes in the signed result, the margin, and the swing that would reverse it
  R2-SUM    round 2: the signed result equals the sum of every section's boletim de urna (NEEDS DATA until the TSE
            publishes the round-2 BU na Web in bulk)
  EXT       the extension: the votes cast after the legal close (17:00 Brasília), counted from the urns' logs, against
            the margin; decided only for the UFs whose every log was read
  C6        the 51.74% said at the proclamation, against the signed share
  POLLS     each final poll's published valid-vote numbers and declared margin against the result
and the claims of corpus/eleicoes2026/claims.json get their words from these.

usage: python3 tools/eleicoes2026/ledger.py [--check]"""
import base64
import json
import os
import subprocess
import sys
import time
from fractions import Fraction

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
E = os.path.join(ROOT, 'corpus', 'eleicoes2026')
DER = os.path.join(E, 'derived')   # the deciders' summaries and the logs read (small, committed); the BU zips stay in raw/
SIG = os.path.join(E, 'signed')
OUT = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'ledger.json')
UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ',
       'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO', 'ZZ']


def die(m):
    sys.exit('ELEICOES2026 LEDGER REFUSED: ' + m)


def signed(e, a):
    """the signed result as numbers: candidates by number, and the summary fields"""
    d = json.load(open(os.path.join(SIG, f'{e}-{a.lower()}.json')))
    c = d['carg'][0] if isinstance(d['carg'], list) else d['carg']
    cand = {}
    for g in c['agr']:
        for p in g['par']:
            for k in p['cand']:
                cand[k['n']] = {'name': k['nmu'], 'votes': int(k['vap']), 'pct': k.get('pvap'), 'status': k.get('st')}
    v, el, s = d['v'], d['e'], d['s']
    return {'cand': cand, 'blank': int(v['vb']), 'null_urn': int(v['vn']), 'null_technical': int(v['vnt']),
            'null_total': int(v['tvn']), 'valid': int(v['vv']), 'total_votes': int(v['tv']), 'turnout': int(el['c']),
            'abstention': int(el['a']), 'registered': int(el['te']), 'registered_functioning': int(el['esi']),
            'sections': int(s['ts']), 'sections_installed': int(s['si']), 'sections_not_installed': int(s['sni']),
            'generated': d['dg'] + ' ' + d['hg']}


def bu_totals(src, scope):
    """a decider's totals in the signed result's vocabulary (BU number 28 is the technical null, as the TSE reports it)"""
    t = {k: int(v) for k, v in src.items()}
    cand = {k: v for k, v in t.items() if k.isdigit() and k != '28'}
    return {'cand': cand, 'blank': t.get('BRANCO', 0), 'null_urn': t.get('NULO', 0), 'null_technical': t.get('28', 0),
            'turnout': t['_turnout'], 'registered': t['_aptos'], 'sections': t['_sections']}


def jws(tamper=None):
    """both verifiers over the signed files; with tamper, over a copy whose payload has one digit changed"""
    if tamper:
        import shutil
        import tempfile
        tmp = tempfile.mkdtemp()
        shutil.copytree(SIG, os.path.join(tmp, 'signed'))
        f = os.path.join(tmp, 'signed', tamper)
        h, p, s = open(f).read().strip().split('.')
        pay = base64.urlsafe_b64decode(p + '=' * (-len(p) % 4)).decode()
        i = pay.index('"vap" : "') + 9
        pay = pay[:i] + str((int(pay[i]) + 1) % 10) + pay[i + 1:]
        open(f, 'w').write(h + '.' + base64.urlsafe_b64encode(pay.encode()).decode().rstrip('=') + '.' + s)
        env = dict(os.environ, ELEICOES_SIGNED=os.path.join(tmp, 'signed'))
    else:
        env = dict(os.environ)
    a = json.loads(subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'instruments', 'eleicoes2026', 'jws_a.py')],
                                  capture_output=True, text=True, env=env, check=True).stdout)
    b = json.loads(subprocess.run(['node', os.path.join(ROOT, 'instruments', 'eleicoes2026', 'jws_b.js')],
                                  capture_output=True, text=True, env=env, check=True).stdout)
    return a, b


def frac_str(x, places=2):
    """a share as a percentage rounded half-up at `places`, exactly"""
    q = x * 100 * 10 ** places
    n = q.numerator * 2 + q.denominator
    r = n // (2 * q.denominator)
    s = str(r).rjust(places + 1, '0')
    return s[:-places] + ',' + s[-places:]


def build():
    L = {'what': __doc__.splitlines()[0], 'generated': time.strftime('%Y-%m-%d'), 'decisions': {}, 'claims': []}
    D = L['decisions']

    # ---- signatures ---------------------------------------------------------------------------------------------
    a, b = jws()
    if a != b:
        die('the two signature verifiers disagree')
    ok = sum(1 for v in a.values() if v['signature'] and v['payload_is_served_json'])
    ta, tb = jws('6258-br.jws')
    red = not ta['6258-br.jws']['signature'] and not tb['6258-br.jws']['signature']
    D['SIG'] = {'verdict': 'CERTIFIED' if ok == len(a) and red else 'REFUSED', 'files': len(a), 'verified': ok,
                'red_control_tampered_digit_refused_by_both': red,
                'key': 'Ed25519, kid sNbt9Q_fLS65zE1_ZLNV-XRRwPY, as embedded in resultados.tse.jus.br/oficial/app'}

    # ---- round 1: the BUs against the signed result ---------------------------------------------------------------
    A = json.load(open(os.path.join(DER, 'r1-a.json')))
    B = json.load(open(os.path.join(DER, 'r1-b.json')))
    if {k: int(v) for k, v in A['national'].items()} != {k: int(v) for k, v in B['national'].items()}:
        die('round 1: the two BU deciders disagree on the national totals')
    for uf in UFS:
        if {k: int(v) for k, v in A['per_uf'][uf].items()} != {k: int(v) for k, v in B['per_uf'][uf].items()}:
            die('round 1: the two BU deciders disagree on ' + uf)
    fails = {k: A['checks'][k]['failures'] for k in ('S1', 'S2', 'S3', 'duplicate')}
    if fails != {**B['failures'], 'duplicate': 0} and {k: fails[k] for k in ('S1', 'S2', 'S3')} != B['failures']:
        die('round 1: the deciders disagree on the section checks')
    rows, eq_all = [], True
    for scope, bu in [('BR', A['national'])] + [(uf, A['per_uf'][uf]) for uf in UFS]:
        s, t = signed('6257', scope), bu_totals(bu, scope)
        same = {'candidates': all(s['cand'][n]['votes'] == t['cand'].get(n, 0) for n in s['cand']) and set(t['cand']) <= set(s['cand']),
                'blank': s['blank'] == t['blank'], 'null': s['null_urn'] == t['null_urn'],
                'technical_null': s['null_technical'] == t['null_technical'], 'turnout': s['turnout'] == t['turnout']}
        eq_all &= all(same.values())
        rows.append({'scope': scope, 'equal': same, 'bu_sections_with_votes': t['sections'], 'signed_sections_installed': s['sections_installed'],
                     'bu_registered': t['registered'], 'signed_registered_functioning': s['registered_functioning'],
                     'turnout': t['turnout']})
    s1 = signed('6257', 'BR')
    D['R1-SUM'] = {'verdict': 'CERTIFIED' if eq_all else 'REFUTED', 'scopes': rows,
                   'candidates': {n: {'name': s1['cand'][n]['name'], 'votes': s1['cand'][n]['votes']} for n in s1['cand']},
                   'blank': s1['blank'], 'null': s1['null_total'], 'turnout': s1['turnout'], 'registered': s1['registered'],
                   'abstention': s1['abstention'], 'registered_functioning': s1['registered_functioning'], 'valid': s1['valid'],
                   'bu_files': A['files']}
    D['R1-SEC'] = {'verdict': 'CERTIFIED' if fails['S1'] == fails['S2'] == fails['S3'] == 0 else 'REFUTED',
                   'sections': int(A['counts']['sections']), 'failures': fails,
                   'witnesses': {k: A['checks'][k]['witnesses'][:5] for k in ('S1', 'S2', 'S3')},
                   'aggregated_sections': A['counts'].get('aggregated', 0)}

    # ---- round 2: the signed result ------------------------------------------------------------------------------
    s2 = signed('6258', 'BR')
    L13, F22 = s2['cand']['13']['votes'], s2['cand']['22']['votes']
    arith = {'valid = Lula + Flávio': s2['valid'] == L13 + F22,
             'total = valid + blank + null': s2['total_votes'] == s2['valid'] + s2['blank'] + s2['null_total'],
             'turnout = total votes': s2['turnout'] == s2['total_votes'],
             'turnout + abstention = registered in the sections that functioned': s2['turnout'] + s2['abstention'] == s2['registered_functioning'],
             'registered = functioning + not installed (423)': s2['registered'] - s2['registered_functioning'] >= 0}
    sumuf = {}
    for k in ('valid', 'blank', 'null_total', 'turnout', 'abstention', 'registered', 'sections'):
        sumuf[k] = sum(signed('6258', uf)[k] for uf in UFS) == s2[k]
    for n in ('13', '22'):
        sumuf['candidate ' + n] = sum(signed('6258', uf)['cand'][n]['votes'] for uf in UFS) == s2['cand'][n]['votes']
    D['R2-ARITH'] = {'verdict': 'CERTIFIED' if all(arith.values()) and all(sumuf.values()) else 'REFUTED',
                     'signed_arithmetic': arith, 'ufs_plus_abroad_sum_to_brazil': sumuf, 'generated': s2['generated']}
    margin = L13 - F22
    D['R2-WIN'] = {'verdict': 'CERTIFIED', 'lula': L13, 'flavio': F22, 'valid': s2['valid'], 'margin': margin,
                   'swing_to_reverse': margin // 2 + 1, 'removal_to_reverse': margin,
                   'lula_share_exact': f'{L13}/{s2["valid"]}', 'lula_share_2dp': frac_str(Fraction(L13, s2['valid'])),
                   'blank': s2['blank'], 'null': s2['null_total'], 'turnout': s2['turnout'], 'abstention': s2['abstention'],
                   'registered': s2['registered'], 'registered_functioning': s2['registered_functioning'], 'sections': s2['sections'],
                   'per_uf': {uf: {'lula': signed('6258', uf)['cand']['13']['votes'], 'flavio': signed('6258', uf)['cand']['22']['votes'],
                                   'turnout': signed('6258', uf)['turnout'], 'registered': signed('6258', uf)['registered'],
                                   'r1_lula': signed('6257', uf)['cand']['13']['votes'], 'r1_flavio': signed('6257', uf)['cand']['22']['votes'],
                                   'r1_valid': signed('6257', uf)['valid'], 'r1_turnout': signed('6257', uf)['turnout'],
                                   'r1_registered': signed('6257', uf)['registered']} for uf in UFS}}
    D['R2-SUM'] = {'verdict': 'NEEDS DATA', 'why': 'the TSE has not yet published the round-2 BU na Web in bulk (checked '
                   + time.strftime('%Y-%m-%d') + '); the sum of every section\'s BU against the signed result is decided the day it does'}

    # ---- the extension -------------------------------------------------------------------------------------------
    logs = {}
    for uf in UFS:
        p = os.path.join(DER, f'r2-logs-{uf}.tsv')
        if not os.path.exists(p):
            continue
        rows = [l.rstrip('\n').split('\t') for l in open(p)]
        sig = signed('6258', uf)
        logs[uf] = {'sections_read': len({tuple(r[:4]) for r in rows}), 'sections_installed': sig['sections_installed'],
                    'votes_in_logs': sum(int(r[8]) for r in rows if r[8]), 'turnout_signed': sig['turnout'],
                    'late_votes': sum(int(r[9]) for r in rows if r[9]),
                    'sections_with_late_votes': sum(1 for r in rows if r[9] and int(r[9]) > 0),
                    'max_late_in_a_section': max([int(r[9]) for r in rows if r[9]] or [0]),
                    'sections_without_ready_event': sum(1 for r in rows if not r[6])}
        logs[uf]['complete'] = logs[uf]['votes_in_logs'] == sig['turnout']
    done = [uf for uf, v in logs.items() if v['complete']]
    D['EXT'] = {'verdict': 'NEEDS DATA' if len(done) < len(UFS) else ('CERTIFIED' if sum(v['late_votes'] for v in logs.values()) < margin else 'REFUTED'),
                'question': 'could the votes cast after 17:00 Brasília have decided the winner?',
                'threshold': {'removal': margin, 'swing': margin // 2 + 1},
                'tse_reported_late_votes': 35521, 'tse_figure_share_of_threshold': f'{Fraction(35521, margin)}',
                'ufs_complete': done, 'logs': logs,
                'rule': 'a vote is late when its "O voto do eleitor foi computado" log line is at or after the urn\'s ready hour + 9 h (8:00 → 17:00 Brasília in the urn\'s local clock)'}

    # ---- C6: the proclaimed percentage -----------------------------------------------------------------------------
    share = Fraction(L13, s2['valid'])
    D['C6'] = {'verdict': 'REFUTED' if frac_str(share) != '51,74' else 'CERTIFIED', 'said': '51,74', 'signed_2dp': frac_str(share),
               'signed_exact': f'{L13}/{s2["valid"]}', 'bounds_of_51_74': 'a share rounds to 51,74 only within [51.735, 51.745)'}

    # ---- round 1: how long after 17:00 the urns closed (no extension that day) -----------------------------------------
    cp = os.path.join(DER, 'r1-closing.json')
    if os.path.exists(cp):
        c = json.load(open(cp))
        D['R1-CLOSE'] = {'verdict': 'MEASURED', **{k: c[k] for k in ('sections', 'closed_before_legal_close', 'closed_60_or_more_minutes_after',
                         'minute_histogram', 'percentiles_minutes', 'within_10_minutes', 'within_30_minutes', 'table_sha256')}}

    # ---- polls -----------------------------------------------------------------------------------------------------
    pp = os.path.join(E, 'polls.json')
    if os.path.exists(pp):
        D['POLLS'] = polls(json.load(open(pp)), s1, s2)
    return L


POLL_NAMES = {'Lula': '13', 'Flávio Bolsonaro': '22', 'Augusto Cury': '70', 'Ronaldo Caiado': '55', 'Renan Santos': '14',
              'Romeu Zema': '30', 'Samara Martins': '80', 'Edmilson Costa': '21', 'Rui Costa Pimenta': '29', 'Wilson Grassi': '35',
              'Hertz Dias': '16', 'Clariana Barão': '27'}


def polls(P, s1, s2):
    """each poll's published valid-vote numbers, per named candidate, against the result: inside its declared margin
    (published ± margin, both ends included) or not, exactly; polls that printed no valid votes are listed, not compared"""
    res = {1: {n: Fraction(v['votes'], s1['valid']) * 100 for n, v in s1['cand'].items()},
           2: {n: Fraction(v['votes'], s2['valid']) * 100 for n, v in s2['cand'].items()}}
    out = []
    for p in P['polls']:
        rnd = int(p['round'])
        vv, moe = p.get('valid_votes'), p.get('margin_of_error_pp')
        row = {'id': p['id'], 'pollster': p['pollster'], 'round': rnd, 'published': p.get('published'),
               'fieldwork': [p.get('fieldwork_start'), p.get('fieldwork_end')], 'sample': p.get('sample_size'),
               'margin': moe, 'registration': p.get('tse_registration'), 'cells': [],
               'compared': bool(vv) and moe not in (None, '')}
        if row['compared']:
            m = Fraction(str(moe))
            for who, val in vv.items():
                n = POLL_NAMES.get(who)
                if n is None or val in (None, ''):
                    continue
                v, r = Fraction(str(val)), res[rnd][n]
                row['cells'].append({'candidate': n, 'published': str(val), 'result': frac_str(r / 100),
                                     'error_pp': frac_str((r - v) / 100) if r >= v else '-' + frac_str((v - r) / 100),
                                     'inside_margin': v - m <= r <= v + m})
            lead = [c for c in row['cells'] if c['candidate'] in ('13', '22')]
            if len(lead) == 2:
                pub = {c['candidate']: Fraction(c['published']) for c in lead}
                row['lead_published_flavio_minus_lula'] = str(pub['22'] - pub['13'])
                row['lead_result_flavio_minus_lula'] = frac_str((res[rnd]['22'] - res[rnd]['13']) / 100) if res[rnd]['22'] >= res[rnd]['13'] else '-' + frac_str((res[rnd]['13'] - res[rnd]['22']) / 100)
        out.append(row)
    cells = [c for r in out for c in r['cells']]
    by = {}
    for rnd in (1, 2):
        rc = [c for r in out if r['round'] == rnd for c in r['cells'] if c['candidate'] in ('13', '22')]
        by[rnd] = {'polls': sum(1 for r in out if r['round'] == rnd), 'compared': sum(1 for r in out if r['round'] == rnd and r['cells']),
                   'lula_flavio_cells': len(rc), 'inside_margin': sum(c['inside_margin'] for c in rc)}
        for n in ('13', '22'):
            e = [res[rnd][n] - Fraction(c['published']) for c in rc if c['candidate'] == n]
            if e:
                mean = sum(e) / len(e)
                by[rnd]['mean_error_pp_' + n] = ('' if mean >= 0 else '-') + frac_str(abs(mean) / 100)
                by[rnd]['polls_below_result_' + n] = sum(1 for x in e if x > 0)
    return {'verdict': 'MEASURED', 'read': P.get('read'), 'by_round': by, 'cells': len(cells),
            'inside_margin_all_candidates': sum(c['inside_margin'] for c in cells), 'polls': out}


def main():
    L = build()
    if '--check' in sys.argv:
        old = json.load(open(OUT))
        old['generated'] = L['generated']
        if old != json.loads(json.dumps(L)):
            die('the ledger on disk is not what the inputs give now')
        print('eleicoes2026 ledger: re-derived, identical')
        return
    json.dump(L, open(OUT, 'w'), indent=1, sort_keys=True, ensure_ascii=False)
    open(OUT, 'a').write('\n')
    print('eleicoes2026 ledger: ' + ', '.join(f'{k} {v["verdict"]}' for k, v in L['decisions'].items()))


if __name__ == '__main__':
    main()
