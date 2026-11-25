// Cloudflare Pages Function : retrouver son accès sur un autre appareil (e-mail + mot de passe).
// Pas de base de données : le mot de passe, sous forme d'empreinte PBKDF2 (jamais en clair),
// est rangé dans les métadonnées du paiement Stripe correspondant à l'achat.
//   POST /api/compte {action:'creer', session_id, password}  -> après l'achat, crée (ou change) le mot de passe
//   POST /api/compte {action:'connexion', email, password}   -> rouvre l'accès sur n'importe quel appareil
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const ITER = 100000;
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password, salt, iter = ITER) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function empreinte(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await derive(password, salt))}`;
}
async function verifie(password, stored) {
  const [algo, iter, salt, hash] = String(stored || '').split('$');
  if (algo !== 'pbkdf2' || !salt || !hash) return false;
  const a = await derive(password, unb64(salt), +iter), b = unb64(hash);
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
const planDe = (s) => (s.metadata && ['essentiel', 'complet'].includes(s.metadata.plan)) ? s.metadata.plan : (s.amount_total >= 999 ? 'complet' : 'essentiel');

async function stripe(env, path, body) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: body ? body.toString() : undefined,
  });
  return { ok: r.ok, data: await r.json() };
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: 'Service indisponible pour le moment.' }, 500);
  let q;
  try { q = await request.json(); } catch (e) { return json({ ok: false, error: 'Requête invalide.' }, 400); }
  const password = String(q.password || '');
  if (password.length < 8 || password.length > 200) return json({ ok: false, error: 'Le mot de passe doit faire au moins 8 caractères.' }, 400);

  if (q.action === 'creer') {
    const id = String(q.session_id || '');
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json({ ok: false, error: 'Achat introuvable.' }, 400);
    const s = await stripe(env, 'checkout/sessions/' + id);
    if (!s.ok || s.data.payment_status !== 'paid' || !s.data.payment_intent) return json({ ok: false, error: 'Achat introuvable.' }, 404);
    const pi = typeof s.data.payment_intent === 'string' ? s.data.payment_intent : s.data.payment_intent.id;
    const p = new URLSearchParams();
    p.append('metadata[ttv_pwd]', await empreinte(password));
    const u = await stripe(env, 'payment_intents/' + pi, p);
    if (!u.ok) return json({ ok: false, error: 'Impossible d’enregistrer le mot de passe. Réessaie.' }, 502);
    return json({ ok: true, plan: planDe(s.data), email: (s.data.customer_details && s.data.customer_details.email) || '' });
  }

  if (q.action === 'connexion') {
    const email = String(q.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'Entre une adresse e-mail valide.' }, 400);
    await new Promise((r) => setTimeout(r, 300)); // freine les essais en série
    const sessions = [];
    for (const e of [...new Set([email, email.toLowerCase()])]) {
      const p = new URLSearchParams({ 'customer_details[email]': e, status: 'complete', limit: '20' });
      p.append('expand[]', 'data.payment_intent');
      const r = await stripe(env, 'checkout/sessions?' + p.toString());
      if (r.ok) sessions.push(...r.data.data.filter((s) => s.payment_status === 'paid'));
    }
    let ok = false;
    for (const s of sessions) {
      const meta = s.payment_intent && s.payment_intent.metadata;
      if (meta && meta.ttv_pwd && (await verifie(password, meta.ttv_pwd))) { ok = true; break; }
    }
    if (!ok) return json({ ok: false, error: 'E-mail ou mot de passe incorrect.' }, 401);
    const plan = sessions.some((s) => planDe(s) === 'complet') ? 'complet' : 'essentiel';
    return json({ ok: true, plan, email: (sessions[0].customer_details && sessions[0].customer_details.email) || email });
  }
  return json({ ok: false, error: 'Action inconnue.' }, 400);
}
