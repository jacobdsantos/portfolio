#!/usr/bin/env node
/**
 * Generate page-level hero images for speaking, about, contact,
 * and a site background texture.
 * Calls RDSec LiteLLM (Gemini 3 Pro Image) directly.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const API_KEY = process.env.RDSEC_API_KEY;
const ENDPOINT = 'https://api.rdsec.trendmicro.com/prod/aiendpoint/v1/chat/completions';
const MODEL = 'gemini-3-pro-image';
const BASE_DIR = resolve(process.cwd());

const STYLE_SUFFIX = `
Dark background colors (#08090e to #12141c range). Amber (#f0a63a) and violet (#8b7cf7) accent glows.
Abstract and geometric style. No photorealistic people. No text, words, letters, or numbers rendered in the image.
Cyber grid lines, network nodes, encrypted data streams, circuit patterns.
Minimalist, premium, dark command-center aesthetic. High quality digital art.`;

const IMAGES = [
  {
    slug: 'speaking-hero',
    dir: 'pages',
    aspect: '16:9',
    prompt: 'Dark panoramic visualization of an abstract conference stage composed of geometric hexagonal platforms radiating outward, amber spotlight beams projecting holographic presentation data from a central podium node, violet data streams flowing to audience seats represented as rows of connected network nodes across multiple countries, global knowledge sharing through geometric connection bridges spanning the scene, dark auditorium aesthetic with subtle cyber grid floor'
  },
  {
    slug: 'about-hero',
    dir: 'pages',
    aspect: '16:9',
    prompt: 'Dark abstract visualization of a singular geometric figure silhouette composed entirely of circuit traces and data flows standing at the nexus of three converging domains: a red threat hunting search beam on the left, an amber tool-building forge with gear and code symbols in the center, and a violet teaching podium with radiating knowledge waves on the right, interconnected by flowing data streams, dark premium command center aesthetic with subtle grid background'
  },
  {
    slug: 'contact-hero',
    dir: 'pages',
    aspect: '16:9',
    prompt: 'Dark abstract visualization of communication channels converging at a central geometric node, amber email envelope icons dissolving into digital signal waves, violet LinkedIn and GitHub connection paths forming a professional network graph, location pin radiating concentric rings across a subtle dark world map outline, encrypted secure communication channels with glowing endpoints, dark premium aesthetic with minimal cyber grid'
  },
  {
    slug: 'site-bg-texture',
    dir: 'pages',
    aspect: '16:9',
    prompt: 'Extremely subtle dark abstract background texture with very faint geometric circuit board traces and barely visible network topology lines, ultra-minimal amber and violet micro-glows at scattered node points, dark background (#08090e to #0d0f14) with nearly invisible hex grid pattern, designed as a seamless tileable website background, noise grain texture overlay, no distinct focal point, uniform distribution of extremely subtle geometric elements across entire canvas'
  },
];

async function generateImage(item) {
  const outputPath = resolve(BASE_DIR, `public/images/${item.dir}/${item.slug}.jpg`);
  const finalPrompt = `${item.prompt}\n\n${STYLE_SUFFIX}`;

  console.log(`[START] ${item.slug}`);

  const requestBody = {
    model: MODEL,
    messages: [{ role: 'user', content: [{ type: 'text', text: finalPrompt }] }],
    temperature: 1.0,
    modalities: ['image', 'text'],
    image_config: { aspect_ratio: item.aspect }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const images = message?.images;

    if (!images || images.length === 0) {
      console.log(`[TEXT] ${item.slug}: Model returned text instead of image`);
      return false;
    }

    const imageUrl = images[0].image_url.url;
    const [header, base64Data] = imageUrl.split(',', 2);
    const imageBuffer = Buffer.from(base64Data, 'base64');

    try {
      const sharp = (await import('sharp')).default;
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, jpegBuffer);
      console.log(`[DONE] ${item.slug} (${(jpegBuffer.length / 1024).toFixed(0)}KB)`);
    } catch {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, imageBuffer);
      console.log(`[DONE] ${item.slug} (${(imageBuffer.length / 1024).toFixed(0)}KB, raw)`);
    }

    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[FAIL] ${item.slug}: ${error.message}`);
    return false;
  }
}

console.log(`\nGenerating ${IMAGES.length} page images...\n`);
const startTime = Date.now();
let success = 0, failed = 0, text = 0;

// Run sequentially (only 4 images)
for (const item of IMAGES) {
  const result = await generateImage(item);
  if (result === true) success++;
  else if (result === false) text++;
  else failed++;
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone in ${elapsed}s: ${success} success, ${text} text-only, ${failed} failed`);
