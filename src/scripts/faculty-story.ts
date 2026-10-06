export function initFacultyStory(root: HTMLElement, signal: AbortSignal) {
  const section = root.querySelector<HTMLElement>('.faculty-story');
  const pin = section?.querySelector<HTMLElement>('.faculty-pin');
  if (!section || !pin) return;
  const story = section;
  const stage = pin;
  const panels = Array.from(story.querySelectorAll<HTMLElement>('.faculty-panel'));
  const nodes = Array.from(story.querySelectorAll<HTMLAnchorElement>('[data-faculty-node]'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px) and (min-height: 720px)');
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const smooth = (value: number) => value * value * (3 - 2 * value);
  let enabled = false;
  let frame = 0;
  let position = 0;
  let initialized = false;
  let lastTime = 0;

  function metrics() {
    const top = story.getBoundingClientRect().top + scrollY - 88;
    const travel = Math.max(1, story.offsetHeight - stage.offsetHeight - 80);
    return { top, travel };
  }
  function render(time: number) {
    frame = 0;
    if (!enabled || signal.aborted) return;
    const { top, travel } = metrics();
    // Half a unit at either end lets the first portrait enter and the last one dwell.
    const target = clamp((scrollY - top) / travel) * panels.length - 0.5;
    if (!initialized) {
      position = target;
      initialized = true;
    }
    const dt = Math.min(64, Math.max(1, time - (lastTime || time - 16)));
    lastTime = time;
    position += (target - position) * (1 - Math.exp(-dt / 240));
    if (Math.abs(target - position) < 0.001) position = target;
    const active = Math.max(0, Math.min(panels.length - 1, Math.round(position)));
    story.style.setProperty('--faculty-progress', String(clamp(position / (panels.length - 1))));
    panels.forEach((panel, index) => {
      const distance = position - index;
      const weight = smooth(clamp((0.85 - Math.abs(distance)) / 0.7));
      panel.style.setProperty('--teacher-opacity', String(weight));
      panel.style.setProperty('--teacher-y', `${(1 - weight) * (distance > 0 ? -32 : 48)}px`);
      panel.style.setProperty('--teacher-x', `${(index - 1) * (1 - weight) * 35}px`);
      panel.style.setProperty('--teacher-scale', String(0.96 + weight * 0.04));
      panel.style.setProperty('--bio-y', `${(1 - weight) * 25}px`);
      panel.inert = index !== active;
      panel.setAttribute('aria-hidden', String(index !== active));
      if (index === active) nodes[index].setAttribute('aria-current', 'step');
      else nodes[index].removeAttribute('aria-current');
    });
    if (position !== target) frame = requestAnimationFrame(render);
  }
  function schedule() {
    if (!frame && enabled) frame = requestAnimationFrame(render);
  }
  function configure() {
    cancelAnimationFrame(frame);
    frame = 0;
    enabled = desktop.matches && !reduced.matches;
    story.classList.toggle('is-faculty-motion', enabled);
    if (enabled && stage.offsetHeight + 105 > innerHeight) {
      enabled = false;
      story.classList.remove('is-faculty-motion');
    }
    initialized = false;
    lastTime = 0;
    if (!enabled) {
      panels.forEach((panel) => {
        panel.inert = false;
        panel.removeAttribute('aria-hidden');
      });
      nodes.forEach((node) => node.removeAttribute('aria-current'));
    }
    schedule();
  }
  nodes.forEach((node, index) =>
    node.addEventListener(
      'click',
      (event) => {
        if (!enabled) return; // Native anchors remain useful without motion or JS.
        event.preventDefault();
        const { top, travel } = metrics();
        window.scrollTo({ top: top + ((index + 0.5) / panels.length) * travel, behavior: 'smooth' });
      },
      { signal }
    )
  );
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', configure, { passive: true, signal });
  reduced.addEventListener('change', configure, { signal });
  desktop.addEventListener('change', configure, { signal });
  document.fonts.ready.then(() => {
    if (!signal.aborted) configure();
  });
  signal.addEventListener('abort', () => cancelAnimationFrame(frame), { once: true });
  configure();
}
