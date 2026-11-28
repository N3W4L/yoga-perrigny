/**
 * Contenu du site, modifiable depuis l'interface /admin (Sveltia CMS) ou
 * directement dans les fichiers JSON de ce dossier.
 *
 * Chaque fichier est vérifié ici à la compilation : un champ manquant ou mal
 * rempli arrête la publication avec un message clair, au lieu de casser la page.
 *
 * Mise en forme dans les textes : *italique*, **gras**, [lien](adresse).
 * Un lien qui commence par « / » (ex. /documents/x.pdf) pointe vers le site.
 */
import { z } from 'astro/zod';
import accueilJson from './accueil.json';
import adapteJson from './adapte.json';
import clubJson from './club.json';
import contactJson from './contact.json';
import inscriptionsJson from './inscriptions.json';
import lieuJson from './lieu.json';
import professeuresJson from './professeures.json';
import reglagesJson from './reglages.json';
import seancesJson from './seances.json';
import stageJson from './stage.json';
import tarifsJson from './tarifs.json';
import temoignagesJson from './temoignages.json';

const texte = z.string({ message: 'champ manquant' }).trim().min(1, { message: 'ce champ est vide' });
const optionnel = z.string().trim().default('');
const textes = z.array(texte, { message: 'liste manquante' });
const document = z.object({ texte, fichier: texte });
const section = { menu: texte, chapitre: texte, titre: texte };

/** Écrans du trajet, dans l'ordre. Les ancres (#club…) en dépendent. */
export const sectionIds = [
  'club',
  'seances',
  'adapte',
  'professeurs',
  'tarifs',
  'inscriptions',
  'stage',
  'paroles',
  'lieu',
  'contact',
] as const;

const schemas = {
  reglages: z.object({
    seo: z.object({ titre: texte, description: texte }),
    association: z.object({
      nom: texte,
      email: z.string().email({ message: 'adresse e-mail invalide' }),
      contact_nom: texte,
      telephone_affiche: texte,
      telephone: texte,
      contact_email: z.string().email({ message: 'adresse e-mail invalide' }),
      rue: texte,
      code_postal: texte,
      ville: texte,
      salle: texte,
    }),
    itineraire: z.string().url({ message: 'adresse web invalide' }),
    afficher: z.object({
      actualites: z.boolean({ message: 'case à cocher manquante' }),
      stage: z.boolean({ message: 'case à cocher manquante' }),
    }),
  }),
  accueil: z.object({
    surtitre: texte,
    titre: texte,
    texte,
    bouton_seances: texte,
    bouton_ecrire: texte,
    a_la_une_titre: texte,
    a_la_une: z.array(z.object({ texte, cible: z.enum(sectionIds, { message: 'écran inconnu' }) })),
  }),
  club: z.object({
    ...section,
    paragraphes: textes,
    document,
    photo: texte,
    photo_description: texte,
    legende: optionnel,
  }),
  seances: z.object({
    ...section,
    accroche: texte,
    texte,
    jours: z.array(
      z.object({
        jour: texte,
        seances: z.array(
          z.object({
            horaire: texte,
            professeure: texte,
            type: z.enum(['Yoga classique', 'Yoga adapté'], { message: 'choisir « Yoga classique » ou « Yoga adapté »' }),
          }),
        ),
      }),
    ),
    interruptions: z.object({
      titre: texte,
      periodes: z.array(z.object({ titre: texte, lignes: textes })),
      document,
    }),
  }),
  adapte: z.object({
    ...section,
    accroche: texte,
    paragraphes: textes,
    intitule_seance: texte,
    infos: z.array(z.object({ intitule: texte, texte })),
  }),
  professeures: z.object({
    ...section,
    liste: z.array(
      z.object({
        nom: texte,
        initiales: z.string().trim().min(1, { message: 'ce champ est vide' }).max(3, { message: '3 lettres au plus' }),
        type: texte,
        photo: optionnel,
        presentation: textes,
        fiche: optionnel,
      }),
    ),
  }),
  tarifs: z.object({
    ...section,
    texte,
    prix: z.array(z.object({ intitule: texte, montant: texte, mentions: textes })),
    premiere_fois_titre: texte,
    premiere_fois: textes,
  }),
  inscriptions: z.object({
    ...section,
    document,
    paragraphes: textes,
    envoi_titre: texte,
    contacts: z.array(
      z.object({
        nom: texte,
        adresse: z.array(z.string()).default([]),
        telephone_affiche: optionnel,
        telephone: optionnel,
        email: optionnel,
      }),
    ),
  }),
  stage: z.object({
    ...section,
    accroche: texte,
    paragraphes: textes,
    rendez_vous: z.array(z.object({ titre: texte, prix: optionnel, paragraphes: textes })),
    document,
    programme: z.object({
      chapitre: texte,
      titre: texte,
      colonnes: z.array(z.object({ titre: texte, paragraphes: textes })),
    }),
  }),
  temoignages: z.object({
    ...section,
    citation: z.object({ texte, auteur: texte }),
    voix: z.array(z.object({ auteur: texte, phrases: textes })),
  }),
  lieu: z.object({
    ...section,
    texte_acces: texte,
    texte_itineraire: texte,
    ressources: z.array(z.string()).default([]),
    photo: texte,
    photo_description: texte,
    legende: optionnel,
  }),
  contact: z.object({
    ...section,
    texte,
    lien_envoi: texte,
    pied_de_page: texte,
  }),
};

