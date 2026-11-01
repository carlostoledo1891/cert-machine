/* contact.js — THE contact card, once: the key, the triggers, the card's markup, its rules and its script.
   design/ · cert-machine · 2026-11-01

   WHY. The operator (2026-11-01): "a simple email form system to open an overlay card to fill and submit." The
   backend is Web3Forms (POST https://api.web3forms.com/submit, JSON in, { success, message } out); its access key is
   public by design — it only lets a form send to the inbox it was issued for, so it sits in the page.

   THE KEY LIVES HERE AND NOWHERE ELSE. Paste it between the quotes of WEB3FORMS_KEY below and sync (`make page`).
   While it is empty the build REFUSES to emit the card: no form, no script, and every trigger stays what it already is
   in its markup, a mailto: link to the one address — nothing broken ships. With the key, the same links open the card;
   with scripts off, they are still mailto: links.

   WHERE IT IS EMITTED. design/footer.js emits the card and its script right after the footer, so design/refresh.js
   re-bakes it into every committed page at sync with the footer's site line (as nav.js does with the theme pill); the
   rules are in footerCss(), so both sheets carry them. A page with no footer (a viewport page) has no card and no
   trigger. A trigger anywhere is trigger() below: an <a href="mailto:…" data-contact="<product>">, the product
   prefilling the card's select.

   THE CARD. A native <dialog> opened with showModal(): the rest of the page is inert while it is open, Esc closes it
   (the dialog's own cancel), a click on the backdrop closes it, Tab is held inside it, focus goes back to the trigger.
   Labels on every field; the status line is a live region. No library, no cookie, no tracking: one fetch, to Web3Forms,
   on submit, and nothing else leaves the page. Only the template's tokens are used: no new colour.             MIT */
'use strict';

const { GITHUB } = require('./nav.js');

/* ---- paste the Web3Forms access key here (the operator supplies it) ---- */
const WEB3FORMS_KEY = '';

const ENDPOINT = 'https://api.web3forms.com/submit';
const MAIL = 'carlos@carlostoledo.co';
const PILOT = GITHUB + '/issues/new?template=pilot.yml';   /* the public GitHub pilot form, kept as the card's alternative */
const FROM_NAME = 'carlostoledo.co';
/* the eight /verify/ products, in the page's order; tools/verify-page.js refuses to build when its product list and
   this one differ */
const PRODUCTS = ['Verify Graders', 'Verify Audits', 'Grader Red-Team', 'Eval & Data Audit', 'Verify Gym',
  'Training-Run Audit', 'Verified Datasets', 'Statement Check'];
const OTHER = 'Something else';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

/* read through module.exports, so a test can set the key or the endpoint on the module and render */
const key = () => String(module.exports.WEB3FORMS_KEY || '').trim();
const enabled = () => key().length > 0;

const mailto = (product) => 'mailto:' + MAIL + (product ? '?subject=' + encodeURIComponent('Verify — ' + product) : '');

/* a trigger: `raw` is the link's markup, `product` one of PRODUCTS (or '' for none), `cls` the link's own class */
function trigger({ raw, product = '', cls = '' }) {
  if (product && !PRODUCTS.includes(product)) throw new Error('contact.trigger(): "' + product + '" is not one of the products in design/contact.js');
  return '<a' + (cls ? ' class="' + escAttr(cls) + '"' : '') + ' href="' + escAttr(mailto(product)) + '" data-contact="' + escAttr(product) + '">' + raw + '</a>';
}

