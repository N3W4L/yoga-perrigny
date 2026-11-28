# Chemins d’Éveil

Site statique de l’association **Chemins d’Éveil** (yoga à Perrigny, 39570). Il remplace, à terme, [yoga-perrigny.com](https://yoga-perrigny.com).

L’adresse publiée est `https://n3w4l.github.io/yoga-perrigny/`. L’ancienne adresse `/souffle/` renvoie vers cette page.

Page unique en français, sans traceur, sans formulaire côté serveur. Le contact se fait par courriel.

## Prérequis

- Node.js 22 ou plus récent
- npm

## Lancer le site

```bash
npm install
npm run dev
```

Le serveur local indique l’adresse (en général `http://localhost:4321/yoga-perrigny/`). Le préfixe `/yoga-perrigny/` est celui de la publication prévue : `https://n3w4l.github.io/yoga-perrigny/`.

## Construire

```bash
npm run build
```

Le résultat est dans `dist/`. Pour le regarder tel qu’il sera publié :

```bash
npm run preview
```

## Publication

Le fichier `.github/workflows/pages.yml` construit le site à chaque pull request et à chaque push sur `main`. **Le déploiement vers GitHub Pages ne se fait qu’au push sur `main`.** Une pull request ne déploie rien.

Ne pas modifier ici le domaine, le DNS, ni les réglages du dépôt.

## Modifier le contenu

Tout le contenu se modifie depuis l’interface d’administration, **https://n3w4l.github.io/yoga-perrigny/admin/** : textes, horaires, tarifs, professeures, stage, témoignages, photos, PDF, pages légales. Chaque enregistrement est publié automatiquement. Mode d’emploi : [`ADMIN.md`](ADMIN.md).

Les données sont dans `src/contenu/` (un fichier JSON par écran, et `pages/*.md` pour les pages légales), vérifiées à chaque build par `src/contenu/index.ts` : un champ manquant arrête la publication avec un message clair, sans toucher au site en ligne.

Dans **Réglages et coordonnées**, deux cases affichent ou masquent le stage (écrans Stage et Programme, entrée du menu, ligne « À la une ») et le bloc « À la une ». **Après le 6 décembre 2026**, décocher « Le stage ».

Les informations encore inconnues (président, bios, photos, crédits…) ne sont pas inventées ni annotées sur la page d’accueil : elles sont listées dans `A-COMPLETER.md`.

## Polices et images

Spectral (titres) et DM Sans (texte) sont dans `src/fonts/`, sous licence OFL (`OFL-Spectral.txt`, `OFL-DM-Sans.txt`). Aucun appel à un CDN de polices.

Les photos sont retouchées par `node scripts/photos.mjs` : cadrage (3:2 pour la salle, 4:5 pour le bâtiment, carré pour le portrait) et étalonnage commun accordé à la palette. Sur la page, elles ont des coins en superellipse (`corner-shape: squircle`, coins arrondis classiques sinon) et une ombre douce. Les originaux restent intacts dans `src/assets/sources/`. Astro les optimise ensuite au build en AVIF et WebP, avec plusieurs largeurs. Le logo est détouré pour reposer sur le fond sable.

L’image de partage (`public/og.jpg`, 1200 × 630) est une capture de l’accueil.

## Sécurité

`public/_headers` sert à Netlify et à Cloudflare Pages (CSP, anti-iframe, nosniff, HSTS). GitHub Pages n’envoie pas ces en-têtes : la même politique de contenu est aussi dans une balise `meta` du document, sans `frame-ancestors`, que cette balise ne sait pas porter.
