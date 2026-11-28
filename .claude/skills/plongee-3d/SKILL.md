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
- `.tunnel` reste collé à l'écran. Dedans, chaque section `.plane` est un
  **calque plat** dont seules l'**échelle** et l'**opacité** changent. Pour des
  plans face à la caméra, c'est la même projection qu'une perspective.
  L'animation est liée au défilement en CSS (`animation-timeline: scroll()`,
  `@keyframes dive` à la fin de `src/styles/souffle.css`) : le navigateur la
  calcule hors du fil principal.
- **Le décor** se choisit par la constante `DECOR` en tête de `souffle.ts` :
  - `'logo'` (par défaut, `src/scripts/logo3d.ts`) : le « O » du logo en
    anamorphose. Il est découpé trait par trait, aux angles de l'esquisse
    (cercle en deux moitiés coupées en haut, barre, deux traits tige + courbe,
    pentes et arc de l'arche, traits de construction), posés à des
    profondeurs différentes, du premier écran (`NEAREST`) jusqu'un peu après le
    dernier (`FARTHEST_MARGIN`), dans l'ordre `OUTLINE_ORDER`, et agrandis en
    proportion. Depuis l'accueil tout s'aligne ; dès qu'on avance, le logo se
    disloque et on traverse ses morceaux un par un. Projection : p × Z / (Z − c).
    `SWAY_X` et `SWAY_Y` règlent la dérive latérale de la caméra, qui révèle
    les plans. La géométrie est relevée sur le dessin du logo (fonction
    `logoPieces`).
  - `'anneaux'` : le tunnel d'anneaux décrit ci-dessous.
- **Le tunnel d'anneaux** (`src/scripts/tunnel.ts`) : des anneaux posés à
  intervalles réguliers en profondeur sur tout le trajet, et au-delà (il ne
  finit pas). Ils sont dessinés sur un seul `<canvas class="rings">`, redessiné
  seulement quand la position change. On les traverse **un par un** et l'on en
  voit toujours une dizaine s'enfoncer vers le point de fuite. Chaque anneau a sa forme
  propre (`makeShape`) : ovale plus ou moins aplati au contour ondulé,
  inclinaison, épaisseur, teinte, parfois doublé ; le tunnel serpente
  légèrement. Les formes sont stables (tirées de l'indice de l'anneau). Pas de cercle
  fixe en fond, pas de groupe d'anneaux qui avance d'un bloc. Les orbes propres
  à l'accueil et au stage sont masquées en 3D pour la même raison.
- `src/scripts/souffle.ts` ne fait que :
  - poser `is-live` sur les 3 écrans proches (les autres ne sont pas rendus) ;
  - redessiner le tunnel ;
  - marquer le menu actif et l'anneau de progression ;
  - gérer l'aimant doux, les liens d'ancre, le focus clavier et Échap.

  Sans `animation-timeline` (Firefox), il applique lui-même la table `DIVE`.

## Régler l'effet

- Profondeur, vitesse d'apparition : paliers de `@keyframes dive`. 50 % = écran au
  repos (échelle 1, opacité 1) : ne pas déplacer ce palier, c'est là que le cran s'arrête.
- Écrans : la plage d'un écran va d'une station avant à une station après
  (`animation-range` en multiples de `--stop`). Le palier 47-53 % (opacité 1)
  laisse lire l'écran avant qu'il ne parte.
- **Toute modification d'un palier de `dive` se reporte dans `DIVE` de
  souffle.ts** (mêmes valeurs [progression, opacité, échelle]).
- Tunnel, constantes en tête de `tunnel.ts` :
  - `RINGS_PER_STATION` : anneaux traversés entre deux sections (3) ;
  - `DEPTH` : profondeur visible, en anneaux (11) ;
  - `FOCAL` : force de la perspective (plus petit = plus plongeant) ;
  - `CENTER_Y` : hauteur du point de fuite (aligné sur `transform-origin` des écrans).

  L'opacité des anneaux (0,5 au maximum) règle leur présence derrière le texte.

## Règles de performance (ne pas enfreindre)

1. N'animer que `transform` et `opacity`. Pas de `filter: blur`, pas de
   `mix-blend-mode`, pas d'ombres animées. La version d'origine (scène
   `preserve-3d`, flou animé) tournait à environ 22 images/s.
2. Pas de variable CSS modifiée à chaque image : elle relance le style de tout
   l'écran. Les variables `--i` et `--g` sont fixes, posées par
   `[data-station]` et `[data-i]`.
3. Le script ne travaille qu'à chaque image demandée (requestAnimationFrame)
   et l'aimant seulement 180 ms après l'arrêt du défilement.
4. Échelle maximale d'un écran : environ 1,3. Au-delà, le navigateur
   rastérise d'énormes textures. Les anneaux restent sur le canevas : ne pas
   les remettre en calques DOM animés (un calque par anneau coûte cher).
5. `animation-timeline` doit rester **dans le bloc `@supports` séparé**. Sinon
   le minifieur le fusionne dans le raccourci `animation`, que les navigateurs
   rejettent : l'effet disparaît sans erreur.
6. Mesurer avec la compétence `verifier-site` (perf.cjs) avant et après.

## Ajouter ou retirer un écran

1. Dans `src/pages/index.astro` : la section avec `class="plane …"` et
   `data-station` à la bonne position. Renuméroter celles qui suivent.
2. Mettre à jour `data-stations` sur `.journey` et un `.snap-stop` de plus dans
   le rail. La hauteur du trajet se calcule depuis `--n`. Les règles `--n` et
   `--i` de souffle.css vont jusqu'à 8 écrans : en ajouter si besoin.
3. Ajouter l'écran à `stations` et une entrée à `menu` (en tête de
   index.astro) ; les deux menus (en ligne et mobile) se construisent depuis
   `menu`. Un sous-écran sans entrée propre porte `data-nav="<parent>"`.
4. Vérifier qu'aucun écran ne déborde en 1280×720.
