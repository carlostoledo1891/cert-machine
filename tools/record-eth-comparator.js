#!/usr/bin/env node
/* record-eth-comparator.js — certs/eth-comparator.json: Lean's own judge, `lake comparator --paranoid` (Lean v4.36.0-rc2:
   Lean's kernel, leanchecker-paranoid, lean4lean, nanoda, con-leche, con-ron), on C1 and C2 of the ETH model-gap lane,
   against challenges written on the pod from cert-machine's pins (tools/runpod-eth-comparator.sh), with claimbox's planted
   changed statements as solutions that must be rejected. The rule, stated once: a claim is CERTIFIED by this judge when the
   challenge on the pod is the pin plus its imports and `sorry` (the pin's sha256 matches), the judge exits 0 with "Your
   solution is okay!" and every one of the six checkers says it accepts; a planted statement must exit non-zero with the
   challenge/solution mismatch named. A control that does not fire refuses the record. Whether the sandbox ran is recorded
   beside the verdict, never hidden.

   Also exports `judged(dir, step)`, the one reading of a comparator step, used by tools/record-eth-chain.js.

   usage: node tools/record-eth-comparator.js <run-dir> */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const KERNELS = ['Lean default', 'Lean paranoid', 'lean4lean', 'nanoda', 'con-leche', 'con-ron'];

function judged(dir, step) {
  const rd = (f) => { const p = path.join(dir, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
  const out = rd(step + '.out'), err = rd(step + '.err'), exit = Number((rd(step + '.exit') || 'NaN').trim());
  const accepted = KERNELS.filter((k) => new RegExp('^' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' kernel accepts the solution$', 'm').test(out));
  const decl = (out.match(/con-leche: accepted (\d+) declarations/) || [])[1];
  return { exit, okay: /^Your solution is okay!$/m.test(out), accepted, declarations: decl ? Number(decl) : null,
    sandbox: (rd(step + '.mode').trim() || 'unknown'), mismatch: (err.match(/error: (?:Const does not match between challenge and target|Challenge and solution theorem statement do not match:) '[^']+'/) || [null])[0],
    sandboxRefusal: /No permissions to create new namespace/.test(rd(step + '.sandbox.err')) };
}
module.exports = { judged, KERNELS };

if (require.main === module) {
  const dir = path.resolve(process.argv[2] || '');
  const die = (m) => { console.error('record-eth-comparator: REFUSED — ' + m); process.exit(1); };
  if (!fs.existsSync(path.join(dir, '_run.json'))) die('no imported run at ' + dir);
  const run = JSON.parse(fs.readFileSync(path.join(dir, '_run.json'), 'utf8'));
  const status = JSON.parse(fs.readFileSync(path.join(dir, '_status.json'), 'utf8'));
  const ch = JSON.parse(fs.readFileSync(path.join(dir, 'P2.out'), 'utf8'));
  const pin = (k) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', k, 'statement.lean'))).digest('hex');
  const fails = [];
  const claims = {};
  for (const [k, step, planted] of [['c1', 'P3', 'P5a'], ['c2', 'P4', 'P5b']]) {
    if (ch.pins[k] !== pin(k)) fails.push(k + ': the pod wrote its challenge from another pin');
    const j = judged(dir, step), p = judged(dir, planted);
    const all = KERNELS.every((x) => j.accepted.includes(x));
    if (!(j.exit === 0 && j.okay && all)) fails.push(k + ': the judge did not accept with all six checkers (' + j.accepted.join(', ') + ')');
    if (!(p.exit !== 0 && p.mismatch)) fails.push(k + ': the planted statement was NOT rejected for a mismatch');
    claims[k] = { verdict: j.exit === 0 && j.okay && all ? 'CERTIFIED' : 'REFUSED', judged: j, challengeSha256: ch[k], pinSha256: ch.pins[k],
      planted: { rejected: p.exit !== 0 && !!p.mismatch, by: p.mismatch, sandbox: p.sandbox } };
  }
  const rec = {
    what: 'Lean\'s own judge, lake comparator --paranoid (six checkers), on C1 and C2 of the ETH model-gap lane, against challenges written from cert-machine\'s statement pins, with the planted changed statements as solutions that must be rejected.',
    generated: new Date().toISOString().slice(0, 10),
    claim: { repo: 'https://github.com/carlostoledo1891/claimbox', commit: status._claimbox, folder: 'lean/eth-bridge', toolchain: 'leanprover/lean4:v4.36.0-rc2' },
    verdict: fails.length ? 'REFUSED' : 'CERTIFIED',
    checkers: KERNELS,
    sandbox: 'The judge\'s sandbox (bubblewrap) could not create a user namespace on RunPod\'s containers, so every step ran with --inadvisably-no-sandbox; the sandbox protects the judge from a hostile build, not the checkers\' arithmetic, and the build here is our own claimbox\'s. The first run (6c6qd1lla7mtt5) stopped there and is recorded as a platform failure.',
    fails, claims,
    run: { id: run.run, auditSha: run.auditSha, host: run.host, startedAt: run.startedAt, finishedAt: run.finishedAt, facts: path.relative(ROOT, dir) },
  };
  fs.writeFileSync(path.join(ROOT, 'certs', 'eth-comparator.json'), JSON.stringify(rec, null, 1) + '\n');
  console.log('certs/eth-comparator.json: ' + rec.verdict + (fails.length ? ' (' + fails.join('; ') + ')' : '') + ' — C1 ' + claims.c1.judged.accepted.length + '/6, C2 ' + claims.c2.judged.accepted.length + '/6; planted rejected: ' + ['c1', 'c2'].filter((k) => claims[k].planted.rejected).join(', '));
}
