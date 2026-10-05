import { MONO, SANS, esc, frame, n } from "./theme.mjs";

const W = 1200;
const H = 400;
const CYCLE = 14;
const DRAW = 6; // seconds to draw the curve
const PLOT = { x0: 70, x1: 1130, y0: 96, y1: 300 };

// Undergrad years are compressed so the dense 2021+ section gets the room.
function makeScale(start, pivot, end) {
  const pivotX = PLOT.x0 + (PLOT.x1 - PLOT.x0) * 0.2;
  return (year) =>
    year <= pivot
      ? PLOT.x0 + ((year - start) / (pivot - start)) * (pivotX - PLOT.x0)
      : pivotX + ((year - pivot) / (end - pivot)) * (PLOT.x1 - pivotX);
}

// Loss decays over time, with a small spike whenever a new domain (dataset) arrives.
function loss(year, spikes, start) {
  let value = 0.92 * Math.exp(-(year - start) / 3.1) + 0.06;
  for (const s of spikes) {
    const d = year - s;
    if (d > 0) value += 0.13 * Math.exp(-d / 0.35) * Math.min(1, d * 8);
  }
  return value;
}

export function careerSvg(config, t) {
  const log = config.career;
  const start = log[0].year;
  const end = log[log.length - 1].year;
  const x = makeScale(start, 2021, end);
  const spikes = log.filter((c) => c.spike).map((c) => c.year);
  const scaleY = (v) => PLOT.y1 - 8 - (v / 1.05) * (PLOT.y1 - PLOT.y0 - 8);

  const steps = 220;
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const year = start + ((end - start) * i) / steps;
    pts.push([x(year), scaleY(loss(year, spikes, start))]);
  }
  const d = `M ${pts.map(([a, b]) => `${n(a)} ${n(b)}`).join(" L ")}`;
  const area = `${d} L ${n(PLOT.x1)} ${PLOT.y1} L ${PLOT.x0} ${PLOT.y1} Z`;

  const ticks = [];
  for (let year = Math.ceil(start); year <= Math.floor(end); year += 1) {
    if (year > start && year < 2021 && year !== 2019) continue;
    const tx = x(year);
    ticks.push(`<path d="M ${n(tx)} ${PLOT.y1} V ${PLOT.y1 + 5}" stroke="${t.faint}"/><text x="${n(tx)}" y="${PLOT.y1 + 20}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${t.faint}">${year}</text>`);
  }

  const marks = log
    .map((c, i) => {
      const cx = x(c.year);
      const cy = scaleY(loss(c.year, spikes, start));
      const at = DRAW * ((cx - PLOT.x0) / (PLOT.x1 - PLOT.x0)) + 0.3;
      const k = (at / CYCLE).toFixed(4);
      const k2 = ((at + 0.4) / CYCLE).toFixed(4);
      const up = i % 2 === 0;
      const last = i === log.length - 1;
      const ly = up ? PLOT.y0 - 22 : PLOT.y1 + 66;
      const anchor = cx > PLOT.x1 - 140 ? "end" : cx < PLOT.x0 + 90 ? "start" : "middle";
      const lx = anchor === "end" ? cx + 6 : anchor === "start" ? cx - 6 : cx;
      const color = last ? t.green : c.spike ? t.violet : t.accent;
      const ring = last
        ? `<circle cx="${n(cx)}" cy="${n(cy)}" r="6" fill="none" stroke="${t.green}"><animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/></circle>`
        : "";
      const show = `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${k};${k2};0.94;1" dur="${CYCLE}s" repeatCount="indefinite"/>`;
      const leaderEnd = up ? ly + 24 : ly - 30;
      return `<g opacity="0">${show}
<path d="M ${n(cx)} ${n(cy)} V ${n(leaderEnd)}" stroke="${color}" stroke-opacity="0.45" stroke-dasharray="2 3"/>
<circle cx="${n(cx)}" cy="${n(cy)}" r="5" fill="${t.bg}" stroke="${color}" stroke-width="2"/>${ring}
<text x="${n(lx)}" y="${n(ly - 16)}" text-anchor="${anchor}" font-family="${MONO}" font-size="10.5" fill="${color}">${esc(c.tag)}</text>
<text x="${n(lx)}" y="${n(ly)}" text-anchor="${anchor}" font-family="${SANS}" font-size="14" font-weight="650" fill="${t.text}">${esc(c.title)}</text>
<text x="${n(lx)}" y="${n(ly + 17)}" text-anchor="${anchor}" font-family="${SANS}" font-size="12" fill="${t.muted}">${esc(c.detail)}</text></g>`;
    })
    .join("\n");

  const kDraw = (DRAW / CYCLE).toFixed(4);
  const style = `
.curve { stroke-dasharray: 2400; animation: draw ${CYCLE}s ease-in-out infinite both; }
.area { animation: fade ${CYCLE}s ease-in-out infinite both; }
@keyframes draw { 0% { stroke-dashoffset: 2400; } ${(kDraw * 100).toFixed(1)}%, 94% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }
@keyframes fade { 0%, 10% { opacity: 0; } ${(kDraw * 100).toFixed(1)}%, 94% { opacity: 1; } 100% { opacity: 0; } }`;

  const defs = `<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow * 0.5}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
<linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.violet}"/><stop offset="0.6" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.green}"/></linearGradient>`;

  const body = `<rect width="${W}" height="${H}" rx="18" fill="${t.bg}" stroke="${t.border}"/>
<text x="40" y="40" font-family="${MONO}" font-size="12.5" fill="${t.muted}"><tspan fill="${t.accent}">&gt;&gt;&gt;</tspan> kiran.fit(experience, epochs="${Math.floor(start)}→now", early_stopping=<tspan fill="${t.rose}">False</tspan>)</text>
<text x="${W - 40}" y="40" text-anchor="end" font-family="${MONO}" font-size="11" fill="${t.faint}"><tspan fill="${t.accent}">━</tspan> loss  <tspan fill="${t.violet}">●</tspan> new domain  <tspan fill="${t.green}">●</tspan> next checkpoint</text>
<path d="M ${PLOT.x0} ${PLOT.y1} H ${PLOT.x1}" stroke="${t.border}"/>
${ticks.join("")}
<path class="area" d="${area}" fill="url(#fill)"/>
<path class="curve" d="${d}" fill="none" stroke="url(#stroke)" stroke-width="2.6" stroke-linecap="round"/>
${marks}`;

  return frame({
    width: W,
    height: H,
    title: "Career as a training run",
    desc: `A loss curve from ${Math.floor(start)} to now with checkpoints: ${log.map((c) => `${c.title} (${c.detail})`).join("; ")}.`,
    defs,
    style,
    body
  });
}
