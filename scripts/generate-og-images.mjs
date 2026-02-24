/**
 * OG Image Generator
 * Generates social preview cards as HTML files that can be screenshotted.
 * Run: node scripts/generate-og-images.mjs
 * Then screenshot each HTML at 1200x630 and save as PNG to public/og/
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const outDir = join(process.cwd(), 'public', 'og');
mkdirSync(outDir, { recursive: true });

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
  body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    font-family: 'Urbanist', system-ui, sans-serif;
  }
`;

// Default OG card
const defaultCard = `<!DOCTYPE html>
<html><head><style>
${baseStyles}
body {
  background: linear-gradient(135deg, #08090e 0%, #0e1016 30%, #12141c 60%, #08090e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
/* Mesh orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}
.orb-1 { width: 400px; height: 400px; top: -100px; right: -50px; background: radial-gradient(circle, rgba(240,166,58,0.3), transparent 70%); }
.orb-2 { width: 300px; height: 300px; bottom: -80px; left: -30px; background: radial-gradient(circle, rgba(139,124,247,0.2), transparent 70%); }
.orb-3 { width: 250px; height: 250px; top: 50%; left: 60%; background: radial-gradient(circle, rgba(76,201,240,0.15), transparent 70%); }

/* Grid */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

.container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 56px;
  padding: 0 80px;
  width: 100%;
}

.photo-wrap {
  position: relative;
  flex-shrink: 0;
}
.photo-glow {
  position: absolute;
  inset: -6px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(240,166,58,0.3), rgba(139,124,247,0.2), rgba(76,201,240,0.3));
  filter: blur(4px);
}
.photo {
  width: 200px;
  height: 250px;
  border-radius: 20px;
  object-fit: cover;
  object-position: center 10%;
  border: 2px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 1;
}

.text {
  flex: 1;
}
.name {
  font-size: 48px;
  font-weight: 700;
  color: #e6edf3;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.name span {
  background: linear-gradient(135deg, #f0a63a, #ffd070, #f0a63a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.tagline {
  font-size: 20px;
  color: #8b949e;
  margin-top: 12px;
  line-height: 1.4;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 8px 18px;
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #3a2400;
  background: linear-gradient(160deg, #b87a1a, #d4962e 15%, #f0b848 35%, #ffd070 50%, #f0b848 65%, #d4962e 85%, #b87a1a);
  border: 1px solid rgba(255,208,112,0.5);
  box-shadow:
    inset 0 1px 1px rgba(255,240,200,0.5),
    inset 0 -1px 1px rgba(140,90,10,0.4),
    0 2px 8px rgba(180,120,20,0.4);
}
.dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #3a2400;
}

.url {
  position: absolute;
  bottom: 32px;
  right: 80px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  color: rgba(240,166,58,0.5);
  letter-spacing: 0.02em;
}

.tags {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.tag {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.tag-red { background: rgba(255,107,107,0.15); color: #ff8a8a; border: 1px solid rgba(255,107,107,0.2); }
.tag-purple { background: rgba(139,124,247,0.15); color: #a99df7; border: 1px solid rgba(139,124,247,0.2); }
.tag-cyan { background: rgba(76,201,240,0.15); color: #7dd5f0; border: 1px solid rgba(76,201,240,0.2); }
.tag-amber { background: rgba(240,166,58,0.15); color: #f0c06a; border: 1px solid rgba(240,166,58,0.2); }
</style></head>
<body>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  <div class="grid-bg"></div>

  <div class="container">
    <div class="photo-wrap">
      <div class="photo-glow"></div>
      <img class="photo" src="../images/profile.jpg" alt="Jacob Santos">
    </div>
    <div class="text">
      <div class="name">Jacob <span>Santos</span></div>
      <div class="tagline">Threat Hunter, Researcher and Builder</div>
      <div class="badge">
        <div class="dot"></div>
        Sr. Threat Researcher | Trend AI
      </div>
      <div class="tags">
        <span class="tag tag-red">Ransomware</span>
        <span class="tag tag-purple">APT Tracking</span>
        <span class="tag tag-cyan">Automation</span>
        <span class="tag tag-amber">Defense Evasion</span>
      </div>
    </div>
  </div>

  <div class="url">jacobsantos.pages.dev</div>
</body></html>`;

writeFileSync(join(outDir, 'default.html'), defaultCard);
console.log('Generated public/og/default.html');
console.log('');
console.log('To create the PNG:');
console.log('  1. Open public/og/default.html in Chrome');
console.log('  2. Set viewport to 1200x630 (DevTools → Device toolbar → custom)');
console.log('  3. Screenshot with Ctrl+Shift+P → "Capture screenshot"');
console.log('  4. Save as public/og/default.png');
console.log('');
console.log('Or use: npx playwright screenshot --viewport-size=1200,630 public/og/default.html public/og/default.png');
