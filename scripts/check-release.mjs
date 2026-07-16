import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (path) => JSON.parse(readFileSync(path, 'utf8'));
const rootPackage = readJSON(join(ROOT, 'package.json'));
const packagePaths = [
  ...readdirSync(join(ROOT, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(ROOT, 'packages', entry.name, 'package.json')),
  join(ROOT, 'rigs/package.json'),
  join(ROOT, 'apps/workbench/package.json'),
].sort();
const packages = packagePaths.map((path) => ({ path, dir: dirname(path), manifest: readJSON(path) }));
const workspaceNames = new Set(packages.map(({ manifest }) => manifest.name));
const expectedRange = `^${rootPackage.version}`;

for (const { path, dir, manifest } of packages) {
  assert.equal(manifest.version, rootPackage.version, `${path}: workspace version drift`);
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [name, range] of Object.entries(manifest[field] || {})) {
      if (workspaceNames.has(name)) assert.equal(range, expectedRange, `${path}: ${field}.${name} must be ${expectedRange}`);
    }
  }
  for (const target of Object.values(manifest.exports || {})) {
    if (typeof target === 'string') {
      const exportPath = resolve(dir, target);
      assert.equal(existsSync(exportPath), true, `${path}: missing export ${target}`);
      if (exportPath.endsWith('.json')) readJSON(exportPath);
      else await import(pathToFileURL(exportPath));
    }
  }
  if (manifest.main) assert.equal(existsSync(resolve(dir, manifest.main)), true, `${path}: missing main ${manifest.main}`);
  for (const target of Object.values(manifest.bin || {})) {
    assert.equal(existsSync(resolve(dir, target)), true, `${path}: missing bin ${target}`);
  }
}

const workbench = packages.find(({ manifest }) => manifest.name === '@paper-rig/workbench');
assert.equal(workbench.manifest.private, true, 'workbench must remain private');
assert.equal(packages.filter(({ manifest }) => !manifest.private).length, 9, 'expected nine releasable packages');
console.log(`release metadata passed: ${packages.length} aligned workspaces at ${rootPackage.version}, 9 releasable`);
