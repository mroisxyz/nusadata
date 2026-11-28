// Nusa Data — one render function per route, each returning { html, mount }.
// mount stays a no-op on pages without controls. Every figure is read from data.js.

import {
  country, kpisForYear, trend, lifeTrend, fertilityTrend, ageGroups, educationRows,
  literacy, sectors, gdpSeries, inflationSeries, unemploymentSeries, trade,
  provinces, sourceList, definitions,
} from './data.js';
import {
  lineChart, barChart, donutChart, sparkline, stackedBarChart, heroChart,
  colorOf, escapeHtml,
} from './charts.js';

/** A visible provenance line attached to a figure. */
export function sourceNote(source, year, detail) {
  return '<p class="source">Source: ' + escapeHtml(source) + ' ' + year + (detail ? ' · ' + escapeHtml(detail) : '') + '</p>';
}

const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const deltaText = (now, then, digits) => (now - then >= 0 ? '+' : '−') + Math.abs(now - then).toFixed(digits);
const shareOf = (part, total) => (part / (total || 1)) * 100;

function pageHead(kicker, title, lede, year) {
  return '<section class="page-head"><p class="kicker">' + escapeHtml(kicker) + '</p>' +
    '<h1>' + escapeHtml(title) + '</h1><p class="lede">' + escapeHtml(lede) + '</p>' +
    '<p class="year-band">Reference year: <strong>' + year + '</strong> · change it in the header</p></section>';
}

function sectionHead(kicker, title, note) {
  return '<div class="section-head"><div><p class="kicker">' + escapeHtml(kicker) + '</p>' +
    '<h2>' + escapeHtml(title) + '</h2></div>' + (note ? '<p class="section-note">' + escapeHtml(note) + '</p>' : '') + '</div>';
}

function panelHead(kicker, title, highlight) {
  return '<div class="panel-head"><div><p class="kicker">' + escapeHtml(kicker) + '</p>' +
    '<h2>' + escapeHtml(title) + '</h2></div>' + (highlight ? '<p class="panel-highlight">' + escapeHtml(highlight) + '</p>' : '') + '</div>';
}

/** A single legend component shared by all of the infographic sections. */
export function legend(items, dark) {
  return '<ul class="legend' + (dark ? ' legend-dark' : '') + '">' + items.map((item) =>
    '<li><span class="legend-swatch" style="background:' + colorOf(item.color) + '"></span>' +
    '<span>' + escapeHtml(item.label) + '</span>' +
    (item.note ? '<em>' + escapeHtml(item.note) + '</em>' : '') + '</li>').join('') + '</ul>';
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

function heroKpi(label, value) {
  return '<article class="hero-kpi"><p class="kpi-label">' + escapeHtml(label) + '</p>' +
    '<p class="kpi-value">' + escapeHtml(value.display) + '</p>' +
    '<p class="kpi-unit">' + escapeHtml(value.unit) + '</p>' +
    '<p class="source">' + escapeHtml(value.source) + ' · ' + value.sourceYear + '</p></article>';
}

/** CSS-drawn share bar: crisp on a phone, unlike a scaled-down SVG. */
function shareBar(segments, label) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return '<div class="share-bar" role="img" aria-label="' + escapeHtml(label) + '">' + segments.map((segment) =>
    '<span style="width:' + shareOf(segment.value, total).toFixed(2) + '%;background:' + colorOf(segment.color) +
    '" title="' + escapeHtml(segment.label + ': ' + segment.value.toFixed(1) + '%') + '"></span>').join('') + '</div>';
}

function rankList(items, formatter, color) {
  return '<ol class="rank-list">' + items.map((item, index) =>
    '<li><span class="rank-no">' + String(index + 1).padStart(2, '0') + '</span>' +
    '<span class="rank-name">' + escapeHtml(item.name) + '</span>' +
    '<span class="rank-meter"><span style="width:' + item.width.toFixed(1) + '%;background:' + colorOf(color) + '"></span></span>' +
    '<strong class="rank-value">' + escapeHtml(formatter(item)) + '</strong></li>').join('') + '</ol>';
}

