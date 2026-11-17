#!/usr/bin/env node
/* missoes.js — site/atalaia/missoes/: the Atalaia missions, an index grouped by domain and one page per mission, unlisted.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   Every mission is read from data/missoes.json (pinned by sha256 in data/PROVENANCE.json), through vitrine.js, which
   checks its fixed schema. A mission page carries, in order: the stage disclaimer (the file's `aviso`), the header, the
   hook, the timeline of its phases with each phase's verdict (icon and word: ✓ PASSA, × NÃO PASSA, ∅ FALTA DADO, or
   INFO), "Sem o Atalaia" against "Com o Atalaia" side by side, the metrics with a stage and a source per row, the film
   if the mission names one (a pinned replay, a simulation), what it proves, the caveats, and the previous and next
   missions. No number is typed here: each one is the file's. Without data/missoes.json no page is written and the
   folder is taken down. pt-BR (the project's rule).

   usage: node apps/atalaia/missoes.js (also called at the end of apps/atalaia/build.js)                            */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./vitrine.js');
const { C, R, esc, str } = V;
const OUT = path.join(V.ROOT, 'site', 'atalaia', 'missoes');
const DATA = path.join(__dirname, 'data');

const M = V.missoes();
if (!M) { const k = V.retirar('missoes'); console.log('site/atalaia/missoes/ NOT built: apps/atalaia/data/missoes.json is not there' + (k ? ' (' + k + ' stale entries taken down)' : '')); return; }

const aviso = '<div class="col vt-aviso">' + (str(M.aviso) ? C.scope(M.aviso) : '') + V.legenda() + '</div>';
const sec = (id, lab, title, bodyRaw) => '<section class="col" id="' + id + '">\n<div class="sec-head"><div class="lab">' + esc(lab) + '</div><h2>' + esc(title) + '</h2></div>\n' + bodyRaw + '\n</section>';
const grade = (cells) => '<div class="vt-grid" data-n="' + cells.length + '">' + cells.join('') + '</div>';
const card = (m) => '<a class="vt-mc" href="/atalaia/missoes/' + esc(m.slug) + '/">'
  + '<div class="vt-row"><span class="vt-k">' + esc(str(m.lugar) ? m.lugar : V.dominioNome(m.dominio)) + '</span>' + V.estagio(m.estagio) + '</div>'
  + '<h3>' + esc(m.titulo) + '</h3><p>' + esc(m.gancho) + '</p>'
  + ((m.sem.numero || m.com.numero) ? '<div class="vt-ba"><div><span class="vt-k">' + esc('Sem o Atalaia') + '</span>' + V.numero(m.sem.numero, 'sm', true) + '</div>'
    + '<div><span class="vt-k">' + esc('Com o Atalaia') + '</span>' + V.numero(m.com.numero, 'sm', true) + '</div></div>' : '')
  + '<span class="vt-go">' + esc('Ver a missão →') + '</span></a>';

const CSS = `
.vt-dom + .vt-dom{margin-top:var(--s-9)}
.vt-chips{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2) var(--s-3);margin:var(--s-5) 0 0}
.vt-chips .vt-k{margin-right:var(--s-1)}
.vt-vs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-5)}
.vt-side{border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-5);background:var(--sunk);display:flex;flex-direction:column;gap:var(--s-3)}
.vt-side.com{background:var(--surface);border-color:var(--ink-4)}
.vt-side h3{margin:0}
.vt-side > p{margin:0;color:var(--ink-3)}
.vt-side .vt-numw{margin-top:auto;padding-top:var(--s-4);border-top:1px solid var(--rule)}
@media (max-width:759px){.vt-vs{grid-template-columns:minmax(0,1fr)}}
.vt-mt table{font-family:var(--f-sans);font-size:var(--text-small);line-height:var(--leading-body)}
.vt-mt th:first-child,.vt-mt td:first-child{width:34%}
.vt-mt th:nth-child(2),.vt-mt td:nth-child(2){width:18%;font-family:var(--f-mono);color:var(--ink)}
.vt-mt th:nth-child(3),.vt-mt td:nth-child(3){width:17%}
.vt-mt td b{color:var(--ink);font-weight:var(--weight-medium)}
.vt-mt td:last-child{color:var(--ink-4);overflow-wrap:anywhere}
@media (max-width:640px){.vt-mt td:first-child,.vt-mt td:nth-child(2),.vt-mt td:nth-child(3){width:auto}}
.vt-pn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-5)}
.vt-pn .next{text-align:right}
.vt-pn .next:only-child{grid-column:2}
@media (max-width:759px){.vt-pn{grid-template-columns:minmax(0,1fr)}.vt-pn .next{text-align:left}.vt-pn .next:only-child{grid-column:auto}}
.vt-film{margin-top:var(--s-2)}
`;

