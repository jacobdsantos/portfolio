import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const ROOT = process.cwd();
const KEBAB_CASE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function loadJsonSafe(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getSlugsFromDataFile(filePath) {
  if (!existsSync(filePath)) return [];
  const data = loadJsonSafe(filePath);
  if (!data) return [];

  if (Array.isArray(data)) {
    return data
      .map((item) => item.slug || item.id || null)
      .filter(Boolean);
  }

  return [];
}

function getSlugsFromContentDir(dirPath) {
  if (!existsSync(dirPath)) return [];

  const slugs = [];
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && extname(entry.name) === '.json') {
        const slug = basename(entry.name, '.json');
        slugs.push(slug);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return slugs;
}

function validateSlugs(collectionName, slugs) {
  const errors = [];

  // Check for duplicates
  const seen = new Map();
  for (const slug of slugs) {
    if (seen.has(slug)) {
      seen.set(slug, seen.get(slug) + 1);
    } else {
      seen.set(slug, 1);
    }
  }

  for (const [slug, count] of seen) {
    if (count > 1) {
      errors.push({
        collection: collectionName,
        slug,
        issue: `duplicate (appears ${count} times)`,
      });
    }
  }

  // Check kebab-case
  for (const slug of slugs) {
    if (!KEBAB_CASE_RE.test(slug)) {
      errors.push({
        collection: collectionName,
        slug,
        issue: 'not kebab-case',
      });
    }
  }

  return errors;
}

function main() {
  console.log('=== Slug Validation ===\n');

  let totalErrors = 0;

  const collections = [
    {
      name: 'research',
      dataFile: join(ROOT, 'src', 'data', 'research.json'),
      contentDir: join(ROOT, 'src', 'content', 'research'),
    },
    {
      name: 'tools',
      dataFile: join(ROOT, 'src', 'data', 'tools.json'),
      contentDir: join(ROOT, 'src', 'content', 'tools'),
    },
    {
      name: 'speaking',
      dataFile: join(ROOT, 'src', 'data', 'speaking.json'),
      contentDir: join(ROOT, 'src', 'content', 'speaking'),
    },
  ];

  for (const collection of collections) {
    const slugs = [];

    // Collect slugs from data file (if it exists as an array with slug/id fields)
    const dataFileSlugs = getSlugsFromDataFile(collection.dataFile);
    slugs.push(...dataFileSlugs);

    // Collect slugs from content directory filenames
    const contentDirSlugs = getSlugsFromContentDir(collection.contentDir);
    slugs.push(...contentDirSlugs);

    if (slugs.length === 0) {
      console.log(`  ${collection.name}: no slugs found (skipped)`);
      continue;
    }

    const errors = validateSlugs(collection.name, slugs);

    if (errors.length === 0) {
      console.log(`  ${collection.name}: ${slugs.length} slugs OK`);
    } else {
      console.log(`  ${collection.name}: ${slugs.length} slugs, ${errors.length} error(s)`);
      for (const err of errors) {
        console.error(`    ERROR: "${err.slug}" - ${err.issue}`);
      }
      totalErrors += errors.length;
    }
  }

  console.log('');

  if (totalErrors > 0) {
    console.error(`FAILED: ${totalErrors} slug validation error(s) found.`);
    process.exit(1);
  }

  console.log('All slugs valid.');
  process.exit(0);
}

main();
