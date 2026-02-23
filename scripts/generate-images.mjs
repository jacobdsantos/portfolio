#!/usr/bin/env node
/**
 * Batch image generator for portfolio preview images.
 * Calls RDSec LiteLLM (Gemini 3 Pro Image) directly.
 * Generates all 41 images with 3 concurrent workers.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const API_KEY = process.env.RDSEC_API_KEY;
const ENDPOINT = 'https://api.rdsec.trendmicro.com/prod/aiendpoint/v1/chat/completions';
const MODEL = 'gemini-3-pro-image';
const CONCURRENCY = 3;
const BASE_DIR = resolve(process.cwd());

const STYLE_SUFFIX = `
Dark background colors (#08090e to #12141c range). Amber (#f0a63a) and violet (#8b7cf7) accent glows.
Abstract and geometric style. No photorealistic people. No text, words, letters, or numbers rendered in the image.
Cyber grid lines, network nodes, encrypted data streams, circuit patterns.
Minimalist, premium, dark command-center aesthetic. High quality digital art.`;

const IMAGES = [
  // === RESEARCH BATCH A: Ransomware ===
  {
    slug: 'agenda-linux-on-windows',
    category: 'research',
    prompt: 'Abstract visualization of Linux penguin silhouette fragmenting into Windows logo shards, dark cyber grid background, amber data streams crossing between two platform planes, encrypted binary rain falling between dual OS layers, violet circuit traces connecting cross-platform nodes'
  },
  {
    slug: 'lockbit-5',
    category: 'research',
    prompt: 'Triple-layered hexagonal shields representing Windows Linux and ESXi cracking under pressure from a central amber lock icon, dark background with glowing red fracture lines spreading across all three platforms, geometric shattered glass effect with binary streams, violet energy connecting platform nodes'
  },
  {
    slug: 'play-ransomware-linux',
    category: 'research',
    prompt: 'Dark server rack visualization with ESXi virtual machine containers being consumed by geometric amber encryption waves, violet circuit paths connecting virtual nodes, abstract server infrastructure dissolving into encrypted data blocks, cyber grid floor with pulsing warning indicators'
  },
  {
    slug: 'charon-ransomware',
    category: 'research',
    prompt: 'Mythological ferryman silhouette composed of circuit board traces carrying encrypted data packets across a dark digital river, amber chains linking APT and ransomware symbols, DLL file icons being sideloaded through a geometric bridge structure, violet mist over cyber underworld'
  },
  {
    slug: 'crypto24-ransomware',
    category: 'research',
    prompt: 'Split-screen geometric visualization showing clean legitimate tool icons on one side morphing into malicious encrypted shapes on the other, amber gradient dividing line with data particles crossing between worlds, dark background with stealth camouflage pattern overlays, violet detection bypass arrows'
  },
  {
    slug: 'gentlemen-ransomware',
    category: 'research',
    prompt: 'Elegant geometric top hat and monocle composed of circuit traces floating above a dark command center, amber and violet adaptive shields morphing shape around EDR bypass arrows, vulnerable driver icons being weaponized as skeleton keys, sophisticated dark aesthetic with golden accent lines'
  },
  {
    slug: 'warlock-ransomware',
    category: 'research',
    prompt: 'Dark sorcery-themed cyber visualization with a portal icon cracking open like a magical gateway, amber encryption spells spreading through enterprise network graph, geometric castle walls being breached by violet digital tendrils, lateral movement paths illuminated across dark network topology'
  },
  {
    slug: 'ms-medusalocker-ransomware',
    category: 'research',
    prompt: 'Three geometric serpent heads composed of data streams converging on a central target node, dark background with amber encrypted file icons being consumed from three directions simultaneously, violet network paths showing three distinct attack vectors, abstract cyber threat visualization'
  },
  {
    slug: 'ms-morpheus-ransomware',
    category: 'research',
    prompt: 'Abstract matrix-inspired dark visualization with data morphing between encrypted and leaked states, amber data exfiltration streams flowing upward from a dark data-leak portal, violet geometric transformation effect showing ransomware emergence, digital metamorphosis aesthetic'
  },
  {
    slug: 'ms-werewolves-ransomware',
    category: 'research',
    prompt: 'Geometric wolf silhouette composed of sharp angular circuit traces emerging from shadows of a dark cyber grid, amber glowing eyes scanning network topology, violet claw marks tearing through digital infrastructure, new threat actor emergence visualization with threatening geometric shapes'
  },
  // === RESEARCH BATCH B: Defense Evasion & Tools ===
  {
    slug: 'edrsilencer',
    category: 'research',
    prompt: 'Abstract visualization of security telemetry streams being silently cut by geometric filter blades, dark background with EDR shield icons fading to transparency, amber Windows Filtering Platform layers intercepting violet data flows, network packets being swallowed into dark void'
  },
  {
    slug: 'fake-github-lummastealer',
    category: 'research',
    prompt: 'Dark visualization of fake code repository interfaces morphing from clean to malicious, amber tentacles reaching through fabricated star icons, AI-generated content overlays dissolving into malware payloads, violet data theft streams flowing from developer workstations, geometric deception layers'
  },
  {
    slug: 'purerat',
    category: 'research',
    prompt: 'Dark geometric visualization of a PDF document icon splitting open to reveal hidden malware payload within, amber DLL sideloading chain showing legitimate binary being hijacked, violet remote access tendrils extending from compromised document, dark cyber deception aesthetic'
  },
  {
    slug: 'sharepoint-cves',
    category: 'research',
    prompt: 'Dark fortress-like server architecture with geometric vulnerability cracks glowing amber, exploit chains threading through authentication layers, violet security patches being applied like armor plates, RCE arrows penetrating through unpatched surfaces, dark command center monitoring visualization'
  },
  {
    slug: 'ra-world',
    category: 'research',
    prompt: 'Abstract dark visualization of Active Directory tree structure with GPO policy objects being weaponized, amber payloads distributing through organizational units like spreading infection, machine rebooting into Safe Mode represented by stripped-down geometric framework, violet encryption waves'
  },
  {
    slug: 'cerber-confluence-cve',
    category: 'research',
    prompt: 'Dark visualization of wiki collaboration pages being consumed by geometric triple encryption waves, amber vulnerability exploit arrow piercing through collaboration platform shield, violet ransomware payload deploying through unauthorized plugin upload, enterprise platform under siege aesthetic'
  },
  {
    slug: 'ms-smokeloader-w3cryptolocker',
    category: 'research',
    prompt: 'Abstract image within an image concept showing hidden malware payload concealed in geometric picture frames, dark background with amber data streams emerging from innocent-looking pixel patterns, violet encryption keys hidden within steganographic layers, smoke-like particle effects dissolving to reveal hidden threat'
  },
  {
    slug: 'ms-nitrogen-ransomware',
    category: 'research',
    prompt: 'Dark browser window geometric visualization with fake update notification overlays glowing amber, malicious browser extension icons with hidden payloads connecting to violet C2 nodes, social engineering deception layers peeling away to reveal ransomware beneath, chemical element symbol composed of circuit traces'
  },
  {
    slug: 'crazyhunter',
    category: 'research',
    prompt: 'Dark visualization of an island silhouette composed of critical infrastructure icons like hospital and school under geometric assault, amber BYOVD driver arrows disabling security layers, violet open-source tool icons being weaponized as attack toolkit, dark geopolitical cyber threat aesthetic'
  },
  {
    slug: 'agenda-smokeloader-netxloader',
    category: 'research',
    prompt: 'Dark modular loader architecture visualization with two loader components connecting to ransomware core as geometric assembly parts, amber dynamic payload retrieval streams, violet .NET obfuscation layers wrapping around loader modules, expanding arsenal represented by growing weapon rack of cyber tools'
  },
  // === RESEARCH BATCH C: APT, Cross-Platform, Microstories ===
  {
    slug: 'unc3886',
    category: 'research',
    prompt: 'Dark geometric visualization of network edge devices and VMware hypervisor layers being infiltrated by stealthy espionage probes, amber zero-day exploit paths threading through firewall and virtualization icons, violet persistent backdoor nodes hiding in infrastructure shadows, layered attack depth aesthetic'
  },
  {
    slug: 'whatsapp-self-propagating',
    category: 'research',
    prompt: 'Dark visualization of messaging bubbles forming a spreading infection tree, amber ZIP file attachments opening to release geometric malware spores propagating through contact networks, violet hijacked account tentacles auto-sending messages, self-replication chain expanding exponentially across dark communication graph'
  },
  {
    slug: 'ms-threat-research-aug2025',
    category: 'research',
    prompt: 'Dark chaotic visualization of security defenses being systematically dismantled by geometric malicious DLL and kernel driver deployment, amber kernel-level infiltration paths bypassing EDR detection rings, violet chaos-themed fragmentation of security monitoring layers, entropy and disorder spreading through defense architecture'
  },
  {
    slug: 'ms-threat-research-jul2025a',
    category: 'research',
    prompt: 'Dark hacking competition aesthetic with server infrastructure being cracked open on a geometric stage, amber zero-day exploit lightning bolts striking server infrastructure, violet protection shield already deployed before public disclosure, competitive security research visualization'
  },
  {
    slug: 'ms-threat-research-jul2025b',
    category: 'research',
    prompt: 'Dark network topology with geometric lateral movement paths illuminated in amber, breach point expanding into full enterprise compromise visualization, violet encrypted data channels connecting compromised nodes, dark river crossing between initial access and domain dominance, sophisticated intrusion depth aesthetic'
  },
  {
    slug: 'ms-threat-research-jun2025a',
    category: 'research',
    prompt: 'Dark visualization of Windows Subsystem for Linux as a bridge between two geometric platform worlds, amber remote management tool being weaponized as attack conduit, violet Linux payloads deploying through WSL gateway on Windows infrastructure, cross-platform sophistication with dual-OS geometric layers'
  },
  {
    slug: 'ms-trendai-rsrch-2026a',
    category: 'research',
    prompt: 'Five distinct geometric rust-colored threat icons emerging from a dark forge, each with unique angular shapes representing different ransomware families, amber Rust programming language crab symbol composed of malicious code fragments, violet compilation streams producing cross-platform binaries, accelerated threat landscape evolution visualization'
  },
  {
    slug: 'ms-trendai-rsrch-2026b',
    category: 'research',
    prompt: 'Dark recurring campaign visualization with cross-platform attack evolution timeline, amber new technique arrows building on previous attack framework, violet execution pathways evolving and branching, ransomware DNA helix showing mutation and adaptation across campaigns, persistent threat evolution aesthetic'
  },
  {
    slug: 'ms-agenda-truesightkiller',
    category: 'research',
    prompt: 'Dark visualization of EDR security eyes being blinded by geometric BYOVD driver exploit, amber tool dismantling antivirus shields layer by layer, violet vulnerable driver being loaded as a trojan horse into kernel space, ransomware lurking behind disabled defenses, sight-elimination cyber warfare aesthetic'
  },
  {
    slug: 'ms-evolving-agenda-dotnet',
    category: 'research',
    prompt: 'Dark .NET framework geometric visualization with obfuscated code layers reflecting and reloading in mirrors, amber shield wrapping around malicious payload, violet reflective loading arrows bouncing between memory spaces avoiding disk detection, ransomware hiding within legitimate runtime framework, code obfuscation hall of mirrors aesthetic'
  },
  {
    slug: 'ms-play-linux-esxi',
    category: 'research',
    prompt: 'Dark server room visualization with ESXi virtual machine icons being targeted by geometric ransomware expanding from Windows to Linux, amber first-discovery spotlight highlighting new variant emergence, violet link infrastructure connecting to attack nodes, cross-platform ransomware evolution milestone aesthetic'
  },
  // === BLOG POSTS ===
  {
    slug: 'from-osint-to-internal-hunting',
    category: 'blog',
    prompt: 'Dark visualization of two distinct hunting worlds connected by a geometric bridge, external OSINT sources like VirusTotal and social media icons on the left dissolving into internal telemetry streams with log entries and detection events on the right, amber transition gradient between public and private intelligence, violet data transformation arrows showing skill evolution'
  },
  {
    slug: 'ransomware-hunting-daily-workflow',
    category: 'blog',
    prompt: 'Dark command center dashboard visualization with multiple geometric monitoring panels showing YARA rule triggers, malware feeds, and sample analysis windows, amber alert indicators pulsing on daily hunting dashboard, violet binary analysis streams flowing through investigation pipeline, proactive threat hunting daily loop aesthetic'
  },
  {
    slug: 'building-mcp-servers',
    category: 'blog',
    prompt: 'Dark visualization of Model Context Protocol bridge connecting AI assistant geometric brain to threat intelligence platform data nodes, amber MCP tool connections streaming between AI and CTI databases, violet indicator and campaign data flowing through standardized protocol channels, API bridge architecture aesthetic'
  },
  {
    slug: 'automating-inquiry-triage',
    category: 'blog',
    prompt: 'Dark 9-phase pipeline visualization with geometric stages flowing left to right like a conveyor belt, amber AI processing nodes at each phase for intake OSINT merge enrichment and publish, violet automation arrows connecting phases, manual hourglass shattering into fast automated clock, efficiency transformation aesthetic'
  },
  {
    slug: 'infrastructure-hunting-beyond-iocs',
    category: 'blog',
    prompt: 'Dark Pyramid of Pain visualization with hash-based IOCs at the bottom fading into behavioral infrastructure patterns at the top, amber scan beams mapping server infrastructure, violet SSH key and SSL certificate fingerprint connections between C2 nodes, network topology hunting above the IOC layer, ascending sophistication aesthetic'
  },
  // === TOOLS ===
  {
    slug: 'titas',
    category: 'tools',
    prompt: 'Dark pipeline architecture visualization with nine geometric processing stages arranged in flowing sequence, amber AI brain node orchestrating data flow between OSINT sources and output documents, violet automation streams connecting email input to wiki output, inquiry-to-response conveyor belt aesthetic'
  },
  {
    slug: 'skadi',
    category: 'tools',
    prompt: 'Dark unified intelligence dashboard with geometric panels showing RSS feeds, article analysis, IOC extraction, and report generation in quadrant layout, amber AI analysis nodes processing multiple intelligence sources simultaneously, violet data curation streams flowing from raw feeds to actionable reports, team-wide platform aesthetic'
  },
  {
    slug: 'infra-hunting',
    category: 'tools',
    prompt: 'Dark world map with geometric C2 server nodes connected by hunting investigation paths, amber scan beams from Shodan and Censys revealing hidden infrastructure, violet SSH key pivoting and SSL certificate analysis connections between servers, adversary infrastructure being mapped and attributed, global threat hunting network visualization'
  },
  {
    slug: 'confluence-tools',
    category: 'tools',
    prompt: 'Dark tool grid visualization with thirteen geometric tool icons arranged in organized matrix, amber RAG-powered report generation central node connecting to surrounding analysis modules, violet automation workflow arrows linking tools together, Swiss army knife of security analyst productivity aesthetic'
  },
  {
    slug: 'opencti-mcp',
    category: 'tools',
    prompt: 'Dark bridge architecture connecting AI geometric brain to threat intelligence database with many indicator nodes, amber MCP protocol channels streaming indicator and campaign data bidirectionally, violet natural language query transforming into structured CTI API calls, AI-to-threat-intel bridge aesthetic'
  },
];

async function generateImage(item) {
  const outputPath = resolve(BASE_DIR, `public/images/${item.category}/${item.slug}.jpg`);
  const finalPrompt = `${item.prompt}\n\n${STYLE_SUFFIX}`;

  console.log(`[START] ${item.category}/${item.slug}`);

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
      return false;
    }

    const imageUrl = images[0].image_url.url;
    const [header, base64Data] = imageUrl.split(',', 2);

    // Convert to JPEG via sharp if available, otherwise save as-is
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Try to compress with sharp
    try {
      const sharp = (await import('sharp')).default;
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, jpegBuffer);
      console.log(`[DONE] ${item.category}/${item.slug} (${(jpegBuffer.length / 1024).toFixed(0)}KB)`);
    } catch {
      // No sharp available, save raw
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, imageBuffer);
      console.log(`[DONE] ${item.category}/${item.slug} (${(imageBuffer.length / 1024).toFixed(0)}KB, raw)`);
    }

    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[FAIL] ${item.slug}: ${error.message}`);
    return false;
  }
}

// Run with concurrency limit
async function runBatch(items, concurrency) {
  const results = { success: 0, failed: 0, text: 0 };
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const item = items[idx++];
      const result = await generateImage(item);
      if (result === true) results.success++;
      else if (result === false) results.text++;
      else results.failed++;
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

console.log(`\nGenerating ${IMAGES.length} images with ${CONCURRENCY} concurrent workers...\n`);
const startTime = Date.now();
const results = await runBatch(IMAGES, CONCURRENCY);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone in ${elapsed}s: ${results.success} success, ${results.text} text-only, ${results.failed} failed`);
