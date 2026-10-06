const sections = [
  { id: 'faculty', label: '师资展示', summary: '看方法背后的讲台与老师。' },
  { id: 'results', label: '学习来信', summary: '阅读具体的学习反馈与结果。' },
  { id: 'materials', label: '资料汇总', summary: '查看课程中使用的示例资料。' },
  { id: 'path', label: '学制路径', summary: '确认当前学制与下一步安排。' },
  { id: 'reading', label: '备考札记', summary: '把问题留下，再继续阅读。' },
  { id: 'about', label: '网站说明', summary: '了解机构资料与示例状态。' },
];

let dispose: (() => void) | undefined;

export function initPageTimeline() {
  dispose?.();
  const timeline = document.querySelector<HTMLElement>('[data-page-timeline]');
  if (!timeline) return;
  const controller = new AbortController();
  const { signal } = controller;
  const nodes = sections
    .map((item) => ({ ...item, element: document.getElementById(item.id) }))
    .filter((item) => item.element);
  const label = timeline.querySelector<HTMLElement>('[data-timeline-label]');
  const summary = timeline.querySelector<HTMLElement>('[data-timeline-summary]');
  const line = timeline.querySelector<HTMLElement>('.page-timeline-line i');
  let frame = 0;

  const update = () => {
    frame = 0;
    if (!nodes.length) return;
    const activation = innerHeight * 0.42;
    const facultyTop = nodes[0].element!.getBoundingClientRect().top;
    const visible = facultyTop <= innerHeight * 0.82;
    timeline.classList.toggle('is-visible', visible);
    let active = 0;
    nodes.forEach((item, index) => {
      if (item.element!.getBoundingClientRect().top <= activation) active = index;
    });
    const current = nodes[active];
    nodes.forEach((_item, index) => {
      const node = timeline.querySelector<HTMLElement>(`[data-timeline-node="${index}"]`);
      node?.toggleAttribute('aria-current', index === active);
      if (index === active) node?.setAttribute('aria-current', 'step');
    });
    if (label) label.textContent = current.label;
    if (summary) summary.textContent = current.summary;
    const first = nodes[0].element!.getBoundingClientRect().top + scrollY;
    const last = nodes[nodes.length - 1].element!.getBoundingClientRect().top + scrollY;
    const progress = Math.max(0, Math.min(100, ((scrollY + activation - first) / Math.max(1, last - first)) * 100));
    line?.style.setProperty('height', `${progress}%`);
    timeline.style.setProperty('--timeline-progress', `${progress}%`);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { passive: true, signal });
  nodes.forEach((item) => item.element?.addEventListener('click', () => window.setTimeout(schedule, 80), { signal }));
  schedule();
  dispose = () => {
    controller.abort();
    cancelAnimationFrame(frame);
  };
  document.addEventListener('astro:before-swap', dispose, { once: true, signal });
}
