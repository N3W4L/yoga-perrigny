// Fluidité du défilement : parcourt tout le trajet à 25 px par image et mesure
// le temps par image et le travail du fil principal (script, style, mise en page).
// Usage : node perf.cjs <url> [<url-de-comparaison> ...]
const { chromium } = require('playwright');
const urls = process.argv.slice(2);
if (!urls.length) urls.push('http://127.0.0.1:4321/yoga-perrigny/');
(async () => {
  const b = await chromium.launch();
  for (const url of urls) for (let r = 0; r < 2; r++) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Performance.enable');
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    const a = await m();
    const frames = await p.evaluate(() => new Promise((res) => {
      document.documentElement.style.scrollSnapType = 'none';
      const max = document.documentElement.scrollHeight - innerHeight;
      let y = 0; const t = []; let last = performance.now();
      const step = () => { const now = performance.now(); t.push(now - last); last = now; y += 25; scrollTo(0, y); if (y < max) requestAnimationFrame(step); else res(t); };
      requestAnimationFrame(step);
    }));
    const z = await m();
    const d = (k) => ((z[k] - a[k]) * 1000).toFixed(0);
    frames.sort((x, y) => x - y);
    const q = (f) => frames[Math.floor(frames.length * f)].toFixed(1);
    console.log(`${url}  médiane=${q(0.5)} ms  p95=${q(0.95)} ms  | script=${d('ScriptDuration')} style=${d('RecalcStyleDuration')} layout=${d('LayoutDuration')} ms`);
    await p.close();
  }
  await b.close();
})();
