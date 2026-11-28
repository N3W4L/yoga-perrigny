/**
 * Tunnel d'anneaux du trajet 3D.
 *
 * Des anneaux sont posés à intervalles réguliers en profondeur sur tout le
 * trajet (et au-delà : le tunnel ne finit pas). La caméra avance avec le
 * défilement ; on traverse les anneaux un par un et l'on en voit toujours
 * une dizaine s'enfoncer vers le point de fuite.
 *
 * Tout est dessiné sur un seul canevas, redessiné seulement quand la
 * position change : un calque, des traits nets à toute taille, une douzaine
 * d'ellipses par image.
 */

/** Anneaux par écran : 3 = on en traverse trois entre deux sections. */
const RINGS_PER_STATION = 3;
/** Profondeur visible, en intervalles d'anneaux. */
const DEPTH = 11;
/** Distance focale (en intervalles) : plus petite = perspective plus forte. */
const FOCAL = 0.55;
/** Centre du tunnel, en fraction de la hauteur (aligné sur transform-origin des écrans). */
const CENTER_Y = 0.46;

/** Points du contour d'un anneau (rayon unité, avant inclinaison). */
const POINTS = 96;

interface Shape {
  /** Contour : [x, y] alternés, autour de (0, 0), rayon ≈ 1. */
  outline: Float32Array;
  /** Inclinaison, en radians. */
  tilt: number;
  /** Léger décalage du centre : le tunnel serpente un peu. */
  dx: number;
  dy: number;
  /** Épaisseur relative du trait. */
  weight: number;
  /** Teinte : 0 lin, 1 sauge, 2 sable. */
  tone: 0 | 1 | 2;
  /** Anneau doublé d'un second trait fin. */
  double: boolean;
}

/**
 * Forme propre à chaque anneau, stable d'une image à l'autre : un ovale plus
 * ou moins aplati dont le rayon ondule doucement (quelques harmoniques), pour
 * un tracé organique, jamais deux fois le même.
 */
function makeShape(index: number): Shape {
  const hash = (n: number) => {
    const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const aspect = 0.66 + hash(1) * 0.32;
  const waves = [
    { k: 2, a: 0.015 + hash(3) * 0.05, p: hash(4) * Math.PI * 2 },
    { k: 3, a: hash(5) * 0.045, p: hash(6) * Math.PI * 2 },
    { k: 4, a: hash(7) * 0.022, p: hash(8) * Math.PI * 2 },
    { k: 5, a: hash(9) * 0.014, p: hash(10) * Math.PI * 2 },
  ];
  const outline = new Float32Array(POINTS * 2);
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * Math.PI * 2;
    let radius = 1;
    for (const wave of waves) radius += wave.a * Math.cos(wave.k * angle + wave.p);
    outline[i * 2] = Math.cos(angle) * radius;
    outline[i * 2 + 1] = Math.sin(angle) * radius * aspect;
  }
  const toneDraw = hash(11);
  return {
    outline,
    tilt: (hash(2) - 0.5) * 1.1,
    dx: (hash(12) - 0.5) * 0.09,
    dy: (hash(13) - 0.5) * 0.07,
    weight: 0.55 + hash(14) * 1.05,
    tone: toneDraw < 0.58 ? 0 : toneDraw < 0.86 ? 1 : 2,
    double: hash(15) < 0.22,
  };
}

const shapes = new Map<number, Shape>();
function shapeOf(index: number) {
  let shape = shapes.get(index);
  if (!shape) {
    shape = makeShape(index);
    shapes.set(index, shape);
  }
  return shape;
}

export function createTunnel(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let ratio = 1;
  let drawn = Number.NaN;

  const styles = getComputedStyle(canvas);
  const tones = [
    styles.getPropertyValue('--linen').trim() || '#d9c7a4',
    styles.getPropertyValue('--sage').trim() || '#8ea48c',
    styles.getPropertyValue('--sand').trim() || '#f4eee3',
  ];

  /** Trace le contour d'un anneau, mis à l'échelle et incliné. */
  const trace = (shape: Shape, x: number, y: number, radius: number) => {
    const cos = Math.cos(shape.tilt) * radius;
    const sin = Math.sin(shape.tilt) * radius;
    const outline = shape.outline;
    context!.beginPath();
    for (let i = 0; i < outline.length; i += 2) {
      const px = x + outline[i] * cos - outline[i + 1] * sin;
      const py = y + outline[i] * sin + outline[i + 1] * cos;
      if (i === 0) context!.moveTo(px, py);
      else context!.lineTo(px, py);
    }
    context!.closePath();
    context!.stroke();
  };

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

    const camera = position * RINGS_PER_STATION;
    const centerX = width / 2;
    const centerY = height * CENTER_Y;
    // Rayon d'un anneau à un intervalle de la caméra : il encadre le contenu.
    const base = Math.min(width * 0.36, height * 0.5);

    // Du plus lointain au plus proche, pour que les proches passent devant.
    const nearest = Math.ceil(camera - 0.5 - 0.35);
    for (let index = nearest + DEPTH; index >= nearest; index--) {
      if (index < 0) continue;
      const z = index + 0.5 - camera; // distance à la caméra, en intervalles
      if (z <= -0.35 || z > DEPTH) continue;

      const scale = (1 + FOCAL) / (Math.max(z, -0.3) + FOCAL);
      const far = Math.min(1, (DEPTH - z) / 3);
      const near = Math.min(1, (z + 0.35) / 0.6);
      const alpha = 0.5 * far * near * (0.3 + 0.7 * (1 - Math.max(0, z) / DEPTH));
      if (alpha <= 0.004) continue;

      const shape = shapeOf(index);
      const radius = base * scale;
      // Le décalage est dans la scène : il se réduit avec la distance.
      const x = centerX + shape.dx * base * scale;
      const y = centerY + shape.dy * base * scale;
      context.globalAlpha = alpha;
      context.strokeStyle = tones[shape.tone];
      context.lineWidth = Math.min(4.5, Math.max(0.45, 1.05 * scale * shape.weight));
      trace(shape, x, y, radius);
      if (shape.double) {
        context.globalAlpha = alpha * 0.55;
        context.lineWidth = Math.max(0.4, 0.5 * scale);
        trace(shape, x, y, radius * 1.045);
      }
    }
    context.globalAlpha = 1;
  };

  resize();
  return { draw, resize };
}
