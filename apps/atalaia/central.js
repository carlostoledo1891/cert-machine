#!/usr/bin/env node
/* central.js — site/atalaia/central/: the Atalaia Central (Mission Control) behind a simple password (D34, 2026-11-16).
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   WHY. The operator, 2026-11-16: a Central for the engineering partner first and military readers second; "a simple password system and no
   integrations or API". The Central's code and mission data stay private (D27), so what this repository holds and serves
   is CIPHER TEXT: data/central/site/central.bin is the app's page, its two scripts and the area data, encrypted by the
   private ~/Projects/atalaia/central/publicar-central.js (PBKDF2-SHA256, 600,000 iterations, AES-256-GCM). This page is a
   password box; the browser derives the key, decrypts, and writes the app in place. No server checks anything and
   nothing is sent anywhere: a wrong password simply fails to decrypt.

   PUBLIC ON PURPOSE (public data, nothing of ours): the map library, the glyphs, the two basemap styles here, and the
   tiles, read from raw.githubusercontent.com at the commit data/central/PINS.json names (the host drops large files; the
   Swell pattern). Cost, said once: the cipher text stays in the public history; a leaked password opens the versions
   already published, and a new password protects only the next ones.

   The institute and the unit are not named here (D33, atalaia/CLAUDE.md rule 7b). pt-BR. Unlisted (noindex).

   usage: node apps/atalaia/central.js (also called at the end of apps/atalaia/build.js)                           */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const { VERSAO } = require('./registros.js');
