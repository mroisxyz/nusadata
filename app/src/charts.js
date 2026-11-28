// Nusa Data — deterministic SVG primitives. Every mark is derived from the supplied figures.
// No libraries, no remote files, no random values and no clock access.

export const palette = {
  teal: '#0f8b8d',
  amber: '#d99232',
  navy: '#12324f',
  mist: '#dce6e6',
  sage: '#7a9a8c',
  slate: '#5b7b91',
  gold: '#e5b25c',
  coral: '#b3632c',
};

/** Resolve a named series colour without ever inventing a value. */
export function colorOf(name) {
  return palette[name] || palette.teal;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

const fixed = (n, digits) => Number(n).toFixed(digits);
let serial = 0;
const nextId = (prefix) => prefix + '-' + (++serial);

/** Line and area chart from [{year, value}]; all geometry derived from the data. */
export function lineChart(options) {
  const points = options.points || [];
  if (points.length === 0) return '<p class="chart-empty">No series available.</p>';
  const width = 720;
  const height = options.height || 300;
  const left = 58;
  const right = 20;
  const top = 24;
  const bottom = 46;
  const fmt = options.valueFormat || ((n) => fixed(n, 1));
  const tickFmt = options.tickFormat || fmt;
  const color = colorOf(options.color || 'teal');
  const values = points.map((p) => p.value);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const pad = (highest - lowest || 1) * 0.14;
  const low = lowest - pad;
  const high = highest + pad;
  const xAt = (i) => left + (i * (width - left - right)) / Math.max(1, points.length - 1);
  const yAt = (v) => top + (height - top - bottom) * (1 - (v - low) / (high - low || 1));
  const gradientId = nextId('nda-area');

  const grid = [];
  for (let step = 0; step <= 4; step += 1) {
    const v = low + ((high - low) * step) / 4;
    const y = yAt(v);
    grid.push(
      '<line class="grid" x1="' + left + '" y1="' + fixed(y, 2) + '" x2="' + (width - right) + '" y2="' + fixed(y, 2) + '"/>',
      '<text class="axis-label" x="' + (left - 10) + '" y="' + fixed(y + 4, 2) + '" text-anchor="end">' + escapeHtml(tickFmt(v)) + '</text>'
    );
  }

  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + fixed(xAt(i), 2) + ' ' + fixed(yAt(p.value), 2)).join(' ');
  const base = height - bottom;
  const area = path + ' L' + fixed(xAt(points.length - 1), 2) + ' ' + base + ' L' + fixed(xAt(0), 2) + ' ' + base + ' Z';

  const every = Math.max(1, Math.ceil(points.length / 7));
  const ticks = [];
  points.forEach((p, i) => {
    if (i % every === 0 || i === points.length - 1) {
      ticks.push('<text class="axis-label" x="' + fixed(xAt(i), 2) + '" y="' + (height - 16) + '" text-anchor="middle">' + p.year + '</text>');
    }
  });
  const dots = points.map((p, i) =>
    '<circle class="dot" cx="' + fixed(xAt(i), 2) + '" cy="' + fixed(yAt(p.value), 2) + '" r="3.4" fill="' + color + '"><title>' + p.year + ': ' + escapeHtml(fmt(p.value)) + '</title></circle>'
  ).join('');
  const last = points.length - 1;
  const end = options.showEnd
    ? '<circle cx="' + fixed(xAt(last), 2) + '" cy="' + fixed(yAt(last), 2) + '" r="6.5" fill="' + color + '" stroke="#fffdf8" stroke-width="2"/>' +
      '<text class="axis-label" x="' + fixed(xAt(last) - 8, 2) + '" y="' + fixed(yAt(last) - 14, 2) + '" text-anchor="end" style="font-weight:700;fill:#12324f">' + escapeHtml(fmt(points[last].value)) + '</text>'
    : '';

  return '<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(options.label || 'Trend chart') + '">' +
    '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.28"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/></linearGradient></defs>' +
    grid.join('') +
    '<path d="' + area + '" fill="url(#' + gradientId + ')"/>' +
    '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots + end + ticks.join('') +
    '<line class="axis-line" x1="' + left + '" y1="' + base + '" x2="' + (width - right) + '" y2="' + base + '"/>' +
    '</svg>';
}

