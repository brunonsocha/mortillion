// Sign-in, the "embers are spent" paywall and the account section of
// Settings. Everything here is inert unless accounts are configured.

import { ACCOUNTS_ENABLED, FREE_RUNS_PER_DAY, GATE, GOOGLE_ENABLED } from '../account/config.ts';
import { canStartRun, freeRunsLeft, spendRun, unlimited } from '../account/gate.ts';
import { currentAccount, openPortal, sendMagicLink, signInWithGoogle, signOut, startCheckout } from '../account/session.ts';
import { sfx } from '../render/sfx.ts';
import { app, modal } from './app.ts';
import { h } from './dom.ts';

/**
 * Call when a non-daily run is about to start. Spends a free run and returns
 * true, or shows the paywall and returns false.
 */
export function gateRun(): boolean {
  if (canStartRun()) {
    spendRun();
    return true;
  }
  setTimeout(showPaywall, 60);
  return false;
}

/** "2/3 free descents left today", or null when play is unlimited. */
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
  const send = h('button', { class: 'btn primary', type: 'submit' }, t.sendLink);
  const form = h('form', { class: 'signin' }, input, send, status);
  form.onsubmit = async (e) => {
    e.preventDefault();
    send.disabled = true;
    try {
      await sendMagicLink(input.value.trim());
      status.textContent = currentAccount() ? '' : t.linkSent;
      if (currentAccount()) closeModals();
    } catch {
      status.textContent = t.loadFailed;
      send.disabled = false;
    }
  };
  return h(
    'div',
    { class: 'signin-wrap' },
    form,
    GOOGLE_ENABLED ? h('button', { class: 'btn', type: 'button', onclick: () => signInWithGoogle() }, t.google) : null,
  );
}

export function showSignIn() {
  modal(app.t.signIn, h('div', { class: 'account' }, h('p', { class: 'note' }, app.t.signInBody), signInForm()));
}

export function showPaywall() {
  const t = app.t;
  const a = currentAccount();
  const join = h('button', { class: 'btn primary' }, t.joinCovenant);
  join.onclick = async () => {
    sfx.click();
    join.disabled = true;
    try {
      await startCheckout();
      if (unlimited()) closeModals();
    } catch {
      join.disabled = false;
    }
  };
  modal(
    t.embersSpent,
    h(
      'div',
      { class: 'account' },
      h('p', null, t.embersBody.replace('{n}', String(FREE_RUNS_PER_DAY))),
      h('p', { class: 'note' }, t.dailyStillFree),
      h('p', { class: 'covenant' }, t.covenantPitch),
      // Sign-in comes first; with the 'login' gate it is all that's needed.
      !a ? signInForm() : GATE === 'subscription' ? join : null,
    ),
  );
}

/** The account block inside Settings. */
export function accountSection(): HTMLElement | null {
  if (!ACCOUNTS_ENABLED) return null;
  const t = app.t;
  const a = currentAccount();
  const quota = quotaLabel();
  if (!a) {
    return h(
      'div',
      { class: 'account-box' },
      h('h3', null, t.account),
      quota ? h('p', { class: 'note' }, quota) : null,
      h('button', { class: 'btn small', onclick: () => (closeModals(), showSignIn()) }, t.signIn),
    );
  }
  const until = a.periodEnd ? new Date(a.periodEnd).toLocaleDateString(app.lang) : '';
  return h(
    'div',
    { class: 'account-box' },
    h('h3', null, t.account),
    h('p', null, t.signedInAs.replace('{email}', a.email)),
    h('p', { class: a.subscribed ? 'covenant' : 'note' }, a.subscribed ? t.covenantActive.replace('{date}', until) : t.covenantNone),
    quota ? h('p', { class: 'note' }, quota) : null,
    h(
      'div',
      { class: 'actions' },
      a.subscribed
        ? h('button', { class: 'btn small', onclick: () => void openPortal().catch(() => {}) }, t.manage)
        : GATE === 'subscription'
          ? h('button', { class: 'btn small primary', onclick: () => void startCheckout().then(closeModals, () => {}) }, t.joinCovenant)
          : null,
      h('button', { class: 'btn small ghost', onclick: () => void signOut().then(closeModals) }, t.signOut),
    ),
  );
}
