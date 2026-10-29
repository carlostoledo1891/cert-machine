#!/usr/bin/env node
/* validate.js — the print register against WARRANT v2.2's colour law, with every number written down.
   design/print/ · cert-machine (2026-10-29)

   WHAT IT ASKS, in the order a reader would. Every colour number comes from design/colour.js, the module
   design/battery.js runs (OKLab ΔE×100, the Machado-Oliveira-Fernandes 2009 simulation at severity 1.0, WCAG 2
   contrast); nothing here re-implements it.

     P1  every WARRANT role has a print value (the ground, the three inks, the guide, the grid, the witness, the
         identity set, a five-step ramp)
     P2  each standing wears the screen's class and the screen's token (playground/warrant.js stroke() and css())
     P3  the stroke grammar does not change: every dash the register can emit is in design/grammar.js PERMITTED
     P4  the witness is the screen's one red (design/tokens.js --witness), not a copy of it
     P5  no yellow and no orange: every chromatic value's OKLCH hue lies outside 35°–115°
     P6  contrast on paper: text 4.5:1, marks 3:1, a hairline still visible (1.2:1)
     P7  every pair of colours that can share a figure: ΔE ≥ 15 for normal vision and ≥ 8 under protan, deutan and
         tritan — all pairs, not neighbours (v2.2 rule 5)
     P8  the order ramp: neutral, darker with magnitude, ΔL ≥ 0.06 per step in colour and in both greyscale
         conversions, the light end a visible tint, ink readable over every step
     P9  greyscale: every text and mark value keeps its grade under both conversions; every chromatic value carries a
         shape; every identity series has its own marker

   and then RED CONTROLS: each planted palette must be refused by the check it attacks, or this run fails.

   writes design/print/REPORT.md and design/print/report.json; exit 0 only when every check passes and every red
   control turns red.   usage: node design/print/validate.js            MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const CL = require(path.join(ROOT, 'design', 'colour.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const PR = require(path.join(__dirname, 'tokens.js'));

const KINDS = ['protan', 'deutan', 'tritan'];
const FLOOR = { normal: 15, cvd: 8, text: 4.5, mark: 3, hairline: 1.2, rampStep: 0.06, chroma: 0.03 };
const ORANGE_YELLOW = [35, 115];   /* OKLCH hue, degrees: #eb6834 (orange) 41°, #eda100 (amber) 75°, #ffff00 110° */
const WIDTHS = [0.5, 1, 1.25, 1.5, 2, 3];
const f = (x, k = 1) => Number(x).toFixed(k);

/* ---------------------------------------------------------------- the checks --
   Each check takes a palette P = { reg, standings, identity, witness } so a red control runs the SAME function on a
   planted palette. A check returns { pass, detail }. */
const chromaOf = (h) => CL.oklch(h)[1];
const isChromatic = (h) => chromaOf(h) > FLOOR.chroma;
const figureSet = (reg) => reg.filter((t) => t.kind !== 'ground' && t.kind !== 'order');
const rampOf = (reg) => reg.filter((t) => t.kind === 'order');
const tok = (reg, name) => reg.find((t) => t.name === name);

/* the screen's stroke token per class, read from warrant.js css() — never retyped */
function screenStrokeTokens() {
  const css = W.css(), out = {};
  for (const cls of ['w-decided', 'w-computed', 'w-chosen']) {
    const m = new RegExp('\\.' + cls + '\\s*\\{\\s*stroke:\\s*var\\((--[a-z0-9-]+)\\)').exec(css);
    out[cls] = m ? m[1] : null;
  }
  return out;
}
const STANDING_CODE = { DECIDED: W.DECIDED, COMPUTED: W.COMPUTED, CHOSEN: W.CHOSEN, REFUSED: W.REFUSED };

