/**
 * main.js — Error & Noise Simulator
 * Terminal-style UI wiring.
 */

import { initPyodide, evaluate, sweep } from "./pyodide-loader.js";
import { drawBloch } from "./bloch-renderer.js";
import { drawMetricsChart } from "./chart-renderer.js";
import { drawProbBars } from "./prob-renderer.js";
import { renderDensityMatrix, renderKrausOperators } from "./matrix-display.js";

// ── DOM refs ─────────────────────────────────────────────────

const bootOverlay = document.querySelector("[data-loading-overlay]");
const bootLog = document.querySelector("[data-boot-log]");

const channelButtons = document.querySelectorAll("[data-channel]");
const stateButtons = document.querySelectorAll("[data-state]");
const paramSlider = document.querySelector("[data-param-slider]");
const paramLabel = document.querySelector("[data-param-label]");
const paramValue = document.querySelector("[data-param-value]");
const sliderAscii = document.querySelector("[data-slider-ascii]");
const statusLine = document.querySelector("[data-status-line]");

const densityMatrixEl = document.querySelector("[data-density-matrix]");
const krausDisplayEl = document.querySelector("[data-kraus-display]");

const blochCanvas = document.querySelector("[data-bloch-canvas]");
const metricsSvg = document.querySelector("[data-metrics-svg]");
const probDisplay = document.querySelector("[data-prob-display]");

// ── State ────────────────────────────────────────────────────

let currentChannel = "bit-flip";
let currentState = "0";
let currentParam = 0;
let sweepCache = null;
let ready = false;

// ── Boot sequence ────────────────────────────────────────────

const BOOT_LINES = [
  "qnoise v0.1.0",
  "copyright (c) 2026 owen lee",
  "",
  "POST... ok",
  "checking memory... 64K RAM SYSTEM  38911 BYTES FREE",
  "",
  "loading pyodide runtime...",
];

async function boot() {
  // Type out boot lines
  for (const line of BOOT_LINES) {
    await typeLine(line);
  }

  await loadScript("https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js");
  await appendLog("  [OK]");

  await typeLine("loading numpy...");
  await initPyodide((stage, progress) => {
    // Update the last line in the log
    const pct = Math.round(progress * 100);
    statusLine.textContent = `${stage} ${pct}%`;
  });
  await appendLog("  [OK]");

  await typeLine("initializing noise channels...");
  await sleep(120);
  await appendLog("  [OK]");

  await typeLine("");
  await typeLine("READY.");
  await sleep(400);

  ready = true;
  statusLine.textContent = "READY";

  runSweep();
  updatePoint();

  bootOverlay.classList.add("is-hidden");
}

function typeLine(text) {
  return new Promise((resolve) => {
    bootLog.textContent += text + "\n";
    bootLog.scrollTop = bootLog.scrollHeight;
    setTimeout(resolve, 60 + Math.random() * 80);
  });
}

function appendLog(text) {
  return new Promise((resolve) => {
    // Append to last line
    const lines = bootLog.textContent.split("\n");
    lines[lines.length - 2] += text;
    bootLog.textContent = lines.join("\n");
    setTimeout(resolve, 40);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── ASCII slider bar ─────────────────────────────────────────

function updateSliderAscii(val) {
  const total = 20;
  const filled = Math.round(val * total);
  const bar = "=".repeat(filled) + " ".repeat(total - filled);
  sliderAscii.textContent = `[${bar}]`;
}

// ── Computation ──────────────────────────────────────────────

function runSweep() {
  if (!ready) return;
  sweepCache = sweep(currentChannel, currentState);
  drawMetricsChart(metricsSvg, sweepCache, currentParam);
}

function updatePoint() {
  if (!ready) return;
  const result = evaluate(currentChannel, currentParam, currentState);

  renderDensityMatrix(densityMatrixEl, result.density_matrix);
  renderKrausOperators(krausDisplayEl, result.kraus_operators);
  drawBloch(blochCanvas, result.bloch_vector, result.purity);
  drawProbBars(probDisplay, result.probabilities);

  if (sweepCache) {
    drawMetricsChart(metricsSvg, sweepCache, currentParam);
  }

  paramValue.textContent = currentParam.toFixed(2);
  updateSliderAscii(currentParam);

  // Update status line with current metrics
  statusLine.textContent =
    `F=${result.fidelity.toFixed(3)} P=${result.purity.toFixed(3)} S=${result.entropy.toFixed(3)}`;
}

// ── Event listeners ──────────────────────────────────────────

channelButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    channelButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    currentChannel = btn.dataset.channel;
    paramLabel.textContent = currentChannel === "amplitude-damping" ? "\u03B3" : "p";
    runSweep();
    updatePoint();
  });
});

stateButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    stateButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    currentState = btn.dataset.state;
    runSweep();
    updatePoint();
  });
});

let rafId = null;
paramSlider.addEventListener("input", () => {
  currentParam = parseFloat(paramSlider.value);
  paramValue.textContent = currentParam.toFixed(2);
  updateSliderAscii(currentParam);

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    updatePoint();
    rafId = null;
  });
});

window.addEventListener("resize", () => {
  if (ready) {
    const result = evaluate(currentChannel, currentParam, currentState);
    drawBloch(blochCanvas, result.bloch_vector, result.purity);
  }
});

// ── Boot ─────────────────────────────────────────────────────

boot().catch((err) => {
  console.error("Failed to initialize:", err);
  typeLine(`ERR: ${err.message}`);
  typeLine("SYSTEM HALTED. Refresh to retry.");
});
