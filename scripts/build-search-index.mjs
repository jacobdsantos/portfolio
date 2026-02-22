import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const ROOT = process.cwd();
const OUTPUT_DIR = join(ROOT, 'public', 'search');
const OUTPUT_FILE = join(OUTPUT_DIR, 'index.json');

/**
 * Parse frontmatter from MDX/MD content.
 * Supports YAML-style frontmatter delimited by ---.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const raw = match[1];
  const frontmatter = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle YAML arrays on single line: [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }

    frontmatter[key] = value;
  }

  return frontmatter;
}

/**
 * Extract a plain-text excerpt from MDX content (strip frontmatter and markdown syntax).
 */
function extractExcerpt(content, maxLength = 200) {
  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\r?\n/, '');

  // Remove imports and JSX components
  const withoutImports = withoutFrontmatter
    .replace(/^import\s.*$/gm, '')
    .replace(/<[A-Z][^>]*\/>/g, '')
    .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');

  // Strip markdown syntax
  const plain = withoutImports
    .replace(/#{1,6}\s/g, '')          // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/```[\s\S]*?```/g, '')    // code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // images
    .replace(/>\s?/g, '')              // blockquotes
    .replace(/-\s/g, '')              // list items
    .replace(/\n{2,}/g, ' ')          // multiple newlines
    .replace(/\n/g, ' ')              // single newlines
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).replace(/\s\S*$/, '') + '...';
}

function loadBlogEntries() {
  const blogDir = join(ROOT, 'src', 'content', 'blog');
  if (!existsSync(blogDir)) return [];

  const items = [];
  const entries = readdirSync(blogDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name);
    if (ext !== '.mdx' && ext !== '.md') continue;

    const filePath = join(blogDir, entry.name);
    const content = readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(content);
    const slug = basename(entry.name, ext);

    items.push({
      type: 'blog',
      title: fm.title || slug,
      excerpt: fm.description || fm.excerpt || extractExcerpt(content),
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      url: `/blog/${slug}`,
      keywords: Array.isArray(fm.keywords) ? fm.keywords : [],
    });
  }

  return items;
}

function loadResearchEntries() {
  const researchDir = join(ROOT, 'src', 'content', 'research');
  if (!existsSync(researchDir)) return [];

  const items = [];
  const entries = readdirSync(researchDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || extname(entry.name) !== '.json') continue;

    const filePath = join(researchDir, entry.name);
    const slug = basename(entry.name, '.json');

    let data;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      console.warn(`  WARNING: Failed to parse ${filePath}, skipping.`);
      continue;
    }

    items.push({
      type: 'research',
      title: data.title || slug,
      excerpt: data.description || data.summary || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      url: data.url || `/research/${slug}`,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
    });
  }

  return items;
}

function loadToolsEntries() {
  const toolsDir = join(ROOT, 'src', 'content', 'tools');
  if (!existsSync(toolsDir)) return [];

  const items = [];
  const entries = readdirSync(toolsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || extname(entry.name) !== '.json') continue;

    const filePath = join(toolsDir, entry.name);
    const slug = basename(entry.name, '.json');

    let data;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      console.warn(`  WARNING: Failed to parse ${filePath}, skipping.`);
      continue;
    }

    items.push({
      type: 'tool',
      title: data.name || data.fullName || slug,
      excerpt: data.description || '',
      tags: Array.isArray(data.tech) ? data.tech : [],
      url: `/tools/${slug}`,
      keywords: [
        data.status,
        ...(Array.isArray(data.tech) ? data.tech : []),
      ].filter(Boolean),
    });
  }

  return items;
}

function main() {
  console.log('=== Building Search Index ===\n');

  const allItems = [];

  const blogEntries = loadBlogEntries();
  console.log(`  Blog entries:     ${blogEntries.length}`);
  allItems.push(...blogEntries);

  const researchEntries = loadResearchEntries();
  console.log(`  Research entries:  ${researchEntries.length}`);
  allItems.push(...researchEntries);

  const toolsEntries = loadToolsEntries();
  console.log(`  Tool entries:      ${toolsEntries.length}`);
  allItems.push(...toolsEntries);

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    items: allItems,
  };

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf-8');

  console.log(`\nGenerated ${OUTPUT_FILE}`);
  console.log(`Total items: ${allItems.length}`);
  process.exit(0);
}

main();
