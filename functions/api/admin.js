// Cloudflare Pages Function : liste privée pour la tâche programmée qui envoie les e-mails (bienvenue, mot de passe oublié).
// Protégée par la clé ADMIN_CLE (variable Cloudflare), envoyée dans l'en-tête « Authorization: Bearer <clé> ».
//   GET  /api/admin                         -> { bienvenue:[{pi,email,plan}], reinit:[{pi,email,lien}] }
//   POST /api/admin {action:'fait', pi, type:'bienvenue'|'reinit'}  -> marque l'e-mail comme envoyé
// Aucune base de données : tout est rangé dans les métadonnées des paiements Stripe.
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const enc = new TextEncoder();
const b64u = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function autorise(request, env) {
  const cle = env.ADMIN_CLE || '';
  if (cle.length < 16) return false;
  const recu = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(recu)), crypto.subtle.digest('SHA-256', enc.encode(cle))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}
export async function signe(env, payload) {
  const corps = b64u(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', enc.encode(env.ADMIN_CLE), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(corps)));
  return corps + '.' + b64u(sig);
}
async function stripe(env, path, body) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: body ? body.toString() : undefined,
  });
  return { ok: r.ok, data: await r.json() };
}
const planDe = (s) => (s.metadata && ['essentiel', 'complet'].includes(s.metadata.plan)) ? s.metadata.plan : (s.amount_total >= 999 ? 'complet' : 'essentiel');

export async function onRequestGet({ request, env }) {
  if (!(await autorise(request, env))) return json({ ok: false }, 401);
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: 'clé Stripe absente' }, 500);
  const depuis = Math.floor(Date.now() / 1000) - 14 * 86400; // achats des 14 derniers jours
  const p = new URLSearchParams({ status: 'complete', limit: '100', 'created[gte]': String(depuis) });
  p.append('expand[]', 'data.payment_intent');
  const r = await stripe(env, 'checkout/sessions?' + p.toString());
  if (!r.ok) return json({ ok: false, error: 'Stripe indisponible' }, 502);
  const base = new URL(request.url).origin;
  const bienvenue = [], reinit = [], vus = new Set();
  for (const s of r.data.data) {
    if (s.payment_status !== 'paid' || !s.payment_intent || typeof s.payment_intent !== 'object') continue;
    const pi = s.payment_intent, m = pi.metadata || {}, email = (s.customer_details && s.customer_details.email) || '';
    if (!email) continue;
    if (!m.ttv_bienvenue) bienvenue.push({ pi: pi.id, email, plan: planDe(s) });
    // une seule demande de nouveau mot de passe par adresse, même avec plusieurs achats
    if (m.ttv_reset_at && m.ttv_reset_envoye !== m.ttv_reset_at && !vus.has(email.toLowerCase())) {
      vus.add(email.toLowerCase());
      const jeton = await signe(env, { e: email.toLowerCase(), r: m.ttv_reset_at, x: Date.now() + 24 * 3600 * 1000 });
      reinit.push({ pi: pi.id, email, lien: `${base}/#nouveau-mdp-${jeton}` });
    }
  }
  return json({ ok: true, bienvenue, reinit });
}

export async function onRequestPost({ request, env }) {
  if (!(await autorise(request, env))) return json({ ok: false }, 401);
  let q;
  try { q = await request.json(); } catch (e) { return json({ ok: false }, 400); }
  if (q.action !== 'fait' || !/^pi_[A-Za-z0-9]+$/.test(String(q.pi || ''))) return json({ ok: false }, 400);
  const pi = await stripe(env, 'payment_intents/' + q.pi);
  if (!pi.ok) return json({ ok: false }, 404);
  const p = new URLSearchParams();
  if (q.type === 'bienvenue') p.append('metadata[ttv_bienvenue]', new Date().toISOString().slice(0, 10));
  else if (q.type === 'reinit') p.append('metadata[ttv_reset_envoye]', (pi.data.metadata || {}).ttv_reset_at || '');
  else return json({ ok: false }, 400);
  const u = await stripe(env, 'payment_intents/' + q.pi, p);
  return json({ ok: u.ok }, u.ok ? 200 : 502);
}
