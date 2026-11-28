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

/** Forme stable d'un anneau : légère ellipse, inclinaison et teinte propres. */
function shapeOf(index: number) {
  const hash = (n: number) => {
    const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    aspect: 0.86 + hash(1) * 0.1,
    tilt: (hash(2) - 0.5) * 0.5,
    sage: index % 3 === 1,
  };
}

export function createTunnel(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let ratio = 1;
  let drawn = Number.NaN;

  const styles = getComputedStyle(canvas);
  const linen = styles.getPropertyValue('--linen').trim() || '#d9c7a4';
  const sage = styles.getPropertyValue('--sage').trim() || '#8ea48c';

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
      context.globalAlpha = alpha;
      context.strokeStyle = shape.sage ? sage : linen;
      context.lineWidth = Math.min(4, Math.max(0.5, 1.05 * scale));
      context.beginPath();
      context.ellipse(centerX, centerY, radius, radius * shape.aspect, shape.tilt, 0, Math.PI * 2);
      context.stroke();
    }
    context.globalAlpha = 1;
  };

  resize();
  return { draw, resize };
}
