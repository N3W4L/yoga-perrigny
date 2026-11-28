---
name: contenu-asso
description: Règles de contenu du site de l'association Chemins d'Éveil (yoga à Perrigny) - ne rien inventer, où se trouvent horaires, tarifs et réglages, conventions de rédaction. À suivre pour toute modification de texte ou d'information.
---

# Contenu du site Chemins d'Éveil

## Ne rien inventer

- Horaires, tarifs, noms, dates : uniquement ce que donnent le site actuel
  (yoga-perrigny.com) ou les PDF de l'association (dans `public/documents/`).
- **Aucune annotation sur le site** : pas de crochets « [à compléter] », pas
  de note de travail visible. Une information manquante est simplement absente
  de la page et notée dans `A-COMPLETER.md` (racine du dépôt, non publiée).
- **Pas de repli « + »** : toutes les informations sont affichées en direct.
  Si un écran du trajet 3D déborde, répartir le contenu sur un écran de plus
  (voir la compétence `plongee-3d`) plutôt que de le replier.
- Quand deux sources se contredisent, n'afficher qu'une version cohérente et
  noter l'écart dans `A-COMPLETER.md` pour que l'association tranche.

## Où se trouve quoi

- **Tout le texte du site** : `src/contenu/*.json` (un fichier par écran, plus
  `reglages.json` pour les coordonnées et les cases « afficher ») et
  `src/contenu/pages/*.md` (pages légales). Ces fichiers sont aussi modifiés
  par l'interface /admin (Sveltia CMS, `public/admin/config.yml`) : garder
  les deux en accord. Un champ ajouté au JSON doit l'être aussi dans le schéma
  `src/contenu/index.ts` et dans `config.yml`.
- **Grille des séances** : `src/contenu/seances.json`. Les créneaux des
  professeures et du yoga adapté en sont tirés (`slotsOf`, `adaptedSlots`).
- **Stage** : la case `afficher.stage` de `reglages.json` le masque partout.
  **Après le 6 décembre 2026 : la décocher.**
- `public/documents/` : les PDF de l'association.
- `src/pages/index.astro` : la mise en page et l'ordre des écrans (`stations`).
  Le menu du haut se construit depuis `menu` (`src/contenu/index.ts`).
- Mise en forme autorisée dans les textes : `*italique*`, `**gras**`,
  `[lien](adresse)` (rendu par `src/lib/md.ts`).

## Photos

- Originaux dans `src/assets/sources/` (jamais modifiés), versions retouchées
  produites par `npm run photos` dans `src/assets/photos/` (cadrage et
  étalonnage commun). Le contenu référence une photo par `/photos/nom.jpg`.
  Pour une nouvelle photo : l'ajouter aux sources, ajouter une entrée au
  script, le relancer. Ne pas publier de photo sans l'accord des personnes
  reconnaissables (voir `A-COMPLETER.md`).

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
