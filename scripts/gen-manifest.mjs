/**
 * Scans public/docs/zh/ and generates public/docs/manifest.json
 * Also reads EN titles from public/docs/en/ if available.
 * Run: node scripts/gen-manifest.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = join(__dirname, '..', 'public', 'docs');

/** Read first # heading from a markdown file */
async function readTitle(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : basename(filePath, '.md');
  } catch {
    return basename(filePath, '.md');
  }
}

/** Read _meta.json if exists, else fallback to folder name */
async function readMeta(zhDir, enDir) {
  let zh, en;
  try {
    const raw = await readFile(join(zhDir, '_meta.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    zh = parsed.zh;
    en = parsed.en;
  } catch {
    const name = basename(zhDir);
    zh = name;
    en = name;
  }
  return { zh, en };
}

async function scanDir(zhDir, enDir, baseDocPath = '') {
  const entries = await readdir(zhDir, { withFileTypes: true });

  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  const subDirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const groups = [];

  // Subdirectories (root-level .md files are skipped — no sidebar group)
  for (const subDir of subDirs) {
    const zhSubDir = join(zhDir, subDir.name);
    const enSubDir = join(enDir, subDir.name);
    const subDocPath = baseDocPath ? `${baseDocPath}/${subDir.name}` : subDir.name;
    const meta = await readMeta(zhSubDir, enSubDir);

    const subEntries = await readdir(zhSubDir, { withFileTypes: true });
    const subFiles = subEntries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .sort((a, b) => a.name.localeCompare(b.name));

    const items = [];
    for (const file of subFiles) {
      const slug = basename(file.name, '.md');
      const docPath = `${subDocPath}/${slug}`;

      const zhTitle = await readTitle(join(zhSubDir, file.name));
      const enPath = join(enSubDir, file.name);
      const enTitle = existsSync(enPath) ? await readTitle(enPath) : zhTitle;

      items.push({ path: docPath, titles: { zh: zhTitle, en: enTitle } });
    }

    if (items.length > 0) {
      groups.push({ titles: meta, items });
    }
  }

  return groups;
}

async function main() {
  const zhDir = join(DOCS_ROOT, 'zh');
  const enDir = join(DOCS_ROOT, 'en');

  const groups = await scanDir(zhDir, enDir);
  const manifest = { groups };
  const outPath = join(DOCS_ROOT, 'manifest.json');

  await writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf-8');

  const total = groups.flatMap((g) => g.items).length;
  console.log(`✅ manifest.json generated (${groups.length} groups, ${total} pages)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
