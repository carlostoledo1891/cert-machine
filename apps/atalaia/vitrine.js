/* vitrine.js — the ONE reading of the Atalaia content files, and the shell the marketing pages share, in two languages.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   WHAT IT READS. The content the landing (/atalaia/), the missions (/atalaia/missoes/), the investors' page
   (/atalaia/investidores/) and the blog (/atalaia/blog/) print, each file read and checked against its fixed schema here,
   once, so two pages can never read one file two ways:
     data/missoes.json            the missions (pinned by sha256 in data/PROVENANCE.json, like every record here)
     conteudo/lp.json             the landing's words
     conteudo/investidores.json   the investors' questions, each answer with its sources
     conteudo/blog/*.md           the posts: Markdown with a front-matter (titulo, data, resumo, fontes)
   A file that is not there is a page left out (null here), never a page built from a placeholder. While the content is
   being written, ATALAIA_STUBS may name a folder OUTSIDE this repository holding files of the same shape; every page
   built from one says so on its console line, and none of those files or pages is ever committed.

   THE ENGLISH MIRROR (2026-11-16, /atalaia/en/). lingua('en') is the same reader over conteudo/en/: lp.json and
   investidores.json mirror their Portuguese files key by key, blog/*.md mirror the posts file by file, and missoes.json
   carries only the missions' WORDS, laid over the pinned Portuguese record. lingua.js refuses any English string whose
   numbers differ from the Portuguese one beside it, a stage of another kind, and a source naming other files; the
   missions' values, units, stages, verdicts and times are never retyped, they are read from the record and localized
   by rule. Same structure, same slugs, same design: an English page is its Portuguese page with /en/ after /atalaia/,
   and every page carries a PT | EN switch to its counterpart. lingua('pt') is this module's default export.

   WHAT IT SHARES. The stage chips (five kinds: simulation, real data, calculation, published by others, illustrative;
   no two share a typography, a case or an edge, so an illustration never reads as a record), the verdict chip (icon and word, design/components.js
   tag()), the Atalaia sub-navigation, the page shell (unlisted: noindex, in no hub and no sitemap, like every
   /atalaia/ page), the footer with the signals sentence (MARCA.sinais, MARCA_EN.sinais), the share card each page names
   (cartoes.js), and the names guard: a page that names what the project keeps private refuses to be written.        */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CT = require(path.join(ROOT, 'design', 'contact.js'));
const { balancedGrid } = require(path.join(ROOT, 'design', 'grid.js'));
const R = require('./registros.js');
const LG = require('./lingua.js');
const SITE = path.join(ROOT, 'site', 'atalaia');
const die = (m) => { console.error('ATALAIA CONTENT REFUSED: ' + m); process.exit(1); };
const esc = C.esc;
const str = (x) => typeof x === 'string' && x.trim().length > 0;
const need = (ok, what) => { if (!ok) die(what); };

/* ---- where a content file is: its place in apps/atalaia, or a stub folder outside the repository */
const STUBS = process.env.ATALAIA_STUBS ? path.resolve(process.env.ATALAIA_STUBS) : null;
if (STUBS && (STUBS + path.sep).startsWith(ROOT + path.sep)) die('ATALAIA_STUBS must name a folder outside the repository: ' + STUBS);
const USED_STUBS = [];
function achar(rel) {
  const real = path.join(__dirname, rel);
  if (fs.existsSync(real)) return { p: real, stub: false };
  if (STUBS && fs.existsSync(path.join(STUBS, rel))) { USED_STUBS.push(rel); return { p: path.join(STUBS, rel), stub: true }; }
  return null;
}
const lerJson = (f, rel) => { try { return JSON.parse(fs.readFileSync(f.p, 'utf8')); } catch (e) { return die(rel + ' is not valid JSON: ' + e.message); } };

/* ---- the stages and the verdicts
   FIVE KINDS OF STAGE, five chips that share no look (type, case and edge; no colour is added):
     s  a simulation or a bench run       mono, upper case, a solid edge
     r  measured on real data, official test vectors, a formal proof
                                          mono, upper case, a filled ground
     c  a calculation (a model's output)  mono, lower case, a solid edge
     f  a public fact or official data someone else published
                                          sans, upright, a bar on the left (the quotation's mark)
     i  an illustration, a proposal, an estimate or a target: not a record
                                          sans, italic, no edge at all (a dash is a standing, never a chip's edge)
   The order of the tests matters: "cálculo (modelo ilustrativo)" is illustrative, "vetores oficiais" is measured and
   "dados oficiais" is someone else's. The tests in each language are lingua.js TIPOS, read in the same order. */
const ILUSTRATIVO = { pt: /ilustra|propost|hip[oó]tes|estima|proje[cç]|exemplo|alvo|meta\b|indicativ|cen[aá]rio|premissa|planejad/i,
  en: /illustrat|propos|hypothe|estimat|project|example|target|goal\b|indicativ|scenario|premise|planned|assum/i };
const tipoEstagio = (s) => LG.tipo(s, 'pt');
const ehIlustrativo = (s) => ILUSTRATIVO.pt.test(String(s || ''));

