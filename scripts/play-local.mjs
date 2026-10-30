// One command to play the full online version on this machine:
//   npm run play:local
// Starts the local Supabase stack (Docker), the game server functions and the
// Vite dev server wired to them, and makes sure a test account exists.
// Ctrl+C stops the dev and function servers (`npx supabase stop` stops Docker).

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const TEST_EMAIL = 'tester@mortillion.test';
const run = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });

function status() {
  try {
    const env = run('npx supabase status -o env');
    return { url: env.match(/^API_URL="(.+)"$/m)?.[1], anon: env.match(/^ANON_KEY="(.+)"$/m)?.[1], service: env.match(/^SERVICE_ROLE_KEY="(.+)"$/m)?.[1] };
  } catch {
    return null;
  }
}

let st = status();
if (!st?.url) {
  console.log('▸ Starting local Supabase (first run downloads Docker images)…');
  execSync('npx supabase start -x studio,imgproxy,realtime,storage-api,logflare,vector,supavisor,postgres-meta', { stdio: 'inherit' });
  st = status();
}

// Local placeholder secrets; SITE_URL must match the dev server for CORS.
const envFile = 'supabase/functions/.env';
const env = existsSync(envFile) ? readFileSync(envFile, 'utf8') : 'STRIPE_SECRET_KEY=sk_test_placeholder\nSTRIPE_PRICE_ID=price_placeholder\nSTRIPE_WEBHOOK_SECRET=whsec_localtestsecret\nFREE_RUNS_PER_DAY=3\n';
writeFileSync(envFile, `SITE_URL=http://localhost:5173\n${env.replace(/^SITE_URL=.*\n?/m, '')}`);
execSync('node scripts/sync-functions.mjs', { stdio: 'inherit' });

// A ready-made test account with an active Covenant (no Stripe needed).
const admin = { apikey: st.service, Authorization: `Bearer ${st.service}`, 'Content-Type': 'application/json' };
const list = await (await fetch(`${st.url}/auth/v1/admin/users?per_page=1000`, { headers: admin })).json();
let user = list.users?.find((u) => u.email === TEST_EMAIL);
if (!user) {
  user = await (await fetch(`${st.url}/auth/v1/admin/users`, { method: 'POST', headers: admin, body: JSON.stringify({ email: TEST_EMAIL, email_confirm: true }) })).json();
}
await fetch(`${st.url}/rest/v1/profiles?id=eq.${user.id}`, {
  method: 'PATCH',
  headers: admin,
  body: JSON.stringify({
    display_name: 'Tester of Astora',
    subscription_status: 'active',
    current_period_end: new Date(Date.now() + 30 * 864e5).toISOString(),
  }),
});

const children = [
  spawn('npx', ['supabase', 'functions', 'serve', '--env-file', 'supabase/functions/.env'], { stdio: 'ignore' }),
  spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_SUPABASE_URL: st.url, VITE_SUPABASE_ANON_KEY: st.anon, VITE_AUTH_GOOGLE: '0' },
  }),
];
const stop = () => {
  for (const c of children) c.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

console.log(`
  Mortillion (full online version) → http://localhost:5173
  Test account: ${TEST_EMAIL}  (Covenant active, name "Tester of Astora")
    1. Settings ⚙ → Sign in → enter the email → "Send magic link"
    2. Open the mail at http://127.0.0.1:54324 and click the link
  Or just play anonymously: 3 free runs, then the paywall.
`);
