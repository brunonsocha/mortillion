// Shared helpers for the Edge Functions (Deno).
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

export const SITE_URL = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { httpClient: Stripe.createFetchHttpClient() });

/** Service-role client: bypasses RLS, server-side only. */
export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

export const cors = {
  'Access-Control-Allow-Origin': SITE_URL || '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** The signed-in player making the request, from their Supabase JWT. */
export async function playerFrom(req: Request) {
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!jwt) return null;
  const { data } = await admin.auth.getUser(jwt);
  return data.user ?? null;
}

/** The player's Stripe customer id, creating the customer on first use. */
export async function customerFor(user: { id: string; email?: string }): Promise<string> {
  const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;
  const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
  await admin.from('profiles').upsert({ id: user.id, email: user.email, stripe_customer_id: customer.id, updated_at: new Date().toISOString() });
  return customer.id;
}
