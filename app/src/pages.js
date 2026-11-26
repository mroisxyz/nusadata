// Nusa Data — one render function per route. Each returns { html, mount }.
// mount is a no-op where a page has no interactive controls.

import {
  country, kpisForYear, trend, lifeTrend, fertilityTrend, ageGroups, educationRows,
  literacy, sectors, gdpSeries, inflationSeries, unemploymentSeries, trade,
  provinces, sourceList, definitions,
} from './data.js';
import { lineChart, barChart, donutChart, escapeHtml } from './charts.js';

/** A visible provenance line attached to a figure. */
export function sourceNote(source, year, detail) {
  return '<p class="source">Source: ' + escapeHtml(source) + ' ' + year + (detail ? ' · ' + escapeHtml(detail) : '') + '</p>';
}

function pageHead(kicker, title, lede, year) {
  return '<section class="page-head"><p class="kicker">' + escapeHtml(kicker) + '</p>' +
    '<h1>' + escapeHtml(title) + '</h1><p class="lede">' + escapeHtml(lede) + '</p>' +
    '<p class="year-band">Reference year: <strong>' + year + '</strong> · change it in the header</p></section>';
}

function miniStat(label, value, unit, source, year) {
  return '<article class="mini-stat"><p class="mini-label">' + escapeHtml(label) + '</p>' +
    '<p class="mini-value">' + escapeHtml(value) + '</p><p class="mini-unit">' + escapeHtml(unit) + '</p>' +
    sourceNote(source, year) + '</article>';
}

function kpiCard(label, value) {
  return '<article class="kpi-card"><p class="kpi-label">' + escapeHtml(label) + '</p>' +
    '<p class="kpi-value">' + escapeHtml(value.display) + '</p>' +
    '<p class="kpi-unit">' + escapeHtml(value.unit) + '</p>' +
    sourceNote(value.source, value.sourceYear) + '</article>';
}

const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Overview: headline numbers, population history and output mix. */
export function renderOverview(year) {
  const k = kpisForYear(year);
  const links = [
    { href: '#/people', title: 'People', text: 'Age, education, health and fertility across the archipelago.' },
    { href: '#/economy', title: 'Economy', text: 'Output, prices, jobs and trade, series by series.' },
    { href: '#/regions', title: 'Regions', text: 'Compare 16 provinces by people, area, income and HDI.' },
  ];
  const seal = '<svg class="hero-seal" viewBox="0 0 260 260" aria-hidden="true">' +
    '<circle cx="130" cy="130" r="124" fill="none" stroke="currentColor" stroke-opacity="0.28"/>' +
    '<circle cx="130" cy="130" r="101" fill="none" stroke="currentColor" stroke-opacity="0.45"/>' +
    '<path d="M42 148 C74 112 100 132 126 102 C150 76 186 94 218 70" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M50 180 C88 154 114 174 148 146 C172 126 196 138 214 122" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="126" cy="102" r="6" fill="currentColor"/><circle cx="218" cy="70" r="4" fill="currentColor"/>' +
    '<circle cx="148" cy="146" r="5" fill="currentColor"/><circle cx="50" cy="180" r="3" fill="currentColor"/>' +
    '</svg>';

  const html =
    '<section class="hero"><div class="hero-copy">' +
    '<p class="eyebrow">National statistics · ' + escapeHtml(country.name) + '</p>' +
    '<h1>Indonesia,<br><em>in numbers.</em></h1>' +
    '<p class="lede">' + escapeHtml(country.tagline) + ' A single, clearly sourced view of the country’s people, economy and regions.</p>' +
    '<div class="hero-actions"><a class="btn btn-primary" href="#/people">Explore the data</a>' +
    '<a class="btn btn-outline" href="#/about">How we source it</a></div>' +
    '<p class="hero-note">Reference year <strong>' + k.year + '</strong> · ' + escapeHtml(country.edition) + '</p>' +
    '</div><div class="hero-art">' + seal + '</div></section>' +

    '<section class="section"><div class="section-head"><div><p class="kicker">At a glance</p>' +
    '<h2>Headline figures</h2></div><p class="section-note">Select a year above to update these four measures.</p></div>' +
    '<div class="kpi-grid">' + kpiCard('Population', k.population) + kpiCard('Nominal GDP', k.gdp) +
    kpiCard('Life expectancy', k.life) + kpiCard('Urban share', k.urban) + '</div></section>' +

    '<section class="section split"><article class="panel panel-wide">' +
    '<div class="panel-head"><div><p class="kicker">Long view</p><h2>Population, 1960–' + k.year + '</h2></div>' +
    '<p class="panel-highlight">' + k.population.display + 'm</p></div>' +
    lineChart({ points: trend(), color: 'teal', label: 'Population in millions from 1960 to 2024', valueFormat: (n) => n.toFixed(1) + 'm', tickFormat: (n) => String(Math.round(n)) }) +
    sourceNote('World Bank', 2023, 'BPS 2024 for the latest three years') +
    '<p class="chart-note">From 87.8 million in 1960 to ' + k.population.display + ' million in ' + k.year + ' — a threefold rise in two generations.</p>' +
    '</article><article class="panel">' +
    '<div class="panel-head"><div><p class="kicker">Output mix</p><h2>GDP by sector</h2></div></div>' +
    donutChart({ items: sectors, centerValue: '$1.42T', centerLabel: '2024 output', label: 'Shares of 2024 GDP by sector' }) +
    sourceNote('BPS', 2024, 'sector accounts; shares sum to 100%') +
    '</article></section>' +

    '<section class="section"><div class="section-head"><div><p class="kicker">Go deeper</p>' +
    '<h2>Explore the portal</h2></div></div><div class="link-grid">' +
    links.map((link) => '<a class="link-card" href="' + link.href + '"><span class="link-arrow" aria-hidden="true">→</span>' +
      '<strong>' + escapeHtml(link.title) + '</strong><span>' + escapeHtml(link.text) + '</span></a>').join('') +
    '</div></section>';

  return { html, mount: null };
}

