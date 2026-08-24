/* funnel.js — THE CERTIFIED FUNNEL MACHINE (runner).
   ENGINE TOOLING — research/_engine/funnel · ships nowhere · mints nothing.

   A funnel INSTANCE is a directory (a probe) holding program.md (briefing,
   loaded nowhere), target.js (the problem adapter — the ONLY authority is its
   certify()), experiments/ (append-only chained records) and best.json (the
   leaderboard, HITs only). Generators live in generators/ beside this file and
   run behind ONE interface, inside a vm context with no fs/process/require —
   the write-fence: a generator's only output is its return value.

   The loop: generate -> validate schema -> score -> screen -> certify
   (survivors only) -> append EVERYTHING to experiments/run-<seed>.jsonl ->
   update best.json (HITs only) -> checkpoint after every batch. Same seed +
   checkpoint => byte-identical continuation (enum / evolve / llm-mock; a real
   LLM call is not replay-deterministic and its records say so).

   ENFORCED RULES (code, not prose):
     R1  nothing reaches best.json without verdict HIT from certify(); screen
         and score have no admit path (admitHit is the only writer and it
         checks the verdict and re-verifies the certificate when the target
         provides recheckCertificate).
     R2  every run BEGINS with the RECALL control (all plantedHits must pass
         screen AND certify HIT, certificates re-checked) — else the run
         REFUSES to start — and ENDS with the REJECT AUDIT (a seeded sample of
         screen-rejects is certified; the measured false-negative count is in
         the run summary, never assumed zero).
     R3  the SCORE BATTERY runs at start: score(knownBad) must rank strictly
         below every planted hit, and score(scaleInflate(c)) must not exceed
         score(c) — target.js declares knownBad and scaleInflate.
     R4  run summaries emit claims ONLY in the two legal shapes: HIT lines
         (witness + certificate ref) and RECORD lines naming the searched box
         and carrying either an exhaustionCertificate or the literal string
         "best known to this search"; the claim constructors refuse any other
         superlative.
   Every experiments line carries sha256(prev-chain + line-content): a forged
   or edited line breaks the chain and resume refuses. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const governor = require('./governor.js');

/* ---------------- utilities ---------------- */

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/* mulberry32 — tiny deterministic PRNG with a serializable 32-bit state */
function makeRng(state0) {
  let s = state0 >>> 0;
  function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return { next, getState: () => s, setState: (v) => { s = v >>> 0; } };
}

function stableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}

function deepClone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

/* ---------------- minimal declarative schema validator ----------------
   Subset of JSON Schema: object/properties/required, array/items/minItems/
   maxItems, integer/number/minimum/maximum, string, boolean, enum. Enough to
   validate candidates and to seed the mock/evolve generators. */
function validateSchema(schema, value, at) {
  const here = at || 'candidate';
  if (!schema || typeof schema !== 'object') return { ok: false, why: here + ': schema missing' };
  if (Array.isArray(schema.enum)) {
    const s = stableStringify(value);
    if (!schema.enum.some(e => stableStringify(e) === s)) return { ok: false, why: here + ': not in enum' };
    return { ok: true };
  }
  switch (schema.type) {
    case 'object': {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return { ok: false, why: here + ': expected object' };
      const props = schema.properties || {};
      for (const k of schema.required || []) {
        if (!(k in value)) return { ok: false, why: here + '.' + k + ': required' };
      }
      for (const k of Object.keys(value)) {
        if (!(k in props)) return { ok: false, why: here + '.' + k + ': unknown property' };
        const r = validateSchema(props[k], value[k], here + '.' + k);
        if (!r.ok) return r;
      }
      return { ok: true };
    }
    case 'array': {
      if (!Array.isArray(value)) return { ok: false, why: here + ': expected array' };
      if (schema.minItems !== undefined && value.length < schema.minItems) return { ok: false, why: here + ': fewer than minItems' };
      if (schema.maxItems !== undefined && value.length > schema.maxItems) return { ok: false, why: here + ': more than maxItems' };
      for (let i = 0; i < value.length; i++) {
        const r = validateSchema(schema.items, value[i], here + '[' + i + ']');
        if (!r.ok) return r;
      }
      return { ok: true };
    }
    case 'integer':
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, why: here + ': expected ' + schema.type };
      if (schema.type === 'integer' && !Number.isInteger(value)) return { ok: false, why: here + ': expected integer' };
      if (schema.minimum !== undefined && value < schema.minimum) return { ok: false, why: here + ': below minimum' };
      if (schema.maximum !== undefined && value > schema.maximum) return { ok: false, why: here + ': above maximum' };
      return { ok: true };
    }
    case 'string':
      return typeof value === 'string' ? { ok: true } : { ok: false, why: here + ': expected string' };
    case 'boolean':
      return typeof value === 'boolean' ? { ok: true } : { ok: false, why: here + ': expected boolean' };
    default:
      return { ok: false, why: here + ': unsupported schema type ' + String(schema.type) };
  }
}

/* ---------------- claims: the two legal shapes (rule R4) ----------------
   QUANTIFIER SHAPE (PROBES.md rule 1): a HIT is existential — witness +
   certificate, absolute, no reference to the search. A RECORD is a
   superlative — the searched box named IN THE CLAIM TEXT, carrying either an
   exhaustionCertificate or the literal downgrade "best known to this search".
   assertClaimless() is the writer's refusal: any superlative outside those
   two constructors throws. */
const SUPERLATIVE_RE = /\b(best|record|largest|smallest|greatest|least|lowest|highest|maximal|minimal|maximum|minimum|optimal|optimum|first(?:-ever)?|unprecedented|new bound|world[- ]class)\b/i;
const DOWNGRADE = 'best known to this search';

function assertClaimless(text) {
  if (SUPERLATIVE_RE.test(text)) {
    throw new Error('claim guard: bare superlative refused outside HIT/RECORD shapes: ' + JSON.stringify(text));
  }
  return text;
}

function hitClaim(witness, certRef) {
  if (!certRef) throw new Error('claim guard: HIT requires a certificate ref');
  return { shape: 'HIT', text: 'HIT witness=' + stableStringify(witness) + ' certificate=sha256:' + certRef };
}

function recordClaim(box, exhaustionCertificate) {
  if (!box) throw new Error('claim guard: RECORD requires the searched box named in the claim');
  if (exhaustionCertificate) {
    return {
      shape: 'RECORD',
      text: 'RECORD box=[' + box + '] exhaustionCertificate=sha256:' + sha256(stableStringify(exhaustionCertificate)),
      exhaustionCertificate
    };
  }
  return { shape: 'RECORD', text: 'RECORD box=[' + box + '] ' + DOWNGRADE };
}

/* ---------------- the two counters, defined ONCE (machine rule 3) ----------------
   The 2026-08-20 board-novelty misread ("the dumb control OUT-ADMITTED the live
   LLM 36:15") happened because these two circulated as if commensurable. The
   session summary prints BOTH, each with its definition attached, and
   checkSessionSummary() refuses a summary that drops either. */
const METRIC_DEFS = {
  certifiedHits: 'count of candidate records in this run whose certify() verdict was HIT — order-independent; includes rediscoveries of objects already on the persistent board',
  admittedHits: 'count of NEW entries this run added to the persistent best.json board — a novelty counter; depends on run order and the board\'s prior contents; never comparable across runs without stating the board state'
};

function checkSessionSummary(sess) {
  if (!sess || sess.kind !== 'session-summary') return { ok: false, why: 'not a session-summary' };
  if (!sess.metrics) return { ok: false, why: 'metrics block missing — counters have no definitions' };
  for (const m of Object.keys(METRIC_DEFS)) {
    if (sess.metrics[m] !== METRIC_DEFS[m]) return { ok: false, why: 'metric ' + m + ' missing or its definition drifted from METRIC_DEFS' };
  }
  for (const side of ['main', 'baseline']) {
    const s = sess[side];
    if (!s) return { ok: false, why: side + ' block missing' };
    if (s.refused) continue; /* a refused baseline is a named absence, not a silent one */
    for (const m of Object.keys(METRIC_DEFS)) {
      if (typeof s[m] !== 'number') return { ok: false, why: side + '.' + m + ' missing — a summary may not print one counter without the other' };
    }
  }
  return { ok: true };
}

