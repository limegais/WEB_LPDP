import { existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = resolve(projectRoot, '.svelte-kit');

if (existsSync(generatedDir)) {
  rmSync(generatedDir, { recursive: true, force: true });
}

const svelteKitBin = resolve(projectRoot, 'node_modules', '@sveltejs', 'kit', 'svelte-kit.js');
execFileSync(process.execPath, [svelteKitBin, 'sync'], { cwd: projectRoot, stdio: 'inherit' });
