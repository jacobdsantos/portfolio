import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST_DIR = join(process.cwd(), 'dist');

// Pages that don't need SEO meta tags (admin, OG image templates, etc.)
const EXCLUDED_PREFIXES = ['_ctrl/', 'admin/', 'og/'];

const REQUIRED_TAGS = [
  {
    name: 'title',
    test: (html) => /<title[^>]*>[^<]+<\/title>/i.test(html),
  },
  {
    name: 'meta description',
    test: (html) => /<meta\s[^>]*name=["']description["'][^>]*content=["'][^"']+["'][^>]*\/?>/i.test(html)
      || /<meta\s[^>]*content=["'][^"']+["'][^>]*name=["']description["'][^>]*\/?>/i.test(html),
  },
  {
    name: 'og:title',
    test: (html) => /<meta\s[^>]*property=["']og:title["'][^>]*content=["'][^"']+["'][^>]*\/?>/i.test(html)
      || /<meta\s[^>]*content=["'][^"']+["'][^>]*property=["']og:title["'][^>]*\/?>/i.test(html),
  },
  {
    name: 'og:description',
    test: (html) => /<meta\s[^>]*property=["']og:description["'][^>]*content=["'][^"']+["'][^>]*\/?>/i.test(html)
      || /<meta\s[^>]*content=["'][^"']+["'][^>]*property=["']og:description["'][^>]*\/?>/i.test(html),
  },
  {
    name: 'canonical link',
    test: (html) => /<link\s[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["'][^>]*\/?>/i.test(html)
      || /<link\s[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*\/?>/i.test(html),
  },
];

function collectHtmlFiles(dir) {
  const results = [];

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

function main() {
  console.log('=== Meta Tag Verification ===\n');

  let distExists;
  try {
    statSync(DIST_DIR);
    distExists = true;
  } catch {
    distExists = false;
  }

  if (!distExists) {
    console.error('ERROR: dist/ directory not found. Run the build first.');
    process.exit(1);
  }

  const htmlFiles = collectHtmlFiles(DIST_DIR);

  if (htmlFiles.length === 0) {
    console.log('No HTML files found in dist/. Nothing to check.');
    process.exit(0);
  }

  let totalMissing = 0;
  const fileResults = [];

  for (const filePath of htmlFiles) {
    const html = readFileSync(filePath, 'utf-8');
    const relPath = relative(DIST_DIR, filePath);

    if (EXCLUDED_PREFIXES.some((p) => relPath.startsWith(p))) {
      continue;
    }

    const missing = [];

    for (const tag of REQUIRED_TAGS) {
      if (!tag.test(html)) {
        missing.push(tag.name);
      }
    }

    fileResults.push({ relPath, missing });
    totalMissing += missing.length;
  }

  // Sort: files with issues first, then alphabetical
  fileResults.sort((a, b) => {
    if (a.missing.length > 0 && b.missing.length === 0) return -1;
    if (a.missing.length === 0 && b.missing.length > 0) return 1;
    return a.relPath.localeCompare(b.relPath);
  });

  for (const result of fileResults) {
    if (result.missing.length > 0) {
      console.log(`  FAIL  ${result.relPath}`);
      for (const tag of result.missing) {
        console.log(`        - missing: ${tag}`);
      }
    } else {
      console.log(`  OK    ${result.relPath}`);
    }
  }

  console.log(`\nChecked ${htmlFiles.length} HTML file(s).`);

  if (totalMissing > 0) {
    console.error(`\nFAILED: ${totalMissing} missing tag(s) across ${fileResults.filter((r) => r.missing.length > 0).length} file(s).`);
    process.exit(1);
  }

  console.log('All required meta tags present.');
  process.exit(0);
}

main();
