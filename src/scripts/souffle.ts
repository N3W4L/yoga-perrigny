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
  const nav = root.querySelector<HTMLElement>('.s-nav');
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
    const last = planes.length - 1;
    const duration = 640;

    let camera = 0;
    let fromPos = 0;
    let toPos = 0;
    let started = 0;
    let raf = 0;
    let currentIndex = -1;
    let driving = false;
    let driveTimer = 0;
    const shown = planes.map(() => false);

    const clamp = (index: number) => Math.max(0, Math.min(last, index));

    const indexFromScroll = () => {
      const stop = window.innerHeight;
      if (stop <= 0) return 0;
      return clamp(Math.round(window.scrollY / stop));
    };

    const markNav = (index: number) => {
      if (index === currentIndex) return;
      currentIndex = index;
      document.documentElement.dataset.station = String(index);
      const id = planes[index]?.id ?? '';
      root.querySelectorAll<HTMLAnchorElement>('.s-links a[href^="#"], .s-panel a[href^="#"]').forEach((link) => {
        const on = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      paintProgress(last > 0 ? index / last : 0);
    };

    const paint = (position: number) => {
      const near = clamp(Math.round(position));
      markNav(near);
      world?.classList.toggle('is-moving', Math.abs(position - toPos) > 0.004 && raf !== 0);
      for (let index = 0; index < planes.length; index++) {
        const distance = Math.abs(index - position);
        const live = distance < 0.985;
        const plane = planes[index];
        if (shown[index] !== live) {
          shown[index] = live;
          plane.classList.toggle('is-live', live);
        }
        if (!live) {
          if (plane.classList.contains('is-near')) plane.classList.remove('is-near');
          continue;
        }
        const opacity = Math.max(0, 1 - distance);
        plane.style.opacity = opacity.toFixed(3);
        const shift = (index - position) * 36;
        plane.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        const focus = index === near;
        if (plane.classList.contains('is-near') !== focus) plane.classList.toggle('is-near', focus);
      }
    };

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
      camera = fromPos + (toPos - fromPos) * eased;
      if (t >= 1) {
        camera = toPos;
        raf = 0;
        paint(camera);
        return;
      }
      paint(camera);
      raf = requestAnimationFrame(tick);
    };

    const travelTo = (index: number, immediate = false) => {
      const next = clamp(index);
      if (immediate) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        fromPos = next;
        toPos = next;
        camera = next;
        paint(camera);
        return;
      }
      if (next === toPos && raf) return;
      if (next === toPos && !raf && Math.abs(camera - next) < 0.001) return;
      fromPos = camera;
      toPos = next;
      started = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const scrollToIndex = (index: number) => {
      window.scrollTo({ top: clamp(index) * window.innerHeight, behavior: 'auto' });
    };

    const go = (index: number, immediate = false) => {
      const next = clamp(index);
      driving = true;
      window.clearTimeout(driveTimer);
      scrollToIndex(next);
      travelTo(next, immediate);
      driveTimer = window.setTimeout(() => {
        driving = false;
      }, 80);
      const menu = root.querySelector<HTMLDetailsElement>('[data-menu]');
      if (menu) menu.open = false;
    };

    let scrollRaf = 0;
    const onScroll = () => {
      if (driving || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        if (!driving) travelTo(indexFromScroll());
      });
    };

    travelTo(0, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener(
      'scrollend',
      () => {
        driving = false;
        travelTo(indexFromScroll());
      },
      { passive: true },
    );
    window.addEventListener('resize', () => {
      driving = true;
      scrollToIndex(toPos);
      travelTo(toPos, true);
      driveTimer = window.setTimeout(() => {
        driving = false;
      }, 80);
    });

    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const index = planes.findIndex((plane) => `#${plane.id}` === link.getAttribute('href'));
        if (index < 0) return;
        event.preventDefault();
        go(index);
      });
    });

    window.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      if (target?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      let next: number | null = null;
      if (event.key === 'ArrowDown' || event.key === 'PageDown') next = toPos + 1;
      else if (event.key === 'ArrowUp' || event.key === 'PageUp') next = toPos - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      else if (event.key === ' ' && tag !== 'BUTTON' && tag !== 'A' && tag !== 'SUMMARY') next = toPos + 1;
      else return;
      event.preventDefault();
      go(next);
    });

    root.querySelector('.world')?.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement | null;
      const plane = target?.closest<HTMLElement>('.plane');
      if (!plane) return;
      const index = planes.indexOf(plane);
      if (index >= 0) go(index, true);
    });

    const hashIndex = planes.findIndex((plane) => `#${plane.id}` === window.location.hash);
    if (hashIndex > 0) go(hashIndex, true);
  } else if (!reduce && progress) {
    let raf = 0;
    const frame = () => {
      raf = 0;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      paintProgress(ratio);
    };
    const request = () => {
      if (raf) return;
      raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  }
}
