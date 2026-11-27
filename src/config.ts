/**
 * Sections et mentions optionnelles.
 *
 * Passer une valeur à `false`, puis relancer le site (`npm run dev` ou `npm run build`),
 * retire le bloc correspondant. Aucun autre fichier n'a besoin d'être modifié.
 *
 * La section Stage (soirée du 4 décembre 2026 et stage des 5-6 décembre 2026)
 * est à retirer après le 6 décembre 2026 : `showStage: false`.
 */
export const flags = {
  /** Bandeau Actualités : adhérer, stage en cours, calendrier d'absences. */
  showActualites: true,

  /** Bibliothèque associative (liste interne de 2022). */
  showRessources: true,

  /**
   * Tarif réduit 85 €.
   * Présent sur la page Inscriptions du site actuel, absent des cases du formulaire PDF 2026-2027.
   */
  showTarifReduit: true,

  /**
   * Bloc réinscriptions.
   * La page HTML et le PDF ne disent pas la même chose : les deux formulations
   * sont affichées, sans trancher.
   */
  showReinscriptions: true,

  /** Soirée mantras et stage « Passages », 4-6 décembre 2026. */
  showStage: true,
} as const;

export type Flags = typeof flags;
