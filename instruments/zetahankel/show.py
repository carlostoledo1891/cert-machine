import sys,json
for l in sys.stdin:
    d=json.loads(l); print(d['n'], d['h'], 'logP/n2=%.3f'%d['logP_over_n2'], 'content/n2=%.2f'%d['lc_over_n2'], 'delta/n2=%.2f'%d['ld_over_n2'], 'logP=%.1f'%d['logP_at_zeta'], 't=%.1f/%.1f/%.1f'%(d['t_build'],d['t_det'],d['t_eval']), flush=True)
