// Repère les textes coupés sur 2 ou 3 lignes dont la dernière ligne est courte
// (« veuve ») : souvent un retour à la ligne évitable. Mode 3D, chaque écran.
// Usage : node lignes.cjs <url> [largeur] [hauteur]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://127.0.0.1:4321/yoga-perrigny/';
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width, height } });
  await p.goto(url, { waitUntil: 'networkidle' });
  const n = await p.locator('.plane').count();
  for (let i = 0; i < n; i++) {
    await p.evaluate((i) => {
      const [a, b] = document.querySelectorAll('.snap-stop');
      scrollTo(0, i * (a && b ? b.offsetTop - a.offsetTop : innerHeight));
    }, i);
    await p.waitForTimeout(350);
    const rows = await p.evaluate((i) => {
      const plane = document.querySelectorAll('.plane')[i];
      const out = [];
      for (const el of plane.querySelectorAll('p, li, h1, h2, h3, h4, figcaption, .fine, .who, .label, .hours, .sum, strong, span')) {
        if (!el.getClientRects().length) continue;
        // Bloc de texte « feuille » : on ignore les conteneurs dont un enfant bloc est déjà mesuré.
        if ([...el.children].some((c) => /^(P|LI|DIV|UL|H\d)$/.test(c.tagName))) continue;
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = [...range.getClientRects()].filter((r) => r.width > 1);
        if (!rects.length) continue;
        const lines = [];
        for (const r of rects) {
          const line = lines.find((l) => Math.abs(l.top - r.top) < 4);
          if (line) { line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right); }
          else lines.push({ top: r.top, left: r.left, right: r.right });
        }
        if (lines.length < 2 || lines.length > 3) continue;
        const box = el.getBoundingClientRect();
        const last = lines[lines.length - 1];
        const ratio = (last.right - last.left) / box.width;
        if (ratio < 0.35) {
          const parent = el.parentElement.getBoundingClientRect();
          out.push(`${plane.id.padEnd(12)} ${lines.length} lignes, dernière ${Math.round(ratio * 100)} %  largeur ${Math.round(box.width)}/${Math.round(parent.width)}  ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} « ${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)} »`);
        }
      }
      return out;
    }, i);
    rows.forEach((r) => console.log(r));
  }
  await b.close();
})();
