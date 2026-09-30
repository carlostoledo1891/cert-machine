/* page.js — /contraprova/: the product face (pt-BR). Every number is read by
   numbers.js from the record that decided it; every receipt is drawn by
   receipt.js, the same function the reader's tab re-runs. The rigor lives one
   click down (the doctrine: product words on the surface, the verdict,
   enclosure and witness underneath). apps/contraprova · cert-machine     MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const RC = require('./receipt.js');
const { br } = require('./numbers.js');

const esc = C.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';
/* the academic partner line — ABSENT until the partner agrees to be named
   (data/partner.json: { "line": "..." }); nothing about a contact is written
   anywhere on the page before that */
const PARTNER = (() => { try { return JSON.parse(require('fs').readFileSync(path.join(__dirname, 'data', 'partner.json'), 'utf8')).line || ''; } catch (e) { return ''; } })();

function css() {
  return `
/* ---- Contraprova (apps/contraprova/page.js) ---- */
.cp-hero{padding:8px 0 0}
.cp-hero h1{font-size:var(--text-display);max-width:15ch;letter-spacing:-.04em}
.cp-hero .deck{max-width:62ch}
.cp-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden;margin:40px 0 0}
.cp-trio > div{background:var(--sunk);padding:22px 24px;display:flex;flex-direction:column;gap:12px}
.cp-trio p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
@media (max-width:760px){.cp-trio{grid-template-columns:1fr}}
.cp-chip{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:.625rem;font-weight:600;
  letter-spacing:.12em;text-transform:uppercase;padding:.4em .85em;border-radius:var(--radius-pill);white-space:nowrap;
  align-self:flex-start;border:1px solid transparent}
.cp-chip.big{font-size:.8125rem;padding:.5em 1.05em}
.cp-chip.provado{background:var(--ink);color:var(--paper)}
.cp-chip.refutado{border-color:var(--ink-2);color:var(--ink)}
.cp-chip.recusado{border:1px dashed var(--ink-4);color:var(--ink-3)}
.cp-chip.nao{border:1px dotted var(--rule-strong);color:var(--ink-5)}
.cp-cta{display:flex;flex-wrap:wrap;gap:12px;margin:32px 0 0}
.cp-cta a{border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:10px 18px;
  font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink)}
.cp-cta a.go{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.cp-cta a:hover{border-color:var(--ink)}

/* the architecture, as boxes that stack on a phone */
.cp-arch{display:grid;grid-template-columns:1fr auto 1fr auto 1.5fr auto 1fr;align-items:stretch;gap:0;margin:8px 0 0}
.cp-st{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:18px 18px;display:flex;flex-direction:column;gap:8px}
.cp-st.core{border-color:var(--ink-3);background:var(--surface2)}
.cp-st.claim{border-style:dashed}
.cp-st .cp-k{margin:0}
.cp-st h3{font-size:1.05rem;margin:0}
.cp-st p{margin:0;font-size:var(--text-small);line-height:1.5;color:var(--ink-3)}
.cp-st ol{margin:4px 0 0;padding-left:18px;font-size:var(--text-small);line-height:1.5;color:var(--ink-2)}
.cp-st ol li{margin:0 0 6px}
.cp-st .cp-vs{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.cp-ar{display:flex;align-items:center;justify-content:center;padding:0 8px;color:var(--ink-4);font-family:var(--f-mono)}
.cp-ar::before{content:'\\2192'}
@media (max-width:1000px){.cp-arch{grid-template-columns:1fr}.cp-ar{padding:6px 0}.cp-ar::before{content:'\\2193'}}

.cp-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin:0 0 10px}
.cp-diff{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:36px 0 0}
.cp-diff > div{border-top:1px solid var(--rule-strong);padding-top:14px}
.cp-diff b{display:block;color:var(--ink);font-weight:500;margin-bottom:6px}
.cp-diff p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
@media (max-width:900px){.cp-diff{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.cp-diff{grid-template-columns:1fr}}

/* the live gate */
.cp-gate{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:24px;align-items:start}
@media (max-width:900px){.cp-gate{grid-template-columns:1fr}}
.cp-cases{display:flex;flex-direction:column;gap:6px}
.cp-cases .cp-k{margin:14px 0 4px}
.cp-cases .cp-k:first-child{margin-top:0}
@media (max-width:900px){.cp-cases{flex-direction:row;flex-wrap:wrap}.cp-cases .cp-k{flex-basis:100%}}
.cp-case{font:inherit;text-align:left;cursor:pointer;background:var(--surface);color:var(--ink-2);
  border:1px solid var(--rule);border-radius:var(--radius-s);padding:10px 12px;display:flex;flex-direction:column;gap:3px}
.cp-case small{font-family:var(--f-mono);font-size:.625rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4)}
.cp-case span{font-size:var(--text-small);line-height:1.35}
.cp-case:hover{border-color:var(--rule-strong)}
.cp-case[aria-pressed="true"]{border-color:var(--ink-3);background:var(--surface2);color:var(--ink)}
.cp-case:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.cp-rc{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden}
@media (max-width:760px){.cp-rc{grid-template-columns:1fr}}
.cp-common,.cp-cert{background:var(--sunk);padding:22px 22px}
.cp-common{background:var(--paper)}
.cp-story{font-style:italic;color:var(--ink-3);font-size:var(--text-small);line-height:1.55;margin:0 0 16px}
.cp-pred{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;align-items:baseline;border:1px dashed var(--ink-5);
  border-radius:var(--radius-s);padding:12px 14px}
.cp-pred span{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4)}
.cp-pred b{font-style:italic;font-weight:400;color:var(--ink-3);font-size:1.25rem;font-family:var(--f-display)}
.cp-vline{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.cp-means{color:var(--ink-2);font-size:var(--text-small)}
.cp-enc-t{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink);margin:14px 0 4px}
svg.cp-nl{display:block;width:100%;height:auto;margin:4px 0 8px}
svg.cp-nl.narrow{display:none}
@media (max-width:560px){svg.cp-nl.wide{display:none}svg.cp-nl.narrow{display:block}}
.cp-nl .cp-axis{stroke:var(--c-axis);stroke-width:1}
.cp-nl .cp-enc{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.5}
.cp-nl .cp-guide{stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3}
.cp-nl .cp-claim{stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4}
.cp-nl text{font-family:var(--f-mono);font-size:12px;fill:var(--ink-2)}
.cp-nl text.claim{font-style:italic;fill:var(--ink-3)}
.cp-nl text.dim{fill:var(--ink-4)}
ul.cp-checks{list-style:none;padding:0;margin:8px 0 0}
ul.cp-checks li{display:grid;grid-template-columns:118px minmax(0,1fr);gap:12px;padding:10px 0;border-top:1px solid var(--rule);align-items:start}
ul.cp-checks li .cp-chip{justify-self:start}
ul.cp-checks li b{display:block;color:var(--ink);font-weight:500;font-size:var(--text-small)}
ul.cp-checks li span{display:block;color:var(--ink-3);font-size:var(--text-small);line-height:1.5}
@media (max-width:560px){ul.cp-checks li{grid-template-columns:1fr;gap:6px}}
.cp-flip{margin:12px 0 0;border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:14px 16px}
.cp-flip ul{margin:0;padding-left:18px;color:var(--ink-2);font-size:var(--text-small);line-height:1.55}
.cp-run{margin-top:14px;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);line-height:1.5}
.cp-form{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:20px 0 0;padding:16px;border:1px dashed var(--ink-5);border-radius:var(--radius-m)}
.cp-form label{display:flex;flex-direction:column;gap:6px;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4)}
.cp-form input{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);width:120px;background:var(--sunk);color:var(--ink);
  border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:8px 10px;text-transform:none;letter-spacing:0}
.cp-form button{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);cursor:pointer;background:var(--ink);color:var(--paper);
  border:0;border-radius:var(--radius-pill);padding:9px 18px}
.cp-form p{flex-basis:100%;margin:0;color:var(--ink-4);font-size:var(--text-small)}

.cp-ev{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
@media (max-width:900px){.cp-ev{grid-template-columns:1fr}}
.cp-ev > div{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:22px;display:flex;flex-direction:column;gap:10px}
.cp-ev .big{font-family:var(--f-display);font-size:clamp(1.6rem,1.2rem + 1.2vw,2.3rem);color:var(--ink);letter-spacing:-.02em;line-height:1.05}
.cp-ev p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
.cp-ev a{align-self:flex-start;font-family:var(--f-mono);font-size:var(--text-eyebrow);margin-top:auto}
.cp-ask{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
@media (max-width:760px){.cp-ask{grid-template-columns:1fr}}
.cp-ask > div{border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:22px}
.cp-ask ul{margin:0;padding-left:18px;color:var(--ink-2);font-size:var(--text-small);line-height:1.6}
details.cp-why{margin:24px 0 0}
.cp-sub{margin-top:56px}
.cp-gap{height:28px}
@media (max-width:760px){.cp-dumb .figbox svg{min-width:760px}}
details.cp-why > summary{cursor:pointer;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-3);border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:7px 16px;display:inline-block;list-style:none}
details.cp-why > summary::-webkit-details-marker{display:none}
details.cp-why[open] > summary{margin-bottom:20px}
.cp-box td:first-child{color:var(--ink);white-space:nowrap}
`;
}

