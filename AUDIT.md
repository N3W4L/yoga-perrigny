# Audit du site — 28 novembre 2026

Périmètre : page d’accueil (trajet 3D et version à plat), mentions légales,
politique de confidentialité, page 404, interface `/admin`, chaîne de
publication (GitHub Actions). Outils : Lighthouse 12, axe-core 4 (WCAG 2.2 AA),
Playwright (17 tailles d’écran), npm audit, TypeScript, scripts du projet
(`.claude/skills/verifier-site/`).

Gravité : 🔴 bloquant · 🟠 important · 🟡 mineur · ⚪ accepté (limite connue).

## Synthèse

| Volet | Avant | Après |
| --- | --- | --- |
| Lighthouse mobile (perf / accessibilité / bonnes pratiques / SEO) | 100 / 95 / 100 / 92 | 100 / **100** / 100 / 92 ⚪ |
| Lighthouse ordinateur | 100 / 100 / 100 / 92 | 100 / 100 / 100 / 92 ⚪ |
| axe-core, 5 pages × mobile / ordinateur | 0 violation (3D) ; contraste à corriger à plat | **0 violation** |
| Tailles d’écran lisibles (sur 17 + 6 basses) | téléphone paysage et écrans bas illisibles | **toutes** |
| Erreurs TypeScript | 4 (dont 1 bug réel) | **0** |
| Vulnérabilités npm | 0 | 0 |
| Poids de l’accueil (mobile) | 137 Ko | 137 Ko |

## Constats et corrections

### Design et ergonomie

- 🔴 **Téléphone en paysage et écrans bas : texte coupé.** Le trajet 3D
  s’activait dès 720 px de large, sans condition de hauteur : sur un téléphone
  tenu en paysage (844 × 390), chaque écran était tronqué en haut et en bas.
  Même défaut, plus léger, à 1024 × 600 et à 721–767 px de large.
  → **Corrigé** : 3D seulement à partir de 768 × 640 px ; en dessous, lecture
  à plat. Le mode est recalculé quand on tourne l’appareil.
- 🟡 **Page 404 : pied de page au milieu de l’écran.** → **Corrigé** : il reste
  en bas sur les pages courtes.
- ⚪ Pages légales et 404 : habillage clair, différent de l’accueil sombre.
  Cohérent entre elles et lisible ; une harmonisation complète reste possible.

### Accessibilité

- 🟠 **Contraste des légendes photo à plat (mobile) : 4,06:1** (minimum 4,5:1),
  introduit par la transparence ajoutée lors de la retouche des photos.
  → **Corrigé** : transparence réservée au mode 3D (fond sombre, contraste
  vérifié). Lighthouse accessibilité mobile : 95 → 100.
- 🟠 **Flèches ↑ ↓ bloquées à plat** (fenêtre étroite ou tablette avec
  clavier) : le code des flèches du trajet 3D avait été dupliqué dans le mode à
  plat, où il levait une erreur et empêchait le défilement.
  → **Corrigé** (doublon supprimé ; repéré par la vérification TypeScript).
- ✅ Parcours au clavier complet en 3D, 12 écrans exposés aux lecteurs d’écran,
  `prefers-reduced-motion` respecté, lien d’évitement présent.

### Sécurité

- 🟡 **Actions GitHub référencées par étiquette** (`@v4`), qui peut être
  déplacée vers un autre code. → **Corrigé** : épinglées par empreinte de
  commit.
- ✅ Aucun secret dans le dépôt, 0 vulnérabilité npm, droits minimaux du
  workflow (`contents: read`, déploiement seul en écriture), aucune requête
  vers un tiers depuis l’accueil (polices et scripts servis par le site).
- ✅ CSP stricte (`script-src 'self'`, pas de style ni de script en ligne) : un
  texte saisi dans l’admin ne peut pas exécuter de script.
- ⚪ GitHub Pages n’envoie pas d’en-têtes de sécurité : la CSP est en balise
  `meta` (sans `frame-ancestors`, que les balises ne prennent pas en charge).
  `public/_headers` les prévoit pour Netlify ou Cloudflare.
- ⚪ `/admin` : connexion par jeton GitHub, conservé dans le navigateur.
  Recommandation (ADMIN.md) : jeton « fine-grained », limité à ce dépôt, avec
  expiration.

### Performance

- ✅ Lighthouse 100 sur mobile et ordinateur ; affichage complet en 1,5–1,7 s
  sur mobile simulé (0,4 s sur ordinateur), aucun décalage de mise en page,
  aucun temps de blocage ; trajet 3D à 60 images/s.
- 🟡 **Photos un peu trop grandes sur mobile.** → **Corrigé** : tailles
  intermédiaires et attribut `sizes` ajustés (photo du club et du lieu).
- 🟡 **CSS mort** (règles d’anciens composants). → **Corrigé** : 13 règles
  retirées de `global.css`.
- ⚪ Deux feuilles de style bloquent le premier affichage (≈ 0,3 s simulé sur
  mobile). Les intégrer à la page demanderait d’assouplir la CSP : compromis
  conservé.

### Référencement

- 🟡 **404 : adresse canonique vers une page inexistante, page indexable.**
  → **Corrigé** : `noindex`, sans adresse canonique.
- ✅ Titre et description par page, langue, adresse canonique, plan du site,
  données structurées schema.org, image de partage 1200 × 630.
- ⚪ `robots.txt` : sur `n3w4l.github.io/yoga-perrigny/`, il devrait être à la
  racine du domaine, qui n’appartient pas au projet (Lighthouse SEO 92). À
  régler avec un domaine propre (par exemple yoga-perrigny.com) ; en attendant,
  déclarer le plan du site dans Google Search Console.

### Liens et robustesse

- ✅ 0 lien interne ou ancre cassé sur les 4 pages ; 7 PDF servis par le site.
- ✅ Sans JavaScript, les 12 sections s’affichent à plat.
- ✅ Contenu validé à chaque publication : une erreur de saisie dans l’admin
  arrête la publication sans toucher au site en ligne.
- ⚪ Liens externes (OpenStreetMap, UJ-BEY, CNIL) non vérifiables depuis
  l’environnement d’audit : à contrôler à la main de temps en temps.

### Qualité du code

- 🟠 **4 erreurs TypeScript**, dont le bug des flèches. → **Corrigé** : 0 erreur
  (typage des API d’appareil non standard).
- ✅ Contenu séparé de la mise en page (`src/contenu/`), documentation à jour
  (README, ADMIN.md, compétences du projet).

## Reste à faire (hors code)

Informations à fournir par l’association : voir `A-COMPLETER.md` (président,
RNA, crédits photo, accord des personnes photographiées, règle des
réinscriptions, téléphone de l’hébergeur…).
