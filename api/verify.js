// Vérifie un paiement Stripe Checkout côté serveur (la clé secrète ne quitte jamais Vercel)
export default async function handler(req, res) {
  const id = String((req.query && req.query.session_id) || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ ok: false, error: 'session invalide' });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'clé Stripe absente' });
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + id, { headers: { Authorization: 'Bearer ' + key } });
  if (!r.ok) return res.status(404).json({ ok: false, error: 'session introuvable' });
  const s = await r.json();
  if (s.payment_status !== 'paid') return res.status(402).json({ ok: false, error: 'paiement non finalisé' });
  const plan = (s.metadata && ['essentiel','complet'].includes(s.metadata.plan)) ? s.metadata.plan : (s.amount_total >= 999 ? 'complet' : 'essentiel');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, plan, email: (s.customer_details && s.customer_details.email) || '' });
}