/* ---------------- chained jsonl (tamper-evident records) ---------------- */

function chainGenesis(seed) { return sha256('GENESIS:' + String(seed)); }

function chainLine(prevChain, rec) {
  const content = JSON.stringify(rec);                     /* rec has no .chain */
  const chain = sha256(prevChain + '\n' + content);
  const line = content.slice(0, -1) + ',"chain":"' + chain + '"}';
  return { chain, line };
}

/* verify a run file's chain; returns {ok, lines, badLine} */
function verifyChainFile(file, seed) {
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const lines = raw.split('\n').filter(l => l.length > 0);
  let prev = chainGenesis(seed);
  for (let i = 0; i < lines.length; i++) {
    let obj;
    try { obj = JSON.parse(lines[i]); } catch (e) { return { ok: false, lines: i, badLine: i, why: 'unparseable line' }; }
    const claimed = obj.chain;
    delete obj.chain;
    const expect = sha256(prev + '\n' + JSON.stringify(obj));
    if (claimed !== expect) return { ok: false, lines: i, badLine: i, why: 'chain hash mismatch' };
    prev = claimed;
  }
  return { ok: true, lines: lines.length, chainHead: prev };
}

/* ---------------- generator write-fence ----------------
   Generator source is evaluated in a bare vm context: standard ECMAScript
   intrinsics only — no require, no process, no fs, no Buffer, no net. A
   generator that reaches for any of them throws ReferenceError, the run
   aborts with FENCE-VIOLATION, and nothing outside the return value was ever
   writable. (vm is a write-fence for honest-but-wrong code, not a security
   sandbox against a deliberately hostile generator — stated in README.) */
function loadGenerator(genPath, hostBindings) {
  const src = fs.readFileSync(genPath, 'utf8');
  const sandbox = { module: { exports: {} }, exports: {} };
  if (hostBindings) for (const k of Object.keys(hostBindings)) sandbox[k] = hostBindings[k];
  sandbox.exports = sandbox.module.exports;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(src, ctx, { filename: path.basename(genPath) });
  const g = sandbox.module.exports;
  if (!g || typeof g.next !== 'function' || typeof g.init !== 'function' || !g.name) {
    throw new Error('generator ' + genPath + ' must export {name, init(ctx), next(state, rng)}');
  }
  return { gen: g, src };
}

function classifyGeneratorError(e) {
  const msg = String(e && e.message || e);
  if (e instanceof ReferenceError || /is not defined/.test(msg)) {
    return { reason: 'FENCE-VIOLATION', detail: 'generator reached outside the fence: ' + msg };
  }
  return { reason: 'GENERATOR-ERROR', detail: msg };
}

/* ---------------- target adapter ---------------- */

const VERDICTS = new Set(['HIT', 'REJECT', 'REFUSED']);

function loadTarget(targetPath) {
  const t = require(path.resolve(targetPath));
  const need = ['candidateSchema', 'score', 'certify', 'plantedHits', 'knownBad', 'scaleInflate'];
  for (const k of need) {
    if (!(k in t)) throw new Error('target ' + targetPath + ' missing required export: ' + k);
  }
  if (!('screen' in t) && !Array.isArray(t.screens)) {
    throw new Error('target ' + targetPath + ' must export screen(c) or screens[] (the cascade)');
  }
  if (!Array.isArray(t.plantedHits) || t.plantedHits.length === 0) {
    throw new Error('target ' + targetPath + ': plantedHits must be a non-empty array (the recall control needs them)');
  }
  for (const k of ['canonicalKey', 'regionOf']) {
    if (k in t && typeof t[k] !== 'function') {
      throw new Error('target ' + targetPath + ': ' + k + ' must be a function when declared');
    }
  }
  screenStages(t); /* validate the cascade shape now, fail loudly at load */
  return t;
}

/* ---------------- the screen cascade (Phase 4) ----------------
   AlphaEvolve's staged-evaluation move, welded to rule R2: cheap tests first,
   the exact certifier only for survivors of every stage. target.screens =
   [{name, screen(c)}, ...] ordered cheapest-first; a lone target.screen is a
   one-stage cascade named 'screen'. EVERY stage may prune, NO stage can admit
   (R1 unchanged); planted hits must survive the WHOLE cascade (recall), and
   the reject audit certifies samples from every stage's rejects, reported
   per stage. The stage name '(score)' is reserved for the non-finite-score
   gate that precedes the cascade. */
function screenStages(target) {
  if (Array.isArray(target.screens)) {
    if (target.screens.length === 0) throw new Error('cascade: screens[] must not be empty');
    const seen = new Set();
    for (const s of target.screens) {
      if (!s || typeof s.name !== 'string' || s.name.length === 0 || typeof s.screen !== 'function') {
        throw new Error('cascade: every stage needs {name, screen(c)}');
      }
      if (s.name === '(score)') throw new Error('cascade: stage name "(score)" is reserved');
      if (seen.has(s.name)) throw new Error('cascade: duplicate stage name ' + JSON.stringify(s.name));
      seen.add(s.name);
    }
    return target.screens;
  }
  return [{ name: 'screen', screen: (c) => target.screen(c) }];
}

function runCascade(stages, candidate) {
  for (const st of stages) {
    const s = st.screen(candidate);
    if (!s || s.pass !== true) {
      return { pass: false, stage: st.name, why: String((s && s.why) || '') };
    }
  }
  return { pass: true, stage: null, why: '' };
}

function certifyChecked(target, candidate) {
  const v = target.certify(candidate);
  if (!v || !VERDICTS.has(v.verdict)) {
    throw new Error('certify() returned an illegal verdict: ' + stableStringify(v && v.verdict));
  }
  if (v.verdict === 'HIT' && !v.certificate) {
    throw new Error('certify() returned HIT without a certificate');
  }
  return v;
}

/* re-verify a certificate against the target's independent recompute.
   Returns true when no recheck is declared (single-sourced certify — README
   says declare one). */
function recheck(target, candidate, certificate) {
  if (typeof target.recheckCertificate !== 'function') return true;
  return target.recheckCertificate(candidate, certificate) === true;
}

/* ---------------- start-of-run integrity controls (rules R2, R3) ---------------- */

