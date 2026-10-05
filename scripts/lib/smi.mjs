import { MONO, esc, frame, n } from "./theme.mjs";

const COLS = 92; // characters per table row
const CHAR = 8.4; // forced glyph advance (textLength keeps every font aligned)
const LINE = 21;
const PAD = 28;

const pad = (s, w, right = false) => {
  const str = String(s);
  if (str.length >= w) return str.slice(0, w);
  return right ? str.padStart(w) : str.padEnd(w);
};

function ago(date, now) {
  const days = Math.floor((now - new Date(date)) / 86400000);
  if (days <= 0) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function pid(name) {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 90000;
  return h + 1000;
}

// Fetch everything the panel needs in one GraphQL call.
export async function fetchStats(login, token) {
  const query = `query($login: String!) {
    user(login: $login) {
      followers { totalCount }
      contributionsCollection {
        contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } }
      }
      repositories(ownerAffiliations: OWNER, privacy: PUBLIC, first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
        totalCount
        nodes { name isFork pushedAt stargazerCount primaryLanguage { name } languages(first: 6) { edges { size node { name color } } } }
      }
    }
  }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": `${login}-gh-smi` },
    body: JSON.stringify({ query, variables: { login } })
  });
  if (!res.ok) throw new Error(`GitHub GraphQL returned ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
  const user = json.data.user;

  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  const weeks = user.contributionsCollection.contributionCalendar.weeks.map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0));
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].contributionCount > 0) streak += 1;
    else if (i !== days.length - 1) break; // today may still be empty
  }

  const repos = user.repositories.nodes;
  const langs = new Map();
  for (const repo of repos.filter((r) => !r.isFork)) {
    for (const edge of repo.languages.edges) {
      const prev = langs.get(edge.node.name) ?? { size: 0, color: edge.node.color };
      prev.size += edge.size;
      langs.set(edge.node.name, prev);
    }
  }

  return {
    total: user.contributionsCollection.contributionCalendar.totalContributions,
    activeDays: days.filter((d) => d.contributionCount > 0).length,
    last30: days.slice(-30).reduce((s, d) => s + d.contributionCount, 0),
    streak,
    weeks,
    repoCount: user.repositories.totalCount,
    stars: repos.reduce((s, r) => s + r.stargazerCount, 0),
    followers: user.followers.totalCount,
    recent: repos.slice(0, 5).map((r) => ({ name: r.name, lang: (r.primaryLanguage?.name ?? "—").replace("Jupyter Notebook", "Jupyter"), pushedAt: r.pushedAt })),
    languages: [...langs.entries()]
      .map(([name, v]) => ({ name, size: v.size, color: v.color ?? "#8b949e" }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 6)
  };
}

