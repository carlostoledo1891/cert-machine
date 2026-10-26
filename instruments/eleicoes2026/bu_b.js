#!/usr/bin/env node
/* instruments/eleicoes2026/bu_b.js — decider B for the 2026 presidential boletins de urna: Node, BigInt sums, no
   dependencies, and no code shared with decider A (bu_a.py). It reads the CSV as bytes from stdin (`unzip -p` of the
   pinned zip), decodes latin-1 itself, splits ';'-separated quoted fields with its own scanner, keeps the office
   Presidente (CD_CARGO_PERGUNTA = 1), and decides per section the same three conditions as A — votes sum to turnout
   (S1), turnout + abstentions = registered and turnout ≤ registered (S2), the repeated section fields agree (S3) — and
   the exact totals per candidate, blank, null, turnout, registered and sections. A section is keyed by UF,
   municipality, zone and section; the file does not keep a section's
   rows together, so rows are accumulated by key.

   usage: unzip -p bweb_1t_SP_….zip '*.csv' | node instruments/eleicoes2026/bu_b.js SP > part.json
          node instruments/eleicoes2026/bu_b.js --merge part1.json part2.json … > national.json            MIT */
'use strict';
const fs = require('fs');

function fieldsOf(line) {
  const out = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      let j = i + 1, s = '';
      for (;;) {
        const k = line.indexOf('"', j);
        if (k < 0) throw new Error('unterminated quote');
        s += line.slice(j, k);
        if (line[k + 1] === '"') { s += '"'; j = k + 2; continue; }
        i = k + 1;
        break;
      }
      out.push(s);
      if (line[i] === ';') i++; else break;
    } else {
      const k = line.indexOf(';', i);
      if (k < 0) { out.push(line.slice(i)); break; }
      out.push(line.slice(i, k));
      i = k + 1;
    }
  }
  return out;
}

function add(map, k, v) { map[k] = (map[k] || 0n) + v; }

function decide(uf) {
  const SECTION = ['QT_APTOS', 'QT_COMPARECIMENTO', 'QT_ABSTENCOES', 'CD_TIPO_URNA', 'DT_ABERTURA', 'DT_ENCERRAMENTO',
    'DS_SECOES_AGREGADAS', 'QT_ELEI_BIOM_SEM_HABILITACAO'];
  const tot = {}, fail = { S1: 0, S2: 0, S3: 0 }, sec = new Map();   // the file does not keep a section's rows together
  let ix = null, rest = '';
  const onLine = (line) => {
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (!line) return;
    const f = fieldsOf(line);
    if (ix === null) { ix = {}; f.forEach((k, i) => { ix[k] = i; }); return; }
    if (f[ix.CD_CARGO_PERGUNTA] !== '1') return;
    const key = [f[ix.SG_UF], f[ix.CD_MUNICIPIO], f[ix.NR_ZONA], f[ix.NR_SECAO]].join('|');
    const sf = SECTION.map((k) => f[ix[k]]).join('\u0001');
    let e = sec.get(key);
    if (!e) { e = { sf, votes: {}, mismatch: false }; sec.set(key, e); } else if (e.sf !== sf) e.mismatch = true;
    const tipo = f[ix.CD_TIPO_VOTAVEL];
    const who = tipo === '1' ? f[ix.NR_VOTAVEL] : ({ '2': 'BRANCO', '3': 'NULO' })[tipo] || 'T' + tipo;
    add(e.votes, who, BigInt(f[ix.QT_VOTOS]));
  };
  process.stdin.on('data', (buf) => {
    const text = rest + buf.toString('latin1');
    const lines = text.split('\n');
    rest = lines.pop();
    for (const l of lines) onLine(l);
  });
  process.stdin.on('end', () => {
    if (rest) onLine(rest);
    for (const e of sec.values()) {
      const [aptos, comp, abst] = e.sf.split('\u0001').slice(0, 3).map(BigInt);
      let sum = 0n;
      for (const k in e.votes) { sum += e.votes[k]; add(tot, k, e.votes[k]); }
      if (sum !== comp) fail.S1++;
      if (comp + abst !== aptos || comp > aptos) fail.S2++;
      if (e.mismatch) fail.S3++;
      add(tot, '_aptos', aptos); add(tot, '_turnout', comp); add(tot, '_abstentions', abst); add(tot, '_sections', 1n);
    }
    const o = { decider: 'B (Node, BigInt)', uf, totals: {}, failures: fail };
    for (const k of Object.keys(tot).sort()) o.totals[k] = tot[k].toString();
    process.stdout.write(JSON.stringify(o) + '\n');
  });
}

function merge(paths) {
  const nat = {}, fail = { S1: 0, S2: 0, S3: 0 }, per_uf = {};
  for (const p of paths) {
    const o = JSON.parse(fs.readFileSync(p, 'utf8'));
    per_uf[o.uf] = o.totals;
    for (const k in o.totals) add(nat, k, BigInt(o.totals[k]));
    for (const k in fail) fail[k] += o.failures[k];
  }
  const national = {};
  for (const k of Object.keys(nat).sort()) national[k] = nat[k].toString();
  process.stdout.write(JSON.stringify({ decider: 'B (Node, BigInt)', national, per_uf, failures: fail }, null, 1) + '\n');
}

if (process.argv[2] === '--merge') merge(process.argv.slice(3));
else decide(process.argv[2] || '?');
