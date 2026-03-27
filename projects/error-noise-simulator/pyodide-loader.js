/**
 * pyodide-loader.js
 * Handles Pyodide initialization, SDK filesystem setup, and Python bridge.
 */

import { SDK_FILES, BRIDGE_SCRIPT } from "./python-sdk.js";

let pyodide = null;
let evalFn = null;
let sweepFn = null;

/**
 * Initialize Pyodide, load numpy, install the SDK, and set up the bridge.
 * @param {function} onStage - callback(stageName, progress 0–1)
 * @returns {Promise<void>}
 */
export async function initPyodide(onStage) {
  onStage("Loading Pyodide runtime\u2026", 0.1);

  /* global loadPyodide */
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/",
  });

  onStage("Loading numpy\u2026", 0.4);
  await pyodide.loadPackage("numpy");

  onStage("Installing qnoise SDK\u2026", 0.7);

  // Create package directory
  pyodide.FS.mkdirTree("/home/pyodide/qnoise");

  // Write each module file
  for (const [filename, source] of Object.entries(SDK_FILES)) {
    pyodide.FS.writeFile(`/home/pyodide/qnoise/${filename}`, source);
  }

  // Add to Python path
  pyodide.runPython(`
import sys
if "/home/pyodide" not in sys.path:
    sys.path.insert(0, "/home/pyodide")
`);

  onStage("Initializing bridge\u2026", 0.9);
  pyodide.runPython(BRIDGE_SCRIPT);

  // Grab references to the bridge functions
  evalFn = pyodide.globals.get("evaluate");
  sweepFn = pyodide.globals.get("sweep");

  onStage("Ready", 1.0);
}

/**
 * Evaluate a single point: apply a noise channel at a given parameter value.
 * @param {string} channelName - e.g. "bit-flip"
 * @param {number} param - parameter value (0–1)
 * @param {string} stateLabel - e.g. "0", "1", "+", "-"
 * @returns {object}
 */
export function evaluate(channelName, param, stateLabel) {
  const json = evalFn(channelName, param, stateLabel);
  return JSON.parse(json);
}

/**
 * Run a full parameter sweep (0 to 1).
 * @param {string} channelName
 * @param {string} stateLabel
 * @param {number} [nPoints=101]
 * @returns {object}
 */
export function sweep(channelName, stateLabel, nPoints = 101) {
  const json = sweepFn(channelName, stateLabel, nPoints);
  return JSON.parse(json);
}
