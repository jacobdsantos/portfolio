#!/usr/bin/env node
/**
 * Generate card-level background images for portfolio site.
 * These are designed to be used at ~50% opacity behind card content.
 * All use a wider, more atmospheric style with lower visual density.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const API_KEY = process.env.RDSEC_API_KEY;
const ENDPOINT = 'https://api.rdsec.trendmicro.com/prod/aiendpoint/v1/chat/completions';
const MODEL = 'gemini-3-pro-image';
const CONCURRENCY = 3;
const BASE_DIR = resolve(process.cwd());

// Card backgrounds need to be subtler - designed for overlay use
const CARD_STYLE = `
Ultra-dark background (#06070a to #0e1016). Very subtle amber (#f0a63a) and violet (#8b7cf7) accent highlights.
Abstract, atmospheric, and minimal. No photorealistic people. No text, words, letters, or numbers.
Extremely soft, diffused lighting. More negative space than detail.
Designed as a background layer at 50% opacity - avoid bright areas or high contrast spots.
Premium dark cinematic aesthetic. High quality digital art.`;

const IMAGES = [
  // === SPEAKING ENGAGEMENT CARD BACKGROUNDS ===
  {
    slug: 'speaking-interpol',
    dir: 'cards',
    prompt: 'Dark atmospheric visualization of international law enforcement cyber operations, very subtle geometric shield outlines connected by thin amber network lines spanning across dark continents, faint violet digital forensics data streams, extremely minimal and atmospheric, wide open dark space with scattered cyber investigation nodes'
  },
  {
    slug: 'speaking-international',
    dir: 'cards',
    prompt: 'Dark atmospheric visualization of international training workshops spanning Japan Oman and Philippines, very subtle world map outline with faint amber connection arcs between countries, minimal geometric classroom podium silhouette, violet knowledge transfer waves radiating softly, extremely sparse and atmospheric'
  },
  {
    slug: 'speaking-conference',
    dir: 'cards',
    prompt: 'Dark atmospheric conference stage visualization, very subtle geometric hexagonal stage platform with soft amber spotlight beams, faint audience silhouettes as scattered dots, violet presentation hologram hints, extremely minimal wide open composition with lots of dark breathing room'
  },
  {
    slug: 'speaking-enterprise',
    dir: 'cards',
    prompt: 'Dark atmospheric enterprise cybersecurity visualization, very subtle corporate building outlines protected by faint geometric security shield layers, minimal amber defense grid lines, soft violet corporate network topology hints, extremely sparse composition with vast dark space'
  },

  // === CONTACT METHOD CARD BACKGROUNDS ===
  {
    slug: 'contact-email',
    dir: 'cards',
    prompt: 'Dark atmospheric visualization of encrypted secure communication, very subtle geometric envelope outlines dissolving into amber encrypted data particles, faint violet secure channel pathway, extremely minimal with vast dark negative space, soft signal transmission waves'
  },
  {
    slug: 'contact-linkedin',
    dir: 'cards',
    prompt: 'Dark atmospheric professional network visualization, very subtle geometric nodes connected by thin blue-violet professional connection lines, faint amber professional profile outlines, extremely sparse network graph with lots of dark space, soft professional data exchange hints'
  },
  {
    slug: 'contact-github',
    dir: 'cards',
    prompt: 'Dark atmospheric code repository visualization, very subtle geometric branch and merge lines in soft green tints, faint amber code contribution activity hints, minimal commit history visualization as scattered dots, extremely sparse with vast dark space'
  },

  // === HOMEPAGE BACKGROUNDS ===
  {
    slug: 'hero-bg',
    dir: 'cards',
    prompt: 'Dark ultra-wide atmospheric cybersecurity command center visualization, vast dark space with very subtle amber threat detection grid lines extending to horizon, faint violet AI processing nodes scattered sparsely, minimal geometric security operations center silhouette in far distance, extremely atmospheric and cinematic with heavy dark negative space, designed as background behind text'
  },
  {
    slug: 'whatido-research',
    dir: 'cards',
    prompt: 'Dark atmospheric threat hunting visualization, very subtle red-amber search beam scanning through dark digital landscape, faint malware sample geometric shapes scattered in distance, minimal hunting investigation aesthetic, extremely sparse with vast dark space'
  },
  {
    slug: 'whatido-automation',
    dir: 'cards',
    prompt: 'Dark atmospheric automation pipeline visualization, very subtle emerald-teal conveyor belt of geometric data processing nodes, faint AI brain outline orchestrating data flow, minimal tool and gear silhouettes, extremely sparse with vast dark space'
  },
  {
    slug: 'whatido-dissemination',
    dir: 'cards',
    prompt: 'Dark atmospheric knowledge sharing visualization, very subtle violet teaching waves radiating from central podium node to scattered audience nodes across world map, faint amber data transfer arcs between countries, extremely minimal and atmospheric'
  },
  {
    slug: 'whatido-tooldev',
    dir: 'cards',
    prompt: 'Dark atmospheric tool development forge visualization, very subtle cyan-blue code terminal outlines with geometric tool silhouettes being assembled, faint amber MCP connection nodes, minimal builder workshop aesthetic, extremely sparse with vast dark space'
  },
  {
    slug: 'cta-bg',
    dir: 'cards',
    prompt: 'Dark atmospheric handshake and collaboration visualization, very subtle geometric handshake silhouette dissolving into shared data streams, faint amber and violet connection pathways meeting at center point, extremely minimal and atmospheric with vast dark cinematic space, designed as background behind centered text'
  },

  // === 404 PAGE ===
  {
    slug: '404-lost',
    dir: 'cards',
    prompt: 'Dark atmospheric lost in cyberspace visualization, very subtle geometric figure silhouette standing at a glitching digital crossroads, faint amber and violet portal fragments scattered in void, broken cyber grid lines dissolving into darkness, extremely atmospheric and cinematic, vast empty dark space conveying isolation and being lost'
  },

  // === ABOUT PAGE PILLAR BACKGROUNDS ===
  {
    slug: 'about-hunter',
    dir: 'cards',
    prompt: 'Dark atmospheric threat hunter visualization, very subtle red search beam cutting through dark digital fog, faint geometric YARA rule patterns and fingerprint traces, minimal hunting investigation aesthetic with vast dark space'
  },
  {
    slug: 'about-builder',
    dir: 'cards',
    prompt: 'Dark atmospheric tool builder visualization, very subtle amber forge with geometric tool assembly lines, faint code patterns and pipeline flows, minimal builder workshop aesthetic with vast dark space'
  },
  {
    slug: 'about-instructor',
    dir: 'cards',
    prompt: 'Dark atmospheric instructor visualization, very subtle violet teaching podium with knowledge waves radiating to scattered geometric student nodes, faint amber lesson data streams, minimal education aesthetic with vast dark space'
  },

  // === SIDEBAR ===
  {
    slug: 'sidebar-profile',
    dir: 'cards',
    prompt: 'Dark atmospheric profile card background, extremely subtle circuit board traces forming a very faint fingerprint pattern, minimal amber and violet micro-dots scattered sparsely, dark gradient from top to bottom, designed as tileable card background at very low opacity, virtually invisible geometric texture'
  },
];

async function generateImage(item) {
  const outputPath = resolve(BASE_DIR, `public/images/${item.dir}/${item.slug}.jpg`);
  const finalPrompt = `${item.prompt}\n\n${CARD_STYLE}`;

  console.log(`[START] ${item.slug}`);

  const requestBody = {
    model: MODEL,
    messages: [{ role: 'user', content: [{ type: 'text', text: finalPrompt }] }],
    temperature: 1.0,
    modalities: ['image', 'text'],
    image_config: { aspect_ratio: '16:9' }
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
      return 'text';
    }

    const imageUrl = images[0].image_url.url;
    const [header, base64Data] = imageUrl.split(',', 2);
    const imageBuffer = Buffer.from(base64Data, 'base64');

    try {
      const sharp = (await import('sharp')).default;
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, jpegBuffer);
      console.log(`[DONE] ${item.slug} (${(jpegBuffer.length / 1024).toFixed(0)}KB)`);
    } catch {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, imageBuffer);
      console.log(`[DONE] ${item.slug} (${(imageBuffer.length / 1024).toFixed(0)}KB, raw)`);
    }

    return 'success';
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[FAIL] ${item.slug}: ${error.message}`);
    return 'failed';
  }
}

// Worker pool
async function runBatch(items, concurrency) {
  const results = { success: 0, failed: 0, text: 0 };
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const item = items[idx++];
      const result = await generateImage(item);
      if (result === 'success') results.success++;
      else if (result === 'text') results.text++;
      else results.failed++;
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

console.log(`\nGenerating ${IMAGES.length} card background images with ${CONCURRENCY} workers...\n`);
const startTime = Date.now();
const results = await runBatch(IMAGES, CONCURRENCY);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone in ${elapsed}s: ${results.success} success, ${results.text} text-only, ${results.failed} failed`);