/** Horizontal bars from [{label, value, color?}]; labels stay readable on narrow screens. */
export function barChart(options) {
  const items = options.items || [];
  if (items.length === 0) return '<p class="chart-empty">No categories available.</p>';
  const width = 720;
  const rowHeight = 52;
  const height = items.length * rowHeight + 18;
  const trackX = options.labelWidth || 196;
  const trackW = width - trackX - 108;
  const top = 8;
  const highest = Math.max(...items.map((item) => item.value));
  const fmt = options.valueFormat || ((n) => fixed(n, 1));
  const rows = items.map((item, i) => {
    const y = top + i * rowHeight;
    const w = Math.max(2, (item.value / (highest || 1)) * trackW);
    const fill = colorOf(item.color || options.color || 'teal');
    return '<text class="bar-label" x="0" y="' + (y + 25) + '">' + escapeHtml(item.label) + '</text>' +
      '<rect class="bar-track" x="' + trackX + '" y="' + (y + 8) + '" width="' + trackW + '" height="22" rx="4"/>' +
      '<rect x="' + trackX + '" y="' + (y + 8) + '" width="' + fixed(w, 2) + '" height="22" rx="4" fill="' + fill + '"/>' +
      '<text class="bar-value" x="' + (width - 4) + '" y="' + (y + 25) + '" text-anchor="end">' + escapeHtml(fmt(item.value)) + '</text>';
  });
  return '<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(options.label || 'Bar chart') + '">' + rows.join('') + '</svg>';
}

/** Donut ring plus an in-chart legend from [{label, share, value, color}]. */
export function donutChart(options) {
  const items = options.items || [];
  if (items.length === 0) return '<p class="chart-empty">No sectors available.</p>';
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const center = 128;
  let offset = 0;
  const fmtValue = options.valueFormat || ((item) => '$' + item.value + 'bn');
  const slices = items.map((item) => {
    const length = (item.share / 100) * circumference;
    const dash = fixed(length, 3) + ' ' + fixed(circumference - length, 3);
    const shift = fixed(-offset, 3);
    offset += length;
    return '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="none" stroke="' + colorOf(item.color) + '" stroke-width="27" stroke-dasharray="' + dash + '" stroke-dashoffset="' + shift + '" transform="rotate(-90 ' + center + ' ' + center + ')"><title>' + escapeHtml(item.label) + ': ' + item.share + '%</title></circle>';
  });
  const legend = items.map((item, i) => {
    const y = 76 + i * 42;
    return '<rect x="268" y="' + (y - 12) + '" width="13" height="13" rx="2" fill="' + colorOf(item.color) + '"/>' +
      '<text class="legend-label" x="290" y="' + y + '">' + escapeHtml(item.label) + '</text>' +
      '<text class="legend-value" x="290" y="' + (y + 18) + '">' + item.share + '% · ' + escapeHtml(fmtValue(item)) + '</text>';
  });
  return '<svg class="chart donut" viewBox="0 0 440 272" role="img" aria-label="' + escapeHtml(options.label || 'Sector donut chart') + '">' +
    '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="none" stroke="' + palette.mist + '" stroke-width="27"/>' +
    slices.join('') +
    '<text class="donut-value" x="' + center + '" y="' + (center + 2) + '" text-anchor="middle">' + escapeHtml(options.centerValue || '') + '</text>' +
    '<text class="donut-caption" x="' + center + '" y="' + (center + 25) + '" text-anchor="middle">' + escapeHtml(options.centerLabel || '') + '</text>' +
    legend.join('') +
    '</svg>';
}

/** Compact area-and-line glyph for small multiples; no axes, just shape and endpoint. */
export function sparkline(options) {
  const points = options.points || [];
  if (points.length === 0) return '<p class="chart-empty">No series available.</p>';
  const width = options.width || 260;
  const height = options.height || 74;
  const pad = 7;
  const values = points.map((p) => p.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || 1;
  const xAt = (i) => pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1);
  const yAt = (v) => pad + (height - pad * 2) * (1 - (v - low) / span);
  const color = colorOf(options.color || 'teal');
  const gradientId = nextId('spark');
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + fixed(xAt(i), 2) + ' ' + fixed(yAt(p.value), 2)).join(' ');
  const area = path + ' L' + fixed(xAt(points.length - 1), 2) + ' ' + (height - pad) + ' L' + fixed(xAt(0), 2) + ' ' + (height - pad) + ' Z';
  const last = points.length - 1;
  return '<svg class="chart sparkline" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(options.label || 'Trend sparkline') + '">' +
    '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.30"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/></linearGradient></defs>' +
    '<line x1="' + pad + '" y1="' + (height - pad) + '" x2="' + (width - pad) + '" y2="' + (height - pad) + '" stroke="#dde4e2"/>' +
    '<path d="' + area + '" fill="url(#' + gradientId + ')"/>' +
    '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="' + fixed(xAt(last), 2) + '" cy="' + fixed(yAt(last), 2) + '" r="4" fill="' + color + '" stroke="#fffdf8" stroke-width="1.6"/>' +
    '</svg>';
}

