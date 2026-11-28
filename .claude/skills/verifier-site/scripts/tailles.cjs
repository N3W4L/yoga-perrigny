// Vérifie chaque écran sur de nombreuses tailles (mobile, tablette, portable, grand écran,
// téléphone en paysage) : mode (3D ou à plat), contenu coupé, débordement horizontal.
// Usage : node tailles.cjs ['[[largeur,hauteur],…]']  (sans argument : la liste par défaut)
const { chromium } = require('playwright');
const sizes = JSON.parse(process.argv[2] || '[[320,640],[390,844],[767,1024],[768,1024],[820,1180],[1024,768],[1180,820],[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440],[844,390],[1024,600]]');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://127.0.0.1:4321/yoga-perrigny/', { waitUntil: 'networkidle' });
    const mode = await p.evaluate(() => document.documentElement.classList.contains('journey-3d') ? '3D' : 'à plat');
    const out = [];
    if (mode === '3D') {
      const n = await p.locator('.plane').count();
      for (let i = 0; i < n; i++) {
        await p.evaluate(i => { const [a, b] = document.querySelectorAll('.snap-stop'); scrollTo(0, i * (b.offsetTop - a.offsetTop)); }, i);
        await p.waitForTimeout(350);
        const r = await p.evaluate(i => {
          const pl = document.querySelectorAll('.plane')[i];
          const wrap = pl.querySelector(':scope > .s-wrap, .s-hero-copy') || pl;
          const nav = document.querySelector('.s-nav').getBoundingClientRect().bottom;
          const r = wrap.getBoundingClientRect();
          let over = 0; for (const e of pl.querySelectorAll('*')) { const b = e.getBoundingClientRect(); if (b.width && b.right > innerWidth + 1) over++; }
          return { id: pl.id, top: Math.round(r.top), bottom: Math.round(r.bottom), nav: Math.round(nav), hOver: over };
        }, i);
        if (r.bottom > h || r.top < r.nav || r.hOver) out.push(`${r.id}(${r.top}-${r.bottom}${r.hOver ? ', déborde à droite x' + r.hOver : ''})`);
        if (i === 0 || r.bottom > h || r.top < r.nav) ;
      }
    } else {
      const wide = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (wide > 0) out.push('défilement horizontal de ' + wide + ' px');
    }
    console.log(`${w}×${h}`.padEnd(11), mode.padEnd(7), out.length ? '⚠ ' + out.join(' ') : 'OK');
    await p.close();
  }
  await b.close();
})();
