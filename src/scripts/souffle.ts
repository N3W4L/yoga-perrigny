const root = document.querySelector<HTMLElement>('.souffle');
if (!root) {
  /* Ce script n'est chargé que sur la page Souffle. */
} else {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = root.querySelector<SVGCircleElement>('[data-progress]');

  if (!reduce && progress) {
    const radius = 16;
    const length = 2 * Math.PI * radius;
    progress.style.strokeDasharray = `${length}`;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progress.style.strokeDashoffset = `${length * (1 - ratio)}`;
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
  }
}
