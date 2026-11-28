/**
 * Pages de texte (mentions légales, confidentialité) : fichiers Markdown de
 * src/contenu/pages/, avec un en-tête YAML (titre, description…), modifiables
 * depuis l'interface /admin.
 */
import { parse } from 'yaml';
import { z } from 'astro/zod';
import { block } from './md';

const sources = import.meta.glob<string>('../contenu/pages/*.md', { query: '?raw', import: 'default', eager: true });

const entete = z.object({
  titre_onglet: z.string().trim().min(1),
  description: z.string().trim().min(1),
  surtitre: z.string().trim().default(''),
  titre: z.string().trim().min(1),
});

export function textPage(nom: string) {
  const source = sources[`../contenu/pages/${nom}.md`];
  if (!source) throw new Error(`Page introuvable : src/contenu/pages/${nom}.md`);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`src/contenu/pages/${nom}.md : en-tête « --- » manquant.`);
  const resultat = entete.safeParse(parse(match[1]));
  if (!resultat.success) {
    const details = resultat.error.issues.map((issue) => `  - ${issue.path.join(' › ')} : ${issue.message}`).join('\n');
    throw new Error(`En-tête invalide dans src/contenu/pages/${nom}.md :\n${details}`);
  }
  return { ...resultat.data, html: block(match[2]) };
}
