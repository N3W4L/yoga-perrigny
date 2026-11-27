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

export const pdfs = {
  inscription: 'https://yoga-perrigny.com/wafx_res/Files/inscription%202026-2027.pdf',
  absences: 'https://yoga-perrigny.com/wafx_res/Files/Absence%20vac%20toussaint%20noel%20yoga%202026.pdf',
  stage:
    'https://yoga-perrigny.com/wafx_res/Files/Stage%20et%20soiree%205%20et%206%20dec%2026%20avec%20Sybille%20et%20Fran%C3%A7ois.pdf',
  bibliotheque: 'https://yoga-perrigny.com/wafx_res/Files/livres%20bibli%202022.pdf',
  article: 'https://yoga-perrigny.com/wafx_res/Files/article%20Yoga%202025%20V2.PDF',
} as const;

export const itinerary =
  'https://www.openstreetmap.org/search?query=76%20rue%20du%20moulin%2C%2039570%20Perrigny%2C%20France';

/** Grille retenue : formulaire d'inscription 2026-2027 (yoga adapté le mardi, Odile Sappez). */
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