/** Segmented horizontal bars from [{label, segments:[{value,color}]}]. */
export function stackedBarChart(options) {
  const items = options.items || [];
  if (items.length === 0) return '<p class="chart-empty">No categories available.</p>';
  const width = 720;
  const rowHeight = 78;
  const height = items.length * rowHeight + 10;
  const trackX = options.labelWidth || 170;
  const trackW = width - trackX - 100;
  const totals = items.map((item) => item.segments.reduce((sum, segment) => sum + segment.value, 0));
  const max = options.max || Math.max(...totals);
  const fmt = options.valueFormat || ((n) => fixed(n, 1));
  const rows = items.map((item, i) => {
    const y = 8 + i * rowHeight;
    let cursor = trackX;
    const segments = item.segments.map((segment) => {
      const w = (segment.value / (max || 1)) * trackW;
      const rect = '<rect x="' + fixed(cursor, 2) + '" y="' + (y + 14) + '" width="' + fixed(w, 2) + '" height="24" fill="' + colorOf(segment.color) + '"><title>' + escapeHtml(segment.label) + ': ' + escapeHtml(fmt(segment.value)) + '</title></rect>';
      cursor += w;
      return rect;
    });
    return '<text class="bar-label" x="0" y="' + (y + 32) + '">' + escapeHtml(item.label) + '</text>' +
      '<rect class="bar-track" x="' + trackX + '" y="' + (y + 14) + '" width="' + trackW + '" height="24" rx="3"/>' +
      segments.join('') +
      '<text class="bar-value" x="' + (width - 4) + '" y="' + (y + 32) + '" text-anchor="end">' + escapeHtml(fmt(totals[i])) + '</text>';
  });
  return '<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(options.label || 'Segmented bar chart') + '">' + rows.join('') + '</svg>';
}

/**
 * Hero composition: a long population area with a right-hand urban-share overlay.
 * Population supplies the x scale; the urban series aligns to its final years.
 */
