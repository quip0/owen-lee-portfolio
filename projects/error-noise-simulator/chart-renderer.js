/**
 * chart-renderer.js
 * SVG line chart — terminal aesthetic with dotted grid and monospace labels.
 */

const NS = "http://www.w3.org/2000/svg";
const MONO = "'JetBrains Mono', monospace";

const COLORS = {
  fidelity: "#f4a261",
  purity: "#8ecae6",
  entropy: "#e9c46a",
};

const PAD = { top: 12, right: 12, bottom: 22, left: 34 };

export function drawMetricsChart(svg, sweepData, currentParam) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const vb = svg.viewBox.baseVal;
  const W = vb.width;
  const H = vb.height;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const params = sweepData.param_values;
  const n = params.length;
  const maxEntropy = Math.max(...sweepData.entropies, 1);

  const xOf = (i) => PAD.left + (i / (n - 1)) * plotW;
  const yOf = (val, max = 1) => PAD.top + (1 - val / max) * plotH;

  // ── Dotted grid ──
  for (let v = 0; v <= 1; v += 0.25) {
    const y = yOf(v);
    // Dotted horizontal line
    const line = mkLine(PAD.left, y, PAD.left + plotW, y, "rgba(240,239,234,0.07)");
    line.setAttribute("stroke-dasharray", "1,4");
    svg.appendChild(line);

    const label = mkText(PAD.left - 6, y + 3.5, v.toFixed(1), "rgba(240,239,234,0.25)", "end");
    svg.appendChild(label);
  }

  for (let v = 0; v <= 1; v += 0.25) {
    const x = PAD.left + v * plotW;
    // Dotted vertical line
    const line = mkLine(x, PAD.top, x, PAD.top + plotH, "rgba(240,239,234,0.05)");
    line.setAttribute("stroke-dasharray", "1,4");
    svg.appendChild(line);

    const label = mkText(x, H - 5, v.toFixed(1), "rgba(240,239,234,0.25)", "middle");
    svg.appendChild(label);
  }

  // ── Data lines (dashed, terminal-style) ──
  const datasets = [
    { key: "fidelities", color: COLORS.fidelity, max: 1, dash: "4,2" },
    { key: "purities", color: COLORS.purity, max: 1, dash: "2,2" },
    { key: "entropies", color: COLORS.entropy, max: maxEntropy, dash: "6,3" },
  ];

  for (const { key, color, max, dash } of datasets) {
    const data = sweepData[key];
    let d = "";
    for (let i = 0; i < n; i++) {
      const x = xOf(i);
      const y = yOf(data[i], max);
      d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }

    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "1.2");
    path.setAttribute("stroke-dasharray", dash);
    path.setAttribute("stroke-linecap", "butt");
    svg.appendChild(path);
  }

  // ── Current parameter indicator ──
  const ix = PAD.left + currentParam * plotW;
  const indicator = mkLine(ix, PAD.top, ix, PAD.top + plotH, "rgba(240,239,234,0.35)");
  indicator.setAttribute("stroke-dasharray", "2,2");
  svg.appendChild(indicator);

  // Small label at top of indicator
  const paramLabel = mkText(ix, PAD.top - 3, currentParam.toFixed(2), "rgba(240,239,234,0.4)", "middle");
  paramLabel.setAttribute("font-size", "7");
  svg.appendChild(paramLabel);
}

function mkLine(x1, y1, x2, y2, stroke) {
  const l = document.createElementNS(NS, "line");
  l.setAttribute("x1", x1);  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);  l.setAttribute("y2", y2);
  l.setAttribute("stroke", stroke);
  l.setAttribute("stroke-width", "1");
  return l;
}

function mkText(x, y, text, fill, anchor) {
  const t = document.createElementNS(NS, "text");
  t.setAttribute("x", x);  t.setAttribute("y", y);
  t.setAttribute("fill", fill);
  t.setAttribute("text-anchor", anchor);
  t.setAttribute("font-family", MONO);
  t.setAttribute("font-size", "8");
  t.textContent = text;
  return t;
}
