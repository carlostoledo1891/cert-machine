#!/usr/bin/env node
/* x.js — the X account (@_carlos_toledo_) from this repository: a post, a thread, a reply, the mentions.

   WHY HERE. The operator opened the account on 2026-10-29 and asked to manage it from the session. A post is a send
   like any other (memory: outreach requires approval), so this tool PREVIEWS by default and publishes only with
   --send, which the session passes only on the operator's word for that post. Nothing here schedules anything.

   THE KEYS live outside the repository, in ~/.config/cert-machine/x.env (or the file named by X_ENV_FILE): X_API_KEY,
   X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET. The tool refuses a keys file that anyone but its owner can
   read, and it never prints a key. Requests are signed with OAuth 1.0a (HMAC-SHA1, RFC 5849) in this file, no
   dependency: `selftest` checks the signer against the worked example in X's own documentation and against a
   tampered copy that must differ.

   usage:
     node tools/x.js selftest                        the signer against X's documented example (no network)
     node tools/x.js whoami                          checks the keys: prints the account's @handle
     node tools/x.js post FILE [--reply-to ID|URL] [--send]
                                                     FILE holds one post, or a thread with posts separated by a line
                                                     "---"; previews each with its weighted length (≤ 280), and
                                                     publishes only with --send
     node tools/x.js mentions [--max N]              the latest mentions (each read is billed by X)

   Every published post is appended to ~/.config/cert-machine/x-sent.jsonl (id, url, text, time).       MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const API = 'https://api.x.com/2';
const ENV = process.env.X_ENV_FILE || path.join(os.homedir(), '.config', 'cert-machine', 'x.env');
const LOG = path.join(path.dirname(ENV), 'x-sent.jsonl');
const die = (m) => { console.error('x.js: ' + m); process.exit(1); };

/* ---- OAuth 1.0a ---- */
const enc = (s) => encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
function signature(method, url, params, consumerSecret, tokenSecret) {
  const norm = Object.keys(params).sort().map((k) => enc(k) + '=' + enc(params[k])).join('&');
  const base = [method.toUpperCase(), enc(url), enc(norm)].join('&');
  return crypto.createHmac('sha1', enc(consumerSecret) + '&' + enc(tokenSecret || '')).update(base).digest('base64');
}
function authHeader(K, method, url, query = {}) {
  const o = { oauth_consumer_key: K.X_API_KEY, oauth_nonce: crypto.randomBytes(16).toString('hex'), oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)), oauth_token: K.X_ACCESS_TOKEN, oauth_version: '1.0' };
  /* a JSON body is not part of the signature (RFC 5849 §3.4.1.3: only form-encoded bodies are); query parameters are */
  o.oauth_signature = signature(method, url, Object.assign({}, query, o), K.X_API_SECRET, K.X_ACCESS_TOKEN_SECRET);
  return 'OAuth ' + Object.keys(o).sort().map((k) => enc(k) + '="' + enc(o[k]) + '"').join(', ');
}

