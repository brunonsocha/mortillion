// Opens the Stripe Customer Portal: receipts, payment method, and (for a
// subscription) cancellation.
import { SITE_URL, cors, json, playerFrom } from '../_supabase.ts';
import { customerFor, stripe } from '../_stripe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await playerFrom(req);
  if (!user || user.is_anonymous) return json({ error: 'not signed in' }, 401);

  const session = await stripe.billingPortal.sessions.create({
    customer: await customerFor(user),
    return_url: `${SITE_URL}/#/`,
  });
  return json({ url: session.url });
});
