/* nota.js — the Registro de cálculo: the one-page A4 record of one scenario version
   (the TBG electrification, v2) that a reviewer can put on the desk and hand to someone
   else with the command that recomputes it. Printed by the deck's printer from the same
   numbers object as the page. apps/abatimento · cert-machine                       MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const RC = require('./registro.js');
const esc = RC.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';

function build(N, git) {
  const c = N.c('tbg-ecomp', 2), r = N.r('tbg-ecomp', 2), c1 = N.c('tbg-ecomp', 1), r1 = N.r('tbg-ecomp', 1), d = N.tbg.diff, br = N.br;
  const F = N.D.fontes;
  const prem = Object.entries(c.premissas).map(([k, p]) => '<tr><td>' + esc(k) + '</td><td>[' + esc(p.lo) + '; ' + esc(p.hi) + '] ' + esc(p.un || '') + '</td><td>' + esc(p.desc || (N.D.premissasComuns[k] && N.D.premissasComuns[k].desc) || '') + '</td><td>' + esc(p.fonte || '') + '</td></tr>').join('');
  const cls = r.classe.porClasse.map((x) => '<tr><td>' + esc(x.classe) + ' (' + esc(x.ate === null ? '≥ ' + RC.brk(x.de) : RC.brk(x.de) + ' a ' + RC.brk(x.ate)) + ')</td><td><b>' + esc(x.verdict) + '</b></td></tr>').join('');
  const esc_ = Object.entries(r.porEscopo).map(([e, v]) => '<tr><td>escopo ' + esc(e) + '</td><td>[' + br.int(v.lo) + '; ' + br.int(v.hi) + ']</td></tr>').join('');
  const imp = Object.entries(r.implantacao).map(([k, v]) => '<tr><td>' + esc(k) + ' · fração [' + esc(v.fracao[0]) + '; ' + esc(v.fracao[1]) + ']</td><td>[' + br.int(v.lo) + '; ' + br.int(v.hi) + ']</td></tr>').join('');
  const sens = r.sensibilidade.linhas.slice(0, 5).map((l) => esc(l.premissa) + ' ' + esc(l.parcelaPct) + '%').join(' · ');
  const wit = (w) => Object.entries(w.canto).map(([k, s]) => k + '=' + s).join(', ');
  const fontesRows = ['caderno2025', 'ipcc2006', 'ghgp-gwp', 'mcti-sin'].map((k) => '<tr><td>' + esc(k) + '</td><td>' + esc(F[k].titulo) + (F[k].sha256 ? ' · sha256 ' + F[k].sha256.slice(0, 16) + '…' : F[k].nota ? ' · ' + esc(F[k].nota.split(':')[0]) : '') + '</td></tr>').join('');
  const S = '<div class="nt">'
    + '<div class="hd"><div><div class="ey">Registro de cálculo · exemplo · ' + esc(c.id) + ' · versão ' + esc(c.versao) + ' · ' + esc(c.categoria) + ' · fonte emissora ' + esc(c.fonte_emissora) + '</div><h1>' + esc(c.titulo) + '</h1></div>'
    + '<div class="vd">' + esc(r.verdict) + (r.classe.decidida ? ' · ' + esc(r.classe.decidida) : '') + '</div></div>'
    + '<div class="meta">build git ' + esc(git) + ' · registro apps/abatimento/data/registro-ledger.json · módulos pinados por sha256 no registro · reexecutável em carlostoledo.co/abatimento (cada versão re-decidida no navegador; a sua alteração também)</div>'
    + '<div class="g2">'
    + '<div><h2>1 · Afirmação registrada</h2><p>' + esc(c.afirmacao.texto) + ' Classe afirmada: ' + esc(c.afirmacao.classe) + '. Status: ' + esc(c.status) + '.</p><p>' + esc(c.mudanca) + '</p>'
    + '<h2>2 · Premissas declaradas (faixa · unidade · descrição · fonte)</h2><table>' + prem + '</table>'
    + '<h2>3 · Fórmula (tCO₂e/ano)</h2><pre>' + esc(r.formula) + '</pre><p>Forma multilinear: cada premissa não negativa, uma vez por termo; os extremos sobre o envelope estão nos cantos (teorema), avaliados em racionais exatos (' + r.cantos + ' cantos).</p></div>'
    + '<div><h2>4 · Resultado garantido</h2><table><tr><td>abatimento</td><td>∈ [' + br.int(r.enclosure[0]) + '; ' + br.int(r.enclosure[1]) + '] tCO₂e/ano, para toda premissa do envelope</td></tr>' + esc_ + '<tr><td>afirmação ' + br.int(r.afirmacao.valor) + '</td><td><b>' + esc(r.afirmacao.verdict) + '</b> — está dentro do intervalo</td></tr></table>'
    + '<h2>5 · Classe de potencial (Nota 1, Caderno 2025)</h2><table>' + cls + '</table>'
    + '<h2>6 · Implantação (técnica · acordada)</h2><table>' + imp + '</table>'
    + '<h2>7 · De onde vem a largura</h2><p>' + sens + '.' + (r.sensibilidade.preco ? ' ' + esc(r.sensibilidade.preco.texto) + '.' : ' A classe está decidida; nenhuma medição adicional é necessária para a classe.') + '</p>'
    + '<h2>8 · Testemunhas</h2><p>mínimo em ' + esc(wit(r.testemunhas.lo)) + '; máximo em ' + esc(wit(r.testemunhas.hi)) + '. Cada canto re-avaliado exatamente reproduz o extremo.</p>'
    + '<h2>9 · Versão anterior (v' + esc(d.de) + ' → v' + esc(d.para) + ')</h2><p>' + d.premissas.map((p) => esc(p.premissa) + ' ' + esc(p.mudanca) + ' de [' + esc(p.antes.join('; ')) + '] para [' + esc(p.depois.join('; ')) + ']').join('; ') + '. Intervalo [' + br.int(d.envelope.antes[0]) + '; ' + br.int(d.envelope.antes[1]) + '] → [' + br.int(d.envelope.depois[0]) + '; ' + br.int(d.envelope.depois[1]) + ']; classe ' + esc(d.classe.antes || 'não decidida (RECUSADO: ' + esc(r1.sensibilidade.preco.texto) + ')') + ' → ' + esc(d.classe.depois) + '. A fórmula não mudou.</p></div>'
    + '</div>'
    + '<h2>10 · Fontes pinadas</h2><table class="dec">' + fontesRows + '</table>'
    + '<h2>11 · Reprodução</h2><p>Núcleo e segunda implementação (Python, biblioteca padrão, frações, sem código em comum): ' + REPO + '/tree/main/apps/abatimento · comandos: <code>node apps/abatimento/engine/battery.js</code> (toda a bateria, ' + N.battery.checks + ' verificações, ' + N.battery.fired + '/' + N.battery.reds + ' falsificações recusadas) · <code>python3 apps/abatimento/engine/reference.py</code> (os intervalos e as classes de todas as versões) · <code>node apps/abatimento/build.js</code> (re-decide e compara com o registro; uma divergência recusa a construção). Dados de atividade ILUSTRATIVOS; fatores físicos de tabelas públicas pinadas. Este registro fala do envelope declarado, não do mundo.</p>'
    + '<div class="ft"><span>CONTRAPROVA · REGISTRO DE ABATIMENTO · registro de cálculo de exemplo · carlostoledo.co/abatimento</span><span>Carlos Toledo · carlos@carlostoledo.co · ' + esc(git) + '</span></div>'
    + '</div>';
  const css = T.rootCss() + `
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--f-sans);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.nt{width:210mm;height:297mm;padding:12mm 13mm 10mm;font-size:9px;line-height:1.35;position:relative;overflow:hidden}
.hd{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:start;border-bottom:1px solid var(--ink);padding-bottom:8px}
.ey{font-family:var(--f-mono);font-size:7.6px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin-bottom:6px}
h1{font-size:15px;line-height:1.2;letter-spacing:-.02em;font-weight:560;margin:0;max-width:62ch}
.vd{font-family:var(--f-mono);font-size:10px;font-weight:600;letter-spacing:.1em;border:1.5px solid var(--ink);border-radius:999px;padding:6px 12px;white-space:nowrap;margin-top:14px}
.meta{font-family:var(--f-mono);font-size:7.3px;color:var(--ink-4);margin:6px 0 8px}
h2{font-size:9.3px;font-weight:600;letter-spacing:.02em;margin:7px 0 3px;color:var(--ink)}
p{margin:0 0 3px;color:var(--ink-2)}
b{color:var(--ink);font-weight:600}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
table{border-collapse:collapse;width:100%}
td{padding:2px 4px;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink-2)}
td:first-child{color:var(--ink);font-family:var(--f-mono);font-size:7.8px;white-space:nowrap}
.dec td:first-child{width:14%}
pre{font-family:var(--f-mono);font-size:7.6px;line-height:1.45;white-space:pre-wrap;margin:0 0 3px;color:var(--ink-2)}
code{font-family:var(--f-mono);font-size:8.2px}
.ft{position:absolute;left:13mm;right:13mm;bottom:7mm;display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:7.3px;color:var(--ink-5);letter-spacing:.06em;border-top:1px solid var(--rule);padding-top:5px}
`;
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Registro de Abatimento — registro de cálculo de exemplo</title><link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css + '</style></head><body>' + S + '</body></html>';
}
module.exports = { build };
