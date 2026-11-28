/**
 * Logo en anamorphose pour le trajet 3D.
 *
 * Le « O » du logo (cercle, tige, courbes, arche et traits de construction)
 * est découpé en morceaux posés chacun à une profondeur différente le long du
 * trajet. Chaque morceau est agrandi en proportion de sa distance : depuis
 * l'accueil, tout s'aligne en un logo parfait. Dès qu'on avance, les morceaux
 * proches grossissent plus vite que les lointains : le logo se disloque, on
 * découvre qu'il n'était pas sur un seul plan, et on traverse ses morceaux un
 * par un au fil des pages.
 *
 * Projection : un point p du logo (coordonnées unité) posé à la profondeur Z
 * apparaît, caméra en c, à p × Z / (Z − c). En c = 0, il est exactement en p.
 *
 * Un seul canevas, redessiné seulement quand la position change.
 */

type Point = readonly [number, number];
interface Piece {
  points: Float32Array;
  /** Profondeur, en écrans (0 = accueil). */
  depth: number;
  /** Trait de construction : plus fin et plus discret. */
  tick: boolean;
}

/** Profondeurs des morceaux : du premier traversé au dernier, en écrans. */
const NEAREST = 0.85;
const FARTHEST = 9.2;
/** Centre du logo, en fraction de la hauteur (aligné sur transform-origin des écrans). */
const CENTER_Y = 0.46;
/** Dérive latérale de la caméra (unités du logo) : révèle les plans. Nulle à l'accueil. */
const SWAY_X = 0.32;
const SWAY_Y = 0.14;

/* Géométrie relevée sur le dessin du logo (1208 × 1300 px), ramenée à un
   cercle de rayon 1 centré en (0, 0). */
const CX = 604;
const CY = 630;
const R = 536;
const u = (x: number, y: number): Point => [(x - CX) / R, (y - CY) / R];

const line = (a: Point, b: Point, n = 6): Point[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as const;
  });

const arc = (radius: number, from: number, to: number, n: number): Point[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const angle = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const;
  });

const cubic = (p0: Point, p1: Point, p2: Point, p3: Point, t0: number, t1: number, n = 16): Point[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / n;
    const m = 1 - t;
    const a = m * m * m;
    const b = 3 * m * m * t;
    const c = 3 * m * t * t;
    const d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]] as const;
  });

/** Le logo, découpé : [points, trait de construction ?]. */
function logoPieces(): Array<[Point[], boolean]> {
  const pieces: Array<[Point[], boolean]> = [];
  const add = (points: Point[], tick = false) => pieces.push([points, tick]);

  // Grand cercle, ouvert en bas : de la courbe gauche à la courbe droite, par le haut.
  const from = 137.6;
  const to = 402.4;
  const parts = 8;
  for (let i = 0; i < parts; i++) {
    add(arc(1, from + ((to - from) * i) / parts, from + ((to - from) * (i + 1)) / parts, 14));
  }
  // Arc du bas, sous l'arche.
  for (let i = 0; i < 3; i++) add(arc(1.041, 63.4 + (53.1 * i) / 3, 63.4 + (53.1 * (i + 1)) / 3, 8));

  // Tige : barre du haut et deux montants.
  add(line(u(500, 320), u(710, 320)));
  add(line(u(500, 320), u(500, 520)));
  add(line(u(710, 320), u(710, 520)));

  // Courbes qui descendent de la tige jusqu'au cercle.
  const left = [u(500, 520), u(500, 770), u(430, 880), u(210, 990)] as const;
  const right = [u(710, 520), u(710, 770), u(780, 880), u(998, 990)] as const;
  for (const curve of [left, right]) {
    add(cubic(curve[0], curve[1], curve[2], curve[3], 0, 0.5));
    add(cubic(curve[0], curve[1], curve[2], curve[3], 0.5, 1));
  }

  // Arche du bas : deux pentes jusqu'au sommet.
  const archLeft = [u(355, 1130), u(445, 1060), u(550, 930), u(604, 848)] as const;
  const archRight = [u(855, 1130), u(765, 1060), u(660, 930), u(604, 848)] as const;
  for (const curve of [archLeft, archRight]) {
    add(cubic(curve[0], curve[1], curve[2], curve[3], 0, 0.5, 10));
    add(cubic(curve[0], curve[1], curve[2], curve[3], 0.5, 1, 10));
  }

  // Traits de construction du dessin.
  const ticks: Array<[number, number, number, number]> = [
    [604, 5, 604, 228], [604, 1185, 604, 1290], [0, 628, 205, 628], [1005, 628, 1205, 628],
    [147, 250, 147, 418], [1062, 250, 1062, 418], [147, 905, 147, 1085], [1062, 905, 1062, 1085],
    [403, 318, 500, 318], [710, 318, 806, 318], [497, 250, 497, 320], [711, 250, 711, 320],
    [604, 790, 604, 850], [88, 1055, 210, 990], [210, 990, 285, 1077], [998, 990, 1113, 1050],
    [923, 1077, 998, 990], [277, 1187, 355, 1130], [855, 1130, 933, 1187],
  ];
  for (const [x1, y1, x2, y2] of ticks) add(line(u(x1, y1), u(x2, y2), 2), true);
  return pieces;
}

