const root = document.querySelector<HTMLElement>('.souffle');

function lowPower() {
  const connection = navigator.connection as { saveData?: boolean; effectiveType?: string } | undefined;
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const slow = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
  return Boolean(connection?.saveData) || Boolean(slow) || (typeof memory === 'number' && memory <= 2) || (typeof cores === 'number' && cores <= 2);
}

if (root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  const canFly = !reduce && !narrow && !lowPower();
  const planes = [...root.querySelectorAll<HTMLElement>('.plane')];
  const gates = [...root.querySelectorAll<HTMLElement>('.gate')];
  const nav = root.querySelector<HTMLElement>('.s-nav');

  const scrollSpan = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const smooth = (t: number) => {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior) => {
    const top = planes.length > 1 ? (index / (planes.length - 1)) * scrollSpan() : 0;
    window.scrollTo({ top, behavior });
  };

  if (canFly && planes.length > 1) {
    document.documentElement.classList.add('journey-3d');
    const world = root.querySelector<HTMLElement>('.world');

    const step = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--step')) || 1500;
    const travel = step * (planes.length - 1);
    let shown = 0;
    let chasing = false;

    const apply = (position: number) => {
      if (world) {
        const along = planes.length > 1 ? position / (planes.length - 1) : 0;
        world.style.transform = `translate3d(0,0,${(along * travel).toFixed(2)}px)`;
      }
      let current = 0;
      planes.forEach((plane, index) => {
        const signed = index - position;
        const distance = Math.abs(signed);
        let reveal = smooth(1 - distance / 1.05);
        if (signed < -0.045) reveal *= Math.max(0, 1 - (-signed - 0.045) / 0.1);
        plane.style.setProperty('--reveal', reveal.toFixed(3));
        plane.classList.toggle('is-near', distance < 0.62);
        if (distance < Math.abs(current - position)) current = index;
      });
      gates.forEach((gate, index) => {
        const signed = index + 0.5 - position;
        const distance = Math.abs(signed);
        let reveal = smooth(1 - distance / 1.2);
        if (signed < -0.16) reveal *= Math.max(0, 1 - (-signed - 0.16) / 0.14);
        gate.style.setProperty('--reveal', reveal.toFixed(3));
      });
      const id = planes[current]?.id ?? '';
      nav?.classList.remove('is-on-light');
      root.querySelectorAll<HTMLAnchorElement>('.s-links a, .s-panel a').forEach((link) => {
        const on = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    const chase = () => {
      const max = scrollSpan();
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const target = progress * (planes.length - 1);
      shown += (target - shown) * 0.14;
      if (Math.abs(target - shown) < 0.0012) shown = target;
      apply(shown);
      if (shown !== target) requestAnimationFrame(chase);
      else chasing = false;
    };

    const nudge = () => {
      if (chasing) return;
      chasing = true;
      requestAnimationFrame(chase);
    };

    nudge();
    window.addEventListener('scroll', nudge, { passive: true });
    window.addEventListener('resize', nudge);

    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const index = planes.findIndex((plane) => `#${plane.id}` === link.getAttribute('href'));
        if (index < 0) return;
        event.preventDefault();
        scrollToIndex(index, reduce ? 'auto' : 'smooth');
        const menu = root.querySelector<HTMLDetailsElement>('[data-menu]');
        if (menu) menu.open = false;
      });
    });

    root.querySelector('.world')?.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement | null;
      const plane = target?.closest<HTMLElement>('.plane');
      if (!plane) return;
      const index = planes.indexOf(plane);
      if (index >= 0) scrollToIndex(index, 'auto');
    });

    root.addEventListener(
      'wheel',
      (event) => {
        const scroller = (event.target as HTMLElement | null)?.closest<HTMLElement>('.plane > .s-wrap');
        if (!scroller) return;
        const delta = event.deltaY;
        const overflow = scroller.scrollHeight > scroller.clientHeight + 2;
        const atTop = scroller.scrollTop <= 0;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        if (!overflow || (delta < 0 && atTop) || (delta > 0 && atBottom)) {
          event.preventDefault();
          window.scrollBy({ top: delta });
        }
      },
      { passive: false },
    );

    const hashIndex = planes.findIndex((plane) => `#${plane.id}` === window.location.hash);
    if (hashIndex > 0) scrollToIndex(hashIndex, 'auto');
  }

  const progress = root.querySelector<SVGCircleElement>('[data-progress]');
  if (!reduce && progress) {
    const radius = 16;
    const length = 2 * Math.PI * radius;
    progress.style.strokeDasharray = `${length}`;
    const tick = () => {
      const max = scrollSpan();
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progress.style.strokeDashoffset = `${length * (1 - ratio)}`;
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
  }
}
