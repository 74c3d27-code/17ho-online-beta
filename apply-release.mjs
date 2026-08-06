import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { release } from './release-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const generatedRoots = ['public', 'src', 'tests'];

function safeTarget(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Invalid release path: ${relativePath}`);
  }
  const normalized = path.normalize(relativePath);
  if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`Unsafe release path: ${relativePath}`);
  }
  const target = path.resolve(root, normalized);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Release path escaped project root: ${relativePath}`);
  }
  return target;
}

if (!release || !Array.isArray(release.files) || release.files.length === 0) {
  throw new Error('release-bundle.mjs does not contain a valid release.');
}

for (const dir of generatedRoots) {
  await fs.rm(path.join(root, dir), { recursive: true, force: true });
}

for (const file of release.files) {
  const target = safeTarget(file.path);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, Buffer.from(file.base64, 'base64'));
}

await fs.writeFile(
  path.join(root, '.release-applied.json'),
  `${JSON.stringify({ version: release.version, fileCount: release.files.length }, null, 2)}\n`,
  'utf8',
);

console.log(`Applied 十七歩 release ${release.version} (${release.files.length} files).`);
