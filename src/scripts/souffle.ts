import { createLogoTunnel } from './logo3d';
import { createTunnel } from './tunnel';

/**
 * Décor du trajet : 'logo' = le logo en anamorphose, qui se disloque quand on
 * avance (logo3d.ts) ; 'anneaux' = le tunnel d'anneaux infini (tunnel.ts).
 */
const DECOR: 'logo' | 'anneaux' = 'logo';

const root = document.querySelector<HTMLElement>('.souffle');

/** Indices d'appareil modeste (API non standard, absentes de certains navigateurs). */
type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

function lowPower() {
  const hints = navigator as NavigatorHints;
  const connection = hints.connection;
  const memory = hints.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const slow = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
  return Boolean(connection?.saveData) || Boolean(slow) || (typeof memory === 'number' && memory <= 2) || (typeof cores === 'number' && cores <= 2);
}

if (root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Trajet 3D seulement si chaque écran tient : au moins 768 px de large et
     640 px de haut. En dessous (téléphone en paysage, petit écran), lecture à plat. */
  const tooSmall = window.matchMedia('(max-width: 767px), (max-height: 639px)');
  const canFly = !reduce && !tooSmall.matches && !lowPower();
  // Rotation de l'appareil ou fenêtre redimensionnée au-delà du seuil : on recharge
  // pour passer proprement d'un mode à l'autre.
  tooSmall.addEventListener('change', () => window.location.reload());
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
    const tunnel = ringsCanvas ? (DECOR === 'logo' ? createLogoTunnel(ringsCanvas, planes.length - 1) : createTunnel(ringsCanvas)) : null;
    const links = [...root.querySelectorAll<HTMLAnchorElement>('.s-links a[href^="#"], .s-panel a[href^="#"]')];
    const menu = root.querySelector<HTMLDetailsElement>('[data-menu]');
    const counter = root.querySelector<HTMLElement>('[data-progress-count]');
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
      // Repère : numéro de l'écran dans l'anneau de progression (pas sur l'accueil).
      if (counter) counter.textContent = index > 0 ? String(index).padStart(2, '0') : '';
      // Un sous-écran (programme du stage) allume l'entrée de menu de son parent.
      const id = planes[index]?.dataset.nav || planes[index]?.id || '';
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
    /* Ancrage : à l'arrêt du défilement, on se pose toujours sur un écran,
       jamais entre deux. Si l'on a quitté l'écran de départ d'au moins COMMIT
       (6 % du trajet entre deux écrans), on glisse jusqu'à l'écran vers lequel
       on se dirige ; sinon (frôlement), on revient à l'écran de départ. */
    const COMMIT = 0.06;

    /* Glissement piloté plutôt que le défilement « smooth » du navigateur :
       une courbe de Hermite part de la position ET de la vitesse actuelles et
       arrive exactement sur l'écran visé, vitesse nulle. Quand on change de
       destination en plein vol (deux clics de menu rapprochés), la nouvelle
       courbe reprend la vitesse en cours : pas d'arrêt ni de redémarrage. Durée
       selon la distance (≈ 0,7 s pour un écran, 1,7 s au plus). Toute action de
       l'utilisateur (molette, toucher) reprend la main aussitôt. */
    let glide: { from: number; to: number; v0: number; start: number; duration: number } | null = null;
    let glideFrame = 0;
    let glideWritten = -1;
    const hermite = (g: NonNullable<typeof glide>, t: number) => {
      // Position et vitesse (px/s) à l'instant t (0 → 1) : h00·p0 + h10·D·v0 + h01·p1.
      const t2 = t * t;
      const t3 = t2 * t;
      const d = g.duration / 1000;
      const position = (2 * t3 - 3 * t2 + 1) * g.from + (t3 - 2 * t2 + t) * d * g.v0 + (-2 * t3 + 3 * t2) * g.to;
      const velocity = ((6 * t2 - 6 * t) * g.from + (3 * t2 - 4 * t + 1) * d * g.v0 + (-6 * t2 + 6 * t) * g.to) / d;
      return { position, velocity };
    };
    const stopGlide = () => {
      if (glideFrame) cancelAnimationFrame(glideFrame);
      glideFrame = 0;
      glide = null;
    };
    const glideStep = (now: number) => {
      if (!glide) return;
      // Défilement par l'utilisateur pendant le glissement : il reprend la main.
      if (glideWritten >= 0 && Math.abs(window.scrollY - glideWritten) > 3) {
        stopGlide();
        return;
      }
      const t = Math.min(1, (now - glide.start) / glide.duration);
      const { position } = hermite(glide, t);
      window.scrollTo(0, t >= 1 ? glide.to : position);
      glideWritten = window.scrollY;
      if (t >= 1) {
        stopGlide();
        return;
      }
      glideFrame = requestAnimationFrame(glideStep);
    };
    const glideTo = (top: number) => {
      const now = performance.now();
      let from = window.scrollY;
      let v0 = 0;
      if (glide) {
        const current = hermite(glide, Math.min(1, (now - glide.start) / glide.duration));
        from = current.position;
        v0 = current.velocity;
      }
      const screens = Math.abs(top - from) / stopLength();
      const duration = Math.min(1700, 560 + 130 * Math.min(screens, 9));
      glide = { from, to: top, v0, start: now, duration };
      glideWritten = -1;
      if (!glideFrame) glideFrame = requestAnimationFrame(glideStep);
    };
    // La main revient à l'utilisateur dès qu'il défile lui-même.
    for (const type of ['wheel', 'touchstart'] as const) {
      window.addEventListener(type, stopGlide, { passive: true });
    }
    const IDLE = 140;
    let settleTimer = 0;
    let lastY = window.scrollY;
    let heading = 0;
    let anchor = Math.round(window.scrollY / stopLength());
    const settle = () => {
      const length = stopLength();
      const position = window.scrollY / length;
      const nearest = clamp(Math.round(position));
      if (glideFrame) return; // un glissement est en cours : il se pose seul
      if (Math.abs(position - nearest) < 0.002) {
        anchor = nearest;
        return;
      }
      let target = anchor;
      if (heading > 0 && position - anchor >= COMMIT) target = Math.ceil(position - 0.002);
      else if (heading < 0 && anchor - position >= COMMIT) target = Math.floor(position + 0.002);
      target = clamp(target);
      glideTo(target * length);
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(frame);
      const y = window.scrollY;
      if (y !== lastY) heading = Math.sign(y - lastY);
      lastY = y;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, IDLE);
    };

    /* Le défilement natif fait avancer petit à petit dans les cercles. */
    const go = (index: number, smooth: boolean) => {
      anchor = clamp(index);
      const top = clamp(index) * stopLength();
      if (smooth) glideTo(top);
      else {
        stopGlide();
        window.scrollTo(0, top);
      }
      if (menu) menu.open = false;
    };

    /* Flèches ↑ ↓ : un écran entier (leur pas natif, 40 px, resterait sous le seuil d'ancrage). */
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], details[open] .s-panel')) return;
      event.preventDefault();
      go(anchor + (event.key === 'ArrowDown' ? 1 : -1), !reduce);
    });

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

    root.querySelector('.world')?.addEventListener('focusin', (event) => {
      const plane = (event.target as HTMLElement | null)?.closest<HTMLElement>('.plane');
      const index = plane ? planes.indexOf(plane) : -1;
      if (index < 0 || index === currentIndex) return;
      // Le focus peut arriver sur un écran éloigné (Tab, lecteur d'écran) :
      // on s'y rend, puis encore à l'image suivante, après le défilement que
      // le navigateur fait lui-même pour montrer l'élément focalisé.
      go(index, false);
      requestAnimationFrame(() => go(index, false));
    });

    const hashIndex = planes.findIndex((plane) => `#${plane.id}` === window.location.hash);
    if (hashIndex > 0) {
      // Lien direct vers une section (#inscriptions…) : le navigateur fait aussi son
      // propre saut vers l'ancre, une fois la page chargée. On se repose ensuite sur
      // le bon écran, sans laisser l'ancrage interpréter ce saut comme un défilement.
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      go(hashIndex, false);
      const land = () => requestAnimationFrame(() => requestAnimationFrame(() => go(hashIndex, false)));
      if (document.readyState === 'complete') land();
      else window.addEventListener('load', land, { once: true });
    }
    // Ancre modifiée sans rechargement (barre d'adresse, lien externe vers la page) :
    // même traitement, après le saut natif du navigateur.
    window.addEventListener('hashchange', () => {
      const index = planes.findIndex((plane) => `#${plane.id}` === window.location.hash);
      if (index >= 0) requestAnimationFrame(() => go(index, false));
    });
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