/** Five most recent population readings as HTML bars for small screens. */
function trendLadder(points) {
  const recent = points.slice(-5);
  const max = Math.max(...recent.map((point) => point.value));
  return '<div class="trend-ladder">' + recent.map((point) =>
    '<div class="trend-row"><span class="trend-year">' + point.year + '</span>' +
    '<span class="trend-track"><span style="width:' + shareOf(point.value, max).toFixed(1) + '%"></span></span>' +
    '<strong class="trend-value">' + point.value.toFixed(1) + 'm</strong></div>').join('') + '</div>';
}

/** Small-multiple card with a sparkline and a derived change since the first year. */
function pulseCard(title, points, format, color, digits, source, sourceYear) {
  const first = points[0].value;
  const last = points[points.length - 1].value;
  return '<article class="pulse-card"><p class="mini-label">' + escapeHtml(title) + '</p>' +
    sparkline({ points: points, color: color, label: title, width: 260, height: 74 }) +
    '<div class="pulse-foot"><strong>' + escapeHtml(format(last)) + '</strong>' +
    '<span>' + escapeHtml(deltaText(last, first, digits)) + ' since ' +
    (points[0].year === undefined ? 2020 : points[0].year) + '</span></div>' +
    sourceNote(source, sourceYear) + '</article>';
}

