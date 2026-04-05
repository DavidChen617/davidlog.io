/**
 * pnpm run artifacts
 *
 * Runs the full AI content pipeline:
 *   1. Generate missing _meta.json for new zh/ folders
 *   2. Translate new zh/*.md files that don't have an en/ counterpart
 *   3. Regenerate manifest.json
 */

import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, relative } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ZH_DIR = join(ROOT, 'public', 'docs', 'zh');
const EN_DIR = join(ROOT, 'public', 'docs', 'en');

const CLAUDE_BIN = `${process.env.HOME}/.local/bin/claude`;

function claude(prompt) {
  const result = spawnSync(
    CLAUDE_BIN,
    ['-p', '--permission-mode', 'bypassPermissions'],
    { input: prompt, cwd: ROOT, stdio: ['pipe', 'inherit', 'inherit'], encoding: 'utf-8' }
  );
  if (result.status !== 0) {
    throw new Error(`claude exited with status ${result.status}`);
  }
}

/** Recursively find all subdirectories */
async function findSubDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const dirs = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      const full = join(dir, e.name);
      dirs.push(full);
      dirs.push(...await findSubDirs(full));
    }
  }
  return dirs;
}

/** Recursively find all .md files */
async function findMdFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => join(e.parentPath ?? e.path, e.name));
}

// ─── Step 1: Generate missing _meta.json ────────────────────────────────────

async function genMissingMeta() {
  const subDirs = await findSubDirs(ZH_DIR);
  const missing = subDirs.filter(d => !existsSync(join(d, '_meta.json')));

  if (missing.length === 0) {
    console.log('✅ All folders have _meta.json');
    return;
  }

  console.log(`\n📂 Generating _meta.json for ${missing.length} folder(s):`);
  missing.forEach(d => console.log(`   ${relative(ROOT, d)}`));

  const folderList = missing.map(d => `- ${relative(ROOT, d)}`).join('\n');

  claude(`
Generate _meta.json files for these folders in the davidlog.io project:

${folderList}

For each folder:
- Infer a natural zh (Traditional Chinese) and en display name from the folder name
- Common mappings: backend→後端, frontend→前端, devops→DevOps, database→資料庫, security→資安, cloud→雲端, testing→測試, architecture→架構
- Write the file as: { "zh": "...", "en": "..." }
- Only create files that are missing, skip existing ones
`);
}

// ─── Step 2: Translate missing en/ files ────────────────────────────────────

async function translateMissing() {
  const zhFiles = await findMdFiles(ZH_DIR);
  const missing = zhFiles.filter(zhPath => {
    const rel = relative(ZH_DIR, zhPath);
    return !existsSync(join(EN_DIR, rel));
  });

  if (missing.length === 0) {
    console.log('✅ All zh/ docs have en/ counterparts');
    return;
  }

  console.log(`\n🌐 Translating ${missing.length} file(s):`);

  for (const zhPath of missing) {
    const rel = relative(ZH_DIR, zhPath);
    const enPath = join(EN_DIR, rel);
    console.log(`   zh/${rel} → en/${rel}`);

    claude(`
Translate this markdown file from Chinese to English for the davidlog.io project.

Source file: ${relative(ROOT, zhPath)}
Output file: ${relative(ROOT, enPath)}

Rules:
- Preserve ALL markdown syntax exactly (headings, code blocks, tables, bold, inline code, links)
- Do NOT translate content inside code blocks (\`\`\` or \`)
- Do NOT translate technical terms, package names, CLI commands, file paths
- Write natural English, not word-for-word translation
- Read the source file, translate, and write to the output path
`);
  }
}

// ─── Step 3: Regenerate manifest ───────────────────────────────────────���────

function genManifest() {
  console.log('\n📋 Regenerating manifest.json...');
  spawnSync('node', ['scripts/gen-manifest.mjs'], { cwd: ROOT, stdio: 'inherit' });
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('🚀 Running artifacts pipeline...\n');
await genMissingMeta();
await translateMissing();
genManifest();
console.log('\n✨ Done!');
