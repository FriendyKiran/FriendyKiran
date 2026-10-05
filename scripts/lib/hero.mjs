import sharp from "sharp";
import { MONO, SANS, esc, frame, gaussian, n, rng } from "./theme.mjs";

const W = 1200;
const H = 560;
const CYCLE = 18; // seconds; portrait and terminal loop together
const PANEL = { x: 24, y: 24, w: 470, h: 512 };

// Sample the transparent portrait on a hex grid. Each cell keeps its luminance (0..1).
export async function samplePortrait(source, { width, height, spacing }) {
  const trimmed = await sharp(source).ensureAlpha().trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  const aspect = trimmed.info.width / trimmed.info.height;
  const drawW = Math.min(width, height * aspect);
  const drawH = drawW / aspect;
  const rowStep = spacing * 0.866;
  const cols = Math.floor(drawW / spacing);
  const rows = Math.floor(drawH / rowStep);
  const { data } = await sharp(trimmed.data)
    .resize(cols, rows, { fit: "fill", kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const i = (row * cols + col) * 4;
      const alpha = data[i + 3] / 255;
      if (alpha < 0.5) continue;
      const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      cells.push({
        x: col * spacing + (row % 2 ? spacing / 2 : 0) + (width - drawW) / 2,
        y: row * rowStep + (height - drawH),
        lum
      });
    }
  }
  // Stretch luminance within the subject so faces survive dark backdrops and dark skin tones.
  const sorted = cells.map((c) => c.lum).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.03)];
  const hi = sorted[Math.floor(sorted.length * 0.97)];
  for (const cell of cells) cell.lum = Math.min(1, Math.max(0, (cell.lum - lo) / (hi - lo))) ** 0.8;

  return { cells, spacing };
}

function portraitLayer(portrait, t) {
  const random = rng(7);
  const ox = PANEL.x + 20;
  const oy = PANEL.y + 44;
  const clusters = [
    { label: "llm", x: 110, y: 120, cls: "c0" },
    { label: "retrieval", x: 330, y: 170, cls: "c1" },
    { label: "vision", x: 200, y: 360, cls: "c2" }
  ];
  const { spacing } = portrait;
  const maxR = spacing * 0.52;

  const dots = portrait.cells.map((cell) => {
    // Dark theme: light pixels glow. Light theme: ink where the photo is dark.
    const ink = t.name === "dark" ? cell.lum ** 0.6 : 1 - cell.lum;
    const r = Math.max(0.55, ink * maxR);
    const cluster = clusters[Math.floor(random() * clusters.length)];
    const dx = cluster.x + gaussian(random) * 34 - cell.x;
    const dy = cluster.y + gaussian(random) * 26 - cell.y;
    const delay = (random() * 0.9).toFixed(2);
    const tone = ink > (t.name === "dark" ? 0.93 : 0.72) ? " hi" : "";
    return `<circle class="p ${cluster.cls}${tone}" cx="${n(cell.x)}" cy="${n(cell.y)}" r="${n(r)}" style="--dx:${n(dx)}px;--dy:${n(dy)}px;animation-delay:${delay}s"/>`;
  });

  const labels = clusters
    .map((c, i) => `<text class="cl" x="${c.x}" y="${c.y - 44}" text-anchor="middle" style="animation-delay:${(i * 0.1).toFixed(1)}s">● ${c.label}</text>`)
    .join("");

  return `<g transform="translate(${ox} ${oy})">${labels}${dots.join("")}</g>`;
}

