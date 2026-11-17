#!/usr/bin/env node
/* landing.js — site/atalaia/index.html: the Atalaia landing page, unlisted, for the people who would fund it.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   v0.5 (2026-11-16, the operator's word relayed by the session that briefed this rebuild: a high-end landing that venture
   investors want to see, with missions, an investors' page and a blog behind it). In order: the hero (the tagline,
   MARCA.lema, the headline, the deck and the calls to action "Ver as missões", "Para investidores", "Como funciona");
   the problem; the four pre-rendered films (kept from v0.4, each captioned with the verdict its record states); how it
   works, step by step, with the R1 drawing from nucleo-esquemas.js; the missions gallery; the proof strip; what is
   different; silent by default, the active module (proposed: the operator's rule of 2026-11-16 put its capabilities and
   the test bench on the public site, as a selling point) and the bench; the business model (proposed); the roadmap and
   its gates; a short FAQ; the latest posts; the technical pages; the contact card; MARCA.sinais in the footer.

   WHERE THE WORDS AND NUMBERS COME FROM. The words from conteudo/lp.json and the missions from data/missoes.json, both
   read once in vitrine.js; the films' verdicts and the numbers in their captions from the pinned records through
   registros.js. No number is typed here. NO CODE (D27): the films are videos rendered from the private Mission
   Control, pinned by sha256 in data/PROVENANCE.json. Without conteudo/lp.json the landing is not rebuilt (the page
   already in site/ stays as it is). pt-BR (the project's rule). The unit and the engineering institute are not named.

   usage: node apps/atalaia/landing.js (also called at the end of apps/atalaia/build.js)                            */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./vitrine.js');
const { C, R, esc, str } = V;
const E = require('./nucleo-esquemas.js');
const { PROV, ILM, KG, R12, n, filme } = R;
const DATA = path.join(__dirname, 'data');
const OUT = path.join(V.ROOT, 'site', 'atalaia');
const die = (m) => { console.error('ATALAIA LANDING REFUSED: ' + m); process.exit(1); };

const L = V.lp();
if (!L) { console.log('site/atalaia/index.html NOT rebuilt: apps/atalaia/conteudo/lp.json is not there (the page in site/ is left as it is)'); return; }
const M = V.missoes(), POSTS = V.posts(), TEM = V.tem();
/* the content's silent-by-default sentence is the brand's, said once in registros.js: a different one refuses the build */
if (L.silencioso && str(L.silencioso.texto) && L.silencioso.texto.trim() !== R.MARCA.sinais) die('lp.json silencioso.texto differs from MARCA.sinais (registros.js): the signals sentence is said once');

/* ---- the films: their verdicts and the numbers in their captions read from the records (registros.js asserts the verdicts) */
const FILMS = [
  { f: 'ilha-morros', v: ILM.morros.energia12.verdict, t: 'Um posto nos morros, com o GNSS falsificado no caminho',
    hero: 'um posto nos morros da ilha de Florianópolis. No meio do caminho o GNSS passa a mentir; o drone segue pela região de proteção, calculada sem o GNSS, e entrega.',
    c: 'A ' + n(ILM.morros.km, 1) + ' km da base, no norte da ilha de Florianópolis. No meio do caminho o GNSS passa a mentir: o trecho fica vermelho, o drone segue pela região de proteção, calculada sem o GNSS, entrega e volta com reserva.' },
  { f: 'ilha-costa-lagoa', v: ILM['costa-rv'].energia12.verdict, t: 'A Costa da Lagoa, acessível só por barco ou trilha',
    c: 'Direto da base, a ida e volta não cabe na bateria. De uma base avançada, faltam medidas que só voos de calibração fazem: o consumo real com carga, o gasto na subida e a saúde das baterias. O replay mostra o voo de treino, não uma missão liberada.' },
  { f: 'ilha-barco', v: ILM.agua.rota.verdict, t: 'Um barco a ' + n(ILM.agua.km) + ' km da praia: o caso que o protocolo recusa',
    c: 'Sobre o mar, sem GNSS, nem o relevo nem a imagem devolvem a posição. A região cresce além do limite e o drone se declara perdido; por isso a missão não é liberada.' },
  { f: 'vale-cheia', v: R12.verdict, t: 'Blumenau, numa cheia do Itajaí-Açu',
    c: 'A mancha cinza é a água. O drone leva ' + n(KG) + ' kg a um ponto cercado pela cheia e volta com reserva, no pior caso de energia.' }];
