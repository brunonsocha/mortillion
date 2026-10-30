/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ACCOUNTS_MOCK?: string;
  readonly VITE_FREE_RUNS?: string;
  readonly VITE_AUTH_GOOGLE?: string;
  readonly VITE_PRICE_PLN?: string;
  readonly VITE_PRICE_EUR?: string;
  readonly VITE_PURCHASE?: string;
}
