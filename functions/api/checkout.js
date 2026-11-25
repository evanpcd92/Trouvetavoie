// Cloudflare Pages Function : crée une session Stripe Checkout et redirige vers Stripe
export async function onRequestGet({ request, env }) {
  const PRICES = {
    essentiel: env.STRIPE_PRICE_ESSENTIEL || 'price_1UeW7eQYGqrixugcGLNH4Mea',
    complet: env.STRIPE_PRICE_COMPLET || 'price_1UeWBMQYGqrixugcwOd2RT59'
  };
  const url = new URL(request.url);
  const plan = url.searchParams.get('plan') || '';
  const price = PRICES[plan];
  const key = env.STRIPE_SECRET_KEY;
  if (!price || !key) return new Response('Paiement indisponible pour le moment.', { status: 400 });
  const base = url.origin;
  const p = new URLSearchParams();
  p.append('mode', 'payment');
  p.append('line_items[0][price]', price);
  p.append('line_items[0][quantity]', '1');
  p.append('success_url', base + '/?session_id={CHECKOUT_SESSION_ID}#paiement');
  p.append('cancel_url', base + '/#paiement');
  p.append('metadata[plan]', plan);
  p.append('locale', 'fr');
  const email = url.searchParams.get('email') || '';
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) p.append('customer_email', email);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p.toString()
  });
  const s = await r.json();
  if (!r.ok || !s.url) return new Response('Erreur Stripe : ' + ((s.error && s.error.message) || 'inconnue'), { status: 502 });
  return Response.redirect(s.url, 303);
}

// Version avec mot de passe : le formulaire envoie {plan, email, password} en POST (jamais dans l'adresse).
// Le mot de passe est transformé en empreinte PBKDF2 (jamais en clair) et rangé dans les métadonnées du paiement,
// pour pouvoir se connecter ensuite sur un autre appareil (voir compte.js). Réponse : {ok, url} vers la page Stripe.
const jsonR = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const b64 = (u8) => btoa(String.fromCharCode(...u8));
async function empreinte(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256));
  return `pbkdf2$100000$${b64(salt)}$${b64(bits)}`;
}
export async function onRequestPost({ request, env }) {
  const PRICES = {
    essentiel: env.STRIPE_PRICE_ESSENTIEL || 'price_1UeW7eQYGqrixugcGLNH4Mea',
    complet: env.STRIPE_PRICE_COMPLET || 'price_1UeWBMQYGqrixugcwOd2RT59'
  };
  let q;
  try { q = await request.json(); } catch (e) { return jsonR({ ok: false, error: 'Requête invalide.' }, 400); }
  const plan = String(q.plan || ''), email = String(q.email || '').trim(), password = String(q.password || '');
  const price = PRICES[plan];
  if (!price || !env.STRIPE_SECRET_KEY) return jsonR({ ok: false, error: 'Paiement indisponible pour le moment.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonR({ ok: false, error: 'Entre une adresse e-mail valide.' }, 400);
  if (password.length < 8 || password.length > 200) return jsonR({ ok: false, error: 'Le mot de passe doit faire au moins 8 caractères.' }, 400);
  const base = new URL(request.url).origin;
  const p = new URLSearchParams();
  p.append('mode', 'payment');
  p.append('line_items[0][price]', price);
  p.append('line_items[0][quantity]', '1');
  p.append('success_url', base + '/?session_id={CHECKOUT_SESSION_ID}#paiement');
  p.append('cancel_url', base + '/#paiement');
  p.append('metadata[plan]', plan);
  p.append('locale', 'fr');
  p.append('customer_email', email);
  p.append('payment_intent_data[metadata][ttv_pwd]', await empreinte(password));
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p.toString()
  });
  const s = await r.json();
  if (!r.ok || !s.url) return jsonR({ ok: false, error: 'Le paiement n’a pas pu démarrer. Réessaie dans un instant.' }, 502);
  return jsonR({ ok: true, url: s.url });
}
