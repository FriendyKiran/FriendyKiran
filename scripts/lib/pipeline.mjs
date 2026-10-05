import { MONO, SANS, esc, frame } from "./theme.mjs";

const W = 1200;
const H = 430;
const DUR = 6; // one packet trip + rest
const TRAVEL = 0.78; // fraction of DUR spent moving

function node({ x, y, w, h, title, sub, t, accent, id }) {
  return `<g${id ? ` id="${id}"` : ""}><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="11" fill="${t.surface}" stroke="${accent ?? t.border}" stroke-width="${accent ? 1.4 : 1}"/>
<text x="${x}" y="${y - 3}" text-anchor="middle" font-family="${SANS}" font-size="15" font-weight="650" fill="${t.text}">${esc(title)}</text>
<text x="${x}" y="${y + 16}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${t.muted}">${esc(sub)}</text></g>`;
}

// Polyline length is a good-enough proxy for where a packet is along a path.
function segLen(points) {
  let total = 0;
  const marks = [0];
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    marks.push(total);
  }
  return marks.map((m) => m / total);
}

export function pipelineSvg(config, t) {
  const Y = 178;
  const nodes = {
    query: { x: 92, y: Y, w: 128, h: 64, title: "query", sub: "user question" },
    router: { x: 290, y: Y, w: 156, h: 64, title: "agentic router", sub: "picks the source" },
    rerank: { x: 738, y: Y, w: 150, h: 64, title: "rerank + cite", sub: "chunk-level scores" },
    llm: { x: 918, y: Y, w: 160, h: 64, title: "fine-tuned LLM", sub: "LoRA · Gemma/LLaMA" }
  };
  const answer = { x: 1095, y: Y, w: 150, h: 64 };
  const branches = [
    { y: 78, title: "knowledge graph", sub: "fine-tuned KG retrievers", color: t.violet },
    { y: 178, title: "BM25 · sparse", sub: "exact-term recall", color: t.amber },
    { y: 278, title: "FAISS · dense", sub: "semantic neighbours", color: t.green }
  ];
  const BX = 525;
  const BW = 196;

  const edges = [];
  const packets = [];
  const pulses = [];

  branches.forEach((b, i) => {
    const pts = [
      [nodes.query.x + 64, Y],
      [nodes.router.x - 78, Y],
      [nodes.router.x + 78, Y],
      [BX - BW / 2, b.y],
      [BX + BW / 2, b.y],
      [nodes.rerank.x - 75, Y],
      [nodes.rerank.x + 75, Y],
      [nodes.llm.x - 80, Y],
      [nodes.llm.x + 80, Y],
      [answer.x - answer.w / 2, Y]
    ];
    const [a, b1, b2, c, d, e, f, g, h, k] = pts;
    const cx1 = (b2[0] + c[0]) / 2;
    const cx2 = (d[0] + e[0]) / 2;
    const path = `M ${a[0]} ${a[1]} L ${b1[0]} ${b1[1]} L ${b2[0]} ${b2[1]} C ${cx1} ${b2[1]} ${cx1} ${c[1]} ${c[0]} ${c[1]} L ${d[0]} ${d[1]} C ${cx2} ${d[1]} ${cx2} ${e[1]} ${e[0]} ${e[1]} L ${f[0]} ${f[1]} L ${g[0]} ${g[1]} L ${h[0]} ${h[1]} L ${k[0]} ${k[1]}`;
    edges.push(`<path d="M ${b2[0]} ${b2[1]} C ${cx1} ${b2[1]} ${cx1} ${c[1]} ${c[0]} ${c[1]}" fill="none" stroke="${t.border}" stroke-width="1.6"/>`);
    edges.push(`<path d="M ${d[0]} ${d[1]} C ${cx2} ${d[1]} ${cx2} ${e[1]} ${e[0]} ${e[1]}" fill="none" stroke="${t.border}" stroke-width="1.6"/>`);

    const begin = i * (DUR / branches.length);
    packets.push(`<circle r="5.5" fill="${b.color}" opacity="0"><animateMotion path="${path}" dur="${DUR}s" begin="${begin}s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;${TRAVEL};1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.04;${TRAVEL - 0.02};${TRAVEL};1" dur="${DUR}s" begin="${begin}s" repeatCount="indefinite"/></circle>`);

    // Light up the branch while its packet is inside it.
    const marks = segLen(pts);
    const inAt = (marks[3] * TRAVEL).toFixed(3);
    const outAt = (marks[4] * TRAVEL).toFixed(3);
    pulses.push(`<rect x="${BX - BW / 2}" y="${b.y - 28}" width="${BW}" height="56" rx="11" fill="${b.color}" opacity="0"><animate attributeName="opacity" values="0;0;0.16;0.16;0;0" keyTimes="0;${inAt};${(+inAt + 0.01).toFixed(3)};${outAt};${(+outAt + 0.06).toFixed(3)};1" dur="${DUR}s" begin="${begin}s" repeatCount="indefinite"/></rect>`);
  });

  const straight = [
    [nodes.query.x + 64, nodes.router.x - 78],
    [nodes.rerank.x + 75, nodes.llm.x - 80],
    [nodes.llm.x + 80, answer.x - answer.w / 2]
  ]
    .map(([x1, x2]) => `<path d="M ${x1} ${Y} H ${x2}" stroke="${t.border}" stroke-width="1.6" marker-end="url(#arrow)"/>`)
    .join("");

  const branchNodes = branches
    .map((b) => node({ x: BX, y: b.y, w: BW, h: 56, title: b.title, sub: b.sub, t, accent: b.color }))
    .join("");

  const cites = ["[1]", "[2]", "[3]"]
    .map((c, i) => `<tspan fill="${t.accent}" opacity="0.25">${c}<animate attributeName="opacity" values="0.25;1;0.25" dur="2.4s" begin="${i * 0.4}s" repeatCount="indefinite"/></tspan>`)
    .join(" ");
  const answerNode = `<rect x="${answer.x - answer.w / 2}" y="${Y - 32}" width="${answer.w}" height="64" rx="11" fill="${t.surface}" stroke="${t.accent}" stroke-width="1.4"/>
<text x="${answer.x}" y="${Y - 3}" text-anchor="middle" font-family="${SANS}" font-size="15" font-weight="650" fill="${t.text}">grounded answer</text>
<text x="${answer.x}" y="${Y + 16}" text-anchor="middle" font-family="${MONO}" font-size="11.5">${cites}</text>`;

  const router = nodes.router;
  const ring = `<circle cx="${router.x}" cy="${Y}" r="44" fill="none" stroke="${t.accent}" stroke-opacity="0.35" stroke-dasharray="4 10"><animateTransform attributeName="transform" type="rotate" from="0 ${router.x} ${Y}" to="360 ${router.x} ${Y}" dur="14s" repeatCount="indefinite"/></circle>`;

  // Eval harness: everything above is only "done" when it beats the baseline here.
  const ev = { x: 40, y: 340, w: 1120, h: 62 };
  const metrics = config.evals;
  const chipW = 168;
  const chips = metrics
    .map((m, i) => {
      const x = ev.x + 236 + i * (chipW + 10);
      return `<g><rect x="${x}" y="${ev.y + 13}" width="${chipW}" height="36" rx="8" fill="${t.surface2}" stroke="${t.border}"/>
<text x="${x + 12}" y="${ev.y + 36}" font-family="${MONO}" font-size="12" fill="${t.muted}">${esc(m.label)} <tspan fill="${t.green}" font-weight="700">${esc(m.value)}</tspan></text></g>`;
    })
    .join("");
  const evalBox = `<rect x="${ev.x}" y="${ev.y}" width="${ev.w}" height="${ev.h}" rx="12" fill="${t.surface}" stroke="${t.green}" stroke-opacity="0.6" stroke-dasharray="6 5"/>
<text x="${ev.x + 20}" y="${ev.y + 28}" font-family="${SANS}" font-size="15" font-weight="650" fill="${t.text}">eval harness</text>
<text x="${ev.x + 20}" y="${ev.y + 46}" font-family="${MONO}" font-size="11" fill="${t.muted}">held-out set · baseline to beat</text>
${chips}
<path d="M ${answer.x} ${Y + 32} V ${ev.y}" stroke="${t.green}" stroke-opacity="0.6" stroke-dasharray="4 4" marker-end="url(#arrow-g)"><animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite"/></path>
<path d="M ${router.x} ${ev.y} V ${Y + 32}" stroke="${t.green}" stroke-opacity="0.6" stroke-dasharray="4 4" marker-end="url(#arrow-g)"><animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite"/></path>
<text x="${router.x + 10}" y="${ev.y - 12}" font-family="${MONO}" font-size="10.5" fill="${t.green}">re-score on every change</text>`;

  const defs = `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${t.faint}"/></marker>
<marker id="arrow-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${t.green}"/></marker>`;

  const body = `<rect width="${W}" height="${H}" rx="18" fill="${t.bg}" stroke="${t.border}"/>
<text x="40" y="40" font-family="${MONO}" font-size="12.5" fill="${t.muted}"><tspan fill="${t.accent}">$</tspan> trace --request "how much protein does a 600 kg steer need?"</text>
<text x="${W - 40}" y="40" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="${t.faint}">3 requests in flight · routed independently</text>
${straight}${edges.join("")}
${pulses.join("")}
${packets.join("")}
${ring}
${node({ ...nodes.query, t })}
${node({ ...router, t, accent: t.accent })}
${branchNodes}
${node({ ...nodes.rerank, t })}
${node({ ...nodes.llm, t })}
${answerNode}
${evalBox}`;

  return frame({
    width: W,
    height: H,
    title: "How I build retrieval systems",
    desc: "Animated trace of a RAG request: an agentic router sends each query to a knowledge graph, BM25, or FAISS retriever, then results are reranked with citations, answered by a LoRA fine-tuned LLM, and checked by an eval harness.",
    defs,
    body
  });
}
