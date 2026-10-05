import { MONO, SANS, esc, frame, n, wrap } from "./theme.mjs";

const W = 600;
const H = 250;

function gauge(project, t, cx, cy) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const track = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.surface2}" stroke-width="9"/>`;
  const value = `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-family="${SANS}" font-size="${project.metric.length > 6 ? 19 : 22}" font-weight="700" fill="${t.text}">${esc(project.metric)}</text>
<text x="${cx}" y="${cy + r + 28}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${t.muted}">${esc(project.metricLabel)}</text>`;

  if (typeof project.gauge !== "number") {
    // No percentage to plot: a slow-spinning dashed ring instead of a fake fill.
    return `${track}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.accent}" stroke-width="9" stroke-dasharray="6 12" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="16s" repeatCount="indefinite"/></circle>${value}`;
  }

  const target = c * (1 - project.gauge / 100);
  return `${track}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#ring)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${n(c)}" stroke-dashoffset="${n(c)}" transform="rotate(-90 ${cx} ${cy})"><animate attributeName="stroke-dashoffset" values="${n(c)};${n(c)};${n(target)};${n(target)};${n(c)}" keyTimes="0;0.05;0.3;0.92;1" dur="9s" calcMode="spline" keySplines="0 0 1 1;.3 .7 .2 1;0 0 1 1;.6 0 1 1" repeatCount="indefinite"/></circle>${value}`;
}

export function cardSvg(project, t) {
  const lines = wrap(project.summary, 50).slice(0, 4);
  const desc = lines
    .map((line, i) => `<text x="28" y="${120 + i * 21}" font-family="${SANS}" font-size="14" fill="${t.muted}">${esc(line)}</text>`)
    .join("");

  let cx = 28;
  const chips = project.stack
    .map((item) => {
      const w = item.length * 7.3 + 18;
      const chip = `<rect x="${n(cx)}" y="208" width="${n(w)}" height="24" rx="12" fill="${t.surface2}" stroke="${t.border}"/><text x="${n(cx + w / 2)}" y="224" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${t.text}">${esc(item)}</text>`;
      cx += w + 7;
      return chip;
    })
    .join("");

  const link = project.repo ? "repo ↗" : "case study ↗";

  const defs = `<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.green}"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset="0.5" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>`;

  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.surface}" stroke="${t.border}"/>
<rect x="40" y="0.5" width="200" height="2" fill="url(#edge)"><animate attributeName="x" values="-200;${W}" dur="5s" repeatCount="indefinite"/></rect>
<text x="28" y="40" font-family="${MONO}" font-size="11" fill="${t.accent}" letter-spacing="1">${esc(project.domain.toUpperCase())}</text>
<text x="${W - 28}" y="40" text-anchor="end" font-family="${MONO}" font-size="11" fill="${t.faint}">${link}</text>
<text x="28" y="80" font-family="${SANS}" font-size="23" font-weight="700" fill="${t.text}">${esc(project.name)}</text>
${desc}
${chips}
${gauge(project, t, W - 92, 118)}`;

  return frame({
    width: W,
    height: H,
    title: project.name,
    desc: `${project.summary} Result: ${project.metric} ${project.metricLabel}.`,
    defs,
    body
  });
}
