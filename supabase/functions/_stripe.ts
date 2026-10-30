// Stripe helpers shared by the payment Edge Functions (Deno).
import Stripe from 'npm:stripe@17.7.0';
import { admin } from './_supabase.ts';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { httpClient: Stripe.createFetchHttpClient() });

/** The player's Stripe customer id, creating the customer on first use. */
export async function customerFor(user: { id: string; email?: string }): Promise<string> {
  const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;
  const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
  await admin.from('profiles').update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() }).eq('id', user.id);
  return customer.id;
}
