import { MONO, SANS, esc, frame, n } from "./theme.mjs";

const W = 1200;
const H = 540;
const CENTER = { x: 600, y: 112 };
const HUB_Y = 236;

const pillW = (text, size) => text.length * size * 0.56 + 24;

function cypher(query, t) {
  // Light syntax colouring: keywords, labels, strings.
  return esc(query)
    .replace(/\b(MATCH|RETURN|WHERE)\b/g, `<tspan fill="${t.violet}" font-weight="700">$1</tspan>`)
    .replace(/(:[A-Z][A-Za-z_]+)/g, `<tspan fill="${t.accent}">$1</tspan>`)
    .replace(/(&quot;[^&]*&quot;)/g, `<tspan fill="${t.amber}">$1</tspan>`);
}

export function graphSvg(config, t) {
  const g = config.graph;
  const MARGIN = 60;
  const step = (W - MARGIN * 2) / g.hubs.length;
  const edges = [];
  const nodes = [];
  const pulses = [];
  const toolPos = new Map();
  const hubPos = new Map();

  g.hubs.forEach((hub, h) => {
    const hx = MARGIN + step * h + step / 2;
    hubPos.set(hub.name, { x: hx, y: HUB_Y });
    const delay = 0.5 + h * 0.15;

    edges.push({ d: `M ${CENTER.x} ${CENTER.y + 34} C ${CENTER.x} ${HUB_Y - 40} ${hx} ${CENTER.y + 50} ${hx} ${HUB_Y - 16}`, color: t.accent, opacity: 0.55, delay, width: 1.8 });

    hub.work.forEach((name, i) => {
      const wx = hx + (i - (hub.work.length - 1) / 2) * 80;
      const wy = i % 2 ? 374 : 334;
      const d = `M ${hx} ${HUB_Y + 16} C ${hx} ${HUB_Y + 50} ${wx} ${wy - 46} ${wx} ${wy - 13}`;
      edges.push({ d, color: t.accent, opacity: 0.4, delay: delay + 0.35, width: 1.3 });
      const w = pillW(name, 12);
      nodes.push(`<g class="pop" style="animation-delay:${(delay + 0.6 + i * 0.08).toFixed(2)}s"><rect x="${n(wx - w / 2)}" y="${wy - 13}" width="${n(w)}" height="26" rx="13" fill="${t.surface}" stroke="${t.accent}" stroke-opacity="0.7"/><text x="${n(wx)}" y="${wy + 4.5}" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="600" fill="${t.text}">${esc(name)}</text></g>`);

      // A signal leaves the root, passes through the hub and lands on this piece of work.
      const path = `M ${CENTER.x} ${CENTER.y + 34} C ${CENTER.x} ${HUB_Y - 40} ${hx} ${CENTER.y + 50} ${hx} ${HUB_Y - 16} L ${hx} ${HUB_Y + 16} C ${hx} ${HUB_Y + 50} ${wx} ${wy - 46} ${wx} ${wy - 13}`;
      const begin = (2 + h * 0.7 + i * 2.9).toFixed(2);
      pulses.push(`<circle r="3.6" fill="${t.accent}" opacity="0"><animateMotion path="${path}" dur="2.2s" begin="${begin}s;p${h}${i}.end+6.6s" id="p${h}${i}" fill="freeze"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="2.2s" begin="${begin}s;p${h}${i}.end+6.6s"/></circle>`);
    });

    hub.tools.forEach((name, i) => {
      const tx = hx + (i - (hub.tools.length - 1) / 2) * 72;
      const ty = i % 2 ? 478 : 446;
      toolPos.set(name, { x: tx, y: ty });
      edges.push({ d: `M ${hx} ${HUB_Y + 16} L ${tx} ${ty - 6}`, color: t.faint, opacity: 0.35, delay: delay + 0.6, width: 1 });
      nodes.push(`<g class="pop" style="animation-delay:${(delay + 0.9 + i * 0.06).toFixed(2)}s"><circle cx="${n(tx)}" cy="${ty}" r="5" fill="${t.bg}" stroke="${t.green}" stroke-width="2"/><text x="${n(tx)}" y="${ty + 20}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${t.muted}">${esc(name)}</text></g>`);
    });

    const hw = pillW(hub.name, 14);
    nodes.push(`<g class="pop" style="animation-delay:${delay.toFixed(2)}s"><rect x="${n(hx - hw / 2)}" y="${HUB_Y - 16}" width="${n(hw)}" height="32" rx="16" fill="${t.surface2}" stroke="${t.violet}" stroke-width="1.5"/><text x="${n(hx)}" y="${HUB_Y + 5}" text-anchor="middle" font-family="${SANS}" font-size="14" font-weight="700" fill="${t.text}">${esc(hub.name)}</text></g>`);
  });

  // Shared tools are what turn the tree into a graph.
  for (const [tool, hubName] of g.crossLinks) {
    const a = toolPos.get(tool);
    const b = hubPos.get(hubName);
    if (!a || !b) throw new Error(`graph.crossLinks: unknown node ${!a ? tool : hubName}`);
    const mx = (a.x + b.x) / 2;
    edges.push({ d: `M ${a.x} ${a.y - 6} C ${a.x} ${a.y - 120} ${mx} ${b.y + 150} ${b.x + (a.x < b.x ? -40 : 40)} ${b.y + 16}`, color: t.violet, opacity: 0.45, delay: 2.4, width: 1.2, dash: "4 5" });
  }

  const edgeSvg = edges
    .map((e) => `<path class="${e.dash ? "xedge" : "edge"}" d="${e.d}" fill="none" stroke="${e.color}" stroke-opacity="${e.opacity}" stroke-width="${e.width}"${e.dash ? ` stroke-dasharray="${e.dash}"` : ""} style="animation-delay:${e.delay.toFixed(2)}s"/>`)
    .join("\n");

  const workCount = g.hubs.reduce((s, h) => s + h.work.length, 0);
  const toolCount = g.hubs.reduce((s, h) => s + h.tools.length, 0);

  const root = `<g class="pop" style="animation-delay:0.2s">
<circle cx="${CENTER.x}" cy="${CENTER.y}" r="34" fill="${t.surface}" stroke="${t.accent}" stroke-width="2"/>
<circle cx="${CENTER.x}" cy="${CENTER.y}" r="34" fill="none" stroke="${t.accent}" stroke-opacity="0.5"><animate attributeName="r" values="34;50;34" dur="3s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite"/></circle>
<text x="${CENTER.x}" y="${CENTER.y + 6}" text-anchor="middle" font-family="${SANS}" font-size="17" font-weight="700" fill="${t.text}">Kiran</text></g>`;

  const style = `
.pop { transform-box: fill-box; transform-origin: center; animation: pop .5s cubic-bezier(.3,1.4,.5,1) both; }
@keyframes pop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
.edge { stroke-dasharray: 600; animation: draw 1.1s ease-out both; }
.xedge { animation: fadein 1s ease-out both; }
@keyframes draw { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }`;

  const legendY = H - 18;
  const body = `<rect width="${W}" height="${H}" rx="18" fill="${t.bg}" stroke="${t.border}"/>
<text x="36" y="40" font-family="${MONO}" font-size="12.5" fill="${t.muted}"><tspan fill="${t.green}">neo4j$</tspan> ${cypher(g.query, t)}</text>
${edgeSvg}
${pulses.join("\n")}
${root}
${nodes.join("\n")}
<text x="36" y="${legendY}" font-family="${MONO}" font-size="11" fill="${t.faint}"><tspan fill="${t.violet}">●</tspan> domain   <tspan fill="${t.accent}">●</tspan> :BUILT   <tspan fill="${t.green}">●</tspan> :USES   <tspan fill="${t.violet}">┅</tspan> shared tool</text>
<text x="${W - 36}" y="${legendY}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${t.faint}">returned ${1 + g.hubs.length + workCount + toolCount} nodes · ${edges.length} relationships</text>`;

  return frame({
    width: W,
    height: H,
    title: "Knowledge graph of my work",
    desc: `Graph with Kiran at the root, linked to ${g.hubs.map((h) => `${h.name} (work: ${h.work.join(", ")}; tools: ${h.tools.join(", ")})`).join("; ")}.`,
    style,
    body
  });
}
