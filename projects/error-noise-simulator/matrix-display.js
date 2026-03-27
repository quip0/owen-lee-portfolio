/**
 * matrix-display.js
 * Renders density matrix and Kraus operators as monospace ASCII text.
 */

function fmtComplex(pair, width = 12) {
  const [re, im] = pair;
  const rr = Math.abs(re) < 1e-6 ? 0 : re;
  const ii = Math.abs(im) < 1e-6 ? 0 : im;

  let s;
  if (ii === 0) {
    s = rr.toFixed(4);
  } else if (rr === 0) {
    s = `${ii.toFixed(4)}i`;
  } else {
    const sign = ii >= 0 ? "+" : "-";
    s = `${rr.toFixed(3)}${sign}${Math.abs(ii).toFixed(3)}i`;
  }
  return s.padStart(width);
}

/**
 * Render density matrix as ASCII table.
 * @param {HTMLElement} container - <pre> element
 * @param {Array<Array<[number,number]>>} matrix
 */
export function renderDensityMatrix(container, matrix) {
  const dim = matrix.length;
  const cellW = 12;
  const innerW = dim * cellW + (dim - 1);
  const lines = [];

  // Top border
  lines.push("  \u250C" + "\u2500".repeat(innerW + 2) + "\u2510");

  for (let i = 0; i < dim; i++) {
    const cells = matrix[i].map((c) => fmtComplex(c, cellW)).join(" ");
    lines.push("  \u2502 " + cells + " \u2502");
  }

  // Bottom border
  lines.push("  \u2514" + "\u2500".repeat(innerW + 2) + "\u2518");

  container.textContent = lines.join("\n");
}

/**
 * Render Kraus operators as ASCII matrices.
 * @param {HTMLElement} container - <pre> element
 * @param {Array<{label: string, matrix: Array<Array<[number,number]>>}>} operators
 */
export function renderKrausOperators(container, operators) {
  const blocks = [];

  for (const op of operators) {
    const dim = op.matrix.length;
    const cellW = 10;
    const innerW = dim * cellW + (dim - 1);

    blocks.push(`  ${op.label}:`);
    blocks.push("    \u250C" + "\u2500".repeat(innerW + 2) + "\u2510");

    for (let i = 0; i < dim; i++) {
      const cells = op.matrix[i].map((c) => fmtComplex(c, cellW)).join(" ");
      blocks.push("    \u2502 " + cells + " \u2502");
    }

    blocks.push("    \u2514" + "\u2500".repeat(innerW + 2) + "\u2518");
  }

  container.textContent = blocks.join("\n");
}
