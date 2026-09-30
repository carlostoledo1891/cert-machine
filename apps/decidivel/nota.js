/* nota.js — the Nota Técnica de Decidibilidade 4D: the one-page certificate of
   decision a geophysicist can put on the desk, generated for the headline cell
   from the same numbers object as the page and the deck, printed to PDF by the
   Contraprova deck's printer. apps/decidivel · cert-machine              MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const CP = require(path.join(ROOT, 'apps', 'contraprova', 'deck.js'));
const { br } = require('./numbers.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const REPO = 'https://github.com/carlostoledo1891/cert-machine';

function build(N, git) {
  const L = N.L, D = N.D, H = N.H, rc = H.receipt, A = H.attributes.K0, MC = H.mc15.K0[1], PR = H.price.K0;
  const w = (x) => br.dec(x, 2) + '%';
  const rg = (k) => br.dec(D.box[k][0], k === 'Kmin' ? 0 : 2) + '–' + br.dec(D.box[k][1], k === 'Kmin' ? 0 : 2);
  const und = rc.witnesses.und, det = rc.witnesses.det;
  const wt = (W) => { const p = {}; for (const k of Object.keys(W.at)) p[k] = W.at[k][0]; return 'φ = ' + br.dec(p.phi, 3) + ', s = ' + br.dec(p.s, 2) + ', G/K = ' + br.dec(p.gk, 2) + ', Kmin = ' + br.dec(p.Kmin, 0) + ', Sg = ' + br.dec(p.dSg, 2) + ', w = ' + br.dec(p.w, 2) + ', Kg = ' + br.dec(p.Kg, 2) + ', ρg = ' + br.dec(p.rhog, 2) + ', Ko = ' + br.dec(p.Ko, 2) + ', ρo = ' + br.dec(p.rhoo, 2) + ' → ΔIp/Ip = ' + br.pct(100 * (Math.sqrt(W.r[0]) - 1), 2); };
  const signH = N.signAt(L.axes.sg.findIndex((s) => s[0] === '0.16'), L.axes.phi.findIndex((p) => p[0] === '0.13'));
  const verdict = { PROVADO: 'DETECTÁVEL (PROVADO)', REFUTADO: 'INDETECTÁVEL (REFUTADO)', RECUSADO: 'INDETERMINADO (RECUSADO)' }[rc.verdict];
  const K4 = H.table.find((t) => t.k === 'K4'), K3 = H.table.find((t) => t.k === 'K3'), K2 = H.table.find((t) => t.k === 'K2');
  const nd = PR.filter((x) => x.slices);
  const S = '<div class="nt">'
    + '<div class="hd"><div><div class="ey">Nota Técnica de Decidibilidade 4D · exemplo · análogo UNISIM-IV-2026 · coquina, φ 0,13–0,15, frente de gás Sg 0,15–0,30</div><h1>Um 4D que resolve 1,5% de impedância vê a injeção de gás nesta célula, para todo cenário do envelope declarado?</h1></div>'
    + '<div class="vd">' + esc(verdict) + '</div></div>'
    + '<div class="meta">build git ' + esc(git) + ' · registro apps/decidivel/data/decidivel-ledger.json · reexecutável em carlostoledo.co/decidivel (toque na célula: “decidir de novo no meu navegador”)</div>'
    + '<div class="g2">'
    + '<div><h2>2 · Envelope declarado (fonte por linha)</h2><table>'
    + '<tr><td>φ ∈ [0,13; 0,15]</td><td>porosidade mediana do benchmark (UNISIM-IV, POR_055)</td></tr>'
    + '<tr><td>Sg injetado ∈ [0,15; 0,30]</td><td>frente de um ciclo WAG; Swi = 0,18, Sorg = 0,35 (tabelas kr do UNISIM-IV)</td></tr>'
    + '<tr><td>arcabouço s ∈ [' + rg('s') + '], G/K ∈ [' + rg('gk') + ']</td><td>9 plugues de Iracema, Quadros et al. 2025 (Sci Rep 15:33467); Kdry = s(1 − φ/0,40)Kmin</td></tr>'
    + '<tr><td>Kmin ∈ [' + rg('Kmin') + '] GPa, ρmin ∈ [' + rg('rhomin') + ']</td><td>Hill dos plugues (calcita, dolomita, quartzo) a calcita tabulada (Mavko et al.)</td></tr>'
    + '<tr><td>salmoura K ∈ [' + rg('Kw') + '], ρ ∈ [' + rg('rhow') + ']</td><td>Batzle–Wang 1992, 60 MPa, 90 °C, salinidade 0,10–0,225</td></tr>'
    + '<tr><td>óleo vivo K ∈ [' + rg('Ko') + '], ρ ∈ [' + rg('rhoo') + ']</td><td>Batzle–Wang 1992, API 28–30, RGO 200–300 (Tupi, Cruz et al. 2021)</td></tr>'
    + '<tr><td>gás K ∈ [' + rg('Kg') + '] GPa, ρ ∈ [' + rg('rhog') + '] g/cm³</td><td>de metano a CO₂ puro, NIST (Span–Wagner); K e ρ independentes (conservador)</td></tr>'
    + '<tr><td>mistura de fluidos w ∈ [0; 1]</td><td>Reuss (uniforme) ↔ Voigt (em manchas); toda lei de Brie. Hipótese, não medição</td></tr>'
    + '<tr><td>fora do envelope</td><td>efeito de pressão; espessura e sintonia — dito, não escondido</td></tr>'
    + '</table></div>'
    + '<div><h2>3 · Modelo petroelástico</h2><p>Gassmann; mistura de fluidos entre Reuss e Voigt por w; arcabouço seco na tendência de porosidade crítica (φc = 0,40). Água e óleo em mistura de Reuss antes e depois. O veredito fala deste modelo e deste envelope, não da rocha.</p>'
    + '<h2>4 · Resultado garantido (arredondamento para fora)</h2><table>'
    + '<tr><td>ΔIp/Ip</td><td>∈ [' + w(rc.envelope[0]) + '; ' + w(rc.envelope[1]) + '] · |ΔIp/Ip| ≤ ' + w(A.Ip[3]) + '; um cenário atinge ' + w(A.Ip[1]) + ', outro ' + w(A.Ip[2]) + '</td></tr>'
    + '<tr><td>|ΔIs/Is|</td><td>≤ ' + w(A.Is[3]) + ' (só a densidade: Gassmann não altera G)</td></tr>'
    + '<tr><td>|ΔVp/Vs|</td><td>≤ ' + w(A.VpVs[3]) + ' (só o módulo)</td></tr>'
    + '<tr><td>sinal</td><td>não garantido: um cenário verificado ganha impedância a partir de ρgás = ' + (signH !== null ? br.dec(signH, 3) : '—') + ' g/cm³ (CO₂ puro: 0,89–0,97)</td></tr>'
    + '</table>'
    + '<h2>5 · Veredito a 1,5%: ' + esc(verdict) + '</h2>'
    + '<p><b>contraexemplo detectável:</b> ' + esc(det ? wt(det) : '—') + '</p><p><b>contraexemplo indetectável:</b> ' + esc(und ? wt(und) : '—') + '</p>'
    + '<p>Um estudo por ' + br.int(MC.draws) + ' sorteios do mesmo envelope diria “detectável em ' + br.pct(100 * MC.pDetect, 1) + '”; com o gás pobre, uniforme e o arcabouço medido, “' + br.pct(100 * H.mc15.K4[1].pDetect, 0) + '” — e esconderia o cenário garantido de ' + w(K4.range[1]) + '.</p></div>'
    + '</div>'
    + '<h2>6 · O que decide</h2><table class="dec">'
    + '<tr><td>requisito de resolução do levantamento</td><td>' + w(K4.range[0]) + ' de impedância torna a célula DETECTÁVEL com gás pobre, uniforme e arcabouço medido; ' + w(K3.range[0]) + ' com o gás e a distribuição medidos; só com a faixa física, nenhuma resolução: há cenário sem mudança</td></tr>'
    + '<tr><td>(1) PVT: composição do gás</td><td>gás pobre em CO₂ (≈ 5%): |ΔIp/Ip| ∈ [' + w(K2.range[0]) + '; ' + w(K2.range[3]) + '] → INDETERMINADO; gás rico (≈ 80%): o sinal deixa de ser garantido</td></tr>'
    + '<tr><td>(2) distribuição do gás (testemunho, RMN, 4D anterior)</td><td>uniforme (w ≤ 0,25) e gás pobre: ≥ ' + w(K3.range[0]) + ' → INDETERMINADO a 1,5%; resolver ' + w(K3.range[0]) + ' → DETECTÁVEL</td></tr>'
    + '<tr><td>(3) ultrassom em plugues sob tensão (s ≤ 0,65)</td><td>com (1) e (2): ≥ ' + w(K4.range[0]) + ' → INDETERMINADO a 1,5%; resolver ' + w(K4.range[0]) + ' → DETECTÁVEL</td></tr>'
    + '<tr><td>nenhuma medição isolada decide a 1,5%</td><td>' + (nd.length ? nd.map((x) => x.what + ' em ' + x.slices + ' fatias').join('; ') : 'cortando cada faixa mensurável em 2, 4 e 8 fatias, nenhuma sai decidida em todas as fatias') + '</td></tr>'
    + '</table>'
    + '<h2>7 · Reprodução</h2><p>Fórmulas e implementação de referência (Python, stdlib, decimal a 50 dígitos): ' + REPO + '/tree/main/apps/decidivel/engine · comando: <code>node apps/decidivel/run.js --check</code> (rederiva o registro e recusa qualquer diferença) · casos de controle negativos deste build: ' + esc(N.battery) + '. Aritmética intervalar: instruments/interval. Benchmark UNISIM-IV-2026 (UNICAMP, ODbL). Não são dados da Petrobras.</p>'
    + '<div class="ft"><span>DECIDÍVEL · Nota Técnica de exemplo · carlostoledo.co/decidivel</span><span>Carlos Toledo · carlos@carlostoledo.co · ' + esc(git) + '</span></div>'
    + '</div>';
  const css = T.rootCss() + `
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--f-sans);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.nt{width:210mm;height:297mm;padding:12mm 13mm 10mm;font-size:9.3px;line-height:1.35;position:relative;overflow:hidden}
.hd{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:start;border-bottom:1px solid var(--ink);padding-bottom:8px}
.ey{font-family:var(--f-mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin-bottom:6px}
h1{font-size:15px;line-height:1.2;letter-spacing:-.02em;font-weight:560;margin:0;max-width:60ch}
.vd{font-family:var(--f-mono);font-size:10px;font-weight:600;letter-spacing:.1em;border:1.5px dashed var(--ink-3);border-radius:999px;padding:6px 12px;white-space:nowrap;margin-top:14px}
.meta{font-family:var(--f-mono);font-size:7.5px;color:var(--ink-4);margin:6px 0 8px}
h2{font-size:9.5px;font-weight:600;letter-spacing:.02em;margin:8px 0 3px;color:var(--ink)}
p{margin:0 0 3px;color:var(--ink-2)}
b{color:var(--ink);font-weight:600}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
table{border-collapse:collapse;width:100%}
td{padding:2px 4px;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink-2)}
td:first-child{color:var(--ink);white-space:nowrap;font-family:var(--f-mono);font-size:8.2px;width:34%}
.dec td:first-child{width:28%;white-space:normal}
code{font-family:var(--f-mono);font-size:8.5px}
.ft{position:absolute;left:13mm;right:13mm;bottom:7mm;display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:7.5px;color:var(--ink-5);letter-spacing:.06em;border-top:1px solid var(--rule);padding-top:4px}`;
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Decidível — Nota Técnica de exemplo</title><link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css + '</style></head><body>' + S + '</body></html>';
}
module.exports = { build, print: CP.print };
