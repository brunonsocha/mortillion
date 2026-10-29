# Accounts & the Covenant subscription

Mortillion stays a static site. Accounts and payments are handled by **Supabase**
(auth, a `profiles` table, three Edge Functions) and **Stripe** (Checkout,
Customer Portal, webhooks). The browser talks to Supabase with plain `fetch`, so the
bundle carries no SDK.

With no keys configured the game ships exactly as before: unlimited and free, with no
account UI.

## The rule

| Player | Daily Descent | Themes / Endless / Summon Signs / Archive |
|---|---|---|
| Anyone | always free | 3 free runs per local day |
| Signed in (`VITE_GATE=login`) | free | unlimited |
| Covenant member (`VITE_GATE=subscription`, default) | free | unlimited |

A run is spent when it starts. Reloading mid-run starts a new run.
- **Quota exhausted:** the "The embers are spent" modal appears. It offers sign-in (magic link,
  plus Google if enabled), then **Join the Covenant** (Stripe Checkout).
- **Settings:** shows the account, Covenant status with renewal date, runs left, Manage
  subscription (Stripe portal), and Sign out.

## Flow

```
browser ──magic link / Google──▶ Supabase Auth ──redirect #access_token──▶ browser
browser ──GET /rest/v1/profiles (RLS: own row)──▶ subscription_status
browser ──POST /functions/v1/create-checkout──▶ Stripe Checkout ──▶ ?checkout=success
Stripe ──webhook──▶ /functions/v1/stripe-webhook ──service role──▶ profiles.subscription_status
browser ──POST /functions/v1/customer-portal──▶ Stripe Billing Portal
```

## Files

| Path | What |
|---|---|
| `src/account/config.ts` | env flags: keys, gate mode, free runs, Google, mock |
| `src/account/session.ts` | tokens from the URL hash, refresh, profile, magic link, Google, checkout, portal |
| `src/account/gate.ts` | per-day quota in localStorage |
| `src/ui/account.ts` | paywall, sign-in, Settings section |
| `supabase/migrations/0001_profiles.sql` | `profiles` table, RLS (read own row), new-user trigger |
| `supabase/functions/create-checkout` | creates a Stripe customer if needed and returns a Checkout URL |
| `supabase/functions/customer-portal` | returns a Billing Portal URL |
| `supabase/functions/stripe-webhook` | verifies the signature and mirrors subscription status and period end |

## Setup checklist

### 1. Supabase project
- Run `supabase/migrations/0001_profiles.sql`, either with `supabase db push` or in the SQL editor.
- **Authentication → URL configuration:** set *Site URL* to the game's URL and
  add it to *Redirect URLs*.
- **Authentication → Providers:** Email (magic link) is on by default. Optionally enable Google
  (needs a Google OAuth client id and secret) and set `VITE_AUTH_GOOGLE=1`.
- For real volumes, configure custom SMTP, because Supabase's built-in mailer is rate-limited.

### 2. Stripe
- Create a Product ("Covenant of the Abyss") with a recurring Price (e.g. monthly)
  and note the `price_…` id.
- Turn on the **Customer Portal** (Settings → Billing → Customer portal).
- Add a webhook endpoint
  `https://<project>.supabase.co/functions/v1/stripe-webhook` with these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

  Note its signing secret.

### 3. Edge Function secrets and deploy
```sh
supabase secrets set STRIPE_SECRET_KEY=sk_live_… STRIPE_PRICE_ID=price_… \
  STRIPE_WEBHOOK_SECRET=whsec_… SITE_URL=https://your-domain
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook --no-verify-jwt
```
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to functions automatically.)

### 4. Build the site
Copy `.env.example` to `.env`, fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(public values), pick `VITE_GATE`, then run `npm run build`.

## Keys needed

| Key | Where it goes | Secret? |
|---|---|---|
| Supabase project URL | `.env` → `VITE_SUPABASE_URL` | public |
| Supabase anon key | `.env` → `VITE_SUPABASE_ANON_KEY` | public (RLS protects data) |
| Stripe secret key `sk_…` | `supabase secrets` | **secret** |
| Stripe price id `price_…` | `supabase secrets` | not secret |
| Stripe webhook secret `whsec_…` | `supabase secrets` | **secret** |
| Site URL | `supabase secrets` → `SITE_URL` | not secret |
| Google OAuth client id/secret (optional) | Supabase dashboard | **secret** |

Never put the Stripe secret key, the webhook secret or the Supabase **service
role** key in `.env` or the browser bundle.

## Limits worth knowing

- **The quota is enforced in the browser.** Clearing site data resets it, and content
  packs are static files anyone can download. That is normal for a casual web game's soft
  paywall. To enforce it for real, serve the non-daily packs from an Edge Function that
  checks the subscription, and keep only the daily mix public.
- Implicit-flow tokens arrive in the URL hash. `session.ts` takes them before the
  hash router reads the hash, then restores `#/`.

## Testing without keys

`VITE_ACCOUNTS_MOCK=1 npm run dev` uses a fake backend: any email signs in instantly,
and "Join the Covenant" toggles membership. This mode tested the full paywall → sign-in → join →
unlimited flow in Playwright.
