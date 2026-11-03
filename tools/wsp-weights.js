#!/usr/bin/env node
/* wsp-weights.js — the Weight-Space Programming edit (Takehi, Teoh, Zhang, Khattab, MIT CSAIL, 2026-11-02: GPT-6 Astra
   edits Qwen3.5-0.8B's weights; "only two tensors differ", "131,072 weights", "0.016% of the model", "one direction
   subtracted from 64 output columns" of down_proj in layers 15 and 19) decided from the bytes of the two checkpoints by two
   implementations that share no code with each other or with the claimants' scripts (make_edit_diff.py, apply_edit.py,
   st_numpy.py: read as text, never run): this file (JavaScript: Buffer, Uint16Array, Math.fround, BigInt rationals) and
   instruments/wsp/weights.py (Python standard library: struct, mmap, array, Fraction). The sub-claims W1–W7 are stated in
   corpus/wsp/claims.json, written before either decider ran; the one-direction witness (W6) is proposed by
   tools/wsp-witness.py (numpy, an SVD — a proposer, no authority) and checked entry by entry by both deciders in binary32
   arithmetic with round-to-nearest-even to bfloat16. Every float here is a dyadic rational, so every count is exact.

   usage: node tools/wsp-weights.js            both deciders, the red controls, the pins → certs/wsp-weights.json (~3 min)
          node tools/wsp-weights.js --check    the battery: the pins re-hashed where the inputs are cached (corpus/wsp/.cache,
                                              2.5 GB, not in git: absent on a fresh clone → the byte decisions are not re-run
                                              and the record's own hashes are checked), the JavaScript decider re-derives every
                                              fact and compares with the record; nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'corpus', 'wsp', '.cache');
const CLAIMS = path.join(ROOT, 'corpus', 'wsp', 'claims.json');
const WITNESS = path.join(ROOT, 'corpus', 'wsp', 'witness.json');
const PINS = path.join(ROOT, 'corpus', 'wsp', 'PINS.json');
const RECORD = path.join(ROOT, 'certs', 'wsp-weights.json');
const BASE = path.join(CACHE, 'base', 'model.safetensors-00001-of-00001.safetensors');
const EDITED = path.join(CACHE, 'edited', 'model.safetensors-00001-of-00001.safetensors');
const PY = path.join(ROOT, 'instruments', 'wsp', 'weights.py');

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const shaFile = (p) => { const h = crypto.createHash('sha256'); const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(1 << 24); let n; while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n)); fs.closeSync(fd); return h.digest('hex'); };

/* ---- the safetensors container: 8 bytes LE header length, the JSON header, the data */
function open(p) {
  const fd = fs.openSync(p, 'r');
  const len = Buffer.alloc(8); fs.readSync(fd, len, 0, 8, 0);
  const n = Number(len.readBigUInt64LE(0));
  const hb = Buffer.alloc(n); fs.readSync(fd, hb, 0, n, 8);
  const header = JSON.parse(hb.toString('utf8'));
  delete header.__metadata__;
  return { fd, header, start: 8 + n, size: fs.fstatSync(fd).size, headerBytes: n };
}
function bytesOf(f, name) {
  const [a, b] = f.header[name].data_offsets;
  const buf = Buffer.alloc(b - a);
  fs.readSync(f.fd, buf, 0, b - a, f.start + a);
  return buf;
}
const numel = (shape) => shape.reduce((p, s) => p * s, 1);

/* ---- binary32 / bfloat16 */
const dv = new DataView(new ArrayBuffer(4));
const f32bits = (x) => { dv.setFloat32(0, x, true); return dv.getUint32(0, true); };
const f32fromBits = (b) => { dv.setUint32(0, b >>> 0, true); return dv.getFloat32(0, true); };
const bf16FromF32Bits = (b) => ((b & 0x7F800000) === 0x7F800000) ? (((b >>> 16) | ((b & 0x7FFFFF) ? 0x40 : 0)) & 0xFFFF) : (((b + 0x7FFF + ((b >>> 16) & 1)) >>> 16) & 0xFFFF);
const bf16ToF32 = (bits) => f32fromBits(bits << 16);
/* value equality across bf16/f32 bit patterns (an exact decision: both are dyadic rationals; ±0 are equal) */
function sameValue(dt0, b0, dt1, b1) {
  const n0 = numelBytes(dt0, b0), n1 = numelBytes(dt1, b1);
  if (n0 !== n1) return false;
  const get = (dt, buf, i) => dt === 'BF16' ? (buf.readUInt16LE(2 * i) << 16) >>> 0 : buf.readUInt32LE(4 * i);
  for (let i = 0; i < n0; i++) {
    const x = get(dt0, b0, i), y = get(dt1, b1, i);
    if (x === y) continue;
    if ((x & 0x7FFFFFFF) === 0 && (y & 0x7FFFFFFF) === 0) continue; // ±0
    return false;
  }
  return true;
}
const numelBytes = (dt, buf) => buf.length / ({ BF16: 2, F16: 2, F32: 4, F64: 8, I64: 8, I32: 4 }[dt] || 1);