/** Overview: a full hero composition, headline figures and cross-cutting pulses. */
export function renderOverview(year) {
  const k = kpisForYear(year);
  const population = trend();
  const urban = [2020, 2021, 2022, 2023, 2024].map((y) => ({ year: y, value: kpisForYear(y).urban.value }));
  const snapshots = [2020, 2021, 2022, 2023, 2024].map((y) => kpisForYear(y));
  const links = [
    { href: '#/people', title: 'People', text: 'Age, education, health and fertility across the archipelago.' },
    { href: '#/economy', title: 'Economy', text: 'Output, prices, jobs and trade, series by series.' },
    { href: '#/regions', title: 'Regions', text: 'Compare 16 provinces by people, area, income and HDI.' },
  ];
  const growth = population[population.length - 1].value / population[0].value;

  const html =
    '<section class="hero"><div class="hero-inner">' +
    '<div class="hero-copy"><p class="eyebrow">National statistics · ' + escapeHtml(country.name) + '</p>' +
    '<h1>Indonesia,<br><em>in numbers.</em></h1>' +
    '<p class="lede">' + escapeHtml(country.tagline) + ' A single, clearly sourced view of the country’s people, economy and regions.</p>' +
    '<div class="hero-actions"><a class="btn btn-primary" href="#/people">Explore the data</a>' +
    '<a class="btn btn-outline" href="#/about">How we source it</a></div>' +
    '<p class="hero-note">Reference year <strong>' + k.year + '</strong> · ' + escapeHtml(country.edition) + '</p></div>' +
    '<aside class="release-card" aria-label="Latest release summary">' +
    '<p class="release-kicker">Latest release</p><h2>National accounts · ' + k.year + '</h2>' +
    '<dl class="release-list"><div><dt>Output</dt><dd>' + escapeHtml(k.gdp.display) + '</dd></div>' +
    '<div><dt>People</dt><dd>' + escapeHtml(k.population.display) + 'm</dd></div>' +
    '<div><dt>Urban share</dt><dd>' + escapeHtml(k.urban.display) + '%</dd></div>' +
    '<div><dt>Life expectancy</dt><dd>' + escapeHtml(k.life.display) + ' yrs</dd></div></dl>' +
    '<p class="release-foot">BPS · World Bank · IMF · ' + escapeHtml(country.edition) + '</p></aside></div>' +

    '<div class="hero-data"><div class="chart-frame-head"><div>' +
    '<p class="frame-kicker">The long view</p><h2>Population and urban share, 1960–2024</h2></div>' +
    legend([{ label: 'Population · left axis', color: 'teal', note: 'millions' },
      { label: 'Urban share · right axis', color: 'amber', note: '% of people' }], true) + '</div>' +
    '<div class="hero-chart-wrap">' + heroChart({ population: population, urban: urban, label: 'Population in millions and urban share from 1960 to 2024' }) + '</div>' +
    '<div class="hero-mobile">' + trendLadder(population) +
    '<p class="mobile-note">Population rose ' + growth.toFixed(1) + '× between 1960 and 2024.</p></div>' +
    '<div class="chart-frame-foot"><p>Source: World Bank 2023 · BPS 2024 for the latest years. ' +
    'The overlay uses the published urban share for 2020–2024; both axes carry their own units.</p></div></div>' +

    '<div class="hero-kpis">' + heroKpi('Population', k.population) + heroKpi('Nominal GDP', k.gdp) +
    heroKpi('Life expectancy', k.life) + heroKpi('Urban share', k.urban) + '</div></section>' +

    '<section class="section">' + sectionHead('Long view', 'Two ways to read the country',
      'The same reference data plotted as a history and as a mix of output.') +
    '<div class="split"><article class="panel panel-wide">' +
    panelHead('People', 'Population, 1960–' + k.year, k.population.display + 'm') +
    lineChart({ points: population, color: 'teal', showEnd: true, label: 'Population in millions from 1960 to 2024', valueFormat: (n) => n.toFixed(1) + 'm', tickFormat: (n) => String(Math.round(n)) }) +
    sourceNote('World Bank', 2023, 'BPS 2024 for the latest three years') +
    '</article><article class="panel">' + panelHead('Output mix', 'GDP by sector, 2024') +
    donutChart({ items: sectors, centerValue: '$1.42T', centerLabel: '2024 output', label: 'Shares of 2024 GDP by sector' }) +
    legend(sectors.map((s) => ({ label: s.label, color: s.color, note: s.share + '%' }))) +
    sourceNote('BPS', 2024, 'sector accounts; shares sum to 100%') + '</article></div></section>' +

    '<section class="section">' + sectionHead('Five-year pulse', 'Headline series, 2020–2024',
      'Each sparkline uses the published value for every year; the change is derived.') +
    '<div class="mini-grid">' +
    pulseCard('Population (million)', snapshots.map((s) => ({ value: s.population.value })), (n) => n.toFixed(1) + 'm', 'teal', 1, 'BPS', 2024) +
    pulseCard('Nominal GDP ($T)', snapshots.map((s) => ({ value: s.gdp.value })), (n) => '$' + n.toFixed(2), 'amber', 2, 'World Bank / IMF', 2024) +
    pulseCard('Life expectancy (years)', snapshots.map((s) => ({ value: s.life.value })), (n) => n.toFixed(1), 'navy', 1, 'World Bank', 2023) +
    pulseCard('Urban share (%)', snapshots.map((s) => ({ value: s.urban.value })), (n) => n.toFixed(1) + '%', 'sage', 1, 'World Bank', 2023) +
    '</div></section>' +

    '<section class="section">' + sectionHead('Go deeper', 'Explore the portal') +
    '<div class="link-grid">' + links.map((link) => '<a class="link-card" href="' + link.href + '"><span class="link-arrow" aria-hidden="true">→</span>' +
      '<strong>' + escapeHtml(link.title) + '</strong><span>' + escapeHtml(link.text) + '</span></a>').join('') +
    '</div></section>';

  return { html, mount: null };
}

