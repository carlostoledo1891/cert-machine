#!/usr/bin/env node
/* blog.js — site/atalaia/blog/: the Atalaia research notebook, an index and one page per post, unlisted.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   Each post is a Markdown file in conteudo/blog/ with a front-matter (titulo, data, resumo, fontes), read through
   vitrine.js: its front-matter reader and its Markdown subset (headings, paragraphs, lists, quotes, tables, bold,
   italic, code and links; anything else stays text). Newest first. Every post ends with its sources. Without a post no
   page is written and the folder is taken down. pt-BR (the project's rule).

   The English mirror (2026-11-16): the same notebook from conteudo/en/blog/ (one English file per post, of the same
   name and slug, held to its post's numbers by lingua.js), at /atalaia/en/blog/.

   usage: node apps/atalaia/blog.js (also called at the end of apps/atalaia/build.js)                               */
'use strict';
const fs = require('fs');
const path = require('path');
const V0 = require('./vitrine.js');

const CSS = `
.vt-posts{display:flex;flex-direction:column;max-width:var(--read);border-top:1px solid var(--rule);margin-top:var(--s-7)}
a.vt-post{display:flex;flex-direction:column;gap:var(--s-2);padding:var(--s-6) 0;border-bottom:1px solid var(--rule);color:inherit}
a.vt-post:hover .vt-pt{color:var(--ink-2)}
a.vt-post:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.vt-pt{font-family:var(--f-display);font-size:var(--text-2);line-height:var(--leading-snug);letter-spacing:var(--track-title);color:var(--ink);transition:color var(--dur-fast) var(--ease-out)}
.vt-pr{font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-3)}
.vt-md{margin-top:var(--s-7)}
.vt-md > p,.vt-md > ul,.vt-md > ol{font-size:var(--text-3);line-height:var(--leading-body);color:var(--ink-2)}
.vt-md > p,.vt-md > ul,.vt-md > ol,.vt-md > blockquote,.vt-md > h2,.vt-md > h3{max-width:68ch}
.vt-md > h2{margin:var(--s-8) 0 var(--s-4);font-size:calc(var(--text-2) * 1.25)}
.vt-md > h3{margin:var(--s-6) 0 var(--s-3)}
.vt-md > ul,.vt-md > ol{padding-left:var(--s-5);margin:0 0 var(--s-5)}
.vt-md li{margin-bottom:var(--s-2)}
.vt-md li::marker{color:var(--ink-4)}
.vt-md .wide{margin:var(--s-5) 0}
.vt-fontes ol{margin:0;padding-left:var(--s-5);max-width:var(--read);font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.vt-fontes li{margin-bottom:var(--s-2)}
.vt-pn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-5)}
.vt-pn .next{text-align:right}
.vt-pn .next:only-child{grid-column:2}
@media (max-width:759px){.vt-pn{grid-template-columns:minmax(0,1fr)}.vt-pn .next{text-align:left}.vt-pn .next:only-child{grid-column:auto}}
`;

const TX = {
  pt: { title: 'O caderno de pesquisa', deck: 'O que estamos aprendendo ao construir integridade verificável para sistemas autônomos: as ideias, os testes, o que deu certo e o que não deu. Cada texto termina com as suas fontes.',
    fontes: 'Fontes', fontesTit: 'De onde vem cada fato', recente: '← Mais recente · ', anterior: 'Anterior · ', todos: 'Todos os textos', apresentacao: 'A apresentação do Atalaia',
    page: 'Atalaia: o caderno de pesquisa', desc: (t) => 'O blog do Atalaia: ' + t + '.', pdesc: (p) => 'Atalaia, blog, ' + p.data.label + ': ' + (p.resumo || p.titulo) },
  en: { title: 'The research notebook', deck: 'What we are learning while building verifiable integrity for autonomous systems: the ideas, the tests, what worked and what did not. Every post ends with its sources.',
    fontes: 'Sources', fontesTit: 'Where each fact comes from', recente: '← Newer · ', anterior: 'Older · ', todos: 'All posts', apresentacao: 'The Atalaia overview',
    page: 'Atalaia: the research notebook', desc: (t) => 'The Atalaia blog: ' + t + '.', pdesc: (p) => 'Atalaia, blog, ' + p.data.label + ': ' + (p.resumo || p.titulo) } };

function construir(lang) {
const V = V0.lingua(lang), W = TX[lang];
const { C, esc, str } = V;
const OUT = path.join(V.ROOT, 'site', 'atalaia', lang === 'en' ? 'en' : '', 'blog');
const P = V.posts();
if (!P.length) { const k = V.retirar('blog'); console.log('site' + V.base + 'blog/ NOT built: no post in its content folder' + (k ? ' (' + k + ' stale entries taken down)' : '')); return; }

/* ---- the index */
const B = [V.nav(V.base + 'blog/')];
B.push(C.header({ eyebrow: 'Atalaia · Blog', title: W.title, deck: W.deck }));
B.push('<div class="col"><div class="vt-posts">' + P.map((p) => '<a class="vt-post" href="' + V.base + 'blog/' + esc(p.slug) + '/"><span class="vt-k">' + esc(p.data.label) + '</span><span class="vt-pt">' + esc(p.titulo) + '</span>'
  + (str(p.resumo) ? '<span class="vt-pr">' + esc(p.resumo) + '</span>' : '') + '</a>').join('') + '</div></div>');
const pIdx = V.pagina({ dir: 'blog', title: W.page, cssRaw: CSS, bodyRaw: B.join('\n\n'),
  desc: W.desc(P.map((p) => p.titulo).slice(0, 3).join('; ')) });

/* ---- one page per post (newer on the left of the pair, older on the right) */
P.forEach((p, i) => {
  const newer = P[i - 1], older = P[i + 1];
  const Q = [V.nav(V.base + 'blog/')];
  Q.push(C.header({ eyebrow: 'Atalaia · Blog · ' + p.data.label, title: p.titulo, deck: str(p.resumo) ? p.resumo : '' }));
  Q.push('<article class="col vt-md">' + p.html + '</article>');
  if (p.fontes.length) Q.push('<section class="col vt-fontes"><div class="sec-head"><div class="lab">' + esc(W.fontes) + '</div><h2>' + esc(W.fontesTit) + '</h2></div><ol>'
    + p.fontes.map((f) => '<li>' + V.fonte(f) + '</li>').join('') + '</ol></section>');
  const pn = (x, cls, k) => '<a class="card ' + cls + '" href="' + V.base + 'blog/' + esc(x.slug) + '/"><span class="card-k">' + esc(k) + '</span><span class="card-t">' + esc(x.titulo) + '</span></a>';
  Q.push('<section class="col"><div class="vt-pn">' + (newer ? pn(newer, 'prev', W.recente + newer.data.label) : '') + (older ? pn(older, 'next', W.anterior + older.data.label + ' →') : '') + '</div>'
    + C.pRaw('<a href="' + V.base + 'blog/">' + esc(W.todos) + '</a>' + esc(' · ') + '<a href="' + V.base + '">' + esc(W.apresentacao) + '</a>') + '</section>');
  V.pagina({ dir: 'blog/' + p.slug, title: 'Atalaia: ' + p.titulo, cssRaw: CSS, bodyRaw: Q.join('\n\n'), desc: W.pdesc(p) });
});
const keep = P.map((p) => p.slug).concat(['index.html']);
for (const e of fs.readdirSync(OUT)) if (!keep.includes(e)) fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
console.log('site' + pIdx + 'index.html written (unlisted): ' + P.length + ' posts' + V.stubNote());
}
for (const lang of ['pt', 'en']) construir(lang);