for (const F of FILMS) for (const ext of ['.mp4', '.jpg']) if (!PROV.registros['filmes/' + F.f + ext]) die('the film ' + F.f + ext + ' is not pinned in PROVENANCE.json');
const filmFig = (F) => C.figure({ svgRaw: filme(F.f, F.t, 'filmes/'), wide: false, record: ['apps/atalaia/data/filmes/' + F.f + '.mp4'],
  captionRaw: '<span class="vt-ft"><b>' + esc(F.t) + '</b>' + C.tag(R.VWORD[F.v][0], R.VWORD[F.v][1]) + V.estagio('simulação') + '</span>' + esc(F.c) });

/* ---- small readers of the content's blocks */
const P = (s) => str(s) ? C.p(s) : '';
const lab = (o, d) => (o && str(o.eyebrow) ? o.eyebrow : d);
const tit = (o, d) => (o && str(o.titulo) ? o.titulo : d);
const sec = (id, labTxt, title, bodyRaw, headRaw) => '<section class="col vt-sec" id="' + id + '">\n<div class="sec-head"><div class="lab">' + esc(labTxt) + '</div><h2>' + esc(title) + '</h2>' + (headRaw || '') + '</div>\n' + bodyRaw + '\n</section>';
const grade = (cells, cls) => '<div class="vt-grid' + (cls ? ' ' + cls : '') + '" data-n="' + cells.length + '">' + cells.join('') + '</div>';
/* a stage written "PROPOSTO; the rest" or "existe: the rest": the chip carries the first part, the rest is a line under it */
const estado = (s) => { if (!str(s)) return ''; const m = /^([^:;]+)[:;]\s*(.+)$/.exec(s); return m ? V.estagio(m[1].trim()) + '<span class="vt-src">' + esc(m[2].trim()) + '</span>' : V.estagio(s); };
const link = (u, raw) => '<a href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + raw + '</a>';
/* a source line: words, or a path on this site made into a link (the content writes "/atalaia/nucleo/, seção 9") */
const fonteRaw = (f) => { const s = String(f || ''); const m = /^(\/atalaia\/[a-z0-9/-]*)(.*)$/.exec(s); return m ? link(m[1], esc(m[1])) + esc(m[2]) : V.fonte(f); };

const B = [];
B.push(V.nav('/atalaia/'));

/* 1 · the hero: the tagline over the headline, the deck, the three calls to action, the stage the whole page is at */
const H = L.hero;
const lemaNoEyebrow = str(H.eyebrow) && H.eyebrow.includes(R.MARCA.lema);
const ctas = [TEM.missoes ? V.botao('/atalaia/missoes/', esc('Ver as missões') + ' →') : '', TEM.investidores ? V.botao('/atalaia/investidores/', esc('Para investidores'), true) : '', V.botao('#como', esc('Como funciona'), true)].filter(Boolean);
/* the hero's film (2026-11-16, the operator's "a strong visual" for the empty right half of the first screen): the hills
   mission, the attack case, as a muted loop beside the words on a desk and under them on a phone. Its box is reserved by
   the stylesheet (16:9, the film's own shape) before a byte of it arrives, so nothing moves when it loads; it plays only
   while on screen and never under reduced motion (registros.js FILM_SCRIPT), when its poster stands in. Its verdict and
   its stage are the record's, read like the strip's below; the caption names the stage first: it is a simulation. */
const HF = FILMS[0];
const heroFilm = '<div class="vt-hfilm">' + C.figure({ svgRaw: filme(HF.f, HF.t, 'filmes/'), wide: false, record: ['apps/atalaia/data/filmes/' + HF.f + '.mp4'],
  captionRaw: '<span class="vt-ft">' + V.estagio('simulação') + C.tag(R.VWORD[HF.v][0], R.VWORD[HF.v][1]) + '</span>'
    + esc('Replay de uma simulação: ' + HF.hero + ' ')
    + (M && M.missoes.some((m) => m.filme === HF.f) ? '<a href="/atalaia/missoes/' + esc(M.missoes.find((m) => m.filme === HF.f).slug) + '/">' + esc('Ver a missão →') + '</a>' : '') }) + '</div>';
