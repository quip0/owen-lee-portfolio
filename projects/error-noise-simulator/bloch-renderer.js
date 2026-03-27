/**
 * bloch-renderer.js
 * Canvas 2D Bloch sphere — terminal / ASCII aesthetic.
 * Draws wireframe with dots instead of smooth lines.
 */

const TAU = Math.PI * 2;
const SPHERE_RADIUS = 0.36;

export function drawBloch(canvas, blochVector, purity) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h / 2;
  const r = w * SPHERE_RADIUS;

  ctx.clearRect(0, 0, w, h);

  const MONO = "11px 'JetBrains Mono', monospace";
  const DOT_COLOR = "rgba(240, 239, 234, 0.15)";
  const AXIS_COLOR = "rgba(240, 239, 234, 0.10)";

  // ── Draw sphere wireframe with dots ──
  ctx.fillStyle = DOT_COLOR;

  // Equator (XY plane)
  const dotCount = 48;
  for (let i = 0; i < dotCount; i++) {
    const a = (i / dotCount) * TAU;
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r * 0.35;
    ctx.fillRect(cx + dx - 0.5, cy + dy - 0.5, 1.5, 1.5);
  }

  // XZ great circle (vertical, thin)
  for (let i = 0; i < dotCount; i++) {
    const a = (i / dotCount) * TAU;
    const dx = Math.cos(a) * r * 0.35;
    const dy = Math.sin(a) * r;
    ctx.fillRect(cx + dx - 0.5, cy - dy - 0.5, 1.5, 1.5);
  }

  // YZ great circle (vertical, full)
  for (let i = 0; i < dotCount; i++) {
    const a = (i / dotCount) * TAU;
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r;
    ctx.fillRect(cx + dx - 0.5, cy - dy - 0.5, 1.5, 1.5);
  }

  // ── Axis lines (dotted) ──
  ctx.fillStyle = AXIS_COLOR;
  const axDots = 32;

  // Z axis
  for (let i = 0; i <= axDots; i++) {
    const y = cy - r - 8 + (i / axDots) * (2 * r + 16);
    if (i % 2 === 0) ctx.fillRect(cx - 0.5, y, 1, 1.5);
  }

  // X axis (foreshortened)
  for (let i = 0; i <= axDots; i++) {
    const x = cx - r * 0.35 - 8 + (i / axDots) * (2 * r * 0.35 + 16);
    if (i % 2 === 0) ctx.fillRect(x, cy - 0.5, 1.5, 1);
  }

  // ── Axis labels ──
  ctx.font = MONO;
  ctx.fillStyle = "rgba(240, 239, 234, 0.30)";
  ctx.textAlign = "center";
  ctx.fillText("|0>", cx, cy - r - 14);
  ctx.fillText("|1>", cx, cy + r + 20);
  ctx.textAlign = "left";
  ctx.fillText("x", cx + r * 0.35 + 10, cy + 4);
  ctx.textAlign = "right";
  ctx.fillText("y", cx - r * 0.35 - 10, cy + 4);

  // ── Center crosshair ──
  ctx.fillStyle = "rgba(240, 239, 234, 0.15)";
  ctx.fillRect(cx - 3, cy, 7, 1);
  ctx.fillRect(cx, cy - 3, 1, 7);

  // ── State vector ──
  if (blochVector) {
    const [bx, by, bz] = blochVector;
    const projX = cx + (bx * 0.35 - by * 0.35) * r;
    const projY = cy - bz * r;

    // Dashed line from center to tip using dots
    const steps = 24;
    const alpha = 0.35 + purity * 0.65;
    const color = purity > 0.5
      ? `rgba(244, 162, 97, ${alpha})`
      : `rgba(142, 202, 230, ${alpha})`;

    ctx.fillStyle = color;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = cx + (projX - cx) * t;
      const py = cy + (projY - cy) * t;
      if (i % 2 === 0) {
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    }

    // Tip marker — a small + sign
    ctx.fillRect(projX - 4, projY, 9, 1.5);
    ctx.fillRect(projX, projY - 4, 1.5, 9);

    // Tip label
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `(${bx.toFixed(2)}, ${by.toFixed(2)}, ${bz.toFixed(2)})`,
      projX + 8,
      projY - 6
    );
  }
}