/* ---- exact decimal rounding of k/N·100 to dp places, ties to even (BigInt) */
function percentRounded(k, N, dp) {
  const num = BigInt(k) * 100n * 10n ** BigInt(dp), den = BigInt(N);
  let q = num / den; const r = num % den;
  if (2n * r > den || (2n * r === den && q % 2n === 1n)) q += 1n;
  const s = q.toString().padStart(dp + 1, '0');
  return s.slice(0, -dp) + '.' + s.slice(-dp);
}

/* ---- the decider */
function decide(basePath, editedPath, claims, witness, control) {
  const F0 = open(basePath), F1 = open(editedPath);
  const H0 = F0.header, H1 = F1.header;
  const out = { decider: 'tools/wsp-weights.js', control: control || null, facts: {}, verdicts: {} };
  const F = out.facts, V = out.verdicts;
  const names0 = Object.keys(H0).sort(), names1 = Object.keys(H1).sort();
  const set1 = new Set(names1), set0 = new Set(names0);
  const common = names0.filter((n) => set1.has(n));
  const only0 = names0.filter((n) => !set1.has(n)), only1 = names1.filter((n) => !set0.has(n));
  const shapeDiff = common.filter((n) => JSON.stringify(H0[n].shape) !== JSON.stringify(H1[n].shape));
  const dtypeDiff = common.filter((n) => H0[n].dtype !== H1[n].dtype);
  F.tensors = { base: names0.length, edited: names1.length, only_base: only0, only_edited: only1, shape_differs: shapeDiff, dtype_differs: dtypeDiff,
    dtypes_base: [...new Set(names0.map((n) => H0[n].dtype))].sort(), dtypes_edited: [...new Set(names1.map((n) => H1[n].dtype))].sort(),
    bytes_base: F0.size, bytes_edited: F1.size, header_bytes: [F0.headerBytes, F1.headerBytes] };
  V.W1 = (!only0.length && !only1.length && !shapeDiff.length && !dtypeDiff.length) ? 'CERTIFIED' : 'REFUTED';

  const differBytes = [], differValue = [];
  const controlBytes = {};
  for (const n of common) {
    if (JSON.stringify(H0[n].shape) !== JSON.stringify(H1[n].shape)) { differBytes.push(n); differValue.push(n); continue; }
    const b0 = bytesOf(F0, n);
    let b1 = bytesOf(F1, n);
    if (control === 'flip-third' && n === 'model.language_model.layers.3.mlp.up_proj.weight') { b1[100] ^= 0x01; controlBytes[n] = b1; }
    if (H0[n].dtype === H1[n].dtype) {
      if (!b0.equals(b1)) { differBytes.push(n); differValue.push(n); }
    } else {
      differBytes.push(n);
      if (!sameValue(H0[n].dtype, b0, H1[n].dtype, b1)) differValue.push(n);
    }
  }
  F.differ_in_bytes = differBytes; F.differ_in_value = differValue;
  const claimed = [...claims.edited_tensors].sort();
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  V.W2 = (same(differValue, claimed) && same(differBytes, claimed)) ? 'CERTIFIED' : (same(differValue, claimed) ? 'REFUTED-in-bytes, CERTIFIED-in-value' : 'REFUTED');

  const per = {}; let totalChanged = 0;
  for (const n of claims.edited_tensors) {
    if (!set0.has(n) || !set1.has(n) || H0[n].dtype !== 'BF16' || H1[n].dtype !== 'BF16') { per[n] = { error: 'missing or not bfloat16 in both' }; continue; }
    const [rows, cols] = H0[n].shape;
    const b0 = bytesOf(F0, n), b1 = controlBytes[n] || bytesOf(F1, n);
    const a0 = new Uint16Array(b0.buffer, b0.byteOffset, rows * cols);
    let a1 = new Uint16Array(b1.buffer, b1.byteOffset, rows * cols);
    if (control === 'double-delta' && n.endsWith('layers.15.mlp.down_proj.weight')) a1 = doubleDelta(a0, a1);
    const changed = [];
    for (let i = 0; i < rows * cols; i++) if (a0[i] !== a1[i]) changed.push(i);
    const colset = [...new Set(changed.map((i) => i % cols))].sort((x, y) => x - y);
    const rowset = new Set(changed.map((i) => Math.floor(i / cols)));
    per[n] = { shape: [rows, cols], changed_entries: changed.length, changed_columns: colset.length, changed_rows: rowset.size, columns: colset,
      entries_in_those_columns: colset.length * rows, sha256_base: sha256(Buffer.from(a0.buffer, a0.byteOffset, a0.byteLength)),
      sha256_edited: sha256(Buffer.from(a1.buffer, a1.byteOffset, a1.byteLength)), _a0: a0, _a1: a1, _changed: changed };
    totalChanged += changed.length;
  }
  F.per_tensor = Object.fromEntries(Object.entries(per).map(([n, d]) => [n, Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith('_')))]));
  F.changed_entries_total = totalChanged;
  F.entries_in_changed_columns_total = Object.values(per).reduce((s, d) => s + (d.entries_in_those_columns || 0), 0);
  const c3 = claims.changed_entries;
  V.W3 = { printed_131072_as_entries_whose_bits_differ: totalChanged === c3.post ? 'CERTIFIED' : 'REFUTED',
    printed_131072_as_entries_in_the_64_columns: F.entries_in_changed_columns_total === c3.post ? 'CERTIFIED' : 'REFUTED',
    manifest_130188: totalChanged === c3.manifest ? 'CERTIFIED' : 'REFUTED' };
  V.W5 = claims.edited_tensors.every((n) => per[n].columns && same(per[n].columns, [...claims.selected_columns[n]].sort((x, y) => x - y)) && per[n].changed_columns === 64) ? 'CERTIFIED' : 'REFUTED';

  const countAll = names0.reduce((s, n) => s + numel(H0[n].shape), 0);
  const countLm = names0.filter((n) => n.startsWith('model.language_model.')).reduce((s, n) => s + numel(H0[n].shape), 0);
  const countVis = names0.filter((n) => n.startsWith('model.visual.')).reduce((s, n) => s + numel(H0[n].shape), 0);
  const embed = numel(H0['model.language_model.embed_tokens.weight'].shape);
  F.parameters = { all: countAll, language_model: countLm, visual: countVis, other: countAll - countLm - countVis, embed_tokens: embed, language_model_minus_embed: countLm - embed };
  const fr = {};
  for (const [label, N] of [['all', countAll], ['language_model', countLm], ['language_model_minus_embed', countLm - embed], ['nominal_0.8B', 800000000]]) {
    for (const [what, k] of [['131072', 131072], ['changed', totalChanged]]) {
      const g = gcd(BigInt(k), BigInt(N));
      fr[`${what}/${label}`] = { fraction: `${BigInt(k) / g}/${BigInt(N) / g}`, percent: (k / N) * 100, percent_rounded_3dp: percentRounded(k, N, 3) };
    }
  }
  F.fraction = fr;
  F.fraction_rounds_to_printed = Object.fromEntries(Object.entries(fr).map(([k, v]) => [k, v.percent_rounded_3dp === claims.printed_percent]));
  V.W4 = Object.fromEntries(Object.entries(F.fraction_rounds_to_printed).map(([k, v]) => [k, v ? 'CERTIFIED' : 'REFUTED']));

  const sh = {};
  for (const n of claims.edited_tensors) sh[n] = { base_matches_manifest: per[n].sha256_base === claims.sha256[n].base, edited_matches_card: per[n].sha256_edited === claims.sha256[n].edited };
  F.sha256_printed = sh;
  V.W7 = Object.values(sh).every((x) => x.base_matches_manifest && x.edited_matches_card) ? 'CERTIFIED' : 'REFUTED';

  if (witness) {
    const w6 = {};
    for (const n of claims.edited_tensors) {
      const d = per[n];
      if (!d._a0 || !witness[n]) { w6[n] = { verdict: 'REFUSED', reason: 'no witness for this tensor' }; continue; }
      const [rows, cols] = d.shape;
      const u = witness[n].u_f32_bits.map(f32fromBits);
      const wcols = witness[n].columns.map(Number);
      const alpha = witness[n].alpha_f32_bits.map(f32fromBits);
      const mism = []; let checked = 0; let maxSteps = 0; let maxAbs = 0; let maxTarget = 0;
      const key = (b) => b < 0x8000 ? b : 0x8000 - b;
      for (let j = 0; j < wcols.length; j++) {
        const c = wcols[j], ac = alpha[j];
        for (let r = 0; r < rows; r++) {
          const i = r * cols + c;
          const w = bf16ToF32(d._a0[i]);
          const v = Math.fround(w - Math.fround(u[r] * ac));
          checked++;
          const got = bf16FromF32Bits(f32bits(v));
          if (got !== d._a1[i]) { mism.push(i); maxSteps = Math.max(maxSteps, Math.abs(key(got) - key(d._a1[i]))); maxAbs = Math.max(maxAbs, Math.abs(v - bf16ToF32(d._a1[i]))); maxTarget = Math.max(maxTarget, Math.abs(bf16ToF32(d._a1[i]))); }
        }
      }
      const wset = new Set(wcols);
      const outside = d._changed.filter((i) => !wset.has(i % cols)).length;
      const ok = !mism.length && !outside;
      w6[n] = { columns_in_witness: wset.size, entries_checked: checked, mismatches: mism.length, mismatch_max_bf16_steps: maxSteps, mismatch_max_abs_difference: maxAbs, mismatch_max_abs_edited_value: maxTarget, mismatch_indices_first: mism.slice(0, 16), changed_outside_witness_columns: outside,
        verdict: ok ? 'CERTIFIED' : 'REFUSED', reason: ok ? null : `the proposed witness reproduces all but ${mism.length} of ${checked} entries (${outside} changed entries lie outside its columns); a rank-1 form is not refuted by a failed search` };
    }
    F.witness = w6;
    V.W6 = Object.values(w6).every((x) => x.verdict === 'CERTIFIED') ? 'CERTIFIED' : 'REFUSED';
  } else { V.W6 = 'REFUSED'; F.witness = { reason: 'no witness file given' }; }
  fs.closeSync(F0.fd); fs.closeSync(F1.fd);
  return out;
}
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
function doubleDelta(a0, a1) {
  const out = new Uint16Array(a1);
  for (let i = 0; i < a0.length; i++) if (a0[i] !== a1[i]) { const w = bf16ToF32(a0[i]), e = bf16ToF32(a1[i]); out[i] = bf16FromF32Bits(f32bits(Math.fround(w + Math.fround(2 * Math.fround(e - w))))); }
  return out;
}

