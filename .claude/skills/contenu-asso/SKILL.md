---
name: contenu-asso
description: Règles de contenu du site de l'association Chemins d'Éveil (yoga à Perrigny) - ne rien inventer, où se trouvent horaires, tarifs et réglages, conventions de rédaction. À suivre pour toute modification de texte ou d'information.
---

# Contenu du site Chemins d'Éveil

## Ne rien inventer

- Horaires, tarifs, noms, dates : uniquement ce que donnent le site actuel
  (yoga-perrigny.com) ou les PDF de l'association (liens dans `src/data/site.ts`).
- **Aucune annotation sur le site** : pas de crochets « [à compléter] », pas
  de note de travail visible. Une information manquante est simplement absente
  de la page et notée dans `A-COMPLETER.md` (racine du dépôt, non publiée).
- **Pas de repli « + »** : toutes les informations sont affichées en direct.
  Si un écran du trajet 3D déborde, répartir le contenu sur un écran de plus
  (voir la compétence `plongee-3d`) plutôt que de le replier.
- Quand deux sources se contredisent, n'afficher qu'une version cohérente et
  noter l'écart dans `A-COMPLETER.md` pour que l'association tranche.

## Où se trouve quoi

- `public/documents/` : les PDF de l'association (formulaire, interruptions,
  plaquette du stage, bibliothèque, article, fiches des professeures). Pour une
  nouvelle édition, remplacer le fichier en gardant son nom, ou changer le chemin
  dans `pdfs` (src/data/site.ts).
- `src/data/site.ts` : coordonnées de l'association, chemins des PDF, **grille des
  séances** (`days`). Les créneaux affichés sur les cartes des professeures en
  sont tirés automatiquement (`slotsOf` dans index.astro), comme le créneau
  du yoga adapté : ne modifier qu'à un seul endroit.
- `src/pages/index.astro`, en tête : l'ordre des écrans (`stations`), le menu
  du haut (`menu`, une entrée par écran ; un sous-écran pointe vers son parent
  avec `data-nav`), les
  professeures et leur présentation (`teachers`), les adresses d'envoi des
  fiches (`senders`), les témoignages (`voices`). Les numéros de chapitre
  (01, 02…) se calculent depuis `stations`.
- `src/config.ts` : sections optionnelles (`showStage`, `showActualites`,
  `showRessources`, `showTarifReduit`, `showReinscriptions`). **Après le
  6 décembre 2026 : `showStage: false`.**
- `src/pages/index.astro` : textes de toutes les sections.
- Pages légales : `src/pages/mentions-legales.astro`, `src/pages/confidentialite.astro`.

## Rédaction

- Une information courte tient sur une ligne : préférer « Chèque à la
  professeure, adhésion en plus. » à une phrase qui se coupe. Vérifier avec
  `lignes.cjs` (compétence `verifier-site`).

- Français, apostrophe typographique (’), espaces avant « ; : ! ? » comme dans le texte existant.
- Les enseignantes sont toutes des femmes : « professeures », y compris dans le menu.
- Ton sobre, sans promesse de résultat ni vocabulaire marketing.
- Le site n'a ni traceur, ni formulaire, ni police ou script venus d'un CDN :
  le contact se fait par courriel. Ne pas en ajouter.

## Après une modification

Lancer la compétence `verifier-site` : un texte plus long peut faire déborder un
écran du trajet 3D en 1280×720.
