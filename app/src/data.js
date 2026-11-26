// Nusa Data — curated national figures. Each figure names its publisher and year.
// Figures are coherent illustrative estimates built for this static reference site.
// Scaling rule: sector values, age groups and headline population all reconcile
// to the same 2024 reference totals; do not edit one without its companions.

export const country = {
  name: 'Republic of Indonesia',
  short: 'Indonesia',
  portal: 'Nusa Data',
  tagline: 'The archipelago, measured.',
  edition: '2024 reference year · reviewed 2025',
};

export const years = [2020, 2021, 2022, 2023, 2024];

const kpiTable = {
  2020: { population: 271.1, gdp: 1.06, life: 70.1, urban: 57.9 },
  2021: { population: 273.8, gdp: 1.19, life: 70.4, urban: 58.3 },
  2022: { population: 276.4, gdp: 1.32, life: 71.0, urban: 58.7 },
  2023: { population: 278.7, gdp: 1.37, life: 71.5, urban: 59.2 },
  2024: { population: 281.2, gdp: 1.42, life: 71.8, urban: 59.8 },
};

/** Deterministic headline figures for a selector year; unknown years fall back to 2024. */
export function kpisForYear(year) {
  const y = Object.hasOwn(kpiTable, year) ? year : 2024;
  const v = kpiTable[y];
  const money = y === 2024 ? { source: 'IMF', sourceYear: 2024 } : { source: 'World Bank', sourceYear: 2023 };
  return {
    year: y,
    population: { value: v.population, display: v.population.toFixed(1), unit: 'million people', source: 'BPS', sourceYear: y },
    gdp: { value: v.gdp, display: '$' + v.gdp.toFixed(2) + 'T', unit: 'nominal GDP', source: money.source, sourceYear: money.sourceYear },
    life: { value: v.life, display: v.life.toFixed(1), unit: 'years at birth', source: 'World Bank', sourceYear: 2023 },
    urban: { value: v.urban, display: v.urban.toFixed(1), unit: '% of population', source: 'World Bank', sourceYear: 2023 },
  };
}

const populationTrend = [
  { year: 1960, value: 87.8 }, { year: 1965, value: 97.9 }, { year: 1970, value: 109.6 },
  { year: 1975, value: 122.5 }, { year: 1980, value: 137.7 }, { year: 1985, value: 152.6 },
  { year: 1990, value: 167.7 }, { year: 1995, value: 181.4 }, { year: 2000, value: 193.9 },
  { year: 2005, value: 218.7 }, { year: 2010, value: 241.9 }, { year: 2015, value: 255.4 },
  { year: 2020, value: 271.1 }, { year: 2021, value: 273.8 }, { year: 2022, value: 276.4 },
  { year: 2023, value: 278.7 }, { year: 2024, value: 281.2 },
];

/** Population in millions, 1960–2024 (World Bank 2023; BPS 2024). */
export function trend() {
  return populationTrend.map((point) => ({ ...point }));
}

export const lifeTrend = [
  { year: 2000, value: 66.2 }, { year: 2005, value: 67.9 }, { year: 2010, value: 69.4 },
  { year: 2015, value: 70.7 }, { year: 2020, value: 70.1 }, { year: 2021, value: 70.4 },
  { year: 2022, value: 71.0 }, { year: 2023, value: 71.5 }, { year: 2024, value: 71.8 },
];

export const fertilityTrend = [
  { year: 2020, value: 2.19 }, { year: 2021, value: 2.17 }, { year: 2022, value: 2.14 },
  { year: 2023, value: 2.11 }, { year: 2024, value: 2.08 },
];

export const ageGroups = [
  { label: '0–14 years', people: 65.4, share: 23.3 },
  { label: '15–24 years', people: 45.9, share: 16.3 },
  { label: '25–44 years', people: 83.7, share: 29.8 },
  { label: '45–64 years', people: 62.0, share: 22.0 },
  { label: '65 years and over', people: 24.2, share: 8.6 },
];

export const educationRows = [
  { level: 'No schooling / incomplete primary', people: 18.6, share: 9.1 },
  { level: 'Primary school completed', people: 68.4, share: 33.5 },
  { level: 'Junior secondary completed', people: 47.2, share: 23.1 },
  { level: 'Senior secondary completed', people: 51.3, share: 25.1 },
  { level: 'Tertiary education completed', people: 18.7, share: 9.2 },
];

export const literacy = { value: 98.3, yearsSchool: 8.6, source: 'UNESCO', year: 2023 };

// Shares and values describe the same 2024 output of $1.42 trillion.
export const sectors = [
  { label: 'Agriculture', share: 12.9, value: 183, color: 'teal' },
  { label: 'Industry', share: 38.7, value: 550, color: 'amber' },
  { label: 'Services', share: 48.4, value: 688, color: 'navy' },
];

export const gdpSeries = [
  { year: 2015, value: 860 }, { year: 2016, value: 931 }, { year: 2017, value: 1015 },
  { year: 2018, value: 1042 }, { year: 2019, value: 1119 }, { year: 2020, value: 1059 },
  { year: 2021, value: 1186 }, { year: 2022, value: 1319 }, { year: 2023, value: 1371 },
  { year: 2024, value: 1421 },
];

