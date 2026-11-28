// Contraste du texte (WCAG AA) sur chaque écran du trajet 3D. Usage : node contraste.cjs <url>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(process.argv[2] || 'http://127.0.0.1:4321/yoga-perrigny/', { waitUntil: 'networkidle' });
  const n = await p.locator('.plane').count(); const seen = new Map();
  for (let i = 0; i < n; i++) {
    await p.evaluate(i => { const [a, b] = document.querySelectorAll('.snap-stop'); scrollTo(0, i * (a && b ? b.offsetTop - a.offsetTop : innerHeight)); }, i); await p.waitForTimeout(400);
    const rows = await p.evaluate(i => {
      const parse = c => { const m = c.match(/[\d.]+/g).map(Number); const k = c.startsWith('color(') ? 255 : 1; return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
      const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const out = [];
      const plane = document.querySelectorAll('.plane')[i];
      for (const el of [plane, ...plane.querySelectorAll('*')]) {
        const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ');
        if (!/[\p{L}\p{N}]/u.test(t) || !el.getClientRects().length) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
        let op = 1, bg = null;
        for (let e = el; e && e !== plane.parentElement; e = e.parentElement) { const s = getComputedStyle(e); if (e !== plane) op *= +s.opacity; const c = parse(s.backgroundColor); if (!bg && c.a > 0.5 && s.backgroundColor !== 'rgba(0, 0, 0, 0)') bg = c; }
        if (op < 0.05) continue;
        const B = bg || { r: 22, g: 33, b: 27 }; const F = parse(cs.color); const a = F.a * op;
        const mix = { r: F.r * a + B.r * (1 - a), g: F.g * a + B.g * (1 - a), b: F.b * a + B.b * (1 - a) };
        const L1 = lum(mix), L2 = lum(B); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.6 && +cs.fontWeight >= 700);
        if (cr < (large ? 3 : 4.5)) out.push(`${plane.id} ${cr.toFixed(2)} ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${t.slice(0, 40)}"`);
      }
      return out;
    }, i);
    rows.forEach(r => { const k = r.split(' ').slice(2).join(' '); if (!seen.has(k)) { seen.set(k, 1); console.log(r); } });
  }
  await b.close();
})();
