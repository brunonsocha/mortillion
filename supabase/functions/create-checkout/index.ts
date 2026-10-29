// Starts a Stripe Checkout session for the Covenant subscription.
import { SITE_URL, cors, customerFor, json, playerFrom, stripe } from '../_shared.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await playerFrom(req);
  if (!user) return json({ error: 'not signed in' }, 401);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: await customerFor(user),
    client_reference_id: user.id,
    line_items: [{ price: Deno.env.get('STRIPE_PRICE_ID')!, quantity: 1 }],
    allow_promotion_codes: true,
    // Redirects come from server config, never from the request.
    success_url: `${SITE_URL}/?checkout=success#/`,
    cancel_url: `${SITE_URL}/#/`,
  });
  return json({ url: session.url });
});
