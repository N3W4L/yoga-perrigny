/**
 * Rendu des textes saisis dans l'interface admin.
 * Mise en forme : *italique*, **gras**, [lien](adresse).
 * Un lien qui commence par « / » pointe vers le site : le préfixe de
 * publication (/yoga-perrigny/) est ajouté automatiquement.
 */
import { Marked } from 'marked';

const base = import.meta.env.BASE_URL;

/** Adresse publique d'un fichier du site (« /documents/x.pdf ») ou adresse externe. */
export function siteUrl(path: string): string {
  if (!path) return '';
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${base}${path.replace(/^\/+/, '')}`;
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const attributes = title ? ` title="${title}"` : '';
      return `<a href="${siteUrl(href)}"${attributes}>${text}</a>`;
    },
  },
});

/** Texte court sur une ligne (titres, paragraphes simples) : pas de <p>. */
export function inline(text: string): string {
  return marked.parseInline(text, { async: false }) as string;
}

/** Texte long en plusieurs paragraphes (pages légales). */
export function block(text: string): string {
  return marked.parse(text, { async: false }) as string;
}
