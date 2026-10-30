# Accounts, the game server and payments

Mortillion has two build modes.

| | Local build (no keys) | Remote build (Supabase keys set) |
|---|---|---|
| Content | bundled in the browser | **only on the server** (not one answer ships) |
| Judging answers | browser | `game` Edge Function |
| Quota, timer, one daily per day | browser (soft) | **server (enforced)** |
| Accounts | none | anonymous for everyone; Google or email sign-in |
| Leaderboards, achievements | none | yes (signed-in players) |
| Offline | yes | needs a connection |

The mode is chosen at build time: setting `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` produces a remote build. `vite.config.ts` then swaps the
bundled packs for an empty module, so the answer banks never reach the browser.

## Rules

- **Daily Descent:** free for everyone, one per player per day. It's a unique index in the database,
  and restarting resumes the same run.
- **Themes, Endless Abyss, Summon Signs, Archive:** 3 free runs per UTC day
  (`FREE_RUNS_PER_DAY` on the server), then the paywall.
- **Paying requires a real account** (Google or email), so the purchase persists on every
  device. Anonymous players are asked to sign in first.
- **Full access** is stored on the account (`profiles.full_access`) and never expires.
  If the Stripe Price is recurring instead, an active subscription grants the same access.
- **Achievements** (16) and **leaderboards** (daily per day, plus Endless best) are for
  signed-in players only. Runs played while anonymous count once you sign in, because linking
  keeps the same account.
- **Timer:** the server starts the clock when it serves a prompt. Answers later than 25 s plus 3 s
  grace score 0.

## Flow

```
first visit ─▶ POST /auth/v1/signup (anonymous) ─▶ JWT ─▶ game server
game server: start ▶ prompt (clock starts) ▶ answer (judged) … ▶ finish (achievements)

sign in, anonymous player:
  Google ─▶ /auth/v1/user/identities/authorize (links Google to the same account)
  email  ─▶ PUT /auth/v1/user {email} ─▶ confirmation mail ─▶ same account, now permanent
  (if that Google/email already has an account, it signs into that one instead)

purchase ─▶ create-checkout (PLN or EUR) ─▶ Stripe Checkout ─▶ webhook ─▶ profiles.full_access
```

## Files

| Path | What |
|---|---|
| `supabase/functions/game` | authoritative game server: start, prompt, answer, state, stats, leaderboard, profile, catalog |
| `supabase/functions/create-checkout` | Checkout for the full version (one-time or subscription, from the Price) |
| `supabase/functions/customer-portal` | Stripe portal: receipts, payment method, cancellation |
| `supabase/functions/stripe-webhook` | grants or revokes access (paid, async paid, refund, subscription events) |
| `supabase/functions/_game` | generated copy of engine, packs and achievements (`npm run functions:sync`) |
| `supabase/migrations/0001–0003` | profiles, runs, turns, achievements, RLS, unique names |
| `supabase/config.toml` | local stack: anonymous sign-ins, identity linking, email confirmations |
| `src/account/*` | session (anonymous + linking), API client, config, quota mirror |
| `src/play/source.ts` | local and remote run sources behind one interface |
| `src/ui/account.ts`, `src/ui/leaderboard.ts` | paywall, sign-in, settings, leaderboard, achievements |
| `scripts/server.test.ts` | 10 integration tests against a local Supabase (`npm run test:server`) |

## Running it locally (no keys needed)

```sh
npx supabase start                       # Docker; first run downloads images
npm run functions:sync
npx supabase functions serve --env-file supabase/functions/.env
npm run test:server                      # 10 server tests
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`> \
  VITE_AUTH_GOOGLE=0 npm run dev
```

Confirmation emails land in Mailpit at http://127.0.0.1:54324.
`supabase/functions/.env` (git-ignored) holds local placeholder secrets.

## Production setup

1. **Supabase project**
   - Run `npx supabase link --project-ref <ref>`, then `npx supabase db push` to apply the migrations.
   - Authentication → Sign In / Providers: enable **Anonymous sign-ins**, **Manual
     linking**, Email (with confirmations) and **Google** (OAuth client id and secret from Google
     Cloud, with the redirect `https://<ref>.supabase.co/auth/v1/callback`).
   - Authentication → URL configuration: set the Site URL and Redirect URLs to the game's domain.
   - Set up custom SMTP for real email volume. Optionally enable CAPTCHA (Turnstile) to rate-limit
     anonymous sign-ups.
2. **Stripe**
   - Create Product "Mortillion: full version" with a one-time Price of **19.99 PLN**,
     plus a **currency option of 5.00 EUR** on the same Price.
   - Payment methods: enable **BLIK** and **Przelewy24** for Polish players (one-time payments
     only), and cards.
   - Turn on the Customer Portal.
   - Add a webhook endpoint `https://<ref>.supabase.co/functions/v1/stripe-webhook` with these events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `charge.refunded`
     - `customer.subscription.created`, `.updated`, `.deleted`
3. **Secrets and deploy**
   ```sh
   npx supabase secrets set STRIPE_SECRET_KEY=sk_live_… STRIPE_PRICE_ID=price_… \
     STRIPE_WEBHOOK_SECRET=whsec_… SITE_URL=https://your-domain FREE_RUNS_PER_DAY=3
   npm run functions:sync
   npx supabase functions deploy game
   npx supabase functions deploy create-checkout
   npx supabase functions deploy customer-portal
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. **Site build**
   - In `.env`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then run `npm run build`
     and deploy `dist/`.
   - Optional: `VITE_PRICE_PLN` and `VITE_PRICE_EUR` (button labels), and
     `VITE_PURCHASE=subscription` if the Price is recurring.

Never put the Stripe secret key, the webhook secret or the Supabase service-role key in
`.env` or in the browser bundle.