export const inflationSeries = [
  { year: 2015, value: 3.35 }, { year: 2016, value: 3.02 }, { year: 2017, value: 3.61 },
  { year: 2018, value: 3.13 }, { year: 2019, value: 2.72 }, { year: 2020, value: 1.92 },
  { year: 2021, value: 1.56 }, { year: 2022, value: 4.21 }, { year: 2023, value: 3.67 },
  { year: 2024, value: 2.30 },
];

export const unemploymentSeries = [
  { year: 2015, value: 5.88 }, { year: 2016, value: 5.61 }, { year: 2017, value: 5.50 },
  { year: 2018, value: 5.23 }, { year: 2019, value: 5.23 }, { year: 2020, value: 7.07 },
  { year: 2021, value: 6.49 }, { year: 2022, value: 5.86 }, { year: 2023, value: 5.32 },
  { year: 2024, value: 4.91 },
];

export const trade = {
  exports: 262.4, imports: 232.8, balance: 29.6, unit: 'USD billion', source: 'BPS', year: 2024,
};

const provinceTable = [
  { name: 'Jawa Barat', code: 'JB', population: 49.6, area: 35378, gdpPerCapita: 5240, hdi: 0.758 },
  { name: 'Jawa Timur', code: 'JT', population: 41.0, area: 47800, gdpPerCapita: 5610, hdi: 0.755 },
  { name: 'Jawa Tengah', code: 'CT', population: 37.8, area: 40869, gdpPerCapita: 4480, hdi: 0.742 },
  { name: 'Sumatera Utara', code: 'SU', population: 15.5, area: 72981, gdpPerCapita: 4930, hdi: 0.736 },
  { name: 'Banten', code: 'BT', population: 12.4, area: 9662, gdpPerCapita: 5120, hdi: 0.749 },
  { name: 'DKI Jakarta', code: 'JK', population: 11.2, area: 740, gdpPerCapita: 18400, hdi: 0.834 },
  { name: 'Sulawesi Selatan', code: 'SS', population: 9.4, area: 45764, gdpPerCapita: 4760, hdi: 0.731 },
  { name: 'Lampung', code: 'LP', population: 9.3, area: 35376, gdpPerCapita: 3640, hdi: 0.711 },
  { name: 'Sumatera Selatan', code: 'SL', population: 8.7, area: 91592, gdpPerCapita: 4120, hdi: 0.723 },
  { name: 'Aceh', code: 'AC', population: 5.5, area: 57365, gdpPerCapita: 3820, hdi: 0.713 },
  { name: 'Nusa Tenggara Barat', code: 'NB', population: 5.6, area: 18572, gdpPerCapita: 3410, hdi: 0.701 },
  { name: 'Papua', code: 'PP', population: 4.4, area: 319036, gdpPerCapita: 6900, hdi: 0.661 },
  { name: 'Bali', code: 'BA', population: 4.2, area: 5780, gdpPerCapita: 6480, hdi: 0.772 },
  { name: 'Kalimantan Timur', code: 'KI', population: 4.1, area: 129066, gdpPerCapita: 13100, hdi: 0.789 },
  { name: 'DI Yogyakarta', code: 'YO', population: 4.1, area: 3133, gdpPerCapita: 4340, hdi: 0.775 },
  { name: 'Jambi', code: 'JA', population: 3.8, area: 50058, gdpPerCapita: 3980, hdi: 0.715 },
];

/** Sixteen of Indonesia's 38 provinces; population and area BPS 2024, income World Bank 2023, HDI UNDP 2023. */
export function provinces() {
  return provinceTable.map((row) => ({ ...row }));
}

export const sourceList = [
  { name: 'BPS — Statistics Indonesia', covers: 'Population, labour force, consumer prices, provincial accounts', year: 2024 },
  { name: 'World Bank — World Development Indicators', covers: 'GDP, urban share, life expectancy, provincial income', year: 2023 },
  { name: 'UN DESA — World Population Prospects', covers: 'Fertility and long-run population series', year: 2023 },
  { name: 'UNDP — Human Development Report', covers: 'HDI and mean years of schooling', year: 2023 },
  { name: 'UNESCO Institute for Statistics', covers: 'Adult literacy and education attainment', year: 2023 },
  { name: 'IMF — World Economic Outlook', covers: 'Nominal GDP and external sector cross-checks', year: 2024 },
];

export const definitions = [
  { term: 'Nominal GDP', text: 'The market value of final goods and services produced in a year, in current US dollars.' },
  { term: 'Life expectancy', text: 'Years a newborn would live if current age-specific mortality rates stayed constant.' },
  { term: 'Urban share', text: 'Share of people living in settlements classified as urban by the national statistical office.' },
  { term: 'HDI', text: 'Human Development Index: a 0–1 composite of health, education and income.' },
  { term: 'Total fertility rate', text: 'Average number of children a woman would have at prevailing age-specific rates.' },
];
