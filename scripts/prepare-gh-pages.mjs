import { copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_ROOT = join(__dirname, '..', 'dist', 'davidlog.io');
const browserDir = join(DIST_ROOT, 'browser');
const outputDir = existsSync(browserDir) ? browserDir : DIST_ROOT;

const indexPath = join(outputDir, 'index.html');
const notFoundPath = join(outputDir, '404.html');

await copyFile(indexPath, notFoundPath);
console.log(`✅ GitHub Pages fallback prepared: ${notFoundPath}`);
