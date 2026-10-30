// Supabase helpers shared by the Edge Functions (Deno).
import { createClient, type User } from 'npm:@supabase/supabase-js@2.49.4';

export const SITE_URL = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');

/** Service-role client: bypasses RLS, server-side only. */
export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

export const cors = {
  'Access-Control-Allow-Origin': SITE_URL || '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** The player making the request (anonymous or signed in), from their JWT. */
export async function playerFrom(req: Request): Promise<User | null> {
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!jwt) return null;
  const { data } = await admin.auth.getUser(jwt);
  return data.user ?? null;
}

/** Whether the player has paid: a lifetime purchase or a live subscription. */
export async function hasFullAccess(userId: string): Promise<boolean> {
  const { data } = await admin.from('profiles').select('full_access, subscription_status').eq('id', userId).single();
  return !!data && (data.full_access || data.subscription_status === 'active' || data.subscription_status === 'trialing');
}