/* ---- the words each language prints, said once */
const TX = {
  pt: { html: 'pt-BR', base: '/atalaia/', dir: '', locale: 'pt-BR',
    legendaK: 'Como ler os estágios',
    legenda: [['simulação', 'ou bancada'], ['dados reais', 'vetores oficiais, prova formal'], ['cálculo', 'de um modelo'], ['relato publicado', 'por outros'], ['ilustrativo', 'proposta ou estimativa']],
    vword: R.VWORD, dominios: { ar: 'Ar', terra: 'Terra', mar: 'Mar', offshore: 'Offshore' },
    nav: { missoes: 'Missões', investidores: 'Investidores', blog: 'Blog', nucleo: 'Núcleo', doutrina: 'Doutrina', contato: 'Contato' },
    sinais: 'Sinais.', marca: R.MARCA,
    assina: 'Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação. Documento de trabalho: não é doutrina aprovada, proposta comercial nem documento oficial de nenhum órgão.' },
  en: { html: 'en', base: '/atalaia/en/', dir: 'en/', locale: 'en-US',
    legendaK: 'How to read the stages',
    legenda: [['simulation', 'or bench'], ['real data', 'official test vectors, formal proof'], ['calculation', 'from a model'], ['published report', 'by others'], ['illustrative', 'proposal or estimate']],
    vword: { 'PASSA': ['✓ PASS', 'held'], 'NAO PASSA': ['× FAIL', 'dep'], 'FALTA DADO': ['∅ NEEDS DATA', 'open'] },
    dominios: { ar: 'Air', terra: 'Land', mar: 'Sea', offshore: 'Offshore' },
    nav: { missoes: 'Missions', investidores: 'Investors', blog: 'Blog', nucleo: 'Core (PT)', doutrina: 'Doctrine (PT)', contato: 'Contact' },
    sinais: 'Signals.', marca: R.MARCA_EN,
    assina: 'Prepared by Carlos Toledo, with AI help (Claude) in research and writing. A working document: not approved doctrine, not a commercial offer and not an official document of any body.' } };

/* a source: a URL, a {t, u} pair, or words */
function fonte(f) {
  if (!f) return '';
  if (typeof f === 'object') {
    const t = f.t || f.titulo || f.u || '';
    if (/^https?:\/\//.test(f.u || '')) return '<a href="' + esc(f.u) + '" target="_blank" rel="noopener">' + esc(t) + '</a>';
    return /^\/[a-z0-9]/.test(f.u || '') ? '<a href="' + esc(f.u) + '">' + esc(t) + '</a>' : esc(t);
  }
  const s = String(f);
  if (/^https?:\/\/\S+$/.test(s)) return '<a href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(s.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')) + '</a>';
  return esc(s);
}
const chave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* ---- the front-matter, a small YAML subset: `k: v`, `k: [a, b]`, and `k:` followed by `- v` or `- t: …` / `  u: …` items */
function frontMatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  const unq = (v) => { v = v.trim(); return /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v; };
  let key = null, item = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const top = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (top) {
      key = top[1]; item = null;
      const v = top[2].trim();
      if (!v) meta[key] = [];
      else if (/^\[.*\]$/.test(v)) meta[key] = v.slice(1, -1).split(',').map(unq).filter(Boolean);
      else meta[key] = unq(v);
      continue;
    }
    const li = /^\s*-\s+(.*)$/.exec(line);
    if (li && key && Array.isArray(meta[key])) {
      const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(li[1]);
      if (kv) { item = {}; item[kv[1]] = unq(kv[2]); meta[key].push(item); }
      else { item = null; meta[key].push(unq(li[1])); }
      continue;
    }
    const sub = /^\s+([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (sub && item) { item[sub[1]] = unq(sub[2]); continue; }
    die('a post\'s front-matter has a line this reader does not know: ' + JSON.stringify(line));
  }
  return { meta, body: src.slice(m[0].length) };
}
/* a date as the front-matter writes it (2026-11-16 or 16/11/2026), and as a reader reads it in the page's language */
function dataEm(s, lang) {
  let y, mo, d;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')), br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(s || ''));
  if (iso) [y, mo, d] = [iso[1], iso[2], iso[3]].map(Number); else if (br) [d, mo, y] = [br[1], br[2], br[3]].map(Number); else return null;
  const t = Date.UTC(y, mo - 1, d);
  return { t, iso: new Date(t).toISOString().slice(0, 10), label: new Date(t).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) };
}
const data = (s) => dataEm(s, 'pt');
/* the Markdown subset the posts use: ## and ### headings, paragraphs, - and 1. lists, > quotes, | tables, and inline
   **bold**, *italic*, `code` and [links](https://…). Anything else is printed as text, never as markup. */
