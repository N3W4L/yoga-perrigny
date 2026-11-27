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

## Retirer ou garder une section

Tout se règle dans `src/config.ts`. Passer une valeur à `false`, puis relancer `npm run dev` ou `npm run build`.

| Réglage | Effet quand il vaut `false` |
| --- | --- |
| `showActualites` | Retire le bandeau Actualités. Le calendrier d’absences passe sous les horaires. |
| `showRessources` | Retire la bibliothèque (liste de 2022). |
| `showTarifReduit` | Retire la carte 85 €. Cette mention est sur la page actuelle, pas sur le formulaire PDF. |
| `showReinscriptions` | Retire le bloc réinscriptions. La page HTML et le PDF ne disent pas la même chose : les deux textes sont montrés, sans trancher. |
| `showStage` | Retire la soirée et le stage des 4-6 décembre 2026, y compris le lien du menu et la ligne d’actualité. |

**Après le 6 décembre 2026**, mettre `showStage` à `false`. Le stage est dans la page d’accueil, `src/pages/index.astro`.

Les passages encore inconnus (président, RNA, hébergeur, bios, photos manquantes, crédits) sont écrits en italique entre crochets, par exemple `[à compléter]`. Ils ne sont pas inventés.

## Polices et images

Spectral (titres) et DM Sans (texte) sont dans `src/fonts/`, sous licence OFL (`OFL-Spectral.txt`, `OFL-DM-Sans.txt`). Aucun appel à un CDN de polices.

Les photos sont optimisées au build en AVIF et WebP, avec plusieurs largeurs. Le logo est détouré pour reposer sur le fond sable.

## Sécurité

`public/_headers` sert à Netlify et à Cloudflare Pages (CSP, anti-iframe, nosniff, HSTS). GitHub Pages n’envoie pas ces en-têtes : la même politique de contenu est aussi dans une balise `meta` du document, sans `frame-ancestors`, que cette balise ne sait pas porter.
