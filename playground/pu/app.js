/* app.js — PU Verificado in the tab. Uses globalThis.PU (instruments/pu/decide.js, inlined), globalThis.PU_ROWS
   (instruments/pu/rows.js, inlined — the module the ledger calls on every row) and the pinned data in the page. */
(function () {
  'use strict';
  const J = (id) => JSON.parse(document.getElementById(id).textContent);
  const SPEC = J('pu-spec'), HOL = J('pu-holidays'), B3 = J('pu-b3'), SELICP = J('pu-selic'), METAP = J('pu-meta');
  const PU = globalThis.PU;
  /* the packed SGS 11, decoded exactly as playground/pu/build.js decodes it before writing the page */
  const isoAdd = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
  const unpackSelic = (p) => { const out = []; let iso = p.first, k = 0; for (const [n, v] of p.runs) for (let j = 0; j < n; j++) { if (out.length) iso = isoAdd(iso, parseInt(p.gaps[k++], 36)); out.push({ iso, pct6: v }); } return out; };
  const DR = globalThis.PU_ROWS.rowDecider({ PU, holidays: HOL, b3: B3, selic: unpackSelic(SELICP), meta: new Map(METAP) });
  const calToday = DR.cal, calPre = DR.calPre;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cal = () => ($('precal').checked ? calPre : calToday);
  const centsOf = (s) => { const t = String(s).trim().replace(/\./g, '').replace(',', '.'); const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t); if (!m) return null; return BigInt(m[1]) * 100n + BigInt((m[2] || '0').padEnd(2, '0')); };
  const dec2 = (c) => PU.dec(c, 2);
  /* the methodology's worked examples (STN 2024, Tabela 3 and its annex): each title opens on its own */
  const EXAMPLE = { LTN: { mat: '2010-07-01', settle: '2008-05-21', rate: '14,3600' }, 'NTN-F': { mat: '2014-01-01', settle: '2008-05-21', rate: '13,6600' },
    LFT: { mat: '2014-03-07', settle: '2008-05-21', quote: '2008-05-20', rate: '-0,0200' } };

  function one() {
    const kind = $('kind').value, mat = $('mat').value, settle = $('settle').value, rate = $('rate').value.trim(), quote = $('quote').value;
    const out = $('out');
    $('quoteL').hidden = kind !== 'LFT';
    try {
      if (!mat || !settle) throw new Error('a settlement date and a maturity are needed');
      if (settle >= mat) throw new Error('settlement on or after maturity — the publisher’s rows there are NEEDS DATA');
      if (!cal().isBiz(settle)) throw new Error('the settlement date is not a business day on the pinned calendar');
      let r, v = null;
      if (kind === 'LFT') {
        if (!quote) throw new Error('the LFT needs the quotation day: the VNA is the Selic index there, projected to the settlement');
        if (quote > settle) throw new Error('the quotation comes after the settlement');
        v = DR.vnaFor(quote, settle);
        if (!v) throw new Error('NEEDS DATA — no Selic index or target for ' + quote + ' in the pinned series (' + SPEC.selic.first + ' to ' + SPEC.selic.last + ')');
        if (v.refused) throw new Error('REFUSED — the projected VNA straddles its truncation boundary');
        r = PU.decideLFT(rate, settle, mat, cal(), v.vna6);
      } else r = kind === 'LTN' ? PU.decideLTN(rate, settle, mat, cal()) : PU.decideNTNF(rate, settle, mat, cal());
      let html = '';
      if (!r.decided) {
        html += '<p class="verdict refused">REFUSED — the enclosure straddles a truncation boundary' + (r.refused ? ' at flow ' + esc(r.refused.date) : r.at ? ' at the ' + esc(r.at) : '') + '.</p>';
      } else {
        const pu6 = PU.dec(r.pu6, 6), t2 = dec2(PU.trunc2(r.pu6)), r2 = dec2(PU.round2(r.pu6));
        html += '<div class="big"><span class="k">PU T-6</span><span class="v m">' + esc(pu6) + '</span></div>';
        html += '<div class="grid">';
        if (kind === 'LTN' || kind === 'LFT') {
          html += '<div><span class="k">du</span><span class="m">' + r.du + '</span></div>';
          html += '<div><span class="k">exponent T-14</span><span class="m">' + esc(((BigInt(r.du) * 10n ** 14n) / 252n).toString().padStart(15, '0').replace(/^(\d+)(\d{14})$/, '$1.$2')) + '</span></div>';
        }
        if (kind === 'LTN') {
          html += '<div><span class="k">enclosure before T-6</span><span class="m">[' + esc(r.enclosure[0]) + ', ' + esc(r.enclosure[1]) + ']</span></div>';
          html += '<div><span class="k">margin to the truncation boundaries</span><span class="m">' + esc(r.margin[0]) + ' · ' + esc(r.margin[1]) + '</span></div>';
        } else if (kind === 'LFT') {
          html += '<div><span class="k">VNA at ' + esc(quote) + ' (Selic index, T-6)</span><span class="m">' + esc(PU.dec(DR.IDX.vna6(quote), 6)) + '</span></div>';
          html += '<div><span class="k">VNA at the settlement</span><span class="m">' + esc(PU.dec(v.vna6, 6)) + (v.k ? ' · projected ' + v.k + ' business day' + (v.k > 1 ? 's' : '') + ' at the ' + esc(v.meta) + '% target' : ' · the index itself (D+0)') + '</span></div>';
          html += '<div><span class="k">cotação T-4</span><span class="m">' + esc(PU.dec(r.cotacao4, 4)) + '</span></div>';
          html += '<div><span class="k">margin to the truncation boundaries</span><span class="m">' + esc(r.margin[0]) + ' · ' + esc(r.margin[1]) + '</span></div>';
        } else {
          html += '<div><span class="k">coupon A-5</span><span class="m">' + esc(PU.dec(PU.coupon(), 5)) + '</span></div>';
          html += '<div><span class="k">flows</span><span class="m">' + r.flows.length + '</span></div>';
          html += '<div><span class="k">sum of flows (A-9 each)</span><span class="m">' + esc(r.sum9) + '</span></div>';
        }
        html += '<div><span class="k">printed at 2 decimals</span><span class="m">trunc ' + esc(t2) + ' · round ' + esc(r2) + '</span></div></div>';
        if (kind === 'NTN-F') {
          html += '<table class="flows"><thead><tr><th>payment</th><th>du</th><th>cash</th><th>present value A-9</th></tr></thead><tbody>' + r.flows.map((f) => '<tr><td>' + esc(f.date) + '</td><td>' + f.du + '</td><td>' + esc(f.cash) + '</td><td>' + esc(f.pv) + '</td></tr>').join('') + '</tbody></table>';
        }
        const printed = $('printed').value.trim();
        if (printed) {
          const c = centsOf(printed);
          if (c === null) html += '<p class="note">the printed price is not a decimal with up to two places</p>';
          else {
            const hit = c === PU.trunc2(r.pu6) ? 'TRUNC-2' : c === PU.round2(r.pu6) ? 'ROUND-2' : null;
            html += hit ? '<p class="verdict rep">REPRODUCED under ' + hit + ' — the printed ' + esc(dec2(c)) + ' is the rule’s value to the centavo.</p>'
              : '<p class="verdict off">OFF — printed ' + esc(dec2(c)) + ', the rule’s value ' + esc(pu6) + ' (truncated ' + esc(t2) + '); difference ' + esc((c - PU.trunc2(r.pu6)).toString()) + ' centavos. A pasted row is also tried under the other settlements and the rate’s half-unit box.</p>';
            html += '<p class="note"><em>given settlement on ' + esc(settle) + (kind === 'LFT' ? ', the Selic index of ' + esc(quote) : '') + ' and ' + ($('precal').checked ? 'the calendar as of the quotation' : 'today’s pinned ANBIMA calendar') + '</em> — the inputs above, chosen by you.</p>';
          }
        }
      }
      out.innerHTML = html;
    } catch (e) { out.innerHTML = '<p class="verdict refused">' + esc(e.message) + '</p>'; }
  }

  /* the ledger's own readings of a CSV row (tools/run-pu-ledger.js), so a pasted row is the row the ledger decided */
  const KIND = { 'Tesouro Prefixado': 'LTN', 'Tesouro Prefixado com Juros Semestrais': 'NTN-F', 'Tesouro Selic': 'LFT' };
  const toIso = (dmy) => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}`; };
  const cents = (s) => { const t = s.trim().replace('.', '').replace(',', '.'); const m = /^(\d+)\.(\d{2})$/.exec(t) || /^(\d+)$/.exec(t); if (!m) return null; return BigInt(m[1]) * 100n + BigInt(m[2] || '0'); };
  const CLS = { REPRODUCED: 'rep', CONSISTENT: 'rep', OFF: 'off', REFUSED: 'refused', 'NEEDS DATA': 'refused' };
  /* WARRANT v2 (2026-10-28): every verdict here holds under a named hypothesis — a settlement convention, a calendar —
     so the hypothesis is said in words, in the conditional mood (italic), and the ledger's code stays in the title.
     An OFF row carries the house's one accent, a red ×: the row is an object the file printed, and under every
     registered hypothesis it is not the rule's value at any rate its digits allow. A price typed by hand is a
     comparison of two numbers, with nothing to exhibit, and is never red. */
  const SETTLE = { D0: 'settling D+0', D1: 'settling D+1', D1x: 'settling D+1, skipping 24 and 31 December', D1b3: 'settling on B3’s next trading day', D0b3: 'settling on B3’s day' };
  const hypWords = (code) => { const p = code.split('/'); return SETTLE[p[0]] + (p.includes('pre') ? ', the calendar as of the quotation' : '') + (p.includes('r') ? ', across a day B3’s rules imply' : '') + (p.includes('T') ? ', truncated' : p.includes('R') ? ', rounded' : ''); };
  const given = (code, all) => '<em title="' + esc((all || [code]).join(' ')) + '">given ' + esc(hypWords(code)) + '</em>';
  const WX = '<span class="wx" aria-label="an exhibited counterexample">×</span> ';

  function rows() {
    const lines = $('paste').value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const tally = {}; let other = 0;
    const trs = [];
    for (const l of lines) {
      const f = l.split(';'); if (f.length < 7 || /^Tipo Titulo/.test(f[0])) continue;
      const kind = KIND[f[0]]; const mat = toIso(f[1]), date = toIso(f[2]);
      if (!kind) { other++; trs.push('<tr><td>' + esc(f[0]) + '</td><td>' + esc(mat) + '</td><td>' + esc(date) + '</td><td colspan="4"><span class="verdict refused">REFUSED — not decided here (the ledger decides LTN, NTN-F and LFT)</span></td></tr>'); continue; }
      const row = { kind, maturity: mat, date, taxaC: f[3].trim(), taxaV: f[4].trim(), puC: cents(f[5]), puV: cents(f[6]) };
      for (const x of DR.decideRow(row)) {
        tally[x.verdict] = (tally[x.verdict] || 0) + 1;
        const prim = x.hyp ? x.hyp[DR.PRIMARY[x.side]] : null;
        let cell = (x.verdict === 'OFF' ? WX : '') + '<span class="verdict ' + CLS[x.verdict] + '">' + esc(x.verdict) + '</span>';
        if (x.verdict === 'REPRODUCED') { const h = x.hyp[x.codes[0].replace(/\/[TR]$/, '')]; cell += ' <span class="m">' + esc(h.pu6) + '</span> · ' + given(x.codes[0], x.codes) + (x.codes.length > 1 ? ' (and ' + (x.codes.length - 1) + ' more)' : ''); }
        else if (x.verdict === 'CONSISTENT') cell += ' ' + given(x.consistent.under, x.consistent.codes) + ' · rate box [' + esc(x.consistent.rateBox[0]) + ', ' + esc(x.consistent.rateBox[1]) + '] · <span class="m">' + esc(x.consistent.puRange[0]) + ' – ' + esc(x.consistent.puRange[1]) + '</span>';
        else if (x.verdict === 'OFF') cell += ' <span class="m">' + esc(prim.pu6) + '</span> · ' + esc(x.diffCents) + ' ¢ ' + given(DR.PRIMARY[x.side]) + ' (off under all ' + Object.keys(x.hyp).length + ')';
        else if (x.why) cell += ' — ' + esc(x.why);
        /* the settlement of the hypothesis that holds (REPRODUCED, CONSISTENT), the primary's otherwise */
        const held = x.verdict === 'REPRODUCED' ? x.hyp[x.codes[0].replace(/\/[TR]$/, '')] : x.verdict === 'CONSISTENT' ? x.hyp[x.consistent.under] : prim;
        const settles = held ? held.settle : '—';
        const side = x.side === 'C' ? 'buy' : x.side === 'V' ? 'sell' : '—';
        const rate = x.side === 'C' ? row.taxaC : x.side === 'V' ? row.taxaV : '';
        const printed = x.side === 'C' ? row.puC : x.side === 'V' ? row.puV : null;
        trs.push('<tr><td>' + esc(kind) + '</td><td>' + esc(mat) + '</td><td>' + esc(date) + ' → ' + esc(settles) + '</td><td>' + side + '</td><td class="m">' + esc(rate) + '</td><td class="m">' + (printed === null ? '' : esc(dec2(printed))) + '</td><td>' + cell + '</td></tr>');
      }
    }
    const n = Object.values(tally).reduce((a, b) => a + b, 0);
    $('rowsNote').textContent = n ? n + ' prices · ' + Object.entries(tally).map(([k, v]) => v + ' ' + k.toLowerCase()).join(' · ') + (other ? ' · ' + other + ' refused by title' : '') : 'no decidable row pasted';
    $('table').innerHTML = trs.length ? '<div class="tw"><table><thead><tr><th>title</th><th>maturity</th><th>quoted → settles</th><th>side</th><th>rate</th><th>printed</th><th>verdict · the rule’s value</th></tr></thead><tbody>' + trs.join('') + '</tbody></table></div>' : '';
  }

  function example() {
    const e = EXAMPLE[$('kind').value];
    $('mat').value = e.mat; $('settle').value = e.settle; $('rate').value = e.rate; $('printed').value = '';
    if (e.quote) $('quote').value = e.quote;
    one();
  }
  ['mat', 'settle', 'rate', 'printed', 'quote', 'precal'].forEach((id) => $(id).addEventListener('input', one));
  $('kind').addEventListener('change', example);
  $('precal').addEventListener('change', one);
  $('decide').addEventListener('click', rows);
  one();
})();
