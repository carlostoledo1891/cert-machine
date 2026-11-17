#!/usr/bin/env node
/* investidores.js — site/atalaia/investidores/: the questions an investor asks about Atalaia, answered with sources, unlisted.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   Read from conteudo/investidores.json through vitrine.js (sections, each with an anchor; questions, each answered and
   sourced). The page: the sections as anchors, every question a heading, every answer with its sources under it; a
   section index that stays in view beside the answers on a desk and is a plain list at the top on a phone. Without
   conteudo/investidores.json no page is written and the folder is taken down. pt-BR (the project's rule).

   The English mirror (2026-11-16): the same page from conteudo/en/investidores.json at /atalaia/en/investidores/.

   usage: node apps/atalaia/investidores.js (also called at the end of apps/atalaia/build.js)                       */
'use strict';
const V0 = require('./vitrine.js');

const TX = {
  pt: { eyebrow: 'Atalaia · Para investidores', title: 'As perguntas de quem investe, respondidas com as fontes',
    deck: 'A tese, o mercado, a tecnologia, o que já foi demonstrado e o que ainda não foi, os riscos e o plano. Cada resposta diz de onde vem; tudo o que o Atalaia mostra é simulação, bancada ou proposta, e nada voou.',
    secoes: 'Seções', nesta: 'Nesta página', falar: 'Falar com o Atalaia →', fontes: 'Fontes', lab: 'Para investidores',
    apresentacao: 'A apresentação do Atalaia', missoes: 'As missões', nucleo: 'O Núcleo, o lado técnico',
    page: 'Atalaia: para investidores', desc: (s) => 'Atalaia para investidores: ' + s + '; cada resposta com as suas fontes.' },
  en: { eyebrow: 'Atalaia · For investors', title: 'The questions investors ask, answered with sources',
    deck: 'The thesis, the market, the technology, what has been shown and what has not, the risks and the plan. Every answer says where it comes from; everything Atalaia shows is simulation, bench work or proposal, and nothing has flown.',
    secoes: 'Sections', nesta: 'On this page', falar: 'Talk to Atalaia →', fontes: 'Sources', lab: 'For investors',
    apresentacao: 'The Atalaia overview', missoes: 'The missions', nucleo: 'The Core, the technical side (in Portuguese)',
    page: 'Atalaia: for investors', desc: (s) => 'Atalaia for investors: ' + s + '; every answer with its sources.' } };

function construir(lang) {
const V = V0.lingua(lang), W = TX[lang];
const { C, esc, str } = V;
const I = V.investidores();
if (!I) { const k = V.retirar('investidores'); console.log('site' + V.base + 'investidores/ NOT built: its investors content is not there' + (k ? ' (' + k + ' stale entries taken down)' : '')); return; }

const nq = I.secoes.reduce((a, s) => a + s.perguntas.length, 0);
const B = [V.nav(V.base + 'investidores/')];
B.push(C.header({ eyebrow: W.eyebrow, title: W.title, deck: W.deck }));
const idx = '<nav class="vt-idx" aria-label="' + esc(W.secoes) + '"><span class="vt-k">' + esc(W.nesta) + '</span><ol>'
  + I.secoes.map((s) => '<li><a href="#' + esc(s.id) + '">' + esc(s.titulo) + '</a></li>').join('') + '</ol>'
  + '<div class="vt-idx-ct">' + V.contato(esc(W.falar)) + '</div></nav>';
const fontes = (fs) => (fs || []).length ? '<p class="vt-qf"><span class="vt-k">' + esc(W.fontes) + '</span>' + fs.map((f) => '<span>' + V.fonte(f) + '</span>').join('') + '</p>' : '';
const corpo = I.secoes.map((s) => '<section class="vt-is" id="' + esc(s.id) + '"><div class="sec-head"><div class="lab">' + esc(W.lab) + '</div><h2>' + esc(s.titulo) + '</h2></div>'
  + s.perguntas.map((q, k) => '<article class="vt-q" id="' + esc(s.id + '-' + (k + 1)) + '"><h3>' + esc(q.q) + '</h3>'
    + String(q.a).split(/\n{2,}/).filter(str).map((t) => '<p>' + esc(t.trim()) + '</p>').join('') + fontes(q.fontes) + '</article>').join('')
  + '</section>').join('\n');
B.push('<div class="vt-inv">' + '<aside class="vt-aside">' + idx + '</aside><div class="vt-ib">' + corpo + '</div></div>');
B.push('<section class="col vt-end">' + C.pRaw('<a href="' + V.base + '">' + esc(W.apresentacao) + '</a>' + (V.tem().missoes ? esc(' · ') + '<a href="' + V.base + 'missoes/">' + esc(W.missoes) + '</a>' : '') + esc(' · ') + '<a href="/atalaia/nucleo/">' + esc(W.nucleo) + '</a>') + '</section>');

const CSS = `
.vt-inv{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-6);margin-top:var(--s-7)}
.vt-idx{border:1px solid var(--rule);border-radius:var(--radius-m);background:var(--surface);padding:var(--s-5)}
.vt-idx ol{margin:var(--s-3) 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:var(--s-2);font-size:var(--text-small);line-height:var(--leading-snug)}
.vt-idx ol a{color:var(--ink-2);border-bottom:0}
.vt-idx ol a:hover{color:var(--ink)}
.vt-idx-ct{margin-top:var(--s-5);padding-top:var(--s-4);border-top:1px solid var(--rule)}
.vt-idx-ct a.vt-btn{font-size:var(--text-small);padding:var(--s-2) var(--s-4)}
.vt-ib{min-width:0}
.vt-inv section.vt-is{margin:0}
.vt-inv section.vt-is + section.vt-is{margin-top:var(--s-9)}
.vt-is{scroll-margin-top:calc(var(--nav-h) + var(--s-5))}
.vt-q{max-width:var(--read);padding:var(--s-5) 0;border-top:1px solid var(--rule);scroll-margin-top:calc(var(--nav-h) + var(--s-5))}
.vt-q h3{font-size:var(--text-3);line-height:var(--leading-snug);margin:0 0 var(--s-3)}
.vt-q p{color:var(--ink-3);margin:0 0 var(--s-3)}
.vt-qf{display:flex;flex-wrap:wrap;align-items:baseline;gap:var(--s-1) var(--s-4);font-size:var(--text-small)}
.vt-qf .vt-k{flex-basis:100%}
@media (min-width:1000px){
  .vt-inv{grid-template-columns:minmax(0,15rem) minmax(0,1fr);gap:var(--s-8)}
  .vt-aside{position:relative}
  .vt-idx{position:sticky;top:calc(var(--nav-h) + var(--s-6))}
}
`;
const p = V.pagina({ dir: 'investidores', title: W.page, og: 'investidores', cssRaw: CSS, bodyRaw: B.join('\n\n'),
  desc: W.desc(I.secoes.map((s) => s.titulo).join(', ')) });
console.log('site' + p + 'index.html written (unlisted): ' + I.secoes.length + ' sections, ' + nq + ' questions' + V.stubNote());
}
for (const lang of ['pt', 'en']) construir(lang);
