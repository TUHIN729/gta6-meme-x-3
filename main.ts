// gta6-meme-x-01 round 3 — "Bought GTA V on PS3. PS4. PS5."
//
// Entry program (Node 22, standard library only). The entry itself is the
// X post: this program's only job is to hand POST.json — the post's address —
// to the grader by copying it from the repository root into the output
// directory, byte for byte. Nothing about the meme or the post is judged
// from what this program writes; the house reads the post from X itself.
//
// Usage (the way the grader runs it):
//   MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Env vars (both optional):
//   MAKEFUN_BOT_DIR    — repository root holding POST.json (default "/bot")
//   MAKEFUN_OUTPUT_DIR — directory to write POST.json into (default "/output")
//
// Exit 0 on success; exit 1 with an error message on any failure. The
// output directory itself is never removed — only the single POST.json file
// inside it is ever replaced, so a grader-mounted output dir stays intact.

import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const SOURCE_NAME = 'POST.json';

/** Read the post address and make sure it looks like a real X post URL. */
function readPostAddress(botDir: string): string {
  const sourcePath = join(botDir, SOURCE_NAME);
  let raw: string;
  try {
    raw = readFileSync(sourcePath, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${sourcePath}: ${(err as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${sourcePath} is not valid JSON`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${sourcePath} must be a JSON object like {"url": "https://x.com/<handle>/status/<id>"}`);
  }
  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== 'string' || !/^https:\/\/(www\.|mobile\.)?(x\.com|twitter\.com)\/\S+\/status\/\d+/.test(url)) {
    throw new Error(`${sourcePath} does not name an X post address (expected https://x.com/<handle>/status/<id>)`);
  }
  return url;
}

function main(): void {
  // Validate first so we never leave a half-written output behind.
  const url = readPostAddress(BOT_DIR);

  // Create the output directory if needed; never delete it or its siblings.
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Replace only our own stale output file, never the directory itself.
  const destPath = join(OUTPUT_DIR, SOURCE_NAME);
  if (existsSync(destPath)) {
    unlinkSync(destPath);
  }
  copyFileSync(join(BOT_DIR, SOURCE_NAME), destPath);

  // Read the copy back and confirm it is byte-identical to the source:
  // the gate reads this file, so a partial or stale copy must fail loudly.
  const sourceBytes = readFileSync(join(BOT_DIR, SOURCE_NAME));
  const destBytes = readFileSync(destPath);
  if (!sourceBytes.equals(destBytes)) {
    throw new Error(`${destPath} does not match ${join(BOT_DIR, SOURCE_NAME)} after copying`);
  }
  console.log(`POST.json copied to ${destPath} (${url}) — ${destBytes.length} bytes, verified identical`);
}

try {
  main();
} catch (err) {
  console.error(`gta6-meme-x-01 entry failed: ${(err as Error).message}`);
  process.exit(1);
}
