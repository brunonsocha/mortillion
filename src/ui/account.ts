// Sign-in, the paywall and the account section of Settings. Inert unless
// accounts are configured.

import { ApiError, callGame } from '../account/api.ts';
import { ACCOUNTS_ENABLED, FREE_RUNS_PER_DAY, GOOGLE_ENABLED, PRICE_LABEL, PURCHASE, REMOTE } from '../account/config.ts';
import { canStartRun, freeRunsLeft, spendRun, unlimited } from '../account/gate.ts';
import {
  authNotice, currentAccount, openPortal, sendMagicLink, setDisplayName, signInWithGoogle, signOut, signedIn, startCheckout, type Currency,
} from '../account/session.ts';
import { sfx } from '../render/sfx.ts';
import { app, modal } from './app.ts';
import { h } from './dom.ts';
import { say } from './maiden.ts';

/**
 * Local and mock builds only: spends a free run and returns true, or shows
 * the paywall and returns false. With the game server, the server decides.
 */
export function gateRun(): boolean {
  if (canStartRun()) {
    spendRun();
    return true;
  }
  setTimeout(showPaywall, 60);
  return false;
}

/** "2/3 free journeys left", or null when play is unlimited. */
export function quotaLabel(): string | null {
  if (unlimited()) return null;
  return app.t.freeLeft.replace('{n}', String(freeRunsLeft())).replace('{max}', String(FREE_RUNS_PER_DAY));
}

function closeModals() {
  document.querySelectorAll('.modal').forEach((m) => m.remove());
}

function signInForm(): HTMLElement {
  const t = app.t;
  const input = h('input', { class: 'answer', type: 'email', required: true, autocomplete: 'email', placeholder: t.emailPlaceholder, 'aria-label': t.emailPlaceholder });
  const status = h('p', { class: 'note', role: 'status' });
  const send = h('button', { class: 'btn', type: 'submit' }, t.sendLink);
  const form = h('form', { class: 'signin' }, input, send, status);
  form.onsubmit = async (e) => {
    e.preventDefault();
    send.disabled = true;
    try {
      await sendMagicLink(input.value.trim());
      if (signedIn()) closeModals();
      else status.textContent = t.linkSent;
    } catch {
      status.textContent = t.loadFailed;
      send.disabled = false;
    }
  };
  return h(
    'div',
    { class: 'signin-wrap' },
    GOOGLE_ENABLED ? h('button', { class: 'btn primary google', type: 'button', onclick: () => void signInWithGoogle() }, t.google) : null,
    h('p', { class: 'or' }, t.orEmail),
    form,
  );
}

export function showSignIn() {
  modal(app.t.signIn, h('div', { class: 'account' }, h('p', { class: 'note' }, app.t.signInBody), signInForm()));
}

/** Two buttons, one per currency; the player's language picks the first. */
function buyButtons(): HTMLElement {
  const t = app.t;
  const order: Currency[] = app.lang === 'pl' ? ['pln', 'eur'] : ['eur', 'pln'];
  const status = h('p', { class: 'note', role: 'status' });
  const buttons = order.map((c, i) => {
    const price = PURCHASE === 'subscription' ? `${PRICE_LABEL[c]} ${t.perMonth}` : PRICE_LABEL[c];
    const b = h('button', { class: `btn ${i === 0 ? 'primary' : ''}` }, `${PURCHASE === 'subscription' ? t.joinCovenant : t.buyFull} · ${price}`);
    b.onclick = async () => {
      sfx.click();
      b.disabled = true;
      try {
        await startCheckout(c);
        if (unlimited()) closeModals();
      } catch {
        status.textContent = t.loadFailed;
        b.disabled = false;
      }
    };
    return b;
  });
  return h('div', { class: 'buy' }, buttons, status);
}