const CHECKS = {
  P1(P) {
    const need = ['--paper', '--ink', '--ink-2', '--ink-3', '--guide', '--grid', '--witness'];
    const missing = need.filter((n) => !tok(P.reg, n));
    const ramp = rampOf(P.reg);
    const stTok = P.standings.filter((s) => s.token && !tok(P.reg, s.token)).map((s) => s.standing + '→' + s.token);
    const idTok = P.identity.filter((i) => !tok(P.reg, i.token)).map((i) => i.token);
    const ok = !missing.length && ramp.length === 5 && !stTok.length && !idTok.length && P.identity.length >= 2 && P.identity.length <= 3
      && P.standings.length === 4;
    return { pass: ok, detail: ok ? need.length + ' role tokens, ' + ramp.length + ' ramp steps, ' + P.identity.length + ' identity series, 4 standings'
      : [missing.length ? 'missing ' + missing.join(', ') : '', ramp.length !== 5 ? 'ramp has ' + ramp.length + ' steps' : '',
        stTok.length ? 'standing tokens absent: ' + stTok.join(', ') : '', idTok.length ? 'identity tokens absent: ' + idTok.join(', ') : ''].filter(Boolean).join('; ') };
  },
  P2(P) {
    const screen = screenStrokeTokens(), bad = [];
    for (const s of P.standings) {
      const code = STANDING_CODE[s.standing];
      for (const w of WIDTHS) {
        const st = W.stroke(code, { width: w });
        if (s.standing === 'REFUSED') { if (st !== null || s.dash !== null) bad.push('REFUSED has a stroke'); continue; }
        if (!st) { bad.push(s.standing + ' has no screen stroke'); continue; }
        if (st.class !== s.cls) bad.push(s.standing + ' class ' + s.cls + ' vs screen ' + st.class);
        if ((st.dash || null) !== (s.dash(w) || null)) bad.push(s.standing + ' at ' + w + ': dash ' + s.dash(w) + ' vs screen ' + st.dash);
        if ((st.cap || null) !== (s.cap || null)) bad.push(s.standing + ' cap ' + s.cap + ' vs screen ' + st.cap);
      }
      if (s.cls !== 'w-void' && screen[s.cls] !== s.token) bad.push(s.standing + ' strokes in ' + s.token + ', the screen in ' + screen[s.cls]);
    }
    const u = [...new Set(bad)];
    return { pass: !u.length, detail: u.length ? u.join('; ') : 'decided ' + screen['w-decided'] + ' · computed ' + screen['w-computed'] + ' · chosen ' + screen['w-chosen'] + ', classes and dashes at ' + WIDTHS.length + ' widths' };
  },
  P3(P) {
    const permitted = new Set(G.PERMITTED), seen = new Set(), bad = [];
    for (const s of P.standings) if (s.dash) for (const w of WIDTHS) { const d = s.dash(w); if (d === null) continue; seen.add(d); if (!permitted.has(d)) bad.push(s.standing + ' "' + d + '"'); }
    const g = P.guide.dash; seen.add(g); if (!permitted.has(g)) bad.push('guide "' + g + '"');
    return { pass: !bad.length, detail: bad.length ? 'not in grammar.js: ' + [...new Set(bad)].join(', ') : 'emits ' + [...seen].map((d) => '"' + d + '"').join(' ') + ' and solid; all in grammar.js PERMITTED' };
  },
  P4(P) {
    const w = tok(P.reg, '--witness');
    const ok = !!w && w.hex.toLowerCase() === T.DARKONLY['--witness'].toLowerCase();
    return { pass: ok, detail: (w ? w.hex : 'none') + (ok ? ' = design/tokens.js --witness' : ' ≠ design/tokens.js --witness ' + T.DARKONLY['--witness']) };
  },
  P5(P) {
    const bad = [], seen = [];
    for (const t of P.reg) {
      if (!isChromatic(t.hex)) continue;
      const h = CL.okhue(t.hex); seen.push(t.name + ' ' + f(h, 0) + '°');
      if (h >= ORANGE_YELLOW[0] && h < ORANGE_YELLOW[1]) bad.push(t.name + ' ' + t.hex + ' at ' + f(h, 0) + '°');
    }
    return { pass: !bad.length, detail: bad.length ? 'yellow/orange: ' + bad.join(', ') : 'chromatic: ' + seen.join(', ') + ' (forbidden ' + ORANGE_YELLOW.join('°–') + '°)' };
  },
  P6(P) {
    const paper = tok(P.reg, '--paper').hex, bad = [], seen = [];
    for (const t of P.reg) {
      const need = t.grade === 'text' ? FLOOR.text : t.grade === 'mark' ? FLOOR.mark : t.grade === 'hairline' ? FLOOR.hairline : null;
      if (need === null) continue;
      const k = CL.contrast(t.hex, paper); seen.push(t.name + ' ' + f(k, 2));
      if (k < need) bad.push(t.name + ' ' + t.hex + ' ' + f(k, 2) + ':1 < ' + need + ' (' + t.grade + ')');
    }
    return { pass: !bad.length, detail: bad.length ? bad.join('; ') : seen.join(' · ') };
  },
  P7(P) {
    const S = figureSet(P.reg); let wn = { d: Infinity }, wc = { d: Infinity }; const bad = [];
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
      const a = S[i], b = S[j]; if (a.hex.toLowerCase() === b.hex.toLowerCase()) continue;   /* one value, two roles: one colour */
      const n = CL.deltaE(a.hex, b.hex); if (n < wn.d) wn = { d: n, p: a.name + '↔' + b.name };
      if (n < FLOOR.normal) bad.push(a.name + '↔' + b.name + ' normal ' + f(n));
      for (const k of KINDS) { const d = CL.deltaE(a.hex, b.hex, k); if (d < wc.d) wc = { d, p: a.name + '↔' + b.name, k }; if (d < FLOOR.cvd) bad.push(a.name + '↔' + b.name + ' ' + k + ' ' + f(d)); }
    }
    return { pass: !bad.length, detail: bad.length ? bad.join('; ') : S.length + ' colours, ' + (S.length * (S.length - 1) / 2) + ' pairs · worst normal ' + f(wn.d) + ' (' + wn.p + ') · worst CVD ' + f(wc.d) + ' (' + wc.p + ', ' + wc.k + ')' };
  },
  P8(P) {
    const R = rampOf(P.reg), paper = tok(P.reg, '--paper').hex, ink = tok(P.reg, '--ink').hex, bad = [];
    const series = { colour: R.map((t) => CL.oklch(t.hex)[0]), monoY: R.map((t) => CL.oklch(PR.monoY(t.hex))[0]), mono601: R.map((t) => CL.oklch(PR.mono601(t.hex))[0]) };
    for (const [k, Ls] of Object.entries(series)) {
      for (let i = 1; i < Ls.length; i++) {
        if (!(Ls[i] < Ls[i - 1])) bad.push(k + ': step ' + (i + 1) + ' is not darker than step ' + i);
        else if (Ls[i - 1] - Ls[i] < FLOOR.rampStep - 1e-12) bad.push(k + ': ΔL ' + f(Ls[i - 1] - Ls[i], 3) + ' between steps ' + i + ' and ' + (i + 1));
      }
    }
    const chrom = R.filter((t) => isChromatic(t.hex)); if (chrom.length) bad.push('not neutral: ' + chrom.map((t) => t.name).join(', '));
    const light = CL.contrast(R[0].hex, paper); if (light < FLOOR.hairline) bad.push('light end ' + f(light, 2) + ':1 is not a visible tint');
    const overInk = R.map((t) => CL.contrast(ink, t.hex)); const worstInk = Math.min(...overInk); if (worstInk < FLOOR.text) bad.push('ink over the dark end ' + f(worstInk, 2) + ':1');
    const gaps = series.colour.slice(1).map((v, i) => series.colour[i] - v);
    return { pass: !bad.length, detail: bad.length ? bad.join('; ') : 'L ' + series.colour.map((v) => f(v, 3)).join('→') + ' · min ΔL ' + f(Math.min(...gaps), 3) + ' · light end ' + f(light, 2) + ':1 · ink over every step ≥ ' + f(worstInk, 2) + ':1' };
  },
  P9(P) {
    const paper = tok(P.reg, '--paper').hex, bad = [];
    for (const t of P.reg) {
      const need = t.grade === 'text' ? FLOOR.text : t.grade === 'mark' ? FLOOR.mark : null;
      if (need !== null) for (const [k, fn] of [['monoY', PR.monoY], ['mono601', PR.mono601]]) {
        const c = CL.contrast(fn(t.hex), fn(paper)); if (c < need) bad.push(t.name + ' in ' + k + ' ' + f(c, 2) + ':1 < ' + need);
      }
      if (isChromatic(t.hex) && t.kind !== 'order' && !t.shape) bad.push(t.name + ' is a colour with no shape');
    }
    const markers = P.identity.map((i) => i.marker); if (new Set(markers).size !== markers.length) bad.push('two identity series share a marker');
    return { pass: !bad.length, detail: bad.length ? bad.join('; ') : 'text and marks keep their grade in both conversions; every chromatic value carries a shape (' + P.reg.filter((t) => isChromatic(t.hex) && t.kind !== 'order').map((t) => t.name + ' ' + t.shape).join(', ') + '); identity markers ' + markers.join(' ') };
  },
};
const ORDER = Object.keys(CHECKS);
const NAMES = {
  P1: 'every WARRANT role has a print value', P2: 'each standing wears the screen\'s class and token', P3: 'the stroke grammar does not change',
  P4: 'the witness is the screen\'s one red', P5: 'no yellow, no orange', P6: 'contrast on paper (text 4.5:1, marks 3:1, hairline 1.2:1)',
  P7: 'every pair that can share a figure: normal ≥ 15, protan/deutan/tritan ≥ 8', P8: 'the order ramp (neutral, darker with magnitude, ΔL ≥ 0.06, colour and greyscale)',
  P9: 'greyscale: grades kept, colour never alone, one marker per series',
};

