/**
 * Photos choisies dans l'interface admin : elles sont rangées dans
 * src/assets/photos/ et le contenu garde leur chemin (« /photos/nom.jpg »).
 * On retrouve ici l'image correspondante pour qu'Astro l'optimise.
 */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

const byName = new Map(Object.entries(files).map(([path, module]) => [path.split('/').pop()!, module.default]));

/** Image d'une photo du contenu, ou null si le champ est vide. */
export function photo(path: string): ImageMetadata | null {
  if (!path) return null;
  const name = path.split('/').pop()!;
  const image = byName.get(name);
  if (!image) {
    throw new Error(
      `Photo introuvable : « ${path} ». Elle doit se trouver dans src/assets/photos/ (choisissez-la depuis l'interface admin).`,
    );
  }
  return image;
}
