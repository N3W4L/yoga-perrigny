import { createLogoTunnel } from './logo3d';
import { createTunnel } from './tunnel';

/**
 * Décor du trajet : 'logo' = le logo en anamorphose, qui se disloque quand on
 * avance (logo3d.ts) ; 'anneaux' = le tunnel d'anneaux infini (tunnel.ts).
 */
const DECOR: 'logo' | 'anneaux' = 'logo';

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

    const ringsCanvas = root.querySelector<HTMLCanvasElement>('.rings');
    const tunnel = ringsCanvas ? (DECOR === 'logo' ? createLogoTunnel(ringsCanvas) : createTunnel(ringsCanvas)) : null;
    const links = [...root.querySelectorAll<HTMLAnchorElement>('.s-links a[href^="#"], .s-panel a[href^="#"]')];
    const menu = root.querySelector<HTMLDetailsElement>('[data-menu]');
    const last = planes.length - 1;
    const clamp = (value: number) => Math.max(0, Math.min(last, value));
    /* Longueur de défilement d'un écran au suivant : --stop dans souffle.css. */
    const firstStop = root.querySelector<HTMLElement>('.snap-stop');
    const secondStop = firstStop?.nextElementSibling as HTMLElement | null;
    const stopLength = () =>
      (firstStop && secondStop ? secondStop.offsetTop - firstStop.offsetTop : 0) || window.innerHeight || 1;

    /* Paliers [progression, opacité, échelle] : identiques à @keyframes dive de souffle.css. */
    type Stop = readonly [number, number, number];
    const DIVE: readonly Stop[] = [
      [0, 0, 0.62], [0.2, 0.12, 0.73], [0.325, 0.5, 0.83], [0.425, 0.92, 0.93], [0.47, 1, 0.975],
      [0.5, 1, 1], [0.53, 1, 1.03], [0.575, 0.85, 1.08], [0.65, 0.3, 1.18], [0.71, 0, 1.28], [1, 0, 1.28],
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

    /* Un écran est rendu s'il est à une station au plus : les voisins restent
       atteignables au clavier. */
    const planeLive = planes.map(() => false);
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
      const position = clamp(window.scrollY / stopLength());
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
      tunnel?.draw(position);
    };

    let raf = 0;
    /* Aimant doux : à l'arrêt du défilement, si l'on arrive à moins de 20 % d'un
       écran (dans le sens où l'on avance), on le pose. On ne ramène jamais vers
       l'écran qu'on vient de quitter : chaque cran de molette fait avancer. */
    let settleTimer = 0;
    let lastY = window.scrollY;
    let heading = 0;
    const settle = () => {
      const length = stopLength();
      const position = window.scrollY / length;
      const ahead = heading > 0 ? Math.ceil(position - 0.002) : Math.floor(position + 0.002);
      const target = clamp(ahead);
      const gap = Math.abs(position - target);
      if (heading !== 0 && gap > 0.002 && gap < 0.2) window.scrollTo({ top: target * length, behavior: 'smooth' });
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(frame);
      const y = window.scrollY;
      if (y !== lastY) heading = Math.sign(y - lastY);
      lastY = y;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 180);
    };

    /* Le défilement natif fait avancer petit à petit dans les cercles. */
    const go = (index: number, smooth: boolean) => {
      window.scrollTo({ top: clamp(index) * stopLength(), behavior: smooth ? 'smooth' : 'auto' });
      if (menu) menu.open = false;
    };

    frame();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', () => {
      tunnel?.resize();
      request();
    });

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