B.push('<header class="col vt-hero">\n'
  + '<div class="eyebrow">' + esc(lemaNoEyebrow ? H.eyebrow : 'Atalaia · ' + R.MARCA.lema) + '</div>\n'
  + '<div class="vt-hgrid"><div class="vt-htext">\n'
  + '<h1>' + esc(H.titulo) + '</h1>\n'
  + (str(H.deck) ? '<p class="deck">' + esc(H.deck) + '</p>\n' : '')
  + '<div class="vt-cta">' + ctas.join('') + '</div>\n'
  + '</div>\n' + heroFilm + '</div>\n'
  + '<p class="vt-hnote"><span>' + esc('Versão ' + R.VERSAO.n + ' · ' + R.VERSAO.data) + '</span>' + (str(H.estado) ? '<span>' + esc(H.estado) + '</span>' : '') + '</p>\n'
  + V.legenda() + '\n'
  + '</header>');

/* 2 · the problem: the words, three public facts, the rules that already ask for an answer */
if (L.problema) {
  const PR = L.problema, F = PR.fatos || [];
  B.push(sec('problema', lab(PR, 'O problema'), tit(PR, 'O problema'), P(PR.texto)
    + (F.length ? grade(F.map((f) => '<div class="vt-panel vt-fato"><span class="vt-k">' + esc(f.k) + '</span>' + V.valor({ v: f.v, estagio: f.estagio }, 'sm')
      + '<p>' + esc(f.n) + '</p><div class="vt-nf">' + V.estagio(f.estagio) + '</div>' + (f.fonte ? '<span class="vt-src">' + esc(f.fonte) + '</span>' : '') + '</div>'), 'vt-gap') : '')
    + P(PR.fecho)));
}

/* 3 · the film strip */
B.push(sec('replays', 'Nos replays', 'Missões calculadas sobre o relevo real',
  C.p('Replays pré-renderizados de missões sintéticas na ilha de Florianópolis e no Vale do Itajaí: a energia no pior caso, o relevo que devolve ou não a posição, o espaço aéreo, e o que o drone faz quando o GNSS mente. Umas passam; outras dizem exatamente o que falta.')
  + '<div class="vt-films">' + FILMS.map(filmFig).join('') + '</div>'));

/* 4 · how it works: the steps, the R1 drawing, how it plugs in, the four domains */
const CO = L.como || {};
const passos = CO.passos || [];
const twin = '<div class="nu-w">' + E.desigualdade(false) + '</div><div class="nu-nw">' + E.desigualdade(true) + '</div>';
B.push(sec('como', lab(CO, 'Como funciona'), tit(CO, 'Como funciona'), P(CO.texto)
  + (passos.length ? grade(passos.map((it) => '<div class="vt-panel vt-step"><h3>' + esc(it.t) + '</h3><p>' + esc(it.d || it.texto || '') + '</p></div>'), 'vt-steps vt-gap') : '')
  + '<div class="vt-fig">' + C.figure({ svgRaw: twin, wide: false, source: 'built: o desenho da desigualdade central do Núcleo',
    caption: 'A geometria do portão. A posição verdadeira está em algum ponto da região Rₜ, calculada sem o GNSS; o portão só aceita uma correção que caia a no máximo ε da região; logo o erro que um atacante consegue esconder não passa do diâmetro da região mais ε, qualquer que seja o ataque.' }) + '</div>'
  + P(CO.integracao)
  + ((CO.dominios || []).length ? '<h3 class="vt-h3">' + esc('Os domínios, sobre o mesmo núcleo') + '</h3>' + grade(CO.dominios.map((d) => '<div class="vt-panel"><div class="vt-row"><h3>' + esc(d.nome) + '</h3>' + estado(d.estado) + '</div><p>' + esc(d.d) + '</p></div>')) : '')
  + C.pRaw(link('/atalaia/nucleo/', esc('O Núcleo em detalhe: a região, o portão, o limite e o modelo →')))));

