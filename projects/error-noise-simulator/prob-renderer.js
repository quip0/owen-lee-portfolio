/**
 * prob-renderer.js
 * ASCII block-character probability bars rendered into a <pre> element.
 */

const BAR_WIDTH = 20; // character width of each bar
const FULL = "\u2588";  // █
const MED  = "\u2593";  // ▓
const LIGHT = "\u2591"; // ░

/**
 * Render probability bars as ASCII art into a <pre> element.
 * @param {HTMLElement} container - [data-prob-display] <pre> element
 * @param {number[]} probabilities
 */
export function drawProbBars(container, probabilities) {
  const n = probabilities.length;
  const lines = [];

  for (let i = 0; i < n; i++) {
    const prob = probabilities[i];
    const label = `|${i.toString(2).padStart(Math.ceil(Math.log2(n || 2)), "0")}>`;
    const filled = Math.round(prob * BAR_WIDTH);
    const empty = BAR_WIDTH - filled;

    const bar = FULL.repeat(filled) + LIGHT.repeat(empty);
    const pct = (prob * 100).toFixed(1).padStart(5);

    lines.push(`  ${label.padEnd(5)} ${bar} ${pct}%`);
  }

  container.textContent = lines.join("\n");
}
