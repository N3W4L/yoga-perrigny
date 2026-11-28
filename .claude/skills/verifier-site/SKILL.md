---
name: verifier-site
description: Vérifier le site Chemins d'Éveil après une modification - build, captures de chaque écran du trajet 3D (ordinateur et mobile), contraste du texte et fluidité du défilement. À lancer avant tout commit qui touche la présentation, le CSS ou souffle.ts.
---

# Vérifier le site

Le site est une page unique en « trajet » : sur ordinateur (plus de 720 px, sans
mouvement réduit), chaque section est un écran et le défilement plonge de l'une
à l'autre. Sur mobile, la page est à plat. Il faut vérifier les deux.

## 1. Construire et servir

```bash
npm run build
npx astro preview --host 127.0.0.1 --port 4321 &   # sert dist/ sur /yoga-perrigny/
```

Le build doit finir par `Complete!` sans erreur.

## 2. Captures et débordements

```bash
node .claude/skills/verifier-site/scripts/captures.cjs http://127.0.0.1:4321/yoga-perrigny/ <dossier> <préfixe>
```

- Une capture par écran en 1440×900 et 1280×720, plus la page mobile entière (390 px).
- La sortie signale `⚠ déborde` quand le contenu d'un écran dépasse la hauteur
  ou passe sous la barre de navigation : en 3D, rien ne défile à l'intérieur d'un
  écran, ce qui dépasse est perdu. Le 1280×720 est le cas le plus serré.
- Regarder les captures (assemblées en planche si besoin) : alignements, espace vide,
  textes qui se chevauchent avec les anneaux.

Pour une comparaison avant/après, copier `dist/` avant la modification, la servir
sur un autre port (`python3 -m http.server 4400 --directory <copie-parente>`) et
comparer les mêmes captures pixel par pixel.

## 2 bis. Toutes les tailles d'écran

```bash
node .claude/skills/verifier-site/scripts/tailles.cjs
```

14 tailles, du petit mobile (320 px) au grand écran (2560 px), plus le
téléphone en paysage. Le trajet 3D ne s'active qu'à partir de 768 × 640 px
(souffle.ts) ; en dessous, lecture à plat. Toute ligne autre que « OK »
signale un écran coupé ou un débordement horizontal.

## 3. Contraste

```bash
node .claude/skills/verifier-site/scripts/contraste.cjs http://127.0.0.1:4321/yoga-perrigny/
```

Liste les textes sous le seuil WCAG AA (4,5:1, ou 3:1 pour les grands textes)
sur chaque écran en mode 3D. La version à plat (mobile, fond sable) se vérifie
avec axe-core en 390 px (section 4 bis). Aucune ligne = tout passe. Le fond pris par défaut
est le vert sombre du tunnel.

## 3 bis. Retours à la ligne évitables

```bash
node .claude/skills/verifier-site/scripts/lignes.cjs http://127.0.0.1:4321/yoga-perrigny/ 1280 720
```

Liste, écran par écran, les textes coupés sur 2 ou 3 lignes dont la dernière
est courte. Raccourcir le texte, élargir la colonne ou passer en une colonne.
Faux positifs connus : le grand titre de l'accueil (deux lignes voulues), le
pied de l'accueil, les boutons, l'adresse e-mail du contact. Pour des
citations ou de la prose, quelques retours sont normaux.

## 4. Fluidité (si on touche au trajet, au CSS des écrans ou à souffle.ts)

```bash
node .claude/skills/verifier-site/scripts/perf.cjs http://127.0.0.1:4321/yoga-perrigny/ [url-de-comparaison]
```

Repère (Chromium sans carte graphique, 1440×900) : médiane 16,7 ms par image
(60 images/s). La 3D d'origine, abandonnée, était à 40-48 ms. Une médiane
au-dessus de 17 ms signale une régression : voir la compétence `plongee-3d`.

## 4 bis. Accessibilité

- axe-core (WCAG 2.2 AA) : l'injecter avec un contexte Playwright
  `bypassCSP: true` (la CSP bloque les scripts injectés), sur l'accueil en
  1440 et 390 px et sur les deux pages légales. Objectif : aucune violation.
- Parcours au clavier en mode 3D : appuyer sur Tab jusqu'au retour à
  « Aller au contenu » ; chaque élément atteint doit être visible
  (dans l'écran, opacité de son écran > 0,6). Tout le site doit être parcouru.

## 5. Avant de conclure

- Console sans erreur ni violation de CSP (la CSP interdit les attributs `style`
  et les scripts en ligne, sauf le bloc JSON-LD).
- Mobile et `prefers-reduced-motion` : la page doit rester à plat et lisible.
- Les captures sont des fichiers de travail : ne pas les commiter.
