#!/usr/bin/env node
/* instruments/ledger/replay.js — the SECOND simulator of the ledger replay (2026-10-30), sharing no code with replay.py: the
   same specification (SCHEMA.md), written again in JavaScript — a Set of cells for the tape, the funnel's own chain rule and
   claim constructors (machine/funnel/funnel.js: chainGenesis, hitClaim, recordClaim — the HIT/RECORD semantics in ONE module),
   BigInt rationals for the detection bounds. replay.py runs this program on the same ledger, seed and k and keeps the word
   only when the two decisions are identical.

   usage: node instruments/ledger/replay.js --json <ledger.jsonl> (--full | --seed S --k K)    this simulator's decision, as JSON
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const funnel = require('../../machine/funnel/funnel.js');

const ROOT = path.resolve(__dirname, '..', '..');
const SAFE = Number.MAX_SAFE_INTEGER;
const hex = (s) => crypto.createHash('sha256').update(s).digest('hex');

const vsrc = fs.readFileSync(path.join(ROOT, 'instruments', 'verdict.js'), 'utf8');
const vw = [...vsrc.matchAll(/^const (CERTIFIED|REFUTED|REFUSED) = '([A-Z]+)';/gm)].reduce((a, m) => { a[m[1]] = m[2]; return a; }, {});
if (Object.keys(vw).length !== 3) { process.stderr.write('LEDGER REPLAY (JS) REFUSED TO RUN: verdict.js does not declare the three words\n'); process.exit(2); }
const CERT = vw.CERTIFIED, REFUT = vw.REFUTED, REFUS = vw.REFUSED;

class Refused extends Error {}
class Refuted extends Error { constructor(w) { super(w.why); this.w = w; } }

const isInt = (v) => typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= SAFE;
const keysAre = (o, ks) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).join('\u0000') === ks.join('\u0000');

/* the machine: rows of two cells, each null (halt) or {w, d, q} */
function machine(text) {
  const rows = [];
  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const cells = line.split(/\s+/);
    if (cells.length !== 2) throw new Refused('the machine has a row of ' + cells.length + ' cells');
    rows.push(cells.map((c) => {
      if (c === '---') return null;
      const m = /^([01])([LR])(\d+)$/.exec(c);
      if (!m) throw new Refused('the machine has an unreadable cell ' + c);
      return { w: m[1] === '1', d: m[2] === 'L' ? -1 : 1, q: Number(m[3]) };
    }));
  }
  if (!rows.length) throw new Refused('the machine has no rows');
  if (rows.some((r) => r.some((c) => c && c.q >= rows.length))) throw new Refused('the machine targets a state it does not have');
  return rows;
}

/* steps t0+1..t1 from a configuration; '---' halts at its step, writing nothing */
function simulate(rows, state, head, onesList, t0, t1) {
  const tape = new Set(onesList);
  for (let t = t0 + 1; t <= t1; t++) {
    const cell = rows[state][tape.has(head) ? 1 : 0];
    if (cell === null) return { halted: true, step: t, state, head, tape };
    if (cell.w) tape.add(head); else tape.delete(head);
    head += cell.d;
    state = cell.q;
  }
  return { halted: false, step: t1, state, head, tape };
}

function conf(halted, step, state, head, cells) {
  const sorted = Array.from(cells).sort((a, b) => a - b);
  return { step, halted, state, head, ones: sorted.length, digest: hex(JSON.stringify([halted ? 1 : 0, state, head, sorted])).slice(0, 16) };
}

/* exact rationals for the detection bounds */
const big = (x) => BigInt(x);
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const ratStr = (n, d) => { const g = gcd(n, d) || 1n; n /= g; d /= g; return d === 1n ? String(n) : String(n) + '/' + String(d); };

function bounds(k, K) {
  const out = { oneStretch: ratStr(big(k), big(K)) };
  for (const [fn, fd] of [[1n, 100n], [1n, 10n]]) {
    const num = (fd - fn) ** big(k), den = fd ** big(k); // (1 - f)^k
    out['f=' + fn + '/' + fd] = ratStr(den - num, den);
  }
  return out;
}

