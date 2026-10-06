export function initMaterialsStack(root: HTMLElement, signal: AbortSignal) {
  const section = root.querySelector<HTMLElement>('[data-materials-stack]');
  const stage = section?.querySelector<HTMLElement>('[data-materials-scroll]');
  const items = stage ? Array.from(stage.querySelectorAll<HTMLElement>('[data-material-item]')) : [];
  const count = section?.querySelector<HTMLElement>('[data-material-count]');
  const progress = section?.querySelector<HTMLElement>('.materials-progress');
  if (!section || !stage || !items.length) return;
  const cards = items
    .map((item) => item.querySelector<HTMLElement>('.material-card'))
    .filter((card): card is HTMLElement => Boolean(card));
  const total = Math.max(cards.length, 1);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let current = 0;
  let target = 0;
  let lastTime = 0;

  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const metrics = () => {
    const top = stage.getBoundingClientRect().top + scrollY;
    const travel = Math.max(1, stage.offsetHeight - innerHeight + 76);
    return { top, travel };
  };
  const paint = (value: number) => {
    cards.forEach((card, index) => {
      const start = index / total;
      const scaleTo = 1 - (total - index) * 0.03;
      const cardProgress = clamp((value - start) / Math.max(0.001, 1 - start));
      const scale = 1 + (scaleTo - 1) * cardProgress;
      card.style.setProperty('--card-top', `${5 + index * 3}%`);
      card.style.setProperty('--card-scale', String(scale));
      card.style.zIndex = String(index + 1);
    });
    const selected = Math.min(total - 1, Math.max(0, Math.floor(value * total)));
    if (count) count.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    stage.classList.toggle('is-moving', value > 0.035);
    stage.classList.toggle('is-finished', value > 0.94);
    section.style.setProperty('--materials-progress', String(value));
    progress?.style.setProperty('--materials-progress', String(value));
  };
  const render = (time: number) => {
    frame = 0;
    const dt = Math.min(64, Math.max(1, time - (lastTime || time - 16)));
    lastTime = time;
    current += (target - current) * (1 - Math.exp(-dt / (reduced.matches ? 1 : 170)));
    if (Math.abs(target - current) < 0.001) current = target;
    paint(current);
    if (current !== target) frame = requestAnimationFrame(render);
  };
  const schedule = () => {
    const { top, travel } = metrics();
    target = clamp((scrollY - top + innerHeight * 0.35) / travel);
    if (!frame) frame = requestAnimationFrame(render);
  };
  const configure = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    const { top, travel } = metrics();
    current = target = clamp((scrollY - top + innerHeight * 0.35) / travel);
    paint(current);
  };
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', configure, { passive: true, signal });
  reduced.addEventListener('change', configure, { signal });
  signal.addEventListener('abort', () => cancelAnimationFrame(frame), { once: true });
  document.fonts.ready.then(() => {
    if (!signal.aborted) configure();
  });
  configure();
}