/* ---- the pins: every cached input */
const PIN_FILES = ['base/model.safetensors-00001-of-00001.safetensors', 'base/config.json', 'base/model.safetensors.index.json',
  'edited/model.safetensors-00001-of-00001.safetensors', 'edited/config.json', 'edited/model.safetensors.index.json', 'edited/README.md', 'edited/LICENSE',
  'edited/eval/samples_base_math500.jsonl', 'edited/eval/samples_edited_math500.jsonl', 'edited/eval/scores_base_math500.json', 'edited/eval/scores_edited_math500.json',
  'math500/test.jsonl', 'qwen-card/README.md',
  'logs/exp8_math/runs/p50c/edit/manifest.json', 'logs/exp8_math/runs/p50c/edit/edit.npz', 'logs/exp8_math/runs/p50c/work_notes/frozen_weights_manifest.json',
  'logs/exp8_math/runs/p50c/final_answer.md', 'logs/exp8_math/README.md', 'logs/exp8_math/eval/RESULTS_excerpt.md',
  'logs/exp8_math/eval/unedited/merged.json', 'logs/exp8_math/eval/p50c/merged.json'];
function pins() {
  const files = {};
  for (const rel of PIN_FILES) { const p = path.join(CACHE, rel); files[rel] = { sha256: shaFile(p), bytes: fs.statSync(p).size }; }
  return { what: 'every input of the Weight-Space Programming verification, fetched 2026-11-02 into corpus/wsp/.cache (not in git; 2.5 GB) at the revisions below',
    sources: { base: { repo: 'Qwen/Qwen3.5-0.8B', revision: '2fc06364715b967f1860aea9cf38778875588b17' },
      edited: { repo: 'RikiyaT/Qwen3.5-0.8B-weight-space-programming', revision: 'd1671a178705bcab7644806d23c535517f35723b' },
      logs: { repo: 'github.com/RikiyaT/lm_understand-logs', commit: '4d09ba6d6a7e891dd8063974dfe81b3d78e3494f' },
      math500: { repo: 'HuggingFaceH4/MATH-500', revision: '6e4ed1a2a79af7d8630a6b768ec859cb5af4d3be' },
      qwen_card: { repo: 'Qwen/Qwen3.5-0.8B', revision: '2fc06364715b967f1860aea9cf38778875588b17', file: 'README.md' } },
    files };
}
function checkPins(p) {
  const bad = [];
  for (const [rel, d] of Object.entries(p.files)) { const f = path.join(CACHE, rel); if (!fs.existsSync(f)) { bad.push(rel + ' (absent)'); continue; } if (shaFile(f) !== d.sha256) bad.push(rel); }
  return bad;
}