function build(N, bundleText, git) {
  const G = N.gate, S = G.scenarios;
  const lead = G.lead.receipt, fixed = G.fixed.receipt;
  const B = [];

  /* ---- hero ---- */
  B.push('<header class="col cp-hero">'
    + '<div class="eyebrow">Contraprova · verificação independente para computação de engenharia e IA</div>'
    + '<h1>Antes de um número decidir uma operação, ele passa pela contraprova.</h1>'
    + '<p class="deck">Modelos de IA, simuladores, otimizadores e planilhas propõem números — uma vazão de injeção, uma pressão na cabeça do poço, a onda de projeto de uma plataforma. '
    + 'A Contraprova decide cada número com aritmética exata, sem compartilhar código com quem calculou, e responde com uma de três palavras. '
    + 'Cada resposta sai com um recibo que qualquer engenheiro refaz.</p>'
    + '<div class="cp-trio">'
    + '<div>' + RC.chip('PROVADO', true) + '<p>Vale para <b>toda</b> entrada declarada — não para uma amostra, não em média.</p></div>'
    + '<div>' + RC.chip('REFUTADO', true) + '<p>Falha, e a falha está provada: o recibo aponta a equação, o limite ou a entrada que a derruba.</p></div>'
    + '<div>' + RC.chip('RECUSADO', true) + '<p>A evidência declarada não decide — e o recibo publica exatamente o que decidiria.</p></div>'
    + '</div>'
    + '<div class="cp-cta"><a class="go" href="#portao">Ver o portão ao vivo ↓</a><a href="contraprova-apresentacao.pdf">Apresentação (PDF)</a><a href="#projeto">O projeto de PD&amp;I</a></div>'
    + '</header>');

  B.push(C.stats([
    { k: 'ondas de projeto decididas', v: br.int(N.atlas.fits), n: br.int(N.atlas.certified) + ' provadas e ' + br.int(N.atlas.refused) + ' recusadas com motivo, em ' + br.int(N.atlas.cells) + ' células do hindcast público' },
    { k: 'mesmo software, mesmos dados', v: N.scipy.free.agree + ' de ' + N.scipy.free.of, n: 'ajustes do scipy na chamada padrão que são o que dizem ser; ' + N.scipy.fixed.agree + ' de ' + N.scipy.fixed.of + ' com a locação fixa' },
    { k: 'falhas injetadas pegas', v: G.faults.caught + ' de ' + G.faults.of, n: 'no portão de injeção de água; ' + G.battery.fired + '/' + G.battery.reds + ' controles vermelhos a cada build' },
    { k: 'resultados de IA de fronteira', v: br.int(N.ai.decided), n: 'afirmações publicadas decididas no registro público — entre elas de GPT-5.4 Pro, GPT-5.6 e Codex' }
  ]));

  /* ---- 1 the problem ---- */
  B.push(C.section({
    lab: '1 · o problema', title: 'Números que decidem, sem recibo',
    bodyRaw: '<div class="col">'
      + C.p('Operadoras como a Petrobras usam cada vez mais IA, gêmeos digitais, simulação e otimização para apoiar decisões de engenharia e de operação. Cada um desses sistemas termina num número — e o número chega sozinho: “previsão 352 bar, confiança 97%”. Quem vai agir sobre ele não tem como refazê-lo; dois programas dão dois números para os mesmos dados; e, quando a matemática não tem resposta, o software imprime uma assim mesmo.')
      + C.pRaw('A pergunta que ninguém responde hoje não é <em>“o modelo é bom em média?”</em>. É: <b>este número, esta recomendação, vale para as condições que declaramos?</b> A Contraprova responde a essa pergunta — sobre a saída, sem precisar abrir o modelo.')
      + '</div>'
  }));

  /* ---- 2 the architecture ---- */
  B.push(C.section({
    lab: '2 · a arquitetura', title: 'A IA propõe. A Contraprova decide.',
    bodyRaw: '<div class="wide"><div class="cp-arch">'
      + '<div class="cp-st"><div class="cp-k">dados</div><h3>Ficam onde estão</h3><p>Hindcast, boias, sensores, cadastro da linha, histórico de poço — no ambiente da Petrobras.</p></div><div class="cp-ar" aria-hidden="true"></div>'
      + '<div class="cp-st claim"><div class="cp-k">quem propõe</div><h3>IA · simulador · otimizador · planilha</h3><p>Entrega uma <em>proposta</em>: um número e o que ele afirma. Pode ser qualquer modelo — inclusive um que ninguém consegue abrir.</p></div><div class="cp-ar" aria-hidden="true"></div>'
      + '<div class="cp-st core"><div class="cp-k">contraprova</div><h3>Três camadas, em aritmética exata</h3><ol>'
      + '<li><b>Consistência matemática</b> — o número resolve as equações que declara? (Colebrook, máxima verossimilhança, balanços)</li>'
      + '<li><b>Limites físicos</b> — conservação de massa e energia, domínio de validade de cada correlação</li>'
      + '<li><b>Restrições operacionais</b> — as regras declaradas, em toda a caixa de incerteza</li></ol>'
      + '<p>Intervalos com arredondamento dirigido; nenhum código compartilhado com quem propôs.</p></div><div class="cp-ar" aria-hidden="true"></div>'
      + '<div class="cp-st"><div class="cp-k">recibo</div><h3>Verificável por máquina</h3><div class="cp-vs">' + RC.chip('PROVADO') + RC.chip('REFUTADO') + RC.chip('RECUSADO') + '</div><p>Veredito, intervalo, testemunhas e limiares — refeito por qualquer um em segundos.</p></div>'
      + '</div></div>'
      + '<div class="wide"><div class="cp-diff">'
      + '<div><b>Decide a saída, não o modelo</b><p>Não é preciso provar uma rede neural. Decide-se o que ela entregou, antes de virar ação.</p></div>'
      + '<div><b>A caixa inteira, não uma amostra</b><p>Um PROVADO vale para toda entrada dentro da incerteza declarada — não num ponto, não em média.</p></div>'
      + '<div><b>Recusar é um veredito</b><p>Quando a evidência não decide, o recibo mostra uma entrada provada de cada lado e publica o limiar que mudaria a resposta.</p></div>'
      + '<div><b>Independente de quem calculou</b><p>Nenhum código em comum com o autor do número; uma segunda implementação, em outra linguagem, confere a primeira.</p></div>'
      + '<div><b>Adversarial por construção</b><p>Cada verificador carrega falsificações que precisa recusar a cada build: ' + G.battery.fired + ' de ' + G.battery.reds + ' neste portão.</p></div>'
      + '<div><b>O recibo viaja, os dados ficam</b><p>O verificador roda onde os dados estão; quem audita recebe o recibo, não a base.</p></div>'
      + '</div></div>'
  }));

  /* ---- 3 the live gate ---- */
  const caseBtn = (c, i) => '<button type="button" class="cp-case" data-i="' + i + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '"><small>' + esc(c.kind === 'proposta' ? 'proposta de IA' : c.fault) + '</small><span>' + esc(c.title) + '</span></button>';
  const rows = S.cases.map(caseBtn);
  const boxRows = Object.keys(S.box).map((k) => { const [w, u, sc, d] = S.boxWords[k]; const f = (x) => (d ? br.dec(x, d) : br.int(x)); return [w, f(Number(S.box[k][0]) * sc) + ' – ' + f(Number(S.box[k][1]) * sc) + ' ' + u]; });
  B.push('<section id="portao">' + '<div class="col sec-head"><div class="lab">3 · o portão ao vivo</div><h2>Uma recomendação de IA, decidida na sua frente</h2></div>'
    + '<div class="col">' + C.p(S.line + '. Nove propostas: duas recomendações que um modelo de IA poderia fazer, e sete saídas de referência com uma falha injetada em cada — as sete falhas que um verificador industrial precisa pegar. Cada uma é decidida agora, no seu navegador, pelo mesmo código que gerou o registro publicado.') + '</div>'
    + '<div class="wide"><div class="cp-gate">'
    + '<div class="cp-cases" role="group" aria-label="Propostas"><div class="cp-k">recomendações</div>' + rows.slice(0, 2).join('') + '<div class="cp-k">falhas injetadas</div>' + rows.slice(2).join('') + '</div>'
    + '<div id="cp-panel" aria-live="polite">' + RC.receiptHtml(S.cases[0], lead, S.rules.PwhMax, 'registro publicado') + '</div>'
    + '</div></div>'
    + '<div class="wide"><form class="cp-form" id="cp-form" autocomplete="off">'
    + '<label>vazão Q (m³/d)<input name="q" inputmode="decimal" value="7000"></label>'
    + '<label>descarga P_d (bar)<input name="pd" inputmode="decimal" value="204"></label>'
    + '<label>P_wh prevista (bar)<input name="pwh" inputmode="decimal" value="350"></label>'
    + '<button type="submit">Decidir esta proposta</button>'
    + '<p>Digite a sua proposta: a mesma linha, a mesma caixa, as mesmas regras. O veredito sai em milissegundos, na sua máquina.</p></form></div>'
    + '<details class="cp-why wide"><summary>Por que confiar — a caixa, as regras e a matemática</summary>'
    + '<div class="col">' + C.p('Valores típicos e ilustrativos, não dados da Petrobras. A caixa declarada (toda entrada dentro dela é decidida):') + '</div>'
    + '<div class="cp-box">' + C.table({ cols: [{ h: 'entrada' }, { h: 'intervalo declarado' }], rows: boxRows.concat([['regra 1', S.rulesWords.PwhMax], ['regra 2', S.rulesWords.vMax]]) }) + '</div>'
    + '<div class="col">'
    + C.pRaw('<b>O modelo declarado.</b> v = Q/A, Re = ρvD/μ, Colebrook 1/√f = −2 log₁₀(ε/3,7D + 2,51/(Re√f)) só para Re ≥ 4.000, e Darcy–Weisbach com o ganho hidrostático: P_wh = P_d + ρgΔz − f(L/D)ρv²/2. Um PROVADO afirma algo sobre o modelo e as entradas declaradas — não sobre o mar.')
    + C.pRaw('<b>Como a caixa inteira é decidida.</b> Com x = 1/√f, Colebrook vira h(x) = x + (2/ln 10)·ln(a + bx) = 0, crescente em x, a e b; logo a raiz decresce em a e b, e os dois cantos (a₊, b₊) e (a₋, b₋) cercam todas as raízes da caixa. Um passo de Newton em ponto flutuante só <em>localiza</em> cada canto; ele só vale quando h é provado negativo logo abaixo e positivo logo acima, em aritmética intervalar com arredondamento para fora e logaritmo por série com resto rigoroso. A regra é decidida por bissecção da caixa; um RECUSADO exige dois cantos provados, um de cada lado.')
    + C.pRaw('<b>Quem confere o conferente.</b> Uma segunda implementação em Python (<span class="m">decimal</span>, 50 dígitos, sem código em comum) calcula P_wh em ' + G.battery.refPoints + ' entradas — os 64 cantos e 24 pontos sorteados de duas operações — e o intervalo do portão contém todas. ' + G.battery.checks + ' verificações e ' + G.battery.fired + '/' + G.battery.reds + ' controles vermelhos: uma pressão 0,1 bar fora do intervalo, um manifold com 1 m³/d a mais, um f 10⁻⁴ fora das soluções, uma vazão 1 m³/d abaixo do regime turbulento, um “verificador” que avalia só o centro da caixa — todos pegos.')
    + C.pRaw('Código: <a href="' + REPO + '/tree/main/apps/contraprova/gate">apps/contraprova/gate</a> — <span class="m">node battery.js</span> refaz tudo.')
    + '</div></details>'
    + '</section>');

  /* ---- 4 real data ---- */
  const tRows = N.table.rows.slice().sort((a, b) => a.d - b.d);
  const lo = Math.floor(Math.min(...tRows.map((r) => Math.min(r.printed, r.decided)))) - 1, hi = Math.ceil(Math.max(...tRows.map((r) => Math.max(r.printed, r.decided)))) + 1;
  const ticks = []; for (let v = lo; v <= hi; v += 2) ticks.push({ v, t: v + ' m' });
  const dumb = CH.dumbbell({ w: 900, rows: tRows.map((r) => ({ k: r.k, a: r.decided, b: r.printed, lab: br.sgn(r.d, 2) + ' m' })), x0: lo, x1: hi, xTicks: ticks,
    aName: 'decidido no registro público', bName: 'impresso na tabela', padL: 250, vOf: (v) => br.dec(v, 2) + ' m',
    alt: 'Ondas de 100 anos: a tabela publicada contra o registro público mais próximo, vinte ajustes em cinco áreas.' });
  B.push(C.section({
    lab: '4 · já funciona em dados reais', title: 'A onda de projeto de uma plataforma',
    bodyRaw: '<div class="col">' + C.p('O primeiro domínio da Contraprova já roda em escala: os valores extremos de altura de onda que dimensionam FPSOs, ancoragens, risers e turbinas eólicas offshore — o número que um projeto usa como “onda de 100 anos”. O método é o de Reis, Guimarães et al. (Ocean Engineering, 2026) — seis famílias, quatro critérios, níveis de 100 e 1.000 anos; os dados, o hindcast público WAVEWATCH III 1993–2024.') + '</div>'
      + '<div class="wide"><div class="cp-ev">'
      + '<div><div class="cp-k">o mesmo software</div><div class="big">' + br.dec(N.scipy.ew.free, 2) + ' m × ' + br.dec(N.scipy.ew.fixed, 2) + ' m</div><p>A mesma onda de 100 anos, dos mesmos ' + br.int(N.scipy.n) + ' registros horários, pelo mesmo scipy ' + esc(N.scipy.version) + ' chamado de dois jeitos. Só um é o máximo de verossimilhança que os dois dizem calcular: o outro fica ' + br.int(N.scipy.ew.deficit) + ' unidades de log-verossimilhança abaixo de um membro da própria família. Na chamada padrão, ' + N.scipy.free.agree + ' de ' + N.scipy.free.of + ' ajustes conferem.</p><a href="../reports/return-levels.html">o relatório →</a></div>'
      + '<div><div class="cp-k">a escala</div><div class="big">' + br.int(N.atlas.fits) + '</div><p>Ajustes em ' + br.int(N.atlas.cells) + ' células, três blocos, seis famílias — ' + br.int(N.atlas.certified) + ' provados como máximo; ' + br.int(N.atlas.ggLimit) + ' recusados com a prova de que o máximo não existe dentro da família (o otimizador imprimiria um ponto do caminho). Qualquer célula é refeita no navegador.</p><a href="../instruments/return-level-atlas/">o atlas →</a></div>'
      + '<div><div class="cp-k">uma tabela publicada</div><div class="big">' + N.table.outside95 + ' de ' + N.table.decided + '</div><p>Ondas de 100 anos de uma tabela de projeto eólico offshore (' + esc(N.table.cite) + ', cinco áreas do Atlântico Sul) fora do intervalo estatístico de 95% do registro público mais próximo (' + N.table.kmMin + '–' + N.table.kmMax + ' km): de ' + br.sgn(N.table.dMin, 2) + ' a ' + br.sgn(N.table.dMax, 2) + ' m. A tabela vem de um hindcast comercial que ninguém de fora refaz — é a distância entre dois registros, e o motivo para um recibo.</p><a href="../instruments/return-level-check/">decida um ajuste impresso →</a></div>'
      + '</div></div>'
      + '<div class="cp-gap"></div><div class="cp-dumb">' + C.figure({ svgRaw: dumb, caption: 'Vinte ajustes impressos (MQ mínimos quadrados, MV máxima verossimilhança, MM momentos) contra o ajuste decidido na célula pública mais próxima. Diferença de registros, não erro da tabela: é exatamente o que um recibo torna visível.' }) + '</div>'
  }));

  /* ---- 5 frontier AI ---- */
  B.push(C.section({
    lab: '5 · já enfrentou a IA de fronteira', title: 'A mesma arquitetura, contra os modelos mais fortes',
    bodyRaw: '<div class="col">' + C.p('Antes da engenharia, o motor foi calibrado onde a IA é mais difícil de conferir: matemática publicada, produzida com ou por modelos de fronteira. Em público, com data, e com cada verificador disponível.') + '</div>'
      + C.table({ cols: [{ h: 'o que a IA afirmou' }, { h: 'veredito' }, { h: 'por quê' }], rows: [
        ['Um certificado de GPT-5.4 Pro que melhoraria o limite de Ramsey diagonal (benchmark HorizonMath, 2026)', { raw: RC.chip('REFUTADO') }, 'O verificador do próprio benchmark aceitava um par se UMA orientação passasse; a definição exige as DUAS. Com a correção de uma palavra, ele recusa o certificado no primeiro intervalo.'],
        ['A iteração “preliminar, não verificada” de ChatGPT 5.6 Sol impressa por Gupta, Ndiaye, Norin e Wei: R(k,k) ≤ 3,78233^(k+o(k))', { raw: RC.chip('PROVADO') }, 'Decidida por dois programas independentes, em duas linguagens, com aritmética diferente; ambos concordam em 25 dígitos.'],
        ['A biblioteca de contraexemplos encontrados por IA de S. Sra (' + N.ai.countex.of + ' casos: GPT-5.x, Codex, Opus)', { raw: RC.chip('PROVADO') + ' <span class="m">' + N.ai.countex.certified + ' inteiros · ' + N.ai.countex.partial + ' parciais</span>' }, 'Cada caso decidido do certificado publicado, com um verificador escrito a partir do enunciado, antes de ler o do autor.'],
        ['O registro inteiro', { raw: '<span class="m">' + br.int(N.ai.decided) + ' decididas</span>' }, 'Cada linha com o arquivo que a decidiu; nada é contado duas vezes.']
      ] })
      + '<div class="col">' + C.pRaw('Relatórios: <a href="../reports/horizonmath.html">HorizonMath</a> · <a href="../reports/diagonal-ramsey.html">Ramsey diagonal</a> · <a href="../reports/counterexample-machine.html">contraexemplos</a> · <a href="../reports/decided-2026-09.html">o registro de setembro</a>.') + '</div>'
  }));

  /* ---- 6 what it replaces ---- */
  B.push(C.section({
    lab: '6 · o que substitui', title: 'Da segunda opinião para a contraprova',
    bodyRaw: C.table({ cols: [{ h: 'momento' }, { h: 'hoje' }, { h: 'com a Contraprova' }], rows: [
      ['Uma IA recomenda mudar a operação', '“previsão 352 bar · confiança 97%”', 'RECUSADO: há entradas declaradas que passam de 360 bar (provado); com P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar, PROVADO'],
      ['Um solver devolve um número', 'aceito se parece razoável', 'conferido contra as equações que declara: f = 0,0110 não resolve Colebrook — REFUTADO'],
      ['Dois programas discordam', 'uma reunião; ninguém sabe quem está certo', 'o recibo diz qual é o máximo e qual parou antes (' + br.dec(N.scipy.ew.free, 2) + ' × ' + br.dec(N.scipy.ew.fixed, 2) + ' m)'],
      ['A matemática não tem resposta', 'o otimizador imprime a última iteração como resultado', 'RECUSADO, com a prova (' + br.int(N.atlas.ggLimit) + ' casos no atlas)'],
      ['Incerteza estatística × erro numérico', 'misturados num número só', 'separados e rotulados: o intervalo estatístico nunca se passa por prova'],
      ['Dados confidenciais', 'precisam sair para serem auditados', 'o verificador roda onde os dados estão; o recibo viaja'],
      ['Auditoria, meses depois', 'refazer o estudo', 'refazer o recibo: um arquivo, segundos']
    ] })
      + '<div class="col sec-head cp-sub"><h3>E as alternativas?</h3></div>'
      + C.table({ cols: [{ h: 'alternativa' }, { h: 'entrega' }, { h: 'não entrega' }], rows: [
        ['Segundo consultor, segundo cálculo', 'um segundo número', 'um árbitro entre os dois'],
        ['Rodar em outro software', 'outra resposta, com outros padrões', 'qual delas está certa (scipy: ' + N.scipy.fixed.agree + '/' + N.scipy.fixed.of + ' ou ' + N.scipy.free.agree + '/' + N.scipy.free.of + ', conforme a chamada)'],
        ['Métricas do modelo, MLOps', 'desempenho médio no conjunto de teste', 'uma decisão sobre ESTA saída, nestas condições'],
        ['IA que confere IA', 'uma segunda opinião', 'uma prova — é outro gerador'],
        ['Intervalos de confiança, UQ', 'a dispersão estatística', 'se o ajuste é mesmo o máximo; se a saída respeita as equações'],
        ['Revisão de método por par ou classificadora', 'o julgamento de um especialista', 'a re-derivação mecânica de cada número — a Contraprova é insumo para ela'],
        ['Verificação formal (Lean, Coq)', 'provas completas de programas', 'escala de engenharia hoje: caixas de incerteza, 175 mil registros']
      ] })
  }));

  /* ---- 7 the PD&I project ---- */
  B.push('<section id="projeto"><div class="col sec-head"><div class="lab">7 · o projeto de PD&amp;I proposto</div><h2>Doze meses para um recibo em cada decisão</h2></div>'
    + '<div class="col">' + C.p('O motor existe e está publicado. O projeto de PD&I o leva para um fluxo real da Petrobras, com os dados da Petrobras, dentro da Petrobras — e mede o que muda quando cada número chega com recibo.') + '</div>'
    + C.table({ cols: [{ h: 'frente' }, { h: 'meses', cls: 'n' }, { h: 'o que entrega' }, { h: 'TRL', cls: 'n' }], rows: [
      ['1 · Piloto em um fluxo real', '0–4', 'Com os engenheiros da Petrobras: UM fluxo em que uma saída de IA ou simulação vira decisão (ex.: injeção de água). Modelo, caixa e regras declarados; o portão rodando ao lado do modelo; recibos para decisões reais, com os limiares publicados.', '4 → 6'],
      ['2 · Valores de projeto metoceânicos', '0–6', 'Os ajustes de extremos (sete famílias, quatro critérios) nos dados da Petrobras; um verificador em Python de um arquivo; o formato do recibo para a base de projeto.', '4 → 6'],
      ['3 · Contornos ambientais conjuntos', '4–12', 'Pesquisa: decidir o modelo conjunto altura–período e o contorno ambiental (IFORM/ISORM), cada um com o seu recibo.', '2 → 4'],
      ['4 · O portão como serviço', '6–12', 'API ao lado de modelos de IA; biblioteca de modelos físicos declarados (escoamento, balanços, hidrostática, extremos); controles vermelhos por domínio.', '3 → 6']
    ] })
    + '<div class="wide"><div class="cp-ask">'
    + '<div><div class="cp-k">como medimos</div><ul><li>100% dos controles vermelhos recusados, a cada build</li><li>cada RECUSADO sai com o limiar que o decidiria</li><li>um engenheiro da Petrobras refaz o recibo sem o nosso código</li><li>nenhum dado sai do ambiente da Petrobras</li></ul></div>'
    + '<div><div class="cp-k">o que pedimos à Petrobras</div><ul><li>um fluxo de decisão e um engenheiro-par</li><li>acesso aos dados no ambiente da Petrobras</li><li>mentoria técnica do portfólio de PD&amp;I</li><li>doze meses</li></ul></div>'
    + '</div></div></section>');

  /* ---- 8 maturity + who ---- */
  B.push(C.section({
    lab: '8 · maturidade e equipe', title: 'Onde estamos',
    bodyRaw: '<div class="col">'
      + C.pRaw('<b>TRL 4</b> — validado em laboratório, em dados públicos e em escala: o atlas de ondas de projeto, os relatórios decididos, o portão demonstrador desta página. <b>CRL 3</b> — a aplicação da tecnologia definida; o piloto é o próximo passo.')
      + C.pRaw('<b>Equipe.</b> Carlos Toledo, fundador — construiu o motor de verificação (código aberto, licença MIT, cada resultado com o arquivo que o decidiu). Uma pessoa hoje; o piloto define as próximas.')
      + (PARTNER ? C.pRaw('<b>Parceria acadêmica.</b> ' + esc(PARTNER)) : '')
      + C.pRaw('<b>Contato.</b> <a href="mailto:carlos@carlostoledo.co">carlos@carlostoledo.co</a> · <a href="contraprova-apresentacao.pdf">apresentação (PDF)</a> · <a href="' + REPO + '">código</a>')
      + C.pRaw('<span class="scope">A palavra “certificação” tem dono no offshore (sociedades classificadoras, ANP). A Contraprova entrega uma <em>prova matemática reexecutável</em> sobre um número — não uma certificação de classe, e não substitui a responsabilidade técnica de quem assina o projeto.</span>')
      + '</div>'
  }));

  const ledgerJson = JSON.stringify({ receipts: G.receipts.map((r) => ({ id: r.id, receipt: r.receipt })) }).replace(/</g, '\\u003c');
  const script = '<script>' + bundleText + '</script>\n<script type="application/json" id="cp-ledger">' + ledgerJson + '</script>\n<script>' + CLIENT + '</script>';
  const foot = '<p>' + esc('Gerado por apps/contraprova/build.js a partir de certs/hseva-atlas.json, certs/hseva-ledger.json, certs/design-table-audit.json, certs/claims-ledger.json e apps/contraprova/data/gate-ledger.json; bateria do portão ' + G.battery.checks + ' verificações, ' + G.battery.fired + '/' + G.battery.reds + ' controles vermelhos.') + '</p><p>' + esc('git ' + git) + '</p>';
  return TPL.render({
    title: 'Contraprova — verificação independente de números de engenharia e IA', lang: 'pt-BR',
    desc: 'Contraprova decide, com aritmética exata e sem compartilhar código com quem calculou, se um número proposto por IA, simulação ou planilha vale para toda entrada declarada: PROVADO, REFUTADO ou RECUSADO — com um recibo que qualquer engenheiro refaz.',
    path: '/contraprova/', bodyRaw: B.join('\n\n'), footRaw: foot, cssRaw: css(), scriptRaw: script
  });
}