/* 5 · the missions gallery */
if (M) {
  const card = (m) => '<a class="vt-mc" href="/atalaia/missoes/' + esc(m.slug) + '/">'
    + '<div class="vt-row"><span class="vt-k">' + esc(V.dominioNome(m.dominio) + (str(m.lugar) ? ' · ' + m.lugar : '')) + '</span>' + V.estagio(m.estagio) + '</div>'
    + '<h3>' + esc(m.titulo) + '</h3><p>' + esc(m.gancho) + '</p>'
    + ((m.sem.numero || m.com.numero) ? '<div class="vt-ba"><div><span class="vt-k">' + esc('Sem o Atalaia') + '</span>' + V.numero(m.sem.numero, 'sm', true) + '</div>'
      + '<div><span class="vt-k">' + esc('Com o Atalaia') + '</span>' + V.numero(m.com.numero, 'sm', true) + '</div></div>' : '')
    + '<span class="vt-go">' + esc('Ver a missão →') + '</span></a>';
  B.push(sec('missoes', 'Missões', 'Uma operação de cada vez, do começo ao fim', C.p(R.MARCA.familia)
    + (str(M.aviso) ? C.scope(M.aviso) : '')
    + grade(M.missoes.map(card), 'vt-gap')
    + C.pRaw(link('/atalaia/missoes/', esc('Todas as missões, por domínio →')))));
}

/* 6 · the proof strip */
if (L.prova && (L.prova.itens || []).length) {
  const PV = L.prova;
  B.push(sec('prova', lab(PV, 'A prova'), tit(PV, 'O que já foi demonstrado'), P(PV.texto)
    + C.stats(PV.itens.map((it) => ({ k: it.k, vRaw: V.ehIlustrativo(it.estagio) ? '<em class="vt-ill">' + esc(it.v) + '</em>' : esc(it.v),
      nRaw: (str(it.n) ? esc(it.n) : '') + '<span class="vt-sn">' + V.estagio(it.estagio) + '</span>' + (it.fonte ? '<span class="vt-src vt-sf">' + fonteRaw(it.fonte) + '</span>' : '') })))
    + P(PV.nota) + (PV.link && PV.link.u ? C.pRaw(link(PV.link.u, esc(PV.link.t + ' →'))) : '')));
}

/* 7 · what is different */
if (L.diferente && (L.diferente.linhas || []).length) {
  const D = L.diferente, LN = D.linhas;
  const HEAD = { tema: '', aspecto: '', criterio: '', mercado: 'O mercado', hoje: 'Hoje', outros: 'Outras abordagens', atalaia: 'O Atalaia' };
  let cols, rows;
  if (Array.isArray(LN[0])) { cols = D.colunas || LN[0].map(() => ''); rows = LN; }
  else { const ks = Object.keys(LN[0]); cols = D.colunas || ks.map((k) => k in HEAD ? HEAD[k] : k.charAt(0).toUpperCase() + k.slice(1)); rows = LN.map((o) => ks.map((k) => o[k])); }
  B.push(sec('diferente', lab(D, 'O que é diferente'), tit(D, 'O que é diferente'),
    '<div class="vt-tab">' + C.table({ cols: cols.map((h) => ({ h: String(h || '') })), rows: rows.map((r) => r.map((c, i) => i === 0 ? { raw: '<b>' + esc(c) + '</b>' }
      /* on a phone the head row is hidden (registros.js CSS_BASE), so each cell carries its column's name, shown there only */
      : { raw: (cols[i] ? '<span class="vt-ml">' + esc(cols[i]) + '</span>' : '') + '<span' + (i === r.length - 1 ? ' class="vt-us"' : '') + '>' + esc(c == null ? '' : c) + '</span>' })) }) + '</div>'
    + P(D.nota)));
}

