/* vitrine.js — the ONE reading of the Atalaia content files, and the shell the four marketing pages share.
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

   WHAT IT SHARES. The stage chips (five kinds: simulation, real data, calculation, published by others, illustrative;
   no two share a typography, a case or an edge, so an illustration never reads as a record), the verdict chip (icon and word, design/components.js
   tag()), the Atalaia sub-navigation, the page shell (unlisted: noindex, in no hub and no sitemap, like every
   /atalaia/ page), the footer with MARCA.sinais (the signals sentence every page prints), and the names guard: a page
   that names what the project keeps private refuses to be written.                                                   */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CT = require(path.join(ROOT, 'design', 'contact.js'));
const { balancedGrid } = require(path.join(ROOT, 'design', 'grid.js'));
const R = require('./registros.js');
const SITE = path.join(ROOT, 'site', 'atalaia');
const die = (m) => { console.error('ATALAIA CONTENT REFUSED: ' + m); process.exit(1); };
const esc = C.esc;

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
const str = (x) => typeof x === 'string' && x.trim().length > 0;
const need = (ok, what) => { if (!ok) die(what); };

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
   "dados oficiais" is someone else's. */
const ILUSTRATIVO = /ilustra|propost|hip[oó]tes|estima|proje[cç]|exemplo|alvo|meta\b|indicativ|cen[aá]rio|premissa|planejad/i;
const ehIlustrativo = (s) => ILUSTRATIVO.test(String(s || ''));
const TIPOS = [['i', ILUSTRATIVO], ['c', /c[aá]lcul|modelo|calculad/i], ['r', /dados reais|gravad|vetores|prova formal|medid|campo|lean/i],
  ['f', /oficia|publicad|p[uú]blic|imprensa|relato|not[ií]cia|norma|lei\b/i]];
const tipoEstagio = (s) => { for (const [k, re] of TIPOS) if (re.test(String(s || ''))) return k; return 's'; };
/* the build refuses a stage that claims a field flight: nothing has flown, and every page says so */
const CAMPO = /validad[oa] em campo|voo real|voado|em campo/i;
function estagio(s) {
  if (!str(s)) return '';
  if (CAMPO.test(s)) die('a content stage says "' + s + '": nothing has flown, and the pages say so');
  return '<span class="vt-st ' + tipoEstagio(s) + '">' + esc(s) + '</span>';
}
/* the key to the five chips, said once where a page first shows them */
const LEGENDA = [['simulação', 'ou bancada'], ['dados reais', 'vetores oficiais, prova formal'], ['cálculo', 'de um modelo'],
  ['relato publicado', 'por outros'], ['ilustrativo', 'proposta ou estimativa']];
const legenda = () => '<p class="vt-leg"><span class="vt-k">Como ler os estágios</span>' + LEGENDA.map(([s, t]) => '<span class="vt-li">' + estagio(s) + '<span>' + esc(t) + '</span></span>').join('') + '</p>';
const ESTADOS = { PASSA: 'PASSA', NAO_PASSA: 'NAO PASSA', FALTA_DADO: 'FALTA DADO', INFO: null };
function veredito(e) {
  if (!(e in ESTADOS)) die('a verdict state is "' + e + '"; the schema has PASSA, NAO_PASSA, FALTA_DADO and INFO');
  if (e === 'INFO') return '<span class="vt-info">INFO</span>';
  const w = R.VWORD[ESTADOS[e]];
  return C.tag(w[0], w[1]);
}
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
/* a number as content states it: value, unit, label, stage and source. An illustrative value is set in italic and a
   lighter ink, a recorded one upright: they never share a typography */
/* a value as a reader in Brazil reads it: a number the file stores as a number gets the decimal comma and the thousands
   point (1.8 -> 1,8; 1756 -> 1.756) and a true minus; a value the file writes as words is printed as written */
const fmt = (v) => typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 10 }).replace(/^-/, '\u2212') : String(v);
/* the value alone, with its unit */
const valor = (nm, cls) => '<div class="vt-num' + (ehIlustrativo(nm.estagio) ? ' i' : '') + (cls ? ' ' + cls : '') + '"><span class="vt-v">' + esc(fmt(nm.v)) + '</span>' + (str(nm.u) ? '<span class="vt-u">' + esc(nm.u) + '</span>' : '') + '</div>';
function numero(nm, cls, semLink) {
  if (!nm || nm.v === undefined || nm.v === null || nm.v === '') return '';
  /* inside a card (itself a link) the source is left to the mission's own page, never a second link */
  const f = nm.fonte && !semLink ? fonte(nm.fonte) : '';
  return valor(nm, cls)
    + (str(nm.rotulo) ? '<div class="vt-nr">' + esc(nm.rotulo) + '</div>' : '')
    + '<div class="vt-nf">' + estagio(nm.estagio) + (f ? '<span class="vt-src">' + f + '</span>' : '') + '</div>';
}

