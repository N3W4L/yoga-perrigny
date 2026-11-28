/**
 * Logo en anamorphose pour le trajet 3D.
 *
 * Le « O » du logo (cercle, tige, courbes, arche et traits de construction)
 * est découpé trait par trait, aux angles du dessin. Chaque trait est posé
 * à une profondeur différente le long du trajet. Chaque morceau est agrandi en proportion de sa distance : depuis
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

/** Profondeur du premier trait traversé, en écrans. Le dernier est posé un
    peu au-delà du dernier écran (FARTHEST_MARGIN) : on traverse le logo sur
    tout le trajet, quel que soit le nombre d'écrans. */
const NEAREST = 0.85;
const FARTHEST_MARGIN = 1.3;
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

  // Un morceau par trait d'esquisse, coupé aux angles.
  // Grand cercle : deux moitiés, coupées au milieu en haut, qui finissent aux
  // angles où le cercle rejoint les courbes, à gauche et à droite.
  add(arc(1, 137.6, 270, 40));
  add(arc(1, 270, 402.4, 40));

  // Tige : la barre du haut, d'angle à angle.
  add(line(u(500, 320), u(710, 320)));
  // De chaque côté, un seul trait du coin de la barre jusqu'au cercle :
  // le montant puis la courbe, sans angle entre les deux.
  const left = [u(500, 520), u(500, 770), u(430, 880), u(210, 990)] as const;
  const right = [u(710, 520), u(710, 770), u(780, 880), u(998, 990)] as const;
  add([...line(u(500, 320), u(500, 520), 4), ...cubic(left[0], left[1], left[2], left[3], 0, 1, 28).slice(1)]);
  add([...line(u(710, 320), u(710, 520), 4), ...cubic(right[0], right[1], right[2], right[3], 0, 1, 28).slice(1)]);

  // Arche : chaque pente de la base au sommet, et l'arc du bas d'un angle à l'autre.
  add(cubic(u(355, 1130), u(445, 1060), u(550, 930), u(604, 848), 0, 1, 20));
  add(cubic(u(855, 1130), u(765, 1060), u(660, 930), u(604, 848), 0, 1, 20));
  add(arc(1.041, 63.4, 116.5, 16));

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

/**
 * Profondeurs. Les traits du logo sont répartis sur tout le trajet dans un
 * ordre choisi : les deux moitiés du cercle loin l'une de l'autre, pour que la
 * coupure se voie dès le départ ; on en traverse un par page environ. Les
 * traits de construction s'intercalent, dans un ordre mêlé mais stable.
 * Indices dans l'ordre de logoPieces : 0-1 moitiés du cercle, 2 barre,
 * 3-4 traits gauche et droit, 5-6 pentes de l'arche, 7 arc du bas.
 */
const OUTLINE_ORDER = [2, 0, 4, 5, 7, 3, 6, 1];

function buildPieces(farthest: number): Piece[] {
  const raw = logoPieces();
  const outlineCount = raw.filter(([, tick]) => !tick).length;
  const hash = (n: number) => {
    const x = Math.sin(n * 91.7 + 13.3) * 43758.5453;
    return x - Math.floor(x);
  };
  const span = farthest - NEAREST;
  return raw.map(([points, tick], index) => {
    const flat = new Float32Array(points.length * 2);
    points.forEach(([x, y], i) => {
      flat[i * 2] = x;
      flat[i * 2 + 1] = y;
    });
    const depth = tick
      ? NEAREST + span * hash(index)
      : NEAREST + (span * (OUTLINE_ORDER.indexOf(index) + 0.3)) / outlineCount;
    return { points: flat, tick, depth };
  });
}

/** @param lastStation indice du dernier écran du trajet. */
export function createLogoTunnel(canvas: HTMLCanvasElement, lastStation: number) {
  const context = canvas.getContext('2d');
  const pieces = buildPieces(Math.max(2, lastStation) + FARTHEST_MARGIN);
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
