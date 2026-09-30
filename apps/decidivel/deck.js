/* deck.js — Decidível's pitch deck (pt-BR, 16:9, 12 slides), from the same
   numbers object as the page; the stylesheet and the printer are the
   Contraprova deck's (one deck design for both products).
   apps/decidivel · cert-machine                                          MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const CP = require(path.join(ROOT, 'apps', 'contraprova', 'deck.js'));
const { br } = require('./numbers.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const chip = (v, big) => '<span class="cp-chip ' + ({ PROVADO: 'provado', REFUTADO: 'refutado', RECUSADO: 'recusado' }[v] || 'recusado') + (big ? ' big' : '') + '">' + esc(v || 'NÃO DECIDIDO') + '</span>';

function miniMap(N, k, th) {
  const L = N.L, nx = L.axes.phi.length, ny = L.axes.sg.length, cw = 16, ch = 14, W = nx * cw + 50, H = ny * ch + 30;
  const o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" class="mm">'];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v = N.cls(L.maps[k][j * nx + i], th), x = 40 + i * cw, y = (ny - 1 - j) * ch;
    o.push('<rect class="bg" x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (cw - 2) + '" height="' + (ch - 2) + '" rx="1.5"/>');
    if (v === 'PROVADO') o.push('<rect class="full" x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (cw - 4) + '" height="' + (ch - 4) + '" rx="1"/>');
    else if (v === 'RECUSADO') o.push('<path class="tri" d="M' + (x + 2) + ' ' + (y + ch - 2) + 'L' + (x + cw - 2) + ' ' + (y + 2) + 'L' + (x + cw - 2) + ' ' + (y + ch - 2) + 'Z"/>');
    else if (v === 'REFUTADO') o.push('<rect class="ring" x="' + (x + 5) + '" y="' + (y + 4) + '" width="' + (cw - 10) + '" height="' + (ch - 8) + '" rx="1"/>');
  }
  o.push('<text x="' + (40 + nx * cw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">porosidade 0 → 0,30</text>');
  o.push('<text x="30" y="' + (ny * ch / 2) + '" text-anchor="middle" transform="rotate(-90 30 ' + (ny * ch / 2) + ')">Sg 0 → 0,48</text></svg>');
  return o.join('');
}

function build(N) {
  const L = N.L, D = N.D, H = N.H, rc = H.receipt, mc = H.mc;
  const w = (x) => br.dec(x, 2) + '%';
  const ft = (n) => '<div class="ft"><span>DECIDÍVEL · carlostoledo.co/decidivel</span><span>Radar de Soluções Petrobras · Ciclo 3 · 2026</span><span>' + n + '/12</span></div>';
  const S = [];
  S.push('<section class="s"><div class="ey">Decidível · geofísica e petrofísica · sísmica 4D e CO₂</div><div class="cover"><div><h1>Antes de pagar por um levantamento 4D, saiba se ele pode responder.</h1>'
    + '<p style="margin-top:28px;max-width:44ch">Para toda rocha e todo fluido que a evidência admite, com aritmética exata: PROVADO, REFUTADO ou RECUSADO, e o que medir para decidir.</p></div>'
    + '<div class="card core"><div class="k">uma célula de coquina, a 1,5% de Tupi</div>' + chip(rc.verdict, true)
    + '<p style="font-size:15px">Mil sorteios de Monte Carlo viram no mínimo <b>' + w(mc.min) + '</b> de mudança. O Decidível provou um modelo admissível com <b>' + w(mc.attainedLo) + '</b>: um estudo por sorteio diria “detectável” e estaria errado.</p></div></div>'
    + '<div class="row" style="margin-top:auto;margin-bottom:34px;gap:14px">' + chip('PROVADO', true) + chip('REFUTADO', true) + chip('RECUSADO', true) + '</div>' + ft(1) + '</section>');
  S.push('<section class="s"><div class="ey">1 · o problema</div><h2>O 4D no pré-sal ainda está em debate</h2><div class="col2">'
    + '<div class="card"><ul><li>No piloto OBN de Tupi: NRMS de 2 a 3%; mudanças de impedância de cerca de <b>1,5%</b> distinguíveis.</li><li>A saturação sozinha superestima o sinal.</li><li>Quanto mais CO₂ no gás, mais denso, <b>menor o contraste</b>.</li></ul><p style="font-size:13px;margin-top:10px">Cruz et al. 2021 (SBGf; The Leading Edge 40:886)</p></div>'
    + '<div class="card claim"><div class="k">o que os estudos entregam</div><p>Um modelo, alguns cenários, ou uma probabilidade de detecção. Nenhum responde: <b>este levantamento vê a injeção para toda rocha e todo fluido admissíveis?</b> E se não sabe: <b>o que medir?</b></p></div>'
    + '</div>' + ft(2) + '</section>');
  S.push('<section class="s"><div class="ey">2 · como decide</div><h2>Caixas, não amostras</h2><div class="arch" style="grid-template-columns:1fr 34px 1.5fr 34px 1fr">'
    + '<div class="card"><div class="k">declarado, com fonte</div><h3>Faixas</h3><p>Porosidade e saturação; arcabouço de 9 plugues do pré-sal; fluidos de Batzle–Wang e NIST; a distribuição do gás de uniforme a em manchas.</p></div><div class="arr">→</div>'
    + '<div class="card core"><div class="k">o motor</div><h3>A caixa inteira, exata</h3><ol><li>Gassmann, Reuss a Voigt (toda lei de Brie), arcabouço na tendência de porosidade crítica</li><li>Extremos provados por intervalos e derivadas intervalares</li><li>Testemunhas: modelos reais de cada lado</li></ol></div><div class="arr">→</div>'
    + '<div class="card"><div class="k">o que sai</div><h3>Veredito</h3>' + chip('PROVADO') + chip('REFUTADO') + chip('RECUSADO') + '<p>e a medição que decide</p></div>'
    + '</div>' + ft(3) + '</section>');
  const c1 = rc.checks.find((c) => c.id === 'deteccao');
  S.push('<section class="s"><div class="ey">3 · uma pergunta, decidida</div><h2>Coquina (φ 0,13–0,15), frente de gás 15–30%, limite de 1,5%</h2><div class="col2">'
    + '<div class="card claim"><div class="k">a pergunta</div><p>Um levantamento 4D que resolve 1,5% de impedância vai ver a injeção de gás desta célula, para toda rocha e todo fluido admissíveis?</p></div>'
    + '<div class="card core">' + chip(rc.verdict, true) + '<p style="font-family:var(--f-mono);font-size:14px;color:var(--ink)">ΔIp/Ip provado em [' + w(rc.envelope[0]) + '; ' + w(rc.envelope[1]) + ']</p><p style="font-size:13.5px">' + esc(c1.text) + '</p></div>'
    + '</div>' + ft(4) + '</section>');
  S.push('<section class="s"><div class="ey">4 · o preço da informação</div><h2>Se você souber isto, o veredito vira aquilo</h2><table><thead><tr><th>o que se sabe</th><th>a 1,5%</th><th>mudança provada</th><th>o que decide</th></tr></thead><tbody>'
    + H.table.map((t) => '<tr><td>' + esc(D.scenarios[t.k].label) + '</td><td>' + chip(t.verdict) + '</td><td>' + w(t.range[0]) + ' – ' + w(t.range[3]) + '</td><td>' + (t.range[0] > 0 ? 'resolver ' + w(t.range[0]) + ' → PROVADO' : 'há modelo sem mudança') + '</td></tr>').join('')
    + '</tbody></table>' + ft(5) + '</section>');
  S.push('<section class="s"><div class="ey">5 · o mapa</div><h2>O que se sabe muda onde o 4D decide</h2><div class="col2">'
    + '<div class="card"><div class="k">só a faixa física · 1,5%</div>' + miniMap(N, L.scenarios[0], 1.5) + '</div>'
    + '<div class="card"><div class="k">' + esc(D.scenarios[L.scenarios[4]].label) + ' · 0,5%</div>' + miniMap(N, L.scenarios[4], 0.5) + '</div>'
    + '</div><p style="margin-top:18px;font-size:15px">Cheio: PROVADO · meio cheio: RECUSADO · anel: REFUTADO · vazio: não decidido neste orçamento. Cada célula, uma caixa decidida.</p>' + ft(6) + '</section>');
  const f0 = N.field(L.scenarios[0], 1.5, 5), f4 = N.field(L.scenarios[4], 0.5, 5);
  S.push('<section class="s"><div class="ey">6 · um análogo público do pré-sal</div><h2>' + br.int(N.active) + ' células do UNISIM-IV, frente de gás em 20–24%</h2><div class="col2">'
    + '<div class="card"><div class="k">só a faixa física · 1,5%</div><p>PROVADO <b>' + br.int(f0.PROVADO) + '</b> · RECUSADO <b>' + br.int(f0.RECUSADO) + '</b> · REFUTADO <b>' + br.int(f0.REFUTADO) + '</b> · não decidido ' + br.int(f0.open) + '</p></div>'
    + '<div class="card core"><div class="k">' + esc(D.scenarios[L.scenarios[4]].label) + ' · 0,5%</div><p>PROVADO <b>' + br.int(f4.PROVADO) + '</b> · RECUSADO <b>' + br.int(f4.RECUSADO) + '</b> · REFUTADO <b>' + br.int(f4.REFUTADO) + '</b> · não decidido ' + br.int(f4.open) + '</p></div>'
    + '</div><p style="margin-top:22px">Benchmark UNISIM-IV-2026 (UNICAMP): porosidade e tipo de rocha de cada célula ativa, Swi e Sorg das tabelas de permeabilidade relativa, gás 44% CO₂.</p>' + ft(7) + '</section>');
  S.push('<section class="s"><div class="ey">7 · estado da arte</div><h2>Toda detectabilidade publicada é probabilística ou por cenários</h2><ul style="font-size:16px">'
    + '<li><b>Tupi (Cruz et al. 2021)</b>: limiar por volta de 1,5%, sem garantia por modelo</li><li><b>da Silva, Davolio et al. 2025 (UNISIM)</b>: viabilidade por cenários</li><li><b>Sleipner (Chadwick et al. 2014)</b>: probabilidade de detecção</li><li><b>Bergmann e Chadwick 2015</b>: limites por enumeração, sem aritmética rigorosa nem decisão — o antecedente mais próximo</li><li><b>FWI bayesiana (Zhang et al. 2023)</b>: a incerteza é subestimada</li><li><b>Valor da informação (Anyosa et al. 2021)</b>: em esperança, não caso a caso</li></ul>'
    + '<p style="margin-top:18px">Não encontramos veredito garantido de detectabilidade, com recusa e a medição que decide.</p>' + ft(8) + '</section>');
  S.push('<section class="s"><div class="ey">8 · o que substitui</div><h2>Da probabilidade de detecção para a decisão</h2><table><thead><tr><th>hoje</th><th>entrega</th><th>com o Decidível</th></tr></thead><tbody>'
    + '<tr><td>Monte Carlo</td><td>“detectável em 97% dos sorteios”</td><td>o modelo que os sorteios não viram, provado</td></tr>'
    + '<tr><td>Regra de NRMS</td><td>um limiar para qualquer rocha</td><td>o limiar exato desta caixa</td></tr>'
    + '<tr><td>Valor da informação</td><td>quanto vale medir, em média</td><td>qual medição decide este caso</td></tr>'
    + '<tr><td>Inversão bayesiana</td><td>uma distribuição do prior</td><td>o conjunto admissível inteiro</td></tr>'
    + '<tr><td>Monitoramento de CO₂</td><td>simulações e curvas</td><td>um recibo reexecutável para a ANP</td></tr>'
    + '</tbody></table>' + ft(9) + '</section>');
  S.push('<section class="s"><div class="ey">9 · onde vale</div><h2>Aquisição 4D, WAG e CO₂ que precisa ser comprovado</h2><div class="col3">'
    + '<div class="card"><div class="k">aquisição</div><p>Decidir antes de adquirir: onde um levantamento vê, onde nenhum vê, onde depende do que medir.</p></div>'
    + '<div class="card"><div class="k">WAG</div><p>Onde a frente de gás é visível, para calibrar ciclos e varrido.</p></div>'
    + '<div class="card core"><div class="k">CO₂</div><p>A Petrobras reinjetou <b>19,6 Mt</b> de CO₂ em 2025 (20-F). O Decreto 13.095/2026 encerra a estocagem só com estabilidade <b>comprovada perante a ANP</b>.</p></div>'
    + '</div>' + ft(10) + '</section>');
  const bar = (a, b, t) => '<div class="bar" style="grid-column:' + (a + 2) + ' / ' + (b + 2) + '">' + t + '</div>';
  S.push('<section class="s"><div class="ey">10 · o projeto de PD&amp;I</div><h2>Doze meses para decidir antes de adquirir</h2><div class="tl">'
    + '<div class="tlr"><div></div>' + Array.from({ length: 12 }, (_, i) => '<div class="h">' + (i + 1) + '</div>').join('') + '</div>'
    + '<div class="tlr"><div class="lab">Viabilidade 4D decidida<span>um campo do pré-sal, dados da Petrobras</span></div>' + bar(0, 5, 'TRL 3 → 5') + '</div>'
    + '<div class="tlr"><div class="lab">Conformidade de CO₂<span>o que o levantamento prova sobre a pluma</span></div>' + bar(3, 9, 'TRL 2 → 4') + '</div>'
    + '<div class="tlr"><div class="lab">Profundidade sob o sal<span>velocidade dos evaporitos decidida</span></div>' + bar(6, 12, 'TRL 2 → 4') + '</div>'
    + '<div class="tlr"><div class="lab">No fluxo de interpretação<span>recibos por decisão</span></div>' + bar(6, 12, 'TRL 3 → 6') + '</div>'
    + '</div><div class="col2" style="margin-top:28px"><div><div class="k">o que pedimos</div><ul><li>um campo e uma pergunta de aquisição</li><li>perfis, plugues e PVT no ambiente da Petrobras</li><li>um geofísico-par e doze meses</li></ul></div>'
    + '<div><div class="k">como medimos</div><ul><li>veredito refeito sem o nosso código</li><li>cada RECUSADO com a medição que o decide</li></ul></div></div>' + ft(11) + '</section>');
  S.push('<section class="s"><div class="ey">11 · maturidade e contato</div><h2>O motor existe. O campo é o próximo passo.</h2><div class="col3">'
    + '<div class="card"><div class="k">tecnologia</div><div class="big">TRL 3</div><p>Motor, bateria com segunda implementação e mapa sobre um benchmark público.</p></div>'
    + '<div class="card"><div class="k">comercial</div><div class="big">CRL 2</div><p>Problema e comprador identificados; piloto a seguir.</p></div>'
    + '<div class="card core"><div class="k">contato</div><p><b>Carlos Toledo</b>, fundador</p><p>carlos@carlostoledo.co</p><p>carlostoledo.co/decidivel</p></div>'
    + '</div><p style="margin-top:28px;font-size:14px;color:var(--ink-4)">Faixas declaradas com fonte (Quadros et al. 2025; Batzle e Wang 1992; NIST; Cruz et al. 2021; UNISIM-IV-2026). Não são dados da Petrobras. Um PROVADO fala do modelo declarado e da caixa declarada.</p>' + ft(12) + '</section>');
  if (S.length !== 12) throw new Error('deck: expected 12 slides, built ' + S.length);
  const extra = '.mm{width:100%;height:auto}.mm .bg{fill:var(--sunk);stroke:var(--rule);stroke-width:1}.mm .full{fill:var(--ink)}.mm .tri{fill:var(--ink-3)}.mm .ring{fill:none;stroke:var(--ink-4);stroke-width:1}.mm text{font-family:var(--f-mono);font-size:10px;fill:var(--ink-3)}.arch .card h3{margin:0;font-size:20px}';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Decidível — apresentação</title>'
    + '<link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + CP.css() + extra + '</style></head><body>' + S.join('\n') + '</body></html>';
}

module.exports = { build, print: CP.print };