/** People: age structure, longevity, schooling and fertility. */
export function renderPeople(year) {
  const k = kpisForYear(year);
  const ageBars = ageGroups.map((g) => ({ label: g.label + ' · ' + g.share + '%', value: g.people }));
  const fertilityBars = fertilityTrend.map((f) => ({ label: String(f.year), value: f.value, color: 'amber' }));
  const html =
    pageHead('People', 'A nation of ' + k.population.display + ' million',
      'How old the country is, how long people live, and how many children families have — with every figure attributed.', year) +
    '<section class="mini-grid">' +
    miniStat('Population', k.population.display + 'm', 'people', k.population.source, k.population.sourceYear) +
    miniStat('Median age', '30.4', 'years', 'UN', 2023) +
    miniStat('Literacy, 15+', literacy.value.toFixed(1) + '%', 'can read and write', literacy.source, literacy.year) +
    miniStat('Fertility rate', fertilityTrend[fertilityTrend.length - 1].value.toFixed(2), 'births per woman', 'UN', 2023) +
    '</section>' +

    '<section class="section panel"><div class="panel-head"><div><p class="kicker">Age structure</p>' +
    '<h2>Population by age group, 2024</h2></div><p class="panel-highlight">100.0%</p></div>' +
    barChart({ items: ageBars, labelWidth: 244, color: 'teal', label: 'Population by age group in millions', valueFormat: (n) => n.toFixed(1) + 'm' }) +
    sourceNote('BPS', 2024, 'shares sum to 100%; totals 281.2 million') +
    '<p class="chart-note">People of working age (25–64) make up 51.8% of the population.</p></section>' +

    '<section class="section split"><article class="panel panel-wide">' +
    '<div class="panel-head"><div><p class="kicker">Longevity</p><h2>Life expectancy at birth, 2000–2024</h2></div>' +
    '<p class="panel-highlight">' + k.life.display + ' yrs</p></div>' +
    lineChart({ points: lifeTrend, color: 'amber', label: 'Life expectancy from 2000 to 2024', valueFormat: (n) => n.toFixed(1) + ' yrs', tickFormat: (n) => String(Math.round(n)) }) +
    sourceNote('World Bank', 2023, '2024 value from BPS 2024') +
    '<p class="chart-note">The 2020 dip reflects the first year of the pandemic; the trend resumed upward afterwards.</p>' +
    '</article><article class="panel">' +
    '<div class="panel-head"><div><p class="kicker">Families</p><h2>Total fertility rate</h2></div></div>' +
    barChart({ items: fertilityBars, labelWidth: 82, color: 'teal', label: 'Fertility rate from 2020 to 2024', valueFormat: (n) => n.toFixed(2) }) +
    sourceNote('UN', 2023, '2024 value from BPS 2024') +
    '<p class="chart-note">Births per woman fell from 2.19 in 2020 to 2.08 in 2024.</p>' +
    '</article></section>' +

    '<section class="section panel"><div class="panel-head"><div><p class="kicker">Schooling</p>' +
    '<h2>Education attainment, population aged 15+</h2></div><p class="panel-highlight">' + literacy.yearsSchool.toFixed(1) + ' yrs</p></div>' +
    '<div class="table-scroll"><table class="data-table"><caption>Education attainment, 2024</caption>' +
    '<thead><tr><th scope="col">Highest level completed</th><th scope="col" class="num">People (millions)</th><th scope="col" class="num">Share</th></tr></thead><tbody>' +
    educationRows.map((row) => '<tr><th scope="row">' + escapeHtml(row.level) + '</th>' +
      '<td class="num">' + row.people.toFixed(1) + '</td><td class="num">' + row.share.toFixed(1) + '%</td></tr>').join('') +
    '<tr class="total-row"><th scope="row">Total</th><td class="num">204.2</td><td class="num">100.0%</td></tr>' +
    '</tbody></table></div>' + sourceNote('BPS', 2024, 'labour force survey') +
    '<p class="chart-note">Mean years of schooling: ' + literacy.yearsSchool.toFixed(1) + ' (UNDP 2023). ' +
    'Adult literacy: ' + literacy.value.toFixed(1) + '% (UNESCO 2023).</p></section>';

  return { html, mount: null };
}

