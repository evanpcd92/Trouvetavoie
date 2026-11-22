// Crée une session de paiement Stripe Checkout et redirige le visiteur vers la page Stripe
const PRICES = {
  essentiel: process.env.STRIPE_PRICE_ESSENTIEL || 'price_1UeW7eQYGqrixugcGLNH4Mea',
  complet: process.env.STRIPE_PRICE_COMPLET || 'price_1UeWBMQYGqrixugcwOd2RT59'
};
export default async function handler(req, res) {
  const plan = String((req.query && req.query.plan) || '');
  const price = PRICES[plan];
  const key = process.env.STRIPE_SECRET_KEY;
  if (!price || !key) return res.status(400).send('Paiement indisponible pour le moment.');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = 'https://' + host;
  const p = new URLSearchParams();
  p.append('mode', 'payment');
  p.append('line_items[0][price]', price);
  p.append('line_items[0][quantity]', '1');
  p.append('success_url', base + '/?session_id={CHECKOUT_SESSION_ID}#paiement');
  p.append('cancel_url', base + '/#paiement');
  p.append('metadata[plan]', plan);
  p.append('locale', 'fr');
  const email = String((req.query && req.query.email) || '');
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) p.append('customer_email', email);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p.toString()
  });
  const s = await r.json();
  if (!r.ok || !s.url) return res.status(502).send('Erreur Stripe : ' + ((s.error && s.error.message) || 'inconnue'));
  res.writeHead(303, { Location: s.url });
  res.end();
}