/* the reader's tab: every case re-decided by the bundled gate on selection */
const CLIENT = `(function () {
  var CP = self.CONTRAPROVA; if (!CP) return;
  var F = CP.F, S = CP.S, RC = CP.RC, LED = JSON.parse(document.getElementById('cp-ledger').textContent).receipts;
  var panel = document.getElementById('cp-panel'), btns = [].slice.call(document.querySelectorAll('.cp-case'));
  function core(r) { return JSON.stringify([r.verdict, r.enclosure, r.checks.map(function (c) { return [c.verdict, c.text]; }), r.thresholds]); }
  function show(i, push) {
    var c = S.cases[i];
    btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    var t0 = performance.now(), r = F.decide(c.proposal, S.box, S.rules), ms = performance.now() - t0;
    var same = core(r) === core(LED[i].receipt);
    panel.innerHTML = RC.receiptHtml(c, r, S.rules.PwhMax, 'refeito agora no seu navegador em ' + Math.max(1, Math.round(ms)) + ' ms · ' + (same ? 'mesmo veredito e mesmo intervalo do registro publicado' : 'DIFERENTE do registro publicado'));
    if (push) history.replaceState(null, '', '#caso=' + c.id);
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-i'), true); }); });
  var form = document.getElementById('cp-form');
  function num(s) { s = String(s).trim().replace(/\\s/g, '').replace(',', '.'); return /^\\d+(\\.\\d+)?$/.test(s) ? s : null; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = num(form.q.value), pd = num(form.pd.value), pwh = num(form.pwh.value);
    if (!q || !pd || !pwh || +q <= 0) { panel.innerHTML = '<p class="cp-story">Digite números positivos, por exemplo 7000, 204 e 350.</p>'; return; }
    btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    var c = { kind: 'proposta', title: 'Sua proposta', story: 'Proposta digitada: Q = ' + q + ' m³/d, P_d = ' + pd + ' bar, P_wh prevista = ' + pwh + ' bar.' };
    var t0 = performance.now(), r;
    try { r = F.decide({ Q: q, Pd: pd, claim: { Pwh: pwh } }, S.box, S.rules); } catch (err) { panel.innerHTML = '<p class="cp-story">' + RC.esc(err.message) + '</p>'; return; }
    panel.innerHTML = RC.receiptHtml(c, r, S.rules.PwhMax, 'decidido agora no seu navegador em ' + Math.max(1, Math.round(performance.now() - t0)) + ' ms');
    history.replaceState(null, '', '#q=' + q + '&pd=' + pd + '&pwh=' + pwh);
    panel.scrollIntoView({ block: 'nearest' });
  });
  /* the dev hook: #caso=<id> or #q=..&pd=..&pwh=.. drive the same paths the controls use */
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1)), m = /^caso=(.+)$/.exec(h);
    if (m) { for (var i = 0; i < S.cases.length; i++) if (S.cases[i].id === m[1]) show(i, false); }
    else if (/^q=/.test(h)) { h.split('&').forEach(function (kv) { var p = kv.split('='); if (form[p[0]]) form[p[0]].value = p[1]; }); form.requestSubmit(); }
  }
  fromHash(); addEventListener('hashchange', fromHash);
})();`;

module.exports = { build };