/* ---- the domains, in the family's order (atalaia/CLAUDE.md, D38) */
const DOMINIOS = { ar: 'Ar', terra: 'Terra', mar: 'Mar', offshore: 'Offshore' };
const chave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const dominioNome = (d) => DOMINIOS[chave(d)] || String(d);

/* ---- the missions (data/missoes.json, pinned) */
let MISSOES;
function missoes() {
  if (MISSOES !== undefined) return MISSOES;
  const f = achar('data/missoes.json');
  if (!f) return (MISSOES = null);
  /* registros.js has already checked every pinned record against its sha256; a real missoes.json must be one of them */
  if (!f.stub && !R.PROV.registros['missoes.json']) die('data/missoes.json is not pinned in data/PROVENANCE.json');
  const J = lerJson(f, 'missoes.json');
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
    for (const x of m.metricas) estagio(x.estagio);
    estagio(m.estagio); estagio(m.sem.numero && m.sem.numero.estagio); estagio(m.com.numero && m.com.numero.estagio);
    need(!m.ressalvas || Array.isArray(m.ressalvas), 'mission ' + id + ': ressalvas is not a list');
    if (m.filme) need(R.PROV.registros['filmes/' + m.filme + '.mp4'] && R.PROV.registros['filmes/' + m.filme + '.jpg'], 'mission ' + id + ' names the film ' + m.filme + ', which is not pinned');
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

/* ---- the landing's words and the investors' questions */
function lp() {
  const f = achar('conteudo/lp.json');
  if (!f) return null;
  const J = lerJson(f, 'lp.json');
  need(J.hero && str(J.hero.titulo), 'lp.json has no hero.titulo');
  need(!J.prova || Array.isArray(J.prova.itens), 'lp.json: prova.itens is not a list');
  for (const it of (J.prova && J.prova.itens) || []) estagio(it.estagio);
  need(!J.faq_curta || Array.isArray(J.faq_curta), 'lp.json: faq_curta is not a list');
  return Object.assign({}, J, { stub: f.stub });
}
function investidores() {
  const f = achar('conteudo/investidores.json');
  if (!f) return null;
  const J = lerJson(f, 'investidores.json');
  need(Array.isArray(J.secoes) && J.secoes.length, 'investidores.json has no sections');
  const ids = new Set();
  for (const s of J.secoes) {
    need(str(s.id) && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id) && !ids.has(s.id), 'an investors\' section id is missing, not url-safe or repeated: ' + JSON.stringify(s.id));
    ids.add(s.id);
    need(str(s.titulo) && Array.isArray(s.perguntas), 'section ' + s.id + ' has no titulo or perguntas');
    for (const q of s.perguntas) need(str(q.q) && str(q.a), 'section ' + s.id + ': a question without its answer');
  }
  return Object.assign({}, J, { stub: f.stub });
}

