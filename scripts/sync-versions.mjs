#!/usr/bin/env node

/**
 * Sync version across all package.json files in the monorepo.
 * Called by semantic-release during the prepare phase.
 *
 * Usage: node scripts/sync-versions.mjs 1.2.3
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const version = process.argv[2];

if (!version) {
  console.error('Usage: node sync-versions.mjs <version>');
  process.exit(1);
}

// Validate semver format
if (!/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(version)) {
  console.error(`Invalid version format: ${version}`);
  process.exit(1);
}

const paths = [
  join(rootDir, 'package.json'),
  join(rootDir, 'packages', 'core', 'package.json'),
  join(rootDir, 'packages', 'vscode', 'package.json'),
];

console.log(`Syncing version to ${version}...`);

for (const p of paths) {
  try {
    const content = readFileSync(p, 'utf-8');
    const pkg = JSON.parse(content);
    const oldVersion = pkg.version;
    pkg.version = version;

    // Preserve formatting with 2-space indent and trailing newline
    writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ${p.replace(rootDir + '/', '')}: ${oldVersion} -> ${version}`);
  } catch (error) {
    console.error(`Failed to update ${p}: ${error.message}`);
    process.exit(1);
  }
}

console.log('Version sync complete!');
