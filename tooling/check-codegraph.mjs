#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REQUIRED_IGNORE_PATTERNS = [
  '.next/',
  'node_modules/',
  '.vercel/',
  'coverage/',
  'package-lock.json',
];

function runCgc(args) {
  const command = process.platform === 'win32' ? 'uvx.exe' : 'uvx';
  const result = spawnSync(command, ['--python', '3.12', 'codegraphcontext', ...args], {
    encoding: 'utf8',
    shell: false,
  });

  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.stderr.write(out);
    process.exit(result.status ?? 1);
  }
  return out;
}

function checkGlobalIgnore() {
  const path = join(homedir(), '.codegraphcontext', 'global', '.cgcignore');
  if (!existsSync(path)) {
    process.stdout.write(`warn: ${path} does not exist yet; run codegraphcontext index once.\n`);
    return;
  }

  const content = readFileSync(path, 'utf8');
  const missing = REQUIRED_IGNORE_PATTERNS.filter((pattern) => !content.includes(pattern));
  if (missing.length > 0) {
    process.stderr.write(
      `CodeGraphContext global .cgcignore is missing: ${missing.join(', ')}\n` +
        `Sync this repo's .cgcignore to ${path}, then run delete -> clean -> index.\n`
    );
    process.exit(1);
  }
}

checkGlobalIgnore();
process.stdout.write(runCgc(['stats']));
process.stdout.write('CodeGraphContext hygiene check passed.\n');