/* 7b · silent by default, the active module (proposed) and the test bench: the operator's rule of 2026-11-16 */
const SI = L.silencioso;
if (SI) {
  const MO = SI.modulo || {};
  const caps = MO.capacidades || [];
  B.push(sec('modulo-ativo', lab(SI, 'Silencioso por padrão') + ' · o módulo ativo', tit(SI, 'Silencioso por padrão'),
    '<div class="vt-split"><div>'
    + '<div class="vt-row vt-mh"><h3>' + esc('O módulo ativo (proposto)') + '</h3></div>'
    + P(MO.texto)
    + '<ul class="plain vt-caps">' + caps.map((it) => '<li><span class="vt-row"><b>' + esc(it.t) + '</b><span class="vt-chips">' + estado(it.estado || 'PROPOSTO') + '</span></span>' + esc(it.d || '') + '</li>').join('') + '</ul>'
    + P(SI.envelope) + '</div>'
    + '<aside class="note vt-sig"><span class="lab">' + esc('Os sinais, em todos os modos') + '</span><p>' + esc(R.MARCA.sinais) + '</p>' + (str(SI.nunca) ? '<p class="vt-nunca">' + esc(SI.nunca) + '</p>' : '') + '</aside></div>'));
}
const BA = L.bancada;
if (BA) {
  /* the bench's mission, if the missions file has one */
  const bm = M && M.missoes.find((m) => /bancada|ensaio|laudo/i.test(m.slug + ' ' + m.titulo));
  B.push(sec('bancada', lab(BA, 'A bancada de testes'), tit(BA, 'A bancada de testes'), P(BA.texto)
    + ((BA.camadas || []).length ? grade(BA.camadas.map((c) => '<div class="vt-panel"><h3>' + esc(c.t) + '</h3><p>' + esc(c.d) + '</p><div class="vt-nf">' + estado(c.estado) + '</div></div>'), 'vt-gap') : '')
    + P(BA.ganchos) + (str(BA.palavra) ? '<p class="vt-palavra">' + esc(BA.palavra) + '</p>' : '')
    + (bm ? C.pRaw(link('/atalaia/missoes/' + bm.slug + '/', esc('A bancada numa missão: ' + bm.titulo + ' →'))) : '')));
}

/* 8 · the business model, proposed */
if (L.modelo) {
  const MD = L.modelo, its = MD.linhas || MD.itens || [];
  B.push(sec('modelo', lab(MD, 'Modelo de negócio'), tit(MD, 'Modelo de negócio'),
    (its.length ? grade(its.map((it) => '<div class="vt-panel"><h3>' + esc(it.t) + '</h3><p>' + esc(it.d || it.texto || '') + '</p></div>'), 'vt-gap') : '') + P(MD.nota),
    '<div class="vt-hchip">' + V.estagio(MD.estado || 'PROPOSTO') + '</div>'));
}

/* 9 · the roadmap and its gates */
if (L.roadmap) {
  const RM = L.roadmap, its = RM.portoes || RM.itens || [];
  B.push(sec('roadmap', lab(RM, 'Caminho e portões'), tit(RM, 'Caminho e portões'),
    (its.length ? '<ol class="vt-tl">' + its.map((g) => '<li><div class="vt-tt">' + (str(g.id) ? '<span class="vt-t">' + esc(g.id) + '</span>' : '') + '<h3>' + esc(g.t) + '</h3>' + (str(g.estado) ? '<span class="vt-src">' + esc(g.estado) + '</span>' : '') + '</div>'
      + (str(g.d) ? '<p>' + esc(g.d) + '</p>' : '')
      + (str(g.valor) ? '<div class="vt-nf"><span class="vt-k">' + esc('Custo') + '</span><span class="' + (V.ehIlustrativo(g.estagio) ? 'vt-ill' : 'vt-val') + '">' + esc(g.valor) + '</span>' + V.estagio(g.estagio) + '</div>' : (g.estagio ? '<div class="vt-nf">' + V.estagio(g.estagio) + '</div>' : ''))
      + (g.fonte ? '<p class="vt-src">' + esc('Fonte: ') + fonteRaw(g.fonte) + '</p>' : '') + '</li>').join('') + '</ol>' : '')
    + P(RM.nota)));
}

/* 10 · a short FAQ */
if ((L.faq_curta || []).length) {
  B.push(sec('perguntas', 'Perguntas', 'Perguntas rápidas', '<div class="vt-faq">' + L.faq_curta.map((q) => '<details><summary>' + esc(q.q) + '</summary><p>' + esc(q.a) + '</p></details>').join('') + '</div>'
    + (TEM.investidores ? C.pRaw(link('/atalaia/investidores/', esc('Todas as perguntas de investidores, com as fontes →'))) : '')));
}

