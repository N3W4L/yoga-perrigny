const root = document.querySelector<HTMLElement>('.souffle');

function lowPower() {
  const connection = navigator.connection as { saveData?: boolean; effectiveType?: string } | undefined;
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const slow = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
  return Boolean(connection?.saveData) || Boolean(slow) || (typeof memory === 'number' && memory <= 2) || (typeof cores === 'number' && cores <= 2);
}

/** Plein cadre sur un long palier, fondu court de part et d'autre. */
function focusWindow(distance: number, plateau: number, edge: number) {
  if (distance <= plateau) return 1;
  if (distance >= edge) return 0;
  const t = (distance - plateau) / (edge - plateau);
  return 1 - t * t * (3 - 2 * t);
}

if (root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  const canFly = !reduce && !narrow && !lowPower();
  const planes = [...root.querySelectorAll<HTMLElement>('.plane')];
  const gates = [...root.querySelectorAll<HTMLElement>('.gate')];
  const nav = root.querySelector<HTMLElement>('.s-nav');

  const scrollSpan = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const scrollToIndex = (index: number, behavior: ScrollBehavior) => {
    const span = scrollSpan();
    const top = planes.length > 1 ? (index / (planes.length - 1)) * span : 0;
    window.scrollTo({ top, behavior });
  };

  const progress = root.querySelector<SVGCircleElement>('[data-progress]');
  let progressLength = 0;
  if (!reduce && progress) {
    const radius = 16;
    progressLength = 2 * Math.PI * radius;
    progress.style.strokeDasharray = `${progressLength}`;
  }

  const paintProgress = (ratio: number) => {
    if (!progress || reduce) return;
    progress.style.strokeDashoffset = `${progressLength * (1 - ratio)}`;
  };

  if (canFly && planes.length > 1) {
    document.documentElement.classList.add('journey-3d');
    const world = root.querySelector<HTMLElement>('.world');
    const step = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--step')) || 1500;
    const travel = step * (planes.length - 1);

    let span = 0;
    const measure = () => {
      span = scrollSpan();
    };

    const planeReveal = planes.map(() => -1);
    const gateReveal = gates.map(() => -1);
    let lastAlong = Number.NaN;
    let currentIndex = -1;

    const paintReveal = (el: HTMLElement, store: number[], index: number, reveal: number) => {
      const q = Math.round(reveal * 1000) / 1000;
      if (store[index] === q) return;
      store[index] = q;
      el.style.setProperty('--reveal', String(q));
      el.style.visibility = q === 0 ? 'hidden' : 'visible';
    };

    const apply = (position: number) => {
      const along = planes.length > 1 ? position / (planes.length - 1) : 0;
      if (world && along !== lastAlong) {
        lastAlong = along;
        world.style.transform = `translate3d(0,0,${(along * travel).toFixed(2)}px)`;
      }

      let current = 0;
      let best = Infinity;
      for (let index = 0; index < planes.length; index++) {
        const distance = Math.abs(index - position);
        if (distance < best) {
          best = distance;
          current = index;
        }
        paintReveal(planes[index], planeReveal, index, focusWindow(distance, 0.45, 0.55));
      }

      for (let index = 0; index < planes.length; index++) {
        const near = index === current;
        if (planes[index].classList.contains('is-near') !== near) planes[index].classList.toggle('is-near', near);
      }

      for (let index = 0; index < gates.length; index++) {
        const distance = Math.abs(index + 0.5 - position);
        const reveal = focusWindow(distance, 0.08, 0.78);
        paintReveal(gates[index], gateReveal, index, reveal);
        const live = reveal > 0.04;
        if (gates[index].classList.contains('is-live') !== live) gates[index].classList.toggle('is-live', live);
      }

      if (current !== currentIndex) {
        currentIndex = current;
        const id = planes[current]?.id ?? '';
        nav?.classList.remove('is-on-light');
        root.querySelectorAll<HTMLAnchorElement>('.s-links a[href^="#"], .s-panel a[href^="#"]').forEach((link) => {
          const on = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('is-active', on);
          if (on) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      }
    };

    let raf = 0;
    const frame = () => {
      raf = 0;
      const ratio = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      apply(ratio * (planes.length - 1));
      paintProgress(ratio);
    };

    const request = () => {
      if (raf) return;
      raf = requestAnimationFrame(frame);
    };

    measure();
    request();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      request();
    }, { passive: true });

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

    const hashIndex = planes.findIndex((plane) => `#${plane.id}` === window.location.hash);
    if (hashIndex > 0) scrollToIndex(hashIndex, 'auto');
  } else if (!reduce && progress) {
    let span = scrollSpan();
    let raf = 0;
    const frame = () => {
      raf = 0;
      const ratio = span > 0 ? Math.min(1, window.scrollY / span) : 0;
      paintProgress(ratio);
    };
    const request = () => {
      if (raf) return;
      raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', () => {
      span = scrollSpan();
      request();
    }, { passive: true });
  }
}