const PALETTE = { reg: PR.REGISTER, standings: PR.STANDINGS, identity: PR.IDENTITY, guide: PR.GUIDE };

/* ------------------------------------------------------------- red controls --
   Each plants one defect in a copy of the register and must be refused by the check it attacks. */
const clone = (P) => ({ reg: P.reg.map((t) => ({ ...t })), standings: P.standings.map((s) => ({ ...s })), identity: P.identity.map((i) => ({ ...i })), guide: { ...P.guide } });
const setHex = (P, name, h) => { tok(P.reg, name).hex = h; return P; };
const REDS = [
  { id: 'X1', attacks: 'P7', what: 'a near-identical grey planted beside --ink-3 (#4f4f4f against #4d4d4d)',
    plant: (P) => { P.reg.push({ name: '--planted', hex: '#4f4f4f', kind: 'ink', grade: 'text' }); return P; } },
  { id: 'X2', attacks: 'P7', what: 'a green identity that clears normal vision against the witness but not a deuteranope (#6f9a3a)',
    plant: (P) => setHex(P, '--id-2', '#6f9a3a') },
  { id: 'X3', attacks: 'P5', what: 'an orange identity (#eb6834, the dataviz default\'s slot 2)', plant: (P) => setHex(P, '--id-2', '#eb6834') },
  { id: 'X4', attacks: 'P5', what: 'a yellow identity (#eda100)', plant: (P) => setHex(P, '--id-2', '#eda100') },
  { id: 'X5', attacks: 'P6', what: 'a light grey as the caption ink (#999999, 2.85:1)', plant: (P) => setHex(P, '--ink-3', '#999999') },
  { id: 'X6', attacks: 'P8', what: 'two ramp steps swapped (not darker with magnitude)',
    plant: (P) => { const a = tok(P.reg, '--o-2').hex; tok(P.reg, '--o-2').hex = tok(P.reg, '--o-3').hex; tok(P.reg, '--o-3').hex = a; return P; } },
  { id: 'X7', attacks: 'P8', what: 'a ramp step 0.03 lighter than its neighbour (#a5a5a5 for #aeaeae)', plant: (P) => setHex(P, '--o-4', '#a5a5a5') },
  { id: 'X8', attacks: 'P8', what: 'a blue-tinted ramp step (#cfe0f5)', plant: (P) => setHex(P, '--o-2', '#cfe0f5') },
  { id: 'X9', attacks: 'P3', what: 'a computed stroke given the width-derived pattern "6 4" (the one frontier\'s contract records)',
    plant: (P) => { P.standings.find((s) => s.standing === 'COMPUTED').dash = () => '6 4'; return P; } },
  { id: 'X10', attacks: 'P4', what: 'a second red as the witness (#E06B62, the retired --v-refu)', plant: (P) => setHex(P, '--witness', '#E06B62') },
  { id: 'X11', attacks: 'P9', what: 'a chromatic identity with no shape', plant: (P) => { delete tok(P.reg, '--id-2').shape; return P; } },
  { id: 'X12', attacks: 'P2', what: 'the computed stroke re-mapped to --ink-2 (not the screen\'s token)',
    plant: (P) => { P.standings.find((s) => s.standing === 'COMPUTED').token = '--ink-2'; return P; } },
  { id: 'X13', attacks: 'P9', what: 'two identity series sharing the circle', plant: (P) => { P.identity[1].marker = 'o'; return P; } },
];

