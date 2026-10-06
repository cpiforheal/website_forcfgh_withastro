// Fixed-width glyphs keep Chinese headlines stable while the visual copy decrypts.
export function initHeroText(root: HTMLElement, signal: AbortSignal) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-encrypted-text]'));
  const glyphs = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  let timer = 0;
  let started = false;
  let tick = 0;
  let offset = 0;
  const cells = targets.flatMap((target) => {
    const original = target.dataset.encryptedText || '';
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    const accessible = document.createElement('span');
    accessible.className = 'hero-text-accessible';
    accessible.textContent = original;
    const result = Array.from(original).map((character) => {
      const cell = document.createElement('span');
      cell.className = 'cipher-glyph';
      cell.textContent = character;
      visual.append(cell);
      const animated = !/[\s，。！？、]/u.test(character);
      const order = animated ? offset++ : -1;
      cell.style.setProperty('--glyph-delay', `${(order % 4) * -140}ms`);
      return { cell, character, order };
    });
    target.replaceChildren(accessible, visual);
    return result;
  });

  function finish() {
    window.clearInterval(timer);
    cells.forEach(({ cell, character }) => {
      cell.textContent = character;
      cell.classList.remove('is-scrambled');
    });
  }
  function start() {
    if (started || signal.aborted || preference.matches) return;
    started = true;
    const render = () => {
      const elapsed = tick++ * 140;
      cells.forEach(({ cell, character, order }) => {
        const revealed = order < 0 || elapsed >= 560 + order * 350;
        cell.classList.toggle('is-scrambled', !revealed);
        cell.textContent = revealed ? character : glyphs[Math.floor(Math.random() * glyphs.length)];
      });
      if (elapsed >= 560 + offset * 350) finish();
    };
    render();
    timer = window.setInterval(render, 140);
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) start();
    else if (started) finish();
  });
  const title = root.querySelector('.hero-slogan');
  if (title) observer.observe(title);
  preference.addEventListener(
    'change',
    () => {
      if (preference.matches) finish();
    },
    { signal }
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) finish();
    },
    { signal }
  );
  signal.addEventListener(
    'abort',
    () => {
      finish();
      observer.disconnect();
    },
    { once: true }
  );
}
