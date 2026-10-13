import { mkdir, copyFile, rm, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['index.html', 'app.js', 'core.js', 'styles.css', 'favicon.svg'];
for (const file of ['app.js', 'core.js']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'public', file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const file of files) {
  const content = await readFile(path.join(root, 'public', file), 'utf8');
  if (/https?:\/\/|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|@import\b/.test(content)) {
    throw new Error(`Ressource ou appel réseau interdit dans ${file}`);
  }
}
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const file of files) await copyFile(path.join(root, 'public', file), path.join(root, 'dist', file));
console.log('✓ BuildOS compilé dans dist/ — 5 fichiers, aucune dépendance, aucun appel réseau.');