/* ------------------------------------------------------------------- tables -- */
function tokenTable(reg) {
  const paper = tok(reg, '--paper').hex;
  return reg.map((t) => {
    const [L, C] = CL.oklch(t.hex);
    return { name: t.name, hex: t.hex, kind: t.kind, grade: t.grade, status: t.status, screen: t.screen, shape: t.shape || null, role: t.role,
      L: +L.toFixed(4), C: +C.toFixed(4), hue: isChromatic(t.hex) ? +CL.okhue(t.hex).toFixed(1) : null,
      contrast: t.name === '--paper' ? null : +CL.contrast(t.hex, paper).toFixed(3),
      monoY: PR.monoY(t.hex), mono601: PR.mono601(t.hex),
      contrastMonoY: t.name === '--paper' ? null : +CL.contrast(PR.monoY(t.hex), PR.monoY(paper)).toFixed(3),
      contrastMono601: t.name === '--paper' ? null : +CL.contrast(PR.mono601(t.hex), PR.mono601(paper)).toFixed(3) };
  });
}
function pairTable(reg) {
  const S = figureSet(reg), out = [];
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
    const a = S[i], b = S[j], r = { a: a.name, b: b.name, normal: +CL.deltaE(a.hex, b.hex).toFixed(2) };
    for (const k of KINDS) r[k] = +CL.deltaE(a.hex, b.hex, k).toFixed(2);
    r.monoY = +CL.deltaE(PR.monoY(a.hex), PR.monoY(b.hex)).toFixed(2);
    r.mono601 = +CL.deltaE(PR.mono601(a.hex), PR.mono601(b.hex)).toFixed(2);
    r.pass = r.normal >= FLOOR.normal && KINDS.every((k) => r[k] >= FLOOR.cvd);
    out.push(r);
  }
  return out;
}
function fieldTable(reg) {
  return figureSet(reg).filter((t) => t.grade === 'text' || t.grade === 'mark').map((t) => {
    const over = rampOf(reg).map((s) => +CL.contrast(t.hex, s.hex).toFixed(2));
    return { name: t.name, over, worst: Math.min(...over), bare: Math.min(...over) >= FLOOR.mark };
  });
}
function worstPerToken(pairs, names) {
  const out = {};
  for (const n of names) {
    const mine = pairs.filter((p) => p.a === n || p.b === n);
    if (!mine.length) { out[n] = null; continue; }
    const w = { normal: Infinity };
    for (const k of KINDS) w[k] = Infinity;
    for (const p of mine) { const other = p.a === n ? p.b : p.a; if (p.normal < w.normal) { w.normal = p.normal; w.normalWith = other; } for (const k of KINDS) if (p[k] < w[k]) { w[k] = p[k]; w[k + 'With'] = other; } }
    out[n] = w;
  }
  return out;
}

