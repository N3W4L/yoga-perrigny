# Modifier le site : l’interface d’administration

Adresse : **https://n3w4l.github.io/yoga-perrigny/admin/**

Tout le contenu du site s’y modifie sans toucher au code : textes, horaires,
tarifs, professeures, stage, témoignages, photos, documents PDF, pages légales.
Chaque enregistrement est publié automatiquement **en 1 à 2 minutes**.

## Se connecter (une seule fois par appareil)

L’interface enregistre les modifications dans le dépôt GitHub du site. Il faut
donc un compte GitHub qui a accès au dépôt `N3W4L/yoga-perrigny`, et une
« clé d’accès » (jeton) :

1. Sur GitHub, ouvrir **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Nom : « Admin site yoga ». Expiration : au choix (un an, par exemple).
3. **Repository access** : *Only select repositories* → `N3W4L/yoga-perrigny`.
4. **Permissions → Repository permissions → Contents** : *Read and write*.
5. Générer, copier le jeton (il commence par `github_pat_`).
6. Sur la page d’administration, cliquer **« Se connecter avec un jeton »**
   (« Sign In Using Access Token ») et coller le jeton.

Le jeton reste dans ce navigateur. Ne le communiquez pas : il permet de
modifier le site. En cas de doute, supprimez-le sur GitHub et créez-en un autre.

Pour qu’une autre personne (par exemple un membre du bureau) modifie le site :
lui créer un compte GitHub, l’ajouter au dépôt (**Settings → Collaborators**),
puis elle suit les étapes ci-dessus avec son propre compte.

## Modifier

- **Contenu du site** : un élément par écran de la page d’accueil, dans l’ordre
  du trajet, plus **Réglages et coordonnées** (adresse, e-mail, téléphone, et
  les cases pour afficher ou masquer le stage et le bloc « À la une »).
- **Pages légales** : mentions légales et politique de confidentialité.
- Bouton **Enregistrer** (« Save ») en haut à droite : la modification part en
  ligne. Rechargez le site une à deux minutes plus tard.

Mise en forme dans les textes :

| Pour obtenir | Écrire |
| --- | --- |
| *italique* (dans les titres, par exemple) | `*mot*` |
| **gras** | `**mot**` |
| un lien | `[texte du lien](https://adresse)` |
| un lien vers un PDF du site | `[texte](/documents/nom.pdf)` |
| un numéro cliquable | `[06 01 86 51 07](tel:+33601865107)` |

Bon à savoir :

- **Les horaires** se changent une seule fois, dans **Séances** : ils sont
  repris automatiquement sur la fiche de chaque professeure et sur l’écran
  Yoga adapté (le nom de la professeure doit être écrit pareil partout).
- **Le stage** : après la date, décochez « Le stage » dans **Réglages** ; les
  écrans Stage et Programme disparaissent, ainsi que leur entrée dans le menu
  et dans « À la une ».
- **Photos** : préférez des photos nettes, d’au moins 1 200 pixels de large,
  horizontales (3:2) pour le club, verticales (4:5) pour le lieu. Le site les
  optimise. Pour leur donner la même retouche que les photos actuelles,
  demandez à la personne qui gère le code de lancer `npm run photos`.
- **Documents PDF** : dans un champ « Fichier PDF », choisissez ou ajoutez le
  fichier ; il est rangé dans `public/documents/`.
- Restez court : sur ordinateur, chaque écran doit tenir sans défiler. Une
  mention de tarif ou un conseil tient sur une ligne.

## Si la publication échoue

Le site vérifie le contenu avant de publier. Si un champ obligatoire est vide
ou mal rempli, la publication s’arrête et **le site en ligne reste tel qu’il
était** : rien n’est cassé. Le message d’erreur se lit sur GitHub, onglet
**Actions** du dépôt (dernière exécution en rouge) ; il indique le fichier et
le champ en cause (les listes sont numérotées à partir de 0), par exemple :

```
Contenu invalide dans src/contenu/tarifs.json :
  - prix › 2 › montant : ce champ est vide
```

Corrigez le champ dans l’interface et enregistrez à nouveau.

## Pour la personne qui gère le code

- Contenu : `src/contenu/*.json` et `src/contenu/pages/*.md`, validés par
  `src/contenu/index.ts` (schémas zod).
- Configuration de l’interface : `public/admin/config.yml` (Sveltia CMS,
  validable avec `node_modules/@sveltia/cms/schema/sveltia-cms.json`).
- L’éditeur est servi par le site : `scripts/copier-admin.mjs` le copie depuis
  `node_modules` avant chaque build.
- En local, `npm run dev` puis http://localhost:4321/yoga-perrigny/admin/ :
  « Work with Local Repository » modifie directement les fichiers du clone.