/** Répartit les profondeurs dans un ordre mêlé mais stable : chaque page en traverse quelques-uns. */
function buildPieces(): Piece[] {
  const raw = logoPieces();
  const order = raw.map((_, index) => index);
  const hash = (n: number) => {
    const x = Math.sin(n * 91.7 + 13.3) * 43758.5453;
    return x - Math.floor(x);
  };
  order.sort((a, b) => hash(a) - hash(b));
  return raw.map(([points, tick], index) => {
    const rank = order.indexOf(index);
    const flat = new Float32Array(points.length * 2);
    points.forEach(([x, y], i) => {
      flat[i * 2] = x;
      flat[i * 2 + 1] = y;
    });
    return { points: flat, tick, depth: NEAREST + ((FARTHEST - NEAREST) * rank) / (raw.length - 1) };
  });
}

export function createLogoTunnel(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  const pieces = buildPieces();
  let width = 0;
  let height = 0;
  let ratio = 1;
  let drawn = Number.NaN;

  const styles = getComputedStyle(canvas);
  const linen = styles.getPropertyValue('--linen').trim() || '#d9c7a4';

  const resize = () => {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    drawn = Number.NaN;
  };

  /** @param position caméra, en écrans (0 = accueil, 1 = écran suivant…). */
  const draw = (position: number) => {
    if (!context || width === 0) return;
    if (Math.abs(position - drawn) < 0.0005) return;
    drawn = position;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.strokeStyle = linen;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    const size = Math.min(width * 0.34, height * 0.4);
    const centerX = width / 2;
    const centerY = height * CENTER_Y;
    // Caméra : avance de `position` et dérive doucement, sans bouger à l'accueil.
    const camX = SWAY_X * Math.sin(position * 0.8);
    const camY = SWAY_Y * Math.sin(position * 0.55);

    for (const piece of pieces) {
      const distance = piece.depth - position;
      if (distance <= 0.05) continue; // déjà traversé
      const scale = piece.depth / distance;
      // Il s'efface en passant près de la caméra, et quand il devient démesuré.
      const fade = Math.min(1, (distance - 0.05) / 0.45) * Math.min(1, Math.max(0, (14 - scale) / 6));
      const alpha = (piece.tick ? 0.32 : 0.55) * fade;
      if (alpha <= 0.004) continue;

      context.globalAlpha = alpha;
      context.lineWidth = Math.min(7, (piece.tick ? 0.7 : 1.7) * scale);
      const points = piece.points;
      context.beginPath();
      for (let i = 0; i < points.length; i += 2) {
        // Point posé en scène à p × Z, vu depuis la caméra décalée.
        const x = centerX + ((points[i] * piece.depth - camX) / distance) * size;
        const y = centerY + ((points[i + 1] * piece.depth - camY) / distance) * size;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
    context.globalAlpha = 1;
  };

  resize();
  return { draw, resize };
}
