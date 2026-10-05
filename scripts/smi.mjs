#!/usr/bin/env node
// Refreshes assets/smi-{dark,light}.svg from the GitHub GraphQL API.
// Needs GITHUB_TOKEN (the Actions token is enough; locally: GITHUB_TOKEN=$(gh auth token)).

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchStats, smiSvg } from "./lib/smi.mjs";
import { themes } from "./lib/theme.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN is required (GraphQL does not allow anonymous requests).");
  process.exit(1);
}

const config = JSON.parse(await readFile(resolve(root, "profile.json"), "utf8"));
const stats = await fetchStats(config.profile.username, token);
for (const t of Object.values(themes)) {
  await writeFile(resolve(root, "assets", `smi-${t.name}.svg`), smiSvg(config, stats, t));
}
console.log(`gh-smi: ${stats.total} contributions, ${stats.activeDays} active days, ${stats.streak}-day streak, ${stats.repoCount} repos.`);
