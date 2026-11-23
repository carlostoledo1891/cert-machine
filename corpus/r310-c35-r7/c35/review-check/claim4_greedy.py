"""Claim 4, context only (not part of the claim): is the 385-set family irredundant as a SET family?
Greedy: walk the 385 sets in a fixed order (orbit by orbit, each orbit sorted); drop a set if the rest still admits no
forbidden triple (lpfam INFEAS). The result is an irredundant sub-family for this order (an upper bound on the
smallest certificate, not the minimum). Stops after a time cap."""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lpcheck_lib import *
R = json.load(open(os.path.join(HERE, 'claim4-orbits-result.json')))
U = R['exact385_infeasible'][0]
order = [m for i in U for m in ORB[i]]
keep = list(order); cap = float(sys.argv[1]) if len(sys.argv) > 1 else 600
t0 = time.time(); tested = 0; maxnodes = 0
for m in order:
    if time.time() - t0 > cap: print('time cap reached'); break
    trial = [x for x in keep if x != m]
    r = run([(0, trial)])[0]; tested += 1; maxnodes = max(maxnodes, r[-1])
    if r[0] == 'INFEAS': keep = trial
    else: assert check_triple(r[1], r[2], r[3], trial)
print(f'tested {tested} of {len(order)}; kept {len(keep)} sets; max nodes {maxnodes}; {time.time()-t0:.0f}s')
done = tested == len(order)
if done:
    # verify irredundancy of the result: every single removal admits a verified triple; the whole is INFEAS
    whole = run([(0, keep)])[0]
    res = run([(0, [x for x in keep if x != m]) for m in keep])
    ok = all(r[0] == 'FEAS' and check_triple(r[1], r[2], r[3], [x for x in keep if x != m]) for r, m in zip(res, keep))
    from collections import Counter
    orbit_of = {m: i for i in U for m in ORB[i]}
    print('final family: INFEAS', whole[0] == 'INFEAS', 'nodes', whole[-1], '; every single removal FEAS with a verified triple:', ok,
          '; sets per orbit', sorted(Counter(orbit_of[m] for m in keep).items()))
    json.dump({'orbits': U, 'kept': keep}, open(os.path.join(HERE, 'claim4-greedy-result.json'), 'w'))
