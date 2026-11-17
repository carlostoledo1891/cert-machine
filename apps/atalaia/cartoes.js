/* cartoes.js — the Atalaia share cards (og:image, twitter:image), one per page kind and language, drawn from the records.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   The house rule (the operator, 2026-11-07): every page that gets shared carries its own LIGHT, illustrated card, never
   the site's landing card. tools/build-og-report.js renders these (CARDS takes them from here) in the house page shell
   and writes design/assets/og-<key>.png with its receipt; vitrine.js names the card in each Atalaia page's head and
   copies it to site/atalaia/og/, where it is served. No number is printed on a card (a card is rendered once, a number on it
   could go stale unseen): the drawings are made FROM the numbers, read here from the pinned records, and say so in words.

     atalaia[-en]                the landing: the hills mission's two landings, drawn to scale from data/missoes.json
                                 (the autopilot alone against the box, the GNSS dragged off course halfway) and ilha.json
     atalaia[-en]-missoes        the missions: three energy margins in the worst case against zero, from ilha.json, one
                                 wholly short (× fails), one across zero (∅ needs data), one wholly clear (✓ passes)
     atalaia[-en]-investidores   the investors' page: the gates in order, from conteudo/lp.json, the one passed filled  */
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./registros.js');
const die = (m) => { throw new Error('ATALAIA CARDS: ' + m); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f1 = (x) => Number(x).toFixed(1);

const W = {
  pt: { eyebrow: 'Atalaia · integridade verificável', lie: 'o GNSS passa a mentir', alone: 'piloto automático sozinho', box: 'com o Atalaia', base: 'base', post: 'posto',
    region: 'região de proteção', stageA: 'simulação · posto nos morros', zero: 'reserva no pouso', short: 'falta energia', clear: 'sobra energia', stageM: 'cálculo · pior caso de energia',
    v: { 'PASSA': '✓ PASSA', 'NAO PASSA': '× NÃO PASSA', 'FALTA DADO': '∅ FALTA DADO' },
    tM: 'Cada missão com o seu veredito antes de decolar', tI: 'Para investidores: nada se compra antes de um portão passar', passed: 'passou', next: 'proposto' },
  en: { eyebrow: 'Atalaia · verifiable integrity', lie: 'GNSS starts lying', alone: 'autopilot alone', box: 'with Atalaia', base: 'base', post: 'post',
    region: 'protection region', stageA: 'simulation · the hills post', zero: 'landing reserve', short: 'energy short', clear: 'energy to spare', stageM: 'calculation · worst-case energy',
    v: { 'PASSA': '✓ PASS', 'NAO PASSA': '× FAIL', 'FALTA DADO': '∅ NEEDS DATA' },
    tM: 'Every mission gets its verdict before take-off', tI: 'For investors: nothing is bought before a gate is passed', passed: 'passed', next: 'proposed' } };

/* ---- the landing: the two landings of the hills mission, to scale along and across the route */
function morros(lang) {
  const w = W[lang];
  const M = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'missoes.json'), 'utf8')).missoes.find((m) => m.slug === 'posto-nos-morros');
  if (!M || M.sem.numero.u !== 'm' || M.com.numero.u !== 'm') die('the hills mission or its landing distances moved');
  const km = R.ILM.morros.km, alone = M.sem.numero.v, boxed = M.com.numero.v;
  const ataque = Number((/A (\d+)% da ida/.exec(M.historia.map((h) => h.texto).join(' ')) || [])[1]) / 100;
  const desvio = Number(String((/chega a ([\d,]+) m da rota/.exec(M.historia.map((h) => h.texto).join(' ')) || [])[1] || '').replace(',', '.'));
  if (!(ataque > 0 && ataque < 1) || !(desvio > 0) || !(km > 0)) die('the hills mission no longer says where the attack starts or how far the box drifted');
  const A = [40, 70], B = [350, 310];                                    /* base and post, at the route's true length */
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]), px = L / (km * 1000);  /* pixels per metre, the same both ways */
  const u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [u[1], -u[0]];   /* along, and across to the right of travel */
  const at = (f, off) => [A[0] + u[0] * L * f + n[0] * off, A[1] + u[1] * L * f + n[1] * off];
  const trilha = (fn, k) => { const p = []; for (let i = 0; i <= k; i++) { const f = i / k; p.push(at(f, fn(f))); } return 'M' + p.map((q) => f1(q[0]) + ',' + f1(q[1])).join(' L'); };
  /* alone: on the route until the attack, then drifting away until it lands `alone` metres off the post */
  const offA = (f) => f <= ataque ? 0 : -alone * px * Math.pow((f - ataque) / (1 - ataque), 1.35);
  /* with the box: a bump of `desvio` metres just after the gate refuses the GNSS, back on the route, landing on the post */
  const fg = ataque + 0.16, offB = (f) => f <= ataque ? 0 : -desvio * px * Math.exp(-Math.pow((f - fg) / 0.07, 2));
  const rr = 100 * px;                                                   /* the emulated region's radius, 100 m, to scale */
  const tube = []; for (let i = 0; i <= 40; i++) { const f = ataque - 0.04 + (1.04 - ataque) * i / 40; tube.push(at(Math.min(f, 1), offB(Math.min(f, 1)) + rr)); }
  for (let i = 40; i >= 0; i--) { const f = ataque - 0.04 + (1.04 - ataque) * i / 40; tube.push(at(Math.min(f, 1), offB(Math.min(f, 1)) - rr)); }
  const endA = at(1, offA(1)), lie = at(ataque, 0);
  const T = (x, y, t, cls, anchor) => '<text x="' + f1(x) + '" y="' + f1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + ' class="' + cls + '">' + esc(t) + '</text>';
  const o = ['<svg viewBox="0 0 470 430" width="470" height="430" role="img" aria-label="' + esc(lang === 'pt'
    ? 'Duas trilhas da base ao posto, em escala: no meio do caminho o GNSS passa a mentir; o piloto automático sozinho deriva e pousa longe do posto; com o Atalaia o drone fica dentro da região de proteção e pousa no posto. Simulação.'
    : 'Two tracks from base to post, to scale: halfway the GNSS starts lying; the autopilot alone drifts and lands far from the post; with Atalaia the drone stays inside the protection region and lands on the post. Simulation.') + '">'];
  o.push('<style>.c-l{font-size:15px;fill:var(--ink-3)}.c-k{font-size:15px;fill:var(--ink);font-weight:550}.c-s{font-size:13px;fill:var(--ink-4);letter-spacing:.06em;text-transform:uppercase}</style>');
  o.push('<path d="M' + tube.map((q) => f1(q[0]) + ',' + f1(q[1])).join(' L') + ' Z" fill="var(--band-fill)" stroke="var(--rule-strong)" stroke-width="1"/>');
  o.push('<line x1="' + A[0] + '" y1="' + A[1] + '" x2="' + B[0] + '" y2="' + B[1] + '" stroke="var(--rule-strong)" stroke-width="1.2"/>');
  o.push('<path d="' + trilha(offA, 120) + '" fill="none" stroke="var(--ink-3)" stroke-width="2.2" stroke-linecap="round"/>');
  o.push('<path d="' + trilha(offB, 120) + '" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>');
  /* the attack: a short bar across the route where the GNSS starts lying */
  o.push('<line x1="' + f1(lie[0] - n[0] * 22) + '" y1="' + f1(lie[1] - n[1] * 22) + '" x2="' + f1(lie[0] + n[0] * 22) + '" y2="' + f1(lie[1] + n[1] * 22) + '" stroke="var(--ink)" stroke-width="1.6"/>');
  o.push(T(lie[0] + 26, lie[1] - 14, w.lie, 'c-k', 'start'));
  o.push('<circle cx="' + A[0] + '" cy="' + A[1] + '" r="7" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>' + T(A[0] + 16, A[1] - 12, w.base, 'c-l', 'start'));
  o.push('<circle cx="' + f1(endA[0]) + '" cy="' + f1(endA[1]) + '" r="7" fill="var(--paper)" stroke="var(--ink-3)" stroke-width="2.2"/>' + T(endA[0] - 14, endA[1] + 24, w.alone, 'c-l', 'end'));
  o.push('<circle cx="' + B[0] + '" cy="' + B[1] + '" r="12" fill="none" stroke="var(--ink)" stroke-width="1.4"/><circle cx="' + B[0] + '" cy="' + B[1] + '" r="6" fill="var(--ink)"/>');
  o.push(T(B[0] + 18, B[1] - 16, w.box, 'c-k', 'start'));
  const mid = at(0.62, rr + 8);
  o.push(T(mid[0] + 10, mid[1] - 4, w.region, 'c-l', 'start'));
  o.push(T(14, 420, w.stageA, 'c-s', 'start'));
  o.push('</svg>');
  return o.join('');
}

