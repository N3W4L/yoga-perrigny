// Captures de chaque écran du trajet (1440×900 et 1280×720) et de la page mobile entière,
// avec un contrôle de débordement vertical par écran.
// Usage : node captures.cjs <url> <dossier-de-sortie> [préfixe]
const { chromium } = require('playwright');
const [url = 'http://127.0.0.1:4321/yoga-perrigny/', out = '.', tag = 'ecran'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1440, 900], [1280, 720]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')));
    const n = await p.locator('.plane').count();
    for (let i = 0; i < n; i++) {
      await p.evaluate((i) => scrollTo(0, i * innerHeight), i);
      await p.waitForTimeout(500);
      const info = await p.evaluate((i) => {
        const plane = document.querySelectorAll('.plane')[i];
        const wrap = plane.querySelector(':scope > .s-wrap, .s-hero-copy') || plane;
        const r = wrap.getBoundingClientRect();
        return `${plane.id} haut=${Math.round(r.top)} bas=${Math.round(r.bottom)} écran=${innerHeight}${r.bottom > innerHeight || r.top < 56 ? '  ⚠ déborde' : ''}`;
      }, i);
      console.log(w, info);
      await p.screenshot({ path: `${out}/${tag}-${w}-${i}.png` });
    }
    await p.close();
  }
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/${tag}-mobile.png`, fullPage: true });
  console.log('mobile : page entière capturée');
  await b.close();
})();