const strip = (o) => JSON.parse(JSON.stringify(o));
function pyDecide(args) {
  const r = cp.spawnSync('python3', [PY, BASE, EDITED, CLAIMS, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('python decider failed: ' + r.stderr);
  return JSON.parse(r.stdout);
}
function agree(a, b) {
  /* the two deciders must give the same verdicts and the same counts */
  const diffs = [];
  if (JSON.stringify(a.verdicts) !== JSON.stringify(b.verdicts)) diffs.push('verdicts');
  for (const k of ['differ_in_bytes', 'differ_in_value', 'changed_entries_total', 'entries_in_changed_columns_total', 'parameters', 'sha256_printed', 'fraction_rounds_to_printed'])
    if (JSON.stringify(a.facts[k]) !== JSON.stringify(b.facts[k])) diffs.push(k);
  for (const n of Object.keys(a.facts.per_tensor)) for (const k of ['changed_entries', 'changed_columns', 'changed_rows', 'columns', 'sha256_base', 'sha256_edited'])
    if (JSON.stringify(a.facts.per_tensor[n][k]) !== JSON.stringify(b.facts.per_tensor[n][k])) diffs.push(n + '.' + k);
  if (a.facts.witness && b.facts.witness) for (const n of Object.keys(a.facts.witness)) for (const k of ['mismatches', 'mismatch_max_bf16_steps', 'mismatch_max_abs_difference', 'mismatch_max_abs_edited_value', 'entries_checked', 'changed_outside_witness_columns', 'verdict'])
    if (JSON.stringify(a.facts.witness[n][k]) !== JSON.stringify(b.facts.witness[n][k])) diffs.push('witness.' + n + '.' + k);
  return diffs;
}

function main() {
  const check = process.argv.includes('--check');
  const claims = JSON.parse(fs.readFileSync(CLAIMS, 'utf8'));
  const witness = fs.existsSync(WITNESS) ? JSON.parse(fs.readFileSync(WITNESS, 'utf8')) : null;
  const sources = { js: shaFile(__filename), py: shaFile(PY), claims: shaFile(CLAIMS), witness: witness ? shaFile(WITNESS) : null, proposer: shaFile(path.join(ROOT, 'tools', 'wsp-witness.py')) };
  if (check) {
    const rec = JSON.parse(fs.readFileSync(RECORD, 'utf8'));
    const bad = [];
    for (const k of ['claims', 'witness', 'py']) if (rec.sources[k] !== sources[k]) bad.push('source drift: ' + k);
    if (!fs.existsSync(BASE) || !fs.existsSync(EDITED)) {
      console.log('  inputs not cached (corpus/wsp/.cache absent): the byte decisions are not re-run; the record\'s sources checked' + (bad.length ? ': ' + bad.join(', ') : ''));
      if (bad.length) process.exit(1);
      console.log('PASS  wsp-weights --check (record only)'); return;
    }
    const pinsBad = checkPins(JSON.parse(fs.readFileSync(PINS, 'utf8')));
    if (pinsBad.length) bad.push('pins: ' + pinsBad.join(', '));
    const t0 = Date.now();
    const live = decide(BASE, EDITED, claims, witness, null);
    const d = agree(strip(live), rec.js);
    if (d.length) bad.push('the JavaScript decider disagrees with the record on: ' + d.join(', '));
    for (const c of ['flip-third', 'double-delta']) {
      const lc = decide(BASE, EDITED, claims, witness, c);
      if (JSON.stringify(lc.verdicts) !== JSON.stringify(rec.controls[c].js.verdicts)) bad.push('control ' + c + ' drifted');
    }
    console.log(`  the JavaScript decider re-derived every fact and both controls in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    if (bad.length) { console.log('FAIL  ' + bad.join('\n      ')); process.exit(1); }
    console.log('PASS  wsp-weights --check'); return;
  }
  const t0 = Date.now();
  const P = pins();
  fs.writeFileSync(PINS, JSON.stringify(P, null, 1) + '\n');
  console.log('pins   ' + Object.keys(P.files).length + ' files hashed');
  const js = strip(decide(BASE, EDITED, claims, witness, null));
  console.log('js     ' + JSON.stringify(js.verdicts));
  const py = pyDecide(witness ? [WITNESS] : []);
  console.log('py     ' + JSON.stringify(py.verdicts));
  const diffs = agree(js, py);
  const controls = {};
  for (const c of ['flip-third', 'double-delta']) {
    const cj = strip(decide(BASE, EDITED, claims, witness, c));
    const cpy = pyDecide([...(witness ? [WITNESS] : []), '--control', c]);
    controls[c] = { js: { verdicts: cj.verdicts, differ_in_bytes: cj.facts.differ_in_bytes, changed_entries_total: cj.facts.changed_entries_total, witness: cj.facts.witness },
      py: { verdicts: cpy.verdicts, differ_in_bytes: cpy.facts.differ_in_bytes, changed_entries_total: cpy.facts.changed_entries_total, witness: cpy.facts.witness },
      agree: agree(cj, cpy).length === 0,
      expected: c === 'flip-third' ? 'W2 REFUTED with three tensors differing' : 'W6 REFUSED (the witness fails) and W3/W7 REFUTED on layer 15',
      caught: c === 'flip-third' ? (cj.verdicts.W2 === 'REFUTED' && cj.facts.differ_in_bytes.length === 3) : (cj.verdicts.W6 !== 'CERTIFIED' && cj.verdicts.W7 === 'REFUTED') };
    console.log(`control ${c}: ${controls[c].caught ? 'caught' : 'NOT CAUGHT'} (deciders agree: ${controls[c].agree})`);
  }
  const record = {
    what: 'The Weight-Space Programming edit (Takehi, Teoh, Zhang, Khattab, MIT CSAIL, 2026-11-02) decided from the bytes of Qwen/Qwen3.5-0.8B @ 2fc06364 and RikiyaT/Qwen3.5-0.8B-weight-space-programming @ d1671a17 by two implementations sharing no code (tools/wsp-weights.js, instruments/wsp/weights.py): the tensor sets, which tensors differ in bytes and in value, the bfloat16 entries whose bits differ, their columns against the run\'s own manifest, the fraction of three parameter counts as exact rationals, the printed sha256s, and the one-direction witness checked entry by entry in binary32 arithmetic with round-to-nearest-even to bfloat16; two red controls',
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: Math.round((Date.now() - t0) / 100) / 10,
    node: process.version, python: cp.spawnSync('python3', ['--version'], { encoding: 'utf8' }).stdout.trim().replace('Python ', ''),
    sources, claims, pins: { file: 'corpus/wsp/PINS.json', sha256: shaFile(PINS) },
    deciders_agree: diffs.length === 0, disagreements: diffs,
    verdicts: js.verdicts, js, py, controls,
    /* the proposer's own readings beside its witness (COMPUTED, never decided): the SVD residual, the feasibility
       iterations, and the ratio α_c / (uᵀW[:, c]) per column — the dose of the edit as the bytes show it */
    witness_proposer: witness ? Object.fromEntries(Object.entries(witness).map(([n, w]) => [n, w.proposer])) : null,
  };
  fs.writeFileSync(RECORD, JSON.stringify(record, null, 1) + '\n');
  console.log(`record certs/wsp-weights.json written in ${record.seconds} s; deciders agree: ${record.deciders_agree}${diffs.length ? ' — ' + diffs.join(', ') : ''}`);
}
if (require.main === module) main();
module.exports = { decide };