export function heroChart(options) {
  const population = options.population || [];
  const urban = options.urban || [];
  if (population.length === 0) return '<p class="chart-empty">No trend available.</p>';
  const width = 1200;
  const height = 400;
  const left = 66;
  const right = 98;
  const top = 24;
  const bottom = 44;
  const base = height - bottom;
  const plotW = width - left - right;
  const plotH = base - top;
  const maxPopulation = Math.max(...population.map((p) => p.value));
  const high = Math.ceil((maxPopulation * 1.12) / 40) * 40;
  const uValues = urban.map((p) => p.value);
  const uLow = uValues.length ? Math.floor((Math.min(...uValues) - 1) / 2) * 2 : 0;
  const uHigh = uValues.length ? Math.ceil((Math.max(...uValues) + 1) / 2) * 2 : 1;
  const xAt = (i) => left + (i * plotW) / Math.max(1, population.length - 1);
  const yAt = (v) => top + plotH * (1 - v / (high || 1));
  const uY = (v) => top + plotH * (1 - (v - uLow) / (uHigh - uLow || 1));
  const teal = '#52cfc2';
  const amber = '#f0b35e';
  const gradientId = nextId('hero-area');
  const marks = [];

  for (let step = 0; step <= 4; step += 1) {
    const v = (high * step) / 4;
    const y = yAt(v);
    marks.push('<line x1="' + left + '" y1="' + fixed(y, 2) + '" x2="' + (width - right) + '" y2="' + fixed(y, 2) + '" stroke="#345673" stroke-opacity="' + (step === 0 ? '0.9' : '0.55') + '"/>');
    marks.push('<text x="' + (left - 12) + '" y="' + fixed(y + 5, 2) + '" text-anchor="end" fill="#a9bfcd" font-size="14">' + Math.round(v) + '</text>');
    if (uValues.length) {
      const uv = uLow + ((uHigh - uLow) * step) / 4;
      marks.push('<text x="' + (width - right + 12) + '" y="' + fixed(uY(uv) + 5, 2) + '" text-anchor="start" fill="#e9b16a" font-size="14">' + uv.toFixed(0) + '%</text>');
    }
  }

  const path = population.map((p, i) => (i === 0 ? 'M' : 'L') + fixed(xAt(i), 2) + ' ' + fixed(yAt(p.value), 2)).join(' ');
  const area = path + ' L' + fixed(xAt(population.length - 1), 2) + ' ' + base + ' L' + fixed(xAt(0), 2) + ' ' + base + ' Z';
  marks.push('<path d="' + area + '" fill="url(#' + gradientId + ')"/>');
  marks.push('<path d="' + path + '" fill="none" stroke="' + teal + '" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>');

  const offsetIndex = Math.max(0, population.length - urban.length);
  const urbanPath = urban.map((p, i) => (i === 0 ? 'M' : 'L') + fixed(xAt(offsetIndex + i), 2) + ' ' + fixed(uY(p.value), 2)).join(' ');
  if (urban.length) {
    marks.push('<path d="' + urbanPath + '" fill="none" stroke="' + amber + '" stroke-width="2.6" stroke-dasharray="7 5" stroke-linejoin="round"/>');
    urban.forEach((p, i) => {
      marks.push('<circle cx="' + fixed(xAt(offsetIndex + i), 2) + '" cy="' + fixed(uY(p.value), 2) + '" r="3.6" fill="' + amber + '"><title>' + p.year + ': ' + p.value.toFixed(1) + '%</title></circle>');
    });
  }

  const every = Math.max(1, Math.ceil(population.length / 6));
  population.forEach((p, i) => {
    if (i % every === 0 || i === population.length - 1) {
      marks.push('<text x="' + fixed(xAt(i), 2) + '" y="' + (height - 12) + '" text-anchor="middle" fill="#a9bfcd" font-size="14">' + p.year + '</text>');
    }
  });

  const first = population[0];
  const last = population[population.length - 1];
  const lastX = xAt(population.length - 1);
  const lastY = yAt(last.value);
  marks.push('<line x1="' + fixed(lastX, 2) + '" y1="' + fixed(lastY, 2) + '" x2="' + fixed(lastX, 2) + '" y2="' + base + '" stroke="' + teal + '" stroke-opacity="0.5" stroke-dasharray="4 5"/>');
  marks.push('<circle cx="' + fixed(xAt(0), 2) + '" cy="' + fixed(yAt(first.value), 2) + '" r="4.5" fill="' + teal + '" stroke="#0a1c2e" stroke-width="2"/>');
  marks.push('<text x="' + fixed(xAt(0) + 11, 2) + '" y="' + fixed(yAt(first.value) - 12, 2) + '" fill="#dbe7ec" font-size="15">' + first.value.toFixed(1) + 'm · ' + first.year + '</text>');
  const boxY = Math.max(6, lastY - 52);
  marks.push('<rect x="' + fixed(lastX - 146, 2) + '" y="' + fixed(boxY, 2) + '" width="136" height="38" rx="6" fill="#0d2538" stroke="' + teal + '" stroke-opacity="0.8"/>');
  marks.push('<text x="' + fixed(lastX - 78, 2) + '" y="' + fixed(boxY + 25, 2) + '" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="700">' + last.value.toFixed(1) + 'm · ' + last.year + '</text>');
  marks.push('<circle cx="' + fixed(lastX, 2) + '" cy="' + fixed(lastY, 2) + '" r="6" fill="' + teal + '" stroke="#0a1c2e" stroke-width="2"/>');
  if (urban.length) {
    const uLast = urban[urban.length - 1];
    marks.push('<text x="' + fixed(lastX + 10, 2) + '" y="' + fixed(uY(uLast.value) + 20, 2) + '" fill="' + amber + '" font-size="15" font-weight="700">' + uLast.value.toFixed(1) + '%</text>');
  }

  return '<svg class="chart hero-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(options.label || 'Population and urban share over time') + '">' +
    '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + teal + '" stop-opacity="0.34"/><stop offset="100%" stop-color="' + teal + '" stop-opacity="0.01"/></linearGradient></defs>' +
    marks.join('') + '</svg>';
}