/* ---- the keys ---- */
function keys() {
  if (!fs.existsSync(ENV)) die('no keys file at ' + ENV);
  if (process.platform !== 'win32' && (fs.statSync(ENV).mode & 0o077)) die(ENV + ' is readable by others: run chmod 600 ' + ENV);
  const K = {};
  for (const line of fs.readFileSync(ENV, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#')) K[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  const need = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET'].filter((k) => !K[k]);
  if (need.length) die('the keys file lacks ' + need.join(', ') + ' (' + ENV + ')');
  return K;
}

async function call(K, method, pathname, { query = {}, body } = {}) {
  const url = API + pathname;
  const qs = Object.keys(query).length ? '?' + Object.keys(query).map((k) => enc(k) + '=' + enc(query[k])).join('&') : '';
  const res = await fetch(url + qs, { method, headers: Object.assign({ Authorization: authHeader(K, method, url, query) },
    body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch (e) { json = { raw: text.slice(0, 400) }; }
  if (!res.ok) die(method + ' ' + pathname + ' → HTTP ' + res.status + ': ' + JSON.stringify(json).slice(0, 600)
    + (res.status === 403 ? '\n  (a 403 on posting usually means the access token was generated before the app had Read and Write)' : ''));
  return json;
}

/* ---- the weighted length X counts: a URL is 23; code points in X's light ranges weigh 1, the rest (CJK, emoji) 2 ---- */
function weighted(text) {
  const t = text.replace(/https?:\/\/\S+/g, 'x'.repeat(23)).replace(/\b(?:[a-z0-9-]+\.)+(?:co|com|org|net|io|dev|ai|xyz)(?:\/\S*)?/gi, 'x'.repeat(23));
  let n = 0;
  for (const ch of t.normalize('NFC')) {
    const c = ch.codePointAt(0);
    n += (c <= 4351 || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247)) ? 1 : 2;
  }
  return n;
}
const idOf = (s) => { const m = /(\d{5,})\s*$/.exec(String(s || '').replace(/[?#].*$/, '')); if (!m) die('cannot read a post id from ' + s); return m[1]; };

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flag = (f) => rest.includes(f);
  const opt = (f) => { const i = rest.indexOf(f); return i >= 0 ? rest[i + 1] : undefined; };

  if (cmd === 'selftest') {
    /* X's documentation, "Creating a signature": the worked example's parameters, keys and expected signature */
    const url = 'https://api.twitter.com/1.1/statuses/update.json';
    const p = { status: 'Hello Ladies + Gentlemen, a signed OAuth request!', include_entities: 'true',
      oauth_consumer_key: 'xvz1evFS4wEEPTGEFPHBog', oauth_nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
      oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: '1318622958', oauth_token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb', oauth_version: '1.0' };
    const cs = 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw', ts = 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE';
    const got = signature('POST', url, p, cs, ts), want = 'hCtSmYh+iHYCEqBWrE7C7hYmtUk=';
    const red = signature('POST', url, Object.assign({}, p, { status: p.status + '.' }), cs, ts);
    const okLen = weighted('a https://carlostoledo.co/eth/ b') === 27 && weighted('δ₃') === 3;   /* ₃ (U+2083) is outside X's light ranges: it weighs 2 */
    console.log((got === want ? 'PASS' : 'FAIL') + '  the signer reproduces X\'s documented example (' + got + ')');
    console.log((red !== want ? 'PASS' : 'FAIL') + '  RED: one changed character changes the signature');
    console.log((okLen ? 'PASS' : 'FAIL') + '  the weighted length counts a URL as 23 and a subscript as 2');
    process.exit(got === want && red !== want && okLen ? 0 : 1);
  }

  if (cmd === 'whoami') {
    const me = await call(keys(), 'GET', '/users/me');
    console.log('@' + me.data.username + ' (id ' + me.data.id + ')');
    return;
  }

  if (cmd === 'post') {
    const file = rest.find((a) => !a.startsWith('--') && a !== opt('--reply-to'));
    if (!file || !fs.existsSync(file)) die('usage: node tools/x.js post FILE [--reply-to ID|URL] [--send]');
    const posts = fs.readFileSync(file, 'utf8').split(/^\s*---\s*$/m).map((s) => s.trim()).filter(Boolean);
    if (!posts.length) die(file + ' holds no post');
    let over = 0;
    posts.forEach((t, i) => {
      const n = weighted(t); if (n > 280) over++;
      console.log('\n[' + (i + 1) + '/' + posts.length + '] ' + n + '/280' + (n > 280 ? '  TOO LONG' : '') + '\n' + t);
    });
    if (over) die(over + ' post(s) over 280: nothing sent');
    if (!flag('--send')) { console.log('\npreview only — add --send to publish' + (opt('--reply-to') ? ' (as a reply to ' + idOf(opt('--reply-to')) + ')' : '')); return; }
    const K = keys();
    const me = (await call(K, 'GET', '/users/me')).data;
    let prev = opt('--reply-to') ? idOf(opt('--reply-to')) : null;
    for (const t of posts) {
      const r = await call(K, 'POST', '/tweets', { body: Object.assign({ text: t }, prev ? { reply: { in_reply_to_tweet_id: prev } } : {}) });
      prev = r.data.id;
      const url = 'https://x.com/' + me.username + '/status/' + prev;
      fs.appendFileSync(LOG, JSON.stringify({ id: prev, url, text: t, at: new Date().toISOString() }) + '\n');
      console.log('posted ' + url);
    }
    return;
  }

  if (cmd === 'mentions') {
    const K = keys();
    const me = (await call(K, 'GET', '/users/me')).data;
    const r = await call(K, 'GET', '/users/' + me.id + '/mentions', { query: { max_results: String(Math.min(100, Math.max(5, Number(opt('--max') || 10)))),
      expansions: 'author_id', 'tweet.fields': 'created_at,conversation_id', 'user.fields': 'username' } });
    const who = new Map(((r.includes || {}).users || []).map((u) => [u.id, u.username]));
    for (const t of r.data || []) console.log(t.created_at + '  @' + (who.get(t.author_id) || t.author_id) + '  https://x.com/i/status/' + t.id + '\n  ' + t.text.replace(/\n/g, '\n  '));
    if (!(r.data || []).length) console.log('no mentions');
    return;
  }

  die('usage: node tools/x.js selftest | whoami | post FILE [--reply-to ID|URL] [--send] | mentions [--max N]');
}
main().catch((e) => die(e.stack || String(e)));
