type Child = Node | string | number | null | undefined | false | Child[];
type Props = Record<string, unknown> & { class?: string };

/** Minimal hyperscript: h('div', { class: 'x', onclick }, 'text', child). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v as Record<string, string>)) {
        if (prop.startsWith('--')) el.style.setProperty(prop, val);
        else (el.style as unknown as Record<string, string>)[prop] = val;
      }
    }
    else if (k in el && k !== 'list' && typeof v !== 'string') (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

function append(el: Node, children: Child[]) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function fmt(n: number, lang: string): string {
  return n.toLocaleString(lang === 'uk' ? 'uk-UA' : lang === 'pl' ? 'pl-PL' : 'en-GB');
}

/** Animates a number inside `el` from `from` to `to`. */
export function countUp(el: HTMLElement, from: number, to: number, ms: number, format: (n: number) => string) {
  const start = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = format(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
