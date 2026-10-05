#!/usr/bin/env node
// Every SVG must parse and rasterize, and README must only reference assets that exist.

import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];

async function svgs(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await svgs(path)));
    else if (entry.name.endsWith(".svg")) out.push(path);
  }
  return out;
}

const files = await svgs(resolve(root, "assets"));
for (const file of files) {
  try {
    await sharp(file).png().toBuffer();
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}

const readme = await readFile(resolve(root, "README.md"), "utf8");
for (const [, ref] of readme.matchAll(/(?:src|srcset)="\.\/(assets\/[^"]+)"/g)) {
  try {
    await access(resolve(root, ref));
  } catch {
    failures.push(`README references missing ${ref}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`OK: ${files.length} SVGs render, README references resolve.`);