function terminal(config, t) {
  const x = 530;
  const y = 190;
  const w = 646;
  const lines = config.hero.output;
  const lineH = 25;
  const start = 3.2;
  const per = 1.25;

  const clips = [];
  const rows = [];
  const prompt = config.hero.prompt;

  const reveal = (id, rx, ry, rw, begin, dur) => {
    const k1 = (begin / CYCLE).toFixed(4);
    const k2 = ((begin + dur) / CYCLE).toFixed(4);
    clips.push(`<clipPath id="${id}"><rect x="${rx}" y="${ry}" height="${lineH}" width="0"><animate attributeName="width" values="0;0;${rw};${rw};0" keyTimes="0;${k1};${k2};0.95;1" dur="${CYCLE}s" repeatCount="indefinite"/></rect></clipPath>`);
  };

  reveal("tp", x + 20, y + 40, w - 40, 2.0, 1.0);
  rows.push(`<g clip-path="url(#tp)"><text x="${x + 22}" y="${y + 58}" class="mono" font-size="14.5"><tspan fill="${t.green}">&gt;&gt;&gt;</tspan><tspan fill="${t.text}"> ${esc(prompt)}</tspan></text></g>`);

  lines.forEach((line, i) => {
    const ly = y + 90 + i * lineH;
    reveal(`tl${i}`, x + 20, ly - 19, w - 40, start + i * per, 0.9);
    const metric = line.metric ? `<tspan fill="${t.amber}">  [${esc(line.metric)}]</tspan>` : "";
    rows.push(`<g clip-path="url(#tl${i})"><text x="${x + 22}" y="${ly}" class="mono" font-size="14.5"><tspan fill="${t.accent}">→ </tspan><tspan fill="${t.text}">${esc(line.text)}</tspan>${metric}</text></g>`);
  });

  const doneY = y + 90 + lines.length * lineH + 6;
  const doneAt = start + lines.length * per + 0.3;
  reveal("td", x + 20, doneY - 19, w - 40, doneAt, 0.6);
  rows.push(`<g clip-path="url(#td)"><text x="${x + 22}" y="${doneY}" class="mono" font-size="13" fill="${t.muted}"><tspan fill="${t.green}">✓ done</tspan>  grounded=True · cited=True · hallucinations=0</text></g>`);

  const cursorAt = ((doneAt + 0.6) / CYCLE).toFixed(4);
  const cursor = `<rect x="${x + 22}" y="${doneY + 10}" width="9" height="16" fill="${t.accent}" opacity="0"><animate attributeName="opacity" values="0;0;1;0;1;0;1;0;1;0" keyTimes="0;${cursorAt};${(+cursorAt + 0.06).toFixed(4)};${(+cursorAt + 0.12).toFixed(4)};${(+cursorAt + 0.18).toFixed(4)};${(+cursorAt + 0.24).toFixed(4)};${(+cursorAt + 0.3).toFixed(4)};${(+cursorAt + 0.36).toFixed(4)};0.94;1" dur="${CYCLE}s" repeatCount="indefinite"/></rect>`;

  const height = doneY + 40 - y;
  const box = `<rect x="${x}" y="${y}" width="${w}" height="${height}" rx="12" fill="${t.surface}" stroke="${t.border}"/>
<path d="M ${x} ${y + 30} H ${x + w}" stroke="${t.border}"/>
<circle cx="${x + 18}" cy="${y + 15}" r="4.5" fill="#ef4444"/><circle cx="${x + 34}" cy="${y + 15}" r="4.5" fill="#f59e0b"/><circle cx="${x + 50}" cy="${y + 15}" r="4.5" fill="#22c55e"/>
<text x="${x + w / 2}" y="${y + 19.5}" text-anchor="middle" class="mono" font-size="11.5" fill="${t.muted}">inference.py — ${esc(config.profile.username)}@tamu-hpc</text>
<text x="${x + w - 16}" y="${y + 19.5}" text-anchor="end" class="mono" font-size="10.5" fill="${t.faint}">temp=0.2 · top_k=5</text>`;

  return { clips: clips.join(""), body: `${box}${rows.join("")}${cursor}`, bottom: y + height };
}

function stats(config, t, top) {
  const items = config.highlights;
  const gap = 12;
  const x0 = 530;
  const w = (646 - gap * (items.length - 1)) / items.length;
  return items
    .map((item, i) => {
      const x = x0 + i * (w + gap);
      const begin = (1.2 + i * 0.15).toFixed(2);
      return `<g class="stat" style="animation-delay:${begin}s"><rect x="${n(x)}" y="${top}" width="${n(w)}" height="64" rx="10" fill="${t.surface2}" stroke="${t.border}"/>
<text x="${n(x + 14)}" y="${top + 30}" font-family="${SANS}" font-size="22" font-weight="700" fill="${t.accent}">${esc(item.value)}</text>
<text x="${n(x + 14)}" y="${top + 50}" font-family="${SANS}" font-size="11.5" fill="${t.muted}">${esc(item.label)}</text></g>`;
    })
    .join("");
}

