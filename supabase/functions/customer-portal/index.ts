// Opens the Stripe Customer Portal so a player can cancel or change payment.
import { SITE_URL, cors, customerFor, json, playerFrom, stripe } from '../_shared.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await playerFrom(req);
  if (!user) return json({ error: 'not signed in' }, 401);

  const session = await stripe.billingPortal.sessions.create({
    customer: await customerFor(user),
    return_url: `${SITE_URL}/#/`,
  });
  return json({ url: session.url });
});
