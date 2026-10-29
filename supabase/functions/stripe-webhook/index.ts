// Receives Stripe events and mirrors the subscription state into `profiles`.
// Deploy with --no-verify-jwt: Stripe authenticates with its signature instead.
import Stripe from 'npm:stripe@17.7.0';
import { admin, stripe } from '../_shared.ts';

const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const crypto = Stripe.createSubtleCryptoProvider();

async function mirror(sub: Stripe.Subscription) {
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  // Newer API versions moved the period end onto subscription items.
  const end = (sub as unknown as { current_period_end?: number }).current_period_end ?? sub.items.data[0]?.current_period_end;
  await admin
    .from('profiles')
    .update({
      subscription_status: sub.status,
      current_period_end: end ? new Date(end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer);
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('missing signature', { status: 400 });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret, undefined, crypto);
  } catch {
    return new Response('bad signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      // Link the customer to the player in case the profile missed it.
      const s = event.data.object;
      if (s.client_reference_id && s.customer) {
        await admin.from('profiles').update({ stripe_customer_id: String(s.customer) }).eq('id', s.client_reference_id);
      }
      if (s.subscription) await mirror(await stripe.subscriptions.retrieve(String(s.subscription)));
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await mirror(event.data.object);
      break;
  }
  return new Response('ok');
});
