/* nota.js — the Nota Técnica de Decisão: the one-page certificate an engineer
   can put on the desk, generated for the lead recommendation from the same
   numbers object as the page and the deck, printed by the deck's printer.
   apps/contraprova · cert-machine                                        MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const CP = require('./deck.js');
const RC = require('./receipt.js');
const { br } = require('./numbers.js');
const esc = RC.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';

function build(N, git) {
  const G = N.gate, S = G.scenarios, c = S.cases[0], r = G.lead.receipt, f = G.fixed.receipt, MC = G.mc;
  const verdict = { PROVADO: 'VÁLIDO (PROVADO)', REFUTADO: 'INVÁLIDO (REFUTADO)', RECUSADO: 'INDETERMINADO (RECUSADO)' }[r.verdict];
  const SRC = { L: 'cadastro da linha (as-built)', D: 'cadastro da linha; catálogo do duto', eps: 'inspeção; rugosidade de projeto e de serviço', rho: 'análise da água de injeção', mu: 'análise da água e temperatura ao longo da linha', dz: 'batimetria e profundidade da cabeça do poço' };
  const boxRows = Object.keys(S.box).map((k) => { const [w, u, sc, d] = S.boxWords[k]; const fmt = (x) => (d ? br.dec(x, d) : br.int(x)); return '<tr><td>' + esc(w) + ' ∈ [' + fmt(Number(S.box[k][0]) * sc) + '; ' + fmt(Number(S.box[k][1]) * sc) + '] ' + esc(u) + '</td><td>valor típico e ilustrativo; no piloto: ' + esc(SRC[k]) + ', em dados sintéticos no formato da Petrobras</td></tr>'; }).join('');
  const lim = S.rules.PwhMax;
  const S_ = '<div class="nt">'
    + '<div class="hd"><div><div class="ey">Nota Técnica de Decisão · exemplo · ' + esc(S.line) + ' · ' + esc(c.title) + '</div><h1>A recomendação de subir a injeção para ' + esc(c.proposal.Q) + ' m³/d com ' + esc(c.proposal.Pd) + ' bar na descarga respeita as regras declaradas para toda entrada do envelope?</h1></div>'
    + '<div class="vd">' + esc(verdict) + '</div></div>'
    + '<div class="meta">build git ' + esc(git) + ' · registro apps/contraprova/data/gate-ledger.json · reexecutável em carlostoledo.co/contraprova (cada caso re-decidido no navegador; a sua proposta também)</div>'
    + '<div class="g2">'
    + '<div><h2>2 · Envelope declarado (fonte por linha)</h2><table>' + boxRows
    + '<tr><td>regra 1: ' + esc(S.rulesWords.PwhMax) + '</td><td>limite operacional declarado</td></tr>'
    + '<tr><td>regra 2: ' + esc(S.rulesWords.vMax) + '</td><td>limite de erosão declarado (API RP 14E)</td></tr>'
    + '<tr><td>fora do envelope</td><td>transientes, escoamento multifásico, perfil térmico, erosão como modelo — ditos, não escondidos</td></tr>'
    + '</table></div>'
    + '<div><h2>3 · Modelo físico declarado</h2><p>v = Q/A; Re = ρvD/μ; Colebrook 1/√f = −2 log₁₀(ε/3,7D + 2,51/(Re√f)), só para Re ≥ 4.000; Darcy–Weisbach com o ganho hidrostático: P_wh = P_d + ρgΔz − f(L/D)ρv²/2. O veredito fala deste modelo e deste envelope, não do poço.</p>'
    + '<h2>4 · Resultado garantido (arredondamento para fora)</h2><table>'
    + '<tr><td>P_wh</td><td>∈ [' + br.dec(r.enclosure[0], 1) + '; ' + br.dec(r.enclosure[1], 1) + '] bar para toda entrada declarada; a previsão do modelo, ' + esc(c.proposal.claim.Pwh) + ' bar, está no intervalo</td></tr>'
    + '<tr><td>Re</td><td>' + esc(r.checks.find((k) => k.id === 'dominio').text) + '</td></tr>'
    + '<tr><td>v</td><td>' + esc(r.checks.find((k) => k.id === 'velocidade').text) + '</td></tr>'
    + '<tr><td>atrito ≥ 0</td><td>' + esc(r.checks.find((k) => k.id === 'energia').text) + '</td></tr>'
    + '</table>'
    + '<h2>5 · Veredito na regra P_wh ≤ ' + esc(lim) + ' bar: ' + esc(verdict) + '</h2>'
    + '<p>' + esc(r.checks.find((k) => k.id === 'limite').text.replace('A caixa declarada contém entradas', 'O envelope declarado contém entradas')) + '</p>'
    + '<p>Um estudo por ' + br.int(MC.draws) + ' sorteios uniformes do mesmo envelope diria “' + (100 * MC.pOver).toFixed(1).replace('.', ',') + '% acima do limite”, com o pior sorteio em ' + br.dec(MC.max, 1) + ' bar — abaixo da entrada provada acima: o sorteio subestima o pior caso, e a fração depende de um prior uniforme não declarado. A decisão acima não depende dela.</p></div>'
    + '</div>'
    + '<h2>6 · O que decide</h2><table class="dec">'
    + '<tr><td>ajuste operacional</td><td>' + esc(r.thresholds[0]) + ' Com P_d = 200 bar: VÁLIDO, P_wh ∈ [' + br.dec(f.enclosure[0], 1) + '; ' + br.dec(f.enclosure[1], 1) + '] bar.</td></tr>'
    + (r.thresholds[1] ? '<tr><td>medição</td><td>' + esc(r.thresholds[1]) + '</td></tr>' : '')
    + '<tr><td>registro</td><td>este certificado é o registro técnico da mudança (SGSO, práticas 13 e 16): modelo, envelope, veredito, limiar, reprodução.</td></tr>'
    + '</table>'
    + '<h2>7 · Reprodução</h2><p>Fórmulas e implementação de referência (Python, stdlib, decimal a 50 dígitos, sem código em comum com o portão): ' + REPO + '/tree/main/apps/contraprova/gate · comando: <code>node apps/contraprova/gate/battery.js</code> (' + G.battery.checks + ' verificações, ' + G.battery.fired + '/' + G.battery.reds + ' casos de controle negativos, referência em ' + G.battery.refPoints + ' entradas) · o registro: <code>node apps/contraprova/build.js</code> refaz os nove certificados e recusa qualquer diferença. Aritmética intervalar: instruments/interval. Valores típicos e ilustrativos; não são dados da Petrobras. Prova matemática reexecutável, não certificação de classe.</p>'
    + '<div class="ft"><span>CONTRAPROVA · Nota Técnica de exemplo · carlostoledo.co/contraprova</span><span>Carlos Toledo · carlos@carlostoledo.co · ' + esc(git) + '</span></div>'
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
td:first-child{color:var(--ink);font-family:var(--f-mono);font-size:8.2px;width:46%}
.dec td:first-child{width:22%}
code{font-family:var(--f-mono);font-size:8.5px}
.ft{position:absolute;left:13mm;right:13mm;bottom:7mm;display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:7.5px;color:var(--ink-5);letter-spacing:.06em;border-top:1px solid var(--rule);padding-top:4px}`;
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contraprova — Nota Técnica de exemplo</title><link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css + '</style></head><body>' + S_ + '</body></html>';
}
module.exports = { build };
