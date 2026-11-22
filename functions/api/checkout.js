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
