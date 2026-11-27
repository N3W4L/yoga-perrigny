const header = document.querySelector<HTMLElement>('[data-header]');
const toTop = document.querySelector<HTMLElement>('[data-to-top]');
const menu = document.querySelector<HTMLDetailsElement>('[data-menu]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onScroll() {
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
  if (!toTop) return;
  if (window.scrollY > 640) toTop.removeAttribute('hidden');
  else toTop.setAttribute('hidden', '');
}

onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (menu) menu.open = false;
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.open) {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});

const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
const ids = [...new Set(links.map((link) => link.hash.replace('#', '')).filter(Boolean))];
const sections = ids
  .map((id) => document.getElementById(id))
  .filter((element): element is HTMLElement => element !== null);

if (sections.length > 0) {
  const visible = new Set<string>();

  const mark = () => {
    if (document.documentElement.classList.contains('journey-3d')) return;
    let current: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    visible.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;
      const distance = Math.abs(element.getBoundingClientRect().top - 96);
      if (distance < best) {
        best = distance;
        current = id;
      }
    });
    links.forEach((link) => {
      const on = link.hash === `#${current}`;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      mark();
    },
    { rootMargin: '-18% 0px -55% 0px', threshold: [0, 0.15, 0.4] },
  );

  sections.forEach((section) => observer.observe(section));
}

toTop?.addEventListener('click', (event) => {
  const target = document.getElementById('accueil');
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  if (menu?.open) menu.open = false;
});
