// Cloudflare Pages Function : vérifie un paiement Stripe côté serveur
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get('session_id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json({ ok: false, error: 'session invalide' }, 400);
  const key = env.STRIPE_SECRET_KEY;
  if (!key) return json({ ok: false, error: 'clé Stripe absente' }, 500);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + id, { headers: { Authorization: 'Bearer ' + key } });
  if (!r.ok) return json({ ok: false, error: 'session introuvable' }, 404);
  const s = await r.json();
  if (s.payment_status !== 'paid') return json({ ok: false, error: 'paiement non finalisé' }, 402);
  const plan = (s.metadata && ['essentiel', 'complet'].includes(s.metadata.plan)) ? s.metadata.plan : (s.amount_total >= 999 ? 'complet' : 'essentiel');
  return json({ ok: true, plan, email: (s.customer_details && s.customer_details.email) || '' });
}
