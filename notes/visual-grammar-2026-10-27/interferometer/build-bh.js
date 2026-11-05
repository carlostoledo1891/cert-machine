const fs = require('fs'), path = require('path');
const P = '/Users/carlostoledo/Projects/cert-machine/playground/interferometer/out/';
const D = JSON.parse(fs.readFileSync(P + 'page-data.json', 'utf8')), SW = JSON.parse(fs.readFileSync(P + 'cp-sweep.json', 'utf8'));
const r6 = a => a.map(x => +x.toPrecision(7));
const out = { meta: D.meta, vis: { u: D.vis.u, v: D.vis.v, amp: D.vis.amp, sig: D.vis.sig, s1: D.vis.s1, s2: D.vis.s2 },
  members: D.members, ceiling: D.ceiling, sweep: SW.rows.map(r => ({ r0: r.r0, ceiling: r.ceiling, witness: r.witness })) };
const t = fs.readFileSync(path.join(__dirname, 'bh-template.html'), 'utf8');
const html = t.replace('__DATA__', JSON.stringify(out).replace(/</g, '\\u003c'));
fs.writeFileSync(path.join(__dirname, 'black-hole-as-a-set.html'), html);
console.log('bytes', html.length);
// check: Avec(add,3) reproduces the record's A
let mx = 0; for (let k = 0; k < D.vis.A.length; k++) { const a = D.vis.amp[k] + 3 * D.vis.sig[k] + D.meta.gain * D.vis.amp[k]; mx = Math.max(mx, Math.abs(a - D.vis.A[k]) / D.vis.A[k]); }
console.log('max rel diff A_add vs record', mx);