/* ---- the posts: front-matter + Markdown */
/* the front-matter, a small YAML subset: `k: v`, `k: [a, b]`, and `k:` followed by `- v` or `- t: …` / `  u: …` items */
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
/* a date as the front-matter writes it (2026-11-16 or 16/11/2026), and as a reader reads it */
function data(s) {
  let y, mo, d;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')), br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(s || ''));
  if (iso) [y, mo, d] = [iso[1], iso[2], iso[3]].map(Number); else if (br) [d, mo, y] = [br[1], br[2], br[3]].map(Number); else return null;
  const t = Date.UTC(y, mo - 1, d);
  return { t, iso: new Date(t).toISOString().slice(0, 10), label: new Date(t).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) };
}
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
let POSTS;
function posts() {
  if (POSTS !== undefined) return POSTS;
  const rel = 'conteudo/blog';
  const real = path.join(__dirname, rel);
  let dir = null, stub = false;
  if (fs.existsSync(real) && fs.readdirSync(real).some((f) => f.endsWith('.md'))) dir = real;
  else if (STUBS && fs.existsSync(path.join(STUBS, rel))) { dir = path.join(STUBS, rel); stub = true; USED_STUBS.push(rel); }
  if (!dir) return (POSTS = []);
  const list = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const { meta, body } = frontMatter(fs.readFileSync(path.join(dir, f), 'utf8'));
    const slug = chave(meta.slug || f.replace(/\.md$/, '')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    need(slug, 'the post ' + f + ' has no usable slug');
    need(str(meta.titulo), 'the post ' + f + ' has no titulo');
    const d = data(meta.data);
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

/* ---- the names the project keeps private (atalaia/CLAUDE.md rules 3b, 7, 7b and D43) and the word the new pages do not
   use; a page that prints one refuses to be written */
const PROIBIDOS = [[/batalh[aã]o/i, 'batalhão'], [/SENAI/i, 'SENAI'], [/ISI[-\s]?SE\b/i, 'ISI-SE'], [/LabECO/i, 'LabECO'], [/\bAMEx\b/i, 'AMEx'],
  [/\bUFSC\b/i, 'UFSC'], [/Petrobras/i, 'Petrobras'], [/\bJanela\b/, 'Janela'], [/Contraprova/i, 'Contraprova'], [/\bTenente\b/i, 'Tenente'],
  [/\bGRU\b|Guarulhos/i, 'Guarulhos'], [/certificad/i, 'certificad']];
function limpo(html, where) {
  for (const [re, w] of PROIBIDOS) { const m = re.exec(html); if (m) die(where + ' prints "' + w + '" (…' + html.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' ') + '…)'); }
}

/* ---- the Atalaia sub-navigation: the four marketing pages and the technical ones, only those that exist */
function nav(here) {
  const t = tem();
  const L = [['/atalaia/missoes/', 'Missões', t.missoes], ['/atalaia/investidores/', 'Investidores', t.investidores], ['/atalaia/blog/', 'Blog', t.blog], ['/atalaia/nucleo/', 'Núcleo', true], ['/atalaia/doutrina/', 'Doutrina', true]]
    .filter((x) => x[2]);
  return '<nav class="vt-nav" aria-label="Atalaia"><a class="vt-brand" href="/atalaia/"' + (here === '/atalaia/' ? ' aria-current="page"' : '') + '>Atalaia</a><div class="vt-links">'
    + L.map(([h, w]) => '<a href="' + h + '"' + (here && here.startsWith(h) ? ' aria-current="page"' : '') + '>' + esc(w) + '</a>').join('')
    + CT.trigger({ raw: 'Contato', cls: 'vt-ct' }) + '</div></nav>';
}
/* a call to action: filled, or outlined (`ghost`) */
const botao = (href, raw, ghost) => '<a class="vt-btn' + (ghost ? ' ghost' : '') + '" href="' + esc(href) + '">' + raw + '</a>';
const contato = (raw, ghost) => CT.trigger({ raw, cls: 'vt-btn' + (ghost ? ' ghost' : '') });

/* ---- the footer: the signals sentence (MARCA.sinais, on every page), then who wrote it and what it is not */
function rodape(extra) {
  return '<p class="vt-sinais"><b>' + esc('Sinais.') + '</b> ' + esc(R.MARCA.sinais) + '</p>'
    + '<p>' + esc('Atalaia: ' + R.MARCA.lema + '. Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação. Documento de trabalho: não é doutrina aprovada, proposta comercial nem documento oficial de nenhum órgão.' + (extra ? ' ' + extra : '')) + '</p>';
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

/* ---- the page shell: one stylesheet, unlisted, written under site/atalaia/<dir>/ */
function pagina({ dir, title, desc, bodyRaw, cssRaw = '', scriptRaw = '', footExtra, og }) {
  const p = '/atalaia/' + (dir ? dir.replace(/\/?$/, '/') : '');
  let html = TPL.render({ title, bodyRaw, footRaw: rodape(footExtra), lang: 'pt-BR', cssRaw: CSS + cssRaw, scriptRaw, desc, path: p, og: cartao(og || 'atalaia') });
  html = enxugar(html);
  html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
  if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
  if (!html.includes(esc(R.MARCA.sinais))) die(p + ' does not print the signals sentence');
  limpo(html, p);
  const out = path.join(SITE, dir || '');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), html);
  return p;
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

module.exports = { ROOT, C, TPL, CT, R, esc, die, str, missoes, lp, investidores, posts, tem, estagio, tipoEstagio, legenda, veredito, fonte, fmt, valor, numero, ehIlustrativo,
  dominioNome, nav, botao, contato, rodape, pagina, retirar, limpo, stubNote, markdown, frontMatter, data, CSS };
