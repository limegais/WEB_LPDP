import { existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = resolve(projectRoot, '.svelte-kit');

if (existsSync(generatedDir)) {
  rmSync(generatedDir, { recursive: true, force: true });
}

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const svelteKitBin = require.resolve('@sveltejs/kit/svelte-kit.js');
execFileSync(process.execPath, [svelteKitBin, 'sync'], { cwd: projectRoot, stdio: 'inherit' });