/* 11 · the latest posts (the ones that exist, newest first) */
if (POSTS.length) {
  const last = POSTS.slice(0, 3);
  B.push(sec('blog', 'Blog', 'Do caderno de pesquisa', grade(last.map((p) => '<a class="card" href="/atalaia/blog/' + esc(p.slug) + '/"><span class="card-k">' + esc(p.data.label) + '</span><span class="card-t">' + esc(p.titulo) + '</span>' + (str(p.resumo) ? '<span class="card-d">' + esc(p.resumo) + '</span>' : '') + '<span class="card-n">' + esc('Ler →') + '</span></a>'))
    + (POSTS.length > last.length ? C.pRaw(link('/atalaia/blog/', esc('Todos os textos →'))) : '')));
}

/* 12 · the technical pages */
const DOCS = [['/atalaia/doutrina/', 'A minuta', 'O protocolo de missão', 'Princípios, responsabilidades, os estados da missão, os requisitos técnicos, os critérios de validação e a governança, com o histórico de versões.'],
  ['/atalaia/nucleo/', 'O Núcleo', 'A camada de integridade', 'A região que o GNSS nunca encolhe, o portão, o limite que vale contra qualquer atacante, o modelo da autonomia sem GNSS e os portões do plano.'],
  ['/atalaia/eb/', 'Para interlocutores militares', 'Uma proposta independente de pesquisa', 'O que já foi demonstrado em simulação e bancada, o que ainda não foi, e o pedido de uma avaliação técnica preliminar.']];
B.push(sec('documentos', 'Documentos técnicos', 'Para quem quer conferir', grade(DOCS.map(([h, k, t, d]) => '<a class="card" href="' + h + '"><span class="card-k">' + esc(k) + '</span><span class="card-t">' + esc(t) + '</span><span class="card-d">' + esc(d) + '</span><span class="card-n">' + esc(h) + '</span></a>'))));