/** "5 h 12 min" until a moment, in the player's language. */
function untilLabel(at: number): string {
  const mins = Math.max(1, Math.ceil((at - Date.now()) / 60000));
  const hrs = Math.floor(mins / 60);
  return hrs ? `${hrs} ${app.t.hoursShort} ${mins % 60} ${app.t.minutesShort}` : `${mins} ${app.t.minutesShort}`;
}

export function showPaywall(resetAt?: string) {
  const t = app.t;
  say('paywall');
  const back = resetAt ? Date.parse(resetAt) : NaN;
  const returns = Number.isFinite(back) ? h('p', { class: 'note' }, t.embersReturn.replace('{time}', untilLabel(back))) : null;
  if (returns) {
    const id = setInterval(() => (document.body.contains(returns) ? (returns.textContent = t.embersReturn.replace('{time}', untilLabel(back))) : clearInterval(id)), 30000);
  }
  modal(
    t.embersSpent,
    h(
      'div',
      { class: 'account' },
      h('p', null, t.embersBody.replace('{n}', String(FREE_RUNS_PER_DAY))),
      returns,
      h('p', { class: 'note' }, t.dailyStillFree),
      h('p', { class: 'covenant' }, PURCHASE === 'subscription' ? t.covenantPitchSub : t.covenantPitch),
      // Paying needs a real account so the purchase persists on any device.
      signedIn() ? buyButtons() : [h('p', { class: 'note' }, t.signInToBuy), signInForm()],
    ),
  );
}

function nameEditor(): HTMLElement {
  const t = app.t;
  const a = currentAccount()!;
  const input = h('input', { class: 'answer', maxlength: 24, value: a.displayName ?? '', placeholder: t.displayNamePh, 'aria-label': t.displayName });
  const status = h('span', { class: 'note', role: 'status' });
  const form = h('form', { class: 'name-row' }, input, h('button', { class: 'btn small', type: 'submit' }, t.save), status);
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await callGame<{ displayName: string }>('profile', { displayName: input.value });
      setDisplayName(r.displayName);
      status.textContent = '✓';
    } catch (err) {
      status.textContent = err instanceof ApiError && err.code === 'bad_name' ? t.badName : err instanceof ApiError && err.code === 'name_taken' ? t.nameTaken : t.loadFailed;
    }
  };
  return h('label', { class: 'name-field' }, h('span', null, t.displayName), form);
}

/** The account block inside Settings. */
export function accountSection(): HTMLElement | null {
  if (!ACCOUNTS_ENABLED) return null;
  const t = app.t;
  const a = currentAccount();
  const quota = quotaLabel();
  if (!signedIn()) {
    return h(
      'div',
      { class: 'account-box' },
      h('h3', null, t.account),
      authNotice ? h('p', { class: 'note warn' }, authNotice) : null,
      h('p', { class: 'note' }, t.signInPerks),
      quota ? h('p', { class: 'note' }, quota) : null,
      h('button', { class: 'btn small primary', onclick: () => (closeModals(), showSignIn()) }, t.signIn),
    );
  }
  const until = a!.periodEnd ? new Date(a!.periodEnd).toLocaleDateString(app.lang) : '';
  return h(
    'div',
    { class: 'account-box' },
    h('h3', null, t.account),
    h('p', null, t.signedInAs.replace('{email}', a!.email ?? '')),
    REMOTE ? nameEditor() : null,
    h(
      'p',
      { class: a!.fullAccess ? 'covenant' : 'note' },
      a!.fullAccess ? (until ? t.covenantActive.replace('{date}', until) : t.fullOwned) : t.covenantNone,
    ),
    quota ? h('p', { class: 'note' }, quota) : null,
    a!.fullAccess ? null : buyButtons(),
    h(
      'div',
      { class: 'actions' },
      a!.fullAccess && REMOTE ? h('button', { class: 'btn small', onclick: () => void openPortal().catch(() => {}) }, t.manage) : null,
      h('button', { class: 'btn small ghost', onclick: () => void signOut().then(closeModals) }, t.signOut),
    ),
  );
}
