type Feedback = { button: HTMLButtonElement; data: Record<string, string> };

export function initResultsDiary(root: HTMLElement, signal: AbortSignal) {
  const section = root.querySelector<HTMLElement>('[data-results-diary]');
  const wallCandidate = section?.querySelector<HTMLElement>('.feedback-wall');
  const overlayCandidate = section?.querySelector<HTMLElement>('[data-feedback-overlay]');
  if (!section || !wallCandidate || !overlayCandidate) return;
  const wall = wallCandidate;
  const overlay = overlayCandidate;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 801px) and (min-height: 700px)');
  const progress = section.querySelector<HTMLElement>('.diary-progress');
  const count = overlay.querySelector<HTMLElement>('.overlay-index b');
  const close = overlay.querySelector<HTMLButtonElement>('[data-feedback-close]');
  const entries: Feedback[] = Array.from(wall.querySelectorAll<HTMLButtonElement>('[data-feedback-thumb]')).map(
    (button, index) => ({
      button,
      data: {
        index: `0${index + 1}`,
        route: button.dataset.route || '',
        score: button.dataset.score || '',
        quote: button.dataset.quote || '',
        name: button.dataset.name || '',
        note: button.dataset.note || '',
      },
    })
  );
  let active = -1;
  let frame = 0;
  let enabled = false;
  let target = 0;
  let current = 0;
  let lastTime = 0;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));

  function select(index: number) {
    active = Math.max(0, Math.min(entries.length - 1, index));
    const entry = entries[active];
    entries.forEach(({ button }, item) => button.classList.toggle('is-selected', item === active));
    const fields: Record<string, string> = {
      route: 'feedbackRoute',
      score: 'feedbackScore',
      quote: 'feedbackQuote',
      name: 'feedbackName',
      note: 'feedbackNote',
    };
    Object.entries(fields).forEach(([key, attribute]) => {
      const field = overlay.querySelector<HTMLElement>(`[data-${attribute}]`);
      if (field) field.textContent = entry.data[key];
    });
    if (count) count.textContent = entry.data.index;
  }
  function open(index: number) {
    select(index);
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function dismiss() {
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
  }
  function metrics() {
    const pin = section!.querySelector<HTMLElement>('.diary-pin')!;
    return {
      top: section!.getBoundingClientRect().top + scrollY - 88,
      travel: Math.max(1, section!.offsetHeight - pin.offsetHeight - 80),
    };
  }
  function render(time: number) {
    frame = 0;
    if (!enabled || signal.aborted) return;
    const { top, travel } = metrics();
    target = clamp((scrollY - top) / travel);
    const dt = Math.min(64, Math.max(1, time - (lastTime || time - 16)));
    lastTime = time;
    current += (target - current) * (1 - Math.exp(-dt / 300));
    if (Math.abs(target - current) < 0.001) current = target;
    section!.style.setProperty('--diary-progress', String(current));
    progress?.style.setProperty('--diary-progress', String(current));
    if (current !== target) frame = requestAnimationFrame(render);
  }
  function schedule() {
    if (!frame && enabled) frame = requestAnimationFrame(render);
  }
  function configure() {
    cancelAnimationFrame(frame);
    frame = 0;
    enabled = desktop.matches && !reduced.matches;
    section!.classList.toggle('is-diary-motion', enabled);
    if (enabled && wall.offsetHeight + 110 > innerHeight) {
      enabled = false;
      section!.classList.remove('is-diary-motion');
    }
    if (!enabled) {
      current = target = 0;
      section!.style.removeProperty('--diary-progress');
      dismiss();
    } else {
      const metricsNow = metrics();
      current = target = clamp((scrollY - metricsNow.top) / metricsNow.travel);
      schedule();
    }
  }
  entries.forEach(({ button }, index) => {
    button.addEventListener('mouseenter', () => open(index), { signal });
    button.addEventListener('focus', () => open(index), { signal });
    button.addEventListener('click', () => open(index), { signal });
  });
  close?.addEventListener('click', dismiss, { signal });
  overlay.addEventListener('mouseleave', dismiss, { signal });
  overlay.addEventListener(
    'click',
    (event) => {
      if (event.target === overlay) dismiss();
    },
    { signal }
  );
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', configure, { passive: true, signal });
  reduced.addEventListener('change', configure, { signal });
  desktop.addEventListener('change', configure, { signal });
  document.fonts.ready.then(() => {
    if (!signal.aborted) configure();
  });
  signal.addEventListener(
    'abort',
    () => {
      cancelAnimationFrame(frame);
      dismiss();
    },
    { once: true }
  );
  select(0);
  configure();
}