/* 13 · the contact: the site's contact card */
const FE = L.fechamento || {};
const fctas = (FE.cta || []).map((c) => /^mailto:/.test(c.u || '') ? V.contato(esc(c.t) + ' →') : /^\/atalaia\/investidores\//.test(c.u || '') && !TEM.investidores ? '' : V.botao(c.u, esc(c.t), true)).filter(Boolean);
B.push('<section class="col vt-close" id="contato"><div class="sec-head"><div class="lab">' + esc('Contato') + '</div><h2>' + esc(tit(FE, 'Converse com o Atalaia')) + '</h2></div>'
  + P(FE.texto) + '<div class="vt-cta">' + (fctas.length ? fctas.sort((a, b) => (b.includes('data-contact') ? 1 : 0) - (a.includes('data-contact') ? 1 : 0)).join('') : V.contato(esc('Escreva para o Atalaia →'))) + '</div></section>');

const css = E.CSS_DESIGUALDADE + `
.vt-hero{padding:var(--s-8) 0 var(--s-5)}
.vt-hero .deck{font-size:var(--text-3);color:var(--ink-3)}
/* the hero: words, then the film under them on a phone; side by side on a desk, the film's 16:9 box held by .lp-v.
   The film stands at the headline's top (align start): the words reflowing when the web font arrives cannot move it */
.vt-hgrid{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-7);align-items:start}
.vt-hgrid h1{margin-top:var(--s-4)}
.vt-hfilm figure{margin:0}
.vt-hfilm .figbox{padding:0;border:0;background:none;overflow:visible}
.vt-hfilm .lp-v{border-radius:var(--radius-m)}
.vt-hfilm figcaption{margin-bottom:0}
.vt-hfilm figcaption a{white-space:nowrap}
@media (min-width:1100px){
  .vt-hgrid{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:var(--s-7)}
  .vt-hgrid h1{font-size:calc(var(--text-display) * .7)}
  .vt-hfilm{padding-top:var(--s-5)}
}
.vt-hnote{display:flex;flex-wrap:wrap;gap:var(--s-1) var(--s-5);margin:var(--s-7) 0 0;padding-top:var(--s-4);border-top:1px solid var(--rule);max-width:var(--read);
  font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-slight);line-height:var(--leading-body);color:var(--ink-4)}
.vt-sec .sec-head h2{max-width:var(--title)}
.vt-sec > .wide + p,.vt-sec > .vt-grid + p,.vt-sec > .vt-tl + p,.vt-sec > .vt-tab + p{margin-top:var(--s-5)}
.vt-fig .nu-w .nu-bs{font-size:calc(var(--text-small) * .84)}
.vt-hchip{margin-top:var(--s-2)}
.vt-gap{margin:var(--s-6) 0}
.vt-h3{margin:var(--s-7) 0 var(--s-4)}
.vt-fato .vt-num{margin-top:var(--s-1)}
.vt-films{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-6) var(--s-5);margin-top:var(--s-6)}
.vt-films figcaption{margin-bottom:0}
@media (max-width:759px){.vt-films{grid-template-columns:minmax(0,1fr)}}
.vt-steps{counter-reset:passo}
.vt-step{counter-increment:passo}
.vt-step::before{content:counter(passo, decimal-leading-zero);font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-4)}
.vt-fig{margin-top:var(--s-6)}
.vt-sn{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2);margin-top:var(--s-3)}
.vt-sf{display:block;margin-top:var(--s-2)}
.stat .n{font-family:var(--f-sans);font-size:var(--text-small);line-height:var(--leading-snug);color:var(--ink-3)}
.vt-tab{margin-top:var(--s-2)}
.vt-tab table{font-family:var(--f-sans);font-size:var(--text-body);line-height:var(--leading-body)}
.vt-tab td{color:var(--ink-3)}
.vt-tab th:first-child,.vt-tab td:first-child{width:22%}
.vt-tab td b{color:var(--ink);font-weight:var(--weight-medium)}
.vt-ml{display:none}
@media (max-width:640px){.vt-tab td:first-child{width:auto}.vt-ml{display:block;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin-bottom:var(--s-1)}}
@media (max-width:680px){.vt-sec .stats{grid-template-columns:minmax(0,1fr)}}
.vt-us{color:var(--ink)}
/* the split sits on the card grid's three tracks (words on two, the aside on the third), so its edges are the grid's */
.vt-split{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-6) var(--s-5);align-items:start}
@media (min-width:1100px){.vt-split{grid-template-columns:repeat(3,minmax(0,1fr))}.vt-split > :first-child{grid-column:span 2;padding-right:var(--s-7)}}
.vt-mh{justify-content:flex-start;margin-bottom:var(--s-3)}
.vt-mh h3{margin:0}
.vt-caps{margin:var(--s-4) 0 var(--s-5)}
.vt-caps li .vt-row{justify-content:flex-start;margin-bottom:var(--s-1)}
.vt-chips{display:inline-flex;flex-wrap:wrap;align-items:center;gap:var(--s-2)}
.vt-sig{margin:0}
.vt-sig p{color:var(--ink-2)}
.vt-nunca{font-size:var(--text-small);color:var(--ink-3)}
.vt-palavra{font-family:var(--f-display);font-size:var(--text-3);line-height:var(--leading-snug);color:var(--ink)}
.vt-val{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink)}
.vt-close{background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-l);padding:var(--s-7) var(--s-5)}
.vt-close > p{max-width:var(--read);font-size:var(--text-3);line-height:var(--leading-body);color:var(--ink-3)}
`;

const p = V.pagina({ dir: '', title: 'Atalaia: ' + H.titulo.replace(/\.$/, ''), og: 'atalaia', cssRaw: css, scriptRaw: R.FILM_SCRIPT, bodyRaw: B.join('\n\n'),
  desc: 'Atalaia, ' + R.MARCA.lema + ': ' + (str(H.deck) ? H.deck : H.titulo),
  footExtra: 'Os replays são simulações renderizadas sobre o relevo Copernicus GLO-30 e mapas © OpenStreetMap; cada filme é fixado por sha256 em apps/atalaia/data/PROVENANCE.json.' });
fs.mkdirSync(path.join(OUT, 'filmes'), { recursive: true });
for (const F of FILMS) for (const ext of ['.mp4', '.jpg']) fs.copyFileSync(path.join(DATA, 'filmes', F.f + ext), path.join(OUT, 'filmes', F.f + ext));
console.log('site' + p + 'index.html written (the landing, unlisted): ' + FILMS.length + ' films, ' + (M ? M.missoes.length : 0) + ' missions, ' + POSTS.length + ' posts' + V.stubNote());