const metricDefinitions = {
  gdp: {
    points: gdpSeries, color: 'navy', title: 'Nominal GDP, 2015–2024', value: '$1.42 trillion in 2024',
    source: { name: 'World Bank', year: 2023, detail: 'IMF 2024 for the latest year' },
    valueFormat: (n) => '$' + n.toFixed(0) + 'bn', tickFormat: (n) => '$' + Math.round(n),
    label: 'Nominal GDP in US dollars, 2015 to 2024',
  },
  inflation: {
    points: inflationSeries, color: 'amber', title: 'Consumer price inflation, 2015–2024', value: '2.30% in 2024',
    source: { name: 'BPS', year: 2024, detail: 'annual average' },
    valueFormat: (n) => n.toFixed(2) + '%', tickFormat: (n) => n.toFixed(1) + '%',
    label: 'Annual consumer price inflation, 2015 to 2024',
  },
  unemployment: {
    points: unemploymentSeries, color: 'teal', title: 'Unemployment rate, 2015–2024', value: '4.91% in 2024',
    source: { name: 'BPS', year: 2024, detail: 'labour force survey' },
    valueFormat: (n) => n.toFixed(2) + '%', tickFormat: (n) => n.toFixed(1) + '%',
    label: 'Unemployment rate, 2015 to 2024',
  },
};

