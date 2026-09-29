/* parse.js — THE parse rule of a significant-wave-height record, one module for every page that reads a reader's file:
   the return-level check (playground/return-level-check) and the return-level atlas's own-site pin. Moved here from the
   check's app.js on 2026-09-29, the rule's text unchanged; its sha256 goes into every certificate either page writes,
   so a checker reads the same bytes into the same series. Loaded as a plain script (window.HS_PARSE) or required by Node.

   usage: HS_PARSE.parse(text, col) -> { t, h, n, den, decimals, step, counts, reordered, first, col }, or throws */
(function (root) {
  'use strict';
  const fmt = (x) => Number(x).toLocaleString('en-US');
  const plural = (n, one, many) => fmt(n) + ' ' + (n === 1 ? one : many);
  /* ---- reading a series: THE parse rule ----
     A line opens with its timestamp: YYYY-MM-DD, then an hour after 'T', '-' or
     '_' (2004-03-01T06, 2004-03-01-06), or after a space, comma or semicolon only
     when a colon follows it (2004-03-01 06:00) — so "2004-03-01 3.549" is a date
     and a value, never hour 3. Minutes and seconds are optional; a zone after the
     time (Z, UTC, +03:00, -0300, -03) is applied, so every time is UTC. A
     timestamp that runs into other characters skips the line. The rest of the
     line is split into fields at spaces, tabs, commas, semicolons and bars; Hs is
     field `col`, a decimal (an exponent allowed). Dropped and counted: a field
     that is not a number, NDBC's missing marks 99, 999 and 9999 (any decimals),
     and a value not above zero. The lines are put in time order; a time given
     twice with the same value is kept once, and with two values refuses the file.
     The exact denominator is 10^d, d the most decimals any kept value carries. */
  const TS = /^\s*(\d{4})-(\d{2})-(\d{2})(?:(?:[T_-]|[\s,;]+(?=\d{1,2}:))(\d{1,2})(?::(\d{2})(?::(\d{2})(?:\.\d+)?)?)?(Z|[+-]\d{2}(?::?\d{2})?|\s*(?:UTC|GMT)\b)?)?/;
  const SEP = /[\s,;|]+/;
  const NUM = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
  const FILL = /^\+?9{2,4}(?:\.0*)?$/;
  function decimalsOf(tok) {
    const m = /^[^eE]*?\.(\d+)/.exec(tok), e = /[eE]([-+]?\d+)$/.exec(tok);
    return Math.max(0, (m ? m[1].length : 0) - (e ? Number(e[1]) : 0));
  }
  function parse(text, col) {
    const c = { skipped: 0, unreadable: 0, notNumber: 0, fill: 0, notPositive: 0, repeated: 0, zoned: 0 };
    const rows = []; let first = null;
    for (const line of text.split(/\r\n|\r|\n/)) {
      const m = TS.exec(line);
      if (!m) { if (line.trim()) c.skipped++; continue; }
      const after = line.charAt(m[0].length);
      if (after && !/[\s,;|]/.test(after)) { c.unreadable++; continue; }
      const y = +m[1], mo = +m[2], d = +m[3], hh = m[4] ? +m[4] : 0, mi = m[5] ? +m[5] : 0, ss = m[6] ? +m[6] : 0;
      let ms = Date.UTC(y, mo - 1, d, hh, mi, ss);
      const D = new Date(ms);
      if (D.getUTCFullYear() !== y || D.getUTCMonth() !== mo - 1 || D.getUTCDate() !== d || D.getUTCHours() !== hh || mi > 59 || ss > 59) { c.unreadable++; continue; }
      const z = m[7] ? m[7].trim() : '';
      if (z && z !== 'Z' && z !== 'UTC' && z !== 'GMT') {
        const zm = /^([+-])(\d{2}):?(\d{2})?$/.exec(z);
        const off = (zm[1] === '-' ? -1 : 1) * (Number(zm[2]) * 60 + Number(zm[3] || 0));
        if (off) { ms -= off * 60000; c.zoned++; }
      }
      const fields = line.slice(m[0].length).split(SEP).filter(Boolean);
      const tok = fields[col - 1];
      if (!first) first = { ts: m[0].trim(), fields: fields.slice(0, 12).map((f) => f.slice(0, 16)), more: fields.length > 12, pick: tok === undefined ? null : tok.slice(0, 16) };
      if (tok === undefined || !NUM.test(tok)) { c.notNumber++; continue; }
      if (FILL.test(tok)) { c.fill++; continue; }
      const v = Number(tok);
      if (!(v > 0) || !Number.isFinite(v)) { c.notPositive++; continue; }
      rows.push({ ms, v, dec: decimalsOf(tok) });
    }
    if (!first) throw new Error('no line opens with a timestamp YYYY-MM-DD');
    if (rows.length < 20) throw new Error('fewer than twenty lines hold a timestamp and a positive number in field ' + col + ' (' + fmt(rows.length) + ' do)');
    let reordered = false;
    for (let i = 1; i < rows.length; i++) if (rows[i].ms < rows[i - 1].ms) { reordered = true; break; }
    if (reordered) rows.sort((a, b) => a.ms - b.ms);
    const t = [], h = [], ms = []; let clashes = 0, clash = null, decimals = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (i && r.ms === rows[i - 1].ms) { if (r.v === rows[i - 1].v) c.repeated++; else { clashes++; if (clash === null) clash = r.ms; } continue; }
      t.push(new Date(r.ms).toISOString().slice(0, 19)); h.push(r.v); ms.push(r.ms); decimals = Math.max(decimals, r.dec);
    }
    if (clashes) throw new Error(plural(clashes, 'time is', 'times are') + ' given twice with different values (the first at ' + new Date(clash).toISOString().slice(0, 16).replace('T', ' ') + ' UTC): is the hour in a field of its own?');
    if (h.every((v) => v === h[0])) throw new Error('every value in field ' + col + ' is ' + h[0] + ': is Hs in another field?');
    /* the native step: the most common gap, in hours */
    const gaps = new Map();
    for (let i = 1; i < ms.length; i++) { const g = (ms[i] - ms[i - 1]) / 3600000; gaps.set(g, (gaps.get(g) || 0) + 1); }
    let step = null, best = 0; for (const [g, k] of gaps) if (k > best) { best = k; step = g; }
    return { t, h, n: h.length, den: Number('1e' + decimals), decimals, step, counts: c, reordered, first, col };
  }
  const API = { parse, decimalsOf, TS, SEP, NUM, FILL };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.HS_PARSE = API;
})(typeof self !== 'undefined' ? self : this);
