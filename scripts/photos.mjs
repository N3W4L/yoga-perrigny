/**
 * Retouche des photos du site (à relancer si une photo source change) :
 *   node scripts/photos.mjs
 *
 * Sources : src/assets/sources/ (originaux, jamais modifiés).
 * Sorties : src/assets/ (utilisées par la page, optimisées ensuite par Astro).
 *
 * Étalonnage commun, accordé à la palette (sable, lin, sauge) : saturation
 * réduite, noirs légèrement relevés (rendu mat), tonalité chaude, verts
 * apaisés, légère accentuation. Cadrages : 3:2 (salle), 4:5 (bâtiment),
 * carré centré sur le visage (portrait).
 */
import sharp from 'sharp';

const src = new URL('../src/assets/sources/', import.meta.url).pathname;
const out = new URL('../src/assets/', import.meta.url).pathname;

const grade = (image) =>
  image
    // Verts et rouges calmés, légère chaleur (matrice RVB).
    .recomb([
      [1.04, 0.04, -0.02],
      [0.06, 0.9, 0.04],
      [0.02, 0.06, 0.84],
    ])
    .modulate({ saturation: 0.68, brightness: 1.03, hue: -9 })
    // Noirs relevés, contraste un peu adouci : rendu mat.
    .linear(0.9, 14)
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 });

const jobs = [
  {
    // Cours dans la salle de sports, version 1200 × 630 (ancienne image de
    // partage du site) : cadrage 3:2 sur le groupe.
    file: 'salle-2025-grande.jpg',
    output: 'salle-2025-cadre.jpg',
    crop: { left: 140, top: 0, width: 945, height: 630 },
    width: 1100,
  },
  {
    // Bâtiment rue du moulin, 1024 × 768 : cadrage 4:5 sur la façade et les fleurs.
    file: 'salle-exterieur.jpg',
    output: 'salle-exterieur-cadre.jpg',
    crop: { left: 330, top: 0, width: 614, height: 768 },
    width: 900,
  },
  {
    // Portrait d'Anne-Marie Meudre, tiré de sa plaquette (978 × 677).
    file: 'portrait-anne-marie-meudre-plaquette.png',
    output: 'portrait-anne-marie-meudre.jpg',
    crop: { left: 225, top: 40, width: 560, height: 560 },
    width: 320,
  },
];

for (const job of jobs) {
  const image = sharp(src + job.file).extract(job.crop).resize({ width: job.width, kernel: 'lanczos3' });
  await grade(image).jpeg({ quality: 90, mozjpeg: true }).toFile(out + job.output);
  console.log(`${job.output} : ${job.width} px`);
}
