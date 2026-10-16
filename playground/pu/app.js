/* app.js — PU Verificado in the tab. Uses globalThis.PU (instruments/pu/decide.js, inlined) and the pinned holidays. */
(function () {
  'use strict';
  const SPEC = JSON.parse(document.getElementById('pu-spec').textContent);
  const HOL = JSON.parse(document.getElementById('pu-holidays').textContent);
  const PU = globalThis.PU;
  const calToday = PU.calendar(HOL);
  const calPre = PU.calendar({ holidays: HOL.holidays.filter((h) => !(/-11-20$/.test(h) && Number(h.slice(0, 4)) >= 2024)) });
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cal = () => ($('precal').checked ? calPre : calToday);
  const centsOf = (s) => { const t = String(s).trim().replace(/\./g, '').replace(',', '.'); const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t); if (!m) return null; return BigInt(m[1]) * 100n + BigInt((m[2] || '0').padEnd(2, '0')); };
  const dec2 = (c) => PU.dec(c, 2);

  function one() {
    const kind = $('kind').value, mat = $('mat').value, settle = $('settle').value, rate = $('rate').value.trim();
    const out = $('out');
    try {
      if (!mat || !settle) throw new Error('a settlement date and a maturity are needed');
      if (settle >= mat) throw new Error('settlement on or after maturity — the publisher’s rows there are NEEDS DATA');
      if (!cal().isBiz(settle)) throw new Error('the settlement date is not a business day on the pinned calendar');
      const r = kind === 'LTN' ? PU.decideLTN(rate, settle, mat, cal()) : PU.decideNTNF(rate, settle, mat, cal());
      let html = '';
      if (!r.decided) {
        html += '<p class="verdict refused">REFUSED — the enclosure straddles a truncation boundary' + (r.refused ? ' at flow ' + esc(r.refused.date) : '') + '.</p>';
      } else {
        const pu6 = PU.dec(r.pu6, 6), t2 = dec2(PU.trunc2(r.pu6)), r2 = dec2(PU.round2(r.pu6));
        html += '<div class="big"><span class="k">PU T-6</span><span class="v m">' + esc(pu6) + '</span></div>';
        html += '<div class="grid">';
        if (kind === 'LTN') {
          html += '<div><span class="k">du</span><span class="m">' + r.du + '</span></div>';
          html += '<div><span class="k">exponent T-14</span><span class="m">' + esc(((BigInt(r.du) * 10n ** 14n) / 252n).toString().padStart(15, '0').replace(/^(\d+)(\d{14})$/, '$1.$2')) + '</span></div>';
          html += '<div><span class="k">enclosure before T-6</span><span class="m">[' + esc(r.enclosure[0]) + ', ' + esc(r.enclosure[1]) + ']</span></div>';
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
              : '<p class="verdict off">OFF — printed ' + esc(dec2(c)) + ', the rule’s value ' + esc(pu6) + ' (truncated ' + esc(t2) + '); difference ' + esc((c - PU.trunc2(r.pu6)).toString()) + ' centavos.</p>';
          }
        }
      }
      out.innerHTML = html;
    } catch (e) { out.innerHTML = '<p class="verdict refused">' + esc(e.message) + '</p>'; }
  }

  function rows() {
    const lines = $('paste').value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const KIND = { 'Tesouro Prefixado': 'LTN', 'Tesouro Prefixado com Juros Semestrais': 'NTN-F' };
    const toIso = (dmy) => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}`; };
    const c = cal(); let n = 0, rep = 0, off = 0, other = 0;
    const trs = [];
    for (const l of lines) {
      const f = l.split(';'); if (f.length < 7 || /^Tipo Titulo/.test(f[0])) continue;
      const kind = KIND[f[0]]; const mat = toIso(f[1]), date = toIso(f[2]);
      if (!kind) { other++; trs.push('<tr><td>' + esc(f[0]) + '</td><td>' + esc(mat) + '</td><td>' + esc(date) + '</td><td colspan="4"><span class="verdict refused">REFUSED — not a fixed-rate title (phase B)</span></td></tr>'); continue; }
      for (const side of ['C', 'V']) {
        const rate = side === 'C' ? f[3] : f[4], printed = centsOf(side === 'C' ? f[5] : f[6]);
        if (printed === null || printed === 0n || /^0+[,.]?0*$/.test(rate.trim())) continue;
        let settle = side === 'C' ? c.next(date) : (date >= '2021-09-13' ? date : c.next(date));
        n++;
        let cell;
        if (settle >= mat) cell = '<span class="verdict refused">NEEDS DATA — settlement on or after maturity</span>';
        else {
          const r = kind === 'LTN' ? PU.decideLTN(rate, settle, mat, c) : PU.decideNTNF(rate, settle, mat, c);
          if (!r.decided) cell = '<span class="verdict refused">REFUSED — straddle</span>';
          else {
            const t2 = PU.trunc2(r.pu6), r2 = PU.round2(r.pu6);
            if (printed === t2 || printed === r2) { rep++; cell = '<span class="verdict rep">REPRODUCED</span> <span class="m">' + esc(PU.dec(r.pu6, 6)) + '</span>'; }
            else { off++; cell = '<span class="verdict off">OFF</span> <span class="m">' + esc(PU.dec(r.pu6, 6)) + '</span> · ' + esc((printed - t2).toString()) + ' ¢'; }
          }
        }
        trs.push('<tr><td>' + esc(kind) + '</td><td>' + esc(mat) + '</td><td>' + esc(date) + ' → ' + esc(settle) + '</td><td>' + (side === 'C' ? 'buy' : 'sell') + '</td><td class="m">' + esc(rate) + '</td><td class="m">' + esc(dec2(printed)) + '</td><td>' + cell + '</td></tr>');
      }
    }
    $('rowsNote').textContent = n ? n + ' prices · ' + rep + ' reproduced · ' + off + ' off' + (other ? ' · ' + other + ' refused by title' : '') : 'no decidable row pasted';
    $('table').innerHTML = trs.length ? '<div class="tw"><table><thead><tr><th>title</th><th>maturity</th><th>quoted → settles</th><th>side</th><th>rate</th><th>printed</th><th>verdict · the rule’s value</th></tr></thead><tbody>' + trs.join('') + '</tbody></table></div>' : '';
  }

  ['kind', 'mat', 'settle', 'rate', 'printed', 'precal'].forEach((id) => $(id).addEventListener('input', one));
  $('precal').addEventListener('change', () => { one(); if ($('paste').value.trim()) rows(); });
  $('decide').addEventListener('click', rows);
  one();
})();
