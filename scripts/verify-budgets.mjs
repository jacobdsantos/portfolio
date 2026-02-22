import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST_DIR = join(process.cwd(), 'dist');
const MAX_CHUNK_SIZE = 200 * 1024; // 200KB raw per eager chunk
const MAX_TOTAL_JS = 1500 * 1024;  // 1500KB total JS (includes lazy-loaded chunks)

// Lazy-loaded chunks are excluded from per-file budget checks.
// They are only loaded on user interaction (e.g., PDF export click).
const LAZY_CHUNK_PATTERNS = ['html2pdf', 'docx', 'pdf.'];

function collectJsFiles(dir) {
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
      results.push(...collectJsFiles(fullPath));
    } else if (extname(entry.name) === '.js') {
      const stat = statSync(fullPath);
      results.push({
        path: fullPath.replace(DIST_DIR, 'dist'),
        size: stat.size,
      });
    }
  }

  return results;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = (bytes / 1024).toFixed(2);
  return `${kb} KB`;
}

function main() {
  console.log('=== JS Bundle Budget Verification ===\n');

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

  const jsFiles = collectJsFiles(DIST_DIR);

  if (jsFiles.length === 0) {
    console.log('No JS files found in dist/. Nothing to check.');
    process.exit(0);
  }

  jsFiles.sort((a, b) => b.size - a.size);

  let totalSize = 0;
  let hasViolation = false;

  console.log('Per-file JS sizes:\n');
  console.log(`  ${'File'.padEnd(60)} ${'Size'.padStart(12)}  Status`);
  console.log(`  ${'─'.repeat(60)} ${'─'.repeat(12)}  ${'─'.repeat(8)}`);

  for (const file of jsFiles) {
    totalSize += file.size;
    const isLazy = LAZY_CHUNK_PATTERNS.some((p) => file.path.includes(p));
    const overBudget = !isLazy && file.size > MAX_CHUNK_SIZE;
    if (overBudget) hasViolation = true;

    const status = isLazy ? 'LAZY' : overBudget ? 'OVER' : 'OK';
    const marker = overBudget ? '!!' : '  ';
    console.log(`${marker}${file.path.padEnd(60)} ${formatSize(file.size).padStart(12)}  ${status}`);
  }

  console.log(`\n  ${'─'.repeat(60)} ${'─'.repeat(12)}  ${'─'.repeat(8)}`);
  console.log(`  ${'Total JS'.padEnd(60)} ${formatSize(totalSize).padStart(12)}  ${totalSize > MAX_TOTAL_JS ? 'OVER' : 'OK'}`);

  console.log('\nBudgets:');
  console.log(`  Per-chunk max: ${formatSize(MAX_CHUNK_SIZE)} raw (eager chunks only)`);
  console.log(`  Total JS max:  ${formatSize(MAX_TOTAL_JS)}`);
  console.log(`  Lazy patterns: ${LAZY_CHUNK_PATTERNS.join(', ')} (excluded from per-file checks)`);

  if (totalSize > MAX_TOTAL_JS) {
    hasViolation = true;
    console.error(`\nFAILED: Total JS size (${formatSize(totalSize)}) exceeds budget of ${formatSize(MAX_TOTAL_JS)}`);
  }

  if (hasViolation) {
    const overChunks = jsFiles.filter((f) => f.size > MAX_CHUNK_SIZE);
    if (overChunks.length > 0) {
      console.error(`\nFAILED: ${overChunks.length} chunk(s) exceed per-file budget of ${formatSize(MAX_CHUNK_SIZE)}:`);
      for (const f of overChunks) {
        console.error(`  - ${f.path} (${formatSize(f.size)})`);
      }
    }
    process.exit(1);
  }

  console.log('\nAll JS bundles within budget.');
  process.exit(0);
}

main();
