// Receives Stripe events and records what the player owns in `profiles`:
// a lifetime purchase sets full_access, a subscription mirrors its status.
// Deployed with verify_jwt = false: Stripe authenticates with its signature.
import Stripe from 'npm:stripe@17.7.0';
import { admin } from '../_supabase.ts';
import { stripe } from '../_stripe.ts';

const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const crypto = Stripe.createSubtleCryptoProvider();

const now = () => new Date().toISOString();

async function mirrorSubscription(sub: Stripe.Subscription) {
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  // Newer API versions moved the period end onto subscription items.
  type WithEnd = { current_period_end?: number };
  const end = (sub as unknown as WithEnd).current_period_end ?? (sub.items.data[0] as unknown as WithEnd | undefined)?.current_period_end;
  await admin
    .from('profiles')
    .update({ subscription_status: sub.status, current_period_end: end ? new Date(end * 1000).toISOString() : null, updated_at: now() })
    .eq('stripe_customer_id', customer);
}

async function grantPurchase(s: Stripe.Checkout.Session) {
  const userId = s.client_reference_id ?? s.metadata?.user_id;
  if (!userId) return;
  await admin
    .from('profiles')
    .update({
      full_access: true,
      purchased_at: now(),
      purchase_currency: s.currency,
      ...(s.customer ? { stripe_customer_id: String(s.customer) } : {}),
      updated_at: now(),
    })
    .eq('id', userId);
}

export async function handle(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const s = event.data.object;
      if (s.mode === 'payment' && s.payment_status === 'paid') await grantPurchase(s);
      if (s.mode === 'subscription' && s.subscription) {
        if (s.client_reference_id && s.customer) {
          await admin.from('profiles').update({ stripe_customer_id: String(s.customer) }).eq('id', s.client_reference_id);
        }
        await mirrorSubscription(await stripe.subscriptions.retrieve(String(s.subscription)));
      }
      break;
    }
    case 'charge.refunded': {
      // A fully refunded lifetime purchase loses its access.
      const c = event.data.object;
      if (c.refunded && c.customer) {
        await admin.from('profiles').update({ full_access: false, updated_at: now() }).eq('stripe_customer_id', String(c.customer));
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await mirrorSubscription(event.data.object);
      break;
  }
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
  await handle(event);
  return new Response('ok');
});
