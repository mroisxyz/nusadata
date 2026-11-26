// Nusa Data — small SVG chart builders. No libraries, no remote assets.

const palette = { teal: '#0f8b8d', amber: '#d99232', navy: '#12324f', mist: '#dce6e6' };

export function colorOf(name) {
  return palette[name] || palette.teal;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

const fixed = (n, digits) => Number(n).toFixed(digits);

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
  const seq = (lineChart.serial = (lineChart.serial || 0) + 1);
  const gradientId = 'nda-area-' + seq;

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

  return '<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(options.label || 'Trend chart') + '">' +
    '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.28"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/></linearGradient></defs>' +
    grid.join('') +
    '<path d="' + area + '" fill="url(#' + gradientId + ')"/>' +
    '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots + ticks.join('') +
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

/** Donut ring plus an in-chart legend from [{label, share, color}]. */
export function donutChart(options) {
  const items = options.items || [];
  if (items.length === 0) return '<p class="chart-empty">No sectors available.</p>';
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const center = 128;
  let offset = 0;
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
      '<text class="legend-value" x="290" y="' + (y + 18) + '">' + item.share + '% · $' + item.value + 'bn</text>';
  });
  return '<svg class="chart donut" viewBox="0 0 440 272" role="img" aria-label="' + escapeHtml(options.label || 'Sector donut chart') + '">' +
    '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="none" stroke="' + palette.mist + '" stroke-width="27"/>' +
    slices.join('') +
    '<text class="donut-value" x="' + center + '" y="' + (center + 2) + '" text-anchor="middle">' + escapeHtml(options.centerValue || '') + '</text>' +
    '<text class="donut-caption" x="' + center + '" y="' + (center + 25) + '" text-anchor="middle">' + escapeHtml(options.centerLabel || '') + '</text>' +
    legend.join('') +
    '</svg>';
}