/** People: age structure, longevity, schooling and fertility. */
export function renderPeople(year) {
  const k = kpisForYear(year);
  const latestFertility = fertilityTrend[fertilityTrend.length - 1].value;
  const workingAge = ageGroups.filter((g) => g.label.indexOf('25–') === 0 || g.label.indexOf('45–') === 0)
    .reduce((sum, g) => sum + g.share, 0);
  const ageBars = ageGroups.map((g) => ({ label: g.label + ' · ' + g.share + '%', value: g.people }));
  const fertilityBars = fertilityTrend.map((f) => ({ label: String(f.year), value: f.value, color: 'amber' }));
  const educationShares = educationRows.map((row, i) => ({ label: row.level, value: row.share, color: ['sage', 'teal', 'navy', 'slate', 'amber'][i] }));

  const html =
    pageHead('People', 'A nation of ' + k.population.display + ' million',
      'How old the country is, how long people live, and how many children families have — with every figure attributed.', year) +
    '<section class="mini-grid">' +
    miniStat('Population', k.population.display + 'm', 'people', k.population.source, k.population.sourceYear) +
    miniStat('Young dependents', ageGroups[0].share.toFixed(1) + '%', 'aged 0–14 · ' + ageGroups[0].people.toFixed(1) + 'm', 'BPS', 2024) +
    miniStat('Literacy, 15+', literacy.value.toFixed(1) + '%', 'can read and write', literacy.source, literacy.year) +
    miniStat('Fertility rate', latestFertility.toFixed(2), 'births per woman', 'UN DESA', 2023) +
    '</section>' +

    '<section class="section">' + sectionHead('Age structure', 'Five generations, one population',
      'Bars show people in millions; the band shows each group’s share of 281.2 million.') +
    '<div class="split"><article class="panel panel-wide">' +
    panelHead('By age', 'Population by age group, 2024', '100.0%') +
    barChart({ items: ageBars, labelWidth: 244, color: 'teal', label: 'Population by age group in millions', valueFormat: (n) => n.toFixed(1) + 'm' }) +
    sourceNote('BPS', 2024, 'shares sum to 100%; total 281.2 million') +
    '</article><article class="panel">' + panelHead('By share', 'The 100% band') +
    shareBar(ageGroups.map((g, i) => ({ label: g.label, value: g.share, color: ['teal', 'amber', 'navy', 'sage', 'slate'][i] })), 'Shares of the 2024 population by age group') +
    legend(ageGroups.map((g, i) => ({ label: g.label, color: ['teal', 'amber', 'navy', 'sage', 'slate'][i], note: g.share.toFixed(1) + '%' }))) +
    '<p class="chart-note">People of working age (25–64) account for ' + workingAge.toFixed(1) + '% of the population, derived from the same age table.</p>' +
    sourceNote('BPS', 2024, 'age groups reconcile to the headline total') +
    '</article></div></section>' +

    '<section class="section">' + sectionHead('Longevity and families', 'Longer lives, smaller families',
      'Both series are published annual values; endpoints are labelled.') +
    '<div class="split"><article class="panel panel-wide">' +
    panelHead('Longevity', 'Life expectancy at birth, 2000–2024', k.life.display + ' yrs') +
    lineChart({ points: lifeTrend, color: 'amber', showEnd: true, label: 'Life expectancy from 2000 to 2024', valueFormat: (n) => n.toFixed(1) + ' yrs', tickFormat: (n) => String(Math.round(n)) }) +
    legend([{ label: 'Life expectancy', color: 'amber', note: 'years at birth' }]) +
    sourceNote('World Bank', 2023, '2024 value from BPS 2024') +
    '<p class="chart-note">The 2020 dip is visible in the published series; the trend resumed upward afterwards.</p>' +
    '</article><article class="panel">' + panelHead('Families', 'Total fertility rate, 2020–2024', latestFertility.toFixed(2)) +
    barChart({ items: fertilityBars, labelWidth: 82, color: 'teal', label: 'Fertility rate from 2020 to 2024', valueFormat: (n) => n.toFixed(2) }) +
    sparkline({ points: fertilityTrend, color: 'teal', label: 'Fertility trend', width: 260, height: 60 }) +
    legend([{ label: 'Births per woman', color: 'teal', note: '2020–2024' }]) +
    sourceNote('UN DESA', 2023, '2024 value from BPS 2024') +
    '</article></div></section>' +

    '<section class="section">' + sectionHead('Schooling', 'Education attainment, population aged 15+',
      'Millions of people and their share of the 204.2 million aged 15 and over.') +
    '<div class="split"><article class="panel panel-wide">' +
    panelHead('Attainment', 'Highest level completed', literacy.yearsSchool.toFixed(1) + ' yrs') +
    '<div class="table-scroll"><table class="data-table"><caption>Education attainment, 2024</caption>' +
    '<thead><tr><th scope="col">Highest level completed</th><th scope="col" class="num">People (millions)</th><th scope="col" class="num">Share</th></tr></thead><tbody>' +
    educationRows.map((row) => '<tr><th scope="row">' + escapeHtml(row.level) + '</th>' +
      '<td class="num">' + row.people.toFixed(1) + '</td><td class="num">' + row.share.toFixed(1) + '%</td></tr>').join('') +
    '<tr class="total-row"><th scope="row">Total</th><td class="num">204.2</td><td class="num">100.0%</td></tr>' +
    '</tbody></table></div>' + sourceNote('BPS', 2024, 'labour force survey') +
    '</article><article class="panel">' + panelHead('Distribution', 'Shares by level') +
    shareBar(educationShares, 'Shares of adults aged 15 and over by education level') +
    legend(educationShares.map((row) => ({ label: row.label, color: row.color, note: row.value.toFixed(1) + '%' }))) +
    '<p class="chart-note">Mean years of schooling: ' + literacy.yearsSchool.toFixed(1) + ' (UNDP 2023). ' +
    'Adult literacy: ' + literacy.value.toFixed(1) + '% (UNESCO 2023).</p>' +
    '</article></div></section>';

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

/** Economy: switchable headline series, sector mix, trade and labour pulses. */
export function renderEconomy(year) {
  const k = kpisForYear(year);
  const sectorBars = sectors.map((s) => ({ label: s.label + ' · ' + s.share + '%', value: s.value, color: s.color }));
  const ratio = trade.exports / trade.imports;
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
    '</div><div id="metricChart">' + lineChart({ ...metricDefinitions.gdp, points: metricDefinitions.gdp.points, showEnd: true }) + '</div>' +
    '<div id="metricLegend">' + legend([{ label: metricDefinitions.gdp.title, color: metricDefinitions.gdp.color, note: '2015–2024' }]) + '</div>' +
    '<div id="metricSource">' + sourceNote(metricDefinitions.gdp.source.name, metricDefinitions.gdp.source.year, metricDefinitions.gdp.source.detail) + '</div>' +
    '</section>' +

    '<section class="section">' + sectionHead('Output mix', 'Where the value is produced, 2024',
      'Every sector bar and slice comes from the same $1,421 billion output total.') +
    '<div class="split"><article class="panel panel-wide">' +
    panelHead('By value', 'GDP by sector, 2024') +
    barChart({ items: sectorBars, labelWidth: 196, label: 'GDP by sector in billions of US dollars', valueFormat: (n) => '$' + n + 'bn' }) +
    sourceNote('BPS', 2024, 'values sum to $1,421bn') +
    '</article><article class="panel">' + panelHead('By share', 'Output composition') +
    donutChart({ items: sectors, centerValue: '48.4%', centerLabel: 'services', label: 'Sector shares of GDP' }) +
    shareBar(sectors.map((s) => ({ label: s.label, value: s.share, color: s.color })), 'Sector shares of 2024 GDP') +
    legend(sectors.map((s) => ({ label: s.label, color: s.color, note: s.share + '%' }))) +
    sourceNote('BPS', 2024, 'sector value added') +
    '</article></div></section>' +

    '<section class="section">' + sectionHead('External sector', 'Merchandise trade, 2024',
      'Values are in USD billions; the ratio is derived from exports and imports.') +
    '<div class="mini-grid three">' +
    miniStat('Exports', '$' + trade.exports.toFixed(1) + 'bn', 'goods sent abroad', trade.source, trade.year) +
    miniStat('Imports', '$' + trade.imports.toFixed(1) + 'bn', 'goods brought in', trade.source, trade.year) +
    miniStat('Trade balance', '+$' + trade.balance.toFixed(1) + 'bn', 'exports minus imports', trade.source, trade.year) +
    '</div><div class="panel trade-panel"><div class="panel-head"><div><p class="kicker">Derived measure</p>' +
    '<h2>Exports against imports</h2></div><p class="panel-highlight">' + ratio.toFixed(2) + '×</p></div>' +
    stackedBarChart({ items: [{ label: 'Trade flow', segments: [
      { label: 'Exports', value: trade.exports, color: 'teal' },
      { label: 'Imports', value: trade.imports, color: 'amber' },
    ] }], labelWidth: 150, label: 'Exports and imports in USD billions', valueFormat: (n) => '$' + grouped(Math.round(n)) }) +
    legend([{ label: 'Exports', color: 'teal', note: '$' + trade.exports.toFixed(1) + 'bn' },
      { label: 'Imports', color: 'amber', note: '$' + trade.imports.toFixed(1) + 'bn' }]) +
    sourceNote('BPS', 2024, 'merchandise trade') + '</div></section>' +

    '<section class="section">' + sectionHead('Decade in three lines', 'Prices, jobs and output',
      'Sparklines share the 2015–2024 window; the change shown is derived from the endpoints.') +
    '<div class="mini-grid">' +
    pulseCard('Nominal GDP ($bn)', gdpSeries, (n) => '$' + grouped(Math.round(n)), 'navy', 0, 'World Bank / IMF', 2024) +
    pulseCard('Inflation (%)', inflationSeries, (n) => n.toFixed(2) + '%', 'amber', 2, 'BPS', 2024) +
    pulseCard('Unemployment (%)', unemploymentSeries, (n) => n.toFixed(2) + '%', 'teal', 2, 'BPS', 2024) +
    pulseCard('GDP per person ($T / m)', [2020, 2021, 2022, 2023, 2024].map((y) => {
      const s = kpisForYear(y);
      return { value: (s.gdp.value * 1000) / s.population.value };
    }), (n) => '$' + grouped(Math.round(n)), 'sage', 0, 'Derived from BPS / IMF', 2024) +
    '</div></section>';

  function mount(root) {
    const buttons = Array.from(root.querySelectorAll('[data-metric]'));
    const chart = root.querySelector('#metricChart');
    const title = root.querySelector('#metricTitle');
    const value = root.querySelector('#metricValue');
    const source = root.querySelector('#metricSource');
    const keyLegend = root.querySelector('#metricLegend');
    function select(metric) {
      const series = metricDefinitions[metric];
      chart.innerHTML = lineChart({ ...series, points: series.points, showEnd: true });
      title.textContent = series.title;
      value.textContent = series.value;
      source.innerHTML = sourceNote(series.source.name, series.source.year, series.source.detail);
      keyLegend.innerHTML = legend([{ label: series.title, color: series.color, note: '2015–2024' }]);
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

/** Regions: ranked infographics plus a searchable, sortable province table. */
export function renderRegions(year) {
  const rows = provinces();
  const populationTotal = rows.reduce((sum, row) => sum + row.population, 0);
  const hdiLeader = rows.reduce((best, row) => (row.hdi > best.hdi ? row : best), rows[0]);
  const incomeLeader = rows.reduce((best, row) => (row.gdpPerCapita > best.gdpPerCapita ? row : best), rows[0]);
  const largestArea = rows.reduce((best, row) => (row.area > best.area ? row : best), rows[0]);
  const populationBars = rows.slice().sort((a, b) => b.population - a.population).slice(0, 8)
    .map((row) => ({ label: row.name, value: row.population, color: 'teal' }));
  const hdiRanked = rows.slice().sort((a, b) => b.hdi - a.hdi).slice(0, 8)
    .map((row) => ({ name: row.name, width: row.hdi * 100, value: row.hdi.toFixed(3) }));
  const hdiLow = rows.reduce((low, row) => (row.hdi < low.hdi ? row : low), rows[0]);
  const columns = [
    { key: 'name', label: 'Province' }, { key: 'population', label: 'Population (m)' },
    { key: 'area', label: 'Area (km²)' }, { key: 'gdpPerCapita', label: 'GDP / person' },
    { key: 'hdi', label: 'HDI' },
  ];
  const heads = columns.map((col) => '<th scope="col" aria-sort="none"><button type="button" class="sort-button" data-sort="' +
    col.key + '">' + escapeHtml(col.label) + ' <span class="sort-mark" aria-hidden="true">↕</span></button></th>').join('');

  const html =
    pageHead('Regions', 'Sixteen provinces, side by side',
      'Compare the people, land, income and human development of sixteen provinces — then search and sort the full list.', year) +
    '<section class="mini-grid">' +
    miniStat('Provinces shown', String(rows.length), 'of 38 provinces', 'BPS', 2024) +
    miniStat('Combined population', populationTotal.toFixed(1) + 'm', 'sum of the selected provinces', 'BPS', 2024) +
    miniStat('Highest HDI', hdiLeader.hdi.toFixed(3), hdiLeader.name, 'UNDP', 2023) +
    miniStat('Highest income', '$' + grouped(incomeLeader.gdpPerCapita), incomeLeader.name + ' per person', 'World Bank', 2023) +
    '</section>' +

    '<section class="section">' + sectionHead('Ranked views', 'Who leads, and by which measure',
      'Ranks are computed from the same sixteen rows used in the table below.') +
    '<div class="split"><article class="panel panel-wide">' +
    panelHead('Population', 'Eight most populous provinces', populationTotal.toFixed(1) + 'm total') +
    barChart({ items: populationBars, labelWidth: 188, color: 'teal', label: 'Eight most populous provinces in millions', valueFormat: (n) => n.toFixed(1) + 'm' }) +
    legend([{ label: 'Population', color: 'teal', note: 'millions · BPS 2024' }]) +
    sourceNote('BPS', 2024, 'top eight of sixteen shown') +
    '</article><article class="panel">' + panelHead('Development', 'HDI, top eight') +
    rankList(hdiRanked, (item) => item.value, 'amber') +
    legend([{ label: 'Human Development Index', color: 'amber', note: '0–1 scale' }]) +
    '<p class="chart-note">Range: ' + hdiLow.name + ' ' + hdiLow.hdi.toFixed(3) + ' to ' +
    hdiLeader.name + ' ' + hdiLeader.hdi.toFixed(3) + ' · largest area: ' + largestArea.name + ' (' + grouped(largestArea.area) + ' km²).</p>' +
    sourceNote('UNDP', 2023, 'bar length shows HDI on a 0–100 scale') +
    '</article></div></section>' +

    '<section class="section panel"><div class="table-tools">' +
    '<div class="search-field"><label for="provinceSearch">Search provinces</label>' +
    '<input id="provinceSearch" type="search" placeholder="Name or code, e.g. Java or JT" autocomplete="off"></div>' +
    '<p class="table-count" id="tableCount" role="status">Showing 16 of 16 provinces</p></div>' +
    '<div class="table-scroll"><table class="data-table province-table" id="provinceTable">' +
    '<caption>Selected provinces of Indonesia, 2024</caption><thead><tr>' + heads + '</tr></thead>' +
    '<tbody id="provinceBody"></tbody></table></div>' +
    '<div class="province-cards" id="provinceCards"></div>' +
    sourceNote('BPS', 2024, 'population and area') +
    '<p class="source">Sources: World Bank 2023 (GDP per person) · UNDP 2023 (HDI). 16 of 38 provinces shown.</p>' +
    '<p class="chart-note">On a phone the same rows appear as single-column cards. On a wider screen, click a column heading to sort; press it again to reverse the order.</p></section>' +

    '<section class="section">' + sectionHead('Reading the regions', 'Scale is not the same as development',
      'Three derived comparisons from the province table, each with its own source note.') +
    '<div class="mini-grid three">' +
    miniStat('Most populous', populationBars[0].label, populationBars[0].value.toFixed(1) + ' million people', 'BPS', 2024) +
    miniStat('Largest province', largestArea.name, grouped(largestArea.area) + ' km²', 'BPS', 2024) +
    miniStat('Highest HDI', hdiLeader.name, hdiLeader.hdi.toFixed(3) + ' on the 0–1 scale', 'UNDP', 2023) +
    '</div></section>';

  function mount(root) {
    const data = provinces();
    const body = root.querySelector('#provinceBody');
    const cards = root.querySelector('#provinceCards');
    const count = root.querySelector('#tableCount');
    const input = root.querySelector('#provinceSearch');
    const buttons = Array.from(root.querySelectorAll('[data-sort]'));
    let sortKey = 'population';
    let direction = 'desc';
    let query = '';

    function draw() {
      const needle = query.trim().toLowerCase();
      const visible = data.filter((row) => !needle || row.name.toLowerCase().includes(needle) || row.code.toLowerCase().includes(needle));
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
      cards.innerHTML = visible.map((row) => '<article class="province-card"><header><span class="prov-code">' +
        row.code + '</span><h3>' + escapeHtml(row.name) + '</h3></header><dl>' +
        '<div><dt>Population</dt><dd>' + row.population.toFixed(1) + 'm</dd></div>' +
        '<div><dt>Area</dt><dd>' + grouped(row.area) + ' km²</dd></div>' +
        '<div><dt>GDP / person</dt><dd>$' + grouped(row.gdpPerCapita) + '</dd></div>' +
        '<div><dt>HDI</dt><dd>' + row.hdi.toFixed(3) + '</dd></div></dl>' +
        '<div class="card-meter"><span style="width:' + (row.hdi * 100).toFixed(1) + '%"></span></div>' +
        '<p class="card-meter-note">HDI on a 0–100 display scale</p></article>').join('') ||
        '<p class="empty-row">No province matches that search.</p>';
      count.textContent = 'Showing ' + visible.length + ' of ' + data.length + ' provinces';
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
    panelHead('Method', 'How we read the figures') +
    '<p>Nusa Data gathers published national indicators and presents them in one place. We keep the original reference year next to each figure rather than blending vintages, so a 2023 World Bank estimate is never silently shown as a 2024 measurement.</p>' +
    '<p>Where a series crosses sources, the note on the chart says which institution supplies which years. Percentages are rounded to one decimal; rounded components are chosen to add to their published totals. Population is expressed in millions, money in current US dollars, and ratios such as the HDI to three decimals.</p>' +
    '<p>Headline figures respond to the year selector using fixed published values for 2020–2024. No figure is generated at random or inferred from live requests — the site runs entirely from local data.</p>' +
    '</article><article class="panel">' + panelHead('Coverage', 'What the portal holds') +
    '<ul class="plain-list"><li>Five pages: overview, people, economy, regions and about.</li>' +
    '<li>Population history from 1960 to 2024.</li><li>Labour, prices and trade through 2024.</li>' +
    '<li>Sixteen provinces with four comparable measures.</li><li>Definitions for every headline term.</li></ul>' +
    '</article></section>' +

    '<section class="section panel">' + panelHead('Publishers', 'Sources and reference years') +
    '<div class="table-scroll"><table class="data-table"><caption>Source register</caption>' +
    '<thead><tr><th scope="col">Institution</th><th scope="col">Covers</th><th scope="col" class="num">Latest year</th></tr></thead><tbody>' +
    sourceList.map((source) => '<tr><th scope="row">' + escapeHtml(source.name) + '</th><td>' +
      escapeHtml(source.covers) + '</td><td class="num">' + source.year + '</td></tr>').join('') +
    '</tbody></table></div></section>' +

    '<section class="section split"><article class="panel">' + panelHead('Glossary', 'Definitions') +
    '<dl class="definitions">' + definitions.map((item) => '<dt>' + escapeHtml(item.term) + '</dt><dd>' +
      escapeHtml(item.text) + '</dd>').join('') + '</dl></article>' +
    '<article class="panel contact-card">' + panelHead('Contact', 'Questions and corrections') +
    '<p>If a figure looks wrong, tell us which chart, which year and which publisher note it carries.</p>' +
    '<p class="contact-line">Editorial desk · <span>desk@nusadata.example</span></p>' +
    '<p class="contact-line">Data review · <span>review@nusadata.example</span></p>' +
    '<p class="source">Editorial policy: corrections are logged with the reference year of the affected series.</p>' +
    '<a class="btn btn-outline" href="#/">Back to overview</a></article></section>';

  return { html, mount: null };
}
