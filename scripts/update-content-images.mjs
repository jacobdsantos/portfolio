#!/usr/bin/env node
/**
 * Updates content files with image paths after image generation.
 * - Research JSON: adds "image" field
 * - Blog MDX: adds "coverImage" to frontmatter
 * - Tools JSON: adds "image" field
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.cwd();

// Research articles - map slug to filename
const RESEARCH = [
  'agenda-linux-on-windows', 'lockbit-5', 'play-ransomware-linux', 'charon-ransomware',
  'crypto24-ransomware', 'gentlemen-ransomware', 'warlock-ransomware',
  'ms-medusalocker-ransomware', 'ms-morpheus-ransomware', 'ms-werewolves-ransomware',
  'edrsilencer', 'fake-github-lummastealer', 'purerat', 'sharepoint-cves',
  'ra-world', 'cerber-confluence-cve', 'ms-smokeloader-w3cryptolocker',
  'ms-nitrogen-ransomware', 'crazyhunter', 'agenda-smokeloader-netxloader',
  'unc3886', 'whatsapp-self-propagating', 'ms-threat-research-aug2025',
  'ms-threat-research-jul2025a', 'ms-threat-research-jul2025b', 'ms-threat-research-jun2025a',
  'ms-trendai-rsrch-2026a', 'ms-trendai-rsrch-2026b', 'ms-agenda-truesightkiller',
  'ms-evolving-agenda-dotnet', 'ms-play-linux-esxi',
];

// Blog posts - map slug to filename
const BLOGS = [
  { slug: 'from-osint-to-internal-hunting', file: '2025-09-20-from-osint-to-internal-hunting.mdx' },
  { slug: 'ransomware-hunting-daily-workflow', file: '2025-12-08-ransomware-hunting-daily-workflow.mdx' },
  { slug: 'building-mcp-servers', file: '2026-01-15-building-mcp-servers.mdx' },
  { slug: 'automating-inquiry-triage', file: '2025-11-10-automating-inquiry-triage.mdx' },
  { slug: 'infrastructure-hunting-beyond-iocs', file: '2026-02-05-infrastructure-hunting-beyond-iocs.mdx' },
];

// Tools - slug matches filename
const TOOLS = ['titas', 'skadi', 'infra-hunting', 'confluence-tools', 'opencti-mcp'];

let updated = 0;
let skipped = 0;

// Update research JSON files
for (const slug of RESEARCH) {
  const imgPath = resolve(BASE, `public/images/research/${slug}.jpg`);
  const jsonPath = resolve(BASE, `src/content/research/${slug}.json`);

  if (!existsSync(imgPath)) { skipped++; continue; }
  if (!existsSync(jsonPath)) { skipped++; continue; }

  const content = JSON.parse(await readFile(jsonPath, 'utf-8'));
  if (content.image) { skipped++; continue; }

  content.image = `/images/research/${slug}.jpg`;
  await writeFile(jsonPath, JSON.stringify(content, null, 2) + '\n');
  console.log(`[OK] research/${slug}.json`);
  updated++;
}

// Update blog MDX files
for (const { slug, file } of BLOGS) {
  const imgPath = resolve(BASE, `public/images/blog/${slug}.jpg`);
  const mdxPath = resolve(BASE, `src/content/blog/${file}`);

  if (!existsSync(imgPath)) { skipped++; continue; }
  if (!existsSync(mdxPath)) { skipped++; continue; }

  let content = await readFile(mdxPath, 'utf-8');
  if (content.includes('coverImage:')) { skipped++; continue; }

  // Insert coverImage after draft line in frontmatter
  content = content.replace(
    /(draft:\s*(?:true|false)\s*\n)/,
    `$1coverImage: "/images/blog/${slug}.jpg"\n`
  );
  await writeFile(mdxPath, content);
  console.log(`[OK] blog/${file}`);
  updated++;
}

// Update tools JSON files
for (const slug of TOOLS) {
  const imgPath = resolve(BASE, `public/images/tools/${slug}.jpg`);
  const jsonPath = resolve(BASE, `src/content/tools/${slug}.json`);

  if (!existsSync(imgPath)) { skipped++; continue; }
  if (!existsSync(jsonPath)) { skipped++; continue; }

  const content = JSON.parse(await readFile(jsonPath, 'utf-8'));
  if (content.image) { skipped++; continue; }

  content.image = `/images/tools/${slug}.jpg`;
  await writeFile(jsonPath, JSON.stringify(content, null, 2) + '\n');
  console.log(`[OK] tools/${slug}.json`);
  updated++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