const SRC = path.join(__dirname, 'data', 'central');
const OUT = path.join(ROOT, 'site', 'atalaia', 'central');
const die = (m) => { console.error('ATALAIA CENTRAL PAGE REFUSED: ' + m); process.exit(1); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const esc = C.esc;

/* the published files, checked against their pins; the cipher text is not readable here and is not meant to be */
const PINS = JSON.parse(fs.readFileSync(path.join(SRC, 'PINS.json'), 'utf8'));
for (const [f, h] of Object.entries(PINS.arquivos)) if (sha(path.join(SRC, 'site', f)) !== h) die('data/central/site/' + f + ' does not match its pin in PINS.json');
const bin = JSON.parse(fs.readFileSync(path.join(SRC, 'site', 'central.bin'), 'utf8'));
if (bin.kdf !== 'PBKDF2-SHA256' || bin.cifra !== 'AES-256-GCM' || bin.iter < 600000) die('central.bin is not the declared cipher (PBKDF2-SHA256 ≥ 600,000 iterations, AES-256-GCM)');
/* nothing readable of the app may sit beside the cipher text */
for (const f of Object.keys(PINS.arquivos)) if (/^(index\.html|app\.js|instruments\.js|data\/)/.test(f)) die('a plain copy of the app is in data/central/site: ' + f);

const B = [];
B.push(C.header({ eyebrow: 'Atalaia · Central de operações · acesso com senha · versão ' + VERSAO.n,
  title: 'A Central do Atalaia',
  deck: 'O ambiente experimental do Atalaia, em simulação: as quatro perguntas antes de decolar, o mapa de alcance, os estados da missão e o treino de falhas. A ilha de Florianópolis é a área principal de testes da pesquisa aplicada com um instituto de engenharia; o Médio Vale do Itajaí é a referência operacional, defesa civil primeiro e uso militar depois.' }));
B.push('<div class="col">'
  + '<form class="ac-f" id="ac-form" autocomplete="on"><input type="text" name="usuario" value="atalaia" autocomplete="username" hidden>'
  + '<label class="ac-l"><span>Senha</span><input type="password" name="senha" id="ac-senha" autocomplete="current-password" required></label>'
  + '<button type="submit">Entrar</button></form>'
  + '<p class="ac-st" id="ac-st" role="status" aria-live="polite">' + esc('A senha é dada aos parceiros da pesquisa e da avaliação.') + '</p>'
  + C.scope('A Central abre neste navegador: a senha decifra o aplicativo aqui mesmo, e nada é enviado a um servidor. Tudo nela é simulação; nada voou. Funciona melhor numa tela de computador.')
  + '</div>');
B.push(C.section({ lab: 'Sem senha', title: 'O que se pode ler sem a senha', bodyRaw:
  C.plainList([
    { b: 'A apresentação curta.', raw: '<a href="/atalaia/">/atalaia/</a>' + esc(', com quatro replays sintéticos.') },
    { b: 'A minuta técnica.', raw: '<a href="/atalaia/doutrina/">/atalaia/doutrina/</a>' + esc(', com princípios, estados da missão, requisitos, critérios de validação e limites.') },
    { b: 'Para interlocutores militares.', raw: '<a href="/atalaia/eb/">/atalaia/eb/</a>' + esc(', com a comparação com a simulação da ESAO de 2025.') }]) }));

const foot = '<p>' + esc('Preparado por Carlos Toledo, com ajuda de IA (Claude). A Central é publicada cifrada (AES-256-GCM, chave derivada da senha por PBKDF2-SHA256): sem a senha, o que este site guarda dela é texto cifrado. O mapa usa dados públicos: © OpenStreetMap contributors (ODbL), tiles Protomaps; Copernicus GLO-30; Copernicus Sentinel-2 (2025).') + '</p>';
const css = `
.ac-f{display:flex;align-items:flex-end;gap:var(--s-3);flex-wrap:wrap;margin:var(--s-5) 0 var(--s-3)}
.ac-l{display:flex;flex-direction:column;gap:var(--s-2);flex:1 1 16rem;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-3)}
.ac-l input{font:inherit;font-family:var(--f-mono);font-size:var(--text-body);letter-spacing:var(--track-slight);text-transform:none;color:var(--ink);background:var(--sunk);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:var(--s-3)}
.ac-l input:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.ac-f button{font-family:var(--f-sans);font-size:var(--text-small);font-weight:600;color:var(--paper);background:var(--ink);border:0;border-radius:var(--radius-pill);padding:var(--s-3) var(--s-5);cursor:pointer}
.ac-f button[disabled]{opacity:.5;cursor:default}
.ac-f button:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.ac-st{font-size:var(--text-small);color:var(--ink-3);min-height:1.5em}
`;
/* the gate: derive, decrypt, inflate, inline the two scripts, write the app in place */
const script = `<script>(function(){
var f=document.getElementById('ac-form'),s=document.getElementById('ac-st'),b=f.querySelector('button');
function u8(x){var r=atob(x),u=new Uint8Array(r.length);for(var i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u}
f.addEventListener('submit',function(ev){ev.preventDefault();var pw=f.elements.senha.value;if(!pw)return;
b.disabled=true;s.textContent='Abrindo a Central…';
if(!(window.crypto&&crypto.subtle&&window.DecompressionStream)){s.textContent='Este navegador não abre a Central; use um navegador atualizado.';b.disabled=false;return}
var bin;fetch('central.bin',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('http');return r.json()}).then(function(j){bin=j;
return crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey'])}).then(function(k){
return crypto.subtle.deriveKey({name:'PBKDF2',salt:u8(bin.salt),iterations:bin.iter,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['decrypt'])}).then(function(key){
return crypto.subtle.decrypt({name:'AES-GCM',iv:u8(bin.iv)},key,u8(bin.ct)).then(null,function(){var e=new Error('senha');e.senha=1;throw e})}).then(function(gz){
return new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}).then(function(t){
var P=JSON.parse(t),h=P.html;Object.keys(P.files).forEach(function(k){h=h.replace('<script src="'+k+'"><\\/script>',function(){return '<script>'+P.files[k].replace(/<\\/script/gi,'<\\\\/script')+'<\\/script>'})});
document.open();document.write(h);document.close()}).catch(function(e){s.textContent=e&&e.senha?'Senha incorreta.':'Não foi possível abrir a Central agora; tente de novo.';b.disabled=false;f.elements.senha.select()})})})();<\/script>`;
let html = TPL.render({ title: 'A Central do Atalaia (acesso com senha)', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'pt-BR', cssRaw: css, scriptRaw: script,
  desc: 'A Central do Atalaia, ambiente experimental em simulação, com acesso por senha.', path: '/atalaia/central/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(SRC, 'site'), OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/atalaia/central/ written (unlisted, password): ' + Object.keys(PINS.arquivos).length + ' files, tiles at ' + PINS.tiles_commit.slice(0, 8));