/** Economy: switchable headline series, sector mix and external trade. */
export function renderEconomy(year) {
  const k = kpisForYear(year);
  const sectorBars = sectors.map((s) => ({ label: s.label + ' · ' + s.share + '%', value: s.value, color: s.color }));
  const html =
    pageHead('Economy', k.gdp.display + ' of annual output',
      'Follow output, prices and jobs year by year, then see where the value is produced and how trade balances.', year) +
    '<section class="section panel"><div class="panel-head"><div><p class="kicker">Choose a series</p>' +
    '<h2 id="metricTitle">' + metricDefinitions.gdp.title + '</h2></div>' +
    '<p class="panel-highlight" id="metricValue">' + metricDefinitions.gdp.value + '</p></div>' +
    '<div class="chip-row" role="group" aria-label="Choose an economic series">' +
    Object.keys(metricDefinitions).map((key, index) => '<button type="button" class="chip' + (index === 0 ? ' is-active' : '') +
      '" data-metric="' + key + '" aria-pressed="' + (index === 0) + '">' +
      (key === 'gdp' ? 'GDP' : key === 'inflation' ? 'Inflation' : 'Unemployment') + '</button>').join('') +
    '</div><div id="metricChart">' + lineChart({ ...metricDefinitions.gdp, points: metricDefinitions.gdp.points }) + '</div>' +
    '<div id="metricSource">' + sourceNote(metricDefinitions.gdp.source.name, metricDefinitions.gdp.source.year, metricDefinitions.gdp.source.detail) + '</div>' +
    '</section>' +

    '<section class="section split"><article class="panel panel-wide">' +
    '<div class="panel-head"><div><p class="kicker">Where it comes from</p><h2>GDP by sector, 2024</h2></div></div>' +
    barChart({ items: sectorBars, labelWidth: 196, label: 'GDP by sector in billions of US dollars', valueFormat: (n) => '$' + n + 'bn' }) +
    sourceNote('BPS', 2024, 'values sum to $1,421bn') +
    '</article><article class="panel">' +
    '<div class="panel-head"><div><p class="kicker">Shares</p><h2>Output composition</h2></div></div>' +
    donutChart({ items: sectors, centerValue: '48.4%', centerLabel: 'services', label: 'Sector shares of GDP' }) +
    sourceNote('BPS', 2024, 'sector value added') +
    '</article></section>' +

    '<section class="section"><div class="section-head"><div><p class="kicker">External sector</p>' +
    '<h2>Merchandise trade, 2024</h2></div></div><div class="mini-grid three">' +
    miniStat('Exports', '$' + trade.exports.toFixed(1) + 'bn', 'goods sent abroad', trade.source, trade.year) +
    miniStat('Imports', '$' + trade.imports.toFixed(1) + 'bn', 'goods brought in', trade.source, trade.year) +
    miniStat('Trade balance', '+$' + trade.balance.toFixed(1) + 'bn', 'exports minus imports', trade.source, trade.year) +
    '</div></section>';

  function mount(root) {
    const buttons = Array.from(root.querySelectorAll('[data-metric]'));
    const chart = root.querySelector('#metricChart');
    const title = root.querySelector('#metricTitle');
    const value = root.querySelector('#metricValue');
    const source = root.querySelector('#metricSource');
    function select(metric) {
      const series = metricDefinitions[metric];
      chart.innerHTML = lineChart({ ...series, points: series.points });
      title.textContent = series.title;
      value.textContent = series.value;
      source.innerHTML = sourceNote(series.source.name, series.source.year, series.source.detail);
      buttons.forEach((button) => {
        const active = button.dataset.metric === metric;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
    buttons.forEach((button) => button.addEventListener('click', () => select(button.dataset.metric)));
  }

  return { html, mount };
}

/** Regions: live search and click-to-sort table of sixteen provinces. */
export function renderRegions(year) {
  const columns = [
    { key: 'name', label: 'Province' }, { key: 'population', label: 'Population (m)' },
    { key: 'area', label: 'Area (km²)' }, { key: 'gdpPerCapita', label: 'GDP / person' },
    { key: 'hdi', label: 'HDI' },
  ];
  const heads = columns.map((col) => '<th scope="col" aria-sort="none"><button type="button" class="sort-button" data-sort="' +
    col.key + '">' + escapeHtml(col.label) + ' <span class="sort-mark" aria-hidden="true">↕</span></button></th>').join('');

  const html =
    pageHead('Regions', 'Sixteen provinces, side by side',
      'Search by name or code, then sort any column to compare population, land area, income and human development.', year) +
    '<section class="section panel"><div class="table-tools">' +
    '<div class="search-field"><label for="provinceSearch">Search provinces</label>' +
    '<input id="provinceSearch" type="search" placeholder="Name or code, e.g. Java or JT" autocomplete="off"></div>' +
    '<p class="table-count" id="tableCount" role="status">Showing 16 of 16 provinces</p></div>' +
    '<div class="table-scroll"><table class="data-table province-table" id="provinceTable">' +
    '<caption>Selected provinces of Indonesia, 2024</caption><thead><tr>' + heads + '</tr></thead>' +
    '<tbody id="provinceBody"></tbody></table></div>' +
    sourceNote('BPS', 2024, 'population and area') +
    '<p class="source">Sources: World Bank 2023 (GDP per person) · UNDP 2023 (HDI). 16 of 38 provinces shown.</p>' +
    '<p class="chart-note">Click a column heading to sort; press it again to reverse the order.</p></section>';

  function mount(root) {
    const rows = provinces();
    const body = root.querySelector('#provinceBody');
    const count = root.querySelector('#tableCount');
    const input = root.querySelector('#provinceSearch');
    const buttons = Array.from(root.querySelectorAll('[data-sort]'));
    let sortKey = 'population';
    let direction = 'desc';
    let query = '';

    function draw() {
      const needle = query.trim().toLowerCase();
      const visible = rows.filter((row) => !needle || row.name.toLowerCase().includes(needle) || row.code.toLowerCase().includes(needle));
      visible.sort((a, b) => {
        const result = typeof a[sortKey] === 'string'
          ? a[sortKey].localeCompare(b[sortKey])
          : a[sortKey] - b[sortKey];
        return direction === 'asc' ? result : -result;
      });
      body.innerHTML = visible.map((row) => '<tr><th scope="row"><span class="prov-code">' + row.code + '</span>' +
        escapeHtml(row.name) + '</th><td class="num">' + row.population.toFixed(1) + '</td>' +
        '<td class="num">' + grouped(row.area) + '</td><td class="num">$' + grouped(row.gdpPerCapita) + '</td>' +
        '<td class="num">' + row.hdi.toFixed(3) + '</td></tr>').join('') ||
        '<tr><td colspan="5" class="empty-row">No province matches that search.</td></tr>';
      count.textContent = 'Showing ' + visible.length + ' of ' + rows.length + ' provinces';
      buttons.forEach((button) => {
        const active = button.dataset.sort === sortKey;
        button.parentElement.setAttribute('aria-sort', active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none');
        button.querySelector('.sort-mark').textContent = active ? (direction === 'asc' ? '↑' : '↓') : '↕';
      });
    }

    input.addEventListener('input', (event) => { query = event.target.value; draw(); });
    buttons.forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.sort;
      if (key === sortKey) direction = direction === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; direction = key === 'name' ? 'asc' : 'desc'; }
      draw();
    }));
    draw();
  }

  return { html, mount };
}

