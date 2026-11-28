/**
 * Copie l'éditeur Sveltia CMS (node_modules) dans public/admin/ avant chaque
 * build : l'interface /admin est servie par le site lui-même, sans CDN.
 * Le fichier copié n'est pas versionné (.gitignore).
 */
import { copyFileSync } from 'node:fs';

const source = new URL('../node_modules/@sveltia/cms/dist/sveltia-cms.js', import.meta.url);
const target = new URL('../public/admin/sveltia-cms.js', import.meta.url);
copyFileSync(source, target);
console.log('Interface admin : sveltia-cms.js copié dans public/admin/');
