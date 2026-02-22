#!/usr/bin/env node

/**
 * OG Image Generation Script (placeholder)
 *
 * In a full implementation, this would generate OG images for each page.
 * For now, it creates placeholder info about what images would be generated.
 *
 * Real OG generation could use:
 * - @vercel/og or satori for server-side SVG -> PNG
 * - Puppeteer for HTML -> screenshot
 * - A pre-built set of static images
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const OG_DIR = join(ROOT, 'public', 'og');

// Ensure OG directory exists
if (!existsSync(OG_DIR)) {
  mkdirSync(OG_DIR, { recursive: true });
}

// Pages that need OG images
const pages = [
  { type: 'page', slug: 'default', title: 'Jacob Santos — Senior Threat Researcher' },
  { type: 'page', slug: 'about', title: 'About — Jacob Santos' },
  { type: 'page', slug: 'research', title: 'Research — Jacob Santos' },
  { type: 'page', slug: 'tools', title: 'Tools — Jacob Santos' },
  { type: 'page', slug: 'blog', title: 'Blog — Jacob Santos' },
  { type: 'page', slug: 'speaking', title: 'Speaking — Jacob Santos' },
  { type: 'page', slug: 'resume', title: 'Resume — Jacob Santos' },
  { type: 'page', slug: 'contact', title: 'Contact — Jacob Santos' },
];

// Read research items
const researchDir = join(ROOT, 'src', 'content', 'research');
if (existsSync(researchDir)) {
  const files = readdirSync(researchDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace('.json', '');
    try {
      const data = JSON.parse(readFileSync(join(researchDir, file), 'utf-8'));
      pages.push({ type: 'research', slug, title: data.title || slug });
    } catch { /* skip invalid */ }
  }
}

// Read tool items
const toolsDir = join(ROOT, 'src', 'content', 'tools');
if (existsSync(toolsDir)) {
  const files = readdirSync(toolsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace('.json', '');
    try {
      const data = JSON.parse(readFileSync(join(toolsDir, file), 'utf-8'));
      pages.push({ type: 'tool', slug, title: data.name || slug });
    } catch { /* skip invalid */ }
  }
}

console.log(`OG Image Generation Report`);
console.log(`${'='.repeat(50)}`);
console.log(`Total images needed: ${pages.length}`);
console.log('');

// Create a simple SVG placeholder for default
const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#07090f"/>
  <rect x="0" y="0" width="1200" height="4" fill="#00dfa2"/>
  <text x="80" y="280" font-family="system-ui, sans-serif" font-size="52" font-weight="bold" fill="#e8edf5">Jacob Santos</text>
  <text x="80" y="340" font-family="system-ui, sans-serif" font-size="28" fill="#00dfa2">Senior Threat Researcher</text>
  <text x="80" y="400" font-family="monospace" font-size="18" fill="#8b949e">Threat Research • Security Automation • Training</text>
  <text x="80" y="560" font-family="monospace" font-size="14" fill="#545d68">jacobsantos.pages.dev</text>
</svg>`;

// Write default SVG (can be converted to PNG via other tools)
writeFileSync(join(OG_DIR, 'default.svg'), defaultSvg);
console.log('Created: public/og/default.svg');

for (const page of pages) {
  const filename = `${page.type}-${page.slug}`;
  console.log(`  Would generate: /og/${filename}.png — "${page.title}"`);
}

console.log('');
console.log('Note: For production, replace SVGs with PNG using satori, puppeteer, or pre-built images.');
console.log('Done.');
