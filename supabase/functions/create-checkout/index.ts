// Starts Stripe Checkout for the full version. Requires a real (non-anonymous)
// account so the purchase is tied to something that persists across devices.
//
// The Stripe Price decides the mode: a one-time price sells a lifetime "full
// version", a recurring price sells a subscription. One Price carries both
// currencies (PLN base + EUR currency option); the player picks which.
import { SITE_URL, cors, json, playerFrom } from '../_supabase.ts';
import { customerFor, stripe } from '../_stripe.ts';

const CURRENCIES = ['pln', 'eur'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await playerFrom(req);
  if (!user) return json({ error: 'not signed in' }, 401);
  if (user.is_anonymous) return json({ error: 'sign_in_required' }, 403);

  const body = await req.json().catch(() => ({}));
  const currency = CURRENCIES.includes(body.currency) ? body.currency : 'pln';
  const price = await stripe.prices.retrieve(Deno.env.get('STRIPE_PRICE_ID')!);
  const recurring = price.type === 'recurring';

  const session = await stripe.checkout.sessions.create({
    mode: recurring ? 'subscription' : 'payment',
    customer: await customerFor(user),
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    line_items: [{ price: price.id, quantity: 1 }],
    // Only pass a currency the Price actually supports.
    ...(currency === price.currency || price.currency_options?.[currency] ? { currency } : {}),
    allow_promotion_codes: true,
    ...(recurring ? {} : { invoice_creation: { enabled: true } }),
    // Redirects come from server config, never from the request.
    success_url: `${SITE_URL}/?checkout=success#/`,
    cancel_url: `${SITE_URL}/#/`,
  });
  return json({ url: session.url });
});
