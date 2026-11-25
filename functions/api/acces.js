// Cloudflare Pages Function : accès test (version payante) pour le propriétaire.
// Le code n'est jamais écrit dans le site : il est rangé dans la variable d'environnement ACCES_TEST (Cloudflare > Pages > Paramètres > Variables).
// Sans cette variable, l'accès test est désactivé.
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function egal(a, b) {
  // comparaison à temps constant (on compare les empreintes)
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

export async function onRequestPost({ request, env }) {
  const secret = env.ACCES_TEST || '';
  if (secret.length < 8) return json({ ok: false }, 403);
  let code = '';
  try { code = String((await request.json()).code || ''); } catch (e) { return json({ ok: false }, 400); }
  await new Promise((r) => setTimeout(r, 400)); // freine les essais en série
  return (await egal(code, secret)) ? json({ ok: true }) : json({ ok: false }, 403);
}