function inline(s) {
  const links = [];
  let t = String(s).replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, (m0, txt, u) => { links.push([txt, u]); return '\u0000' + (links.length - 1) + '\u0000'; });
  t = esc(t).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '<span class="m">$1</span>');
  return t.replace(/\u0000(\d+)\u0000/g, (m0, i) => {
    const [txt, u] = links[Number(i)];
    return '<a href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(txt).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') + '</a>';
  });
}
function markdown(md) {
  const out = [], lines = String(md).split(/\r?\n/);
  let para = [], ul = null, ol = null, quote = null;
  const flush = () => {
    if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    if (ul) { out.push('<ul>' + ul.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>'); ul = null; }
    if (ol) { out.push('<ol>' + ol.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ol>'); ol = null; }
    if (quote) { out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>'); quote = null; }
  };
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (!L.trim()) { flush(); continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(L);
    if (h) { flush(); const lv = Math.min(3, Math.max(2, h[1].length)); out.push('<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>'); continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(L)) { flush(); continue; }
    if (/^\|/.test(L)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      i--;
      const cells = rows.filter((r) => !/^\|[\s:|-]+\|?\s*$/.test(r)).map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      if (cells.length) out.push(C.table({ cols: cells[0].map((c) => ({ h: c })), rows: cells.slice(1).map((r) => r.map((c) => ({ raw: inline(c) }))) }));
      continue;
    }
    const q = /^>\s?(.*)$/.exec(L);
    if (q) { if (!quote) flush(); quote = quote || []; quote.push(q[1]); continue; }
    const u = /^\s*[-*]\s+(.*)$/.exec(L);
    if (u) { if (!ul) flush(); ul = ul || []; ul.push(u[1]); continue; }
    const o = /^\s*\d+[.)]\s+(.*)$/.exec(L);
    if (o) { if (!ol) flush(); ol = ol || []; ol.push(o[1]); continue; }
    if ((ul || ol) && /^\s{2,}\S/.test(L)) { const tg = ul || ol; tg[tg.length - 1] += ' ' + L.trim(); continue; }
    if (ul || ol || quote) flush();
    para.push(L.trim());
  }
  flush();
  return out.join('\n');
}

/* ---- the names the project keeps private (atalaia/CLAUDE.md rules 3b, 7, 7b and D43) and the words these pages do not
   use; a page that prints one refuses to be written. "certif" covers both languages (2026-11-16: "certified" and
   "certification" are never used; say verifiable, test report, proof) */
const PROIBIDOS = [[/batalh[aã]o|battalion/i, 'batalhão'], [/SENAI/i, 'SENAI'], [/ISI[-\s]?SE\b/i, 'ISI-SE'], [/LabECO/i, 'LabECO'], [/\bAMEx\b/i, 'AMEx'],
  [/\bUFSC\b/i, 'UFSC'], [/Petrobras/i, 'Petrobras'], [/\bJanela\b/, 'Janela'], [/Contraprova/i, 'Contraprova'], [/\bTenente\b|\blieutenant\b/i, 'Tenente'],
  [/\bGRU\b|Guarulhos/i, 'Guarulhos'], [/certif/i, 'certif']];
function limpo(html, where) {
  for (const [re, w] of PROIBIDOS) { const m = re.exec(html); if (m) die(where + ' prints "' + w + '" (…' + html.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' ') + '…)'); }
}

/* ---- the share card a page names (its own LIGHT illustrated card, never the site's landing card: the house rule of
   2026-11-07). The cards are drawn in cartoes.js and rendered by tools/build-og-report.js into design/assets/ with a
   receipt; the page that names one copies it beside the Atalaia pages, to site/atalaia/og/, and the alt is the card's
   own description, read from its receipt. A card whose bytes differ from its receipt's sha256 refuses the page. */
function cartao(key) {
  const rec = path.join(ROOT, 'design', 'assets', 'og-' + key + '.json'), png = path.join(ROOT, 'design', 'assets', 'og-' + key + '.png');
  if (!fs.existsSync(rec) || !fs.existsSync(png)) die('the share card og-' + key + ' is not rendered: node tools/build-og-report.js ' + key);
  const J = JSON.parse(fs.readFileSync(rec, 'utf8')), buf = fs.readFileSync(png);
  if (require('crypto').createHash('sha256').update(buf).digest('hex') !== J.sha256) die('og-' + key + '.png does not match its receipt: render it again');
  const out = path.join(SITE, 'og', 'og-' + key + '.png');
  if (!fs.existsSync(out) || !fs.readFileSync(out).equals(buf)) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, buf); }
  return { image: '/atalaia/og/og-' + key + '.png', alt: J.description };
}
/* the page's own bytes, without the stylesheet's comments (notes for this repository's readers, not the page's) and
   without the verdict tokens of the site's other pages when this page uses none of them: what an Atalaia page ships
   says only what the project says (2026-11-16, the words rule of the English mirror) */
function enxugar(html) {
  html = html.replace(/<style>[\s\S]*?<\/style>/g, (st) => st.replace(/\/\*[\s\S]*?\*\//g, ''));
  if (!/var\(--verdict-certified-/.test(html)) html = html.replace(/--verdict-certified-[a-z]+:[^;}]*;?/g, '');
  return html;
}
/* a folder of built pages that no longer has content behind it is taken down (a page left out is not left stale) */
function retirar(dir, keep) {
  const d = path.join(SITE, dir);
  if (!fs.existsSync(d)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (keep && keep.includes(e.name)) continue;
    fs.rmSync(path.join(d, e.name), { recursive: true, force: true }); n++;
  }
  if (!keep || !fs.readdirSync(d).length) fs.rmSync(d, { recursive: true, force: true });
  return n;
}
const stubNote = () => USED_STUBS.length ? ' — BUILT FROM STUBS (' + [...new Set(USED_STUBS)].join(', ') + '): never commit these pages' : '';
/* a call to action: filled, or outlined (`ghost`) */
const botao = (href, raw, ghost) => '<a class="vt-btn' + (ghost ? ' ghost' : '') + '" href="' + esc(href) + '">' + raw + '</a>';
const contato = (raw, ghost) => CT.trigger({ raw, cls: 'vt-btn' + (ghost ? ' ghost' : '') });

/* ==== one language's reader and shell ==== */
const LINGUAS = {};
function lingua(lang) {
  if (LINGUAS[lang]) return LINGUAS[lang];
  if (!TX[lang]) die('no language ' + lang);
  const T = TX[lang], EN = lang === 'en';
  const conteudo = (rel) => EN ? 'conteudo/en/' + rel : 'conteudo/' + rel;

  /* a stage chip: its kind read in this language (lingua.js TIPOS); a stage that claims a field flight refuses */
  const tipo = (s) => LG.tipo(s, lang);
  const ilustrativo = (s) => ILUSTRATIVO[lang].test(String(s || ''));
  function estagio(s) {
    if (!str(s)) return '';
    if (LG.CAMPO[lang].test(s)) die('a content stage says "' + s + '": nothing has flown, and the pages say so');
    return '<span class="vt-st ' + tipo(s) + '">' + esc(s) + '</span>';
  }
  const legenda = () => '<p class="vt-leg"><span class="vt-k">' + esc(T.legendaK) + '</span>' + T.legenda.map(([s, t]) => '<span class="vt-li">' + estagio(s) + '<span>' + esc(t) + '</span></span>').join('') + '</p>';
  const ESTADOS = { PASSA: 'PASSA', NAO_PASSA: 'NAO PASSA', FALTA_DADO: 'FALTA DADO', INFO: null };
  function veredito(e) {
    if (!(e in ESTADOS)) die('a verdict state is "' + e + '"; the schema has PASSA, NAO_PASSA, FALTA_DADO and INFO');
    if (e === 'INFO') return '<span class="vt-info">INFO</span>';
    const w = T.vword[ESTADOS[e]];
    return C.tag(w[0], w[1]);
  }
  const vword = (v) => T.vword[v];
  /* a number as a reader of this language reads it: pt-BR 1.756 and 1,8; en-US 1,756 and 1.8; a true minus. A value the
     file writes as words is printed as written (the English missions' words were localized by lingua.js valorEn) */
  const fmt = (v) => typeof v === 'number' ? v.toLocaleString(T.locale, { maximumFractionDigits: 10 }).replace(/^-/, '−') : String(v);
  const n = (x, d = 0) => Number(x).toLocaleString(T.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  /* the value alone, with its unit; an illustrative one in italic and a lighter ink, a recorded one upright */
  const valor = (nm, cls) => '<div class="vt-num' + (ilustrativo(nm.estagio) ? ' i' : '') + (cls ? ' ' + cls : '') + '"><span class="vt-v">' + esc(fmt(nm.v)) + '</span>' + (str(nm.u) ? '<span class="vt-u">' + esc(nm.u) + '</span>' : '') + '</div>';
  function numero(nm, cls, semLink) {
    if (!nm || nm.v === undefined || nm.v === null || nm.v === '') return '';
    /* inside a card (itself a link) the source is left to the mission's own page, never a second link */
    const f = nm.fonte && !semLink ? fonte(nm.fonte) : '';
    return valor(nm, cls)
      + (str(nm.rotulo) ? '<div class="vt-nr">' + esc(nm.rotulo) + '</div>' : '')
      + '<div class="vt-nf">' + estagio(nm.estagio) + (f ? '<span class="vt-src">' + f + '</span>' : '') + '</div>';
  }
  const dominioNome = (d) => T.dominios[chave(d)] || String(d);

  /* ---- the missions: the pinned record, and in English the record with its words laid over it (lingua.js) */
  let MISSOES;
  function missoes() {
    if (MISSOES !== undefined) return MISSOES;
    const f = achar('data/missoes.json');
    if (!f) return (MISSOES = null);
    /* registros.js has already checked every pinned record against its sha256; a real missoes.json must be one of them */
    if (!f.stub && !R.PROV.registros['missoes.json']) die('data/missoes.json is not pinned in data/PROVENANCE.json');
    let J = lerJson(f, 'missoes.json');
    need(Array.isArray(J.missoes) && J.missoes.length, 'missoes.json has no missions');
    const seen = new Set();
    for (const m of J.missoes) {
      const id = m && m.slug;
      need(str(id) && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id), 'a mission slug is not url-safe: ' + JSON.stringify(id));
      need(!seen.has(id), 'two missions share the slug ' + id); seen.add(id);
      for (const k of ['dominio', 'titulo', 'gancho']) need(str(m[k]), 'mission ' + id + ' has no ' + k);
      need(Array.isArray(m.historia), 'mission ' + id + ' has no historia');
      for (const h of m.historia) { need(str(h.fase) || str(h.texto), 'mission ' + id + ': a phase with no words'); veredito(h.estado); }
      for (const s of ['sem', 'com']) need(m[s] && typeof m[s] === 'object', 'mission ' + id + ' has no "' + s + '"');
      need(Array.isArray(m.metricas), 'mission ' + id + ' has no metricas');
      need(!m.ressalvas || Array.isArray(m.ressalvas), 'mission ' + id + ': ressalvas is not a list');
      if (m.filme) need(R.PROV.registros['filmes/' + m.filme + '.mp4'] && R.PROV.registros['filmes/' + m.filme + '.jpg'], 'mission ' + id + ' names the film ' + m.filme + ', which is not pinned');
    }
    if (EN) {
      const e = achar('conteudo/en/missoes.json');
      if (!e) return (MISSOES = null);
      J = LG.missoesEn(J, lerJson(e, 'en/missoes.json'));
    }
    for (const m of J.missoes) {
      for (const x of m.metricas) estagio(x.estagio);
      estagio(m.estagio); estagio(m.sem.numero && m.sem.numero.estagio); estagio(m.com.numero && m.com.numero.estagio);
    }
    const list = J.missoes.slice().sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));
    /* the domains in the order their first mission takes */
    const grupos = [];
    for (const m of list) {
      let g = grupos.find((x) => x.k === chave(m.dominio));
      if (!g) grupos.push(g = { k: chave(m.dominio), nome: dominioNome(m.dominio), missoes: [] });
      g.missoes.push(m);
    }
    return (MISSOES = Object.assign({}, J, { missoes: list, grupos, stub: f.stub }));
  }

  /* ---- the landing's words and the investors' questions; in English, each mirrors its Portuguese file (lingua.js) */
  const espelho = (nome, J) => {
    if (!EN) return J;
    const P = lingua('pt')[nome]();
    if (!P) die('conteudo/en/' + nome + '.json has no Portuguese file to mirror');
    const { stub, ...arquivo } = P;                                      /* the file as written, without the reader's own flag */
    LG.conferirArvore(arquivo, J, 'en/' + nome + '.json');
    return J;
  };
  let LP;
  function lp() {
    if (LP !== undefined) return LP;
    const f = achar(conteudo('lp.json'));
    if (!f) return (LP = null);
    const J = lerJson(f, 'lp.json');
    need(J.hero && str(J.hero.titulo), 'lp.json has no hero.titulo');
    need(!J.prova || Array.isArray(J.prova.itens), 'lp.json: prova.itens is not a list');
    for (const it of (J.prova && J.prova.itens) || []) estagio(it.estagio);
    need(!J.faq_curta || Array.isArray(J.faq_curta), 'lp.json: faq_curta is not a list');
    return (LP = Object.assign({}, espelho('lp', J), { stub: f.stub }));
  }
  let INV;
  function investidores() {
    if (INV !== undefined) return INV;
    const f = achar(conteudo('investidores.json'));
    if (!f) return (INV = null);
    const J = lerJson(f, 'investidores.json');
    need(Array.isArray(J.secoes) && J.secoes.length, 'investidores.json has no sections');
    const ids = new Set();
    for (const s of J.secoes) {
      need(str(s.id) && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id) && !ids.has(s.id), 'an investors\' section id is missing, not url-safe or repeated: ' + JSON.stringify(s.id));
      ids.add(s.id);
      need(str(s.titulo) && Array.isArray(s.perguntas), 'section ' + s.id + ' has no titulo or perguntas');
      for (const q of s.perguntas) need(str(q.q) && str(q.a), 'section ' + s.id + ': a question without its answer');
    }
    return (INV = Object.assign({}, espelho('investidores', J), { stub: f.stub }));
  }

  /* ---- the posts: front-matter + Markdown; in English, every Portuguese post has its English file of the same name */
  let POSTS;
  function posts() {
    if (POSTS !== undefined) return POSTS;
    const rel = conteudo('blog');
    const real = path.join(__dirname, rel);
    let dir = null, stub = false;
    if (fs.existsSync(real) && fs.readdirSync(real).some((f) => f.endsWith('.md'))) dir = real;
    else if (STUBS && fs.existsSync(path.join(STUBS, rel))) { dir = path.join(STUBS, rel); stub = true; USED_STUBS.push(rel); }
    if (!dir) return (POSTS = []);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
    if (EN && !stub) {
      const pt = fs.readdirSync(path.join(__dirname, 'conteudo', 'blog')).filter((f) => f.endsWith('.md')).sort();
      const falta = pt.filter((f) => !files.includes(f)), sobra = files.filter((f) => !pt.includes(f));
      if (falta.length || sobra.length) die('conteudo/en/blog/ must mirror conteudo/blog/ file by file (missing: ' + falta.join(', ') + '; extra: ' + sobra.join(', ') + ')');
    }
    const list = files.map((f) => {
      const src = frontMatter(fs.readFileSync(path.join(dir, f), 'utf8')), { meta, body } = src;
      if (EN && !stub) LG.conferirPost(frontMatter(fs.readFileSync(path.join(__dirname, 'conteudo', 'blog', f), 'utf8')), src, 'en/blog/' + f);
      const slug = chave(meta.slug || f.replace(/\.md$/, '')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      need(slug, 'the post ' + f + ' has no usable slug');
      need(str(meta.titulo), 'the post ' + f + ' has no titulo');
      const d = dataEm(meta.data, lang);
      need(d, 'the post ' + f + ' has no date the reader knows (' + JSON.stringify(meta.data) + ')');
      const fontes = Array.isArray(meta.fontes) ? meta.fontes : str(meta.fontes) ? [meta.fontes] : [];
      return { slug, file: f, titulo: meta.titulo, resumo: meta.resumo || '', data: d, fontes, html: markdown(body), stub };
    });
    const seen = new Set();
    for (const p of list) { need(!seen.has(p.slug), 'two posts share the slug ' + p.slug); seen.add(p.slug); }
    /* newest first; on the same day, in the order the landing's words list them (lp.json `blog`), then by name */
    const L = lp(), ordem = ((L && L.blog) || []).map((b) => String(b.u || '').replace(/\/$/, '').split('/').pop());
    const pos = (p) => { const i = ordem.indexOf(p.slug); return i < 0 ? ordem.length : i; };
    list.sort((a, b) => b.data.t - a.data.t || pos(a) - pos(b) || a.slug.localeCompare(b.slug));
    return (POSTS = list);
  }

  /* ---- which pages exist: a page with no content is not linked from anywhere */
  const tem = () => ({ missoes: !!missoes(), investidores: !!investidores(), blog: posts().length > 0, lp: !!lp() });

  /* ---- the Atalaia sub-navigation: the marketing pages and the technical ones (Portuguese only), only those that
     exist, and the PT | EN switch, filled in by pagina() once it knows the page */
  function nav(here) {
    const t = tem(), b = T.base;
    const L = [[b + 'missoes/', T.nav.missoes, t.missoes], [b + 'investidores/', T.nav.investidores, t.investidores], [b + 'blog/', T.nav.blog, t.blog],
      ['/atalaia/nucleo/', T.nav.nucleo, true], ['/atalaia/doutrina/', T.nav.doutrina, true]].filter((x) => x[2]);
    here = here && EN && !here.startsWith(b) ? here.replace(/^\/atalaia\//, b) : here;
    return '<nav class="vt-nav" aria-label="Atalaia"><a class="vt-brand" href="' + b + '"' + (here === b ? ' aria-current="page"' : '') + '>Atalaia</a><div class="vt-links">'
      + L.map(([h, w]) => '<a href="' + h + '"' + (here && here.startsWith(h) ? ' aria-current="page"' : '') + (EN && !h.startsWith(b) ? ' hreflang="pt-BR"' : '') + '>' + esc(w) + '</a>').join('')
      + CT.trigger({ raw: esc(T.nav.contato), cls: 'vt-ct' }) + '<!--vt-lang--></div></nav>';
  }

  /* ---- the footer: the signals sentence (on every page), then who wrote it and what it is not */
  function rodape(extra) {
    return '<p class="vt-sinais"><b>' + esc(T.sinais) + '</b> ' + esc(T.marca.sinais) + '</p>'
      + '<p>' + esc('Atalaia: ' + T.marca.lema + '. ' + T.assina + (extra ? ' ' + extra : '')) + '</p>';
  }

  /* ---- the counterpart of a page in the other language: the same path with /en/ after /atalaia/, when that page is
     built; otherwise the other language's landing */
  function contraparte(p) {
    const outra = lingua(EN ? 'pt' : 'en'), O = TX[EN ? 'pt' : 'en'];
    const resto = p.slice(T.base.length);
    const parte = resto.split('/')[0], slug = resto.split('/')[1];
    const t = outra.tem();
    const ok = !resto ? t.lp
      : parte === 'missoes' ? t.missoes && (!slug || outra.missoes().missoes.some((m) => m.slug === slug))
      : parte === 'investidores' ? t.investidores
      : parte === 'blog' ? t.blog && (!slug || outra.posts().some((x) => x.slug === slug)) : false;
    return ok ? O.base + resto : (t.lp ? O.base : null);
  }
  function troca(p) {
    const outro = contraparte(p);
    if (!outro) return '';
    const pt = EN ? outro : p, en = EN ? p : outro;
    return '<span class="vt-lang" aria-label="' + (EN ? 'Language' : 'Idioma') + '"><a href="' + esc(pt) + '" hreflang="pt-BR" lang="pt-BR"' + (EN ? '' : ' aria-current="true"') + '>PT</a>'
      + '<span aria-hidden="true">|</span><a href="' + esc(en) + '" hreflang="en" lang="en"' + (EN ? ' aria-current="true"' : '') + '>EN</a></span>';
  }
  /* in English, a link to a Portuguese marketing page points at its English page (the content keeps the Portuguese
     paths, which lingua.js holds identical); the technical pages, the films and the Central stay where they are */
  const rotas = (html) => EN ? html.replace(/href="\/atalaia\/(?!en\/|nucleo\/|doutrina\/|eb\/|central\/|filmes\/)/g, 'href="/atalaia/en/')
    /* the figure's record line for a built drawing ("Record: none — what"), said without an em dash on the English pages */
    .replace(/(<span class="fig-rec">Record: none) — /g, '$1, ') : html;

  /* ---- the page shell: one stylesheet, unlisted, written under site/atalaia/[en/]<dir>/ */
  function pagina({ dir, title, desc, bodyRaw, cssRaw = '', scriptRaw = '', footExtra, og }) {
    const p = T.base + (dir ? dir.replace(/\/?$/, '/') : '');
    const body = rotas(bodyRaw).replace('<!--vt-lang-->', troca(p));
    if (EN) { LG.palavras(body.replace(/<[^>]+>/g, ' '), p + ' (its words)'); LG.palavras(title + ' ' + desc + ' ' + rodape(footExtra), p + ' (its title and footer)'); }
    let html = TPL.render({ title, bodyRaw: body, footRaw: rodape(footExtra), lang: T.html, cssRaw: CSS + cssRaw, scriptRaw, desc, path: p,
      og: cartao((EN ? 'atalaia-en' : 'atalaia') + (og ? '-' + og : '')) });
    html = enxugar(html);
    html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
    if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
    if (!html.includes(esc(T.marca.sinais))) die(p + ' does not print the signals sentence');
    limpo(html, p);
    const out = path.join(SITE, T.dir + (dir || ''));
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'index.html'), html);
    return p;
  }
  const retirarAqui = (dir, keep) => retirar(T.dir + dir, keep);

  return (LINGUAS[lang] = { lang, EN, T, ROOT, C, TPL, CT, R, esc, die, str, missoes, lp, investidores, posts, tem, estagio, tipoEstagio: tipo, legenda, veredito, vword, fonte, fmt, n,
    valor, numero, ehIlustrativo: ilustrativo, dominioNome, nav, botao, contato, rodape, pagina, retirar: retirarAqui, limpo, stubNote, markdown, frontMatter,
    data: (s) => dataEm(s, lang), base: T.base, marca: T.marca, CSS });
}

/* ---- the stylesheet the four pages share; every value a token (design/tokens.js) */
/* the text pages' shared sheet (registros.js) without its maturity chips (.at-st, the minuta's): these pages carry the
   stage chips below, and a dashed border is a standing, which a chip is not (tools/check-grammar.js, finding F5) */
const BASE = R.CSS_BASE.split('\n').filter((l) => !/^\.at-st\b/.test(l)).join('\n');
const CSS = BASE + R.FILM_CSS + `
/* the Atalaia sub-navigation */
.vt-nav{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:var(--s-3) var(--s-6);padding:0 0 var(--s-4);margin:0 0 var(--s-7);border-bottom:1px solid var(--rule)}
a.vt-brand{font-family:var(--f-display);font-weight:var(--weight-title);font-size:var(--text-3);letter-spacing:var(--track-title);color:var(--ink);border-bottom:0}
.vt-links{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);font-size:var(--text-small);line-height:var(--leading-snug)}
.vt-links a{color:var(--ink-3);border-bottom:0;transition:color var(--dur-fast) var(--ease-out)}
.vt-links a:hover,.vt-links a[aria-current]{color:var(--ink)}
/* the PT | EN switch, the last item of the sub-navigation: the page's own language in ink, the other a link */
.vt-lang{display:inline-flex;align-items:baseline;gap:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);color:var(--ink-4)}
.vt-links .vt-lang a{color:var(--ink-3)}
.vt-links .vt-lang a[aria-current]{color:var(--ink)}
@media (max-width:680px){.page > .vt-nav{margin-top:var(--s-7)}.page > .vt-nav + header{margin-top:0}}
/* the calls to action */
.vt-cta{display:flex;flex-wrap:wrap;gap:var(--s-3);margin:var(--s-6) 0 0}
a.vt-btn{display:inline-flex;align-items:center;gap:var(--s-2);padding:var(--s-3) var(--s-5);border:1px solid var(--ink);border-radius:var(--radius-pill);
  background:var(--ink);color:var(--paper);font-weight:var(--weight-medium);font-size:var(--text-body);line-height:var(--leading-snug);
  transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)}
a.vt-btn:hover{background:var(--ink-2);border-color:var(--ink-2)}
a.vt-btn.ghost{background:transparent;color:var(--ink);border-color:var(--rule-strong)}
a.vt-btn.ghost:hover{border-color:var(--ink)}
/* the stage chips (the five kinds above): no two share a typography, a case or an edge, and none wears a dash */
.vt-st{display:inline-block;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;
  color:var(--ink-3);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:var(--s-1) var(--s-2);line-height:var(--leading-snug);max-width:100%}
.vt-st.r{background:var(--surface2);border-color:var(--ink-4);color:var(--ink)}
.vt-st.c{text-transform:none;letter-spacing:0;font-size:var(--text-small)}
.vt-st.f{font-family:var(--f-sans);text-transform:none;letter-spacing:0;font-size:var(--text-small);border:0;border-left:2px solid var(--ink-4);border-radius:0;color:var(--ink-3)}
.vt-st.i{font-family:var(--f-sans);font-style:italic;text-transform:none;letter-spacing:0;font-size:var(--text-small);color:var(--ink-3);border-color:transparent}
.col > .vt-leg,.vt-leg{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2) var(--s-5);margin:var(--s-5) 0 0;font-size:var(--text-small);color:var(--ink-4);max-width:none}
.vt-leg .vt-k{flex-basis:100%}
.vt-li{display:inline-flex;align-items:center;gap:var(--s-2)}
.vt-info{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);color:var(--ink-4)}
.vt-src{font-size:var(--text-small);color:var(--ink-4)}
/* a number with its unit, label, stage and source; an illustrative one in italic and a lighter ink */
.vt-num{display:flex;align-items:baseline;flex-wrap:wrap;gap:var(--s-2);font-family:var(--f-display);color:var(--ink);font-variant-numeric:tabular-nums}
.vt-num .vt-v{font-size:var(--text-1);font-weight:var(--weight-title);line-height:var(--leading-tight);letter-spacing:var(--track-title)}
.vt-num .vt-u{font-size:var(--text-3);color:var(--ink-3)}
.vt-num.i{font-style:italic;color:var(--ink-3)}
.vt-num.sm .vt-v{font-size:var(--text-2)}
.vt-ill{font-style:italic;color:var(--ink-3)}
.vt-nr{font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3);margin-top:var(--s-1)}
.vt-nf{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2);margin-top:var(--s-3)}
/* the balanced card grid: three a row on a desk, every row full (design/grid.js) */
.vt-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-5)}
@media (min-width:760px) and (max-width:1099px){.vt-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.vt-grid>:last-child:nth-child(odd){grid-column:1/-1}}
@media (min-width:1100px){
${balancedGrid('.vt-grid', '> *', { perRow: 3 })}
}
/* a panel */
.vt-panel{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5);display:flex;flex-direction:column;gap:var(--s-3)}
.vt-panel h3{margin:0}
.vt-panel p{margin:0;font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-3)}
.vt-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4)}
.vt-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--s-2) var(--s-3)}
/* the mission card */
a.vt-mc{display:flex;flex-direction:column;gap:var(--s-3);background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5);color:inherit;
  transition:border-color var(--dur-med) var(--ease-out),background var(--dur-med) var(--ease-out)}
a.vt-mc:hover{border-color:var(--rule-strong);background:var(--surface2)}
a.vt-mc:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.vt-mc h3{margin:0;font-size:var(--text-2)}
.vt-mc p{margin:0;font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-3)}
.vt-ba{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-4);margin-top:auto;padding-top:var(--s-4);border-top:1px solid var(--rule)}
.vt-ba .vt-k{display:block;margin-bottom:var(--s-1)}
.vt-go{font-size:var(--text-small);color:var(--ink)}
/* the timeline of a mission's phases */
.vt-tl{list-style:none;margin:0;padding:0;max-width:var(--read)}
.vt-tl > li{position:relative;margin-left:var(--s-2);padding:0 0 var(--s-6) var(--s-4);border-left:1px solid var(--rule-strong)}
.vt-tl > li:last-child{border-left-color:transparent;padding-bottom:0}
.vt-tl > li::before{content:"";position:absolute;left:calc(var(--s-3) / -2);top:var(--s-1);width:var(--s-3);height:var(--s-3);border-radius:var(--radius-pill);background:var(--paper);border:2px solid var(--ink-3);box-sizing:border-box}
.vt-tl .vt-tt{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2) var(--s-3);margin-bottom:var(--s-2)}
.vt-tl .vt-t{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-4)}
.vt-tl h3{margin:0;font-size:var(--text-3);line-height:var(--leading-snug)}
.vt-tl p{margin:0;color:var(--ink-3)}
/* FAQ */
.vt-faq{max-width:var(--read);border-top:1px solid var(--rule)}
.vt-faq details{border-bottom:1px solid var(--rule)}
.vt-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:baseline;gap:var(--s-4);padding:var(--s-5) 0;
  font-family:var(--f-display);font-size:var(--text-3);line-height:var(--leading-snug);color:var(--ink)}
.vt-faq summary::-webkit-details-marker{display:none}
.vt-faq summary::after{content:"+";font-family:var(--f-mono);color:var(--ink-4)}
.vt-faq details[open] summary::after{content:"\\2212"}
.vt-faq summary:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.vt-faq details p{margin:0 0 var(--s-5);color:var(--ink-3)}
/* the signals sentence in the footer */
.vt-sinais{color:var(--ink-3)}
.vt-sinais b{color:var(--ink)}
/* a page's stage disclaimer, under the sub-navigation */
.vt-aviso{margin:0 0 var(--s-7)}
.vt-aviso .scope{margin:0}
.page > .vt-aviso + header{margin-top:0}
/* a film's caption head: its title, its verdict, its stage */
.vt-ft{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2) var(--s-3);margin-bottom:var(--s-2)}
.vt-ft b{color:var(--ink);font-weight:var(--weight-medium);font-size:var(--text-body);flex-basis:100%}
`;

/* the Portuguese reader and shell is this module's default; lingua('en') is the English one */
const PT = lingua('pt');
module.exports = Object.assign({}, PT, { lingua, linguas: Object.keys(TX) });
