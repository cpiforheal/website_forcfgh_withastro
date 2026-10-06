import { initHeroText } from './hero-text';
import { initFacultyStory } from './faculty-story';
import { initResultsDiary } from './results-diary';
import { initMaterialsStack } from './materials-stack';

let dispose: (() => void) | undefined;

export function initStudyHome() {
  dispose?.();
  const root = document.querySelector<HTMLElement>('.study-home');
  if (!root) return;
  const home = root;
  const abort = new AbortController();
  const { signal } = abort;
  initHeroText(root, signal);
  initFacultyStory(root, signal);
  initResultsDiary(root, signal);
  initMaterialsStack(root, signal);
  const sequences = Array.from(root.querySelectorAll<HTMLElement>('.study-story:not([hidden])'));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 801px)');
  let frame = 0;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const easedProgress = new WeakMap<HTMLElement, number>();

  function setSequenceNote(sequence: HTMLElement, open: boolean) {
    const button = sequence.querySelector<HTMLButtonElement>('.word-note');
    const explanation = sequence.querySelector<HTMLElement>('#word-explanation');
    if (!button || !explanation) return;
    button.setAttribute('aria-expanded', String(open));
    explanation.hidden = !open;
  }

  function updateSequence(sequence: HTMLElement) {
    const sheet = sequence.querySelector<HTMLElement>('.study-sheet');
    const chapters = Array.from(sequence.querySelectorAll<HTMLElement>('.story-chapter'));
    const rail = sequence.querySelector<HTMLElement>('.story-rail');
    if (!sheet || !chapters.length || !rail) return;
    // Motion is a desktop reading gesture; narrow screens keep the full static document.
    const enabled = !motion.matches && desktop.matches;
    sequence.classList.toggle('is-motion', enabled);
    home.classList.toggle('is-motion', enabled);
    rail.style.position = enabled ? 'sticky' : 'static';
    if (!enabled) {
      chapters.forEach((chapter) => chapter.style.removeProperty('--chapter-opacity'));
      sequence.style.removeProperty('--intro-progress');
      return;
    }
    const top = sequence.getBoundingClientRect().top + scrollY;
    const targetProgress = clamp(scrollY / Math.max(1, top - 110));
    const previousProgress = easedProgress.get(sequence) ?? targetProgress;
    const intro = previousProgress + (targetProgress - previousProgress) * 0.14;
    easedProgress.set(sequence, intro);
    sequence.style.setProperty('--intro-progress', intro.toFixed(4));
    const activation = innerHeight * 0.57;
    let active = 0;
    chapters.forEach((chapter, index) => {
      const rect = chapter.getBoundingClientRect();
      if (rect.top <= activation) active = index;
      const distance = Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
      chapter.style.setProperty('--chapter-opacity', String(Math.max(0.4, 1 - (distance / innerHeight) * 0.6)));
    });
    sheet.dataset.step = String(active);
    sheet.style.setProperty('--highlight-width', active > 0 ? '100%' : '0%');
    const first = chapters[0].getBoundingClientRect().top;
    const last = chapters[chapters.length - 1].getBoundingClientRect().top;
    sequence.style.setProperty('--reading-progress', String(clamp((activation - first) / Math.max(1, last - first))));
    const label = sequence.querySelector<HTMLElement>('.position-name');
    const number = sequence.querySelector<HTMLElement>('.position-number');
    const labels = chapters.map(
      (chapter) => chapter.querySelector('.chapter-label')?.textContent?.split('/')[1]?.trim() || '阅读'
    );
    if (label) label.textContent = labels[active];
    if (number) number.textContent = `0${active + 1} / 0${chapters.length}`;
  }

  function update() {
    frame = 0;
    let settling = false;
    sequences.forEach((sequence) => {
      updateSequence(sequence);
      if (!sequence.classList.contains('is-motion')) return;
      const top = sequence.getBoundingClientRect().top + scrollY;
      const target = clamp(scrollY / Math.max(1, top - 110));
      const current = easedProgress.get(sequence) ?? target;
      if (Math.abs(target - current) > 0.002) settling = true;
    });
    if (settling) frame = requestAnimationFrame(update);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  sequences.forEach((sequence) => {
    let pinnedNote = false;
    const button = sequence.querySelector<HTMLButtonElement>('.word-note');
    button?.addEventListener(
      'click',
      () => {
        pinnedNote = !pinnedNote;
        setSequenceNote(sequence, pinnedNote);
        schedule();
      },
      { signal }
    );
    button?.addEventListener(
      'pointerenter',
      (event) => {
        if (event.pointerType === 'mouse') setSequenceNote(sequence, true);
      },
      { signal }
    );
    button?.addEventListener(
      'pointerleave',
      () => {
        if (!pinnedNote) setSequenceNote(sequence, false);
      },
      { signal }
    );
    const observer = new ResizeObserver(schedule);
    const sheet = sequence.querySelector<HTMLElement>('.study-sheet');
    if (sheet) observer.observe(sheet);
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  });
  root.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        sequences.forEach((sequence) => setSequenceNote(sequence, false));
      }
    },
    { signal }
  );
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { passive: true, signal });
  motion.addEventListener('change', schedule, { signal });
  desktop.addEventListener('change', schedule, { signal });
  document.fonts.ready.then(() => {
    if (!signal.aborted) schedule();
  });
  dispose = () => {
    abort.abort();
    cancelAnimationFrame(frame);
  };
  document.addEventListener('astro:before-swap', dispose, { once: true, signal });
  update();
}
