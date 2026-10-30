import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  // With the game server configured, the answer banks must never reach the
  // browser: swap the bundled packs for an empty module.
  const remote = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) && env.VITE_ACCOUNTS_MOCK !== '1';
  return {
    resolve: {
      alias: remote ? [{ find: './bundled.ts', replacement: fileURLToPath(new URL('./src/data/packs/none.ts', import.meta.url)) }] : [],
    },
  };
});
