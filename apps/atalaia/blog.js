#!/usr/bin/env node
/* blog.js — site/atalaia/blog/: the Atalaia research notebook, an index and one page per post, unlisted.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   Each post is a Markdown file in conteudo/blog/ with a front-matter (titulo, data, resumo, fontes), read through
   vitrine.js: its front-matter reader and its Markdown subset (headings, paragraphs, lists, quotes, tables, bold,
   italic, code and links; anything else stays text). Newest first. Every post ends with its sources. Without a post no
   page is written and the folder is taken down. pt-BR (the project's rule).

   usage: node apps/atalaia/blog.js (also called at the end of apps/atalaia/build.js)                               */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./vitrine.js');
const { C, esc, str } = V;
const OUT = path.join(V.ROOT, 'site', 'atalaia', 'blog');

const P = V.posts();
if (!P.length) { const k = V.retirar('blog'); console.log('site/atalaia/blog/ NOT built: no post in apps/atalaia/conteudo/blog/' + (k ? ' (' + k + ' stale entries taken down)' : '')); return; }

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

/* ---- the index */
const B = [V.nav('/atalaia/blog/')];
B.push(C.header({ eyebrow: 'Atalaia · Blog', title: 'O caderno de pesquisa',
  deck: 'O que estamos aprendendo ao construir integridade verificável para sistemas autônomos: as ideias, os testes, o que deu certo e o que não deu. Cada texto termina com as suas fontes.' }));
B.push('<div class="col"><div class="vt-posts">' + P.map((p) => '<a class="vt-post" href="/atalaia/blog/' + esc(p.slug) + '/"><span class="vt-k">' + esc(p.data.label) + '</span><span class="vt-pt">' + esc(p.titulo) + '</span>'
  + (str(p.resumo) ? '<span class="vt-pr">' + esc(p.resumo) + '</span>' : '') + '</a>').join('') + '</div></div>');
const pIdx = V.pagina({ dir: 'blog', title: 'Atalaia: o caderno de pesquisa', cssRaw: CSS, bodyRaw: B.join('\n\n'),
  desc: 'O blog do Atalaia: ' + P.map((p) => p.titulo).slice(0, 3).join('; ') + '.' });

/* ---- one page per post (newer on the left of the pair, older on the right) */
P.forEach((p, i) => {
  const newer = P[i - 1], older = P[i + 1];
  const Q = [V.nav('/atalaia/blog/')];
  Q.push(C.header({ eyebrow: 'Atalaia · Blog · ' + p.data.label, title: p.titulo, deck: str(p.resumo) ? p.resumo : '' }));
  Q.push('<article class="col vt-md">' + p.html + '</article>');
  if (p.fontes.length) Q.push('<section class="col vt-fontes"><div class="sec-head"><div class="lab">' + esc('Fontes') + '</div><h2>' + esc('De onde vem cada fato') + '</h2></div><ol>'
    + p.fontes.map((f) => '<li>' + V.fonte(f) + '</li>').join('') + '</ol></section>');
  const pn = (x, cls, k) => '<a class="card ' + cls + '" href="/atalaia/blog/' + esc(x.slug) + '/"><span class="card-k">' + esc(k) + '</span><span class="card-t">' + esc(x.titulo) + '</span></a>';
  Q.push('<section class="col"><div class="vt-pn">' + (newer ? pn(newer, 'prev', '← Mais recente · ' + newer.data.label) : '') + (older ? pn(older, 'next', 'Anterior · ' + older.data.label + ' →') : '') + '</div>'
    + C.pRaw('<a href="/atalaia/blog/">' + esc('Todos os textos') + '</a>' + esc(' · ') + '<a href="/atalaia/">' + esc('A apresentação do Atalaia') + '</a>') + '</section>');
  V.pagina({ dir: 'blog/' + p.slug, title: 'Atalaia: ' + p.titulo, cssRaw: CSS, bodyRaw: Q.join('\n\n'),
    desc: 'Atalaia, blog, ' + p.data.label + ': ' + (str(p.resumo) ? p.resumo : p.titulo) });
});
const keep = P.map((p) => p.slug).concat(['index.html']);
for (const e of fs.readdirSync(OUT)) if (!keep.includes(e)) fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
console.log('site' + pIdx + 'index.html written (unlisted): ' + P.length + ' posts' + V.stubNote());
