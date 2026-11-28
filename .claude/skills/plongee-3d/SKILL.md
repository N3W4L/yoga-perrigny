---
name: plongee-3d
description: Comprendre et régler l'effet de plongée 3D au défilement du site Chemins d'Éveil (souffle.css, souffle.ts) - profondeur, anneaux, ajout ou retrait d'un écran - sans perdre la fluidité.
---

# La plongée 3D

## Principe

- On avance **petit à petit** : le défilement natif (molette, pavé tactile,
  flèches) fait progresser la plongée en continu. Deux écrans sont séparés de
  `--stop` (150dvh, dans `html.journey-3d`) : plus grand = plongée plus lente.
- Pas de `scroll-snap` : même en `proximity`, son aimant ramène chaque cran de
  molette en arrière, et une zone plus haute que l'écran bloque le défilement à
  son bord bas. À la place, souffle.ts pose doucement l'écran **vers lequel on
  avance** quand on s'arrête à moins de 20 % de lui (jamais celui qu'on quitte).
- Les `.snap-stop` ne servent plus que de repères : souffle.ts y lit l'écart
  entre deux stations.
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
  - gérer l'aimant doux, les liens d'ancre, le focus clavier et Échap.

  Sans `animation-timeline` (Firefox), il applique lui-même les tables `DIVE` et `PASS`.

## Régler l'effet

- Profondeur, vitesse d'apparition : paliers de `@keyframes dive`. 50 % = écran au
  repos (échelle 1, opacité 1) : ne pas déplacer ce palier, c'est là que le cran s'arrête.
- Écrans : la plage d'un écran va d'une station avant à une station après
  (`animation-range` en multiples de `--stop`). Le palier 47-53 % (opacité 1)
  laisse lire l'écran avant qu'il ne parte.
- Anneaux : `@keyframes pass`, plage de g-1 à g+0,6 stations. 94 % = moment où
  l'anneau traverse la caméra. Au repos, l'anneau suivant est à 62,5 % : garder
  son opacité basse (≈ 0,25) pour la lisibilité du texte.
- **Toute modification d'un palier se reporte dans `DIVE` ou `PASS` de
  souffle.ts** (mêmes valeurs [progression, opacité, échelle]).

## Règles de performance (ne pas enfreindre)

1. N'animer que `transform` et `opacity`. Pas de `filter: blur`, pas de
   `mix-blend-mode`, pas d'ombres animées. La version d'origine (scène
   `preserve-3d`, flou animé) tournait à environ 22 images/s.
2. Pas de variable CSS modifiée à chaque image : elle relance le style de tout
   l'écran. Les variables `--i` et `--g` sont fixes, posées par
   `[data-station]` et `[data-i]`.
3. Le script ne travaille qu'à chaque image demandée (requestAnimationFrame)
   et l'aimant seulement 180 ms après l'arrêt du défilement.
4. Échelle maximale d'un écran : environ 1,3, et d'un anneau : environ 1,6. Au-delà,
   le navigateur rastérise d'énormes textures.
5. `animation-timeline` doit rester **dans le bloc `@supports` séparé**. Sinon
   le minifieur le fusionne dans le raccourci `animation`, que les navigateurs
   rejettent : l'effet disparaît sans erreur.
6. Mesurer avec la compétence `verifier-site` (perf.cjs) avant et après.

## Ajouter ou retirer un écran

1. Dans `src/pages/index.astro` : la section avec `class="plane …"`,
   `data-station` à la bonne position, puis un `<Gate i={…} />` entre deux écrans.
   Renuméroter ceux qui suivent.
2. Mettre à jour `data-stations` sur `.journey` et un `.snap-stop` de plus dans
   le rail. La hauteur du trajet se calcule depuis `--n`. Les règles `--n`,
   `--i` et `--g` de souffle.css vont jusqu'à 8 écrans : en ajouter si besoin.
3. Ajouter le lien dans les deux menus (`.s-links` et `.s-panel`).
4. Vérifier qu'aucun écran ne déborde en 1280×720.
