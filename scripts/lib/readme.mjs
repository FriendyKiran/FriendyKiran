const badge = (link) => {
  const label = encodeURIComponent(link.label.replaceAll("-", "--").replaceAll(" ", "_"));
  return `<a href="${link.url}"><img alt="${link.label}" src="https://img.shields.io/badge/${label}-${link.color}?style=flat-square&logo=${link.logo}&logoColor=white"></a>`;
};

// A <picture> that follows the viewer's GitHub theme.
const themed = (base, alt, width = "100%") => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/${base}-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/${base}-light.svg">
  <img src="./assets/${base}-dark.svg" alt="${alt}" width="${width}">
</picture>`;

function yaml(value, indent = 0) {
  const sp = " ".repeat(indent);
  return Object.entries(value)
    .map(([key, v]) => {
      if (Array.isArray(v)) return `${sp}${key}:\n${v.map((item) => `${sp}  - ${item}`).join("\n")}`;
      if (v && typeof v === "object") return `${sp}${key}:\n${yaml(v, indent + 2)}`;
      return `${sp}${key}: ${v}`;
    })
    .join("\n");
}

function requirements(groups) {
  return groups.map((g) => `# ${g.group}\n${g.items.join("  ")}`).join("\n\n");
}

function projectGrid(projects) {
  const cells = projects.map(
    (p) => `<td width="50%"><a href="${p.url}">${themed(`cards/${p.id}`, `${p.name}: ${p.metric} ${p.metricLabel}`)}</a></td>`
  );
  const rows = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(`<tr>\n${cells.slice(i, i + 2).join("\n")}\n</tr>`);
  return `<table>\n${rows.join("\n")}\n</table>`;
}

export function readme(config) {
  const p = config.profile;
  const pubs = config.publications
    .map((pub) => `- **${pub.year}** · [${pub.title}](${pub.url})  \n  <sub>${pub.authors.replace("K. B. Athina", "**K. B. Athina**")} · _${pub.venue}_</sub>`)
    .join("\n");

  return `<!-- Generated from profile.json by scripts/build.mjs. Edit the JSON, not this file. -->
<div align="center">

${themed("hero", `${p.name} — ${p.headline}. ${p.tagline}`)}

${config.links.map(badge).join(" ")}

</div>

### \`$ cat model_card.yaml\`

\`\`\`yaml
${yaml(config.modelCard)}
\`\`\`

### \`neo4j$ MATCH (me)-[*]->(work)\` &nbsp;·&nbsp; my work as a knowledge graph

${themed("graph", "Knowledge graph: Kiran linked to four domains (LLMs and RAG, vision and multimodal, classical ML, data and MLOps), each linked to the work built in it and the tools it uses")}

### \`$ ls ./models\` &nbsp;·&nbsp; selected work

${projectGrid(config.projects)}

<sub>Cards link to the code where it's public, otherwise to the case study on my <a href="https://kiranbabuathina.com/#projects">portfolio</a>.</sub>

### \`>>> kiran.fit()\` &nbsp;·&nbsp; training log

${themed("career", "Career as a rising validation-accuracy curve from B.Tech in 2017 through TCS, Texas A&M, and the AISLS Lab, to the next role")}

<details>
<summary><b><code>$ cat requirements.txt</code></b> &nbsp;·&nbsp; tech stack</summary>

\`\`\`python
${requirements(config.requirements)}
\`\`\`

</details>

<details>
<summary><b><code>$ cat publications.bib</code></b> &nbsp;·&nbsp; research output</summary>

${pubs}

**Certifications:** ${config.certifications.join(" · ")}

</details>

### \`$ watch gh-smi\` &nbsp;·&nbsp; live telemetry

${themed("smi", "nvidia-smi style panel with live GitHub stats: contributions, streak, repos, recent pushes, and languages")}

<sub>Regenerated daily by a GitHub Action from the GitHub GraphQL API — no third-party stat cards.</sub>

<div align="center">

<br>

**${p.status}** → [kiranathina8@gmail.com](mailto:kiranathina8@gmail.com)

<sub><code>early_stopping=False</code></sub>

</div>
`;
}
