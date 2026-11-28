/** Faits repris du site et du formulaire 2026-2027. Aucun horaire ni tarif inventé. */

export const association = {
  name: 'Chemins d’Éveil',
  email: 'yogaperrigny@orange.fr',
  phoneDisplay: '06 01 86 51 07',
  phoneTel: '+33601865107',
  phonePerson: 'Marc Comment',
  phoneEmail: 'marc.comment@orange.fr',
  street: '76 rue du moulin',
  postal: '39570 Perrigny',
  place: 'Salle de sports (au-dessus de la salle des fêtes)',
} as const;

/** Documents de l'association, servis par le site lui-même (public/documents/) :
    ils restent disponibles quand l'ancien site yoga-perrigny.com sera fermé. */
const documents = `${import.meta.env.BASE_URL}documents/`;

export const pdfs = {
  inscription: `${documents}inscription-2026-2027.pdf`,
  absences: `${documents}interruptions-2026-2027.pdf`,
  stage: `${documents}stage-passages-decembre-2026.pdf`,
  bibliotheque: `${documents}bibliotheque-2022.pdf`,
  article: `${documents}article-2025.pdf`,
  ficheOdile: `${documents}fiche-odile-sappez.pdf`,
  ficheAnneMarie: `${documents}presentation-anne-marie-meudre.pdf`,
} as const;

/** Lectures conseillées par l'UJ-BEY (Union Jura-Bresse des Enseignants de Yoga). */
export const ujbeyReadings = 'https://ujbeyoga.wixsite.com/ujbey/lectures';

export const itinerary =
  'https://www.openstreetmap.org/search?query=76%20rue%20du%20moulin%2C%2039570%20Perrigny%2C%20France';

/**
 * Grille retenue : formulaire d'inscription 2026-2027 (édition juin 2026).
 * Yoga adapté : mardi 15 h 00 – 16 h 15 avec Odile Sappez, confirmé par l'association.
 * L'ancienne page « Horaires » de yoga-perrigny.com (jeudi, Françoise Bataillard) est périmée.
 */
export const days = [
  {
    id: 'lundi',
    label: 'Lundi',
    sessions: [
      {
        time: '18 h 45 à 20 h 15',
        type: 'Yoga classique',
        teacher: 'Françoise Bataillard',
      },
    ],
  },
  {
    id: 'mardi',
    label: 'Mardi',
    sessions: [
      {
        time: '15 h 00 à 16 h 15',
        type: 'Yoga adapté',
        teacher: 'Odile Sappez',
      },
      {
        time: '17 h 00 à 18 h 30',
        type: 'Yoga classique',
        teacher: 'Sandrine Peyronel',
      },
      {
        time: '18 h 45 à 20 h 15',
        type: 'Yoga classique',
        teacher: 'Sandrine Peyronel',
      },
    ],
  },
  {
    id: 'mercredi',
    label: 'Mercredi',
    sessions: [
      {
        time: '17 h 45 à 19 h 15',
        type: 'Yoga classique',
        teacher: 'Sandrine Peyronel',
      },
      {
        time: '19 h 30 à 21 h 00',
        type: 'Yoga classique',
        teacher: 'Anne-Marie Meudre',
      },
    ],
  },
] as const;

export const nav = [
  { id: 'club', label: 'Le club' },
  { id: 'cours', label: 'Cours' },
  { id: 'horaires', label: 'Horaires' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'stage', label: 'Stages', flag: 'showStage' as const },
  { id: 'professeurs', label: 'Professeurs' },
  { id: 'lieu', label: 'Lieu' },
  { id: 'contact', label: 'Contact' },
] as const;