function runStartControls(target) {
  const failures = [];
  const report = {};

  /* R3 — SCORE BATTERY */
  const plantedScores = target.plantedHits.map(p => Number(target.score(p.candidate)));
  const badScore = Number(target.score(target.knownBad));
  const minPlanted = Math.min.apply(null, plantedScores);
  if (!(badScore < minPlanted)) {
    failures.push({ control: 'SCORE-BATTERY', why: 'score(knownBad)=' + badScore + ' does not rank strictly below the lowest planted-hit score ' + minPlanted });
  }
  const scaleProbes = target.plantedHits.map(p => p.candidate).concat([target.knownBad]);
  for (const c of scaleProbes) {
    const s0 = Number(target.score(c));
    const s1 = Number(target.score(target.scaleInflate(c)));
    if (s1 > s0) {
      failures.push({ control: 'SCORE-BATTERY', why: 'scaleInflate raised the score (' + s0 + ' -> ' + s1 + ') for ' + stableStringify(c) + ' — the score is gameable by scale' });
      break;
    }
  }
  report.scoreBattery = { plantedChecked: plantedScores.length, knownBadScore: badScore, pass: !failures.some(f => f.control === 'SCORE-BATTERY') };

  /* R2 — RECALL control: every planted hit must survive the WHOLE screen
     cascade AND certify HIT, and both its stored certificate and the freshly
     returned one must survive the independent recompute. */
  const stages = screenStages(target);
  let recallPass = true;
  for (const p of target.plantedHits) {
    const sc = runCascade(stages, p.candidate);
    if (!sc.pass) {
      failures.push({ control: 'RECALL', why: 'planted hit ' + stableStringify(p.candidate) + ' rejected by cascade stage ' + JSON.stringify(sc.stage) + ' (' + (sc.why || 'no reason') + ')' });
      recallPass = false;
      continue;
    }
    let v;
    try { v = certifyChecked(target, p.candidate); } catch (e) {
      failures.push({ control: 'RECALL', why: 'certify threw on planted hit: ' + e.message });
      recallPass = false;
      continue;
    }
    if (v.verdict !== 'HIT') {
      failures.push({ control: 'RECALL', why: 'planted hit ' + stableStringify(p.candidate) + ' did not certify HIT (' + v.verdict + ')' });
      recallPass = false;
      continue;
    }
    if (!recheck(target, p.candidate, v.certificate)) {
      failures.push({ control: 'CERTIFIER-INTEGRITY', why: 'independent recompute rejected the certificate certify() returned for planted hit ' + stableStringify(p.candidate) });
      recallPass = false;
      continue;
    }
    if (p.certificate && !recheck(target, p.candidate, p.certificate)) {
      failures.push({ control: 'CERTIFIER-INTEGRITY', why: 'independent recompute rejected the STORED certificate of planted hit ' + stableStringify(p.candidate) });
      recallPass = false;
    }
  }
  report.recall = { planted: target.plantedHits.length, pass: recallPass };

  /* certifier negative control: certify(knownBad) must not be HIT; if a
     sabotaged certify() admits it, the certificate re-check catches the forgery. */
  let negPass = true;
  try {
    const nv = certifyChecked(target, target.knownBad);
    if (nv.verdict === 'HIT') {
      negPass = false;
      if (!recheck(target, target.knownBad, nv.certificate)) {
        failures.push({ control: 'CERTIFIER-INTEGRITY', why: 'certify() admitted knownBad with a certificate the independent recompute rejects — sabotaged or broken certifier' });
      } else {
        failures.push({ control: 'TARGET-DECLARATION', why: 'certify() admitted knownBad and the recompute agrees — knownBad is misdeclared' });
      }
    }
  } catch (e) {
    negPass = false;
    failures.push({ control: 'CERTIFIER-INTEGRITY', why: 'certify threw on knownBad: ' + e.message });
  }
  report.certifierNegative = { pass: negPass };

  return { ok: failures.length === 0, failures, report };
}

/* ---------------- harness sha ---------------- */

function harnessSha(targetPath, generatorSrc) {
  const t = fs.readFileSync(path.resolve(targetPath), 'utf8');
  const f = fs.readFileSync(__filename, 'utf8');
  return sha256(t + ' ' + f + ' ' + generatorSrc);
}

/* ---------------- atomic writes ---------------- */