function pick(seed, chainHead, k, K) {
  const got = [];
  for (let j = 0; got.length < k; j++) {
    const r = parseInt(hex(seed + ':' + chainHead + ':' + j).slice(0, 13), 16) % K;
    if (!got.includes(r)) got.push(r);
  }
  return got.sort((a, b) => a - b);
}

function decide(file, mode, seed, k) {
  const out = { ledger: path.relative(ROOT, path.resolve(file)), sha256: null, id: null, chainHead: null, machine: null, claim: null, K: null, mode,
    seed: mode === 'sample' ? String(seed) : null, k: null, sample: null, stretches: [], word: REFUS, rule: null, witness: null, detects: null, claimText: null };
  try {
    const raw = fs.readFileSync(file);
    out.sha256 = hex(raw);
    const text = raw.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(raw)) throw new Refused('the ledger is not UTF-8');
    const lines = text.split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (lines.length < 3) throw new Refused('a ledger has a header and at least two checkpoints');
    const objs = lines.map((l, n) => {
      let o;
      try { o = JSON.parse(l); } catch (e) { throw new Refused('line ' + n + ' is not JSON'); }
      if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Refused('line ' + n + ' is not a JSON object');
      return o;
    });
    const hd = objs[0];
    if (!keysAre(hd, ['kind', 'format', 'id', 'machine', 'claim', 'chain']) || hd.kind !== 'ledger' || hd.format !== 1)
      throw new Refused('line 0 is not a format-1 ledger header {kind, format, id, machine, claim, chain}');
    if (typeof hd.id !== 'string' || !hd.id) throw new Refused('the header has no id');
    const mc = hd.machine;
    if (!mc || typeof mc !== 'object' || Array.isArray(mc) || Object.keys(mc).sort().join() !== 'path,sha256' || typeof mc.path !== 'string' || typeof mc.sha256 !== 'string')
      throw new Refused('the header\'s machine is not {path, sha256}');
    const cl = hd.claim;
    const hit = keysAre(cl, ['shape', 'halt']) && cl.shape === 'HIT' && isInt(cl.halt) && cl.halt >= 1;
    const record = keysAre(cl, ['shape', 'box']) && cl.shape === 'RECORD' && Array.isArray(cl.box) && cl.box.length === 2 && cl.box.every(isInt) && cl.box[0] === 1 && cl.box[1] >= 1;
    if (!hit && !record) throw new Refused('a claim from a search is a HIT {shape, halt} or a RECORD {shape, box: [1, N]}; this one is neither');
    const cps = objs.slice(1);
    cps.forEach((c, i) => {
      const ln = 'line ' + (i + 1);
      if (!keysAre(c, ['kind', 'i', 'step', 'halted', 'state', 'head', 'ones', 'chain']) || c.kind !== 'checkpoint') throw new Refused(ln + ' is not a checkpoint {kind, i, step, halted, state, head, ones, chain}');
      if (!(isInt(c.i) && c.i === i)) throw new Refused(ln + ': checkpoints are numbered 0, 1, 2, … in order');
      if (!(isInt(c.step) && isInt(c.state) && isInt(c.head) && typeof c.halted === 'boolean')) throw new Refused(ln + ': step, state and head are integers and halted a boolean');
      if (!Array.isArray(c.ones) || !c.ones.every(isInt) || c.ones.some((x, j) => j && c.ones[j - 1] >= x)) throw new Refused(ln + ': ones is the strictly increasing list of the cells holding 1');
      if (i && c.step <= cps[i - 1].step) throw new Refused(ln + ': the steps do not increase');
      if (c.halted && i !== cps.length - 1) throw new Refused(ln + ': only the last checkpoint may be a halt');
    });
    lines.forEach((l, n) => {
      const o = objs[n];
      const body = Object.assign({}, o); delete body.chain;
      if (typeof o.chain !== 'string' || l !== JSON.stringify(body).slice(0, -1) + ',"chain":"' + o.chain + '"}') throw new Refused('line ' + n + ' is not in the chained-line form (the funnel\'s chainLine)');
    });
    const last = cps[cps.length - 1];
    if (hit && !(last.halted && last.step === cl.halt)) throw new Refused('the HIT claims a halt at step ' + cl.halt + '; the last checkpoint is not that halt');
    if (record && !(!last.halted && last.step === cl.box[1])) throw new Refused('the RECORD names steps 1..' + cl.box[1] + '; the last checkpoint does not close that box');
    out.id = hd.id; out.machine = hd.machine; out.claim = hd.claim;
    const K = cps.length - 1;
    out.K = K;
    const mp = path.join(ROOT, mc.path);
    if (!fs.existsSync(mp) || !fs.statSync(mp).isFile()) throw new Refused('the machine ' + mc.path + ' is not on disk');
    const mb = fs.readFileSync(mp);
    if (hex(mb) !== mc.sha256) throw new Refused('the machine ' + mc.path + ' does not hash to the header\'s sha256');
    const rows = machine(mb.toString('utf8'));
    for (const c of cps) if (!(c.state >= 0 && c.state < rows.length)) throw new Refused('line ' + (c.i + 1) + ': a state the machine does not have');
    // the chain, the funnel's rule: chain_n = sha256(chain_{n-1} + "\n" + the line without its chain), from chainGenesis(id)
    let prev = funnel.chainGenesis(hd.id);
    objs.forEach((o, n) => {
      const body = Object.assign({}, o); delete body.chain;
      const want = funnel.sha256(prev + '\n' + JSON.stringify(body));
      if (o.chain !== want) throw new Refuted({ why: 'the chain breaks', line: n, claimed: o.chain, recomputed: want });
      prev = want;
    });
    out.chainHead = prev;
    const c0 = cps[0];
    if (!(c0.step === 0 && c0.halted === false && c0.state === 0 && c0.head === 0 && c0.ones.length === 0)) throw new Refuted({ why: 'the run does not start from the blank configuration at step 0', line: 1 });
    let sample;
    if (mode === 'full') { sample = Array.from({ length: K }, (_, j) => j); out.k = K; }
    else {
      if (!(isInt(k) && k >= 1 && k <= K)) throw new Refused('k must be an integer in 1..' + K);
      sample = pick(String(seed), prev, k, K); out.k = k;
    }
    out.sample = sample;
    let witness = null;
    for (const j of sample) {
      const a = cps[j], b = cps[j + 1];
      const r = simulate(rows, a.state, a.head, a.ones, a.step, b.step);
      const got = conf(r.halted, r.step, r.state, r.head, r.tape), want = conf(b.halted, b.step, b.state, b.head, b.ones);
      const same = JSON.stringify(got) === JSON.stringify(want);
      out.stretches.push({ j, from: a.step, to: b.step, word: same ? CERT : REFUT });
      if (!same && !witness) witness = { why: 'the replayed stretch does not end at the next checkpoint', stretch: j, line: j + 2, claimed: want, replayed: got };
    }
    if (witness) throw new Refuted(witness);
    const end = hit ? cl.halt : cl.box[1];
    const box = 'steps 1..' + end + ' of ' + mc.path + '@' + mc.sha256.slice(0, 12) + ' from the blank tape';
    if (mode === 'full') {
      out.word = CERT;
      out.claimText = hit ? funnel.hitClaim({ halt: cl.halt }, prev).text
        : funnel.recordClaim(box, { kind: 'full-replay', ledger: out.sha256, chainHead: prev, stretches: K, simulators: ['instruments/ledger/replay.py', 'instruments/ledger/replay.js'] }).text;
    } else {
      out.word = REFUS;
      out.rule = 'a sample is not a proof: ' + k + ' of ' + K + ' stretches replayed exactly, none differs';
      out.detects = bounds(k, K);
      if (record) out.claimText = funnel.recordClaim(box, null).text;
    }
  } catch (e) {
    if (e instanceof Refused) { out.word = REFUS; out.rule = e.message; }
    else if (e instanceof Refuted) { out.word = REFUT; out.witness = e.w; }
    else throw e;
  }
  return out;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null; };
  const file = argv.find((a) => a.endsWith('.jsonl'));
  const full = argv.includes('--full');
  const seed = opt('--seed'), k = opt('--k') === null ? null : Number(opt('--k'));
  if (!argv.includes('--json') || !file || !(full || (seed !== null && k !== null))) { console.log('usage: node instruments/ledger/replay.js --json <ledger.jsonl> (--full | --seed S --k K)'); process.exit(2); }
  console.log(JSON.stringify(decide(file, full ? 'full' : 'sample', seed, k)));
}
module.exports = { decide };
