#!/usr/bin/env node
/* lingua.js — the English mirror's guard and glossary: an English content file may change words, never a number.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   THE RULE (the operator, 2026-11-16, building /atalaia/en/): every number, stage and source on an English page is the
   Portuguese page's. Three ways that holds, all here, all read by vitrine.js:

   1. The missions (data/missoes.json, pinned) are never retyped. conteudo/en/missoes.json carries their WORDS only
      (titles, phases, labels, caveats, one English line per source); every value, unit, stage, verdict, time and film is
      read from the pinned Portuguese record and localized here by rule: a value's decimal comma becomes a point and its
      thousands point a comma (valorEn), a unit and a stage go through the glossaries below (unidadeEn, estagioEn), and a
      unit, stage or value word this file does not know refuses the build.
   2. Every English string that sits where a Portuguese one sits (conteudo/en/lp.json and investidores.json mirror their
      Portuguese files key by key; a post mirrors its front-matter and its body; a mission's words mirror its record's)
      must carry THE SAME NUMBERS: the same digit runs and the same locale-read values, as multisets (word order changes
      in translation), with month names read as their numbers and links compared whole. comparar() refuses the first
      string that differs and says which numbers moved.
   3. A stage written in English must be the same KIND of stage as the Portuguese one beside it (simulation, real data,
      calculation, published by others, illustrative: the five chips of vitrine.js), and a source line in English must
      name the same files and links as the Portuguese one.

   It also holds the English pages to their words: no "certif…", no "the first", no em dash.

   usage: node apps/atalaia/lingua.js                         check every English content file that exists
          node apps/atalaia/lingua.js missoes <file> [--parcial]   check one missions layer (--parcial: only the missions it has)
          node apps/atalaia/lingua.js lp|investidores <file>  check one mirrored JSON file
          node apps/atalaia/lingua.js post <pt.md> <en.md>    check one post                                          */
'use strict';
const fs = require('fs');
const path = require('path');
const die = (m) => { console.error('ATALAIA ENGLISH REFUSED: ' + m); process.exit(1); };

