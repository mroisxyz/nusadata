// Nusa Data — boot and hash router. Static hosting friendly; no server needed.

import { years } from './data.js';
import { renderOverview, renderPeople, renderEconomy, renderRegions, renderAbout } from './pages.js';
import { escapeHtml } from './charts.js';

const routes = {
  '/': { render: renderOverview, title: 'Overview' },
  '/people': { render: renderPeople, title: 'People' },
  '/economy': { render: renderEconomy, title: 'Economy' },
  '/regions': { render: renderRegions, title: 'Regions' },
  '/about': { render: renderAbout, title: 'About' },
};

const app = document.querySelector('#app');
const header = document.querySelector('#siteHeader');
const menuToggle = document.querySelector('#menuToggle');
const yearSelect = document.querySelector('#yearSelect');
const navLinks = Array.from(document.querySelectorAll('[data-route]'));
const state = { year: 2024, route: '/' };

function routeFromHash() {
  const raw = window.location.hash.replace(/^#/, '').split('?')[0];
  const trimmed = raw.replace(/\/+$/, '');
  if (!trimmed || trimmed === '/') return '/';
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
}

function setMenu(open) {
  header.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuToggle.textContent = open ? '×' : '☰';
}

function notFound(route) {
  return '<section class="section"><p class="kicker">Off the map</p>' +
    '<h1>There is no page at ' + escapeHtml(route) + '</h1>' +
    '<p class="lede">The address may be mistyped. Every part of the portal is one click from the overview.</p>' +
    '<a class="btn btn-primary" href="#/">Return to overview</a> ' +
    '<a class="btn btn-outline" href="#/about">Read the method</a></section>';
}

function render() {
  const route = routeFromHash();
  const entry = routes[route];
  state.route = route;
  yearSelect.value = String(state.year);

  if (entry) {
    const view = entry.render(state.year);
    app.innerHTML = view.html;
    if (view.mount) view.mount(app);
    document.title = entry.title + ' — Nusa Data';
  } else {
    app.innerHTML = notFound(route);
    document.title = 'Page not found — Nusa Data';
  }

  navLinks.forEach((link) => {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  setMenu(false);
}

menuToggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
yearSelect.addEventListener('change', (event) => {
  const chosen = Number(event.target.value);
  state.year = years.includes(chosen) ? chosen : 2024;
  render();
});
window.addEventListener('hashchange', render);

if (!window.location.hash) window.history.replaceState(null, '', '#/');
render();