/* ---------------------------------------------------------------------- run -- */
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
function run() {
  const results = ORDER.map((id) => ({ id, name: NAMES[id], ...CHECKS[id](PALETTE) }));
  const reds = REDS.map((r) => { const out = CHECKS[r.attacks](r.plant(clone(PALETTE))); return { id: r.id, attacks: r.attacks, what: r.what, refused: !out.pass, detail: out.detail }; });
  const tokens = tokenTable(PR.REGISTER), pairs = pairTable(PR.REGISTER), field = fieldTable(PR.REGISTER);
  const worst = worstPerToken(pairs, figureSet(PR.REGISTER).map((t) => t.name));
  const pass = results.every((r) => r.pass), allRed = reds.every((r) => r.refused);
  const report = {
    what: 'WARRANT print register (design/print/tokens.js) judged by WARRANT v2.2\'s colour law with design/colour.js (the code design/battery.js runs): OKLab ΔE×100, Machado 2009 CVD simulation at severity 1.0, WCAG 2 contrast, and two greyscale conversions (CIE Y; Rec. 601 luma). A PROPOSAL: nothing here is served or applied.',
    generated: new Date().toISOString().slice(0, 10),
    floors: FLOOR, forbiddenHue: ORANGE_YELLOW,
    inputs: Object.fromEntries(['design/print/tokens.js', 'design/colour.js', 'design/grammar.js', 'design/tokens.js', 'playground/warrant.js'].map((r) => [r, sha(r)])),
    verdict: pass && allRed ? 'PASS' : 'FAIL',
    checks: results, redControls: reds, tokens, worstPairPerToken: worst, pairs, overField: field,
    standings: PR.STANDINGS.map((s) => ({ standing: s.standing, class: s.cls, token: s.token, hex: s.token ? PR.hex(s.token) : null, dash: s.dash ? s.dash(PR.LINE_PT) : null, dashSmall: s.dash ? s.dash(G.SMALL_BELOW - 0.5) : null, cap: s.cap, void: s.void || null })),
    guide: { token: PR.GUIDE.token, hex: PR.hex(PR.GUIDE.token), dash: PR.GUIDE.dash },
    identity: PR.IDENTITY.map((i) => ({ ...i, hex: PR.hex(i.token), fallbackHex: i.fallback ? PR.hex(i.fallback) : null })),
  };
  return report;
}

