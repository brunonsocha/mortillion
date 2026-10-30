// Client for the `game` Edge Function.

import { api, sessionToken } from './session.ts';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

/** Calls an action on the game server, creating an anonymous session if needed. */
export async function callGame<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const token = await sessionToken();
    const res = await api('/functions/v1/game', { method: 'POST', body: JSON.stringify({ action, ...body }) }, token);
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data as T;
    // A revoked or expired session: start a fresh one once.
    if (res.status === 401 && attempt === 0) {
      localStorage.removeItem('mortillion:auth');
      continue;
    }
    throw new ApiError(res.status, data.error ?? 'server_error');
  }
}
