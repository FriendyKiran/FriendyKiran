// Colors mirror kiranbabuathina.com so the profile and portfolio feel like one product.
export const themes = {
  dark: {
    name: "dark",
    bg: "#070b14",
    surface: "#101828",
    surface2: "#151f33",
    border: "#1e2a40",
    text: "#e6edf6",
    muted: "#94a3b8",
    faint: "#475569",
    accent: "#00d4ff",
    violet: "#a78bfa",
    green: "#34d399",
    amber: "#fbbf24",
    rose: "#fb7185",
    glow: 0.35
  },
  light: {
    name: "light",
    bg: "#f7fafc",
    surface: "#ffffff",
    surface2: "#f1f5f9",
    border: "#d8e1eb",
    text: "#0f172a",
    muted: "#475569",
    faint: "#94a3b8",
    accent: "#0079a3",
    violet: "#6d28d9",
    green: "#047857",
    amber: "#b45309",
    rose: "#be123c",
    glow: 0.18
  }
};

export const SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'JetBrains Mono', 'SF Mono', Consolas, 'Liberation Mono', 'Courier New', monospace";

export function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Deterministic PRNG so regenerating with the same inputs gives byte-identical SVGs.
export function rng(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(random) {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

export function wrap(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export const n = (value) => Number(value.toFixed(1));

export function frame({ width, height, title, desc, body, style = "", defs = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<defs>${defs}<style>${style}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style></defs>
${body}
</svg>
`;
}