/* ------------------------------------------------------------------ the page -- */
function md(R) {
  const L = [];
  const row = (cells) => '| ' + cells.join(' | ') + ' |';
  L.push('# The print register: validator report');
  L.push('');
  L.push('Generated by `node design/print/validate.js` on ' + R.generated + '. Do not edit by hand: change `design/print/tokens.js` and re-run.');
  L.push('Every number is computed by `design/colour.js`, the module `design/battery.js` runs (OKLab ΔE×100; Machado 2009 at severity 1.0; WCAG 2 contrast on white).');
  L.push('Greyscale is computed two ways and the worse is kept: CIE luminance Y, which colour-managed conversion and WCAG use, and Rec. 601 luma, which most print drivers and office suites use.');
  L.push('Every pair and every token, with all of its numbers, is in `design/print/report.json`.');
  L.push('');
  L.push('**Verdict: ' + R.verdict + '.** ' + R.checks.filter((c) => c.pass).length + ' of ' + R.checks.length + ' checks pass; ' + R.redControls.filter((r) => r.refused).length + ' of ' + R.redControls.length + ' red controls are refused by the check they attack.');
  L.push('');
  L.push('## The checks');
  L.push('');
  L.push(row(['', 'check', 'result', 'numbers']));
  L.push(row(['---', '---', '---', '---']));
  for (const c of R.checks) L.push(row([c.id, c.name, c.pass ? 'PASS' : '**FAIL**', c.detail.replace(/\|/g, '\\|')]));
  L.push('');
  L.push('## The register');
  L.push('');
  L.push('L and C are OKLCH. Contrast is against `--paper` (#ffffff). The two greyscale columns are the grey a mono printer lays for the colour. Status: *neutral* is a grey for a role WARRANT already has (no hue, so no new colour); *registered* is the value WARRANT v2.2 already registers, unchanged; *proposed* is a colour WARRANT has not registered and needs its own approval.');
  L.push('');
  L.push(row(['token', 'value', 'kind', 'status', 'role', 'L', 'C', 'hue', 'contrast', 'grey (Y)', 'grey (601)']));
  L.push(row(['---', '---', '---', '---', '---', '---:', '---:', '---:', '---:', '---', '---']));
  for (const t of R.tokens) L.push(row(['`' + t.name + '`', '`' + t.hex + '`', t.kind, t.status, t.role.replace(/\|/g, '\\|'), f(t.L, 3), f(t.C, 3), t.hue === null ? '—' : f(t.hue, 0) + '°', t.contrast === null ? '—' : f(t.contrast, 2) + ':1', '`' + t.monoY + '`', '`' + t.mono601 + '`']));
  L.push('');
  L.push('## Worst pair for each colour that can share a figure');
  L.push('');
  L.push('All pairs among every colour that can appear in one figure (the ground and the ramp\'s own steps are judged by contrast and by order instead; a ramp FAILS the categorical test by construction, as the dataviz method says).');
  L.push('');
  L.push(row(['token', 'normal (with)', 'protan (with)', 'deutan (with)', 'tritan (with)']));
  L.push(row(['---', '---:', '---:', '---:', '---:']));
  for (const [n, w] of Object.entries(R.worstPairPerToken)) if (w) L.push(row(['`' + n + '`'].concat(['normal', 'protan', 'deutan', 'tritan'].map((k) => f(w[k]) + ' (`' + w[k + 'With'] + '`)'))));
  L.push('');
  L.push('## Every pair');
  L.push('');
  L.push(row(['pair', 'normal', 'protan', 'deutan', 'tritan', 'grey (Y)', 'grey (601)', '']));
  L.push(row(['---', '---:', '---:', '---:', '---:', '---:', '---:', '---']));
  for (const p of R.pairs) L.push(row(['`' + p.a + '` · `' + p.b + '`', f(p.normal), f(p.protan), f(p.deutan), f(p.tritan), f(p.monoY), f(p.mono601), p.pass ? 'pass' : '**fail**']));
  L.push('');
  L.push('In greyscale, colour stops separating some pairs by design (v2.2 rule 1, ink first): those marks are told apart by the stroke pattern, the marker or the × glyph, and by the word beside them. Pairs that fall under ΔE 8 in either greyscale conversion, and what carries each:');
  L.push('');
  const carry = (p) => {
    const kind = (n) => (R.tokens.find((t) => t.name === n) || {}).kind;
    const s = [p.a, p.b].map((n) => ({ n, k: kind(n) }));
    if (s.some((x) => x.k === 'witness')) return 'the × glyph and its words';
    if (s.some((x) => x.k === 'identity')) return 'the series marker (■ against ● or ▲) and its label';
    if (s.some((x) => x.n === '--guide')) return 'the guide pattern 2 3 against the standing\'s pattern';
    return 'the stroke pattern';
  };
  const collapsed = R.pairs.filter((p) => Math.min(p.monoY, p.mono601) < FLOOR.cvd);
  if (!collapsed.length) L.push('- none');
  for (const p of collapsed) L.push('- `' + p.a + '` · `' + p.b + '`: grey ΔE ' + f(Math.min(p.monoY, p.mono601)) + ' — carried by ' + carry(p));
  L.push('');
  L.push('## Over a field');
  L.push('');
  L.push('Contrast of each text and mark colour drawn directly on each ramp step. Ink stays text-grade over every step. A colour under 3:1 on a step is drawn over a field on a paper-coloured casing (the kit\'s `on_field=True`), which gives it its contrast on paper back.');
  L.push('');
  L.push(row(['token'].concat(PR.RAMP.map((n) => '`' + n + '`')).concat(['bare on every step'])));
  L.push(row(['---'].concat(PR.RAMP.map(() => '---:')).concat(['---'])));
  for (const r of R.overField) L.push(row(['`' + r.name + '`'].concat(r.over.map((v) => f(v, 2))).concat([r.bare ? 'yes' : 'cased'])));
  L.push('');
  L.push('## The standings on paper');
  L.push('');
  L.push(row(['standing', 'class (screen)', 'token', 'value', 'dash at ' + PR.LINE_PT + ' pt', 'dash under ' + G.SMALL_BELOW + ' pt', 'cap']));
  L.push(row(['---', '---', '---', '---', '---', '---', '---']));
  for (const s of R.standings) L.push(row([s.standing, '`' + s.class + '`', s.token ? '`' + s.token + '`' : '— (no stroke)', s.hex ? '`' + s.hex + '`' : 'hatch `' + s.void.hatch + '`, ∅', s.dash === null ? (s.token ? 'solid' : '—') : '`' + s.dash + '`', s.dashSmall === null ? (s.token ? 'solid' : '—') : '`' + s.dashSmall + '`', s.cap || 'butt']));
  L.push(row(['guide (says nothing)', '—', '`' + R.guide.token + '`', '`' + R.guide.hex + '`', '`' + R.guide.dash + '`', '`' + R.guide.dash + '`', 'butt']));
  L.push('');
  L.push('Identity, at most three series per figure: ' + R.identity.map((i) => '`' + i.token + '` ' + i.glyph + (i.fallback ? ' (if not approved: `' + i.fallback + '` ' + i.glyph + ')' : '')).join(' · ') + '.');
  L.push('');
  L.push('## Red controls');
  L.push('');
  L.push('Each plants one defect in a copy of the register and runs the same check on it. A control passes when the check refuses the planted palette.');
  L.push('');
  L.push(row(['', 'planted', 'attacks', 'refused', 'what the check said']));
  L.push(row(['---', '---', '---', '---', '---']));
  for (const r of R.redControls) L.push(row([r.id, r.what, r.attacks, r.refused ? 'yes' : '**NO**', r.detail.replace(/\|/g, '\\|')]));
  L.push('');
  L.push('## Inputs');
  L.push('');
  for (const [k, v] of Object.entries(R.inputs)) L.push('- `' + k + '` sha256 `' + v + '`');
  L.push('');
  return L.join('\n');
}

if (require.main === module) {
  const R = run();
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(R, null, 1) + '\n');
  fs.writeFileSync(path.join(__dirname, 'REPORT.md'), md(R));
  for (const c of R.checks) console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.id + ' ' + c.name + '   [' + c.detail + ']');
  console.log('\n    red controls');
  for (const r of R.redControls) console.log('       ' + (r.refused ? 'RED ok  ' : 'RED FAIL  ') + r.id + ' (' + r.attacks + ') ' + r.what);
  const nRed = R.redControls.filter((r) => r.refused).length;
  console.log('\n' + (R.verdict === 'PASS' ? 'ALL PASS' : 'FAILED') + '   (' + R.checks.length + ' checks, ' + nRed + '/' + R.redControls.length + ' red controls) — design/print/REPORT.md, design/print/report.json');
  process.exit(R.verdict === 'PASS' ? 0 : 1);
}

module.exports = { CHECKS, PALETTE, REDS, run, FLOOR };