/* the card and its script, or nothing while the key is empty */
function cardHtml() {
  if (!enabled()) return '';
  const opts = PRODUCTS.concat([OTHER]).map((p) => '<option value="' + escAttr(p) + '">' + esc(p) + '</option>').join('');
  const field = (lab, ctl, opt) => '<label class="ct-f"><span class="ct-l">' + lab + (opt ? ' <em>optional</em>' : '') + '</span>' + ctl + '</label>';
  return '<dialog id="ct-card" class="ct" aria-modal="true" aria-labelledby="ct-title" aria-describedby="ct-note"><div class="ct-in">'
    + '<div class="ct-head"><div><span class="ct-k">contact</span><h2 id="ct-title">Write to Carlos</h2></div>'
    + '<button type="button" class="ct-x" data-ct-close aria-label="Close">×</button></div>'
    + '<form class="ct-form" action="' + escAttr(module.exports.ENDPOINT) + '" method="POST">'
    + '<input type="hidden" name="access_key" value="' + escAttr(key()) + '">'
    + field('Name', '<input name="name" autocomplete="name" required>')
    + field('E-mail', '<input type="email" name="email" autocomplete="email" required>')
    + field('Organisation', '<input name="organisation" autocomplete="organization">', true)
    + field('What it is about', '<select name="product">' + opts + '</select>')
    + field('Message', '<textarea name="message" rows="5" required></textarea>')
    + '<div hidden><label>Leave this box empty <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label></div>'
    + '<p class="ct-status" role="status" aria-live="polite"></p>'
    + '<div class="ct-acts"><button type="submit" class="ct-b ct-send">Send</button><button type="button" class="ct-b ghost" data-ct-close>Cancel</button></div>'
    + '<p class="ct-note" id="ct-note">Sent by Web3Forms to Carlos’s inbox; nothing stored here.</p>'
    + '<p class="ct-note">Or write to <a href="mailto:' + MAIL + '">' + MAIL + '</a>, or open the public <a href="' + escAttr(PILOT) + '">pilot form on GitHub</a>.</p>'
    + '</form>'
    + '<div class="ct-done" hidden tabindex="-1"><h3>Thank you. It is sent.</h3><p>Your message is on its way to Carlos’s inbox; the reply comes to the address you gave.</p>'
    + '<div class="ct-acts"><button type="button" class="ct-b ghost" data-ct-close>Close</button></div></div>'
    + '</div></dialog>' + SCRIPT;
}

/* the script, ES5 like the theme pill's. It reads the endpoint from the form's action and the key from its hidden
   field, so nothing in it changes with them. */
const SCRIPT = '<script>(function(){var d=document.getElementById("ct-card");if(!d||!d.showModal)return;'
  + 'var f=d.querySelector(".ct-form"),done=d.querySelector(".ct-done"),st=d.querySelector(".ct-status"),go=d.querySelector(".ct-send"),E=f.elements,'
  + 'MAIL=' + JSON.stringify(MAIL) + ',OTHER=' + JSON.stringify(OTHER) + ',FROM=' + JSON.stringify(FROM_NAME) + ',opener=null,down=null;'
  + 'function say(s,t){st.textContent=t||"";if(s)st.setAttribute("data-s",s);else st.removeAttribute("data-s")}'
  + 'function open(p,from){opener=from;if(!done.hidden){f.reset();done.hidden=true;f.hidden=false}say("");go.disabled=false;'
  + 'var ok=false;for(var i=0;i<E.product.options.length;i++)if(E.product.options[i].value===p)ok=true;E.product.value=ok?p:OTHER;'
  + 'd.showModal();(E.name.value?E.message:E.name).focus()}'
  + 'document.addEventListener("click",function(e){var a=e.target.closest?e.target.closest("[data-contact]"):null;'
  + 'if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(a.getAttribute("data-contact"),a)});'
  + 'd.addEventListener("close",function(){if(opener&&opener.focus)opener.focus()});'
  + 'd.addEventListener("pointerdown",function(e){down=e.target});'
  + 'd.addEventListener("click",function(e){if(e.target===d&&down===d)d.close()});'
  + 'd.addEventListener("keydown",function(e){if(e.key!=="Tab")return;var q=[].filter.call(d.querySelectorAll("a[href],button,input,select,textarea"),'
  + 'function(x){return !x.disabled&&x.tabIndex>=0&&x.getClientRects().length>0});if(!q.length)return;var a=q[0],z=q[q.length-1];'
  + 'if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});'
  + '[].forEach.call(d.querySelectorAll("[data-ct-close]"),function(b){b.addEventListener("click",function(){d.close()})});'
  + 'function sent(){go.disabled=false;say("");f.hidden=true;done.hidden=false;done.focus()}'
  + 'f.addEventListener("submit",function(e){e.preventDefault();var p=E.product.value||OTHER,nm=E.name.value.trim(),subj="Verify — "+p+" — "+nm;'
  + 'if(E.botcheck.checked){sent();return}'
  + 'var data={access_key:E.access_key.value,subject:subj,from_name:FROM,name:nm,email:E.email.value.trim(),organisation:E.organisation.value.trim(),product:p,message:E.message.value};'
  + 'function fail(m){go.disabled=false;say("error","It did not go through"+(m?" ("+m+")":"")+". Your message is still here; send it by e-mail instead: ");'
  + 'var a=document.createElement("a");a.href="mailto:"+MAIL+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(data.message+"\\n\\n"+nm+(data.organisation?", "+data.organisation:"")+"\\n"+data.email);'
  + 'a.textContent=MAIL;st.appendChild(a);st.appendChild(document.createTextNode("."))}'
  + 'go.disabled=true;say("sending","Sending…");'
  + 'fetch(f.action,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(data)})'
  + '.then(function(r){return r.json()}).then(function(j){if(j&&j.success)sent();else fail(j&&j.message)},function(){fail("")})})})();</script>';

