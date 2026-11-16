#!/usr/bin/env node
/* landing.js — site/atalaia/index.html: the Atalaia landing page (D26, D28), short and non-technical, unlisted.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   What it shows: the idea in three sentences, and pre-rendered replays of synthetic missions on the Florianópolis
   island and in the Médio Vale do Itajaí (SC). NO CODE (D27: new work is private): the films are videos rendered from
   the private Mission Control, pinned by sha256 in data/PROVENANCE.json like every record here; their verdicts are the
   ones apps/atalaia/data/ilha.json states, and the build refuses if those change. The technical minuta lives at
   /atalaia/doutrina/. pt-BR (the project's rule). The unit and the engineering institute are not named.

   usage: node apps/atalaia/landing.js (also called at the end of apps/atalaia/build.js)                            */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OUT = path.join(ROOT, 'site', 'atalaia');
const DATA = path.join(__dirname, 'data');
const die = (m) => { console.error('ATALAIA LANDING REFUSED: ' + m); process.exit(1); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const esc = C.esc;

const PROV = JSON.parse(fs.readFileSync(path.join(DATA, 'PROVENANCE.json'), 'utf8'));
for (const [f, h] of Object.entries(PROV.registros)) if (sha(path.join(DATA, f)) !== h) die(f + ' does not match its pin in PROVENANCE.json');
const IL = JSON.parse(fs.readFileSync(path.join(DATA, 'ilha.json'), 'utf8'));
const ILM = Object.fromEntries(IL.missoes.map((m) => [m.id, m]));
if (ILM['costa-rv'].energia12.verdict !== 'FALTA DADO' || ILM.agua.rota.verdict !== 'NAO PASSA' || ILM.morros.energia12.verdict !== 'PASSA')
  die('an island verdict the films are captioned with has changed');

const FILMS = [
  { f: 'ilha-morros', t: 'Um posto nos morros, com o GPS falsificado no caminho',
    c: 'A 4,5 km da base, no norte da ilha. No meio do caminho, o GPS passa a mentir: o trecho fica vermelho, o drone segue pela região onde certamente está, entrega e volta com reserva. Simulação.' },
  { f: 'ilha-costa-lagoa', t: 'A Costa da Lagoa, uma comunidade só acessível por barco ou trilha',
    c: 'Direto da base, a ida e volta não cabe na bateria. De uma base avançada no Rio Vermelho, falta um dado: o consumo real com carga, que um voo de calibração mede. O replay mostra o voo de treino, não uma missão liberada. Simulação.' },
  { f: 'ilha-barco', t: 'Um barco a 4 km da praia: o caso que o protocolo recusa',
    c: 'Sobre o mar, sem GPS, nem o relevo nem a imagem devolvem a posição. Quando o GPS falha, a região cresce além do limite e o drone se declara perdido. É por isso que a Central não libera esta missão. Simulação.' },
  { f: 'vale-cheia', t: 'Blumenau, com o rio a 14 m',
    c: 'A mancha cinza é a cheia de 14 m na régua da Ponte Adolfo Konder. A 3,3 km da base, 98 edificações ficam cercadas pela água; o drone leva 12 kg e volta com reserva. Simulação.' }];
for (const F of FILMS) for (const ext of ['.mp4', '.jpg']) if (!PROV.registros['filmes/' + F.f + ext]) die('the film ' + F.f + ext + ' is not pinned in PROVENANCE.json');

const video = (F) => '<video class="lp-v" src="filmes/' + F.f + '.mp4" poster="filmes/' + F.f + '.jpg" muted loop playsinline preload="metadata" aria-label="' + esc(F.t) + '"></video>';
const fig = (F) => C.figure({ svgRaw: video(F), caption: F.t + '. ' + F.c, record: ['apps/atalaia/data/filmes/' + F.f + '.mp4'] });

const B = [];
B.push(C.header({ eyebrow: 'Proposta de protocolo · testes sintéticos em Santa Catarina',
  title: 'Atalaia: drones que sabem o que conseguem garantir',
  deck: 'Quando o GPS de um drone falha ou é falsificado, o Atalaia não promete que ele nunca se perca. Ele calcula o que dá para garantir sobre onde o drone está, só deixa a missão seguir quando isso pode ser demonstrado, e registra cada decisão para quem quiser conferir depois.' }));
B.push('<div class="col">' + C.scope('Tudo nesta página é simulação, sobre o relevo real da ilha de Florianópolis e do Vale do Itajaí. Nada voou. O próximo passo é um programa de pesquisa aplicada com um instituto de engenharia.') + '</div>');
B.push(fig(FILMS[0]));
B.push(C.section({ lab: 'A ideia', title: 'Três mudanças na forma de operar', bodyRaw:
  C.plainList([
    { b: 'A posição é uma área, não um ponto.', text: 'O drone sabe a região onde certamente está, calculada com os próprios sensores e o relevo. Um GPS que aponta para fora dela é declarado falso.' },
    { b: 'Antes de decolar, quatro perguntas.', text: 'A missão é viável, resiliente, segura e auditável? Cada uma responde passa, não passa ou falta dado, e o falta dado diz que medida decidiria.' },
    { b: 'Depois do voo, um registro que se confere.', text: 'Cada decisão fica assinada e encadeada, para que outra instituição, com outro programa, refaça as contas.' }]) }));
B.push(C.section({ lab: 'Nos testes', title: 'O que os testes sintéticos mostram', bodyRaw:
  C.p('Cada replay é uma missão calculada: a energia no pior caso, o relevo que devolve ou não a posição, o espaço aéreo, e o que o drone faz quando o GPS mente. Uns passam; outros dizem exatamente o que falta.') }));
for (const F of FILMS.slice(1)) B.push(fig(F));
B.push(C.section({ lab: 'Onde está', title: 'O que já existe e o que vem depois', bodyRaw:
  C.p('Existem uma minuta de protocolo, os instrumentos que a tornam praticável e um ambiente de simulação. Os resultados de simulação e de bancada estão documentados; nenhum foi validado em campo. O próximo passo é medir com engenharia aplicada, e só depois levar os resultados a uma avaliação militar.')
  + C.pRaw('<a href="/atalaia/doutrina/">A minuta técnica, com princípios, procedimentos, requisitos e critérios de validação →</a>') }));

const foot = '<p>' + esc('Preparado por Carlos Toledo, com ajuda de IA (Claude). Documento de trabalho: não é doutrina aprovada, proposta comercial nem documento oficial de nenhum órgão. Os replays são simulações renderizadas sobre o relevo Copernicus GLO-30 e mapas © OpenStreetMap; cada filme é fixado por sha256 em apps/atalaia/data/PROVENANCE.json.') + '</p>';
const css = `
.lp-v{display:block;width:100%;height:auto;aspect-ratio:16/9;background:var(--sunk);border-radius:var(--radius-s)}
`;
const script = `<script>(function(){var vs=document.querySelectorAll('video.lp-v');if(!('IntersectionObserver'in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.play().catch(function(){})}else{e.target.pause()}})},{threshold:.4});
vs.forEach(function(v){io.observe(v)})})();</script>`;
let html = TPL.render({ title: 'Atalaia: drones que sabem o que conseguem garantir', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'pt-BR', cssRaw: css, scriptRaw: script,
  desc: 'Atalaia, proposta de protocolo para drones com o GPS degradado: replays de missões sintéticas na ilha de Florianópolis e no Vale do Itajaí.', path: '/atalaia/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(path.join(OUT, 'filmes'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const F of FILMS) for (const ext of ['.mp4', '.jpg']) fs.copyFileSync(path.join(DATA, 'filmes', F.f + ext), path.join(OUT, 'filmes', F.f + ext));
console.log('site/atalaia/index.html written (the landing, unlisted): ' + FILMS.length + ' films');