type Schemas = typeof schemas;

function valider<K extends keyof Schemas>(nom: K, donnees: unknown): z.infer<Schemas[K]> {
  const resultat = schemas[nom].safeParse(donnees);
  if (!resultat.success) {
    const details = resultat.error.issues
      .map((issue) => `  - ${issue.path.join(' › ') || '(racine)'} : ${issue.message}`)
      .join('\n');
    throw new Error(`Contenu invalide dans src/contenu/${nom}.json :\n${details}`);
  }
  return resultat.data;
}

export const reglages = valider('reglages', reglagesJson);
export const accueil = valider('accueil', accueilJson);
export const club = valider('club', clubJson);
export const seances = valider('seances', seancesJson);
export const adapte = valider('adapte', adapteJson);
export const professeures = valider('professeures', professeuresJson);
export const tarifs = valider('tarifs', tarifsJson);
export const inscriptions = valider('inscriptions', inscriptionsJson);
export const stage = valider('stage', stageJson);
export const temoignages = valider('temoignages', temoignagesJson);
export const lieu = valider('lieu', lieuJson);
export const contact = valider('contact', contactJson);

export const association = reglages.association;

/** Le stage s'affiche-t-il ? (réglage « afficher le stage »). */
export const showStage = reglages.afficher.stage;

/** Menu du haut : une entrée par écran, libellés tirés de chaque section. */
export const menu = [
  { id: 'club', label: club.menu },
  { id: 'seances', label: seances.menu },
  { id: 'adapte', label: adapte.menu },
  { id: 'professeurs', label: professeures.menu },
  { id: 'tarifs', label: tarifs.menu },
  { id: 'inscriptions', label: inscriptions.menu },
  ...(showStage ? [{ id: 'stage', label: stage.menu }] : []),
  { id: 'paroles', label: temoignages.menu },
  { id: 'lieu', label: lieu.menu },
  { id: 'contact', label: contact.menu },
];

/** Créneaux d'une professeure, tirés de la grille des séances. */
export const slotsOf = (nom: string) =>
  seances.jours.flatMap((jour) =>
    jour.seances.filter((seance) => seance.professeure === nom).map((seance) => `${jour.jour} · ${seance.horaire}`),
  );

/** Séances de yoga adapté, tirées de la grille. */
export const adaptedSlots = seances.jours.flatMap((jour) =>
  jour.seances
    .filter((seance) => seance.type === 'Yoga adapté')
    .map((seance) => ({ label: `${jour.jour} · ${seance.horaire}`, teacher: seance.professeure })),
);
