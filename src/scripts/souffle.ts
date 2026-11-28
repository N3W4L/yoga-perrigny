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
    const html = document.documentElement;
    html.classList.add('journey-3d');
    /* Le navigateur sait lier l'animation au défilement : il la calcule seul,
       hors du fil principal. Sinon, on applique la même table à la main. */
    const cssDriven =
      typeof CSS !== 'undefined' &&
      CSS.supports('animation-timeline: scroll()') &&
      CSS.supports('animation-range: 0px 100px');
    if (cssDriven) html.classList.add('journey-css');

    const gates = [...root.querySelectorAll<HTMLElement>('.gate')];
    const links = [...root.querySelectorAll<HTMLAnchorElement>('.s-links a[href^="#"], .s-panel a[href^="#"]')];
    const menu = root.querySelector<HTMLDetailsElement>('[data-menu]');
    const last = planes.length - 1;
    const clamp = (value: number) => Math.max(0, Math.min(last, value));

    /* Paliers [progression, opacité, échelle] : identiques aux @keyframes dive et pass de souffle.css. */
    type Stop = readonly [number, number, number];
    const DIVE: readonly Stop[] = [
      [0, 0, 0.625], [0.2, 0.15, 0.735], [0.35, 0.6, 0.847], [0.45, 0.95, 0.943],
      [0.5, 1, 1], [0.55, 0.9, 1.064], [0.65, 0.3, 1.2], [0.72, 0, 1.28], [1, 0, 1.28],
    ];
    const PASS: readonly Stop[] = [
      [0, 0, 0.3], [0.3, 0.2, 0.42], [0.6, 0.25, 0.62], [0.8, 0.7, 0.95], [0.91, 0.35, 1.3], [1, 0, 1.6],
    ];
    const sample = (stops: readonly Stop[], t: number) => {
      const x = Math.max(0, Math.min(1, t));
      for (let k = 1; k < stops.length; k++) {
        const [t1, o1, s1] = stops[k];
        if (x <= t1) {
          const [t0, o0, s0] = stops[k - 1];
          const f = t1 > t0 ? (x - t0) / (t1 - t0) : 1;
          return [o0 + (o1 - o0) * f, s0 + (s1 - s0) * f] as const;
        }
      }
      return [stops[stops.length - 1][1], stops[stops.length - 1][2]] as const;
    };

    /* Un écran est rendu s'il est à une station au plus (les voisins restent
       atteignables au clavier) ; un anneau, entre son apparition et son passage. */
    const planeLive = planes.map(() => false);
    const gateLive = gates.map(() => false);
    let currentIndex = -1;

    const markNav = (index: number) => {
      if (index === currentIndex) return;
      currentIndex = index;
      html.dataset.station = String(index);
      const id = planes[index]?.id ?? '';
      links.forEach((link) => {
        const on = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      planes.forEach((plane, i) => plane.classList.toggle('is-near', i === index));
    };

    const frame = () => {
      raf = 0;
      const stop = window.innerHeight || 1;
      const position = clamp(window.scrollY / stop);
      markNav(clamp(Math.round(position)));
      paintProgress(last > 0 ? position / last : 0);

      for (let i = 0; i < planes.length; i++) {
        const live = Math.abs(i - position) <= 1.001;
        if (live !== planeLive[i]) {
          planeLive[i] = live;
          planes[i].classList.toggle('is-live', live);
        }
        if (live && !cssDriven) {
          const [opacity, scale] = sample(DIVE, (position - (i - 1)) / 2);
          planes[i].style.opacity = opacity.toFixed(3);
          planes[i].style.transform = `scale(${scale.toFixed(4)})`;
        }
      }
      for (let g = 0; g < gates.length; g++) {
        const t = (position - (g - 0.5)) / 1.1;
        const live = t > -0.02 && t < 1.02;
        if (live !== gateLive[g]) {
          gateLive[g] = live;
          gates[g].classList.toggle('is-live', live);
        }
        if (live && !cssDriven) {
          const [opacity, scale] = sample(PASS, t);
          gates[g].style.opacity = opacity.toFixed(3);
          gates[g].style.transform = `scale(${scale.toFixed(4)})`;
        }
      }
    };

    let raf = 0;
    const request = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    /* Le cran (scroll-snap) fait le travail : molette, flèches, Page suivante,
       espace, Début et Fin avancent d'un écran sans script. */
    const go = (index: number, smooth: boolean) => {
      window.scrollTo({ top: clamp(index) * window.innerHeight, behavior: smooth ? 'smooth' : 'auto' });
      if (menu) menu.open = false;
    };

    frame();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);

    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const index = planes.findIndex((plane) => `#${plane.id}` === link.getAttribute('href'));
        if (index < 0) return;
        event.preventDefault();
        go(index, true);
      });
    });

    root.addEventListener(
      'toggle',
      (event) => {
        const details = event.target;
        if (!(details instanceof HTMLDetailsElement) || !details.classList.contains('fold')) return;
        if (!details.open) return;
        root.querySelectorAll('details.fold[open]').forEach((other) => {
          if (other !== details) other.open = false;
        });
        details.querySelector('summary')?.focus({ preventScroll: true });
      },
      true,
    );

    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (menu?.open) return;
      const open = root.querySelector<HTMLDetailsElement>('details.fold[open]');
      if (!open) return;
      event.preventDefault();
      open.open = false;
      open.querySelector('summary')?.focus({ preventScroll: true });
    });

    root.querySelector('.world')?.addEventListener('focusin', (event) => {
      const plane = (event.target as HTMLElement | null)?.closest<HTMLElement>('.plane');
      const index = plane ? planes.indexOf(plane) : -1;
      if (index >= 0 && index !== currentIndex) go(index, false);
    });

    const hashIndex = planes.findIndex((plane) => `#${plane.id}` === window.location.hash);
    if (hashIndex > 0) go(hashIndex, false);
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