/* ---- the numbers in a string, read in its own language */
const MESES = { pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
/* a month is a number only beside a number ("16 de novembro", "novembro de 2026", "16 November", "January 2025"), so
   "may" the verb and "em janeiro" the phrase stay words */
const RE_MES = {
  pt: new RegExp('(\\d\\s+de\\s+)(' + MESES.pt.join('|') + ')(?![\\wà-ú])|(?<![\\wà-ú])(' + MESES.pt.join('|') + ')(?=\\s+de\\s+\\d)', 'gi'),
  en: new RegExp('(\\d\\s+)(' + MESES.en.join('|') + ')\\b|\\b(' + MESES.en.join('|') + ')(?=\\s+\\d)', 'g') };
const SPLIT = /[\s–—()[\]{}"“”'‘’«»;!?=→←↔×≈≤≥<>|*_~$€£]+/;
const URL = /(?:https?:\/\/|mailto:|www\.)[^\s)>\]"”]+|(?<=^|[\s(["'“])\/[a-z0-9][^\s)>\]"”,;]*/gi;
function ler(s, lang) {
  let t = ' ' + String(s == null ? '' : s) + ' ';
  const urls = [];
  t = t.replace(URL, (u) => { urls.push(u.replace(/[.,;:!?]+$/, '')); return ' '; });
  /* a section with its paragraph letter ("RBAC nº 100, 100.107(a)(2)") is a name in both languages, never a value */
  t = t.replace(/(\d+(?:[.,]\d+)+)(?=\()/g, '§$1');
  t = t.replace(RE_MES[lang], (m, pre, a, b) => (pre || '') + ' ' + (MESES[lang].findIndex((x) => x.toLowerCase() === (a || b).toLowerCase()) + 1) + ' ');
  const runs = [], vals = [], mal = [];
  for (let w of t.split(SPLIT)) {
    w = w.replace(/^[.,:]+/, '').replace(/[.,:%°ºª]+$/, '');
    if (!/\d/.test(w)) continue;
    runs.push(...w.match(/\d+/g).map(Number));
    const m = /^([−+-]?)(.*)$/.exec(w), sg = m[1] === '−' || m[1] === '-' ? -1 : 1, b = m[2];
    if (/[^\d.,]/.test(b)) continue;                                     /* a code, a date, a time, a file: digit runs only */
    if (!/[.,]/.test(b)) continue;                                       /* a plain integer: its run says it all */
    const ok = lang === 'pt' ? /^\d{1,3}(\.\d{3})+(,\d+)?$|^\d+,\d+$/.test(b) : /^\d{1,3}(,\d{3})+(\.\d+)?$|^\d+\.\d+$/.test(b);
    if (ok) vals.push({ w, v: sg * Number(lang === 'pt' ? b.replace(/\./g, '').replace(',', '.') : b.replace(/,/g, '')) });
    else mal.push(w);                                                    /* "4.35.0", "2.1": a version or a section, read as runs */
  }
  return { runs, vals, mal, urls };
}
const multi = (a) => JSON.stringify(a.slice().sort((x, y) => (x > y) - (x < y)));
const dif = (a, b) => { const r = b.slice(); const out = []; for (const x of a) { const i = r.indexOf(x); if (i < 0) out.push(x); else r.splice(i, 1); } return out; };
/* the same numbers, or a refusal that says which moved */
function comparar(pt, en, where) {
  const P = ler(pt, 'pt'), E = ler(en, 'en');
  /* a section number or a version ("ENR 2.1", "Lean 4.35.0") reads as no number in Portuguese and as a decimal in
     English: the same word, verbatim on both sides, is a name, not a value */
  const ev = E.vals.filter((x) => !P.mal.includes(x.w)).map((x) => x.v), pv = P.vals.map((x) => x.v);
  const bad = [];
  if (multi(P.runs) !== multi(E.runs)) bad.push('digits only in pt: [' + dif(P.runs, E.runs).join(', ') + '], only in en: [' + dif(E.runs, P.runs).join(', ') + ']');
  if (multi(pv) !== multi(ev)) bad.push('values only in pt: [' + dif(pv, ev).join(', ') + '], only in en: [' + dif(ev, pv).join(', ') + '] (a decimal point and a thousands comma in English)');
  if (multi(P.urls) !== multi(E.urls)) bad.push('links only in pt: [' + dif(P.urls, E.urls).join(', ') + '], only in en: [' + dif(E.urls, P.urls).join(', ') + ']');
  if (bad.length) die(where + ': the English changes a number.\n  pt: ' + String(pt).slice(0, 400) + '\n  en: ' + String(en).slice(0, 400) + '\n  ' + bad.join('\n  '));
  palavras(en, where);
}
/* the English pages' words (the operator, 2026-11-16) */
const VETADAS = [[/certif/i, '"certif…" (say verifiable, test report, proof)'], [/\bthe first\b/i, '"the first"'], [/—/, 'an em dash']];
function palavras(en, where) { for (const [re, w] of VETADAS) { const m = re.exec(String(en)); if (m) die(where + ' uses ' + w + ': …' + String(en).slice(Math.max(0, m.index - 50), m.index + 40) + '…'); } }

/* ---- the five kinds of stage (vitrine.js), read in each language; the order of the tests is the same */
const TIPOS = {
  pt: [['i', /ilustra|propost|hip[oó]tes|estima|proje[cç]|exemplo|alvo|meta\b|indicativ|cen[aá]rio|premissa|planejad/i], ['c', /c[aá]lcul|modelo|calculad/i],
    ['r', /dados reais|gravad|vetores|prova formal|medid|campo|lean/i], ['f', /oficia|publicad|p[uú]blic|imprensa|relato|not[ií]cia|norma|lei\b/i]],
  en: [['i', /illustrat|propos|hypothe|estimat|project|example|target|goal\b|indicativ|scenario|premise|planned|assum/i], ['c', /calculat|model|computed/i],
    ['r', /real data|recorded|vectors|formal proof|measured|field|lean/i], ['f', /official|published|public|press|report|news|standard|law\b/i]] };
const tipo = (s, lang) => { for (const [k, re] of TIPOS[lang]) if (re.test(String(s || ''))) return k; return 's'; };
/* a stage that claims a field flight refuses the build in either language: nothing has flown */
const CAMPO = { pt: /validad[oa] em campo|voo real|voado|em campo/i, en: /field[- ]validated|validated in the field|real flight|has flown|flown|in the field/i };
/* the chip part of an `estado` ("PROPOSTO; the rest", "existe: the rest"), as landing.js estado() splits it */
const chip = (s) => String(s || '').split(/[:;]/)[0].trim();
function mesmoEstagio(pt, en, where, dividir) {
  const a = dividir ? chip(pt) : pt, b = dividir ? chip(en) : en;
  if (tipo(a, 'pt') !== tipo(b, 'en')) die(where + ': the stage "' + en + '" is not the same kind as "' + pt + '" (' + tipo(b, 'en') + ' against ' + tipo(a, 'pt') + ')');
  if (CAMPO.en.test(b)) die(where + ': the stage "' + en + '" claims a field flight; nothing has flown');
}

/* ---- the glossaries the missions' values, units and stages go through (the record is never retyped) */
const ESTAGIO_EN = { 'simulação': 'simulation', 'cálculo': 'calculation', 'proposto': 'proposed', 'cálculo (modelo ilustrativo)': 'calculation (illustrative model)',
  'dados oficiais': 'official data', 'relato publicado': 'published report', 'ilustrativo': 'illustrative' };
function estagioEn(s, where) {
  if (!s) return s;
  const e = ESTAGIO_EN[s];
  if (!e) die((where || 'a mission') + ': the stage "' + s + '" has no English in lingua.js ESTAGIO_EN');
  mesmoEstagio(s, e, where || 'ESTAGIO_EN');
  return e;
}
const UNIDADE_EN = { 'voos': 'flights', 'dado': 'data point', '% da distância': '% of the distance' };
function unidadeEn(u, where) {
  if (u === undefined || u === null) return u;
  if (/^(|m|s|%|min|Wh|km|kg|m\/s|ft \(MSL\))$/.test(u)) return u;
  const de = /^de (\d+)$/.exec(u);
  if (de) return 'of ' + de[1];
  if (u in UNIDADE_EN) return UNIDADE_EN[u];
  return die((where || 'a mission') + ': the unit "' + u + '" has no English in lingua.js UNIDADE_EN');
}
/* a value as the record writes it ("−1.213 a +722", "14,9 / 46,0", "8 de 8"), as an English reader reads it */
const VALOR_PALAVRAS = [['da superfície a', 'from the surface to'], ['até', 'up to'], ['proposto', 'proposed'], ['de', 'of'], ['em', 'in'], ['a', 'to'], ['e', 'and']];
const VALOR_OK = /^(from|the|surface|to|up|proposed|of|in|and|m|s|h|km|min|Wh|kg|ft|MSL)$/;
function valorEn(v, where) {
  if (typeof v !== 'string') return v;
  let t = v.replace(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+/g, (m) => { const [i, d] = m.replace(/\./g, '').split(','); return Number(i).toLocaleString('en-US') + (d !== undefined ? '.' + d : ''); });
  for (const [a, b] of VALOR_PALAVRAS) t = t.replace(new RegExp('(^|\\s)' + a + '(?=\\s|$)', 'g'), '$1' + b);
  for (const w of t.split(/[^A-Za-zÀ-ÖØ-öø-ÿ]+/).filter(Boolean)) if (!VALOR_OK.test(w)) die((where || 'a mission') + ': the value "' + v + '" keeps the word "' + w + '" in English (' + t + '); teach lingua.js VALOR_PALAVRAS');
  comparar(v, t, (where || 'a mission') + ' (the value)');
  return t;
}
/* a source line: the same files and links, the same numbers; words may be English */
/* a slashed date (15/11/2026) is not a file: comparar() reads it as its numbers, so English may write the month's name */
const ARQUIVOS = (s) => (String(s).match(/(?:https?:\/\/\S+|[\w.-]+(?:\/[\w.-]+)+|[\w-]+\.(?:json|py|js|md|pdf|html))/g) || []).map((x) => x.replace(/[.,;:)]+$/, '')).filter((x) => !/^[\d\/.]+$/.test(x));
function fonteEn(pt, mapa, where) {
  if (!pt) return pt;
  if (typeof pt !== 'string') return pt;
  const en = mapa && mapa[pt];
  if (!en) die(where + ': the source "' + pt + '" has no English line in conteudo/en/missoes.json "fontes"');
  if (multi(ARQUIVOS(pt)) !== multi(ARQUIVOS(en))) die(where + ': the English source names other files or links.\n  pt: ' + pt + '\n  en: ' + en);
  comparar(pt, en, where + ' (the source)');
  return en;
}

/* ---- a mirrored JSON file: the same keys, the same lengths, the same numbers and links, the same kinds of stage */
function conferirArvore(pt, en, where) {
  if (typeof pt === 'string') { if (typeof en !== 'string') die(where + ' is ' + typeof en + ' in English, a string in Portuguese'); comparar(pt, en, where); return; }
  if (pt === null || typeof pt !== 'object') { if (en !== pt) die(where + ' is ' + JSON.stringify(pt) + ' in Portuguese and ' + JSON.stringify(en) + ' in English'); return; }
  if (Array.isArray(pt)) {
    if (!Array.isArray(en) || en.length !== pt.length) die(where + ' has ' + pt.length + ' items in Portuguese and ' + (Array.isArray(en) ? en.length : 'none') + ' in English');
    pt.forEach((x, i) => conferirArvore(x, en[i], where + '[' + i + ']'));
    return;
  }
  if (!en || typeof en !== 'object' || Array.isArray(en)) die(where + ' is not an object in English');
  for (const k of Object.keys(pt)) if (!k.startsWith('_') && !(k in en)) die(where + '.' + k + ' is missing in English');
  for (const k of Object.keys(en)) if (!k.startsWith('_') && !(k in pt)) die(where + '.' + k + ' is in English only');
  for (const k of Object.keys(pt)) {
    if (k.startsWith('_')) continue;
    const w = where + '.' + k;
    if ((k === 'u' || k === 'id' || k === 'slug') && typeof pt[k] === 'string') { if (en[k] !== pt[k]) die(w + ' must stay "' + pt[k] + '" (the renderer points it at the English page), not "' + en[k] + '"'); continue; }
    if ((k === 'estagio' || k === 'estado') && typeof pt[k] === 'string') mesmoEstagio(pt[k], en[k], w, k === 'estado');
    conferirArvore(pt[k], en[k], w);
  }
}

/* ---- the missions layer: the record with its words in English */
const TEXTO_MISSAO = ['titulo', 'subtitulo', 'lugar', 'publico', 'gancho', 'prova'];
function missoesEn(PT, EN, parcial) {
  if (!EN || typeof EN.missoes !== 'object' || Array.isArray(EN.missoes)) die('conteudo/en/missoes.json has no "missoes" object keyed by slug');
  for (const k of Object.keys(EN.missoes)) if (!PT.missoes.some((m) => m.slug === k)) die('conteudo/en/missoes.json has a mission the record does not: ' + k);
  const out = [];
  for (const m of PT.missoes) {
    const e = EN.missoes[m.slug], w = 'mission ' + m.slug;
    if (!e) { if (parcial) continue; die(w + ' has no English in conteudo/en/missoes.json'); }
    const x = JSON.parse(JSON.stringify(m));
    for (const k of TEXTO_MISSAO) if (m[k] !== undefined && m[k] !== null) { if (typeof e[k] !== 'string') die(w + '.' + k + ' has no English'); comparar(m[k], e[k], w + '.' + k); x[k] = e[k]; }
    if (!Array.isArray(e.historia) || e.historia.length !== m.historia.length) die(w + '.historia has ' + m.historia.length + ' phases in the record and ' + (e.historia || []).length + ' in English');
    x.historia = m.historia.map((h, i) => {
      const f = e.historia[i] || {};
      for (const k of ['fase', 'texto']) if (h[k]) { if (typeof f[k] !== 'string') die(w + '.historia[' + i + '].' + k + ' has no English'); comparar(h[k], f[k], w + '.historia[' + i + '].' + k); }
      return { t: h.t, estado: h.estado, fase: f.fase || h.fase, texto: f.texto || h.texto };
    });
    for (const s of ['sem', 'com']) {
      const ps = m[s], es = e[s] || {};
      for (const k of ['titulo', 'texto']) if (ps[k]) { if (typeof es[k] !== 'string') die(w + '.' + s + '.' + k + ' has no English'); comparar(ps[k], es[k], w + '.' + s + '.' + k); x[s][k] = es[k]; }
      if (ps.numero) {
        const n = ps.numero, xn = x[s].numero;
        if (n.rotulo) { if (typeof es.rotulo !== 'string') die(w + '.' + s + '.rotulo has no English'); comparar(n.rotulo, es.rotulo, w + '.' + s + '.rotulo'); xn.rotulo = es.rotulo; }
        xn.v = valorEn(n.v, w + '.' + s); xn.u = unidadeEn(n.u, w + '.' + s); xn.estagio = estagioEn(n.estagio, w + '.' + s); xn.fonte = fonteEn(n.fonte, EN.fontes, w + '.' + s);
      }
    }
    if (!Array.isArray(e.metricas) || e.metricas.length !== m.metricas.length) die(w + '.metricas has ' + m.metricas.length + ' rows in the record and ' + (e.metricas || []).length + ' in English');
    x.metricas = m.metricas.map((r, i) => {
      const k = e.metricas[i];
      if (typeof k !== 'string') die(w + '.metricas[' + i + '] has no English label');
      comparar(r.k, k, w + '.metricas[' + i + ']');
      return { k, v: valorEn(r.v, w + '.metricas[' + i + ']'), u: unidadeEn(r.u, w + '.metricas[' + i + ']'), estagio: estagioEn(r.estagio, w + '.metricas[' + i + ']'), fonte: fonteEn(r.fonte, EN.fontes, w + '.metricas[' + i + ']') };
    });
    x.estagio = estagioEn(m.estagio, w);
    const pr = m.ressalvas || [], er = e.ressalvas || [];
    if (pr.length !== er.length) die(w + '.ressalvas has ' + pr.length + ' caveats in the record and ' + er.length + ' in English');
    x.ressalvas = pr.map((r, i) => { const t = typeof r === 'string' ? r : r.texto || r.t || ''; comparar(t, er[i], w + '.ressalvas[' + i + ']'); return er[i]; });
    out.push(x);
  }
  if (typeof EN.aviso !== 'string') { if (!parcial) die('conteudo/en/missoes.json has no "aviso"'); }
  else comparar(PT.aviso, EN.aviso, 'missions aviso');
  return Object.assign({}, PT, { aviso: EN.aviso, missoes: out });
}

/* ---- a post: its front-matter field by field, its body as a whole, its headings counted */
function conferirPost(pt, en, where) {
  for (const k of ['titulo', 'resumo']) if (pt.meta[k]) { if (typeof en.meta[k] !== 'string') die(where + ' has no English ' + k); comparar(pt.meta[k], en.meta[k], where + ' ' + k); }
  if (String(pt.meta.data) !== String(en.meta.data)) die(where + ': the date is ' + pt.meta.data + ' in Portuguese and ' + en.meta.data + ' in English');
  const pf = [].concat(pt.meta.fontes || []), ef = [].concat(en.meta.fontes || []);
  if (pf.length !== ef.length) die(where + ' has ' + pf.length + ' sources in Portuguese and ' + ef.length + ' in English');
  pf.forEach((f, i) => conferirArvore(f, ef[i], where + ' fontes[' + i + ']'));
  const hp = (pt.body.match(/^#{1,4}\s/gm) || []).length, he = (en.body.match(/^#{1,4}\s/gm) || []).length;
  if (hp !== he) die(where + ' has ' + hp + ' headings in Portuguese and ' + he + ' in English');
  comparar(pt.body, en.body, where + ' (the body)');
}

module.exports = { ler, comparar, palavras, tipo, CAMPO, mesmoEstagio, ESTAGIO_EN, estagioEn, unidadeEn, valorEn, fonteEn, conferirArvore, missoesEn, conferirPost, VETADAS };

/* ---- the command line: the same checks the build runs, for whoever writes an English file */
if (require.main === module) {
  const DIR = __dirname, EN = path.join(DIR, 'conteudo', 'en');
  const json = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return die(p + ': ' + e.message); } };
  const fm = (p) => require('./vitrine.js').frontMatter(fs.readFileSync(p, 'utf8'));
  const [cmd, a, b] = process.argv.slice(2);
  const said = [];
  if (cmd === 'missoes') { const r = missoesEn(json(path.join(DIR, 'data', 'missoes.json')), json(a), process.argv.includes('--parcial')); said.push(a + ': ' + r.missoes.length + ' missions'); }
  else if (cmd === 'lp' || cmd === 'investidores') { conferirArvore(json(path.join(DIR, 'conteudo', cmd + '.json')), json(a), cmd); said.push(a); }
  else if (cmd === 'post') { conferirPost(fm(a), fm(b), path.basename(b)); said.push(b); }
  else if (!cmd) {
    for (const f of ['lp', 'investidores']) if (fs.existsSync(path.join(EN, f + '.json'))) { conferirArvore(json(path.join(DIR, 'conteudo', f + '.json')), json(path.join(EN, f + '.json')), f); said.push('en/' + f + '.json'); }
    if (fs.existsSync(path.join(EN, 'missoes.json'))) { const r = missoesEn(json(path.join(DIR, 'data', 'missoes.json')), json(path.join(EN, 'missoes.json'))); said.push('en/missoes.json (' + r.missoes.length + ' missions)'); }
    const BL = path.join(EN, 'blog');
    if (fs.existsSync(BL)) for (const f of fs.readdirSync(BL).filter((x) => x.endsWith('.md'))) {
      const p = path.join(DIR, 'conteudo', 'blog', f);
      if (!fs.existsSync(p)) die('en/blog/' + f + ' has no Portuguese post of the same name');
      conferirPost(fm(p), fm(path.join(BL, f)), 'en/blog/' + f); said.push('en/blog/' + f);
    }
  } else die('usage: node apps/atalaia/lingua.js [missoes <file> [--parcial] | lp <file> | investidores <file> | post <pt.md> <en.md>]');
  console.log('ATALAIA ENGLISH OK: ' + (said.length ? said.join(', ') : 'no English file yet') + ' — every number as in Portuguese');
}