/** About: method, publishers, definitions and a contact route. */
export function renderAbout() {
  const html =
    pageHead('About', 'How Nusa Data is built',
      'A small, honest reference: every number has a publisher, a year and a definition you can check.', 2024) +
    '<section class="section split"><article class="panel panel-wide">' +
    '<div class="panel-head"><div><p class="kicker">Method</p><h2>How we read the figures</h2></div></div>' +
    '<p>Nusa Data gathers published national indicators and presents them in one place. We keep the original reference year next to each figure rather than blending vintages, so a 2023 World Bank estimate is never silently shown as a 2024 measurement.</p>' +
    '<p>Where a series crosses sources, the note on the chart says which institution supplies which years. Percentages are rounded to one decimal; rounded components are chosen to add to their published totals. Population is expressed in millions, money in current US dollars, and ratios such as the HDI to three decimals.</p>' +
    '<p>Headline figures respond to the year selector using fixed published values for 2020–2024. No figure is generated at random or inferred from live requests — the site runs entirely from local data.</p>' +
    '</article><article class="panel">' +
    '<div class="panel-head"><div><p class="kicker">Coverage</p><h2>What the portal holds</h2></div></div>' +
    '<ul class="plain-list"><li>Five pages: overview, people, economy, regions and about.</li>' +
    '<li>Population history from 1960 to 2024.</li><li>Labour, prices and trade through 2024.</li>' +
    '<li>Sixteen provinces with four comparable measures.</li><li>Definitions for every headline term.</li></ul>' +
    '</article></section>' +

    '<section class="section panel"><div class="panel-head"><div><p class="kicker">Publishers</p>' +
    '<h2>Sources and reference years</h2></div></div>' +
    '<div class="table-scroll"><table class="data-table"><caption>Source register</caption>' +
    '<thead><tr><th scope="col">Institution</th><th scope="col">Covers</th><th scope="col" class="num">Latest year</th></tr></thead><tbody>' +
    sourceList.map((source) => '<tr><th scope="row">' + escapeHtml(source.name) + '</th><td>' +
      escapeHtml(source.covers) + '</td><td class="num">' + source.year + '</td></tr>').join('') +
    '</tbody></table></div></section>' +

    '<section class="section split"><article class="panel">' +
    '<div class="panel-head"><div><p class="kicker">Glossary</p><h2>Definitions</h2></div></div>' +
    '<dl class="definitions">' + definitions.map((item) => '<dt>' + escapeHtml(item.term) + '</dt><dd>' +
      escapeHtml(item.text) + '</dd>').join('') + '</dl></article>' +
    '<article class="panel contact-card"><div class="panel-head"><div><p class="kicker">Contact</p>' +
    '<h2>Questions and corrections</h2></div></div>' +
    '<p>If a figure looks wrong, tell us which chart, which year and which publisher note it carries.</p>' +
    '<p class="contact-line">Editorial desk · <span>desk@nusadata.example</span></p>' +
    '<p class="contact-line">Data review · <span>review@nusadata.example</span></p>' +
    '<p class="source">Editorial policy: corrections are logged with the reference year of the affected series.</p>' +
    '<a class="btn btn-outline" href="#/">Back to overview</a></article></section>';

  return { html, mount: null };
}