/* ---- the missions: three worst-case energy margins against zero, one per verdict */
function margens(lang) {
  const w = W[lang];
  const rows = [['costa-base', 'NAO PASSA'], ['costa-rv', 'FALTA DADO'], ['morros', 'PASSA']].map(([k, v]) => {
    const e = R.ILM[k].energia12;
    if (e.verdict !== v || !Array.isArray(e.margin_wh)) die('the ' + k + ' energy verdict is no longer ' + v);
    return { lo: e.margin_wh[0], hi: e.margin_wh[1], v };
  });
  const lo = Math.min(...rows.map((r) => r.lo)), hi = Math.max(...rows.map((r) => r.hi));
  const x0 = 30, x1 = 440, X = (v) => x0 + (v - lo) / (hi - lo) * (x1 - x0), z = X(0);
  const o = ['<svg viewBox="0 0 470 430" width="470" height="430" role="img" aria-label="' + esc(lang === 'pt'
    ? 'Três margens de energia no pior caso, contra a reserva no pouso: uma inteira abaixo (não passa), uma que cruza a reserva (falta dado) e uma inteira acima (passa). Cálculo.'
    : 'Three worst-case energy margins against the landing reserve: one wholly below (fails), one across it (needs data) and one wholly above (passes). Calculation.') + '">'];
  o.push('<style>.c-l{font-size:15px;fill:var(--ink-3)}.c-k{font-size:15px;fill:var(--ink);font-weight:600;letter-spacing:.04em}.c-s{font-size:13px;fill:var(--ink-4);letter-spacing:.06em;text-transform:uppercase}</style>');
  o.push('<rect x="' + f1(z) + '" y="40" width="' + f1(x1 + 10 - z) + '" height="300" fill="var(--band-fill)"/>');
  o.push('<line x1="' + f1(z) + '" y1="30" x2="' + f1(z) + '" y2="350" stroke="var(--ink)" stroke-width="1.6"/>');
  o.push('<text x="' + f1(z) + '" y="372" text-anchor="middle" class="c-l">' + esc(w.zero) + '</text>');
  o.push('<text x="' + f1(z - 12) + '" y="24" text-anchor="end" class="c-l">← ' + esc(w.short) + '</text><text x="' + f1(z + 12) + '" y="24" class="c-l">' + esc(w.clear) + ' →</text>');
  rows.forEach((r, i) => {
    const y = 92 + i * 100, a = X(r.lo), b = X(r.hi);
    const cls = r.v === 'PASSA' ? 'fill="var(--ink)" stroke="var(--ink)"' : r.v === 'NAO PASSA' ? 'fill="var(--paper)" stroke="var(--ink)"' : 'fill="var(--paper)" stroke="var(--ink-3)"';
    o.push('<rect x="' + f1(a) + '" y="' + (y - 13) + '" width="' + f1(b - a) + '" height="26" rx="13" ' + cls + ' stroke-width="2.2"/>');
    /* each verdict on its own side of the reserve line, never across it */
    const lx = r.v === 'NAO PASSA' ? a : r.v === 'PASSA' ? b : z - 12;
    o.push('<text x="' + f1(lx) + '" y="' + (y + 40) + '" text-anchor="' + (r.v === 'NAO PASSA' ? 'start' : 'end') + '" class="c-k">' + esc(w.v[r.v]) + '</text>');
  });
  o.push('<text x="14" y="420" class="c-s">' + esc(w.stageM) + '</text>');
  o.push('</svg>');
  return o.join('');
}

