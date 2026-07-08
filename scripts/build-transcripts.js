/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '../content/transcripts');
const OUTPUT_HTML_DIR = path.resolve(__dirname, '../static/transcript-html');
const OUTPUT_DATA_PATH = path.resolve(__dirname, '../static/data/transcripts.json');
const OUTPUT_SUMMARY_PATH = path.resolve(__dirname, '../static/data/transcripts-summary.json');

const CATEGORY_CLASSES = [
  'REGION',
  'COUNTRY',
  'POPULATED_PLACE',
  'ENV_FEATURES',
  'DLF',
  'BUILDING',
  'INT_SPACE',
  'SPATIAL_OBJ',
  'NPIP'
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeSlug(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { meta: {}, body: raw };
  }

  let idx = 1;
  while (idx < lines.length && lines[idx].trim() !== '---') {
    idx += 1;
  }
  const metaLines = lines.slice(1, idx);
  let bodyLines = lines.slice(idx + 1);

  // Some files accidentally contain a duplicate front matter block; strip them.
  while (bodyLines[0]?.trim() === '---') {
    bodyLines = bodyLines.slice(1);
    let innerIdx = 0;
    while (innerIdx < bodyLines.length && bodyLines[innerIdx].trim() !== '---') {
      innerIdx += 1;
    }
    bodyLines = bodyLines.slice(innerIdx + 1);
  }

  const meta = {};
  metaLines.forEach((line) => {
    if (!line || !line.includes(':')) return;
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim();
    const value = rest.join(':').trim();
    if (!key) return;
    const numeric = Number(value);
    meta[key] = Number.isNaN(numeric) ? value : numeric;
  });

  const body = bodyLines.join('\n').trim();
  return { meta, body };
}

function buildCategories(html) {
  const categories = {};
  CATEGORY_CLASSES.forEach((cls) => {
    categories[cls] = [];
  });
  const regex = /<span class="(REGION|COUNTRY|POPULATED_PLACE|ENV_FEATURES|DLF|BUILDING|INT_SPACE|SPATIAL_OBJ|NPIP)"[^>]*>([\s\S]*?)<\/span>/gi;
  const stripTags = (value) => value.replace(/<\/?[^>]+>/g, '').trim();

  let match;
  while ((match = regex.exec(html)) !== null) {
    const [, cls, rawValue] = match;
    const cleaned = stripTags(rawValue);
    if (cleaned && !categories[cls].includes(cleaned)) {
      categories[cls].push(cleaned);
    }
  }
  return categories;
}

function buildExcerpt(html) {
  const text = html
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const slice = text.slice(0, 260);
  return slice.length < text.length ? `${slice}…` : slice;
}

function main() {
  ensureDir(OUTPUT_HTML_DIR);

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => file.toLowerCase().endsWith('.html'))
    .sort();

  if (!files.length) {
    console.warn('No transcript source files found.');
    return;
  }

  const seenSlugs = new Set();
  const manifest = files.map((file) => {
    const filePath = path.join(SOURCE_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { meta, body } = parseFrontMatter(raw);

    const rgRaw = (meta.rg_number || path.parse(file).name).toString();
    let slug = sanitizeSlug(rgRaw);
    if (!slug) {
      slug = sanitizeSlug(path.parse(file).name);
    }
    let uniqueSlug = slug;
    let counter = 1;
    while (seenSlugs.has(uniqueSlug)) {
      counter += 1;
      uniqueSlug = `${slug}-${counter}`;
    }
    seenSlugs.add(uniqueSlug);

    const cleanedHtml = body.trim();
    const categories = buildCategories(cleanedHtml);
    const compactCategories = Object.fromEntries(
      Object.entries(categories).filter(([, values]) => values.length)
    );
    const excerpt = buildExcerpt(cleanedHtml);

    const outputHtmlPath = path.join(OUTPUT_HTML_DIR, `${uniqueSlug}.html`);
    fs.writeFileSync(outputHtmlPath, cleanedHtml, 'utf8');

    return {
      slug: uniqueSlug,
      rg_number: rgRaw,
      interviewee: meta.interviewee || '',
      birth_year: meta.birth_year || null,
      birth_date: meta.birth_date || '',
      place_of_birth: meta.place_of_birth || '',
      country: meta.country || '',
      experience_group: meta.experience_group || '',
      gender: meta.gender || '',
      pdf_url: meta.pdf_url || '',
      ushmm_url: meta.ushmm_url || '',
      tags: (meta.tags || '')
        .toString()
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      category_summary: compactCategories,
      excerpt,
      file: `${uniqueSlug}.html`
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    total: manifest.length,
    items: manifest
  };

  fs.writeFileSync(OUTPUT_DATA_PATH, JSON.stringify(output, null, 2), 'utf8');
  const summary = {
    generatedAt: output.generatedAt,
    total: output.total,
    items: manifest.map((item) => ({
      slug: item.slug,
      rg_number: item.rg_number,
      interviewee: item.interviewee,
      birth_year: item.birth_year,
      birth_date: item.birth_date,
      place_of_birth: item.place_of_birth,
      country: item.country,
      experience_group: item.experience_group,
      gender: item.gender,
      pdf_url: item.pdf_url,
      excerpt: item.excerpt
    }))
  };
  fs.writeFileSync(OUTPUT_SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`Processed ${manifest.length} transcripts.`);
  console.log(`Full manifest written to ${OUTPUT_DATA_PATH}`);
  console.log(`Summary manifest written to ${OUTPUT_SUMMARY_PATH}`);
}

main();