export function heroSvg(config, portrait, t) {
  const term = terminal(config, t);
  const p = config.profile;
  const style = `
.mono { font-family: ${MONO}; }
.p { fill: var(--c); animation: gather ${CYCLE}s cubic-bezier(.6,0,.2,1) infinite both; }
.c0 { --c: ${t.violet}; } .c1 { --c: ${t.accent}; } .c2 { --c: ${t.green}; }
@keyframes gather {
  0%, 5% { transform: translate(var(--dx), var(--dy)); fill: var(--c); opacity: .75; }
  17%, 91% { transform: translate(0, 0); fill: ${t.accent}; opacity: 1; }
  97%, 100% { transform: translate(var(--dx), var(--dy)); fill: var(--c); opacity: .75; }
}
.p.hi { animation-name: gather-hi; }
@keyframes gather-hi {
  0%, 5% { transform: translate(var(--dx), var(--dy)); fill: var(--c); opacity: .75; }
  17%, 91% { transform: translate(0, 0); fill: ${t.text}; opacity: 1; }
  97%, 100% { transform: translate(var(--dx), var(--dy)); fill: var(--c); opacity: .75; }
}
.cl { font-family: ${MONO}; font-size: 12px; fill: ${t.muted}; animation: cl ${CYCLE}s ease infinite both; }
@keyframes cl { 0%, 6% { opacity: 1; } 12%, 93% { opacity: 0; } 98%, 100% { opacity: 1; } }
.stat { animation: rise .7s ease-out both; }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.live { animation: blink 1.6s ease-in-out infinite; }
@keyframes blink { 50% { opacity: .25; } }`;

  const defs = `<pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 H 0 V 28" fill="none" stroke="${t.accent}" stroke-opacity="0.06"/></pattern>
<radialGradient id="halo" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow * 0.45}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
<clipPath id="panel"><rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="14"/></clipPath>
${term.clips}`;

  const body = `<rect width="${W}" height="${H}" rx="18" fill="${t.bg}"/>
<rect width="${W}" height="${H}" rx="18" fill="url(#grid)"/>
<rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="14" fill="${t.surface}" fill-opacity="0.6" stroke="${t.border}"/>
<rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="14" fill="url(#halo)"/>
<text x="${PANEL.x + 18}" y="${PANEL.y + 26}" class="mono" font-size="11.5" fill="${t.muted}">latent_space.project(<tspan fill="${t.accent}">"${esc(p.username)}"</tspan>)</text>
<text x="${PANEL.x + PANEL.w - 18}" y="${PANEL.y + 26}" text-anchor="end" class="mono" font-size="11" fill="${t.faint}">n=${portrait.cells.length} · dims=2</text>
<g clip-path="url(#panel)">${portraitLayer(portrait, t)}</g>
<g class="live"><circle cx="538" cy="52" r="5" fill="${t.green}"/></g>
<text x="552" y="56.5" class="mono" font-size="12.5" fill="${t.green}">${esc(p.status)}</text>
<text x="528" y="112" font-family="${SANS}" font-size="46" font-weight="700" fill="${t.text}" letter-spacing="-0.5">${esc(p.name)}</text>
<text x="530" y="146" font-family="${SANS}" font-size="21" font-weight="600" fill="${t.accent}">${esc(p.headline)}</text>
<text x="530" y="174" font-family="${SANS}" font-size="14.5" fill="${t.muted}">${esc(p.tagline)}</text>
${term.body}
${stats(config, t, term.bottom + 14)}
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="${t.border}"/>`;

  return frame({
    width: W,
    height: H,
    title: `${p.name} — ${p.headline}`,
    desc: "Points start as three embedding clusters (llm, retrieval, vision) and converge into a halftone portrait, while an inference terminal streams what Kiran builds.",
    defs,
    style,
    body
  });
}

export const HERO_PORTRAIT_BOX = { width: PANEL.w - 40, height: PANEL.h - 52, spacing: 6.2 };
