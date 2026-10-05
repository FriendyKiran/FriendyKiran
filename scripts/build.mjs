#!/usr/bin/env node
// Builds every static SVG and README.md from profile.json.
// The hero needs a transparent portrait: npm run build -- --portrait /path/to/portrait.png
// Without --portrait the existing hero SVGs are kept as they are.

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { careerSvg } from "./lib/career.mjs";
import { cardSvg } from "./lib/cards.mjs";
import { graphSvg } from "./lib/graph.mjs";
import { HERO_PORTRAIT_BOX, heroSvg, samplePortrait } from "./lib/hero.mjs";
import { readme } from "./lib/readme.mjs";
import { themes } from "./lib/theme.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const assets = resolve(root, "assets");
const args = process.argv.slice(2);
const portraitPath = args.includes("--portrait") ? resolve(args[args.indexOf("--portrait") + 1]) : null;

const config = JSON.parse(await readFile(resolve(root, "profile.json"), "utf8"));
await mkdir(resolve(assets, "cards"), { recursive: true });

const write = (file, svg) => writeFile(resolve(assets, file), svg);
const portrait = portraitPath ? await samplePortrait(portraitPath, HERO_PORTRAIT_BOX) : null;

for (const t of Object.values(themes)) {
  if (portrait) await write(`hero-${t.name}.svg`, heroSvg(config, portrait, t));
  await write(`graph-${t.name}.svg`, graphSvg(config, t));
  await write(`career-${t.name}.svg`, careerSvg(config, t));
  for (const project of config.projects) await write(`cards/${project.id}-${t.name}.svg`, cardSvg(project, t));
}

if (!portrait) {
  try {
    await access(resolve(assets, "hero-dark.svg"));
    console.log("No --portrait given: kept the existing hero SVGs.");
  } catch {
    console.warn("Warning: no hero SVGs yet. Run again with --portrait /path/to/transparent.png");
  }
}

await writeFile(resolve(root, "README.md"), readme(config));
console.log(`Built ${portrait ? "hero, " : ""}graph, career, ${config.projects.length} cards (dark + light) and README.md.`);