function writeAtomic(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

/* ---------------- leaderboard (rule R1: admitHit is the ONLY writer) ----------------
   PHASE-3 BOARD (2026-08-20, from the machines-scout read):
   - CANONICAL KEY: target.canonicalKey(c) (optional) collapses representations
     of the same object — the chowla campaign's 12/50 permutation duplicates
     were exactly this gap. Default: stableStringify (today's behavior).
   - REGIONS: target.regionOf(c) (optional) keys champions per region of the
     search space (MAP-Elites-lite) — one basin can no longer crowd the whole
     board, operationalizing the measured "box placement dominated engine
     choice". No regionOf => one region with the classic 50-slot cap.
   - MUTE ARCHIVE (Graffiti's mute file, 1991): a board entry is never silently
     deleted. Displaced or superseded entries move to mute.json with the reason
     and the displacer, "stored separately in case the new conjecture will be
     refuted in the future". The old saveBest truncated past 50 silently; that
     drop is gone. */

function candidateKey(target, candidate) {
  if (typeof target.canonicalKey === 'function') return String(target.canonicalKey(candidate));
  return stableStringify(candidate);
}

function candidateRegion(target, candidate) {
  if (typeof target.regionOf === 'function') return String(target.regionOf(candidate));
  return '';
}

function loadBest(bestPath) {
  if (!fs.existsSync(bestPath)) return [];
  return JSON.parse(fs.readFileSync(bestPath, 'utf8')).entries || [];
}

function loadMute(mutePath) {
  if (!fs.existsSync(mutePath)) return [];
  return JSON.parse(fs.readFileSync(mutePath, 'utf8')).entries || [];
}

function saveBest(bestPath, instanceName, entries) {
  entries.sort((a, b) => (b.score - a.score) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const out = { kind: 'leaderboard', instance: instanceName, note: 'HITs only — every entry passed certify() and, where declared, recheckCertificate(). Score orders, never admits. Displaced entries are in mute.json, never deleted.', entries };
  writeAtomic(bestPath, JSON.stringify(out, null, 2) + '\n');
}

function saveMute(mutePath, instanceName, entries) {
  if (entries.length === 0 && !fs.existsSync(mutePath)) return; /* no archive, no file — resume byte-identity */
  const out = { kind: 'mute-archive', instance: instanceName, note: 'board entries displaced or superseded, kept revivable (Graffiti\'s mute file): nothing admitted is ever silently deleted.', entries };
  writeAtomic(mutePath, JSON.stringify(out, null, 2) + '\n');
}

/* the single admission gate. Throws CERTIFIER-INTEGRITY on recheck failure.
   Returns {admitted, board} where board names what happened:
   'admitted' | 'canonical-duplicate' | 'refused-region-floor'.
   A better-scoring instance of an already-boarded canonical object improves
   the entry IN PLACE (the superseded version goes to mute; the entry keeps the
   discoverer's runSeed, so new-to-board counting is unmoved). */
function admitHit(board, target, candidate, score, verdict, runSeed, ordinal, via) {
  if (verdict.verdict !== 'HIT') throw new Error('admitHit called without a HIT verdict — rule R1 violation in the runner itself');
  if (!recheck(target, candidate, verdict.certificate)) {
    const err = new Error('independent recompute rejected the certificate for ' + stableStringify(candidate));
    err.funnelReason = 'CERTIFIER-INTEGRITY';
    throw err;
  }
  const key = candidateKey(target, candidate);
  const region = candidateRegion(target, candidate);
  const existing = board.entries.find(e => e.key === key);
  if (existing) {
    if (score > existing.score) {
      board.mute.push({
        reason: 'superseded-by-better-instance', key,
        supersededAtOrdinal: ordinal, supersededByRunSeed: runSeed,
        entry: JSON.parse(JSON.stringify(existing))
      });
      existing.candidate = candidate;
      existing.score = score;
      existing.certificate = verdict.certificate;
      existing.certRef = sha256(stableStringify(verdict.certificate));
      existing.improvedBy = { runSeed, ordinal, via: via || 'main-loop' };
    }
    return { admitted: false, board: 'canonical-duplicate' };
  }
  const inRegion = board.entries.filter(e => (e.region || '') === region);
  if (inRegion.length >= board.regionCap) {
    let worst = inRegion[0];
    for (const e of inRegion) {
      if (e.score < worst.score || (e.score === worst.score && e.key > worst.key)) worst = e;
    }
    if (!(score > worst.score)) return { admitted: false, board: 'refused-region-floor' };
    board.mute.push({
      reason: 'region-floor-displaced', region, key: worst.key,
      displacedAtOrdinal: ordinal, displacedByKey: key,
      entry: JSON.parse(JSON.stringify(worst))
    });
    board.entries.splice(board.entries.indexOf(worst), 1);
  }
  board.entries.push({
    key, region, candidate, score,
    certificate: verdict.certificate,
    certRef: sha256(stableStringify(verdict.certificate)),
    runSeed, ordinal,
    via: via || 'main-loop'
  });
  return { admitted: true, board: 'admitted' };
}

/* ---------------- the runner ---------------- */

async function runFunnel(instanceDir, opts) {
  const o = opts || {};
  if (o.seed === undefined) throw new Error('runFunnel: seed is required');
  const seed = String(o.seed);
  const generatorName = o.generator || 'enum';
  const batchSize = o.batchSize || 32;
  const decades = o.decades || [2];
  const rejectAuditRate = o.rejectAuditRate === undefined ? 0.05 : o.rejectAuditRate;
  const wallClockMs = o.wallClockMs === undefined ? 10 * 60 * 1000 : o.wallClockMs;
  const log = o.log || (o.quiet ? () => {} : (m) => console.log(m));
  const env = o.env === undefined ? process.env : o.env;

  const expDir = path.join(instanceDir, 'experiments');
  fs.mkdirSync(expDir, { recursive: true });
  const runPath = path.join(expDir, 'run-' + seed + '.jsonl');
  const ckPath = path.join(expDir, 'checkpoint-' + seed + '.json');
  const bestPath = path.join(instanceDir, 'best.json');
  const instanceName = path.basename(instanceDir);

  const targetPath = o.targetPath || path.join(instanceDir, 'target.js');
  const target = loadTarget(targetPath);
  const stages = screenStages(target);

  /* statement spec (Phase 5): one pinned source for what is being searched.
     A disagreement between statement.json and the target's exports refuses
     the run before anything else — certifying the wrong statement is the
     defect class this kills. */
  const st = loadStatement(instanceDir, o);
  const stBad = statementMismatches(st, target);
  if (stBad.length) {
    return { refused: { reason: 'STATEMENT-MISMATCH', failures: stBad } };
  }

  /* generator + fence */
  const generatorPath = o.generatorPath || path.join(__dirname, 'generators', generatorName + '.js');
  const hostBindings = {};
  let llmMock = false;
  let llmSeq = 0;
  let llmHost = null;
  const fetchFn = o.fetch !== undefined ? o.fetch : (typeof fetch === 'function' ? fetch : null);
  if (generatorName === 'llm' && !o.generatorPath) {
    const hostSide = require(generatorPath);
    const host = hostSide.makeHostCall(env, fetchFn, (entry) => {
      fs.appendFileSync(path.join(expDir, 'llm-log.jsonl'), JSON.stringify({ seq: llmSeq++, ...entry }) + '\n');
    }, sha256);
    llmMock = !host.available;
    llmHost = host;
    hostBindings.__llm = { available: host.available, call: host.call };
  }
  const loaded = loadGenerator(generatorPath, hostBindings);
  const gen = loaded.gen;
  const hSha = harnessSha(targetPath, loaded.src);

  /* start-of-run integrity controls — a run that fails them never starts and
     writes nothing (rules R2 + R3). Re-run on resume too: the controls are
     cheap and a target that mutated since the checkpoint must not continue. */
  const controls = runStartControls(target);
  if (!controls.ok) {
    return { refused: { reason: [...new Set(controls.failures.map(f => f.control))].join('+'), failures: controls.failures } };
  }

  /* resume / fresh */
  let ordinal = 0, batches = 0, lines = 0, chainHead = chainGenesis(seed);
  const rng = makeRng(fnv1a(seed));
  let genState = null;
  let generatorDone = false;
  let lastAdmitOrdinal = 0;
  const mutePath = path.join(instanceDir, 'mute.json');
  const board = {
    entries: loadBest(bestPath),
    mute: loadMute(mutePath),
    regionCap: (typeof target.regionOf === 'function') ? (o.regionCap || 8) : (o.boardCap || 50)
  };
  let resumed = false;

  const genCtx = { schema: deepClone(target.candidateSchema), enumSpec: deepClone(target.enumSpec || null), llmAvailable: !!(hostBindings.__llm && hostBindings.__llm.available) };

  if (fs.existsSync(ckPath)) {
    const ck = JSON.parse(fs.readFileSync(ckPath, 'utf8'));
    if (ck.seed !== seed || ck.generator !== generatorName) {
      return { refused: { reason: 'CHECKPOINT-MISMATCH', failures: [{ control: 'CHECKPOINT', why: 'checkpoint belongs to a different seed/generator' }] } };
    }
    if (!ck.complete) {
      /* keep exactly the checkpointed prefix (a mid-batch kill may have torn or
         extra lines beyond it), then verify the chain of what remains */
      const raw = fs.existsSync(runPath) ? fs.readFileSync(runPath, 'utf8') : '';
      const fileLines = raw.split('\n').filter(l => l.length > 0);
      if (fileLines.length < ck.lines) {
        return { refused: { reason: 'CHAIN-BROKEN', failures: [{ control: 'CHAIN', why: 'run file shorter than checkpoint records' }] } };
      }
      if (fileLines.length > ck.lines) {
        writeAtomic(runPath, fileLines.slice(0, ck.lines).join('\n') + (ck.lines ? '\n' : ''));
      }
      const vf = verifyChainFile(runPath, seed);
      if (!vf.ok || vf.chainHead !== ck.chainHead) {
        return { refused: { reason: 'CHAIN-BROKEN', failures: [{ control: 'CHAIN', why: vf.ok ? 'chain head does not match checkpoint' : ('chain hash mismatch at line ' + vf.badLine) }] } };
      }
      ordinal = ck.ordinal; batches = ck.batches; lines = ck.lines; chainHead = ck.chainHead;
      rng.setState(ck.rngState);
      genState = ck.generatorState;
      generatorDone = ck.generatorDone || false;
      lastAdmitOrdinal = ck.lastAdmitOrdinal || 0;
      resumed = true;
    } else {
      /* run already complete — idempotent: only the baseline/session step may be owed */
      const result = { summary: readLastSummary(runPath), resumedComplete: true };
      await maybeBaseline(result);
      return result;
    }
  } else if (fs.existsSync(runPath)) {
    return { refused: { reason: 'RUN-FILE-EXISTS', failures: [{ control: 'COLLISION', why: 'run file exists with no checkpoint — refusing to overwrite a record' }] } };
  }

  function appendRec(rec) {
    const { chain, line } = chainLine(chainHead, rec);
    fs.appendFileSync(runPath, line + '\n');
    chainHead = chain;
    lines++;
  }

  function saveCk(complete) {
    writeAtomic(ckPath, JSON.stringify({
      kind: 'checkpoint', seed, generator: generatorName, complete: !!complete,
      ordinal, batches, lines, chainHead,
      rngState: rng.getState(), generatorState: genState, generatorDone,
      lastAdmitOrdinal
    }, null, 2) + '\n');
  }

  if (!resumed) {
    appendRec(Object.assign({
      kind: 'run-header', instance: instanceName, seed, generator: gen.name, mock: llmMock,
      harnessSha: hSha,
      config: { batchSize, decades, rejectAuditRate, maxCandidates: o.maxCandidates || null },
      controls: controls.report
    }, st ? { statement: st.spec.statement, statementSha: st.sha } : {}));
    genState = null;
  }

  if (genState === null) {
    genState = deepClone(gen.init(deepClone(genCtx)));
  }

  const gov = governor.makeGovernor({ decades, wallClockMs, maxCandidates: o.maxCandidates || null, bingoDry: o.bingoDry || null });
  const t0 = Date.now();
  const recent = [];
  const rngFn = () => rng.next();
  let stopReason = null;
  let aborted = null;
  let done = generatorDone;

  while (!done && !aborted) {
    for (let i = 0; i < batchSize; i++) {
      const check = gov.check(ordinal, Date.now() - t0, ordinal - lastAdmitOrdinal);
      if (check.stop) { stopReason = check.reason; done = true; break; }
      const boundary = gov.atBoundary(ordinal);
      if (boundary !== null) {
        log('[governor] decade 10^' + boundary + ' reached at ordinal ' + ordinal + ' — hits so far: ' + board.entries.filter(e => e.runSeed === seed).length + ' (continuing: next decade pre-authorized)');
      }

      /* generate — inside the fence */
      const callState = Object.assign(deepClone(genState), {
        leaderboard: board.entries.slice(0, 10).map(e => ({ candidate: deepClone(e.candidate), score: e.score })),
        recent: recent.slice(-8)
      });
      const llmSeqBefore = llmSeq;
      let out;
      try {
        out = await Promise.resolve(gen.next(callState, rngFn));
      } catch (e) {
        const c = classifyGeneratorError(e);
        appendRec({ kind: 'abort', reason: c.reason, detail: c.detail, atOrdinal: ordinal });
        aborted = c;
        break;
      }
      if (!out || out.done || out.candidate === null || out.candidate === undefined) {
        generatorDone = true;
        done = true;
        /* carry any final state so resume stays deterministic */
        if (out && out.state) {
          const st = deepClone(out.state);
          delete st.leaderboard; delete st.recent;
          genState = st;
        }
        break;
      }
      let candidate, nextState;
      try {
        candidate = deepClone(out.candidate);
        nextState = deepClone(out.state || {});
      } catch (e) {
        appendRec({ kind: 'abort', reason: 'GENERATOR-STATE', detail: 'candidate/state not JSON-serializable: ' + e.message, atOrdinal: ordinal });
        aborted = { reason: 'GENERATOR-STATE', detail: e.message };
        break;
      }
      delete nextState.leaderboard;
      delete nextState.recent;
      genState = nextState;
      ordinal++;
      const hypothesis = String(out.hypothesis || '(none)').split('\n')[0];
      const mock = !!out.mock || llmMock && gen.name === 'llm';

      /* validate schema */
      const sv = validateSchema(target.candidateSchema, candidate);
      let score = null, screen = { pass: false, stage: null, why: 'schema invalid: ' + (sv.why || '') }, certOut = null, admitted = false, boardOutcome = null;
      if (sv.ok) {
        /* score — float, steering only */
        score = Number(target.score(candidate));
        if (!Number.isFinite(score)) {
          screen = { pass: false, stage: '(score)', why: 'non-finite score' };
        } else {
          /* the screen cascade — cheap float prunes, cheapest first. May prune, never admit. */
          screen = runCascade(stages, candidate);
        }
        if (screen.pass) {
          /* certify — the ONLY authority */
          let v;
          try {
            v = certifyChecked(target, candidate);
          } catch (e) {
            appendRec({ kind: 'abort', reason: 'CERTIFIER-ERROR', detail: e.message, atOrdinal: ordinal });
            aborted = { reason: 'CERTIFIER-ERROR', detail: e.message };
            break;
          }
          certOut = { verdict: v.verdict, why: String(v.why || ''), certRef: v.certificate ? sha256(stableStringify(v.certificate)) : null };
          if (v.verdict === 'HIT') {
            let adm;
            try {
              adm = admitHit(board, target, candidate, score, v, seed, ordinal, 'main-loop');
            } catch (e) {
              appendRec({ kind: 'abort', reason: e.funnelReason || 'CERTIFIER-INTEGRITY', detail: e.message, atOrdinal: ordinal });
              aborted = { reason: e.funnelReason || 'CERTIFIER-INTEGRITY', detail: e.message };
              break;
            }
            /* admitted now means what METRIC_DEFS says it means: NEW to the board.
               A duplicate or floor-refused HIT is still a certified HIT (certVerdict
               says so); boardOutcome names what the board did with it. */
            admitted = adm.admitted;
            boardOutcome = adm.board;
            if (adm.admitted) lastAdmitOrdinal = ordinal;
          }
        }
      }

      /* promptSha — chain the exact prompt to the candidate it produced (the
         steering variable as a recorded experimental input). Live llm only:
         null for mock draws and for every other generator. */
      const promptSha = (gen.name === 'llm' && !mock && llmHost && llmSeq > llmSeqBefore && typeof llmHost.lastPromptSha === 'function')
        ? llmHost.lastPromptSha() : null;

      appendRec({
        kind: 'candidate', ordinal, seed, generator: gen.name, mock,
        hypothesis, candidate,
        schemaValid: sv.ok, score,
        screenVerdict: screen,
        certVerdict: certOut,
        admitted,
        board: boardOutcome,
        promptSha,
        harnessSha: hSha
      });
      /* the failure side-channel (Phase 4): the certifier and the cascade know
         WHY a candidate died; the next generator call sees it instead of the
         machine throwing that information away. Capped so prompts stay small. */
      const failWhy = screen.pass
        ? (certOut && certOut.verdict !== 'HIT' ? ('certify: ' + certOut.why).slice(0, 160) : null)
        : ('screen[' + (screen.stage || '') + ']: ' + screen.why).slice(0, 160);
      recent.push({ candidate, score, screenPass: screen.pass, certVerdict: certOut ? certOut.verdict : null, why: failWhy });
      if (recent.length > 8) recent.shift();
    }

    batches++;
    saveBest(bestPath, instanceName, board.entries);
    saveMute(mutePath, instanceName, board.mute);
    saveCk(false);

    if (o.stopAfterBatches && batches >= o.stopAfterBatches && !done && !aborted) {
      /* simulated kill: checkpoint written, run NOT complete */
      return { stopped: 'batches', batches, ordinal };
    }
  }

  if (aborted) {
    saveBest(bestPath, instanceName, board.entries);
    saveMute(mutePath, instanceName, board.mute);
    saveCk(false);
    return { aborted };
  }

  if (!stopReason) stopReason = generatorDone ? 'generator exhausted' : 'stopped';

  /* ---------------- REJECT AUDIT (rule R2, closing half) ----------------
     Re-derive the screen-reject population from the run file itself (uniform
     across resume), sample with a dedicated seeded rng, certify each sample.
     Certified HITs among the rejects are measured false negatives — reported,
     and admitted (they hold certificates; rule R1 is satisfied). */
  const fileRecs = fs.readFileSync(runPath, 'utf8').split('\n').filter(l => l).map(l => JSON.parse(l));
  const rejects = fileRecs.filter(r => r.kind === 'candidate' && r.schemaValid && r.screenVerdict && r.screenVerdict.pass === false);
  const auditRng = makeRng(fnv1a(seed + ':reject-audit'));
  const wantN = Math.min(rejects.length, Math.max(rejects.length > 0 ? 1 : 0, Math.floor(rejects.length * rejectAuditRate)));
  const idx = rejects.map((_, i) => i);
  /* Fisher-Yates prefix — deterministic sample of wantN indices */
  for (let i = 0; i < wantN; i++) {
    const j = i + Math.floor(auditRng.next() * (idx.length - i));
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }
  let falseNegatives = 0, auditAdmitted = 0;
  const auditSamples = [];
  for (let i = 0; i < wantN; i++) {
    const r = rejects[idx[i]];
    let v;
    try { v = certifyChecked(target, r.candidate); } catch (e) {
      auditSamples.push({ ordinal: r.ordinal, verdict: 'CERTIFIER-ERROR' });
      continue;
    }
    auditSamples.push({ ordinal: r.ordinal, verdict: v.verdict, stage: (r.screenVerdict && r.screenVerdict.stage) || 'screen' });
    if (v.verdict === 'HIT') {
      falseNegatives++;
      try {
        if (admitHit(board, target, r.candidate, r.score, v, seed, r.ordinal, 'reject-audit').admitted) auditAdmitted++;
      } catch (e) {
        appendRec({ kind: 'abort', reason: e.funnelReason || 'CERTIFIER-INTEGRITY', detail: e.message, atOrdinal: r.ordinal });
        saveBest(bestPath, instanceName, board.entries);
        saveMute(mutePath, instanceName, board.mute);
        saveCk(false);
        return { aborted: { reason: e.funnelReason || 'CERTIFIER-INTEGRITY', detail: e.message } };
      }
    }
  }

  /* ---------------- summary (rule R4: two legal claim shapes only) ---------------- */
  const candRecs = fileRecs.filter(r => r.kind === 'candidate');
  const counts = {
    generated: candRecs.length,
    schemaInvalid: candRecs.filter(r => !r.schemaValid).length,
    screenPassed: candRecs.filter(r => r.screenVerdict && r.screenVerdict.pass).length,
    screenRejected: rejects.length,
    certified: {
      HIT: candRecs.filter(r => r.certVerdict && r.certVerdict.verdict === 'HIT').length,
      REJECT: candRecs.filter(r => r.certVerdict && r.certVerdict.verdict === 'REJECT').length,
      REFUSED: candRecs.filter(r => r.certVerdict && r.certVerdict.verdict === 'REFUSED').length
    }
  };

  /* ---------------- cascade conservation (Phase 4) ----------------
     candidates in = rejected + passed AT EVERY STAGE, re-derived from the run
     records and checked before the summary is written — a broken identity is
     a runner bug and the summary must not exist. Same habit as the sweep
     engines' exact conservation identities, applied to the funnel itself. */
  const scoreGateRejected = candRecs.filter(r => r.screenVerdict && r.screenVerdict.stage === '(score)').length;
  const rejectedByStage = {};
  for (const st of stages) {
    rejectedByStage[st.name] = candRecs.filter(r => r.schemaValid && r.screenVerdict && r.screenVerdict.pass === false && r.screenVerdict.stage === st.name).length;
  }
  const cascadeRows = [];
  let flowing = counts.generated - counts.schemaInvalid - scoreGateRejected;
  for (const st of stages) {
    const rejected = rejectedByStage[st.name];
    cascadeRows.push({ stage: st.name, in: flowing, rejected, passed: flowing - rejected });
    flowing -= rejected;
  }
  if (flowing !== counts.screenPassed) {
    throw new Error('cascade conservation identity broken: final passed ' + flowing + ' !== screenPassed ' + counts.screenPassed + ' — runner bug, summary refused');
  }
  const auditByStage = {};
  for (const st of stages) {
    const pop = rejectedByStage[st.name];
    const samples = auditSamples.filter(a => a.stage === st.name);
    auditByStage[st.name] = { population: pop, sampled: samples.length, falseNegatives: samples.filter(a => a.verdict === 'HIT').length };
  }
  const myHits = board.entries.filter(e => e.runSeed === seed);
  const claims = myHits.map(e => hitClaim(e.candidate, e.certRef));

  const boxDesc = describeBox(target, gen.name, counts.generated, generatorDone);
  let exhaustionCertificate = null;
  if (generatorDone && rejectAuditRate >= 1 && counts.schemaInvalid === 0 && counts.certified.REFUSED === 0 && wantN === rejects.length) {
    /* the whole declared box was enumerated AND every screen-reject was
       certified in the audit — every candidate in the box carries a verdict,
       so completeness of the hit census is earned, not asserted */
    exhaustionCertificate = {
      kind: 'complete-enumeration-census',
      box: boxDesc,
      candidates: counts.generated,
      allCertifiedOrAudited: true,
      hits: myHits.length
    };
  }
  claims.push(recordClaim(boxDesc, exhaustionCertificate));
  if (st) {
    for (const c of claims) { c.statementSha = st.sha; c.text += ' statement=sha256:' + st.sha; }
  }
  /* free-text notes pass the claimless guard — a bare superlative here throws */
  const notes = [assertClaimless('search stopped: ' + stopReason)];

  const summary = {
    kind: 'run-summary', seed, generator: gen.name, mock: llmMock,
    counts,
    cascade: {
      note: 'conservation checked at write: in = rejected + passed at every stage; "(score)" is the non-finite-score gate before stage 1',
      preScreen: { generated: counts.generated, schemaInvalid: counts.schemaInvalid, scoreGateRejected },
      stages: cascadeRows
    },
    admitted: myHits.length,
    rejectAudit: { population: rejects.length, sampled: wantN, rate: rejectAuditRate, falseNegatives, admittedViaAudit: auditAdmitted, byStage: auditByStage, samples: auditSamples },
    governor: { stopReason, decades },
    generatorExhausted: generatorDone,
    claims, notes,
    harnessSha: hSha
  };
  appendRec(summary);
  saveBest(bestPath, instanceName, board.entries);
  saveMute(mutePath, instanceName, board.mute);
  saveCk(true);

  for (const c of claims) log('[claim] ' + c.text);
  log('[summary] ' + gen.name + (llmMock ? ' (mock)' : '') + ' seed=' + seed + ' generated=' + counts.generated
    + ' screened-out=' + counts.screenRejected + ' certified HIT/REJECT/REFUSED='
    + counts.certified.HIT + '/' + counts.certified.REJECT + '/' + counts.certified.REFUSED
    + ' admitted=' + myHits.length + ' reject-audit FN=' + falseNegatives + '/' + wantN);

  const result = { summary, refused: null };
  await maybeBaseline(result);
  return result;

  /* ---------------- dumb-baseline rule (governor doctrine) ----------------
     A non-enum generator REQUIRES an equal-budget enum control run in the same
     session; both appear in the session summary. No opt-out. */
  async function maybeBaseline(result) {
    if (gen.name === 'enum' || o._isBaseline) return;
    const sessPath = path.join(expDir, 'session-' + seed + '.json');
    if (fs.existsSync(sessPath)) {
      result.sessionSummary = JSON.parse(fs.readFileSync(sessPath, 'utf8'));
      return;
    }
    const mainGenerated = result.summary.counts.generated;
    const baseline = await runFunnel(instanceDir, {
      seed: seed + '-baseline', generator: 'enum',
      targetPath, batchSize, decades, rejectAuditRate, wallClockMs,
      maxCandidates: mainGenerated,
      boardCap: o.boardCap, regionCap: o.regionCap, bingoDry: o.bingoDry || null,
      quiet: true, log: () => {}, env, fetch: fetchFn,
      _isBaseline: true
    });
    const session = {
      kind: 'session-summary',
      rule: 'dumb-baseline control at equal candidate budget — required whenever a non-enum generator is used',
      metrics: METRIC_DEFS,
      main: {
        seed, generator: gen.name, mock: llmMock,
        generated: mainGenerated,
        certifiedHits: result.summary.counts.certified.HIT,
        admittedHits: result.summary.admitted,
        claims: result.summary.claims.map(c => c.text)
      },
      baseline: baseline.refused ? { refused: baseline.refused } : {
        seed: seed + '-baseline', generator: 'enum',
        generated: baseline.summary.counts.generated,
        certifiedHits: baseline.summary.counts.certified.HIT,
        admittedHits: baseline.summary.admitted,
        claims: baseline.summary.claims.map(c => c.text)
      }
    };
    const sessCheck = checkSessionSummary(session);
    if (!sessCheck.ok) throw new Error('session-summary failed its own check before write: ' + sessCheck.why);
    writeAtomic(sessPath, JSON.stringify(session, null, 2) + '\n');
    result.baseline = baseline;
    result.sessionSummary = session;
    log('[baseline] enum control at equal budget (' + mainGenerated + ' candidates): certified HITs '
      + (baseline.refused ? 'REFUSED' : session.baseline.certifiedHits + ' vs main ' + session.main.certifiedHits)
      + '; new-to-board ' + (baseline.refused ? 'REFUSED' : session.baseline.admittedHits + ' vs main ' + session.main.admittedHits)
      + ' (two counters, definitions in the session file)');
  }
}

/* verify the llm log's prompt chain: every logged entry's promptSha must equal
   sha256 of its own verbatim request body. A tampered request (or a sha minted
   without its prompt) is caught by name. */
function verifyLlmLog(file) {
  if (!fs.existsSync(file)) return { ok: true, entries: 0 };
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.length > 0);
  for (let i = 0; i < lines.length; i++) {
    let e;
    try { e = JSON.parse(lines[i]); } catch (err) { return { ok: false, entries: i, badLine: i, why: 'unparseable line' }; }
    if (typeof e.promptSha !== 'string' || e.promptSha.length !== 64) {
      return { ok: false, entries: i, badLine: i, why: 'entry carries no promptSha' };
    }
    if (sha256(JSON.stringify(e.request)) !== e.promptSha) {
      return { ok: false, entries: i, badLine: i, why: 'promptSha does not match the logged request body' };
    }
  }
  return { ok: true, entries: lines.length };
}

function readLastSummary(runPath) {
  const recs = fs.readFileSync(runPath, 'utf8').split('\n').filter(l => l).map(l => JSON.parse(l));
  for (let i = recs.length - 1; i >= 0; i--) if (recs[i].kind === 'run-summary') return recs[i];
  return null;
}

/* compact human description of a declarative schema, for RECORD claim texts */
function describeSchema(schema) {
  if (!schema || typeof schema !== 'object') return 'unspecified';
  if (Array.isArray(schema.enum)) return 'enum(' + schema.enum.length + ')';
  switch (schema.type) {
    case 'object': {
      const props = schema.properties || {};
      return '{' + Object.keys(props).sort().map(k => k + ':' + describeSchema(props[k])).join(', ') + '}';
    }
    case 'array': {
      const lo = schema.minItems, hi = schema.maxItems;
      const len = lo === undefined && hi === undefined ? '*' : (lo === hi ? String(lo) : (lo === undefined ? '..' + hi : hi === undefined ? lo + '..' : lo + '..' + hi));
      return 'array[' + len + ' of ' + describeSchema(schema.items) + ']';
    }
    case 'integer':
    case 'number': {
      const lo = schema.minimum === undefined ? '-inf' : schema.minimum;
      const hi = schema.maximum === undefined ? '+inf' : schema.maximum;
      return schema.type + ' in [' + lo + ',' + hi + ']';
    }
    default: return String(schema.type);
  }
}

/* Phase 3 (2026-08-20): before this, EVERY generator's RECORD named the enum
   intGrid — under-describing what evolve/llm actually roamed, a caveat both
   live instances carried verbatim. A non-enum generator's true box is the
   candidateSchema; only enum's is the declared grid. */
function describeBox(target, generatorName, generated, exhausted) {
  let box = 'candidateSchema box ' + describeSchema(target.candidateSchema);
  if (generatorName === 'enum' && target.enumSpec && target.enumSpec.type === 'intGrid') {
    box = 'intGrid ' + target.enumSpec.name + ' in ' + target.enumSpec.ranges.map(r => '[' + r[0] + ',' + r[1] + ']').join('x');
  }
  return box + ', generator=' + generatorName + ', candidates evaluated=' + generated + (exhausted ? ' (enumeration exhausted)' : '');
}

/* ---------------- the statement spec (Phase 5) ----------------
   THE SAT COMMUNITY'S 2026 LESSON (Keller ITP 2026, scout read): the trust
   frontier is not the proof, it is whether the encoded thing MEANS the
   theorem. The funnel's analog: the claim statement, the candidate schema and
   the searched box must not be able to drift apart across files. An instance
   may carry statement.json — {name, statement, candidateSchema?, enumSpec?,
   emptyBox?} — ONE source. The runner REFUSES (STATEMENT-MISMATCH, field
   named) when the target's exports disagree with it, and every run header and
   claim then carries statementSha, so a record names WHAT was searched from
   one pinned source. No statement.json => nothing changes. */
function loadStatement(instanceDir, o) {
  const p = (o && o.statementPath) || path.join(instanceDir, 'statement.json');
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf8');
  const spec = JSON.parse(raw);
  if (typeof spec.statement !== 'string' || spec.statement.length === 0) {
    throw new Error('statement.json: a "statement" prose field is required — a spec that does not state the claim pins nothing');
  }
  return { spec, sha: sha256(raw) };
}

function statementMismatches(st, target) {
  const bad = [];
  if (!st) return bad;
  const cmp = (name, specVal, targetVal) => {
    if (specVal === undefined) return;
    if (stableStringify(specVal) !== stableStringify(targetVal)) {
      bad.push({ control: 'STATEMENT', why: 'statement.json.' + name + ' disagrees with the target\'s export — one of them is not the statement being tested' });
    }
  };
  cmp('candidateSchema', st.spec.candidateSchema, target.candidateSchema);
  cmp('enumSpec', st.spec.enumSpec, target.enumSpec);
  cmp('emptyBox', st.spec.emptyBox, target.emptyBox && target.emptyBox.box);
  return bad;
}

/* ---------------- certified-empty-box mode ----------------
   target.emptyBox = { box, exhaust(box) -> {exhausted, checked, certificate} }.
   Emits ONE RECORD claim carrying the exhaustionCertificate. No HIT shapes can
   appear here by construction. */
function runExhaust(instanceDir, opts) {
  const o = opts || {};
  const targetPath = o.targetPath || path.join(instanceDir, 'target.js');
  const target = loadTarget(targetPath);
  const st = loadStatement(instanceDir, o);
  const stBad = statementMismatches(st, target);
  if (stBad.length) return { refused: { reason: 'STATEMENT-MISMATCH', failures: stBad } };
  if (!target.emptyBox || typeof target.emptyBox.exhaust !== 'function') {
    return { refused: { reason: 'NO-EMPTY-BOX', failures: [{ control: 'EXHAUST', why: 'target declares no emptyBox.exhaust' }] } };
  }
  const r = target.emptyBox.exhaust(target.emptyBox.box);
  if (!r || r.exhausted !== true || !r.certificate) {
    return { refused: { reason: 'EXHAUST-INCOMPLETE', failures: [{ control: 'EXHAUST', why: (r && r.why) || 'exhaust() did not return {exhausted:true, certificate}' }] } };
  }
  const claim = recordClaim(String(target.emptyBox.box && target.emptyBox.box.name || 'declared empty box'), r.certificate);
  if (st) { claim.statementSha = st.sha; claim.text += ' statement=sha256:' + st.sha; }
  const record = { kind: 'exhaust-record', box: target.emptyBox.box, checked: r.checked, claims: [claim] };
  if (st) { record.statement = st.spec.statement; record.statementSha = st.sha; }
  const expDir = path.join(instanceDir, 'experiments');
  fs.mkdirSync(expDir, { recursive: true });
  writeAtomic(path.join(expDir, 'exhaust.json'), JSON.stringify(record, null, 2) + '\n');
  return { record };
}

/* ---------------- sharded exhaustion + cover certificate (Phase 5) ----------------
   LRAT-Catcher's move (arXiv:2607.00815, scout read), ported: an exhaustion is
   cube-and-conquer — one certificate PER WINDOW plus one small certificate
   that the windows TILE the declared box, and the RECORD claim is their
   mechanical conjunction. A third party re-verifies ONE window on a laptop
   without trusting us, and a kernel edit re-runs only the windows it touched.
   The box's first dimension is split into K contiguous integer intervals; the
   tiling fact (disjoint, complete) is checked by verifyShardedExhaust — the
   deliberately tiny checker at the end of the chain, exported so it can run
   anywhere. A window that does not come back {exhausted:true, certificate}
   refuses the WHOLE record by window id (C6: a failed shard is never a
   silent gap). Checkpointed per window; kill and resume reproduces the same
   record byte for byte. */
function runExhaustSharded(instanceDir, opts) {
  const o = opts || {};
  const targetPath = o.targetPath || path.join(instanceDir, 'target.js');
  const target = loadTarget(targetPath);
  const st = loadStatement(instanceDir, o);
  const stBad = statementMismatches(st, target);
  if (stBad.length) return { refused: { reason: 'STATEMENT-MISMATCH', failures: stBad } };
  if (!target.emptyBox || typeof target.emptyBox.exhaust !== 'function') {
    return { refused: { reason: 'NO-EMPTY-BOX', failures: [{ control: 'EXHAUST', why: 'target declares no emptyBox.exhaust' }] } };
  }
  const box = target.emptyBox.box;
  if (!box || !Array.isArray(box.ranges) || !box.ranges.length) {
    return { refused: { reason: 'NO-BOX-RANGES', failures: [{ control: 'EXHAUST', why: 'sharding needs box.ranges' }] } };
  }
  const [lo0, hi0] = box.ranges[0];
  const K = o.windows || 4;
  if (!Number.isInteger(K) || K < 1 || K > hi0 - lo0 + 1) {
    return { refused: { reason: 'BAD-WINDOW-COUNT', failures: [{ control: 'EXHAUST', why: 'windows must be an integer in [1, ' + (hi0 - lo0 + 1) + ']' }] } };
  }
  /* deterministic near-equal contiguous split of [lo0, hi0] */
  const size = hi0 - lo0 + 1;
  const bounds = [];
  for (let i = 0, at = lo0; i < K; i++) {
    const w = Math.floor(size / K) + (i < size % K ? 1 : 0);
    bounds.push([at, at + w - 1]);
    at += w;
  }

  const expDir = path.join(instanceDir, 'experiments');
  fs.mkdirSync(expDir, { recursive: true });
  const ckPath = path.join(expDir, 'exhaust-sharded-checkpoint.json');
  let windows = [];
  if (fs.existsSync(ckPath)) {
    const ck = JSON.parse(fs.readFileSync(ckPath, 'utf8'));
    if (stableStringify(ck.bounds) !== stableStringify(bounds) || ck.boxName !== String(box.name)) {
      return { refused: { reason: 'CHECKPOINT-MISMATCH', failures: [{ control: 'EXHAUST', why: 'sharded checkpoint belongs to a different box/window split' }] } };
    }
    windows = ck.windows;
  }

  for (let i = windows.length; i < K; i++) {
    const [a, b] = bounds[i];
    const shardBox = { name: String(box.name) + ' — window ' + i + ' dim0=[' + a + ',' + b + ']', ranges: [[a, b]].concat(box.ranges.slice(1)) };
    const r = target.emptyBox.exhaust(shardBox);
    if (!r || r.exhausted !== true || !r.certificate) {
      return { refused: { reason: 'SHARD-INCOMPLETE', failures: [{ control: 'EXHAUST', why: 'window ' + i + ' (dim0=[' + a + ',' + b + ']) did not come back exhausted-with-certificate: ' + ((r && r.why) || 'no result') + ' — the whole record is refused; a failed shard is never a silent gap' }] } };
    }
    windows.push({ id: i, dim0: [a, b], checked: r.checked, certificate: r.certificate, certSha: sha256(stableStringify(r.certificate)) });
    writeAtomic(ckPath, JSON.stringify({ kind: 'sharded-checkpoint', boxName: String(box.name), bounds, windows }, null, 2) + '\n');
    if (o.stopAfterWindows && windows.length >= o.stopAfterWindows && windows.length < K) {
      return { stopped: 'windows', done: windows.length, of: K };
    }
  }

  const totalChecked = windows.reduce((s, w) => s + w.checked, 0);
  const coverCertificate = {
    kind: 'cover-tiling',
    box: { name: String(box.name), ranges: box.ranges },
    dimension: 0,
    windows: windows.map(w => ({ id: w.id, dim0: w.dim0, certSha: w.certSha, checked: w.checked })),
    property: 'the windows partition dim0 of the box: contiguous, disjoint, complete — re-checkable by verifyShardedExhaust from this record alone'
  };
  const conjunction = {
    kind: 'sharded-exhaustion-conjunction',
    coverSha: sha256(stableStringify(coverCertificate)),
    windowCertShas: windows.map(w => w.certSha),
    totalChecked
  };
  const claim = recordClaim(String(box.name) + ' — exhausted in ' + K + ' cover-certified windows', conjunction);
  if (st) { claim.statementSha = st.sha; claim.text += ' statement=sha256:' + st.sha; }
  const record = {
    kind: 'sharded-exhaust-record',
    box, windows, coverCertificate, totalChecked,
    claims: [claim]
  };
  if (st) { record.statement = st.spec.statement; record.statementSha = st.sha; }
  writeAtomic(path.join(expDir, 'exhaust-sharded.json'), JSON.stringify(record, null, 2) + '\n');
  return { record };
}

/* the tiny checker: everything it needs is IN the record. Geometry first
   (tiling: starts at the box floor, ends at the box ceiling, each window
   starts one past the previous end — integer intervals, so disjoint AND
   complete), then every window certificate re-hashed against its pinned sha,
   then the checked-count conservation. */
function verifyShardedExhaust(record) {
  if (!record || record.kind !== 'sharded-exhaust-record') return { ok: false, why: 'not a sharded-exhaust-record' };
  const [lo0, hi0] = record.box.ranges[0];
  const ws = record.windows.slice().sort((a, b) => a.dim0[0] - b.dim0[0]);
  if (!ws.length) return { ok: false, why: 'no windows' };
  if (ws[0].dim0[0] !== lo0) return { ok: false, why: 'tiling gap: first window starts at ' + ws[0].dim0[0] + ', box starts at ' + lo0, badWindow: ws[0].id };
  for (let i = 1; i < ws.length; i++) {
    if (ws[i].dim0[0] !== ws[i - 1].dim0[1] + 1) {
      return { ok: false, why: 'tiling ' + (ws[i].dim0[0] <= ws[i - 1].dim0[1] ? 'overlap' : 'gap') + ' between windows ' + ws[i - 1].id + ' and ' + ws[i].id, badWindow: ws[i].id };
    }
  }
  if (ws[ws.length - 1].dim0[1] !== hi0) return { ok: false, why: 'tiling gap: last window ends at ' + ws[ws.length - 1].dim0[1] + ', box ends at ' + hi0, badWindow: ws[ws.length - 1].id };
  let sum = 0;
  for (const w of record.windows) {
    if (sha256(stableStringify(w.certificate)) !== w.certSha) {
      return { ok: false, why: 'window ' + w.id + ': certificate does not match its pinned sha', badWindow: w.id };
    }
    sum += w.checked;
  }
  if (sum !== record.totalChecked) return { ok: false, why: 'checked-count conservation broken: windows sum ' + sum + ' !== totalChecked ' + record.totalChecked };
  return { ok: true, windows: record.windows.length, totalChecked: sum };
}

module.exports = {
  runFunnel, runExhaust, runExhaustSharded,
  /* exported for the battery and for instance tooling */
  verifyChainFile, chainGenesis, stableStringify, sha256, fnv1a, makeRng,
  validateSchema, assertClaimless, hitClaim, recordClaim,
  runStartControls, loadTarget, loadGenerator,
  checkSessionSummary, verifyLlmLog, METRIC_DEFS,
  admitHit, candidateKey, candidateRegion, describeBox, describeSchema,
  verifyShardedExhaust, loadStatement, statementMismatches
};

/* ---------------- CLI ---------------- */
if (require.main === module) {
  const args = process.argv.slice(2);
  const dir = args[0];
  if (!dir) {
    console.log('usage: node funnel.js <instance-dir> --seed S [--generator enum|evolve|llm] [--decades 2,3] [--batch 32] [--audit 0.05] [--exhaust]');
    process.exit(2);
  }
  const flag = (name, dflt) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
  };
  if (args.includes('--exhaust-sharded')) {
    const r = runExhaustSharded(dir, { windows: Number(flag('--windows', '4')) });
    if (r.record) {
      const v = verifyShardedExhaust(r.record);
      console.log(JSON.stringify({ refused: r.refused || null, verify: v, claims: r.record.claims.map(c => c.text) }, null, 2));
      process.exit(v.ok ? 0 : 1);
    }
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.refused ? 1 : 0);
  } else if (args.includes('--exhaust')) {
    const r = runExhaust(dir, {});
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.refused ? 1 : 0);
  } else {
    runFunnel(dir, {
      seed: flag('--seed', 'dev'),
      generator: flag('--generator', 'enum'),
      decades: flag('--decades', '2').split(',').map(Number),
      batchSize: Number(flag('--batch', '32')),
      rejectAuditRate: Number(flag('--audit', '0.05'))
    }).then(r => {
      if (r.refused) { console.error('REFUSED TO START: ' + r.refused.reason); r.refused.failures.forEach(f => console.error('  ' + f.control + ': ' + f.why)); process.exit(1); }
      if (r.aborted) { console.error('ABORTED: ' + r.aborted.reason + ' — ' + r.aborted.detail); process.exit(1); }
      process.exit(0);
    }).catch(e => { console.error(e); process.exit(1); });
  }
}