export function smiSvg(config, stats, t, now = new Date()) {
  const login = config.profile.username;
  const util = Math.round((stats.activeDays / 365) * 100);
  const watts = Math.min(stats.last30 * 4, 350);
  const fan = Math.min(99, 30 + stats.streak * 3);
  const sep = (ch = "-", joint = "+") => `${joint}${ch.repeat(41)}${joint}${ch.repeat(24)}${joint}${ch.repeat(23)}${joint}`;
  const row = (a, b, c) => `|${pad(a, 41)}|${pad(b, 24)}|${pad(c, 23)}|`;
  const full = (s) => `|${pad(s, COLS - 2)}|`;
  const stamp = now.toUTCString().replace("GMT", "UTC");

  const lines = [
    { text: pad(stamp, COLS), cls: "dim" },
    { text: `+${"-".repeat(COLS - 2)}+` },
    { text: full(` GH-SMI 2.0              Driver Version: ${login}     CUDA Version: coffee 12.4`), cls: "hd" },
    { text: sep() },
    { text: row(" GPU  Name                Persistence-M ", " Bus-Id          Disp.A ", " Volatile Uncorr. ECC ") },
    { text: row(" Fan  Temp   Perf         Pwr:Usage/Cap ", "           Memory-Usage ", " GPU-Util  Compute M. ") },
    { text: sep("=", "|") },
    { text: row(`   0  ${pad("KIRAN-RTX-6000", 19)}           On `, " 00000000:TAMU:00.0  On ", "  0 (hallucinations) ") , cls: "gpu" },
    { text: row(` ${pad(fan + "%", 4)} ${pad(stats.streak + "d", 6)} P0       ${pad(`${watts}W / 350W`, 15, true)} `, ` ${pad(`${stats.repoCount} / 100 repos`, 22, true)} `, ` ${pad(util + "%", 6, true)}     Default `), cls: "gpu" },
    { text: sep() },
    { text: "" },
    { text: `+${"-".repeat(COLS - 2)}+` },
    { text: full(" Processes:"), cls: "hd" },
    { text: full("  GPU   PID   Type   Process name                                Lang          Last push") },
    { text: `|${"=".repeat(COLS - 2)}|` },
    ...stats.recent.map((r) => ({
      text: full(`    0  ${pad(pid(r.name), 5, true)}     C   ${pad(`${login}/${r.name}`, 42)}  ${pad(r.lang, 12)}  ${pad(ago(r.pushedAt, now), 9)}`),
      cls: "proc"
    })),
    { text: `+${"-".repeat(COLS - 2)}+` }
  ];

  const width = Math.round(COLS * CHAR + PAD * 2);
  const textTop = 60;
  const tableBottom = textTop + lines.length * LINE;

  const text = lines
    .map((l, i) => {
      if (!l.text) return "";
      const fill = l.cls === "hd" ? t.text : l.cls === "gpu" ? t.green : l.cls === "proc" ? t.accent : l.cls === "dim" ? t.faint : t.muted;
      const len = (l.text.length * CHAR).toFixed(1);
      return `<text x="${PAD}" y="${textTop + i * LINE}" textLength="${len}" lengthAdjust="spacingAndGlyphs" fill="${fill}" style="animation-delay:${(i * 0.04).toFixed(2)}s" class="ln">${esc(l.text)}</text>`;
    })
    .join("\n");

  // Contribution history drawn as GPU utilization over the last year.
  const chartTop = tableBottom + 30;
  const chartH = 90;
  const weeks = stats.weeks.slice(-52);
  const max = Math.max(1, ...weeks);
  const bw = (width - PAD * 2) / weeks.length;
  const bars = weeks
    .map((v, i) => {
      const h = Math.max(2, (v / max) * chartH);
      const x = PAD + i * bw;
      return `<rect x="${n(x + 1)}" y="${n(chartTop + chartH - h)}" width="${n(bw - 2)}" height="${n(h)}" rx="1.5" fill="${v ? t.accent : t.border}" fill-opacity="${v ? (0.35 + 0.65 * (v / max)).toFixed(2) : 1}" class="bar" style="animation-delay:${(0.6 + i * 0.02).toFixed(2)}s"/>`;
    })
    .join("");

  const langTop = chartTop + chartH + 44;
  const totalSize = stats.languages.reduce((s, l) => s + l.size, 0) || 1;
  let lx = PAD;
  const barW = width - PAD * 2;
  const langBar = stats.languages
    .map((l) => {
      const w = (l.size / totalSize) * barW;
      const seg = `<rect x="${n(lx)}" y="${langTop}" width="${n(Math.max(w - 2, 1))}" height="10" rx="3" fill="${l.color}"/>`;
      lx += w;
      return seg;
    })
    .join("");
  let kx = PAD;
  const legend = stats.languages
    .map((l) => {
      const label = `${l.name} ${((l.size / totalSize) * 100).toFixed(1)}%`;
      const item = `<circle cx="${n(kx + 5)}" cy="${langTop + 30}" r="5" fill="${l.color}"/><text x="${n(kx + 15)}" y="${langTop + 34}" font-size="12" fill="${t.muted}">${esc(label)}</text>`;
      kx += label.length * 7.4 + 34;
      return item;
    })
    .join("");

  const height = langTop + 58;
  const style = `
text { font-family: ${MONO}; font-size: 13.5px; white-space: pre; }
.ln { animation: type .35s steps(6) both; }
@keyframes type { from { opacity: 0; } to { opacity: 1; } }
.bar { transform-box: fill-box; transform-origin: bottom; animation: grow .8s cubic-bezier(.2,.8,.2,1) both; }
@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }`;

  const body = `<rect width="${width}" height="${height}" rx="18" fill="${t.bg}" stroke="${t.border}"/>
<text x="${PAD}" y="34" fill="${t.muted}"><tspan fill="${t.green}">${esc(login.toLowerCase())}@tamu-hpc</tspan>:<tspan fill="${t.accent}">~</tspan>$ watch -n 86400 gh-smi</text>
${text}
<text x="${PAD}" y="${chartTop - 10}" font-size="12" fill="${t.text}">GPU-Util history · commits per week, last 52 weeks · ${stats.total} contributions · ${stats.stars}★ · ${stats.followers} follower${stats.followers === 1 ? "" : "s"}</text>
${bars}
<text x="${PAD}" y="${langTop - 10}" font-size="12" fill="${t.text}">Memory by language</text>
${langBar}${legend}`;

  return frame({
    width,
    height,
    title: `gh-smi — live GitHub telemetry for ${login}`,
    desc: `nvidia-smi style panel: ${stats.total} contributions in the last year, ${stats.activeDays} active days, ${stats.streak}-day streak, ${stats.repoCount} public repos. Updated ${stamp}.`,
    style,
    body
  });
}
