/**
 * Build-time search index generator.
 *
 * Reads blog MDX, research JSON, and tools JSON content collections
 * and produces a flat search index at public/search/index.json.
 *
 * Called by scripts/build-search-index.mjs at build time.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import type { SearchItem, SearchIndex } from './types';

/**
 * Parse YAML-style frontmatter from MDX/MD content.
 */
function parseFrontmatter(content: string): Record<string, string | string[]> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const raw = match[1];
  const frontmatter: Record<string, string | string[]> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value: string | string[] = trimmed.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if (
      (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) ||
      (typeof value === 'string' && value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Handle YAML arrays on single line: [item1, item2]
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
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
 * Extract a plain-text excerpt from MDX content.
 */
function extractExcerpt(content: string, maxLength = 200): string {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\r?\n/, '');
  const withoutImports = withoutFrontmatter
    .replace(/^import\s.*$/gm, '')
    .replace(/<[A-Z][^>]*\/>/g, '')
    .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');

  const plain = withoutImports
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/>\s?/g, '')
    .replace(/-\s/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).replace(/\s\S*$/, '') + '...';
}

function loadBlogEntries(root: string): SearchItem[] {
  const blogDir = join(root, 'src', 'content', 'blog');
  if (!existsSync(blogDir)) return [];

  const items: SearchItem[] = [];
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
      title: (fm.title as string) || slug,
      excerpt: (fm.description as string) || (fm.excerpt as string) || extractExcerpt(content),
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      url: `/blog/${slug}`,
      keywords: Array.isArray(fm.keywords) ? fm.keywords : [],
    });
  }

  return items;
}

function loadResearchEntries(root: string): SearchItem[] {
  const researchDir = join(root, 'src', 'content', 'research');
  if (!existsSync(researchDir)) return [];

  const items: SearchItem[] = [];
  const entries = readdirSync(researchDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || extname(entry.name) !== '.json') continue;

    const filePath = join(researchDir, entry.name);
    const slug = basename(entry.name, '.json');

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      console.warn(`  WARNING: Failed to parse ${filePath}, skipping.`);
      continue;
    }

    items.push({
      type: 'research',
      title: (data.title as string) || slug,
      excerpt: (data.description as string) || (data.summary as string) || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      url: (data.url as string) || `/research/${slug}`,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
    });
  }

  return items;
}

function loadToolsEntries(root: string): SearchItem[] {
  const toolsDir = join(root, 'src', 'content', 'tools');
  if (!existsSync(toolsDir)) return [];

  const items: SearchItem[] = [];
  const entries = readdirSync(toolsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || extname(entry.name) !== '.json') continue;

    const filePath = join(toolsDir, entry.name);
    const slug = basename(entry.name, '.json');

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      console.warn(`  WARNING: Failed to parse ${filePath}, skipping.`);
      continue;
    }

    items.push({
      type: 'tool',
      title: (data.name as string) || (data.fullName as string) || slug,
      excerpt: (data.description as string) || '',
      tags: Array.isArray(data.tech) ? data.tech : [],
      url: `/tools/${slug}`,
      keywords: [
        data.status as string,
        ...(Array.isArray(data.tech) ? data.tech : []),
      ].filter(Boolean),
    });
  }

  return items;
}

/**
 * Build the search index from content collections and write to disk.
 *
 * @param root - Project root directory (defaults to process.cwd())
 * @param outputPath - Output file path (defaults to public/search/index.json)
 */
export function buildSearchIndex(
  root: string = process.cwd(),
  outputPath?: string,
): SearchIndex {
  const outputDir = join(root, 'public', 'search');
  const outputFile = outputPath ?? join(outputDir, 'index.json');

  console.log('=== Building Search Index ===\n');

  const allItems: SearchItem[] = [];

  const blogEntries = loadBlogEntries(root);
  console.log(`  Blog entries:     ${blogEntries.length}`);
  allItems.push(...blogEntries);

  const researchEntries = loadResearchEntries(root);
  console.log(`  Research entries:  ${researchEntries.length}`);
  allItems.push(...researchEntries);

  const toolsEntries = loadToolsEntries(root);
  console.log(`  Tool entries:      ${toolsEntries.length}`);
  allItems.push(...toolsEntries);

  const index: SearchIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    items: allItems,
  };

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputFile, JSON.stringify(index, null, 2), 'utf-8');

  console.log(`\nGenerated ${outputFile}`);
  console.log(`Total items: ${allItems.length}`);

  return index;
}
