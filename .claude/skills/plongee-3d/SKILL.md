---
name: plongee-3d
description: Comprendre et régler l'effet de plongée 3D au défilement du site Chemins d'Éveil (souffle.css, souffle.ts) - profondeur, anneaux, ajout ou retrait d'un écran - sans perdre la fluidité.
---

# La plongée 3D

## Principe

- `.journey` fait N hauteurs d'écran ; un rail invisible de `.snap-stop` donne un
  cran (scroll-snap) par écran. Molette, flèches, Page suivante, espace, Début et
  Fin passent d'un écran à l'autre sans script.
- `.tunnel` reste collé à l'écran. Dedans, chaque section `.plane` et chaque
  anneau `.gate` est un **calque plat** dont seules l'**échelle** et
  l'**opacité** changent. Pour des plans face à la caméra, c'est la même
  projection qu'une perspective : échelle = 1 / (1 + 0,6 × distance).
- Les animations sont liées au défilement en CSS (`animation-timeline: scroll()`,
  `@keyframes dive` et `pass` à la fin de `src/styles/souffle.css`). Le
  navigateur les calcule hors du fil principal.
- `src/scripts/souffle.ts` ne fait que :
  - poser `is-live` sur les 3 ou 4 calques proches (les autres ne sont pas rendus) ;
  - marquer le menu actif et l'anneau de progression ;
  - gérer les liens d'ancre, le focus clavier et Échap.

  Sans `animation-timeline` (Firefox), il applique lui-même les tables `DIVE` et `PASS`.

## Régler l'effet

- Profondeur, vitesse d'apparition : paliers de `@keyframes dive`. 50 % = écran au
  repos (échelle 1, opacité 1) : ne pas déplacer ce palier, c'est là que le cran s'arrête.
- Anneaux : `@keyframes pass`. 91 % = moment où l'anneau traverse la caméra.
  Au repos, un anneau est vers 45 % : garder son opacité basse (≈ 0,25) pour la
  lisibilité du texte.
- **Toute modification d'un palier se reporte dans `DIVE` ou `PASS` de
  souffle.ts** (mêmes valeurs [progression, opacité, échelle]).

## Règles de performance (ne pas enfreindre)

1. N'animer que `transform` et `opacity`. Pas de `filter: blur`, pas de
   `mix-blend-mode`, pas d'ombres animées. La version d'origine (scène
   `preserve-3d`, flou animé) tournait à environ 22 images/s.
2. Pas de variable CSS modifiée à chaque image : elle relance le style de tout
   l'écran. Les variables `--i` et `--g` sont fixes, posées par
   `[data-station]` et `[data-i]`.
3. Échelle maximale d'un écran : environ 1,3, et d'un anneau : environ 1,6. Au-delà,
   le navigateur rastérise d'énormes textures.
4. `animation-timeline` doit rester **dans le bloc `@supports` séparé**. Sinon
   le minifieur le fusionne dans le raccourci `animation`, que les navigateurs
   rejettent : l'effet disparaît sans erreur.
5. Mesurer avec la compétence `verifier-site` (perf.cjs) avant et après.

## Ajouter ou retirer un écran

1. Dans `src/pages/index.astro` : la section avec `class="plane …"`,
   `data-station` à la bonne position, puis un `<Gate i={…} />` entre deux écrans.
   Renuméroter ceux qui suivent.
2. Mettre à jour `data-stations` sur `.journey`. Les hauteurs
   `.journey[data-stations='7'|'8']` et les règles `--i` et `--g` de souffle.css
   vont jusqu'à 8 écrans : en ajouter si besoin.
3. Ajouter le lien dans les deux menus (`.s-links` et `.s-panel`).
4. Vérifier qu'aucun écran ne déborde en 1280×720.