/* ---- the investors' page: the gates in order, the one passed filled, the rest hollow (proposed) */
function portoes(lang) {
  const w = W[lang];
  const L = JSON.parse(fs.readFileSync(path.join(__dirname, 'conteudo', lang === 'pt' ? 'lp.json' : 'en/lp.json'), 'utf8'));
  const G = (L.roadmap && L.roadmap.portoes) || [];
  if (G.length < 3) die('the roadmap has fewer than three gates');
  const done = G.map((g) => /^(passou|passed)\b/i.test(String(g.estado || '')));
  if (!done[0] || done.slice(1).some(Boolean)) die('the gates passed are no longer exactly G0');
  const y = 190, x0 = 50, x1 = 420, dx = (x1 - x0) / (G.length - 1);
  const o = ['<svg viewBox="0 0 470 430" width="470" height="430" role="img" aria-label="' + esc(lang === 'pt'
    ? 'Os portões do plano em ordem: o primeiro preenchido, passou em simulação; os outros vazios, propostos.'
    : 'The plan\'s gates in order: the opening one filled, passed in simulation; the others hollow, proposed.') + '">'];
  o.push('<style>.c-l{font-size:15px;fill:var(--ink-3)}.c-k{font-size:20px;fill:var(--ink);font-weight:600}.c-m{font-size:15px;fill:var(--ink);font-weight:600}.c-s{font-size:13px;fill:var(--ink-4);letter-spacing:.06em;text-transform:uppercase}</style>');
  o.push('<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="var(--rule-strong)" stroke-width="2"/>');
  G.forEach((g, i) => {
    const x = x0 + i * dx;
    o.push('<circle cx="' + f1(x) + '" cy="' + y + '" r="' + (done[i] ? 20 : 18) + '" ' + (done[i] ? 'fill="var(--ink)" stroke="var(--ink)"' : 'fill="var(--paper)" stroke="var(--ink-3)"') + ' stroke-width="2.4"/>');
    if (done[i]) o.push('<path d="M' + f1(x - 8) + ',' + (y + 1) + ' l6,6 l11,-13" fill="none" stroke="var(--paper)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
    o.push('<text x="' + f1(x) + '" y="' + (y - 40) + '" text-anchor="middle" class="' + (String(g.id).length > 3 ? 'c-m' : 'c-k') + '">' + esc(lang === 'en' && g.id === 'Campanha' ? 'Campaign' : g.id) + '</text>');
    const words = String(g.t).split(' '), lines = [];
    for (const wd of words) { if (lines.length && (lines[lines.length - 1] + ' ' + wd).length <= 12) lines[lines.length - 1] += ' ' + wd; else lines.push(wd); }
    lines.slice(0, 3).forEach((ln, k) => o.push('<text x="' + f1(x) + '" y="' + (y + 48 + k * 19) + '" text-anchor="middle" class="c-l">' + esc(ln) + '</text>'));
  });
  /* the key, drawn with the same marks as the gates */
  const ky = y + 132;
  o.push('<circle cx="' + (x0 - 12) + '" cy="' + (ky - 5) + '" r="7" fill="var(--ink)"/><text x="' + x0 + '" y="' + ky + '" class="c-l">' + esc(w.passed) + '</text>');
  o.push('<circle cx="' + (x0 + 110) + '" cy="' + (ky - 5) + '" r="7" fill="var(--paper)" stroke="var(--ink-3)" stroke-width="2"/><text x="' + (x0 + 122) + '" y="' + ky + '" class="c-l">' + esc(w.next) + '</text>');
  o.push('<text x="14" y="420" class="c-s">' + esc(lang === 'pt' ? 'o plano, portão a portão' : 'the plan, gate by gate') + '</text>');
  o.push('</svg>');
  return o.join('');
}

/* ---- the cards, as tools/build-og-report.js CARDS takes them */
function cards() {
  const out = {};
  for (const lang of ['pt', 'en']) {
    if (!fs.existsSync(path.join(__dirname, 'conteudo', lang === 'pt' ? 'lp.json' : 'en/lp.json'))) continue;   /* no words, no card */
    const w = W[lang], pre = lang === 'pt' ? 'atalaia' : 'atalaia-en', base = lang === 'pt' ? '/atalaia/' : '/atalaia/en/';
    const L = JSON.parse(fs.readFileSync(path.join(__dirname, 'conteudo', lang === 'pt' ? 'lp.json' : 'en/lp.json'), 'utf8'));
    const css = 'h1{font-size:46px;line-height:1.08}';
    out[pre] = { theme: 'light', eyebrow: w.eyebrow, path: base, title: L.hero.titulo, deck: '', css, svgRaw: morros(lang),
      alt: lang === 'pt' ? 'Em simulação, com o GNSS arrastado no meio do caminho: o piloto automático sozinho deriva e pousa longe do posto; com o Atalaia, o drone fica na região de proteção e pousa no posto.'
        : 'In simulation, with the GNSS dragged off course halfway: the autopilot alone drifts and lands far from the post; with Atalaia the drone stays in the protection region and lands on the post.' };
    out[pre + '-missoes'] = { theme: 'light', eyebrow: w.eyebrow, path: base + 'missoes/', title: w.tM, deck: '', css, svgRaw: margens(lang),
      alt: lang === 'pt' ? 'Três margens de energia no pior caso contra a reserva no pouso: uma não passa, uma falta dado, uma passa. Cálculo.'
        : 'Three worst-case energy margins against the landing reserve: one fails, one needs data, one passes. Calculation.' };
    out[pre + '-investidores'] = { theme: 'light', eyebrow: w.eyebrow, path: base + 'investidores/', title: w.tI, deck: '', css, svgRaw: portoes(lang),
      alt: lang === 'pt' ? 'Os portões do plano em ordem: o G0 passou em simulação; os outros são propostos.' : 'The plan\'s gates in order: G0 passed in simulation; the others are proposed.' };
  }
  return out;
}

module.exports = { cards };
