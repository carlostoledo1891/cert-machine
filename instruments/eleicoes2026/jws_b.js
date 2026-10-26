#!/usr/bin/env node
/* instruments/eleicoes2026/jws_b.js — verifier B of the TSE's signed results: Node's own Ed25519 (crypto.verify), no code
   shared with verifier A (jws_a.py). Same two decisions per …-u.jws: the signature verifies under the TSE's JWK, and
   the signed payload is the same JSON the site serves.                                                          MIT */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = process.env.ELEICOES_SIGNED || path.join(__dirname, '..', '..', 'corpus', 'eleicoes2026', 'signed');   // the env: the red control's tampered copy
const JWK = { kty: 'OKP', crv: 'Ed25519', x: 'kWlpNHjuws1csyQZwzn3Fhzbi3RD435RbpThtSr4hMc' };
const KID = 'sNbt9Q_fLS65zE1_ZLNV-XRRwPY';
const key = crypto.createPublicKey({ key: JWK, format: 'jwk' });
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
const out = {};
for (const name of fs.readdirSync(DIR).filter((n) => n.endsWith('.jws')).sort()) {
  const [h, p, s] = fs.readFileSync(path.join(DIR, name), 'utf8').trim().split('.');
  const head = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
  const sig = Buffer.from(s, 'base64url');
  const ok = head.alg === 'EdDSA' && head.kid === KID && crypto.verify(null, Buffer.from(h + '.' + p, 'ascii'), key, sig);
  const served = JSON.parse(fs.readFileSync(path.join(DIR, name.slice(0, -4) + '.json'), 'utf8'));
  const same = JSON.stringify(canon(JSON.parse(Buffer.from(p, 'base64url').toString('utf8')))) === JSON.stringify(canon(served));
  out[name] = { signature: ok, payload_is_served_json: same };
}
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