/* what cardHtml emits, for design/refresh.js to replace in one match after the footer */
const CARD_RE = /<dialog id="ct-card"[\s\S]*?<\/dialog><script>[\s\S]*?<\/script>/;

/* the rules, once (in footerCss(), so both sheets carry them). The landing's Contact button is .ct-btn; the card
   is .ct. Every value is a token. */
function cardCss() {
  return `
/* the contact card (design/contact.js): a trigger looks like whatever its page makes it; the landing's is .ct-btn */
a.ct-btn{display:inline-flex;align-items:center;padding:var(--s-2) var(--s-4);border:1px solid var(--rule-strong);border-radius:var(--radius-m);
  color:var(--ink);font-weight:var(--weight-medium);font-size:var(--text-small);line-height:var(--leading-snug);
  transition:border-color var(--dur-fast) var(--ease-out)}
a.ct-btn:hover{border-color:var(--ink)}
.ct{width:min(calc(100vw - 2 * var(--gutter)), 36rem);max-width:none;max-height:calc(100dvh - 2 * var(--s-4));padding:0;margin:auto;
  background:var(--surface);color:var(--ink-2);border:1px solid var(--rule-strong);border-radius:var(--radius-l);box-shadow:var(--shadow);overflow:auto}
.ct::backdrop{background:var(--paper);opacity:.82}
.ct [hidden]{display:none}
.ct-in{padding:var(--s-5)}
.ct-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-4);margin-bottom:var(--s-5)}
.ct-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4)}
.ct h2{font-size:var(--text-2);margin:var(--s-1) 0 0}
.ct h3{font-size:var(--text-2);margin:0 0 var(--s-3)}
.ct-x{flex:none;width:var(--s-7);height:var(--s-7);display:inline-flex;align-items:center;justify-content:center;background:none;color:var(--ink-3);
  border:1px solid var(--rule);border-radius:var(--radius-pill);font-size:var(--text-3);line-height:var(--leading-tight);cursor:pointer}
.ct-x:hover{color:var(--ink);border-color:var(--ink)}
.ct-form{display:grid;gap:var(--s-4)}
.ct-f{display:grid;gap:var(--s-2)}
.ct-l{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.ct-l em{font-style:normal;color:var(--ink-4);text-transform:none;letter-spacing:var(--track-slight)}
.ct input,.ct select,.ct textarea{width:100%;font-family:var(--f-sans);font-size:var(--text-body);line-height:var(--leading-snug);color:var(--ink);
  background:var(--sunk);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:var(--s-2) var(--s-3)}
.ct textarea{resize:vertical;line-height:var(--leading-body)}
.ct input:focus-visible,.ct select:focus-visible,.ct textarea:focus-visible,.ct button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.ct-acts{display:flex;flex-wrap:wrap;gap:var(--s-3)}
.ct-b{font-family:var(--f-sans);font-size:var(--text-body);font-weight:var(--weight-medium);line-height:var(--leading-snug);padding:var(--s-2) var(--s-5);
  border:1px solid var(--ink);border-radius:var(--radius-m);background:var(--ink);color:var(--paper);cursor:pointer;
  transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)}
.ct-b:hover{background:var(--ink-2);border-color:var(--ink-2)}
.ct-b.ghost{background:transparent;color:var(--ink);border-color:var(--rule-strong)}
.ct-b.ghost:hover{border-color:var(--ink)}
.ct-b:disabled{opacity:.6;cursor:progress}
.ct-status{margin:0;font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-3)}
.ct-status:empty{display:none}
.ct-status[data-s="error"]{color:var(--ink);border-left:2px solid var(--ink);padding-left:var(--s-3)}
.ct-note{margin:0;font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-4)}
.ct-done p{font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink-3);margin:0 0 var(--s-5)}
.ct-done:focus{outline:none}
@media print{.ct{display:none}}
`;
}

module.exports = { WEB3FORMS_KEY, ENDPOINT, MAIL, PILOT, PRODUCTS, OTHER, FROM_NAME, enabled, mailto, trigger, cardHtml, cardCss, CARD_RE };