/* ---- the index, grouped by domain */
const B = [V.nav('/atalaia/missoes/'), aviso];
B.push(C.header({ eyebrow: 'Atalaia · Missões', title: 'As missões, domínio a domínio',
  deck: 'Cada missão conta uma operação do começo ao fim: o que acontece sem o Atalaia, o que muda com ele, os números com o estágio e a fonte de cada um, e o que ainda não foi provado.' }));
for (const g of M.grupos) B.push('<div class="vt-dom">' + sec('dominio-' + g.k, 'Domínio', g.nome, grade(g.missoes.map(card))) + '</div>');
const pIdx = V.pagina({ dir: 'missoes', title: 'Atalaia: as missões', cssRaw: CSS, bodyRaw: B.join('\n\n'),
  desc: 'As missões do Atalaia, por domínio (' + M.grupos.map((g) => g.nome).join(', ') + '): o que acontece sem o Atalaia, o que muda com ele, e o estágio de cada número.' });

/* ---- one page per mission */
const films = new Set();
const built = [];
M.missoes.forEach((m, i) => {
  const prev = M.missoes[i - 1], next = M.missoes[i + 1];
  const P = [V.nav('/atalaia/missoes/'), aviso];
  P.push(C.header({ eyebrow: 'Atalaia · Missão · ' + V.dominioNome(m.dominio) + (str(m.lugar) ? ' · ' + m.lugar : ''), title: m.titulo, deck: str(m.subtitulo) ? m.subtitulo : '' }));
  P.push('<div class="col vt-chips">' + (str(m.estagio) ? '<span class="vt-k">' + esc('Estágio') + '</span>' + V.estagio(m.estagio) : '') + (str(m.publico) ? '<span class="vt-k">' + esc('Para') + '</span><span class="vt-src">' + esc(m.publico) + '</span>' : '') + '</div>');
  P.push('<div class="col">' + C.pull(esc(m.gancho)) + '</div>');
  /* the timeline */
  if (m.historia.length) P.push(sec('historia', 'A operação', 'Fase a fase', '<ol class="vt-tl">' + m.historia.map((h) => '<li><div class="vt-tt">' + (str(h.t) ? '<span class="vt-t">' + esc(h.t) + '</span>' : '')
    + (str(h.fase) ? '<h3>' + esc(h.fase) + '</h3>' : '') + V.veredito(h.estado) + '</div>' + (str(h.texto) ? '<p>' + esc(h.texto) + '</p>' : '') + '</li>').join('') + '</ol>'));
  /* without and with */
  const lado = (s, cls, dflt) => '<div class="vt-side ' + cls + '"><span class="vt-k">' + esc(dflt) + '</span>' + (str(s.titulo) && s.titulo !== dflt ? '<h3>' + esc(s.titulo) + '</h3>' : '')
    + (str(s.texto) ? '<p>' + esc(s.texto) + '</p>' : '') + (s.numero ? '<div class="vt-numw">' + V.numero(s.numero) + '</div>' : '') + '</div>';
  P.push(sec('sem-e-com', 'A diferença', 'Sem o Atalaia, e com ele', '<div class="vt-vs">' + lado(m.sem, 'sem', 'Sem o Atalaia') + lado(m.com, 'com', 'Com o Atalaia') + '</div>'));
  /* the metrics */
  if (m.metricas.length) P.push(sec('numeros', 'Os números', 'Cada número com o seu estágio e a sua fonte', '<div class="vt-mt">' + C.table({ cols: [{ h: 'Métrica' }, { h: 'Valor' }, { h: 'Estágio' }, { h: 'Fonte' }],
    rows: m.metricas.map((x) => [{ raw: '<b>' + esc(x.k) + '</b>' }, { raw: (V.ehIlustrativo(x.estagio) ? '<em class="vt-ill">' : '<span>') + esc(V.fmt(x.v) + (str(x.u) ? ' ' + x.u : '')) + (V.ehIlustrativo(x.estagio) ? '</em>' : '</span>') },
      { raw: V.estagio(x.estagio) }, { raw: x.fonte ? V.fonte(x.fonte) : '' }]) }) + '</div>'));
  /* the film */
  if (m.filme) {
    films.add(m.filme);
    P.push(sec('replay', 'O replay', 'A missão em simulação', '<div class="vt-film">' + C.figure({ svgRaw: R.filme(m.filme, m.titulo, '../../filmes/'), wide: false, record: ['apps/atalaia/data/filmes/' + m.filme + '.mp4'],
      captionRaw: '<span class="vt-ft">' + V.estagio('simulação') + '</span>' + esc('Replay pré-renderizado de uma missão sintética, sobre o relevo real.') }) + '</div>'));
  }
  /* what it proves, and the caveats */
  if (str(m.prova)) P.push(sec('prova', 'O que prova', 'O que esta missão demonstra', C.p(m.prova)));
  if ((m.ressalvas || []).length) P.push(sec('ressalvas', 'Ressalvas', 'O que ela não demonstra', C.plainList(m.ressalvas.map((r) => ({ text: typeof r === 'string' ? r : r.texto || r.t || '' })))));
  /* the previous and next missions */
  const pn = (x, cls, k) => '<a class="card ' + cls + '" href="/atalaia/missoes/' + esc(x.slug) + '/"><span class="card-k">' + esc(k) + '</span><span class="card-t">' + esc(x.titulo) + '</span></a>';
  P.push('<section class="col"><div class="vt-pn">' + (prev ? pn(prev, 'prev', '← Anterior · ' + V.dominioNome(prev.dominio)) : '') + (next ? pn(next, 'next', 'Próxima · ' + V.dominioNome(next.dominio) + ' →') : '') + '</div>'
    + C.pRaw('<a href="/atalaia/missoes/">' + esc('Todas as missões') + '</a>' + esc(' · ') + '<a href="/atalaia/">' + esc('A apresentação do Atalaia') + '</a>') + '</section>');
  built.push(V.pagina({ dir: 'missoes/' + m.slug, title: 'Atalaia: ' + m.titulo, cssRaw: CSS, scriptRaw: m.filme ? R.FILM_SCRIPT : '', bodyRaw: P.join('\n\n'),
    desc: 'Atalaia, missão ' + V.dominioNome(m.dominio).toLowerCase() + ': ' + m.titulo + '. ' + m.gancho }));
});
/* the films the mission pages play are served once, from /atalaia/filmes/ (landing.js copies the landing's; these are the rest) */
fs.mkdirSync(path.join(V.ROOT, 'site', 'atalaia', 'filmes'), { recursive: true });
for (const f of films) for (const ext of ['.mp4', '.jpg']) fs.copyFileSync(path.join(DATA, 'filmes', f + ext), path.join(V.ROOT, 'site', 'atalaia', 'filmes', f + ext));
/* a mission that left the file leaves the site */
const keep = M.missoes.map((m) => m.slug).concat(['index.html']);
for (const e of fs.readdirSync(OUT)) if (!keep.includes(e)) fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
console.log('site' + pIdx + 'index.html written (unlisted): ' + M.missoes.length + ' missions in ' + M.grupos.length + ' domains, ' + films.size + ' films' + V.stubNote());
