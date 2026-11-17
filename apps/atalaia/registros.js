/* registros.js — the ONE reading of the Atalaia records, and the wording the three Atalaia pages share.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   Read by build.js (the minuta, /atalaia/doutrina/), landing.js (/atalaia/) and eb.js (/atalaia/eb/). The pins are
   checked here, the verdicts the pages state are asserted here, and each test result is written here once, with its
   stage (EVID), so the three pages cannot state the same result two ways. v0.4.1 (2026-11-16): an outside review of
   v0.4 asked for consistency between the landing and the minuta, for "região de proteção" in place of "região
   garantida", and for the IBGE result to say what kind of data it ran on; a rule defined twice WILL diverge.

   Every mission number comes from data/ (central.json, missao.json, ilha.json), written by the private Atalaia
   generators over the Copernicus relief and the DJI FlyCart 30 spec sheet and pinned by sha256 in
   data/PROVENANCE.json. The test results in EVID are the LOCUS and Veto records (frontier-apps: docs/drone6.md,
   docs/gnss.md, docs/osnma.md, docs/live.md), each named with its stage; nothing here has flown.            */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DATA = path.join(__dirname, 'data');
const die = (m) => { console.error('ATALAIA RECORDS REFUSED: ' + m); process.exit(1); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

/* the version every page prints (the minuta's version block and section 13 say what changed) */
const VERSAO = { n: '0.5', data: '16/11/2026' };

/* the brand (2026-11-16): one tagline and one family line, written once here and printed by every page */
const MARCA = {
  lema: 'integridade verificável para sistemas autônomos e infraestrutura crítica',
  familia: 'Atalaia: integridade verificável para sistemas autônomos e infraestrutura crítica, em quatro domínios (ar, terra, mar e offshore) sobre o mesmo núcleo de integridade. O primeiro é o ar: drones que operam sem um GNSS em que se possa confiar.',
  /* the signals line (v0.5, 2026-11-16): receive-only became silent-by-default with an optional, PROPOSED active module;
     what never changes is stated here once and every page prints it */
  sinais: 'O Atalaia recebe sinais e fica em silêncio por padrão. Um módulo ativo opcional, proposto, liga só dentro de um envelope aprovado antes da missão, com equipamento homologado de baixa potência, e cada acionamento fica no registro. Em nenhum modo bloqueia, falsifica ou interfere em sinais de terceiros, nem transmite nas faixas do GNSS.' };
/* the same three lines in English, for the mirror at /atalaia/en/ (2026-11-16), written once here like the Portuguese;
   the English pages print these and the English content's silent-by-default sentence must be MARCA_EN.sinais */
const MARCA_EN = {
  lema: 'verifiable integrity for autonomous systems and critical infrastructure',
  familia: 'Atalaia: verifiable integrity for autonomous systems and critical infrastructure, across four domains (air, land, sea and offshore) on one shared integrity core. Air comes first: drones that operate without a GNSS signal they can trust.',
  sinais: 'Atalaia receives signals and stays silent by default. An optional active module, proposed, switches on only inside an envelope approved before the mission, using type-approved low-power equipment, and every activation is logged. In no mode does it jam, spoof or interfere with third-party signals, or transmit in the GNSS bands.' };

/* ---- the records, checked against their pins */
const PROV = JSON.parse(fs.readFileSync(path.join(DATA, 'PROVENANCE.json'), 'utf8'));
for (const [f, h] of Object.entries(PROV.registros)) if (sha(path.join(DATA, f)) !== h) die(f + ' does not match its pin in PROVENANCE.json');
const CJ = JSON.parse(fs.readFileSync(path.join(DATA, 'central.json'), 'utf8'));
const MJ = JSON.parse(fs.readFileSync(path.join(DATA, 'missao.json'), 'utf8'));
/* v0.3 (D28): the Florianópolis island's RESULTS, written by the private generator (the instruments stay private, D27) */
const IL = JSON.parse(fs.readFileSync(path.join(DATA, 'ilha.json'), 'utf8'));
const ILM = Object.fromEntries(IL.missoes.map((m) => [m.id, m]));

/* ---- the verdicts the pages state in words: a changed record refuses the build before a sentence goes stale */
if (!IL.caso_ctr || IL.caso_ctr.espaco.verdict !== 'FALTA DADO' || !IL.caso_ctr.espaco.volumes.length) die('the airport-zone case is missing from ilha.json, or its airspace verdict changed');
if (ILM.morros.energia12.verdict !== 'PASSA' || ILM['costa-rv'].energia12.verdict !== 'FALTA DADO' || ILM['costa-base'].energia12.verdict !== 'NAO PASSA' || ILM.agua.rota.verdict !== 'NAO PASSA')
  die('an island verdict the pages state has changed: re-read ilha.json before re-wording');
const AV = CJ.avancado, DI = CJ.direto, AL = CJ.alcance, SI = CJ.sintetico, FR = CJ.frota, KG = CJ.carga_padrao_kg;
const R12 = AV.rows[KG], R30 = AV.rows[30], RS = DI.rows[KG];
if (R12.verdict !== 'PASSA') die('the mission load no longer passes: ' + R12.verdict);
if (R30.verdict !== 'FALTA DADO') die('30 kg is no longer FALTA DADO: ' + R30.verdict);
if (RS.verdict !== 'NAO PASSA') die('the serra no longer refuses: ' + RS.verdict);
if (MJ.posto.laudo.verdict !== 'PASSA') die('the route laudo to the post no longer passes');
if (CJ.clima.verdict !== 'PASSA' || CJ.gps.verdict !== 'PASSA') die('the weather or GNSS laudo no longer passes');
if (!MJ.amazonia || MJ.amazonia.laudo.verdict !== 'FALTA DADO') die('the Tabatinga route laudo is no longer FALTA DADO');

/* ---- the synthetic week of the reference mission (section 9 of the minuta) */
const V = SI.voos;
const pa = V.filter((v) => v[2] === 'P'), fa = V.filter((v) => v[2] === 'F'), na = V.filter((v) => v[2] === 'N');
const paMiss = pa.filter((v) => v[4]).length, faOk = fa.filter((v) => v[3]).length;
const naOk = na.filter((v) => v[3]).length;
const CAP = FR.capacidade.quente;
const zPost = Math.round(MJ.profile.reduce((b, p) => Math.abs(p[0] - AV.post_km) < Math.abs(b[0] - AV.post_km) ? p : b)[1]);
const zSerra = Math.round(MJ.profile[MJ.profile.length - 1][1]);
const zBase = Math.round(MJ.profile[0][1]);
const RES_MIN = CJ.premissas.reserva_min;
const CTRV = IL.caso_ctr.espaco.volumes[0];

/* pt-BR numbers */
const n = (x, d = 0) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---- THE TEST RESULTS, once. l: the maturity level (D = Demonstrado: simulation or bench, never field), det: the
   stage, k: the number as printed, t: what it shows and what it does not. The minuta's section 9 table and the EB
   page's evidence table both print this list. */
const EVID = [
  { k: '24.300 de 24.300', l: 'D', det: 'simulação', t: 'verificações em que a posição real ficou dentro da região de proteção, em 45 voos simulados sobre relevo e imagens reais de Minas Gerais; instantes correlacionados de 45 trajetórias, não experimentos independentes.' },
  { k: faOk + ' de ' + fa.length, l: 'D', det: 'simulação', t: 'saídas retidas por falta de dado que teriam chegado com reserva, na semana sintética de Blumenau: o custo da cautela.' },
  { k: '12 m', l: 'D', det: 'simulação', t: 'erro da melhor estimativa em 95% do tempo, com sensor inercial tático e câmera, nos mesmos voos.' },
  { k: '3 s', l: 'D', det: 'simulação', t: 'até o alarme, com o GNSS apontado como culpado, numa viagem simulada de caminhão na BR-040.' },
  { k: '24 de 24', l: 'D', det: 'dados reais gravados', t: 'desvios lentos sintéticos, aplicados a dados GNSS reais gravados em estações fixas do IBGE, detectados em cada uma das três velocidades testadas quando o teste sabia que a estação estava parada; sem essa restrição de movimento, nenhum dos 24. Não é voo: num drone, a restrição viria do sensor de movimento da caixa.' },
  { k: '0 de 193.887', l: 'D', det: 'vetores oficiais', t: 'falhas na conferência das marcas de autenticação (tags) do Galileo, nos vetores de teste oficiais; não mede resistência a falsificação ou retransmissão.' },
  { k: '53 de 53', l: 'D', det: 'bancada', t: 'erros plantados no laudo e no lacre que foram pegos, em bancada no Veto.' }];

/* ---- the stylesheet the Atalaia text pages share (the two-column rows that turn into blocks on a phone, the maturity
   chips, the source lines); figure rules stay with the page that draws the figure */
const CSS_BASE = `
.at-src{font-size:var(--text-small);color:var(--ink-4)}
.at-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin:var(--s-2) 0 0}
.at-h3{margin:var(--s-6) 0 var(--s-3)}
.at-cl{display:block}
.at-cl+.at-cl{margin-top:var(--s-2)}
table{table-layout:fixed}
th:first-child,td:first-child{width:30%}
@media (max-width:640px){.tw{border:0;border-radius:0;background:none}table{min-width:0}thead{display:none}tr{display:block;border-top:1px solid var(--rule)}td{display:block;border-bottom:0;padding:var(--s-1) 0}.tw td:first-child{width:auto;position:static;background:none;padding-top:var(--s-4)}td:last-child{padding-bottom:var(--s-4)}.at-st{white-space:normal}}
.at-st{display:inline-block;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-slight);color:var(--ink-3);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:1px var(--s-2);white-space:nowrap}
.at-st.p{border-style:dashed;border-color:var(--ink-4)}
.at-st.v{background:var(--ink);color:var(--paper);border-color:var(--ink)}
`;

/* ---- the verdict words (WARRANT: icon and word, never colour alone), as design/components.js tag() takes them */
const VWORD = { 'PASSA': ['✓ PASSA', 'held'], 'NAO PASSA': ['× NÃO PASSA', 'dep'], 'FALTA DADO': ['∅ FALTA DADO', 'open'] };

/* ---- the pre-rendered replays (videos, no code: D27), as the landing and /atalaia/eb/ embed them: muted, looping,
   played only while on screen and never under reduced motion. `base` is the folder the films are served from. */
const filme = (f, t, base) => '<video class="lp-v" src="' + base + f + '.mp4" poster="' + base + f + '.jpg" muted loop playsinline preload="metadata" aria-label="' + String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '"></video>';
const FILM_CSS = `
.lp-v{display:block;width:100%;height:auto;aspect-ratio:16/9;background:var(--sunk);border-radius:var(--radius-s)}
`;
const FILM_SCRIPT = `<script>(function(){var vs=document.querySelectorAll('video.lp-v');if(!('IntersectionObserver'in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.play().catch(function(){})}else{e.target.pause()}})},{threshold:.4});
vs.forEach(function(v){io.observe(v)})})();</script>`;

module.exports = { VERSAO, MARCA, MARCA_EN, PROV, CJ, MJ, IL, ILM, AV, DI, AL, SI, FR, KG, R12, R30, RS, V, pa, fa, na, paMiss, faOk, naOk,
  CAP, zPost, zSerra, zBase, RES_MIN, CTRV, n, EVID, CSS_BASE, VWORD, filme, FILM_CSS, FILM_SCRIPT };
